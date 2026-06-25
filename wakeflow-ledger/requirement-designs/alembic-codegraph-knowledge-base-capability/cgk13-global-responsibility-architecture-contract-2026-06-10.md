# CGK-13 Global Responsibility And Architecture Contract

Status: target deliverable for Design task
Date: 2026-06-10
Demand: alembic-codegraph-knowledge-base-capability
Task: alembic-codegraph-knowledge-base-capability-cgk11-13-learning-responsibility-t3
Scope: repository/window responsibilities for CodeGraph-inspired source graph capability

## Purpose

This contract fixes ownership boundaries before implementation waves begin. It
prevents source graph, MCP, lifecycle refs, Recipe/Guard/Decision knowledge,
Dashboard, Wakeflow, Design, and Test responsibilities from drifting.

The contract is derived from accepted CGK-0/CGK-0A Core and Plugin evidence.
It is a Design recommendation for controller review, not controller acceptance.

## Architecture Principle

Alembic should learn from CodeGraph's source intelligence while preserving
Alembic's own architecture:

- AlembicCore owns deterministic source graph facts and reusable contracts.
- AlembicPlugin owns Codex-facing MCP behavior, startup, routing, and clean
  operation-specific projection.
- Agent lifecycle tools remain the spine for intent, prime, work, Guard, and
  decisions.
- Recipe/Guard/Decision knowledge remains distinct from source graph evidence.
- Dashboard visualization waits for stable read contracts.
- Wakeflow controls state roots, dispatch, acceptance, and unattended rollout.
- Test is used for real scenario validation only when controller assigns it.

## Repository And Window Responsibility Matrix

| Area | Owner | Responsibility | Non-responsibility | Primary consumers |
| --- | --- | --- | --- | --- |
| Source graph contracts | AlembicCore | Public DTOs/validators for source files, symbols, edges, source sections, generations, freshness, diagnostics, query results, and affected validation plans. | MCP tool naming, Codex initialize prose, Dashboard UI. | AlembicPlugin, future Agent/Dashboard. |
| Source graph storage and migrations | AlembicCore | Dedicated or versioned storage for files/symbols/edges/unresolved refs/generations/parse errors; repository APIs and migration tests. | Plugin-local DB shortcuts or host-specific schemas. | SourceGraphIndexer, SourceGraphQueryService. |
| Source graph build and freshness | AlembicCore | Full/incremental indexing, file inventory, parser lifecycle, hash/mtime/indexed_at, generation stamping, unsupported/partial coverage, freshness DTOs. | Codex session cache, MCP transport, initialize guidance. | AlembicPlugin runtime, status tools. |
| Ranking and code logic retrieval | AlembicCore | Exact symbol, path/FTS/natural-language recall, graph relevance, ambiguity, low-confidence states, callers/callees/impact/affected tests. | Host-specific output truncation or workflow refs. | Plugin source graph MCP tools. |
| MCP surface and host routing | AlembicPlugin | Tool schemas, tool catalog, visibility policy, projectRoot/repo routing, MCP initialize source graph playbook, degraded responses. | Core extraction/storage/query implementation. | Codex host agent. |
| Cold-start and session runtime | AlembicPlugin | Fast handshake, lazy Core graph open, per-project engine cache, catch-up gate, watcher/pending projection, status/debug survival on graph failure. | Parser internals and durable graph tables. | Codex, controller probes. |
| Clean output projection | AlembicPlugin | Operation-specific schemas, allow-lists, business/diagnostic separation, detail refs, negative tests for unrelated fields. | Defining Core's internal storage shape. | Codex, controller evidence review. |
| Agent lifecycle refs | AlembicPlugin with Core shared contracts when needed | `intent`, `prime`, `work_start`, `work_finish`, `code_guard`, `decision_record`, and sourceGraph evidence refs. | Replacing lifecycle with source graph tools or widening Guard scope. | Codex, controller, Guard/Decision flows. |
| Recipe/Guard/Decision knowledge | AlembicCore and existing durable runtime routes | Knowledge entries, SourceRefs, Guard rules, Decision Register contracts, source-ref health and bridge to source graph nodes. | Pretending source graph evidence is a confirmed decision or Recipe provenance. | Prime, Guard, Dashboard later. |
| AlembicAgent runtime use | Later Agent window | Consume stable Core/Plugin contracts for runtime/tool/AI workflows after MCP path is accepted. | Owning Core graph contracts or Plugin MCP behavior. | Agent workflows. |
| AlembicDashboard visualization | Later Dashboard window | Visualize accepted source graph and lifecycle contracts through stable read models. | Binding to draft Plugin internals or driving implementation order. | Human operators. |
| Wakeflow controller governance | AlembicWorkspace controller | State roots, task packages, dispatch, result import/review, acceptance, TODO routing, unattended wave sequencing. | Source graph implementation, product code, Test execution. | All windows. |
| Design window | Design | Requirement design, option reasoning, decision ledger, responsibility map, handoff candidates. | Product code, controller state mutation, dispatch, acceptance. | Controller intake. |
| Test window | Test | Real-scenario validation only when assigned by controller: cold start, runtime observation, browser/dashboard checks, multi-repo integration evidence. | Rediscovering known unit/script/code defects or implementing product fixes. | Controller acceptance. |

