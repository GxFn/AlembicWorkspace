# Alembic Search Output Quality ASQ4B1 Knowledge Publication Route Solution

Date: 2026-06-16

Design Key:
`alembic-search-output-quality-asq4b1-knowledge-publication-route-solution-2026-06-16`

Design state: controller-assigned Design route solution

Responsible window: Design

Receiving window: AlembicWorkspace controller

State root:
`.wakeflow-active/current/alembic-search-output-quality-optimization`

Task package:
`alembic-search-output-quality-asq4b1-design-knowledge-publication-route-solution-p8`

Target task:
`asq4b1-design-knowledge-publication-route-solution-t1`

## Boundary

This document is a Design solution for the ASQ4B blocker. It does not dispatch
implementation, accept ASQ, mutate Wakeflow controller state, or edit product
source code.

The remaining blocker is not another isolated `alembic_search` ranking patch.
ASQ now needs a valid production route that can put source-backed, ASQ-specific
knowledge and relation metadata into the real AlembicWorkspace knowledge DB,
without destructive rebuild and without fake knowledge.

## User Goal

`alembic_search` must help an agent find useful AlembicWorkspace knowledge:
rules, facts, decisions, implementation background, diagnostics, relation
evidence, stable detail refs, and next actions. Search quality is accepted only
when real entries are searchable and expandable, not when tools merely connect,
schemas validate, or diagnostics explain why useful content is missing.

## Blocker Facts

ASQ4B proved the current Plugin-owned path cannot complete knowledge coverage:

- the real AlembicWorkspace knowledge DB was ready with `140` entries;
- baseline and post-rescan `alembic_search` probes for `alembic_search`,
  `ProjectGraphProvider`, and ASQ output quality all returned zero trusted
  results;
- two source-backed `alembic_submit_knowledge` attempts were rejected before
  persistence;
- the successful non-destructive `alembic_rescan` updated freshness but returned
  verify-only coverage and no usable produce or gap-fill session for
  ASQ-specific entries;
- non-rebuild `alembic_bootstrap` correctly refused destructive rebuild;
- `alembic_graph` could orient around a concrete `ProjectGraphProvider` file,
  but graph orientation is not searchable knowledge coverage;
- current submit evidence gates require active session binding, exact source
  ranges for snippets, and fresh graph refs for relationship claims;
- current production gateway does not pass arbitrary submit-item `relations`
  into persisted `KnowledgeEntry` create data, even though `KnowledgeEntry` and
  `KnowledgeService` can store and sync relations when they are present.

## Relevant System Facts

- `alembic_submit_knowledge` is already the intended unified production route
  for host-agent-created knowledge.
- `alembic_rescan` already describes a rescan-host-agent workflow:
  evolve existing entries, submit gap-fill entries only when
  `executionMode="produce"`, then complete the dimension.
- The ASQ4B rescan did not expose such a produce session because the planner
  judged the selected dimension verify-only.
- `RecipeProductionGateway.create()` is the correct shared creation pipeline.
  It validates, deduplicates, runs consolidation, calls
  `KnowledgeService.create()`, updates quality, and records audit.
- `KnowledgeEntry` has a `relations` field. `KnowledgeService.create()` calls
  `_syncRelationsToGraph(saved.id, saved.relations)`, and
  `KnowledgeService.update()` allows `relations`.
- `KnowledgeService._syncRelationsToGraph()` syncs relation edges only when
  targets are real UUID knowledge ids.
- `DefaultRecipeRelationChainProvider` consumes `item.relations`,
  `metadata.relations`, `metadata.knowledge_edges`, `metadata.knowledgeEdges`,
  or explicit relation edges. Therefore search/get/expand relationChains cannot
  become healthy until real entries carry persisted relation metadata or a real
  producer supplies explicit relation evidence.
- Default Codex-facing `alembic_knowledge_lifecycle` does not publish entries;
  the current agent surface says publish/deprecate/approve belong to Dashboard
  or an explicit admin path.
- Alembic main HTTP has existing knowledge create/update/publish and
  batch-publish routes, but those are admin/dashboard routes and must not be
  silently treated as default host-agent authority.

## Route Decision

Design recommends a connected route, not a new fact-owning abstraction:

1. Use the existing host-agent rescan/gap-fill model as the creation route.
2. Repair or extend it so controller-authorized ASQ gaps can open a
   non-destructive produce session even when the normal dimension planner would
   otherwise return verify-only.
