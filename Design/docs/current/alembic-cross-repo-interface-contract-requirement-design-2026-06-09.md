# Alembic Cross-Repository Interface Contract Requirement Design

Date: 2026-06-09
Status: ready-for-workspace
Owner Window: Design
Receiving Window: Wakeflow
Design Key: alembic-cross-repo-interface-contract-2026-06-09

## Problem

Alembic now has five active source repositories with legitimate but overlapping
interface responsibilities. The current system already has real contracts:
Core package exports, Alembic daemon/HTTP/SSE/Socket routes, Plugin MCP and
resident-service clients, Agent tool/runtime contracts, and Dashboard API/view
models. The risk is not lack of functionality; the risk is unclear ownership,
duplicated schemas, stale frontend normalization, implementation-detail leakage,
and contract drift across repositories.

## Goal

Establish a clean, real, verifiable cross-repository interface contract design
for `AlembicCore`, `Alembic`, `AlembicPlugin`, `AlembicAgent`, and
`AlembicDashboard`, then prepare a controller-ready landing plan that can be
implemented in ordered phases.

## Non-Goals

- Do not turn repositories into thin empty wrappers.
- Do not downgrade, remove, hide, or defer existing user-visible capability in
  the name of interface cleanup.
- Do not accept a thin minimal loop, MVP shell, placeholder adapter, narrow
  demo path, or "minimum implementation" as completion for this optimization.
- Do not move Codex MCP, Dashboard UI, AI provider runtime, CLI/daemon,
  tool execution, or platform capabilities into Core.
- Do not invent new contracts without real producers and consumers.
- Do not accept static mock data, docs-only advice, unused schemas, or
  unconnected adapters as completion.
- Do not use Dashboard frontend types as backend source-of-truth.
- Do not preserve duplicate legacy contracts without a consumer and cleanup
  trigger.

## Primary Actors

- Host/user running Alembic through CLI, daemon, Dashboard, or Codex Plugin.
- Controller reviewing cross-repository responsibilities and dispatch order.
- Product repository windows implementing their owned contracts.
- Test window only if real runtime/Dashboard/daemon scenarios need independent
  verification after product self-checks.

## Local Code Facts

- Core contract surfaces:
  - `AlembicCore/package.json` exports `@alembic/core` subpaths such as
    `./daemon`, `./workspace`, `./host-agent-workflows`, `./project-intelligence`,
    `./guard`, `./repositories`, and domain/service paths.
  - `AlembicCore/src/daemon/RuntimeContracts.ts` defines daemon health,
    runtime capabilities, job endpoints, Dashboard URL, file monitor, API AI,
    project scope, and runtime identity contracts.
  - `AlembicCore/src/daemon/ProjectRuntimeContracts.ts` defines runtime control
    state, readiness, failure envelopes, and project runtime summaries.
- Alembic main surfaces:
  - `Alembic/package.json` consumes `@alembic/core` and `@alembic/agent`.
  - `Alembic/lib/http/api-spec.ts` already contains an OpenAPI 3.0 spec seed.
  - `Alembic/lib/http/routes/daemon.ts` builds health/runtime boundary data from
    Core contracts and exposes daemon capabilities.
  - `Alembic/lib/http/routes/jobs.ts` exposes job list/events/snapshot/artifacts
    and job lifecycle routes.
  - `Alembic/lib/http/utils/sse.ts` and `Alembic/lib/http/utils/sse-sessions.ts`
    show existing SSE infrastructure.
- Plugin surfaces:
  - `AlembicPlugin/package.json` consumes `@alembic/core` and owns Codex plugin
    runtime, MCP, skills, channel, and release scripts.
  - `AlembicPlugin/lib/codex/mcp/output-contract.ts` defines clean MCP response
    base, projector registration, structured MCP results, and fail-closed
    missing-projector behavior.
  - `AlembicPlugin/lib/codex/mcp/codex-local-tools/output.ts` defines Codex local
    tool output allowlists and diagnostic-field boundaries.
  - `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts` consumes
    resident service health/search/project runtime contracts.
