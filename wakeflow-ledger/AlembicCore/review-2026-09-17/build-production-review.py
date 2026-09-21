import json,re,hashlib
from pathlib import Path
from collections import defaultdict,Counter
ledger=Path('../wakeflow-ledger/AlembicCore/review-2026-09-17')
assigned=json.loads((ledger/'production-files.json').read_text())
inventory=json.loads((ledger/'inventory.json').read_text())
foundation=json.loads((ledger/'foundation-files.json').read_text())
extra=[x for x in foundation if x['kind']=='test' and any(t in x['file'] for t in ['Strict','Production','ColdStart'])]
extra_names={'test/PublicHostAgentWorkflowEntrypoints.test.ts','test/PlanSelectionProjection.test.ts','test/PlanLedgerProjection.test.ts'}
extra += [x for x in inventory if x['file'] in extra_names]
byfile={x['file']:x for x in inventory}
reverse=defaultdict(list)
for x in inventory:
 for imp in x.get('imports',[]):
  if imp.get('target'): reverse[imp['target']].append({'file':x['file'],'typeOnly':imp.get('typeOnly',False)})
duplicates=json.loads((ledger/'exact-duplicate-functions.json').read_text())
full={x['file'] for x in assigned if x['kind']=='source' and x['lines']<=25}
full.update('''src/service/bootstrap/GenerateDedup.ts
src/service/plan/facts/collectProjectContext.ts
src/service/plan/facts/transientTransport.ts
src/service/plan/intent/contracts.ts
src/service/plan/intent/planAuthoringSpec.ts
src/service/plan/intent/planIntent.ts
src/service/production/PrivateCorpusRevisionResolver.ts
src/service/production/ProductionActorIdentity.ts
src/types/ReactiveEvolution.ts
src/types/ast.d.ts
src/workflows/project-index/ColdStartIntent.ts
src/workflows/project-index/ColdStartPlan.ts
src/workflows/project-index/KnowledgeRescanIntent.ts
src/workflows/project-index/KnowledgeRescanWorkflowPlan.ts
src/workflows/project-index/ProjectIndexPlan.ts
src/workflows/shared/WorkflowEnvelope.ts
src/workflows/shared/WorkflowTypes.ts
src/workflows/surfaces/WorkflowCleanupPolicies.ts
src/workflows/surfaces/coverage/CoverageLedgerBuilder.ts
src/workflows/surfaces/coverage/CoverageLedgerWrite.ts
src/workflows/surfaces/coverage/shared/coveragePathMatching.ts
src/workflows/surfaces/host-agent/index.ts
src/workflows/surfaces/host-agent/session/GenerateSession.ts
src/workflows/surfaces/host-agent/session/HostAgentMissionWorkflow.ts
src/workflows/surfaces/host-agent/session/SessionSupport.ts
src/workflows/surfaces/persistence/DimensionCheckpoint.ts
src/workflows/surfaces/persistence/FileDiffPlanner.ts
src/workflows/surfaces/persistence/FileDiffSnapshotStore.ts
src/workflows/surfaces/persistence/WorkflowReportHistoryStore.ts
src/workflows/surfaces/persistence/WorkflowReportTypes.ts
src/workflows/surfaces/persistence/WorkflowResultPersistence.ts
src/workflows/surfaces/persistence/WorkflowSnapshotStore.ts
src/workflows/surfaces/planning/dimensions/GenerateTerminalToolset.ts
src/workflows/surfaces/planning/dimensions/TierScheduler.ts
src/workflows/surfaces/planning/dimensions/generateDimensionConfigs.ts
src/workflows/surfaces/planning/knowledge/KnowledgeRescanPlanBuilder.ts
src/workflows/surfaces/planning/knowledge/RecipeAuditEvidence.ts
src/workflows/surfaces/presentation/TargetFileMapBuilder.ts
test/FileDiffSnapshotStore.test.ts
test/KnowledgeRescanIntent.test.ts
test/GenerateTerminalToolset.test.ts
test/PlanAuthoringSpec.test.ts
test/unit/GenerateDedup.test.ts'''.splitlines())
partial={
'src/service/plan/intent/coldStartProductionPlan.ts': [[520,805],[1127,1474]],
'src/service/plan/status/recipeStatus.ts':[[290,435]],
'src/service/production/ProductionPersistenceContracts.ts':[[198,430],[525,610],[1800,2127]],
'src/service/production/StrictFactExecution.ts':[[623,805],[1008,1223],[2349,2465]],
'src/service/production/StrictFactExecutionReceipt.ts':[[1,170]],
'src/service/production/DurableSemanticDispositionReviewAuthority.ts':[[269,350],[552,680],[1004,1145],[1287,1345]],
'src/service/production/SemanticDispositionReviewExecution.ts':[],
'src/service/production/StrictAnalysisContracts.ts':[],
'src/service/production/StrictProductionAuthority.ts':[],
'src/workflows/surfaces/host-agent/session/HostAgentSubmissionTracker.ts':[[1,210],[420,601]],
'src/workflows/surfaces/host-agent/session/MiningSessionStore.ts':[[1,205],[195,280]],
'src/workflows/surfaces/host-agent/session/HostAgentDimensionCompletionWorkflow.ts':[[180,355],[475,575]],
'src/workflows/surfaces/persistence/WorkflowReportWriter.ts':[[1,175],[330,384]],
'src/workflows/surfaces/host-agent/briefing/analysis-packet/UnitProgress.ts':[[1,103]],
'test/GenerateSessionManager.test.ts':[[1,100],[240,320]],
'test/PublicHostAgentWorkflowEntrypoints.test.ts':[[150,194]],
}
# Empty ranges mean only AST/function/index inspection: do not call that manual semantic review.
for x in extra:
 if x['file'] not in partial: partial[x['file']]=[]
