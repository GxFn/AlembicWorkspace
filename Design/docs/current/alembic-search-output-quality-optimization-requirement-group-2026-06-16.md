# Alembic Search Output Quality Optimization Requirement Group

Date: 2026-06-16

Status: controller-restarted requirement group; ready for Wakeflow task
package generation, with delivery gated by Wakeflow closed-loop / thread
registration readiness.

Responsible window: AlembicWorkspace controller

Design Key: `alembic-search-output-quality-optimization-2026-06-15`

Demand Key: `alembic-search-output-quality-optimization-2026-06-16`

Source requirement design:
`Design/docs/current/alembic-search-output-quality-optimization-requirement-design-2026-06-15.md`

Active state root:
`.wakeflow-active/current/alembic-search-output-quality-optimization`

## Purpose

Restart ASQ automation from the corrected requirement, not from the old
relation-chain route. This document is the controller-ready requirement group
for the next Wakeflow packages. It replaces the earlier ASQ0-ASQ5 handoff split
that only had ASQ0 / ASQ0A / ASQ0B as front set.

The old pending package
`alembic-search-output-quality-asq-s1-public-search-contract-reconciliation-p16`
is superseded for dispatch purposes. Do not send it directly. New packages must
use this group, the original requirement, the ASQ-EC0 correction, the real
implementation landing plan, and the search/prime isolation supplement.

## Authority And Required Read Order

Every ASQ implementation, validation, or controller review package must read:

1. `AGENTS.md`
2. `.wakeflow-active/index.md`
3. `.wakeflow-active/current/workspace-current-status.md`
4. `Design/docs/current/alembic-search-output-quality-optimization-requirement-design-2026-06-15.md`
5. `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq-scope-reset-precision-match-plan-2026-06-16.md`
6. `.wakeflow-active/current/alembic-search-output-quality-optimization/developer-progress.md`
7. `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq-real-implementation-landing-plan-2026-06-16.md`
8. `.wakeflow-active/current/alembic-search-output-quality-optimization/evidence/controller-asq-search-prime-capability-isolation-supplement-2026-06-16.md`
9. this requirement group
10. target repository `AGENTS.md`

The original ASQ requirement remains the authority. The correction and landing
documents only remove invalid relation-chain drift and turn the current code
facts into executable packages.

## Corrected Product Target

- `alembic_search` is a direct Recipe / knowledge search capability.
- `alembic_prime` owns Recipe relation-chain evidence, Trust Receipt material,
  and prime context assembly.
- `alembic_search` must not import, instantiate, project, or score by prime-only
  relation/context material.
- Public positive search modes are exactly `auto`, `keyword`, and `semantic`.
- `bm25` / `BM25` and `context` are retired names, not compatibility modes.
- The Plugin keyword/filter lane is always the Plugin-owned baseline lane.
- Resident semantic/vector search is an optional second lane when Alembic main
  is present and advertises capability.
- Candidate admission is threshold / filter based. No hidden host intent,
  active file, module, source ref, relation proximity, or caller-context boost
  can admit or rank candidates.
- `search` returns summary candidates, stable ids/detail refs, direct match
  evidence, lane diagnostics, and next actions. Full content is retrieved by
  exact `get` / `expand`.

## Global Non-Goals

- Do not reintroduce Recipe relation chains to `alembic_search`.
- Do not use ProjectContext graph/source facts as search answer material.
- Do not preserve deleted modes through compatibility aliases.
- Do not create a new public abstraction layer above the existing clean MCP
  output contract.
- Do not delete still-owned host-plugin compatibility without consumer proof,
  owner, removal condition, and validation.
- Do not dispatch Test before product windows self-validate and the local
  plugin surface is refreshed.

## Dependency Route

```text
ASQ-R0 controller restart and supersede old p16
  -> ASQ-R1 front evidence, migration-leftover inventory, route/mode matrix, BM25 scan
      -> ASQ-R2 Plugin search/prime isolation and retired-name deletion
          -> ASQ-R3 Plugin direct search precision contract
              -> ASQ-R4 resident semantic/vector truth, if evidence requires Alembic/AlembicCore work
                  -> ASQ-R5 direct searchable content coverage without relations, if evidence requires content work
                      -> ASQ-R6 detail/get/expand, budget, diagnostics, and installed surface stability
                          -> ASQ-R7 fresh MCP validation
                              -> ASQ-R8 controller acceptance and cleanup closeout
```

