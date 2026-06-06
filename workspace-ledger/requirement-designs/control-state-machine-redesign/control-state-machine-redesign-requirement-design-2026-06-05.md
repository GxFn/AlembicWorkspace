# Control State Machine Redesign Requirement Design

状态：implemented / state-machine-core-complete / route-fixtures-complete / legacy-default-removed
维护窗口：AlembicWorkspace
日期：2026-06-05
需求 Key：CONTROL-STATE-MACHINE-REDESIGN-2026-06-05

## 原始计划书

- 原始计划书：本需求由用户在 AlembicWorkspace 总控窗口直接提出，不另建独立 original plan。
- 原始计划书确认状态：`not-required`
- 原始计划书确认说明：用户已明确要求新建独立需求设计文档，完整描述当前流水线状态写入现状与问题，并重新规划职责分类、唯一状态机、文档与脚本自动化协作方向，给出多套核心方案；随后进一步裁决主路线为“唯一开发者可读推进文档 + 独立机器状态机 + 独立 JSON 自动化流程 + 最干净简洁模板”。
- 用户确认时间：2026-06-05
- DesignWindow 来源 signal / handoff（如有）：无
- Design 接收状态：`draft`
- 当前主线关系状态：`todo-candidate`

## 用户需求

```text
新建一个独立的需求设计文档，把现状和问题完整的表述清楚；
然后进行职责分类和唯一状态机和文档配合脚本自动化的主要方向进行重新规划设计，
给出几套核心方案。

用户最新裁决：
1. 简化文档数量，只保留唯一推进文档作为开发者可读；其它非开发者可读内容改为 JSON 等纯机器数据。
2. 维护统一状态机，但与开发者可读文档解耦；开发者可读文档只保留固定区域给机器操作更新，且只能脚本自动更新；状态机负责流程推进，窗口回填与状态解耦。
3. 自动化流程完全独立，与文档无关；自动化流程完全使用 JSON 等机器数据。
4. 做最干净简洁的模板，保证职责清晰，推进路线不分叉，维护简单。
5. 开发者推进文档承载需求目标、阶段方案、任务包和回填摘要等开发者需要阅读的信息；所有状态信息汇总到唯一状态区域，由脚本更新；其它补充信息只允许追加任务 / 追加记录，并用时间戳表达顺序。
```

## 需求明确性检查

- 用户场景：AlembicWorkspace 总控流程经过多轮无人值守自动化、Design handoff、TODO 入账、current plan sync、target result 回跳和归档后，出现“太多地方在修改状态”的维护压力。用户希望先把问题设计清楚，再决定如何调整流程。
- 完整功能闭环：先只完成需求设计，不启动实现；后续若用户确认某一方案，再进入代码实现依赖调研、目标阶段确认和 wave 执行。
- 输入：当前总控脚本、当前状态文档、AGENTS 门禁、workspace-control/governance skill、脚本流水线引用、此前只读审计结论。
- 输出：一份独立需求设计文档，包含现状、状态写入点、问题归因、职责分类、唯一状态机目标、用户已裁决主路线、被降级的备选方案、差距分析、TODO / Backlog 和待确认问题。
- 状态 / 数据变化：仅新增并更新本文档；不修改 current status、current plan、global TODO、Design inbox、automation runtime、线程注册表或子仓库源码。
- 生产方：AlembicWorkspace 总控。
- 消费方：后续总控流程治理任务、workspace 脚本调整任务、AGENTS / skill / template 治理任务。
- 验证方式：文档自检覆盖用户提出的四类内容；后续实现阶段再用脚本测试、pipeline fixture、current-plan sync check 和 closed-loop smoke 验证。
- 完成定义：本文档清楚回答“现在哪些地方在改状态、为什么问题严重、职责应如何分层、唯一状态机如何成为独立机器事实源、唯一开发者可读推进文档如何承载目标 / 阶段方案 / 任务包 / 回填摘要并只用一个脚本状态区显示状态、自动化如何完全脱离文档、模板如何保持最干净简洁”。
- 仍不明确的问题：实现时的 JSON 文件位置、schema 版本、历史运行态兼容策略、状态迁移脚本是否需要支持旧 current plan，以及哪些旧文档可以删除 / 归档 / 停止生成仍需后续代码调研和用户裁决。

## 调研范围

- 必读仓库：`codex-control-workspace`
- 观察仓库：无。本需求是总控流程治理，不涉及 Alembic / AlembicPlugin / AlembicCore 产品源码。
- 暂不纳入仓库：Alembic、AlembicCore、AlembicAgent、AlembicDashboard、AlembicPlugin、AlembicDesign、AlembicTest、真实测试项目。
- 关键入口文件：
  - `AGENTS.md`
  - `codex-control-workspace/.workspace-active/workspace/index.md`
  - `codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`
  - `codex-control-workspace/scripts/codex-automation-loop.mjs`
  - `codex-control-workspace/scripts/sync-current-plan.mjs`
  - `codex-control-workspace/scripts/workspace-control.mjs`
  - `codex-control-workspace/scripts/next-control-work.mjs`
  - `codex-control-workspace/scripts/import-design-handoffs.mjs`
  - `codex-control-workspace/scripts/archive-global-todo-board.mjs`
  - `codex-control-workspace/scripts/archive-workspace-docs.mjs`
  - `codex-control-workspace/scripts/compact-workspace-index.mjs`
  - `codex-control-workspace/scripts/generate-archive-topic-summaries.mjs`
  - `codex-control-workspace/skills/dev/control-workspace-governance/SKILL.md`
  - `codex-control-workspace/skills/dev/control-workspace-governance/references/script-pipeline.md`
- 关键测试 / 脚本：
  - `node scripts/workspace-control.mjs status --json`
  - `node scripts/codex-automation-loop.mjs status --json`
  - `node scripts/sync-current-plan.mjs --check`
  - `node scripts/verify-control-center.mjs --with-script-tests`
  - `node scripts/run-workspace-pipeline-e2e.mjs`

## 外部调研判断

- 是否需要联网：暂不需要。
- 判断理由：当前问题来自本地总控脚本和文档状态面过多，本地代码事实足以支撑第一版需求设计。外部状态机 / workflow engine 资料不能替代 AlembicWorkspace 的 AGENTS 门禁、direct-thread delivery、TargetResultEnvelope 和 current plan 规则。
- 若需要，优先来源：后续实现前若要引入状态机库、事件溯源模式或工作流 DSL，可再调研官方文档 / 成熟开源项目。
- 若不需要，说明原因：本轮用户要求先把现状、问题和方案写清楚，不要求选择第三方技术或实现。
- 外部结论如何约束或启发本地实现：后续最多作为命名和迁移模式参考，不能绕过总控判断、用户确认和本地脚本边界。

## 当前现状概览

当前总控流程大致分成四层，但这四层都在表达“状态”：

1. **长期需求 / TODO 层**
   - Requirement design、global TODO、Design inbox、next-work candidate。
   - 表达“需求是否可领取、是否已接收、是否候选、是否归档”。

2. **当前计划 / 人读投影层**
   - Current plan、workspace-current-status、workspace index、current index。
   - 表达“当前主线、发送给谁、窗口状态、下一步、可复制提示词”。

3. **自动化运行态层**
   - DispatchGroup、DispatchPacket、DeliveryEnvelope、DirectThreadDeliveryRun、TargetResultEnvelope、ThreadRegistry、WindowConfig、KeepLive、Stop marker。
   - 表达“投递是否准备、是否发送、是否回读、目标是否回填、组是否 ready / blocked / waiting”。

4. **归档 / 维护层**
   - Archive scripts、topic summaries、record map、TODO archive。
   - 表达“历史是否移出 current、索引是否压缩、完成项是否归档”。

这四层都合理存在，但缺少一个明确的“唯一状态事实源”。结果是同一语义可能同时出现在多个位置：current plan 状态、workspace-current-status 顶部状态、workspace index 当前状态行、窗口分派状态、dispatch group groupStatus、target result status、delivery run status、keep-live status、stop reason。

## 用户裁决后的硬目标

本需求不再把“轻量收敛、三机分层、事件溯源、强简化”作为同级候选路线。用户已经明确主方向：

1. **开发者只读一份推进文档**
   - 每个正在推进的需求只保留一份开发者可读推进文档。
   - 该文档负责解释目标、边界、当前阶段、下一步和需要用户裁决的事项。
   - 其它需要保留但不适合开发者阅读的状态、索引、回填、投递、候选、归档和验证中间数据，全部改为 JSON / JSONL 等机器数据。

2. **统一状态机独立于开发者文档**
   - 状态机是流程推进事实源。
   - 开发者可读文档不是状态机，不参与自动化流程计算。
   - 开发者可读文档只保留一个 `Unified Status` 统一状态区域，用于脚本自动更新摘要、当前阶段、任务状态、阻塞、下一步和必要提示；该区域不得手写。

3. **窗口回填与状态机解耦**
   - 目标窗口回填只生成 result / evidence 机器数据。
   - 回填本身不改变主状态，不关闭 TODO，不切换阶段，不触发下一跳。
   - 状态机读取回填数据后，由 reducer / controller decision 生成下一步候选；需要总控裁决的地方必须停在 decision-required。

4. **自动化流程完全独立于文档**
   - dispatch、delivery、readback、target result、review pack、keep-live、stop marker 全部是机器数据。
   - 自动化不读开发者可读推进文档作为状态源。
   - 自动化不写开发者文档正文；最多通过 projection script 更新 `Unified Status` 统一状态区域。

5. **模板最干净简洁**
   - 推进路线不分叉，不在同一模板里同时承载需求设计、TODO 账本、回填历史、自动化日志和归档摘要。
   - 开发者文档只回答“现在要完成什么、做到哪一步、下一步是什么、卡在哪里、需要谁裁决”。
   - 机器数据只回答“状态、事件、回填、投递、验证、投影”。

6. **状态统一显示，正文追加补充**
   - 开发者推进文档可以承载需求目标、阶段方案、任务包、回填摘要和人工补充说明。
   - 所有状态信息必须汇总在一个统一状态区域，由脚本从状态机和 projection 数据生成。
   - 任务包新增、回填摘要、人工说明和用户裁决记录只允许追加，不允许在正文里反复改写历史结论。
   - 追加记录必须带时间戳，依靠时间顺序表达演进，不再用多处状态表互相覆盖。

## 当前写入点审计摘要

### 自动化闭环运行态

`codex-automation-loop.mjs` 是当前自动化闭环主入口。它的只读命令包括 `status`、`review-results`、`review-pack`；写入命令和写入面如下：

| 写入入口 | 写入状态面 | 当前问题 |
| --- | --- | --- |
| `register-thread --write` | `thread-registry` | 线程注册是必要本地事实，但与 window config 派生关系未完全显式化。 |
| `build-window-config --write` | `window-config` | 配置既可单独生成，也会被 `prepare-dispatch` 重写。 |
| `create-dispatch --write` | `dispatch-packets` / `dispatch-groups` | 同时写 packet 与 group，group 承载 expected targets / return policy。 |
| `build-delivery --write` | `delivery-envelopes` | envelope 是投递准备，不是已发送事实，但经常在阅读上接近“任务已启动”。 |
| `prepare-dispatch --write` | `window-config` / `dispatch-packets` / `dispatch-groups` / `delivery-envelopes` / 可选 `keep-live` | 一个命令改多层状态，方便但也制造“谁是主写入口”的混淆。 |
| `build-controller-return --write` | `delivery-envelopes` | controller return 与 target delivery 共用 envelope 目录，状态语义不同。 |
| `record-delivery-run --write` | `delivery-runs` | 真实 host send/readback 证据，应该是 transport evidence，不应成为任务完成口径。 |
| `start-keep-live --write` | `keep-live` | 支撑无人值守，不应参与任务状态判断。 |
| `stop-keep-live --write` | `keep-live` | 支撑无人值守，不应参与任务状态判断。 |
| `keep-live-state --write` | `keep-live` | 兼容外部 keep-live evidence，容易与 watcher 自写状态重复。 |
| `submit-result --write` | `target-results` | 目标窗口回填 envelope，不是总控验收结论。 |
| `stop-loop --write` | `stop.json` + `keep-live` | 停止投递意图，容易被误读成需求完成。 |
| `keep-live-worker` | `keep-live` | 后台隐式写入者，用户不直接调用，但会改变状态文件。 |

