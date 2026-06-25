# Alembic Graph And Recipe Map Requirement Design

Date: 2026-06-17

Demand key: `alembic-graph-recipe-map-projectcontext-recipe-mounting-2026-06-17`

Status: User-confirmed design for controller intake. This replaces the previous
`alembic_project_matrix` optimization draft and expands the demand to include
the required `alembic_graph` ProjectContext logic change. It does not dispatch
work, mutate Wakeflow state, or change product source.

Supplement added 2026-06-17 (user-requested): a Local Qwen Embedding
Integration section (GMAP-L phases) that gives AlembicPlugin + AlembicCore a
local semantic-vector capability so codex / Claude Code users can run a local
Qwen embedding model and stop depending on the Alembic resident daemon for
semantic search/prime/recipe-map. Code-fact verified against AlembicCore
`2823939` and AlembicPlugin `1256b1d`. User decisions recorded 2026-06-13: the
local lane is served by the user's local **Ollama** endpoint (no embedding
runtime bundled, no native inference dependency); the user installs Ollama and
the plugin only DETECTS it; the local lane is the DEFAULT (local-first); this
is the first implementation path, to be optimized later.

## Gate Conclusion

Primary architecture rule (user-confirmed 2026-06-13): exactly two layers —
the Plugin keeps the four MCP tools plus a thin support layer (up / agent
facing), Core owns ProjectContext + RecipeContext (down / data facing), and
the middle abstraction layer is removed. Route every requirement by direction:
up into Plugin, down into Core, never into a middle layer. Full statement under
Layer Split → Governing Principle.

The better public tool name is `alembic_recipe_map`.

This is a replacement, not an additive tool.

`alembic_project_matrix` must be removed from the public MCP surface when
`alembic_recipe_map` lands. The implementation must not keep both as live
tools.

This demand must also correctly modify `alembic_graph`.

`alembic_recipe_map` should mean:

```text
ProjectContext region
  + bounded structural / anchor radius
  + Recipe mounts and rollups
```

This keeps the name short while preserving a strict boundary:

- `alembic_graph`: pure ProjectContext, all project information, no Recipe.
- `alembic_recipe_map`: ProjectContext-backed local map with Recipe overlay.
- `alembic_search`: precise and range-based Recipe query/detail.
- `alembic_prime`: semantic Recipe positioning for code-development tasks.

The graph work is not optional. Without a clean ProjectContext-only graph,
`alembic_recipe_map` will either duplicate structure logic or keep old
ProjectKnowledgeContext behavior.

## Confirmed Decisions

The user confirmed all decision points for this demand:

1. Core lower Recipe module is named `RecipeContext`, parallel to
   `ProjectContext`.
2. `RecipeContext` owns Recipe read models, id/ref/detail lookup, source refs,
   metadata filters, keyword search, vector/semantic search access, and prime
   semantic blocks.
3. The four query tools must stop using `ProjectKnowledgeContextLayer`,
   `KnowledgeContextOutputProjector`, `RetrievalPlanner`,
   `KnowledgeContextToolOutput`, freshness, and snapshot abstractions.
4. `alembic_project_matrix` is deleted from public discovery, schemas,
   handlers, policy, catalog, and guidance; it is not kept as an alias.
5. Agent-facing single Recipe detail lookup moves to
   `alembic_search operation=get`; any remaining `alembic_knowledge` surface is
   outside the four Agent-facing information tools.
6. The four MCP handlers must not call each other; they may only share Core
   `ProjectContext`, Core `RecipeContext`, and small pure helpers.
7. `alembic_recipe_map` mounting uses source refs and explicit metadata only;
   semantic or keyword similarity must not choose mount positions.
8. This is one coordinated final four-tool optimization demand, internally
   phased from GMAP-0 to GMAP-9 for controller automation.

## Why `alembic_recipe_map`

`alembic_project_matrix` is too heavy and misleading. It suggests a project
structure matrix, and that overlaps with `alembic_graph`.

A shorter map-only name still sounds like project structure and can overlap
with `alembic_graph`.

`alembic_recipe_map` is the better public name because it states the actual
added value:

> Map Recipes onto the current ProjectContext graph region.

The graph provides project information structure and anchor/radius facts. The
recipe map adds Recipe, which is the project-pattern and architecture-convention
abstraction mounted onto that structure.

## Graph Higher-Level Abstraction

The higher-level abstraction above `alembic_graph` should be a recipe map.

`alembic_graph` owns factual ProjectContext relations:

```text
nodes + relations + refs + source slices
```

`alembic_recipe_map` owns the agent-facing projection of those facts:

```text
focus + radius + breadcrumb + nearby region + rollups + Recipe mounts
```

This is a higher abstraction because it adds:

- a focus point instead of a whole graph;
- a bounded radius instead of open traversal;
- hierarchy and breadcrumb for orientation;
- rollup counts instead of exhaustive descendants;
- Recipe mounts as an overlay;
- next drilldown refs back into graph/search.

It is still not a new source of project truth. ProjectContext through
`alembic_graph` remains the source of project facts. `alembic_recipe_map` adds
the Recipe overlay and rollups on top of those facts.

## Final Four-Tool Model

The four public methods together cover project information and all Recipe
information.

| Tool | Owns | Does Not Own |
| --- | --- | --- |
| `alembic_graph` | All ProjectContext structure and relationship information: space, repo, project map, module, module layers, file flow, file symbols, source slice, anchor range, impact, paths. | Recipe ids, Recipe summaries, Recipe mounts, Recipe search, Recipe priming. |
| `alembic_recipe_map` | A bounded ProjectContext region plus Recipe mounts and rollups for that region. | Free Recipe search, semantic task matching, full graph traversal, full Recipe bodies. |
| `alembic_search` | Precise and range-based Recipe query plus single Recipe detail by id, category, dimension, module, scope, tags, attributes, refs, and filters. | Project map construction, ProjectContext traversal, semantic task relevance, legacy single-Recipe query tools. |
| `alembic_prime` | Semantic Recipe positioning for a code-development task, feature, or requirement. | Project tree/map browsing, exact Recipe catalog browsing, ProjectContext graph traversal. |

Simple rule:

```text
graph = what the project is
recipe_map = what Recipes are mounted where in the project
search = find Recipes by explicit conditions
prime = choose Recipes for a coding task semantically
```

## Four MCP Tool Layer Consolidation

This is the last demand in the four-tool MCP optimization set. It must also
clean up the MCP tool layer as one coherent public surface.

The four tools are independent MCP functions:

- each tool has its own public schema, handler, output schema, description,
  tests, and examples;
- no tool handler may call another MCP tool handler, router, or public output
  projector as its implementation;
- tools may share lower-level Core services, repositories, ProjectContext
  helpers, Recipe metadata readers, output budget helpers, diagnostics helpers,
  and source-ref normalization utilities;
- `nextActions` may recommend another tool for follow-up exploration, but the
  current tool result must be useful and valid without executing that other
  tool.

Target code structure should reflect functional ownership:

```text
AlembicPlugin/lib/runtime/mcp/public-tools/
  graph/
    schema.ts
    handler.ts
    output.ts
    description.ts
  recipe-map/
    schema.ts
    handler.ts
    output.ts
    description.ts
  search/
    schema.ts
    handler.ts
    output.ts
    description.ts
  prime/
    schema.ts
    handler.ts
    output.ts
    description.ts
  shared/
    project-root.ts
    output-budget.ts
    diagnostics.ts
    refs.ts
    recipe-summary.ts
```

This structure is not a new abstraction layer above the tools. It is a cleanup
of the MCP tool layer so public behavior, tests, and descriptions match the new
four-tool model.

## Layer Split

The final design has two real layers.

### Governing Principle — Two Layers, Directional Routing (user-confirmed 2026-06-13)

The user fixed the architecture as exactly two layers with a directional
routing rule and NO third abstraction between them. This is the primary
architecture rule for the whole demand; everything else in Layer Split,
GMAP-2 (RecipeContext), and GMAP-8 (remove middle layer) is its mechanics.

- **Plugin layer = the four MCP tools + their support layer.** Owns everything
  agent/host-facing: the four public tools (`alembic_graph`,
  `alembic_recipe_map`, `alembic_search`, `alembic_prime`), their public
  schemas, per-tool output projection, descriptions/examples, output budget +
  truncation, diagnostics, `nextActions`, host-shell wiring, and a THIN shared
  support layer of pure helpers (project-root, output-budget, diagnostics,
  refs, recipe-summary, source-ref normalization). The support layer is
  helpers/primitives only — NOT a cross-tool orchestrator, NOT a unified
  envelope, NOT a retrieval planner, NOT freshness/snapshot state.
- **Core layer = ProjectContext + RecipeContext.** Owns everything
  data-facing: project structure facts (ProjectContext, already exists) and
  Recipe read models / id-ref-detail lookup / metadata filters / keyword +
  vector / semantic blocks / source-refs (RecipeContext, new). The mounting
  data side and the bounded region projection live at / over this layer.
- **Directional routing rule.** Place every concrete requirement by direction:
  anything agent / host / MCP-surface-facing goes UP into the Plugin layer;
  anything data / retrieval / semantic / source-ref-facing goes DOWN into the
  Core layer. No requirement may create or land in a middle abstraction.
