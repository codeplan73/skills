# Engineering Workflow Skills

A set of [Agent Skills](https://agentskills.io) that encode a complete, tiered, phase-based engineering workflow — from **a vague idea** to **shipped, documented, verified code** — for any AI coding agent.

The core idea: **one skill per phase, one artifact per skill.** Each skill does a single job well, writes its results to a durable file (a roadmap, an ADR, a context file), and hands off to the next. Because the state lives in files — not in a chat session — work survives across sessions, picks up where it left off, and works for a whole team.

```
idea ─▶ /mvp ─▶ /triage ─▶ /audit ─▶ /architect ─▶ /develop ─▶ /verify ─▶ /test ─▶ /review ─▶ /harden ─▶ /document ─▶ /sync
        scope    plan       map        decide        build       see it      lock     review     stress     write up    keep current
                                                                   work        in
        └────────────────────────── /status (orient anytime) ───────────────────────────┘   /debug (root-cause a bug, anytime)
```

---

## Quick start

Install into your agent (see [Install](#install) for all options):

```bash
# Claude Code
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code   # then restart Claude Code
```

Then, depending on where you're starting:

**A brand-new product**
```
/mvp a B2B SaaS for managing freelance contracts
```
→ asks about scope, monetization, SEO, etc., and writes a prioritized, buildable **roadmap** with paste-ready prompts for every step.

**An existing codebase (first time)**
```
/audit          → reads the repo, writes AGENTS.md context files
/mvp <next slice>  → plans what's next on top of what's already there
```

**Any single change**
```
/triage fix the double-charge bug on checkout
```
→ sizes the work and points you at the right skill (here, `/debug`).

`/status` at any time tells you where things stand and what's safe to pick up.

---

## The skills

| Skill | Phase | What it does |
|---|---|---|
| [`mvp`](skills/mvp/) | **Scope** | Turns an idea into a prioritized, granular feature roadmap in `docs/mvp/` — each feature broken into ordered build sub-tasks with **ready-to-paste prompts**. |
| [`triage`](skills/triage/) | **Plan** | Sizes a change (risk tier + severity) and picks the playbook — including routing bugs to `/debug` rather than the build path. |
| [`audit`](skills/audit/) | **Map** | Writes the `AGENTS.md` context files every other skill reads — asks your standards on greenfield, scans the code on brownfield, per-area (and per-workspace) nesting. |
| [`architect`](skills/architect/) | **Decide** | Staff-engineer system design: grills you with **feature-specific** questions, recommends choices aligned to your stack, and writes a complete build-spec **ADR** to `docs/adr/`. |
| [`develop`](skills/develop/) | **Build** | Builds a feature — UI *and* logic — from its ADR. **Gates on the decision first**: if building would mean inventing something undecided, it routes you to `/architect`. |
| [`verify`](skills/verify/) | **Verify** | Runs the *real app* and confirms the change works end-to-end — not just that unit tests are green. |
| [`test`](skills/test/) | **Verify** | A senior test suite for your uncommitted change; detects/saves your framework. |
| [`review`](skills/review/) | **Verify** | Rigorous code review on a **different model** than wrote the code, so a fresh set of eyes catches what the author missed. |
| [`harden`](skills/harden/) | **Verify** | Systems-level adversarial pass for concurrency, scale, and security failure modes (for `full`-tier work). |
| [`debug`](skills/debug/) | **Fix** | A disciplined root-cause loop — reproduce, localize, hypothesize, prove, fix at the root, add a regression test. |
| [`document`](skills/document/) | **Ship** | PR text, changelog, release notes, or a postmortem — drafted from the real diff. |
| [`sync`](skills/sync/) | **Close** | Keeps `AGENTS.md` current, **reconciles the roadmap** from what actually shipped, and flags ADRs the change made stale. |
| [`status`](skills/status/) | **Orient** | Reads git + roadmap + ADRs to show what's done, what's in progress, what's safe to pick up, and any **plan-vs-reality drift** — across a paused session or a team. |

---

## How the workflow flows

You rarely run all thirteen. `/triage` (or the roadmap) tells you which subset a given piece of work needs.

### Greenfield — a new product
1. **`/mvp`** decomposes the idea into a roadmap, foundations first: coding standards → stack → design system → features.
2. Walk the roadmap. For each foundation/feature it tells you the exact commands to run (e.g. `/audit` to capture standards, `/architect` to choose the stack).
3. Then the per-feature loop (below), UI-first: build every page against placeholder data so the app is clickable early, then wire in auth, the database, and real data one page at a time.

### Brownfield — an existing codebase
1. **`/audit`** reads the repo and writes the `AGENTS.md` context files (root + per-area), so every later skill understands your project.
2. **`/mvp`** plans the next slice *on top of what exists* — it enrolls already-built features (as `existing`) so the roadmap is a complete picture, and plans only the new work.
3. Per-feature loop.

### The per-feature loop (the heart of it)
```
/architect   →  /develop   →  /verify  →  /test  →  /harden*  →  /review  →  /document  →  /sync
(if a decision    build from     see it      lock      stress       fresh-       write it       update
 is owed → ADR)   the ADR        work         in        (risky)*     model        up             context + roadmap
```
`/develop` **gates** on the ADR: if the feature needs a design system, a provider, a data model, or a behavior you haven't decided, it stops and sends you to `/architect` first. The ADR it produces *is* the build spec. `*`harden only on `full`-tier work (payments, auth, migrations).

**Bugs** skip this entirely: `/debug` runs a root-cause loop and hands a regression test to `/test`.

---

## Artifacts — what gets written, and where

Each skill owns exactly one kind of artifact, so there's no overlap and nothing to keep in sync by hand:

| Artifact | Path | Owned by |
|---|---|---|
| **Feature roadmap** | `docs/mvp/` | `mvp` creates · `develop`/`sync` advance status |
| **ADRs** (decisions) | `docs/adr/` | `architect` |
| **Context files** | `AGENTS.md` (root + nested) + a thin `CLAUDE.md` pointer | `audit` creates · `sync` maintains |
| **App code** | your source tree | `develop` |
| **Tests** | your test dirs | `test` |
| **Review findings** | `docs/reviews/` | `review` |
| **Hardening checklists** | `docs/hardening/` | `harden` |
| **Human docs** | PR body, `CHANGELOG.md`, `docs/releases/`, `docs/postmortems/` | `document` |

> If `docs/` is a *published* docs site (Docusaurus, VitePress, MkDocs, Starlight, Nextra), the workflow artifacts move to `.workflow/` automatically so they don't ship to your site.

### The roadmap model (`docs/mvp/`)

`/mvp` writes a roadmap with an **overview table** and a **per-feature build breakdown**. Every sub-task carries the exact command to run:

```markdown
### 4. Home page  ·  Needs ADR: yes  ·  Status: planned
- [ ] Decision (ADR) — `/architect home page — composition, sections, asset strategy`
- [ ] UI (placeholder data) — `/develop home page UI — build to design.md with mock data`
- [ ] Data integration — `/develop home page wire-up — swap mock for real data`
- [ ] SEO & metadata — `/develop home page SEO — title/meta/OG`
- [ ] Tests — `/test home page`
```

**Feature statuses:** `planned` → `in-progress` → `done` (the pipeline lifecycle), plus `existing` (predated this workflow, enrolled for context) and `dropped` (de-scoped, kept for history). **ADR statuses:** `Proposed` → `Accepted` (on your confirmation) → `Superseded`.

`/develop` ticks sub-tasks as it builds; `/sync` reconciles the rest from what actually shipped; `/status` reports it all and flags drift (code or ADRs that exist but aren't on the roadmap).

---

## Tiers — right-sizing the process

The amount of process scales with risk. `/triage` picks the tier and the subset of skills to run, so a typo doesn't get the full treatment and a payments change doesn't get skipped.

| Tier | When | Playbook |
|---|---|---|
| **just-do-it** | Trivial, reversible, one file | act directly |
| **lean** | Small, self-contained | `/develop → /verify → /test → /document` |
| **medium** | Cross-cutting, new dependency, shared state | `/audit → /architect → /develop → /verify → /test → /review → /document` |
| **full** | Auth, payments, migrations, high blast radius | adds `/harden` and `/sync` |

A **fix** (something broken) takes the fix path — `/debug → /test → /sync` — not the build playbook.

---

## Monorepo

The workflow is first-class on monorepos (pnpm/turbo/nx workspaces, or `apps/*`/`packages/*`). The principle: **everything scopes to the target workspace, which has its own stack, conventions, commands, and roadmap.**

- **`/audit`** gives each workspace its own nested `AGENTS.md` (its stack + scoped commands), seeded even on a fresh scaffold; the root `AGENTS.md` holds only monorepo-wide concerns.
- **`/mvp`** writes a roadmap *per workspace* (`docs/mvp/web/`, `docs/mvp/api/`), with shared foundations and cross-app features in `docs/mvp/_root/`. `/mvp web <idea>` scopes to one app.
- **`/architect`** reads *that workspace's* stack (apps often differ — Next.js web, Go api, RN mobile) and won't assume one.
- **`/develop`** builds in the right workspace using its commands (`pnpm --filter web …`); **`/verify`** runs the specific app; **`/test`** resolves per package root; **`/sync`** reconciles the right workspace's roadmap; **`/status`** reports per workspace.

So `/mvp web` → `/architect` (reads `apps/web`'s stack) → `/develop` (builds in `apps/web`) flows cleanly, app by app.

---

## Working in a team

The artifacts are shared files, so the skills are built for concurrent use:

- **Branch per feature.** Two people on one branch collide on code *and* on the roadmap/ADRs/`AGENTS.md`. Branch-per-feature is what makes the rest work.
- **Freshness checks.** `/develop`, `/architect`, and `/sync` warn if you're behind the remote (a teammate may have shipped this) or have uncommitted work, before they mutate anything.
- **Concurrent-build warning.** `/develop` flags a feature already `in-progress` with recent commits by someone else.
- **Safe concurrent edits.** Skills re-read shared files immediately before writing, make surgical edits, and flag rather than clobber on unexpected state. `/architect` guards against ADR-number collisions.
- **Orientation.** `/status` shows what's done, what's in progress (and by whom), whether you're behind, and any plan-vs-reality drift — so you can pick up safely.

---

## Compatibility

These skills follow the open Agent Skills format and are written to be **portable**:

- **Any OS** — macOS, Linux, and Windows. `git` is the only required CLI (identical everywhere); every other step uses your agent's own cross-platform file tools rather than POSIX utilities like `find`/`grep`/`sed`.
- **Any client** — they install on any skills-compatible agent (Claude Code, Cursor, Copilot, Codex, Gemini CLI, and [more](https://agentskills.io/clients)). Bundled files are referenced by relative paths, and anything a subagent needs is passed into its prompt as text, so nothing depends on a fixed install location.
- **Tuned for Claude Code** — several use Claude Code features (subagents, model selection for cross-model review, interactive questions). On clients without those, the format installs cleanly and the orchestration steps degrade gracefully (e.g. the review runs inline instead of on a second model).

## Install

Using [`npx skills`](https://github.com/vercel-labs/skills). **The install folder depends on the agent you target with `-a`** — pick the one(s) you use:

```bash
# Claude Code → installs into .claude/skills/
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code

# No -a → installs into the generic .agents/skills/ (read by Codex and other agents)
npx skills@latest add JavaScript-Mastery-Pro/pilot

# Both at once → creates BOTH .claude/skills/ and .agents/skills/
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code -a codex

# See what's available, or install just one
npx skills@latest add JavaScript-Mastery-Pro/pilot --list
npx skills@latest add JavaScript-Mastery-Pro/pilot --skill review -a claude-code

# Install globally (for your user, all projects) with -g
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code -g
```

> **Which folder?** Each agent reads its own directory: **Claude Code → `.claude/skills/`**, while Codex and several others read the shared **`.agents/skills/`**. If you want a skill in two tools, install for both (e.g. `-a claude-code -a codex`) — you'll then have both folders, each with its own copy. After installing for Claude Code, **restart it** so the skills load.

Commit the installed skills folder(s) to share the same workflow with your team.

## Local development

The canonical source for every skill is the top-level **`skills/`** directory — that's the single copy `npx skills` publishes and installs, so there are no duplicates.

If you want Claude Code to use these skills *while developing this repo* (Claude Code reads from `.claude/skills/`), create a local link — `.claude/` is git-ignored, so this never ships and can't double-list in `npx skills`:

```bash
# macOS / Linux
mkdir -p .claude && ln -s ../skills .claude/skills

# Windows (PowerShell — junction, no admin needed)
New-Item -ItemType Junction -Path .claude\skills -Target skills
```

Validate any skill against the spec with [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref):

```bash
npx skills-ref validate ./skills/<name>
```

---

Built with the [Agent Skills](https://agentskills.io) open format.
