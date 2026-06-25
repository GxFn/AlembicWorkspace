# Alembic Search Output Quality ASQ4 Full Chain Solution

Date: 2026-06-16

Design Key: `alembic-search-output-quality-asq4-full-chain-solution-2026-06-16`

Design state: controller-assigned Design follow-up; ready for controller review

Responsible window: Design

Receiving window: AlembicWorkspace controller

State root:
`.wakeflow-active/current/alembic-search-output-quality-optimization`

Task package:
`alembic-search-output-quality-asq4-design-full-chain-solution-p5`

Target task: `asq4-design-full-chain-solution-t1`

## Boundary

This document is a Design solution and task-group recommendation. It is not a
dispatch packet, not controller acceptance, not a product-code patch, and not a
Wakeflow state mutation.

ASQ must stop the point-patch loop. ASQ-2 and ASQ-2A repaired real Plugin
defects, and ASQ-3 proved those repairs reached a fresh MCP surface, but final
quality still fails because the complete search chain is not ready: searchable
knowledge is missing for the validation topics, semantic/vector readiness is
ambiguous, relation evidence is absent, and Plugin trust gates still admit
unrelated trusted results in some request shapes.

## Problem

The user goal is that `alembic_search` helps an agent find accurate, high-value
knowledge in the real AlembicWorkspace project. The tool must not pass merely
because JSON is valid, refs expand, weak candidates are withheld, or diagnostics
are visible.

ASQ-3 still blocks final acceptance:

- semantic/context ASQ, GPC, and output-quality queries return zero trusted
  useful content;
- keyword `alembic_search` and `ProjectGraphProvider` queries return zero
  trusted content;
- activeFile/module ProjectGraphProvider search recognizes the file but returns
  unrelated trusted items;
- `kind=fact` for ProjectContext/resident vector status returns an unrelated
  vendored-core fact;
- relationChains are absent or stale;
- resident vector telemetry reports 140 entries and dimension 1024, while
  Plugin suppresses vector evidence as `empty-vector-index` because
  `indexSize=0`.

## Design Conclusion

The remaining work should be rebuilt as one connected repair chain:

1. align the public search contract and probes so ASQ stops validating retired
   modes;
2. produce and rescan the missing knowledge coverage pack with source refs and
   explicit relations;
3. repair vector readiness truth so `indexSize=0` is not confused with an empty
   semantic index when count/dimension/vector availability say otherwise;
4. surface bounded direct relation evidence in `alembic_search`, without
   prime-style context traversal;
5. tighten Plugin trust gates so activeFile/module/kind hints can narrow or
   anchor results, but cannot make unrelated items trusted;
6. run a fresh temporary Codex/Test MCP validation window only after those
   producer conditions are present.

Agent query direction is top-down: the agent searches a topic, inspects summary
items and stable ids, follows get/expand, and uses relation evidence to decide
what to trust. Engineering support direction must be bottom-up: knowledge
entries and relations first, vector/index truth second, candidate/trust scoring
third, MCP projection fourth, fresh-window validation last.

## Code Facts Checked

The following read-only code facts informed this design:

- AlembicPlugin `search.ts` still accepts/routes `context` and normalizes
  `bm25/context`, while the confirmed search contract is only
  `auto`, `keyword`, and `semantic`.
- AlembicCore resident contract already defines resident search modes as
  `auto`, `keyword`, and `semantic`.
- Alembic HTTP search schemas still expose `bm25` in query/body routes, and the
  route still comments on `auto/bm25/semantic/keyword/ranking`.
- Plugin search builds candidates from resident/embedded search plus
  `knowledgeService.list`; `activeFile`, `module`, hostDeclaredIntent, and
  sourceRefs are added to candidate scoring.
- Plugin relationChains are generated only from returned item relations or
  explicit resident relation evidence. If knowledge entries lack relation
  metadata, the provider has no relation chain to show.
- Alembic resident `/api/v1/search` builds residentVector telemetry from
  `vectorService.getStats()`.