3. Keep `alembic_submit_knowledge` as the submission surface and keep the
   existing evidence gate strict.
4. Add relation passthrough and post-create relation resolution inside the
   existing production path so persisted entries can carry UUID-backed
   `relations` and sync to `knowledge_edges`.
5. Use an explicit admin/controller publication step to move reviewed ASQ
   entries into a searchable lifecycle. Do not rely on pending entries
   accidentally appearing in search fallback.
6. Validate only through real `alembic_search search/get/expand` results and
   relationChains in a fresh temporary MCP window after implementation.

This route preserves the mature production pipeline and avoids a middle layer.
The new behavior is a bounded mode of the existing production workflow: a
controller-authorized gap-fill publication session for known missing project
knowledge.

## Option Comparison

### Option 1: Non-Destructive Host-Agent Gap-Fill Publication Route

- Summary: extend the existing rescan-host-agent flow so an explicit ASQ
  gap-fill request can return a usable session id and produce budget for known
  missing topics, without destructive bootstrap rebuild.
- User-visible behavior: ASQ-specific entries can be submitted with exact
  source evidence, then become searchable and expandable after explicit
  publication.
- Repositories/windows: AlembicCore producer model, Alembic main resident/job
  route, AlembicPlugin MCP consumption, AlembicWorkspace content ownership, Test
  validation.
- Interfaces/contracts: `alembic_rescan` or its resident job response must carry
  a session id and produce gaps when controller-authorized; `alembic_submit_knowledge`
  remains the write entrypoint.
- Data or state ownership: `KnowledgeEntry`, `relations`, `knowledge_edges`,
  source files, and lifecycle remain Core/Alembic knowledge ownership.
- Validation path: submit ASQ entries through the session; publish them through
  explicit admin/controller route; prove keyword/auto/semantic search,
  get/expand, sources, detailRefs, and relationChains.
- Risks: relation targets need created UUIDs; publish authority must not be
  smuggled into the default agent tier.
- Reversibility: high. It extends the intended production path and can be
  disabled for non-controller-authorized gaps.
- Fit: recommended primary route.

### Option 2: Admin/Dashboard Manual Publication

- Summary: create and publish entries through existing Alembic main
  `/api/v1/knowledge` and publish/batch-publish admin routes.
- User-visible behavior: human/admin can publish missing entries without
  bootstrap rebuild.
- Repositories/windows: Alembic main and Dashboard/admin operator; Plugin only
  validates after publication.
- Interfaces/contracts: existing HTTP admin routes.
- Data or state ownership: correct once entries go through `KnowledgeService`.
- Validation path: after admin publication, search/get/expand probes must pass.
- Risks: not suitable as the unattended ASQ mainline because host agent default
  authority cannot publish; manual UI use is slower and harder to replay.
- Reversibility: high.
- Fit: valid fallback or one-off recovery path, not the primary automated route.

### Option 3: Controller-Owned Direct Submission

- Summary: let AlembicWorkspace controller directly create the ASQ/GPC/Wakeflow
  entries.
- User-visible behavior: controller-owned facts are created where they originate.
- Repositories/windows: AlembicWorkspace owns content; Core/Alembic still own
  persistence and lifecycle.
- Interfaces/contracts: current controller has no safe direct DB write authority
  and no default publish surface.
- Data or state ownership: risky if it bypasses KnowledgeService, session
  evidence, or publish lifecycle.
- Validation path: would still require search/get/expand after publication.
- Risks: blurs controller state with product knowledge persistence and can
  bypass evidence gates.
- Reversibility: medium.
- Fit: content ownership is valid, direct persistence is not. Controller should
  author/approve content packages that are published through the production
  route.

### Option 4: New Bounded MCP Publication Contract

- Summary: add a narrow tool only if the existing rescan/session route cannot
  expose controller-authorized gap-fill production safely.
- User-visible behavior: an agent can publish source-backed project knowledge
  through one bounded operation.
- Repositories/windows: AlembicCore/Alembic define the contract; Plugin exposes
  it only if it remains a thin transport over the same gateway; controller
  decides use.
- Interfaces/contracts: must reuse `RecipeProductionGateway`,
  `KnowledgeService`, evidence gate, lifecycle transitions, and relation
  sync. It must not create a second knowledge store or middle abstraction.
- Data or state ownership: Core/Alembic.
- Validation path: same final ASQ probes as Option 1.
- Risks: easy to overbuild or accidentally weaken evidence/lifecycle gates.
- Reversibility: medium.
- Fit: fallback only after Option 1 is proven insufficient.

