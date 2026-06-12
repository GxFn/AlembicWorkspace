# CKG Resumption Package (opened 2026-06-12)

Status: ACCUMULATING — CKG4-CKG7 resume only on a user decision.
Maintained by: AlembicWorkspace controller until resumption handoff.

## Fixed inputs at pause

- Pause record: [ckg-pause-record-2026-06-12.md](ckg-pause-record-2026-06-12.md)
- Resume baseline: Plugin `ef90c9b` (pushed), Core `68f7ad5` (pushed);
  CKG1 completed rev 10, CKG2 completed rev 6, CKG3 needs-rework rev 5.
- CKG3 rework backlog (from the codex controller's own review): real
  Plugin MCP route proof ≥1 dimension; restart/resume proof; lease
  enforcement proof; host-agent/daemon/Core parity matrix; rich Recipe
  sample proof; repair-loop proof.
- SOP host-variable signal (from CC0 gates): keep the SOP host name a
  render variable — no longer time-critical with CKG paused; CKG4 must
  consume it on resumption. P3's CC1 host parameterization will land the
  claude-code value; CKG4 inherits a host-parameterized SOP.

## Accumulating slots (filled by portfolio phases)

| Slot | Producer | Status |
| --- | --- | --- |
| Train H source-graph-tool findings (both runtimes) | P1 Train H | pending |
| MT certification state for Plugin tools | P1 Train H + P3 step 4 | pending |
| P3-resolved tool surface (duality resolution on the current committed surface) | P3 step 7 | pending |
| Post-P3 Plugin baseline (vendor refreshed, IC5 migrations done, CC1 host parameterization, distribution sub-wave) | P3 exit (CC4+IC6 acceptance) | pending |
| CKG1 onboarding-status tests re-check on current tree (TODO CKG1-ONBOARDING-STATUS-TESTS-RED) | P3 step 0 entry check | pending |

## Resumption guidance

Resume CKG4-CKG7 AFTER P3 when possible: the duality-resolved,
vendor-refreshed, host-parameterized Plugin surface is the cleaner base.
CKG6's Dashboard/Alembic observability ideas stay inside the deferred
scope. First resumption demand should clear the CKG3 rework backlog
before CKG4 builds on it.

## CC3 routed additions (2026-06-12, P3 step 6 accepted tc-20260612110441-0041)

- **F2 — evidence-gate rejection misclassification (CKG3 surface)**: evidence-gated submission rejections (INCOMPLETE_SUBMISSION / SOURCE_REF_LINE_MISSING / SNIPPET_MISMATCH) classify as `core.failure.internal-error` (500-class) instead of an input-quality class. Live raw-wire evidence in the P3 state root `evidence/raw/cc3/`. Fix belongs to the CKG3-owned gate surface at resumption.
- **Positive confirmation for resumption**: the CKG3 evidence gate's three-stage actionable rejection arc and 3-item line-cited acceptance were live-verified end-to-end on the Claude Code host (cold 26 → initialized 27 → usable 39 same-connection flip per the certification matrix).
- **CC4 timing note**: fast `claude -p` runs race the ~1.5s MCP server boot (tools arrive as deferred); interactive real-agent acceptance (CC4) should verify on interactive sessions.

## CC4 routed additions (2026-06-12, P3 step 9 accepted tc-20260612121756-0053)

- **F-CC4-4 — evidence-gate DX register (CKG3 surface)**: real-agent submission arcs cost ~5 attempts/~15min. Specific gaps: SOURCE_REF_BARE rejects root-level files (`package.json:N` style refs), verbatim-snippet rule trips agents, `scope:narrow` escape is undocumented, graph-evidence coupling is prose-language-dependent. Raw transcripts in P3 state root evidence/raw/cc4/.
- **F-CC4-5 — consent-gate refusal misclassified** as internal-problem/internal-error (same family as F2): fix together with the F2 taxonomy work at resumption.
- **Real-agent positive baseline**: both hosts completed cold→init→evidence-gated submission→consumption→refusal arcs as genuine interactive sessions (Opus 4.8 + gpt-5.5); transcripts are the acceptance record.
