# CodeGraph-Inspired Alembic Codex Knowledge Base Capability

Status: confirmed design direction, expanded discussion draft updated 2026-06-10
Created: 2026-06-10
Scope: AlembicPlugin and AlembicCore
Non-scope: product code edits, active Wakeflow dispatch, compatibility with old broken MCP fields

## User Goal

Learn from `colbymchenry/codegraph` and use it as an external reference for a
clean, local-first Codex knowledge-base capability in Alembic. The goal is not
to copy CodeGraph, and not to create a thin minimal interface. The goal is to
identify what AlembicPlugin and AlembicCore are missing today, then design a
real landing plan that lets Codex quickly understand source code through a
stable, compact, accurate tool surface.

Final desired behavior:

1. Codex can ask Alembic one structural question and receive the relevant source
   ranges, symbols, relations, callers/callees, impact radius, freshness state,
   and next verification suggestions.
2. AlembicCore owns deterministic source graph indexing and query contracts.
3. AlembicPlugin owns the Codex-facing MCP tools, clean output projection,
   server guidance, and project/root routing.
4. Existing Alembic knowledge, Recipe, SourceRef, Guard, and Decision Register
   capabilities remain intact and become better connected to code facts.

## Current Confirmations

Confirmed by user on 2026-06-10:

- The demand should continue beyond the current CGK-0 through CGK-14 plan and
  become a long-running unattended optimization track.
- The solution must be full-function optimization, not a thin minimum viable
  loop and not an interface-only shell.
- The design must separate two directions: knowledge-base construction/freshness
  and knowledge-base use/code-logic relationship use.
- CodeGraph should be studied through real source, but Alembic's own
  intent/prime/work/guard/decision lifecycle remains a first-class architecture
  spine.
- The plan must preserve function completeness, clean responsibility ownership,
  clear semantics, connectivity checks, and explicit boundary/failure behavior.

## CodeGraph Pattern Worth Learning

Observed from the public CodeGraph repository:

- It positions itself as a pre-indexed local code knowledge graph for agentic
  coding, intended to reduce repeated file reading and grep-style exploration.
- Initialization creates a local `.codegraph/` project directory and an initial
  graph build can be requested during `codegraph init -i`.
- Its core value proposition is a local SQLite graph of symbols, files, and
  edges, backed by tree-sitter extraction and SQLite FTS5.
- It exposes Codex/Claude-facing MCP tools such as `codegraph_explore`,
  `codegraph_search`, `codegraph_callers`, `codegraph_callees`,
  `codegraph_impact`, `codegraph_node`, `codegraph_files`, and
  `codegraph_status`.
- The primary tool is not a raw table dump. `codegraph_explore` is described as
  answering broad code questions in one call by returning verbatim relevant
  source grouped by file, a relationship map, and blast radius.
- It has an `affected` flow that maps changed source files to likely affected
  tests through dependency traversal.
- It emits tight MCP initialize instructions that tell the agent when to use
  graph tools, when not to grep/read first, and how to interpret staleness.
- It treats the graph as local assistance, not correctness proof. Its own
  instructions mention index lag, best-effort resolution, and that it does not
  replace live validation.

The lesson for Alembic is not just "add more tools". The stronger lesson is:
build a source graph that is locally fresh, make it the first-class agent
context path, return source plus relationships in one compact answer, and attach
clear freshness/limitation semantics.

## CodeGraph Cold-Start And Incremental-Sync Logic To Reuse

The implementation-level pattern worth applying to AlembicPlugin is:

- Initialization creates local graph storage first, then builds the initial
  index by default. The index is not treated as optional decoration after setup.
- MCP startup stays lightweight. CodeGraph delays loading heavy SQLite, parser,
  query, and context layers until a project actually needs to be opened, so
  initialize/tools-list can return quickly.
- One MCP engine owns the project graph, watcher, and tool handler. Multiple
  sessions share that state instead of starting one watcher/index writer per
  session.
- Opening an existing project immediately starts a catch-up sync for edits made
  while no watcher was running. The first tool call waits on that one-shot gate
  before serving, but sync failures do not crash the MCP session.
- Full indexing is phased: scan source files, detect frameworks, parse in a
  worker path, write files/nodes/edges, resolve references, run post-extraction
  framework finalizers, run DB maintenance, and stamp the index with the engine
  version that built it.
- Incremental sync is filesystem-reconciled, not only git-status-driven. It
  scans current source files, detects removals, skips unchanged files with a
  size/mtime pre-filter, confirms changes by content hash, parses only changed
  files, then resolves references only for changed files when possible.
- The watcher is source-file-only, uses the same ignore rules as the indexer,
  debounces changes, keeps resource usage bounded per platform, and maintains a
  per-file pending list.
- Tool responses do not wait for every debounce window. If a response references
  a file still pending sync, the response includes a stale-file warning telling
  the agent to read only those files directly while trusting the rest.
- Status exposes initialized state, index stats, DB backend/journal mode,
  pending changes, pending sync files, and index-version staleness.
- If watching is disabled or unreliable, setup explains that the index will not
  update itself and offers manual sync or git-hook fallback rather than silently
  presenting stale graph data as ready.

For Alembic, this means Plugin cold start must not only say "needs bootstrap" or
"ready". It should establish a source graph lifecycle: quick MCP availability,
background source-graph catch-up, a first-tool freshness gate, clear stale-file
signals, and a fallback scan path when live watching is unavailable.

## CodeGraph Codex-Agent Knowledge-Base Interaction Reference

The most useful CodeGraph pattern for Alembic is how it connects three separate
things without mixing their responsibilities:

1. agent installation, so Codex can launch the MCP server;
2. project knowledge-base initialization, so there is a local graph to query;
3. MCP runtime guidance, so the agent chooses graph tools before falling back to
   raw file reading.

Alembic should learn this separation directly. A Codex MCP entry alone is not a
knowledge base. A local graph database alone is not agent adoption. A long
manual in `AGENTS.md` is not a reliable tool-selection contract. The complete
loop is: install the MCP connector, initialize the project source graph, expose
fast tool discovery, guide the agent through MCP initialize instructions, and
keep graph freshness visible during edits.

### Codex Installation Is Only The Connector

CodeGraph's Codex target writes a global MCP server entry to
`~/.codex/config.toml` under `[mcp_servers.codegraph]`. It treats Codex as a
global-only host because the Codex CLI target has no project-local config path
in that implementation. The installer uses a narrow TOML updater that replaces
only the CodeGraph MCP table and preserves unrelated user config.

The important design choice is that CodeGraph no longer writes the tool playbook
into `~/.codex/AGENTS.md`. Current install removes older marker-delimited
CodeGraph instruction blocks because usage guidance is delivered through the MCP
server's `initialize` response. This avoids two competing instruction surfaces:
Codex discovers the tool through config, then receives current server guidance
from the actual MCP runtime.

For AlembicPlugin, the equivalent does not have to be a direct
`~/.codex/config.toml` writer if the Codex plugin runtime already supplies the
MCP server. But the same contract is required:

- one authoritative host-entry route for the Alembic MCP server;
- no duplicate long tool manuals scattered into global or project `AGENTS.md`;
- install/refresh output that says which MCP entry or plugin bundle is active;
- cleanup of obsolete tool guidance when a new MCP guidance path replaces it;
- no compatibility with old broken fields unless a current consumer still needs
  them.

### Project Initialization Establishes The Knowledge Base

CodeGraph separates agent configuration from project initialization. The agent
may know how to launch `codegraph`, but a repository is not useful until local
graph storage exists and the initial index has been built. Its project
initialization creates `.codegraph/`, runs a full index, reports indexed files,
errored files, and symbols, then configures a watch fallback when live watching
cannot keep the graph fresh.

This matters for Alembic because current Plugin setup mainly establishes Alembic
runtime config and syncs markdown knowledge into the DB. That is a different
capability from source-code graph initialization. The new source graph flow
should therefore be explicit:

- `installed`: Codex can see and launch the Alembic MCP server.
- `runtimeReady`: Alembic data root and project trust/config are ready.
- `knowledgeSynced`: Recipes, decisions, candidates, and knowledge markdown are
  indexed.
- `sourceGraphInitialized`: source graph storage exists for the target repo.
- `sourceGraphIndexed`: source files, symbols, edges, and source ranges were
  built for a generation.
- `sourceGraphFresh`: catch-up sync or watcher state proves the graph is not
  silently stale for the requested files.

Those states should be separate in status output. A project can have Recipes but
no source graph. A project can have a source graph but stale Recipe knowledge. A
tool that needs source ranges should not silently proceed based only on generic
Alembic setup readiness.

### MCP Initialize Teaches The Agent How To Use The Knowledge Base

CodeGraph emits server-level `instructions` in the MCP `initialize` response.
Those instructions are short enough to be read every session, but specific
enough to shape the agent's behavior:

- use `codegraph_explore` first for most broad code questions;
- treat `codegraph_node` as a Read-equivalent for indexed source files;
- use graph callers/callees/impact for relationship questions;
- use status for freshness and pending sync;
- avoid grep/read loops when the graph already answered the structural query;
- fall back to raw reads only for non-indexed files or files explicitly marked
  stale.

This is stronger than just exposing tool descriptions. It gives the host agent a
small decision tree before any tool call, while individual tool descriptions
still explain tool-specific schemas. It is also safer than project-wide prose
because the instructions come from the exact server version and exposed tool
surface.

For AlembicPlugin, MCP initialize guidance should become a first-class part of
the source graph design:

- source graph tools for code facts and source ranges;
- knowledge/Recipe tools for project memory, standards, and decisions;
- Guard tools for code-standard checks;
- Wakeflow remains outside ordinary source exploration and must not be confused
  with product acceptance;
- raw file reads remain valid for docs/configs/non-indexed files or stale
  source files named in a result banner;
- validation still belongs to tests, typecheck, lint, Guard, or Test-window
  scenarios, not to graph results alone.

The guidance must be generated from the real tool catalog. If
`alembic_code_impact` is disabled or not shipped, initialize instructions should
not mention it. If tiny-repo or degraded mode hides some tools, the visible
guidance should match the visible tool list.

### Fast Handshake Prevents Agent Fallback To Raw Reads

CodeGraph's local-handshake proxy answers `initialize` and `tools/list`
immediately with server instructions and a static tool list, while the shared
daemon connects in the background. Tool calls are then forwarded to the daemon.
If the daemon is unavailable or disappears, the proxy serves calls through an
in-process engine instead of leaving the host hanging.

This solves a real agent-behavior problem: if `tools/list` is slow or fails
during the first turn, a headless coding agent may assume the tool is missing
and fall back to grep/read. For a knowledge-base product, first-turn tool
visibility is part of correctness, not just performance.

AlembicPlugin should adopt the principle even if the implementation differs:

- MCP initialize and tool list must be available before heavy source graph open,
  full indexing, or watcher startup;
- tool calls that need the graph may wait on a bounded catch-up gate, return a
  clean `needs_source_graph_init` action, or return a degraded result;
- no startup path should close the MCP transport simply because a graph open,
  repo trust check, watcher, or background daemon failed;
- uninitialized and degraded responses should be small, actionable, and
  operation-specific.

### Runtime Session Resolves The Project Root Deliberately

CodeGraph does not blindly trust process cwd as the only project signal. During
MCP initialize it considers client-provided `rootUri`, `workspaceFolders`, and an
explicit project path. If the project is still unresolved when tools are listed
or called, it may ask the client for roots and finally retry by walking from the
best candidate. It also re-tries so a project initialized after server startup
can be discovered without restarting the host.

AlembicWorkspace is more complicated than a single repo. The same idea needs an
Alembic-specific contract:

- `projectRoot` is required for source graph tools in multi-repo workspaces, or
  the tool must return a workspace inventory instead of choosing a random repo;
- `repoId` and window responsibility should be visible in outputs;
- root mismatch should be a fail-closed clean error, not a best-effort graph
  query against the wrong sibling;
- per-repo source graph engines must not leak watchers, caches, or status across
  sibling repositories.

### Agent Guidance And Tool Output Must Reinforce Each Other

