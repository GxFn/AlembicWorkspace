# Plugin Architecture Interface Refactor Workspace Plan

日期：2026-05-31
状态：Stage 1+ 总控验收通过 / 待归档
发送给：无
总控定位：本文件是 AlembicWorkspace 对 `PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR-2026-05-31` 的接收、阶段目标和窗口分派计划；它不承载产品实现，不替代 AlembicPlugin 窗口对真实代码、测试和回填证据的复核。

## 目标判断

- 用户目标：开始 `PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR`，按功能和接口边界重构 AlembicPlugin，拆分职责，只保留 Plugin 需要的内容，并清理删除不属于 Plugin 的主体式能力。
- 最终完成定义：AlembicPlugin 的 Codex-facing MCP surface、execution router、resident adapter、embedded runtime compatibility、host-agent workflow、Project Skill delivery、prime / intent / search、opportunistic evolution fallback 都有清晰 owner、contract、输入输出、测试和禁止边界；旧入口按用户裁决不长期保留，Stage 0 证明真实消费者、测试、文档和 runtime packaging 迁移边界后，后续实施波次可以直接删除旧入口；runtime package / smoke / Codex host 启动契约不回退。
- 当前是否已经达到：已达到。Stage 0 dossier 已通过，Stage 1+ implementation wave 已完成并经总控复验；AlembicPlugin commit `646c034`，runtime 子仓库 commit `6ceefca`。
- 未达到时剩余差距：无当前阻塞。后续如要继续压缩 embedded HTTP / ServiceContainer 主体式外观，应另起后续优化，不阻塞本需求。
- 已达到时验收 / 归档判断：Stage 1+ 已通过总控验收，当前可进入归档 / 工作区提交收口。
- 当前任务分区：分配计划 + AlembicPlugin 产品执行派发。
- 不纳入本轮事项：不启动 automation；不派 Alembic / Core / Dashboard / Test；不修改 Alembic / AlembicCore / AlembicDashboard / AlembicAgent / AlembicTest / BiliDili；不删除 Alembic resident 主体的 `alembic_skill`；不在缺 runtime contract、prepare / verify / smoke 同步和 packaged runtime 证据时删除或改名 `daemon-server.js`。

## 总控决策记录

- 本次决策触发：用户要求“然后开始这个任务吧 `PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR`”。
- 需求 / 测试结果理解：这是已 confirmed 的 Design handoff。用户已裁决“不做长期兼容，直接新接口与新逻辑”，并进一步确认旧入口可以直接删除、embedded runtime 清理到职责最清晰明确、Stage 1-6 后续尽量合成一波实施、若真实消费者多于预期可以调整删除顺序。该裁决允许后续删除和合并推进，但 Stage 0 仍必须先只读钉住 Plugin shell、runtime package、tool surface、resident API、embedded compatibility 和跨仓库消费者。
- 已核对证据：Design 四份来源文档、当前 Design handoff inbox 和 AlembicPlugin 当前 submodule dirty 事实已核对，证据入口如下。
  - `AlembicDesign/docs/current/plugin-architecture-interface-refactor-original-plan-2026-05-31.md`
  - `AlembicDesign/docs/current/plugin-architecture-interface-refactor-requirement-design-2026-05-31.md`
  - `AlembicDesign/docs/current/plugin-architecture-interface-refactor-code-fact-review-2026-05-31.md`
  - `AlembicDesign/docs/current/plugin-architecture-interface-refactor-code-logic-research-2026-05-31.md`
  - `codex-control-workspace/.wakeflow-active/current/design-handoff-inbox.md`：handoff 为 `confirmed / ready-for-workspace`，建议先做 Stage 0 contract dossier。
  - 当前 AlembicPlugin 工作区存在 `plugins/alembic-codex` submodule dirty；Stage 0 必须先分类该状态，不得覆盖或回退。
