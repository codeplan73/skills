---
name: roadmap
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Turn a product idea into a living, coarse roadmap in docs/roadmap/, and keep it current as you ship. Run /roadmap to plan a new product, plan the next slice, or enroll one named feature; run it with no argument to reconcile after shipping and queue what is next. It seeds WHAT to build; /architect designs, /develop builds."
---

## Output style (plain words, no dashes)

All output (roadmap and messages): plain simple language; keep meaningful technical terms but explain each in plain words. Zero dashes of any kind (no em dash, en dash, or hyphen as punctuation); use short sentences, commas, or parentheses instead.

## What this skill does

Turns an idea into an ordered, coarse, living plan and keeps it honest as the product ships. Answers "what do I build, in what order, how heavy, which need a decision first?", not "how do I build this one thing?" (that is `/architect` and `/develop`).

Roadmap shape, coarse and small: a slim At a glance table (`# · Feature · Phase · Status`) + feature sections grouped by phase (see `roadmap-template.md`). Each section: heading `### N. Name` with short tags only when they matter (`needs a decision`, an approach override, `full` weight), a 1 to 2 line intent, one `Done when:` line (acceptance-criteria seeds, the WHAT), checkbox steps.

Feature shape lifecycle: not yet designed → one box, its entry command. On ADR capture, `/architect` fills the built-ready shape: `Design it (ADR)` ticked, ADR linked, `Build it: /develop <feature>` with 2 to 5 milestone sub-items rolled up from the ADR's `## Build plan`, then `Verify it: /verify <feature>` and `Test it: /test <feature>`. Atomic build tasks stay in the ADR's `## Build plan`, never here; every box is a command or tracked milestone. Status: in the table and beside the heading; ADR and code pointers once they exist. `/roadmap` seeds the what; `/architect` designs the how and defines milestones; `/develop` builds; `/verify` and `/test` close; `/sync` reconciles conventions after.

One command, inferred intent (`/roadmap [what]`, never a subcommand):
- **plan** (default): no roadmap yet + a product-sized idea, or asking for the next slice. Full pass: ask → decompose into coarse feature sections → order + phase → write.
- **replan**: roadmap exists + no argument. Reconcile what shipped, enroll needs surfaced during the build, reorder, queue the next slice. The normal living rhythm, not rare: run bare `/roadmap` again.
- **add**: roadmap exists + argument names a single feature. Enroll one coarse row (intent + order + weight + Needs ADR) without re-planning: `/roadmap <a feature>`.

## Asks vs acts

Senior product engineer, thorough across all dimensions. Same infer / ask / recommend discipline as `/architect`: INFER what the idea states (category, obvious capabilities); ASK the un-inferable across business, product, go-to-market in batched rounds (up to 4 questions per round; see Decision panels); RECOMMEND build approach, build order, each feature's weight, which need an ADR (expert calls: present them, let the engineer override).

Never pick tools: no provider, library, ORM, host, or BaaS chosen or named; that is `/architect`'s job per feature in the ADR. A feature implying a tool choice is exactly `Needs ADR: yes`. Keep the roadmap tool-agnostic so it doesn't rot.

## Decision panels (every user-facing choice)

Every choice is an options panel, never a neutral menu: 2 to 4 concrete options real to this product; exactly one marked `(recommended)` with a one-line why (make the call, let them override). Never add your own Other option, the picker appends a free-text Other automatically; offer free text yourself only in a plain-text fallback with no picker. Capability-first: use the agent's picker (`AskUserQuestion` on Claude Code), else the same options as plain text; batched rounds same rule, up to 4 per round.

## Artifact ownership

`docs/roadmap/` is the feature roadmap, owned by this skill; `/architect` owns `docs/adr/`. Other skills find a feature by scanning `docs/roadmap/` for its row. Living document: `plan`, `replan`, `add` all edit in place (reconcile and append, never a new dated file). Writes nothing else: no ADRs, code, or `AGENTS.md`. `docs/roadmap/` holds roadmap files only; inventories, analyses, research docs live with the ADR under `docs/adr/…/research/` (owned by `/architect`).

