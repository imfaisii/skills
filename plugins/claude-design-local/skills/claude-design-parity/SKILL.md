---
name: claude-design-parity
description: Use when designing through claude.ai/design from Claude Code and the output must match what the web app produces — picking a template and design system, the mandatory call order, the intake gate that decides which questions to ask, choosing between the board / flow / hybrid canvas patterns, and the verify loop. Load before the first write_files of a design task.
---

# Claude Design parity

This skill owns one thing: **making CLI output match web output.** The MCP tool mechanics it
depends on, stated once so nothing here dangles:

- **etags.** `list_files` returns an `etag` per file. Pass it as `if_match` on every write to
  that path; use `"0"` for a new file. Skipping it silently overwrites edits the user made in
  the browser while you worked.
- **Plan scopes.** `finalize_plan { scope: "project" }` is one consent checkpoint covering
  every write for about four hours. `scope: "paths"` lasts about fifteen minutes.
- **`copy_files`** moves files *between Claude Design projects only*. It cannot read your
  disk, and it bypasses the `support.js` guard — check the destination directory yourself.
- **The `design/` mirror.** Author text locally, then push the same bytes. Reading local disk
  is faster than round-tripping and leaves you free to re-edit without re-fetching etags.
- **Graphics.** The base prompt forbids hand-drawn complex SVG and asks for striped
  placeholders. Do not ship the placeholder: generate the real asset with the Deeporax MCP,
  save it under `design/assets/<kind>/`, push it as a project file, and reference it
  relatively. One illustration language per project.

The web's quality advantage is not a better model. It is four things the web does for you and
the CLI does not: the injected base prompt, a template scaffold, a bound design system, and a
mandatory verify loop. Three of them fail **silently** when skipped.

## The call order — this is the whole skill

```
0.  list_design_systems                             published only
    DesignSync { method: "list_projects" }          every writable DS project
1.  create_project { name, design_system_id? }      BINDING IS IMMUTABLE
2.  get_claude_design_prompt { design_system_id? }  MANDATORY before any write
3.  read_design_skill { hifi-design | frontend-design }
4.  INTAKE GATE                                     see below
5.  create_support_js                               once per directory holding .dc.html
6.  finalize_plan { scope: "project" }
7.  author locally in design/ → write_files with if_match
8.  render_preview → gate → fresh eyes → act
9.  hand over open_url                              never serve_url
```

Steps 2 and 5 are enforced by hooks in this plugin. If a write is denied, read the reason: it
tells you exactly which call is missing.

## Step 1 — binding is a one-way door

`mcp__claude-design__create_project` always makes a **regular** project.
`DesignSync { method: "create_project" }` makes a **design system**. The `type` is fixed at
creation and nothing rebinds an existing project.

So decide the design system *before* the project exists. `design_system_id` is only accepted by
`create_project` and `get_claude_design_prompt`.

`list_design_systems` shows published systems only. If the system you want is missing, take its
id from `DesignSync list_projects` or from the `claude.ai/design/p/<id>` URL — but tell the user
plainly that an unpublished system will not be picked up automatically, and that publishing is
web-UI only.

## Step 4 — the intake gate

This is the behavior people notice on the web: it asks questions when the brief is thin. The
rule is **not** "ask when the prompt is short". It is scoped by what owns the aesthetic:

**A design system is bound, or the user gave references / brand assets, or the project already
has files with an established look.**
→ Do **not** ask about visual style. Not vibe, not palette, not typography, not mood, not art
direction. Offer divergent visual directions only if the user asks for alternatives.
→ Spend questions on: audience, purpose, content, structure, scope, interactions, copy tone,
output fidelity, how many options.

**Nothing bound and the project is empty.**
→ You **must** ask about aesthetics before designing. Vibe, audience, colors, type, mood.
Guessing here is the documented route to slop.

**Unattended run, no human to answer.**
→ Derive direction from what exists, and state the assumption prominently at the top of the
deliverable and in your summary so it is cheap to redirect.

Use `AskUserQuestion`. Keep it to one round of 2–4 questions.

