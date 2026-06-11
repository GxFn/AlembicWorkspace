# Compatibility Deletion Wave Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d29-compatibility-deletion-wave-2026-06-10`
Sequence Order: 30
Maintainer: AlembicWorkspace
Primary Window: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Delete obsolete compatibility paths only after D24-D28 prove there is no active
consumer, the replacement route is connected, and representative checks pass.

## Completion Definition

- Every deletion candidate names old field/route/tool/adapter, current owner,
  former consumer, replacement path, no-consumer proof, and validation command.
- Obsolete aliases, fallback bags, duplicate schemas, stale compatibility
  parsers, and unused route shims are removed by owning product windows.
- Kept compatibility paths include owner, reason, active consumer, cleanup
  trigger, and follow-up demand reference.
- Import scans, fixture replay, build/check/test output, and runtime sample
  evidence are attached before acceptance.

## Work Items

- Consolidate D18 cleanup candidates and D24-D28 evidence.
- Create product-specific deletion task packages.
- Review raw diffs and validation output.
- Roll TODO/backlog rows for valid kept compatibility paths.

## Real Code Evidence Requirements

- Anchor deletion candidates to real code paths such as provider aliases,
  Dashboard fallback extractors, Plugin legacy compatibility inputs, broad
  local records, route shims, and obsolete duplicated schemas.
- Each deletion row must have old field/path, former consumer, current
  no-consumer proof, replacement path, owner, validation command, and rollback
  risk.
- Kept compatibility rows must include active consumer, reason, cleanup
  trigger, and the future demand or blocker that will remove it.
- Do not delete anything still owned by CLI, daemon, HTTP/API, Dashboard, MCP,
  skills, channels, release packaging, local enhancement, or platform runtime.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d29-compatibility-deletion-wave-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d29-compatibility-deletion-wave-t1` |
| Target summary | Coordinate deletion of obsolete compatibility paths only after no-consumer proof and replacement validation. |

## Boundaries

- Do not delete still-owned CLI, daemon, HTTP/API, dashboard, MCP, skill,
  channel, release, local enhancement, or platform capabilities.
- Do not delete without replacement and representative validation.
- Do not keep compatibility without a cleanup trigger.
