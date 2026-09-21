# V2 AlembicAgent same-run strict-test receipt — Controller Review

## Controller Acceptance

- User goal: 冷启动测试模式自动选择适用维度，并通过现有 AgentService / PipelineStrategy 真实链路返回同 run、同 authority、同 selected-cell set 的 canonical receipt；不得依赖 legacy bootstrap、用户手选或事后 synthetic receipt。
- Scope reviewed: `v2-agent-same-run-strict-test-receipt-p1`，AlembicAgent commit `077f4f6f08da731a40547c90f085460f434087f1`。
- Original requirement authority: V2 restart decision 的 `V2 Entry Scope`、`Completion Definition`、`Test Boundary`，以及任务包中的 `v2-agent-same-run`、`v2-agent-cell-conservation`、`v2-agent-existing-chain` 三个 acceptance anchors。
- Target/window: AlembicAgent / `v2-agent-same-run-strict-test-receipt-t1`。
- Evidence reviewed: commit diff；`StrictTestDimensionAgentContract.ts`、`AgentService.ts`、`AgentRuntime.ts`、`PipelineStrategy.ts`；目标证据文档；57 个聚焦测试；公开 AgentService runtime probe；仓库边界与 public signature checks；全量测试失败归因。
- Implementation reality: 正常路径已经从唯一 PipelineStrategy 的 G1/G2 artifacts 封存并返回 receipt，cell set/order/run/scope 的管线内守恒检查有效；但 strict-test 的“成功”仍存在两个绕过实际执行权威的入口。
- Validation result: `npm run build:check` 通过；4 files / 57 tests 通过；`npm run probe:strict-test-dimension-agent` 通过。全量测试 20 个失败均来自未修改的 durable-semantic-review fixture 对已移除 Core facade export 的旧导入，不归因于本 commit，也不作为本包返工理由。
- Blockers:
  1. `AgentRuntime` 可在 PipelineStrategy 前因 policy reject 返回非空 reply、无 outcome/phases/receipt；`AgentService` 仍按非空 reply 判定 `success`。总控最小复现得到 `status=success` 且 `hasReceipt=false`，直接违反 `v2-agent-same-run`。
  2. strict stage result 在 gate 调用前没有封存；gate evaluator 获得并可原地修改 `phaseResults` 中同一个对象。总控最小复现把模型结果 `original-model-output` 改成 `mutated-after-model`，最终 phase 与 receipt hash 都只能看到改写后对象。因此当前 `actualStageHashesMatch` 不能证明原始 stage 输出。
- Missing evidence: 缺少 strict request 的 policy-reject/early-return、missing receipt、mismatched receipt 回归测试；缺少 gate mutation 不能改写已封存 stage evidence 的回归测试。
- Residual risks: AlembicCore `createProjectContextFileRef` facade 与既有 Agent/Main consumer 的基线不一致仍需后续按原 producer/consumer authority 单独处理，不得混入本次 Agent 返工。
- TODO/backlog rollup: 本轮不新增 TODO；两个 blocker 都属于当前任务包和原 acceptance anchors，必须在同一 AlembicAgent task 上返工。Core facade 基线问题只作为后续链路证据保留，待本包接受后依据原计划决定 owner/package。
- Decision: `request-rework`。
- Next action: 在同一任务上修复并重新回填：
  1. AgentService 在识别到完整 strict-test authority 时，必须先验证 strict runtime binding/profile；任何缺少 completed pipeline outcome 或 matching receipt 的结果不得返回 success。receipt 的 `runId`、`authorityHash`、`selectedCellSetHash` 必须与请求 authority 完全一致；policy reject、early return、missing/mismatched receipt 均 fail closed，同时保持普通非-strict run 兼容。
  2. 每个 strict Analyst/Producer stage 在 gate evaluator 获得引用之前封存不可变 snapshot/hash；gate 与最终 receipt 只能消费该预先封存证据，不能用 evaluator 改写后的对象重新定义“actual stage output”。
  3. 先补 RED probes，再提供 GREEN：真实 AgentRuntime policy reject（零模型/零 PipelineStrategy、非 success、无 receipt）、missing/mismatched receipt、gate source mutation、普通非-strict 兼容；重跑原 57 tests、公开 probe、build 与相关边界检查。
  4. 不修改 AlembicCore、Alembic Main、Dashboard、Plugin，不建立第二 pipeline，不把全量 20 个既有失败塞进本次返工。
