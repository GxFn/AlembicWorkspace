# AlembicPlugin MCP 工具清理整合与去宿主命名需求设计

Status: Design 草案（真实代码核实版 2026-06-18）/ 9 条决策 + C2a/C2b/C7/C8/C9 已定（C9=B 逐仓下线，另立跨仓需求）/ 待控制器 intake
Date: 2026-06-18
Design Key: alembic-plugin-mcp-tool-cleanup-consolidation-2026-06-18
Primary Window（执行）: AlembicPlugin（产品窗口；本文件仅 Design 需求设计）

## 背景与动机

AlembicPlugin 是**双壳宿主插件**（Codex shell + Claude Code shell，靠
`ALEMBIC_PLUGIN_HOST` 区分），但 MCP 工具名、类型、文案大量以 `codex` / `mcp`
命名误导 Claude Code 宿主；多轮工具退役又留下死代码。四工具核心
（`alembic_graph` / `alembic_recipe_map` / `alembic_search` / `alembic_prime`）
已收敛，本需求专做 **MCP 表面的命名规整 + 退役清理 + 碎片合并**，不改四工具语义、
不改 MCP 协议实现、不无评估地改 Alembic/Core。

## 真实代码现状锚点（2026-06-18 实扫，已交叉验证）

- **真实 active 工具 = 28**：`tools.ts` TOOLS **19**（`lib/runtime/mcp/tools.ts:124-367`）
  + `CodexMcpServer` codex-local **9**。
- **source-graph 9 个工具是死代码孤岛，已退役**（非 active）：
  `CODEX_SOURCE_GRAPH_TOOL_NAMES = new Set()` 空集（`ToolPolicy.ts:75`）；
  `openSourceGraphRuntime` 抛错「runtime has been withdrawn」（`source-graph/status.ts:802`）；
  `buildSourceGraphOperation/Status` 无人调用；整个 `lib/runtime/mcp/source-graph/` 无人
  import。`affected_tests`/`validation_plan` 等能力**随 Core runtime 撤回早已不可用**。
- **退役死代码**：`handlers/panorama.ts`、`handlers/task.ts` 无人 import；`tool-router`
  的 `routeKnowledgeTool`/`routeStructureTool`/`routeCallContextTool` 死路由；
  `project_matrix`/`submit_knowledge_batch` 残留。`handlers/structure.ts` 的 `graph()`
  **仍服务 active 的 `alembic_graph`**，非死。
- **命名规模与归类**：79 个 `.ts` 含 `codex`；核心 `Codex*` 类型经抽样**几乎都是双壳共用
  通用误用**（`CodexRuntimeContext` 有 `pluginHost` 字段、`RuntimeContext.ts:24`；
  `CodexKnowledgeState` `KnowledgeState.ts:115`；`CodexEnhancementRouteChoice`
  `EnhancementRoute.ts:124`）。真正**双壳专属**只有分发层：`plugins/alembic-codex` vs
  `plugins/alembic-claude-code`、`.codex-plugin`/`.claude-plugin`、
  `CODEX_PLUGIN_HOST='codex'` 值（`RuntimeContext.ts:15,45`）、`test/support/codex-session`、
  `bin/codex-mcp` 入口。
- **`CodexMcpServer` 是双壳共用 server**（唯一入口 `bin/codex-mcp.ts:32`、serverInfo
  `name:'alembic'` `:245`、Claude Code 无独立 MCP 入口）——名字纯误用，改名仅触及
  `bin/codex-mcp` + 3 测试。
- **改一个工具名/删一个工具同步面 = 7 文件 100+ 引用**：`OnboardingContract`(60)、
  `codex-local-tools/output` 白名单(37)、`PluginToolSurfaceCatalog`(32)、`ToolPolicy`(26)、
  `host/local-tool-dispatcher`(9)、`cross-host-readiness`(3)、`Preflight`(2)。

## 目标（用户 9 条决策，逐条对应阶段）

