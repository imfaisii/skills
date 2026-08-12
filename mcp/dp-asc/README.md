# App Store Connect MCP (`dp-asc`)

Open-source **Model Context Protocol** server for the **full App Store Connect API**.

The catalog is **generated from Apple’s official OpenAPI specification** — not a hand-maintained subset — so coverage tracks Apple’s published surface. The **LLM-facing surface is 4 meta-tools**, so sessions do not pay ~hundreds of thousands of tokens to list 1,200+ schemas.

| | |
| --- | --- |
| Spec in tree | `openapi/app-store-connect.openapi.json` |
| API | App Store Connect API **4.4.1** (OpenAPI 3.0.1) |
| Catalog | **1263** operations (one per path + method) |
| MCP tools (default) | **4** meta-tools: `asc_search`, `asc_schema`, `asc_call`, `asc_tags` |
| Paths | **966** |
| Resource tags | **195** |
| Auth | ES256 JWT (`iss` + `kid` + `.p8`) → `https://api.appstoreconnect.apple.com` |
| Runtime | [Bun](https://bun.sh) + [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (stdio) |

> **No credentials are stored in this repository.** You supply your own App Store Connect API key at runtime.

## Why meta-tools (not 1263 MCP tools)

Registering every OpenAPI operation as its own MCP tool dumps full JSON Schemas into the model context (on the order of **hundreds of thousands of tokens**). That burns budget before any real work happens.

Default design:

1. Vendor Apple’s OpenAPI JSON under `openapi/`.
2. `bun run generate` → `generated/tools.json` + `generated/manifest.json` (full catalog, internal).
3. Expose **four** MCP tools that search / describe / call that catalog.

```text
asc_search  → find operations (name, method, path, tags; no full schemas)
asc_schema  → one operation’s input JSON Schema + call hint
asc_call    → execute operationId + args  (or _dryRun: true)
asc_tags    → resource tags + counts (narrow search)
```

Escape hatch for debugging only:

```bash
export ASC_EXPOSE_ALL_TOOLS=1   # also register every generated operation as its own tool
```

Prefer leaving this **unset** in Claude Code / Desktop.

## Why generated

Hand-written ASC MCPs miss endpoints and drift. This package keeps Apple’s zip as source of truth and regenerates the internal catalog; meta-tools always ride on top of that catalog.

## Requirements

- [Bun](https://bun.sh) 1.1+
- An [App Store Connect API key](https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api) (Issuer ID, Key ID, `.p8` private key file)

## Quick start

```bash
git clone https://github.com/imfaisii/skills.git
cd skills/mcp/dp-asc
bun install
bun run generate   # rebuild tools from OpenAPI (already checked in)
bun run smoke      # offline inventory + server boot check
```

### Credentials (local only)

Create a key in App Store Connect → **Users and Access → Integrations → App Store Connect API**.

```bash
export ASC_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export ASC_KEY_ID="XXXXXXXXXX"
export ASC_PRIVATE_KEY_PATH="$HOME/path/to/AuthKey_XXXXXXXXXX.p8"
```

Aliases also work: `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_PRIVATE_KEY_PATH`, or inline PEM via `ASC_PRIVATE_KEY` / `APP_STORE_CONNECT_PRIVATE_KEY`.

Optional:

| Variable | Purpose |
| --- | --- |
| `ASC_BASE_URL` | Default `https://api.appstoreconnect.apple.com` |
| `ASC_EXPOSE_ALL_TOOLS=1` | Register all 1263 operations as MCP tools (debug only; huge context cost) |

Live check (calls `GET /v1/apps`):

```bash
bun run scripts/live-check.ts
```

## Agent usage pattern

```text
1. asc_tags                         # optional orientation
2. asc_search { query: "list apps" }
3. asc_schema { operation: "apps_getCollection" }
4. asc_call   { operation: "apps_getCollection", args: { limit: 10 } }
   # or dry-run:
   asc_call   { operation: "apps_getCollection", _dryRun: true, args: { limit: 10 } }
```

`asc_call` accepts path/query fields either inside `args` or as top-level keys alongside `operation`. JSON:API writes use `body`.

## Add to Claude Code (global)

```bash
claude mcp add dp-asc \
  -s user \
  -t stdio \
  -e ASC_ISSUER_ID=your-issuer-uuid \
  -e ASC_KEY_ID=your-key-id \
  -e ASC_PRIVATE_KEY_PATH=$HOME/path/to/AuthKey_XXXXXXXXXX.p8 \
  -- bun run /ABS/PATH/to/skills/mcp/dp-asc/src/index.ts
```

Or merge `mcp.example.json` into your user / project MCP config (replace placeholders).

```bash
claude mcp get dp-asc
claude mcp list
```

After adding, **restart Claude Code** (or start a new session) so tools appear as `mcp__dp-asc__asc_search`, `…asc_schema`, `…asc_call`, `…asc_tags`.

## Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dp-asc": {
      "command": "bun",
      "args": ["run", "/ABS/PATH/to/skills/mcp/dp-asc/src/index.ts"],
      "env": {
        "ASC_ISSUER_ID": "your-issuer-uuid",
        "ASC_KEY_ID": "your-key-id",
        "ASC_PRIVATE_KEY_PATH": "/ABS/PATH/to/AuthKey_XXXXXXXXXX.p8"
      }
    }
  }
}
```

## Tool shape

### Meta-tools (default)

| Tool | Input | Output |
| --- | --- | --- |
| `asc_search` | `query`, optional `tag`, `method`, `limit` | Ranked hits: `operationId`, method, path, tags, param names |
| `asc_schema` | `operation` (operationId or name) | Full `inputSchema`, path/query lists, `callHint` |
| `asc_call` | `operation`, `args`, optional `_dryRun` | ASC HTTP response (JSON) or dry-run resolution |
| `asc_tags` | optional `limit` | Tags with operation counts |

### Internal catalog entry (generated)

- **Name**: OpenAPI `operationId` (truncated + short hash if longer than 64 characters).
- **Description**: summary + `METHOD path` + tag + operationId.
- **Input** (via `asc_schema` / `asc_call` args):
  - Path params as fields (`id`, …).
  - All query params (`filter[…]`, `include`, `fields[…]`, `limit`, `sort`, …).
  - `body` object for POST / PATCH / PUT (JSON:API document).
  - `_dryRun: true` → resolve method/path/query/body **without** calling Apple.

Binary reports (`financeReports`, `salesReports`, …) return:

```json
{
  "encoding": "base64",
  "contentType": "application/a-gzip",
  "byteLength": 12345,
  "data": "…",
  "note": "Binary download…"
}
```

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run generate` | Rebuild `generated/*` from OpenAPI |
| `bun run start` | stdio MCP server (Claude talks to this; it will “hang” in a raw terminal — that is normal) |
| `bun run smoke` | Generate + validate inventory + boot server; live `GET /v1/apps` if env creds are set |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run scripts/live-check.ts` | Live apps list (requires creds) |

## Refresh Apple’s OpenAPI

```bash
curl -fsSL -o /tmp/asc-openapi.zip \
  "https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip"
