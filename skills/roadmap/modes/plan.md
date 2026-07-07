# Roadmap Mode: plan

### Step 1 — Locate the roadmap; greenfield / brownfield / monorepo

Detect (skip `node_modules/` and `.git/`): source files (any `.ts`, `.tsx`, `.js`, `.py`, `.go`, `.rs`; presence ⇒ brownfield, none ⇒ greenfield); root `AGENTS.md`; existing roadmap under `docs/roadmap/` (`roadmap.md`, or `index.md` + epic files; monorepo: `docs/roadmap/<workspace>/`), noting the shape.

Greenfield: decompose the whole MVP from scratch, foundations-first (Step 3).

Brownfield: read root `AGENTS.md` (and any existing roadmap) to plan the next slice on top:
1. Enroll already-built features for context, from `AGENTS.md` (nested-area docs map to existing areas) + a light code scan, each with a `Code area` pointer. Large repo: offload the scan to a read-only subagent (fast/cheap model with `Read`/`Grep`/`Glob`) returning a compact map, don't read the tree inline. Assess completeness honestly from the code, don't stamp everything done: complete and shipped → `existing` (distinct from `done`); partially built → `in-progress` (so `/develop` can resume). Never mark a half-built feature `existing`.
2. Plan the next slice as `planned` rows; don't re-plan `existing` features. No root `AGENTS.md`: note in the report that `/audit` should run first for real context.

Re-run (roadmap exists): read the union, don't duplicate or fragment:
- Read the whole roadmap (single file, or `index.md` + every epic file); all features at any status (`planned`, `in-progress`, `done`, `existing`, `dropped`) are the dedup baseline.
- Never re-add a feature present at any status; request overlaps an existing `planned` row → extend it (sharpen intent/seeds).
- Reconcile drift: shipped work or ADRs no row covers get enrolled (completed as `existing`/`done`, unfinished as `in-progress`); note as "drift enrolled".
- Report: counts already there / new / drift, files written. Full reconcile after shipping → prefer replan mode.

Monorepo (workspaces config: `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`, `workspaces` in root `package.json`; or multiple manifests under `apps/*` / `packages/*`): plan per workspace, never mix apps:
- Each workspace: `docs/roadmap/<workspace>/` (`roadmap.md`, or `index.md` + epics if large). Repo-wide planning (monorepo tooling, cross-cutting infra, e.g. a shared design system in `packages/ui`): `docs/roadmap/_root/`.
- Top-level `docs/roadmap/index.md` maps the monorepo: one line per workspace (and `_root`) linking its roadmap with a status rollup (features done / total); create or update whenever a workspace roadmap is added or its rollup changes.
- `/roadmap web <idea>` plans the `web` app; bare `/roadmap` on a monorepo asks which workspace(s) (or "repo-wide") as a panel. Read that workspace's nested `AGENTS.md` for its stack/conventions; apps differ, don't assume one.
- Each feature's `Code area` points into its workspace (`apps/web/...`). Foundations are per-workspace, except genuinely shared ones (monorepo tooling, a shared UI package), which live in `_root` and the apps depend on.
- Feature spanning workspaces: plan in `_root` (tag intent by workspace) or split into coordinated per-workspace features; never bury cross-app work in one app's roadmap.

### Step 2 — Ask (batched rounds, as decision panels)

Tailor to this idea; infer and skip what's stated. As many rounds as needed (up to 4 questions per round, each a panel). Cover:

Round 1, product & business: MVP boundary (smallest version delivering the core value; most important); primary audience (only if unclear); monetization (free / subscription / one-time / usage-based / ads / none yet; shapes billing features); success metric (signups, activation, revenue; informs analytics features); hard constraints (deadline, budget, team size, compliance scope; shape phasing and weights).

Round 2, capabilities: multi-select of cross-cutting capabilities the product plausibly needs, by type (e.g. authentication, multi-tenant orgs, payments/billing, email/notifications, file/media upload, search, realtime, admin panel, public API). Confirm in scope this slice vs deferred; each selected becomes one or more features. Name capabilities, never the implementing tool.

