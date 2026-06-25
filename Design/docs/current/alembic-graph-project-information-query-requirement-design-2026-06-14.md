# Alembic Graph Project Information Query Requirement Design

## Metadata

- Design Key: `alembic-graph-project-information-query-requirement-design-2026-06-14`
- Status: Design requirement design candidate under review; independent demand candidate; needs controller intake
- Owner Window: Design
- Receiving Window: Wakeflow
- Date: 2026-06-14
- User intent: completely redesign `alembic_graph` by learning deeply from `colbymchenry/codegraph`, and make it a mature project information query capability.
- Boundary: this document is not a task package, not dispatch, not acceptance, and not a mutation of the current semantic-quality demand.
- Current-demand relation: independent from `alembic-knowledge-context-four-tools-semantic-quality-validation`; do not merge this into the active semantic-quality validation root without controller intake and user confirmation.
- User refinement: the basic project information support layer should be an
  independent folder patterned after `project-knowledge-context`, but its
  canonical implementation must not be owned by Plugin if Alembic main
  cold-start also consumes it. The shared headless layer belongs in Core; Plugin
  and Alembic main provide adapters.

## Design Self-Review Corrections

This section records the second-pass review after the user warned that earlier
Design decisions may be wrong. These corrections override looser language in
this document until controller intake and code-fact research confirm otherwise.

### Corrections

- Do not redesign `alembic_graph` as a universal source graph tool. Current
  Plugin guidance already has dedicated source graph tools:
  `alembic_source_graph_status`, `alembic_code_explore`,
  `alembic_symbol_search`, `alembic_source_node`, `alembic_callers`,
  `alembic_callees`, `alembic_code_impact`, `alembic_affected_tests`, and
  `alembic_validation_plan`.
- `alembic_graph` should remain the bounded project-internal relationship view
  unless controller research explicitly decides to merge or retire dedicated
  source graph tools. It may summarize source graph availability and link to
  source graph detail tools, but should not duplicate every source graph
  operation by default.
- The basic project information layer should be Core-owned if Alembic main
  cold-start consumes it. Plugin must not become the implementation owner for a
  capability that main also needs.
- A new Core folder is still a candidate, not a final file-path mandate. Because
  Core already has `project-intelligence`, `source-graph`, and `cold-start`
  surfaces, implementation research must decide whether the right shape is a
  new Core `project-information-context` facade or an extension/projection of
  existing Core project-intelligence and source-graph modules.
- Do not add a second source graph storage model, watcher, freshness system, or
  relation schema unless a code-fact scan proves current Core contracts cannot
  support the needed projection.
- "Impact radius" must be split into project-level relation impact and
  source-code impact. Source-code impact belongs to the dedicated source graph
  path unless controller decides otherwise.
- "Likely tests" and validation plans are advisory routing outputs, not
  acceptance proof. They should prefer existing `alembic_validation_plan` /
  source graph validation contracts where possible.
- `alembic_project_matrix` remains the first project overview tool. Do not
  create an `orient` operation in `alembic_graph` that duplicates matrix unless
  it is explicitly defined as relationship-focused and materially different.

### Decisions Downgraded To Research Questions

- Exact Core export name: `@alembic/core/project-information` is a candidate,
  not confirmed.
- Exact Core folder: `src/service/project-information-context/` is a candidate,
  not confirmed.
- Public `alembic_graph` operations beyond current
  `query/impact/path/stats/neighborhood` are candidates, not confirmed.
- Whether cold-start needs a new main-repo tool adapter or can consume an
  existing Core cold-start/project-intelligence projection is not confirmed.
- Whether agent-efficiency telemetry belongs in Core, Plugin, Test harness, or
  controller evidence is not confirmed.

## Problem

`alembic_graph` should not remain a thin graph/statistics endpoint or a bounded
project scan. The user wants it redesigned as a project information support
capability: Codex should be able to ask structural and code-relationship
questions and receive useful project facts, source graph relationships,
freshness state, impact radius, and next reads without first running broad
filesystem search.

The current Alembic direction already separates Recipe knowledge from project
internal structure, and the four-tool design already says `alembic_graph`
belongs to project-internal structure. This new demand goes further. It asks
for `alembic_graph` to become the project information query entrypoint backed
by a mature support layer, with CodeGraph-style agent efficiency and local
pre-indexed code graph behavior.

The gap is not "Alembic has no graph". Alembic has source graph and project
structure pieces. The gap is that those pieces must be integrated into a
Codex-facing project information layer that is graph-first, fresh, budgeted,
traceable, and strong enough to reduce repeated file reads and tool calls.

## Goal

Redesign `alembic_graph` as `Project Information Graph Query`: a read-only MCP
tool capability for local project facts, source graph relationships, and
impact-oriented project navigation.

The final user-visible behavior is:

- Codex can call `alembic_graph` first for bounded project structure and
  relationship questions, then follow returned refs or next tool hints into
  dedicated source graph tools for exact symbol, call, import, source-node, and
  validation questions.
- The result is backed by local pre-indexed source graph facts whenever fresh.
- The output contains project identity, freshness, relevant nodes, typed
  relations, source evidence refs, project-level impact radius, validation-tool
  routing hints when relevant, and the smallest suggested follow-up reads.
- Graph freshness and stale-file boundaries are explicit. A stale or partial
  graph never pretends to be ready.
- `alembic_graph` helps Codex avoid broad `rg`, `Read`, `Glob`, and repeated
  source exploration loops.
- Recipe/knowledge graph relationships stay out of public `alembic_graph`;
  they remain under `alembic_search` and `alembic_prime` as knowledge context.

## Final Completion Definition

Wakeflow may consider this demand complete only when evidence shows:

- A public `alembic_graph` contract exists for project information queries, not
  Recipe/knowledge graph traversal.
- A real internal support layer coordinates project metadata, source graph,
  symbol, call, import, impact, freshness, output budgeting, and detail refs.
- Core-owned source graph facts are the preferred source for symbol/call/import
  relations; Plugin does not rely on per-call broad scans as the normal path.
