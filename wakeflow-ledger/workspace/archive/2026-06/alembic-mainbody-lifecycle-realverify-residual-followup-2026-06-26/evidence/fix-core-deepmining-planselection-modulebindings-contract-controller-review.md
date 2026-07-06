# Controller Review: fix-core-deepmining-planselection-modulebindings-contract

## Conclusion

Decision: accept target result. AlembicCore completed the assigned Core-side producer contract repair for the deepMining/moduleMining PlanSelection module-binding gap.

## User Goal

Continue the mainbody lifecycle real verification follow-up until direct BiliDili deepMining can run through the real lifecycle chain. The immediate Core blocker was that a stage-shape-valid PlanSelection with empty `moduleBindings` could reach the deepMining executor, where it failed before coverage ledger rounds or coverage writeback.

## Scope Reviewed

- Target/window: AlembicCore
- Task: `fix-core-deepmining-planselection-modulebindings-contract-t1`
- Commit reviewed: `934d043a0d12ac364aa582d6c39445f14a0af2e1`
- Files reviewed:
  - `AlembicCore/src/service/planIntent/planIntent.ts`
  - `AlembicCore/src/plans.ts`
  - `AlembicCore/test/PlanSelectionProjection.test.ts`

## Implementation Reality

- Core added exported stage-aware validation:
  - `assertPlanSelectionStageRequirements`
  - `planSelectionRequiresModuleTargets`
- Generic `assertPlanSelectionShape` remains stage-agnostic, preserving coldStart/legacy parse semantics.
- Stage-aware requirements reject `deepMining` and `moduleMining` selections without module bindings that can produce module x dimension targets.
- The validator checks:
  - expected stage mismatch
  - missing module bindings for stage-required selections
  - missing `modulePath`
  - empty binding dimensions
  - binding dimensions not selected by the plan
  - non-positive `targetRecipes`
  - zero usable module x dimension targets
- `src/plans.ts` re-exports the new type/function surface for downstream consumers.
- Focused tests prove:
  - empty `moduleBindings` still pass generic shape parsing
  - empty `moduleBindings` fail stage-aware deepMining/moduleMining validation
  - coldStart remains allowed without module bindings
  - malformed bindings fail
  - valid stage-required bindings pass

## Controller Verification

Ran independently in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore`:

```text
node --version
v22.22.1

npm run build:check
> tsc -p tsconfig.json --noEmit
passed

npm run test -- PlanSelectionProjection.test.ts
Test Files 1 passed (1)
Tests 7 passed (7)

git diff --check 934d043a0d12ac364aa582d6c39445f14a0af2e1^ 934d043a0d12ac364aa582d6c39445f14a0af2e1
passed
```

Target-reported additional verification reviewed from the result envelope:

- `npm run lint` passed.
- `npm run build` passed.
- full `npm run test` passed: 144 files / 1412 tests.
- `npm run check` failed only at the sibling Alembic consumer import gate for `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:59`, outside this Core diff and already in the consumer route that must be handled by Alembic mainbody.

## Blockers

None for this Core target.

## Residual Risks

- Core only exposes the contract. AlembicAgent still needs to generate valid module bindings, and Alembic mainbody still needs to consume the stage-aware assertion at the plan gate before BiliDili can be reverified end-to-end.
- Alembic Guard did not produce actionable findings because the target reported an MCP schema/contract error; controller did not rely on Guard for acceptance.

## Decision

Accept `fix-core-deepmining-planselection-modulebindings-contract-t1`.

## Next Action

Dispatch the next producer in the same chain: AlembicAgent must update plan-selection prompt/profile/tests so deepMining/moduleMining output real module bindings from ProjectContext facts instead of accepting or encouraging `moduleBindings: []`.
