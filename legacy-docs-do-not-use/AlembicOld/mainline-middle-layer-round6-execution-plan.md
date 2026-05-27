# 新主干中间层 Round 6 执行计划

本文档承接 `mainline-middle-layer-round5-execution-plan.md`。Round 6 的目标是把 ProjectIntelligence 从“每轮返回一个对象”推进到“编译期拥有稳定基线 artifact”，让后续冷启动、增量扫描、搜索刷新和运行期注入都可以围绕同一份项目全景继续演进。

## 本轮目标

1. 建立 ProjectIntelligence artifact store：保存上一轮文件、符号、调用点、依赖图和语义边。
2. Runner 统一增量入口：增量扫描只接收文件指纹 diff，从 artifact store 读取上一轮基线，不再要求调用方手动传 `previousArtifact`。
3. 保持一致性边界：materialize 成功后再保存 artifact，避免编译产物与运行期索引出现半更新状态。
4. 提供内存与 JSON 两种 store：内存 store 服务同一进程内的测试和短生命周期任务，JSON store 服务 Ghost/standard 数据区的跨进程冷启动。

## 实施结果

- `compile`：新增 `MainlineProjectIntelligenceArtifactStore` 端口，包含 `load()` 与 `save()` 两个稳定接口。
- `compile`：新增 `InMemoryMainlineProjectIntelligenceArtifactStore`，作为 runner 默认基线 store。
- `compile`：新增 `JsonMainlineProjectIntelligenceArtifactStore`，复用 `MainlineJsonDocumentStore` 与 `MainlineAtomicFileStore`，将 artifact 写入 runtime data 区。
- `compile`：`MainlineProjectIntelligenceRunner` 的 `incremental` 请求去掉 `previousArtifact`，改为从 store 加载上一轮基线，并校验 project root。
- `test`：覆盖跨 runner 实例通过 JSON store 复用基线 artifact，并验证旧 symbol stale 仍能同步写入 ContextIndex。

## 当前边界

- 本轮只保存最新 artifact，不做 artifact 历史版本、快照回滚或多分支缓存。
- artifact store 只保存编译期项目事实，不保存 Recipe、候选知识、workflow session 或旧 service 状态。
- 增量入口在没有基线 artifact 时会显式报错；冷启动仍应先走一次完整 runner。

## 下一步

1. 冷启动编排：将文件指纹快照、ProjectIntelligence artifact store、ContextIndex 和 SearchIndex 串成一条明确的 bootstrap pipeline。
2. 依赖支撑：增量 patch 构建时使用上一轮 known file set 辅助 import 解析，降低局部读取对未读取文件的误判。
3. 查询 facade：围绕 `MainlineProjectIntelligenceQueries` 暴露只读 query service，服务代码理解、影响分析和注入上下文筛选。
4. 搜索刷新闭环：让 artifact diff 直接驱动 search document refresh/remove，避免未来扫描入口重复计算同一批集合。
