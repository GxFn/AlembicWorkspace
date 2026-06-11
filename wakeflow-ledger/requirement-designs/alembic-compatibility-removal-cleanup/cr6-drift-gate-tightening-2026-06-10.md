# Compatibility Drift Gate Tightening

Demand Key: `alembic-compatibility-removal-cleanup-cr6-drift-gate-tightening-2026-06-10`
Primary Window: AlembicWorkspace

## Goal

Tighten cross-repo drift gates so deleted compatibility fields cannot reappear
in public paths.

## Completion Definition

The D30 drift gate command set or equivalent product-owned tests fail when
removed public compatibility fields, aliases, fallback policies, or legacy
envelope fields return to public interfaces. Private provider shims are allowed
only under named private contexts.

## Validation Floor

- Repeatable command list with owner repo for each failure.
- Negative scans for deleted public compatibility fields.
- D30 gate rerun after changes.