CodeGraph uses both instructions and tool descriptions to steer the agent. The
primary `explore` tool says to call it first for almost any question and to
treat returned source as already read. Status exposes pending sync and index
health. Staleness banners only ask the agent to raw-read the specific pending
files, not to distrust the whole graph.

Alembic should apply that as an output contract:

- source graph status answers lifecycle and freshness questions;
- source exploration answers code understanding questions with source plus
  relationships;
- source node retrieval answers file/symbol reading questions;
- impact and affected-tests answer validation planning questions;
- diagnostics are separated from business data;
- each tool returns only fields needed for that operation.

This also answers the user's earlier concern about generic `refs` objects. A
tool should not inherit every possible ref field from a shared envelope. If a
tool does not need `decisionRef`, `guardRef`, or `detailRefs`, it should not
return them. Shared envelope fields may exist in Core types, but Plugin
projection must be per-tool and allow-list based.

## CodeGraph Learning Sufficiency Judgment

The current CodeGraph study is useful, but not yet sufficient for a full
Alembic implementation program.

What is already sufficiently understood:

- Codex host entry: CodeGraph installs an MCP server entry for Codex and avoids
  duplicating long guidance into `AGENTS.md`.
- MCP agent guidance: CodeGraph uses the MCP `initialize` response to teach the
  host agent which graph tool to use first.
- Cold start: CodeGraph keeps handshake/tool discovery fast and defers heavy
  project graph opening.
- Freshness headline: CodeGraph combines connect-time catch-up, watcher pending
  files, and per-result stale-file banners.

What is not yet sufficiently learned:

- the exact data model and migration contract behind the graph;
- the extraction pipeline and language/framework-specific resolution strategy;
- the ranking logic that turns a natural-language agent query into the right
  source files and symbols;
- the output-budget logic that makes one large graph answer cheaper than many
  raw reads;
- the evaluation harness that proves agents actually adopt the tool and reduce
  Read/Grep usage;
- the `affected` implementation and its limits for test selection;
- security and failure controls such as path validation, config-value
  redaction, lock handling, WAL/journal diagnostics, and worktree mismatch
  notices.

Therefore, CodeGraph is currently a strong reference, but Alembic should not
promote implementation from the current study alone. CGK-0 must include a deeper
source-code study before CGK-1 or CGK-2 designs are treated as complete.

### Additional CodeGraph Implementation Areas To Learn

These areas should be added to the required external-reference audit.

1. Storage, schema, and migrations

   CodeGraph persists a local SQLite graph with explicit tables for symbols,
   edges, files, unresolved references, schema versions, and project metadata.
   Its file table stores content hash, size, modified time, indexed time, node
   count, and parse errors. Its node table stores source ranges, signatures,
   export/async/static/abstract flags, decorators, type parameters, and return
   type. It also keeps FTS5 search tables and migration history.

   Alembic must learn this before defining Core source graph contracts. Without
   a stable storage/migration story, Plugin tools will only be wrappers over
   transient in-memory analysis.

2. Extraction scope and file inventory

   CodeGraph's scanner is opinionated. It prefers git-visible files, handles
   tracked and untracked files, recurses into embedded repositories, respects
   `.gitignore`, applies built-in default ignores to dependency/build/cache
   directories, validates UTF-8 `.gitignore` content defensively, falls back to a
   filesystem walk for non-git projects, skips large source files, and uses
   source-file detection as a shared rule for indexer and watcher.

   Alembic must decide its equivalent for multi-repo workspaces. This cannot be
   left to a broad `projectRoot` scan.

3. Parser and worker robustness

   CodeGraph parses with tree-sitter across many languages, uses worker
   isolation, parse timeouts, worker recycling, grammar loading by language, and
   partial failure reporting. It treats unsupported languages, generated files,
   huge files, and parse errors as explicit degraded coverage rather than
   silent absence.

   Alembic needs the same kind of coverage semantics, even if the first
   implementation supports fewer languages.

4. Reference resolution and dynamic edge synthesis

   CodeGraph's graph quality comes from more than AST extraction. It resolves
   imports, aliases, framework routes, re-exports, workspace packages, Go modules,
   chained calls, cross-language bridges, and dynamic-dispatch patterns. It
   synthesizes edges for callbacks, event emitters, React render hops, Vue
   handlers, closure collections, Go cross-file method ownership, Kotlin
   `expect`/`actual`, Expo cross-platform modules, and React Native native
   bridges. Heuristic edges carry provenance and metadata so output can tell the
   agent why an edge exists.

   Alembic should not claim "impact" or "flow" parity unless it has an explicit
   plan for deterministic edges, heuristic edges, provenance, and unsupported
   dynamic-dispatch gaps.

5. Query understanding and ranking

   CodeGraph's `explore` result is not raw search output. It combines exact
   symbol matching, text search, stem variants, project-name down-weighting,
   co-location boosts, path relevance, test/generated-file deprioritization,
   named-symbol seeding, graph-connectivity ranking, and low-confidence handoff
   notes. It avoids bluffing when a prose query only matches common words.

   Alembic's source graph tools should treat ranking as a first-class contract.
   A simple FTS result list would not satisfy the intended agent experience.

6. Output budget and Read parity

   CodeGraph designs outputs around agent behavior. `codegraph_node` can return
   file source in the same line-number shape as Read, with offset/limit behavior.
   It withholds config/data values that may contain secrets. `codegraph_explore`
   groups relevant source by file, adds call paths and blast radius, uses
   adaptive budgets, collapses noisy or redundant structures, and states overflow
   explicitly instead of silently truncating.

   Alembic should define per-tool source budgets, truncation rules, skeleton vs
   full-body rules, and line-number/edit safety semantics before building MCP
   tools.

7. Freshness, locking, and concurrency

   CodeGraph uses an index mutex, file lock, WAL status, first-tool catch-up,
   watcher pending files, and a conservative stale-file policy. The watcher
   leaves pending files intact on sync failure and prefers false positives
   over false negatives, because telling the agent to re-read one file is safer
   than presenting stale source as fresh.

   Alembic should copy the policy idea, not the exact code: source graph outputs
   need enough freshness evidence to know when graph data can be trusted.

8. Worktree and project-root mismatch

   CodeGraph warns when an index belongs to a different git working tree than
   the caller's effective project. It also avoids opening duplicate DB
   connections for the same project when `projectPath` resolves back to the
   default graph.

   AlembicWorkspace has sibling repositories and window-specific responsibility,
   so this area is mandatory. Wrong-repo answers are worse than no answer.

9. Affected-test selection

   CodeGraph exposes `codegraph affected` as a CLI/CI flow. It takes changed
   files from args or stdin, traverses file dependents breadth-first with a depth
   limit, identifies tests by default patterns or a custom glob, and outputs JSON
   or file paths. This is useful, but it is not proof that every required test is
   known.

   Alembic's future `alembic_affected_tests` should return confidence, traversal
   depth, unknown edges, matched test patterns, and validation command
   recommendations. It must not present graph-derived test files as acceptance.

10. Agent evaluation harness

   CodeGraph includes A/B scripts that run headless agent sessions with and
   without CodeGraph, parse JSONL transcripts, count CodeGraph tool use,
   Read/Grep/Glob calls, payload, token usage, cost, time, and cold-start races.
   README benchmark claims are backed by this style of measurement, not just
   subjective inspection.

   Alembic should add an equivalent acceptance harness. The key metric is not
   "tool returned data"; it is whether Codex chooses the source graph path and
   reduces broad raw reading while still producing correct answers.

11. Security and diagnostic boundaries

   CodeGraph validates paths, blocks traversal/symlink escapes for source reads,
   bounds input sizes, avoids raw config value dumps, records backend/journal
   status, and gives actionable uninitialized-project errors.

   Alembic source graph tools must define these boundaries up front. Clean output
   is not only brevity; it is also avoiding accidental secrets, wrong roots, and
   misleading diagnostics.

## Current Alembic Evidence

### AlembicCore Already Has Pieces

AlembicCore has non-trivial structural analysis code:

- `AlembicCore/src/core/ast/ProjectGraph.ts` builds a tree-sitter project graph,
  scans source files, indexes classes/protocols/categories, and exposes query
  methods. It is designed as a bootstrap-time, read-only component and defaults
  to 500 files and 500 KB per file.
- `AlembicCore/src/core/analysis/CallGraphAnalyzer.ts` orchestrates
  `CallSiteExtractor`, `SymbolTableBuilder`, `ImportPathResolver`,
  `CallEdgeResolver`, and `DataFlowInferrer`. It supports full and incremental
  analysis, records changed and affected files, and has tiered behavior for
  large projects.
- `AlembicCore/src/service/knowledge/CodeEntityGraph.ts` persists code entities
  and relationships such as class/protocol/category/module/pattern plus
  `calls` and `data_flow` edges. It also provides entity search, edge lookup,
  inheritance, descendants, conformances, and path queries.
- `AlembicCore/src/service/knowledge/KnowledgeGraphService.ts` owns Recipe and
  knowledge relationship impact analysis.
- `AlembicCore/src/service/search/SearchEngine.ts` integrates keyword, BM25-like
  recall, optional vector/semantic search, and `recipe_source_refs` enrichment
  for knowledge entries.
- `AlembicCore/src/service/knowledge/KnowledgeSyncService.ts` treats markdown
  knowledge files as source of truth and SQLite as an index cache. Current code
  comments also show full SourceRef scanning was removed, with path impact
  expected to come from reactive evolution events.

These are strong foundations. The missing part is not "no graph exists". The
missing part is a stable, productized, Codex-first source knowledge graph that
connects these pieces into one reliable query surface.

### AlembicPlugin Already Exposes Related Tools

AlembicPlugin declares and routes:

- `alembic_structure`, currently focused on project targets, target files, and
  metadata.
- `alembic_graph`, currently described and routed as Alembic knowledge graph
  query/impact/path/stats.
- `alembic_call_context`, currently querying method call chains through
  `CodeEntityGraph`.
- clean output allow-lists for these tools in
  `AlembicPlugin/lib/codex/mcp/core-tools/output.ts`.

Live probe evidence from 2026-06-10:

- `alembic_graph stats` returned a ready clean output with 2702 total edges and
  relation buckets including `calls`, `data_flow`, `depends_on`, `inherits`,
  `conforms`, `extends`, and `uses_pattern`.
- `alembic_call_context` for `callContext` returned ready output but empty
  callers/callees, despite the code containing a handler with that name.
- `alembic_structure` at the workspace root returned Swift target summaries
  rather than an AlembicPlugin/AlembicCore source map, showing project-root and
  workspace-scope routing can be ambiguous.
- A parallel sub-repository probe of `alembic_structure` and
  `alembic_call_context` for AlembicPlugin/AlembicCore closed the MCP transport,
  which should be treated as a runtime robustness observation, not as user
  failure.

Plugin cold-start evidence:

- `AlembicPlugin/lib/codex/mcp/CodexMcpServer.ts` has init-on-demand flow,
  project-root trust checks, an initialization promise, and `SetupService`
  execution before certain tools.
- `AlembicPlugin/lib/cli/SetupService.ts` writes runtime config with
  `watch.enabled: false` and syncs knowledge markdown into the DB during setup.
- `AlembicPlugin/lib/cli/KnowledgeSyncService.ts` is currently a markdown
  knowledge sync path for candidates/recipes, not a source graph indexer.
- `AlembicPlugin/lib/codex/ToolPolicy.ts` already distinguishes
  `needs_init`, `needs_bootstrap`, `bootstrap_running`, `ready_stale`, and
  `ready_refreshing`, which can be reused for source-graph lifecycle signals.
- `AlembicPlugin/lib/service/FileChangeDispatcher.ts` dispatches explicit file
  change events to subscribers, but it is not a CodeGraph-style long-lived,
  per-project source watcher with pending-file stale banners.

This confirms that Alembic has graph data and related MCP tools, but does not
yet have the CodeGraph-style "agent asks one source-code question and gets the
right local source graph context" capability.

## Alembic-Specific Target Architecture

The target architecture should not be "CodeGraph inside Alembic". It should be
an Alembic source-knowledge layer that uses CodeGraph as a reference while
respecting the current Core/Plugin split.

### Two Knowledge Bases, One Linked Experience