1. 去 `codex` 命名 → MTC-5；2. 去 `mcp` 命名 → MTC-6；3. graph 可替代的去掉
→ MTC-1/3（实为清死代码）；4. 删 `intent`+`decision_record` → MTC-2；5. 状态/健康
合一 → MTC-4；6. `CodexMcpServer` 改通用名 → MTC-5；7. codex 插件信息 host-neutral
→ MTC-5；8. 多余删干净 + 深度去相关代码 → 贯穿 MTC-1~3 双闭包验证；9. 先移除退役、
再合并 → 阶段顺序即此。

## 分阶段真实落地方案

### MTC-0 只读盘点 + 连通扫描 + 确认点收集（不改码）

- 复核 active 28 工具基线、死代码清单、命名分类、命名映射 + 文案清单定稿；定位 tools/list
  parity 基线形态；建两条 reachable 闭包（MCP 入口 codex-mcp→McpServer；DaemonSupervisor
  spawn 的 daemon-server→HttpServer），删除一律双闭包验证。

### MTC-1 移除退役死代码（第 8/9 条；含 source-graph 整目录）

- 删 `handlers/panorama.ts`、`handlers/task.ts`；**删整个 `lib/runtime/mcp/source-graph/`
  目录** + `SOURCE_GRAPH_OPERATION_TOOL_NAMES`/`CODEX_SOURCE_GRAPH_TOOL_NAMES` 残留常量；
  删 `tool-router` 死路由 + `PanoramaModule` + `ToolPolicy` 退役条目 +
  `project_matrix`/`submit_knowledge_batch` 残留；**保留** `structure.ts` 的 `graph()`；
  `OnboardingContract.removedOrBlocked` 按硬切清退役声明。

### MTC-2 删除 alembic_intent + alembic_decision_record（第 4 条；C2a 拆删 / C2b 表面停用）

- **intent 一并拆删（C2a 已定）**：`intentRef` 在 `work_start`/`work_finish`/`code_guard`
  仅作**可选关联标记**（`agent-public-tools.ts:654` `...(args.intentRef ? {...} : {})`，非
  主逻辑），故连内部拆：删工具 + `buildIntentIntake`(:190) + `nextIntentRef` + 各工具
  `intentRef?` 字段 + output intentRef block(:297/615/673/777)；work/code_guard 主逻辑不破；
- **decisionRegister Plugin 表面停用（C2b 已定）**：Plugin 仓内消费者仅
  `public-tools/contract.ts`、resident client、DI——Plugin 内**无 Dashboard 消费**，删
  Plugin 工具 + client 方法 + DI + contract 安全。**但跨仓实现是在用产品能力**（见 C9：
  Alembic DecisionRegisterStore + decision-register HTTP + **prime 注入包消费** + Dashboard
  视图）——本阶段**只下线 Plugin 入口**，跨仓清理范围待 C9；
- 删 Plugin 全链：schema、handler、`PluginToolSurfaceCatalog`、`tools.ts`、`ToolPolicy`、
  `public-tools/contract|output|descriptions|cross-host-readiness`、`OnboardingContract`。

### MTC-3 graph 为唯一结构查询入口（第 3 条；source-graph 已死，无迁移工作）

- source-graph 现实中已被 graph 取代（runtime 撤回），MTC-1 清死代码即完成第 3 条；本阶段
  只清 `structure`/`call_context` 类型/schema 残留；
- **诚实记录**：`affected_tests`/`validation_plan` 是 graph 现有 13 queryKind
  （`mcp-tools.ts:511-525`）**没有**的派生能力，已随 Core runtime 撤回不可用；按「不扩
  graph」本需求**不恢复**，未来需要则另立需求。

### MTC-4 状态/健康合并为 alembic_status（第 5 条；真实 gate 跨 server 冲突）

- 合并 `alembic_mcp_status` + `alembic_codex_diagnostics`（codex-local，
  `host/local-tool-dispatcher`，gate=`cold-start`）+ `alembic_health`
  （`McpServer.tool-router`，`handlers/system.ts:13-139`，gate=`resident-project-scope`）；
