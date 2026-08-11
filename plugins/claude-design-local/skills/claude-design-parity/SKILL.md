---
name: claude-design-parity
description: Use when designing through claude.ai/design from Claude Code and the output must match what the web app produces — picking a template and design system, the mandatory call order, the intake gate that decides which questions to ask, choosing between the board / flow / hybrid canvas patterns, Deeporax graphics, product-real content, and the verify loop. Load before the first write_files of a design task. HARD RULES in references/hard-rules.md are non-negotiable.
---

# Claude Design parity

**HARD RULES FIRST.** Read and obey [`references/hard-rules.md`](../../references/hard-rules.md) before any design work. No compromise. If this skill and convenience conflict, hard-rules win.

This skill owns one thing: **making CLI output match web output**, using the same execution pattern that produced strong hybrid-board product canvases (call order → product reality → Deeporax art → hybrid board → verify → `open_url`).

## MCP mechanics (once)

- **etags.** `list_files` returns an `etag` per file. Pass it as `if_match` on every write; `"0"` for a new file. Skipping it silently overwrites browser edits.
- **Plan scopes.** `finalize_plan { scope: "project" }` ≈ four hours of writes. `scope: "paths"` for deletes / short windows.
- **`copy_files`** moves files *between Claude Design projects only*. It cannot read disk; it bypasses the `support.js` guard — check the destination yourself.
- **Local mirror.** Author in `design/` (or a task folder), then push the same bytes.
- **Graphics.** Never ship striped placeholders as final. Generate with **Deeporax MCP**, prefer public CDN/R2 URLs in the canvas, keep one illustration language per project. See hard-rules §5.

The web's quality advantage is not a better model. It is: injected base prompt, template/canvas pattern, bound design system **or** explicit aesthetic lock, real graphics, product-real content, mandatory verify loop. Several fail **silently** when skipped.

## The call order — locked (see hard-rules §1)

```
0.  list_design_systems
    DesignSync { method: "list_projects" }          when you need unpublished DS ids
1.  create_project { name, design_system_id? }      BINDING IS IMMUTABLE
2.  get_claude_design_prompt { design_system_id? }  MANDATORY before any write
3.  read_design_skill { hifi-design | frontend-design }
4.  INTAKE GATE                                     hard-rules §2
5.  create_support_js                               once per directory holding .dc.html
6.  finalize_plan { scope: "project" }
7.  author locally → write_files with if_match      CSS sibling for large boards
8.  render_preview → gate → interact → fix → re-render
9.  hand over open_url                              never serve_url
```

Steps 2 and 5 are enforced by hooks when enabled. **You still run the full order if hooks are off.**

## Step 1 — binding is a one-way door

`mcp__claude-design__create_project` → regular project.  
`DesignSync { method: "create_project" }` → design system. Type is fixed at creation.

Decide the design system *before* the project exists. `list_design_systems` is published only; unpublished ids come from DesignSync or the project URL — say that publishing is web-UI only.

**Product-only / no design context briefs:** create **without** `design_system_id`. Do not open local DESIGN.md or prior canvas tokens. Commit and label one aesthetic on the board (hard-rules §6).

## Step 4 — the intake gate

Not “ask when short.” Scoped by what owns the aesthetic (hard-rules §2):

**DS bound / brand / refs / existing look**  
→ Do **not** ask vibe, palette, type, mood. Ask audience, purpose, content, structure, scope, interactions, copy tone, fidelity, options count.

**Nothing bound, empty project**  
→ **Must** ask aesthetics, or if unattended **state assumptions on the board and in the handoff**.

**User: product only, no design context**  
→ Product brief only. No DESIGN.md. Invent + label direction.

Use `AskUserQuestion` when a human can answer. One round, 2–4 questions.  
**This overrides “don’t stop to ask / finish the turn” on design intake.**

## Step 4b — canvas pattern (default hybrid)

| Deliverable | Pattern | Template |
|---|---|---|
| Whole app / multi-screen review with clickable phones | **Hybrid (DEFAULT for app UI)** | `hybrid-board.dc.html` |
| One walkable path | **Flow** | `flow.dc.html` |
| Every state static, annotated | **Board** | `board.dc.html` |
| 3+ variations to pick | **Option stack** | `options.dc.html` |

Hybrid = one root `Component`, per-frame or shared state, `sc-if` / `sc-for`, real scheme/product data in `renderVals()`. Frame meta + `data-screen-label` on every phone. Direction-lock note panel when unbound.

Format: `references/canvas-format.md`. `{{ }}` is not JavaScript; failures are silent.

## Step 7 — build pattern (non-optional quality bar)

1. **Product-real content** from the brief (hard-rules §4).
2. **Deeporax graphics** before calling the board finished (hard-rules §5).
3. **Sibling CSS** for board chrome/tokens; lean `.dc.html`.
4. Interactive proof: onboarding steps and/or filters must actually toggle.
5. Compliance / independence copy on-canvas when the product requires it.
6. Finish cloud upload in the same task — local-only is not a delivered Claude Design canvas.

## Step 8 — verify (hard-rules §8)

Render → gate (console, 404, blank, clipping) → **click at least one control per interactive frame** → fix → re-render.

No browser tooling: say so up front; share `open_url`; mark **unverified**. Source-only review is not verification.

Fresh eyes: `claude-design-local:design-verifier` with a fresh `serve_url`, `project_id`, `path`, and the user request **verbatim**.

## Local preview

`runtime/support.js` is for local preview only. Cloud `support.js` **only** from `create_support_js`. Never upload the local runtime.

**Never start the static/dev server yourself** — print the command; user runs it.

## Adherence lint

Bound DS may ship `_adherence.oxlintrc.json`. Run with `bunx oxlint` when present. Lint ≠ visual gate.

## Failure modes

| Symptom | Cause |
|---|---|
| Renders but not click-editable | No `support.js` in that directory |
| `{{ }}` empty | JS in a hole; compute in `renderVals()` |
| Component missing | Self-closed import or capitalized DOM tag |
| DS styles absent | Bad `_ds/` links / wrong slug-uuid |
| Generic despite DS | Skipped prompt fetch with `design_system_id` |
| Browser edit vanished | Write without `if_match` |
| CTA clipped in phone | Hero/layout not gated in verify |
| Huge write fails | Data-URI bloat; split CSS + public image URLs |
| “Done” but empty cloud | Upload abandoned — violates hard-rules §7/§9 |

## References

- `references/hard-rules.md` — **non-negotiable doctrine**
- `references/base-prompt.md` — web prompt snapshot (live source remains the MCP call)
- `references/hifi-design.md` / `frontend-design.md`
- `references/canvas-format.md`
- `references/design-system-format.md`
- `references/lifecycle.md`