- The basic project information support layer is a Core-owned headless
  capability, exported through a stable Core subpath, not a Plugin-owned
  implementation.
- Freshness status covers fresh, stale, partial, degraded, pending sync,
  unsupported files, wrong root, and index-version mismatch.
- Tool guidance tells Codex to use graph tools before broad file reading, while
  still requiring raw reads for stale or non-indexed files.
- The same Core project information layer is usable through Plugin MCP adapters
  for host agents and through Alembic main tool adapters for cold-start flows.
- Real Alembic project MCP scenarios prove the redesigned tool reduces file
  reads/tool calls while preserving answer correctness.
- Validation distinguishes graph-assisted evidence from final correctness
  evidence. Tests, typecheck, lint, Guard, or Test-window scenarios remain the
  acceptance floor for implementation changes.

## Non-goals

- Do not implement product code from this Design document.
- Do not mutate Wakeflow current status, active state roots, TODOs, dispatch
  groups, task packages, or target backfills.
- Do not merge this requirement into the active four-tool semantic-quality
  demand by default.
- Do not turn `alembic_graph` into a Recipe graph, knowledge graph, or knowledge
  coverage evaluator.
- Do not replace `alembic_project_matrix`; project matrix remains the high-level
  orientation map, while graph is the relationship and impact query surface.
- Do not treat graph output as final proof of behavior without source
  verification and relevant validation.
- Do not build a thin adapter over existing handlers and call that complete.
- Do not add network-dependent runtime behavior. The graph capability is
  local-first.
- Do not leak secrets, raw config values, real thread ids, or private absolute
  machine details in tool output.

## Primary Actors

- Host agent, currently Codex: chooses tools and needs compact, reliable
  project facts before reading files.
- Developer: reads graph output and expects it to explain next code or test
  steps without hiding uncertainty.
- AlembicCore: owns source graph indexing, storage, freshness, query contracts,
  deterministic graph facts, and the consumer-neutral basic project information
  support layer.
- AlembicPlugin: owns MCP schema, tool descriptions, runtime guidance, public
  output projection, and Codex/host-agent ergonomics over Core contracts.
- Alembic main: owns CLI/daemon/local cold-start tool adapters over Core
  contracts.
- Wakeflow controller: reviews this as an independent demand candidate and
  decides whether to create state roots, phase order, and task packages.
- Test window, if assigned later: validates real-scenario agent efficiency and
  graph correctness under controller boundaries.

## User Stories

- As Codex, I can ask "how does this feature flow through the project?" and get
  entrypoints, relevant project areas, bounded relations, and source graph refs
  without scanning the whole repository.
- As Codex, I can ask "what calls this symbol?" and receive either a graph-level
  route to the relevant project node or a next tool hint to `alembic_callers`,
  with freshness requirements made explicit.
- As Codex, I can ask "what depends on this file?" and get import/dependency
  relations with affected modules and the right next source graph or validation
  tool when likely tests are needed.
- As Codex, I can ask "if I change this file or symbol, what is the impact
  radius?" and get a bounded traversal, unknown edges, risk notes, and
  validation recommendations.
- As Codex, I can request graph context for a node and then use
  `alembic_source_node` for read-equivalent source detail when freshness allows
  it.
- As a developer, I can see when the graph is stale or partial and understand
  which exact files need raw reads.
- As a controller, I can judge whether graph answers came from current source
  graph evidence, bounded fallback scan, or inference.

## Proposed Behavior

### Reinterpreted Tool Responsibility

`alembic_graph` becomes a project information relationship query tool.

It should answer:

- project-internal node and relation questions;
- bounded source graph availability and coverage summary questions, while
  deferring authoritative freshness to `alembic_source_graph_status`;
- project-level symbol/file/module relation questions, while routing exact
  symbol definition/reference/call/import questions to dedicated source graph
  tools when appropriate;
- relationship path and neighborhood questions;
- project-level impact radius questions;
- graph statistics and coverage questions.

It should not answer:

- Recipe relationship traversal;
- knowledge coverage or missing-knowledge analysis;
- project overview that belongs to `alembic_project_matrix`;
- lifecycle writes, usage confirmation, Guard acceptance, or Wakeflow dispatch;
- full source dumps by default.

### CodeGraph Lessons To Adapt

The CodeGraph reference is valuable because it treats graph capability as a
local project information layer for agents, not just as a search command.
Alembic should adapt these points:

| CodeGraph lesson | Alembic adaptation |
| --- | --- |
| Local pre-indexed graph reduces repeated file exploration. | Core source graph becomes the preferred data source for `alembic_graph`; Plugin fallback scans are degraded paths. |
| Agents query symbol relationships, call graphs, and code structure before scanning files. | MCP guidance and tool descriptions tell Codex to use graph-first for code relationship questions. |
| Initialization creates local graph storage and builds the graph. | Alembic separates runtime ready, knowledge synced, source graph initialized, source graph indexed, and source graph fresh. |
| Auto-sync keeps graph current through file changes. | Alembic exposes freshness, pending sync, stale files, and manual or controller-approved refresh actions. |
| Impact analysis traces callers, callees, and full impact radius. | Core project information can support impact reasoning, but public projection should split project-level graph impact from source-code `alembic_code_impact` and validation-plan tools. |
| Output is sized to the question, not the file count. | `BudgetedContextBuilder` returns summary, source refs, relation paths, and targeted reads rather than long raw file dumps. |
| Benchmarks measure fewer tool calls and fewer file reads. | Acceptance must include A/B or transcript-based evidence showing fewer raw read/search calls in real Alembic scenarios. |
| Graph is local assistance, not correctness proof. | Alembic output always separates graph facts, freshness, diagnostics, and required validation. |

### Public Operations

The current public `alembic_graph` baseline should not be expanded casually.
Existing Plugin skills and handlers already describe it as a bounded
project-internal structure/source/dependency relation tool with operations such
as `query`, `neighborhood`, `path`, `impact`, and `stats`. Dedicated source
graph tools already own source freshness, symbol search, source node reads,
callers, callees, code impact, affected tests, and validation planning.

