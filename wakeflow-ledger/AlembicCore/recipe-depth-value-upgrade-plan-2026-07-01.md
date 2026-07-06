# Recipe 深度价值提升 — 最终落地方案（供审批）

## 1. 核心结论

当前 recipe 薄，**不是 agent 偷懒，是激励结构如实诱导的结果**：契约（`SUBMIT_REQUIREMENTS`/`PROJECT_SNAPSHOT_STYLE_GUIDE`）只索取一句 rationale + 一对 ✅/❌、门禁（`gateRules`）只验形状底线、评分器（`#scoreContentDepth`）只奖励长度/标记/来源计数——三层全指向"过 floor"。agent 过 floor = grade B = `autoApprovable` 即止，`contentDepth` 恒 ~0.60。

**真正目标是 recipe 的真实深度价值**（设计意图 / 边界条件 / 失败模式 / 设计权衡 / 多来源真实代码佐证），使新贡献者或 AI 能判断"能否在自己场景安全套用、越界会怎样"。**质量评分器是对齐检查不是目标**：若分数从 0.60 涨到 0.85 但 recipe 没更有价值，就是失败。

## 2. 统一架构：一处 Core 升级如何同时到达两宿主

**两宿主已在契约表层真单源**（import-trace + 本轮复核确认）：
- in-process(DeepSeek)：`AlembicAgent/src/agent/prompts/insightProducer.ts:144` `STYLE_GUIDE = renderGuidance('in-process',,'cold-start').text`（模块加载常量，改 Core 下次进程加载自动生效）
- host(cc/codex)：`AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts:432` `renderGuidance('host-cold-start')`
- 门禁两宿主同调 Core `validateAgainst`；评分两宿主同经 `KnowledgeService.updateQuality` → 同一 `QualityScorer`。

**但存在两条已本轮实锤的宿主专属旁路，三方案原本都漏或误标——本方案必须收口：**

| 旁路 | 位置 | 问题 | 后果 |
|---|---|---|---|
| **submissionSpec.contentStyle** | `AlembicCore/src/domain/dimension/DimensionCatalogPayload.ts:198` | 对 `PROJECT_SNAPSHOT_STYLE_GUIDE` 做 `.slice(0,12)` 只取前 12 行 | 深度内容若排在第 12 行后，host 静默截断，in-process 看全 = **隐性分叉** |
| **submissionSpec.contentQuality** | `DimensionCatalogPayload.ts:203-206` | floor 逐字硬编码手写字符串，**不派生自** `gateRules`/`contentContract` | host 同时收到新深度契约(front-load) + 旧 floor-only 文本，信号冲突 |

（`submissionSpec` 经 `MissionBriefingBuilder.ts:314` 只喂 host briefing，`AlembicAgent/src` 零消费——已核验。）

**结论**：深度落点主要放 `guidanceGenerator.ts` 的 `renderGuidance.text`（而非塞进 `PROJECT_SNAPSHOT_STYLE_GUIDE` 常量以规避 slice(0,12) 截断），并**把 `DimensionCatalogPayload.ts:198,203-206` 两处旁路改为从 Core 同源派生**。这样两宿主真正 uniform。

## 3. 具体改动清单（真实 edit 清单，采纳跨方案最强元素 + 修掉 critique 问题）

综合取向：**以方案 B 的"生成期真实推力"为骨架**（闭合"score 不 gate 生成"断路）+ **方案 C 的 scorer 重写口径**（削长度权重，防 game）+ **方案 A 的最小 blast-radius 纪律**（FieldSpec 扩字段拆为后置独立阶段）。

### Core — 契约与指引（agent 看到什么）

**C1. `AlembicCore/src/domain/knowledge/recipe-authoring-spec/contentContract.ts`**
- `:15-32` `PROJECT_SNAPSHOT_STYLE_GUIDE`：**保守扩**"四大核心"，新增第 5 项"深度四问"（设计意图为何此结构而非替代 / 边界与前置条件 / 失败模式违反会怎样 / 权衡放弃了什么），每问强制"挂 (来源: File:行号)，不接地不算"。**深度四问必须放在前 12 行内**（因 `DimensionCatalogPayload.ts:198` slice(0,12)），否则 host 截断。
- `:61-68` `DOC_SCORE_TARGETS`：保留但不再作为 AI 面唯一深度表述（避免继续明文教刷长度）；新增 `depthCoverage` 目标描述（覆盖维度数而非字符数）。
- 新增 `VALUE_RUBRIC` 常量并纳入 `contentContract()` 返回，供 `guidanceGenerator` 渲染。
- *为什么*：契约层是 agent 看到的第一层深度索取，现只索取一句 rationale。

