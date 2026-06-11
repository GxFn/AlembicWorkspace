# AlembicCore Shared Deterministic Contract Spine Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d2-core-spine-2026-06-09`
Sequence Order: 3
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Clean and verify Core-owned deterministic contracts, public exports, validators,
and boundary tests needed by real consumers.

## Completion Definition

- Every Core-owned contract has export path, schema/type owner, consumers,
  validation, and removal/compatibility rule.
- Core exposes stable deterministic runtime/project/job/repository/workflow
  contracts only where D0/D1 evidence justifies Core ownership.
- Core does not absorb Codex MCP, Dashboard UI, AI provider runtime, CLI daemon
  behavior, or Agent tool execution.
- Core build/check/tests and boundary checks pass.
- Existing Core-owned consumer behavior is preserved; cleanup cannot narrow
  shared contracts to a thin import-only shell.

## Stage Plan

1. Read accepted D0/D1 Core registry rows.
2. Tighten public exports and index surfaces for accepted Core contracts.
3. Add or adjust validators/types/tests for shared deterministic contracts.
4. Add import-boundary checks where feasible.
5. Backfill downstream consumer impact notes.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d2-core-spine-p1` |
| Target window | `AlembicCore` |
| Target task | `alembic-interface-contract-d2-core-spine-t1` |
| Target summary | Read state root and Core AGENTS, update only Core-owned deterministic contracts, and return tests and boundary evidence. |

## Boundaries And Non-Goals

- Do not add a shared contract without real consumer evidence.
- Do not reduce existing Core capability to a minimal placeholder contract.
- Do not edit sibling repositories from the Core window.
- Do not keep compatibility adapters without a consumer and cleanup trigger.
