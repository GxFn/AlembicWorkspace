# Alembic Core Project Context Requirement Design

## Metadata

- Design Key: `alembic-core-project-context-requirement-design-2026-06-14`
- Status: Design requirement candidate; independent demand candidate; needs controller intake
- Owner Window: Design
- Expected Owning Repository: `AlembicCore`
- Date: 2026-06-14
- Proposed Name: `ProjectContext`
- Proposed Core Export: `@alembic/core/project-context`
- Boundary: this document is requirement design only. It is not a task package, dispatch, implementation, acceptance, or Wakeflow state mutation.

## Problem

Agents do not understand a project by reading every file first. A capable agent usually needs to descend through a project in this order:

1. project space;
2. sub-repository;
3. project map;
4. modules;
5. module-internal layers;
6. file call graph, imports, inflow, and outflow;
7. single-file methods, symbols, and naming;
8. exact line-level implementation.

Core should provide this navigation path. But the implementation should be
assembled in the opposite direction. The reliable facts start at source lines,
symbols, files, and relations; larger maps are assembled upward from those
smaller facts.

The requirement is therefore not "return project information." The requirement is a Core `ProjectContext` capability that supports top-down agent navigation using bottom-up factual construction.

## Goal

Create a Core-owned `ProjectContext` capability that lets agents query project
context from broad space to exact implementation, while Core derives supporting
facts from exact implementation upward.

The service should:

- live in `AlembicCore`;
- use the short name `ProjectContext`;
- expose `@alembic/core/project-context`;
- expose one query entrypoint and one result envelope;
- support agent top-down query order;
- derive and validate facts bottom-up;
- make `sourceSlice/` the first real implementation folder;
- provide one simple anchor-range capability for agent-local context;
- keep `interface/` as the query contract entry folder for
  `ProjectContext.execute`;
- keep the public contract limited to query request kinds;
- return explicit level-specific data structures;
- stay independent from MCP/tool adapters.

## Confirmed User Decisions

The following decisions are confirmed by the user and should guide controller
intake:

- This is an independent Core demand.
- `ProjectContext` is the project-structure query surface. Existing source
  graph, panorama, project matrix, and snapshot structural capabilities should
  be recomposed around `ProjectContext` or deleted after their reusable facts are
  migrated. Later capabilities should obtain project-structure support from
  `ProjectContext` instead of preserving parallel structural producers.
- Multi-repo project space follows the current `ProjectScope` /
  `workspace.config` source-folder representation. If no project space is
  configured, the repo is treated as an independent single project.
- Do not add a persisted compact `ProjectContext` snapshot in this demand.
  This demand defines query results, not a new durable context snapshot or
  external recompute API.
- ProjectContext has no separate reasoning path or response system. `interface/` is only the query
  contract entry folder: it receives `ProjectContext.execute` input, selects the
  matching request kind, and returns the matching project information structure.
- Entrypoint detection is pure engineering construction from manifests,
  targets, discoverers, and source facts. It must not guess.
- `space`, `repo`, `map`, `module`, `module-layers`, `file-flow`,
  `file-symbols`, `source-slice`, and `anchor-range` are request kinds on
  `ProjectContext.execute`, not separate public contracts.
- Real validation should use the Alembic workspace/project space first. Extra
  fixtures should be added only for edge cases not covered by that real space.
- Agent-local query should be one simple `anchorRange` capability: given an
  anchor and radius, return the range and all related facts inside that range.
  Other access remains the normal `space`, `repo`, `map`, `module`,
  `module-layers`, `file-flow`, `file-symbols`, and `source-slice` request kinds.
- The public contract contains only project information query request kinds.
  Queries return project facts and refs only.

## Governing Design Principle

`ProjectContext` is the only Core query surface for project-structure information.

Project-structure information means the facts, refs, and drill-down paths needed to navigate:

- project space;
- repo;
- project map;
- module;
- module-internal layers;
- file flow;
- file symbols;
- source slices.

Agent-local context is handled by a separate `anchorRange` capability. It is a
shortcut around a concrete anchor, not a new project-structure level.

Existing mature solutions are migration sources, not parallel project-structure query surfaces. Their reusable logic should be split and recomposed into the new `ProjectContext` levels according to the concrete needs of each level and the adjacent shared bases. They should not remain the preferred structural query path for new consumers.

Source graph, panorama, project matrix, and snapshot structural capabilities
should not survive as parallel project-structure products. After their reusable
facts are migrated, their old structural output paths should either be recomposed
on top of `ProjectContext` or removed.

Downstream consumers can be considered later. This demand only defines the
Core project information query service and its standalone tests.

Priority is:

1. complete the `ProjectContext` layer hierarchy, query contracts, and standalone Core tests;
2. migrate mature reusable logic into the correct `ProjectContext` levels;
3. prove old structural producers are no longer parallel Core project
   information outputs after their reusable facts move into `ProjectContext`.

## Two Directions

### Agent Query Direction

This is the order an agent should be able to ask questions:

1. **Project space**
   - What repositories/projects are in this workspace?
   - Which one owns the current task?
   - What are the boundaries between sub-repositories?

2. **Sub-repository**
   - What is this repo?
   - What languages, package/build systems, scripts, and entrypoints does it have?
   - What high-level areas matter?

3. **Project map**
   - What are the major surfaces and flows?
   - Which modules/packages/targets exist?
   - Which dependencies and hotspots shape the repo?

4. **Module**
   - What does this module own?
   - What files belong to it?
   - What other modules does it depend on or feed?

5. **Module-internal hierarchy**
   - What are the internal layers/directories/classes?
   - What is the local dependency direction?
   - Where are boundaries or crossings?

6. **File flow**
   - What does this file import/export?
   - Who calls it?
   - What does it call?
   - What data/control flows in and out?

7. **File symbols and naming**
   - What classes/functions/methods/types are in the file?
   - How are they named?
   - Which symbol should the agent open next?

8. **Source slice**
   - What exact lines implement the behavior?
   - What source range backs the claim?

### Core Fact Direction

Core should construct the support in reverse:

1. **Source slices**
   - canonical file identity;
   - content hash / mtime / range;
   - line ranges.

2. **Symbols**
   - methods/functions/classes/types/routes/tests;
   - names, ranges, file ownership;
   - naming and signature summaries.

3. **File context**
   - imports/exports;
   - local symbols;
   - outgoing/incoming relation refs;
   - file role and key source slices.

4. **Module-internal context**
   - file groups;
   - internal layers;
   - local call/import/dependency directions;
   - boundary crossings.

5. **Module context**
   - owned files;
   - public surfaces;
   - dependencies;
   - inflow/outflow;
   - hotspots and next refs.

6. **Repository map**
   - targets/packages/modules;
   - dependency graph;
   - entrypoints;
   - major flows and hotspots.

7. **Project space**
   - sub-repositories;
   - repo roles;
   - cross-repo boundaries;
   - active repo selection.

The project map must be assembled upward from smaller facts, not a hand-written overview.

## Complete Query Definition

`ProjectContext` is complete only when the top-down query path and bottom-up
fact derivation path meet.

The complete loop is:

1. Produce source slices with stable refs.
2. Derive symbol/file relation facts from source slices.
3. Derive file and module contexts from symbols and relations.
4. Derive project map facts from modules and dependency relations.
5. Derive repo facts from repository discovery, package facts, source roots,
   entrypoints, and compact map facts.
6. Derive project-space facts from repo contexts.
7. Query each level without rescanning.
8. Use returned refs as selectors for narrower query kinds down to exact source
   slices.
If broad maps cannot drill down to exact source refs, the context is not complete.
If exact source facts cannot roll up to module/map/repo contexts, the context is not useful.

## Design Review And Connectivity Rules

The reviewed design should stay simple, but it must be connected. Layer names alone
are not enough. `ProjectContext` is valid only when every broad answer has a
bounded route down to evidence, and every exact source fact can roll upward into
the next broader summary without skipping ownership.

The design therefore has these hard connectivity rules:

- no orphan refs: every returned `ProjectContextRef` must be accepted by a
  bounded narrower query or return a normal query error;
- no hidden ownership transfer: a level may include compact summaries and refs
  from adjacent levels, but it must not claim the detailed facts owned by another
  level;
- no cross-level jump: a higher level should consume the nearest lower-level
  projection instead of reaching past intermediate levels to old producers;
- no broad scan during normal queries: `space`, `repo`, `map`, `module`,
  `module-layers`, `file-flow`, `file-symbols`, and `source-slice` are query kinds;
  normal query execution returns available project facts and refs;
- shared bases must prove two adjacent consumers; otherwise the code belongs in
  the concrete level that directly uses it;

Level-to-level connectivity must be explicit:

| Route | Required connection | Query error when |
| --- | --- | --- |
| `space -> repo` | repo-qualified refs for each source folder, active repo, boundary summary | workspace config is missing/unreadable, a configured folder is missing, active file is outside the space, or repo ids collide |
| `repo -> map` | `mapRef` and narrower refs | map facts are unavailable, discoverer output is ambiguous, or package/dependency facts are unavailable |
| `map -> module` | module refs, dependency/cycle refs, edge provenance | module ownership is missing, declared and observed edges conflict, or the requested module is unknown |
| `module -> moduleLayers` | layer refs, owned-file refs, boundary crossing refs | module seed is uncertain, owned files are missing, or local layer direction is cyclic/unknown |
| `moduleLayers -> fileFlow` | file relation rollup refs and relation-site refs | relation extraction is unavailable or outside the module boundary |
| `fileFlow -> fileSymbols` | local symbol refs for calls/imports/exports where available | symbol extraction is unavailable or the relation site has no symbol range |
| `fileSymbols -> sourceSlice` | source range refs for every symbol claim | file moved, range is unavailable, text is redacted, or parser output cannot be reconciled with current source |
| returned refs | bounded detail through `ProjectContext.execute` | ref is outside scope, ambiguous, redacted, deleted, or unavailable |

The inverse fact derivation path must also be tested:

- `sourceSlice` produces file identity, range, hash, and safe text handling;
- `fileSymbols` consumes source slices and produces symbol ranges;
- `fileFlow` consumes symbols/source facts and produces relation sites;
- `moduleLayers` consumes file-flow rollups and produces internal layer facts;
- `module` consumes module layers, symbols, and relation summaries;
- `map` consumes modules and dependency rollups;
- `repo` consumes repository discovery plus compact map facts;
- `space` consumes repo summaries and source-folder facts.

Boundary cases are simple query cases, not a separate state model:

- no workspace config: create a single-folder space baseline when containment
  and project identity are valid;
- configured repo folder missing: return the remaining repos and a missing-folder
  query error for the requested folder;
