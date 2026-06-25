# Capability Discovery And Operation Inventory Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d26-capability-discovery-operation-inventory-2026-06-10`
Sequence Order: 27
Maintainer: AlembicWorkspace
Primary Window: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Make capability discovery and operation inventory explicit across daemon,
provider routes, Plugin MCP tools, Agent runtime features, and Dashboard
consumers so callers stop probing by incidental fields.

## Completion Definition

- Every externally consumed operation has an owner, capability key, route/tool
  name, command/query classification, required service, state effect, and
  unavailable reason.
- Dashboard and Plugin consumers read capability availability from explicit
  capability blocks instead of broad fallback heuristics.
- Provider and MCP surfaces report capability mismatch distinctly from runtime
  unavailable or not found.
- Operation inventory matches Core contract rows, provider route contracts,
  MCP tool list, Dashboard consumer surfaces, and Agent capability manifests.

## Work Items

- Build an operation inventory from D15-D25 evidence.
- Align capability keys and unavailable reasons across products.
- Add validation for missing capability coverage and stale route/tool entries.
- Remove capability aliases only after consumer proof.

## Real Code Evidence Requirements

- Anchor to Core contract rows, provider route contracts, daemon health
  capability blocks, Plugin `tools/list` and status output, Agent capability
  manifests, and Dashboard capability normalizers.
- Inventory each operation as query, command, diagnostic, artifact, event, MCP
  tool, or provider-adapter operation.
- For each operation record owner, required service, state effect, unavailable
  reason, consumer, output schema, failure classes, and scenario validation.
- Callers must not infer capability from incidental fields such as presence of
  a URL, fallback object, broad runtime boundary, or Dashboard presentation
  state.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d26-capability-discovery-operation-inventory-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d26-capability-discovery-operation-inventory-t1` |
| Target summary | Build and enforce explicit capability and operation inventory across repos. |

## Boundaries

- Do not create a second source of truth separate from Core/provider/MCP
  contracts.
- Do not remove degraded/unavailable states from capability reporting.
- Do not infer availability from Dashboard presentation state.
