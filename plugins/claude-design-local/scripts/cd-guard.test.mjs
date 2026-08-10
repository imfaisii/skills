import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GUARD = join(dirname(fileURLToPath(import.meta.url)), "cd-guard.mjs");
let dataDir = mkdtempSync(join(tmpdir(), "cdg-"));
let pass = 0, fail = 0;

function run(payload, env = {}) {
  const out = execFileSync("node", [GUARD], {
    input: JSON.stringify(payload),
    env: { ...process.env, CLAUDE_PLUGIN_DATA: dataDir, ...env },
    encoding: "utf8",
  });
  return out.trim() ? JSON.parse(out) : null;
}

function check(name, got, wantDeny) {
  const denied = got?.hookSpecificOutput?.permissionDecision === "deny";
  if (denied === wantDeny) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} — denied=${denied} want=${wantDeny}`); if (got) console.log("       ", JSON.stringify(got)); }
}

const S = "sess-A";
const pre = (input) => ({ session_id: S, hook_event_name: "PreToolUse", tool_name: "mcp__claude-design__write_files", tool_input: input });
const post = (name, resp) => ({ session_id: S, hook_event_name: "PostToolUse", tool_name: `mcp__claude-design__${name}`, tool_input: {}, tool_response: resp });

console.log("gate 1 — prompt required");
check("write before get_claude_design_prompt is DENIED", run(pre({ project_id: "p1", files: [{ path: "a.html" }] })), true);
run(post("get_claude_design_prompt", "…prompt text…"));
check("write after get_claude_design_prompt is ALLOWED", run(pre({ project_id: "p1", files: [{ path: "a.html" }] })), false);

console.log("gate 2 — support.js required for .dc.html");
check(".dc.html with no support.js is DENIED", run(pre({ project_id: "p1", files: [{ path: "App.dc.html" }] })), true);
check("nested .dc.html with no support.js is DENIED", run(pre({ project_id: "p1", files: [{ path: "screens/App.dc.html" }] })), true);
run(post("create_support_js", { path: "support.js" }));
check(".dc.html at root after create_support_js is ALLOWED", run(pre({ project_id: "p1", files: [{ path: "App.dc.html" }] })), false);
check("nested .dc.html still DENIED (different dir)", run(pre({ project_id: "p1", files: [{ path: "screens/App.dc.html" }] })), true);

console.log("gate 2 — learning from list_files");
check("learns pre-existing support.js from list_files", (() => {
  run(post("list_files", { files: [{ path: "screens/support.js" }, { path: "screens/Old.dc.html" }] }));
  return run(pre({ project_id: "p1", files: [{ path: "screens/App.dc.html" }] }));
})(), false);

console.log("session isolation + escape hatch");
check("a different session starts denied again",
  run({ session_id: "sess-B", hook_event_name: "PreToolUse", tool_name: "mcp__claude-design__write_files", tool_input: { files: [{ path: "a.html" }] } }), true);
check("CD_GUARD_OFF=1 allows everything",
  run({ session_id: "sess-C", hook_event_name: "PreToolUse", tool_name: "mcp__claude-design__write_files", tool_input: { files: [{ path: "X.dc.html" }] } }, { CD_GUARD_OFF: "1" }), false);

console.log("non-targets pass through");
check("unrelated tool is ALLOWED", run({ session_id: S, hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: "x.dc.html" } }), false);
check("malformed payload does not deny", run({ session_id: S, hook_event_name: "PreToolUse", tool_name: "mcp__claude-design__write_files" }), false);

rmSync(dataDir, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