- **The middle abstraction is removed, not renamed.**
  `ProjectKnowledgeContextLayer`, `KnowledgeContextOutputProjector`,
  `KnowledgeContextInputNormalizer`, `RetrievalPlanner`, `ContextIndexSnapshot`,
  and `KnowledgeContextToolOutput` (as the four tools' shared envelope) are
  deleted. Their input-normalize / output-project duties move UP into each tool
  plus the thin shared helpers; their retrieval / data duties move DOWN into
  Core RecipeContext. Nothing rebuilds them under a new name.

### Upper Layer: Four MCP Information Support Layer

The four MCP tools are the Agent-facing information support layer.

This layer owns:

- public tool names;
- public input schemas;
- public output schemas;
- tool descriptions and examples;
- output budget and truncation behavior;
- Agent-facing diagnostics;
- optional `nextActions`;
- consistent wording across MCP catalog, onboarding, host guidance, resident
  mirrors, and skills.

This layer does not own:

- ProjectContext construction;
- Recipe storage;
- Recipe source-ref indexing;
- vector index construction;
- semantic Recipe blocks;
- Recipe lifecycle;
- freshness/snapshot state;
- cross-tool orchestration.

### Lower Layer: Core Project And Recipe Context Modules

Project facts stay in Core `ProjectContext`.

Recipe facts and Recipe retrieval must move down into a Core module with the
same independence level as ProjectContext. Working name:

```text
@alembic/core/recipe-context
```

This lower module owns:

- Recipe repository read models;
- Recipe id/ref/detail lookup;
- Recipe summary/detail projection inputs;
- Recipe source refs and normalized source ranges;
- Recipe metadata filters: category, dimension, scope, tags, language,
  knowledgeType, moduleName;
- keyword/exact matching;
- vector/semantic matching when the resident Alembic service is available;
- semantic Recipe blocks used by `alembic_prime`;
- batch lookup APIs needed by `alembic_recipe_map`;
- deterministic not-found, ambiguous, stale-ref, and unresolved-ref results.

This lower module must not own:

- MCP tool descriptions;
- Agent-facing prose formatting;
- `nextActions`;
- Wakeflow state;
- freshness/snapshot abstractions;
- lifecycle management;
- Recipe creation/submission.

After this split, the four MCP tools become thin but real query projectors:

```text
alembic_graph       -> Core ProjectContext
alembic_recipe_map  -> Core ProjectContext + Core RecipeContext
alembic_search      -> Core RecipeContext
alembic_prime       -> Core RecipeContext semantic blocks
```

The discarded middle layer is:

```text
ProjectKnowledgeContextLayer
KnowledgeContextOutputProjector
RetrievalPlanner
KnowledgeContextToolOutput
freshness / snapshot orchestration for these four tools
```

These concepts should not be rebuilt under a different name.

Shared code rules:

- `shared/` contains only generic helpers and adapters that do not know which
  MCP tool called them unless the tool name is needed for diagnostics;
- ProjectContext access stays in Core ProjectContext APIs and shared bounded
  region helpers, not in search/prime-specific code;
- Recipe, source-ref, vector, and semantic-block access stays in Core
  RecipeContext APIs, not in MCP handlers or shared MCP utilities;
- Recipe source-ref reading and normalization can be shared by
  `alembic_recipe_map`, `alembic_search`, and `alembic_prime`, but Recipe
  mounting logic belongs only to `alembic_recipe_map`;
- semantic task matching belongs only to `alembic_prime`;
- exact/range/filter Recipe retrieval and single Recipe detail display belong
  only to `alembic_search`;
- ProjectContext graph projection belongs only to `alembic_graph`.

Public usage descriptions must be rewritten together:

| Tool | Agent should use when | Must not require |
| --- | --- | --- |
| `alembic_graph` | The agent needs project structure, refs, relations, source slices, impact radius, or anchor neighborhood. | Recipe lookup, Recipe scoring, search, prime, or recipe-map calls. |
| `alembic_recipe_map` | The agent has a project scope, file, symbol, or line anchor and needs Recipes mounted to that region. | Search calls, prime calls, full Recipe bodies, or graph MCP calls. |
| `alembic_search` | The agent needs explicit Recipe retrieval by query, id, category, dimension, scope, tag, source ref, or filter combination, including showing one Recipe's Agent-facing detail by id. | Intent classification, prime ranking, graph traversal, recipe-map calls, or legacy single-Recipe query tools. |
| `alembic_prime` | The agent has a code-development task or feature description and needs the most relevant design patterns and architecture Recipes. | Intent tool, search tool, graph tool, or recipe-map tool calls. |

Public descriptions must use the same vocabulary:

- "ProjectContext" for project facts;
- "Recipe" for design patterns, architecture conventions, and project
  standards;
- "anchor" and "radius" for file/symbol/line-centered ProjectContext regions;
- "mount" and "rollup" for Recipe placement on project structure;
- "search" for explicit Recipe retrieval;
- "prime" for semantic task-to-Recipe positioning.

The public tool descriptions must not tell agents that one MCP tool is a
required pre-step for another. They may describe optional follow-up flows.

## Functional Structure Re-Review

The old design had an overall output layer. That layer is useful as historical
context, but it is not the right final shape for the four query tools.

Current coupling found in the codebase:

| Current coupling | Problem | Final action |
| --- | --- | --- |
| `ProjectKnowledgeContextLayer` normalizes input, builds freshness/snapshot/retrieval plan, and projects `KnowledgeContextToolOutput` for multiple tools. | One generic envelope makes graph/search/prime/matrix look like one workflow instead of independent query tools. | Remove the four information tools from this generic output layer; keep only small reusable output helpers if needed. |
| `KnowledgeContextOutputProjector` has search-specific and graph-specific branches inside one projector. | Tool-specific shaping is hidden in a central projector and makes ownership unclear. | Move graph/search/prime/recipe-map projection into each tool-owned output module. |
| `RetrievalPlanner` and freshness/snapshot metadata are applied across tools. | Query tools start to look like orchestrated retrieval sessions instead of direct data lookup. | Remove them from the four query tools completely; do not rebuild freshness/snapshot under another name. |
| `search.ts` projects search and detail results through `defaultProjectKnowledgeContextLayer.resolveMcpResult`. | `alembic_search` is not a clean Recipe retrieval/output tool. | Give search its own summary/detail output projector. |
| `structure.ts` projects `alembic_graph` through `defaultProjectKnowledgeContextLayer.resolveMcpResult`. | Graph output is not pure ProjectContext output. | Give graph its own ProjectContext graph output schema. |
| `project-matrix.ts` reads knowledge catalog, calls `ProjectMatrixProvider`, then wraps output through the generic output layer. | Matrix mixes project structure, Recipe catalog, knowledge summaries, and output orchestration. | Delete/retire matrix; replace with graph + recipe map. |
| `agent-public-tools.ts` prime builds a project matrix and optional project graph before producing prime context. | Prime depends on project orientation tools and old matrix behavior instead of being a standalone semantic Recipe positioning tool. | Prime may use lower-level Recipe semantic services, but must not call or require matrix/graph/search/recipe-map MCP behavior. |
| `AgentPrimeOutputSchema` derives from `KnowledgeContextToolOutput`. | Prime inherits generic output semantics that do not match task-to-Recipe positioning. | Prime gets a dedicated output schema. |
| `knowledge-context-tools/output.ts` validates search and graph as `KnowledgeContextToolOutput`. | Public output validation preserves the old shared envelope. | Remove graph/search from that validator or narrow it to legacy-only surfaces. |
| Onboarding/status/guidance uses required sequences such as matrix -> graph -> search. | Agents are taught a workflow chain instead of independent tools. | Rewrite guidance as independent usage descriptions with optional follow-up `nextActions`. |
| `alembic_knowledge operation=get` remains an Agent-facing single Recipe detail route. | Recipe detail lookup is split across tools. | Move Agent detail lookup to `alembic_search operation=get`; keep admin/lifecycle knowledge tools outside the four-tool query surface if needed. |

Conclusion:

The four tools are not clean enough in the current code. The final demand must
make them clean query functions.

Clean query function means:

1. The tool accepts its own input contract.
2. The tool reads from its own allowed data sources or shared Core helpers.
3. The tool performs only deterministic filtering, projection, ranking,
   mounting, or semantic positioning that belongs to its purpose.
4. The tool returns a dedicated Agent-facing output schema.
5. The tool may include diagnostics and optional `nextActions`.
6. The tool does not require another MCP tool call to produce a valid answer.
7. The tool does not write state, dispatch work, mutate Recipes, or claim
   acceptance.

Final clean data paths:

```text
alembic_graph
  input: project scope / ref / file / symbol / line / radius
  reads: ProjectContext
  organizes: ProjectContext nodes, relations, refs, slices, diagnostics
  returns: ProjectContext-only graph output

alembic_recipe_map
  input: project scope / ref / file / symbol / line / radius
  reads: ProjectContext region + Recipe metadata/source refs
  organizes: direct mounts, ancestor applies, descendant rollups, diagnostics
  returns: Recipe-on-project-region output

alembic_search
  input: query / filters / id / ref / detailRef
  reads: Recipe repository + search index + optional semantic search service
  organizes: matching Recipe summaries or one Recipe detail
  returns: Recipe retrieval output

alembic_prime
  input: code-development task or feature description
  reads: Recipe semantic blocks + Recipe metadata/detail projection helpers
  organizes: task-relevant Recipe positioning
  returns: prime output for coding-task guidance
```

Output-layer replacement:

- remove `KnowledgeContextToolOutput` as the public envelope for these four
  tools;
- keep shared primitives only: `ToolStatus`, `ToolDiagnostic`, `ToolLimit`,
  `ToolNextAction`, `ToolRef`, and compact source evidence shapes;
- each tool owns its final structured output schema;
- common helpers must be pure projection helpers, not a central orchestrator.

## `alembic_search` Single Recipe Detail

`alembic_search` must also own single Recipe detail lookup for agents.

This replaces the current single Recipe query MCP surface. In current code this
includes the Agent-facing `alembic_knowledge` `operation=get` style route and
any equivalent "get one Recipe by id" public tool behavior.

Required public behavior:

```ts
interface AlembicSearchInput {
  operation: 'search' | 'get' | 'expand';
  query?: string;
  id?: string;
  refId?: string;
  detailRefId?: string;
  filters?: RecipeSearchFilters;
  detailLevel?: 'summary' | 'standard' | 'detailed';
}
```

Rules:

- `operation='search'` returns a bounded list of matching Recipe summaries and
  stable ids/refs.
- `operation='get'` with `id` returns one Agent-facing Recipe detail.
- `operation='expand'` with `id`, `refId`, or `detailRefId` returns one Recipe
  plus bounded adjacent context if available.
- `get` and `expand` must not require graph, recipe map, prime, or the old
  single-Recipe query tool.
- if no Recipe exists for the id/ref, return a structured not-found diagnostic.
- if the id resolves ambiguously, return a structured ambiguous-id diagnostic
  with candidate ids; do not guess.

Agent-facing single Recipe detail should include:

- id and stable detail ref;
- title;
- Recipe kind/type/category/dimension;
- summary;
- design pattern or architecture rule text needed for coding;
- scope/module/language/tags when present;
- source refs and reasoning sources when present;
- status/lifecycle if relevant to Agent use;
- related Recipe ids only as bounded references, not as a relation chain;
- diagnostics for stale source refs, missing source refs, or incomplete Recipe
  fields.

It should not include:

- raw database rows;
- full unrelated relation chains;
- ProjectContext graph traversal;
- recipe-map mount results;
- prime semantic ranking explanation.

Old public single Recipe query behavior:

- `alembic_knowledge operation=get` is replaced by `alembic_search
  operation=get`;
- `alembic_knowledge` must not remain a visible Agent-facing Recipe detail
  query tool after this demand;
- if any admin/lifecycle knowledge tool remains, it must be clearly outside
  the four Agent-facing MCP tools and must not be recommended for Recipe detail
  lookup.

## Problem

The current public surface has two coupled problems.

First, `alembic_graph` is not yet clean enough as the complete ProjectContext
tool:

- current graph schemas and handlers still live in the old
  ProjectKnowledgeContext family;
- current `alembic_graph` output is still projected through
  `ProjectKnowledgeContextLayer` / `KnowledgeContextToolOutput` surfaces;
- current public guidance still pairs `alembic_project_matrix` and
  `alembic_graph` as the project orientation route;
- current graph behavior must be checked against all ProjectContext request
  kinds: `space`, `repo`, `map`, `module`, `module-layers`, `file-flow`,
  `file-symbols`, `source-slice`, and `anchor-range`;
- graph must not return Recipe ids, Recipe summaries, Recipe mounts, Recipe
  relation chains, Recipe search results, or prime payloads.

Second, the old matrix surface is mixed:

- `alembic_project_matrix` suggests project structure, not Recipe overlay.
- Its current schema mixes ProjectContext fields, knowledge fields, vector
  fields, freshness fields, catalog behavior, and relation behavior.
- Its current handler reads `knowledgeService`, calls
  `defaultProjectMatrixProvider.resolveMatrix`, and wraps output through
  `defaultProjectKnowledgeContextLayer.resolveMcpResult`.
- Its current provider partly calls ProjectContext, partly samples filesystem
  tree facts, and partly builds a knowledge catalog.

The new target is not "return all Recipes in a project tree".

The target is:

- make `alembic_graph` the complete pure ProjectContext project-information
  MCP tool;
- use the same ProjectContext refs and bounded region logic as the structure
  substrate for `alembic_recipe_map`;
- mount Recipes onto the appropriate ProjectContext node or region;
- return only the queried region, nearby radius, direct mounts, and rollups;
- keep search and prime as independent Recipe tools for broader explicit or
  semantic Recipe discovery, without making recipe map call them.

## Existing Landing Points

The implementation can rely on real current capabilities:

- `ProjectContext` already exposes structure levels through
  `anchor-range`, `space`, `repo`, `map`, `module`, `module-layers`,
  `file-flow`, `file-symbols`, and `source-slice`.
- `recipe_source_refs` already exists as a bridge table with `recipeId`,
  `sourcePath`, `status`, `newPath`, and `verifiedAt`.
- `RecipeSourceRefRepository` already supports lookup by Recipe id, source
  path, status, stale refs, renamed refs, and upsert/update flows.
- Recipe production accepts `sourceRefs`, `reasoning.sources`, `scope`,
  `moduleName`, `dimensionId`, `knowledgeType`, `category`, `tags`, and
  metadata.
- Recipe evidence validation already treats missing concrete `sourceRefs` or
  `reasoning.sources` as a problem for code-grounded Recipes.
- Knowledge bootstrap already populates `recipe_source_refs` from
  `knowledge_entries.reasoning.sources`.
- Search infrastructure already reads active source refs for Recipe ids as a
  fallback when repository abstractions are unavailable.

So the new work is not inventing Recipe-code linkage. It is turning existing
source refs into a deterministic map overlay.

## Current Code Change Surface

The implementation must change the real public tool chain, not only add a new
provider.

Known current surfaces to inspect and update:

- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`: replace the public
  `ProjectMatrixInput` surface with `AlembicRecipeMapInput`; replace graph
  `operation` shape with ProjectContext `queryKind` shape.
- `AlembicPlugin/lib/runtime/mcp/tools.ts` and
  `AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts`: remove
  `alembic_project_matrix` from visible tools and register
  `alembic_recipe_map`.
- `AlembicPlugin/lib/runtime/mcp/McpServer.ts`: route `alembic_recipe_map`
  directly and stop dispatching `alembic_project_matrix` as a live handler.
- `AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts`: remove graph's old
  operation switch as the behavior contract; route graph through the new
  ProjectContext query handler.
- `AlembicPlugin/lib/runtime/mcp/handlers/structure.ts`: stop projecting
  `alembic_graph` through `defaultProjectKnowledgeContextLayer`.
- `AlembicPlugin/lib/runtime/mcp/handlers/project-matrix.ts`: delete or retire
  the live matrix handler; do not keep its `knowledgeService` catalog sampling
  as recipe-map implementation.
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts`: keep search as standalone
  Recipe retrieval; remove any intent/prime/graph/matrix coupling in public
  behavior; make `operation=get` the single Recipe detail path by id/ref.
- `AlembicPlugin/lib/runtime/mcp/handlers/knowledge.ts`,
  `AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts`, and
  `AlembicPlugin/lib/runtime/mcp/McpServer.ts`: remove or retire
  Agent-facing `alembic_knowledge operation=get` as a single Recipe query
  surface; route users to `alembic_search operation=get` without keeping a
  duplicate live detail tool.
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`: ensure `SearchInput`
  supports id/ref/detail lookup with `operation=get|expand`; remove visible
  Agent-facing single Recipe detail behavior from `KnowledgeInput`.
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts`: remove
  prime-time dependency on project matrix/graph MCP behavior; prime may use
  shared lower-level Recipe and semantic services directly.
- `AlembicPlugin/lib/runtime/mcp/public-tools/output.ts` and
  `AlembicPlugin/lib/runtime/mcp/knowledge-context-tools/output.ts`: split the
  four public outputs so graph, recipe map, search, and prime do not share one
  generic KnowledgeContext envelope.
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`:
  reduce/rebuild graph around ProjectContext query classes and shared region
  projection.
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectMatrixProvider.ts`:
  do not keep it as the recipe-map source of truth. Salvage only small
  deterministic utilities if they are still valid after ProjectContext is the
  source.
- `AlembicPlugin/lib/service/project-knowledge-context/contracts/KnowledgeContextBaseInput.ts`,
  `KnowledgeContextToolOutput.ts`, `ProjectKnowledgeContextLayer.ts`, and
  `KnowledgeContextOutputProjector.ts`: remove graph and matrix/recipe-map from
  the generic KnowledgeContext output route. Search/prime may keep their own
  Recipe-oriented output model.
- `AlembicPlugin/lib/runtime/status/OnboardingContract.ts`,
  `AlembicPlugin/lib/runtime/mcp/host/guidance.ts`, tool policy, and bundled
  Alembic skill guidance: replace the old "project_matrix + graph" route with
  "graph for ProjectContext, recipe_map for Recipe-mounted regions".
- `Alembic/lib/shared/schemas/mcp-tools.ts` and
  `Alembic/lib/resident/tool-handlers/*`: update any resident or built-in Agent
  mirror of the public tool schema so Alembic main does not keep an older
  graph/matrix/search/knowledge contract.

Required cleanup:

- `alembic_graph` and `alembic_recipe_map` must have their own output schemas.
- `alembic_graph` must not produce `KnowledgeContextToolOutput`.
- `alembic_recipe_map` must not call the old matrix provider as its
  implementation.
- Old guidance, onboarding, and skill text must not teach agents to call
  `alembic_project_matrix`.
- `alembic_project_matrix` must not remain in the visible MCP tool list,
  `ToolPolicy`, onboarding playbooks, host guidance, public schemas, or
  recommended tool sequences.
- If a stale host attempts to call `alembic_project_matrix`, the server may
  return an unknown/retired-tool error from a generic fallback, but it must not
  execute old matrix behavior and must not advertise the old tool.

## Goal

Create a clean graph/recipe-map pair.

`alembic_graph` answers:

> What is the ProjectContext structure, relation, source, path, or anchor
> information for this project scope?

It must support all ProjectContext request kinds and stay Recipe-free.

`alembic_recipe_map` answers:

> For this project region or anchor radius, what structure is relevant, and
> which Recipes are mounted here?

Together they must support:

- pure ProjectContext graph queries through `alembic_graph`;
- top-level project/space view with global no-code architecture Recipes;
- repo/module/file/anchor focused view;
- node-level rollups so agents do not receive all descendant Recipes;
- stable refs shared between graph drilldown, map region output, and search
  detail;
- honest diagnostics for stale, unresolved, ambiguous, or unmounted Recipes.

## Non-Goals

- Do not make `alembic_recipe_map` a replacement for `alembic_graph`.
- Do not return all ProjectContext data.
- Do not return all Recipes.
- Do not keep `alembic_graph` inside Recipe/KnowledgeContext output semantics.
- Do not add Recipe fields to `alembic_graph`.
- Do not run semantic Recipe search.
- Do not run keyword Recipe search.
- Do not return full Recipe bodies.
- Do not infer Recipe relevance from natural language.
- Do not keep `alembic_project_matrix` as a parallel public tool.
- Do not keep old `ProjectKnowledgeContextLayer` output.
- Do not add lifecycle, governance, staging, build, refresh, inspect, resolve,
  or mutation behavior.

## `alembic_graph` New Logic

`alembic_graph` must become the single public MCP surface for ProjectContext.

Required ProjectContext coverage:

| Graph query class | ProjectContext source |
| --- | --- |
| project space | `space` |
| repo/root overview | `repo` |
| project architecture map | `map` |
| module detail | `module` |
| module layers | `module-layers` |
| file flow | `file-flow` |
| file symbols | `file-symbols` |
| source slice | `source-slice` |
| anchor radius | `anchor-range` |
| path / impact / neighborhood / stats | ProjectContext refs and relations derived from the above |

Graph input should be ProjectContext-shaped rather than Recipe-shaped.

Recommended public shape:

```ts
interface AlembicGraphInput {
  queryKind:
    | 'space'
    | 'repo'
    | 'map'
    | 'module'
    | 'module-layers'
    | 'file-flow'
    | 'file-symbols'
    | 'source-slice'
    | 'anchor-range'
    | 'path'
    | 'impact'
    | 'neighborhood'
    | 'stats';
  refId?: string;
  fromRefId?: string;
  toRefId?: string;
  filePath?: string;
  symbolName?: string;
  line?: number;
  radius?: {
    maxDepth?: number;
    beforeLines?: number;
    afterLines?: number;
    relationHops?: number;
  };
  projectRoot?: string;
  activeFile?: string;
  detailLevel?: 'summary' | 'standard' | 'detailed';
  budget?: {
    itemLimit?: number;
    refLimit?: number;
    relationLimit?: number;
    contentCharLimit?: number;
  };
}
```

Existing `operation=query|impact|path|stats|neighborhood` can be retained only
as stale-input normalization inside the new handler if a host sends old cached
arguments. The public schema and documentation must be `queryKind`; old
`operation` values must not remain the design contract and must not preserve old
knowledge-context behavior.

Graph output should be a ProjectContext graph projection:

```ts
interface AlembicGraphOutput {
  ok: boolean;
  status: 'ready' | 'partial' | 'degraded' | 'failed';
  tool: 'alembic_graph';
  queryKind: AlembicGraphInput['queryKind'];
  summary: string;
  project: {
    projectRoot: string;
    displayName?: string;
    projectId?: string;
  };
  nodes: GraphNodeSummary[];
  relations: GraphRelationSummary[];
  refs: ProjectContextRefSummary[];
  slices?: GraphSourceSliceSummary[];
  diagnostics: GraphDiagnostic[];
  nextActions: GraphNextAction[];
  limits: {
    truncated: boolean;
    itemLimit: number;
    refLimit: number;
    relationLimit: number;
  };
}
```

Graph output must not include:

- Recipe ids;
- Recipe titles or summaries;
- Recipe mounts;
- Recipe relation chains;
- search scores;
- semantic prime results;
- knowledge catalog categories.

Graph implementation rules:

1. Call `@alembic/core/project-context` through the public ProjectContext
   entrypoint.
2. Preserve ProjectContext refs, query errors, and unavailable-data reasons.
3. Return bounded output, not full source dumps.
4. Keep graph and recipe-map ref ids compatible.
5. Do not use `ProjectKnowledgeContextLayer` as the public graph output
   projector after this demand.
6. If a requested ProjectContext fact is missing, return a graph diagnostic or
   add the fact to ProjectContext; do not rebuild it through old source graph,
   panorama, project-intelligence, or filesystem fallback.

## Shared Graph/Recipe Map Region Contract

`alembic_recipe_map` should not construct a second private project tree.

The implementation should introduce a shared internal ProjectContext region
projection used by both:

- graph uses it to return Recipe-free structure;
- map uses it to mount Recipes onto the same nodes and refs.

This is not a new project-information source. It is a projection of
ProjectContext envelopes.

Required internal region shape:

```ts
interface ProjectContextRegion {
  project: {
    projectRoot: string;
    projectId?: string;
    displayName?: string;
  };
  focus: {
    kind: string;
    refId?: string;
    filePath?: string;
    line?: number;
  };
  rootNode: RegionNode;
  breadcrumb: RegionNode[];
  nodes: RegionNode[];
  relations: RegionRelation[];
  refs: ProjectContextRefSummary[];
  diagnostics: RegionDiagnostic[];
  truncated: boolean;
}
```

Ref continuity requirement:

- a node/ref returned by `alembic_graph` must be usable as
  `alembic_recipe_map.focus`;
- a node/ref returned by `alembic_recipe_map` must be usable as
  `alembic_graph.refId`;
- if a ref cannot round-trip, the tool must say why.

## Public Contract

Prefer one unified query shape rather than many operations.

Recommended MCP tool:

```text
alembic_recipe_map
```

Recommended input:

```ts
interface AlembicRecipeMapInput {
  focus?: {
    kind: 'space' | 'repo' | 'map' | 'module' | 'file' | 'symbol' | 'anchor';
    refId?: string;
    nodeId?: string;
    filePath?: string;
    line?: number;
    sourceRef?: string;
    moduleName?: string;
    repoId?: string;
  };
  radius?: {
    upLevels?: number;
    downLevels?: number;
    relationHops?: number;
    beforeLines?: number;
    afterLines?: number;
  };
  projectRoot?: string;
  activeFile?: string;
  includeRecipes?: boolean;
  includeRollups?: boolean;
  recipeMountLimit?: number;
  nodeLimit?: number;
  detailLevel?: 'summary' | 'standard' | 'detailed';
}
```

Defaults:

- no `focus` means `space`;
- `includeRecipes` defaults true;
- `includeRollups` defaults true;
- output is always bounded;
- a line anchor uses bounded line radius;
- relation expansion is delegated to ProjectContext/graph data and returned
  only as local map context, not as full graph traversal.

Retired public surface:

- remove `alembic_project_matrix` from visible MCP tools;
- do not keep `alembic_project_matrix` as an alias to `alembic_recipe_map`;
- if a stale host forces the old name through a generic dispatcher, return an
  unknown/retired-tool error without executing old provider behavior.

## Output Contract

Recommended structured output:

```ts
interface AlembicRecipeMapOutput {
  ok: boolean;
  status: 'ready' | 'partial' | 'degraded' | 'failed';
  tool: 'alembic_recipe_map';
  summary: string;
  project: {
    projectRoot: string;
    displayName?: string;
    projectId?: string;
  };
  focus: MapFocus;
  radius: MapRadius;
  region: {
    rootNode: MapNodeSummary;
    breadcrumb: MapNodeSummary[];
    nodes: MapNodeSummary[];
    truncated: boolean;
  };
  recipeMounts: RecipeMountSummary[];
  recipeRollups: RecipeRollupSummary[];
  diagnostics: MapDiagnostic[];
  nextActions: MapNextAction[];
  limits: {
    nodeLimit: number;
    recipeMountLimit: number;
    refLimit: number;
    detailLevel: 'summary' | 'standard' | 'detailed';
  };
}
```

Node summary:

```ts
interface MapNodeSummary {
  nodeId: string;
  kind: 'space' | 'repo' | 'map' | 'module-layer' | 'module' | 'file' | 'symbol' | 'source-slice' | 'anchor-range';
  label: string;
  path?: string;
  projectContextRef?: string;
  parentNodeId?: string;
  childCount?: number;
  directRecipeCount: number;
  descendantRecipeCount: number;
  representativeRecipeIds: string[];
}
```

Recipe mount:

```ts
interface RecipeMountSummary {
  recipeId: string;
  title: string;
  kind?: string;
  category?: string;
  dimensionId?: string;
  summary?: string;
  mountNodeId: string;
  mountLevel: MapNodeSummary['kind'];
  mountType:
    | 'global-no-code'
    | 'metadata-scope'
    | 'source-file'
    | 'source-line'
    | 'source-range'
    | 'source-ref-nearest-node'
    | 'multi-ref-common-ancestor'
    | 'cross-repo-common-ancestor'
    | 'degraded-stale'
    | 'degraded-unresolved';
  sourceRefs: string[];
  matchedRefs: string[];
  reason: string;
  detailRef?: string;
}
```

No full Recipe body is returned. Use `alembic_search` for Recipe detail by id.

## Recipe Mounting Logic

Recipe mounting has four stages.

### Stage 1: Collect Recipe Sources

For each candidate Recipe, collect source evidence in this priority order:

1. `recipe_source_refs` rows for the Recipe;
2. `sourceRefs` on the Recipe record;
3. `reasoning.sources`;
4. `sourceFile` only as weak fallback;
5. explicit metadata such as `scope`, `moduleName`, `dimensionId`,
   `category`, `knowledgeType`, or `tags`.

For code-grounded Recipes, source refs are required. A Recipe with no code refs
is not automatically global.

### Stage 2: Normalize Refs

Normalize every source ref into:

```ts
interface NormalizedRecipeRef {
  recipeId: string;
  raw: string;
  filePath?: string;
  startLine?: number;
  endLine?: number;
  status: 'active' | 'stale' | 'renamed' | 'unresolved' | 'metadata-only';
  newPath?: string;
}
```

Rules:

- parse `path:line`, `path:L10`, `path:10-20`, and file-only paths;
- normalize paths through the same project path rules used by ProjectContext;
- preserve stale/renamed status from `recipe_source_refs`;
- if `newPath` exists, include it and mark the mount as renamed/degraded unless
  the implementation can revalidate it;
- never silently drop stale or unresolved refs.

### Stage 3: Build The Region

Use ProjectContext-backed facts to build only the requested region.

This stage should use the shared graph/recipe-map ProjectContext region
projection.
It should not call the public MCP `alembic_graph` tool as a subprocess, and it
should not keep a separate map-only tree builder.

Focus handling:

- `space`: space root, repo summaries, global mounts, rollups;
- `repo`: repo node, project map summary, major child areas, direct mounts,
  rollups;
- `map`: architecture map region, modules/layers summary, direct mounts,
  rollups;
- `module`: module node, layer context, top files/public surfaces summary,
  direct mounts, rollups;
- `file`: file node, symbols summary, direct mounts;
- `symbol`: symbol node, source-slice/anchor refs when available, direct mounts;
- `anchor`: bounded line/source-range region plus direct source-ref matches.

The map response can include enough project structure to orient the agent, but
it should not dump the full tree. Use `alembic_graph` for pure ProjectContext
queries, full structure, and deeper relation traversal.

### Stage 4: Select Mount Target

Mount target selection is deterministic.

1. If the Recipe has no code refs and explicit metadata says global,
   architecture, project-wide, or space-level, mount to `space`.
2. If the Recipe has no code refs and explicit metadata says module/repo scope,
   mount to that exact module/repo only when the target can be resolved without
   guessing.
3. If the Recipe has a file-only ref, mount to the file node.
4. If the Recipe has a line/range ref and the queried region includes a
   matching anchor/source-slice node, mount to that node.
5. If the queried region does not include the deeper node, mount to the nearest
   visible ancestor and set `mountType = source-ref-nearest-node`.
6. If one Recipe has multiple refs in one module, mount to the lowest common
   module/layer/file ancestor.
7. If refs span multiple modules in one repo, mount to the repo/map-level
   common ancestor.
8. If refs span multiple repos in one space, mount to the space root.
9. If any ref is stale, unresolved, or outside scope, include a diagnostic and
   do not count it as a confident direct mount.
10. Do not use semantic similarity or keyword matching to choose mount targets.

## Query Semantics

`alembic_recipe_map` must not return everything.

For a top-level query:

- return the space root;
- return repo/project summaries;
- return global no-code architecture Recipes;
- return rollup counts for lower-level Recipe mounts;
- return representative child refs;
- do not dump every module/file Recipe.

For a module query:

- return module-level generic Recipes;
- return Recipes mounted directly in the module;
- return child rollups by file/symbol/anchor;
- include project/global ancestor Recipes only as `appliesFromAncestor`, within
  budget;
- do not dump unrelated module Recipes.

For an anchor query:

- return Recipes whose refs intersect the line/range radius;
- return file/module/global ancestor Recipes that apply to that anchor, within
  budget;
- return related Recipe rollups only if `relationHops` is requested;
- do not run search for semantically similar Recipes.

## Ordering

Ordering should be deterministic:

1. exact anchor/range matches;
2. direct focus-node mounts;
3. nearest visible ancestor mounts;
4. descendant rollup representatives;
5. global no-code mounts;
6. metadata-only mounts;
7. degraded stale/unresolved mounts.

Within each group:

- active before stale;
- narrower scope before broader scope;
- stable by Recipe id/title;
- no semantic score ordering.

## End-To-End Landing Solution

This demand should be implemented as one coordinated four-tool finish, not as
isolated point changes.

The final runtime dependency direction must be:

```text
MCP public tools
  graph
  recipe-map
  search
  prime

shared MCP utilities
  project root
  output budget
  diagnostics
  ref normalization
  graph/recipe-map/search/prime output primitives

Core lower modules
  ProjectContext
  RecipeContext

Core storage/services behind those modules
  project source readers
  Recipe repository
  RecipeSourceRefRepository
  keyword index
  vector / semantic service
  Recipe semantic blocks
```

Forbidden runtime direction:

```text
graph -> recipe-map
recipe-map -> graph/search/prime MCP handlers
search -> graph/recipe-map/prime MCP handlers
prime -> intent/search/graph/recipe-map MCP handlers
```

Tools may recommend each other in `nextActions`, but recommendations are not
implementation dependencies.

### Implementation Spine

The implementation should move in this order:

1. Define the four public contracts and shared vocabulary.
2. Move Recipe data, source refs, keyword search, vector search, and semantic
   Recipe blocks behind Core RecipeContext APIs.
3. Rebuild `alembic_graph` as pure ProjectContext.
4. Build shared ProjectContext region projection for graph and recipe map.
5. Implement `alembic_recipe_map` on top of region projection plus Recipe
   source refs.
6. Adjust `alembic_search` so search/list and `get(id)` detail are both owned
   by search.
7. Remove `alembic_project_matrix` and legacy Agent-facing single Recipe detail
   tools from public discovery.
8. Consolidate four-tool code structure, descriptions, tests, resident mirrors,
   and guidance.

This order prevents `alembic_recipe_map` from rebuilding project structure
itself and prevents search/prime from inheriting old matrix or knowledge
surface behavior.

### `alembic_graph` Landing

`alembic_graph` must be rebuilt first because every other project-information
claim depends on ProjectContext being cleanly exposed.

Runtime flow:

```text
input queryKind/ref/file/line/radius
  -> normalize project root and focus
  -> call Core ProjectContext query
  -> project bounded graph output
  -> emit refs, nodes, relations, slices, diagnostics, nextActions
```

Implementation requirements:

- public input is `queryKind`, not the old five-operation router contract;
- old `operation=query|impact|path|stats|neighborhood` is accepted only as
  stale-input normalization at the handler boundary;
- graph output has its own schema and never uses
  `KnowledgeContextToolOutput`;
- graph output never includes Recipe ids, Recipe summaries, Recipe mounts,
  Recipe scores, or Recipe relation chains;
- if ProjectContext lacks a fact, graph reports a diagnostic or requires
  ProjectContext improvement; it does not fallback to old matrix/panorama/source
  graph logic.

Minimum graph test set:

- `space`;
- `repo`;
- `map`;
- `module`;
- `module-layers`;
- `file-flow`;
- `file-symbols`;
- `source-slice`;
- `anchor-range`;
- `path/impact/neighborhood/stats` derived from ProjectContext refs/relations;
- old `operation` stale-input normalization does not create a second behavior
  branch.

### `alembic_recipe_map` Landing

`alembic_recipe_map` is the replacement for `alembic_project_matrix`.

Runtime flow:

```text
input focus/radius/projectRoot
  -> normalize focus to ProjectContext ref
  -> build bounded ProjectContext region
  -> collect candidate Recipes from source refs and explicit metadata
  -> normalize Recipe refs
  -> mount Recipes to visible ProjectContext nodes
  -> compute direct mounts, ancestor applies, descendant rollups
  -> emit bounded recipe-map output and diagnostics
```

Candidate collection should be broad enough to avoid missing relevant mounted
Recipes, but the output must stay narrow:

- top-level/space query collects explicit global/project-wide no-code Recipes
  plus rollup candidates from child repos/modules;
- repo/module query collects explicit metadata-scope Recipes and source refs
  under the repo/module path;
- file query collects file source refs, containing module/repo/global ancestor
  Recipes, and child symbol rollups when available;
- anchor query collects line/range-intersecting refs plus bounded ancestor
  Recipes;
- stale/renamed/unresolved refs are preserved as diagnostics and not silently
  converted into confident mounts.

Mounting must be deterministic:

- source-range/line refs mount to anchor/source-slice when visible;
- file refs mount to file;
- metadata-only module/repo Recipes mount only when the metadata resolves
  exactly;
- multi-ref Recipes mount to the lowest common visible ancestor;
- cross-repo Recipes mount to space with a cross-repo diagnostic;
- no semantic or keyword matching is used to choose mount target.

Replacement requirements:

- `alembic_project_matrix` is deleted from public discovery;
- it is not an alias to `alembic_recipe_map`;
- old matrix provider logic is not reused as source of truth;
- any salvageable pure helper must be moved into shared utilities only after it
  is proven ProjectContext-compatible;
- stale host calls may receive unknown/retired-tool diagnostics but must not
  execute old matrix behavior.

Minimum recipe-map test set:

- top-level returns global no-code architecture/design Recipes and lower-level
  rollups, not all Recipes;
- module query returns direct module mounts and descendant rollups;
- file query returns file mounts plus bounded ancestor applies;
- anchor query returns radius-intersecting Recipes;
- multi-ref Recipe mounts to common ancestor;
- stale/renamed/unresolved refs produce diagnostics;
- returned graph refs can be used by `alembic_graph`;
- returned Recipe ids can be used by `alembic_search get`.

### `alembic_search` Landing

`alembic_search` owns explicit Recipe retrieval.

Runtime flow:

```text
operation=search
  -> exact filters + keyword + optional semantic service
  -> merged deduped Recipe summary list

operation=get
  -> id/ref/detailRef lookup
  -> one Agent-facing Recipe detail

operation=expand
  -> id/ref/detailRef lookup
  -> one Recipe detail plus bounded adjacent Recipe context
```

Implementation requirements:

- `search` returns all Recipes that meet threshold/filter rules within output
  budget, not only a single best answer;
- `get(id)` returns a single Agent-facing Recipe detail and replaces legacy
  single Recipe query tools;
- `expand` may include bounded adjacent context, but not full relation chains;
- no `alembic_knowledge operation=get` or equivalent legacy single Recipe query
  remains visible/recommended for Agent detail lookup;
- search does not require graph, recipe map, prime, or intent MCP calls.

Minimum search test set:

- explicit id lookup returns one detail;
- ref/detailRef lookup resolves to one detail or structured not-found /
  ambiguous diagnostics;
- category/dimension/scope/tags filters return matching summaries;
- combined query + filters returns deduped summaries;
- legacy single Recipe query surface is absent from Agent public discovery or
  marked outside the four Agent-facing tools.

### `alembic_prime` Closeout

`alembic_prime` remains the semantic task-to-Recipe tool.

This demand should not redesign prime internals again, but it must ensure the
four-tool closeout does not reintroduce the old intent/search/graph dependency
chain.

Prime requirements in this demand:

- prime input is high-quality task/feature/code-development intent text;
- prime output is task-relevant Recipe positioning;
- prime does not require `alembic_intent`, `alembic_search`, `alembic_graph`, or
  `alembic_recipe_map` MCP pre-calls;
- prime may share Recipe semantic blocks and Recipe detail projection helpers;
- prime public description must say it is for coding-task semantic positioning,
  not generic Recipe browsing.

### Old Tool Deletion Matrix

| Old surface | Final action | Replacement |
| --- | --- | --- |
| `alembic_project_matrix` public tool | Delete from discovery, catalog, policy, guidance, schemas, and live routing. | `alembic_recipe_map` for Recipe-mounted regions; `alembic_graph` for pure ProjectContext. |
| `ProjectMatrixInput` public schema | Delete or replace with `AlembicRecipeMapInput`. | `AlembicRecipeMapInput`. |
| `ProjectMatrixProvider` as source of truth | Delete or stop exporting. Salvage only proven deterministic utilities. | ProjectContext region projection plus Recipe mount engine. |
| graph `KnowledgeContextToolOutput` route | Remove for graph. | Dedicated graph output schema. |
| recipe-map `KnowledgeContextToolOutput` route | Do not create. | Dedicated recipe-map output schema. |
| `alembic_knowledge operation=get` Agent detail lookup | Remove from Agent-facing discovery/guidance. | `alembic_search operation=get`. |
| old tool-sequence guidance requiring matrix then graph then search | Delete. | Independent four-tool descriptions with optional follow-up `nextActions`. |

Admin or lifecycle knowledge tools may remain only if they are clearly outside
the four Agent-facing information tools.

### Acceptance Flow For Implementation

Implementation is acceptable only when all of these are true:

1. Fresh MCP discovery shows the four Agent-facing information tools:
   `alembic_graph`, `alembic_recipe_map`, `alembic_search`, `alembic_prime`.
2. Fresh MCP discovery does not show `alembic_project_matrix`.
3. Agent-facing guidance does not recommend `alembic_knowledge operation=get`
   for Recipe details.
4. Each four-tool handler can answer a valid request without calling another
   MCP tool handler/router.
5. `alembic_graph` returns ProjectContext-only output.
6. `alembic_recipe_map` returns region-scoped Recipe mounts and rollups.
7. `alembic_search operation=get` returns one Agent-facing Recipe detail.
8. `alembic_prime` returns task-relevant Recipe positioning without an intent
   pre-call.
9. AlembicPlugin MCP and Alembic main resident mirror expose the same public
   names, schemas, and descriptions.

## Implementation Plan

### GMAP-0: Baseline Inventory

Goal: inventory current graph and matrix behavior before changing public tools.

Tasks:

- inventory current `alembic_graph` schema, handler, provider, output contract,
  tests, and guidance;
- inventory current `alembic_project_matrix` schema, handler, output, tests, and
  guidance;
- inventory current `alembic_search` `search/get/expand` behavior, output
  shape, and resident mirror;
- inventory current Agent-facing `alembic_knowledge operation=get` or
  equivalent single Recipe detail routes;
- inventory current `alembic_prime` public dependencies on intent, search,
  graph, matrix, or generic KnowledgeContext output;
- inventory the current code change surfaces listed above and record which ones
  are deletion, rename, replacement, or resident mirror updates;
- list current `ProjectKnowledgeContextLayer` / `KnowledgeContextToolOutput`
  dependencies for graph, matrix, search, and prime;
- decide exact retired behavior for stale host calls;
- record current tests and guidance that expect graph/project_matrix together
  or require a four-tool call sequence.

Acceptance:

- controller can see what changes in graph, recipe map, search, prime, legacy
  knowledge detail lookup, and what is deleted or renamed.

### GMAP-1: Graph ProjectContext Rebuild

Goal: make `alembic_graph` the complete pure ProjectContext MCP tool.

Tasks:

- replace graph input with ProjectContext query classes;
- if a cached host sends old `operation` arguments, normalize them only at the
  handler boundary into the new `queryKind` path and record a diagnostic; do
  not keep a second graph behavior branch;
- remove the old graph operation router as the public behavior model;
- ensure graph covers `space`, `repo`, `map`, `module`, `module-layers`,
  `file-flow`, `file-symbols`, `source-slice`, and `anchor-range`;
- remove graph Recipe/knowledge-context output semantics;
- project graph output from ProjectContext refs, relations, errors, and
  unavailable data;
- update graph guidance and tests to prove it returns no Recipe content.

Acceptance:

- graph answers every ProjectContext query class in a bounded way;
- graph output is Recipe-free;
- graph output no longer uses `ProjectKnowledgeContextLayer` as its public
  envelope.

### GMAP-2: Core RecipeContext Foundation

Goal: move Recipe data, source refs, keyword search, vector search, and semantic
Recipe blocks into a Core lower module parallel to ProjectContext.

Tasks:

- create or consolidate Core `RecipeContext` read/query APIs;
- expose Recipe summary/detail lookup by id/ref/detailRef;
- expose explicit metadata filters for category, dimension, scope, tags,
  language, knowledgeType, and moduleName;
- expose batch source-ref lookup for project path/module/file/line ranges;
- expose keyword/exact matching and optional vector/semantic matching through
  Core APIs;
- expose semantic Recipe blocks needed by prime;
- return deterministic results and diagnostics for not-found, ambiguous,
  stale-ref, renamed-ref, unresolved-ref, and unavailable semantic service;
- keep lifecycle/create/update/submit outside this module.

Acceptance:

- `alembic_search`, `alembic_recipe_map`, and `alembic_prime` can read Recipe
  data through Core RecipeContext instead of direct Plugin-local lookup logic;
- vector/semantic lookup is behind Core RecipeContext, not inside MCP handler
  code;
- no freshness/snapshot abstraction is introduced.

### GMAP-3: Shared Region Builder

Goal: create the shared ProjectContext region projection used by graph and
recipe map.

Tasks:

- call ProjectContext or graph-owned ProjectContext helpers for focus/radius;
- normalize focus inputs into ProjectContext refs;
- return bounded nodes, breadcrumb, direct children, relations, diagnostics, and
  optional graph/search drilldown refs;
- guarantee graph/recipe-map ref round-trip;
- avoid full tree dumps.

Acceptance:

- space/repo/module/file/anchor focus all produce bounded region output;
- graph and recipe map use the same region/ref semantics;
- no old filesystem sampling provider is used as the source of truth.

### GMAP-4: Tool Rename And Recipe Map Contract

Goal: replace `alembic_project_matrix` with `alembic_recipe_map`.

Tasks:

- add public `alembic_recipe_map` schema and description as the replacement
  contract;
- delete `alembic_project_matrix` from visible MCP tools;
- update MCP server routing, tool catalog, tool policy, onboarding guidance,
  host guidance, resident mirrors, and Alembic skill text;
- remove old matrix handler/schema/provider exports when no other internal
  code needs them;
- if a stale forced call is unavoidable through a generic dispatcher, return
  unknown/retired-tool without running matrix behavior;
- update public catalog, onboarding guidance, and skills.

Acceptance:

- visible public MCP tool is `alembic_recipe_map`;
- `alembic_project_matrix` is absent from public tool discovery;
- `alembic_project_matrix` is not a second live tool and not a compatibility
  alias.

### GMAP-5: Recipe Source Ref Adapter

Goal: expose minimal Recipe metadata and normalized source refs for mounting.

Tasks:

- read minimal Recipe fields: id, title, kind, category, dimensionId, summary,
  lifecycle, scope, moduleName, tags, sourceRefs, reasoning.sources;
- read `recipe_source_refs` rows and status;
- add repository methods if needed for batch lookup by source paths, path
  prefix, Recipe ids, and stale status;
- normalize refs into file/path/line/range records.

Acceptance:

- mount code can distinguish active, stale, renamed, unresolved, and
  metadata-only refs;
- no full Recipe body is loaded unless needed for summary fallback.

### GMAP-6: Mount Engine

Goal: deterministically attach Recipes to ProjectContext nodes.

Tasks:

- implement mount target selection rules;
- compute lowest common ancestor for multi-ref Recipes;
- compute direct mounts and descendant rollups;
- classify global no-code and metadata-scope mounts only from explicit
  metadata;
- emit diagnostics for unmounted/no-source/stale/unresolved cases.

Acceptance:

- code-pointed Recipes mount to the deepest resolvable node;
- no-code architecture/global Recipes mount to space only when explicitly
  supported;
- no semantic or keyword search is used for mounting.

### GMAP-7: Recipe Map Output Projector

Goal: produce compact MCP output.

Tasks:

- project region, recipeMounts, recipeRollups, diagnostics, nextActions, and
  limits;
- include `alembic_graph` next actions for pure ProjectContext drilldown;
- include `alembic_search` next actions for Recipe detail;
- include `alembic_prime` next actions only for task semantic matching.

Acceptance:

- output is concise, bounded, and region-scoped;
- no full source or full Recipe body appears;
- output is deterministic for the same project state and input.

### GMAP-8: Four MCP Tool Layer Consolidation

Goal: make graph, recipe map, search, and prime a unified public MCP layer with
independent tool behavior.

Tasks:

- restructure the MCP public tool layer around four functional folders or
  equivalent owned modules: graph, recipe-map, search, prime;
- give each tool its own schema, handler, output schema, description, tests,
  and examples;
- ensure `alembic_search operation=get` is the only Agent-facing single Recipe
  detail query path by id/ref/detailRef;
- remove visible Agent-facing `alembic_knowledge operation=get` or any
  equivalent single Recipe detail query tool from public discovery and
  guidance;
- move only generic helpers into shared MCP utilities;
- remove MCP-to-MCP implementation calls and shared generic
  KnowledgeContextToolOutput coupling;
- remove `ProjectKnowledgeContextLayer`, `KnowledgeContextOutputProjector`,
  `RetrievalPlanner`, and freshness/snapshot orchestration from the public
  output path of graph, recipe map, search, and prime;
- replace the old central output envelope with dedicated per-tool output
  projectors plus small shared primitives for status, diagnostics, refs,
  limits, next actions, and source evidence;
- rewrite tool catalog, onboarding, host guidance, skill guidance, and public
  descriptions together;
- remove old guidance that implies a required call order between the four
  tools;
- ensure AlembicPlugin MCP and Alembic main resident mirrors expose the same
  tool names, descriptions, and schemas.

Acceptance:

- each of the four tools can be called alone for its own scope;
- no tool handler imports or calls another MCP tool handler/router as its
  implementation;
- single Recipe detail by id works through `alembic_search operation=get`;
- the old single Recipe query MCP surface is not recommended or visible as an
  Agent Recipe detail tool;
- graph/search/prime/recipe-map no longer validate or return
  `KnowledgeContextToolOutput` as their public Agent-facing output;
- each tool's output is a clean projection of data it directly retrieved or
  obtained through approved lower-level Core/shared helpers;
- public descriptions use one vocabulary for ProjectContext, Recipe, anchor,
  radius, mount, rollup, search, and prime;
- examples show optional follow-up flows but no required MCP tool chain.

### GMAP-9: Tests And Runtime Proof

Goal: prove the four MCP tools and the graph/recipe-map replacement work in
real Alembic space.

Tests:

- graph returns ProjectContext `space`, `repo`, `map`, `module`,
  `module-layers`, `file-flow`, `file-symbols`, `source-slice`, and
  `anchor-range` classes with no Recipe content;
- graph refs round-trip into recipe-map focus;
- recipe-map refs round-trip into graph focus;
- top-level query returns global no-code Recipes and lower-level rollups, not
  all Recipes;
- module query returns module/direct mounts and descendant rollups;
- anchor query returns radius-intersecting Recipe refs;
- stale source refs produce diagnostics;
- full Recipe detail is retrieved through `alembic_search`;
- full ProjectContext structure is retrieved through `alembic_graph`;
- old `alembic_project_matrix` is absent from public discovery and cannot run
  matrix behavior;
- search can return Recipe summaries/ids by explicit query and filters without
  calling graph, recipe map, or prime;
- search can return one Agent-facing Recipe detail by id using
  `operation=get`, replacing the old single Recipe query tool;
- prime can return task-relevant Recipe positioning without calling intent,
  search, graph, or recipe map;
- graph, recipe map, search, and prime public descriptions are consistent.

Runtime proof:

- run a fresh MCP session or equivalent reload proof;
- call `alembic_graph` for ProjectContext space/map/module/file/anchor classes;
- call `alembic_recipe_map` on AlembicWorkspace top-level;
- call `alembic_recipe_map` on a module or file anchor with existing Recipe
  refs;
- call `alembic_graph` using a returned graph ref;
- call `alembic_search` using a returned Recipe id;
- call `alembic_search` with `operation=get` and a known Recipe id and verify
  the result contains Agent-facing Recipe detail;
- call `alembic_prime` with a code-development task description and verify it
  does not require intent/search/graph/recipe-map pre-calls.

## Edge Cases

No source refs:

- Mount only when explicit Recipe metadata identifies global/repo/module scope.
- Otherwise return as `unmounted` diagnostic, not as a guessed global Recipe.

Architecture Recipe with no code pointer:

- Mount to space root only when category, knowledgeType, dimension, scope, or
  metadata explicitly says architecture/design/global/project-wide.

Module-level generic Recipe:

- Mount to module only when `moduleName`, scope metadata, dimension metadata, or
  an exact ProjectContext ref resolves the module.
- If the module cannot be resolved, return diagnostic.

File-only source ref:

- Mount to file node.
- For module view, include it as descendant rollup unless within recipe mount
  limit.

Line/range source ref:

- Mount to anchor/source-slice when the region includes that detail.
- Otherwise mount to nearest visible file/module ancestor and preserve the
  exact matched ref.

Multi-file Recipe:

- Mount to lowest common ancestor.
- Preserve all matched refs.
- If refs cross repo boundaries, mount to space and mark cross-repo.

Stale/renamed refs:

- Use `newPath` only when it can be validated.
- Otherwise surface stale/renamed diagnostic.

Large project:

- Return region and rollups, not whole tree.
- Require follow-up recipe-map query or graph query for deeper structure.

## Acceptance Criteria

1. `alembic_graph` is the complete public MCP surface for pure ProjectContext
   information.
2. `alembic_graph` covers `space`, `repo`, `map`, `module`, `module-layers`,
   `file-flow`, `file-symbols`, `source-slice`, and `anchor-range`.
3. `alembic_graph` returns no Recipe content and no Recipe-derived scores,
   mounts, ids, summaries, or relation chains.
4. `alembic_graph` no longer uses `ProjectKnowledgeContextLayer` as the public
   output envelope.
5. `alembic_graph` public schema is ProjectContext `queryKind`, not the old
   five-operation graph router contract.
6. Public recipe-map tool name is `alembic_recipe_map`; it is the higher-level
   navigational Recipe projection above `alembic_graph`.
7. `alembic_project_matrix` is deleted from public discovery and not kept as a
   second live public MCP tool.
8. `alembic_project_matrix` is not kept as a compatibility alias for
   `alembic_recipe_map`.
9. Graph and recipe map are removed from the generic KnowledgeContext output
   route.
10. `alembic_recipe_map` returns bounded ProjectContext-backed region structure
    plus Recipe mounts and rollups.
11. Graph and recipe map share compatible ProjectContext refs and region
    semantics.
12. Top-level recipe map returns global no-code architecture/design Recipes and
   lower-level rollups, not all Recipes.
13. Module/file/anchor recipe map returns local direct mounts plus bounded
   ancestor and descendant rollup context.
14. Recipe mounting uses `recipe_source_refs`, `sourceRefs`,
   `reasoning.sources`, and explicit metadata; it does not use semantic or
   keyword search.
15. Code-pointed Recipes mount to the deepest resolvable ProjectContext node or
   nearest visible ancestor in the returned region.
16. Multi-ref Recipes mount to the lowest common ancestor.
17. No-code Recipes are not guessed into global scope without explicit metadata.
18. Stale, renamed, unresolved, and outside-scope refs are reported as
    diagnostics.
19. Full Recipe detail remains in `alembic_search`.
20. `alembic_search operation=get` supports id/ref/detailRef single Recipe
    detail output for Agent use and replaces the old single Recipe query MCP
    surface.
21. `alembic_knowledge operation=get` or any equivalent legacy single Recipe
    query tool is not visible or recommended as an Agent-facing detail lookup.
22. Core has a RecipeContext-style lower module for Recipe read models,
    source refs, filters, keyword/vector/semantic retrieval, and prime semantic
    blocks.
23. Recipe/vector/semantic retrieval logic is not implemented inside MCP
    handlers or a middle output layer.
24. Semantic task-to-Recipe selection remains in `alembic_prime`.
25. The four MCP tools have independent schemas, handlers, output schemas,
    descriptions, tests, and examples.
26. No four-tool handler calls another MCP tool handler/router as its
    implementation.
27. `ProjectKnowledgeContextLayer`, `KnowledgeContextOutputProjector`,
    `RetrievalPlanner`, freshness/snapshot orchestration, and
    `KnowledgeContextToolOutput` are not in the public output path for graph,
    recipe map, search, or prime.
28. Each of the four tools is a clean query function: retrieve allowed data,
    organize it for its own purpose, and return a dedicated Agent-facing
    structure.
29. Four-tool descriptions, tool catalog, onboarding guidance, host guidance,
    resident mirrors, and skill text use the same role and vocabulary model.
30. Runtime proof covers graph ProjectContext classes, recipe-map top-level,
    module/file, anchor, stale-ref, graph drilldown, search detail retrieval,
    and prime task-to-Recipe positioning.

## Per-Phase Real-Code Landing Detail

Code-fact verified 2026-06-13 against AlembicCore `2823939` and AlembicPlugin
`1256b1d`. This section makes each GMAP phase concrete against the real tree.

### Corrections To The Earlier Design Sections

Three facts differ from the earlier prose and govern the phases below:

1. **ProjectContext already exists and is complete.** `ProjectContextService`
   exposes a single `execute(request)` entry
   (`AlembicCore/src/service/project-context/ProjectContextService.ts:31-45`)
   over 9 implemented handlers (space / repo / map / module / module-layers /
   file-flow / file-symbols / source-slice / anchor-range), with a contract at
   `src/domain/project-context/ProjectContextContracts.ts:46-79`, stable
   `ProjectContextRef` ids carrying `scope.range` (file:line) at
   `src/domain/project-context/ProjectContextRefs.ts:57-65`, and `interface/`
   pruning + redaction. It is a filesystem-driven projection that does NOT call
   source-graph / project-intelligence / AST, so it is unaffected by graph
   breakage. GMAP-1 connects graph to it; it is not a from-scratch build.
2. **`alembic_graph` today lives in `structure.ts` and does NOT go through the
   middle layer.** `graphQuery/graphImpact/graphPath/graphStats/
   graphNeighborhood` are in
   `AlembicPlugin/lib/runtime/mcp/handlers/structure.ts`, routed by
   `tool-router.ts routeGraphTool()`, and return a direct `envelope(...)` —
   they are NOT projected through `ProjectKnowledgeContextLayer` /
   `KnowledgeContextToolOutput` (this corrects the "graph projected through the
   generic envelope" lines in Functional Structure Re-Review and Problem). But
   graph also does NOT use ProjectContext yet (it reads ModuleService cache /
   legacy structure). GMAP-1's real work is repointing `structure.ts` graph*
   onto `ProjectContextService.execute()` and giving graph its own
   ProjectContext output schema.
3. **Core Recipe read/query is an INTERNAL export, not a public facade.**
   `KnowledgeService` (`src/service/knowledge/KnowledgeService.ts:89-1278`) and
   peers are exported only via `src/service/knowledge/index.ts` for internal
   use. GMAP-2 RecipeContext is the NEW public `@alembic/core/recipe-context`
   facade; do not expose `KnowledgeService` directly to the Plugin.

### GMAP-0 Baseline Inventory — anchor map

| Surface | Real anchor (file) | Status |
| --- | --- | --- |
| ProjectContext entry | `Core src/service/project-context/ProjectContextService.ts:31-45` | exists, complete |
| ProjectContext contract/refs | `Core src/domain/project-context/ProjectContextContracts.ts`, `ProjectContextRefs.ts` | exists |
| graph handler | `Plugin lib/runtime/mcp/handlers/structure.ts` (graph*) + `tool-router.ts routeGraphTool` | exists, direct-envelope, NOT on ProjectContext |
| project_matrix | `Plugin handlers/project-matrix.ts:46-110` + `service/project-knowledge-context/project/ProjectMatrixProvider.ts:76-80` + `tools.ts:148-157` | exists, to delete |
| recipe_map | — | ABSENT, to build |
| middle layer | `Plugin service/project-knowledge-context/layer/{ProjectKnowledgeContextLayer,KnowledgeContextOutputProjector,KnowledgeContextInputNormalizer,RetrievalPlanner,ContextIndexSnapshot}.ts` | exists, consumed by project-matrix + prime (+ search partially), to remove |
| unified envelope | `Plugin service/.../contracts/KnowledgeContextToolOutput.ts:1-150` (tool enum = matrix/search/graph/prime) | exists, to retire for the 4 tools |
| Recipe read/query | `Core KnowledgeService.ts:89-1278`, `RecipeParser.ts`, `RecipeCandidateValidator.ts` | exists, internal export |
| recipe_source_refs | `Core repository/sourceref/RecipeSourceRefRepository.ts:34-154` (findByRecipeId/findBySourcePath/findByStatus/findStale/findOne/upsert) + table `schema.ts:406-416` | exists |
| recipe semantic regions | `Core service/vector/RecipeRegionVectorIndex.ts` (9 region classes) | exists |
| vector/search | `Core VectorService.ts`, `SearchEngine.ts`, `HybridRetriever.ts`, `MultiSignalRanker.ts` | exists |
| Plugin retrieval providers | `Plugin service/project-knowledge-context/retrieval/{SearchProvider,RecipeCandidateProvider,VectorRerankProvider,KnowledgeDetailProvider,ContextExpansionProvider,RecipeRelationChainProvider,KnowledgeRetrievalProvider}.ts` | exists, to SINK into Core RecipeContext |

### GMAP-1 Graph → ProjectContext

- Reuse: `ProjectContextService.execute()` (all 9 kinds), `ProjectContextRef`
  stable ids + ranges. No Core build needed.
- Build/change (Plugin): repoint `structure.ts` graph* to call
  `ProjectContextService.execute()` per `queryKind`; map graph `queryKind`
  1:1 onto the 9 ProjectContext kinds; derive `path/impact/neighborhood/stats`
  from `envelope.refs` + relations; give graph a dedicated `AlembicGraphOutput`
  schema (Recipe-free). Keep old `operation` only as handler-boundary
  normalization.
- Risk: `structure.ts` also owns non-graph duties (`getTargets`,
  `getTargetFiles`, `getTargetMetadata`) — migrate ONLY the graph* surface;
  prove the ModuleService-cache facts graph returns today are covered by
  ProjectContext (or report a ProjectContext gap rather than fall back).

### GMAP-2 Core RecipeContext (new public facade)

- Reuse: `KnowledgeService` read paths (get/list/search,
  `KnowledgeService.ts:256-492`), `RecipeSourceRefRepository`,
  `RecipeRegionVectorIndex`, `VectorService`, `SearchEngine`, `HybridRetriever`,
  `MultiSignalRanker`, `RecipeParser`.
- Build (Core): new `src/service/recipe-context/` + `src/domain/recipe-context/`
  mirroring the ProjectContext shape — `RecipeContextService.execute()`,
  `RecipeContextRequest/Envelope/Ref`; new public export
  `@alembic/core/recipe-context`. Sink the Plugin `retrieval/*` provider logic
  here: id/ref/detail lookup, metadata filters (category/dimension/scope/tags/
  language/knowledgeType/moduleName), keyword + vector/semantic matching, prime
  semantic blocks, batch source-ref lookup, deterministic not-found / ambiguous
  / stale-ref / unresolved results.
- Risk: keep lifecycle/create/submit OUT of RecipeContext (stays in
  KnowledgeService); RecipeContext is read/query only. Vector/semantic access
  goes through the injected `EmbedProvider` (so the GMAP-L local lane powers it
  transparently).

### GMAP-3 Shared Region Builder

- Reuse: ProjectContext envelopes already yield bounded regions
  (space/repo/map/module/file/anchor) with `refs` + `parentRef` chains.
- Build: an internal `ProjectContextRegion` projection (shape already in the
  Public/Output Contract above) shared by graph and recipe-map; derive
  breadcrumb/rollup from `ProjectContextRef.parentRef`; it is a projection, not
  a new data source. Ref round-trip is free because `ProjectContextRef.id` is
  already a stable id.
- Risk: do not call the public `alembic_graph` MCP tool as a subprocess (the
  earlier doc warns this) — call ProjectContextService / the region projection
  directly.

### GMAP-4/5/6/7 Recipe Map + Mounting

- Delete (Plugin): `handlers/project-matrix.ts`,
  `project-knowledge-context/project/ProjectMatrixProvider.ts`,
  `ProjectMatrixInput` schema, the `alembic_project_matrix` catalog entry
  (`PluginToolSurfaceCatalog.ts`) + `tools.ts:148-157` registration +
  `routeProjectMatrixTool`, and the matrix guidance.
- Build (Plugin): `handlers/recipe-map.ts` + a `RecipeMapProvider` over the
  GMAP-3 region projection + RecipeContext source-ref mounting; `routeRecipeMapTool`;
  `alembic_recipe_map` catalog entry; `AlembicRecipeMapInput` +
  `AlembicRecipeMapOutput` (dedicated schema, NOT KnowledgeContextToolOutput).
- GMAP-5 reuse: `RecipeSourceRefRepository` is ready; add batch lookup by
  path-prefix/module/file/line-range if missing; `newPath`/renamed
  revalidation is the one gap (SourceRefReconciler may own it — confirm).
- GMAP-6 mount engine (new, deterministic): collect → normalize → region →
  select-target per the four-stage rules above. CRITICAL: mounting uses
  `recipe_source_refs` + explicit metadata ONLY — it must NOT call
  VectorService/semantic, even though that infra is right there; lowest-common-
  ancestor uses `ProjectContextRef.parentRef`.

### GMAP-8 Remove The Middle Layer + Make Four Tools Independent

- Delete (Plugin): the whole `service/project-knowledge-context/layer/`
  (`ProjectKnowledgeContextLayer.ts:35-107`, `KnowledgeContextOutputProjector`,
  `KnowledgeContextInputNormalizer`, `ContextIndexSnapshot`, `RetrievalPlanner`)
  and retire `KnowledgeContextToolOutput` as the four tools' public envelope.
- Build: per-tool input-normalize + output-projection inside each handler, plus
  a small shared output-primitives module (`ToolStatus/Diagnostic/Ref/Limit/
  NextAction/source-evidence`) — primitives, not an orchestrator.
- Prime decoupling is here and is the largest change: `agent-public-tools.ts`
  prime (`:375-457`) currently calls `defaultProjectMatrixProvider.resolveMatrix`
  + `defaultProjectGraphProvider.resolveProjectGraph` + the middle-layer
  `resolvePrimeContext`, and depends on `alembic_intent`. GMAP-8 removes those
  cross-tool/intent dependencies so prime reads RecipeContext semantic blocks
  directly (aligns with the separate prime-output-quality / APQ design).
- Risk: HIGH — four-tool output consistency now rests on the shared primitives,
  not a central projector; sequence GMAP-8 after recipe-map (GMAP-4-7) lands.

### GMAP-9 Tests And Runtime Proof — resident mirror

- Add: the Alembic main resident mirror
  (`Alembic/lib/shared/schemas/mcp-tools.ts` + `lib/resident/tool-handlers/*`)
  must expose the same four public names/schemas/descriptions; confirm whether
  it mirrors `project_matrix`/`graph` today and synchronize the rename/removal
  there in the same wave (the earlier doc lists this surface).
- Otherwise the GMAP-9 test/runtime list above stands; run on BOTH shells.

### Real Test Project And Data Baseline (user-confirmed 2026-06-13)

Primary real test project: the `AlembicWorkspace` folder path itself
(`/Users/gaoxuefeng/Documents/AlembicWorkspace`), which maps to ghost
workspace `~/.asd/workspaces/ecf32806`. The user confirms it already holds
enough generated Recipe AND vector data to exercise the four tools directly,
so GMAP-9 / GMAP-L5 do not need a cold-start build. Read-only confirmed: 149
knowledge entries (142 active; 107 pattern / 29 rule / 13 fact).

Per-tool fixtures on this project:

- `alembic_graph`: directly testable — ProjectContext reads the real file
  tree, independent of Recipe/vector state.
- `alembic_search` (keyword), `alembic_recipe_map` (metadata-scope mounts),
  `alembic_prime` (Recipe pool): the 149 active Recipes suffice.
- Semantic lane (`search` semantic, `prime` semantic blocks, and the GMAP-L
  local Ollama lane): runs against this project's existing vector data; where
  a fresh index is wanted, rebuilding it with the local Ollama lane over these
  149 Recipes is the natural first proof (covers GMAP-2 / L4 + L5 at once).
- `alembic_recipe_map` source-ref code mounting: if this project's Recipes are
  mostly governance / no-code, exercise deep code mounting on a source-ref-rich
  sibling (e.g. BiliDili, or Alembic / AlembicPlugin which carry large source
  graphs) at the controller's choice.

Honest note (not a blocker): a read-only SQLite probe of ecf32806 showed
`recipe_source_refs` and vector counts as 0 and found no `.hnsw/.vec` index
files — but the user reports the data IS present and that ecf32806 may carry a
small counting/display bug, so SQLite-direct numbers are NOT authoritative.
GMAP-0 / GMAP-L0 must confirm the real usable data through actual MCP tool
calls (not SQLite reads); if a genuine source-ref / vector count bug surfaces,
record it as a side finding without blocking the four-tool work.

### GMAP-L Hook Into RecipeContext

The local-embedding lane (Supplement below) injects into
`VectorService.embedProvider`; RecipeContext's vector/semantic queries consume
it transparently, so GMAP-L lands behind GMAP-2 without touching the four-tool
contracts.

## Supplement — Local Qwen Embedding Integration

Added 2026-06-17 by user request. This supplement extends the four-tool demand
with a local semantic-vector capability. It is code-fact verified against
AlembicCore `2823939` and AlembicPlugin `1256b1d`.

### Motivation And Boundary

Today the semantic lane that powers `alembic_search`, `alembic_prime`, and (on
the new design) `alembic_recipe_map` candidate ranking is served by the Alembic
resident daemon over HTTP (`/api/v1/search`, `/api/v1/task`, authenticated with
`x-alembic-daemon-token`). When the daemon is not running, the Plugin process
has no embedding executor and degrades to keyword-only baseline search
(`VectorModule` states the Plugin does not maintain an executable embedding
provider). So a codex / Claude Code user without the Alembic daemon gets no
semantic capability at all.

The goal of this supplement: let the user run a **local Qwen embedding model
through Ollama** so AlembicPlugin + AlembicCore can obtain semantic vectors via
a local HTTP endpoint, as a real semantic lane that does NOT depend on the
Alembic resident daemon. This is an added capability, not a change to the
four-tool query contracts; the four tools keep their schemas and remain pure
query projectors. The only thing that changes is where the vectors behind the
semantic lane come from.

User-decided route (2026-06-13): the local lane calls the user's local Ollama
embeddings endpoint (`POST http://localhost:11434/api/embeddings`, or the
batch `/api/embed`) with a Qwen embedding model (e.g. a `qwen3-embedding`
variant). Nothing bundles a model or a native inference runtime; the
EmbedProvider behind this lane is a lightweight HTTP client (plain `fetch`, no
native dependency). The user installs and pulls the model in Ollama; the plugin
only detects endpoint + model availability. This is the first path; a bundled
or in-process runtime can be added later behind the same `EmbedProvider`
contract without touching the four tools.

This supplement does NOT replace the resident lane; it adds a parallel local
lane and a provider-selection order. RecipeContext (GMAP-2) and prime
(`recipe_region_*` semantic blocks) consume the selected embedding provider
without knowing which lane produced it.

### Verified Landing Points (real code today)

- **Core is injection-based and self-contained.** `EmbedProvider` is a
  one-method interface — `embed(texts: string | string[]): Promise<number[] |
  number[][]>` (`AlembicCore/src/service/vector/VectorService.ts:39-41`). Core
  never produces vectors itself; it stores/retrieves vectors a host-supplied
  provider returns. Core's vector/search has zero HTTP/external/resident
  dependency (pure-JS HNSW + BM25 + RRF). `VectorServiceConfig.embedProvider`
  is nullable and `VectorStats.embedProviderAvailable` already expresses
  presence; absence degrades gracefully (the module's stated design principle).
- **Dimension is auto-detected and migratable.** The vector dimension is set on
  first upsert (no hardcoded value); switching to a different-dimension model is
  handled by `VectorService.migrateDimension()` (clear → swap provider → full
  rebuild). A local Qwen model (e.g. 1024-dim) therefore needs an index rebuild,
  not a Core schema change.
- **Recipe semantic blocks already route through the same provider.**
  `RecipeRegionVectorIndex.ts` builds `recipe_region_*` chunks across nine
  region classes and embeds them via `VectorService → embedProvider`. A local
  provider automatically powers prime's semantic regions too.
- **`@alembic/core/vector` already exports the injection point** (`EmbedProvider`,
  `createVectorService`, `VectorService`, `BatchEmbedder` with
  `getEmbeddingCapacityHint()`). No Core architecture change is required to add a
  local provider — only a concrete `EmbedProvider` implementation plus the local
  inference runtime behind it.
- **Plugin has a first-run install seam.** `SetupService` already initializes
  the `.asd/` runtime dir and `config.json`; this is the natural place to detect,
  download, and record a local model. The Plugin DI (`VectorModule`) is where the
  provider is injected today.
- **Agent provider slot is for LLM-API embeddings, not local inference.**
  `AiProvider.embed()` / `supportsEmbedding()` exist but route through the LLM
  gateway; the local Qwen capability should implement the Core `EmbedProvider`
  contract directly (minimal surface), not the Agent provider.

### Provider Selection Order (the real change)

```text
semantic lane provider resolution (default = local-first, user-decided 2026-06-13):
  1. local Qwen lane    — EmbedProvider over the user's local Ollama endpoint
                          (NEW; no Alembic dependency; DEFAULT when detected)
  2. resident lane      — HTTP Alembic daemon (existing; used when Ollama is
                          absent or disabled)
  3. baseline keyword   — no embedding; degraded diagnostics (existing)
```

- Local-first is the default per the user decision; an explicit override may
  still pin resident or disable the local lane per project.
- Each lane reports honest availability so the four tools' `diagnostics`
  surface which lane answered and why a higher lane was skipped (e.g. Ollama
  not running, model not pulled).
- The local and resident lanes will generally have different vector
  dimensions, so switching the active lane triggers `migrateDimension()`; the
  same index must not mix dimensions. A project should pick one active lane and
  rebuild on change rather than blend.

### Repository Responsibilities

| Repo | Owns |
| --- | --- |
| AlembicCore | The `EmbedProvider` contract (exists), a local-first provider-selection/fallback helper, dimension-migration on lane switch, and a lightweight `OllamaEmbedProvider` (plain `fetch` to the local Ollama endpoint, implements `EmbedProvider`) behind `@alembic/core/vector`. No native inference dependency enters Core. |
| AlembicPlugin | Ollama availability detection (endpoint + model pulled), config (enable flag, endpoint URL, model name, lane order), DI injection of the selected provider into `VectorModule`, host-shell wiring for codex + Claude Code, and the user-facing install/setup guidance (how to install Ollama and `ollama pull` the Qwen embedding model). |
| AlembicAgent | No change required; its LLM-API embedding slot is out of scope. |
| User | Installs Ollama and pulls the Qwen embedding model (guided by the plugin docs); nothing is bundled or auto-downloaded by the plugin in this first path. |

### GMAP-L Phase Sequence (local embedding sub-line)

GMAP-L runs in parallel with GMAP-2 (Core RecipeContext) since both touch the
Recipe/vector retrieval boundary; it must land before GMAP-9 runtime proof so
the local lane is validated on both shells.

- **GMAP-L0 — Inventory & confirm**: confirm the verified landing points on the
  current heads; the route is fixed (Ollama, user-installed, plugin-detect,
  local-first) — no further selection needed.
- **GMAP-L1 — Core `OllamaEmbedProvider` & selection**: a lightweight
  `OllamaEmbedProvider` implementing the existing `EmbedProvider` (`fetch` to
  `/api/embeddings` or `/api/embed`, batch-aware, timeout + honest error);
  a local-first provider-selection/fallback helper; dimension-migration on lane
  switch; availability/diagnostics surface. No new Core source-of-truth and no
  native dependency.
- **GMAP-L2 — Ollama detection & install guidance**: probe endpoint reachability
  and model presence (e.g. `/api/tags`) and a one-shot embed smoke; write the
  user-facing setup guidance (install Ollama, `ollama pull <qwen-embedding>`,
  configure endpoint/model). No model download or packaging by the plugin.
- **GMAP-L3 — Plugin config & injection**: config fields (enable flag, endpoint
  URL, model name, `laneOrder` defaulting local-first), `VectorModule` DI of the
  Ollama provider, host env vars (e.g. `ALEMBIC_LOCAL_EMBEDDING_ENABLED`,
  `ALEMBIC_OLLAMA_ENDPOINT`, `ALEMBIC_OLLAMA_EMBED_MODEL`), codex + Claude Code
  shell wiring.
- **GMAP-L4 — Index build/migration**: build/migrate the Recipe + recipe-region
  vector indexes at the Qwen model's dimension; prove `migrateDimension()`
  rebuild is clean and that the keyword baseline still works when Ollama is
  absent/disabled.
- **GMAP-L5 — Dual-host real proof**: on both codex and Claude Code shells, with
  the Alembic resident daemon STOPPED and Ollama running, prove `alembic_search`
  / `alembic_prime` (and recipe-map ranking) return real semantic results via
  the local Ollama lane with honest diagnostics; then prove stopping Ollama
  degrades cleanly to keyword baseline (never a hard failure).

### Non-Goals

- Do not change the four-tool public query contracts; this only changes the
  embedding source behind the semantic lane.
- Do not remove the resident lane; with local-first it becomes the fallback /
  explicit override when Ollama is absent or disabled.
- Do not put the local lane in the Agent LLM provider path; it is a Core
  `EmbedProvider` over a local HTTP endpoint.
- Do not add a native inference dependency or bundle/auto-download a model in
  this first path; the provider is a plain HTTP client and the user owns the
  Ollama install + model pull (respects the MPB lightweight-shell rule).
- Do not make Ollama mandatory; absence must degrade to keyword baseline with
  honest diagnostics, never a hard failure.
- Do not blend dimensions in one index; switching the active lane rebuilds via
  `migrateDimension()`.

### Resolved User Decisions (2026-06-13)

1. **Local inference runtime** — call the user's local **Ollama** endpoint
   (`/api/embeddings` / `/api/embed`) for Qwen embeddings. This is the first
   path ("先按现在的实现路径，后续再优化"); an in-process or bundled runtime can
   be added later behind the same `EmbedProvider` contract. No native inference
   dependency (transformers.js / onnxruntime / llama.cpp) is added now.
2. **Model acquisition** — the user installs Ollama and pulls the Qwen
   embedding model, guided by the plugin's setup docs. The plugin does not
   download or bundle the model.
3. **Install layer** — user-side install; the **plugin only detects** Ollama
   endpoint + model availability and injects the provider. The
   `OllamaEmbedProvider` itself is a lightweight HTTP client in Core (no native
   dependency), keeping Core's pure-JS self-contained property.
4. **Default lane order** — **local-first**: when the Ollama lane is detected it
   is used by default; resident is the fallback/override; keyword baseline is
   the final degrade. The user may override per project.

## Controller Intake Recommendation

Create one implementation demand for the final four-tool MCP optimization:
`alembic_graph` ProjectContext rebuild, `alembic_recipe_map` replacement of
`alembic_project_matrix`, and four-tool MCP layer consolidation.

Recommended owner:

- AlembicPlugin for graph, recipe-map, search, and prime MCP schemas, handlers,
  output, guidance, public tests, public descriptions, and the retired matrix
  route.
- AlembicCore for the Core RecipeContext lower module, Recipe read/query APIs,
  source-ref normalization, keyword/vector/semantic retrieval boundaries, the
  `EmbedProvider` selection/fallback helper, and any missing ProjectContext
  bounded-region helper.
- AlembicPlugin additionally for the local-embedding first-run install, config,
  provider injection, and dual-host wiring (GMAP-L).

Recommended phase order:

1. GMAP-0 baseline inventory;
2. GMAP-1 graph ProjectContext rebuild;
3. GMAP-2 Core RecipeContext foundation;
4. GMAP-3 shared region builder;
5. GMAP-4 tool rename and recipe map contract;
6. GMAP-5 Recipe source-ref adapter;
7. GMAP-6 mount engine;
8. GMAP-7 recipe map output projector;
9. GMAP-8 four MCP tool layer consolidation;
10. GMAP-9 tests and runtime proof.

Local-embedding sub-line (parallel with GMAP-2, lands before GMAP-9):

11. GMAP-L0 inventory & decision freeze;
12. GMAP-L1 Core provider contract & selection;
13. GMAP-L2 local inference runtime & model packaging;
14. GMAP-L3 Plugin install, config & injection;
15. GMAP-L4 index build/migration;
16. GMAP-L5 dual-host real proof (resident daemon stopped).
