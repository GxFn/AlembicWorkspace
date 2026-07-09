# Demand Chain Ledger（需求链总账）

Status: authoritative past-demand index（唯一权威总账）
Maintained Window: AlembicWorkspace controller
Created: 2026-07-09（backfilled from 24 archived state roots + active index narratives）

**这是什么**：每个已归档 demand 一行——完成日期、结论、归档位置、设计来源。Agent（Codex / Claude Code）
要了解「过往需求开发链路」，**从这里开始**，不要翻月度目录或旧叙事。

**怎么用**：
1. 按波次（Wave）倒序浏览，最近的工作在最上面；波内按时间正序讲故事。
2. 每行的 demand 链接指向归档目录（内含 `wakeflow-state.json` 权威终态、`developer-progress.md`
   执行时间线、task-packages/ 与 target-results/ 原始证据）。深读证据走那里。
3. 设计来源列：`design/` 前缀 = requirement-designs 下的独立设计目录；`in-archive` = 设计材料
   （original-plan / requirement-design）随归档目录自带；`—` = 由 TODO 行直接驱动的小需求。
4. **活跃需求不在本账**：当前工作看 [.wakeflow-active/index.md](../../.wakeflow-active/index.md)。
5. 维护规则：每次 `archive-demand` 后，控制器在对应波次（或新开波次）**追加一行**。本账只追加、
   不重写历史行；行内结论如需修正，注明修正日期。

**归档规律**：2026-07 起归档自带 spine（`archive-summary.md` + `demand.json` 含 designKey 出处）；
2026-06 及更早的归档无 spine（早于该机制），本账即其补充索引。部分早期归档为 redacted copy，
未脱敏原件按 storage 惯例保全在 `.wakeflow-local/preserved*`（权威视图 = `wakeflow_view scope=storage`，
gitignored、仅本机审计）。

---

## Wave E — Panorama 重建与遗留收口（2026-07）

| 完成 | Demand | rev | 结论 | 设计来源 |
| --- | --- | --- | --- | --- |
| 07-07 | [alembic-panorama-rebuild-2026-07-03](archive/2026-07/alembic-panorama-rebuild-2026-07-03/) | 74 | 重建 Alembic Panorama 全景页面：忠实恢复老 4 标签 UI / 14 角色标签 / 16 panel。首个带完整归档 spine（archive-summary + provenance）的需求 | in-archive |
| 07-09 | [alembic-proactive-activation-2026-07-03](archive/2026-07/alembic-proactive-activation-2026-07-03/) | 41 | 双宿主主动激活链（CC skill 发现/消费/managed-block/冷启动同步/接入引导）：P0–P3 共 8 包逐一验收；P4 双宿主真机验收**未执行**，按用户 2026-07-09 遗留整理决定记诚实 blocked 终态并 accept-blocked 行政性收口。残余风险在终态结果上（回归需新需求重跑 P4 场景） | [design/current](../../Design/docs/current/alembic-proactive-activation-2026-07-03.md) |

## Wave D — 收尾与保真借鉴（2026-06-29 ~ 06-30）

| 完成 | Demand | rev | 结论 | 设计来源 |
| --- | --- | --- | --- | --- |
| 06-29 | [alembic-plan-space-membership-scoping-2026-06-29](archive/2026-06/alembic-plan-space-membership-scoping-2026-06-29/) | 76 | 删除 Alembic 全部 workspace.config.json 代码逻辑，Space 成员判定改用原生 ProjectScope | in-archive |
| 06-30 | [alembic-recipe-authoring-guidance-optimization-2026-06-29](archive/2026-06/alembic-recipe-authoring-guidance-optimization-2026-06-29/) | 61 | P0–P5 全接受：canonical RecipeAuthoringSpec（Core domain/knowledge）驱动 validateAgainst + renderGuidance；front-load 完整契约 + 过门富范例；P5 真机冷启动验收通过 | in-archive |
| 06-30 | [alembic-agent-cc-scratch-borrow-2026-07-01](archive/2026-06/alembic-agent-cc-scratch-borrow-2026-07-01/) | 16 | claude-code-from-scratch 3 项保真借鉴入 AlembicAgent：A-1/A-1b 截断 head+tail、A-2 recall-memory 保鲜、B-1 write-before-freshness 门（shared-ctx 硬门由 host-wiring 静态证明关闭）；A-3 缓 | in-archive |

## Wave C — Recipe/主体生命周期架构重构（2026-06-26 ~ 06-28）