### Option 5: Destructive Bootstrap Rebuild

- Summary: rebuild the whole knowledge base so ASQ entries can be included.
- User-visible behavior: would risk replacing a ready `140` entry knowledge DB
  for a narrow ASQ gap.
- Repositories/windows: broad and high risk.
- Interfaces/contracts: existing bootstrap already refuses this without
  explicit rebuild confirmation.
- Data or state ownership: destructive.
- Validation path: too broad for this blocker.
- Risks: data loss, unrelated behavior changes, false progress.
- Reversibility: low.
- Fit: rejected.

## Publication Contract Details

The recommended route needs these exact semantics.

### Gap-Fill Session

- The producer route must be non-destructive.
- It must be explicitly tied to a project root and controller-authorized gap
  list.
- It must return a usable session id, dimensions or gap ids, create budgets,
  and occupied trigger/source constraints.
- The session must bind submissions to the same project root.
- A verify-only rescan is not enough for ASQ4B. If the planner says no produce
  gaps but the controller has an accepted ASQ blocker, the response must either
  open the requested bounded produce gaps or return an explicit
  `no-produce-session` blocker.

### Source Evidence

- `sourceRefs` must be repo-relative and line-bounded, such as
  `AlembicPlugin/lib/runtime/mcp/handlers/search.ts:420-439`.
- `coreCode`, `content.pattern`, or fenced code blocks must match one of the
  cited ranges exactly enough to pass the existing snippet gate.
- Governance evidence may cite state-root/controller evidence documents when
  those documents are the source of a decision, but code behavior claims still
  require code source refs.
- Relationship claims must cite fresh `sourceGraphRefs` or `graphRefs`, or the
  relation claim must be removed.

### Relation Metadata

- `RecipeProductionGateway.#prepareCreateData()` must pass accepted
  `relations`, `moduleName`, and relevant metadata through to
  `KnowledgeService.create()`.
- Intra-batch relations need deterministic target resolution. Recommended
  implementation: allow submitted items to carry stable local relation keys,
  create all entries, map local keys to created UUIDs, then update `relations`
  with UUID targets and run the existing relation sync.
- Cross-entry relations to existing entries must use real UUIDs or stable
  `knowledge:<uuid>` refs that are normalized before persistence.
- Relations that only cite source graph evidence but no target knowledge entry
  can be preserved as diagnostic/source evidence, but they cannot count as
  `knowledge_edges` relationChain success until a UUID target exists.

### Lifecycle And Searchability

- Creation alone is not ASQ4B success.
- The route must expose or use an explicit reviewed publication step:
  Dashboard/admin publish, existing HTTP publish/batch-publish, or a bounded
  controller-authorized publication wrapper over `KnowledgeService.publish()`.
- The final searchable state must be explicit. ASQ acceptance should prefer
  active entries. If staging is allowed, the evidence must prove that
  `alembic_search` intentionally consumes staging entries and that this is not
  an accidental fallback.
- Search freshness/vector refresh must be triggered or observed after
  publication.

### DetailRefs And Get/Expand

- Each published entry must have a stable `knowledge:<uuid>` detail ref.
- `alembic_search search` must return `detailRefId` for the entry.
- `alembic_search get` and `expand` must retrieve bounded useful content from
  the returned stable ref and any generated operation ref.
- Search output must not require legacy full-body browsing to understand the
  entry.

## Required Knowledge Pack

The first successful publication route should cover these entries:

| Entry | Owner content source | Minimum relation targets |
| --- | --- | --- |
| ASQ output quality acceptance decision | AlembicWorkspace ASQ demand, ASQ0/ASQ3/ASQ4 reviews | requires search contract, relation evidence, vector truth |
| `alembic_search` public contract rule | AlembicPlugin schema/handler and ASQ4A review | required_by ASQ acceptance |
| Plugin search implementation chain fact | AlembicPlugin search handler/candidate/detail/relation providers | implements search contract |
| `ProjectGraphProvider` ProjectContext request-selection fact | AlembicPlugin `ProjectGraphProvider` plus graph neighborhood evidence | relates_to GPC graph quality and ProjectContext |
| GPC ProjectContext graph output-quality fact | GPC intake and accepted PCI/GPC evidence | relates_to ProjectGraphProvider and ASQ quality |
| Wakeflow direct-thread governance rule | Workspace AGENTS and Wakeflow target skill | guards ASQ fresh validation return |
| Resident vector lifecycle fact | Alembic main route and AlembicCore vector service/adapter evidence | required_by ASQ acceptance |