role_map={
'GenerateDedup':'会话内候选注册与四维相似度去重，保存前用于避开并行/跨维候选重复。',
'collectProjectContext':'以有限 ProjectContext request kinds 收集 plan 事实，解析 ProjectScope 并保留理解缺口。',
'projectInfoTree':'把模块/文件/符号事实投影为带省略计数和外置引用的计划树与维度密度。',
'projectSourceFacts':'读取工程源文件事实并将文件归属附加到 canonical module seeds。',
'transientTransport':'为双宿主计划/briefing 的大 JSON 输出创建稳定临时传输文件路径。',
'coldStartProductionPlan':'编译严格冷启动计划：冻结维度/解剖目录、完整适用分母、问题 DAG、预算与事实调度。',
'planIntent':'验证/归一化宿主确认计划并投影维度、扫描预算与模块范围。',
'planAuthoringSpec':'计划规模规则的双宿主提示文案单源；固定规则值是产品契约。',
'recipeStatus':'从生命周期/源码引用/计划目标导出代码区域映射、覆盖缺口和计划状态。',
'DurableSemanticDispositionReviewAuthority':'V3/V4/V5 跨进程 Ed25519 语义评审 attestation、预批准 trust policy 与 evidence-store 绑定。',
'PrivateCorpusRevisionResolver':'内部私有 corpus revision 路径解析；坐标严格单段化，创建/恢复职责分离。',
'ProductionActorIdentity':'把模型加载、调用、输入输出 hash 组成规范身份，供 Actor 跨边界对账。',
'ProductionPersistenceContracts':'私有 revision 原生句柄、隔离初始化/恢复、G1→Admission→G2→持久化→发布/路由对账契约。',
'SemanticDispositionReviewExecution':'把语义请求、冻结证据、reviewer load 与真实宿主调用绑定为不可移植的同进程执行 authority。',
'StrictAnalysisContracts':'Fact→population→cluster→induction→falsification→expression→fixpoint 的规范化、守恒与谱系验证。',
'StrictFactExecution':'对冻结源码完整分母执行真实 AST/ProjectContext/config backend，生成带 witness 的事实与失败回执。',
'StrictFactExecutionReceipt':'区分格式完整的失败回执与可授权 pass 的完整成功执行，校验分母/产物守恒。',
'ProjectIndexPlan':'共享 full/incremental 扫描与清理计划，解析多根 ProjectScope，禁止成员源码目录充当 full-reset 根。',
'ColdStartIntent':'生成两类宿主的全量冷启动意图，规范 source folders，保留旧 DTO/skip 标志兼容。',
'ColdStartPlan':'把 cold-start 意图转换为清理/扫描/物化计划，并报告请求维度过滤和去重事实。',
'ColdStartPresenters':'将冷启动阶段结果转换为宿主/内部执行者的预算受控输出与下一步提示。',
'KnowledgeRescanIntent':'生成两类宿主重扫意图并统一 maxFiles/contentMaxLines 数值边界。',
'KnowledgeRescanWorkflowPlan':'重扫意图转扫描/清理计划，保留调用者维度选择。',
'KnowledgeRescanPresenters':'将审计/重扫/维度执行事实投影为工作流输出。',
'WorkflowCleanupPolicies':'共享清理顺序；实际破坏性清理由外层注入，重扫前先取得 recipe snapshot。',
'CoverageLedgerBuilder':'从模块所属路径、候选、已覆盖路径建立 advisory module×dimension cell 状态。',
'CoverageLedgerAdvisor':'根据持久化 coverage/round 事实给出 advisory 深挖方向与收益递减信号。',
'CoverageLedgerWrite':'coverage cell 写入与轮次收益回流；失败必须可观测且不阻断维度完成。',
'coveragePathMatching':'coverage 和 completeness 共用路径标准化/包含/后缀兼容匹配。',
'EvidenceStarterBuilder':'根据项目分析结果为每个维度构造可操作的源码证据起点。',
'HostAgentAnalysisPacketBuilder':'把 ProjectContext 投影为稳定 unit IDs、预算、结构线索与降级说明的宿主分析包。',
'IDEAgentAnalysisPacketBuilder':'旧 IDEAgent 导入兼容 shim，实际实现单源于 HostAgentAnalysisPacketBuilder。',
'MissionBriefingBuilder':'整合维度 SOP、项目事实、计划、证据与恢复上下文为宿主 mission briefing。',
'MissionBriefingSupport':'briefing 类型与结构化输出/终态呈现辅助。',
'ProjectContextNormalize':'接受已组装 presenter 或 envelope 集合，统一为 presenter。',
'Scoring':'分析包结构证据排序/评分纯函数。',
'StableIdentity':'稳定分析包身份与 canonical hash 辅助。',
'UnitProgress':'生成分析单元的稳定 ID、初始进度和 checkpoint 链接；保留 IDEAgent alias。',
'ProjectSkillDeliveryContracts':'宿主中立 skill artifact/交付/验证回执契约；不拥有外层投递执行器。',
'CompletenessCritic':'按已落地证据和未覆盖候选生成 advisory 完整性提示，不创造生产门禁。',
'GenerateSession':'管理会话进度、提交 tracker、项目 lease 与 active-sessions 原子替换持久化。',
'HostAgentDimensionCompletionWorkflow':'验证维度完成输入/会话，关联 recipes，更新进度/证据/checkpoint 并返回质量反馈。',
'HostAgentMissionWorkflow':'外层 DI 到 GenerateSession 与 MissionBriefing 的宿主中立装配。',
'HostAgentSubmissionTracker':'记录候选提交/拒绝/负空间证据并计算质量反馈与跨维信息。',
'MiningSessionStore':'会话内发现、证据、维度摘要、候选、轮次反思与有限 TTL 文件/检索缓存。',
'SessionSupport':'按 dataRoot 缓存会话管理器，提供外层 container 注册和分析缓存恢复 seam。',
'DimensionCheckpoint':'维度完成 checkpoint 写/读/TTL/清理，供真实宿主恢复链使用。',
'FileDiffPlanner':'历史文件快照→diff→受影响维度→会话摘要恢复，评估错误回退全量。',
'FileDiffSnapshotStore':'SQLite workflow 快照与文件指纹/维度引用存储、历史容量限制、差异与影响推断。',
'WorkflowReportHistoryStore':'写单会话 report/artifact manifest 与最近100个摘要索引；兼容 WriteZone 和旧路径。',
'WorkflowReportWriter':'构建工作流事实报告与终端诊断投影，写入失败返回 null 并诊断。',
'WorkflowResultPersistence':'完成时按 snapshot→report→checkpoint cleanup 汇总持久化结果。',
'WorkflowSnapshotStore':'把工作流会话保存为文件差异快照；明确 saved/skipped/failed 结果。',
'GenerateTerminalToolset':'生产者中立 terminal-run 能力描述和阶段提示；旧 shell/pty 名称兼容翻译。',
'TierScheduler':'维度按依赖层串行、层内限流并行执行；记录异常/取消结果，允许动态维度 tier hints。',
'generateDimensionConfigs':'从 DimensionRegistry/SOP 生成维度配置并汇总层间反思，非模型执行器。',
'EvolutionPrescreen':'根据修改/源码/recipe 状态预筛演化工作，宿主决定后续执行。',
'KnowledgeRescanPlanBuilder':'结合覆盖缺口/退化/文件变更，区分 produce/verify-only/skip，并计算 module×dimension 预算。',
'KnowledgeRescanPlanner':'对既有 recipes 的引用/事实关联进行重扫相关性审计。',
'RecipeAuditEvidence':'将 AST 项目符号/依赖边提取为审计证据。',
'RescanEvidenceProjectors':'投影重扫审计的 recipe 快照、依赖和实体证据。',
'LanguageExtensionBuilder':'按语言生成 briefing 延伸指南与语言识别；长文本并非重复执行逻辑。',
'TargetFileMapBuilder':'将扫描文件按 target 组装、标注优先级与逐文件内容截断。',
}
findings={
'PROD-001':{'priority':'P1','file':'src/workflows/surfaces/host-agent/session/GenerateSession.ts','line':633,'title':'重复建会话检查使原活动 session 脱离持久化 map','evidence':'production-probes-output.json: results PROD-001','repro':'同 manager createSession 后再同项目 createSession 被 lease 拒绝；使用首次返回对象完成维度；重启读得 completed=0。','recommendation':'保留同 ID 活动 session 对象身份或做受控原地合并；确保 reload 不把已交付对象的 callback 接到另一对象快照。','tests':['test/GenerateSessionManager.test.ts']},
'PROD-002':{'priority':'P1','file':'src/workflows/surfaces/persistence/WorkflowResultPersistence.ts','line':90,'title':'快照持久化失败后仍删除 checkpoint','evidence':'production-probes-output.json: results PROD-002','repro':'已写 checkpoint，注入实际 saveSnapshot 调用失败；persistWorkflowResult 返回 snapshot.failed 但 checkpoint 已不存在。','recommendation':'仅在必要持久化成功后清理恢复点；错误返回应保留可重试状态。','tests':['test/PublicHostAgentWorkflowEntrypoints.test.ts']},
'PROD-003':{'priority':'P2','file':'src/workflows/surfaces/host-agent/session/GenerateSession.ts','line':316,'title':'公共 session 允许未知维度使未完成会话提前完成','evidence':'production-probes-output.json: results PROD-003','repro':'dimensions=[architecture]，markDimensionComplete(unknown,{})，isComplete=true 但 remaining=[architecture]。','recommendation':'在 mutation 前验证 dimension membership，完成条件以声明维度覆盖为准；保留已有合法维度回填语义。','tests':['test/GenerateSessionManager.test.ts']},
'PROD-004':{'priority':'P2','file':'src/workflows/surfaces/persistence/FileDiffSnapshotStore.ts','line':418,'title':'path-only 文件的 save/diff 指纹来源不一致','evidence':'manual-full: save 使用磁盘回退，computeDiff 使用空字符串回退；未重复运行 probe。','repro':'非空文件 snapshot.fileHashes=computeContentHash(磁盘内容)，currentFiles=[{path}] 未变化时 computeDiff 报 modified。','recommendation':'统一无 content 的磁盘读语义并使用 ?? 保留显式空内容；增加 path-only/空串回归。','tests':['test/FileDiffSnapshotStore.test.ts']},
'PROD-005':{'priority':'P2','file':'src/service/bootstrap/GenerateDedup.ts','line':54,'title':'中途四舍五入导致 best duplicate 选错','evidence':'实际源码 Node probe: higher=.6539999999999999，lower=.6519999999999999，findDuplicate 返回 lower。','repro':'query title word0..99/doClause clause0..29；existing higher title 前72词/lower 前71词；二者 doClause=clause0；三者相同非空 coreCode、guardPattern。','recommendation':'内部保留未舍入最高分，只在最终 DTO 返回时四舍五入。','tests':['test/unit/GenerateDedup.test.ts']},
'PROD-006':{'priority':'P2','file':'src/workflows/project-index/KnowledgeRescanIntent.ts','line':151,'title':'正小数预算取整后可变成 0','evidence':'manual-full；校验 numericValue>0 后直接 Math.floor，未运行额外 probe。','repro':'createHostAgentKnowledgeRescanIntent({maxFiles:0.5,contentMaxLines:"0.5"}) 产生两个 0，违反 positive integer 扫描边界。','recommendation':'明确 0<value<1 按无效回退或夹到1；与现有默认/上界测试一起验证。','tests':['test/KnowledgeRescanIntent.test.ts']},
'PROD-007':{'priority':'P3','file':'test/unit/GenerateDedup.test.ts','line':223,'title':'guardPattern 用例允许零断言通过','evidence':'manual-full；断言全在 if(withGuard) 分支内。','repro':'被测 API 对两次调用都返回 null 时该用例不运行任何断言。','recommendation':'保留行为用例并改无条件结果存在/权重增益断言，不以删除测试掩盖缺口。','tests':['test/unit/GenerateDedup.test.ts']},
}
notes={
'src/service/production/DurableSemanticDispositionReviewAuthority.ts':'V3/V4/V5 具有不同 signed payload/cardinality；不能按重复投影代码直接移除旧验证器，需下游 attestation 存储兼容证据。',
'src/service/production/SemanticDispositionReviewExecution.ts':'检查了函数清单与版本分层；尚未逐行读完3590行，不宣称完整安全审计。WeakMap live capability 与 durable signature 两层权限有不同用途。',
'src/service/production/StrictAnalysisContracts.ts':'检查了函数/导出和生产链：fact/population/cluster/induction/falsification/fixpoint 不可合为只验 hash 的薄适配；未逐行审计全部 validator。',
'src/service/production/StrictProductionAuthority.ts':'统一 authority 消费所有中间 receipt 并做 exactly-once/守恒校验；重复 callback 只说明文本相同，不证明守恒边界多余。未逐行审完全部规则。',
'src/service/production/ProductionPersistenceContracts.ts':'隔离根路径和 native handle 撤销、re-hydrate 无创建/迁移规则需保留；本轮人工抽查初始化和 publication-route 边界，其他 G1/G2/coverage 段仅静态。',
'src/service/production/StrictFactExecution.ts':'每文件 backend 超时有 AbortController 且 finally 清 timer；失败后保留诊断/完整分母并丢弃部分 facts，不能为提速改 first-N。',
'src/workflows/surfaces/persistence/DimensionCheckpoint.ts':'现 load API 按 TTL/dimId 读取，外层 DimensionRestoreState 仅按 activeDimIds 过滤；跨计划恢复绑定需要外层决策，未擅自改公共签名。save 的 dimId/sessionId 字段来源与路径输入值得后续硬化；当前调用方主要来自注册维度。',
'src/workflows/surfaces/coverage/CoverageLedgerWrite.ts':'advisory best-effort 是显式约束；不得把写失败变成生产门禁。逐 cell 非事务写可部分成功而返回零是既有可观测性风险，尚无复现，不冒充确认缺陷。',
'src/workflows/surfaces/coverage/shared/coveragePathMatching.ts':'后缀匹配保留旧路径兼容；跨仓重名文件可能弱化精度，但 advisory 语义下本轮不凭假设收紧契约。',
'src/service/plan/intent/planIntent.ts':'PlanSelection 与完整 PlanIntent 是两种协议，前者 coldStart 可空 moduleBindings；不要盲合校验器。未将所有潜在无效运行时输入升级为已复现问题。',
'src/workflows/surfaces/planning/dimensions/TierScheduler.ts':'层内错误转结果且继续是既有容错策略；tierHints 声明是1-based，但未校验整数，非整数 hint 可能 TypeError，作为待定输入硬化风险。',
'src/workflows/surfaces/host-agent/session/SessionSupport.ts':'按 dataRoot 单例隔离与旧容器容错保留；无 dataRoot 的 __memory__ 回退需与调用者生命周期一起考虑，不能仅为精简移除。',
'src/service/plan/facts/collectProjectContext.ts':'部分 AST 缺口从 warning.message 前缀识别，耦合人类文案；建议未来用结构化诊断码替代，但本轮不改外层协议。',
}
results=[]
for item in assigned+extra:
 file=item['file']; src=Path(file).read_text(); stem=Path(file).stem
 if file in full: depth='manual-full'
 elif file in partial and partial[file]: depth='manual-partial'
 else: depth='static'
 source_imports=[x for x in reverse[file] if x['file'].startswith('src/')]
 directtests=[x['file'] for x in reverse[file] if x['file'].startswith('test/')]
 relatedtests=set(directtests)
 for consumer in source_imports:
  for second in reverse[consumer['file']]:
   if second['file'].startswith('test/'): relatedtests.add(second['file'])
 case_titles=[]
 if item['kind']=='test':
  for line,text in enumerate(src.splitlines(),1):
   if re.search(r'\b(?:it|test|describe)\(',text): case_titles.append({'line':line,'title':text.strip()[:240]})
  role='行为回归测试：'+Path(file).stem.replace('.test','')+'；所测导入：'+', '.join(i['target'] or i['specifier'] for i in item.get('imports',[]) if i['specifier']!='vitest')
 else:
  role=role_map.get(stem)
  if not role and stem=='index': role='显式包/模块聚合入口，保持现有 symbols 与 ESM .js 导入兼容；不是可按无函数删除的死文件。'
  if not role and ('/types/' in file or stem in ['contracts','Types','RecipeSnapshotTypes','WorkflowReportTypes']): role='跨层结构契约/序列化 DTO：'+stem+'；接口本身无执行副作用，删除须校验真实导入和公共 exports。'
  if not role: role='模块 '+stem+'；通过下列导出和静态真实 importer 连接到生产链，人工语义审查范围见 reviewDepth。'
 item_findings=[dict(v,id=k) for k,v in findings.items() if v['file']==file]
 disposition='fix-required' if item_findings else ('retain-reviewed' if depth=='manual-full' else 'retain-pending-deeper-review')
 if item['kind']=='test' and not item_findings: disposition='retain-no-redundancy-proven'
 duplicate_groups=[{'group':i+1,'occurrences':g} for i,g in enumerate(duplicates) if any(e['file']==file for e in g)]
 tests=[{'file':t,'status':'not-run-by-this-reviewer','basis':'direct import or one barrel hop'} for t in sorted(relatedtests)]
 if item['kind']=='test': tests=[{'file':file,'status':'not-run-by-this-reviewer','caseTitles':case_titles,'assertionCallCount':len(re.findall(r'\bexpect\(',src)),'mockCallCount':len(re.findall(r'\bvi\.(?:mock|fn|spyOn)\(',src))}]
 results.append({'file':file,'reviewDepth':depth,'role':role,'findings':item_findings,'disposition':disposition,'tests':tests,'scope':'assigned-production' if item in assigned else 'additional-foundation-test','baselineSha256':item['sha256'],'baselineLines':item['lines'],'reviewedRanges':[[1,item['lines']]] if depth=='manual-full' else partial.get(file,[]),'consumerEvidence':{'directSourceImports':source_imports,'directTestImports':directtests,'note':'静态导入证明连接，不等于已运行；公开 root facade 的间接消费者需结合主线程扫描。'},'exports':item.get('exports',[]),'functionInventory':[f for f in item.get('functions',[]) if f['name']!='<anonymous>'],'duplicateFunctionGroups':duplicate_groups,'stateAndRecoveryNotes':notes.get(file,'逐文件静态核对导入/导出/函数清单；未证明存在可安全删除的状态/恢复分支。' if depth=='static' else '保留当前可观察错误/回退与持久化语义；本轮确认问题单独列于 findings。'),'reviewLimitation':'完整文件人工阅读，但只对列出的探针观察行为；不能等同完整功能证明。' if depth=='manual-full' else '只覆盖列明片段或静态结构；未将未读代码认定为无问题。'})
