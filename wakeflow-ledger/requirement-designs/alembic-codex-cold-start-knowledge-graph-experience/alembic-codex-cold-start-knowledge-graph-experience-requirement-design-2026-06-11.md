# Alembic Codex Cold Start Knowledge Graph Experience Requirement Design

Status: confirmed / user-authorized / controller-intake-ready / code-fact verified 2026-06-12 / design supplement confirmed 2026-06-12
Date: 2026-06-11 (code-fact verification and design supplement 2026-06-12)
Design Key: alembic-codex-cold-start-knowledge-graph-experience
Primary Product Windows: AlembicPlugin, AlembicCore
Related Product Windows: Alembic, AlembicDashboard, AlembicAgent
Validation Surface: AlembicWorkspace controller and Test when assigned

## Problem

The user wants to use AlembicPlugin directly inside Codex to cold-start a
project, create a usable Alembic knowledge base, and then let Codex use project
syntax / source relationship capabilities to produce better Recipes.

Current behavior has the right building blocks but not yet the desired product
experience:

- AlembicPlugin exposes `alembic_bootstrap`, but the user experience is still a
  tool-level workflow rather than a clean Codex onboarding loop.
- The current host-agent bootstrap performs deterministic project intelligence
  scanning and returns Mission Briefing, but the follow-up Recipe production loop
  must be made explicit, reliable, recoverable, and observable.
- Source graph capabilities exist as a design direction and partial runtime
  surface, but they must become a first-class fact layer for Codex: syntax,
  symbols, source ranges, callers/callees, impact, affected tests, freshness, and
  validation hints.
- Recipe creation must remain an agent judgement layer. Source graph facts should
  improve evidence quality; they must not replace the semantic decision of what
  deserves to become reusable project knowledge.

## Goal

Make AlembicPlugin a complete Codex-facing cold-start experience:

1. A Codex user can ask Alembic to initialize knowledge for the current project.
2. AlembicPlugin can report whether the project is uninitialized, initialized,
   graph-indexed, knowledge-ready, stale, degraded, or blocked.
3. Cold start builds the project source graph / project intelligence baseline and
   returns a staged Mission Briefing flow: a tool-capability briefing, a current
   domain SOP package, and recoverable bootstrap state that tell Codex which
   tools, gates, and evidence rules to use for the current Recipe domain.
4. Codex can use graph tools to inspect real project syntax relationships before
   and during Recipe production.
5. Knowledge creation is measurable: submitted Recipe candidates, completed
   dimensions, source evidence coverage, and remaining gaps are visible.
6. After bootstrap, Codex can use `intent`, `prime`, `search`, `structure`,
   source graph tools, Guard, and Decision Register in one coherent lifecycle.
7. Incremental rescan keeps the source graph and Recipe evidence honest as the
   project changes.

The end result is not a thin minimum loop. It is a full feature path from
market/plugin startup to real Codex usage, source relationship querying,
knowledge creation, and post-bootstrap maintenance.

## Non-goals

- Do not replace Recipe generation with an automatic graph-to-Recipe converter.
- Do not remove existing Recipes, Guard, Decision Register, Dashboard, daemon,
  or API-AI job capabilities.
- Do not keep old broken MCP fields for compatibility without a current consumer.
- Do remove stale or overlapping Codex-facing MCP tool routes when the CKG
  source relationship catalog provides a cleaner replacement.
- Do not treat source graph freshness as proof of correctness. Tests, Guard,
  runtime probes, or Test-window validation still own acceptance evidence.
- Do not make Wakeflow state roots or unattended dispatch part of ordinary
  AlembicPlugin runtime behavior.
- Do not hide cold-start failures behind generic success messages.

## Current Architecture Baseline

Current code-fact baseline from local inspection:

- `AlembicPlugin/lib/codex/mcp/McpServer.ts` owns the Codex MCP runtime entry,
  requires a trusted project root, initializes Plugin bootstrap components, and
  routes `alembic_bootstrap` to the host-agent cold-start workflow.
- `AlembicPlugin/lib/codex/mcp/host-agent-workflows/cold-start.ts` owns the
  Codex host-agent cold-start orchestration. It performs full reset policy,
  runs Core project intelligence, builds a project snapshot, creates a host-agent
  workflow session, and returns Mission Briefing.
- `AlembicCore/src/workflows/capabilities/project-intelligence` owns reusable
  project intelligence facts: file discovery, AST, entity graph, call graph,
  dependency graph, Guard audit, target metadata, and panorama-style context.
- `AlembicCore/src/workflows/capabilities/host-agent` owns Mission Briefing and
  host-agent session support.
- `alembic_dimension_complete` binds later agent submissions to the active
  bootstrap session and dimensions.
- `alembic_codex_bootstrap` and HTTP job bootstrap are explicit daemon/job paths,
  but the default Codex route is host-agent-driven and does not require an
  Alembic AI provider.

Code-fact verification on 2026-06-12 (AlembicPlugin `7382c62`, AlembicCore
`ed42960`, Alembic resident surface `5decbd7`, AlembicDashboard `11c2c61`;
Plugin/Core/Dashboard trees clean, Alembic tree mid-flight on RC5 shared-asset
work that does not touch `lib/resident/`) confirmed all anchors above and
pinned these additional baseline facts:

- `McpServer.ts` refuses to start without `ALEMBIC_PROJECT_DIR` and routes
  `alembic_bootstrap` through `handlers/host-agent/bootstrap.ts` to
  `runHostAgentColdStartWorkflow` in `host-agent-workflows/cold-start.ts`.
- The current Mission Briefing is returned as one complete bundle from
  `presentHostAgentColdStartResponse`; no staged/domain-SOP logic and no
  `BootstrapPackage` (or equivalent state-contract type) exists yet. CKG1
  builds this from scratch on top of the existing session/briefing calls.
- AlembicCore already ships the durable source graph layer: migration
  `010_source_graph.ts` creates `source_graph_generations/files/symbols/edges`,
  and `src/service/source-graph/SourceGraphIndexer.ts` implements
  `buildFull()`, `buildIncremental()`, and `inspect()` with freshness states
  `fresh/stale/pending/degraded` and generation ids.
- The Plugin codex-local source graph tools are already wired to that durable
  layer: `dispatchCodexLocalTool` -> `buildSourceGraphOperation`
  (`lib/codex/mcp/source-graph/status.ts`) -> Core `SourceGraphService` +
  `SourceGraphRepositoryImpl` over `DatabaseConnection`.
- What is missing is lifecycle wiring, not storage or queries: nothing invokes
  the indexer during cold start (the 2026-06-11 live run left all four
  `source_graph_*` tables empty while project-intelligence Phase 1.6 wrote
  2214 `code_entities` rows), and no Ghost data-root / PathGuard allowance
  exists in the source-graph code path.
- The host-agent bootstrap session is process-local on both surfaces: Core
  `BootstrapSession` is an in-memory map behind the ServiceContainer with
  `SESSION_TTL_MS = 2h` and no disk/DB persistence or restart recovery; the
  Plugin holds the active session via `getActiveHostAgentWorkflowSession`.
  The Alembic daemon path additionally caches project analysis to disk via
  `cacheProjectAnalysisSession`, but submission tracking is still in-memory.
- Three real bootstrap entrypoints exist and define the CKG3 gate parity
  matrix: (1) Plugin Codex host-agent `alembic_bootstrap`; (2) Plugin daemon
  job HTTP `POST /bootstrap` in `lib/http/routes/jobs.ts`; (3) Alembic daemon
  `POST /api/v1/jobs/bootstrap` -> `DaemonJobRunner` ->
  `lib/resident/tool-handlers/cold-start.ts#bootstrapKnowledge`.

This baseline should not be discarded. The new demand should productize and
connect it.

## Controller Supplement: Staged Mission Briefing And Domain SOP Plan

The product repair is not replacing Mission Briefing. It is changing Mission
Briefing from one large project-information dump into a staged operating flow.
The first briefing tells Codex which Alembic tools exist, what each tool can and
cannot prove, how Recipes are judged, and which domain SOP to execute first.
After a domain is completed, Alembic returns the next domain SOP or a repair SOP.

Project architecture details should not be copied into a static briefing when a
tool can provide them. Mission Briefing should point Codex to the right tools
for source graph facts, existing knowledge, validation hints, Guard rules,
Dashboard/progress, and recovery state. The agent learns the project by using
those tools, not by trusting a stale generated paragraph.

`BootstrapPackage` remains useful only as a compact machine-readable state
contract: active session, tool catalog, domain queue, current SOP, gates,
progress, repair state, and artifact refs. It should not become the agent-facing
source of project architecture facts. If the implementation uses a different
local name, it must still provide the same testable state contract.

The closed loop is:

```text
status / health
  -> scope and storage readiness
  -> source graph readiness
  -> alembic_bootstrap tool briefing + bootstrap state + first domain SOP
  -> agent follows current domain SOP using Alembic tools for project facts
  -> relationship / knowledge / validation tool inspection
  -> alembic_submit_knowledge hard evidence + quality gate
  -> alembic_dimension_complete hard evidence + coverage gate
  -> next domain SOP or repair/rebuild SOP
  -> repeat until all required domains pass
  -> post-bootstrap prime/search/Guard/Dashboard
```

### Mission Briefing As Staged Domain SOP

Mission Briefing must be structured, but it should be staged. The initial
briefing is a short tool-and-gate orientation plus the first domain SOP. Each
later briefing is the next domain SOP, returned after the previous domain passes
or after a repair is needed. Required content across the briefing flow:

1. **Tool and runtime orientation**:
   selected project identity, source-root role, storage mode, active bootstrap
   session, wrong-scope blockers, reset/rebuild policy, and stop conditions.
   Architecture facts beyond identity and scope must be fetched through tools.
2. **Tool-to-information matrix**:
   for every visible relevant MCP tool, state what information it provides,
   when to call it, what inputs it needs, what evidence refs it returns, what it
   cannot prove, and how its output contributes to Recipe creation.
