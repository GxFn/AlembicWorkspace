# Workspace Workflow Optimization Current Plan

日期：2026-05-30
状态：Stage 5 真实小闭环验证已通过 / 待归档裁决
发送给：无
总控定位：本文件是 AlembicWorkspace 对 `WORKSPACE-WORKFLOW-OPTIMIZATION-2026-05-29` 的当前总控计划；记录总控裁决、资产归属事实、问题清单、阶段实现证据和下一阶段建议，不承载产品实现。

## 目标判断

- 用户目标：领取 `WORKSPACE-WORKFLOW-OPTIMIZATION`，按 Design 已确认方向优化 workspace 工作流，使总控、Design、账本、模板、skill、script、delivery、子窗口和 TestWindow 的职责更清晰，普通闭环更短，失败诊断更明确。
- 最终完成定义：形成统一 `WorkspaceControlLoop`，普通任务可按 `Intake -> Decision -> Ledger -> Plan -> Deliver -> Result -> Review -> Record` 推进；`AGENTS.md`、skill/reference、template、script、active ledger、workspace-ledger、child AGENTS、manual prompt 和 automation envelope 各有唯一主归属；Design handoff / user confirmation / TODO / plan / dispatch / result / review 的状态枚举能支持向前兼容；手动派发与自动化派发共享同一任务包语义；至少一条小真实闭环能证明路径更简洁且证据仍可由总控验收。
- 当前是否已经达到：已达到当前 WWO 完整实现目标。
- 未达到时剩余差距：无。当前已完成 Design handoff 接收、Stage 0 控制资产地图、用户确认记录、Stage 1 默认闭环定稿、用户确认枚举最小实现、Stage 2 资产归属调整、Stage 3 脚本 / 模板瘦身、Stage 4 子窗口接入边界整理，以及 Stage 5 真实 Alembic 只读 roundtrip 验证。
- 已达到时验收 / 归档判断：可以进入归档裁决和提交；不继续派发新窗口。
- 当前任务分区：Design 交接接收 + 规则治理 / skill 治理。
- 不纳入本轮事项：不改产品子仓库源码；不派 `AlembicTest`；不归档 PCVM；不批量重写旧 Design 历史文档；不继续启动新的自动化。

## 总控决策记录

- 本次决策触发：用户明确要求“领取 WORKSPACE-WORKFLOW-OPTIMIZATION 这个需求，开始推进”。
- 用户确认记录：2026-05-30 用户确认 WWO 作为当前主线继续；枚举迁移采用向前兼容，不批量重写旧历史；下一步先进入 Stage 1 默认闭环 + 用户确认枚举最小实现；完整实现后必须用真实闭环验证最终目标。
- 需求 / 测试结果理解：这是 Workspace 控制系统治理需求，不是产品实现需求。Design 推荐接收后先做 Stage 0 控制资产地图，不能一上来改规则或脚本。
- 已核对证据：Design handoff 原文、控制资产文件、子窗口接入卡和本轮脚本输出均已核对；细项如下。
  - `AlembicDesign/docs/current/workspace-handoff-board.md` 中该条目状态为 `ready-for-workspace`。
  - `workspace-workflow-optimization-original-plan-2026-05-29.md` 记录用户已确认方向：控制资产地图、硬规则留 AGENTS、skill/reference 承载操作、template 保结构、script 保机械能力、current ledgers 保轻、子窗口配置纳入整理、小真实闭环验证。
  - `workspace-workflow-optimization-requirement-design-2026-05-29.md` 明确第一步是 Stage 0，不直接改 `AGENTS.md`、脚本、模板或子窗口配置。
  - `node scripts/import-design-handoffs.mjs --id WORKSPACE-WORKFLOW-OPTIMIZATION-2026-05-29 --json` 返回 target 解析成功，但同时产生一条 `ready entry must record user confirmation` issue；该矛盾被记录为 Stage 0 问题。
  - `node scripts/workspace-control.mjs status --json` 通过，显示当前 PCVM Wave 6F 同步、分派覆盖和子仓库状态正常。
  - `node scripts/verify-control-center.mjs --json` 通过当前 PCVM 计划验证。
- 是否需要先验证 / 重新计划 / 用户确认：用户已确认领取、最终目标方向和完整实现后的真实测试要求；Stage 1 可以推进默认闭环 + 枚举最小实现。Stage 2 前无需再向用户确认，除非发现功能删减、路线替换或真实闭环测试边界变化。
- 本次允许更新：当前计划、治理 reference、Design / control 模板、Design handoff import 脚本和脚本测试 / 索引。
- 本次不得更新：不得修改产品源码、不得批量重写旧历史 Design 文档、不得改变子仓库 managed AGENTS 硬规则、不得创建 TestWindow 测试单、不得把脚本校验通过写成总控验收完成。
- Stage 2 补充裁决：资产归属调整只做 owner / must-not-own / downshift / rewrite / discard 定位，不做大规模 `AGENTS.md` 改写，不把硬规则下沉，不触碰子仓库源码；长期规则写入 governance reference，当前结论写入本计划。
- Stage 3 补充裁决：脚本 / 模板瘦身只处理已发现的 command manual、重复脚本条目、缺失聚合测试和模板重复硬规则；不新增流程系统、不重命名当前计划、不改产品仓库、不把 `AGENTS.md` 中的硬停止卡移走。
- Stage 4 补充裁决：子窗口接入边界用只读 `ChildWindowAccessProfile` 视图复核，不让脚本判断任务是否可派发或证据是否可接受；真实项目默认排除，TestWindow / DesignWindow 只显示特殊入口和边界。
- Stage 5 验收裁决：真实 `Alembic` 目标窗口 roundtrip 已完成。总控独立复核 result envelope、`access-profiles --window Alembic` 命令输出、`review-results` 和 Alembic git 状态后，接受 WWO Stage 5；该验证只证明 control loop / child access profile / one-shot automation / result review 贯通，不证明 Alembic 产品 runtime、cold-start、Dashboard 或 PCVM 行为。

## Design / 需求来源

- 来源类型：DesignWindow handoff + 用户直接领取。
- 来源文档：
  - `../AlembicDesign/docs/current/workspace-workflow-optimization-original-plan-2026-05-29.md`
  - `../AlembicDesign/docs/current/workspace-workflow-optimization-requirement-design-2026-05-29.md`
  - `../AlembicDesign/docs/current/workspace-workflow-optimization-analysis-2026-05-29.md`
- 用户确认状态：已确认方向；本轮用户进一步确认 WWO 作为当前主线推进、枚举迁移向前兼容、完整实现后需要真实闭环验证。
- 总控接收结论：接收，作为当前 workspace governance 主线；PCVM Wave 6F 暂不归档，只作为被用户切换打断的观察主线保留。
- 是否需要目标阶段确认：本需求已有 Design 完成定义和阶段建议；本轮不另建目标阶段确认文档。
- 是否需要代码实现依赖调研：需要 Stage 0 控制资产事实调研，但不是产品源码实现依赖调研。

