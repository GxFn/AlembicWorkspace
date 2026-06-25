# Codex Automation Closed Loop Stage 0 - Reset and Rewrite

日期：2026-05-29
状态：Stage 5 旧 VAD 退场完成 / 待恢复 PCVM Wave 6D 验收
发送给：无

总控定位：本文件是 `CODEX-AUTOMATION-CLOSED-LOOP-2026-05-29` 的当前总控计划。最新用户指令已经推翻“在旧 VAD 上继续修补”的路线；本轮只做 Stage 0 重新裁决、架构边界和重写路线，不承载产品实现。

## 最新用户指令

2026-05-29 用户明确纠偏：

```text
现在不管你写的那些残次代码，不考虑你的实现，那些都推倒；重新做 Stage 0，然后完全重写逻辑，我对现在的 VAD 很不满意，全都不要
```

总控裁决：

- 最新指令覆盖此前“保留现有入口、在 `visible-dispatch.mjs` 内拆函数”的 Stage 0 结论。
- 当前 VAD 实现不再作为新设计基础；不得继续沿 `claim / finish / chain-next / enqueueFromPlan / buildTaskPrompt / buildArmPayload` 做补丁。
- 旧实现只能作为事实库存读取：判断哪些工具能力可拆出复用，不能把它当架构约束。
- 当前所有未提交的旧 VAD 方向代码修改，在后续实现前必须被替换、删除或重写；不得直接提交为本需求结果。

## 目标判断

- 用户目标：建立一套 Codex 内部多窗口闭环自动化能力，让总控可以 `1 -> N` 派发给多个子窗口，多个子窗口完成后 `N -> 1` 回到总控，由总控验收、打回、补证、继续下一阶段或停止。
- 最终完成定义：
  - 总控是唯一计划、派发、验收和下一阶段裁决面。
  - 自动化层只做投递、保活、一次性唤醒、失败回报和必要回跳。
  - 子窗口只执行自己收到的任务，返回 compact result envelope，不代领、不转派、不验收其它窗口。
  - 总控能聚合结果、pull 原始证据并决定 `accepted / rework / blocked / next-wave / stop`。
  - 手动复制提示词和自动化投递提示词分层；自动化提示词不再展示机制名和命令手册。
- 当前是否达到：本计划的重置 / 重写 / 本地闭环 smoke / 旧 VAD 退场目标已达到；真实多窗口 heartbeat 产品任务验证不在本轮范围内，后续若继续自动化能力增强需另起真实 delivery smoke 或下一阶段计划。
- 当前任务分区：Design 交接接收 + 规则治理 / skill 治理 + 架构重置。
- 当前第一阻塞点：总控账本和后续实现路线还残留旧 VAD 补丁思路，必须先改为“重写”裁决，避免继续在错误实现上投入。
- 不纳入本轮：不改产品仓库；不派 `AlembicTest`；不创建 heartbeat；不恢复 PCVM Wave 6D；不做真实多窗口 smoke。

## Design / 需求来源

- `AlembicDesign/docs/current/workspace-handoff-board.md`
- `AlembicDesign/docs/current/codex-automation-closed-loop-original-plan-2026-05-29.md`
- `AlembicDesign/docs/current/codex-automation-closed-loop-requirement-design-2026-05-29.md`
- `AlembicDesign/docs/current/codex-automation-closed-loop-rule-unification-2026-05-29.md`
- `AlembicDesign/docs/current/automation-flow-current-state-research-2026-05-29.md`

Design 已确认的核心方向仍有效：

- 这是 Codex 内部 `controller fan-out + child converge + controller review` 闭环。
- 人工复制提示词保持通用；自动化提示词由总控按目标窗口生成。
- VAD / 自动化层不应该成为第二总控。
- target-courier 不应是普通路径默认。
- 子窗口结果只是证据索引，总控必须 pull evidence 验收。

最新用户补充改变的是实现策略：不再以旧 VAD 为基础渐进优化，而是完全重写逻辑。

## 总控决策记录