3. **Domain SOP**:
   one active domain or a small domain group at a time, with domain goal,
   recommended tool sequence, required source/graph/validation evidence,
   Recipe candidate expectations, rejection examples, and completion criteria.
4. **Recipe ontology**:
   define a Recipe as durable, reusable project knowledge for future agents,
   distinct from source graph facts. Name valid Recipe kinds such as coding
   standard, architecture boundary, workflow SOP, tool contract, validation
   rule, failure semantics, project convention, and reusable implementation
   pattern.
5. **Recipe creation SOP**:
   how Codex should move from tool observations to candidate judgement:
   gather source facts, verify relationships, identify reusable knowledge,
   reject generic observations, write rich guidance, attach evidence, submit
   candidates, and complete dimensions.
6. **Evidence and quality gates**:
   source refs, snippet matching, graph refs, relationship proof, validation
   hints, quality rubric, duplicate/shallow rejection, and exact failure codes.
7. **Repair and rebuild instructions**:
   how to rebuild rejected candidates, when to redo the domain analysis, when to
   fall back to targeted raw reads, and which stable error codes block progress.
8. **Next-domain handoff**:
   after `dimension_complete` passes, Alembic returns the next domain SOP or a
   final review SOP. The agent should not infer unseen domain work from the
   initial briefing.

The briefing should be readable enough that a fresh Codex agent can follow it
without already knowing Alembic internals, but concrete enough that a target
implementation can test each section.

### Tool-To-Information Matrix

The staged briefing must name tools by capability, not merely list them:

| Tool family | Information provided | How the agent uses it for Recipe creation |
| --- | --- | --- |
| `alembic_codex_status` / diagnostics | Runtime, project selection, initialization, storage, degraded state. | Decide whether bootstrap can start and whether failures are environment or project-scope problems. |
| `alembic_source_graph_status` | Source graph scope, freshness, generation, stale/partial/unsupported state. | Decide whether graph-backed code facts are trustworthy before making relationship claims. |
| `alembic_code_explore` | Broad source graph context, ranked symbols, source sections, relation hints. | Build a domain overview and identify likely Recipe-worthy project patterns. |
| `alembic_symbol_search` | Exact symbols/files/routes/anchors. | Locate concrete targets before source-node or relation queries. |
| `alembic_source_node` | One file/symbol/node with source ranges and direct edges. | Produce source-grounded examples and snippet evidence for candidate Recipes. |
| `alembic_callers` / `alembic_callees` | Directional call relationships for a known symbol. | Prove entrypoint, consumer, and call-chain claims in Recipes. |
| `alembic_code_impact` | Advisory changed-file or symbol impact. | Explain blast radius and future editing risk; never as acceptance evidence. |
| `alembic_validation_plan` | Advisory validation buckets and unknowns. | Add realistic validation guidance to Recipes and completion evidence. |
| `alembic_intent` / `alembic_prime` / `alembic_search` / `alembic_structure` | Existing project knowledge, standards, prior Recipes, structure metadata. | Avoid duplicate Recipes, connect new observations to existing knowledge, and distinguish code facts from project standards. |
| `alembic_code_guard` | Scoped compliance check after edits or concrete code proposals. | Validate future work against accepted Recipes; not a source graph substitute. |
| `alembic_submit_knowledge` | Candidate persistence path with evidence validation. | Submit only source-grounded, project-specific, useful candidates. |
| `alembic_dimension_complete` | Dimension coverage and checkpoint gate. | Close a domain only after verified candidate coverage, findings, and evidence quality pass. |

This table may be split into structured fields and rendered into the initial
tool briefing, but every domain SOP must reference the subset of tools needed
for that domain instead of repeating the whole catalog.

### Domain Decomposition For Cold Start

The briefing flow should not ask the agent to "make Recipes" generically. It
should divide analysis into domains and send one domain SOP, or one small
coherent domain group, at a time. Default domains may be adjusted by project
type, but the baseline should cover:

- **Runtime and entrypoints**: CLI/server/plugin entrypoints, MCP tools,
  daemon/job routes, app startup, user-triggered flows.
- **Source structure and ownership**: module boundaries, package exports,
  public API surfaces, generated/vendor/runtime-cache boundaries.
- **State and persistence**: data roots, sessions, checkpoints, stores, caches,
  migrations, candidate lifecycle.
- **Tool contracts and outputs**: MCP schemas, clean output fields, diagnostic
  versus public fields, error/problem taxonomy.
- **Validation and safety**: tests, scripts, smoke probes, Guard use,
  validation-plan hints, acceptance boundaries.
- **Failure and recovery**: wrong scope, stale graph, transport closure,
  partial parse, unsupported language, degraded runtime, resume after restart.
- **Project conventions**: coding style, helper patterns, logging, error
  handling, boundary comments, test organization.

Each domain should carry:

- recommended first tools and fallback raw-read strategy;
- minimum number and variety of Recipe candidates;
- evidence refs that must appear in candidates;
- examples of low-value observations that should be rejected;
- completion conditions for `alembic_dimension_complete`.

User-confirmed supplement (2026-06-12): the domain/dimension model must have a
single Core-owned source. One canonical dimension/domain catalog contract
defines ids, ordering, dependencies, variety expectations, and completion
rules; the resident `alembic_bootstrap` description, the Plugin briefing and
`domainQueue`, Dashboard `DIMENSION_EXECUTION_ORDER`, and dimension checkpoint
storage must all derive from it. CKG0 reconciles the current 8x3 / 17 / 23
divergence into this catalog; CKG1 consumes it and must not introduce a fourth
hand-maintained copy.

### Bootstrap State Contract

`alembic_bootstrap` must return enough structured state for tests and future
turns to prove the flow is real: active session, visible tool catalog, domain
queue, current domain SOP, hard gates, progress, repair instructions, and
artifact refs. This may be called `BootstrapPackage`, `BootstrapState`, or a
nearby local name, but it must stay compact and resumable.

The package must not try to carry all project architecture facts. It should
point Codex to the tools that provide those facts. The current domain SOP should
explain which tools to call first, which evidence is required, and where to
stop. Tests should prove the SOP is generated from structured state rather than
from disconnected static prompt text.

Required package sections:

- `project`: selected project identity, source-root role, storage mode, scope
  status, wrong-scope blockers, and reset/rebuild policy; no static project
  architecture summary beyond what is needed for routing and safety.
- `runtime`: Plugin runtime status, MCP transport status, daemon/job route
  availability, Dashboard handoff availability, and degraded-but-usable limits.
- `sourceGraph`: graph initialization state, generation id, freshness, indexed
  files/symbols/edges, stale files, partial parser reasons, and whether graph
  relationship claims are currently allowed.
- `toolCapabilities`: visible MCP tools grouped by purpose, each with a short
  description, required inputs, output trust level, freshness requirement,
  common failure codes, and when Codex should prefer direct source reads.
- `domainQueue`: ordered domain ids, dependencies, completion state, current
  domain id, and next-domain eligibility.
- `currentDomainSop`: readable SOP for the active domain or domain group,
  including tool choice, source graph readiness, evidence rules, Recipe
  ontology reminders, candidate quality rules, completion rules, and repair
  guidance.
- `promptPack`: scoped prompt/SOP templates for tool orientation, domain
  analysis, evidence collection, knowledge submission, dimension completion,
  repair/rebuild, next-domain handoff, and resume after MCP restart.
- `gates`: upfront hard requirements for scope, graph freshness, source
  evidence, relationship evidence, bootstrap session binding, dimension minimums,
  and staged-to-active knowledge visibility.
- `session`: stable `bootstrapSessionRef`, completed dimensions, pending
  dimensions, persisted candidate ids, recoverability state, and explicit resume
  instructions.
- `nextActions`: ordered operations that Codex can execute for the current
  domain only, including exact MCP tool choices and stop conditions.

Mission Briefing is required because Codex needs a readable operating guide.
However, the guide is staged. Tests should assert both the structured sections
and the consistency between the current domain SOP, tool catalog, gates, and
progress state.

### Bootstrap Concurrency And Single-Writer Lease

User-confirmed supplement (2026-06-12). Three real bootstrap entrypoints exist
(Plugin Codex host-agent `alembic_bootstrap`, Plugin daemon job
`POST /bootstrap`, Alembic daemon `POST /api/v1/jobs/bootstrap`), and MCP
processes can be started more than once. Without single-writer semantics, two
concurrent bootstraps can interleave the staged SOP queue and checkpoint
state. Requirements:

- a project-scoped bootstrap lease with holder identity, heartbeat, and an
  explicit takeover rule, persisted so it survives process restarts;
- all three entrypoints acquire the same lease before mutating bootstrap
  state; a second concurrent attempt is rejected with a stable busy/lease
  state or takes over only per the takeover rule;
- `alembic_codex_status` and bootstrap state expose the lease holder and the
  current bootstrap-in-progress state;
- failure semantics gain a `bootstrap_in_progress` (lease held) state distinct
  from `blocked`.

### MCP Tool Capability Catalog

The bootstrap package must describe the actual visible MCP tools from the active
tool surface. It must not advertise hidden tools, stale names, or future-only
routes. At minimum, the catalog must cover these groups when they are available:

- Cold-start lifecycle:
  `alembic_codex_status`, `alembic_codex_init`, `alembic_bootstrap`,
  `alembic_submit_knowledge`, `alembic_dimension_complete`.
  (Verified 2026-06-12: no `alembic_status` tool exists; discovery is
  `alembic_codex_status`, and the embedded surface health tool is
  `alembic_health`.)
- Code relationship tools:
  `alembic_source_graph_status`, `alembic_code_explore`,
  `alembic_symbol_search`, `alembic_source_node`, `alembic_callers`,
  `alembic_callees`, `alembic_code_impact`, `alembic_validation_plan`.
- Knowledge use after bootstrap:
  `alembic_intent`, `alembic_prime`, `alembic_search`,
  `alembic_structure`, `alembic_code_guard`, and Decision Register tools when
  enabled.
