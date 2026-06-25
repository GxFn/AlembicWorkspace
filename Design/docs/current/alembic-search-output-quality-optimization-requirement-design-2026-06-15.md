# Alembic Search Output Quality Optimization Requirement Design

Date: 2026-06-15

Design Key: `alembic-search-output-quality-optimization-2026-06-15`

Design state: user-confirmed requirement design; not dispatched; waiting controller intake

Latest adjustment: 2026-06-16 user narrowed `alembic_search` to a pure
knowledge-base search tool. It must no longer bind to intent/context behavior,
and the `search` operation should return summaries plus stable unique ids only.
Full Recipe details are fetched separately by exact id / ref. A later
correction on the same date clarified that all Recipes that meet the explicit
search match threshold should be returned, not hidden behind a "trusted
candidate only" gate. Search needs a real match-threshold design for lexical,
metadata, and semantic/vector evidence. A final simplification sets the core
search model as two lanes only: AlembicPlugin default keyword weighting is the
always-available keyword lane; Alembic main resident semantic/vector search is
called only when the main service exists and advertises the capability. Each
lane admits matches by threshold, and `alembic_search` returns the de-duplicated
union. The effective mode surface is only `auto`, `keyword`, and `semantic`.
Removed modes are deleted, not mapped or retained as compatibility paths.
Field-weighted keyword scoring stays as the Plugin keyword lane; Alembic main
does not need to provide a duplicate keyword route. Final user confirmation
accepted the initial thresholds, filter-only metadata admission,
AND-across-fields / OR-within-field filter semantics, no final fusion rerank,
the staged ASQ route, and hard repo-wide removed-mode cleanup acceptance. When
Alembic main is present and semantic/vector capability is available, Plugin
waits for the resident semantic matches, then narrows / filters / merges the
returned Recipe summaries before producing the final MCP result.

Current window: Design

Scope: optimize `alembic_search` as a Codex-facing knowledge / Recipe search
tool. This document is an independent demand and does not change the current
ProjectContext / graph demand.

## Entry Conclusion

This demand starts from the user's request to create a new `alembic_search`
optimization requirement and first deeply scan the real implementation.

The current code shows that `alembic_search` is not a single search function.
It is a cross-repository chain:

1. AlembicPlugin exposes the MCP schema, tool catalog, router, handler, output
   projector, and Codex-visible contract.
2. AlembicPlugin owns the default keyword lane and optionally asks the resident
   search client for semantic/vector evidence.
3. Alembic daemon `/api/v1/search` calls AlembicCore `SearchEngine` and builds
   resident telemetry and current resident metadata. Intent evidence,
   host-turn context, and prime-oriented metadata must not become
   `alembic_search` behavior.
4. AlembicCore owns the deterministic search engine, field-weighted ranking,
   semantic / vector fallback behavior, and search metadata.
5. AlembicPlugin then projects the keyword lane, optional semantic lane, or
   clean unavailable diagnostics into a clean MCP `structuredContent` response
   with matched Recipe summaries.

The optimization must therefore cover runtime failure behavior, relevance
quality, evidence preservation, and MCP output stability. It must not turn
`alembic_search` into a project-structure or source graph tool.

## User Goal

Make `alembic_search` genuinely useful for host agents as a pure knowledge-base
search tool:

- return every Recipe that meets the explicit search match threshold as a
  bounded summary with a stable unique identifier;
- avoid noisy unrelated old knowledge for vague or low-information queries;
- preserve why a result matched, including Plugin keyword weighting, explicit
  filter evidence, and resident semantic/vector evidence when available;
- stay independent from host intent, task intent, session history, active file,
  active module, and prime-style context assembly;
- support Recipe-scoped / faceted range search by combined knowledge
  attributes such as domain dimension, category, kind, knowledge type, tags,
  scope, and language, so an agent can find matching Recipe summaries and
  stable ids before deciding which individual Recipe to inspect;
- degrade honestly when resident daemon, vector, or keyword-only local data is not
  available;
- never fail a ready knowledge query with an internal initialization error when
  a safe degraded response is possible;
- keep detail lookup as an exact follow-up by unique id / detail ref, not as
  hidden broad search fallback.

## Non-goals

- Do not redesign ProjectContext.
- Do not make `alembic_search` answer project map, module graph, source symbol,
  file flow, or impact-radius questions. Those belong to ProjectContext-backed
  project information tools.
- Do not add a new MCP tool.
- Do not add a new public abstraction layer above the existing clean output
  contract.
- Do not make `alembic_search` perform `prime`-style Recipe relation-chain
  traversal, context assembly, or multi-hop recommendation expansion.
- Do not bind `alembic_search` relevance to host intent, task intent, session
  history, active file, active module, or hidden agent context.
- Do not return full Recipe content from the `search` operation. Search returns
  summary candidates plus stable unique identifiers; Recipe details are fetched
  separately by exact id / ref.
- Do not make scoped Recipe search into a project map. Faceted Recipe search
  returns bounded summary candidates, optional grouping metadata, counts, and
  stable ids; it does not answer source/module/file graph structure.
- Do not keep old compatibility surfaces only to hide failures.
- Do not keep removed search modes as compatibility inputs. Removed modes are
  cleaned from schema, handler logic, tests, docs, and probes instead of being
  mapped to keyword behavior.
- Do not keep `bm25` / `BM25` as a compatibility mode, output label, test name,
  comment, doc term, probe expectation, or internal branch. This active ASQ
  demand may name the retired term only to define the deletion target; completion
  requires the term and behavior removed from current source, tests, docs,
  runtime output, and validation probes, or archived out of active project docs.
- Do not change Guard, bootstrap, rescan, submit knowledge, dimension
  completion, work lifecycle, or Recipe mutation behavior.
- Do not implement product code from the Design window.

## Consolidated Landing Design

Confirmation status: user-confirmed requirement design for controller intake.
The Design window has not dispatched implementation and has not mutated
controller state.

### 2026-06-16 Source Merge And Correction Addendum

Merge status: later controller research, correction notes, and partial Design
documents have been folded into this requirement design. This file remains the
authoritative ASQ requirement. The later documents are evidence sources and
correction inputs, not parallel requirements.

Authority order for ASQ after this merge:

1. This original requirement's user goal, non-goals, search purity rule,
   threshold admission rule, two-lane model, `search` / `get` / `expand`
   boundary, and acceptance criteria remain the base authority.
2. The 2026-06-16 user correction is binding: Recipe relation chains,
   relation-chain traversal, relation proximity, relation health, relation edge
   diagnostics, and prime context material do not belong to public
   `alembic_search`. They belong only to the `prime` tool family when valid.
3. Later code research may add current-source facts, missing tests, and concrete
   phase sequencing. It cannot override the original ASQ non-goals or re-add
   relation-chain behavior to `alembic_search`.
4. Any later ASQ4 / ASQ4B1 / package text that requires relation metadata,
   relation persistence, relation-backed acceptance, or relation-chain
   projection for `alembic_search` is superseded as error-correction material.

Accepted later evidence to merge:

- ASQ4 validation facts showed that a schema-valid search response is not enough:
  ASQ/output-quality, `alembic_search`, and `ProjectGraphProvider` probes could
  still return zero useful trusted content or unrelated trusted content.
- Active file, active module, source ref, host intent, session, caller context,
  and generic trust signals were confirmed as real noise paths. They must be
  ignored or diagnosed as compatibility-only inputs for direct search.
- Resident semantic/vector telemetry must be truthful. A single storage-size or
  flush-state signal cannot by itself prove that semantic search is unavailable
  when count, dimension, provider, and query evidence show otherwise.
- Direct source-backed searchable content may be added where ASQ probes reveal
  missing knowledge coverage, but only as direct searchable entries with stable
  refs and exact `get` / `expand` behavior. It must not add relation metadata or
  relation edges as ASQ completion criteria.
- The existing production / submit / rescan route is useful ASQ evidence only
  when it proves non-destructive, source-backed, reviewable, searchable, and
  expandable direct content. Verify-only rescans, rejected submissions, or
  unpublished entries do not satisfy ASQ.
- Current source reads confirmed concrete coupling points in AlembicPlugin,
  Alembic main, and AlembicCore. These facts are accepted as implementation
  guidance: public schema/tool description drift, search handler relation and
  prime metadata imports, candidate provider active-file/module/source-ref
  scoring, resident client prime metadata compacting, Alembic resident intent /
  Decision Register / prime metadata production, and Core semantic/filter/vector
  truth boundaries.

Superseded later evidence:

- ASQ4 relation-chain production / projection work is not an ASQ search
  requirement.
- ASQ4B1 relation metadata persistence, relation edge synchronization, and
  relation-backed knowledge-pack acceptance are not ASQ prerequisites.
- Any probe that expects `alembic_search` to surface relation chains, relation
  health, relation diagnostics, or relation-backed success is invalid for ASQ.
- Any package derived from the old relation route must be treated as correction
  evidence, not as a valid future implementation package.

#### Tool Responsibility Isolation Matrix

| Boundary | `alembic_search` direct-search capability | `alembic_prime` prime-context capability | Shared lower-level retrieval |
| --- | --- | --- | --- |
| Valid inputs | Explicit query, explicit keywords, exact id/ref/detail ref, public mode, limit, and explicit Recipe / knowledge filters. | Intent ref, recognized intent, host-declared intent, active file/module, source refs, session/task context. | Neutral query/filter/search primitives and knowledge ids. |
| Invalid inputs | Host intent, active file/module, source refs, session history, caller context, prime package, relation evidence. These may be accepted only as ignored compatibility metadata with diagnostics. | Public search input contract as the prime assembly contract. Prime must not depend on public search DTO semantics. | Tool-specific hidden context, public search output fields, or prime Trust Receipt fields. |
| Valid behavior | Direct exact/filter/keyword/semantic retrieval, threshold admission, stable summary refs, exact `get` / `expand`, honest unavailable diagnostics. | Context assembly, Recipe relation-chain evidence, accepted Recipe / Guard material, Trust Receipt, prime package consumption, degraded prime diagnostics. | Core search engine, knowledge list, vector execution, indexing, neutral knowledge entry DTOs, normalized metadata filters. |
| Forbidden behavior | Relation-chain traversal, relation proximity ranking, relation health, relation edge diagnostics, Decision Register enrichment unless directly matched, intent evidence, prime injection package, active-file/source-ref boost. | Calling public `alembic_search` handler as its context assembly route or using search threshold vocabulary as prime's acceptance contract. | Sharing public handlers, public projectors, or fields whose meaning differs by capability. |
| Output | Summary candidates, match routes, match rates, stable ids/detail refs, normalized filters, omitted/below-threshold counts, route diagnostics, next actions. | Prime ref, prime knowledge material, accepted/requires-verification material, trust posture, relation evidence when available, degraded prime state. | Neutral facts only; projection happens inside the owning public tool. |
| Tests | Search import boundary, public schema/description, no prime fields in output, ignored host/context inputs, direct threshold admission, get/expand exactness. | Prime preservation, Trust Receipt behavior, relation evidence through prime only, honest degraded prime state. | Core/resident unit tests for neutral score/filter/vector truth and cache separation. |

#### Invalid Positive Evidence Matrix

These signals may be useful diagnostics, but none can be used as ASQ completion
or positive search-quality evidence by itself.

| Signal | Why it is insufficient | Correct treatment |
| --- | --- | --- |
| MCP server is ready or transport readback succeeds | Transport proves reachability, not result quality or acceptance. | Continue to raw `alembic_search` outputs, refs, diagnostics, and controller review. |
| Search returns schema-valid JSON | Schema validity can still carry unrelated candidates, empty summaries, bad refs, or misleading diagnostics. | Inspect visible summary, `structuredContent.items`, `whyMatched`, scores, refs, and diagnostics. |
| Diagnostic explains why content is missing | A diagnostic is useful, but it does not make missing content a successful search. | Classify as degraded, no-match, unavailable, or blocker according to the completion definition. |
| A knowledge entry was created but not published/searchable | Created or pending entries are not necessarily visible to `alembic_search`. | Require explicit publication/searchability proof plus `get` / `expand`. |
| Rescan returns verify-only coverage | Verify-only can update freshness without producing missing ASQ content. | Treat as evidence; require a produce/publish/search route if direct content is still missing. |
| Relation metadata, relation edges, relation health, or relation-chain output appears | This is the corrected historical error for ASQ search. | Reject as ASQ search success; validate only through `prime` if a prime task exists. |
| Active file/module/source refs improve ranking | These are hidden context signals for ASQ search and caused unrelated trusted results. | Ignore or diagnose as compatibility-only unless they are explicit query/filter evidence. |
| Resident returns prime metadata | Prime metadata may be valid for `alembic_prime`, but is not direct search evidence. | Strip or ignore before public search projection; preserve through prime only. |
| Exact `get`/`expand` works for one ref | Detail lookup success does not prove broad search precision. | Keep as ref-stability evidence and still validate query classes, no-match behavior, and semantic truth. |

### Primary Actors

- Host agent: calls `alembic_search` through the Codex / MCP tool surface and
  needs compact, trustworthy search results.
- AlembicPlugin: owns only host-plugin behavior: schema, tool catalog, routing,
  route diagnostics, resident request/response projection, clean MCP output,
  and Plugin-only degraded fallback.
- Alembic main: owns executable resident `/api/v1/search` behavior when the
  daemon is present for the selected project.
- AlembicCore: owns base search, vector, ranking, scoring, and metadata truth.
- Controller: decides phase order, affected windows, and acceptance after raw
  evidence review.

### User Stories

- As a host agent, when I search for a concrete Recipe, handler, schema, or MCP
  quality topic, I get all matched summary items within the result budget, with
  stable unique ids and clear `whyMatched` / score evidence.
- As a host agent, when my query is vague or low-information, I get no matched
  Recipes plus refine-query/filter guidance, not unrelated high-score noise.
