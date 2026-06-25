# Alembic ProjectContext Unified Boundary And Tool Switch Requirement Design

Date: 2026-06-15

Design Key: `alembic-core-project-context-basic-syntax-boundary-2026-06-15`

Design state: needs-controller-intake

This is a unified ProjectContext demand. It defines the access boundary for the
low-level syntax and structural fact capabilities that `ProjectContext` depends
on, and it folds the former tool integration demand into the same ProjectContext
switch.

It does not replace the ProjectContext requirement. It strengthens the
implementation boundary around it and requires existing project-information
tool consumers to switch directly to `ProjectContext.execute`.

Merged source:

- `Design/docs/current/alembic-project-context-tool-integration-requirement-design-2026-06-14.md`

## Problem

`ProjectContext` needs mature low-level capabilities to read source files,
parse syntax, extract symbols, derive imports/exports, infer call/file
relations, and assemble structural facts.

If those low-level capabilities stay directly callable by every Core feature or
outer repository, Alembic will keep multiple project-information routes:

- one feature may read AST or source graph data directly;
- another may call panorama or project-intelligence structures directly;
- another may call ProjectContext;
- the same project question can produce different structures and refs.

That breaks the point of ProjectContext. Project information should go outward
through ProjectContext. Low-level syntax capabilities should be treated as
internal grammar/syntax foundations for ProjectContext, not as public or
general-purpose project-information APIs.

The same problem exists above Core. If AlembicPlugin MCP tools or Alembic main
built-in Agent tools keep their own project-information paths, host agents can
still receive project maps, symbols, source ranges, refs, and query errors that
do not match ProjectContext. A Core-only boundary would not complete the switch.

## Goal

Create a Core boundary that classifies ProjectContext dependencies as basic
syntax capabilities, prevents direct project-information consumption from
outside ProjectContext, and switches existing upper tool consumers to
ProjectContext for implemented request classes.

The observable outcome is:

- ProjectContext may call basic syntax capabilities;
- other Core features and outer repositories may not call basic syntax
  capabilities directly for project information;
- project information is exposed outward through ProjectContext;
- AlembicPlugin MCP tools call ProjectContext for project-information queries
  covered by implemented request classes;
- Alembic main built-in Agent tools call ProjectContext for the same covered
  query classes;
- equivalent query classes agree on project facts, refs, ordinary query errors,
  and stable ordering across Plugin MCP and Alembic main Agent surfaces;
- general language and project-path capabilities remain directly reusable where
  they are not returning project-information structures;
- import/export gates prove the boundary.

## Non-goals

- No new ProjectContext query level.
- No new project-information provider in AlembicPlugin or Alembic main.
- No visible tool rename by default. Existing final tool names should keep their
  name while their project-information provider switches to ProjectContext.
- No compatibility state or dual project-information route. If a route cannot
  switch to ProjectContext in the implementation slice, it must stop for
  controller decision instead of keeping an old provider beside ProjectContext.
- No unnamed upper tool category. A consumer must be an existing final tool or
  route named by inventory before it enters the demand.
- No Dashboard, CLI, IDE, native, or host-agent runtime work.
- No CLI or daemon work except where an existing Alembic main path already
  exposes built-in Agent tool behavior.
- No marketplace release work except packaging checks needed by changed Plugin
  schemas, skills, README, or tool descriptions.
- No forced rewrite of generic language utilities, path utilities, package-root
  helpers, IO helpers, or ProjectScope/path normalization into ProjectContext.
- No unscanned deletion of stable public exports. Public project-information
  routes that overlap ProjectContext must still end in deletion or removal from
  public project-information access, but only after consumer scan, replacement
  path, and controller approval.
- No direct exposure of basic syntax capability as a new public project
  information API.

## Primary Actors

- AlembicCore implementation window.
- ProjectContext implementation and tests.
- Core features that currently consume AST, source graph, panorama, discovery,
  or project-intelligence facts.
- AlembicPlugin MCP tool handlers and output projectors.
- Alembic main built-in Agent tool adapters and routing.
- Outer repositories that import `@alembic/core/*`.
- Host agents using AlembicPlugin MCP tools.
- Alembic main built-in Agent callers.
- Wakeflow controller reviewing the boundary, consumer migration, and
  cross-surface evidence.

## User Stories

1. As a ProjectContext implementer, I can use parsers, AST walkers, source
   scanners, symbol extractors, and relation extractors as internal basic syntax
   dependencies.
2. As a Core feature author, when I need project map, repo, module, file flow,
   file symbols, source slices, or anchor range information, I call
   ProjectContext instead of low-level syntax modules.
3. As a Core feature author, when I only need generic language detection or
   project path normalization, I can keep using the shared generic capability
   directly.
4. As a public API consumer, I can rely on `@alembic/core/project-context` for
   project information and do not need to know which grammar or syntax module
   produced the facts.
5. As a host agent, I can call `alembic_project_matrix` and receive project
   space, repo, and map facts derived from ProjectContext rather than a separate
   provider.
6. As a host agent, I can call `alembic_graph` and receive
   ProjectContext-backed map, module, module-layer, file-flow, or anchor-range
   facts when those request kinds apply.
7. As an Alembic main built-in Agent caller, I can request the same project map,
   repo, module, file, symbol, source-slice, file-flow, and anchor-range query
   classes through the main tool path.
8. As the controller, I can inspect tests and import gates that prove basic
   syntax capability is not being used as a parallel project-information route.
9. As the controller, I can compare one representative query class across
   Plugin MCP and Alembic main Agent surfaces and see matching project facts,
   refs, ordinary query errors, and stable ordering, with only host-envelope
   differences.

## Proposed Behavior

Core should introduce a clear internal classification:

- **Project information**: facts about project space, repo, map, module,
  module layers, file flow, file symbols, source slices, and anchor ranges.
  These go outward through ProjectContext.
- **Basic syntax capability**: internal source reading, range extraction, parser
  loading, grammar-specific AST walking, import/export extraction, symbol
  extraction, call/file relation extraction, and structural source facts needed
  by ProjectContext.
- **Generic common capability**: language detection, language extension maps,
  project path resolution, ProjectScope/path normalization, package-root
  helpers, filesystem guards, and IO/path utilities that are not themselves
  project-information query outputs.
- **Project path authority**: the single Alembic-owned project path identity
  supplied to ProjectContext by the existing internal project selection,
  registry, or one unified Core entrypoint. ProjectContext must use that value;
  it must not save, infer, or own a second project path source.

Access rules:

1. ProjectContext may import and call basic syntax capability.
2. Basic syntax capability must not import ProjectContext.
3. Other Core features must not call basic syntax capability to answer project
   information questions.
4. Other Core features that need project information must call ProjectContext.
5. Generic common capabilities remain directly reusable by ProjectContext and
   other Core features.
6. Existing public facades that expose basic syntax capability must be reviewed
   and either deleted from public project-information access or protected by
   explicit non-project-information semantics.
7. ProjectContext receives project path identity from Alembic internal context
   or one unified entrypoint. Handlers may normalize and pass that identity
   within a single query, but must not persist an independent project root,
   workspace root, repo root, or space path internally.
8. If a request carries a project path that conflicts with the Alembic-owned
   project path identity, ProjectContext must reject the request instead of
   choosing one path silently.
9. AlembicPlugin MCP and Alembic main built-in Agent tool callers must map host
   input to `ProjectContextRequest`, call `ProjectContext.execute`, and project
   the result back into their own host envelope.
10. Tool callers must preserve ProjectContext data, refs, ordinary query errors,
    and stable ordering. They may add host transport metadata, but must not
    invent project facts or hide query errors.

## Current Code Scan

This scan records the current AlembicCore facts that make the boundary demand
necessary. It is not the final implementation plan; it is the inventory that
the Core work must verify and keep current while implementing the demand.

### ProjectContext Dependency Inventory

| Capability | Current code path | Current ProjectContext use | Boundary decision |
| --- | --- | --- | --- |
| Query contract and stable request routing | `src/service/project-context/ProjectContextService.ts`, `src/service/project-context/interface/*` | dispatches `space`, `repo`, `map`, `module`, `module-layers`, `file-flow`, `file-symbols`, `source-slice`, and `anchor-range` handlers | keep `interface/` as the necessary internal contract and consistency layer; it is not the public API being deleted |
| Source file access, content hash, and source range slicing | `src/service/project-context/sourceSlice/fileAccess.ts`, `src/service/project-context/sourceSlice/range.ts`, `src/shared/contentHash.ts` | `source-slice` loads a file, normalizes a requested range, returns text and refs; upper layers reuse source refs | basic syntax capability owned by ProjectContext providers; filesystem/path helpers stay generic |
| AST runtime and grammar/plugin loading | `src/core/AstAnalyzer.ts`, `src/core/ast/index.ts`, `src/core/ast/ensureGrammars.ts` | `fileSymbols/extract.ts` and `fileFlow/extract.ts` import the AST plugin loader and call `analyzeFile` | basic syntax capability for project facts; external project-information access through AST exports must be removed or replaced |
| File symbol extraction and normalization | `src/service/project-context/fileSymbols/extract.ts`, `naming.ts`, `normalize.ts`, `ranges.ts` | `file-symbols` extracts classes, interfaces, functions, methods, properties, names, signatures, exports, and ranges | ProjectContext provider only |
| File flow, import/export, and call-site extraction | `src/service/project-context/fileFlow/extract.ts`, `normalize.ts` | `file-flow` extracts imports, exports, dynamic imports, CommonJS requires, call sites, and relation sites; `anchor-range` reads related refs from it | ProjectContext provider only |
| Anchor radius composition | `src/service/project-context/anchorRange/anchorRange.ts` | composes `source-slice`, `file-symbols`, and `file-flow` around an anchor range | ProjectContext query layer; not a separate public syntax capability |
| Module layer and module rollups | `src/service/project-context/moduleLayers/moduleLayers.ts`, `src/service/project-context/module/module.ts`, `src/service/project-context/shared/moduleLayers-module/*` | rolls file flow and symbol refs into layers, modules, and containing relationships | ProjectContext layer built from lower ProjectContext handlers |
| Project map rollup | `src/service/project-context/map/map.ts` | composes modules and module layers into project map output | ProjectContext layer built from lower ProjectContext handlers |
| Repo discovery and build/config facts | `src/service/project-context/repo/repo.ts`, `src/core/discovery/index.ts`, `src/core/discovery/ProjectDiscoverer.ts`, `src/core/discovery/SourceScanExclusions.ts` | repo query reads discovery registry, target metadata, dependency/config facts, excluded source dirs, language stats, and map summary | project-structure provider for ProjectContext; parser helpers may stay generic only when they do not answer project-information queries |
| Space and project-scope facts | `src/service/project-context/space/space.ts`, `src/shared/ProjectScope.ts` | space query reads configured project folders and falls back to one standalone repo when no space is configured | generic common capability for path/scope representation; ProjectContext owns project-information output |

### Project Path Authority Constraint

ProjectContext must not become another place that stores or decides the current
project path. Its inputs must be anchored by one Alembic-owned project path
identity, supplied either by the existing internal project selection/registry or
by one unified Core entrypoint.

The allowed shape is:

- Alembic resolves the current project path identity before ProjectContext
  executes;
- ProjectContext receives that identity as part of request context or through
  the unified entrypoint;