- Recovery and observability:
  status/health, rescan/catch-up, Dashboard handoff, job/session/event refs, and
  explicit degraded-state explanations.

Each code relationship tool description must tell Codex:

- what question the tool answers;
- which identifiers it accepts, such as file path, symbol, node id, or change
  set;
- what evidence refs it returns;
- whether results are facts, hints, validation suggestions, or diagnostics;
- what to do when graph state is stale, partial, unsupported, or wrong-scope.

`alembic_validation_plan` must be described as a validation hint generator, not
as acceptance. `alembic_code_impact` must be described as advisory until
representative repository checks run. Standalone `alembic_affected_tests` should
be removed from the Codex-facing catalog after its behavior is folded into
`alembic_validation_plan`, unless a current external consumer blocks removal.

### Current Tool Surface Relationship And Cleanup Classification

Current code already has multiple MCP tool layers. CKG0 must inventory these
against live `tools/list`, schema registration, handler routing, output
projection, tests, skills, and non-test code references before CKG1 or CKG4
changes visibility.

Observed code anchors, re-verified 2026-06-12 at Plugin `7382c62` / Core
`ed42960`:

- `AlembicPlugin/lib/codex/ToolPolicy.ts:129-139` defines
  `CODEX_SOURCE_GRAPH_TOOL_NAMES` with exactly nine source graph tools:
  `alembic_source_graph_status`, `alembic_symbol_search`,
  `alembic_code_explore`, `alembic_source_node`, `alembic_callers`,
  `alembic_callees`, `alembic_code_impact`, `alembic_affected_tests`,
  `alembic_validation_plan`.
- `AlembicPlugin/lib/codex/mcp/PluginToolSurfaceCatalog.ts` classifies those
  tools as `owner: codex-local`, `handlerOwner: CodexMcpServer.local`, and
  `knowledgeGate: cold-start`. The full catalog has 40 tools: 18 codex-local
  (the nine source graph tools plus `alembic_codex_status`,
  `alembic_codex_diagnostics`, `alembic_codex_init`,
  `alembic_codex_dashboard`, `alembic_codex_bootstrap`,
  `alembic_codex_rescan`, `alembic_codex_job`, `alembic_codex_stop`,
  `alembic_codex_cleanup`) and 22 plugin-embedded-core tools (`alembic_intent`,
  `alembic_prime`, `alembic_work_start`, `alembic_work_finish`,
  `alembic_code_guard`, `alembic_decision_record`, `alembic_health`,
  `alembic_search`, `alembic_knowledge`, `alembic_structure`,
  `alembic_graph`, `alembic_call_context`, `alembic_guard`,
  `alembic_submit_knowledge`, `alembic_project_skill`, `alembic_bootstrap`,
  `alembic_rescan`, `alembic_evolve`, `alembic_consolidate`,
  `alembic_dimension_complete`, `alembic_panorama`,
  `alembic_knowledge_lifecycle`).
- `AlembicCore/src/domain/source-graph/SourceGraphContracts.ts:95-105` defines
  `SOURCE_GRAPH_OPERATION_KINDS`: `status`, `search`, `explore`, `node`,
  `callers`, `callees`, `impact`, `affected-tests`, and `validation-plan`.
- `AlembicPlugin/lib/codex/mcp/tools.ts:231-252` still exposes legacy
  `alembic_graph` and `alembic_call_context`; the `alembic_call_context`
  description advertises `callers / callees / impact / both`, directly
  overlapping the canonical callers/callees/impact tools — exactly the
  double-route confusion this classification removes.
- There is no `alembic_status` tool; design, SOP, and briefing text must use
  `alembic_codex_status` (discovery) and `alembic_health` (embedded surface).
  The Decision Register tool's real name is `alembic_decision_record`.

Controller classification before implementation:

| Tool or family | Current role | Classification | Required action |
| --- | --- | --- | --- |
| `alembic_source_graph_status` | Cold-start-visible source graph readiness, scope, freshness, degraded state, and recovery guidance. | Keep as first gate. | Always show first in the code-fact catalog when visible. |
| `alembic_code_explore` | Broad current-code exploration over source graph facts. | Keep as primary exploration tool. | Bootstrap should recommend this before broad raw reads for code understanding. |
| `alembic_symbol_search` | Targeted symbol/file/route discovery. | Keep as primary discovery tool. | Use before direct node/call queries when the symbol id is unknown. |
| `alembic_source_node` | Drill into one file/symbol/node with source sections and direct edges. | Keep as drill-down tool. | Use only after search/explore yields a concrete id or file. |
| `alembic_callers` / `alembic_callees` | Directional call relationship queries for a known symbol id. | Keep as precise relationship tools. | Do not replace with old `alembic_call_context`; explain direction and freshness limits. |
| `alembic_code_impact` | Advisory blast-radius query for changed files or a symbol. | Keep as planning/review tool. | Must not be presented as validation or acceptance. |
| `alembic_validation_plan` | Advisory validation buckets from changed files/symbols and source graph refs. | Keep as validation planning tool. | It should absorb test-selection guidance when practical. |
| `alembic_affected_tests` | Narrow likely-test shortcut that overlaps `alembic_validation_plan`. | Delete from Codex-visible MCP surface by default. | Fold behavior into `alembic_validation_plan`; retain only with current external consumer proof, owner, and cleanup trigger. |
| `alembic_graph` | Recipe/knowledge relationship graph, not current source-code graph. | Keep, but outside code relationship catalog. | Rename/describe clearly as knowledge graph; never use as proof of current code freshness. |
| `alembic_call_context` | Legacy code call-chain query from older embedded/resident surface. | Delete from Codex-visible MCP surface by default. | Replace Codex guidance with `alembic_callers`, `alembic_callees`, and `alembic_code_impact`; retain only with current external consumer proof, owner, and cleanup trigger. |
| `alembic_structure` / `alembic_panorama` | Project metadata or broader project snapshot surfaces. | Keep outside source graph relationship catalog. | May inform orientation, but not source relationship evidence unless backed by source graph refs. |
| `alembic_guard` | Legacy Guard compatibility route. | Keep compatibility only. | New host-agent calls use `alembic_code_guard`; no-args whole-diff fallback stays blocked. |

This classification prevents two common failures:

- treating `alembic_graph` as source-code relationship proof when it is a
  Recipe/knowledge graph;
- advertising both `alembic_call_context` and the new callers/callees/impact
  tools as equal choices, which makes Codex pick the older weaker route.

Deletion rule: CKG should simplify the Codex-facing MCP surface by default when
there is an equivalent or better replacement route. Keep a stale tool only when
CKG0 proves a current external consumer that cannot migrate in this sequence.
Every deletion still needs replacement route proof, updated skills/guidance,
output-contract tests, and representative runtime probes.

### Cold-Start SOP Pack

The cold-start SOP pack is the structured source for the initial tool briefing,
current domain SOP, next-domain SOPs, and repair/rebuild prompts. It should be
generated from real bootstrap state and tool capabilities, not stored as generic
static text. It should include:

- `scopeBrief`: selected project, source root, storage mode, and hard stop
  conditions.
- `toolCapabilityMatrix`: what each visible MCP tool provides, required input,
  output trust level, evidence refs, and invalid conclusions.
- `domainPlaybooks`: domain-specific goals, likely code areas, recommended
  tools, required candidate variety, required evidence fields, rejection
  examples, and completion rules.
- `recipeOntology`: what a Recipe is, valid Recipe kinds, what is not a Recipe,
  and how source facts become reusable project guidance.
- `recipeAuthoringRubric`: source-grounded specificity, relationship proof,
  future-actionability, validation guidance, failure/edge-case coverage,
  dimension coverage, and duplicate/shallow rejection rules.
- `submitKnowledgeContract`: exact V3 fields, required `sourceRefs`, required
  matching snippet/coreCode evidence, graph refs for relationship claims, and
  failure codes.
- `dimensionCompletionContract`: required verified candidate ids, source file
  overlap, key findings, quality result, and checkpoint rules.
- `repairPrompts`: precise remediation and rebuild instructions for invalid
  source refs, stale graph, wrong scope, placeholder evidence, snippet mismatch,
  generic/thin Recipe content, shallow duplicates, non-actionable guidance, and
  insufficient dimension coverage.
- `nextDomainPrompt`: how Alembic sends the next domain SOP only after the
  previous domain passes or after the controller/user explicitly skips a blocked
  domain.
- `resumePrompt`: how to continue after MCP process restart using
  `bootstrapSessionRef` and persisted session state.

This SOP pack should be returned as structured fields or artifact refs and
rendered into the current staged briefing. It should not require Codex to infer
the tool order from one long paragraph, and it should not expose project
architecture facts that the tools should provide live.

User decision (2026-06-12, clarified): "LLM participation" means LLM-assisted
authoring of the SOP content itself — the user wants the domain SOPs written
to industry best-practice quality: better, more comprehensive, authoritative,
and adapted per programming language. The resolved route is: domain SOP
template content is authored and maintained at design/development time
(LLM-assisted, grounded in named industry best practices), the runtime renders
SOPs from those templates plus real bootstrap state, and the host agent
consumes them. There is no runtime server-side LLM generation on the default
route, which stays provider-free. The authoritative content baseline is
[domain-sop-baseline-2026-06-12.md](domain-sop-baseline-2026-06-12.md):
language-neutral core playbooks for seven domains, per-language overlays
(TypeScript/Node, Swift, Python, compact Go/Rust/JVM, generic fallback),
project-type adjustments, and rendering/budget rules. CKG1 implements the SOP
pack from that baseline. Boundaries that still apply: SOP prose lives inside
the structured SOP sections and is rendered from real bootstrap state and tool
capabilities; the initial briefing and each domain SOP carry explicit size
budgets; consistency tests assert the section contract and state-derivation;
and every executable gate (scope, evidence, submission, dimension completion)
remains code-enforced — gate behavior must never depend on SOP wording.

### Multi-Stage Interaction Protocol

The cold-start flow should support multi-stage interaction by default. A
single-call fast path is allowed only when it still uses the same domain SOP
queue and gates. The agent experience must feel guided rather than open-ended.

