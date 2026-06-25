# Alembic Recipe 产物化·覆盖·质量优化 — Original Plan

Date: 2026-06-25
Design Key: alembic-recipe-productization-optimization-2026-06-25
Source Window: Design
Status: ready-for-intake

## 背景

Codex 对 BiliDili 真实 plan→冷启动生成 43 条 Recipe。深度分析发现:生成质量很高(系统自评全 grade A、refs 0 缺失、逐字源码、深层洞见),但**生成之后的产物化整段没发生**——43 条全卡 staging 永不晋级、未合成任何 Skill、覆盖只到下限 3、本地千问 embedding 未接通。根因已 grounded 到代码:晋级/进化执行器(StagingManager/LifecycleStateMachine/ProposalExecutor)全部零调用方(daemon 按 PDR-3 删除后无接替),dimension_complete 未调用导致 0 skill,覆盖只有 floor 硬门禁无 target/完整性检测。

## 用户目标

让宿主 Agent 冷启动产出的高质量 Recipe **自动产物化为可消费知识**:自动晋级 active、合成维度 Skill、覆盖推向 target 并不漏核心 pattern、接通本地千问语义层。提高 Recipe 的**覆盖与质量的可用性**(而非单条质量——单条已达标)。

## 范围

- AlembicCore:lifecycle/staging/evolution 晋级执行器接线、embed provider、死配置。
- AlembicPlugin:tick-on-tool-access 驱动、host-agent 流程/briefing、覆盖完整性 critic、配置/文档、质量校验。
- Test:BiliDili 真机一轮冷启动产物化 e2e。
- 不含:重新引入 daemon;放松证据门禁/生成质量地板;硬 target-5 凑数。

## 完成定义

1. 高置信 grade-A staging recipe 在 daemon-less 下自动晋级 active + 记录 lifecycle 事件;
2. 每完成维度合成 SKILL.md,skillCount 反映真实;
3. 覆盖推向 target 5 + 每维未覆盖重要 pattern 检测,核心规则不漏;
4. 本地千问 embedding 接通(语义检索/去重可用),死配置删除或接通;
5. do/dont 统一英文 + ✅/❌ 一致;真机 e2e 跑通。

## 阶段候选

P1 产物化驱动(晋级)→ P2 Skill 合成入流程 → P3 覆盖完整性 critic → P4 千问向量接通 → P5 质量打磨 → Test e2e。

## 待决策(intake confirm)

- P1:晋级驱动机制 = opportunistic tick-on-tool-access(推荐,无 daemon)vs 显式工具 vs 轻量调度。
- P3:覆盖 = 完整性 critic(推荐)vs 硬 target-5 gate。
- P4:千问形态 = Ollama 路径(零代码)vs DashScope/OpenAI 兼容 endpoint(新增 provider);死配置删除 vs 接通。

## 非目标

不重引 daemon;不放松门禁/质量地板;不硬 target-5 凑数;critic 不臆造 pattern。

## 详细设计

见 [requirement design](alembic-recipe-productization-optimization-2026-06-25.md)(开发者决策级,每项 file:line + 分阶段验收)。互补于 [alembic-coldstart-chain-repair-2026-06-25](alembic-coldstart-chain-repair-2026-06-25.md)。
