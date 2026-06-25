# Alembic ProjectContext Interface Surface Optimization Requirement Design

Date: 2026-06-15

Design Key: `alembic-project-context-interface-surface-optimization-2026-06-15`

Design state: confirmed-ready-for-controller-intake

This demand starts after the PCU ProjectContext implementation work. It does
not redesign ProjectContext. It checks and closes the remaining interface
surface so Alembic project-information facts are exposed and consumed through
ProjectContext as the single project-information capability route.

## User Confirmation

Confirmed by user on 2026-06-15:

- ProjectContext is the only project-information source.
- Plugin and Alembic Agent consume ProjectContext results directly, with no new
  analysis wrapper or middle project-information layer.
- Skipped middle layers become deletion candidates after ProjectContext direct
  consumption is proven.
- `AgentProjectContextAnalysis.ts` / `runAgentProjectContextAnalysis` 这种把
  ProjectContext 结果重新适配成旧分析结果的中间层也在删除范围内。
- Missing Agent-required project-information facts are added to the owning
  ProjectContext query kind, not rebuilt through old middle layers.
- Guard, Recipe, dimension, cleanup, session, AI execution, and response
  envelope behavior stay outside ProjectContext.
- Final user-facing tool names may stay only as ProjectContext-backed
  presentations.
- Acceptance must verify fresh Plugin/MCP surface, Plugin cold-start/rescan,
  Plugin matrix/graph/prime, Alembic built-in Agent cold-start/rescan, resident
  old-route removal or retirement, single-repo and multi-repo space behavior,
  unavailable ProjectContext data, and large-source output trimming.

## Inspection Summary

Current inspection result: not yet only ProjectContext.

ProjectContext exists and is already consumed by some upper project knowledge
providers, but the Alembic space still exposes or consumes several old
project-information routes:

- `@alembic/core/project-context` exists as a public package export.
- `@alembic/core/project-intelligence` is still exported beside it.
- `@alembic/core/service/panorama` is still exported as a public package
  subpath.
- `@alembic/core/workflows/capabilities/project-intelligence` is still exported
  as a public package subpath.
- Core root still re-exports IDEAgentAnalysis packet helpers from the old
  project-intelligence workflow capability.
- AlembicPlugin still declares visible source graph local tools and source
  graph status/query schemas in the Codex tool policy.
- AlembicPlugin still describes project matrix and graph outputs in
  `sourceGraphRef` and source graph terms.
- AlembicPlugin still resolves `alembic_panorama` in the MCP server handler map.
- AlembicPlugin project matrix and graph providers call ProjectContext, but
  still accept and return `sourceGraphRef` as a parallel project-information
  freshness/source marker.
- AlembicPlugin cold-start and knowledge-rescan host-agent workflows still call
  `ProjectIntelligenceCapability.run`.
- Alembic main resident structure and panorama handlers still expose old
  discoverer/panorama project-information paths.
- Alembic main AgentProjectContext analysis uses ProjectContext, but still
  acts as an adapter that reconstructs old phase-result DTOs and keeps an
  incremental planner dependency on the old project-intelligence workflow
  subpath.

This means PCU made the new foundation real, but the interface surface still
allows agents and outer code to treat source graph, panorama, and
project-intelligence as alternate project-information interfaces.

## Problem

The user goal after PCU is not only that ProjectContext works internally. The
Alembic space must make ProjectContext the single outward and upper-layer route
for project-information facts.

If old project-information interfaces stay visible or directly consumed, agents
can still query:

- source graph local MCP tools;
- panorama;
- project-intelligence package subpaths;
- discoverer-backed resident structure routes;
- workflow capabilities that return project structure, source, symbols, or
  relation facts outside ProjectContext;
- `sourceGraphRef`-driven freshness and evidence fields.

That leaves two incompatible meanings of "project information":

- the ProjectContext hierarchy and refs;
- the older source graph / panorama / project-intelligence structures.

The result is confusing for agents and hard for the controller to validate:
the same project question may have multiple public entrypoints, different
freshness language, different refs, and different behavior under cold start or
rescan.

## Goal

Optimize the Alembic interface surface so ProjectContext is the only exposed and
upper-layer project-information capability.

Observable outcome:

- Core public project-information access goes through
  `@alembic/core/project-context`.
- Core low-level syntax, grammar, language, path, workspace, IO, and generic
  shared helpers may remain directly reusable only when they do not answer
  project-information queries.
- Public Core exports that answer project structure, source graph, module,
  source relation, symbol, panorama, or project snapshot questions are removed,
  withdrawn from public access, or replaced by ProjectContext-facing exports.
- AlembicPlugin host-facing tools may keep final tool names such as
  `alembic_project_matrix` and `alembic_graph`, but their project facts,
  detail refs, query errors, ordering, and guidance must be ProjectContext
  projections.
- AlembicPlugin must not expose source graph tools, `sourceGraphRef`, or
  panorama as alternate project-information surfaces.
- AlembicPlugin cold-start and rescan analysis must consume
  `@alembic/core/project-context` and `ProjectContext.execute` directly for
  project-information facts, not the old project-intelligence public
  capability and not a new intermediate analysis capability.
- Alembic main resident and built-in Agent project-information routes must
  consume ProjectContext or retire the old route.
- Cross-repository import scans and runtime probes prove the interface surface
  has only one project-information source of truth.

## Non-goals

- No new ProjectContext query level.
- No new MCP tool, CLI command, daemon route, Dashboard route, or Agent tool.
- No new public project-information facade above ProjectContext.
- No compatibility state that keeps old project-information routes working
  beside ProjectContext.
- No deletion of generic language, path, workspace, IO, package-root, logging,
  shared error, or ProjectScope utilities when they are not returning project
  information.
- No Recipe, Search, Guard, lifecycle, persistence, vector, or knowledge-store
  redesign unless an existing interface directly exposes project-information
  facts outside ProjectContext.
- No source graph, panorama, project matrix, or snapshot rebuild as independent
  public project-information capabilities.
- No product implementation in Design. Controller and product windows own code
  changes and validation.

## Primary Actors

- Wakeflow controller.
- AlembicCore implementation window.
- AlembicPlugin implementation window.
- Alembic main implementation window.
- Host agents using AlembicPlugin MCP tools.
- Alembic main built-in Agent or resident tool callers.
- ProjectContext implementation and tests.

## User Stories

1. As a host agent, I can ask for project orientation and graph context without
   needing to decide between ProjectContext, source graph, panorama, or
   project-intelligence.
2. As a Core consumer, I can see that the project-information public package
   route is `@alembic/core/project-context`.
3. As a Core consumer, I can still import `LanguageService` or workspace/path
   helpers through generic shared routes when I only need generic utility
   behavior.
4. As an AlembicPlugin maintainer, I can keep final MCP tool names where they
   are user-facing contracts, while ensuring their project facts are
   ProjectContext projections.
5. As an Alembic main maintainer, I can keep local runtime, CLI, daemon, and
   resident tool responsibilities while removing old project-information
   providers from structure/panorama paths.
6. As the controller, I can run import scans and tool probes that prove no old
   project-information route remains visible or directly consumed.

## Proposed Behavior

Classify all related interfaces into four groups.

### Keep Public

`@alembic/core/project-context` is the only Core public package subpath for
project-information queries.

Final host-facing tools may remain visible only as ProjectContext projections:

- `alembic_project_matrix`;
- `alembic_graph`;
- project-context branch of `alembic_prime`;
- Alembic main built-in Agent project-context route.

These final tools must not present themselves as alternate providers. They
should state that project facts come from ProjectContext, and their refs should
be ProjectContext detail refs or projections of ProjectContext refs.

### Keep Generic

The following are allowed outside ProjectContext only as generic support
capabilities, not project-information interfaces:

- language identification and display;
- grammar resource installation and parser availability;
- path, project-root, workspace, IO, package-root, and shared utility helpers;
- generic data root and persistence plumbing;
- generic workflow/session envelope builders that do not collect project
  structure, source, symbol, or relation facts themselves.

For example, `LanguageService` already exists under the shared facade and does
not require a `project-intelligence` import to infer a file language.

### Replace Or Withdraw

