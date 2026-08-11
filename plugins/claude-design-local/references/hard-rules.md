# Hard rules — Claude Design from Claude Code

**Non-negotiable. No compromise. No shortcuts. No “good enough without this.”**

These rules are the execution pattern that produced the Warmly product-only onboarding + home canvas. They are the required way to design through claude.ai/design from Claude Code. If a step conflicts with habit, convenience, token pressure, or “finish the turn,” **these rules win**.

---

## 0. What you are reproducing

Web Claude Design quality is not a better model. It is:

1. The live base prompt (`get_claude_design_prompt`)
2. A deliberate canvas pattern (default: **hybrid board**)
3. A bound design system **or** an explicit, stated aesthetic commitment
4. Real graphics (Deeporax), never striped placeholders
5. Product-real content and compliance copy
6. The verify loop (render → gate → act) before you claim done

Skip any one of these and the output is not “this workflow.” Do not ship it as done.

---

## 1. Call order — locked

```
0.  list_design_systems (+ DesignSync list_projects if needed)
1.  create_project { name, design_system_id? }     # binding immutable
2.  get_claude_design_prompt { design_system_id? } # MANDATORY before any write
3.  read_design_skill { hifi-design | frontend-design }
4.  INTAKE GATE                                    # scoped; see §2
5.  create_support_js                              # once per dir with .dc.html
6.  finalize_plan { scope: "project" }
7.  author local mirror → write_files + if_match
8.  render_preview → browser gate → fix → re-render
9.  hand over open_url only                        # never serve_url
```

- No `write_files` before step 2.
- No `.dc.html` write into a directory without step 5.
- No “I’ll verify later.” Step 8 runs before you say the design is ready.
- Hooks may enforce 2 and 5; **you still run the full order even if hooks are off.**

---

## 2. Intake gate — hard scope

| Situation | You do |
|---|---|
| DS bound, or brand/refs/existing look | **Never** ask vibe/palette/type/mood. Ask product: audience, purpose, content, structure, scope, interactions, copy tone. |
| Nothing bound, empty project | **Must** ask aesthetics (or, if unattended, **state assumptions in the board header and handoff** — never silent guess). |
| User said “product only / no design context” | **Do not** open DESIGN.md, local tokens, or prior canvases. Product brief only. Invent and **label** one committed direction. |

Product-only experiments are first-class. Do not smuggle in old design systems “to be safe.”

---

## 3. Canvas pattern — default hybrid board

For app screens (onboarding, home, tabs, multi-state UI):

- **Default = hybrid board**: one root `DCLogic`, multiple phone frames, independent interactivity (`sc-if` / `sc-for` / `onClick` → `setState`).
- Use **flow** only when the brief is a single walkthrough path.
- Use **static board** only when the brief is exhaustive states to review, not click.
- Use **option stack** only when the brief asks for variations to pick.

Do not ship a static mock of an interactive product when hybrid is available.

Every phone frame:

- Real device size (e.g. ~390×844)
- Status bar + content + tab bar when the product has tabs
- `data-screen-label` on the phone
- Frame meta: id, name, short note

---

## 4. Product reality — content and compliance

- **No lorem ipsum. No gray boxes. No “Feature title.”**
- Copy, scheme names, statuses, rewards, and legal lines come from the product brief (`PRODUCT.md` or equivalent).
- If the product is not government / not the funder: independence and honesty copy is **visible on the canvas** (onboarding beat and/or home footer), not only in a README.
- Soft eligibility, apply-free, call SLA, tab names, Plus paywall boundaries — when they exist in the brief, they appear in the UI language.

A pretty shell with fake content is a failed deliverable.

---

## 5. Graphics — Deeporax only for real art

- Base prompt forbids complex hand-drawn SVG placeholders as the final art.
- **Generate real assets with Deeporax MCP** (hero, banner, still-life, mark cutouts as needed).
- Prefer **stable public image URLs** in the canvas (R2/CDN). Do not embed multi-hundred-KB data-URIs in `.dc.html` unless the file stays small and upload-safe.
- One illustration language per project.
- Local optional: `design/assets/<kind>/` mirror; cloud may reference the public URL directly for prototypes.

