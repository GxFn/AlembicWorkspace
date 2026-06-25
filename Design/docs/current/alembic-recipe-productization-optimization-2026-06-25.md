# Alembic Recipe 产物化·覆盖·质量优化 — 需求设计(strict)

Date: 2026-06-25
Status: requirement-design (ready-for-controller-intake)
Source Window: Design
Design Key: alembic-recipe-productization-optimization-2026-06-25
Scope: AlembicCore + AlembicPlugin（+ docs）；与冷启动链路修复(alembic-coldstart-chain-repair-2026-06-25)互补、不重叠

## 触发与证据

在 Codex 对 BiliDili 跑真实 plan→冷启动,生成 43 条 Recipe。深度分析(DB `~/.asd/workspaces/02a25032`)发现:**生成质量很高(系统自评全 grade A overall 0.86;refs 134 个 0 缺失、coreCode 逐字、3-7 文件交叉、深层项目洞见),但生成之后的"产物化"整段没发生**:

- **43 条全 `lifecycle=staging`、`lifecycleHistory=[]`、`autoApprovable=1`,无一晋级 active**;
- **skillCount:0、无 skills 表 —— 没合成任何维度 Skill**;
- `evolution_proposals`、`lifecycle_transition_events` 全空;
- 每维仅 3 条(networking 4)= 卡在 floor,没到 target 5;architecture 等维漏掉最核心规则(分层依赖方向);
- 提交带 `vector:embed-provider-missing`(本地千问未接通)。

→ 结论:**单条质量不是问题;问题在 ①产物化管线无人驱动 ②覆盖只到下限 ③语义层(千问向量)未启用 ④少量质量瑕疵**。本需求把这 43 条(及未来冷启动产出)从"高质量散条 staging 库存"变成"可被消费的生效知识"。

## 最终目标(完成定义)

宿主 Agent 冷启动产出的 Recipe 能**自动产物化为可消费知识**:
1. 高置信 grade-A staging recipe 在 daemon-less 架构下**自动晋级 active**(并记录 lifecycle 事件);
2. 每个完成的维度**合成 Skill**(SKILL.md 落盘),skillCount 反映真实合成数;
3. 覆盖从 floor(3)推向 target(5),且有**每维未覆盖重要 pattern 的完整性检测**,核心规则不漏;
4. 本地千问 embedding 接通(语义检索/去重/关系接地可用),死配置面处理;
5. 质量打磨:do/dont 统一英文祈使句、✅/❌ 一致。

开发者决策级:每项带 file:line 落点 + 分阶段验收。

## 确认问题集(grounded 根因)

| # | 严重 | 问题 | 根因(file:line) |
| --- | --- | --- | --- |
| **R1a** | 高 | staging→active **晋级执行器孤儿,recipe 永久卡 staging** | recipe 经 `AlembicCore/src/service/knowledge/KnowledgeService.ts:174-191` 直接置 `lifecycle=staging/autoApprovable=true/stagingDeadline=now+grace`;晋级器 `AlembicCore/src/service/evolution/StagingManager.ts:92-127`(`#promote`:175-193)、超时清扫 `LifecycleStateMachine.ts:174`、信号进化 `ProposalExecutor.ts:85` **全零调用方**;daemon 已删(PDR-3),无 interval/cron 接替;DI 单例注册于 `AlembicPlugin/lib/injection/modules/KnowledgeModule.ts:267-344` 但无人 tick。附:`#promote` 绕过 LifecycleStateMachine,即便调用也不写 `lifecycle_transition_events` |
| **R1b** | 高 | **未合成 Skill**(skillCount:0) | Skill 唯一触发是 `alembic_dimension_complete`:`AlembicPlugin/lib/recipe-generation/host-agent-workflows/dimension-completion.ts:247→868→920`→`ProjectSkillService.ts:504-508,774` 写盘 SKILL.md;`skillCount` 扫盘 SKILL.md(`KnowledgeState.ts:209-211,307-329`)。本次冷启动**未成功调用 dimension_complete** → 0 skill。合成不看 lifecycle(staging 可合),卡点是没调 dimension_complete |
| **R2** | 中高 | 覆盖卡 floor 3、**无 pattern 完整性检测** | 硬门禁 `recipe-evidence-gate.ts:399-406` 只查 `verifiedCandidateCount<3`;target 5 仅 briefing 散文(`MissionBriefingBuilder.ts:291,313-314`)不强制、不复催;唯一覆盖机制是 advisory 的 subpackage 告警(`dimension-completion.ts:1155-1192`,是"模块未触及"非"pattern 未覆盖") |
| **R3** | 中 | 本地千问 embedding 未接通 + 死配置 | embed opt-in 默认关,唯一 provider `OllamaEmbedProvider`(默认模型名已是 `qwen3-embedding`),enable 经 `ALEMBIC_LOCAL_EMBEDDING_ENABLED`/`vector.localEmbedding`(`AlembicPlugin/lib/recipe-generation/vector/LocalEmbedding.ts:26-39,64-81`;`VectorModule.ts:119-154`)。非 Ollama(DashScope/OpenAI 兼容)无 provider。`ALEMBIC_EMBED_*`(`AlembicCore/src/shared/WorkspaceSettingsStore.ts:13-26`)**确认死配置**(写 env 无 factory 消费)。**注:embed 关不阻晋级**——consolidation/相似度是纯 Jaccard(`SimilarityService.ts:6,44-54`),非向量 |
| **R4** | 低 | 质量瑕疵 | 9/43 do/dont 中文(规格要英文祈使句);content ✅/❌ 时有时无 |

