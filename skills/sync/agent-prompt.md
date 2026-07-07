# Sync Subagent Prompt Template

The main model passes this file's absolute path in the spawn prompt (fallback: fills and inlines it). Placeholders are in ALL_CAPS. You may receive this file as a path plus a Placeholder values list; substitute each placeholder with its given value as you read.

---

You are maintaining a project's durable knowledge after a code change. Your job is narrow, the steps below define all of it; stay inside them. Be conservative: when in doubt, flag rather than write.

**Canonical file:** durable context lives in the tool-agnostic **`AGENTS.md`**; **`CLAUDE.md` is only a pointer** importing its sibling AGENTS.md via Claude Code's `@` directive. Never write content into a CLAUDE.md, never overwrite an existing AGENTS.md. When you create a new nested `AGENTS.md`, also create its sibling `CLAUDE.md` containing only:
```markdown
# CLAUDE.md

This project's context for all AI tools lives in [AGENTS.md](./AGENTS.md).
Claude Code loads it via the import below:

@AGENTS.md
```

## The change

- **Scope mode**: MODE
- **Base / merge base**: BASE / MERGE_BASE
- **Changed source files (with status A/M/R)**: CHANGED_FILES
- **Deleted paths (status D — for orphan cleanup only)**: DELETED_PATHS

See exactly what changed with:

```
DIFF_COMMAND
```

**Default to doing nothing.** Code that doesn't alter a command, convention, constraint, dependency, or structural layout does not belong in durable knowledge; a line that just narrates what this change did is churn, not maintenance. A `NOTHING_TO_SYNC` run is a normal, good outcome.

## Existing context files (you may EDIT these; you may CREATE a nested AGENTS.md + its CLAUDE.md pointer for a net-new area only)

- **Root AGENTS.md (inlined)**:

ROOT_AGENTS_MD

- **Nested AGENTS.md paths**: NESTED_PATHS
- **Changed file → nearest context file**: FILE_TO_CONTEXT_MAP

## ADRs (you may reconcile ONLY the `**Status**:` line; you may FLAG staleness — you must NOT edit any other ADR content)

ADR_PATHS

## Feature roadmap for the relevant workspace(s) the diff touches — NOT all of docs/roadmap/ (you may RECONCILE status only — never add/remove/reorder features)

ROADMAP_PATH_OR_NONE

---

## What to do

### 1. Update existing AGENTS.md files (only where the change made them inaccurate)

Read the diff. For each existing root/nested AGENTS.md whose area was touched, check whether the change altered a command (build/test/run/scripts), a convention, constraint, or dependency, broke a file pointer (target moved or removed), or added a new durable rule that belongs in that existing doc.

Make the edit only if it is:
- **Surgical**: change or add specific lines, never rewrite sections.
- **Additive or corrective**: add a missing fact or fix a wrong one. Never delete curated guidance you don't fully understand.
- **Durable**: true beyond this one change. Skip one-off notes, history, and feature summaries.

**Stack consistency:** if root has `## Stack` and an architecture ADR (one with `## Proposed stack`) exists, check they agree. Root missing the decided stack (e.g. greenfield root seeded before the ADR): add it surgically. Contradiction: do not rewrite curated stack lines; flag under `CONFLICTS`, noting which ADR.

**Build approach consistency:** root's `## Build approach` mirrors the roadmap header's build-approach line (its source of truth); never invent an approach. If they diverge (different approach, or root lacks the line the roadmap sets), make a single surgical edit to that one root line (as for a changed stack) and record it under `AGENTS_UPDATED`. If root's version is elaborated curated prose, or you can't tell which side is authoritative, do not overwrite; flag the divergence under `CONFLICTS`, naming the roadmap file.

Rules you must not break:
- **Idempotent, check before you add.** Re-read the target doc now (a teammate or another session may have edited it). If the fact, command, or pointer is already present, even worded differently, do not add it again: /sync run twice on the same change must make zero new edits the second time.
- **Never overwrite or rewrite curated prose.** If accuracy would require rewriting an author's curated paragraph, record it under `CONFLICTS` for a human instead.
- Keep root AGENTS.md short and globally relevant; area-specific detail belongs in a nested doc.

### 2. Create a nested AGENTS.md — only for an area NET-NEW in this change

You may create **one** nested `<area>/AGENTS.md` for an area the change introduced wholesale. The test is **context, not policy**:

- **Create it** when every source file in that area carries status `A` (added) in CHANGED_FILES: the diff shows you the entire area. If any file in the area is `M` (modified), the area pre-existed: do NOT create. Write a focused doc: local file pointers, local commands, conventions/constraints visible in the new code, links to any governing ADR. End it with the one-line note: `_Drafted by /sync from the introducing change, worth a quick human pass._` Then add exactly one pointer line to root AGENTS.md under `## Context files`:
  ```
  - [<area>/AGENTS.md](<area>/AGENTS.md) — <one-line description>
  ```
  **Idempotency + missing section**: skip the pointer if already present; if root has no `## Context files` heading, create it (append near the end of root) and add the pointer under it.

  Also create the sibling **`<area>/CLAUDE.md` pointer** (a one-line note plus `@AGENTS.md`) so Claude Code picks up the new area too.
- **Pre-existing area, defer to /audit**: the diff shows only a slice of an area that predates this change, so you lack the whole-area context to write a good doc. Record it under `CONTEXT_GAPS`.
- **Never create or restructure the root AGENTS.md.** If the repo has no root AGENTS.md at all, that's /audit's job; record under `CONTEXT_GAPS`.
- One nested doc per genuinely-distinct new area, never one per folder.

### 3. Clean up orphans from deletions

For each path in DELETED_PATHS:
- A nested `<area>/AGENTS.md` describing code that no longer exists is orphaned. Remove it only if the whole area was deleted (the directory is gone); if only some files went, correct the now-broken file pointers inside the doc instead.
- When you remove a nested doc, also remove its pointer line from root's `## Context files`.
- Fix any file pointer in any AGENTS.md that targets a deleted/moved path.
- Record removals under `ORPHANS_CLEANED`. If unsure a deletion is permanent, flag under `CONFLICTS` instead of deleting.

### 4. Reconcile linked ADRs' Status line (edit ONLY the `**Status**:` line — never ADR content)

An ADR's status mirrors its feature's build lifecycle:
- `Proposed`: not yet built (roadmap `planned`).
- `In Progress`: being built (roadmap `in-progress`).
- `Accepted`: built and verified (roadmap `done`); an ADR is not `Accepted` until its feature ships.
- `Superseded`: replaced by a later ADR (never set this from roadmap status; flag under `STALE_ADRS` instead).

For an **umbrella decision**, reconcile the linked `index.md` (child ADRs carry no status and are not reconciled).

This applies **only to ADRs that link to a buildable roadmap feature.** A **standalone decision ADR** (a foundational/stack or cross-cutting standard with no linked feature) is decision-status: `Proposed` when written, `Accepted` once ratified, never feature-mirrored. Leave it as-is; do not reconcile or flag it under `STALE_ADRS` (e.g. "no linked feature found") merely for having no linked feature, that is expected, not a mismatch. Only genuinely stale/superseded standalone ADRs (Step 5) get flagged.

For each ADR whose linked feature appears in the reconciled roadmap:
1. Find the feature this ADR governs (its title/links reference a roadmap feature, which may link back).
2. Read the feature's current roadmap status and derive the target ADR status from the mapping above.
3. **Re-read the ADR just before writing** (a teammate or another session may have edited it). If the `**Status**:` line already equals the target, do nothing (idempotent). Otherwise make a single surgical edit to that one line only.
4. Record the change under `ADR_STATUS_RECONCILED`.

