---
name: audit
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Bootstrap a project's AI context: the AGENTS.md files every later skill reads. Run /audit on a greenfield project, on an existing codebase with missing docs, or on one area (/audit src/auth). Writes tool agnostic AGENTS.md plus thin CLAUDE.md pointers, adding only what is missing; never overwrites curated content."
---

## Output style (plain words, no dashes)

Write everything this skill produces (files, reports, every message to the engineer) in plain simple language; keep technical terms that carry real meaning but explain each in plain words. Never use a dash as punctuation (no em dash, no en dash, no hyphen as punctuation); use short sentences, commas, or parentheses instead.

## What this skill does

The context bootstrapper: writes the `AGENTS.md` files every later skill and AI tool reads.

- Greenfield (no code yet): ask for coding standards, seed root `AGENTS.md` from the answers plus the build approach (name and one line principle) from the roadmap header if `/roadmap` set one. Runs after the project is scaffolded with its chosen stack (`/roadmap` → `/architect` decides the stack → scaffold → `/audit`); earlier is premature.
- Brownfield, undocumented (code, no `AGENTS.md`): scan the whole project, write root `AGENTS.md` and nested `<area>/AGENTS.md` files, judging what is global (root) vs area specific (nested).
- Brownfield, partially documented: check existing root and nested docs against the whole codebase; add only what is missing (new global facts, nested docs for undocumented areas); never clobber curated content.

Does not create ADRs (/architect owns those), maintain files after changes (/sync owns that), or write the feature roadmap (/roadmap owns `docs/roadmap/`).

## Context-file convention (AGENTS.md is canonical)

Durable context lives in the tool agnostic `AGENTS.md` (root and nested); every agent (Codex, Cursor, Claude Code, and others) reads it. `CLAUDE.md` is only a one line pointer whose entire body imports the sibling `AGENTS.md` via Claude Code's `@` import (exact pointer body in `agent-prompt.md`); content is never duplicated across the two.

- Write knowledge into `AGENTS.md`. Create it when missing. Never overwrite an existing `AGENTS.md` (it may be user or tool authored); gap fill conservatively, with permission.
- Migrate legacy content: a content-ful `CLAUDE.md` with no `AGENTS.md` → ask permission, move its content into a new `AGENTS.md`, replace `CLAUDE.md` with the pointer. Never silently discard curated content.
- Root stays short and global; nested `AGENTS.md` only for meaningful areas with real conventions (same root/nested rules as previously applied to `CLAUDE.md`).

## Scope

An area path argument (e.g. `auth`, `src/payments`) triggers Phase 3. With no argument, the Pre-flight signals below route to Phase 0 (ambiguous: ask new vs existing), Phase 1 (greenfield: ask standards, seed root), Phase 2 (established, no root AGENTS.md: whole-repo scan), or Phase 4 (root AGENTS.md exists: gap-fill). A content-ful legacy `CLAUDE.md` with no `AGENTS.md` is migrated, then treated as Phase 4.

## Acts vs asks

Phase 1 asks coding-standards questions via MCQ before creating root AGENTS.md. Phase 2 acts immediately, no questions; it writes root and the nested docs it judges warranted. Phases 3 and 4 act to explore but ask permission before modifying an existing root AGENTS.md or migrating a legacy CLAUDE.md; Phase 4 reports nested-doc creation for undocumented areas first, then applies on confirmation.

## Artifact ownership

The `AGENTS.md` files hold the content: create root if missing (Phase 1, 2) and `<area>/AGENTS.md` if missing and warranted, by judgment (Phase 2, 3, 4); when one exists, gap-fill or propose additions with permission; never overwrite. The `CLAUDE.md` files are pointers only (root and area), created if missing; a legacy content-ful one is migrated into `AGENTS.md` with permission. When creating a nested `AGENTS.md`, add exactly one pointer line to root `AGENTS.md` under `## Context files`: `- [<area>/AGENTS.md](<area>/AGENTS.md) (<one-line description>)`. Never one per subfolder, only where distinct conventions exist.

## Portability (any OS, any agent)

