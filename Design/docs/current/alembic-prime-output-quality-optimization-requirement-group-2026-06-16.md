# Alembic Prime Output Quality Optimization Requirement Group

Date: 2026-06-16

Status: Design requirement group candidate; ready for Wakeflow controller
intake; not a dispatch packet.

Responsible window: Design

Receiving window: AlembicWorkspace controller

Design Key: `alembic-prime-output-quality-optimization-2026-06-16`

Demand Key: `alembic-prime-output-quality-optimization-2026-06-16`

Source requirement design:
`Design/docs/current/alembic-prime-output-quality-optimization-requirement-design-2026-06-16.md`

Active state root: none yet. The controller should create a state root only
after intake and scheduling judgment.

## Purpose

Prepare `alembic_prime` as an independent code-development-only Recipe priming
capability. It should return compact design-pattern and architecture-convention
Recipe guidance for a direct coding requirement, not general knowledge search,
not project graph information, and not an `alembic_intent` continuation.

This requirement group turns the confirmed Design requirement into APQ0-APQ6
candidate phases for controller review. Phases are not task packages until the
controller accepts the demand, creates state, and dispatches them.

## Confirmed User Decisions

- `alembic_prime` is independent. Remove the mandatory relationship with
  `alembic_intent`.
- `alembic_intent` is temporarily closed for this route.
- Old `intentRef`, `recognizedIntent`, `HostIntentFrame`, intent persistence,
  and intent evidence paths are disconnected and deleted, not preserved as
  compatibility.
- Prime minimum valid input is `taskAction + requirementGoal + at least one
  locator facet`: capability, scenario, domain objects, integration boundary,
  or quality concerns.
- Recipe source files and Recipe schema are not changed in this demand.
- Semantic region chunks are derived from existing Recipe rows and saved as
  generated vector items in the existing Core `VectorStore`.
- Alembic main / resident semantic capability is the stronger route. When it is
  unavailable, Plugin reports degraded behavior and does not fabricate strong
  semantic matching.
- Region chunk generation runs through rebuild / refresh / knowledge sync
  flows, not during ordinary prime queries.
- Trusted-to-use output requires both a direct prime requirement frame and
  Recipe locator / semantic-region evidence.
- Whole-entry vectors, active files, source refs, and code snippets cannot
  independently admit trusted prime material.
- APQ0-APQ6 order is confirmed.

## Required Read Order

Every controller review, implementation, validation, or Test package should
read:

1. `AGENTS.md`
2. `.wakeflow-active/index.md`
3. `.wakeflow-active/current/workspace-current-status.md`
4. `Design/docs/current/alembic-prime-output-quality-optimization-requirement-design-2026-06-16.md`
5. this requirement group
6. target repository `AGENTS.md`

The source requirement design is the authority. This group only packages the
confirmed route for controller intake.

## Product Target

- `alembic_prime` is a standalone MCP capability for code development tasks.
- The host calls `alembic_prime` directly with a high-quality requirement /
  feature frame.
- Prime owns direct input normalization, code-development gating, requirement
  facet extraction, Recipe retrieval, trust gating, and output projection.
- Prime retrieves design patterns and architecture conventions, not source code
  slices, project maps, or general Recipe discovery.
- Prime uses exact field / keyword anchors plus generated semantic-region
  vector chunks.
- Prime output is compact: Recipe id, title, trigger, score, matched region
  classes, useful slices, trust layer, and refs.
- Full Recipe content stays behind detail refs.

## Global Non-Goals

- Do not keep `alembic_intent` as a producer for prime.
- Do not keep old intent fields as compatibility.
- Do not change Recipe source files, Recipe frontmatter, or Recipe schema.
- Do not generate or save semantic chunks during ordinary prime queries.
- Do not make Plugin pretend resident semantic-region matching ran when
  resident capability is unavailable.
- Do not broaden prime into `alembic_search`, `alembic_graph`, ProjectContext,
  source graph, sourceSlice, fileSymbols, fileFlow, or impact-radius behavior.
- Do not dispatch Test before product windows self-validate and the local MCP
  surface is refreshed.

