# Workspace Control Architecture Refresh

日期：2026-05-26
状态：已完成（验证通过，待归档）
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载 workspace 总控规则、skill、模板、脚本和自动化流水线的一致性整理，不承载产品实现。

## 目标判断

- 用户目标：对 AlembicWorkspace 的 `AGENTS.md`、workspace skill、模板、脚本和自动化流水线做一次整体重新梳理与设计，保持统一、可读、可执行，并继续用自动化暴露问题。
- 最终完成定义：形成清晰的总控组成地图；`AGENTS.md` 只保留高压硬规则和入口指向；skill 承接操作步骤和脚本用法；模板只保留人读和脚本需要的骨架；脚本索引、验证脚本和 VAD 自动化语义一致；自动化启动 / 关闭 / 回跳 / 自执行边界可复核。
- 当前是否已经达到：已达到 workspace 总控治理目标。
- 未达到时剩余差距：无代码或脚本闭环缺口；剩余仅为用户决定是否立即切回 037 并物理归档本计划。
- 已达到时验收 / 归档判断：已完成 workspace 文档与脚本验证；本计划可在切换当前主线后归档。037 回到后续主线，不在本计划中继续推进产品实现。
- 当前任务分区：总控文档 / 规则治理 + 脚本流水线治理 + 自动化模式治理。
- 不纳入本轮事项：不修改 Alembic 系列产品源码；不派 `AlembicTest`；不继续 037 Stage 1 代码实现；不把旧 smoke / 037 runtime 残留写成产品事实。

## 总控决策记录

- 本次决策触发：用户认为 workspace 总控能力已足够支撑自动化驱动流水线，要求对 `AGENTS.md`、skill 文档、模板、脚本等 workspace 组成做全面一致性整理，并建议开启自动化继续暴露问题。
- 需求 / 测试结果理解：自动化可以参与推进，但不能替代总控判断；先要清理旧 VAD runtime，避免 037 armed task 和新治理主线混在一起。
- 已核对证据：`AGENTS.md`、workspace index、当前状态、workspace control skill、skill-creator skill、`scripts/visible-dispatch.mjs status/controller-tick`。
- 是否需要先验证 / 重新计划 / 用户确认：需要重新计划；用户已确认可以继续推进并建议自动化。
- 本次允许更新：workspace 文档、workspace skill、templates、scripts、脚本测试、`.workspace-local/visible-dispatch` 本地运行态。
- 本次不得更新：产品子仓库源码、真实测试项目、AlembicTest 测试单结论、037 产品实现结论。

## Design / 需求来源