- Agent surfaces:
  - `AlembicAgent/package.json` exports `@alembic/agent` subpaths for agent,
    service, runtime, prompts, domain, forge, tasks, profiles, AI, tools,
    memory, and context.
  - `AlembicAgent/src/tools/core/ToolContracts.ts` defines tool call, execution,
    preview, adapter, router, and result-envelope boundaries.
- Dashboard surfaces:
  - `AlembicDashboard/package.json` is React/Vite and has contract tests.
  - `AlembicDashboard/src/api.ts` manually normalizes API responses and consumes
    `/api/v1`, SSE, EventSource, and Socket.io flows.
  - `AlembicDashboard/src/types.ts` defines frontend runtime, project scope,
    capability, and view-model types that currently mirror backend contracts.

## Industry Best-Practice Mapping

| Practice | Source | Alembic Mapping |
| --- | --- | --- |
| APIs require clear semantics and explicit compatibility expectations to avoid breaking consumers. | Microsoft API design guidance. | Alembic `/api/v1`, Plugin MCP, Agent tool, and Core package contracts need clear schema owners and current-consumer compatibility rules. Version/evolution strategy is deferred for this demand. |
| Services should communicate through APIs that model the domain, not implementation details. | Microsoft microservices architecture guidance. | Runtime health, job, project scope, search, and Dashboard contracts must not leak internal stores or raw handler objects. |
| Boundaries should start from bounded contexts; cross-context mediation or anti-corruption layers are valid when schemas differ. | Microsoft boundary guidance. | Plugin resident-service client and Dashboard view models should be adapter layers, not second sources of truth. |
| OpenAPI describes endpoints, requests, responses, schemas, and reusable components. | OpenAPI docs. | Alembic HTTP routes need generated or checked OpenAPI coverage from route/Zod schemas. |
| Event-driven APIs need first-class docs/specs from discovery to code generation. | AsyncAPI docs. | SSE, Socket.io, and job process events need an event manifest or typed registry. |
| Contract testing verifies integration messages against shared understanding; consumer-driven contracts focus only on data actually used by consumers. | Pact docs. | Dashboard, Plugin, Alembic, and Agent should each own consumer expectations and provider verification seams. |
| API property-level authorization and inventory management are explicit API security risks. | OWASP API Security Top 10 2023. | Contract cleanup must remove over-broad fields, document exposed endpoints, and avoid property-level data leakage. |
| Observability needs logs, metrics, traces, and common semantic names across a codebase. | OpenTelemetry docs. | Cross-repo contract events should carry stable operation names, correlation ids, contract ids, and failure reasons. |

## Proposed Behavior

### D0-D7 Global User Decisions

The user confirmed the following decisions for all independent demands D0-D7 on
2026-06-09:

- Version and long-term evolution strategy are deferred. D0-D7 must not design
  `version`, `deprecatedSince`, `removeAfter`, breaking-change policy, or
  migration-window strategy.
- Functional completeness is the primary constraint. If interface cleanup would
  remove, hide, defer, or downgrade existing behavior, stop and report instead
  of implementing a reduced shape.
- Deletion is allowed only when usage/import scans show no real consumer, a
  replacement path exists where needed, and representative validation passes.
- Old bad fields and old compatibility paths are not preserved by default. Keep
  only compatibility with a real current consumer, a named
  `currentCompatibilityOwner`, validation evidence, and cleanup blocker.
- Consumers must not guess provider capabilities. Use explicit capability
  sources such as daemon health/capabilities, tools/list/catalog, Agent
  manifest, package export map, provider fixtures, or equivalent repo-owned
  evidence.
- Field exposure is a hard rule. Normal outputs may include only `public` and
  `consumer-needed` fields. `diagnostic` fields appear only in diagnostic
  contexts; `internal`, `sensitive`, and unrelated `derived` fields must not
  leak into ordinary API/MCP/Agent/Dashboard outputs.