1. **Orientation stage**:
   `alembic_bootstrap` returns tool capability briefing, package/state refs,
   active bootstrap session, gates, and the first domain SOP. Codex reads tool
   matrix, Recipe ontology, quality rubric, and stop conditions; it gets project
   architecture facts by calling the indicated tools.
2. **Domain analysis stage**:
   Codex works one domain or one small coherent domain group at a time. It calls
   source graph tools first when fresh, falls back to targeted raw reads when
   graph coverage is partial, and records source/graph refs for each
   observation.
3. **Candidate judgement stage**:
   Codex decides which observations deserve Recipes. It must reject facts that
   are too local, generic, stale, duplicated, unsupported, or not reusable.
4. **Submission stage**:
   Codex calls `alembic_submit_knowledge` with evidence-rich candidates. The
   tool fails before persistence on weak evidence or weak quality and returns a
   rebuild instruction tied to the relevant SOP section.
5. **Dimension completion stage**:
   Codex calls `alembic_dimension_complete`. The tool checks verified
   session-bound ids, domain coverage, candidate variety, source refs, graph refs,
   key findings, and quality result before writing progress.
6. **Next-domain handoff stage**:
   after a dimension passes, Alembic returns the next domain SOP or a final
   review SOP. Codex should not continue to unseen domains from memory or guess
   the rest of the sequence.
7. **Repair or resume stage**:
   failures return specific repair/rebuild instructions tied to the briefing
   sections. MCP restart recovery uses `bootstrapSessionRef` and persisted
   session state.

If a new helper tool is added for staged progress, it must not weaken the gates.
It may only expose the next domain, required evidence, progress, or repair
instructions already present in bootstrap state.

### Main Cold-Start Gate Alignment

Codex host-agent cold start and Alembic's main cold-start/job paths must share
the same Core-owned validation contract. Different entrypoints may have
different orchestration, but they must not have different quality floors.

Required stage parity:

| Stage | Required shared behavior |
| --- | --- |
| Scope admission | Selected project and source root are validated before bootstrap or submission. Wrong scope blocks before persistence. |
| Graph readiness | Fresh graph facts are required for relationship claims. Stale/partial graph state must be visible and blocking for graph-dependent candidates. |
| Analysis | Candidate production must follow the current domain SOP and cite real files, line ranges, and relationship refs where claimed. |
| Recipe judgement | Observations must be promoted only when they become reusable project guidance with source-grounded specificity, future actionability, and validation guidance. |
| Submission gate | `submit_knowledge` validates source refs, snippet/coreCode match, placeholder rejection, graph refs, session binding, and Recipe quality before persistence. |
| Rejection gate | Invalid items return stable public failure codes plus rebuild instructions and do not become staged candidates. |
| Dimension gate | `dimension_complete` derives counts from verified session-bound ids and blocks progress/checkpoint writes on insufficient evidence, shallow duplicates, missing domain coverage, or weak guidance value. |
| Finalizer | Project Skill export, progress completion, and active-knowledge visibility only happen after the hard gates pass. |

If an existing daemon or HTTP job path already has a stronger rule, the
Codex/plugin path must call the same Core rule. If a path is weaker, CKG3 must
repair it rather than documenting the divergence.

Guidance inheritance (user-confirmed 2026-06-12): the strict per-dimension
Recipe guidance already exists in Core and is consumed by the host-agent
briefing today — `DimensionSop.ts` three-phase SOPs with
`SHARED_SUBMIT_CHECKLIST` and `PRE_SUBMIT_CHECKLIST` (MUST/SHOULD/
FAIL_EXAMPLES), plus the `MissionBriefingBuilder.ts` submission spec
(minimum 3 / target 5 candidates per dimension, per-candidate >= 3 file
references, full repo-relative path + line citations as top priority, module
attribution, cross-dimension hard dedup, and `dimension_complete` floors of
referencedFiles + 3-5 keyFindings + analysisText >= 500 chars). CKG1's staged
domain SOPs must inherit this floor and re-deliver it per domain instead of
one bundle — they must not regress it with weaker rewritten text. The
inheritance contract is recorded in
[domain-sop-baseline-2026-06-12.md](domain-sop-baseline-2026-06-12.md).

### End-To-End Acceptance Loop

The controller should not accept isolated unit tests as completion. Acceptance
must prove the full product route:

1. `alembic_codex_status` (or `alembic_health` on the embedded surface) reports
   the selected project and cold-start state.
2. `alembic_bootstrap` returns bootstrap state plus the initial tool briefing
   and first domain SOP with tool catalog, SOP pack, gates, session, and current
   domain next actions.
3. Codex uses relationship tools on real project code before producing the
   current domain's candidates.
4. `alembic_submit_knowledge` accepts valid candidates and rejects invalid
   source, snippet, placeholder, stale graph, wrong-scope, and bypass attempts.
5. `alembic_dimension_complete` succeeds only after verified session-bound
   candidates satisfy the dimension rules, then returns the next domain SOP or
   final review state.
6. Post-bootstrap status, search/prime or staged-knowledge readback, Guard, and
   Dashboard/progress surfaces distinguish staged candidates, active Recipes,
   generated skills, and source graph facts.

### Real Codex Agent Iteration Gate

Final acceptance must use a real Codex agent cold-start run, not only a scripted
MCP client, unit test, or hand-written fixture. The controller may assign Test
or run a controlled Codex-agent scenario itself, but the evidence must show the
host agent following the staged SOPs, calling the Alembic MCP tools, submitting
knowledge, completing dimensions, and then using the created knowledge.

The acceptance loop is intentionally iterative:

1. Run a fresh or reset cold start in a real Codex/plugin session.
2. Save raw tool outputs, agent transcript excerpts, created candidates, source
   refs, graph refs, dimension progress, and Dashboard/progress evidence.
3. Audit accepted Recipe samples for truth, source grounding, richness,
   future-actionability, relationship evidence, validation guidance, and
   usefulness to a later Codex agent.
4. Audit rejected samples and negative routes to prove weak/generic/fake or
   source-mismatched candidates are rebuilt instead of staged.
5. If output quality is below the Recipe quality contract, request rework on
   the owning slice instead of accepting CKG7. Examples: CKG1 for confusing SOP
   or tool guidance, CKG2 for stale/empty source graph facts, CKG3 for weak
   evidence gates, CKG4 for confusing tool surface, CKG5 for post-bootstrap
   trust-layer confusion, or CKG6 for missing progress/repair visibility.
6. Repeat implementation and real Codex-agent testing until the controller can
   accept both functional behavior and generated Recipe quality, or until a hard
   blocker/user decision is recorded.

Manual stdio probes and deterministic scripts may supplement diagnostics, but
they cannot replace the real Codex-agent acceptance run.

### Recipe Quality Contract

The core product goal is not merely to create many Recipe candidates. Codex
agent cold start must produce Recipes that are true, useful, reusable, and
grounded in current project code. A candidate that passes field-level validation
but contains generic advice, tiny observations, fake examples, weak snippets, or
no operational guidance is a failed cold-start product outcome.

Every accepted bootstrap Recipe candidate must have:

- a real project behavior, boundary, convention, or workflow discovered from
  source, tests, config, scripts, docs, or current runtime output;
- concrete source refs with file and line/range, plus graph refs for any
  relationship claim when source graph freshness allows it;
- a useful guidance shape: when to apply, when not to apply, what files or
  modules it affects, what entrypoints/call chains matter, and what validation
  should accompany changes;
- enough context for a future Codex agent to act correctly without redoing the
  whole cold-start analysis;
- at least one concrete source-grounded example, snippet, command, or behavior
  trace that matches the cited source rather than a fabricated teaching sample;
- explicit uncertainty when graph state is partial, stale, unsupported, or when
  a conclusion required raw file verification instead of source graph proof.

The gate must reject:

- single-sentence or template-like Recipes;
- generic TypeScript, Node, MCP, React, or testing advice that is not specific
  to the selected project;
- candidate text whose code sample does not match cited source;
- source refs that are only filenames, directory names, labels, or agent memory;
- claims about callers/callees/impact/tests that lack source graph evidence or
  explicit raw-read fallback evidence;
- "quality by length" replacements such as arbitrary character-count padding.

Rejected bootstrap Recipes must be treated as rebuild-required, not as staged
drafts. The response must identify the failed candidate or field, the stable
reason code, the missing evidence or quality dimension, the SOP section to
rerun, and whether the whole domain analysis must be repeated. A rejected item
must not count toward `dimension_complete`.

Quality scoring may help ranking, but the acceptance rule is structural and
evidence-based. The implementation should use a rubric, not a fixed text length:
source-grounded specificity, relationship proof, future-actionability,
validation guidance, failure/edge-case coverage, and dimension coverage.

`alembic_dimension_complete` must not pass a dimension just because the minimum
candidate count exists. It must prove the completed dimension has meaningful
coverage across the dimension's intended patterns, not three variants of the
same shallow note.

User-confirmed supplement (2026-06-12) — make the rubric measurable in three
layers: (1) deterministic floors enforced in code: source-ref validity,
snippet match, duplicate fingerprint against the session, and dimension
coverage map; (2) heuristic quality scoring (the existing scorer) for ranking
and feedback; (3) sampled audit at CKG7 acceptance. Add an explicit
per-dimension diversity check: a dimension cannot complete on candidates that
share the same kind and the same file cluster (the live run's
16 fact / 23 pattern / 16 rule distribution is the reference shape). Numeric
floors are set at CKG0 when the rubric is defined, referenced to the
2026-06-11 live-run baseline (mostly B-range, 0.77-0.82 average): bootstrap
output at or below that baseline quality is the rework trigger, not the
acceptance bar.

### MCP Tool Deletion And Canonicalization Contract

The CKG sequence owns the source relationship tool surface cleanup for cold
start. Do not route this through unrelated RC cleanup demands.

The canonical Codex current-code tool catalog is:

- `alembic_source_graph_status`
- `alembic_code_explore`
- `alembic_symbol_search`
- `alembic_source_node`
- `alembic_callers`
- `alembic_callees`
- `alembic_code_impact`
- `alembic_validation_plan`

Deletion/canonicalization requirements:

- Remove `alembic_call_context` from Codex-visible tool lists, initialize
  guidance, bundled/injectable skills, ToolPolicy/catalog, and Plugin MCP
  routing unless a live external consumer is proven. Replacement routes are
  `alembic_callers`, `alembic_callees`, and `alembic_code_impact`.
- Fold standalone `alembic_affected_tests` behavior into
  `alembic_validation_plan`. Remove its visible tool entry, dispatcher route,
  output projection, guidance, and tests unless a current consumer cannot
  migrate. If retained, it must be marked compatibility-only with owner,
  consumer, cleanup trigger, and negative guidance that it is advisory only.
- Keep `alembic_graph` only as Recipe/knowledge graph. It must not appear in
  source-code relationship guidance, bootstrap code-fact catalog, or source
  evidence validation as proof of current source freshness. Keep the existing
  tool name: a rename to `alembic_knowledge_graph` was considered and rejected
  (user-confirmed 2026-06-12) as a breaking change without consumer value;
  CKG4 fixes the description only.
- Keep `alembic_structure`, `alembic_panorama`, and legacy `alembic_guard`
  outside the code relationship catalog. New scoped Guard handoffs use
  `alembic_code_guard`.
- Update skills and initialize guidance so Codex sees one clean tool-choice path
  instead of parallel old/new source relationship routes.

Required deletion evidence:

- before/after `tools/list` snapshots;
- consumer scans across non-test code, skills, host guidance, tool policy,
  catalog, handler routing, output projection, smoke scripts, docs, and tests;
- replacement route proof for each removed tool;
- tests that fail if deleted tools reappear in Codex source relationship
  guidance;
- representative MCP callTool samples for the retained canonical tools.

## Controller Supplement: Real Evidence Gate Repair Plan

Controller code review on 2026-06-11 compared the current AlembicPlugin /
AlembicCore implementation with the legacy IDE/external-agent implementation.
The result is important for implementation planning: there is no old strict
server-side evidence gate to restore. The legacy path already relied on Mission
Briefing guidance plus `UnifiedValidator` field heuristics. Current code moved
that logic into shared Core surfaces, but it did not remove a previously working
hard gate.

Therefore the fix must add a new real gate. Do not dispatch a task that merely
changes Mission Briefing text, prompt wording, or Dashboard copy.

### Current Code Anchors

These anchors define the implementation surface:

- `Alembic/lib/resident/tool-handlers/consolidated.ts`:
  `enhancedSubmitKnowledge()` accepts `items`, injects source/dimension/tags
  metadata, performs no evidence validation of its own (only rate-limit and
  non-empty checks), delegates everything to
  `RecipeProductionGateway.create()`, reports success when
  `gatewayResult.created.length > 0`, and records submissions into the
  in-memory bootstrap session via the container `bootstrapSessionManager`.
- `AlembicCore/src/service/knowledge/RecipeProductionGateway.ts`:
  `create()` uses `UnifiedValidator`, similarity checks, consolidation, and
  best-effort quality scoring (try/catch, non-blocking) before
  `knowledgeService.create()`. Verified bypass options the new gate must not
  honor for host-agent bootstrap submissions: `skipConsolidation` skips the
  consolidation scan, batch-import with `skipSimilarityCheck` skips
  similarity, and `skipUniqueness` is forwarded into the validator.
- `AlembicCore/src/domain/knowledge/UnifiedValidator.ts`: the current hard
  checks are field completeness, markdown length, code block or file-reference
  presence, basic coreCode shape, generic-title rejection, and uniqueness.
  Complete relative path + line is warning-level, not blocking.
- `AlembicCore/src/workflows/capabilities/host-agent/HostAgentDimensionCompletionWorkflow.ts`:
  verified at line 224, `candidateCount` prefers the caller-provided value
  (`input.value.candidateCount || submittedRecipeIds.length`); the checkpoint
  is persisted before quality feedback is attached to the response; and the
  workflow returns `success: true` even when `qualityReport.pass` is false —
  quality feedback is informational, never blocking.
- `AlembicCore/src/workflows/capabilities/host-agent/HostAgentSubmissionTracker.ts`:
  the "at least 3 candidates" and file-coverage requirements are suggestions in
  a score report, not fail-closed completion rules.
- `Alembic/lib/resident/tool-schema/tools.ts`: `alembic_bootstrap` is treated as
  a Mission Briefing entrypoint, not as a quality gate (read-only, absent from
  `TOOL_GATEWAY_MAP`), and its description still advertises an
  "8 dimensions x 3 tiers" model. The gate belongs in submission and dimension
  completion.
- `AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts`:
  the session is an in-memory map behind the ServiceContainer with
  `SESSION_TTL_MS` of 2 hours and no disk/DB persistence — a long real cold
  start can lose its session inside one process lifetime, which CKG3 session
  persistence must also cover, not only restart recovery.

### Required New Hard Gate

Implement a Core-owned evidence validator that is called from the real write
path, not only from prompts:

```text
alembic_bootstrap
  -> Mission Briefing and bootstrapSessionRef
  -> alembic_submit_knowledge
       -> UnifiedValidator
       -> HostAgentRecipeEvidenceGate
       -> RecipeProductionGateway.create
  -> alembic_dimension_complete
       -> recovered/bound recipe ids
       -> dimension evidence gate
       -> checkpoint / progress only after pass
```

The gate may be named differently if the product code has a better local naming
pattern, but it must be Core-owned and testable without the Plugin MCP runtime.

Hard rules:

- For host-agent bootstrap submissions, each item must provide concrete
  source evidence. `sourceRefs` is the canonical field. `reasoning.sources` may
  be normalized only when it contains the same concrete repo-relative source
  refs. Bare filenames and generic strings such as `agent` are rejected.
- Each source ref must be repo-relative, stay under the selected source root,
  include a line or line range, point to an existing file, and refer to a valid
  line range.
- Kind-aware evidence floors are enforced, not only prompted (user-confirmed
  2026-06-12, promoted from the main-path SOP guidance): `pattern` and `rule`
  candidates making cross-module claims require at least 3 distinct in-scope
  file refs, or an explicitly declared narrower single-file/module scope;
  `fact` candidates require at least 1 precise ref. Padding refs that do not
  support the claim fail the snippet/validity checks instead of satisfying
  the count — the existing "数量由证据决定，不凑数" rule survives
  enforcement.
- Each item must prove that its `coreCode` or at least one fenced code excerpt
  in `content.markdown` matches source text from one of its source refs after
  whitespace-normalized comparison. If exact matching is impossible because the
  snippet is intentionally summarized, the item must be rejected for bootstrap
  Recipe production rather than silently accepted.
- Placeholder code and template examples are rejected. At minimum reject known
  fake patterns such as `operation()`, `await operation()`, `doThing`, `foo`,
  `bar`, `TODO`, and synthetic examples that do not match a cited source range.
- Source evidence must be tied to the selected project scope. If the current
  Plugin/Codex root and the bootstrap source root diverge, `submit_knowledge`
  must fail with `wrong_scope` before any candidate is created.
- When CKG2 source graph is available and fresh, bootstrap submissions must
  attach graph-backed evidence refs for relationship claims: generation id,
  file or symbol node id, and edge/ref kind where applicable. If the graph is
  stale, missing, or partial for the cited files, the response must name the
  limitation and block relationship-dependent candidates.
- `skipConsolidation` and any batch/import option must not bypass the evidence
  gate for host-agent bootstrap submissions.
- `RecipeProductionGateway.create()` quality scoring may remain best effort, but
  evidence validation cannot be best effort.

`alembic_submit_knowledge` behavior in an active bootstrap session:

- Evidence-invalid items are rejected before persistence.
- A batch with any evidence-invalid item returns an explicit partial/rejected
  problem object and must not be summarized as simple success.
- Created ids must be recorded in the bootstrap session with their source refs,
  graph refs, dimension id, and validation result.
- A dimension's required minimum is not satisfied by caller-provided
  `candidateCount`; only successfully persisted and session-bound recipe ids
  count.

`alembic_dimension_complete` behavior:

- `candidateCount` is derived from verified session-bound recipe ids. Caller
  input may be retained for diagnostics but cannot make the dimension pass.
- Producer dimensions default to at least 3 verified candidates unless the
  dimension definition explicitly sets a lower minimum with a controller-reviewed
  reason.
- `referencedFiles` must be non-empty, repo-relative, under the selected source
  root, and overlap the submitted candidates' source refs.
- `keyFindings` must contain concrete findings, not generic completion text.
- `analysisText` must be sufficiently detailed for review and include source
  citations or graph refs for the completed dimension.
- If `qualityReport.pass` is false, or if the hard evidence checks fail,
  completion returns a blocking error such as `QUALITY_GATE_FAILED`,
  `INSUFFICIENT_EVIDENCE`, `SOURCE_REF_INVALID`, `SNIPPET_MISMATCH`,
  `PLACEHOLDER_EVIDENCE`, `STALE_GRAPH`, or `WRONG_SCOPE`.
- Checkpoint writes, dimension progress, Project Skill generation, and final
  bootstrap completion happen only after the hard gate passes.

### Product Surface Changes

AlembicPlugin must expose these failures through clean MCP output without
leaking internal storage rows:

- `success: false`
- stable `errorCode` / `problem.type`
- rejected item index and title
- evidence violation code
- source ref or graph ref that failed validation
- short next action
- sanitized project/source-root role

Large source excerpts, graph rows, and diagnostics must be returned through
compact artifact refs only when needed.

Mission Briefing should still teach Codex how to submit good candidates, but the
text is secondary. The service must reject bad submissions even when the host
agent ignores the briefing.

### Implementation Slices

This repair should be implemented in CKG3 after CKG1 onboarding status and CKG2
source graph lifecycle are available:

1. Core evidence gate:
   add the validator, source-ref parser, project-scope checks, snippet matching,
   placeholder rejection, and graph-ref validation.
2. Submit integration:
   invoke the gate from the bootstrap `alembic_submit_knowledge` path before
   persistence, record accepted evidence in the bootstrap session, and return
   explicit partial/rejected clean output.
3. Dimension completion integration:
   compute candidate count from bound ids, require source/file/finding coverage,
   make failing quality/evidence a blocking error, and avoid checkpoint/progress
   writes on failure.
4. Plugin clean output:
   project the Core error taxonomy into public MCP output and initialize
   guidance without dumping source text or graph internals.
5. Runtime proof:
   run one positive bootstrap dimension and the required negative cases through
   the actual Plugin MCP route, not only Core unit tests.

### Required Negative Tests

CKG3 is not acceptable without tests or probes that reject all of these:

- missing `sourceRefs`;
- `reasoning.sources` contains only a bare filename or `agent`;
- source ref points outside the selected project root;
- source ref file does not exist;
- source ref has no line or an out-of-range line;
- `coreCode` / markdown code block does not match cited source;
- placeholder snippet such as `operation()` passes field-level validation;
- stale or missing source graph is used for a relationship claim;
- caller supplies `candidateCount: 3` while zero or one recipes are actually
  bound;
- `dimension_complete` has fewer than the required verified candidates;
- `qualityReport.pass === false` still returns success;
- `skipConsolidation: true` bypasses evidence validation;
- wrong Codex/project source root creates a candidate.

### Required Positive Tests

CKG3 must also prove the real happy path:

- a candidate with repo-relative `sourceRefs`, line ranges, matching snippet,
  graph ref, concrete rationale, and complete V3 fields is accepted;
- a batch with multiple valid candidates returns created ids and session-bound
  evidence;
- `dimension_complete` succeeds only after the minimum verified candidates are
  bound to the dimension;
- the completion checkpoint records candidate ids, source refs, graph refs,
  referenced files, key findings, and quality result;
- post-bootstrap health/search can distinguish staged candidates from active
  Recipes and prime-visible knowledge.

## Live Cold-Start Observation Update

On 2026-06-11 a total-control thread ran a real cold-start rebuild attempt for
the Alembic product source root. The observation is recorded in
[cold-start-observation-2026-06-11.md](cold-start-observation-2026-06-11.md).

Observed outcome:

- 17 bootstrap dimensions reached checkpoint state.
- 55 staged knowledge entries were produced.
- Every entry had a source file projection and core code snippet.
- Entries stayed in `staging`; they did not become active Recipes.
- The validator rejected incomplete first submissions and forced richer
  `content.markdown`, source, and code evidence.
- The durable source graph tables stayed empty even though code entities were
  populated.

This proves the host-agent Recipe production direction is feasible, but also
shows the current cold-start product path is not ready. The following issues are
now first-class requirements, not incidental bugs:

- provide a public knowledge reset/rebuild operation instead of manual data-root
  isolation;
- fail closed on wrong source-root selection before Mission Briefing or
  knowledge submission;
- treat initialized empty knowledge as a normal `bootstrap_required` state;
- make source graph storage Ghost-aware and verify durable source graph tables;
- make packaged runtime availability and local development runtime diagnostics
  explicit;
- recover from Codex host MCP `Transport closed` without requiring manual stdio
  clients;
- preserve actionable init/setup failure causes in clean output;
- persist bootstrap session state so `dimension_complete` survives MCP restart;
- bind Recipe candidates to graph-backed relation evidence, not only file names
  and snippets;
- surface Project Skill export skip as a policy state in Ghost/source-repo mode;
- separate staged candidate success from active Recipe availability.

## Code-Fact Verification Update (2026-06-12)

A Design-window verification pass re-checked every code anchor in this
document against the live repositories: AlembicPlugin `7382c62`, AlembicCore
`ed42960`, Alembic `5decbd7` (resident surface; working tree mid-flight on RC5
shared-asset work that does not touch `lib/resident/`), AlembicDashboard
`11c2c61`. Outcome:

- All previously cited anchors were confirmed. Exact-line references, the
  verified 40-tool surface split (18 codex-local + 22 plugin-embedded-core),
  and tool-name corrections are folded into the sections above.
- Corrected names: there is no `alembic_status` tool — use
  `alembic_codex_status` (discovery) / `alembic_health` (embedded surface);
  the Decision Register tool is `alembic_decision_record`.
- CKG2 re-scoped by facts, not by decision: durable schema (migration 010),
  `SourceGraphIndexer` full/incremental/inspect, generation/freshness model,
  and the Plugin-to-Core query path already exist; the remaining gap is
  Ghost/PathGuard support, lifecycle triggers (cold start, startup catch-up,
  incremental sync), and durable-population proof.
- New finding for CKG0/CKG1: the bootstrap dimension model diverges across
  surfaces — resident `alembic_bootstrap` text says 8 dimensions x 3 tiers,
  the live run checkpointed 17 dimensions, Dashboard
  `DIMENSION_EXECUTION_ORDER` lists 23 — and must be reconciled into one
  canonical domain queue.
- New finding for CKG3: beyond missing persistence, the in-memory session has
  a 2-hour TTL, so even one long cold start can lose its session in-process;
  `dimension_complete` trusts caller-provided `candidateCount`
  (`HostAgentDimensionCompletionWorkflow.ts:224`) and persists checkpoints
  before quality evaluation; gateway options `skipConsolidation`,
  `skipSimilarityCheck` (batch-import), and `skipUniqueness` are verified
  bypass surfaces the new evidence gate must not honor.
- New finding for CKG6: most observability views already exist
  (`BootstrapProgressView`, `CandidatesView`, `JobsView`, graph views); the
  real new work is freshness/pending-file display, skill-export-skip policy
  state, and session recovery state.
- No scope, phase-order, capability-level, or completion-definition change was
  made by this verification. The only sequence-level addition is one CKG0
  evidence item (dimension-model reconciliation).

## Required Product Behavior

### 1. Codex Cold-Start Onboarding

Codex should receive one clean path for a user who asks to use Alembic on a
project:

```text
status / health
  -> initialize project if needed
  -> source graph readiness check
  -> bootstrap state, tool briefing, and current domain SOP
  -> agent Recipe production by current domain
  -> dimension completion
  -> next domain SOP or repair/rebuild SOP
  -> knowledge health / Dashboard handoff
```

The user-visible result should answer:

- Is Alembic installed and launchable in this Codex session?
- Which project is selected?
- Where is Alembic storing data: ghost or standard mode?
- Does the project already have knowledge?
- Does it have a source graph?
- Is the source graph fresh enough for current questions?
- Is bootstrap required, running, completed, failed, or stale?
- Which MCP tools should Codex use for source graph facts, knowledge creation,
  Guard, Dashboard, and recovery?
- Which hard gates must pass before `submit_knowledge` or
  `dimension_complete` can write progress?
- What must Codex do next?

### 2. Source Graph As Fact Layer

AlembicCore should own deterministic source graph capability:

- project graph storage and schema;
- full index lifecycle;
- source file discovery and ignore policy;
- parser/language support;
- file, symbol, source range, entity, dependency, and call edges;
- relationship traversal;
- changed-file impact and likely affected tests;
- stale generation detection;
- catch-up sync after MCP/daemon startup;
- incremental sync after file changes;
- operation-level evidence refs that Plugin can return to Codex.

The graph must expose enough facts for an agent to write better Recipes:

- real entrypoints and consumers;
- caller/callee evidence;
- core abstractions and boundaries;
- module ownership and dependency direction;
- likely test or validation targets;
- source ranges for cited behavior;
- freshness and uncertainty state.

### 3. Recipe Production As Judgement Layer

Codex should use graph facts to produce Recipes, but Alembic should keep the
semantic layer separate:

- Source graph answers: "what code exists and how it connects."
- Recipe production answers: "what reusable project rule or pattern should an
  agent follow later."
- Guard answers: "does this proposed work obey accepted project rules."
- Decision Register answers: "what durable decisions changed the future."

During cold start, the staged SOP pack should guide Codex to:

1. inspect the current dimension with graph tools and targeted reads;
2. identify reusable patterns and boundaries;
3. submit multiple high-quality Recipe candidates per dimension;
4. attach source evidence refs and relationship evidence where available;
5. call `alembic_dimension_complete`;
6. receive the next domain SOP, repair/rebuild instructions, or final review
   state;
7. continue until all required dimensions are completed or a real blocker is
   reported.

### 4. MCP Tool Surface

The Codex-facing tool catalog should make relationship capability easy to use
without dumping internal implementation details.

Primary public source relationship operations:

- `alembic_source_graph_status`: initialized/indexed/fresh/stale/pending stats.
- `alembic_code_explore`: one-call answer for broad code questions with compact source
  sections and relationship map.
- `alembic_symbol_search`: find symbols, definitions, files, and probable
  targets.
- `alembic_source_node`: retrieve one indexed file/symbol/node with source
  range.
- `alembic_callers`: find upstream callers for a function/class/symbol.
- `alembic_callees`: find downstream calls/dependencies from a
  function/class/symbol.
- `alembic_code_impact`: estimate blast radius from a file/symbol/change set.
- `alembic_validation_plan`: return suggested validation buckets, never
  acceptance.

Optional compatibility shortcut:

- `alembic_affected_tests`: map source changes to likely tests only if CKG0
  proves a current standalone consumer; otherwise fold this behavior into
  `alembic_validation_plan`.

Each tool must return a clean, tool-specific shape. It should not include every
possible field "just in case." Optional data belongs only in tools that need it.

### 5. Freshness And Failure Semantics

Cold start and graph tools must fail honestly:

- `not_initialized`: project runtime exists but graph/knowledge does not.
- `bootstrap_required`: source graph or knowledge base is missing.
- `indexing`: full index or catch-up is in progress.
- `partial`: some languages/files parsed; unsupported areas are named.
- `stale`: graph generation is older than detected file changes.
- `degraded`: watcher/daemon/semantic search/job route is degraded but usable
  with limits.