- 本次决策触发：用户最新指令明确否定当前 VAD 实现和补丁路线，要求重新做 Stage 0 并完全重写逻辑。
- 需求 / 测试结果理解：当前问题不是提示词长度单点问题，而是旧 VAD 把总控派发、投递、子窗口执行、回跳和验收混成一套脚本状态机，导致总控职责被脚本侵占、子窗口职责不清、提示词机制名过重、JS 执行后推进边界不清。
- 已核对证据：Design 原始计划、需求设计、规则统一补充、当前总控计划和 workspace index/status；这些证据足以裁决 Stage 0 路线重置，不需要真实项目测试。
- 是否需要先验证 / 重新计划 / 用户确认：用户已直接确认推翻旧实现并重做 Stage 0；本轮不再询问是否重写。后续若 Stage 1 需要删除旧命令或改变外部使用方式，再按确认门禁判断。
- 本次允许更新：`.wakeflow-active/current/` 当前计划、index/status、TODO 账本；下一步允许只读检查 `codex-control-workspace` 未提交变更并生成隔离清单。
- 本次不得更新：产品子仓库源码、真实测试项目、真实 heartbeat、子窗口任务和 PCVM Wave 6D 验收结论。
- 与当前 PCVM 主线关系：PCVM Wave 6D 暂停在待验收，不关闭、不归档；CODEX-AUTOMATION Stage 0 完成后再恢复。

## Stage 0 重置裁决

### 废弃旧 VAD 作为架构基础

以下旧概念从新架构中移除，不再作为核心路径：

- `enqueueFromPlan` 从 current plan 自动解析发送窗口并生成任务。
- `claim / finish / chain-next` 作为目标窗口的核心人机流程。
- `buildTaskPrompt` 在投递层生成目标任务提示词。
- `buildArmPayload` 同时做 readiness、prompt 生成和 heartbeat payload 组装。
- 子窗口默认 target-courier 续跳。
- 脚本输出的 `agentNext` / `review` / `completed` 替代总控裁决。
- 自动化提示词以 `VAD` / `Visible Automation Dispatch` 机制名开头。
- 普通 happy path 默认跑完整 preflight / audit / verify / registry deep check。

可在新实现中重新拆出的工具能力：

- 本地 thread registry，但必须改名为 delivery registry，且只保存本地真实 thread id。
- 本地防睡眠能力，但只能作为 delivery support。
- automation run log / record-stop，但只能表达投递消费或停止原因。
- diagnostics / audit，但只在失败、冲突、高风险或用户要求时使用。
- staggered heartbeat 创建，但只作为 delivery adapter 的调度参数。

### 新架构分层

新系统暂命名为 `CodexAutomationClosedLoop`，实现上可以后续命名为 `codex-automation-loop` 或同类中性名称；不再把产品化入口命名绑定到旧 VAD。

1. **Controller Planning Layer**
   - 读取 current plan / TODO / Design handoff。
   - 判断用户目标、完成定义、窗口覆盖、producer / consumer 依赖。
   - 生成每个目标窗口的 `ControllerDispatchPacket`。

2. **Delivery Adapter Layer**
   - 接收总控已经生成好的 `DeliveryEnvelope`。
   - 按目标窗口 thread id 创建 Codex heartbeat。
   - 负责 keep live、one-shot、delivery log 和失败回报。
   - 不解析 current plan，不生成 prompt，不判断任务顺序。

3. **Target Execution Protocol**
   - 子窗口收到目标化 prompt。
   - 只执行当前窗口任务。
   - 返回 `TargetResultEnvelope`。
   - 不自动创建下一跳，除非总控明确给出特殊 opt-in。

4. **Controller Review Layer**
   - 聚合 N 个子窗口结果。
   - pull commit / diff / command output / runtime JSON / report / screenshot 等原始证据。
   - 裁决接受、打回、补证、下一阶段、停止或等待用户确认。

## 新数据契约草案

### ControllerDispatchPacket

```ts
type ControllerDispatchPacket = {
  id: string;
  targetWindow: string;
  taskId: string;
  dispatchGroup?: string;
  controlPlan: string;
  objective: string;
  scope: string[];
  forbidden: string[];
  evidenceRequired: string[];
  resultContract: "target-result-envelope-v1";
  contextPolicy: "assumed-current" | "refresh-if-missing" | "force-refresh";
  prompt: string;
};
```

