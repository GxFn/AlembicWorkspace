# ADR: Cross-Repository Interface Contract Source Of Truth

Date: 2026-06-09
Status: accepted by D1 controller review after D0 inventory
Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d1-registry-adr-2026-06-09`

## Context

Alembic currently spans five active repositories:

- `AlembicCore`
- `Alembic`
- `AlembicPlugin`
- `AlembicAgent`
- `AlembicDashboard`

D0 created a read-only inventory of 24 cross-repository interface families. The
interfaces include package exports, REST routes, runtime/project/job contracts,
event streams, job artifacts, MCP tools, Agent tool/provider runtime contracts,
Dashboard DTO/view-model adapters, and diagnostic observability surfaces.

The user confirmed this is optimization, not feature reduction. Existing
functionality must be preserved. Thin minimum implementations, placeholder
adapters, docs-only shells, static mocks, narrow demos, and happy-path-only
evidence are not acceptable completion.

## Decision

Use a producer-owned executable contract model with a controller-visible
registry:

1. Each product repository keeps executable contract ownership for the surfaces
   it produces.
2. The controller registry records source-of-truth ownership, consumers,
   function class, validation family, exposure policy, artifact policy, drift
   gate, compatibility owner, and removal blocker.
3. Consumers discover provider support through explicit capability discovery.
   They must not guess support from missing fields, static assumptions, or local
   fallback success.
4. Ordinary outputs may include only public and consumer-needed fields.
   Diagnostic fields require diagnostic context. Internal, sensitive, and
   unrelated derived fields must not leak.
5. Large logs, reports, snapshots, diagnostics, replay payloads, raw provider
   data, and long LLM IO use compact summaries plus `detailRef` or
   `artifactRef`.
6. Compatibility remains only when it has a real current consumer,
   `currentCompatibilityOwner`, validation evidence, and cleanup blocker.
7. Deletion is allowed only after no-consumer proof, replacement evidence where
   needed, and representative validation.

Core is not a monolith. It may own shared deterministic contracts such as
package exports, runtime DTOs, project/job/event schemas, guard/source
contracts, and artifact schemas. It does not own Codex MCP behavior, Dashboard
UI state, AI provider runtime, daemon runtime implementation, or Agent tool
execution.

## Function Class Rules

| Function Class | Source Of Truth | Handling Rule | Validation Family |
| --- | --- | --- | --- |
| `package-export` | Producing package export map and public facades | Producer owns public exports; consumers use public subpaths only. | Package export tests, import-boundary lint, build/check. |
| `rest-query` | Provider route schema and samples | Provider owns explicit response schemas and consumer safety. | OpenAPI/schema diff, route tests, consumer fixture tests. |
| `rest-command` | Provider command schema, state transition, and problem responses | Provider separates input, state change, conflict, unavailable, and problem response. | Route tests, state assertions, RFC 9457-style problem tests. |
| `event-stream` | Provider event registry plus payload fixtures | Provider owns event metadata and payload schemas separately. | Event fixture validation, replay tests, consumer event tests. |
| `job-artifact` | Provider artifact manifest and snapshot schema | Provider references large artifacts and keeps summaries compact. | Artifact manifest tests, route tests, size/shape checks. |
| `mcp-tool` | Plugin tool schema, route policy, and output projector | Plugin owns per-tool schema/projector; generic field bags are not enough. | MCP schema/projector tests, missing-projector fail-closed tests, golden fixtures. |
| `agent-tool` | Agent manifest, router, provider, and result envelopes | Agent owns all result branches and provider/tool execution semantics. | Tool/router tests, provider mock tests, result branch fixtures. |
| `dashboard-view-model` | Dashboard adapter over provider fixtures | Dashboard owns presentation adapter only; backend fixtures remain truth. | Dashboard contract tests, provider fixture replay, typecheck/build. |
| `diagnostic-observability` | Producing diagnostic/event/log source | Producer owns stable names, ids, correlation ids, sources, and failure reasons. | Snapshot/log/event assertions and sensitive-field checks. |

## Registry

The initial registry is
`wakeflow-ledger/requirement-designs/alembic-cross-repo-interface-contract/contract-registry-2026-06-09.json`.

Every row includes:

- producer and current consumers
- transport and schema source
- validation command
- preserved capability coverage
- capability discovery
- error kinds
- exposure classes
- artifact policy
- fixture policy
- drift gate
- current compatibility owner
- observability keys
- removal blocker
- security/property exposure notes
- future demand owner

The registry is a controller routing and acceptance artifact. It does not replace
the executable contracts in the owning repositories.

## Demand Ownership

- D2 `AlembicCore`: shared deterministic contract spine rows.
- D3 `Alembic`: HTTP/runtime/event/artifact provider rows.
- D4 `AlembicPlugin`: MCP, resident routing, clean output, codex-local, and embedded compatibility rows.
- D5 `AlembicAgent`: Agent package, tool runtime, provider, and boundary rows.
- D6 `AlembicDashboard`: consumer DTO, view model, socket, and fixture replay rows.
- D7 `AlembicWorkspace`: cross-repository acceptance, drift gates, final cleanup decisions, and archive.

D4 and D6 require D3 provider evidence before final acceptance of their provider
consumer paths. D5 can proceed after D1/D2, but Alembic consumer integration for
Agent rows waits for D5 evidence.

## Security And Exposure

The registry uses these exposure classes:

- `public`: safe ordinary output or public package/API surface.
- `consumer-needed`: required for a current consumer to work.
- `diagnostic`: allowed only in diagnostic context.
- `internal`: implementation detail; not ordinary output.
- `sensitive`: credentials, secrets, raw provider payloads, local-only private data.
- `derived`: computed metadata that must not become success criteria unless the consumer requires it.
- `hidden-reasoning`: hidden LLM reasoning or equivalent provider-private content.

Any ambiguity around sensitive/security field exposure is a stop condition for
the automation sequence.

## Rejected Alternatives

- Move all contracts into `AlembicCore` for tidiness.
- Keep only thin transport shells and call that interface completion.
- Replace producer-owned route/event/tool behavior with static mocks.
- Let consumers infer provider capability from missing fields or fallback paths.
- Treat diagnostic metadata as acceptance instead of raw behavior evidence.
- Delete compatibility surfaces without no-consumer proof and representative validation.

## Consequences

- Product windows can work independently while staying aligned through row ids.
- Controller acceptance can review producer evidence and consumer evidence
  against the same registry.
- D7 can decide cleanup only where the registry has validation evidence and a
  removal blocker has been cleared.
- Versioning, deprecation windows, remove-after dates, breaking-change policy,
  and long-term evolution strategy remain deferred by user decision.
