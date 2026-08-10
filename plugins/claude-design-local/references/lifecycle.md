# Claude Design: the web lifecycle, and how to reproduce it from Claude Code

Written 2026-08-10. Every claim here is from a primary source: the live MCP tools
(`get_claude_design_prompt`, `read_design_skill`, `list_design_systems`) and five real project
exports in `claude-design-web-templates/` and `claude-design-web-design-systems/`.

---

## Part 1 — What actually happens when you design on the web

### The short version

Claude Design is a hosted project with its own filesystem. When you prompt it, the platform
injects a ~9,000-word system prompt, optionally concatenates a bound design system's guide, and
runs a documented six-step workflow. **The quality you get on the web is not a better model. It
is that prompt, plus a template scaffold, plus a design system, plus a mandatory verify loop.**
All four are reachable from Claude Code. None of them happen automatically.

### Step by step

**1. You pick a template.** The picker seeds the project with a starting file shape — a mobile
prototype canvas, an app flow, a design system, or nothing. Templates are scaffolds, not magic;
what they really do is commit the model to a document mode (`design_doc_mode=canvas`, a
`deck-stage`, or a plain page) before the first token of design is written.

**2. You optionally pick a design system.** This is the single biggest quality lever. The
picker only lists **published** systems. Choosing one binds it to the project **at creation**,
and the binding is **immutable** — nothing rebinds an existing project.

Binding *copies*. The system is mirrored into the consumer project at `_ds/<slug>-<uuid>/`:
tokens, `styles.css`, `readme.md`, `_ds_manifest.json`, `_ds_bundle.js` (the compiled component
bundle), `_adherence.oxlintrc.json` (a real oxlint config that gates output against the system),
and a `CHANGELOG.md` that exists only in the copy. The consumer gets a pinned snapshot with no
`.jsx` sources — just the compiled bundle on `window.<Namespace>`.

**3. The platform injects the base prompt.** Byte-identical to what
`mcp__claude-design__get_claude_design_prompt` returns. It is captured verbatim at
[base-prompt.md](base-prompt.md). If a system is bound,
the same call returns that text plus a `<design-system-guide>` block carrying the system's
tokens and rules.

**4. The model runs the prompt's workflow.** Six steps, in order:

> 1. Understand user needs; ask clarifying questions for new or ambiguous work.
> 2. Explore provided resources: the design system's full definition and relevant linked files.
> 3. Make a todo list.
> 4. Build folder structure and copy resources into this directory; create the deliverable.
> 5. Verify: run the verify loop.
> 6. Finish: give the user a link that opens the deliverable itself.

**This is the answer to "why does it ask me questions when my prompt is lame."** It is step 1,
and the prompt is unusually specific about scope. When a design system is bound, the model is
*forbidden* from asking about visual style at all — no vibe, no palette, no typography, no mood —
and must spend its questions on audience, purpose, content, structure, scope, interactions, and
copy tone. When nothing is bound and the project is empty, it must ask about aesthetics and is
told plainly: *"Do NOT just pick your own visual aesthetic without getting the user's aesthetic
input — this is how you get slop!"*

**5. Depth skills load on demand.** `read_design_skill` fetches one of two:
- `hifi-design` for polished product screens. Its core claim: hi-fi never starts from scratch.
  Hunt down UI kits, screenshots, brand assets, Figma exports, the codebase. It also ships the
  full "stack of option turns" canvas pattern with stable `1a`/`1b`/`2a` ids.
- `frontend-design` when no brand or system governs the work. Commit to a bold direction.

**6. `support.js` is provisioned per directory.** A `.dc.html` file is not plain HTML. The
editor can only click-edit markup inside an `<x-dc>` template rendered by the `support.js`
runtime. Plain HTML renders in preview but is **read-only in the editor**. The server writes
that runtime; you never author it.

**7. The verify loop runs after every write.** Render → gate → fresh eyes → act.
- **Render:** `render_preview` → `serve_url` → fresh browser page → 1440×900 screenshot,
  console messages, failed requests.
- **Gate:** console errors, 404s, blank mount → the page is mechanically broken and nothing
  about the design is judgeable yet.
- **Fresh eyes:** hand off to a `design-verifier` subagent with a freshly minted `serve_url`
  and the user's request **verbatim**. It returns `VERDICT: done` or `VERDICT: needs_work`.
- **Act:** three consecutive `needs_work` means tweaks aren't converging — measure the element
  and its parent, state the root cause in one sentence, make one decisive edit.

**8. You get a `claude.ai/design/...` link.** Never a `serve_url` — that carries a
project-scoped token and expires.

### What the exports told us

The five zips confirm the shape. Canvas projects carry `*.dc.html`, a server-written
`support.js`, `_ds/<slug>-<uuid>/`, `assets/`, `uploads/` (your reference images, including
`pasted-<epoch-ms>-0.png` from clipboard pastes), and a WebP `.thumbnail`.