- AlembicCore HNSW vector adapter currently reports `indexSize: 0` because
  persisted file size is only known after flush, while count/dimension can still
  describe usable in-memory vector data.
- Plugin currently treats `residentVector.stats.indexSize === 0` as
  `empty-vector-index`, which can suppress resident vector evidence even when
  the resident service reports count/dimension/provider availability.
- Alembic startup performs vector reconcile and search-index refresh as
  best-effort; it does not guarantee a full vector build unless setup/embed or
  explicit commands run that path.

## Knowledge Coverage Pack

The final ASQ probes cannot succeed until these topics exist as searchable
knowledge entries in the real AlembicWorkspace knowledge DB. Each entry should
include stable sourceRefs, kind/category/tags, concise summary, bounded detail
content, and relation metadata.

| Required topic | Suggested kind | Source of truth | Suggested owner |
| --- | --- | --- | --- |
| ASQ output quality acceptance: content quality beats schema validity; search/get/expand, whyMatched, scoreBreakdown, refs, diagnostics, relationChains, vector truth | decision | ASQ demand, ASQ0 intake, ASQ3 controller review | AlembicWorkspace controller / Design evidence |
| `alembic_search` public contract: operations `search/get/expand`, modes `auto/keyword/semantic`, summary-only search, exact get/expand, no ProjectContext/source graph answering | rule | Design requirement design and Plugin tool schema/handler | AlembicPlugin |
| Removed mode cleanup: `bm25/context` are not public `alembic_search` modes and must not appear in final ASQ positive probes | decision | confirmed requirement design, current schema scans | AlembicPlugin with Alembic/AlembicCore evidence |
| Plugin search implementation chain: MCP handler, candidate provider, relation provider, resident client, detailRef canonicalization | fact | `AlembicPlugin/lib/runtime/mcp/handlers/search.ts` and retrieval providers | AlembicPlugin |
| ProjectGraphProvider / ProjectContext request selection: graph operations, ProjectContext public contract, owner boundary | fact | `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts` and Core ProjectContext contract | AlembicPlugin + AlembicCore |
| GPC graph output-quality problem and accepted progress: schema caps, ProjectContext ranking, partial/error diagnostics, generated artifact/parser noise | fact/decision | GPC state root problem intake and controller evidence | AlembicWorkspace controller with AlembicPlugin/Core evidence |
| Resident vector lifecycle: `/api/v1/search`, `VectorService`, embed/fullBuild/validate, count/dimension/indexSize meaning | fact | Alembic HTTP route, AlembicCore VectorService/vector adapters | Alembic + AlembicCore |
| Wakeflow direct-thread governance: target result is not acceptance, thread ids are runtime-only, controller return/readback is transport proof only | rule | workspace AGENTS and Wakeflow target skill | AlembicWorkspace / Wakeflow |

Minimum relation edges:

- ASQ acceptance decision `requires` `alembic_search` public contract rule.
- ASQ acceptance decision `requires` resident vector lifecycle fact.
- ASQ acceptance decision `requires` Plugin search implementation fact.
- ASQ acceptance decision `requires` relation-chain evidence rule.
- ProjectGraphProvider fact `implements` ProjectContext request selection.
- GPC graph quality fact `relates_to` ProjectGraphProvider / ProjectContext.
- Wakeflow direct-thread governance rule `guards` ASQ validation return flow.

These relations should be represented in the knowledge entry `relations` field
or the current knowledge-edge equivalent consumed by the search relation
provider. They must not depend on prime relation traversal.

## Vector Readiness Decision

`vectorIndex=0` must not remain a vague ASQ blocker. It needs a binary owner
diagnosis:

- If vector stats show `count=0`, `dimension=0`, provider unavailable, or
  validation reports an empty index, this is an Alembic/AlembicCore vector build
  or provider readiness issue. The repair is to make embed/fullBuild/validate
  reachable and prove the resulting stats and semantic query.
