# AlembicPlugin 双宿主（Codex + Claude Code）职责架构重构与层级建设

Status: Design 草案（2026-06-19）/ 已解锁（daemon-removal 清理已完成）/ 调查完成 + 目标架构成形（Workflow wj95g1fvd）/ **范围已锁（大/全量 RC、删 generic、L3 留 Plugin、真双 identity、per-host 产物对等纳入）→ 待出 handoff**
Date: 2026-06-19
Design Key: alembic-plugin-dual-host-architecture-refactor-2026-06-19
Primary Windows: AlembicPlugin（重构）；AlembicCore（消费对接，observing）；Alembic（共享资产漂移门禁对侧，observing）

## 背景与解锁

排队需求（原 signal `alembic-plugin-dual-host-architecture-refactor-signal-2026-06-19`，blocked-on-upstream）现**解锁启动**——
总控已完成 `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18` 的清理删除。本重构**基于清理后终态代码**展开
（而非清理前结构）。

## 清理后基线（已核实，2026-06-19）

- git log 确认 PDR-1~5 全落地：PDR-1d 删 intent/intentKind；PDR-2a/b bootstrap/rescan 进程内 + 本地 Recipe 语义区向量；
  PDR-3 删 daemon 载体 + governance Gateway + CacheCoordinator + NoOpAuditLogger + alembic_dashboard 表面；
  PDR-4 resident 瘦身（drop dead lanes）；PDR-5 改写 selectEnhancementRoute（resident / 纯本地 首类）。
- 已删确认：`lib/daemon`、`lib/http`、`bin/daemon-server.ts`、`lib/governance/gateway`、`HitRecorder`、`IntentExtractor`、
  `HostIntentFrame`、`FileChangeHandler`。
- 当前 lib/ = 166 文件、49k LOC；顶层模块：`cli`/`infrastructure`/`injection`/`repository`/`runtime`/`service`/`shared`/
  `types`/`workflows`（无 daemon/http/governance-gateway）。
- Plugin 现态 = **纯 MCP 非强进程**：McpServer 同进程调 Core + HostMcpServer 宿主路线 + 本地阶段缓存 + 经 Core 接口/状态对接主体。

## 目标

AlembicPlugin 作为 **Codex + Claude Code 双宿主插件**的**职责整体架构重构 + 层级关系建设**：
- **层级清晰**：host-agnostic 内核/胶水 ↔ per-host 适配层（codex / claude-code）↔ 两 MCP 表面 ↔ Core/主体 消费——各层职责与依赖方向分明。
- **host 抽象统一**：修 `hostShape`（auto=claude-code）与 `ALEMBIC_PLUGIN_HOST`（疑硬编码 codex）的缺口/不一致（见 memory [[alembic-cc-plugin-dev-install]]）。
- **双宿主对等**：Codex 与 Claude Code 都一等支持（消除 codex-centric + cc 半支持）。
- **清理后遗留收口**：daemon/http/intent 删后的悬挂/孤儿/混杂层。
- 保持 daemon-removal 的"非强进程"不变量，不回退已删能力。

## 深挖结论（清理后真实架构，Workflow wj95g1fvd：4 簇调查 + 3 对抗核验 + 综合）

**核心判定（对抗核验确认）：清理后 Plugin 并非真正对等双宿主，而是 Codex-centric + Claude Code 图式占位（~5%）+
generic-host 0%。** 故本需求的"职责架构重构 + 层级建设"实质是 **真正把它做成双宿主 + 补建缺失的 per-host 适配层**，非微调。

- **host 抽象断裂**：`hostShape`（PluginRegistry.ts:59-78 按 manifest 检测 codex/claude-code）检测正确，但**只用于 2 处**
  （PluginRegistry.ts:85 选 manifest 路径、Diagnostics.ts:582 跳 asset 校验），**不 gate 任何工具行为**；`pluginHost`
  （RuntimeContext.ts）**从不分支行为**（仅 Diagnostics 读 :293/490/507/940）；**两 manifest 都硬编码
  `ALEMBIC_PLUGIN_HOST=codex`**（cc `.claude-plugin/plugin.json:33`、codex `.mcp.json:8`）→ cc 运行时永远自认 codex；
  只有 `CODEX_PLUGIN_HOST` 常量（RuntimeContext.ts:16）、无 claude-code 等价；测试只验 codex（HostMcpServer.test.ts:1808）。
- **执行层 100% Codex-only**：`HostMcpServer.ts` 含 `Codex` 102 处（buildCodexStatus/init 指导/项目根解析/postInit/
  setup/CodexEmbeddedToolExecutor/dispatchCodexLocalTool…），**零 claude-code 等价**。
