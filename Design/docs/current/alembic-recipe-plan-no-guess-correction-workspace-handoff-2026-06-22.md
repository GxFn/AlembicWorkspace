# Recipe Generation Conformance Correction (Plan Full-Authority + No-Guess + Truthfulness + Panorama Retire / Frontend Pyramid) Workspace Handoff

Date: 2026-06-22
Status: ready-for-workspace
Source Window: Design
Receiving Window: Wakeflow
Design Key: alembic-recipe-plan-no-guess-correction-2026-06-22

## Summary

对照修正已完成的 `alembic-recipe-evolution-optimization-2026-06-21` 实现的偏差。来源是 GPT5.5 对其自身实现的自审（61 条 `FAB-001~061`），Design **逐条独立核实真实代码**：58 真 / 1 假(FAB-044 排除) / 1 部分(FAB-022) / 1 转决策(FAB-048)。权威是**原始 requirement design**，**不照搬** GPT5.5 "凡未授权即删"核武规则。偏差归 10 组（A-K），按 **REWIRE/DELETE/BUILD** 分类、拆为 **P0-P6 七阶段**。全部用户决策已闭合，可控制器 intake、独立自动化推进。详见 [requirement design](alembic-recipe-plan-no-guess-correction-2026-06-22.md)。

## Handoff Type

requirement-candidate（对已完成需求的对齐返工/符合性修正；非新功能）

## Confirmed User Goal

让 Plan 真正成为**完全权威计划**并消除实现对原始意图/真实性的偏离：
- **Plan = 完全权威**：`alembic_plan` 把**确认事实**（项目信息+SOP+维度信息+动态信号）交内置 Agent；Agent **分析产出完整权威 Plan**（全部符合预期维度+规模）；**删除所有 recommendation/top-N**；Plan 是三段硬前置；冷启动主路径、深挖/单模块/进化为后续补充。
- **真实性/不猜**：Plugin 不猜（删正则 fallback、缺口返 partial）；进化路由真实（proposal/area-scan 非 changeLog/recommendation）；checkpoint 持久；源引用/新鲜度真实（无静默成功、无删证据）。
- **化繁为简**：**直接删 Panorama**；前端只展示基于 ProjectContext 的**项目金字塔模块依赖关系**、去掉知识覆盖等。

## Final Completion Definition

见 requirement design「Final Completion Definition」。要点：组 A-K 各自完成标准全绿；**恢复原始 RG-10 四步禁替代**（rename 直接修指针 / 逻辑改 pending proposal / prime+search 检索 / stop-Ollama 向量降级）；不回退已真实符合骨架（进化单管道/`-M/-C`/三段读 Plan/向量 isAvailable/Plan intent 持久+读时投影无双写）；跨仓 Plugin+Core 构建测试绿。

## Current Design Status

- Requirement design status: complete（10 组 grounded 到 file:line，REWIRE/DELETE/BUILD 已分类，P0-P6 执行序已定）
- User confirmation status: confirmed（全部决策闭合 2026-06-22）
- Mainline relation status: `next-mainline`
- Original plan confirmation status: 修正基于已 confirmed+已完成的 `alembic-recipe-evolution-optimization-2026-06-21`（即其权威源）
- Code fact status: 充分（3 轮审计：Design 4 路 + GPT5.5 61 条 + Design 8 路深挖；逐条核实结构/消费者/可行性）
- Needs Wakeflow code research: no（P0 首任务自带 3 项自查，不阻塞 intake）
- Detached Design mode: no
- Relation to Wakeflow current mainline: 修正刚完成的 recipe-evolution；独立、可自动化推进，无在途波次争用

## Recommended Next Step

create controller state root or task package（控制器 intake → 建 state root → P0 planning → 按 P0-P6 自动化推进至完成）。This recommendation is for Wakeflow review only.

## Functional Loop Summary