The following surfaces are project-information interface candidates and must be
inventoried, replaced, withdrawn, or retired:

- Core `@alembic/core/project-intelligence` public subpath when used for
  project structure, discoverer registry, AST project analysis, dependency
  graph, or source relation outputs.
- Core `@alembic/core/service/panorama` public subpath when used as a project
  map, module, layer, gap, health, or coverage query surface.
- Core `@alembic/core/workflows/capabilities/project-intelligence` public
  subpath when used as the host-agent or main-agent project scan runner.
- Core root exports that re-export project-intelligence workflow helpers as
  public contracts.
- AlembicPlugin source graph local MCP tools:
  `alembic_source_graph_status`, `alembic_symbol_search`,
  `alembic_code_explore`, `alembic_source_node`, `alembic_callers`,
  `alembic_callees`, `alembic_code_impact`, `alembic_affected_tests`, and
  `alembic_validation_plan`.
- AlembicPlugin public input, output, guidance, policy, and status fields that
  expose `sourceGraphRef` as a project-information evidence route.
- AlembicPlugin `alembic_panorama` handler route and any visible public catalog
  row for panorama.
- Alembic main resident `structure` handler project-information operations.
- Alembic main resident `panorama` handler.
- Alembic main or plugin cold-start/rescan flows that call
  `ProjectIntelligenceCapability.run`.

### Review Before Deleting

Do not delete a surface by name alone. First classify whether the actual
consumer needs:

- project information, which must move to ProjectContext;
- generic language/path/workspace behavior, which should use generic shared
  exports;
- knowledge/Recipe/Search/Guard behavior, which is not part of this demand;
- workflow/session packaging, which may stay if project-information collection
  is delegated to ProjectContext.

Any project-information route that cannot be switched in this demand must stop
for controller decision instead of staying as a parallel public route.

## Deep Real-Code Findings

This demand must be driven by the actual call chains below, not by surface names
alone.

### Plugin Cold-Start And Rescan

AlembicPlugin cold-start and rescan still use the old project analysis route:

- `runHostAgentColdStartWorkflow` imports
  `ProjectIntelligenceCapability` and calls `ProjectIntelligenceCapability.run`.
- `runHostAgentKnowledgeRescanWorkflow` imports
  `ProjectIntelligenceCapability` and calls `ProjectIntelligenceCapability.run`.
- Both workflows destructure legacy phase fields such as `allFiles`,
  `depGraphData`, `astProjectSummary`, `codeEntityResult`, `callGraphResult`,
  `targetsSummary`, `localPackageModules`, `langProfile`, and `guardAudit`.
- Both workflows build `ProjectSnapshot`, then build Mission Briefing and
  IDEAgentAnalysis packet output from the old snapshot shape.
- Both workflows keep Plugin-side normalization for old output shapes:
  target-array normalization and `normalizePanoramaForIDEAgent`.

Decision: Plugin cold-start/rescan must directly consume ProjectContext
project-information results through `@alembic/core/project-context` and
`ProjectContext.execute`. Plugin must not keep a compatibility bridge that
converts old project-intelligence, source graph, or panorama output into the
old `ProjectSnapshot` shape.

The Plugin still owns host workflow concerns that are not ProjectContext:
cleanup, Recipe preservation, rescan prescreen, Guard normalization if the Guard
DTO still varies, dimension planning, Mission Briefing presentation, IDEAgent
surface construction, onboarding contract, and response envelopes. Those
concerns may remain, but the project-information facts fed into them must come
from ProjectContext.

### Alembic Built-In Agent

Alembic main cold-start and knowledge-rescan already call
`runAgentProjectContextAnalysis`, and that route already executes ProjectContext
requests for:

- `space`;
- `repo`;
- `map`;
- `module`;
- `module-layers`;
- `source-slice`;
- `file-symbols`;
- `file-flow`;
- `anchor-range`.

However, the current built-in Agent route still reconstructs old phase outputs:

- `createDependencyGraph` rebuilds a legacy graph DTO from ProjectContext flow,
  module, and map contexts.
- `createAstProjectSummary` rebuilds an AST summary DTO from file symbol
  contexts.
- `createPanoramaResult` rebuilds a panorama DTO from map and module contexts.
- `createAnalysisReport` reports legacy phase-shaped analysis output.
- `evaluateIncrementalPlan` still dynamically imports
  `@alembic/core/workflows/capabilities/project-intelligence`.
- The route warns that ProjectContext does not materialize legacy
  project-intelligence side effects.

Decision: this existing route is useful evidence that ProjectContext can cover
the real built-in Agent facts, but it is not the final shape and must not be
retained as an adapter. Implementation must delete the AgentProjectContext
adapter boundary after moving cold-start/rescan to direct ProjectContext result
consumption. Existing presenters/builders should consume ProjectContext result
structures directly. If a presenter needs a project-information field not
present in ProjectContext, add it to the specific ProjectContext query kind that
owns that fact.

### Alembic Resident Handlers

Resident `structure` still mixes several old providers:

- `LanguageService` is imported from `@alembic/core/project-intelligence`
  instead of a generic shared route.
- `_getLoadedDiscoverer` dynamically imports `getDiscovererRegistry` from
  `@alembic/core/project-intelligence`.
- `getTargets`, `getTargetFiles`, and `getTargetMetadata` use discoverer-backed
  target and file data.
- `graphQuery`, `graphImpact`, `graphPath`, and `graphStats` use
  `knowledgeGraphService`, with Recipe relation fallbacks when
  `knowledge_edges` is unavailable.
- `callContext` uses `codeEntityGraph` for caller, callee, and impact radius
  queries.

Resident `panorama` still exposes project map behavior through
`panoramaService.ensureData`, `getOverview`, `getModule`, `getGaps`, and
`getHealth`. The same tool also contains governance, decay, staging, and
enhancement operations that are not project-information queries.

Decision: resident project-information operations must either switch to
ProjectContext or retire if final ProjectContext-backed tools cover them. Recipe
graph, lifecycle, decay, staging, and enhancement behavior must not hide under
project-information routes. If those operations still belong to Alembic main,
they need their own non-project-information route or controller-approved
cleanup; they must not be used as a compatibility fallback for ProjectContext.

### ProjectContext Coverage Check

Current ProjectContext coverage is broad enough for the project-information
chain the user described:

| Agent query level | ProjectContext owner |
| --- | --- |
| Project space and source folders | `space` |
| Repository facts, languages, build/package systems, targets, source roots, commands, config files | `repo` |
| Project map, modules, layers, dependency summary, cycles, hotspots, major flows | `map` |
| One module's files, public surfaces, inflow, outflow | `module` |
| Module layer grouping and boundary crossings | `module-layers` |
| File imports, exports, callers, callees, inflow, outflow | `file-flow` |
| File symbols and naming | `file-symbols` |
| Source text range, hash, next refs | `source-slice` |
| Anchor-centered radius context, related refs, symbols, relation sites | `anchor-range` |

ProjectContext should not own the following:

- Guard audit execution or Guard DTO compatibility.
- Recipe preservation, Recipe impact, lifecycle, decay, staging, or knowledge
  governance.
- Dimension selection, enhancement packs, or AI execution planning.
- Mission Briefing, IDEAgentAnalysis, session, response envelope, or onboarding
  presentation.
- Generic file-diff incremental planning unless it requires
  project-information facts; if it does, the missing facts must be requested
  from ProjectContext and the planner itself must live outside
  project-intelligence.
- Durable legacy side effects such as source graph table writes, dependency
  edge writes, code entity graph materialization, or panorama invalidation.

Coverage rule: if Plugin cold-start/rescan or Alembic resident/built-in Agent
needs a project-information fact that ProjectContext cannot currently return,
the implementation must extend the owning ProjectContext query contract directly
and add focused tests. It must not add an intermediate compatibility layer,
alternate facade, private project snapshot translator, source graph fallback, or
panorama fallback.

## Agent Direct Consumption Model

The final design should start from what the real agents need to read, not from
the old analysis pipeline shape.

Current old flow:

```text
ProjectIntelligence / ProjectContext scan
-> phase results
-> ProjectSnapshot
-> Mission Briefing / IDEAgentAnalysis / built-in Agent views
-> Agent reads a second-hand project summary
```

