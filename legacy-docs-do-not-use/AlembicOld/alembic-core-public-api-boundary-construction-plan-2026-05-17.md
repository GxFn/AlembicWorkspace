# AlembicCore 公开 API 与边界建设计划

日期：2026-05-17
状态：活文档，先建立边界方法和初始证据，后续按模块逐段补齐

## 1. 目标

这份文档解决一个比迁移本身更底层的问题：`@alembic/core` 应该向外承诺哪些公开 API，哪些只是当前迁移期暴露的内部实现，哪些能力必须留在外层仓库。

当前多仓库协作的主要痛点不是“仓库太多”，而是 Core 的公开边界还没有稳定下来。`Alembic` 和 `AlembicPlugin` 现在大量直接引用 Core 内部深路径，导致 Core 一改目录、类型或实现细节，外层仓库就必须立刻同步。

本计划的目标是渐进式完成三件事：

1. 从真实代码调用出发，建立 Core 的公开 API 分层。
2. 把外层仓库对 Core 的直接深路径依赖逐步收敛到稳定入口。
3. 让后续 Core 内部重构不再强制外层仓库同步，除非公开契约发生变更。

本文不是一次性定死所有 API。每个模块都必须经过真实扫描、调用链理解、边界情况补齐、测试锁定和外层接入验证后，才能标记为稳定公开 API。

## 2. 硬性规则

### 2.1 公开 API 不能从导出表反推

`package.json` 当前导出的路径很多，不能因为一个路径被导出就认为它是长期公开 API。公开 API 必须满足：

- 有真实外层调用方。
- 有清楚的输入输出契约。
- 有明确的行为边界和错误语义。
- 有 Core 自身测试覆盖。
- 有至少一个外层仓库接入验证。
- 后续内部重构时可以继续保持兼容。

### 2.2 不能用薄 facade 糊边界

禁止为了让外层少改 import，而在 Core 里新增没有真实闭包的薄文件、空壳 adapter 或简单转发层。允许 facade 的唯一条件是：

- 它封装的是一个稳定业务能力。
- 它隐藏了真实内部模块结构。
- 它有自己的契约测试。
- 它能减少外层对内部文件的认知。

### 2.3 公开入口必须少而稳定

最终目标不是暴露更多子路径，而是减少外层需要知道的 Core 内部结构。优先级如下：

1. 根入口或领域级入口，例如 `@alembic/core`、`@alembic/core/knowledge`。
2. 稳定能力入口，例如 `@alembic/core/search`、`@alembic/core/guard`。
3. 迁移期兼容入口，例如 `@alembic/core/internal/...`。
4. 禁止长期公开实现路径，例如 `@alembic/core/infrastructure/database/drizzle/schema`。

### 2.4 外层仓库必须保留宿主职责

Core 不接管以下内容：

- Codex MCP server、tool schema、tool policy、Codex Skill、marketplace/channel 发布。
- Alembic CLI、HTTP server、Dashboard server、browser/open、native/macOS、Lark/Feishu。
- Internal AgentRuntime、tool calling 编排、AI provider、API key、模型调用。
- Dashboard UI、前端状态、前端构建。
- 多渠道 delivery、IDE 写入、AGENTS/Skills 投递。

Core 可以提供 host-agent 知识挖掘闭环的确定性协议和持久化能力，但不运行宿主 Agent 本体。

### 2.5 删除和收敛必须可回滚

任何外层删除或 import 收敛都必须满足：

- 先有 Core 稳定入口。
- 再有外层 adapter 或调用方切换。
- 然后通过 build/test/smoke。
- 最后才删除旧实现。

没有对应 Core API 和验证结果的文件，不允许因为“看起来重复”就删除。

## 3. 当前真实扫描基线

### 3.1 Core 当前导出面过宽

本轮扫描 `AlembicCore/package.json` 得到：

| 项目 | 数量 |
| --- | ---: |
| exports 总数 | 120 |
| 通配导出 | 61 |
| 顶层导出 | `.`, `./*`, `./core`, `./daemon`, `./domain`, `./infrastructure`, `./repository`, `./service`, `./shared`, `./types`, `./workflows` |

初始判断：

- `./*` 和大量 `./xxx/*` 通配导出是迁移期兼容措施，不应直接视为长期公开 API。
- `infrastructure`、`repository`、`workflows/capabilities/...` 目前被外层大量引用，但大部分更像内部实现层。
- 后续要把 “当前能 import” 和 “长期公开承诺” 分开管理。

### 3.2 Alembic 对 Core 的当前依赖

扫描 `Alembic`，排除 `node_modules`、`dist` 和 `vendor` 后，发现 `@alembic/core` 引用约 979 次。

| 顶层路径 | 引用数 |
| --- | ---: |
| `infrastructure` | 251 |
| `service` | 249 |
| `shared` | 165 |
| `core` | 75 |
| `repository` | 70 |
| `workflows` | 67 |
| `domain` | 52 |
| `types` | 39 |
| `daemon` | 11 |

高频路径包括：

- `@alembic/core/infrastructure/logging/Logger`
- `@alembic/core/shared/resolveProjectRoot`
- `@alembic/core/infrastructure/io`
- `@alembic/core/infrastructure/signal/SignalBus`
- `@alembic/core/service/guard/GuardCheckEngine`
- `@alembic/core/shared/LanguageService`
- `@alembic/core/repository/knowledge/KnowledgeRepository.impl`
- `@alembic/core/infrastructure/database/drizzle`
- `@alembic/core/domain/knowledge/Lifecycle`
- `@alembic/core/types/project-snapshot`

初始判断：

- `Logger`、path/workspace、SignalBus、WriteZone 这类基础能力需要公开稳定入口，但不一定应该暴露实现文件路径。
- `KnowledgeRepository.impl`、Drizzle schema、migration 文件属于强内部实现，短期可能需要兼容，长期应由 repository factory 或 runtime container 隐藏。
- `service/guard`、`service/search`、`service/knowledge` 是真实业务能力，应优先设计稳定模块入口。

### 3.3 AlembicPlugin 对 Core 的当前依赖

扫描 `AlembicPlugin`，排除 `node_modules`、`dist` 和 `vendor` 后，发现 `@alembic/core` 引用约 916 次。

| 顶层路径 | 引用数 |
| --- | ---: |
| `service` | 232 |
| `infrastructure` | 214 |
| `shared` | 152 |
| `core` | 72 |
| `workflows` | 70 |
| `repository` | 62 |
| `domain` | 49 |
| `types` | 43 |
| `daemon` | 20 |
| `resources` | 2 |

高频路径包括：

- `@alembic/core/infrastructure/logging/Logger`
- `@alembic/core/shared/resolveProjectRoot`
- `@alembic/core/infrastructure/signal/SignalBus`
- `@alembic/core/infrastructure/io/WriteZone`
- `@alembic/core/service/guard/GuardCheckEngine`
- `@alembic/core/shared/LanguageService`
- `@alembic/core/types/project-snapshot`
- `@alembic/core/domain/knowledge/Lifecycle`
- `@alembic/core/daemon/JobStore`
- `@alembic/core/types/workflows`

初始判断：

- Plugin 和 Alembic 对 Core 的依赖形态高度相似，说明 Core 的真实共享边界存在。
- Plugin 额外依赖 `resources/grammars`，需要确认 grammar 自动安装、资源查找、打包复制属于 Core 资源契约还是 Plugin 发布适配。
- Plugin 不应该因为 Core API 暴露而拿到 Codex 以外的多渠道 delivery 能力。

### 3.4 Dashboard 与 Agent 仓库现状

`AlembicDashboard` 当前没有运行时依赖 Core。它通过 `/api/v1` 和 `/socket.io` 访问后端，Core 能力应停留在后端 API 之后。

`AlembicAgent` 当前只有 `AGENTS.md`，没有运行时代码依赖。后续如果接入 Core，应按 Agent/AI/tool 边界单独设计，不能反向把 AgentRuntime 放入 Core。

## 4. API 状态分级

每个 Core export 都要落入以下状态之一：

| 状态 | 含义 | 允许外层使用 | 变更规则 |
| --- | --- | --- | --- |
| Stable Public | 长期公开 API | 允许 | 需要兼容，破坏性变更必须有迁移期 |
| Provisional Public | 候选公开 API | 允许，但必须记录 | 允许调整，但要同步外层验证 |
| Transitional Internal | 迁移期内部兼容入口 | 临时允许 | 必须有收敛目标和删除计划 |
| Internal Only | Core 内部实现 | 不允许新增外层引用 | 外层旧引用要逐步迁走 |
| Forbidden | 不应进入 Core 或不应公开 | 不允许 | 命中即修正 |

状态不是按目录简单划分。比如 `infrastructure/io/WriteZone` 可能是 Stable Public，`infrastructure/database/drizzle/schema` 则应是 Transitional Internal 或 Internal Only。

## 5. 目标公开入口草案

这是初始草案，后续必须按真实扫描补齐。

| 目标入口 | 初始定位 | 可能包含 | 不应包含 |
| --- | --- | --- | --- |
| `@alembic/core` | 聚合根入口 | 最常用稳定类型、runtime factory、领域常量 | 所有内部类的 export star |
| `@alembic/core/workspace` | workspace/path/config 契约 | projectRoot/dataRoot、ProjectRegistry、WorkspaceResolver、folder names | CLI 文案、Codex 初始化文案 |
| `@alembic/core/io` | 写边界和文件安全 | WriteZone、PathGuard、safe write helpers | 外层 delivery 写入策略 |
| `@alembic/core/events` | 事件和信号契约 | EventBus、SignalBus、SignalTraceWriter | Socket.io、HTTP stream |
| `@alembic/core/database` | 数据库连接和 migration 契约 | DatabaseConnection、migrate、DrizzleDB 类型 | 直接公开所有 schema 表作为默认路径 |
| `@alembic/core/repositories` | repository factory 和稳定接口 | Knowledge、SourceRef、Job、Guard、CodeEntity repo interfaces | `*.impl` 作为外层默认入口 |
| `@alembic/core/knowledge` | Knowledge/Recipe 领域能力 | KnowledgeEntry、Lifecycle、Readiness、ProductionGateway、SourceRef | Dashboard view model |
| `@alembic/core/search` | 本地检索 | SearchEngine、ranker、tokenizer、hybrid retriever、types | AI reranker provider 实现 |
| `@alembic/core/vector` | 本地向量基础能力 | chunker、vector store、indexing pipeline、provider interface | embedding provider、API key |
| `@alembic/core/guard` | Guard 引擎 | GuardCheckEngine、ReverseGuard、reports、source collector | MCP tool schema、CLI 参数 |
| `@alembic/core/project-intelligence` | 项目理解 | discovery、language service、AST、call graph、panorama materialization | 宿主 agent 执行策略 |
| `@alembic/core/workflows` | host-agent workflow contract | cold start/rescan plan、briefing、session、checkpoint、report | Codex tool name、Skill 文案、internal AgentRuntime |
| `@alembic/core/daemon` | job 状态契约 | JobStore、DaemonState、job status/types | supervisor、端口选择、浏览器打开 |
| `@alembic/core/testing` | consumer contract test helpers | fixture、smoke import list、public API assertion | 产品测试替代品 |