- User scenario: 在真实项目（验收用 Swift BiliDili 测试模式）跑 `alembic_plan draft→confirm`→三段生成；提交/进化 Recipe；前端看模块依赖金字塔。
- Input: ProjectContext 确认事实包（draft）；Agent 自著完整 plan 载荷（confirm）；commit-driven 工具调用（进化）。
- Output: 完全权威 Plan（intent 落 plans 表）；真实锚定/新鲜的 Recipe；pending proposal/area-scan；ProjectContext 模块依赖金字塔。
- State change: plans 表 intent-only；recipe_source_refs/proposals/lifecycle 真实写入；durable checkpoint 推进（仅成功路由后）。
- Producer: AlembicCore（维度/Plan 投影/进化网关/checkpoint repo/migration 013）；AlembicPlugin（plan-tool/不猜/进化路由/门控）。
- Consumer: 三段生成、prime/search 检索、AlembicDashboard 金字塔。
- Failure path: Core 欠交付→partial draft（不猜）；diff 不可得→blocker/降级 proposal；freshness 不可用/缺图引→degraded/non-final；截断/非祖先 range→不推进 checkpoint+catch-up。

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicPlugin | participates | 主：A 删推荐top / C confirm 载荷 / D 持久 / E 不猜 / F 进化路由+门控 / G checkpoint / H2-H3-H4 / I1 Panorama 测试+I2 前端 client | 依赖 Core 接口（维度/网关/migration） |
| AlembicCore | participates | 重：A/A8 Core 推荐删 / B 维度 canonical+迁移+域信号 / G migration 013+checkpoint repo / H1/H4/H5/H6 / I1 删 Panorama+I3 architectureIntelligence | 跨仓删除门禁（named-export sweep+下游 tsc） |
| AlembicDashboard | participates | I2：DepGraphView 金字塔提主视图、删覆盖/Panorama 面、删死 api client；保留其余 tab | 数据源 `/modules/dep-graph` 已就绪（无阻塞） |
| Alembic 主体 | participates | I1：清 `ProjectIntelligenceRunner.materializeProjectPanorama` 死码 + retired `/panorama` 410 路由（`/governance/*` 子路由非 Panorama，保留） | 低（多为死码） |
| Design | design-complete | 需求设计完成；K2 需求文档矛盾澄清（Design 自做） | — |
| Test | participates | P6：BiliDili 测试模式 + 恢复原始 RG-10 四步重验收 + 跨仓回归 | 下游，待产品修复 |

## Evidence And Links

- Requirement design: [alembic-recipe-plan-no-guess-correction-2026-06-22.md](alembic-recipe-plan-no-guess-correction-2026-06-22.md)
- 权威源（被修正的原始需求）: [alembic-recipe-evolution-optimization-2026-06-21.md](alembic-recipe-evolution-optimization-2026-06-21.md)
- GPT5.5 自审（输入证据，非执行需求）: `wakeflow-ledger/requirement-designs/alembic-recipe-evolution-gpt55-fabrication-audit/gpt55-fabrication-delete-repair-demand-2026-06-22.md`
- User decisions: 见 requirement design「Resolved Decisions」（Plan 完全权威 / 执行优先级 / PD-1~4 / H2-H3 / S1-S4 / I3 / 前端范围）
- Related TODO / Backlog: 无新增 TODO；控制器领域项（RG-10 验收放宽 FAB-020/021/024/025/026/057、窄 root FAB-028）**不进本需求产品代码范围**，由控制器重验收处理。

## Risks

- **R6（高）** 维度 canonical 迁移：signal-aware 无信号时比语言单因子**少维度**；生成阶段须改"按 confirmed Plan ID 直读"而非重算求交；表征测试对比迁移前后维度集。
- **R7** 真 BUILD：G（migration 013+Core checkpoint repo+catch-up）、H5（coverage 矩阵契约）。
- **R8** 重复模块副本：git-diff-checkpoint 在 `recipe-generation/evolution` 与 `service/evolution` 两份已分叉；P0 确认活路径、改动覆盖两份或先消死副本。
- **R10** F2 门控调整触及"三段硬前置"：仅文件级/scoped 单模块挖掘豁免，**项目级 cold-start/全量 rescan 仍硬前置**，勿削 Plan 权威。
- 跨仓删除（B 删旧 resolveActiveDimensions、I1 删 Panorama）走 named-export sweep + 下游 tsc + consumer-import 门禁。