- all ProjectContext handlers use the same normalized path identity for `space`,
  `repo`, `map`, `module`, `module-layers`, `file-flow`, `file-symbols`,
  `source-slice`, and `anchor-range`;
- lower providers may derive relative paths, file paths, and refs from the
  supplied identity for one query;
- ProjectContext does not save its own project root, workspace root, repo root,
  or space path between queries.

The forbidden shape is:

- each handler reads or stores its own project root;
- source-slice, repo, map, and space handlers accept different roots for the
  same query path;
- ProjectContext falls back to process cwd, package-root discovery, or local
  config as a path authority when Alembic already supplied a project identity;
- request payload paths override the Alembic-owned project path identity without
  an explicit conflict error.

### Tool Consumer Direct Switch

The former standalone tool integration demand is part of this requirement.
Upper surfaces do not create another project-information layer. They only
translate their host input into a ProjectContext request and translate the
ProjectContext result back into the host envelope.

The direct switch shape is:

1. accept existing host tool input;
2. resolve the Alembic-owned project path identity before ProjectContext runs;
3. derive the ProjectContext request kind and payload;
4. construct a `ProjectContextRequest`;
5. call `ProjectContext.execute`;
6. project returned data, refs, ordinary query errors, and ordering into the
   host result envelope;
7. remove the replaced old project-information provider call after tests pass.

Expected AlembicPlugin MCP mapping:

| MCP surface | ProjectContext request kinds |
| --- | --- |
| `alembic_project_matrix` | `space`, `repo`, `map` |
| `alembic_graph` | `map`, `module`, `module-layers`, `file-flow`, `anchor-range` |
| `alembic_prime` project context | `space`, `repo`, `map`, `anchor-range` when an active file or source ref is present |

There is no separate unnamed file/source navigation abstraction in this demand.
If inventory finds an existing final MCP tool that returns project file, symbol,
source range, or flow facts, that tool must be named explicitly and either
switched directly to ProjectContext or removed from this demand.

`alembic_search` keeps knowledge retrieval as its responsibility. It may use
ProjectContext only to bind search scope, active file, or source refs to project
facts. It must not become a ProjectContext wrapper.

Expected Alembic main built-in Agent consumers:

- internal Agent tools that need project map, repo, module, file, symbol,
  source-slice, file-flow, or anchor-range context;
- daemon or Agent routes that prepare project context for an Agent task;
- CLI or local command paths only when they already expose built-in Agent
  project tool behavior.

Alembic main and AlembicPlugin must consume `@alembic/core/project-context`
through the package entrypoint. They must not import Core source files directly
and must not duplicate ProjectContext internals.

### Current Direct Consumers To Review

| Current consumer or export | Direct dependency found in scan | Required route |
| --- | --- | --- |
| `src/project-intelligence.ts` | stable public facade re-exporting AST analysis, grammar loading, `ProjectGraph`, discovery registry/parsers, panorama, snapshots, and project-intelligence workflows | remove project-information access from this public facade after consumers move to ProjectContext; keep only explicitly non-overlapping generic/common symbols |
| `src/source-graph.ts` | stable public facade exporting domain, repository, and service source graph contracts | delete as an outward project-information query route after ProjectContext replacement and consumer migration |
| `src/service/index.ts` | broad service index re-exports `panorama` and `source-graph` | remove broad project-information access that bypasses ProjectContext |
| `src/domain/index.ts` | broad domain index re-exports `source-graph` | remove source graph from broad domain public path when it acts as project-information output |
| `src/repository/index.ts` | broad repository index re-exports `source-graph` | remove source graph repository access from public project-information paths unless a non-project-information storage contract is explicitly justified |
| `src/service/project-intelligence/AnalysisPhaseRunners.ts` | directly calls `AstAnalyzer`, discovery registry, grammar loading, and call graph analysis | migrate overlapping project information to ProjectContext; retain direct syntax use only when classified as non-overlapping implementation work |
| `src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts` | uses project-intelligence phase runners and `SourceGraphLifecycleService` | rebuild project-information phases on ProjectContext or make the workflow a ProjectContext consumer |
| `src/types/ProjectSnapshot.ts` and snapshot projections | type surface still carries source graph and phase-analysis structures | replace overlapping project-information data with ProjectContext-backed data or classify it as non-overlapping; not a preferred project-information route |
| `src/service/guard/GuardCheckEngine.ts` and `src/service/guard/ComplianceReporter.ts` | direct AST analyzer/plugin loader usage | classify precisely: allowed only for Guard rule execution that is not a project-information query; project facts must come from ProjectContext |
| `src/infrastructure/vector/ASTChunker.ts` | dynamically imports AST plugin loader and analyzer | classify as low-level vector chunking or migrate if it returns project-information structures |
| AlembicPlugin MCP handlers | `alembic_project_matrix`, `alembic_graph`, and `alembic_prime` project-context branches can still carry their own project facts | map existing tool input to ProjectContext requests and remove replaced providers |
| Alembic main built-in Agent tools | internal Agent project context, map, repo, module, file, symbol, source, and flow consumers need inventory | call `@alembic/core/project-context` through the package facade and remove duplicate providers |
| public and unit tests | public source graph, project intelligence, AST grammar, discovery, panorama, ProjectContext, and repository tests import old paths | update tests to prove the new boundary; retained tests must name non-project-information purpose |

### Public Interface Deletion End State

ProjectContext should be the public project-information route. The following
external project-information routes must be deleted or removed from public
project-information access after the consumer scan and replacement path are
complete:

- `@alembic/core/source-graph`;
- `@alembic/core/project-intelligence` exports for AST project analysis,
  grammar/project graph access, discovery, panorama, snapshots, and structural
  project facts;
