# Recipe 生命周期伞形 真实验证 + 残留修复 follow-up — Original Plan

Date: 2026-06-26
Design Key: alembic-recipe-lifecycle-realverify-residual-followup-2026-06-26
Source Window: Design
Status: ready-for-intake

## 背景

伞形 [[alembic-recipe-lifecycle-global]] 已 COMPLETE+ARCHIVED(总控 Node22 真核验接受,代码全闭合落 main,基线 Core@74387b2/Plugin@8a44368)。但 Design 独立 spot-check 实证两块真实未达:① 真 BiliDili(02a25032)DB 仍基线(knowledge_entries=3/proposals=0/semantic_memories=0,coverage_ledger·deep_mining_rounds 表不存在)——整条生命周期在真实项目上 0 次端到端真产出(验证全在忠实副本);② 8 携带观察项残留。用户要:真实验证(真跑真产出)+ 残留修复,交 codex host-agent。

## 用户目标

在真 BiliDili 上真跑通生命周期、产真实有价值 recipe(anti-fabrication 真拦、覆盖账本真填、evolution 真维护、semantic_memories 真落),修 8 残留;codex 驱动真机生成。

## 范围

- 拥有:真机端到端真生成验证(RV-1~5)+ 8 残留闭环(RF,RF-2 F-B→Design 重设计)。
- 不拥有:不重做伞形已闭机制实现;不重设计 F-B 量纲(Design 输入)。
- 跨仓:Core + Plugin + codex 真机执行。

## 完成定义

见 [requirement design](alembic-recipe-lifecycle-realverify-residual-followup-2026-06-26.md)。核心:真 DB 出 coverage_ledger/deep_mining_rounds + 全维 recipe 经 anti-fab 门禁真产出 + deepMining 多轮填账本 + evolution 真维护(checkpoint advance/proposal 0→1) + semantic_memories 真落(Ollama) + 8 残留闭环;真机证据,不接受忠实副本替代。

## 阶段候选

RV(真机生成验证,codex,须先定真 DB 授权 vs 沙箱真生成)→ RF-3~8(codex Core/Plugin 直修)→ RF-1(Core pathsOverlap)→ RF-2(F-B→Design 重设计,不入 codex 直修)。

## 待决策(intake confirm)

CG-1 真机授权(改真 02a25032 vs 隔离沙箱真生成)/ CG-2 Ollama 形态 / CG-3 RF-7 fullMapRef 修 vs 记录 / CG-4 RF-2 F-B 是否同出 Design 草案。

## 非目标

不重做伞形机制;不在只读忠实副本上「再验证一遍机制」(本职是真生成);不误把 F-B 量纲交 codex 直改;push/发版仍用户门。

## 详细设计

见 requirement design(strict,验收审计结论 + RV 真机链路 + RF 8 残留分类路由 + codex 执行模型 + CG + 风险)。