- Commands: `git` is the only required CLI, same on every OS. Other shell snippets (file counts, `find`, `[ -f ]`) are POSIX reference, not literal scripts; use your agent's cross-platform file tools (search/glob, read, write) to list, count, and check existence.
- Bundled files: `agent-prompt.md` and the pattern presets (`patterns/*.md`) live in this skill's folder. Resolve that folder to an absolute path (you already resolve these relative paths, so you know the folder) and pass absolute file paths in the spawn prompt: the `agent-prompt.md` path plus the paths of the SELECTED pattern preset files only. Do NOT read their contents into the main context. The spawn prompt tells the subagent: your first action is to Read those files by path. Pass every dynamic value the template needs (PHASE, AREA, ADDITIONAL_STANDARDS, MONOREPO_OR_NO, INSTALLED_SKILLS, DECLINED_TOOLS, and so on) as a labeled list in the spawn prompt: "Placeholder values: PHASE=..., ...". Small dynamic values stay inline; only the bundled static files move to path passing. Where a template slot wants the contents of a repo file the subagent can read itself (like root AGENTS.md), pass that repo file's path instead. Fallback: if the client's subagents cannot read files, read and inline the contents (the old behavior).
- No subagent or interactive-question support? Do the subagent's work inline yourself (use a cheaper model where the step calls for one), and ask any multiple-choice question as plain text with the same options.

## Execution