- duplicate display names, duplicate repo ids, or duplicate relative paths:
  require repo-qualified refs and reject ambiguous short refs;
- active file outside the project space: return no `activeRepo` instead of guessing;
- project root/source-folder ambiguity: return a query error for that
  source-folder request;
- unreadable manifests or competing discoverers: return repo identity and omit
  package/build/target facts that cannot be read deterministically;
- unavailable language/parser: return source slices and omit symbol or flow facts
  that require the unavailable parser;
- generated, vendor, dependency, or ignored directories: exclude them from
  default context unless the caller explicitly opts in;
- deleted or moved file: return a not-found query error for the source ref;
- circular module dependencies: return cycles as facts, not as total failure;
- no modules discovered: return repo context and an empty map, not a fabricated
  module list;
- no package manifests: return generic repo identity, language/source-root facts
  where possible, and empty package/build summaries;
- large repositories: collect broad facts where allowed, then let
  `ProjectContext.execute` return samples, counts, refs, and truncation markers for
  narrow consumer views;
- path traversal or outside-root paths: block the query;
- sensitive config/source text: lower levels preserve factual refs and source
  identity, while `interface/` handles redaction for returned text;
- affected-test refs are out of scope for this pure project information demand.

## Non-goals

- Do not implement this in `AlembicPlugin`.
- Do not preserve `ProjectIntelligenceCapability`, `SourceGraphService`, `PanoramaService`, `ProjectSnapshot`, project matrix, or snapshot projections as parallel project-structure outputs after their reusable facts have moved into `ProjectContext`.
- Do not expose the full source graph API through `ProjectContext`.
- Do not make normal query calls silently run bootstrap, rescan, or source graph indexing.
- Do not make lower-level raw collection behavior pretend to be consumer-facing output behavior. `interface/` handles returned shape, redaction, size limits, and narrow views.
- Do not include workflow state, acceptance state, scheduling, UI output,
  generated narrative, or adapter behavior in this demand.

## Primary Actors

- Core service: owns deterministic project context contracts and query behavior.
- Host agent: is a future consumer, but does not define the Core contract.
- Core tests: validate behavior independently before any adapter integration.

## User Stories

- As a host agent, I can start from project space and drill down to exact source lines without broad file reading.
- As a ProjectContext caller, I can derive context bottom-up and then serve top-down queries cheaply.
- As a developer, I can query broad maps and drill down to exact source facts.

## Capability Boundary

`ProjectContext` covers the agent navigation path and the Core facts needed to support it.

### Required Query Levels

1. **Space**
   - workspace/project-space roots;
   - sub-repositories;
   - repo roles and boundaries;
   - active repo selection hints.

2. **Repo**
   - repo identity;
   - package/build system;
   - languages;
   - scripts and entrypoints;
   - top source areas.

3. **Map**
   - modules/packages/targets;
   - major surfaces;
   - dependency summary;
   - hotspots;
   - next refs.

4. **Module**
   - module role;
   - owned files;
   - public/internal surfaces;
   - dependency inflow/outflow;
   - module-level hotspots.

5. **Module Layers**
   - internal directories/layers;
   - file groups;
   - local dependency direction;
   - boundary crossings.

6. **File Flow**
   - imports/exports;
   - callers/callees or relation refs;
   - data/control inflow and outflow where available;
   - affected test refs when available.

7. **File Symbols**
   - classes/functions/methods/types;
   - naming/signature summaries;
   - symbol ranges;
   - next source refs.

8. **Source Slice**
   - exact file path;
   - line range;
   - content hash;
   - source text/range access for internal factual support, with consumer-facing pruning handled by `interface/`.

### Outside This Boundary

- Full source graph exploration APIs.
- Host-agent prose briefing generation.
- Workflow state, scheduling, acceptance, or controller judgment.
- UI, adapter, or generated narrative output.

These may consume `ProjectContext`, but they are not part of its core responsibility.

## Existing Core Inputs To Reuse

Use existing Core producers as migration sources, but do not create a new wrapper layer around mature code. Mature capabilities should be migrated at the lowest level that directly needs them, then shared only across adjacent levels when both levels have a concrete need.

`ProjectContext` is the target query surface for project-structure information. Existing producers should be split, migrated, or recomposed into it. They should not remain parallel query paths for new project-structure consumers once the matching `ProjectContext` level exists.

The long-term direction is stronger than "reuse." Source graph, panorama,
project matrix, and snapshot structural outputs should be recomposed on
`ProjectContext` or deleted after migration. During migration they may supply
facts, algorithms, repositories, or fixtures, but they are not long-term
project-structure contracts.

The migration rule is:

- if a mature capability is needed by one query level, migrate it into that concrete level folder;
- if a mature capability is directly needed by two adjacent query levels, migrate it into a scoped shared base for those two levels;
- if a mature capability is needed by a higher level later, expose a rolled-up projection from the nearer lower level instead of jumping the original implementation into a broad shared base;
- if an old service still needs the migrated capability, it can depend on `ProjectContext`, but `ProjectContext` should not depend on that old service's private helpers;
- no `ProjectContext` layer should be implemented as a pass-through wrapper over old source graph, AST, panorama, or entity graph query services.

- `ProjectDiscoverer`: repo/package/target discovery and dependency graph.
- `ProjectScope`: project root, repo scope, canonical source identity.
- `ProjectSnapshot`: transitional typed scan result and fixture source where available; not a long-term project-structure output contract.
- `LanguageService` and AST summary: language and symbol structure.
- `ProjectGraph`: file-level AST symbol lookup when grammar support is available:
  - `getFileSymbols(relativePath)` returns the indexed file symbol summary;
  - `getClassMethods(className)` returns method facts grouped by class;
  - internal source collectors find classes, protocols, categories, imports, properties, and methods.
- `AstAnalyzer` / `ProjectSnapshot`: file summaries and method metrics:
  - `AstFileSummary.methods`;
  - `AstMethodInfo.name`, `className`, `line`, `lines`, `bodyLines`, `complexity`, and async flags.
- `CodeEntityRepository`: durable symbols/modules/entities when materialized:
  - `findByFile(filePath, projectRoot)`;
  - `listByType(entityType, projectRoot)`;
  - `searchByName(query, projectRoot)`.
- Mature source symbol logic currently spread across source graph contracts/indexing/repositories:
  - `SourceSymbolNode`;
  - `createSourceSymbolNode`;
  - file module symbols;
  - declaration symbol extraction for classes, interfaces, enums, functions, types, constants, variables;
  - exported/imported flags;
  - symbol range and selection range contracts;
  - persisted `getSymbol`, `listSymbols`, and `searchSymbols`.
- Mature file-flow logic currently spread across AST, source graph, code entity graph, and panorama code:
  - structured `ImportRecord` with imported symbols, alias, import kind, and type-only flag;
  - language AST plugins that extract imports, exports, and call sites;
  - `CallGraphAnalyzer` pipeline: symbol table, import path matching, call edge matching, and data-flow inferrer;
  - source graph edge contract for `imports`, `calls`, `data_flow`, `references`, `depends_on`, and related relations;
  - deterministic import-edge extraction and relative import resolution in source graph indexing;
  - source graph edge repository queries by file and symbol;
  - source graph callers, callees, impact, affected-test, and validation-plan relation logic;
  - `CodeEntityGraph` / `KnowledgeEdgeRepository` calls, data-flow, depends-on, inheritance, conformance, path, and impact-radius queries;
  - `CouplingAnalyzer` module-edge inference from `depends_on`, `calls`, `data_flow`, and import scans.
- Mature module-layer logic currently spread across panorama and discovery code:
  - `ModuleDiscoverer` module ownership from `module` entities and `is_part_of` edges;
  - module file enrichment from filesystem module directories and DB file-path matching;
  - host module decomposition into implicit submodules by source directory;
  - config layer metadata from module entity metadata and dependency graph layers;
  - `PanoramaService.getModule` file groups by immediate subdirectory within one module;
  - `PanoramaTypes` layer and violation contracts;
  - `CouplingAnalyzer` graph metrics, cycle detection, and relation weights;
  - `LayerInferrer` config-first and topology-based layer inference algorithm;
  - `ProjectDiscoverer` / custom config discoverers that expose declared dependency layers.
- Mature module logic currently spread across panorama, discovery, and entity graph code:
  - `PanoramaModule` fields: name, role, confidence, layer, fan-in, fan-out, files, file count, and module kind;
  - `ModuleCandidate` fields: module name, inferred role, files, and config layer;
  - `PanoramaService.getModule` structural facts: module identity, layer name, neighbors, and file groups;
  - `RoleRefiner` role signals from AST structure, call fan-in/out, data-flow producer/consumer shape, entity patterns, config layer, and regex baseline;
  - `KnowledgeEdgeRepository` incoming/outgoing `depends_on` module neighbors;
  - `KnowledgeEdgeRepository.countEdgesJoinedByEntityFiles` for module-scoped fan-in/fan-out signals;
  - `KnowledgeEdgeRepository.findPatternsUsedByEntities` for module role hints;
  - `CodeEntityGraph.populateFromSpm` module entity materialization and config layer metadata;
  - `ProjectSnapshot.localPackageModules` for local package module summaries.
- Mature map logic currently spread across panorama, discovery, entity graph, and snapshot code:
  - `PanoramaAggregator.compute` orchestration for module candidates, refined roles, coupling, global layers, cycles, call-flow summary, and external dependency profiles;
  - `PanoramaService.getOverview` structural overview fields: module count, layer count, total files, layers, and cycle count;
  - `CouplingAnalyzer` module graph assembly from `depends_on`, `calls`, `data_flow`, and import inference;
  - `CouplingAnalyzer` Tarjan cycle detection, module fan-in/fan-out metrics, edge de-duplication, and external dependency fan-in;
  - `LayerInferrer` global module-layer inference from declared config layers or dependency topology;
  - `KnowledgeEdgeRepository` top-called nodes, entry points, data-flow producers/consumers, and module dependency pairs;
  - `ProjectDiscoverer` and language/custom discoverers exposing declared `DependencyGraph` nodes, edges, and layers;
  - `ProjectSnapshot.DependencyGraph` and panorama result fields for modules, layers, cycles, call-flow summary, and external dependencies;
  - `TechStackProfiler` external dependency hotspot and category heuristics where they are backed by dependency facts.
