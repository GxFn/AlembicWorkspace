# Alembic Cross-Repository Interface Contract Workspace Handoff

Date: 2026-06-09
Status: ready-for-workspace
Source Window: Design
Receiving Window: Wakeflow
Design Key: alembic-cross-repo-interface-contract-2026-06-09

## Summary

Wakeflow should review a new confirmed demand to clean up and govern interface
contracts across `AlembicCore`, `Alembic`, `AlembicPlugin`, `AlembicAgent`, and
`AlembicDashboard`. The goal is not repository reshuffling and not a thin
interface layer. The goal is a real producer/consumer contract system with clear
ownership, machine-checkable schemas, contract tests, migration rules, and
cross-repo acceptance evidence.

## Handoff Type

requirement-candidate

## Confirmed User Goal

- Optimize interfaces between Core, Plugin, Alembic main, Agent, and Dashboard.
- Keep responsibilities clean and clear.
- Use online industry research.
- Produce a complete real landing plan, not only high-level advice.

## Current Design Status

- Requirement design status: ready-for-workspace
- User confirmation status: confirmed by direct request
- Mainline relation status: next-mainline
- Current mainline relation: new demand after the MCP clean-output demand
  design/acceptance family.
- Code fact status: enough for intake; not enough for implementation without P0
  full contract inventory.
- Needs Wakeflow code research: yes, P0.
- Detached Design mode: no.

## Recommended Next Step

controller review and P0 full cross-repo contract inventory.

This recommendation is for Wakeflow review only. It is not an implementation
window prompt.

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicCore | participates | Own deterministic shared contracts, validators, runtime/project/job DTOs, package exports, repository/workflow primitives. | Must not absorb host/UI/MCP/AI responsibilities. |
| Alembic | participates | Own CLI, daemon, HTTP `/api/v1`, SSE/Socket/job event production, Dashboard server, runtime orchestration, Agent consumption. | Needs P0 route/event inventory before contract generation. |
| AlembicPlugin | participates | Own Codex MCP, skills, channel/marketplace, host adapter, clean MCP output, resident-service client. | Depends on Core/Alembic provider contracts. |
| AlembicAgent | participates | Own AI provider/tool/runtime/host adapter contracts and tool result envelopes. | Depends on Core deterministic contracts and Alembic consumer requirements. |
| AlembicDashboard | participates | Own frontend typed API client, view-model adapters, UI state, event consumers. | Depends on Alembic provider HTTP/event contracts. |
| Design | design-complete | Requirement design and handoff. | None. |
| Test | observing | Use only for real daemon/Dashboard/runtime smoke that product windows cannot self-verify. | Product self-checks first. |

## Evidence And Links

- State root: `.wakeflow-active/current/alembic-cross-repo-interface-contract/`
- Original plan: `Design/docs/current/alembic-cross-repo-interface-contract-original-plan-2026-06-09.md`
- Requirement design: `Design/docs/current/alembic-cross-repo-interface-contract-requirement-design-2026-06-09.md`
- Independent demand sequence: `Design/docs/current/alembic-cross-repo-interface-contract-work-slicing-2026-06-09.md`
- Sequence manifest: `wakeflow-ledger/requirement-designs/alembic-cross-repo-interface-contract/alembic-interface-contract-demand-sequence-2026-06-09.json`
- Handoff: `Design/docs/current/alembic-cross-repo-interface-contract-workspace-handoff-2026-06-09.md`
- Industry references:
  - Microsoft API design and versioning guidance.
  - Microsoft bounded context / service boundary guidance.
  - OpenAPI docs for machine-readable REST contracts.
  - AsyncAPI docs for event-driven API documentation.
  - Pact docs for consumer/provider contract tests.
  - OWASP API Security Top 10 2023 for property-level exposure and inventory.
  - OpenTelemetry docs for trace/log/metric semantics.

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| P0 | Full contract inventory | Reads all five repos before any implementation. | Table covers package, REST, event, MCP, Agent, Dashboard contracts. |
| P1 | Registry + ADR candidate | Uses P0 evidence. | Contract registry schema and source-of-truth decision are ready. |
| P2 | Core contract cleanup | Core before consumers. | Stable exports/validators and Core boundary tests pass. |
| P3 | Alembic HTTP/event cleanup | Alembic before Dashboard/Plugin updates. | OpenAPI and event registry/spec checks pass. |
| P4 | Plugin contract alignment | Consumes Core/Alembic provider contracts. | MCP/resident-service contract tests and plugin checks pass. |
| P5 | Agent contract alignment | Consumes Core; Alembic consumes Agent. | Tool/runtime/provider contract tests pass. |
| P6 | Dashboard contract alignment | Consumes Alembic provider schemas/events. | Typed client/view-model tests and Dashboard build pass. |
| P7 | Cross-repo acceptance | After P2-P6. | Contract drift tests, import-boundary lint, builds/checks, and real runtime smoke pass. |

