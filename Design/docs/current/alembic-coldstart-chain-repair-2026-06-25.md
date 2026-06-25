# Alembic 冷启动链路修复与优化 — 需求设计(strict)

Date: 2026-06-25
Status: requirement-design (ready-for-controller-intake)
Source Window: Design
Design Key: alembic-coldstart-chain-repair-2026-06-25
Scope: AlembicPlugin(主) + AlembicCore(P3) + Test(e2e)

## 最终目标(完成定义)

宿主 Agent(Claude Code)驱动的冷启动 **plan → bootstrap → 逐维分析 → submit → dimension_complete → Recipe 持久化** 全链路真实闭环:
1. bootstrap 的任务结构**单一且由 plan 维度驱动**(无并存的旧泛化 domain 体系);
2. 链路上每个工具输出**都在 MCP inline 上限内**(超出走瞬态文件 ref,对齐 alembic_plan 两部分);
3. 提交被拒时宿主**能拿到可操作拒因**(违规码 + itemIndex + nextAction),可自纠;
4. 规模/计数信号(targets fileCount、recipeCount)**真实准确**;
5. 产出 Recipe 经证据门禁(真实源引用 + 逐字片段 + 关系图证据 + 跨维去重),**真实/准确/有价值**。

本设计为**开发者决策级**:每项修复带 file:line 落点、改法、分阶段验收。

---

## 真实链路图(勘探确认)

```
alembic_plan draft✅ → confirm✅ → alembic_bootstrap
   └─ cold-start.ts:runHostAgentColdStartWorkflow
        ├─(A) Core MissionBriefing  [PLAN 驱动,正确]
        │     MissionBriefingBuilder.ts → buildExecutionInstructions(MissionBriefingSupport.ts:393)
        │     ← selectProjectContextDimensions(project-context-analysis.ts:201) ← planSelection.dimensions
        │     产出 dimensions[13] + executionPlan[5 tier] + targets[15]
        └─(B) OnboardingContract     [硬编码 7-domain,断接]
              OnboardingContract.ts: DOMAIN_PLAYBOOKS(:102-284) → buildDomainQueue(:527)/buildCurrentDomainSop(:553)/buildSopPack(:657)
              产出 domainQueue[7] + sopPack + currentDomainSop  (dimensionRefs:[] 与 plan 无连接)
   两层被 cold-start.ts:280 attachColdStartOnboardingSurface 合并 → 宿主收到冲突双任务结构
→ 宿主分析✅ → alembic_submit_knowledge
   └─ recipe-evidence-gate.ts(严谨,正确)逐条校验 → 失败 buildSubmitKnowledgeEvidenceGateResponse(tool-router.ts:648)
      详情挂进 data 但被 clean-output 剥光 → 宿主只剩一句泛化 summary
```

---

## 确认问题集(根因 file:line)