- `@alembic/core/core/analysis`;
- `@alembic/core/core/ast`;
- `@alembic/core/core/ast/*`;
- `@alembic/core/core/discovery`;
- `@alembic/core/service/panorama`;
- `@alembic/core/workflows/capabilities/project-intelligence` when used as a
  project-information access route;
- broad `service`, `domain`, and `repository` index exports that expose
  source-graph, panorama, AST, discovery, or project-intelligence project facts.

Deletion means these paths are no longer accepted project-information APIs.
Deletion is not complete until pre-change and post-change import scans prove
all project-information callers either switched to ProjectContext, were removed,
or were classified as non-project-information. The demand should not keep a
public dual route.

## Boundary Definitions

### Basic Syntax Capability

Basic syntax capability includes internal modules that produce raw or normalized
syntax facts for ProjectContext, such as:

- parser and grammar loading;
- language-specific AST walkers;
- source file content and source range extraction;
- symbol extraction and naming facts;
- import/export extraction;
- call or relation extraction;
- source graph file/symbol/edge facts when used as ProjectContext inputs;
- mature scanner logic split into ProjectContext-level providers.

Basic syntax capability is allowed to return low-level facts to ProjectContext.
It must not become the external answer to project-information requests.

### Project Information

Project information includes:

- `space`;
- `repo`;
- `map`;
- `module`;
- `module-layers`;
- `file-flow`;
- `file-symbols`;
- `source-slice`;
- `anchor-range`.

These are ProjectContext request classes. Their outward path is
`ProjectContext.execute`.

### Tool Surfaces

Tool surfaces are consumers, not owners, of project information:

- AlembicPlugin MCP tools own host schemas, MCP routing, output envelopes,
  public tool descriptions, skills, README wording, and Plugin packaging
  checks.
- Alembic main owns built-in Agent tool routing, local Agent tool execution,
  package consumption, and existing CLI/daemon connections that already expose
  Agent tool behavior.

Both surfaces must treat ProjectContext output as the project-information
payload. Their host envelopes may differ, but project facts, refs, ordinary
query errors, and stable ordering must match for equivalent request classes.

### Generic Common Capability

Generic common capability is not forced through ProjectContext. It includes:

- language identity and extension mapping;
- parser availability checks when used as platform capability checks, not as
  project-information output;
- project root and project path normalization;
- ProjectScope/path representation;
- package-root helpers;
- IO/path safety helpers;
- generic config/path utilities.

These capabilities can stay shared because they do not answer "what is in this
project?" by themselves.

Project path normalization is generic common capability. Project path authority
is not. ProjectContext may call path normalization helpers, but the source of
the current project path must come from Alembic's single project identity path.

## Implementation Decisions

- Use a clear Core-internal folder or module ownership boundary for basic
  syntax capability. The final folder name is implementation-owned, but the
  boundary must be obvious in imports and tests.
- Basic syntax capability should expose only internal contracts needed by
  ProjectContext providers.
- ProjectContext providers should be the only direct project-information
  consumer of basic syntax capability.
- Existing AST, source graph, discovery, panorama, and project-intelligence
  code must be classified before migration:
  `basic-syntax`, `generic-common`, `ProjectContext-provider`,
  `ProjectContext-consumer`, `external-public-to-delete`, or `no-overlap`.
- Public source graph, AST, discovery, panorama, or project-intelligence
  exports that overlap ProjectContext must be deleted from public
  project-information access after consumer replacement. No public dual route is
  part of the design; if a consumer cannot switch, implementation stops for
  controller decision.
- The public `@alembic/core/project-context` facade remains the outward
  project-information query surface.
- ProjectContext must not keep a private current-project path. Its service,
  handler registry, and providers must receive one Alembic-owned project path
  identity per query or through one unified Core entrypoint.
- Request payload paths are scoped under the supplied project identity. They are
  not authority to switch ProjectContext to another project root.
- AlembicPlugin and Alembic main callers should keep their own host envelopes,
  but the project-information payload inside those envelopes must be produced by
  ProjectContext for covered request classes.
- The surface-local caller path is a translation step only:
  host input to `ProjectContextRequest`, `ProjectContext.execute`, then
  ProjectContext result to host envelope.
- No surface-local caller may cache, rebuild, or reinterpret ProjectContext
  facts as a second provider.
- Existing visible tool names should be preserved while their project facts
  switch to ProjectContext. Tool rename or deletion requires explicit controller
  decision.
- Import boundaries should be enforced by tests or lint scripts, not by
  comments alone.

## Concrete Implementation Plan

This demand should run as one connected ProjectContext switch, not as separate
Core, Plugin, and main-agent demands. The controller should create one state
root and dispatch producer/consumer packages from it.

### Implementation Chain

1. **Controller intake**
   - Create one state root for this merged ProjectContext demand.
   - Freeze the confirmed decisions: no unnamed tool category, no public dual
     route, no new project-information provider, no extra CLI/daemon/UI
     capability.
   - Record affected windows: `AlembicCore`, `AlembicPlugin`, `Alembic`, and
     controller validation. `Test` is only a later real-scenario validation
     option if the controller cannot self-verify runtime behavior.

2. **Core inventory**
   - Scan current `ProjectContext` handlers, current low-level syntax imports,
     current path sources, current public package exports, and current consumers
     of AST, source graph, panorama, discovery, and project-intelligence project
     facts.
   - Produce a reviewed replacement matrix with exact consumers and exact
     deletion targets.
   - No product behavior changes happen in this step.

3. **Core contract and path authority**
   - Finalize the `ProjectContextRequest` contract and `interface/` checks.
   - Add the single Alembic-owned project path identity input.
   - Reject conflicting request roots.
   - Add tests proving ProjectContext does not persist a private project path.