## Follow-Up Packages

### ASQ4B1-A: Producer Route And Relation Persistence

- Suggested owner windows: AlembicCore primary; Alembic for resident/job/admin
  route; AlembicPlugin for MCP exposure only if needed.
- Depends on: ASQ4B blocker discovery and this Design solution.
- Scope:
  - make the non-destructive rescan/gap-fill route return a usable produce
    session for controller-authorized ASQ gaps;
  - preserve strict session/source/snippet/graph evidence gates;
  - pass `relations` through the production gateway;
  - resolve intra-batch relation targets to real UUIDs after creation;
  - sync relations to `knowledge_edges`;
  - expose or document the explicit publish step that moves reviewed entries to
    a searchable lifecycle.
- Acceptance:
  - no destructive bootstrap rebuild is required;
  - a real AlembicWorkspace invocation returns a session id usable by
    `alembic_submit_knowledge`;
  - a source-backed batch can create entries with exact sourceRefs/snippets;
  - relation metadata persists on `KnowledgeEntry` and appears in
    `knowledge_edges` for UUID targets;
  - created entries can be published through an explicit authorized route;
  - unit/integration tests cover no-session rejection, source mismatch
    rejection, relation passthrough, relation UUID resolution, and publish
    lifecycle.
- Non-goals:
  - no fake DB writes;
  - no direct controller DB mutation;
  - no broad Recipe redesign;
  - no weakening of evidence gates.
- Stop conditions:
  - publish authority cannot be safely automated and requires user/admin
    confirmation;
  - relation targets cannot be resolved without changing the knowledge model
    contract.

### ASQ4B1-B: Controller Governance Knowledge Pack

- Suggested owner window: AlembicWorkspace controller, with Design as source
  evidence when needed.
- Depends on: ASQ4B1-A produce and publish route.
- Scope:
  - author ASQ/GPC/Wakeflow governance entries from existing state-root,
    Design, and AGENTS evidence;
  - submit them through the approved route;
  - publish only after controller review of the exact sourceRefs and snippets.
- Acceptance:
  - `ASQ output quality`, `GPC ProjectContext graph output quality`, and
    `Wakeflow direct-thread thread ids` keyword/auto searches return relevant
    top entries;
  - get/expand on returned refs produce bounded useful content;
  - relationChains connect ASQ acceptance to search contract/vector/relation
    and Wakeflow validation governance where entries exist.
- Non-goals:
  - no product code claims without product code source refs;
  - no Wakeflow thread ids in tracked docs or knowledge entries.
- Stop conditions:
  - controller evidence is insufficient for a claimed decision or rule;
  - a topic belongs outside project knowledge.

### ASQ4B1-C: Plugin Search Knowledge Submission And Probes

- Suggested owner window: AlembicPlugin.
- Depends on: ASQ4B1-A; can use ASQ4B prepared source anchors.
- Scope:
  - submit and publish Plugin-owned entries for the public search contract,
    search handler/candidate/detail/relation chain, resident client handoff,
    and ProjectGraphProvider request selection;
  - include fresh graph refs where relation claims are made;
  - rerun ASQ4B keyword/get/expand probes.
- Acceptance:
  - `alembic_search` and `ProjectGraphProvider` keyword searches return
    relevant trusted top entries;
  - returned refs get/expand correctly;
  - relation metadata is visible or a precise relation-production diagnostic
    names the missing producer condition.
- Non-goals:
  - no sibling Alembic/AlembicCore source edits unless dispatched separately;
  - no search-ranking tuning beyond proving the content exists.
- Stop conditions:
  - Core route still rejects session/source/relation evidence;
  - graph refs are stale or partial.

### ASQ4B1-D: Resident Vector Knowledge Pack

- Suggested owner windows: Alembic and AlembicCore.
- Depends on: ASQ4B1-A for publication route; can coordinate with ASQ4C vector
  truth implementation.
- Scope:
  - publish source-backed facts for resident `/api/v1/search`, vector stats,
    embed/fullBuild/validate, count/dimension/indexSize meaning, and HNSW
    flush semantics;
  - connect the vector fact to ASQ acceptance and Plugin vector diagnostics.
- Acceptance:
  - `kind=fact` ProjectContext/resident vector status search returns the vector
    lifecycle fact or an honest unavailable diagnostic, never unrelated
    vendored-core facts;
  - get/expand returns bounded content with source refs.
