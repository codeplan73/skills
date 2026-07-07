---
name: develop
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion, WebSearch, WebFetch
description: "Build a feature, UI or backend, from an approved design. Run /develop to implement a page, component, API, service, or data slice. If something load bearing is undecided and no ADR records it, it stops and routes you to /architect. Otherwise it reads the ADR plus AGENTS.md and builds, advancing the roadmap."
---

## Output style (plain words, no dashes)

Write everything this skill produces (files, reports, every message to the engineer) in plain simple language, keeping technical terms that carry real meaning but explaining each in plain words. Never use dashes as punctuation (no em dash, en dash, or hyphen used as punctuation); use short sentences, commas, or parentheses instead.

## What this skill does

The builder: turns an ADR plus project conventions into working code. Tracks: **UI** (components, pages, layouts; `ui-guide.md`), **Logical** (APIs, services, data layers, business logic, integrations; `logical-guide.md`), or both (e.g. "auth" = sign-in pages plus session logic → run both). Step 0 gates on the ADR so load-bearing choices (an auth approach, a payment provider) are decided in `/architect`, not silently invented mid-build.

## Asks vs acts

Gates, then acts: no upfront question rounds like `/architect`. Read the decision, build, ask only what the design left open (a UI template when no screenshot was given; a business rule the ADR didn't settle). Infer from the ADR, `AGENTS.md`, and codebase; ask only the un-inferable; recommend local implementation choices.

## Artifact ownership

- Writes app code (plus CSS/tokens for UI).
- Roadmap (`docs/roadmap/`): only the Step 4 touches (feature status → `in-progress`, milestone sub-boxes, `Build it` box, code pointer). Never marks a feature `done` (waits for `/verify` and `/test`), never ticks `Verify it` or `Test it`, never creates files in `docs/roadmap/` (roadmaps only; analysis/research is `/architect`'s, under `docs/adr/…/research/`).
- Never writes ADRs (flags the need, defers to `/architect`); never restructures root `AGENTS.md` (that's `/audit`); new area conventions go via `/sync` afterwards.
- One ADR touch: the `**Status**:` line (umbrella decision → the `index.md`'s, never a child's), plus filling the feature's ADR pointer line. Build start: `Proposed` → `In Progress`; build lands (feature → `done`): `In Progress` → `Accepted` (an ADR is not `Accepted` until its feature ships). Never edit ADR content, only that line, surgically: re-read it right before writing; unexpected state (already `Accepted`, `Superseded`) → flag, don't clobber.
- Artifact base: `docs/` by default, `.workflow/` if `docs/` is a published docs site. Read from whichever exists (paths here assume `docs/`).
- Shared roadmap: re-read it right before ticking, edit only the specific checkbox, status, or pointer line (never rewrite the file); feature not as expected (already `done`, reworked) → flag, don't overwrite. The freshness pre-check guards against rebuilding what a teammate shipped (what `/status` reports).

---

## Portability (any OS, any agent)

Any Agent Skills client, macOS/Linux/Windows. Detection snippets are POSIX reference; use your agent's own cross-platform file tools. Builds inline by default; a very large single build or multi-file rollout may fan out to subagents (Step 3), and a doc-check may use a read-only web subagent (Step 2.6), degrading to build-from-knowledge without web capability. Bundled guides (`ui-guide.md`, `logical-guide.md`, `checklist.md`, `templates/`) are paths relative to this skill's folder; the main agent reads them. No interactive-question picker → ask the prompts as plain text with the same options.

## Execution

### Pre-check — the project must already exist (except the scaffold task)

Exception: if this IS the scaffold sub-task of the Stack and architecture foundation feature (prompt says `scaffold`, or the step initializes the project from the stack ADR), creating the project IS the job. Read the ARCHITECTURE ADR's `## Proposed stack`; run the framework's own init (`create-next-app`, `cargo new`, etc. per that stack); install base dependencies (framework, core runtime, only what the first slice needs); lay out directories; confirm a dev server or build runs. Scaffold steps derive from the stack decision (a decision ADR has no build plan). Install just-in-time: NOT every library the ADR names (email, monitoring, and so on); each later feature installs its own when built; only cross-cutting tooling (lint, format, type strictness) comes early, via `/audit` + the tooling task. Then proceed.

Otherwise `/develop` builds into an existing project. No skeleton (no `package.json`/`pyproject.toml`/`go.mod`/manifest, no source tree) and not the scaffold task → stop:

> No project found to build into. Run the scaffold step first (the Stack and architecture feature's scaffold sub-task, per your architecture ADR), then run `/develop` again.

A project exists (even a bare scaffold) → proceed.

### Pre-check — freshness & collaboration (don't build on stale state or over a teammate)

Before mutating anything (skip silently if solo, offline, or non-git): `git fetch` quietly; base = `main`, else `master`; behind count (`git rev-list --count HEAD..origin/<base>`); uncommitted work (`git status --short`).

- Behind (count > 0) → stop and warn: "You're N commits behind `origin/$BASE`. A teammate may have already changed or shipped this. Pull first, then run again."
- Uncommitted work in the area you'll touch → warn: "You have uncommitted changes here. Commit or stash first so this build doesn't tangle with them." Let them proceed if they insist.
- Feature `in-progress` in the roadmap AND its code area (pointer line's path) has recent commits by another author (`git log --format='%an' -- <area>`) → warn: "*<feature>* looks like it's mid-build by someone else. Coordinate before continuing it." Confirm before proceeding.

Warnings, not hard blocks, but surface them.

### Step 0 — The ADR gate (always first)

Is a decision owed and unrecorded? The test:

> **To build this, would you have to *invent* something the engineer hasn't decided?**

If yes, stop and route to `/architect` (its ADR is the build spec; `/develop` implements decisions, it doesn't make them). You'd have to invent:

- **A provider, library, integration, data model, or cross-cutting pattern** (e.g. auth provider, DB/ORM, caching strategy).
- **A whole UI page or screen**: its design system (`design.md` there? if not, which direction?), sections/composition, component inventory, asset strategy (no screenshot, no repo images → e.g. an online source). Owed unless a `design.md` AND a page-level spec/ADR pin these down.
- **A feature's behavior** (search, a wizard: "what exactly should it do?" is open; `/architect` asks those questions). Owed unless an ADR specs it.

NOT owed for pure implementation already specified: a small bug fix, a component matching an existing `design.md`, wiring already-decided pieces, a copy tweak, anything an existing ADR/`design.md`/`AGENTS.md` governs.

Don't hardcode to page names; apply the invent-test to whatever was asked (a "home page" or "search filter" fails on a fresh project, passes once an ADR/`design.md` exists). False negatives are the failure mode, building a real decision without noticing (what "just build the home page" looks like): when unsure, treat as owed and ask (panel below).

Read only what this feature needs, never the whole `docs/` tree: its one roadmap file and its one governing ADR (single file, or umbrella `index.md` plus the one child speccing this sub-task). No other features' rows, roadmap files, workspaces, or unrelated ADRs.

**Check, in order:**
1. **Locate this feature's roadmap file (only that one).** Monorepo → `docs/roadmap/<workspace>/` for the task's package. Pick the file (`roadmap.md`, or the matching `<epic>.md` in a split) from the At-a-glance table alone; read just this feature's section. `needs a decision` with no ADR pointer yet → decision owed and missing. Malformed → flag and ask, don't guess.
2. **Open the governing ADR via the feature's `ADR` pointer**, reading only its build-spec sections as defined in Step 2 item 1. Found → it's the spec; proceed. No pointer and no linked ADR → targeted look in `docs/adr/<workspace>/` for one matching this feature's scope, never a blanket read.
3. The **nearest** `AGENTS.md` (workspace/area) may already capture the decision, synced from an earlier feature (e.g. "the auth provider is already chosen") → proceed without a new ADR.

Decision owed and unrecorded → don't guess, don't silently stop. Ask (single-select; `AskUserQuestion` on Claude Code):

- **question**: "This looks like it needs an architecture decision first: `<name the specific load-bearing choice, e.g. 'which auth provider + session model'>`. How do you want to handle it?"
- **header**: "ADR first?"
- **options**:
  1. `Architect it first` — "Recommended. Capture the decision in an ADR before building, so the build has a spec." → **end here** with the handoff below. Do not build.
  2. `No, not needed` — "I've judged there's no real decision here; build directly." → proceed to Step 1.
  3. `Skip for now` — "Build it without an ADR; I'll backfill the decision later." → proceed to Step 1, leaving the feature's `Needs ADR?` = `yes` with a `⚠ ADR pending` note in the roadmap (`docs/roadmap/`).

The tool appends "Other" as a free-text option automatically.

On `Architect it first`, end with:

> Run this next, then come back to `/develop`:
> ```
> /architect <feature>: <the specific decision to settle>
> ```
> Once the ADR exists, re-run `/develop <task>` and I'll build to it.

No decision owed (pure implementation) → skip the question, proceed.

### Step 1 — Classify the track

| Signals | Track |
|---|---|
| "page", "component", "screen", "layout", "ui"; a screenshot is attached; visual work against `design.md` | **UI** → `ui-guide.md` |
| "api", "endpoint", "service", "functionality", "logic", "data", "job", "webhook", "integration" | **Logical** → `logical-guide.md` |
| Both present (e.g. "auth": pages + session logic) | **Both** — run each track for its part |

If genuinely ambiguous, ask once: "Is this the UI, the logic behind it, or both?"

### Step 2 — Load the decision and conventions (both tracks)

Read:
1. **The governing ADR** (feature's `ADR` pointer, or Step 0), build-spec sections only: `## Requirements` (user stories + IDed acceptance criteria `AC-1…`; the contract, and the source of the Step 4 verify steps), `## Decision`, the design/spec section (`## Feature design` / `## Proposed stack` / spec table), `## Build plan` (ordered tasks tagged "— satisfies AC-N", migration as task 1), `## Consequences` (constraints). Skip `## Context`, `## Options considered`, `## Rationale` (decision history, not build input) unless a constraint needs the reasoning. Umbrella `index.md` → read the index (decision + child list; `## Structure` maps every file; the index holds any cross-child contract), then only the child ADR(s) this sub-task touches (usually one; a second only if it truly spans two, never all), build-spec sections only; a child is self-sufficient, its `## References` research is optional depth. **Check the `Status`** (single file, or umbrella `index.md`; children carry none): `Proposed` → warn: "The governing ADR is still `Proposed`, not accepted. Build on an un-agreed decision, or accept it first (re-run `/architect` and confirm)?" and build only on go-ahead; `Superseded` → use the superseding ADR.
2. **The nearest `AGENTS.md`** to the target code area (Claude Code auto-loads it; read explicitly to be sure). It carries decisions synced from earlier features: don't re-ask what's settled.
3. **`design.md`** (UI track only): the visual source of truth.
4. **The build approach**, precedence: the feature's roadmap-row `Approach` override if declared, else the project default in root `AGENTS.md`, else the roadmap file's header (a feature with its own approach, e.g. a Facade prototype in a Skateboard project, builds by ITS approach). Strategies: vertical end-to-end slice, thinnest usable whole, UI-shell-first prototype wired later, full user journey per phase. Governs *how you assemble* the slice in Step 3, not *what* it contains (the ADR fixes that). None recorded → default to a coherent end-to-end slice, every layer the feature spans (data → logic → interface → UI). Reason from the strategy's principle, not a fixed per-approach recipe.
5. **Tool skills**: the ADR's `## Decision` **Implementation skills** field names them (e.g. an ORM, an auth library); `AGENTS.md` records what's installed. Open the `SKILL.md` (its path is real and readable) of each one materially governing the code you're about to write and follow its conventions. On demand only: just the skills this sub-task touches, not all. On Claude Code a skill may auto-activate; read it explicitly anyway. Unreadable → build from the ADR plus knowledge, note it.

**Monorepo: work inside the target workspace.** Workspaces config or `apps/*`/`packages/*` manifests → identify the feature's workspace (code pointer, or task path) and operate there: its nested `AGENTS.md` and `design.md`, its `package.json`/stack, write into its tree, run its commands (`dev`/`build`/`test`, e.g. `pnpm --filter <workspace> …` or `turbo run … --filter`). Pre-checks apply to that workspace; its roadmap is `docs/roadmap/<workspace>/`.

**Precedence on conflict:** the ADR wins for the feature it governs; `AGENTS.md` is the general convention (`AGENTS.md` says Jest, this ADR says "Vitest for this" → Vitest for this feature). Flag the conflict ("ADR <NNNN> diverges from `AGENTS.md` on X — `/sync` should reconcile") rather than silently picking. ADR silent on a point → `AGENTS.md` governs.

**Spec-completeness check (before building, not mid-build).** Confirm the ADR has what this task needs: logical → data model, API surface, security model, key invariants; UI → the screens and their states/requirements. A load-bearing section missing or a placeholder → don't guess; ask:
- **question**: "The ADR for this is missing `<section>`. I need it to build correctly. How do you want to proceed?"
- **header**: "ADR gap"
- **options**: `Update the ADR first` (recommended: end with a paste-ready `/architect <feature>: fill in <section>` handoff) · `Tell me the answer now` (engineer supplies it inline; proceed, note it should be backfilled into the ADR) · `Use your best judgment` (proceed on a stated assumption, surfaced in the report for review).

### Step 2.5 — Explore before building (isolate the reading — the top monorepo win)

Locating files to touch and patterns/interfaces to match and reuse means reading code, the top context cost in a large or monorepo repo (inline, every opened file stays in the main context all session). Isolate it in a read-only subagent that returns a compact map (~1–2k tokens).

- **Skip it** when the change is tiny and you already know the single file.
- **Run it** for an unfamiliar area, several files, or a large/monorepo repo.

Spawn a read-only exploration subagent (Claude Code / Cursor `Explore`, Antigravity `research`, Codex `spawn_agent`; else a plain subagent, or inline if your agent has none) on a fast, low-cost model (e.g. `haiku`/`sonnet` on Claude Code), tools `Read`/`Grep`/`Glob` only, no `Edit`/`Write`. Brief: target workspace, exact sub-task, the ADR's key interfaces; return only a compact map, files to create/edit (paths), patterns/conventions to match (`file:line`), symbols/types/helpers to reuse, and gotchas, no file contents or dumps.

Build from the map: offload the token-heavy reading, keep the deciding and writing on the main thread (Step 3).

**Rules of thumb (large repos & monorepos):** the Step 0 read scope (one workspace, one roadmap file, one governing ADR); one sub-task per run, `/clear` between features; match the model to the work (exploration and mechanical rollouts fast/cheap, deep logic and orchestration strong).

### Step 2.6 — Doc-check (only when needed): offload current-usage lookups to a web subagent

Only when you genuinely need the current usage/setup/API of a tool the ADR already decided (fast-moving or newly released, e.g. an auth library's ORM adapter wiring, a framework's latest routing/config shape) and you're unsure your knowledge is current. Most builds don't need it: for a stable, well-known stack, build from knowledge and let the typecheck/build/lint loop catch a stale API cheaply; don't web-search by default. Never to choose or reconsider a tool (`/architect`'s job): look up *how to use* the decided tool, not *whether*; if docs reveal it genuinely can't work, that's the "spec is wrong" path (Step 3), not a silent swap.

**How (capability-first):** spawn a read-only web subagent (`WebSearch`/`WebFetch` on Claude Code; the web/browse tool on Cursor/Codex/Antigravity or your agent's equivalent) on a fast, low-cost model, briefed with the exact tools and versions from the ADR and the one thing you need. Return only a compact usage summary (current call/config/setup steps, version notes, gotchas), never raw pages or site lists, so only the answer lands on the main thread; build from it. No web capability → skip: build from knowledge, lean on the build/typecheck loop to surface a stale-API mistake, note the assumption.

### Step 3 — Resume check, then build

**Task source.** Governing ADR → its `## Build plan` is the atomic checklist (AC-tagged tasks, migration first): build from it and tick progress there, the resume trail. The roadmap carries only the milestone rollup under the feature's `Build it: /develop <feature>` box (2 to 5 sub-items), updated per Step 4; `Verify it` and `Test it` belong to `/verify` and `/test`. No ADR → the roadmap checkboxes are the tasks.

**Build the coherent slice the approach calls for; don't silently skip surface.** Assemble as a senior build engineer per the Step 2 approach: a coherent slice, not a loose bag of tasks (a tracer-bullet slice wired end-to-end; a Facade's UI shell on placeholder data, wired later); reason from its principle, not a recipe; none recorded → the Step 2 end-to-end default. Cross-check the task list against `## Requirements` (`AC-1…`) and the ADR's API/UI surface before building: required but uncovered (the classic missed verify-email page) → flag it and add the task. Every `AC-N` is satisfied by a task you build, or explicitly deferred with the engineer's agreement.

**Resume first; never rebuild what's done.** Use the Step 0 roadmap file only (the workspace's, in a monorepo). Status **`existing`** (shipped) or **`dropped`** (de-scoped) → not active: don't auto-build; say it's marked `<status>` and confirm reviving/modifying (a new task, possibly needing an ADR). Else find the first unchecked `[ ]` in the ADR's `## Build plan` (or the roadmap checkboxes, no ADR); `[x]` tasks are already built, don't redo them. Say where you pick up: "This feature is 4/10 done, resuming at *data integration*." Set the feature's status to `in-progress` (At-a-glance table and heading); a governing ADR's `**Status**:` line advances `Proposed` → `In Progress` surgically per Artifact ownership (re-read first; not `Proposed` → flag, don't clobber). No roadmap → just build the requested task.

**Gather remaining inline answers** (the Step 2 spec-gap answer, UI asset/template questions, an ambiguous business rule) before any build handoff; they need the engineer.

**With the Step 2.5 map in hand, the build is a write step: inline by default, subagents only when they earn it** (inline stays interactive and avoids inlining a guide plus ADR into a brief). Escalate only for:
- **A very large single build** (many files / long) that would bloat the main context → one subagent (answers already gathered, so it won't need to ask).
- **A big multi-file rollout of an already-decided pattern** (e.g. "swap inline inputs across 17 files") → fan out (below).

Everything else (a normal feature slice, a page, an endpoint) builds inline.

Tracks:

- **UI** → follow `ui-guide.md` inline (component-or-screen → stack/styling/dark-mode detection → asset resolution → tokens → font → the five phases → accessibility); the main thread keeps design/asset questions responsive.
- **Logical — normal build** → inline per `logical-guide.md` (ground in the ADR → data layer → core logic → interface → integration → correctness pass).
- **Logical — very large single build** → optionally isolate in one subagent (tools `Read, Bash, Write, Edit, Grep, Glob`). Model by reasoning depth, not size (size decides isolating; difficulty decides model): mechanical work (e.g. rote wiring of decided pieces) fast/cheap; genuinely novel or hard logic (e.g. a concurrency-sensitive invariant) strong. Slim brief only: the `logical-guide.md` text, the child ADR for this sub-task plus the umbrella `index.md`'s decision (not every child) or the relevant sections of a single-file ADR, the nearest `AGENTS.md`, the collected answers, the exact sub-tasks.
- **Logical — big rollout** →
  1. **Primitive first, serially**: one subagent builds the shared thing (helper/module/schema) and confirms it typechecks.
  2. **Fan out**: parallel subagents, one per file or small router-group, each with a tiny brief: "apply `<primitive>` (signature: …) to `<file>` per the pattern in ADR `<link>`; preserve exact behavior." Each carries only its own file plus the primitive's API, not the full guide or other files.
  3. **Gate once at the end**: package-wide typecheck/lint and `/verify` after the fan-out, not per subagent. Remove the superseded code only on this green sweep (ALL sites migrated AND typecheck/lint passing): un-migrated sites still reference it, deleting early breaks the build.
  4. **Partial failure; don't half-migrate**: if some subagents fail or return partial, keep the old code, leave the feature `in-progress`, report migrated-vs-pending sites explicitly (which files landed, which remain, each failure's error), and say re-running `/develop` resumes the pending sites (it detects and skips migrated ones; idempotent and resumable). The old code comes out on the run where the last site lands green.
- **Both** → track order follows the build approach, not a fixed rule. Default (and for an end-to-end / tracer-bullet slice): logical interface first so the UI binds to something real, then UI. Facade (UI-shell-first): UI on placeholder data first, wire the logical layer after.

**Spec wrong mid-build → update the ADR before patching; never silently diverge.** The ADR proves wrong or incomplete mid-build (e.g. the decided data model can't hold, or an acceptance criterion contradicts the API surface): if building correctly means deviating from the spec, STOP before coding the deviation, route to `/architect` to update or supersede the ADR (paste-ready `/architect <feature>: <what the spec got wrong>`), resume once the ADR reflects reality.

**A data-layer build isn't done until its migration is applied and verified**: generate the migration, run it against the target DB, confirm the schema is live (tables/columns/relationships exist; query the DB or its introspection, not just the migration file) before ticking. Generated but unapplied = un-done. (`logical-guide.md`, Phase 2.)

**Remove superseded code; old and new must not coexist.** A build that replaces an existing pattern or implementation (a refactor, or an approach-swapping rollout) includes the deletion, not as optional cleanup: remove dead functions, unreachable branches, orphaned files, unused imports; verify nothing still references them (search for callers/imports; typecheck/build/lint clean with the old code gone). Old and new side by side = not done. Timing: single-site → delete the moment the new code is in and typecheck is green; multi-site rollout → per rollout points 3 and 4 above. (Elaborated in `logical-guide.md`.)

**Follow the ADR's verify protocol.** If the ADR specifies how to verify (common with no test runner, e.g. "`pnpm -F <pkg> typecheck` must pass after every sub-task", or "diff API responses before/after"), run exactly that after each sub-task/batch; a sub-task isn't done until it passes. Don't assume a test suite exists.

### Step 4 — Update the roadmap and report

- **Only mark what actually landed.** Confirm first: files written, build subagent returned success (not an error or empty result), code present; data-layer task → migration applied and schema confirmed live, not merely generated. Failed or partial build (subagent errored, interrupted, half-done sub-task) → leave the task unchecked, keep the feature `in-progress`, report exactly what's incomplete and why. Never mark a task `done` on an unverified or failed build.
- **Tick atomic tasks in the ADR, milestones in the roadmap** (only what you verified built, only in the Step 0 roadmap file): each completed `## Build plan` task in the ADR; a milestone sub-box when its ADR tasks are done; the `Build it` box when all milestones are done; fill the pointer line (`code in <path>`). Do NOT tick `Verify it` or `Test it`; leave the status `in-progress` (built but unverified, untested is not `done`); tell the engineer to run `/verify <feature>` next. Only `/test` (with `/verify` passed) closes a feature to `done`. No-ADR feature → tick its roadmap checkbox(es) directly.
- **Mirror `done` onto the governing ADR.** When (and only when) the feature reaches `done` (every sub-task checked, build verified), advance the ADR's `**Status**:` line `In Progress` → `Accepted` ("done and dusted"; never while `in-progress`), surgically per Artifact ownership: re-read first; not `In Progress` (already `Accepted`, `Superseded`) → flag, don't clobber.
- **Emit verify steps, then ASK where they go (every run — never auto-save).** Derive concrete verification steps from the ADR's acceptance criteria, actionable and specific, each tied to its `AC-N`, not vague advice (e.g. "visit `/signup` → sign up → expect redirect to `/auth/verify-email` → AC-1", "run `<migrate cmd>` → query confirms tables live → AC-4"). Always present this panel; write `verify.md` only on "Save" (single-select; `AskUserQuestion` on Claude Code):
  - **question**: "Save these verify steps to the feature's `verify.md`, or just show them in this summary?"
  - **header**: "Save verify steps?"
  - **options**:
    1. `Save to verify.md` — "Recommended for data, auth, or full-weight features: a durable checklist `/verify` can run and `/test` can later lock." → write/append the steps to `verify.md` (below).
    2. `Just show in summary` — "Keep them inline in this report only; don't write a file." → include them in the report and stop.

  The tool appends "Other" as a free-text option automatically. On **Save**, write/append `verify.md` beside the ADR. Single-file ADR → promote it to a directory, `docs/adr/NNNN-feature.md` → `docs/adr/NNNN-feature/{index.md, verify.md}` (rename the ADR file to `index.md`, never double the name; same promotion rule `research/` uses), and repoint the roadmap feature's `ADR` link to the new `…/index.md` path. Directory ADR → drop `verify.md` in. Existing `verify.md` → append, don't clobber. Format (so `/verify` can consume it and `/test` can lock the durable steps):

  ```markdown
  # Verify: <feature> · ADR NNNN · updated <date>
  _Steps derived from ADR NNNN acceptance criteria. `/verify` runs these; `/test` locks the durable ones._
  ## UI / manual
  - [ ] <action> → <expected>        → AC-N
  ## Commands
  - [ ] `<command>` → <expected>     → AC-N
  ## Acceptance-criteria coverage
  - AC-1 … covered by step … · AC-2 … · …
  ```
- Relay the track's report (the `## /develop complete` block from `ui-guide.md` and/or `logical-guide.md`).
- Recommend the next step per tier: usually `/verify` (run the steps just emitted/saved), then `/test` to lock the durable ones, then `/sync` to promote new area conventions into `AGENTS.md`. Always end by advising `/clear` before the next feature (the roadmap, ADR, and `AGENTS.md` hold the state, so a fresh session loses nothing; long sessions cost more even when cached). Suggest `/compact` mid-build if this single feature runs long. (On Claude Code `/clear` / `/compact`; your agent's fresh-session equivalent elsewhere.)

`/develop` builds; it does not run `/verify`, `/test`, `/sync`, or `/architect` for you — it points; you decide.

---

## Reference files

- UI build track: `ui-guide.md`
- Logical build track: `logical-guide.md`
- Accessibility checklist (UI track, Phase 5): `checklist.md`
- Design templates (UI track): `templates/`
- Project design system (UI track): `./design.md`
