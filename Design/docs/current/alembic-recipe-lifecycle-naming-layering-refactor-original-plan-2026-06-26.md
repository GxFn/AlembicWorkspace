# Recipe 生命周期 语义命名 + 文件夹重构隔离 + 层级下沉上浮 — Original Plan

Date: 2026-06-26
Design Key: alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26
Source Window: Design
Status: ready-for-intake

## 背景

Recipe 生命周期几轮功能需求(伞形/主体适配/coldstart/productization/followup)暴露大量命名/分层债。新建架构重构需求:语义命名重整 + 文件夹级隔离 + 功能层级测绘 + 下沉(共享→Core)/上浮(宿主特有→宿主)逻辑。5-agent 跨四仓测绘 + 11 项复核。

**[2026-06-27 re-ground 重大订正]** 原稿假设伞形/主体在途;现伞形/主体适配/终端/realverify **全 COMPLETE+ARCHIVED**→**本重构成为生命周期链最后一个需求**。7-agent re-ground workflow 订正:applyPlanSelection/assertPlanSelectionShape/coverage_ledger **已 land**(不再"待新建/不存在")、gate 三私有投影函数**已删**+已 import/调用 Core applyPlanSelection(D-1/D-2/B4 大幅赶超)、唯一剩余排序门=半落地的 CG-3=B coverage-ledger-write sink。详见 requirement design §-1。

## 用户目标

把 Recipe 生命周期的命名消歧统一、文件夹按层级隔离(消灭 dead/live/shim 副本)、固化 Core 共享 ← 单向 Plugin/主体/Agent 宿主的分层,完成剩余下沉(D-1/D-2 让已在 Core 的被单源消费)与上浮(U-1/U-2 host 名去 codex)。铁律:搬迁须真实 caller+证据,删除走三要素,不为整洁强搬,不放松门禁。

## 范围

- 拥有:命名重整 N-1~N-9、文件夹隔离(删 RG9 stub + 文档纠错 + 子目录化)、剩余下沉 D-1/D-2、上浮 U-1/U-2、层级固化门禁。
- 不拥有(**已 land,仅核验**):applyPlanSelection 下沉(主体 B 已落 planIntent.ts:75)、assertPlanSelectionShape(已落 :40)、coverage_ledger 归 Core(伞形 U2a 已落 migration 015)、module 源方案 B、coverage-ledger-write 下沉(=mainbody-realverify CG-3=B,Core 已 land c4cac6b 待 push,Plugin re-import 待收尾)。
- 跨仓:Core + Plugin + 主体 + Agent。

## 完成定义

见 [requirement design](alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md)。核心:分层关系图固化、命名无碰撞/误导、dead 副本删除单源、剩余下沉上浮带证据落地、(可选)分层门禁防回归;**分两批**(冷区先行 + 热区串在伞形/主体波次后)。

## 阶段候选

**[2026-06-27 订正,见 design §-1.C]** 在途波次门已全消(全 ARCHIVED),唯一剩余门=CG-3=B sink 完全落地。
- **冷区(现在做,无门)**:删 RG9 20-stub → Plugin+主体 CLAUDE.md/AGENTS.md 文件地图+Bootstrap 路径 → class Bootstrap→AppRuntime → N-5/zod PlanStageId DRY → N-8 登记 → N-1/N-6/N-7 改名 → semantic-glossary/layer-contract canonical 锚定。
- **热区(等 CG-3=B 完全落地=Core push+Plugin re-import+vendor re-pin)**:D-1(REFRAME 非删·host-wire DTO 去留决策)/D-2(wire-up+verify,无净新)/N-2(降 cosmetic)/N-3/N-4(PluginOpportunisticEvolution)、N-9 Plugin FileChangeHandler、FileChangeHandler/Core evolution 目录、host-agent-workflows 子目录化、U-1/U-2 上浮。
- **late-level2(授权+alias)**:index 词汇 Level2 值/工具名 + HTTP/job-kind/Dashboard 文档冻结。

## 待决策(intake confirm)

CG-1 N-1 改名方向 / CG-2 module 源方案 B 归属 / CG-3 codex 字面量持久化兼容 / CG-4 U-2 并入 CC3 / CG-5 是否加分层门禁 / CG-6 排序确认 / CG-7 文件夹激进度(见 requirement design 决策表,Design 已给建议)。

## 非目标

不重做在途承载的下沉;不重做前序架构工作(Core inventory/主体 cleanup/Agent convergence);不为整洁强搬;不放松门禁;不在热区与在途并行造 churn。

## 详细设计

见 requirement design(strict)。**[2026-06-28 §11 整体架构设计]** 应用户"做更全面整体的设计"要求,新增 §11(11-agent workflow 深度测绘+对抗 critique):A 职责语义图+god-file 拆分(DaemonJobRunner 2006/plan-tool 2009/IDEAgentAnalysisPacketBuilder 1810/CompletenessCritic 871/ProjectContextWorkflowFacts 1585)、B per-repo 目标文件夹树 before→after+放置规则(role→folder,stage→subfolder when ≥3)、C 7 类功能隔离边界+可门禁化、D layer×role 系统化命名方案表(N-/U-/class Bootstrap/stage vocab 收为实例)、E current→target 改名/搬迁计划(batch+vendor-repin 义务)、F 相对原 doc 增量、G 新增 CG-A/B/C+RISK-1/2/3;§11.H Core repository/barrel/持久化层补测绘。**point-fixes 升级为整体设计。** **[2026-06-28 §12 实现指导]** 新增 §12:6 链双宿主锚定+orchestrator 统一(已纳入 in-scope,每宿主 runProjectIndexWorkflow(mode))+P1-P15 分阶段验收+BiliDili 6 链直接真测(DeepSeek+本地千问 Qwen)+G0-G6 gate。**[2026-06-28 文档优化]** 新增 **§A 需求执行总纲**作执行入口(完整需求逻辑+P1-P15 路线图表+推进协议);权威分层 §A→§12→§11→§-1→§0~§10(降为历史附录);CG-A/B/C 全已决(路径豁免/INDEX 内部名/先 scan),RISK-2 已纳入 in-scope(§11.I+§12.1),RISK-1/3 是执行约束;realverify 代码门已清(finding#1 land,真机折叠 G4);**已 deliver 上板 P2 autoClaim**(提示词暂未发,仍文档优化)。按 §A→§12 阶段指导推进。