**This deliberately overrides the usual "don't stop to ask, finish the turn" default.** On
design work, asking is the documented behavior, not a failure to finish. Say so when you ask.

## Step 4b — pick the canvas pattern deliberately

Three patterns ship in `templates/`. Picking the wrong one is the most common reason CLI output
feels worse than web output.

| Deliverable | Pattern | Template |
|---|---|---|
| "Review the whole app" — every screen, every empty/error/loading state | **Board** — N static frames, `id="sNN"` + `data-screen-label`, anchor index | `board.dc.html` |
| "Let me click through it" — one walkable prototype | **Flow** — one frame, `state.screen` + `sc-if` + `onClick` | `flow.dc.html` |
| "A really good canvas" — a board where every phone is independently interactive | **Hybrid** — one root Component, per-frame state keyed by frame id | `hybrid-board.dc.html` |
| "Show me options" — 3+ variations to mix and match | **Option stack** — turns newest-first, stable `1a`/`2b` ids | `options.dc.html` |

The hybrid board is what the polished web canvases actually do. Default to it for app design
work. Board and Flow files are cross-linked as plain relative hyperlinks between siblings.

Format details are in `references/canvas-format.md`. Read it before writing your first
`.dc.html` — the `{{ }}` language is not JavaScript and the failure mode is silent.

## Step 8 — verify, and what to do when you cannot

The loop is render → gate → fresh eyes → act.

**Check once, at the start, whether browser tooling exists in this session.** Search for
Playwright tools. If none are loaded:

- Say so to the user up front, in the first message of the design task.
- Fall back to the base prompt's own documented fallback: share `open_url` after each write and
  ask the user to confirm what they see.
- Do **not** claim a design is verified. State plainly that the gate did not run.

When browser tooling does exist, `render_preview` gives a `serve_url` for your tooling only.
`serve_url` never appears in chat, in a file you write, or in a commit message.

For fresh eyes, dispatch the `claude-design-local:design-verifier` agent with a freshly minted
`serve_url`, the `project_id`, the `path`, and the user's request **verbatim**.

## Local preview without a round trip

`support.js` is a fixed server-shipped runtime — byte-identical across every project
(69,150 bytes, md5 `951ae391b8ae72ef12e671c2fad23353`). A copy sits in `runtime/support.js`.

So you can author `.dc.html` in the local `design/` mirror with a copy of `support.js` beside
it, serve that folder statically, and iterate in a browser before pushing anything.

**The cloud project still gets its `support.js` from `create_support_js`.** Never upload the
local copy.

**Never start the static server yourself** — print the command and let the user run it, per
their standing instruction about dev servers.

## Adherence lint

A bound design system ships `_ds/<slug>-<uuid>/_adherence.oxlintrc.json` into the consumer
project. It is a real oxlint config that forbids raw hex colors, raw px values, off-system
font families, undeclared component props, and out-of-enum prop values.

Run it locally against your authored JSX:

```
bunx oxlint -c design/_ds/<slug>-<uuid>/_adherence.oxlintrc.json design/
```

## Failure modes specific to parity

| Symptom | Cause |
|---|---|
| File renders but the user cannot click-edit it | `.dc.html` written into a directory with no `support.js` |
| A `{{ }}` hole renders nothing, no error | You put JavaScript in it. Compute in `renderVals()`. |
| Component tag renders nothing | Self-closed `<x-import />`, or capitalized `<Card />` |
| Design system styles absent | `_ds/` links not in `<helmet>`, or the wrong `<SLUG>-<UUID>` |
| Output looks generic despite a bound system | You skipped `get_claude_design_prompt` with `design_system_id` |
| User's browser edit vanished | Wrote without `if_match` |
| Options canvas confuses the user | Ids renumbered between turns, or newest turn appended at the bottom |

## References in this plugin

- `references/base-prompt.md` — the injected web prompt, verbatim
- `references/hifi-design.md` — polished product screens, the option-stack pattern
- `references/frontend-design.md` — bold direction when nothing is bound
- `references/canvas-format.md` — `.dc.html` internals, the three patterns
- `references/design-system-format.md` — what the platform generates vs what you author