- **产物图式对等、实现未对等**：5 个 skills 两 shell **字节相同**（cc 复制自 codex）；`AGENT_HOSTS=['codex','claude-code',
  'generic-host-agent']`（public-tools/contract.ts:11）+ cross-host 测试只验 **schema 不分叉、未验 runtime**；
  `PLUGIN-SOURCE.json` 明记 `hostWordingDebt`（skill 仍说 Codex，归未开工的 CC3 波次）；两 bootstrap 脚本相同、默认 codex（alembic-start.mjs:100）。
- **两 MCP 表面（清理后）**：`McpServer`（McpServer.ts:158，进程内内核，15 个 plugin-embedded-core 工具）+ `HostMcpServer`
  （:147，codex-local 网关，4 工具 init/status/job/runtime + 冷启动路由 + 委托 embedded McpServer）。19 工具、无 per-host 变体。
- **唯一健康的 host-agnostic seam**：连接层——`selectEnhancementRoute`（EnhancementRoute.ts:265-274，`resident | pure-local`，
  **host-blind**）+ AlembicResidentServiceClient（HTTP 桥）+ 本地向量（Ollama）。可作目标分层 L0/L1 范例。
- **清理遗留**：整体干净（~79%）；一处悬挂 bug——`agent-public-tools.ts:1975,1990` 仍推荐已删的 `alembic_project_matrix`
  （应为 `alembic_recipe_map`，已另立后台任务修复）；`RETIRED_PUBLIC_TOOL_REPLACEMENTS` 防御路由正常；mcp→service/workflows/
  governance 跨层 import 65 处（耦合，待按 layer-contract 收敛）。

## 目标分层（5 层，单向依赖；host-name 分支只允许在 L3）

| 层 | 内容 | host 耦合 |
|---|---|---|
| **L4 Per-Host Shell** | `plugins/alembic-codex` / `plugins/alembic-claude-code`：manifest、bin、skills/templates（per-host 化） | 宿主特有产物 |
| **L3 Host Adapter（新建、对称 codex/ + claude-code/）** | per-host：init 指导、项目根解析、status 视图、setup profile、host 身份 | **host-name 分支只在此层** |
| **L2 两 MCP 表面** | McpServer（内核）+ HostMcpServer（网关）：host-agnostic 派发，host 特定**委托 L3** | 不含 host-name 分支 |
| **L1 host-agnostic 内核** | service/workflows：search/recipe-map/graph/prime/work/code_guard/bootstrap/evolve/… + EnhancementRoute | host-blind |
| **L0 Core/主体 消费** | resident client + Core 接口/状态（resident\|pure-local） | host-blind |

依赖单向 L4→L3→L2→L1→L0。现状违背：L2（HostMcpServer）直含 Codex-only 逻辑（应下沉 L3）；host 身份未经 L3 统一。

## 重构候选（RC，待用户定范围）

- **RC-1 host 抽象统一**：cc manifest 改 `ALEMBIC_PLUGIN_HOST=claude-code`；加 `CLAUDE_CODE_PLUGIN_HOST` 常量 + per-host
  `expectedPluginHost`；env/identity 由 hostShape 派生、消除硬编码；让 `pluginHost` 真正驱动派发（经 L3）。
- **RC-2 建 L3 Host Adapter 层**：抽 `HostAdapter` 接口（init 指导/项目根/status/setup/executor 边界）；codex 实现=现有
  Codex* 逻辑迁入（先不改行为），新建 claude-code 对等实现。
- **RC-3 L2 去 host 耦合**：HostMcpServer/McpServer 改调 L3 adapter，收敛 102 处 Codex* 直依赖。
- **RC-4 per-host 产物对等**：skills/templates/constitution per-host 化（与 CC3 wording debt 协调）；调整 Alembic↔Plugin
  共享资产漂移门禁（现把 skill 当"相同/有意分叉"——per-host 化改变此模型）。
- **RC-5 generic-host-agent 取舍**：contract 第三宿主（0% 实现）保留 vs 删。
- **RC-6 清理遗留收口**：`alembic_project_matrix` 悬挂推荐（已另立后台任务）；mcp→service/workflows/governance 跨层耦合按 layer-contract 收敛。
- **RC-7 测试对等**：cross-host **runtime** 测试（非仅 schema）；cc 路径覆盖。
- **RC-8 compat 残留**：file-monitor / intent 兼容残留（HostDeclaredIntentInput 等）清理决策。

## 已决（用户 2026-06-19）

1. **范围 = 大（全量 RC-1~8）**：核心（host 抽象统一 + 建 L3 adapter + cc 对等执行 RC-1/2/3）+ per-host 产物对等（RC-4）+
   generic 取舍（RC-5）+ 清理遗留/测试对等/兼容残留（RC-6/7/8）。一次做透。