- 是否需要先验证 / 重新计划 / 用户确认：不需要额外确认即可启动 Stage 0；Stage 0 通过后原则上不再询问是否删除 / 是否合并实施，但需要总控基于 dossier 证据组织最小可验收 implementation wave，并在发现真实消费者或 runtime 契约冲突时调整顺序。
- 本次允许更新：当前计划、global TODO、workspace index/status、Design handoff board/inbox、用户追加裁决记录，以及由 AlembicPlugin 执行窗口在本任务包内修改 AlembicPlugin 产品源码 / runtime package / tests / docs。
- 本次不得更新：Alembic / AlembicCore / AlembicDashboard / AlembicAgent / AlembicTest / BiliDili，真实 thread id，自动化 runtime，AlembicTest 测试单。

## Design / 需求来源

- 来源类型：DesignWindow handoff。
- 来源文档：
  - `AlembicDesign/docs/current/plugin-architecture-interface-refactor-original-plan-2026-05-31.md`
  - `AlembicDesign/docs/current/plugin-architecture-interface-refactor-requirement-design-2026-05-31.md`
  - `AlembicDesign/docs/current/plugin-architecture-interface-refactor-code-fact-review-2026-05-31.md`
  - `AlembicDesign/docs/current/plugin-architecture-interface-refactor-code-logic-research-2026-05-31.md`
- 用户确认状态：`confirmed`
- 用户确认说明：用户确认直接调研真实代码实现和功能使用，不做长期兼容，使用新接口与新逻辑；`daemon-server.js` / embedded HTTP runtime 纳入本需求后半段，先拆职责，只保留 Plugin 需要内容，再清理删除。2026-05-31 追加裁决：旧入口可以直接删除；清理到最清晰明确、职责分明；Stage 0 后续实施尽量合成一波；如真实消费者多于预期可以调整删除顺序和实施顺序。
- handoff 状态：`accepted-by-workspace`
- 主线关系状态：`next-mainline`
- 优先级枚举：`P1`
- 总控接收结论：正式接收为 AlembicPlugin 下一主线 Stage 0；本轮只读 dossier，不直接改代码。
- 是否需要目标阶段确认：Design 已记录用户确认，且用户已追加确认删除、彻底清理、合并实施和允许调整顺序。Stage 0 不改变产品代码，不再单独等待确认；Stage 0 后总控只需要基于证据组织 implementation wave，不再把“是否删除旧入口”作为待用户确认项。
- 是否需要代码实现依赖调研：需要，Stage 0 即为总控可验收的代码实现依赖调研 / interface dossier。

## 代码事实与边界

- 相关仓库：
  - `AlembicPlugin`：目标仓库，Stage 0 输出 dossier。
  - `AlembicCore`：观察 / shared contract producer；本阶段不改。
  - `Alembic`：观察 / resident daemon API producer；本阶段不改。
  - `AlembicDashboard`：观察；Dashboard 直接消费 Alembic daemon，不消费 Plugin API。
  - `AlembicTest`：观察；本阶段不需要真实测试窗口。
- 关键入口：
  - `AlembicPlugin/bin/codex-mcp.ts`
  - `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts`
  - `AlembicPlugin/lib/external/mcp/McpServer.ts`
  - `AlembicPlugin/lib/codex/ToolPolicy.ts`
  - `AlembicPlugin/lib/external/mcp/tools.ts`
  - `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts`
  - `AlembicPlugin/lib/external/mcp/handlers/task.ts`
  - `AlembicPlugin/lib/service/skills/ProjectSkillService.ts`
  - `AlembicPlugin/lib/codex/ProjectSkillDelivery.ts`
  - `AlembicPlugin/lib/codex/evolution/PluginOpportunisticEvolution.ts`
  - `AlembicPlugin/bin/daemon-server.ts`
  - `AlembicPlugin/scripts/prepare-codex-plugin-runtime.mjs`
  - `AlembicPlugin/scripts/verify-codex-plugin.mjs`
  - `AlembicPlugin/scripts/smoke-codex-plugin.mjs`
