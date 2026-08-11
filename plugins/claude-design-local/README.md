# claude-design-local

Reproduce claude.ai/design output from Claude Code.

The web app's quality advantage is not a better model. It is four things it does for you
automatically: injects a ~9,000-word system prompt, seeds a template, binds a design system,
and runs a mandatory verify loop. All four are reachable over MCP. **Three of them fail
silently when you skip them.** This plugin turns each one into either an enforced gate or a
command you cannot forget.

## Hard rules (non-negotiable)

**[`references/hard-rules.md`](references/hard-rules.md)** is the locked execution pattern
(product-real content, Deeporax graphics, hybrid board default, call order, verify with
interaction, `open_url` only). Skills defer to it. No compromise unless the user overrides a
specific point in the current message.

Background and the full web lifecycle: [`references/lifecycle.md`](references/lifecycle.md).

## Install

```text
/plugin marketplace add imfaisii/skills
/plugin install claude-design-local@imfaisii-skills
```

The string after `@` is the marketplace's `name` field, not the directory name. The skills,
the agent, and both hooks register on install — no restart needed. Verified by installing
mid-session and watching the guards deny a write in that same session.

Verify:

```bash
claude plugin validate ./plugins/claude-design-local
claude plugin details claude-design-local
```

## What you get

### Skills

Plugin components are namespaced by plugin name. The guaranteed form is
`/claude-design-local:<skill>`; the bare `/cd-new` may resolve when nothing else claims the
name, but do not rely on it.

| Invoke | Does |
|---|---|
| `/claude-design-local:cd-new [brief]` | The full web-parity flow: template + design system picker, create, prompt, depth skill, intake gate, scaffold, build, verify, hand over |
| `/claude-design-local:cd-verify [project_id] [path]` | Render → gate → fresh eyes → act |
| `/claude-design-local:cd-preview [dir]` | Local `.dc.html` preview with no cloud round trip |
| `/claude-design-local:cd-system [name]` | Create or fill a design system, with the right project type |
| `claude-design-local:claude-design-parity` | Model-invoked doctrine: hard rules, call order, intake, hybrid default, Deeporax, verify |

`claude-design-parity` owns parity and points at `references/hard-rules.md`. It covers call
order, intake gate, canvas patterns, product-real content, Deeporax graphics, upload
discipline, and verify-with-interaction. No external skill dependency.

### Agent

`claude-design-local:design-verifier` — the fresh-eyes step the web has and the CLI does not.
Read-only. Detects missing browser tooling and returns `VERDICT: cannot_verify` instead of
pretending.

### Hooks

Two `PreToolUse`/`PostToolUse` guards on the claude-design MCP server, implemented in
[`scripts/cd-guard.mjs`](scripts/cd-guard.mjs):

1. **`write_files` is denied until `get_claude_design_prompt` has run this session.** Skipping
   it means designing without the format rules, the aesthetic rules, or the bound system's
   tokens — and nothing tells you.
2. **A `.dc.html` write is denied unless `support.js` is known to exist in that directory.**
   Without it the file renders but is uneditable in the Claude Design editor. Silent.

Both denials name the exact call that fixes them, so they are one step of friction, not a
loop. State is kept in a per-session JSON file under `$CLAUDE_PLUGIN_DATA` — the transcript is
written asynchronously and lags the current turn, so it is not a reliable source.

The guard learns about a pre-existing `support.js` automatically from any `list_files`
response, so a project set up in an earlier session does not keep tripping it.

Disable with `CD_GUARD_OFF=1`.

```bash
node plugins/claude-design-local/scripts/cd-guard.test.mjs   # 11 cases, both gates
```

### Templates

The three canvas patterns found in real web exports, plus the option stack:

| File | Pattern |
|---|---|
| `templates/hybrid-board.dc.html` | One root Component, per-frame state keyed by frame id. Every phone independently interactive. **This is what the polished web canvases do.** |
| `templates/flow.dc.html` | One frame, `state.screen` + `sc-if`. Walkable prototype. |
| `templates/board.dc.html` | N static frames, `id="sNN"`, anchor index. Exhaustive. |
| `templates/options.dc.html` | Option stack, newest turn on top, stable `1a`/`2b` ids. |

### Runtime

`runtime/support.js` — a copy of the fixed server-shipped dc-runtime (69,150 bytes, md5
`951ae391b8ae72ef12e671c2fad23353`), byte-identical across every Claude Design project. It
exists so you can preview `.dc.html` locally.

**The cloud project's copy must come from `create_support_js`.** Never upload this one.

### References

Primary-source capture, so the plugin is auditable rather than a set of claims:

- `references/hard-rules.md` — **non-negotiable execution doctrine**
- `references/base-prompt.md` — the injected web system prompt, verbatim
- `references/hifi-design.md` — verbatim
- `references/frontend-design.md` — verbatim
- `references/canvas-format.md` — `.dc.html` internals, reverse-engineered from three exports
- `references/design-system-format.md` — what the platform generates vs what you author
- `references/lifecycle.md` — web lifecycle and CLI parity call order

## Known limits

- The verify loop needs browser tooling (Playwright MCP). If none is loaded,
  `/claude-design-local:cd-verify` and `design-verifier` say so and degrade to sharing
  `open_url`. They do not claim verification.
- The four `templates/*.dc.html` files are written against the reverse-engineered format spec
  but have never been rendered. `{{ }}` holes fail silently, so treat the first
  `cd-preview` or cloud render as their real test.
- The guard watches `write_files`. `copy_files` can move a `.dc.html` into a directory with no
  `support.js` without tripping it. Rare, but check the destination yourself.
- Publishing a design system is web-UI only. No tool publishes, sets org default, or deletes.
- `oxlint` is not bundled; adherence lint runs via `bunx oxlint`.
- The captured prompts are a snapshot. `get_claude_design_prompt` remains the live source, and
  the guard forces a live fetch every session, so drift stays contained.