Alembic currently has a Recipe/knowledge base and partially materialized code
graphs. These should become two explicitly different indexes:

- Recipe knowledge index: durable project memory, standards, decisions,
  candidate knowledge, lifecycle, SourceRefs, Guard rules, and skill export.
- Source graph index: files, symbols, source ranges, imports, calls, ownership,
  implementation edges, impact radius, affected tests, parse coverage, and
  freshness.

They must be linkable but not merged. A Recipe may point to source graph nodes
through SourceRefs, and a source graph query may surface matching Recipes as
secondary context, but source graph freshness must not be inferred from Recipe
sync freshness. This directly addresses the current risk where "Alembic ready"
can mean markdown knowledge is synced while source graph evidence is missing or
stale.

### Core Owns The Source Graph Product Spine

AlembicCore should consolidate existing `ProjectGraph`, `CallGraphAnalyzer`,
`CodeEntityGraph`, project snapshot, and project-intelligence workflow pieces
behind a stable source graph spine. That spine should be exported as a public
Core package surface, for example `@alembic/core/source-graph`, rather than
requiring AlembicPlugin to import or stitch internal implementation classes.

The Core spine should include:

- `SourceGraphRepository`: storage access for source files, symbols, edges,
  parse errors, generations, pending changes, and graph metadata.
- `SourceGraphIndexer`: full build, incremental build, changed-file reconcile,
  parser/error accounting, and graph generation stamping.
- `SourceGraphQueryService`: exact symbol search, natural-language query
  retrieval, file/symbol node retrieval, callers/callees, impact, and affected
  tests.
- `SourceGraphFreshnessService`: content hash, mtime, watcher pending files,
  first-open catch-up status, stale-file decisions, and rebuild-needed reasons.
- `SourceGraphContracts`: DTOs, validators, fixtures, and output-neutral
  operation results consumed by Plugin, Guard, future Dashboard, and tests.

Core should not own Codex MCP names, tool descriptions, MCP initialize
instructions, plugin config, market/channel packaging, or host-specific
project-root prompting. Those remain Plugin responsibilities.

### Plugin Owns Codex Adoption And Runtime Behavior

AlembicPlugin should make the Core source graph useful to Codex. Its job is not
to reimplement indexing, but to make the host agent reliably choose and trust
the correct source graph tools.

Plugin responsibilities:

- register the source graph tools in `PluginToolSurfaceCatalog` with owner,
  knowledge/source-graph gate, handler owner, route policy, and annotations;
- expose compact MCP initialize guidance generated from the actual visible tool
  catalog;
- keep MCP `initialize` and `tools/list` fast even before Core opens SQLite,
  parser, watcher, or project graph services;
- resolve `projectRoot`/`repoId` deliberately and fail closed for workspace-root
  ambiguity;
- keep one per-project source graph runtime/session, not one watcher/indexer per
  tool call;
- wait on bounded catch-up before source graph reads, or return an
  operation-specific degraded response;
- project each Core operation result into a clean per-tool MCP output shape;
- keep status and diagnostics small, actionable, and separate from business
  source graph results.

This is where CodeGraph's Codex interaction model matters most. CodeGraph wins
not only because it has a graph, but because the MCP server tells the agent to
use the graph first, responds quickly enough that the agent does not abandon the
tool, and returns source in a Read-equivalent shape when the graph is fresh.

### Source Graph Tool Taxonomy

The future MCP surface should be grouped by user intent, not by internal
implementation table.

| User intent | Preferred tool family | Core dependency | Output emphasis |
| --- | --- | --- | --- |
| Understand an area or flow | `alembic_code_explore` | query ranking, source sections, graph trail | relevant source grouped by file, relation map, confidence, freshness |
| Find a symbol | `alembic_symbol_search` | symbol index, FTS, exact match | locations only, no large code |
| Read one file or symbol | `alembic_source_node` | file/symbol node retrieval | Read-equivalent lines, direct relations, stale-file banner |
| Trace calls | `alembic_callers` / `alembic_callees` | call edges and source ranges | callers/callees with line ranges and snippets |
| Plan a change | `alembic_code_impact` | reverse edges, ownership, SourceRefs | impacted files/symbols/recipes/tests and unknown edges |
| Plan validation | `alembic_affected_tests` | file dependents and test detection | must-run, recommended, manual review, unknown |
| Debug graph health | `alembic_source_graph_status` | freshness and generation state | lifecycle, pending files, parse coverage, next action |

Existing `alembic_structure`, `alembic_graph`, and `alembic_call_context` should
not be deleted during the first landing. They should be classified as existing
structure/knowledge/call-context tools, then either backed by the new Core
spine or migrated once the new source graph tools have real consumers and
acceptance evidence.

### Current Code Issues To Correct During Implementation

The design must include cleanup of current code behavior found during this
study, because otherwise new tools will inherit old ambiguity.

- `AlembicPlugin/lib/codex/mcp/handlers/structure.ts` sets
  `result.callers = ceg.getCallers(...)`, `result.callees = ceg.getCallees(...)`,
  and `result.impact = ceg.getCallImpactRadius(...)` without awaiting the async
  methods. This can return unresolved promises or empty-looking data through the
  MCP projection path. The future call-context/source-node implementation must
  add direct tests for real resolved arrays.
- `alembic_call_context` accepts only `methodName` and does not include file,
  class/container, line, language, or symbol id disambiguation. CodeGraph's
  `node`/`explore` behavior shows why ambiguous symbols need file/line
  pinning.
- `alembic_graph` mixes Recipe/knowledge graph semantics with code graph
  relation names such as `calls` and `data_flow`. The new source graph surface
  should not overload a Recipe graph tool name with source graph expectations.
- `ProjectGraph` is documented as bootstrap-time and read-only, with defaults
  such as 500 files and 500 KB per file. This is useful for bootstrap analysis
  but not sufficient as a continuously fresh source graph product.
- `CodeEntityGraph` materializes code entities into `knowledge_edges`, which is
  pragmatic today but makes source graph lifecycle, provenance, and freshness
  hard to separate from Recipe graph lifecycle. CGK-1/CGK-2 should decide
  whether to add dedicated source graph tables or a clearly versioned layer over
  existing tables.
- `KnowledgeSyncService` is markdown knowledge sync, not source graph sync.
  Plugin cold start must not treat it as evidence that source files, symbols, or
  call edges are current.
- `SetupService` currently writes runtime config and initializes knowledge/vector
  support, while source watching is not a source-graph product path. Source graph
  cold start needs a separate lifecycle and status projection.
- Current Core exports expose many project-intelligence and analysis pieces, but
  no stable `source-graph` package entry exists. Adding a public source graph
  entry should be part of the landing plan, with boundary tests like the
  existing Core package tests.

### Design Rules Learned From CodeGraph But Adapted To Alembic

- Prefer one primary source exploration tool over a dozen broad search loops,
  but keep targeted follow-up tools for callers, callees, nodes, status, and
  affected tests.
- Return source only when it is relevant to the operation. Compactness comes
  from query planning, source-range clustering, skeletonizing low-value
  structures, and per-tool field allow-lists, not from arbitrary character
  trimming.
- Treat source graph outputs as context and planning evidence. They are not
  proof that code is correct, tests passed, or Wakeflow acceptance is complete.
- Make staleness local to the files in the response. If one referenced file is
  pending sync, tell Codex to Read that file; do not poison the entire graph if
  the rest of the response is fresh.
- Prefer false-positive stale warnings over false-negative freshness. A small
  direct Read of one changed file is cheaper than a wrong edit plan from stale
  graph data.
- Keep path and root safety in Plugin output. Source tools should show repo
  labels and relative paths by default; absolute paths belong in diagnostics or
  local evidence, not broad business output.
- Do not preserve old broken MCP field compatibility. New source graph tools
  should ship clean schemas and projection tests from the start.

## Learning-To-Build Program

The learning route should be a product-building program, not a research note.
Each learning unit must produce a design decision, an owner, a code target, and
acceptance evidence.

## Two Build Directions

This demand must stay split into two construction directions. They interact, but
they should not be designed, dispatched, or accepted as one undifferentiated
"source graph" task.

### Direction 1: Knowledge Base Construction And Freshness

This direction answers: how does Alembic build, store, refresh, and prove the
knowledge base is current enough to use?

It includes:

- cold start and first index build;
- full and incremental scanning;
- parser/extractor execution;
- source file inventory and ignore rules;
- source graph storage and migrations;
- content hash, mtime, generation, and freshness state;
- watcher, catch-up sync, pending file list, and stale-file warnings;
- source graph status, diagnostics, rebuild, and recovery actions;
- transport/runtime hardening so MCP does not collapse while the index opens.

Primary owners:

- AlembicCore owns deterministic index/storage/query foundations and freshness
  contracts.
- AlembicPlugin owns host startup, per-project engine lifecycle, catch-up gate,
  watcher orchestration, status projection, and degraded MCP responses.

This direction is not responsible for deciding how the agent should reason
about a task, which Recipes matter, what code path is relevant to a user
question, or which validation should be recommended after work. It only makes
the knowledge base real, fresh, queryable, and recoverable.

### Direction 2: Knowledge Base Use And Code Logic Relationship Use

This direction answers: once Alembic has source/knowledge data, how should Codex
use it to understand the task, reason about code, plan work, and return clean
evidence?

It includes:

- `intent` classification of whether the task needs Recipe knowledge, source
  graph facts, Guard, decision recording, or status only;
- `prime` summarization of Recipes, Guard rules, decisions, and recommended
  source graph queries;
- source exploration, source node retrieval, callers/callees, impact, and
  affected-test planning;
- ranking and query understanding that map a natural-language task to relevant
  files/symbols/edges;
- code logic relationships such as calls, imports, ownership, data flow,
  implementation/conformance, route-to-handler, and symbol-to-test links;
- scoped work records, finish evidence, Guard recommendation, and decision
  recording based on refs;
- compact output contracts that return only the fields each operation owns.

Primary owners:

- AlembicPlugin owns the Codex-facing lifecycle and MCP tools:
  `intent`, `prime`, `work_start`, `work_finish`, `code_guard`,
  `decision_record`, and source graph tool projection.
- AlembicCore owns reusable ranking/query/relationship semantics when they are
  deterministic and useful outside the Codex host.
- Alembic runtime or future Agent/Dashboard consumers may use the same contracts
  only after the Core/Plugin path is stable.

This direction is not responsible for filesystem watching, DB migrations, parser
worker robustness, or keeping the graph fresh. It consumes freshness signals
from Direction 1 and decides how to present, combine, or reject source evidence
for a given agent task.

### Direction Boundary Rules

- Direction 1 can say "the graph is fresh/stale/unavailable"; Direction 2
  decides whether the current task can proceed, should re-read a file, should
  request refresh, or should block.
- Direction 1 can expose files, symbols, edges, generations, and parse coverage;
  Direction 2 chooses which of those matter for the user intent.
- Direction 1 must not emit Recipe/Guard/Decision conclusions. Direction 2 must
  not pretend a stale or missing source graph is valid.
- `alembic_source_graph_status` belongs mostly to Direction 1.
  `alembic_code_explore`, callers/callees, impact, affected tests, and
  intent/prime fusion belong mostly to Direction 2.
- Acceptance must review both: construction evidence proves the graph exists and
  is fresh; usage evidence proves the agent used it correctly and did not
  receive irrelevant or misleading output.

### Deep CodeGraph Lessons To Fold Into Direction 1

The latest source study shows that CodeGraph's construction path is not just a
background indexer. It is a set of explicit runtime semantics that the agent can
trust or reject.

Concrete lessons to adapt:

- Startup must keep MCP handshake fast. CodeGraph keeps static tool schemas and
  lazy-loads the heavy graph engine so `tools/list` and initialize do not wait
  for SQLite, parsers, or watchers. AlembicPlugin should mirror this: register
  source graph tools and status quickly, then lazily open Core source graph
  services only after repo identity is trusted and a source graph operation
  needs them.
- Catch-up sync is a first-tool boundary. CodeGraph records a one-shot
  `catchUpGate` after opening a project so the first real source query does not
  serve rows for files changed while the server was down. AlembicPlugin should
  have the same bounded gate for source graph calls, while status remains
  callable and can report `catching-up`, `catch-up-failed`, or `best-effort`.
