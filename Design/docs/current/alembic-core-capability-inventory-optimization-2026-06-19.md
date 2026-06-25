# AlembicCore 职责/功能/接口测绘与清理优化评估

Status: Design 草案（2026-06-19）/ 全量测绘 + 清理优化评估 / **结论：针对性接口收口 + 局部优化，非大规模清理** / 优化项待逐项确认 + 与在途波次调和 / 待控制器 intake
Date: 2026-06-19
Design Key: alembic-core-capability-inventory-optimization-2026-06-19
Primary Windows: AlembicCore（测绘/优化）；Alembic / AlembicPlugin / AlembicAgent（消费方核验，observing）

## 背景与定位

用户要检查 AlembicCore 的职责/功能/接口、判断是否需清理优化。本文档全量测绘 + 评估，优化项后续逐项确认。

**关键定性（与 主体/Plugin 清理本质不同）**：
- Core = `@alembic/core`，被 **Alembic 主体 / AlembicPlugin / AlembicAgent 三仓共同消费**的确定性 Headless 内核
  （AGENTS Stop Card 强保护：不空壳化、不删外层仍消费的能力、任何删除须扫描+替代入口+测试）。
- **Core 已有强接口纪律**：`lint:public-api-boundary` + `lint:consumer-core-imports`（跨 3 仓 ~960 引用、**0 违规**）+
  `public-api-closeout`（RW0/RW2 已删 79+ wildcard/深导出）+ `lint:layer-contract`。
- **Core 已有多条在途清理/重构波次**（git log）：CCR-3（删退役 guard analyzers）、RIC-2a/4b（facade 路由 + shim 删除 +
  补测）、GMAP-L1/2（向量 Ollama lane + Recipe 区向量）、MTC/W4（工具名合并 + 预算折叠）、D25、CO3、SD-5 RW2（删 67 零消费导出）。
- **结论**：Core **不需要大规模清理删除**（它健康、纪律强、正在被主动清理）；需要的是**针对性接口收口 + 几处内部优化 +
  与在途波次调和**。任何 Core 改动须**跨仓消费核验**（[[cross-repo-deletion-named-export-sweep]]）。

测绘 altitude：模块/能力 + 接口（导出表面）+ 消费方（含跨仓）+ 清理优化候选。规模：src/ ~120k LOC、9 层、~57 导出子路径。

## 真实代码锚点（doctrine + 已核实）

- **Core 定位（AGENTS.md）**：确定性可复用 Headless 内核——模型/类型/config/workspace/io、SQLite/Drizzle/migrations、
  repository/service、search/vector、Guard、AST/grammar、project intelligence、workflow contract/planning/persistence/
  session/briefing。**不含** Codex MCP/Skill/marketplace、CLI、Dashboard UI、IDE 投递、release 壳、AI provider runtime、
  internal agent、tool system。
