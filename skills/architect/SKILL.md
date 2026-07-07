---
name: architect
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Make and document an architectural or technical decision before writing code. Run /architect when choosing between approaches, designing a feature or page, picking a tech stack, or when /develop says a decision is owed. Acts as a Staff level engineer: asks deep questions, recommends an answer, and writes a complete build spec ADR to docs/adr/. Owns all ADR files."
---

## Output style (plain words, no dashes)

Write everything this skill produces (the ADR and every message to the engineer) in plain simple language, keeping technical terms that carry real meaning but explaining each in plain words. Use zero dashes of any kind in output (no em dash, no en dash, no hyphen as punctuation); use short sentences, commas, or parentheses instead.

## What this skill does

Runs structured discovery, weighs options, and writes or updates an Architecture Decision Record (ADR) in `docs/adr/`. Four modes:

| Mode | When | Subagent behaviour |
|---|---|---|
| `FEATURE` | Designing a new feature from scratch, with or without existing code | First-principles design, best practices, minimal code reading |
| `ARCHITECTURE` | Choosing a tech stack or foundational architecture for a new project | Comprehensive stack evaluation, industry patterns, no code to read |
| `ENHANCEMENT` | Improving, replacing, or scaling something that already exists | Read existing code + ADRs, focused option comparison |
| `CROSS-CUTTING` | Standardising a pattern across the whole codebase (error handling, logging, auth, naming) | Sample current state, define the standard precisely, recommend enforcement |

- **Create**: new decision → new ADR with status `Proposed`
- **Update**: evolving an existing decision → edit existing ADR in place
- **Supersede**: replacing a past decision → new ADR + update old ADR's status line

ADR status behaves one of two ways, decided by whether a buildable roadmap feature links the ADR (a `docs/roadmap/` row whose `ADR` cell points to it):

- **Feature-linked ADR** (typical FEATURE/ENHANCEMENT, or an ARCHITECTURE foundation that has a roadmap row): status mirrors the feature lifecycle. /architect creates it as `Proposed` and owns its content but never advances the status; /develop advances it to `In Progress` when the feature goes in-progress, then `Accepted` when built and verified (roadmap `done`). Engineer confirmation ratifies content only; `Accepted` means shipped.
- **Standalone decision ADR** (foundational/stack or cross-cutting standard, no roadmap row links it): decision-status. `Proposed` when written, `Accepted` once the engineer ratifies it on confirmation (the decision is then in force). /develop does not advance it.

An ADR documenting already-shipped work (the "already built" path, or a linked feature already `existing`) is born `Accepted`.

Writes no code. Never updates `AGENTS.md`/`CLAUDE.md` (/sync owns that).

## Asks vs acts

Ask targeted questions before spawning any subagent; spend the budget on substance. Sort every question:

- **INFER**: anything the prompt or codebase reveals (feature vs architecture, the stack, UI in scope, an already chosen provider). Derive, never ask.
- **ASK**: only what the engineer alone knows (requirements, preferences, business rules, compliance scope).
- **RECOMMEND**: anything expertise settles (which provider/library/pattern fits). State the pick, a one-line why, and the runner-up; they may override. Never a neutral menu, never a silent decision.

Project preference, walk it phase by phase, suggest, don't decide: for the **stack**, the **data model**, and the **tool/provider choice**, the engineer goes through each phase and picks (stack: application type, framework, database, auth, deployment, API, and so on), with your suggested option marked at each phase. Never bundle a complete data model, full stack, or pre-baked acceptance-criteria set into one accept-or-change panel.

Grill the engineer on the feature with feature-specific questions: data model, business rules, behavior, scale, library/provider choice, and (with UI) what each screen contains and its sections. Keep asking, in as many batched rounds as needed, until the ADR is a complete build spec. The less specified, the more you ask. Framing (stack, platform, team/constraints) is inferred from `AGENTS.md` and the codebase, never asked.

Recommendations align with the stack in use (on a BaaS, prefer its auth/storage over new external tools; reuse beats sprawl). Web or mobile alike: infer the platform, never assume web.

## Artifact ownership

ADR files in `docs/adr/`, created or updated by this skill only, plus any research it produces (inventories, audits), which lives beside the ADR it informs, never in the roadmap folder (`docs/roadmap/` is owned by `/roadmap`, not an ADR).

Two independent choices, location (repo shape) and shape (decision size):

