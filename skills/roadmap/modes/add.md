# Roadmap Mode: add

## Add (enroll one ad-hoc feature — lightweight)

Inferred when a roadmap exists and the argument names a single feature: `/roadmap <a feature>` enrolls one coarse row without re-planning, for a feature invented mid-stream. No `add` subcommand to type.

1. Re-read the roadmap and dedup: present at any status → extend that row, don't duplicate.
2. Ask only what's needed (a short panel if intent/weight is ambiguous, else infer): intent, weight, placement (`Order` / `Phasing`).
3. Offer the per-feature Approach: top option `(recommended) inherit the project default`, plus the named approaches (Tracer Bullet · Skateboard · Facade (prototype-grade) · Journey); tag beside the heading only if it differs from the header default.
4. Set `Needs ADR?` with the invent-test: would building it require a decision the engineer has not made? Yes for a provider/library choice, a data model, a cross-cutting pattern, the design system, a whole page/screen with no spec yet, or non-trivial behavior (search, filtering, recommendations). No only for pure implementation an existing `design.md`/ADR/convention covers. Unsure → yes; `full` weight → almost always yes. Yes means its next step is `/architect <feature>`.
5. Append: an At-a-glance row (next free `#`, status `planned`) + a feature section under its phase with intent, a `Done when:` line, its one entry checkbox (no build-task breakdown, derived from the ADR later). Epic-split: add to the right epic file, bump that epic's rollup in `index.md`.
6. Report briefly (mode: add): the row, weight, approach (inherited or overridden), Needs ADR, next command.

Never enumerate build tasks in add mode; `/architect` derives milestones after the ADR, and atomic tasks stay in the ADR.
