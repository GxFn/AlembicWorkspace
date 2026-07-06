# Alembic Recipe 生成规则/契约/示例 单源模块化（canonical RecipeAuthoringSpec）+ host-agent 指引门禁对齐 — Requirement Design (strict)

> **2026-06-29 需求升级**：从"修补散落指引"升级为**架构级单源模块**——把完整 Recipe 生成规则+契约+全面说明+完整示例汇总为一个**独立、解耦、通用**的 `RecipeAuthoringSpec` 模块（Core `domain/knowledge/recipe-authoring-spec/`，经 `@alembic/core/knowledge` 暴露），服务整个 Alembic 项目所有提交路径（gate 校验/指引生成/示例全由它驱动）。**§9–§11（§A 模块设计 / §B 代码级 P0-P5 实现指导 / §C critique 修正与决策）为权威实现方案**；§1-§8 为问题诊断与早期 F-1~F-5（被 §9-§11 的 canonical-module 方案吸收）。

Date: 2026-06-29
Design Key: alembic-recipe-authoring-guidance-optimization-2026-06-29
Source Window: Design
Status: ready-for-intake
Repos: AlembicPlugin（host-agent 指引 builder：cold-start + deepMining/moduleMining）+ AlembicCore（指引串/范例/门禁常量单源 spec）+ Alembic 主体/AlembicAgent（in-process 提交路径指引 parity）

> **CG 全已决（2026-06-29，详见 §6）**：CG-1=抽共享 spec 生成指引+drift 测；CG-2=复用 `EXAMPLE_TEMPLATES` 接线+补语言；CG-3=仅订正指引（门禁不放松）；**CG-4=覆盖全提交路径（cold-start + deepMining/moduleMining + in-process 主体），非仅冷启动**。CG-1 的单源 spec 正是 CG-4 全路径的使能器：一个共享 spec 喂所有路径的指引。范围因 CG-4 扩到 Plugin+Core+主体/Agent。

---

## 1. 症状（真实场景）

整体 Alembic 项目空间（ecf32806）host-agent 冷启动真机跑通时，提交 Recipe **打回次数过多**——每条 candidate 在严格门禁上来回试错多轮才过（实测一个子代理为 5 条 ts-js-module recipe 迭代了 ~14 分钟）。且最终 `content.markdown` 都很**薄**（一条 grade-B recipe 文档度=0.65，三项最低），失去了之前的"项目特写"富格式。

## 2. 门禁真值（第一手证据 + 3-agent 核验，含矛盾订正）

> **方法论说明（重要）**：两路独立 Core 调查对"哪些规则被 gated"产生**直接矛盾**——一路（A）追到 Plugin tool-router 3 段门确证 doClause/snippet/evidence 真拦；另一路（B）只追 Core `service/knowledge` 路径，结论"这些都是 guidance-only 未 gated"。**第一手提交证据决定性证明 A 对**：提交时实收 `DO_CLAUSE_NON_IMPERATIVE` / `SNIPPET_MISMATCH` / `INSUFFICIENT_EVIDENCE` / `SOURCE_REF_LINE_MISSING` 错误串——这些门确实在跑。B 漏了 Plugin 外层包装（只看到内层 Core gateway=stage 3）。**连专家调查都搞混"哪条规则在哪被强制"，本身就是本需求要解决的散落问题的铁证。**

### 2.1 真正被强制的门（host-agent `alembic_submit_knowledge` 路径）

入口 `AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts:151` `routeSubmitKnowledgeTool`，**3 段顺序门，任一失败短路**（`:162-189`）：

| 段 | 门 | 文件:line | 规则（实测/核验） |
|---|---|---|---|
| ① content-quality | `DO_CLAUSE_NON_IMPERATIVE` | `recipe-content-quality-gate.ts:28-74`(白名单)/`:158-170`(判定) | doClause 首词须 ∈ **闭合白名单** `POSITIVE_IMPERATIVE_VERBS`(add/align/bind/build/call/check/cite/collect/compare/configure/copy/create/derive/dispatch/ensure/expose/fetch/follow/guard/handle/include/inject/keep/load/map/normalize/pass/prefer/preserve/query/read/record/reject/require/resolve/return/route/run/select/store/submit/update/use/validate/write)。**reference/append 不在内→拒**。dontClause 用 NEGATIVE 集，`do` 须接 `not`。 |
| ① | ✅/❌ 检测器 `CONTENT_CONTRAST_MISSING` | `recipe-content-quality-gate.ts:212-217` | `content.markdown` 须**同时**含 `✅` 与 `❌`，**且每个标记所在行其后 ≥4 非空字符**。**不要求平行/紧邻**（agent 此前误诊→削短，是错的）。 |
| ② evidence（**仅 bootstrap session/dimensionId 在场=冷启动触发**） | `SNIPPET_MISMATCH` | `recipe-evidence-gate.ts:709-738` | coreCode（或 content.pattern/首个代码块）须与某 cited sourceRef 行号区间**空白+注释归一化后**匹配（substring 或逐"显著行"顺序子序列；非纯逐字，但实务上逐字最稳）。`looksLikePlaceholder`(foo/bar/TODO) 短路 `PLACEHOLDER_EVIDENCE`。 |
| ② | `INSUFFICIENT_EVIDENCE` | `recipe-evidence-gate.ts:283-319` | rule/pattern：`new Set(validRefs.map(sourcePath))` **distinct FILES** `<3` → 拒（**按文件数非区间数**；同文件 3 区间不算）。可 `scope:"narrow"/"file-local"` 豁免。fact：≥1。 |
| ② | `SOURCE_REF_LINE_MISSING` | `recipe-evidence-gate.ts:510-522` | 每个 sourceRef 须配 `/^(.+?):(\d+)(?:-(\d+))?$/`=路径**带行号**；裸文件拒。 |
| ② | `GRAPH_REF_INVALID` | `recipe-evidence-gate.ts:644-668` | 描述/markdown/whyStandard 含关系词(EN call chain/caller/depends on/impact…；CN 调用链/调用方/依赖/影响路径/上游/下游)即判定为关系声明，须配 graphRef，否则拒。 |
| ③ field/reasoning | markdown<200 / 无代码块或文件引用 / reasoning 必填 | `AlembicCore/.../UnifiedValidator.ts:185-199`、`FieldSpec.ts:147-159` | `content.markdown` ≥200 字符且含代码块或文件引用；`reasoning.whyStandard`(必填)、`reasoning.sources`(非空)。全部被拒→ `tool-router.ts:694-711` `INCOMPLETE_SUBMISSION`「请在单次调用中补齐所有字段」。 |

非阻塞**文档度**=`QualityScorer.ts:151-188` `contentDepth`（权重 0.30）：奖励 markdown 长度(≤800 最优)/`## 标题`/代码块/列表/rationale/whyStandard/来源数。**0.65 即缺这些杠杆**。

### 2.2 指引-vs-门禁 脱节（核心病灶）

agent 看到的指引散在 Plugin `cold-start.ts`(submitKnowledgeContract/fieldFloors `:805/839-843`、preSubmitChecklist `:568/580`)、`OnboardingContract.ts:497-502`(fieldFloors "≥200 chars; ✅/❌ contrast")、`mcp-tools.ts:643`("content.markdown 必须提供项目特写…✅/❌…rationale 必填")，以及 Core `StyleGuide.ts:14`(项目特写)、`DimensionSop.ts:1702-1739`(PRE_SUBMIT_CHECKLIST)、`MissionBriefingBuilder.ts:311-331`(contentQuality "≥200 含##标题/正文/代码块/来源")。**脱节**：

- 指引**没给** doClause 动词白名单原文 → agent 反复撞 `DO_CLAUSE_NON_IMPERATIVE`（"reference/append/map…"全靠猜）。
- 指引**没说** coreCode 须与 cited 行号区间匹配（只说"可复制代码骨架"）→ 反复撞 `SNIPPET_MISMATCH`。
- 指引说"引用具体文件路径和代码行"但**没强调 ≥3 distinct FILES（非区间）+ 每 ref 带行号格式** → 反复撞 `INSUFFICIENT_EVIDENCE`/`SOURCE_REF_LINE_MISSING`。
- ✅/❌ 指引**误导**：写"对比/平行" → agent 削短求平行，而真规则只是"两标记各自行后≥4字符"。
- reasoning 指引只提 whyStandard/sources，对"全部被拒=补齐所有字段"无失败模式提示。

### 2.3 完整范例缺口

全 V3 范例 `EXAMPLE_TEMPLATES`（`AlembicCore/.../MissionBriefingSupport.ts:106-213`，含 ✅/❌+来源+reasoning 的完整 candidate）确实存在，并被 Core `MissionBriefingBuilder.ts:1134-1138/1229-1232` 注入——**但那是 Core 旧 buildMissionBriefing 路径**；host-agent 冷启动走 **Plugin `cold-start.ts` 路径，不注入它**（实测我冷启动只见字段规则，无完整样板）。且范例只覆盖 objectivec/typescript/python，其余落 `_default` 桩（`:188`）。⇒ **冷启动 agent 无端到端可过门富范例可抄。**

---

## 3. 用户目标 / 完成定义

让 host-agent 冷启动收到的提交指引**完整、准确、含范例**，使 agent **一次过门** + 产出**富文档** Recipe：

1. **全约束目录 mirror 真门禁**：冷启动指引完整准确列出每条**被强制**规则——doClause 动词白名单原文、✅/❌ 真规则（两标记各自行后≥4字符，非平行）、snippet 须匹配 cited 行号区间、≥3 **distinct FILES**、sourceRef `path:line` 格式、relationship→graphRef 触发词、reasoning.whyStandard+sources 必填、markdown≥200+代码块。措辞与门禁判定一致（不多不少）。
2. **content.markdown 富「项目特写」契约**：显式结构（`## 标题` + 上下文/在架构哪层 + ✅/❌ 对比 + **为什么**+原理 + 边界场景 + 来源行号），并把**文档度杠杆**（标题/代码块/列表/目标长度 ~500-800）作为**目标**写明（非 floor 即止）。
3. **打回失败模式清单**：把常见拒因（动词不在白名单/coreCode 对不上行号/refs<3 distinct files/ref 缺行号/markdown 太薄/全部被拒补齐字段）写进指引，逐条给规避法。
4. **完整范例注入冷启动路径**：在 host-agent `cold-start.ts` 指引内提供一个**完整可过门的富 V3 范例**（按项目**真实语言**，typescript 优先；不止 obj/py/ts 三种 + _default 桩）。
5. **门禁不放松**：反 fab 安全网保持；本需求只改"agent 看到什么"，不改"门禁判什么"（CG-3 若选升级检测器另议）。

完成定义验证：新冷启动重跑一个维度，**一次过门率显著提升**（打回轮次大降）+ 抽样 recipe **文档度明显 >0.65**（含标题/代码块/列表/富正文）。

---

## 4. 修复设计（分层 F-1~F-5）

- **F-1 [Plugin] 冷启动指引补全约束目录**：在 `cold-start.ts` 构建 submitKnowledgeContract/submissionSpec 处，注入"被强制门禁"完整清单（§2.1 表的规则原文：动词白名单、✅/❌ 真规则、snippet-匹配-cited-行号、≥3 distinct FILES、sourceRef path:line、graphRef 触发词、reasoning 必填、markdown≥200+代码块）。来源见 CG-1（单源 vs 手工 mirror）。
- **F-2 [Plugin+Core] content.markdown 富契约 + 文档度杠杆 + ✅/❌ 订正**：把 `OnboardingContract.ts:502`/`mcp-tools.ts:643`/`MissionBriefingBuilder.ts:320` 的 "≥200 + ✅/❌" 升级为富「项目特写」结构契约（§3.2），✅/❌ 措辞订正为真规则（两标记各自行后≥4字符），并把 contentDepth 杠杆（标题/代码块/列表/~500-800）写为目标。复用/对齐 `StyleGuide.ts:14` PROJECT_SNAPSHOT_STYLE_GUIDE。
- **F-3 [Plugin] 打回失败模式清单**：在指引新增"常见拒因与规避"段（§3.3），逐条拒因→规避法。
- **F-4 [Plugin+Core] 完整范例注入冷启动路径**：把一个完整可过门富范例接进 host-agent `cold-start.ts` 指引（CG-2：复用 Core `EXAMPLE_TEMPLATES` 接线 + 补真实语言 vs 新写）；确保按项目真实语言选取，非 _default 桩。
- **F-5 [Core/Plugin·CG-1] 单源 spec 防漂移**：把行为门禁常量/谓词（`POSITIVE_IMPERATIVE_VERBS`、snippet-匹配语义、`hasMarkerExample` 阈值、≥3-distinct-files、sourceRef 正则、graphRef 触发词集）抽为一个共享 spec（紧邻 `FieldSpec.V3_FIELD_SPEC` 既有单源），指引由它生成 + 加 drift 测，保证"指引≡门禁"永不脱节。

---

## 5. 阶段候选 + 验收

- **P1 [F-1]** 核验门禁真值（先跑通"门禁真在跑哪条"——因调查矛盾，实现首步必须代码级确证）+ 冷启动指引补全约束目录。验收：读 `cold-start.ts` 指引输出含 §2.1 全部强制规则原文；Plugin build/test 绿。
- **P2 [F-2+F-3]** 富契约 + 文档度杠杆 + ✅/❌ 订正 + 失败模式清单。验收：指引含富「项目特写」结构 + 文档度目标 + 拒因规避段；✅/❌ 措辞与 `recipe-content-quality-gate.ts:212-217` 一致。
- **P3 [F-4]** 完整富范例注入冷启动路径 + 真实语言。验收：host-agent 冷启动 briefing 实含一个完整可过门富 V3 范例（typescript），非 _default 桩。
- **P4 [F-5·CG-1]** 单源 spec + drift 测。验收：改门禁常量后 drift 测红、指引随之更新；指引≡门禁。
- **P5 [真机]** 重跑一个维度冷启动（ecf32806，DeepSeek/Qwen）。验收：一次过门率显著升（打回轮次明显降）+ 抽样 recipe 文档度明显 >0.65（含标题/代码块/列表/富正文）。门禁不放松、不破已成功需求。

---

## 6. CG 决策（✅ 全部已决 2026-06-29）

- **CG-1 = 抽门禁常量/谓词为共享 spec 供指引生成 + drift 测**（行为门禁常量：动词白名单/snippet 匹配语义/✅❌阈值/≥3-distinct-files/sourceRef 正则/graphRef 触发词，抽到紧邻 `FieldSpec.V3_FIELD_SPEC` 的共享 spec；所有路径指引由它生成；drift 测保证指引≡门禁）。
- **CG-2 = 复用 Core `EXAMPLE_TEMPLATES` 接进各提交路径 + 补真实语言**（不止 obj/ts/py+_default 桩；按项目真实语言选取）。
- **CG-3 = 仅订正指引说清真规则**（✅/❌ 真规则=两标记各自行后≥4字符不要求平行；**门禁判定不动**，最小改，除"agent 误诊削短"根因）。
- **CG-4 = 覆盖全提交路径（cold-start + deepMining/moduleMining + in-process 主体），非仅冷启动**。⇒ F-1~F-4 的指引修复对全路径生效（由 CG-1 单源 spec 统一喂）；范围扩到 Plugin（cold-start.ts + deepMining/moduleMining 指引）+ Core（单源 spec + 范例 + StyleGuide）+ **主体/AlembicAgent（in-process plan/提交路径指引 parity，与 host-agent 一致）**。F-5 单源 spec 升为**全路径使能器（先行地基）**。

---

## 7. 风险 / 非回归

- **R-门禁不放松（最高）**：本需求改"agent 看到什么"，**不改"门禁判什么"**（除非 CG-3=b 显式授权）。反 fab 安全网保持。
- **R-调查矛盾**：哪条规则在哪被强制，两路调查相左；实现**首步必须代码级确证门禁真值**（以第一手 `DO_CLAUSE_NON_IMPERATIVE`/`SNIPPET_MISMATCH` 等证据为准），勿照搬任一调查结论。
- **R-双路指引**：submissionSpec 有两个并行 builder（`MissionBriefingBuilder.ts:244` vs `DimensionCatalogPayload.ts:178`）+ Plugin `cold-start.ts`——改时确认 host-agent 冷启动实际走哪条、勿只改没用的那条（同 alembic-plan 历史教训）。
- **R-freeze/floor**：不改 V3 字段语义、打分权重、markdown≥200 floor 值。
- **R-范围蔓延**：CG-4=a 先收冷启动闭环，deepMining/in-process 留增量。

---

## 8. 与其它需求关系

- 直接源于整体 Alembic 空间冷启动（[[alembic-plan-space-membership-scoping]] 真机 R1 通过后）的 authoring 体验问题；正交于那个需求的"输入域 scoping"。
- 修好后，整体空间冷启动（及任何 host-agent 冷启动）可一次过门 + 产富 Recipe，真正解决"质量不足/打回多"。


---

## 9. canonical RecipeAuthoringSpec 模块化（2026-06-29 需求升级：用户要求把全规则/契约/说明/示例汇总为独立解耦通用模块）

> 用户升级本需求为**架构级单源模块**：把完整 Recipe 生成规则+契约+全面说明+完整示例汇总为一个**独立、解耦、通用**的 `RecipeAuthoringSpec` 模块，服务整个 Alembic 项目所有提交路径（gate 校验/指引生成/示例全由它驱动）。§9=§A 模块设计、§10=§B 代码级分阶段实现指导、§11=§C critique 修正与决策点。§1-§8 的 F-1~F-5 被本三节的 canonical-module 方案吸收实现。

# SECTION A — The Canonical `RecipeAuthoringSpec` Module Design

## A.1 Module name, exact location, layer placement, dependency-direction proof

**Module name:** `RecipeAuthoringSpec` — the single source of truth for authoring an Alembic Recipe.

**Exact location (Core domain, alongside the existing seed):**
- New consolidating module: `AlembicCore/src/domain/knowledge/recipe-authoring-spec/` (a folder, not one file — see A.2 for the per-section file tree). Its barrel `AlembicCore/src/domain/knowledge/recipe-authoring-spec/index.ts` is the module entry.
- The existing seed `AlembicCore/src/domain/knowledge/FieldSpec.ts` (`V3_FIELD_SPEC` self-declares 唯一权威来源 at `FieldSpec.ts:1-2`) is **kept in place and imported** as the module's `fields` section — zero rename, zero break of its 9 current consumers.

**`@alembic/core` export subpath — reuse the existing stable facade `./knowledge`, do NOT mint a new subpath:**
- `package.json exports` already maps `"./knowledge" → dist/knowledge.js` (confirmed in `package.json`, the `./knowledge` block), and `config/public-api-boundary.json:1177` lists `"./knowledge"` among the 24 stable-public facades. `"./domain/knowledge"` is only "keep-provisional" with `stableRoute: "./knowledge"` (`public-api-boundary.json:1086-1087`, `:1206`). So the canonical export is **`@alembic/core/knowledge`**.
- Re-point: add the `RecipeAuthoringSpec` re-export to the barrel `AlembicCore/src/knowledge.ts` (which today already re-exports the 16 FieldSpec symbols, confirmed lines 1-17) and to `AlembicCore/src/domain/knowledge/index.ts`. A new `./recipe-spec` subpath would add boundary-count churn against `expectedCounts.stable-public: 24` (`public-api-boundary.json:5`) and split a surface `./knowledge` already owns — rejected.

**Layer placement — `domain`, the lowest-coupling layer that every consumer can reach:**
- `config/layer-contract.json:23-26` declares `"domain": ["shared", "types"]` — domain may import only `shared` and `types`. Homing the spec in `domain/knowledge` means the spec **cannot** reach up into host/path/workflow code; any host-specific import inside the spec fails `lint:layer-contract` (a blocking step in `npm run check` per `layer-contract.json:3`). Decoupling is therefore lint-enforced, not merely intended (CG-decoupled).
- The same-layer edge `StyleGuide → FieldSpec` already exists and is legal (`StyleGuide.ts:10` `import { FieldLevel, V3_FIELD_SPEC } from './FieldSpec.js'`), proving the spec's pieces already co-reside without contract violation.