Phase candidates are for controller review only and are not task packages.

## Independent Demand Sequence

After the initial handoff, the user confirmed unattended automation mode and
asked Design to split this work into multiple detailed requirements so total
control can continue claiming work through completion. The user then clarified
that each demand may be independent as long as the order is clear. The sequence is recorded in
`wakeflow-ledger/requirement-designs/alembic-cross-repo-interface-contract/`.

Recommended independent demand order:

1. `alembic-interface-contract-d0-inventory-2026-06-09`
2. `alembic-interface-contract-d1-registry-adr-2026-06-09`
3. `alembic-interface-contract-d2-core-spine-2026-06-09`
4. `alembic-interface-contract-d3-alembic-provider-2026-06-09`
5. `alembic-interface-contract-d4-plugin-host-mcp-2026-06-09`
6. `alembic-interface-contract-d5-agent-runtime-tools-2026-06-09`
7. `alembic-interface-contract-d6-dashboard-consumer-2026-06-09`
8. `alembic-interface-contract-d7-acceptance-cleanup-2026-06-09`

Controller may claim D0-D7 as independent demands in order. Each claim creates
its own state root and initial task package. The sequence documents are still
not direct dispatch authority.

## Risks

- Centralizing every contract in Core would violate repository boundaries and
  create a new monolith.
- Hand-authored OpenAPI/event specs can drift without generation or checks.
- Dashboard's manual normalization can hide stale backend fields.
- Consumer-driven tests can miss unused provider fields; pair them with provider
  schema validation.
- Duplicate compatibility contracts need explicit consumer and cleanup triggers.

## Open Questions For Wakeflow

1. If D0 finds a scope-changing repository or capability outside the five
   confirmed repos, should the controller pause for user decision?
2. If D7 needs independent runtime observation after product self-checks, which
   smoke should Test run first: daemon health, Dashboard API flow, Plugin MCP,
   Agent tool/runtime, or the full CLI/daemon/Dashboard loop?

## Design Handoff

- Source: current user request, workspace status, five repository AGENTS files,
  local code fact sampling, Alembic status/prime, and online industry research.
- Goal: clean, verifiable, real cross-repository interface contracts.
- Confirmed decisions: all five repos in scope; no docs-only completion; real
  landing plan required; industry best practices must inform the design.
- Design recommendation: repository-owned contracts plus a cross-repo contract
  registry and consumer-driven tests where consumers are real.
- Non-goals: empty interfaces, UI/backend/AI/MCP responsibility migration into
  Core, static mocks, and unconnected schema packages.
- Required controller judgment: P0 package creation, contract registry location,
  phase order, and Test need.
- Suggested next action: controller claim D0 from the independent demand
  sequence, then continue D1-D7 in dependency order after each demand is
  reviewed.
- Suggested skills: wakeflow-governance, option-planning, requirement-design,
  Alembic local code-fact analysis.
- Redaction notes: no secrets or real thread ids included.
- Intake status: ready-for-controller-intake.

## Pre-Handoff Checklist

- Checked workspace status and no active demand was running: yes.
- Used online industry sources as requested: yes.
- Checked five repository AGENTS and local contract seams: yes.
- Created Wakeflow state root: yes.
- This handoff does not include copyable implementation-window prompts: yes.
- Phases remain candidates, not task packages: yes.
