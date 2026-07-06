# host-agent Recipe 提交指引与门禁对齐优化 — Original Plan

Date: 2026-06-29
Design Key: alembic-recipe-authoring-guidance-optimization-2026-06-29
Source Window: Design
Status: ready-for-intake

## 背景

整体 Alembic 项目空间冷启动真机跑通时，host-agent（含子代理）提交 Recipe **打回次数过多**：每条 candidate 要在严格门禁上来回试错好几轮才过；且最终 `content.markdown` 都很**薄**（文档度 ~0.65），失去了"项目特写"丰富格式。3-agent 真实代码核验 + 第一手提交证据确认根因。

## 用户目标

新建优化需求：把 **host-agent 看到的提交指引** 写清楚 **所有真实门禁约束** + **之前的打回失败模式** + **content.markdown 富「项目特写」契约**，并**提供一个完整可过门的范例**，让 agent **一次过门**、且产出**丰富文档**的 Recipe，而不是逆向试错 + 凑到 floor 即止。

## 根因（真实代码 + 第一手证据）

1. **真门禁散落 2 仓 4+ 文件 2 层，与指引脱节**：host-agent `alembic_submit_knowledge` 经 `AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts:151` 跑 **3 段门**——① content-quality（`recipe-content-quality-gate.ts`：doClause 动词闭合白名单 + ✅/❌ 检测器）② evidence（`recipe-evidence-gate.ts`：snippet 归一化匹配 / ≥3 distinct FILES / sourceRef 行号 / graph-ref；**仅 bootstrap session 在场触发=冷启动专属**）③ Core 字段/reasoning（`AlembicCore/.../UnifiedValidator.ts`：markdown≥200/代码块/whyStandard+sources）。**这些真门禁的具体规则没完整、准确地 surfaced 在 agent 指引里** → agent 逆向试错。（连两路独立调查都对"哪些被 gated"产生矛盾，正证散落之严重；第一手提交证据=收到 `DO_CLAUSE_NON_IMPERATIVE`/`SNIPPET_MISMATCH`/`INSUFFICIENT_EVIDENCE`/`SOURCE_REF_LINE_MISSING` 决定性证明门确实跑。）
2. **完整范例缺失在冷启动路径**：全 V3 范例 `EXAMPLE_TEMPLATES`（`AlembicCore/.../MissionBriefingSupport.ts:106-213`）只在 Core MissionBriefingBuilder 路径、且只覆盖 objectivec/typescript/python（其余落 `_default` 桩）；**host-agent 冷启动走的 Plugin `cold-start.ts` 路径不注入它** → agent 只看到逐字段规则，无端到端可过门样板。
3. **content.markdown 薄**：指引说"项目特写"但只给 ≥200 floor；agent 优化到 floor 即止。且 ✅/❌ 真规则只是"两标记各自所在行后 ≥4 字符"（`recipe-content-quality-gate.ts:212-217`，**不要求平行/紧邻**），agent **误诊为需平行→主动削短 markdown**。文档度（contentDepth，`QualityScorer.ts:151-188`，非阻塞）奖励 标题/代码块/列表/长度≤800/rationale/whyStandard——这些**富文档杠杆没作为目标 surfaced**。

## 范围

- 拥有：AlembicPlugin（host-agent 冷启动指引 builder：`cold-start.ts` 的 submitKnowledgeContract/submissionSpec、`OnboardingContract.ts` fieldFloors、`mcp-tools.ts` 描述）+ AlembicCore（MissionBriefingBuilder/DimensionSop/StyleGuide/MissionBriefingSupport/FieldSpec 指引串与范例；门禁常量/谓词的单源抽取）。
- 不拥有：不放松/不改门禁判定本身（门禁是反 fab 安全网，保持）；不改 V3 字段语义；不改 recipe 存储/打分权重。
- 跨仓：AlembicCore + AlembicPlugin + 主体/AlembicAgent（CG-4 全路径 in-process parity）。

## 完成定义

见 [requirement design](alembic-recipe-authoring-guidance-optimization-2026-06-29.md)。核心：host-agent 冷启动收到的指引①完整准确枚举每条**被强制**的门禁规则（动词白名单原文、snippet 归一化匹配语义、≥3 distinct FILES、sourceRef 行号格式、✅/❌ 真规则、reasoning 必填、markdown≥200+代码块、relationship→graphRef 触发词）②含 content.markdown 富「项目特写」结构契约 + 文档度杠杆为目标③列出常见打回失败模式与规避④在**冷启动路径**注入一个**完整可过门的富范例**（按项目真实语言）；real 验证=新冷启动一次过门率显著提升、抽样 recipe 文档度明显高于 0.65。门禁不放松。

## 阶段候选

P1（核验门禁真值 + 把全约束目录 mirror 进冷启动指引）→ P2（content.markdown 富契约 + 文档度杠杆 + ✅/❌ 真规则订正）→ P3（完整范例注入冷启动路径 + 按真实语言）→ P4（单源 spec：抽门禁常量/谓词为共享 spec 供指引读 + drift 测）→ P5（真机：重跑一维度，验一次过门 + 富文档）。

## CG 决策（✅ 全已决 2026-06-29）

- CG-1 = **抽门禁常量/谓词为共享 spec 供指引生成 + drift 测**（防漂移，全路径使能器）。
- CG-2 = **复用 Core `EXAMPLE_TEMPLATES` 接进各路径 + 补真实语言**。
- CG-3 = **仅订正指引说清真规则**（门禁不放松）。
- CG-4 = **覆盖全提交路径**（cold-start + deepMining/moduleMining + in-process 主体），非仅冷启动 ⇒ 范围扩到 Plugin+Core+主体/AlembicAgent。

## 非目标

不放松门禁；不改 V3 字段语义/打分权重；不重做已成功的需求；push/发版用户门。

## 详细设计

见 requirement design（strict）：3-agent + 第一手证据的门禁真值 + 指引-vs-门禁脱节表 + 完整范例缺口 + F-1~F-5 修复 + 分阶段验收 + CG + 风险。