- `wrong_scope`: Codex project root and Alembic selected project do not match.
- `bootstrap_in_progress`: another writer holds the project bootstrap lease;
  the state names the holder and the takeover guidance.
- `blocked`: cannot continue without user action or runtime repair.

No tool should present stale graph facts as current. When a result depends on
files that are pending sync, the response should name those files and tell Codex
which direct reads are required.

### 6. Dashboard And Observability

Dashboard should support this workflow by showing:

- selected project identity and storage mode;
- cold-start status;
- source graph generation and freshness;
- indexed file/symbol/edge counts;
- pending sync and stale files;
- bootstrap dimensions and completion status;
- Recipe candidates and accepted Recipes created during bootstrap;
- source evidence coverage;
- failed dimensions and repair actions;
- links or references back to job/session/event evidence.

Dashboard is not required to own the frontend source inside Plugin. The Plugin
continues to hand off a Dashboard URL when Alembic advertises that capability.

## Repository Responsibilities

| Repository | Responsibility |
| --- | --- |
| AlembicPlugin | Codex plugin/MCP entry, tool schema, clean output, onboarding flow, host-agent cold-start route, source graph tool projection, ProjectRoot/ProjectScope alignment, plugin runtime guidance. |
| AlembicCore | Source graph storage/query contracts, project intelligence, Mission Briefing contracts, host-agent sessions, evidence refs, freshness model, deterministic analysis. |
| Alembic | Local daemon/server, project runtime, job APIs, file monitor, Dashboard server handoff, resident search integration. |
| AlembicAgent | Explicit provider-backed daemon jobs only; not required for default Codex host-agent bootstrap. |
| AlembicDashboard | Visual review of cold-start, graph, Recipe evidence, dimensions, drift, and recovery. |
| AlembicWorkspace | Controller intake, sequencing, raw evidence review, acceptance, archive. |
| Test | Real Codex/plugin scenario validation when assigned by controller. |

## Candidate Demand Sequence

### CKG0 - Current Flow And User Scenario Baseline

Confirm current reality before edits:

- read Plugin/Core cold-start and source graph implementation;
- run non-mutating status/health/source graph probes;
- include the 2026-06-11 live cold-start observation as baseline evidence;
- record current tool outputs and known degraded states;
- produce a keep/delete/fold tool decision table that defaults stale
  `alembic_call_context` and standalone `alembic_affected_tests` toward
  removal unless current external consumers block it;
- reconcile the canonical bootstrap dimension model: the resident
  `alembic_bootstrap` description advertises 8 dimensions x 3 tiers, the
  2026-06-11 live run checkpointed 17 dimensions, and Dashboard
  `DIMENSION_EXECUTION_ORDER` lists 23 dimensions; CKG1's domain queue must
  present one canonical model;
- define the Recipe quality rubric and current bad-output examples that must be
  rejected by later gates, with numeric floors referenced to the 2026-06-11
  live-run baseline;
- probe the file-monitor / source-graph write transaction boundary to settle
  the Core-owned writer versus daemon long-lived writer decision with facts;
- define real user scenarios and acceptance probes;
- decide which windows must own each later slice.

### CKG1 - Codex Onboarding And Tool Choice Contract

Make the Codex-facing startup path coherent:

- `alembic_bootstrap` returns structured bootstrap state plus the initial tool
  briefing and first domain SOP, not one prose Mission Briefing;
- the state includes project identity/scope, runtime, source graph readiness,
  tool capabilities, SOP pack, domain queue, gates, session, progress, repair
  state, and current-domain next actions;
- project architecture details are not copied into static briefing text when
  live MCP tools provide them; the SOP tells Codex which tool to call and what
  evidence to extract;
- the MCP tool capability catalog is generated from the actual visible tool
  surface and names code relationship tools, knowledge tools, Guard, Dashboard,
  recovery, and degraded states;
- the catalog does not advertise removed stale tools; if a tool is retained for
  compatibility, the catalog names the current consumer, owner, and cleanup
  trigger;
- cold-start SOP pack sections are separate and inspectable: scope brief, tool
  playbook, dimension playbooks, submit contract, dimension completion contract,
  repair/rebuild prompts, next-domain prompt, resume prompt, and stop
  conditions;
- domain SOP content derives from the authoritative multi-language baseline
  ([domain-sop-baseline-2026-06-12.md](domain-sop-baseline-2026-06-12.md)):
  language-neutral core playbooks plus per-language overlays selected from
  project intelligence language stats, with a generic fallback overlay and
  explicit uncertainty marking for unsupported languages;
- status tells the user whether to init, bootstrap, rescan, or repair scope;
- a public knowledge reset/rebuild operation is part of this onboarding
  contract (user-confirmed 2026-06-12): explicit scopes
  (knowledge-only / graph-only / knowledge-and-bootstrap / full), backup by
  default with a returned restore ref, Ghost-aware paths, idempotent re-run;
  manual data-root editing stays forbidden;
- empty initialized projects are represented as `bootstrap_required`, not as
  generic failures;
- wrong source-root selection is visible and blocks bootstrap before candidate
  submission;
- clean output keeps compact actionable failure causes for init/setup/runtime
  blockers;
- MCP initialize guidance explains when to use graph tools, knowledge tools,
  Guard, Dashboard, and raw reads;
- cold-start next actions are compact and operational;
- old scattered guidance is removed or downshifted only after replacement is
  connected.

### CKG2 - Source Graph Lifecycle And Freshness Core

Complete and wire the durable Core capability. Verified 2026-06-12: the
storage schema (`010_source_graph.ts`), `SourceGraphIndexer`
(`buildFull`/`buildIncremental`/`inspect`), generation ids, and freshness
states already exist, and the Plugin query path already reads the durable
tables through `SourceGraphService`. CKG2 is therefore lifecycle completion
and wiring, not a from-scratch build. The completion definition is unchanged:

- graph schema and generation metadata (exists — keep contract-stable);
- full index (indexer exists — wire a real cold-start/lifecycle trigger);
- catch-up sync (wire on MCP/daemon startup);
- incremental sync (wire to file-change detection);
- stale-file detection (`inspect()` exists — connect to tool freshness output);
- Ghost data-root support under PathGuard (missing — the 2026-06-11 run hit a
  PathGuard failure opening the Ghost graph path; this is new work);
- durable source graph table population during cold start (missing — all four
  tables stayed empty in the live run while `code_entities` got 2214 rows);
- parser/language fallback;
- operation evidence refs;
- query contracts for status/explore/node/search/callers/callees/impact/tests
  (operation kinds and result types exist — close gaps found by CKG0 probes).

### CKG3 - Bootstrap To Recipe Production Integration

Connect graph facts to Recipe creation:

- implement the Core-owned hard evidence gate described above;
- implement the Recipe quality rubric described above so accepted candidates are
  source-grounded, project-specific, instructionally useful, and not generic
  prompt filler;
- implement rebuild-required failure behavior for weak Recipes: rejected
  candidates are not staged, do not count toward dimensions, and return a
  domain-specific repair/rebuild instruction;
- align Codex host-agent cold start and Alembic main/job cold-start routes on
  the same Core-owned scope, graph, submission, rejection, dimension, and
  finalizer gates;
- make `alembic_bootstrap` package gates executable by
  `submit_knowledge` and `dimension_complete`, not advisory prompt text;
- invoke that gate from the real host-agent `submit_knowledge` path before
  candidate persistence;
- make `dimension_complete` fail closed when verified candidates, source refs,
  graph refs, key findings, or quality pass are missing;
- bootstrap state and SOP pack include source graph readiness, domain queue,
  current-domain relationship starters, validation hints, and per-domain
  evidence tasks;
- after each passing dimension completion, the runtime exposes the next domain
  SOP or final review SOP instead of requiring Codex to guess the remaining
  sequence;
- Codex uses graph tools before broad raw reads;
- `submit_knowledge` accepts graph evidence refs without leaking internal graph
  storage details;
- `dimension_complete` validates that each completed dimension has meaningful
  knowledge and source/evidence coverage.
- bootstrap sessions are recoverable across MCP process restarts via
  reconstruction (user-confirmed 2026-06-12): session state is rebuilt from
  persisted dimension checkpoints plus session-bound candidate ids, with
  `bootstrapSessionRef` as the rebuild key, instead of introducing a second
  independently-written session store;
- completing a dimension after restart uses an explicit session ref instead of
  relying only on process-local active state;
- the in-memory session TTL becomes activity-sliding — the current fixed
  2-hour TTL can expire a single long cold start mid-run.
- partial submit success, caller-provided `candidateCount`, and warning-level
  quality feedback are not acceptance evidence.
- dimension completion rejects shallow duplicate candidates even when the count
  threshold is met.

### CKG4 - Relationship Tool Surface Clean Output

Finalize the MCP public contract:

- finish the CKG0 tool-surface inventory before changing visibility;
- primary code relationship catalog is:
  `alembic_source_graph_status`, `alembic_code_explore`,
  `alembic_symbol_search`, `alembic_source_node`, `alembic_callers`,
  `alembic_callees`, `alembic_code_impact`, and `alembic_validation_plan`;
- standalone `alembic_affected_tests` must be folded into
  `alembic_validation_plan` and removed from the Codex-visible MCP surface unless
  a current external consumer blocks removal;
- `alembic_call_context` must be removed from Codex source graph guidance and
  visible MCP routing unless a current external consumer blocks removal;
- `alembic_graph` remains available only as Recipe/knowledge graph, not source
  code graph;
- every source relationship tool has a compact, per-tool schema;
- no universal `refs` bag full of unrelated fields;
- no raw internal database rows in public output;
- error/problem taxonomy is consistent with existing clean MCP contracts and
  reuses the established cross-repo error/problem taxonomy registry from the
  interface-contract sequence (D25) instead of minting new ad hoc codes;
- candidate relation evidence can cite callers, callees, dependency edges,
  impact radius, and affected tests when available;
- tests cover missing graph, stale graph, unsupported file, wrong scope, partial
  parse, and happy path.

