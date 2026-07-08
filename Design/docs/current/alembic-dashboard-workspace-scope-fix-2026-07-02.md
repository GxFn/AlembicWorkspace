# 需求设计 — Dashboard 整体空间串显修复(空间成员边界 + 空间视图语义)

> ⚠️ **已被吸收(2026-07-03)**:用户决定把本修复并入更大的全景页面重建需求 `alembic-panorama-rebuild-2026-07-03`(见 [alembic-panorama-rebuild-2026-07-03.md](alembic-panorama-rebuild-2026-07-03.md) §5 F-C)。本设计的全部内容(β-2 分层 / 六端点空间视图 / CG-1~4 + D-1~3)作为空间修复子部分继承到那份需求。本文档保留为技术底稿;板上 `pending-claim` 行应在全景重建 deliver 时被取代。**不要再单独认领本需求。**

- Design Key: `alembic-dashboard-workspace-scope-fix-2026-07-02`
- 版本: **v2**(2026-07-03 Design 深化重设计;v1 为 2026-07-02 初稿)
- 状态: v2 设计完成,待用户确认(v1 的 CG-1~4 已拍且 v2 保持;v2 新增 D-1~D-3 细则决策待过目)
- 原始方案: [alembic-dashboard-workspace-scope-fix-original-plan-2026-07-02.md](alembic-dashboard-workspace-scope-fix-original-plan-2026-07-02.md)
- 涉及仓: AlembicCore + Alembic 主体 + AlembicDashboard
- ⚠️ **在飞任务标注(控制器处置,Design 无权动)**: 任务包 `core-p0p1-discovery-boundary`(AlembicCore,2026-07-02 16:01 送达在飞)基于 v1 的 α 形态。v2 的 Core 侧 P1 语义与其**大体兼容**(仍是"发现不越界"护栏,P0 表征与"无 scope 缺省字节不变"回归护栏原样有效),差异 = v2 明确 controlRoot repo 为"护栏语义,不承诺聚合形状"且实现优先"controlRoot 分支限定成员"而非"边界参数贯穿全 discovery 栈"。控制器在其回投评审时应以本 v2 §6 P1 验收为准;若实现形态偏离 v2,按 rework 处理而非作废。

## 1. 用户目标与现象(不变)

在 AlembicWorkspace 项目空间打开 Alembic Dashboard,「项目金字塔」(`project-pyramid` tab,用户称"项目全景")与「SPM 模块」(`spm` tab)两页面展示的是 BiliDili 的项目模块。修复目标:两页面在整体空间下展示**本空间(成员仓)**的真实项目信息,且不再有任何非成员数据越界进入本空间(页面显示与知识库归属两个层面)。

## 2. 代码事实(v1 已钉死,全部亲验;此处保留权威版)

### 2.1 两页面数据链(实时,零快照)

前端(AlembicDashboard)不传项目标识,项目上下文由后端 daemon 进程隐式决定(启动时 `ALEMBIC_PROJECT_DIR || cwd` 绑定,每项目一进程,页面与 API 同进程;api-server.ts:49、DaemonSupervisor.ts:114-191、ServiceContainer.ts:74-82、HttpServer.ts:242-352/565-603):

```
project-pyramid: DepGraphView.tsx:162 → api.getDepGraph(api.ts:3537) → GET /api/v1/modules/dep-graph
spm: ModuleExplorerView.tsx:70 → api.fetchTargets(api.ts:3194) → GET /api/v1/modules/targets
     + POST /modules/scan/stream、POST /modules/scan-project、GET /modules/browse-dirs(api.ts:3217/3295/3316)
     + GET /modules/project-info(fetchData,api.ts:3072-3126)
```

后端链:modules.ts:38-137 → ModuleService(lib/service/module/ModuleService.ts:191/232,仅进程内存缓存)→ ProjectContextConsumerFacts.ts:211-228(显式 projectRoot,无 fallback)→ Core `ProjectContextCapabilities.execute(kind=repo|map)`。

### 2.2 根因证据链