> 复用项:**生成质量与证据门禁不动**(grade A、门禁严谨是质量地板)。本需求只补"生成之后"。

## 分阶段修复设计(代码级 + 验收)

### P1 — 产物化驱动:daemon-less 下自动晋级【AlembicCore + AlembicPlugin,最高杠杆】

**决策(需 intake confirm)**:daemon 已按 PDR-3 删除,**不重新引入 daemon**。推荐 **opportunistic tick-on-tool-access**:在常用工具入口(`alembic_submit_knowledge`/`alembic_dimension_complete`/`alembic_status`/`alembic_rescan`)顺带 sweep 到期 staging,调 `StagingManager.checkAndPromote()` 晋级。轻量、幂等、契合无 daemon。

**改法**:
1. 在 tool-router/handlers 的相关入口加一个**有界 sweep**:查询 `lifecycle=staging AND stagingDeadline<=now AND autoApprovable=1` 的 recipe,调 `StagingManager.checkAndPromote()`(`AlembicCore/.../StagingManager.ts:92-127`)。限量(如每次≤N)、限频(节流标记),不拖慢工具。
2. 让 `StagingManager.#promote()`(:175-193)经 `LifecycleStateMachine.transition()` 走正规迁移,写 `lifecycle_transition_events`(消除两套晋级机制不一致)。
3. (可选)同入口顺带触发到期 evolution(`ProposalExecutor`/到期 proposal 执行),如无 proposal 则跳过。

**验收**:冷启动产出后,下次任意工具调用即把过 deadline 的 grade-A staging recipe 晋级 active;`lifecycle_transition_events` 有记录;`alembic_status` 的 active recipe 数 >0(非全 staging);sweep 有界不阻塞(单次工具延迟可接受)。

### P2 — Skill 合成入主流程【AlembicPlugin】

**改法**:
1. host-agent 冷启动**完成定义**把 `alembic_dimension_complete` 列为**每维必走收尾**;`currentDimensionGuidance`/executionPlan 的 workflow 文案明确"submit 后必须 dimension_complete 才算完成该维"。
2. 校验冷启动"未完成维度"清单可见(已有 progress.remainingDimIds),宿主据此逐维收尾。
3. 确认 `dimension_complete` 的 skill 合成链(`dimension-completion.ts:247→868→920→ProjectSkillService.ts:504-508`)在 skillWorthy + 证据满足时确实写 SKILL.md。

**验收**:跑完一轮 14 维冷启动(每维 submit+dimension_complete)→ `skillCount` = 已完成维度数(每维 1 个 `Alembic/skills/<dim>/SKILL.md`);Skill 内容由该维 recipes 合成、非空、含结构。

### P3 — 覆盖深度 + 完整性 critic【AlembicPlugin + AlembicCore】

**决策(需 confirm)**:**完整性 critic(推荐)** 而非硬 target-5 gate(部分维真实 pattern <5,硬卡会逼凑数,违 noPadding)。

**改法**:
1. 维度收尾前(dimension_complete 或 briefing 的 currentDimensionGuidance)给出**"该维还有哪些高价值 pattern 未捕获"**:据 `projectInfoTree` + 该维 `miningGuidance` + 已提交 recipe 的 sourceRefs 覆盖,识别未被引用的核心文件/符号区,提示宿主补足到 target 5;允许"已尽,无更多核心 pattern"带 reason(尊重 noPadding)。
2. miningGuidance 内的关注点**按重要度排序**,引导先挖定义性规则(如 architecture 的分层依赖方向),避免被更窄 pattern 挤掉核心。
3. 不改 floor=3 硬门禁(保持质量地板),只把 target=5 从散文变成**可执行的覆盖提示**。