### CKG5 - Knowledge Use After Bootstrap

Make post-bootstrap use coherent:

- `intent` and `prime` can return Recipe knowledge and source graph hints without
  blurring trust levels;
- `search` and `structure` can route to graph evidence when useful;
- Guard can cite Recipe rules while graph tools cite code facts;
- Decision Register can record durable changes discovered during graph-backed
  work;
- stale Recipes and stale source refs can be detected after rescan with a real
  mechanism (user-confirmed 2026-06-12): graph evidence refs carry their
  `generationId`; when rescan supersedes a generation, Recipes citing it enter
  an explicit stale-evidence review state — flagged for re-verification, not
  silently deleted and not silently trusted.
- staged candidates, active Recipes, exported Project Skills, and prime-visible
  knowledge are separate states with explicit transitions.

### CKG6 - Dashboard And Progress Observability

Expose the real workflow:

- cold-start session timeline;
- dimensions and pending work;
- Recipe candidates and evidence coverage;
- source graph freshness and pending files;
- job/session/event links;
- skipped Project Skill export with policy reason and recovery action;
- bootstrap session recovery or restart state;
- actionable repair paths for failed bootstrap, stale graph, or wrong project
  scope.

Verified Dashboard baseline (2026-06-12, head `11c2c61`, post Chat/Wiki/Signal
deletion): `BootstrapProgressView` already renders the cold-start session
timeline, per-dimension status, evidence issues, and repair states
(`record_repair`, `quality_gate_record_repair`) over socket with poll
fallback; `CandidatesView` separates pending/staging; `JobsView` shows the job
timeline and process events; `KnowledgeGraphView`/`DepGraphView`/`PanoramaView`
cover knowledge-graph and dependency views. Missing — and therefore the real
CKG6 work: source graph freshness/pending-file display, skipped Project Skill
export as a policy state, and bootstrap session recovery/restart state. Note
that Dashboard `DIMENSION_EXECUTION_ORDER` lists 23 dimensions — see the
dimension-model reconciliation item in CKG0. Bootstrap stage events (domain
started/completed/rejected/repaired) ride the existing job process event
stream that `JobsView` already consumes — no new transport (user-confirmed
2026-06-12).

### CKG7 - Real Codex Cold-Start Acceptance

Validate the actual user experience:

- fresh or reset project;
- real Codex agent cold-start run, not only scripted MCP clients or hand-written
  fixtures;
- Codex plugin starts from the intended runtime;
- packaged-shell and local-dev runtime routes both report their real capability
  status without weakening each other;
- status identifies project and missing/ready states;
- bootstrap returns structured bootstrap state, MCP tool catalog, SOP pack, hard
  gates, session ref, first domain SOP, and current-domain next actions;
- Codex follows the current domain SOP through relationship tools before Recipe
  submission;
- Codex submits knowledge and completes dimensions;
- rejected weak Recipes are returned with rebuild instructions and never count
  toward dimension completion;
- after dimension completion, Codex receives the next domain SOP, final review
  SOP, or repair SOP;
- accepted Recipes are inspected for real source anchors, relationship evidence,
  concrete future-agent guidance, validation guidance, and rejection of shallow
  or generic content; the audit is quantified (user-confirmed 2026-06-12): all
  rejected samples plus at least 10 accepted samples per acceptance run;
- health shows knowledge created;
- source graph tools answer real relationship queries;
- rescan after a controlled edit updates graph/freshness;
- Dashboard shows the workflow state;
- failure branches are verified with raw MCP outputs.
- final acceptance uses in-host Codex MCP calls; manual stdio probes are
  diagnostic evidence only.
- if the real Codex agent produces low-value Recipes or cannot follow the SOP
  without guessing, CKG7 requests rework on the owning CKG slice and repeats the
  real agent test after repair.

## Completion Definition

The requirement is complete only when all of these are true:

- A Codex user can cold-start Alembic knowledge for a target project through
  AlembicPlugin without manually understanding internal Core/daemon details.
- `alembic_bootstrap` returns structured bootstrap state that describes project
  identity/scope, runtime readiness, source graph state, MCP tool capabilities,
  SOP pack, domain queue, current domain SOP, hard gates, bootstrap session,
  progress, repair state, and current-domain next actions.
- The user can choose "reset old knowledge and rebuild" through an explicit
  reversible MCP operation.
- The cold-start path creates or refreshes both Recipe knowledge and source graph
  facts needed by Codex.
- Relationship tools expose real syntax/code relationships with compact clean
  outputs and freshness semantics.
- Codex-visible source relationship tools are canonicalized: stale
  `alembic_call_context` is removed or blocked only by current external consumer
  proof; standalone `alembic_affected_tests` is folded into
  `alembic_validation_plan` or retained only with consumer/owner/cleanup proof;
  `alembic_graph` is knowledge graph only.
- Recipe production uses source graph evidence but remains semantically distinct
  from graph indexing.
- Bootstrap-created Recipes are source-grounded, project-specific, content-rich,
  instructionally useful, and reject generic filler, fake snippets, shallow
  duplicates, and relationship claims without evidence.
- Recipe rejection is fail-closed and rebuild-oriented: rejected candidates do
  not persist as staged knowledge, do not count toward dimensions, and return a
  specific repair or rebuild path.
- Post-bootstrap `intent`, `prime`, `search`, `structure`, graph tools, Guard,
  Decision Register, and Dashboard all work as one coherent lifecycle.
- Real scenario validation proves the flow through actual Codex MCP calls, raw
  outputs, bootstrap state readback, staged domain SOP handoff, relationship
  tool use, knowledge counts, graph queries, and Dashboard/progress evidence.
- Real Codex-agent validation proves the generated Recipes are useful enough for
  later agent work; if not, the relevant CKG slice is reworked and retested
  until quality passes or a hard blocker/user decision is recorded.
- The system can distinguish `staging` candidates, active Recipes, generated
  skills, and prime-visible knowledge.

## Validation Requirements

Minimum validation must include:

- targeted unit/contract tests for Core source graph lifecycle and query shapes;
- Plugin MCP schema/output tests for every public source relationship tool;
- bootstrap session tests covering dimension creation, submission, completion,
  and missing-session failures;
- status/health tests for uninitialized, ready, stale, degraded, wrong-scope, and
  blocked states;
- a real Codex/plugin smoke covering `status -> bootstrap -> submit knowledge ->
  dimension complete -> graph query -> health`;
- a real Codex agent cold-start run with transcript/tool-output evidence,
  accepted/rejected Recipe sample audit, and repeat-after-rework proof when the
  first result is below the quality contract;
- a reset/rebuild smoke proving old knowledge can be cleared without manual data
  directory editing;
- a rescan/edit smoke proving stale and refreshed graph behavior;
- a host-transport recovery smoke proving `Transport closed` does not require a
  manual stdio client for normal users;
- Dashboard observation or screenshot/report evidence for cold-start progress and
  graph/Recipe state.

## Open Controller Decisions

Resolved by user/controller confirmation on 2026-06-11:

- Mission Briefing remains, but as staged domain SOPs rather than one large
  project-information bundle.
- Project architecture and implementation facts should come from Alembic tools;
  SOPs should tell the agent which tools to use and what evidence to extract.
- `BootstrapPackage` may remain as compact machine-readable bootstrap state,
  domain queue, gates, session, progress, and repair refs; it should not become
  a static project architecture dump.
- Stale/overlapping MCP relationship tools should be deleted or hidden by
  default when canonical replacements exist, with compatibility only for proven
  current consumers.
- Weak, generic, fake, or poorly evidenced Recipes must be rejected and rebuilt,
  not staged or counted toward dimension completion.
- Execution scope is only this CKG requirement sequence; unrelated RC cleanup is
  explicitly out of scope for this demand.

Resolved by user confirmation on 2026-06-12:

- SOP generation keeps LLM participation, clarified the same day as
  LLM-assisted authoring of authoritative, multi-language domain SOP content
  at design/development time; the runtime renders templates plus bootstrap
  state with no server-side LLM call on the default provider-free route.
  Content baseline:
  [domain-sop-baseline-2026-06-12.md](domain-sop-baseline-2026-06-12.md).
  State-grounded structured sections, size budgets, section-contract
  consistency tests, and code-enforced gates remain.
- Dispatch-order recommendation accepted: CKG2 before CKG1, or parallel with a
  frozen Core/Plugin interface. (`dependsOn` unchanged — both still depend only
  on CKG0; 2026-06-12 code facts shrink CKG2 to Ghost/PathGuard support plus
  lifecycle wiring and durable-population proof.)
- Default cold start is graph-first; a degraded Recipe-only bootstrap is
  allowed only when sourceGraph is unavailable, with every candidate explicitly
  marked as raw-read fallback evidence.
- The repeatable real-Codex sample project is owned and managed by the Test
  window: fixed, small (single run under roughly 30 minutes), with a known
  call-relationship structure.
- Mandatory Dashboard scope for CKG7 acceptance is the `BootstrapProgressView`
  increment (source graph freshness, skill-export-skip policy state, session
  recovery state); other views are later visual refinements.
- `alembic_graph` keeps its name; CKG4 fixes the description only.
- Mechanism supplements are folded into the sections above as confirmed design
  content: canonical Core-owned dimension model, project-scoped bootstrap
  single-writer lease, generation-bound stale-evidence lifecycle,
  reconstruction-based session recovery with activity-sliding TTL, knowledge
  reset operation contract, taxonomy registry reuse, job-process-event-stream
  reuse, and the three-layer measurable quality rubric.

These should be decided during controller intake before dispatch:

- Whether source graph storage remains entirely Core-owned under the current
  ghost data root, or requires an Alembic daemon-owned long-lived writer for
  file monitor consistency. CKG0 adds a probe of the file-monitor /
  source-graph write transaction boundary to settle this with facts.
- Whether to split CKG1 at intake into a small onboarding/status/reset
  contract slice and a staged-SOP-engine slice (sequence-structure change; not
  yet decided).
