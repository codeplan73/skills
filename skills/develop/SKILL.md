---
name: develop
compatibility: Built for Claude Code — uses interactive questions and stack detection. Installs on any Agent Skills client but is tuned for Claude Code.
description: "Use this skill to build a feature — both UI and logical/backend work — from an approved design. Run /develop to implement a page, component, API, service, data layer, integration, or any feature slice. It first runs an ADR gate: if the work carries a load-bearing decision (a new provider, data model, or cross-cutting pattern) and no ADR records it, /develop stops and tells you to run /architect first. Otherwise it reads the governing ADR, the co-located AGENTS.md conventions, and (for UI) design.md, then builds — asking template/design questions for frontend work or business-rule questions for backend work only where the design left them open. It writes app code and advances the feature's status in docs/features/index.md. It does NOT make architecture decisions or write ADRs (that's /architect)."
---

## What this skill does

The builder. It implements a feature that has already been *decided* — turning an ADR + project conventions into working code, for **both UI and logical work**. Two tracks behind one front door:

- **UI track** — components, pages, layouts: semantic HTML, design tokens, accessibility. Detailed in `ui-guide.md`.
- **Logical track** — APIs, services, data layers, business logic, integrations. Detailed in `logical-guide.md`.

A single task can use both (e.g. "auth" = sign-in pages *and* session logic) — run both tracks.

Because building is where decisions get silently made, `/develop` **gates on the ADR first** (Step 0). That's what stops you from quietly inventing an auth approach or a payment provider mid-build instead of deciding it in `/architect`.

## Asks vs acts

**Gates, then acts.** It does not run two rounds of upfront questions like `/architect`. It reads the decision, then builds — asking only what the design genuinely left open (a UI template when no screenshot was given; an ambiguous business rule the ADR didn't settle). Same **infer / ask / recommend** discipline: infer from the ADR + `AGENTS.md` + codebase, ask only the un-inferable, recommend local implementation choices.

## Artifact ownership

Writes **app code** (and CSS/tokens for UI). Advances the feature's row in `docs/features/index.md` — `planned` → `in-progress` on start, `done` when the build lands — and fills in its `Code area` (and `ADR`) pointers. Never writes ADRs (flags the need and defers to `/architect`); never restructures root `AGENTS.md` (that's `/audit`); records new area conventions only via `/sync` afterwards.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. Detection snippets are POSIX **reference** — use your agent's own cross-platform file tools to find files, read `package.json`/config, and read the ADR and `AGENTS.md`. This skill runs inline (no subagent) and writes app code, which is inherently cross-platform. Bundled guides (`ui-guide.md`, `logical-guide.md`, `checklist.md`, `templates/`) are referenced by paths relative to this skill's folder; the main agent reads them. If your tool has no interactive-question picker, ask the prompts as plain text with the same options.

## Execution

### Step 0 — The ADR gate (always first)

Decide whether a **load-bearing decision is owed and unrecorded**. A decision is owed when the work introduces any of:
- a new external provider, library, or integration (auth, payments, storage, email, search);
- a new persistence/data model or schema;
- a cross-cutting pattern (error handling, auth enforcement, caching) not already established.

It is **not** owed for pure implementation that an existing `design.md`, `AGENTS.md` convention, or a prior ADR already covers — e.g. rendering a page in the existing design system, or wiring already-decided pieces together.

**Check, in order:**
1. If `docs/features/index.md` exists, find this feature's row. If `Needs ADR? = yes` and the `ADR` column is empty → **a decision is owed and missing.**
2. Search `docs/adr/` for an ADR covering this scope. If one exists, it's the spec — proceed.
3. Check whether the decision is already captured in the nearest `AGENTS.md` (the convention may have been synced from an earlier feature — e.g. "auth uses Clerk"). If so, proceed without a new ADR.

**If a decision is owed and nothing records it — do not guess, and do not silently stop. Ask the engineer** via `AskUserQuestion` (single-select):

- **question**: "This looks like it needs an architecture decision first — `<name the specific load-bearing choice, e.g. 'which auth provider + session model'>`. How do you want to handle it?"
- **header**: "ADR first?"
- **options**:
  1. `Architect it first` — "Recommended — capture the decision in an ADR before building, so the build has a spec." → **end here** and output the paste-ready handoff (below). Do not build.
  2. `No — not needed` — "I've judged there's no real decision here; build directly." → proceed to Step 1.
  3. `Skip for now` — "Build it without an ADR; I'll backfill the decision later." → proceed to Step 1, and leave the feature's `Needs ADR?` = `yes` with a `⚠ ADR pending` note in `docs/features/index.md` so it isn't forgotten.

The tool appends "Other" as a free-text option automatically.

**On `Architect it first`**, end the skill with this handoff for the engineer to paste:

> Run this next, then come back to `/develop`:
> ```
> /architect <feature> — <the specific decision to settle>
> ```
> Once the ADR exists, re-run `/develop <task>` and I'll build to it.

**If no decision is owed** (pure implementation), skip the question and proceed.

### Step 1 — Classify the track

| Signals | Track |
|---|---|
| "page", "component", "screen", "layout", "ui"; a screenshot is attached; visual work against `design.md` | **UI** → `ui-guide.md` |
| "api", "endpoint", "service", "functionality", "logic", "data", "job", "webhook", "integration" | **Logical** → `logical-guide.md` |
| Both present (e.g. "auth": pages + session logic) | **Both** — run each track for its part |

If genuinely ambiguous, ask once: "Is this the UI, the logic behind it, or both?"

### Step 2 — Load the decision and conventions (both tracks)

Before building, read:
1. **The governing ADR** — from the `index.md` pointer, or the one found in Step 0. This is the spec: data model, API surface, invariants, security model, the provider/library already chosen.
2. **The nearest `AGENTS.md`** to the target code area (proximity — Claude Code auto-loads it; read it explicitly to be sure). This carries decisions synced from earlier features, so you **don't re-ask** what's already settled.
3. **`design.md`** (UI track only) — the visual source of truth.

This step is why `/develop auth functionality` doesn't re-ask the stack chosen during `/develop auth pages`: `/architect` decided it, `/sync` wrote it into `AGENTS.md`, and you read it here.

### Step 3 — Set status and build

- In `docs/features/index.md` (if the roadmap exists), set the feature's **Status** to `in-progress` and find the specific build sub-task(s) you're about to do in its breakdown checklist.
- **UI track** → follow `ui-guide.md` end to end (component-or-screen → stack/styling/dark-mode detection → token sync → font → the five implementation phases → accessibility).
- **Logical track** → follow `logical-guide.md` end to end (ground in the ADR → data layer → core logic → interface → integration → correctness pass).
- **Both** → build the logical track first (so the UI has something to bind to), then the UI track.

### Step 4 — Update the roadmap and report

- In `docs/features/index.md`: tick the build sub-task(s) you completed (`[ ]` → `[x]`), fill in the feature's `Code area` (and `ADR`) pointers, and set its **Status** to `done` only when every sub-task is checked — otherwise leave it `in-progress`.
- Relay the track's report (the `## /develop complete` block from `ui-guide.md` and/or `logical-guide.md`).
- Recommend the next step per tier: usually `/test`, then `/sync` to promote any new area conventions into `AGENTS.md`.

`/develop` builds; it does not run `/test`, `/sync`, or `/architect` for you — it points; you decide.

---

## Reference files

- UI build track: `ui-guide.md`
- Logical build track: `logical-guide.md`
- Accessibility checklist (UI track, Phase 5): `checklist.md`
- Design templates (UI track): `templates/`
- Project design system (UI track): `./design.md`