去重后，自动化闭环至少有 9 个核心状态面：`thread-registry`、`window-config`、`dispatch-packets`、`dispatch-groups`、`delivery-envelopes`、`delivery-runs`、`target-results`、`keep-live`、`stop.json`。

### 当前计划与文档投影

`sync-current-plan.mjs --write` 会从 current plan 的 `workspace-sync` 信息同步最多 4 个文档面：

| 写入面 | 当前语义 | 当前问题 |
| --- | --- | --- |
| 当前计划自身状态投影 | 把 structured state 渲染回 `状态：...` | 计划内同时存在结构状态和人读状态。 |
| `workspace/index.md` | 当前计划 / 当前状态 / 窗口覆盖行 | index 既是入口又承载状态镜像。 |
| `current/index.md` | 当前短期地图 | 既是导航又可能影响“当前是什么”的判断。 |
| `workspace-current-status.md` | 短状态页、窗口分派、可复制提示词 | 与 current plan 高度重复，容易形成双主面。 |

### intake / 候选 / 归档维护写入

| 脚本 | 写入面 | 当前问题 |
| --- | --- | --- |
| `import-design-handoffs.mjs --write` | `design-handoff-inbox.md` | 生成 intake evidence，但容易被误读为正式 TODO。 |
| `next-control-work.mjs --write` | `.workspace-local/control-intake/next-control-work.json` | 候选扫描缓存，不应成为领取裁决。 |
| `archive-global-todo-board.mjs --apply` | `global-todo-board.md` + TODO archive | 改变 TODO 可见状态，需要明确不能由 archive 自动决定完成。 |
| `archive-workspace-docs.mjs --apply` | archive docs / workspace index / record map | 维护索引，但可能改变当前入口可见状态。 |
| `compact-workspace-index.mjs --apply` | index / manifest / record map | 压缩历史，不应改变当前主线事实。 |
| `generate-archive-topic-summaries.mjs --apply` | archive topic index | 归档摘要，不应影响 current state。 |

## 主要问题

### 问题 1：同一语义状态多处存在

“当前任务完成了吗”可能被以下位置共同表达：

- current plan `状态：...`
- `workspace-sync.state`
- `workspace-current-status.md` 顶部状态
- workspace index 当前状态行
- 窗口分派表状态
- DispatchGroup `groupStatus`
- TargetResultEnvelope `status`
- DirectThreadDeliveryRun `status`
- Stop marker reason

这些状态不是同一层级，但命名上都叫 status。总控需要人工记住“哪个 status 只是证据，哪个 status 是总控裁决”，这会放大误判风险。

### 问题 2：脚本既做机械写入又制造状态体感

`prepare-dispatch` 的价值是减少重复动作，但它一次写 window config、dispatch packet、dispatch group、delivery envelope，且可能启动 keep-live。它没有做总控判断，却会在本地生成大量“任务看起来已启动”的文件。

这会让后续回看时难以区分：

- 总控已经裁决可派发。
- 投递包已经生成。
- 目标窗口已经收到。
- 目标窗口已经回填。
- 总控已经验收。

### 问题 3：自动化运行态与文档状态互相投影，但没有硬分界

自动化运行态应回答 transport / result envelope 问题；文档状态应回答目标、边界、裁决、验收问题。当前二者都能被用来解释“下一步”，导致自动化结果可能被误当成总控事实裁决。

### 问题 4：keep-live 是 liveness，却进入了状态读面

keep-live 支撑无人值守运行，不表示任务进度。当前 `status` 输出会展示 keep-live status；current status 也曾记录 keep-live activeRunCount。这对诊断有用，但不应与 plan / dispatch / acceptance 状态混在一起。

### 问题 5：Design inbox、TODO、next-work 都能制造“可领取”信号

Design inbox 是 intake evidence，global TODO 是调度账本，next-work 是候选扫描缓存。三者都可能出现 ready / candidate / eligible 口径。若没有唯一领取状态机，总控容易把候选信号当成已确认任务。

### 问题 6：归档脚本能修改可见入口

归档和 index 压缩是维护动作，但它们会移动文件、改 index 或 TODO board。若没有“当前计划已完成 / 不再指向该项”的前置检查，归档动作可能改变用户看到的当前状态。

### 问题 7：状态枚举分散且层级不统一

AGENTS 当前列出窗口状态枚举：`待启动`、`执行中`、`待验收`、`阻塞`、`已完成`、`暂停`、`观察中`、`无任务`。自动化闭环另有 `waiting`、`ready`、`blocked`、`needs-controller-review`、`pending-host-send`、`sent`、`failed`。这些枚举都有必要，但缺少统一层级命名。

## 职责分类

### AlembicWorkspace 总控职责

总控只负责不可机械化的判断：

- 用户真实目标、完成定义、主线关系和范围裁决。
- 需求是否接收、是否进入 TODO、是否成为当前主线。
- producer / consumer 依赖顺序。
- 哪些窗口可派发、哪些窗口观察、哪些窗口阻塞。
- 目标窗口回填的原始证据是否可信。
- TODO 是否关闭、是否返工、是否进入下一阶段。
- 当前计划是否完成、暂停、归档或等待用户裁决。

总控状态必须是唯一裁决状态，不能由 target result、delivery run、script check 或 Design inbox 自动替代。

### 目标窗口职责

目标窗口只负责自己仓库 / 窗口的任务：

- 按 dispatch packet 指定范围执行。
- 返回 TargetResultEnvelope。
- 提供提交 hash、验证命令、报告路径、日志摘要、截图或其它可复核证据。
- 不代领下一窗口，不代验，不写总控接受结论。

### 自动化脚本职责

脚本只负责机械动作：

- 生成 dispatch packet / delivery envelope。
- 记录 host send/readback。
- 记录 target result envelope。
- 计算 group ready / missing / blocked 快照。
- 同步 current plan 的派生投影。
- 校验文档格式、窗口覆盖、TODO / task package、归档布局。

脚本不得自动决定：

- 接收 handoff。
- 领取 TODO。
- 关闭 TODO。
- 验收回填。
- 扩大需求范围。
- 启动测试窗口。
- 切换主线。

### 文档职责

文档职责必须收敛为“一份开发者可读推进文档 + 若干机器 JSON 数据”。旧的多文档人读面需要停止扩张，后续只保留必要历史归档。

| 文档 / 数据类型 | 职责 | 是否允许成为状态事实源 | 开发者是否日常阅读 |
| --- | --- | --- | --- |
| 需求设计文档 | 解释需求目标、问题、方案和待确认边界 | 是，作为需求设计事实源；不是执行状态源 | 需求启动前阅读 |
| 唯一推进文档 | 承载目标、完成定义、阶段方案、任务包、回填摘要、用户裁决和追加记录；所有状态集中在脚本统一状态区 | 否；只显示状态机投影，不持有状态机 | 是，唯一日常阅读面 |
| `controller-state.json` | 维护统一状态机、阶段、任务、裁决、transition | 是，流程推进唯一机器事实源 | 否 |
| `automation/*.json` / `*.jsonl` | dispatch、delivery、readback、result、review pack、keep-live、stop marker | 否；只作为自动化运行态和证据输入 | 否 |
| `projection/*.json` | 生成开发者推进文档固定区域的中间投影 | 否 | 否 |
| index / status / inbox / archive summary | 只作为导航或历史兼容入口，逐步机器化 / 精简 / 归档 | 否 | 否，除非调试 |

唯一推进文档只允许包含三类区域：

1. **稳定手写区域**：目标、边界、完成定义、阶段方案和不应频繁变动的说明。
2. **统一状态区域**：固定锚点内由脚本更新；汇总所有状态信息，包括主状态、当前阶段状态、任务包状态、窗口状态、阻塞状态、回填状态、下一步和最近 evidence 摘要。
3. **追加记录区域**：任务包新增、回填摘要、用户裁决、人工补充说明等只允许追加；每条必须带北京时间时间戳，用时间顺序表达演进。

统一状态区域必须有明确标记，例如：

```markdown
<!-- unified-status:start -->
<!-- 由脚本生成，禁止手写；所有状态信息只能出现在本区域 -->
<!-- unified-status:end -->
```

除统一状态区域外，脚本不得改写开发者推进文档正文。正文若需补充任务、回填摘要或裁决，只能在追加记录区域追加新条目，不回改历史条目。

### 自动化运行态职责

自动化运行态必须完全独立于文档，保存在 `.workspace-local` 或明确的机器数据目录，只回答运行问题：

- 哪个窗口注册了真实 thread id。
- 哪个 dispatch packet 已生成。
- 哪个 delivery envelope 等待发送。
- 哪个 delivery run 已证明 sent/readback。
- 哪个 target result envelope 已返回。
- 哪个 group 已 ready / blocked / waiting。
- keep-live 是否为无人值守提供支撑。

运行态不得回答“需求是否完成”。需求完成只能由 `controller-state.json` 的主状态和总控裁决事件回答。自动化不得读取开发者推进文档作为状态输入，也不得把投递 / 回填结果直接写进开发者推进文档。

## 唯一状态机目标

本需求建议建立一个独立的 **Controller State Machine**，把当前“多处状态”改成“一个机器状态机 + 若干机器证据数据 + 一个开发者可读投影文档”。

核心原则：

- 状态机以 JSON / JSONL 等机器数据保存，不藏在 Markdown 正文里。
- 状态机负责流程推进；开发者推进文档只展示投影。
- 窗口回填、自动化投递和 keep-live 都不是状态机本身，只是状态机 reducer 可读取的输入。
- 自动化流程不得依赖开发者推进文档；文档也不得反向驱动自动化。
- 所有状态变更必须经过 transition，不能由回填文件、delivery run 或 sync script 直接覆盖主状态。

### 状态机实体

| 实体 | 说明 | 事实源建议 |
| --- | --- | --- |
| `Demand` | 用户需求 / Design handoff / TODO 候选 | requirement design + `demands.json` |
| `ControllerState` | 当前流程主状态、阶段、任务、阻塞、裁决 | `controller-state.json` |
| `Transition` | 状态变化事件、原因、actor、证据 | `controller-events.jsonl` |
| `Stage` | 当前需求中的阶段 | `controller-state.json.stages[]` |
| `TargetTask` | 分派给某窗口的任务 | `controller-state.json.tasks[]` + dispatch packet |
| `AutomationRun` | 自动化投递 / 回跳 / keep-live 运行态 | `.workspace-local/codex-automation-loop/*.json` |
| `TargetResult` | 目标窗口回填 | target result JSON |
| `Evidence` | 提交、命令、报告、日志、截图等原始证据引用 | evidence JSON / referenced files |
| `Projection` | 开发者推进文档固定区域的投影数据 | `projection/*.json` + renderer |
| `DeveloperProgressDoc` | 唯一开发者可读推进文档 | Markdown projection target；不是状态源 |

### 主状态机候选枚举

建议统一 `ControllerState.state`，并把其它状态映射到它：

| 主状态 | 含义 | 允许来源 |
| --- | --- | --- |
| `idle` | 无当前活跃计划或等待新需求 | 总控裁决 |
| `intake` | 正在接收 / 审查需求 | 总控裁决 |
| `designing` | 正在形成需求设计或代码事实调研 | 总控裁决 |
| `needs-confirmation` | 需要用户确认目标、范围、方案或阶段 | 总控裁决 |
| `planned` | 需求已接收，当前计划/阶段已形成，但未派发 | 总控裁决 |
| `dispatching` | 总控正在创建或发送任务包 | 总控裁决 + dispatch evidence |
| `waiting-results` | 已发送，等待目标窗口回填 | delivery run evidence |
| `review-ready` | 回填已满足 review 条件，等待总控拉证据 | review-results 派生 |
| `accepting` | 总控正在复核原始证据 | 总控裁决 |
| `needs-rework` | 验收失败，需要返工 | 总控裁决 |
| `blocked` | 缺证据、缺权限、缺用户裁决或硬门禁 | 总控裁决 |
| `paused` | 用户或总控暂停 | 总控裁决 |
| `completed` | 最终目标达成 | 总控裁决 |
| `archived` | 已归档，不再是当前计划 | 归档后投影 |