### DeliveryEnvelope

```ts
type DeliveryEnvelope = {
  deliveryId: string;
  targetWindow: string;
  prompt: string;
  returnRoute: "controller" | "none";
  oneShot: true;
  keepLive: boolean;
  correlationId: string;
  schedule?: {
    kind: "heartbeat";
    rrule: string;
    staggerSeconds?: number;
  };
};
```

### TargetResultEnvelope

```ts
type TargetResultEnvelope = {
  targetWindow: string;
  taskId: string;
  dispatchGroup?: string;
  status: "completed" | "blocked" | "needs-review";
  changedRepos: string[];
  commits?: string[];
  evidenceRefs: string[];
  verificationSummary: string[];
  riskSummary: string[];
  nextSuggestion?: string;
};
```

### ControllerReviewDecision

```ts
type ControllerReviewDecision = {
  dispatchGroup?: string;
  taskId?: string;
  decision: "accepted" | "rework" | "blocked" | "needs-evidence" | "next-wave" | "stop";
  evidenceReviewed: string[];
  reason: string;
  nextAction?: string;
};
```

这些契约是 Stage 0 设计草案，不代表已实现 API。Stage 1 实现前允许继续调整命名和字段。

## 状态机

### 任务状态机

```text
planned
-> dispatched
-> running
-> result-reported
-> reviewing
-> accepted | rework | blocked | needs-evidence | stopped
```

任务状态归总控所有。子窗口不能把 `result-reported` 直接写成 `accepted`。

### 投递状态机

```text
created
-> armed
-> received
-> consumed
-> returned | expired | failed | stopped
```

投递状态只说明 heartbeat / delivery 是否完成，不说明任务是否完成。

### 自动化模式状态机

```text
off
-> active
-> draining
-> off
```

- `active`：允许创建新 delivery。
- `draining`：不再创建新 delivery，但允许已投递窗口回填。
- `off`：不创建、不续跳、不自动回跳。

## 新实现路线

### Stage 0A：重置总控账本

目标：把当前计划从“旧 VAD 补丁式优化”改为“CodexAutomationClosedLoop 重写”。

完成条件：

- 当前计划写明旧 VAD 不再作为架构基础。
- TODO / index / status 同步为 Stage 0 reset。
- 明确本轮不碰产品仓库、不创建 heartbeat、不派子窗口。

### Stage 0B：旧实现隔离清单

目标：读取当前未提交变更和旧 VAD 入口，只做分类，不继续实现。

分类：

- `discard`：必须删除或重写。
- `salvage-utility`：可拆为中性工具。
- `diagnostic-only`：只能作为失败诊断。
- `keep-doc-only`：只保留历史说明或迁移证据。

完成条件：

- 生成一份隔离清单。
- 明确哪些旧改动不能提交。

## Stage 0B 旧实现隔离清单

只读检查命令：

```text
git -C codex-control-workspace diff --stat
git -C codex-control-workspace diff --name-only
rg -n "enqueueFromPlan|buildTaskPrompt|buildArmPayload|buildControllerReturnPrompt|buildFinishChain|claim|finish|chain-next|start-plan|resume-plan|stop-plan|record-stop|record-arm|keepAwake|audit-automation|post-run-audit|scriptComplete|agentNext|arm-batch|controller-tick|group-status" scripts/visible-dispatch.mjs
```

当前未提交旧方向涉及 13 个 tracked 文件：

- `AGENTS.md`
- `scripts/README.md`
- `scripts/check-dispatch-coverage.test.mjs`
- `scripts/import-design-handoffs.mjs`
- `scripts/run-workspace-pipeline-e2e.mjs`
- `scripts/visible-dispatch.mjs`
- `scripts/visible-dispatch.test.mjs`
- `skills/dev/control-workspace-governance/SKILL.md`
- `skills/dev/control-workspace-governance/references/window-dispatch.md`
- `skills/dev/visible-automation-dispatch-controller/SKILL.md`
- `skills/dev/visible-automation-dispatch-target/SKILL.md`
- `templates/phased-migration-command-template.md`
- `templates/workspace-control-plan-template.md`

