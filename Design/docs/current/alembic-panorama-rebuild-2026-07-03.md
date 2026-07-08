# 需求设计 — 全景页面重建(老 UI + 新数据源)+ 合并空间串显修复

- Design Key: `alembic-panorama-rebuild-2026-07-03`
- 日期: 2026-07-03
- 状态: **CG 全批(2026-07-03「全部按推荐」:CG-A 折回/CG-B Core/CG-C 继承/CG-D 保留 3 端点/CG-E P0 先证)+ 实现约束已锁(§11)**;未 deliver / 未 intake
- 原始方案: [alembic-panorama-rebuild-original-plan-2026-07-03.md](alembic-panorama-rebuild-original-plan-2026-07-03.md)
- **吸收**: `alembic-dashboard-workspace-scope-fix-2026-07-02`(空间串显修复 v2 并入本需求 §5 F-C;其板行应被本需求取代)
- 涉及仓: AlembicCore(健康 rollup 能力 + 空间发现护栏)+ Alembic 主体(全景端点 + 空间视图聚合)+ AlembicDashboard(恢复全景 UI)
- 证据: 3 路历史+现状 Explore + 控制器亲验(DimensionRegistry 字段 / ProjectMap 字段 / coverage_ledger 基建 / architectureIntelligence 接线态)

## 1. 用户目标与三条硬原则

把老 Panorama 全景页面重建到最新主体:**① UI 完全保留老版;② 数据层干净接新 Core 底层;③ 不做兼容、不复活废弃引擎**。并合并 `alembic-dashboard-workspace-scope-fix`(空间串显修复),因为全景 overview 的架构数据走的就是那条被修的 ProjectMap 路径。

## 2. 老全景数据契约(亲验,3 层)

### 2.1 前端(AlembicDashboard `0e27445`,PanoramaView.tsx 562 行)

4 标签仪表板 `overview | dependencies | graph | gaps`:

- **overview(全景专属)**:6 卡统计(moduleCount/layerCount/totalFiles/totalRecipes/dimensionCoverage/cycleCount)+ 架构金字塔(layers[].modules[]:name/role/fileCount/recipeCount,14 角色标签 app/core/foundation/service/…)+ 健康度条(healthScore/avgCoupling/cycleCount/gapCount/highPriorityGaps)+ gaps 摘要(前 5)。
- **dependencies**:复用 `DepGraphView`(= 现在的独立「项目金字塔」页)→ `getDepGraph`。
- **graph**:复用 `KnowledgeGraphView` → `getKnowledgeGraph`。
- **gaps(全景专属)**:`KnowledgeGap[]`(dimension/dimensionName/recipeCount/status/priority/suggestedTopics[]/affectedRoles[])。
- 3 个 API:`GET /panorama`、`/panorama/health`、`/panorama/gaps`(挂载时 `Promise.allSettled` 并行)。16 个 `panorama.*` i18n key(中英)。

### 2.2 老后端语义(主体 `75b76ee` 路由 + `5a67757` 引擎)

- `PanoramaService.getOverview/getHealth/getGaps`,由 RoleRefiner(四信号角色精化)+ CouplingAnalyzer(Tarjan SCC 环 + fanIn/fanOut)+ LayerInferrer(拓扑分层)+ DimensionAnalyzer(维度健康雷达 + gaps)+ PanoramaAggregator 编排。
- `healthScore` 公式:`0.6·overallScore + (无环?20:…) + (无高优gap?10:…) + (avgCoupling<10?10:…)`,clamp 0-100。
- `avgCoupling` = Σ(fanIn+fanOut)/moduleCount。
- **老 per-module recipeCount 是假的**:按 `projectRecipeCount × fileCount/totalFiles` 等比分摊,非真实每模块覆盖。
- gaps:维度级(DimensionRegistry),status=missing(0 条)/weak(1 条),priority 由 weight+relatedRoles 推断。

### 2.3 新 Core 数据源(当前 HEAD,亲验)

