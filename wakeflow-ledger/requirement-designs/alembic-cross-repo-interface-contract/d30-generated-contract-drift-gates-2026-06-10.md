# Generated Contract Drift Gates Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d30-generated-contract-drift-gates-2026-06-10`
Sequence Order: 31
Maintainer: AlembicWorkspace
Primary Window: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Create continuous drift checks so Core rows, provider OpenAPI schemas, MCP
output schemas, Agent fixtures, Dashboard consumer adapters, and replay
fixtures cannot silently diverge after cleanup.

## Completion Definition

- A repeatable command or command set validates the cross-repo contract graph.
- Drift checks compare Core contract rows, provider route contracts, OpenAPI
  output, MCP `tools/list` output schemas, Agent branch fixtures, Dashboard
  adapter expectations, and consumer fixture replay outputs.
- Generated artifacts are either committed where owned or regenerated and
  compared in the owning repo's validation path.
- Drift failures identify the owner repo and the missing producer/consumer
  update.
- The check is suitable for controller self-validation and product-window
  validation evidence.

## Work Items

- Inventory existing validation commands from D0-D29.
- Add missing comparison checks in the correct owning repos.
- Avoid checking generated/vendor/plugin-cache outputs as source unless the
  owning repo requires them.
- Document exact command order and expected outputs.

## Real Code Evidence Requirements

- Drift gates must compare Core rows/taxonomy, provider contract/OpenAPI
  schemas, MCP `tools/list` output schemas, Plugin projectors, Agent branch
  fixtures, Dashboard adapter expectations, and D24 replay results.
- Checks must fail when a public response reintroduces accidental
  `additionalProperties`, `unknown`, `any`, string-only errors, broad runtime
  boundary payloads, or private fields without a typed extension policy.
- Generated artifacts are source only when the owning repo declares them source;
  otherwise regenerate and compare during validation.
- Failure output must identify the owner repo and whether the producer,
  consumer, fixture, taxonomy, or docs need repair.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d30-generated-contract-drift-gates-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d30-generated-contract-drift-gates-t1` |
| Target summary | Establish repeatable cross-repo drift checks for Core/provider/MCP/Agent/Dashboard contracts. |

## Boundaries

- Do not create brittle checks over ignored runtime files or user-local paths.
- Do not rely on docs-only checks where runtime/schema evidence is available.
- Do not make one repo validate another repo's private implementation details.