**Dependency-direction proof of NO cycles:**

1. **Core never imports a consumer.** A reverse-edge grep (`@alembic/agent|@alembic/plugin|#agent|#recipe-generation` under `AlembicCore/src`) is empty — Core is a pure root. So *any* consumer importing the spec is acyclic by construction.
2. **All four consumers already depend on Core via `file:../AlembicCore`** and already import the `./knowledge` facade or its siblings today:
   - Plugin stage-3 already imports `getRequiredFieldsDescription` from `@alembic/core/knowledge` at `tool-router.ts:14` — the decoupled cross-repo channel the spec rides **is already in production**.
   - Plugin stage-2 (`recipe-evidence-gate.ts:3`) already imports `@alembic/core/host-agent-workflows` — same upward direction.
   - AlembicAgent already imports `getSystemInjectedFields` from `@alembic/core/knowledge` (`knowledge.ts:12`) and `buildProducerStyleGuide` from it (`insightProducer.ts:18`).
   - Main-body already imports `@alembic/core/knowledge` (`KnowledgeRescanWorkflow.ts:49`).
3. **The one Plugin gate that imports nothing today** — `recipe-content-quality-gate.ts` (zero imports, constants inlined `:24-89`) — gains exactly one new upward import (`@alembic/core/knowledge`), the same direction its sibling `handlers/knowledge.ts:7` already uses. No cycle.

**The one internal move the home choice forces (clean, lint-safe):** `EXAMPLE_TEMPLATES` is pure data at the `workflows` layer (`MissionBriefingSupport.ts:106`, its only import site is `MissionBriefingBuilder.ts:46` — grep-confirmed single consumer). A `domain` module cannot import upward from `workflows`. So `EXAMPLE_TEMPLATES` **moves down** into `recipe-authoring-spec/examples/`, and `MissionBriefingSupport.ts` re-imports it downward (`workflows → domain` is allowed per `layer-contract.json:50-58`). This move simultaneously fixes the CG-2/CG-4 gap because the examples become reachable from `./knowledge`, which the Plugin cold-start path can import.

---

## A.2 Module STRUCTURE — sections and per-section file tree

```text
AlembicCore/src/domain/knowledge/recipe-authoring-spec/
├── index.ts                  # barrel: the public API (A.3); re-exports all sections + the facade fns
├── fields.ts                 # SECTION 1 — re-exports V3_FIELD_SPEC + getters from ../FieldSpec.js (seed, untouched)
├── gate-rules.ts             # SECTION 2 — the behavioral gate constants promoted to data (the heart)
├── content-contract.ts       # SECTION 3 — PROJECT_SNAPSHOT_STYLE_GUIDE + doc-score levers as explicit targets
├── failure-modes.ts          # SECTION 4 — reject-code → avoidance catalog
├── examples/                 # SECTION 5 — gate-passing, multi-language worked examples (moved down from workflows)
│   ├── index.ts
│   ├── objectivec.ts  typescript.ts  python.ts  swift.ts  kotlin.ts  java.ts
│   ├── go.ts  rust.ts  csharp.ts  javascript.ts  ...  _default.ts
└── guidance-generator.ts     # SECTION 6 — renders per-path/per-stage agent-facing guidance FROM the spec
```

### SECTION 1 — `fields.ts` (FieldSpec, seeded from `V3_FIELD_SPEC`)
- Re-exports `V3_FIELD_SPEC`, `FieldLevel`, `STANDARD_CATEGORIES`, `WHITELISTED_CATEGORIES`, `VALID_KINDS`, `VALID_TOPIC_HINTS`, and the 12 getters from `../FieldSpec.js` **as-is** (`FieldSpec.ts:33-385`). 19 top-level + 4 nested REQUIRED, 1 EXPECTED, 5 OPTIONAL (`FieldSpec.ts:229-235`). This is the seed; it is NOT rewritten — the module aggregates it.
- The external/internal path split (`getExternalAgentRequiredFields` `FieldSpec.ts:311`, `getInternalAgentRequiredFields` `:316`, `getSystemInjectedFields` `:323`) is what CG-4 uses to know that `category`/`language`/`knowledgeType`/`dimensionId` (the four `systemInjected:true` fields, `FieldSpec.ts:122,131,168,176`) are required from the agent on the host-agent path but injected in-process.

### SECTION 2 — `gate-rules.ts` (the heart — each gate as a spec entry)
Each entry is a typed `GateRule` `{ id, stage, rejectCode, params, predicate, guidanceText, failureMode }`. The `params` and `predicate` are the byte-identical constants/algorithms lifted from the gates (CG-3). The entries:

| GateRule id | stage | rejectCode(s) | params encoded (verbatim source) |
|---|---|---|---|
| `doClause.imperative` | 1 | `DO_CLAUSE_NON_IMPERATIVE` | `POSITIVE_IMPERATIVE_VERBS` Set (44 verbs, `recipe-content-quality-gate.ts:28-74`) + `FIRST_WORD_RE` (`:26`) |
| `dontClause.imperative` | 1 | `DONT_CLAUSE_NON_IMPERATIVE` | `NEGATIVE_IMPERATIVE_VERBS` Set (12 verbs, `:76-89`) + `do not` special-case (`:166-167`) |
| `clause.englishOnly` | 1 | `DO/DONT_CLAUSE_NON_ENGLISH` | `NON_ENGLISH_SCRIPT_RE` (`:24-25`) |
| `clause.present` | 1 | `DO/DONT_CLAUSE_REQUIRED` | non-empty trimmed string (`:110`) |
| `markdown.present` | 1 | `CONTENT_MARKDOWN_REQUIRED` | non-empty trimmed `content.markdown` (`:176-188`, `:204-210`) |
| `markdown.contrast` | 1 | `CONTENT_CONTRAST_MISSING` | marker predicate: both `✅` and `❌`, each with ≥4 non-space chars after the marker on its line (`hasMarkerExample :212-217`) |
| `sourceRef.lineFormat` | 2 | `SOURCE_REF_LINE_MISSING` | regex `^(.+?):(\d+)(?:-(\d+))?$` (`validateSourceRef :510-522`) |
| `evidence.floor` | 2 | `INSUFFICIENT_EVIDENCE` | distinct-FILES Set (`:294`); rule/pattern→≥3 unless scope `\b(single-file\|file-local\|local-only\|narrow)\b` (`requiresMultiFileEvidence :670-677`); fact→≥1 (`:308`) |
| `evidence.snippetMatch` | 2 | `SNIPPET_MISMATCH` | `normalizedCode` (strip whitespace, drop `//`/`#` comments, `:705-707,718`) + substring + ordered line-subsequence + significant-line threshold ≥6 chars (`snippetMatchesSourceRange :709-738`) |
| `evidence.placeholder` | 2 | `PLACEHOLDER_EVIDENCE` | blacklist `operation(`, `doThing`, `foo`, `bar`, `TODO` (`looksLikePlaceholder :694-703`) |
| `evidence.graphTrigger` | 2 | `GRAPH_REF_INVALID` / `STALE_GRAPH` | EN keywords `\b(call chain\|caller\|callee\|called by\|depends on\|impact path\|relationship\|invokes)\b` (`:664`) + CN `调用链\|调用方\|被调用\|依赖\|影响路径\|关系\|上游\|下游` (`:666`) |
| `markdown.lengthFloor` | 3 | (field error) | length ≥200 (`UnifiedValidator.ts:185`) |
| `markdown.codeOrFileRef` | 3 | (field error) | require `` ```…``` `` (`:195`) **or** `\.\w{1,10}(:\d+)?` file-ref (`:196`) when len≥200 |
| `coreCode.complete` | 3 | (field error) | reject if first non-space char ∈ `}`/`)`/`]` (`:223-233`) |
| `title.notGeneric` | 3 | (field error) | reject `^(Singleton\|Factory\|Observer\|MVC\|MVVM) (pattern\|模式)$` (`:236-240`) |
| `fields.required` | 3 | (field error) | driven by `V3_FIELD_SPEC` REQUIRED set + `reasoning.sources` non-empty (`UnifiedValidator.ts:103-130`, `FieldSpec.ts:147-159`) |
| `uniqueness.dedup` | 3 | (uniqueness) | title/trigger lowercased Set + code-fingerprint (comment+whitespace strip, first 200 chars, lowercase, ≥20 floor) (`UnifiedValidator.ts#checkUniqueness`, `codeFingerprint`) |
| `kind.enum` | 3 | (field error) | `VALID_KINDS = ['rule','pattern','fact']` (already `FieldSpec.ts:287`) |

### SECTION 3 — `content-contract.ts` (the rich 项目特写 format + doc-score levers as explicit targets)
- Owns `PROJECT_SNAPSHOT_STYLE_GUIDE` (moved/owned from `StyleGuide.ts:14-31`): the 四大核心内容 (项目选择了什么 / 为什么这样选 / 项目禁止什么 / 新代码怎么写) + 格式要求 + `(来源: FileName.ext:行号)` convention + the "Agent" word prohibition.
- Encodes the doc-score levers from `QualityScorer.#scoreContentDepth` (`QualityScorer.ts:151-188`) as **explicit numeric targets** so the contract provably lifts the ~0.65 thin score (contentDepth is weighted 0.30, the single highest dimension):
  - markdown length target ≈800 chars → full `textScore(md, 50, 800, 0.3)` credit (`:156`)
  - ≥1 `^#{1,4}\s` heading → +0.08 (`:160`); ≥1 fenced/inline code → +0.08 (`:163`); ≥1 `^\s*[-*+]\s` list → +0.04 (`:166`)
  - rationale ≥100 chars → full 0.15 (`:172`); whyStandard ≥100 chars → full 0.15 (`:175`); ≥4 sources → caps 0.1 (`:178-180`)
- Reconciles the duplicated `SUBMISSION_SCHEMA.qualityGates` (`MissionBriefingSupport.ts`) into this single section — the content contract has ONE home.

### SECTION 4 — `failure-modes.ts` (each reject code → how to avoid)
A catalog keyed by reject code, each `{ code, stage, whyRejected, howToAvoid, exampleFixDelta }`. Covers `DO_CLAUSE_NON_IMPERATIVE`, `CONTENT_CONTRAST_MISSING`, `SNIPPET_MISMATCH`, `INSUFFICIENT_EVIDENCE`, `SOURCE_REF_LINE_MISSING`, `GRAPH_REF_INVALID`, `PLACEHOLDER_EVIDENCE`, `INCOMPLETE_SUBMISSION` (the `buildAllRejectedSubmitResponse` fallback, `tool-router.ts:694-711`), plus the stage-3 field/coreCode/title cases. Each entry's `howToAvoid` is the human-readable inverse of the same `gate-rules.ts` param — so the catalog cannot drift from the gate (both read one source).

### SECTION 5 — `examples/` (complete, multi-language, gate-passing)
- Owns the V3 worked examples moved from `MissionBriefingSupport.ts:106-213` (CG-2). Each is a full submission shape (title, content.markdown+rationale, kind, doClause, dontClause, whenClause, category, trigger, headers, usageGuide, knowledgeType, coreCode, reasoning).
- **Fixes the verified anti-examples:** all four shipped examples FAIL `CONTENT_CONTRAST_MISSING` today (`// ✅ 正确` leaves only 2 trimmed chars < the 4-char floor of `hasMarkerExample :215`); objectivec also fails `DO_CLAUSE_NON_IMPERATIVE` ("Prefix" ∉ `POSITIVE_IMPERATIVE_VERBS`). The owned examples MUST pass: marker lines carry ≥4 non-space chars after ✅/❌, and every doClause leads with an allowlisted verb. A unit test in the module asserts each example passes `validateAgainst` (self-consistency).
- Adds the missing languages (swift, kotlin, java, go, rust, csharp, javascript, …) so unlisted languages no longer fall to the skeletal `_default` (`MissionBriefingBuilder.ts:1138`), and grows `_default` to gate-passing.

### SECTION 6 — `guidance-generator.ts` (renders per-path agent-facing guidance FROM the spec)
One projection function per consumer shape (A.3), so every guidance string is **generated, not hand-copied**. This is the engine that makes CG-1 enforceable.

---

## A.3 Module API

All exported from `recipe-authoring-spec/index.ts`, surfaced via `@alembic/core/knowledge`:

```ts
// ── Enforcement (consumed by gates; byte-identical predicates) ──
validateAgainst(candidate, opts): RecipeAuthoringViolation[]
  // opts: { stage?: 1|2|3|'all', path: 'host-cold-start'|'host-deep-mining'|
  //         'host-module-mining'|'in-process', sourceRefResolver?, dimensionId? }
  // Returns the SAME violation objects the gates emit; gates delegate to this.
gateRule(id): GateRule                  // a single rule's params+predicate+rejectCode
gateRules(stage?): GateRule[]           // all rules, optionally filtered by stage

// ── Guidance (consumed by every guidance builder; rendered from spec) ──
renderGuidance(path, stage?): GuidanceBlock
  // path ∈ the 4 submission paths; assembles fieldSpec + gateRule guidanceText +
  // contentContract + the matching example. ONE assembly, no hand-copied constants.
buildSubmissionSpec(dim): SubmissionSpec        // collapses the 2 parallel builders
buildSubmitKnowledgeContract(): SubmitContract  // for OnboardingContract
buildPreSubmitChecklist(): Checklist            // collapses PRE_SUBMIT + SHARED_SUBMIT
describeSubmitToolFields(): Record<field,string>// for mcp-tools .describe() strings
getImperativeVerbAllowlist(): { positive: string[]; negative: string[] }  // NEW
getEvidenceFloorPolicy(): { ruleFiles:3; factFiles:1; scopeEscape: RegExp } // NEW

// ── Content + examples + failures ──
contentContract(): { styleGuide: string; docScoreTargets: DocScoreTargets }
example(language): WorkedExample        // gate-passing, multi-language
failureModes(): FailureMode[]           // reject-code → avoidance catalog
```

`validateAgainst` and `renderGuidance` read the **same** `gateRules()` table — that shared read is what guarantees guidance==gate.

---

## A.4 CONSUMER RE-POINTING map (every scattered source, all paths)

### Enforcement consumers (validate-against the module; CG-3 byte-identical)
| Scattered source | file:line | Re-point |
|---|---|---|
| Plugin stage-1 content-quality | `recipe-content-quality-gate.ts:28-89,158-217` | Move the 3 constants/predicates into `gate-rules.ts`; the gate **imports them back** from `@alembic/core/knowledge` (its first upward import) and calls `validateAgainst(items, {stage:1})`. Same values → byte-identical. |
| Plugin stage-2 evidence | `recipe-evidence-gate.ts:283-319,510-522,644-738` | Move floor table, snippet algo, source-ref regex, placeholder blacklist, relationship keywords into `gate-rules.ts`; gate delegates to `validateAgainst(items, {stage:2, sourceRefResolver})` (fs reads stay in the resolver injected by the Plugin, keeping the spec pure). |
| Core stage-3 field gate | `UnifiedValidator.ts:103-130,185-240` | Already reads `V3_FIELD_SPEC`; extend to read the `markdown.lengthFloor`/`codeOrFileRef`/`coreCode.complete`/`title.notGeneric`/`uniqueness` params from `gate-rules.ts` instead of inline literals. Behavior unchanged. |
| `tool-router.ts` 3-stage wiring | `tool-router.ts:151-198` | Stages 1/2 now call the spec-backed gate functions; the all-rejected fallback `buildAllRejectedSubmitResponse :694-711` already uses `getRequiredFieldsDescription()` from the spec. |
| **In-process main-body / AlembicAgent (CG-4 gap)** | `AlembicAgent/src/tools/runtime/handlers/knowledge.ts:175` | Today calls `gateway.create()` → stage-3 only (its own looser `validateSubmitParams :283-334`). Re-point: run `validateAgainst(items, {stage:'all', path:'in-process'})` **before** `gateway.create()`, so the SAME stage-1+stage-2 predicates run in-process. Closes the parity gap — in-process recipes face the same bar as host-path recipes into the same `alembic.db`. |

### Guidance consumers (render-from the module; CG-1)
| Scattered source | file:line | Re-point |
|---|---|---|
| Core builder A `enrichDimensionTask.submissionSpec` | `MissionBriefingBuilder.ts:311-331` | Call `buildSubmissionSpec(dim)`. |
| Parallel builder I `buildSubmissionSpec` | `DimensionCatalogPayload.ts:178-196` | Call the same `buildSubmissionSpec(dim)` — **collapses the two parallel builders**, resolving the 0-vs-3 target-count contradiction (`MissionBriefingBuilder.ts:314` "最少3条" vs `DimensionCatalogPayload.ts:182` "可以提交 0 条") in one place. |
| Plugin `OnboardingContract` | `OnboardingContract.ts:468-557,896-971,497-509` | `buildSubmitKnowledgeContract`/`buildRecipeGuidanceFloor`/`fieldFloors` call `buildSubmitKnowledgeContract()` + `getEvidenceFloorPolicy()` + `getImperativeVerbAllowlist()` — now lists the actual allowlisted verbs and the scope-escape the gate honors (closes two real drifts). |
| cold-start.ts assembly + compaction | `cold-start.ts:805-843,815,976-986` | `compactHostAgentContract` reads the spec-generated contract; **`summarizeSubmissionSchema` must carry `example` instead of dropping it** (`:976-986`) — exempt the worked example from the 18 KB budget strip (`COLD_START_BRIEFING_INLINE_BUDGET_BYTES :88`) so the cold-start agent finally sees a complete worked example (CG-4). |
| `PRE_SUBMIT_CHECKLIST` + `SHARED_SUBMIT_CHECKLIST` | `DimensionSop.ts:1702-1739,53-59` | Both call `buildPreSubmitChecklist()` — one checklist, one FAIL_EXAMPLES set (stop the `MissionBriefingSupport.ts` FAIL_EXAMPLES delete-on-compaction loss). |
| `StyleGuide.PROJECT_SNAPSHOT_STYLE_GUIDE` | `StyleGuide.ts:14-31` | Moves into `content-contract.ts`; `StyleGuide.ts` re-imports it (same-layer edge, already legal per `StyleGuide.ts:10`). `buildProducerStyleGuide` (`StyleGuide.ts:94`) keeps working. |
| mcp-tools `.describe()` strings | `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:643,649,734` + main-body fork `Alembic/lib/shared/schemas/mcp-tools.ts:324-379` | Generate from `describeSubmitToolFields()` so both the Plugin schema and the main-body schema fork render identical, spec-derived `.describe()` text. |
| AlembicAgent producer prompt | `insightProducer.ts:133-142` (`buildProducerStyleGuide` + `PRODUCER_SUBMIT_FIELD_CONTRACT`) | Render from `renderGuidance('in-process')` + inject `example(lang)` — adds the ✅/❌ contrast, the English-imperative verb list, the ≥3-file floor, and snippet-match guidance the in-process prompt omits today (and adds the missing worked-example object). |

### Examples consumer (inject on every path; CG-2/CG-4)
| Source | file:line | Re-point |
|---|---|---|
| `EXAMPLE_TEMPLATES` | `MissionBriefingSupport.ts:106-213` (single consumer `MissionBriefingBuilder.ts:46`) | Move into `recipe-authoring-spec/examples/`; `MissionBriefingSupport.ts` re-imports downward. Injection sites: (i) Core `MissionBriefingBuilder.ts:1229-1232` (keep), (ii) Plugin cold-start `summarizeSubmissionSchema` (now surfaces it), (iii) in-process `ColdStartWorkflow.ts:229`/`KnowledgeRescanWorkflow.ts:613`, (iv) AlembicAgent `insightProducer.ts:133` (new). |

---

## A.5 How the gates stay byte-identically strict (CG-3)

The gates are **not relaxed and not rewritten** — they are re-sourced. Three mechanisms keep behavior bit-for-bit:

1. **The spec encodes the SAME literals.** The verb Sets, the `≥4`/`≥6`/`≥3`/`200` thresholds, every regex (`NON_ENGLISH_SCRIPT_RE`, `FIRST_WORD_RE`, the source-ref regex, the relationship keyword lists, the generic-title regex, the code-block/file-ref regexes) move into `gate-rules.ts` **verbatim** from the lines cited in A.2. No value is reinterpreted.
2. **The gate code path is unchanged.** `tool-router.ts:163,172` still run stage-1 then stage-2 then stage-3 in the same order with the same early-return semantics; they now import the predicates instead of declaring them inline. `validateAgainst(stage:1)` returns the identical `RecipeContentQualityViolation[]` shape (`recipe-content-quality-gate.ts:11-22`); `validateAgainst(stage:2)` returns the identical `RecipeEvidenceViolation[]`. UnifiedValidator's stage-3 still pushes the same `errors[]`.
3. **fs-bound checks stay runtime, injected.** The evidence gate's on-disk checks (`SOURCE_REF_NOT_FOUND`, `LINE_OUT_OF_RANGE`, `validateSourceRef :528-581`) remain in a `sourceRefResolver` the Plugin/main-body inject into `validateAgainst` — the spec stays pure (domain-layer, `fs`-free), so the layer contract holds while the gate's strictness is unchanged.

Net: the module becomes the single source the gates *read*; the gates remain the strict anti-fabrication net. "Two investigations disagreed on which rules fire where" becomes impossible because the rules now live in one inspectable table.

---

## A.6 Drift test design (guidance == gate; CG-1)

A Core+Plugin Vitest suite `recipe-authoring-spec.drift.test.ts` (one in Core for the Core consumers, one in Plugin for the Plugin consumers) asserting, per rule, that **what the gate enforces == what the guidance emits**, both pulled from `gateRules()`:

1. **Allowlist parity:** `getImperativeVerbAllowlist().positive` is byte-equal to the `POSITIVE_IMPERATIVE_VERBS` Set the stage-1 predicate uses, and the doClause guidance string lists exactly those verbs. (Catches the current drift where guidance only says "verb-led" while the gate enforces a closed 44-verb set.)
2. **Marker-rule parity:** the ✅/❌ guidance states the "both markers, ≥4 non-space chars after marker on its line" rule that `markdown.contrast`'s predicate enforces; a property test feeds the guidance's own example markdown through `validateAgainst(stage:1)` and asserts it passes.
3. **Evidence-floor parity:** `getEvidenceFloorPolicy()` (`{ruleFiles:3, factFiles:1, scopeEscape}`) equals the numbers + scope regex in `evidence.floor`; the guidance includes the `scope:narrow|file-local` escape the gate honors (catches the current omission).
4. **Markdown floor + field-set parity:** the guidance's stated `200` floor and required-field list equal `markdown.lengthFloor` and `getAllRequiredFieldNames()`.
5. **Example self-consistency:** every `example(lang)` passes `validateAgainst(candidate, {stage:'all'})` — guaranteeing the shipped worked examples are gate-passing, not the anti-examples that ship today.
6. **No-relaxation snapshot:** a snapshot of the lifted constants (verbs, thresholds, regex sources) so any future edit to `gate-rules.ts` that would change gate behavior fails the snapshot loudly — CG-3's tripwire.

Because `validateAgainst` (gate) and `renderGuidance` (guidance) both read the one `gateRules()` table, the drift test is structurally cheap: it asserts the two projections of a single source agree, and it fails the moment any consumer re-introduces a hand-copied constant.

---

**Key files (absolute):**
- Seed + getters: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/domain/knowledge/FieldSpec.ts`
- Stable facade barrel: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/knowledge.ts` + `package.json` `./knowledge`
- Layer contract (decoupling enforcer): `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/config/layer-contract.json:23-26`
- Public-API boundary (export choice): `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/config/public-api-boundary.json:5,1086-1087,1177,1206`
- Stage-1 gate constants to lift: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/lib/runtime/mcp/handlers/recipe-content-quality-gate.ts:24-89,212-217`
- Stage-2 gate constants to lift: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts:283-319,510-522,644-738`
- Stage-3 field gate: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/domain/knowledge/UnifiedValidator.ts:103-130,185-240`
- Content contract: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/domain/knowledge/StyleGuide.ts:14-31`
- Doc-score levers: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/service/quality/QualityScorer.ts:151-188`
- Examples to move down: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingSupport.ts:106-213` (single consumer `MissionBriefingBuilder.ts:46`)
- In-process CG-4 gap: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/tools/runtime/handlers/knowledge.ts:175`
- Tool-router 3-stage entry: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts:151-198,694-711`

---

# SECTION B — Code-Level Phased Implementation Guide

This guide implements the `RecipeAuthoringSpec` module of Section A. Every phase ends with a runnable acceptance. All file:line references verified against source on 2026-06-30. Discipline throughout: **gates are re-sourced, never relaxed** (CG-3); the module stays in `domain` (lint-enforced decoupling); examples and guidance render from one table (CG-1/CG-2); all four submission paths converge (CG-4).

The phase order is producer→consumer: P0 builds the source-of-truth, P1 makes the gates *read* it (proving byte-identical), P2 makes guidance *render* from it, P3 ships examples, P4 locks drift, P5 proves the win on a real cold-start.

---

## P0 — Build the `RecipeAuthoringSpec` module (consolidate; seed from FieldSpec)

### P0.0 (FIRST STEP) Code-level verify which rules are actually enforced — resolve the investigation contradiction

Before writing any module code, produce a frozen, checked-in **enforcement matrix** so the "two investigations disagreed" ambiguity can never recur. This is a read + assert task, not a refactor.

Steps:
1. Trace the live router once more and pin each stage's call site (already confirmed here):
   - Stage 1 fires unconditionally: `tool-router.ts:163` `validateSubmitKnowledgeContentQuality(itemsResult.items)` → early-return `:164-166`.
   - Stage 2 fires only on cold-start/mining: `tool-router.ts:172-180` `buildSubmitKnowledgeEvidenceGateResponse(...)`, itself gated by `shouldRunRecipeEvidenceGate` (`recipe-evidence-gate.ts:88-110` — `session || sessionId || bootstrapSessionRef || requireProductionSession || dimensionId || item.dimensionId`).
   - Stage 3 fires unconditionally: `tool-router.ts:183-189` `createSubmitKnowledgeRecipes` → `RecipeProductionGateway.create()` (`RecipeProductionGateway.ts:340`) → `UnifiedValidator.validate` (`UnifiedValidator.ts:80`).
   - In-process: `AlembicAgent/src/tools/runtime/handlers/knowledge.ts:101` runs the **looser** `validateSubmitParams` (`:283`) then `gateway.create()` (`:175`) = **stage 3 only**; stages 1+2 never run in-process today.
2. Write the matrix as a checked-in fixture `AlembicCore/test/fixtures/recipe-gate-enforcement-matrix.json` keyed by `{rejectCode → {stage, alwaysOrConditional, sourceFile, sourceLine, paths[]}}`. This fixture is consumed by the P4 drift test as the authoritative "what fires where" oracle. Resolution of the contradiction: **the rules are layered, not duplicated** — stage 1 (Plugin) owns verb/marker, stage 2 (Plugin, cold-start-only) owns evidence/snippet/graph, stage 3 (Core, all paths) owns field/markdown-floor/uniqueness. An investigation that read only Core saw stage 3; one that read only Plugin saw stages 1+2. Both were partially right.

Acceptance P0.0 (runnable):
```bash
# the matrix must round-trip against a static assertion test (no behavior yet)
cd AlembicCore && npx vitest run test/recipe-gate-enforcement-matrix.test.ts
```
The test asserts the matrix file lists exactly the reject codes found by grepping the three gate files (`grep -oE "'[A-Z_]+'" recipe-content-quality-gate.ts recipe-evidence-gate.ts` + the UnifiedValidator error pushes), so the matrix cannot silently drift from the real codes.

### P0.1 Create the module folder + barrel (location from Section A.1/A.2)

Create `AlembicCore/src/domain/knowledge/recipe-authoring-spec/` with the file tree from A.2. The barrel `index.ts` is the only public entry; section files are internal.

```text
AlembicCore/src/domain/knowledge/recipe-authoring-spec/
├── index.ts            # public API (A.3), re-exports sections + facade fns
├── fields.ts           # SECTION 1 — re-exports from ../FieldSpec.js (untouched seed)
├── gate-rules.ts       # SECTION 2 — behavioral constants promoted to data
├── content-contract.ts # SECTION 3 — PROJECT_SNAPSHOT_STYLE_GUIDE + docScoreTargets
├── failure-modes.ts    # SECTION 4 — rejectCode → avoidance catalog
├── examples/           # SECTION 5 — moved-down EXAMPLE_TEMPLATES + new languages
│   ├── index.ts
│   └── <lang>.ts ...
└── guidance-generator.ts # SECTION 6 — renderGuidance/buildSubmissionSpec/...
```

### P0.2 SECTION 1 `fields.ts` — re-export the seed AS-IS (zero break)

```ts
// recipe-authoring-spec/fields.ts
export {
  V3_FIELD_SPEC, FieldLevel, STANDARD_CATEGORIES, WHITELISTED_CATEGORIES,
  VALID_KINDS, VALID_TOPIC_HINTS,
  getRequiredFieldNames, getAllRequiredFieldNames, getExpectedFieldNames,
  getExternalAgentRequiredFields, getInternalAgentRequiredFields,
  getSystemInjectedFields, getRequiredFieldsDescription, getFieldDef,
  getFieldsByLevel, getAgentAdapterFieldSpec,
} from '../FieldSpec.js';
```
`FieldSpec.ts` is **not edited** in P0 — its 9 current consumers (incl. Plugin `tool-router.ts:14`) keep importing it unchanged. Same-layer `domain→domain` import, already proven legal by `StyleGuide.ts:10`.

### P0.3 SECTION 2 `gate-rules.ts` — lift the behavioral constants VERBATIM (the heart)

Define one typed table. Each entry carries the byte-identical literal/predicate lifted from the cited gate lines, plus its `guidanceText` (consumed in P2) and `failureMode` key (P0.5).

```ts
// recipe-authoring-spec/gate-rules.ts
export interface GateRule<P = unknown> {
  id: string;
  stage: 1 | 2 | 3;
  rejectCodes: string[];
  params: P;                       // the verbatim constants
  guidanceText: string;            // rendered into guidance (P2) — never hand-copied elsewhere
  failureModeKey: string;
}
```

Lift verbatim (no value reinterpreted — CG-3):
- `POSITIVE_IMPERATIVE_VERBS` Set + `NEGATIVE_IMPERATIVE_VERBS` Set + `FIRST_WORD_RE` + `do not` special-case ← `recipe-content-quality-gate.ts:26,28-89,166-167`. Pin the count against source in P0 acceptance (the dossier varies 44/46 — **derive the exact count from the lifted Set in the test**, do not hard-code a literal number into prose).
- `NON_ENGLISH_SCRIPT_RE` ← `:24-25`.
- marker predicate `hasMarkerExample(md, marker)` = "both ✅ and ❌, each with ≥4 non-space chars after the marker on its line" ← `:212-217` (confirmed: `line.slice(index+marker.length).trim().length >= 4`).
- source-ref regex `^(.+?):(\d+)(?:-(\d+))?$` ← `recipe-evidence-gate.ts:510-522`.
- evidence floor `{ruleFiles:3, factFiles:1}` + scope-escape `\b(single-file|file-local|local-only|narrow)\b` ← `validateEvidenceFloor:283-318` (distinct-FILES `Set:294`, `<3`), `requiresMultiFileEvidence:670-677`.
- snippet algo: `normalizedCode` (strip whitespace, drop `//`/`#` comments) + substring + ordered line-subsequence + significant-line ≥6 chars ← `:705-738`.
- placeholder blacklist `operation(`, `doThing`, `foo`, `bar`, `TODO` ← `:694-703`.
- relationship keyword lists EN+CN ← `:664,666`.
- markdown floor 200 + code-block/file-ref regex ← `UnifiedValidator.ts:185-198`.
- coreCode bracket predicate (`}`/`)`/`]`) + generic-title regex `^(Singleton|Factory|Observer|MVC|MVVM) (pattern|模式)$` ← `:223-240`.
- code-fingerprint normalization (comment+whitespace strip, first 200, lowercase, ≥20 floor) ← `UnifiedValidator.ts#codeFingerprint` (the `:24-31` region).

Provide the orchestrator the gates and the in-process path will call:
```ts
export function validateAgainst(
  items: ReadonlyArray<Record<string, unknown>>,
  opts: { stage?: 1|2|3|'all'; path: SubmitPath; sourceRefResolver?: SourceRefResolver; dimensionId?: string },
): RecipeAuthoringViolation[]
```
`validateAgainst(stage:1)` returns the **identical** `RecipeContentQualityViolation[]` shape (`recipe-content-quality-gate.ts:11-22`); `stage:2` returns the identical `RecipeEvidenceViolation[]`. fs-bound checks (`SOURCE_REF_NOT_FOUND`/`LINE_OUT_OF_RANGE`, `:528-581`) stay behind the injected `sourceRefResolver` so the domain module is `fs`-free (layer-contract: `domain` imports only `shared`+`types`).

