# Full Cross-Repo Contract Inventory Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d0-inventory-2026-06-09`
Sequence Order: 1
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Create the complete evidence inventory for all cross-repository interfaces
across `AlembicCore`, `Alembic`, `AlembicPlugin`, `AlembicAgent`, and
`AlembicDashboard` before any implementation or cleanup.

## Completion Definition

- Every active cross-repo interface is inventoried with producer, consumer,
  function class, transport, schema source, validation seam, legacy duplicate
  status, preserved functional behaviors, removal rule, risk, and concrete
  repo-relative code references.
- Every row records current-state landing dimensions: capability coverage,
  capability discovery source, error kinds, exposure classes, artifact policy,
  fixture source, drift gate candidate, current compatibility owner, and
  observability keys where applicable.
- The inventory covers package exports/imports, Core runtime/job/project
  contracts, Alembic `/api/v1`, OpenAPI seed, SSE/Socket/job events, Plugin MCP
  tools/projectors/resident-service clients, Agent tool/runtime/provider
  contracts, and Dashboard API client/types/view models.
- Orphaned or duplicate interfaces are marked as cleanup candidates, not
  deleted.
- Inventory is evidence only; it is not implementation completion.
- Inventory must not propose feature reduction as cleanup. Any potential
  deletion or downgrade must be marked as requiring user/controller decision
  unless import scans prove there is no real consumer.

## Required Function Classes

Each inventory row must have exactly one primary `functionClass`:

| Function Class | Use For |
| --- | --- |
| `package-export` | Public package subpaths and import boundaries. |
| `rest-query` | Read-only HTTP routes and snapshots. |
| `rest-command` | Mutating HTTP routes, runtime control, and job commands. |
| `event-stream` | SSE, Socket.io, progress, and notification events. |
| `job-artifact` | Job reports, logs, snapshots, and artifact references. |
| `mcp-tool` | Plugin MCP tool inputs, outputs, and projectors. |
| `agent-tool` | Agent tool/runtime/provider/host-adapter contracts. |
| `dashboard-view-model` | Dashboard client, normalization, event consumers, and UI state adapters. |
| `diagnostic-observability` | Diagnostic fields, correlation ids, operation names, and failure reason metadata. |

Secondary tags are allowed only for routing. The primary class controls the
handling rule and validation family in D1.

## Required Landing Dimensions

| Field | Inventory Question |
| --- | --- |
| `capabilityCoverage` | Which existing success and non-success behaviors does this surface support today? |
| `capabilityDiscovery` | Where does a consumer discover whether the provider supports this surface: health/capabilities route, tools/list, manifest, export map, fixture, or static config? |
| `errorKinds` | Which current errors can this surface produce: invalid input, unavailable, capability mismatch, permission denied, timeout, cancelled, partial, conflict, not found, or internal error? |
| `exposureClasses` | Which fields are public, consumer-needed, diagnostic, internal, sensitive, or derived? |
| `artifactPolicy` | Which data remains inline, and which must become `detailRef` or `artifactRef`? |
| `fixtureSource` | Which provider fixtures or real samples can consumers replay? |
| `driftGate` | Which check can prove source, schema, projector, event emitter, fixture, or view model has not drifted? |
| `currentCompatibilityOwner` | If compatibility remains, which active consumer needs it and what evidence proves it? |
| `observabilityKeys` | Which operation name, contract id, correlation id, source, and failure reason fields already exist or are needed? |

Do not include version/evolution fields in this inventory pass.

## Stage Plan

1. Scan package exports/imports across all five repositories.
2. Scan Alembic HTTP routes, OpenAPI seed, SSE utilities, Socket/job event
   producers, and daemon/runtime DTO usage.
3. Scan Plugin MCP tool registry, clean output projectors, resident-service
   client, tool catalog, and host adapter surfaces.
4. Scan Agent public exports, tool contracts, runtime loop, provider adapters,
   and host adapter surfaces.
5. Scan Dashboard API client, frontend types, normalization, event consumers,
   and view-model adapters.
6. Produce a contract inventory table or JSON with `functionClass`, landing
   dimensions, explicit unknowns, and risks.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d0-inventory-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d0-inventory-t1` |
| Target summary | Read this demand, inspect all five repos read-only, and backfill the full contract inventory evidence. |

## Boundaries And Non-Goals

- Do not edit product source repositories.
- Do not dispatch implementation from this inventory.
- Do not classify a broad capability as removable merely because a thinner
  interface would be easier to implement.
- Do not accept missing event shapes as harmless; mark them as unknowns with a
  follow-up owner.