- Mature repo logic currently spread across discovery, project-intelligence, snapshots, and shared project scope code:
  - `ProjectDiscoverer` contract for detect/load/listTargets/getTargetFiles/getDependencyGraph;
  - `DiscovererRegistry` automatic discoverer selection, all-match detection, ambiguity analysis, and user preference handling;
  - registered discoverers for SPM, Node, Python, JVM, Go, Dart, Rust, custom config, and generic directory scan;
  - language/custom discoverer parsing of package manifests, workspaces, local packages, targets, frameworks, and dependency graphs;
  - `LanguageService` language mapping, display names, source extension set, project language detection, and build-system marker table;
  - `AnalysisPhaseRunners` file collection across project-scope folders, target decoration, canonical source identity creation, test detection, language stats, truncation warnings, and dependency graph collection;
  - `ProjectSnapshot` fields for project root, all files, all targets, discoverer, language profile, dependency graph, target summaries, local package modules, phase report, warnings, and truncation;
  - `ProjectIntelligenceResultProjection` target summary and local package module projection;
  - `SnapshotViews` response/session projections for files scanned, targets, languages, dependency graph, local package modules, and warnings;
  - `ColdStartPresenters` target/file map, language stats, dependency graph, local package modules, and warning presentation;
  - `TargetClassifier` target-role and file-priority inference for entrypoint/top-area hints;
  - `ProjectScope`, `WorkspaceResolver`, `ProjectMarkers`, and path-containment helpers for repo identity, project-scope folders, subrepo/git repo detection, and path containment;
  - `SourceScanExclusions` shared source scan exclusions;
  - `ConfigWatcher` manifest/config change scope and hash tracking.
- Mature space logic currently spread across Core ProjectScope, workspace identity, ProjectGraph source-root selection, and Plugin project-matrix navigation:
  - `ProjectScope` contracts for one project with multiple physical source folders;
  - `ProjectDescriptor`, `ProjectFolderDescriptor`, `ProjectScopeSummary`, folder roles, and active folder state;
  - workspace config project-scope helpers for `workspace.config.json`, `repoNames`, repositories, internal-repo filtering, source folder roles, and non-source folder exclusion;
  - project-scope folder helpers for deterministic folder listing and folder-to-space matching;
  - canonical source identity and source-ref helpers for repo-qualified source refs;
  - `WorkspaceResolver.toFacts` for project root, realpath, project scope summary, and current folder;
  - project registry identity helpers for stable project identity;
  - `ProjectMarkers` for project detection, subrepo path resolution, and git/submodule boundary facts;
  - `ProjectGraph` source-root resolution from explicit project scope, workspace config project scope, or single-root fallback;
  - Plugin project-scope source-folder helpers for workspace-config source folder materialization with path containment and missing-folder filtering;
  - Plugin `ProjectMatrixProvider` filesystem tree sampling, bounded node/child limits, node type classification, `partOf` relations, active-file node, structural hotspots, and detail refs;
  - project matrix tests proving `workspace.config repoNames` define the visible project matrix boundary and internal surfaces are excluded.
- Mature source-slice logic currently spread across source graph contracts/query/indexing:
  - `SourceRange`;
  - `SourceSection`;
  - `createSourceSection`;
  - file text access;
  - path containment checks under `projectRoot`;
  - file content hash / mtime / line count;
  - symbol ranges and edge-site ranges.
- Mature query-shaping logic currently mixed with source and presentation code:
  - line, item, token, and graph size-limit handling;
  - config/source text redaction;
  - truncation markers;
  - detail-vs-ref projection.
- `PanoramaService`: optional module role/coupling hints for map assembly.

The intent is migration into concrete level folders and scoped adjacent-level shared bases, not a new wrapper that calls old private helpers.

## Scoped Shared Bases

`ProjectContext` should not have one shared base folder for all mature public capabilities. Each level owns the real logic it needs. Shared bases are allowed only when the shared code has named adjacent consumers.

Scoped shared bases should follow these rules:

- name the two adjacent levels that consume the shared code;
- contain only code both named levels directly use;
- expose compact projections upward instead of leaking lower-level implementation details;
- avoid becoming a generic place for identity, range, relation, and inventory code just because many levels eventually mention those concepts;
- require tests that prove both adjacent levels use the shared base.

Examples:

- `sourceSlice-fileSymbols/`: source refs and range projections needed by source slicing and file symbol ranges.
- `fileSymbols-fileFlow/`: symbol refs and local symbol lookup needed by file-level relation grouping.
- `fileFlow-moduleLayers/`: file relation rollups needed to form module-internal layers.
- `moduleLayers-module/`: module seeds and layer summaries needed by module-internal layers and one-module context.
- `module-map/`: module dependency summaries needed by the project map.
- `map-repo/`: map summaries needed by repo context.
- `repo-space/`: repo identity and source-folder summaries needed by project-space context.

This prevents mature lower-level code from being promoted too high before the next level proves what it actually needs.

## `interface/` Query Entry Folder

`interface/` stays in `ProjectContext`. It is the query contract entry folder for
`ProjectContext.execute`.

It is not a fact producer, adapter, project mapper, or state owner. It does not discover projects, access manifests, parse source, assemble
graphs, infer modules, or call MCP tools. It receives one
`ProjectContextRequest`, validates the request kind and scope, calls the matching
ProjectContext capability folder, and returns the `ProjectContextEnvelope`.

The purpose of `interface/` is necessary convergence and checks only. For the
same `ProjectContextRequest` and the same underlying project files/facts, it
must return the same envelope shape, ordering, refs, and query errors.

`interface/` contains:

- the `ProjectContext.execute` contract;
- request kind normalization;
- scope and containment checks;
- request payload canonicalization where order or aliases would otherwise make
  equivalent requests look different;
- dispatch to internal capability modules;
- response envelope construction;
- compact response projection;
- ref selection when inline detail would be too large;
- source-text redaction handling;
- ordinary query error shaping.

`interface/` must not:

- infer missing project facts;
- reorder facts using caller-specific preference;
- add generated summaries;
- introduce hidden reads outside the requested scope;
- call another query kind to broaden the request unless the request kind
  explicitly requires that composition, such as `anchor-range`.

All externally visible context capabilities are request kinds on
`ProjectContext.execute`:

- `anchor-range`;
- `space`;
- `repo`;
- `map`;
- `module`;
- `module-layers`;
- `file-flow`;
- `file-symbols`;
- `source-slice`.

Internal level-to-level calls may use raw internal contracts when deriving or
collecting facts. Public results return through `ProjectContext.execute`.

Lower levels still own factual correctness:

- `sourceSlice/` owns file identity, path containment, range normalization,
  current hash/mtime/line count, and source range access;
- `fileSymbols/` owns symbol extraction and range reconciliation;
- `fileFlow/` owns imports, exports, and relation sites;
- higher levels own their summaries, refs, and provenance.

This keeps the implementation folders factual while preserving one public query
entrypoint.

## Proposed Core Architecture

### Package Surface

```text
@alembic/core/project-context
```

### Folder Shape

```text
AlembicCore/src/domain/project-context/
  ProjectContextContracts.ts
  ProjectContextRefs.ts
  ProjectContextMap.ts
  index.ts

AlembicCore/src/service/project-context/
  ProjectContextService.ts
  interface/
    contracts.ts
    projectContext.ts
    request.ts
    response.ts
    dispatch.ts
    projection.ts
    pruning.ts
    redaction.ts
    index.ts
  anchorRange/
    contracts.ts
    anchorRange.ts
    anchorResolve.ts
    radius.ts
    collect.ts
    index.ts
  sourceSlice/
    contracts.ts
    sourceSlice.ts
    fileAccess.ts
    range.ts
    index.ts
  fileSymbols/
    contracts.ts
    fileSymbols.ts
    extract.ts
    normalize.ts
    naming.ts
    ranges.ts
    index.ts
  fileFlow/
    contracts.ts
    fileFlow.ts
    importExtract.ts
    importResolve.ts
    relationEdges.ts
    callFlow.ts
    flowNormalize.ts
    ranges.ts
    index.ts
  moduleLayers/
    contracts.ts
    moduleLayers.ts
    fileGroups.ts
    localRelations.ts
    localLayerInfer.ts
    boundaryCrossings.ts
    index.ts
  module/
    contracts.ts
    module.ts
    membership.ts
    role.ts
    publicSurfaces.ts
    dependencies.ts
    hotspots.ts
    index.ts
  map/
    contracts.ts
    map.ts
    moduleGraph.ts
    layerMap.ts
    dependencySummary.ts
    cycles.ts
    hotspots.ts
    majorFlows.ts
    externalDeps.ts
    index.ts
  repo/
    contracts.ts
    repo.ts
    identity.ts
    discovery.ts
    packageSystems.ts
    targets.ts
    sourceRoots.ts
    entrypoints.ts
    commands.ts
    topAreas.ts
    index.ts
  space/
    contracts.ts
    space.ts
    projectScope.ts
    sourceFolders.ts
    repoBoundaries.ts
    activeRepo.ts
    sourceRefs.ts
    projectTree.ts
    index.ts
  shared/
    sourceSlice-fileSymbols/
    fileSymbols-fileFlow/
    fileFlow-moduleLayers/
    moduleLayers-module/
    module-map/
    map-repo/
    repo-space/
    index.ts
  index.ts

AlembicCore/src/project-context.ts
```

### Public Contract

Keep one public execute entrypoint. Agent-facing context capabilities are
request kinds on the same contract, not separate public contracts.

Raw level outputs are internal derivation and adjacent-level collection details, not
public API.

```ts
export interface ProjectContext {
  execute(input: ProjectContextRequest): Promise<ProjectContextEnvelope<ProjectContextResult>>;
}

export type ProjectContextRequestKind =
  | 'anchor-range'
  | 'space'
  | 'repo'
  | 'map'
  | 'module'
  | 'module-layers'
  | 'file-flow'
  | 'file-symbols'
  | 'source-slice';

export interface ProjectContextRequest<TPayload = unknown> {
  kind: ProjectContextRequestKind;
  scope: ProjectContextScopeInput;
  payload?: TPayload;
}
```

This shape matches the agent query direction while avoiding multiple public
interfaces. Internal implementation modules may still be separated by level.

### `anchorRange/` Ownership

`anchorRange/` is the simple agent-local context capability. It answers one
question: "given this anchor, what is the relevant range around it?"

It should directly contain:

- input/output contracts for anchor-range queries;
- anchor resolution from file path, line, symbol ref, source-slice ref,
  relation-site ref, or any returned `ProjectContextRef`;
- radius normalization;
- collection of related facts whose evidence intersects the matched range;
- next refs back to normal query request kinds.

It should not own:

- source text reading, which belongs to `sourceSlice/`;
- symbol extraction, which belongs to `fileSymbols/`;
- relation extraction, which belongs to `fileFlow/`;
- module ownership or layer inference, which belongs to `module/` and
  `moduleLayers/`;
