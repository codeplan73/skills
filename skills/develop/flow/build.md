# Develop: build flow (Steps 1-4, after the Step 0 ADR gate passes)

Read this once the Step 0 gate in `SKILL.md` clears (a decision is not owed, or the engineer chose to build anyway). It holds the post-gate build flow. Tracks are additive: a feature can be UI, Logical, or both (and may also carry a tooling sub-task); classify in Step 1 and run each part.

Guide paths below (`ui-guide.md`, `logical-guide.md`, `checklist.md`, `templates/`) are relative to the develop skill folder (the parent of this `flow/` directory).

### Step 1 — Classify the track

| Signals | Track |
|---|---|
| "page", "component", "screen", "layout", "ui"; a screenshot is attached; visual work against `design.md` | **UI** → `ui-guide.md` |
| "api", "endpoint", "service", "functionality", "logic", "data", "job", "webhook", "integration" | **Logical** → `logical-guide.md` |
| Both present (e.g. "auth": pages + session logic) | **Both** — run each track for its part |

If genuinely ambiguous, ask once: "Is this the UI, the logic behind it, or both?"

### Step 2 — Load the decision and conventions (both tracks)

Read:
1. **The governing ADR** (feature's `ADR` pointer, or Step 0), build-spec sections only: `## Requirements` (user stories + IDed acceptance criteria `AC-1…`; the contract, and the source of the Step 4 verify steps), `## Decision`, the design/spec section (`## Feature design` / `## Proposed stack` / spec table), `## Build plan` (ordered tasks tagged "— satisfies AC-N", migration as task 1), `## Consequences` (constraints). Skip `## Context`, `## Options considered`, `## Rationale` (decision history, not build input) unless a constraint needs the reasoning. Umbrella `index.md` → read the index (decision + child list; `## Structure` maps every child; the index holds any cross-child contract), then only the child ADR(s) this sub-task touches (usually one; a second only if it truly spans two, never all), build-spec sections only; a child is self-sufficient, its inline rationale is optional depth. Never read the ADR's `rationale.md` for a build (it is decision history, not build input). **Check the `Status`** (single file, or umbrella `index.md`; children carry none): `Proposed` → warn: "The governing ADR is still `Proposed`, not accepted. Build on an un-agreed decision, or accept it first (re-run `/architect` and confirm)?" and build only on go-ahead; `Superseded` → use the superseding ADR.
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

Spawn a read-only exploration subagent (Claude Code / Cursor `Explore`, Antigravity `research`, Codex `spawn_agent`; else a plain subagent, or inline if your agent has none). Set its model explicitly to a fast, low-cost tier; do not let it inherit this session's model (on Claude Code that means `model: haiku`, not the session's model). Tools `Read`/`Grep`/`Glob` only, no `Edit`/`Write`. Brief: target workspace, exact sub-task, the ADR's key interfaces; return only a compact map, files to create/edit (paths), patterns/conventions to match (`file:line`), symbols/types/helpers to reuse, and gotchas, no file contents or dumps.

Build from the map: offload the token-heavy reading, keep the deciding and writing on the main thread (Step 3).

**Rules of thumb (large repos & monorepos):** the Step 0 read scope (one workspace, one roadmap file, one governing ADR); one sub-task per run, `/clear` between features; match the model to the work (exploration and mechanical rollouts fast/cheap, deep logic and orchestration strong).

### Step 2.6 — Doc-check (only when needed): offload current-usage lookups to a web subagent

Only when you genuinely need the current usage/setup/API of a tool the ADR already decided (fast-moving or newly released, e.g. an auth library's ORM adapter wiring, a framework's latest routing/config shape) and you're unsure your knowledge is current. Most builds don't need it: for a stable, well-known stack, build from knowledge and let the typecheck/build/lint loop catch a stale API cheaply; don't web-search by default. Never to choose or reconsider a tool (`/architect`'s job): look up *how to use* the decided tool, not *whether*; if docs reveal it genuinely can't work, that's the "spec is wrong" path (Step 3), not a silent swap.

