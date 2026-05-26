# Plugin Intent Knowledge Route Wave 0

日期：2026-05-26
状态：GTODO-2026-05-24-037 Wave 0 执行中，AlembicPlugin 第一跳已 arm
发送给：`AlembicPlugin`、`Alembic`、`AlembicCore`
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：接收 AlembicDesign 已确认的 `GTODO-2026-05-24-037`，把 Plugin 意图同步、意图知识注入和检索链路增强准备成可由 Visible Automation Dispatch 自动推进的当前主线。
- 最终完成定义：037 最终应形成 `prime` 快速路径的结构化意图识别、跨会话 `IntentEpisode` 连续性、意图驱动 search / vector / relation 排序、保留 source refs 的 `PrimeInjectionPackage`，并由后续真实项目验证证明注入有价值。
- 当前是否已经达到：未达到。Design 已完成需求确认，但总控尚未完成代码事实基线和阶段 1 入口实现计划。
- 未达到时剩余差距：先确认真实代码链路：Plugin MCP metadata 和 prime schema、IntentState / episode 存储、Alembic resident / local Qwen / search / source refs、Core contract 边界。代码事实未回填前，不派发实现。
- 已达到时验收 / 归档判断：当前未达到，不归档。Wave 0 只验收代码事实基线是否足以启动 Stage 1-2。
- 当前任务分区：Design 交接接收 + 分配计划 + 自动化准备。
- 不纳入本轮事项：不启动 `GTODO-2026-05-24-038` / `039`；不做 Dashboard UI；不做 Agent prompt 优化；不跑真实项目 / cold-start / rescan；不让 `AlembicTest` 承接本轮。

## 总控决策记录

- 本次决策触发：用户说明已在 `AlembicDesign` 确认 `GTODO-2026-05-24-037`，要求总控接收并准备自动化，准备好后由用户开启。
- 需求 / 测试结果理解：Design handoff board 中 `INTENT-RECOGNITION-2026-05-26` 与 `INTENT-KNOWLEDGE-2026-05-26` 均为 ready-for-workspace，二者共同构成 037；`KNOWLEDGE-EVOLUTION-TODOS-2026-05-26` 只是 037 -> 038 -> 039 顺序索引，不是执行需求。
- 已核对证据：`AlembicDesign/docs/current/workspace-handoff-board.md`、两个需求设计文档、`docs/workspace/current/global-todo-board.md`、当前 VAD runtime status、旧 Wave 9 / Wave 10 visible-dispatch 队列。
- 是否需要先验证 / 重新计划 / 用户确认：不需要额外用户确认才能接收 037；需要先做 Wave 0 代码事实基线，不能直接派发实现。旧 VAD smoke 队列已在本地 runtime 中裁决为 smoke accepted / superseded，避免开启后误跑旧任务。
- 本次允许更新：Design handoff inbox、当前总控计划、当前索引 / 状态同步、`GTODO-2026-05-24-037` 当前挂载状态、visible-dispatch 本地 runtime 队列。
- 本次不得更新：不得改产品源码；不得提交或写入子仓库；不得把 038 / 039 加入自动化；不得把代码事实调研写成实现完成；不得派发 `AlembicTest` 做总控可自测的事情。

## Design / 需求来源

- 来源类型：AlembicDesign handoff。
- 来源文档：
  - `AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md`
  - `AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md`
  - `AlembicDesign/docs/current/knowledge-evolution-todos-requirement-design-2026-05-26.md`
- 用户确认状态：用户已确认 037 进入自动化；038 / 039 暂不开始。
- 总控接收结论：接收 `INTENT-RECOGNITION-2026-05-26` 和 `INTENT-KNOWLEDGE-2026-05-26` 作为同一 037 主线；先做 Wave 0 代码事实，不派发实现。
- 是否需要目标阶段确认：本计划先承载 037 的阶段顺序和 Wave 0；如果 Wave 0 发现代码边界或完成定义与 Design 冲突，再补目标阶段确认或暂停用户确认。
- 是否需要代码实现依赖调研：需要。本轮就是 Stage 0 代码事实基线。

## 代码事实与边界

- 相关仓库：`AlembicPlugin`、`Alembic`、`AlembicCore`；`AlembicDashboard` 与 `AlembicAgent` 本轮观察；`AlembicTest` 后续 Stage 6 才可能参与。
- 关键入口：
  - `AlembicPlugin`：Codex MCP tool schema、`alembic_task prime` 参数、MCP request metadata 到 handler / context 的传递、IntentExtractor / PrimeSearchPipeline / IntentState。
  - `Alembic`：daemon / resident service、local Qwen 或本地 refinement 可用性、search / semantic / source refs / Recipe evidence 返回路径、ProjectScope storage。
  - `AlembicCore`：ProjectScope、knowledge / Recipe / source refs、可能的 shared contract 边界。
