# Requirement Design: Visible Automation Dispatch

日期：2026-05-25
状态：已形成，已进入总控目标阶段确认
维护窗口：AlembicWorkspace

## 原始计划书

- 原始计划书：[original-plan-2026-05-25.md](original-plan-2026-05-25.md)
- 原始计划书确认状态：已确认
- 用户确认时间：2026-05-25
- AlembicDesign 来源 signal / handoff（如有）：无，本需求来自总控窗口与用户现场验证
- Design 接收状态：无，建议总控直接接收为需求候选

## 用户需求

```text
把“总控给出提示词，各个窗口输入”的人工搬运去掉。
要求目标 Codex 窗口仍然可见、保留 Mac 前端 UI 渲染和窗口上下文。
期望所有 Codex 窗口能被唤醒，pull 检查是否有分配给自己的任务，从任务列表取自己的任务执行。
接受分钟级延迟；第一版只做 Alembic 系列窗口；不依赖 Lark Remote。
希望它成为一种可开启的自动化模式生产线，从 TODO 里面取主线循环推进；平时关闭，离开时开启。
关闭自动化模式通过普通 Codex 输入完成，不需要额外远程关闭通道。
```

## 需求明确性检查

- 用户场景：AlembicWorkspace 总控文档决定下一波发送窗口后，不再由用户手动复制提示词；目标 Codex 窗口自动收到可见消息并执行。
- 完整功能闭环：总控生成任务队列 -> 解析发送窗口 -> 找到目标 thread -> 创建 armed heartbeat automation -> 目标窗口收到可见消息 -> pull / claim / execute / backfill -> 删除 automation -> 总控验收。
- 输入：当前总控计划、结构化 dispatch queue、窗口注册表、目标窗口 automation prompt。
- 输出：目标窗口可见执行记录、任务 claim 状态、回填证据、automation 清理结果。
- 状态 / 数据变化：任务从 `queued` 到 `claimed` / `running` / `completed` / `blocked`；automation 从 created 到 deleted；窗口注册表更新时间和 threadId 变化。
- 生产方：AlembicWorkspace 总控 / dispatcher。
- 消费方：各可见 Codex 执行窗口，包括 `Alembic`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 等。
- 验证方式：使用测试队列证明 scheduler-triggered automation 能唤醒目标可见 thread；再用实际总控计划的 dry-run / sandbox task 验证跨窗口投递。
- 完成定义：用户无需手动复制提示词，且目标窗口 Mac UI 可见消息和执行输出；任务状态、回填和 automation 清理可审计。
- 已确认的问题：第一版接受分钟级延迟；只覆盖 Alembic 系列窗口；不依赖 Lark Remote；关闭通过普通 Codex 输入触发。
- 仍不明确的问题：是否第一版要支持多目标窗口并发 armed；窗口注册表由总控手动登记还是各窗口自注册；TODO 主线循环的自动提升边界需要后续通过目标阶段确认约束。

## 调研范围

- 必读仓库：`AlembicWorkspace`
- 观察仓库：`AlembicPlugin`、`Alembic`、`AlembicTest`
- 暂不纳入仓库：`AlembicCore`、`AlembicAgent`、`AlembicDashboard`，除非后续要把 dispatcher 做成产品能力或 Dashboard UI。
- 关键入口文件：
  - `docs/workspace/index.md`
  - `docs/workspace/current/workspace-current-status.md`
  - `templates/workspace-control-plan-template.md`
  - `scripts/sync-current-plan.mjs`
  - `scripts/verify-control-center.mjs`
  - `skills/dev/alembic-workspace-control/references/window-dispatch.md`
  - `$CODEX_HOME/automations/<id>/automation.toml`
- 关键测试 / 脚本：
  - `node scripts/verify-control-center.mjs`
  - `node scripts/verify-control-center.mjs --require-task-packages`
  - 后续新增 dispatcher dry-run / queue schema test

## 外部调研判断