- If stats show `count>0`, `dimension>0`, provider available, and semantic
  query can return vector hits, but `indexSize=0` remains because the HNSW
  adapter has not flushed to disk, this is telemetry/projection misuse. Plugin
  must stop treating `indexSize=0` alone as an empty-vector signal; Core/main
  should expose a clearer field such as vector count / has vectors / flush
  state / semantic usable.
- If semantic search returns no vector hits despite count/dimension/provider
  readiness, this is a resident semantic execution issue. The diagnostic must
  say no semantic hits, sparse-only fallback, provider failure, timeout, or
  stale index, not the generic `empty-vector-index`.

Final ASQ should accept either proven semantic readiness or a precise degraded
diagnostic when provider/index is genuinely unavailable. It should not accept a
false unavailable state caused only by `indexSize=0`.

## RelationChain Decision

`alembic_search` should show relationChains as bounded direct evidence, not as
prime-like context assembly.

Required behavior:

- Use explicit relations on returned knowledge items and explicit resident
  relation evidence as relation sources.
- Build chains only inside the bounded candidate pool and hop/fanout budget.
- Include relationChains in search/get/expand when the selected item has
  relation metadata.
- If relations are absent, diagnostics must say whether the selected knowledge
  entries lacked relation metadata, resident relation evidence was absent, or
  relation projection was stale.

Forbidden behavior:

- Do not traverse the whole Recipe graph to invent context.
- Do not pull unrelated prime relation packages into pure search success.
- Do not mark relationChains healthy when only diagnostics or empty arrays are
  present.

## Trust And Ranking Decision

`activeFile`, `module`, `kind`, and `hostDeclaredIntent` may be narrowing hints
or explicit filters. They must not create trust by themselves.

Required trust gates:

- A trusted activeFile/module result needs at least one direct anchor:
  exact/normalized sourceRef match, path/file/symbol match, module metadata
  match, explicit relation to that source, or real semantic evidence when vector
  is available.
- ActiveFile/module hints can increase score only after a direct anchor exists.
  They cannot make generic entries such as CI gates or doctrine entries trusted.
- `kind=fact` must be a hard kind filter plus topic-anchor check. A fact with no
  ProjectContext/resident/vector topic anchor must be withheld, even if it has
  high base quality.
- Base score, quality score, usage count, or generic terms cannot compensate
  for missing domain anchors.
- When no trusted item remains, diagnostics should name the missing anchor
  class: sourceRef/symbol, knowledge content, vector semantic evidence, or kind
  topic anchor.

## Recommended Task Groups

### ASQ4A: Search Contract And Probe Convergence

- Type: implementation plus controller probe adjustment
- Suggested owner windows: AlembicPlugin primary; Alembic and AlembicCore for
  resident/API evidence; AlembicWorkspace controller for final probe wording
- Depends on: ASQ-3 review
- Scope:
  - converge visible `alembic_search` mode contract to `auto`, `keyword`,
    `semantic`;
  - remove or quarantine public `bm25/context` routes, schema entries, router
    aliases, tool descriptions, tests, docs, and ASQ positive probes;
  - keep internal scorer names only if they are private implementation details
    with no public mode/API implication;
  - update final ASQ probes so `bm25/context` are negative/removed-mode checks,
    not success requirements.
- Acceptance:
  - repo-wide Alembic-space scan records no public `alembic_search` mode
    support for `bm25/context`;
  - `auto/keyword/semantic` schema/runtime validation agree across Plugin,
    resident client, Alembic HTTP request schema, and Core resident contract;
  - final probe set no longer relies on retired modes as positive evidence.
- Non-goals:
  - no semantic quality claim;
  - no broad Core search-engine rewrite unless required to remove public mode
    leakage.
- Stop conditions:
  - a real current consumer still sends removed modes and has no replacement;
  - controller decides the ASQ state root completion definition must keep old
    modes despite the confirmed Design requirement.

