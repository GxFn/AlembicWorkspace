# Visible Automation Dispatch Goal Stage Confirmation

日期：2026-05-25
状态：已确认，Wave 1 待创建
发送给：无
维护窗口：AlembicWorkspace

## 用户原始目标

```text
把“总控给出提示词，各个窗口输入”的人工搬运去掉。
目标 Codex 窗口仍然必须可见，保留 Mac 前端 UI 渲染和窗口上下文。
所有 Codex 窗口可以被唤醒，然后 pull 检查是否有任务，从任务列表领取自己的任务执行。
接受分钟级延迟；第一版只做 Alembic 系列窗口；不依赖 Lark Remote。
希望这是一种自动化模式生产线，从 TODO 里面取主线循环，并且有开关；平时不需要，离开时开启循环。
关闭自动化模式用普通 Codex 输入即可，不需要额外远程关闭通道。
```

## 总控理解

- 目标：建立 AlembicWorkspace 的可见窗口自动派发能力，减少用户手动复制提示词。
- 关键约束：目标窗口必须是 Mac Codex 前端可见 thread；第一版接受 0-60 秒级 heartbeat 延迟；不走 headless worker；不依赖 Lark Remote。
- 不能偏离的边界：自动化只替代搬运，不替代总控的目标判断、TODO 入账、确认门禁、producer / consumer 顺序和验收。
- 关键设计分叉：脚本负责 queue / registry / mode / claim；实际 heartbeat automation 创建由总控窗口使用 Codex 工具执行，不能伪装为 Node 脚本内部能力。
- 当前不确定点：threadId 生命周期、多 automation 调度表现、TODO 主线循环的自动提升边界需要后续测试确认。

## 2026-05-26 路线更新

- 当前正式路线：VAD 是显式 automation mode，不再依赖 Codex 追求目标；`mode --enable --write` 后才允许总控循环和窗口 finish-chain，`mode --disable --write` 后停止自动推进。
- 旧的“追求目标 / controller heartbeat 常驻”只保留为历史尝试和需求来源，不再作为当前操作路径。
- 任一可见 Codex 目标窗口完成任务时，可以用 `finish --window <name> --thread <id> --backfill <text> --write --chain-next --json` 记录证据并打印下一跳 payload；脚本仍不直接调用 Codex automation API，也不替代总控验收。
- 旧 wave 的 terminal runtime 残留由 `node scripts/visible-dispatch.mjs prune-history --write` 清理；当前计划任务、未验收完成项和仍有 active automation run 的历史项不会被自动删除。

## 前置需求设计

- 原始计划书：[../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)。
- 需求设计文档：[../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)。
- 代码实现依赖调研：[../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)。
- 调研结论：第一版落在 AlembicWorkspace 文档、脚本和本地运行态；不进入产品包；不依赖 Lark Remote；窗口 thread registry 必须本地忽略。
- 当前已有能力：当前计划同步、dispatch coverage、TODO / task package 校验、workspace-control 聚合入口、Codex heartbeat automation 工具。
- 主要缺口：缺少 visible dispatch mode、window registry、dispatch queue、claim / lease、arm payload、cleanup 和目标窗口 pull contract。
- 功能闭环：current plan / TODO -> queue -> registry -> heartbeat automation -> target visible thread pull / claim -> execute / backfill -> cleanup -> total-control acceptance。
- 生产方 / 消费方：AlembicWorkspace 生产 queue 和 arm payload；Alembic 系列可见 Codex 窗口消费任务；总控验收回填。
- 本确认文档对需求设计文档的调整：新增用户确认的自动化模式生产线、默认关闭 / 离开时开启 / 普通输入关闭、不依赖 Lark Remote 和 TODO 主线循环要求。

## 最终完成定义

