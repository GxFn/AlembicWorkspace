# Alembic 两仓接口与功能职责清理需求设计

日期：2026-06-17
Design Key：`alembic-plugin-core-responsibility-interface-cleanup-2026-06-17`
负责窗口：Design（候选，待总控 intake）
依赖：四工具 + ProjectContext/RecipeContext 拆分需求
（`alembic-graph-recipe-map-projectcontext-recipe-mounting-2026-06-17`），
RecipeContext（GMAP-2）落地后本需求的下沉项才可执行。
关联：governance-decision-enactment 的 B1（resident MCP registry 处置）——本需求把
B1 放进完整职责清理上下文落地。

代码事实核验：Alembic `fca6e6a`、AlembicPlugin `1256b1d`、AlembicCore `2823939`。

用户决策 2026-06-17（D1-D4 全部按推荐裁决）：D1 知识检索 HTTP 保留、内部改调
RecipeContext；D2 删除 Alembic resident/；D3 治理 HTTP 留 Alembic 暴露、实现下沉
Core 子模块；D4（2026-06-17 修正）host-agent-workflows / guard / evolution 的**骨架**
为 Core 共享子模块，**宿主 agent 路线编排留 Plugin、AI provider 路线编排留 Alembic**。

## 目标

在四工具 + ProjectContext/RecipeContext 拆分完成后，把 Alembic 与 AlembicPlugin
两仓的接口与功能职责梳理清楚并落地：MCP 能力归一到 Plugin，知识检索逻辑收敛进
Core RecipeContext，Alembic 回归"项目管理 + API-AI Agent + 知识库本地服务端
daemon"的清晰职责，两仓对 Core 的消费只剩"经 ProjectContext/RecipeContext 的业务
读取 + 基础设施直连"，删除中间重复与越界面。

## 三个问题的真实代码回答（现状）

### 1. 是否只有 AlembicPlugin 才做 MCP？

- **MCP 协议层（stdio MCP server）已经只在 Plugin**：只有 AlembicPlugin 依赖
  `@modelcontextprotocol/sdk`，入口 `AlembicPlugin/bin/codex-mcp.ts:32-34`，
  暴露 19 个工具（`lib/runtime/mcp/tools.ts:124-367`）。**Alembic 没有 MCP SDK、
  没有 stdio server**。
- **但 Alembic 仍保留一套 resident 工具实现**：`Alembic/lib/resident/`（14 个
  tool-handler + 4 个 schema），`consolidated.ts:1` 做参数路由（alembic_search /
  alembic_knowledge 等），但它**不是 MCP server，只是"工具处理程序库 + 类型系统"**
  （无 stdio 端点）。且 `lib/http/routes/*` 的 HTTP 路由**独立调用 Service 层**
  （SearchEngine/KnowledgeService/GuardService），与 resident handler **代码重复但
  不共享调用链**。
- 结论：MCP 协议承载已是 Plugin 独占；resident/ 是历史遗留的 MCP 工具镜像
  （governance B1 所说的 UNBOUND registry），是本需求要处置的对象。

### 2. 是否 Alembic 只做项目管理 + API-AI Agent？

不是。Alembic 现在跨 5 个维度（真实 HTTP 路由 30 条，`lib/http/provider-contracts.ts`
+ `lib/http/routes/*`）：

| 维度 | 路由前缀 | 判断 |
| --- | --- | --- |
| 项目管理 | projects / project-scope / modules / daemon / jobs / monitoring / health / logs / audit / file-changes | ✓ 本职 |
| API-AI Agent | ai / extract / commands / skills / candidates / auth | ✓ 本职 |
| **知识库服务** | knowledge / search / recipes / panorama / intent-episodes / signals / wiki | ⚠️ 超出"项目管理+Agent"——但 daemon 是本地知识库持有者，写入/生产路径必须保留 |
| **治理层** | guard / guardReport / guardRules / decision-register / evolution / violations / rules | ⚠️ 知识治理，非项目管理 |
| **MCP 工具库** | resident/（HTTP 镜像，无协议端点） | ⚠️ 与 Plugin MCP 重复 |