- **ProjectMap**(`kind=map`,ProjectContextMap.ts):modules[].{role:161, configLayer:159, ownedFileCount}、layers、cycles:255、dependencySummary.edgeCount:177/254。**主体已消费此路径**(ProjectContextConsumerFacts.loadProjectContextMap),即项目金字塔页同源。
- **RepoContext**(`kind=repo`):languages[].fileCount → totalFiles。
- **coverage_ledger**(migration 015 + CoverageLedgerRepository/Advisor/Builder,已在 Core):per (projectRoot, moduleId, dimensionId) 的 coveredCount/grade(empty/thin/partial/covered)。
- **DimensionRegistry**(domain/dimension,亲验有 id/label 中文/weight/suggestedTopics[]/relatedRoles[]):gaps 派生所需字段齐全。
- **knowledge_entries**:totalRecipes 计数(KnowledgeRepository.countByCountableLifecycles)。
- **KnowledgeGraphService**(knowledge_edges):graph 标签数据源,现存。
- **architectureIntelligence**:Core 内部接线但**主体未消费**;老全景架构族用 ProjectMap 已足够,不强依赖它(列为可选增强)。

## 3. 字段级映射表(核心产出,全部亲验)

原则落地:每个老 UI 字段 → 新源(直接)或忠实派生;**零兼容层、零废弃复活、零字段砍除**。

| 老全景字段 | 新数据源 | 方式 | 说明 |
| --- | --- | --- | --- |
| moduleCount | ProjectMap.modules.length | ✅ 直接 | 与项目金字塔同源(空间修复覆盖) |
| layerCount | ProjectMap.layers.length | ✅ 直接 | |
| layers[].modules[](嵌套) | ProjectMap.layers + modules[].{configLayer,role,ownedFileCount} | ⚙️ 组装 | 从 ProjectMap 拼层级金字塔结构 |
| roles(角色分布) | ProjectMap.modules[].role | ✅ 直接 | 14 角色标签直接映射 |
| cycleCount | ProjectMap.cycles.length | ✅ 直接 | |
| totalFiles | RepoContext.languages[].fileCount 求和 | ✅ 直接 | |
| per-module fileCount | ProjectMap.modules[].ownedFileCount | ✅ 直接 | |
| avgCoupling | 派生 = 2×dependencySummary.edgeCount / moduleCount | ⚙️ 干净派生 | 与老 Σ(fanIn+fanOut)/N 等价 |
| totalRecipes | knowledge_entries 计数 | ⚙️ count 查询 | |
| **per-module recipeCount** | coverage_ledger.coveredCount(按 moduleId) | ⚙️ 派生(**比老版更准**) | 老版按文件数瞎分摊;新版用真实每模块覆盖 |
| dimensionCoverage / healthRadar.dimensions[] | coverage_ledger rollup(CoverageLedgerAdvisor)+ DimensionRegistry(label/weight) | ⚙️ 派生 | 替代已删 DimensionAnalyzer 的轻量 rollup |
| gaps(KnowledgeGap[]) | coverage_ledger(grade empty/thin→missing/weak)+ DimensionRegistry(name/weight/suggestedTopics/relatedRoles)+ ProjectMap roles(affectedRoles 取交集) | ⚙️ 派生 | 字段全齐,亲验 |
| healthScore | 忠实重算老公式(输入=dimCoverage+cycles+highGaps+avgCoupling,全部已有) | ⚙️ 忠实重算 | 公式不变,喂新输入 |
| highPriorityGaps | gaps 中 priority=high 计数 | ⚙️ 派生 | |
| dependencies 标签 | 现有 DepGraphView → getDepGraph(ProjectMap) | ✅ 复用 | 空间修复直接生效 |
| graph 标签 | 现有 KnowledgeGraphView → KnowledgeGraphService | ✅ 复用 | |

**结论**:16 项数据全部有干净落点。两处"比老版更好":per-module recipeCount 用真实覆盖、架构族与金字塔同源自动获得空间边界。**无一项需要兼容层或复活旧引擎。**

## 4. 一个必须先证的实现风险(P0 门)

**coverage_ledger.moduleId 与 ProjectMap.module.id 的对齐**:per-module recipeCount 依赖两者 module-id 一致。这正是母重构残留 followup R-1 记录过的双宿主 module-id 派生分歧点(`ProjectMapModules.ts:17` vs `knowledge-rescan.ts:781`)。若不对齐,per-module 覆盖映射会错位。**P0 必须先证同源或给出规范化映射**;若确认不对齐,per-module recipeCount 退化为"仅项目级 totalRecipes 展示"(如实降级,不造假分摊),该 UI 元素显示项目级覆盖而非每模块——这是唯一可能触发"如实调整 UI"的点。