Required flow:

```text
Agent need
-> exact ProjectContext request kinds
-> selected ProjectContext envelopes/results
-> final prompt/response formatting only
-> Agent reads ProjectContext facts directly
```

The implementation should inventory the real content consumed by:

- Plugin host-agent cold-start Mission Briefing;
- Plugin host-agent rescan Mission Briefing;
- Plugin IDEAgentAnalysis surface;
- Alembic main cold-start built-in Agent;
- Alembic main knowledge-rescan built-in Agent;
- any remaining resident project-information caller that is not retired.

For each consumed field, the owning product window must classify it as:

- direct ProjectContext fact;
- non-project-information workflow fact;
- obsolete legacy field to delete;
- missing ProjectContext fact that must be added to the owning query kind.

Expected direct ProjectContext facts for agents:

- orientation: `space`, `repo`;
- repository and target facts: `repo`;
- project map and dependency shape: `map`;
- module ownership and public surfaces: `module`;
- layer grouping and boundary crossings: `module-layers`;
- file imports, exports, callers, callees, inflow, outflow: `file-flow`;
- file symbols and naming: `file-symbols`;
- source text and source range: `source-slice`;
- anchor-centered radius context: `anchor-range`.

The Agent-facing output may still format, filter, trim, order, or label data
for readability, but it must not create a new project-information analysis
object. The formatted output should preserve ProjectContext refs and enough
query metadata for the Agent to request the next ProjectContext level.

`ProjectSnapshot` should not remain the project-information DTO between
ProjectContext and agents. If a workflow still needs a session or response
record, that record may hold workflow metadata plus selected ProjectContext
results or refs. It must not reconstitute source graph, panorama,
project-intelligence phase output, code entity graph output, or discoverer
output as a replacement project-information model.

## Skipped Middle Layers Become Deletion Candidates

Any middle layer skipped by direct Agent consumption is not kept as a dormant
compatibility route. After the Agent field inventory proves that ProjectContext
directly supplies the required project-information facts, the skipped layer is a
deletion candidate.

Deletion candidate classes:

- `ProjectIntelligenceCapability` as Plugin or main Agent project-information
  scan runner.
- `ProjectIntelligenceRunner` phase-result pipeline as an outward or upper-layer
  project-information provider.
- `AgentProjectContextAnalysis.ts` / `runAgentProjectContextAnalysis` as an
  adapter that converts ProjectContext results back into legacy phase-result,
  `ProjectSnapshot`, dependency graph, AST summary, panorama, call graph, or
  source graph shaped data.
- `ProjectSnapshot` as the carrier between ProjectContext and Agent-facing
  project-information output.
- Legacy phase result DTOs such as dependency graph, AST project summary, code
  entity graph result, call graph result, panorama result, and source graph
  result when they exist only to feed Agent project-information output.
- Plugin target-array normalization and panorama normalization used to keep old
  project-information shapes alive.
- Resident discoverer-backed structure operations when replaced by
  ProjectContext `repo`, `map`, `module`, `file-flow`, `file-symbols`, or
  `source-slice`.
- Resident panorama project-information operations when replaced by
  ProjectContext `map`, `module`, and `module-layers`.
- Recipe-relation, code entity graph, source graph, and panorama fallbacks when
  they answer project-information questions.
- Public source graph local tool family, public panorama route, and public
  project-intelligence route when their only remaining purpose is project
  information.

Deletion decision rule:

- If the layer only translates or preserves old project-information shapes after
  direct ProjectContext consumption exists, delete it.
- If the layer owns non-project-information behavior, split that behavior into
  its actual owner first, then delete the project-information portion.
- If deletion would remove a real Agent-required project-information fact, stop
  and add the missing fact to the owning ProjectContext query kind before
  deleting.
- Do not keep a skipped layer because it may be useful as future fallback,
  debugging convenience, legacy reader, or migration comfort. Those are not
  completion reasons for this demand.

## Boundary Cases

### ProjectContext Unavailable Data

ProjectContext may return unavailable data for unsupported languages, missing
parser support, ignored/generated/vendor files, unreadable source, empty
projects, or unresolved relations.

Required behavior:

- Agent-facing output must surface the ProjectContext unavailable result or
  query error directly enough for the Agent to know what is missing.
- Plugin and Alembic main must not answer unavailable ProjectContext data by
  falling back to source graph, panorama, discoverer, code entity graph, or
  Recipe relation data.
- If unavailable data is acceptable for that query class, return the reduced
  ProjectContext result with refs and next steps.
- If unavailable data removes a required Agent field, classify it as a
  ProjectContext coverage gap and stop before deleting the old layer that still
  contains the only copy of that fact.

### Mixed Project And Non-Project Behavior

Some old layers combine project-information behavior with unrelated workflow or
knowledge behavior. Examples:

- cold-start/rescan combine project facts with cleanup, Recipe preservation,
  dimension planning, session records, and response envelopes;
- resident panorama combines project map operations with governance, decay,
  staging, and enhancement operations;
- resident graph operations combine project graph wording with Recipe graph and
  knowledge relation behavior;
- file-diff planning uses project file lists but is not itself a
  project-information query.

Required behavior:

- Split the non-project-information behavior to its actual owner before
  deleting the project-information portion.
- Do not create a new shared project abstraction to hold mixed behavior.
- Do not keep a mixed route visible just because one non-project operation still
  works.
- If a non-project behavior has no clear owner after split, stop for controller
  decision instead of keeping the old project-information route.

### Project Root And Space Identity

ProjectContext must use the project root and project-space identity supplied by
Alembic's existing project scope or workspace entrypoint. It must not invent,
store, or normalize a separate internal project path identity that can diverge
from Plugin or Alembic main.

Required behavior:

- Plugin cold-start/rescan and Alembic main cold-start/rescan must pass the same
  resolved project root and project scope into ProjectContext.
- Single-repository projects without explicit space configuration are treated as
  one-repo project spaces.
- Multi-repository spaces must keep stable repo ids, source folders, and
  ProjectContext refs across Plugin and Alembic main queries.
- A mismatch between Plugin project root, Alembic main project root, and
  ProjectContext refs is a blocker, not a reason to use old compatibility data.

### Output Size And Source Content

Direct Agent consumption does not mean dumping every ProjectContext result into
every response.

Required behavior:

- Agent-facing output selects the ProjectContext query kinds needed for the
  field inventory.
- Large source content is represented by refs, summaries, and selected
  `source-slice` or `anchor-range` results, not whole-project source dumps.
- Ordering, trimming, and labels are allowed as final presentation behavior.
- Trimming must preserve ProjectContext refs so the Agent can ask for the next
  exact level.

### Runtime Session And Tool Surface Drift

Existing running Plugin or resident sessions may still have stale tool catalogs,
old descriptions, or cached service objects after code changes.

Required behavior:

- Acceptance must include a fresh Plugin/MCP session or equivalent reload proof
  so stale tool registration is not mistaken for current behavior.
- Old service objects may remain in a container only if no public or upper-layer
  project-information route calls them.
- Retired tool names must either disappear from the visible surface or return
  the approved retired response without invoking the old provider.

### Existing Storage And Historical Data

Old source graph, panorama, dependency edge, or code entity graph storage may
already exist from previous runs.

Required behavior:

- This demand does not require a storage migration merely because old rows or
  tables exist.
- Existing storage must not be exposed or consumed as a project-information
  source outside ProjectContext.
- Cleanup code may remove obsolete storage only when the owning product window
  verifies no non-project-information behavior still depends on it.

### Public API Breakage

Removing public project-information exports is an intentional outcome when
callers have been moved to ProjectContext.

Required behavior:

- Workspace callers must be replaced before export deletion.
- External compatibility shims are not added for removed project-information
  routes.
- Public docs, tool descriptions, and examples must be updated so agents do not
  learn the retired route again.

## Connectivity Design

The demand is complete only when the same ProjectContext facts connect across
Core, Plugin, and Alembic main.