## 控制资产地图

### 1. Resident hard rules

| 资产 | 当前事实 | 应负责 | 不应负责 | Stage 0 判断 |
| --- | --- | --- | --- | --- |
| 顶层 `AGENTS.md` | 已从 `codex-control-workspace/AGENTS.md` 解包到父级；包含最高停止卡、总控身份、测试 / 验收、分派 / 自动化、账本、skill 地图。 | 常驻硬规则、停止卡、总控身份、仓库边界、确认门禁、验收底线、下层地图。 | 当前 wave 事实、长命令手册、脚本排错细节、完整模板。 | 归属基本正确；后续只允许做结构和 pointer 清理，不能下沉最高硬规则。 |
| `codex-control-workspace/AGENTS.md` | 通用仓库源文件，父级 `AGENTS.md` 应由安装脚本同步。 | 通用总控规则源。 | Alembic 项目专属当前事实。 | 需在 Stage 1/2 确认源文件与父级是否完全同步，避免双源漂移。 |
| 子仓库 `AGENTS.md` managed block | `Alembic*`、`AlembicDesign`、`AlembicTest` 均有 `codex-control-workspace:scope` 接入卡；包含坐标、读取顺序、automation 最小门禁、文档落点。 | 子窗口 workspace 接入坐标和最小门禁。 | 总控当前 wave 任务书、全局 TODO、其它窗口任务、总控验收结论。 | managed block 已接近 Design 要求；Stage 4 再核对 manual task / compact automation / local stop card 是否足够分离。 |

### 2. Skills and references

| 资产 | 当前事实 | 应负责 | 不应负责 | Stage 0 判断 |
| --- | --- | --- | --- | --- |
| `skills/dev/control-workspace-governance/SKILL.md` | 现有治理 skill，指向 TODO、dispatch、testing、script、ledger、architecture、automation、migration references。 | 按场景加载操作手册和示例。 | 隐藏最高硬规则、替代总控判断。 | 归属正确；旧路径 `alembic-workspace-control` 已不存在，需清理所有引用。 |
| `references/control-architecture.md` | 已记录层级地图、resident rule test、pointer contract、template/script/automation classes。 | AGENTS / skill / template / script / automation 重构操作说明。 | 当前任务事实。 | 可作为 Stage 1/2 的主 reference。 |
| `skills/dev/codex-automation-controller/SKILL.md` | 新闭环 controller skill，包含 compact controller wakeup prompt、review-results、dispatch packet、delivery envelope、stop gate。 | 自动化 controller-return / next-wave 机械步骤。 | 用户目标、验收裁决。 | 归属正确；与本需求中的 delivery 层边界一致。 |
| `skills/dev/codex-automation-target/SKILL.md` | 目标窗口自动化执行 skill。 | target result envelope 和目标窗口 role guard。 | 下一跳总控裁决。 | Stage 4 需复核与子窗口 managed block 是否重复或缺字段。 |
| `skills/dev/progressive-chain-validation/SKILL.md` | PCV/PCVM 方法论 skill。 | PCV 分阶段计划和证据标签。 | Workspace 状态机主权。 | 已由 governance skill 说明：Workspace 拥有唯一控制状态机，PCV 只作为证据标签。 |

### 3. Templates

| 资产 | 当前事实 | 应负责 | 不应负责 | Stage 0 判断 |
| --- | --- | --- | --- | --- |
| `workspace-control-plan-template.md` | 包含目标判断、决策记录、需求来源、代码事实、阶段、任务包、TODO、窗口分派、提示词、测试交接、sync block。 | 当前计划结构契约。 | 当前事实、长 playbook、总控裁决。 | 结构完整但偏厚；Stage 3 可评估是否拆为 base + optional sections。 |
| `workspace-task-package-template.md` | 任务包结构。 | task package 字段骨架。 | 自动派发逻辑。 | 归属正确。 |
| `test-handoff-template.md` | TestWindow 测试单结构。 | 真实测试边界字段。 | 普通自测流程。 | 归属正确。 |
| Design templates | original plan、requirement design、signal、handoff。 | DesignWindow 需求输入结构。 | 总控执行计划。 | 归属正确。 |
| `templates/starter-workspace` / `window-support` | README 提到存在 starter / support 模板，但 `find -maxdepth 2` 未直接列出目录文件。 | 安装初始化和外部 Design/Test 支撑。 | 当前 Alembic 专属文档。 | Stage 3 需要复核 README 与真实目录深度 / 文件是否一致。 |

### 4. Scripts

| 类别 | 现有脚本 | 应负责 | Stage 0 判断 |
| --- | --- | --- | --- |
| contract scripts | `codex-automation-loop.mjs`、`check-task-packages.mjs`、`check-dispatch-coverage.mjs`、`check-test-boundary.mjs`、`check-decision-preflight.mjs` | packet / envelope / result / task package / coverage / boundary 结构检查。 | 类别清晰，但脚本内未显式声明 `mustNotDecide`，Stage 3 可补文档或 JSON metadata。 |
| ledger scripts | `import-design-handoffs.mjs`、`sync-current-plan.mjs`、`archive-workspace-docs.mjs`、`archive-global-todo-board.mjs`、`compact-workspace-index.mjs`、`generate-archive-topic-summaries.mjs` | 导入、同步、归档账本。 | 归属正确；`import-design-handoffs` 本轮出现 validation issue 与 parsed target 自相矛盾，需优先复核。 |
| diagnostic scripts | `verify-control-center.mjs`、`check-runtime-residue.mjs`、`collect-repo-status.mjs`、`run-workspace-pipeline-e2e.mjs`、script tests | 失败、归档前或治理时验证。 | 不应进入普通 happy path 默认前置；当前 README 已说明。 |
| aggregator | `workspace-control.mjs` | 聚合常用命令，保留 dry-run / write gate。 | 需确保只编排，不决定。当前 `status` 结果符合此边界。 |
| install scope | `control-workspace-install.mjs` | sibling repo discovery、scope confirm、root AGENTS sync、managed block 写入。 | 归属正确；Stage 4 复核 child access profile 输出是否覆盖 Design 需求字段。 |

### 5. Current ledgers

| 资产 | 当前事实 | 应负责 | Stage 0 判断 |
| --- | --- | --- | --- |
| `.wakeflow-active/index.md` | 当前第一行仍指向 PCVM Wave 6F。 | 活跃总控入口。 | 本轮应切到 Workspace Workflow Optimization 当前计划；PCVM 作为观察主线保留。 |
| `workspace-current-status.md` | 当前状态仍是 PCVM Wave 6F 等 Alembic。 | 短状态快照。 | 本轮应同步为 WWO Stage 0 接收 / 资产地图。 |
| `design-handoff-inbox.md` | 由 import script 生成。 | 等待总控接收的 Design 候选。 | 本轮 import check 暴露矛盾 issue；暂不写入，避免把脚本问题覆盖掉。 |
| `global-todo-board.md` | 活跃 TODO 账本。 | 已裁决要跟踪的问题。 | WWO 已成为当前计划，不必先新增 TODO；Stage 1/2 再决定是否补具体治理 TODO。 |
| `test-exchange.md` | 当前测试交流。 | 真实测试请求。 | 本需求 Stage 0 不需要 TestWindow。 |