- 来源类型：用户直接需求。
- 来源文档：无独立 Design handoff；本计划即总控治理主线入口。
- 用户确认状态：已确认继续推进。
- 总控接收结论：接收为 workspace 总控治理主线，优先级高于恢复 037 Stage 1。
- 是否需要目标阶段确认：不需要；这是总控工作区自身治理。
- 是否需要代码实现依赖调研：需要本地脚本 / 模板 / skill 事实调研，不需要产品源码调研。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`。
- 关键入口：`AGENTS.md`、`skills/dev/alembic-workspace-control/`、`skills/dev/visible-automation-dispatch-controller/`、`skills/dev/visible-automation-dispatch-target/`、`templates/`、`scripts/README.md`、`scripts/visible-dispatch.mjs`、`scripts/verify-control-center.mjs`。
- producer / consumer 依赖：`AGENTS.md` 提供总控硬边界；workspace control skill 承接操作细则；VAD controller / target skills 承接自动化执行细则；templates 和 scripts 必须遵守同一章节与字段契约。
- 不可提前消费的上游：没有完成体系地图前，不继续大范围改模板和脚本；没有验证自动化语义前，不重新开启子窗口派发。
- 不允许触碰的目录 / 仓库：不触碰产品子仓库源码，不改真实测试项目。
- 真实测试项目是否涉及：否。

## 阶段顺序

1. Wave 1：旧自动化 runtime 前置清理，建立 workspace 总控组成地图和问题清单。已完成。
2. Wave 2：按地图整理 `AGENTS.md`、workspace skill、VAD skills、模板和脚本索引的分层职责。已完成。
3. Wave 3：补齐脚本与自动化模式缺口，包括 workspace-only 自执行、启动 / 关闭状态一致性、stale task 回收和验证命令。已完成。
4. Wave 4：运行验证、修复发现、归档本计划，并把 037 恢复为后续主线候选。验证已完成；物理归档等待当前主线切换。

- 下一处真实阻塞点：无 WCR 内部阻塞；下一主线是 037 Stage 1 恢复。
- 阻塞点之前还能做：提交本轮 workspace 治理改动；切回 037 前不再自动派产品窗口。
- 当前可派发窗口：无；本轮由总控自执行。
- 当前阻塞 / 观察窗口：所有产品子仓库观察；`AlembicTest` 无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| WCR-W1-RUNTIME-CLEANUP | `AlembicWorkspace` | 关闭旧 VAD mode、防睡眠和 037 armed task 残留，避免旧链路污染新主线。 | 已完成 |
| WCR-W1-ARCHITECTURE-MAP | `AlembicWorkspace` | 梳理 AGENTS / skill / templates / scripts / VAD runtime 的职责地图和下层承接关系。 | 已完成 |
| WCR-W1-CONSISTENCY-AUDIT | `AlembicWorkspace` | 找出重复、过长、错层、缺失门禁和脚本 UX 断点。 | 已完成 |
| WCR-W1-AUTOMATION-LOOP-PLAN | `AlembicWorkspace` | 设计本轮自动化推进方式，并把无法通过 VAD target 派发的 workspace-only 自执行缺口列入修复。 | 已完成 |

### WCR-W1-ARCHITECTURE-MAP：总控组成地图

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 20:45 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 20:45 CST

阶段目标：

- 建立 `AGENTS.md` 顶层硬规则、workspace control skill、VAD controller / target skills、templates、scripts 的职责边界和引用路径。
- 明确哪些内容给用户看，哪些内容给脚本 / agent 使用，哪些内容只能作为本地 runtime 状态。

主线动作：

- 读取现有 `AGENTS.md`、skill、templates 和 scripts。
- 输出待调整清单，先设计再改文件。

合并 TODO：

- `WCR-2026-05-26-001`：workspace 总控组成一致性整理。
- `WCR-2026-05-26-002`：VAD workspace-only 自执行和 controller heartbeat 边界不清。

明确不包含：

- 不修改产品源码。
- 不启动 `AlembicTest`。
- 不恢复 037 Stage 1 子窗口派发。

下一处真实阻塞点：

- 如果地图不明确，后续会继续出现 AGENTS / skill / prompt / template 重复和错层。

阻塞点之前还能做：

- 可以完成只读调研、列出结构图、标出需要保留或迁移的规则。

验证命令：

```text
node scripts/verify-control-center.mjs --require-todo --require-task-packages
node scripts/check-script-docs.mjs
node scripts/visible-dispatch.mjs status --json
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和相关 skill / script 入口。
- 开始执行前先明确声明当前窗口定位、workspace 职责、本轮任务职责，以及本轮明确不承担的产品实现职责。

## 结构事实调研与问题清单

### 已确认分层

- `AGENTS.md` 当前承担最高停止卡、总控身份、仓库职责、测试验收硬边界、分派 / TODO / 自动化硬边界、workspace 治理、需求到 wave、脚本与 skill 分层入口。
- `skills/dev/alembic-workspace-control/` 承接 TODO、分派、测试、脚本流水线、账本维护和新增的 control architecture reference。
- `skills/dev/visible-automation-dispatch-controller/` 与 `skills/dev/visible-automation-dispatch-target/` 承接 heartbeat 里的操作步骤，但不承接总控事实裁决。
- `templates/` 承接可复制骨架；脚本依赖 `workspace-control-plan-template.md` 的章节和 `workspace-sync` 锚点。
- `scripts/` 承接同步、校验、导入、归档、runtime 读写和 VAD 本地状态；脚本不调用 Codex automation API，也不替总代控验收。

