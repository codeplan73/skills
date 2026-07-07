---
name: sync
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task
description: "Keep durable knowledge current after a change is complete. Run /sync as the last step on medium or full tier work, around merge. It updates root and nested AGENTS.md, reconciles the roadmap from repo evidence, and flags ADRs the change made stale. Surgical, additive edits only."
---

## Output style (plain words, no dashes)

Write everything this skill produces (files, reports, messages to the engineer) in plain simple language; keep technical terms that carry real meaning but explain each in plain words. Never use dashes as punctuation (no em dash, en dash, or punctuation hyphen); use short sentences, commas, or parentheses instead.

## What this skill does

Closes the loop on a completed change: syncs AGENTS.md files, the roadmap, and linked ADR `**Status**:` lines to what the repo now shows, and flags what it must not edit (stale ADRs, curated prose). The Boundaries table below is the exact contract.

**`agent-prompt.md`** is the single source of truth for the maintenance rules; SKILL.md covers only orchestration. Runs in a subagent (see Step 3).

**Canonical file:** durable context lives in the tool-agnostic **`AGENTS.md`**; **`CLAUDE.md` is only a pointer** to it. /sync edits/creates both, treating them only as targets, never as a change source.

## Boundaries (these keep the skill from sprawling)

| Action | /sync | Owner |
|---|---|---|
| Edit existing root/nested AGENTS.md | ✅ maintains | /sync |
| Reconcile root AGENTS.md's `## Build approach` line to the roadmap header's approach (surgical single-line edit, like the stack) | ✅ maintains; flags a curated divergence | /sync |
| Create nested `<area>/AGENTS.md` for an area **net-new in this change** | ✅ creates (diff = full area context) + adds root pointer | /sync |
| Create nested doc for a **pre-existing** undocumented area (only sliced by the diff) | ❌ flags "run /audit" | /audit |
| Create or restructure the **root** AGENTS.md | ❌ flags "run /audit" | /audit |
| Reconcile an ADR's `**Status**:` line to its feature's roadmap status (`planned`→`Proposed`, `in-progress`→`In Progress`, `done`→`Accepted`) | ✅ Status line only | /sync |
| Edit an ADR's **content** / supersede it | ❌ flags as stale | /architect |
| Reconcile the roadmap — for the **relevant workspace's** roadmap file only (not all of `docs/roadmap/`) — tick **any** completed sub-task from repo **evidence** (code, tests, hardening entry, AGENTS.md), advance status | ✅ corrects | /sync |
| Add / reorder features or sub-tasks in the roadmap | ❌ leaves alone | /roadmap |
| Overwrite or rewrite curated AGENTS.md prose | ❌ flags conflict instead | human |

The dividing line on creation is **context, not policy**: create only when this change shows you the whole area; defer to /audit when the area predates the change and you've seen only a slice. When unsure, **flag instead of creating**.

## Asks vs acts

**Acts.** Pauses only when there is **nothing to sync** (empty change set). Every edit to curated files is listed in the report so you can review or revert.

## Artifact ownership