关键张力：Alembic daemon **持有本地知识库 DB**（`.asd/`），bootstrap/rescan/
submit 等**写入/生产路径**确在 Alembic（`lib/resident/tool-handlers/knowledge.ts:5`
→ KnowledgeService.create；`workflows/knowledge-rescan/`）——这部分是 daemon 本职、
必须保留。要清理的是**检索/读取逻辑**（下沉 Core RecipeContext）与**MCP 镜像**
（归 Plugin）。

### 3. ProjectContext/RecipeContext 之外，两仓还消费 Core 的哪些接口？

两仓对 `@alembic/core` 的消费高度重叠。除基础设施外，都在大量直连业务接口：

| Core 子路径 | Alembic | Plugin | 性质 |
| --- | ---: | ---: | --- |
| knowledge | 24 | 19 | Recipe/知识读写 |
| search | 16 | 17 | 检索 |
| vector | 7 | 7 | 向量/语义 |
| host-agent-workflows | 19 | 17 | cold-start/bootstrap 工作流 |
| guard | 15 | 15 | Guard 审计 |
| dimensions | 8 | 6 | 维度标签 |
| service/candidate | 6 | 5 | 候选相似度 |
| service/recipe | 2 | 2 | Recipe 解析/校验 |
| service/quality | 2 | 2 | 质量评分 |
| evolution | 5 | 4 | Recipe 进化 |
| memory | 2 | 2 | 记忆 |
| logging/workspace/shared/io/events/daemon/database/repositories/config/types | 多 | 多 | 基础设施（正常共用） |

## 目标职责模型（三仓 charter）

- **AlembicPlugin = MCP 能力的唯一承载者**：stdio MCP server + 四个信息工具
  （graph / recipe_map / search / prime）+ codex_*/mcp_* 生命周期工具 + 嵌入式
  Core 工具门面 + host shell（codex / claude-code）+ **宿主 agent 路线的冷启动/
  增量扫描/进化编排**（保留；无 AI pipeline，调 Core 骨架 + 宿主交互 + 证据门）。检索逻辑下沉
  后，Plugin 只调用 RecipeContext / ProjectContext 高阶 API，不再直连
  knowledge/search/vector。**Plugin 不持有项目管理职责**（已正确：无 daemon-server，
  file-monitor 归 Alembic，daemon/JobStore 只是嵌入式运行时兼容契约）。
- **Alembic = 项目管理 + API-AI Agent + 知识库本地服务端 daemon**：持有本地知识库
  DB、**AI provider 路线的冷启动/增量扫描/进化编排**（`lib/workflows/ai-execution/*`
  19 文件，daemon + AlembicAgent provider 自动跑维度；写入/生产路径
  bootstrap/rescan/submit job）、file-monitor、Dashboard server handoff、
  项目/模块/job/监控的 HTTP API。
  **不再承载 MCP 工具镜像**（resident/ 处置），**检索逻辑改调 Core**（HTTP 是否对外
  保留见决策 D1）。
- **AlembicCore = ProjectContext + RecipeContext + 独立能力子模块 + 基础设施**：
  ProjectContext（已有）、RecipeContext（新，收敛检索/Recipe/向量/校验/质量/维度）、
  guard / evolution / host-agent-workflows 作为**共享骨架**独立子模块（冷启动/扫描/
  进化的两条执行路线共享，编排各留本仓）、基础设施（logging/
  workspace/io/events/daemon/database/repositories/config/types/memory）。

## Core 接口消费收敛三分类

