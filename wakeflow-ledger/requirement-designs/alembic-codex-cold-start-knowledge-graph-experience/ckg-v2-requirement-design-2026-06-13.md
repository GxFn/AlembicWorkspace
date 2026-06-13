# CKG v2 — Cold-Start Knowledge Graph Requirement (Codex-Window Re-Organization)

Status: controller-reviewed 2026-06-13 / re-organized for the Codex window / real-verification development / ready for user reorganization → Codex-window handoff (non-blocking)
Date: 2026-06-13
Design Key: alembic-codex-cold-start-knowledge-graph-experience (v2 re-statement)
Owning Window (on resumption): Codex window (real-verification development)
Supersedes for execution: the 2026-06-11 requirement design (kept as history)

## Why A Fresh Re-Statement

The original CKG requirement was written before the portfolio renamed and
restructured the Plugin. CKG was paused at a clean point and explicitly made
non-blocking; the rest of the portfolio then changed the ground under it.
This v2 re-states the requirement on the CURRENT tree so the Codex window
can pick it up for real-verification development without reconciling stale
paths and names. The original
[requirement design](alembic-codex-cold-start-knowledge-graph-experience-requirement-design-2026-06-11.md)
and the [resumption package](ckg-resumption-package-2026-06-12.md) are the
history and the accumulated handoff source.

## Current Landed Baseline (what already exists)

- **Renamed tree**: `lib/codex/` → `lib/runtime/` (SN5); the plugin NAME is
  `alembic`; the runtime package is `@gxfn/alembic-runtime`; the start
  script is `alembic-start.mjs`. The `#codex` import key is kept while the
  target moved (D5 ruling).
- **Two real host shells**: the Codex shell (`AlembicCodex` submodule) and
  the Claude Code shell (`AlembicClaudeCode` submodule), both installing the
  same MCP server with `ALEMBIC_PLUGIN_HOST` distinguishing them. Dual-host
  parity is established and gated (tools/list 26/39/40 zero drift,
  serverInfo `alembic` on both).
- **CKG1 onboarding contract**: landed (host-parameterized status / init /
  bootstrap-state / staged SOP scaffolding).
- **CKG2 source-graph lifecycle**: landed in Core (the `sourceGraph`
  materialization switch is wired; durable source-graph tables participate
  in cold start).
- **CKG3 evidence gates**: partially landed but NEEDS REWORK (see backlog).
  The evidence-gate three-stage rejection arc and line-cited acceptance were
  live-verified end-to-end on the Claude Code host (cold 26 → initialized 27
  → usable 39 same-connection flip).
- **Positive real-agent baseline on record**: both hosts completed
  cold→init→evidence-gated-submission→consumption→refusal arcs as genuine
  interactive sessions (Opus 4.8 + gpt-5.5); transcripts are the standing
  acceptance record for those arcs.

## Goal (unchanged in intent, current in terms)

A Codex (or Claude Code) user cold-starts a project through the `alembic`
plugin and gets a real, reliable knowledge-creation loop: staged
host-parameterized SOPs, source-graph-backed evidence, fail-closed evidence
gates with honest error classes, and post-bootstrap knowledge use — proven
by real-agent verification on BOTH shells, not scripted probes.

## CKG3 Rework Backlog (clear this BEFORE building CKG4)

From the Codex controller's own review, plus the portfolio's routed
findings:

1. **Real Plugin MCP route proof** for ≥1 dimension through the actual shell
   entry (not Core unit tests).
2. **Restart/resume proof**: a bootstrap session survives an MCP process
   restart via `bootstrapSessionRef`.
3. **Lease enforcement proof**: the single-writer bootstrap lease blocks a
   concurrent second bootstrap with a stable `bootstrap_in_progress` state.
4. **Host-agent / daemon / Core parity matrix**: the three bootstrap
   entrypoints share the same scope/graph/submission/dimension/finalizer
   gates, or weaker paths are explicitly blocked.
5. **Rich Recipe sample proof** + **repair-loop proof**: accepted samples
   are source-grounded and rich; rejected ones return rebuild instructions
   and never count toward a dimension.
6. **F2 / F-CC4-5 error-class fix**: evidence-gated submission rejections
   (INCOMPLETE_SUBMISSION / SOURCE_REF_LINE_MISSING / SNIPPET_MISMATCH) and
   consent-gate refusals currently classify as `core.failure.internal-error`
   (500-class). Reclassify to an input-quality / consent class. Raw-wire
   evidence in the P3/CC3 state roots.