| # | 严重 | 问题 | 根因 |
| --- | --- | --- | --- |
| P1 | 高 | bootstrap 给**两套并存冲突**任务结构:plan 的 13 维(对) + 硬编码 7-domain(D1-runtime-entrypoints…,CLI/runtime 口径,套 Swift app 错) | 7-domain 来自静态常量 `AlembicPlugin/lib/runtime/status/OnboardingContract.ts:102-284 DOMAIN_PLAYBOOKS`;`buildDomainQueue/buildCurrentDomainSop/buildSopPack` 只吃常量;唯一与 plan 接触点 `dimensionMatchesPlaybook(:548)` 是 naive 关键词子串匹配→Swift 项目全不命中→`dimensionRefs:[]`;`currentDomain=domainQueue[0]` 恒为 D1。该层由 `cold-start.ts:280 attachColdStartOnboardingSurface`(→`:443 attachOnboardingContract`)注入,与 Core 的 plan 驱动 briefing(`MissionBriefingBuilder.ts`/`MissionBriefingSupport.ts:393`)平行无交集 |
| P2 | 高 | bootstrap 182KB、recipe_map 54KB **超 MCP inline**(存盘) | **无字节预算**。bootstrap 走 core projector(allow-list `output.ts:105-133`,25 字段),大字段 `dimensions/sopPack/currentDomainSop/executionPlan/targets` 全 `z.unknown().optional()` 无界透传(`output.ts:432-435`)。recipe_map **自有契约**(`AlembicRecipeMapOutput.ts:233-240` 直返 CallToolResult,绕过 core projector),仅有元素数上限(arrays≤200/nodes≤500),无字节预算/无 fullRef。对照 alembic_plan 预算在**生产端**`plan-tool.ts:276-278,453,458-489`(prune+瞬态 fullTreeRef) |
| P3 | 中 | bootstrap `targets[].fileCount` 恒 = 1(AOXNetworkKit 实 30) | `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:1345` `fileCount: target.refs.length \|\| undefined`;`target.refs` 是 `ProjectContextRef[]` 定向锚点(每 target ~1 个),非文件枚举(`ProjectContextMap.ts:115 TargetSummary.refs`)。真实文件数在未走到的回退分支 `input.modules[].ownedFiles.length`(:1354) |
| P4 | 高 | 证据门禁拒因被剥光,宿主无法自纠(违设计本意) | 详情确由 `tool-router.ts:688 ...buildEvidenceGateFailureData` 挂进 data,但被**两段叠加剥除**:① submit_knowledge allow-list(`output.ts:299-322`,24 字段)**无 `evidenceGate`/`problem`**→嵌套的 `violations`/per-item `nextAction` 随父字段消失;② `errorCode` 是禁顶层键(`output.ts:54-60`)只折进 `error.code`;`rejectedItems` 虽在 allow-list、活在 `structuredContent`,但**可见文本通道只显示 `summary`**(`output-contract.ts:183 content:[{type:'text',text:summary}]`)→只读文本的客户端只见泛化句 |
| P5 | 中 | status `recipeCount:0` vs 实有 131 条 DB recipe(recipe_map rollup 131,mounts 截 50) | 语义错配,非硬 bug。`AlembicPlugin/lib/runtime/KnowledgeState.ts:199-203 recipeCount` 数的是**磁盘 .md 文件**(`recipesDir`,本项目 0);131 条 recipe 在 DB `knowledge_entries`(全 `lifecycle='staging'` 未落盘)。`recipeCount` 标签误导(实为"已导出磁盘 recipe 数") |
| P6 | 中(暂缓) | handoff mismatch(selected=AlembicWorkspace≠host=BiliDili);聚焦子包时 `project.projectId` 漂成 `project:aoxfoundationkit` | pure-local 读/门禁 fs 校验用传入 projectRoot 不受阻;仅影响 Dashboard handoff 与身份显示。不挡宿主闭环 |

> 撤回项 **P5a**(原报"region.nodes 全 null"):是 Design 侧 jq 用错字段名(查 `id/name/filePath`,recipe_map 实为 `nodeId/label/path`),live 节点满载。非产品 bug。

> 复用项 **门禁本身正确**:`recipe-evidence-gate.ts` 强制源文件存在+行号在范+片段逐字匹配(SNIPPET_MISMATCH)+关系声明须 graphRefs(GRAPH_REF_INVALID)+rule≥3文件+≥200字项目特写+跨维硬去重。**保留不动**——这是 Recipe 质量地板。修复只解决"拒因不可见(P4)",不放松门禁。

---

## 分阶段修复设计(代码级落地 + 验收)

### P0 — 证据门禁拒因可操作化【AlembicPlugin,最小最高价值,先做】

**目标**:提交被拒时,宿主在**文本通道**就能看到逐条 `code + itemIndex + nextAction`,可自纠;结构化详情也回传。不改门禁严格度。

**改法**:
1. `lib/runtime/mcp/core-tools/output.ts:299-322`(submit_knowledge allow-list):加入 `'evidenceGate'`、`'problem'` 两个字段名,使结构化 violations 活进 `structuredContent`。
2. `lib/runtime/mcp/handlers/tool-router.ts:684-686`(`buildSubmitKnowledgeEvidenceGateResponse` 的 message):把泛化句替换为**从 `evidenceGate.violations` 拼出的可操作摘要**,例如:
   `Recipe evidence gate failed (${violationCount}): ` + `violations.map(v => `#${v.itemIndex ?? '-'} ${v.code} → ${v.nextAction}`).join(' | ')`。
   因 `summary` 是唯一进文本通道的字段(`output-contract.ts:183`),拒因必须进 `summary` 串本身。
3. `errorCode` 维持折进 `error.code`(禁顶层键,合理,不动)。