- As a host agent, when I ask what design patterns, architecture norms,
  standards, or real examples exist in the project knowledge base, I can search
  by Recipe dimension/category/kind/tags/scope and receive matching Recipe
  summaries with stable ids, not full Recipe contents in the search response.
- As a host agent, when I need a full Recipe, I use the returned unique id in an
  exact detail lookup instead of expecting `search` to return the full content.
- As a host agent, keyword matching uses the AlembicPlugin default keyword
  scoring path consistently, whether Alembic main is running or not.
- As a host agent, when Alembic main is running and resident semantic/vector is
  available, `alembic_search` waits for resident semantic matches, then Plugin
  narrows / filters / merges the returned Recipe summaries with keyword matches
  before producing the final result.
- As a host agent, when Alembic main is absent, mismatched, or lacks a capability,
  Plugin returns honest exact / lexical / bounded-detail fallback or a clean
  failure; it does not pretend to provide full semantic/vector search.
- As a maintainer, I can remove AlembicPlugin migration leftovers without
  breaking current host-plugin contracts, because each retained compatibility
  path names its consumer and removal condition.

### Completion Definition

The demand is complete when `alembic_search` is a precision-first knowledge
lookup tool with:

- AlembicPlugin default keyword search as the baseline lane;
- resident semantic/vector search as the second lane when Alembic main is
  present and capable;
- simple threshold admission and de-duplicated union across the two lanes;
- reduced parameter semantics where only accuracy-bearing inputs affect results;
- scoped Recipe / knowledge attribute search for dimension, category, kind,
  knowledge type, tags, scope, language, returning summary candidates and
  stable unique ids;
- no Recipe relation-chain traversal or prime-like context package assembly;
- no host-intent, task-intent, session-history, active-file, or active-module
  driven relevance behavior;
- direct evidence and route diagnostics in structured output;
- cleanup or explicit ownership proof for Plugin migration leftovers;
- fresh installed/local MCP probe evidence that matches what host agents see.

### Real Landing Architecture

The intended runtime flow is:

1. AlembicPlugin validates and normalizes the MCP input.
2. AlembicPlugin classifies the request as `search`, `get`, or `expand`.
3. For `get` / `expand`, AlembicPlugin resolves only exact IDs or explicit refs;
   these are detail lookup operations, not search behavior.
4. For `search`, AlembicPlugin chooses lane:
   - always run the AlembicPlugin keyword lane when a query or explicit Recipe
     filters are present;
   - additionally call Alembic main resident semantic/vector search when
     Alembic main is reachable, project identity matches, and semantic/vector
     capability is advertised;
   - skip semantic/vector cleanly when resident is absent, timed out,
     mismatched, or unsupported.
5. When the resident semantic lane is available, AlembicPlugin waits for the
   semantic response before final projection. It then applies Recipe filters and
   output narrowing to the resident Recipe summaries, admits semantic-lane items
   whose semantic match rate meets threshold, admits keyword-lane items whose
   keyword match rate meets threshold, then de-duplicates by Recipe id/ref.
6. AlembicPlugin projects the union into clean MCP structured content,
   preserving summary fields, stable ids, direct match evidence, route/lane,
   fallback reason, vector availability, and diagnostics.
7. `alembic_search` stops there. It does not traverse Recipe relations, assemble
   context packs, or perform ProjectContext queries.

### Functional Decisions

- Route decision: Plugin keyword baseline plus optional resident semantic lane.
  AlembicPlugin default keyword weighting is not a degraded fallback; it is the
  canonical keyword lane. Resident search is called only for semantic/vector
  support when Alembic main is present and capable.
- Capability shape: keep `search`, `get`, and `expand` only.
- Parameter shape: keep accuracy-bearing inputs; retained compatibility inputs
  are limited to non-mode sanitation metadata. Removed modes are not
  compatibility inputs.
- Search purity rule: `search` is independent from host intent, task intent,
  session history, active file, active module, and hidden agent context. Those
  inputs must not participate in candidate admission, ranking, or trust.
- Recipe scope rule: faceted range search by Recipe / knowledge attributes is
  allowed because it is still knowledge retrieval. It may admit metadata-matched
  Recipe entries when the query is a scoped knowledge-base search and the entry
  matches explicit combined attributes. It must return bounded summary
  candidates, group counts, omitted counts, and stable ids, not full Recipe
  content, inferred relation chains, or project structure.
- Filter-only rule: a `search` request with explicit Recipe metadata filters
  and no free-text query / keywords is valid. Every Recipe that satisfies the
  hard filter expression is a match; return volume is controlled by `limit`,
  pagination, grouping, and output budget, not by a keyword threshold.
- Combined-filter rule: different metadata fields combine by AND. Multiple
  values inside the same field combine by OR unless the schema explicitly
  rejects that field as single-valued or ambiguous. The normalized filter
  expression must be echoed in output.
- Match rule: a candidate is returned when it crosses the explicit match
  threshold. Accuracy beats recall, but above-threshold matches are not hidden
  behind a second admission gate.
- Relationship rule: broader Recipe context and relation chains are outside
  `alembic_search`; search returns direct summary matches or no match.
- Project information rule: project map/source/module/file questions are outside
  `alembic_search`; search does not route them through hidden project-context
  behavior.
- Cleanup rule: AlembicPlugin retains only host-plugin functionality. Frontend,
  Dashboard, local/base, and general API needs are not valid Plugin ownership
  justifications.
- Retired-name rule: the retained keyword lane is `keyword` / exact / lexical
  retrieval only. It must not be described, routed, scored, labeled, tested, or
  documented with the retired `bm25` / `BM25` name.

### Connectivity Matrix

| Connection | Required direction | Valid data | Invalid conclusion |
| --- | --- | --- | --- |
| Host agent -> AlembicPlugin | MCP tool call | query, `auto`/`keyword`/`semantic`, filters, exact refs | host metadata or deleted modes are search evidence by themselves |
| AlembicPlugin -> Alembic main | resident semantic/vector search call | normalized query, optional filters, semantic capability request | keyword matching requires resident; Plugin owns daemon startup or resident semantics |
| Alembic main -> AlembicCore | internal service call | semantic/vector execution and metadata for the resident lane | Plugin owns local/base semantic/vector behavior |
| AlembicPlugin -> host agent | clean structured output | summary items, stable ids, score evidence, diagnostics, route, nextActions | search returns full Recipe content |

### Edge Case Matrix

| Case | Required behavior |
| --- | --- |
| Resident daemon stopped | Keyword-only exact/keyword/filter results when safe, or clean failed output. |
| Resident timeout | No unprojected exception; route diagnostic includes timeout/fallback reason. |
| Project identity mismatch | Do not use resident facts; return mismatch diagnostic and safe fallback/unavailable. |
| Resident semantic unsupported | Run keyword lane only; report semantic unavailable; no Plugin-local semantic success. |
| Vector unavailable | Keep Plugin keyword evidence; report vector unavailable; no fake semantic trust. |
| Low-information query | Zero matches unless concrete query terms or explicit filters exist; suggest refining search terms/filters only. |
| Chinese quality query | Prioritize actual MCP/search/tool-quality evidence; suppress unrelated generic knowledge. |
| Source/navigation hints with private paths | Ignore for search relevance; sanitize if compatibility paths still receive them. |
| Invalid or stale detailRef | Clean diagnostic; no broad search fallback through `get` / `expand`. |
| Session history / active file / module present | Ignored for search relevance; may be accepted only as compatibility/sanitation metadata. |
| Relation-heavy query | Direct summary matches only, or no match. |
| Parallel calls | No shared projection/container corruption. |
| Legacy route/tool direct call | Retired/unknown behavior must be intentional and tested. |
| Plugin HTTP search subroute without host-plugin consumer | Delete or move out of Plugin ownership. |

### Phased Implementation Route

1. Front-set proof: run ASQ0, ASQ0A, ASQ0B, and ASQ0C before implementation. This
   confirms current failures, migration leftovers, and the final three-mode
   boundary.
2. Plugin runtime stabilization: implement clean failure/fallback projection,
   route diagnostics, and directly connected cleanup items.
3. Search precision cleanup: remove relation-chain behavior, simplify parameter
   semantics, replace trusted-candidate gates with keyword/semantic threshold
   admission, and preserve direct evidence.
4. Resident/Core proof: prove resident semantic/vector support, score metadata
   truth, and unavailable/fallback metadata.
5. End-to-end MCP validation: reload installed/local Plugin surface and run the
   real query matrix for both Alembic-main-present and keyword-only states.

## Real Code Facts

### MCP Surface And Input Contract

`alembic_search` is registered as a Codex-visible agent tool in
`AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts`. The tool is owned
by Plugin MCP routing, uses `SearchInput`, and declares an explicit resident
search route policy.

`SearchInput` currently supports a broader legacy surface that must be reduced:

- `operation`: `search`, `get`, `expand`;
- `mode`: `auto`, `keyword`, `semantic`; any removed mode is absent
  from the public schema / effective contract;
- `kind`, `category`, `language`, `activeFile`, `module`, `sourceRefs`,
  `hostDeclaredIntent`, `hostTurnMeta`, `sessionHistory`, `projectRoot`,
  `budget`, and freshness fields.

Current gap for the new scoped Recipe search requirement:

- the public search schema already exposes `kind`, `category`, and `language`;
- the public schema still exposes intent/context inputs such as
  `hostDeclaredIntent`, `hostTurnMeta`, `sessionHistory`, `activeFile`, and
  `module`; these must stop affecting search relevance and should be removed
  from the effective search contract or reported as compatibility-only inputs;
- the underlying knowledge / Recipe model also has `dimensionId`,
  `knowledgeType`, `scope`, `tags`, `topicHint`, `whenClause`, `doClause`,
  `dontClause`, `coreCode`, and `usageGuide`;
- `dimensionId`, `knowledgeType`, `scope`, and `tags` should become first-class
  public filters; Recipe body fields may participate in search indexing or exact
  detail lookup, but must not be returned by the `search` operation.

For `search`, schema requires `query`, `keywords`, or
`hostDeclaredIntent.query`. The new design removes `hostDeclaredIntent.query` as
a search-query source. `search` should use explicit `query`, explicit
`keywords`, or explicit Recipe filters. For `get` and `expand`, schema requires
`refId`, `id`, or `detailRefId`.

Source refs:

- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:454`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:502`

### Plugin Handler Pipeline

The public handler first branches `get` and `expand` to a detail operation.
Normal search runs:

1. `runSearchPipeline`;
2. `buildKnowledgeCandidates`;
3. `assessSearchRelevance`;
4. relation-chain expansion;
5. detailRef / source projection;
6. `ProjectKnowledgeContextLayer.resolveMcpResult`.

Design implication: the current relation-chain expansion is a cleanup target for
this demand. `alembic_search` should return direct search matches and bounded
detail refs, not prime-like context packages.

The current final visible summary is only a short count or
no-trusted-candidate message; the target output should instead report matched
or below-threshold counts.
The useful agent payload is in `structuredContent.items`, `detailRefs`,
`sources`, `result.searchMeta`, `result.searchQuality`, `inventory`, and
`nextActions`.

Source refs:

- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:113`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:136`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:175`

### Resident Route Behavior

Current Plugin search behavior only asks resident search when mode is `auto` or
`semantic`.

If resident search returns available items, embedded search is skipped. If
resident search is unavailable or returns no items, Plugin calls the embedded
search engine. Removed-mode normalization should be deleted rather than
remapped.

The resident client normalizes Codex `auto` into resident `semantic`, while
`keyword` can normalize to resident keyword-style modes if the resident client
is called. The target design does not require resident keyword support and does
not keep duplicate keyword routing.

Source refs:

- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:222`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:366`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:1655`
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:431`
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:452`
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:1969`
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:2711`

### Alembic Daemon Search Route

Alembic daemon `/api/v1/search` currently normalizes host intent, builds an
`IntentSearchPlan`, invokes Core `SearchEngine`, merges accepted Decision
Register results, and builds resident metadata.

Design implication: host-intent planning and Decision Register enrichment are
current coupling points to review. The pure search route should execute the
explicit query/filter expression only. Decision entries may appear only when
they are first-class searchable knowledge entries and the query/kind/filter
matches them directly; Decision Register context must not be a hidden
enrichment source.

If `SearchEngine` throws, the daemon falls back to legacy knowledge / guard /
decision-register search and returns degraded metadata rather than failing the
HTTP route.

Source refs:

- `Alembic/lib/http/routes/search.ts:242`
- `Alembic/lib/http/routes/search.ts:276`
- `Alembic/lib/http/routes/search.ts:297`
- `Alembic/lib/http/routes/search.ts:315`

### Core Search Behavior

AlembicCore `SearchEngine` is the base deterministic retrieval layer.

`auto` mode runs field-weighted search first, computes confidence, and only
uses vector hybrid search when confidence is low and vector service exists.
`semantic` mode uses vector service first and falls back to field-weighted
search with explicit fallback reasons.

The field-weighted scorer weights fields as:

- trigger: 5.0;
- title: 3.0;
- tags: 2.0;
- description: 1.5;
- content: 1.0;
- facets: 0.5.

Source refs:

- `AlembicCore/src/service/search/SearchEngine.ts:208`
- `AlembicCore/src/service/search/SearchEngine.ts:254`
- `AlembicCore/src/service/search/SearchEngine.ts:649`
- `AlembicCore/src/service/search/FieldWeightedScorer.ts:1`
- `AlembicCore/src/service/search/FieldWeightedScorer.ts:20`

### Recipe Classification And Content Foundation

The mature Recipe / knowledge model already contains the fields needed for the
new `alembic_search` direction. This demand should not invent a new knowledge
shape.

AlembicCore `KnowledgeEntryWire` and `KnowledgeEntry` already expose:

- classification fields: `language`, `dimensionId`, `category`, `kind`,
  `knowledgeType`, `scope`, `difficulty`, and `tags`;