## Dependency Route

```text
APQ0 prime input baseline and intent-coupling deletion inventory
  -> APQ1 standalone prime code-development gate
      -> APQ2 Recipe locator and semantic-region readiness audit
          -> APQ3 semantic-region chunk builder and persisted index
              -> APQ4 resident requirement-to-Recipe region retrieval
                  -> APQ5 Plugin prime output gating and lean projection
                      -> APQ6 end-to-end host-agent SQ proof
```

Only APQ0 should be immediately eligible after controller intake. Later phases
should wait for upstream evidence unless the controller has equivalent raw
evidence and records that equivalence.

## Requirement Summary

| Requirement | Title | Suggested Owner | Dependencies | Completion Signal |
| --- | --- | --- | --- | --- |
| APQ0 | Prime input baseline and intent-coupling deletion inventory | AlembicPlugin read-only | Controller intake | Real prime inputs, old intent coupling points, deletion targets, and baseline outputs recorded. |
| APQ1 | Standalone prime code-development gate | AlembicPlugin | APQ0 | Prime skips non-code turns and rejects obsolete intent inputs before retrieval. |
| APQ2 | Recipe locator field audit and region readiness | AlembicCore with AlembicPlugin evidence | APQ0 | Existing Recipe fields are measured for semantic-region readiness without modifying Recipe files. |
| APQ3 | Semantic-region chunk builder and persisted index | AlembicCore with Alembic main integration | APQ2 | `recipe_region_*` vector items are generated, saved, filtered, and reconciled outside query handling; bounded generation test passes before full active-Recipe generation leaves a testable vector fixture. |
| APQ4 | Resident requirement-to-Recipe semantic retrieval | Alembic + AlembicCore | APQ3 | Resident search uses `recipe-semantic-region` chunks and returns region-class evidence. |
| APQ5 | Prime selection, trust gating, and lean projection | AlembicPlugin | APQ1, APQ4 | Plugin output is compact, region-evidence gated, and no obsolete intent route remains. |
| APQ6 | End-to-end agent prime SQ proof | AlembicPlugin + Test by controller judgment | APQ5 + product self-validation | Fresh MCP validation proves useful host-visible prime behavior. |

## APQ0: Prime Input Baseline And Intent-Coupling Deletion Inventory

- Requirement Key:
  `alembic-prime-output-quality-apq0-input-baseline-intent-deletion-2026-06-16`
- Type: read-only product evidence
- Suggested owner: AlembicPlugin
- Dependencies: controller intake

### Scope

- Read current `alembic_prime` schema, handler, pipeline, output projector,
  resident client, tests, skills, and docs.
- Inventory all `alembic_intent`, `intentRef`, `recognizedIntent`,
  `HostIntentFrame`, intent evidence, and intent persistence paths that prime
  currently consumes.
- Classify fields as target prime input, obsolete rejected input, or deletion
  target.
- Run baseline probes for implementation, fix, refactor, test-writing,
  design/planning, status-only, project navigation, low-information query,
  automation envelope, and Chinese mixed feature requirement.

### Acceptance

- Intent coupling deletion inventory is complete enough for implementation.
- Minimum prime input contract is verified against live schema/handler facts.
- Baseline outputs show which cases are useful, skipped, degraded, or invalid.
- APQ1/APQ2 blockers are named with file/line evidence.

## APQ1: Standalone Prime Code-Development Gate

- Requirement Key:
  `alembic-prime-output-quality-apq1-standalone-code-gate-2026-06-16`
- Type: implementation
- Suggested owner: AlembicPlugin
- Dependencies: APQ0

### Scope

- Remove prime dependency on `alembic_intent`, `intentRef`,
  `recognizedIntent`, and intent persistence records.
- Reject obsolete intent inputs instead of treating them as compatible input.
- Implement prime-owned code-development gate from direct input:
  `taskAction`, `requirementGoal`, locator facets, curated labels/keywords, and
  secondary verification refs.
- Enforce minimum valid input:
  `taskAction + requirementGoal + at least one locator facet`.
