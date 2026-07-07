---
name: test
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Write a test suite for code you just built or changed. Run /test after implementing a feature, route, or fix; it targets uncommitted changes automatically, reads test-preferences.json for your framework (asks and saves it if absent), and picks the right strategy per file: happy path, edge cases, error states, accessibility."
---

## Output style (plain words, no dashes)

Write everything this skill produces (files, reports, every message shown to the engineer) in plain simple language; keep technical terms that carry real meaning but explain each in plain words. No dashes of any kind (em dash, en dash, or hyphen as punctuation); use short sentences, commas, or parentheses instead.

## What this skill does

Role: a senior test engineer writing the suite the code deserves, no more, no less. Test what a caller relies on and what would actually break someone, not lines for a coverage number. Pick a strategy per file by reading what the thing is. Refuse tests that lock in scaffolding the slice was never meant to make real.

Target: the code changed in this branch but not yet committed. Each changed file is classified (pure logic, component, API route, page/flow) and tested with the right strategy; tests verify real behavior and catch regressions, not coverage farming. A subagent reads the changed files and writes the tests; with a governing ADR, tests trace to its acceptance criteria (Steps 7 and 8).

Does not write application code. Does not update `AGENTS.md`/`CLAUDE.md` context files (/sync owns that).

## Asks vs acts

- Acts without asking when `test-preferences.json` exists, the tool is installed, and uncommitted source files exist: straight to writing.
- Always asks one thing every run, even with prefs: run the suite after writing, or hand back manual instructions (Step 7.5). Per-run choice, never saved.
- Otherwise asks only when: no `test-preferences.json` (framework; E2E addon only if pages/flows changed); a chosen tool is not installed (confirm first); no uncommitted changes (Step 3); >15 files (Step 1b).
- No scope question. The git working tree defines the scope.

## Artifact ownership

- Test files (`*.test.ts`, `*.spec.ts`, `test_*.py`, `*_test.go`, etc.) — created by this skill
- `test-preferences.json` at the project root — created and maintained by this skill

---

## Portability (any OS, any agent)

Any Agent Skills client on macOS, Linux, or Windows:
- `git` is the only required CLI, identical everywhere; run the `git` lines as shown. Other shell snippets are POSIX reference, not literal scripts: do not assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `xargs`, `mkdir -p`, or `node -e` exist. Use your agent's cross-platform file tools (read, search/glob, write) and apply branching logic yourself, not via shell `if`/variables/redirects.
- Bundled files: referenced relative to this skill's folder. The main agent resolves the folder to an absolute path and passes bundled file paths in the subagent prompt; the subagent reads them by path. Fallback: if the client's subagents cannot read files, read and inline the contents instead.
- No subagent or interactive-question support? Write the tests inline yourself, and ask any multiple-choice question as plain text with the same options.

In the Ask blocks below, each option is `"label": "description"`; render them through your agent's picker (`AskUserQuestion` on Claude Code) or as plain text.

## Execution

### Pre-flight (main model)

#### 1. Determine scope from git (do this first — if empty, no point asking anything)

Changed-but-uncommitted files (cross-platform git):
- Tracked (staged + unstaged), excluding deletions: `git diff --name-only --diff-filter=ACMR HEAD`
- Untracked, non-ignored: `git ls-files --others --exclude-standard`
- No commits yet (`git diff HEAD` errors): use `git diff --name-only --diff-filter=ACMR --cached`.

Combine, de-duplicate, filter out non-testable files:
- Test files: `*.test.*`, `*.spec.*`, `test_*.py`, `*_test.go`, anything under `__tests__/`, `e2e/`, `tests/`, `cypress/`
- Config: `*.config.*`, `.*rc`, `tsconfig*`, `*.json` (except where logic lives in JSON), `Dockerfile`, CI yaml
- Lock files, `.lock`, generated/build output (`dist/`, `build/`, `.next/`, `coverage/`)
- Styling: `*.css`, `*.scss`, `*.module.css`; type-only declarations: `*.d.ts`
- Docs and markdown, ADRs, `design.md`, `test-preferences.json`

