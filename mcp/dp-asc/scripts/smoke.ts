#!/usr/bin/env bun
/**
 * Offline smoke test: generate → catalog → meta-tools → server boot → optional live call.
 *
 * Live call only if ASC_ISSUER_ID + ASC_KEY_ID + ASC_PRIVATE_KEY_PATH are set.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { GeneratedTool } from "../src/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function runGenerate(): Promise<void> {
  const proc = Bun.spawn(["bun", "run", "scripts/generate-tools.ts"], {
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  assert(code === 0, `generate failed: exit ${code}`);
}

async function mcpBootCheck(): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", "src/index.ts"], {
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let err = "";
    child.stderr.on("data", (d) => {
      err += d.toString();
    });

    const bootTimer = setTimeout(() => {
      child.kill();
      if (err.includes("ready") || err.includes("meta-tools")) {
        resolve(err);
      } else {
        reject(
          new Error(
            `server boot timeout. stderr=${err.slice(0, 500)}`,
          ),
        );
      }
    }, 5000);

    child.on("error", reject);
    child.stderr.once("data", () => {
      setTimeout(() => {
        clearTimeout(bootTimer);
        child.kill();
        resolve(err);
      }, 200);
    });
  });
}

async function liveAppsList(): Promise<void> {
  const { ascRequest } = await import("../src/client.js");
  const res = await ascRequest({
    method: "GET",
    path: "/v1/apps",
    query: { limit: 5 },
  });
  console.log("live GET /v1/apps status", res.status);
  if (res.status >= 400) {
    console.log(JSON.stringify(res.body, null, 2).slice(0, 800));
    throw new Error(`live call failed: ${res.status}`);
  }
  const data = res.body as { data?: unknown[] };
  console.log(
    "apps returned",
    Array.isArray(data?.data) ? data.data.length : "(no data array)",
  );
}

async function main() {
  console.log("== generate ==");
  await runGenerate();

  const toolsPath = join(ROOT, "generated", "tools.json");
  const manifestPath = join(ROOT, "generated", "manifest.json");
  assert(existsSync(toolsPath), "tools.json missing");
  assert(existsSync(manifestPath), "manifest.json missing");

  const tools = JSON.parse(readFileSync(toolsPath, "utf8")) as GeneratedTool[];
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    toolCount: number;
    apiVersion: string;
  };

  console.log("== inventory ==");
  console.log({
    toolCount: tools.length,
    manifestCount: manifest.toolCount,
    apiVersion: manifest.apiVersion,
  });
  assert(tools.length === manifest.toolCount, "manifest/tool count mismatch");
  assert(tools.length >= 1000, `expected ~1263 tools, got ${tools.length}`);

  const names = new Set(tools.map((t) => t.name));
  assert(names.size === tools.length, "duplicate tool names");
  for (const t of tools) {
    assert(t.name.length <= 64, `name too long: ${t.name}`);
    assert(t.method && t.path, `missing method/path: ${t.operationId}`);
    assert(t.inputSchema?.type === "object", `bad schema: ${t.name}`);
  }

  const mustInclude = [
    "apps_getCollection",
    "apps_getInstance",
    "apps_appStoreVersions_getToManyRelated",
    "apps_inAppPurchasesV2_getToManyRelated",
    "apps_subscriptionGroups_getToManyRelated",
    "builds_getCollection",
    "betaGroups_getCollection",
    "financeReports_getCollection",
    "salesReports_getCollection",
    "reviewSubmissions_getCollection",
    "reviewSubmissions_createInstance",
    "subscriptionGroups_getInstance",
    "subscriptions_createInstance",
    "appStoreVersions_getInstance",
    "bundleIds_getCollection",
    "users_getCollection",
    "devices_getCollection",
    "profiles_getCollection",
    "certificates_getCollection",
    "analyticsReportRequests_createInstance",
    "gameCenterDetails_getInstance",
  ];
  const opIds = new Set(tools.map((t) => t.operationId));
  for (const id of mustInclude) {
    assert(opIds.has(id), `missing expected operationId: ${id}`);
  }

  console.log("== catalog meta-router ==");
  const {
    catalogSize,
    listTags,
    resolveTool,
    searchCatalog,
    toOperationSchema,
  } = await import("../src/catalog.ts");

  assert(catalogSize() === tools.length, "catalog size mismatch");

  const appsSearch = searchCatalog({ query: "list apps", limit: 10 });
  assert(appsSearch.returned > 0, "search 'list apps' returned 0");
  assert(
    appsSearch.hits.some((h) => h.operationId === "apps_getCollection"),
    "search 'list apps' should rank apps_getCollection",
  );
  console.log(
    "search list apps top:",
    appsSearch.hits.slice(0, 3).map((h) => h.operationId),
  );

  const buildsGet = searchCatalog({
    query: "builds",
    method: "GET",
    limit: 10,
  });
  assert(
    buildsGet.hits.every((h) => h.method === "GET"),
    "method filter failed",
  );
  assert(
    buildsGet.hits.some((h) => h.operationId === "builds_getCollection"),
    "builds GET should include builds_getCollection",
  );

  const tagOnly = searchCatalog({ query: "", tag: "Apps", limit: 5 });
  assert(tagOnly.returned > 0, "tag-only search failed");
  assert(
    tagOnly.hits.every((h) => h.tags.includes("Apps")),
    "tag filter failed",
  );

  const tags = listTags();
  assert(tags.length >= 50, `expected many tags, got ${tags.length}`);
  assert(
    tags.some((t) => t.tag === "Apps" && t.count > 0),
    "Apps tag missing",
  );

  const resolved = resolveTool("apps_getCollection");
  assert(resolved, "resolveTool apps_getCollection");
  assert(
    resolveTool(resolved!.name)?.operationId === "apps_getCollection",
    "resolve by name failed",
  );

  const schema = toOperationSchema(resolved!);
  assert(schema.inputSchema?.type === "object", "schema missing");
  assert(schema.callHint.operation === "apps_getCollection", "callHint");
  assert(schema.method === "GET", "schema method");

  // dry-run path through index helper behavior via client format only
  const { formatToolResult } = await import("../src/client.js");
  const fake = formatToolResult({
    status: 200,
    headers: {},
    body: { ok: true },
    contentType: "application/json",
  });
  assert(!fake.isError && fake.text.includes("ok"), "formatToolResult failed");

  // Simulated asc_call dry-run using catalog + path fill (no network)
  const sample = resolveTool("apps_getInstance");
  assert(sample, "apps_getInstance");
  assert(sample!.pathParams.includes("id"), "apps_getInstance needs id");

  console.log("== server boot ==");
  const bootLog = await mcpBootCheck();
  assert(
    bootLog.includes("meta-tools") || bootLog.includes("ready"),
    `unexpected boot log: ${bootLog.slice(0, 300)}`,
  );
  console.log("server ready line:", bootLog.trim().split("\n").pop());

  const hasLive =
    (process.env.ASC_ISSUER_ID || process.env.APP_STORE_CONNECT_ISSUER_ID) &&
    (process.env.ASC_KEY_ID || process.env.APP_STORE_CONNECT_KEY_ID) &&
    (process.env.ASC_PRIVATE_KEY_PATH ||
      process.env.APP_STORE_CONNECT_PRIVATE_KEY_PATH ||
      process.env.ASC_PRIVATE_KEY ||
      process.env.APP_STORE_CONNECT_PRIVATE_KEY);

  if (hasLive) {
    console.log("== live GET /v1/apps ==");
    await liveAppsList();

    // live via catalog-resolved operation
    const { ascRequest } = await import("../src/client.js");
    const op = resolveTool("apps_getCollection");
    assert(op, "apps_getCollection for live");
    const res = await ascRequest({
      method: op!.method,
      path: op!.path,
      query: { limit: 3 },
    });
    assert(res.status < 400, `meta-style live call status ${res.status}`);
    console.log("meta-style live call ok", res.status);
  } else {
    console.log(
      "== live skipped (set ASC_ISSUER_ID, ASC_KEY_ID, ASC_PRIVATE_KEY_PATH to enable) ==",
    );
  }

  console.log("\nSMOKE OK", {
    tools: tools.length,
    metaTools: ["asc_search", "asc_schema", "asc_call", "asc_tags"],
    apiVersion: manifest.apiVersion,
    live: !!hasLive,
  });
}

main().catch((e) => {
  console.error("SMOKE FAILED", e);
  process.exit(1);
});
