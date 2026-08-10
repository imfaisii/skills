---
name: cd-preview
description: Preview .dc.html files locally without a Claude Design round trip, by serving the local design/ mirror with a copy of the fixed support.js runtime. Use for fast iteration before pushing to the cloud project.
argument-hint: "[directory, default design/]"
user-invocable: true
---

# /cd-preview — iterate locally, push once

Directory: **$ARGUMENTS** (default `design/`)

## Why this works

`support.js` is a fixed, server-shipped runtime. It is byte-identical across every Claude
Design project — 69,150 bytes, md5 `951ae391b8ae72ef12e671c2fad23353`, and its own first line
says it is generated and must not be edited.

So a local copy renders `.dc.html` exactly as the cloud does. You can author, look, and fix
locally, then push a file that is already right.

A copy ships at `${CLAUDE_PLUGIN_ROOT}/runtime/support.js`.

## Set up

```
cp "${CLAUDE_PLUGIN_ROOT}/runtime/support.js" design/support.js
```

One copy per directory holding `.dc.html`, mirroring how the cloud project works.

Verify it is intact:

```
md5 -q design/support.js   # expect 951ae391b8ae72ef12e671c2fad23353
```

## Serve it

`file://` will not work — the runtime fetches sibling files for `dc-import` and the design
system, and those requests fail under the file protocol. It needs a real HTTP origin.

**Do not start the server yourself.** Print this and let the user run it in their own
terminal, so they keep the logs:

```
bunx serve design -p 4321
```

Then open `http://localhost:4321/<Name>.dc.html`.

If a server is already running on a port, say which port you expect and verify with `curl`
against it rather than starting another.

## What local preview does and does not tell you

**It does tell you:** whether the markup renders, whether `{{ }}` holes resolve, whether
`sc-if` / `sc-for` branch correctly, whether `dc-import` and `x-import` resolve, whether the
layout holds, whether assets load.

**It does not tell you:** whether the file is click-editable in the Claude Design editor, how
the host canvas pan/zoom frames it, or whether comment anchors survived. Those need the real
project.

**A bound design system will not resolve locally** unless the `_ds/<slug>-<uuid>/` folder is
mirrored locally too. Either pull it down with `read_file`, or accept that local preview
shows unstyled components and check styling in the cloud render.

## The rule that keeps this safe

The cloud project's `support.js` must come from `mcp__claude-design__create_support_js`.
**Never upload the local copy.** The server ships the current runtime; your copy is a
snapshot that will eventually go stale.

To refresh the local copy, export any project from Claude Design and take `support.js` out of
the zip.