Only ASQ-R1 is immediately eligible for product-window dispatch after this
restart. ASQ-R2 and later must wait for ASQ-R1 evidence unless the controller
already has equivalent raw evidence and records that equivalence.

## Requirement Summary

| Requirement | Title | Owner | Dependencies | Completion signal |
| --- | --- | --- | --- | --- |
| ASQ-R0 | Controller restart and old-package supersession | AlembicWorkspace | Original ASQ + correction docs | New group installed; old p16 marked non-dispatchable in progress/status; Wakeflow readiness checked. |
| ASQ-R1 | Front evidence, leftover inventory, route/mode matrix, and BM25 scan | AlembicPlugin read-only | ASQ-R0 | Current code classified; route/mode matrix and before-scan evidence recorded; first implementation blockers named. |
| ASQ-R2 | Search/prime capability isolation and retired-name deletion | AlembicPlugin | ASQ-R1 | Public search no longer imports/projects prime relation/context material; Plugin active `bm25` / `BM25` leaks removed or owner-routed. |
| ASQ-R3 | Direct search precision contract | AlembicPlugin | ASQ-R2 | Exact/keyword/filter/semantic threshold admission, two-lane merge, summary projection, and zero-match diagnostics implemented. |
| ASQ-R4 | Resident semantic/vector truth | AlembicPlugin + Alembic/AlembicCore by evidence | ASQ-R1, ASQ-R3 | Resident semantic capability, vector truth, timeout/mismatch/sparse-only diagnostics, and filter propagation proven. |
| ASQ-R5 | Direct searchable content coverage without relations | AlembicWorkspace + owning repos as needed | ASQ-R3, ASQ-R4 evidence | Missing direct source-backed entries are published/searchable/gettable/expandable without relation metadata. |
| ASQ-R6 | Detail refs, budget, diagnostics, and installed surface stability | AlembicPlugin | ASQ-R2, ASQ-R3, ASQ-R4 as needed | `search/get/expand` refs, clean output schemas, budget truncation, unsupported/no-match diagnostics stable after build/reload. |
| ASQ-R7 | Fresh MCP validation | Test temporary window | ASQ-R6 + local plugin refresh | Fresh/reloaded Codex MCP surface proves corrected behavior on AlembicWorkspace. |
| ASQ-R8 | Controller acceptance and cleanup closeout | AlembicWorkspace | ASQ-R7 | Controller reviews raw evidence, rolls TODOs, accepts/reworks/completes demand. |

## ASQ-R0: Controller Restart And Old-Package Supersession

- Requirement Key: `alembic-search-output-quality-asq-r0-controller-restart-2026-06-16`
- Type: controller planning / state hygiene
- Owner: AlembicWorkspace

### Scope

- Replace the stale ASQ0-ASQ5 grouping with this ASQ-R0..ASQ-R8 group.
- Mark `alembic-search-output-quality-asq-s1-public-search-contract-reconciliation-p16`
  as superseded for dispatch purposes in human progress/status documents.
- Keep ASQ-EC0 correction accepted as the authority that rejects the old p14
  relation route.
- Check Wakeflow closed-loop / thread-readiness before sending any delivery.

### Acceptance

- Requirement group, developer progress, and current status all point to the
  same ASQ-R route.
- The next eligible target package is ASQ-R1, not old p16.
- Any Wakeflow delivery blocker is recorded honestly before dispatch.

## ASQ-R1: Front Evidence, Leftover Inventory, Route Matrix, And BM25 Scan

- Requirement Key: `alembic-search-output-quality-asq-r1-front-evidence-inventory-2026-06-16`
- Type: read-only product evidence
- Owner: AlembicPlugin
- Dependencies: ASQ-R0

### Scope

- Read live AlembicPlugin diff before touching code.
- Inventory public tool tombstones, source-graph remnants, panorama remnants,
  `/api/v1/search*` subroutes, deprecated `residentServiceClient`, Plugin-local
  Core search/vector tests, and docs/tests that keep retired behavior alive.
- Build route/mode matrix for `auto`, `keyword`, `semantic`, `get`, and
  `expand`.
- Run before-scan for `bm25`, `BM25`, and removed-mode aliases across active
  AlembicPlugin files, and name which cross-repo matches need Alembic or
  AlembicCore ownership.
- Confirm whether existing controller code-fact evidence is sufficient to skip
  any duplicate scan; if so, cite the exact evidence file and line.