这些未提交修改不得按旧方向直接提交。后续只能按下列分类处理：

### discard

必须删除、重写或从新入口绕开：

- `visible-dispatch.mjs` 中以 current plan 解析为核心的 `enqueueFromPlan`。
- `visible-dispatch.mjs` 中由投递脚本生成任务提示词的 `buildTaskPrompt` / `buildControllerReturnPrompt`。
- `visible-dispatch.mjs` 中把 readiness、prompt 生成和 heartbeat payload 混在一起的 `buildArmPayload`。
- 目标窗口把 `claim / finish / chain-next` 当成核心操作协议的流程。
- `agentNext` / `scriptComplete` 被当作 Agent 推进提示或验收提示的路径。
- skill / README / template 中继续把 VAD 机制名、命令手册和任务正文混在同一提示词里的描述。

### salvage-utility

可以拆出来作为新系统工具，但不能保留旧职责：

- thread registry：改为 delivery registry，只保存本地真实 thread id。
- keep-awake：作为 delivery support，不参与任务拆分和验收。
- staggered heartbeat create：作为 delivery adapter 调度参数。
- automation run log / record-stop：只表达 delivery 消费、停止或失败，不表达任务完成。
- `import-design-handoffs.mjs` 对 Design 状态和确认文案的兼容：可保留为 Design 接收工具，但需要单独验证，不属于 VAD 核心。

### diagnostic-only

只能作为异常诊断或高风险任务工具，不进入普通 happy path：

- `preflight`
- `audit-automation`
- `post-run-audit`
- registry deep audit / stale session 检查
- full workspace verify
- current plan 全文重解析
- 旧 `group-status` / `controller-tick` 若保留，必须归入 controller diagnostics，不再作为每次提示词必备命令。

### keep-doc-only

只作为历史证据或迁移背景，不指导新实现：

- 旧 VAD archive。
- 旧 VAD requirement design。
- 当前 skill 中关于旧 claim / finish / target-courier 的详细命令手册。

Stage 0B 结论：新实现不能从 `visible-dispatch.mjs` 内部继续拆补丁。正确路线是新建清晰层次的闭环入口，旧脚本最多在迁移期被标为 legacy，然后按功能拆出工具模块或删除。

### Stage 1：新闭环最小设计

目标：设计新的脚本 / 模块边界。

候选入口：

- `scripts/codex-automation-loop.mjs`：新闭环控制脚本。
- `scripts/delivery-adapter.mjs` 或内部模块：只负责 heartbeat payload / run log / keep live。
- 旧 `visible-dispatch.mjs` 暂时标为 legacy，不作为新入口。

完成条件：

- 定义命令语义：`plan-dispatch`、`deliver`、`submit-result`、`review-results`、`stop-loop`。
- 每个命令只属于一个层，不混合总控裁决与投递动作。

### Stage 2：实现重写

目标：从新脚本 / 新模块开始实现，不在旧 VAD 上局部修补。

完成条件：

- 新 contracts 有 unit tests。
- 新命令可以 dry-run 生成 dispatch packet / delivery envelope。
- delivery 不解析 current plan；只消费已有 prompt。
- controller review 不信任 result envelope，必须指向 evidence pull。

### Stage 3：规则与 skill 重组

目标：同步 `AGENTS.md`、target/controller skill、workspace governance reference 和模板。

完成条件：

- `AGENTS.md` 保留硬规则和停止卡。
- skill 承接命令细节和排错。
- 自动化 prompt 首行是任务语义，不是机制名。
- 子窗口 `AGENTS.md` 明确自己的窗口范围、result envelope 和不代领边界。

### Stage 4：闭环验证

目标：先 fake TODO / fake target 做完整闭环，再真实 heartbeat smoke。

完成条件：

- fake TODO：总控生成 N 个 dispatch packet，delivery dry-run，result envelope 回收，controller review 裁决。
- real heartbeat：只验证投递 / 一次性消费 / 回跳，不混入产品任务。
- 失败时进入 diagnostics，不把重校验放进 happy path。

### Stage 5：旧 VAD 退场

目标：删除或归档旧命令、旧 skill、旧文档中的核心路径描述。

完成条件：