4. **Core ProjectContext providers**
   - Implement or complete `source-slice`, `file-symbols`, `file-flow`,
     `anchor-range`, `module-layers`, `module`, `map`, `repo`, and `space`
     handlers using migrated mature low-level capabilities.
   - Keep parsing/symbol/relation capabilities internal to ProjectContext
     providers.
   - Do not introduce a new upper abstraction layer over ProjectContext.

5. **Core consumer replacement and public API deletion**
   - Replace Core project-information consumers with ProjectContext.
   - Delete public project-information routes that overlap ProjectContext after
     pre-change import scan and replacement.
   - Run post-deletion import scan and public API boundary tests.
   - Retain only explicitly non-project-information generic/common symbols.

6. **AlembicPlugin direct switch**
   - Switch `alembic_project_matrix`, `alembic_graph`, and the project-context
     branch of `alembic_prime` to call `ProjectContext.execute`.
   - Preserve existing final tool names.
   - Preserve ProjectContext data, refs, ordinary query errors, and stable
     ordering in MCP output.
   - If inventory finds another existing final MCP tool returning project file,
     symbol, source range, or flow facts, name it explicitly before it can be
     switched. Otherwise it stays outside this demand.

7. **Alembic main built-in Agent direct switch**
   - Switch only existing built-in Agent project tool behavior to
     `@alembic/core/project-context`.
   - Do not add new CLI, daemon, UI, or Agent capability.
   - Do not import Core source files directly.

8. **Cross-surface verification**
   - Run representative ProjectContext query classes through Core direct tests,
     Plugin MCP tools, and Alembic main built-in Agent tool paths.
   - Compare project facts, refs, ordinary query errors, and stable ordering.
   - Verify deleted public project-information routes are not used by remaining
     project-information consumers.

### Producer And Consumer Dependencies

| Producer | Consumer | Dependency |
| --- | --- | --- |
| Controller intake | all windows | one state root, confirmed scope, and task package ids |
| AlembicCore inventory | AlembicCore implementation | exact consumer/export/path-source matrix |
| AlembicCore contract/path authority | Core providers, Plugin, main | stable `ProjectContextRequest` shape and path identity rule |
| AlembicCore providers | Core consumer replacement, Plugin, main | implemented request kinds and tests |
| Core consumer replacement/public deletion | Plugin/main final validation | old public project-information routes removed or proven non-overlapping |
| Plugin direct switch | cross-surface validation | MCP evidence for mapped tool outputs |
| Main built-in Agent direct switch | cross-surface validation | built-in Agent evidence for mapped query classes |

### Stop Conditions

- A consumer cannot be named as an existing final tool or route.
- A public project-information route cannot be deleted because an active
  consumer has no ProjectContext replacement.
- A request path can conflict with the Alembic-owned project identity without a
  deterministic error.
- A tool surface adds a new provider, cache, abstraction, or inferred project
  facts above ProjectContext.
- Plugin or main needs a new visible tool, CLI, daemon, or UI capability to
  satisfy the task.

## Testing Decisions

Minimum validation should include:

- an import-boundary test that allows basic syntax imports only from
  ProjectContext implementation and its own tests;
- a public API inventory test proving no new public basic syntax project
  information export appears;
- tests proving ProjectContext request handlers can consume basic syntax
  capability for source-slice, file-symbols, and file-flow facts;
- tests proving other Core features that need project information use
  ProjectContext rather than basic syntax modules;
- consumer import scan before deleting any existing public facade;
- regression tests for generic common capabilities, proving language and path
  utilities remain directly usable outside ProjectContext;
- path-authority tests proving all ProjectContext request classes use the same
  supplied project identity and reject conflicting roots instead of silently
  selecting another path;
- tests proving ProjectContext does not persist a project root across queries;
- AlembicPlugin handler tests proving mapped MCP operations call
  `ProjectContext.execute` with expected request kinds;
- AlembicPlugin output tests proving ProjectContext data, refs, ordinary query
  errors, and stable ordering survive MCP projection;
- real local MCP verification for at least `alembic_project_matrix`,
  `alembic_graph`, and the `alembic_prime` project-context branch when an
  active file or source ref is present;
- any additional existing final MCP tool found by inventory to return project
  file, symbol, source range, or flow facts must be named explicitly before it
  can be mapped or tested;
- Alembic main package import test proving the built-in Agent tool path consumes
  `@alembic/core/project-context` rather than Core source files;
- Alembic main Agent tool execution test proving request mapping and result
  envelope behavior;
- cross-surface validation that runs the same representative ProjectContext
  query classes through Plugin MCP and Alembic main Agent tools and compares
  project facts, refs, ordinary query errors, and stable ordering.

Suggested Core validation after implementation:

- `npm run build:check`;
- targeted Vitest for ProjectContext and import-boundary tests;
- public API boundary check;
- `npm run build`;
- `npm run check`;
- `git diff --check`.

## Acceptance Criteria

- The demand inventory classifies ProjectContext dependencies into basic syntax
  capability, generic common capability, ProjectContext provider,
  ProjectContext consumer, external public route to delete, or no-overlap.
- The current dependency inventory lists the parser, syntax, symbol, relation,
  source-slice, discovery, scope, module, map, repo, and space capabilities that
  ProjectContext depends on.
- The current consumer scan lists Core features, facades, and tests that still
  call AST, source graph, panorama, discovery, or project-intelligence surfaces
  directly.
- Basic syntax capability is not exposed as a new public project-information
  API.
- Basic syntax capability is directly imported only by ProjectContext
  implementation, its own internal modules, and allowed tests.
- Other Core features that need project information call ProjectContext.
- AlembicPlugin MCP tools mapped in this design call `ProjectContext.execute`
  for project-information queries covered by implemented request kinds.
- Alembic main built-in Agent tools mapped in this design call
  `ProjectContext.execute` for the same covered query classes.