- agent-useful delivery fields: `trigger`, `topicHint`, `whenClause`,
  `doClause`, `dontClause`, `coreCode`, and `usageGuide`;
- structured content, relations, constraints, reasoning, quality, and stats.

AlembicCore `KnowledgeService.list` already accepts filters for `lifecycle`,
`kind`, `language`, `dimensionId`, `category`, `knowledgeType`, `source`,
`tag`, and `scope`. `KnowledgeService._adaptForScorer` already extracts
`whenClause`, `doClause`, `dontClause`, `coreCode`, `usageGuide`, markdown,
rationale, reasoning, headers, tags, and usage stats for quality scoring.

AlembicCore `SearchEngine` already indexes `dimensionId`, `category`,
`knowledgeType`, tags, and content text into searchable documents, and its doc
metadata carries `dimensionId`, `category`, `knowledgeType`, and `tags`.
However, these Recipe fields are searchable text / metadata today; they are not
yet hard combined filters in the search contract.

Current gap:

- Plugin MCP `SearchInput` does not expose `dimensionId`, `knowledgeType`,
  `scope`, or `tags` as search filters.
- Alembic main `SearchInput`, resident `/api/v1/search` request body, and
  Plugin `ResidentSearchRequest` also do not carry those filters.
- Plugin handler `listKnowledgeEntries` only forwards `kind`, `language`, and
  `category` to `knowledgeService.list`.
- Plugin candidate scoring ignores most Recipe metadata when computing query /
  keyword hits.
- Plugin output projection currently mixes search result projection and detail
  projection concerns. The new `search` projection should expose only summary
  result fields and stable ids. Detailed Recipe fields such as `whenClause`,
  `doClause`, `dontClause`, `usageGuide`, and `coreCode` belong to exact detail
  lookup.
- Alembic resident browse/list handlers can list by some knowledge attributes,
  but that is a separate browse route. The confirmed user direction is that
  `alembic_search` itself should support scoped Recipe search and return
  multiple summary candidates with stable ids.

Design implication: implementation should reuse the existing Core Recipe fields
and `KnowledgeService.list` / `SearchEngine` foundations, then propagate them
through Plugin schema, resident request, Core search/list execution, candidate
evidence, and clean MCP output.

Source refs:

- `AlembicCore/src/types/KnowledgeWire.ts:95`
- `AlembicCore/src/domain/knowledge/KnowledgeEntry.ts:27`
- `AlembicCore/src/service/knowledge/KnowledgeService.ts:592`
- `AlembicCore/src/service/knowledge/KnowledgeService.ts:934`
- `AlembicCore/src/service/search/SearchEngine.ts:208`
- `AlembicCore/src/service/search/SearchEngine.ts:1095`
- `AlembicCore/src/service/search/SearchEngine.ts:1131`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:454`
- `Alembic/lib/shared/schemas/mcp-tools.ts:130`
- `Alembic/lib/http/routes/search.ts:95`
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:31`
- `Alembic/lib/resident/tool-handlers/browse.ts:168`

### Candidate Pool And Relevance Filter

After search results return, Plugin expands the candidate pool by adding
knowledge-service entries. It then:

1. merges search candidates and entry candidates;
2. scores them with `DefaultRecipeCandidateProvider`;
3. reranks with `DefaultVectorRerankProvider`;
4. filters trusted relevance.

The candidate scorer uses only item id, title, summary, trigger, kind, and
language for query / keyword hits. It adds small score increments for
`queryHits`, `keywordHits`, and `sourceRefHits`.

Current trust rules include:

- sourceRef hits are trusted;
- low-information intent without caller context is not trusted;
- bounded detail intent needs bounded detail support;
- MCP tool quality intent needs specific MCP tool quality support;
- specific query generally needs at least two query hits, or one hit plus
  semantic support.

Design implication: these are current implementation facts, not the target
contract. The target `alembic_search` threshold admission should remove
sourceRef / caller-context trust and replace intent-based rules with explicit
query/filter evidence.

Source refs:

- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:530`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:576`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:649`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:712`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:743`
- `AlembicPlugin/lib/service/project-knowledge-context/retrieval/RecipeCandidateProvider.ts:44`

### Scoped Recipe Filter Search Pipeline Gap

The current chain cannot honestly implement "show me project rules / design
patterns by combined Recipe attributes" by changing only schema descriptions.
Every link needs the same query meaning:

1. Input validation must treat explicit Recipe filters as enough to make a
   `search` operation valid, even when the free-text query is only a broad rule
   browsing phrase.
2. Plugin search args and resident request types must carry
   `dimensionId`, `knowledgeType`, `scope`, `tags`, and the normalized
   multi-value filter expression.
3. Alembic main `/api/v1/search` must accept and pass those filters into the
   Core route. The GET/POST route currently passes `type`, `mode`, `limit`,
   host intent, language, and source refs, but not Recipe filters.
4. Core execution must apply filters before final ranking. For metadata-scoped
   queries, the safe first implementation is to use `KnowledgeService.list`
   for the hard filter set, then rank / trim those entries by query and
   keywords. SearchEngine can then add ranked text/vector evidence for the same
   bounded candidate set when supported.
5. Cache keys and fallback metadata must include normalized filters. A cached
   result for `query/type/mode` must not be reused for a different
   `dimensionId`, `scope`, or tag combination.
6. Candidate merge must preserve filter-match evidence and must not replace
   resident/Core evidence with a generic knowledge-service score.
7. Relevance gating must become match-threshold admission: explicit metadata
   membership admits an item for scoped Recipe browsing, while low-information
   queries without explicit filters produce no match set.
8. Output projection must show summary candidates, stable ids, normalized
   filters, applied / unsupported facets, counts, omitted counts, and exact
   detail lookup handles. It must not inline full Recipe content.

This is not a new upper abstraction. It is a single coherent search contract
being propagated through existing Plugin -> resident -> Core -> projection
layers.

### Current Ranking, Fusion, And Threshold Facts

The implementation has real search/ranking machinery, but today it is mixed
with intent, prime, sourceRef, relation, and trust-withholding behavior.

Current AlembicCore facts:

- `SearchEngine.search` in `auto` mode runs field-weighted search first,
  computes weighted confidence, and skips semantic search when confidence is
  `>= 60`.
- When confidence is `< 60`, Core invokes `VectorService.hybridSearch` and uses
  adaptive semantic alpha:
  `0.4 + (0.75 - 0.4) * (1 - confidence / 60)`. The intended examples in code
  are confidence `0 -> alpha 0.75`, `30 -> 0.575`, `55 -> about 0.42`.
- `HybridRetriever` uses RRF fusion with default `k=60`, dense contribution
  `alpha * 1/(k+rank)`, sparse contribution `(1-alpha) * 1/(k+rank)`, then
  normalizes fused scores to `[0, 1]`.
- `FieldWeightedScorer` field weights are: trigger `5.0`, title `3.0`, tags
  `2.0`, description `1.5`, content `1.0`, facets `0.5`.
- Field string matching scores are exact `1.0`, prefix `0.7`, contains `0.5`,
  reverse contains `0.3`. Token overlap is query-side coverage. Tags score
  exact token `1.0`, partial `0.5`, tokenized tag hit `0.3`, capped at `1.0`.
- `_scorerSearch` adds an additional title/trigger bonus after field scoring:
  exact match `+50%` of max score, substring `+30%`, reverse contains `+15%`.
- The ranking pipeline then optionally applies CrossEncoder, CoarseRanker,
  MultiSignalRanker, and session `contextBoost`.
- CoarseRanker default weights are recall `0.45`, semantic `0.30`, quality
  `0`, freshness `0.15`, popularity `0.10`; if semantic scores are absent, the
  semantic weight is redistributed to other dimensions.
- MultiSignalRanker `search` scenario weights are relevance `0.20`,
  authority `0.15`, recency `0.10`, popularity `0.10`, difficulty `0.05`,
  contextMatch `0.10`, vector `0.30`.
- `contextBoost` adds session-history keyword boost up to `+20%` and language
  match `+10%`. This is useful for context-aware search but conflicts with the
  pure `alembic_search` target.

Current AlembicPlugin facts:

- The Plugin search handler still expands Recipe relation chains for `search`,
  emits `recipeRelationCount`, and returns a `relations` payload.
- `buildKnowledgeCandidates` merges resident/search results with broad
  `knowledgeService.list` entries, then calls `DefaultRecipeCandidateProvider`
  and `DefaultVectorRerankProvider`.
- `DefaultRecipeCandidateProvider` scores only
  `id/title/summary/trigger/kind/language`, adds `queryHits * 0.08`,
  `keywordHits * 0.05`, and `sourceRefHits * 0.1`, and adds
  `activeFile-hint` / `module-hint` as whyMatched signals.
- The current relevance gate returns only "trusted" candidates. It can trust
  sourceRef hits, intent anchors, caller context, and semantic support. This is
  not the target behavior for pure search.
- `DefaultVectorRerankProvider` does not compute vector similarity itself. It
  consumes resident `scoreBreakdown.finalScore` evidence from
  `intentEvidence` or `primeInjectionPackage` and uses it to reorder Plugin
  candidates.

Current Alembic resident/main facts:

- `/api/v1/search` normalizes host intent, builds an `IntentSearchPlan`, passes
  context into Core SearchEngine, merges accepted Decision Register documents
  into search results, then builds `intentEvidence` and `primeInjectionPackage`.
- Resident fallback metadata repeats the same intent/prime package path.
- These surfaces may be useful elsewhere, but they are not pure knowledge-base
  search behavior and should be removed from `alembic_search` or moved behind
  the owning intent/prime tools.

Source refs:

- `AlembicCore/src/service/search/SearchEngine.ts:208`
- `AlembicCore/src/service/search/SearchEngine.ts:254`
- `AlembicCore/src/service/search/SearchEngine.ts:807`
- `AlembicCore/src/service/search/FieldWeightedScorer.ts:20`
- `AlembicCore/src/service/search/FieldWeightedScorer.ts:210`
- `AlembicCore/src/service/search/FieldWeightedScorer.ts:261`
- `AlembicCore/src/service/search/HybridRetriever.ts:23`
- `AlembicCore/src/service/vector/VectorService.ts:346`
- `AlembicCore/src/service/search/SearchEngine.ts:429`
- `AlembicCore/src/service/search/CoarseRanker.ts:26`
- `AlembicCore/src/service/search/MultiSignalRanker.ts:38`
- `AlembicCore/src/service/search/contextBoost.ts:36`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:113`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:530`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:576`
- `AlembicPlugin/lib/service/project-knowledge-context/retrieval/RecipeCandidateProvider.ts:44`
- `AlembicPlugin/lib/service/project-knowledge-context/retrieval/VectorRerankProvider.ts:20`
- `Alembic/lib/http/routes/search.ts:242`
- `Alembic/lib/http/routes/search.ts:501`
- `Alembic/lib/http/routes/search.ts:848`

### Target Two-Lane Match And Return Contract

`alembic_search` should be implemented as two independent retrieval lanes plus a
simple de-duplicated union. It should not introduce a final complex fusion
layer, trust gate, relation chain, intent chain, or resident-primary rewrite of
keyword search.

Retrieval lanes:

1. **Keyword lane**: always owned by AlembicPlugin. It uses the current
   AlembicPlugin default keyword weighting as the baseline scoring behavior.
   This lane may use exact id/ref/title/trigger matches, query/keyword hits,
   and explicit Recipe metadata filters. It must not use sourceRef, active file,
   module, session history, host intent, or relation proximity as match
   evidence.
2. **Semantic lane**: resident-only when available. AlembicPlugin calls Alembic
   main resident semantic/vector search when the main service exists, project
   identity matches, and resident diagnostics advertise semantic/vector
   capability. When this lane is available, Plugin waits for its result and then
   narrows the returned Recipe summaries before final merge/projection. If
   resident semantic/vector is absent, timed out, mismatched, or sparse-only
   without semantic evidence, this lane is skipped or reported as unavailable.
   Plugin must not provide a local semantic/vector substitute.

Admission rule:

- Exact id/ref/title/trigger match returns with `matchRate=1.0`.
- Explicit metadata-filter search returns every Recipe that satisfies all hard
  filters. If query text is also present, the text evidence labels or orders
  the admitted set, but does not hide metadata-matched entries.
- Filter-only search does not require a keyword or semantic threshold after the
  hard metadata filters match. It is a scoped knowledge browsing operation over
  Recipe metadata.
- Keyword lane returns every Recipe whose `keywordMatchRate` reaches the
  keyword threshold. Initial target: `keywordThreshold=0.50`, with exact
  id/ref/title/trigger treated as `1.0`.
- Semantic lane returns every Recipe whose resident `semanticMatchRate` reaches
  the semantic threshold. Initial target: `semanticThreshold=0.55` for a
  normalized resident semantic/vector score. If Core later exposes raw embedding
  similarity separately, use `0.62` as the initial raw-similarity threshold.
- A Recipe is included when any one of these is true: exact match, all hard
  metadata filters match, `keywordMatchRate >= keywordThreshold`, or
  `semanticMatchRate >= semanticThreshold`.
- Low-information query with no explicit filters returns no matches.
- Unsupported filter field does not silently become free text; the output names
  unsupported filters and keeps the match set honest.
- Combined filters use AND across different fields and OR within multiple
  values of the same field, unless the schema explicitly rejects the field as
  single-valued or ambiguous.

Merge rule:

- Merge by stable Recipe id/ref.
- If the same Recipe appears in both lanes, return one item with
  `matchRoutes=["keyword","semantic"]`, both match rates, both evidence labels,
  and `matchRate=max(keywordMatchRate, semanticMatchRate)`.
- Preserve the first keyword-lane position for duplicates found by keyword.
  Append semantic-only matches after keyword matches in resident order. Exact
  and metadata-filter matches may be placed before lane-ordered results.
- Do not run RRF, CoarseRanker, MultiSignalRanker, contextBoost, Decision
  Register merge, or prime relation-chain logic as a final `alembic_search`
  fusion step. Those current code paths are cleanup or lower-layer facts, not
  the target external behavior.