- 运行时:`~/.asd/projects.json` 中 BiliDili = `AlembicWorkspace/BiliDili`(**workspace 根一级子目录**,`BiliDili/Package.swift` 存在);`~/.asd/project-scopes.json` 中 scope `project-scope-a8083fdb335c`:controlRoot=AlembicWorkspace,成员=Alembic/AlembicCore/AlembicPlugin/AlembicDashboard/AlembicAgent 五仓,**BiliDili 非成员**;根下还有 Test/Playground/PCVM/claude-code-from-scratch/AlembicBook 等非成员目录(均为潜在越界源)。
- Core:repo 查询 → `collectDiscoveryFacts`(repo.ts:292/528)经 DiscovererRegistry **单选一个** discoverer(repo.ts:558-561);`SpmDiscoverer.detect` 探测**一级子目录**(SpmDiscoverer.ts:50-57)命中 `BiliDili/Package.swift`(conf 0.9)被选中;`#findAllPackageSwifts` **深度 5 递归**(:269-296)收集 BiliDili targets → 两页面实时显示 BiliDili 模块。repo handler 已加载 ProjectScope(repo.ts:426/484-491)但只用于知识库 dataRoot,**发现层不 honor 成员边界**。
- 排除项(亲验):快照(见 §2.3)、daemon/端口串线(每项目一进程)、前端缓存(sessionStorage 按 projectRoot 分桶且 dep-graph 不走缓存)、Core identity 解析(projectRoot 硬键,scope 冲突抛错,无进程级缓存)。

### 2.3 用户初始假设证伪:快照机制盘点(保留,CG-3 已决=保留快照)

| 持久化 | 位置 | 用途 | 与两页面关系 | 删除影响 |
| --- | --- | --- | --- | --- |
| `project_context_file_snapshots` | 主体 SqliteDatabaseAccess.ts:181-223 | rescan 增量判定承重(ProjectContextWorkflowFacts.ts:940-1012) | 无 | 所有 rescan 强制全量 |
| `bootstrap_snapshots`(+dim_files) | Core migrations/001:249-286,FileDiffSnapshotStore | Core workflow 内部增量推断,外层零消费 | 无 | Core 增量能力降级 |

## 3. 方案(v2 核心:方案对比后改选分层语义)

### 3.1 三案对比(Design 裁决依据)

| 方案 | 内容 | 判定 |
| --- | --- | --- |
| **α(v1 原案)** 边界参数贯穿 discovery 栈 | repo/map 接受 discoveryBoundary,detect/load/conflict 在成员内扫,仍走单 discoverer | ❌ 语义缺陷:controlRoot 下"五个异构成员仓选**一个** discoverer"本身无意义——限定成员后 node discoverer 扫出的"一个 repo 五仓混合 targets"形状不可控,页面正确性建立在巧合上;边界参数贯穿全栈侵入面大 |
| **β-1** 聚合下沉 Core repo handler | controlRoot 下 repo handler 内部 per-folder 发现并聚合进 RepoContext | ❌ 扭曲 DTO:RepoContext 是单仓语义(repo.name/languages 单数),塞空间聚合违反 Core"不破坏 DTO 语义"停止卡;Core 已有 SpaceContext 承担空间语义 |
| **β-2(v2 选定)** 分层:Core 护栏 + 主体空间视图 | **Core**:controlRoot 下 repo/map 发现限定成员边界(硬保证不越界;形状不承诺,标注 best-effort,推荐消费者走 space/per-folder)。**主体**:dashboard 链检测 controlRoot → 不再发裸 repo,改走 space(成员清单)→ per-folder repo/map → 聚合 | ✅ 语义各归其位:repo=单仓、space=空间、跨成员聚合归上层(与 Core SpaceContext 既有设计一致);Core 改动小且是通用防御(保护所有消费者);页面形状由主体聚合精确控制 |

CG-1=A 的精神(修在 Core 通用层)在 β-2 中保持:Core 护栏保证**任何**消费者在 controlRoot 下都不会越界看到非成员数据;CG-2=a(聚合)由主体空间视图承担。

### 3.2 F-1(Core)controlRoot 发现护栏

当 `scope.projectRoot` 命中某 ProjectScope 的 controlRoot(repo.ts:426/484 已有加载,复用):repo/map 的 discovery(detect、load、`analyzeConflict`)只在成员 folders 内进行;一级子目录探测(SpmDiscoverer.ts:50-57)与递归收集(:269-296)不得进入非成员目录。实现优先"controlRoot 分支先解析成员根集合,再以成员集合驱动 discovery"(收敛在 repo handler 入口层),而非把边界参数改造进每个 discoverer 内部——除非实现窗口证明后者更小。硬要求:

- **不越界是硬保证**;controlRoot repo 的结果形状是 best-effort(文档注释标注:空间消费者应走 space/per-folder)。
- 无 scope 的普通项目 root:行为**字节级不变**(缺省路径零改动)。
- BiliDili 等非成员目录对 controlRoot 查询完全不可见。
- 通用机制(按成员边界),不点名排除任何目录。

### 3.3 F-2(主体)controlRoot 空间视图:全端点空间语义