The remainder is the scope. Empty: go to Step 3. Otherwise continue.

#### 1b. Classify each scoped file

Classify from path and filename alone, never read contents in the main thread; if genuinely ambiguous, tag `logic` and the subagent re-tags on read. Record each file's class for the subagent prompt.

| Signals in path / filename | Class | Test strategy |
|---|---|---|
| `*.tsx`/`*.jsx`/`*.vue`/`*.svelte` not under a route/page path | **component** | Component test (render + interact + assert DOM/ARIA) |
| `app/**/page.*`, `pages/**` (not `pages/api`), `*Screen.*`, `*View.*` | **page/flow** | E2E candidate + component test of pieces |
| `app/**/route.*`, `pages/api/**`, `*.controller.*`, `*.handler.*`, `*.resolver.*`, `actions.*` | **api/server** | Integration test (call handler, mock at boundary) |
| Plain `.ts`/`.js`/`.py`/`.go`/`.rs` — utils, hooks, services, domain logic | **logic** | Unit test (inputs → outputs, edge cases, errors) |
| `cli.*`, `bin/**`, `*.command.*`, `cmd/**` | **cli** | Integration test invoking the command |

`E2E_RELEVANT = yes` if any file is **page/flow**; otherwise `no`.

Large diff guard: more than 15 source files, don't dump all into one subagent. Prioritise by class (logic and api/server first, most risk, cheapest to test well) and ask:

```
Ask — "<N> changed files is a lot for one pass. How should I focus?"  (header: "Scope size")
- "Logic & API first (recommended)": "Test the <count> logic/api files now; I'll note the rest as not-yet-covered"
- "Test everything in batches": "Cover all <N> files across multiple subagent passes, slower but complete"
- "Let me narrow it": "I'll tell you which files or directory matter most"
```

Monorepo resolution: find each scoped file's nearest enclosing `package.json` (walk up). Different roots: group by root (own framework, package manager, test dir; install and spawn per group). One shared root (common case): single project. Record each file's `packageRoot` for the subagent.

---

#### 2. Load preferences

Read `test-preferences.json` at the project root (file tool; "not found" = no prefs).
- Found: load `tool`, `additionalTools`, `e2eTool`, `testDir`, `filePattern`, `packageManager`; skip to Step 5.
- `NO_PREFS`: continue to Step 4.

---

#### 3. No uncommitted changes

Empty scope: skip the framework questions, tell the engineer, offer fallbacks:

```
Ask — "No uncommitted source changes found. What should I test?"  (header: "No changes")
- "The last commit": "Diff HEAD~1..HEAD and test what that commit changed"
- "Specific files": "I'll test the files or directory you name"
- "Nothing right now": "Stop. I'll run /test after I make changes"
```

- Last commit: scope = `git diff --name-only --diff-filter=ACMR HEAD~1 HEAD`, re-run Step 1b.
- Specific files: classify the named files, continue.
- Nothing: stop cleanly.

---

#### 4. Stack detection and first-run questions (only when `NO_PREFS`)

With file tools (not shell utilities), determine:
- Package manager by lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun, `package-lock.json` → npm.
- Language and framework: `package.json` for `next`/`vite`/`nuxt`/`svelte`/`react`; `pyproject.toml` (pytest/unittest) → Python; `go.mod` → Go; `Cargo.toml` → Rust.
- Installed test tools: `vitest`/`jest`/`@playwright/test`/`cypress`/`@testing-library/*` in `package.json`. A different runner already in use (`bun test`, `node:test`, `ava`, `deno test`, etc.): detect and use it instead of installing a new one.