### 已发现问题

- `workspace-current-status.md` 出现两条“当前计划”摘要：第一条是状态页固定行，第二条来自 `workspace-sync.currentStatusSummary`；应把 sync summary 改成不重复当前计划链接。
- `templates/phased-migration-command-template.md` 有 634 行，已经更像大型操作手册而不是模板；Wave 2 应评估拆为短模板 + skill reference / 长期流程。
- `scripts/README.md` 的 VAD 段落仍偏长，虽然已加 control architecture 指向，但还混有 script interface、policy 和 troubleshooting；Wave 2 应提炼成短命令索引，把策略放到 skill reference。
- `workspace-control.mjs` 是聚合入口，但当前没有 VAD self-heartbeat / mode start-stop 的友好子命令；本轮只能手动用 Codex heartbeat 创建 controller self loop，这说明 workspace-only 自执行仍需要脚本 / skill 明确化。
- `skills/dev/progressive-chain-validation/` 当前只有 `README.md`，不是完整 `SKILL.md` 结构；它更像外部 skill 源占位 / ledger，不应被当作可安装 skill。Wave 2 需要明确保留为 ledger 还是迁移到 `docs/workspace/` 或补齐 skill package。
- 当前 heartbeat 运行时，VAD `mode` 保持 disabled 是有意设计，因为本轮是 controller self heartbeat，不是 target fan-out；这类自动化分类必须保持清楚，避免后续看到 `modeDisabled` 就误判为自动化失败。

### 处理结果

- `workspace-current-status.md` 的重复当前计划摘要已改为短快照，不再复制当前计划链接。
- `AGENTS.md` 已保留最高停止卡和常驻硬边界，并补齐 `AGENTS.md` 到 skill / reference 的使用地图。
- `visible-automation-dispatch.md` 承接 VAD mode / registry / queue / group / heartbeat 操作地图；VAD controller / target skills 只承接角色步骤，不替代总控裁决。
- `phased-migration.md` 承接迁移 / 抽取 / 删除清理的操作手册；`templates/phased-migration-command-template.md` 已压缩为短骨架。
- `scripts/README.md` 的 VAD 段落已收敛为入口索引，策略细节转入 skill reference。
- `workspace-control.mjs` 已新增 `vad` 聚合子命令，覆盖 `status`、`controller`、`preflight`、`group`、`enable`、`disable`、`prune`，并保留 `--write` 门禁。
- `visible-dispatch.mjs` / `workspace-control.mjs vad` 已新增 automation compliance audit 入口；总控可根据本地 VAD 记录判断当前 automation 是否属于当前计划、任务、group、窗口和合法下一跳，不合规时删除并记录 stop。
- `skills/dev/progressive-chain-validation/` 已明确为 external PCV source ledger，不是完整 Codex skill package，也不应被安装为 runnable skill。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WCR-2026-05-26-001 | 已完成 | 总控治理 | P0 | Workspace | 梳理 AGENTS / skill / templates / scripts / VAD 自动化的一致性架构。 | 是 | 用户直接要求 | AlembicWorkspace |
| WCR-2026-05-26-002 | 已完成 | 自动化缺口 | P1 | Workspace | VAD workspace-only 自执行改为 controller self heartbeat 分类，不进入 target fan-out 队列。 | 是 | 本轮调研发现 | AlembicWorkspace |
| WCR-2026-05-26-003 | 已完成 | 自动化缺口 | P0 | Workspace | `workspace-control vad disable` / `record-stop` / `prune` 形成显式回收入口；OS 拒绝停止防睡眠时必须作为 readiness risk 报告。 | 是 | 本轮真实运行发现 | AlembicWorkspace |
| WCR-2026-05-26-004 | 已完成 | 文档分层 | P1 | Workspace | VAD 长提示词策略收敛到 `visible-automation-dispatch.md` 与 VAD skills，普通提示词只保留执行入口和门禁。 | 是 | 用户截图反馈 | AlembicWorkspace |
| WCR-2026-05-26-005 | 已完成 | 文档分层 | P2 | Workspace | `phased-migration-command-template.md` 已拆为短模板 + `phased-migration.md` 操作手册。 | 否 | 本轮结构调研发现 | AlembicWorkspace |
| WCR-2026-05-26-006 | 已完成 | skill 资产 | P2 | Workspace | `skills/dev/progressive-chain-validation/` 已明确为 external source ledger，不是可安装 Codex skill。 | 否 | 本轮结构调研发现 | AlembicWorkspace |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | 本轮不改产品源码，旧 037 Stage 1 暂停。 |
| `AlembicCore` | 观察 | 否 | 本轮不做 Core contract。 |
| `AlembicAgent` | 观察 | 否 | 本轮不做 Agent runtime。 |
| `AlembicDashboard` | 观察 | 否 | 本轮不做 UI。 |
| `AlembicPlugin` | 观察 | 否 | 本轮不改 Plugin；旧 037 Stage 1 暂停。 |
| `AlembicTest` | 无任务 | 否 | 不涉及真实项目 / cold-start / Dashboard 手动观察。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 本轮不派发；037 后续再恢复。 |
| `AlembicCore`<br>观察中 | 本轮不派发。 |
| `AlembicAgent`<br>观察中 | 本轮不派发。 |
| `AlembicDashboard`<br>观察中 | 本轮不派发。 |
| `AlembicPlugin`<br>观察中 | 本轮不派发；037 后续再恢复。 |
| `AlembicTest`<br>无任务 | 本轮不需要真实测试窗口。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：无