### 附属状态必须加前缀

为避免所有状态都叫 `status`，附属状态应显式命名：

- `deliveryStatus`: `pending-host-send` / `sent` / `failed` / `blocked`
- `resultStatus`: `missing` / `completed` / `blocked` / `needs-review`
- `groupReviewStatus`: `waiting` / `ready` / `blocked`
- `keepLiveStatus`: `running` / `stopped` / `failed`
- `projectionStatus`: `synced` / `stale`
- `intakeStatus`: `ready-for-workspace` / `accepted-by-workspace` / `archived`

附属状态只能被 reducer 读取并生成 transition candidate，不得直接覆盖 `ControllerState.state`。projection script 只读取状态机输出，不参与 reducer，不改变状态机。

## 文档与脚本自动化协作方向

### 方向 1：只保留唯一开发者推进文档

每个活跃需求只保留一份开发者可读推进文档。它不是状态源，而是阅读界面。

推进文档只保留：

- 用户目标。
- 完成定义。
- 阶段方案。
- 任务包列表。
- 回填摘要。
- 用户裁决与人工补充记录。
- 一个统一状态区域。

推进文档不再承载：

- 全量 TargetResultEnvelope。
- delivery run 历史。
- keep-live 运行日志。
- Design inbox 全表。
- global TODO 全表。
- 归档摘要。
- 多窗口长回填。

这些内容全部改为 JSON / JSONL / referenced evidence file。

推进文档中的状态信息不分散写入正文。所有状态只出现在统一状态区域，由脚本从 `controller-state.json` 和 `projection.json` 渲染。任务包、回填摘要和用户裁决只做追加记录，并用北京时间时间戳保序。

### 方向 2：状态机独立维护，不嵌入 Markdown 正文

新增或改造为独立机器状态，例如：

```text
.workspace-active/workspace/current/<demand-key>/controller-state.json
.workspace-active/workspace/current/<demand-key>/controller-events.jsonl
.workspace-active/workspace/current/<demand-key>/projection.json
```

状态机负责：

- 需求是否已接收。
- 当前阶段。
- 当前允许动作。
- 当前阻塞。
- target tasks。
- result evidence 是否足够进入 review。
- 是否需要总控裁决。
- 是否可进入下一阶段。
- 是否完成。

推进文档只显示状态机 projection，不保存状态机。projection 必须汇总进唯一统一状态区域，不能在文档其它正文区域生成第二份状态。

### 方向 3：窗口回填与状态解耦

目标窗口回填只写机器数据：

```text
target-results/<window>__<task>.json
evidence/<window>/<task>/<evidence>.json
```

回填不允许直接：

- 改 `controller-state.json`。
- 改推进文档正文。
- 改 current status。
- 关闭 TODO。
- 启动下一批 dispatch。
- 标记需求完成。

状态机 reducer 读取回填后，只能生成 transition candidate 或 `decision-required`。总控裁决后，才由 controller transition 写入主状态。

### 方向 4：自动化流程完全独立于文档

自动化流程只使用 JSON / JSONL：

- dispatch packet JSON。
- delivery envelope JSON。
- delivery run JSON。
- target result JSON。
- review pack JSON。
- keep-live state JSON。
- stop marker JSON。

自动化不得：

- 读取推进文档来决定下一跳。
- 解析 Markdown 状态行。
- 改写开发者文档正文。
- 把 result envelope 当成验收。

自动化可以：

- 根据 `controller-state.json` 中由总控裁决写入的 allowed task 生成 dispatch。
- 记录 delivery/readback/result 机器证据。
- 生成 review pack。
- 停在 `decision-required` 等待总控。

### 方向 5：文档投影单向生成

文档投影只有一个方向：

```text
controller-state.json + projection.json -> developer-progress.md unified status block
```

不允许反向：

```text
developer-progress.md -> controller-state.json
```

这意味着开发者可以读推进文档，但流程推进不依赖 Markdown。脚本若发现推进文档统一状态区域与 projection 不一致，只能重写该区域或报 stale，不能从文档正文推导状态。

### 方向 6：模板最简洁

新模板应只有这些主区：

1. `# <需求名> Progress`
2. `## Unified Status`
3. `## Goal`
4. `## Completion Definition`
5. `## Stage Plan`
6. `## Task Packages`
7. `## Backfill Summaries`
8. `## Decisions And Append Log`

其中 `Unified Status` 是唯一脚本可写状态区域，其它区域只能由总控人工裁决后手写或追加。`Task Packages`、`Backfill Summaries`、`Decisions And Append Log` 只允许追加带时间戳的条目，不用改写旧条目表达状态变化。

## 真实落地方案

### 统一设计哲学

总控流程和无人值守自动化采用同一套设计哲学，但不是同一条运行链路。

统一哲学只有一套：

- **一个目标事实源**：用户目标、完成定义、阶段、任务包、阻塞和验收裁决最终都归 `controller-state.json` 与 `controller-events.jsonl`。
- **一个开发者阅读面**：开发者只读 `developer-progress.md`，其中只有 `Unified Status` 是状态投影；正文只承载目标、方案和追加记录。
- **一个证据原则**：任何窗口回填、delivery run、日志、报告、提交、截图都只是 evidence input；没有总控 decide，就没有验收事实。
- **一个写入纪律**：主状态只能由 state transition 写；文档状态只能由 projection renderer 写；自动化运行态只能由 automation scripts 写。
- **一个失败哲学**：缺证据、缺线程、缺 readback、缺用户裁决时 fail closed；不能靠继续派发制造完成感。

但运行路线必须完全独立：

- **总控流程路线**是人 / 总控主导的决策路线。它可以完全不启用无人值守，不需要线程投递，不依赖 `.workspace-local/codex-automation-loop`。只要有 state root、任务包、证据和总控裁决，就能推进。
- **无人值守自动化路线**是 transport / callback 路线。它只做投递、readback、result envelope、review pack、keep-live 和 controller return；它不拥有目标定义、不决定任务是否完成、不读取 Markdown，也不能替总控写主状态。

两条路线共享概念模型，不共享推进权。唯一允许交汇的点只有机器契约：

| 交汇点 | 总控流程路线职责 | 无人值守自动化路线职责 | 禁止 |
| --- | --- | --- | --- |
| `controller-state.json.allowedActions` | 写入允许动作和 eligible tasks | 只读，用于生成 dispatch | automation 自行追加任务 |
| `task-packages/*.json` | 创建任务包和目标窗口约束 | 只读，用于提示词和 packet | automation 从 Markdown 推导任务 |
| `target-results/*.json` | 读取并复核 | 写入 result envelope / evidence refs | target result 直接改主状态 |
| `automation/**/*.json` | 读取作为 transport evidence | 写入 delivery / readback / review pack | delivery run 变成完成结论 |
| `transition-candidates/*.json` | 作为总控判断输入 | reducer 可生成候选 | reducer 自动 decide |
| `developer-progress.md` | 阅读 / 稳定区维护 / 追加摘要 | 不读、不写 | automation 解析或更新正文 |

因此，自动化可以整套关闭而不影响总控继续推进；总控也可以不打开推进文档，仅靠 state / evidence 完成裁决；推进文档只是开发者可读投影，不是流程依赖。

### 总体架构

落地后，一个活跃需求只有一个开发者可读目录面和一个机器状态目录。推荐根目录：

```text
codex-control-workspace/.workspace-active/workspace/current/<demand-key>/
  developer-progress.md
  controller-state.json
  controller-events.jsonl
  projection.json
  demand.json
  task-packages/
    <task-package-id>.json
  target-results/
    <window>__<task-id>.json
  evidence/
    evidence-index.json
  transition-candidates/
    <candidate-id>.json
  automation/
    dispatch-groups/
    dispatch-packets/
    delivery-envelopes/
    delivery-runs/
    review-packs/
  archive/
```

线程注册、真实 thread id、keep-live worker pid 和其它本机敏感运行态仍放在：

```text
codex-control-workspace/.workspace-local/
```

不把 raw thread id、token、绝对本机路径写进 tracked 文档或开发者推进文档。

### 双路线独立架构

#### 路线 A：总控流程路线

总控流程路线面向用户目标和开发者可读推进，适用于普通需求接收、设计评审、代码事实调研、手动分派、自测、手动验收、用户裁决和归档。

最小闭环：

```text
intake/design -> state init -> progress template -> task package -> evidence/result input -> reducer candidate -> controller decide -> projection render -> next task or completed
```

它可以完全不需要：

- 真实 Codex thread id。
- direct-thread delivery。
- keep-live。
- controller return。
- `.workspace-local/codex-automation-loop`。

它必须拥有：

- `controller-state.json`。
- `controller-events.jsonl`。
- `demand.json`。
- `task-packages/*.json`。
- `target-results/*.json` 或其它 evidence input。
- `developer-progress.md` 的唯一 `Unified Status` projection。

路线 A 的关键脚本只处理总控决策和投影，不处理线程发送：

```text
controller-state.mjs init
controller-state.mjs add-task-package
controller-state.mjs reduce-results
controller-state.mjs decide
render-progress-doc.mjs
append-progress-log.mjs
verify-controller-state.mjs
```

#### 路线 B：无人值守自动化路线

无人值守自动化路线面向长时间运行、跨窗口投递和回跳，适用于用户明确开启无人值守，并且当前需求已经有已确认任务包和 eligible target tasks 的场景。

最小闭环：

```text
state allowed task -> dispatch packet -> delivery envelope -> direct-thread send/readback -> target result -> controller return -> review pack -> total-control decide
```

它可以完全不需要读取：

- `developer-progress.md`。
- current plan Markdown。
- current status Markdown。
- global TODO Markdown。
- Design inbox Markdown。

它必须拥有：

- 已确认的 `controller-state.json` 和 `task-packages/*.json`。
- `.workspace-local` 下真实线程注册。
- dispatch group / packet / delivery envelope。
- delivery run readback evidence。
- target result envelope。
- review pack / group snapshot。

路线 B 的脚本只能处理 transport 与 evidence，不能处理总控裁决：

```text
codex-automation-loop.mjs build-window-config
codex-automation-loop.mjs prepare-dispatch-from-state
codex-automation-loop.mjs build-delivery
codex-automation-loop.mjs record-delivery-run
codex-automation-loop.mjs submit-result
codex-automation-loop.mjs review-pack
codex-automation-loop.mjs build-controller-return
codex-automation-loop.mjs start-keep-live
codex-automation-loop.mjs stop-loop
```

`prepare-dispatch-from-state` 是建议新增的替代入口：它从 `stateRoot` 和 target task id 读取机器任务，不再从 `controlPlan` Markdown 读取权威任务描述。若为了人类上下文保留 `controlPlan` 字段，只能标为 `humanContextRef`，不能作为 automation authority。

#### 两条路线的独立性约束

- 路线 A 没有 automation runtime 时仍然可完成需求。
- 路线 B 没有 `developer-progress.md` 读取权限时仍然可投递和回跳。
- 路线 B 失败只产生 transport blocker / readiness risk，不自动改变路线 A 的主状态。
- 路线 A 可以读取路线 B 的 delivery run / review pack 作为证据，但必须由总控 decide 才能写状态。
- 路线 A 的 projection 更新不能触发路线 B 投递。
- 路线 B 的 controller return 只能唤醒路线 A 复核，不能自己进入下一轮任务选择。
- 任一方向发现缺口，都通过 `decision-required` 或 `blocked` 回到总控，不互相修补对方状态。

#### 独立运行示例

手动总控，不启用无人值守：

```text
controller-state init
add-task-package
人工复制任务给目标窗口或总控自测
import-target-result / evidence-index update
reduce-results
controller decide
render-progress-doc
```

无人值守，不依赖文档：

```text
controller-state transition --to dispatching --allow task
codex-automation-loop prepare-dispatch-from-state --state-root <root> --target-task <id>
host direct-thread send + readback
record-delivery-run
target submit-result
build-controller-return + host send/readback
controller review-pack
reduce-results
controller decide
```

### 文件职责

