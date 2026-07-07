# Architect Main Flow: after subagent

### After subagent completes

**First — did it run at all?** If the ADR file is missing or empty, report the failure and offer to re-run; never fabricate an ADR summary. Only if the file exists, continue:

**Self-check before presenting**: Read the written ADR. For a directory ADR read both `index.md` and its `rationale.md` (the decision-record sections live in `rationale.md`; the single-file shape has everything in the one file). Verify all required sections exist across the file(s):
- All modes: `## Summary` (the plain-words human quick read, no dashes, in `index.md`/the file), `## Requirements` (IDed acceptance criteria, the confirmed spine), `## Decision`, `## Consequences` (build spec, in `index.md`/the file); and `## Context`, `## Options considered` (unless "Documenting a made decision"), `## Rationale` (decision record, in `rationale.md` for a directory ADR, inline otherwise). A directory `index.md` also carries the one-line `## Rationale` pointer to `rationale.md`.
- Data-backed modes: `## Build plan`: ordered tasks, each tagged with the AC(s) it satisfies, migration first; every AC traces to at least one task
- Feature mode: `## Feature design` with the confirmed data model and Critical test scenarios (mapped to ACs) populated
- Architecture mode: `## Proposed stack` with every relevant layer filled
- Decision-only ADRs (Architecture, Cross-cutting): no `## Build plan` of implementation steps and no invented meta-ACs; the spec is `## Proposed stack` / `## Standard definition`, and the executing feature (e.g. the scaffold sub-task) derives its steps at `/develop` time. If a scaffold-style build plan appears in a stack ADR, strip it before presenting.
- Enhancement mode (non-trivial migration): `## Migration plan` with Strategy, Phases, Rollback, and Risks
- Cross-cutting mode: `## Standard definition` with Canonical pattern, Replaces, Enforcement, Rollout, and Exceptions

If a required section is missing or a field is blank/placeholder, add this line directly after the ADR path in the presentation: `⚠️ Incomplete: [section name] was not completed by the subagent, e.g. "⚠️ Incomplete: ## Feature design > Security model was left as a placeholder. Request it in your feedback."`

**Design-review gate (full-weight features — optional for lean/medium, capability-first).** Before presenting a full-tier / high-risk / compliance-touching / foundational ARCHITECTURE ADR, run a fresh-model critique: spawn a subagent with its model set explicitly to a strong and, where possible, different model (not inherited from the session) with the drafted ADR to stress-test the design (does it hold up? is there a materially simpler option? what failure mode is missed?). Surface its findings alongside the ADR (a short "Design review" note), and fix clear issues by targeted Edit before or during confirmation. Skip for trivial/lean-tier decisions, and skip where the agent has no subagent capability (note that it was skipped).

1. Tell the engineer the ADR path, a one-line preview from the subagent's report, and (if run) the design-review note:

   ```
   Draft ADR written to `docs/adr/<NNNN-title>.md`
   Decision: <Decision line from report>
   Key tradeoff: <Key tradeoff line from report>
   Design review: <one-line verdict + any issue raised, or "skipped (lean)">
   ```

   Then present the confirmation decision panel (capability-first: `AskUserQuestion` on Claude Code, else the same options as plain text):
   - **question**: "Accept this ADR, or change it?"
   - **header**: "ADR"
   - **options**: `Accept, looks solid (recommended)` · `Change something, I'll tell you what` · `Rethink the approach`
   On **Change something**, ask what to change (this also covers overriding a ⚠️ Premise note: if the engineer disagrees with it, remove it and proceed with their direction) and apply targeted **Edit**s to the sections called out, never a from-scratch rewrite. On **Rethink the approach**, revisit the relevant stage(s)/options and revise. Either way, re-present the SAME panel (not a plain "reply yes") and loop until the engineer picks **Accept**.
