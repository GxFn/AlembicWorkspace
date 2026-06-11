# AlembicAgent Runtime, Tool, And Provider Contracts Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d5-agent-runtime-tools-2026-06-09`
Sequence Order: 6
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Clean and verify Agent runtime, tool, result-envelope, provider-adapter, and
host-adapter contracts consumed by Alembic.

## Completion Definition

- Agent public contracts cover success, failure, cancellation, timeout,
  permission denial, partial result, provider error, and host adapter paths.
- Provider adapter details are not exposed as public runtime contracts unless
  intentionally mapped.
- Tool manifests and result envelopes have concrete fixtures and tests.
- Alembic consumer seam is identified for downstream verification.
- Agent checks, boundary lint, tool/router tests, result-envelope tests, and
  mock-provider tests pass.
- Existing Agent runtime/tool/provider behavior remains reachable through the
  explicit contracts.

## Stage Plan

1. Read accepted D1/D2 evidence for Agent-owned rows and Core dependencies.
2. Tighten tool manifests, execution request/response envelopes, and router
   boundaries.
3. Normalize provider adapter and host adapter public contract seams.
4. Add fixtures for every result branch.
5. Run Agent validation and backfill Alembic consumer impact notes.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d5-agent-runtime-tools-p1` |
| Target window | `AlembicAgent` |
| Target task | `alembic-interface-contract-d5-agent-runtime-tools-t1` |
| Target summary | Read state root and Agent AGENTS, update only Agent-owned runtime/tool/provider contracts, and return tests and consumer evidence. |

## Boundaries And Non-Goals

- Do not move Agent AI/provider/tool runtime into Core.
- Do not collapse Agent behavior into a happy-path-only result envelope.
- Do not create generic envelopes that cannot be validated with fixtures.
- Do not edit Alembic integration from the Agent window unless the claimed task
  package explicitly authorizes it.