- 用户场景完成：用户开启自动化模式后，不再手动复制提示词；目标 Alembic 系列窗口在可见 Mac Codex thread 中收到任务并执行。
- 功能 / 边界完成：自动化模式默认关闭，显式开启后才循环；关闭后不再创建新的 armed automation，并清理 stale automation。
- 输入输出和状态变化完成：TODO / 当前计划生成 queue；任务状态从 `queued` 到 `claimed` / `running` / `completed` / `blocked`；automation run 可清理；回填证据可追溯。
- 跨仓库消费完成：第一版只覆盖 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 可见窗口；不覆盖真实项目窗口。
- 删除 / 保留完成：不删除现有可复制提示词流程；自动化模式稳定前，手动提示词仍作为 fallback。
- 文档和证据完成：需求目录、代码调研、目标确认、wave 执行计划、脚本 README 和测试证据都从 workspace index 可追踪。
- 验证完成：脚本 fixture 测试、workspace control 验证、单窗口可见 heartbeat 验证和至少一轮 queue claim / backfill / cleanup 证据通过。

## 非目标

- 不做 headless `codex exec` worker。
- 不做秒级即时发送或 `run now` 承诺。
- 不做 Dashboard UI。
- 不依赖 Lark Remote 发现窗口。
- 不让自动化绕过用户确认门禁、权限审批、删除 / 降级 / 改范围确认。
- 不覆盖真实项目窗口，不改真实项目源码。
- 不把 dispatcher 第一版沉淀进 `AlembicPlugin` MCP 或 `Alembic` daemon。

## 影响范围

最终覆盖窗口：

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 后续作为 visible dispatch 目标窗口之一；Wave 1 不发送。 |
| `AlembicCore`<br>观察中 | 后续作为 visible dispatch 目标窗口之一；Wave 1 不发送。 |
| `AlembicAgent`<br>观察中 | 后续作为 visible dispatch 目标窗口之一；Wave 1 不发送。 |
| `AlembicDashboard`<br>观察中 | 后续作为 visible dispatch 目标窗口之一；Wave 1 不发送。 |
| `AlembicPlugin`<br>观察中 | 后续作为 visible dispatch 目标窗口之一；Wave 1 不发送。 |
| `AlembicTest`<br>观察中 | 后续承接单窗口可见 heartbeat / queue claim 验证；脚本可用前不发送。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

补充说明：

- `AlembicWorkspace` 是实现和总控窗口，但不进入执行窗口发送名单。
- `.workspace-local/visible-dispatch/` 是本机运行态，不提交 git。

## 依赖链判断

| 上游产出 | 生产窗口 | 消费窗口 | 派发判断 |
| --- | --- | --- | --- |
| visible dispatch schema / mode / registry / queue | AlembicWorkspace | AlembicWorkspace / 目标窗口 | Wave 1 先做；目标窗口不提前消费 |
| arm payload 和 heartbeat cleanup 规则 | AlembicWorkspace | 总控窗口 / 目标窗口 | schema 可用后做；不假装 Node 脚本直接调用 Codex 工具 |
| 单窗口可见 pull 验证 | AlembicTest | AlembicWorkspace | dispatcher 脚本可用后再创建测试单 |
| TODO 主线循环选择 | AlembicWorkspace | 总控窗口 | 基础 queue / claim 稳定后再做；不能绕过目标阶段确认 |

## 阶段计划

| 阶段 | 目标 | 前置条件 | 完成标准 | 当前可派发窗口 | 不派发窗口 |
| --- | --- | --- | --- | --- | --- |
| 0 | 目标阶段确认和代码依赖调研 | 原始计划和需求设计已形成 | 本文档已确认，发送给无 | 无 | 全部执行窗口 |
| 1 | 本地 schema、mode、registry、queue dry-run | 本文档已确认 | `visible-dispatch` 脚本可管理本地状态并通过 fixture 测试 | AlembicWorkspace 自执行 | Alembic 系列执行窗口 |
| 2 | armed automation payload / cleanup contract | Wave 1 脚本可用 | 总控能按 payload 创建 heartbeat，关闭后停止 arm 并清理 stale | AlembicWorkspace 自执行 | 目标窗口等待 |
| 3 | 单窗口可见 pull / claim 验证 | Wave 2 可 arm | `AlembicTest` 可见窗口收到消息、claim 测试任务、回填并 cleanup | AlembicTest | 其它执行窗口 |
| 4 | TODO 主线循环与多窗口生产线 | 单窗口验证通过 | 可从 TODO / 当前计划选择下一主线，按窗口循环派发且可普通输入关闭 | AlembicWorkspace / 目标窗口 | 真实项目窗口 |

