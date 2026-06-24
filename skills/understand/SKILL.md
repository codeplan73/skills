---
name: understand
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: "Use this skill to comprehend a repository or a specific area of the codebase before designing or planning a change. Run /understand when starting a medium or full task (per the triage playbook), when no AGENTS.md context files exist yet, or when you need a reliable map of an area before making changes. This skill creates context files the first time — a tool-agnostic AGENTS.md (root for the repo, or nested for a focused area) holding the content, plus a thin CLAUDE.md pointer beside it so Claude Code picks it up. It never overwrites an existing AGENTS.md. It does not maintain files after changes; that is /sync's job. Do not run /understand after /design has already written an ADR for the same scope."
---

## What this skill does

Explores the repo or a named area, extracts durable knowledge, and writes context files where they are missing. Asks for coding standards when starting a greenfield project.

Does not create ADRs (/design owns those). Does not maintain files after changes (/sync owns that).

## Context-file convention (AGENTS.md is canonical)

These skills work across all AI tools, so the durable context lives in the **tool-agnostic `AGENTS.md`** (root and nested) — every agent (Codex, Cursor, Claude Code, …) reads it. `CLAUDE.md` is **only a one-line pointer** to its sibling `AGENTS.md`, so Claude Code (which reads `CLAUDE.md`) is forwarded to the shared content. Content is never duplicated across the two.

Rules this skill obeys:
- **Write knowledge into `AGENTS.md`.** Create it when missing. **Never overwrite or clobber an existing `AGENTS.md`** — it may be authored by the user or another tool; gap-fill conservatively (with permission) instead.
- **Maintain `CLAUDE.md` as a pointer only.** Its entire body imports the sibling AGENTS.md via Claude Code's `@` import, so Claude auto-loads the canonical content (other tools read AGENTS.md directly):
  ```
  # CLAUDE.md

  This project's context for all AI tools lives in [AGENTS.md](./AGENTS.md).
  Claude Code loads it via the import below:

  @AGENTS.md
  ```
- **Migrate legacy content.** If a content-ful `CLAUDE.md` exists but no `AGENTS.md`, ask permission, then move its content into a new `AGENTS.md` and replace `CLAUDE.md` with the pointer. Never silently discard curated content.
- The same root/nested rules apply to `AGENTS.md` as previously applied to `CLAUDE.md` (root is short and global; nested only for meaningful areas with real conventions).

## Scope

From the argument or task description:

| Input | Phase triggered |
|---|---|
| No argument, codebase is empty, no AGENTS.md | Phase 1 — greenfield setup |
| No argument, codebase exists, no AGENTS.md | Phase 2 — whole-repo scan |
| Path or area name (e.g. `auth`, `src/payments`) | Phase 3 — area scan |

(Detection treats a content-ful legacy `CLAUDE.md` with no `AGENTS.md` as "present but needs migration" — see the convention above.)

## Acts vs asks

- Phase 1: asks coding pattern questions via MCQ before creating root AGENTS.md.
- Phase 2: acts immediately, no questions.
- Phase 3: acts to explore; asks permission before modifying an existing root AGENTS.md, and before migrating a legacy CLAUDE.md.

## Artifact ownership

| File | Rule |
|---|---|
| Root `AGENTS.md` | The content. Create if missing (Phase 1, 2). Gap-fill with permission if it exists (Phase 3). **Never overwrite.** |
| Root `CLAUDE.md` | Pointer only. Create the forward-to-`AGENTS.md` pointer if missing; migrate its content into `AGENTS.md` (with permission) if it's a legacy content-ful file. |
| `<area>/AGENTS.md` | The content for that area. Create if missing and the area warrants it (Phase 3). Propose additions if it exists; never overwrite. |
| `<area>/CLAUDE.md` | Pointer only, forwarding to `<area>/AGENTS.md`. |

When creating a nested `AGENTS.md`, add exactly one pointer line to root `AGENTS.md` under `## Context files`:
```
- [<area>/AGENTS.md](<area>/AGENTS.md) — <one-line description>
```

Never create a nested AGENTS.md for every subfolder — only where distinct conventions exist.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS. Other shell snippets (file counts, `find`, `[ -f ]`) are POSIX **reference**, not literal scripts — use your agent's own cross-platform file tools (search/glob, read, write) to list and count source files and check existence instead.
- **Bundled files**: the pattern presets (`patterns/*.md`) and `agent-prompt.md` are referenced by paths relative to this skill's folder; the main agent reads them and injects the needed text **into the subagent prompt** — subagents can't resolve skill-relative paths.
- **No subagent / interactive-question support?** The spawn-a-subagent steps assume a Task/subagent tool, and the multiple-choice steps assume an interactive picker — both Claude Code features. On a tool without them: do the subagent's work inline yourself (use a cheaper model where the step calls for one), and ask any multiple-choice question as plain text with the same options.

## Execution

### Pre-flight (main model does this before anything else)

```bash
# Detect the canonical context file and any legacy pointer-candidate
#   AGENTS.md present  → ROOT_EXISTS (canonical)
#   only CLAUDE.md present (content-ful, no AGENTS.md) → ROOT_LEGACY (migrate)
#   neither → ROOT_MISSING
# Use your file tools to check existence of AGENTS.md and CLAUDE.md at the repo root.

# Count meaningful source files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
  -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" \
  -o -name "*.swift" -o -name "*.kt" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' \
  -not -name "next.config.*" -not -name "tailwind.config.*" -not -name "postcss.config.*" \
  -not -name "vite.config.*" -not -name "vitest.config.*" -not -name "jest.config.*" \
  -not -name "eslint.config.*" -not -name "prettier.config.*" | wc -l
```