- producer / consumer 依赖：Stage 1-2 的 producer 是 `AlembicPlugin` 的 `RecognizedIntentDraft` / `IntentEpisode`；Stage 3-5 的 consumer 是 Plugin -> Alembic / Core 知识检索与 prime 注入；下游不得早于上游 contract 和 evidence 稳定前实现。
- 不可提前消费的上游：没有 `RecognizedIntentDraft` / `IntentEpisode` 事实前，不启动 `IntentSearchPlan` / vector / `PrimeInjectionPackage` 实现。
- 不允许触碰的目录 / 仓库：不改产品源码、不改真实测试项目、不写 raw thread id 到 tracked 文档、不把 `.workspace-local/visible-dispatch/` 提交。
- 真实测试项目是否涉及：本轮不涉及。后续 Stage 6 才按真实项目、多会话和 prime 注入价值创建 `AlembicTest` 测试单。

## 阶段顺序

1. Wave 0 / Stage 0：代码事实基线。确认 Plugin host facts、prime schema、metadata、episode storage、Alembic resident / local Qwen / search / source refs、Core shared contract 边界。只产出事实和下一阶段建议。
2. Stage 1：`IntentExtractionFrame` + `RecognizedIntentDraft`。接收可选 `hostDeclaredIntent` / `hostTurnMeta`，合并 deterministic recognizer，产出槽位、置信度、冲突和 evidence spans。
3. Stage 2：`IntentEpisode` 管理。持久化 episode，支持跨会话 `continue / correction / supersede / fork / background`。
4. Stage 3：`IntentSearchPlan` + keyword / BM25。用稳定 intent 生成 lexical queries、filters、negativeSignals 和 ranking profile。
5. Stage 4：vector cosine + relations。用 semantic anchors、intent cosine、relation boost 进入 score breakdown。
6. Stage 5：`PrimeInjectionPackage`。汇总 intent、search、vector、relations、selectedKnowledge、omitted、source refs 和 injection summary。
7. Stage 6：`AlembicTest` 真实验证。只在前序链路具备真实可运行入口后，验证跨会话、纠偏、搜索增强、向量增强、source refs 保留和交付包可用。

- 下一处真实阻塞点：没有 Stage 0 代码事实，不能裁决 `hostDeclaredIntent` / `hostTurnMeta` / episode 存储 / resident refinement 的落点。
- 阻塞点之前还能做：三仓库只读代码事实调研、回填真实入口、缺口和 Stage 1-2 推荐边界。
- 当前可派发窗口：`AlembicPlugin`、`Alembic`、`AlembicCore`。
- 当前阻塞 / 观察窗口：`AlembicDashboard`、`AlembicAgent`、`AlembicTest`。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| G037-W0-PLUGIN-FACTS | `AlembicPlugin` | Plugin host facts、prime schema、MCP metadata、IntentExtractor / PrimeSearchPipeline / IntentState 边界调研。 | 执行中 |
| G037-W0-ALEMBIC-FACTS | `Alembic` | daemon / resident / local Qwen / search / source refs / ProjectScope storage 事实调研。 | 待启动 |
| G037-W0-CORE-FACTS | `AlembicCore` | shared contract、knowledge / source refs / ProjectScope 归属边界调研。 | 待启动 |

### G037-W0-PLUGIN-FACTS：Plugin 代码事实基线

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：等待自动化开启。

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 13:54 CST

阶段目标：

- 只读确认 Plugin 是否能接收 `hostDeclaredIntent`，是否能从 MCP request metadata 构造 `hostTurnMeta`，以及当前 `prime` / IntentState / search pipeline 的真实入口和缺口。

主线动作：

- 读取 Plugin `AGENTS.md`，声明 AlembicPlugin 职责。
- 检查 Codex MCP server / tool handler / schema / context 传参链路，确认 request metadata 是否可下传。
- 检查 `alembic_task prime` 参数和工具说明是否已有 intent 输入位。
- 检查 IntentExtractor、PrimeSearchPipeline、IntentState、ProjectScope / dataRoot 使用情况。
- 给出 Stage 1-2 最小实现建议、应由 Plugin 自己做的部分、需要 Alembic / Core 配合的部分。