- 不保留兼容别名。
- README / scripts index / skills index 指向新入口。
- 旧 VAD 历史归档只作为背景，不再指导新任务。

## 当前任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| CODEX-AUTO-S0A-RESET | `AlembicWorkspace` | 重写 Stage 0 裁决，推翻旧 VAD 补丁路线，建立新闭环架构边界。 | 已完成 |
| CODEX-AUTO-S0B-LEGACY-ISOLATION | `AlembicWorkspace` | 对当前旧 VAD 相关未提交修改和旧入口做隔离清单。 | 已完成 |
| CODEX-AUTO-S1-NEW-LOOP-DESIGN | `AlembicWorkspace` | 设计新闭环脚本 / 模块边界，准备从新入口实现。 | 已完成 |
| CODEX-AUTO-S2-MINIMAL-IMPLEMENTATION | `AlembicWorkspace` | 新增 `codex-automation-loop.mjs` 最小 contract surface 与单元测试，不再把旧 VAD 作为核心协议。 | 已完成 |
| CODEX-AUTO-S3-RULE-SKILL-SWITCH | `AlembicWorkspace` | 将 `AGENTS.md`、skill map、脚本索引和模板默认指向新闭环；旧 VAD 仅作为 legacy 诊断 / 退场参考。 | 已完成 |
| CODEX-AUTO-S4-LOCAL-SMOKE | `AlembicWorkspace` | 用临时 root 跑 register-thread -> dispatch -> delivery -> result -> review 本地闭环。 | 已完成 |
| CODEX-AUTO-S5-LEGACY-RETIREMENT | `AlembicWorkspace` | 删除或归档旧 VAD 核心路径、旧技能入口和旧测试依赖，保留必要历史证据。 | 已完成 |

### CODEX-AUTO-S0A-RESET

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 19:28 CST

阶段目标：

- 根据最新用户指令重做 Stage 0。
- 改写当前计划，删除“保留旧入口、拆函数即可”的错误路线。
- 建立新闭环逻辑、数据契约和阶段路线。

主线动作：

- 重读 Design handoff 和当前总控入口。
- 裁决旧 VAD 不再作为架构基础。
- 定义 Controller Planning / Delivery Adapter / Target Result / Controller Review 四层边界。
- 定义最小数据契约和状态机。
- 同步当前计划到 index/status。

合并 TODO / 可一起关闭的 TODO：

- `CODEX-AUTOMATION-CLOSED-LOOP-2026-05-29`：从旧 VAD 补丁路线改为重写路线。

明确不包含：

- 不改产品仓库。
- 不创建 heartbeat。
- 不派 `AlembicTest`。
- 不提交旧 VAD 方向未完成代码。
- 不恢复 PCVM Wave 6D。

下一处真实阻塞点：

- 需要对旧 VAD 相关未提交修改和旧入口做隔离清单，分出 `discard` / `salvage-utility` / `diagnostic-only` / `keep-doc-only`。

阻塞点之前还能做：

- 完成当前计划重置、index/status 同步和文档结构校验。

验证命令：

```text
cd codex-control-workspace && node scripts/sync-current-plan.mjs --plan .wakeflow-active/current/codex-automation-closed-loop-stage-0-rule-governance-2026-05-29.md --write
cd codex-control-workspace && node scripts/verify-control-center.mjs --require-todo --require-task-packages
```

回填要求：

- 写明 Stage 0 重置结论。
- 写明旧实现废弃范围。
- 写明下一步 S0B 隔离清单。

执行前置硬规则：

