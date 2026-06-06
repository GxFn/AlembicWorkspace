# Control State Machine Redesign Stage 0 Inventory

日期：2026-06-05
状态：stage-0-inventory / code-fact-report
范围：AlembicWorkspace / codex-control-workspace only

## 门禁与用户确认

- 用户已确认：按推荐方案开始开发推进。
- 用户限定：范围仅限 AlembicWorkspace / codex-control-workspace；不启动 automation；不改产品仓库；先做 Stage 0 inventory。
- 用户补充硬边界：`codex-control-workspace` 是开源仓库，`.workspace-active` 和 `.workspace-local` 不跟随项目提交；开源仓库必须提供模板和脚本来创建这些本机 / 项目运行目录。
- 本报告只记录代码事实和实现缺口；不修改 current status、current plan、automation runtime、线程注册表或产品仓库。

## 当前开源仓库边界事实

| 面 | 当前事实 | 证据 |
| --- | --- | --- |
| ignored active surface | `.workspace-active/` 被 git ignore | `codex-control-workspace/.gitignore` |
| ignored local runtime | `.workspace-local/` 被 git ignore | `codex-control-workspace/.gitignore` |
| tracked reusable assets | `AGENTS.md`、README、scripts、skills、templates、workspace config 示例 / 默认配置 | `codex-control-workspace/` tracked files |
| active starter templates | tracked starter 模板位于 `templates/starter-workspace/workspace/` | `templates/README.md`、`scripts/control-workspace-install.mjs` |
| local config precedence | `.workspace-local/workspace.config.json` 优先于 tracked `workspace.config.json` | `scripts/lib/workspace-config.mjs` |
| active ledger defaults | 默认 active root 是 `.workspace-active`，current dir 是 `.workspace-active/workspace/current` | `scripts/lib/workspace-config.mjs` |
| project ledger defaults | 长期项目账本默认外置 `../workspace-ledger` | `scripts/lib/workspace-config.mjs` |

结论：新状态机设计必须把 schema、模板、初始化脚本、fixture 和 skill 作为 tracked 开源资产；具体 demand state、progress doc、target result、evidence、thread id、delivery run、keep-live 和 stop marker 都必须由安装 / 初始化脚本在 ignored 目录或外部 project ledger 中创建。

## Tracked 模板现状

| 模板 | 当前职责 | 与新方案关系 |
| --- | --- | --- |
| `templates/starter-workspace/workspace/index.md` | 安装时生成 `.workspace-active/workspace/index.md` | 旧入口保留兼容；新流程需要只链接唯一 `developer-progress.md` 或 state root projection |
| `templates/starter-workspace/workspace/current/workspace-current-status.md` | 安装时生成 current status mirror | 旧 mirror；新流程中应降级为 legacy / compact projection，不再是状态源 |
| `templates/starter-workspace/workspace/current/index.md` | current docs map | 可保留极简入口，但不能承载第二状态面 |
| `templates/starter-workspace/workspace/current/global-todo-board.md` | active TODO board | 旧人读 TODO；新需求应迁移为 machine demand / task package candidate |
| `templates/starter-workspace/workspace/current/design-handoff-board.md` | internal Design handoff board | 旧 intake 面；新流程只作为 candidate source，不直接入 state |
| `templates/starter-workspace/workspace/current/test-exchange.md` | internal Test exchange | 仍作为真实测试协作入口；不能变成状态机 |
| `templates/workspace-control-plan-template.md` | 当前总控计划模板，含状态行、窗口分派、workspace-sync | 新方案需替换 / 降级为 legacy plan template |
| `templates/workspace-task-package-template.md` | wave 任务包模板 | 可迁移为 `task-package-entry.template.md` + `task-package.schema.json` |
| `templates/requirement-design-template.md` | 长期需求设计模板 | 保留；用于设计，不直接驱动新状态机 |

缺口：

- 当前没有 `templates/control-state-machine/`。
- 当前没有 `developer-progress.template.md`、`unified-status.template.md`、append-only 条目模板。
- 当前 starter workspace 会创建多个 active Markdown 面，尚未提供“唯一推进文档 + machine state root”的 starter。
- 旧 `workspace-control-plan-template.md` 仍含 `状态：`、`发送给：`、`workspace-sync`、窗口分派和 current status mirror 语义。

## 目录与配置事实

