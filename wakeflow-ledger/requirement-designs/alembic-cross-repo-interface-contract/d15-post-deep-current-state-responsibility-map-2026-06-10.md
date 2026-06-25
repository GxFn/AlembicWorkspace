# Post-Deep Current-State Responsibility Map Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d15-post-deep-current-state-responsibility-map-2026-06-10`
Sequence Order: 16
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.
Design Basis: [post-d14-interface-governance-real-code-analysis-2026-06-10.md](post-d14-interface-governance-real-code-analysis-2026-06-10.md)

## Goal

After D8-D14 are completed, build a current-state map of the real interface
responsibilities that remain across AlembicCore, AlembicAgent, Alembic,
AlembicPlugin, and AlembicDashboard.

This is the first demand of the longer D15-D32 governance queue. It is not the
whole post-D14 goal; it produces the factual map that later implementation,
deletion, drift-gate, and validation demands consume.

## Completion Definition

- The controller reviews D8-D14 final evidence and current product code, not
  stale D0/D1 assumptions.
- Every important interface is mapped to its real current responsibility:
  producer contract, consumer adapter, shared deterministic schema, transport
  wrapper, runtime command, diagnostic surface, fixture source, compatibility
  shim, or obsolete duplicate.
- Each repository boundary is checked against real call chains and consumer
  usage, not only package names or desired architecture.
- Interfaces that now sit in the wrong repository, wrong layer, or wrong
  ownership role are listed with evidence and proposed owner.
- Interfaces that are reasonable as-is are explicitly marked as such so they
  are not churned by later cleanup.

## Stage Plan

1. Read D8-D14 completion evidence, commits, validation output, and remaining
   risks.
2. Scan current interface entrypoints across the five repositories.
3. Map each interface to current owner, consumer, call chain, validation
   evidence, and responsibility role.
4. Classify responsibility fit as `correct`, `unclear`, `misplaced`,
   `duplicated`, `overloaded`, or `obsolete`.
5. Produce the responsibility map used by D16-D18.

## Real Code Evidence Requirements

- Start from P01-P15 in the design basis and re-check them against the current
  post-D14 code; do not assume the earlier scan is still complete.
- Map Core rows and runtime contracts to their actual consumers in Alembic,
  Plugin, Agent, and Dashboard.
- Treat Dashboard `api.ts` mapper/fallback clusters as a responsibility
  question: provider compatibility, UI projection, diagnostic extension, or
  obsolete adapter.
- Treat MCP status and public tool outputs as separate responsibilities:
  ordinary tool result, diagnostics, runtime boundary, and detail references.
- Produce a repo-relative table with interface path, owner, consumer, state
  effect, dynamic fields, diagnostics, privacy class, and current validation.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d15-post-deep-current-state-responsibility-map-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d15-post-deep-current-state-responsibility-map-t1` |
| Target summary | Build the post-D14 current-state responsibility map for all important interfaces, using real code and accepted evidence. |

## Boundaries And Non-Goals

- Do not rewrite product code in this demand.
- Do not assume an interface is bad because it is old; judge by current
  responsibility, consumers, and validation evidence.
- Do not move ownership without a real caller, replacement entrypoint, and
  acceptance path.