- No final rerank/fusion is allowed after two-lane admission. Plugin may only
  narrow by explicit Recipe filters, merge duplicate ids, preserve lane
  evidence, apply output budget, and project summary fields.

Target output:

- visible text: short summary only;
- `structuredContent.items`: every returned match within `limit` / pagination;
- each item: `id`, exact detail handle, title, short summary/snippet,
  lightweight classification, `matchRate`, `keywordMatchRate` if present,
  `semanticMatchRate` if present, `matchRoutes`, match reasons, and route
  evidence;
- `structuredContent.result`: total matched count, returned count, omitted
  count, thresholds used, semantic lane attempted/available/used, degraded
  reason if any;
- no full Recipe body in `search`; detail lookup remains exact by id/ref.

Thresholds are implementation targets, not final empirical truth. ASQ
validation must run an AlembicWorkspace golden-query set and may tune the numeric
values only with evidence. Any tuning must preserve the rule that all
above-threshold Recipes are returned and below-threshold Recipes are omitted.

The current `trustedCandidateCount`, `weakCandidateCount`, `noTrustedMatch`,
and "withheld weak candidates" vocabulary should be replaced for `search` with
`matchedCount`, `returnedCount`, `omittedCount`, `belowThresholdCount`,
`keywordThreshold`, `semanticThreshold`, and lane availability diagnostics.

### Deletion And Cleanup Inventory

The implementation should explicitly remove or disable these `alembic_search`
behaviors:

- Plugin search-time Recipe relation expansion: `DefaultRecipeRelationChain`,
  `recipeRelationCount`, and `relations` payload for `search`.
- Plugin "trusted candidate only" filtering that withholds search matches after
  retrieval. Replace it with threshold admission and return all above-threshold
  matches.
- SourceRef/caller-context/intent-anchor trust in `candidateHasTrustedRelevance`.
- `activeFile`, `module`, `sessionHistory`, `hostDeclaredIntent`,
  `hostTurnMeta`, source/navigation hints, and caller context as search
  relevance inputs.
- Plugin `DefaultRecipeCandidateProvider` sourceRef score/hints, active-file
  hints, module hints, and caller-context trust. Keep AlembicPlugin default
  keyword weighting as the keyword lane, but expose it as `keywordMatchRate`
  with threshold admission instead of mixing it with source/context trust.
- Plugin vector rerank dependency on `intentEvidence` and
  `primeInjectionPackage`. Pure search should consume resident/Core search
  metadata directly.
- Alembic main resident semantic route host-intent normalization,
  `IntentSearchPlan`, session context pass-through, hidden Decision Register
  merge, and `primeInjectionPackage` construction for the pure search route.
- Core `contextBoost`, RRF-as-final-fusion, CoarseRanker, and intent/scenario
  `MultiSignalRanker` inputs for `alembic_search`; if retained for other
  routes or lower-layer experiments, they must not affect the two-lane search
  contract.
- Tests that assert sourceRef trust, host intent/source refs, relation chains,
  prime injection packages, or Decision Register enrichment as required
  `alembic_search` behavior. Rewrite them as absence/cleanup tests.

### Clean Output Contract

All clean knowledge-context MCP outputs must satisfy
`KnowledgeContextToolOutput`. Visible MCP content must be exactly the structured
summary text, and detailed data must live in `structuredContent`.

The projector caps arrays and text budgets, merges freshness diagnostics, and
sets status / ok from freshness and budget state.

Source refs:

- `AlembicPlugin/lib/service/project-knowledge-context/contracts/KnowledgeContextToolOutput.ts:83`
- `AlembicPlugin/lib/service/project-knowledge-context/contracts/KnowledgeContextToolOutput.ts:114`
- `AlembicPlugin/lib/service/project-knowledge-context/layer/KnowledgeContextOutputProjector.ts:34`
- `AlembicPlugin/lib/service/project-knowledge-context/layer/KnowledgeContextOutputProjector.ts:66`

## Runtime Probe Notes

Read-only probes were run from the current Codex window on 2026-06-15 after
the code scan.

`alembic_mcp_status` reported:

- project initialized;
- knowledge usable;
- 140 recipes;
- daemon stopped;
- resident search unavailable because no local daemon API is ready.

`alembic_codex_diagnostics` reported runtime checks ready, but host project
alignment disconnected because no active runtime is available.

Observed `alembic_search` behavior in that state:

- a specific handler / ranking / schema query returned a degraded but structured
  result through embedded search;
- low-information and Chinese quality queries later failed with
  `Database not initialized. Ensure Bootstrap.initialize() is called before
  using ServiceContainer.`;
- one parallel probe returned a clean-output contract mismatch.

Design conclusion: when knowledge is initialized and usable, but resident daemon
is stopped, `alembic_search` must still return a stable degraded clean output or
a clear non-retryable diagnostic that names the missing service. It must not
surface an unwrapped internal database initialization error as the normal tool
result.

### Follow-up Probe After Alembic Daemon Startup

The user then started the Alembic main service and asked to retry. A second
read-only probe on 2026-06-15 showed:

- `alembic_mcp_status`: daemon `ready`, `pidAlive=true`, project connected,
  knowledge usable, 140 recipes.
- `alembic_codex_diagnostics`: resident route
  `local-alembic-daemon`, owner `alembic`, Dashboard and job APIs available,
  resident `search.keyword` and `search.semantic` available, ProjectScope
  available with 5 folders.
- `where do I start`: clean degraded output, zero trusted candidates, weak
  fallback withheld, nextAction points to project matrix; resident semantic
  attempt timed out and embedded fallback produced weak candidates.
- `我要优化 alembic_search 返回内容质量和语义相关性噪声`: clean degraded output,
  resident semantic/vector available and used, but top semantic matches were
  unrelated SQLite / HTTP / problem-taxonomy entries, so trusted candidates were
  zero.
- `alembic_search handler ranking schema resident search relevance gate`
  in `auto`: clean degraded output, resident semantic/vector available and
  used, but top matches were gateway / ProjectDiscoverer / AGENTS entries, so
  trusted candidates were zero.
Updated design conclusion: starting Alembic main service removes the immediate
internal database initialization failure from the observed query path. It does
not solve the semantic quality problem. The daemon-ready path still needs
better retrieval/ranking/candidate evidence so MCP quality and handler-specific
queries return useful above-threshold matches instead of unrelated weak matches.

## Independence And Isolation Assessment

The user asked whether in-project `alembic_search` and the corresponding
search/vector capabilities are independent, isolated, and need optimization.

Current assessment:

- Public MCP ownership is isolated enough. `alembic_search` is a Plugin-owned,
  Codex-facing MCP tool. The service boundary explicitly says semantic/vector
  enhancement must use Alembic resident `/api/v1/search`, not a daemon MCP
  bridge.
- Core search/vector capabilities are independently reusable. AlembicCore
  exposes `SearchEngine` and `VectorService` as Core services. `SearchEngine`
  depends on a narrow `SearchVectorService` interface and does not import
  Plugin or MCP code.
- Alembic main owns the executable resident semantic/vector route. Alembic
  runtime DI wires `SearchEngine`, `VectorService`, `vectorStore`,
  `indexingPipeline`, and `hybridRetriever`; daemon health advertises
  `search.keyword` and `search.semantic`.
- Plugin embedded runtime is intentionally provider-isolated, but not
  completely capability-isolated. It still registers local `SearchEngine`,
  `vectorStore`, `VectorService`, and `hybridRetriever`. These must not be
  treated as Plugin-owned local/base capabilities: local and base capability
  ownership belongs in AlembicCore, while executable resident service behavior
  belongs in Alembic main. Plugin may only use such capabilities as host-plugin
  runtime support or fallback after consumer proof.
- `alembic_search` handler is not internally well isolated. One handler still
  performs route selection, resident fallback, embedded search, broad
  knowledge-service candidate enrichment, vector-rerank evidence projection,
  relevance gating, relation-chain expansion, and clean output assembly.
  This makes quality defects hard to localize.
- Plugin and Alembic both contain HTTP `/api/v1/search` route families with
  search, graph, context-aware, and similarity behavior. AlembicPlugin is not a
  frontend/API product surface. A Plugin HTTP route can be retained only when it
  is proven as host-plugin runtime functionality; frontend, Dashboard, local
  base, or general project-service use must go through Alembic / AlembicCore
  instead.
- Vector service itself is not the primary quality problem shown by probes.
  When daemon is ready, semantic/vector can be available and still retrieve
  weak unrelated items. The needed optimization is query-class routing,
  candidate evidence preservation, lexical/source anchors, and trust filtering
  before/after vector results, not simply "make vectors stronger."

Optimization decision:

`alembic_search` should keep the current public ownership boundary, but needs
internal isolation cleanup:

1. Keep AlembicCore `SearchEngine` and `VectorService` as shared lower-level
   capabilities.
2. Keep Alembic main as the executable resident semantic/vector provider.
3. Keep AlembicPlugin as the host-plugin surface owner only: MCP schema/tool
   catalog, tool-call validation, host metadata sanitation, resident client
   request/response projection, clean output, plugin runtime packaging, and
   host-agent workflow entrypoints.
4. Split the Plugin handler's internal responsibilities into focused retrieval
   functions/providers without adding a new public abstraction layer:
   route decision, resident call, embedded fallback, candidate enrichment,
   candidate merge, relevance assessment, and clean projection.
5. Audit Plugin HTTP `/api/v1/search*` routes and decide whether they are still
   required for host-plugin runtime functionality. If not required, delete,
   retire, or move the responsibility to Alembic/AlembicCore; do not keep them
   as Plugin-owned frontend, Dashboard, local, or base project APIs.
6. Add isolation tests that prove Plugin does not execute embedding-provider
   semantic search directly, resident search is the only semantic/vector
   enhancement route for MCP, and Core search/vector remain free of Plugin/MCP
   dependencies.

## AlembicPlugin Migration Leftover Cleanup

The user added a required cleanup concern: AlembicPlugin still appears to carry
migration leftovers that were not fully removed after ProjectContext, resident
search, and source-graph retirement work. This must be part of the demand, not
left as informal follow-up.

Current code scan facts:

- `/api/v1/search` is still listed as a required host-plugin embedded runtime
  route and an I22 Plugin-host contract. That proves only a host-plugin
  compatibility claim, not frontend/API ownership. The root route cannot be
  blindly deleted, but its reason for existence must be revalidated against
  current host-plugin runtime needs.
- The Plugin HTTP search router still owns multiple subroutes: root search,
  `/graph`, `/graph/impact`, `/graph/all`, `/graph/stats`, `/context-aware`,
  and `/similarity`. These mix MCP search, knowledge graph, ranking, and
  candidate-similarity concerns and must be inventoried one by one. Any subroute
  without a host-plugin runtime consumer should be deleted or moved out of
  Plugin ownership.
- Retired public tool names remain in policy, onboarding, and MCP executor
  code: `alembic_knowledge`, `alembic_structure`, `alembic_call_context`,
  `alembic_panorama`, and `alembic_task`. Some are fail-closed tombstones, but
  `McpServer` and `tool-router` still contain legacy handler mappings or
  functions that need direct consumer proof.
- Source-graph runtime/projector files remain in Plugin while the public tool
  catalog no longer exposes source-graph tools and the runtime open path throws
  "Core source graph public runtime has been withdrawn". This is a strong
  delete-candidate area unless a current internal consumer is proven.
- Panorama is partly tombstoned: `PanoramaModule` registers no service and
  project-information operations return retired responses, but old panorama
  handler branches, workflow completion terminology, and panorama/source-graph
  tests still exist. These should be cleaned or retained only with current
  ownership proof.
- `residentServiceClient` remains as a deprecated aggregate DI key even though
  split capability clients exist. It should have a consumer inventory and
  deletion trigger instead of becoming permanent compatibility glue.
- Plugin tests still cover some old Core search/vector/source-graph/panorama
  behavior. Test ownership must be reviewed: tests should prove current Plugin
  contracts and old-surface non-reachability, not keep deleted behavior alive.

Implementation verification snapshot on 2026-06-16:

- Status is not complete. Public search modes are partly cleaned: MCP and HTTP
  schemas reject `bm25` / `context`, and tests cover that rejection. However,
  `alembic_search` still describes host intent, active file, module, and
  `relationChains` in `AlembicPlugin/lib/runtime/mcp/tools.ts`.
- Search and prime are still coupled in implementation. `alembic_search` still
  imports / instantiates Recipe relation-chain expansion and passes through
  intent evidence / prime injection metadata in
  `AlembicPlugin/lib/runtime/mcp/handlers/search.ts`.
- Search relevance is still influenced by hidden context. Candidate scoring still
  uses `relationRefs`, `activeFile`, `module`, and `sourceRefs` in
  `AlembicPlugin/lib/service/project-knowledge-context/retrieval/RecipeCandidateProvider.ts`.
- Public retired tools are partly removed but not fully deleted. `TOOLS` no
  longer advertises `alembic_knowledge`, `alembic_structure`,
  `alembic_call_context`, or `alembic_panorama`, but `McpServer` and
  `tool-router` still keep retired mappings / replacements that need explicit
  tombstone or deletion decisions.
- `/api/v1/search` remains a required host-plugin embedded runtime route and
  must not be blindly deleted. Its subroutes remain present and need consumer
  proof one by one: `/graph`, `/graph/impact`, `/graph/all`, `/graph/stats`,
  `/context-aware`, and `/similarity`.
- `residentServiceClient` is still registered as a deprecated aggregate DI key
  and remains reachable as a fallback in search handler tests / compatibility
  paths. It is not yet deleted.
- Source-graph runtime / projector files and tests remain. Public tool-surface
  removal is not the same as code deletion.
- Panorama is still split between retired project-information responses,
  governance operations, tombstone module behavior, and tests. It needs a
  separate current-owner / tombstone / delete classification before code removal.