### 6. Workspace config and local runtime

| 资产 | 当前事实 | 应负责 | Stage 0 判断 |
| --- | --- | --- | --- |
| `workspace.config.json` | 通用 BaseWindow / CoreWindow 等 generic 配置。 | GitHub 通用安装默认。 | 归属正确。 |
| `.wakeflow-local/workspace.config.json` | Alembic 安装实例覆盖，包含 Alembic*、AlembicDesign、AlembicTest、BiliDili 和 runtime matcher。 | 本机项目专属窗口名、路径、role、managedAgents。 | 归属正确且不提交；Stage 4 可从它生成 ChildWindowAccessProfile。 |
| `.wakeflow-local/codex-automation-loop/` | 本地 thread / packet / envelope / result runtime。 | 本地 automation 状态。 | Stage 0 未展开读取；Stage 5 小闭环时再验证。 |

### 7. Delivery / result surfaces

| 资产 | 当前事实 | 应负责 | Stage 0 判断 |
| --- | --- | --- | --- |
| `ControllerDispatchPacket` / `DeliveryEnvelope` / `TargetResultEnvelope` | 新闭环由 `codex-automation-loop.mjs` 和 automation skills 定义。 | delivery 信封、目标结果信封、review-results 齐件状态。 | 与 Design “总控写信，delivery 送信，子窗口回证据”一致。 |
| Manual prompt | 当前 `AGENTS.md` 已要求轻量 prompt，目标 / 范围 / 禁止 / 验证落当前计划。 | 人工复制唤醒入口。 | Stage 1 需确保 manual 与 automation 共用 task package 语义。 |
| Controller acceptance | 仍由总控在 current plan 回填区和 TODO/status 中记录。 | accepted / rework / blocked / next-wave / stop。 | 归属正确。 |

## 问题清单

| ID | 严重度 | 问题 | 证据 | 建议归口 |
| --- | --- | --- | --- | --- |
| WWO-S0-001 | P1 | Design handoff import 曾出现自相矛盾：target 中已有 `userConfirmation`，但 `issues` 报 ready entry 缺用户确认。 | `node scripts/import-design-handoffs.mjs --id WORKSPACE-WORKFLOW-OPTIMIZATION-2026-05-29 --json`。 | Stage 1 已修复：脚本支持枚举列并兼容旧自然语言；冲突失败。后续只剩外部 Design board 是否同步新列的推广问题。 |
| WWO-S0-002 | P1 | 当前 active ledgers 仍指向 PCVM Wave 6F；用户已明确切换到 WWO。 | index/status 当前行。 | 本轮通过 sync 切到 WWO；PCVM 不关闭，只记录为被打断观察主线。 |
| WWO-S0-003 | P2 | 旧 skill 路径 `alembic-workspace-control` 仍可能存在于旧文档或用户截图语境；当前真实路径是 `control-workspace-governance`。 | `sed codex-control-workspace/skills/dev/alembic-workspace-control/SKILL.md` 失败；真实 skill 列表无该路径。 | Stage 2 清理旧路径引用，不改硬规则。 |
| WWO-S0-004 | P2 | 脚本分类已经在 README 描述，但代码 / JSON 输出层面没有统一分类 metadata。 | scripts README。 | Stage 3 选择轻量方式补分类索引，不让脚本承担判断。 |
| WWO-S0-005 | P2 | 子窗口接入卡已覆盖最小门禁，但 `ChildWindowAccessProfile` 还没有作为可复核视图输出。 | managed AGENTS block + `.wakeflow-local/workspace.config.json`。 | Stage 4 生成或文档化 profile 视图；不新增任务状态系统。 |
| WWO-S0-006 | P3 | 模板 README 提到 starter / window-support 目录，Stage 0 粗略 `find -maxdepth 2` 未列出具体文件，需要确认是深层目录还是文档漂移。 | `find codex-control-workspace/templates -maxdepth 2 -type f`。 | Stage 3 模板整理时复核。 |

## 状态枚举化规划

本轮只把 `import-design-handoffs.mjs` 的用户确认识别做最小兼容，保证当前 Design handoff 可被脚本正确接收；不在 Stage 0 立刻重写所有 Design 文档和模板。

后续 Stage 1/2 统一设计以下枚举，避免脚本依赖自然语言：

| 字段 | 建议枚举 | 适用位置 | 说明 |
| --- | --- | --- | --- |
| `userConfirmationStatus` | `unconfirmed` / `confirmed` / `needs-confirmation` / `not-required` / `superseded` | Design handoff board、handoff template、requirement design metadata、import script | 机器判断只读枚举；自然语言说明放 `用户确认说明`。 |
| `handoffStatus` | 复用现有 `draft` / `ready-for-workspace` / `accepted-by-workspace` / `needs-design` / `paused` / `archived` / `research` / `absorbed-by-codex-loop` | Design handoff board、inbox | 现有状态已接近枚举，需集中写入模板和脚本常量。 |
| `mainlineRelation` | `none` / `todo-candidate` / `next-mainline` / `blocks-current` / `interrupts-current` / `after-current` | Design handoff、current plan intake | 当前自然语言仍可保留为说明，但脚本判断应依赖枚举。 |
| `priority` | `P0` / `P1` / `P2` / `P3`，可追加 short reason | Design handoff、TODO board | 机器排序只看枚举，理由另写。 |

迁移原则：

- 不要求一次性改旧历史文档；新模板和脚本先支持枚举，旧文档可由 import 脚本给出兼容 warning。
- `ready-for-workspace` 的最小机器条件应包含 `userConfirmationStatus=confirmed` 或 `not-required`，且必须有原始计划、需求设计、主线关系、建议 TODO、优先级和下一步。
- 如果自然语言说明和枚举冲突，以枚举为机器状态，但总控必须停下复核，不自动接收。

## Stage 1 默认闭环与枚举最小实现

Stage 1 的目标不是新增一套流程系统，而是把现有能力收束为一条默认闭环，并让 Design intake 的用户确认状态具备机器可读入口。

### 默认闭环

