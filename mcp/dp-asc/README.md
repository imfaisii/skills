# App Store Connect MCP (`dp-asc`)

Open-source **Model Context Protocol** server that exposes **the full App Store Connect API** as MCP tools.

Tools are **generated from Apple’s official OpenAPI specification** — not a hand-maintained subset — so coverage tracks Apple’s published surface.

| | |
| --- | --- |
| Spec in tree | `openapi/app-store-connect.openapi.json` |
| API | App Store Connect API **4.4.1** (OpenAPI 3.0.1) |
| Tools | **1263** (one MCP tool per path + method) |
| Paths | **966** |
| Resource tags | **195** |
| Auth | ES256 JWT (`iss` + `kid` + `.p8`) → `https://api.appstoreconnect.apple.com` |
| Runtime | [Bun](https://bun.sh) + [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (stdio) |

> **No credentials are stored in this repository.** You supply your own App Store Connect API key at runtime.

## Why generated

Hand-written ASC MCPs miss endpoints and drift. This package:

1. Vendors Apple’s OpenAPI JSON under `openapi/`.
2. Runs `bun run generate` → `generated/tools.json` + `generated/manifest.json`.
3. Serves **every** `operationId` as an MCP tool over stdio.

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

Optional: `ASC_BASE_URL` (default `https://api.appstoreconnect.apple.com`).

Live check (calls `GET /v1/apps`):

```bash
bun run scripts/live-check.ts
```

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

After adding, **restart Claude Code** (or start a new session) so tools appear as `mcp__dp-asc__…`.

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

- **Name**: OpenAPI `operationId` (truncated + short hash if longer than 64 characters).
- **Description**: summary + `METHOD path` + tag + operationId.
- **Input**:
  - Path params as required fields (`id`, …).
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
  generated/tools.json
  generated/manifest.json
  src/auth.ts                 # ES256 JWT (no secrets in repo)
  src/client.ts               # fetch wrapper
  src/index.ts                # MCP stdio server
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