Recommended public operation model:

| Operation | Public status | Purpose | Typical required input | Output focus |
| --- | --- | --- | --- | --- |
| `query` | Keep and improve. | Natural-language or structured project relation query. | `query`, optional `activeFile`, `language`, `scope`. | Relevant project/source nodes, bounded relations, source refs, confidence, next tool hints. |
| `neighborhood` | Keep and improve. | Local project graph around a node. | `nodeId`, `direction`, `relationType`, `maxDepth`. | Bounded neighbors, typed edges, truncation reason. |
| `path` | Keep and improve. | Relationship path between two project/source nodes. | `fromId`, `toId`, optional `relationType`. | Shortest or ranked relation paths, unknown gaps, confidence. |
| `impact` | Keep, but define scope carefully. | Project-level impact radius from project/source nodes. | `nodeId`, `activeFile`, bounded `maxDepth`. | Affected project areas, relation radius, risk notes, next source graph or validation tool. |
| `stats` | Keep and improve. | Project graph size, relation inventory, and coverage summary. | `projectRoot`. | Counts by node/edge/status and source graph availability summary. |

Do not add these as public `alembic_graph` operations without controller
confirmation:

| Candidate | Better current owner | Reason |
| --- | --- | --- |
| `orient` | `alembic_project_matrix` plus graph `stats/query` when relation detail is needed. | Avoid duplicating the matrix overview role. |
| `freshness` | `alembic_source_graph_status`. | Freshness gate already has a dedicated tool and must stay authoritative. |
| `node` | `alembic_source_node` for source nodes; graph `neighborhood` for relation context. | Read-equivalent source detail already has a dedicated tool. |
| `callers` | `alembic_callers`. | Dedicated tool is clearer and can enforce source graph freshness. |
| `callees` | `alembic_callees`. | Dedicated tool is clearer and can enforce source graph freshness. |
| `imports` | Source graph explore/search or a future dedicated import relation tool. | Do not hide import-specific freshness and resolution limits under graph. |
| source-code `impact` | `alembic_code_impact` / `alembic_validation_plan`. | Keep source-code blast radius and validation advice on the source graph path. |

### Input Contract

`alembic_graph` should share the base four-tool input fields where useful, but
its public schema should stay focused on bounded project relations. Source-code
freshness, source-node read, callers/callees, affected tests, and validation
planning should remain on the dedicated source graph tool path unless
controller intake explicitly changes that boundary.

| Field | Meaning | Requirement |
| --- | --- | --- |
| `projectRoot` | Target repository root. | Required in multi-repo ambiguity; otherwise resolved fail-closed. |
| `repoId` | Optional configured repo/window identity. | Used to prevent sibling repo leakage. |
| `operation` | One of the graph operations. | Required; default may be `query` only for backward-compatible natural-language calls. |
| `query` | Natural-language or symbol/file query. | Used by `query` and project-level `impact`; exact callers/callees/imports route to dedicated source graph tools. |
| `nodeId` | Stable graph node id. | Used by `neighborhood`, `path`, and project-level `impact`; source node reads and callers/callees use dedicated source graph tools. |
| `fromId` / `toId` | Path endpoints. | Used by `path`. |
| `activeFile` | Current file hint. | Must be root-checked. |
| `changedFiles` | Changed source file set. | Not a default public `alembic_graph` field; use `alembic_code_impact` or validation planning unless controller confirms project-level graph impact input. |
| `relationType` | Edge filter. | Supports `contains`, `defines`, `references`, `calls`, `imports`, `exports`, `dependsOn`, `entrypointFor`, and later typed extensions. |
| `direction` | `incoming`, `outgoing`, or `both`. | Used for neighborhoods and relation filtering. |
| `maxDepth` | Traversal bound. | Required default; outputs must show truncation. |
| `budget` | Token/item/source-range budget. | Controls nodes, edges, snippets, refs, nextActions. |
| `freshnessPolicy` | `preferFresh`, `allowStaleSummary`, or `failIfStale`. | Candidate only. If source freshness is authoritative, `alembic_source_graph_status` remains the first tool. |
| `include` | Optional families to include. | Examples: `diagnostics`, `sourceGraphSummary`, `nextToolHints`; avoid default full source ranges or likely tests. |

### Output Contract

The Core support layer should return a consumer-neutral project information
result. Plugin may project it into an MCP `alembic_graph` envelope, but Core
types should not contain MCP tool names, Codex wording, or Plugin-only fields.

```text
Core ProjectInformationResult
  ├─ ok
  ├─ status
  ├─ operation
  ├─ summary
  ├─ project
  │   ├─ root
  │   ├─ repoId
  │   ├─ windowIdentity
  │   ├─ languageSummary
  │   └─ boundaryConfidence
  ├─ freshness
  │   ├─ status
  │   ├─ generationId
  │   ├─ indexedAt
  │   ├─ pendingFiles
  │   ├─ staleFiles
  │   ├─ degradedFiles
  │   └─ safeToTrustScope
  ├─ questionInterpretation
  ├─ nodes[]
  ├─ relations[]
  ├─ paths[]
  ├─ projectImpact
  ├─ sourceEvidenceRefs[]
  ├─ detailRefs[]
  ├─ diagnostics[]
  ├─ nextActions[]
  └─ efficiency
      ├─ suggestedReads
      ├─ avoidedBroadReadsEstimate
      ├─ rawReadFallbackRequired
      └─ fallbackReason
```

Plugin MCP projection may add:

```text
AlembicGraphMcpOutput
  ├─ tool = alembic_graph
  ├─ operation
  ├─ content summary
  ├─ structuredContent = projected ProjectInformationResult
  └─ MCP diagnostics / annotations / next tool hints
```

Output rules:

- `content` should contain only a compact human summary.
- `structuredContent` carries the machine-readable result.
- `relations[]` must include `type`, `from`, `to`, `provenance`,
  `confidence`, and `freshness`.
- `sourceEvidenceRefs[]` should identify exact files/ranges when graph freshness
  allows it, but full source-node reads remain on the source graph tool path.
- `diagnostics[]` must not be mixed into business facts.
- `efficiency` is an acceptance-supporting signal and may belong in Plugin/Test
  evaluation artifacts rather than Core public output if code research finds
  that Core should stay telemetry-free.

### Project Information Support Layer

Create an independent Core-owned `ProjectInformationContext` folder, patterned
after the implementation logic of Plugin's `project-knowledge-context`, instead
of placing the basic project information layer inside Plugin. This layer is not
itself a public MCP tool and not a Plugin service. It is a reusable headless
Core service boundary that Plugin can project into `alembic_graph` for host
agents and Alembic main can call from cold-start flows through its own tool
adapter.

The placement decision is important:

- Core already owns shared headless capabilities, source graph contracts,
  project intelligence, cold-start workflow contracts, path/io, storage, and
  deterministic analysis.
- Plugin owns Codex MCP, tool schema, skill text, marketplace/runtime packaging,
  and host-agent projection.
- Alembic main owns CLI, daemon, HTTP/API, local runtime, and host-owned tool
  adapters for its own cold-start.
- Therefore the project information support layer belongs in Core; Plugin and
  Alembic main depend on it through `@alembic/core`, not on each other.

The key design decision is consumer separation:

- Shared Core provider: both consumers use the same contracts, freshness model,
  project root resolver, source graph provider, budgeter, refs, and diagnostics
  from Core.
- Host-agent MCP consumer: Plugin `alembic_graph` and related MCP outputs use a
  host-neutral MCP adapter over the Core project information layer.
- Alembic main cold-start consumer: bootstrap, onboarding, or mission-briefing
  flows use an Alembic-owned tool adapter over the same Core layer to collect
  project identity, graph readiness, source relationships, and first-step
  context.
- Projection difference: MCP output optimizes for host-agent tool choice and
  structuredContent; cold-start output optimizes for Alembic's own readiness,
  bootstrap state, and tool-driven project briefing.

Candidate Core shape if code-fact research confirms a new facade is needed.
If existing `project-intelligence` plus `source-graph` can provide the same
consumer-neutral projection cleanly, prefer extending those existing Core
surfaces over creating a parallel analysis layer:

```text
AlembicCore/src/service/project-information-context/
├── contracts/
│   ├── ProjectInformationInput.ts
│   ├── ProjectInformationOutput.ts
│   ├── ProjectInformationOperation.ts
│   ├── ProjectInformationNode.ts
│   ├── ProjectInformationRelation.ts
│   ├── ProjectInformationFreshness.ts
│   ├── ProjectInformationImpact.ts
│   ├── ProjectInformationRefs.ts
│   └── ProjectInformationDiagnostics.ts
├── layer/
│   ├── ProjectInformationContextLayer.ts
│   ├── ProjectInformationQueryPlanner.ts
│   ├── ProjectInformationOutputProjector.ts
│   └── ProjectInformationEfficiencyTelemetry.ts
├── providers/
│   ├── ProjectRootResolver.ts
│   ├── ProjectMetadataProvider.ts
│   ├── SourceGraphProvider.ts
│   ├── SymbolRelationProvider.ts
│   ├── CallRelationProvider.ts
│   ├── ImportDependencyProvider.ts
│   ├── ImpactRadiusProvider.ts
│   ├── LikelyTestsProvider.ts
│   └── FreshnessProvider.ts
└── support/
    ├── BudgetedContextBuilder.ts
    ├── DetailRefBuilder.ts
    ├── RelationRanker.ts
    ├── SourceRangeSelector.ts
    └── GraphFallbackPolicy.ts
```

Candidate Core package export if a new public subpath is justified:

```text
@alembic/core/project-information
```

Candidate consumer adapters, subject to code-fact confirmation:

```text
AlembicPlugin/lib/service/project-knowledge-context/project/
  ├── CoreProjectInformationGraphAdapter.ts
  └── ProjectGraphProvider.ts

AlembicPlugin/lib/runtime/mcp/handlers/
  └── graph.ts

Alembic/lib/tools/adapters/
  └── ProjectInformationToolAdapter.ts

Alembic/lib/workflows/cold-start/
  └── ColdStartWorkflow.ts
```

Relationship to Plugin `project-knowledge-context`:

- `project-information-context` is a Core service folder, not a Plugin sibling
  folder and not a child implementation detail of `project-knowledge-context`.
- `project-knowledge-context` may depend on project information summaries when
  `prime`, `search`, or `project_matrix` need source/project facts.
- Core `project-information-context` must not depend on Plugin, MCP types,
  Codex skills, Recipe candidate ranking, or Plugin `project-knowledge-context`.
- Shared primitives such as refs, freshness, budget, and output status may be
  aligned by contracts, but the source of reusable project information truth is
  Core.

Layer responsibilities:

- Resolve the correct repo/window/root before graph access.
- Use Core source graph services for indexed files, symbols, edges, and
  freshness.
- Use project metadata for package scripts, entrypoints, test roots, framework
  hints, and repo boundaries.
- Map natural-language graph questions to graph query plans.
- Rank nodes and relations by symbol exactness, text relevance, path relevance,
  graph connectivity, source freshness, and task context.
- Select minimal source ranges and detail refs instead of dumping files.
- Compute bounded project-level impact radius, and link to existing source graph
  validation/affected-test contracts for likely tests instead of inventing a
  second test-selection truth.
- Emit freshness, degraded state, and fallback advice in every result.
- Track whether the result avoided broad file reading for acceptance evidence.
- Serve both Plugin MCP callers and Alembic main cold-start callers without
  duplicating graph query logic or changing freshness semantics per consumer.

### Dual Consumer Contract

The same Core support layer must expose one consumer-neutral business contract.
Adapters in Plugin and Alembic main project that contract into their local tool
surfaces.

