---
name: commit-msg
description: Write a Conventional Commits-style message for a given diff. Use when the user pastes a diff and asks for a commit message.
---

# commit-msg

Given a diff, write a single commit message in Conventional Commits format:

```
type(scope): summary

body explaining the why, not the what.
```

Rules:
- First line under 72 chars, imperative mood ("add", "fix", "refactor", not "added")
- `type` is one of: feat, fix, refactor, docs, test, chore, perf
- `scope` in parentheses if obvious from the diff, omit otherwise
- Body: 2–4 lines max, explain motivation
- Use `!` after type for breaking changes: `feat(api)!: ...`

Output the message only. No preamble, no markdown fences.