> Implementation note: the cleanest no-risk lift is to **move** the existing pure predicate functions (`isImperativeVerbLeading`, `hasMarkerExample`, `normalizedCode`, `snippetMatchesSourceRange`, `looksLikePlaceholder`, `requiresMultiFileEvidence`, `validateSourceRef`'s regex half) into `gate-rules.ts` unchanged and have the Plugin gates import them back (P1). Moving the function body (not retyping it) is what guarantees byte-identity.

### P0.4 SECTION 3 `content-contract.ts` — own the 项目特写 + doc-score targets

- Move `PROJECT_SNAPSHOT_STYLE_GUIDE` here from `StyleGuide.ts:14-31`; `StyleGuide.ts` re-imports it (same-layer, already legal). `buildProducerStyleGuide` (`StyleGuide.ts:94`) keeps working.
- Encode `QualityScorer.#scoreContentDepth` levers (`QualityScorer.ts:151-188`) as explicit numeric `docScoreTargets`: markdown ≈800 chars (full `textScore(md,50,800,0.3)` `:156`), ≥1 `^#{1,4}\s` heading (+0.08 `:160`), ≥1 fenced/inline code (+0.08 `:163`), ≥1 list (+0.04 `:166`), rationale ≥100 (full 0.15 `:172`), whyStandard ≥100 (full 0.15 `:175`), ≥4 sources (caps 0.1 `:178-180`). These are *targets*, not gates — they lift the thin 0.65 score without touching enforcement.
- Reconcile `SUBMISSION_SCHEMA.qualityGates` (`MissionBriefingSupport.ts:80-104`) into this single section (delete the parallel prose body there in P2).

### P0.5 SECTION 4 `failure-modes.ts` — rejectCode → avoidance, derived from gate-rules

Catalog keyed by reject code: `{ code, stage, whyRejected, howToAvoid, exampleFixDelta }`. **`howToAvoid` is computed from the same `gate-rules.ts` params** (e.g. the verb-rule's `howToAvoid` enumerates `getImperativeVerbAllowlist().positive`), so the catalog structurally cannot drift from the gate. Cover `DO_CLAUSE_NON_IMPERATIVE`, `CONTENT_CONTRAST_MISSING`, `SNIPPET_MISMATCH`, `INSUFFICIENT_EVIDENCE`, `SOURCE_REF_LINE_MISSING`, `GRAPH_REF_INVALID`, `PLACEHOLDER_EVIDENCE`, `INCOMPLETE_SUBMISSION` (`tool-router.ts:694-711`), plus stage-3 field/coreCode/title cases.

### P0.6 SECTION 6 `guidance-generator.ts` + `index.ts` public API

Implement the A.3 exports (`renderGuidance`, `buildSubmissionSpec`, `buildSubmitKnowledgeContract`, `buildPreSubmitChecklist`, `describeSubmitToolFields`, `getImperativeVerbAllowlist`, `getEvidenceFloorPolicy`, `contentContract`, `example`, `failureModes`, `gateRule`, `gateRules`). Every generator reads `gateRules()` — no hand-copied constant lives in a generator body. (Examples in P3 fill `example()`; a stub returning `_default` is fine in P0.)

Wire exports: add `RecipeAuthoringSpec` (namespace or individual symbols) to `AlembicCore/src/domain/knowledge/index.ts` AND the stable facade barrel `AlembicCore/src/knowledge.ts` (which already re-exports the FieldSpec symbols, confirmed lines 1-17). **Reuse `./knowledge`** — confirmed in `public-api-boundary.json:1177` as stable-public; `./domain/knowledge` is only transitional-internal (`:1209`). Do NOT mint `./recipe-spec` (would churn `expectedCounts.stable-public: 24` at `:5`).

### Acceptance P0 (runnable)
```bash
cd AlembicCore
npm run build:check                 # module compiles, no emit
npx vitest run test/recipe-authoring-spec/spec-shape.test.ts   # NEW: asserts every A.3 export exists + typed
npx vitest run test/recipe-gate-enforcement-matrix.test.ts     # P0.0 oracle still green
npm run lint:layer-contract         # PROVES decoupling: any host/path import in the spec fails here
npm run check                       # full Core combined gate (layer + boundary + build + lint)
```
Real-machine check: `node -e "import('@alembic/core/knowledge').then(m=>console.log(typeof m.validateAgainst, typeof m.renderGuidance, m.getImperativeVerbAllowlist().positive.length))"` from a sibling repo dir — proves the facade resolves cross-package and the verb count is non-zero. No behavior is wired into gates yet, so all existing tests stay green.

---

## P1 — Re-point the GATES to validate against the module (byte-identical) + drift tripwire

### P1.0 (FIRST STEP) Capture a behavior baseline BEFORE re-sourcing

Generate a golden corpus of submissions (passing + each-reject-code-failing) and snapshot every gate's current output:
```bash
cd AlembicPlugin && npx vitest run --reporter=json lib/runtime/mcp/handlers/*.test.ts > /tmp/claude-501/-Users-gaoxuefeng-Documents-AlembicWorkspace/1de37745-2005-4711-931b-4eac36fbca4c/scratchpad/gate-baseline.json
```
This baseline is the P1/P4 oracle: after re-pointing, the same corpus must produce byte-identical violation arrays. If the existing handler tests are thin, add `recipe-gate-golden-corpus.test.ts` first (still on the OLD inline constants) to lock current behavior, THEN re-point.

### P1.1 Stage-1 (Plugin) — import predicates back from the module

In `AlembicPlugin/lib/runtime/mcp/handlers/recipe-content-quality-gate.ts`: delete the inline constant/predicate bodies (`:24-89,158-217`), add the file's **first upward import** (same direction its sibling `handlers/knowledge.ts:7` already uses):
```ts
// before: const POSITIVE_IMPERATIVE_VERBS = new Set([...]); function hasMarkerExample(...) {...}
// after:
import { validateAgainst } from '@alembic/core/knowledge';
export function validateSubmitKnowledgeContentQuality(items) {
  const violations = validateAgainst(items, { stage: 1, path: 'host-cold-start' });
  return { ok: violations.length === 0, violations };
}
```
Same Set, same regex, same predicate (moved, not retyped) → byte-identical. `tool-router.ts:163` call site unchanged.

### P1.2 Stage-2 (Plugin) — delegate, keep fs in the injected resolver

In `recipe-evidence-gate.ts`: move floor table, snippet algo, source-ref regex, placeholder blacklist, relationship keywords into `gate-rules.ts`; the gate calls `validateAgainst(items, {stage:2, path, sourceRefResolver})`. The Plugin injects `sourceRefResolver` (the on-disk `SOURCE_REF_NOT_FOUND`/`LINE_OUT_OF_RANGE` checks at `:528-581` stay Plugin-side). `shouldRunRecipeEvidenceGate` (`:88-110`) and the `tool-router.ts:172-180` wrapping are unchanged — stage 2 still fires only on cold-start/mining.

### P1.3 Stage-3 (Core) — read params from the table instead of inline literals

In `UnifiedValidator.ts`: replace the inline `200`, the code-block/file-ref regexes, the bracket predicate, the generic-title regex, and the fingerprint normalization (`:185-240`, `codeFingerprint`) with reads from `gateRules('markdown.lengthFloor'|'markdown.codeOrFileRef'|'coreCode.complete'|'title.notGeneric'|'uniqueness.dedup')`. Field-presence already reads `V3_FIELD_SPEC` — unchanged. Behavior identical.

### P1.4 In-process parity (CG-4 gap) — run stages 1+2 before `gateway.create()`

In `AlembicAgent/src/tools/runtime/handlers/knowledge.ts`: today `:101` runs the looser `validateSubmitParams` then `:175` `gateway.create()` (stage 3 only). Add the canonical pre-gate so in-process recipes face the same bar into the same `alembic.db`:
```ts
// before gateway.create(...) at :175
const authViolations = validateAgainst([item], { stage: 'all', path: 'in-process',
  sourceRefResolver: ctx.runtime?.sourceRefResolver, dimensionId: dimMeta?.id });
if (authViolations.length) return buildInProcessRejection(authViolations); // reuse existing reject envelope shape
```
Keep `validateSubmitParams` as a fast cheap pre-filter or fold its checks into the matrix — but the authoritative bar is now `validateAgainst`. This closes the S1/S5 in-process gap.

### P1.5 Add the per-rule drift tripwire (CG-1 seed; full suite in P4)

A snapshot test on the lifted constants (`gate-rules.ts` verbs/thresholds/regex sources) so any future edit that would change gate behavior fails loudly — CG-3's tripwire.

### Acceptance P1 (runnable)
```bash
# Core build + gate-3 re-source green
cd AlembicCore && npm run build && npm run build:check && npm run test
# Plugin: re-pointed gates produce IDENTICAL output vs P1.0 baseline
cd ../AlembicPlugin && npx vitest run lib/runtime/mcp/handlers/recipe-gate-golden-corpus.test.ts
npx vitest run lib/runtime/mcp/handlers/*.test.ts lib/recipe-generation/host-agent-workflows/*.test.ts
# AlembicAgent: in-process now rejects what host path rejects
cd ../AlembicAgent && npx vitest run src/tools/runtime/handlers/knowledge.test.ts
```
Drift tripwire: `npx vitest run test/recipe-authoring-spec/gate-constants.snapshot.test.ts` (Core). Real-machine check: in an `ALEMBIC_HOME` sandbox, submit one known-failing recipe (e.g. `// ✅ ok` → 2 chars) via the in-process AlembicAgent path and confirm it now returns `CONTENT_CONTRAST_MISSING` — proving stage 1 reaches in-process. **Discipline gate: if any baseline byte differs, STOP — a value was reinterpreted, not moved.**

---

## P2 — Re-point GUIDANCE to render from the module (all paths) + collapse duplicate builders

### P2.1 Collapse the two parallel `submissionSpec` builders

- `MissionBriefingBuilder.ts:311-331` (`enrichDimensionTask.submissionSpec`) → call `buildSubmissionSpec(dim)`.
- `DimensionCatalogPayload.ts:178-196` (`buildSubmissionSpec`, the second parallel builder) → call the same `buildSubmissionSpec(dim)`.
This resolves the hard contradiction in one place: `MissionBriefingBuilder.ts:314` "最少3条" vs `DimensionCatalogPayload.ts:182` "可以提交 0 条" — pick the floor once in the module (the requirement's authoritative floor is ≥3 for rule/pattern per the evidence gate; encode it there).

### P2.2 Plugin `OnboardingContract` — render from the module

`OnboardingContract.ts` `buildSubmitKnowledgeContract` (`:468-557`), `buildRecipeGuidanceFloor` (`:896-971`), `fieldFloors` (`:497-509`) → call `buildSubmitKnowledgeContract()` + `getEvidenceFloorPolicy()` + `getImperativeVerbAllowlist()`. This fixes two real drifts: guidance now lists the **actual** allowlisted verbs (today only says "verb-led") and surfaces the `scope:narrow|file-local` escape the gate honors (today omitted).

### P2.3 Cold-start assembly — render contract + STOP stripping the example

`cold-start.ts`: `compactHostAgentContract` (`:794-860`) reads the spec-generated contract. Critically, `summarizeSubmissionSchema` (`:976-986`) must **carry `example`** instead of dropping it — exempt the worked example from the 18 KB budget strip (`COLD_START_BRIEFING_INLINE_BUDGET_BYTES :88`) so the cold-start agent finally sees a complete worked example (the S2/S3 root cause of "no example on cold-start"). If the full briefing exceeds budget, trim other analysis fields first; the example is load-bearing for one-pass rate.

### P2.4 Checklists — one `buildPreSubmitChecklist()`

`DimensionSop.ts` `PRE_SUBMIT_CHECKLIST` (`:1702-1739`) + `SHARED_SUBMIT_CHECKLIST` (`:53-59`) → both call `buildPreSubmitChecklist()`. One checklist, one FAIL_EXAMPLES set — stop the `MissionBriefingSupport.ts:355-356` FAIL_EXAMPLES delete-on-compaction loss.

### P2.5 Tool-schema `.describe()` strings — both Plugin and main-body forks

`AlembicPlugin/lib/shared/schemas/mcp-tools.ts:643,649,734` AND the main-body fork `Alembic/lib/shared/schemas/mcp-tools.ts:324-379` → generate from `describeSubmitToolFields()`, so both schemas render identical spec-derived `.describe()` text.

### P2.6 In-process producer prompt — render + inject

`AlembicAgent/src/agent/prompts/insightProducer.ts:133-142` (`buildProducerStyleGuide` + `PRODUCER_SUBMIT_FIELD_CONTRACT`) → render from `renderGuidance('in-process')`. This adds the ✅/❌ contrast rule, the English-imperative verb list, the ≥3-file floor, and snippet-match guidance the in-process prompt omits today — so the in-process *guidance* now matches the in-process *gate* added in P1.4.

### Acceptance P2 (runnable)
```bash
cd AlembicCore && npm run build && npm run test    # both submissionSpec builders collapsed, briefing tests green
cd ../AlembicPlugin && npm run build:check && npx vitest run lib/runtime/status/*.test.ts lib/recipe-generation/host-agent-workflows/cold-start*.test.ts
cd ../AlembicAgent && npx vitest run src/agent/prompts/*.test.ts
cd ../Alembic && npm run build:check   # main-body schema fork compiles against spec
```
Real-machine check: render a cold-start briefing for one dimension and `grep` the emitted JSON for (a) the worked `example` object present (not stripped), (b) the literal allowlisted verbs in the doClause guidance, (c) the `scope:narrow` escape text. All three must appear.

---

## P3 — Examples: reuse EXAMPLE_TEMPLATES, fix anti-examples, add languages, inject everywhere

### P3.1 Move EXAMPLE_TEMPLATES down + fix the verified anti-examples

Move `EXAMPLE_TEMPLATES` from `MissionBriefingSupport.ts:106-213` (single consumer `MissionBriefingBuilder.ts:46`, grep-confirmed) into `recipe-authoring-spec/examples/`; `MissionBriefingSupport.ts` re-imports downward (`workflows→domain` legal). **Fix the confirmed failures**: all four shipped examples FAIL `CONTENT_CONTRAST_MISSING` today (`// ✅ 正确` leaves 2 trimmed chars < the 4-char floor of `hasMarkerExample:215`); objectivec also fails `DO_CLAUSE_NON_IMPERATIVE` ("Prefix" ∉ allowlist). Rewrite marker lines to carry ≥4 non-space chars after ✅/❌ (e.g. `// ✅ correct: @interface BDVideoPlayer`) and lead every doClause with an allowlisted verb.

### P3.2 Add the missing languages + grow `_default`

Add swift, kotlin, java, go, rust, csharp, javascript (and any other primary languages in the project corpus) so unlisted languages no longer fall to the skeletal `_default` (`MissionBriefingBuilder.ts:1138`). Grow `_default` to gate-passing.

### P3.3 Inject on every path

(i) Core `MissionBriefingBuilder.ts:1229-1232` (keep), (ii) Plugin cold-start `summarizeSubmissionSchema` (now surfaces it — done in P2.3), (iii) in-process `Alembic/lib` `ColdStartWorkflow.ts:229` / `KnowledgeRescanWorkflow.ts:613`, (iv) AlembicAgent `insightProducer.ts:133` (new injection via `example(lang)`).

### Acceptance P3 (runnable)
```bash
cd AlembicCore
# self-consistency: EVERY example passes the full gate (the key anti-example fix)
npx vitest run test/recipe-authoring-spec/examples-gate-passing.test.ts
npm run build && npm run test
```
The `examples-gate-passing.test.ts` runs each `example(lang)` through `validateAgainst(candidate, {stage:'all'})` and asserts zero violations — guaranteeing the shipped examples are gate-passing, not the anti-examples that ship today. Real-machine check: for a swift/kotlin/go project, render the briefing and confirm a language-matched non-`_default` example is injected.

---

## P4 — Drift tests + non-regression

### P4.1 Drift suite (CG-1) — Core + Plugin

`recipe-authoring-spec.drift.test.ts` (one in Core for Core consumers, one in Plugin for Plugin consumers), per A.6, all reading `gateRules()`:
1. **Allowlist parity**: `getImperativeVerbAllowlist().positive` byte-equals the stage-1 predicate's Set; the doClause guidance lists exactly those verbs.
2. **Marker parity**: the ✅/❌ guidance states the "both markers, ≥4 non-space chars after marker" rule; a property test feeds the guidance's own example markdown through `validateAgainst(stage:1)` and asserts it passes.
3. **Evidence-floor parity**: `getEvidenceFloorPolicy()` (`{ruleFiles:3, factFiles:1, scopeEscape}`) equals the numbers + scope regex in `evidence.floor`; the guidance includes the `scope:narrow|file-local` escape.
4. **Markdown floor + field-set parity**: guidance's `200` floor + required-field list equal `markdown.lengthFloor` and `getAllRequiredFieldNames()`.
5. **Example self-consistency**: every `example(lang)` passes `validateAgainst({stage:'all'})` (also runs in P3, kept here as the standing tripwire).
6. **No-relaxation snapshot**: snapshot of the lifted constants (verbs, thresholds, regex sources) — any future `gate-rules.ts` edit that would change gate behavior fails loudly (CG-3 tripwire).
7. **Enforcement-matrix parity**: assert the P0.0 matrix still matches the grepped reject codes across the three gate files (the contradiction can never silently reopen).

### P4.2 Non-regression — gates unchanged, all recipe tests green

Re-run the P1.0 golden corpus and the full existing recipe test surface across all four repos; assert byte-identical gate output and zero new failures.

### Acceptance P4 (runnable)
```bash
cd AlembicCore && npm run check        # full Core: layer-contract + boundary + build + lint + test
npx vitest run test/recipe-authoring-spec/recipe-authoring-spec.drift.test.ts
cd ../AlembicPlugin && npm run check 2>/dev/null || (npm run build:check && npm run test)
npx vitest run lib/.../recipe-authoring-spec.drift.test.ts lib/runtime/mcp/handlers/recipe-gate-golden-corpus.test.ts
cd ../AlembicAgent && npm run test
cd ../Alembic && npm run build:check && npm run test
```
Node ≥22 required for the boundary/build:check gates (per MEMORY: Node 18 yields false `ERR_INVALID_ARG_TYPE` reds — `nvm use 22` first). All green = gates byte-identically strict, guidance==gate proven structurally.

---

## P5 — Real-machine: cold-start one dimension on ecf32806 with DeepSeek/Qwen

### P5.1 Setup (護真, sandbox)

Use an `ALEMBIC_HOME` sandbox so real `~/.asd` is untouched (per the runtime acceptance recipe). Configure the host agent (codex/cc) with DeepSeek/Qwen creds. Target the real workspace-root space (`ecf32806`).

### P5.2 Run + measure

1. Drive one dimension cold-start (`alembic_bootstrap` → `runHostAgentColdStartWorkflow` → submit). Capture the briefing the agent actually receives and confirm (P2.3/P3.3) a complete worked example is present inline.
2. **Measure one-pass rate**: count how many submitted candidates pass on first `alembic_submit_knowledge` call vs total submissions, before vs after this change. The pre-change baseline is the "many rejection rounds" symptom; post-change the agent sees the exact verb allowlist, the ≥4-char marker rule, the ≥3-file floor, and a gate-passing example, so first-pass should rise.
3. **Measure doc-score**: sample the generated recipes and run `QualityScorer` contentDepth (`QualityScorer.ts:151-188`). Assert sampled doc-score is clearly above the ~0.65 baseline (the `content-contract.ts` docScoreTargets push markdown toward ≈800 chars with headings/code/lists/rationale/whyStandard/≥4-sources — the 0.30-weighted dimension).

### Acceptance P5 (runnable)
```bash
# sandbox cold-start drive (illustrative; use the real bootstrap MCP tool chain)
ALEMBIC_HOME=$(mktemp -d) node AlembicPlugin/bin/alembic-start.mjs   # stdio MCP, then drive bootstrap+submit for one dimension
# score sampled recipes
cd AlembicCore && node -e "/* import QualityScorer, score the N sampled recipes, print contentDepth + grade */"
```
Pass criteria: (a) the cold-start briefing contains a complete, language-matched, gate-passing worked example inline (not stripped); (b) measured first-pass submit rate is higher than the pre-change baseline on the same dimension; (c) sampled recipe doc-score clearly > 0.65. If any criterion fails, preserve evidence and route the gap back — do NOT relax a gate to make the number move (CG-3).

---

## Cross-phase discipline checklist
- **Decoupled**: the spec lives in `domain/knowledge` and imports only `shared`+`types`; `npm run lint:layer-contract` (P0/P4 `npm run check`) mechanically blocks any host/path import — decoupling is lint-enforced, not aspirational.
- **No cycles**: Core has zero reverse edges on any consumer (grep-confirmed empty); every consumer→spec import rides the existing `@alembic/core/knowledge` channel already in production at `tool-router.ts:14`.
- **General**: the module holds only host-neutral data (fields, gate constants, content contract, examples, failure catalog); all four paths consume the same facade.
- **Gates not relaxed (CG-3)**: P1 moves predicate bodies rather than retyping them, and P1.0/P4.2 assert byte-identical output against a captured baseline; the P4.6 snapshot is the standing tripwire.

**Key files (absolute):**
- New module: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/domain/knowledge/recipe-authoring-spec/` (barrel `index.ts`)
- Seed: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/domain/knowledge/FieldSpec.ts`
- Facade barrel + export: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/knowledge.ts` (re-exports FieldSpec at lines 1-17); stable-public confirmed `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/config/public-api-boundary.json:1177` (count `:5`)
- Layer-contract enforcer: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/config/layer-contract.json:23-26`
- Stage-1 gate (lift constants, re-point): `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/lib/runtime/mcp/handlers/recipe-content-quality-gate.ts:24-89,212-217`
- Stage-2 gate (lift constants, delegate): `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts:88-110,283-318,510-522,694-738`
- Stage-3 gate (read params): `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/domain/knowledge/UnifiedValidator.ts:185-240`
- 3-stage router: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts:151-198,694-711`
- In-process gap (CG-4): `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/tools/runtime/handlers/knowledge.ts:101,175`
- Guidance: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/lib/runtime/status/OnboardingContract.ts:468-557,896-971` ; `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:311-331` ; `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/domain/dimension/DimensionCatalogPayload.ts:178-196` ; `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/domain/dimension/DimensionSop.ts:53-59,1702-1739`
- Cold-start strip to fix: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts:794-860,976-986`
- Content contract + doc-score: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/domain/knowledge/StyleGuide.ts:14-31` ; `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/service/quality/QualityScorer.ts:151-188`
- Examples to move + fix: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingSupport.ts:106-213` (single consumer `MissionBriefingBuilder.ts:46`)
- In-process producer prompt: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/src/agent/prompts/insightProducer.ts:133-142`
- Tool-schema forks: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/lib/shared/schemas/mcp-tools.ts:643,649,734` ; `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic/lib/shared/schemas/mcp-tools.ts:324-379`

---

# SECTION C — critique 修正与决策点（实现前生效，覆盖 §A/§B 对应处）

> 两轮对抗 critique（completeness + safety）对 §A/§B 真实代码复核：核心架构（Core domain 归属、`@alembic/core/knowledge` stable facade、domain 层 lint 强制解耦、Core 零反向边无环、`./knowledge` 通道已在 `tool-router.ts:14` 生产）**成立且 SAFE-TO-IMPLEMENT**。但下列修正必须并入；实现以本节为准。

## C.1 [CRITICAL] stage-2 evidence gate 不是纯叶子——必须**拆分**而非整体下沉

§A.4/§B.P1.2 把 stage-2 谓词当"纯函数可整体移进 domain"——**源码反证**：`recipe-evidence-gate.ts` 模块顶层 `:1` `import fs`、`:3` `import { getOrCreateSessionManager } from '@alembic/core/host-agent-workflows'`（**workflows 层 facade**），并贯穿 `shouldRunRecipeEvidenceGate :88-110`、`validateRecipeSessionScope :151`(读 session.projectRoot/dimensions)、`validateSourceRef :555-581`(fs.existsSync/statSync/readFileSync)。domain 模块**不能** import workflows → 整体下沉破 `lint:layer-contract`，且 `host-agent-workflows` 是 Core facade → 风险 **domain→workflows→domain 真环**。

**修（明确 SPLIT）**：只**纯数据谓词**进 `domain/gate-rules.ts`——`validateEvidenceFloor`(:283 distinct-files Set<3)、`requiresMultiFileEvidence`(:670)、`looksLikePlaceholder`(:694)、`normalizedCode`(:705)、`snippetMatchesSourceRange`(:709)、`hasRelationshipClaim`(:644)、source-ref **格式正则半**(:510-522)。**session-scope**(`validateRecipeSessionScope`/`shouldRunRecipeEvidenceGate` 经 getOrCreateSessionManager)+ **fs 存在/范围半**(:528-581)**留 Plugin 侧**，经 typed `sourceRefResolver` + `sessionScope` port 注入 `validateAgainst`。`SESSION_NOT_FOUND`/`WRONG_SCOPE`/`SOURCE_REF_NOT_FOUND`/`SOURCE_REF_LINE_OUT_OF_RANGE` 标为 **runtime-only(非 spec)**，写进 enforcement matrix。**新增验收**：lift 后 `lint:layer-contract` 绿 + `gate-rules.ts` 零 `node:fs`/`host-agent-workflows` import。

## C.2 [HIGH·决策点 D-A] `confidence>=0.85` 指引虚高门——spec 必须裁定

实测**无 gate 强制 confidence 下限**（`FieldSpec.ts:143` 只要 `reasoning.confidence` 是数字存在；`UnifiedValidator.ts:144` 的 0.85 是错误串里的示例文本非检查）；但指引 `OnboardingContract.ts:509`/`buildRecipeGuidanceFloor:938` 断言"≥0.85 floor"。§A.6/§B.P4 drift 测**未覆盖 confidence** → 修后指引仍虚高且 drift 测照过。**决策 D-A（见末）**：(a) 指引订正为"建议 ≥0.85，非强制"（推荐——CG-3 门禁不放松）vs (b) `gate-rules.ts` 加真 `confidence.floor` 接 stage-3（**更严=行为变更，须你 sign-off**）。无论哪个，**加 confidence drift 断言**。

## C.3 [HIGH] deepMining/moduleMining 的 rescan briefing 装配未被 re-point

§A.4/§B.P2 把 deepMining/moduleMining 当"同 cold-start，靠 submissionSpec collapse 覆盖"，但**实际 mining 指引产出在 rescan briefing 装配**（`knowledge-rescan.ts ~:1278` 解析 generationStage）——A/B 没给它 re-point 行。**修**：P2 增加对 rescan/mining briefing 装配的具体 re-point（`knowledge-rescan.ts` file:line），或 grep 证明 mining 逐字复用 `buildProjectContextMissionBriefing`。否则 CG-4 的"deepMining+moduleMining 覆盖"是假设非证明。

## C.4 [HIGH] in-process parity（CG-4）是**收紧**非 byte-identical no-op——须独立验收

今 in-process（`AlembicAgent/.../knowledge.ts:175` gateway.create）只跑 `validateSubmitParams`(:283-334，**仅长度检查**：无 verb 白名单/无 ✅❌/无 ≥3-file/无 snippet)。§B.P1.4 加 `validateAgainst({stage:'all',path:'in-process'})` 会**新拒**今天能过的 in-process recipe。**修（当 scoped 行为变更）**：(a) **先**升 in-process producer prompt(`insightProducer.ts`，P2.6)让 producer 先知新规则——否则 in-process agent 重蹈"逆向试错门"；(b) 加"当前能过的 in-process recipe 语料"回归，明确哪些现应失败；(c) 验 `dimMeta?.id`/session plumbing 在 in-process 真存在（否则 stage-2 静默 no-op、parity 只部分）。

## C.5 [HIGH·关键] 所有 4 个现有 EXAMPLE_TEMPLATES **本身过不了门**——P3 必修反例 + 自洽 tripwire

实测 4 个 EXAMPLE_TEMPLATES 全触 `CONTENT_CONTRAST_MISSING`（`// ✅ 正确` trim 后 2 字符 < `:215` 的 ≥4 floor）；objectivec 还触 `DO_CLAUSE_NON_IMPERATIVE`。**所谓"完整示例"竟不合格**。**修**：P3 修正每个 shipped 示例使其**过整门**；新增 **example 自洽测**——对每个 `example(lang)` 跑 `validateAgainst({stage:'all'})` 必须 ok，作为"出厂示例恒过门"的常驻 tripwire。

## C.6 [MED·决策点 D-B] submissionSpec collapse 对 `alembic_plan` 是 visible-behavior 变更

两 builder 的 `targetCandidateCount` 矛盾（MissionBriefingBuilder "最少3条" vs DimensionCatalogPayload "可提交0条"，后者唯一消费 `plan-tool.ts:417`）。collapse 强制一个答案 = **改 alembic_plan 可见指引**（现告诉 agent "0 条 OK"）。CG-1..4 未覆盖谁胜。**决策 D-B（见末）**：默认 evidence 一致的 ≥3 vs 保留 plan draft 的"0 OK"。并验 `plan-tool.ts:417` 对 unified shape 仍 type-check（两 builder 返回字段 crossDimensionDedup/contentQuality 措辞不同）。

## C.7 [MED] main-body 第二个 in-process 提交入口

S5：in-process 有两个消费方——AlembicAgent `knowledge.ts handleSubmit` **与** main-body `Alembic/lib/governance/gateway/GatewayActionRegistry.ts:26,79 → knowledgeService.create`。§B.P1.4 只 re-point 了 AlembicAgent。**修**：确认 main-body in-process submit 是否经 AlembicAgent handleSubmit（embedded runtime）还是独立 `knowledgeService.create`；若独立，P1.4 增显式 re-point，否则 CG-4 漏 main-body 路径。

## C.8 [MED] P5 baseline 必须改前捕获

§B.P5 "一次过门率高于 baseline"+"文档度 >0.65" **无改前 baseline 捕获机制**（P1.0 只存 gate-output 字节非 submission 一次过门率），且 doc-score 检查是 `node -e` 桩。**修**：P0/P5 在 P1 前对目标维度记 baseline 一次过门率 + 文档度存 fixture，P5 验收 diff；doc-score 用真 `QualityScorer` 跑 N 抽样非桩。

## C.9 [MED] EXAMPLE_TEMPLATES 下移仅供**内部**——勿经 facade 泄漏

`host-agent/index.ts:75 export * from MissionBriefingSupport`，而 MissionBriefingSupport 由 stable-public `@alembic/core/host-agent-workflows` facade 暴露。若下移后 MissionBriefingSupport 再 re-export EXAMPLE_TEMPLATES → 该 facade 透传一个 domain 符号 = public-api-boundary 面变更。**修**：下移后 MissionBriefingSupport 仅**内部** import（其 `MissionBriefingBuilder.ts:1136` 选取用），**不**再 re-export；需要示例的消费方从 `@alembic/core/knowledge` import `example(lang)`；重跑 `npm run check` boundary 步并**有意**更新快照。先 grep 证 EXAMPLE_TEMPLATES 常量体不依赖该文件的 workflows 层 import。

## C.10 [MED] P0.0 enforcement matrix 是**硬 gate**；snapshot 覆盖 regex `.source`+`.flags` + Set 成员

- enforcement matrix(`recipe-gate-enforcement-matrix.json` + grep-backed 测，列"哪条 reject code 在哪个 gate 文件")是 **P0 硬前置**，使"哪规则在哪强制"不可再开（§A.6 drift#7 依赖它存在）。
- snapshot tripwire 必须比 regex 的 `.source`+`.flags`（非引用/值快照——丢 `NON_ENGLISH_SCRIPT_RE` 的 `u` flag 会改 Unicode 匹配）+ Set 成员。**verb count 实为 45**（dossier 误为 44/46）——**从 lifted Set 派生，永不写字面量**。

## C.11 [LOW] 注入 port 类型化保"通用"

`sourceRefResolver`/`sessionScope` 在 `types` 层定义为显式接口（`SourceRefResolver`/`SessionScope`），domain 模块 import 之，Plugin/main-body 供实现——使"general"由类型强制而非约定（lint 抓 import 不抓注入闭包）。

## C.12 其它已订正 file:line
- UnifiedValidator stage-3 还有 source-ref 质量 warnings(:202-220)、too-simple content 检查(:245+)、reasoning 须 object(:144)——`gate-rules.ts` 快照须枚举，否则不完整。
- `RecipeCandidateValidator.ts:58` 重复 `VALID_KINDS` Set + `getAgentAdapterFieldSpec` 在 FieldSpec.ts:348 与 StyleGuide.ts:36 重复——某阶段须 own 收口验收。
- `OnboardingContract.firstCallExample`(:598) 是 `dimension_complete` 例非 submit 例，勿误接为 submit worked-example。

---

## 决策点（✅ 全已决 2026-06-29）

- **D-A（confidence 门）= 订正指引为"建议 ≥0.85 非强制"**（CG-3 门禁不放松、不加新严规则）。实现：guidance-generator 把 confidence 渲染为"recommended >=0.85, not enforced"（同步 `OnboardingContract.ts:509`/`buildRecipeGuidanceFloor:938`）；drift 测加一条断言"指引 confidence 措辞=非强制 且 gate-rules 无 confidence.floor"，防再虚高。
- **D-B（alembic_plan submissionSpec floor）= collapse 后统一 evidence 一致的 ≥3**（rule/pattern；与 host-agent 路径一致，单一真相）。记为**有意的 alembic_plan 可见指引变更**（draft 不再说"0 条 OK"）；P2 须验 `plan-tool.ts:417` 对 unified `buildSubmissionSpec` shape 仍 type-check。
- **D-B（alembic_plan submissionSpec floor）**：(a) collapse 后统一 evidence 一致的 ≥3（推荐，与 host 一致）vs (b) plan draft 路径保留"0 条 OK"语义。

---

# SECTION D（§12）— 全打平：单契约 + context-profile + 持续进化（2026-06-29 决策）

> 用户决策：**两路（AlembicPlugin host-agent + Alembic 主体 in-process AI API Agent）全部打平**，用统一的一套契约（`RecipeAuthoringSpec`）生成 + 校验 Recipe，后续在这一个契约模块上持续优化。下面把"打平"落到精确语义与代码层。

## 12.1 "打平"的精确语义

打平 ≠ 到处跑一模一样的扁平规则。打平 = **一个 canonical 契约模块作为单一真相，两路逐字跑同一套规则；今天的全部差异收敛为 spec 模块内部声明的三个参数化轴**，而非散在两路代码里：

```
RecipeAuthoringSpec (Core domain/knowledge/recipe-authoring-spec/, 单源)
  ├─ rules + content-contract + examples + failure-modes   ← 两路 100% 共享
  ├─ profiles: { 'cold-start', 'opportunistic', ... }       ← 严格度按上下文(§12.3)
  ├─ fieldSuppliers: { category:'system'|'agent', ... }     ← 按 path 投影必填集
  └─ ports(types 层接口): { sourceRefResolver, sessionScope } ← 各宿主注入实现(都用真 fs)
两路统一调用: validateAgainst(candidate, { profile, path, ports })  +  renderGuidance({ path, profile })
```

三轴**全部在 spec 内声明**，宿主只做"注入 port + 选 profile + 选 path 投影"。⇒ host / in-process / 任何未来宿主，规则恒一致。

## 12.2 为什么无硬阻断（逐分歧判定）

| 今天的分歧 | 本质 | 统一手段 |
|---|---|---|
| 纯规则(verb/✅❌/snippet/≥3 files/字段/markdown/示例/失败模式) | 内容形、宿主无关 | 直接共享(§A gate-rules/content-contract) |
| evidence 门要 fs + session | 规则相同、**解析器**不同 | spec 定规则 + 注入 `sourceRefResolver`/`sessionScope` port；**in-process 同是 Node 进程、项目在磁盘 → 同样能跑** |
| evidence 仅冷启动触发 | 严格度按上下文 | **context-profile**(§12.3)在 spec 内声明 |
| systemInjected 4 字段(host agent 给 / in-process 系统注入) | "谁供该字段"的元数据 | per-field `supplier` + per-path 投影(`getExternalAgentRequiredFields`/`getInternalAgentRequiredFields` 已有雏形) |
| 生成指引措辞不同(submitKnowledgeContract vs insightProducer.ts) | 渲染差异、规则应同 | `guidance-generator` 从同一 spec 按 path 渲染 |

无任一项需要"两路各留一套"。

## 12.3 context-profile 模型（决策：profiled，非 flat）

一个 spec、多个 profile；profile 选择信号**复用既有 `shouldRunRecipeEvidenceGate`**（session/dimensionId 在场 → cold-start；否则 opportunistic）：

- **profile `cold-start`**（系统化冷启动 authoring，host-agent 冷启动 + in-process 冷启动）：**全门** = content 门(verb 白名单 + ✅/❌ + markdown≥200+代码块 + 字段/reasoning) + evidence 门(≥3 distinct files + snippet 逐行号匹配 + sourceRef 行号 + graph) + session-scope。
- **profile `opportunistic`**（主体 AI 开发中随手产 Recipe，无冷启动 session）：**content 门全保留**(verb + ✅/❌ + markdown≥200+代码块 + 字段/reasoning) + **轻证据**(coreCode 仍须 grounded：给了 sourceRef 则须带行号、给了 snippet 则须匹配；但**不强制 ≥3 distinct files**) − session-scope。
- 可扩展：未来新宿主/新模式在 spec 内新增 profile，不改两路代码。

⇒ 机会主义路径只扛**廉价的 content 门**，不被冷启动级 3-file 证据门压垮（解决 §C.4 的过度收紧顾虑）。

## 12.4 P1.4 升级为"全打平"（覆盖 §B.P1.4 / §C.4）

§B.P1.4 从"in-process 加跑 host 全门"**升级为全打平**：

- in-process 提交(`AlembicAgent/.../handlers/knowledge.ts:101` 今天的 `validateSubmitParams`，及 main-body `GatewayActionRegistry → knowledgeService.create` 见 §C.7)**统一改为** `validateAgainst(candidate, { profile, path:'in-process', ports })`，profile 由上下文(有无冷启动 session)选；ports 注入 in-process 的真 fs resolver + sessionScope。删除 `validateSubmitParams` 薄校验（其长度检查并入 spec content 门）。
- in-process producer prompt(`insightProducer.ts`)改为 `renderGuidance({ path:'in-process', profile })`，与 host 同源、措辞贴合。
- **收紧范围订正(覆盖 §C.4)**：profiled 后，机会主义 in-process 的新增门 = content 门(verb/✅❌/字段/markdown，廉价)；**不含** ≥3-file 证据门。仍须 §C.4 的纪律：**先升 producer prompt → 再启门**，并用"当前能过的 in-process recipe"语料回归确认新拒集合（现在只会是缺 verb/✅❌/markdown 太薄这类 content 问题，远小于原估）。

## 12.5 持续进化红利 + parity 验收

- **一处优化、全宿主受益**：改规则/契约/示例/profile 只在 `RecipeAuthoringSpec` 一处；两路(+ 未来任何宿主)同步生效。
- **parity 测（新增硬验收）**：对一批 fixture candidate，在同一 profile 下，host-agent 与 in-process 两路 `validateAgainst` 必须给出**逐字节相同**的 verdict（violations 数组相等）。这是"两路真打平"的常驻 tripwire。
- **drift 测（§A.6）**：guidance≡gate（指引由 spec 渲染、gate 由 spec 校验）。
- **新宿主成本=注入 port + 选 profile，零规则重复**。

## 12.6 决策锁定（2026-06-29）

- **严格度模型 = context-profile**（cold-start 严 / opportunistic 轻），非 flat。
- **全打平纳入本需求**：§9 模块设计的 API（`validateAgainst`/`renderGuidance`）显式带 `{profile, path, ports}`；§10 实现指导 P1.4 升级为全打平 + 新增 parity 测验收；in-process 与 main-body 两个提交入口都 re-point 到统一 `validateAgainst`。
- 非目标：不为打平而放松 cold-start 门（cold-start profile 字节级不变）；profiled 不是"给 in-process 开后门"，而是声明 opportunistic 本就不需要系统化证据门。

---

# Section 13 — Unified Generation-Chain Design (Front-Load the Authoring Contract)

This section converts the four chain-survey dossiers (G1 outer, G2 inner, G3 per-field semantics, G4 front-load gap) into one design. The defect is settled and grounded: the per-field rule content for all V3 fields already exists authoritatively across five Core constants, but it is **distributed** to the two generation chains through two disjoint assemblies, and the strongest per-field artifact that *is* surfaced (`fieldFloors`) is a *reject threshold*, not a *generation rule*. The fix is a single canonical `RecipeAuthoringSpec.renderGuidance({path, profile})` rendered into BOTH chains at the same logical point — before the first authoring token — so the gate returns to being a safety net and the rendered contract becomes the instruction path.

---

## 13.1 The two chains made transparent — side-by-side end-to-end map

Both chains run the **same five abstract stages**: `trigger → context-gathering → guidance/contract presentation point → authoring → submit`. The difference is entirely in the third stage (what object the agent sees) and the surface it is rendered into. The "object the agent SEES before authoring" column is the load-bearing one — it is where front-loading either happens or fails.

| Abstract stage | OUTER — host-agent (AlembicPlugin + Core) | INNER — in-process AI (Alembic main-body + AlembicAgent) |
|---|---|---|
| **1. Trigger** | `alembic_init` → `alembic_plan` draft (`AlembicPlugin/lib/recipe-generation/plan-tool.ts:329` `draftPlan` → `:442` `planDraftResponse`) → `alembic_plan` confirm (`plan-tool.ts:309` → `plan-confirm.ts` `confirmPlan`) → `alembic_bootstrap` (`AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts:107` `runHostAgentProjectIndexFullWorkflow`) | `runProjectIndexWorkflow(ctx, args, { mode })`: cold-start `mode:'full'` (`Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts:103`), rescan `mode:'incremental'` (`Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:191-193`). (Opportunistic file-change `Alembic/lib/service/evolution/InProcessFileChangeHandler.ts:186,268,394` is evolution-only — `gateway.submit`, not the authoring loop.) |
| **2. Context-gathering** | `MissionBriefingBuilder.enrichDimensionTask` (`AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:244`) builds per-dimension `analysisGuide` + `submissionSpec`. ProjectInfoTree/candidateDimensions come from `plan-tool.ts:415-424`. | `buildProjectContextWorkflowFacts(...)` (`KnowledgeRescanWorkflow.ts:276-283`) → `buildProjectContextFillView` (`:741`) → `createBootstrapDimensionRuntimeInput` (`Alembic/lib/workflows/ai-execution/DimensionRuntimeBuilder.ts:142`) builds `strategyContext` (`:282-285`). `dimConfig` = `DIMENSION_CONFIGS_V3` (label/outputType/allowedKnowledgeTypes/focusKeywords only). |
| **3. Guidance/contract presentation point** ⟵ load-bearing | **The `alembic_bootstrap` response `data`.** `buildColdStartMissionBriefing` (`cold-start.ts:285`) layers `buildProjectContextMissionBriefing` (`:297`) + `attachColdStartOnboardingSurface` (`:321`, attaches `hostAgentContract` via `buildHostAgentContract` `OnboardingContract.ts:346` → `submitKnowledgeContract` `:369`/`:468`) + critic/creation-guide surfaces (`:333`,`:344`). Spread whole into `envelope.data` by `presentHostAgentColdStartResponse` (`AlembicCore/src/workflows/project-index/ColdStartPresenters.ts:224`, `...briefing` at `:239`). | **The producer-stage prompt**, built once per dimension in the `insight` preset (`AlembicAgent/src/agent/profiles/presets.ts:247-256`): `PRODUCER_SYSTEM_PROMPT` (`AlembicAgent/src/agent/prompts/insightProducer.ts:73-108`) + `buildProducerPromptV2` (`insightProducer.ts:210-348`) appending `STYLE_GUIDE` + `PRODUCER_SUBMIT_FIELD_CONTRACT` + `SUBMIT_REQUIREMENTS` (`insightProducer.ts:272-274`). |
| **Exact object seen before authoring** | `data.hostAgentContract.submitKnowledgeContract` (`fieldFloors` `OnboardingContract.ts:497-510`, `sourceRefCardinality` `:511-517`, `purpose` `:472-473`) + `data.currentDimensionGuidance[].submissionSpec` (`PRE_SUBMIT_CHECKLIST` via `MissionBriefingBuilder.ts:330`, `cursorFields=getCursorDeliverySpec()` `:327`, sliced StyleGuide `:315-319`) + `data.submissionSchema.example` (one per-language `EXAMPLE_TEMPLATES` `MissionBriefingBuilder.ts:1135-1138`). **All budget-fragile** (see 13.4). | `STYLE_GUIDE` = `buildProducerStyleGuide()` (`AlembicCore/src/domain/knowledge/StyleGuide.ts:94-105`, full `PROJECT_SNAPSHOT_STYLE_GUIDE` `:14-31` + adapter spec that **skips** content/reasoning/title fields `StyleGuide.ts:45-59`) + hand-written `PRODUCER_SUBMIT_FIELD_CONTRACT` (`insightProducer.ts:135-142`) + `SUBMIT_REQUIREMENTS` (`StyleGuide.ts:108-119`). **No worked example. No PRE_SUBMIT_CHECKLIST. No fieldFloors. No sourceRefCardinality.** |
| **4. Authoring** | Host agent reads `envelope.data`, authors candidates in its window. | `runAiDimensionSession` (`Alembic/lib/workflows/ai-execution/AiDimensionSessionRunner.ts:54`) runs Analyst → quality_gate → Producer pipeline; Producer budget `maxIterations:24, maxSubmits:10` (`insightProducer.ts:120-127`). `producerRejectionGateEvaluator` (`insightProducer.ts:503-535`) retries when `rejected > success && rejected >= 2` (`:531`) — the structural learn-by-rejection loop. |
| **5. Submit (gate = safety net)** | `alembic_submit_knowledge` → `routeSubmitKnowledgeTool` (`AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts:151`): content-quality gate (`:163` `validateSubmitKnowledgeContentQuality`) → evidence gate (`:172` → `recipe-evidence-gate.ts`) → `RecipeProductionGateway.create` (`:183`). | `AlembicAgent/src/tools/runtime/handlers/knowledge.ts:92` `handleSubmit` → thin `validateSubmitParams` (`:101`, body `:283-334`) → `gateway.create` (`:175`). **Content-quality + evidence gates do NOT run here** — only `RecipeProductionGateway`/`UnifiedValidator`. |

**Two transparency facts the map exposes.** (1) Timing is already correct on both chains — the contract object is present *before* the first authoring token in both. The defect is the *shape and completeness* of that object, not its placement. (2) The two chains share their Core source roots (`FieldSpec`, `StyleGuide`, `DimensionSop`, `EXAMPLE_TEMPLATES`) and their final safety net (`RecipeProductionGateway`/`UnifiedValidator`), but pass through **two disjoint assemblies** (OUTER = `OnboardingContract` + `MissionBriefingBuilder` JSON; INNER = `insightProducer` prose prompt). The in-process producer never imports `OnboardingContract`, `fieldFloors`, `PRE_SUBMIT_CHECKLIST`, or `EXAMPLE_TEMPLATES` (confirmed by G1/G2 grep). That divergence is exactly what 13.2 unifies.

---

## 13.2 The unified generation logic — one spec feeding both chains

### The common abstract pipeline

Strip the surface differences and both chains are the same machine:


trigger → gather ProjectContext (per dimension)
        → PRESENT authoring contract  ← single unification seam
        → author candidates (loop, budget-bounded)
        → submit → gate (safety net) → [accept | reject → re-author]


The only stage that diverges in *content* is **PRESENT authoring contract**. Unification means both chains call one renderer at that seam and emit identical contract text, parameterized only by what legitimately differs between them (the resolver ports and the active profile).

### `RecipeAuthoringSpec.renderGuidance({ path, profile })` — the single seam

The canonical module (Core `domain/knowledge/recipe-authoring-spec/`, exposed via `@alembic/core/knowledge`) is the *one* place that reads the five existing source-of-truth roots and renders them into one comprehensive per-field contract:

- per-field meaning ⟵ `FieldSpec.V3_FIELD_SPEC[*].rule` (`AlembicCore/src/domain/knowledge/FieldSpec.ts:33-226`)
- per-field generation rule + threshold ⟵ `fieldFloors` + `sourceRefCardinality` (`OnboardingContract.ts:497-517`) merged with `SUBMIT_REQUIREMENTS` (`StyleGuide.ts:108-119`) and the body style guide `PROJECT_SNAPSHOT_STYLE_GUIDE` (`StyleGuide.ts:14-31`)
- per-field worked value ⟵ `EXAMPLE_TEMPLATES` (`AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingSupport.ts:106-213`)
- per-field failure mode ⟵ `PRE_SUBMIT_CHECKLIST` MUST/SHOULD/`FAIL_EXAMPLES` (`AlembicCore/src/domain/dimension/DimensionSop.ts:1702-1739`) + the enforced micro-rule constants the gates own (verb allowlist `AlembicPlugin/lib/runtime/mcp/handlers/recipe-content-quality-gate.ts:28-89`; evidence floors `recipe-evidence-gate.ts:191-320,496-591`)

The two parameters are exactly the two things that legitimately differ between chains:

- **`path` (ports)** — `sourceRefResolver` / `sessionScope` suppliers. OUTER resolves refs against the workspace root and a session-bound evidence scope; INNER resolves against the in-process `projectRoot`/`analysisScope` (`KnowledgeRescanWorkflow.ts:276-283`). The rendered *rules* are identical; only ref-resolution binding differs.
- **`profile`** — `cold-start strict` vs `opportunistic light` (13.3). Selects evidence-floor strictness (`shouldRunRecipeEvidenceGate` `recipe-evidence-gate.ts:88-110`; producer rescan-budget branch `insightProducer.ts:308-327`) and candidate-count targets, but renders the *same* per-field table either way.

Per-field **suppliers** (system vs agent) come from `FieldSpec.getSystemInjectedFields()` (`FieldSpec.ts:323` → `category/dimensionId/knowledgeType/language`): these fields render as "system-injected — do not author" in both chains, matching today's behavior (OUTER `StyleGuide.ts:101`; INNER auto-derive `knowledge.ts:127-134`).

**Result:** the text the gate enforces and the text the agent reads first become one rendered surface. Each of the five roots stops being maintained three times (contract floor vs gate enforcement vs producer prompt) and is maintained once.

---

## 13.3 The comprehensive up-front contract the agent sees before generating

`renderGuidance` emits one self-contained block per active dimension, *before* authoring, containing four parts plus the active profile. This is what replaces today's thin floor.

### Part A — Per-field table (every V3 field: meaning | generation rule | example value)

Rendered for all 21 `exactFields` (`OnboardingContract.ts:474-496`). The G3 dossier already compiled the authoritative content; the table below is the rendered shape, each cell traced to its single source.

| Field | Meaning (FieldSpec.rule) | Generation rule (how to derive) | Example value (EXAMPLE_TEMPLATES) | Source roots |
|---|---|---|---|---|
| `title` | Recipe headline; identity + dedup + search | Cite a real class/pattern name; ≤20 zh chars; no project-name prefix; concrete executable rule not vague description | `"ViewModel 的 Output 必须通过 Driver 转换"` | `FieldSpec.ts:36-41`; `fieldFloors.title OnboardingContract.ts:498`; `FAIL_EXAMPLES DimensionSop.ts:1729`; `MissionBriefingSupport.ts:*.title` |
| `description` | ≤80-char zh summary; search display | Concise zh, ≤80, cite real class name, mention scope | filled per template | `FieldSpec.ts:64-69`; `OnboardingContract.ts:499`; `DimensionSop.ts:1705,1723` |
| `trigger` | `@kebab-case` stable id for adapter | Unique `@`-prefixed kebab id; rescan must avoid `occupiedTriggers` | `@bd-class-prefix` | `FieldSpec.ts:74-78`; `OnboardingContract.ts:500`; `StyleGuide.ts:79` |
| `language` | programming-language id | **system-injected — do not author** | (system) | `FieldSpec.ts:170-177`; `StyleGuide.ts:101`; `knowledge.ts:130-134` |
| `kind` | route `rule\|pattern\|fact` | hard constraint→rule, impl pattern→pattern, project fact→fact; never a dimension name | `pattern` | `FieldSpec.ts:80-85`; `DimensionSop.ts:1707`; `StyleGuide.ts:82` |
| `category` | business/component class | One of View/Service/Tool/Model/Network/Storage/UI/Utility; not a dimension id | `Service` | `FieldSpec.ts:116-123`; `fieldFloors OnboardingContract.ts:501` |
| `knowledgeType` | knowledge-form class | **system-injected**; pick form tag, not dimension attribution | (system) | `FieldSpec.ts:163-169`; `OnboardingContract.ts:481` |
| `content.markdown` | ≥200-char 项目特写 body | 项目特写 four-part structure (chose/why/forbidden/how-to-write); ≥1 fenced block; ✅/❌ contrast; `(来源: Full/Path/File.ext:行号)` | full body per template | `FieldSpec.ts:50-55`; `StyleGuide.ts:14-31`; `fieldFloors OnboardingContract.ts:502`; `MissionBriefingSupport.ts:112` |
| `content.rationale` | design-principle explanation | Explain WHY the project adopts this, ≥50 chars | filled | `FieldSpec.ts:56-62`; `DimensionSop.ts:1709`; `SUBMIT_REQUIREMENTS StyleGuide.ts:118` |
| `coreCode` | 3-8-line copy-ready skeleton | 3-8 syntactically complete consecutive lines verbatim from a cited `file:line` (not pseudocode) | 3-8 real lines | `FieldSpec.ts:108-113`; `fieldFloors OnboardingContract.ts:505-506`; enforced `UnifiedValidator.ts:222-229` |
| `headers` | import statements (`[]` if none) | Collect imports coreCode needs; empty array if none | `[...]` | `FieldSpec.ts:132-138`; `DimensionSop.ts:1711`; `MissionBriefingSupport.ts:149` |
| `doClause` | EN positive imperative ≤60 tok | Verb-leading EN clause from **closed positive-verb allowlist** | `"Prefix all class names with BD"` | `FieldSpec.ts:87-92`; `fieldFloors OnboardingContract.ts:503`; verbs `recipe-content-quality-gate.ts:28-89` |
| `dontClause` | EN negative constraint | Negative imperative EN from **closed negative-verb allowlist** | `"Avoid unprefixed class names"` | `FieldSpec.ts:93-99`; `OnboardingContract.ts:504`; verbs `recipe-content-quality-gate.ts:102-169` |
| `whenClause` | EN trigger-scenario | EN clause stating WHEN the rule applies | `"When creating new Objective-C classes"` | `FieldSpec.ts:100-106`; `DimensionSop.ts:1714`; floored `knowledge.ts:318` |
| `reasoning.whyStandard` | why this is the standard | One sentence + the stat ("83/85 classes use BD prefix") | filled | `FieldSpec.ts:147-152`; `DimensionSop.ts:1715`; `MissionBriefingSupport.ts:93` |
| `reasoning.sources` | non-empty path array | Full repo-relative paths (NOT bare filenames) of source files | `["Path/.../X.swift"]` | `FieldSpec.ts:154-159`; `fieldFloors OnboardingContract.ts:508`; floored `knowledge.ts:324-331` |
| `reasoning.confidence` | 0.0-1.0 provenance | ≥0.85 for normal submit else narrow scope | `0.88` | `fieldFloors OnboardingContract.ts:509`; `MissionBriefingSupport.ts:95` |
| `sourceRefs` | final-candidate refs (path:line) | **≥3 distinct in-scope `path:line` refs** for universal rule/pattern (≥1 for a fact) unless `scope:narrow` | 3 refs | `sourceRefCardinality OnboardingContract.ts:511-517`; `DimensionSop.ts:1716`; enforced `recipe-evidence-gate.ts:283-307` |
| `usageGuide` | `###`-section usage guide | Markdown `### When to Use / Key Points / When Not to Use` | filled | `FieldSpec.ts:178-184`; `fieldFloors OnboardingContract.ts:507`; `DimensionSop.ts:1717` |
| `dimensionId` | dimension attribution | **system-echoed** — carry current dim id; not in category/knowledgeType | (current dim) | `FieldSpec.ts:124-131`; `insightProducer.ts:169,266`; `knowledge.ts:112-113` |

### Part B — The active profile (rendered, not implicit)

Today the strict/light regime is implicit (`shouldRunRecipeEvidenceGate` `recipe-evidence-gate.ts:88-110`; producer rescan branch `insightProducer.ts:308-327`) and the agent is never told which it is under. `renderGuidance({profile})` states it: **cold-start strict** (session-bound hard evidence gate, ≥3 candidates/dimension target `MissionBriefingBuilder.ts:313-314`, ≥3 distinct files) vs **opportunistic light** (relaxed evidence floor, single-candidate maintenance updates).

### Part C — One complete gate-passing worked example

A single fully-populated candidate (all 21 fields, ✅/❌ body ≥200 chars, a 3-8-line `coreCode` that substring-matches a cited `path:start-end`, 3 distinct sources) sourced from `EXAMPLE_TEMPLATES[primaryLanguage]` (`MissionBriefingSupport.ts:106-213`). Today this complete example reaches **only** the OUTER chain (`MissionBriefingBuilder.ts:1135-1138,1229-1232`) and is budget-droppable; the INNER producer prompt has **zero** worked example. `renderGuidance` emits it into both. (Note: today's per-language example is generic, not per-dimension; the spec should key it by both `primaryLanguage` and the dimension being authored.)

### Part D — The failure-mode catalog

The union of `RecipeContentQualityViolationCode` (8 codes, `recipe-content-quality-gate.ts`) and `RecipeEvidenceViolationCode` (24 codes, `recipe-evidence-gate.ts:5-24`), each rendered as "what will reject you and how to avoid it" with its `nextAction`, plus the `FAIL_EXAMPLES` bad/good/why triplets (`DimensionSop.ts:1727-1738`). These currently surface only *after* a rejected call (and the inner chain is never even checked against the content-quality/evidence codes — see 13.5). Front-loading them converts them from post-hoc error text into a generation instruction.

---

## 13.4 The principle landed — gate = safety net, rendered contract = instruction path

The contract self-declares this principle but does not deliver it. `submitKnowledgeContract.purpose` (`OnboardingContract.ts:472-473`): *"Prepare valid candidates before the first submit call; rejection remains a safety net, not the normal instruction path."* It is restated at `OnboardingContract.ts:358` (`stagedProtocol`) and `:375` (`recipeCreationSop`: "do not rely on tool rejection to discover missing fields"). Yet today:

1. **Floor ≠ generation rule.** The most reliably-surfaced per-field object is `fieldFloors` (`OnboardingContract.ts:497-510`) — defined as a *reject threshold*. The only per-field object present at authoring time is the very threshold the safety-net gate checks. This is the exact mismatch.
2. **Budget stripping removes the front-loading material first.** Under the 18 KB inline cap (`COLD_START_BRIEFING_INLINE_BUDGET_BYTES` `cold-start.ts:88`), the trim ladder (`trimColdStartBriefingToBudget` `:610`, `summarizeSubmissionSchema` `:976`, `compactColdStartBriefing` `:466` keeping only `MAX_INLINE_CURRENT_DIMENSION_GUIDES = 2` `:89`) demotes the worked example to a `note` ref, and `compactHostAgentContract` (`cold-start.ts:836-850`) keeps only 4 of 11 `fieldFloors` (category/contentMarkdown/doClause/dontClause), dropping `coreCode/usageGuide/reasoningSources/confidence/title/description/trigger`, all of `requiredBeforeSubmit`/`failureCodes`, and all but one `sourceRefCardinality` line. So on real (large) projects the OUTER agent authors with a thin floor inline and the rich contract behind a ref — precisely the learn-by-rejection trigger.
3. **The inner chain never declares or surfaces the principle at all** (G4): `knowledge.ts` never references `submitKnowledgeContract`; the producer's only pre-submit field text is the hand-written `PRODUCER_SUBMIT_FIELD_CONTRACT` (`insightProducer.ts:135-142`).

**What "landed" means concretely:**
- The **rendered contract is the instruction path** — `renderGuidance` (13.3) is the first thing the agent reads, comprehensive per-field, in BOTH chains, and is **protected from the budget compactor** (it goes on the keep-list, or is the ref-spilled full briefing the agent is *told to read first*, never the silent drop-list). The front-load block must never be the thing `compactHostAgentContract`/`compactDimensionSubmissionSpec` strips.
- The **gate stays a safety net** — `validateAgainst()` (the gate side of the same spec) still runs at submit, unchanged in strictness, but now enforces *the same text the agent already read*. A rejection becomes a genuine anomaly, not the normal teaching mechanism.
- **One source, two faces** — because the gate's enforced rules (verb allowlist `recipe-content-quality-gate.ts:28-89`, evidence floors `recipe-evidence-gate.ts`) and the rendered instruction come from one spec, "taught" and "checked" can no longer diverge. Today they do: G4 confirms the OUTER agent is rejected by verb/marker/snippet/distinct-files rules it was never shown, and the INNER agent is *never checked against those rules at all* — the inverse of the same gap.

---

## 13.5 What changes in each chain to surface this

### OUTER (host-agent) — Mission Briefing / submitKnowledgeContract

1. **Render the spec into the contract.** In `buildHostAgentContract` (`OnboardingContract.ts:346`), populate `submitKnowledgeContract` from `RecipeAuthoringSpec.renderGuidance({path: outerPorts, profile: 'cold-start-strict'})` so `fieldFloors` is replaced/augmented by the full per-field table (Part A), and add `submitKnowledgeContract.fieldGuide` + `.workedExample` (Part C) + `.failureModes` (Part D). The `purpose` line (`:472-473`) stays.
2. **Mirror it per dimension.** In `enrichDimensionTask().submissionSpec` (`MissionBriefingBuilder.ts:311-331`) so the block travels with `currentDimensionGuidance[].submissionSpec`. Replace the 12-line `PROJECT_SNAPSHOT_STYLE_GUIDE.slice(0,12)` (`:315-319`) with the rendered per-field contract; keep `preSubmitChecklist`/`cursorFields` as the spec's failure-mode/field inputs rather than separate constants.
3. **Protect from the compactor.** Put the rendered front-load block on the keep-list of `compactHostAgentContract` (`cold-start.ts:836-850`) and `compactDimensionSubmissionSpec` (`cold-start.ts:563-587`), or spill it as the ref-pointed *full* briefing the agent is explicitly instructed to fetch before authoring. The worked example and full field guide must never be the silent drop (today they are the first dropped: `cold-start.ts:610-734`, `MissionBriefingSupport.ts:355-357`).
4. **Add a submit-call first example.** Today `firstCallExample` exists only for `dimension_complete` (`OnboardingContract.ts:598-606`); add the equivalent for `alembic_submit_knowledge` from Part C.

### INNER (in-process producer) — the producer prompt

1. **Replace the thin triple with the rendered spec.** At the `buildProducerPromptV2` assembly point (`insightProducer.ts:272-274`, mirrored in `buildProducerPrompt` `:174-176`), replace `STYLE_GUIDE` + `PRODUCER_SUBMIT_FIELD_CONTRACT` (`:135-142`) + `SUBMIT_REQUIREMENTS` with `RecipeAuthoringSpec.renderGuidance({path: innerPorts, profile})` — emitting the full per-field table (Part A), the active profile (Part B), the verb allowlists, the ✅/❌ and snippet-verbatim micro-rules, and the failure-mode catalog (Part D). This closes the six fields G3 found with no inner pre-gen rule (`headers` #11, `coreCode` derivation #10, `dontClause` form #13, `reasoning.whyStandard` #15, `sourceRefs` cardinality #18, `usageGuide` #19).
2. **Inject the worked example (the single biggest inner gap).** `buildProducerPromptV2` injects no example today; add one `EXAMPLE_TEMPLATES` worked recipe (Part C) selected by `projectInfo` language + dimension. This is the in-process chain's largest front-loading hole (G2/G3).
3. **Align the inner floor and gate with what was front-loaded.** Today `validateSubmitParams` (`knowledge.ts:283-334`) floors only 9 fields and the content-quality + evidence gates **never run** on the inner path (`knowledge.ts:175` → `gateway.create` → `UnifiedValidator` only). Wire `validateSubmitKnowledgeContentQuality` + the item-level evidence checks into the inner path (in `knowledge.ts` before `gateway.create`, or inside `RecipeProductionGateway.create` `AlembicCore/src/service/knowledge/RecipeProductionGateway.ts:369` alongside `validator.validate`) so the safety net checks the same `validateAgainst()` rules the spec rendered — otherwise the inner agent is taught rules it is never checked against, the mirror of today's outer gap.
4. **Soften the rejection loop's role.** With the front-load landed, `producerRejectionGateEvaluator` (`insightProducer.ts:503-535`) becomes a true anomaly handler, not the normal recovery path — the same demotion 13.4 makes for the outer gate.

### Unification anchor

Both edits pull from the one canonical `RecipeAuthoringSpec` (Core `domain/knowledge/recipe-authoring-spec/`, exposed via `@alembic/core/knowledge`). `FieldSpec.V3_FIELD_SPEC` (`FieldSpec.ts:33-226`), `PROJECT_SNAPSHOT_STYLE_GUIDE`/`SUBMIT_REQUIREMENTS` (`StyleGuide.ts:14,108`), `PRE_SUBMIT_CHECKLIST` (`DimensionSop.ts:1702-1739`), `EXAMPLE_TEMPLATES` (`MissionBriefingSupport.ts:106-213`), the verb allowlists (`recipe-content-quality-gate.ts:28-89`), and the evidence floors (`recipe-evidence-gate.ts:191-320,496-591`) stop being three separately-maintained truths (contract floor vs gate enforcement vs producer prompt) and become one `renderGuidance({path, profile})` instruction path plus one `validateAgainst()` safety net — the same spec text the gate enforces is the text both agents see first, on the first try.

---

# Section 13.L — Code-Level Landing Plan: Front-Load the Per-Field Contract in Both Generation Chains

This is the implementation-ready landing for Section 13. It turns one canonical `RecipeAuthoringSpec.renderGuidance({ path, profile })` into the single instruction surface both chains read **before** authoring, and keeps `validateAgainst()` as the unchanged safety net. Every step gives the exact file/function and the before→after. The plan lands in dependency order: (L0) build the renderer that emits the per-field contract, then (L1) wire it into the outer chain, (L2) wire it into the inner chain, (L3) protect it from the budget compactor, (L4) align the inner safety net, with per-step acceptance asserted by reading the rendered artifact.

The work order is forced by data dependency: L0 produces the object L1/L2 inject; L3 only matters once L1 injects a larger object; L4 closes the taught-but-not-checked inner gap once L2 teaches the rules.

---

## L0 — The canonical spec module + per-field contract renderer (the new code)

**New module:** `AlembicCore/src/domain/knowledge/recipe-authoring-spec/` exported from the `@alembic/core/knowledge` barrel. This is the *single* place that reads the five existing source-of-truth roots; nothing else re-derives per-field text after this lands.

### L0.1 — `renderGuidance({ path, profile })` — the orchestrating entry

**File (new):** `AlembicCore/src/domain/knowledge/recipe-authoring-spec/renderGuidance.ts`

Signature (implementation-ready):


renderGuidance(opts: {
  path: 'host-agent' | 'in-process';
  profile: 'cold-start-strict' | 'opportunistic-light';
  dimensionId: string;
  primaryLanguage: string;
  ports: { sourceRefResolver: SourceRefResolver; sessionScope: SessionScope };
}): RenderedAuthoringContract


Returns one `RenderedAuthoringContract` object:


{
  purpose: string;                 // verbatim from OnboardingContract.ts:472-473
  profile: { id, evidenceRegime, candidateTarget, distinctFileFloor };  // Part B
  fieldGuide: FieldContractRow[];  // Part A — one row per exactField
  workedExample: RecipeCandidate;  // Part C — fully populated, gate-passing
  failureModes: FailureModeRow[];  // Part D — content-quality ∪ evidence codes
  systemInjectedFields: string[];  // FieldSpec.getSystemInjectedFields()
}


- `purpose` ← imported constant lifted from `OnboardingContract.ts:472-473` (move the string literal into the spec; the contract builder re-imports it so there is one source).
- `profile` ← `selectProfile(profile)` table (L0.4).
- `systemInjectedFields` ← `FieldSpec.getSystemInjectedFields()` (`AlembicCore/src/domain/knowledge/FieldSpec.ts:323`). Rows whose field is in this set render `gen-rule = "system-injected — do not author"`.

### L0.2 — `buildFieldGuide(dimensionId)` — the per-field {meaning | gen-rule | example} table renderer

**File (new):** `AlembicCore/src/domain/knowledge/recipe-authoring-spec/buildFieldGuide.ts`

This is the function Section 13.3 Part A names — it emits the per-field 4-tuple by **joining the five roots on field name**, not by re-authoring any rule string. For each field in `OnboardingContract.exactFields` (the 21-field list, `AlembicPlugin/lib/runtime/status/OnboardingContract.ts:474-496` — lifted into the spec as `EXACT_FIELDS` so Core owns it and the plugin re-imports):


FieldContractRow = {
  field: string;
  meaning:   V3_FIELD_SPEC[field].rule,                 // FieldSpec.ts:33-226
  genRule:   join(fieldFloors[field],                   // OnboardingContract.ts:497-510
                  sourceRefCardinality[field],          // OnboardingContract.ts:511-517
                  submitRequirementFor(field)),         // StyleGuide.ts:108-119
  example:   EXAMPLE_TEMPLATES[primaryLanguage][field], // MissionBriefingSupport.ts:106-213
  failsWith: PRE_SUBMIT_CHECKLIST.failExamplesFor(field) // DimensionSop.ts:1727-1738
            ∪ gateCodesFor(field)                       // L0.3
}


Before→after for the source data (no new rule content is invented; existing constants are *imported*, not copied):
- `meaning` before: `V3_FIELD_SPEC[field].rule` lives only in `FieldSpec.ts`, surfaced lossily via `getAgentAdapterFieldSpec`'s skip-list (`StyleGuide.ts:45-59`). After: read directly here for **all** 21 fields, no skip-list.
- `genRule` before: `fieldFloors`/`sourceRefCardinality` are host-agent-only (`OnboardingContract.ts:497-517`) and compacted to 4 fields (`cold-start.ts:836-850`). After: read here for all fields; compaction can no longer drop them silently (L3).
- `example` before: per-language only, dropped under budget. After: keyed by `(primaryLanguage, dimensionId)` so the example matches the dimension being authored (see L0.5 note).

`buildFieldGuide` MUST import `FieldSpec`, `StyleGuide`, `DimensionSop`, `MissionBriefingSupport` constants directly — it is the only module that does, replacing the three separate readers (OnboardingContract floor / gate enforcement / producer prompt).

### L0.3 — `buildFailureModes()` — Part D catalog renderer

**File (new):** `AlembicCore/src/domain/knowledge/recipe-authoring-spec/buildFailureModes.ts`

Renders the union of:
- `RecipeContentQualityViolationCode` (8 codes) + verb allowlists (`AlembicPlugin/lib/runtime/mcp/handlers/recipe-content-quality-gate.ts:28-89,102-169`) → each as `{ code, whatRejects, howToAvoid, nextAction }`. **Move the verb-allowlist constants (`POSITIVE_/NEGATIVE_IMPERATIVE_VERBS`) into the spec module** so the gate and the renderer share one array (the gate re-imports). This is the only way "taught verbs == checked verbs" holds.
- `RecipeEvidenceViolationCode` (24 codes, `AlembicPlugin/lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts:5-24`) + the floor thresholds (`:191-320,496-591`) → same shape, including the snippet-verbatim mechanic, ≥3-distinct-files rule, and the `scope:'narrow'` escape hatch made explicit.

The renderer attaches each failure row to its field in `buildFieldGuide` via `gateCodesFor(field)` (a static field→codes map declared here), so failure modes appear **with** the field, not as a separate global list.

### L0.4 — `selectProfile(profile)` — Part B

**File (new):** `AlembicCore/src/domain/knowledge/recipe-authoring-spec/selectProfile.ts`

Renders the regime the agent is under (today implicit at `recipe-evidence-gate.ts:88-110` and `insightProducer.ts:308-327`):
- `cold-start-strict` → `{ evidenceRegime: 'session-bound-hard-gate', candidateTarget: 3, distinctFileFloor: 3 }` (matches `MissionBriefingBuilder.ts:313-314`).
- `opportunistic-light` → `{ evidenceRegime: 'relaxed-floor', candidateTarget: 1, distinctFileFloor: 1 }`.

### L0.5 — `validateAgainst(candidate, { path, profile })` — the safety-net face of the same spec

**File (new):** `AlembicCore/src/domain/knowledge/recipe-authoring-spec/validateAgainst.ts`

Wraps the existing enforcement so "rendered text == enforced rule" is structural: delegates to `UnifiedValidator` + (lifted) content-quality + evidence checks, all keyed off the same constants `buildFieldGuide`/`buildFailureModes` render. Used by L4 to give the inner path the same safety net.

**Implementation note (per-dimension example):** today `EXAMPLE_TEMPLATES` is keyed by language only (`MissionBriefingSupport.ts:106-213`). L0.2 keys by `(primaryLanguage, dimensionId)` with language-only fallback. Adding per-dimension example rows is in-scope data work for this module; if a dimension has no specific example, the language example is used and a `note` marks it generic.

### L0 Acceptance

- Unit: `renderGuidance({path:'host-agent', profile:'cold-start-strict', dimensionId, primaryLanguage:'objectivec', ...}).fieldGuide` has exactly 21 rows; every row has non-empty `meaning`, `genRule`, and (for non-system-injected fields) `example`; `failsWith` non-empty for `title/content.markdown/doClause/dontClause/coreCode/sourceRefs`.
- Unit: `workedExample` passes `validateAgainst(workedExample, {path, profile})` — the front-loaded example is itself gate-clean (catches drift between taught example and enforced rule).
- Unit: the verb arrays imported by `recipe-content-quality-gate.ts` are `===` the arrays rendered in `failureModes` (single-source assertion).

---

## L1 — OUTER chain: inject the rendered contract into the Mission Briefing

### L1.1 — Populate `submitKnowledgeContract` from the spec

**File:** `AlembicPlugin/lib/runtime/status/OnboardingContract.ts`
**Function:** `buildSubmitKnowledgeContract()` (called at `:369` inside `buildHostAgentContract`, `:346`)

Before: `submitKnowledgeContract` carries `fieldFloors` (`:497-510`, reject thresholds), `sourceRefCardinality` (`:511-517`), `purpose` (`:472-473`), `exactFields` (`:474-496`).

After: build it from the rendered object:

const rendered = renderGuidance({ path:'host-agent', profile, dimensionId, primaryLanguage, ports: outerPorts });
return {
  purpose: rendered.purpose,                 // unchanged string, now sourced from spec
  exactFields: EXACT_FIELDS,                 // now imported from spec
  fieldGuide: rendered.fieldGuide,           // NEW — Part A per-field {meaning|gen-rule|example}
  workedExample: rendered.workedExample,     // NEW — Part C, a submit_knowledge example (today absent: firstCallExample is dimension_complete-only, :598-606)
  failureModes: rendered.failureModes,       // NEW — Part D
  profile: rendered.profile,                 // NEW — Part B
  // fieldFloors retained as the validateAgainst projection, no longer the only per-field surface
};

`buildHostAgentContract` needs `dimensionId`/`primaryLanguage`/`profile` threaded in; they are already in scope at the cold-start assembly (`cold-start.ts:285` `buildColdStartMissionBriefing` has the plan selection + project meta). Pass them down through `buildColdStartOnboardingContract` (`OnboardingContract.ts:81`).

### L1.2 — Mirror per-dimension in `submissionSpec`

**File:** `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts`
**Function:** `enrichDimensionTask()` → `submissionSpec` assembly (`:311-331`)

Before (`:315-319`): `contentStyle: PROJECT_SNAPSHOT_STYLE_GUIDE.split('\n')...slice(0,12)` — a 12-line truncation, plus `cursorFields=getCursorDeliverySpec()` (`:327`) and `preSubmitChecklist=PRE_SUBMIT_CHECKLIST` (`:330`).

After: replace the sliced style block with the rendered per-field contract for *this* dimension:

const rendered = renderGuidance({ path:'host-agent', profile, dimensionId: task.dimensionId, primaryLanguage, ports });
submissionSpec.fieldGuide   = rendered.fieldGuide;     // replaces sliced contentStyle
submissionSpec.workedExample = rendered.workedExample; // dimension-keyed example
submissionSpec.failureModes  = rendered.failureModes;
// keep preSubmitChecklist/cursorFields as the spec's failure-mode/field inputs, not separate constants

This makes the per-dimension `currentDimensionGuidance[].submissionSpec` carry the same comprehensive block as the global contract, so whichever surface the agent reads first is complete.

### L1.3 — Add a submit-call first example

**File:** `AlembicPlugin/lib/runtime/status/OnboardingContract.ts`
**Function:** `buildSubmitKnowledgeContract()`

Before: `firstCallExample` exists only on `dimensionCompletionContract` (`:598-606`).
After: set `submitKnowledgeContract.firstCallExample = rendered.workedExample` so the agent sees a complete first `alembic_submit_knowledge` payload, not only a `dimension_complete` example.

### L1 Acceptance

- Read the assembled `alembic_bootstrap` envelope `data` (the object `presentHostAgentColdStartResponse` spreads at `ColdStartPresenters.ts:239`): `data.hostAgentContract.submitKnowledgeContract.fieldGuide` has 21 rows each with `meaning`+`genRule`+`example`; `.workedExample` is present and `validateAgainst`-clean; `.failureModes` lists the verb-allowlist and snippet-verbatim codes.
- Read `data.currentDimensionGuidance[0].submissionSpec.fieldGuide`: present and dimension-keyed (its `workedExample` matches the dimension, not a generic language example).
- Assert no field meaning/gen-rule/example is absent before authoring (the L1 invariant: the briefing CONTAINS the full per-field contract).

---

## L2 — INNER chain: replace the producer prompt's thin triple with `renderGuidance`

### L2.1 — Swap the thin field text for the rendered contract

**File:** `AlembicAgent/src/agent/prompts/insightProducer.ts`
**Function:** `buildProducerPromptV2()` (§8 assembly at `:272-274`; mirror in `buildProducerPrompt()` at `:174-176`)

Before (`:272-274`): the prompt appends three thin constants — `STYLE_GUIDE` (= `buildProducerStyleGuide()`, which skips content/reasoning/title fields via `StyleGuide.ts:45-59`), the hand-written `PRODUCER_SUBMIT_FIELD_CONTRACT` (`:135-142`), and `SUBMIT_REQUIREMENTS`.

After: replace all three with one rendered block:

const rendered = renderGuidance({
  path: 'in-process',
  profile: rescanContext ? 'opportunistic-light' : 'cold-start-strict',
  dimensionId: ctx.dimensionId,
  primaryLanguage: ctx.projectInfo.primaryLanguage,
  ports: innerPorts,  // sourceRefResolver bound to projectRoot/analysisScope (KnowledgeRescanWorkflow.ts:276-283)
});
sections.push(renderFieldGuideAsPrompt(rendered.fieldGuide));   // Part A — closes the 6 inner-only gaps (headers/coreCode/dontClause/whyStandard/sourceRefs/usageGuide per G3)
sections.push(renderProfileAsPrompt(rendered.profile));         // Part B — agent now told strict vs light
sections.push(renderFailureModesAsPrompt(rendered.failureModes)); // Part D — verb allowlist + ✅/❌ ≥4 + snippet-verbatim, now BEFORE authoring

`renderFieldGuideAsPrompt` is a thin spec-side markdown formatter (lives in the spec module so both chains format identically; the inner chain renders to prose, the outer to JSON, from the same `RenderedAuthoringContract`).

### L2.2 — Inject the worked example (the single biggest inner gap)

**File:** `AlembicAgent/src/agent/prompts/insightProducer.ts`
**Function:** `buildProducerPromptV2()`

Before: no example is ever injected (confirmed G2/G3 — `EXAMPLE_TEMPLATES` reaches only the outer `MissionBriefingBuilder.ts:1135-1138`).
After: append `rendered.workedExample` as one fully-populated candidate selected by `(primaryLanguage, dimensionId)`:

sections.push(renderWorkedExampleAsPrompt(rendered.workedExample)); // Part C

This is the in-process chain's largest front-loading hole; closing it is the highest-leverage single edit on the inner side.

### L2 Acceptance

- Snapshot the assembled producer user prompt string from `buildProducerPromptV2()` for a fixed `(dimensionId, primaryLanguage)`: it contains a per-field section for all 21 fields (assert the 6 previously-missing fields `headers/coreCode/dontClause/reasoning.whyStandard/sourceRefs/usageGuide` each now carry a gen-rule), the active-profile line, the verb allowlist, and exactly one fully-populated worked example.
- Assert the prompt no longer references `PRODUCER_SUBMIT_FIELD_CONTRACT` (`:135-142` becomes dead → delete it) — the hand-written list is fully replaced by the spec.
- Diff vs baseline: the inner producer prompt and the outer `submissionSpec.fieldGuide` render from the same `RenderedAuthoringContract` (same field count, same gen-rule text per field).

---

## L3 — Protect the front-load block from the budget compactor (OUTER only)

The front-load material is exactly what today's trimmer drops first; without this step L1 is silently undone on real (large) projects.

### L3.1 — Keep-list the rendered block in the contract compactor

**File:** `AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts`
**Function:** `compactHostAgentContract()` (`:836-850`)

Before: keeps only `exactFields`, 4 of 11 `fieldFloors` (category/contentMarkdown/doClause/dontClause), `purpose`, one `sourceRefCardinality` line; drops `requiredBeforeSubmit`, `failureCodes`, the rest.
After: add `fieldGuide`, `workedExample`, `failureModes`, `profile` to the keep-list. If the 18 KB inline cap (`COLD_START_BRIEFING_INLINE_BUDGET_BYTES`, `:88`) is exceeded, spill the block as the **ref-pointed full briefing** the agent is explicitly instructed to fetch first — never the silent drop. The keep/spill decision must treat `fieldGuide`+`workedExample` as load-bearing, ranking them above already-inline analysis prose.

### L3.2 — Same for the per-dimension spec compactor

**File:** `AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts`
**Function:** `compactDimensionSubmissionSpec()` (`:563-587`)

Before: reduces the checklist to `required` + appended `'P5: EN do/dont + ✅/❌.'`, losing `FAIL_EXAMPLES` and the worked example.
After: retain `fieldGuide`+`workedExample` (or ref-spill), drop lower-value prose first. Update `trimColdStartBriefingToBudget` (`:610`) and `summarizeSubmissionSchema` (`:976`) so the example is the **last** thing demoted to a `note`, not the first (today it is the first: `:610-734`, `MissionBriefingSupport.ts:355-357`).

### L3 Acceptance

- Construct a synthetic large project that exceeds the 18 KB cap; assert the post-compaction `data.hostAgentContract.submitKnowledgeContract.fieldGuide` is either still inline in full OR present as a ref the briefing text explicitly tells the agent to read before authoring — and that `workedExample` is never silently absent.
- Regression: on a small project (under budget) the block is inline verbatim; byte-budget test confirms the trimmer demotes analysis prose before the field guide.

---

## L4 — Align the INNER safety net with what was front-loaded

Without this, L2 teaches the inner agent rules it is never checked against (the mirror of today's outer gap, per G4).

### L4.1 — Run the same gates on the inner submit path

**File:** `AlembicAgent/src/tools/runtime/handlers/knowledge.ts`
**Function:** `handleSubmit()` (`:92`), before `gateway.create` (`:175`)

Before: only the thin `validateSubmitParams` (`:101`, body `:283-334`, floors 9 fields) runs; the content-quality and evidence gates never execute on the inner path (`:175` → `gateway.create` → `UnifiedValidator` only).
After: call `validateAgainst(item, { path:'in-process', profile })` (L0.5) before `gateway.create`. `validateAgainst` runs the lifted content-quality + item-level evidence checks plus `UnifiedValidator`, keyed off the same constants the prompt rendered. Surface rejections through the existing `fail(details)` path (`:215-225`).

Alternative landing (if the inner handler should stay thin): put the `validateAgainst` call inside `RecipeProductionGateway.create` (`AlembicCore/src/service/knowledge/RecipeProductionGateway.ts:369`, alongside `validator.validate`) gated by a `path`/`profile` option so both chains converge on one enforcement site. Prefer this if the outer gate is also migrated to `validateAgainst` later (keeps one safety net).

### L4.2 — Demote the rejection loop to anomaly handler

**File:** `AlembicAgent/src/agent/prompts/insightProducer.ts`
**Function:** `producerRejectionGateEvaluator` (`:503-535`, retries when `rejected > success && rejected >= 2` at `:531`)

Before: the retry-on-rejection loop is the *normal* recovery path — the structural learn-by-rejection mechanism.
After: leave the budget (`maxIterations:24, maxSubmits:10`, `:120-127`) intact as a safety net, but with the front-load landed, a rejection is now an anomaly. Add an instrumentation counter (`rejectionRoundsPerDimension`) emitted as a diagnostic event so the measurable-drop acceptance (below) can be observed; do not change the threshold logic itself (that is the safety net staying a safety net).

### L4 Acceptance

- Submit the L0 `workedExample` (which is gate-clean by L0 acceptance) through the inner `handleSubmit`: it passes `validateAgainst` with zero rejections — proving the inner agent is now checked against exactly the rules it was shown.
- Submit a candidate that violates a previously-inner-unchecked rule (e.g. a doClause verb outside the allowlist, or coreCode not substring-matching its sourceRef): the inner path now rejects it with the same code the rendered `failureModes` listed — proving taught == checked on the inner side.

---

## L5 — End-to-end transparency + the measurable outcome

### L5.1 — Whole-chain assertion (both paths, one spec)

A single integration test renders both surfaces from a fixed `(dimensionId='architecture', primaryLanguage='objectivec', profile='cold-start-strict')` and asserts:
- the outer `data.hostAgentContract.submitKnowledgeContract.fieldGuide` and the inner `buildProducerPromptV2()` field section enumerate the **same 21 fields with the same gen-rule text** (structural unification — they came from one `renderGuidance`);
- both contain one `validateAgainst`-clean `workedExample`;
- both list the same `failureModes` codes;
- both state the same active `profile`.

This is the transparency deliverable: one assertion proves both chains present the comprehensive per-field contract before authoring, from one source.

### L5.2 — The measurable rejection-round drop

- Instrument both chains: outer counts `alembic_submit_knowledge` rejections per dimension before first accept (at `tool-router.ts:151` gate boundary); inner emits `rejectionRoundsPerDimension` from L4.2.
- Baseline-then-compare on the real BiliDili cold-start + rescan run (the existing acceptance corpus): record mean rejection rounds/dimension pre-landing, then post-landing. Acceptance target: a measurable drop in mean rejection rounds per dimension on both chains, with the first-submit accept rate strictly increasing — operationalizing the KEY PRINCIPLE (front-load is the instruction path; the gate is the safety net). No primary recipe-quality metric (QualityScorer completeness, coverage) regresses; if any does, preserve evidence and mark pending decision per the stop-card.

---

## Landing order, ownership, and the single-source invariant

1. **L0** (AlembicCore — new `recipe-authoring-spec/` module + `@alembic/core/knowledge` export). Producer of the object everything else consumes.
2. **L1 + L3** (AlembicPlugin — `OnboardingContract.ts`, `MissionBriefingBuilder.ts`, `cold-start.ts`). Consumer (outer) + its compaction protection; land together so injection is never silently stripped.
3. **L2** (AlembicAgent — `insightProducer.ts`). Consumer (inner) prompt.
4. **L4** (AlembicAgent `knowledge.ts` + optionally AlembicCore `RecipeProductionGateway.ts`). Inner safety net alignment.
5. **L5** (cross-repo integration test). Transparency + measurable outcome.

**The invariant this plan enforces:** after landing, the verb allowlists (`recipe-content-quality-gate.ts:28-89`), evidence floors (`recipe-evidence-gate.ts:191-320,496-591`), `V3_FIELD_SPEC` rules (`FieldSpec.ts:33-226`), `PRE_SUBMIT_CHECKLIST` (`DimensionSop.ts:1702-1739`), and `EXAMPLE_TEMPLATES` (`MissionBriefingSupport.ts:106-213`) are read in exactly one place (`renderGuidance` for the instruction face, `validateAgainst` for the safety-net face). The text the gate enforces and the text both agents read first are, by construction, the same — so "taught" and "checked" can no longer drift, and the gate returns to being the safety net its own `purpose` (`OnboardingContract.ts:472-473`) already claims it is.

**Cross-repo boundary note:** L0 ships and is accepted in AlembicCore first (the `@alembic/core/knowledge` export is the contract surface); L1–L4 consume it via the published Core build. The verb-allowlist and `EXACT_FIELDS` constant moves (plugin→Core) are deletions of duplicated truth — each requires the import-scan-clean + replacement-connected + build-green sweep before the plugin-side copy is removed, per the cross-repository deletion rule.

---

## 13.C — §13/§13.L critique 修正（实现前生效，BLOCKER 优先）

> 两轮对抗 critique（completeness + does-it-truly-front-load）对 §13/§13.L 真实代码复核：链路 trace 与"两链时机已对、缺陷在契约形状/完整度"成立。但下列修正必须并入；实现以本节为准。

### 13.C.1 [BLOCKER] 出厂范例本身过不了门——front-load 非法范例=主动教失败

实测 4 个 `EXAMPLE_TEMPLATES`（`MissionBriefingSupport.ts:106-213`）**全部被真门拒**:`objectivec` 只 2 sources(:129,<3 触 INSUFFICIENT_EVIDENCE)、裸文件名无行号(触 SOURCE_REF_LINE_MISSING)、`doClause="Prefix all class names…"`("Prefix" 不在 `POSITIVE_IMPERATIVE_VERBS` :28-74 → DO_CLAUSE_NON_IMPERATIVE)、coreCode 无匹配 sourceRef 行号(SNIPPET_MISMATCH);typescript/python 各 2 sources、_default 1。**front-load 一个会被 gate 拒的范例 = 教 agent 抄了就被拒 = 正好种下 learn-by-rejection。** **修(落在 L0,卡 L0 验收)**:worked example 必须是**新写的、gate-clean** candidate(≥3 真 `path:line` sources、doClause 用白名单动词如 "Use the BD prefix…"、coreCode 是某 cited 区间逐字子串、✅/❌ 行各 ≥4 字符);`validateAgainst(workedExample)` 通过设为**硬 build gate**。这是 in-scope authoring 数据工作,非脚注。

### 13.C.2 [HIGH] 两层 budget 渲染——契约不能被压缩器丢成 4 字段

`compactHostAgentContract`(`cold-start.ts:836-850`)>18KB(`COLD_START_BRIEFING_INLINE_BUDGET_BYTES:88`)时只留 4/11 fieldFloors + 把富契约甩到 ref。把 21 行表+范例+失败目录全内联会自爆 18KB。**修=两层渲染**:(a) **恒内联 compact 核**=21 字段各一行 `field → 一句生成规则` + 一行指针"完整契约+范例+失败模式在 `meta.fullBriefingRef`,authoring 前先读"(压进 cap);(b) 完整块甩 ref。**内联层必须带全 21 字段生成规则**(非现 4 个),因为这是去除 learn-by-rejection 的最小集;范例+全目录可 ref-spill 但内联须指令 agent 先取。L3 keep-list 据此断言"内联层独自含全 21 生成规则"。

### 13.C.3 [HIGH] 内链用紧凑 prose 非 JSON dump

内链 producer 是 budget-bounded prose 阶段(`PRODUCER_BUDGET maxIterations:24/maxSubmits:10` insightProducer.ts:120),且模型是 DeepSeek/Qwen。塞 21 行表+全目录 JSON 会挤掉真正实质(analysis findings)。**修**:`renderGuidance` 暴露 `renderFieldGuideAsPrompt(profile)` 出**紧凑 prose**(每字段一行 `field: <生成规则> — 例:<短示例值>`),失败目录缩到**真正会拒的 ~6 条 micro-rule**(verb 白名单/✅❌≥4/snippet 逐字/≥3 files/行号/graphRefs)非全 27 码逐字;**排序=micro-rules+范例在前**(截断损失最小);加内链 prompt 体积验收上界。

### 13.C.4 [HIGH] per-field join 不全——sourceRefs / reasoning.confidence 不在 V3_FIELD_SPEC

`sourceRefs` 与 `reasoning.confidence` 只在 `exactFields`/`PRE_SUBMIT_CHECKLIST`,**不在 V3_FIELD_SPEC**(只有 reasoning/whyStandard/sources)→ L0.2 `buildFieldGuide` 的 join-on-field-name 对这俩返回 undefined meaning,L0 验收"每行 meaning 非空"必失败。**修**:`buildFieldGuide` 对 V3_FIELD_SPEC 缺失字段回落第二 meaning 源(sourceRefCardinality / spec-local meaning 串);明确 join 对 EXACT_FIELDS 非全覆盖,补这 2 字段显式 fallback。

### 13.C.5 [HIGH] 跨仓 gate 逻辑移动须与 §C.1 调和——只移纯谓词

L0.3/L4 把 verb 白名单+EXACT_FIELDS 移 Core,且 validateAgainst 委派 content-quality+**evidence** gate 体——但 evidence gate 体含 fs 读(:709)+session(:3 getOrCreateSessionManager workflows 层),**§C.1 已定:不能整体进 domain**。**修(与 §C.1 统一)**:只**纯谓词/常量**进 Core spec(verb 集/marker 阈值/snippet 归一/evidence floor/source-ref 正则/placeholder/relationship 词);fs/session 半留 Plugin 经注入 `sourceRefResolver`/`sessionScope` port;Core `validateAgainst` = 纯规则 + 注入 resolver;内链供自己的 resolver。跨仓移动 = Core 先 ship(`@alembic/core/knowledge`)→ Plugin gate re-import → import-scan-clean+双仓 build 绿后才删本地副本(`cross-repo-deletion-named-export-sweep` 教训)。

### 13.C.6 [MED] L4 内链加门=收紧,须 sequence-lock 在 L2 之后 + 度量

内链今只跑 UnifiedValidator(无 verb/marker/evidence)。L4 加 `validateAgainst(stage:all)` **新拒**今天能过的内链候选=行为变更。**修**:**L4 排在 L2(front-load 落地)之后**(否则新规则无新指令→内链产出反降);L4 验收="提交 gate-clean workedExample 内链→零拒"跑**真 producer run** 非仅单测;**非目标**:不放松任何 **OUTER** 门阈值(OUTER validateAgainst 与今 `validateSubmitKnowledgeContentQuality`+evidence 门**字节级同严**,跑现有 gate 测套不变验证)。

### 13.C.7 [MED] micro-rule 字面量须抽成常量供渲染器读

`✅/❌ ≥4 字符`阈值(`recipe-content-quality-gate.ts:212`)+ placeholder 黑名单(`recipe-evidence-gate.ts:~694-703`)是 gate 函数内的内联字面量,不在 enum 上 → 渲染器(读 code enum)取不到。**修**:把 ≥4 阈值 + placeholder token 列抽成命名 spec 常量,gate re-import,渲染器才能把它们渲成生成规则而非仅码名。

### 13.C.8 [MED] 内链 handleSubmit 6 个 auto-fill 默认掩盖教学

`knowledge.ts` 默认 coreCode←pattern/''(:158)、usageGuide←buildDefaultUsageGuide(:161)、whyStandard←rationale(:139)、confidence←0.75(:144)、category←'Utility'(:129)、knowledgeType←'code-pattern'(:128)。front-load 教这些字段规则,但 auto-fill 一兜底→omit usageGuide 的 agent 仍拿合成值、**永远学不到它是必填**。**修**:与 front-load 调和——移除这些默认让 agent 所写值 load-bearing(否则教学被默默推翻);或显式声明哪些保留默认且不在 front-load 教学集。

### 13.C.9 [MED] profile 命名 + 第三写路径

`opportunistic-light` profile **无生成链**消费它(内链 authoring 只有 cold-start `mode:'full'` + rescan `mode:'incremental'`;`InProcessFileChangeHandler.ts:186/268/394` 是 evolution 的 `gateway.submit` 非 authoring)。**修**:profile 重命名 **`rescan-light`**(或真 trace 一条 opportunistic authoring 链);profile 选择**按 workflow `mode`** 非 context 真值。**且明确 `gateway.submit`(第三写路径)是否经 validateAgainst**——若绕过,"taught==checked"不变量对 evolution 路径不成立。

### 13.C.10 [LOW] 已订正 file:line / 数目
- 复用既有 `getInternalAgentRequiredFields()`(`FieldSpec.ts:316`,内链必填=REQUIRED∧非nested∧非systemInjected≈11)与 `getExternalAgentRequiredFields()`(:311)作两路 supplier 真相,勿另造。
- `RecipeEvidenceViolationCode`=**19 码**(非 24;:5-24 是行号范围),content-quality=8,union=**27**(非 32)。
- `dimensionId` 是 **EXPECTED+systemInjected** 非 REQUIRED;systemInjected 4 字段≠REQUIRED 集。
- `RecipeProductionGateway.create` 在 `:340`,`validator.validate` 在 `:369`(插入点)。

---

## 13.D — 权威 gate-clean 富范例（替换非法 EXAMPLE_TEMPLATES，§13.C.1 BLOCKER 落地）

> 用户要求把完整范例做更完整/优化、markdown 更详尽丰富、更强指导意义。下列 2 个旗舰范例由真实 Alembic TS 源码起草，**内容级全门通过**（逐条过 content-quality + evidence + 字段门，逐字 coreCode + ≥3 带行号 distinct files + 白名单 doClause + ✅/❌ + 富项目特写 markdown），作为 `RecipeAuthoringSpec.examples/` 的 typescript 种子与 front-loaded 契约范例。验证方式：各自单独提交，**唯一剩余错误是 `SESSION_NOT_FOUND`**（session `bs-76977140` 已过期）；其余 content/quality/evidence 门全 PASS。未跑破坏性 bootstrap 去 mint 新 session（会归档现有 recipe），故未绑定 recipe id——内容已证 gate-clean，绑定只需一个有效 session。

### 范例 1 — `pattern` / design-patterns：ServiceContainer 惰性单例注册

富 markdown（项目特写：规则 + 架构位置 + ✅/❌ 平行代码对比 + 为什么 + 何时不用 + 来源）：

```markdown
## 惰性单例是什么
ServiceContainer 是进程级 DI 容器。`singleton(name, factory)` 把一个服务注册成惰性单例：工厂函数只在第一次 `get(name)` 时执行一次，结果缓存进 `this.singletons[name]`，之后每次 `get` 返回同一个实例。
## 它在架构里的位置
- 注册集中在 `lib/injection/modules/*Module.ts`，批量写 `c.singleton(...)`。
- 容器把构建时机推迟到首次 get，避免启动期就实例化整张依赖图。
- `aiDependent: true` 的服务会登记进热重载清单，AI Provider 切换时自动清缓存。
## ✅正确：声明式惰性注册
```ts
c.singleton('gateway', () => new Gateway());
c.singleton('qualityScorer', () => new QualityScorer());
```
## ❌禁止：构造期急切实例化 + 手写守卫
```ts
this.gateway = new Gateway(); // 启动即构建，无法惰性
if (!this.singletons.x) { this.singletons.x = build(); } // 重复样板
```
## 为什么
惰性化让进程只构建真正用到的依赖，缩短冷启动并隔离副作用；单一注册入口让单例语义（构建一次、可重置）可控可测试。
## 何时不用
纯无状态工具函数或每次都要全新实例的对象不要进单例；直接 new 或用普通 `register` 工厂即可。

(来源: Alembic/lib/injection/ServiceContainer.ts:54-60)
```

关键字段（gate-critical）：
- `title`: ServiceContainer 惰性单例注册（15 字）；`kind`: pattern；`category`: Service；`dimensionId`: design-patterns；`trigger`: @lazy-singleton-di
- `doClause`: "use singleton(name, factory) so the factory builds the instance once on first get and caches it under the service name"（首词 `use` 在白名单）
- `dontClause`: "do not eagerly construct services in the constructor or hand-write per-service if-not-cached guards"
- `coreCode`（逐字 ServiceContainer.ts:54-60）:
```ts
    this.register(name, () => {
      if (!this.singletons[name]) {
        this.singletons[name] = factory(this);
      }
      return this.singletons[name];
    });
  }
```
- `sourceRefs`: ["Alembic/lib/injection/ServiceContainer.ts:43-60", "Alembic/lib/injection/modules/InfraModule.ts:60-75", "Alembic/lib/injection/modules/AppModule.ts:24-26"]（3 distinct files，带行号）
- `graphRefs`/`sourceGraphRefs`（关系类声明必需，由 `alembic_graph file-symbols` 取真节点）: ["symbol:alembic/lib/injection/servicecontainer.ts-singleton", "symbol:...-register", "file:..."]
- `reasoning`: { whyStandard, sources:["...ServiceContainer.ts:43-60","...InfraModule.ts:46-75"], confidence: 0.95 }
- `usageGuide`: ### When to Use / ### Key Points / ### When Not to Use（三段齐）

### 范例 2 — `rule` / architecture：ESM 相对导入必须带 .js 后缀

富 markdown：

```markdown
## 规则
本仓库是纯 ESM 包（`"type": "module"`）且用 `module`/`moduleResolution: "NodeNext"` 编译。NodeNext 下每个相对 import 的路径都必须带显式 `.js` 后缀，即使源文件是 `.ts`。后缀指向编译后的运行时产物。
## 它在架构里的位置
- 约束所有 `lib/**`、`bin/**` 之间的内部相对 import。
- 跨包导入走 `@alembic/core/*` 子路径或 `#shared/*` 等 imports 别名，不写后缀；本规则只管相对路径。
## ✅正确：带 .js 后缀
```ts
import Gateway from '../../governance/gateway/Gateway.js';
import type { ServiceContainer } from '../ServiceContainer.js';
```
## ❌禁止：省略后缀或写 .ts
```ts
import Gateway from '../../governance/gateway/Gateway';    // 运行时解析失败
import Gateway from '../../governance/gateway/Gateway.ts';  // NodeNext 拒绝 .ts 后缀
```
## 原理
Node ESM 加载器不做扩展名猜测：裸路径既不补 `.js` 也不补 `/index.js`，缺后缀会在运行时抛 ERR_MODULE_NOT_FOUND。源码写 `.js` 而非 `.ts`，是因为最终执行的是 `dist/` 里的 `.js`。
## 何时不用
bare package 名（`@alembic/core/events`）和 `#`-前缀 imports 别名由 exports/imports 映射解析，不需要也不能加 `.js`；本规则只约束相对路径。

(来源: Alembic/lib/injection/modules/InfraModule.ts:24-29)
```

关键字段：
- `title`: ESM 相对导入必须带 .js 后缀（14 字）；`kind`: rule；`category`: Utility；`dimensionId`: architecture；`trigger`: @esm-js-import-suffix
- `doClause`: "write every relative import specifier with an explicit .js suffix even though the source file is a .ts file"（首词 `write` 在白名单）
- `dontClause`: "do not omit the file extension on relative ESM imports or write a .ts suffix in the specifier"
- `coreCode`（逐字 InfraModule.ts:24-28，5 行 import）:
```ts
import { JobDisplaySnapshotStore } from '../../daemon/JobDisplaySnapshotStore.js';
import { JobProcessEventRecorder } from '../../daemon/JobProcessEventRecorder.js';
import Gateway from '../../governance/gateway/Gateway.js';
import AuditLogger from '../../infrastructure/audit/AuditLogger.js';
import AuditStore from '../../infrastructure/audit/AuditStore.js';
```
- `sourceRefs`: ["Alembic/lib/injection/modules/InfraModule.ts:24-33", "Alembic/tsconfig.json:5-6", "Alembic/lib/injection/ServiceContainer.ts:7-17"]（3 distinct files）
- `reasoning`: { whyStandard, sources:["Alembic/tsconfig.json:5-6","Alembic/package.json:5-5","...InfraModule.ts:24-33"], confidence: 0.97 }（无 graphRefs——规则类、刻意不带关系措辞以避 GRAPH_REF_INVALID）

### gate-clean 证据清单（逐规则）

- doClause 首词在白名单:pattern `use` / rule `write` PASS（**实拦发现:`register` 被拒**——见下）。
- ✅/❌ 各行后 ≥4 字符:`声明式惰性注册`/`带 .js 后缀`（✅）、`构造期急切实例化…`/`省略后缀或写 .ts`（❌）PASS。
- markdown ≥200（实 ~600-700 含 ## 标题 + ```ts 代码块 + 列表 + ✅/❌ + 来源）PASS。
- coreCode 逐字匹配 cited 行号区间(ServiceContainer.ts:54-60 / InfraModule.ts:24-28，awk 确认逐字)PASS。
- ≥3 distinct **FILES** 各带行号 PASS;reasoning.whyStandard+sources 非空 + confidence≥0.85 PASS;usageGuide 三段齐 PASS;title/description CJK≤20/≤80 PASS。
- **结论:各范例单独提交仅剩 `SESSION_NOT_FOUND`,其余全 PASS = 内容级 gate-clean。**

### 实拦发现（写进 §13.C / 失败模式目录 + spec gate-rules，有强指导意义）

1. **doClause 动词白名单实测 ≠ 我此前文档的措辞细节**:`register` **被运行时拒**（不在 `POSITIVE_IMPERATIVE_VERBS`），`use`/`write` 通过。⇒ §13.C.7 的 micro-rule 抽常量 + front-loaded 失败模式必须列**真实白名单原文**（避免 agent 凭直觉用 register/prefix 等被拒）。这正印证"front-load 真规则、别靠打回"。
2. **关系/依赖类声明触发 `GRAPH_REF_INVALID`**:DI pattern 因含"构建/缓存/依赖"语义被判定关系声明，必须附 graphRefs；子代理跑 `alembic_graph file-symbols` 取真节点 id 补 `graphRefs`+`sourceGraphRefs` 后清除。⇒ front-loaded 契约须教:关系类 Recipe 要么先 `alembic_graph` 取 graphRefs，要么措辞保持 content-fact 不触发关系检测（范例 2 即如此规避）。
3. **session 过期是真实运行态**:`bs-76977140` 已 `SESSION_NOT_FOUND`（停掉冷启动后过期）；mint 新 session 需 `alembic_bootstrap`（破坏性,归档现有 recipe）。⇒ "验证范例 gate-clean"应在 spec 的 **build 期单测**(validateAgainst on examples，§13.C.1 硬 gate)做,不依赖 live session。
