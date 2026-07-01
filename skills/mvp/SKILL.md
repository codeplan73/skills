---
name: mvp
compatibility: Built for Claude Code — uses interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: "Use this skill to turn a product idea into a prioritized, buildable roadmap. Run /mvp at the start of a new product, when you don't know what to build first, or when scoping the next batch of features on an existing app. As a senior product engineer it asks across business, product, and SEO, then decomposes the product into small features — each broken into ordered build sub-tasks with ready-to-paste prompts — and writes the roadmap to docs/mvp/. It plans; it doesn't design individual features (/architect), write code (/develop), or create ADRs."
---

## What this skill does

Turns an idea into an ordered, detailed build plan. It is the entry point when the question is *"what do I build, in what order, and what are all the pieces of each?"* — not *"how do I build this one thing?"* (that's /architect and /develop).

1. **Asks comprehensively** — business and product (what it is, who it's for, the MVP boundary, monetization, success metric), capabilities (auth, payments, file upload, search, notifications, admin…), and cross-cutting / go-to-market concerns (SEO, performance, analytics, accessibility, i18n, legal/compliance).
2. **Decomposes into features and orders them** — by dependency and value, flagging which carry a load-bearing decision (`/architect` first) vs pure implementation (`/develop` directly).
3. **Breaks every feature into its build sub-tasks** — small, granular features (one page or unit each), and for every sub-task the **exact skill, in order, with a ready-to-paste prompt** (e.g. `/architect home page — composition, sections, asset strategy` then `/develop home page UI — build to design.md with placeholder data`). The breakdown *is the build script*. This is what makes the roadmap actionable, not a wishlist.
4. **Writes the roadmap under `docs/mvp/`** — overview table + per-feature build breakdown + build order.

It does one decomposition pass and hands you a detailed, checkable plan. Walking it — architecting and building each sub-task — is the rest of the workflow.

## Asks vs acts

**Senior product engineer role.** You are scoping a product you'll be judged on shipping — be thorough across *all* dimensions, not just the fun ones. Same **infer / ask / recommend** discipline as /architect:
- **INFER** what the idea already tells you (product category, obvious capabilities) — don't ask it.
- **ASK** the un-inferable across business, product, and go-to-market — in as many batched rounds as needed (up to 4 questions per `AskUserQuestion` call).
- **RECOMMEND** the build order, the per-feature sub-task breakdown, and which features need an ADR — those are expert calls; present them, don't make the engineer sequence their own backlog.

## Artifact ownership

`docs/mvp/` — the **feature roadmap**, created and maintained by this skill. The first planning pass writes **`docs/mvp/01-mvp.md`**; a later distinct planning pass (a new slice on a brownfield repo) writes the next number — `docs/mvp/02-<slice>.md`, `03-…` — so each plan is its own numbered document. Clean separation from `/architect`, which owns `docs/adr/` (the ADR files). Other skills find the roadmap by looking in `docs/mvp/` (the numbered file containing the feature). When continuing an existing plan, **merge** into its file: add new features/sub-tasks, never clobber existing rows or rewrite their status. **`docs/mvp/` holds roadmap files only** — never inventories, analyses, or research docs (those are decision-support and live *with the ADR*, under `docs/adr/…/research/`, owned by `/architect`). Writes nothing else — no ADR files, no code, no AGENTS.md.

Status lifecycle — **`/mvp` sets the *initial* status, the pipeline advances it from there:**
- New features start `planned` (sub-tasks `todo`). On **brownfield**, `/mvp` also sets enrolled pre-existing features to **`existing`** (complete) or **`in-progress`** (partial) — this is the one place `/mvp` writes a status other than `planned`.
- From there, **`/develop`** advances *pipeline-built* work (`in-progress` → `done`) and **`/sync`** reconciles against the diff.
- **`done` ≠ `existing`**: `done` means *this pipeline* built and verified it; `existing` means it predates the workflow. `/develop` and `/sync` never touch `existing` rows (they have no sub-tasks).
- **Pivots**: when re-planning, `/mvp` may set a de-scoped feature to **`dropped`** — it **never deletes rows**. `dropped` keeps the history visible and excludes the feature from active counts and work. `/develop` and `/sync` skip `dropped` rows.

**Artifact base.** The roadmap lives under `docs/` by default. If `docs/` is a *published* docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` instead (`.workflow/mvp/01-mvp.md`). **Always follow whichever base — `docs/` or `.workflow/` — already exists** (paths here assume `docs/`).

**Concurrency & collaboration.** The roadmap is shared across sessions and teammates. **Re-read it immediately before writing** (it may have changed since you last looked); make **surgical** edits (append new rows in order, never rewrite the file); and if it isn't in the state you expected, **flag rather than clobber**. Append new features with the next free numbers so two people adding features don't collide on a row.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. Detection snippets are POSIX **reference** — use your agent's own cross-platform file tools to look for source files and read/write Markdown. This skill runs inline (no subagent). If your tool has no interactive-question picker, ask the multiple-choice prompts as plain text with the same options.

## Execution

### Step 0 — Idea check

If no idea was provided (`/mvp` with no argument): **stop and ask** before anything else:

"What are you building? Describe the product or the slice of it you want to plan — one or two sentences about what it does and who it's for."

Wait for the answer. Use it as the product idea.

### Step 1 — Greenfield or brownfield?

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" \
  -o -name "*.go" -o -name "*.rs" \) -not -path '*/node_modules/*' -not -path '*/.git/*' | head -1
[ -f AGENTS.md ] && echo "has root AGENTS.md"
ls docs/mvp/*.md 2>/dev/null | sort        # existing roadmap files — note the HIGHEST number
```

- **Greenfield**: decompose the whole MVP from scratch. Sequence the roadmap so the **foundations come first, gradually**: (1) **coding guidelines & principles** — run `/audit` (greenfield) to capture the engineer's standards/conventions into root `AGENTS.md`; (2) the **stack** decision (`/architect` → ARCHITECTURE ADR); (3) the **design system / UI foundation** if the product has meaningful UI; then (4) data model, auth, and the rest. Don't jump to feature pages before these exist — every later feature builds on them. Surface this ordering in the Build order and the first foundation feature(s).
- **Brownfield**: read root `AGENTS.md` (and every `ls`-ed roadmap file under `docs/mvp/`) so you plan the *next* slice on top of what's already there. Two things to do:
  1. **Enroll the already-built features** for context — derive them from `AGENTS.md` (its nested-area docs map to existing features/areas) plus a light code scan, each with a `Code area` pointer. **Assess completeness honestly from the code**, and set status accordingly — do not just stamp everything done:
     - **Complete & shipped** → status **`existing`** (a *distinct* marker — **not** `done`, which is reserved for work *this pipeline* built and verified). No build breakdown; it's here for a complete picture, not to rebuild.
     - **Partially built** (something you may want to finish) → status **`in-progress`** with a breakdown: tick `[x]` the sub-tasks the code already covers, leave `[ ]` for what's missing — so `/develop` can resume it.
     Never mark a half-built feature `existing` — reflect what's actually there.
  2. **Plan the next slice** as `planned` features with full breakdowns. Don't write build plans for features already complete (`existing`).
  - If there's no root `AGENTS.md`, note in the report that `/audit` should run first to give this real context.

**If roadmap files already exist (a re-run) — read the *union*, don't duplicate or fragment:**
- **Read every file** under `docs/mvp/` and build the **full set of features already on the roadmap** — at *any* status (`planned`, `in-progress`, `done`, `existing`, `dropped`), across all numbered files. This is your dedup baseline.
- **Dedup against all of it.** Do not add a feature that already exists in any file in any status. If the engineer's request overlaps an existing `planned` feature, **extend that feature** (add missing sub-tasks to its row) rather than creating a duplicate. Only genuinely-new features get new rows.
- **Reconcile drift.** While reading the codebase, if you find **shipped work or ADRs that no roadmap feature covers** (the engineer built something off-plan), enroll them — completed work as `existing`/`done`, an unfinished thing as `in-progress` — so the plan reflects reality. Note these in the report as "drift enrolled".
- **State what you found** in the report: how many existing plans/features, how many new features you're adding, how many drift items you enrolled, and which file you wrote to.
- **Prefer consolidating** into the latest plan over spawning another file (see Step 6) — keep the roadmap from fragmenting across many files.

**Monorepo — plan per workspace, don't mix apps in one roadmap.** Detect a monorepo: a workspaces config (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`, or `workspaces` in root `package.json`) or multiple app/package manifests under `apps/*` / `packages/*`. If found:
- **Each workspace gets its own roadmap directory**: `docs/mvp/<workspace>/NN-name.md` (e.g. `docs/mvp/web/01-mvp.md`, `docs/mvp/api/01-mvp.md`). Repo-wide planning — monorepo tooling, a shared design system in `packages/ui`, cross-cutting infra — goes in **`docs/mvp/_root/`**. (Single-repo stays `docs/mvp/NN-name.md`.)
- **Scope to the workspace.** `/mvp web <idea>` plans the `web` app; a bare `/mvp` on a monorepo **asks which workspace(s)** to plan (or "repo-wide"). Read **that workspace's** nested `AGENTS.md` for *its* stack/conventions — apps in a monorepo often have different stacks (Next.js web, Go api, React Native mobile), so don't assume one.
- **Each feature's `Code area` points into its workspace** (`apps/web/...`). Foundations are per-workspace, **except** genuinely shared ones (the monorepo tooling, a shared UI package) which live in `_root` and the apps depend on.
- **A feature spanning workspaces** (e.g. an endpoint in `api` + a page in `web`) → plan it in `_root` with sub-tasks tagged by workspace, or split into coordinated per-workspace features. Don't bury cross-app work in one app's roadmap.

### Step 2 — Round 1: product & business (generate, then `AskUserQuestion`)

Generate questions tailored to *this* idea; infer and skip what's stated. Cover:
- **MVP boundary** — the smallest version that delivers the core value (the most important question; everything hangs off it).
- **Primary audience** — only if unclear from the idea.
- **Monetization** — free / subscription / one-time / usage-based / ads / none yet (shapes whether payments/billing features exist).
- **Success metric** — what "working" looks like (signups, activation, revenue) — informs analytics features.
- **Hard constraints** — deadline, budget, team size, compliance scope.

### Step 3 — Round 2: capabilities (generate, then `AskUserQuestion`)

Multi-select of the cross-cutting capabilities the product plausibly needs, tailored to its type — e.g. authentication, multi-tenant orgs, payments/billing, email/notifications, file/media upload, search, realtime, admin panel, public API. Confirm which are in scope for *this* slice vs deferred. Each selected capability becomes one or more features.

### Step 4 — Round 3: cross-cutting & go-to-market (generate, then `AskUserQuestion`)

These are routinely forgotten and belong in the plan from day one. Ask which apply:
- **SEO** — public/marketing pages, metadata, sitemap, structured data, OG/social cards, SSR/SSG needs (skip for purely internal/auth-walled apps).
- **Performance** — Core Web Vitals targets, image optimization, caching, expected load.
- **Analytics & tracking** — product analytics, error monitoring, conversion events.
- **Accessibility** — WCAG target (the `/develop` UI track enforces AA by default; confirm if stricter).
- **Internationalization** — multiple languages/locales, RTL.
- **Legal/compliance** — cookie consent, privacy policy/terms, GDPR/CCPA, age gating.

Each "yes" becomes either its own feature or a sub-task attached to relevant features (e.g. SEO/meta is a sub-task of each public page; cookie consent is its own feature).

### Step 5 — Decompose and break down (you reason; don't ask)

**5a — Feature list.** From the answers, produce features ordered by dependency and value. Foundations first, then dependents, then explicitly-deferred nice-to-haves. The foundations, in the order a developer actually sets a project up:
1. **Coding standards & conventions** — capture them with `/audit` (greenfield) into root `AGENTS.md`, **and** set up the *enforcement tooling* with `/develop` (linter, formatter, stricter compiler config, pre-commit hook). Capturing the rules and wiring the tooling are two sub-tasks — don't stop at the doc.
2. **Stack & architecture** — `/architect` ARCHITECTURE ADR.
3. **Design system & UI foundation** — `/architect` → `design.md`, then base components.
4. Then data model, auth, and feature work.

**Keep features small — one page or one cohesive unit per feature.** Do **not** group distinct screens together: a home page and per-segment landing pages are *separate* features; a shop listing, a product detail page, and a cart are three features, not one "storefront." A feature should be buildable and shippable on its own. If a "feature" would take more than a handful of sub-tasks across unrelated screens, split it. Finer features make the roadmap honest, the prompts specific, and progress visible.

Flag each `Needs ADR?` using the same *invent-test* `/develop` uses — **would building it require a decision the engineer hasn't made?** Flag **yes** when it involves any of:
- a provider, library, data model, or cross-cutting pattern;
- **the design system / UI foundation** — make it an explicit early foundation feature (Needs ADR: yes), not a sub-task buried inside a page. It's cross-cutting: every page depends on it;
- **any whole page/screen UI** when no design system + page spec exists yet — its composition (sections), components, and asset strategy are design decisions, so route through `/architect`;
- **a feature with non-trivial behavior** (search, filtering, recommendations) — what it should *do* needs deciding (`/architect` asks: which fields? which filters? sort? fuzzy?).

Flag **no** only for genuinely pure implementation an existing `design.md`/ADR/convention already covers — a small component, wiring, a content/copy page. When unsure, flag **yes**: an unflagged decision is the expensive miss (a page built with an invented design system is costly to redo).

**One decision per ADR — don't bundle, don't false-flag.** When a feature or refactor carries **multiple distinct decisions**, each is its own `Needs ADR: yes` item — don't lump unrelated decisions into a single "strategy" ADR. (For an api-dedup refactor, "shared SQL fragment builders" and "shared input schemas" are *different* decisions → **two** ADR items, not one bundled prompt.) If several items genuinely share **one** broad decision that then splits, model it as an **umbrella** and let dependents reference it — but **never mark a dependent `Needs ADR: no` when it actually carries its own decision.** The anti-pattern to avoid: "Feature 1: strategy (ADR)" bundling four unrelated calls, then Features 2–6 flagged "no ADR, conventions set by feature 1" — that ships a wrong roadmap and forces `/architect` to invent the split.

**Analysis/inventory is not a build sub-task.** Cataloguing duplication, listing every call site, auditing the current state — that's **decision-support research**, which belongs with the ADR (`/architect` produces it, and it lives under `docs/adr/…/research/`). Do **not** create `/develop … inventory` sub-tasks, and never plan a sub-task that writes a `.md` into `docs/mvp/`. If a feature needs an inventory to decide, that inventory is part of its `/architect` step, not a develop step.

**5b — Per-feature build breakdown.** This is what makes the roadmap actionable: for **each** feature, list its build sub-tasks **in order**, and for every sub-task give the **exact command + prompt to paste**. The breakdown *is the build script* — someone should walk a feature top to bottom pasting each prompt, no thinking required. Write the prompts **filled in with this feature's specifics**, not the `<placeholder>` form.

Standard sub-tasks (drop any that don't apply, add feature-specific ones), in **UI-first order** within the feature:

| # | Sub-task | Command + prompt to paste |
|---|---|---|
| 1 | **Decision (ADR)** — only if `Needs ADR? = yes` | `/architect <feature> — <the specific decisions: composition/sections · provider · data model · behavior>` |
| 2 | **UI (placeholder data)** | `/develop <feature> UI — build to design.md with placeholder data + states` |
| 3 | **Data model** | `/develop <feature> data model — <entities/tables/fields>` |
| 4 | **Backend & API** | `/develop <feature> API — <endpoints/actions/queries>` |
| 5 | **External integration** | `/develop <feature> integration — <provider/webhooks>` |
| 6 | **Data integration** (replace the mock) | `/develop <feature> wire-up — swap placeholder for real data, loading/error/empty states` |
| 7 | **Auth & permissions** | `/develop <feature> permissions — <who can do/see what>` |
| 8 | **SEO & metadata** | `/develop <feature> SEO — title/meta/OG/structured data` |
| 9 | **Validation & edge cases** | `/develop <feature> edge cases — <the failures>` |
| 10 | **Tests** | `/test <feature>` |
| 11 | **Harden** (payments/auth/admin only) | `/harden <feature>` |
| 12 | **Sync conventions** | `/sync` |

Each rendered sub-task is one checklist line: `- [ ] <sub-task name> — `\`<command + prompt>\``. The skill **and** the order **and** the prompt all live in that line — that's the "which skill, in what order, with what prompt" the breakdown must answer.

**Build order — UI-first, layered (default).** Sequence the *whole roadmap by layer*, not each feature end-to-end. The point is to make the app **visible and clickable as early as possible** — motivating progress, and UI needs no accounts or database to exist. Order the work as:

1. **Foundations** — coding standards (`/audit`), stack (`/architect`), and the **design system** (`/architect` → `design.md`). Everything visual depends on these.
2. **All UI, against placeholder data** — build every page/screen with **static/mock data and placeholder assets** (no auth, no DB). The whole product becomes browsable. Each feature's **UI** sub-task lands in this layer (its design ADR first if `Needs ADR`).
3. **Data & auth foundations** — now add **authentication**, the **database + schema**, and **seed data**. Pure logical work, no new screens.
4. **Integration, page by page** — wire each page to real data, auth, and actions, **one page at a time** (e.g. home → shop → product → cart → checkout → account → admin). Each feature's **data-integration / permissions** sub-tasks land here.
5. **Harden & test** each feature as it becomes real.

So a single feature's sub-tasks are **spread across layers**: its UI is built in layer 2 (against mocks), its data/backend become real in layer 3–4, its integration in layer 4. In the breakdown, mark a feature's UI sub-task as using placeholder data until its data-integration sub-task is done. Group the **Build order** section by these layers/phases, not by feature.

Deviate only when a page genuinely can't be prototyped without real data (rare — even then, mock it).

### Step 6 — Write the roadmap file (pick the number first)

**Choose the target file** by scanning the roadmap location — `docs/mvp/` for a single repo, or **`docs/mvp/<workspace>/`** (resp. `docs/mvp/_root/`) for the workspace you're planning in a monorepo. Everything below applies within that location:
- **No roadmap files exist** → create `<location>/01-mvp.md`.
- **Roadmap files exist** → decide, and **state which (and why) in the report**:
  - **Continuing the same plan** — the latest file still has unfinished/`planned` features you're extending → **merge** into that latest file: append new features/sub-tasks, leave existing rows and checkbox states untouched. If a previously-`planned` feature is now **out of scope** (a pivot), set its status to **`dropped`** — don't delete the row.
  - **A distinct new slice/batch** — a separate planning pass → create the **next number**: highest existing `NN` + 1, zero-padded to two digits, with a kebab slug — e.g. `docs/mvp/02-checkout-and-orders.md`. Re-list `docs/mvp/` immediately before writing (a teammate may have added one); use the next free number; **never overwrite an existing roadmap file**.

When unsure between merge and new-file, **prefer merging into the latest plan** — keep the roadmap from fragmenting across many files. Only spin up a new numbered file when the slice is a **genuinely distinct epic/area** (e.g. you finished v1 and are now planning a separate "mobile app" or "billing v2" effort). A re-run on overlapping scope should land in the existing plan, not a new file. Then write the chosen file with two parts — an overview table and the detailed breakdown:

```markdown
# Feature Roadmap

_Seeded by /mvp · status advanced by /develop and /sync. Roadmap files live in `docs/mvp/` (ADRs are in `docs/adr/`)._

## Overview

| # | Feature | Priority | Needs ADR? | Status | Code area |
|---|---------|----------|-----------|--------|-----------|
| 1 | Coding standards & tooling | P0 | no | planned | — |
| 2 | Stack & architecture | P0 | yes | planned | — |
| 3 | Design system & UI foundation | P0 | yes | planned | — |
| 4 | Home page | P0 | yes | planned | — |
| 5 | Segment landing pages | P0 | yes | planned | — |
| 6 | Shop listing (filter & sort) | P0 | yes | planned | — |
| 7 | Product detail page | P0 | yes | planned | — |
| 8 | Cart | P0 | yes | planned | — |
| … | … | … | … | … | — |

<!-- Brownfield: already-built features are enrolled here above the planned ones, with status `existing`
     (complete, no breakdown) or `in-progress` (partial — finish via /develop), e.g.
| — | Auth | — | — | existing | `src/auth/` |
| — | Product catalog | — | — | existing | `src/catalog/` |
— `existing` ≠ `done`: it predates the workflow. Code area filled; complete ones get no breakdown. -->

_(Granular: home and segment landing are separate features; listing, product, and cart are separate — not one "storefront".)_

## Build order (UI-first, layered)

**Phase 1 — Foundations**: coding standards + tooling (`/audit` → `/develop`) → stack (`/architect`) → design system (`/architect` → `design.md` → base components)
**Phase 2 — All UI (placeholder data, no auth/DB)**: home → segment landing → shop listing → product → cart → checkout → account → admin — every page, static mock data + placeholder assets, browsable end to end
**Phase 3 — Data & auth foundations**: authentication → database + schema → seed data
**Phase 4 — Integration (page by page)**: wire home → segment landing → shop → product → cart → checkout → account → admin to real data + auth + actions, one at a time
**Phase 5 — Harden & test**: per feature as it goes live
_Deferred: advanced search, analytics dashboard_

## Build breakdown

### 1. Coding standards & tooling  ·  Needs ADR: no  ·  Status: planned
- [ ] Capture standards into `AGENTS.md` — `/audit` _(greenfield: pick architecture style + conventions)_
- [ ] Set up enforcement tooling — `/develop tooling — ESLint + Prettier + strict tsconfig + husky/lint-staged pre-commit, per the captured standards`
- [ ] Tests — `/test` _(lint/format run clean)_
> ADR: — (no decision — conventions captured by /audit) · Code area: —

### 4. Home page  ·  Needs ADR: yes  ·  Status: planned
- [ ] Decision (ADR) — `/architect home page — composition (hero, featured collections, segment entry points), layout, asset strategy`
- [ ] UI (placeholder data) — `/develop home page UI — build to design.md with mock collections + placeholder imagery`
- [ ] Data integration — `/develop home page wire-up — swap mock for real featured collections, loading/empty states`
- [ ] SEO & metadata — `/develop home page SEO — title/meta/OG/Organization JSON-LD`
- [ ] Tests — `/test home page`
> ADR: — · Code area: —

### 5. Segment landing pages  ·  Needs ADR: yes  ·  Status: planned
- [ ] Decision (ADR) — `/architect segment landing — per-segment layout (dev/gamer/anime), theming, shared vs unique blocks`
- [ ] UI (placeholder data) — `/develop segment landing UI — build to design.md, mock per-segment data`
- [ ] Data integration — `/develop segment landing wire-up — real segment catalog, empty states`
- [ ] SEO & metadata — `/develop segment landing SEO — per-segment title/meta/OG`
- [ ] Tests — `/test segment landing`
> ADR: — · Code area: —

### … (every feature gets its own block with filled-in prompts)

## Legend
- **Status**: `planned` → `in-progress` → `done` (pipeline: /mvp seeds → /develop builds → /sync reconciles). Plus **`existing`** — a pre-existing feature enrolled by /mvp for context (built before this workflow; no breakdown; `done` is reserved for pipeline-verified work). Plus **`dropped`** — a de-scoped feature kept for history (set by /mvp on re-planning; excluded from active work; never deleted).
- **Sub-task checkbox**: `todo` `[ ]` → `done` `[x]` — `/develop` ticks its own sub-tasks as it builds; **`/sync` sweeps the rest** (`/test`, `/harden`, tooling, `/sync`) from repo evidence
- **Needs ADR?**: `yes` → run `/architect` before building · `no` → `/develop` directly
- **Priority**: P0 (MVP-critical) · P1 (MVP) · P2 (deferred)
```

On a brownfield merge: append new features/sub-tasks; leave existing rows and checkbox states untouched.

**Basis on recommendations.** Where the roadmap *recommends* something the engineer didn't dictate — the build order rationale, a suggested capability, "recommendation — add analytics", flagging a feature `Needs ADR` — append a short `(basis: …)`: a **project source** (`your AGENTS.md`, an ADR, the existing stack) or a **named practice** (`UI-first for fast feedback`, `foundations before features`). You have no web tools here, so **name the source/practice — never a URL.**

### Step 6b — Ground the recommendations (sourcing subagent)

After writing the roadmap, spawn a **sourcing subagent** to add verified references — a real subagent is used here so links are *fetched-and-confirmed*, not fabricated by the main model:
- `model: "haiku"` · `description: "MVP: source & reference the roadmap"`
- Tools: `Read`, `Edit`, `WebSearch`, `WebFetch`
- `prompt`: give it the roadmap file path and its recommendations. Its job: for the load-bearing recommendations, confirm each `(basis: …)` is sound, and where a **canonical source is worth linking** (an official doc, a named standard/practice), **web-search + fetch to confirm it exists and says what's claimed**, then add a **`## References`** section at the end of the roadmap — *Project sources* (verifiable), *Practices & standards* (named), *Links* (web-verified only, else "none verified"). **Never invent a URL; an unverified link must not appear.** Keep it lean — the few load-bearing sources, not every line.
- If the client has no web tools/subagents, do this inline with named practices + project sources only (no links) — that's an acceptable degrade.

### Step 7 — Report and hand off

```
## /mvp complete

**Product**: <one line>
**Roadmap file**: <docs/mvp/NN-name.md> — <created new | merged into latest | new slice (next number) because <reason>>
**Existing plans read** (re-run): <N files, M features already on the roadmap — or "none (first plan)">
**Existing features enrolled** (brownfield): <count as `existing` + count as `in-progress` (partial) — or "n/a (greenfield)">
**Drift enrolled** (off-plan work found in the code/ADRs): <count — or "none">
**Scope (this plan)**: <N> NEW features to build (deduped against existing), <total sub-task count> build sub-tasks
**Cross-cutting in scope**: <SEO / analytics / i18n / compliance — or "none">
**Build order**: <feature 1> → <feature 2> → …
**First step**: <recommended next command — usually `/architect <first feature>`, or `/audit` first if brownfield has no root AGENTS.md>
```

`/mvp` does not run `/architect` or `/develop` for you — it hands you the ordered, broken-down list; you walk it sub-task by sub-task.
