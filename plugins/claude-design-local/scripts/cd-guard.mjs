#!/usr/bin/env node
// Claude Design parity guard.
//
// Closes the two silent failure modes that make CLI design output worse than web:
//   1. write_files before get_claude_design_prompt  -> you design without the format rules
//   2. a .dc.html in a directory with no support.js -> renders, but is uneditable
//
// Session state lives in a per-session JSON file so we never parse the transcript
// (the transcript is written asynchronously and lags the current turn).
//
// Events wired in hooks/hooks.json:
//   PostToolUse  get_claude_design_prompt  -> record prompt fetched (+ design_system_id)
//   PostToolUse  create_support_js         -> record the directory it wrote into
//   PostToolUse  list_files                -> record any directory already holding support.js
//   PreToolUse   write_files               -> allow or deny
//
// Escape hatch: set CD_GUARD_OFF=1 to disable every check.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";

const ALLOW = () => process.exit(0);

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

const stateDir =
  process.env.CLAUDE_PLUGIN_DATA || join(tmpdir(), "claude-design-local");

function statePath(sessionId) {
  return join(stateDir, `${(sessionId || "nosession").replace(/[^\w.-]/g, "_")}.json`);
}

function loadState(sessionId) {
  try {
    return JSON.parse(readFileSync(statePath(sessionId), "utf8"));
  } catch {
    return { promptFetched: false, designSystemId: null, supportDirs: [] };
  }
}

function saveState(sessionId, state) {
  try {
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(statePath(sessionId), JSON.stringify(state));
  } catch {
    /* state is an optimization; never break the tool call over it */
  }
}

// The directory a project-relative path lives in, "" for project root.
function dirOf(p) {
  const norm = String(p || "").replace(/^\.\//, "");
  const d = dirname(norm);
  return d === "." ? "" : d;
}

function toolNameOf(input) {
  return String(input.tool_name || "");
}

// PostToolUse field name for the result is not guaranteed across versions.
// Stringify whatever we can find and pattern-match — this only ever ADDS
// permissions, so a miss is safe.
function responseText(input) {
  for (const k of ["tool_response", "tool_result", "response", "result", "output"]) {
    if (input[k] !== undefined) {
      try {
        return typeof input[k] === "string" ? input[k] : JSON.stringify(input[k]);
      } catch {
        /* ignore */
      }
    }
  }
  return "";
}

function main() {
  if (process.env.CD_GUARD_OFF === "1") ALLOW();

  const input = readStdin();
  const event = String(input.hook_event_name || "");
  const tool = toolNameOf(input);
  const sessionId = input.session_id;
  const state = loadState(sessionId);

  if (event === "PostToolUse") {
    if (tool.endsWith("__get_claude_design_prompt")) {
      state.promptFetched = true;
      const dsid = input.tool_input && input.tool_input.design_system_id;
      if (dsid) state.designSystemId = dsid;
      saveState(sessionId, state);
    } else if (tool.endsWith("__create_support_js")) {
      const p = (input.tool_input && input.tool_input.path) || "support.js";
      const d = dirOf(p);
      if (!state.supportDirs.includes(d)) state.supportDirs.push(d);
      saveState(sessionId, state);
    } else if (tool.endsWith("__list_files")) {
      // A support.js already in the project (written in an earlier session)
      // is just as good as one we wrote. Learn it from the listing.
      const text = responseText(input);
      const re = /(?:^|["'\s\/])((?:[\w.\-\/ ]*\/)?support\.js)\b/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        const d = dirOf(m[1]);
        if (!state.supportDirs.includes(d)) state.supportDirs.push(d);
      }
      saveState(sessionId, state);
    }
    ALLOW();
  }

  if (event !== "PreToolUse" || !tool.endsWith("__write_files")) ALLOW();

  // ---- Gate 1: the base prompt must have been fetched this session.
  if (!state.promptFetched) {
    deny(
      "Claude Design parity guard: call mcp__claude-design__get_claude_design_prompt " +
        "before writing. It is the documented precondition of write_files and it carries " +
        "the .dc.html format rules, the aesthetic rules and the bound design system's " +
        "tokens. Pass design_system_id if a system is bound to this project. " +
        "Then retry this write unchanged.",
    );
  }

  // ---- Gate 2: a .dc.html needs support.js in its own directory.
  const files = (input.tool_input && input.tool_input.files) || [];
  const missing = new Set();
  for (const f of files) {
    const p = String((f && f.path) || "");
    if (!p.endsWith(".dc.html")) continue;
    const d = dirOf(p);
    if (!state.supportDirs.includes(d)) missing.add(d);
  }

  if (missing.size > 0) {
    const dirs = [...missing].map((d) => (d === "" ? "<project root>" : d));
    const paths = [...missing].map((d) => (d === "" ? "support.js" : `${d}/support.js`));
    deny(
      `Claude Design parity guard: writing a .dc.html into ${dirs.join(", ")} but no ` +
        `support.js is known to exist there. Without it the file renders as inert markup ` +
        `and is uneditable in the Claude Design editor — and nothing warns you.\n\n` +
        `Fix, then retry this write unchanged:\n` +
        `  - call mcp__claude-design__create_support_js with path "${paths.join('" and "')}"\n` +
        `  - or, if it already exists from an earlier session, call ` +
        `mcp__claude-design__list_files on this project; the guard reads the listing and ` +
        `will stop asking.`,
    );
  }

  ALLOW();
}

main();
