# Consumer-Driven Fixture Replay Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d24-consumer-driven-fixture-replay-2026-06-10`
Sequence Order: 25
Maintainer: AlembicWorkspace
Primary Window: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Build a consumer-driven verification loop that proves provider outputs satisfy
Dashboard and Plugin expectations, and proves which fields or compatibility
paths are no longer consumed.

## Completion Definition

- Provider fixtures are grouped by consumer scenario, not only by route name.
- Dashboard adapter tests replay accepted provider fixtures.
- Plugin resident/client tests replay provider health/runtime/search/job
  fixtures where Plugin consumes those surfaces.
- Agent branch fixtures are replayed through Alembic provider consumers where
  applicable.
- Fixture failures classify whether producer, consumer, or contract registry is
  wrong.
- The replay output becomes D29 deletion evidence and D30 drift-gate input.

## Work Items

- Identify current fixture formats and gaps from D19-D23 evidence.
- Create or extend a replay command for provider-to-consumer contract samples.
- Add focused consumer expectations for high-value routes and MCP tools.
- Record raw command output and failure classification.

## Real Code Evidence Requirements

- Anchor replay to provider fixtures, Dashboard normalizers, Plugin client/MCP
  consumers, and Agent branch fixtures; do not test only route names.
- Each fixture must name consumer scenario, producer contract, expected fields,
  ignored diagnostic fields, sensitive fields that must be absent, and failure
  classification.
- Replay failures must say whether the provider schema, Dashboard adapter,
  Plugin MCP projection, Agent fixture, or registry row is wrong.
- D29 deletion candidates are invalid unless D24 replay or import scans prove
  the old field/alias/path is not consumed.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d24-consumer-driven-fixture-replay-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d24-consumer-driven-fixture-replay-t1` |
| Target summary | Coordinate provider/consumer fixture replay packages and consolidate contract-test evidence. |

## Boundaries

- Do not replace product tests with documentation.
- Do not infer "unused" without replay/import evidence.
- Do not require Test window unless real runtime/UI observation is needed.
