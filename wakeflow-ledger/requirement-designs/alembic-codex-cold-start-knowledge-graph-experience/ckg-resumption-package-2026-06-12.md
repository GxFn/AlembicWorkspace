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

## User routing decisions (2026-06-13)

1. **Real plugin testing DEFERRED by user decision**: no further real-agent /
   real-install plugin verification runs for now. Specifically deferred:
   MT4 re-certification (and its sheet upgrades: gated-response expectations,
   edge-args registry, no-in-session-tier-flip rule), CC4-FIRST-SESSION-MCP-
   CONNECT root-cause isolation (needs real cold-cache sessions), and any new
   CC4-style live acceptance. Certification matrix v1 + the CC4 transcripts
   remain the standing record with known deltas documented. Nothing in the
   currently executable portfolio set depends on these runs.
2. **CKG resumption route**: CKG waits until the controller's portfolio
   tasks are fully complete; the user will then REORGANIZE the requirement
   and hand it to the Codex window for real-verification development. This
   package (CKG3 rework backlog F2/F-CC4-4/F-CC4-5, the positive live
   baseline, and the accumulated slots above) is the handoff source. The
   deferred real-testing items in (1) naturally fold into that Codex-led
   phase. SN5 (Plugin naming wave incl. lib/codex rename) stays parked
   behind CKG completion and chains after it.

### Amendment (2026-06-13, user decision)

Routing decision (1) above is PARTIALLY SUPERSEDED: the user re-activated
the deferred plugin testing as the P5 re-certification wave — deterministic
harness re-cert on BOTH shells (codex + claude-code entries) + expectation
sheet/edge-args upgrades + CC4 first-session isolation probes. STILL
EXCLUDED: agent-driven cold-start KB-building arcs (token cost; CC4
real-agent baseline already on record). Routing decision (2) is UNCHANGED:
CKG reorganization and real-verification development still go to the
Codex window after portfolio completion.

## P5 routed addition (2026-06-13, p3 first-connect diagnosis)

- **Design input for the CC-next/CKG start-path work**: option A
  "early-handshake readiness" (serve MCP initialize before runtime
  resolution; defer tools/list until ready) — motivated by the
  DEMONSTRATED install-lock race (60s lock wait > 30s host connect
  timeout → first-session connect failure; diagnosis doc in the P5
  state root). Option B (sub-timeout lock fail-fast ~20s with a
  structured retry-after diagnostic) is staged as a parity-budgeted
  wave candidate independent of CKG.

### Amendment 2 (2026-06-13, user decision): CKG is NOT a blocker

The user ruled: CKG will be reorganized later as its own requirement
(handed to the Codex window) and must NOT block other work. Effect:
SN5 un-parks (runs as alembic-sn-continuation after the N1 naming
wave; lib/codex → lib/runtime per ruling D10) — the future reorganized
CKG requirement will inherit the renamed tree and the alembic plugin
name. Everything else in this package (rework backlog F2/F-CC4-4/5,
option A design input, positive baseline) remains the handoff source.
