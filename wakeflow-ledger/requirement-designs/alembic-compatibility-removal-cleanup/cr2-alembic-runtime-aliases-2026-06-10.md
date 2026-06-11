# Alembic Runtime Alias Removal

Demand Key: `alembic-compatibility-removal-cleanup-cr2-alembic-runtime-aliases-2026-06-10`
Primary Window: Alembic

## Goal

Remove public project runtime request aliases and internal whole-result
compatibility once current consumers use canonical action contracts.

## Completion Definition

`waitUntilReadyMs` is the only product-owned project action wait field.
Project action responses expose the canonical public projection, not raw internal
action result compatibility. If external HTTP `waitMs` removal cannot be proven
safe, return a release/breaking-change decision instead of silently deleting it.

## Validation Floor

- ProjectsRoute tests for canonical action inputs and failures.
- Multi-project runtime smoke.
- Dashboard/Plugin consumer checks from CR0.
- Import/source scan proving no internal product caller sends `waitMs`.