Owns exactly what the Boundaries table grants and writes nothing else. As the **universal sub-task reconciler** it ticks any roadmap sub-task it can verify from repo evidence (sweeping the `/test`/`/harden`/`/audit`/`/sync` sub-tasks other skills don't tick) and advances feature status; exact rules in `agent-prompt.md`.

**Artifact base.** ADRs and the roadmap live under `docs/` by default, or `.workflow/` if `docs/` is a published docs site; use whichever base exists in the repo (paths here assume `docs/`).

---

## Portability (any OS, any agent)

- **Commands**: `git` is the only required CLI and behaves the same on every OS, run the `git` lines as shown. Other shell snippets are POSIX **reference**, not literal scripts: don't assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `ls`, or `xargs` exist; use your agent's cross-platform file tools and apply branching logic yourself rather than shell `if`/variables/redirects.
- **Bundled files**: referenced by paths relative to this skill's folder. Resolve the folder to an absolute path (you already resolve these relative paths) and pass absolute file paths in the subagent's prompt; do NOT read bundled file contents into the main context (fallback in Step 3).
- **No subagent support?** Do the whole maintenance inline yourself, following the exact rules in **`agent-prompt.md`** (authoritative for both the subagent and this inline path).

## Execution

### 1. Scope the change set (cheap — with per-file status)

**Freshness first (teams):** `git fetch --quiet`; if `git rev-list --count HEAD..origin/$BASE` > 0 you are behind `origin/$BASE`, warn the engineer to pull first, a teammate may have already synced these docs.

Base: `main` if `git rev-parse --verify main` succeeds, else `master`. Current branch: `git rev-parse --abbrev-ref HEAD`. Use `--name-status` (not `--name-only`); the net-new-area and orphan-cleanup logic need **A**dded vs **M**odified vs **D**eleted per file.

- Current branch **is** the base, mode `uncommitted`: `git diff --name-status HEAD`.
- Otherwise, mode `branch`: `git merge-base "$BASE" HEAD`, then `git diff --name-status <merge-base>`.

Either way, add untracked files from `git ls-files --others --exclude-standard`, each prefixed with an `A` status (matching the `--name-status` format). Note the mode, base, and merge base for the subagent.

De-duplicate, then **filter to source files** to sync *from*:
- **Drop documentation and config** (`AGENTS.md` at any level, `docs/**`, `*.md`, `test-preferences.json`, lock files, generated output); /sync reads these as targets/context, never as a change source.
- **Drop test files** (`*.test.*`, `*.spec.*`, `__tests__/`, etc.); tests aren't durable area conventions.
- **Keep the `D` (deleted) entries** in a separate list; they drive orphan cleanup (Step 3) though they aren't synced *from*.
- **Keep dependency manifest changes in a separate list** for tool discovery, even if they are config rather than source: `package.json`, `pyproject.toml`, `requirements*.txt`, `go.mod`, `Cargo.toml`, `composer.json`, `Gemfile`, `pubspec.yaml`, `mix.exs`, `*.csproj`, and equivalent package manifests. Lock files are signals only; do not pass lockfile contents.

**If no source files and no dependency manifest changes remain** (only docs/tests/lock/generated files changed), stop, nothing to sync. Do not spawn.

### 2. Locate the context files and ADRs (paths only — do NOT read them here)

Using your agent's file-search/glob tools:
- Note whether a root `AGENTS.md` exists.
- Find every `AGENTS.md` (root + nested), excluding `node_modules/` and `.git/`.
- Find all ADRs under `docs/adr/` whose names start with a digit, sorted.
- Find the roadmap file(s) whose workspace/features the diff actually touches (in a monorepo, a changed file's workspace `apps/<x>/…` selects `docs/roadmap/<x>/`); never read or pass all of `docs/roadmap/`.

The subagent reads these itself; the main model passes **paths** plus the changed-file list and diff command. One inline exception: root AGENTS.md contents, short and useful to anchor on. For each changed file, note its nearest enclosing directory with a `AGENTS.md` (root or nested); that's the context file most likely to need an update.

### 2.5 Discover Agent Skills and optional MCPs for newly added tools

Run only when dependency manifests changed or the diff clearly adds a significant external tool. Skip ordinary utility libraries unless they define a durable workflow or integration.

- Identify newly added significant packages/tools from the manifest diff, not the full lockfile: framework, router, styling/UI kit, database, ORM/query layer, auth/session, payments, email/notifications, storage/uploads, search, queue/background jobs, AI provider/vector DB, browser/runtime testing, observability, hosting/deploy. Include package names and common aliases from manifests. Do not stop after the first technology.
- Filter out anything already covered by installed skills, connected MCPs, or `AGENTS.md` declined entries.
- **Isolate the searches in a read-only subagent (capability-first).** Hand the remaining set to a discovery subagent rather than searching on the main thread: spawn it in the background (non-blocking) if your agent supports that, else blocking; set its model explicitly to a fast, low-cost tier (do not inherit the session model; on Claude Code spawn it as the `researcher` subagent type, which pins the model); it returns only the compact candidate list. This keeps the search output out of `/sync`'s bounded context. No subagent → search inline; no search capability → skip and note it. The offer panel stays on the main thread.
- For each remaining item, run `npx skills find <tool-or-package>`; if weak, retry aliases from package/org names. Collect every credible Agent Skill candidate and confirm with `npx skills add <owner>/<repo> --list` when practical. If the CLI is interactive/unavailable, search `"<tool>" "agent skill"` and confirm before offering.
- MCP search is optional: connector list first, else `"<tool>" "MCP server"` per item. MCP is recommended upside, not required.
- Keep discovery capped and cacheable: max 5 web searches and 8 fetched pages total, official registry/docs first. Reuse `docs/.agent-cache/tool-discovery/<slug>.md` when under 30 days old, after filtering installed/declined items.
- Offer all Agent Skill matches in one multi-select panel, grouped by technology: "Install relevant Agent Skills for newly added tools?" plus skip/decline. Then offer MCPs separately: "Optional MCP servers that could help these tools" plus skip/decline. Never auto-install or auto-connect.
- Install selected skills with `npx skills add <owner>/<repo> -y`. For MCPs, point to the user's connector/MCP settings; once connected the tools are used automatically.
- Pass the result to the subagent as `INSTALLED_SKILLS_OR_NONE`, `MCP_SERVERS_OR_NONE`, and `DECLINED_TOOLS_OR_NONE` so it records durable lines in the right `AGENTS.md` file. If nothing was found or no capability exists, pass `none`.

### 3. Spawn the subagent

Do NOT read `agent-prompt.md` here. Resolve this skill's folder to an absolute path and spawn a subagent with:

- Model: set explicitly to a fast, low-cost tier; do not inherit the session model on Claude Code (use `haiku`; a light model / `inherit` only on agents where a separate cheap tier isn't selectable); bounded maintenance, not open-ended reasoning
- Description: "Sync: update AGENTS.md + flag stale ADRs"
- Tools: `Read`, `Bash`, `Grep`, `Glob`, `Edit`, `Write` (`Edit` for existing docs, roadmap, and ADR `**Status**:` lines; `Write` strictly for a **net-new-area** nested AGENTS.md). Boundaries the tool grant can't express (no root creation, no ADR *content* edits (Status line only), no shallow nested docs for established areas) are rules in the agent prompt.
- Prompt: the subagent's **first action** is to Read `<absolute skill folder>/agent-prompt.md` by path and follow it; then give the dynamic values as a labeled list ("Placeholder values: ..."):
  1. `MODE`, `BASE`, `MERGE_BASE`, `CHANGED_FILES` (name-status changed-source list), `DIFF_COMMAND` (exact `git diff` command)
  2. `DELETED_PATHS` (deleted paths, for orphan cleanup)
  3. `ROOT_AGENTS_MD` (root AGENTS.md contents, inline), `NESTED_PATHS` (nested AGENTS.md paths)
  4. `ADR_PATHS` (all ADR paths, for Status-line reconciliation and staleness flagging)
  5. `FILE_TO_CONTEXT_MAP` (changed file → nearest context file)
  6. `ROADMAP_PATH_OR_NONE` (relevant workspace roadmap path(s), not all of `docs/roadmap/`; also the source of each linked feature's status for ADR Status-line reconciliation)
  7. `INSTALLED_SKILLS_OR_NONE`, `MCP_SERVERS_OR_NONE`, `DECLINED_TOOLS_OR_NONE` from Step 2.5

Fallback: if the client's subagents cannot read files, read `agent-prompt.md`, fill it, and pass the filled template as the prompt instead.

### 4. Relay the result

**If the subagent errored or returned no parseable summary**, report that and offer to re-run, don't fabricate a result (a genuine `NOTHING_TO_SYNC` is a valid success; a crash or empty output is not). Otherwise relay the compact summary:

```
## /sync complete

**Scope**: <N> changed files

**AGENTS.md updated**:
- `<path>`, <what was added/corrected, one line>   (or "no updates needed")

**AGENTS.md created** (new area):
- `<area>/AGENTS.md`, <what conventions it captures> (+ root pointer added)

**Orphans cleaned** (after deletions):
- `<path>`, <removed orphaned nested doc / fixed broken pointer>

**Roadmap reconciled** (relevant workspace):
- `<feature>`, <ticked sub-tasks / status planned→in-progress→done to match the diff>   (or "no roadmap, or already accurate")

**ADR statuses reconciled** (Status line only):
- `docs/adr/<file>`, <Status Proposed→In Progress→Accepted to match the feature's roadmap status>

**ADRs flagged stale** (run /architect to update or supersede):
- `docs/adr/<file>`, <why the change makes it stale, or status mismatch sync couldn't safely resolve>

**Context gaps** (run /audit, area too established for /sync to document from the diff alone):
- `<area>`, <pre-existing undocumented area only sliced by this change>

**Conflicts left for you** (not auto-edited):
- `<path>`, <curated content that would need rewriting; decide manually>
```

Omit any section with no items. If everything was already current and nothing is stale, say so in one line. /sync does not run /architect or /audit for you; it points, you decide.

---

## Subagent prompt template

See `agent-prompt.md`.