- Large logs, reports, snapshots, long diagnostics, and replay payloads must use
  compact summaries plus `detailRef` or `artifactRef`; they must not be embedded
  in normal responses.
- Test is not a default phase for D0-D6. Product windows self-verify first; Test
  is used only if D7 still needs independent real runtime observation.
- Total control may proceed unattended through D0-D7 in order. It stops only
  for scope expansion beyond the confirmed five repositories, user-visible
  deletion/downgrade, version/evolution design need, inability to prove
  functionality preservation, security/sensitive-field ambiguity, repository
  boundary conflict, or missing acceptance evidence.
- Product repository commits and evidence belong to their owning product
  windows. Root/Design/ledger documentation and final acceptance belong to the
  controller.

### Functional Completeness Rules

This work is an optimization and contract-cleanup program, not a feature
reduction program. Every implementation demand must preserve the complete
existing capability surface unless the user explicitly approves a removal or
downgrade.

- Each changed interface must list the existing functional behaviors it
  preserves, including success, failure, degraded, blocked, empty, partial,
  cancellation, unavailable, and permission paths where the source supports
  them.
- A contract-only change is acceptable only when it names a real consumer, the
  next consumption step, and the validation that proves the consumer path still
  works.
- Replacing a broad or messy interface with a clean one must prove that all
  meaningful existing behavior is still reachable through the new contract.
- Removing a field, endpoint, event, adapter, or compatibility path requires
  import/usage scan evidence, a replacement path, and representative
  validation. If any real consumer still uses it, keep it or route an explicit
  user/controller decision.
- Acceptance must reject empty APIs, static mocks, narrow golden paths, or
  tests that cover only the easiest success case.

### Deferred For This Demand

Version and long-term evolution strategy are intentionally out of scope for the
current optimization pass. Do not require `version`, `deprecatedSince`,
`removeAfter`, breaking-change policy, or migration-window design in D0/D1.
The current demand may still record current active consumers, compatibility
owners, and cleanup blockers when they are needed to preserve existing
functionality.

### Contract Source-Of-Truth Layers

| Contract Layer | Producer | Consumers | Source Of Truth | Validation |
| --- | --- | --- | --- | --- |
| Core package exports | AlembicCore | Alembic, Plugin, Agent | `package.json` exports + `src/**/index.ts` + boundary tests | Core build/check, package export tests, consumer import-boundary lint |
| Runtime/project/job DTOs | AlembicCore | Alembic, Plugin, Dashboard | Core `daemon` contracts and validators | Core tests plus provider/consumer runtime contract tests |
| HTTP REST `/api/v1` | Alembic | Dashboard, Plugin diagnostics, users | Route schemas + OpenAPI spec generated/checked from source | OpenAPI lint/diff, route tests, Dashboard consumer tests |
| SSE/Socket/job events | Alembic | Dashboard, Plugin diagnostics | AsyncAPI-style event manifest or typed event registry | Event fixture tests, replay tests, Dashboard event consumer tests |
| MCP tools | AlembicPlugin | Codex host agents | MCP input schemas + per-tool output schemas/projectors | MCP contract tests, smoke:codex-plugin, missing-projector fail-closed tests |
| Agent tools/runtime | AlembicAgent | Alembic runtime, future hosts | Tool manifests + `ToolResultEnvelope` + adapter contracts | Agent tool/router tests, host adapter tests, mock-provider tests |
| Dashboard API/view models | AlembicDashboard | Users | Generated/checked API client + explicit view-model adapters | Dashboard contract tests, typecheck/build, browser checks when UI changes |

### Functional Classification And Handling Rules

The unified design must classify contracts by function type before choosing a
handling rule. Do not force all functions into one generic response envelope.

