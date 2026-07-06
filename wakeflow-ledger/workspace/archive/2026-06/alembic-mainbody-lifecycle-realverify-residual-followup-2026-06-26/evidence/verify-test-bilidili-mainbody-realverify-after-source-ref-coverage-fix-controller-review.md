# Controller Review: BiliDili Realverify After Source-Ref Coverage Fix

State root: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`

Dispatch group: `verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-p1`

Target task: `verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1`

Target window: `Test`

## Controller Conclusion

Accept this Test result as valid blocked evidence, not as demand completion.

The primary finding#1 gate is now proven repaired in the direct BiliDili run:
deepMining produced source-ref-backed coverage rows with `covered_count > 0`
and non-empty `covered_source_refs`.

The demand remains open because the same direct run exposed the next real
blocker: moduleMining persisted accepted output, but the Alembic mainbody job
still failed with `moduleMining produced zero recipes.` Evolution, maintenance,
and anti-fabrication probes were not reached after this first blocker.

## Evidence Reviewed

- Target result:
  `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1.json`
- Test summary:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/source-ref-coverage-fix-realverify-summary.md`
- DeepMining coverage SQL:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/deepmining-coverage-sql-summary.json`
- DeepMining DB delta:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/deepmining-db-delta-summary.json`
- ModuleMining job run:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/modulemining-after-source-ref-coverage-fix-job-run.json`
- ModuleMining job detail:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/job-modulemining-after-source-ref-coverage-fix.json`
- ModuleMining DB delta:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/modulemining-db-delta-summary.json`
- After-failure DB snapshot:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-after-source-ref-coverage-fix-t1/evidence/after-modulemining-failed-after-source-ref-coverage-fix-db-snapshot.json`

## Raw Findings

- Runtime target was direct BiliDili, not a read-only copy.
- Provider split matched the corrected setup: DeepSeek for generation/planning
  and Ollama `qwen3-embedding:0.6b` for embeddings.
- AlembicAgent build passed.
- Alembic build passed.
- Generated DB tables were reset to zero before the run.
- ColdStart passed with job `bootstrap_mqwpcyy8_46b980b3`.
- DeepMining passed with job `rescan_mqwpmzso_3f42b2fd`.
- DeepMining DB delta from after ColdStart included:
  - `knowledge_entries +3`
  - `recipe_source_refs +8`
  - `coverage_ledger +42`
  - `deep_mining_rounds +2`
  - `token_usage +32`
- Coverage SQL showed:
  - 2 `covered` rows
  - `covered_count` sum 4
  - 2 positive rows
  - 2 rows with non-empty `covered_source_refs`
- Positive covered rows referenced real BiliDili source files for
  `AOXFoundationKit` and `Account`.
- ModuleMining job `rescan_mqwpvvg6_a00132ac` failed with:
  `moduleMining produced zero recipes.`
- The failure stack points at Alembic mainbody runtime:
  `DaemonJobRunner.runModuleMiningWorkflow`.
- ModuleMining DB delta contradicted the zero-output failure:
  - `knowledge_entries +22`
  - `recipe_source_refs +50`
  - `knowledge_edges +66`
  - `lifecycle_transition_events +7`
  - `token_usage +136`
- Test reported clean repository status for BiliDili, Alembic, AlembicCore,
  AlembicAgent, and AlembicPlugin after the run.
- Test secret scan over evidence/logs found 0 matches.

## Controller Interpretation

The coverage fix chain is no longer the active blocker. The direct DB evidence
is enough to accept that source-ref-backed coverage ledger rows can be produced.

The active blocker belongs to Alembic mainbody moduleMining result accounting or
result projection. The system must not fail a moduleMining job as "zero recipes"
when the same run persisted accepted knowledge entries and source refs. The
repair must still preserve all existing gates:

- no fallback to full project generation;
- no plan hard gate relaxation;
- no quality or anti-fabrication floor relaxation;
- no success from audit/log/transition side effects alone;
- no masking if the persisted rows came from an unrelated async path, wrong
  project root, or wrong data root.

## Required Next Repair

Dispatch Alembic mainbody repair focused on:

- `Alembic/lib/daemon/DaemonJobRunner.ts`, especially
  `runModuleMiningWorkflow`;
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
  moduleMining path and return projection;
- accepted output counting for persisted moduleMining recipes/source refs/
  knowledge entries attributable to the current job or round.

The regression test must cover the observed shape: accepted moduleMining output
is persisted, but the old result projection reports zero and fails the job. A
true zero-output moduleMining run must still fail.

## Forbidden Conclusions

- Do not mark the demand complete from this Test result.
- Do not redispatch Test before Alembic repairs the moduleMining result
  accounting/projection blocker.
- Do not treat DB side effects alone as success unless they are attributable to
  accepted moduleMining output for this job/round.
- Do not run or accept evolution/maintenance and anti-fabrication probes until
  moduleMining is no longer failing at this gate.