- 是否需要联网：已需要，并已完成最小官方资料核实。
- 判断理由：需求依赖 Codex App thread automation、Mac Codex visible thread、app-server / remote-control API 边界。
- 优先来源：OpenAI Codex 官方文档、本地 `codex` CLI schema、Lark Remote 插件本地实现。
- 外部结论如何约束或启发本地实现：
  - Thread automation 是当前最适合保持 Mac UI 可见性的投递通道。
  - 官方 automation 没有 `run now` / seconds interval / queue-change trigger，第一版必须接受分钟级延迟。
  - app-server 支持程序化 thread / turn，但它是 rich client 协议，不能作为“现有 Mac UI 窗口可见投递”的第一版依据。

## 真实代码事实

### AlembicWorkspace

- 已有能力：
  - 总控文档已有 `发送给`、窗口状态、可复制提示词和回填要求。
  - 脚本体系已有 current plan / index 同步和验证能力。
  - `codex_app.automation_update` 可创建 thread heartbeat automation。
- 关键文件：
  - `docs/workspace/index.md`
  - `docs/workspace/current/*.md`
  - `scripts/sync-current-plan.mjs`
  - `scripts/verify-control-center.mjs`
  - `templates/workspace-control-plan-template.md`
- 缺口：
  - 缺少结构化 dispatch queue。
  - 缺少 window registry。
  - 缺少 armed automation 创建 / 删除脚本。
  - 缺少 claim / lease / stale recovery 规则。

### Alembic

- 已有能力：当前不作为第一版产品 runtime；只可能后续承接 daemon / Dashboard / HTTP 化。
- 关键文件：待后续代码实现依赖调研确认。
- 缺口：第一版不要求改动。

### AlembicPlugin

- 已有能力：Codex host agent 入口；但本需求第一版直接利用 Codex App automation，而不是扩展 plugin MCP。
- 关键文件：待后续代码实现依赖调研确认。
- 缺口：若后续要把 dispatcher 做成插件工具，需要定义 MCP tool 和权限边界。

### AlembicTest / 真实项目验证

- 是否纳入：第一版可纳入最小验证，不作为产品实现仓库。
- 理由：需要证明目标 `AlembicTest` 可见窗口能被 automation 唤醒并只执行测试单 / 队列任务。
- 目标项目（如有）：先用 `/private/tmp` 或 workspace 测试队列，不触碰真实测试项目业务源码。

## 代码实现依赖调研

- 是否需要单独调研附件：需要，已创建 `code-implementation-dependency-research-2026-05-25.md`。
- 调研附件：[code-implementation-dependency-research-2026-05-25.md](code-implementation-dependency-research-2026-05-25.md)。
- 关键生命周期：
  1. 窗口注册：由总控手动登记或各窗口自注册得到 `windowName -> threadId -> cwd`；第一版不依赖 Lark Remote。
  2. 任务生成：总控计划或脚本生成 `dispatch-queue.json`。
  3. Armed 创建：dispatcher 为目标 thread 创建 heartbeat automation。
  4. Pull 执行：目标 thread 醒来后读取 queue、claim、执行、回填。
  5. 清理：目标 thread 删除 automation；总控回收 stale claim / stale automation。
- 共享状态 / 持久化位置：
  - 第一版运行态建议放在 `.workspace-local/visible-dispatch/`，包括 `state.json`、`window-registry.json`、`dispatch-queue.json` 和 `automation-runs.json`。
  - 长期文档只记录 schema、计划和验收证据，不提交本机 threadId / registry。
  - 测试临时文件可放 `/private/tmp`。
- producer / consumer 硬依赖：
  - Producer：总控计划 / dispatcher。
  - Consumer：目标可见 Codex thread 的 pull worker prompt。
  - 清理方：目标 thread 完成后删除 automation；总控脚本做兜底清理。
- 不能切换 / 不能删除 / 不能提前消费的边界：
  - 不能把 headless worker 当成可见窗口替代。
  - 不能自动执行确认门禁未通过的任务。
  - 不能自动创建会改变用户目标 / 删除 / 降级 / 发布的任务执行。
- 是否需要外部资料：需要继续关注 Codex automation API 是否新增 run-now / sub-minute。

## 目标能力设计

- 最终能力：
  - 总控可以从当前计划一键生成/刷新任务队列，并在自动化模式开启时循环处理当前计划 / TODO 主线候选。
  - 总控可以为目标窗口创建一次性 armed automation。
  - 目标窗口醒来后只 pull 自己的任务，并把执行过程留在 Mac Codex 前端 UI。