**C2. `.../guidanceGenerator.ts:80-99`（最高杠杆单点）**
- 在 `## 提交校验规则（与门禁完全一致）` 段之后，新增 `## 深度契约（超越门禁的价值要求）` 段：渲染 `VALUE_RUBRIC` + `buildDepthScaffold()`（写前先逐维填推理骨架再落笔）+ `buildDepthSelfReviewChecklist()`（draft 后自评：每维是否真捕获/挂在哪个 file:line/是否同处复述）。措辞明确"这是价值要求不是门槛，评分器只认接地深度不认长度"。
- `GuidanceBlock` 接口增 `depthContract`/`valueRubric` 字段随 block 返回，并**关联进 `workedExample` 同级**，使深度活过 host 压缩阶梯 `compactRecipeAuthoringFrontLoad`（`cold-start.ts:1064-1096` 截断时只保 workedExample/evidenceFloor/imperativeVerbs）。
- *为什么*：`renderGuidance.text` 是两宿主唯一共享指引文本载体，一处改双宿主同得，纯 additive 不改 `gateRules` 谓词（floor 字节不变）。

**C3. 新增 `.../recipe-authoring-spec/depthContract.ts`**（方案 B）
- `DEPTH_DIMENSIONS`（designIntent/boundaries/tradeoffs/failureModes/multiSourceCorroboration 五维，每维 what/why + "必须挂 ≥1 真实 file:line"）+ `buildDepthScaffold()` + `buildDepthSelfReviewChecklist()`。纯数据无 fs。

**C4. 新增 `.../recipe-authoring-spec/depthReview.ts`**（方案 B 核心裁判，采纳其最强元素）
- `reviewRecipeDepth(candidate, resolved:{validSourcePaths,validRanges}): { grounded, missing, ungroundedClaims }`。纯确定性。**判定 = "深度论述段落 + 该段内已解析成功的 file:line 共现"，绝不做关键词计数**（防塞词）；multiSource 维强制"同一论述跨 ≥2 distinct 文件"（**把 count 门升级为 synthesis**——A/C 原方案缺此，是 critique 点名的多来源可 game 漏洞的解药）。

**C5. `.../examples/index.ts:126-148`**（三方案共识，最高行为杠杆）
- 升级唯一被注入 guidance 的 `example('typescript')`：markdown 用 `## 设计意图 / ## 边界与前置条件 / ## 失败模式 / ## 权衡` 分节，每节挂真实 file:line，`reasoning.sources` ≥2 distinct 文件。`buildExample:68-100` 扩参支持深度分节。**必须过 `RecipeAuthoringSpecExamplesGatePassing.test.ts` tripwire**（`validateAgainst({stage:'all'})` 零 violation），证明高标准 gate-clean 而非放松 floor。
- *为什么*：实证 agent 强烈照抄注入范例；示范"如何就真实代码推理出权衡"，非填空模板。

### Core — 收口两条宿主旁路（本方案关键新增，三方案原本漏）

**C6. `AlembicCore/src/domain/dimension/DimensionCatalogPayload.ts:198,203-206`**
- `:198` `contentStyle`：去掉 `.slice(0,12)` 或确保深度段前置到前 12 行内（**首选去 slice**，除非有 token 预算硬约束）。
- `:203-206` `contentQuality`：改为从 `renderGuidance('host-cold-start').text` 或 `contentContract()` 派生，**消除手写 floor literal**，与 front-load 路径同源。
- *为什么*：这是 host 看到 recipe 深度指引的第二条真实通道，不改则 host 收到新旧冲突信号且深度被截断。

### Core — 评分对齐（防 game，采纳方案 C 重写口径 + 修接地断路）