## 当前阶段判断

- 当前阶段：阶段 0 已确认，准备创建 Wave 1。
- 为什么先做这一阶段：必须先把自动化模式、状态文件、queue 和 registry 定义为可测试脚本能力；没有这些就直接唤醒窗口会变成重复空转。
- 为什么不先做其它阶段：automation arming 依赖 queue / registry；AlembicTest 验证依赖脚本可用；TODO 循环依赖基础状态机。
- 本阶段形成的功能闭环：需求确认 -> 代码依赖调研 -> Wave 1 可执行任务包。
- 下一处真实阻塞点：Node 脚本不能直接调用 Codex `automation_update` 工具，需要把脚本输出与总控工具调用边界写清。
- 阻塞点之前还能一波完成的主线动作：schema、mode switch、registry、queue dry-run、claim / lease fixture test、README / skill 使用说明。
- 确认后第一波可启动窗口：AlembicWorkspace 自执行，不发送其它窗口。
- 等待窗口：`AlembicTest` 等脚本可用后做单窗口验证；其它 Alembic 系列窗口等待多窗口阶段。
- 确认后是否需要新建 wave 执行计划：需要，创建 `visible-automation-dispatch-wave-1-2026-05-25.md`。

## 第一波任务包候选

- 下一处真实阻塞点：脚本与 Codex automation 工具边界。
- 阻塞点之前还能做：本地状态 schema、开关、queue、registry、claim / lease、fixture tests、脚本文档。

| 任务包 ID | 窗口 | 阶段目标 | 主线动作 | 可合并 TODO | 明确不包含 | 阻塞 / 依赖 | 验证命令 | 回填要求 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-P1-WORKSPACE-SCHEMA-QUEUE | `AlembicWorkspace` | 建立 visible dispatch 本地状态和 dry-run queue | 新增 / 更新脚本、测试、README 和当前计划 | `VAD-TODO-1`、`VAD-TODO-4` | 不创建真实 automation；不发送执行窗口 | 目标阶段确认已完成 | `node scripts/verify-control-center.mjs --with-script-tests` | 完成范围、验证结果、遗留风险、下一阶段建议 |

## 验证策略

- 每波最低验证：workspace docs verification、dispatch coverage、script docs check、相关脚本 unit test。
- 每阶段可验证目标：Wave 1 验证本地状态和 queue；Wave 2 验证 arm payload / cleanup；Wave 3 验证单窗口可见消息；Wave 4 验证 TODO 主线循环。
- 阶段完成验证：`node scripts/workspace-control.mjs verify --dispatch --script-tests`。
- 功能完整性验收：
  - 真实入口：`scripts/visible-dispatch.mjs` 和当前计划中的自动化模式说明。
  - 真实数据来源：当前计划窗口分派、global TODO、`.workspace-local/visible-dispatch/` 本地状态。
  - 状态 / 数据变化：mode、queue task status、claim / lease、automation run cleanup。
  - 真实消费方：目标 Alembic 系列可见 Codex 窗口。
  - 错误 / 边界路径：mode off、threadId 缺失 / stale、非 Alembic 窗口、重复 claim、lease 过期、关闭后 cleanup。
  - 用户可执行验证：开启自动化模式后观察目标窗口可见消息；关闭后不再继续派发。
  - 若发现最小实现，补齐 wave：若只有模板没有 queue / claim / cleanup，不能进入 AlembicTest 验证。
- 稳定面统一验收：workspace script e2e fixture 后续补入 visible dispatch 分支。
- 真实项目 smoke 触发条件：无；真实项目不进入第一版。

## 风险与确认问题