**验收**:
- 故意提交一条润色片段 → 返回 summary 含 `SNIPPET_MISMATCH #0 → Cite the exact source range…`;`structuredContent.evidenceGate.violations` 非空、`rejectedItems` 非空。
- 单测:gate 失败响应的 summary 串包含首条 violation 的 code 与 nextAction;allow-list 单测含 `evidenceGate`。
- 真机:宿主仅凭工具返回即可定位并修正,无需读源码。

### P1 — 退场断接的 7-domain SOP 层,SOP 由 plan 维度驱动【AlembicPlugin】

**决策(需 confirm)**:7-domain OnboardingContract 与 plan 的 `dimensions[]`+`executionPlan` **职责重复且冲突**;`dimensions[]` 已自带 per-dimension `analysisGuide`+`submissionSpec`(真实 SOP),`executionPlan` 已按 tier 排序。**退场 7-domain 任务分解层**,保留其中**与 domain 无关的通用契约**(gates/recipeGuidanceFloor/submitKnowledgeContract/recipeCreationSop)。

**改法**:
1. `lib/recipe-generation/host-agent-workflows/cold-start.ts:280 attachColdStartOnboardingSurface` / `:443 attachOnboardingContract`:停止注入 `domainQueue`、`sopPack`(7-domain 重发)、`currentDomainSop`(D1 口径)。
2. 新增 `currentDimensionGuidance`(替 `currentDomainSop`):从 `executionPlan` 当前 tier 的 plan 维度 + 该维度 `dimensions[].analysisGuide/submissionSpec` 派生(数据已在 briefing 中,零新扫描)。
3. `lib/runtime/status/OnboardingContract.ts`:`DOMAIN_PLAYBOOKS(:102-284)` 及 `buildDomainQueue(:527)/buildCurrentDomainSop(:553)/buildSopPack(:657)` 退役;把其中**通用、非 7-domain** 的契约块(gates、`buildRecipeGuidanceFloor`、`buildSubmitKnowledgeContract`、`recipeCreationSop`)抽到一个 domain-无关的 `buildHostAgentContract()`,继续注入。
4. `dimensionMatchesPlaybook(:548)` 一并移除。

**验收**:
- BiliDili bootstrap 不再出现 D1-D7;`domainQueue` 要么消失、要么等于 `executionPlan` 的 tier;无 "runtime-entrypoints/tool-contracts" 口径。
- "当前该做什么" 来自真实 plan 维度(architecture/…),`currentDimensionGuidance` 指向当前 tier 维度的 analysisGuide。
- 通用质量契约(gates/floor/submitContract)仍在,门禁行为不变。
- briefing 去掉 sopPack(~32KB)+currentDomainSop(~12KB)≈ 减 44KB。

### P2 — bootstrap + recipe_map 输出预算化(两部分,对齐 alembic_plan)【AlembicPlugin】

**目标**:链路上每个工具 inline ≤ ~20KB,超出走瞬态文件 `meta.*Ref`。

**改法**:
1. **bootstrap**(P1 后主体剩 `dimensions[]` ~58KB):在生产端 `cold-start.ts` briefing 组装处加预算步骤,**对齐** `plan-tool.ts:276-278/453/458-489` 模型:inline 只放 (a) 维度 id/label/tier 列表 +(b)**当前 tier** 维度的完整 analysisGuide/submissionSpec;完整 13 维 SOP 目录写瞬态文件,置 `meta.fullBriefingRef{path,bytes}`,宿主按需读。非截断时全 inline、ref=null。
2. **recipe_map**(绕过 core projector):在 `lib/service/project-knowledge-context/recipe-map/RecipeMapProvider.ts` 收口字节——`recipeMounts` 的 `sourceRefs/matchedRefs`(≤80×400≈32KB 主因)按字节预算裁剪,总输出超阈值时落瞬态文件 + `meta.fullMapRef`;`AlembicRecipeMapOutput.ts` schema 增 `meta.fullMapRef` 可选字段。
3. 复用 alembic_plan 已有的瞬态写工具(`writeProjectInfoFullTree` 同款)抽成通用 `writeTransientTransport(name, payload)`,三处共用。

**验收**:
- BiliDili bootstrap 直接 inline 返回(不存盘),截断时带 `meta.fullBriefingRef` 指向可读完整 SOP;recipe_map 同样 inline + 截断带 `meta.fullMapRef`。
- 两工具结果 < MCP inline 上限;完整细节可从瞬态文件还原;两部分单测(对照 plan 两部分测试)。

