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
- Bundled files: `agent-prompt.md`, the phase mode files (`modes/*.md`), and the pattern presets (`patterns/*.md`) live in this skill's folder. Resolve that folder to an absolute path (you already resolve these relative paths, so you know the folder) and pass absolute file paths in the spawn prompt: the `agent-prompt.md` path plus the paths of the SELECTED pattern preset files only. Do NOT read their contents into the main context. The spawn prompt tells the subagent: your first action is to Read those files by path. Pass every dynamic value the template needs (PHASE, AREA, ADDITIONAL_STANDARDS, MONOREPO_OR_NO, INSTALLED_SKILLS, DECLINED_TOOLS, and so on) as a labeled list in the spawn prompt: "Placeholder values: PHASE=..., ...". Small dynamic values stay inline; only the bundled static files move to path passing. Where a template slot wants the contents of a repo file the subagent can read itself (like root AGENTS.md), pass that repo file's path instead. Fallback: if the client's subagents cannot read files, read and inline the contents (the old behavior).
- No subagent or interactive-question support? Do the subagent's work inline yourself (use a cheaper model where the step calls for one), and ask any multiple-choice question as plain text with the same options.

## Execution

Every spawn below: set `model` explicitly to a strong model, do not inherit the session model (Claude Code: `sonnet`, reserving `opus` for the largest scans; spawn as the `writer` subagent type, which pins the model); `prompt` built per the Bundled files rule (the absolute `agent-prompt.md` path, the read-those-files-first instruction, the phase's Placeholder values; repo file paths in the values are for the subagent to read itself). Per-phase subagent instructions live in `agent-prompt.md`.

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

### Route to the selected phase

Phase 0 (ambiguous) is handled inline below. For Phases 1–4, read only the matching mode file, then follow it:

- Phase 1 (greenfield setup) → `modes/greenfield.md`
- Phase 2 (whole-repo scan) → `modes/whole-repo.md`
- Phase 3 (area scan) → `modes/area.md`
- Phase 4 (gap-fill) → `modes/gapfill.md`

Do not read the other mode files. The greenfield and whole-repo modes additionally read `modes/tool-skills.md` for the Agent Skills / MCP sweep (skip it for area and gap-fill runs).

### Phase 0 — Classify (only when pre-flight is ambiguous)

Don't guess. Ask once via your agent's interactive option picker (`AskUserQuestion` on Claude Code), or plain text with the same options:
- question: "I can't tell if this is a new project or an existing codebase (<state why: e.g. 'a manifest exists but I see no source in a language I recognise', or 'files look like untouched scaffolding'>). Which is it?"
- header: "Project state"
- options: 1. `New project`, "I'll ask for your coding standards and seed the context." → Phase 1 (read the manifest/scaffold for the stack; still ask standards). 2. `Existing codebase`, "I'll scan what's here and document it." → Phase 2.

### After all phases

If the subagent errored or wrote no `AGENTS.md` when it should have (the file is missing/empty), report the failure and offer to re-run; don't relay success it didn't produce. Otherwise relay the subagent's report: what was discovered (2–4 bullets), what was written (file paths), what was proposed or skipped (if existing files were found).

## Pattern presets

See `patterns/` for the four coding style presets used in Phase 1 (greenfield mode).

## Subagent prompt template

See `agent-prompt.md`.
