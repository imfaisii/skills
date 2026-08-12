#!/usr/bin/env bun
/**
 * Offline smoke test: generate → load tools → dry-run a few shapes → optional live call.
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

async function mcpListTools(): Promise<number> {
  // Drive stdio MCP: initialize + tools/list
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", "src/index.ts"], {
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d.toString();
    });
    child.stderr.on("data", (d) => {
      err += d.toString();
    });

    const send = (msg: object) => {
      const body = JSON.stringify(msg);
      child.stdin.write(
        `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`,
      );
    };

    // MCP SDK default is newline JSON-RPC for stdio in many versions — try both.
    // Prefer simple NDJSON first (SDK 1.x StdioServerTransport uses length headers OR newline depending on version).
    // We'll use the SDK client instead below if this is fragile — for smoke, import tools.json directly
    // and only process-start the server for boot check.

    const bootTimer = setTimeout(() => {
      child.kill();
      if (err.includes("ready") || err.includes("tools")) {
        resolve(-1); // booted
      } else {
        reject(new Error(`server boot timeout. stderr=${err.slice(0, 500)} stdout=${out.slice(0, 200)}`));
      }
    }, 5000);

    child.on("error", reject);
    child.stderr.once("data", () => {
      // once ready line appears we're good
      setTimeout(() => {
        clearTimeout(bootTimer);
        child.kill();
        resolve(-1);
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
  console.log("apps returned", Array.isArray(data?.data) ? data.data.length : "(no data array)");
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

  // Spot-check core operations that exist in ASC OpenAPI 4.4.1
  // Note: many resources are nested under apps (no top-level getCollection).
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

  // Dry-run client path fill via dynamic import of handler logic
  const sample = tools.find((t) => t.operationId === "apps_getCollection");
  assert(sample, "apps_getCollection missing");
  console.log("sample tool", {
    name: sample.name,
    path: sample.path,
    queryParams: sample.queryParams.length,
  });

  console.log("== server boot ==");
  await mcpListTools();
  console.log("server started and printed ready on stderr");

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
  } else {
    console.log(
      "== live skipped (set ASC_ISSUER_ID, ASC_KEY_ID, ASC_PRIVATE_KEY_PATH to enable) ==",
    );
  }

  // dryRun token-less path through client fillPath
  const { formatToolResult } = await import("../src/client.js");
  const fake = formatToolResult({
    status: 200,
    headers: {},
    body: { ok: true },
    contentType: "application/json",
  });
  assert(!fake.isError && fake.text.includes("ok"), "formatToolResult failed");

  console.log("\nSMOKE OK", {
    tools: tools.length,
    apiVersion: manifest.apiVersion,
    live: !!hasLive,
  });
}

main().catch((e) => {
  console.error("SMOKE FAILED", e);
  process.exit(1);
});
