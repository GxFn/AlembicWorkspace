# Post-D14 Interface Governance Real-Code Analysis

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Applies After: `alembic-interface-contract-d14-cross-repo-legacy-removal-acceptance-2026-06-10`
Document Role: D15+ landing-plan evidence and design basis
Maintainer: AlembicWorkspace
Date: 2026-06-10

## User Goal

D15 and later demands must not stop at an audit. The real goal is a full
post-D14 landing plan for Alembic cross-repository interface governance:
current-state sorting, responsibility split, interface reasonability review,
parameter/content audit, product rewrite where justified, compatibility
deletion where proven, and final cross-repo acceptance.

The phrase "current-state sorting, responsibility split, interface
reasonability, parameter content, and returned-data content" is one part of the
D15+ goal, not the whole goal.

## External Practice Baseline

Use these sources as design pressure, not as a replacement for local code facts.

| Source | Relevant Lesson For Alembic |
| --- | --- |
| [MCP tool specification](https://modelcontextprotocol.io/specification/draft/server/tools) | `structuredContent` should conform to a tool `outputSchema` when defined; output schemas help clients validate and parse tool results. Alembic MCP tools therefore need per-tool structured payload contracts, not a single loose global bag. |
| [RFC 9457 Problem Details](https://www.rfc-editor.org/info/rfc9457/) | HTTP errors should carry machine-readable problem details when status codes alone are insufficient. Alembic provider routes should not rely on string-only `error` fields for product-visible failure semantics. |
| [Google AIP-121](https://google.aip.dev/121) and [Google API Design Guide](https://docs.cloud.google.com/apis/design) | Model resources and relationships first, prefer standard methods, reserve custom commands for real actions, and keep resource schemas consistent across methods. Alembic should keep read/query routes, command routes, diagnostic routes, artifacts, and events distinct. |
| [Google General AIPs](https://google.aip.dev/general) | Partial responses, pagination, filtering, field masks, sensitive fields, standard fields, errors, and naming are separate API design concerns. D15+ should classify returned fields by consumer need and exposure, not by "available in backend object". |
| [Microsoft API design best practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design) | Pagination, filtering, field selection, and upper limits reduce payload size and protect services. Alembic list/search/result routes should declare the subset returned and the limits enforced. |
| [OWASP API3:2023](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/) | Avoid generic object serialization, cherry-pick returned properties, validate responses by schema, and keep returned data to functional need. This maps directly to removing broad API/MCP/Dashboard data bags after consumer proof. |
| [OpenAPI 3.2](https://spec.openapis.org/oas/v3.2.0.html) | An OpenAPI description describes API surface and semantics. Alembic's provider spec should be a semantic contract with operation ownership, request bodies, response bodies, examples, and errors, not just a route list. |
| [Pact contract testing](https://docs.pact.io/) | Consumer-driven contracts test messages that consumers actually send or receive. Alembic should use provider fixtures and Dashboard/Plugin consumer expectations to prove what can change or be deleted. |
| [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/) | Diagnostic and telemetry fields need common semantic names for correlation and consumption. Alembic diagnostics should use stable names rather than per-layer synonyms. |
| [JSON Schema object reference](https://json-schema.org/understanding-json-schema/reference/object) | `additionalProperties` controls extra fields; public contracts should close or explicitly type extension points. Alembic should not leave extra response properties accepted by accident. |

## Current Code Facts

These are not final defects by themselves. They are the concrete starting points
D15+ must classify and then either preserve, rewrite, or delete with evidence.

| Area | Current Evidence | Strength | D15+ Risk / Question |
| --- | --- | --- | --- |
| Core contract spine | `AlembicCore/src/shared/CoreContractSpine.ts` defines row ids, function classes, forbidden responsibilities, compatibility owners, exposure classes, drift gates, fixtures, and validation commands. | Good shared source-of-truth spine. | D15 must verify after D8-D14 whether every row still matches real callers and whether any row is acting as documentation only. |
| Core runtime contracts | `AlembicCore/src/daemon/ProjectRuntimeContracts.ts` defines project target identity, readiness states, failure reasons, required services, runtime summaries, and exactly-one `projectId`/`projectRoot` target shape. | Strong deterministic schema and state vocabulary. | D16/D17 must ensure provider/Dashboard/Plugin surfaces consume this shape without reintroducing aliases or string-only failures. |
| Alembic provider contract | `Alembic/lib/http/provider-contracts.ts` builds route, event, mount, fixture, and OpenAPI contract rows. | Provider routes are now visibly tied to registry rows and fixture scenarios. | `envelopeBase` and `objectSchema` still allow `additionalProperties: true`; several fixtures and routes still mix `{ success, data, error }`, string errors, and route-specific data bags. |
| Alembic runtime routes | `Alembic/lib/http/routes/projects.ts` separates query routes from command routes and validates project target identity through Core. | Read/action split is mostly clear, and `ProjectRuntimeTarget` is respected. | Action responses return the whole action result as `data` plus `error`; `waitMs` remains an alias for `waitUntilReadyMs`; failure shape is not yet a typed problem detail. |
| Alembic request schemas | `Alembic/lib/shared/schemas/http-requests.ts` has strong schemas in many places and still uses `.loose()`/`.passthrough()` for some legacy or dynamic bodies. | Existing Zod layer gives a natural normalization point. | D19 must distinguish dynamic internal operation payloads from externally accepted public fields; passthrough cannot remain the default public contract. |
| Plugin MCP output | `AlembicPlugin/lib/codex/mcp/output-contract.ts` defines clean base output, projector registry, structured tool result, and outputSchema attachment. | Correct architectural direction for MCP: per-tool projectors and structuredContent. | `CleanMcpResponseSchema` is base passthrough; this is acceptable only if every tool-specific schema closes the allowed tool payload. D21 must prevent unrelated tool fields from leaking. |
| Plugin public tools | `AlembicPlugin/lib/codex/mcp/public-tools/contract.ts` and `output.ts` define public tool names, intent sources, statuses, refs, reason codes, and tool-specific output schemas. | Good public/internal field mapping and legacy compatibility policy. | Several public outputs still use `UnknownRecordSchema`, `z.unknown()`, or broad local records. D21 must classify each as public contract, diagnostic-only, detailRef-only, or no-consumer legacy. |
| Agent result envelope | `AlembicAgent/src/tools/core/ToolResultEnvelope.ts` exposes status, structuredContent, artifacts, resources, cache, diagnostics, trust, and nextActionHint. | Rich result model preserves non-success branches and evidence. | It is intentionally complete but high-volume; D22 must define which fields are ordinary output, diagnostic-only, artifactRef/detailRef-only, provider-private, or host-private. |
| Agent interface contract | `AlembicAgent/src/agent/runtime/AgentInterfaceContract.ts` defines branches, forbidden ordinary output fields, legacy candidates, field dispositions, and consumer impact notes. | Good reference for not leaking raw provider/hidden reasoning/credentials/thread ids. | D22 must verify actual runtime outputs and provider adapters still obey the contract after D10/D14, not only that the manifest exists. |
| Dashboard API client | `AlembicDashboard/src/api.ts` says it uses V3 without field mapping, but the file has many `UnknownRecord`, `firstString`, fallback aliases, normalized diagnostics, host-managed parsing, SSE dynamic payloads, and broad helper records. | Dashboard protects UI from backend churn and preserves important diagnostic states. | D20 must separate necessary consumer adapters from obsolete compatibility. Do not delete fallbacks until provider fixtures and UI scenarios prove replacement. |
| Dashboard types | `AlembicDashboard/src/types.ts` still uses `any`, open string unions, `Record<string, unknown>`, and dynamic metadata for several surfaces. | Some openness is valid for provider metadata, user-visible diagnostics, and dynamic SSE/tool payloads. | D20/D17 must mark each open field as required dynamic payload, diagnostic extension, compatibility shim, or cleanup candidate. |

## Concrete Problem Map

This section turns the code scan into executable D15+ work. A row is not a
confirmed product defect until the owning demand checks the current consumer,
replacement path, and validation evidence. It is, however, a real code anchor
that later demands must address or explicitly mark `keep`.

| Problem ID | Code Anchor | Real Symptom | Why It Matters | Landing Demand |
| --- | --- | --- | --- | --- |
| P01 provider-schema-open-by-default | `Alembic/lib/http/provider-contracts.ts` | `envelopeBase`, `objectSchema`, and generated response schemas allow broad extra fields. | Public provider contracts can accidentally bless backend object spillover. JSON Schema supports closed or typed extension points; openness should be deliberate. | D17, D19, D20, D30 |
| P02 provider-failure-shape-mixed | `Alembic/lib/http/provider-contracts.ts`, `Alembic/lib/http/routes/projects.ts` | Fixtures and route helpers mix string `error`, object `error`, `{ success, data, error }`, and action result objects. | Dashboard/Plugin consumers must guess failure semantics; RFC 9457-style problem details and stable failure codes would make recovery machine-readable. | D16, D20, D25, D31 |
| P03 command-alias-and-whole-result-return | `Alembic/lib/http/routes/projects.ts` | Project control accepts `waitMs` alias and returns the whole action result as `data`. | Some compatibility may be valid, but command request aliases and whole-object returns need a current consumer and cleanup trigger. | D17, D20, D29 |
| P04 public-http-body-passthrough | `Alembic/lib/shared/schemas/http-requests.ts` | Knowledge, task dispatch, intent episode, decision register, AI/tool bodies use `.loose()`, `.passthrough()`, or `record(...unknown())` in multiple public-facing paths. | Some operation payloads are truly dynamic, but public inputs need caller responsibility, allowed extension policy, and sensitive-field handling. | D17, D19, D20, D28 |
| P05 mcp-global-passthrough | `AlembicPlugin/lib/codex/mcp/output-contract.ts` | The clean MCP base is strict, but `CleanMcpResponseSchema` is `.passthrough()`. | This is safe only when every tool-specific schema is the real closure point. MCP `structuredContent` must conform to its tool `outputSchema`. | D19, D22, D30 |
| P06 mcp-tool-unknown-payloads | `AlembicPlugin/lib/codex/mcp/public-tools/output.ts` | Public tool outputs still expose `UnknownRecordSchema`, `z.unknown()`, broad guard/decision/local records. | A tool can remain feature-complete without returning unrelated or tool-private values. Unknown payloads need typed projections or refs. | D17, D22, D27, D28 |
| P07 mcp-status-overweight-runtime-proof | Current `alembic_codex_status` runtime sample | A single status call returns daemon, project scope, runtime boundary, plugin cache, capabilities, paths, alignment, keep-live, and diagnostics in one payload. | This is useful for diagnostics, but too heavy for ordinary MCP result shape. It proves the optimization target is real, not theoretical. | D22, D26, D27, D28, D31 |
| P08 agent-rich-envelope-needs-projection | `AlembicAgent/src/tools/core/ToolResultEnvelope.ts` | Tool results carry status, text, structured content, artifacts, resources, cache, diagnostics, trust, next action hints, and nested tool-call data. | Full evidence is valuable; ordinary public results should project only scenario-needed data and route large/private diagnostics elsewhere. | D23, D27, D28 |
| P09 agent-private-fields-already-known | `AlembicAgent/src/agent/runtime/AgentInterfaceContract.ts` | Contract already forbids ordinary output fields such as raw provider payloads, hidden reasoning, credentials, and thread ids. | D23/D28 must verify actual runtime serialization, not merely preserve the manifest. | D23, D28, D31 |
| P10 dashboard-claims-no-mapping-but-maps | `AlembicDashboard/src/api.ts` | File header says V3 client does no field mapping, while the file contains broad raw record helpers, aliases, and normalizers. | The adapters may be necessary, but the responsibility is currently hidden and too large for clean ownership. | D15, D16, D21, D24 |
| P11 dashboard-diagnostics-extension-bag | `AlembicDashboard/src/api.ts`, `AlembicDashboard/src/types.ts` | Runtime diagnostics preserve `extraFields`; dynamic metadata and open string unions appear across runtime types. | Diagnostic extension points can be correct, but they need a named exposure class, UI consumer, and source-of-truth owner. | D17, D21, D27, D30 |
| P12 dashboard-sse-dynamic-boundary | `AlembicDashboard/src/api.ts` | SSE events use dynamic payload fields at the transport boundary. | Dynamic event ingestion is valid, but UI use should be typed after projection and replayed against fixtures. | D21, D24, D30 |
| P13 sensitive-field-surfaces-cross-cut | `Alembic/lib/shared/schemas/http-requests.ts`, `AlembicAgent/src/agent/runtime/AgentInterfaceContract.ts`, `AlembicDashboard/src/api.ts` | API key fields, host metadata, raw ids, provider payloads, and private paths appear in source surfaces with mixed roles. | OWASP API3 warns against exposing or accepting sensitive object properties by generic serialization/mass assignment. D28 must prove public outputs and fixtures are clean. | D17, D23, D28, D31 |
| P14 consumer-proof-not-yet-centralized | Provider fixtures, Dashboard normalizers, Plugin clients, Agent branch fixtures | Fixtures exist but are not yet a single consumer-driven replay loop proving which fields are actually consumed. | Pact-style CDC says test what consumers actually send/receive; deletion without replay proof is unsafe. | D24, D29, D30 |
| P15 core-spine-good-but-incomplete-taxonomy | `AlembicCore/src/shared/CoreContractSpine.ts`, `AlembicCore/src/daemon/ProjectRuntimeContracts.ts` | Core has strong rows, owner boundaries, states, and failure reasons, but D15+ field taxonomy and extension policy are not yet the shared enforcement layer. | Core is the right place for common vocabulary, not for product behavior. Downstream cleanup needs exported taxonomy and validation helpers. | D19, D25, D26, D30 |

## Best-Practice Translation To Alembic Rules

| Practice | Alembic Rule | Not Allowed As A Shortcut |
| --- | --- | --- |
| MCP structured output | Every public MCP tool must have a tool-specific `outputSchema`; `structuredContent` must validate after projector execution. | A single global response bag that accepts unrelated tool fields. |
| JSON Schema closure | Public schemas are strict by default. Dynamic data is allowed only as a typed, named extension point with owner and consumer. | Keeping `additionalProperties: true` because it is convenient or backward compatible. |
| RFC 9457 problem details | HTTP/provider failures expose stable machine-readable problem data: code/type/status/detail/retryability/refs/exposure class where relevant. | String-only errors or route-specific ad hoc error bags for consumer-visible branches. |
| Resource-oriented API design | Read/query, command, diagnostic, artifact, event, and MCP tool interfaces stay semantically distinct. | One route/tool returning command state, diagnostics, artifacts, and provider internals together. |
| OWASP API3 | Returned and accepted fields are cherry-picked by operation and exposure class; sensitive fields never become ordinary output. | Generic object serialization, mass assignment, or returning full backend records by default. |
| Consumer-driven contracts | Keep/delete decisions are proven by Dashboard/Plugin/Agent consumer replay and import scans. | Declaring a field unused because it looks old, ugly, or verbose. |
| OpenAPI as contract | Provider OpenAPI describes semantics, request bodies, response bodies, examples, and errors generated from checked contract rows. | A route inventory without typed request/response/error meaning. |
| OpenTelemetry-style semantics | Diagnostic keys use stable names for project, route, tool, job, provider, operation, duration, status, source, and error class. | Per-layer synonyms that force Dashboard/Plugin to guess. |

## D15-D32 Evidence Binding

Later demands must consume the problem map, not merely refer to it. The minimum
evidence binding is:

| Demand Range | Required Binding |
| --- | --- |
| D15-D18 | Produce a decision table that references P01-P15 or explicitly says why a problem ID is out of scope after D8-D14 evidence. |
| D19-D23 | For each product rewrite, name the exact code anchor, before/after field policy, preserved behavior, and representative validation. |
| D24 | Replay fixtures against the consumer adapter or MCP/client surface that currently depends on the field. |
| D25-D28 | Convert error, capability, diagnostic, and sensitive-field policy into executable schemas/tests, not prose-only rules. |
| D29 | Delete only rows with no-consumer proof, connected replacement, and passing representative checks. |
| D30 | Add drift checks that fail when P01-P15 reappear in public surfaces without a typed extension policy. |
| D31 | Run runtime/Dashboard/MCP scenarios that include at least one success, degraded/partial, unavailable, failure, and diagnostic branch. |
| D32 | Accept only after raw evidence review proves functionality is preserved and ordinary outputs are cleaner. |

## Interface Reasonability Model

D16 should judge each interface with this classification:

| Decision | Meaning | Product Action |
| --- | --- | --- |
| `keep` | Responsibility, consumer, state change, failure path, and validation are correct. | Protect from churn. |
| `clarify` | Interface is reasonable but naming, schema, or docs hide the responsibility. | Update contract/schema/docs/tests. |
| `split` | One interface mixes unrelated command/query/diagnostic/artifact concerns. | Create separate producer contracts and consumers. |
| `merge` | Duplicate interfaces serve the same caller and state transition. | Keep one owner and delete duplicates after import/consumer proof. |
| `move-owner` | Interface lives in the wrong repository or layer. | Move only after caller, replacement entrypoint, and validation are proven. |
| `rewrite-content` | Interface purpose is right but parameters or returned fields are over-wide, misleading, or unstable. | Rewrite request/response shapes while preserving functional behavior. |
| `restrict-diagnostics` | Ordinary output contains diagnostic/internal/provider details. | Move detail to `meta`, `detailRefs`, `artifactRefs`, or diagnostic route. |
| `delete-after-proof` | Interface is obsolete and has no active consumer. | Delete only after import scan, replacement route, and representative checks pass. |
| `blocked-pending-decision` | Scope, behavior, owner, or removal changes require user/controller decision. | Stop and ask; do not implement. |

## Parameter And Returned-Data Audit Model

D17 must classify each reviewed input parameter:

| Field Concern | Required Analysis |
| --- | --- |
| Caller responsibility | Who is allowed to set it: host, UI, daemon, provider adapter, internal scheduler, or user? |
| Required/optional meaning | Required for all calls, required for one operation, optional filter, optional projection, or deprecated alias? |
| State change | Query-only, command, lifecycle transition, diagnostic intake, artifact retrieval, or event subscription? |
| Identity/scope | Project identity, runtime identity, host identity, session identity, artifact identity, or correlation id? |
| Defaults and aliases | Server default, client default, legacy alias, environment coupling, or dangerous implicit behavior? |
| Validation | Zod/OpenAPI/schema validation, enum, bounds, maximum list size, field selection allowlist, or path guard? |
| Exposure/sensitivity | Public, consumer-needed, diagnostic, internal, sensitive, secret, raw-provider, or hidden-reasoning? |

D17 must classify each reviewed returned field:

| Field Concern | Required Analysis |
| --- | --- |
| Consumer need | Which UI/tool/route/test consumes it today, and what breaks if removed? |
| Source of truth | Core schema, provider route, agent runtime, plugin projector, dashboard view-model, or generated artifact? |
| Derivation | Original state, computed summary, compatibility alias, duplicated derived value, or presentation-only label? |
| Size and retrieval policy | Inline summary, paginated list, filtered list, field-selected response, detailRef, artifactRef, or streaming event? |
| Diagnostic policy | Ordinary output, `meta`, diagnostic route, event metadata, detailRef, artifactRef, or log-only? |
| Security | Secret, credential, thread id, host id, provider request/response, hidden reasoning, path, or sensitive project data? |
| Schema closure | Strict per-tool/per-route schema, public extension point, internal extension point, or no extension allowed? |

## D15+ Landing Sequence

D15-D18 are the analysis and decision front half. D19-D30 are the detailed
implementation and governance hardening waves. D31-D32 are real scenario
validation and final acceptance. This is intentional: the controller must not
dispatch product cleanup before it has a real current-state map and field-level
decisions, but it also must not stop after making the map.

| Order | Demand | Primary Output |
| --- | --- | --- |
| D15 | Current-state responsibility map | Real owner/consumer/call-chain map after D8-D14. |
| D16 | Interface reasonability review | Keep/clarify/split/merge/move/rewrite/restrict/delete decisions. |
| D17 | Parameter and returned-data content audit | Field-level responsibility, exposure, source-of-truth, and validation matrix. |
| D18 | Decision register and implementation slicing | Concrete product slices with dependencies and confirmation blockers. |
| D19 | Core schema closure and taxonomy | Shared field taxonomy, schema strictness policy, and contract-spine corrections. |
| D20 | Alembic provider content normalization | Provider request/response/problem/detailRef/artifactRef implementation. |
| D21 | Dashboard consumer adapter cleanup | UI adapter cleanup based on provider fixtures and consumer proof. |
| D22 | Plugin MCP per-tool output cleanup | Tool-specific output schemas and structuredContent projectors with no unrelated fields. |
| D23 | Agent result/diagnostic content cleanup | Public result vs diagnostic/artifact/private field separation. |
| D24 | Consumer-driven fixture replay | Provider/consumer fixture harness that proves current Dashboard and Plugin expectations. |
| D25 | Error and problem taxonomy | HTTP/MCP/Agent failure shapes normalized without collapsing distinct states. |
| D26 | Capability discovery and operation inventory | Explicit capability and operation inventory across daemon, provider, Plugin, and Dashboard. |
| D27 | Diagnostics, detailRef, artifactRef, and observability split | Stable diagnostic routing and semantic names; large data moved out of ordinary output. |
| D28 | Sensitive and private field quarantine | Raw provider, hidden reasoning, credentials, thread ids, private paths, and secrets barred from public output. |
| D29 | Compatibility deletion wave | No-consumer proof and deletion of obsolete aliases, fallback bags, and legacy routes. |
| D30 | Generated contract drift gates | CI/check scripts compare OpenAPI, MCP output schemas, Core rows, fixtures, and consumer adapters. |
| D31 | Runtime and Dashboard scenario validation | Real runtime smoke and UI scenario evidence across selected high-value workflows. |
| D32 | Final governance acceptance and archive | Controller raw evidence review, TODO rollup, archive, and next-backlog extraction only for new scope. |

## Long-Horizon Optimization Tracks

| Track | Why It Exists | Demand Coverage |
| --- | --- | --- |
| Responsibility ownership | Prevent Core, Alembic, Plugin, Agent, and Dashboard from each carrying fragments of the same contract. | D15, D16, D18, D19 |
| Interface semantic clarity | Separate resource/query, command, diagnostic, artifact, event, and MCP tool semantics. | D16, D20, D22, D23, D26 |
| Field-level content control | Ensure parameters and returned data belong to the specific operation/tool. | D17, D19, D20, D21, D22 |
| Consumer proof | Avoid deleting fields only because they look old; prove current consumer expectations. | D20, D21, D24, D29 |
| Failure semantics | Preserve partial, blocked, unavailable, timeout, cancelled, permission, and needs-confirmation states. | D20, D21, D22, D23, D25 |
| Diagnostic/data routing | Keep ordinary output concise while preserving complete evidence via refs, artifacts, logs, and diagnostic routes. | D17, D20, D21, D23, D27 |
| Sensitive-data control | Stop raw provider and host-private data from entering public API/MCP/UI surfaces. | D17, D21, D22, D23, D28 |
| Drift prevention | Make the clean interface model continuously enforceable after implementation. | D24, D30, D31, D32 |

## Implementation Principles

- Preserve full functionality. Cleanup means move, classify, validate, or
  route data correctly; it does not mean dropping real scenarios.
- Do not treat `Record<string, unknown>`, `unknown`, `any`, `.passthrough()`,
  or `additionalProperties` as automatic defects. First classify whether the
  openness is a true dynamic extension point, provider-private adapter, current
  compatibility shim, or obsolete leak.
- For MCP, the ordinary response must stay compact: `ok`, `status`, `summary`,
  typed `error`, typed `meta`, typed `refs`, and the tool-specific payload.
  Long evidence belongs in `detailRefs`, `artifactRefs`, logs, or diagnostic
  tools.
- For HTTP provider routes, command/query/diagnostic/artifact/event interfaces
  must stay distinct. Errors should be stable and machine-readable; route
  bodies should not expose raw internal objects by default.
- For Dashboard, adapters must be scenario-driven. Keep fallbacks that protect
  current UI behavior until provider fixtures and UI tests prove the new path.
- For Agent, preserve partial/blocked/timeout/needs-confirmation branches.
  Do not collapse non-success behavior into generic failure just to make output
  smaller.
- For deletion, require three proofs: import/consumer scan is clean,
  replacement entrypoint is connected, and representative build/check/smoke
  passed.

## Acceptance Evidence Required For D32

- D15-D18 outputs exist and reference current D8-D14 evidence.
- D19-D30 product windows provide commits or no-change proof with raw command
  output.
- Provider fixtures replay against Dashboard consumer normalizers.
- MCP `tools/list` exposes per-tool `outputSchema`, and representative
  `callTool` results validate against those schemas.
- Agent runtime fixture or tests prove public result fields do not include raw
  provider request/response, hidden reasoning, credentials, or host thread ids.
- Dashboard scenarios show runtime status, project switching, job events,
  search/knowledge, guard, decision-register, and host-managed unavailable
  states still render correctly.
- Any deleted compatibility path has no active consumer and has a replacement
  route connected.
- Drift gates prove generated OpenAPI, MCP output schemas, Core rows, fixtures,
  and consumer adapters have not diverged.