- response shaping and redaction, which belongs to `interface/`.

The first implementation path should be:

1. match the anchor to a canonical source range using `sourceSlice`;
2. expand the requested source radius around that anchor;
3. collect symbols from `fileSymbols` that overlap the expanded range;
4. collect imports, exports, calls, inflow, outflow, and relation sites from
   `fileFlow` that overlap the expanded range;
5. attach containing module, module-layer, map, repo, and space refs when
   available;
6. collect directly related refs inside the requested relation radius;
7. return the range, all related facts inside the range, and normal next refs.

Radius should stay simple:

- source radius: before/after line count around the anchor range;
- symbol radius: symbols whose ranges overlap the source radius;
- relation radius: zero or more relation hops from relation sites inside the
  source radius;
- containment radius: containing file, module layer, module, map, repo, and
  space refs.

The output should stay concrete:

- matched anchor;
- expanded source range;
- source-slice refs;
- symbols in range;
- relation sites in range;
- direct related refs inside relation radius;
- containing context refs.

### `sourceSlice/` Ownership

`sourceSlice/` is not a public interface wrapper. It owns real source-range query behavior.

It should directly contain:

- input/output contracts for source slices;
- source range normalization;
- path containment and file access;
- current-file hash / mtime / line count collection;
- conversion from mature `SourceSection` behavior into `SourceSliceContext`.

`sourceSlice/` owns the source-text-specific factual behavior: file access,
range normalization, text access, hash collection, and source-slice result
construction. It should not decide final consumer size limits or redaction handling.
Range and source-ref projections that are also directly needed by
`fileSymbols/` should move only into the scoped `sourceSlice-fileSymbols/`
shared base, not into a broad shared base.

The mature source-slice behavior should be moved into this folder from its current scattered locations. After migration, old source graph query code can use `sourceSlice/` if needed, but `ProjectContext.sourceSlice` should not depend on private helpers inside `SourceGraphQueryService`.

### `fileSymbols/` Ownership

`fileSymbols/` is the second concrete implementation folder. It owns one-file symbol facts and naming facts.

It should directly contain:

- input/output contracts for file symbol queries;
- symbol extraction from a source slice;
- migration of mature source graph symbol extraction into `extract.ts`;
- migration of AST file summary normalization into `normalize.ts`;
- range conversion between AST/source graph line facts and source-slice refs;
- naming summaries derived from real symbols, not generated prose;
- deterministic sorting and de-duplication for symbols found by more than one mature source.

It should not be a thin call to `SourceGraphQueryService.search`, `SourceGraphQueryService.node`, or repository search alone. Repositories can provide stored facts, but the folder must own the file-level query contract and the merge/normalization behavior.

The first implementation path should be:

1. use `sourceSlice/` to load the current file facts;
2. extract module and declaration symbols from the current file text using migrated mature source graph logic;
3. enrich from AST file summaries when available;
4. reconcile with durable `CodeEntityRepository` or source graph repository facts when available;
5. return one ordered file symbol context with source refs for the next drill-down.

The output should stay concrete:

- file identity;
- symbols with kind, display name, optional qualified name, signature, container, export/import flags, and range;
- naming summary derived from those symbols;
- next refs to `sourceSlice` ranges.

### `fileFlow/` Ownership

`fileFlow/` is the third concrete implementation folder. It owns one-file relation facts.

It should directly contain:

- input/output contracts for file flow queries;
- import/export extraction and normalization for the current file;
- import target resolution against known project files;
- edge normalization from source graph and code entity graph facts;
- incoming and outgoing file relation grouping;
- caller/callee relation grouping when symbol-level call facts are available;
- data-flow relation grouping when materialized facts exist;
- relation-site range mapping to source-slice refs;
- deterministic de-duplication rules.

It should not be a thin call to `SourceGraphQueryService.callers`, `SourceGraphQueryService.callees`, `SourceGraphQueryService.impact`, or `CodeEntityGraph.getImpactRadius`. Those mature paths can feed it, but `fileFlow/` must own the file-level contract and normalize them into a single file-flow answer.

The first implementation path should be:

1. use `sourceSlice/` to load current file identity and source facts;
2. use `fileSymbols/` for local symbol ids and symbol ranges;
3. extract imports/exports from the current source text or AST file summary;
4. match import targets against known project files;
5. merge source graph edges for this file when available;
6. merge materialized code entity graph relations for local symbols when available;
7. split facts into imports, exports, callers, callees, inflow, and outflow;
8. return source-slice refs for relation sites and target symbols.

The output should stay concrete:

- file identity;
- imports and matched import targets;
- exports and exported local symbols;
- callers and callees when proven;
- incoming and outgoing relation groups;
- one-hop affected file refs derived from file edges;
- source refs for relation sites;
- query errors for unmatched imports and unavailable call-site extraction.

### `moduleLayers/` Ownership

`moduleLayers/` is the fourth concrete implementation folder. It owns the internal structure of one module.

It should directly contain:

- input/output contracts for one-module layer queries;
- module file group construction from the module's owned files;
- immediate subdirectory grouping migrated from mature Panorama file-group behavior;
- local file-relation graph construction from `fileFlow` rollups;
- local cycle detection and internal fan-in/fan-out summaries;
- local layer inference for directories/file groups inside the module;
- boundary crossing detection between internal groups and outside-module files;
- source refs back to the file-flow relation sites that prove the internal edges.

It should not be a thin call to `PanoramaService.getModule`, `LayerInferrer.infer`, or full `CouplingAnalyzer.analyze`. Those mature paths can feed or inspire it, but `moduleLayers/` must own the one-module contract and should not pull global module/map behavior downward.

The first implementation path should be:

1. receive a concrete module name and owned files from `shared/moduleLayers-module/` module seeds;
2. group owned files by module-relative directory;
3. consume file relation rollups from `shared/fileFlow-moduleLayers/`;
4. keep only relations where the site file is inside the module;
5. classify internal edges between file groups and boundary crossings to outside files;
6. infer local layers from declared config hints when available, otherwise from local relation topology;
7. return file groups, local layers, boundary crossings, and source refs.

The output should stay concrete:

- module identity;
- module-owned files;
- file groups by directory;
- local layers made of file groups;
- internal relation directions between groups;
- boundary crossings to files outside the module;
- cycles or uncertain layer direction facts;
- next refs to `fileFlow` and `sourceSlice` evidence.

The scoped `fileFlow-moduleLayers/` shared base should contain only file relation rollups that both `fileFlow/` and `moduleLayers/` directly use. It must not become a general relation graph store for `module`, `map`, or `repo`.

### `module/` Ownership

`module/` is the fifth concrete implementation folder. It owns one-module context.

It should directly contain:

- input/output contracts for one-module queries;
- module membership seed normalization from mature module discovery facts;
- module role and confidence calculation;
- public surface extraction from file symbols and file exports;
- module-level inflow/outflow dependency grouping;
- fan-in/fan-out and hotspot summaries scoped to the module;
- references to `moduleLayers` for internal structure;
- next refs to `moduleLayers`, `fileFlow`, `fileSymbols`, and `sourceSlice` evidence.

It should not own:

- module-internal local layer inference, which belongs to `moduleLayers/`;
- project-wide module graph assembly, which belongs to `map/`;
- repository package/build/entrypoint context, which belongs to `repo/`;
- generated summary prose.

The first implementation path should be:

1. select a module seed from `shared/moduleLayers-module/`: name, kind, owned files, inferred role, optional config layer;
2. consume `moduleLayers` output for file groups, local layers, and boundary crossings;
3. collect public surfaces from `fileSymbols` exported symbols and `fileFlow` exports;
4. collect module neighbors from materialized `depends_on` edges and file-flow boundary crossings;
5. calculate role confidence using migrated `RoleRefiner` signals scoped to the module files;
6. calculate fan-in/fan-out and hotspots using module-scoped relation counts;
7. return a compact module context with evidence refs and omit role/dependency facts that are unavailable.

The scoped `moduleLayers-module/` shared base should contain only module seeds and layer summaries both adjacent levels directly use. It must not contain project-wide maps, all-module dependency graphs, or repo facts.

### `map/` Ownership

`map/` is the sixth concrete implementation folder. It owns the project-level module map inside one repo/project.

It should directly contain:

- input/output contracts for project map queries;
- module graph assembly from module summaries, dependency rollups, declared dependency graphs, and relation edges;
- global module-layer map construction;
- dependency summary calculation across modules;
- cycle detection and cycle summaries for module dependencies;
- module hotspot calculation from fan-in/fan-out, calls, data-flow, references, and depends-on relations;
- major call-flow and data-flow summaries;
- external dependency hotspot summaries backed by dependency facts;
- next refs to `module`, `moduleLayers`, `fileFlow`, and `sourceSlice` evidence.

It should not own:

- one-module internal layer inference, which belongs to `moduleLayers/`;
- one-module public surfaces and role calculation, which belong to `module/`;
- repo package systems, package/build scripts, entrypoints, language inventory, or top path areas, which belong to `repo/`;
- project-space cross-repo boundaries, which belong to `space/`;
- generated summary prose.

The first implementation path should be:

1. consume module summaries from `module/` and `shared/module-map/`;
2. assemble module dependency edges from module dependency rollups, file-flow boundary rollups, materialized `depends_on`/`calls`/`data_flow` edges, and declared dependency graphs;
3. normalize declared dependency graph nodes, edges, and layers from discoverers or `ProjectSnapshot`;
4. merge declared edges with observed relation edges using deterministic de-duplication and source provenance;
5. infer global module layers from declared layers when sufficiently covered, otherwise from module dependency topology;
6. compute module fan-in/fan-out, dependency summary, cycles, hotspots, and external dependency hotspots;
7. compute major call-flow and data-flow summaries from edge repository facts when available;
8. return a compact project map with refs that drill into modules, module layers, file flows, and source slices.

The scoped `module-map/` shared base should contain only module summaries and module dependency rollups both adjacent levels directly use. It must not contain repo package/build facts, project-space boundaries, or full source text.

`map/` can migrate the structural parts of `PanoramaAggregator`, `CouplingAnalyzer`, `LayerInferrer`, `PanoramaService.getOverview`, and dependency graph discoverers. It should not call those services as its implementation.

### `repo/` Ownership

`repo/` is the seventh concrete implementation folder. It owns one repository's project context above the project map.

It should directly contain:

- input/output contracts for repo queries;
- repo identity, root, project-scope folder, and canonical repo ref resolution;
- discoverer detection, ambiguity handling, and selected discoverer summary;
- package/build system marker collection;
- target and local package summaries;
- source root and source scan exclusion summaries;
- language profile summaries;
- entrypoint summaries from target type, manifest fields, and high-priority entry files;
- command summaries from package/build manifests where available;
- top-area summaries from targets, local packages, source roots, and bounded file counts;
- config file facts;
- `mapRef` and next refs to `map`, `module`, and narrower evidence.

It should not own:

- project-wide module graph assembly, dependency cycles, and hotspots, which belong to `map/`;
- one-module context, which belongs to `module/`;
- module-internal layers, which belong to `moduleLayers/`;
- file-level calls/imports/symbols/source text, which belong to lower file/source levels;
- cross-repo project-space boundaries and workspace-wide repo lists, which belong to `space/`;
- workflow acceptance or generated narrative.

The first implementation path should be:

1. determine repo identity from `ProjectScope`, `WorkspaceResolver`, `ProjectMarkers`, and path containment checks;
2. run or consume `DiscovererRegistry.detectAll` and `analyzeConflict` to identify matching ecosystems and ambiguity;
3. load the selected discoverer and collect targets, target files, and dependency graph summaries through the `ProjectDiscoverer` contract;
4. normalize package/build systems from manifest markers and discoverer metadata;
5. normalize language profile from `LanguageService`, collected file stats, and snapshot language fields;
6. derive target and local package summaries from `ProjectIntelligenceResultProjection`-style logic;
7. extract entrypoints from executable/app targets, manifest fields, target names, and high-priority entry files;
8. extract command summaries from manifest scripts or build metadata without executing them;
9. derive top-area summaries from source roots, targets, local packages, and bounded file counts;
10. attach a `mapRef` from the dependency graph/map summary and return narrower refs for drill-down;
11. omit repo facts that cannot be read deterministically when discoverer matching is ambiguous, manifest parsing fails, file collection is truncated, config files changed, or source roots are unreadable.

The scoped `map-repo/` shared base should contain only compact map summaries that `map/` produces and `repo/` displays: module count, layer count, dependency edge count, cycle count, hotspot count, and map refs. It must not contain package parsing, discoverer selection, source scanning, command extraction, or workspace-space boundaries.

`repo/` can migrate mature discovery and snapshot projection logic. It should not call narrative builders as its implementation, and it should not convert generated narrative into repo facts.

### `space/` Ownership

`space/` is the eighth concrete implementation folder. It owns the project-space view above one or more repos/source folders.

It should directly contain:

- input/output contracts for project-space queries;
- project identity, project scope id, project id, display name, and project root;
- source folder list, roles, repository ids, physical paths, realpaths, and active state;
- current/active repo resolution from active file, current folder id, or folder path;
- repo summaries from `shared/repo-space/`;
- repo-qualified source ref normalization and source ref index construction;
- compact project tree sampling for the project space;
- structural hotspot summaries at the project-space level;
- next refs to `repo`, `map`, and narrower evidence.

It should not own:

- repo package/build/target/entrypoint facts, which belong to `repo/`;
- project map assembly, which belongs to `map/`;
- module/file/source internals, which belong to lower levels;
- adapter output, workflow state, scheduling state, or generated prose;

The first implementation path should be:

1. load a project scope from explicit input or `workspace.config.json`;
2. when no project scope exists, create a single-folder baseline from project root and repository marker facts;
3. normalize source folders from `ProjectScope` and `workspace.config` using deterministic ordering and duplicate filtering;
4. reject missing folders, paths outside the project space, duplicate paths, and project id mismatches;
5. select active repo from current folder id, active file, or folder path;
6. derive repo summaries and repo refs from `shared/repo-space/` without copying repo package/build/target details upward;
7. derive source-folder summaries and repo-qualified source refs;
8. assemble a compact project tree using bounded sampling, node type classification, child counts, `partOf` relations, active file node, and structural hotspots;
9. return next refs to repo contexts and, through repo refs, to map/module/file/source contexts;
10. omit space facts that cannot be read deterministically when workspace config is unreadable, project-scope matching is ambiguous, a configured repo is missing, active file is outside the space, or project matrix sampling is truncated.

The scoped `repo-space/` shared base should contain only repo identity and source-folder summaries both adjacent levels directly use: folder id, display name, repository id, role, path, realpath, repo ref, and source folder state. It must not contain package systems, targets, entrypoints, module maps, source text, or adapter output.

`space/` can migrate pure project-space logic from `ProjectScope`, `WorkspaceResolver`, `ProjectRegistry`, `ProjectMarkers`, `ProjectGraph` source-root resolution, `ProjectScopeFolders`, and the structural parts of `ProjectMatrixProvider`. It should not call Plugin project matrix, resident clients, MCP handlers, or output projectors as its implementation.

## Contract Shape

### Shared Envelope

```ts
export interface ProjectContextEnvelope<T> {
  contractVersion: 1;
  project: ProjectContextProject;
  queryLevel: ProjectContextLevel;
  data: T;
  refs: ProjectContextRef[];
  errors?: ProjectContextQueryError[];
}
```

### Query Levels

```ts
export type ProjectContextLevel =
  | 'space'
  | 'repo'
  | 'map'
  | 'module'
  | 'module-layers'
  | 'file-flow'
  | 'file-symbols'
  | 'source-slice';
```

### Core Data Products

```ts
export interface AnchorRangeContext {
  anchor: ProjectContextAnchor;
  radius: AnchorRangeRadius;
  range: SourceRangeSummary;
  file: FileSummary;
  sourceSlices: ProjectContextRef[];
  symbols: SymbolSummary[];
  relationSites: RelationSummary[];
  relatedRefs: ProjectContextRef[];
  containingRefs: ProjectContextRef[];
  nextRefs: ProjectContextRef[];
}

export interface SpaceContext {
  space: ProjectSpaceSummary;
  repos: RepoSummary[];
  sourceFolders: SourceFolderSummary[];
  activeRepo?: ProjectContextRef;
  boundaries: RepoBoundarySummary[];
  projectTree?: ProjectTreeSummary;
  nextRefs: ProjectContextRef[];
}

export interface RepoContext {
  repo: RepoSummary;
  languages: LanguageSummary[];
  buildSystems: BuildSystemSummary[];
  packageSystems: PackageSystemSummary[];
  targets: TargetSummary[];
  localPackages: PackageSummary[];
  sourceRoots: PathSummary[];
  entrypoints: EntrypointSummary[];
  commands: CommandSummary[];
  topAreas: PathSummary[];
  configFiles: ConfigFileSummary[];
  mapRef?: ProjectContextRef;
  nextRefs: ProjectContextRef[];
}

export interface ProjectMap {
  repo: RepoSummary;
  modules: ModuleSummary[];
  layers: LayerSummary[];
  dependencySummary: DependencySummary;
  cycles: DependencyCycleSummary[];
  hotspots: HotspotSummary[];
  majorFlows: FlowSummary[];
  externalDependencyHotspots: ExternalDependencySummary[];
  nextRefs: ProjectContextRef[];
}

export interface ModuleContext {
  module: ModuleSummary;
  ownedFiles: FileSummary[];
  publicSurfaces: SymbolSummary[];
  inflow: RelationSummary[];
  outflow: RelationSummary[];
  nextRefs: ProjectContextRef[];
}

export interface ModuleLayerContext {
  module: ModuleSummary;
  layers: LayerSummary[];
  fileGroups: FileGroupSummary[];
  boundaryCrossings: RelationSummary[];
  nextRefs: ProjectContextRef[];
}

export interface FileFlowContext {
  file: FileSummary;
  imports: RelationSummary[];
  exports: SymbolSummary[];
  callers: RelationSummary[];
  callees: RelationSummary[];
  inflow: RelationSummary[];
  outflow: RelationSummary[];
  nextRefs: ProjectContextRef[];
}

export interface FileSymbolContext {
  file: FileSummary;
  symbols: SymbolSummary[];
  naming: NamingSummary;
  nextRefs: ProjectContextRef[];
}

export interface SourceSliceContext {
  file: FileSummary;
  range: SourceRangeSummary;
  text?: string;
  hash?: string;
}
```

## Proposed Behavior

### Private Implementation Work

`ProjectContext.execute` has no non-query request kinds. If the
implementation uses indexes, inventories, caches, or file watchers, those remain
private implementation details and are exercised only by Core tests or Core
internals.

Queries expose only project facts, refs, and ordinary query errors. They do not
expose public actions for introspection, recomputation, cache update, or ref-only
lookup.

### Query Kinds

Normal query kinds serve the agent path:

- `anchor-range` returns local context around one concrete anchor and radius.
- `space` selects the project/repo boundary.
- `repo` explains one repository.
- `map` shows the repository/project map.
- `module` focuses one module.
- `module-layers` explains module-internal hierarchy.
- `file-flow` explains imports/calls/inflow/outflow for one file.
- `file-symbols` explains methods, symbols, and naming inside one file.
- `source-slice` returns exact implementation ranges.

Every broad result must provide refs to the next narrower level.

### `anchorRange`

`anchorRange` is the simple shortcut for real agent work. It should be the first
thing an agent can call when it has an active file, stack frame, symbol, source
ref, relation ref, or previously returned context ref.

Inputs:

- `projectRoot`;
- anchor as file/line, source range, symbol ref, relation-site ref, source-slice
  ref, or generic `ProjectContextRef`;
- source radius as before/after lines;
- optional relation radius;
- optional include flags for source slices, symbols, relations, containing refs,
  and related refs;

Behavior:

- match anchor to canonical file identity and source range;
- expand the source radius around the anchor;
- return source-slice refs for the expanded range;
- include symbols whose ranges overlap the expanded range;
- include imports, exports, calls, inflow, outflow, and relation sites whose
  evidence overlaps the expanded range;
- include containing refs for file, module layer, module, map, repo, and space
  when available;
- include directly related refs within the requested relation radius;
- report outside-scope, deleted, redacted, or ambiguous anchors as query errors
  without widening to a raw project search;
- return normal next refs so the agent can continue through `fileSymbols`,
  `fileFlow`, `moduleLayers`, `module`, `map`, `repo`, or `space`.

This capability should compose the normal query request kinds. It should not become
a second project graph, a source graph API, or a broad project search endpoint.

### `sourceSlice`

`sourceSlice` is the first implementation target. It is real code-query logic, not a conceptual projection.

Inputs:

- `projectRoot`;
- repo-relative `filePath`;
- exact `range`, or a symbol/source-section ref that maps to a range;
- `includeText`;

Behavior:

- normalize and validate the requested file path and line range;
- reject path traversal and files outside `projectRoot`;
- access the requested source range and return current source identity;
- compute or return file hash, mtime, line count, and range;
- leave consumer-facing text pruning and redaction to the interface
  layer;
