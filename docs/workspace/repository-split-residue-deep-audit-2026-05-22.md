# Repository Split Residue Deep Audit

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：RFR-6 深度代码审计完成；等待用户确认下一主线
关联当前计划：[repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)
来源 TODO：`GTODO-2026-05-22-012`

## 背景

用户指出：当前各仓库是从一个仓库拆分而来，文件夹定义与层级存在冗余与歧义，功能文件也可能没有完全遵照仓库功能定义；总控不能因为发现一个目标就停止，必须完整深度挖掘真实代码。

本审计补充 RFR-1 / RFR-2 / RFR-3A 的结论：RFR-3A 只完成了 Alembic 主仓库 `lib/core` 命名歧义的一个 bounded context 收敛，并不代表整个拆仓残留已经完成。后续必须把“Plugin-owned Codex 入口 / 请求治理”“Alembic service request client”“portable runtime 兼容实现”“真正可删除残留”“公共 contract 过宽”“文档 / UI 旧口径”分开处理。

长期前提：产品和模块路线遵循 `Plugin first, Alembic install enhances`。`AlembicPlugin` 是 Codex host agent 入口，`Alembic` 是本地增强底座；Alembic 安装且 service / daemon 可用时，Plugin 可以请求 Alembic 服务来工作。因此旧功能的新认识不能只看“Plugin 本地有没有一套实现”，还要判断它是不是 Alembic service 的 client、无 Alembic 时的 portable compatibility，或者确实已经变成早期拆仓残留。

本轮 `alembic_task prime` 未可用：AlembicWorkspace 自身还没有可用 knowledge base，插件返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。因此本审计只依据本地真实代码、已有总控文档和仓库边界文件，不把 BiliDili 当前运行态 knowledge 当作 Workspace 证据。

## 横向代码证据

### 1. Alembic 与 AlembicPlugin 存在大面积同名运行时树

脚本对比 `Alembic/lib` 与 `AlembicPlugin/lib` 的 `.ts` 文件：

- 共同相对路径：117 个。
- 内容完全相同：48 个。
- 内容不同但路径同名：69 个。
- 共同路径最多的目录：`http` 38 个、`external` 19 个、`service` 19 个、`injection` 10 个、`infrastructure` 10 个。
- Alembic 独有样例：`daemon/ProjectRuntimeControl.ts`、`daemon/RuntimeBoundary.ts`、`governance/*`、`http/routes/projects.ts`、`http/routes/task.ts`、`platform/OpenBrowser.ts`、`sandbox/*`、`tools/adapters/*`。
- AlembicPlugin 独有样例：`codex/*`、`external/mcp/CodexMcpServer.ts`、`external/mcp/codex/*`、`external/mcp/handlers/bootstrap-external.ts`、`core/constitution/*`、`core/gateway/*`、`core/permission/*`。

判断：`AlembicPlugin/lib` 不是单纯死代码，也不是单纯 Adapter。它包含 Codex-owned 入口、请求 Alembic service 的增强 client、embedded runtime 兼容 HTTP/service/daemon 层、以及拆仓后仍未改名的旧主仓库运行时影子。下一步必须先分类，再迁移或删除。

### 2. package 身份存在发布语义歧义

代码证据：

- `Alembic/package.json:2`：主仓库 package name 是 `alembic-ai`。
- `AlembicPlugin/package.json:2`：Plugin 源仓库 package name 也是 `alembic-ai`，同时 `AlembicPlugin/package.json:4` 标记为 private。
- `AlembicPlugin/package.json:68` / `83`：Plugin 负责 `prepare:codex-plugin-runtime` 与 `verify:codex-plugin`。
- `AlembicPlugin/package.json:99-100`：Plugin package bin 是 `alembic-codex-mcp`。
- `AlembicPlugin/scripts/verify-codex-plugin.mjs:232`：校验 embedded runtime package name 必须是 `alembic-ai`。
- `AlembicPlugin/scripts/verify-codex-plugin.mjs:280-281`：runtime artifact 必须包含 `dist/bin/codex-mcp.js` 和 `dist/bin/daemon-server.js`。

判断：这不是立即可改的普通命名问题，因为 Codex plugin runtime artifact 当前明确要求 embedded runtime package 仍叫 `alembic-ai`。但它确实造成 Alembic 主产品 package 与 Plugin portable runtime package 身份重叠，是后续发布 / cache / runtime 诊断最容易产生误解的点。

### 3. AlembicPlugin 的 portable runtime 兼容层是真实消费链路

代码证据：