**How (capability-first):** spawn a read-only web subagent (`WebSearch`/`WebFetch` on Claude Code; the web/browse tool on Cursor/Codex/Antigravity or your agent's equivalent), with its model set explicitly to a fast, low-cost tier (do not inherit the session model; Claude Code: `model: haiku`), briefed with the exact tools and versions from the ADR and the one thing you need. Return only a compact usage summary (current call/config/setup steps, version notes, gotchas), never raw pages or site lists, so only the answer lands on the main thread; build from it. No web capability → skip: build from knowledge, lean on the build/typecheck loop to surface a stale-API mistake, note the assumption.

### Step 3 — Resume check, then build

**Task source.** Governing ADR → its `## Build plan` is the atomic checklist (AC-tagged tasks, migration first): build from it and tick progress there, the resume trail. The roadmap carries only the milestone rollup under the feature's `Build it: /develop <feature>` box (2 to 5 sub-items), updated per Step 4; `Verify it` and `Test it` belong to `/verify` and `/test`. No ADR → the roadmap checkboxes are the tasks.

**Build the coherent slice the approach calls for; don't silently skip surface.** Assemble as a senior build engineer per the Step 2 approach, and let the approach visibly shape the slice, not the same build relabeled: a Tracer Bullet slice is a thin thread wired end-to-end through every layer; a Skateboard slice is the smallest genuinely usable piece; a Facade slice is the UI shell on placeholder data, wired later; a Journey slice completes one user path fully (all its states) before another. Reason from the principle, not a recipe; none recorded → the Step 2 end-to-end default. Cross-check the task list against `## Requirements` (`AC-1…`) and the ADR's API/UI surface before building: required but uncovered (the classic missed verify-email page) → flag it and add the task. Every `AC-N` is satisfied by a task you build, or explicitly deferred with the engineer's agreement.

**Resume first; never rebuild what's done.** Use the Step 0 roadmap file only (the workspace's, in a monorepo). Status **`existing`** (shipped) or **`dropped`** (de-scoped) → not active: don't auto-build; say it's marked `<status>` and confirm reviving/modifying (a new task, possibly needing an ADR). Else find the first unchecked `[ ]` in the ADR's `## Build plan` (or the roadmap checkboxes, no ADR); `[x]` tasks are already built, don't redo them. Say where you pick up: "This feature is 4/10 done, resuming at *data integration*." Set the feature's status to `in-progress` (At-a-glance table and heading); a governing ADR's `**Status**:` line advances `Proposed` → `In Progress` surgically per Artifact ownership (re-read first; not `Proposed` → flag, don't clobber). No roadmap → just build the requested task.

**Gather remaining inline answers** (the Step 2 spec-gap answer, UI asset/template questions, an ambiguous business rule) before any build handoff; they need the engineer.

**With the Step 2.5 map in hand, the build is a write step: inline by default, subagents only when they earn it** (inline stays interactive and avoids inlining a guide plus ADR into a brief). Escalate only for:
- **A very large single build** (many files / long) that would bloat the main context → one subagent (answers already gathered, so it won't need to ask).
- **A big multi-file rollout of an already-decided pattern** (e.g. "swap inline inputs across 17 files") → fan out (below).

Everything else (a normal feature slice, a page, an endpoint) builds inline.

Tracks:

- **UI** → follow `ui-guide.md` inline (component-or-screen → stack/styling/dark-mode detection → asset resolution → tokens → font → the five phases → accessibility); the main thread keeps design/asset questions responsive.
- **Logical — normal build** → inline per `logical-guide.md` (ground in the ADR → data layer → core logic → interface → integration → correctness pass).
- **Logical — very large single build** → optionally isolate in one subagent (tools `Read, Bash, Write, Edit, Grep, Glob`). Set its model explicitly by reasoning depth, not size (size decides isolating; difficulty decides model), and don't inherit the session model: mechanical work (e.g. rote wiring of decided pieces) → a fast, low-cost tier; genuinely novel or hard logic (e.g. a concurrency-sensitive invariant) → a strong model, reserving the top tier (opus and equivalents) for the genuinely hard case. Slim brief only: the `logical-guide.md` text, the child ADR for this sub-task plus the umbrella `index.md`'s decision (not every child) or the relevant sections of a single-file ADR, the nearest `AGENTS.md`, the collected answers, the exact sub-tasks.
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

  The tool appends "Other" as a free-text option automatically. On **Save**, write/append `verify.md` beside the ADR. Single-file ADR → promote it to a directory, `docs/adr/NNNN-feature.md` → `docs/adr/NNNN-feature/{index.md, rationale.md, verify.md}` (split the decision-record sections Context/Options considered/Rationale/References into `rationale.md`, keep the build spec in `index.md`, never double the name), and repoint the roadmap feature's `ADR` link to the new `…/index.md` path. Directory ADR → drop `verify.md` in. Existing `verify.md` → append, don't clobber. Format (so `/verify` can consume it and `/test` can lock the durable steps):

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