## Do-Not-Move Boundaries

### Core Source Graph Storage, Index, Query, And DTOs

Do not move durable source graph storage, file/symbol/edge generation, parser
coverage, source graph ranking, or source graph DTO validators into
AlembicPlugin. Plugin consumes Core contracts; it does not become the source
graph product core.

Evidence basis:

- Core already owns `ProjectGraph`, `CallGraphAnalyzer`, `CodeEntityGraph`,
  `CodeEntityRepository`, `ProjectIntelligenceRunner`, SearchEngine rankers,
  and SourceRefReconciler.
- Target evidence shows the missing layer is a stable Core source graph facade,
  not a Plugin-local extraction copy.

### Plugin MCP, Cold Start, And Runtime Orchestration

Do not move Codex MCP tool schemas, initialize guidance, ToolPolicy visibility,
project root routing, source graph status projection, or first-tool catch-up
behavior into AlembicCore. Core may produce state; Plugin decides how the host
agent sees it.

Evidence basis:

- `CodexMcpServer` and `McpServer` own MCP list/call behavior.
- `PluginToolSurfaceCatalog`, `ToolPolicy`, and clean output projectors already
  form the right Plugin-owned surfaces.

### Agent Lifecycle Refs

Do not let source graph tools replace `intent`, `prime`, `work_start`,
`work_finish`, `code_guard`, or `decision_record`. Source graph evidence should
feed those lifecycle tools through explicit refs.

Ref ownership:

- `intentRef`: intent classification and plans.
- `primeRef`: Recipe/Guard/Decision knowledge summary.
- `sourceGraphRef`: source graph query/source evidence.
- `workRef`: scoped work record.
- `finishRef`: work closeout evidence.
- `guardResultRef`: explicit scoped Guard result.
- `decisionRef`: durable confirmed decision.

No tool should return a global `refs` bag that lists every possible ref.

### Recipe, Guard, Decision, And SourceRef Knowledge

Do not merge Recipe graph freshness with source graph freshness. A fresh source
graph does not prove a Recipe source ref is active. A ready Recipe prime does
not prove source code facts are current.

SourceRef bridge rule:

- Recipe SourceRefs may link to source graph nodes only through
  ProjectScope-qualified paths and a known source graph generation/freshness
  state.
- Source graph tools may recommend source evidence; they must not silently
  backfill Recipe provenance.

### Dashboard Visualization Timing

Do not start Dashboard implementation against draft Plugin internals. Dashboard
may do read-only visualization research only if controller assigns it, and
production Dashboard work waits for accepted Core/Plugin contracts.

### Wakeflow Governance

Do not let Design or product windows mutate Wakeflow TODOs, state roots,
dispatch, acceptance, archive, or unattended automation decisions. Target
results are evidence inputs; controller review remains separate.

### Test Usage

Do not hand known script/code/document defects to Test. Use Test only when the
controller needs real-scenario validation such as cold start, daemon/runtime
observation, dashboard behavior, or cross-repo integration evidence.

## Public Contract Stack

### Core Producer Contracts

Core should produce:

- `SourceGraphSnapshot`: repo identity, projectScope folder, graph root,
  generation id, build/index time, extraction version, status.
- `SourceFileNode`: repo-relative path, language, size, hash, mtime,
  indexed_at, classification, parse errors, generation.
- `SourceSymbolNode`: stable id, name, qualified name, kind, file path, ranges,
  signature, container, exported/imported metadata.
- `SourceGraphEdge`: source/target, kind, site, deterministic or heuristic
  provenance, confidence, metadata, generation.
- `SourceSection`: file, start/end lines, current/freshness claim, redaction
  state, reason for inclusion.
- `SourceGraphQueryResult`: operation-specific source sections, relations,
  diagnostics, impact, affected validations, and detail refs.
- `SourceGraphFreshness`: initialized/indexed/fresh/stale/pending/partial/
  degraded/unavailable states and next action.

### Plugin MCP Contracts

Plugin should expose:

- `alembic_source_graph_status`
- `alembic_code_explore`
- `alembic_symbol_search`
- `alembic_source_node`
- `alembic_callers`
- `alembic_callees`
- `alembic_code_impact`
- `alembic_affected_tests`

These tools are candidates until Core producer contracts exist. Early Plugin
work may expose degraded/uninitialized status, but source facts must not be
claimed ready before Core freshness and source section contracts are proven.

### Lifecycle Fusion Contracts

Lifecycle tools should add only owned fields:

- `intent`: `sourceGraphNeed`, `sourceGraphPlan`, `knowledgeNeed`,
  `guardNeed`, `decisionNeed`, `workNeed`.
- `prime`: Recipe/Guard/Decision compact package plus recommended source graph
  queries and evidence refs.
- `work_start`: scoped work record tied to intent/prime/source evidence refs.
- `work_finish`: changed files, evidence refs, Guard/test/source impact
  recommendations.
- `code_guard`: explicit files/code/workRef only; may consume source graph
  impact context but remains scoped.