No Deeporax / generation failure: say so, use a minimal honest placeholder, and mark the board “graphics pending.” Do not fake a finished photo board with CSS stripes and call it done.

---

## 6. Aesthetic commitment when unbound

When no design system is bound:

1. Commit to **one** direction with a short name (e.g. “Hearth paper”).
2. Put a **direction-lock panel** on the board: temperature, accent role, type character, what you refused (gov clone, purple SaaS, gradient wash).
3. Use `frontend-design` depth skill; do not half-apply a house style.
4. Prefer distinctive display + UI pairing; avoid the anti-slop list (Inter-everywhere, pastel icon squares, uniform card grids, Fraunces-by-default if the prompt bans it).
5. Tokens live in a sibling CSS file for boards of any real size (`warmly-board.css` pattern): keep `.dc.html` lean.

Never: “clean modern minimal” with no commitment.

---

## 7. Authoring and upload discipline

- Local mirror first (`design/` or task-specific folder). Cloud is not your only copy.
- Split large boards: **HTML structure + external CSS** linked from `<helmet>`.
- `write_files` with `if_match` (`"0"` for new). Never blind overwrite.
- `finalize_plan { scope: "project" }` for the session; path-scoped plans when deleting.
- `support.js` **only** via `create_support_js` on the cloud project. Never upload the local runtime copy.
- If the MCP tool payload is too large for the agent harness, still get the bytes up (chunked writes, direct authenticated MCP `tools/call`, etc.). **Upload failure is not optional abandonment** — finish the push or report blocked with the exact error.

---

## 8. Verify loop — required before “done”

1. `render_preview` → use `serve_url` **only** in browser tooling.
2. Gate: console errors, 404s, blank mount, literal markup (missing support.js), **clipped primary CTAs/titles inside the phone**.
3. Interact: at least one state change per interactive frame (e.g. onboarding Continue, home filter).
4. Fix structural layout issues (hero too tall, footer pushed off) — do not leave “scroll to find the CTA” on a first onboarding beat unless intentional.
5. Re-render after fixes.
6. Hand the user **`open_url` only**. Never paste `serve_url` into chat, files, or commits.

No browser tooling: say so up front, share `open_url`, and mark **unverified**. Do not claim verified from reading source alone.

---

## 9. Handoff shape

User-facing close always includes:

1. **Deliverable link** (`claude.ai/design/p/...?file=...`)
2. What was in / out of scope (screens, product-only vs DS-bound)
3. Stated aesthetic assumptions (if unbound)
4. What was verified (and what was not)

No “canvas is staged locally, upload pending” as a finished turn when the user asked for a Claude Design canvas — finish upload + gate or name the blocker.

---

## 10. Explicit bans

| Ban | Why |
|---|---|
| Skip `get_claude_design_prompt` | Silent quality death |
| Bind nothing and invent nothing | Slop |
| Open DESIGN.md / old tokens on a product-only brief | Contaminates the experiment |
| Static PNG-only “canvas” for an app flow | Not the hybrid pattern |
| Ship Deeporax-less striped heroes as final | Violates base prompt + this doctrine |
| Data-URI multi-MB HTML | Upload/tooling failure mode |
| Claim done without render gate (when tooling exists) | Lies |
| Put `serve_url` in user chat | Token leak + expires |
| Government cosplay / crown UI for independent products | Compliance |
| Fifth tab / floating AI orb when product forbids it | Brief violation |

---

## 11. Conflict resolution

If another skill says “don’t ask,” “ship MVP,” or “skip verify”:

**This file wins for any Claude Design / `.dc.html` / claude.ai/design work.**

If the user explicitly overrides a single rule in the current message (e.g. “static board only”), obey the user for that point and state the override. Otherwise execute this pattern in full.