| Step | Owner | Input | Output | Stop gate |
| --- | --- | --- | --- | --- |
| Intake | 总控 | 用户输入、Design handoff、TODO 候选或 automation return | 分类后的来源、确认状态和主线关系 | 目标、完成定义、范围或用户确认不清时停止 |
| Decision | 总控 | Intake + 当前证据 + 当前计划 | 接收 / 延后 / 返 Design / 入 TODO / 建当前计划 | 会改变范围、路线、仓库边界或用户可见行为时停止确认 |
| Ledger | 总控，脚本只做机械同步 | 已裁决 decision | current plan / TODO / inbox / workspace-ledger 记录 | 脚本试图把建议变成已接收任务时停止 |
| Plan | 总控 | ledger entry + evidence | 任务包、发送表、测试边界、验证计划 | 任务包无法映射最终目标或缺证据要求时停止 |
| Deliver | 人工提示词或 automation delivery | 任务包 + 目标窗口 | 轻量提示词或 delivery envelope | 目标窗口、thread id 或 route 不合规时停止 |
| Result | 目标窗口 | 只属于本窗口的任务包 | result envelope 或等价回填 + 原始证据指针 | 目标窗口跨边界代领、代验或代开下游时停止 |
| Review | 总控 | result/backfill + 原始证据 | 接受 / 返工 / 阻塞 / 下一阶段裁决 | 证据缺失、冲突或只有自述时停止 |
| Record | 总控，脚本只做机械同步 / 归档 | review decision | current plan / status / TODO / archive 更新 | 记录会隐藏未解决问题或关闭未完成目标时停止 |

### 枚举最小实现

- `scripts/import-design-handoffs.mjs` 支持可选枚举列：`用户确认状态`、`主线关系状态`、`优先级枚举`。
- 旧 Design board 只包含 `用户确认`、`当前主线关系`、`优先级` 时继续兼容；旧文档不批量重写。
- 新模板和 starter handoff board 开始使用枚举列；机器判断优先读枚举。
- 枚举与自然语言冲突时脚本失败，交由总控复核，不能静默接收。
- `ready-for-workspace` 若启用了枚举列，必须填写 `用户确认状态` / `主线关系状态` / `优先级枚举`。

### 实现证据

- `scripts/import-design-handoffs.mjs`：新增枚举读取、冲突检测、target summary 中的 `userConfirmationStatus` / `mainlineRelationStatus` / `priorityStatus`，并补 `scriptComplete` / `agentNext`。
- `scripts/import-design-handoffs.test.mjs`：覆盖旧 board 兼容、新枚举成功、枚举 / 文本冲突失败、枚举列缺失失败。
- `templates/workspace-control-plan-template.md`、`templates/requirement-design-template.md`、`templates/workspace-handoff-template.md`：补用户确认、handoff、主线关系和优先级枚举字段。
- `templates/starter-workspace/workspace/current/design-handoff-board.md` 与 `scripts/control-workspace-install.mjs`：新建 Design board 时使用枚举列。
- `skills/dev/control-workspace-governance/references/control-architecture.md`：记录默认闭环和 handoff 状态枚举。

### Stage 1 裁决

- `WWO-S0-001` 已从“校验矛盾”转为“已修复 / 待后续枚举推广”：当前真实 WWO handoff 通过兼容解析，新的枚举路径有测试覆盖。
- Stage 1 不判定 WWO 完成；它只解除 Design intake 信任缺口，并为 Stage 2 资产归属调整提供稳定状态机。

## Stage 2 资产归属调整

Stage 2 的目标是把“哪些内容应该常驻、哪些内容应该按需加载、哪些内容只是当前事实或机械信封”定准，后续 Stage 3 / Stage 4 才能安全做瘦身和子窗口接入整理。本阶段不是删除规则，也不是改产品源码。

### 归属矩阵

| 资产 | Keep | Downshift | Rewrite | Discard |
| --- | --- | --- | --- | --- |
| 根级 `AGENTS.md` / `codex-control-workspace/AGENTS.md` | 最高停止卡、总控身份、确认门禁、测试 / 验收底线、分派 / 自动化硬边界、workspace 治理边界、skill 地图。 | 长命令、排错细节、模板正文、当前 wave 事实、一次性状态。 | 只能在先映射旧规则去向后整理密集段落；硬规则仍必须明文常驻。 | 不丢弃任何反复错误防线；只删除已退场机制名或重复当前事实。 |
| Governance skill / references | TODO、分派、测试、脚本、账本、迁移和架构整理的操作手册、命令顺序、示例与排错。 | 任何硬停止卡必须回写或保留在 `AGENTS.md`；当前计划事实不进入 reference。 | reference 必须写清触发场景和它补充的 resident 边界。 | 只重复旧当前计划事实、旧 VAD 手册或失效路径的内容。 |
| Automation controller / target skills | `ControllerDispatchPacket` / `DeliveryEnvelope` / `TargetResultEnvelope` 的机械步骤、一次性唤醒、role guard 和 review-results 操作。 | 用户目标、验收裁决、跨窗口调度、TestWindow 边界回到当前计划和总控。 | heartbeat 只保留语义首行、动态变量、规则名和 skill 指向。 | 旧 `claim / finish / chain-next / VAD` 路线不再作为 active protocol。 |
| Templates | 必要标题、表格形状、脚本锚点、枚举字段、占位标签和短边界提醒。 | 长 playbook、命令手册、仓库特例、当前任务事实。 | 模板应拆到能直接复制；超长条件移入 reference。 | commit hash、本机路径、当前状态、一次性决策。 |
| Scripts | 机械校验、同步、导入、归档、状态、安装 scope 写入和本地 automation contract；必须有 dry-run / write gate。 | ready 判断、TODO 优先级、证据接受、下一目标选择留给总控。 | Codex 续跑相关脚本输出必须有 `scriptComplete` / `agentNext` 或等价提示。 | 静默写子仓库、接受证据、改变范围或绕过当前计划的脚本行为。 |
| `.wakeflow-active/current/` | 当前目标、完成定义、任务包、当前证据、回填、TODO、测试交流和短期状态。 | 永久规则进 `AGENTS.md` / reference；历史归档进 `workspace-ledger`。 | 写 sync block 前先写清触发、证据、允许结论和禁止结论。 | 过期提示词、已归档 wave 噪声、重复历史。 |
| `workspace-ledger/` | 需求设计、阶段确认、长期契约、历史验收、归档地图和 repo-specific 长期协作文档。 | 活跃状态不进 ledger；通用骨架不进 ledger。 | 仍相关的历史要从 index 或 current plan 挂回。 | 临时 runtime、raw thread id、本机绝对路径和 active 噪声。 |
| 子仓库 `AGENTS.md` managed block | scope card、父级入口、窗口职责、读取顺序、本地停止卡、active plan pointer 和 role guard。 | 当前 wave 任务书、总控验收结论、其它窗口任务、完整提示词。 | managed block 由安装脚本生成，避免手写漂移。 | 不适用于该窗口的重复总控硬规则、旧路径、占位 thread id。 |
| `.wakeflow-local/` | 本地 config overlay、真实 thread id、automation runtime、stop marker 和本机状态。 | 人读状态进 current plan；长期历史进 ledger。 | 脚本可读，但不能要求进入 Git。 | 任何 tracked 或 prompt-visible raw thread id。 |
| PCV / PCVM | 分阶段计划方法、stage-node 词汇、scorecard readiness 和 evidence labels。 | Workspace 控制状态机和验收裁决仍归总控当前计划。 | PCVM 输出要投影为 workspace task package / evidence section。 | 第二套独立控制状态机。 |