- producer / consumer 依赖：Codex host consumes plugin shell / wrapper / runtime package; Plugin consumes Core public contracts and Alembic resident HTTP APIs; Dashboard consumes Alembic daemon directly; runtime smoke consumes packaged files.
- 不可提前消费的上游：没有 Stage 0 runtime package consumer map 不得删除 `daemon-server.js`；没有 tool surface catalog map 不得删除 Plugin `alembic_skill` alias；没有 resident capability map 不得删除 `runtimeBoundary` fallback；没有 smoke/test update plan 不得重命名 host-visible tools。
- 不允许触碰的目录 / 仓库：总控不直接改 AlembicPlugin source/runtime bundle；AlembicPlugin 执行窗口只允许在本任务包边界内改 AlembicPlugin。不得修改 Alembic / AlembicCore / AlembicDashboard / AlembicAgent / AlembicTest / BiliDili。
- 真实测试项目是否涉及：不涉及。

## 阶段顺序

1. Stage 0：Interface Contract Dossier。只读输出功能区 owner、public surface、import graph、runtime package consumers、embedded runtime routes、resident API consumers、删除候选前置证据和 focused test set。
2. Stage 1+ Implementation Wave：在 Stage 0 dossier 通过后，优先合成一波实施，覆盖 Tool Surface 新接口、Codex Execution Router decomposition、Resident Adapter clients、Prime / Intent package 新接口、Embedded Runtime Compatibility 清理和 Validation / packaged runtime smoke；旧入口直接删除，`daemon-server.js` / HTTP / ServiceContainer 清到最清晰明确、职责分明。
3. Stage 1+ 调整规则：如果 Stage 0 发现真实消费者、runtime packaging、Codex host 启动契约或 smoke 链路比预期多，允许调整删除顺序和实施顺序，但不能恢复长期兼容路线，不能留下职责不清的主体式能力。

- 下一处真实阻塞点：无当前执行阻塞；仅剩归档 / 提交工作区账本。
- 阻塞点之前还能做：已完成总控复验。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：`Alembic`、`AlembicCore`、`AlembicDashboard` 观察；`AlembicTest` 暂不启动。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PAIR-STAGE0-PLUGIN-P0 | `AlembicPlugin` | 只读生成 Plugin interface contract dossier / import graph / public surface map / runtime package consumer map | 总控验收通过 |
| PAIR-STAGE1-PLUGIN-P1 | `AlembicPlugin` | 合并实施 Tool Surface catalog、旧 alias 删除、router / resident clients / prime presenter 拆分、embedded runtime compatibility 裁剪和 runtime verification | 总控验收通过 |

### PAIR-STAGE0-PLUGIN-P0：Interface Contract Dossier

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 21:43 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 22:06 CST

阶段目标：

- 在不改产品源码的前提下，产出总控可验收的 AlembicPlugin interface contract dossier，作为后续合并 implementation wave 直接删除旧入口、清理职责边界和调整实施顺序的唯一输入。

主线动作：

- 先读取本 workspace `AGENTS.md`、本计划、AlembicPlugin `AGENTS.md` 和 Design 四份来源文档。
- 先分类 AlembicPlugin 当前 dirty 状态，特别是 `plugins/alembic-codex` runtime submodule modified content；只记录，不覆盖、不还原。
- 输出 `PluginRuntimeContract`：plugin shell、wrapper、runtime package、channel、marketplace、skills、verify / smoke 消费者。
- 输出 `PluginToolSurfaceContract`：Codex local tools、core MCP tools、tool id、schema、annotations、visibility gate、gateway、handler owner、resident route policy。
- 输出 `ResidentServiceConsumerContract`：health、search、jobs、project-scope、intent-episodes、dashboard endpoints 的 current consumers 和 failure semantics。
- 输出 `EmbeddedRuntimeCompatibilityContract`：`daemon-server.js`、HTTP routes、ServiceContainer、recoverable jobs、git diff checkpoint 中哪些被 runtime / smoke / local tools 消费，哪些可裁剪。
- 输出 `CrossRepoConsumerMap`：AlembicCore / Alembic / AlembicDashboard / AlembicPlugin 的真实接口关系。
- 输出后续 Stage 1+ 合并 implementation wave 候选、直接删除清单、真实消费者迁移条件、职责清理边界和 focused test set。