```text
本轮不发送给子窗口。由 AlembicWorkspace 总控自执行 workspace 规则、skill、模板、脚本和自动化一致性整理。
```

## 自动化推进方式

- 当前不使用 VAD target dispatch 派发子窗口，因为本轮任务属于 `AlembicWorkspace` 自身，而现有 VAD target dispatch 默认只投递子窗口。
- 可以使用 Codex 当前线程 heartbeat 唤醒总控继续本计划；这只负责“唤醒总控继续判断”，不替代总控验收、测试边界和文件修改前判断。
- 本轮暴露的 VAD 缺口：workspace-only 自执行、旧 automation stop 后任务仍 armed、防睡眠 stop 失败后的状态修正，都进入本计划 TODO。
- 重新开启 VAD mode 前必须先确认 `visible-dispatch status` 没有旧 armed 任务、keep-awake inactive、当前计划是本文件。

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：脚本 / 文档 / 状态机 / skill 结构验证均可由总控完成。
- 需要真实场景的理由：无。
- 测试前边界与多条件判断：
  - 测试要回答的问题：workspace 控制面是否结构一致，脚本验证是否通过，自动化状态是否不会误派旧任务。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：只测试 AlembicWorkspace 文档、脚本、skill、templates 和本地 `.workspace-local/visible-dispatch` runtime。
  - 成功能推出的结论：总控治理面一致性提升，脚本表面验证通过，旧自动化残留不再抢跑。
  - 失败能推出的结论：对应脚本、模板或文档契约仍存在缺口。
  - 不能推出的结论：不能推出 037 产品实现已完成，不能推出真实项目环境通过。
  - 停止或不开始条件：出现产品源码改动需求、真实项目验证需求、用户改变目标或自动化 loop 试图继续旧 037。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)
- 真实项目保护说明：不触碰真实测试项目。

## 回填区