合并 TODO：

- `GTODO-2026-05-24-037`：Plugin 意图同步 + 知识注入 / 检索链路增强的上游入口事实。

明确不包含：

- 不改源码；不新增 schema；不实现 intent；不调用真实项目；不创建 `AlembicTest` 任务。

下一处真实阻塞点：

- 如果 Plugin 无法获得 MCP request metadata 或无法扩展 prime schema，需要回填阻塞和可选方案。

阻塞点之前还能做：

- 只读代码定位、现有类型 / handler / tests 搜索、建议下一阶段最小验证命令。

验证命令：

```text
git status --short
rg -n "hostDeclaredIntent|hostTurnMeta|CallToolRequest|McpContext|alembic_task|prime|IntentExtractor|PrimeSearchPipeline|IntentState|thread_id|turn_id" .
```

回填要求：

- 完成范围：
- 代码事实和关键文件：
- 验证命令和结果：
- 当前不能推出的结论：
- Stage 1-2 建议：
- 遗留风险：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

### G037-W0-ALEMBIC-FACTS：Alembic 本地增强链路基线

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：等待自动化开启。

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 13:45 CST

阶段目标：

- 只读确认 Alembic daemon / resident / local Qwen / search / semantic / source refs / ProjectScope storage 如何服务 037 的 intent refinement 和知识消费。

主线动作：

- 读取 Alembic `AGENTS.md`，声明 Alembic 本地增强底座职责。
- 检查 resident service、本地模型 / Qwen 调用或不可用路径、timeout / fallback 现状。
- 检查 search / semantic / vector / Recipe evidence / source refs 返回链路。
- 检查 ProjectScope scoped storage 和可能的 episode 存储落点。
- 给出 Stage 1-5 中 Alembic 应承担的 producer / consumer 边界。

合并 TODO：

- `GTODO-2026-05-24-037`：Alembic 本地增强底座对 intent refinement 与知识消费的依赖事实。

明确不包含：

- 不改源码；不接本地模型；不改 daemon API；不跑 cold-start / rescan。

下一处真实阻塞点：

- 如果当前 Alembic 无 local Qwen / resident refinement 路径，必须说明 fallback 和 Stage 1 是否仍能只靠 Plugin deterministic draft 推进。

阻塞点之前还能做：

- 只读扫描、现有 API / test / fixture 证据定位、下一阶段最小验证建议。

验证命令：

```text
git status --short
rg -n "qwen|local.*model|resident|semantic|vector|cosine|sourceRefs|sourcePath|Recipe|ProjectScope|prime|search" .
```

回填要求：

- 完成范围：
- 代码事实和关键文件：
- 验证命令和结果：
- 当前不能推出的结论：
- Stage 1-5 建议：
- 遗留风险：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

### G037-W0-CORE-FACTS：Core 共享 contract 边界基线

窗口：`AlembicCore`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：等待自动化开启。

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 13:45 CST

阶段目标：

- 只读确认 037 哪些结构应留在 Plugin / Alembic，哪些可能需要成为 Core shared contract，避免提前下沉或错放。

主线动作：

- 读取 Core `AGENTS.md`，声明 AlembicCore 共享确定性内核职责。
- 检查 ProjectScope、knowledge / Recipe / source refs、search contract 或 shared type 现状。
- 判断 `RecognizedIntentDraft`、`IntentEpisode`、`IntentSearchPlan`、`PrimeInjectionPackage` 哪些不应在 Wave 0 下沉，哪些后续可能需要 Core contract。
- 给出 Stage 1-5 的 Core 参与门槛和验证建议。

合并 TODO：

- `GTODO-2026-05-24-037`：Core shared contract 边界候选。

明确不包含：

- 不新增导出；不移动类型；不改 package boundary。

下一处真实阻塞点：

- 如果 source refs / knowledge contract 已有稳定 Core 入口，需要说明下游如何消费；如果没有，不得为了 037 先搭空 contract。

阻塞点之前还能做：

- 只读扫描和边界判断。

验证命令：

```text
git status --short
rg -n "ProjectScope|sourceRefs|sourcePath|Knowledge|Recipe|Search|Vector|Intent|Prime" .
```

回填要求：

