# Core ProjectScope Legacy Path Removal

Demand Key: `alembic-compatibility-removal-cleanup-cr1-core-projectscope-2026-06-10`
Primary Window: AlembicCore

## Goal

Move all current consumers to canonical ProjectScope identifiers and remove
cross-repo reliance on legacy path compatibility.

## Completion Definition

`projectScopeId` and `qualifiedPath` are the only product-facing lookup and
consumer fields. `legacyPath`, `byLegacyPath`, `unique-legacy-path`, and
`ambiguous-legacy-path` are removed from public product paths or quarantined as
private/test-only evidence after no active product consumer remains.

## Validation Floor

- Active source import/read scan across all five product repos.
- Core ProjectScope/CoreContractSpine tests.
- Downstream consumer builds/tests named by CR0.
- No feature loss for project-scope display, search, Dashboard panels, or Plugin
  IDE-agent surfaces.