## 6. 模块建设阶段

### Phase 0：基线盘点

状态：已开始。

目标：

- 记录 Core 当前 exports 数量和通配范围。
- 记录 Alembic/AlembicPlugin 对 Core 的真实引用分布。
- 明确 Dashboard 当前不直接依赖 Core。
- 建立 API 状态分级。

验收：

- 本文档完成初始基线。
- 后续扫描命令可以复跑。

### Phase 1：Package Export 收敛设计

目标：

- 给 `AlembicCore/package.json` 每个 export 标注状态。
- 找出所有 `./*` 和 `./xxx/*` 通配导出的消费者。
- 建立 `exports.allowlist.md` 或等价表格。
- 明确哪些入口只是迁移期兼容。

Core 任务：

- 新增 public API inventory 文档或脚本。
- 补一个 consumer smoke test，验证目标稳定入口可 import。
- 保留当前兼容导出，不急删。

外层任务：

- 暂不改大量 import。
- 只禁止新增未知深路径引用。

### Phase 2：基础设施 API 收口

范围：

- logging
- workspace/path/config
- IO/WriteZone/PathGuard
- EventBus/SignalBus/TimerRegistry
- DaemonState/JobStore

重点问题：

- `Logger` 当前引用很高，应该通过 `@alembic/core/logging` 或 `@alembic/core/runtime` 暴露，而不是要求外层知道 `infrastructure/logging/Logger`。
- `WriteZone` 与 `PathGuard` 是真正安全边界，必须稳定公开。
- `JobStore` 属于 daemon job 契约，但 supervisor 留外层。

验收：

- 每个能力都有稳定入口。
- 外层 adapter 可以只从稳定入口导入。
- 原深路径标记为 Transitional Internal。

### Phase 3：Domain 与 Knowledge API 收口

范围：

- dimension
- KnowledgeEntry
- Lifecycle
- FieldSpec
- Readiness
- SourceRef
- RecipeProductionGateway
- KnowledgeService 的稳定外观

重点问题：

- 领域类型可以稳定公开。
- `KnowledgeRepository.impl` 不应作为长期外层默认入口。
- KnowledgeService 不能携带 delivery callback 或 Dashboard view model。

验收：

- 有 `@alembic/core/knowledge`。
- 外层调用 candidate、readiness、lifecycle、source attribution 时不需要知道 repository impl 文件。
- delivery hook 明确由外层注入。

### Phase 4：Database 与 Repository 边界

范围：

- DatabaseConnection
- DrizzleDB 类型
- migrations
- repository interfaces
- repository factory

重点问题：

- 外层现在直接引用 Drizzle schema，耦合很重。
- Core 应提供 repository-level 查询和写入能力，减少外层直接拼 SQL。
- migrations 必须由 Core 拥有，但执行时机和 package root resolver 要考虑外层发布形态。

验收：

- 外层常见查询不再需要 schema 表。
- schema/migration 仍可迁移期兼容，但不作为新代码入口。
- 数据库初始化、迁移、仓储装配有独立 contract test。

### Phase 5：Search / Vector / Guard API 收口

范围：

- SearchEngine
- ranker/tokenizer/hybrid retriever
- vector store/indexing/chunker
- GuardCheckEngine/ReverseGuard/report

重点问题：

- Search 和 Guard 是 Core 核心能力，应该公开稳定入口。
- Vector 是 Core 的本地索引能力，但 embedding provider 和 AI reranker 不进入 Core。
- Guard 不暴露 MCP/CLI/tool schema。

验收：

- `@alembic/core/search`、`@alembic/core/vector`、`@alembic/core/guard` 可独立 smoke import。
- 外层只负责 provider 注入、transport wrapper、展示格式。
- 搜索、向量、Guard 的空数据、降级、provider 缺失情况都有测试。

### Phase 6：Project Intelligence 与 Grammar 资源边界

范围：

- discovery
- LanguageService
- AST/tree-sitter
- grammar resource lookup
- call graph
- panorama
- ProjectIntelligenceCapability

重点问题：

- 自动安装 grammar 和随包资源查找需要重新确认边界。初始判断是：Core 应拥有 grammar 资源契约和可用性检测；外层负责发布包复制、插件 channel 特定路径适配。
- AST 可用性失败必须降级，不应阻断整个 workflow。
- ProjectIntelligence 是 Core 闭环核心，但宿主 agent 执行不进入 Core。

验收：

- Core 能在自身测试中验证 grammar resource resolution。
- 外层发布包能复制 Core grammar 资源。
- discovery/AST/call graph 的公开入口不暴露内部 parser 文件作为主要 API。

### Phase 7：Host Agent Workflow Contract 收口

范围：

- cold start external workflow
- knowledge rescan external workflow
- mission briefing
- external session
- submission tracker
- checkpoint/report/snapshot

重点问题：

- Core 负责生成任务、证据、briefing、session、校验和持久化。
- Codex tool name、MCP envelope、Skill 文案、AgentRuntime、tool policy 留外层。
- workflow API 要表达“宿主 agent 该做什么”和“结果如何交回”，但不调用宿主 agent。

验收：

- `@alembic/core/workflows` 有稳定输入输出类型。
- Alembic 和 AlembicPlugin wrapper 可以共享同一 Core workflow contract。
- 完成 empty project、partial failure、resume、dimension skip、invalid submission 的测试。

### Phase 8：外层 Adapter 收口

范围：

- Alembic local adapter
- AlembicPlugin Codex adapter
- Dashboard API boundary
- AlembicAgent future adapter

重点问题：

- 外层要有自己的 Core 接入层，避免全仓库散落深路径 import。
- Dashboard 不直接 import Core。
- Agent 仓库如果未来接 Core，也必须只接稳定 API 和 host-agent contract。

验收：

- 外层仓库新增 Core import 必须过 lint rule。
- adapter 层之外禁止新增 Transitional Internal import。
- 两个外层仓库能锁定同一个 Core commit 或版本通过验证。

### Phase 9：CI 与长期治理

范围：

- Core public API smoke
- consumer fixture
- export inventory diff
- outer import boundary lint
- release notes

验收：

- Core CI 能检查稳定入口 import。
- Core CI 能发现 exports 面积异常扩大。
- Alembic/AlembicPlugin CI 能发现新增非法 Core 深路径。
- 每次 Core 破坏性 API 变更必须带迁移说明。

## 7. 每个模块补齐模板

后续每扫描一个模块，都按这个模板补入本文。

```text
模块：
当前状态：
真实调用方：
当前 import 路径：
建议稳定入口：
保留在 Core 的原因：
不进入 Core 的部分：
输入契约：
输出契约：
错误/降级语义：
持久化副作用：
资源/打包要求：
边界情况：
现有测试：
缺失测试：
外层接入任务：
删除或收敛计划：
API 状态：
```

## 8. 初始优先级

优先处理引用最高、影响最广、最容易成为稳定基础的能力：

1. logging/workspace/path/io/event 基础 API。
2. Knowledge domain 和 Lifecycle。
3. Guard/Search/Vector。
4. Database/Repository factory。
5. ProjectIntelligence 和 grammar resource。
6. Host-agent workflow contract。
7. package exports 收窄和深路径弃用。

理由：

- 基础 API 高频且低业务争议，适合先收口。
- Knowledge/Search/Guard 是产品核心链路，必须稳定。
- Repository/Database 风险高，需要更慢地做 facade 和外层替换。
- Workflow 涉及宿主 agent 边界，必须在前面模块稳定后再定公开契约。

## 9. 下一步执行清单

### 下一轮只做 Phase 1 起步

Core 窗口任务：

1. 生成 Core exports inventory。
2. 给每个 export 初步打状态：Stable / Provisional / Transitional / Internal / Forbidden。
3. 先不删除任何 export。
4. 补一组 public API smoke imports。
5. 在本文补齐 Phase 1 的实际表格。

Alembic / AlembicPlugin 窗口任务：

1. 暂停新增 `@alembic/core/...` 深路径 import。
2. 记录新增 Core 调用需求，先反馈给 Core 窗口定入口。
3. 不因为本文档直接大规模改 import。

Dashboard / Agent 窗口任务：

1. Dashboard 继续保持不直接依赖 Core。
2. Agent 仓库暂不接 Core runtime，等 host-agent contract 稳定后再设计。

## 10. Phase 1 执行记录

执行日期：2026-05-17

### 10.1 Core 已完成

本轮只建设边界清单和验证门禁，不删除任何 export，也不要求外层仓库立刻大规模改 import。

Core 新增：

- `docs/alembic-core-public-api-inventory-2026-05-17.md`
  - 记录当前 120 个 package exports 的阶段性状态。
  - 当前状态汇总：Stable Public 1，Provisional Public 55，Transitional Internal 64。
  - 明确所有 wildcard exports 都只是迁移期兼容面。
- `AlembicCore/test/support/public-api-inventory.ts`
  - 用代码表达当前 export 状态归类。
  - 新增 export 时必须归类，否则测试失败。
- `AlembicCore/test/PublicApiInventory.test.ts`
  - 校验每个 package export 都有状态。
  - 校验 wildcard export 不会被误标为公开稳定 API。
  - 锁定 Phase 1 状态汇总，避免 export 面积无感扩大。
- `AlembicCore/scripts/smoke-public-api.mjs`
  - build 后通过 Node package self-reference 导入每个 exact export。
  - 验证 `package.json` exports 与 `dist` 产物真实连通。
- `AlembicCore/package.json`
  - 新增 `npm run smoke:public-api`。
- `AlembicCore/.github/workflows/ci.yml`
  - 将原本手写的少量 entrypoint smoke 替换为完整 exact export smoke。

### 10.2 本阶段重要结论

- `@alembic/core` 当前只有根入口 `.` 被标为 Stable Public。
- 当前模块级 exact exports 先标为 Provisional Public，因为它们有真实消费者，但最终 facade、命名和契约仍要逐模块确认。
- 当前 wildcard exports 和少数内部性强的 exact exports 先标为 Transitional Internal，保留兼容但禁止作为新增依赖的默认入口。
- 本阶段不设置 Forbidden export；Forbidden 用来处理后续发现的错误边界，例如 tool system、Codex delivery、AI provider 被误导出。

### 10.3 Alembic 窗口任务

本阶段外层不做大规模替换，只做约束和反馈：

1. 不新增未知 `@alembic/core/...` 深路径 import。
2. 如果必须新增 Core 调用，先在任务报告中写明：
   - 需要的能力。
   - 当前想 import 的路径。
   - 是否可通过现有 Provisional Public exact module 入口完成。
   - 是否需要 Core 新增稳定 facade。
3. 继续保留当前既有 import，等待 Phase 2 开始按基础 API 模块收口。
4. 不删除任何外层文件来配合 Phase 1；Phase 1 只建立 Core 边界门禁。

### 10.4 AlembicPlugin 窗口任务

本阶段外层不做大规模替换，只做约束和反馈：