- 先读取父级 `AGENTS.md`、workspace index/status 和当前计划。
- 本任务由总控窗口自执行，当前窗口定位是 `AlembicWorkspace` 总控，不是产品子仓库窗口。
- 若后续任务派发给子窗口，子窗口必须先读取目标仓库 `AGENTS.md` 并明确窗口 / 仓库职责；本任务当前不派发子窗口。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CODEX-AUTOMATION-CLOSED-LOOP-2026-05-29 | Stage 5 旧 VAD 退场完成 / 待恢复 PCVM | automation closed loop rewrite | P1 | `codex-control-workspace` | 推倒旧 VAD 补丁路线，重新设计 CodexAutomationClosedLoop：总控计划与验收、delivery adapter 投递、子窗口 result envelope、controller review。 | 是 | 用户最新指令：旧 VAD 全部不要，重做 Stage 0 并完全重写逻辑。 | `AlembicWorkspace` |
| GTODO-2026-05-25-003 | 暂停 / 待总控验收 | agent / llm optimization loop | P0 | PCV source / `Alembic` / `AlembicAgent` / `AlembicTest` | PCVM Wave 6D 已回填，等待总控验收 canonical node identity after-run 缺口。 | 是 | CODEX-AUTOMATION 临时插入；不得关闭或改写 PCVM 结论。 | 总控后续恢复 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 无任务 | 否 | 本轮不改产品底座源码。 |
| `AlembicCore` | 无任务 | 否 | 不下沉 shared contract。 |
| `AlembicAgent` | 无任务 | 否 | 不改 Agent runtime。 |
| `AlembicDashboard` | 无任务 | 否 | 不做 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不改 Plugin。 |
| `AlembicDesign` | 观察中 | 否 | Design handoff 已接收，最新用户指令由总控裁决。 |
| `AlembicTest` | 无任务 | 否 | 不需要真实场景测试。 |
| `BiliDili` | 无任务 | 否 | 真实测试项目不涉及。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>无任务 | 不改产品底座源码。 |
| `AlembicCore`<br>无任务 | 不下沉 shared contract。 |
| `AlembicAgent`<br>无任务 | 不改 Agent runtime。 |
| `AlembicDashboard`<br>无任务 | 不做 UI。 |
| `AlembicPlugin`<br>无任务 | 不改 Plugin。 |
| `AlembicDesign`<br>观察中 | `CODEX-AUTOMATION-CLOSED-LOOP-2026-05-29` 已 ready-for-workspace，最新用户指令由总控接收重置 Stage 0。 |
| `AlembicTest`<br>无任务 | 不需要真实场景测试。 |
| `BiliDili`<br>无任务 | 受保护真实项目不涉及。 |

## 可复制提示词

发送给：无（总控自执行，不派发子窗口）

```text
无
```

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：本轮只做 workspace 自动化架构重置和文档账本纠偏，不依赖真实项目。
- 不能推出的结论：不能证明新闭环已实现，不能证明真实 heartbeat 可用。
- 后续真实 smoke：Stage 4 单独创建，不能提前混入 Stage 0。

## 回填区