2. **On Accept — ratify the decision; the status follows the ADR kind** (per the status model in *What this skill does*; discriminator: whether a buildable roadmap feature links this ADR, computed in step 3):
   - Feature-linked ADR: do not edit the status line; a confirmed-but-unbuilt ADR correctly stays `Proposed` (/develop advances it).
   - Standalone decision ADR: set `**Status**:` to `Accepted` on this confirmation (ratification is the deliverable; /develop won't advance it, `Proposed` would strand it).
   - Already-shipped documentation path: born `Accepted`; leave it, /sync reconciles against the roadmap.
3. **Derive tasks + link the roadmap (after confirmation).** Use the roadmap feature located in pre-flight (or re-locate cheaply by scanning roadmap filenames/headings across per-workspace subdirs; open only the single roadmap file containing it, `roadmap.md` or the matching `<epic>.md`).
   - **Decision-only ADR** (ARCHITECTURE stack decision or CROSS-CUTTING standard, no `## Build plan` by rule) → no build tasks to copy. Link the row's `ADR` cell (relative path, as below), tick the `Decision (ADR)` sub-task `[x]`, and leave the execution sub-task(s) untouched (e.g. the `Scaffold (/develop)` sub-task on the Stack and architecture feature) so `/develop` derives those steps from the decision at build time. Do not write scaffold or implementation steps into the row (the double-spec bug this avoids).
   - **A matching roadmap feature exists (buildable feature ADR)** → update the feature to the built-ready shape (the roadmap's main living update, done every time an ADR is captured). Make exactly these edits, nothing else:
     1. Tick `Design it (ADR)` `[x]` and remove the `· needs a decision` tag from the heading (it is decided now).
     2. Link the ADR on the feature's pointer line, computed as a relative path from the roadmap file to the ADR: from `docs/roadmap/api/…` to `docs/adr/api/0001-x.md` is `[0001](../../adr/api/0001-x.md)`; to a directory ADR (umbrella or single-with-files), `[0001](../../adr/api/0001-x/index.md)`; single-repo `docs/roadmap/` → `docs/adr/` is `../adr/…`.
     3. Define the build milestones, a rollup, never the atomic dump: add a `- [ ] Build it: /develop <feature>` box, and under it 2 to 5 milestone sub-items rolled up from the ADR's `## Build plan` by grouping its atomic tasks into coherent chunks (by AC cluster or by layer), each tagged with the ACs it covers. The atomic tasks and per-task detail stay in the ADR's `## Build plan`. The 2-to-5 is a guideline you reason about, not a rule: if it won't fit in about five milestones the feature is too big and should be split. Never a fixed milestone list; derive them from THIS ADR's Build plan.
     4. Add `- [ ] Verify it: /verify <feature>` and `- [ ] Test it: /test <feature>` boxes after Build.
     5. Move the feature's status to `in-progress` (designing is progress) in the At-a-glance table and beside the heading.
     6. Enroll what the ADR surfaced: a `## Follow-up` item that is really a separate feature (not part of this one) becomes a new roadmap feature tagged `from ADR NNNN`. Deferred, non-blocking follow-ups go to the Deferred list.

     Edit only this feature (and any newly-enrolled follow-up), never other features' contents. The result stays coarse (a milestone rollup, not a task dump) while every box is a command or a tracked milestone: Design → Build (+ milestones) → Verify → Test.
   - **NO matching feature** → the atomic tasks stay in the ADR's `## Build plan`; ask via a panel (capability-first): question "Track this feature on the roadmap?", header "Roadmap", options `Yes, enroll it` · `No, keep it in the ADR only`. On **Yes**, enroll a coarse roadmap feature (heading + intent + `Done when:` line) with the same built-ready shape as above (Design ticked + ADR link + the milestone rollup + Verify + Test boxes). On **No**, leave the roadmap untouched and note in your final message: "This ADR isn't on the roadmap. Its build tasks live in `## Build plan`; run `/roadmap` later to enroll it." (Silent orphan ADRs are exactly the drift `/status` later has to surface.)
4. **Spoken summary in chat (plain words, no dashes).** After acceptance and roadmap linking, show a short plain language summary (per *Output style*): what the ADR decided, why in one line, and what happens next (the build tasks it produced, and which skill to run next). A template:

   ```
   Done. Here is the quick version.
   What we decided: <one plain sentence>.
   Why: <one plain sentence>.
   What is next: run /clear to start a fresh session (it reads this ADR from disk, so nothing is lost and the long design chat you just had stops costing tokens), then /develop <feature> to build it.
   ```

   Keep it plain; gloss any jargon in parentheses. This is the human read, separate from the ADR file's own `## Summary`.

/architect is complete when the engineer confirms the ADR (status per step 2 above). It does not invoke other skills.

---