| 文件 / 目录 | 写入者 | 读取者 | 职责 |
| --- | --- | --- | --- |
| `developer-progress.md` | 总控手写稳定区；projection script 写 `Unified Status` | 用户 / 开发者 / 总控 | 唯一开发者可读推进文档 |
| `controller-state.json` | state transition script | reducer / automation / projection / verify | 唯一流程状态机快照 |
| `controller-events.jsonl` | state transition script append-only | audit / reducer / verify | 状态变更审计 |
| `projection.json` | projection builder | renderer / verify | `Unified Status` 的机器输入 |
| `demand.json` | intake script / 总控确认后生成 | state init / next-work | 需求元信息，不是执行状态 |
| `task-packages/*.json` | 总控通过脚本追加 | automation / projection | 任务包定义，不直接表示完成 |
| `target-results/*.json` | 目标窗口回填脚本 | reducer / 总控验收 | 回填输入，不改变主状态 |
| `evidence/evidence-index.json` | evidence collector / 总控 | reducer / review | 原始证据索引 |
| `transition-candidates/*.json` | reducer | 总控 | 候选结论，不改变状态 |
| `automation/**/*.json` | automation scripts | reducer / review / audit | 投递、readback、review pack 和 keep-live 机器运行态 |

### `developer-progress.md` 模板

开发者推进文档只保留以下区块：

```markdown
# <Demand Title> Progress

## Unified Status

<!-- unified-status:start -->
<!-- generated; do not edit -->
<!-- unified-status:end -->

## Goal

## Completion Definition

## Stage Plan

## Task Packages

## Backfill Summaries

## Decisions And Append Log
```

规则：

- `Unified Status` 是唯一状态显示区，只能由脚本更新。
- `Goal` / `Completion Definition` / `Stage Plan` 是稳定区，由总控根据用户裁决维护。
- `Task Packages` 只追加任务包条目，每条带 `YYYY-MM-DD HH:mm CST`。
- `Backfill Summaries` 只追加回填摘要，每条带 `YYYY-MM-DD HH:mm CST`，长详情写 JSON / evidence ref。
- `Decisions And Append Log` 只追加用户裁决、总控解释和人工补充，每条带 `YYYY-MM-DD HH:mm CST`。
- 正文不得散落 `状态：`、窗口状态、任务状态、完成状态、阻塞状态；这些全部在 `Unified Status` 里显示。

### `Unified Status` 内容

`Unified Status` 由 `projection.json` 渲染，固定包含：

```text
Demand:
Main state:
Stage:
Current task packages:
Windows:
Blockers:
Next action:
Review:
Automation:
User decisions needed:
Last updated:
Source state:
```

其中：

- `Main state` 来自 `controller-state.json.state`。
- `Stage` 来自 active stage。
- `Current task packages` 汇总任务包状态，不从任务包正文读取。
- `Windows` 汇总窗口状态，不从 Markdown 表格读取。
- `Review` 汇总回填是否 ready / blocked / decision-required。
- `Automation` 只显示简短运行态摘要，不显示 raw thread id。
- `Source state` 显示 state revision / event id，用于确认投影来源。

### `controller-state.json` schema 草案

```json
{
  "schemaVersion": 1,
  "demandKey": "CONTROL-STATE-MACHINE-REDESIGN-2026-06-05",
  "title": "Control State Machine Redesign",
  "state": "planned",
  "stateReason": "user-confirmed-direction",
  "revision": 1,
  "activeStageId": "stage-0",
  "updatedAt": "2026-06-05T00:00:00+08:00",
  "allowedActions": [],
  "blockers": [],
  "decisionsRequired": [],
  "stages": [],
  "taskPackages": [],
  "targetTasks": [],
  "windows": [],
  "review": {
    "status": "none",
    "readyResultIds": [],
    "blockedResultIds": [],
    "missingResultIds": []
  },
  "automation": {
    "enabled": false,
    "activeRunIds": [],
    "lastReviewPack": null
  },
  "projection": {
    "status": "stale",
    "lastRenderedAt": null,
    "progressDoc": "developer-progress.md"
  }
}
```

主状态只允许这些值：

```text
idle
intake
designing
needs-confirmation
planned
dispatching
waiting-results
review-ready
accepting
needs-rework
blocked
paused
completed
archived
```

附属状态必须带前缀，不与主状态混写：

```text
stageState
taskPackageState
targetTaskState
windowState
deliveryStatus
resultStatus
reviewStatus
projectionStatus
keepLiveStatus
```

### `controller-events.jsonl` schema 草案

每行一个事件：

```json
{
  "eventId": "evt-20260605-0001",
  "createdAt": "2026-06-05T00:00:00+08:00",
  "actor": "controller",
  "type": "state.transition",
  "from": "planned",
  "to": "dispatching",
  "reason": "user-confirmed-stage-0-dispatch",
  "evidenceRefs": [],
  "allowedWrites": ["controller-state.json", "projection.json"],
  "forbiddenConclusions": ["target-result-is-acceptance"],
  "stateRevision": 2
}
```

事件规则：

- 所有主状态变化必须有 event。
- 所有任务包新增必须有 event。
- 所有总控验收裁决必须有 event。
- 目标窗口回填不会写 `state.transition`，只写 `target.result.received` 或 evidence input。
- projection 更新不是主状态变化，只能写 `projection.rendered`。

### 脚本边界

建议新增或改造以下脚本职责：

| 脚本 | 读 | 写 | 禁止 |
| --- | --- | --- | --- |
| `controller-state.mjs init` | demand design / user-confirmed input | state / event / initial projection | 不创建 automation |
| `controller-state.mjs transition` | state / event / evidence refs | state / event | 不读 Markdown 正文 |
| `controller-state.mjs add-task-package` | state / user-confirmed task package | task package JSON / event / append log input | 不自动 dispatch |
| `controller-state.mjs reduce-results` | state / automation JSON / target results / evidence index | transition candidate JSON | 不写主状态 |
| `controller-state.mjs decide` | transition candidate / controller verdict | state / event | 不读取推进文档状态 |
| `render-progress-doc.mjs` | state / projection JSON / template | `Unified Status` block | 不改正文其它区域 |
| `append-progress-log.mjs` | append entry JSON | append-only Markdown section | 不改旧条目 / 不写状态 |
| `verify-controller-state.mjs` | state / events / progress doc / automation JSON | report | 不修复状态 |
| `codex-automation-loop.mjs` | state allowed task / automation JSON | dispatch / delivery / run / result JSON | 不解析 Markdown，不验收 |

`workspace-control.mjs` 只能作为 wrapper，必须在 `--print` 或 JSON 输出里显示底层写入文件，不能隐藏写入边界。

### 无人值守自动化与线程投递规则

这部分不是另一个状态机，而是唯一状态机的运行输入 / 证据通道。自动化脚本只能根据 `controller-state.json`、任务包 JSON 和本地线程注册表工作；不得解析 `developer-progress.md`，不得把投递、回跳、keep-live 或脚本输出当成总控验收结论。

#### 入口门禁

无人值守自动化只有在同时满足以下条件时才能进入 continuous loop：

- `controller-state.json.state` 处于 `planned`、`dispatching`、`waiting-results`、`review-ready` 或 `needs-rework` 中的合法可推进状态。
- `controller-state.json.allowedActions` 明确包含 `dispatch`、`review-results` 或 `dispatch-rework`。
- `controller-state.json.automation.enabled=true`，且对应 event 记录用户授权或总控在用户已确认目标内的自动化授权。
- 当前需求的最终目标、完成定义、仓库边界和可领取 task package 已经写入机器数据。
- 目标窗口和总控窗口均有真实线程注册；缺任一真实 thread id 时 fail closed。
- 不存在 `stop.json`、硬停止卡命中、用户裁决待确认或无可领取任务。

阶段完成不是默认停点。只要最终目标未完成、仍有已确认边界内的 eligible task，且没有硬门禁，自动化应继续 review、补 task package、投递和回跳；反过来，若没有 eligible task、目标已完成、证据不足需要人工裁决或用户停止，必须停止，不创建下一跳。

#### 线程注册

真实 Codex thread id 只允许保存在本地运行态：

```text
codex-control-workspace/.workspace-local/codex-automation-loop/thread-registry/<window>.json
```

线程注册规则：

- `windowName` 必须匹配 `workspace.config.json` 或 `.workspace-local/workspace.config.json` 中的窗口身份。
- `deliveryRole` 只允许 `controller`、`target`、`test-target`、`design` 或 `observer`；只有 `controller`、`target`、`test-target` 可参与投递。
- registry 可以保存 raw thread id，但 tracked 文档、推进文档、提示词、回填正文、GitHub 和 target result 中都不得出现 raw thread id。
- `cwd` 与 `responsibilityRoot` 不一致时，提示词必须声明窗口职责来源，不能只从 cwd 推断仓库职责。
- 缺注册、注册窗口不匹配、角色不可投递、线程 readback 失败，都写 delivery blocked / failed 证据，不能用占位线程继续。

`thread-registry` 是本机运行事实，不是需求状态。更换线程只改变本地投递能力，不改变 task package、阶段完成度或总控验收结论。

#### 分派生成

总控裁决可派发后，脚本只做机械准备：

- 从 `controller-state.json` 读取 allowed task package / target task。
- 为每个 dispatch group 写 `dispatch-groups/<group>.json`，其中固定 `controllerWindow` 和 `returnPolicy`。
- 写 `dispatch-packets/*.json` 和 `delivery-envelopes/*.json`。
- delivery envelope 必须引用 `stateRoot`、`stateRevision`、`taskPackageId`、`targetTaskId`、`dispatchGroup`、`controllerWindow`、`returnPolicy`、`threadRegistryRef` 和 `loopGuard`。
- `prepare-dispatch` 不选择任务、不验收、不改主状态、不宣称已发送。

`returnPolicy.mode` 只允许：

- `group-ready`：整组 barrier，所有 expected targets 都有 result 后才允许一次 controller return。
- `per-target`：单个 target 可回跳，但回跳 envelope 必须携带完整 `groupSnapshot`，让总控看见 missing / blocked / remaining targets。

#### direct-thread send 与 readback

`DeliveryEnvelope` 只是 pending host send 计划。真实投递完成必须同时满足：

- delivery adapter 使用注册线程发送 normal new turn / follow-up。
- 发送后读取目标线程，确认 readback。
- 写入 `DirectThreadDeliveryRun`，且 `status="sent"`、`readback.ok=true`。

若 host send 不可用、thread id 缺失、readback 失败或目标线程不匹配：

- 写 `status="blocked"` 或 `status="failed"` 的 delivery run。
- reducer 只能产出 transport blocked / decision-required candidate。
- 不自动重复投递，不创建替代线程，不把 delivery envelope 当成已投递证据。

delivery sent 只证明提示词到达线程，不证明任务完成。总控仍需等待 target result 和原始证据。

#### 目标窗口回填

目标窗口只执行 dispatch packet 指定给自己的任务：

- 读取目标仓库 `AGENTS.md`、机器 task package、dispatch packet 和必要 evidence refs。
- 只写 `target-results/*.json`、证据文件或目标仓库代码 / 测试变更。
- `TargetResultEnvelope` 只代表回填输入，不触发主状态 transition。
- 目标窗口不得代领其它窗口任务，不得创建下一目标窗口 delivery，不得替总控验收。

回填中如只有自然语言判断、文档读取或脚本表面输出，缺提交 hash、diff、命令输出、runtime JSON、日志、报告路径或截图等可复核证据，reducer 应标为 evidence-insufficient / decision-required。

#### controller return

controller return 是唤醒总控复核，不是下一跳，也不是验收结论。

允许创建 controller return 的条件：

- dispatch group 的 `returnPolicy` 允许当前回跳。
- `group-ready` 下整组 expected targets 已有 result 或 blocked result。
- `per-target` 下当前 trigger target 已有 result 或 blocked result。
- `build-controller-return` 使用 dispatch group 固定的 `controllerWindow`，不能改回 workspace config 中其它控制窗口。
- 同一 result / reason 不得重复创建 controller return。

controller return 也必须经过 direct-thread send 和 readback。只有存在匹配的 delivery run，且 `status="sent"`、`readback.ok=true`，才算真实回跳完成。回跳 prompt 首行必须是任务语义，例如：

```text
继续总控验收：AlembicPlugin 回填。
```