- `decision_record`: confirmed durable decisions only; source graph evidence is
  supporting evidence, not the decision itself.

## Implementation Wave Order

| Order | Slice group | Owner windows | Reason |
| --- | --- | --- | --- |
| 1 | CGK-1 + CGK-7 | AlembicCore | Define source graph contracts/storage before consumers depend on them. |
| 2 | CGK-15 + CGK-17 | AlembicCore + AlembicPlugin | Boundary states and clean output contracts prevent misleading ready output and field drift. |
| 3 | CGK-2 | AlembicCore | Build full/incremental index lifecycle and freshness states. |
| 4 | CGK-2A + CGK-2B + CGK-9 | AlembicPlugin | Add cold-start, catch-up, initialize guidance, and status around Core producer contracts. |
| 5 | CGK-3 + CGK-8 | AlembicCore + AlembicPlugin | Expose source graph tools and ranking once construction/freshness is real. |
| 6 | CGK-5 + CGK-12 + CGK-16 | AlembicCore + AlembicPlugin | Connect source graph evidence to validation plans and lifecycle refs. |
| 7 | CGK-10 + CGK-14 | Plugin/Core with controller/Test as needed | Prove end-to-end MCP path and behavior change. |
| 8 | CGK-6 + CGK-18 | Controller-led | Cross-repo acceptance and transcript-governed long-running optimization. |
| 9 | Dashboard/Agent follow-up | Dashboard/Agent after acceptance | Consume stable read contracts only. |

## Validation Matrix

| Boundary | Required evidence |
| --- | --- |
| Core source graph contract | Type/validator tests, migration tests, repository fixtures, generated/freshness status fixtures. |
| Core build/freshness | Full build, incremental change, deletion, large file skip, parser error, unsupported language, stale generation. |
| Plugin startup | Cold MCP startup probe proves tools/status callable without full graph open; graph failure does not close transport. |
| Plugin source tools | Raw MCP JSON shows operation-specific fields only and line-numbered source sections only when freshness permits. |
| Lifecycle fusion | MCP flow shows separate intent/prime/source/work/finish/guard/decision refs and no scope widening. |
| Wrong scope/worktree | Multi-repo or worktree fixture returns inventory/warning/blocker before source facts. |
| Affected validation | Changed-file fixture produces must-run/recommended/unknown validation buckets with uncertainty. |
| Agent adoption | Transcript harness proves source graph tool choice, lower raw Read/Grep usage where appropriate, and honest stale fallback. |
| Dashboard readiness | Dashboard starts only after stable Core/Plugin read contracts are accepted. |

## Current Risks And Required Controller Judgment

Risks:

- Existing `code_entities` and `knowledge_edges` may look reusable enough to skip
  proper source graph lifecycle separation.
- Plugin can easily add source graph-shaped tools before Core can prove source
  freshness; this would create misleading Codex output.
- MCP initialize guidance can become stale if generated manually instead of from
  visible tools.
- A single happy-path source graph query is not adoption evidence.

Controller judgment needed:

- Confirm source graph storage strategy before implementation begins.
- Confirm whether first implementation targets only AlembicPlugin/AlembicCore
  TypeScript or preserves existing Swift/ObjC graph strengths in the same wave.
- Confirm Dashboard remains deferred until Plugin/Core evidence is accepted.
- Confirm Test is reserved for real-scenario validation, not implementation.

## Controller Intake Notes

This CGK-13 contract is ready for controller review alongside the CGK-11 ledger.
Recommended controller action after review:

1. Accept or amend the do-not-move boundaries.
2. Create the next implementation package for Core contracts/storage
   (`CGK-1 + CGK-7`) and a companion boundary/output contract package
   (`CGK-15 + CGK-17`).
3. Keep Plugin runtime/source tools waiting on the Core producer contract except
   for explicitly degraded/uninitialized status or initialize-guidance design.

## Source References

- `.wakeflow-active/current/alembic-codegraph-knowledge-base-capability/target-results/tr-alembic-codegraph-knowledge-base-capability-cgk0-core-audit-t1.json`
- `.wakeflow-active/current/alembic-codegraph-knowledge-base-capability/target-results/tr-alembic-codegraph-knowledge-base-capability-cgk0-plugin-audit-t2.json`
- `wakeflow-ledger/requirement-designs/alembic-codegraph-knowledge-base-capability/cgk11-learning-decision-ledger-2026-06-10.md`
- `AlembicCore/src/core/ast/ProjectGraph.ts:1`
- `AlembicCore/src/core/analysis/CallGraphAnalyzer.ts:84`
- `AlembicCore/src/service/knowledge/CodeEntityGraph.ts:214`
- `AlembicCore/src/infrastructure/database/drizzle/schema.ts:125`
- `AlembicCore/src/infrastructure/database/drizzle/schema.ts:340`
- `AlembicPlugin/lib/codex/mcp/CodexMcpServer.ts:241`
- `AlembicPlugin/lib/codex/mcp/tools.ts:236`
- `AlembicPlugin/lib/codex/ToolPolicy.ts:246`
- `AlembicPlugin/lib/codex/mcp/core-tools/output.ts:9`