- Plugin-local tests still import `@alembic/core/search` and
  `@alembic/core/vector` for Core search/vector behavior. These tests are not
  automatically invalid, but ASQ cannot treat them as Plugin-owned search/vector
  implementation proof. They must be moved, deleted, or justified as
  host-plugin boundary tests.
- The retired `bm25` name still exists in HTTP search implementation comments /
  output labels and in Core search test names/imported symbols. It is a
  project-wide deletion requirement, not merely a public-mode schema cleanup.

Cleanup requirement:

1. Add a read-only AlembicPlugin legacy inventory before implementation changes.
   The inventory must classify each candidate as `owned-current`,
   `compatibility-tombstone`, `delete-candidate`, or `needs-decision`.
2. For every `compatibility-tombstone`, record the real consumer, reason,
   removal condition, owner, and validation command. Compatibility without a
   consumer is a delete candidate.
3. For every `delete-candidate`, require import/route/tool-surface scans before
   deletion, replacement proof when a current consumer exists, and post-delete
   tests that assert the current behavior rather than the old capability.
4. Do not delete the root `/api/v1/search` compatibility contract unless the
   host-plugin embedded runtime required route list and I22 Plugin-host contract
   are updated in the same accepted package. This retention is only a
   host-plugin runtime claim, not a frontend/API/local-base claim. Prefer first
   deleting or retiring unneeded subroutes and unreachable legacy helpers.
5. Convert source-graph and panorama tests that still assert old usable behavior
   into absence/retirement tests, or delete them with the code they guarded.
6. The cleanup must not introduce a new middle abstraction. Current public
   project information should continue to come from ProjectContext-backed
   `alembic_project_matrix` / `alembic_graph`, and knowledge retrieval should
   continue through `alembic_search`.
7. Local/base capability code must not remain in Plugin merely because Plugin
   can call it. If it is general search/vector/source-graph/project-service
   behavior, it belongs in AlembicCore or Alembic main and Plugin should consume
   it through the host-plugin contract.
8. The retired `bm25` / `BM25` name must be removed project-wide. Keyword
   behavior may remain only under neutral keyword / lexical / sparse naming.
   Deletion must cover source, schemas, comments, output labels, tests, docs,
   probes, fixtures, and runtime diagnostics.

## Runtime Route Boundary And Functional Options

`alembic_search` must make the runtime route explicit. The agent-visible tool is
always AlembicPlugin-owned. Keyword search is AlembicPlugin-owned by default;
semantic/vector search is resident-owned when Alembic main is present.

### Route State A: Alembic Main Present

Definition:

- Alembic main daemon is reachable for the selected project.
- Project identity matches the host project / projectRoot.
- Resident `/api/v1/search` capability is available and advertises semantic /
  vector search.

Boundary:

- AlembicPlugin remains the executable keyword lane using its default keyword
  weighting.
- Alembic main is the executable semantic/vector lane.
- AlembicCore owns lower-level search/vector implementation used by Alembic
  main for the resident semantic lane.
- AlembicPlugin owns only host-plugin concerns: MCP schema, tool-call
  validation, host metadata sanitation, request routing, response projection,
  clean output, diagnostics, and budget.
- Plugin must not execute a parallel local semantic/vector path when the
  resident semantic lane is healthy.

Expected behavior:

- `auto` runs the Plugin keyword lane and, when available, the resident semantic
  lane.
- `keyword` runs the Plugin keyword lane only.
- `semantic` calls the resident semantic lane only. If resident semantic is
  unavailable, return a clean unavailable / no-match diagnostic; do not claim
  Plugin-local semantic/vector behavior.
- Only `auto`, `keyword`, and `semantic` are valid modes. Removed modes are
  deleted from schema / handler logic / tests instead of becoming aliases or a
  third retrieval lane.
- Resident metadata, vector availability, semantic lane availability, and
  fallback reason must survive Plugin projection.

### Route State B: Alembic Main Absent Or Unavailable

Definition:

- Daemon is stopped, unavailable, timed out, project-mismatched, or lacks the
  required resident search capability.
- AlembicPlugin is the only reachable host-plugin runtime.

Boundary:

- Plugin-only mode is the normal keyword lane, not a complete semantic/vector
  implementation.
- Plugin-only mode must not claim semantic/vector, Decision Register,
  ProjectContext, source graph, Dashboard, job, or general API ownership.
- Plugin-only mode may use only proven host-plugin-local support needed to keep
  MCP sessions honest and useful.

Allowed functionality:

- Clean degraded / clean failed output instead of internal exceptions.
- Exact ID / ref / title lookup against locally available data.
- Plugin default keyword weighting over locally available Recipe summaries /
  metadata when the local data access path is proven safe.
- Bounded `get` / `expand` over detail refs already known to the Plugin runtime.
- Next actions that point to status/diagnostics/resident startup or a more
  concrete query.

Forbidden functionality:

- No Plugin-owned semantic/vector provider.
- No Plugin-owned project information, source graph, module map, or file-flow
  provider.
- No frontend/Dashboard/general HTTP API justification.
- No silent promotion of keyword results to semantic results.
- No local/base capability growth that should live in AlembicCore or Alembic
  main.

### Functional Options

Recommended route:

- **Option 1: two-lane search, Plugin projection.** Plugin always runs the
  default keyword lane. When Alembic main is present and advertises
  semantic/vector capability, Plugin also calls resident semantic search, then
  returns the de-duplicated union of above-threshold Recipe summaries.

Required fallback:

- **Option 2: keyword-only operation.** When Alembic main is absent, Plugin
  returns exact / keyword / bounded-detail results only, with `semantic
  unavailable` diagnostics.

Rejected route:

- **Option 3: Plugin-owned full semantic stack.** Do not build or keep a
  Plugin-local semantic/vector service. If semantic/vector capability is needed,
  it belongs in AlembicCore and is exposed through Alembic main or another
  explicit host-plugin contract.

Conditional cleanup route:

- **Option 4: delete or move Plugin HTTP search subroutes.** `/api/v1/search`
  root may remain only if current host-plugin runtime proof requires it.
  Subroutes without host-plugin runtime consumers should be deleted or moved to
  Alembic/AlembicCore ownership.

## Search Capability And Parameter Simplification

Accuracy is the first design rule. `alembic_search` should prefer a smaller,
more predictable contract over broad recall, hidden context expansion, or
prime-like relationship assembly.

### Capability Shape

Keep only three user-facing operations:

- `search`: direct knowledge search. It returns only candidates with direct
  evidence from query terms, exact identifiers, Recipe metadata filters,
  AlembicPlugin keyword scores, resident semantic scores, or exact detail refs.
- `get`: exact retrieval for a known `refId`, `detailRefId`, or item id.
- `expand`: bounded expansion of one already-returned detail ref. It may reveal
  more of that item, but must not walk Recipe relationships or run a new broad
  search.

Remove from the search contract:

- Recipe relation-chain traversal;
- related Recipe recommendation bundles;
- inferred multi-hop context;
- "you may also need" expansion;
- session-history-driven candidate broadening;
- host-intent / task-intent / active-file / active-module candidate broadening;
- sourceRef-driven source navigation semantics;
- any ranking boost that cannot be explained as direct match evidence.

### Parameter Rule

The public parameter surface should be reduced to accuracy-bearing inputs:

- Required by operation:
  - `search`: explicit `query`, explicit `keywords`, or explicit Recipe
    metadata filters;
  - `get` / `expand`: `refId`, `detailRefId`, or exact `id`.
- Route / retrieval controls:
- `mode`: `auto`, `keyword`, or `semantic`. `auto` means Plugin keyword lane
    plus resident semantic lane if available. `keyword` means Plugin keyword
    lane only. `semantic` means resident semantic lane only. No other mode is
    part of the effective contract.
  - `limit`: small bounded result count;
  - `kind` / `category` / `language`: filters only, never expansion hints;
  - `dimensionId`, `knowledgeType`, `scope`, and `tags`: candidate public
    filters for scoped Recipe search;
  - combined Recipe attribute filters: different attribute keys narrow by
    intersection; multiple values under the same key are allowed only when the
    output explains whether they are OR alternatives or exact-set matching.
- Host runtime inputs:
  - `projectRoot` stays a routing/scope input;
  - `hostDeclaredIntent`, `hostTurnMeta`, `sessionHistory`, `activeFile`,
    `module`, and source/navigation hints must not provide the search query,
    create candidate classes, boost ranking, or affect trust;
  - if retained for compatibility, those inputs are diagnostics/sanitation-only
    and should be absent from the normalized search expression.
- Budget / freshness fields should not expose search strategy complexity to the
  agent. They may cap output and request freshness, but must not change the
  meaning of search.

If an input is retained for backward compatibility but no longer participates in
search relevance, output diagnostics or schema descriptions must say so. Silent
parameter influence is not allowed.

Facet / range search rule:

- A query such as "what architecture norms do we have", "有哪些设计模式", or
  "show real examples for dependency injection" may return multiple Recipe
  summary entries, with grouping/facet summaries as optional navigation.
- A metadata-only or low-text query such as "项目都有哪些规则" is valid. In this
  class, `alembic_search` may admit Recipes by explicit metadata membership, as
  long as every admitted entry shows the filters that made it eligible.
- The output should include matched facet fields, group counts, omitted counts,
  multiple bounded summary entries, and why each entry or group was selected.
- Each returned search item should expose only the search-result contract:
  stable id / ref, title, short summary, lightweight classification fields,
  matched filters, match score/evidence label, and exact detail lookup handle.
- Representative Recipe entries are allowed only after the response has reached
  an explicit output budget. In that case, the output must show total matched
  count, returned count, omitted count, and the continuation or exact detail
  operation the agent should use to inspect the omitted Recipes.
- When the agent supplies combined attributes, the response must echo the
  normalized filter expression and show which attributes were applied,
  unsupported, ignored, or treated as free text.
- Facets are knowledge metadata, not project topology. They must not infer
  source/module relations or walk Recipe relation chains.
- If a requested facet is unsupported by the public schema or resident/Core
  route, the output must say which facet is unsupported instead of silently
  treating it as a free-text query.

### Match Admission Rule

A Recipe is returned only when it crosses an explicit match threshold:

- exact id / ref hit;
- AlembicPlugin keyword lane match rate reaches the keyword threshold;
- explicit Recipe metadata match for a scoped / faceted range query;
- resident semantic lane match rate reaches the semantic threshold;
- bounded detail ref from a previous `search` result.

Weak semantic similarity, host/session context, relation-chain proximity,
source navigation hints, or old usage feedback cannot by itself make a candidate
matched. When no Recipe crosses the threshold, return zero matches and explain
which threshold was not met.

## Problem

The current implementation already contains many of the right building blocks,
but they are not yet proven as one stable agent-facing tool.

Main problems:

- Keyword-only operation is not robust enough when resident search is unavailable.
  In the current window, ready knowledge plus stopped daemon can still produce
  `Database not initialized` failures.
- Clean output can fail contract projection in some failure paths.
- Mode behavior is not visible enough to the agent. Current behavior can leave
  keyword or context on Plugin-local routes even when Alembic main exists, and
  the result does not always make route choice or capability level obvious.
- The input surface is too broad for a precision-first search tool. Parameters
  such as host intent, session history, active file, module, budget, and freshness
  can blur whether a candidate was found by direct search or by context
  expansion.
- Candidate merging can blur evidence. Search / resident evidence and broad
  knowledge-service candidate evidence are merged into one pool, so the final
  result must preserve the strongest evidence source, not accidentally replace
  it with a generic entry score.
- Recipe relation-chain expansion makes `alembic_search` overlap with
  `alembic_prime`. This should be removed from search behavior; relation
  traversal belongs to prime/context workflows, not direct search.
- Query class behavior is implemented through local rules and tests, but it
  needs an acceptance matrix so future changes do not reintroduce low-info
  noise, Chinese quality-query drift, or unrelated high-score legacy knowledge.
- Visible summary alone is too thin for agent judgment; structured content must
  carry enough high-signal result fields, diagnostics, and next actions within
  budget.

## Proposed Behavior

### 1. Stable Runtime Baseline

For initialized projects with usable knowledge:

- `alembic_search` must report which lanes it used: keyword, resident semantic,
  both, keyword-only, or unavailable.
- `alembic_search` must not fail only because the resident daemon is stopped.
- Resident unavailable must be represented in `result.residentSearch`,
  `result.residentVector`, diagnostics, and freshness state.
- Keyword-only operation must either return exact/keyword/filter matches above
  threshold or a clean no-match degraded output.
- If Plugin-local data access is truly unavailable, the tool must return a
  clean failed output with a precise project/runtime diagnostic, not an
  unprojected internal exception.
- Parallel read-only calls must not corrupt shared ServiceContainer or output
  projection state.

### 2. Explicit Mode Contract

Keep the mode contract simple and observable:

- `auto`: preferred agent mode; run AlembicPlugin keyword lane and add resident
  semantic lane if available.
- `keyword`: run AlembicPlugin keyword lane only.
- `semantic`: resident semantic only. Without resident semantic support, return
  clean unavailable / no-match diagnostics; do not claim Plugin-local
  semantic/vector behavior.
- Removed modes are not compatibility inputs: they are cleaned from schema,
  handler branches, resident-client normalization, tests, docs, and probes.

If implementation changes which modes are supported, that change must
update schema text, tool description, tests, and runtime diagnostics in the same
task.

### 3. Candidate Evidence Preservation

Candidate merge and rerank must preserve direct evidence in priority order:

1. exact id / ref evidence;
2. explicit Recipe metadata filter evidence;
3. exact title / keyword evidence from the Plugin keyword lane;
4. resident semantic / vector evidence when available;
5. knowledge-service baseline fields.

The final item should expose:

- stable unique id / ref;
- title;
- summary;
- `whyMatched`;
- `scoreBreakdown`;
- exact detail lookup handle;
- `resident` summary when resident was attempted;
- `vector` availability / used state.