### P3 — targets 真实文件计数【AlembicCore】

**改法**:
1. `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:1341-1347 buildProjectContextTargets`:不用 `target.refs.length`;按 `target.name` 关联 `input.modules[].ownedFiles.length`(或复用 `ColdStartPresenters.ts:301` 的 `targetFileMap` 思路)得真实文件数;无匹配再退回 `refs.length`。
2. 连带 `buildArchitectureOverview(:1196)`/`buildKeyAbstractions(:1206)` 的 fileCount 汇总自动转正。

**验收**:bootstrap `targets[]` 显真实数(AOXNetworkKit=30、AOXFoundationKit=22…),非 1;架构层 fileCount 总数正确;Core 单测覆盖 target→fileCount 映射。

### P5 — recipeCount 语义对齐【AlembicPlugin】

**改法**:
1. `lib/runtime/KnowledgeState.ts:199-203`:`recipeCount` 改为报 **DB 持久化 recipe 数**(查 `knowledge_entries`,与 `databaseEntryCount`/recipe_map rollup 一致=131);磁盘 .md 数另置 `materializedRecipeCount` 保留并改名,暴露 "staging 未落盘" 事实。
2. 若决定保持 recipeCount=磁盘语义,则在 status 显式区分 `dbRecipeCount` vs `materializedRecipeCount`,消除"0 vs 131"的误读。

**验收**:status.recipeCount 与 recipe_map 的 DB recipe 现实一致;磁盘导出数单列且命名自解释;单测覆盖两计数来源。

### P6 — handoff/projectId 漂移【暂缓,单独需求】

不挡宿主闭环,记为 follow-up:对齐 Alembic selected/active project 与 host project,或修聚焦子包时的 `project.projectId` 投影。本需求不纳入,intake 时确认是否单开。

---

## 顺序、跨仓、验收门

- **顺序**:P0(解阻断、可自纠)→ P1(去冲突、瘦身)→ P2(预算化,依赖 P1 已减体积)→ P3(计数)→ P5(语义)→ Test e2e。P6 暂缓。
- **跨仓**:AlembicPlugin = P0/P1/P2/P5;AlembicCore = P3(+ P1 以 Core 的 `buildExecutionInstructions` 为参照模型,但退场动作在 Plugin 侧)。
- **Test e2e(最终验收)**:BiliDili 真机跑宿主冷启动闭环——plan→bootstrap(单一 plan 驱动任务、inline)→宿主对 3 维(architecture/coding-standards/design-patterns)逐字源码 + graphRefs 提交过门禁→dimension_complete→DB 落 Recipe;抽查 1-2 条 Recipe 满足"真实/准确/有价值"(源引用可点开、片段与源一致、规则对开发有指导)。

## Non-Goals / 禁止

- 不放松证据门禁(P4 只让拒因可见,不降标准)。
- 不把 7-domain 改名续命(P1 是退场冲突层,不是换皮)。
- 不在本需求引入新 AI provider / 独立 agent runtime(宿主即 AI)。
- 不动 alembic_plan 已交付的两部分契约(P2 复用其模型)。

## 风险

- P1 退场需精准区分"7-domain 任务分解"(退)与"通用质量契约 gates/floor/submitContract"(留);误删通用契约会破坏门禁引导。先 grep 通用契约的真实消费方再切。
- P2 bootstrap 瘦身后宿主"按需读瞬态文件"的体验:当前 tier inline 必须自足,确保宿主不读 ref 也能完成当前 tier。
- P3 在 Core,改 `buildProjectContextTargets` 须保持 DTO 兼容(fileCount 字段语义不变,只修值来源)。
- P5 改 recipeCount 来源可能影响读取该字段的 onboarding/Dashboard 判断,需扫消费方。

## 证据与链接

- 真实链路与体积:本会话 BiliDili testMode bootstrap(182KB)、recipe_map(54KB)、submit 两次被拒。
- 门禁源码:`AlembicPlugin/lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts`。
- 对照模型:alembic_plan 两部分 `lib/recipe-generation/plan-tool.ts` + 设计 [alembic-plan-stateless-precondition-contract-2026-06-24](alembic-plan-stateless-precondition-contract-2026-06-24.md)。