- **真实边界**：① 跨两个 server，合并入口须在一处聚合另一处能力；② gate 语义冲突——
  preflight 在 gate 层判定（`CodexMcpServer.ts:344-356`、`Preflight.ts:171`）。`alembic_status`
  须 gate 用 **OR**（cold-start ∪ resident-project-scope）+ handler 内按 `aspect`
  （runtime/knowledge）分支，cold-start 态只返回 runtime 子集、不触发 resident-only 能力。

### MTC-5 去 codex 命名 + CodexMcpServer 改名（第 1/6/7 条；Host* + 双壳分发层保留）

- **保留专属**：`CODEX_PLUGIN_HOST` 值、`plugins/alembic-codex` / `plugins/alembic-claude-code`、
  `.codex-plugin`/`.claude-plugin`、`test/support/codex-session`；
- **改 `Host*`（通用误用层）**：`CodexRuntimeContext`→`HostRuntimeContext`、
  `CodexKnowledgeState`→`HostKnowledgeState`、`CodexEnhancementRouteChoice`→
  `HostEnhancementRouteChoice`；目录 `codex-local-tools/`→`local-tools/`；
  `CodexMcpServer.ts`→**`HostMcpServer.ts`**（连通仅 `bin/codex-mcp.ts:32` + 3 测试；
  `bin/codex-mcp`→`bin/host-mcp`）；
- 工具名去 codex/mcp：`alembic_codex_dashboard`→`alembic_dashboard`；其余见 MTC-4/6/7；
- **host-neutral 文案**（实扫）：`host/host-project-handoff.ts:37-53`、
  `codex-local-tools/output.ts:198-210`、`PluginToolSurfaceCatalog.ts:120/131/142`、
  `ProjectRuntimeContext.ts:95/445`、`bin/codex-mcp.ts:4/12/21/40`、
  `cross-host-readiness.ts:56`；宿主区分通过 `ALEMBIC_PLUGIN_HOST` 值表达。

### MTC-6 去 mcp 命名（第 2 条）

- `alembic_mcp_init`→`alembic_init`；`alembic_mcp_status`→并入 status；
  `mcp_bootstrap_job`/`mcp_rescan_job`→并入 job；**边界**：仅去工具名冗余 `mcp`；`McpServer`
  协议类、`#codex` import key（D5 保留）保留（确认点 C6）。

### MTC-7 工具合并（第 9 条；真实 handler 结构支撑）

- **job 三合一（已证共享 runner）**：`mcp_bootstrap_job`+`mcp_rescan_job` 共用
  `enqueueJob(kind)`（`CodexMcpServer.ts:908-977`）、`codex_job`→`readJob`(:979-1079)，同走
  `this.residentClients().jobs` → `alembic_job`(op)；
- **stop+cleanup（均 destructive）**：`stopDaemon`(:826-836)+`cleanupRuntime`(:838-875) →
  `alembic_runtime`(action)；
- **guard 拆分 + Plugin 分析下线（C8 已定）**：`guard` 的 `guardCheck`/`guardReview` 并入
  `code_guard`；其项目级分析 `coverage_matrix`（`guard.ts:850`）+`compliance_report`(:895)
  **下线 Plugin MCP 暴露**——Plugin 内消费者仅 `tools.ts`/`mcp-tools.ts`/`GuardModule` DI，
  删 Plugin 两路由 + handler(:850-953) + DI + schema 安全。**但 Core 实现
  （`AlembicCore/src/service/guard/`）被 Alembic guardReport HTTP + Dashboard 消费**——Core
  侧是否清理见 C9，本阶段只下线 Plugin 暴露；
- **work 合并（C7 已定）**：`work_start`+`work_finish`→`alembic_work`(phase)；
  `evolve`+`consolidate`+`dimension_complete` **保留**（rescan 工作流不同 phase，语义清晰，
  合并反致一工具承载三种决策语义）。

### MTC-8 映射落地 + parity 重建 + 验收