主体 ModuleService/ConsumerFacts 增加 controlRoot 分支(scope 加载复用 `alembic-plan-space-membership-scoping` 已接线的入口):space 查询取成员 → **并行** per-folder repo(+按需 map)→ 聚合。六个端点逐一定义:

| 端点 | controlRoot 下语义(v2) | 备注 |
| --- | --- | --- |
| `GET /modules/targets` | 五成员仓 per-folder repo 聚合;每个 target 附 `repoName`/`repoPath` 归属;target `name` 以 `repoName` 命名空间化避免跨仓同名冲突(展示名保留原名,id 加仓前缀) | SPM 页分组展示的数据源 |
| `GET /modules/dep-graph` | **两层视图**(目标形态):空间层 = 成员仓节点 + 仓间依赖边;仓内层 = 点击某仓后该仓 per-folder map 的模块图。仓间边数据源 = 各仓 repo facts 的 localPackages/packageSystems 中的 `file:` 本地依赖(**待 P2 窗口核实字段确切位置;备选 = 读各仓 package.json dependencies 的 `file:` 项**)。若 P2 评估两层交互工作量过大,最小可交付 = 单层平铺 + 按仓分组着色,两层视图转 followup | 金字塔页真正的"全景"价值 |
| `GET /modules/project-info` | `projectName` = scope displayName(AlembicWorkspace);languages 等聚合自成员仓;标注 `spaceMode: true` | 避免顶栏显示串味项目名 |
| `GET /modules/browse-dirs` | 顶层只列成员仓(而非裸 walk workspace 根——现状会列出 BiliDili/Test/Design 等);进入某成员后按现行为 walk | D-1 |
| `POST /modules/scan-folder(+stream)` | 路径必须落在成员仓内,否则 400 拒绝(明确错误文案:非本空间成员目录) | D-2,堵知识库污染口 |
| `POST /modules/scan-project` | 走聚合后的 listTargets,自动获得成员边界 | 随 targets 修复 |

**知识库归属护栏(v2 新增,v1 遗漏)**:SPM 页扫描产生的提取 recipe 归属当前空间知识库;若允许扫非成员目录(如 BiliDili),BiliDili 的代码模式会被提取进 AlembicWorkspace 空间候选 = **数据污染的第二个口子**。D-2 的拒绝语义同时堵住页面串显与知识库串数据。

**性能与缓存**:首屏 targets = 5 次并行 repo 查询(`Promise.all`);dep-graph 追加按需 map 查询。ModuleService 内存缓存按 folder 分桶(现 `#repoContext/#targets` 单桶结构扩展),`reload()` 全清。单仓查询失败不拖垮整页:该仓标注 `unavailable` 降级返回,响应带 `partial: true` 与失败原因(符合主体"降级必须有日志/诊断"仓规)。P2 验收含一次真实五仓聚合耗时记录(观察项,不设硬门;若显著超过单仓现状,缓存 TTL/懒加载作 followup 决策)。

### 3.4 F-3 快照:不动(CG-3 已决,证伪见 §2.3)

### 3.5 Dashboard 前端(F-2 消费侧)

- SPM 页:targets 按 `repoName` 分组渲染;扫描/New Recipe 提取流不变(数据源已带归属)。
- 金字塔页:按 §3.3 两层视图(或最小形态分组平铺);`DepGraphData` 类型 additive 扩展(加 `repos`/`spaceMode` 可选字段,旧形状兼容)。
- `check:api-types-drift` 契约门:后端先行生成,前端跟进(契约由后端领跑,沿用既有定序经验)。

## 4. 非目标 / 硬护栏

- 不删任何快照表、不动 rescan 增量判定链。
- 不动 cold-start 已修的空间边界链(ProjectIndexPlan.ts:136-150);复用其 scope 加载,不重复造。
- Core 不扭曲 RepoContext/SpaceContext DTO 语义;不破坏 package exports;controlRoot 护栏对无 scope 项目字节级无影响。
- 不改四工具对外 MCP 语义;不动 daemon/端口/进程绑定机制;不移动 BiliDili 目录(CG-4)。
- 不为"整体空间"新造持久化(聚合是请求时组合,不落新表)。
- 只在各自仓边界内改动;develop on main,本地 commit,push 用户门。

## 5. 决策记录

### 已拍(2026-07-02 用户确认,v2 保持)

- **CG-1=A**:修在 Core 通用层(v2 落为"controlRoot 发现护栏",见 §3.1 裁决)。
- **CG-2=a**:整体空间成员仓聚合展示(v2 落为"主体空间视图+全端点语义")。
- **CG-3=保留快照**;**CG-4=BiliDili 不动**。

