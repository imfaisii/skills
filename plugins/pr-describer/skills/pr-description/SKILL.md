---
name: pr-description
description: Write a structured pull request description from the diff between the current branch and its base. Use when the user asks to open a PR, write a PR description, or summarize a branch for review.
allowed-tools: Bash, Read
---

# PR Describer

Summarize everything on the current branch into a reviewer-friendly pull request description.

## Steps

1. Find the base branch. Try `git symbolic-ref refs/remotes/origin/HEAD` (strip to the branch name); fall back to `main` then `master`. Confirm with the user if ambiguous.
2. Gather the change set:
   - `git log --oneline <base>..HEAD` for the commit history.
   - `git diff --stat <base>..HEAD` for the shape of the change.
   - `git diff <base>..HEAD` for the detail (read enough to understand intent).
3. Synthesize, don't transcribe. Explain the change as a story a reviewer can follow, not a list of every line.

## Output

Render this template, filled in:

```markdown
## Summary
One or two sentences on what this PR does and why it exists.

## What changed
- Bullet the meaningful changes, grouped by area.
- Skip noise (formatting, generated files) unless it matters.

## Why
The motivation or problem being solved. Link issues with `Closes #123` when known.

## How to test
Concrete steps a reviewer runs to verify the change.

## Review checklist
- [ ] Notable risks or follow-ups called out
- [ ] Tests cover the new behavior
- [ ] No unrelated changes snuck in
```

If the `gh` CLI is available and the user wants to open the PR, offer to run `gh pr create` with this body. Never push or create the PR without explicit approval.

## Rules

- Describe only what's in the diff. Don't claim tests exist if they don't.
- Keep it scannable: a reviewer should grasp the change in 30 seconds.
- Flag anything that looks like an accidental inclusion (debug logs, secrets, large vendored files).