2. **generic-host-agent = 删**：`AGENT_HOSTS`（public-tools/contract.ts:11）去 generic-host-agent，收敛为 codex + claude-code 真双宿主。
3. **L3 Host Adapter = 留 Plugin**（host 适配是宿主本职，不下沉 Core）。
4. **host 身份 = 真双 identity**（codex/claude-code）：env 由 hostShape 派生、删 `ALEMBIC_PLUGIN_HOST=codex` 硬编码、加
   `CLAUDE_CODE_PLUGIN_HOST` 常量 + per-host `expectedPluginHost`。
5. **per-host 产物对等 = 纳入**（skills/templates/constitution per-host 分叉）——**须同步调整 Alembic↔Plugin 共享资产漂移
   门禁** + 与 **CC3 波次划界/合并**（wording debt）。
6. **de-Codex 化 = 纳入（按正确修改）**：~52 个误命名 host-agnostic `Codex*` surface（全部 `CODEX_*_TOOL_NAMES`、
   `resolveCodexServiceRequestBoundary`、`buildCodexProjectRuntimeContext` 等）**去 Codex 前缀、归 L1/L2**（RC-3b）。
7. **跨仓 = 确认接收**：本需求是**跨仓（Plugin + Alembic）**——改共享资产漂移门禁模型（manifest 单 path→per-host path、
   `check-shared-asset-drift.mjs`，治理权威在 Alembic 侧）须双仓协调；**非 Plugin 单窗口**。
8. **pre-existing 漂移 RED = 纳入本需求**：DH-0 先把 alembic-recipes/structure + recipes-setup/README 的现漂移同步绿，再做 per-host 分叉。
9. **验收口径 = claude-code 在 workspace 内真实验收**（cc 端 init/status/工具行为真对等）；**codex 路径由用户在 codex host 上
   真实验收（workspace 外，本需求 DH-6 不含 codex 实跑）**。

## 风险

- **跨仓共享资产漂移门禁（Alembic↔Plugin）**：per-host skill/template 对等化会改变"工具契约段有意分叉、skill 相同"的现模型——须同步调整门禁 + 双侧。
- **与 CC3 波次重叠**：PLUGIN-SOURCE.json 的 wording debt 归 CC3（未开工）——本需求须与之划界/合并。
- **保持 daemon-removal 不变量**：纯 MCP 非强进程不回退；L3 adapter 不得引入常驻进程。
- **大改面**：92 个 Codex* surface 处理（~40 抽 L3 + **~52 去前缀归 L1/L2**）+ 建对称 cc adapter——是大重构，须分阶段、保活路径、每步门禁绿。
- **⚠ 漂移门禁当前已 RED（pre-existing）**：alembic-recipes/structure shared 段 + recipes-setup/README 漂移（plugin RC5 改、main 未同步）——非本需求引入，但 DH-0/DH-4 须先同步绿再动 per-host 分叉，否则改面与现漂移纠缠。

## 分阶段骨架（DH-0~6，范围确认后细化）

- **DH-0** 盘点 + 前置（**先把 pre-existing 漂移门禁 RED 同步绿**：alembic-recipes/structure + recipes-setup/README；
  **cc-host hooks 可行性研究**：CC 是否暴露与 codex 等价的 host hooks——决定 cc adapter 8 簇形态；跨仓协调点 + CC3 划界确认）
- **DH-1** host 抽象统一 + 删 generic（RC-1/5：RuntimeContext.ts:45/62、cc manifest:32/33、cc bootstrap:100、Diagnostics.ts:542、`AGENT_HOSTS` 去 generic-host-agent + 6 文件）
- **DH-2** 建 L3 Host Adapter 接口 + codex 实现迁入（RC-2，先对齐现状不改行为）
- **DH-3** 新建 claude-code adapter + L2 改调 L3 + **52 误命名 de-Codex 归 L1/L2**（RC-2/3/3b，双宿主对等执行 + 去 Codex 语义混淆）
- **DH-4** per-host 产物对等 + 漂移门禁模型改 per-host（RC-4，跨仓 Alembic 协调；与 CC3 文案划界）
- **DH-5** 清理遗留收口 + 测试对等（RC-6/7/8）
- **DH-6** 验收：**claude-code 在 workspace 内真实验收**（cc init/status/工具行为真对等；非强进程不变量；漂移门禁绿；build/test）；
  **codex 路径由用户在 codex host 真实验收（workspace 外，不含于本需求验收）**

## DH 可执行细化（深挖落地 2026-06-19，3 路取证）

### 关键新洞察：92 个 Codex* surface = 真 host-specific(~40) + 误命名 host-agnostic(~52)
枚举 22 文件 92 个 `Codex*` 函数/常量，**并非都该进 L3**：
- **真 host-specific（~40 → L3 HostAdapter、per-host 实现）**：项目根解析/校验/init marker（ProjectRootResolver.ts:75-241）、
  workspace init（HostMcpServer.ts:425-499）、runtime env（RuntimeContext.ts:43-87）、MCP server 生命周期（HostMcpServer
  start/shutdown/handleToolCall）、tool execution context、host project alignment（HostProjectAlignment.ts:88-428）、
  plugin diagnostics（Diagnostics.ts:195-1103）、status 视图（StatusService.ts:128-851）、project skill root（ProjectSkillDelivery.ts:16-141）。