- Keep raw automation-envelope prompts blocked unless they carry a curated
  direct prime requirement frame plus source refs.

### Acceptance

- Retrieval does not run for non-code turns, low-information input, ordinary
  knowledge lookup, project navigation, or obsolete intent-only input.
- Obsolete intent paths are deleted or rejected with clear diagnostics.
- Positive code-development cases reach retrieval with normalized requirement
  facets.

## APQ2: Recipe Locator Field Audit And Region Readiness

- Requirement Key:
  `alembic-prime-output-quality-apq2-recipe-region-readiness-2026-06-16`
- Type: read-only audit
- Suggested owner: AlembicCore with AlembicPlugin evidence refs
- Dependencies: APQ0

### Scope

- Audit active Recipes using existing fields only.
- Measure readiness for identity, applicability, pattern purpose,
  architecture convention, integration boundary, quality concern, negative
  boundary, rationale, and evidence regions.
- Verify that `reasoning.sources` and `recipe_source_refs` can support evidence
  refs when frontmatter `sourceRefs` are absent.
- Identify weak routing fields such as generic `category` or `topicHint`.
- Do not auto-rewrite Recipe files.

### Acceptance

- Readiness distribution exists by Recipe id and region class.
- Good and bad locator examples are recorded.
- The audit states which regions can be generated from current fields and which
  gaps should become later Recipe quality work.

## APQ3: Semantic-Region Chunk Builder And Persisted Index

- Requirement Key:
  `alembic-prime-output-quality-apq3-region-vector-index-2026-06-16`
- Type: implementation
- Suggested owner: AlembicCore with Alembic main integration
- Dependencies: APQ2

### Scope

- Build generated semantic chunks from existing Recipe rows.
- Save chunks as Core `VectorStore` items with:
  `metadata.type=recipe-semantic-region`, parent Recipe id, region class,
  content hash, source hash, dimension, language, tags, and evidence refs.
- Use deterministic `recipe_region_*` ids.
- Provide a full active-Recipe generation path for validation setup: load all
  active Recipes from the target Alembic data root and write fresh
  `recipe_region_*` semantic-region vector items for every active Recipe that
  has region content.
- Do not run full active-Recipe generation as the first operation. First run a
  bounded generation test on a representative subset or isolated data-root copy,
  validate chunk quality, metadata, embedding, filterability, stale cleanup, and
  sample retrieval, and record reviewable evidence.
- If the bounded generation test does not match expectations, stop and rework
  the generator / metadata / embedding / cleanup / retrieval path before any
  full generation.
- Return machine-readable generation coverage stats: active Recipe count,
  distinct Recipe ids represented by region chunks, generated chunk count,
  embedded vector count, upserted vector count, skipped-empty and
  skipped-generic region counts, stale removals, and degraded / failed reasons.
- Remove stale generated chunks when the parent Recipe is deleted, deprecated,
  or regenerated.
- Run generation through rebuild / refresh / knowledge sync flows only.
- Do not generate or persist chunks during ordinary prime query handling.

### Acceptance

- Unit tests prove region extraction and deterministic ids.
- Vector item contract tests prove metadata and filterability.
- Rebuild/reconcile tests prove stale chunk cleanup.
- Bounded generation-test proof passes before any full target data-root
  generation is accepted.
- Full-generation proof against the real AlembicWorkspace target data root, or
  an explicitly isolated copy of it, proves the persisted index is not
  legacy-only: `recipe_region_*` items exist, generated chunk metadata has
  `metadata.type=recipe-semantic-region`, distinct Recipe coverage equals the
  active Recipe count unless a named Recipe has no generatable content, and
  `entry_*` whole-entry vectors are not treated as semantic-region coverage.
- No Recipe markdown/frontmatter/source file changes occur.
- Embed-unavailable cases report degraded metadata without claiming vector
  matching.

## APQ4: Resident Requirement-To-Recipe Semantic Retrieval

- Requirement Key:
  `alembic-prime-output-quality-apq4-resident-region-retrieval-2026-06-16`
- Type: implementation
- Suggested owner: Alembic and AlembicCore
- Dependencies: APQ3