## 5. 设计

### F-A 前端:忠实恢复全景 UI(AlembicDashboard)

以 `0e27445` 的 PanoramaView.tsx 为参考,恢复 4 标签容器 + overview/gaps 专属组件 + 14 角色标签 + 16 i18n key(中英文案原样)。`dependencies` 标签内嵌现有 DepGraphView,`graph` 标签内嵌现有 KnowledgeGraphView。类型定义(PanoramaOverview/Health/KnowledgeGap)恢复;api.ts 恢复 getPanoramaOverview/Health/Gaps(响应形状 = §2.1,前端零改动依赖)。

### F-B 后端数据层:3 端点接新源(主体 + Core)

主体恢复 `GET /panorama`、`/panorama/health`、`/panorama/gaps`(响应形状与老契约一致,前端不用改),但数据来源全换:

- **架构族**(moduleCount/layerCount/layers/roles/cycleCount/avgCoupling/per-module fileCount):走主体已有的 `ProjectContextConsumerFacts`(ProjectMap + RepoContext),扩展组装。
- **知识族**(totalRecipes/dimensionCoverage/healthRadar/gaps/per-module recipeCount):走 Core 覆盖账本 rollup + DimensionRegistry + knowledge_entries 计数。
- **healthScore/avgCoupling**:主体侧忠实重算(公式 §2.2,输入来自上两族)。

### F-C 空间串显修复(吸收 scope-fix,是本需求一部分)

全景所有数据在 AlembicWorkspace(controlRoot)下必须按空间成员边界:

- **架构族**天然继承 scope-fix 的 Core 发现护栏(F-1)+ 主体空间视图(F-2 space→per-folder ProjectMap 聚合)——因为它就是项目金字塔的数据路径。
- **知识族**:coverage_ledger/knowledge_entries 按 projectRoot 键;controlRoot 下按成员 folders 逐个聚合(同 scope-fix F-2 的 space-view 模式,扩展到覆盖账本查询)。
- scope-fix 的六个模块端点 + 本需求三个全景端点,共用同一套 controlRoot→成员聚合逻辑。
- scope-fix 已决项全部继承:CG-1=A(Core 发现护栏)/CG-2=a(成员聚合)/CG-3=保留快照/CG-4=BiliDili 不动 + D-1~3(browse-dirs 限成员 / scan-folder 拒非成员 / dep-graph 两层视图)。

### F-D 派生落点

- **健康 rollup 归 Core**(CG-B 荐):在已有 CoverageLedgerAdvisor 上加轻量 rollup 能力,输出 healthRadar/dimensionCoverage/gaps 形状(消费 coverage_ledger + DimensionRegistry);主体端点调用它。理由:确定性可复用分析归 Core(与老 DimensionAnalyzer 层级一致),主体保持薄 wiring;**不复活 DimensionAnalyzer**(它自带扫描),而是在已持久化账本上 rollup。
- **架构组装 + healthScore/avgCoupling 重算**归主体(它已消费 ProjectMap,是宿主 wiring)。

### F-E UI 结构(CG-A)

老全景的 `dependencies` 标签 = 现在的独立「项目金字塔」页。忠实恢复 = 项目金字塔折回全景做 dependencies 标签(CG-A 荐),独立金字塔 tab 退场(它是当初抽取的中间产物)。备选 = 两者并存(全景含 dependencies 标签 + 独立金字塔页各一份)。

## 6. 非目标 / 硬护栏