- **接口契约（package.json exports，~57 子路径）**：19 stable（logging/dimensions/knowledge/evolution/memory/search/
  vector/guard/project-context/recipe-context/report/host-agent-workflows/database/repositories/workspace/io/events/
  daemon）+ 10 provisional（config/core/capability/core/enhancement/infrastructure/report/service/{bootstrap,candidate,
  quality,recipe}/shared/types）+ 22 transitional（深层 ./core/ast/*、./repository/*、./infrastructure/database/*、
  ./workflows/capabilities/* 等，多为测试 fixture，带移除触发）。根入口只暴露稳定契约（不 export * 大目录）。
- **跨仓消费（agent grep）**：Alembic 437 引用、Plugin 469、Agent 54；全部经 facade、0 深路径违规；transitional 仅
  Plugin 持 73（count-capped、shrink-only、带移除触发）。
- **分层**（无循环依赖）：core/（AST/discovery/enhancement，0 上游依赖）+ domain/（纯值对象/契约）→ infrastructure/ →
  repository/ → service/ → workflows/。

## 全量功能与代码逻辑清单

### A. service/（167 文件 41.8k LOC，最大簇；14 自治子服务、无内部交叉依赖）
- **稳定核心（高消费、保留）**：`search`(混合检索+7 信号排序，11 外引)、`vector`(HNSW+Ollama embed+Recipe 区向量，11 外引,
  GMAP 迭代中)、`knowledge`(v3 统一生命周期 pending→published→deprecated)、`evolution`(EvolutionGateway 演进决策唯一路径)、
  `guard`(代码约束检查，CCR-3 已删 coverage/compliance analyzers)、`source-graph`、`recipe`、`candidate`。
- **大模块**：`project-context`(61 文件 9.7k，9 handler 统一项目上下文查询 API)、`project-intelligence`(1 文件
  **35k LOC 巨石**=多语言分析 phase runner)、`panorama`(11 文件 3.5k 全景分析)。
- **新/年轻**：`recipe-context`(26 文件,GMAP-2 新增,0 测试)。

### B. core/（64 文件 23k LOC）— 多语言代码分析引擎（无 I/O、0 上游依赖）
- `ast/`(13 文件,web-tree-sitter WASM,11 语言 grammar)、`AstAnalyzer`(plugin dispatcher)、`analysis/`(7 文件,调用图
  管线: 符号表→import→边→数据流,RIC-4b owner)、`capability/`(CapabilityProbe 写权限探测)、`discovery/`(12 文件,9 语言
  项目发现+generic)、`enhancement/`(15 文件,14 框架元数据 pack)。

### C. domain/（36 文件 9k LOC）— 语义知识模型（纯逻辑、无 I/O）
- `knowledge/`(KnowledgeEntry v3 聚合根 + Lifecycle 状态机 + 仓储接口)、`dimension/`(统一维度分类/SOP/tier)、
  `evolution/`(EvolutionPolicy 纯决策规则/阈值)、`project-context/` + `recipe-context/` + `source-graph/`(契约)、`snippet/`。

### D. workflows/（57 文件 15.4k LOC）— 编排与呈现
- `cold-start/`(双执行器: internal-agent / host-agent)、`knowledge-rescan/`(增量生命周期审计 + 演进过滤)、
  `capabilities/{host-agent(维度完成/mission briefing/session),persistence(快照/报告/checkpoint),planning(维度 tier/
  knowledge/演进预筛),presentation,project-intelligence(IDE agent 分析包+增量计划)}`。

### E. 基础/支撑/契约层
- `infrastructure/`(48 文件: database+11 migrations/drizzle、vector 持久化 HNSW/JSON/binary、report、config/io/logging/signal)。
- `repository/`(32 文件: knowledge/code/sync/bootstrap + base，11 业务仓储)。
- `daemon/`(8 文件**契约**: DaemonState/JobStore/ProjectRuntimeContracts/ResidentServiceContracts/RuntimeContracts/Job 快照
  事件——**被 主体/Plugin/Dashboard 消费、禁轻删**)。
- `shared/`(38 文件: LanguageService/OutputBudget(MTC/W4)/FailureTaxonomy(D25)/FieldTaxonomy/ProjectRegistry/ProjectScope
  (Dashboard 消费)/错误(CO3 PersistenceError/DivergenceError))、`types/`(9 文件)。

## 清理优化候选（全待逐项确认 + 与在途波次调和）

**① 接口能力整理 → 统一输出层（用户 2026-06-19 指定方向，本优化核心）**：
> **原则**：按**隔离功能模块**做**能力导向的统一输出层**——每个模块对外只暴露其**能力**，内部化底层散乱接口。
> **底层 AST/语言级接口不再对外暴露**（`./core`/`./core/ast`/`./core/ast/*`/`./core/analysis`/`./core/discovery` +
> parser 类型 → 收为内部）；consumer 改用更高层能力（如 project-intelligence/project-context 能力），不直接拿 AST/grammar。
> **关键约束：不是把散乱接口打包进一个 barrel（"纯粹接口打包"）**——要做真正的**能力整理**：识别模块对外能力、设计能力
> 输出、删去底层散乱接口暴露。

- 范例 **ProjectContext**：9 handler（anchor-range/file-flow/symbols/map/module/...）→ 对外**一个 ProjectContext 能力输出**，
  内部化 handler（`ProjectContextService` 已聚合，导出收为能力 facade、不漏 handler/contract 细节）。
- 范例 **RecipeContext**：26 文件（adapters/handlers/interface）→ 对外**一个 RecipeContext 能力输出**，内部化实现。
- **底层 AST/discovery/enhancement/parser**：内部化、不出 `./core/*` 深导出；对外只出"分析项目/项目智能"能力。
- 配套接口收口：`./core/capability`（0 消费）**移除**；wildcard→exact（RW2 续作）；test-fixture transitional 待 Core 出稳定
  fixture facade 后清。
- **⚠ 先修接口门禁**（用户授权按推荐）：`lint:public-api-boundary`/`smoke:public-api` 疑 path-error 失效（PDR-0 复核）——
  门禁不跑则能力收口无守护，**优先修**。
- **消费方迁移（硬约束）**：内部化底层接口会断现有 consumer（如 Plugin `./core/ast/lang-*` 11 引用懒加载 grammar、
  `./core/enhancement` 5 引用）——**须先为这些 consumer 出替代能力 facade**，再内部化；跨 3 仓 ~960 引用按消费门禁分仓迁移、
  跨仓核验（[[cross-repo-deletion-named-export-sweep]]）。**先给替代、再收口**，不可裸断。

**② 内部优化**：
- 🔴 `service/project-intelligence/AnalysisPhaseRunners.ts` **35k LOC 单巨石**（多语言 phase runner 混一文件）→ 按语言拆分
  （最大内部技术债；配合 RIC-4b 已补的测试）。
- `service/knowledge/KnowledgeService` 6 个 `@deprecated` 方法（approve/reject/autoApprove/fastTrack/toDraft）→ 跨仓确认无依赖后删。
- `core/discovery/index.ts` parser 导出面（CMake/Gradle/Ruby/YAML parser 类型外暴）→ 收为内部、只出 `DiscovererRegistry`/`ProjectDiscoverer`。

**③ facade 归位（externally-consumed、非死代码——勿删，定位置）**：
- `service/quality`、`service/bootstrap`(BootstrapDedup)、`service/panorama`：Core 内部零消费，但 `quality`/`bootstrap` 被
  Alembic 主体消费（panorama 待跨仓核实）→ 决策：根 facade vs 仅 sub-path vs 下沉消费方。**先跨仓核实消费，再定**。

**④ 测试缺口（优化、非删除）**：`recipe-context`(0 测试)、`project-context`(9 handler 仅 3 测试)、`vector`(1 测试)。

**⑤ 禁删契约（跨仓消费、AGENTS 保护）**：`daemon/` 全部契约（JobStore/DaemonState/ProjectRuntimeContracts/RuntimeContracts，
被 主体/Plugin/Dashboard 消费）、`shared/ProjectScope`(Dashboard)、`EnhancementGuardRules`/`OutputBudget`(Plugin/主体)、
19 stable 导出、migrations 链。**任何删除前跨仓 grep 全部命名导出 + 下游 tsc**。

## 是否需要清理优化（评估结论）

- **不需要大规模清理删除**：Core 健康（无循环依赖、分层清晰、消费门禁 0 违规、TODO/FIXME 极少），且**多条在途波次正在
  主动清理**（CCR/RIC/GMAP/SD-5 已删 guard analyzers / shim / 67 零消费导出）。
- **需要的是针对性优化**：① **接口能力整理 → 统一输出层**（用户指定核心方向：per-module 能力输出、内部化底层 AST/语言接口、
  **非 barrel 打包而是能力整理**、配 consumer 迁移——是真接口重构、非删码）；② 内部优化（拆 project-intelligence 35k 巨石、
  清 knowledge deprecated、收 discovery parser 导出）；③ facade 归位（quality/bootstrap/panorama 跨仓核实后定位置）；④ 补测试缺口。
- 即"删码式大清理"否、"接口能力整理 + 局部优化"是；接口重构需 consumer 迁移、是本优化的主体工作量。
- **强约束**：多数优化与在途波次相邻——**须先复核 CCR/RIC/GMAP/SD-5 终态，避免重叠**；任何接口/代码删除走**跨仓消费核验**。

## 能力输出层落地（深挖取证 2026-06-19）

三模块深挖 + 跨仓 grep 核准，能力输出层落地清晰，内部化风险**比预期更低**：

### ProjectContext → 收 export-surface 为能力接口（consumer 已克制，低风险）
- 现状：`./project-context` 经 `export *`(service/project-context/index.ts) 暴露 9 handler + ~50-70 handler contracts/
  ref-creators/interface utils（散乱面）。
- consumer 核实：主体 + Plugin 经 ~4 个 wrapper（ProjectContextWorkflowFacts/ConsumerFacts 的
  `executeProjectContextRequest(kind,...)`）消费，**只 import 稳定 domain 类型**（RepoContext/ProjectMap/…/Envelope/Ref）、
  **无人 reach 进 handler/contract**——问题在暴露面（barrel），非 consumer 滥用。
- 能力输出：`ProjectContextCapabilities`——9 个 typed 能力方法（executeRepoQuery/MapQuery/ModuleQuery/…）+ `execute()` 兜底；
  内部化 9 handler + handler-contracts + ref-creators + interface utils（关 `export *`）。迁移低：~4 wrapper 改调、可并存过渡。

### RecipeContext → 收 ports/adapters/handlers 为能力 facade（仅 Plugin 消费，低风险）
- 现状：`./recipe-context`(89 导出) 暴露 ports(Read/Search/Vector/SourceRef)/adapters/handler-makers/interface 细节 + barrel。
- consumer 核实：**仅 AlembicPlugin**(recipe-map.ts)、**仅 list/source-refs 2 kind**、经
  `createRecipeContextServiceFromCore({knowledge,sourceRefRepository})`+`execute()`，**不碰 ports/adapters/handlers**。
- 能力输出：只出 `RecipeContextService` + `createRecipeContextServiceFromCore` + domain 契约/结果；内部化 ports/adapters/
  handlers/interface + vector 区向量元数据（VectorPort 可选、prime 降级、全内部）。迁移低。
- 旗标：6 kind 中 **detail/search/prime/relations 4 个无 consumer**（GMAP-2 新增、设计中）→ 确认未来能力 vs 死设计。

### AST/core 层 → 内部化（仅 enhancement 需替代，余皆"免费"）
- **跨仓 grep 核准（解两 agent 冲突）**：production(lib/bin) **仅 `./core/enhancement` 有消费方**（主体+Plugin 各 2:
  ServiceContainer+KnowledgeModule 的 initEnhancementRegistry/getEnhancementRegistry）。`./core/ast`·`lang-*`·`analysis`·
  `discovery`·`capability`·`AstAnalyzer` 在 **production 0 消费**——仅 Core 内部服务 + **跨仓测试**用（那些 lang-* 引用全是测试）。
- **可直接内部化（production 0 消费）**：`./core/ast`(+lang-*)、`./core/analysis`、`./core/discovery`、`./core/capability`、
  `AstAnalyzer`——停止导出即可。
- **需先给替代再内部化**：`./core/enhancement`（唯一 production consumer）→ 出能力 facade
  `initFrameworkEnhancements()`/`getFrameworkEnhancements()`（封 EnhancementPack/registry），迁主体+Plugin 4 DI 点，再内部化。
- **测试迁移（test-scope）**：跨仓测试现 import Core 内部 AST grammar/capability → Core 出 **test-fixture facade**（或测试改经
  高层能力），再内部化。
- 小结：AST 内部化**比预期低风险**——production 只 enhancement 一项需替代；余免费；测试需 fixture facade。

## 分阶段优化方案（CO-0~6）

原则：**先给替代能力、再迁移 consumer、再内部化收口**（不裸断）；全程跨仓核验 + 消费门禁守护；与在途波次调和。

### CO-0 盘点 + 前置核验（不改码）
- **在途波次终态复核（硬前置）**：CCR/RIC/GMAP/MTC/D25/CO3/SD-5 完成度，划清边界避免重叠。
- **接口门禁实况**：`lint:public-api-boundary`/`smoke:public-api` 是否真 path-error 失效（修复优先级最高）。
- 复核跨仓 consumer 映射（深挖已得，执行期再核）；确认 RecipeContext 4 个无 consumer kind 去留。

### CO-1 修接口门禁 + 移零消费导出（安全先行）
- 修 `lint:public-api-boundary`/`smoke:public-api`（恢复收口守护）；`./core/capability` 移出 production 导出（test 转 fixture）。

### CO-2 建替代能力 + per-module 能力输出（先给替代/输出，与旧导出**并存**、不删旧）
- enhancement 替代：`initFrameworkEnhancements()`/`getFrameworkEnhancements()`（封 EnhancementPack/registry）；AST grammar/
  capability 的 **test-fixture facade**。
- **per-module 能力输出（新建、与旧并存）**：`ProjectContextCapabilities`(9 能力方法 + execute 兜底)；RecipeContext 干净能力
  facade（service+factory+contracts）。**此阶段只新增输出，不动旧导出**（确保 consumer 有目标可迁）。

### CO-3 consumer 迁移（切到新能力输出/替代）
- 迁主体+Plugin 4 DI 点 → enhancement facade；跨仓测试 → test-fixture facade；ProjectContext ~4 wrapper →
  `ProjectContextCapabilities`；Plugin recipe-map → 干净 RecipeContext facade。
- **跑消费门禁 + 三仓 build/test 绿，确认无人再用旧导出**（内部化前置闸）。

### CO-4 内部化收口（删旧，**consumer 已迁完才做**）
- ProjectContext：内部化 9 handler/contracts/ref-creators/interface，关 `export *` barrel。
- RecipeContext：内部化 ports/adapters/handlers/interface + vector 区向量元数据。
- AST/core：`ast/analysis/discovery/capability` + enhancement 内部实现移 `./internal/`、删 `./core/*` 深导出；wildcard→exact。
- 每删一项前再跑跨仓命名导出 grep + 消费门禁，零残留才删。

### CO-5 内部优化（CO-0 后可并行）
- 🔴 拆 `project-intelligence/AnalysisPhaseRunners.ts` 35k 巨石（按语言）；清 knowledge 6 deprecated；收 discovery parser 导出；
  facade 归位（quality/bootstrap→sub-path、panorama 跨仓核实后定）；补测试（recipe-context/project-context/vector）。

### CO-6 验收
- public-api 门禁绿 + 消费门禁三仓绿 + 三仓 build:check/test 绿；能力输出是能力导向（非 barrel）；production 无内部化 AST 残留消费；
  在途波次未被打断；接口/DTO/预算/状态机/持久化兼容未破。

## 执行顺序与依赖
- **硬序：CO-2（先给替代）→ CO-3（迁 consumer）→ CO-4（内部化）**——"先替代、再迁、再收口"，不可逆、不可裸断。
- CO-0 必先；CO-1（修门禁）紧随（收口前恢复守护）；CO-5 内部优化 CO-0 后可并行；CO-6 末。
- 推荐序：**CO-0 → CO-1 → CO-2 → CO-3 → CO-4 →（CO-5 并行）→ CO-6**。
- 覆盖：AlembicCore 主窗口；Alembic/AlembicPlugin（consumer 迁移 + 测试，participates）；AlembicAgent（core 0 消费，observing）；Test（三仓验收）。

## 非目标

- 不把宿主能力（Codex MCP/Skill/marketplace、CLI、Dashboard UI、AI provider runtime、internal agent、tool system）放进 Core；
- 不空壳化/不删外层仍消费的能力（daemon 契约、ProjectScope、stable 导出、migrations）；
- 不破坏 exports/DTO/排序/预算/状态机/错误语义/持久化兼容；
- 不与在途波次（CCR/RIC/GMAP/MTC/D25/CO3/SD-5）重复或冲突；
- 不擅自定稿删除——优化项逐项用户确认 + 跨仓核验。

## 确认点

**已决（2026-06-19）**：
- **核心方向（用户补充）**：接口**能力整理 → 统一输出层**——per-module 能力导向输出、内部化底层 AST/语言/散乱接口、
  **拒绝纯粹接口打包（barrel）、做真正能力整理**；ProjectContext/RecipeContext 为范例；**先给替代能力、再内部化**，配 consumer 迁移。
- **其余按 Design 推荐**：**先修接口门禁**（public-api-boundary/smoke，优先级最高）；`./core/capability`(0 消费) **移除**；
  **范围=中**（接口能力整理 + 修门禁 + 拆 project-intelligence 巨石 + facade 归位 + 补测试）；facade 归位倾向——quality/bootstrap
  → sub-path（host-injected 可选），panorama → 跨仓核实后定（疑实验/仅测试）。
- **硬前置**：先复核在途波次（CCR/RIC/GMAP/MTC/D25/CO3/SD-5）终态划清边界；任何接口/代码改动走跨仓核验 + consumer 迁移、不裸断。

**待核验（PDR-0，非决策）**：
1. 接口门禁是否真 path-error 失效（修复优先级最高）。
2. quality/bootstrap/panorama 跨仓消费实况（定 facade 归位）；底层 AST/enhancement 的 consumer 替代能力设计。
3. 在途波次各自完成度（划清边界）。

## 下一步

1. ✅ 全量测绘 + 能力输出层深挖落地 + 分阶段方案（CO-0~6）+ 执行序已成形。
2. 形成 **design-handoff** 交控制器 intake（含 CO-0~6、执行序、跨仓 consumer 迁移、在途波次硬前置、跨仓核验）。

（Core 多条在途波次正推进——CO-0 复核其终态为硬前置；任何接口/代码改动走"先替代→迁移→内部化"+ 跨仓核验。）
