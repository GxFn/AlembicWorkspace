# 本轮文件与模块复审

基线56900c5，表中明确区分全文/新模块与只读调用边界，不把局部检查称为新一轮全仓扫描。

| 文件 | 行数 | 范围与处理 |
| --- | ---: | --- |
| `src/agent/production/StrictProductionPipeline.ts` | 51 | 完整兼容出口；43个源级出口不增减；94个声明正文等价迁移。 |
| `src/agent/production/StrictProductionStages.ts` | 285 | 真实stage factory与G1/G2宿主适配；修复continue/true适配、非法判定、取消后内部副作用、先验证后seal。 |
| `src/agent/production/strict/analysisLoop.ts` | 656 | 上下文、epoch推进、扩展日程；Core生成日程；seal可选预期hash先比对再提交，原无参保持。 |
| `src/agent/production/strict/analyst.ts` | 612 | Analyst语义回执与fixpoint；非法disposition拒绝；unknown继续阻断fixpoint；跨进程重建/Core守恒验证保留。 |
| `src/agent/production/strict/lineage.ts` | 384 | Producer证据血缘与因果修复；证据字节hash、上下文/epoch/review守恒及修复界限均原样保留。 |
| `src/agent/production/strict/expressions.ts` | 423 | 表达集与终态封印；0/1/N表达、前驱链与Core terminal validator完整迁移。 |
| `src/agent/production/strict/gates.ts` | 55 | 阶段工具准入与typed gate return；保留工具权限与Core返回适配；不反向依赖编排。 |
| `src/agent/production/strict/primitives.ts` | 88 | V1内部ID/hash/深冻结；修复浅冻容器子项可变；hash排序/前缀不机械合并。 |
| `src/tools/runtime/handlers/knowledge/input.ts` | 285 | 知识工具输入合同；28个可编辑字段许可；未知字段整笔拒绝，显式undefined不能旁路。 |
| `src/tools/runtime/handlers/knowledge/management.ts` | 507 | 知识管理端口和写入结果；Core类型替代重复鸭子接口；取消读、缺端口、partial/unknown写入与skipped规范化。 |
| `src/tools/runtime/registry.ts` | 900 | knowledge.manage schema（本轮审查范围）；同步ID、score/confidence、queue limit和内容字段许可说明。 |
| `src/agent/strategies/PipelineStrategy.ts` | 1576 | strict路由/epoch投影（本轮只读范围）；确认调用factory及Core结果；保留与阶段入口不同的读取限制策略，不机械合并检查。 |
| `src/agent/production/StrictProductionPrompts.ts` | 43 | strict上下文提示装配（只读）；真实epoch/context入口继续接线。 |
| `src/production.ts` | 67 | 公开production facade（只读）；现有Runtime/type导出保持；不新增内部子路径。 |
| `src/agent/production/index.ts` | 3 | Agent内部barrel（只读）；继续通过原兼容入口转出。 |