- 用户体验：
  - 用户不再复制提示词。
  - 用户可以在目标窗口看到“通过自动化发送”的消息和完整执行输出。
  - 用户仍可在权限审批、确认门禁、异常状态时介入。
  - 用户平时保持自动化模式关闭；离开时开启；回来后用普通 Codex 输入关闭。
- 功能闭环：
  - `current plan` -> `dispatch queue` -> `window registry` -> `automation create` -> `visible worker pull` -> `backfill` -> `automation delete` -> `control validation`。
- 模块边界：
  - `AlembicWorkspace` 负责总控规则、队列、注册表、验证脚本和需求文档。
  - Codex App automation 负责可见 thread 消息投递。
  - Lark Remote 可作为 window target discovery 辅助，不作为第一版唯一依赖。
  - 子仓库窗口负责按自身 `AGENTS.md` 执行和回填。
- 数据 / 状态模型：
  - `VisibleDispatchState`: `mode`、`loopEnabled`、`lastTickAt`、`stopRequestedAt`、`currentGoal`。
  - `WindowRegistryEntry`: `windowName`、`threadId`、`cwd`、`role`、`lastSeenAt`、`status`、`source`。
  - `DispatchTask`: `taskId`、`targetWindow`、`status`、`promptRef`、`controlDoc`、`claim`、`leaseUntil`、`verification`、`backfill`。
  - `AutomationDispatch`: `automationId`、`targetThreadId`、`taskId`、`createdAt`、`deletePolicy`、`lastObservedAt`。
- API / contract：
  - 第一版脚本接口建议：
    - `node scripts/visible-dispatch.mjs --dry-run`
    - `node scripts/visible-dispatch.mjs --arm --task <taskId>`
    - `node scripts/visible-dispatch.mjs --cleanup-stale`
  - Pull prompt contract：目标窗口只读 queue，发现自己任务才 claim；否则短退出并清理 automation。
- UI / handoff：
  - 第一版无 Dashboard UI。
  - 总控文档需要新增“自动化派发状态”或脚本可读块，明确哪些窗口已 armed、哪些等待回填。
- 安装 / 发布 / artifact：
  - 第一版仅 workspace 脚本 / 文档能力，不进入 Alembic 产品包。
  - 后续如沉淀为产品能力，再评估 `AlembicPlugin` MCP tool 或 `Alembic` daemon API。

## 禁止的伪实现

- 只创建 headless `codex exec` dispatcher，却不保证 Mac UI 可见。
- 只写提示词模板，没有结构化任务队列、窗口注册表和清理策略。
- 只创建 automation，不验证目标窗口是否收到、claim、回填和删除。
- 只做 Lark Remote takeover，不解决总控计划到目标窗口的自动派发闭环。
- 让 automation 长期每分钟空转，不按任务 armed / cleanup。

## 差距分析

| 能力 | 当前状态 | 缺口 | 归属窗口 | 风险 |
| --- | --- | --- | --- | --- |
| 可见 thread 自动唤醒 | 已通过 scheduler smoke test | 需要跨目标窗口验证 | AlembicWorkspace / AlembicTest | 目标 threadId 过期或窗口不再可见 |
| 窗口注册表 | 可手动登记或后续自注册 | 无正式 registry / stale 检查；第一版不依赖 Lark Remote | AlembicWorkspace | 错投到历史 thread |
| 结构化 dispatch queue | 只有 markdown `发送给` / 提示词 | 无 task claim / lease / status schema | AlembicWorkspace | 多窗口抢任务或重复执行 |
| Armed automation 创建 | `automation_update create` 可用 | 无脚本封装和 dry-run | AlembicWorkspace | 残留 automation 重复唤醒 |
| 执行回填 | 依赖窗口手写回填 | 无统一 backfill contract / validator | AlembicWorkspace | 总控验收证据不齐 |
| 即时发送 | 当前无官方 run-now API | 只能分钟级或 UI 手动 Run | 后续候选 | 用户预期秒级时落差 |
| 自动化模式循环 | 无 | 缺少默认关闭 / 显式开启 / 普通输入关闭 / TODO 主线选择 | AlembicWorkspace | 离开时无法持续推进或关闭后继续派发 |

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响目标 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-TODO-1 | 主线 | 设计 / 实现 | P0 | AlembicWorkspace | 定义 dispatch queue 与 window registry schema | 是 | 进入目标阶段确认后 | AlembicWorkspace |
| VAD-TODO-2 | 主线 | 实现 | P0 | AlembicWorkspace | 实现 armed automation dry-run / arm / cleanup 脚本 | 是 | schema 确认后 | AlembicWorkspace |
| VAD-TODO-3 | 主线 | 验证 | P0 | AlembicTest | 验证目标执行窗口能收到 automation 并 pull 测试队列 | 是 | dispatcher 脚本可用后 | AlembicTest |
| VAD-TODO-4 | 风险 | 安全 / 门禁 | P0 | AlembicWorkspace | 明确哪些任务禁止自动派发，保留确认门禁和权限审批 | 是 | 第一波前 | AlembicWorkspace |
| VAD-TODO-5 | 主线 | 自动化模式 | P0 | AlembicWorkspace | 建立默认关闭 / 显式开启 / 普通输入关闭的自动化模式循环，并约束 TODO 主线选择 | 是 | schema / queue 第一波 | AlembicWorkspace |
| VAD-TODO-6 | 观察 | 增强 | P1 | AlembicPlugin / Alembic | 评估是否将 dispatcher 沉淀为插件 MCP / daemon API | 否 | workspace 脚本闭环稳定后 | AlembicPlugin / Alembic |