- 完成范围：
- 代码事实和关键文件：
- 验证命令和结果：
- 当前不能推出的结论：
- Core 是否应参与 Stage 1-5：
- 遗留风险：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-037 | 当前主线 / Wave 0 准备完成 | plugin intent knowledge route | P1 | `AlembicPlugin` / `Alembic` / `AlembicCore` | Plugin 意图同步，以及意图下面的知识注入与知识检索链路优化增强。 | 是 | 用户确认 Design 037；本轮只做代码事实基线。 | `AlembicPlugin` / `Alembic` / `AlembicCore` |
| GTODO-2026-05-24-038 | 不入本轮 | alembic file monitor evolution | P1 | `Alembic` / `AlembicCore` / `AlembicDashboard` / `AlembicTest` | Alembic file monitor 知识进化。 | 否 | 等 037 阶段结论后重新讨论。 | 不发送 |
| GTODO-2026-05-24-039 | 不入本轮 | plugin no-monitor evolution | P1 | `AlembicPlugin` / `AlembicCore` / `AlembicTest` | Plugin 无 file monitor 时的机会式知识进化。 | 否 | 等 037 意图链路稳定后重新讨论。 | 不发送 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `AlembicPlugin` | 主线任务 | 是 | 037 的 host intent / MCP / prime schema 上游事实必须先确认。 |
| `Alembic` | 主线任务 | 是 | 037 的 resident / local refinement / search / source refs / storage 消费事实必须确认。 |
| `AlembicCore` | 主线任务 | 是 | 037 的 shared contract 边界必须先定清，避免空 contract。 |
| `AlembicAgent` | 无任务 | 否 | Codex host agent 不等于 `AlembicAgent`；本轮不做 internal Agent prompt / runtime。 |
| `AlembicDashboard` | 观察 | 否 | Design 明确第一版不做 Dashboard UI；等 Stage 5 / trace 需要展示时再评估。 |
| `AlembicTest` | 阻塞 / 后续 Stage 6 | 否 | 本轮总控和源仓库能做代码事实；真实项目验证等 Stage 6 再创建测试单。 |

## 窗口分派

发送给：`AlembicPlugin`、`Alembic`、`AlembicCore`

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>执行中 | `G037-W0-PLUGIN-FACTS`：第一跳 heartbeat 已 arm，等待目标窗口 claim；只读确认 Plugin host facts、prime schema、MCP metadata、IntentExtractor / PrimeSearchPipeline / IntentState 边界；不改源码。 |
| `Alembic`<br>待启动 | `G037-W0-ALEMBIC-FACTS`：只读确认 daemon / resident / local Qwen / search / semantic / source refs / ProjectScope storage；不改源码。 |
| `AlembicCore`<br>待启动 | `G037-W0-CORE-FACTS`：只读确认 shared contract、knowledge / source refs / ProjectScope 归属边界；不改源码。 |
| `AlembicAgent`<br>无任务 | 本轮不处理 internal Agent prompt、tool runtime 或 execution loop。 |
| `AlembicDashboard`<br>观察中 | 本轮不做 UI；等 Stage 5 / trace 展示需求出现后再判断。 |
| `AlembicTest`<br>阻塞 | Stage 6 才可能创建真实验证测试单；本轮不发送、不创建 heartbeat。 |
| `BiliDili`<br>无任务 | 不改真实项目源码。 |

## 可复制提示词

发送给：`AlembicPlugin`、`Alembic`、`AlembicCore`

```text
Visible Automation Dispatch 自动化模式目标任务。

先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/plugin-intent-knowledge-route-wave-0-2026-05-26.md、skills/dev/visible-automation-dispatch-target/SKILL.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责；本轮只允许领取你所在窗口在当前计划中的 GTODO-2026-05-24-037 Wave 0 代码事实任务。

在 AlembicWorkspace 工作目录运行：
node scripts/visible-dispatch.mjs claim --window <你的窗口名> --write --json

只做当前计划授权的只读代码事实基线；不得改产品源码，不得启动 038 / 039，不得创建 AlembicTest 任务。

完成后按当前总控文档回填：完成范围、代码事实和关键文件、验证命令和结果、当前不能推出的结论、Stage 1-5 建议、遗留风险。

无人值守接续时按 visible-dispatch-target skill 执行 finish / chain-next / record-arm / record-stop；只有 finish JSON 返回 chain.nextAction === "armNext"、chain.handoffPolicy === "target-courier" 且 chain.payload.courierAllowed === true 时，才可创建下一条 heartbeat。遇到 controllerArm、modeDisabled、registerWindow、wait、review 或无 payload，停止并报告总控。
```

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：本轮问题是代码事实基线和自动化派发准备，总控可用脚本和源仓库只读 probe 验证；不需要真实项目环境。
- 需要真实场景的理由：Stage 6 才需要真实项目、多会话、纠偏和 prime 注入价值验证。
- 测试前边界与多条件判断：
  - 测试要回答的问题：Wave 0 不做测试单；只验证当前计划、派发表、自动化队列和 Design 接收是否准备正确。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：只限 AlembicWorkspace 当前计划和 visible-dispatch 本地 runtime；不触碰真实测试项目。
  - 成功能推出的结论：可以安全让用户开启自动化，由 `AlembicPlugin` / `Alembic` / `AlembicCore` 顺序领取 Wave 0 代码事实任务。
  - 失败能推出的结论：不能开启自动化；需先修当前计划、队列或窗口 registry。
  - 不能推出的结论：不能推出 037 功能已实现，也不能推出真实 prime 注入有效。
  - 停止或不开始条件：current plan 未切到本文、sendEligible 不是 037、queue 仍有旧 active / review 任务、registry 缺少目标窗口、mode 已启但任务不匹配。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](alembic-test-exchange.md)