- 2026-05-26 20:45 CST：总控运行 `node scripts/visible-dispatch.mjs mode --disable --write --json`，发现 keep-awake `kill EPERM`；经用户授权外部命令确认并停止 `caffeinate -dims`，再次 disable 后 keep-awake inactive。
- 2026-05-26 20:46 CST：总控对旧 037 `visible-dispatch-alembic` / `visible-dispatch-alembicplugin` 运行 `record-stop`，并把两个旧 armed task block 为“用户停止旧 037 automation before workspace architecture refresh”，避免新治理主线被旧任务抢跑。
- 2026-05-26 20:50 CST：总控运行 `node scripts/visible-dispatch.mjs prune-history --write --json`，本地 VAD queue / runs / groups 清为 0；创建当前总控线程 heartbeat `workspace-control-architecture-refresh`，用于继续本计划自执行并暴露自动化边界问题，不作为子窗口派发。
- 2026-05-26 20:55 CST：完成 WCR-W1-ARCHITECTURE-MAP 第一版：新增 `skills/dev/alembic-workspace-control/references/control-architecture.md`，定义 `AGENTS.md` / 当前计划 / workspace skill / VAD skills / templates / scripts / `.workspace-local` 的层级职责、Resident Rule Test、Pointer Contract、Template Contract、Script Contract 和自动化分类；同步更新 skill 与模板 / 脚本索引。
- 2026-05-26 20:57 CST：heartbeat 复查 `visible-dispatch status/controller-tick`：VAD mode disabled、queue / runs / groups 均为 0，`controller-tick` 返回 `modeDisabled` 符合本轮 controller self heartbeat 设计；同时确认 `workspace-current-status.md` summary 重复、长模板、长脚本 README 和 PCV skill 占位问题，已写入问题清单。
- 2026-05-26 21:14 CST：完成 WCR-W1-CONSISTENCY-AUDIT 与 WCR-W1-AUTOMATION-LOOP-PLAN 收口：补齐 `AGENTS.md` 使用地图；新增 `visible-automation-dispatch.md` 与 `phased-migration.md` references；压缩 VAD 脚本索引和 phased migration 模板；新增 `workspace-control.mjs vad ...` 聚合入口和 `workspace-control.test.mjs` 覆盖；明确 PCV 目录是 source ledger。
- 2026-05-26 21:14 CST：已运行 targeted 验证：`node --test scripts/workspace-control.test.mjs` 通过 8/8；`node scripts/workspace-control.mjs vad status --json` 显示 mode disabled、loop false、automationRuns 0、dispatchGroups 0、keep-awake inactive；`vad controller --json` 返回 `modeDisabled`，符合本轮停止派发状态；`vad preflight --json` ready true，仅提示当前计划没有 required dispatch windows。
- 2026-05-26 21:18 CST：完成完整验证闭环：`node scripts/check-script-docs.mjs` 通过；`node scripts/sync-current-plan.mjs --check` 通过；`node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests` 通过，脚本测试 75/75；`node scripts/run-workspace-pipeline-e2e.mjs` 通过 16 步 fixture pipeline，包含 archive dry-run / apply / post-archive verification。
- 2026-05-26 21:25 CST：按用户最后要求补齐 automation 合规审计和删除权：`AGENTS.md` 增加总控有权删除不合规 automation 的硬规则；`visible-dispatch.mjs audit-automation` 与 `workspace-control.mjs vad audit` 增加本地合规判定；VAD reference / controller skill / target skill 增加 audit、delete、record-stop 规则。
- 2026-05-26 21:28 CST：复跑验证通过：`node --test scripts/visible-dispatch.test.mjs` 48/48；`node --test scripts/workspace-control.test.mjs` 9/9；`node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests` 通过，脚本测试 78/78；`node scripts/run-workspace-pipeline-e2e.mjs` 通过 16 步 fixture pipeline。

<!-- workspace-sync
{
  "status": "已完成（验证通过，待归档）",
  "indexPlanDescription": "Workspace Control Architecture Refresh：整理 AGENTS / skill / templates / scripts / VAD 自动化的一致性；当前总控自执行，不派产品子仓库，不派 AlembicTest。",
  "indexStatusDescription": "Workspace Control Architecture Refresh 已完成验证，旧 VAD runtime 保持关闭；下一主线候选恢复为 037。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Workspace Control Architecture Refresh：AGENTS / skill / templates / scripts / VAD 自动化一致性整理已完成验证。",
  "currentStatusSummary": "Workspace Control Architecture Refresh 已完成验证；总控未派产品子仓库，未派 AlembicTest；旧 037 Stage 1 后续恢复为候选主线。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