**C7. `AlembicCore/src/service/knowledge/KnowledgeService.ts` — 修接地断路（critical 前置）**
- **已核验断路**：`_adaptForScorer:940-983` 无 `sourceRefResolver`/`projectRoot`，`updateQuality:734` 对已持久化 entry 打分，**拿不到 gate 的 `validSourcePaths`**。故"深度只在接地时计分"在 B/C 原文里当既成事实是错的。
- **修法**：在 `updateQuality`/`_adaptForScorer` 前注入 resolver + projectRoot 并**重跑一次 resolver 得 `groundedSourcePaths`**喂 scorer（方案 C 已在 tradeoff 承认，本方案挪进 change 正文并列为前置）；additive 扩 `_adaptForScorer:960-982` 透传 `content.steps/verification` + `constraints.boundaries/preconditions/sideEffects` + `reasoning.alternatives` + `groundedSourcePaths`。
- **接线未落地前，深度评分维度不得上线**（否则伪 file:line 可刷分）。

**C8. `AlembicCore/src/service/quality/QualityScorer.ts:151-188` — 重写 `#scoreContentDepth`**（方案 C 口径，修方案 B 盲点）
- `:156` 长度斜坡 `textScore(md,50,800,0.3)` **降为及格线** `textScore(md,50,400,0.12)`（400 字够容纳深度分节，长度不再是满分杠杆）。
- 新增 `depthCoverage` 子分（权重 ~0.4）：对 boundaries/preconditions/sideEffects/verification/alternatives，**每维仅在其论述匹配 `groundedSourcePaths` 中 file:line 时计分**，覆盖 ≥3 维给满。
- `rationale`/`whyStandard`/结构标记保留但降权。additive 保留旧 6 字段路径避免历史 recipe 分雪崩。
- *为什么*：从公式层消灭"800 字 + ## 刷满 contentDepth"（直击用户红线）；B 只做 additive 保留满长度斜坡是其对齐盲点，故采 C。

### 生成期真实推力（方案 B 骨架，A/C 缺此=白改风险的解药）

**C9. `AlembicAgent/src/agent/prompts/insightGate.ts`（in-process retry 回路）**
- `insightGateEvaluator` 在现有 note_finding/score 判定后调 Core `reviewRecipeDepth`；若 grounded 维度 < 阈值（如 <3/5）**且分析证据已充分**，返回 `action:'analysis_retry'` 把 missing 维度写进 reason；`buildRetryPrompt` 加深度缺口分支。
- **retry 缺口反馈只说"第 N 维缺接地证据"，绝不提示"补写某内容"**（防诱导编造）；**回炉到有代码工具的 Analyst 段重挖，不让被禁读码的 Producer 补写**。

**C10. `AlembicAgent/src/tools/runtime/handlers/memory.ts` + `insightAnalyst.ts`（结构化深度槽）**
- `note_finding:73-92` 接受可选 `designIntent/boundaries/tradeoffs/failureModes`（各含 file:line）；`ANALYST_SYSTEM_PROMPT:80-115` 追加"确认核心发现时同步记录其设计意图/边界/权衡/失败模式（各挂 file:line）"（指令文本从 Core `depthContract` 渲染以彻底单源）。
- *为什么*：深度实际在 Analyst 段产生（Producer 被禁补读源码），给 note_finding 结构化深度槽让 Analyst 结构化捕获。

**C11. `AlembicPlugin/lib/runtime/mcp/handlers/knowledge.ts:141-153`（host submit 反馈，与 in-process 对称）**
- `submitKnowledge` 在 `UnifiedValidator` 后对已解析 refs 调 Core `reviewRecipeDepth`，`recipeReadyHints` 加 `depthGaps` 字段。纯 guidance 非 gate（不拒绝提交、不倒 floor）。
- *为什么*：host 唯一 per-submit 反馈点，与 in-process retry 对称满足 uniform。

### 后置独立阶段（方案 A 纪律，拆出降风险）

**C12. `AlembicCore/src/domain/knowledge/FieldSpec.ts`（独立后置边界阶段，非首轮）**
- 加 designIntent/boundaries/tradeoffs/failureModes 到 `V3_FIELD_SPEC` 的 **EXPECTED（非 REQUIRED，只 warning 不 reject，守 floor 不倒退）**。
- *为什么*：FieldSpec 跨 Search/Guard/Quality/adapter 承重（`fields.ts:6-8`），非局部改动。首轮先用 markdown ## 分节 + `reviewRecipeDepth` 基于正文检查承载深度，验证机制有效后再决定是否给一等公民落点。

## 4. 如何诱发真实深度而非刷分 + 评分器对齐