| Consumer | Direct ProjectContext inputs | Allowed non-project inputs | Forbidden middle outputs |
| --- | --- | --- | --- |
| `alembic_project_matrix` | `space`, `repo`, `map` | final tool formatting | `sourceGraphRef`, panorama status, source graph status |
| `alembic_graph` | `map`, `module`, `module-layers`, `file-flow`, `file-symbols`, `source-slice`, `anchor-range` | final tool formatting and query validation | Recipe relation fallback, code entity graph fallback, source graph fallback |
| `alembic_prime` project guidance | refs and summaries from matrix/graph ProjectContext results | final guidance wording | source graph readiness plans |
| Plugin cold-start Mission Briefing | selected `space`, `repo`, `map`, `module`, `file-flow`, `file-symbols`, `source-slice`, `anchor-range` results or refs | cleanup, Recipe preservation, Guard, dimensions, response envelope | ProjectIntelligence phase results, `ProjectSnapshot`, panorama DTO |
| Plugin IDEAgentAnalysis | selected ProjectContext results or refs from the same run | final presentation surface | `normalizePanoramaForIDEAgent`, source graph result, code entity graph result |
| Alembic built-in Agent cold-start/rescan | selected ProjectContext results or refs from project scope | AI execution, Recipe impact, session, dimensions | legacy dependency graph DTO, AST summary DTO, panorama DTO, phase report DTO |
| Alembic resident project-info calls | ProjectContext result for the retained operation | resident envelope formatting | discoverer cache, panoramaService, codeEntityGraph, Recipe relation fallback |

Connectivity gates:

1. Field inventory gate: every Agent-facing project-information field maps to a
   ProjectContext query kind, an obsolete field deletion, or a named
   ProjectContext coverage gap.
2. Ref continuity gate: Plugin tools, Plugin Agent output, and Alembic main
   Agent output preserve ProjectContext refs so the Agent can move from
   orientation to repo, map, module, file, symbol, flow, source, and anchor
   without switching provider.
3. Root continuity gate: Plugin and Alembic main use the same resolved project
   root/project scope for the same workspace scenario.
4. Deletion gate: old layers are deleted only after their Agent-facing fields
   are either ProjectContext-backed, obsolete, or split into a concrete
   non-project-information owner.
5. Runtime proof gate: representative Plugin and Alembic main probes prove the
   same project scenario returns ProjectContext-derived facts and no hidden
   fallback provider is invoked.

## Current-Code Landing Plan

This supplement is based on the current post-PCU code inspection. PCU completed
the foundation switch, but the remaining landing work is not only export cleanup:
several real Agent and MCP call chains still teach or consume old
project-information shapes.

### Current-Code Conclusions

- AlembicPlugin host-agent cold-start and rescan are still the clearest residual
  old pipeline. They call `ProjectIntelligenceCapability.run`, build
  `ProjectSnapshot`, then feed Mission Briefing and IDEAgentAnalysis from legacy
  phase fields.
- Alembic main cold-start and rescan already execute ProjectContext through
  `runAgentProjectContextAnalysis`, but the route then rebuilds dependency graph,
  AST summary, panorama, call graph, and phase-report DTOs so downstream code can
  keep reading the old shape.
- AlembicPlugin `alembic_project_matrix` and `alembic_graph` already use
  ProjectContext for core facts, but their schemas, output snapshots, result
  language, node types, and next actions still preserve `sourceGraphRef`,
  source graph readiness, source graph node types, and source graph impact
  wording.
- AlembicPlugin agent public contracts still accept `sourceGraphRef` for prime,
  work, finish, Guard, and decision flows, and `PrimePublicPackage` still carries
  `sourceGraphGuidance`. This is a live contract problem, not only an internal
  implementation detail.
- AlembicPlugin MCP initialization guidance still tells Codex to prefer source
  graph tools for current code facts when visible. That guidance must change
  together with the schemas; otherwise a fresh agent can still learn the retired
  route.
- Core Mission Briefing and IDEAgentAnalysis packet builders currently consume
  `ProjectSnapshot` and old AST/dependency/call/panorama fields. Plugin and main
  cannot fully switch without a Core presenter update or an equivalent direct
  ProjectContext presenter owned by Core workflow code.

### Agent ProjectContext Field Model

The landing implementation should not introduce a new project-information
provider. It should inventory the fields agents actually read and feed presenters
from selected ProjectContext envelopes/results.

| Agent need | ProjectContext source | Current old field | Target field behavior |
| --- | --- | --- | --- |
| Where am I, what repo/space is this | `space`, `repo` | `projectMeta`, `discoverer`, `primaryLang`, `langProfile` | project identity and language facts come from ProjectContext refs and repo facts |
| Which targets, source roots, packages, commands matter | `repo` | `targetsSummary`, `allTargets`, `localPackageModules` | target and package summaries are ProjectContext repo projections |
| What is the project map and dependency shape | `map`, `module`, `module-layers` | `depGraphData`, `panoramaResult`, architecture overview | architecture and dependency sections read ProjectContext map/module/layer facts directly |
| What module owns what files and surfaces | `module`, `module-layers` | local package modules, panorama modules | module ownership, public surfaces, inflow, outflow, and boundary crossings stay ProjectContext-shaped |
| What file imports/exports/calls/flows exist | `file-flow` | `callGraphResult`, `codeEntityResult`, dependency graph edges | flow hints, impact, caller/callee summaries, and relation refs come from file-flow |
| What symbols and names exist in a file | `file-symbols`, `anchor-range` | `astProjectSummary`, AST context | symbol and key abstraction output uses ProjectContext symbol facts and source refs |
| What source range should the agent read | `source-slice`, `anchor-range` | IDE source-ref candidates from AST/dependency/guard/module data | read sets preserve ProjectContext refs and selected source ranges |
| What is missing or unsupported | ProjectContext envelope status/errors | source graph freshness/degraded status | surface ProjectContext unavailable/limited diagnostics without old fallback |
| What is not project information | existing workflow owners | Guard audit, Recipe impact, dimensions, session, AI execution | keep outside ProjectContext and do not mix into project-info routes |

Output trimming is allowed only after this mapping. The trimmed output must keep
ProjectContext refs, query kind, repo/source identity, and enough next-ref
information for the Agent to query the next level directly.

### AlembicPlugin Landing Steps

1. Inventory current host-agent fields in
   `host-agent-workflows/cold-start.ts` and
   `host-agent-workflows/knowledge-rescan.ts`: Mission Briefing inputs,
   IDEAgentAnalysis inputs, response summary fields, rescan-specific Recipe and
   evidence fields, and any field read by tests.
2. Replace `ProjectIntelligenceCapability.run`, `buildProjectSnapshot`, target
   compatibility normalization, and `normalizePanoramaForIDEAgent` with direct
   ProjectContext calls for the mapped field set. The direct query set should
   start with `space`, `repo`, and `map`, then request `module`,
   `module-layers`, `source-slice`, `file-symbols`, `file-flow`, and
   `anchor-range` only for selected files/modules needed by the Agent output.
3. Keep host workflow behavior that is not project information: cleanup,
   Recipe preservation, rescan prescreen, evidence plan, Guard normalization,
   dimension planning, response envelopes, and error classification.
4. Change Mission Briefing construction so project facts are ProjectContext
   presenter inputs, not old AST/dependency/panorama DTOs. If Core owns the
   presenter, update Core presenter input first and then switch Plugin.
5. Change IDEAgentAnalysis construction so source refs, required read set,
   structural hints, materialization summary, and retrieval hints are built from
   ProjectContext results. The result should no longer recommend
   `alembic_structure`, `alembic_call_context`, or source graph as the project
   route unless those names have been rebuilt as ProjectContext projections.
6. Clean project matrix and graph schemas and providers: remove public
   `sourceGraphRef`, `sourceGraphGuidance`, source graph freshness/status,
   `source-graph-node`, `sourceGraphRequiredForImpact`, and next actions that
   ask for source graph evidence. Graph impact/neighborhood should require a
   ProjectContext node id, ProjectContext detail ref, file path, symbol, or
   anchor input.
7. Clean agent public contracts and MCP guidance together: remove
   `sourceGraphRef` from accepted refs for project-information flows, replace
   prime source graph guidance with ProjectContext matrix/graph guidance, and
   update initialization guidance so agents do not learn source graph as the
   current-code route.