### ASQ4B: Knowledge Coverage Pack And Rescan

- Type: knowledge production / rescan / evidence
- Suggested owner windows: AlembicWorkspace controller for ASQ/GPC/Wakeflow
  governance facts; AlembicPlugin for Plugin/search/ProjectGraphProvider facts;
  Alembic and AlembicCore for resident/vector/Core facts
- Depends on: ASQ4A contract convergence or explicit controller decision to
  run content production in parallel
- Scope:
  - create or update the required knowledge entries listed in this design;
  - attach sourceRefs to the state-root evidence and code files they summarize;
  - add relation metadata for the minimum relation edges;
  - run the current knowledge creation/rescan route that updates the real
    AlembicWorkspace knowledge DB and search source refs.
- Acceptance:
  - `alembic_mcp_status` still reports ready knowledge and the expected entry
    count after rescan;
  - keyword searches for `alembic_search`, `ProjectGraphProvider`,
    `ASQ output quality`, `GPC ProjectContext graph output quality`, and
    `Wakeflow direct-thread thread ids` each return at least one relevant
    top result with stable id/detailRef;
  - get/expand on those returned refs produces bounded useful content;
  - relation metadata is visible on at least ASQ/search, ProjectGraphProvider,
    vector, and Wakeflow entries.
- Non-goals:
  - no search algorithm tuning;
  - no automatic invention of knowledge without source evidence;
  - no full Recipe bodies in search output.
- Stop conditions:
  - source evidence is missing for a required entry;
  - rescan/submit route cannot update the real AlembicWorkspace DB;
  - controller decides some topic belongs outside project knowledge.

### ASQ4C: Resident Vector Truth And Semantic Readiness

- Type: implementation / diagnostics
- Suggested owner windows: Alembic and AlembicCore producer; AlembicPlugin
  consumer projection
- Depends on: ASQ4A; can run partly before ASQ4B if using existing knowledge
- Scope:
  - make resident vector telemetry distinguish count, dimension, provider
    availability, real vector hits, persistent index bytes, flush state, and
    semantic usability;
  - repair Plugin `empty-vector-index` normalization so `indexSize=0` alone
    does not suppress resident vector evidence;
  - if the index is genuinely empty, repair or document the embed/fullBuild
    route and prove a rebuild/validate path;
  - expose actionable diagnostics for timeout, provider missing, sparse-only
    fallback, empty semantic hits, and stale index.
- Acceptance:
  - direct Alembic vector validate/status evidence explains whether the real
    workspace has usable vectors;
  - resident `/api/v1/search` reports vector telemetry consistently with Core
    SearchEngine `semanticUsed/vectorUsed`;
  - Plugin search output no longer reports `empty-vector-index` solely because
    HNSW `indexSize=0`;
  - a semantic ASQ/GPC/search query either returns relevant semantic evidence
    when vectors are available, or returns a precise unavailable diagnostic
    when they are not.
- Non-goals:
  - no new provider configuration secrets;
  - no mandatory semantic success when the local environment genuinely lacks an
    embed provider;
  - no Plugin-local semantic/vector substitute.
- Stop conditions:
  - vector provider availability cannot be proven without user credentials;
  - semantic quality failure is actually missing knowledge content, not vector
    runtime.

### ASQ4D: RelationChain Production And Projection

- Type: implementation / data contract
- Suggested owner windows: AlembicPlugin primary; AlembicCore/Alembic if
  relation metadata or resident relation evidence needs producer changes
- Depends on: ASQ4B relation metadata; ASQ4C if relation evidence depends on
  resident semantic metadata
- Scope:
  - define the direct relation fields `alembic_search` consumes;
  - ensure search/get/expand project relationChains from returned knowledge
    item relations and explicit resident relation evidence;
  - add diagnostics that distinguish missing relation metadata from projection
    failure;
  - keep chains bounded by hop/fanout and candidate pool.