1. 不新增未知 `@alembic/core/...` 深路径 import。
2. 特别记录所有涉及 `resources/grammars`、Codex runtime packaging、plugin cache 的 Core 需求。
3. 如果新增 Core 调用，必须说明它是确定性 Core 能力，还是 Codex adapter / tool / delivery 逻辑。
4. 不因为 wildcard export 当前可用，就把 Codex tool、MCP schema、channel 发布逻辑接进 Core。

### 10.5 下一阶段入口

Phase 2 从基础设施 API 收口开始：

- logging
- workspace/path/config
- IO/WriteZone/PathGuard
- EventBus/SignalBus/TimerRegistry
- DaemonState/JobStore

Phase 2 的目标不是删除旧深路径，而是先新增稳定窄入口，并让外层窗口按小批次接入验证。

## 11. Phase 2 执行记录

执行日期：2026-05-17

### 11.1 Core 已完成

本轮完成基础能力的稳定窄入口建设，旧深路径全部保留，不做删除。

Core 新增稳定入口：

| 稳定入口 | 包含能力 | 说明 |
| --- | --- | --- |
| `@alembic/core/logging` | `Logger` | 替代新增代码继续依赖 `@alembic/core/infrastructure/logging/Logger`。 |
| `@alembic/core/workspace` | folder names、ProjectMarkers、ProjectRegistry、WorkspaceResolver、projectRoot/dataRoot helper | 只包含 workspace/path/registry/marker 契约，不导出 AI settings。 |
| `@alembic/core/io` | `WriteZone`、`Zone`、typed path、`pathGuard`、`PathGuardError` | 明确写边界和路径安全的公开入口。 |
| `@alembic/core/events` | `EventBus`、`SignalBus`、Signal 相关类型、`timerRegistry`、lifecycle interfaces | 明确事件、信号和定时器生命周期的公开入口。 |
| `@alembic/core/daemon` | `DaemonState`、`JobStore` | 现有 exact 入口提升为稳定 job/state contract；daemon supervisor 仍留外层。 |

Core 新增候选入口：

| 候选入口 | 包含能力 | 原因 |
| --- | --- | --- |
| `@alembic/core/config` | `ConfigLoader`、`ConfigDefaults`、`ConfigPaths`、`TriggerSymbol` | 当前有真实使用价值，但配置常量里仍混有 UI/product 影子，后续需要继续拆分后再决定是否稳定。 |

Core 新增/更新：

- `AlembicCore/src/logging.ts`
- `AlembicCore/src/workspace.ts`
- `AlembicCore/src/io.ts`
- `AlembicCore/src/events.ts`
- `AlembicCore/src/config.ts`
- `AlembicCore/test/PublicFoundationEntrypoints.test.ts`
- `docs/alembic-core-public-api-inventory-2026-05-17.md`
- `AlembicCore/test/support/public-api-inventory.ts`
- `AlembicCore/package.json`

Phase 2 export 状态汇总：

| 状态 | 数量 |
| --- | ---: |
| Stable Public | 6 |
| Provisional Public | 55 |
| Transitional Internal | 64 |
| Internal Only | 0 |
| Forbidden | 0 |

当前 package export 总数为 125，其中 wildcard export 仍为 61。所有 wildcard export 继续标记为 Transitional Internal。

### 11.2 本阶段边界判断

- `@alembic/core/workspace` 不导出 `WorkspaceSettingsStore`，因为该文件当前包含 AI env/key readiness 辅助逻辑；这部分不应在 Phase 2 直接承诺为稳定 workspace API。
- `@alembic/core/config` 先不标 Stable Public，因为 `Defaults.ts` 仍有 UI/product 常量，需要后续拆分 config contract。
- `@alembic/core/daemon` 只稳定 job/state/path contract，不包含 supervisor、端口选择、Dashboard 打开、进程生命周期、Codex wrapper。
- `@alembic/core/events` 只稳定本地 EventBus/SignalBus/timer lifecycle，不包含 HTTP stream、Socket.io、Dashboard realtime presenter。

### 11.3 Alembic 窗口任务

下一轮 Alembic 外层接入可以按小批次执行，不要一次扫全仓替换。

建议顺序：

1. logging 批次：
   - 新增或修改代码优先用 `@alembic/core/logging`。
   - 既有 `@alembic/core/infrastructure/logging/Logger` 可逐步替换。
   - 替换后运行 `npm run build:check`。
2. workspace/path 批次：
   - 优先把新增调用切到 `@alembic/core/workspace`。
   - 暂不替换 `WorkspaceSettingsStore` 相关 import，等待后续 AI/settings 边界判断。
3. io 批次：
   - `WriteZone`、`Zone`、`pathGuard` 新增调用走 `@alembic/core/io`。
4. events 批次：
   - `EventBus`、`SignalBus`、`timerRegistry` 新增调用走 `@alembic/core/events`。
5. daemon 批次：
   - `DaemonState`、`JobStore` 新增调用走 `@alembic/core/daemon`。

每个批次完成后记录：

- 替换文件清单。
- 替换前后的 import 路径。
- `npm run build:check` 结果。
- 是否发现 Core facade 缺失类型。

### 11.4 AlembicPlugin 窗口任务

下一轮 AlembicPlugin 外层接入同样小批次执行。

建议顺序：

1. logging：优先切 `Logger` 到 `@alembic/core/logging`。
2. io：优先切 `WriteZone`、`pathGuard` 到 `@alembic/core/io`。
3. events：优先切 `SignalBus`、`timerRegistry` 到 `@alembic/core/events`。
4. daemon：优先切 `JobStore`、`DaemonState` 到 `@alembic/core/daemon`。
5. workspace：只切 resolver、project registry、folder names，不切 AI settings。

特别注意：

- Codex MCP、tool schema、tool policy、plugin channel、runtime packaging 不因为 Phase 2 进入 Core。
- `resources/grammars` 不在 Phase 2 处理，继续等 Project Intelligence/Grammar 阶段单独设计。
- `@alembic/core/config` 暂时只作为候选入口使用；如果发现它携带 Codex/plugin 特定需求，要反馈给 Core 窗口拆分。

### 11.5 下一阶段入口

Phase 3 开始处理 Domain 与 Knowledge API 收口：

- dimension
- KnowledgeEntry
- Lifecycle
- FieldSpec
- readiness
- SourceRef
- RecipeProductionGateway
- KnowledgeService 的稳定外观

Phase 3 的重点是避免外层继续以 `KnowledgeRepository.impl`、Drizzle schema 或内部 service 文件作为默认集成点。

## 12. Phase 3 执行记录

执行日期：2026-05-17

### 12.1 Core 已完成

本轮完成 Domain / Knowledge 的稳定 facade 建设，旧 `domain/...`、`service/...`、`repository/...` 深路径全部保留，不做删除。

Core 新增稳定入口：

| 稳定入口 | 包含能力 | 说明 |
| --- | --- | --- |
| `@alembic/core/dimensions` | 维度 ID、维度 registry、tier plan、SOP、dimension tag、recipe dimension resolver、storage bucket | 替代新增代码继续依赖 `@alembic/core/domain/dimension`。 |
| `@alembic/core/knowledge` | `KnowledgeEntry`、Lifecycle、FieldSpec、readiness、UnifiedValidator、value objects、SourceRef 数据契约、RecipeProductionGateway、KnowledgeService | 替代新增代码继续依赖 `@alembic/core/domain/knowledge/*` 或 `@alembic/core/service/knowledge/*`。 |

Core 新增/更新：

- `AlembicCore/src/dimensions.ts`
- `AlembicCore/src/knowledge.ts`
- `AlembicCore/test/PublicKnowledgeEntrypoints.test.ts`
- `AlembicCore/test/PublicApiInventory.test.ts`
- `AlembicCore/test/support/public-api-inventory.ts`
- `AlembicCore/package.json`
- `docs/alembic-core-public-api-inventory-2026-05-17.md`

Phase 3 export 状态汇总：

| 状态 | 数量 |
| --- | ---: |
| Stable Public | 8 |
| Provisional Public | 53 |
| Transitional Internal | 66 |
| Internal Only | 0 |
| Forbidden | 0 |

当前 package export 总数为 127，其中 wildcard export 仍为 61。

### 12.2 本阶段边界判断

- `@alembic/core/knowledge` 不导出 `KnowledgeRepositoryImpl`。具体 repository 实现仍通过旧路径兼容，等待 Database/Repository 阶段设计 factory 或 runtime container。
- `@alembic/core/knowledge` 导出 `RecipeSourceRefEntity` 和 `RecipeSourceRefInsert` 这类数据契约，但不把 `RecipeSourceRefRepositoryImpl` 作为稳定入口。
- `FieldSpec` 中旧的 Cursor 兼容 alias 不作为 stable facade 主出口；stable facade 优先暴露 `getAgentAdapterFieldSpec`。
- `@alembic/core/dimensions` 是 dimension 公开入口；`@alembic/core/domain/dimension` 已标记为 Transitional Internal，保留迁移期兼容。
- `@alembic/core/domain/knowledge` 已标记为 Transitional Internal；新增外层代码应使用 `@alembic/core/knowledge`。

### 12.3 Alembic 窗口任务

下一轮 Alembic 外层接入按小批次执行，不能直接删除旧 knowledge/repository 文件。

建议顺序：

1. dimension 批次：
   - 新增或修改代码优先用 `@alembic/core/dimensions`。
   - 逐步替换 `@alembic/core/domain/dimension` 和 `@alembic/core/domain/dimension/RecipeDimension`。
   - 替换后运行 `npm run build:check`。
2. knowledge domain 批次：
   - `KnowledgeEntry`、Lifecycle、FieldSpec、readiness、UnifiedValidator 新增调用走 `@alembic/core/knowledge`。
   - 不新增 `@alembic/core/domain/knowledge/*` 深路径。
3. production gateway 批次：
   - `RecipeProductionGateway` 新增调用走 `@alembic/core/knowledge`。
   - 如果发现需要额外 gateway 类型，反馈 Core 窗口补 stable facade。
4. SourceRef 数据契约批次：
   - 只替换类型契约到 `@alembic/core/knowledge`。
   - 暂不替换 `RecipeSourceRefRepositoryImpl`，等待 Repository 阶段。
5. KnowledgeService 批次：
   - 新增调用可以走 `@alembic/core/knowledge`。
   - 不因为该入口稳定就删除外层 DI wiring、delivery hook 或 transport wrapper。

每个批次记录：

- 替换文件清单。
- 替换前后的 import 路径。
- `npm run build:check` 结果。
- 是否发现 Core stable facade 缺失类型。

### 12.4 AlembicPlugin 窗口任务

下一轮 AlembicPlugin 外层接入也按小批次执行。

建议顺序：

1. dimension 批次：
   - 新增或修改代码优先用 `@alembic/core/dimensions`。
   - 不再新增 `@alembic/core/domain/dimension/*`。
2. knowledge domain 批次：
   - `KnowledgeEntry`、Lifecycle、FieldSpec、readiness、UnifiedValidator 新增调用走 `@alembic/core/knowledge`。
3. candidate / submit 批次：
   - `RecipeProductionGateway` 新增调用走 `@alembic/core/knowledge`。
   - Codex tool schema、MCP envelope、tool result 文案仍留 Plugin。