- 2026-05-29 18:10 CST：总控接收 Design `CODEX-AUTOMATION-CLOSED-LOOP-2026-05-29`。初始方向曾错误地选择“在旧 VAD 内拆函数、保留入口”。
- 2026-05-29 19:28 CST：用户明确推翻旧实现和补丁路线，要求重新 Stage 0 并完全重写逻辑。总控据此重写当前计划：旧 VAD 不再作为架构基础；下一步先做旧实现隔离清单，再进入新闭环最小设计。
- 2026-05-29 19:28 CST：总控完成 S0B 只读隔离清单。结论：旧 VAD 的 queue / prompt builder / claim-finish-chain / controller-return / audit 不能继续作为核心路径；thread registry、keep-awake、stagger、record-stop 只能拆成 delivery support 或 diagnostics。
- 2026-05-29 20:18 CST：总控完成 S1/S2 最小新闭环实现：新增 `scripts/codex-automation-loop.mjs` 与 `scripts/codex-automation-loop.test.mjs`，支持 `register-thread`、`create-dispatch`、`build-delivery`、`submit-result`、`review-results`、`stop-loop`；脚本只管理 thread registry、packet/envelope/result/stop marker，不解析 current plan、不 claim 目标任务、不创建 Codex automation、不接受证据。`build-delivery --require-thread` 可把本地真实 thread id 写入 ignored delivery envelope，命令输出默认 redacted。
- 2026-05-29 20:18 CST：开始 S3 规则切换：新增 `skills/dev/codex-automation-controller/`、`skills/dev/codex-automation-target/` 和 `control-workspace-governance/references/codex-automation-loop.md`；`AGENTS.md` 与脚本索引已改为新闭环默认路径，旧 `visible-dispatch` 标记为 legacy 诊断 / 退场参考。
- 2026-05-29 20:18 CST：验证通过：`node --test scripts/codex-automation-loop.test.mjs scripts/workspace-control.test.mjs`、`node scripts/check-script-docs.mjs`、`node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests`。总控验证显示 121 个 workspace script tests 全部通过。
- 2026-05-29 20:45 CST：完成新闭环临时 root smoke（不创建真实 heartbeat）：`register-thread -> create-dispatch -> build-delivery --require-thread -> review-results(wait) -> submit-result -> review-results(needs-controller-review)`。结论：新状态机可以从本地 thread registry 到 delivery envelope，再到 result envelope 聚合；最终仍停在总控拉原始证据裁决，没有脚本自动接受。
- 2026-05-29 21:24 CST：完成 S5 旧 VAD 退场。删除 `scripts/visible-dispatch.mjs`、`scripts/visible-dispatch.test.mjs`、`skills/dev/visible-automation-dispatch-controller/`、`skills/dev/visible-automation-dispatch-target/` 和旧 `visible-automation-dispatch.md` reference；`workspace-control.mjs` 不再接受 `vad` 命令并由测试覆盖 fail closed；`README`、`scripts/README.md`、`skills/README.md`、`AGENTS.md`、安装生成块、测试边界、分派覆盖和模板状态均切到 `Codex Automation Closed Loop` / `codex-automation-loop.mjs`。验证通过：`node scripts/check-script-docs.mjs`、`npm test`、`node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests`；旧机制扫描 `visible-dispatch|Visible Automation Dispatch|VAD|visible-automation|已 arm` 在总控可执行面、规则面和 README 中无残留。真实多窗口 heartbeat 不属于本轮 S5，后续如需验证应另起小型 delivery smoke。

<!-- workspace-sync
{
  "status": "CODEX-AUTOMATION Stage 5 旧 VAD 退场完成 / 待恢复 PCVM Wave 6D 验收",
  "indexPlanDescription": "Codex Automation Closed Loop 已完成 Stage 0 重置、S0B 旧实现隔离、S1/S2 新脚本最小实现、S3 规则切换、S4 本地闭环 smoke 和 S5 旧 VAD 退场；后续恢复 PCVM Wave 6D 验收。",
  "indexStatusDescription": "当前状态：CODEX-AUTOMATION Stage 5 旧 VAD 退场完成；PCVM Wave 6D 暂停在待验收，不关闭不归档，后续恢复验收。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "CODEX-AUTOMATION Stage 0：推倒旧 VAD 补丁路线，重新定义总控闭环、delivery adapter、target result envelope 和 controller review。",
  "currentStatusSummary": "CODEX-AUTOMATION 已完成新闭环最小脚本、规则切换、本地闭环 smoke 和旧 VAD 退场；总控自执行，不派产品窗口；后续恢复 PCVM Wave 6D 验收。",
  "indexRows": [
    {
      "type": "Codex Automation Closed Loop Stage 0",
      "doc": ".wakeflow-active/current/codex-automation-closed-loop-stage-0-rule-governance-2026-05-29.md",
      "status": "Stage 5 旧 VAD 退场完成 / 待恢复 PCVM",
      "description": "已按用户最新指令推翻旧 VAD 补丁路线，完成新闭环最小脚本、skill/reference 切换、本地闭环 smoke 和旧 VAD 退场。"
    },
    {
      "type": "PCVM Wave 6D canonical node after-run",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-6d-canonical-node-after-run-2026-05-29.md",
      "status": "暂停 / 待总控验收",
      "description": "PCVM Wave 6D 已回填，因 CODEX-AUTOMATION 新需求临时暂停；后续恢复验收。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "Codex Automation Closed Loop Stage 0",
      "doc": ".wakeflow-active/current/codex-automation-closed-loop-stage-0-rule-governance-2026-05-29.md",
      "description": "旧 VAD 已从可执行脚本、workspace-control 映射、skill 入口、README 和模板规则中退场；新入口 `codex-automation-loop.mjs` 已提供 thread registry / packet / delivery / result / review / stop 最小闭环，并通过本地 smoke。"
    }
  ]
}
-->