- `alembic_project_matrix` and `alembic_graph` project-information outputs come
  from ProjectContext after their mapped request kinds exist.
- The `alembic_prime` project-context branch uses ProjectContext only for
  project facts and source refs when an active file or source ref is present.
- No unnamed file/source navigation abstraction is introduced above
  ProjectContext. Any additional final tool that returns project file, symbol,
  source range, or flow facts must be named by inventory before implementation.
- At least one Alembic main built-in Agent tool execution path proves project
  map, repo, module, file, symbol, source-slice, file-flow, or anchor-range
  routing through ProjectContext.
- Host output envelopes preserve ProjectContext data, refs, ordinary query
  errors, and stable ordering.
- Cross-surface comparison shows matching project facts, refs, ordinary query
  errors, and stable ordering for the same representative query class.
- Generic language and project-path capabilities remain directly callable where
  they do not return project-information structures.
- ProjectContext does not store or own project paths internally. It receives the
  Alembic-owned project path identity through request context or one unified
  entrypoint.
- All ProjectContext request classes use the same project path identity for the
  same query, and conflicting request paths fail explicitly.
- Existing public source graph, project intelligence, panorama, AST, or
  discovery surfaces that overlap ProjectContext are deleted from public
  project-information access after consumer proof and replacement.
- Any retained public symbol has an explicit non-project-information purpose.
- No direct Core source import is introduced in AlembicPlugin or Alembic main.
- Import-boundary tests and public API tests fail if a new direct dependency on
  basic syntax capability appears outside the allowed scope.
- ProjectContext remains the outward project-information provider.

## Risks And Open Questions

- Some current stable public exports may expose syntax-related symbols. They
  need consumer scans before deletion.
- Source graph can be both a mature source fact capability and an existing
  public facade. The internal source facts can be reused by ProjectContext, but
  the public source graph facade should not remain a parallel project
  information answer.
- Project intelligence may keep workflow orchestration, but project facts inside
  those workflows should come from ProjectContext when they overlap its request
  classes.
- Generic language and path utilities need precise tests so they are not
  accidentally blocked by the basic syntax boundary.
- Path normalization helpers and path authority can be confused. The design must
  keep helpers reusable while making the Alembic-owned project path identity the
  only authority for ProjectContext.
- Some MCP tool fields may not map one-to-one to ProjectContext. Controller
  intake must classify each field as keep, derive from ProjectContext, or
  remove. There is no compatibility bucket.
- `alembic_prime` mixes project context with other knowledge. Its ProjectContext
  usage should stay limited to project facts and source refs.
- `alembic_search` should not be turned into a ProjectContext wrapper. Its use
  of ProjectContext should stay limited to binding search scope or source refs.
- Main built-in Agent tool names and public exposure need code-fact inventory
  before implementation. Design should not invent missing tool names.
- Cross-surface equality means matching project facts, refs, ordinary query
  errors, and stable ordering, not identical host envelopes.
- A too-broad "basic syntax" label could hide real public contracts. The first
  task must inventory and classify before moving code.
- Deleting public routes without migrating known consumers would break the
  package contract. The deletion work needs scan output, replacement entrypoint,
  post-deletion import scan, and validation evidence before it can be accepted.

## Controller Intake Notes

This document is a Design handoff candidate, not a dispatch packet.

Recommended controller route:

1. create one state root for the merged ProjectContext switch;
2. dispatch inventory before implementation;
3. dispatch Core contract/path authority before providers or consumers;
4. dispatch Core providers before Plugin/main consumers;
5. dispatch Core consumer replacement and public deletion before final
   cross-surface acceptance;
6. dispatch Plugin and main direct-switch packages only after the needed
   ProjectContext request kinds exist;
7. run controller self-validation first;
8. use Test only if a real runtime scenario cannot be safely self-verified.

No product source change, controller-state change, task package, or dispatch is
authorized by this document alone.

## Controller Automation Demand Group

These are controller-ready task packages. They are not active tasks until
Wakeflow creates a state root and dispatches them.

### PCU-0: Controller Intake And State Root

Owner window: `AlembicWorkspace`.

Purpose:

- create one controller state root for the merged ProjectContext demand;
- record confirmed scope, non-goals, affected windows, producer/consumer order,
  and stop conditions;
- convert this Design document into dispatchable task packages.

Included tasks:

- freeze the final completion definition;
- record no dual route, no unnamed tool category, no new provider, and no extra
  CLI/daemon/UI capability;
- prepare a coverage table for `AlembicCore`, `AlembicPlugin`, `Alembic`, and
  controller validation.

Dependencies: this Design handoff.

Validation:

- controller document/state-root consistency check;
- no product repository files changed.

Backfill evidence:

- state root path;
- task package ids;
- coverage table;
- explicit no-send entries for blocked downstream windows.

### PCU-1: AlembicCore Inventory And Replacement Matrix

Owner window: `AlembicCore`.

Purpose:

- prove exact current consumers and exact replacement/deletion targets before
  implementation.

Included tasks:

- inventory ProjectContext handlers and request kinds;
- inventory parsing/syntax/symbol/relation providers used by ProjectContext;
- inventory project path sources and path normalization helpers;
- inventory public package exports and broad index exports that expose project
  information;
- inventory Core consumers of AST, source graph, panorama, discovery, and
  project-intelligence project facts;
- produce a replacement matrix with one of: `replace-with-ProjectContext`,
  `delete`, or `non-project-information`.

Non-goals:

- no behavior change;
- no public API deletion;
- no Plugin or main work.

Dependencies: PCU-0.

Validation:

- import/export scan saved as evidence;
- targeted test inventory saved as evidence.

Backfill evidence:

- replacement matrix;
- path-source matrix;
- public export deletion candidates;
- blockers if any consumer cannot be mapped.

