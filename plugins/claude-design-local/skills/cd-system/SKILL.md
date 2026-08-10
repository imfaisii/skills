---
name: cd-system
description: Create or fill a Claude Design design system (UI kit) — the right project type, the exact file layout the Design System pane reads, and what the platform generates versus what you must author. Use when building a design system rather than a design.
argument-hint: "[system name or existing project id]"
user-invocable: true
---

# /cd-system — build a design system

Target: **$ARGUMENTS**

## The two facts that decide everything

**1. A design system is a different project type, fixed at creation.**

```
DesignSync { method: "create_project", name }     -> PROJECT_TYPE_DESIGN_SYSTEM
mcp__claude-design__create_project { name }       -> regular project, forever
```

A regular project can never become a design system no matter what you name it or write into
it. If the user already has a project and wants it to become a system, the answer is "create
a new one", not "add files".

**2. Four files are platform-generated and you cannot hand-author them.**

| File | Built from |
|---|---|
| `_ds_manifest.json` | every `@dsCard` marker + every `tokens/*.css` |
| `_ds_bundle.js` | compiling every `components/**/*.jsx` into an IIFE on `window.<Namespace>` |
| `_adherence.oxlintrc.json` | the `.d.ts` prop contracts + the token list |
| `.thumbnail` | rendering `thumbnail.html` |

So the workflow is **author source → push source → let the platform build**. Never assemble
the whole folder locally and upload it. Full detail in `references/design-system-format.md`.

## Layout the Design System pane reads

```
SKILL.md                    near-boilerplate wrapper (template below)
readme.md                   the real rules — LOWERCASE, this exact name
styles.css                  @import list for tokens/, the only entry point
thumbnail.html              1280x854 render source
tokens/*.css                file names are yours; styles.css declares the order
guidelines/*.card.html      specimen pages
components/<group>/
  Name.jsx  Name.d.ts  Name.prompt.md
  <group>.card.html
assets/icons/*.svg
ui_kits/<name>/             optional: a click-through prototype built from the components
```

On macOS a sibling `README.md` is the same file as `readme.md` and will clobber it. If you
keep a local mirror, name your own notes something else.

## SKILL.md is boilerplate

Both real exports ship the same nine lines with only the name swapped:

```markdown
---
name: <slug>-design
description: Use this skill to generate well-branded interfaces and assets for <Name>, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
```

All the real content goes in `readme.md`.

## Cards: the first line is load-bearing

Every `.card.html` must open with the marker, exactly four attributes in this order:

```html
<!-- @dsCard group="Components" viewport="700x430" name="Core" subtitle="Buttons, fields, cards, rows, toggles" -->
<!doctype html><html><head><link rel="stylesheet" href="../styles.css">…
```

No marker, no card in the pane. Groups seen in real systems: `Brand`, `Colors`, `Components`,
`Effects`, `Motion`, `Spacing`, `Type`. `viewport` is free-form `WxH`; 700-wide is a
convention both real systems follow, not a rule.

A card should read tokens through custom properties so it stays honest when the tokens change.

## Component triples

Each component ships three files.

**`Name.jsx`** — plain function component, `import React from "react"`. Two CSS strategies
appear in real systems; **pick one and hold it across the whole kit**:
- self-inject a `<style id="k-btn-css">` on first render, guarded by an id check, with
  BEM-ish classnames referencing token vars
- or no classes at all, every style an inline `style={{}}` object built from a lookup table

Neither real export ships a per-group `.css` file. A shared stylesheet also works, but it is
a third convention — decide once.

**`Name.d.ts`** — ambient declaration: `NameProps` interface with JSDoc on each prop, then
`export declare function Name(props): React.ReactElement`. This is what the generated
adherence lint reads to close the prop set.

**`Name.prompt.md`** — 7–14 lines written **for the agent that will generate screens**, not
for a human: one-line description, a fenced `jsx` usage block, then terse rules of use
("Never put two primaries on one screen."). Skipping this file is why generated screens
misuse a component.

## Tokens

Base ramp then semantic aliases that reference the ramp:

```css
--ink-950: #0B0B0C;
--text-primary: var(--ink-950);
```

`styles.css` composes with one `@import url("tokens/x.css")` per file, ordered
`fonts → colors → typography → spacing → shape → elevation → motion`.

Real systems ship **plain hex, not oklch** — the base prompt's oklch guidance is for choosing
accents when nothing governs you, not a platform requirement.

Themes are an explicit attribute selector, never `prefers-color-scheme`:
`:root[data-theme="dark"]`. Shipping zero themes is legal.

## Pushing

```
DesignSync { method: "list_files", projectId }        build the structural diff
DesignSync { method: "finalize_plan", projectId, writes, localDir }
DesignSync { method: "write_files", projectId, planId, files: [{ path, localPath }] }
```

`DesignSync write_files` **does** support `localPath` — the tool reads from disk and uploads
directly, so the bytes never enter your context. Max 256 files per call; split larger bundles
across calls under the same `planId`.

Push **incrementally, one component at a time**. Never a wholesale replace.

`register_assets` is legacy — cards come from `@dsCard` markers now. Only use it for
hand-authored projects with no markers.

## Finish honestly

**Publishing is web-UI only.** No tool publishes a system, sets the org default, or deletes
one. Say this plainly when you hand a new system over:

> This system is unpublished. Until you publish it in the Claude Design web UI it will not
> appear in `list_design_systems`, and new projects will not pick it up.

If a system is missing from `list_design_systems`, its id is in
`DesignSync { method: "list_projects" }` or in the `claude.ai/design/p/<id>` URL.