- Non-goals:
  - no semantic provider credential setup;
  - no Plugin-local vector substitute.
- Stop conditions:
  - vector behavior is still under ASQ4C diagnosis and the fact would be
    speculative.

### ASQ4B1-E: Final Knowledge Publication Validation

- Suggested owner window: Test, in a fresh temporary Codex/Test window only
  after local plugin refresh.
- Depends on: ASQ4B1-B through ASQ4B1-D and any ASQ4C/ASQ4D/ASQ4E code
  repairs required by controller.
- Scope:
  - run real AlembicWorkspace MCP probes for search/get/expand and relation
    metadata;
  - preserve raw excerpts of item order, detailRefs, sources, relationChains,
    diagnostics, and vector state.
- Acceptance:
  - each required positive topic returns relevant top content;
  - every returned ASQ4B entry has stable get/expand detail refs;
  - relation-backed entries show relationChains;
  - retired `bm25/context` modes remain negative checks only;
  - no unrelated trusted item appears for activeFile/module or kind/fact
    probes.
- Non-goals:
  - no product code edits from Test;
  - no reuse of previous validation windows.
- Stop conditions:
  - plugin refresh fails;
  - publication route did not actually create/publish entries;
  - validation finds a new chain gap that belongs back in ASQ state root.

## Acceptance Probes

After publication and refresh, final probes should include:

- `alembic_mcp_status` shows the real AlembicWorkspace project, knowledge
  ready, updated entry count, and useful vector/resident diagnostics.
- `alembic_search search mode=keyword query="alembic_search ProjectGraphProvider"`
  returns Plugin search and ProjectGraphProvider entries in top results.
- `alembic_search search mode=auto query="ASQ GPC graph search output quality whyMatched scoreBreakdown detailRefs relationChains diagnostics"`
  returns ASQ/GPC quality entries.
- `alembic_search search mode=keyword query="Wakeflow direct-thread thread ids runtime-only"`
  returns the Wakeflow governance rule.
- `alembic_search search mode=semantic query="why alembic_search must return useful semantic Recipe content rather than schema-valid summaries"`
  returns relevant content when semantic vectors are available, or an honest
  unavailable diagnostic when they are not.
- `alembic_search search kind=fact query="ProjectContext resident vector status indexSize count dimension semantic readiness"`
  returns the resident vector lifecycle fact or zero trusted results with a
  precise diagnostic.
- `alembic_search get` and `expand` on returned stable refs and generated
  operation refs return bounded useful content.
- Relation-backed entries show relationChains; entries without relations say
  which relation source is missing.

## Controller Intake Notes

Design recommends controller create ASQ4B1-A first. ASQ4B1-B, ASQ4B1-C, and
ASQ4B1-D should not be dispatched as completion work until ASQ4B1-A proves a
usable production and publication route, unless controller intentionally creates
fixture-backed implementation tasks that cannot be used as final ASQ evidence.

ASQ4C vector truth, ASQ4D relationChain projection, and ASQ4E trust gates remain
valid ASQ work, but they should not be treated as final-positive validation
while the real knowledge DB still lacks the required ASQ/search/GPC/vector
entries.

## Source References

- `.wakeflow-active/current/alembic-search-output-quality-optimization/task-packages/alembic-search-output-quality-asq4b1-design-knowledge-publication-route-solution-p8.json`
- `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/asq4b-plugin-knowledge-coverage-rescan-t1-2026-06-16.md`
- `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq4b-plugin-knowledge-coverage-rescan-review-2026-06-16.md`
- `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq4a-plugin-contract-probe-convergence-review-2026-06-16.md`
- `Design/docs/current/alembic-search-output-quality-asq4-full-chain-solution-2026-06-16.md`
- `AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts`
- `AlembicPlugin/lib/runtime/mcp/tools.ts`
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/recipe-evidence-gate.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/retrieval/RecipeRelationChainProvider.ts`
- `AlembicCore/src/service/knowledge/RecipeProductionGateway.ts`
- `AlembicCore/src/service/knowledge/KnowledgeService.ts`
- `AlembicCore/src/domain/knowledge/KnowledgeEntry.ts`
- `AlembicCore/src/workflows/knowledge-rescan/KnowledgeRescanPresenters.ts`
- `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingSupport.ts`
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
- `Alembic/lib/http/routes/knowledge.ts`