`scripts/lib/workspace-config.mjs` 已有可复用配置层：

- `activeLedgerRoot`
- `workspaceDocsDir`
- `workspaceCurrentDir`
- `workspaceIndexPath`
- `workspaceCurrentIndexPath`
- `workspaceCurrentStatusPath`
- `globalTodoPath`
- `designHandoffBoard`
- `designHandoffInbox`
- `testExchangePath`
- `projectLedgerRoot`
- `requirementDesignsDir`

设计影响：

- 新 `stateRoot` 不应硬编码为 `.workspace-active/workspace/current/<demand-key>/`，应通过 config 推导，默认仍可落到该路径。
- 新 `.workspace-local` 运行态不应进入 tracked schema 数据，只能由 runtime command 创建。
- 需要新增配置项候选：
  - `controlStateRootPattern`
  - `controlStateTemplatesDir`
  - `controlStateSchemasDir`
  - `controlStateFixtureDir`
  - `localAutomationStateDir`

## 写入型脚本 inventory

### 安装 / 模板 / 仓库范围

| 脚本 | 写入 flag | 当前写入面 | 事实判断 | 新方案影响 |
| --- | --- | --- | --- | --- |
| `control-workspace-install.mjs configure` | `--write` | tracked `workspace.config.json` 或配置指定路径 | 写安装范围配置 | 应保留；本机覆盖继续写 `.workspace-local/workspace.config.json` |
| `control-workspace-install.mjs sync-root-agents` | `--write` | parent workspace `AGENTS.md` | 将 tracked `AGENTS.md` 解包到父目录 | 保留，但新规则不能只藏 skill |
| `control-workspace-install.mjs write-agents` | `--write` | child repo `AGENTS.md` managed block | 可写同级仓库 AGENTS | 本需求暂不触发 |
| `control-workspace-install.mjs sync-templates` | `--write` | `.workspace-active/workspace/*`、外部 / 内部 Design/Test 支撑文件、`../workspace-ledger/*` | 当前 starter 创建旧 active ledgers | 需要新增 state-machine starter 模板创建能力 |

### 当前计划 / Markdown mirrors

| 脚本 | 写入 flag | 当前写入面 | 事实判断 | 新方案影响 |
| --- | --- | --- | --- | --- |
| `sync-current-plan.mjs` | `--write` | 当前计划状态占位、workspace index、current index、workspace-current-status、窗口分派、提示词区 | 当前最大的 Markdown 状态镜像同步器 | 新需求中应降级为 legacy compatibility；不能驱动新 state |
| `import-design-handoffs.mjs` | `--write` | design handoff inbox Markdown | 从 Design board 生成 inbox | 新方案中应输出 machine candidate JSON 或保持 legacy inbox |
| `next-control-work.mjs` | `--write` | `.workspace-local/control-intake/next-control-work.json` | 读取 Design board + TODO Markdown，写 local candidate scan | 可作为 machine candidate reader，但不得直接写执行状态 |
| `archive-workspace-docs.mjs` | `--apply` | active workspace docs -> workspace ledger archive；index / record map | 移动 active Markdown 并改索引 | 新方案需加 state guard，禁止归档 active state root |
| `archive-global-todo-board.mjs` | `--apply` | global TODO Markdown + archive | 归档 TODO rows | 新流程中 TODO 应机器化或降级 legacy |
| `compact-workspace-index.mjs` | `--apply` | workspace index + archive manifest / record map | 压缩历史 index | 新流程中只处理 legacy / archive maps |
| `generate-archive-topic-summaries.mjs` | `--apply` | archive summary docs | 生成归档摘要 | 可保留，不参与主状态 |

### Automation runtime

