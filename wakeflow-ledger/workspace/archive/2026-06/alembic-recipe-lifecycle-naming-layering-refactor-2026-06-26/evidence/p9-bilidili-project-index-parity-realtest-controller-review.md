# P9 Controller Review - BiliDili project-index parity REAL-TEST

Date: 2026-06-28
Controller: AlembicWorkspace
Dispatch group: p9-bilidili-project-index-parity-realtest-p1
Target task: Test / p9-bilidili-project-index-parity-realtest-t1

## Decision

Accept the P9 BiliDili REAL-TEST target result.

The P9 parity gate is satisfied for the intended scope: the host-agent
dimension-complete path and the in-process coverage adapter wrote identical
normalized `coverage_ledger` rows for the same real BiliDili
module/dimension set.

## Authority Checked

- Requirement design §12.2 P9 requires Core project-index/coverage collapse,
  consumer repin, R-2 root behavior preserved, and a REAL-TEST parity gate.
- P9 REAL-TEST acceptance is `coverage_ledger` row equivalence after each host
  drives the dimension-complete coverage write path.
- §12.3 requires direct testing against the real BiliDili workspace, no sandbox
  copy, DeepSeek generation, local Qwen/Qianwen embedding, and R-2 root safety
  before destructive reset.
- P10 remains separate: full per-host `runProjectIndexWorkflow(mode)`
  orchestrator parity, session-release checks, and broader bootstrap/rescan
  envelope assertions are not inferred from this P9 result.

## Raw Evidence Reviewed

- Target result envelope:
  `target-results/tr-p9-bilidili-project-index-parity-realtest-t1.json`
- Target report:
  `evidence/p9-bilidili-project-index-parity-realtest-t1-report.md`
- Target summary:
  `evidence/p9-bilidili-project-index-parity-realtest-t1-summary.json`
- Raw parity JSON:
  `Test/tmp/p9-bilidili-project-index-parity-realtest-t1/inprocess-coverage-parity.json`
- Raw parity script:
  `Test/tmp/p9-bilidili-project-index-parity-realtest-t1/run-inprocess-coverage-parity.mjs`
- Review pack:
  `p9-bilidili-project-index-parity-realtest-p1` was `ready`, single expected
  target `Test`, no missing evidence refs, controller-return sent/readback OK.

## Implementation And Runtime Reality

- Code points match the accepted P9 code phase:
  - AlembicCore `99a7cf10d82056cd860eb0a1d9544662e3735b08`
  - Alembic `65c244d8092a70656cd2d5f3f16883f6a053b326`
  - AlembicPlugin `69c80dfc86bc1ea587058567f0016e48bb8dfec2`
- Alembic and AlembicPlugin both pin `vendor/AlembicCore` to
  `99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- Test restarted the real BiliDili Alembic daemon in test mode with DeepSeek
  generation and local Qwen/Qianwen embedding env preserved.
- R-2 source guard was checked before reset; BiliDili product source stayed
  clean.
- Host path exercised `alembic_plan` draft/confirm, `alembic_bootstrap`
  rebuild, accepted 3 architecture candidates, and completed
  `alembic_dimension_complete` with `recipesBound=3` and quality score 95.
- In-process path called `writeKnowledgeRescanCoverageLedgerForDimension`
  against the same real BiliDili DB and fixed canonical module set.

## Independent Controller Validation

Controller ran read-only evidence checks:

```text
jq assertion over inprocess-coverage-parity.json
passed:
  ok == true
  diff == []
  hostRows length == 6
  inProcessRows length == 6
  hostRows == inProcessRows
  inProcessResult.writtenCells == 6
  inProcessResult.deferredCells == 0
  inProcessResult.skipped == false
  module ids == BiliDili, Packages/AOXFoundationKit, Packages/AOXNetworkKit,
                Packages/AOXPlayer, Packages/AOXUIKit, Sources
  at least one row grade != empty
```

Controller also checked current local repository points:

```text
AlembicCore HEAD 99a7cf10d82056cd860eb0a1d9544662e3735b08
Alembic HEAD 65c244d8092a70656cd2d5f3f16883f6a053b326
AlembicPlugin HEAD 69c80dfc86bc1ea587058567f0016e48bb8dfec2
Alembic vendor/AlembicCore 99a7cf10d82056cd860eb0a1d9544662e3735b08
AlembicPlugin vendor/AlembicCore 99a7cf10d82056cd860eb0a1d9544662e3735b08
BiliDili git status --short: clean
```

The raw parity log includes:

```text
[CoverageLedger] coverage state written (advisory, not a gate)
writtenCells=6 deferredCells=0 dimensionIds=["architecture"] lastRound=2
```

## Scope Judgment

The parity script intentionally fixed the module set by reading the host
canonical rows, deleting those rows, and feeding the same module summaries into
the in-process adapter. This proves the P9 seam that was changed by the Core
coverage builder collapse: both host/in-process paths converge on identical
Core coverage cell output for the same BiliDili module/dimension set.

This does not claim the broader P10 orchestrator gate is complete. P10 still
needs the full real BiliDili dual-host `runProjectIndexWorkflow(mode)` flow,
session-release evidence, and bootstrap/rescan envelope assertions.

## Risks And Rollup

- Historical P6 `target:*` coverage rows remain in the DB after host bootstrap
  rebuild. They were excluded from this P9 same-module parity diff because they
  are a different module-axis population from an earlier stage.
- The AlembicPlugin installed cache marker gitHead is stale, but Test used local
  source/dist at the accepted P9 commit and the MCP route executed successfully.
- No product-code defect is authorized from this result.
- No follow-up TODO is created from the residual P6 rows; P10/P11/P12 already
  carry their own real-test gates under the original design.

## Next Controller Action

Run Wakeflow reduction, accept the P9 REAL-TEST target result, then continue
unattended to P10 implementation dispatch.