**Q0 — No test setup at all? Don't assume they want one.** No test tool installed (whole repo, or this package in a monorepo): first check for a deliberate no-test-runner convention.
- Stated in the nearest `AGENTS.md` or governing ADR (e.g. "no test runner — typecheck + `/verify` is the gate"): respect it, don't push a framework. Save a `"gate": "typecheck+verify"` preference, run the project's typecheck/lint as the gate, point to `/verify` for behavior. Report: "This project gates on typecheck + `/verify`, not a test suite. Ran the typecheck gate; use `/verify` to confirm behavior."
- Not stated: ask (don't default to installing): "This has no test setup. How do you want to gate changes here?" → `Set up a test framework` (→ Q1, install with confirmation) · `No test runner, typecheck + /verify` (→ save that preference, run typecheck, defer behavior to `/verify`; never install) · `Just typecheck for now`.
- Per package in a monorepo: a package with no tests by design gates on typecheck/`/verify` even if a sibling has a full suite; apply per resolved package root.

Skip Q1 unless the engineer chose "set up a framework".

**Q1 — Framework for unit/integration** (first run, engineer opted to set up tests)

Filter by detected language. List an already-installed tool first with `(already installed)` appended and treat it as recommended.

| Language | Options (max 4) |
|---|---|
| JS / TS | Vitest (recommended), Jest, [+ already-installed first] |
| Python | pytest (recommended), unittest |
| Go | `testing` + testify (recommended), `testing` stdlib only |
| Rust | `cargo test` (built-in) — no question needed, skip |

Unlisted language: ask with whatever tools you detect; the picker's automatic Other covers free text, so add no own Other option.

```
Ask — "Which framework for unit & integration tests?"  (header: "Framework")
- options: [filtered list]
```

**Q2 — E2E tool** (ask only if `E2E_RELEVANT = yes`)

```
Ask — "Pages/flows changed. Add end-to-end tests too?"  (header: "E2E")
- "Playwright (recommended)": "Real-browser flow tests for the changed pages"
- "Cypress": "Real-browser flow tests with the Cypress runner"
- "No E2E (unit/component only)": "Skip browser tests; cover pages at the component level"
```

**Q3 — Component testing addon** (JS/TS only, when any **component** or **page/flow** file is in scope and React/Vue/Svelte is detected)

```
Ask — "Add component testing support?"  (header: "Components")
- "Yes, Testing Library (recommended)": "Installs @testing-library/<framework> + user-event for render+interact tests"
- "No, logic tests only": "Plain module/function tests, no DOM rendering"
```

Skip Q3 entirely if scope is logic/api/cli only.

---

#### 5. Installation check

Check the chosen unit tool, E2E tool (if any), and addon (if any) with file tools:
- JS/TS: under `node_modules/<pkg>`, or in `package.json` devDependencies?
- Python: in `pyproject.toml`/`requirements.txt` (or `pip show <tool>` where Python is available)?
- Go: `stretchr/testify` in `go.sum`?

All present → Step 6. Any missing → confirm first:

```
Ask — "<missing tools> not installed. Install now?"  (header: "Install")
- "Yes, install and continue": "Run the install with the detected package manager, then write tests"
- "No, write runnable stubs": "Skip install; write tests I can run once I install the tools myself"
```

Yes: install with the project's package manager (`pnpm` shown; substitute the detected npm/yarn/bun, or the language's manager for Python/Go):

```bash
pnpm add -D vitest                                            # unit
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom  # addon
pnpm add -D @playwright/test && pnpm exec playwright install  # E2E (Playwright)
pnpm add -D cypress                                          # E2E (Cypress)
pip install pytest pytest-mock                                # Python
go get github.com/stretchr/testify                           # Go
```

"No": record `INSTALL=deferred`; the subagent writes complete tests, the run command is reported as "run after installing".

---

#### 6. Save preferences (first run only)

Write `test-preferences.json` at the project root:

```json
{
  "tool": "<unit framework>",
  "additionalTools": ["@testing-library/react"],
  "e2eTool": "<playwright|cypress|none>",
  "testDir": "<conventional dir for the tool>",
  "filePattern": "<*.test.ts>",
  "packageManager": "<npm|pnpm|yarn|bun>"
}
```

Conventional directories and patterns:

| Tool | `testDir` | `filePattern` |
|---|---|---|
| Vitest | co-located (next to source) | `*.test.ts` / `*.test.tsx` |
| Jest | co-located or `__tests__/` | `*.test.ts` |
| Playwright | `e2e/` | `*.spec.ts` |
| Cypress | `cypress/e2e/` | `*.cy.ts` |
| pytest | `tests/` mirroring source | `test_*.py` |
| Go testing | same package as source | `*_test.go` |
| Rust | `#[cfg(test)]` in-file / `tests/` | n/a |