| 类别 | Core 子路径 | 目标 |
| --- | --- | --- |
| **下沉 RecipeContext**（两仓不再直连） | knowledge(读)/search/vector/service-recipe/service-candidate/service-quality/dimensions(标签) | 两仓改调 `RecipeContext.search()/get()/validate()/...`；检索/校验/质量/维度细节进 Core RecipeContext。`AlembicPlugin/lib/service/project-knowledge-context/retrieval/*` 整块下沉。 |
| **共享骨架留 Core，两条执行路线各留本仓** | host-agent-workflows（Core 只放 Mission Briefing 构建 / 维度规划 / 提交追踪 / bootstrap 会话 / ColdStartPlan 等确定性骨架）/ guard（GuardService）/ evolution（EvolutionGateway 骨架）/ memory | Core 导出共享骨架；**宿主 agent 路线**的冷启动/扫描/进化编排**保留在 Plugin**（`lib/runtime/mcp/host-agent-workflows/*`，含证据门，无 AI pipeline），**AI provider 路线**的编排**保留在 Alembic**（`lib/workflows/ai-execution/*` 19 文件，daemon + AlembicAgent provider）。两仓各自编排不删、不互相下沉。 |
| **保留基础设施直连** | logging/workspace/io/events/daemon/shared/database/repositories/config/types | 正常共用，不清理。 |
| **knowledge 写入/生产** | knowledge(写)/host-agent-workflows | 留 Alembic daemon（本地知识库持有者）。 |

## 候选清理阶段（RIC）

### RIC-0 盘点与冻结（AlembicWorkspace）

- 冻结两仓对 `@alembic/core` 每个子路径的真实消费清单（读/写性质、调用点
  file:line）、Alembic resident/ 工具与 HTTP 路由的真实映射、Plugin 19 工具分类；
- 确认目标职责 charter 与三分类表；收集决策 D1-D4。

### RIC-1 目标职责 charter 落地（AlembicWorkspace + 三仓）

- 把三仓 charter 写成各仓可校验的职责声明（与 AD 的 charter 体系对齐），加一条
  跨仓约束："MCP 协议端点只允许出现在 AlembicPlugin"的 lint/检查。

### RIC-2 检索类下沉 RecipeContext（依赖 06-17 GMAP-2）

- 两仓 knowledge(读)/search/vector/candidate/recipe/quality/dimensions 直连改调
  RecipeContext 高阶 API；Plugin `project-knowledge-context/retrieval/*` 下沉；
- 证明两仓不再直接 import 这些 Core 检索子路径（消费清单达标）。

### RIC-3 MCP 职责归一（删除 resident，B1 落地）

- **删除前置（连通性，必做）**：`routes/task.ts:14`、`routes/skills.ts:14`、
  `routes/candidates.ts:46` 三处 HTTP 路由委托 resident handler，删 resident 前必须先
  把它们改调 Service/RecipeContext，否则断路由（详见 §Alembic 接口误用与连通性边界 D）；
- 删除 `Alembic/lib/resident/`（14 handler + 4 schema）：先做消费者扫描，发现真实
  消费者改调 Service/RecipeContext，不留兼容层（D2）；
- 确保 MCP 协议端点只在 Plugin；Alembic 知识 HTTP API 内部改调 RecipeContext，
  不再经 resident handler 重复实现。

### RIC-4 Alembic 知识/治理 HTTP API 边界（D1/D3 已定）

- 知识检索 HTTP（search/knowledge-get/recipes/panorama）保留作 daemon/Dashboard
  入口，内部改调 Core RecipeContext；证明不再经 resident 重复实现、Dashboard 不断。
- 治理 HTTP（guard/decision-register/evolution/intent-episodes）保留 Alembic HTTP
  暴露，实现下沉 Core 独立子模块（见 RIC-5）。

### RIC-5 Core 共享骨架 + 两条执行路线归位（D4 已定）

- guard / evolution / host-agent-workflows 的**确定性骨架**作为 `@alembic/core`
  独立导出子模块；
- **宿主 agent 路线**的冷启动/增量扫描/进化编排保留在 **Plugin**
  （`lib/runtime/mcp/host-agent-workflows/*`，含证据门），**不删、不下沉**；