Broad knowledge-service candidates may enrich a search result, but must not
erase search-specific or resident-specific evidence.

Relation-chain and intent evidence are explicitly out of scope for
`alembic_search`. If the agent needs the full Recipe, it should use the returned
unique id in an exact Recipe detail lookup.

### 4. Query Class Behavior

Define query classes as acceptance behavior, not incidental regex behavior.

Required classes:

- Low-information query, for example `where do I start`:
  - no matches without concrete query terms or explicit filters;
  - status degraded;
  - next action asks for concrete knowledge terms or filters, not project/source
    context.
- Specific Recipe / handler / schema query:
  - returns concrete above-threshold summary matches;
  - each visible item has enough `whyMatched` / `scoreBreakdown` to explain why.
- MCP tool quality query in Chinese or English:
  - prioritizes actual MCP tool quality, handler, schema, ranking, output
    contract, and knowledge-context material;
  - suppresses unrelated general knowledge even if legacy search scores it high.
- Bounded detail query:
  - search returns only candidates with real bounded-detail support;
  - `get` and `expand` remain the only detail expansion operations.
- Recipe scope / faceted query:
  - supports questions about available design patterns, architecture norms,
    standards, real cases, examples, and project rules in the knowledge base;
  - supports combined metadata filters across dimension, category, kind,
    knowledge type, tags, scope, language, and similar Recipe metadata;
  - permits metadata-matched Recipe summary browsing when the agent is asking
    what rules exist, even if individual entries are not strong lexical matches;
  - returns multiple bounded summary entries, optional groups, entry counts,
    omitted counts, and stable ids / refs;
  - uses representative Recipes only as a budget fallback, not as the default
    answer to rule-understanding queries;
  - does not assemble prime context or project-source topology.
- Context-heavy or relation-seeking query:
  - does not trigger Recipe relation-chain traversal inside `alembic_search`;
  - returns direct summary matches only, without prime-style relationship
    context.

### 4A. Scoped Recipe Result Contract

For Recipe scope / faceted queries, the agent-readable result is not a category
index, not a prime package, and not a Recipe detail document. It is a bounded
list of matching Recipe summary entries.

Each returned item should include, when available:

- identity: `id`, `refId` or `detailRefId`, and `title`;
- classification: `dimensionId`, `category`, `kind`, `knowledgeType`, `scope`,
  `language`, and `tags`;
- search summary: one short summary / snippet sufficient to choose whether to
  open the Recipe detail;
- evidence: matched filters, `whyMatched`, `scoreBreakdown`, resident/Core route
  evidence, vector state, and trust label;
- navigation: stable detail ref for `get` / `expand`.

The structured output should also include a search-level facet block:

- `normalizedFilters`: the exact filter expression used;
- `appliedFilters`: fields that affected candidate admission;
- `unsupportedFilters`: fields rejected by schema or route;
- `ignoredInputs`: compatibility / sanitation-only inputs that did not affect
  candidate admission;
- `groups`: optional counts by requested facet such as category, kind, tag, or
  scope;
- `totalMatched`, `returnedCount`, `omittedCount`, and the next exact operation
  for inspecting omitted entries.

The output must not satisfy a rule-understanding query with only:

- category names;
- counts;
- full Recipe content;
- relation chains;
- inferred source/module/file topology.

Representative projection is valid only after the output budget is reached, and
must preserve the omitted inspection path.

### 5. Clean Output And Agent Efficiency

`alembic_search` output must remain compact but useful:

- visible text stays summary-only;
- structured items are the agent-readable result;
- no-match output must include which explicit threshold was not met;
- diagnostics must distinguish resident unavailable, vector unavailable,
  Plugin-local data unavailable, output projection failure, and zero matches;
- nextActions must be actionable and must not suggest lifecycle or mutation
  operations;
- nextActions should stay inside pure knowledge-search behavior: refine query,
  add filters, or fetch exact Recipe detail by id. They should not route to
  prime, ProjectContext, project map, source graph, lifecycle, or mutation
  operations as a substitute for search;
- `get` / `expand` detail refs must stay stable under budget changes.

### 6. Boundary With ProjectContext

`alembic_search` is knowledge retrieval. It may return stable Recipe ids and
detail refs attached to knowledge items, but it must not become a project
information query layer.

When the user's query asks for project map, module layers, file flow, symbols,
call graph, or source implementation, `alembic_search` should return no matches
or only directly matching knowledge summaries. It should not
use ProjectContext/project-source routing as hidden search behavior.

## Implementation Decisions For Controller Intake

The controller should treat this as a cross-repository chain, with AlembicPlugin
owning the public behavior and keyword lane, and Alembic / AlembicCore owning
resident semantic/vector proof.

### Required Implementation Shape

The implementation should be concrete and narrow:

1. Define one internal normalized search input shape inside the existing
   `alembic_search` implementation boundary. It should hold operation, query,
   lane selection, limit, and Recipe filters. It is not a new public layer and
   not a new tool.
2. Extend Plugin MCP `SearchInput` and handler args for `dimensionId`,
   `knowledgeType`, `scope`, and `tags`. If multi-value fields are accepted,
   the implementation must use OR-within-field and AND-across-fields, or
   explicitly reject unsupported / ambiguous combinations.
3. Reduce mode validation to exactly `auto`, `keyword`, and `semantic`; delete
   removed-mode schema entries, handler branches, resident-client
   normalization, tests, and docs instead of mapping them to keyword behavior.
4. Update Plugin validation so `search` is valid with explicit `query`,
   explicit `keywords`, or at least one explicit Recipe filter.
   `hostDeclaredIntent.query` must no longer provide the search query.
   A filter-only call is allowed only for Recipe scope browsing, and must
   produce a scoped/faceted summary result contract.
5. Keep Plugin keyword scoring as the canonical keyword lane. Normalize its
   output into `keywordMatchRate`, `keywordThreshold`, and keyword evidence
   fields; remove sourceRef/activeFile/module/session/host-intent influence.
6. Extend Plugin resident semantic request, Alembic main `/api/v1/search`
   semantic response, and resident handler output only as needed to return
   semantic lane candidates with `semanticMatchRate`, semantic availability, and
   vector evidence. Do not require resident keyword-style search as the keyword
   lane.
7. In `auto`, when resident semantic is available, wait for the semantic
   response before final output. Plugin then narrows the returned Recipe
   summaries by the normalized Recipe filters, applies semantic threshold
   admission, and merges them with keyword-lane matches.
8. Implement match-threshold projection. Every Recipe above the exact/filter/
   keyword/semantic threshold is returned within `limit` / pagination;
   below-threshold candidates are omitted with counts.
9. Update any resident/Core semantic metadata, cache keys, and slim/result
   projection so semantic score, vector-used truth, matched count, returned
   count, and omitted count are visible and do not produce cache pollution.
10. Update Plugin candidate provider to score against explicit query terms,
   summary/title fields, and Recipe metadata. Full Recipe body fields may be
   indexed elsewhere, but must not be projected by `search`.
11. Replace filter-match evidence and old relevance gates with match evidence /
   threshold admission. Explicit metadata membership admits the candidate set
   for scoped Recipe search.
12. Add deterministic two-lane merge: merge by Recipe id/ref, preserve keyword
    lane order, append semantic-only matches in resident order, and merge
    duplicate evidence into one item.
13. Replace search-time relation-chain expansion with direct item detail refs.
    `search`, `get`, and `expand` must not project relation-chain payloads,
    relation health, or prime-style context material. Relation-chain visibility
    belongs to `prime` or to a separate non-ASQ requirement, not to public
    `alembic_search`.
14. Project only summary result fields through `projectKnowledgeItem`: stable
    id/ref, title, short summary, lightweight classification, score/evidence,
    route diagnostics, and exact detail lookup handle.
15. Preserve keyword-only operation: when resident semantic is absent, exact /
    keyword / metadata-list results remain available if local data is
    initialized; semantic/vector claims remain unavailable.

### Concrete Cross-Repo Work Items

The implementation should not start with broad refactors. The minimum real work
items are:

- Plugin schema and tool description: add Recipe filters, filter-only validity,
  ignored/sanitation-only input diagnostics, and exact three-mode validation.
- Plugin handler: remove relation-chain behavior from search, normalize filter
  expression, execute keyword/filter lane, compute `keywordMatchRate`, call and
  wait for the resident semantic lane when available, narrow returned resident
  Recipes by normalized filters, merge/de-duplicate, and project summary
  candidates only.
- Plugin resident client: carry the normalized query and any filters needed for
  semantic narrowing, and preserve semantic lane diagnostics.
- Alembic main HTTP search: expose a resident semantic/vector response shape
  with normalized semantic score, vector-used truth, applied filters, and
  fallback reasons. It must not inject host intent, Decision Register, or prime
  packages into pure search.
- AlembicCore semantic/vector path: preserve score metadata and classification
  fields needed by the resident semantic lane; avoid type/kind
  misclassification such as `rule` only meaning `boundary-constraint` unless
  that is explicitly retained and documented.
- Tests: add end-to-end-like handler tests first, then resident/Core tests only
  where the failure is lower in the chain.

### Candidate Package ASQ0: Fact Confirmation

Owner suggestion: AlembicPlugin, read-only first.

Purpose:

- reproduce the stopped-daemon `Database not initialized` failure;
- reproduce or disprove clean-output contract mismatch;
- inspect whether current dist and source agree;
- record exact call stack or failure envelope.

Exit evidence:

- raw MCP outputs;
- status / diagnostics outputs;
- source or dist line refs for the failing path;
- no code changes unless controller explicitly folds ASQ0 into ASQ1.

### Candidate Package ASQ0A: Plugin Migration Leftover Inventory

Owner suggestion: AlembicPlugin, read-only first.

Purpose:

- produce a concrete inventory of AlembicPlugin migration leftovers around
  legacy public tools, source graph, panorama, HTTP search subroutes,
  `residentServiceClient`, and Plugin-local Core search/vector tests;
- classify each item as current-owned, compatibility tombstone, delete
  candidate, or needs decision;
- prove which candidates are actually reachable through public MCP, embedded
  host-plugin runtime contracts, host-agent workflows, tests, or internal
  imports;
- reject frontend, Dashboard, local-base, and general API usage as reasons for
  AlembicPlugin ownership; those responsibilities must route through
  AlembicCore or Alembic main;
- identify which cleanup items should be executed before search quality work so
  ASQ1/ASQ2 do not optimize dead routes.

Exit evidence:

- `rg` import and call-site scans for each candidate name/file;
- visible MCP tool-surface proof showing retired/removed tools are not visible;
- direct-call proof for retired names where fail-closed behavior is intentionally
  retained;
- host-plugin runtime consumer proof for `/api/v1/search` and each search
  subroute;
- a deletion plan that names files/tests to delete or rewrite, plus validation
  commands.

### Candidate Package ASQ0B: Runtime Route Boundary Matrix

Owner suggestion: AlembicPlugin with Alembic / AlembicCore evidence refs.

Purpose:

- prove current keyword-lane behavior and resident semantic-lane behavior for
  Alembic-main-present and keyword-only states;
- record whether resident `/api/v1/search` supports semantic/vector search and
  what score metadata it returns;
- define the output route fields / diagnostics needed for agents to know whether
  a result came from keyword lane, semantic lane, both lanes, or no available
  route;
- prove the effective mode surface is exactly `auto`, `keyword`, and
  `semantic`, with removed modes absent rather than remapped.

Exit evidence:

- route matrix for `auto`, `semantic`, `keyword`, `get`, and `expand`;
- full Alembic-space scan proving removed modes have no public schema, handler,
  resident-client normalization, tool description, docs, probe, or test
  assertion left alive;
- resident semantic/vector capability proof from Alembic main;
- keyword-only proof with daemon stopped / timed out / project mismatch;
- explicit rejected path: no Plugin-owned full semantic/vector stack;
- implementation decision for two-lane Option 1, keyword-only Option 2, and
  Plugin HTTP cleanup Option 4 ordering.

### Candidate Package ASQ0C: BM25 Full Project Deletion

Owner suggestion: AlembicPlugin for Plugin surfaces, with AlembicCore / Alembic
main evidence for any lower-level algorithm or test movement.

Purpose:

- remove the retired `bm25` / `BM25` name and compatibility behavior from the
  active project, not only from public MCP schemas;
- prove that retained keyword behavior is named and surfaced only as keyword,
  exact, lexical, sparse, or another approved neutral term;
- identify every remaining occurrence across source, tests, docs, comments,
  fixtures, probes, generated schemas, runtime output labels, diagnostics, and
  validation assertions;
- classify each occurrence as delete-now, rename-to-neutral-keyword, move to the
  owning repository, or archive historical-only evidence outside active project
  docs;
- prevent search quality work from optimizing or preserving an old BM25 branch,
  score explanation, test suite, comment, output field, or compatibility mode.

Execution order:

1. Run a case-sensitive and case-insensitive Alembic-space scan for `bm25`,
   `BM25`, and known old-mode spellings before edits.
2. Separate active implementation / tests / docs from generated artifacts,
   archived historical evidence, dependency code, and this ASQ requirement record.
3. Delete or rename active project occurrences. Public and runtime-facing names
   must become keyword / lexical / sparse as appropriate; no compatibility alias
   may map `bm25` to keyword.
4. Move Core algorithm tests out of AlembicPlugin when they prove Core behavior,
   or rename / reduce them to Plugin boundary tests when they prove only
   host-plugin behavior.
5. Re-run the scan after edits. Acceptance requires zero active project matches,
   except for archived historical evidence or this active ASQ record while it is
   still the authority for the deletion demand.

Exit evidence:

- before / after scan outputs for `bm25`, `BM25`, and removed-mode aliases;
- exact list of files deleted, renamed, moved, or rewritten;
- proof that `auto`, `keyword`, and `semantic` remain the only public search
  modes;