Use the results to pick the phase below.

---

**Legacy migration (any phase):** if detection returned `ROOT_LEGACY` (content-ful root `CLAUDE.md`, no `AGENTS.md`), before proceeding ask permission to migrate: "I found a `CLAUDE.md` with project context but no `AGENTS.md`. I'll move its content into a new `AGENTS.md` (so all tools read it) and replace `CLAUDE.md` with a pointer. Proceed?" On yes: the subagent copies the content verbatim into `AGENTS.md`, then replaces `CLAUDE.md` with the pointer. On no: leave both untouched and continue without migrating. The same applies to any nested `<area>/CLAUDE.md`.

### Phase 1 — Greenfield setup

**Trigger**: root AGENTS.md is missing (`ROOT_MISSING`) AND source file count < 10.

**Step 1 — Ask coding patterns** (main model calls `AskUserQuestion`):

Question 1 — Architecture style (single-select):
- Read `patterns/clean-architecture.md` for label/description
- Read `patterns/functional.md`
- Read `patterns/domain-driven.md`
- Read `patterns/solid-oop.md`
- Present all four as options

Question 2 — Additional standards (multi-select):
- `Strict types` — No `any`/untyped code; exhaustive type coverage
- `Test-driven` — Tests written before or alongside implementation
- `Conventional commits` — `feat:`, `fix:`, `chore:` prefix on all commits
- `Documented APIs` — JSDoc/docstrings required on all public interfaces

**Step 2 — Inject selected pattern content**:
- If a named pattern was selected: the main model already read all four files in Step 1 — do not re-read. Use the full content of the matching file as `SELECTED_PATTERNS`.
- If "Other" was selected (free-text input): no pattern files were read in Step 1. Use the engineer's exact typed text as `SELECTED_PATTERNS` — pass it directly, no file to read.

**Step 3 — Spawn subagent** with:
- `model: "sonnet"`
- `description: "Understand: greenfield setup — create root AGENTS.md + CLAUDE.md pointer"`
- Tools: `Read`, `Bash`, `Write`
- `prompt`: filled `agent-prompt.md` template with `PHASE=greenfield`, `SELECTED_PATTERNS=<file contents>`, `ADDITIONAL_STANDARDS=<selections>`. The subagent writes the content to `AGENTS.md` and creates the `CLAUDE.md` pointer beside it.

---

### Phase 2 — Whole-repo scan

**Trigger**: root AGENTS.md is missing AND source file count ≥ 5.

**Spawn subagent** with:
- `model: "sonnet"`
- `description: "Understand: whole-repo scan — create root AGENTS.md + CLAUDE.md pointer"`
- Tools: `Read`, `Bash`, `Write`
- `prompt`: filled `agent-prompt.md` with `PHASE=whole-repo`, AGENTS.md noted as MISSING. The subagent writes content to `AGENTS.md` and creates the `CLAUDE.md` pointer.

---

### Phase 3 — Area scan

**Trigger**: a path or area name was given (e.g. `/understand src/auth`).

**Pre-flight additionally**:
1. Check the area path exists:
   ```bash
   [ -e <area-path> ] && echo "EXISTS" || echo "NOT_FOUND"
   ```
   If `NOT_FOUND`: stop immediately. Tell the engineer: "Path `<area>` not found. Check the path and try again." Do not spawn a subagent.
2. Read root `AGENTS.md` (the canonical file).
   - If root AGENTS.md is **missing** (and no legacy CLAUDE.md to migrate): run Phase 2 fully first (spawn whole-repo subagent, wait for it to write root AGENTS.md + CLAUDE.md pointer), then continue with Phase 3.
   - If only a legacy root `CLAUDE.md` exists: run the legacy migration above first.
   - If root AGENTS.md **exists**: proceed directly.
3. Check if `<area>/AGENTS.md` exists — note present or missing.

**Spawn subagent** with:
- `model: "sonnet"`
- `description: "Understand: area scan — <area>"`
- Tools: `Read`, `Bash`, `Write`, `Edit`
- `prompt`: filled `agent-prompt.md` with `PHASE=area`, `AREA=<path>`, root and nested `AGENTS.md` contents injected. The subagent writes the area's content to `<area>/AGENTS.md` and creates `<area>/CLAUDE.md` as a pointer.

Note: the subagent adds the nested `AGENTS.md` pointer line to root `AGENTS.md` using the **Edit** tool — it does not re-create root AGENTS.md.

**After subagent runs**, parse the report for the `Root gaps flagged` section:
- If `ROOT_GAPS: none` → relay the full report, done.
- If gaps exist → call `AskUserQuestion`:
  - Question: "I found things in `<area>` not reflected in root AGENTS.md. What should I do?"
  - Option 1: `Add them now` — description: "I'll apply the additions immediately"
  - Option 2: `Show me the diff` — description: "Print exactly what would change; I'll apply it manually"
  - Option 3: `Skip for now` — description: "Leave root AGENTS.md as-is"

  - If `Add them now`: parse the subagent report — locate the `ROOT_GAPS:` block and extract each line starting with `- `. Each line contains the exact markdown to insert and the target section (`— target section: ## <section>`). Apply one **Edit** tool call per gap into root `AGENTS.md`. Do not paraphrase.
  - If `Show me the diff`: print each addition as a fenced markdown block with the target section labelled. Do not write.
  - If `Skip for now`: do nothing.

Relay the full report after the choice is applied.

---

### After all phases

Relay the subagent's report:
- What was discovered (2–4 bullets)
- What was written (file paths)
- What was proposed or skipped (if existing files were found)

## Pattern presets

See `patterns/` for the four coding style presets used in Phase 1.

## Subagent prompt template

See `agent-prompt.md`.