(ledger/'production-review.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
counts=Counter(x['reviewDepth'] for x in results)
summary='''# Production / workflow review — 2026-09-17

本报告覆盖 production-files.json 的全部124个文件条目，并额外纳入 foundation 的 Strict/Production/ColdStart 测试及三个相关 facade/plan 测试。这是逐文件审查账本，不是已完成全部逐行安全审计：每条诚实标记 manual-full / manual-partial / static；只读 AST/依赖清单不冒充人工语义审查。

未修改产品源码、测试、exports 或 Wakeflow 状态，未提交。只写本目录报告/最小探针；已运行的探针使用真实源码入口，所有可变数据在独立临时目录，运行后清理；未运行全量测试。

## 覆盖

'''+f"- 分配文件：{len(assigned)}；额外测试：{len(extra)}；合计：{len(results)}。\n- reviewDepth：{dict(counts)}。\n- 完整逐文件证据/真实内部导入/测试关联/方法清单：production-review.json。\n\n## 优先缺陷与 RED 入口\n\n"
for id,f in findings.items():
 summary+=f"### {id} [{f['priority']}] {f['title']}\n\n- 位置：`{f['file']}:{f['line']}`。\n- 复现：{f['repro']}\n- 证据：{f['evidence']}\n- 建议：{f['recommendation']}\n- 回归入口：{', '.join('`'+x+'`' for x in f['tests'])}。\n\n"
summary+='''## 接口和重复代码判断

- 保留完整严格生产链：plan 编译→完整 frozen denominator→Facts→populations/clusters→induction/falsification→expression→G1/Admission/G2→private revision→publication。receipt 生成与 authority 消费不是重复验证：一个给结构化事实，一个检查实际谱系、互斥与守恒。
- V3/V4/V5 durable semantic review 保持不同 signed payload/cardinality 兼容，不因行文相似删除旧 verifier。V2/V3/V4 live gateway 与 durable signature 分别解决同进程调用权限和跨进程证明；两者非替代关系。
- exact-duplicate-functions.json 在本组命中8组。GenerateDedup 与 RecipeSimilarity 的 ngram Jaccard 可提到现有 shared 叶层 helper，但保持两侧分词/权重/阈值及导出不变。两个 ProjectScope loader 可在明确异常语义后再统一。其余匿名投影/哈希函数需要保留所在版本语义，当前无删除证据。
- cold-start/knowledge-rescan 的两行 shim 和多个 barrel 是公开/兼容路径，不能按“本文件无方法”视为死代码；消费者扫描与 package exports 是删除前提。
- PlanIntent 与 PlanSelection、legacy workflow 与 strict production 的输入/预算语义不同，不能直接合并 DTO/校验器。

## 测试必要性

- 额外六个基础测试分别覆盖：cold-start 编译完整性与稳定性；隔离库恢复和句柄撤销；analysis 守恒；真实 review host/签名；冻结事实分母和失败回执；semantic disposition 的反伪造、独立评审和 exactly-once 终态。没有证据支持删除任一整套。
- 查见的重复匿名 callback 属于 fixture/映射，不等同重复行为用例；默认保留。GenerateDedup 的 guard 权重用例有条件断言，应加强，而非删除。
- 现有 session lease 测试只验证第二次 create 的拒绝，没有验证被拒后原活动对象仍能持久化；快照测试只传 content，没有覆盖合法 path-only 输入。这是实质测试缺口。

## 已知边界与尚未完成的深审

- 大型 strict validator、长 briefing/presentation、部分 plan事实与测试 fixture 仍有 static/manual-partial 条目；不能宣称全部4.4万行逐行审完。角色/导入/导出/函数清单已覆盖全部条目，后续可按 JSON 未读范围延续。
- checkpoint load 只按 TTL/dimId 过滤；真实 Alembic DimensionRestoreState 只检 activeDimIds，跨 plan/session 恢复约束需外层配合，未擅自改签名。
- coverage 是显式 advisory；写失败不能变成生产门禁。路径后缀兼容、逐 cell best-effort 部分写、tierHints 非整数、报告历史并发索引更新等为待深入验证点，未当成已复现缺陷。
- ledger 中基线 hash 对应主线程审查起点。主线程正在修复相关源码；本报告只提供 review 输入，修复与 GREEN 以主线程结果为准。
'''
(ledger/'production-findings.md').write_text(summary)
print(json.dumps({'assigned':len(assigned),'extra':len(extra),'counts':counts,'filesWritten':['production-review.json','production-findings.md']},ensure_ascii=False))