- `AlembicPlugin/lib/codex/ModuleBoundary.ts:119-124`：`portable-runtime-packaging` 由 Plugin 拥有，负责打包 compiled Plugin runtime、embedded Core snapshot 和 Codex wrapper，不包含 Dashboard 前端资产。
- `AlembicPlugin/lib/codex/ModuleBoundary.ts:151`、`167`、`175`、`183`、`191`：Alembic daemon main、Core registry / JobStore、file monitor、internal AI runtime、Dashboard frontend source 均不是 Plugin source of truth。
- `AlembicPlugin/lib/codex/ModuleBoundary.ts:229-233`：embedded runtime 是 Plugin-owned portable adapter，用于 Codex delivery，并不是长期 Alembic daemon source of truth。
- `AlembicPlugin/lib/codex/ModuleBoundary.ts:244-249`：仍需继续消费 Alembic daemon runtimeBoundary，git-diff checkpoint 和 JobStore 暂时标记为 embedded runtime compatibility。
- `AlembicPlugin/scripts/prepare-codex-plugin-runtime.mjs:24-25`：runtime artifact 显式包含 Codex MCP bin 和 daemon-server bin。
- `AlembicPlugin/scripts/verify-codex-plugin.mjs:200`、`232`、`238-239`：校验 `runtime.tgz`、embedded runtime package name 和 `alembic-codex-mcp` bin。

判断：不能把 Plugin 的 `daemon` / `http` / `service` / `injection` 树直接判定为冗余删除。正确动作是建立服务增强语境下的分类表：Plugin-owned Codex 入口 / 请求治理、Alembic service request client、portable compatibility、deprecation candidate。`resident handoff` 应被视为 service request client 的一种，而不是一套新的 Plugin 主实现。

### 4. AlembicPlugin 仍保留旧 `lib/core` 命名

代码证据：

- `Alembic/package.json:27-29` 已使用 `#governance/*` 指向 `lib/governance/*`。
- `Alembic/AGENTS.md:77` 已将主仓库源码层列为 `governance`。
- `AlembicPlugin/package.json:28-30` 仍保留 `#core/*` 指向 `lib/core/*`。
- `AlembicPlugin/AGENTS.md:106` 仍把 `#core/*` 作为 Plugin 路径别名。
- `AlembicPlugin/lib/http/HttpServer.ts:15` 仍从 `../core/gateway/GatewayActionRegistry.js` 导入。

判断：这是 RFR-3A 之后最直接的残留。由于 Plugin 的 `core/constitution`、`core/gateway`、`core/permission` 与主仓库治理上下文同源，下一步需要决定它在 Plugin 中的真实角色：若是 Codex 请求治理，应改成 Plugin-local governance；若是 Alembic service request client，应明确 service 请求边界；若是无 Alembic 时的 portable compatibility，应写清保留和降级条件；若已可完全消费 Alembic/Core contract，再规划删除本地副本。不能只因为主仓库已改完就认为 Plugin 自动完成。

### 5. Alembic 与 AlembicPlugin MCP surface 已分叉

代码证据：

- `Alembic/lib/external/mcp/tools.ts:41` 引入 `WikiInput`。
- `Alembic/lib/external/mcp/tools.ts:165` / `437` / `443` 注册 `alembic_wiki`。
- `Alembic/lib/external/mcp/tools.ts:169` 将 `alembic_knowledge_lifecycle` 标为 destructive tool。
- `AlembicPlugin/lib/external/mcp/tools.ts:144-152` 注册 `alembic_codex_status` 到 `alembic_codex_cleanup` 等 Codex 专属工具。
- `AlembicPlugin/lib/external/mcp/tools.ts:170` 将 `alembic_knowledge_lifecycle` 标为 local write 的 reactivation 请求。

判断：两边 MCP 不再是同一工具集，分叉本身符合 Plugin first / Alembic install enhances 的路线；问题是同名目录 `lib/external/mcp/tools.ts` 容易被读成同一 contract。需要在后续整理中明确文档和文件名边界：Alembic 是 local daemon / full MCP surface，Plugin 是 Codex-facing MCP + host-agent bootstrap/rescan + resident enhancement handoff。

### 6. Dashboard 没有被 Plugin 直接打包，但仍有旧 MCP / internal AI 文案风险

代码证据：

- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:589-599`：`alembic_codex_dashboard` 只返回本地 Alembic daemon 提供的 Dashboard URL；embedded Codex plugin runtime 不打包或服务 Dashboard frontend assets。
- `AlembicPlugin/lib/http/dashboard/DashboardOperations.ts:26-31` 仍有 `dashboard.*` operation ids，并被 `routes/commands.ts:9`、`routes/modules.ts:22` 消费。
- `AlembicDashboard/src/components/Views/HelpView.tsx:621` 仍展示 `wiki_plan` / `wiki_finalize`。
- `AlembicDashboard/src/components/Views/HelpView.tsx:625` 仍展示 `knowledge_lifecycle`。
- `AlembicDashboard/src/i18n/locales/en.ts:1177` 与 `zh.ts:1174` 仍写 18 MCP tools。
- `AlembicDashboard/src/i18n/locales/en.ts:1417-1429` 与 `zh.ts:1414-1426` 仍有 internal AI 操作文案。
- `AlembicDashboard/src/i18n/locales/en.ts:345-346`、`1095` 和 `zh.ts:342-343`、`1092` 已有 host-managed 提示，说明 Dashboard 已部分适配 Codex host agent 语境。

判断：用户之前判断“Plugin 不再直接引用 Dashboard，所以不用特别处理”基本成立，不能把 Dashboard 前端列为 Plugin 整理阻塞项。但 Dashboard 帮助页 / MCP 列表 / internal AI 文案仍可能滞后于实际工具 surface，后续应单独作为 Dashboard 文案 / contract 对齐任务，而不是混进 Plugin 源码移动。

### 7. Core 的 `src/core` 和 deep exports 是公共 API 迁移债，不是简单目录重命名

代码证据：

- `AlembicCore/package.json:133-181` 导出 `./core`、`./core/analysis`、`./core/ast`、`./core/discovery`、`./core/enhancement` 和 `./core/*`。
- `AlembicCore/config/public-api-boundary.json:7` / `17`：transitional-internal 为 98，wildcardExports 为 61。
- `AlembicCore/config/public-api-boundary.json:21-24`：`./core`、`./core/analysis`、`./core/discovery` 是 keep-provisional。
- `AlembicCore/config/public-api-boundary.json:42-43`：`./core/ast` 与 `./core/ast/*` 是 must-keep transitional。

判断：Core 包名已经是 `@alembic/core`，内部再叫 `src/core` 确实有语义重复；但当前 public exports 明确把这些路径暴露给外部消费者。Core 后续不应先搬目录，而应先完成 facade / deep import closeout，减少 wildcard / transitional exports 后再考虑源码层级重命名。

### 8. Agent public API 边界清楚，但源码路径规则与真实路径不一致

代码证据：

- `AlembicAgent/package.json:45` 导出 `./ai`。
- `AlembicAgent/config/agent-public-api-boundary.json:5` / `10` / `20`：stable-public 15，`./ai` 在 stable exports 内。
- `AlembicAgent/AGENTS.md:76-77` 写 AI provider adapter 放在 `src/providers/` 或 `src/ai/`，Host adapter 放在 `src/hosts/`。
- 实际 AI provider 在 `AlembicAgent/src/external/ai/AiProvider.ts:14`、`AiFactory.ts:48`、`AiFactory.ts:81-92`。
- `AlembicAgent/src/agent/runtime/AgentRuntimeBoundary.ts:83-88` 明确 Codex MCP / marketplace / host-agent route 保持 Plugin-owned。

判断：Agent 不存在像 Plugin 那样的运行时大面积影子树，public API 也比较干净。问题是仓库规则文档和实际源码路径存在旧路线口径，需要低优先级对齐：要么文档承认 `src/external/ai`，要么另开小波次改源码路径并保持 `./ai` public export 不变。

### 9. Alembic 主仓库 RFR-3A 已完成，但 DB boundary lint 是独立边界债

代码证据：

- 当前计划已记录：RFR-3A 将主仓库 `lib/core` governance context 迁入 `lib/governance`，并通过 build:check、targeted unit、release package guard、负向扫描和 diff check。
- 当前计划同时记录：`npm run lint:repo-boundary` 仍命中 `lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`lib/infrastructure/audit/AuditStore.ts`、`bin/daemon-server.ts`。

判断：DB boundary lint 不属于“文件夹命名歧义”小波次，但属于拆仓后 layering 质量债。它应该保留为独立 TODO，不能混进 Plugin embedded runtime 分类主线里。

## 总控结论

RFR-3A 不是总完成，只是完成了 Alembic 主仓库一个明确、低风险、可验证的命名歧义。完整深挖后，拆仓残留至少分成六类：

1. `AlembicPlugin` Codex 入口 / Alembic service request client / portable compatibility / Alembic 主 daemon source of truth 的边界未完全显性化。
2. `AlembicPlugin` 仍保留旧 `lib/core` / `#core/*` governance 命名。
3. `AlembicPlugin` 和 `Alembic` 同名 package `alembic-ai` 带来发布身份歧义，但当前被 Codex runtime 校验真实消费，不能直接改。
4. MCP surface 已按路线分叉，但文件名和 Dashboard help 仍可能暗示旧的一套工具。
5. `AlembicCore` 的 `src/core` / wildcard exports 是 public API 迁移债，应先收敛 deep import。
6. `AlembicAgent` 是文档路径口径债，`Alembic` DB boundary 是独立 repo-boundary 质量债。

最重要的下一主线不是继续随机搬目录，而是在 Plugin first / Alembic install enhances 前提下，把 `AlembicPlugin` 旧功能分类做实；只有分类表证明某个目录 / route / service 既不是 Plugin-owned 请求治理，也不是 Alembic service request client，也不是 portable compatibility，才能进入删除候选。

## 下一步候选阶段

| 阶段 | 状态 | 主窗口 | 目标 | 是否当前派发 |
| --- | --- | --- | --- | --- |
| RFR-6A | 已转执行计划 | `AlembicPlugin` | 第一轮真实修正：在 Plugin first / Alembic install enhances 前提下，处理 Plugin `lib/core` / `#core/*` governance 命名残留；先分类为 Plugin-owned 请求治理 / Alembic service request client / portable compatibility / 旧残留，再做最小真实修正。 | 当前计划已派发 |
| RFR-6B | 等待 RFR-6A | `AlembicWorkspace` | 基于 RFR-6A 真实 diff、runtime artifact 和残留扫描，重新分析下一轮对象。重点不是“Plugin 是否复制 Alembic”，而是哪些旧功能应转成 Alembic service request client，哪些保留 portable compatibility，哪些才是旧残留。 | 否 |
| RFR-6C | 等待 RFR-6B | `AlembicPlugin` / `Alembic` | 明确 Plugin `/api/v1` compatibility routes 与 Alembic daemon HTTP/service 的请求边界；保留真实兼容接口，删除或标记没有消费方的旧 route。 | 否 |
| RFR-6D | 等待 RFR-6A | `AlembicDashboard` | 对齐 Dashboard HelpView / i18n 中 MCP tool list、internal AI、host-managed 文案，不改变前端架构。 | 否 |
| RFR-6E | 观察中 | `AlembicCore` | 先做 Core public API / deep import / wildcard export closeout，再讨论 `src/core` 源码目录命名。 | 否 |
| RFR-6F | 观察中 | `AlembicAgent` | 对齐 Agent AGENTS 路径规则与 `src/external/ai` 真实实现；必要时单独小波次迁移。 | 否 |
| RFR-6G | 观察中 | `Alembic` | 独立处理 DB boundary lint，不混入 Plugin embedded runtime 分类。 | 否 |

## 窗口覆盖判断

| 窗口 / 状态 | 判断 |
| --- | --- |
| `Alembic`<br>观察中 | 主仓库 RFR-3A 已完成；后续只观察 Plugin 分类是否需要 Alembic daemon contract 支撑。DB boundary lint 保持独立 TODO。 |
| `AlembicCore`<br>观察中 | Core 当前不启动源码移动；后续先做 public API / deep import 收敛。 |
| `AlembicAgent`<br>观察中 | Agent 当前不启动源码移动；文档路径口径债可作为低优先级小任务。 |
| `AlembicDashboard`<br>观察中 | Dashboard 不阻塞 Plugin 分类；后续单独对齐 HelpView / i18n 的 MCP 与 internal AI 文案。 |
| `AlembicPlugin`<br>待启动 | 当前计划已派发 RFR-6A：先按 Plugin-owned 请求治理 / Alembic service request client / portable compatibility / 旧残留四类重新理解旧 `lib/core`，再做最小真实修正。 |
| `AlembicTest`<br>观察中 | 当前只是代码审计和文档计划，不创建真实项目测试单；等出现 runtime/cache/行为变更再派发。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目。 |

发送窗口：无。当前为审计完成和下一主线确认阶段。

## 验收口径

RFR-6A / 后续修正的完成定义必须至少包括：

- `AlembicPlugin` 真实源码分类表，分类必须覆盖 Plugin-owned 请求治理、Alembic service request client、portable compatibility、旧残留四类；后续扩展时再覆盖 `lib/http`、`lib/service`、`lib/injection`、`lib/daemon`、`lib/core`、`lib/external/mcp` 与 release/runtime scripts。
- 每个分类项写明真实生产方、消费方、是否进入 runtime artifact、是否由 Alembic daemon/Core/Agent/Dashboard source of truth 替代。
- 删除候选必须有负向 import 扫描、替代入口和 targeted verification。
- Alembic service request client 项必须写清请求的 Alembic capability、daemon/service 可用性判断、失败/降级语义和 Plugin 可见诊断。
- portable compatibility 项必须写清保留原因、Alembic 未安装或 service 不可用时的行为，以及不能误删的验证命令。
- 不刷新 Codex plugin cache，不创建 AlembicTest 测试单，除非实际 runtime artifact 或用户可见行为发生变化。