- 风险：threadId 过期、heartbeat 调度延迟、多个 automation 限流、关闭后 stale automation 残留、TODO 主线循环绕过确认门禁。
- 需要用户确认：已确认接受分钟级延迟、只做 Alembic 系列窗口、不依赖 Lark Remote、普通 Codex 输入关闭。
- 不明确时禁止派发：未定义 queue / claim / cleanup 前禁止向多个真实开发窗口自动派发。
- 若用户未确认，当前派发状态：已确认关键边界；Wave 1 可创建，但当前还不发送其它窗口。

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicCore`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicAgent`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicDashboard`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicPlugin`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicTest`<br>观察中 | 等 dispatcher 脚本可用后再创建单窗口可见验证单。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：无

```text
当前不发送其它窗口。Visible Automation Dispatch 已完成目标阶段确认，下一步由 AlembicWorkspace 自执行 Wave 1：本地状态 schema、mode switch、registry、queue dry-run、claim / lease 和脚本测试。
```

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`。

## 回填区

### 用户确认

- 状态：已确认
- 确认时间：2026-05-25 23:34 CST
- 用户调整：
  - 接受分钟级延迟。
  - 第一版只做 Alembic 系列窗口。
  - 不依赖 Lark Remote。
  - 自动化模式应像生产线，从 TODO 中取主线循环。
  - 自动化模式默认关闭，用户离开时开启。
  - 关闭通过普通 Codex 输入完成，不需要额外远程关闭通道。

### 确认后第一波

- 启动文档：[visible-automation-dispatch-wave-1-2026-05-25.md](../../../current/visible-automation-dispatch-wave-1-2026-05-25.md)，Wave 1 已通过总控验收。
- 发送窗口：无。
- 阻塞窗口：无。
- 观察窗口：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`。
- index 当前计划是否已切到 wave 执行计划：是，已切到 [visible-automation-dispatch-wave-1-2026-05-25.md](../../../current/visible-automation-dispatch-wave-1-2026-05-25.md)。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch 目标阶段已确认，Wave 1 待创建",
  "indexPlanDescription": "用户已确认分钟级延迟、只覆盖 Alembic 系列窗口、不依赖 Lark Remote、普通 Codex 输入关闭；当前准备创建 Wave 1，本地 schema / mode / registry / queue dry-run。",
  "indexStatusDescription": "Visible Automation Dispatch 已完成目标阶段确认；当前不发送其它窗口，下一步由 AlembicWorkspace 自执行 Wave 1。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "确认可见窗口自动化派发目标、完成定义、阶段顺序、自动化模式开关和 TODO 主线循环边界。",
  "currentStatusSummary": "Visible Automation Dispatch 已确认：第一版接受分钟级延迟，只覆盖 Alembic 系列窗口，不依赖 Lark Remote，关闭使用普通 Codex 输入；当前发送给无，准备创建 Wave 1。",
  "indexRows": [
    {
      "type": "Visible Automation Dispatch 原始计划书",
      "doc": "docs/requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md",
      "status": "已确认",
      "description": "记录去掉手动复制提示词、保留可见 Codex 窗口、通过 thread automation 唤醒目标窗口的原始目标。",
      "insertAfter": "当前状态"
    },
    {
      "type": "Visible Automation Dispatch 需求设计",
      "doc": "docs/requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md",
      "status": "已形成",
      "description": "设计 armed automation dispatch、窗口注册表、任务队列、claim / lease、回填和验证路线。",
      "insertAfter": "Visible Automation Dispatch 原始计划书"
    },
    {
      "type": "Visible Automation Dispatch 代码实现依赖调研",
      "doc": "docs/requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md",
      "status": "已完成",
      "description": "确认第一版落在 AlembicWorkspace 脚本和本地运行态，不依赖 Lark Remote，Node 脚本不伪装调用 Codex automation 工具。",
      "insertAfter": "Visible Automation Dispatch 需求设计"
    }
  ],
  "currentIndexRows": [
    {
      "type": "VAD 原始计划书",
      "doc": "docs/requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md",
      "description": "Visible Automation Dispatch 原始目标和约束。",
      "insertAfter": "当前计划"
    },
    {
      "type": "VAD 需求设计",
      "doc": "docs/requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md",
      "description": "Visible Automation Dispatch 需求设计和阶段候选。",
      "insertAfter": "VAD 原始计划书"
    },
    {
      "type": "VAD 代码实现依赖调研",
      "doc": "docs/requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md",
      "description": "Visible Automation Dispatch 本地脚本、运行态和 automation 工具边界调研。",
      "insertAfter": "VAD 需求设计"
    }
  ]
}
-->