File shape:
- Small product: one file, `docs/roadmap/roadmap.md` (At-a-glance table + phase-grouped sections + legend).
- Large product: epic-split: `docs/roadmap/index.md` (At-a-glance table across epics + one-line status rollup per epic, each linking its epic file) + one file per epic named by area (`docs/roadmap/auth.md`, …).
- Promote on demand: start single-file; when `roadmap.md` outgrows a comfortable scan (roughly a dozen-plus features across clearly distinct areas), rename to `index.md` (keep table + per-epic rollup), move each area's sections into its own `<epic>.md`. Never pre-split. Names semantic (`roadmap.md` / `index.md` / `<epic>.md`), never numbered.
- Keep every file coarse and small; a long epic file needs finer features and tighter intent, not a build-task dump.

Status lifecycle (`/roadmap` sets initial status; the pipeline advances it):
- New features start `planned`. Brownfield: also enroll pre-existing features as `existing` (complete) or `in-progress` (partial), the only other statuses `/roadmap` writes.
- `/develop` advances pipeline-built work (`planned` → `in-progress` → `done`); `/sync` reconciles against the diff.
- `done` ≠ `existing`: `done` = this pipeline built and verified it; `existing` predates the workflow; `/develop` and `/sync` never touch `existing` rows.
- `replan` may set a de-scoped feature to `dropped`, never deletes rows; `dropped` keeps history, excluded from active counts and work; `/develop` and `/sync` skip it.

Process weight (absorbs the old `/triage`): every feature carries Weight `lean` · `medium` · `full`, one column turning downstream process on or off. `lean`: trivial, low-risk, well-understood; skip design-review and `/harden`; often `Needs ADR: no`. `medium`: moderate scope or a real decision; normal path. `full`: high risk, large scope, or compliance-sensitive; design-review and `/harden` required; almost always `Needs ADR: yes`. `/roadmap` sets the initial weight (same signals `/architect` and `/develop` use; README Tiers are the reference); downstream skills read this column.

Artifact base: `docs/` by default; if `docs/` is a published docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` (`.workflow/roadmap/…`). Always follow whichever base already exists (paths here assume `docs/`).

Concurrency: shared across sessions and teammates. Re-read immediately before writing; surgical edits only (append rows in order, reconcile changed cells, never rewrite the file); flag rather than clobber unexpected state; append with the next free numbers so adders don't collide.

## Reference files

- `roadmap-template.md`: format rules, At-a-glance table, per-feature sections (heading + intent + Done-when + checkbox tasks + pointer line), brownfield-enrollment and epic-split shapes, the `## /roadmap complete` report block. Read it when writing the roadmap and the report.

## Portability (any OS, any agent)

Any Agent Skills client on macOS, Linux, Windows. Detection snippets are POSIX reference; use your agent's cross-platform file tools. Planning runs inline; the two subagents below (Step 1 brownfield code-scan, Step 6b sourcing) are optional and capability-first, degrade to inline. No interactive picker: ask every panel as plain text, same options.

## Execution

### Step 0 — Infer intent & idea check

No subcommand. First check whether a roadmap exists under `docs/roadmap/` (or `.workflow/roadmap/` if that is the artifact base), then infer:
- Roadmap exists + no argument (or a re-run described as "reconcile / what's next") → replan behavior (`modes/replan.md`).
- Roadmap exists + argument names a single feature → add behavior (`modes/add.md`).
- No roadmap yet + a product-sized idea, or scoping the next slice (including brownfield) → plan behavior, below.

Ambiguous (a new slice vs a single feature): infer the most likely reading from scope, say which behavior you chose in the report; truly unclear → one-line clarifying question.

Plan behavior, no idea given (no argument, no roadmap to extend): stop and ask before anything else:

"What are you building? Describe the product or the slice of it you want to plan (one or two sentences about what it does and who it's for)."

Wait for the answer; use it as the product idea.

### Step 1 — Load the inferred behavior

After Step 0 infers the behavior, read exactly one mode file and follow it:

- `modes/plan.md` for plan behavior (new roadmap, product-sized idea, or next slice planning).
- `modes/replan.md` for replan behavior (roadmap exists and no argument).
- `modes/add.md` for add behavior (roadmap exists and the argument names one feature).

Do not read the other mode files unless the inferred behavior changes. All common rules above still apply, and `roadmap-template.md` remains the format reference for any write/report.

## Reference

- `roadmap-template.md`: see Reference files above.