- Acceptance:
  - ASQ/search result shows relationChains linking ASQ acceptance, search
    contract, Plugin implementation, vector truth, and Wakeflow governance;
  - ProjectGraphProvider result shows a relation to ProjectContext/GPC facts;
  - get/expand for a related item preserves relation refs or a clear relation
    unavailable diagnostic;
  - unit/integration tests prove relation metadata creates visible chains and
    absent metadata creates explicit diagnostics.
- Non-goals:
  - no prime relation traversal;
  - no unbounded Recipe graph expansion;
  - no relation health success from empty arrays.
- Stop conditions:
  - the knowledge entry model cannot store the needed relations;
  - producer windows cannot supply source-backed relation edges.

### ASQ4E: Plugin Trust Threshold And Anchor Gates

- Type: implementation
- Suggested owner window: AlembicPlugin
- Depends on: ASQ4B; ASQ4C for semantic evidence; can start with fixtures
- Scope:
  - require direct anchor evidence before activeFile/module hints can produce a
    trusted item;
  - enforce `kind` and topic anchors for fact/decision/rule retrieval;
  - prevent base score, quality score, generic terms, or activeFile hint text
    from admitting unrelated trusted items;
  - make withheld diagnostics name the missing anchor class.
- Acceptance:
  - activeFile/module ProjectGraphProvider probe returns ProjectGraphProvider
    or ProjectContext request-selection content, or zero trusted results with a
    precise missing-source-anchor diagnostic;
  - `kind=fact` ProjectContext/resident vector status probe never returns the
    unrelated vendored-core fact;
  - Wakeflow direct-thread governance probe returns the Wakeflow rule only when
    that knowledge exists, otherwise zero trusted results with a governance
    anchor diagnostic;
  - exact layer-contract keyword search and detailRef get/expand remain green.
- Non-goals:
  - no final fusion/rerank;
  - no hidden host-intent broadening;
  - no ProjectContext source lookup inside `alembic_search`.
- Stop conditions:
  - no knowledge content exists for the probe target after ASQ4B;
  - tightening trust gates would hide valid exact matches without replacement
    diagnostics.

### ASQ4F: Fresh Temporary MCP Validation

- Type: Test validation
- Suggested owner window: Test
- Depends on: ASQ4A through ASQ4E accepted by controller for validation
- Scope:
  - refresh local AlembicPlugin;
  - create a new temporary Codex/Test validation window;
  - run final real AlembicWorkspace MCP probes against the freshly loaded tool
    surface;
  - preserve compact raw excerpts and return exactly one TargetResultEnvelope.
- Final probe set:
  - `alembic_mcp_status` for readiness, project identity, entry count, and
    vector/resident diagnostics;
  - `alembic_search search mode=keyword query="alembic_search ProjectGraphProvider"`;
  - `alembic_search search mode=auto query="ASQ GPC graph search output quality whyMatched scoreBreakdown detailRefs relationChains diagnostics"`;
  - `alembic_search search mode=semantic query="why alembic_search must return useful semantic Recipe content rather than schema-valid summaries"` when resident semantic is available;
  - activeFile/module ProjectGraphProvider query using
    `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`;
  - `kind=fact` ProjectContext/resident vector status query;
  - `kind=rule` Wakeflow direct-thread runtime-only thread-id governance query;
  - get and expand using returned stable refs and generated operation refs;
  - relationChains/detailRefs/sources/diagnostics/nextActions inspection;
  - negative removed-mode check for `bm25/context` if ASQ4A removes them.
- Acceptance:
  - visible top results are relevant and agent-useful for each positive probe;
  - no unrelated trusted item appears in activeFile/module or kind/fact probes;
  - semantic/vector state is either genuinely used or honestly unavailable;
  - relationChains are present for relation-backed entries;
  - search-returned refs expand to bounded content;
  - removed modes are rejected or absent according to ASQ4A.
- Non-goals:
  - no product code edits from Test;
  - no reuse of old validation windows;
  - no acceptance by transport/readback alone.