### Non-Goals

- No product code changes.
- No Test dispatch.
- No assumption that public tool-surface removal equals code deletion.

### Acceptance

- Every candidate is classified as `owned-current`, `compatibility-tombstone`,
  `delete-candidate`, or `needs-decision`.
- Every retained tombstone names consumer, owner, reason, removal condition, and
  validation.
- Every delete candidate has import/route/tool-surface scan evidence.
- The package returns a concrete ASQ-R2 implementation checklist.

## ASQ-R2: Search/Prime Capability Isolation And Retired-Name Deletion

- Requirement Key: `alembic-search-output-quality-asq-r2-search-prime-isolation-retired-name-deletion-2026-06-16`
- Type: implementation
- Owner: AlembicPlugin first; Alembic / AlembicCore follow only for owned
  cross-repo matches
- Dependencies: ASQ-R1

### Scope

- Remove public `alembic_search` relation-chain import/use/output/freshness
  behavior from `search`, `get`, and `expand`.
- Remove public search admission/ranking/output dependence on
  `intentEvidence`, `primeInjectionPackage`, host intent, session history,
  active file, active module, source refs, caller context, Decision Register
  enrichment, and relation refs.
- Keep prime-owned relation-chain / Trust Receipt / prime context behavior
  working through `alembic_prime`.
- Remove or neutral-rename active Plugin `bm25` / `BM25` leaks. Cross-repo
  `bm25` / `BM25` occurrences must be owner-routed unless this package has
  explicit authority to edit them.
- Add import-boundary tests proving public search cannot import relation-chain
  or prime-context providers.

### Acceptance

- Public `alembic_search` tool description no longer advertises host intent,
  active file/module, or relation chains.
- Search output has no relation-chain payload, relation health,
  `recipeRelationCount`, prime package material, or Trust Receipt fields.
- Host/context fields cannot affect candidate admission, ranking, `whyMatched`,
  or success diagnostics.
- Plugin active source/tests/docs emit no `bm25` / `BM25` retired naming except
  in historical archived evidence or ASQ requirement text.
- Prime behavior has regression tests proving ASQ did not break
  `alembic_prime`.

## ASQ-R3: Direct Search Precision Contract

- Requirement Key: `alembic-search-output-quality-asq-r3-direct-search-precision-contract-2026-06-16`
- Type: implementation
- Owner: AlembicPlugin
- Dependencies: ASQ-R2

### Scope

- Implement direct candidate admission by exact id/ref/title/trigger, explicit
  query/keywords, explicit metadata filters, resident semantic threshold, or
  prior bounded detail refs.
- Add Recipe metadata filters required by the original design:
  `dimensionId`, `knowledgeType`, `scope`, `tags`, plus existing `kind`,
  `category`, and `language`.
- Implement AND across fields and OR within multi-value fields where supported.
- Preserve Plugin keyword/filter lane in `auto` even when resident semantic
  lane returns items.
- De-duplicate keyword and semantic lanes by stable Recipe / knowledge id.
- Report `matchedCount`, `returnedCount`, `omittedCount`,
  `belowThresholdCount`, thresholds, normalized filters, and lane evidence.

### Acceptance

- Filter-only queries return hard-filter matches within budget/pagination.
- Low-information unfiltered queries return zero matches plus refine guidance.
- Concrete ASQ/search/MCP handler queries return relevant summaries.
- No final fusion/rerank hides above-threshold direct matches.

## ASQ-R4: Resident Semantic And Vector Truth

- Requirement Key: `alembic-search-output-quality-asq-r4-resident-semantic-vector-truth-2026-06-16`
- Type: conditional implementation / integration
- Owners: AlembicPlugin, Alembic, AlembicCore according to ASQ-R1/R3 evidence
- Dependencies: ASQ-R1 and ASQ-R3

### Scope

- Prove resident semantic capability and actual vector/sparse fallback truth.
- Distinguish available, unavailable, timeout, project mismatch, sparse-only,
  and degraded states.
- Propagate normalized filter fields only where they are semantic-lane inputs.
- Remove or ignore resident intent/Decision Register/prime metadata for public
  `alembic_search`.
- Keep Alembic main free of duplicate keyword-route obligation.

### Acceptance

- `semantic` is resident-only and never reports Plugin-local semantic success.
- `auto` combines Plugin keyword/filter lane with resident semantic lane when
  available.
