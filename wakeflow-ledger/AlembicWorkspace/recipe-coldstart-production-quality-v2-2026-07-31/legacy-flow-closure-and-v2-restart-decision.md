# Recipe 冷启动生产质量 V2 — 旧流程关闭与新流程重建决策

- Decision date: 2026-07-31
- Decision owner: user
- New flow: Wakeflow 0.9.1 mainline demand

## User Decision

用户明确要求停止继续修补旧 Wakeflow demand 的状态关系，将当前实现、验收和缺陷证据保留为历史事实；旧 demand 按未完成流程诚实关闭，后续剩余工作重新建立为 Wakeflow 0.9.1 新版本任务流程。

这项决策替代旧 Requirement Design 中“只能继续使用原有单一 demand/state root、不得建立第二个 demand”的流程分区约束。它只改变任务承载与状态机版本，不改变 Recipe 冷启动产品目标、完成定义、仓库职责、非目标或 Test 门。

## Preserved Authority

- 产品目标、范围、非目标和最终完成定义继续以 `Design/docs/current/recipe-coldstart-production-quality-original-plan-2026-07-15.md` 为准。
- 生产链、状态机、仓库职责和 Test 决策继续以 `Design/docs/current/recipe-coldstart-production-quality-requirement-design-2026-07-15.md` 为准，但其中禁止建立新 demand 的旧流程约束由本决策替代。
- 旧 demand 中 controller 已接受的 commits、结果和原始证据是 V2 的可复用基线；V2 不重复实现已接受历史，也不把未接受结果升级为已接受。
- AlembicCore `0815eb24944ea0ab3d4f4e2390205fbfe35f59f0` 是当前 strict-test 自动维度选择的已接受上游基线。
- AlembicAgent `7dfb4bada72d78a5bc9e65cafa54574cb36ae698` 是待修复基线，不是当前 Agent 链路完成证明。

## Legacy Demand Disposition

旧 demand `recipe-coldstart-production-quality-2026-07-15` 必须记录为 `cancelled` / `superseded-by-v2`，不能记录为 `completed`：它仍有未接受任务，并且 controller 已确认 AgentService/PipelineStrategy 成功运行与返回的 `StrictTestDimensionAgentExecutionReceiptV1` 不属于同一次真实执行。

取消与归档不执行 acceptance，不改变任何 task 的最后诚实状态，不删除原始审计证据。旧 demand 的可移植归档用于释放 mainline；含本机标识的原始副本继续保留在本地审计层。

## V2 Entry Scope

V2 从当前第一个已验证阻塞点开始：只在 AlembicAgent 现有真实 `AgentService → generate-dimension → AgentStageFactoryRegistry → PipelineStrategy` 链上，把自动选择 authority、实际 stage/gate 结果与一个同 run、同 authority、同 selected-cell set 的 canonical execution receipt 连成一条链。

首包不得扩展到 Alembic Main、Dashboard、DaemonJob、Plugin、持久化、serving、生产冷启动 UI、legacy bootstrap 或手工确认。禁止建立第二条 Agent pipeline，禁止成功运行后再用合成输入拼出独立 receipt。

后续包只由 controller 根据首包真实验收结果，按生产者到消费者顺序建立；现有已接受历史不因 V2 重建而自动重跑。

## Completion Definition

V2 完成仍以原始需求最终完成定义为准，并增加以下迁移约束：

1. 已接受旧证据作为可核验基线被继承，未接受旧证据保持未接受。
2. AlembicAgent 的成功实际运行直接返回同一次执行生成的 canonical strict-test execution receipt；authority、run、selected cells、facts、analysis、expressions、reviews 和 dispositions 全部同源。
3. controller 在需要时重建并验收受影响的下游 exact artifacts，完成原始生产者/消费者链的自检。
4. 所有 V2 必需非 Test target 接受后，才允许恢复真实 Test；Test 仍需用户再次明确开始并使用原 Requirement Design 的环境与顺序。
5. 只有原始最终完成定义和所需 Test 全部满足时，V2 demand 才能标记 `completed`。

## Test Boundary

当前不建立或派发 Test task/card。旧 Test 观察不能补充 controller 缺失证明。必须先完成 V2 非 Test 链路修复、controller 自验和 exact artifact 验证，再由用户明确启动真实 MR-ALEMBIC / SP-BILIDILI 场景。