- 真实项目保护说明：本轮不使用真实测试项目。

## 回填区

- 2026-05-26 13:45 CST：总控接收 `GTODO-2026-05-24-037` Design handoff，确认 `INTENT-RECOGNITION-2026-05-26` 与 `INTENT-KNOWLEDGE-2026-05-26` 共同构成 037；038 / 039 不进入自动化。本轮 Wave 0 只做代码事实基线。
- 2026-05-26 13:45 CST：总控裁决旧 VAD runtime 队列：Wave 9 六个 completed 任务只验收为 heartbeat smoke 证据；Wave 10 五个 queued smoke 任务标记为被 037 Wave 0 取代，避免自动化开启后继续旧 smoke。
- 2026-05-26 13:48 CST：总控已用 `visible-dispatch` 预排当前计划 3 个任务；mode 仍关闭，等待用户开启自动化后从 `AlembicPlugin` 第一跳开始。
- 2026-05-26 13:54 CST：用户确认开启自动化；总控运行 `mode --enable --write`，创建 `AlembicPlugin` 第一跳 heartbeat，并执行 `record-arm`。当前本地 runtime 为 `armed:1 / queued:2`。

<!-- workspace-sync
{
  "status": "GTODO-2026-05-24-037 Wave 0 执行中，AlembicPlugin 第一跳已 arm",
  "indexPlanDescription": "GTODO-2026-05-24-037 / Plugin intent knowledge route Wave 0：自动化已开启，AlembicPlugin 第一跳已 arm；本轮只做 AlembicPlugin、Alembic、AlembicCore 代码事实基线，不启动 038 / 039，不派 AlembicTest。",
  "indexStatusDescription": "037 Wave 0 执行中：AlembicPlugin 第一跳已 arm，Alembic / AlembicCore 等待后续 chain；旧 VAD smoke 队列已裁决，不会抢跑。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "GTODO-2026-05-24-037 Wave 0：Plugin intent recognition + knowledge route 代码事实自动化执行中。",
  "currentStatusSummary": "GTODO-2026-05-24-037 Wave 0 执行中：AlembicPlugin 第一跳已 arm，当前只做 Plugin / Alembic / Core 代码事实基线；038 / 039、Dashboard UI、AlembicTest 均不启动。",
  "indexRows": [
    {
      "type": "GTODO 037 Intent Recognition Design",
      "doc": "AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md",
      "status": "已接收",
      "description": "037 第一阶段需求设计：prime 快速路径结构化意图、hostTurnMeta、IntentEpisode 连续性和本地 refinement 边界。",
      "insertAfter": "当前状态"
    },
    {
      "type": "GTODO 037 Intent Knowledge Design",
      "doc": "AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md",
      "status": "已接收",
      "description": "037 第二阶段需求设计：IntentSearchPlan、keyword / vector / relation 增强和保留 source refs 的 PrimeInjectionPackage。",
      "insertAfter": "GTODO 037 Intent Recognition Design"
    }
  ],
  "currentIndexRows": [
    {
      "type": "GTODO 037 Intent Recognition Design",
      "doc": "AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md",
      "description": "037 第一阶段 Design handoff，已由总控接收进入 Wave 0 代码事实基线。",
      "insertAfter": "当前计划"
    },
    {
      "type": "GTODO 037 Intent Knowledge Design",
      "doc": "AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md",
      "description": "037 第二阶段 Design handoff，等待识别与 episode 基线稳定后推进。",
      "insertAfter": "GTODO 037 Intent Recognition Design"
    }
  ]
}
-->