prompt 正文只放动态变量、规则名、state root、task id、dispatch group、skill 指向和必要异常摘要。完整 snapshot 留在 JSON 中，不能把大段命令手册、状态表或 raw thread id 写入 prompt。

#### continuous loop 决策

总控收到回跳后按固定顺序推进：

1. 读取 `controller-state.json`、dispatch group、target results、delivery runs、review pack 和 evidence index。
2. 拉取原始证据，复核提交、diff、命令输出、runtime JSON、日志、报告或截图。
3. `reduce-results` 只输出 candidate，不改主状态。
4. 总控做 accept / rework / blocked / decision-required / completed 裁决。
5. `controller-state.mjs decide` 写 state transition 和 event。
6. `render-progress-doc.mjs` 只更新 `Unified Status`。
7. 若目标未完成且存在 eligible task，继续生成下一批 dispatch。
8. 若完成、无任务、证据不足需人工裁决、用户停止、硬门禁命中或自动化边界不再满足，写停止原因并停止。

自动化可以保持推进状态，但不能越过总控裁决。任何“问题优先记录”都必须落入机器 evidence / blocker / decision-required，不得靠继续派发掩盖。

#### keep-live

keep-live 只是无人值守 liveness support：

- 用户明确开启无人值守时应启动 keep-live 或记录 readiness risk。
- keep-live 不属于投递 transport、不属于目标任务、不属于验收证据。
- keep-live watcher 可被多个 automation run 共享，通过 lease 计数，最后一个 lease 释放后停止。
- keep-live 启动失败不等于目标任务失败，但必须写 automation readiness risk。
- stop-loop 释放当前 run 的 keep-live lease，不删除历史 delivery / result / evidence。

#### 重试与去重

默认 fail closed，不做无限重试。

- deliveryId 应由 `demandKey`、`stateRevision`、`dispatchGroup`、`targetWindow`、`targetTaskId` 生成，保证幂等。
- 同一个 deliveryId 已有 `sent/readback.ok=true` 时不得再次发送。
- `blocked` / `failed` delivery 需要总控 decide 后才能重试；重试必须产生新 event 或新 state revision。
- controller return 同理，同一 `dispatchGroup + triggerTarget + triggerTaskId + returnReason` 只能成功一次。
- 脚本必须使用 state root lock，避免两个总控窗口同时创建同一批 delivery。

#### 自动化验收标准

无人值守与线程投递改造完成时，至少要用 fixture 证明：

- automation path 不解析 Markdown。
- 缺 target thread、缺 controller thread、角色不匹配和 readback 失败都会 fail closed。
- `DeliveryEnvelope` / `ControllerReturnEnvelope` 在没有 delivery run 前都保持 pending。
- target result 不会直接改主状态。
- reducer 不写 verdict，总控 decide 才写 transition。
- keep-live failure 只进入 readiness risk，不改变任务验收状态。
- final complete、no eligible task、hard gate、user stop、decision-required 都会停止，不创建下一跳。

### 文档模板、Skill 与脚本资产规划

这部分是落地资产设计，不只是文档描述。实现时应按“模板资产 -> skill 路由 -> 脚本 contract -> 校验 fixture”的顺序推进。

#### 文档模板资产

建议新增模板目录：

```text
codex-control-workspace/templates/control-state-machine/
  developer-progress.template.md
  unified-status.template.md
  task-package-entry.template.md
  backfill-summary-entry.template.md
  decision-log-entry.template.md
```

模板职责：

| 模板 | 用途 | 写入方式 | 禁止 |
| --- | --- | --- | --- |
| `developer-progress.template.md` | 新需求唯一开发者推进文档骨架 | scaffold script 初次生成 | 不能带当前状态值 |
| `unified-status.template.md` | `Unified Status` 区块渲染模板 | renderer 每次替换 marker 内内容 | 不能从 Markdown 反推 state |
| `task-package-entry.template.md` | 任务包追加摘要 | append script 追加 | 不能改旧任务包条目 |
| `backfill-summary-entry.template.md` | 回填摘要追加 | append script 追加 | 不能写验收结论，除非引用总控 decide |
| `decision-log-entry.template.md` | 用户裁决 / 总控裁决追加 | append script 追加 | 不能绕过 state event |

`developer-progress.template.md` 的固定结构：

```markdown
# {{title}} Progress

## Unified Status

<!-- unified-status:start -->
<!-- generated; do not edit -->
<!-- unified-status:end -->

## Goal

{{goal}}

## Completion Definition

{{completionDefinition}}

## Stage Plan

{{stagePlan}}

## Task Packages

## Backfill Summaries

## Decisions And Append Log
```

模板规则：

- 只有 `Unified Status` marker 内可被 renderer 替换。
- 其它区块只能由总控在需求接收 / 用户裁决后维护，或由 append script 追加新条目。
- 追加条目统一使用 `YYYY-MM-DD HH:mm CST`，并携带 source event / evidence ref。
- 模板不得包含 `状态：`、`发送给：`、`当前窗口：` 等旧式状态行。

#### Skill 分层规划

`AGENTS.md` 只保留硬规则、停止卡、职责边界和最小入口。可执行步骤下沉到 skill / reference，但不得削弱 AGENTS。

建议 skill 分层：

| Skill / reference | 归属路线 | 职责 | 禁止 |
| --- | --- | --- | --- |
| `control-workspace-governance/SKILL.md` | 路线 A | 总控流程、需求接收、TODO 入账、手动分派、验收、文档模板、state decide | 不讲 direct-thread 细节 |
| `control-workspace-governance/references/controller-state-machine.md` | 路线 A / shared | state schema、transition、candidate、projection contract | 不写 automation 操作步骤 |
| `control-workspace-governance/references/developer-progress-template.md` | 路线 A / projection | 推进文档模板、append-only 规则、Unified Status 字段 | 不保存主状态 |
| `control-workspace-governance/references/script-contracts.md` | shared | 每个脚本读写边界、命令参数、禁止项 | 不替代总控判断 |
| `codex-automation-controller/SKILL.md` | 路线 B | controller 侧 dispatch / review / controller return / keep-live | 不做验收裁决 |
| `codex-automation-target/SKILL.md` | 路线 B target | 目标窗口读取 packet、执行任务、写 result、回跳总控 | 不创建下一目标窗口任务 |
| `control-workspace-governance/references/direct-thread-window-config.md` | 路线 B transport | thread registry、window config、delivery run、readback | 不写目标完成状态 |
| `control-workspace-governance/references/codex-automation-loop.md` | 路线 B loop | automation JSON、return policy、stop-loop、review-pack | 不解析 Markdown |

Skill 更新原则：

- governance skill 是总控路线入口，必须说明“可以不启用 automation 完成需求”。
- automation controller skill 是无人值守路线入口，必须说明“automation 是 delivery layer，不拥有任务选择和验收”。
- target skill 必须只认 dispatch packet / target task，不认 current plan Markdown 为权威任务。
- 所有 skill 示例 prompt 都必须使用 `stateRoot` / `taskPackageId` / `targetTaskId` / `dispatchGroup`，旧 `controlPlan` 只能作为 `humanContextRef`。

#### 脚本规划总表

建议脚本按职责拆成三组：state、document projection、automation transport。

| 脚本 / 命令 | 路线 | 读 | 写 | 完成定义 |
| --- | --- | --- | --- | --- |
| `controller-state.mjs init --state-root` | A | demand input / templates | `demand.json`、state、event、progress doc | 新需求 state root 可验证 |
| `controller-state.mjs add-stage` | A | state | state、event | 阶段进入 state，不写 Markdown 状态 |
| `controller-state.mjs add-task-package` | A | state / task JSON input | task package、state、event、append input | 任务包可被 automation 或手动路线消费 |
| `controller-state.mjs transition` | A | state / expected from | state、event | from/to 原子校验通过 |
| `controller-state.mjs import-target-result` | A | result envelope / evidence refs | `target-results`、evidence index、event | 回填入库但不改主状态 |
| `controller-state.mjs reduce-results` | A/shared | state、target results、automation evidence | `transition-candidates/*.json` | 只产 candidate，不写 verdict |
| `controller-state.mjs decide` | A | candidate / 总控 verdict | state、event、append input | 主状态唯一裁决入口 |
| `render-progress-doc.mjs` | A/projection | state、projection、template | marker 内 `Unified Status` | 不改正文其它区域 |
| `append-progress-log.mjs` | A/projection | append entry JSON | progress doc append-only 区 | 只追加，带北京时间 |
| `verify-controller-state.mjs` | shared | state、events、progress doc、automation evidence | report | 检查双路线隔离和模板纪律 |
| `codex-automation-loop.mjs prepare-dispatch-from-state` | B | state root、target task、thread registry | dispatch group / packet / delivery envelope | 不读 Markdown，不发送 |
| `codex-automation-loop.mjs record-delivery-run` | B | delivery envelope、host evidence | delivery run | sent/readback 或 blocked/failed 明确 |
| `codex-automation-loop.mjs submit-result` | B | target evidence input | target result envelope | 只回填，不改主状态 |
| `codex-automation-loop.mjs review-pack --state-root` | B/shared | automation evidence、target results | review pack | 汇总证据，不验收 |
| `codex-automation-loop.mjs build-controller-return` | B | dispatch group、group snapshot、controller registry | controller return envelope | pending-host-send，不宣称回跳完成 |
| `codex-automation-loop.mjs start-keep-live` | B | automation run id | keep-live lease | liveness evidence，不是任务状态 |

需要降级或改造的旧脚本：

| 旧入口 | 新定位 | 改造要求 |
| --- | --- | --- |
| `sync-current-plan.mjs` | legacy compatibility / projection migration helper | 不再作为新需求状态同步入口 |
| `next-control-work.mjs` | demand candidate reader | 不得从 Markdown 直接产生执行状态 |
| `workspace-control.mjs` | thin wrapper | 输出必须显示真实底层写入文件和 route |
| `codex-automation-loop.mjs prepare-dispatch --control-plan` | compatibility alias | 新路线改为 `prepare-dispatch-from-state`，`controlPlan` 降级为 `humanContextRef` |
| archive scripts | archive guard | 只能在合法主状态下归档，不产生完成结论 |

#### Schema 与 fixture 资产

建议新增 schema / fixture：

```text
codex-control-workspace/schemas/control-state-machine/
  controller-state.schema.json
  controller-event.schema.json
  task-package.schema.json
  target-result.schema.json
  transition-candidate.schema.json
  projection.schema.json
  automation-dispatch.schema.json

codex-control-workspace/scripts/fixtures/control-state-machine/
  manual-route/
  unattended-route/
  mixed-evidence/
  failure-missing-thread/
  failure-result-without-evidence/
```

fixture 必须分别证明：

- 路线 A 不需要 automation runtime。
- 路线 B 不需要读取推进文档。
- 两条路线在 target result / candidate / decide 边界交汇。
- 缺线程、缺 readback、缺证据都会停在 blocked / decision-required。
- projection stale 时只能重渲染 `Unified Status` 或报错，不能反推 state。

### 真实执行顺序

真实执行顺序先分共同入口，再按路线选择。

#### 共同入口

1. **需求接收**
   - 总控读取用户需求、需求设计和代码事实。
   - 若目标 / 完成定义 / 阶段不清，停在 `needs-confirmation`。

2. **初始化需求机器目录**
   - 生成 `demand.json`。
   - 生成 `controller-state.json`，主状态为 `intake` 或 `planned`。
   - 追加 `controller-events.jsonl` 初始事件。
   - 从模板创建 `developer-progress.md`。

3. **写稳定区**
   - 总控写 `Goal`、`Completion Definition`、`Stage Plan`。
   - 不在正文写任何状态。

4. **渲染第一次 `Unified Status`**
   - `render-progress-doc.mjs` 根据 state / projection 更新唯一状态区。
   - 若 projection stale，脚本报 stale，不从 Markdown 反推。

5. **追加任务包**
   - 总控通过 `controller-state.mjs add-task-package` 增加 task package JSON。
   - `append-progress-log.mjs` 在 `Task Packages` 追加带时间戳摘要。
   - 状态仍由 `controller-state.json` 管。

#### 路线 A：总控流程继续推进