**三重锁死诱发真深度**（缺一即退化为刷分）：
1. **契约问真问题**（C1/C2 VALUE_RUBRIC 深度四问）：agent 要答"为何此结构而非替代/越界会怎样"必须回代码真读边界、真找替代——这本身就是深度思考，不是格式。
2. **评分只认接地答案**（C7/C8 `depthCoverage` 绑 `groundedSourcePaths`）：编造"边界:并发>1000失效"但无对应 file:line = 0 分；凑 800 字空话 = 长度及格线封顶 0.12。**涨分唯一路径 = 真接地覆盖更多深度维度**，此时涨分即价值。
3. **生成推力持续挖**（C9-C11 retry/depthGaps）：把 satisfice 点从"过 floor"真实上移到"深度维度接地"——这是 A/C"只改指引不接生成链=白改"的解药。

**评分器对齐（是否需改：需要，但只作对齐检查）**：C8 重写让长度不再是满分杠杆，`depthCoverage` 只认接地，从公式层堵死"0.60→0.85 但没更有价值"。**验收标准明确改为"深度维度接地覆盖率 + 多来源 distinct file 数"，绝不看 overall 分**。独立价值锚：boundaries/guards 等有真实下游消费（`GuardCheckEngine.ts:730-738` 消费 `constraints.guards`），填深度真强化 Guard 能力——是不依赖评分器的价值真实性证明，设为核心验收锚。

## 5. 守法证明（防编造 / 门禁不放松 / 不碰 U1-U3）

- **防编造强化非削弱**：所有深度断言（契约/指引/范例/评分/retry 五层）强制携带真实 file:line；`reviewRecipeDepth`/`depthCoverage` 只认经 resolver 解析成功的 refs，复用现有 `looksLikePlaceholder`/`snippetMatchesSourceRange` 拒 placeholder；multiSource 要求跨 ≥2 distinct 文件 synthesis 而非 count；深度捕获限定在有代码工具的 Analyst 段，Producer 保持薄且禁补读源码。凑字数/编边界物理上拿不到分。
- **门禁 floor 不倒退**：深度全走 guidance（C2 追加在 floor 段后不改谓词）/ EXPECTED（C12 只 warning）/ additive scorer（C8 保旧路径）/ retry-hint（C9/C11 非硬拒）。`MARKDOWN_FLOOR=200`、`EVIDENCE_FLOOR{rule:3,fact:1}`、✅❌、source-ref 行号全部字节不变；`validateAgainst` 拒绝集 byte-stable（rev-60 不变量）。深度字段严禁进 REQUIRED。
- **不碰 U1-U3**：改动全在 knowledge/quality 域，与 `applyPlanSelection`/`PlanAgentRun` 正交，明确避开 plan 路径。

## 6. 分阶段实施 + 每阶段验证

| 阶段 | 内容 | 验证 |
|---|---|---|
| **P0** 前置断路修复 | C7 resolver 接线（scorer 能拿 `groundedSourcePaths`）+ C3/C4 新增 depthContract/depthReview 纯函数 | Core 单测：接地才 grounded/凑词不算/multiSource 要 ≥2 文件；此阶段门禁与生成零变化 |
| **P1** 契约+指引单源 | C1/C2 深度契约段 + 深度四问前置前 12 行 | `RecipeAuthoringSpec*.test.ts` + Drift + 双 profile(cold-start/opportunistic) 正确渲染；静态确认 in-process + host 都拿到新文本且活进压缩保命子集 |
| **P2** 深范例 | C5 typescript 深度范例 | `RecipeAuthoringSpecExamplesGatePassing.test.ts` tripwire 零 violation |
| **P3** 收口旁路 | C6 `DimensionCatalogPayload.ts:198,203-206` | 静态断言 host submissionSpec 内容与 `renderGuidance('in-process').text` 无冲突/无深度段缺失 |
| **P4** 生成推力 | C9-C11 in-process retry + host depthGaps + note_finding 深度槽 | mock-provider 单测：深度不足→带接地缺口 retry→补深后 pass；self-review **不作放行依据仅提示** |
| **P5** 评分对齐（最后且可回退） | C8 重写 `#scoreContentDepth` | QualityScorer 单测：薄样板不再靠长度冲高、接地深度才高分；**跑历史 recipe 分数快照 diff**，grade 突变则回退为"评分器仅记录不加权，推力全靠 gate 侧" |
| **P6** 双宿主真机 parity（U4 门） | cc/codex + in-process DeepSeek 各冷启动 | **非空-ProjectMap 项目**（避 BiliDili 空-map 掩盖 memory R-1 派生分歧）；抓 `hostAgentContract.recipeAuthoringFrontLoad` 落地 + **host submissionSpec 与 in-process prompt 深度契约 diff 对齐**（否则 parity 假绿）；看 grounded 覆盖率不看 overall；anti-fab 真拦编造边界；门禁字节 diff 空 |
| **P7** 后置（可选） | C12 FieldSpec EXPECTED 扩字段 | 独立边界扫描 + `UnifiedValidator` 缺字段只 warning + 边界测试 |