| Function Class | Typical Surfaces | Contract Source | Handling Rule | Validation |
| --- | --- | --- | --- | --- |
| `package-export` | `@alembic/core/*`, `@alembic/agent/*` | Producer `package.json` exports and public index files | Stable public subpaths only; consumers must not import producer internals. | Package export tests, import-boundary lint, producer build/check, consumer compile checks. |
| `rest-query` | Read-only `/api/v1` routes, search, health, project/runtime snapshots | Alembic route schemas plus OpenAPI or equivalent checked spec | Response fields must be explicit, minimal, schema-bound, and safe for the named consumers. | OpenAPI/schema diff, route tests, consumer fixture tests. |
| `rest-command` | Mutation/control routes, job lifecycle commands, runtime-control actions | Alembic route schemas plus command result/problem contracts | Separate command request, accepted state change, conflict, unavailable, and problem details. | Route tests, RFC 9457-style error checks, state-change assertions. |
| `event-stream` | SSE, Socket.io, progress/job events, runtime notifications | AsyncAPI-style event manifest or typed event registry | Event metadata and payload are separate; include event type, source, schema id, correlation id, and compact payload. | Event fixture validation, replay tests, consumer event tests. |
| `job-artifact` | Job snapshots, logs, reports, artifacts, process summaries | Alembic job/artifact DTOs and manifest rows | Large artifacts are referenced, not embedded; summaries stay compact and inspectable. | Artifact manifest tests, route tests, fixture size/shape checks. |
| `mcp-tool` | Plugin public tools and Codex-facing MCP outputs | Tool input schema plus per-tool output schema/projector | Each tool returns only its own allowed fields; no global diagnostic or refs bag unless the tool owns those fields. | MCP schema/projector tests, missing-projector fail-closed test, tool-specific golden fixtures. |
| `agent-tool` | Agent tool call, router, execution, result envelope | Agent tool manifests and result-envelope contracts | Cover success, failure, cancellation, timeout, permission denial, partial result, and provider failure paths. | Tool/router tests, mock-provider tests, result branch fixtures. |
| `dashboard-view-model` | Dashboard API client, normalization, panels, UI state models | Dashboard view-model adapters backed by provider fixtures | Frontend shapes are presentation contracts only; they cannot become backend truth. | Dashboard contract tests, provider fixture replay, typecheck/build, browser checks if visible behavior changes. |
| `diagnostic-observability` | Runtime diagnostics, traces/log fields, failure reason metadata | Producer diagnostic contract plus OpenTelemetry-style naming | Diagnostic fields use stable names and classify source, operation, contract id, correlation id, and failure reason. | Snapshot tests, log/event assertion, no sensitive implementation detail exposure. |

### Real Landing Supplements

D0 and D1 must add the following practical dimensions to the inventory and
registry. These are current-state execution controls, not version/evolution
strategy.

| Dimension | Purpose | Required Landing Detail |
| --- | --- | --- |
| `capabilityCoverage` | Prove optimization preserves complete behavior. | List preserved success, empty, partial, degraded, blocked, unavailable, permission, timeout, cancellation, and failure paths supported by the current surface. |
| `capabilityDiscovery` | Stop consumers from guessing what a provider supports. | Identify the provider capability source: daemon health/capabilities route, MCP tools/list/catalog, Agent manifest, Dashboard provider fixture, or package export map. Include `available`, `degraded`, `unavailable`, or `blocked` support status where the source already exposes it. |
| `errorKind` | Make failure behavior consistent without one giant envelope. | Map each surface to allowed error kinds: `invalid_input`, `unavailable`, `capability_mismatch`, `permission_denied`, `timeout`, `cancelled`, `partial`, `conflict`, `not_found`, and `internal_error`. |
| `exposureClass` | Prevent tools/routes from returning unnecessary data. | Classify each field as `public`, `consumer-needed`, `diagnostic`, `internal`, `sensitive`, or `derived`; only `public` and `consumer-needed` fields may appear in normal tool/API outputs. |
| `artifactPolicy` | Keep large data out of normal responses. | Inline compact summaries; return `detailRef` or `artifactRef` for logs, reports, snapshots, large diagnostics, and replay payloads. |
| `fixturePolicy` | Make provider/consumer checks real. | Provider owns canonical fixtures; consumers replay only the fixtures they use; fixtures cover representative success and non-success paths. |
| `driftGate` | Detect schema/implementation drift before acceptance. | Define the check that compares route implementation to OpenAPI/schema, event emitter to registry, MCP tool to projector, Agent branch to result fixtures, and Dashboard consumer to provider fixture. |
| `currentCompatibilityOwner` | Keep only compatibility that has a real active consumer. | Record current consumer, reason, validation path, and cleanup blocker. Do not design long-term deprecation or version migration in this demand. |
| `observabilityKeys` | Make cross-repo debugging consistent. | Use stable `operationName`, `contractId`, `correlationId`, `source`, and `failureReason` fields where diagnostics exist. |

