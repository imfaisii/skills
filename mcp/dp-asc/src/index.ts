#!/usr/bin/env bun
/**
 * dp-asc — App Store Connect MCP server
 *
 * Exposes every operation from Apple's App Store Connect OpenAPI as an MCP tool.
 * Auth: JWT from ASC_ISSUER_ID + ASC_KEY_ID + ASC_PRIVATE_KEY_PATH (.p8)
 * Credentials come from the environment only — nothing is bundled in this package.
 *
 * Transport: stdio (Claude Code / Claude Desktop)
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ascRequest, formatToolResult } from "./client.js";
import type { GeneratedTool } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadTools(): GeneratedTool[] {
  const p = join(ROOT, "generated", "tools.json");
  return JSON.parse(readFileSync(p, "utf8")) as GeneratedTool[];
}

const tools = loadTools();
const byName = new Map(tools.map((t) => [t.name, t]));

const server = new Server(
  {
    name: "dp-asc",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments || {}) as Record<string, unknown>;
  const tool = byName.get(name);

  if (!tool) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: `Unknown tool: ${name}`,
            hint: `This server exposes ${tools.length} ASC tools generated from OpenAPI.`,
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    const pathParams: Record<string, string> = {};
    for (const p of tool.pathParams) {
      if (args[p] !== undefined && args[p] !== null) {
        pathParams[p] = String(args[p]);
      }
    }

    const query: Record<string, unknown> = {};
    for (const q of tool.queryParams) {
      if (args[q] !== undefined) query[q] = args[q];
    }

    const body = tool.hasBody ? args.body : undefined;
    const dryRun = args._dryRun === true;

    if (dryRun) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                dryRun: true,
                operationId: tool.operationId,
                method: tool.method,
                path: tool.path,
                pathParams,
                query,
                body: body ?? null,
                accept: tool.accept || "application/json",
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    const res = await ascRequest({
      method: tool.method,
      path: tool.path,
      pathParams,
      query,
      body,
      accept: tool.accept,
    });

    const { text, isError } = formatToolResult(res);
    return {
      content: [{ type: "text", text }],
      isError,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: message,
            operationId: tool.operationId,
            method: tool.method,
            path: tool.path,
          }),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr only — stdout is MCP
  console.error(`dp-asc ready: ${tools.length} tools (ASC OpenAPI)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
