---
name: commit-message
description: Craft a clear, conventional git commit message from the currently staged changes. Use when the user asks to commit, write a commit message, or says "commit this".
allowed-tools: Bash, Read
---

# Commit Crafter

Produce a single, well-formed [Conventional Commits](https://www.conventionalcommits.org) message that describes the staged changes, then commit when the user approves.

## Steps

1. Inspect what is staged. Run `git status --short` and `git diff --cached`. If nothing is staged, stop and tell the user there are no staged changes (offer to stage with `git add`).
2. Read the diff to understand the *intent* of the change, not just the lines touched. Group related edits into one logical change.
3. Pick the type from the actual change:
   - `feat` new user-facing capability
   - `fix` bug fix
   - `refactor` behavior-preserving restructure
   - `perf` performance improvement
   - `docs` documentation only
   - `test` tests only
   - `build` / `ci` tooling and pipelines
   - `chore` everything else (deps, config)
4. Add a scope in parentheses when one clear area is affected, e.g. `feat(auth):`.
5. Write the message:
   - Subject line: `type(scope): summary` — imperative mood, lower-case, no trailing period, aim for <= 72 chars.
   - Body (optional): wrap at 72 cols, explain *what* and *why*, not *how*. Add it only when the change isn't self-evident.
   - Footer (optional): `BREAKING CHANGE:` notes or issue refs like `Closes #123`.

## Output

Show the proposed message in a fenced block and ask the user to confirm. On approval, commit with `git commit -m "<subject>" -m "<body>"`. Do not push.

## Rules

- One logical change per commit. If the diff mixes unrelated work, say so and suggest splitting it.
- Never invent a change that isn't in the diff.
- Keep the summary specific: "fix(parser): handle empty input" beats "fix bug".