4. SourceRef 数据契约批次：
   - 类型契约可切到 `@alembic/core/knowledge`。
   - repository impl 暂不切。

特别注意：

- `@alembic/core/knowledge` 是知识领域和生产入口，不是 Codex MCP tool facade。
- Plugin 仍保留 Codex tool、preflight、policy、channel、runtime packaging。
- 任何需要 `KnowledgeRepositoryImpl` 或 Drizzle schema 的改动，先反馈给 Core，等 Database/Repository 阶段处理。

### 12.5 下一阶段入口

Phase 4 开始处理 Database 与 Repository 边界：

- DatabaseConnection
- DrizzleDB 类型
- migrations
- repository interfaces
- repository factory/runtime container

Phase 4 的目标是减少外层直接依赖 Drizzle schema 和 `*.impl`，但不提前删除兼容导出。

## 13. Phase 4 执行记录

执行日期：2026-05-17

### 13.1 Core 已完成

本轮完成 Database / Repository 的稳定边界起步，目标是让外层不再把 Drizzle schema、migration 文件、`RepositoryImpl` 构造细节当成默认集成点。

Core 新增稳定入口：

| 稳定入口 | 包含能力 | 说明 |
| --- | --- | --- |
| `@alembic/core/database` | `DatabaseConnection`、SQLite 类型、`DrizzleDB` 类型、`createDatabaseConnection`、`openAlembicDatabase`、database handle 断言 | 外层初始化数据库和运行 Core migrations 的默认入口。 |
| `@alembic/core/repositories` | `createAlembicRepositories`、repository key 清单、Core-owned repository 类型别名和实体/input 类型 | 外层 DI 容器可以从一个稳定 factory 装配 Core repository，不需要逐个 `new RepositoryImpl(drizzle)`。 |

Core 新增/更新：

- `AlembicCore/src/database.ts`
- `AlembicCore/src/repositories.ts`
- `AlembicCore/test/PublicDatabaseRepositoryEntrypoints.test.ts`
- `AlembicCore/test/PublicApiInventory.test.ts`
- `AlembicCore/test/support/public-api-inventory.ts`
- `AlembicCore/package.json`
- `docs/alembic-core-public-api-inventory-2026-05-17.md`

Phase 4 export 状态汇总：

| 状态 | 数量 |
| --- | ---: |
| Stable Public | 10 |
| Provisional Public | 40 |
| Transitional Internal | 79 |
| Internal Only | 0 |
| Forbidden | 0 |

当前 package export 总数为 129，其中 wildcard export 仍为 61。

### 13.2 本阶段边界判断

- `@alembic/core/database` 是数据库连接和迁移闭环入口；`@alembic/core/infrastructure/database`、`@alembic/core/infrastructure/database/drizzle`、`@alembic/core/infrastructure/database/migrations/*` 继续保留迁移期兼容，但新增外层代码不应再依赖它们。
- `@alembic/core/repositories` 提供 Core-owned repository factory，而不是把所有 `RepositoryImpl` 类作为稳定构造 API 暴露。
- `createAlembicRepositories(database)` 当前装配：`knowledgeRepository`、`knowledgeEdgeRepository`、`codeEntityRepository`、`bootstrapRepository`、`guardViolationRepository`、`sessionRepository`、`proposalRepository`、`warningRepository`、`lifecycleEventRepository`、`recipeSourceRefRepository`。
- `memoryRepository` 暂不进入稳定 factory。当前实现注释和用途仍偏 Agent semantic memory，需要等 Agent/AI memory 所有权明确。
- `tokenUsageStore` 暂不进入稳定 factory。Token 统计属于 AI/provider telemetry，Core 不应在本阶段把它承诺为稳定公开 API。
- `repository/search`、`repository/sync` 暂不进入稳定 factory，等待 Phase 5 Search/Vector/Guard 边界统一处理。
- Drizzle schema 表不作为稳定公开入口。外层如果发现必须直接访问 `knowledgeEntries`、`recipeSourceRefs`、`auditLogs`、`remoteCommands` 这类表，先记录具体查询需求，反馈 Core 补 repository method 或确认外层所有权。

### 13.3 Alembic 窗口任务

下一轮 Alembic 外层接入按小批次执行，不能直接删除旧 repository 文件或 schema import。

建议顺序：

1. database 初始化批次：
   - 将新增代码里的 `@alembic/core/infrastructure/database/DatabaseConnection` 改为 `@alembic/core/database`。
   - `Bootstrap.initializeDatabase()` 可先保持原工作流，只替换 import 和类型来源。
   - 替换后运行 `npm run build:check`。
2. InfraModule repository factory 批次：
   - 在 `lib/injection/modules/InfraModule.ts` 中优先评估用 `createAlembicRepositories(ct.get('database'))` 一次性创建 Core repository。
   - 保持外层自己的 `AuditRepositoryImpl`、`RemoteCommandRepository` 不变，因为它们仍属于外层 audit/remote delivery 边界。
   - 不把 `memoryRepository`、`tokenUsageStore` 一起塞进 Core factory。
3. ServiceMap 类型批次：
   - 将 Core repository 类型来源改成 `@alembic/core/repositories` 的稳定类型别名。
   - 不再从 `@alembic/core/repository/*/*` 深路径新增 type import。
4. Knowledge / Guard / Panorama 模块批次：
   - 仅替换 repository 类型和 DI 获取处的类型来源。
   - 业务逻辑不改，避免把 Phase 4 做成行为重构。
5. Drizzle schema 直接引用盘点：
   - `AuditStore`、`AuditRepository`、`RemoteCommandRepository`、`MemoryStore` 里仍有 schema 直连。
   - 对每个直连点记录：表名、查询/写入意图、是否属于 Core-owned 持久化。
   - 属于 Core-owned 的需求反馈 Core 补 repository method；属于外层 delivery/audit/remote 的继续留外层，暂不删。

每个批次记录：

- 替换文件清单。
- 替换前后的 import 路径。
- `npm run build:check` 结果。
- 是否发现 `@alembic/core/repositories` 缺少 repository method 或类型。

### 13.4 AlembicPlugin 窗口任务

AlembicPlugin 执行相同接入策略，但必须保留 Codex/plugin/channel 边界。

建议顺序：

1. database 初始化批次：
   - 新增或修改代码从 `@alembic/core/database` 引入 `DatabaseConnection`、`DrizzleDB`、database runtime 类型。
2. InfraModule repository factory 批次：
   - 评估用 `createAlembicRepositories(ct.get('database'))` 替代逐个导入 Core repository impl。
   - 保留 Plugin 自己的 Codex/tool/channel 注册逻辑。
3. ServiceMap 类型批次：
   - Core repository 类型来源改为 `@alembic/core/repositories`。
4. Drizzle 测试批次：
   - `DrizzleORM.test`、`ProposalRepository.test`、`ConsolidatedProposal.test` 这类测试可先保留 deep migration import，因为它们是在覆盖迁移期兼容。
   - 新增测试优先使用 `openAlembicDatabase` 和 `createAlembicRepositories`。
5. 文件变更/SourceRef 批次：
   - `FileChangeHandler`、rescan handler 的 repository 类型改走 `@alembic/core/repositories`。
   - 不把 Codex MCP handler、tool schema、result envelope 移入 Core。

特别注意：

- Plugin 不能因为 `@alembic/core/repositories` 稳定，就把 Codex tool、channel delivery、AI provider、API key 管理迁入 Core。
- `memoryRepository` 和 `tokenUsageStore` 不属于 Phase 4 稳定 factory，相关接入等后续 Agent/AI telemetry 边界讨论。
- 任何仍必须直接使用 schema 的位置，都先写清楚表级需求，不做静默保留。

### 13.5 下一阶段入口

Phase 5 开始处理 Search / Vector / Guard API 收口：

- `@alembic/core/search`
- `@alembic/core/vector`
- `@alembic/core/guard`
- SearchEngine、ranker/tokenizer/hybrid retriever 的公开边界
- Vector store/index/chunker 的本地能力边界
- GuardCheckEngine/ReverseGuard/report 的稳定入口

Phase 5 的硬边界：

- embedding provider、AI reranker、API key 不进入 Core 稳定 API。
- MCP/CLI/tool schema 不进入 Guard 稳定 API。
- 外层负责 provider 注入、transport wrapper、展示格式。

## 14. Phase 5 执行记录

执行日期：2026-05-17

### 14.1 Core 已完成

本轮完成 Search / Vector / Guard 的稳定边界入口。旧 `service/*` 和 `infrastructure/vector` 路径继续保留迁移期兼容，但新增外层代码不应再把它们当成默认依赖面。

Core 新增稳定入口：

| 稳定入口 | 包含能力 | 说明 |
| --- | --- | --- |
| `@alembic/core/search` | `SearchEngine`、`FieldWeightedScorer`、`BM25Scorer`、`CoarseRanker`、`MultiSignalRanker`、`HybridRetriever`、`tokenize`、Search types、Search repo adapters | 稳定的是本地检索、排序、RRF 融合和仓储适配契约；AI reranker/provider 实现、API key、模型策略留外层。 |
| `@alembic/core/vector` | `VectorService`、`VectorStore`、`JsonVectorAdapter`、`HnswVectorAdapter`、`HnswIndex`、chunker、AST chunker、indexing pipeline、persistence、provider injection types | 稳定的是本地向量索引、分块、持久化和 provider 注入契约；不实现 embedding provider，也不处理 API key。 |
| `@alembic/core/guard` | `GuardCheckEngine`、`ReverseGuard`、`ComplianceReporter`、`CoverageAnalyzer`、`RuleLearner`、`ViolationsStore`、`SourceFileCollector`、Guard pattern/code/cross-file checks | 稳定的是规则检查、跨文件检查、报告和闭环判断；MCP tool schema、CLI 参数、Codex result envelope 留外层。 |

Core 新增/更新：

- `AlembicCore/src/search.ts`
- `AlembicCore/src/vector.ts`
- `AlembicCore/src/guard.ts`
- `AlembicCore/test/PublicSearchVectorGuardEntrypoints.test.ts`
- `AlembicCore/test/PublicApiInventory.test.ts`
- `AlembicCore/test/support/public-api-inventory.ts`
- `AlembicCore/package.json`
- `docs/alembic-core-public-api-inventory-2026-05-17.md`

Phase 5 export 状态汇总：

| 状态 | 数量 |
| --- | ---: |
| Stable Public | 13 |
| Provisional Public | 36 |
| Transitional Internal | 83 |
| Internal Only | 0 |
| Forbidden | 0 |

当前 package export 总数为 132，其中 wildcard export 仍为 61。`npm run smoke:public-api` 已验证 71 个 exact public API entrypoints 可通过 package self-reference 导入。

### 14.2 本阶段边界判断

