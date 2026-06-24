# Project: Engineering Workflow Skills

A collection of Claude Code skills encoding a tiered, phase-based engineering workflow.

## Stack

- Skills (source, for distribution via `npx skills`): `skills/<name>/SKILL.md`
- Decision records: `docs/adr/`

## Tiers

| Tier | When |
|---|---|
| just-do-it | Trivial, reversible, low-risk |
| lean | Small, well-understood change |
| medium | Moderate scope or cross-cutting |
| full | High risk, large scope, or compliance-sensitive |

## Skills

See `skills/` for available skills. (Consumers install them via `npx skills add JavaScript-Mastery-Pro/pilot`, which lands them in their agent's skills dir, e.g. `.claude/skills/`.)

## ADRs

Stored in `docs/adr/`. Format: `docs/adr/NNNN-title.md`.