### Scope

- Build typed semantic queries from standalone prime requirement facets.
- Search generated `recipe-semantic-region` chunks with region-class filters
  where supported.
- Merge hits by parent Recipe id and preserve per-region scores/classes.
- Return honest degraded diagnostics when resident semantic or region index is
  unavailable.
- Keep exact anchors for title, trigger, tags, dimensions, capability names,
  and integration surfaces.

### Acceptance

- Resident retrieval proves stronger behavior when semantic-region vectors are
  available.
- Whole-entry vectors alone cannot admit trusted material.
- Region-class evidence survives into resident prime package metadata.

## APQ5: Prime Selection, Trust Gating, And Lean Projection

- Requirement Key:
  `alembic-prime-output-quality-apq5-plugin-output-projection-2026-06-16`
- Type: implementation
- Suggested owner: AlembicPlugin
- Dependencies: APQ1, APQ4

### Scope

- Gate accepted Recipes by direct prime requirement evidence plus Recipe
  locator / region evidence.
- Reject or downgrade weak metadata, whole-document similarity, active-file
  similarity, source-ref similarity, or code-snippet-only matches.
- Return compact Recipe slices and matched region classes without verbose
  explanation.
- Preserve diagnostics in structured metadata.
- Keep full Recipe content behind detail refs.

### Acceptance

- Output schema tests cover delivered, skipped, degraded, empty,
  vector-unavailable, and verification-required packages.
- Obsolete intent routes are absent or rejected.
- Matched region classes survive Plugin projection.
- Low-information input does not produce generic trusted material.

## APQ6: End-To-End Agent Prime SQ Proof

- Requirement Key:
  `alembic-prime-output-quality-apq6-agent-sq-proof-2026-06-16`
- Type: validation and controller review input
- Suggested owner: AlembicPlugin + Test only if controller assigns fresh MCP
  validation
- Dependencies: APQ5 and product self-validation

### Scope

- Run fresh installed/local MCP validation after implementation and local
  plugin refresh.
- Confirm APQ3 bounded generation-test proof passed before treating any full
  generated vector fixture as test-ready. If this proof is absent or failed,
  stop as generation-test-not-ready.
- Before positive probes, run a vector-fixture preflight against the target
  data root. The preflight must parse the persisted vector index and prove that
  fresh `recipe_region_*` semantic-region vectors cover the active Recipe set.
  If the index contains only legacy `entry_*` vectors, APQ6 stops as
  test-environment-not-ready.
- Verify host-visible receipt and structured content.
- Cover implementation, fix, refactor, test-writing, architecture-boundary,
  quality-concern, prohibition, non-code, project-navigation, low-information,
  and Chinese mixed requirement probes.

### Acceptance

- Positive code-development cases return relevant design-pattern or
  architecture-convention Recipes.
- Non-code cases skip cleanly.
- Resident-unavailable cases degrade honestly.
- Test evidence includes active Recipe count, `recipe_region_*` count, distinct
  covered Recipe ids, vector index path / timestamp, and confirmation that a
  legacy-only `entry_*` index was not used as the semantic-region fixture.
- Test evidence identifies the prior bounded generation-test result. A failed
  bounded generation test blocks full generation and APQ6 positive probes until
  the generation path is reworked.
- Obsolete intent inputs are rejected or absent.
- Controller can review raw MCP outputs and decide accept/rework/closeout.

## Controller Intake Notes

This is a Design requirement group, not an execution packet.

Recommended controller action:

1. Intake the source requirement design and this group as a new independent
   demand.
2. Decide scheduling relative to the active ASQ current mainline. Design
   recommends `after-current` unless the controller identifies a direct blocker
   relationship.
3. Create a state root for this prime demand.
4. Create APQ0 as the first read-only package.
5. Continue APQ1-APQ6 only after upstream evidence is reviewed.

## Source References

- `Design/docs/current/alembic-prime-output-quality-optimization-requirement-design-2026-06-16.md`
- Current Design conversation decisions on 2026-06-16.
- Current local code fact scan recorded in the source requirement design.