unzip -p /tmp/asc-openapi.zip '*.json' > openapi/app-store-connect.openapi.json
bun run generate
bun run smoke
```

## Coverage note

“Full surface” means **every operation in Apple’s published OpenAPI zip** for the vendored version. Human docs may describe workflows that map to the same endpoints. If an endpoint is missing from the zip, regenerate after Apple updates the zip.

## Layout

```text
mcp/dp-asc/
  openapi/app-store-connect.openapi.json
  generated/tools.json          # full catalog (internal)
  generated/manifest.json
  src/auth.ts                   # ES256 JWT (no secrets in repo)
  src/client.ts                 # fetch wrapper
  src/catalog.ts                # search / resolve over tools.json
  src/index.ts                  # MCP stdio server (4 meta-tools)
  src/types.ts
  scripts/generate-tools.ts
  scripts/smoke.ts
  scripts/live-check.ts
  mcp.example.json
  package.json
  README.md
```

## Security

- **Never commit** `.p8` keys, `.env`, or real Issuer/Key IDs.
- `.gitignore` blocks `*.p8`, `AuthKey_*.p8`, and `.env*`.
- JWTs are 20-minute tokens, cached in memory only.
- Tool results do not echo credentials.

## License

Same as the parent [imfaisii/skills](https://github.com/imfaisii/skills) repository unless noted otherwise.