- Watch policy is centralized. CodeGraph has a shared watch policy for env
  overrides, WSL `/mnt` disablement, and installer/MCP consistency. AlembicCore
  already reports file monitor modes such as `git-worktree`; source graph design
  should centralize the policy instead of scattering watcher checks across
  status, rescan, and MCP handlers.
- Worktree mismatch is first-class. CodeGraph detects when a request launched
  from one git worktree resolves to another worktree's index and prefixes tool
  responses with a warning. Alembic needs the same concept for ProjectScope:
  workspace root, current folder, repo id, graph root, data root, and git
  worktree root must be visible enough to fail closed.
- File inventory is a product contract. CodeGraph indexes git-visible tracked
  and untracked files, respects `.gitignore`, has a filesystem fallback, avoids
  generated/config/large-file noise, and records parse errors. Alembic should
  define equivalent include/ignore behavior per ProjectScope folder, not rely on
  incidental discoverer output.
- Parser robustness affects trust. CodeGraph bounds file size, parser timeout,
  worker recycling, extraction version stamps, and unresolved references.
  Alembic source graph status should report unsupported languages, parser
  failures, skipped large files, stale extraction version, and partial coverage
  as first-class freshness data.
- Git-hook fallback is optional and reversible. CodeGraph can install
  marker-delimited post-commit/post-merge/post-checkout hooks, but that is a
  user-visible integration choice. Alembic should not silently mutate hooks;
  any hook-like checkpoint must have dry-run, consent, marker ownership,
  uninstall, and no-block runtime semantics.

These are Direction 1 requirements because they decide whether the knowledge
base exists, is current, and can be trusted before any agent reasoning starts.

### Deep CodeGraph Lessons To Fold Into Direction 2

The latest source study also shows that CodeGraph's source graph is useful
because its tool outputs are task-shaped, not because it exposes all graph data.

Concrete lessons to adapt:

- `explore` is the primary code-understanding operation. CodeGraph's initialize
  guidance, tool descriptions, and output footer all steer the agent to use one
  `codegraph_explore` call for architecture, bugs, flows, and edit planning.
  Alembic should create an equivalent `alembic_code_explore` role instead of
  expecting Codex to chain search, structure, graph, and call-context tools
  manually.
- Read-equivalence must be explicit and honest. CodeGraph source sections are
  line-numbered, re-read from disk on call, and labelled as equivalent to a
  Read. Alembic source node/explore output should only make this claim when the
  returned lines are current enough under Direction 1 freshness semantics. If a
  file is pending sync, the result must say exactly which file is stale.
- Ranking is multi-signal. CodeGraph combines exact symbols, text terms,
  project-name downweighting, co-location, CamelCase/name variants,
  graph-connectivity ranking, generated/test downranking, and low-confidence
  handoffs. Alembic should make ranking a Core contract so Plugin, Agent, and
  Dashboard do not each invent different relevance semantics.
- Relationships should be operation-owned. CodeGraph `explore` includes compact
  relationships and blast radius because they help that operation; `search`
  returns locations only; `node` returns one file/symbol plus trail. Alembic
  tools should follow the same principle: each tool has an allow-list of owned
  fields and never returns "all refs" or every available number.
- Dynamic and heuristic edges require provenance. CodeGraph marks synthesized
  callback/event/render/interface hops and shows the registration site when
  available. Alembic source graph edges should separate deterministic parse
  edges from heuristic edges and expose provenance/confidence only where it
  helps the user avoid false certainty.
- Low confidence is a result state, not a hidden metric. CodeGraph tells the
  agent when a query matched mostly common words and suggests narrower symbol
  names. Alembic should surface `low-confidence-query`, `ambiguous-symbol`,
  `insufficient-graph-coverage`, and `unsupported-edge-class` as task-specific
  statuses or diagnostics.
- Evaluation must measure agent behavior. CodeGraph's agent-eval scripts parse
  transcripts for `codegraph_explore`, `codegraph_node`, Read, Grep/Bash,
  tokens, and sufficiency. Alembic acceptance should measure whether Codex uses
  source graph tools before broad Read/Grep and whether the answer/edit remains
  correct.

These are Direction 2 requirements because they decide how Codex consumes the
knowledge base, reasons about code logic, and returns compact evidence.

### Route A: CodeGraph Feature Study To Alembic Design Decision

For every CodeGraph subsystem, create a small design decision entry with four
fields:

- CodeGraph behavior: exact files studied and the runtime behavior observed.
- Alembic current state: existing Core/Plugin files, tool behavior, gaps, and
  any known failure evidence.
- Adaptation decision: reuse the idea, adapt it, defer it, or reject it.
- Build target: the AlembicCore contract, AlembicPlugin MCP surface, test
  harness, or future Dashboard/Agent consumer that should receive the change.

This prevents "we learned CodeGraph" from becoming abstract. A learning unit is
complete only when it changes the Alembic design backlog or explicitly explains
why it should not.

### Route B: Alembic Native Agent Lifecycle Design

Alembic already has agent-facing logic that CodeGraph does not have:
`alembic_intent`, `alembic_prime`, `alembic_work_start`,
`alembic_work_finish`, `alembic_code_guard`, and
`alembic_decision_record`. These tools should become the lifecycle spine around
the source graph, not be replaced by it.

Target fused flow:

1. `alembic_intent` normalizes the host/user goal. It should classify whether
   the task needs Recipe knowledge, source graph code facts, Guard, decision
   recording, or only status. Future intent output should include a
   `sourceGraphPlan` alongside the current structure-first retrieval plan.
2. `alembic_prime` summarizes reusable project knowledge. It should deliver
   compact Recipe/Guard/Decision context and source graph query suggestions,
   not a large raw source dump. Prime prepares the agent's judgment basis.
3. `alembic_code_explore` or `alembic_source_node` retrieves source facts when
   the task needs code understanding. Returned source sections become evidence
   refs that work and finish tools can cite.
4. `alembic_work_start` binds the concrete work scope to `intentRef`,
   `primeRef`, and optional source graph refs. It should not silently invent a
   wider scope.
5. `alembic_work_finish` summarizes changed files and evidence, then recommends
   Guard, source impact refresh, affected tests, or decision recording. It
   should not run validation implicitly.
6. `alembic_code_guard` checks explicit files or inline code only. It may use
   Recipe knowledge and source graph impact context, but it remains a scoped
   review tool, not whole-workspace acceptance.
7. `alembic_decision_record` writes only confirmed durable decisions. Source
   graph findings can support a decision, but cannot become a final decision by
   themselves.

This makes CodeGraph-style source exploration one evidence producer inside the
Alembic lifecycle, while intent/prime keep ownership of task interpretation and
knowledge summarization.

### Route C: Global Architecture Design While Learning

Every implementation wave must update the global architecture map before code
promotion. The map should answer:

- which repository owns the durable behavior;
- which repository only adapts or projects it;
- which MCP tool exposes it;
- which output fields are business data versus diagnostics;
- which status or freshness state proves it is usable;
- which tests, probes, or transcript harness prove the agent actually benefits.

The architecture map should be reviewed whenever a CodeGraph lesson would move
responsibility between Core, Plugin, Alembic runtime, Agent, Dashboard, or
Wakeflow. The default is conservative: Core owns deterministic reusable code,
Plugin owns Codex MCP and host adaptation, Alembic runtime owns durable product
stores/routes when needed, Agent consumes runtime/tool/AI workflows, Dashboard
visualizes stable contracts later, and Wakeflow remains orchestration and
acceptance governance.

### Route D: Design-First Demand Promotion

No source graph feature should be promoted from learning directly to code. The
promotion order should be:

1. learning evidence;
2. Alembic current-code gap;
3. responsibility decision;
4. clean input/output contract;
5. execution demand slice;
6. tests/probes/evaluation harness;
7. controller acceptance criteria.

This is how the requirements document becomes executable. It also prevents thin
minimal implementations: each slice must name source data, state changes,
callers, consumers, failure states, and validation evidence before it is eligible
for unattended development.

## Fused Global Architecture

The fused architecture should have five layers.

### Layer 1: Host And MCP Adapter

Owner: AlembicPlugin.

Responsibilities:

- Codex MCP startup, tool list, annotations, schemas, and initialize guidance.
- Project root trust, repo selection, multi-repo mismatch errors, and local
  recovery actions.
- Clean per-tool output projection and host-safe diagnostics.

Non-responsibilities:

- parser/indexer implementation;
- durable source graph storage;
- final product acceptance;
- Dashboard UI ownership.

### Layer 2: Agent Lifecycle Spine

Owner: AlembicPlugin for MCP tools and public lifecycle schema; AlembicCore for
shared deterministic lifecycle contracts when they need reuse.

Responsibilities:

- `intent`: classify user/workflow goal and produce a retrieval/source graph
  plan.
- `prime`: summarize Recipe/Guard/Decision knowledge and recommend source graph
  context needs.
- `work_start`: create scoped work records tied to intent/prime/source graph
  refs.
- `work_finish`: close work with changed files, evidence refs, and validation
  recommendations.
- `code_guard`: check explicit code/file scope.
- `decision_record`: record confirmed durable decisions through the correct
  durable route.

This layer is where Alembic differs from CodeGraph. CodeGraph mainly provides
source intelligence; Alembic should provide task understanding, project memory,
guardrails, and durable decision flow around that intelligence.

### Layer 3: Source Graph Core

Owner: AlembicCore.

Responsibilities:

- file inventory, source classification, parsing, symbol extraction, graph
  edges, source ranges, source graph generations, freshness, query/ranking, and
  impact/affected-test planning;
- public package exports and tests;
- deterministic DTOs that Plugin can project without knowing internal storage.

Non-responsibilities:

- Codex tool names or MCP initialize instructions;
- host project-root UI;
- market/channel packaging;
- Wakeflow dispatch or acceptance.

### Layer 4: Knowledge And Governance Core

Owner: AlembicCore and existing Alembic durable services as appropriate.

Responsibilities:

- Recipe/knowledge/candidate lifecycle, SourceRefs, Guard rule contracts,
  SearchEngine, Decision Register contracts, and knowledge sync.
- Link Recipe SourceRefs to SourceGraph nodes without merging their lifecycles.
- Provide contract outputs that Plugin can summarize in prime and guard.

### Layer 5: Consumers And Visualization

Owners: AlembicPlugin first, AlembicAgent and AlembicDashboard later, Wakeflow
for cross-window governance.

Responsibilities:

- Plugin proves MCP source graph usefulness first.
- Agent can later consume the same Core contracts for runtime/tool/AI workflows.
- Dashboard visualizes only stable source graph and lifecycle contracts after
  MCP acceptance.
- Wakeflow receives evidence and dispatches work; it does not become a source
  graph implementation owner.

## Architecture Invariants

- `intent` and `prime` are not search tools. They are task-understanding and
  context-summarization tools.
- `alembic_code_explore` is not a Recipe search tool. It is source evidence.
- Recipe freshness and source graph freshness are separate states.
- A source graph result can recommend Guard/tests, but cannot replace them.
- A decision record requires confirmed decision intent; graph evidence alone is
  not a decision.
- A tool returns only its own operation fields. Shared refs must be
  operation-specific, not a global bag of every possible ref.
- Core public contracts must exist before Plugin depends on source graph
  behavior in production MCP tools.
- Dashboard work waits for stable Core/Plugin contracts unless explicitly
  dispatched as parallel visualization research.

## Capability Gaps

### 1. No First-Class Source Graph Contract

AlembicCore has `ProjectGraph`, `CallGraphAnalyzer`, `CodeEntityGraph`, Recipe
graph, and SearchEngine, but there is no single Core contract for:

- source file identity and content hash;
- symbol identity, kind, range, language, file, exported/imported names;
- call/data-flow/import/ownership/test edges;
- source snippets or retrievable source ranges;
- graph build generation, freshness, and partial/degraded reason;
- query result shape shared by Plugin, Guard, Dashboard, and future Agent flows.

Without this contract, Plugin tools have to stitch together structure, Recipe
graph, call graph, and source refs in handler-specific ways.

