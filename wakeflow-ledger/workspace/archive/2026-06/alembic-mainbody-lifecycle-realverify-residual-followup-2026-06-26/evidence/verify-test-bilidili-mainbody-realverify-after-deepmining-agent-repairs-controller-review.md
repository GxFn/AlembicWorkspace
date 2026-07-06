# Controller Review: verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs

Reviewed at: 2026-06-27T18:28:00Z

## Scope

- Demand: `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`
- Target: `Test / verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1`
- Target result: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1.json`
- Requirement authority: Design §6/§7/§8 says Phase VERIFY gate 3 must prove real BiliDili deepMining coverage ledger rows advance from empty/thin to partial/covered with `covered_count > 0` and source refs; faithful-copy-only evidence is insufficient.

## Raw Evidence Reviewed

- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1/evidence/deepmining-agent-repairs-realverify-summary.md`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1/evidence/deepmining-coverage-sql-summary.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1/evidence/deepmining-db-delta-summary.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1/evidence/job-deepmining-after-deepmining-agent-repairs.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1/evidence/job-events-deepmining-after-deepmining-agent-repairs.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepmining-agent-repairs-t1/evidence/repo-status-after-run.txt`

## Evidence Finding

The latest Test run proves the previous zero-production blocker improved, but the demand gate is still unmet.

- Live dist was rebuilt from Alembic `9e5555df194d32715a44b8bd6f028b45f133efd2`, AlembicAgent `99b8b33a591b0199f47cb8fc40bc939fe4a4dee5`, AlembicCore `934d043a0d12ac364aa582d6c39445f14a0af2e1`.
- Provider split was correct for this run: DeepSeek generation/planning, Ollama qwen embeddings.
- ColdStart passed: `knowledge_entries=8`, `recipe_source_refs=13`, `semantic_memories=15`, no active bootstrap sessions.
- DeepMining completed without job error and recorded real production:
  - round 1 `newRecipesThisRound=3`
  - round 2 `newRecipesThisRound=2`
  - DB delta: `knowledge_entries +5`, `recipe_source_refs +25`, `coverage_ledger +57`, `deep_mining_rounds +2`
- Coverage gate still failed:
  - `coverage_ledger` rows: 57 total
  - grade distribution: 42 `empty`, 15 `thin`
  - `SUM(covered_count)=0`
  - rows with `covered_count > 0`: 0
  - rows with non-empty `covered_source_refs`: 0

## Root-Cause Direction

Controller code review indicates the Core coverage helper can mark rows partial/covered when `coveredPaths` overlap module `ownedPaths`. The live failure is more likely in Alembic mainbody coverage-write inputs:

- `KnowledgeRescanWorkflow.writeKnowledgeRescanCoverageLedgerForDimension` currently builds coverage from `result.referencedFiles`.
- Real BiliDili accepted recipes did persist source refs in `recipe_source_refs`, including file and directory refs, but the coverage rows still received no `covered_source_refs`.
- Therefore the repair should make mainbody deepMining coverage writes consume the accepted recipe source refs actually persisted for the dimension/round, or otherwise pass the accepted candidate recipe source refs through the dimension result hook, then overlap those refs against canonical ProjectMap module `ownedFiles`.

This must not weaken gates: rejected/non-source-backed recipes must not increase coverage.

## Decision

Decision: accept Test target result as a valid blocker report, not as demand completion.

The remaining blocker is product-code behavior in Alembic mainbody deepMining coverage writing. Test correctly stopped before moduleMining and anti-fabrication because the first required Phase VERIFY gate failed.

## Next Action

- Reduce/accept this blocked Test result with `acceptBlocked=true`.
- Create an Alembic repair package for source-ref-backed coverage cell production.
- After repair acceptance, rerun Test on direct BiliDili from the same gate set.