- `SearchAiProvider`、`SearchCrossEncoder`、`EmbedProvider` 这类类型只是宿主注入契约，不代表 Core 提供 AI provider、模型调用或密钥管理。
- `BatchEmbedder` 和 `IndexingPipeline` 只处理“给定 provider 后如何批量执行和写入本地索引”的确定性链路，不负责选择 provider。
- `GuardCheckEngine` 可以进入 Core，因为规则检查、跨文件检查、uncertainty report 和 ReverseGuard 是确定性能力；Codex tool、MCP handler、CLI output、Dashboard presenter 不进入 Core。
- `repository/search` 进入 `@alembic/core/search` 的迁移替代方向，但旧 exact export 暂时保留为 Transitional Internal，避免外层窗口在同一阶段被迫同步大范围改动。
- `infrastructure/vector` 进入 `@alembic/core/vector` 的迁移替代方向；后续新代码不应再从 infrastructure 深路径新增 import。
- 本阶段不删除任何旧 deep path，不重写外层业务逻辑，不改变搜索/向量/Guard 行为。

### 14.3 Core 验证结果

已通过：

- `npm run build:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run smoke:public-api`
- `npm_config_cache=/private/tmp/alembic-core-npm-cache npm pack --dry-run`

测试说明：

- Vitest 输出中仍有既有 stderr：`error: Could not access 'HEAD'`。
- 该 stderr 未导致失败，当前结果为 57 个测试文件、915 个测试通过。

### 14.4 Alembic 窗口任务

下一轮 Alembic 外层接入按小批次执行，只替换 import 和 adapter 接入点，不做行为优化。

建议顺序：

1. Search 批次：
   - 将新增或正在修改的 `@alembic/core/service/search/*` import 改为 `@alembic/core/search`。
   - 优先替换 `SearchEngine`、`SearchTypes`、`HybridRetriever`、`CoarseRanker`、`MultiSignalRanker`、`FieldWeightedScorer`、`tokenizer`、`contextBoost`。
   - 替换后运行 `npm run build:check`。
2. Guard 批次：
   - 将新增或正在修改的 `@alembic/core/service/guard/*` import 改为 `@alembic/core/guard`。
   - 优先替换 `GuardCheckEngine`、`ComplianceReporter`、`CoverageAnalyzer`、`ExclusionManager`、`GuardFeedbackLoop`、`GuardService`、`ReverseGuard`、`RuleLearner`、`SourceFileCollector`、`UncertaintyCollector`、`ViolationsStore`。
   - 不把 CLI 参数、MCP tool schema、result formatter 迁入 Core。
3. Vector 批次：
   - 将新增或正在修改的 `@alembic/core/service/vector/*` 和 `@alembic/core/infrastructure/vector/*` import 改为 `@alembic/core/vector`。
   - 优先替换 `VectorService`、`SyncCoordinator`、`JsonVectorAdapter`、`HnswVectorAdapter`、`IndexingPipeline`、`VectorStore`、`chunk`、`HnswIndex`。
   - provider 创建、API key 读取、模型选择、重试限流仍保留外层。
4. Adapter 记录：
   - 记录每个批次替换文件清单。
   - 记录是否仍有某个 deep path 无法通过稳定入口替代。
   - 如果发现稳定入口缺类型或 helper，反馈 Core 窗口补入口，不在外层绕回 wildcard。

禁止事项：

- 不新增 `@alembic/core/service/search/*`、`@alembic/core/service/vector/*`、`@alembic/core/service/guard/*`、`@alembic/core/infrastructure/vector/*` import。
- 不删除旧外层文件来“配合”本阶段；先替换、验证、记录，再进入后续删除计划。

### 14.5 AlembicPlugin 窗口任务

AlembicPlugin 执行同样的 import 收口，但要额外守住 Codex 插件边界。

建议顺序：

1. Search handler 批次：
   - Core 搜索对象和类型从 `@alembic/core/search` 导入。
   - Codex tool handler、tool schema、response envelope 留在 Plugin。
2. Guard tool 批次：
   - Guard engine/report 类型从 `@alembic/core/guard` 导入。
   - Codex MCP tool definition、policy、preflight、human-readable result formatting 留在 Plugin。
3. Vector/sync 批次：
   - 本地 vector store、chunker、indexing pipeline 从 `@alembic/core/vector` 导入。
   - embedding provider 装配、API key 读取、workspace settings readiness 留在 Plugin。
4. 测试批次：
   - 新增测试优先从稳定入口导入。
   - 既有 deep path 测试可作为迁移期兼容测试保留，但不能成为新代码模板。

特别注意：

- Plugin 不能把 Codex tool、Skill、marketplace/channel 发布、daemon bridge、API key readiness、provider 实现迁入 Core。
- 如果某个 Plugin 文件必须继续 deep import，必须写清楚原因：是缺稳定入口、是兼容测试、还是 Plugin 自己越界依赖了 Core 内部实现。

### 14.6 下一阶段入口

Phase 6 开始处理 Project Intelligence 与 Grammar 资源边界：

- discovery、LanguageService、AST/tree-sitter、call graph、panorama。
- Core 应拥有 grammar 资源契约、资源查找和可用性检测。
- 外层负责 package/channel 特定的资源复制、插件缓存路径、发布渠道包装。
- AST/grammar 不可用必须降级，不应阻断完整 host-agent knowledge mining workflow。
- ProjectIntelligence 属于 Core 闭环能力，但宿主 agent 执行策略、Codex prompt/tool 名称不进入 Core。

## 15. Phase 6 执行记录

执行日期：2026-05-17

### 15.1 Core 已完成

本轮完成 Project Intelligence 与 Grammar 资源的稳定边界入口。目标是把外层对 `core/analysis`、`core/ast`、`core/discovery`、`service/panorama`、`workflows/capabilities/project-intelligence`、`shared/LanguageService`、`types/project-snapshot*` 的散落依赖，收敛到一个“项目理解链路”入口。

Core 新增稳定入口：

| 稳定入口 | 包含能力 | 说明 |
| --- | --- | --- |
| `@alembic/core/project-intelligence` | `LanguageService`、grammar resource lookup、`ensureProjectGrammarResources`、AST plugin load/reload、`analyzeSourceFile`、`ProjectGraph`、discoverer registry、config parsers、call graph analyzer、panorama services/types、`ProjectIntelligenceCapability`、`collectProjectAnalysis`、typed `ProjectSnapshot` builder/types | 稳定的是确定性的项目理解、资源检测、语法分析、结构扫描、全景分析和快照契约；宿主 agent 执行策略、Codex prompt/tool 名称、MCP envelope、插件发布资源复制留外层。 |

Core 新增/更新：

- `AlembicCore/src/project-intelligence.ts`
- `AlembicCore/test/PublicProjectIntelligenceEntrypoints.test.ts`
- `AlembicCore/test/PublicApiInventory.test.ts`
- `AlembicCore/test/support/public-api-inventory.ts`
- `AlembicCore/package.json`
- `docs/alembic-core-public-api-inventory-2026-05-17.md`

Phase 6 export 状态汇总：

| 状态 | 数量 |
| --- | ---: |
| Stable Public | 14 |
| Provisional Public | 30 |
| Transitional Internal | 89 |
| Internal Only | 0 |
| Forbidden | 0 |

当前 package export 总数为 133，其中 wildcard export 仍为 61。`npm run smoke:public-api` 已验证 72 个 exact public API entrypoints 可通过 package self-reference 导入。

### 15.2 本阶段边界判断

- `@alembic/core/project-intelligence` 是项目理解闭环入口，不是 AgentRuntime。
- Core 拥有 grammar 资源名、资源目录解析、可用性检查、reload 触发和 AST 降级语义。
- 外层拥有 package/channel 特定资源复制，例如插件缓存目录、marketplace 包装、Codex 插件发布产物整理。
- AST/tree-sitter 不可用时，Core API 必须允许降级或返回不可用结果，不能阻断整个 host-agent knowledge mining workflow。
- `ProjectIntelligenceCapability` 和 `collectProjectAnalysis` 属于 Core，因为它们产出确定性扫描结果、证据、物化和快照；但“由哪个宿主 agent 执行、怎么提示、怎么调用 tool、怎么交付结果”仍留外层。
- `./core`、`./core/analysis`、`./core/ast`、`./core/discovery`、`./service/panorama`、`./workflows/capabilities/project-intelligence` 进入 `@alembic/core/project-intelligence` 的迁移替代方向。
- `./types` 仍保持 Provisional Public，因为它包含多类 wire/workflow/evolution 类型；但 ProjectSnapshot 相关新用法应从 `@alembic/core/project-intelligence` 获取。

### 15.3 Core 验证结果

已通过：

- `npm run build:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run smoke:public-api`
- `npm_config_cache=/private/tmp/alembic-core-npm-cache npm pack --dry-run`

测试说明：

- Vitest 输出中仍有既有 stderr：`error: Could not access 'HEAD'`。
- 该 stderr 未导致失败，当前结果为 58 个测试文件、918 个测试通过。

### 15.4 Alembic 窗口任务

下一轮 Alembic 外层接入按小批次执行，只替换 import 来源和 adapter 集成点，不改扫描行为。

建议顺序：

1. LanguageService 批次：
   - 将新增或正在修改的 `@alembic/core/shared/LanguageService` import 改为 `@alembic/core/project-intelligence`。
   - 覆盖 `WikiGenerator`、`WikiRenderers`、`WikiUtils`、`ModuleService`、`AiProvider`、`ServiceMap` 这类语言检测调用点。
   - 替换后运行 `npm run build:check`。
2. discovery/config parser 批次：
   - 将 `@alembic/core/core/discovery`、`@alembic/core/core/discovery/*`、`@alembic/core/core/discovery/parsers/*` 改为 `@alembic/core/project-intelligence`。
   - 优先替换 `getDiscovererRegistry`、`ProjectDiscoverer` 类型、`DiscovererPreference`、`CustomConfigDiscoverer`、`ConfigWatcher`、CMake/Gradle/JSON/Ruby/Starlark/YAML parser。
   - 如果测试仍要覆盖某个 deep parser 文件，可临时保留为兼容测试，但新增产品代码必须走稳定入口。
3. AST/call graph 批次：
   - 将 `@alembic/core/core/ast`、`@alembic/core/core/ast/ProjectGraph`、`@alembic/core/core/analysis/*` 改为 `@alembic/core/project-intelligence`。
   - 对原来直接 import `lang-go`、`lang-java`、`lang-kotlin`、`lang-rust`、`lang-swift`、`lang-dart` 的测试，改为通过 `loadProjectAstPlugins`、`analyzeSourceFile`、`CallGraphAnalyzer` 验证公开行为。
   - 不新增对单语言 AST 插件文件的产品依赖。
4. panorama 批次：
   - 将 `@alembic/core/service/panorama/*` 改为 `@alembic/core/project-intelligence`。
   - 优先替换 `CouplingAnalyzer`、`LayerInferrer`、`ModuleDiscoverer`、`PanoramaAggregator`、`PanoramaScanner`、`PanoramaService`、`RoleRefiner`、`PanoramaTypes`、`profileTechStack`。
5. workflow/snapshot 批次：
   - 将 `@alembic/core/workflows/capabilities/project-intelligence/*` 改为 `@alembic/core/project-intelligence`。
   - 将 ProjectSnapshot/DimensionDef/buildProjectSnapshot 的新增用法改为 `@alembic/core/project-intelligence`。
   - Internal/External cold start 和 rescan wrapper 仍保留外层 host-agent 编排和交付逻辑。

