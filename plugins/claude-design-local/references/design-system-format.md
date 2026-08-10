# Design-system project format

Reverse-engineered from two real Claude Design exports (Kalo, Tread) on 2026-08-10, and
cross-checked against a hand-authored local mirror. Everything below is observed, not guessed.

## The single most important fact

**Four files are platform-generated. You cannot hand-author them correctly, and you should
never try.**

| File | Generated from | Why you can't fake it |
|---|---|---|
| `_ds_manifest.json` | parsing every `@dsCard` marker + every `tokens/*.css` | derived index; drifts instantly |
| `_ds_bundle.js` | compiling every `components/**/*.jsx` | IIFE with a `namespace` + per-file `sourceHashes` |
| `_adherence.oxlintrc.json` | the `.d.ts` prop contracts + the token list | one selector per component per enum prop |
| `.thumbnail` | rendering `thumbnail.html` | WebP screenshot |

You author **source**. The platform's self-check compiles the rest. This is why the local
workflow is "author locally → push source → let the platform build", never "build the whole
folder locally and upload it".

## Canonical layout

```
<ProjectName>/                       # type: PROJECT_TYPE_DESIGN_SYSTEM (immutable)
├── SKILL.md                   AUTHOR   near-boilerplate wrapper, see below
├── readme.md                  AUTHOR   the real rules; lowercase, the pane reads this exact name
├── styles.css                 AUTHOR   @import list for tokens/, the only entry point
├── thumbnail.html             AUTHOR   1280x854 render source
├── .thumbnail                 GENERATED WebP screenshot of thumbnail.html
├── _ds_manifest.json          GENERATED index of components + cards + tokens + themes
├── _ds_bundle.js              GENERATED IIFE bundle on window.<Namespace>
├── _adherence.oxlintrc.json   GENERATED oxlint prop/token contract
├── tokens/*.css               AUTHOR   file names are NOT fixed; styles.css declares the order
├── guidelines/*.card.html     AUTHOR   specimen pages, first line must carry @dsCard
├── components/<group>/
│   ├── <Name>.jsx             AUTHOR   plain function component, `import React from "react"`
│   ├── <Name>.d.ts            AUTHOR   ambient decl: <Name>Props interface + declare function
│   ├── <Name>.prompt.md       AUTHOR   7-14 lines, written FOR an agent, not a human
│   └── <group>.card.html      AUTHOR   one aggregate specimen per group
├── assets/icons/*.svg         AUTHOR
├── ui_kits/<name>/            OPTIONAL a click-through prototype assembled from the components
└── uploads/                   OPTIONAL user-supplied source screenshots
```

## SKILL.md is boilerplate

Both real exports ship the same 9 lines with only the name swapped:

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

Same frontmatter shape as a Claude Code skill. The body carries no design rules — it points at
`readme.md`. Note the body says `README.md` while the file on disk is `readme.md`; case-insensitive
filesystems paper over it. **Author `readme.md` lowercase** — that is the name the Design System
pane reads, and on macOS a sibling `README.md` is the same file and will clobber it.

## @dsCard markers

Exactly four attributes, always this order, identical syntax in both exports:

```html
<!-- @dsCard group="Components" viewport="700x430" name="Core" subtitle="Buttons, fields, cards, rows, toggles and the bottom sheet" -->
```

It must be the **first line** of the file. No marker, no card in the pane.

- Groups observed: `Brand`, `Colors`, `Components`, `Effects`, `Motion`, `Spacing`, `Type`,
  and one project-specific group (`Tread iOS`) for the `ui_kits/` prototype pages.
- `viewport` is free-form `WxH`. Both projects used width `700` for every guideline and
  component card (heights 110–430), but the `ui_kits` pages use `393x852` and `1500x960`.
  700-wide is a convention, not a rule.

`DesignSync register_assets` is the legacy path for hand-authored projects with no markers.

## Component CSS strategy is NOT fixed

Neither real export ships a `components/<group>/<group>.css` file. Two different strategies:

- **Kalo** — each `.jsx` declares `const CSS = "..."` and self-injects a `<style id="k-btn-css">`
  into `document.head` on first render, guarded by an id check. Classnames are BEM-ish
  (`k-btn`, `k-btn--primary`) and reference token vars.
- **Tread** — no classes at all; every style is an inline `style={{ ... }}` object built from a
  `SIZES` / `skin` lookup table, values pulled through `var(--token)`.