7. **F-CC4-4 evidence-gate DX**: SOURCE_REF_BARE rejects legitimate
   root-level files (`package.json:N`); the verbatim-snippet rule trips real
   agents; the `scope:narrow` escape is undocumented; graph-evidence
   coupling is prose-language-dependent. Real-agent submission arcs cost
   ~5 attempts / ~15 min — the DX must improve without weakening the gate.

## Resumption Demand Sequence (Codex window)

### CKG3R - Evidence-Gate Rework (AlembicPlugin + AlembicCore; Codex window)

- clear the CKG3 backlog items 1-7 above: real-route proof, restart/resume,
  lease enforcement, parity matrix, rich/repair samples, error-class
  reclassification (F2/F-CC4-5), and the evidence-gate DX fixes (F-CC4-4);
- every fix proven through the real shell entry on BOTH hosts;
  dual-shell parity byte-stable except where a fix is intentionally
  host-shaped.

### CKG4 - Relationship Tool Surface Clean Output (AlembicPlugin)

- finalize the canonical source-graph relationship tool catalog with
  compact per-tool clean outputs (the renamed tree's `lib/runtime` surface);
- consume the host-parameterized SOP render variable (claude-code value
  landed by CC1) so the SOP pack renders per host;
- consume the design input **option A early-handshake readiness**: serve MCP
  `initialize` before runtime resolution and defer `tools/list` until ready,
  so a slow first connect no longer races the host timeout;
- per-tool schema honesty inherited from the quality burndown
  (additionalProperties:false) where it touches these tools.

### CKG5 - Knowledge Use After Bootstrap (AlembicPlugin + AlembicCore)

- `intent` / `prime` / `search` / `structure` / source-graph tools / Guard /
  Decision Register work as one coherent post-bootstrap lifecycle without
  mixing trust layers; staged vs active vs prime-visible states are
  distinct; generation-bound stale-evidence review after rescan.

### CKG6 - Dashboard And Progress Observability (AlembicDashboard + Alembic)

- cold-start session timeline, source-graph freshness, dimension completion,
  Recipe evidence coverage, skipped-skill-export policy state, and bootstrap
  session recovery — on the current Dashboard (post-SN naming, post-AD
  charters).

### CKG7 - Real Codex + Claude Code Cold-Start Acceptance (Codex window + Test as assigned)

- real-agent cold-start runs on BOTH shells to the original CKG7 quality
  standard: raw tool outputs, transcript evidence, accepted/rejected Recipe
  sample audits, repeat-after-rework proof;
- both-host tools/list parity; rescan-after-edit; failure branches with raw
  MCP outputs; the standing positive baseline arcs re-verified on the
  reworked gates;
- controller/user acceptance from raw evidence; archive.

## Non-goals

- No re-litigation of the landed CKG1/CKG2 contracts unless the rework
  proves a defect; no rename work (SN5 already did it).
- No portfolio-side changes — CKG consumes the renamed tree, the dual
  shells, the published runtime (once 0.3.0 publishes), and the quality
  burndown's schema-honesty as given.
- No agent-driven KB-building arcs purely for token cost where the standing
  real-agent baseline already covers the arc (re-verify only the reworked
  gates).

## Handoff Protocol

This is the handoff source for the Codex window. On the user's
reorganization: the Codex window owns CKG3R-CKG7 as real-verification
development; the AlembicWorkspace controller coordinates cross-repo
dependencies (Core gate surface, Dashboard observability) but does not drive
the Codex-side build. CKG stays non-blocking for every other requirement.

## Completion Definition

- CKG3 backlog cleared with real-route, restart, lease, parity, and
  rich/repair proofs; F2/F-CC4-5 reclassified; F-CC4-4 DX improved without
  weakening the gate.
- CKG4-CKG6 landed on the renamed dual-shell tree with host-parameterized
  SOPs and early-handshake readiness.
- CKG7 real-agent acceptance passes on BOTH shells with raw evidence and
  repeat-after-rework; archived.

## Validation Requirements

Every CKG demand proves through the real shell entry on both hosts; the
evidence gates carry negative tests; CKG7 uses real interactive agent
sessions (not scripted probes) per the original CKG7 standard; Wakeflow
verification at the closing demand.

## Stop Conditions

- A fix would weaken an evidence gate to improve DX.
- A change would break dual-shell parity outside an intentionally
  host-shaped fix.
- A CKG demand would re-do portfolio rename/packaging work.
- Acceptance would rest on scripted probes instead of real-agent sessions.
- Prose-only evidence.

## Open Items For The Reorganization Handoff

- The user reorganizes this v2 into the Codex window's working form and sets
  its schedule (CKG is non-blocking).
- Sample project choice for repeatable both-shell CKG7 acceptance.
- Whether CKG6 Dashboard observability is mandatory for CKG7 or a
  fast-follow.
