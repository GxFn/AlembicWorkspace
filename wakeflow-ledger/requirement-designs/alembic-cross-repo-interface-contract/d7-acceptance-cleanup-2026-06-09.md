# Cross-Repo Acceptance, Drift Gates, And Legacy Cleanup Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d7-acceptance-cleanup-2026-06-09`
Sequence Order: 8
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Accept the full cross-repo interface contract cleanup with raw evidence, drift
gates, deletion scans, validation matrix, and real runtime smoke where
justified.

## Completion Definition

- All registry rows have producer evidence, consumer evidence, validation
  output, and deletion/compatibility status.
- Cross-repo checks pass or failures are classified into repair tasks.
- Replaced duplicate contracts are deleted only after import scans, replacement
  entrypoints, and representative validation pass.
- Final acceptance covers CLI/daemon/API, Plugin MCP, Agent runtime/tool, and
  Dashboard consumer behavior.
- Final acceptance proves preserved functionality across representative success
  and non-success paths; no minimal happy-path implementation can close this
  demand.
- Optional Test evidence is used only for real runtime observation that product
  windows cannot self-verify.

## Stage Plan

1. Build a review pack from D0-D6 target results and raw artifacts.
2. Run contract drift checks, import-boundary scans, and per-repo validation
   matrix.
3. Verify duplicate-interface deletions and compatibility cleanup triggers.
4. Decide whether Test needs a real runtime smoke card.
5. Accept, rework, or block with raw evidence and remaining TODO routing.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d7-acceptance-cleanup-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d7-acceptance-cleanup-t1` |
| Target summary | Build the final review pack, inspect raw evidence, run workspace verification, and create any Test card only if real runtime observation remains necessary. |

## Boundaries And Non-Goals

- Do not accept target backfill without raw file/command/runtime evidence.
- Do not accept any demand that completed by deleting, hiding, deferring, or
  narrowing behavior without explicit user approval and replacement evidence.
- Do not archive the full sequence until D7 completion criteria are met.
- Do not delete still-owned capabilities or compatibility paths without import
  scan, replacement entrypoint, and validation evidence.
