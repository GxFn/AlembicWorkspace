# Alembic Recipe 全生命周期走通与优化 — Original Plan(伞形)

Date: 2026-06-26
Design Key: alembic-recipe-lifecycle-global-2026-06-26
Source Window: Design
Status: ready-for-intake

## 背景

用户要求:按 plan→完整冷启动的链路,验证检查深度扫描(deepMining)、模块扫描(moduleMining)、进化(evolution)的完整链路,修复问题、升级优化,把"生成 Recipe + 维护 Recipe"的整体需求在真实 BiliDili 走通,并全局统筹、职责明确。17-agent workflow 全链路测绘 + 对抗核验得 49 confirmed 问题 + 覆盖矩阵。真机基线:整条生命周期从未在 BiliDili 跑过全维+全 stage+evolution(仅 3 active recipe、0 proposal/semantic_memory)。

## 用户目标

BiliDili 真机端到端跑通 全 14 维 coldStart → deepMining 深扫 → moduleMining 分模块 → evolution 触发/执行,各 stage 产可核 DB 证据;并把 deepMining"深"、moduleMining"分模块"、evolution 衰减触发+OUTCOME 质量、rescan 内容级保鲜这些在途未覆盖部分补齐;全局统筹 4 个需求职责边界与排序。

## 范围

- 伞形**只拥有**:deepMining/moduleMining 深与分模块语义、evolution 衰减触发器与 OUTCOME 质量、rescan 内容级保鲜、跨维+全 stage 真机端到端、全局编排。
- **不重做**(归在途):晋级器/checkTimeouts/proposal 执行触发器(followup)、coldStart 单维产物化/embed(productization)、bootstrap 生成链(coldstart-repair)、维度选择权(plan-no-guess)。
- 跨仓:AlembicCore + AlembicPlugin + Test。

## 完成定义

见 [requirement design](alembic-recipe-lifecycle-global-2026-06-26.md)。核心:U0 重基线 → U1 moduleMining 心脏 → U2 deepMining 深 → U3 rescan 预算化 → U4 衰减触发 → U5 evolution OUTCOME 质量 → U6 rescan 内容保鲜 → U7 全维全 stage 真机端到端;门禁全程不放松。

## 阶段候选

U0 重基线/验证基座 → U1 moduleMining 心脏(可独立先行)→ U2 deepMining 深(含决策)→ U3 输出预算化(依赖 coldstart P2)→ U4 衰减触发(依赖 followup F1)→ U5 OUTCOME 质量(前置 followup F2b/P3)→ U6 内容保鲜(依赖 productization P4 + followup P3)→ U7 真机端到端。

## 待决策(intake confirm)

- deepMining "深"的定义(detail/符号深度/SOP);depthLevels 驱动 vs 退役;deepMining 是否=增量保留式重扫。
- rescan 内容级保鲜的源文件指纹方案。

## 非目标

不重做在途已覆盖工作;不放松进化/生命周期判定门禁;intake 前须以当前 main 重核在途 stale 描述。

## 详细设计

见 requirement design(strict,49 问题覆盖矩阵 + U0-U7 file:line + 全局排序协调)。前置 3 在途需求 + 平行 plan-no-guess-correction。