- **Location = repo shape.** Single repo → `docs/adr/`. Monorepo → `docs/adr/<workspace>/` for a workspace decision, `docs/adr/_root/` for a repo-wide one (mirrors the roadmap). Numbering is per location (scan that dir for the next `NNNN`). Call the resolved location `$ADR_DIR`.
- **Shape = decision size**, the same in any repo shape. Simple decision: one file `$ADR_DIR/NNNN-title.md`. A decision needing a directory (related sub-decisions, or `research/`, or a `verify.md`) always uses `index.md` as its top file: `$ADR_DIR/NNNN-title/index.md` plus child ADRs `NNNN-<child>.md` and a `research/` subfolder. Never double the name (`NNNN-title/NNNN-title.md`); the directory carries the number, the top file is `index.md`, umbrella or not. Default to a single file; use the directory shape when there are child decisions, or bulky research, or a `verify.md` (e.g. a big single-decision audit gets `docs/adr/0001-dedup-strategy/{index.md, research/…}`).

  Every file is discoverable from the decision that owns it, no orphan research. In a directory ADR:
  - Top file is always `index.md`; when there are children or research it opens with a `## Structure` manifest listing and linking every child ADR and every research file, one line each (what it is plus which decision it supports).
  - Each child ADR links its own evidence in a `## References` section.
  - Research filenames carry their owner's prefix: `research/NNNN-<topic>.md` (the child's number) or `research/_shared-<topic>.md` (umbrella-wide evidence).
  - Children stay flat by default (`0001-payment-provider.md`); promote a child to its own folder (`0001-payment-provider/{index.md, research/…}`) only when it accumulates multiple research/asset files.
  - Each child ADR is self-sufficient to build from; `research/` is optional evidence, not required reading (`/develop` opens a research file only when it needs the underlying data). Cross-child contracts (how two children connect) live in the umbrella `index.md`.
- **One narrow exception into the roadmap:** after the ADR is confirmed, update the matching feature to the built-ready shape (exact edits in *After subagent completes*, step 3). Never dump the atomic task list into the roadmap. No matching feature: offer to enroll one (see the derive-tasks step).

