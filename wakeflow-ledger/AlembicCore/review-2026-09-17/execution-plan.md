# AlembicCore 文件与模块审查

日期：2026-09-17。起点：`e274e31`。授权：用户直接要求逐文件/模块 review、接口精简、缺陷修复、冗余代码清理和测试精简。

## 边界与完成定义

- 产品主体修改在 AlembicCore；用户随后明确允许 Alembic 与 AlembicPlugin 的必要接线，用于修复 lifecycle/content patch 经文件同步回滚的问题。AlembicAgent 仍只读。
- 对 Git 跟踪的源码、测试、脚本、配置、文档建立逐文件清单，区分静态检查、人工语义检查、修复与保留理由，不把机器扫描冒充逐行人工审计。
- 问题先有真实入口复现，再修根因；内部收敛保持 exports、DTO、排序、预算、状态机和持久化兼容。
- 删除必须有引用扫描、替代入口和验证证据；测试合并必须保留独立行为断言，四道 Core 边界测试保留。
- 对需要破坏兼容或外层实现的调整，给具体设计与证据后再请求决策。
- 现存 AGENTS.md/CLAUDE.md 未提交修改由用户所有，不纳入本次改动。
- 本次不是 Wakeflow delivery，不创建/接收任务包或更改控制器状态；使用 target-craft 的复现、验证和自审方法。

## 执行顺序

1. 记录文件清单、依赖/公开入口/真实消费者、类型检查与全量测试/lint 基线。
2. 按知识/演化、项目分析/检索/Guard、工作流/严格生产、基础设施/公共入口分组逐文件审查；单独记录测试合并候选与保留原因。
3. 主线程核对发现；逐个问题先 RED，再最小修复并 GREEN；安全精简与兼容变化分开处理。
4. 执行必要公共 API、层依赖、消费者、构建、测试与 lint 检查；二次自审最终差异。
5. 汇总逐文件覆盖、修改、删除证据、验证、剩余问题与下游接入说明；按仓库规则提交本次产品改动。

## 最终状态

- 基线830个跟踪文本文件 / 232,370行；最终逐文件目录837项（含7个新增），全部583个源码条目已语义阅读。
- 749项完整语义阅读、88项结构/静态检查；最终结果以file-review.json/CSV、review-coverage.json为准，inventory.json保留原基线状态。
- 完成Core缺陷修复、兼容接口精简、重复测试合并及两外层必要接线。独立复核发现的本轮回归均已处理；详见review-summary.md与各findings/独立报告。
- Core最终npm run check通过：194套件通过/1跳过，2155测试通过/1跳过。Node22.23.2。
- Main/Plugin全仓noEmit与改动文件Biome通过；相关44/54测试分批通过。首次legacy stats失败已在Core修复并两边复验，无删弱旧测试。
- Core提交fec4b763af7bdedf5aeea8ab3e579e9d745795e9；Main提交4dc86fbb95ae67a86ddf215406ae4767901f3dd8；Plugin提交aee9b5572055559d3b30995c0c16534eef0fb425。
- 三仓index无待提交项；只剩原有AGENTS.md/CLAUDE.md用户修改，Core额外保留原有未跟踪coverage/index.ts。没有push/发布。
- 下游继续使用file:../AlembicCore及构建后的dist包入口；不提交dist，不更新vendor/release指针。
- 精确命令、失败修复顺序、验证结果/日志哈希和残留兼容边界在verification.json及review-summary.md。