### 2. Existing Graph Tools Are Semantically Split

Current tool semantics are useful but fragmented:

- `alembic_structure` answers "what targets/files exist".
- `alembic_graph` answers Recipe/knowledge graph questions.
- `alembic_call_context` answers narrow method call chain questions.
- `alembic_search` searches knowledge entries, not source symbols as a primary
  CodeGraph-style source map.

The missing tool family is a source-code exploration surface:

- "Explain how X works" should return source grouped by file, relations, and
  blast radius.
- "What calls X" should include caller locations and source ranges.
- "If I change X, what tests and modules are likely affected" should be a first
  class result, not a manual follow-up.
- "Open file/symbol X" should be Read-equivalent for relevant source ranges,
  with staleness state.

### 3. Scope Routing Is Not Clean Enough For Multi-Repo Workspaces

The live `alembic_structure` probe at the workspace root returned Swift targets
from a project shape that was not the intended AlembicPlugin/AlembicCore scope.
For AlembicWorkspace, Codex often works across sibling repos and explicit
window responsibilities. Source graph tools must not infer the wrong product.

Required improvements:

- explicit `projectRoot` and `repoId` resolution with fail-closed mismatch
  messages;
- separate workspace-root inventory from product-repo graph query;
- no cross-repo graph cache leakage through module-level singleton caches;
- output must say which repo, language set, and graph generation it represents.

### 4. Freshness And Sync Are Not Yet A Source-Graph Product Feature

CodeGraph's practical strength is not only indexing, but telling the agent that
the graph is local, watched, and slightly stale after writes. Alembic has file
monitor concepts and reactive evolution paths, but current status evidence
showed degraded file monitor behavior and zero active SourceRefs in the current
workspace status. Knowledge sync also documents that full SourceRef scanning was
removed.

Alembic needs a clear source graph freshness model:

- full build, incremental sync, and changed-file reconciliation;
- native watcher, git-worktree fallback, and manual rescan states;
- per-result freshness banners when edits happened after graph generation;
- stale file list and next recommended refresh action;
- no silent "ready" when the index cannot support the requested source graph
  claim.

### 5. MCP Initialize Guidance Is Missing For Source Graph Use

CodeGraph emits compact server-level MCP initialize instructions explaining the
tool playbook. Alembic currently relies more on skills, tool descriptions, and
workflow lifecycle tools. That is good for governance, but not enough for
day-to-day structural code exploration.

AlembicPlugin should add a compact, generated source-graph tool guide:

- use source graph tools before broad grep/read for code understanding;
- use Recipe/knowledge search for project rules and historical decisions;
- use Guard/tests for correctness;
- after edits, check graph freshness before trusting old impact results;
- keep this text short and feature-gated to tools actually exposed.

This guidance must not replace AGENTS.md or Wakeflow gates. It should only tell
the host agent which Alembic MCP tool to use for source-code context.

### 6. Affected Test Selection Is Not Connected

CodeGraph's `affected` command is a useful model: changed files should map to
likely affected tests. Alembic already has call/data-flow edges, source refs,
Guard, and workflow evidence, but the current Codex-facing interface does not
offer a direct affected-test contract.

Alembic should add:

- file-to-symbol and symbol-to-test ownership edges;
- import/call traversal with configurable depth;
- test file pattern detection per repo/language;
- output that separates "must run", "recommended", and "unknown due to missing
  graph" instead of claiming certainty.

### 7. Clean Output Should Be Tool-Specific, Not Generic Bags

The existing clean output projector is the right direction, but source graph
tools need stricter per-tool shapes. They should not return every possible graph
field just because the model exists.

Required principle:

- each tool returns only fields required for its operation;
- detailed source ranges and large relationship maps use `detailRefs` or
  structured `sections`, not accidental dynamic bags;
- diagnostic metadata is separated from business data;
- no old compatibility fields;
- no arbitrary "character gate" as the design center. Compactness comes from
  operation-specific selection and references, not from slicing useful data out
  blindly.

### 8. AlembicPlugin Cold Start Does Not Yet Have Source-Graph Liftoff

AlembicPlugin can initialize Ghost/standard workspace state and route
knowledge-dependent tools, but it does not yet have the CodeGraph-style source
graph cold-start contract:

- no quick-start source graph engine that registers MCP tools before heavy graph
  open/index work;
- no one-shot catch-up source sync after opening a project;
- no first-tool freshness gate for stale source graph rows;
- no source-file pending list surfaced through source graph responses;
- no explicit fallback strategy when live watching is disabled;
- no source graph status section that separates knowledge freshness from source
  index freshness.

This should be designed as Plugin orchestration over Core contracts. Core owns
indexing and graph semantics; Plugin owns startup timing, tool visibility,
pending/stale output projection, and Codex-facing recovery actions.

### 9. Source Graph Ranking Is Not Yet A Product Contract

Alembic has knowledge search ranking and structural analysis, but not a
CodeGraph-style source exploration ranker. `alembic_code_explore` cannot be a
thin wrapper around FTS. It needs a defined retrieval plan:

- exact symbol/file matches first;
- natural-language tokens mapped to symbol names, paths, and comments;
- co-location and graph-connectivity boosts;
- test/generated/config-file down-ranking unless the query asks for them;
- ambiguity reporting when multiple symbols match the same name;
- low-confidence handoff that asks for a narrower symbol/file instead of
  returning misleading source.

This ranking layer belongs in Core so Plugin and future Dashboard see the same
answer. Plugin may add MCP-specific output shaping, but not different search
semantics.

### 10. Agent Adoption Is Not Yet Measured

Returning a graph result does not prove the feature works. CodeGraph evaluates
whether an agent actually chooses graph tools and reduces broad Read/Grep usage.
Alembic needs the same evidence before claiming success.

Required metrics:

- first tool used for architecture/code-understanding questions;
- number of Alembic source graph calls;
- number of raw Read/Grep/rg/find calls avoided or still required;
- whether returned source was sufficient for a correct answer or edit plan;
- stale-file fallback behavior after an edit;
- token/tool-call/time deltas on AlembicPlugin and AlembicCore fixture tasks.

The evaluation harness must use real Codex transcripts or a faithful local MCP
client, not only unit tests.

### 11. ProjectScope And Worktree Identity Need Source Graph Semantics

Alembic already has `ProjectScope`, workspace resolver, file-monitor capability
contracts, and repo-qualified source-ref resolution. The source graph demand
should build on those instead of adding another root resolver.

The missing semantic layer is: which repo did this source graph answer come
from, which git worktree did it index, which ProjectScope folder did it resolve
through, and which current folder requested it?

Required correction:

- every source graph status and source graph query result includes repo id or
  folder id, graph root label, generation id, and freshness state;
- workspace-root calls either return workspace inventory or fail closed with
  `ambiguous-project-scope`;
- calls from a nested or sibling worktree must detect "index belongs to another
  worktree" and return a warning or blocker before source facts are trusted;
- source refs use repo-qualified ProjectScope paths, not bare relative paths
  that can silently bind to the wrong sibling repo.

This gap is especially important because current status evidence already shows
AlembicWorkspace in multi-folder ProjectScope mode and file monitor fallback via
`git-worktree`.

### 12. Prime Retrieval Degraded State Must Be Part Of Fusion Contract

The current `alembic_prime` implementation can degrade when resident retrieval
metadata is unavailable, while still returning low-relevance knowledge
candidates. That is a valid tool state, but it must not be treated as source
graph proof or as high-confidence Recipe context.

Required correction:

- `intent` remains allowed to produce a source graph plan even when prime later
  degrades;
- `prime` should distinguish Recipe/Guard/Decision retrieval degradation from
  source graph availability;
- source graph tools may proceed when prime is degraded if the user's task only
  needs code facts, but their output must not imply Recipe trust;
- work/finish/guard outputs must preserve the separate refs:
  `intentRef`, `primeRef`, `sourceGraphRef`, `workRef`, `guardResultRef`,
  `decisionRef`;
- degraded prime should produce a narrow next action such as "run source graph
  explore for code facts" or "repair resident retrieval metadata" instead of
  returning a broad generic diagnostics payload.

This keeps Alembic's stronger lifecycle model while avoiding a false dependency
where source graph work blocks just because Recipe retrieval degraded.

### 13. SourceRefs ActiveCount Zero Means Recipe-To-Code Link Is Not Proven

Current status evidence can show that SourceRefs infrastructure exists while
active refs are zero. That is not a failure of source graph construction by
itself, but it means Recipe knowledge is not yet proven to link to current code.

Required correction:

- source graph node refs and Recipe SourceRefs remain separate lifecycles;
- prime output can say "Recipe candidate has no active source ref" without
  dropping the Recipe entirely;
- source exploration can create or recommend source graph refs for the current
  task, but it cannot silently backfill Recipe provenance;
- SourceRef reconciliation should eventually attach Recipe source evidence to
  source graph nodes through ProjectScope-qualified paths;
- Dashboard or Agent consumers must not display "Recipe covers this source"
  unless the bridge is active and fresh.

This prevents old knowledge from appearing more connected to live code than it
really is.

### 14. Current Clean Output Is A Starting Point, Not The Final Contract

AlembicPlugin already has a clean output projector for Core MCP tools with
per-tool allowed business fields. That is valuable evidence, but the current
projector is still a compatibility cleanup for existing tool families. The new
source graph and lifecycle fusion needs a first-class contract.

Required correction:

- source graph tools get strict schemas from the start, not projected legacy
  payloads;
- lifecycle tools get explicit optional fields only when they own the operation:
  `sourceGraphPlan` belongs to intent, source graph query suggestions belong to
  prime, source evidence refs belong to source tools/work records, Guard
  recommendation belongs to finish;
- Core source graph DTOs can be richer than Plugin MCP output. Plugin chooses
  operation-specific projections rather than exposing Core internals directly;
- output tests assert both presence of required fields and absence of irrelevant
  fields for each tool;
- "compact" must mean semantically selected, not blindly truncated.

This directly answers the concern that a generic `refs` or graph payload could
accidentally return values a tool does not own.

## Boundary Case Matrix

The following cases must be designed before implementation. They are not
optional edge cases because several already appear in current Alembic evidence.

| Case | Direction | Required response | Invalid conclusion |
| --- | --- | --- | --- |
| MCP daemon is ready but source graph is not initialized | Direction 1 | `sourceGraphInitialized=false`, bootstrap or status action only | Return source facts from Recipe/search data |
| Native watcher unavailable and fallback is `git-worktree` | Direction 1 | Report fallback mode, accepted event sources, manual/catch-up expectations | Claim live freshness without pending/stale semantics |
| Workspace has multiple ProjectScope folders | Direction 1 + 2 | Require repo id/projectRoot or return workspace inventory | Query the first sibling repo silently |
| Request launched from different git worktree than indexed root | Direction 1 | Warn or block with worktree/index roots and reinit action | Treat another branch's graph as current |
| Catch-up sync fails after opening graph | Direction 1 | Keep status callable; source query returns degraded or best-effort with reason | Close MCP transport or return silent stale rows |
| File edited after graph generation and appears in response | Direction 1 + 2 | Per-file stale banner; only affected files require raw Read or refresh | Tell agent all returned source is Read-equivalent |
| File edited elsewhere but not in response | Direction 1 | Compact pending summary in status/diagnostics | Bloat every source query with unrelated pending files |
| Prime degraded because resident retrieval metadata is unavailable | Direction 2 | Keep prime degraded; allow source graph plan if code facts can proceed | Treat low-relevance knowledge as trusted prime |
| SourceRefs table exists but active count is zero | Direction 2 | Mark Recipe-to-code bridge unproven | Claim Recipes are tied to current code |
| Ambiguous symbol or overloaded name | Direction 2 | Return alternatives with file/line disambiguators or require narrowing | Pick one definition without evidence |
| Query matches mostly common words | Direction 2 | Low-confidence handoff with suggested exact symbols/files | Dump weakly relevant source and call it complete |
| Unsupported language, parser timeout, or large file skip | Direction 1 + 2 | Coverage/degraded reason plus omitted file refs | Hide parse gaps from impact/explore output |
| Generated/test/config files dominate ranking | Direction 2 | Down-rank or exclude unless query asks for them; config values redacted | Spend source budget on low-value or sensitive content |
| Affected tests are unknown | Direction 2 | Return `unknown` with missing graph reason and validation fallback | Pretend there are no tests to run |
| Guard requested without explicit files/code/workRef scope | Direction 2 | Existing blocked/skipped scope behavior remains | Fall back to whole-diff or whole-workspace review |
| Dashboard asks for source graph before MCP contract is stable | Cross-direction | Read-only visualization research or wait | Build Dashboard against unstable Plugin internals |