### Stage 2 裁决

- 已把长期归属矩阵写入 `skills/dev/control-workspace-governance/references/control-architecture.md`，作为后续整理 `AGENTS.md` / skill / template / script / current ledger / child AGENTS 的标准入口。
- 当前不改 `AGENTS.md` 正文：根级和 source `AGENTS.md` 已经保留最高停止卡、使用地图和分层指向；继续编辑会变成无阻塞文档打磨，不服务当前 Stage 2 第一阻塞点。
- `WWO-S0-003` 经 `rg -n "alembic-workspace-control" codex-control-workspace -g '*.md' -g '*.mjs'` 核对，当前 control repo active / tracked 能力面没有旧 skill 路径引用；剩余命中只在 `workspace-ledger` 历史归档中，不作为当前阻塞。
- Stage 3 的真实阻塞点是脚本 / 模板瘦身：按本矩阵检查 `workspace-control-plan-template.md`、`workspace-task-package-template.md`、`scripts/README.md` 和 `workspace-control.mjs` 聚合说明，确认是否仍有 command manual / 当前事实 / 重复边界混在模板或脚本索引里。

### Stage 2 验证

- `rg -n "alembic-workspace-control" codex-control-workspace -g '*.md' -g '*.mjs'`：无当前 active / tracked 引用。
- 待本轮文档同步后运行 `node scripts/sync-current-plan.mjs --write --json` 和 `node scripts/verify-control-center.mjs --with-script-tests --json`。

## Stage 3 脚本与模板瘦身

Stage 3 的目标是按资产归属矩阵减少脚本索引和模板里的重复说明，让脚本只作为可验证机械层，模板只保留人写文档的必要骨架。这个阶段不新增流程系统，不改变 `AGENTS.md` 规则主权。

### 审计发现

| ID | 发现 | 处理 |
| --- | --- | --- |
| WWO-S3-001 | `scripts/README.md` 同时承担脚本索引和长命令手册，且 `import-design-handoffs.mjs` 出现重复条目。 | 合并重复脚本条目，把底部长命令块收敛为 `Common Routes` 表；完整命令目录指向 `script-pipeline.md`。 |
| WWO-S3-002 | `workspace-control.mjs scripts --tests` 聚合命令漏掉 `scripts/import-design-handoffs.test.mjs`。 | 纳入聚合命令，并在 `workspace-control.test.mjs` 增加回归测试。 |
| WWO-S3-003 | `workspace-task-package-template.md` 把执行前置硬规则写得像第二份 `AGENTS.md`。 | 改为短边界提醒：读父级 / 当前 / 目标 AGENTS，声明窗口职责，只做本窗口任务，子 agent 只在本窗口边界内辅助。 |

### 实现证据

- `scripts/README.md`：保留脚本职责索引，新增短 `Common Routes`；删除重复 `import-design-handoffs.mjs` 条目和底部长命令手册。
- `scripts/workspace-control.mjs`：`scripts --tests` 现在覆盖 `scripts/import-design-handoffs.test.mjs`；help text 指向 `script-pipeline.md`，不再复制长命令说明。
- `scripts/workspace-control.test.mjs`：新增 `--print scripts --tests` 回归测试，确认脚本校验、automation loop test、Design import test 和 workspace-control test 都在聚合输出中。
- `templates/workspace-task-package-template.md`：执行前置硬规则和 anti-pattern 收敛为短提示，具体硬规则仍由父级 `AGENTS.md` 和当前计划承接。

### Stage 3 裁决

- 脚本索引现在只负责“有哪些脚本 / 常用路线在哪里”，完整命令 playbook 归入 `skills/dev/control-workspace-governance/references/script-pipeline.md`。
- 模板只保留写当前计划或任务包所需的字段和短提醒，不再复制总控最高停止卡。
- `WWO-S0-004` 已通过轻量索引方式处理；不新增脚本 metadata，避免让脚本承担总控判断。
- `WWO-S0-006` 已复核：starter / window-support 是深层模板目录，不是缺失；无需改结构。
- Stage 4 的下一处真实阻塞点是把子窗口 managed AGENTS 与 `workspace.config` 汇成可复核的 `ChildWindowAccessProfile` 视图。

### Stage 3 验证

- `node scripts/check-script-docs.mjs`：通过，32 个脚本均有 README 索引，22 个 runtime / 10 个 test。
- `node scripts/workspace-control.mjs scripts --tests`：通过，62 个脚本测试全部通过。
- `node scripts/sync-current-plan.mjs --write --json`：已同步 `.wakeflow-active/index.md`、`.wakeflow-active/current/index.md` 和 `.wakeflow-active/current/workspace-current-status.md`。
- `node scripts/verify-control-center.mjs --with-script-tests --json`：通过，workspace boundary / repo status / docs / script docs / current sync / decision preflight / current layout / dispatch / test boundary / TODO / task package / whitespace / script tests 全部 PASS。

## Stage 4 子窗口接入边界整理

Stage 4 的目标是把 `workspace.config.json` / `.wakeflow-local/workspace.config.json` 与子窗口 `AGENTS.md` managed block 的接入事实汇成一张可复核视图。它只检查窗口坐标和自动化边界是否一致，不替总代控派发、验收或证据裁决。

### 实现证据

- `scripts/control-workspace-install.mjs`：新增 `access-profiles` 命令，输出 `ChildWindowAccessProfile` 列表，包含 window name、repo path、role、managedAgents、坐标、读取入口、当前计划目录、window ledger、Design/Test 特殊入口和 automation gate 检查。
- `scripts/control-workspace-install.test.mjs`：新增回归测试，覆盖 managed 子窗口缺接入卡失败、`write-agents` 后坐标和 automation gate 全部通过。
- `scripts/README.md`：记录 `access-profiles` 是只读视图，并把常用路线加入 `Common Routes`。

### 本机配置复核

运行 `node scripts/control-workspace-install.mjs access-profiles --json` 后，当前 Alembic 安装实例的 7 个非真实项目窗口通过：

| 窗口 | managed | 特殊入口 | 结论 |
| --- | --- | --- | --- |
| `Alembic` | yes | 无 | 坐标 / ledger / automation gate 全部通过 |
| `AlembicCore` | yes | 无 | 坐标 / ledger / automation gate 全部通过 |
| `AlembicAgent` | yes | 无 | 坐标 / ledger / automation gate 全部通过 |
| `AlembicDashboard` | yes | 无 | 坐标 / ledger / automation gate 全部通过 |
| `AlembicPlugin` | yes | 无 | 坐标 / ledger / automation gate 全部通过 |
| `AlembicDesign` | no | `docs/current/workspace-handoff-board.md` | 坐标 / Design handoff board / automation gate 全部通过 |
| `AlembicTest` | no | `.wakeflow-active/current/test-exchange.md` | 坐标 / Test exchange / automation gate 全部通过 |