Pick one and hold it across the system. A shared per-group stylesheet also works but is a
third convention neither export uses.

## The `.prompt.md` file matters more than it looks

7–14 lines, written for the **downstream agent** that will generate screens from this system:
a one-line description, a fenced `jsx` usage block, then terse rules of use
("Never put two primaries on one screen."). It pairs directly with the generated
`_adherence.oxlintrc.json` — the prompt tells the generator what is legal, the lint catches it
when it isn't. Skipping `.prompt.md` is why generated screens misuse a component.

## Tokens

Plain `--kebab-case` custom properties: a base ramp (`--ink-950`, `--paper-000`) then semantic
aliases that reference the ramp (`--text-primary: var(--ink-950)`). `styles.css` composes with
one `@import url("tokens/x.css")` per file, ordered
`fonts → colors → typography → spacing → shape/radius → elevation → motion`.

**Colors in both real exports are plain hex, not oklch.** The base prompt's oklch guidance
applies to *choosing accents* when you have no system; it is not a platform requirement, and a
published system is free to ship hex.

Themes are an **explicit attribute selector**, never `prefers-color-scheme`:
`[data-theme="dark"]`. The manifest records them as
`themes: [{"selector":"[data-theme=\"dark\"]","label":"Dark"}]`. Shipping zero themes is legal —
Tread is light-only.

## _ds_bundle.js shape (read-only knowledge)

Classic script, not a module. Leading machine-readable comment then an IIFE that mutates a
namespaced global:

```js
/* @ds-bundle: {"format":4,"namespace":"KaloDesignSystem_ffbbd5","components":[...],"sourceHashes":{...}} */
(() => {
const __ds_ns = (window.KaloDesignSystem_ffbbd5 = window.KaloDesignSystem_ffbbd5 || {});
// each component wrapped in its own try/catch so one break doesn't kill the bundle
...
__ds_ns.Switch = __ds_scope.Switch;
})();
```

Consumed as `<script src="_ds_bundle.js"></script>` then
`const { PaywallSheet } = window.TreadDesignSystem_90f11b;`.

## _adherence.oxlintrc.json — what the platform enforces

`plugins: ["react","import"]` plus a non-standard `x-omelette` extension key
(`components`, `tokens`, `tokenKinds`, `fontFamilies`) that oxlint itself does not understand —
the platform reads it in a post-lint step. The real rules:

1. **No raw hex colors** — `Literal[value=/#[0-9a-fA-F]{3,8}\b/]` → "use a design-system color token via var()".
2. **No raw px values** — `Literal[value=/\b\d+px\b/]` → "use a design-system spacing token via var()".
3. **No off-system font-family** — names the available families.
4. **Closed prop sets** — one selector per component enumerating the exact legal JSX attributes
   (plus `key/ref/className/style/children`).
5. **Closed enum values** — a second selector per enum prop restricting it to the `.d.ts` union.
6. **Barrel imports only** — `no-restricted-imports` forbids reaching into
   `components/core/**`; import from `index.js`. Note **no `index.js` exists in either export**,
   so this rule targets a file the platform synthesizes elsewhere.

You can run this locally: `bunx oxlint -c _ds/<slug>-<uuid>/_adherence.oxlintrc.json <path>`.

## Binding copies, it does not link

Binding a design system to a consumer project mirrors it into `_ds/<slug>-<uuid>/` in that
project: `tokens/`, `styles.css`, `readme.md`, `_ds_manifest.json`, `_ds_bundle.js`,
`_adherence.oxlintrc.json`, and a `CHANGELOG.md` that exists only in the copy. The mirrored copy
carries **no `.jsx` sources** — the consumer gets the compiled bundle. So a consumer project
holds a pinned snapshot that syncs, not a live pointer.

Binding happens at `create_project` and **nothing rebinds an existing project.**

## Gotchas that cost real time

- Project `type` is fixed at creation. `mcp__claude-design__create_project` always makes a
  REGULAR project. Only `DesignSync { method: "create_project" }` makes a design system.
- **Publish is web-UI only.** Unpublished systems stay out of `list_design_systems` and new
  projects will not pick them up. No tool publishes, sets org default, or deletes.
- `list_design_systems` returns published only; `DesignSync list_projects` returns every
  writable design-system project. Expect the second list to be much longer.
- Generated imagery lands on Cloudflare R2 (`pub-*.r2.dev`) and is only *referenced*, not
  packaged, in an export. Download it into `assets/` if you want it to survive.
