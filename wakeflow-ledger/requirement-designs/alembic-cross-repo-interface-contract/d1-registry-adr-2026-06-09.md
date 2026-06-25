# Contract Registry And Source-Of-Truth ADR Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d1-registry-adr-2026-06-09`
Sequence Order: 2
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Turn accepted D0 inventory into a controller-visible contract registry and
source-of-truth decision record for the five repositories.

## Completion Definition

- A registry schema and initial registry rows exist for every D0 contract.
- The ADR records the source-of-truth model: producer-owned executable
  contracts plus controller-visible registry.
- Every row names producer, consumers, transport, schema source, validation
  command, removal blocker, observability names, and security/property exposure
  notes.
- Every row maps its `functionClass` to a handling rule and validation family.
- Every row records preserved capability coverage, including non-happy-path
  behavior where the existing surface supports it.
- Every row records capability discovery, error kinds, exposure classes,
  artifact policy, fixture policy, drift gate, current compatibility owner, and
  observability keys where applicable.
- Versioning, deprecation windows, remove-after dates, breaking-change policy,
  and long-term evolution strategy are not part of this demand.
- Core is not assigned Codex MCP, Dashboard UI state, AI provider, daemon, or
  tool execution ownership.

## Classification Handling Matrix

| Function Class | Handling Rule | Validation Family |
| --- | --- | --- |
| `package-export` | Producer owns public exports; consumers use only public package subpaths. | Package export tests, import-boundary lint, build/check. |
| `rest-query` | Provider owns explicit minimal response schemas and current consumer safety. | OpenAPI/schema diff, route tests, consumer fixture tests. |
| `rest-command` | Provider separates command input, state change, conflict, unavailable, and problem response. | Route tests, state assertions, RFC 9457-style problem tests. |
| `event-stream` | Provider owns event registry with metadata and payload schemas separated. | Event fixture validation, replay tests, consumer event tests. |
| `job-artifact` | Provider references large artifacts and keeps summaries compact. | Artifact manifest tests, route tests, size/shape checks. |
| `mcp-tool` | Plugin owns per-tool input/output schema and projector; no generic field bag. | MCP schema/projector tests, missing-projector fail-closed tests, golden fixtures. |
| `agent-tool` | Agent owns tool manifest and result envelope with all result branches. | Tool/router tests, provider mock tests, result branch fixtures. |
| `dashboard-view-model` | Dashboard owns presentation adapter only; provider fixtures remain backend truth. | Dashboard contract tests, provider fixture replay, typecheck/build. |
| `diagnostic-observability` | Producer owns stable diagnostic names, operation names, contract ids, and correlation ids. | Snapshot/log/event assertions and sensitive-field checks. |

## Registry Landing Fields

| Field | Purpose |
| --- | --- |
| `capabilityCoverage` | Preserved behavior matrix for the interface. |
| `capabilityDiscovery` | Provider source that tells consumers whether the capability is available, degraded, unavailable, or blocked. |
| `errorKinds` | Allowed failure categories for this surface. |
| `exposureClasses` | Field-level exposure classification to prevent over-returned data. |
| `artifactPolicy` | Inline summary versus `detailRef` / `artifactRef` policy. |
| `fixturePolicy` | Provider fixture ownership and consumer replay path. |
| `driftGate` | Automated or reviewable check that catches contract drift. |
| `currentCompatibilityOwner` | Current active consumer and blocker for any compatibility surface that remains. |
| `observabilityKeys` | Stable operation name, contract id, correlation id, source, and failure reason fields. |

No `version`, `deprecatedSince`, `removeAfter`, or long-term migration-window
field is required in this pass.

## External Practice Inputs

- Microsoft API design for explicit API semantics. Versioning guidance is noted
  but deferred for this demand.
- Microsoft DDD bounded-context guidance for ownership boundaries.
- OpenAPI for REST endpoint, response, schema, request body, component, and
  security structure.
- AsyncAPI and CloudEvents for event contracts and event metadata separation.
- Pact for consumer-driven minimal expected responses/messages plus provider
  verification.
- RFC 9457 for machine-readable HTTP problem details.
- OWASP API Security 2023 for property-level exposure and API inventory.
- OpenTelemetry semantic conventions for common diagnostic naming.

## Stage Plan

1. Review accepted D0 inventory and classify contract layers by
   `functionClass`.
2. Define registry fields, handling-rule fields, landing fields, and file
   placement.
3. Create initial registry rows from D0.
4. Write ADR for source-of-truth, classification, and drift-check policy.
5. Link each future demand to the registry rows and function classes it owns.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d1-registry-adr-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d1-registry-adr-t1` |
| Target summary | Build the registry and ADR from D0, preserving producer ownership and avoiding a central Core monolith. |

## Boundaries And Non-Goals

- Do not move all contracts into Core for tidiness.
- Do not create registry rows without validation paths.
- Do not approve a source-of-truth decision that reduces existing behavior to a
  thin minimum path.
- Do not dispatch downstream implementation until this demand is accepted.
