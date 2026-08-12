# imfaisii-skills

A personal [Claude Code](https://code.claude.com) marketplace. Add it once, then
install any skill below straight into Claude Code. The repo also serves a small
landing page (Next.js) that lists the catalog.

## Use the marketplace

Inside Claude Code:

```text
/plugin marketplace add imfaisii/skills
/plugin install commit-crafter@imfaisii-skills
```

Then list, update, or remove:

```text
/plugin marketplace list
/plugin marketplace update imfaisii-skills
/plugin marketplace remove imfaisii-skills
```

## Skills in this marketplace

| Plugin | What it does |
| --- | --- |
| `commit-crafter` | Write clear, conventional git commit messages from your staged changes. |
| `pr-describer` | Generate a structured pull request description from your branch diff. |
| `eeat-blog` | Research keywords and write an EEAT-optimized SEO blog post into a repo's blog system, with Deeporax (Grok Imagine) images. |
| `nextjs-skeletons` | Add loading.tsx and component-matched skeletons to a Next.js app, fixing and adding loading states on data calls with theme-aware, zero-CLS skeletons. |
| `claude-design-local` | Reproduce claude.ai/design output from Claude Code: the real call order, the intake gate, the canvas patterns, local `.dc.html` preview, and hooks that block the two silent failure modes. |

## MCP servers

Separate from marketplace plugins. Clone this repo (or copy the folder), install with Bun, then `claude mcp add`. **Bring your own secrets** — never commit `.p8` keys or Issuer/Key IDs.

| Server | Path | What it does |
| --- | --- | --- |
| `dp-asc` | [`mcp/dp-asc`](./mcp/dp-asc) | Full App Store Connect API via 4 meta-tools (`asc_search` / `asc_schema` / `asc_call` / `asc_tags`) over an OpenAPI-generated catalog (1000+ ops). |

See [`mcp/README.md`](./mcp/README.md) and each server’s own README for setup.

## Add your own skill

Each skill ships as a small plugin under `plugins/`. To add one:

1. Create the plugin folder and skill:

   ```text
   plugins/<plugin-name>/
   ├── .claude-plugin/
   │   └── plugin.json
   └── skills/
       └── <skill-name>/
           └── SKILL.md
   ```

2. Fill in `plugin.json` (copy an existing one and change `name`, `description`).

3. Write `SKILL.md`. The frontmatter `description` is required and tells Claude
   when to use the skill:

   ```markdown
   ---
   name: <skill-name>
   description: What it does. Use when ...
   allowed-tools: Bash, Read
   ---

   # Skill body — the instructions Claude follows.
   ```

4. Register the plugin in `.claude-plugin/marketplace.json` by adding an entry to
   `plugins[]` with `"source": "./plugins/<plugin-name>"`.

5. Validate it:

   ```bash
   claude plugin validate ./plugins/<plugin-name>
   ```

The landing page reads `.claude-plugin/marketplace.json` directly, so new skills
show up automatically.

### Test locally before pushing

Point Claude Code at the local checkout instead of GitHub:

```text
/plugin marketplace add /Users/imfaisii/Documents/GitHub/skills
```

## Run the landing page

```bash
bun install
bun dev
```

Then open http://localhost:3000.