### v2 新增细则(Design 推荐,待用户过目;不推翻已拍项)

| # | 细则 | Design 推荐 | 理由 |
| --- | --- | --- | --- |
| D-1 | browse-dirs 在 controlRoot 下顶层只列成员仓 | 采纳 | 目录选择器不该出现非成员目录 |
| D-2 | scan-folder 拒绝非成员路径 | 采纳(400+明确文案) | 堵知识库污染口;用户真要扫外部项目应在该项目自己的空间做 |
| D-3 | 金字塔两层视图(空间层仓节点+仓间依赖 → 钻取仓内模块图) | 目标形态;P2 评估工作量过大则先落"分组平铺",两层转 followup | 这才是"项目全景"的真实价值;给实现留降级出口避免范围失控 |

## 6. 阶段与验收(P0→P4;producer=Core → consumer=主体 → Dashboard)

- **P0(Core)表征**:fixture 复现 controlRoot+非成员 SPM 子目录+scope 注册(测试内临时注册表,勿碰真 ~/.asd)→ 锁定越界现状(RED 语义);同时锁普通 root(无 scope)现行为回归护栏。*(在飞 core-p0p1 单已含,原样有效)*
- **P1(Core)F-1 护栏**:§3.2 落地;P0 转 GREEN;定向单测(成员内可见/非成员不可见/无 scope 字节不变);消费者影响盘点(grep 对 controlRoot 发 repo/map 的现有调用方并逐一确认语义兼容,盘点结果入回填);`npm run build:check` + 全量 vitest 零回归 + 四边界测试保持绿。*(在飞单验收以本节为准;"边界参数贯穿全栈"非必须形态)*
- **P2(主体)F-2 空间视图**:§3.3 六端点语义 + controlRoot 分支 + per-folder 聚合 + 缓存分桶 + 降级路径 + 单测(聚合形状/名字冲突/单仓失败 partial/非成员 scan-folder 拒绝);`npm run build:check` + 相关测试;消费 P1 后的 Core(本地 file: 依赖重建)。
- **P3(Dashboard)展示适配**:分组渲染 / 两层视图(按 D-3);api-types-drift 契约门绿;`npm run build:dashboard`。
- **P4 真机双向验收(gate)**:① AlembicWorkspace 下起 dashboard:SPM 页 = 五成员仓分组 targets、无任何 BiliDili 条目;金字塔页 = 空间视图(或最小形态);project-info 显示 AlembicWorkspace;browse-dirs 顶层仅成员;scan-folder 指向 BiliDili 路径被拒;② BiliDili 自身 projectRoot 的 dashboard 两页面与修复前一致(不回归);③ 跑一次 rescan 证增量判定链不回归。证据 = 两侧端点原始响应 + 页面截图 + 拒绝路径证据 + rescan 日志。

## 7. 风险与开放问题

- **在飞单兼容**:见文档头标注;评审以 v2 §6 P0/P1 为准,处置权在控制器/用户。
- **仓间依赖边数据源**(D-3):localPackages 字段语义待 P2 核实,备选 package.json `file:` 解析;两条路都不新增 Core 改动。
- **五仓聚合性能**:并行+分桶缓存+降级已设计;真实耗时 P2 记录为观察项,不做本需求硬门。
- **多 discoverer 异构空间**:per-folder 各自 detect,天然支持成员仓异构(未来有 Swift 成员仓也正确)。
- **与用户直推 W 系列的交叠**:W4(Core 结构)/W5(宿主结构)可能触碰 repo/discovery/ModuleService 同文件;排期与协调由用户决定。
- **Dashboard 前端 W7**:本需求 P3 是功能适配,不做 W7 的结构重构;若 W7 先行则 P3 在新结构上落。

## 8. Design 完备性自检(v2)

- 行为覆盖:两页面 + 全部六个后端口子(v1 只覆盖两个,已补);页面串显与知识库串数据两个污染面都闭合。
- 验收:每阶段确定性验收 + P4 真机双向 + 回归三护栏(无 scope 字节不变 / BiliDili 自身不回归 / rescan 不回归)。
- 边缘:跨仓同名 target、单仓查询失败、无 scope 项目、用户显式越界扫描、成员仓异构语言。
- 集成边界:Core DTO 语义不扭曲、聚合归上层与 SpaceContext 设计一致、契约门定序、不新造持久化。
- 证据缺口:仓间依赖字段位置(已标注待核+备选);五仓聚合真实耗时(P2 观察项)。
- 本文档为 Design 产出,不构成派发;deliver/认领/派发/验收均为控制器动作,由用户决定何时执行。
