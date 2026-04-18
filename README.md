# skill-lab

> Test your Claude skills like code.

You wouldn't ship a library without tests. You're shipping skills without tests. skill-lab gives you an eval harness, regression runs, and diff reports — so you know your skill actually works before you push it.

```bash
npx skill-lab run
```

```
skill-lab v0.1
────────────────────────────────────────
ship-it                                   
  ✓ bug-fix-diff                         pass   (2.1s  $0.04)
  ✓ new-feature-diff                     pass   (1.8s  $0.03)
  ✗ breaking-change                      FAIL   (3.2s  $0.06)
     expected: semver="major"
     got:      semver="minor"
  ✓ empty-diff                           pass   (0.9s  $0.01)
────────────────────────────────────────
4 tests • 3 passed • 1 failed • $0.14 total
```

---

## Why this exists

Skills are opinionated prompts. Prompts are brittle. You tweak one line to fix case A, silently break case B, find out three weeks later when a user files a bug.

Every other kind of software has eval tooling. Skills don't. This is that tooling.

skill-lab gives you:

1. **A simple YAML format** for defining what a skill should do on specific inputs
2. **A runner** that actually invokes the skill (via Claude Code CLI) and checks the result
3. **Two grading modes** — deterministic assertions, or LLM-as-judge when you need to grade prose
4. **Diff reports** comparing today's run to last week's — catches regressions

Nothing more. It does one thing.

## Install

```bash
npm install -g skill-lab
# or run without installing:
npx skill-lab run
```

Requires `claude` (the Claude Code CLI) on your PATH. skill-lab invokes it to run the skill under test.

## Write an eval

An eval lives next to your skill. Directory layout:

```
my-skill/
├── SKILL.md
└── evals/
    ├── case-01-simple.yaml
    └── case-02-edge.yaml
```

An eval is a YAML file:

```yaml
# evals/case-01-simple.yaml
skill: ship-it
name: bug-fix-diff

input: |
  You are in a git repo. The diff adds a null check to validateToken().
  Pretend `git diff main...HEAD` returns:
  
  - if (token.length > 0)
  + if (token && token.length > 0)

expect:
  contains: ["fix", "patch", "null"]
  not_contains: ["BREAKING"]
  semver: patch        # custom assertion: parse semver from output
  max_cost: 0.10
  max_seconds: 10
```

## Run it

```bash
skill-lab run                 # run all evals under ./
skill-lab run my-skill        # run evals for one skill
skill-lab run --filter bug    # only tests with "bug" in the name
skill-lab run --baseline      # save the run as a baseline
skill-lab diff                # diff the last run against the baseline
skill-lab report              # write a markdown report
```

## Assertion types

Built-in grader supports:

| Field | What it does |
|---|---|
| `contains: [...]` | Every string must appear in output (case-insensitive) |
| `not_contains: [...]` | None of these strings may appear |
| `matches: "regex"` | Output must match the regex |
| `max_cost: 0.10` | Fail if estimated $ > this |
| `max_seconds: 10` | Fail if wall time > this |
| `judge: "criteria"` | LLM-as-judge: pass if Claude says the output meets this criteria |

Custom assertions: drop a JS file in `.skill-lab/assertions/` exporting `{ name, check }`. The `semver` assertion in the example above is a 6-line user plugin.

## Baselines and diffs

When a skill works, save the current run as a baseline:

```bash
skill-lab run --baseline
```

Next time you change the skill:

```bash
skill-lab run
skill-lab diff
```

```
  ship-it
  ~ bug-fix-diff                          output changed
     - "fix(auth): null guard"
     + "fix(auth): handle missing token"
  ✗ new-feature-diff                      regressed (was passing)
     assertion failed: contains ["breaking"]
```

You see what *output* drifted and what *assertions* broke. You catch regressions before your users do.

## Cost controls

skill-lab tracks cost per run and total. You can cap the whole run:

```bash
skill-lab run --max-cost 5.00
```

Hits the cap, stops, tells you what it couldn't run.

## What skill-lab is NOT

- Not a linter for SKILL.md syntax (coming in 0.2)
- Not a way to train or fine-tune skills — it's pure observation
- Not an A/B testing framework for prompt variants (also coming)
- Not a replacement for real QA — it's the regression net under that

## Design principles

1. **Skills are software.** Test them.
2. **Plain YAML, no DSL.** If a junior dev can't read an eval file, it's over-engineered.
3. **Fast by default.** Runs in parallel. Respects `--max-cost`.
4. **Honest output.** Colored pass/fail. Per-test time + cost. No spinners.

## Example repo

See [`examples/`](./examples) for two working skills with evals.

## Roadmap

- [ ] Interactive `skill-lab debug` — re-run one failing eval with step-through
- [ ] CI GitHub Action (`skill-lab/action`)
- [ ] Skill lint — checks SKILL.md frontmatter, description length, etc.
- [ ] A/B prompt testing

## Related

- [ship-it](https://github.com/munnam77/ship-it) — one command, clean release
- [claude-hud](https://github.com/munnam77/claude-hud) — know what Claude is costing you
- [skill-lab](https://github.com/munnam77/skill-lab) — this repo
- [the-skill-cookbook](https://github.com/munnam77/the-skill-cookbook) — how to write a 100x skill
- [claude-for-solopreneurs](https://github.com/munnam77/claude-for-solopreneurs) — 10 skills for running a software business solo

## License

MIT