1. **选择手动 / 总控推进**
   - 总控决定不启用 automation，或当前任务不需要线程投递。
   - state 写入 allowed action，例如 `manual-dispatch`、`self-verify`、`import-result`。

2. **手动分派或自测**
   - 总控复制轻量任务提示给目标窗口，或在本窗口完成可自测验证。
   - 目标窗口 / 总控产生 result envelope、提交、命令输出、日志、报告或截图。

3. **回填入库**
   - `controller-state.mjs import-target-result` 写 `target-results/*.json` 与 evidence index。
   - 回填不会改变主状态。

4. **Reducer 计算**
   - `controller-state.mjs reduce-results` 读取 result / evidence。
   - 输出 `transition-candidates/*.json`，例如 `review-ready`、`needs-rework`、`blocked`、`decision-required`。

5. **总控裁决**
   - 总控拉原始证据复核。
   - `controller-state.mjs decide` 写 state transition 和 event。
   - `append-progress-log.mjs` 追加回填摘要或裁决记录。

6. **投影与循环**
   - `render-progress-doc.mjs` 更新 `Unified Status`。
   - 若仍有手动可推进任务，继续追加 task package 或 import result。
   - 若完成，主状态转 `completed`。

#### 路线 B：无人值守自动化继续推进

1. **进入 automation gate**
   - 用户明确开启无人值守，且 state 允许 `dispatch` 或 `dispatch-rework`。
   - 总控线程和目标线程已在 `.workspace-local` 注册。
   - keep-live 启动或记录 readiness risk。

2. **从 state 生成投递**
   - `codex-automation-loop.mjs prepare-dispatch-from-state` 读取 state root / target task。
   - 写 dispatch group、dispatch packet、delivery envelope。
   - 不读取 Markdown，不宣称已发送。

3. **真实线程发送**
   - host direct-thread send 到目标窗口。
   - readback 成功后写 `DirectThreadDeliveryRun sent/readback.ok=true`。
   - 失败则写 blocked / failed，并停止该投递。

4. **目标窗口执行与回填**
   - 目标窗口只执行 packet 指定任务。
   - `submit-result` 写 result envelope 和 evidence refs。

5. **controller return**
   - 按 dispatch group 的 `returnPolicy` 生成 controller return envelope。
   - host send 到总控线程并 readback。
   - 没有 delivery run 前，回跳只是 pending。

6. **总控 review**
   - 总控读取 review pack、result、delivery run 和原始证据。
   - `reduce-results` 只输出 candidate。
   - 总控 `decide` 后才写 state transition。

7. **继续或停止**
   - 若目标未完成且有 eligible task，创建下一批 dispatch。
   - 若完成、无任务、证据不足需用户裁决、用户停止或硬门禁命中，写停止原因并停止。

#### 共同出口

- `completed` 只能由总控 decide 写入。
- `blocked` / `needs-confirmation` 只能由总控根据 candidate 与原始证据裁决。
- 归档只在 `completed` / `paused` / `archived` 合法状态下执行。
- 无论走路线 A 还是路线 B，最终都必须更新 `Unified Status`，但不得改写正文历史条目。

### 可靠性约束

- 所有 state 写入必须 atomic write。
- 主状态 transition 必须先验证 `from` 与当前 state 一致。
- 同一 state root 需要 lock，避免两个总控窗口并发写。
- `controller-events.jsonl` append-only，不允许改旧事件。
- `controller-state.json.revision` 每次主状态变化递增。
- `projection.json.sourceRevision` 必须等于 state revision，否则 `Unified Status` 标为 stale。
- `developer-progress.md` 必须且只能有一个 `<!-- unified-status:start -->` / `<!-- unified-status:end -->`。
- Markdown 正文中禁止新增 `状态：` 主状态行；validator 发现则失败。
- 自动化 JSON 不能包含 raw thread id；raw thread id 只在 `.workspace-local` registry。
- `target-results/*.json` 不能直接触发下一跳；必须先 reducer，再总控 decide。
- archive 脚本必须验证 state 为 `completed` / `paused` / `archived`，且 progress doc 不再是 active demand。

### 迁移策略

迁移分三步，不一次性推翻所有旧文件：

1. **兼容期**
   - 旧 current plan / current status / index 仍可读。
   - 新需求优先使用 `developer-progress.md` + state JSON。
   - 旧 `sync-current-plan.mjs` 不再用于新需求主流程，只保留 legacy check。

2. **双写禁止期**
   - 新需求禁止同时维护 current plan 状态和 `controller-state.json` 主状态。
   - 若必须从旧 current plan 迁移，先生成 migration report，再初始化 state。

3. **收敛期**
   - workspace index 只链接唯一推进文档。
   - current status 降级为极简入口或机器生成摘要。
   - global TODO / Design inbox / test exchange 人读表逐步转 machine demand / evidence JSON。

### 验证方案

必须新增 fixture 覆盖三类场景：

1. **manual-route**
   - 初始化需求 state root。
   - 从模板生成唯一推进文档。
   - 添加任务包并追加北京时间条目。
   - 不创建 `.workspace-local/codex-automation-loop`。
   - import target result / evidence。
   - reducer 输出 candidate。
   - 总控 decide 写 state transition。
   - projection 更新 `Unified Status`。

2. **unattended-route**
   - 从已存在 state root 和 eligible target task 进入 automation gate。
   - `prepare-dispatch-from-state` 生成 dispatch / delivery JSON。
   - delivery run 必须有 sent/readback evidence。
   - target result 和 controller return 完成后生成 review pack。
   - reducer 输出 candidate，总控 decide 后才能进入下一批或停止。
   - 全程验证 automation 不读取 / 不写 Markdown。

3. **failure-route**
   - 缺 target thread、缺 controller thread、readback failed、result without evidence、projection stale、archive active state。
   - 每个失败都必须停在 blocked / decision-required / readiness risk。
   - 不得创建下一跳，不得写 completed，不得改 Markdown 正文状态。

通用校验：

- Markdown 正文没有散落状态。
- `Unified Status` marker 唯一。
- `controller-events.jsonl` append-only。
- `target-results/*.json` 不能直接改主状态。
- `transition-candidates/*.json` 不能被当成 verdict。
- route A 和 route B 在没有对方 runtime / 文档读取权限时仍能完成各自职责。

默认验证命令候选：

```text
node scripts/verify-controller-state.mjs --fixture
node scripts/verify-controller-state.mjs --fixture manual-route
node scripts/verify-controller-state.mjs --fixture unattended-route
node scripts/run-workspace-pipeline-e2e.mjs
node scripts/verify-control-center.mjs --with-script-tests
node scripts/check-script-docs.mjs
```

### 验收标准

本需求落地完成必须同时满足：

- 开发者日常只需要打开一份 `developer-progress.md`。
- 所有状态信息只出现在 `Unified Status`。
- `Unified Status` 只能由脚本更新。
- 任务包 / 回填摘要 / 用户裁决 / 人工补充只追加带北京时间时间戳的条目。
- 自动化不解析 Markdown，不写 Markdown 正文。
- 窗口回填不会直接改变主状态。
- reducer 只产出 candidate / decision-required，不做总控验收。
- 总控验收必须通过 state transition 写入。
- raw thread id 不进入 tracked docs。
- route A 总控流程在没有 automation runtime 时可以完整推进。
- route B 无人值守自动化在不读取 Markdown 时可以完整投递、回跳和产出 review evidence。
- governance / automation controller / automation target skill 的职责分层完成，旧 `controlPlan` authority 退为 `humanContextRef`。
- 文档模板资产、schema 资产和 fixture 资产落地。
- 全链路 fixture 能分别证明 manual route、unattended route、failure route，以及 state -> result/evidence -> reducer candidate -> controller decide -> projection 的共同闭环。

## 核心方案

### 已确认主方案：唯一推进文档 + 独立状态机 + 独立自动化机器数据

这是用户最新裁决后的主方案，不再作为待选项。

**核心结构**

```text
developer-progress.md              # 唯一开发者可读推进文档
controller-state.json              # 唯一流程状态机
controller-events.jsonl            # 状态 transition 审计
automation/*.json                  # dispatch / delivery / readback / result / review / keep-live
projection.json                    # 文档统一状态区投影输入
```

**职责**

- `developer-progress.md`：开发者阅读，不驱动流程。
- `controller-state.json`：流程推进唯一状态源。
- `controller-events.jsonl`：状态变更审计。
- `automation/*.json`：自动化独立运行态和证据。
- `projection.json`：从状态机生成文档统一状态区域。

**推进方向**

1. 先做完整代码事实 inventory，确认所有状态写入点。
2. 设计 `controller-state.json` schema。
3. 设计 `controller-events.jsonl` transition event schema。
4. 设计唯一推进文档模板。
5. 改造 projection renderer，只能更新 `Unified Status` 统一状态区域。
6. 改造 automation scripts，使其只读写机器 JSON，不解析 Markdown。
7. 改造 validators，禁止脚本从文档正文推导状态或自动改主状态。

**优点**

- 文档数量最少。
- 开发者阅读面清楚。
- 状态机与阅读文档解耦。
- 自动化流程不依赖 Markdown。
- 窗口回填不会直接推进状态。
- 后续维护简单，职责清晰。

**代价**

- 需要重构 current plan template、sync-current-plan、automation-loop、next-work 和校验脚本。
- 需要兼容历史 Markdown current plans。
- 需要明确哪些旧文档停止生成、哪些转为 JSON、哪些仅归档。

### 降级备选 1：只做轻量收敛

原方案 A 只把现有文档 / 脚本加边界标记，不真正减少文档数量，也不让自动化脱离 Markdown。该方案不满足用户“最干净简洁”和“自动化完全与文档无关”的要求，只能作为迁移期兼容策略，不能作为最终目标。

### 降级备选 2：事件溯源为主

原方案 C 审计能力强，但如果直接作为主路线，会增加 event / reducer / projection 的复杂度。当前主方案保留 `controller-events.jsonl` 作为 transition 审计，但不把整个流程设计成复杂事件溯源系统；只有在后续无人值守规模继续扩大时，再考虑完整事件重放。

### 降级备选 3：三机分层

原方案 D 的 Controller / Transport / Projection 分层仍然保留为内部职责分类，但不再表达成三套状态机。用户要求“维护统一的状态机”，所以只有 `ControllerStateMachine` 是状态机；transport 和 projection 都是机器数据处理器。

### 不采用：强简化到人工主导

原方案 E 通过取消大量镜像和自动化能力来减少状态面，但会牺牲无人值守证据链。用户并未要求放弃自动化，而是要求自动化独立、干净、机器化。因此不采用人工主导强简化。

## 实施路线

| 阶段 | 目标 | 产物 | 完成判断 |
| --- | --- | --- | --- |
| Stage 0 | 代码事实与状态面 inventory | 完整状态写入点矩阵、状态语义分类、历史兼容边界 | 所有 write/apply 命令、状态目录、文档投影和隐式 worker 归类 |
| Stage 1 | 统一哲学与双路线 contract | route A / route B contract、交汇点、禁止互写规则 | 手动总控路线和无人值守路线均可独立跑通 |
| Stage 2 | 机器数据模型设计 | `controller-state.json`、`controller-events.jsonl`、task package、target result、candidate、projection、automation schema | 每类数据有唯一 owner、allowed writer 和 reader |
| Stage 3 | 文档模板资产 | `templates/control-state-machine/*.template.md` | 唯一推进文档模板和追加条目模板可由脚本生成 |
| Stage 4 | Skill 分层改造 | governance / automation controller / target skill + references | 两条路线入口清晰，AGENTS 只保留硬规则 |
| Stage 5 | 状态机与投影脚本 | `controller-state.mjs`、`render-progress-doc.mjs`、`append-progress-log.mjs`、`verify-controller-state.mjs` | route A 不依赖 automation runtime 即可推进 |
| Stage 6 | 自动化 JSON 独立化 | `codex-automation-loop.mjs prepare-dispatch-from-state`、review-pack stateRoot、controller return 独立证据 | route B 不解析 / 不写 Markdown |
| Stage 7 | 双路线 fixture 回归 | manual-route、unattended-route、failure cases | 两条路线分别独立、交汇点一致、失败 fail closed |
| Stage 8 | 迁移和减量 | legacy current plan compatibility、archive strategy、旧人读面降级 | 新旧流程可安全并存或迁移，开发者日常只读一份推进文档 |