`BiliDili` 是受保护真实测试项目，默认不进入 `access-profiles` 复核；需要显式传 `--include-real-project` 才会显示。

### Stage 4 裁决

- `ChildWindowAccessProfile` 是“窗口接入卡体检”，不是新的任务状态机。
- `WWO-S0-005` 已关闭：子窗口 access profile 现在可以由脚本输出并由总控复核。
- Stage 5 的真实阻塞点是跑一条低风险真实闭环，验证 Design intake / current plan / task package / delivery 或 manual prompt / result / review / record 是否贯通。

### Stage 4 验证

- `node scripts/control-workspace-install.mjs access-profiles --json`：通过，当前 Alembic 非真实项目窗口 profile 全部 `ok: true`。
- `node --test scripts/control-workspace-install.test.mjs`：通过，10 个测试全部通过。

## 完整实现后的真实测试确认

最终验收不以“文档写完”或“脚本单测通过”为完成。WWO 完整实现后，必须跑一条真实但低风险的 workspace 闭环，证明总控能力可以被正常使用。

真实测试对象：

- 使用真实 Design handoff 或专门的 WWO smoke handoff，不使用纯虚构的脚本 fixture 代替总控入口。
- 使用真实 active ledger：Design input / current plan / task package / result envelope / review / record 均落到 `.wakeflow-active/current/` 的正式入口。
- 使用至少一个真实已配置子窗口或受控目标窗口完成一项低风险任务，并返回 `TargetResultEnvelope` 或等价回填；若测试只需要验证总控自执行，也必须说明为何不需要子窗口。
- 不触碰真实产品源码，除非当前计划明确授权；不把 `AlembicTest` 当默认测试队列。

成功标准：

- Design import / intake 能基于枚举或向前兼容规则区分 `confirmed`、`needs-confirmation`、`unconfirmed`，不会把待确认需求误接收为可派发主线。
- 当前计划能从 intake 生成单一任务包，manual prompt 和 automation envelope 都只作为轻量唤醒入口，目标 / 范围 / 禁止事项 / 验证 / 回填要求均由当前计划和 skill 承接。
- 目标窗口只能执行分配给自己的任务，不能代领其它窗口、代验总控、代开下游；返回结果后，总控必须独立拉取原始证据裁决。
- `review-results` 或等价脚本只判断齐件 / 缺件 / 阻塞，不替代总控验收；验收结论写入当前计划和 TODO / status。
- 验证至少包含 `node scripts/verify-control-center.mjs --json`；若改脚本或模板，再追加对应 script docs / targeted script test。

失败 / 停止标准：

- 枚举和自然语言冲突、目标窗口定位不明、thread id / delivery envelope 不合规、结果缺少原始证据、子窗口跨边界处理其它窗口任务、或测试需要真实项目却未创建测试边界时，必须停止，不得写成完成。
- 如果真实闭环发现总控仍在“回填 -> 改文档 -> 重派发 -> 再回填”循环，必须回到 Stage 1 / Stage 2 修控制模型，而不是继续派发。

## 阶段顺序

1. Stage 0：控制资产地图和问题清单。已完成。
2. Stage 1：Workspace 默认闭环定稿，把 `Intake -> Decision -> Ledger -> Plan -> Deliver -> Result -> Review -> Record` 固定为普通路径，并完成用户确认枚举最小实现。已完成。
3. Stage 2：资产归属调整方案，列出 AGENTS / skill / reference / template / script / current ledger / child AGENTS 的 keep / downshift / rewrite / discard。已完成。
4. Stage 3：脚本与模板瘦身方案，只整理现有机制，不新增流程系统。已完成。
5. Stage 4：子窗口接入边界整理，基于 `workspace.config` + managed AGENTS 形成 `ChildWindowAccessProfile` 视图。已完成。
6. Stage 5：真实小闭环验证，验证 Design handoff -> 总控接收 -> current plan -> task package -> manual / automation delivery -> target result -> total-control review -> record。已完成。

- 下一处真实阻塞点：无；当前 WWO 主线已达到完整实现和真实闭环验证目标。
- 阻塞点之前还能做：归档裁决、提交 control workspace 变更，并后续按用户要求恢复其它主线。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：所有子窗口观察；PCVM Wave 6F 等 Alembic 回填状态保留但暂停推进。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| WWO-S0-CONTROL-ASSET-MAP | `AlembicWorkspace` | 接收 Design handoff，完成控制资产地图和问题清单。 | 已完成 |
| WWO-S1-DEFAULT-CONTROL-LOOP | `AlembicWorkspace` | 定稿 Workspace 默认闭环 owner / input / output / stop gate，并完成 Design import 用户确认枚举最小实现。 | 已完成 |
| WWO-S2-ASSET-OWNERSHIP-ADJUSTMENT | `AlembicWorkspace` | 裁决 AGENTS / skill / reference / template / script / current ledger / child AGENTS 的归属调整。 | 已完成 |
| WWO-S3-SCRIPT-TEMPLATE-SLIMMING | `AlembicWorkspace` | 瘦身脚本索引、聚合测试命令和任务包模板，保留脚本机械层与模板骨架边界。 | 已完成 |
| WWO-S4-CHILD-ACCESS-PROFILES | `AlembicWorkspace` | 形成 `ChildWindowAccessProfile` 只读视图，复核子窗口坐标、ledger 指向、Design/Test 入口和 automation gate。 | 已完成 |
| WWO-S5-REAL-CLOSED-LOOP-VALIDATION | `Alembic` -> `AlembicWorkspace` | 跑一条真实低风险闭环：总控创建任务包并投递 `Alembic`，目标窗口只读复核 access profile 并返回 `TargetResultEnvelope`，总控 review / record。 | 已完成 |

### WWO-S5-REAL-CLOSED-LOOP-VALIDATION：真实小闭环验证

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-30 02:56 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-30 03:15 CST

阶段目标：

- 用真实已注册 `Alembic` 窗口完成一次低风险 Codex Automation Closed Loop roundtrip。
- 验证当前计划任务包、light prompt / delivery envelope、目标窗口边界、`TargetResultEnvelope`、总控 review 和 record 能贯通。

主线动作：

- 总控创建 `ControllerDispatchPacket` 和 `DeliveryEnvelope`。
- 目标窗口只执行 `WWO-S5-ALEMBIC-ACCESS-PROFILE-ROUNDTRIP`。
- 目标窗口只读运行 `control-workspace-install.mjs access-profiles --window Alembic --json`，不修改产品源码。
- 目标窗口用 `codex-automation-loop.mjs submit-result` 返回 `TargetResultEnvelope`。
- 总控用 `review-results` 和原始命令证据做验收裁决。

