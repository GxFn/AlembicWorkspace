# Alembic Cross-Repository Interface Contract Original Plan

Design Key: alembic-cross-repo-interface-contract-2026-06-09
Date: 2026-06-09
Status: ready-for-workspace
Owner Window: Design
Receiving Window: Wakeflow

## User Goal

Create a new demand to optimize interface design across `AlembicCore`,
`AlembicPlugin`, `Alembic`, `AlembicAgent`, and `AlembicDashboard`. The outcome
must make cross-repository responsibilities clean, explicit, and verifiable, and
must include an industry-researched, real landing plan instead of abstract
architecture advice.

## Background

- Trigger: The Alembic workspace now has multiple source repositories with
  overlapping runtime, API, MCP, Agent, Dashboard, and contract surfaces.
- Workspace status: idle; new work requires a new demand or Design handoff.
- State root: `.workspace-active/workspace/current/alembic-cross-repo-interface-contract/`.
- Industry research was explicitly requested by the user and completed before
  this draft.
- Existing local facts:
  - `AlembicCore/package.json` exposes many stable `@alembic/core/*` package
    subpaths.
  - `Alembic/package.json` consumes both `@alembic/core` and `@alembic/agent`
    through workspace file dependencies.
  - `AlembicPlugin/package.json` consumes `@alembic/core` and owns Codex MCP,
    skills, channel, and plugin runtime packaging.
  - `AlembicAgent/package.json` exposes `@alembic/agent/*` runtime, tool, AI,
    context, and memory subpaths.
  - `AlembicDashboard/package.json` is an independent React/Vite frontend.

## Scope Candidate

| Area | In Scope | Out Of Scope | Notes |
| --- | --- | --- | --- |
| Package contracts | `@alembic/core` and `@alembic/agent` exports, consumer import boundaries, source/vendored dependency rules. | Replacing functioning packages with empty facade modules. | Public subpaths are long-term contracts. |
| HTTP API | `Alembic` `/api/v1` route contracts, OpenAPI source-of-truth, request/response schema ownership. | Dashboard-only mock schemas treated as backend truth. | Dashboard must trace API client fields to backend contracts. |
| Events | SSE, Socket.io, job process events, scan/chat/refine/bootstrap event shapes. | Ad hoc frontend-only event interpretation with no provider contract. | AsyncAPI-style event manifest or equivalent typed registry is needed. |
| MCP | Plugin MCP input/output contracts, clean output projectors, resident-service client boundaries. | Moving Codex MCP into Core or Alembic main. | Plugin owns Codex host integration. |
| Agent | Agent tool/runtime/result envelopes, AI provider adapter contracts, host adapter contracts. | Putting AI provider/runtime/tool execution into Core or Dashboard. | Agent owns non-deterministic runtime and tool system. |
| Dashboard | Typed API client, view models, UI states, error/loading/partial data handling. | Backend persistence, AI decisions, tool execution, or Core runtime logic in frontend. | Dashboard may adapt but not own backend truth. |
| Governance | Contract inventory, source-of-truth decision, migration/deletion rules, contract tests, boundary lint. | Dispatch or implementation before controller review. | This demand creates the plan and later executable packages. |

## Completion Definition Candidate

Wakeflow may accept this demand only when there is a complete real landing plan
and later implementation acceptance path for all cross-repository contracts:

- Every interface surface between the five repositories is inventoried and
  classified by producer, consumer, transport, source-of-truth, schema owner,
  validation seam, and deletion/migration rule.
- Repository responsibilities are confirmed:
  - Core: deterministic shared contracts, validators, runtime DTOs, repository
    and workflow primitives.
  - Alembic: CLI, daemon, HTTP API, Dashboard server, runtime orchestration,
    ProjectRegistry, job/event production, Agent consumption.
  - Plugin: Codex MCP, skills, channel/marketplace, host adapter, clean MCP
    outputs, resident-service client.
  - Agent: AI provider, tool registry/router, runtime loop, prompt/context,
    host adapter, tool result envelopes.
  - Dashboard: frontend API client, view-model adapters, UI state and
    visualization only.
- REST contract strategy is defined using OpenAPI/Zod or an equivalent generated
  and checked schema source.
- Event contract strategy is defined using AsyncAPI-style documentation or an
  equivalent typed event registry for SSE/Socket/job process events.
- Consumer-driven contract testing is assigned to the real consumers: Dashboard
  for HTTP/events, Plugin for resident-service/MCP, Alembic for Core/Agent
  consumption, and Agent for Core/tool adapter contracts.
- Migration phases name real producers/consumers, exact affected repositories,
  validation commands, rollback/deletion conditions, and non-goals.
- No completion is allowed for docs-only advice, empty adapters, static mocks,
  unused schemas, or unconnected interface shells.

## Industry Research Inputs

- Microsoft Azure Architecture Center, API design:
  `https://learn.microsoft.com/en-us/azure/architecture/microservices/design/api-design`
- Microsoft Azure Architecture Center, microservices style:
  `https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices`
- Microsoft Azure Architecture Center, identifying microservice boundaries:
  `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/microservice-boundaries`
- OpenAPI learning docs:
  `https://learn.openapis.org/specification/`
- AsyncAPI docs:
  `https://www.asyncapi.com/docs`
- Pact contract testing docs:
  `https://docs.pact.io/`
- OWASP API Security Top 10 2023:
  `https://owasp.org/API-Security/editions/2023/en/0x11-t10/`
- OpenTelemetry observability primer and semantic conventions:
  `https://opentelemetry.io/docs/concepts/observability-primer/`
  and `https://opentelemetry.io/docs/concepts/semantic-conventions/`

## Confirmation Status

- User confirmation status: confirmed by direct user request on 2026-06-09.
- Controller still owns phase order, task-package split, and dispatch decisions.