- Stop conditions:
  - local plugin refresh fails;
  - MCP status is not ready for the real AlembicWorkspace project;
  - a probe exposes a new chain gap that belongs back in the ASQ state root.

### ASQ4G: Controller Closeout And Cleanup Decision

- Type: controller review / acceptance / follow-up decision
- Suggested owner window: AlembicWorkspace
- Depends on: ASQ4F TargetResultEnvelope
- Scope:
  - review raw evidence, not only target summaries;
  - decide accept/rework/block;
  - close ASQ only if all completion criteria are met;
  - roll TODO/Backlog for any valid remaining cleanup, such as internal scorer
    naming or non-public legacy HTTP compatibility.
- Acceptance:
  - controller records whether ASQ search output is accepted in the real
    AlembicWorkspace MCP surface;
  - any remaining old-mode/internal-name cleanup has a consumer, owner, and
    removal condition;
  - no final summary treats target result, readback, or diagnostics-only output
    as acceptance.
- Non-goals:
  - no Design or Test acceptance decision;
  - no new demand hidden inside ASQ closeout.
- Stop conditions:
  - evidence is missing or conflicts with the completion definition;
  - user confirmation is required for a scope change.

## Controller Intake Notes

Design recommends controller create the next executable wave from ASQ4A through
ASQ4F, not send another single AlembicPlugin point fix. The first controller
decision is whether to enforce the confirmed three-mode contract immediately
inside ASQ, because current ASQ state text and probes still contain retired
`bm25/context` language while the confirmed requirement design removed those
modes.

If controller wants minimum risk sequencing, use this order:

```text
ASQ4A contract/probe convergence
  -> ASQ4B knowledge coverage pack and rescan
      -> ASQ4C vector truth
      -> ASQ4D relationChains
      -> ASQ4E trust gates
          -> ASQ4F fresh Test MCP validation
              -> ASQ4G controller closeout
```

ASQ4C, ASQ4D, and ASQ4E can be dispatched in parallel only after ASQ4B has
created fixture or real knowledge entries sufficient for each owner to test
against stable anchors.

## Source References

- `.wakeflow-active/current/alembic-search-output-quality-optimization/demand.json`
- `.wakeflow-active/current/alembic-search-output-quality-optimization/task-packages/alembic-search-output-quality-asq4-design-full-chain-solution-p5.json`
- `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq3-fresh-mcp-final-validation-review-2026-06-16.md`
- `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/asq3-fresh-mcp-final-validation-t1-2026-06-16.md`
- `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq2-plugin-semantic-relevance-diagnostics-review-2026-06-16.md`
- `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq2a-generated-detailref-expand-review-2026-06-16.md`
- `.wakeflow-active/current/alembic-graph-project-context-output-quality-optimization/intake/controller-gpc0-problem-intake-2026-06-15.md`
- `Design/docs/current/alembic-search-output-quality-optimization-requirement-design-2026-06-15.md`
- `Design/docs/current/alembic-search-output-quality-optimization-requirement-group-2026-06-16.md`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/retrieval/RecipeCandidateProvider.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/retrieval/RecipeRelationChainProvider.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/contracts/KnowledgeContextBaseInput.ts`
- `Alembic/lib/http/routes/search.ts`
- `Alembic/lib/shared/schemas/http-requests.ts`
- `Alembic/lib/injection/modules/KnowledgeModule.ts`
- `Alembic/lib/service/bootstrap/UiStartupTasks.ts`
- `Alembic/bin/cli.ts`
- `AlembicCore/src/daemon/ResidentServiceContracts.ts`
- `AlembicCore/src/service/search/SearchEngine.ts`
- `AlembicCore/src/service/vector/VectorService.ts`
- `AlembicCore/src/service/vector/SyncCoordinator.ts`
- `AlembicCore/src/infrastructure/vector/IndexingPipeline.ts`
- `AlembicCore/src/infrastructure/vector/HnswVectorAdapter.ts`
