# CGK-11 Learning Decision Ledger

Status: target deliverable for Design task
Date: 2026-06-10
Demand: alembic-codegraph-knowledge-base-capability
Task: alembic-codegraph-knowledge-base-capability-cgk11-13-learning-responsibility-t3
Scope: CodeGraph learning decisions for AlembicCore and AlembicPlugin

## Purpose

This ledger converts the accepted CGK-0/CGK-0A Core and Plugin audit evidence
into implementation decisions for later CGK slices. It is not a task package,
not controller acceptance, and not product code authorization.

Each row binds a CodeGraph subsystem or pattern to:

- decision status: `reuse`, `adapt`, `defer`, or `reject`;
- current Alembic gap;
- owning repo/window;
- consumer;
- implementation slice;
- validation expectation;
- unresolved blocker.

## Evidence Policy

Use raw evidence first:

- Core TargetResultEnvelope:
  `.wakeflow-active/current/alembic-codegraph-knowledge-base-capability/target-results/tr-alembic-codegraph-knowledge-base-capability-cgk0-core-audit-t1.json`
- Plugin TargetResultEnvelope:
  `.wakeflow-active/current/alembic-codegraph-knowledge-base-capability/target-results/tr-alembic-codegraph-knowledge-base-capability-cgk0-plugin-audit-t2.json`
- Local code anchors listed in the target results.
- CodeGraph source references listed in the target results and requirement
  design.

Do not treat progress docs, status rows, or target summaries as acceptance.
They are navigation aids only.

## Decision Ledger