Round 3, cross-cutting & go-to-market (routinely forgotten, in the plan from day one): SEO (public/marketing pages, metadata, sitemap, structured data, social cards, SSR/SSG needs; skip for purely internal/auth-walled apps); performance (Core Web Vitals targets, caching, expected load); analytics & tracking (product analytics, error monitoring, conversion events); accessibility (WCAG target); internationalization (languages/locales, RTL); legal/compliance (cookie consent, privacy/terms, GDPR/CCPA, age gating).

Each "yes" becomes its own feature or folds into a relevant feature's acceptance-criteria seeds (e.g. "SEO metadata present" on each public page; cookie consent its own feature).

### Step 3 — Choose the build approach (decision panel)

Decides how every feature is sliced and sequenced. No fixed procedure; reason about this product (goal, Round 1 constraints, production build vs throwaway), then present a panel of the named approaches, each stated by its guiding principle (not steps), recommending exactly one:

- **Tracer Bullet**: vertical slices; each feature built end-to-end through every layer, working.
- **Skateboard**: MVP-first; ship the thinnest usable whole first, then grow it.
- **Facade**: UI-first; a clickable shell on placeholder data, then wire the back. Prototype-grade (fast to demo, not production-complete).
- **Journey**: a complete user path end-to-end per phase.

Reason out the pick, never hardcode it or its mechanics: default for a proper production build is Tracer Bullet; shift only when the goal calls for it (fast validation of one core loop → Skateboard; the experience/funnel is the product → Journey; a quick clickable prototype → Facade, said plainly to be prototype-grade). One-line why in terms of this product. Never name a tool; the approach shapes how, not with what.

Record it (the propagation source) in the roadmap header: `Build approach: <name> — <one-line principle>`. A project-wide convention: `/audit` and `/sync` persist it into root `AGENTS.md`; `/architect`, `/develop`, `/verify` read and honor it. It also sets each feature's Phase (its slice / journey), shown in the At-a-glance table and as section grouping.

Header value = project default; a single feature may override via the optional per-feature Approach (Step 5), a tag beside its heading (e.g. `· Facade`). Precedence: own tag if set, else project default; tag only when it differs (no tag = inherit).

### Step 4 — Foundations-first sequencing (a principle every build approach obeys)

No approach starts a feature slice before the ground it stands on exists (working skeleton before features). Lead with these explicit foundation features (never buried sub-tasks), default order below (cheaper foundation precedes what depends on it). Crucially, stack decided + project scaffolded before `/audit` runs: `/audit` seeds root `AGENTS.md` conventions + tooling from the real project.