| 完成 | Demand | rev | 结论 | 设计来源 |
| --- | --- | --- | --- | --- |
| 06-26 | [alembic-recipe-lifecycle-global-2026-06-26](archive/2026-06/alembic-recipe-lifecycle-global-2026-06-26/) | 84 | 伞形：plan→coldStart/deepMining/moduleMining 生成 + evolution 维护整合为 Recipe 全生命周期，全 24 目标接受（U1–U7+UM） | in-archive |
| 06-26 | [alembic-recipe-lifecycle-realverify-residual-followup-2026-06-26](archive/2026-06/alembic-recipe-lifecycle-realverify-residual-followup-2026-06-26/) | 72 | 伞形 COMPLETE 后真 BiliDili 端到端真跑补验，residual 清偿 | in-archive |
| 06-27 | [alembic-mainbody-lifecycle-adaptation-2026-06-26](archive/2026-06/alembic-mainbody-lifecycle-adaptation-2026-06-26/) | 63 | plan 成为主体 AI Agent 正交前置组件（新 AgentProfile + runPlanAgent，方案 A） | in-archive |
| 06-27 | [alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26](archive/2026-06/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/) | 94 | 主体适配 A–F 的 post-archive 假完成修复；最后一个 Test blocker 保留为终态证据，**用户裁定行政性完成**（administratively completed） | in-archive |
| 06-27 | [alembic-agent-terminal-tools-enhancement-2026-06-26](archive/2026-06/alembic-agent-terminal-tools-enhancement-2026-06-26/) | 54 | 主体 Agent 终端工具端到端打通（code.* + terminal.exec 真 Seatbelt） | in-archive |
| 06-28 | [alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26](archive/2026-06/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/) | **272** | 跨四仓 Recipe 生命周期架构重构（语义命名 + 文件夹隔离 + 功能层级下沉/上浮），链尾需求；最终真 BiliDili parity diffEmpty=true、freeze 零漂移、CG-5 绿。**本工作区最大单需求（rev 272）** | in-archive |
| 06-28 | [alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28](archive/2026-06/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28/) | 30 | 母重构 COMPLETE+push 后的 residual 清偿 | in-archive |

## Wave B — 冷启动闭环与 daemon-less 自动化（2026-06-25）

| 完成 | Demand | rev | 结论 | 设计来源 |
| --- | --- | --- | --- | --- |
| 06-25 | [alembic-coldstart-chain-repair-2026-06-25](archive/2026-06/alembic-coldstart-chain-repair-2026-06-25/) | 66 | 宿主 Agent 冷启动 plan→bootstrap→submit→Recipe 全链路闭环修复；active-session MCP stale 定性为宿主刷新/缓存边界（非产品范围） | in-archive |
| 06-25 | [alembic-lifecycle-automation-followup-2026-06-25](archive/2026-06/alembic-lifecycle-automation-followup-2026-06-25/) | 44 | PDR-3 删 daemon 后的孤儿自动化补全（tick 有界化 + F-A re-entrancy 修复）；Test 真运行时 e2e PASS。残留：F-B 转 Design、P4 vendor 用户门、checkTimeouts 观察项 | in-archive |
| 06-25 | [alembic-recipe-productization-optimization-2026-06-25](archive/2026-06/alembic-recipe-productization-optimization-2026-06-25/) | 59 | 冷启动高质量 Recipe 自动产物化：staging→active 自动晋级、生命周期事件、语义记忆/搜索、Ollama embedding，P5 质量从原始 Test 工件证明 | in-archive |

## Wave A — Plan/Recipe 权威化与 no-guess 纠偏（2026-06-21 ~ 06-24）

| 完成 | Demand | rev | 结论 | 设计来源 |
| --- | --- | --- | --- | --- |
| 06-22 | [alembic-recipe-evolution-optimization-2026-06-21](archive/2026-06/alembic-recipe-evolution-optimization-2026-06-21/) | 100 | Recipe 生成体系系统化重构：ProjectContext → Plan → Recipe 链路成形 | in-archive |
| 06-22 | [alembic-plan-authoritative-complete-plan-repair-2026-06-22](archive/2026-06/alembic-plan-authoritative-complete-plan-repair-2026-06-22/) | 6 | alembic_plan 权威完整计划语义修复 | in-archive |
| 06-22 | [alembic-recipe-plan-no-guess-correction-2026-06-22](archive/2026-06/alembic-recipe-plan-no-guess-correction-2026-06-22/) | 77 | Recipe 生成一致性纠偏：Plan 全权威、no-guess（相关历史审计：[gpt55-fabrication-audit](../requirement-designs/alembic-recipe-evolution-gpt55-fabrication-audit/)，仅证据不作执行根） | in-archive |
| 06-23 | [alembic-plan-draft-pure-collection-2026-06-23](archive/2026-06/alembic-plan-draft-pure-collection-2026-06-23/) | 32 | alembic_plan draft 重设计为纯收集（Pure-Collection） | in-archive |
| 06-23 | [alembic-recipe-no-guess-residual-gap-closure-2026-06-23](archive/2026-06/alembic-recipe-no-guess-residual-gap-closure-2026-06-23/) | 14 | no-guess residual 缺口闭合（B1/B2 + F5 + G3 + J 等） | in-archive |
| 06-24 | [alembic-plan-stateless-precondition-contract-2026-06-24](archive/2026-06/alembic-plan-stateless-precondition-contract-2026-06-24/) | 48 | alembic_plan 成为每次调用前的无状态前置契约 | in-archive |