- 旧→新全映射落地；**同步 7 处 100+ 引用点**，漏一处断 tools/list 或双壳 parity；双壳真实
  `tools/list` 验证 + parity 基线重建（硬切，不留别名）；文档/skill/onboarding/dashboard
  文案同步；全仓 build/check/lint 绿；嵌入式 daemon 契约不破。

## 工具映射表（真实核实版）

| 处置 | 旧 | 新 |
|---|---|---|
| 合并（跨 server，gate OR）| `alembic_mcp_status` `alembic_codex_diagnostics` `alembic_health` | `alembic_status`（aspect） |
| 改名 | `alembic_mcp_init` | `alembic_init` |
| 改名 | `alembic_codex_dashboard` | `alembic_dashboard` |
| 合并（共享 runner）| `alembic_mcp_bootstrap_job` `alembic_mcp_rescan_job` `alembic_codex_job` | `alembic_job`（op） |
| 合并（均 destructive）| `alembic_codex_stop` `alembic_codex_cleanup` | `alembic_runtime`（action） |
| 合并（C7）| `alembic_work_start` `alembic_work_finish` | `alembic_work`（phase） |
| 部分合并 | `alembic_guard` 的 check/review | 并入 `alembic_code_guard` |
| 下线 Plugin 表面（C8；Core 见 C9）| `alembic_guard` 的 `coverage_matrix`/`compliance_report` | 删 Plugin MCP 暴露 |
| 删除（C2a 拆删 / C2b 表面停用；跨仓见 C9）| `alembic_intent`（连 intake）`alembic_decision_record`（连 Plugin 入口）| —（Plugin 表面无 Dashboard 消费）|
| 删死代码 | source-graph 9 + `panorama` `task` `structure` `call_context` `knowledge` `project_matrix` `submit_knowledge_batch` | —（整目录/handler/死路由删净）|
| 不动 | `graph` `recipe_map` `search` `prime` `submit_knowledge` `project_skill` `bootstrap` `rescan` `evolve` `consolidate` `dimension_complete` `code_guard` `knowledge_lifecycle` | 保留语义 |

预期工具规模：**28 active → ~18**（删 2 指定 + 状态 3 合 1 + job 3 合 1 + stop/cleanup
合并 + guard check 并 code_guard + work 2 合 1；source-graph 9 与 7 退役是死代码清理）。

## 跨仓清理评估（暂停待确认 C9）

用户要求「跨仓清理」decisionRegister / coverage / compliance。真实跨仓扫描发现这三者
**不是 Plugin 退役残留，而是 Alembic/Core/Dashboard 的在用产品能力**，Plugin MCP 工具只是
入口之一：

- **decisionRegister**：实现 `Alembic/lib/service/task/DecisionRegisterStore.ts`，独立 HTTP
  路由 `Alembic/lib/http/routes/decision-register.ts`（GET/POST），**被 prime 注入包深度消费**
  （`PrimeInjectionPackage.ts:81-239` decisionRegister meta/route/refCount），Dashboard 有
  decision-register 视图（`AlembicDashboard/src/api.ts:165-171`）。**不在 lib/resident/，未被
  cleanup 需求 D2 覆盖**。
- **coverage/compliance**：实现 `AlembicCore/src/service/guard/{CoverageAnalyzer,
  ComplianceReporter}.ts`，被 Alembic HTTP `guardReport.ts`（`GET /api/v1/guard/report` +
  `/report/coverage`）+ Dashboard 覆盖率展示（`api.ts:4290`）消费。

**冲突**：彻底跨仓清理会破坏 **prime 注入（核心四工具、非目标"不动"）+ Alembic HTTP API +
Dashboard 展示**——这是**下线在用产品能力**，非"删退役工具"。

**已定 C9=B（逐仓能力下线）**：彻底移除整条能力，已另立跨仓需求
`alembic-decision-register-guard-report-retirement-2026-06-18`（4 仓、先消费者后实现）。
本 MCP 需求只承担其 **Plugin 入口环**：MTC-2 删 `alembic_decision_record`、MTC-7 C8 下线
`alembic_guard` 的 coverage/compliance；prime 注入 / Alembic HTTP / Dashboard 视图 / Core
analyzer 的移除在跨仓需求里逐仓推进，两需求由控制器并组、Plugin 环只做一次。