## 7. 留给操作者的真实决策点

1. **是否改评分器（C8）**：本方案建议改，但严格作对齐检查、排最后一相且可回退。若你担心历史 recipe grade 漂移（authority 推导 `overall×5` 重算 + decay/search 排序移动），可选择**只做 P0-P4 生成推力，评分器仅观察记录不加权**——深度真实推力不依赖 scorer。**这是本方案最大的可选/可回退开关。**

2. **是否加迭代回路（C9-C11）**：这是 A/C 缺失、B 独有的"闭合 score 不 gate 生成断路"的元素，**若不加，深度提升大概率不落地**（agent 过 floor 即止已实证）。但它带来最大 blast radius（跨 3 仓）+ 最大新编造面（retry 可能诱导补写空话，已在 C9 用"只报缺口不提示内容 + 回炉 Analyst"防护）。若你想先低风险试水，可只做 P1-P3（契约+范例+收口旁路），P5 观察 in-process 是否自发变深，再决定是否上回路。

3. **深度与生成成本权衡**：写前 scaffold + retry 增加 token/轮次，与 breadth 竞争（`PRODUCER_BUDGET.maxSubmits=10`）。本方案取向"宁少而深"。**是否相应放宽 per-recipe 迭代预算是你的决策**——本方案不预先改预算（避免过度设计），标为 P6 真机观察项，若显示提交数被挤压再调。

4. **C6 去 slice(0,12) vs 前置深度段**：去 slice 让 host 看全但增 token；前置到前 12 行省 token 但约束深度四问排序。建议去 slice，除非有明确 host token 预算硬约束。

## 残留不确定性（诚实标注）

- **`reviewRecipeDepth` 是启发式非语义**："论述段 + 同段已解析 ref 共现"会漏判（真深度但 ref 未挂进同段）或误判（接地但论述被判浅）。缓解：判定偏宽松鼓励，missing 只驱动 retry/hint 不硬拒，P6 真机校准阈值。
- **host 侧无 Analyst note_finding 结构化槽**：host 深度全靠 scaffold+self-review 文本契约 + submit depthGaps，两宿主深度回路不完全对称。**P6 必须专门验证 host 侧深度是否真提升**，不能假设文本契约对 host 足够。
- **C7 接线成本**：`updateQuality` 前重跑 resolver 有真实成本；若过高可考虑把 gate 阶段 `validSourcePaths` 缓存穿过持久化（替代方案，需另评估）。
- **P6 需非空-ProjectMap 项目**：BiliDili 空-map 会掩盖 memory R-1 双宿主 module-id 派生分歧，须额外准备非空-map 真测项目——这是尚未落实的验收前置。
## 8. 实施状态（2026-07-02，控制器执行）

**P0-P5 全部实现（4 仓本地 commit，未 push，develop-on-main，逐相位独立验证）：**

| 相位 | 内容 | 仓/commit | 验证 |
|---|---|---|---|
| P0 | C3 depthContract + C4 depthReview 纯函数；C7 resolveGroundedSourcePaths + KnowledgeService 接地 port | Core `b82e6d6` `e621298` | 接地才 grounded/凑词不算/multiSource≥2/port→scorer 断路闭合；门禁+生成零变化 |
| P1 | C1 契约(深度四问前置前 12 行 + VALUE_RUBRIC + depthCoverage) + C2 指引单源(深度契约段) | Core `9ec3050` | guidance==gate parity + Drift + 双 profile + D-A confidence 负向不变量；56 测试 |
| P2 | C5 typescript 深范例(五维接地 + 跨 2 文件) | Core `d2c14f5` | examples-gate-passing tripwire 零 violation + reviewRecipeDepth 五维全接地 |
| P3 | C6 收口 DimensionCatalogPayload 两旁路(去 slice(0,12) + floor 同源派生) | Core `51ad0b1` | contentStyle 不截断深度 + floor 从 getStage3FieldPolicy 派生；全量 1523 |
| P4 | C9 in-process 深度接地 retry + C10 note_finding 深度槽/analyst prompt + C11 host submit depthGaps；facade 暴露深度 API | Core `adc7490`；Plugin `657ce42`；Agent `1f8d6f0` | 防编造(ghost 未读→retry)+防回归(没尝试深度→放行)+retry 不诱导编造；Agent 330 + Plugin build:check |
| P5 | C8 scorer 重写 #scoreContentDepth（按 groundingAvailable 分流：未就位=legacy 零回归，就位=长度降级+depthCoverage 只认接地） | Core `cb6cc51` | 长样本 legacy 0.327→接地公式 0.170(防刷分)、真接地 0.573、伪 ref 0.133(防编造)；全量 1528 |