## 目标能力设计

- 最终能力：AlembicWorkspace 拥有一套干净、唯一、可审计的机器状态机；开发者只读一份推进文档；自动化完全使用 JSON / JSONL 机器数据运行。
- 用户体验：用户和开发者打开唯一推进文档即可看到目标、阶段方案、任务包、回填摘要、追加记录，以及统一状态区中的当前状态、下一步、阻塞和需要裁决的问题；不会被 status mirrors、TODO board、delivery runs、TargetResultEnvelope 或 keep-live 状态干扰。
- 功能闭环：需求 intake -> 总控接收 -> `controller-state.json` transition -> automation JSON dispatch -> target result JSON -> reducer 产生 decision-required -> 总控裁决 transition -> projection renderer 更新推进文档统一状态区域 -> 完成 / 归档。
- 模块边界：
  - `AGENTS.md`：保留硬门禁、唯一状态机原则、文档最小化原则和自动化独立原则。
  - governance skill：保留操作步骤、脚本细节、迁移说明和排错说明。
  - developer progress template：唯一开发者可读推进文档模板，包含目标 / 阶段方案 / 任务包 / 回填摘要 / 追加记录 / 统一状态区。
  - `controller-state.json`：唯一流程状态机。
  - `controller-events.jsonl`：状态 transition 审计。
  - automation JSON：dispatch / delivery / result / review / keep-live 机器运行态。
  - projection renderer：只把机器投影写入推进文档 `Unified Status` 统一状态区域。
  - `.workspace-local`：保存本地运行态、thread id、delivery evidence、keep-live，不进 tracked 文档。
- 数据 / 状态模型：`ControllerState.state` 为主状态；`deliveryStatus`、`resultStatus`、`groupReviewStatus`、`keepLiveStatus`、`projectionStatus` 为机器附属状态；附属状态只能作为 reducer input。
- API / contract：当前不引入外部 API；脚本 CLI 输出需增加 state authority / evidence boundary / decision-required 字段。
- UI / handoff：无 Dashboard UI；开发者阅读面是唯一推进文档；其它 UI-like docs 降级为机器投影或历史归档。
- 安装 / 发布 / artifact：仅 workspace governance 脚本、模板和机器 schema；不进入产品发布链路。

## 禁止的伪实现

- 只把状态字段改名，但不减少事实源。
- 新增一个 `state.json`，但仍允许 current status / index / TODO 手写主状态。
- 新增 `controller-state.json`，但自动化仍解析 Markdown 决定下一跳。
- 保留多个开发者可读 current plan / current status / dispatch / handoff 人读面。
- 把开发者推进文档当成自动化状态输入。
- 让脚本改写推进文档正文或追加区，而不是只更新 `Unified Status` 统一状态区域。
- 在任务包、回填摘要、决策记录正文里散落状态字段。
- 通过改写旧任务包 / 旧回填记录表达最新状态，而不是在统一状态区更新状态、在追加区新增时间戳记录。
- 把 review-results 的 `decision` 当成总控验收结论。
- 把 keep-live running 当成任务执行中。
- 把 TargetResultEnvelope completed 当成总控已完成。
- 把 Design ready-for-workspace 当成 current plan accepted。
- 为了“唯一状态机”删除必要 evidence JSON，导致无人值守无法复核。

## 差距分析

| 能力 | 当前状态 | 缺口 | 归属窗口 | 风险 |
| --- | --- | --- | --- | --- |
| 唯一开发者推进文档 | current plan / current status / index / TODO / inbox 多个 Markdown 面 | 需设计唯一 `developer-progress.md` 模板并停止扩张其它人读面；文档承载目标 / 阶段方案 / 任务包 / 回填摘要 | AlembicWorkspace | 开发者继续被多个文档误导 |
| 独立状态机 | 状态散落在 Markdown 与 runtime JSON | 需定义 `controller-state.json` 作为唯一流程状态机 | AlembicWorkspace | 状态源继续漂移 |
| 状态 transition 审计 | 当前多由脚本直接写状态文件 | 需定义 `controller-events.jsonl` 和 transition validator | AlembicWorkspace | 无法解释谁把状态改了 |
| 自动化独立 | automation JSON 与 current plan / Markdown 语义交缠 | 需禁止自动化解析 Markdown，并只读机器 state / task data | AlembicWorkspace | 自动化继续依赖文档格式 |
| 窗口回填解耦 | TargetResultEnvelope 容易被误当完成 | 回填只作为 evidence input，reducer 输出 decision-required | AlembicWorkspace | 回填继续绕过总控裁决 |
| 统一状态区域 | 当前状态散落在状态行、窗口表、TODO、回填、提示词 | 所有状态必须汇总到 `Unified Status`，只能脚本更新 | AlembicWorkspace | 状态继续多源冲突 |
| Projection 单向生成 | `sync-current-plan` 当前会同步多个 Markdown 面 | 需重构为 state/projection -> `Unified Status` block，禁止 Markdown -> state | AlembicWorkspace | 文档继续成为双向状态源 |
| 模板极简 | 当前模板承载计划、分派、TODO、回填、提示词 | 需拆掉混杂职责，保留目标 / 阶段方案 / 任务包 / 回填摘要 / 追加记录 / 统一状态区 | AlembicWorkspace | 模板维护继续复杂 |
| 追加顺序 | 当前回填区和历史记录可能被反复改写 | 任务包新增、回填摘要、用户裁决、人工补充只允许追加并带北京时间时间戳 | AlembicWorkspace | 时间顺序不清、历史被覆盖 |
| Design / TODO intake | inbox / TODO / next-work 均有 candidate 状态 | 需改为 machine demand data，不进入开发者推进文档正文 | AlembicWorkspace | 候选被误领取 |
| Archive maintenance | 归档脚本可改 index / TODO | 需前置 state guard，不从归档脚本产生主状态 | AlembicWorkspace | 归档改变当前入口事实 |
| keep-live support | 已有 keep-live state/control | 需保留为 automation support JSON，不进入推进状态 | AlembicWorkspace | liveness 被误读为任务状态 |

## 实现进展

更新时间：2026-06-05

已完成的 tracked 能力：

- Stage 0 只读 inventory 已完成，明确 `.workspace-active/` 与 `.workspace-local/` 不跟随 `codex-control-workspace` 开源仓库提交；tracked 只提交模板、schema、脚本、skill、fixture 和测试。
- 已新增 `codex-control-workspace/templates/control-state-machine/`，包含唯一开发者推进文档、`Unified Status`、任务包追加、回填摘要追加和决策日志追加模板。
- 已新增 `codex-control-workspace/schemas/control-state-machine/`，覆盖 `controller-state`、`controller-event`、`task-package`、`target-result`、`transition-candidate`、`projection`、`automation-dispatch`。
- 已新增 `scripts/controller-state.mjs`：
  - `init` 生成 ignored per-demand state root。
  - `add-task-package` 写 task package JSON 并只标记 projection stale。
  - `import-target-result` 只写 target result 机器回填，不改变 `controller-state.json`。
  - `reduce-results` 聚合 target result，生成 `review-ready` / `waiting-results` 状态和 transition candidate；不验收、不派发。
  - `decide-review` 只有在总控显式给出 candidate、decision 和 reason 后，才写入接受 / 返工 / 阻塞裁决。
  - `complete-demand` 在所有 task package / target task 均已 accepted、无 active blocker 且提供 reason/evidence 后，显式写入最终 `completed` transition；不启动 automation，不改推进文档正文。
- 已新增 `scripts/render-progress-doc.mjs`，只从 state/projection 单向更新 `developer-progress.md` 中唯一 `Unified Status` marker block。
- 已新增 `scripts/append-progress-log.mjs`，只向允许的开发者可读追加区追加带时间戳条目，不修改机器状态。
- 已补 `scripts/controller-state.test.mjs`，覆盖初始化、路径边界、任务包、投影、append-only、result import、review reduction 和 explicit decision。
- 已更新 `scripts/codex-automation-loop.mjs`：
  - `prepare-dispatch-from-state` 从 state root 读取 `controller-state.json` / task package JSON，生成 packet / group / delivery 机器数据，写入 `stateRef` 与可选 `humanContextRef`，不再用 `controlPlan` 作为权威字段。
  - `review-pack --state-root` 可直接汇总 state-root target result JSON，输出 review pack / gates / forbidden conclusions；不依赖 dispatch packet，不写状态，不验收。
  - `build-controller-return` 保留旧 `--control-plan` 兼容，但 state-root dispatch group 可继承 `stateRef` / `humanContextRef` 生成 controller-return envelope，不再强制 Markdown plan。
  - 旧 `prepare-dispatch`、`create-dispatch`、packet/delivery/result/review 行为保持兼容。
- 已更新 `scripts/README.md`、`templates/README.md`、`package.json`、`scripts/verify-control-center.mjs`、`scripts/workspace-control.mjs`，让新增脚本进入索引和全量脚本测试。
- 已新增 `scripts/fixtures/control-state-machine/` 三条正式 route fixture：
  - `manual-route`：证明普通总控路线可从 state root 创建任务包、导入结果、reducer 出 candidate、显式 `decide-review`、append-only 日志和 `Unified Status` 投影完成闭环。
  - `unattended-route`：证明 `prepare-dispatch-from-state`、controller return、`review-pack --state-root` 可不依赖 `controlPlan`，并且 `controllerReturnDelivery` 与 state-root review pack 解耦。
  - `failure-route`：证明缺 target result 时只进入 waiting、blocked result 只生成待总控裁决 candidate、过期 candidate 会 fail closed。
- 已新增 `scripts/control-state-machine-route-fixtures.test.mjs` 并接入 `package.json`、`verify-control-center.mjs` 和 `workspace-control.mjs` 全量脚本测试矩阵。
- 已执行真实 state-root 样本审计：从 AFAPI 全量需求中选取 `AFAPI-FULL-17 / Dashboard diagnostics UI`，创建 ignored state root 和唯一 `developer-progress.md`，跑通 init -> task package -> state-root dispatch packet -> fail-closed direct-thread boundary -> target result -> review-pack -> reducer -> decide-review -> complete-demand -> projection renderer；审计报告见 `control-state-machine-redesign-real-closed-loop-audit-2026-06-05.md`。
- 审计中修复两处缺口：
  - `record-delivery-run` 对 controller-return blocked run 现在回退记录 `controllerWindow`，避免缺线程时证据无法显示回跳目标窗口。
  - 新增 `complete-demand`，避免任务 evidence 接受后需求主状态只能回到 `planned`、无法表达最终完成。
- 已从 `scripts/codex-automation-loop.mjs` 删除旧 `CODEX_VAD_KEEP_AWAKE_COMMAND`、`CODEX_VAD_KEEP_AWAKE_ARGS_JSON`、`CODEX_VAD_KEEP_AWAKE` fallback；保留的新环境变量只有 `CODEX_AUTOMATION_KEEP_LIVE*`。
- 已改造 `codex-automation-controller` / `codex-automation-target` skill：
  - 默认 prompt variables 改为 `stateRoot` / `humanContextRef`。
  - 目标窗口默认用 `controller-state.mjs import-target-result` 写 state-root target result，回填不改主状态。
  - controller return 默认继承 dispatch group 的 `stateRef`，`--control-plan` 只作为 pre-state-root legacy group 兼容。
- 已改造 `control-workspace-governance` skill、`script-pipeline.md`、`codex-automation-loop.md`、`direct-thread-window-config.md`、`README.md`、`scripts/README.md` 和 child access-card 生成文本：
  - 新需求默认路线统一为 `controller-state` state root + `developer-progress.md` + `prepare-dispatch-from-state`。
  - `workspace-sync` / `sync-current-plan.mjs` / `workspace-control-plan-template.md` 明确降级为 legacy current-plan mirror。
  - `controlPlan` 不再作为新路线 authority，只保留 migration compatibility。
- 已改造 `scripts/workspace-control.mjs` wrapper：
  - `sync` 默认只接受 `--state-root` 并调用 `render-progress-doc.mjs`，缺 state root 时 fail closed。
  - 旧 Markdown current-plan 镜像同步只能通过显式 `legacy-sync` 调用。
  - `status` 不再默认运行 `sync-current-plan.mjs --check`，避免旧 Markdown plan 继续作为默认健康入口。
