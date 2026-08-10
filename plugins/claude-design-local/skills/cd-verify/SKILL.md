---
name: cd-verify
description: Run the Claude Design verify loop on a rendered file — render, gate on console and network, fresh-eyes review, act. Use after any write_files that touches a renderable deliverable, and before claiming a design is done.
argument-hint: "[project_id] [path]"
user-invocable: true
---

# /cd-verify — render, gate, fresh eyes, act

Target: **$ARGUMENTS** (if blank, use the project and path from `design/README.md`)

A file that parses cleanly can still render blank, clip a heading, or quietly drop the one
change that was asked for. This loop is the difference between "I wrote it" and "it works".

## Step 0 — can you see at all?

Check **once**, at the start. Do not assume either way.

Search for browser tooling with `ToolSearch`: `playwright`, `browser_navigate`,
`browser_take_screenshot`.

**If nothing is loaded**, stop here and tell the user, in your first message:

> No browser tooling is loaded in this session, so I cannot run the render gate. I will
> share the link after each write and I need you to be my eyes.

Then share `open_url` and ask them to confirm. Do not review the source and call that
verification — source review does not catch a blank mount. Do not report the design as
verified.

## Step 1 — render

```
mcp__claude-design__render_preview { project_id, path }
```

Take `serve_url`. **`browser_close` the previous round's page first** or you will screenshot
a cached tab. Open the fresh page, wait for load plus a short settle — do not wait for
network idle, analytics beacons never idle.

Capture: a **1440×900** viewport screenshot, the console messages, the failed network
requests.

`serve_url` goes to your browser tooling and nowhere else. Never into chat, a file, a TODO,
or a commit message — it carries a project-scoped token and expires.

## Step 2 — gate

Any of these means the page is mechanically broken and **nothing you would judge about the
design is meaningful yet**:

- console errors
- 404'd subresources — a broken asset `src` shows up here before it shows up visually
- a blank or near-blank mount
- markup rendering as literal text → `support.js` is missing from that directory
- decks: text below 24px, overflowing text, overlapping text

Fix and re-render.

**Three gate rounds on the same file without convergence means the fix is structural, not a
tweak.** Read the error and the source together and make one change that addresses the cause.

## Step 3 — fresh eyes

A clean gate means it loads. It does not mean it is right.

Dispatch the `claude-design-local:design-verifier` agent with:

- a **freshly minted** `serve_url` (re-mint from `render_preview`; the TTL is short)
- `project_id` and `path`
- **the user's request, verbatim** — not your paraphrase of it

It returns `VERDICT: done`, `VERDICT: needs_work` with located problems, or
`VERDICT: cannot_verify`.

No subagent mechanism available? Re-read your own screenshot with the user's asks written
out in front of you, and answer the same two questions: is it mechanically sound, and did
each specific ask land.

## Step 4 — act

`needs_work` → fix exactly what it describes, re-render.

**Three consecutive `needs_work` on the same file means tweaks are not converging.** Stop
tweaking. Measure the problem element and its parent (`getComputedStyle` +
`getBoundingClientRect` — box-sizing, display, position, flex props, width/height,
min-height). State the root cause in one sentence. Make one decisive edit that targets it.

If that does not land either, show the user what you see versus what you expected and ask
whether to keep going or change approach.

`done` → share `open_url` plus the screenshot.

## Optional — adherence lint

If a design system is bound, the consumer project carries a real oxlint config:

```
bunx oxlint -c design/_ds/<slug>-<uuid>/_adherence.oxlintrc.json design/
```

It flags raw hex colors, raw px values, off-system font families, undeclared component props
and out-of-enum prop values. Clean lint is not a substitute for the visual gate; it catches a
different class of problem.

## Reporting

Report failures with the actual output. Name anything you skipped. If the gate did not run,
say the design is unverified — do not hedge, and do not claim it either way.