## 后续拆分候选方向

| 阶段 | 目标 | 生产窗口 | 消费窗口 | 完成判断 |
| --- | --- | --- | --- | --- |
| 0 | 目标阶段确认：用户确认第一版接受分钟级 armed automation，不做即时发送 | AlembicWorkspace | 用户 / 总控 | 确认文档状态已确认，发送给无 |
| 1 | Workspace dispatcher schema + dry-run | AlembicWorkspace | 总控 | dry-run 能从当前计划解析目标窗口、任务和 promptRef，不创建 automation |
| 2 | Armed automation 创建 / 删除脚本 | AlembicWorkspace | 目标窗口 | 可为指定 thread 创建 heartbeat，并能清理 stale automation |
| 3 | 单窗口可见 pull 验证 | AlembicTest | AlembicWorkspace | 目标窗口收到可见消息，claim 测试任务，回填并删除 automation |
| 4 | 自动化模式 TODO 主线循环 | AlembicWorkspace | 总控 | 默认关闭、显式开启、普通输入关闭；当前计划无可发窗口时能选择合规 TODO 候选并停在确认门禁 |
| 5 | 多窗口任务包验证 | AlembicWorkspace / AlembicTest | Alembic / AlembicPlugin 等 | 两个以上目标窗口按各自任务领取，无重复执行 |

## 待确认问题

- 用户已确认：
  - 第一版接受分钟级延迟，而不是秒级即时投递。
  - 第一版不依赖 Lark Remote。
  - 第一版只覆盖 Alembic 系列窗口，不覆盖真实项目窗口。
  - 自动化模式默认关闭，离开时开启，关闭通过普通 Codex 输入完成。
- 仍需后续确认或验证：
  - 第一版窗口注册表是由总控手动登记还是各窗口自注册。
  - TODO 主线循环在缺少目标阶段确认时必须停在确认门禁，不能自动越过。
- 需要后续代码验证：
  - automation target threadId 在窗口关闭 / 重开 / fork / resume 后是否稳定。
  - `COUNT=1` 与不带 `COUNT` 的 scheduler 行为差异是否需要规避。
  - 多 automation 同时 armed 时是否会串行、并发或被 Codex App 限流。
- 不应提前派发：
  - 不应在没有 queue / claim / cleanup 规则前向多个真实开发窗口自动派发。
  - 不应在没有目标阶段确认前把当前 PCVM 或其它主线迁移到自动派发。

## 进入目标阶段确认

- 建议创建的确认文档：`docs/workspace/current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md`
- 是否已经完成代码实现依赖调研：是，见 [code-implementation-dependency-research-2026-05-25.md](code-implementation-dependency-research-2026-05-25.md)
- 建议第一波候选窗口：`AlembicWorkspace`
- 明确不派发窗口：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 在 Phase 0 / 1 不派发实现；`AlembicTest` 仅在 dispatcher 脚本可用后承接验证。
