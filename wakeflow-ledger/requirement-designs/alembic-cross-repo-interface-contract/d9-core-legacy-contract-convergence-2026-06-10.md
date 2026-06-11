# AlembicCore Legacy Contract Convergence Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d9-core-legacy-contract-convergence-2026-06-10`
Sequence Order: 10
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Converge remaining Core-owned shared deterministic contract logic onto the D2
contract spine and remove or quarantine duplicated legacy definitions that
consumers no longer need.

## Completion Definition

- Core public exports, schemas, validators, and fixtures cover every shared
  deterministic contract still consumed by Alembic, AlembicPlugin,
  AlembicAgent, or AlembicDashboard.
- Remaining duplicate local DTO/schema definitions are either removed after
  consumer migration evidence or marked non-Core-owned with an explicit owner
  and reason.
- Consumers use public Core package subpaths only; private imports and
  cross-package deep imports are rejected by tests or lint.
- Core does not absorb runtime, MCP, UI, AI provider, daemon, or dashboard
  presentation responsibilities.
- Existing shared behavior remains available; completion cannot be a
  type-only shell or a build-only pass.

## Stage Plan

1. Read D1 registry rows assigned to Core, D2 target evidence, and the D8
   second-stage execution matrix.
2. Scan product consumers for private Core imports, copied schemas, copied
   validators, and old shared DTOs.
3. Move only Core-owned deterministic contracts to the accepted public spine,
   then update fixtures and tests.
4. Delete replaced duplicate definitions only after import scans and consumer
   validation pass.
5. Return Core validation evidence and consumer-impact notes for D14.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d9-core-legacy-contract-convergence-p1` |
| Target window | `AlembicCore` |
| Target task | `alembic-interface-contract-d9-core-legacy-contract-convergence-t1` |
| Target summary | Rewrite remaining Core-owned old shared contract logic onto the D2 public spine, remove eligible duplicates, and prove consumer import boundaries. |

## Boundaries And Non-Goals

- Do not centralize product-specific runtime behavior in Core for tidiness.
- Do not delete a shared definition until consumer imports and validation prove
  the replacement is live.
- Do not leave compatibility code without a consumer, cleanup trigger, and
  owner.
- Do not edit non-Core repositories from this demand except through evidence
  references and consumer impact notes.