- **AI provider 路线**的编排保留在 **Alembic**（`lib/workflows/ai-execution/*`）；
- 确认两仓只消费 Core 骨架接口、不各自重复实现骨架。

### RIC-6 验收（AlembicWorkspace）

- 两仓 Core 消费清单达标（检索类零直连）；MCP 仅 Plugin（lint 通过）；三仓 charter
  落地；resident 处置完成；HTTP 边界按决策落地；全仓 check 绿 + Wakeflow 验证。

## 非目标

- 不改四工具公共契约（那是 06-17 需求）；本需求只动职责归属与接口消费。
- 不删 Alembic daemon 的知识**写入/生产**路径（本地知识库持有者本职）。
- 不把项目管理职责挪进 Plugin（现状已正确）。
- 不在本需求引入新功能；只做职责清理与接口收敛。

## 用户已裁决（2026-06-17，D1-D4 全部按推荐采纳）

- **D1 = 保留 + 内部走 RecipeContext**：知识检索 HTTP API（search/knowledge-get/
  recipes/panorama）保留作 daemon/Dashboard 入口，内部检索逻辑收敛到 Core
  RecipeContext，不再经 resident handler 重复实现。
- **D2 = 删除 resident/**：`Alembic/lib/resident/`（14 handler + 4 schema）删除；
  Plugin 是 MCP 唯一承载者。删除前做消费者扫描，真实消费者改调 Service/
  RecipeContext，不以兼容层保留。
- **D3 = 留 Alembic HTTP + Core 子模块**：治理能力（guard/decision-register/
  evolution/intent-episodes）实现下沉 Core 独立子模块，Alembic 仅作 HTTP 暴露入口
  （Dashboard/治理消费）。
- **D4 = Core 共享骨架 + 两条执行路线各留本仓**（2026-06-17 修正）：
  host-agent-workflows / guard / evolution 的**确定性骨架**作为 `@alembic/core`
  独立导出子模块。但冷启动/增量扫描/进化有**两条不同执行路线**，各自编排留本仓、
  不下沉、不互相替代：**宿主 agent 路线 → 保留在 Plugin**（宿主 LLM 自己干，
  不启动 AI pipeline，`cold-start.ts` 注释明确），**AI provider 路线 → 保留在
  Alembic**（daemon + AlembicAgent provider，`ai-execution`）。Plugin 的
  `lib/runtime/mcp/host-agent-workflows/*` **不删**。

## AlembicPlugin 复制残留与嵌入式 daemon 清理（2026-06-17）

### 真实发现（纠正"死代码"误判）

AlembicPlugin 早期从 Alembic 复制删码建起，带来整套 daemon/HTTP 代码
（`lib/http/` 4246 行 + `lib/daemon/` + `lib/governance/` +
`lib/infrastructure/` 的 cache/monitoring/realtime/audit + `lib/service/` 的
search/vector/signal/bootstrap daemon 任务 + `lib/cli/KnowledgeSyncService` +
`lib/bootstrap.ts`）。

代码核验证明这**不是死代码**——它是 Plugin 的**嵌入式运行时 daemon**：
- `lib/daemon/DaemonSupervisor.ts:124-130`：MCP 进程 `spawn` 启动
  `dist/bin/daemon-server.js` 作为本地 daemon 子进程；
- `lib/runtime/runtime/EmbeddedRuntimeContract.ts:3,19`：daemon-server.js 被
  明确列为"嵌入式运行时保留的 daemon 入口"；
- MCP 工具经 `lib/service/resident/AlembicResidentServiceClient`（HTTP）连这个
  本地 daemon 做检索/job/dashboard，daemon 不可用时 degraded。

真实架构：Plugin 复制整套 Alembic daemon、复用为**嵌入式 daemon**，让 Plugin
**独立运行、不依赖用户是否装 Alembic**。直接删会让 Plugin 跑不起来。

### 用户决策（2026-06-17）

- **保留嵌入式 daemon，但瘦身 + 共享 Core 去重复**：Plugin 继续独立运行；与
  Alembic 重复的 daemon/HTTP/infra 实现收敛到共享 Core（消除双份复制），并砍掉
  宿主场景用不到的 HTTP 能力。
- **逐个验证 reachable 再删**：不照深扫清单盲删；每个可疑模块先查是否被 MCP 路径
  或嵌入式 daemon 真实消费，确认无消费（真死代码）才删。

### 三类处置（每条都需 reachable 验证）

| 类别 | 对象 | 动作 |
| --- | --- | --- |
| **共享 Core 去重复** | 与 Alembic 重复的 daemon/HTTP/基础设施实现（HttpServer 框架、DaemonJobRunner、infra 基建可共享部分） | 收敛到共享 Core，Plugin 嵌入式 daemon 与 Alembic daemon 共用 Core，不各自复制 |
| **瘦身删除** | 宿主 + 嵌入式 daemon **都用不到**的 HTTP 能力：dashboard/realtime(WebSocket)/audit/monitoring/cache/governance 中无消费者的；`lib/cli/KnowledgeSyncService`、`service/bootstrap` 纯 daemon 后台任务等 | 确认零消费后删除 |
| **保留** | 嵌入式 daemon 真实需要的检索/job/知识 HTTP 路由 + `DaemonSupervisor` + `daemon-server` 入口（EmbeddedRuntimeContract）+ 嵌入式 SQLite + MCP 核心 `lib/runtime` + 宿主路线 host-agent-workflows + resident client | 不动 |

注意：早期深扫给出的"删 ~6000 行"清单**不可直接用**——其中 lib/http/daemon/infra
大部分是嵌入式 daemon reachable 的。真正可删的是"宿主 + 嵌入式 daemon 都用不到"的
子集；每条都要双闭包验证（MCP 入口闭包 + DaemonSupervisor spawn 的 daemon 闭包，
两条都不消费才算死代码）。

### RIC-7 Plugin 复制残留清理（reachable 验证 + 嵌入式 daemon 瘦身）

排在 RIC-2（检索下沉）之后、RIC-6 验收之前。

- 建立两条 reachable 闭包：① MCP 入口（codex-mcp → McpServer）；② 嵌入式 daemon
  （DaemonSupervisor spawn 的 daemon-server → HttpServer）；
- 与 Alembic 重复的 daemon/HTTP/infra 实现收敛到共享 Core；
- 砍掉两条闭包都不消费的死代码 + 宿主用不到的 HTTP 能力（逐个验证）；
- 保证 Plugin 仍能独立运行（嵌入式 daemon 契约不破）+ MCP 双壳 parity；全仓 check 绿。

## 精确验证结论与瘦身边界（动静双查 2026-06-17）

逐个 reachable 验证（静态 + 动态 `await import()` 双查 + 两条闭包）后的精确结论：

**确认真死代码（删）**：
- `lib/cli/KnowledgeSyncService.ts` —— 本地副本无人 import，代码全用
  `@alembic/core/knowledge` 同名类（复制残留）。
- `lib/service/search/CrossEncoderReranker.ts` —— 无任何外部 import（孤岛）。

**纠正为保留**（早期深扫误标删）：
- `lib/service/vector/*`（含已存在的 `LocalEmbedding.ts`，与本地 Qwen 集成相关）——
  MCP reachable（`SetupService:763` 建嵌入式向量索引，SetupService 被 CodexMcpServer import）；
- `lib/workflows/*` —— 被 MCP host-agent handlers 大量 import（宿主路线工作流完成）；
- `lib/bootstrap.ts` —— McpServer 也 import，非 daemon-only。

**嵌入式 daemon 瘦身边界（用户裁决 2026-06-17：适中）**：
- 保留：检索 / job / 知识 HTTP 路由 + **Dashboard handoff** + 共享 Core 的 HttpServer 框架；
- 砍除（确认 reachable 后）：`infrastructure/realtime`(WebSocket) / `audit` / `monitoring` /
  `governance` 完整 gateway / `service/bootstrap/UiStartupTasks`；
- `HttpServer` 框架、`DaemonJobRunner`、infra 基建可共享部分收敛到 Core（去双份复制）。

**方法教训**：静态 grep 漏 `await import()`；reachable 判定须动静双查 + 两条闭包。

## Alembic 接口误用与连通性边界（2026-06-17）

### A. 绕过公共门面、直连 Core 内部（用户裁决：Core 补公共门面）

外层不再直连 Core 内部，由 Core 补稳定公共门面：
- `@alembic/core/core/enhancement` 内部初始化：`ServiceContainer.ts:2`、
  `KnowledgeModule.ts:11`、`resident/tool-handlers/guard.ts:879`、`http/routes/guard.ts:230`；
- `@alembic/core/core/discovery` / `core/ast`：
  `core-adapters/ProjectIntelligenceCompatibility.ts:18,30`；
- `@alembic/core/infrastructure/report`：`InfraModule.ts:13`、`SignalModule.ts:14`、
  `http/routes/signals.ts:11`。
→ Core 为 enhancement/report 等补公共门面；Alembic/Plugin 改走门面，HTTP 路由不直连
内部初始化。

### B. 遗留兼容层（用户裁决：现在删）

`lib/core-adapters/ProjectIntelligenceCompatibility.ts` 仅为旧测试/遗留适配 Core 内部
（core/ast、core/discovery）——确认旧测试/遗留代码已迁后，**本需求内直接删除**。

### C. 检索读写（呼应 D1）

HTTP routes（`routes/knowledge.ts:46/81/126`、`routes/search.ts:201/289`、
`routes/candidates.ts`）直连 `knowledgeService`/`searchEngine` 读取检索——HTTP 入口按
D1 保留、**内部改调 RecipeContext**（收敛对象）；写入/生产
（`resident/tool-handlers/knowledge.ts:128/133` create、bootstrap/rescan）是 daemon
本职，保留。

### D. resident 删除的连通性边界（D2/RIC-3 前置，关键）

核心 routes（search/knowledge/guard）独立调 Core Service，删 resident 不断
（`routes/search.ts:199`、`routes/knowledge.ts:43`、`routes/guard.ts:219`）。**但**以下三处
HTTP 路由委托 resident handler，删 resident 前必须先把它们改调 Service/RecipeContext：
- `routes/task.ts:14`（taskHandler）、`routes/skills.ts:14`（skill.js）、
  `routes/candidates.ts:46`（动态 import cold-start.js 的 bootstrap-refine）。
否则断这三个路由。RIC-3 须把这条列为删 resident 的前置步骤。

### E. KnowledgeSyncService 厘清（用户裁决：RIC-0 核实）

Core 导出 `@alembic/core/knowledge` 的 KnowledgeSyncService；Plugin 本地副本确认死代码
（删，见上）；Alembic 的 `lib/cli/KnowledgeSyncService` 据查职责为文件↔DB 同步、有
调用者——RIC-0 代码核实其与 Core 版职责是否真不同（不同则保留，同为残留则删）。

## 总控接收提示候选

```text
接收 Design 需求候选：Design/docs/current/alembic-plugin-core-responsibility-interface-cleanup-2026-06-17.md
目标：四工具+ProjectContext/RecipeContext 拆分后，梳理 Alembic/AlembicPlugin 接口与功能职责——
MCP 归一 Plugin、检索下沉 RecipeContext、Alembic 回归项目管理+API-AI Agent+知识库 daemon。
先做 RIC-0 只读盘点 + 收集决策 D1-D4，不直接派发；RIC-2 下沉项依赖 06-17 RecipeContext（GMAP-2）落地。
```
