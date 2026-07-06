# Original Plan — Dashboard 整体空间串显修复(项目金字塔 + SPM 模块页)

- Design Key: `alembic-dashboard-workspace-scope-fix-2026-07-02`
- 日期: 2026-07-02
- 状态: CG-1~4 已决(2026-07-02);**需求设计已升 v2**(2026-07-03 Design 深化重设计:方案 α→β-2 分层语义、补第二污染口与全端点空间语义、新增细则 D-1~D-3 待用户过目)。v2 全文见需求设计文档。
- 需求设计: [alembic-dashboard-workspace-scope-fix-2026-07-02.md](alembic-dashboard-workspace-scope-fix-2026-07-02.md)

## 1. 用户原始诉求(2026-07-02)

> 现在 Alembic 主体的项目全景页面和 SPM 模块页面存在问题需要修复,就是现在好像存在快照机制,导致这两个页面在 AlembicWorkspace 项目空间下展示 BiliDili 的项目信息,我打算删除快照机制,因为已经落后了,现在可以直走 projectContext 的信息,你深入挖掘代码实现,重新设计真实落地方案。

- 「项目全景页面」= Dashboard `project-pyramid` tab(界面名「项目金字塔」,组件 DepGraphView)。
- 「SPM 模块页面」= Dashboard `spm` tab(组件 ModuleExplorerView)。
- 现象(用户观察,真实):在 AlembicWorkspace 项目空间下,这两个页面展示 BiliDili 的项目模块信息。
- 用户初始假设:存在落后的快照机制;意向方案 = 删除快照、直走 ProjectContext。

## 2. 挖掘结论(详细证据链见需求设计 §2)

1. **两个页面的数据链上没有任何持久化快照参与**,本来就"直走 ProjectContext"——每次请求都实时执行 `kind=repo/map` 查询。
2. **真实根因**:AlembicWorkspace 是原生 ProjectScope 的 controlRoot(整体空间根,成员 = 五个 Alembic 仓),而 BiliDili 物理上位于 workspace 根的一级子目录且不是空间成员。Core 的 ProjectContext repo/map 发现层不 honor ProjectScope 成员边界:`SpmDiscoverer` 在 controlRoot 下探测到 `BiliDili/Package.swift`(一级子目录探测 + 深度 5 递归收集),被单选为该 repo 的 discoverer → 两个页面显示的"AlembicWorkspace 模块"实际是每次实时扫出来的 BiliDili SPM targets。
3. **用户假设证伪**:真实存在的快照(`project_context_file_snapshots` 主体表、`bootstrap_snapshots` Core 表)是 rescan/bootstrap 增量判定的承重件,与两个页面无关;删除它们不能修复串显,反而强制所有 rescan 全量。

## 3. 目标(草案,待 CG 确认)

在 AlembicWorkspace(整体空间 controlRoot)下,项目金字塔与 SPM 模块两页面正确展示**本空间**(成员仓)的项目信息;任何非成员子目录(BiliDili/Test/Playground 等)不再越界进入空间根的模块发现。BiliDili 作为独立项目自身的 Dashboard 不回归;rescan 增量判定链不回归。

## 4. 待用户决策(CG,详见需求设计 §5)

- CG-1 修复位置:Core discovery honor ProjectScope 成员边界(荐)vs 仅主体层过滤。
- CG-2 整体空间下两页面的目标展示语义:成员仓聚合(荐)/ 仅剔除越界 / 其他。
- CG-3 快照机制处置:保留承重快照、本需求不删(荐;用户原意向"删快照"经证伪不成立)。
- CG-4 BiliDili 目录:代码修复为主、目录不动(荐;它是真机验收项目)。