- **误命名 Codex* 实则 host-agnostic（~52 → 去前缀、归 L1/L2，不进 L3）**：`resolveCodexServiceRequestBoundary`
  (ServiceRequestBoundary.ts:19)、`resolveCodexToolPolicyState`/全部 `CODEX_*_TOOL_NAMES`（ToolPolicy.ts:75-352，普适工具策略
  非 host 专属）、`buildCodexProjectRuntimeContext`（ProjectRuntimeContext.ts:174）、tool visibility 过滤、result envelope 包装。
- → **RC-2/3 含两件**：(a) 抽真 host-specific 进 L3 HostAdapter（codex 实现迁入 + cc 对等）；**(b) 52 个误命名 host-agnostic
  去 Codex 前缀、归 L1/L2**——消除"Codex=host"语义混淆（codex-centric 错觉的根源之一）。

### L3 HostAdapter 接口（建议方法集）
项目根(resolveProjectRoot/validate/save/loadSaved)、workspace init(initializeWorkspace/record+readInitMarker)、runtime env
(ensureRuntimeEnvironment/resolveHostRuntimeContext/resolveEffectiveTier)、execution(buildToolExecutionContext)、MCP server
(start/shutdown/handleToolCall)、diagnostics(buildPluginDiagnostics/probeRuntimeBinary)。codex 实现=现有 HostMcpServer+resolver
迁入；cc 实现需补 8 簇（CC transport / init profile / 项目根发现 / env / tier / diagnostics / JobStore / execution context）。

### DH-1 精确改点（host 抽象统一 + 删 generic）
- **host 身份**：RuntimeContext.ts:45（去 'codex' 硬默认）、:62（expectedPluginHost 由 hostShape 派生，非恒 codex）；
  PluginRegistry hostShape(59-78,85) 检测正确，需喂给 RuntimeContext 派生 identity。
- **manifest**：cc `.claude-plugin/plugin.json:32` 删 `ALEMBIC_CHANNEL_ID=codex`、`:33` `ALEMBIC_PLUGIN_HOST→claude-code`；codex `.mcp.json:8` 不变。
- **bootstrap**：cc `bin/alembic-start.mjs:100` 默认改 `claude-code`（现两脚本相同；codex 不变）。
- **诊断**：Diagnostics.ts:542 比较改 `=== expectedPluginHost`（非恒 CODEX_PLUGIN_HOST）。
- **删 generic（6 文件）**：contract.ts:11、mcp-tools.ts:103（去 + 合并到 contract import）、KnowledgeContextStatus.ts:29-36
  （去 generic + 其他未实现 future-host stub）、cross-host-readiness.ts:55-59（随 contract 自动）、2 测试（CrossHostReadiness:35、KnowledgeContextContracts:26）。

### DH-4 精确改点（per-host 产物对等 + 漂移门禁）
- **现状**：codex/cc 两壳 skills **字节相同**（per-host 未真分叉，仅 main↔plugin 经 wakeflow-host 段分叉）；对等化 = 让 codex/cc
  各自承载 host-specific 指导（工具名 alembic_guard vs alembic_code_guard 等）。
- **门禁改法**：shared-asset-manifest 的 skill/template 从单 path → **per-host path**（codex/ vs claude-code/ 各声明）；
  `check-shared-asset-drift.mjs` 支持 per-host 比较 + 可选 cross-host coherence。
- **⚠ 当前漂移门禁已 RED（pre-existing）**：`alembic-recipes`/`alembic-structure` shared 段 + `recipes-setup/README` 漂移
  （plugin RC5 改了、main 未同步）——**DH-0/DH-4 须先把现漂移同步绿，再做 per-host 分叉**。
- **CC3 划界**：DH-4=结构 per-host 分叉（目录/标记/manifest/门禁）；CC3=文案统一（删 "Codex" 术语）。互不阻塞。

## 下一步

✅ 范围已锁（大/全量 RC、删 generic、L3 留 Plugin、真双 identity、per-host 产物对等纳入）+ 目标 5 层架构 + DH-0~6 骨架 + **可执行细化**成形。
下一步：出 **design-handoff** 交控制器 intake（含 DH-0~6、执行序、跨仓 consumer/产物迁移、**共享资产漂移门禁调整**、**CC3 划界**、
非强进程不变量、L3 host adapter 对称化）。
（悬挂 bug `alembic_project_matrix` 已另立后台任务、不阻塞本设计。）