| Consumer | Owner | Entry | Output projection | Must include | Must not do |
| --- | --- | --- | --- | --- | --- |
| Host agent through MCP | AlembicPlugin | `alembic_graph` handler and related MCP guidance. | `structuredContent` plus compact visible summary. | Tool operation, graph facts, freshness, source refs, next tool actions, efficiency hints. | Mutate cold-start state, run lifecycle bootstrap, claim acceptance. |
| Alembic main cold-start through tools | Alembic | `ProjectInformationToolAdapter` or equivalent main-repo tool route. | Cold-start project briefing/tool result. | project identity, graph initialized/indexed/fresh state, indexed coverage, source relation availability, bootstrap next actions. | Depend on Plugin, pretend MCP host context exists, rely on user prompt text, or bypass root/trust checks. |
| Shared support layer | AlembicCore | `ProjectInformationContextLayer`. | Consumer-neutral DTOs. | nodes, relations, impact, freshness, diagnostics, refs, budget metadata. | Contain MCP-only prose, Recipe ranking, Wakeflow dispatch, Plugin runtime, CLI interaction, or acceptance decisions. |

Cold-start use cases:

- Determine whether a target repository has a usable source graph during
  Alembic onboarding.
- Build a project briefing from actual project metadata and source graph state.
- Tell Alembic which graph capabilities are ready, stale, partial, or missing.
- Provide tool-readable next actions such as initialize source graph, run
  incremental sync, inspect stale files, or query key entrypoints.
- Feed later Recipe production or bootstrap planning with source facts, while
  keeping Recipe knowledge freshness separate from source graph freshness.

MCP use cases:

- Let Codex answer code-relationship questions without broad file reads.
- Let Codex retrieve graph node/source refs as targeted follow-up context.
- Let Codex plan impact and validation without claiming final acceptance.
- Let Codex see stale-file warnings and read only the named stale files.

### Data Model Requirements

Do not create a second graph schema by default. Core already has
`SourceGraphContracts` with freshness states, snapshot statuses, file
classifications, parse statuses, edge provenances, operation kinds, diagnostics,
detail refs, and validation-plan buckets. The project information layer should
reuse or project those contracts first. New DTOs are allowed only where they
serve consumer-neutral project information output and do not duplicate source
graph truth.

Core source graph or project information contracts should provide at least:

| Entity | Required fields |
| --- | --- |
| Source file | path, repo id, language, content hash, size, mtime, indexed time, parse status, generated/test/config flags. |
| Symbol node | stable id, name, kind, file, source range, signature, export/visibility flags, owning parent, language, confidence. |
| Relation edge | stable id, type, from, to, source range if available, provenance, confidence, resolver, generation id. |
| Import edge | import path, resolved target, alias, export/re-export status, package/internal classification. |
| Call edge | caller, callee, call site, direct/heuristic/unresolved classification, dynamic-dispatch notes. |
| Generation | generation id, index version, created time, repo root, ignored rules summary, coverage stats. |
| Freshness record | pending files, stale files, deleted files, unsupported files, parse failures, watcher status, catch-up status. |

Candidate project information projection node types:

- `project`
- `package`
- `target`
- `module`
- `directory`
- `file`
- `symbol`
- `entrypoint`
- `test`
- `route`
- `externalPackage`
- `sourceGraphGeneration`

Candidate project information projection relation types:

- `partOf`
- `ownsFile`
- `definesSymbol`
- `referencesSymbol`
- `calls`
- `calledBy`
- `imports`
- `exports`
- `dependsOn`
- `entrypointFor`
- `tests`
- `affectedBy`
- `routesTo`
- `implements`
- `inherits`
- `conforms`

Heuristic or framework-specific edges must be marked as such. They may help
ranking and impact, but cannot be presented as deterministic proof.

### Freshness And Auto-Sync Semantics

Freshness is part of the product contract, not a diagnostic afterthought.

Required statuses should align with the existing Core source graph freshness
contract instead of inventing a second lifecycle vocabulary:

| Status | Meaning | Tool behavior |
| --- | --- | --- |
| `uninitialized` | No source graph generation exists for the requested scope. | Return project metadata only and recommend source graph initialization when that is the correct lifecycle route. |
| `opening` | Source graph runtime is opening storage or project state. | Return bounded metadata or wait only if the caller's policy allows a short bounded gate. |
| `catching-up` | Project opened and catch-up sync is running. | Tool may wait on a bounded gate or return partial with exact pending files. |
| `fresh` | Indexed generation matches current files for requested scope. | Relationship and source refs may be trusted as graph facts. |
| `pending` | Watcher or file dispatcher saw changes not yet indexed. | Output marks affected files and suggests raw reads for those files only. |
| `stale` | Requested files differ from indexed generation. | `failIfStale` blocks; `allowStaleSummary` returns limited structural summary. |
| `partial` | Some languages/files unsupported or parse-degraded. | Output identifies supported and unsupported coverage. |
| `degraded` | Source graph unavailable but bounded fallback can answer something. | Result must say fallback scan was used and cannot claim full graph certainty. |
| `unavailable` | Source graph service or storage is unavailable. | Return actionable lifecycle guidance or bounded project metadata, marked degraded. |
| `wrong-scope` | Requested root/worktree does not match indexed scope. | Return actionable error, not best-effort wrong-repo facts. |

Auto-sync expectations:

- The source graph indexer should support full build and incremental sync.
- File changes should be reconciled by content hash or equivalent, not only by
  git status.
- Watcher or dispatcher pending lists should be visible to freshness output.
- First tool call after project open may wait on a bounded catch-up gate.
- Sync failure should leave pending files marked stale rather than clearing
  them optimistically.
- Manual or controller-approved rescan remains a separate lifecycle capability;
  `alembic_graph` should not silently mutate index state unless the final
  product contract explicitly allows a read-time catch-up service.

### Impact Radius Semantics

Impact must be split by ownership.