## Stage Design

The demand should advance in stages so unattended development can keep going
without merging unrelated concerns.

| Stage | Purpose | Main slices | Acceptance focus |
| --- | --- | --- | --- |
| Stage A | Evidence and architecture baseline | CGK-0, CGK-0A, CGK-11, CGK-13 | Current code facts, CodeGraph decisions, owner map |
| Stage B | Core construction foundation | CGK-1, CGK-7 | Source graph DTOs, storage, migrations, repository APIs |
| Stage C | Build/freshness runtime | CGK-2, CGK-2A, CGK-2B, CGK-9 | Full/incremental build, catch-up, watcher/fallback, status |
| Stage D | Source graph usage tools | CGK-3, CGK-8, CGK-15, CGK-17 | Explore/node/search/impact outputs, ranking, boundary states |
| Stage E | Lifecycle fusion | CGK-4, CGK-5, CGK-12, CGK-16 | Intent/prime/work/finish/guard/decision refs and plans |
| Stage F | Evaluation and cross-repo proof | CGK-6, CGK-10, CGK-14, CGK-18 | Multi-repo acceptance, transcript metrics, end-to-end probes |

Stages may overlap only when producer/consumer contracts are explicit. For
example, Plugin can scaffold a degraded `alembic_source_graph_status` before
Core storage lands, but `alembic_code_explore` cannot claim Read-equivalent
source until Direction 1 freshness and source section semantics are proven.

## Proposed Requirement Slices

These are discussion candidates. They are intentionally ordered so total control
can promote them one by one after review.

### Slice-To-Direction Map

| Direction | Slices | What they build or prove |
| --- | --- | --- |
| Shared learning and architecture governance | CGK-0, CGK-0A, CGK-11, CGK-13, CGK-18 | Current code inventory, CodeGraph deep study, learning decision ledger, global responsibility contract, transcript-based rollout governance. |
| Direction 1: knowledge base construction and freshness | CGK-1, CGK-2, CGK-2A, CGK-2B, CGK-7, CGK-9 | Core source graph spine, index lifecycle, cold-start/catch-up, runtime source graph status, storage/migrations, Plugin source graph runtime. |
| Direction 2: knowledge base use and code logic relationship use | CGK-3, CGK-4, CGK-5, CGK-8, CGK-10, CGK-12, CGK-14, CGK-15, CGK-16, CGK-17 | Source graph tools, tool guidance, code logic retrieval/ranking, impact-to-validation, agent lifecycle fusion, evaluation, boundary semantics, clean output, end-to-end workflow proof. |
| Cross-direction acceptance | CGK-6, CGK-18 | Multi-repo runtime hardening and acceptance scenarios that prove both construction freshness and source graph usage behavior. |

Direction 1 tasks should not be accepted merely because a tool can answer a
query; they must prove index/storage/freshness/runtime behavior. Direction 2
tasks should not be accepted merely because an index exists; they must prove the
agent used the knowledge correctly, returned relevant code logic relationships,
and kept output scoped to the operation.

### CGK-0 Current Source Graph Audit

Goal: produce a repo-accurate inventory of Core and Plugin source graph paths.

Required evidence:

- enumerate `ProjectGraph`, `CallGraphAnalyzer`, `CodeEntityGraph`,
  `KnowledgeGraphService`, `SearchEngine`, SourceRef repositories, and Plugin
  handlers;
- complete the deeper CodeGraph source-code audit for schema, migrations,
  extraction, reference resolution, ranking, output budgeting, affected-test
  selection, freshness, and agent-eval evidence before promoting
  implementation;
- enumerate the current Codex host-entry path for AlembicPlugin, including
  plugin bundle config, MCP server startup, tool catalog, initialize response,
  and any global/project skill guidance that could conflict with MCP guidance;
- run representative MCP probes for workspace root, AlembicPlugin, and
  AlembicCore without transport collapse;
- classify current tools into source graph, knowledge graph, structure, search,
  Guard, and workflow lifecycle;
- decide which existing APIs should be promoted, replaced, or retired.

Completion definition: a controller-reviewed map of current code facts and
wrong-scope/runtime-failure repro evidence, plus an external-reference appendix
showing exactly which CodeGraph implementation patterns Alembic will reuse,
adapt, or reject.

### CGK-0A CodeGraph Deep Source Study

Goal: finish the external reference study before implementation-level design.

Required evidence:

- schema and persistence map: tables, indexes, FTS, metadata, migrations, WAL
  expectations, and graph version stamps;
- extraction map: file enumeration, default ignores, git fallback, language
  support, parser worker limits, generated/config file handling, parse-error
  reporting;
- resolution map: import/alias/workspace resolution, framework route
  finalizers, dynamic-dispatch synthesis, heuristic provenance, and unsupported
  edge classes;
- retrieval map: exact-symbol matching, text search, query tokenization,
  co-location boosting, low-confidence handoff, graph-relevance ranking,
  test/generated-file de-prioritization;
- output map: `explore` grouping, source section budget, Read-parity node
  output, config-value redaction, trail/blast-radius sections, truncation and
  overflow semantics;
- freshness map: startup catch-up, watcher pending-file lifecycle, staleness
  banner, lock failure behavior, worktree mismatch notice, manual/git-hook
  fallback;
- affected-tests map: changed-file input, dependent traversal, depth/filter
  controls, output shape, and known uncertainty;
- evaluation map: A/B scripts, transcript parsers, metrics, cold-start race
  handling, and what evidence would prove Alembic's source graph actually
  changes Codex behavior.

Completion definition: a reviewable external-reference appendix is attached to
this demand, and CGK-1 through CGK-6 explicitly cite which findings they depend
on.

### CGK-1 Core Source Graph Spine

Goal: define and implement a deterministic Core contract for source graph data.

Core responsibilities:

- `SourceGraphSnapshot`: project identity, generation id, build time, language
  coverage, freshness, degraded reason.
- `SourceFileNode`: repo-relative path, content hash, language, size, indexed
  ranges, test/source classification.
- `SourceSymbolNode`: stable symbol id, display name, kind, file path, range,
  export/import metadata, container symbol.
- `SourceGraphEdge`: typed edges for imports, calls, data flow, ownership,
  implements/conforms/inherits/extends, route-to-handler, symbol-to-test.
- `SourceGraphQueryResult`: operation-specific result envelope with source
  sections, graph sections, impact sections, and diagnostics separated.

Completion definition: Core exports typed contracts, validators, and fixture
tests that can be consumed by Plugin without importing handler-specific shapes.

### CGK-2 Core Index Build And Freshness Service

Goal: turn existing AST/call graph/entity graph pieces into an index lifecycle.

Required behavior:

- full build for a target repo;
- incremental build for changed files plus reverse dependencies;
- content hash and generation tracking;
- stale detection after edits;
- git-worktree fallback when native watcher is unavailable;
- filesystem reconcile for edits made outside git status, including committed
  pull/checkout/merge changes;
- source file table with content hash, size, modified time, indexed time, parse
  errors, and graph generation;
- source graph build stamp for Alembic engine/extractor version so status can
  recommend a full rebuild when extraction improves;
- explicit partial/degraded state for skipped large files, unsupported
  languages, parse failures, and timeouts;
- changed-file scoped reference resolution when possible, with full/batched
  fallback when changed-file scope is unavailable;
- local storage under Alembic data root unless controller explicitly chooses a
  project-local directory.

Completion definition: source graph status reports exact repo, graph generation,
indexed file/symbol/edge counts, freshness, and next refresh action.

### CGK-2A Plugin Cold-Start And Incremental Scan Orchestration

Goal: make AlembicPlugin cold start behave like a real source-graph runtime, not
only a setup/status wrapper.

Required behavior:

- MCP initialize and tool list remain fast even when source graph components are
  heavy. Load Core source graph indexer/query services lazily after project root
  is trusted and a source-graph tool or bootstrap path needs them.
- Keep one shared per-project Plugin source-graph engine for a Codex MCP
  session/daemon boundary. Do not create duplicate watchers, DB writers, or
  graph caches for every tool call.
- After opening an existing initialized project, run a catch-up source sync for
  files changed while no watcher was active. The first source-graph tool call
  must await this one-shot gate or return a clean degraded signal if the gate
  fails.
- Implement a source-file watcher only after Core source graph contracts exist.
  It should use the same include/ignore rules as the indexer, filter to source
  files, debounce bursts, track pending files, and preserve pending state when a
  sync fails or cannot acquire the write lock.
- When watcher is unavailable, status must say so and provide the correct next
  action: manual source graph sync, git-hook-like checkpoint, or full rebuild.
  It must not quietly report source graph readiness.
- Source-graph MCP responses must include per-file staleness signals only when
  those files are relevant to the response. Other pending files should be
  summarized in status or a compact diagnostics section.
- `alembic_codex_status` and the future `alembic_source_graph_status` must
  separate knowledge state from source graph state: initialized, indexed,
  catching-up, watching, pending, stale, degraded, rebuilding, and unavailable.
- Existing `needs_bootstrap`, `ready_stale`, and `ready_refreshing` policy
  signals should be extended or mirrored for source graph lifecycle without
  conflating Recipe knowledge refresh with source index freshness.

Completion definition: on a real AlembicPlugin or AlembicCore repo, Codex can
start MCP, see tools quickly, run a first source-graph query after catch-up,
edit a file, observe pending/stale status before debounce completes, and observe
fresh status after incremental sync, without transport collapse.

### CGK-2B Codex-Agent Knowledge-Base Bootstrap Contract

Goal: define the exact interaction by which Codex discovers, initializes, and
uses Alembic's source knowledge base.

Required behavior:

- Separate host connector readiness from project knowledge readiness. Status
  must distinguish `mcpInstalled`, `runtimeReady`, `knowledgeSynced`,
  `sourceGraphInitialized`, `sourceGraphIndexed`, and `sourceGraphFresh`.
- The MCP initialize response must include compact source-graph guidance derived
  from the actually exposed Alembic tool catalog. It must not mention disabled
  or unimplemented tools.
- AlembicPlugin must avoid writing duplicate long tool guidance into
  `AGENTS.md` or exported project skills when MCP initialize guidance is the
  authoritative live tool playbook. Any remaining skill guidance should point to
  tool intent, not duplicate every schema.
- The first uninitialized source-graph tool call must return an actionable
  bootstrap response, such as `needs_source_graph_init`, target repo identity,
  required command/tool action, and whether user confirmation is needed. It must
  not return a huge generic setup dump.
- After project initialization, the first source-graph query should either wait
  for bounded catch-up sync or return a precise degraded state that names the
  missing freshness evidence.
- Host startup failures, daemon loss, watcher failure, and graph-open failures
  must not close the whole MCP transport. They should degrade only the affected
  tool family and keep status/debug tools callable.
- In multi-repo workspaces, Codex must pass or confirm `projectRoot`/`repoId`
  before source graph tools query product code. Workspace-root ambiguity should
  return inventory or a clean mismatch error.
- Tool output must reinforce the MCP guidance: source exploration says when
  returned source is Read-equivalent, node retrieval says which lines are safe
  to edit from, status says whether pending files require raw reads, and impact
  says which tests are candidates rather than proof.

Completion definition: a real Codex MCP session can start from no loaded source
graph, discover the tool playbook through MCP initialize, initialize or repair a
repo source graph, answer one source exploration query, edit a file, and receive
fresh/stale guidance without relying on duplicated `AGENTS.md` manuals or
falling back to broad grep/read exploration.

### CGK-3 Plugin Source Graph MCP Tools

Goal: expose Codex-facing tools that match real source graph questions.

Candidate tools:

- `alembic_code_explore`: natural-language or symbol/file query; returns
  relevant source grouped by file, relationship map, and blast radius.
- `alembic_symbol_search`: find symbols by name/kind/file/language.
- `alembic_source_node`: retrieve one file or symbol with source ranges and
  direct relations.
- `alembic_callers`: upstream callers with locations and snippets.
- `alembic_callees`: downstream calls with locations and snippets.
- `alembic_code_impact`: impacted symbols/files/tests for a symbol or file.
- `alembic_affected_tests`: changed files to affected tests.
- `alembic_source_graph_status`: graph health, freshness, coverage, generation.

Open design question: these can be new tools or a carefully redesigned
`alembic_structure` / `alembic_call_context` family. The safer path is likely to
add new source-graph tools and keep existing tools stable until their consumers
are migrated.

Completion definition: tools return clean, per-operation schemas and work
against AlembicPlugin and AlembicCore project roots in real MCP calls.

### CGK-4 Tool Guidance And Skill Alignment

Goal: make Codex naturally choose the source graph path without burying the
instruction in long docs.

Required behavior:

- MCP initialize instructions include a compact playbook for source graph,
  knowledge search, Guard, and fallback reads;
- initialize guidance is generated from the active tool surface and remains
  consistent with allow-listed or degraded tool availability;
- Alembic skills are updated to mention the source graph tools only where they
  are relevant;
- Project Skill export does not duplicate long tool manuals into every project;
- instructions include limitations: graph lag, partial parse, unsupported
  languages, and validation is still required.

Completion definition: a host agent with only tool descriptions and initialize
instructions can choose the correct first tool for code understanding.

### CGK-5 Impact-To-Validation Integration

Goal: connect source graph impact to Guard and test selection.

Required behavior:

- map changed source files to impacted symbols and likely tests;
- surface required validation commands when repo scripts are known;
- separate "must run", "recommended", "manual review", and "unknown" buckets;
- preserve Wakeflow/Test boundaries: source graph suggests validation, it does
  not accept work or replace Test when real scenario validation is required.

Completion definition: a change in AlembicPlugin/Core can produce a reviewable
affected validation plan with file/symbol/test evidence.

### CGK-6 Runtime Hardening And Multi-Repo Acceptance

Goal: make the capability reliable in the actual AlembicWorkspace shape.

Acceptance scenarios:

- workspace-root query fails closed or returns workspace inventory, never the
  wrong product scope silently;
- AlembicPlugin query returns TypeScript MCP/source graph context;
- AlembicCore query returns Core analysis/source graph context;
- repeated sequential and parallel MCP calls do not close transport;
- cold MCP startup exposes source graph tools quickly without waiting for full
  index rebuild;
- first source graph query after startup waits for catch-up sync or returns a
  clean degraded source-graph freshness signal;
- editing a source file appears in pending/stale status before debounce
  completes and disappears after successful incremental sync;
- watcher-disabled environments report manual sync/checkpoint fallback instead
  of pretending freshness;
- graph status after a file edit reports stale or refreshed state;
- code impact result names affected tests or explains why it cannot;
- clean output contains no legacy compatibility fields or irrelevant dynamic
  payloads.

Completion definition: controller reviews raw MCP JSON, local commands, and
source graph fixture tests before accepting.

### CGK-7 Core Source Graph Storage And Migration Consolidation

Goal: decide and implement the durable storage model for source graph data.

Required behavior:

- choose dedicated source graph tables or a clearly versioned compatibility
  layer over `code_entities` / `knowledge_edges`;
- store file hash, size, mtime, indexed time, language, generated/test/source
  classification, parse errors, and graph generation;
- store symbol id, display name, kind, signature, file path, range, container,
  export/import metadata, and provenance;
- store deterministic and heuristic edges separately or with explicit
  provenance, confidence, and source;
- migrate without relying on old broken MCP output fields;
- provide Core repository tests and migration smoke tests.

Completion definition: Core can rebuild, query, clear, and incrementally update
source graph storage without Plugin-specific code.

### CGK-8 Source Graph Retrieval And Ranking

Goal: make `alembic_code_explore` useful enough to replace broad grep/read
exploration for real AlembicPlugin/Core questions.

Required behavior:

- implement exact symbol, FTS, path, comment, and natural-language token recall;
- add graph relevance, co-location, ownership, and call/import connectivity
  ranking;
- add ambiguity and low-confidence outputs instead of pretending a weak match is
  enough;
- add source section clustering with line numbers and explicit overflow;
- down-rank tests/generated/config files unless query intent asks for them;
- add fixtures from AlembicPlugin and AlembicCore architecture questions.

Completion definition: representative questions about Codex MCP startup,
clean-output projection, ProjectGraph, and call graph materialization can be
answered from one or two source graph calls with relevant source sections.

### CGK-9 Plugin Source Graph Runtime And MCP Initialize Guidance

Goal: make Codex reliably discover and use the source graph path.

Required behavior:

- add server-level initialize instructions for source graph, knowledge search,
  Guard, fallback reads, and validation boundaries;
- ensure guidance is generated from visible tools, not stale prose;
- add fast static tool list behavior for source graph tools;
- add per-project source graph engine cache and bounded catch-up gate;
- add clean uninitialized/degraded responses for source graph tool calls;
- keep status/debug tools callable when graph open, watcher, or daemon paths
  fail;
- verify that source graph startup does not reproduce the current MCP transport
  collapse observed during probing.

Completion definition: a cold Codex MCP session can discover tools, receive the
source graph playbook, initialize or repair the source graph, and run a source
exploration query without broad manual instructions.

### CGK-10 Agent Evaluation And Acceptance Harness

Goal: prove the new capability changes Codex behavior and remains correct.

Required behavior:

- build a local evaluation harness for AlembicPlugin and AlembicCore tasks;
- compare runs with source graph enabled and disabled;
- parse transcripts for source graph tool calls, raw Read/Grep/rg calls, time,
  token usage when available, stale-file fallbacks, and final-answer evidence;
- include edit-planning tasks and code-understanding tasks;
- include a post-edit stale/freshness scenario;
- capture false positives, false negatives, missing symbols, and poor ranking
  as follow-up defects.

Completion definition: controller receives a reproducible report showing where
Alembic source graph reduces exploration, where it still fails, and which
follow-up tasks are required before Dashboard or broader release work.

### CGK-11 Learning Decision Ledger

Goal: turn CodeGraph learning into executable Alembic design decisions.

Required behavior:

- create a decision ledger for CodeGraph subsystems: MCP handshake, initialize
  guidance, tool taxonomy, schema/migrations, extraction, watcher, ranking,
  output budgeting, affected tests, and agent eval;
- for each subsystem, record CodeGraph source files studied, Alembic current
  code gap, adaptation decision, owner repository, and implementation slice;
- mark decisions as `reuse`, `adapt`, `defer`, or `reject`;
- require a local Alembic code pointer for every accepted or adapted decision;
- keep unresolved decisions from being promoted into implementation tasks.

Completion definition: total control can read the ledger and know exactly which
CodeGraph ideas become Core contracts, Plugin runtime work, evaluation harness
work, or rejected non-goals.

### CGK-12 Agent Lifecycle And Source Graph Fusion

Goal: redesign `intent` and `prime` so they orchestrate source graph context
without becoming large source dump tools.

Required behavior:

- extend intent design with `sourceGraphNeed`, `sourceGraphPlan`,
  `knowledgeNeed`, `guardNeed`, `decisionNeed`, and `workNeed`;
- extend prime design so it returns Recipe/Guard/Decision summaries plus
  recommended source graph queries and evidence refs;
- define how `alembic_code_explore` results become source evidence refs for
  `work_start`, `work_finish`, Guard, and decisions;
- define skipped/degraded states when source graph is unavailable but Recipe
  knowledge is available, and the reverse;
- add clean output allow-lists for any new lifecycle fields;
- add tests proving that prime remains compact and does not leak unrelated MCP
  data.

Completion definition: a semantic coding task can move through intent, prime,
source graph exploration, work start, work finish, Guard recommendation, and
decision recording with clean refs and no generic payload bags.

### CGK-13 Global Responsibility Map And Architecture Contract

Goal: keep the fused Alembic project architecture clear while source graph and
agent lifecycle features evolve.

Required behavior:

- produce a repository responsibility matrix covering AlembicCore,
  AlembicPlugin, Alembic runtime, AlembicAgent, AlembicDashboard, and Wakeflow;
- define which contracts are public Core exports, Plugin MCP schemas, durable
  runtime routes, future Agent consumers, and Dashboard read models;
- define migration rules for moving behavior between repos;
- define "do not move" boundaries for MCP, source graph core, Recipe knowledge,
  Guard, decision records, Dashboard visualization, and Wakeflow acceptance;
- require every future implementation slice to cite the responsibility map.

Completion definition: before implementation waves continue, total control has
a stable architecture contract that prevents source graph, intent/prime, Guard,
Decision, Dashboard, and Wakeflow responsibilities from drifting.

### CGK-14 End-To-End Fused Workflow Probe

Goal: prove the fused design works as one user-facing Codex workflow.

Required behavior:

- choose one AlembicPlugin task and one AlembicCore task;
- run the intended flow: `intent` -> `prime` -> source graph exploration ->
  `work_start` -> implementation or dry-run edit plan -> `work_finish` -> Guard
  recommendation -> optional decision record;
- capture raw MCP JSON and local test/command evidence;
- verify that source graph evidence is used for code facts, prime is used for
  knowledge summary, Guard remains scoped, and decision recording is not
  automatic;
- compare against a baseline without source graph guidance.

Completion definition: the controller can see one complete fused workflow with
clear refs, compact outputs, repository ownership, validation recommendation,
and no transport collapse.

### CGK-15 Boundary-State And Failure-Semantics Contract

Goal: make every source graph and lifecycle tool report the same boundary
states with clean, actionable semantics.

Required behavior:

- define shared status vocabulary for source graph:
  `uninitialized`, `opening`, `catching-up`, `fresh`, `pending`, `stale`,
  `partial`, `degraded`, `unavailable`, and `wrong-scope`;
- define result-level diagnostics for `ambiguous-project-scope`,
  `worktree-index-mismatch`, `catch-up-failed`, `pending-file-in-response`,
  `low-confidence-query`, `ambiguous-symbol`, `unsupported-language`,
  `parser-timeout`, `large-file-skipped`, `source-ref-unproven`, and
  `affected-tests-unknown`;
- map each diagnostic to the owning direction, next action, and invalid
  conclusion;
- ensure status/debug tools stay callable when source graph open, watcher,
  resident retrieval, or daemon routes degrade;
- add fixture tests for the Boundary Case Matrix so implementation cannot
  collapse all failures into generic `failed` or verbose diagnostics bags.

Completion definition: Core/Plugin tests prove each boundary state has one
documented output shape and no source graph tool returns a misleading `ready`
state when required evidence is missing.

### CGK-16 Lifecycle Ref Fusion And Evidence Ownership

Goal: make Alembic's existing agent-public lifecycle tools consume source graph
evidence without confusing ownership.

Required behavior:

- extend `alembic_intent` with `sourceGraphNeed`, `sourceGraphPlan`,
  `knowledgeNeed`, `guardNeed`, `decisionNeed`, and `workNeed` while keeping
  intent output compact;
- extend `alembic_prime` so it summarizes Recipe/Guard/Decision context and
  recommends source graph queries, but never embeds large source dumps;
- introduce `sourceGraphRef` or operation-specific source evidence refs that
  source graph tools produce and `work_start`, `work_finish`, Guard, and
  decision recording can cite;
- keep `intentRef`, `primeRef`, `workRef`, `finishRef`, `guardResultRef`, and
  `decisionRef` as operation-owned refs, not one generic global ref bag;
- define how degraded prime and fresh source graph interact, and how fresh
  prime and unavailable source graph interact;
- add tests showing that source graph unavailable does not corrupt Recipe prime,
  and prime degraded does not corrupt source graph code facts.

Completion definition: a real MCP probe can move through intent, degraded or
ready prime, source graph explore, work start, finish, Guard recommendation,
and optional decision recording with separate refs and no scope widening.