合并 TODO：

- `PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR-2026-05-31`：Stage 0 interface contract dossier。

明确不包含：

- 不修改 AlembicPlugin 产品源码。
- 不提交 runtime bundle / submodule。
- 不删除 Plugin `alembic_skill` alias。
- 不重命名 / 删除 Codex-visible tools。
- 不拆 `CodexMcpServer` / `McpServer` / `AlembicResidentServiceClient`。
- 不删除 `daemon-server.js`、HTTP routes 或 ServiceContainer。
- 不修改 Alembic / AlembicCore / AlembicDashboard / AlembicAgent / AlembicTest / BiliDili。

下一处真实阻塞点：

- Stage 1+ implementation wave 前，必须有 Stage 0 dossier 证明真实消费者迁移路径、测试 / docs / smoke 更新范围和可删除边界；原则上不再等待“是否删除”的用户确认。

阻塞点之前还能做：

- AlembicPlugin 只读扫描和文档回填；可运行静态 search / dependency inventory 命令和不写源码的验证命令。

验证命令：

```text
git status --short
rg -n "alembic_skill|alembic_project_skill|CODEX_LOCAL_TOOLS|TOOLS|runtimeBoundary|residentService|daemon-server|prepare-codex-plugin-runtime|smoke-codex-plugin|verify-codex-plugin" .
git diff --check
```

如执行窗口认为需要跑现有测试验证当前基线，可追加：

```text
npm run build:check
npm run lint -- --diagnostic-level=error
npm run lint:repo-boundary
npm run verify:codex-plugin
```

回填要求：