| CodeGraph subsystem or pattern | Decision | Alembic current gap | Owner | Consumer | Slice | Validation expectation | Unresolved blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MCP initialize playbook for source graph tool choice | Adapt | Plugin MCP servers advertise tools only; no source-graph initialize guidance. Evidence: `AlembicPlugin/lib/codex/mcp/CodexMcpServer.ts:241`, `AlembicPlugin/lib/codex/mcp/McpServer.ts:263`. | AlembicPlugin | Codex host agent | CGK-4, CGK-9 | MCP initialize/list-tools probe proves guidance is compact, visible-tool-aware, and excludes unimplemented tools. | Final source graph tool names and degraded states must be settled. |
| Fast static tool list and lazy heavy graph loading | Adapt | Plugin can list tools, but no source graph engine lifecycle exists. Evidence: `CodexMcpServer.ts:260-397`; Core has no stable source graph service export. | AlembicPlugin with Core producer contract | Codex, controller probes | CGK-2A, CGK-9 | Cold MCP startup exposes status/source tools without opening parsers/DB writers; source query opens graph lazily. | Core must provide stable source graph query/freshness services. |
| Local files/nodes/edges source graph schema | Adapt | Core has `code_entities` and `knowledge_edges`, but lacks file hash, mtime, indexed_at, parse errors, source ranges, generation, and separate source graph lifecycle. Evidence: `AlembicCore/src/infrastructure/database/drizzle/schema.ts:125`, `:340`. | AlembicCore | Plugin, future Agent, Dashboard | CGK-1, CGK-7 | Migration/repository fixture proves rebuild, clear, full query, incremental update, and generation metadata. | Decide dedicated tables versus versioned compatibility over existing tables. |
| Source file inventory and parser lifecycle | Adapt | `ProjectGraph` is bootstrap-time/read-only with default 500 files and 500 KB cap; ProjectIntelligenceRunner runs phased analysis, not a continuously fresh index. Evidence: `ProjectGraph.ts:1-25`, `:86`; `ProjectIntelligenceRunner.ts:532`. | AlembicCore | Source graph indexer/query service | CGK-2 | Full and incremental build fixtures cover include/exclude, unsupported language, large-file skip, parser failure, partial result. | First supported language set and parse coverage thresholds. |
| Call/data-flow relation materialization | Adapt | `CallGraphAnalyzer` supports full/incremental analysis; `CodeEntityGraph` materializes calls/data_flow into existing edge store, mixing source and knowledge graph semantics. Evidence: `CallGraphAnalyzer.ts:84-150`, `CodeEntityGraph.ts:837`. | AlembicCore | Query/ranking/impact, Plugin source tools | CGK-1, CGK-7, CGK-8 | Edge contract tests distinguish deterministic and heuristic edges, provenance, confidence, line/site metadata. | Edge taxonomy and migration from shared `knowledge_edges`. |
| Freshness, catch-up gate, pending file, stale banner | Adapt | Plugin ToolPolicy/KnowledgeState cover knowledge/sourceRefs/vector/bootstrap readiness but no sourceGraph lifecycle; FileChange services are Recipe/sourceRef impact oriented, not live source graph watchers. Evidence: `ToolPolicy.ts:246`, `KnowledgeState.ts:11`, `FileChangeHandler.ts:327`. | Core owns freshness DTOs; Plugin owns MCP runtime projection | Codex source graph tools, status | CGK-2, CGK-2A, CGK-9, CGK-15 | Post-edit probe shows pending/stale before sync, fresh after sync, and status remains callable on sync failure. | Decide whether first source query blocks on catch-up or returns degraded best-effort. |
| Worktree and ProjectScope mismatch warning | Adapt | ProjectScope exists, but source graph answer identity is not yet tied to worktree/index root/current folder semantics. | AlembicCore + AlembicPlugin | Multi-repo Codex sessions | CGK-15, CGK-16 | Wrong-root/worktree fixture fails closed or returns warning before source facts are trusted. | Exact identity fields in source graph status and query outputs. |
| `explore` as primary code-understanding tool | Adapt | Existing `alembic_graph` is knowledge graph; `alembic_call_context` is method call-context only and not source-range exploration. Evidence: `AlembicPlugin/lib/codex/mcp/tools.ts:236`; `handlers/structure.ts:381`, `:667`. | Core query service + Plugin MCP projection | Codex | CGK-3, CGK-8, CGK-17 | Representative AlembicPlugin/Core architecture questions answered by one or two source graph calls with line-numbered source sections. | Core source section and ranking contract. |
| Read-equivalent source node/file output | Adapt | No current Alembic tool returns current source lines with Read-equivalent semantics, staleness banner, and blast radius. | Core source retrieval + Plugin MCP | Codex editing/planning | CGK-3, CGK-17 | Tool output proves source lines are current or explicitly stale; includes safe line numbers and relevant dependents only. | Source freshness model and config/secret redaction rules. |
| Multi-signal source ranking and low-confidence handoff | Adapt | Core SearchEngine/MultiSignalRanker rank knowledge entries, not source files/symbols/source ranges. Evidence: `SearchEngine.ts:81`, `MultiSignalRanker.ts:258`. | AlembicCore | Plugin source tools, future Dashboard | CGK-8, CGK-15 | Ranking fixtures cover exact symbols, paths, co-location, graph connectivity, test/generated downranking, ambiguous symbols, and weak query handoff. | Source FTS/schema and query token model. |
| Tool-specific output budgets and allow-lists | Reuse + adapt | Plugin already has clean output contract and per-tool allow-lists; source graph tools need first-class schemas, not legacy projection cleanup. Evidence: `core-tools/output.ts:9`, `output-contract.ts:11`. | AlembicPlugin over Core DTOs | Codex, controller evidence review | CGK-17 | Negative tests inject unrelated refs, resident metadata, legacy fields, output budgets, and prove they are absent or rejected. | Final source tool DTO field set. |
| Affected-test and validation planning | Adapt | Core has call/data-flow pieces, but no Codex-facing changed-file to affected-test contract. | AlembicCore + AlembicPlugin | Controller, Codex, Test when needed | CGK-5 | Fixture maps changed files to must-run/recommended/unknown validation buckets with evidence and uncertainty. | Test ownership edge source and repo command discovery policy. |
| Alembic intent/prime/work/guard/decision lifecycle | Reuse | Alembic already has agent-public lifecycle tools. Replacing them with CodeGraph-style source tools would lose Alembic's project memory, Guard, and Decision flow. Evidence: `agent-public-tools.ts`, `public-tools/contract.ts`. | AlembicPlugin, shared contracts in Core where useful | Codex host agent, controller evidence | CGK-12, CGK-16 | End-to-end MCP probe preserves separate `intentRef`, `primeRef`, `sourceGraphRef`, `workRef`, `guardResultRef`, `decisionRef`. | Define source evidence ref shape and degraded-prime/source-graph interactions. |
| Recipe SourceRefs to source graph bridge | Adapt | `SourceRefReconciler` tracks Recipe source health; source graph node refs are not yet a proven bridge. Evidence: `SourceRefReconciler.ts:65`, `:206`, `:289`. | AlembicCore, Plugin projection | Prime, Guard, Dashboard later | CGK-12, CGK-16, CGK-17 | Prime can say when Recipe source refs are active/stale/unproven; source graph tools do not silently backfill Recipe provenance. | Bridge key: ProjectScope-qualified path plus source graph generation. |
| Agent adoption and sufficiency evaluation | Adapt | Plugin has targeted unit tests but no CodeGraph-style transcript harness measuring Read/Grep replacement and stale fallback. | AlembicPlugin + controller/Test as needed | Controller acceptance, future rollout | CGK-10, CGK-18 | Transcript parser reports first tool choice, source graph calls, raw Read/Grep/rg calls, stale fallback, final evidence quality. | Decide harness host and reproducible fixture corpus. |
| Dashboard visualization of source graph | Defer | Dashboard should not bind to unstable Plugin internals or draft source graph schemas. | AlembicDashboard later | Human reviewers, product UI | Post-Core/Plugin acceptance, CGK-13 gate | Dashboard work starts only after Core/Plugin source graph contracts pass MCP evidence. | Stable read model and accepted source graph status contract. |
| Git-hook-like checkpoint fallback | Defer + adapt later | CodeGraph's hook fallback is useful, but hook mutation is user-visible and must not be silent. | Core policy + Plugin installer/runtime | Local dev environments without watcher | CGK-2A, CGK-9 only after watcher policy | Dry-run/consent/uninstall tests; no blocking hook failures. | User/controller decision on hook-like integration. |
| Copying CodeGraph storage/runtime implementation directly | Reject | Alembic has existing Core/Plugin/Wakeflow ownership, ProjectScope, Recipe/Guard/Decision lifecycles, and clean output contracts. | No owner | None | Non-goal | No validation needed beyond architecture review. | None. |
| Moving Core extraction/storage/watchers into Plugin | Reject | Target evidence explicitly shows Plugin should depend on Core producer contracts and keep host/MCP orchestration boundaries. | No owner | None | Non-goal | Architecture contract forbids this drift. | None. |
| Preserving old broken MCP compatibility fields | Reject | User-confirmed non-goal; existing clean output direction should be strengthened. | No owner | None | CGK-17 negative tests | Contract tests reject old generic fields and unrelated refs. | None. |

