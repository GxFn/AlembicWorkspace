# Alembic 主体 Recipe 生命周期适配 — Original Plan

Date: 2026-06-26
Design Key: alembic-mainbody-lifecycle-adaptation-2026-06-26
Source Window: Design
Status: ready-for-intake

## 背景

刚完成的几轮需求是 AlembicPlugin 宿主插件侧的 Recipe 生命周期(plan→coldStart/deepMining/moduleMining/evolution),AI = host agent(Claude Code)。现需把这套适配到 Alembic 主体——主体 AI 是进程内 `@alembic/agent`,`plan` 作为主体 AI Agent 新增正交组件、作为 coldStart 等链路前置。6-agent 主体真实架构勘探(file:line 核验)确认:主体只有 coldStart+rescan 两链、维度硬编码全量、Core 已 owner plan 契约但主体零消费、主体是 Core evolution 内核的运行宿主、与 Plugin 同一 alembic.db。

## 用户目标

把 Plugin 已落生命周期按主体真实代码适配;plan 作主体 AI Agent 正交前置组件(独立 AgentProfile+run wrapper,由主体 lib caller 编排,不耦合 bootstrap stage);deepMining/moduleMining 在主体补真实载体;evolution 维护在主体 daemon 补缺口(复用 Core 内核)。

## 范围

- 拥有:主体侧适配(in-process plan 自决非回填)、plan 正交组件、deepMining/moduleMining 主体载体、evolution 缺口补接。
- 不拥有:不重做 Plugin host-agent-workflows;不重写 Core evolution 内核与 plan 契约;Plugin 伞形结论沉淀 Core 则主体直接复用。
- 跨仓:AlembicCore(若需 applyPlanSelection 投影)+ AlembicAgent(plan profile/run)+ Alembic 主体(接线)。
- 依赖:Core post-umbrella HEAD 先落。

## 完成定义

见 [requirement design](alembic-mainbody-lifecycle-adaptation-2026-06-26.md) CD-1..CD-6。核心:plan 组件存在并可跑通产 PlanSelection → 前置接线维度驱动 → 四链映射 → 正交不耦合 → 同 schema 贯通 → 真机验收。

## 阶段候选

(若需)Core 补 applyPlanSelection 投影 → AlembicAgent 落 plan profile/run → 主体接线 coldStart 前置→deepMining→moduleMining→evolution 缺口 → 真机验收。严格 producer/consumer 顺序。

## 决策(已闭合 2026-06-26)

PD-1..PD-10 全部用户裁定(见 requirement design 决策表):plan 持久层=无状态 / 形态=单段 run / Capability=先 profile-only / deepMining 载体=参数化 rescan+复用 Core 覆盖账本 / **触发权=硬 gate(plan 失败即阻断、不回退全量、surface AI 失败,覆盖软回退建议)** / 同 db=共用 / Core 投影=补共享 applyPlanSelection / scale=双轨共存(token floor 不放松)/ dimensionIds=显式>plan / 多轮=单 job 内循环。需求可 deliver。

## 非目标

不重做在途 Plugin 伞形;不重写 Core 内核/契约;不放松 evidence-gate/evaluateMerge/transition Guard;不动落库 schema。

## 详细设计

见 requirement design(strict,主体真实架构 map + plan-as-Agent 组件设计 + 分阶段 file:line + 跨仓职责 + PD-1..10 + R1..7)。
