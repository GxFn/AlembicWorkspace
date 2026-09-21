# V2 AlembicAgent same-run strict-test receipt rework1 — Controller Review

## Controller Acceptance

- User goal: 冷启动测试模式自动选择适用维度，并通过现有 AgentService / PipelineStrategy 唯一真实链路返回同 run、同 authority、同 selected-cell set 的 canonical receipt；任何提前返回、并发协调或非 strict 调用都不得伪造或夹带 strict 成功权威。
- Scope reviewed: `v2-agent-same-run-strict-test-receipt-p1` rework1，AlembicAgent commits `077f4f6f08da731a40547c90f085460f434087f1`、`4a2649f0d758a43f0884af5377c8b8531eed0b41`。
- Original requirement authority: V2 restart decision 的 `V2 Entry Scope`、`Completion Definition`、`Test Boundary`；任务包中的 `v2-agent-same-run`、`v2-agent-cell-conservation`、`v2-agent-existing-chain`；上一轮 controller rework 的四项明确修复要求。
- Target/window: AlembicAgent / `v2-agent-same-run-strict-test-receipt-t1`。
- Evidence reviewed: result revision 2；commit diff；`AgentService.ts`、`AgentProfileCompiler.ts`、`AgentRunCoordinator.ts`、`PipelineStrategy.ts`、`StrictTestDimensionAgentContract.ts`；新增 RED/GREEN；公开 runtime probe；两个总控最小挑战探针；两个只读独立审计。
- Implementation reality: rework1 已关闭原始直接路径：policy reject、early runtime return、completed-without-receipt、identity mismatch 均不能成为 strict success；Analyst/Producer stage 在 gate 前完成 canonical clone、deep freeze 和 private seal，gate 不能改写 stage snapshot/hash。但 strict 成功不变量只放在普通 runtime 返回路径，没有覆盖 AgentService 的所有出口。
- Validation result: `npm run build:check` 通过；4 files / 65 tests 通过；`npm run probe:strict-test-dimension-agent` 通过，真实主链为 runtime build 1 次、PipelineStrategy 1 次、模型调用 2 次且 receipt/stage hashes 匹配。总控另行复现 coordinator bypass：`status=success`、`runId=generate-dimension:parent`、`hasReceipt=false`、`runtimeBuildCount=0`；另行复现普通 chat 原样返回伪造的 `strictTestExecutionReceipt`。
- Blockers:
  1. `AgentService.run()` 在 strict binding/profile 校验后仍先调用 `runCoordinator`，并直接返回 coordinated result，绕过只位于 `runtime.execute()` 后的 `assertStrictTestSuccessfulResult()`。公开 `AgentProfileCompiler` 接受 caller-supplied compiled profile，而 strict profile 校验未禁止 `concurrency`；canonical-shaped compiled strict profile 加空并发 child set 可被 default merge 判为 success，却没有 runtime、PipelineStrategy、模型调用或 receipt。这同时违反 `v2-agent-same-run` 与 `v2-agent-existing-chain`。
  2. 没有 strict binding 时，AgentService 仍原样透传 runtime 返回的任意 `strictTestExecutionReceipt`，不做 schema、identity 或 authority 校验。总控复现普通 chat 返回 `status=success` 和 `{kind:not-validated, runId:spoofed-strict-run}`，使 receipt 权威字段可由非 strict 路径夹带。
- Missing evidence: 缺少“完整合法 binding + canonical-shaped compiled profile + concurrency/empty children”的真实 AgentService RED/GREEN；缺少 non-strict unsolicited receipt 的 fail-closed RED/GREEN；缺少证明所有 AgentService 返回出口共享同一 strict authority disposition 的边界测试。
- Residual risks: AlembicCore `createProjectContextFileRef` facade 的既有 20 个全量失败仍不属于本任务，不得混入本次 Agent 根因修复。后续若同一任务再次失败，`reworkCount >= 2` 的 recurring-problem brake 生效，不能再做第三次普通点修。
- TODO/backlog rollup: 不新增 TODO。两个 blocker 都直接破坏当前任务的 canonical receipt 与唯一主链锚点，继续由同一 AlembicAgent task 收口；Core/Main/Dashboard/Test 不提前启动。
- Decision: `request-rework`。
- Next action:
  1. 不再在各分支逐个补判断。把 strict-test authority disposition 集中到 AgentService 的单一返回边界：任何完整 strict binding 的结果只有经过 canonical profile、同 run completed PipelineStrategy 和 matching receipt 校验后才能投影 success。
  2. canonical `generate-dimension` strict-test profile 必须明确禁止 coordinated parent route/concurrency；在 coordinator 前 fail closed，或保证 strict 路径根本不进入 coordinator。普通 non-strict coordination 保持原行为。
  3. 没有完整 strict binding 的运行不得输出 strict receipt；遇到 unsolicited `strictTestExecutionReceipt` 必须 fail closed，不能透传或把字段当作普通兼容数据。
  4. 先补 RED，再提供 GREEN：coordinator bypass（零 runtime/零 pipeline 的假成功）、unsolicited receipt、原 policy/early/mismatch/gate mutation 全矩阵、普通 non-strict chat 与 coordination 兼容；重跑 65 tests、公开 probe、build、边界检查。
  5. 回填必须给出根因说明：此前为何只保护 `runtime.execute()` 后出口，以及新实现如何证明 AgentService 所有出口不再绕过 strict authority。不得修改 AlembicCore、Alembic Main、Dashboard、Plugin 或 Test。