### External Practices To Apply

- Use bounded-context thinking for ownership. Microsoft DDD guidance emphasizes
  modeling independent problem areas as bounded contexts and preserving
  cohesion inside a context.
- Use explicit API semantics for cross-repo calls. Microsoft API design
  guidance also discusses versioning, but version/evolution design is deferred
  for this demand.
- Use OpenAPI-style structure for REST contracts: endpoints, responses,
  schemas, request bodies, reusable components, and security metadata.
- Use AsyncAPI-style structure for message-driven APIs, with channels,
  operations, messages, headers, payload schemas, examples, and correlation ids.
- Use CloudEvents-style event metadata where useful: event type, source, id,
  schema identity, time, content type, and data are separate concerns.
- Use Pact-style consumer-driven contract tests where consumers need only a
  minimal subset of provider data.
- Use RFC 9457-style problem details for HTTP API errors instead of ad hoc
  error response shapes.
- Use OWASP API Security guidance to treat property-level exposure and API
  inventory as first-class contract concerns.
- Use OpenTelemetry semantic-convention discipline for common diagnostic names
  across traces, logs, metrics, and runtime reports.

### Responsibility Rules

- Core owns stable deterministic data contracts only when at least two real
  consumers need the same shape, or the shape is a runtime identity/job/project
  primitive already owned by Core.
- Alembic owns network/API/event production, daemon lifecycle, runtime
  orchestration, and Agent runtime consumption.
- Plugin owns Codex-facing translation: MCP schemas, MCP output, skill/channel,
  host-project alignment display, and resident-service consumption.
- Agent owns non-deterministic AI/tool execution contracts and provider adapters.
- Dashboard owns presentation contracts only: typed client, normalization at the
  view-model edge, loading/empty/error/partial/long-running states.
- Any shared contract must name producer, consumers, transport, schema source,
  compatibility owner when present, validation command, and removal blocker.

## Option Planning

### Option 1: Central Shared Contract Package For Everything

- Summary: Move all HTTP, MCP, Agent, Dashboard, and runtime shapes into Core.
- Fit: Rejected. It violates repository stop cards by moving host/UI/MCP/AI
  responsibilities into Core and would create a giant coupling point.

### Option 2: Repository-Owned Contracts With A Cross-Repo Contract Registry

- Summary: Keep each contract near its producer, but add a controller-visible
  registry that records producer, consumers, transport, schema source,
  validation, exposure, error, fixture, artifact, drift, and current
  compatibility rules.
- Fit: Recommended. It preserves repository ownership while making boundaries
  auditable and testable.

### Option 3: Consumer-Generated Contracts Only

- Summary: Let Dashboard/Plugin/Agent define the fields they consume and verify
  providers with consumer tests.
- Fit: Partially useful but insufficient alone. It helps prevent over-returned
  data, but without producer-owned schema source it can drift into many local
  truths.

### Option 4: Documentation-Only Boundary Cleanup

- Summary: Write architecture docs and ask future tasks to follow them.
- Fit: Rejected. The user asked for real landing; docs without tests and code
  seams will not prevent drift.