- attach symbol ids only when a mature symbol/range source exists;
- return a query error when a source-graph-backed ref cannot be matched to the
  requested file/range;
- avoid silently widening a source-slice query beyond the requested file/range.

This logic should live in `sourceSlice/` directly. It should not be implemented as a thin call to `SourceGraphQueryService.node/search`.

### `fileSymbols`

`fileSymbols` is the second implementation target. It turns one source file into concrete symbol and naming facts.

Inputs:

- `projectRoot`;
- repo-relative `filePath`, or a source-slice ref;
- optional `kinds` filter;
- optional `includeNaming`;
- optional `includeMaterializedFacts`;

Behavior:

- match file identity through the same path and containment rules as `sourceSlice`;
- load bounded current file facts through `sourceSlice/`;
- extract a module symbol for the file;
- extract declarations for classes, interfaces, enums, functions, types, constants, and variables from current source text;
- enrich with AST file-summary facts where available, especially class methods, protocols, categories, imports, properties, method line, body size, and complexity;
- reconcile materialized `CodeEntityRepository` and source graph repository symbols only when they match the current file and range facts;
- de-duplicate symbols by file, range, kind, and display name;
- sort symbols by source order;
- compute naming summaries from the returned symbols;
- return source-slice refs for symbols that should be opened next.

This logic should live in `fileSymbols/` directly. It should not depend on a broad source graph query as its primary implementation.

### `fileFlow`

`fileFlow` is the third implementation target. It turns one source file into concrete relation facts.

Inputs:

- `projectRoot`;
- repo-relative `filePath`, or a file ref;
- optional `includeImports`;
- optional `includeCalls`;
- optional `includeDataFlow`;
- optional `includeMaterializedFacts`;

Behavior:

- match file identity through the same path and containment rules as `sourceSlice`;
- load current file facts through `sourceSlice/`;
- load local symbols through `fileSymbols/`;
- extract import/export facts from current source text or AST summaries;
- match relative import targets against known project files;
- consume file-related source graph edges when a compatible snapshot exists;
- consume code entity graph relations for the file's symbols when materialized facts exist;
- group outgoing facts as imports, callees, data-flow out, references, and depends-on;
- group incoming facts as importing files, callers, data-flow in, references, and dependents;
- map each relation site to a source-slice ref when a site range exists;
- return one-hop affected file refs from proven file edges only;
- omit unavailable relation sources without hiding current import/export facts.

This logic should live in `fileFlow/` directly. It should not use source graph callers/callees/impact as its primary implementation.

### `moduleLayers`

`moduleLayers` is the fourth implementation target. It turns one module's files and file-flow facts into internal layer facts.

Inputs:

- `projectRoot`;
- `moduleName` or module ref;
- owned file refs;
- optional declared layer hints;
- optional `includeBoundaryCrossings`;

Behavior:

- select module-owned files from module facts, materialized `is_part_of` edges, or module-directory fallback;
- group module files by immediate module-relative directory;
- consume local file-flow rollups from `shared/fileFlow-moduleLayers/`;
- assemble an internal group graph using imports, calls, data-flow, references, and depends-on edges where the site file belongs to the module;
- separate internal edges from boundary crossings to files outside the module;
- detect local cycles and uncertain direction;
- infer local layer order from declared hints when available, otherwise from local topology;
- avoid using global module layer inference as the primary implementation;
- return refs to file-flow relation sites and source slices for evidence.

This logic should live in `moduleLayers/` directly. It should not call `PanoramaService.getModule` or `LayerInferrer.infer` as the implementation.

### `module`

`module` is the fifth implementation target. It turns one module seed, internal layers, and file-level facts into a module context.

Inputs:

- `projectRoot`;
- `moduleName` or module ref;
- optional `includePublicSurfaces`;
- optional `includeDependencies`;
- optional `includeHotspots`;

Behavior:

- select module seed from `shared/moduleLayers-module/`;
- include module identity, kind, owned file count, owned file refs, inferred role, refined role, role confidence, and config layer where available;
- consume `moduleLayers` for file groups, local layers, internal edges, and boundary crossings;
- collect public surfaces from exported `fileSymbols` and file-flow exports in owned files;
- collect outgoing dependencies and incoming dependents from module `depends_on` edges and file-flow boundary crossings;
- compute module-scoped fan-in/fan-out and hotspots from calls, data-flow, references, and depends-on relations;
- keep role signals as evidence facts, not as acceptance decisions;
- return refs down to `moduleLayers`, `fileFlow`, `fileSymbols`, and `sourceSlice`;
- exclude generated prose summaries.

This logic should live in `module/` directly. It should not call `PanoramaService.getModule` as the implementation.

### `map`

`map` is the sixth implementation target. It turns all module contexts and relation rollups into a project-level module map for one repo/project.

Inputs:

- `projectRoot`;
- optional repo/project scope;
- optional `includeCycles`;
- optional `includeHotspots`;
- optional `includeMajorFlows`;
- optional `includeExternalDeps`;

Behavior:

- consume module summaries from `module/` and `shared/module-map/`;
- consume module dependency rollups from `shared/module-map/`;
- normalize declared dependency graph nodes, edges, and layers from discoverers or snapshot data;
- merge declared dependency edges with observed `depends_on`, `calls`, `data_flow`, references, and import-derived edges;
- keep edge provenance so declared facts and observed code facts do not become indistinguishable;
- infer global module layers from declared layers when coverage is sufficient, otherwise from dependency topology;
- compute module fan-in/fan-out and dependency summary;
- detect project-level module dependency cycles;
- compute hotspots from fan-in/fan-out, relation counts, and external dependency fan-in;
- compute major call-flow and data-flow summaries only when relation facts are available;
- return refs down to `module`, `moduleLayers`, `fileFlow`, and `sourceSlice` evidence;
- return query errors for missing module ownership, unmatched external
  dependencies, and unavailable call/data-flow extraction;
- exclude repo package/build/entrypoint metadata and generated prose summaries.

This logic should live in `map/` directly. It should not call `PanoramaAggregator.compute` or `PanoramaService.getOverview` as the implementation.

### `repo`

`repo` is the seventh implementation target. It turns repository discovery, package metadata, targets, source roots, language stats, and compact map facts into one repo context.

Inputs:

- `projectRoot`;
- optional repo/folder ref;
- optional `includeCommands`;
- optional `includeEntrypoints`;
- optional `includeTopAreas`;
- optional `includeMapSummary`;

Behavior:

- determine repo identity and project-scope folder from workspace/project-scope facts;
- confirm path containment and repo boundary before reading manifests;
- detect matching discoverers and report ambiguity instead of silently choosing when confidence is close;
- load the selected discoverer when needed and normalize discoverer id, display name, confidence, and reason;
- normalize package/build systems from build-system markers, manifest files, and discoverer metadata;
- collect target summaries and local package summaries from discoverer targets and snapshot projections;
- normalize source roots and skip directories from discoverer output and shared source-scan exclusions;
- compute language summaries from collected files, snapshot language profile, and `LanguageService`;
- extract entrypoints from executable/app targets, manifest fields such as `bin`/`main`/products, target names, and high-priority entry files;
- extract commands from package/build manifests without running them;
- compute top-area summaries from source roots, targets, local packages, file counts, and priority files;
- include compact map facts through `map-repo/` when map facts are available;
- return `mapRef` and narrower refs so the agent can drill from repo to map, module, file flow, symbols, and source slices;
- return query errors for ambiguous discoverers, unreadable manifests, missing
  project-scope folders, truncated file collection, missing package metadata,
  and unavailable map facts;
- exclude module graph assembly, file-level relation extraction, source text,
  generated narrative, and adapter data.

This logic should live in `repo/` directly. It should not call `ColdStartPresenters`, `MissionBriefingBuilder`, or `ProjectIntelligenceRunner` as the implementation.

### `space`

`space` is the eighth implementation target. It turns project-scope, workspace, and repo/source-folder facts into a project-space context.

Inputs:

- `projectRoot`;
- optional project-scope summary or descriptor;
- optional active file;
- optional current folder id;
- optional `includeProjectTree`;
- optional `includeStructuralHotspots`;

Behavior:

- determine project-space identity from explicit project scope, `workspace.config.json`, or single-folder fallback;
- normalize source folders and repo summaries from ProjectScope folders and `shared/repo-space/`;
- preserve folder roles, repository ids, physical paths, realpaths, and active state;
- select active repo from current folder id, active file, or folder path;
- derive repo-qualified source refs and reject short refs when they are ambiguous across repos;
- assemble a bounded project tree using source folders as top-level space nodes when workspace config exists, otherwise using the single repo root;
- classify project tree nodes as project, repo, package, module, directory, file, target, or document;
- compute structural hotspots from top-level child counts and configured repo/source folders;
- return refs to `repo` contexts and propagate repo refs downward;
- return query errors for missing/unreadable workspace config, missing configured
  repo folders, active file outside the space, duplicate folders, project id
  mismatch, and truncated tree sampling;
- exclude repo package/build/target internals, project map internals, source
  text, adapter output, and generated prose summaries.

This logic should live in `space/` directly. It should not call `alembic_project_matrix`, Plugin project matrix handlers, resident clients, or knowledge-context projectors as the implementation.

Returned refs are selectors, not a separate capability. A later
`ProjectContext.execute` call can pass the ref to `anchor-range` or the matching
level query kind and receive bounded detail or a query error. A compact
answer should never force the agent to start a broad raw file search.

## Standalone Core Scope

Current work should stop at the Core capability. Future consumers are intentionally outside this demand.

The Core-only requirement is:

- define the `ProjectContext` contracts;
- provide bottom-up fact derivation sufficient for queries;
- serve top-down query levels;
- accept returned refs as selectors for narrower queries;
- prove query behavior for found, missing, ambiguous, outside-scope, and
  redacted facts;
- pass independent Core tests.

Any adapter or upper-level consumer integration must be a later demand after
Core behavior is proven.

## Implementation Decisions

- Use `ProjectContext`.
- Treat `ProjectContext` as the only Core project-structure query surface.
- Treat mature existing project-structure solutions as migration sources, not long-term parallel output surfaces.
- Migrate mature capabilities into the lowest concrete level that directly needs them.
- Use scoped adjacent-level shared bases only when both named levels directly consume the code.
- Derive support bottom-up from source slices to project space.
- Serve queries top-down from project space to source slices.
- Complete the ProjectContext layer hierarchy and `interface/` query entry folder before designing later consumer integration.
- Make later consumers call `ProjectContext` public contracts when they need project-structure information.
- Keep one public `ProjectContext.execute` entrypoint.
- Request kinds must mirror the agent query order.
- `anchorRange` is the simple agent-local shortcut for anchor-plus-radius
  context; normal layered request kinds remain the main API.