### PCU-2: AlembicCore Contract And Path Authority

Owner window: `AlembicCore`.

Purpose:

- make ProjectContext contract and path identity deterministic before providers
  and consumers depend on it.

Included tasks:

- finalize `ProjectContextRequest` and handler result contracts in
  `service/project-context/interface/`;
- add one Alembic-owned project path identity input;
- reject request roots that conflict with that identity;
- prove ProjectContext does not store a project root across queries;
- add import-boundary checks for ProjectContext and basic syntax capability.

Non-goals:

- no Plugin or main tool work;
- no public API deletion yet.

Dependencies: PCU-1.

Validation:

- ProjectContext contract tests;
- path conflict tests;
- no-private-path persistence test;
- import-boundary test.

Backfill evidence:

- changed files;
- command outputs;
- contract notes for downstream windows.

### PCU-3: AlembicCore ProjectContext Providers

Owner window: `AlembicCore`.

Purpose:

- complete ProjectContext project-information request classes from lower facts
  upward.

Included tasks:

- implement or complete `source-slice`;
- implement or complete `file-symbols`;
- implement or complete `file-flow`;
- implement or complete `anchor-range`;
- implement or complete `module-layers`;
- implement or complete `module`;
- implement or complete `map`;
- implement or complete `repo`;
- implement or complete `space`;
- keep source parsing/symbol/relation logic internal to ProjectContext
  providers.

Non-goals:

- no new upper abstraction above ProjectContext;
- no Plugin or main work.

Dependencies: PCU-2.

Validation:

- targeted ProjectContext tests for every implemented request kind;
- handler ordering and refs tests;
- `npm run build:check`;
- `git diff --check`.

Backfill evidence:

- request kind coverage table;
- handler tests;
- known unsupported file/language boundaries, if any.

### PCU-4: AlembicCore Consumer Replacement And Public API Deletion

Owner window: `AlembicCore`.

Purpose:

- remove ProjectContext-overlapping public project-information routes and prove
  their callers were replaced.

Included tasks:

- replace Core project-information consumers with ProjectContext;
- delete or withdraw public project-information access for source graph,
  project-intelligence, panorama, AST, discovery, and broad index routes when
  they overlap ProjectContext;
- keep only explicit non-project-information generic/common symbols;
- update public API policy and public API tests;
- run pre-change and post-change import scans.

Non-goals:

- no public dual route;
- no fallback provider beside ProjectContext;
- no Plugin or main changes in this package.

Dependencies: PCU-3.

Validation:

- pre-change import scan;
- post-change import scan;
- public API boundary tests;
- representative Core consumer tests;
- `npm run build`;
- `npm run check`;
- `git diff --check`.

Backfill evidence:

- deleted/changed export list;
- caller replacement proof;
- non-project-information retained symbols list.

### PCU-5: AlembicPlugin MCP Direct Switch

Owner window: `AlembicPlugin`.

Purpose:

- switch existing MCP project-information outputs to ProjectContext without
  adding a new provider or new tool.

Included tasks:

- switch `alembic_project_matrix` to ProjectContext request kinds
  `space`, `repo`, and `map`;
- switch `alembic_graph` to ProjectContext request kinds `map`, `module`,
  `module-layers`, `file-flow`, and `anchor-range`;
- switch only the project-context branch of `alembic_prime` to
  ProjectContext for project facts and source refs;
- inventory any other final MCP tool returning project file, symbol, source
  range, or flow facts; switch it only if explicitly named in the task package;
- preserve ProjectContext data, refs, ordinary query errors, and stable ordering
  in MCP output envelopes.

Non-goals:

- no new MCP tool;
- no renamed tool;
- no ProjectContext wrapper in `alembic_search`;
- no direct Core source import.

Dependencies: PCU-2 for contract and PCU-3 for required request kinds. PCU-4 is
required before final acceptance if Plugin currently imports deleted public
project-information routes.

Validation:

- MCP handler mapping tests;
- MCP output projection tests;
- real local MCP verification for `alembic_project_matrix`;
- real local MCP verification for `alembic_graph`;
- project-context branch test for `alembic_prime`;
- Plugin build/check;
- `git diff --check`.

Backfill evidence:

- mapped tool list;
- handler test outputs;
- real MCP verification output;
- any final MCP tool excluded because it was not explicitly named.

### PCU-6: Alembic Main Built-In Agent Direct Switch

Owner window: `Alembic`.

Purpose:

- switch existing built-in Agent project-information behavior to
  `@alembic/core/project-context`.

Included tasks:

- inventory built-in Agent project tool routes that already expose project map,
  repo, module, file, symbol, source-slice, file-flow, or anchor-range facts;
- switch mapped routes to `ProjectContext.execute`;
- import ProjectContext only through the package facade;
- preserve returned ProjectContext facts, refs, ordinary query errors, and
  stable ordering in existing Agent tool envelopes;
- remove old provider calls for mapped behavior.

Non-goals:

- no new Agent capability;
- no new CLI, daemon, UI, or host-agent runtime feature;
- no direct Core source import.

Dependencies: PCU-2 for contract and PCU-3 for required request kinds. PCU-4 is
required before final acceptance if Alembic currently imports deleted public
project-information routes.

Validation:

- package import test for `@alembic/core/project-context`;
- built-in Agent routing tests;
- local Agent tool execution test;
- targeted build/check for touched Alembic surface;
- `git diff --check`.

Backfill evidence:

- mapped Agent route list;
- command outputs;
- removed old provider call list;
- blockers if an existing route cannot switch without new capability.

### PCU-7: Cross-Surface Verification And Acceptance

Owner window: `AlembicWorkspace` controller by default. `Test` may be used only
if the controller cannot safely self-verify a real runtime scenario.

Purpose:

