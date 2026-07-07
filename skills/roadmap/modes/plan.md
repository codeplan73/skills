# Roadmap Mode: plan

### Step 1 — Locate the roadmap; greenfield / brownfield / monorepo

Detect (skip `node_modules/` and `.git/`): source files (any `.ts`, `.tsx`, `.js`, `.py`, `.go`, `.rs`; presence ⇒ brownfield, none ⇒ greenfield); root `AGENTS.md`; existing roadmap under `docs/roadmap/` (`roadmap.md`, or `index.md` + epic files; monorepo: `docs/roadmap/<workspace>/`), noting the shape.

Read exactly one route file before continuing to Step 2:

- `modes/plan-monorepo.md` when workspace markers or multiple app/package manifests show a monorepo.
- `modes/plan-brownfield.md` when source files or a manifest show an existing codebase or an existing roadmap is being extended.
- `modes/plan-greenfield.md` when there is no source code and no manifest yet.

Do not read the other plan route files unless the classification changes. After the selected route has established the roadmap/workspace context, continue with Step 2 below.

### Step 2 — Ask (generated question walk, as decision panels)

Do not follow a fixed script or a set number of rounds. Enumerate the planning dimensions THIS product needs (generate them from the idea and `AGENTS.md`), then ask them one after another as batched decision panels (up to 4 per panel), as many panels as it takes. Infer and skip anything already stated; ask everything else. The more thoroughly you ask, the better the roadmap: never cap the questions to save time, and never end while a load-bearing dimension is unasked.

Cover at least these dimension groups (a checklist of what to reach, not an order to recite; add product-specific dimensions freely):

- **Product & business**: MVP boundary (smallest version delivering the core value; most important); primary audience (only if unclear); monetization (free / subscription / one-time / usage-based / ads / none yet; shapes billing features); success metric (signups, activation, revenue; informs analytics features); hard constraints (deadline, budget, team size, compliance scope; shape phasing and weights).
- **Capabilities**: the cross-cutting capabilities the product plausibly needs, by type (e.g. authentication, multi-tenant orgs, payments/billing, email/notifications, file/media upload, search, realtime, admin panel, public API), as a multi-select. Confirm in scope this slice vs deferred; each selected becomes one or more features. Name capabilities, never the implementing tool.
- **Cross-cutting & go-to-market** (routinely forgotten, in the plan from day one): SEO (public/marketing pages, metadata, sitemap, structured data, social cards, SSR/SSG needs; skip for purely internal/auth-walled apps); performance (Core Web Vitals targets, caching, expected load); analytics & tracking (product analytics, error monitoring, conversion events); accessibility (WCAG target); internationalization (languages/locales, RTL); legal/compliance (cookie consent, privacy/terms, GDPR/CCPA, age gating).

Each "yes" becomes its own feature or folds into a relevant feature's acceptance-criteria seeds (e.g. "SEO metadata present" on each public page; cookie consent its own feature).

### Step 3 — Choose the build approach (decision panel)

Decides how every feature is sliced and sequenced. No fixed procedure; reason about this product (goal, the product & business constraints from Step 2, production build vs throwaway), then present a panel of the named approaches, each stated by its guiding principle (not steps), recommending exactly one:

- **Tracer Bullet**: vertical slices; each feature built end-to-end through every layer, working.
- **Skateboard**: MVP-first; ship the thinnest usable whole first, then grow it.
- **Facade**: UI-first; a clickable shell on placeholder data, then wire the back. Prototype-grade (fast to demo, not production-complete).
- **Journey**: a complete user path end-to-end per phase.

Reason out the pick, never hardcode it or its mechanics: default for a proper production build is Tracer Bullet; shift only when the goal calls for it (fast validation of one core loop → Skateboard; the experience/funnel is the product → Journey; a quick clickable prototype → Facade, said plainly to be prototype-grade). One-line why in terms of this product. Never name a tool; the approach shapes how, not with what.

**Once the approach is chosen, read its persona file and adopt that engineer's role for decomposition** (`approaches/tracer-bullet.md`, `approaches/skateboard.md`, `approaches/facade.md`, or `approaches/journey.md`). Read only the chosen one. Each persona defines how that engineer slices, what the first slice or deliverable is, what is real vs deferred, and the sequencing, with a worked example. All slicing and sequencing in Step 4 and Step 5 follows that persona, so the four approaches produce genuinely different roadmaps for the same product, not the same list relabeled. A per-feature override (Step 5) reads that feature's chosen persona and applies it to that feature only.

Record it (the propagation source) in the roadmap header: `Build approach: <name> — <one-line principle>`. A project-wide convention: `/audit` and `/sync` persist it into root `AGENTS.md`; `/architect`, `/develop`, `/verify` read and honor it. It also sets each feature's Phase (its slice / journey), shown in the At-a-glance table and as section grouping.

Header value = project default; a single feature may override via the optional per-feature Approach (Step 5), a tag beside its heading (e.g. `· Facade`). Precedence: own tag if set, else project default; tag only when it differs (no tag = inherit).

### Step 4 — Foundations-first sequencing (a principle every build approach obeys)

No approach starts a feature slice before the ground it stands on exists (working skeleton before features): lead with explicit foundation features (stack, tooling, data model, design system, walking skeleton), never buried sub-tasks, cheaper foundation before what depends on it. Then the feature slices, ordered and phased per Step 3 (Phasing column: `Foundation`, `Skeleton`, the slice/journey e.g. `Slice 2`, or `Deferred`; Order column: integer build sequence across the whole roadmap).

- **Greenfield (and greenfield monorepo)**: apply the full foundations-first sequencing in `modes/plan-greenfield.md` (the ordered foundation features, then how each build approach shapes the slices). That route file is your Step 4 detail.
- **Brownfield**: the foundations already exist; do not re-plan them. Plan the next slice on top per `modes/plan-brownfield.md`, shaping it to the Step 3 approach; enroll already-built features rather than laying foundations.

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

Analysis/inventory is not a roadmap row: cataloguing duplication, listing call sites, auditing current state is decision-support research living with the ADR (`/architect` puts it in the ADR's `rationale.md`). Never plan a row or step that writes a `.md` into `docs/roadmap/`.

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
- `model`: set explicitly to a fast, low-cost tier; do not inherit the session model (Claude Code: `haiku`; a light model elsewhere) · `description: "Roadmap: source & reference the recommendations"`
- Tools: `Read`, `Edit`, `WebSearch`, `WebFetch`
- `prompt`: the roadmap file path(s) and its recommendations. Job: confirm each load-bearing `(basis: …)` is sound; where a canonical source is worth linking (an official doc, a named standard/practice), web search and fetch to confirm it exists and says what's claimed; complete `## References` with a *Links* group (web verified only, else "none verified"). Never invent a URL. Keep it lean.
- No web tools or subagents: degrade to the Sources only behavior.

### Step 7 — Report and hand off

Print the completion report using the `## /roadmap complete` block in `roadmap-template.md`, filled with this run's specifics. `/roadmap` does not run `/architect` or `/develop` for you; it hands you the ordered, coarse, weighted list to walk feature by feature (architect the `Needs ADR: yes` ones, then build).
