# The `.dc.html` canvas format

Reverse-engineered from three real Claude Design canvas exports (Portion, Pet Skits, Tread) on
2026-08-10. Everything here is observed in shipped files, not inferred from the prompt.

## support.js is a fixed server runtime

Byte-identical across all three projects: **69,150 bytes, MD5 `951ae391b8ae72ef12e671c2fad23353`**.
Line 1 reads `// GENERATED from dc-runtime/src/*.ts — do not edit.`

So: `create_support_js` writes the same bytes into every directory. Never author it, never edit
it. It is not per-project.

It is a hand-rolled DOM walker — `sc-if`, `sc-for`, `x-import`, `dc-import` are **not** native
Custom Elements. The runtime parses `<x-dc>`'s innerHTML, compiles it once into render
functions, and evaluates the logic block through `new Function(...)` with `DCLogic`,
`StreamableLogic` and `React` injected. It also speaks a `postMessage` protocol
(`__dc_design_mode`) back to the Claude Design editor iframe, which is why the same file works
standalone and inside the authoring canvas.

## Document envelope

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet data-dc-atomics>
<meta name="design_doc_mode" content="canvas">
<link rel="stylesheet" href="_ds/<slug>-<uuid>/tokens/fonts.css">
<!-- one <link> per token/component CSS file, then styles.css last -->
<script src="_ds/<slug>-<uuid>/_ds_bundle.js"></script>
<style> /* page-local overrides */ </style>
</helmet>
<!-- design markup -->
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1200,"height":800}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

The `./support.js` src is always relative and always literal. `data-dc-atomics` on `<helmet>`
and `data-dc-script` + `data-props` on the trailing script are the two load-bearing markers.

`<meta name="design_doc_mode" content="canvas">` appears on top-level board files and is absent
from component-only files meant to be `dc-import`ed.

## There is no frame element and no x/y coordinates

This surprised me and it is worth stating plainly: **there is no `<dc-frame>`, and canvas files
carry no x/y positions.** A "screen" is an ordinary `<div>` sized to a device viewport
(`width:402px;height:874px` for iPhone-shaped frames, `393x852` for Tread) laid out with plain
`display:flex; flex-wrap:wrap; gap:...`.

"Canvas" means the host gives you pan/zoom over a scrollable HTML page. The base prompt suggests
absolute positioning for frames; real exports use flex wrap. Both render — flex wrap is easier
to keep `left/top >= 0` and reflows sanely.

## Full custom tag / attribute inventory

| Tag or attribute | What it does |
|---|---|
| `<x-dc>` | Root template container. Its innerHTML is the template. |
| `<helmet data-dc-atomics>` | Head-equivalent inside `<x-dc>`. `<link>`/`<script src>`/`<style>` mount to `<head>`. |
| `<script type="text/x-dc" data-dc-script data-props='…'>` | The logic block. |
| `<sc-if value="{{ x }}" hint-placeholder-val="{{ false }}">` | Conditional. The hint renders only while the doc is still streaming. |
| `<sc-for list="{{ xs }}" as="item" hint-placeholder-count="3">` | Loop. Binds `item` and `$index`. |
| `<x-import component-from-global-scope="Namespace.Component">` | Resolves a dotted path on `window`, polling every 50ms up to 30s for async script load. |
| `<x-import component="Chart" from="./Chart.jsx">` | Loads an external JS/JSX module (in-browser Babel transform). |
| `<dc-import name="PortionFrame" f="{{ f }}" hint-size="402px,874px">` | Mounts a sibling `.dc.html`'s own `<x-dc>`/`Component` pair. |
| `hint-size="w,h"` | Reserves layout space before an async import resolves. |
| `data-screen-label="Onboarding"` | Names a screen so editor comments can reference it. |
| `data-theme="night"` | Scoped theme override consumed by the design system's CSS. |
| `style-hover` / `style-active` / `style-focus` | Pseudo-state styling, compiled to extra classnames. |
| `data-drags-parent="1"` | On a frame's label, so dragging the label moves the frame. |

**Always write explicit close tags.** Never `<x-import />` or `<dc-import />`.

## The template expression language is tiny

`{{ }}` is **not** JavaScript. The evaluator supports only: identifiers, dotted/bracket paths,
`===` `!==` `==` `!=`, `!`, numeric/string/bool/null literals, and parens. Anything else fails
silently.

If the whole attribute value is exactly `{{ x }}` the raw value is passed
(`onClick="{{ handler }}"`); embedded holes string-interpolate.