禁止事项：

- 不新增 `@alembic/core/core/analysis/*`、`@alembic/core/core/ast/*`、`@alembic/core/core/discovery/*`、`@alembic/core/service/panorama/*`、`@alembic/core/workflows/capabilities/project-intelligence/*` import。
- 不把宿主 agent prompt、工具名、CLI/MCP envelope、Dashboard presenter、插件资源复制策略移入 Core。
- 不因为 `@alembic/core/project-intelligence` 暴露 grammar resource lookup，就把外层发布包复制逻辑删除；先改 import，再验证发布包里资源仍存在。

### 15.5 AlembicPlugin 窗口任务

AlembicPlugin 执行相同 import 收口，但要额外守住 Codex 插件和资源发布边界。

建议顺序：

1. Plugin module/service 批次：
   - `lib/service/module/ModuleService.ts`、`lib/injection/modules/KnowledgeModule.ts`、`lib/injection/modules/PanoramaModule.ts`、`lib/injection/ServiceMap.ts` 里的 project intelligence import 改为 `@alembic/core/project-intelligence`。
2. Wiki/AI helper 批次：
   - `WikiGenerator`、`WikiRenderers`、`WikiUtils`、`AiProvider` 里的 `LanguageService` 改为稳定入口。
   - AI provider 本身仍留 Plugin，不进入 Core。
3. AST/call graph 测试批次：
   - 现有 deep AST language module tests 改为通过稳定入口验证行为。
   - 如果保留 deep imports，只能标注为迁移期兼容测试，不能作为产品代码模板。
4. Workflow handler 批次：
   - rescan/cold-start handler 中的 `ProjectIntelligenceCapability`、`FileDiffSnapshotStore`、`evaluateProjectAnalysisIncrementalPlan` 等从稳定入口导入。
   - MCP handler、tool schema、Codex result envelope、preflight 留在 Plugin。
5. Grammar resource packaging 批次：
   - 使用 `listCoreGrammarResources` 或 `resolveCoreGrammarResourcesDir` 验证 Core 包内资源可用。
   - 插件发布产物中是否复制 `resources/grammars` 仍由 Plugin 发布脚本负责。
   - 不能删除 Plugin 的 channel/package 适配逻辑，除非已有独立发布验证。

特别注意：

- Plugin 不能把 Codex Skill、MCP tool、marketplace/channel、daemon bridge、API key readiness、provider 实现迁入 Core。
- Project Intelligence 可以进入 Core，是因为它产出确定性扫描结果；调用这个能力的宿主 agent 仍由 Plugin/Codex 外层负责。

### 15.6 下一阶段入口

Phase 7 开始处理 Host Agent Workflow Contract 边界：

- cold start / knowledge rescan 的 briefing、session、checkpoint、report、submission tracker。
- Core 负责“宿主 agent 应该做什么、证据如何提交、结果如何校验与持久化”的确定性协议。
- 外层负责 Codex tool name、Skill 文案、MCP envelope、AgentRuntime、tool policy、AI provider 和实际调用宿主 agent。
- 需要重点处理 empty project、partial failure、resume、dimension skip、invalid submission、外层中断恢复等边界情况。

## 16. Phase 7 执行记录

执行日期：2026-05-17

### 16.1 Core 已完成

本轮完成 Host Agent Workflow Contract 的稳定边界入口。目标是把外层对 `workflows/cold-start`、`workflows/knowledge-rescan`、`workflows/shared`、`workflows/capabilities/execution/external`、`workflows/capabilities/persistence`、`workflows/capabilities/planning/dimensions`、`workflows/capabilities/planning/knowledge`、`workflows/capabilities/presentation` 的散落依赖，收敛到一个“宿主 agent 工作流协议”入口。

Core 新增稳定入口：

| 稳定入口 | 包含能力 | 说明 |
| --- | --- | --- |
| `@alembic/core/host-agent-workflows` | cold-start/rescan intent 和 plan、workflow shared types、mission briefing、external session、submission tracker、dimension completion、checkpoint/report/snapshot persistence、dimension/knowledge planning、briefing presentation helpers | 稳定的是宿主 agent 领取任务、提交证据、完成维度、保存 checkpoint、生成 briefing/report 的确定性协议；Codex tool 名称、Skill 文案、MCP envelope、AgentRuntime、tool policy、AI provider、API key readiness、Dashboard presenter 和多渠道交付留外层。 |

Core 新增/更新：

- `AlembicCore/src/host-agent-workflows.ts`
- `AlembicCore/test/PublicHostAgentWorkflowEntrypoints.test.ts`
- `AlembicCore/test/PublicApiInventory.test.ts`
- `AlembicCore/test/support/public-api-inventory.ts`
- `AlembicCore/package.json`
- `AlembicCore/src/index.ts`
- `docs/alembic-core-public-api-inventory-2026-05-17.md`

Phase 7 export 状态汇总：

| 状态 | 数量 |
| --- | ---: |
| Stable Public | 15 |
| Provisional Public | 21 |
| Transitional Internal | 98 |
| Internal Only | 0 |
| Forbidden | 0 |

当前 package export 总数为 134，其中 wildcard export 仍为 61。`npm run smoke:public-api` 应验证 73 个 exact public API entrypoints 可通过 package self-reference 导入。

### 16.2 本阶段边界判断

- `@alembic/core/host-agent-workflows` 是协议入口，不是 AgentRuntime。
- Core 拥有 host-agent mining 的确定性合同：任务意图、扫描计划、briefing payload、session 状态、submission tracker、dimension complete 校验、checkpoint/report/snapshot 持久化、resume 所需数据结构。
- 外层拥有宿主执行：Codex tool 名称、MCP schema、Skill 文案、tool policy、AgentRuntime、provider 调用、API key readiness、transport envelope、Dashboard presenter、daemon/CLI 交互和 channel/package delivery。
- empty project、partial failure、missing session、invalid dimension、invalid submission、dimension skip、resume/checkpoint cleanup 这类边界应通过 Core 协议降级或返回结构化错误，而不是要求外层复制内部实现。
- `./workflows`、`./workflows/shared`、`./workflows/cold-start`、`./workflows/knowledge-rescan`、`./workflows/capabilities/execution/external`、`./workflows/capabilities/persistence`、`./workflows/capabilities/planning/dimensions`、`./workflows/capabilities/planning/knowledge`、`./workflows/capabilities/presentation` 进入 `@alembic/core/host-agent-workflows` 的迁移替代方向。
- 本阶段不删除旧 workflow deep path，不重写外层 agent 逻辑，不把 Codex/plugin/CLI/Dashboard 交付行为搬进 Core。

### 16.3 Core 验证结果

已通过：