8. Retire or remove visible source graph and panorama tool names. If the
   controller chooses a retired response instead of disappearance, the handler
   must fail closed without invoking old source graph or panorama providers.

### Alembic Main Landing Steps

1. Delete the `AgentProjectContextAnalysis.ts` adapter boundary after extracting
   its useful direct ProjectContext query evidence into the final callers or
   ProjectContext-owned implementations. Do not keep `runAgentProjectContextAnalysis`
   as a renamed helper that sits between ProjectContext and cold-start/rescan.
2. Remove `createDependencyGraph`, `createAstProjectSummary`,
   `createPanoramaResult`, `createAnalysisReport`, and `sourceGraphResult: null`
   from the project-information boundary after cold-start/rescan presenters read
   ProjectContext facts directly.
3. Switch `ColdStartWorkflow` and `KnowledgeRescanWorkflow` away from
   `buildProjectSnapshot`. Cold-start reports, target maps, dimension views,
   session records, and AI dispatch views should receive selected
   ProjectContext facts/refs plus non-project workflow metadata.
4. Split `FileDiffPlanner` out of the public project-intelligence workflow
   subpath or replace it with a generic workflow snapshot/diff utility that
   accepts ProjectContext source file facts. It must not keep
   `@alembic/core/workflows/capabilities/project-intelligence` alive as a
   project-information dependency.
5. Resident `structure` project-information operations should switch to
   ProjectContext or retire. Do not keep discoverer, `knowledgeGraphService`,
   Recipe relation fallback, or `codeEntityGraph` as project-information
   answers.
6. Resident `panorama` project map operations should retire or become direct
   ProjectContext projections only if a real main consumer remains. Governance,
   decay, staging, and enhancement operations need their real non-project owner
   or retirement; they must not preserve `alembic_panorama` as a mixed fallback.

### Core Presenter Impact

The Plugin and main workflow changes require Core presenter work because current
Core presenters read old carriers:

- `MissionBriefingBuilder` should accept ProjectContext-derived presenter input
  for architecture overview, technology stack, key abstractions, dependency
  graph, call/flow hints, panorama replacement, must-cover modules, and evidence
  starters. This is presentation logic, not a new public project-information
  provider.
- `HostAgentMissionWorkflow` session support should store workflow metadata and
  selected ProjectContext refs/results instead of requiring `ProjectSnapshot` as
  the project-information cache.
- `IDEAgentAnalysisPacketBuilder` should gain a ProjectContext-backed build path
  where source-ref candidates, required read sets, structural hints, retrieval
  hints, and materialization summary come from ProjectContext facts. The old
  `buildIDEAgentAnalysisPacketFromSnapshot` path is a deletion candidate after
  Plugin and main callers move.
- Core package exports and tests must be updated after consumers move so
  ProjectSnapshot and project-intelligence helpers are not kept public as
  alternate project-information contracts.

### Delete Or Retain Decision Matrix

| Current code path | Landing decision |
| --- | --- |
| Plugin `ProjectIntelligenceCapability.run` in cold-start/rescan | delete after direct ProjectContext query path is connected |
| Plugin `ProjectSnapshot` build and panorama/target normalization | delete after Mission Briefing and IDEAgentAnalysis consume ProjectContext facts |
| Plugin `sourceGraphRef` in public refs, schemas, guidance, matrix, graph, search, output contracts | remove from project-information contracts unless controller approves a non-project diagnostic exception |
| Plugin source graph fail-closed runtime | retire/remove from visible Agent flow after public contract cleanup; do not restore as project-info |
| Plugin `alembic_panorama` handler | retire or remove; do not invoke panorama service for project map facts |
| Alembic `AgentProjectContextAnalysis.ts` / `runAgentProjectContextAnalysis` adapter | delete as a middle layer after callers consume ProjectContext directly; do not keep a renamed adapter |
| Alembic `ProjectSnapshot` in cold-start/rescan | delete as project-information carrier |
| Alembic `FileDiffPlanner` project-intelligence import | move to generic workflow diff owner or replace |
| Alembic resident discoverer/panorama/codeEntityGraph project-info routes | switch to ProjectContext or retire |
| Core Mission Briefing and IDE packet snapshot builders | replace with ProjectContext presenter inputs; delete old snapshot path after callers move |
| Generic language/path/workspace utilities | retain through generic routes when they do not answer project-information queries |
| Guard, Recipe, lifecycle, dimension, AI execution, session envelopes | retain under their real owners; do not move into ProjectContext |

### Stop Conditions

- Stop if a required Agent project-information field has no ProjectContext
  source and no accepted deletion decision. The next action is a focused
  ProjectContext query-kind extension, not fallback to source graph or panorama.
- Stop if a remaining source graph, panorama, discoverer, Recipe relation, or
  code entity graph route is justified only as compatibility or debugging
  convenience.
- Stop if removing a mixed route would delete a real non-project behavior and no
  owner has been named for that behavior.
- Stop if Plugin and Alembic main resolve different project roots, repo ids, or
  ProjectContext refs for the same Alembic-space scenario.
- Stop if a fresh MCP or resident session still advertises old guidance after
  schema/policy changes; stale session proof is not acceptance.

### Landing Acceptance Evidence

The implementation should be accepted only with evidence that matches this
landing plan:

- Static scan shows no Plugin host-agent cold-start/rescan import or call to
  `ProjectIntelligenceCapability`, `buildProjectSnapshot`, or Plugin panorama
  normalization.
- Static scan shows no project-information public contract field named
  `sourceGraphRef`, no `sourceGraphGuidance`, and no `source-graph-node` in
  matrix/graph/prime/work/Guard/decision contracts unless explicitly approved as
  non-project diagnostic scope.
- Static scan shows Alembic main cold-start/rescan no longer use
  `ProjectSnapshot` or the public project-intelligence workflow subpath as the
  project-information carrier.
- Runtime probe shows Plugin cold-start/rescan and Alembic main cold-start/rescan
  produce Agent project-information output from direct ProjectContext facts/refs.
- Runtime probe shows `alembic_project_matrix`, `alembic_graph`, and
  project-context prime guidance return ProjectContext refs and do not ask for
  source graph evidence.
- Runtime probe shows retired source graph and panorama routes are gone or return
  the approved retired response without invoking old providers.
- Representative single-repo and Alembic-space multi-repo probes preserve root,
  repo id, source folder, ProjectContext refs, unavailable diagnostics, and
  large-source trimming behavior.

## Implementation Decisions

### Core Interface Decisions

1. `@alembic/core/project-context` remains the public project-information
   package entry.
2. Core package exports must not expose other project-information query
   surfaces after callers are replaced.
3. `@alembic/core/project-intelligence` may not remain a public route for
   project structure, discoverer, dependency graph, source graph, AST project
   summary, module, or source relation facts.
4. `@alembic/core/service/panorama` may not remain a public project-information
   query surface.
5. `@alembic/core/workflows/capabilities/project-intelligence` may not remain a
   public project scan runner for Plugin or main Agent consumers.
6. If IDEAgentAnalysis packet helpers are still needed, they must be separated
   from project-information collection and exposed through a non-project-info
   workflow/session route, or rebuilt as ProjectContext consumers.
7. Generic language and path consumers should import from generic routes such
   as `@alembic/core/shared` or `@alembic/core/workspace`, not from
   `@alembic/core/project-intelligence`.

### AlembicPlugin Interface Decisions

1. `alembic_project_matrix` and `alembic_graph` may stay as final MCP tool
   names.
2. Their input schemas, descriptions, guidance, output refs, freshness fields,
   and diagnostics must not present source graph as a parallel
   project-information route.
3. `sourceGraphRef` must be removed from public project-information input and
   output unless the controller explicitly accepts a non-project-info diagnostic
   field with a removal path. The preferred result is no public
   `sourceGraphRef`.
4. Source graph local tools must either be retired from the visible Codex tool
   surface or rebuilt as ProjectContext-backed projections under existing final
   tools. They must not remain a parallel project-information family.
5. `alembic_panorama` must be fully retired or routed to a retired-tool error
   that recommends ProjectContext-backed final tools without invoking the old
   panorama service.
