# Alembic 冷启动链路修复与优化 — Original Plan

Date: 2026-06-25
Design Key: alembic-coldstart-chain-repair-2026-06-25
Source Window: Design
Status: ready-for-intake

## 背景(真实链路验收触发)

在 BiliDili 真机以宿主 Agent(Claude Code 当 AI)跑 testMode 冷启动,实测 plan→bootstrap→宿主分析→submit 链路"半通":plan 维度确实驱动了 bootstrap 的 dimensions/executionPlan,但 bootstrap 同时挂了一套与 plan 无连接的硬编码 7-domain SOP;多个工具输出超 MCP inline 上限;提交被证据门禁拒时拒因被剥光、宿主无法自纠。门禁本身严谨正确,不是问题。

## 用户目标

让宿主 Agent 驱动的冷启动 **plan → bootstrap → 逐维分析 → submit → dimension_complete → Recipe 持久化** 全链路**真实闭环**,且最终产出的 Recipe **真实、准确、有价值、符合预期**。本需求 = 链路问题确认 + 链路优化落地。

## 范围

- AlembicPlugin:bootstrap briefing 组装、输出 projector/allow-list、证据门禁失败响应、status 计数。
- AlembicCore:MissionBriefing 的 target 文件计数。
- Test:BiliDili 真机宿主冷启动闭环 e2e。
- 不含:Alembic 主体 AI provider(宿主即 AI)、Dashboard。

## 完成定义

1. bootstrap 任务结构单一且由 plan 维度驱动(退场并存的 7-domain 旧层);
2. 链路每个工具输出在 inline 上限内(超出走瞬态文件 ref,对齐 alembic_plan 两部分);
3. 提交被拒时宿主能拿到可操作拒因(violation code + itemIndex + nextAction)并自纠;
4. targets fileCount、status recipeCount 真实准确;
5. BiliDili 真机闭环跑通,抽查 Recipe 满足真实/准确/有价值;门禁严格度不降。

## 阶段候选

P0 拒因可操作化 → P1 退场 7-domain 层 → P2 输出预算化 → P3 target 计数 → P5 recipeCount 语义 → Test e2e。P6(handoff/projectId 漂移)暂缓。

## 待决策(intake 确认)

- P1:7-domain 层**退场**(推荐)vs 改造为 plan 驱动 —— 影响可见行为,需确认。
- P5:recipeCount 改报 DB 数(推荐)vs 保留磁盘语义并显式分列。
- P6:是否单开 follow-up。

## 非目标

不放松证据门禁;不给 7-domain 改名续命;不引入新 AI provider/独立 agent runtime;不动 alembic_plan 已交付两部分契约。

## 详细设计

见 [requirement design](alembic-coldstart-chain-repair-2026-06-25.md)(开发者决策级,每项 file:line 落点 + 分阶段验收)。
