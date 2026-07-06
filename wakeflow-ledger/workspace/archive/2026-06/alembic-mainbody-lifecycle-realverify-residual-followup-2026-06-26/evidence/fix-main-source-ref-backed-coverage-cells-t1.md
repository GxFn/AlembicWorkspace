# fix-main-source-ref-backed-coverage-cells-t1

Recorded at: 2026-06-27T18:28Z

## Scope

- Window: Alembic
- Task: fix-main-source-ref-backed-coverage-cells-t1
- Dispatch group: fix-main-source-ref-backed-coverage-cells-p1
- State root: .wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26
- Repository: /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic

## Reviewed Evidence

- Controller review: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/evidence/verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-controller-review.md`
- Test target result: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1.json`
- Test DB summary: `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1/evidence/deepmining-coverage-sql-summary.json`
- Test DB delta: `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1/evidence/deepmining-db-delta-summary.json`

The reviewed Test evidence showed deepMining production was no longer zero: `knowledge_entries +5`, `recipe_source_refs +25`, `coverage_ledger +57`, `deep_mining_rounds +2`. The remaining gate failure was that every coverage ledger row still had `covered_count=0` and `covered_source_refs=[]`.

## Root Cause

`KnowledgeRescanWorkflow` wrote coverage cells from `result.referencedFiles`, which is the coarse dimension analysis report file list. Accepted recipe source refs are produced by successful `knowledge submit` calls and later mirrored into `recipe_source_refs` through the `knowledge:changed` event path. In the live chain, accepted recipes had real source refs, but the coverage hook did not receive those accepted refs and therefore could write only empty/thin cells.

## Repair

- `lib/workflows/ai-execution/BootstrapConsumers.ts`
  - Collects `acceptedSourceRefs` from successful submit calls only.
  - Reads refs from submit `sourceRefs`, `referencedFiles`, and `reasoning.sources`.
  - Excludes rejected/error submit calls.
- `lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - Adds `acceptedSourceRefs` to the internal `ProjectContextDimensionResultHookInput`.
- `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
  - Passes accepted source refs to `writeKnowledgeRescanCoverageLedgerForDimension`.
  - Coverage writer uses explicit `acceptedSourceRefs` when present; an explicit empty list no longer falls back to coarse `referencedFiles`.
- `test/unit/BootstrapDimensionConsumer.test.ts`
  - Proves accepted submit refs are forwarded and rejected submit refs are excluded.
- `test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`
  - Proves accepted source refs update covered cells even when coarse dimension referenced files do not overlap module owned files.
  - Proves source-ref-less accepted output does not increase coverage even if coarse referenced files overlap.

## Commit

- Alembic commit: `1f141c8 fix: write coverage from accepted source refs`
- Local repository state after commit: `main...origin/main [ahead 1]`
- No push was performed, matching the task package.

## Verification

Post-commit:

- `npm run build:check` — passed.
- `npm run test:unit -- test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/BootstrapDimensionConsumer.test.ts` — passed, 3 files / 28 tests.
- `git diff --check HEAD` — passed.

Pre-commit broader checks on the same code shape:

- `npm run test:unit` — passed, 122 files / 968 tests, 1 skipped.
- `npm run lint:core-import-boundary` — passed, scanned 348 files and 421 `@alembic/core` imports.
- `./node_modules/.bin/biome check` on changed files — passed.
- `git diff --check` — passed.

Guard attempt:

- `alembic_code_guard` was attempted with the changed file list, but the tool returned an internal schema error: `unrecognized key "data"`. No code finding was produced. Treat this as a guard tool-surface blocker, not as a code pass.

## Residual Risk And Next Step

- Final BiliDili direct e2e was intentionally not rerun in this Alembic target window. The task package assigns that validation to Test after controller acceptance.
- Recommended next step after controller review: rerun the direct BiliDili chain from the same deepMining coverage gate and verify `coverage_ledger` has rows with `covered_count > 0` and non-empty `covered_source_refs`.
