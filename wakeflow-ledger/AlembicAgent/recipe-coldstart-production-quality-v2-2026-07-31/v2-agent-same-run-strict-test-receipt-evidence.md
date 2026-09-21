# v2-agent-same-run-strict-test-receipt 交付证据

- target task：`v2-agent-same-run-strict-test-receipt-t1`
- task package：`v2-agent-same-run-strict-test-receipt-p1`
- target window：`AlembicAgent`
- 结果：`completed`（等待 controller review）
- AlembicAgent commit：`077f4f6f08da731a40547c90f085460f434087f1`

## 完成范围

- 复用唯一既有主链 `AgentService → generate-dimension → AgentStageFactoryRegistry → PipelineStrategy`，把 authority `runId` 注入真实 runtime，并由同一次 `PipelineStrategy` 的 `analyze`、`analyst_fixpoint_gate`、`produce`、`independent_review_gate` phases 直接封存 canonical receipt。
- receipt 内嵌完整 G1/G2 pipeline evidence，逐层绑定 `runId`、`authorityHash`、`selectedCellSetHash`、实际 Analyst/Producer stage hash、fact execution、analysis fixpoint、per-cell producer/review disposition 与 terminal hash。
- selected cell 按 Core schedule 的 `canonicalSubjectRef → PlanCell.scopeId` 权威精确绑定全部 terminal fact receipts；缺失、额外、重复、重排、未选择、cross-run、cross-cell 及连贯重算后的跨 cell fact 调换均 fail closed。
- 删除 runtime probe 中“真实模型运行结束后用 empty facts 单独合成 synthetic receipt”的旧证明方式；probe 只读取公开 `AgentService` 成功结果返回的 receipt。
- 更新 production public facade、签名基线和独立消费者 smoke。

未修改 AlembicCore、Alembic Main、Dashboard、Plugin 或其他相邻仓库。既有 superseded manual-confirmation stash 保留，未应用、未改写。

## Acceptance anchors

### v2-agent-same-run

- RED：初始 acceptance probe 为 8 failed / 19 passed，公开 AgentService 成功对象与 receipt 不连续；旧 probe 在两次模型调用后另用 empty facts 合成失败 receipt。
- GREEN：公开 AgentService 入口只构建一个 runtime、执行一个 PipelineStrategy、产生两次既有 stage 模型调用，并直接返回 receipt。
- runtime probe：`runId=strict-workflow:agent-automatic-selection-probe`；`modelCallCount=2`；`receiptReturned=true`；`actualStageHashesMatch=true`。
- receipt：`authorityHash=sha256:9ef1d51e86ee5416eac334d94f7a5330c7b162295594122e753b68db3eacbfa6`；`selectedCellSetHash=sha256:1d0a321487cefa2f7a5dbcae7d1ffd4dc609d449f4e930557023241aa30481f6`；`pipelineExecutionHash=sha256:fab49cf5a67a0c9af66baa6dc32b074c5b4530ce74837c5f256befdd3c5d28e8`；`receiptHash=sha256:8d3eb6f32700edeec4b150d32db984cbaa1038636bb27bc4b509fdda8100f953`。

### v2-agent-cell-conservation

- GREEN matrix 覆盖 missing、extra、duplicate、reordered、cross-run、unselected replacement、cross-cell stage swap、arbitrary coherently rehashed producer/review hashes。
- 追加语义 RED：把 module-a/module-b fact 归属连同 analysis、G2 和全部下游 hash 一致性重算时，旧实现错误返回 `success`。
- 修复后同一探针以 `STRICT_TEST_DIMENSION_AGENT_ANALYSIS_CELL_FACT_SCOPE_MISMATCH` 拒绝且不返回 receipt；聚焦测试全部通过。
- runtime probe 的重排 cell 集以 `STRICT_TEST_DIMENSION_AGENT_REVIEW_CELL_SET_MISMATCH` fail closed；两次模型调用后仍 `receiptReturned=false`。

### v2-agent-existing-chain

- 公开入口调用计数：`runtimeBuildCount=1`、`pipelineExecuteCount=1`、Analyst stage=1、Producer stage=1、legacy Analyst/Producer=0。
- `PipelineStrategy` 直接从同一次 `phaseResults` 读取通过的 G1/G2 artifacts；没有第二条 pipeline、没有 post-run model invocation、没有 empty-fact synthetic receipt。
- 测试模式沿用 automatic-selection authority，无用户手选/第二次确认或 legacy bootstrap。

## 验证记录

- `npm run build:check`：通过。
- `npx vitest run test/strict-test-dimension-agent-contract.test.ts test/strict-production-chain.test.ts test/strict-iterative-analysis.test.ts test/public-strict-facades.test.ts`：4 files / 57 tests passed。
- 二次独立只读复审：2 files / 33 tests passed；未发现剩余可操作 P0/P1。
- `npm run probe:strict-test-dimension-agent`：通过；成功、伪造 authority、cell conservation 三条路径结果符合预期。
- `npm run lint`：退出 0；21 条均为任务前既有 warning，无新增 error。
- import/public/Core/space-edge/layer/doctrine/naming/provider-neutral/retired-symbol boundaries：全部通过。
- public signatures：15 exports / 461 bindings；public imports：15 subpaths imported / 11 forbidden rejected。
- validation floor：74 test files / 579 declared test cases / 15 stable public exports。
- `npm test`：73 files passed、1 file failed；619 tests passed、20 failed。20 个失败全部位于未修改的 `test/durable-semantic-review-runtime.test.ts`，共同原因为当前 Core facade 缺少 `createProjectContextFileRef`。这是既有 Core/Agent baseline 导出不一致，不在本任务仓库修改授权内。
- `npm run check` 同样在未修改的 strict consumer smoke 遇到上述 Core export 缺失；此前所有 build/lint/boundary/public-signature 阶段均通过。
- Alembic Guard：当前会话没有可调用的 `alembic_code_guard` 工具，按 skill 约束记录为未运行，没有伪造 Guard 结果。

## 遗留风险与边界

- 离线序列化 receipt 不能单靠公开 hash 证明物理模型调用发生；在线 production 路径通过 `PipelineStrategy` 的同 run 原始 phases、runtime id 和实际 stage result hash 完成绑定，离线 validator 负责防篡改回放验证。
- per-cell producer/review 权威来自既有 `independent_review_gate` 的实际返回 artifact；这满足任务包“实际 selected-cell stage/gate 输出”定义。要求 producer 文本另带一套 per-cell payload 会建立第二套合同，未纳入本包。
- 全量测试的 Core facade 基线问题需由 controller 在 Core/Agent 基线协调范围另行处理；本结果没有越界修复相邻仓库。

## 下一步建议

- Controller 按三项 acceptance anchor 复核本 commit 与 runtime JSON；如接受，再决定后续消费者接入。
- 在后续 Core/Agent 基线同步包中恢复 `createProjectContextFileRef` public facade 后，重跑 `npm run check` 与全量 `npm test`。