`renderVals()` must return a **flat object**. Every `{{ name }}` is a top-level key on it,
merged over `this.props`. Ternaries, `.map`, comparisons, formatting — all of it computes in
`renderVals()` and gets exposed by name.

```js
class Component extends DCLogic {
  state = { traits: null };
  renderVals() {
    const picked = this.picked;
    return {
      hasDramatic: picked.includes('dramatic'),
      traitCount: picked.length + ' of ' + max + ' picked',
      pickDramatic: toggle('dramatic'),
    };
  }
}
```

## The three canvas patterns — pick one deliberately

This is the part that decides whether the output feels like the web's.

### 1. Board — exhaustive and annotated

One `.dc.html` holding N independent static phone frames, each
`<div id="s01" data-screen-label="Splash">`, stitched together by plain in-page anchors
`<a href="#s02">02</a>`. No shared state, no `sc-if`. Pet Skits' board carries 30 screens
covering every state including errors and empties.

Use when the deliverable is *review the whole app at once*.

### 2. Flow — one frame, genuinely walkable

A single device frame whose visible screen is state-driven. Root `Component` holds
`state = { screen: 'sample' }`, a `go(s)` factory returns handlers calling
`this.setState({screen: s})`, and `renderVals()` exposes booleans (`isSample`, `isDeal`) that
gate `<sc-if>` blocks. Tapping a button swaps the branch in the *same* DOM frame.

Use when the deliverable is *click through it*.

### 3. Hybrid board — N independently interactive frames

This is what the polished Portion and Tread canvases do, and it is the pattern most people mean
when they say the web canvas is "really good".

One root `Component` owns per-frame state keyed by frame id:

```js
this.state = { f: { garage: {screen:'list', prev:null}, check: {screen:'scan'} } };
go(id, screen)   // handler factory scoped to one frame
back(id)
resetAll()
```

Each frame is then rendered either through a shared sub-component —
`<dc-import name="PortionFrame" f="{{ f }}"></dc-import>` where `f` is a per-frame view-model
built by `this.frame(def)` — or inlined with nested `sc-for` over bands then `sc-if` per step.

Every phone on the board is independently interactive and independently resettable. Board
legibility plus prototype fidelity, no tradeoff.

### Cross-linking

Board and Flow files are cross-linked as plain relative hyperlinks between sibling files:
`<a href="PetSkitsApp.dc.html">PetSkitsApp</a>`.

## Design-system wiring, two ways

**Direct** (Portion, Tread) — in `<helmet>`, one `<link>` per token CSS file plus `styles.css`,
then `<script src="_ds/<slug>-<uuid>/_ds_bundle.js">`. Components resolve via
`component-from-global-scope="PortionDesignSystem_f9d74f.Button"`.

**Indirected** (Pet Skits) — a hand-written 17-line `ds-base.js` that hardcodes
`const base = '_ds/<slug>-<uuid>/'` and injects the `<link>` and `<script>` at runtime. One line
to edit when the path moves. The `.dc.html` files then reference only `./ds-base.js` and never
mention `_ds/` directly.

The indirected form is worth copying if you expect to rebind or relocate.

## Local preview without a round trip

Because `support.js` is fixed bytes, a local mirror can hold a copy purely for local preview.
Author `.dc.html` in `design/`, drop a `support.js` copy beside it, serve the folder statically,
and iterate in your own browser before pushing anything.

The cloud project must still get its `support.js` from `create_support_js` — do not upload the
local copy.

## Things that fail silently

- JS inside a hole: `{{ a + b }}` — never evaluates, no error.
- `<script src>` in the template body instead of `<helmet>`.
- Self-closed `<x-import />` / `<dc-import />`.
- Capitalized component tags `<Card />` — always `<dc-import name="Card">`.
- A `.dc.html` in a directory with no `support.js` — renders as inert markup, uneditable.

## Ancillary files in an export

- **`.thumbnail`** — a raw WebP with no extension, a captured preview of that project's canvas.
- **`uploads/`** — your reference images, not referenced by any `.dc.html`. Competitor
  screenshots at real iPhone dimensions, plus `pasted-<epoch-ms>-0.png` from clipboard pastes
  (the epoch decodes to the actual paste time; `-0` indexes multi-image pastes).
- **`ps-icons.js`** (Pet Skits) — a genuine native Web Component
  (`customElements.define('ps-icon', …)`) shipping ~63 hand-drawn SVG paths in a shadow root so
  React never reconciles them. Hand-authored, deliberately not Lucide.
- The exported `_ds/` is a **trimmed subset** of the authoring bundle — no `thumbnail.html`,
  no `SKILL.md`.
