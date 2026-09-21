# V2 Agent same-run strict-test receipt — rework2 evidence

## Scope and commit

- Target: `v2-agent-same-run-strict-test-receipt-t1`
- Dispatch group: `v2-agent-same-run-strict-test-receipt-rework2-p1`
- Repository: `AlembicAgent`
- Rework2 commit: `8688311c3970054c68a74b0ce30d8f3db4f15be6`
- Earlier task commits retained: `077f4f6f08da731a40547c90f085460f434087f1`, `4a2649f0d758a43f0884af5377c8b8531eed0b41`
- Changed files in rework2:
  - `AlembicAgent/src/agent/service/AgentService.ts`
  - `AlembicAgent/test/strict-test-dimension-agent-contract.test.ts`
- No Core, Main, Dashboard, Plugin, Test, task-package, or product-contract files changed.

## Recurring-problem root-cause note

`reworkCount=2` triggered the craft recurring-problem stop. The controller's two reproductions proved a product-code bug rather than a requirement mismatch:

1. The previous fix validated strict authority only after the ordinary `runtime.execute()` return. `AgentService.run()` still had an earlier coordinated-result return, so a caller-supplied canonical-shaped strict compiled profile with concurrency and an empty child set returned `success`, `generate-dimension:parent`, zero runtime builds, and no receipt.
2. The ordinary runtime and coordinated-result exits returned a top-level `strictTestExecutionReceipt` without any request binding or authority validation.

The real gap was therefore not another missing receipt field check. It was the absence of one authority disposition shared by every `AgentRunResult` boundary. Rework2 centralizes disposition in `settleAgentServiceResult`: strict-bound success is available only to a runtime-origin candidate whose actual execution passes the existing same-run validator; ordinary candidates with a top-level receipt fail closed; failure candidates cannot become strict success. The canonical strict profile also rejects `concurrency.mode !== "none"` before `AgentRunCoordinator` is consulted, while the strict coordinator-origin guard remains defense in depth.

All `AgentService.run()` exits that produce an `AgentRunResult` now pass through the same disposition: binding/profile failure, coordinated result, runtime result, and runtime/validator failure. Compile/runtime-build/coordinator exceptions keep the existing throwing API and do not produce a result or receipt.

## Controller rework response

- Coordinator bypass: agreed and fixed at the first authority loss. The RED used the real default coordinator, public compiler, canonical strict profile, empty `generateSessionDimensions` slice, and a runtime build counter. GREEN is fail-closed before coordinator/runtime with the authority runId and no receipt.
- Unsolicited receipt: agreed and fixed at the shared disposition. Separate RED/GREEN tests cover ordinary runtime and ordinary coordinator exits.
- Prior policy/early/mismatch/gate mutation matrix: retained and green.
- Ordinary compatibility: direct chat without pipeline outcome, abandoned outcome, coordination without a receipt, and legacy strict-production hints remain compatible.
- Scope: only the assigned AlembicAgent service and focused contract test changed.

## RED / GREEN and acceptance-anchor mapping

### `v2-agent-same-run`

- RED: the real coordinator reproduction returned `success`, `generate-dimension:parent`, no receipt, and zero runtime builds; ordinary runtime/coordinator also returned unsolicited forged receipt authority.
- GREEN: coordinator bypass is `blocked` before runtime build and returns no receipt; ordinary runtime/coordinator forged receipts are `error` with no receipt. The existing real strict success probe still directly returns matching `runId`, `authorityHash`, and `selectedCellSetHash` from the same execution.
- Test seam: `test/strict-test-dimension-agent-contract.test.ts` — coordinator bypass, unsolicited runtime receipt, unsolicited coordinator receipt, and real same-run receipt tests.

### `v2-agent-cell-conservation`

- RED: earlier task evidence reproduced terminal cell-set drift and disconnected/synthetic receipt construction.
- GREEN: the retained real-chain negative matrix rejects missing, extra, duplicate, reordered, cross-run, unselected, cross-cell, arbitrary producer/review, and coherently swapped fact evidence before success. Rework2 cannot bypass that validator through a coordinator or ordinary unsolicited receipt.
- Test seam: `test/strict-test-dimension-agent-contract.test.ts` — terminal cell conservation and same-run lineage matrix.

### `v2-agent-existing-chain`

- RED: a coordinated parent could replace the required chain with zero runtime/PipelineStrategy executions.
- GREEN: strict concurrency is rejected before coordination; the positive probe still records one runtime build, one PipelineStrategy execution, two model calls, and one canonical receipt. Ordinary coordination remains unchanged when no strict receipt is present.
- Probe seam: `scripts/probe-strict-test-dimension-agent.mjs` and the focused contract tests.

## Verification

- Pre-change related baseline: 4 files / 75 tests passed.
- Rework2 RED: focused strict contract 3 failed / 39 passed. Failures were coordinator bypass, ordinary runtime unsolicited receipt, and ordinary coordinator unsolicited receipt.
- Rework2 GREEN: focused strict contract 42/42 passed.
- Related matrix: 4 files / 79 tests passed.
- `npm run build:check`: passed.
- Relevant Biome check and `git diff --check`: passed.
- Agent/public/Core import boundary, space-edge, layer-contract, doctrine, naming, provider-neutral, and retired-symbol checks: passed.
- `npm run probe:strict-test-dimension-agent`: passed; selected cells were `module-a::architecture` and `module-b::architecture`; success used the authority runId, two model calls, returned a receipt, and reported `actualStageHashesMatch=true`; cell drift failed closed.
- `npm test`: 73 files passed / 1 failed; 631 tests passed / 20 failed. All 20 failures are the unchanged `durable-semantic-review-runtime.test.ts` baseline caused by the adjacent Core facade not exporting `createProjectContextFileRef`.
- `npm run smoke:public-signatures`: passed (`15` exports, `461` bindings).
- `npm run smoke:strict-consumer`: unchanged baseline failure for the same adjacent Core facade export absence.
- `npm run verify:validation-floor`: passed.

## Self-review and residual risk

- Main-agent severity review: P0=0, P1=0.
- Independent read-only AgentService review: P0=0, P1=0, P2=0; confirmed every result-producing exit shares the disposition.
- Independent read-only test review: P0=0, P1=0. Two optional P2 branch-coverage additions were identified for injected unreachable strict-coordinator fallback and valid-binding runtime throw; neither is an observed defect or an acceptance-anchor gap, so they were not used to expand scope.
- Residual external baseline: the adjacent Core public facade export gap keeps the unrelated 20 tests and strict-consumer smoke red. This rework did not modify Core.
