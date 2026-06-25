# AlembicPlugin Recipe 生成体系系统化重构：ProjectContext → Plan → Recipe 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-recipe-evolution-optimization-2026-06-21 - AlembicPlugin Recipe 生成体系系统化重构：ProjectContext → Plan → Recipe
主状态: intake
阶段: 无
当前任务包: 无
窗口: 无
阻塞项: 无
下一步: 由总控判断定义阶段和任务包。
评审: 无
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-21 23:05 CST
来源状态: revision 1 / event evt-20260621150517-0001
<!-- unified-status:end -->

## 目标

把 AlembicPlugin 的 Recipe 生成体系从散点提示/局部生成升级为 ProjectContext(源) → Plan(权威 living ledger) → Recipe(产品化输出) 的系统化链路；AlembicPlugin 为主仓，AlembicCore 补齐理解能力，Test 使用 BiliDili 真实 Swift 项目做测试模式验收。

## 完成定义

RG-0~RG-10 按确认阶段完成并经控制器验收：green-field lib/recipe-generation/ 骨架与迁移切片可回滚；Core architecture-intelligence/维度选择/动态信号补齐；新增 plans 表和第 19 个 MCP 工具 alembic_plan(draft/confirm/get)，confirmed Plan 成为冷启动/rescan/module-mining/三段生成硬前置；三段生成、创建期 ProjectContext 锚定、向量隔离、时机修复、提交驱动统一进化落地；保持 daemon-removal 纯 MCP、四工具对外 MCP 语义不破坏、不删证据/提案/向量结构、Plan 不双写。最终通过 BiliDili 测试模式四步链验收：规划真实性、scoped create 即时可检索、真实 commit 触发分类路由、停 Ollama 向量降级可观测。

## 阶段计划

A/RG-0：骨架、别名、8 切片迁移计划、表征测试。B/RG-1~RG-2：AlembicCore architecture-intelligence、Panorama 有价值分析重建为 ProjectContext 侧能力、维度选择与规划 aids/动态聚合。C/RG-3：plans 表与 alembic_plan(draft/confirm/get)，Plan 为 code↔Recipe living ledger，generation-state 从 DB 投影不双写。D/RG-4~RG-5：confirmed Plan 驱动三段生成与测试模式，创建期锚 ProjectContext。E/RG-6~RG-8：向量隔离/isAvailable、时机修复、commit base/rename/rescan/module-mining lease/scale guard/统一进化。F/RG-9~RG-10：收尾与 BiliDili 真实 Swift 项目验收。硬依赖：B 是 C 前提，C 是 D 前置；RG-6 可与 D 并行，RG-7/RG-8 需 RG-6。

## 任务包

## 回填摘要

## 决策和追加日志