6. `alembic_prime` project-context guidance must point to ProjectContext-backed
   matrix/graph facts, not source graph readiness or source graph plans.
7. Tool policy, catalog, schema, dispatcher, descriptions, onboarding contract,
   public output schemas, and handler wiring must agree.

### Alembic Main Interface Decisions

1. Alembic main built-in Agent ProjectContext analysis is the starting route for
   project-information collection.
2. Resident `structure` project-information operations must switch to
   ProjectContext or retire if they duplicate final tools.
3. Resident `panorama` must retire or become a ProjectContext projection if a
   still-owned main consumer exists.
4. Main cold-start/rescan analysis must not depend on a public
   project-intelligence runner for project information. If incremental planning
   still needs file-diff facts, split that generic planning concern from
   project-information collection.
5. Built-in Agent project analysis must stop reconstructing legacy
   dependency-graph, AST-summary, panorama, or phase-report DTOs as the
   project-information boundary. Presentation code must consume ProjectContext
   results, or ProjectContext must be extended where required.
6. Plugin and built-in Agent prompt/briefing construction should be redesigned
   from actual Agent consumption needs to exact ProjectContext query results,
   skipping `ProjectSnapshot` and legacy phase result shapes as
   project-information carriers.
7. Any skipped middle layer that no longer owns non-project-information behavior
   becomes deletion scope, not retained compatibility scope.

### No Compatibility Or Middle-Layer Decisions

1. Do not create `ProjectContextAnalysisAdapter`,
   `ProjectIntelligenceCompat`, `PanoramaCompat`, `SourceGraphCompat`,
   `ProjectSnapshotCompat`, or any equivalent bridge that preserves old
   project-information shapes.
2. Do not keep Plugin target-array or panorama normalization as the fix for
   mismatched project-information contracts. Fix the producer/consumer contract
   so the consumer receives ProjectContext-shaped data.
3. Do not keep resident Recipe-relation fallback, code entity graph fallback, or
   panorama fallback as a way to answer project-information queries.
4. Do not expose source graph, panorama, or project-intelligence as a hidden
   fallback when ProjectContext returns unavailable data. ProjectContext
   unavailable results must be surfaced as query results or become direct
   ProjectContext implementation gaps.
5. Do not introduce another abstract management layer above ProjectContext.
   Final tools and internal callers may call ProjectContext directly and then
   perform only their own final presentation, filtering, or response envelope
   formatting.
6. Compatibility cleanup is part of this demand. A remaining compatibility path
   must stop for controller decision with a named consumer, exact missing
   ProjectContext fact, and evidence.
7. Skipped middle layers are reviewed for deletion after the direct
   ProjectContext field mapping is proven. Keeping them requires a concrete
   non-project-information owner, not generic compatibility value.

## Testing Decisions

The acceptance seam is static interface proof plus representative runtime
probes.

Required static scans:

- Core export scan over `package.json`, `src/index.ts`, and public facade files.
- Cross-repository import scan for:
  - `@alembic/core/project-intelligence`;
  - `@alembic/core/service/panorama`;
  - `@alembic/core/workflows/capabilities/project-intelligence`;
  - source graph public tool names;
  - `sourceGraphRef`;
  - `ProjectIntelligenceCapability`;
  - `ProjectIntelligenceRunner`;
  - `normalizePanoramaForIDEAgent`;
  - `relations-fallback`;
  - `panoramaService.ensureData`;
  - `codeEntityGraph`;
  - direct `service/project-context/*` imports outside Core internals and Core
    tests.
- Allowlist must be explicit and limited to generic language/path/workspace
  helpers or test-only ProjectContext contract checks.
- Scan reporting must separate implementation imports from source-reference
  text, docs, tests, and retired-route assertions, so the controller does not
  confuse evidence mentions with live project-information providers.

Required runtime probes:

- `alembic_project_matrix` returns ProjectContext-derived facts and refs without
  source graph freshness/status fields.
- `alembic_graph` returns ProjectContext-derived map/module/file-flow/source
  facts without requiring or recommending `sourceGraphRef`.
- `alembic_prime` guidance uses ProjectContext-backed project matrix/graph
  navigation language.
- Calling retired source graph and panorama names either fails with a retired
  tool response or is no longer visible, depending on the controller-selected
  host-surface policy.
- Plugin cold-start/rescan and Alembic main cold-start/rescan complete their
  project analysis path through ProjectContext-backed code.
- Plugin cold-start/rescan Mission Briefing and IDEAgentAnalysis outputs are
  produced without `ProjectIntelligenceCapability.run`, source graph output,
  panorama output, Plugin target-array compatibility normalization, or Plugin
  panorama compatibility normalization.
- Plugin cold-start/rescan Mission Briefing and IDEAgentAnalysis outputs expose
  selected ProjectContext results or refs directly, with only final formatting,
  trimming, ordering, and labels applied.
- Alembic built-in Agent route produces required project-information output
  without `AgentProjectContextAnalysis.ts` / `runAgentProjectContextAnalysis` as
  an adapter boundary and without legacy phase DTO reconstruction.
- Alembic built-in Agent receives ProjectContext facts directly for project
  orientation, module/file/symbol/flow/source/anchor needs.
- Resident structure/panorama project-information calls are gone, retired, or
  backed directly by ProjectContext with no Recipe relation, code entity graph,
  source graph, or panorama fallback.
- A fresh Plugin/MCP session or equivalent reload proof shows the visible tool
  surface does not come from stale registration.
- Single-repository and Alembic-space multi-repository probes preserve the same
  project root, repo ids, and ProjectContext refs across Plugin and Alembic main
  where both surfaces are applicable.
- Unavailable ProjectContext data is surfaced without invoking old fallback
  providers.
- Large source scenarios return selected refs/slices/anchor ranges rather than
  whole-project source dumps.

Validation commands are chosen by the owning product windows. Minimum expected
families:

- AlembicCore: build/check plus focused export-boundary/import-boundary tests.
- AlembicPlugin: build/check, MCP tool surface tests, public output/schema
  tests, and plugin session or local MCP smoke for project matrix/graph.
- Alembic main: build/check plus resident/built-in Agent tool route tests.
- Controller: cross-repository import scan and representative output comparison.

## Acceptance Criteria

1. `@alembic/core/project-context` is the only Core public package subpath that
   answers project-information queries.
2. Core no longer publicly exports `project-intelligence`, `service/panorama`,
   or `workflows/capabilities/project-intelligence` as project-information
   routes.
3. Any retained generic language/path/workspace imports are documented as
   generic, not project-information, and use generic public routes.
4. AlembicPlugin visible tool policy, catalog, schemas, descriptions, handler
   routing, public output schemas, and onboarding guidance no longer expose
   source graph or panorama as project-information interfaces.
5. `sourceGraphRef` is absent from public project-information inputs, outputs,
   guidance, and accepted refs, or any remaining occurrence is explicitly
   proven non-project-information and approved by the controller.
6. `alembic_project_matrix`, `alembic_graph`, and the project-context branch of
   `alembic_prime` project from ProjectContext and agree on refs, ordering,
   ordinary query errors, and degraded diagnostics.
7. AlembicPlugin cold-start/rescan no longer call the old public
   `ProjectIntelligenceCapability.run` for project analysis.
8. Alembic main resident/built-in project-information routes no longer use old
   discoverer/panorama/project-intelligence paths as direct providers.
9. Plugin and main callers do not keep compatibility bridges that translate old
   source graph, panorama, project-intelligence, code entity graph, or discoverer
   output into ProjectContext-like results.
10. ProjectContext coverage is explicitly checked against Plugin
    cold-start/rescan and Alembic resident/built-in Agent needs. Any missing
    project-information fact is implemented in the owning ProjectContext query
    kind or stopped for controller decision.
11. Agent-facing project-information output is built from a field inventory of
    real Plugin and Alembic Agent needs, then mapped to exact ProjectContext
    request kinds.
12. `ProjectSnapshot`, legacy phase result DTOs, source graph, panorama,
    discoverer, and code entity graph are not used as project-information
    carriers between ProjectContext and Agent-facing output.