Recommended route: Option 2 plus consumer-driven tests from Option 3 where
interfaces are externally consumed.

## Stage Candidates

Stages are candidates for Wakeflow review. They are not task packages yet.

| Stage | Goal | Primary Owner | Producer / Consumer Order | Completion Signal |
| --- | --- | --- | --- | --- |
| P0 | Cross-repo contract inventory | AlembicWorkspace + Design/AlembicPlugin/AlembicCore read-only evidence | Read all five repos before implementation. | Contract table covers package, HTTP, events, MCP, Agent tools, Dashboard client. |
| P1 | Contract registry and ADR candidate | AlembicWorkspace / Design, then controller | Uses P0 evidence. | Registry schema, ADR decision, and validation matrix are ready for dispatch. |
| P2 | Core contract cleanup | AlembicCore | Core producer before consumers. | Stable exports/validators for shared deterministic contracts; boundary tests pass. |
| P3 | Alembic HTTP/event contracts | Alembic | Alembic provider before Dashboard/Plugin consumer updates. | OpenAPI and event manifest/typed registry cover `/api/v1`, SSE, Socket, jobs. |
| P4 | Plugin contract alignment | AlembicPlugin | Consumes Core/Alembic provider contracts. | MCP/resident-service/Codex adapter contracts pass focused tests and plugin smoke. |
| P5 | Agent contract alignment | AlembicAgent | Consumes Core; Alembic consumes Agent. | Tool/runtime/result/provider contracts pass Agent check and Alembic integration seam. |
| P6 | Dashboard contract alignment | AlembicDashboard | Consumes Alembic provider schemas/events. | Generated or checked typed client, explicit view models, contract tests, build pass. |
| P7 | Cross-repo acceptance | AlembicWorkspace, product windows, optional Test | After P2-P6 evidence. | Contract drift tests, import-boundary lint, build/check matrix, and real runtime smoke pass. |

## Testing Decisions

- Controller self-verification:
  - Review P0 inventory and compare it to local `package.json` exports,
    route files, MCP tool registry, Agent exports, and Dashboard API client.
  - Reject any phase that creates unused schemas or empty adapters.
- Product repository verification:
  - AlembicCore: `npm run check`, package export tests, consumer import-boundary
    lint scripts where applicable.
  - Alembic: `npm run check`, HTTP route tests, OpenAPI spec generation/check,
    event registry tests, daemon health/job smoke.
  - AlembicPlugin: `npm run build:check`, `npm run lint:repo-boundary`,
    MCP contract tests, `npm run smoke:codex-plugin` where scope requires.
  - AlembicAgent: `npm run check`, public API boundary lint, tool/router/result
    envelope tests, mock provider tests.
  - AlembicDashboard: `npm run check`, dashboard contract tests, typecheck/build,
    browser/screenshot checks only when UI behavior changes.
- Cross-repo contract tests:
  - Dashboard consumer expectations replayed against Alembic provider fixtures.
  - Plugin resident-service client expectations replayed against Alembic daemon
    health/search/job fixtures.
  - Alembic consumer expectations for Core/Agent package exports.
  - Agent consumer expectations for Core deterministic contracts.

## Acceptance Criteria

- Full existing functionality is preserved or explicitly user-approved for
  removal; no demand may complete by shrinking scope to a thin minimum path.
- Every cross-repo interface has exactly one owning producer and at least one
  named real consumer.
- Every shared contract has schema source, validation command, exposure rule,
  fixture rule, artifact rule, drift check, and removal blocker.
- REST and event contracts are machine-checkable, not only prose.
- Dashboard types are either generated/checked from provider contracts or are
  explicit view-model adapters that cannot be mistaken for backend truth.
- Plugin MCP and resident-service outputs cannot leak unrelated fields or raw
  provider objects.
- Agent tool contracts cover success, failure, cancellation, timeout,
  permission denial, and partial result paths.
