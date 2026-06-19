# AlembicAgent Architecture Optimization (Post-Convergence)

Status: in execution / direct-execution mode (user-authorized, commit-per-round, no dispatch) / repo-internal scope
Maintained Window: AlembicWorkspace
Date: 2026-06-19
Design Key: alembic-agent-architecture-optimization

## Lineage

Successor to the completed `alembic-agent-comprehensive-optimization`
(accepted 2026-06-12, HEAD `35901cf`). That round left the tool convergence
*partial* (V1 importers reduced to zero behind a `ToolRuntimeBridge`; public
`./tools` and the V2 labels preserved) and did not land the AgentRuntime
decomposition. The 2026-06-19 session **completed** the convergence (deleted
the bridge + core shims + `v2/types` shim; renamed `tools/v2 -> tools/runtime`;
dropped every V1/V2 label; one `src/tools/kernel` contract) and fixed a stale
pre-existing test. This demand addresses the **remaining + newly-surfaced
debt** against the current post-convergence tree.

## Controller Judgment

A two-pass multi-agent architecture review (6 subsystem maps -> 6 dimension
reviews -> per-finding adversarial verification) produced **39 verified
findings** (1 critical, 13 high, 18 medium, 7 low), all file:line-grounded.

The architecture is fundamentally healthy: `src/ai` is a clean leaf (zero
upward cross-area imports), the tool convergence succeeded, and the validation
gates are real. Debt concentrates in: (1) god-objects (AgentRuntime 2758 /
PcvNodeEvidence 1669 / ActiveContext 1378 / ContextWindow 1209 /
PipelineStrategy 1104 / AiProvider 869 LOC), (2) two genuine correctness gaps
(production tool degradations are invisible — `ToolRouterAdapter` hardcodes
`EMPTY_DIAGNOSTICS`; the production router has no timeout/abort guard while the
host router does — both violate AGENTS.md:146), (3) half-finished migrations
(dead capability classes, `AgentRouter`, `ConsolidationGate`, unwired
`ExitController` methods, dead `AiProvider` reliability machinery), (4) a tool
contract that is now unversioned/non-replayable (violates AGENTS.md:144), and
(5) pervasive duplication (token estimation 5x, provider key->env 3x,
`summarize()` 5x).

Cross-repo verification corrected two "dead" candidates: `WorkflowRegistry`
and `LightweightRouter` ARE live public API consumed by the Alembic main repo
(`WorkflowAdapter`, `AgentModule.setRouter`) — keep + document, do not delete.

## Entry Points

- Audit evidence base:
  [arch-audit-findings-2026-06-19.md](arch-audit-findings-2026-06-19.md)
- Requirement design:
  [requirement-design-2026-06-19.md](requirement-design-2026-06-19.md)

## Phase Order

| Phase | Title | Window | Risk |
| --- | --- | --- | --- |
| AAO0 | Layering governance + test safety net | AlembicAgent | low |
| AAO1 | Dead-code removal (cross-repo verified) | AlembicAgent | low |
| AAO2 | Observability + boundary robustness (correctness) | AlembicAgent | medium |
| AAO3 | Contract unification + versioning + DI typing | AlembicAgent | medium |
| AAO4 | Duplication consolidation | AlembicAgent | low |
| AAO5 | God-object decomposition | AlembicAgent | high |
| AAO6 | Break the tools->agent capability cycle | AlembicAgent | low |

Execution order: AAO1 may start immediately (no safety-net dependency);
AAO0 governance + tests precede AAO5; AAO2 (correctness) is highest value.

## Completion Definition

Each verified finding is either resolved or explicitly deferred with a recorded
reason; AgentRuntime and the other five god-objects drop below a stated
LOC/responsibility threshold; production tool degradations are observable
(envelope diagnostics + logs) and abortable; the kernel contract is versioned;
token estimation has a single source; no V1/V2 or migration-phase residue; the
tools->agent cycle is gone; the AlembicAgent gate matrix and downstream Alembic
build stay green at every commit.

## Non-goals

- No cross-repo behavior change to the Alembic main repo public surface (the
  library export NAMES/shapes stay stable; external consumers unaffected).
- No AlembicPlugin / AlembicCore / AlembicDashboard changes.
- No new product features; this is structural/quality optimization only.
- No version bump unless user-directed.