- proof that runtime output, score labels, diagnostics, comments, and docs no
  longer emit or describe `bm25` / `BM25`;
- validation showing keyword behavior still works under the neutral keyword lane
  and no `bm25` compatibility fallback remains.

### Candidate Package ASQ1: Plugin Runtime And Output Stability

Owner suggestion: AlembicPlugin.

Purpose:

- make stopped-daemon plus ready-knowledge search return stable clean output;
- ensure internal Plugin-local data access / initialization failure is caught and
  projected;
- ensure all failure paths satisfy `KnowledgeContextMcpResultSchema`;
- keep `get` / `expand` bounded and stable;
- execute ASQ0A / ASQ0C-confirmed cleanup that directly affects search runtime
  stability or route ownership, without deleting still-owned compatibility
  contracts;
- implement ASQ0B route diagnostics so every result clearly identifies keyword
  lane, resident semantic lane, both lanes, keyword-only, or unavailable
  behavior.

Validation:

- Plugin unit tests around `SearchHandlerResidentSearch`;
- Plugin MCP server test for initialized knowledge, daemon stopped;
- clean output contract tests;
- direct MCP probe after dist reload.

### Candidate Package ASQ2: Precision, Parameter Simplification, And Query Class SQ

Owner suggestion: AlembicPlugin with AlembicCore consultation only if Core
ranking facts are insufficient.

Purpose:

- remove Recipe relation-chain expansion from `alembic_search`;
- simplify public parameter semantics so only accuracy-bearing inputs influence
  results;
- keep AlembicPlugin default keyword weighting as the canonical keyword lane and
  expose it as `keywordMatchRate` with threshold admission;
- implement the two-lane union contract: keyword above threshold, resident
  semantic above threshold when available, merge by Recipe id/ref, no final
  complex fusion layer;
- add scoped Recipe / knowledge faceted search for project design patterns,
  architecture norms, standards, real examples, and project rule-content
  browsing, using explicit combined metadata filters and multiple summary
  candidates rather than hidden broadening;
- propagate Recipe filters through Plugin schema, handler args, resident semantic
  request body where needed, keyword/filter candidate scoring, threshold
  admission, and output projection;
- make filter-only `search` valid only when at least one explicit Recipe filter
  is present, and show the normalized filter expression in output;
- expose only search-result fields in items: stable id/ref, title, summary,
  lightweight classification, `keywordMatchRate`, `semanticMatchRate` when
  present, matched filters/evidence, and exact detail handle;
- preserve strongest evidence during candidate merge;
- prevent broad knowledge-service candidates from overriding search / resident
  evidence;
- make low-information, MCP quality, bounded detail, Recipe-scope, and specific
  query classes explicit in tests;
- add a relation-seeking query class that proves search returns direct matches or
  no match, but does not assemble relation-chain context;
- keep Chinese quality-query behavior covered.

Validation:

- extend `SearchHandlerResidentSearch.test.ts`;
- add focused candidate-merge unit coverage;
- add schema validation tests proving `dimensionId`, `knowledgeType`, `scope`,
  `tags`, and filter-only scoped searches are accepted, while unsupported
  facets produce diagnostics instead of silent free-text search;
- add resident-client tests proving filters are sent to Alembic main and route
  diagnostics echo applied filters and semantic availability;
- add two-lane merge tests proving duplicates are de-duplicated by Recipe id/ref,
  keyword order is preserved, semantic-only matches append in resident order, and
  below-threshold candidates are omitted;
- add parameter simplification tests that prove `hostDeclaredIntent`,
  `hostTurnMeta`, `sessionHistory`, `activeFile`, `module`, and source/navigation
  hints do not provide query text, broaden candidates, boost ranking, or affect
  trust;
- add scoped Recipe facet tests for dimension/category/kind/knowledgeType/tags
  /scope/language filters, combined attribute filters, metadata-only rule
  content queries, multiple summary entries, grouped output, entry counts,
  omitted counts, and exact detail lookup handles;
- add no-relation-chain assertions for `search` output so relation-heavy queries
  cannot reintroduce prime-style context;
- add SQ matrix fixture with expected matched IDs, below-threshold IDs, lane
  evidence, status, and diagnostics.

### Candidate Package ASQ3: Resident And Core Metadata Proof

Owner suggestion: Alembic and AlembicCore.

Purpose:

- prove resident route preserves Core semantic/vector facts without inferring
  vector usage from mode strings;
- prove resident semantic scores are normalized enough to become
  `semanticMatchRate` and threshold evidence;
- explicitly document that resident keyword-style search is not required for the
  keyword lane, because AlembicPlugin default keyword weighting owns that lane;
- add resident/Core support for Recipe filters only where semantic narrowing
  needs them; Plugin remains responsible for final Recipe narrowing and this
  must not turn into resident-owned keyword search;
- pass `dimensionId`, `knowledgeType`, `scope`, `tags`, `category`, `kind`, and
  `language` through Alembic main `/api/v1/search` into semantic execution if
  resident semantic filtering is required;
- include normalized semantic filters in SearchEngine cache keys, telemetry, and
  fallback metadata where Core executes the semantic lane;
- preserve Recipe classification fields and summary fields in Core/resident
  semantic result projection so Plugin does not need to rehydrate every semantic
  result from a separate broad list call;
- remove or disable hidden Decision Register enrichment for pure
  `alembic_search`; decisions appear only when they are direct searchable
  knowledge entries matched by the explicit query/filter;
- ensure Core fallback reasons remain precise for resident semantic availability,
  vector unavailable, sparse-only fallback, timeout, and project mismatch.

Validation:

- Alembic `SearchRouteTelemetry.test.ts`;
- AlembicCore `SearchEngine.test.ts`;
- resident HTTP request tests for combined filters and filter-only scoped
  semantic narrowing where supported;
- Core tests for semantic filter narrowing, tag matching, scope matching, cache
  key separation, and projection of `id/ref`, title, summary,
  `dimensionId`, `knowledgeType`, `scope`, tags, category, kind, language, and
  score metadata;
- tests for sparse-only vector fallback and semantic unavailable behavior.

### Candidate Package ASQ4: End-To-End Agent Tool Proof

Owner suggestion: controller decides whether Plugin or Test executes.

Purpose:

- validate installed / local-dev MCP surface after build and reload;
- run stopped-daemon baseline probes;
- run resident-daemon probes if a local daemon is intentionally started by the
  owning implementation window;
- verify visible summary, structuredContent, diagnostics, and nextActions.

Validation probe matrix:

- `where do I start`;
- `我要优化 alembic_search 返回内容质量和语义相关性噪声`;
- `alembic_search handler ranking schema resident search relevance gate`;
- `有哪些架构规范和设计模式 Recipe，按 category/kind/tags 分组给代表案例`;
- `按 dimensionId=<known-dimension> knowledgeType=architecture scope=project 看项目规则`;
- `只按 tags=semantic-quality,ranking 返回相关 Recipe 摘要和 id`;
- a filter-only scoped Recipe browse with no free-text query;
- a relation-seeking query that should not return prime-style relationship
  context;
- a `get` call using a returned detailRef;
- an `expand` call using a returned detailRef;
- Alembic-main-present proof for `auto` two-lane behavior, `semantic` resident
  semantic behavior, Plugin wait-and-narrow behavior for returned Recipe
  summaries, and `keyword` Plugin keyword-only behavior;
- Plugin keyword-only proof for daemon stopped / timeout / mismatch;
- resident unavailable;
- resident available if controller authorizes daemon start;
- parallel read-only calls.

## Testing Decisions

Testing should prove observable agent behavior at the highest useful seam, then
use lower seams only to localize failures.

- Plugin unit seam: `alembic_search` handler / projector tests prove clean
  output, route diagnostics, no relation-chain behavior, parameter
  simplification, keyword threshold admission, semantic threshold admission,
  two-lane de-duplication, and keyword-only behavior.
- Plugin server seam: compiled MCP server tests prove retired/unknown tool
  behavior, visible tool surface, direct calls, and installed-host output
  projection.
- Alembic main seam: resident route tests prove semantic/vector capability,
  telemetry, normalized semantic score, fallback reasons, filter propagation
  where supported, and absence of hidden intent / Decision Register enrichment.
- AlembicCore seam: search engine/vector tests prove resident semantic scoring,
  vector unavailable fallback, sparse-only classification, and score metadata
  truth.
- Contract seam: clean output schema tests prove success, degraded, and failure
  outputs fit `KnowledgeContextMcpResultSchema` without oversized arrays or
  private telemetry leakage.
- End-to-end seam: fresh/reloaded Codex MCP surface probes prove what a host
  agent actually sees for the query matrix.

Minimum validation matrix:

| Scenario | Required proof |
| --- | --- |
| Concrete handler/schema query | matched direct summary candidates with stable ids, lane evidence, and `whyMatched`. |
| Chinese search-quality query | relevant tool-quality results; unrelated old knowledge suppressed. |
| Low-information query | zero matched candidates plus refine-query/filter guidance, with no project-context handoff. |
| Relation-heavy query | no relation-chain context; direct summary matches or no match. |
| Recipe scope / faceted query | multiple bounded Recipe summary entries for design-pattern / architecture / standard / example / project-rule matches, including combined filters, optional grouping, counts, omitted counts, and stable ids. |
| Filter-only Recipe browse | accepted only with explicit Recipe filters; result shows normalized filters, applied/unsupported fields, multiple summary entries, and exact detail lookup handles. |
| Combined filter semantics | AND across different fields; documented OR or rejected behavior within a multi-value field; no silent free-text fallback for unsupported facets. |
| Metadata direct evidence | explicit Recipe metadata match admits scoped Recipe browsing; it cannot bypass low-info gates for unfiltered queries. |
| Two-lane duplicate | duplicate keyword+semantic Recipe appears once with both lane evidence and max match rate. |
| Resident semantic available | `auto` waits for resident semantic result, then Plugin narrows returned Recipes by normalized filters before merge/projection. |
| No final fusion | no RRF / CoarseRanker / MultiSignal / contextBoost / Decision Register / prime relation step can reorder or admit results after two-lane admission. |
| `get` / `expand` | exact bounded detail only; no broad search. |
| Alembic main present | `auto` runs keyword plus resident semantic when available; `keyword` remains Plugin keyword-only. |
| Plugin keyword-only state | exact/keyword/filter results or clean unavailable output for missing local data; no semantic claim. |
| Removed search mode | no public schema, handler, resident normalization, docs, probes, or tests keep it alive. |
| Resident timeout/mismatch | clean diagnostic; no unprojected exception. |
| Parallel calls | stable output and no shared-state corruption. |
| Legacy leftovers | removed, retired, or retained with consumer/removal proof. |

## Acceptance Criteria

The demand is complete only when:

- Direct search and prime context are isolated as capabilities, not merely
  described as separate intentions. Public `alembic_search` and
  `alembic_prime` have separate input normalization, handler boundaries,
  resident metadata projection, output projection, and tests.
- Public `alembic_search` code cannot statically import or runtime-instantiate
  Recipe relation-chain providers, prime search pipelines, prime knowledge
  material, host intent frame builders, intent evidence, or prime injection
  package helpers.
- Public `alembic_search` structured output for `search`, `get`, and `expand`
  contains no relation-chain payload, relation health, prime package, intent
  evidence, retrieval-consumer summary, or prime Trust Receipt fields.
- Supplying host intent, session history, active file, active module, source
  refs, or caller context to `alembic_search` cannot change candidate
  admission, ranking, route, `whyMatched`, or success diagnostics.
- `alembic_prime` remains the only public tool family allowed to surface Recipe
  relation-chain evidence, prime package material, Trust Receipt material, or
  prime context assembly. Prime preservation must be tested so ASQ search
  cleanup does not accidentally break prime-owned behavior.
- Shared lower-level retrieval is allowed only below public tool boundaries.
  The shared layer returns neutral retrieval facts; `alembic_search` projects
  direct match evidence, while `alembic_prime` projects prime context material.
- `alembic_search` on ready knowledge with stopped daemon returns a clean
  keyword-only or clean failed output, not an internal unprojected exception.
- Low-information queries with no concrete query terms or explicit filters return
  zero matched candidates and refine-query/filter guidance.
- Chinese and English MCP tool quality queries return relevant tool-quality
  candidates and suppress unrelated noisy knowledge.
- Specific handler / schema / ranking queries return matched candidates with
  clear keyword/semantic/filter evidence.
- `get` and `expand` return exact detail by id/ref and do not perform broad
  search.
- Candidate merge preserves keyword, resident semantic/vector, and filter
  evidence.
- `auto` search returns the de-duplicated union of all above-threshold keyword
  and available semantic matches; duplicate Recipe ids appear once with both
  lane evidence.
- Initial thresholds are accepted for first implementation:
  `keywordThreshold=0.50`, `semanticThreshold=0.55`, and future raw embedding
  similarity threshold `0.62` if Core exposes that signal. Tuning requires ASQ
  golden-query evidence and must preserve above-threshold return semantics.
- Filter-only search is valid for explicit Recipe metadata filters. Every Recipe
  that satisfies the hard filter expression is matched without requiring a
  keyword or semantic threshold; `limit`, pagination, grouping, and output budget
  control how many matched summaries are returned.
- Combined filters use AND across different metadata fields and OR within
  multiple values of the same field, unless schema explicitly rejects a field as
  single-valued or ambiguous. Output must echo the normalized filter expression.
- When resident semantic/vector is available, Plugin waits for resident semantic
  results, narrows returned Recipe summaries by normalized filters, applies
  semantic threshold admission, and only then merges/de-duplicates with keyword
  lane matches.
- No final fusion/rerank is allowed after two-lane admission. Plugin may only
  narrow by explicit Recipe filters, merge duplicate ids, preserve lane
  evidence, apply output budget, and project summary fields.
- Recipe relation-chain traversal is absent from `alembic_search`; relation-heavy
  needs return direct summary matches or no match.