| Layer | Owner | Scope | Output |
| --- | --- | --- | --- |
| Project-level graph impact | `alembic_graph(operation=impact)` if retained. | Bounded project nodes, packages, modules, files, source graph refs, and relation radius. | Affected project areas, relation paths, unknown edges, and next source graph or validation tool. |
| Source-code impact | `alembic_code_impact` or equivalent dedicated source graph tool. | Changed files, symbols, callers/callees, import/export dependents, source edges. | Affected files/symbols with freshness, provenance, confidence, and source refs. |
| Validation planning | `alembic_validation_plan` and repository checks. | Test files, repo commands, Guard/manual review buckets. | Advisory validation recommendations; not acceptance proof. |

`alembic_graph impact` must not become a shadow implementation of
`alembic_code_impact`. It should help route from project relation context to the
right source graph and validation tools. If controller later decides to merge
these surfaces, that must be a separate explicit tool-surface decision with
consumer migration and tests.

### Agent Guidance

MCP initialize guidance and tool descriptions must reinforce the new behavior:

- Use `alembic_project_matrix` for first project overview and navigation.
- Use `alembic_source_graph_status` before current source-code fact queries
  where freshness or scope matters.
- Use dedicated source graph tools such as `alembic_code_explore`,
  `alembic_symbol_search`, `alembic_source_node`, `alembic_callers`,
  `alembic_callees`, `alembic_code_impact`, and `alembic_validation_plan` for
  exact source facts when those tools are visible.
- Use `alembic_graph query/neighborhood/path/impact/stats` for bounded
  project-internal structure/source/dependency relations and relation routing.
- Use graph/source detail refs for targeted follow-up reads.
- Fall back to raw reads only for non-indexed files, stale files named by the
  result, generated/config files outside graph scope, or low-confidence graph
  answers.
- Use `alembic_search` and `alembic_prime` for Recipe, standards, prior
  decisions, and project memory.
- Do not treat graph results as validation; run repository checks, Guard, or
  Test scenarios for behavior acceptance.

Tool guidance must be generated from the actual visible tool catalog. It should
not mention disabled or absent source graph tools.

## Implementation Decisions

### Repository Responsibility

| Window / Repository | Role | Expected change | Upstream dependency | Downstream consumer |
| --- | --- | --- | --- | --- |
| Design | Requirement detail only. | This document. | User confirmation. | Wakeflow controller intake. |
| AlembicCore | Source graph product spine and shared project information facade/projection. | Index, storage, freshness, query services, project information projection or `src/service/project-information-context/` if justified, package export if justified, contracts, tests. | Controller-created state root. | AlembicPlugin MCP adapter, Alembic main cold-start/tool adapter, future consumers. |
| AlembicPlugin | MCP graph projection over Core project information. | Schema, handler, project root handoff, MCP guidance, output projection, Codex/host adapter. | Core `@alembic/core/project-information` or agreed export. | Host agents using MCP. |
| Alembic main / cold-start consumer | Uses Core project information through its own tool route during onboarding or bootstrap. | Main-repo tool adapter and cold-start integration only if controller accepts this scope; no Plugin dependency. | Core project information contracts and source graph contracts. | Alembic onboarding, bootstrap, mission briefing, Recipe production planning. |
| Test | Real-scenario validation if assigned. | Agent-efficiency and freshness/impact validation. | Controller handoff after implementation evidence. | Controller acceptance. |
| Wakeflow | Intake, task slicing, dispatch, acceptance. | State root and review only if promoted. | User/controller decision. | Product windows. |

### Core / Plugin Split

Core should own:

- the consumer-neutral project information facade/projection; this may be an
  independent `project-information-context` service folder only if G0 proves
  existing `project-intelligence` and `source-graph` surfaces are not enough;
- consumer-neutral project information contracts, DTOs, refs, freshness,
  diagnostics, budget, and query planning;
- graph storage and migrations;
- full and incremental source indexing;
- parser coverage and degraded accounting;
- file/symbol/edge/query DTOs;
- freshness inspection;
- source graph callers/callees/imports/path/impact query primitives where those
  are already part of the dedicated source graph service;
- affected-test candidate primitives through source graph validation contracts,
  not a duplicate project graph test selector;
- path, symlink, workspace-root, and generation safety at the graph storage
  layer.
- stable package export, for example `@alembic/core/project-information`;
- cold-start compatible project briefing facts, without CLI or MCP projection.

Plugin should own:

- MCP-visible tool contract;
- project root and repo identity handoff to Core in mixed workspaces;
- one per-project graph runtime/session policy;
- bounded catch-up or degraded-response behavior;
- MCP adapter for host-agent graph use;
- agent guidance and tool descriptions;
- budgeted output projection;
- nextActions and detail refs;
- host-neutral text and structured output;
- adoption and efficiency telemetry.

Alembic main should own:

- CLI/daemon/local runtime invocation of Core project information;
- cold-start tool adapter over Core contracts;
- project briefing integration in main cold-start workflows;
- user-facing local next actions, logs, and runtime diagnostics.

Plugin must not rebuild a separate source graph or project information truth if
Core provides the canonical graph. Plugin may keep bounded fallback scanning
only as a degraded MCP projection aid, and only if it is marked as not Core graph
truth.

Cold-start tool integration should follow the Core service boundary, not Plugin:

- Alembic main should ask the Core project information service through its own
  tool adapter for project identity, graph readiness, source graph coverage, key
  entrypoints, relation availability, and next bootstrap actions.
- Cold-start callers should receive a tool-shaped result, not a private
  imported Plugin handler response tied to MCP text output.
- Cold-start output can include readiness fields that MCP does not expose, but
  freshness and root-safety semantics must stay identical.
- Cold-start flows may use graph facts to plan bootstrap or Recipe production,
  but must not infer Recipe knowledge freshness from source graph freshness.

### Relationship To Existing Four-Tool Design