**Artifact base.** ADRs live under `docs/` by default. If `docs/` is a published docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` instead (`.workflow/adr/`). Always follow whichever base already exists (paths here assume `docs/`).

---

## Portability (any OS, any agent)

- **Commands**: `git` is the only required CLI, same on every OS. Other shell snippets (`mkdir -p`, `date`, `find`, `ls`, `cat`, `wc`) are POSIX reference, not literal scripts; use your agent's cross-platform file tools (read, search/glob, write, create-dir) and your knowledge of today's date. Create `docs/adr/` with your write tool, not `mkdir`.
- **Bundled files**: the fallback question files (`questions/*.md`), `agent-prompt.md`, `agent-modes/*.md`, and `adr-template.md` live at paths relative to this skill's folder. The main agent resolves this folder to an absolute path and passes the absolute paths of `agent-prompt.md`, the one matching `agent-modes/<mode>.md`, and `adr-template.md` in the spawn prompt; the subagent reads them itself, and the main agent does not read them into its own context (see Subagent spawn). Fallback: if the client's subagents cannot read files, read and inline the contents instead.
- **No subagent / interactive-question support?** Use whatever your agent provides (a subagent, per-step model selection, an options picker) and fall back only where missing: do the research/drafting inline yourself, and ask the question rounds as plain text with the same options.

## Execution

### Step 0 — Topic check (before pre-flight)

If no design topic was provided (`/architect` with no argument or an empty description), stop and ask before doing anything else:

"What design decision do you want to work through? Describe the feature, system, or choice you need to design in one or two sentences."

Wait for the answer; use it as the design topic before pre-flight.

---

### Pre-flight (main model)

Run these steps (the `git` commands are literal; everything else uses your agent's file tools):

- **Freshness (teams):** `git fetch` quietly, pick the base branch (`main` if `git rev-parse --verify main` succeeds, else `master`), count commits behind with `git rev-list --count HEAD..origin/<base>`. If >0, warn "pull first" before deciding (a teammate may have added ADRs or changed this feature).
- **Resolve the ADR location** (`ADR_DIR`) = the roadmap workspace mirrored into `docs/adr/`: single repo → `docs/adr/`; monorepo workspace → `docs/adr/<workspace>/`; repo-wide → `docs/adr/_root/`. Determine `<workspace>` as the roadmap does (topic/path/roadmap row). Create the directory if missing.
- **Today's date**: use today's date (inject it into the ADR).
- **List existing ADRs in this location**: files named `NNNN-*.md` plus any `index.md` in `$ADR_DIR`, for numbering (per location) and related-decision detection.
- **Count source files** (e.g. `.ts`, `.tsx`, `.js`, `.py`, `.go`, `.rs`, `.java`), excluding `node_modules/`, `.git/`, `dist/`. Informs how much the subagent reads.
- **Read project context**, the source of truth for the stack and community skills: root `AGENTS.md` (fall back to `CLAUDE.md`, else MISSING), plus the nested `<area>/AGENTS.md` for this feature's area if one exists (e.g. `src/auth/AGENTS.md` for an auth feature).
- **Read the build approach for THIS feature**: the delivery strategy that governs how the ADR's `## Build plan` is ordered and sliced. Precedence: this feature's roadmap-row `Approach` override if declared, else the project default (root `AGENTS.md` first, else the roadmap header in `docs/roadmap/`). A feature with its own approach is built by ITS approach; others use the project default. The family: **Tracer Bullet** (thin vertical slices end-to-end through every layer), **Skateboard** (thinnest usable whole first, then grow), **Facade** (UI shell first, wire the backend later, a prototype path), **Journey** (one complete user path per phase), or a project-specific variant. Carry what you find into the subagent. If neither records one, note the assumption and set the default by Staff/Principal judgment (prefer end-to-end / Tracer-Bullet slices for production work). Reason about what the approach implies for this feature; no fixed per-approach recipe.
- **Locate the linked roadmap feature (if any):** cheaply scan `docs/roadmap/` filenames/headings (including per-workspace subdirs) for a feature matching this topic; open only the single roadmap file containing it (`roadmap.md`, or the matching `<epic>.md` in a split). If found, read that row's intent plus any acceptance-criteria seeds (they seed Stage (a)) and remember the file/row for the derive-tasks and linking steps; this also settles feature-linked vs standalone status. If no row matches, note the standalone-decision path and don't create one now.
- **(Optional)** list installed skills dirs for availability only (`.claude/skills/`, `.agents/skills/`, `skills/`). Relevance is decided by AGENTS.md plus the feature, not name-matching.

From the ADR list (paths relative to `$ADR_DIR`):
- **Next number**: highest existing + 1, zero-padded to 4 digits; `0001` if none (an umbrella directory counts as one number). Collision guard (teams): re-list `$ADR_DIR` immediately before the subagent writes; if the chosen `NNNN` exists, bump to the next free number. Never overwrite an existing ADR; after writing, confirm no concurrent run took the same number.
- **Filename / shape**: kebab-case slug from the topic, max 5 words, no articles, lowercase.
  - Simple decision → `$ADR_DIR/NNNN-kebab-title.md`.
  - Umbrella (splits into ≥2 related sub-decisions + research) → directory `$ADR_DIR/NNNN-kebab-title/` with `index.md` (the umbrella decision listing its children), child ADRs `NNNN-child.md` inside it, and inventories/audits under `research/`. Decide from the topic's breadth before the subagent writes; tell the subagent the shape.
- **Related ADRs**: read the first 20 lines of each existing ADR (title, status, opening of Context) to check overlap with the topic. Flag matches.
- **Child-of-umbrella detection**: if the topic is a sub-decision of an existing umbrella (`$ADR_DIR/NNNN-<umbrella>/`), e.g. one that surfaced while building under it, place the new ADR inside that directory as the next child (`NNNN-child.md`) and add it to the umbrella's `index.md` list, not a new top-level ADR. Same path when `/develop` hits a decision mid-build. Tell the engineer where it's going.
- **Update/supersede detection**: if an existing ADR clearly overlaps the topic (same domain, system, decision), before the staged conversation present a decision panel (plain-text options where the agent has no picker; the picker adds Other automatically): "I found an existing ADR that may overlap: `[path]`, [title]. How should I treat this?", options: **New decision (create a new ADR)** · **Update the existing ADR in place** · **Supersede it (a new ADR replaces it)**. Pre-select the "(recommended)" option by overlap strength (near-identical → Update or Supersede; adjacent → New). On update/supersede: set OPERATION, read the existing ADR in full, and skip the staged conversation for in-place updates.

**Community skills** come from the project's `AGENTS.md`, never a hardcoded name table (names and stacks change). Project-wide skills/conventions live in root `AGENTS.md`, area-specific ones in the nested `<area>/AGENTS.md` (maintained by `/audit` and `/sync`):

1. Read root `AGENTS.md` and the nested `AGENTS.md` for this feature's area; they name the stack and the community skills the project relies on.
2. Identify only the skills relevant to *this* feature. Do not read or inline their content: pass each relevant skill's path plus a one-line relevance note to the subagent, which reads on demand (see Subagent spawn, item 12). Skip skills the feature doesn't touch.
3. Available ≠ relevant. You may list the installed skills dirs to see what exists, but relevance comes from the feature plus `AGENTS.md`. If a clearly relevant skill is installed but not yet referenced in `AGENTS.md`, use it anyway and flag (ADR Follow-up) that it belongs in the right context file: root if project-wide, nested `<area>/AGENTS.md` if area-specific.
4. Whatever the context files show the project already uses (a BaaS, an ORM, a payment provider, an auth library) is what your library/provider recommendation must build on or prefer, not an unrelated external tool. If a genuinely better option isn't installed, note it as an ADR Follow-up rather than silently assuming it.

**Workflow skills** (never treat as community skills): `audit`, `architect`, `roadmap`, `develop`, `verify`, `test`, `review`, `harden`, `document`, `debug`, `sync`, `status`, plus new workflow skills as they're created.

---

### Scope validation, framing, and staged design conversation

For create or supersede operations, read `internal/design-conversation.md` now and follow it. It contains Scope validation (including the already-built documentation path), Framing, and the staged design conversation. Do not read it for in-place ADR updates.

### Subagent spawn

After the staged conversation, resolve this skill's folder to an absolute path (you already resolve these relative paths, so you know the folder) and pass the absolute paths of `agent-prompt.md`, `adr-template.md`, and the one mode file matching the inferred MODE:
- `FEATURE` → `agent-modes/feature.md`
- `ARCHITECTURE` → `agent-modes/architecture.md`
- `ENHANCEMENT` → `agent-modes/enhancement.md`
- `CROSS-CUTTING` → `agent-modes/cross-cutting.md`

Do NOT read these files into your own context.

The spawn prompt tells the subagent:
- **Your first action is to Read all three files.**
- **From `agent-prompt.md`**: follow the common instructions. At `## Instructions by mode`, it tells you to read `MODE_FILE_PATH`; follow that mode file as the only mode-specific block. Everything outside that section applies in full: the persona ("Who you are / How you think / What you do NOT do"), Step 0, Step 0b, `## Expert rules that apply to all modes`, and `## Report format`.
- **From `adr-template.md`**: use only the part between `=== ADR TEMPLATE START ===` and `=== ADR TEMPLATE END ===` (the ADR section structure + field guidance: Summary, Context, Options considered, Decision, Rationale, the mode-specific design section, Consequences, Follow-up, References, etc.). Ignore the trailing reference and meta sections (`## Filename conventions`, the `## Status values` table, the umbrella-structure / child-status notes, and the `## Writing rules` commentary); those are main-agent guidance (the main agent resolves the filename, shape, and initial `**Status**:` and passes them as placeholder values; the `**Status**:` line to write is conveyed by the "On the initial `**Status**:` line" rule in `## Expert rules that apply to all modes`). Do not edit `adr-template.md`.
- **Placeholder values**: pass every dynamic value as a labeled list in the spawn prompt ("Placeholder values: MODE=..., BUILD_APPROACH=..., ..."), one entry per item below; the subagent substitutes each placeholder with its given value as it reads.

**Fallback:** if the client's subagents cannot read files, read the common prompt, matching mode file, and ADR template yourself and inline the contents instead (only the resolved mode file, and only the template text between the START/END markers).

**References and links — reuse the Stage (c) `REFERENCES_LEVEL`.** The subagent writes the References section and `(basis: ...)` citations only at the chosen level: `none` = no `## References` section and no citations anywhere (Rationale stays); `sources` = named Project sources and Practices only, no links, no web tools; `sources+links` = sources plus web verified links (give the subagent web tools so it fetches to confirm each link before writing it). Only if Stage (c) never ran (e.g. the documentation path), present the References consent panel now (same panel, recommended pick `No references, keep it clean`) and set `REFERENCES_LEVEL`; the landscape check is moot at write time.

Then spawn a subagent:

- `model`: a strong model (e.g. `sonnet`/`opus` on Claude Code)
- `description: "Architect: <mode> — research and draft ADR"`
- Tools: `Read`, `Bash`, `Write`, `Edit`. Add `WebSearch`, `WebFetch` only when `REFERENCES_LEVEL` is `sources+links` (they verify links, fetch to confirm before linking; sourcing rules in `agent-prompt.md`).
- `prompt`: the three absolute file paths (`agent-prompt.md`, matching `agent-modes/<mode>.md`, `adr-template.md`), the read instructions above, and the Placeholder values list. Include `MODE_FILE_PATH=<absolute matching mode file path>` in the Placeholder values list.

The inferred MODE (from Framing) is already one of `FEATURE` / `ARCHITECTURE` / `ENHANCEMENT` / `CROSS-CUTTING`; pass it directly.

Placeholder values to pass:
1. Design topic (from the user's original message)
2. The inferred framing: MODE, platform (web/mobile/API), stack & conventions (from `AGENTS.md`), and any constraints/compliance inferred or confirmed
2a. The feature's build approach (pre-flight precedence: roadmap-row `Approach` override, else the project default from `AGENTS.md`/roadmap header, else the noted default) → `BUILD_APPROACH`, so the subagent orders and slices `## Build plan` by what the approach implies for this feature
3. All staged-conversation answers, stage by stage: the confirmed acceptance criteria (already IDed AC-1…, to seed `## Requirements`), the confirmed data model (entities/fields/relationships, to seed `## Build plan` task 1), the confirmed stack/tool picks, API surface, authz model, and edge cases. If the staged conversation was skipped (documentation path), pass: `"Staged design skipped — documenting an already-made decision"` so the subagent knows it was intentional, not an error
3a. The RECOMMEND items → `RECOMMEND_ITEMS_OR_NONE`: the specific decisions the subagent must make and justify (tool/provider aligned to the stack, session model, etc.). If none, pass `"none"`
3b. The References level → `REFERENCES_LEVEL` (`none` | `sources` | `sources+links`, per the rule above). If Stage (c) never ran and you have not asked, default to `none`
3c. The mode file path → `MODE_FILE_PATH` (the absolute `agent-modes/<mode>.md` path passed above)
4. Context-file contents: `AGENTS.md` (root + the feature area's nested), or `CLAUDE.md` as fallback, or "MISSING"
5. Existing ADR list (filenames + first line of each)
6. Related ADR paths (flagged in pre-flight)
7. The resolved ADR location (`$ADR_DIR`), next number, and shape: a single file `$ADR_DIR/NNNN-title.md`, or an umbrella directory `$ADR_DIR/NNNN-title/` (`index.md` + child ADRs + `research/`). If umbrella: name the child decisions to write, and any inventory/audit it produces goes in `…/NNNN-title/research/`, never in `docs/roadmap/`, never loose in the code tree. Only the umbrella `index.md` carries a `**Status**:` line (it mirrors the feature); child ADRs omit the lifecycle Status (spec content governed by the umbrella)
8. Source file count (so the subagent knows if there's code to read)
9. Operation: `create` | `update` | `supersede`
10. Today's date (from pre-flight)
11. Documentation context (if the "already built" path ran: the engineer's free-text answers about why this was chosen, alternatives, and tradeoffs)
12. Community skills — pass paths + relevance notes, not full content (read on demand). For each skill relevant to this feature (identified from `AGENTS.md`, per pre-flight), one line: name, real project path, and a one-line note on why it's relevant, e.g. `` `supabase` (`.claude/skills/supabase/`) — RLS + auth conventions relevant here ``. The subagent opens a skill file on demand, only if it materially shapes this decision (the content stays authoritative when consulted, just not front-loaded in full). For a relevant-but-not-installed skill, list its name only. If none are relevant, pass "none detected".
    - FALLBACK, subagents that cannot read files: inline each relevant skill's full content under a labelled section, so the knowledge is still present.

---

### After subagent completes

When the subagent finishes, read `internal/after-subagent.md` and follow it for ADR self-check, confirmation, status ratification, roadmap linking, and the final spoken summary. Do not read it before the subagent runs.

### Update / Supersede path

If the task is to update or supersede an existing ADR:
- Pre-flight: read the existing ADR in full
- Skip the staged conversation if operation is in-place update
- Tell the subagent: `update` or `supersede`
- If supersede: subagent creates new ADR AND updates old ADR's status to `Superseded by [NNNN](NNNN-title.md)`

---

## Reference files

- ADR template: `adr-template.md` (passed to the subagent as an absolute path)
- Research subagent prompt: `agent-prompt.md` (passed to the subagent as an absolute path)
- Research subagent mode instructions: `agent-modes/*.md` (only the matching mode file is passed)
- Main-thread design conversation: `internal/design-conversation.md` (read only for create/supersede)
- Main-thread completion flow: `internal/after-subagent.md` (read only after the subagent finishes)
- The staged design conversation is generated per feature (see *Staged design conversation*, stages a–f), not stored
- Generic mode files (`questions/`) are a structural fallback only, used when the feature is too vague to generate from