合并 TODO：

- 无。

明确不包含：

- 不修改 `Alembic` 产品源码。
- 不创建 `AlembicTest` 测试单。
- 不扩大到 PCVM / cold-start / Dashboard / runtime 验证。
- 不把脚本结果自动当成验收结论；总控仍需独立 review。

下一处真实阻塞点：

- 无；`Alembic` 已返回 result envelope，且总控已独立复核原始证据。

阻塞点之前还能做：

- 已完成。

验证命令：

```text
node scripts/codex-automation-loop.mjs review-results --group workspace-workflow-optimization-stage5-real-closed-loop-2026-05-30 --json
node scripts/verify-control-center.mjs --with-script-tests --json
```

回填要求：

- 完成范围：Alembic 目标窗口只读 access profile roundtrip。
- 提交 hash：无；该任务禁止修改产品源码。
- 验证命令和结果：
  - `node scripts/codex-automation-loop.mjs create-dispatch ... --write --json`：成功创建 dispatch packet。
  - `node scripts/codex-automation-loop.mjs build-delivery ... --require-thread --write --json`：成功创建 delivery envelope；thread ready，thread id 已在输出中 redacted。
  - Codex heartbeat：成功创建 `codex-automation-alembic-wwo-stage5` 并投递给 Alembic。
  - `TargetResultEnvelope`：`.wakeflow-local/codex-automation-loop/target-results/Alembic__WWO-S5-ALEMBIC-ACCESS-PROFILE-ROUNDTRIP.json`，状态 `completed`。
  - `node scripts/codex-automation-loop.mjs review-results --group workspace-workflow-optimization-stage5-real-closed-loop-2026-05-30 --json`：`packetCount=1`，`missing=[]`，`blocked=[]`，`decision=needs-controller-review`。
  - `node scripts/control-workspace-install.mjs access-profiles --window Alembic --json`：`ok=true`，坐标检查和 automation checks 全部通过。
  - `git -C ../Alembic status --short --branch`：仅显示 `## main...origin/main`，无产品源码改动。
  - 回跳 cleanup：目标窗口已删除目标 heartbeat；总控删除 `codex-automation-alembicworkspace-return`，本地 automation 搜索无残留命中。
- 遗留风险：本轮只证明 WWO control loop roundtrip 与子窗口 access profile，不证明 Alembic 产品 runtime / cold-start / Dashboard / PCVM 行为。
- 下一步建议：归档 WWO，提交 control workspace 变更，再按用户指示恢复其它主线。

### WWO-S0-CONTROL-ASSET-MAP：控制资产地图

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-30 00:42 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-30 00:42 CST

阶段目标：

- 接收 `WORKSPACE-WORKFLOW-OPTIMIZATION-2026-05-29`。
- 只做资产地图和问题清单。

主线动作：

- 读取 Design original plan / requirement design / analysis / handoff board。
- 核对 control workspace AGENTS、skills、scripts、templates、active ledgers、config 和子窗口 managed AGENTS 事实。
- 记录 owner / must-not-own / drift / next owner。

合并 TODO：

- 无。

明确不包含：

- 不改产品仓库源码。
- 不改 AGENTS / scripts / templates / child AGENTS 正文。
- 不派 `AlembicTest`。
- 不启动 automation。

下一处真实阻塞点：

- Design handoff import 校验矛盾。

阻塞点之前还能做：

- 记录本地图并同步当前入口。

验证命令：

```text
node scripts/import-design-handoffs.mjs --id WORKSPACE-WORKFLOW-OPTIMIZATION-2026-05-29 --json
node scripts/workspace-control.mjs status --json
node scripts/verify-control-center.mjs --json
```

回填要求：

- 完成范围：Stage 0 资产地图和问题清单。
- 提交 hash：无；当前活跃账本默认不提交。
- 验证命令和结果：见本文件“总控决策记录”。
- 遗留风险：Stage 1 前需复核 Design import issue。
- 下一步建议：进入 Stage 1 默认闭环定稿。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WWO-S0-001 | 短期已处理 / 待长期枚举化 | script-ledger | P1 | ControlWorkspace | `import-design-handoffs.mjs` 用户确认校验矛盾已用兼容识别通过；长期改为枚举字段。 | 是，影响 Design intake 信任度。 | Stage 1/2 统一设计。 | AlembicWorkspace |
| WWO-S1-001 | 已完成最小实现 / 待推广 | design-ledger-contract | P1 | ControlWorkspace | Design import、handoff template、requirement design template、workspace plan template 已支持用户确认等枚举；旧历史文档继续兼容。 | 是，减少 ready handoff 误判。 | Stage 2 决定是否同步外部 Design managed content。 | AlembicWorkspace |
| WWO-S0-003 | 已复核 / 无当前阻塞 | docs-skill | P2 | ControlWorkspace | 当前 control repo active / tracked 能力面无旧 `alembic-workspace-control` 路径引用；历史 archive 保持历史事实。 | 否。 | Stage 2 已复核。 | AlembicWorkspace |
| WWO-S2-001 | 已完成 | architecture-governance | P1 | ControlWorkspace | 完成 AGENTS / skill / reference / template / script / current ledger / workspace-ledger / child AGENTS / local runtime / PCVM 的 keep / downshift / rewrite / discard 归属矩阵。 | 是，作为 Stage 3 / Stage 4 安全瘦身依据。 | `control-architecture.md`。 | AlembicWorkspace |
| WWO-S0-004 | 已完成 | script-contract | P2 | ControlWorkspace | 脚本分类采用轻量索引 + `Common Routes` + `script-pipeline.md` 承接，不新增脚本判断 metadata。 | 否。 | Stage 3 脚本瘦身。 | AlembicWorkspace |
| WWO-S3-001 | 已完成 | script-template | P1 | ControlWorkspace | `scripts/README.md` 去重瘦身、`workspace-control.mjs scripts --tests` 补齐 Design import test、任务包模板去重复硬规则。 | 是，减少提示词 / 模板 / 脚本说明重复。 | Stage 3。 | AlembicWorkspace |
| WWO-S0-005 | 已完成 | child-access | P2 | ControlWorkspace | `access-profiles` 已形成 `ChildWindowAccessProfile` 可复核视图，当前 Alembic 非真实项目窗口坐标和 automation gate 均通过。 | 否。 | Stage 4 子窗口边界整理。 | AlembicWorkspace |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 / 观察 | 否 | Stage 5 真实闭环验证已完成；不继续派发。 |
| `AlembicCore` | 无任务 | 否 | 不涉及共享内核。 |
| `AlembicAgent` | 无任务 | 否 | 不涉及 Agent runtime。 |
| `AlembicDashboard` | 无任务 | 否 | 不涉及 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不涉及插件 runtime。 |
| `AlembicDesign` | 观察 | 否 | Design handoff 已读；本轮由总控接收，不返工。 |
| `AlembicTest` | 无任务 | 否 | 不需要真实项目 / cold-start / Dashboard 手动观察。 |
| `BiliDili` | 无任务 | 否 | 真实项目只作为受保护测试目标，不直接派发。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 / 观察 | `WWO-S5-ALEMBIC-ACCESS-PROFILE-ROUNDTRIP` 已返回 `TargetResultEnvelope`；无需继续派发。 |
| `AlembicCore`<br>无任务 | 不涉及。 |
| `AlembicAgent`<br>无任务 | 不涉及。 |
| `AlembicDashboard`<br>无任务 | 不涉及。 |
| `AlembicPlugin`<br>无任务 | 不涉及。 |
| `AlembicDesign`<br>观察中 | 已完成 WWO handoff；本轮无返工。 |
| `AlembicTest`<br>无任务 | 不创建测试单。 |
| `BiliDili`<br>无任务 | 不改真实项目源码。 |