| 脚本 | 写入 flag | 当前写入面 | 事实判断 | 新方案影响 |
| --- | --- | --- | --- | --- |
| `codex-automation-loop.mjs register-thread` | `--write` | `.workspace-local/codex-automation-loop/thread-registry/*.json` | 正确本地化 raw thread id | 保留，不能进入 tracked docs |
| `build-window-config` | `--write` | `.workspace-local/codex-automation-loop/window-config/*.json` | derived local config | 保留 |
| `create-dispatch` | `--write` | `.workspace-local/codex-automation-loop/dispatch-packets/*.json` + `dispatch-groups/*.json` | 当前以 `--control-plan` 为参数 | 需新增 state-root / target-task authority |
| `prepare-dispatch` | `--write` | window config + dispatch packet/group + delivery envelope | 机械打包，仍以 `--control-plan` 为 authority | 需新增 `prepare-dispatch-from-state` |
| `build-delivery` | `--write` | delivery envelope | pending host send | 保留，补 stateRevision / taskPackage ref |
| `record-delivery-run` | `--write` | delivery-runs | transport evidence | 保留，不能变验收 |
| `submit-result` | `--write` | target-results | target result envelope | 保留，未来可支持 state-root target result path |
| `review-pack` | read-only | review pack output | 不写 verdict | 需支持 `--state-root` |
| `build-controller-return` | `--write` | controller return envelope | 当前仍要求 `--control-plan` | 改为 state-root / humanContextRef |
| `start-keep-live` / `stop-keep-live` | `--write` | keep-live state/control | liveness support | 保留为 local readiness，不进主状态 |
| `stop-loop` | `--write` | stop marker + keep-live lease release | 停止投递意图 | 保留，不能表示需求完成 |

## 只读 / 校验脚本 inventory

| 脚本 | 当前检查面 | 新方案影响 |
| --- | --- | --- |
| `verify-control-center.mjs` | boundary、repo status、docs、script docs、sync check、decision preflight、dispatch coverage、test boundary、diff check | 需加入 state-machine fixture / template / route isolation checks |
| `check-workspace-boundary.mjs` | workspace git tracking boundary | 需继续证明 `.workspace-active` / `.workspace-local` 不被 tracked |
| `check-workspace-current-layout.mjs` | active docs layout | 新需求中需理解 state-root demand directory |
| `check-dispatch-coverage.mjs` | current plan windows / prompts | route A legacy/manual；route B 不应依赖 Markdown prompt tables |
| `check-decision-preflight.mjs` | current plan decision section | route A 仍需；新 state decide 需等价 preflight |
| `check-task-packages.mjs` | Markdown task packages | 需迁移到 task package JSON schema |
| `check-todo-board.mjs` | Markdown TODO / idle scheduling | 需降级 legacy 或迁移 machine candidates |
| `check-test-boundary.mjs` | Markdown test exchange / plan test boundary | 保留真实测试边界，但不能是主状态 |
| `check-script-docs.mjs` | script docs / tests / process.exit policy | 需纳入新增 scripts 和 fixtures |
| `run-workspace-pipeline-e2e.mjs` | fixture full pipeline | 需拆出 manual-route / unattended-route / failure-route fixture |

## Skill / reference inventory

| 文件 | 当前职责 | 新方案影响 |
| --- | --- | --- |
| `skills/dev/control-workspace-governance/SKILL.md` | 总控文档、TODO、分派、验证、脚本治理入口 | 应成为 route A 主入口，说明可不启用 automation |
| `skills/dev/codex-automation-controller/SKILL.md` | 总控 automation 机械闭环步骤 | 应成为 route B controller 入口，去掉 `controlPlan` authority |
| `skills/dev/codex-automation-target/SKILL.md` | target result / controller return | 应只认 dispatch packet / target task，不认 current plan 为权威任务 |
| `references/script-pipeline.md` | 脚本边界与命令目录 | 需增加 state-machine scripts 和降级 legacy sync |
| `references/codex-automation-loop.md` | automation contract | 需增加 state-root based dispatch |
| `references/direct-thread-window-config.md` | thread registry / delivery evidence | 保留，但 `controlPlan` 字段改为 optional human context |
| `references/control-architecture.md` | 层级架构 | 需加入唯一 state root / projection / route isolation |

缺口：

- 还没有 `references/controller-state-machine.md`。
- 还没有 `references/developer-progress-template.md`。
- 还没有 `references/script-contracts.md`。
- skill 示例 prompt 仍包含 `controlPlan` / current plan authority。

## 状态面去重结论

当前至少有这些状态面：