13. Skipped middle layers are deleted when they only preserve old
    project-information shapes or fallback behavior.
14. Any retained part of a skipped layer is documented as
    non-project-information behavior with a real owner and caller.
15. Boundary cases for unavailable ProjectContext data, mixed
    project/non-project behavior, project root identity, large source output,
    stale tool surfaces, existing historical storage, and intentional public API
    removal are checked and recorded.
16. Connectivity gates pass: field inventory, ref continuity, root continuity,
    deletion gate, and runtime proof gate.
17. Cross-repository import scans pass with an explicit, reviewed allowlist.
18. Representative runtime probes pass in the Alembic space.

## Risks And Open Questions

- Some `project-intelligence` imports are only generic language or discovery
  utilities. They must be split carefully so the demand does not remove useful
  non-project-information utilities.
- Existing host sessions or docs may mention source graph tools. The owning
  product windows must update guidance and public schemas together, otherwise
  stale tool-choice text will survive implementation.
- Source graph persistence or repository internals may still be needed as an
  internal implementation detail. Internal storage is allowed only if it is not
  exposed or directly consumed as a project-information interface outside
  ProjectContext.
- Cold-start/rescan workflows combine project analysis with mission briefing
  packaging. The implementation must split data collection from presentation
  without weakening the workflow output.
- If a route truly cannot switch to ProjectContext without losing required
  behavior, the product window must stop for controller decision with concrete
  missing behavior and evidence.

## Design Self-Review And Phase Rationale

Conclusion: the overall demand is clear and executable.

The demand is not "build another project context layer". It is a cleanup and
direct-consumption demand after PCU:

- ProjectContext remains the only project-information source.
- Final tools and Agent outputs are presentations of ProjectContext facts, not
  alternate project-information providers.
- Old adapters, source graph, panorama, `ProjectSnapshot`, and
  project-intelligence phase-result routes are removed when they only preserve
  old project-information shapes.
- Missing project-information facts are added to the owning ProjectContext query
  kind, not rebuilt through a compatibility layer.
- Guard, Recipe, lifecycle, dimensions, AI execution, session, and response
  envelopes stay under their existing non-project-information owners.

The phase split is reasonable if it is executed as producer/consumer checkpoints,
not as an unconditional deletion order:

1. PCI-0 inventory is necessary first because it defines the exact field map,
   deletion candidates, allowlist, and producer/consumer dependency order.
2. PCI-1 must start with Core producer enablement: ProjectContext-backed
   presenter inputs, generic utility reroutes, and export-boundary decisions.
   PCI-1 must not delete old Core exports before Plugin and Alembic consumers
   have moved.
3. PCI-2, PCI-3, and PCI-4 are valid parallel work only after the needed Core
   presenter/input contracts are available. They switch real consumers and
   visible tool surfaces to ProjectContext, while preserving non-project workflow
   behavior under its real owner.
4. Core public export deletion, old adapter deletion, source graph/panorama
   retirement, and `AgentProjectContextAnalysis.ts` deletion happen after the
   consumer switches pass import scans. This is cleanup with evidence, not
   deletion-first progress.
5. PCI-5 is the acceptance phase because only cross-surface scans and fresh
   runtime probes can prove there is no hidden fallback or stale MCP surface.

This keeps the demand simple and strict: first identify every project-information
consumer, then connect each consumer directly to ProjectContext, then delete the
skipped middle layers, then prove the same Alembic-space scenarios no longer have
parallel project-information routes.

The main execution risk is reversing the order. If implementation deletes public
Core routes before consumers move, it may create breakage that hides the actual
ProjectContext direct-consumption goal. The controller should therefore track
PCI-1 in two gates: Core enablement before consumer switch, and Core public
deletion after consumer switch and scan proof.

## Controller Intake Notes

Readiness: ready-for-controller-intake.

Recommended controller action: create one independent ProjectContext interface
optimization demand after PCU completion. Start with Core producer enablement and
interface decisions, move Plugin and Alembic consumers, then delete old Core
exports and skipped middle layers only after consumer switches and scans prove
they are no longer live.

Suggested demand group:

### PCI-0: Controller Intake And Interface Inventory

Owner: AlembicWorkspace controller.

Goal: record this requirement as a new demand, collect the current cross-repo
interface scan, and approve the allowlist categories before product windows
edit code.

Deliverables:

- state root with this Design source attached;
- current interface inventory grouped as keep-public, keep-generic,
  replace-or-withdraw, and review-before-delete;
- Agent field inventory for Plugin cold-start/rescan, Plugin IDEAgentAnalysis,
  Alembic main cold-start/rescan, and retained resident callers;
- deletion-candidate inventory for skipped middle layers, with each item marked
  delete, split-non-project-info-first, or ProjectContext-gap-blocked;
- boundary-case checklist and connectivity-gate checklist for the demand;
- initial import scan commands and allowlist rules;
- producer/consumer order for Core, Plugin, and Alembic main.

### PCI-1: AlembicCore Public Export And Boundary Cleanup

Owner: AlembicCore.

Goal: make `@alembic/core/project-context` the only Core public
project-information route.

Scope:

- first provide ProjectContext-backed presenter inputs needed by Plugin and
  Alembic main, without creating a new project-information facade;
- audit `package.json` exports, root facade exports, service exports, workflow
  capability exports, and public type facades;
- replace internal and outer callers that import project-information through
  old Core subpaths;
- reroute generic language/path consumers to generic routes;
- withdraw or remove public project-information exports only after Plugin and
  Alembic consumer switches pass caller/import scans;
- delete skipped Core middle-layer project-information exports and DTO carriers
  after direct ProjectContext consumers are connected;
- add export-boundary and import-boundary tests.

### PCI-2: AlembicPlugin MCP Project-Information Surface Cleanup

Owner: AlembicPlugin.

Goal: make Plugin-visible project-information tools ProjectContext projections
with no source graph or panorama alternate surface.

Scope:

- clean tool policy, catalog, schema, dispatcher, descriptions, host guidance,
  onboarding contract, public output contract, and MCP handler routing;
- remove or retire source graph local tool family from visible
  project-information access;
- remove public `sourceGraphRef` project-information inputs/outputs/guidance;
- retire `alembic_panorama` without invoking old panorama service;
- preserve final tool names `alembic_project_matrix` and `alembic_graph` as
  ProjectContext consumers.
- delete visible source graph, panorama, and project-intelligence project-info
  compatibility routes after direct ProjectContext-backed final tools are
  connected.

### PCI-3: AlembicPlugin Cold-Start And Rescan Project Analysis Switch

Owner: AlembicPlugin.

Goal: switch host-agent cold-start/rescan project analysis away from public
ProjectIntelligenceCapability to direct ProjectContext project-information
queries, and remove Plugin-side compatibility normalization for old project
analysis shapes.

Scope:

- inventory the exact Agent-facing fields currently provided by Mission
  Briefing, IDEAgentAnalysis, and host-agent rescan output;
- replace `ProjectIntelligenceCapability.run` usage in plugin host-agent
  workflows with direct `@alembic/core/project-context` imports and
  `ProjectContext.execute` calls for the needed ProjectContext request kinds;
- preserve mission briefing, IDEAgentAnalysis packet, Recipe preservation,
  cleanup, and dimension completion behavior;
- remove Plugin target-array compatibility normalization and
  `normalizePanoramaForIDEAgent` as project-information fixes;
- adjust Mission Briefing and IDEAgentAnalysis presenters to consume
  ProjectContext results directly where they need project facts;
- remove `ProjectSnapshot` as the project-information carrier between
  ProjectContext and Plugin Agent-facing output;
- delete skipped Plugin project-information compatibility code after Mission
  Briefing and IDEAgentAnalysis are directly backed by ProjectContext results;
- prove project facts in the briefing come from ProjectContext;
- if a required project-information fact is missing, stop with the exact
  ProjectContext query kind that must be extended.

### PCI-4: Alembic Main Resident And Built-In Tool Interface Cleanup

Owner: Alembic.

Goal: make main resident and built-in Agent project-information routes consume
ProjectContext or retire old duplicates.

Scope:

- inventory the exact project-information fields consumed by Alembic main
  cold-start/rescan built-in Agent output and retained resident callers;
