# Deep Optimization Control Plane Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d8-deep-optimization-control-plane-2026-06-10`
Sequence Order: 9
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Turn the accepted D0-D7 contract work into a concrete second-stage execution
matrix for deep legacy-interface refactoring across AlembicCore, AlembicAgent,
Alembic, AlembicPlugin, and AlembicDashboard.

## Completion Definition

- The controller reviews accepted D0-D7 evidence, the D1 registry, current
  product code, and any open D7 blockers.
- Every remaining old interface logic candidate is mapped to an owning
  repository, old entrypoint, replacement contract, real consumers, validation
  path, deletion condition, and risk.
- The output is not an inventory-only document: it must create claimable
  product-window demand inputs for D9-D13 and a final D14 acceptance path.
- Candidates that are already solved by D2-D7 are explicitly closed with
  evidence instead of redispatched.
- Candidates that would delete, downgrade, or hide behavior are marked blocked
  until no-consumer proof, replacement evidence, and representative validation
  exist.
- D7 runtime blockers, if still open, are carried as first-class repair inputs
  rather than bypassed by the new sequence.

## Stage Plan

1. Read the D0 inventory, D1 registry/ADR, D2-D7 state roots, accepted target
   results, and current product repository status.
2. Scan the five product repositories for legacy interface logic that still
   bypasses the new contract model: duplicate DTOs, field bags, implicit
   capability guessing, fallback success paths, old normalizers, raw diagnostic
   leaks, untyped route/event payloads, and stale compatibility shims.
3. Classify each candidate by function class, owning repository, consumer,
   replacement contract, validation family, and deletion eligibility.
4. Produce D9-D13 product-window demand inputs and D14 acceptance criteria.
5. Stop for user/controller decision only when a candidate changes visible
   behavior, repository ownership, version/evolution strategy, or deletes a
   capability without complete evidence.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d8-deep-optimization-control-plane-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d8-deep-optimization-control-plane-t1` |
| Target summary | Build the second-stage execution matrix for all remaining old interface logic across the five repositories, using D0-D7 evidence and current code scans. |

## Boundaries And Non-Goals

- Do not re-open D0-D7 accepted work unless current evidence proves drift or an
  incomplete behavior path.
- Do not create thin "follow-up" demands that only add types, docs, or unused
  adapters.
- Do not dispatch product work without a real old entrypoint, replacement
  contract, consumer path, and validation path.
- Do not design versioning, deprecation windows, or long-term evolution policy;
  that remains deferred by user decision.