1. **Standards preferences**: light, un-inferable preferences (architecture style leanings, formatting taste). Keep light; may fold into the stack feature rather than its own row. Heavy convention + tooling capture is `/audit`, after scaffold. `Needs ADR: no`.
2. **Stack and architecture**: ONE foundation feature, built like any other (`Decision (ADR)` sub-task, then a build sub-task), never two rows. `/architect` decides the stack (ARCHITECTURE ADR: the one place tools/providers/frameworks are chosen; nothing tooling-related runs before it); `/develop` then scaffolds from it (framework init, dependency install, directory layout, runnable dev server/build). `Needs ADR: yes`, weight `medium`+. The ADR records only the decision; `/develop` derives scaffold steps at build time (writing them in both places is the double-spec bug). Scaffold installs only the runnable skeleton the first slice needs (framework, language, core runtime), never every eventual library: deciding the full stack up front is correct (the ADR's job), installing it all is not; each later feature installs its own dependencies when built (e.g. the billing SDK when billing is built). Exception: cross-cutting tooling (lint, format, type strictness, pre-commit, CI) comes early via `/audit` + `/develop tooling`, since all later code must follow it.
3. **Coding standards & tooling**: two sub-tasks: `/audit` (greenfield) captures conventions AND tooling choices into root `AGENTS.md` from the real scaffolded project, not guesses; then `/develop tooling` installs the chosen tooling (packages, config files, pre-commit hooks, CI) per what audit captured. `/audit` decides and records, never installs; `/develop` installs. `Needs ADR: no`. After the stack-and-scaffold feature, never before.
4. **Data model**: explicit, non-skippable (`Needs ADR: yes`): core entities, relationships, persistence shape. Never fold into another feature or skip; a wrong data model is the most expensive thing to redo.
5. **Design system / UI foundation**: `/architect` → `design.md`, then base components (`Needs ADR: yes`), if the product has meaningful UI; every page depends on it.
6. **Walking-skeleton slice**: a thin vertical slice wired end-to-end (DB → API → UI) doing one trivial real thing (e.g. one record created and rendered), proving the stack is connected before feature work. Weight `medium`; usually leans on the foundation ADRs, not its own. Under Tracer Bullet it merges with the first real slice (below).

Then the feature slices, ordered and phased per Step 3. Phasing column: `Foundation`, `Skeleton`, the slice/journey (e.g. `Slice 2`), or `Deferred`; Order column: integer build sequence across the whole roadmap.

Shape the slices to the approach; it changes WHAT the slices are, not just labels. Every capability as its own fully-built feature with `Slice 1 … Slice N` stapled on has NOT honored the approach. Reason from the principle:

- **Tracer Bullet** → first post-foundation slice: a thin thread through the core user journey, end to end, the smallest path touching every layer that proves the whole loop works, nothing more (standup app: sign in → create a team → submit today's standup on a default template → see it in the team feed; no invites, custom templates, reminders yet). This IS the walking skeleton; merge them (no separate throwaway skeleton). Later slices thicken one segment of the working thread (invites, custom templates, reminders, history, search, admin); never full auth plus full admin before the core loop runs end to end once.
- **Skateboard** → first deliverable: the thinnest usable whole product a real user could use; later rows grow it.
- **Journey** → each phase: one complete user path, end to end, before the next begins.
- **Facade** → UI shells first on placeholder data, wired to real data later.

A thin thread leans on shared ADRs, so most rows do NOT each need one: the core-loop slice rests on the foundational ADRs (data model, auth); thickening steps usually extend a decided pattern. Still apply the invent-test per row, but expect far fewer `Needs ADR: yes` rows than a flat feature list; nearly every row needing one means you decomposed into full features, re-slice.

### Step 5 — Decompose into coarse feature sections (you reason; don't ask)

From the answers, produce the feature list: foundations first (Step 4), then slices, then explicitly-deferred nice-to-haves. Per feature:

- Keep features small: one page or one cohesive unit each (a listing, a product page, and a cart are three features, not one "storefront"); split anything spanning unrelated screens.
- **Intent (1–2 lines)**: what it is and why it matters.
- **Done-when line (acceptance-criteria seeds)**: one compact `Done when:` line of observable outcomes (e.g. "user can filter the list and the URL reflects it; empty and error states render"). Seeds, not a spec; `/architect` grows them into the ADR's full requirements and acceptance criteria. Load-bearing outcomes only.
- **Weight**: `lean` / `medium` / `full` (see Artifact ownership), from risk, scope, compliance sensitivity.
- **Approach (optional per-feature override)**: defaults to inherit. Only when genuinely best built differently, run a Build-approach panel for THAT feature: `(recommended) inherit the project default` on top, plus the named approaches (Tracer Bullet · Skateboard · Facade (prototype-grade) · Journey) as overrides; same panel and no-hardcoded-tool conventions as Step 3, tag and precedence rules per Step 3.
- **Needs ADR?**: the invent-test: would building it require a decision the engineer hasn't made? Yes for a provider/library choice, a data model, a cross-cutting pattern, the design system, a whole page/screen with no spec yet, or non-trivial behavior (search, filtering, recommendations). No only for genuinely pure implementation an existing `design.md`/ADR/convention covers. Unsure → yes; an unflagged decision is the expensive miss. `full` weight → almost always yes.
- One decision per ADR: multiple distinct decisions in one feature → one `Needs ADR: yes` item each, never one lumped "strategy" ADR. Several sharing one broad decision that then splits → an umbrella that dependents reference; never mark a dependent `no` when it carries its own decision.

No build-task breakdown here. A not-yet-designed feature gets exactly one checkbox, its entry command: `/architect <feature>` when it `needs a decision`, else `/develop <feature>` (the coding-standards-and-tooling foundation's first box is `/audit`, never `/develop`). Never enumerate UI / data-model / API / test sub-tasks; `/architect` fills the built-ready shape on ADR capture (see What this skill does; atomic tasks stay in the ADR). The next step is then always the first unticked box, always a command or tracked milestone (no separate `Next:` line). See the lifecycle table in `roadmap-template.md`.

Analysis/inventory is not a roadmap row: cataloguing duplication, listing call sites, auditing current state is decision-support research living with the ADR (`/architect` produces it under `docs/adr/…/research/`). Never plan a row or step that writes a `.md` into `docs/roadmap/`.

### Step 6 — Write the roadmap (single-file or epic-split)

Re-list the roadmap location immediately before writing (a teammate may have changed it), then write per `roadmap-template.md`:

- Small product → single file `docs/roadmap/roadmap.md` (monorepo: `docs/roadmap/<workspace>/roadmap.md`): At-a-glance table (including brownfield-enrolled features) + phase-grouped feature sections + legend.
- Large product → epic-split per Artifact ownership (`docs/roadmap/index.md` + `docs/roadmap/<epic>.md`); promote only when `roadmap.md` has outgrown a comfortable scan, else stay single-file.
- Re-run (living update): edit in place, never a dated file: append new rows with the next free `#`, sharpen existing rows' intent/seeds, leave existing statuses untouched; set a now-out-of-scope row to `dropped` (never delete). Brownfield: append enrolled `existing`/`in-progress` rows above the `planned` ones.

Citations are gated by Step 6b: ask that panel first (or confirm the chosen level) before adding any `(basis: …)` or `## References` content, and honor its level.

### Step 6b — References consent (one panel, covers sources AND links)

Ask ONE consent question governing both the `(basis: …)` citations and any reference links (one clear ask, not two). Panel; record the outcome as the References level:
- question: "Add a References section to the roadmap (where the recommendations come from, and optionally links)? The intent and reasoning stay either way. The links option runs a subagent that web searches and fetches pages to confirm official docs and standards, which costs some extra tokens."
- header: "References"
- options:
  - `No references, keep it clean (recommended)`
  - `Sources only (named project sources and practices, no web fetch)`
  - `Sources plus web verified links (fetches pages to confirm the links, costs some extra tokens)`

No references (or no answer): no `## References` section, no `(basis: …)` citations anywhere; the roadmap keeps its intent and reasoning and reads clean. Done.

Sources only (or the agent has no web tools): wherever the roadmap recommends something the engineer didn't dictate (phasing choice, order rationale, a suggested capability, a `Needs ADR` flag, a weight call), append a short `(basis: …)`: a project source (`your AGENTS.md`, an ADR, the existing stack) or a named practice (`vertical slices ship real value early`, `foundations before features`, `data model is the costliest thing to redo`); inline you have no web tools, so name the source or practice, never a URL. Add a `## References` section naming *Project sources* (verifiable) and *Practices & standards* (named); no Links group, no subagent. Done.

Sources plus web verified links: as Sources only, then spawn a sourcing subagent (capability-first) so links are fetched and confirmed, never fabricated:
- `model`: fast/cheap (e.g. `haiku` on Claude Code; a light model elsewhere) · `description: "Roadmap: source & reference the recommendations"`
- Tools: `Read`, `Edit`, `WebSearch`, `WebFetch`
- `prompt`: the roadmap file path(s) and its recommendations. Job: confirm each load-bearing `(basis: …)` is sound; where a canonical source is worth linking (an official doc, a named standard/practice), web search and fetch to confirm it exists and says what's claimed; complete `## References` with a *Links* group (web verified only, else "none verified"). Never invent a URL. Keep it lean.
- No web tools or subagents: degrade to the Sources only behavior.

### Step 7 — Report and hand off

Print the completion report using the `## /roadmap complete` block in `roadmap-template.md`, filled with this run's specifics. `/roadmap` does not run `/architect` or `/develop` for you; it hands you the ordered, coarse, weighted list to walk feature by feature (architect the `Needs ADR: yes` ones, then build).