## Required Producer/Consumer Order

1. Core source graph contracts and storage decisions must precede Plugin
   Read-equivalent source tools.
2. Plugin may add degraded source graph status and initialize guidance only when
   the guidance is generated from actually visible tools.
3. Lifecycle ref fusion can be designed before source graph implementation, but
   runtime-ready probes must wait for source graph refs and freshness semantics.
4. Dashboard visualization waits until Core/Plugin source graph contracts are
   accepted by controller review.
5. Transcript-governed rollout starts after the first end-to-end MCP path proves
   source graph usefulness, then continues as optimization input.

## Implementation-Wave Recommendations

Immediate next waves after CGK-11/CGK-13 review:

1. CGK-1 + CGK-7 in AlembicCore:
   define `SourceGraphContracts`, source graph storage choice, migrations, and
   repository APIs.
2. CGK-15 + CGK-17 across Core/Plugin:
   define boundary states and tool-specific clean output schemas before any
   source graph MCP tool can claim ready behavior.
3. CGK-2 + CGK-2A:
   implement full/incremental build and Plugin cold-start/catch-up orchestration
   against the Core contract.
4. CGK-3 + CGK-8:
   implement source graph explore/node/search/call/impact retrieval with ranking
   and source sections.
5. CGK-12 + CGK-16:
   fuse intent/prime/work/finish/guard/decision refs with source graph evidence.
6. CGK-10 + CGK-18:
   prove behavior through transcript and stale/freshness scenarios before wider
   Dashboard/Agent rollout.

## Residual Risks

- The existing Core graph data is useful but may tempt implementation to reuse
  `knowledge_edges` for source graph lifecycle too long.
- The existing Plugin clean-output projector may tempt implementation to filter
  legacy payloads instead of defining first-class source graph output schemas.
- CodeGraph-style guidance can conflict with Alembic skills if duplicated in
  multiple surfaces; Plugin initialize guidance should be the live MCP playbook,
  while skills should stay role/governance oriented.
- A first successful `alembic_code_explore` probe is not enough acceptance; CGK-18
  must watch whether Codex actually stops broad Read/Grep exploration.

## Source References

- `.wakeflow-active/current/alembic-codegraph-knowledge-base-capability/target-results/tr-alembic-codegraph-knowledge-base-capability-cgk0-core-audit-t1.json`
- `.wakeflow-active/current/alembic-codegraph-knowledge-base-capability/target-results/tr-alembic-codegraph-knowledge-base-capability-cgk0-plugin-audit-t2.json`
- `AlembicCore/src/core/ast/ProjectGraph.ts:1`
- `AlembicCore/src/core/analysis/CallGraphAnalyzer.ts:84`
- `AlembicCore/src/service/knowledge/CodeEntityGraph.ts:214`
- `AlembicCore/src/infrastructure/database/drizzle/schema.ts:125`
- `AlembicCore/src/infrastructure/database/drizzle/schema.ts:340`
- `AlembicCore/src/service/search/SearchEngine.ts:81`
- `AlembicCore/src/service/knowledge/SourceRefReconciler.ts:65`
- `AlembicPlugin/lib/codex/mcp/CodexMcpServer.ts:241`
- `AlembicPlugin/lib/codex/mcp/tools.ts:236`
- `AlembicPlugin/lib/codex/ToolPolicy.ts:246`
- `AlembicPlugin/lib/codex/mcp/core-tools/output.ts:9`
- `https://github.com/colbymchenry/codegraph`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/mcp/server-instructions.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/mcp/tools.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/sync/watcher.ts`
