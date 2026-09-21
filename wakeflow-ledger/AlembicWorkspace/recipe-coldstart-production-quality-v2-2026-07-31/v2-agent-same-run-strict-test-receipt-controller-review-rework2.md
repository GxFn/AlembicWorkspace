# V2 Agent same-run strict-test receipt — controller review rework2

## Controller Acceptance

- User goal: 在真实 BiliDili 冷启动测试继续向下游连接之前，先让自动选择维度后的 AlembicAgent 严格执行复用唯一既有主链，并由该次实际执行直接产生同 run、同 authority、同 selected-cell set 的 canonical receipt；任何旁路或伪造权威均 fail closed。
- Scope reviewed: `v2-agent-same-run-strict-test-receipt-t1` 在 `v2-agent-same-run-strict-test-receipt-rework2-p1` 的第三版结果；只评审 AlembicAgent 的 `AgentService` 结果权威边界、聚焦合同测试和真实单链 probe。
- Original requirement authority: `legacy-flow-closure-and-v2-restart-decision.md` 的 V2 Entry Scope、Completion Definition 与 Test Boundary；strict-test supplement §8、§12；任务包的 `v2-agent-same-run`、`v2-agent-cell-conservation`、`v2-agent-existing-chain` 三个 acceptance anchors。
- Target/window: AlembicAgent；提交 `8688311c3970054c68a74b0ce30d8f3db4f15be6`，父提交 `4a2649f0d758a43f0884af5377c8b8531eed0b41`。
- Evidence reviewed: result revision 3；提交 diff；`src/agent/service/AgentService.ts`；`test/strict-test-dimension-agent-contract.test.ts`；target 的 rework2 root-cause note；controller 本轮重新执行的聚焦测试、TypeScript build check 与真实 runtime probe。
- Implementation reality: `settleAgentServiceResult` 成为所有会产生 `AgentRunResult` 的统一 authority disposition。完整 strict binding 只允许 `origin=runtime` 的实际执行进入成功验证；strict concurrency 在 coordinator 之前被拒绝；普通 runtime/coordinator 返回的 unsolicited `strictTestExecutionReceipt` 被清除并失败关闭。compile/runtime-build/coordinator 的异常仍保持原 throwing API，不伪造成成功结果。
- Validation result: controller fresh rerun 的 4 文件聚焦矩阵 79/79 通过；`npm run build:check` 通过；`npm run probe:strict-test-dimension-agent` 通过。probe 证明 architecture 的两个 selected cells 在同一次 authority run 中执行，模型调用 2 次，receipt 直接返回，`actualStageHashesMatch=true`；authority lineage drift 在 0 次模型调用时失败，cell conservation drift 在无 receipt 情况下失败。提交 diff check 与最终工作树均干净。
- Blockers: 本任务范围内无 P0/P1 阻塞。上轮 coordinator 零 runtime 成功旁路和普通路径 receipt 注入均已在公开 `AgentService` seam 上关闭。
- Missing evidence: 无。三个 acceptance anchors 均有 RED/GREEN 映射，且 controller 已重新挑战对应测试/探针。
- Residual risks: 全仓仍有 20 个已知、未变化的相邻 AlembicCore public facade export 基线失败；它不由本任务引入，也不授权修改 Core。两条不可达防御分支可补更细单测，但没有观察到功能缺陷，不作为当前验收或 TODO 扩展依据。
- TODO/backlog rollup: 关闭本 AlembicAgent target；不从可选分支覆盖或外部 Core 基线新增本任务 TODO。V2 demand 尚未完成，下游 Alembic Main/Dashboard/exact artifact 与真实 Test 门保持原状态，Test 继续暂停。
- Decision: `accept-target-result`。
- Next action: 将本结果 reduce 并记录 accept；随后仅根据已确认的生产者到消费者顺序判断下一包，不把本次 Agent 验收表述为完整 strict-test、Dashboard 或生产冷启动完成。

## Independent Evidence

### Fresh controller commands

```text
npm test -- --run test/strict-test-dimension-agent-contract.test.ts test/strict-production-chain.test.ts test/strict-production-rework.test.ts test/agent-surface-floor.test.ts
Test Files  4 passed (4)
Tests       79 passed (79)

npm run build:check
passed

npm run probe:strict-test-dimension-agent
validRoute.status=success
validRoute.runId=strict-workflow:agent-automatic-selection-probe
validRoute.modelCallCount=2
validRoute.receiptReturned=true
failClosedRoute.status=error
failClosedRoute.modelCallCount=0
cellConservationFailClosed.status=error
cellConservationFailClosed.receiptReturned=false
actualStageHashesMatch=true
```

### Rework-point disposition

1. Coordinator bypass: canonical strict profile 的 `concurrency.mode !== none` 在调用 coordinator 前返回 `STRICT_TEST_DIMENSION_AGENT_PROFILE_CONCURRENCY_FORBIDDEN`；runtime build count 保持 0，且没有 receipt。
2. Unsolicited receipt: 非 strict runtime 与普通 coordinator 两条结果出口都会返回 `STRICT_TEST_DIMENSION_AGENT_EXECUTION_RECEIPT_UNSOLICITED`，最终结果不携带 receipt；无 receipt 的普通协调仍保持原成功语义。
3. Same-run success: 只有 runtime-origin execution 可调用既有 same-run validator，并保留 runtime id、authority hash、selected-cell set、stage/gate hashes 和 canonical receipt 的同源性。
4. Cell conservation: missing、extra、duplicate、reordered、cross-run、unselected、cross-cell 与伪造 producer/review/fact evidence 的既有负向矩阵继续通过。

## Forbidden Conclusions

- 本验收不表示 V2 demand 完成。
- 本验收不表示 Alembic Main、Dashboard、Plugin 或真实 BiliDili 场景已经连通。
- 本验收不允许启动 Test；仍需所有 required non-Test targets accepted、exact artifacts 经 controller 验证，并由用户明确启动。
- 本验收不把 private strict-test 结果解释为 production finalized、public CAS 或完整 26 维生产验收。