Design-system projects carry authored source (`components/<group>/Name.jsx` + `.d.ts` +
`.prompt.md`, `guidelines/*.card.html`, `tokens/*.css`, `readme.md`) plus **four
platform-generated files you cannot hand-author**: `_ds_manifest.json`, `_ds_bundle.js`,
`_adherence.oxlintrc.json`, `.thumbnail`. Full detail in
[design-system-format.md](design-system-format.md).

---

## Part 2 — The gap, and what closes it

Everything the web does automatically is a tool call you must make deliberately. The failure
mode is not that the CLI is worse; it is that three of these steps fail **silently** when
skipped.

| Web does automatically | From Claude Code | Skipping it costs you |
|---|---|---|
| Injects the base prompt | `get_claude_design_prompt` | You design without the format rules. **Silent.** |
| Seeds a template | nothing | No canvas mode, no option-stack structure |
| Binds a design system | `create_project { design_system_id }` | Cannot be fixed later — binding is immutable |
| Asks questions on a thin brief | nothing (agent doctrine pushes the other way) | Guessed aesthetic = slop |
| Provisions `support.js` | `create_support_js`, once per directory | File renders but is **uneditable**. **Silent.** |
| Runs the verify loop | `render_preview` + a browser + a verifier agent | You ship a blank mount |
| Runs adherence lint | `_adherence.oxlintrc.json` ships inside `_ds/` | Raw hex and px slip through |
| Threads etags | `if_match` on every write | You erase the user's browser edit. **Silent.** |

Three silent failures is why "just call the MCP tools" does not reproduce the web. The plugin in
[this plugin](../) converts each one into either an
enforced gate or a command you cannot forget.

### The parity call order

This is the whole thing. Run it in this order and the output matches the web.

```
0.  list_design_systems                 # published only; DesignSync list_projects for the rest
1.  create_project { name, design_system_id? }     # BINDING IS IMMUTABLE — decide here
2.  get_claude_design_prompt { design_system_id? } # MANDATORY before any write
3.  read_design_skill { hifi-design | frontend-design }
4.  INTAKE GATE                          # ask, scoped exactly as the base prompt scopes it
5.  create_support_js                    # once per directory that will hold .dc.html
6.  finalize_plan { scope: "project" }   # one consent checkpoint, ~4h
7.  author locally in design/ → write_files with if_match
8.  render_preview → gate → fresh eyes → act
9.  hand over open_url (never serve_url)
```

### The intake gate, stated precisely

This is the behavior you asked about — "it asks some questions when the prompt is too lame."
The rule is not "ask when the prompt is short." It is:

- **A design system is bound, or you supplied references/brand assets, or the project already
  has files with an established look?** → Do **not** ask about visual style. Not vibe, not
  palette, not typography, not mood. Ask about audience, purpose, content, structure, scope,
  interactions, copy tone.
- **Nothing bound and the project is empty?** → You **must** ask about aesthetics before
  designing. Guessing here is the documented route to slop.
- **Running unattended?** → Derive direction from what exists and state the assumption
  prominently so it is cheap to redirect.

Note this deliberately overrides the usual "don't stop to ask" agent default. On design work,
asking is the documented behavior, not a failure to finish.

---

## Part 3 — Known limits in this environment

Stated plainly rather than discovered later:

- **No Playwright/browser MCP tools are loaded in this session.** The verify loop's render and
  gate steps cannot run headlessly here. The base prompt's own fallback applies: say so up
  front, share `open_url` after each write, and have the user be your eyes. The plugin's
  verifier agent detects this and degrades instead of pretending.
- **Publishing a design system is web-UI only.** No tool publishes, sets the org default, or
  deletes one. An unpublished system stays out of `list_design_systems`.
- **This repo is not a git repository.** Run `git init` if you want the plugin versioned.
- `oxlint` is not installed globally; use `bunx oxlint`.
- **The four `templates/*.dc.html` scaffolds have never been rendered.** They are written
  against the format spec reverse-engineered from real exports, but `{{ }}` holes fail
  silently, so the first preview is their real test.
- **Explicit binding to an *unpublished* design system id is untested.** Whether
  `create_project { design_system_id }` accepts an id that `list_design_systems` does not
  return was never exercised. If it errors, publish the system in the web UI first.

---

## Part 4 — Driving it

Install once:

```text
/plugin marketplace add imfaisii/skills
/plugin install claude-design-local@imfaisii-skills
```

Restart the session so the hooks load. Then:

| Command | When |
|---|---|
| `/claude-design-local:cd-new <brief>` | Starting a design. Walks the parity call order above. |
| `/claude-design-local:cd-preview [dir]` | Iterate locally before pushing. |
| `/claude-design-local:cd-verify [id] [path]` | After any write that touches a renderable file. |
| `/claude-design-local:cd-system <name>` | Building a design system rather than a design. |

Plugin components are namespaced by plugin name. The bare `/cd-new` may resolve when nothing
else claims the name, but the namespaced form always does.