## 非目标

- 不改四工具核心语义；不改 MCP 协议实现（`McpServer` 类保留，只去工具名冗余 mcp）；
- 不引入新能力、不扩 `alembic_graph`；不恢复 source-graph 已撤回的
  `affected_tests`/`validation_plan`；
- **本需求只下线 Plugin MCP 表面**（intent 关联 / decisionRegister 入口 / guard
  coverage·compliance 暴露）；其跨仓实现（prime 注入 / Alembic HTTP / Core analyzer /
  Dashboard 视图）是否清理归 C9，默认不动；
- 不保留旧工具名兼容别名（硬切）；不抹平双壳分发层专属命名。

## 确认点

**已定**（2026-06-18）：硬切删净；`Host*`、`CodexMcpServer`→`HostMcpServer`；双壳仅分发层
保留专属命名；source-graph 死代码删；**C2a** intent 一并拆删（work/code_guard 主逻辑不破）；
**C2b** decisionRegister Plugin 表面停用；**C7** `work_start`+`work_finish`→`alembic_work`，
evolve/consolidate/dimension_complete 保留；**C8** guard coverage/compliance 下线 Plugin 暴露。

**C9 已定 = B**（逐仓能力下线）：见上节「跨仓清理评估」+ 跨仓需求
`alembic-decision-register-guard-report-retirement-2026-06-18`。

**仍待确认**：

- **C6 mcp 边界**：`McpServer` 协议类名、`#codex` import key 保留（默认按此，MTC-0 复核）。

## 连通性边界（删除/改名前置，硬要求）

- 删 panorama/task/source-graph 前确认无 active 引用（已验证无人 import）；
- intent 拆删：`intentRef` 是 work/code_guard 可选标记（非主逻辑），连 intake 机制拆；
- decisionRegister / coverage / compliance 在 **Plugin 仓内无 Dashboard 消费**（删 Plugin
  入口安全）；但**跨仓有活跃消费者**（prime 注入 / Alembic HTTP / Dashboard）——彻底清理
  范围见 C9，默认只下线 Plugin 表面；
- 状态合并跨 server + gate OR，cold-start 态不得触发 resident-only 能力；
- guard 合并须先安置 check/review 再删；改任一工具名须同步 7 处 100+ 引用。

## 验证要求

- 每个删除经双闭包 reachable 验证；工具改名/合并后双壳真实 `tools/list` 验证 + parity 基线
  重建（硬切）；全仓 build/check/lint 绿；嵌入式 daemon 契约不破。

## 总控接收提示候选

```text
接收 Design 需求候选：Design/docs/current/alembic-plugin-mcp-tool-cleanup-consolidation-requirement-design-2026-06-18.md
目标：AlembicPlugin MCP 工具表面清理整合（真实核实版）——去 codex/mcp 命名、删退役死代码（含
source-graph 整目录）、删 intent/decision_record、状态合一（跨 server+gate OR）、
CodexMcpServer→HostMcpServer、按真实 handler 合并碎片（28 active→~18）。
关键待决：C9 跨仓清理范围——decisionRegister 被 prime 注入消费、coverage/compliance 被 Alembic HTTP
+ Dashboard 消费，A 仅 Plugin 表面下线 / B 逐仓能力下线（B 须逐仓立项，与"prime 不动/不破 Dashboard"
非目标冲突）。
顺序：MTC-0 盘点 + 收 C9/C6 → MTC-1 删退役（含 source-graph）→ MTC-2 删指定（intent 连 intake 拆、
decisionRegister 仅 Plugin 入口停用）→ MTC-3 graph 唯一入口 → MTC-4 状态合一 → MTC-5/6 去命名（Host*）
→ MTC-7 合并（job/stop-cleanup/work 合，guard 分析下线 Plugin）→ MTC-8 硬切 + 同步 7 处 + parity 重建。
纯 Plugin 表面，跨仓部分待 C9；删除一律双闭包 reachable 验证。
```