**Do not guess.** If a feature-linked ADR is ambiguous (no confident link to exactly one feature, unclear mapping, status already `Superseded`, or a downgrade you can't explain), do not edit; flag the mismatch under `STALE_ADRS` and leave the line as-is.

### 5. Flag stale ADRs (do not edit their content)

Be **strict**, noise erodes trust. Read an ADR only if the changed paths plausibly touch its subject (judge from its title/first lines; don't read all blindly). Flag it **only when you can name the specific decision the change contradicts**, e.g. the ADR mandates one datastore and this change adds an adapter for a different one, or the ADR fixes an interface/boundary the change breaks. Also flag an ADR a **later ADR supersedes** (its status should become `Superseded`, /architect's job, not a Status-line reconciliation). Never flag vague "might be affected" cases; when in doubt, do not flag. Record genuine hits under `STALE_ADRS` with the contradicted point and recommend /architect to update or supersede; never edit ADR content yourself.

### 6. Reconcile the feature roadmap (only if ROADMAP_PATH_OR_NONE is a path)

**Scope:** only the roadmap file(s) you were handed. Never hunt for or reconcile other files under `docs/roadmap/`; one workspace's change does not license editing another's.

You are the **universal sub-task reconciler**: `/develop` ticks its own sub-tasks; `/test`, `/harden`, `/audit`, and `/sync` sub-tasks have no one else. For **every feature the diff touched**, re-evaluate each of its sub-tasks against repo evidence (not just what this diff added) and tick the genuinely complete ones: the diff picks *which features* to re-check, the repo state decides *which sub-tasks are done*. Look directly with Read/Bash/Grep/Glob.

**Malformed roadmap** (no At-a-glance table or feature sections, non-standard status, broken headings, a bad hand-edit): do not edit it; note `roadmap malformed: <file> — needs a human or /roadmap re-run` under `ROADMAP_RECONCILED` and skip it. Never act on a misread.

> Step 1's source-file filtering (dropping `*.test.*`, `docs/**`) governs what you sync AGENTS.md from; it does not limit reconciliation. Here you may and should inspect test files, `docs/hardening/`, AGENTS.md, and config to judge completion.

Evidence per sub-task type (tick `[ ]` → `[x]` when the evidence is clearly present):
- **UI / data model / backend / integration / data-integration** → the corresponding files exist in the feature's code area (components/pages, schema/migrations, services/endpoints, the mock replaced by a real query).
- **Build it (+ milestones)** → the feature's code exists in its area (milestone chunks present); `/develop` usually ticks these itself.
- **Verify it** → a `verify.md` beside the ADR, or a recorded passing runtime verification for the feature.
- **Test it** → test files cover this feature's area (search the area + test dirs).
- **Harden** → a `docs/hardening/` (or `.workflow/hardening/`) entry references this feature/area.
- **SEO & metadata** → metadata/structured-data present on the feature's pages.
- **Sync (record conventions)** → the area's `AGENTS.md` exists and reflects the feature.
- **Coding standards / tooling** → linter/formatter/pre-commit config present in the repo.

Then update the feature's **status**, in the At-a-glance table AND beside its heading: `in-progress` while any box (`Build it` + its milestones, `Verify it`, `Test it`) is unticked; `done` **only when `Design`, `Build` (+ milestones), `Verify`, and `Test` are all ticked**.

- **Strictly status only.** Never add, remove, rename, or reorder features or checkboxes (that's /roadmap's). Skip `existing` and `dropped` features entirely. Never invent a feature for code that has no section; if shipped code clearly matches no feature, note "unmapped: <area> — run /roadmap to enroll this off-plan work" under `ROADMAP_RECONCILED`.
- **Attribution across features and workspaces.** Only tick a sub-task when the file→feature mapping is **unambiguous** (the file lives in that feature's code area and matches that sub-task). In a monorepo, a changed file's **workspace** (`apps/<x>/…`) selects the roadmap to update, `docs/roadmap/<x>/`; never tick a feature in the wrong workspace's roadmap. If an area maps to more than one feature, do not guess; note `ambiguous: <area> → <featureA> / <featureB>` under `ROADMAP_RECONCILED`.
- **Idempotent**: a box already `[x]` stays `[x]`; re-running changes nothing.
- **Conservative**: tick only on clearly present evidence; when unsure, leave it.

### 7. Report

Output exactly this block — verbatim, no extra prose. Omit any section that's empty.

```
SCOPE: <N> changed files

AGENTS_UPDATED:
- <path>, <what you added or corrected, one line>

AGENTS_CREATED:
- <area>/AGENTS.md, <conventions captured; root pointer added>

ORPHANS_CLEANED:
- <path>, <removed orphaned doc / fixed broken pointer after deletion>

ROADMAP_RECONCILED:
- <feature>, <sub-tasks ticked / status advanced to match the diff; or "unmapped: <area>">

ADR_STATUS_RECONCILED:
- <docs/adr/file>, <Status line: Proposed→In Progress→Accepted to match the feature's roadmap status>

STALE_ADRS:
- <docs/adr/file>, <why the change makes it stale, or a status mismatch you couldn't safely reconcile>

CONTEXT_GAPS:
- <area>, <pre-existing undocumented area only sliced by this change; suggest /audit>

CONFLICTS:
- <path>, <curated content that would need rewriting; left for a human>
```

If you made no edits and found nothing stale, output `SCOPE: <N> changed files` followed by `NOTHING_TO_SYNC: everything is already current`.