This demand can later become an enhancement to the four-tool support layer, but
it must enter through controller intake as a separate demand. The current
four-tool requirement remains the broader public MCP surface convergence. This
document is narrower and deeper: it is about making `alembic_graph` and its
project information support layer mature enough to be a graph-first code
understanding tool.

Recommended integration if accepted later:

- Keep `ProjectKnowledgeContextLayer` as the umbrella for four-tool shared
  input/output/freshness.
- Add Core `project-information-context` as the shared service that Plugin
  `ProjectKnowledgeContextLayer` can call for project facts.
- Let `alembic_project_matrix` consume graph inventory summaries but not expose
  full graph traversal.
- Let `alembic_prime` consume graph hints when task context needs source
  relationships.
- Keep Recipe relation chains under `alembic_search` and `alembic_prime`, not
  under `alembic_graph`.

### Ranking And Query Planning

Natural-language graph queries should not become simple FTS lists. The query
planner should combine:

- exact symbol/file/path matches;
- source graph node names and signatures;
- FTS or text search over indexed source metadata;
- project metadata and entrypoint hints;
- active file, language, and task context;
- import/call neighborhood relevance;
- path and co-location relevance;
- test/generated/config deprioritization unless explicitly requested;
- graph connectivity and relation confidence;
- freshness and degraded coverage.

Low-confidence queries should return a clear interpretation and next targeted
reads, not bluff.

### Budgeting And Read Parity

The tool should minimize raw reads while staying edit-safe.

Budget rules:

- Default output is compact.
- Source snippets appear only when requested or necessary.
- Source ranges should include line numbers and enough context for targeted
  follow-up reads.
- Large functions/files may return skeleton, signature, or selected ranges with
  truncation notes.
- Complete files are not returned by default.
- Detail refs must let a later call retrieve the exact node, range, path, or
  relation expansion.
- Secret-looking config values must be redacted or omitted.

Read parity means Codex can treat a fresh `node` result as sufficient for
orientation or targeted inspection, but edits still require real file access
through the normal workspace tools.

## Testing Decisions

Testing must prove both correctness and agent-efficiency value.

### Controller Self-Verification

Controller or product windows should run targeted unit/contract checks before
any Test handoff:

- schema validation for all `alembic_graph` operations;
- project root fail-closed cases in multi-repo workspace;
- fresh graph result with symbols, calls, imports, and source refs;
- stale and pending-sync result behavior;
- unsupported or parse-degraded file accounting;
- fallback scan response marked degraded;
- relation provenance and confidence fields;
- impact traversal depth and truncation;
- project impact routing to source graph affected-tests or validation-plan
  surfaces, with confidence and unknowns preserved by the owning tool;
- tool descriptions and initialize guidance matching visible tool catalog.

### Product Repository Verification

Implementation windows should validate against real Alembic repositories:

- `AlembicCore` package export and Core service tests for project information
  contracts, source graph freshness, query planning, impact, and refs;
- `AlembicPlugin` as the primary real MCP project;
- `Alembic` main cold-start/tool adapter route if the controller accepts the
  cold-start consumer scope;
- at least one of `AlembicCore` or `Alembic` as a second repo to prove
  mixed-workspace routing;
- a controlled file edit or fixture change to prove freshness/pending sync;
- a known symbol/call/import query with expected answer rubric;
- a changed-file impact or project-node impact query that routes to the expected
  source graph impact, affected-tests, or validation-plan surface.

### Test Window Real Scenario

Use Test only after controller self-verification if independent agent behavior
evidence is needed. Test should answer questions such as:

- Does Codex choose `alembic_graph` before `rg`/`Read` for relationship
  questions after guidance is installed?
- Does graph-first exploration reduce raw file reads and tool calls?
- Does the answer remain semantically correct compared with a raw-read baseline?
- Does stale graph output cause Codex to raw-read only named stale files instead
  of discarding the whole graph?
- Does wrong-root ambiguity block cleanly?

### Evaluation Harness

Acceptance should include transcript or structured-run evidence, not just unit
tests.

Recommended harness:

- Run the same architecture/flow questions with graph guidance enabled and with
  graph disabled or ignored.
- Count MCP graph calls, raw `Read`, `rg`, `Glob`, shell file search, total tool
  calls, and answer correctness.
- Compare answer quality against an expected-answer rubric.
- Include at least one impact query and one freshness/stale query.
- Record when graph output replaced broad source discovery.

## Acceptance Criteria

- `alembic_graph` no longer depends on Recipe/knowledge graph relationships as
  its public semantics.
- Current public `alembic_graph` operation boundary
  `query/neighborhood/path/impact/stats` or a controller-confirmed equivalent
  is documented and implemented without duplicating dedicated source graph
  tools.
- The basic project information support layer is Core-owned and not a hidden
  child of Plugin `project-knowledge-context`; if implemented as a new folder,
  it belongs under AlembicCore, while G0 may choose an extension of existing
  Core `project-intelligence` / `source-graph` surfaces instead.
- Core exposes or extends a stable consumer-neutral project information contract
  through an existing or new package subpath, for example
  `@alembic/core/project-intelligence`, `@alembic/core/source-graph`, or a new
  `@alembic/core/project-information` if justified.
- Plugin uses a MCP projection adapter over Core project information for host
  agents.
- Alembic main uses a cold-start/tool adapter over Core project information for
  onboarding/bootstrap flows.
- Public schema descriptions, tool descriptions, and MCP initialize guidance
  tell Codex when to use graph-first behavior.
- Alembic cold-start can call its own project information tool adapter, backed
  by Core rather than Plugin, to obtain project identity, graph readiness,
  indexed coverage, source relation availability, freshness, and next bootstrap
  actions.
- Output includes project identity, freshness, typed nodes, typed relations,
  provenance, confidence, source evidence refs, detail refs, diagnostics, and
  next actions.
- Fresh graph results can answer at least one real project relation/path query
  in `AlembicPlugin`, and can route exact symbol/call/source-node questions to
  dedicated source graph tools when those are the better owner.
- Project-level impact results identify affected project areas and recommend
  the appropriate source graph or validation-planning tool for source-code blast
  radius, likely tests, or validation commands.
