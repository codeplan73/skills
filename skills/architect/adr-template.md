# ADR Template

File path: `docs/adr/NNNN-kebab-case-title.md`

---

=== ADR TEMPLATE START ===
# NNNN. Title (concise, noun-phrase form — e.g. "Use PostgreSQL for primary storage")

**Date**: YYYY-MM-DD
**Status**: Proposed

## Context

<What is the problem or decision to be made? What forces are at play — technical constraints,
team capabilities, cost, performance requirements, compliance? What is the consequence of not
deciding? 2–4 paragraphs. Do not mention options here — only the problem space.>

## Options considered

### Option 1: <Name>

<One paragraph describing this option.>

**Pros**:
- <benefit>

**Cons**:
- <drawback or tradeoff>

### Option 2: <Name>

<One paragraph describing this option.>

**Pros**:
- <benefit>

**Cons**:
- <drawback or tradeoff>

<!-- Add Option 3 / Option 4 if relevant. Maximum 4 options. Omit section entirely only
     when documenting a decision already made with no alternatives considered. -->

## Decision

**Chosen option**: Option N — <Name>

<One sentence stating the decision clearly.>

**Implementation skills**: `<skill-name>` (`.claude/skills/<skill-name>/`) · `<skill-name>` (`.claude/skills/<skill-name>/`)
<!-- List every installed community skill that informed this design. The engineer reads this field during implementation to know which skill conventions to apply. Omit line entirely if no community skills were used. -->

## Rationale

<Why this option over the others? Reference the specific constraints and forces from Context.
Do not repeat the pros/cons list — explain the reasoning. 1–3 paragraphs.>

<!-- Feature design mode only. Include immediately after Rationale. -->
## Feature design

**Data model sketch**:
<Entities, key fields, nullable/required, FK relationships, unique constraints>

**State transitions** (if applicable):
<e.g. order: draft → submitted → paid → fulfilled — omit if no state machine>

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /resource | POST | field:type (req) | id, status | bearer | 409, 422 |

**Key invariants**:
<Rules that must always hold — enforced at application or DB layer>

**Security model**:
<Who can read/write what — roles, ownership, public/private. Name compliance scope if applicable.>

**Configuration required**:
- `ENV_VAR_NAME` — purpose (omit section if no new env vars or credentials are needed)

**Acceptance criteria**:
- <Observable, testable outcome — what confirms the feature is complete and correct>
- <Edge case or failure that must be handled correctly>

**Critical test scenarios**:
- Happy path: <main flow end to end>
- Failure case: <most important failure — concurrency, timeout, invalid state>
- Auth/permission: <who is denied and what they receive>

<!-- Architecture mode only. Include immediately after Rationale. -->
## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | | |
| Framework | | |
| Primary DB | | |
| Auth | | |
| Hosting | | |
| Observability | | |

## Consequences

**Positive**:
- <what improves>

**Negative / tradeoffs**:
- <what gets worse or costs more>

**Neutral**:
- <notable side-effects — migrations needed, new patterns to learn, etc.>

## Follow-up

- [ ] <Action item or open question>
<!-- Omit section if there are no follow-up actions. -->

## References

<!-- What this decision is grounded in. Group as below; omit empty groups. NEVER fabricate a URL —
     name the source/practice instead. Every link here must have been web-verified by the subagent. -->

**Project sources** (verifiable, in this repo):
- <e.g. `AGENTS.md` — the auth convention · ADR 0003 · the installed `stripe` skill · already on Supabase>

**Practices & standards**:
- <named practice/principle the decision rests on — e.g. idempotency keys for money ops · strangler pattern · OWASP session guidance>

**Links** (web-verified only):
- <Title — https://real-fetched-url> · <or "none verified">

<!-- Enhancement mode only, when migration is non-trivial. -->
## Migration plan

**Strategy**: <strangler | big bang | feature-flagged | no migration needed>
**Phases**:
1. <Phase 1>
2. <Phase 2>
**Rollback**: <how to revert if a phase fails>
**Risks**: <what could go wrong>

<!-- Cross-cutting mode only. Include immediately after Rationale. -->
## Standard definition

**Canonical pattern**:
```<language>
// The one right way — concrete example
```

**Replaces**:
- <Pattern that is now wrong>

**Enforcement**:
<Lint rule / TypeScript type / other — and where it is configured>

**Rollout**:
<New code immediately | single migration PR | gradual migration schedule>

**Exceptions**:
<When the standard does not apply, or "None">

=== ADR TEMPLATE END ===

---

## Filename conventions

- Format: `NNNN-kebab-case-title.md`
- NNNN: zero-padded 4-digit number, auto-incremented
- Title: lowercase, hyphens, no articles at the start ("use-postgres" not "the-use-of-postgres")
- Examples: `0001-use-postgresql-for-primary-storage.md`, `0002-adopt-feature-flags-for-rollout.md`

## Status values

The ADR's status mirrors its feature's build lifecycle (roadmap: planned→`Proposed`, in-progress→`In Progress`, done→`Accepted`):

| Status | Meaning |
|---|---|
| `Proposed` | ADR written, decision agreed, feature NOT yet built. Set by /architect at creation. |
| `In Progress` | The feature governed by this ADR is being built. Set by /develop when the feature goes in-progress. |
| `Accepted` | The feature is built and verified (roadmap `done`) — the "done and dusted" state. An ADR is NOT `Accepted` until its feature ships. Set by /develop on completion or reconciled by /sync. |
| `Superseded by [NNNN](NNNN-title.md)` | Replaced by a newer ADR |

**Umbrella child ADRs carry no lifecycle status.** In an umbrella directory (`NNNN-<x>/`), only the `index.md` has a `**Status**:` line — it mirrors the feature. The **child ADRs are spec content**, so **omit the `**Status**:` line on children** (they're governed by the umbrella). `/develop` and `/sync` advance the umbrella `index.md`'s status only, never a child's.

## Writing rules

- Context describes the problem, not the solution
- Each option must be described fairly — do not write straw-man alternatives
- Rationale must reference specific forces from Context, not just repeat pros/cons
- Consequences must include negatives — an ADR with only positives is not credible
- Follow-up items are optional but recommended for full-tier decisions
- **One decision per ADR — keep it focused and scannable.** Length follows the decision, not a line count: don't pad, and never cut a required design field (data model, state machine, full API table, security model, acceptance criteria) to make the record shorter. If it needs *multiple independent decisions*, or the design won't fit cleanly in one scannable ADR, split it into an **umbrella ADR + child ADRs** (the directory shape) rather than letting one file sprawl.
