# Original Plan — 全景页面重建(老 UI + 新数据源)并合并空间串显修复

- Design Key: `alembic-panorama-rebuild-2026-07-03`
- 日期: 2026-07-03
- 状态: **CG 全批 + 实现约束已锁(main 直提 / 老代码只读取式抽取不分叉,详见需求设计 §11)**;未 deliver / 未 intake
- 需求设计: [alembic-panorama-rebuild-2026-07-03.md](alembic-panorama-rebuild-2026-07-03.md)
- 吸收需求: `alembic-dashboard-workspace-scope-fix-2026-07-02`(空间串显修复,并入本需求 F-C)

## 1. 用户原始诉求(2026-07-03)

> 我现在打算把全景页面做回到 Alembic 主体……把老旧版本的前端全景页面内容完全保留,但是数据层面使用现在全新的底层数据,做到前端内容的对接,而不是做很多兼容和老旧版本弃用内容。dashboard 空间串显修复肯定要修的,可以合并在一起。

拆解为三条硬原则 + 一个合并:

1. **UI 完全保留**:老 Panorama 全景页(4 标签仪表板:overview/dependencies/graph/gaps、6 卡统计、架构金字塔、健康度条、gaps 面板、14 角色标签、i18n 文案)按原样恢复。
2. **数据换新源**:数据层干净接到现在 Core 的新底层(ProjectMap / coverage_ledger / DimensionRegistry / knowledge_entries),一条一条对接。
3. **不做兼容、不复活废弃**:不为已删的 `panoramaService` 搭兼容层、不复活 DimensionAnalyzer/PanoramaAggregator 等旧引擎;新源没有的字段要么从新数据干净派生、要么如实砍掉(实际核查:零字段需砍)。
4. **合并空间修复**:`alembic-dashboard-workspace-scope-fix-2026-07-02`(项目金字塔/SPM 页在 AlembicWorkspace 空间串显 BiliDili)并入本需求——因为全景的 overview 架构数据走的就是那条被修的 ProjectMap 路径。

## 2. 背景:全景页面是被分阶段删掉的(git 考古)

老 Panorama 曾是主体 + Dashboard 的完整页面,分阶段拆解:
- 分析引擎 `lib/service/panorama/*`(RoleRefiner/CouplingAnalyzer/LayerInferrer/DimensionAnalyzer/PanoramaAggregator)于 `f2fb7e7`(2026-05-17)搬进 Core(边界收敛),后重建为 ProjectContext 能力。
- 后端路由 `lib/http/routes/panorama.ts` 维护到 `75b76ee`(2026-06-21),下一提交 `eaa5319` 退场(governance/* 并入 governance.ts)。
- 前端页 `PanoramaView.tsx`(562 行)在 AlembicDashboard 维护到 `0e27445`(2026-06-20),下一提交 `e18444a`「Promote project pyramid」删掉它、把其中 `dependencies` 标签页(=DepGraphView)提成独立的「项目金字塔」页。

**关键**:当前「项目金字塔」页就是从老全景里抠出来的一个标签页。重建全景 = 把它重新包回全景外壳 + 补回 overview/gaps 两个全景专属标签,数据接新源。

**参考副本提交**(用户"下载复制版本"用):前端 = AlembicDashboard `0e27445`;后端路由形状参考 = Alembic `75b76ee`;全栈同仓最后一版 = Alembic `5a67757`。

## 3. 目标(完成定义,详见需求设计)

在最新 Alembic 主体上重建全景页面:UI 与老版一致;overview/gaps 数据接到新 Core 底层并忠实派生;dependencies/graph 复用现有组件;全景所有数据在 AlembicWorkspace(controlRoot)下按空间成员边界聚合,不再串显 BiliDili;BiliDili 自身 dashboard 不回归;rescan 增量链不回归;无兼容层、无废弃引擎复活。

## 4. 待用户决策(CG,详见需求设计 §7)

- CG-A UI 结构:项目金字塔页折回全景 dependencies 标签(还原老结构,荐)vs 全景与独立金字塔页并存。
- CG-B 健康 rollup 落点:Core 新增轻量能力(荐)vs 主体聚合。
- CG-C 承接空间修复的全部已决项(CG-1=A/CG-2=a/CG-3=保留快照/CG-4=BiliDili 不动 + D-1~3)。
- CG-D 端点形状:保留老 3 端点(/panorama、/health、/gaps)使前端零改(荐)。