- 已删除 starter 安装模板中的 `example-control-plan.md` 和安装脚本复制逻辑；新装 workspace 初态为 `idle / no active demand`，通过 `controller-state.mjs init` 创建 state root，不再默认生成旧 current plan。
- 已更新并同步 `codex-control-workspace/AGENTS.md` 到父级 `AGENTS.md`，新入口说明明确 `controller-state.mjs` + `codex-automation-loop.mjs` 双脚本分工。

已验证：

- `node --test scripts/controller-state.test.mjs scripts/control-state-machine-route-fixtures.test.mjs`：通过，12 tests。
- `node --test scripts/controller-state.test.mjs scripts/codex-automation-loop.test.mjs scripts/control-state-machine-route-fixtures.test.mjs`：通过，23 tests；覆盖 controller-return blocked delivery evidence 和 `complete-demand` final transition。
- `node --test scripts/codex-automation-loop.test.mjs`：通过，30 tests；包含旧 `CODEX_VAD_KEEP_AWAKE=0` 不再关闭 keep-live 的回归。
- `node scripts/check-script-docs.mjs`：通过。
- `git diff --check`：通过。
- `npm test`：通过，65 tests。
- `node scripts/verify-control-center.mjs --with-script-tests`：除既有 `BiliDili/.agents/skills` Project Skill projection residue 外全部通过；workspace boundary、workspace docs、script docs、current plan sync、decision preflight、current layout、dispatch coverage、test boundary、TODO board、task packages、git diff whitespace 和 workspace script tests 均通过。该 residue 是此前已知真实项目 Project Skill projection residue，不属于本需求新增改动。

本轮保留边界：

- 没有物理删除 `sync-current-plan.mjs`、`workspace-control-plan-template.md`、旧 `create-dispatch` / `prepare-dispatch --control-plan`，因为当前活跃历史文档和既有测试仍需要 migration compatibility；它们已从默认新路线降级为 legacy compatibility，不再作为新需求 authority。旧 `example-control-plan.md` starter 默认入口已物理删除。
- 没有迁移历史 `.workspace-active` current docs、global TODO、Design inbox 或历史 `.workspace-local/codex-automation-loop` 文件；该迁移属于后续单独兼容 / 归档策略，不影响新状态机路线落地。
- 未启动 automation、未注册或修改 thread、未写真实 `.workspace-active` / `.workspace-local` 运行态、未修改产品仓库、未切换 current status。

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响目标 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CSMR-TODO-00 | 已完成 | 调研 | P0 | AlembicWorkspace | 完整列出所有 Markdown 写入面、JSON 写入面、write/apply 命令、状态目录和隐式 worker | 是 | 已形成 Stage 0 inventory | AlembicWorkspace |
| CSMR-TODO-00A | 已完成 | 设计 | P0 | AlembicWorkspace | 固化总控流程路线 A 与无人值守路线 B 的独立 contract：共享概念、交汇点、禁止互写、失败返回方式 | 是 | 已由 state-root / automation split 实现 | AlembicWorkspace |
| CSMR-TODO-01 | 已完成 | 设计 | P0 | AlembicWorkspace | 设计唯一开发者推进文档模板，承载目标、完成定义、阶段方案、任务包、回填摘要、决策追加记录和 `Unified Status` 统一状态区 | 是 | 已建模板并由 render 测试覆盖 | AlembicWorkspace |
| CSMR-TODO-02 | 已完成 | 设计 | P0 | AlembicWorkspace | 设计 `controller-state.json` schema：需求、阶段、任务、主状态、阻塞、允许动作、decision-required | 是 | 已建 schema 与脚本状态 | AlembicWorkspace |
| CSMR-TODO-03 | 已完成 | 设计 | P0 | AlembicWorkspace | 设计 `controller-events.jsonl` transition schema：from/to/actor/trigger/evidence/forbiddenConclusions | 是 | 已建事件流与测试 | AlembicWorkspace |
| CSMR-TODO-03A | 已完成 | 设计 | P0 | AlembicWorkspace | 设计 task package、target result、transition candidate、projection、automation dispatch schema，保证 route A / B 只在机器契约交汇 | 是 | 已建 schema 与 route fixture | AlembicWorkspace |
| CSMR-TODO-04 | 已完成 | 脚本 | P0 | AlembicWorkspace | 设计 reducer / transition validator，禁止 result / delivery / projection 直接修改主状态 | 是 | `reduce-results` / `decide-review` / stale candidate 测试通过 | AlembicWorkspace |
| CSMR-TODO-05 | 已完成 | 脚本 | P0 | AlembicWorkspace | 重构 projection renderer：只从 state/projection JSON 单向更新推进文档 `Unified Status` 统一状态区 | 是 | `render-progress-doc.mjs` 测试通过 | AlembicWorkspace |
| CSMR-TODO-05A | 已完成 | 脚本 | P0 | AlembicWorkspace | 设计 append-only 文档更新规则：任务包新增、回填摘要、用户裁决、人工补充必须追加北京时间时间戳条目 | 是 | `append-progress-log.mjs` 测试通过 | AlembicWorkspace |
| CSMR-TODO-05B | 已完成 | 模板 | P0 | AlembicWorkspace | 建立 `templates/control-state-machine/*.template.md`：progress、unified-status、task package entry、backfill summary、decision log | 是 | 模板已建并被脚本消费 | AlembicWorkspace |
| CSMR-TODO-05C | 已完成 | Skill | P0 | AlembicWorkspace | 改造 governance / automation controller / automation target skill 分层，明确 route A / B 独立入口和 shared contract | 是 | skill/reference 已改为 state-root 默认 | AlembicWorkspace |
| CSMR-TODO-06 | 已完成 | 脚本 | P0 | AlembicWorkspace | 让 automation flow 完全 JSON 化，不解析 Markdown，不写推进文档正文 | 是 | `prepare-dispatch-from-state` / `review-pack --state-root` 通过 | AlembicWorkspace |
| CSMR-TODO-06A | 已完成 | 脚本 | P0 | AlembicWorkspace | 新增 `prepare-dispatch-from-state` 和 `review-pack --state-root`，把旧 `controlPlan` 降级为 `humanContextRef` | 是 | route fixture 和 automation test 通过 | AlembicWorkspace |
| CSMR-TODO-07 | 已完成 | 脚本 | P1 | AlembicWorkspace | 调整 `codex-automation-loop` 输出和目录：明确 automation JSON 是运行态 / evidence，不是状态机 | 是 | stateRef / review pack / docs 已落地 | AlembicWorkspace |
| CSMR-TODO-08 | 已完成 | 文档 | P1 | AlembicWorkspace | 更新 AGENTS / governance skill / script-pipeline / automation-loop reference，写明文档最小化和自动化独立原则 | 是 | 源 AGENTS 和父级 AGENTS 已同步 | AlembicWorkspace |
| CSMR-TODO-09 | 已完成 | 验证 | P1 | AlembicWorkspace | 增加 fixture：manual-route 不依赖 automation、unattended-route 不读 Markdown、shared candidate/decide 边界、failure fail-closed | 是 | `control-state-machine-route-fixtures.test.mjs` 3 routes 通过 | AlembicWorkspace |
| CSMR-TODO-10 | 默认入口已删除 / 历史兼容待迁移 | 迁移 | P1 | AlembicWorkspace | 制定旧 current plan / current status / index / TODO / inbox 人读面减量迁移策略 | 是 | `workspace-control sync` 和 starter 已切到 state-root；旧 current-plan mirror 仅保留 legacy compatibility；历史迁移另需用户裁决 | AlembicWorkspace |
| CSMR-TODO-11 | 观察 | 迁移 | P2 | AlembicWorkspace | 评估历史 `.workspace-local/codex-automation-loop` 运行态只兼容读取还是迁移到新 schema | 否 / 待裁决 | 用户确认迁移策略 | AlembicWorkspace |

## 后续拆分候选方向

| 阶段 | 目标 | 生产窗口 | 消费窗口 | 完成判断 |
| --- | --- | --- | --- | --- |
| 0 | 写入面 inventory | AlembicWorkspace | AlembicWorkspace | 所有 Markdown / JSON / runtime / archive 写入口归类，明确保留、机器化、归档、删除候选 |
| 1 | 双路线 contract | AlembicWorkspace | AlembicWorkspace | route A 总控流程和 route B 无人值守自动化可独立运行，交汇点只剩机器契约 |
| 2 | Schema 设计 | AlembicWorkspace | AlembicWorkspace | `controller-state.json`、`controller-events.jsonl`、task package、target result、candidate、automation、projection schema 完成 |
| 3 | 极简推进文档模板 | AlembicWorkspace | AlembicWorkspace | 唯一开发者可读模板和追加条目模板完成，包含一个 `Unified Status` 脚本状态区 |
| 4 | Skill 分层 | AlembicWorkspace | AlembicWorkspace | governance skill 负责 route A，automation skills 负责 route B，shared references 只放 contract |
| 5 | 状态 reducer 和 transition validator | AlembicWorkspace | AlembicWorkspace | 回填 / delivery / projection 无法直接修改主状态 |
| 6 | Projection renderer | AlembicWorkspace | AlembicWorkspace | `state + projection -> Unified Status block` 单向生成通过 |
| 7 | 自动化 JSON 独立化 | AlembicWorkspace | AlembicWorkspace | 自动化不解析 Markdown，不写推进文档正文，支持 `prepare-dispatch-from-state` |
| 8 | 历史兼容和减量迁移 | AlembicWorkspace | AlembicWorkspace | 旧 current docs / status mirrors / TODO / inbox 不再作为开发者日常阅读面 |
| 9 | 双路线 fixture 回归 | AlembicWorkspace | AlembicWorkspace | manual-route 与 unattended-route 分别通过，交汇点 candidate/decide/projection 通过 |

## 待确认问题

- 需要用户确认：
  - 已确认主方向并已按推荐路线实现：唯一开发者可读推进文档、独立机器状态机、自动化 JSON 独立、模板最干净简洁。
  - 已采用默认根目录：新机器数据根目录由 `controller-state.mjs init` 默认写入 `.workspace-active/workspace/current/<demand-key>/`；`.workspace-active` / `.workspace-local` 仍不跟随开源仓库，tracked 仓库只提供模板、schema、脚本和 fixture。
  - 后续仍需确认：旧 `workspace-current-status.md`、workspace index、current index、global TODO、Design inbox 的历史减量边界，是直接停止作为日常人读面，还是保留兼容入口一段时间。
  - 后续仍需确认：历史 `.workspace-local/codex-automation-loop` 文件是否只兼容读取，不迁移。
- 需要后续代码验证：
  - 历史 `sync-current-plan.mjs` 是否在下一轮迁移中完全退场，还是继续作为 legacy mirror。
  - 历史 `.workspace-active` current docs 是否迁入 state root，或只在新需求后停止新增。
  - `workspace-control.mjs` wrapper 是否会隐藏底层 JSON 写入边界。
  - `next-control-work.mjs` 是否需要取消 `--write` 候选缓存或改为 machine demand JSON。
  - archive scripts 是否需要 state guard，确保归档不改变主状态。
  - current templates 如何压缩为唯一推进文档模板，并把所有状态信息集中到 `Unified Status`。
- 不应提前派发：
  - 不应派发 Alembic / AlembicPlugin / AlembicCore 等产品仓库。
  - 不应启动 AlembicTest。
  - 不应修改 automation runtime 历史文件。
  - 不应在用户确认前切换 current plan 或 global TODO。

## 进入目标阶段确认

- 建议创建的确认文档：不再需要。本轮用户已直接确认“按推荐方案开始开发推进”，且本需求已完成 tracked 能力实现与验证。
- 是否已经完成代码实现依赖调研：已完成 Stage 0 inventory 与 implementation。
- 建议第一波候选窗口：无下一波实现窗口；仅保留历史减量迁移 / 兼容策略待用户另裁决。
- 明确不派发窗口：Alembic、AlembicCore、AlembicAgent、AlembicDashboard、AlembicPlugin、AlembicDesign、AlembicTest、真实测试项目