- Import-boundary scanners prevent consumers from bypassing package exports or
  reaching into another repo's internal source.
- Old duplicate interfaces are deleted only after import scans, replacement
  entrypoints, and representative build/check/lint/smoke pass.
- Final evidence covers representative full behavior, not only a minimal happy
  path.

## Risks And Open Questions

- Risk: A central contract package could become a new monolith. Mitigation:
  keep producer-owned contracts and registry metadata instead of moving all
  contracts to Core.
- Risk: Dashboard manual normalization may preserve stale backend shapes.
  Mitigation: generated/checked typed client or provider-fixture tests.
- Risk: OpenAPI/event specs may drift if hand-authored. Mitigation: generate or
  verify from route schemas and event registry.
- Risk: Consumer-driven tests may only cover current consumers. Mitigation: keep
  provider schema checks plus consumer examples.
- Open controller decision: whether to record the cross-repo contract registry
  under workspace ledger first, or start with repo-local contract files and
  project them into the ledger during acceptance.

## Controller Intake Notes

- Ready for controller intake: yes.
- Needs task-package planning before implementation: yes.
- Recommended first package: P0 cross-repo contract inventory and boundary map.
- Do not dispatch direct implementation until P0 inventory and P1 registry/ADR
  format are reviewed.
- Test handoff: not by default; use Test only for real daemon/Dashboard/runtime
  smoke after product self-checks are available.

## Source References

- State root: `.wakeflow-active/current/alembic-cross-repo-interface-contract/`
- Industry references:
  - Microsoft API design: `https://learn.microsoft.com/en-us/azure/architecture/microservices/design/api-design`
  - Microsoft DDD microservice guidance: `https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice`
  - OpenAPI documentation: `https://learn.openapis.org/specification/`
  - AsyncAPI 3.0 specification: `https://www.asyncapi.com/docs/reference/specification/v3.0.0`
  - CloudEvents project: `https://www.cncf.io/projects/cloudevents/`
  - Pact contract testing: `https://docs.pact.io/getting_started/how_pact_works`
  - RFC 9457 Problem Details: `https://www.rfc-editor.org/rfc/rfc9457.html`
  - OWASP API Security Top 10 2023: `https://owasp.org/API-Security/editions/2023/en/0x00-header/`
  - OpenTelemetry semantic conventions: `https://opentelemetry.io/docs/concepts/semantic-conventions/`
- Local code refs:
  - `AlembicCore/package.json`
  - `AlembicCore/src/daemon/RuntimeContracts.ts`
  - `AlembicCore/src/daemon/ProjectRuntimeContracts.ts`
  - `Alembic/package.json`
  - `Alembic/lib/http/api-spec.ts`
  - `Alembic/lib/http/routes/daemon.ts`
  - `Alembic/lib/http/routes/jobs.ts`
  - `Alembic/lib/http/utils/sse.ts`
  - `AlembicPlugin/package.json`
  - `AlembicPlugin/lib/codex/mcp/output-contract.ts`
  - `AlembicPlugin/lib/codex/mcp/codex-local-tools/output.ts`
  - `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts`
  - `AlembicAgent/package.json`
  - `AlembicAgent/src/tools/core/ToolContracts.ts`
  - `AlembicDashboard/package.json`
  - `AlembicDashboard/src/api.ts`
  - `AlembicDashboard/src/types.ts`
- Industry refs:
  - `https://learn.microsoft.com/en-us/azure/architecture/microservices/design/api-design`
  - `https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices`
  - `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/microservice-boundaries`
  - `https://learn.openapis.org/specification/`
  - `https://www.asyncapi.com/docs`
  - `https://docs.pact.io/`
  - `https://owasp.org/API-Security/editions/2023/en/0x11-t10/`
  - `https://opentelemetry.io/docs/concepts/observability-primer/`
  - `https://opentelemetry.io/docs/concepts/semantic-conventions/`
