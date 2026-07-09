# Scope Mode: replan

## Replan (the living rhythm — run after a feature or phase ships)

The default cadence, not rare: run each time a feature or phase lands, keeping the scope matching reality and queueing the next slice. Reconciles in place, never spawns a new file; coarse and surgical (reconcile cells, append rows, don't rewrite the file).

1. Re-read the whole scope (single file, or `index.md` + epics; the workspace's in a monorepo) and the code/ADRs for what just shipped.
2. Reconcile what shipped: mark completed features `done` (verify from code/ADR, don't stamp); tick nothing unconfirmed; leave rows `/develop`/`/sync` already advanced.
3. Enroll needs surfaced during the build: read shipped features' ADR `## Consequences` and `## Follow-up` sections; a follow-up (e.g. "add rate limiting") not yet a scope row becomes a new `planned` row with intent, weight, `Needs ADR?`; the scope grows from real build feedback.
4. Reprioritize / reorder: re-sequence `Order`, adjust `Phasing` for not-yet-built work; foundations stay first; de-scoped work → `dropped`.
5. Queue the next slice: which feature(s) are next (lowest-`Order` `planned` rows), each `Needs ADR: yes` (→ `/architect` next) or `no` (→ `/develop`).
6. Report via the completion block (mode: replan): marked done, enrolled from ADR follow-ups, reordered/dropped, next step.