- `npm run build:check`
- `npm test -- PublicHostAgentWorkflowEntrypoints PublicApiInventory`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run smoke:public-api`
- `npm_config_cache=/private/tmp/alembic-core-npm-cache npm pack --dry-run`

测试说明：

- Vitest 输出中仍有既有 stderr：`error: Could not access 'HEAD'`。
- 该 stderr 未导致失败，当前结果为 59 个测试文件、922 个测试通过。
- `npm run smoke:public-api` 已验证 73 个 exact public API entrypoints 可通过 package self-reference 导入。

### 16.4 Alembic 窗口任务

下一轮 Alembic 外层接入按小批次执行，只替换 import 来源和 adapter 集成点，不改宿主执行行为。

建议顺序：

1. cold-start/rescan intent 批次：
   - 将新增或正在修改的 `@alembic/core/workflows/cold-start`、`@alembic/core/workflows/knowledge-rescan` import 改为 `@alembic/core/host-agent-workflows`。
   - 优先替换 `createExternalColdStartIntent`、`createInternalColdStartIntent`、`buildColdStartWorkflowPlan`、`selectColdStartDimensions`、`createExternalKnowledgeRescanIntent`、`createInternalKnowledgeRescanIntent`、`buildKnowledgeRescanWorkflowPlan`、`selectKnowledgeRescanDimensions`。
   - 替换后运行 `npm run build:check`。
2. briefing/session 批次：
   - 将 `@alembic/core/workflows/capabilities/execution/external` import 改为 `@alembic/core/host-agent-workflows`。
   - 优先替换 `createExternalWorkflowSession`、`buildExternalMissionBriefing`、`getActiveExternalWorkflowSession`、`BootstrapSession`、`BootstrapSessionManager`、`MiningSessionStore`、`ExternalSubmissionTracker`。
   - 不把 Alembic 主仓库的 AgentRuntime、tool policy、CLI 命令参数或 Dashboard presenter 移入 Core。
3. dimension completion 批次：
   - `runExternalDimensionCompletionWorkflow` 和相关 input/output 类型从 `@alembic/core/host-agent-workflows` 导入。
   - Alembic 主仓库继续负责 tool/command wrapper、事件广播、用户可读输出和 Dashboard 状态映射。
   - 针对 missing session、invalid dimension、empty submitted IDs、partial recipe binding 记录外层实际表现。
4. persistence/resume 批次：
   - 将 checkpoint/report/snapshot persistence import 改为 `@alembic/core/host-agent-workflows`。
   - 优先替换 `saveDimensionCheckpoint`、`loadDimensionCheckpoints`、`clearDimensionCheckpoints`、`WorkflowReportWriter`、`WorkflowReportHistoryStore`、`WorkflowSnapshotStore`。
   - 不删除外层的文件路径策略、daemon lifecycle、cleanup command wrapper；先替换、验证、记录。
5. planning/presentation 批次：
   - 维度调度、rescan evidence plan、briefing presentation helpers 从 `@alembic/core/host-agent-workflows` 导入。
   - 如果发现外层仍必须 deep import 某个 helper，记录缺口并反馈 Core，不要新增 wildcard 依赖。

禁止事项：

- 不新增 `@alembic/core/workflows/*` 或 `@alembic/core/workflows/capabilities/*` deep import。
- 不把 internal AgentRuntime、AI provider、API key、tool execution、CLI transport、Dashboard presenter 迁入 Core。
- 不删除旧外层 workflow 文件来“配合”本阶段；先替换 import、跑 build/test、记录缺口，再进入删除计划。

### 16.5 AlembicPlugin 窗口任务

AlembicPlugin 执行同样的 import 收口，但要额外守住 Codex 插件边界。

建议顺序：

1. Codex handler intent 批次：
   - `createExternalColdStartIntent`、`createExternalKnowledgeRescanIntent`、workflow plan builder 从 `@alembic/core/host-agent-workflows` 导入。
   - MCP tool schema、Codex result envelope、preflight、human-readable nextActions 留在 Plugin。
2. briefing/session 批次：
   - session/briefing/submission tracker 从稳定入口导入。
   - Codex Skill 文案、tool name、tool policy、plugin cache path 和 marketplace/channel 发布逻辑留在 Plugin。
3. dimension completion 批次：
   - `runExternalDimensionCompletionWorkflow` 从稳定入口导入。
   - Plugin 继续负责 MCP 参数归一化、permission/policy、Codex 响应 envelope、session bridge 和 runtime status。
4. checkpoint/resume 批次：
   - Core checkpoint/report/snapshot helper 从稳定入口导入。
   - 插件自己的 channel/package path、资源复制、daemon bridge 和缓存同步不迁入 Core。
5. 边界情况回归：
   - 覆盖 no active session、sessionId mismatch、dimensionId invalid、submitted IDs empty、partial bind failed、checkpoint damaged、resume expired。
   - 如果稳定入口缺少必要结构化 error/meta，反馈 Core 增补，不在 Plugin 复制 Core 内部逻辑。

特别注意：

- Plugin 不能把 Codex Skill、MCP tool、marketplace/channel、daemon bridge、API key readiness、provider 实现迁入 Core。
- Host-agent workflow contract 可以进入 Core，是因为它描述确定性任务协议；真正驱动 Codex 宿主 agent 仍属于 Plugin/Codex 外层。

### 16.6 下一阶段入口

Phase 8 开始处理外层 Adapter 收口：

- Alembic / AlembicPlugin 按稳定 facade 小批次替换 deep import。
- Core 只补真实缺口，不根据外层便利新增薄 facade。
- 两个外层窗口每批都要记录替换文件、替换前后 import、build/test 结果、无法替换原因。
- 删除计划必须等两个外层仓库都完成接入验证后再写，不能在 Core 窗口提前要求删除。

## 17. Phase 8 执行记录

执行日期：2026-05-17

### 17.1 Core 已完成

本轮完成 Core 侧“外层 Adapter 收口”的硬性边界工具。目标不是继续搬功能，而是把外层仓库新增 `@alembic/core` import 的规则固化下来，让 Alembic、AlembicPlugin、Dashboard、Agent 后续都能按同一套公开 API 边界推进。

Core 新增：

- `AlembicCore/scripts/lint-consumer-core-imports.mjs`
- `AlembicCore/test/PublicConsumerCoreImportBoundary.test.ts`
- `AlembicCore/package.json` 中新增 `npm run lint:consumer-core-imports`
- `AlembicCore/package.json` 的 `files` 包含 `scripts/lint-consumer-core-imports.mjs`，安装包模式也能复用该检查器。

脚本能力：

- 默认只允许 Stable Public facade 在任意消费者代码中新增使用。
- `Provisional Public`、`Transitional Internal`、deep path import 必须被外层仓库的 allowlist/baseline 覆盖，或位于明确配置的 adapter path。
- `referenceLimits` 用于冻结迁移期 deep path 的引用数量，防止“已存在所以继续加”的扩散。
- 兼容外层已有配置字段：`allowedSpecifiers`、`allowedRootSpecifiers`、`allowedExistingSpecifiers`、`allowedDeepSpecifiers`、`allowedProvisionalSpecifiers`、`allowedTransitionalSpecifiers`、`referenceLimits`、`scanRoots`、`adapterPathGlobs`、`ignoreGlobs`、`ignoredPathGlobs`。
- 默认不统计 `vi.mock` / `jest.mock` 引用，以对齐 AlembicPlugin 已有基线脚本；后续外层完成测试 mock 收口后，可显式设置 `includeMockReferences: true` 进入更严格模式。
- 默认忽略 `.git`、`coverage`、`dist`、`docs`、`node_modules`、`vendor`，避免把生成物和文档当成产品依赖。

本阶段没有新增 `@alembic/core` runtime public entrypoint，也没有改变 package export 数量。Phase 7 的公开 API 状态汇总仍保持：

| 状态 | 数量 |
| --- | ---: |
| Stable Public | 15 |
| Provisional Public | 21 |
| Transitional Internal | 98 |
| Internal Only | 0 |
| Forbidden | 0 |

### 17.2 本阶段硬性规则

1. 外层仓库新增产品代码时，只能优先使用 Stable Public facade，例如 `@alembic/core/search`、`@alembic/core/vector`、`@alembic/core/project-intelligence`、`@alembic/core/host-agent-workflows`。
2. 迁移期 deep path 只能作为“已有基线”保留；新增 deep path 必须先记录 Core 能力缺口，再由 Core 侧补稳定 facade 或明确拒绝。
3. `allowedSpecifiers` 不能作为便利清单随手扩张；每次新增都必须对应文档中的边界理由、替代计划和删除计划。
4. `referenceLimits` 是比 allowlist 更硬的规则：同一个迁移期 specifier 的引用数量不能增长。
5. `adapterPathGlobs` 只能指向真实 adapter 层，不能覆盖整个 `lib`、`src`、`test` 或任意业务目录。
6. Dashboard 不直接依赖 Core；Dashboard 通过 API/daemon boundary 消费数据。
7. AlembicAgent 未来只能消费稳定 API 或 host-agent workflow contract，不能直接依赖 Core transitional deep path。
8. Core 不接管 Codex MCP tool、Skill 文案、AgentRuntime、tool policy、AI provider、API key readiness、Dashboard presenter、channel/package delivery。

### 17.3 Core 验证结果

已通过：

- `npm test -- PublicConsumerCoreImportBoundary`
- `npm run lint`
- `node scripts/lint-consumer-core-imports.mjs ../Alembic --config config/core-import-boundary.json`
- `node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config config/core-import-boundary-allowlist.json`

外层只读扫描结果：

| 仓库 | 扫描文件 | Core 引用 | Stable | Provisional | Transitional | 违规 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Alembic | 643 | 767 | 198 | 42 | 527 | 0 |
| AlembicPlugin | 601 | 702 | 192 | 8 | 502 | 0 |

说明：

- Alembic 和 AlembicPlugin 当前仍有大量迁移期 deep path，但都已被各自 allowlist/baseline 覆盖。
- Phase 8 的首要目标是阻止新增 deep path 和引用数量增长，而不是一次性删除所有历史 import。
- 若 AlembicPlugin 后续开启 `includeMockReferences: true`，需要先处理或重新评估 `vi.mock('@alembic/core/...')` 这类测试 mock 引用。

### 17.4 Alembic 窗口任务

Alembic 窗口本阶段只做接入和约束，不做大规模删除。

1. 在 Alembic 的本地脚本或 CI 中接入 Core 提供的检查器：
   - 使用 Core 子仓库中的 `scripts/lint-consumer-core-imports.mjs`。
   - 子仓库命令形态：`node <Core子仓库>/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary.json`。
   - 安装包命令形态：`node node_modules/@alembic/core/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary.json`。
2. 保留 Alembic 现有 `config/core-import-boundary.json` 作为 Phase 8 基线。
3. 如需更严格的扫描范围，在配置里补 `scanRoots: ["bin", "lib", "scripts", "test", "config"]`，不要扫描 `docs`、`dist`、`vendor`。
4. 对新增代码执行硬规则：
   - 新增 Core import 优先使用 Stable Public facade。
   - 新增 deep path 不允许直接加入 allowlist；先记录 Core 缺口并反馈 Core 窗口。
   - 如果确实必须临时新增，必须同时写明替代稳定入口、删除阶段和 build/test 证据。
5. 分批把高频 deep path 替换到稳定入口：
   - foundation：`logging`、`workspace`、`io`、`events`
   - knowledge/dimensions：`knowledge`、`dimensions`
   - database/repository：`database`、`repositories`
   - search/vector/guard：`search`、`vector`、`guard`
   - project intelligence：`project-intelligence`
   - host agent workflow：`host-agent-workflows`
6. 每批替换后运行：
   - Alembic 自身 build/test
   - Core import boundary check
   - 记录替换文件、替换前后 specifier、无法替换原因。

禁止事项：

- 不用 `adapterPathGlobs` 覆盖宽目录来绕过检查。
- 不把 agent runtime、provider、CLI transport、Dashboard presenter 迁入 Core。
- 不删除外层旧文件来“制造通过”；先替换 import，验证通过后再写删除计划。

### 17.5 AlembicPlugin 窗口任务

AlembicPlugin 窗口本阶段同样只做接入和约束，额外守住 Codex 插件边界。

1. 在 Plugin 的 lint/check/CI 中接入 Core 检查器：
   - 子仓库命令形态：`node <Core子仓库>/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary-allowlist.json`。
   - 安装包命令形态：`node node_modules/@alembic/core/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary-allowlist.json`。
2. 保留当前 `config/core-import-boundary-allowlist.json`，不要因为方便新增 deep path。
3. 暂时保持默认 `includeMockReferences: false`，对齐当前基线；后续若开启严格 mock 统计，先清理或重建测试 mock 引用基线。
4. 对 Codex handler / daemon bridge / MCP tool 的新增 Core import 执行硬规则：
   - workflow intent、briefing、session、submission、checkpoint 从 `@alembic/core/host-agent-workflows` 引入。
   - project scan/grammar/AST/panorama 从 `@alembic/core/project-intelligence` 引入。
   - Search/Vector/Guard 使用对应稳定 facade。
5. Plugin 保留的职责：
   - MCP tool schema、Codex result envelope、Skill 文案、tool name、permission/tool policy、daemon bridge、plugin cache path、marketplace/channel 发布逻辑。
6. 每批替换后运行：
   - Plugin 自身 build/test
   - Core import boundary check
   - 记录无法替换的 Core 缺口，反馈给 Core 窗口，不在 Plugin 复制 Core 内部逻辑。

禁止事项：

- 不把 Codex Skill、MCP tool、marketplace/channel、API key readiness、AI provider 执行迁入 Core。
- 不新增 `@alembic/core/workflows/*`、`@alembic/core/core/*`、`@alembic/core/service/*` deep import。
- 不通过扩大 allowlist 来掩盖缺少稳定 facade 的问题。

### 17.6 Dashboard / Agent 后续任务

Dashboard：

- 不直接 import `@alembic/core`。
- 通过 Alembic/AlembicPlugin 暴露的 API、daemon state、report artifact、JSON contract 消费 Core 产物。
- 若未来必须复用 Core 类型，先由 Core 暴露稳定 type-only contract，再由 Dashboard 通过版本化 package 引入；不能引用 transitional deep path。

AlembicAgent：

- 可以使用稳定 Core API 和 `@alembic/core/host-agent-workflows` contract。
- Agent repo 拥有 agent/tool/provider/prompt/runtime 实现，Core 只提供确定性任务协议、扫描计划、证据结构和持久化边界。
- 新仓库初始化时必须从 stable-only import policy 开始，不能复制 Alembic/AlembicPlugin 的历史 allowlist。

### 17.7 下一阶段入口

Phase 9 开始处理“外层替换反馈驱动的 Core 缺口收口”：

- 根据 Alembic / AlembicPlugin 的替换批次，记录仍必须 deep import 的真实缺口。
- Core 只对真实缺口补稳定 facade，不新增薄包装。
- 优先收口引用量高且已有稳定模块归属的 deep path。
- 当两个外层窗口都通过边界检查并完成替换记录后，再写删除计划。

## 18. Phase 9 执行记录

执行日期：2026-05-17

### 18.1 Core 已完成

本轮完成 Phase 9 的第一部分：CI 与长期治理。目标是让 `@alembic/core` 的公开 API 边界不再只靠测试里的散落常量和人工记忆，而是变成机器可执行、可随包分发、可被外层工具复用的政策文件。

Core 新增/更新：

- `AlembicCore/config/public-api-boundary.json`
- `AlembicCore/scripts/public-api-boundary-policy.mjs`
- `AlembicCore/scripts/check-public-api-boundary.mjs`
- `AlembicCore/scripts/lint-consumer-core-imports.mjs`
- `AlembicCore/test/support/public-api-inventory.ts`
- `AlembicCore/test/PublicApiInventory.test.ts`
- `AlembicCore/package.json`
- `AlembicCore/.github/workflows/ci.yml`
- `docs/alembic-core-public-api-inventory-2026-05-17.md`

新增脚本：

| 脚本 | 用途 |
| --- | --- |
| `npm run lint:public-api-boundary` | 检查 `package.json` exports 是否全部被 `config/public-api-boundary.json` 分类，检查 wildcard 是否保持 transitional，检查状态数量是否与政策锁定一致。 |
| `scripts/public-api-boundary-policy.mjs` | Core 和外层检查器共用的分类逻辑，避免稳定/迁移期入口在不同脚本里重复维护。 |

`scripts/lint-consumer-core-imports.mjs` 已改为复用同一份 public API boundary policy。外层仓库后续使用该检查器时，会跟 Core CI 使用同一套 stable/provisional/transitional 判断。

`npm run check` 已纳入 `npm run lint:public-api-boundary`，本地完整检查和 CI 使用同一条治理链路。

`package.json` 的 `files` 现在包含：

- `config/public-api-boundary.json`
- `scripts/check-public-api-boundary.mjs`
- `scripts/lint-consumer-core-imports.mjs`
- `scripts/public-api-boundary-policy.mjs`

因此安装包模式下，外层可以通过 `node_modules/@alembic/core/scripts/lint-consumer-core-imports.mjs` 使用同一套边界规则。

### 18.2 本阶段公开 API 状态

本阶段不新增 runtime public entrypoint，不提升任何 transitional export 到 stable。Phase 9 只是把现有边界治理固化。

当前锁定状态：

| 状态 | 数量 |
| --- | ---: |
| Stable Public | 15 |
| Provisional Public | 21 |
| Transitional Internal | 98 |
| Internal Only | 0 |
| Forbidden | 0 |

当前 package exports：

| 类型 | 数量 |
| --- | ---: |
| Exact exports | 73 |
| Wildcard exports | 61 |
| Total exports | 134 |

硬性规则：

1. 新增、删除、提升或降级任何 `package.json` export，必须同步更新 `config/public-api-boundary.json`。
2. `expectedCounts` 是 CI 锁，不允许无说明地扩大公开面。
3. wildcard export 在迁移期全部保持 `Transitional Internal`，不能变成稳定模板。
4. 新稳定入口必须有真实能力边界、测试、外层迁移说明，不允许新增薄 facade。
5. 破坏性 public API 变更必须同时写迁移说明，外层窗口确认接入计划后才能落地。

### 18.3 Core 验证结果

已通过：

- `npm run lint:public-api-boundary`
- `npm test -- PublicApiInventory PublicConsumerCoreImportBoundary`
- `node scripts/check-public-api-boundary.mjs --format json`
- `node scripts/lint-consumer-core-imports.mjs ../Alembic --config config/core-import-boundary.json`
- `node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config config/core-import-boundary-allowlist.json`

Phase 8 后外层只读扫描结果：

| 仓库 | 扫描文件 | Core 引用 | Stable | Provisional | Transitional | 违规 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Alembic | 630 | 755 | 216 | 42 | 497 | 0 |
| AlembicPlugin | 601 | 688 | 211 | 8 | 469 | 0 |

说明：

- 两个外层仓库都已经能通过 Core import boundary 检查。
- Phase 8 后 stable 引用比例提升，workflow/project-intelligence 一批 deep import 已被替换。
- 剩余 transitional 引用仍很多，但多数已经有稳定替代入口，属于外层迁移任务，不是 Core 新 API 缺口。

### 18.4 剩余 deep import 判断

高频剩余项大致分成两类。

已有稳定入口，可交给外层继续替换：

| 当前 deep import | 稳定替代 |
| --- | --- |
| `@alembic/core/infrastructure/logging/Logger` | `@alembic/core/logging` |
| `@alembic/core/infrastructure/signal/SignalBus` | `@alembic/core/events` |
| `@alembic/core/infrastructure/event/EventBus` | `@alembic/core/events` |
| `@alembic/core/shared/TimerRegistry` | `@alembic/core/events` |
| `@alembic/core/infrastructure/io/WriteZone` | `@alembic/core/io` |
| `@alembic/core/shared/PathGuard` | `@alembic/core/io` |
| `@alembic/core/shared/resolveProjectRoot` | `@alembic/core/workspace` |
| `@alembic/core/shared/WorkspaceResolver` | `@alembic/core/workspace` |
| `@alembic/core/shared/ProjectRegistry` | `@alembic/core/workspace` |
| `@alembic/core/shared/ProjectMarkers` | `@alembic/core/workspace` |
| `@alembic/core/domain/knowledge/KnowledgeEntry` | `@alembic/core/knowledge` |
| `@alembic/core/domain/knowledge/Lifecycle` | `@alembic/core/knowledge` |
| `@alembic/core/service/knowledge/KnowledgeService` | `@alembic/core/knowledge` |
| `@alembic/core/service/knowledge/RecipeProductionGateway` | `@alembic/core/knowledge` |
| `@alembic/core/domain/dimension/DimensionCopy` | `@alembic/core/dimensions` |
| `@alembic/core/domain/dimension/RecipeDimension` | `@alembic/core/dimensions` |
| `@alembic/core/core/AstAnalyzer` | `@alembic/core/project-intelligence` |

需要后续判断是否补稳定入口的真实缺口：

| 当前 deep import | 初步判断 |
| --- | --- |
| `@alembic/core/shared/concurrency` | 可能属于 Core deterministic utility；需要看外层是否只是执行策略辅助，避免变成 AgentRuntime API。 |
| `@alembic/core/shared/token-utils` | 可能属于 agent/runtime 上下文预算；需要判断是否应迁到 AlembicAgent，而不是 Core stable。 |
| `@alembic/core/shared/developer-identity` | 可能属于 knowledge metadata contract；需要看是否应进入 `@alembic/core/knowledge`。 |
| `@alembic/core/shared/errors/*` | 可能需要稳定错误类型入口，但不能暴露内部错误层级为默认模板。 |
| `@alembic/core/shared/test-mode` | 大概率只应作为测试工具或外层测试基线，不应产品稳定化。 |
| `@alembic/core/types/workflows` | 应优先并入 `@alembic/core/host-agent-workflows`，除非外层反馈仍缺类型。 |
| `@alembic/core/types/snapshot-views` | 应优先并入 `@alembic/core/project-intelligence` 或 future report contract。 |

### 18.5 Alembic 窗口任务

Alembic 下一批不需要等 Core 新 API。先替换已有稳定入口能覆盖的 deep import。

建议顺序：

1. Logging 批次：
   - `@alembic/core/infrastructure/logging/Logger` -> `@alembic/core/logging`
   - 替换后运行 Alembic build/test 和 Core import boundary check。
2. Events/Signal 批次：
   - `SignalBus`、`EventBus`、`TimerRegistry` -> `@alembic/core/events`
   - 不迁移外层事件语义、MCP envelope、CLI 输出。
3. Workspace/IO 批次：
   - `resolveProjectRoot`、`WorkspaceResolver`、`ProjectRegistry`、`ProjectMarkers` -> `@alembic/core/workspace`
   - `WriteZone`、`PathGuard` -> `@alembic/core/io`
4. Knowledge/Dimensions 批次：
   - `KnowledgeEntry`、`Lifecycle`、`KnowledgeService`、`RecipeProductionGateway` -> `@alembic/core/knowledge`
   - `DimensionCopy`、`RecipeDimension` -> `@alembic/core/dimensions`
5. Project Intelligence 批次：
   - AST/discovery/panorama deep imports 优先从 `@alembic/core/project-intelligence` 引入。

每批完成后记录：

- 替换文件列表
- 替换前后 import
- 剩余无法替换的 specifier
- 无法替换原因
- build/test/import-boundary 结果

### 18.6 AlembicPlugin 窗口任务

Plugin 同样先替换已有稳定入口，不要等待 Core 补新 facade。

优先批次：

1. Logging -> `@alembic/core/logging`
2. Events/Signal/Timer -> `@alembic/core/events`
3. IO/Workspace -> `@alembic/core/io`、`@alembic/core/workspace`
4. Knowledge/Dimensions -> `@alembic/core/knowledge`、`@alembic/core/dimensions`
5. Workflow types -> 优先检查是否已由 `@alembic/core/host-agent-workflows` 覆盖。

Plugin 禁止事项继续保持：

- 不把 Codex Skill、MCP tool、marketplace/channel、daemon bridge、API key readiness、provider 执行迁入 Core。
- 不新增 `@alembic/core/service/*`、`@alembic/core/shared/*`、`@alembic/core/types/*` deep import。
- 如果 stable facade 缺少必要类型，记录缺口反馈 Core；不要直接扩大 allowlist。

### 18.7 下一阶段入口

Phase 10 可以开始处理第一批真实 Core 缺口，但必须以外层无法替换清单为输入。

候选方向：

1. 判断是否需要稳定的 Core `errors` contract。
2. 判断 `developer-identity` 是否进入 `@alembic/core/knowledge`。
3. 判断 workflow/snapshot types 是否补入 `host-agent-workflows` / `project-intelligence`。
4. 对 `shared/concurrency`、`token-utils`、`test-mode` 保持谨慎，避免把 agent runtime 辅助能力稳定进 Core。

## 19. 当前结论

当前 `@alembic/core` 已经承载了大量真实能力，但它的 package 边界仍处于迁移期形态：导出多、通配多、外层深路径引用多。

下一阶段最重要的工作不是继续搬代码，而是把“能 import 的内部实现”与“应该长期承诺的公开 API”拆开。只有这个边界稳定下来，多仓库才会从同步源码式耦合，转向版本化契约协作。

## 20. Phase 1-9 外层验收更新

阶段 1-9 外层验收报告已迁入长期文档目录：

- `docs/AlembicCore/alembic-core-phase-1-9-outer-repo-acceptance-report-2026-05-17.md`

当前验收结论：

| 仓库 | Core imports | Stable | Provisional | Transitional | 验收状态 |
| --- | ---: | ---: | ---: | ---: | --- |
| Alembic | 755 | 321 | 42 | 392 | 接入和 build 通过；CI submodule / boundary lint 需要修。 |
| AlembicPlugin | 675 | 454 | 8 | 213 | 接入和 build 通过；lint 格式错误和 boundary 统计口径需要修。 |

下一轮规则：

1. 两个外层窗口先修 CI/lint 闭环，再继续替换已有 stable facade。
2. 外层每完成一批替换，都要下调 allowlist/reference limit，防止 transitional import 回涨。
3. Core Phase 10 只处理外层反馈的真实缺口，不根据路径名新增薄 facade。
4. `types/workflows`、`types/snapshot-views`、`shared/errors/*`、`developer-identity`、`infrastructure/config/Paths` 是第一批待判断项。