- prove the whole ProjectContext switch as one result, not as isolated green
  packages.

Included tasks:

- run one representative `space/repo/map` query through Core and Plugin;
- run one representative `map/module/module-layers` query through Core and
  Plugin;
- run one representative `file-flow` or `anchor-range` query through Core and
  Plugin when those request kinds are implemented;
- run the matching available built-in Agent project query through Alembic main;
- compare project facts, refs, ordinary query errors, and stable ordering;
- verify deleted public project-information routes are not used by remaining
  project-information consumers.

Non-goals:

- no new implementation;
- no acceptance from backfill prose alone.

Dependencies: PCU-4, PCU-5, and PCU-6.

Validation:

- raw command outputs from Core, Plugin MCP, and Alembic main;
- comparison report;
- final import scan;
- controller evidence review.

Backfill evidence:

- comparison report path;
- final pass/fail judgment;
- remaining blockers, if any;
- archive or next-work recommendation.

## Controller Handoff Prompt

```text
Receive this Design handoff as one merged ProjectContext demand:
Design/docs/current/alembic-core-project-context-basic-syntax-boundary-requirement-design-2026-06-15.md

Create one controller state root and automate the PCU task group in order.

Confirmed scope:
- ProjectContext is the sole project-information route.
- No unnamed file/source navigation abstraction.
- No dual public project-information route.
- No new project-information provider in AlembicPlugin or Alembic main.
- No new CLI, daemon, UI, or Agent capability.
- Public project-information deletion is accepted only after caller replacement
  and post-deletion import scan.

Dispatch order:
PCU-0 controller intake -> PCU-1 AlembicCore inventory -> PCU-2 Core contract
and path authority -> PCU-3 Core providers -> PCU-4 Core consumer replacement
and public API deletion -> PCU-5 AlembicPlugin direct switch + PCU-6 Alembic
main direct switch -> PCU-7 cross-surface verification.

Use Test only if controller self-verification cannot safely prove a required
real runtime scenario.
```

## Source References

- `Design/docs/current/alembic-core-project-context-requirement-design-2026-06-14.md`
- `Design/docs/current/alembic-project-context-tool-integration-requirement-design-2026-06-14.md`
- `AlembicCore/AGENTS.md`
- `AlembicCore/src/project-context.ts`
- `AlembicCore/src/service/project-context/index.ts`
- `AlembicCore/src/service/project-context/interface/projectContext.ts`
- `AlembicCore/src/service/project-context/interface/contracts.ts`
- `AlembicCore/src/service/project-context/sourceSlice/fileAccess.ts`
- `AlembicCore/src/service/project-context/sourceSlice/sourceSlice.ts`
- `AlembicCore/src/service/project-context/fileSymbols/extract.ts`
- `AlembicCore/src/service/project-context/fileSymbols/fileSymbols.ts`
- `AlembicCore/src/service/project-context/fileFlow/extract.ts`
- `AlembicCore/src/service/project-context/fileFlow/fileFlow.ts`
- `AlembicCore/src/service/project-context/anchorRange/anchorRange.ts`
- `AlembicCore/src/service/project-context/moduleLayers/moduleLayers.ts`
- `AlembicCore/src/service/project-context/module/module.ts`
- `AlembicCore/src/service/project-context/map/map.ts`
- `AlembicCore/src/service/project-context/repo/repo.ts`
- `AlembicCore/src/service/project-context/space/space.ts`
- `AlembicCore/src/core/AstAnalyzer.ts`
- `AlembicCore/src/core/ast/index.ts`
- `AlembicCore/src/core/ast/ProjectGraph.ts`
- `AlembicCore/src/core/analysis/index.ts`
- `AlembicCore/src/project-intelligence.ts`
- `AlembicCore/src/source-graph.ts`
- `AlembicCore/src/service/index.ts`
- `AlembicCore/src/service/source-graph/index.ts`
- `AlembicCore/src/service/panorama/index.ts`
- `AlembicCore/src/service/project-intelligence/AnalysisPhaseRunners.ts`
- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts`
- `AlembicCore/src/types/ProjectSnapshot.ts`
- `AlembicCore/src/service/guard/GuardCheckEngine.ts`
- `AlembicCore/src/infrastructure/vector/ASTChunker.ts`
- `AlembicCore/src/domain/index.ts`
- `AlembicCore/src/repository/index.ts`
- `AlembicCore/src/shared/LanguageService.ts`
- `AlembicCore/src/shared/ProjectScope.ts`
- `AlembicCore/package.json`
- `AlembicCore/config/public-api-boundary.json`
- `Alembic/AGENTS.md`
- `Alembic/package.json`
- `Alembic/lib/types/agent.d.ts`
- `Alembic/lib/daemon/ProjectRuntimeSourceOfTruth.ts`
- `Alembic/lib/project-scope/ProjectScopeRegistry.ts`
- `Alembic/test/unit/AgentTaskHandlers.test.ts`
- `Alembic/test/unit/ToolExecutionPipeline.test.ts`
- `Alembic/test/unit/AgentService.test.ts`
- `Alembic/test/unit/V2ToolSystem.test.ts`
- `AlembicPlugin/AGENTS.md`
- `AlembicPlugin/package.json`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/lib/runtime/mcp/tools.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/project-matrix.ts`
- `AlembicPlugin/lib/runtime/mcp/public-tools/contract.ts`
- `AlembicPlugin/lib/runtime/mcp/public-tools/output.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/index.ts`
- `AlembicPlugin/test/unit/ProjectMatrixTool.test.ts`
- `AlembicPlugin/test/unit/ProjectGraphTool.test.ts`
- `AlembicPlugin/test/unit/AgentPublicToolsActive.test.ts`
- `AlembicPlugin/test/unit/AgentPublicToolsEvaluation.test.ts`