**关键安全设计**：C8 按宿主是否注入接地 port 分流——生产宿主接线落地前 groundedSourcePaths 恒空，legacy 公式保证**历史 recipe 评分字节不变、不雪崩**；深度加权公式随宿主接线 + P6 真机历史快照 diff 验证一并激活。全程门禁 floor 字节不变（深度走 guidance/additive scorer/retry-hint 非硬拒）。

**用户门 / 未做（诚实标注）：**
- **push + 刷 live 插件**：3 仓产品 commit 本地未 push；in-process AI 生效需刷新已安装插件。
- **P6 双宿主真机 parity（C8 深度公式激活门 + 机制有效性门）**：cc/codex + in-process DeepSeek 冷启动；需非空-ProjectMap 项目；抓 host submissionSpec vs in-process prompt 深度契约 diff 对齐；看 grounded 覆盖率不看 overall；跑历史 recipe 分快照 diff，grade 突变则回退 scorer 为仅记录不加权（本方案最大可回退开关）。**同时需接线宿主向 KnowledgeService 注入 groundedSourcePaths port**（当前无宿主注入，故 C8 深度公式在生产尚未激活，符合"接线未落地前深度评分不上线"）。
- **P7/C12 延后 pending P6**：depth 维度在 entry 模型无顶层字段（存 markdown 分节/constraints/reasoning），现在加顶层 EXPECTED 会对每条 recipe 虚假 warning + 模型错配；计划本身 gate 在"验证机制有效后再决定是否给一等公民落点"。

## 9. C8 激活接线（2026-07-02，用户"先完善项目"要求；旧 Recipe 将删）

用户澄清：**旧 Recipe 都会删除** → C8 legacy/grounded 分流的"避免历史雪崩"理由消失，分流现只作"宿主未注入 port 时优雅降级"安全网。用户已 push P0-P5，要求先完善再真机测。

**完成 C8 深度公式的宿主激活接线（本轮新增，未 push）：**
- Core `913f80a`：新增 `createFsSourceRefResolver`（可复用 fs-backed 源码引用解析器，路径归一→containment→存在→行范围，与门禁 resolver 逐分支对齐），经 `@alembic/core/knowledge` 导出。**两宿主共用同一 Core resolver 保证深度接地判定 parity**（P6 门的前置）。含 E2E 单测（真 fs：存在→接地 / 越界·穿越·不存在→剔除）。
- Core `201a58c`：`resolveGroundedSourcePaths` 逐 ref try/catch，单个不可读/竞态文件不令整条 recipe 接地集归零（真机健壮性）。
- AlembicPlugin `e04c60e` + Alembic 主体 `98cb62b`：`injection/modules/KnowledgeModule.ts` 向 KnowledgeService 注入 `groundedSourcePaths` port（`resolveGroundedSourcePaths` + `createFsSourceRefResolver` + `resolveProjectRoot`）→ `groundingAvailable=true` → **C8 深度加权评分已激活**。

至此深度价值升级的**代码链路端到端接通并激活**：契约(C1/C3)→指引(C2)→范例(C5)→生成推力(C9/C10/C11)→接地评分(C7/C8 已激活)全部落地，两宿主经同一 Core 单源(`DEPTH_DIMENSIONS`/`reviewRecipeDepth`/`createFsSourceRefResolver`)统一。Core 全量 1533 绿，两宿主 build:check+lint clean。

**剩余用户门**：push 本轮 4 commit + 刷 live 插件；P6 双宿主真机 parity（旧 recipe 删除→无需历史快照 diff）；P7/C12 延后 pending P6。