- switch resident structure project-information operations to ProjectContext or
  retire them when duplicated by final tools;
- remove resident Recipe relation fallback, code entity graph fallback, and
  panorama fallback from project-information answers;
- retire resident panorama project-information operations; only rebuild as a
  direct ProjectContext projection if a real main consumer remains and the
  controller accepts that route;
- move non-project-information governance, decay, staging, and enhancement
  behavior out of the panorama project-information surface or retire it;
- replace public project-intelligence workflow dependency for project analysis;
- split any remaining generic incremental planning utility from
  project-information collection;
- remove built-in Agent legacy dependency-graph, AST-summary, panorama, and
  phase-report DTO reconstruction from the project-information boundary;
- delete `AgentProjectContextAnalysis.ts` / `runAgentProjectContextAnalysis` as a
  ProjectContext-to-legacy-analysis adapter after cold-start/rescan consume
  ProjectContext directly;
- remove `ProjectSnapshot` as the project-information carrier between
  ProjectContext and Alembic built-in Agent output.
- delete skipped resident/built-in middle-layer project-information code after
  direct ProjectContext consumers are connected.

### PCI-5: Cross-Surface Verification And Acceptance

Owner: AlembicWorkspace controller by default. Use Test only if controller-local
probes cannot safely prove a real runtime scenario.

Goal: verify unique project-information interface behavior across Core,
AlembicPlugin, and Alembic main.

Scope:

- run cross-repo import scans with reviewed allowlist;
- run representative project matrix, graph, prime, cold-start, and rescan
  probes;
- compare ProjectContext refs, ordering, errors, and diagnostics across Plugin
  and main surfaces;
- verify retired source graph and panorama public routes are gone or return the
  approved retired response;
- verify Plugin cold-start/rescan no longer use ProjectIntelligenceCapability
  and no longer normalize old project-information shapes;
- verify Plugin and Alembic Agent-facing outputs are driven by direct
  ProjectContext results or refs matched to an Agent field inventory;
- verify skipped middle layers are deleted unless they were split into a
  concrete non-project-information owner;
- verify unavailable data, root/ref continuity, stale-session reload, large
  source trimming, and historical storage boundaries;
- verify main resident/built-in Agent routes do not use discoverer, code entity
  graph, Recipe relation fallback, panorama, or legacy phase DTOs as
  project-information providers;
- record acceptance evidence and remaining risks.

## Controller Handoff Prompt

```text
Receive this Design handoff as a new ProjectContext interface optimization
demand:
Design/docs/current/alembic-project-context-interface-surface-optimization-requirement-design-2026-06-15.md

PCU implementation is assumed complete. This demand checks and closes the
remaining Alembic space interface surface so ProjectContext is the only exposed
and upper-layer project-information capability route.

Confirmed scope:
- Core public project-information access goes through @alembic/core/project-context.
- Generic language/path/workspace/IO utilities are not removed when they do not
  answer project-information queries.
- No new MCP tool, CLI command, daemon route, Dashboard route, Agent tool, or
  public project-information facade.
- Existing final tool names may stay only as ProjectContext projections.
- Source graph, panorama, project-intelligence, sourceGraphRef, and old resident
  structure routes must not remain parallel project-information interfaces.

Suggested order:
PCI-0 controller intake and inventory -> PCI-1A AlembicCore ProjectContext-backed
presenter/input enablement -> PCI-2 AlembicPlugin MCP surface cleanup + PCI-3
AlembicPlugin cold-start/rescan switch + PCI-4 Alembic main resident/built-in
tool cleanup -> PCI-1B Core public export / skipped middle-layer deletion after
clean consumer scans -> PCI-5 cross-surface verification and acceptance.

Use Test only if controller-local probes cannot safely prove a required real
runtime scenario.
```

## Source References

- `Design/docs/current/alembic-core-project-context-basic-syntax-boundary-requirement-design-2026-06-15.md`
- `AlembicCore/package.json:45`
- `AlembicCore/package.json:49`
- `AlembicCore/package.json:185`
- `AlembicCore/package.json:241`
- `AlembicCore/src/index.ts:33`
- `AlembicCore/src/shared/index.ts:27`
- `AlembicCore/src/shared/index.ts:28`
- `AlembicPlugin/lib/runtime/ToolPolicy.ts:141`
- `AlembicPlugin/lib/runtime/ToolPolicy.ts:149`
- `AlembicPlugin/lib/runtime/ToolPolicy.ts:156`
- `AlembicPlugin/lib/runtime/ToolPolicy.ts:239`
- `AlembicPlugin/lib/runtime/ToolPolicy.ts:246`
- `AlembicPlugin/lib/runtime/ToolPolicy.ts:255`
- `AlembicPlugin/lib/runtime/ToolPolicy.ts:319`
- `AlembicPlugin/lib/runtime/mcp/McpServer.ts:113`
- `AlembicPlugin/lib/runtime/mcp/McpServer.ts:619`
- `AlembicPlugin/lib/runtime/mcp/McpServer.ts:629`
- `AlembicPlugin/lib/runtime/mcp/tools.ts:142`
- `AlembicPlugin/lib/runtime/mcp/tools.ts:217`
- `AlembicPlugin/lib/runtime/mcp/public-tools/contract.ts:265`
- `AlembicPlugin/lib/runtime/mcp/public-tools/contract.ts:353`
- `AlembicPlugin/lib/runtime/mcp/public-tools/contract.ts:533`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:149`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:400`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:518`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:654`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:675`
- `AlembicPlugin/lib/runtime/mcp/host/guidance.ts:92`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectMatrixProvider.ts:3`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectMatrixProvider.ts:46`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectMatrixProvider.ts:1363`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts:3`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts:87`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts:190`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts:356`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts:1681`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/cold-start.ts:26`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/cold-start.ts:113`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/cold-start.ts:178`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/cold-start.ts:410`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/cold-start.ts:418`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/knowledge-rescan.ts:33`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/knowledge-rescan.ts:133`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/knowledge-rescan.ts:231`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/knowledge-rescan.ts:362`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/knowledge-rescan.ts:370`
- `AlembicCore/src/service/project-context/ProjectContextService.ts:19`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts:209`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts:222`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts:233`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts:250`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts:262`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts:271`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts:279`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts:290`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts:297`
- `AlembicCore/src/workflows/capabilities/host-agent/HostAgentMissionWorkflow.ts:44`
- `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:184`
- `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:1060`
- `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:1099`
- `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:1174`
- `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:1224`
- `AlembicCore/src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:239`
- `AlembicCore/src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:250`
- `AlembicCore/src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:535`
- `AlembicCore/src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:890`
- `AlembicCore/src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:1017`
- `Alembic/lib/resident/tool-handlers/structure.ts:1`
- `Alembic/lib/resident/tool-handlers/structure.ts:10`
- `Alembic/lib/resident/tool-handlers/structure.ts:140`
- `Alembic/lib/resident/tool-handlers/structure.ts:223`
- `Alembic/lib/resident/tool-handlers/structure.ts:282`
- `Alembic/lib/resident/tool-handlers/structure.ts:434`
- `Alembic/lib/resident/tool-handlers/structure.ts:471`
- `Alembic/lib/resident/tool-handlers/structure.ts:648`
- `Alembic/lib/resident/tool-handlers/structure.ts:727`
- `Alembic/lib/resident/tool-handlers/structure.ts:785`
- `Alembic/lib/resident/tool-handlers/panorama.ts:1`
- `Alembic/lib/resident/tool-handlers/panorama.ts:28`
- `Alembic/lib/resident/tool-handlers/panorama.ts:31`
- `Alembic/lib/resident/tool-handlers/panorama.ts:49`
- `Alembic/lib/resident/tool-handlers/panorama.ts:104`
- `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts:69`
- `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts:136`
- `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts:156`
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:56`
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:235`
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:258`
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:587`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:20`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:37`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:186`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:273`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:295`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:515`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:1149`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:1200`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:1260`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:1313`
- `Alembic/lib/workflows/agent-project-context/AgentProjectContextAnalysis.ts:1341`