- **不做兼容层**:不为已删 `container.get('panoramaService')` 建垫片;不恢复 lib/service/panorama/* 或 lib/injection/PanoramaModule。
- **不复活废弃引擎**:DimensionAnalyzer/PanoramaAggregator/RoleRefiner/CouplingAnalyzer/LayerInferrer 不搬回主体——角色/分层/环由现 ProjectMap 提供,维度健康由 coverage_ledger rollup 提供。
- **不造假数据**:唯一可能降级点是 per-module recipeCount(见 §4),降级为项目级如实展示,不瞎分摊。
- **UI 忠实**:overview/gaps 视觉、14 角色标签、16 i18n 文案与老版一致。
- 继承 scope-fix 全部护栏:不删快照表、不动 rescan 增量链、BiliDili 目录不动、无 scope 项目 discovery 字节不变。
- 只在各仓边界内改;develop on main;push 用户门。

## 7. CG(全部已批 — 2026-07-03 用户「全部按推荐」)

| CG | 问题 | 决定 |
| --- | --- | --- |
| CG-A | UI 结构 | ✅ **项目金字塔折回全景 dependencies 标签**(还原老结构,独立金字塔 tab 退场) |
| CG-B | 健康 rollup 落点 | ✅ **Core 轻量能力**(CoverageLedgerAdvisor 上加 rollup) |
| CG-C | 空间修复已决项 | ✅ **全部继承 scope-fix**(CG-1=A/CG-2=a/CG-3 保留快照/CG-4 BiliDili 不动 + D-1~3) |
| CG-D | 端点形状 | ✅ **保留老 3 端点**(/panorama、/health、/gaps,前端零改) |
| CG-E | per-module recipeCount | ✅ **P0 先证 module-id 对齐**,对齐用真实覆盖 / 不对齐如实降级项目级 |

## 8. 阶段与验收(P0→P5;producer=Core→主体→Dashboard)

- **P0(Core+主体)证 module-id 对齐**(§4 门):证 coverage_ledger.moduleId ↔ ProjectMap.module.id 同源或给规范化映射;定 per-module recipeCount 走真实/降级。表征测试锁 controlRoot 越界现状(继承 scope-fix P0)。
- **P1(Core)空间发现护栏 + 健康 rollup 能力**:scope-fix F-1(controlRoot 发现护栏,无 scope 字节不变)+ 新增 coverage_ledger→healthRadar/gaps rollup(消费 DimensionRegistry);单测 + build:check + 全量 vitest 零回归 + 边界测试绿。
- **P2(主体)空间视图 + 三全景端点**:scope-fix F-2(六模块端点 space-view)+ 本需求三全景端点(/panorama、/health、/gaps 接新源 + healthScore/avgCoupling 重算 + 成员聚合);单测(聚合形状/healthScore 公式/gaps 派生/非成员拒绝);build:check。
- **P3(Dashboard)恢复全景 UI**:PanoramaView + overview/gaps 组件 + 角色标签 + i18n + api;dependencies/graph 内嵌复用;项目金字塔按 CG-A 处置;api-types-drift 契约门绿;build:dashboard。
- **P4 真机双向验收(gate)**:① AlembicWorkspace 下起 dashboard,全景 4 标签展示本空间成员数据、overview 统计/健康/gaps 正确、无任何 BiliDili 条目;② BiliDili 自身 projectRoot 的 dashboard 不回归;③ rescan 增量链不回归。证据 = 三端点原始响应 + 4 标签截图 + BiliDili 对照 + rescan 日志。
- **P5 参考副本比对**:与老全景(`0e27445` 前端 / `75b76ee` 后端形状)逐标签比对 UI 保真度。

## 9. 风险与开放问题

- **module-id 对齐(§4)= 头号风险**,P0 门,关联母重构残留 R-1。
- **healthRadar 每维度 topRecipes/score**:老 DimensionAnalyzer 每维度算 score(每条 20 分,上限 100)+ topRecipes(3 条示例)。新 rollup 需从 coverage_ledger + knowledge_entries 派生同形;topRecipes 从该维度 knowledge_entries 取样。P1 确认。
- **知识族空间聚合语义**:controlRoot 下 totalRecipes/coverage 是"成员仓合计"还是"整空间去重"?建议成员合计(与架构族一致);P2 定。
- **与 W 系列直推交叠**:W4(Core 结构)/W7(Dashboard 结构)可能触碰 repo/discovery/dashboard 同文件;排期用户定。
- **参考副本**:用户可 `git worktree add` 到 `0e27445`(前端)/`75b76ee`(后端)取只读参考;要我建可代劳。

## 10. Design 完备性自检

- 覆盖:老全景 4 标签全部数据字段 → 新源映射(16 项,§3)+ 空间边界(F-C)+ UI 保真(F-A)+ 派生落点(F-D)。
- 三原则落地可证:UI 保留(F-A/P5 比对)、新数据(§3 映射)、无兼容/无复活(§6 逐条)。
- 边缘:module-id 不齐(§4 降级)、维度 score/topRecipes 派生、知识族空间聚合语义、非成员目录。
- 合并完整:scope-fix v2 全部内容并入 F-C,已决 CG/D 全继承,其板行应被本需求取代。
- 证据缺口显式:module-id 对齐(P0 门)、维度派生形(P1)、聚合语义(P2)——均标阶段确认,不over-claim。
- 本文档为 Design 产出,不构成派发;deliver/认领/派发/验收为控制器动作,由用户决定。

## 11. 实现方式约束(2026-07-03 用户指定,硬约束)

- **在 main 上直接开发**:三仓(AlembicCore / Alembic 主体 / AlembicDashboard)各自 main 分支直提,**不开 feature 分支**(沿用 develop-on-main)。
- **老代码只读取式拉取,绝不分叉提交树**:引用老全景代码只用 `git show <commit>:<path>` 或 `git archive <commit> <paths>` 抽文件;**禁止** `git worktree add`、`git checkout <commit>`(detached HEAD)、`git branch`、`git reset`、`git rebase`、`git cherry-pick` 等任何创建/移动引用或产生分叉的操作。抽取是纯文件复制,零提交树影响。
- **参考副本已拉取**(2026-07-03,零分叉抽取,存 scratchpad `panorama-reference/`,不入任何仓):
  - `frontend/PanoramaView.tsx` ← `git -C AlembicDashboard show 0e27445:src/components/Views/PanoramaView.tsx`(562 行,UI 权威)
  - `backend/panorama-route.ts` ← `git -C Alembic show 75b76ee:lib/http/routes/panorama.ts`(236 行,端点契约)
  - `engine/lib/service/panorama/*` ← `git -C Alembic archive 5a67757 lib/service/panorama | tar -x`(10 文件,含 healthScore 公式等派生依据)
  - i18n/api/types 切片:实现时按需 `git -C AlembicDashboard show 0e27445:src/i18n/locales/zh.ts`(取 `panorama.*`)/ `:src/api.ts`(取 getPanorama*)/ 类型见 PanoramaView.tsx:20-84 内联。
- **提交纪律**:各仓本地 commit on main;push / tag / 发版仍为用户门(逐次授权)。
- 抽取命令可被任一实现窗口复现;参考副本是只读对照,不是要贴回的源(数据层按 §3 映射接新源,不复制老实现)。

## 12. 合并后任务分解(候选切片,非派发授权)

producer=Core → consumer=主体 → Dashboard,严格按序;每阶段本地 commit + 验证回填。

| 阶段 | 窗口 | 内容 | 验收门 |
| --- | --- | --- | --- |
| **P0** | Core+主体 | 证 coverage_ledger.moduleId ↔ ProjectMap.module.id 对齐(§4/R-1);定 CG-E 走真实/降级。表征测试锁 controlRoot 越界现状(继承 scope-fix P0) | 对齐结论有证据;表征 RED 锁定 |
| **P1** | Core | ① scope-fix F-1 controlRoot 发现护栏(无 scope 字节不变)② CoverageLedgerAdvisor 上加 healthRadar/gaps rollup 能力(消费 DimensionRegistry) | 单测+build:check+全量 vitest 零回归+边界测试绿 |
| **P2** | 主体 | ① scope-fix F-2 六模块端点 space-view ② 恢复 /panorama、/health、/gaps 三端点(老形状接新源)③ healthScore/avgCoupling 忠实重算 ④ 知识族按成员聚合 | 单测(聚合/公式/gaps 派生/非成员拒绝)+build:check |
| **P3** | Dashboard | 恢复 PanoramaView + overview/gaps 组件 + 14 角色标签 + 16 i18n(zh/en)+ api;dependencies 内嵌 DepGraphView(金字塔折回)、graph 内嵌 KnowledgeGraphView;独立金字塔 tab 退场;api-types-drift 门绿 | build:dashboard+契约门绿 |
| **P4** | 真机 | AlembicWorkspace 下全景 4 标签展示本空间成员、无 BiliDili;BiliDili 自身 dashboard 不回归;rescan 增量不回归 | 三端点原始响应+4 标签截图+BiliDili 对照+rescan 日志 |
| **P5** | 对照 | 与 scratchpad 参考副本逐标签比对 UI 保真 | 保真度确认 |