## Wave 0 — 基建与边界（2026-06-19 ~ 06-21）

| 完成 | Demand | rev | 结论 | 设计来源 |
| --- | --- | --- | --- | --- |
| 06-20 | [alembic-agent-pcv-observe-only-boundary-2026-06-20](archive/2026-06/alembic-agent-pcv-observe-only-boundary-2026-06-20/) | 37 | AlembicAgent PCV/PCVM 收敛为 observe-only 边界 | in-archive |
| 06-20 | [alembic-plugin-dual-host-architecture-refactor-2026-06-19](archive/2026-06/alembic-plugin-dual-host-architecture-refactor-2026-06-19/) | 75 | AlembicPlugin 双宿主（Codex + Claude Code）架构重构 | [design/alembic-plugin-claude-code-host-support](../requirement-designs/alembic-plugin-claude-code-host-support/) |
| 06-21 | [alembic-core-capability-inventory-optimization-2026-06-19](archive/2026-06/alembic-core-capability-inventory-optimization-2026-06-19/) | 53 | Alembic Core 能力盘点与接口优化 | in-archive |
| 06-21 | [alembic-0.3.0-release-wave-2026-06-13](archive/2026-06/alembic-0.3.0-release-wave-2026-06-13/) | 13 | Alembic 0.3.0 发布波（R-group 成员 1）——**publish HELD**（发布扣发为用户门） | [design/alembic-0.3.0-release-wave](../requirement-designs/alembic-0.3.0-release-wave/) |

## 早期压缩史（≤ 2026-06-18，rollup 形式保留）

早期约百余 state root 已按组压缩归档，逐 demand 明细不再展开；按组入口：

| 组 | 入口 | 结论 |
| --- | --- | --- |
| AFAPI 08–12 | [afapi-completed-demands](archive/2026-06/afapi-completed-demands/) | Agent-facing public API 重设计完成组（含最终 revisions、控制器结论、证据图）；AFAPI 01–07 上游完成未重建。设计：[design/plugin-agent-facing-public-api-redesign](../requirement-designs/plugin-agent-facing-public-api-redesign/) |
| RC0–RC7 冗余清理 | [final-acceptance-archive-2026-06-12](../requirement-designs/alembic-redundancy-stale-logic-cleanup/final-acceptance-archive-2026-06-12.md) | 八需求清理序列：五仓终门全绿 + 双侧严格漂移门；7 个结构性负债候选进 RC6 register 作未来需求 |
| CO0–CO5 Core 强化 | [final-acceptance-archive-2026-06-12](../requirement-designs/alembic-core-comprehensive-optimization/final-acceptance-archive-2026-06-12.md) | 六需求强化序列：公共面 140→126、lint 强制层契约、7 处静默→响亮失败语义修复、测试地板 +65 套件（发现并修复 1 个真实数据缺陷） |
| 2026-06-13 需求普查 | [current-demand-rollup](archive/2026-06/current-demand-rollup/) | R-group 收尾后全工作区普查：103 个 completed state root 快照 |
| 文档类归档 | [2026-06 月度索引](archive/2026-06/index.md) | four-tool-plugin-cleanup-sequencing / graph-recipe-map-projectcontext-recipe-mounting / main-capability-inventory-cleanup / plugin-core-responsibility-interface-cleanup / scratch-decisions（doc-only 归档，非 demand state root） |

---

## 与其它记录的关系

- [workspace-record-map.md](workspace-record-map.md)：长期入口地图（本账是其「需求完成记录」的权威明细）。
- [archive/&lt;YYYY-MM&gt;/index.md](archive/)：月度文件图（一句话 + 链回本账）。
- [../requirement-designs/](../requirement-designs/)：独立设计目录（README 有设计索引与反向链）。
- 活跃需求与当前状态：[.wakeflow-active/index.md](../../.wakeflow-active/index.md)（单一活跃入口）。