- `search`, `get`, and `expand` no longer expose `recipeRelationCount`,
  relation-chain payloads, relation health, or prime context material as ASQ
  success evidence.
- Public/agent-facing parameter semantics are reduced and documented. Parameters
  retained for compatibility do not silently broaden search results.
- Public search mode surface is exactly `auto`, `keyword`, and `semantic`.
  Removed modes are cleaned from schema, handler logic, resident-client
  normalization, tests, docs, probes, and runtime descriptions.
- Scoped Recipe / knowledge search supports explicit metadata filters or facets
  for project design patterns, architecture norms, standards, real examples, and
  project rule-content browsing.
- Scoped Recipe / knowledge search supports combined attribute filters and
  metadata-only rule-content questions such as "what project rules exist".
- Filter-only search is accepted only for explicit Recipe scope browsing and
  returns a clear scoped/faceted contract; unfiltered low-information searches
  still return zero matches.
- Faceted search output includes matched facet fields, normalized filter
  expression, multiple bounded summary entries, group counts, omitted counts,
  stable ids / exact detail handles, and diagnostics for unsupported facets.
- Returned search entries include stable id/ref, title, short summary,
  lightweight classification, `matchRate`, `keywordMatchRate` when present,
  `semanticMatchRate` when present, match routes, and route diagnostics. They
  do not inline full Recipe content.
- Faceted search does not satisfy rule-understanding queries with category
  names, counts, or representative Recipes only, unless an explicit output
  budget forces representative projection and the omitted Recipe inspection path
  is visible.
- Recipe facet filters do not infer project topology, do not walk Recipe
  relation chains, and do not assemble prime-style context packages.
- Accuracy beats recall: weak semantic similarity, host/session context,
  relation proximity, source/navigation hints, or usage feedback alone cannot
  produce matched candidates.
- Mode route is visible in `result` and diagnostics.
- Alembic-main-present behavior is two-lane for `auto`: Plugin keyword plus
  resident semantic when available.
- Plugin keyword lane remains the default keyword behavior even when Alembic
  main is present.
- Alembic main is not required to provide duplicate keyword search support.
- Keyword-only behavior is explicitly limited to exact / keyword /
  bounded-detail fallback, with diagnostics for semantic/vector absence.
- `semantic` without resident semantic support never reports Plugin-local
  semantic/vector success.
- AlembicPlugin migration leftovers are inventoried before optimization changes:
  legacy tool tombstones, source graph files/tests, panorama tombstones,
  `/api/v1/search*` subroutes, deprecated `residentServiceClient`, and
  Plugin-local Core search/vector tests each have a current-owner,
  compatibility, delete, or decision classification.
- Confirmed delete candidates are removed or queued as a blocking cleanup item
  with evidence; retained compatibility entries name consumer, reason, owner,
  removal condition, and validation.
- Retained Plugin-local compatibility is limited to host-plugin functionality.
  Frontend, Dashboard, local/base search-vector, project-service, or general API
  needs are not valid reasons to keep logic in AlembicPlugin.
- No Plugin test keeps a retired project-information/source-graph/panorama route
  alive by asserting old usable behavior.
- Output satisfies `KnowledgeContextMcpResultSchema` for success, degraded, and
  failure paths.
- Unit tests cover Plugin handler, clean output, candidate merge, parameter
  simplification, no relation-chain search, no intent/context relevance,
  resident unavailable, low-info, MCP quality, bounded detail, and Recipe-filter
  behavior.
- Alembic resident route tests cover semantic/vector telemetry and unavailable
  metadata.
- AlembicCore search/vector tests cover resident semantic scoring, vector
  unavailable, sparse-only fallback, and metadata truth.
- A final MCP probe from a fresh or reloaded Codex plugin surface proves the
  behavior agents actually see.
- A repo-wide Alembic-space scan proves the removed search modes are absent from
  public interfaces, implementation branches, tests, docs, and validation
  probes.
- ASQ0 / ASQ0A / ASQ0B / ASQ0C remain the required front set before ASQ1 /
  ASQ2 / ASQ3 / ASQ4 implementation and validation.

## Risks And Edge Cases

- A stopped daemon is normal for some Codex sessions; it must not be treated as
  a fatal knowledge-search condition.
- Host-plugin runtime and resident daemon have different ownership. Plugin must
  present this clearly without pretending to own daemon startup, local/base
  search/vector behavior, or frontend/API product surfaces.
- Parallel tool calls may reveal shared singleton initialization bugs that
  sequential unit tests miss.
- Regex-based query class detection can become hidden policy. It needs SQ
  matrix tests whenever changed.
- Faceted search can become vague if unsupported fields are treated as free-text
  keywords. Unsupported facets need explicit diagnostics, and combined filters
  need visible normalization so the agent can tell whether the result is an
  broad rule-content browse or a narrowed search.
- Filter support can become fake if only Plugin schema changes. Acceptance must
  prove the same filter expression reaches resident/Core or a labeled
  Plugin-only metadata-list fallback, and that cache keys / fallback metadata
  distinguish different filter sets.
- Metadata-matched browsing can over-admit old or weak Recipes. Admission must
  be tied to explicit query/filter expression, lifecycle policy, and visible
  matched filters.
- Core `type` / `kind` behavior currently has legacy shortcuts. A `rule` query
  should not silently mean only `boundary-constraint` unless that mapping is
  intentionally retained, documented, and tested.
- Hidden Decision Register enrichment can dominate results if it remains wired
  into pure search. It should be removed or limited to direct first-class
  searchable knowledge entries.
- Knowledge-service baseline entries are useful for enrichment, but dangerous
  if they silently outrank direct search evidence.
- Visible summary is intentionally short; acceptance must inspect
  `structuredContent`, not only visible text.
- Source/navigation hints and host metadata should not participate in search
  relevance. If compatibility paths still accept them, private absolute paths
  must not leak through resident telemetry or diagnostics.
- Cleanup can accidentally remove still-owned host-plugin runtime contracts. The
  root `/api/v1/search` route is currently listed by the host-plugin embedded
  runtime contract and I22 replay, so deletion must start from proven-dead
  subroutes/helpers/tests unless the host-plugin contract is deliberately
  changed. That contract must not be expanded into frontend, Dashboard,
  local/base, or general API ownership.
- Fail-closed tombstones are sometimes intentional. Deleting them without a
  public-surface/direct-call decision can turn a clear retired-tool error into
  confusing unknown-tool behavior.

## Source Refs

Merged ASQ source documents:

- Original authority:
  `Design/docs/current/alembic-search-output-quality-optimization-requirement-design-2026-06-15.md`.
- Error correction and resume plan:
  `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq-scope-reset-precision-match-plan-2026-06-16.md`.
- Current progress projection:
  `.wakeflow-active/current/alembic-search-output-quality-optimization/developer-progress.md`.
- Real implementation landing plan:
  `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq-real-implementation-landing-plan-2026-06-16.md`.
- Search / prime capability isolation supplement:
  `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq-search-prime-capability-isolation-supplement-2026-06-16.md`.
- Historical research source, usable only for non-relation facts after this
  merge:
  `Design/docs/current/alembic-search-output-quality-asq4-full-chain-solution-2026-06-16.md`.
- Historical publication-route source, usable only for direct source-backed
  content publication/searchability facts after this merge:
  `Design/docs/current/alembic-search-output-quality-asq4b1-knowledge-publication-route-solution-2026-06-16.md`.
- Requirement-group source, usable only where it agrees with this merged ASQ
  authority:
  `Design/docs/current/alembic-search-output-quality-optimization-requirement-group-2026-06-16.md`.

Code source references from the original and merged research:

- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:454`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:502`
- `AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:113`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:222`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:530`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:956`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:1013`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:1053`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:1123`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:1231`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:649`
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:431`
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:1969`
- `AlembicPlugin/lib/service/project-knowledge-context/contracts/KnowledgeContextToolOutput.ts:83`
- `AlembicPlugin/lib/service/project-knowledge-context/layer/KnowledgeContextOutputProjector.ts:66`
- `AlembicPlugin/lib/service/project-knowledge-context/retrieval/KnowledgeRetrievalProvider.ts:1`
- `AlembicPlugin/lib/service/project-knowledge-context/retrieval/RecipeCandidateProvider.ts:44`
- `AlembicPlugin/lib/runtime/mcp/handlers/types.ts:190`
- `AlembicPlugin/lib/runtime/mcp/handlers/types.ts:239`
- `AlembicPlugin/lib/injection/modules/AppModule.ts:82`
- `AlembicPlugin/lib/http/HttpServer.ts:252`
- `AlembicPlugin/lib/http/routes/search.ts:48`
- `AlembicPlugin/lib/http/routes/search.ts:131`
- `AlembicPlugin/lib/http/routes/search.ts:273`
- `AlembicPlugin/lib/runtime/ToolPolicy.ts:91`
- `AlembicPlugin/lib/runtime/mcp/McpServer.ts:113`
- `AlembicPlugin/lib/runtime/mcp/McpServer.ts:345`
- `AlembicPlugin/lib/runtime/mcp/source-graph/status.ts:798`
- `AlembicPlugin/lib/runtime/mcp/source-graph/output.ts:3`
- `AlembicPlugin/lib/injection/modules/PanoramaModule.ts:1`
- `AlembicPlugin/lib/runtime/mcp/handlers/panorama.ts:30`
- `AlembicPlugin/lib/runtime/runtime/EmbeddedRuntimeContract.ts:8`
- `AlembicPlugin/lib/runtime/mcp/plugin-host-contracts.ts:162`
- `AlembicPlugin/lib/workflows/capabilities/completion/CompletionSteps.ts:20`
- `AlembicPlugin/test/unit/CodexToolPolicy.test.ts:21`
- `AlembicPlugin/test/unit/SearchHandlerResidentSearch.test.ts`
- `AlembicPlugin/test/unit/CodexMcpServer.test.ts`
- `Alembic/test/unit/SearchRouteTelemetry.test.ts`
- `Alembic/lib/shared/schemas/mcp-tools.ts:130`
- `Alembic/lib/http/routes/search.ts:95`
- `Alembic/lib/http/routes/search.ts:201`
- `Alembic/lib/http/routes/search.ts:242`
- `Alembic/lib/shared/schemas/http-requests.ts:88`
- `Alembic/lib/resident/tool-handlers/search.ts:87`
- `Alembic/lib/resident/tool-handlers/browse.ts:150`
- `Alembic/lib/resident/tool-handlers/browse.ts:168`
- `Alembic/lib/resident/tool-schema/types.ts:190`
- `Alembic/lib/resident/tool-schema/types.ts:239`
- `AlembicCore/src/service/search/SearchEngine.ts:208`
- `AlembicCore/src/service/search/SearchEngine.ts:576`
- `AlembicCore/src/service/search/SearchEngine.ts:900`
- `AlembicCore/src/service/search/SearchEngine.ts:1095`
- `AlembicCore/src/service/search/SearchTypes.ts:131`
- `AlembicCore/src/service/search/SearchTypes.ts:437`
- `AlembicCore/src/service/search/SearchEngine.ts:649`
- `AlembicCore/src/service/search/FieldWeightedScorer.ts:1`
- `AlembicCore/src/types/KnowledgeWire.ts:95`
- `AlembicCore/src/domain/knowledge/KnowledgeEntry.ts:27`
- `AlembicCore/src/service/knowledge/KnowledgeService.ts:592`
- `AlembicCore/src/service/knowledge/KnowledgeService.ts:934`
- `AlembicCore/src/service/knowledge/KnowledgeFileWriter.ts:43`
- `AlembicCore/test/SearchEngine.test.ts`

## Controller Intake Notes

This is a Design requirement draft, not an execution packet.

User confirmation: all listed confirmation points are confirmed. The confirmed
scope is an independent `alembic_search` optimization demand with ASQ0 / ASQ0A
/ ASQ0B / ASQ0C as the required front set and cleanup gate before search-quality
implementation.

Controller-ready requirement group:
`alembic-search-output-quality-optimization-requirement-group-2026-06-16.md`.

Design review conclusion:

- The requirement is coherent as an independent `alembic_search` optimization
  demand. It should not be merged into the active GPC `alembic_graph` demand
  unless the controller explicitly decides to create a broader SQ follow-up.
- The implementation route is intentionally front-loaded with proof and cleanup:
  ASQ0 confirms observable failures, ASQ0A inventories Plugin migration
  leftovers, ASQ0B fixes the resident/Plugin/Core route boundary, and ASQ0C
  removes the retired `bm25` / `BM25` name before ASQ1/ASQ2 change behavior.
- The core product decision is accuracy-first search. `alembic_search` should
  return direct, explainable knowledge matches or an honest no-match /
  unavailable result; it should not use relation-chain traversal, hidden context
  broadening, ProjectContext project facts, or Plugin-local semantic/vector
  ownership to inflate recall.
- The main connectivity risk is a false ownership conclusion. AlembicPlugin owns
  the MCP host-plugin surface and projection; Alembic main owns the resident
  executable search route; AlembicCore owns base retrieval, vector, ranking, and
  metadata truth. Any retained compatibility path must name its current consumer
  and removal condition.
- The demand is ready for controller intake as a user-confirmed design. It is
  not ready for direct search-quality dispatch without the
  ASQ0/ASQ0A/ASQ0B/ASQ0C front set.

Do not dispatch from this document until the controller decides whether to:

- accept the demand as an independent optimization;
- fold it into a broader four-tool SQ follow-up;
- run ASQ0 fact confirmation, ASQ0A leftover inventory, ASQ0B route boundary
  matrix, and ASQ0C `bm25` full deletion before search-quality implementation;
- or ask the user to confirm the final scope.

Recommended first controller action: create a front set containing ASQ0, ASQ0A,
ASQ0B, and ASQ0C. The current MCP probe already shows a runtime failure, the
Plugin contains migration leftovers, the route boundary must be decided, and the
retired `bm25` / `BM25` name must be deleted before ASQ1/ASQ2 implementation
changes begin.