- Broad levels must always return refs to narrower levels.
- Source graph is a source-backed relation provider, not the whole context.
- Panorama can help map/module roles, but it is not the project context root.
- Map owns project-level module graph, layer map, cycles, hotspots, major flows, and external dependency hotspots.
- Map excludes repo package/build/entrypoint metadata.
- Repo owns repository identity, discoverer selection, package/build systems, targets, source roots, entrypoints, commands, top areas, and compact map refs.
- Repo excludes cross-repo space, project map construction, file relation extraction, and workflow narrative.
- Space owns project-space identity, source folders, repo boundaries, active repo selection, repo-qualified source refs, data boundaries, and compact project tree sampling.
- Space excludes repo package details, project map construction, lower-level source facts, and adapter output behavior.
- `interface/` handles consumer-facing pruning, size limits, redaction, request
  dispatch, and broad-collection/narrow-output projection.
- All public requests return through `ProjectContext.execute`. Internal raw
  contracts are allowed only for layer-to-layer fact collection.

## Testing Decisions

The highest public entry is `@alembic/core/project-context`.

Standalone Core tests should prove:

- package export exists;
- `ProjectContext.execute` is the only public query entrypoint;
- public request kinds are exactly `anchor-range`, `space`, `repo`, `map`,
  `module`, `module-layers`, `file-flow`, `file-symbols`, and `source-slice`;
- every query returns project facts, refs, and ordinary query errors only;
- `interface/` contains request kind normalization, dispatch, compact projection,
  size limits, redaction, and ref selection;
- `interface/` performs only necessary convergence and checks: request kind
  normalization, scope checks, containment checks, payload canonicalization,
  dispatch, envelope construction, ref selection, redaction, and query-error
  shaping;
- identical `ProjectContextRequest` input against identical project files/facts
  returns identical envelope structure, stable ordering, stable refs, and stable
  query errors;
- `interface/` does not discover projects, parse source, assemble graphs, infer
  modules, call adapters, or own project facts;
- `anchorRange/` composes normal ProjectContext queries and returns local facts
  around file/line, source-range, symbol, relation-site, source-slice, or
  generic context refs;
- `sourceSlice/` owns file access, source range access, hash collection, and
  source-slice result construction;
- `fileSymbols/` owns symbol extraction, AST normalization, naming, range
  mapping, and de-duplication;
- `fileFlow/` owns import extraction, import target matching, relation-edge
  normalization, call-flow grouping, range mapping, and de-duplication;
- `moduleLayers/` owns module file grouping, local relation graph construction,
  local layer inference, boundary crossing detection, and local cycle facts;
- `module/` owns membership normalization, role facts, public surface
  collection, module dependency grouping, fan-in/fan-out, and hotspot summaries;
- `map/` owns module graph assembly, global layer mapping, dependency summary,
  cycle facts, hotspot calculation, major-flow summaries, and external
  dependency summaries;
- `repo/` owns repo identity, discoverer selection, package/build system
  detection, target and local package summaries, source root summaries, language
  summaries, entrypoint extraction, command extraction, and top-area summaries;
- `space/` owns project-space identity, source folder normalization, workspace
  config repo boundary parsing, active repo selection, repo-qualified source
  refs, compact project tree sampling, and structural hotspot summaries;
- each scoped shared base names exactly two adjacent consumer levels and contains
  only code both named levels directly use;
- source graph, panorama, project matrix, and snapshot structural outputs are not
  kept as parallel Core project-structure contracts after their reusable facts
  move into ProjectContext;
- top-down tests route from `space` to `repo`, `map`, `module`,
  `module-layers`, `file-flow`, `file-symbols`, and exact `source-slice` refs
  without raw file search;
- bottom-up tests prove source/file/module/map/repo/space facts can be derived
  without skipping intermediate ownership;
- query-error tests cover missing workspace config, missing configured repo
  folder, duplicate repo ids, duplicate relative paths, active file outside
  space, project root/source-folder ambiguity, unreadable manifests, ambiguous
  discoverers, unavailable parser, generated/vendor exclusion, circular module
  dependencies, no modules discovered, no package manifests, large repo
  truncation, outside-root paths, redacted sensitive text, and deleted file refs;
- normal query kinds do not trigger workspace discovery, source graph indexing,
  broad filesystem scans, package/build commands, or adapter/tool behavior;
- no persisted compact `ProjectContext` snapshot is introduced by this demand;
- entrypoint detection is based on engineering facts from manifests, targets,
  discoverers, and source facts, not guesses;
- Alembic workspace/project-space real tests are the primary validation surface;
  extra fixtures cover only missing edge cases.

## Acceptance Criteria

- `AlembicCore` has an isolated `project-context` domain/service folder.
- Core exports `@alembic/core/project-context`.
- Core exposes one public `ProjectContext.execute` interface.
- Public request kinds are exactly `anchor-range`, `space`, `repo`, `map`,
  `module`, `module-layers`, `file-flow`, `file-symbols`, and `source-slice`.
- The shared envelope contains project identity, query level, data, refs, and
  ordinary query errors only.
- `ProjectContext` includes `interface/` as the query entry folder for request
  routing, compact projection, size limits, redaction, and ref selection.
- `interface/` is limited to necessary convergence and checks, and identical
  input over identical project facts produces identical output.
- `interface/` is not a fact producer and does not call adapters, MCP tools,
  discoverers, source parsers, graph builders, or module inferrers.
- `anchorRange/` returns the matched anchor, expanded range, source-slice refs,
  symbols in range, relation sites in range, related refs, containing refs, and
  normal next refs.
- `anchorRange/` composes normal ProjectContext capabilities and does not own
  source access, symbol extraction, relation extraction, module inference, map
  assembly, repo discovery, or output redaction.
- Mature capabilities are migrated into their lowest directly consuming query
  level.
- Scoped shared bases exist only for adjacent levels with direct shared needs.
- No broad shared base folder supports the full chain by default.
- `sourceSlice/`, `fileSymbols/`, `fileFlow/`, `moduleLayers/`, `module/`,
  `map/`, `repo/`, and `space/` each own their own contracts and real query
  implementation.
- None of the level folders is a thin wrapper over old source graph, panorama,
  project matrix, snapshot, or narrative services.
- Broad answers return refs to narrower facts.
- Returned refs can be passed to `anchor-range` or the matching level query to
  obtain bounded detail or a query error.
- The top-down route is documented, implemented, and covered by a fixture:
  `space -> repo -> map -> module -> module-layers -> file-flow -> file-symbols -> source-slice`.
- The reverse derivation route is covered by tests:
  `source-slice -> file-symbols -> file-flow -> module-layers -> module -> map -> repo -> space`.
- Existing mature structural providers are migrated into the matching level,
  decomposed into scoped adjacent shared bases, recomposed on top of
  `ProjectContext`, or removed.
- This demand stops at Core project information query behavior. Adapter, MCP,
  plugin, UI, workflow, acceptance, scheduling, and generated narrative work are
  out of scope.
- Alembic workspace/project-space real tests cover the primary scenario before
  synthetic edge-case fixtures are added.

## Resolved Decisions And Remaining Risks

Resolved:

- Multi-repo project space uses current `ProjectScope` / `workspace.config`
  source-folder representation.
- Missing project-space configuration falls back to one independent project.
- No persisted compact `ProjectContext` snapshot is added in this demand.
- `sourceSlice` does not decide final consumer output limits; `interface/` handles returned shape.
- `anchorRange` is the simple local agent query capability; normal level
  request kinds remain the main API.
- Entrypoints are engineering facts from manifests, targets, discoverers, and
  source facts, not guesses.
- Alembic workspace/project-space real validation is the primary test surface.

Remaining risks:

- Alembic real-space validation may not cover every malformed project-space
  edge case, so narrow synthetic fixtures may still be required.
- Recomposing or deleting old source graph, panorama, project matrix, and snapshot
  structural outputs must be staged after `ProjectContext` replacement behavior
  is proven.
- Interface projection must not invent facts or hide query errors.

## Controller Intake Notes

Design recommends treating this as an independent Core demand.

Suggested implementation order:

1. Confirm naming and package boundary: `ProjectContext` / `@alembic/core/project-context`.
2. Create `sourceSlice/` and move the mature source section/file text/range/hash behavior into it.
3. Create `shared/sourceSlice-fileSymbols/` only for source refs and range projections directly shared by `sourceSlice/` and `fileSymbols/`.
4. Implement `fileSymbols`, then add `shared/fileSymbols-fileFlow/` only for symbol refs directly needed by `fileFlow`.
5. Implement `fileFlow`, then add `shared/fileFlow-moduleLayers/` only for file relation rollups directly needed by `moduleLayers`.
6. Add `anchorRange/` after `sourceSlice`, `fileSymbols`, and `fileFlow` can prove file-line, symbol, and relation-site anchors.
7. Keep `interface/` for necessary convergence and checks: request routing,
   payload canonicalization, scope/containment checks, stable envelope
   construction, compact projection, size limits, redaction, and ref selection.
8. Implement `moduleLayers`, `module`, and `map` by adding only adjacent shared bases as concrete need appears.
9. Implement `repo`, then add `shared/map-repo/` only for compact map summaries and map refs directly needed by `repo`.
10. Implement `space`, then add `shared/repo-space/` only for repo identity and source-folder summaries directly needed by `space`.
11. Implement `ProjectContext.execute` request kinds for `anchor-range` and normal level queries.
12. Add Alembic workspace/project-space real validation and narrow edge fixtures.
13. Stop at Core validation; adapter integration is a separate future demand.

## Controller Automation Demand Group

This is a Design handoff for controller intake. It is not a dispatch packet and
does not assign work directly to any target window.

### PCQ-0: Contract And Folder Skeleton

Scope:

- create `@alembic/core/project-context` package export;
- create `domain/project-context/` contracts and refs;
- create `service/project-context/` folder skeleton;
- keep `interface/` as the `ProjectContext.execute` query entry folder;
- define request kinds, scope input, envelope, refs, and ordinary query errors.

Depends on: none.

Acceptance:

- public request kinds are exactly `anchor-range`, `space`, `repo`, `map`,
  `module`, `module-layers`, `file-flow`, `file-symbols`, and `source-slice`;
- envelope contains project identity, query level, data, refs, and errors;
- `interface/` only performs necessary convergence and checks;
- identical input over identical project facts returns identical output shape,
  ordering, refs, and errors.

Non-goals:

- no adapter work;
- no generated narrative;
- no project facts owned by `interface/`.