| 状态面 | 类型 | 当前位置 | 是否应保留为主状态 |
| --- | --- | --- | --- |
| current plan 顶部 `状态：` | Markdown display / legacy input | `.workspace-active/workspace/current/*.md` | 否 |
| `workspace-sync.state` | Markdown embedded machine metadata | current plan bottom | 迁移输入；新流程否 |
| workspace index 当前计划 / 当前状态行 | Markdown mirror | `.workspace-active/workspace/index.md` | 否 |
| current index row | Markdown mirror | `.workspace-active/workspace/current/index.md` | 否 |
| workspace-current-status 顶部状态 | Markdown mirror | `.workspace-active/workspace/current/workspace-current-status.md` | 否 |
| window dispatch table | Markdown dispatch display | current plan / current status | 否 |
| global TODO board row status | Markdown backlog | current global TODO | 否 |
| Design handoff board / inbox status | Markdown intake | current board / inbox | 否 |
| Test exchange card status | Markdown test coordination | test exchange | 否 |
| dispatch group groupStatus | automation runtime | `.workspace-local/codex-automation-loop` | 否，transport/review input |
| deliveryStatus / delivery-run status | automation runtime | `.workspace-local/codex-automation-loop` | 否，transport evidence |
| target result status | automation runtime | `.workspace-local/codex-automation-loop` | 否，result input |
| keepLiveStatus | automation runtime | `.workspace-local/codex-automation-loop` | 否，readiness only |
| proposed `controller-state.json.state` | machine state | future state root | 是 |
| proposed `controller-events.jsonl` | audit trail | future state root | 是，transition audit |
| proposed `projection.json` | display input | future state root | 否，projection input |

## Stage 0 主要风险

1. **开源仓库边界风险**
   - 新流程如果把 active demand state 直接提交到 `codex-control-workspace`，会污染开源仓库。
   - 正确方向：tracked 只提交 templates / schemas / scripts / skills / fixtures；runtime state 由 install/init 生成。

2. **旧 Markdown authority 残留**
   - `workspace-control-plan-template.md`、`sync-current-plan.mjs`、automation skills 仍让 current plan / `controlPlan` 承担权威任务描述。
   - 正确方向：旧 current plan 降级 legacy；新 authority 是 state root + task package JSON。

3. **状态镜像过多**
   - workspace index、current index、current status、current plan、TODO、Design inbox、automation runtime 都有 status。
   - 正确方向：主状态只在 `controller-state.json`；其它都是 projection / candidate / evidence。

4. **automation 与 docs 仍有隐性耦合**
   - automation packet / return prompt 当前包含 `controlPlan` 字段。
   - 正确方向：新增 `stateRoot`、`taskPackageId`、`targetTaskId`、`stateRevision`，`controlPlan` 只作为 `humanContextRef`。

5. **模板初始化缺口**
   - 当前 `sync-templates` 可以创建 starter workspace，但没有创建 state-machine demand root 的模板资产。
   - 正确方向：新增 `templates/control-state-machine/` 和 `controller-state.mjs init`。

## Stage 1 输入建议

按确认后的顺序，下一阶段不应直接大改所有旧脚本，而应先实现最小可验证资产：

1. 新增 tracked 模板目录：
   - `codex-control-workspace/templates/control-state-machine/developer-progress.template.md`
   - `unified-status.template.md`
   - `task-package-entry.template.md`
   - `backfill-summary-entry.template.md`
   - `decision-log-entry.template.md`

2. 新增 tracked schema 目录：
   - `codex-control-workspace/schemas/control-state-machine/controller-state.schema.json`
   - `controller-event.schema.json`
   - `task-package.schema.json`
   - `target-result.schema.json`
   - `transition-candidate.schema.json`
   - `projection.schema.json`

3. 新增 state root 初始化脚本：
   - `scripts/controller-state.mjs init --demand-key <key> --title <title> --write`
   - 默认写 ignored `.workspace-active/workspace/current/<demand-key>/`，但路径必须通过 workspace config 推导。
   - 输出必须明确 tracked / ignored 边界。

4. 新增 projection / append scripts：
   - `render-progress-doc.mjs`
   - `append-progress-log.mjs`

5. 新增 verification fixture：
   - `scripts/fixtures/control-state-machine/manual-route`
   - `unattended-route`
   - `failure-route`

6. 后续再改 automation：
   - `prepare-dispatch-from-state`
   - `review-pack --state-root`
   - `controlPlan` -> `humanContextRef`

## 本轮未做事项

- 未启动 automation。
- 未注册或修改任何 thread。
- 未修改 `.workspace-active` 或 `.workspace-local`。
- 未修改 `codex-control-workspace` tracked scripts / templates / skills。
- 未修改产品仓库。
- 未切换当前计划或 current status。

