# Compatibility Removal Readiness Scan

Demand Key: `alembic-compatibility-removal-cleanup-cr0-readiness-scan-2026-06-10`
Maintainer: AlembicWorkspace
Primary Window: AlembicWorkspace
Document Role: Wakeflow demand definition

## Goal

Build the exact deletion readiness matrix from D29/D32 and current code before
dispatching product cleanup.

## Completion Definition

- Every preserved D29/D32 compatibility candidate has current consumer scan,
  replacement path, dispatch owner, validation command, delete-ready status, and
  stop condition.
- Product cleanup order is explicit and avoids deleting producer compatibility
  before consumers migrate.
- The matrix distinguishes cross-repo public compatibility from provider-private
  shims that may remain hidden behind canonical public contracts.
- No product code is changed by the controller.

## Initial Task

| Field | Value |
| --- | --- |
| Task package | `alembic-compatibility-removal-cleanup-cr0-readiness-scan-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-compatibility-removal-cleanup-cr0-readiness-scan-t1` |
| Target summary | Review D29/D32 preserved compatibility, scan current code, and create exact CR1-CR7 dispatch matrix. |

## Candidate Families

- Alembic project action `waitMs` alias and action result compatibility.
- Core ProjectScope `legacyPath`, `byLegacyPath`, `unique-legacy-path`, and
  `ambiguous-legacy-path`.
- Dashboard provider adapter fallback policies, runtime alias display, and
  legacy source labels.
- Plugin public legacy input policy and legacy envelope parsing.
- Agent public compatibility semantics and provider-private quirks.

## Boundaries

- Do not create D33+.
- Do not dispatch deletion work without scan evidence.
- Do not delete behavior needed by current consumers.
- Do not keep dual public paths after a cleanup package is accepted.