### CGK-17 Tool-Specific Clean Output Contract

Goal: replace generic data bags with strict operation-specific source graph and
lifecycle output contracts.

Required behavior:

- define a public output schema for every new or revised source graph tool:
  status, explore, search, node, callers, callees, impact, affected tests;
- define allow-lists for lifecycle additions so intent/prime/work/finish/guard
  only return fields they own;
- require negative tests that inject extra fields such as unrelated refs,
  resident metadata, output budgets, internal telemetry, or legacy
  compatibility aliases and prove they are removed or rejected;
- separate business data from diagnostics: source sections, relations, impact,
  freshness, and next actions are not one untyped object;
- make detail refs and sections explicit. Large source, reports, or raw JSON
  use detail refs only when the tool's primary operation needs an externalized
  detail;
- align with the existing `core-tools/output.ts` allow-list approach, but do
  not depend on compatibility projection as the first implementation path.

Completion definition: contract tests prove each tool returns only required and
allowed fields, including the case where Core has richer data than Plugin is
allowed to expose for that operation.

### CGK-18 Transcript-Governed Unattended Rollout

Goal: give total control a long-running unattended path that keeps improving
the capability based on real agent behavior, not document volume.

Required behavior:

- build a repeatable transcript harness for AlembicPlugin and AlembicCore
  tasks covering architecture understanding, source navigation, edit planning,
  post-edit stale handling, impact analysis, Guard recommendation, and failure
  states;
- run comparison arms with source graph tools enabled, disabled, and partially
  degraded;
- parse transcripts for first-tool choice, source graph calls, raw Read/Grep/rg
  calls, shell searches, token/time where available, stale fallback, and final
  evidence quality;
- record every false positive, false negative, weak ranking, missing edge,
  over-broad output, and unexpected raw read as a follow-up defect with owner
  and repo boundary;
- prevent Dashboard/Agent broad rollout until Plugin/Core transcript evidence
  shows stable usefulness and clean failure behavior;
- keep a decision ledger that links each CodeGraph-inspired optimization to an
  Alembic metric before and after the change.

Completion definition: total control can keep dispatching follow-up optimization
waves from transcript evidence, and the run does not stop merely because CGK-14
worked once.

## Responsibilities

| Area | Owner | Responsibility |
| --- | --- | --- |
| Source graph contracts | AlembicCore | Stable types, validators, storage-neutral contracts, deterministic query semantics. |
| Index build and freshness | AlembicCore | Full/incremental graph build, watcher/git fallback state, stale detection, parse diagnostics. |
| Cold-start and incremental scan orchestration | AlembicPlugin | Lazy source graph engine loading, catch-up gate, watcher lifecycle, pending-file projection, source graph status actions. |
| Codex-agent knowledge-base bootstrap | AlembicPlugin | Host-entry readiness, MCP initialize guidance, uninitialized/degraded recovery actions, multi-repo root confirmation. |
| Codex MCP tools | AlembicPlugin | Tool schemas, clean output projection, projectRoot/repo routing, MCP initialize guidance. |
| Source graph storage and migrations | AlembicCore | Tables or versioned compatibility layer, repository APIs, generation/freshness persistence, migration tests. |
| Source graph ranking | AlembicCore | Exact symbol/FTS/path/graph relevance ranking, ambiguity handling, source section planning. |
| Source graph runtime session | AlembicPlugin | Per-project engine cache, fast handshake, catch-up gate, watcher/pending-file projection. |
| Agent lifecycle spine | AlembicPlugin + AlembicCore | Intent/prime/work/guard/decision public tools, shared lifecycle contracts, source graph evidence refs. |
| Boundary-state semantics | AlembicCore + AlembicPlugin | Shared source graph status vocabulary, wrong-scope/stale/degraded behavior, negative tests for misleading ready output. |
| Tool-specific output contracts | AlembicPlugin over Core DTOs | Operation-specific allow-lists, source sections, diagnostics, detail refs, and absence tests for irrelevant fields. |
| Learning decision ledger | Design + controller intake | Convert CodeGraph study into accepted/adapted/deferred/rejected Alembic implementation decisions. |
| Global responsibility map | Controller + Design, consumed by product windows | Prevent source graph, MCP, Recipe, Guard, Decision, Dashboard, and Wakeflow ownership drift. |
| Agent adoption evaluation | AlembicPlugin + controller/Test as needed | Transcript harness, A/B comparison, Read/Grep reduction evidence, stale-file scenarios. |
| Transcript-governed rollout | Controller + Plugin/Core windows | Keep unattended waves grounded in real Codex behavior, not just one-off green probes. |
| Recipe/knowledge integration | AlembicCore + AlembicPlugin | Keep knowledge search distinct from source graph, then link Recipe SourceRefs to source graph nodes. |
| Guard/test suggestions | AlembicCore + AlembicPlugin | Derive impacted validations without claiming acceptance. |
| Dashboard visualization | Later decision | Only after Core/Plugin source graph contracts are stable and useful in MCP. |

## Output Shape Principles

For source graph tools, every output should answer a specific operation:

- `summary`: human-readable one-line result.
- `repo`: repo id/root label, not a leaked absolute path by default.
- `graph`: generation id, freshness, indexed coverage, degraded reason.
- `sync`: catch-up/watcher state, pending file count, last sync, next refresh
  action, only for source graph status or source graph diagnostics.
- `sourceSections`: only files/ranges relevant to the query.
- `relations`: only direct or requested-depth edges relevant to the operation.
- `impact`: only for impact/affected/explore operations.
- `diagnostics`: parse skips, stale files, unsupported languages, ambiguity.
- `detailRefs`: references for larger source/context details when needed.
- `nextActions`: only when the operation needs repair, initialization, refresh,
  or validation; must be specific to that tool result.
- Lifecycle tools may return `sourceGraphPlan`, `knowledgePlan`,
  `guardRecommendation`, or `decisionRecommendation` only when that tool owns
  the operation. Source graph tools should not echo the full lifecycle state.

Do not return:

- unrelated Recipe fields in source graph tools;
- unrelated source graph fields in Recipe graph tools;
- hidden compatibility aliases;
- old broken MCP fields;
- dynamic bags with unclassified business/diagnostic data;
- a global `refs` object that lists every possible ref for every tool.

## Implementation Choices To Resolve During Slices

The demand direction is confirmed. The following items are implementation
choices that each owning slice should decide with code evidence, not blockers
for continuing unattended design or development.

1. Storage location: should source graph cache live only under Alembic data root,
   or may a repo-local ignored directory be created for faster portable use?
2. First language target: should the first implementation focus on
   AlembicPlugin/AlembicCore TypeScript, or should it immediately preserve the
   current Swift/ObjC graph strengths?
3. Tool naming: should source graph capabilities be new `alembic_code_*` tools,
   or should existing `alembic_structure` and `alembic_call_context` be
   redesigned?
4. Output detail: how much source should be inline by default versus referenced
   through detailRefs?
5. Validation coupling: should `affected_tests` only recommend commands, or can
   it invoke repo-known test runners through a separate guarded operation?
6. Cold start: should Plugin source graph catch-up block the first source graph
   query, or should it always answer immediately with stale-file warnings?
7. Watch fallback: should Alembic install git-hook-like source graph checkpoints
   when live watching is disabled, or keep fallback fully manual?
8. Dashboard timing: should Dashboard wait until MCP source graph behavior is
   accepted, or should visualization be developed in parallel?
9. Codex host route: should AlembicPlugin rely only on the plugin-bundled MCP
   entry, or should it also provide a CodeGraph-style explicit Codex config
   writer for local development diagnostics?
10. Guidance source: which existing Alembic skill text should remain after MCP
    initialize becomes the live source-graph playbook, and which old guidance
    should be removed to prevent conflicting agent behavior?
11. Ranking scope: should Alembic initially implement only exact-symbol and FTS
    ranking, or require graph-relevance ranking before `alembic_code_explore`
    is considered useful?
12. Dynamic edges: which dynamic-dispatch classes are required for
    AlembicPlugin/AlembicCore TypeScript first, and which should be explicitly
    reported as unsupported?
13. Evaluation: what is the acceptance corpus and metric for proving Codex uses
    Alembic source graph tools instead of broad Read/Grep exploration?

## Recommended Next Step

Promote CGK-0 and CGK-0A first. They should not implement the new feature yet.
Their job is to produce the exact current source graph inventory, finish the
deeper CodeGraph source-code study, reproduce the scope/transport issues safely,
audit current Plugin cold-start/rescan behavior, inspect the Codex-agent
host-entry and MCP initialize path, and convert this discussion into a confirmed
demand sequence.

After CGK-0 and CGK-0A, promote CGK-11 and CGK-13 before or alongside the first
implementation wave so total control has a learning-decision ledger and a global
responsibility contract.

Then split execution into two visible tracks:

1. Direction 1, knowledge base construction and freshness: CGK-1, CGK-2,
   CGK-2A, CGK-2B, CGK-7, and CGK-9. These should build the durable source graph
   storage/index/freshness/runtime path.
2. Direction 2, knowledge base use and code logic relationship use: CGK-3,
   CGK-4, CGK-5, CGK-8, CGK-10, CGK-12, CGK-14, CGK-15, CGK-16, CGK-17, and
   CGK-18. These should build the intent/prime/source graph usage path, code
   relationship retrieval, impact reasoning, boundary-state semantics,
   tool-specific clean output, evaluation, and end-to-end fused workflow proof.

CGK-6 should remain the first cross-direction acceptance task. It should not run
until there is enough Direction 1 evidence that the graph is real and fresh, and
enough Direction 2 evidence that Codex uses the graph and code logic
relationships correctly. CGK-18 should remain the long-running unattended
rollout task after CGK-14/CGK-6 prove the first end-to-end path, so optimization
continues from real transcript evidence.

## Source References

External:

- `https://github.com/colbymchenry/codegraph`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/mcp/server-instructions.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/installer/targets/codex.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/installer/targets/toml.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/db/schema.sql`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/db/migrations.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/db/queries.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/package.json`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/index.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/extraction/index.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/resolution/index.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/resolution/callback-synthesizer.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/context/index.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/context/formatter.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/search/query-utils.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/sync/watcher.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/mcp/engine.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/mcp/session.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/mcp/proxy.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/mcp/tools.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/bin/codegraph.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/src/installer/index.ts`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/scripts/agent-eval/ab-sufficiency.sh`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/scripts/agent-eval/ab-adoption.sh`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/scripts/agent-eval/parse-bench-readme.mjs`
- `https://raw.githubusercontent.com/colbymchenry/codegraph/main/scripts/agent-eval/parse-session.mjs`

Local:

- `AlembicCore/src/core/ast/ProjectGraph.ts`
- `AlembicCore/src/core/analysis/CallGraphAnalyzer.ts`
- `AlembicCore/src/service/knowledge/CodeEntityGraph.ts`
- `AlembicCore/src/service/knowledge/SourceRefReconciler.ts`
- `AlembicCore/src/service/knowledge/KnowledgeGraphService.ts`
- `AlembicCore/src/service/search/SearchEngine.ts`
- `AlembicCore/src/service/knowledge/KnowledgeSyncService.ts`
- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts`
- `AlembicCore/src/infrastructure/database/migrations/001_initial_schema.ts`
- `AlembicCore/src/repository/code/CodeEntityRepository.ts`
- `AlembicPlugin/lib/codex/mcp/handlers/structure.ts`
- `AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts`
- `AlembicPlugin/lib/codex/mcp/public-tools/contract.ts`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/lib/codex/mcp/core-tools/output.ts`
- `AlembicPlugin/lib/codex/mcp/PluginToolSurfaceCatalog.ts`
- `AlembicPlugin/lib/codex/mcp/McpServer.ts`
- `AlembicPlugin/lib/codex/mcp/CodexMcpServer.ts`
- `AlembicPlugin/lib/cli/SetupService.ts`
- `AlembicPlugin/lib/cli/KnowledgeSyncService.ts`
- `AlembicPlugin/lib/codex/ToolPolicy.ts`
- `AlembicPlugin/lib/codex/EnhancementRoute.ts`
- `AlembicPlugin/lib/service/FileChangeDispatcher.ts`