- Stale/pending-sync files are named precisely; the tool does not silently serve
  stale data as ready.
- Wrong repo or ambiguous multi-repo root returns blocked/degraded status rather
  than guessing.
- A transcript-based or structured evaluation shows reduced broad file reading
  and fewer tool calls for representative project information questions.
- All graph-derived conclusions remain separated from final validation evidence.

## Risks And Open Questions

### Risks

- Existing four-tool work may tempt implementation to treat this as a small
  `alembic_graph` schema tweak. That would miss the required support-layer and
  agent-efficiency work.
- Core, Plugin, and Alembic main may duplicate graph truth if ownership is not
  explicit.
- Impact radius may overclaim if heuristic or dynamic edges are not marked.
- Auto-sync may create false confidence if pending files are cleared after sync
  failure.
- Multi-repo root ambiguity can produce wrong but plausible answers.
- Evaluation may measure "tool returns data" instead of whether Codex actually
  avoids broad reads and answers correctly.
- Large outputs may reintroduce token waste if budget and detail refs are not
  enforced.

### Open Questions

- Should `alembic_graph` ever add a public `node` operation, or should
  read-equivalent source detail remain exclusively under `alembic_source_node`?
- Should read-time bounded catch-up be allowed inside graph queries, or should
  all index mutation remain behind explicit lifecycle tools?
- Which languages and frameworks are in the first accepted coverage target?
- What is the first official likely-tests contract: source graph
  `affected-tests`, validation plan, or project graph next-tool routing?
- Which telemetry fields are allowed in public MCP output versus internal test
  artifacts?
- Does controller want this as a standalone demand root or as a later enhancement
  branch under the existing four-tool family?

## Controller Intake Notes

This is a new independent Design requirement candidate.

Recommended controller handling:

- Do not attach it to the active semantic-quality validation root unless the
  user explicitly confirms that merge.
- Treat it as a full demand candidate because it spans Core, Plugin, and Test
  validation.
- Start with code fact research before implementation slicing. Current Design
  facts identify likely seams, but implementation windows must verify current
  code and tests before edits.
- Preserve producer/consumer order: Core source graph contracts and freshness
  behavior should be settled before Plugin or Alembic main promises precise
  graph output.
- Treat MCP host use and Alembic cold-start tool use as separate consumers of
  the same Core project information service, not as two duplicated
  implementations.
- Do not dispatch Test until product windows provide graph behavior and
  controller-local validation has defined expected-answer rubrics.

Suggested phase candidates, not task packages:

| Phase | Goal | Owner candidate | Completion signal |
| --- | --- | --- | --- |
| G0 | Current code fact and consumer scan for graph/source graph/project info seams. | AlembicCore + AlembicPlugin + Alembic read-only research | Verified call chains, tests, gaps, exports, and public schema consumers. |
| G1 | Core source graph query and freshness contract hardening. | AlembicCore | Indexed symbol/call/import/path/impact/freshness contracts with tests. |
| G2 | Core project information facade/projection. | AlembicCore | Existing or new Core surface resolves project identity, queries source graph/project intelligence, budgets output, and degrades safely without duplicating storage or schema. |
| G3 | Dual consumer adapters. | AlembicPlugin + Alembic main consumer if accepted | Plugin MCP adapter serves host agents; Alembic main cold-start tool adapter serves onboarding/bootstrap without duplicated graph logic. |
| G4 | Public `alembic_graph` MCP contract and guidance redesign. | AlembicPlugin | New operations, descriptions, initialize guidance, structured output, nextActions over Core contract. |
| G5 | Alembic cold-start project information tool integration. | Alembic | Cold-start can obtain project identity, graph readiness, indexed coverage, source relation availability, and next bootstrap actions through Core. |
| G6 | Impact radius and likely-tests project validation. | AlembicCore + AlembicPlugin + Alembic | Real project impact query with confidence, unknowns, and validation suggestions across both consumer routes. |
| G7 | Agent-efficiency evaluation and Test handoff if needed. | Controller + Test | Transcript evidence of fewer broad reads/tool calls with correct answers. |

## Source References

- External reference: `colbymchenry/codegraph` repository and README,
  especially local pre-indexing, auto-sync, symbol/call graph, impact analysis,
  and benchmark claims: <https://github.com/colbymchenry/codegraph>
- Existing Design background:
  `Design/docs/current/alembic-knowledge-context-four-tools-requirement-design-2026-06-14.md`
- Existing CodeGraph discussion:
  `wakeflow-ledger/requirement-designs/alembic-codegraph-knowledge-base-capability/codegraph-inspired-alembic-knowledge-base-discussion-2026-06-10.md`
- Existing CodeGraph responsibility index:
  `wakeflow-ledger/requirement-designs/alembic-codegraph-knowledge-base-capability/index.md`
- Repository boundary evidence:
  `AlembicCore/AGENTS.md`, `AlembicPlugin/AGENTS.md`, `Alembic/AGENTS.md`
- Current Core package export evidence:
  `AlembicCore/package.json`
- Current Core project intelligence and cold-start evidence:
  `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceCapability.ts`,
  `AlembicCore/src/workflows/cold-start/ColdStartPresenters.ts`
- Current Core source graph contract evidence:
  `AlembicCore/src/domain/source-graph/SourceGraphContracts.ts`
- Current Plugin graph provider evidence:
  `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`
- Current Core source graph evidence:
  `AlembicCore/test/SourceGraphIndexer.test.ts`
- Current Plugin graph schema evidence:
  `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- Current Plugin source graph and `alembic_graph` tool-boundary evidence:
  `AlembicPlugin/skills/alembic-structure/SKILL.md`,
  `AlembicPlugin/lib/runtime/ToolPolicy.ts`,
  `AlembicPlugin/lib/runtime/status/OnboardingContract.ts`,
  `AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts`,
  `AlembicPlugin/lib/runtime/mcp/source-graph/output.ts`