Then tell the engineer:
> "Preferences saved to `test-preferences.json`. Future `/test` runs load these and skip straight to writing."

---

#### 7. Gather lightweight pointers (do NOT read heavy files here)

Paths and cheap signals only; the subagent does the heavy reading. Do not read ADRs or `design.md` in full here. Never read source files here; the subagent reads each scoped file.

With file tools:
- List the 3 most-recently-modified ADR paths under `docs/adr/` (paths only).
- Identify the governing ADR: the feature dir `docs/adr/NNNN-<feature>/` (or single `docs/adr/NNNN-<feature>.md`) these files implement, matched by branch/feature name or touched surfaces (a `docs/roadmap/` entry, if present, points to it). Note its path and whether a `verify.md` sits beside it (`docs/adr/NNNN-<feature>/verify.md`). This contract is what tests trace to; it may not be among the 3 recent paths. Set `TRACE_TO_CONTRACT = yes` when a governing ADR exists, else `no`.
- Note whether `design.md` exists at the project root; its path goes to the subagent only when a **component** or **page/flow** file is in scope, else `none`.
- Read `AGENTS.md` (canonical; `CLAUDE.md` if absent) to inline as project context (short and cheap). Also note the build approach as one line: the slice-shaping approach the team chose, recorded in the roadmap header (or root `AGENTS.md`), e.g. thin end-to-end path, thinnest-usable-whole core loop, UI-first shell on placeholders, full user journey per phase. It doesn't branch the logic; it calibrates the subagent's judgment (Step 8, instruction a).
- Read `package.json`, note `scripts.test`. `RUN_COMMAND` = `<pkgmgr> test` when a `test` script exists (`<pkgmgr> run test` for npm); a raw invocation (e.g. `pnpm exec vitest run`) only when none does.

---

#### 7.5 Ask whether to run the suite (always)

```
Ask — "Tests will be written for <N> changed files. Run the suite after writing?"  (header: "Run tests?")
- "Yes, run and fix to green": "Execute the suite; I'll fix any test mistakes and flag real bugs the tests catch"
- "Skip, just write them": "Write the tests and give me manual run-and-verify instructions instead"
```

Set `RUN_AFTER = yes | no` and pass it to the subagent.

#### 8. Spawn subagent

Resolve this skill's folder to an absolute path (you already resolve these relative paths, so you know the folder) and pass the absolute paths of `agent-prompt.md` and `writing-guide.md` in the spawn prompt. Do NOT read their contents into the main context. Fallback: if the client's subagents cannot read files, read and inline the contents instead.

Spawn with `model`: a strong model (e.g. `sonnet`/`opus` on Claude Code); `description: "Test: <tool> suite for <N> changed files"`; tools `Read`, `Bash`, `Write`, `Edit`. The prompt contains:

1. The two absolute paths, with this instruction: your first action is to Read both files by path; `agent-prompt.md` is your operating template, `writing-guide.md` is the strategy, tool rules, iteration loop, and report format you must follow.
2. The dynamic values as a labeled list ("Placeholder values: ..."): unit tool, E2E tool, additional tools, `INSTALL` state; `testDir`, `filePattern`, package manager, stack/framework, `packageRoot`; the classified scope (each file path with its class: logic / component / page-flow / api-server / cli); `RUN_COMMAND`, `RUN_AFTER`; project context inline plus the build approach line; the 3 recent ADR paths or `none` (read only if relevant to what it's testing); the design.md path or `none`; `TRACE_TO_CONTRACT`, the governing ADR path, and the `verify.md` path (each `none` if absent).
3. Two instructions: (a) let the build approach calibrate which behaviors are durably real for this slice (lock those in as stable assertions) versus deliberate scaffolding the slice fakes by design (don't assert a real implementation the plan hasn't built yet, e.g. a real-backend expectation on a shell that stubs its data). (b) when `TRACE_TO_CONTRACT = yes`, read the acceptance criteria (from `verify.md` if present, preferring its already-resolved `AC-N`-tagged checklist, else the ADR's `## Requirements`) and lock in the durable ones: an automated test for every criterion that can be pinned as a stable assertion, each test tagged with the `AC-N` it covers (e.g. a `covers: AC-3` comment, or `AC-3` in the test title) so the suite traces back to the contract. Never fake a criterion that can't be automated (visual/manual/environmental, e.g. "email actually arrives"); record it in `NOT_COVERED` as `AC-N — <why not automatable> → defer to /verify manual step`. (Subagents without file access: inline the relevant ADR / acceptance criteria / `verify.md` text instead.)

Monorepo (multiple package roots from Step 1b): one subagent per root in parallel with `run_in_background: true`, each scoped to its root's files, tool, and package manager; isolated contexts keep each lean. Collect all reports before relaying. Single root (common case): one foreground subagent.

---

### After subagent completes

Subagent errored or produced no report: say so and offer to re-run; never report a passing or failing suite it didn't actually produce. Otherwise relay the format matching `RUN_AFTER`.

Update the roadmap: if this feature is on the roadmap (`docs/roadmap/`) and the suite passes, tick its `Test it` box. If `Design`, `Build` (+ its milestones), `Verify`, and `Test` are now all ticked, set the feature's status to `done` (in the At-a-glance table and beside the heading). If tests fail or coverage is partial, leave `Test it` unticked and the status `in-progress`. On `done`, advise `/clear` before the next feature: the roadmap and ADR hold everything, a fresh session keeps the next build cheap.

Parse from the report: `TESTS_WRITTEN`, `NOT_COVERED`, `HARDEN_FLAG`, plus `RUN_RESULT` and `BUGS_FOUND` when `RUN_AFTER = yes`, or `MANUAL_INSTRUCTIONS` when `RUN_AFTER = no`. Relay this template: keep lines marked `← yes` only when `RUN_AFTER = yes`, `← no` only when `RUN_AFTER = no` (a marked heading carries its list lines), unmarked lines always; strip the markers.

```
## /test complete (suite run)      ← yes; when no, use: ## /test complete (not run)

**Scope**: <N> changed files (uncommitted)
**Tool**: <unit tool> [+ E2E tool] [+ addons]
**Preferences**: loaded | saved to test-preferences.json

**Tests written**:
- `<file path>`, <N tests> covering <happy path / edges / errors / a11y> [→ AC-1, AC-3]

**Run result**: <X passed, Y failed> via `<RUN_COMMAND>`   ← yes

**Traceability** (only when TRACE_TO_CONTRACT=yes, ADR NNNN):
- AC-1 ✅ locked in, `<test file · test name>`
- AC-3 ✅ locked in, `<test file · test name>`

**Bugs caught** (tests failing because the code is wrong, not the test):   ← yes
- <file:line, what's broken and the failing expectation>   ← only if BUGS_FOUND is non-empty

**How to run them**:   ← no
1. <setup step, e.g. install if INSTALL=deferred>
2. Run: `<RUN_COMMAND>`
3. Watch a single file: `<focused command>`

**What you should see**: <expected pass output, and which tests prove which behaviour>   ← no
**If something fails**: <how to read the failure, is it a test gap or a real bug>   ← no

**Not covered** (consider adding):
- <gap and why>
- AC-N, <criterion that can't be automated (visual/manual/env)> → defer to /verify manual step   ← when TRACE_TO_CONTRACT=yes

**What /harden should check**: <only if HARDEN_FLAG=yes, one sentence>
```

If `BUGS_FOUND` is non-empty, lead with it: a test that correctly fails on real broken code is a genuine finding, not something to silence. /test does not modify application code to make a test pass.

Omit the harden line entirely when `HARDEN_FLAG=no`. This skill is complete after relaying the report: it does not invoke other skills.

---

## Reference files (in this skill's folder; referenced by relative path)

- `agent-prompt.md`: the subagent's operating template, read by the subagent via the absolute path passed in the spawn prompt
- `writing-guide.md`: strategy, tool rules, iteration loop, report format; read the same way (inline its text only as the no-file-access fallback)