Every spawn below: `model` = a strong model (e.g. `sonnet`/`opus` on Claude Code); `prompt` built per the Bundled files rule (the absolute `agent-prompt.md` path, the read-those-files-first instruction, the phase's Placeholder values; repo file paths in the values are for the subagent to read itself). Per-phase subagent instructions live in `agent-prompt.md`.

### Pre-flight (main model does this before anything else)

Gather several signals (a file count alone misleads: a scaffold inflates it, an unfamiliar language zeroes it):

1. Context files: root AGENTS.md present → `ROOT_EXISTS`; content-ful CLAUDE.md only → `ROOT_LEGACY`; neither → `ROOT_MISSING`.
2. Source count across common ecosystems (extensions like `.ts/.tsx/.js/.jsx/.py/.go/.rs/.java/.rb/.swift/.kt/.php/.cs/.dart/.ex/.exs/.scala/.c/.cpp/.h/.lua/.clj`), excluding vendored/generated dirs (`node_modules`, `.git`, `dist`, `build`) and config files (`*.config.*`).
3. Established signals: `git log --oneline` for commit-history depth; a real manifest (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `composer.json`, `*.csproj`, `pubspec.yaml`, `mix.exs`, `Gemfile`).
4. Monorepo signal: workspace markers (`pnpm-workspace.yaml`, `turbo.json`, a `"workspaces"` field in `package.json`) or any `apps/*/package.json` / `packages/*/package.json` near the root.

Pick the phase. Two questions, in order: (1) is there real code to scan (source files OR a manifest)? (2) if yes, is it built (git history) or just scaffolded (no history)?

| Condition | Phase |
|---|---|
| Area path given as argument | Phase 3 |
| `ROOT_EXISTS` (or `ROOT_LEGACY` after migration) | Phase 4 |
| `ROOT_MISSING`, no source files AND no manifest | Phase 1, even if `docs/`/ADR/roadmap commits exist |
| `ROOT_MISSING`, has code (source ≥ 10 or a manifest), ≥ 2 commits | Phase 2, any language |
| `ROOT_MISSING`, has code (source ≥ 10 or a manifest), ≤ 1 commit | Phase 0, looks scaffolded |

Why this order: `/roadmap` and `/architect` commit docs before any code, so greenfield gates on no source AND no manifest (doc commits would misroute to Phase 2). A fresh scaffold has 10+ files but one commit; git history separates it from a built codebase and covers languages the source scan misses. A shallow clone or squash-merge repo at ≤1 commit falls safely to Phase 0.

Monorepo (`MONOREPO=yes`): root plus a light stub per workspace, deepen on demand. Each workspace (`apps/*`, `packages/*`) is a first-class area; its primary doc lives at the workspace root (`packages/api/AGENTS.md`), never buried deeper. A whole-repo run does not deep-scan every workspace (too expensive, premature); the subagent writes the repo-root `AGENTS.md` (monorepo-wide tooling, shared conventions) plus a light stub `AGENTS.md` per workspace from its manifest, no code scan, with root pointers. The full conventions/gotchas/key-files scan happens when the engineer runs `/audit packages/api` (Phase 3) or first builds there, never all upfront. A spot inside a workspace that warrants its own doc (`packages/ui/src/mdx/`) gets one in addition to the workspace-root doc, linked from it. A pre-existing doc buried in a workspace with no workspace-root doc: ask: "`packages/ui` has a context file at `src/mdx/` but none at its root. Move it up to `packages/ui/AGENTS.md`, or keep it as a nested doc under a new `packages/ui/AGENTS.md`?" On move: relocate it to the workspace root. On keep nested: create the workspace-root `AGENTS.md` AND keep the deep one, linking it from the root doc. Migrate legacy `CLAUDE.md` content per the convention above. Pass `MONOREPO=yes` plus the workspace list in the Placeholder values.

Legacy migration (any phase): on `ROOT_LEGACY`, before proceeding ask permission: "I found a `CLAUDE.md` with project context but no `AGENTS.md`. I'll move its content into a new `AGENTS.md` (so all tools read it) and replace `CLAUDE.md` with a pointer. Proceed?" On yes: the subagent copies the content verbatim into `AGENTS.md`, then replaces `CLAUDE.md` with the pointer; `AGENTS.md` now exists, so continue as Phase 4 (gap-fill). On no: leave both untouched and continue without migrating. Same for any nested `<area>/CLAUDE.md`.

### Phase 0 — Classify (only when pre-flight is ambiguous)

Don't guess. Ask once via your agent's interactive option picker (`AskUserQuestion` on Claude Code), or plain text with the same options:
- question: "I can't tell if this is a new project or an existing codebase (<state why: e.g. 'a manifest exists but I see no source in a language I recognise', or 'files look like untouched scaffolding'>). Which is it?"
- header: "Project state"
- options: 1. `New project`, "I'll ask for your coding standards and seed the context." → Phase 1 (read the manifest/scaffold for the stack; still ask standards). 2. `Existing codebase`, "I'll scan what's here and document it." → Phase 2.

### Phase 1 — Greenfield setup

Trigger: pre-flight classified clearly greenfield, or Phase 0 → `New project`.

Step 1, ask coding patterns AND tooling. Main model asks, as decision panels (single-select unless marked; one suggested pick each; the picker adds Other automatically), up to 4 per round, as many rounds as it takes. Be thorough, not minimal; this is the one place conventions and tooling get set. First read the real scaffolded project (manifest, existing config, tools the scaffold installed), then tailor every question: skip one the stack already settles, list an already installed tool first as the suggested pick, phrase options for the actual language and framework. Answers are captured into `AGENTS.md`. `/audit` records the choices, installs nothing; installing (packages, config files, pre-commit hooks, CI) is the `/develop tooling` sub-task that follows, but ask the tooling questions here where the choice is made and recorded.

Architecture & code conventions:
- Architecture style: present all four preset options without reading their files into main context: Clean Architecture (`patterns/clean-architecture.md`), Functional (`patterns/functional.md`), Domain Driven Design (`patterns/domain-driven.md`), and SOLID OOP (`patterns/solid-oop.md`). The chosen preset is passed as a path in Step 2, and the subagent reads only that file.
- Type strictness (typed languages only; skip if untyped): `strict` (no `any`, exhaustive types) · `gradual` (strict for new code) · `loose`.
- Module & folder structure: `folder-by-feature` (colocate by feature) · `by-layer` (controllers/services/repos) · match what the scaffold already set.
- Additional code standards (multi-select): documented public APIs · a consistent error-handling pattern · validate env vars at startup · named exports only (no default exports) · consistent naming conventions · accessibility baseline on UI (WCAG AA) · conventional commit messages.

Tooling (asked here, installed by `/develop tooling`):
- Linting & formatting (adaptive): the standard linter + formatter for this stack (suggested; list an already-installed one first) · a specific alternative · minimal for now.
- Pre-commit enforcement: lint + format + typecheck on every commit (suggested) · format only · none.
- Testing gate (captured as the convention, the runner is set up by `/test`): unit + integration with a framework (suggested) · typecheck + manual `/verify` only · tests-first (TDD).
- Continuous integration: a basic CI check on push (lint, typecheck, test) (suggested) · not yet · already configured.

Adapt the list: drop what doesn't apply (no CI question for a throwaway prototype, no type-strictness for an untyped language); add any stack-specific convention worth pinning.

Step 2, resolve SELECTED_PATTERNS: a named pattern → the absolute path of the matching `patterns/*.md` file (path only, do not inline its contents). "Other" (free text) → the engineer's exact typed text, passed inline (no file).

Step 3, run the Tool-skills sweep (below), then spawn a subagent. description: "Audit: greenfield setup — create root AGENTS.md + CLAUDE.md pointer"; tools: `Read`, `Bash`, `Write`. Placeholder values: `PHASE=greenfield`, `SELECTED_PATTERNS=<pattern file path, or the Other free text>`, `ADDITIONAL_STANDARDS=<all the other Step 1 selections: code standards, type strictness, folder structure, AND the tooling choices (lint/format, pre-commit, testing gate, CI)>`, `MONOREPO_OR_NO` (`yes — apps: web, api, …` if detected), plus the sweep's `INSTALLED_SKILLS` / `DECLINED_TOOLS` so the subagent writes the `Agent skills:` line. Tell it to capture the tooling choices clearly (a short `## Tooling` note or explicit Rules lines) so `/develop tooling` installs exactly what was chosen. Per `agent-prompt.md` it writes root `AGENTS.md` + `CLAUDE.md` pointer, seeds `## Build approach` from the roadmap header (else `<TBD — set by /roadmap>`), and adds per-workspace nested docs if `MONOREPO=yes`.

### Tool-skills & MCP sweep (offer matching Agent Skills and MCP servers — greenfield after scaffold, and whole-repo)

Run on the main thread once the real stack is known (greenfield: from the scaffolded manifests read in Step 1; brownfield: from the repo scan). `/architect` offers when a tool is chosen; this covers whatever is already installed.
- For each significant tool in the real stack (framework, database, ORM, auth, payments, email, and so on) not already covered by an installed skill / connected MCP (`npx skills list`, your connector list) or recorded as declined in `AGENTS.md`: detect a matching Agent Skill (`npx skills find <tool>`, the `skills` CLI's registry search, `--owner <org>` if known, else a web search for "<tool> agent skill") AND a matching MCP server (a web search for "<tool> MCP server", or your agent's connector list). Never hardcode a list of which tools have skills or servers.
- Batch-offer the ones found as one multi-select panel, skills and MCP servers together: "Set up the tools that have one? · Skill: `<tool A>` (`<owner/repo>`) · MCP: `<tool B>` server · … · none of these". Capability-first picker; plain text where there is none. Never auto-install or auto-connect.
- Install each selected skill: `npx skills add <owner>/<repo> -y`. Connecting an MCP is a user config step (their MCP/connector settings, e.g. `claude mcp add …`); you can't do it for them, so point them there. Once connected the tools are used automatically.
- Pass `INSTALLED_SKILLS` / `MCP_SERVERS` / `DECLINED_TOOLS`; the subagent records in `AGENTS.md` an `Agent skills:` line (`installed: …`, `declined: …`) and an `MCP servers:` line (`connected: …`, `declined: …`); the declines stop a later run from re-offering. Project-wide tech at root; area-specific ones in the nested area doc.
- No search/install/connect capability? Skip the offer; note in the report which tools might have a skill or MCP worth a manual look.

### Phase 2 — Whole-repo scan (root + judged nested)

Trigger: pre-flight classified clearly established, or Phase 0 → `Existing codebase`. Run the Tool-skills sweep above once the scan has identified the stack, before/with writing `AGENTS.md`.

Spawn a subagent. description: "Audit: whole-repo scan — root + nested AGENTS.md"; tools: `Read`, `Bash`, `Write`, `Edit` (`Edit` to add nested pointers into the root it just wrote). Placeholder values: `PHASE=whole-repo`, root AGENTS.md noted as MISSING, `MONOREPO_OR_NO`.

### Phase 3 — Area scan

Trigger: a path or area name was given (e.g. `/audit src/auth`).

Pre-flight additionally:
1. Check the area path exists. If not: stop immediately, tell the engineer "Path `<area>` not found. Check the path and try again.", and do not spawn a subagent.
2. Root `AGENTS.md` (the canonical file): missing, with no legacy CLAUDE.md to migrate → run Phase 2 fully first (spawn the whole-repo subagent, wait for root AGENTS.md + CLAUDE.md pointer), then continue with Phase 3. Only a legacy root `CLAUDE.md` → run the legacy migration first. Exists → proceed directly.
3. Check if `<area>/AGENTS.md` exists; note present or missing.

Spawn a subagent. description: "Audit: area scan — <area>"; tools: `Read`, `Bash`, `Write`, `Edit`. Placeholder values: `PHASE=area`, `AREA=<path>`, root AGENTS.md path, area AGENTS.md path or MISSING. The subagent adds the nested pointer line to root `AGENTS.md` via the Edit tool; it does not re-create root.

After the run, parse the report's `Root gaps flagged` section:
- `ROOT_GAPS: none` → relay the full report, done.
- Gaps exist → ask (picker as above): Question: "I found things in `<area>` not reflected in root AGENTS.md. What should I do?" Option 1: `Add them now`, description: "I'll apply the additions immediately". Option 2: `Show me the diff`, description: "Print exactly what would change; I'll apply it manually". Option 3: `Skip for now`, description: "Leave root AGENTS.md as-is".
- On `Add them now`: locate the `ROOT_GAPS:` block and extract each line starting with `- ` (each holds the exact markdown to insert and the target section, `— target section: ## <section>`). Apply one Edit call per gap into root `AGENTS.md`. Do not paraphrase.
- On `Show me the diff`: print each addition as a fenced markdown block with the target section labelled. Do not write.
- On `Skip for now`: do nothing.

Relay the full report after the choice is applied.

### Phase 4 — Gap-fill (root AGENTS.md already exists)

Trigger: no area argument, codebase exists, AND root AGENTS.md already exists (including right after a legacy `CLAUDE.md` migration). Audit the whole codebase against what's written and fill the holes, conservatively.

Pre-flight additionally: note root `AGENTS.md`'s path, and list all nested `AGENTS.md` paths (excluding `node_modules` and `.git`) to pass inline.

Spawn a subagent. description: "Audit: gap-fill — codebase vs existing docs"; tools: `Read`, `Bash`, `Write`, `Edit`. Placeholder values: `PHASE=gap-fill`, root AGENTS.md path, nested AGENTS.md paths list.

After the run, handle proposals before applying:
- Nested docs the subagent created for clearly undocumented areas → already written; list them in the relay.
- `ROOT_GAPS` and `PROPOSED_ADDITIONS` to existing files → ask (`Add them now` / `Show me the diff` / `Skip for now`) exactly as in Phase 3; apply with `Edit` (verbatim, no paraphrase) on `Add them now`.
- `CONTRADICTIONS` (docs the code disproves) → surface to the engineer, do not auto-fix (these touch possibly curated lines). Relay each as "`<doc>` says *X*, but the code/ADR shows *Y*" and let them decide (correct it, or update the code). Never silently overwrite.

### After all phases

If the subagent errored or wrote no `AGENTS.md` when it should have (the file is missing/empty), report the failure and offer to re-run; don't relay success it didn't produce. Otherwise relay the subagent's report: what was discovered (2–4 bullets), what was written (file paths), what was proposed or skipped (if existing files were found).

## Pattern presets

See `patterns/` for the four coding style presets used in Phase 1.

## Subagent prompt template

See `agent-prompt.md`.