- 完成范围：
- AlembicPlugin 当前 git / submodule 状态分类：
- Dossier 保存路径：
- PluginRuntimeContract 摘要：
- PluginToolSurfaceContract 摘要：
- ResidentServiceConsumerContract 摘要：
- EmbeddedRuntimeCompatibilityContract 摘要：
- CrossRepoConsumerMap 摘要：
- Stage 1+ 合并 implementation wave 候选、直接删除清单及前置迁移 / 验证条件：
- 实际命令和结果：
- 明确未修改的源码 / runtime 范围：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 AlembicPlugin `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、AlembicPlugin 仓库职责、本轮只读 dossier 职责，以及本仓库明确不承担 Alembic daemon / Dashboard / Agent runtime 职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担只读代码调研；最终由 AlembicPlugin 窗口统一复核和回填。

### PAIR-STAGE1-PLUGIN-P1：Implementation Wave

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 22:20 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 23:56 CST

阶段目标：

- 在 AlembicPlugin 仓库内完成一波职责清理和接口重构：建立 tool surface 单源、直接删除 Plugin legacy alias、拆开 Codex execution router 和 resident capability clients，清理 prime / intent presenter 边界，按 Stage 0 dossier 裁剪 embedded runtime compatibility，并同步 runtime package、smoke、docs 和 focused tests。

主线动作：

- 执行前先读取本 workspace `AGENTS.md`、本计划、Stage 0 dossier 和 AlembicPlugin `AGENTS.md`，并声明当前窗口定位和 AlembicPlugin 仓库职责。
- 先分类 `plugins/alembic-codex` 既有 dirty runtime artifact：判断其是否来自上一轮 packaged refresh、是否需要保留 / 刷新 / 随本波提交；不得覆盖、回退或混入无法解释的外部改动。
- 建立 `PluginToolSurfaceCatalog` 或等价单源，把 Codex local tools、embedded/core tools、annotations、input schema、tier/admin/knowledge gate、gateway、handler owner、resident route policy 统一到可测试 contract。
- 直接删除 Plugin Codex-facing `alembic_skill` legacy alias，同步 `tools.ts` / schemas / handler map / gateway / skills / README / tests / verify-smoke；不得误删 Alembic resident 主体的 `alembic_skill`。
- 从 `CodexMcpServer` 拆出 projectRoot scope、preflight / auto-init、local tool dispatcher、resident job / dashboard router、embedded executor、opportunistic evolution presenter 等职责；保留工具的外部名称、输入和输出不得无证据变化。
- 拆 `AlembicResidentServiceClient` 为 probe、project-scope、search、intent episode、jobs、dashboard capability clients；删除 Plugin `runtimeBoundary` fallback，改以 canonical `residentService` / endpoint capability 为准。
- 清理 prime / intent / sourceRefs package 边界，保留 sourceRefs、evidenceRefs、relation、vector 和 telemetry；不得把可见 receipt 或 evidence surface 静态化。
- 基于 dossier 定义 embedded runtime required route contract，裁剪不被 packaged recovery / smoke / Codex host workflow 消费的主体式 HTTP / ServiceContainer 外观。
- `daemon-server.js` 只有在同一波更新 `DaemonSupervisor`、prepare / verify / smoke、release playbook 和 runtime layout，并证明 packaged runtime smoke 成功时，才允许删除或改名；否则应保留但改清命名 / 文档职责。

合并 TODO：

- `PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR-2026-05-31`：Stage 1+ implementation wave。

明确不包含：

- 不修改 Alembic / AlembicCore / AlembicDashboard / AlembicAgent / AlembicTest / BiliDili。
- 不启动 automation，不创建 AlembicTest 测试单。
- 不保留长期兼容 shim，不把旧 alias 留作“临时 fallback”。
- 不用空壳接口、静态 mock、无调用方 adapter 或纯类型重命名代替真实调用链迁移。
- 不把 Dashboard / Alembic daemon 的 `runtimeBoundary` 消费误判为 Plugin 内 fallback 必须保留。

下一处真实阻塞点：

- 若 dirty runtime artifact 归属无法确认，或删除 `daemon-server.js` 会断 prepare / verify / smoke / packaged runtime 启动链路，则先回填阻塞和最小可验收替代顺序，不得强删。

阻塞点之前还能做：

- tool catalog 和 alias deletion、router decomposition、resident clients、prime presenter cleanup、non-destructive runtime required contract tests，以及不触发 runtime 启动面断裂的 docs / tests 同步。

验证命令：

```text
git status --short
npm test -- test/unit/CodexToolPolicy.test.ts test/unit/CodexMcpServer.test.ts test/integration/ZodSchemas.test.ts test/integration/ZodToMcpSchema.test.ts test/unit/CodexServiceRequestBoundary.test.ts test/unit/CodexModuleBoundary.test.ts test/unit/PluginHttpSurfaceBoundary.test.ts test/unit/AlembicResidentServiceClient.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/ProjectSkillService.test.ts test/unit/ProjectSkillDelivery.test.ts test/unit/PluginOpportunisticEvolution.test.ts
npm run build:check
npm run lint -- --diagnostic-level=error
npm run lint:repo-boundary
npm run verify:codex-plugin
npm run verify:codex-session
git diff --check
```

如 runtime package、wrapper、embedded daemon compatibility 或 `plugins/alembic-codex/runtime.tgz` 发生变化，必须追加：

```text
npm run smoke:codex-plugin
```

回填要求：

- 完成范围：
- commit(s)：
- AlembicPlugin git / submodule / runtime artifact 归属和处理结论：
- Tool surface catalog 与 `alembic_skill` alias 删除证据：
- Codex execution router 拆分证据：
- Resident capability clients 与 `runtimeBoundary` fallback 删除证据：
- Prime / intent / sourceRefs package 边界证据：
- Embedded runtime compatibility 裁剪 / 保留证据，特别是 `daemon-server.js` 处理结论：
- runtime package / skills / README / verify / smoke 同步证据：
- 实际验证命令和结果：
- 未修改仓库确认：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档、Stage 0 dossier 和 AlembicPlugin `AGENTS.md`。
- 明确声明当前窗口是 AlembicPlugin 执行窗口，只负责 Codex MCP、Skill、channel / marketplace、插件 runtime、安装验证和 Codex host 适配。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent；子 agent 不能跨仓库代领，最终证据由 AlembicPlugin 窗口统一回填。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR-2026-05-31 | Stage 1+ 总控验收通过 / 待归档 | plugin architecture interface refactor | P1 | `AlembicPlugin` | 基于功能和接口边界重构 AlembicPlugin；Stage 0 dossier 与 Stage 1+ implementation wave 均已通过总控复验。 | 否 | AlembicPlugin commit `646c034`；runtime 子仓库 commit `6ceefca`；总控复跑 targeted tests、build、lint、repo-boundary、plugin/channel/session verify、plugin smoke 和 diff check 均通过。 | 无 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | 只作为 resident daemon API producer；本波不改 Alembic。 |
| `AlembicCore` | 观察 | 否 | 只作为 shared contract producer；本波不改 Core。 |
| `AlembicAgent` | 无任务 | 否 | 本需求禁止重建 Agent runtime / AI provider。 |
| `AlembicDashboard` | 观察 | 否 | Dashboard 直接消费 Alembic daemon，不消费 Plugin API；本波不改 UI。 |
| `AlembicPlugin` | 已完成 | 否 | `PAIR-STAGE1-PLUGIN-P1` 已通过总控验收；不再发送提示词。 |
| `AlembicDesign` | 已完成 | 否 | handoff 已接收；如 Stage 1+ 发现需求矛盾再回 Design。 |
| `AlembicTest-IDE` | 无任务 | 否 | 本阶段不需要真实 Codex Agent 验收。 |
| `AlembicTest` | 无任务 | 否 | 本阶段总控 / Plugin 自测足够。 |
| `BiliDili` | 无任务 | 否 | 不涉及真实项目源码。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 仅观察 resident daemon API consumer map；本轮不改。 |
| `AlembicCore`<br>观察中 | 仅观察 public contract consumer map；本轮不改。 |
| `AlembicAgent`<br>无任务 | 不涉及。 |
| `AlembicDashboard`<br>观察中 | 仅确认 Dashboard 不消费 Plugin API；本轮不改。 |
| `AlembicPlugin`<br>已完成 | `PAIR-STAGE1-PLUGIN-P1` 已通过总控验收；AlembicPlugin commit `646c034`，runtime 子仓库 commit `6ceefca`。 |
| `AlembicDesign`<br>已完成 | handoff 已接收。 |
| `AlembicTest-IDE`<br>无任务 | 不启动真实 Codex Agent 验收。 |
| `AlembicTest`<br>无任务 | 不启动真实项目测试。 |
| `BiliDili`<br>无任务 | 不改真实项目源码。 |

## 可复制提示词

发送给：无

本轮不再向子窗口发送提示词。

## 测试交接

- 是否需要 `AlembicTest`：不需要。
- 总控自测结论：Stage 1+ 以 AlembicPlugin 自身 focused unit / integration / build / lint / verify / smoke 为主；总控可复核原始命令输出、diff、runtime package 证据和提交。
- 需要真实场景的理由：无；若后续触及真实 Codex thread、packaged runtime behavior 或 release smoke 无法由 Plugin 自身脚本证明，再单独判断是否交 AlembicTest。
- 测试前边界与多条件判断：
  - 测试要回答的问题：Stage 1+ 是否在 AlembicPlugin 内完成真实调用链迁移、旧入口删除、runtime compatibility 清理，并保持 Codex host/plugin verification 不回退。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：AlembicPlugin 源码、runtime package scripts、plugin bundled runtime artifact 和 Codex-facing MCP/session tests；不使用真实项目。
  - 成功能推出的结论：可以进入总控代码验收；不能推出真实项目 cold-start before/after 质量改善。
  - 失败能推出的结论：对应删除 / 拆分 / runtime package 链路仍未闭合，需要 AlembicPlugin 返工；不能直接归因到 Alembic / Core / Dashboard。
  - 不能推出的结论：不能推出 Dashboard / Alembic daemon 要改，不能推出真实项目 cold-start 成功，不能推出 release 发布完成。
  - 停止或不开始条件：dirty runtime artifact 归属无法解释，或 `daemon-server.js` / runtime package 改动会断 prepare / verify / smoke / packaged runtime 启动链路。
- 测试单：无。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md)
- 真实项目保护说明：不涉及真实项目。

## 回填区

- 2026-05-31 21:43 CST：总控接收 `PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR-2026-05-31`，读取 Design original plan / requirement design / code fact review / code logic research。裁决本轮只启动 Stage 0 interface contract dossier，不直接改 AlembicPlugin 代码，不启动 automation，不派 AlembicTest。
- 2026-05-31：用户追加确认：旧入口可以直接删除；embedded runtime / Plugin 职责清理到最清晰明确、职责分明；Stage 0 之后尽量合成一个 implementation wave；如真实消费者多于预期，可以调整删除顺序和实施顺序。总控记录为 Stage 1+ 实施约束，Stage 0 只读证据门槛不取消。
- 2026-05-31 22:06 CST：总控已将 `PAIR-STAGE0-PLUGIN-P0` 直接投递给既有 AlembicPlugin 执行窗口；未启动 automation / heartbeat，未在文档记录真实 thread id。当前等待 AlembicPlugin 回填 dossier 路径、命令结果、未修改范围、风险和下一步建议。
- 2026-05-31：AlembicPlugin 已回填 `workspace-ledger/AlembicPlugin/plugin-architecture-interface-contract-dossier-2026-05-31.md`。总控复核通过：dossier 覆盖 PluginRuntimeContract、PluginToolSurfaceContract、ResidentServiceConsumerContract、EmbeddedRuntimeCompatibilityContract、CrossRepoConsumerMap、focused test set、implementation wave 建议和直接删除前置条件；`git -C AlembicPlugin status --short` 仅显示既有 `plugins/alembic-codex` submodule dirty，`git -C AlembicPlugin diff --check` 无输出。本阶段不改产品源码、不启动 AlembicTest。
- 2026-05-31 22:20 CST：总控按用户“开始推进”要求组织 `PAIR-STAGE1-PLUGIN-P1`，发送目标为 `AlembicPlugin`；本波只改 AlembicPlugin，不启动 automation / AlembicTest，不修改其它产品仓库。
- 2026-05-31 22:25 CST：总控已将 Stage 1+ 轻量提示词直接投递给既有 AlembicPlugin 执行窗口；线程状态回读为 active / inProgress。未启动 automation，未在文档记录真实 thread id。
- 2026-05-31 23:56 CST：总控验收 `PAIR-STAGE1-PLUGIN-P1` 通过。AlembicPlugin commit `646c034 refactor plugin architecture interfaces`，runtime 子仓库 commit `6ceefca refactor codex plugin runtime surface`；AlembicPlugin 与 runtime 子仓库工作区均 clean。完成内容包括删除 Plugin Codex-facing `alembic_skill` alias、建立 `PluginToolSurfaceCatalog`、拆分 Codex execution router 模块、拆分 resident capability clients、将 `runtimeBoundary` 降为 diagnostics-only、明确 embedded runtime required files/routes 并保留 `dist/bin/daemon-server.js`，以及让 `runtime.tgz` 包含 `better-sqlite3` native binding 以通过 offline npx smoke。总控复跑 `npm test -- ...` 16 files / 192 tests passed、`npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run lint:repo-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run verify:codex-session` 1 file / 5 tests passed、`npm run smoke:codex-plugin` ok with `install/stdio/npxRuntime=passed`、`git diff --check` 和 `git diff --cached --check` 均通过。未修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / BiliDili。

<!-- workspace-sync
{
  "status": "Stage 1+ 总控验收通过 / 待归档",
  "indexPlanDescription": "Plugin Architecture Interface Refactor：Stage 0 dossier 与 Stage 1+ implementation wave 均已通过总控复核。",
  "indexStatusDescription": "Plugin architecture interface refactor Stage 1+ 已通过总控验收；AlembicPlugin commit 646c034，runtime 子仓库 commit 6ceefca。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Plugin Architecture Interface Refactor：Stage 1+ 总控验收通过，待归档。",
  "currentStatusSummary": "PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR-2026-05-31 Stage 1+ 已通过总控验收，待归档。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