## 可复制提示词

发送给：无

```text
当前无子窗口分派。WORKSPACE-WORKFLOW-OPTIMIZATION Stage 5 已验收通过。
```

## 测试交接

- 是否需要 `AlembicTest`：不需要。Stage 5 验证的是 control workspace 派发 / 回填 / review 闭环，不需要真实项目、cold-start / rescan、Dashboard 手动观察或跨仓库集成环境。
- 总控自测结论：Stage 1-4 已由脚本测试和 `verify-control-center` 验证；Stage 5 需要真实已配置目标窗口 roundtrip，不能只用本线程脚本 fixture。
- 需要真实场景的理由：证明 workflow 不是纸面流程，因此 Stage 5 必须跑真实低风险闭环；本轮目标窗口只做只读 access profile 复核。
- 测试前边界与多条件判断：
  - 测试要回答的问题：完整实现后，WWO 是否能从 Design intake 到总控验收记录完整走通，且手动 / 自动化派发语义一致。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：active ledger、control workspace scripts/templates/skills、真实已配置目标窗口；不触碰真实产品源码，除非当前计划另行授权。
  - 成功能推出的结论：Workspace 默认闭环、枚举 intake、任务包、派发 / 自动化、result envelope 和总控验收记录可以真实贯通。
  - 失败能推出的结论：失败只能说明对应环节的控制模型或实现仍有缺口，不能放大为产品仓库失败。
  - 不能推出的结论：不能推出 Alembic 产品 cold-start / Dashboard / runtime 已通过；这些仍需各自任务或 `AlembicTest` 边界。
  - 停止或不开始条件：枚举冲突、目标窗口定位不明、delivery/thread id 不合规、缺原始证据、或需要真实项目但未写测试边界。
- 测试单：无。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md)
- 真实项目保护说明：不触碰 `BiliDili`。

## 回填区

- 2026-05-30 00:42 CST：总控接收 `WORKSPACE-WORKFLOW-OPTIMIZATION-2026-05-29`，完成 Stage 0 控制资产地图初版。当前不派子窗口、不改规则正文、不启动自动化。下一步建议进入 Stage 1：默认闭环定稿，并先复核 Design handoff import 校验矛盾。
- 2026-05-30：用户确认 WWO 当前主线和最终验收方向；总控补充最终完成定义和完整实现后的真实闭环测试门禁。Stage 1 先做默认闭环 + 枚举最小实现，Stage 5 再做真实低风险闭环验证。
- 2026-05-30：完成 Stage 1 默认闭环和确认枚举最小实现：`import-design-handoffs.mjs` 支持 `用户确认状态` / `主线关系状态` / `优先级枚举`，旧 board 兼容，新模板开始使用枚举，冲突失败闭环已由 `import-design-handoffs.test.mjs` 覆盖。下一步进入 Stage 2 资产归属调整。
- 2026-05-30：完成 Stage 2 资产归属调整：长期归属矩阵写入 `control-architecture.md`，当前计划记录 keep / downshift / rewrite / discard 裁决；未改产品仓库、未派子窗口、未下沉最高停止卡。下一步进入 Stage 3 脚本与模板瘦身。
- 2026-05-30：完成 Stage 3 脚本与模板瘦身：`scripts/README.md` 合并重复条目并改为短 `Common Routes`，`workspace-control.mjs scripts --tests` 补齐 `import-design-handoffs.test.mjs`，`workspace-task-package-template.md` 去除重复硬规则。下一步进入 Stage 4 子窗口接入边界整理。
- 2026-05-30：完成 Stage 4 子窗口接入边界整理：新增 `control-workspace-install.mjs access-profiles` 只读视图，当前 Alembic 非真实项目窗口坐标、ledger 指向、Design/Test 特殊入口和 automation gate 全部通过。下一步进入 Stage 5 真实小闭环验证。
- 2026-05-30 02:56 CST：启动 Stage 5 真实小闭环验证：总控准备创建 `workspace-workflow-optimization-stage5-real-closed-loop-2026-05-30` dispatch，投递给真实已注册 `Alembic` 窗口执行只读 access profile roundtrip；不修改产品源码，不派 `AlembicTest`。
- 2026-05-30 03:15 CST：Stage 5 真实小闭环验证通过：`Alembic` 返回 `TargetResultEnvelope`，总控复跑 `access-profiles --window Alembic --json` 为 `ok=true`，Alembic git 状态干净，目标和回跳 heartbeat 已清理；WWO 达到当前完整实现目标，进入归档 / 提交裁决。

<!-- workspace-sync
{
  "status": "Workspace Workflow Optimization Stage 5 已验收通过 / 待归档裁决",
  "indexPlanDescription": "完成 WWO 控制资产地图、默认闭环、确认枚举、资产归属矩阵、脚本与模板瘦身、子窗口接入边界整理，以及真实 Alembic 小闭环验证。",
  "indexStatusDescription": "当前状态：WWO Stage 5 已通过真实小闭环验证；下一步归档裁决与提交；PCVM Wave 6F 暂停推进但未关闭。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Workspace Workflow Optimization：Stage 5 真实小闭环验证已通过。",
  "currentStatusSummary": "WORKSPACE-WORKFLOW-OPTIMIZATION 已完成 Stage 5：真实 Alembic 目标窗口完成只读 access profile roundtrip 并返回 TargetResultEnvelope；总控复核 result envelope、access-profiles 输出、review-results 和 Alembic git 状态后验收通过；下一步归档裁决与提交。",
  "indexRows": [
    {
      "type": "PCVM Wave 6F report canonical projection",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-6f-report-canonical-projection-2026-05-29.md",
      "status": "被用户切换打断 / 暂停推进",
      "description": "原当前主线，等待后续恢复；本轮不归档、不关闭。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM Wave 6F report canonical projection",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-6f-report-canonical-projection-2026-05-29.md",
      "description": "原当前主线，被用户切换到 Workspace Workflow Optimization 后暂停推进；后续恢复时继续验收 Alembic 回填。"
    }
  ]
}
-->