## Non-Goals And Forbidden Shortcuts

- 不新增 Recipe 生成能力（F2 为 REWIRE 已存在扫描器、非新建）；不推翻已真实符合骨架。
- 不删 plans 表/证据/提案/向量结构；不改四工具对外语义（H2/H3 仅 submit success→degraded，已用户确认）；保持非常驻不变量；Plan 不双写。
- 不代行控制器 Wakeflow 状态变更；**不照搬 GPT5.5 核武规则**（按原始需求逐条定性）。
- Core map/module 理解补齐（S2）不在本需求；架构富理解不重建（I3 删空壳、只留域信号）。

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| P0 | 盘点+表征测试（消费者清单/重复副本/plan-tool 对 architectureIntelligence 签名依赖/前端范围） | 本设计 / P1-P5 | 清单+表征测试就绪，3 项自查落定 |
| P1 | Plan 权威落实（A 删推荐top + C confirm 完整载荷 + D 持久 stop-write/删逃生阀） | P0 / P2 | draft 仅事实包、confirm 必填完整载荷、plans intent-only |
| P2 | 不猜+维度（E 删 fallback→partial + B 维度 canonical+迁移+生成阶段直读 Plan + 域信号一等） | P1 / P6 | 单一 signal-aware 路径、生成阶段消费 Plan ID、Plugin 无猜 |
| P3 | 进化/挖掘真实（F1 proposal rewire + F2 文件级 moduleMining+门控豁免 + 删死 fallback + override testMode + G checkpoint 持久） | P0 / P6 | 逻辑改出 proposal、新模块跑文件级挖掘、durable checkpoint |
| P4 | 源引用/新鲜度真实（H1 不删证据 + H4 锚定 + H6 不静默 + H5 矩阵 + H2/H3 degraded） | P0 / P6 | 无静默成功/删证据、coverage 矩阵、新鲜度真实 |
| P5 | Panorama 退场+前端金字塔（删 Panorama 死码 + DepGraphView 主视图+删覆盖面 + I3 删富分析留域信号） | P0（+P2 域信号协调） / P6 | Panorama 删净、前端只金字塔、域信号保留 |
| P6 | 验收（BiliDili 测试模式 + 恢复原始 RG-10 四步 + 跨仓回归；J 边界守护+K 澄清） | 全 / Test | 全链绿、原始四步真实通过 |

分波建议：波一 P1+P2（心脏）/ 波二 P3+P4 / 波三 P5（风险最低，可先单独推）。Phase candidates are for controller review only and are not task packages.

## Open Questions For Wakeflow

1. 无开放设计问题（全部用户决策已闭合）。P0 首任务的 3 项工程自查（plan-tool 签名对 architectureIntelligence 依赖、git-diff-checkpoint 重复副本活路径、旧 resolveActiveDimensions 消费者清单）由执行窗口在 P0 落定，不需控制器额外裁定。

## Pre-Handoff Checklist

- Checked alignment checklist: yes
- This handoff does not include copyable implementation-window prompts: yes
- Phases remain candidates, not task packages: yes
- TODO / Backlog candidates are listed in Evidence And Links: yes（无新增 TODO；控制器领域项已标明排除）
- Any deletion, downgrade, deferral, compatibility retention, or boundary change is marked as pending confirmation: 已全部用户确认（删推荐top/删 Panorama/删空壳富分析/confirm 收紧/逃生阀删除/前端减法/控制器领域排除）——见 requirement design「Resolved Decisions」