### PCQ-1: Source Slice

Scope:

- implement `sourceSlice/`;
- migrate mature source section, file text, range, hash, mtime, line-count, and
  path-containment behavior;
- create `shared/sourceSlice-fileSymbols/` only for source refs and range
  projections used by both adjacent levels.

Depends on: PCQ-0.

Acceptance:

- `source-slice` returns exact file identity, range, optional text, hash, and
  refs;
- path traversal and outside-project paths return query errors;
- output is deterministic for identical file content and request input.

Non-goals:

- no symbol extraction;
- no file relation extraction;
- no final consumer output decisions inside `sourceSlice/`.

### PCQ-2: File Symbols

Scope:

- implement `fileSymbols/`;
- migrate symbol extraction, AST file summary normalization, naming summaries,
  range mapping, sorting, and de-duplication;
- create `shared/fileSymbols-fileFlow/` only for symbol refs needed by
  `fileFlow/`.

Depends on: PCQ-1.

Acceptance:

- `file-symbols` returns file identity, ordered symbols, naming summary, and
  source-slice refs;
- unavailable parser or unreadable source returns query errors or omitted facts
  without inventing symbols;
- symbol order is stable.

Non-goals:

- no import/call grouping;
- no module inference;
- no broad repository search.

### PCQ-3: File Flow

Scope:

- implement `fileFlow/`;
- migrate import/export extraction, import target matching, relation-edge
  normalization, call-flow grouping, range mapping, and de-duplication;
- create `shared/fileFlow-moduleLayers/` only for file relation rollups needed by
  `moduleLayers/`.

Depends on: PCQ-1, PCQ-2.

Acceptance:

- `file-flow` returns imports, exports, callers, callees, inflow, outflow, and
  source refs where available;
- unmatched imports and unavailable call-site extraction return query errors or
  omitted facts;
- relation refs can drill down to source slices.

Non-goals:

- no broad graph endpoint;
- no project-level impact API;
- no module map assembly.

### PCQ-4: Anchor Range

Scope:

- implement `anchorRange/`;
- support file/line, source range, symbol ref, relation-site ref,
  source-slice ref, and generic `ProjectContextRef` anchors;
- return bounded local facts using `sourceSlice/`, `fileSymbols/`, and
  `fileFlow/`.

Depends on: PCQ-1, PCQ-2, PCQ-3.

Acceptance:

- `anchor-range` returns matched anchor, expanded range, source-slice refs,
  symbols in range, relation sites in range, related refs, containing refs, and
  next refs;
- radius expansion is deterministic;
- it does not widen into broad project search.

Non-goals:

- no ownership of source access, symbol extraction, or relation extraction;
- no cross-repo project map assembly.

### PCQ-5: Module Layers And Module

Scope:

- implement `moduleLayers/`;
- implement `module/`;
- create `shared/moduleLayers-module/` only for module seeds and layer summaries;
- migrate module file grouping, local relation graph, local layer inference,
  module membership, role facts, public surfaces, fan-in/fan-out, and hotspots.

Depends on: PCQ-2, PCQ-3.

Acceptance:

- `module-layers` returns file groups, local layers, boundary crossings, and
  refs to file/source facts;
- `module` returns module identity, owned files, public surfaces, inflow,
  outflow, and next refs;
- module outputs are derived from owned files and file-level facts, not a global
  panorama result.

Non-goals:

- no project-wide module graph assembly;
- no repo package/build/entrypoint facts.

### PCQ-6: Project Map

Scope:

- implement `map/`;
- create `shared/module-map/` only for module summaries and dependency rollups;
- migrate module graph assembly, global layer mapping, dependency summary,
  cycle facts, hotspots, major flows, and external dependency summaries.

Depends on: PCQ-5.

Acceptance:

- `map` returns repo summary, modules, layers, dependency summary, cycles,
  hotspots, major flows, external dependency summaries, and next refs;
- map refs drill down to module, module-layer, file-flow, and source-slice
  facts;
- repo package/build/entrypoint facts stay out of `map/`.

Non-goals:

- no repo discovery;
- no source text ownership;
- no adapter output.

### PCQ-7: Repo Context

Scope:

- implement `repo/`;
- create `shared/map-repo/` only for compact map summaries and map refs;
- migrate repo identity, discoverer selection, package/build system detection,
  target and local package summaries, source roots, language summaries,
  entrypoints, commands, and top areas.

Depends on: PCQ-6.

Acceptance:

- `repo` returns repo identity, languages, package/build systems, targets, local
  packages, source roots, entrypoints, commands, top areas, `mapRef`, and next
  refs;
- ambiguous discoverers, unreadable manifests, and unavailable map facts produce
  query errors or omitted facts;
- `repo` does not assemble project map internals.

Non-goals:

- no project-space source folder list;
- no file/source internals;
- no generated narrative.

### PCQ-8: Project Space

Scope:

- implement `space/`;
- create `shared/repo-space/` only for repo identity and source-folder
  summaries;
- migrate project-scope identity, source folder normalization, repo list,
  active repo selection, repo-qualified source refs, compact project tree, and
  structural hotspots.

Depends on: PCQ-7.

Acceptance:

- `space` returns project identity, repos, source folders, active repo, repo
  boundary summaries, project tree, and next refs;
- only project-space, repo, and source-folder facts are returned;
- missing folders, duplicate repo ids, active file outside space, and ambiguous
  project scope produce query errors or omitted facts.

Non-goals:

- no repo package/build/target internals;
- no map internals;
- no adapter output.

### PCQ-9: End-To-End ProjectContext Validation

Scope:

- connect all request kinds through `ProjectContext.execute`;
- add Alembic workspace/project-space real validation;
- add narrow edge fixtures only for cases not covered by real workspace data.

Depends on: PCQ-0 through PCQ-8.

Acceptance:

- top-down route works:
  `space -> repo -> map -> module -> module-layers -> file-flow -> file-symbols -> source-slice`;
- reverse derivation route is covered:
  `source-slice -> file-symbols -> file-flow -> module-layers -> module -> map -> repo -> space`;
- `anchor-range` works from active file, exact line, symbol ref, relation-site
  ref, source-slice ref, and generic context ref;
- normal queries do not trigger broad filesystem scans, package/build commands,
  adapter behavior, or hidden project search.

Non-goals:

- no MCP/tool adapter integration;
- no UI work;
- no workflow, acceptance, scheduling, or generated narrative behavior.

## Source References

- `AlembicCore/AGENTS.md`
- `AlembicCore/package.json`
- `AlembicCore/src/project-intelligence.ts`
- `AlembicCore/src/types/ProjectSnapshot.ts`
- `AlembicCore/src/types/projectSnapshotBuilder.ts`
- `AlembicCore/src/types/SnapshotViews.ts`
- `AlembicCore/src/core/discovery/ProjectDiscoverer.ts`
- `AlembicCore/src/core/discovery/DiscovererRegistry.ts`
- `AlembicCore/src/core/discovery/DiscovererPreference.ts`
- `AlembicCore/src/core/discovery/SourceScanExclusions.ts`
- `AlembicCore/src/core/discovery/SpmDiscoverer.ts`
- `AlembicCore/src/core/discovery/NodeDiscoverer.ts`
- `AlembicCore/src/core/discovery/PythonDiscoverer.ts`
- `AlembicCore/src/core/discovery/JvmDiscoverer.ts`
- `AlembicCore/src/core/discovery/GoDiscoverer.ts`
- `AlembicCore/src/core/discovery/DartDiscoverer.ts`
- `AlembicCore/src/core/discovery/RustDiscoverer.ts`
- `AlembicCore/src/core/discovery/GenericDiscoverer.ts`
- `AlembicCore/src/core/discovery/ConfigWatcher.ts`
- `AlembicCore/src/core/ast/ProjectGraph.ts`
- `AlembicCore/src/core/analysis/ImportRecord.ts`
- `AlembicCore/src/core/analysis/CallGraphAnalyzer.ts`
- `AlembicCore/src/core/analysis/ImportPathResolver.ts`
- `AlembicCore/src/core/analysis/CallEdgeResolver.ts`
- `AlembicCore/src/core/analysis/DataFlowInferrer.ts`
- `AlembicCore/src/core/discovery/CustomConfigDiscoverer.ts`
- `AlembicCore/src/service/project-intelligence/AnalysisPhaseRunners.ts`
- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceResultProjection.ts`
- `AlembicCore/src/workflows/capabilities/presentation/TargetFileMapBuilder.ts`
- `AlembicCore/src/workflows/cold-start/ColdStartPresenters.ts`
- `AlembicCore/src/shared/LanguageService.ts`
- `AlembicCore/src/shared/ProjectScope.ts`
- `AlembicCore/src/shared/WorkspaceResolver.ts`
- `AlembicCore/src/shared/ProjectRegistry.ts`
- `AlembicCore/src/shared/ProjectMarkers.ts`
- `AlembicCore/src/shared/TargetClassifier.ts`
- `AlembicCore/src/daemon/RuntimeContracts.ts`
- `AlembicCore/src/daemon/ProjectRuntimeContracts.ts`
- `AlembicCore/test/ProjectScopeContracts.test.ts`
- `AlembicCore/src/domain/source-graph/SourceGraphContracts.ts`
- `AlembicCore/src/service/source-graph/SourceGraphIndexer.ts`
- `AlembicCore/src/service/source-graph/SourceGraphQueryService.ts`
- `AlembicCore/src/service/source-graph/SourceGraphService.ts`
- `AlembicCore/src/service/source-graph/SourceGraphLifecycle.ts`
- `AlembicCore/src/repository/source-graph/SourceGraphRepository.ts`
- `AlembicCore/src/repository/code/CodeEntityRepository.ts`
- `AlembicCore/src/repository/knowledge/KnowledgeEdgeRepository.ts`
- `AlembicCore/src/service/knowledge/CodeEntityGraph.ts`
- `AlembicCore/src/service/panorama/ModuleDiscoverer.ts`
- `AlembicCore/src/service/panorama/PanoramaTypes.ts`
- `AlembicCore/src/service/panorama/RoleRefiner.ts`
- `AlembicCore/src/service/panorama/LayerInferrer.ts`
- `AlembicCore/src/service/panorama/PanoramaAggregator.ts`
- `AlembicCore/src/service/panorama/PanoramaScanner.ts`
- `AlembicCore/src/service/panorama/CouplingAnalyzer.ts`
- `AlembicCore/src/service/panorama/TechStackProfiler.ts`
- `AlembicCore/src/service/panorama/PanoramaService.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectScopeFolders.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectMatrixProvider.ts`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/test/unit/ProjectMatrixTool.test.ts`