- Resident unavailable paths remain clean and actionable.
- Cross-repo changes are proven in the owning repository with focused tests.

## ASQ-R5: Direct Searchable Content Coverage Without Relations

- Requirement Key: `alembic-search-output-quality-asq-r5-direct-content-coverage-2026-06-16`
- Type: content / publication repair when evidence requires it
- Owners: AlembicWorkspace controller plus owning product repos by source
- Dependencies: ASQ-R3 and ASQ-R4 evidence

### Scope

- Add or repair direct source-backed searchable entries only when ASQ probes
  show missing direct content after search implementation fixes.
- Prove entries are published, searchable, gettable, and expandable.
- Do not add relation metadata, relation edges, or relation-chain acceptance for
  ASQ.

### Acceptance

- Direct ASQ/search/Wakeflow/AlembicPlugin knowledge queries retrieve useful
  bounded summaries and exact detail content.
- Created entries are visible to real `alembic_search` and not merely pending or
  schema-valid.

## ASQ-R6: Detail Refs, Budget, Diagnostics, And Installed Surface Stability

- Requirement Key: `alembic-search-output-quality-asq-r6-detail-diagnostics-installed-stability-2026-06-16`
- Type: implementation hardening / self-validation
- Owner: AlembicPlugin
- Dependencies: ASQ-R2, ASQ-R3, and ASQ-R4 where applicable

### Scope

- Stabilize `search` returned detail refs and exact `get` / `expand`.
- Keep search summary-only; no full Recipe body in `search`.
- Verify clean MCP output schemas for success, degraded, no-match, and failure.
- Verify unsupported removed modes are rejected or diagnosed as unsupported.
- Build/reload local Plugin surface before fresh validation.

### Acceptance

- Focused unit/integration tests pass for search/get/expand refs, budgets,
  diagnostics, removed modes, no relation-chain output, and no host-context
  admission.
- Local post-build probes match the source behavior.

## ASQ-R7: Fresh MCP Validation

- Requirement Key: `alembic-search-output-quality-asq-r7-fresh-mcp-validation-2026-06-16`
- Type: validation
- Owner: Test temporary window
- Dependencies: ASQ-R6 and local plugin refresh

### Scope

- Use a fresh temporary Codex/Test window with newly loaded MCP tools.
- Validate real AlembicWorkspace `alembic_search search/get/expand`.
- Probe concrete ASQ/search/MCP handler queries, metadata-filter-only queries,
  low-information no-match behavior, `auto` / `keyword` / `semantic`, resident
  available/unavailable diagnostics, removed-mode rejection, and exact
  get/expand.
- Confirm no relation-chain or prime-context payload appears in search output.

### Acceptance

- Raw outputs prove the corrected completion definition.
- Any failure is classified with owner recommendation, not flattened into
  success.

## ASQ-R8: Controller Acceptance And Cleanup Closeout

- Requirement Key: `alembic-search-output-quality-asq-r8-controller-acceptance-closeout-2026-06-16`
- Type: controller review / acceptance
- Owner: AlembicWorkspace
- Dependencies: ASQ-R7

### Scope

- Review original requirement authority, all target evidence, raw test/probe
  outputs, diffs, commits if any, and TODO implications.
- Close solved TODOs, keep valid remaining blockers, and reject invalid
  relation-chain follow-ups.
- Decide `complete-demand`, `request-rework`, `mark-blocked`, or
  `needs-user-decision`.

### Acceptance

- Controller acceptance explicitly covers user goal, scope, evidence,
  implementation reality, validation, blockers, residual risks, TODO rollup,
  and next action.

## Immediate Controller Action

1. Add a new Wakeflow task package for ASQ-R1.
2. Prepare direct-thread delivery only for the new ASQ-R1 package.
3. If Wakeflow closed-loop status or thread registration is not ready, stop and
   report the delivery blocker instead of sending an unrecordable prompt.
4. Do not dispatch old p16.

## Standard Target Prompt Shape

```text
Continue current controller task: ASQ-R1 front evidence and cleanup inventory.

Variables:
- currentWindow: AlembicPlugin
- taskId: asq-r1-front-evidence-inventory-t1
- stateRoot: .wakeflow-active/current/alembic-search-output-quality-optimization
- dispatchGroup: alembic-search-output-quality-asq-r1-front-evidence-inventory-p17
- skill: skills/wakeflow-target/SKILL.md
```

The task package and state root carry the detailed scope. The visible prompt
must stay compact.