**验收**:典型维 recipe 数升到 ~5;architecture 等维包含其定义性核心规则;completeness 提示真实(基于 projectInfoTree,非臆造);"已尽"路径可带 reason 通过。

### P4 — 本地千问 embedding 接通 + 死配置处理【AlembicPlugin + AlembicCore + docs】

**决策(已 confirm 2026-06-25:用户千问经 Ollama 本地)→ 零代码路径,不新增 provider**:
- runtime 已支持 Ollama lane(`OllamaEmbedProvider`,默认模型名已是 `qwen3-embedding`)。P4 = **启用引导 + 默认值/文档**,不写新 provider 代码:
  - setup/文档明确 `ollama pull qwen3-embedding`(或用户实际 embedding 模型名)+ `ALEMBIC_LOCAL_EMBEDDING_ENABLED=1` 或 `.asd/config.json vector.localEmbedding.enabled=true`;
  - 评估把 `SetupService.ts:312-319` 默认 enabled 由 false 改为"探测到 Ollama 可用则默认开"(可选,降低踩坑),否则至少把启用引导写进 setup 输出(`LocalEmbedding.ts:127-138` 已有引导文案,确保暴露)。
- **删除死配置面 `ALEMBIC_EMBED_*`**(`WorkspaceSettingsStore.ts:13-26`,写-only 无消费方)——避免误导用户去配它;真正启用只走 `ALEMBIC_LOCAL_EMBEDDING_*`/`vector.localEmbedding`。
- ~~路径 B(DashScope/OpenAI 兼容 endpoint 新增 provider)~~ 不在本需求范围(用户用 Ollama)。

**验收**:Ollama 拉好 qwen 嵌入模型 + 启用后,submit 不再 `embed-provider-missing`、`getAvailability` 翻 `embed-provider-ready`;`semantic_memories` 有条目;`alembic_search` 语义检索可用;`ALEMBIC_EMBED_*` 死面已删(grep 无残留)。

### P5 — 质量打磨【AlembicPlugin】

**改法**:submit 校验/SOP 把 `doClause`/`dontClause` 约束为英文祈使句(动词开头);content「项目特写」格式强制含 ✅/❌ 对比(或在 submissionSpec preSubmitChecklist 升为 MUST)。

**验收**:新生成 recipe 的 do/dont 全英文、✅/❌ 一致;旧 9 条中文 do/dont 可经 rescan/evolution 逐步规整(非阻塞)。

## 顺序、跨仓、验收门

- **顺序**:P1(解锁晋级,最高)→ P2(skill 合成)→ P3(覆盖完整性)→ P4(千问向量)→ P5(打磨)。
- **跨仓**:AlembicCore = R1a 晋级/lifecycle/evolution 执行器 + R3 embed provider/死配置;AlembicPlugin = tick-on-access 接线 + host-agent 流程/briefing + 覆盖 critic + 配置/文档 + 质量校验。
- **Test e2e(最终验收)**:BiliDili 真机冷启动一轮 → 每维 submit + dimension_complete → 产出 recipe 自动晋级 active + 合成 14 维 Skill + 覆盖近 target + (启用后)语义检索可用。

## Non-Goals / 禁止

- 不重新引入 daemon(PDR-3 已删,用 tick-on-access 驱动)。
- 不放松证据门禁、不动生成质量地板(floor=3 硬门禁保留)。
- 不用硬 target-5 gate 逼凑数(用完整性 critic + noPadding)。
- 不臆造未覆盖 pattern(critic 必须基于真实 projectInfoTree/源)。

## 风险

- P1 tick-on-access 必须**幂等 + 有界 + 节流**,否则拖慢每次工具调用;晋级走 LifecycleStateMachine 要保持 staging→active 合法迁移语义。
- P2 dimension_complete 是宿主流程步骤,产品侧只能"要求 + 引导",不能代宿主执行;需 briefing 把它变成清晰必走步。
- P3 critic 误报会逼凑数(违 noPadding);必须真实 + 允许"已尽"reason。
- P4 路径 B 新 provider 需真实 endpoint 验证;DashScope/OpenAI 兼容的 embedding 维度/批量需对齐 VectorService。

## 证据与链接

- 覆盖/质量分析数据:BiliDili 43 条(grade A、refs 0 缺失、全 staging、skillCount:0)。
- 管线 grounding:StagingManager/LifecycleStateMachine/ProposalExecutor 零调用方;SimilarityService 纯 Jaccard(embed 非晋级依赖);ALEMBIC_EMBED_* 死配置。
- 互补需求:[alembic-coldstart-chain-repair-2026-06-25](alembic-coldstart-chain-repair-2026-06-25.md)(生成链路;本需求接其后:生成之后的产物化)。
