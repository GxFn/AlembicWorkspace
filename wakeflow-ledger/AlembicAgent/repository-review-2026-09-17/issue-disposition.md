# 问题处置索引

原始审查与复审保留各自 ID；同一问题的补充分支不会伪计为新产品缺陷。完整证据及保留决策见 reviews/ 下原始报告与三份 disposition JSON。

| ID | 级别 | 问题 | 处置 |
| --- | --- | --- | --- |
| TOOLS-001 | P1 | 只读命令白名单可被换行及子程序执行选项绕过。 | 只读命令检查拒绝CR/LF/变量展开，并禁止find子程序/写文件、rg --pre等已复现绕过参数。 |
| TOOLS-002 | P1 | delta cache unchanged 在显式读取范围之前短路，阻止第二段源码与大文件 outline 后的补读。 | unchanged短路仅用于无显式范围请求；startLine/endLine/maxLines补读返回真实范围并继续维护指纹。 |
| TOOLS-003 | P1 | exclusive 锁只互斥其他 exclusive，parallel/single 均不等待，实际并非全局独占。 | 统一scheduler计入parallel/single活动，exclusive形成队列屏障；已验证取消屏障、异常和handler前取消释放。 |
| TOOLS-004 | P1 | 文件和 cwd 边界只检查词法路径，符号链接可越过项目根或别名绕过受保护路径。 | resolveProjectPath统一校验词法与realpath，新增文件校验最近存在祖先；code/terminal cwd/authoring和证据引用接入，保护路径使用真实相对路径。 |
| TOOLS-005 | P2 | 搜索 cache key 缺影响结果的 maxResults/contextLines，窄查询污染后续扩容查询。 | code.search缓存键加入projectRoot、pattern、glob、regex、maxResults和contextLines，窄结果不再污染扩容请求。 |
| TOOLS-006 | P1 | pytest 正则的计数组全部可选，先匹配 session 标题并伪造零测试零失败。 | pytest仅匹配真实结果计数摘要并取最后一条，支持failed/pass顺序和error/errors，session标题不再伪造0测试。 |
| TOOLS-007 | P1 | 已匹配的 unmerged git 状态未入任何 bucket，冲突可被压缩为空输出。 | 七种unmerged状态统一进入conflicted桶，UU等不再被丢成空字符串。 |
| TOOLS-008 | P1 | retrievalProfile sourceContentHash 在 style repair 前计算，修复改变事实字段后未重建而提交过期 hash。 | 采用风格修复后重新prepare candidate/profile hash，并使用共同authoring评估入口；不覆盖首次unsafe-code诊断。 |
| TOOLS-009 | P1 | ordinary output 仅清理 structuredContent，adapter 的 JSON text 仍保留被禁止的私有字段。 | ordinary output的可解析JSON text与structuredContent使用同一字段清理，合并redacted字段摘要。 |
| TOOLS-010 | P2 | 继承 unregister 仅删 manifest，handler definitions/expanded 状态仍保留，且 registerDefinition 先写 defs 后注册 manifest 会在重复失败后留下半注册。 | unregister同步清除manifest/definition/expanded状态；registerDefinition在manifest成功后写defs，失败不会留下半注册。 |
| TOOLS-011 | P1 | 通用执行入口和等待锁后均未检查 abortSignal，已取消/排队期间取消的有副作用 handler 仍可执行。 | router调度前、排队取消、获得slot后handler前均处理取消；adapter明确投影aborted，已执行partial输出保留。 |
| TOOLS-012 | P2 | 局部 JSON 提取器按每个花括号计深度，不识别 JSON 字符串/转义，拒绝合法风格修复输出。 | 风格修复委托shared structuredOutput JSON提取器，消除不识别字符串花括号的局部扫描器。 |
| TOOLS-013 | P2 | 首次并发调用在 parser import 完成前把 loaded 设 true，后来者跳过实际加载。 | 异步首次parser初始化共享Promise，compress等待后复用compressSync处理逻辑。 |
| TOOLS-014 | P2 | 参数校验忽略已声明的基础类型，错误形状能持久写入宿主会话 store 并破坏后续调用。 | 参数根形状及已声明基础类型在handler前校验，数字/数组/对象memory key不再进入store；未擅自把静态sources要求应用于evidenceRefs-only有效提交。 |
| TOOLS-X01 | P1 | Evolution commandAllowlist 只在直接给 ToolRouter 配 capability 的单测中兑现；真实宿主无此接线。 | runtimeSafetyGate在调用host router前使用当前LoopContext capability命令白名单；不再依赖宿主单例ToolRouter配置。 |
| RUNTIME-001 | P1 | abort() 只改状态/发事件，无法取消execute中的局部AbortController，在途provider/tool继续运行。 | 当前execute controller保存在实例，abort真实触发signal；provider迟到响应被丢弃，完成分支统一取消状态，abort事件不重复。 |
| RUNTIME-002 | P1 | 正常返回仅按reply非空判success，取消、policy拒绝、strict失败、fallback错误文本被误报成功。 | Service消费终止诊断/管线结局，明确aborted最优先；policy拒绝、provider终止、fallback、strict失败正确区分；历史timeout仅在最终阶段未恢复时决定timeout。 |
| RUNTIME-003 | P1 | execution.timeoutMs 在buildRuntimeOptions完全丢弃，公开运行时选项也无对应字段。 | AgentRuntimeRunOptions加入timeoutMs，Service透传，Runtime execute实际建立相应timeout保护。 |
| RUNTIME-004 | P1 | 非tracker首轮iteration先加到1，Policy用>=maxIterations提前终止；translation-json配置1会零模型调用。 | ExitController把已完成轮数iteration-1传给Policy；真实BudgetPolicy最大1轮时允许首个model调用。 |
| RUNTIME-005 | P1 | 声明式SafetyPolicy编译时所有约束字段丢失。 | 声明式safety policy去掉type后透传完整构造配置。 |
| RUNTIME-006 | P1 | 工具安全策略仅识别terminal args.bin旧形态，当前action/params.command不触发自定义命令黑名单。 | PolicyEngine识别params.command和旧bin形式；runtimeSafetyGate在host前执行策略，代码相对路径基于runtime.projectRoot归一化。 |
| RUNTIME-007 | P2 | 无ContextWindow的工具配额返回值与内部remaining状态不一致。 | 无ContextWindow分支同样初始化和重置roundMaxChars/used/maxMatches。 |
| RUNTIME-008 | P1 | 按tier排序执行后的结果数组与原输入顺序不一致，merger按下标将结果归错dim/module。 | tier执行结果按原始child对象保存并按原输入顺序重建，merger下标归属保持正确。 |
| RUNTIME-009 | P1 | parent合并只识别error/aborted，timeout和blocked均提升为success。 | parent聚合覆盖error/aborted/timeout/blocked全部非成功状态。 |
| RUNTIME-010 | P1 | request发布的请求自身因同correlationId被当作reply，未响应也立即成功。 | pending request记录requestType，同type请求发布不再自解；真正不同类型response可响应，无人回复会timeout。 |
| RUNTIME-011 | P1 | 直呼note_finding桥接丢弃schema公开的所有深度槽，RECORD阶段无法保存深度发现。 | 直呼note_finding按DEPTH_SLOT_PROPS单源key透传全部可选深度槽。 |
| RUNTIME-012 | P1 | Producer阶段gate未允许evidence.get/search，阻断capability已声明的证据自救通道。 | Producer gate允许既有evidence.get/search；RECORD schema和record-repair工具集同步保留证据只读入口。 |
| RUNTIME-013 | P1 | 可变状态读取被默认session缓存永久短路，绕开真实重读与写前新鲜度恢复。 | code/memory/knowledge/evidence及meta.review退出外层缓存；其它工具仅在明确只读manifest及真实snapshot下复用，移除session/文件长度伪snapshot。 |
| RUNTIME-014 | P1 | 公开可阻断tool:execute:before hook被Runtime用emitSync调用，false返回值完全无效。 | Runtime await可阻断hook并消费false，记录blocked且不调用router；await后复查signal。 |
| RUNTIME-015 | P2 | provider预算估计把system/runtime sections重复计入，导致未超预算的请求被误拒。 | 总input估算只计systemPrompt/providerMessages/tools一次；sections保留作分项和重复分析。 |
| RUNTIME-016 | P2 | 强制摘要仍消费旧扁平参数并将所有knowledge调用计为已提交候选。 | forcedSummary统一解包当前params/path形态，并通过toolOutcomes只统计真实created/id/lifecycle提交；scan finalize同样使用该语义。 |
| RUNTIME-017 | P1 | 两条强制摘要provider调用未传abortSignal，取消/timeout后摘要HTTP仍继续。 | 两条强制摘要provider调用均透传abortSignal；execute取消收束会覆盖迟到/降级摘要，防止取消提升为success。 |
| RUNTIME-018 | P2 | 任何knowledge查询都被当成submit，从而跳过文件证据数量门。 | QualityGatePolicy仅以isPersistedSubmission成功提交绕过文件引用门，knowledge查询/失败提交不再视为持久化。 |
| RUNTIME-019 | P2 | emitSync调用async观察者但不处理其rejected Promise，可能产生unhandled rejection。 | emitSync对async Promise附加reject处理并记录HOOK_HANDLER_FAILED。 |
| RUNTIME-020 | P1 | Pipeline循环不检查父取消，已取消stage正常返回停止文本后仍运行后续gate/promptBuilder/stage。 | 每个stage/gate入口检查父signal，取消后不调后续stage/gate；管线和Runtime最终都记录aborted outcome，Service明确优先消费。 |
| FINAL-RUNTIME-01 | P1 | 成功fast-retry仍被历史timedOutStages判为timeout，最终业务状态与管线完成结果相反。 | Service核对每个超时阶段的最终非超时非空输出且pipeline completed才认恢复；明确outcome=aborted最先返回，已恢复后的用户取消不再被历史timeout覆盖。 |
| FINAL-RUNTIME-02 | P2 | trackerSignal只在envelope.ok===false时传信封，丢失失败status的权威性，与共享normalizer和submitDedup的结果不一致。 | Tracker根据完整观察的ok与meta.blocked决定失败wrapper，成功仍传raw业务结果；envelope失败status不再丢失。 |
| FINAL-RUNTIME-03 | P2 | submitDedup忽略metadata.blocked，已知被中间件拦截的调用仍可被正向payload登记为真实提交。 | submitDedup在meta.blocked时最先返回，不登记title/isSubmit/ledger。 |
| FINAL-RUNTIME-04 | P2 | Producer gate保留旧窄ToolCallRecord类型，与新normalizer需要的args/action/id/lifecycle/envelope不一致。 | producer gate的toolCalls输入改为readonly unknown[]并统一交normalizer验证，旧窄结果壳已移除。 |
| PC-01 | P1 | conversationId 未校验，默认无 WriteZone 时可逃逸 conversations 目录读写/删除其他 JSONL；真实 HTTP chat 的 conversationId 仅校验为 string。 | 集中校验id；append/delete的WriteZone与普通fs分支均先走同一校验。 |
| PC-02 | P1 | 通用凭证正则不支持带引号 JSON key，证据持久化和开发者事件会留下普通格式的密码/token。 | JSON整值先脱敏，保留合法JSON及后续既有厂商/普通赋值规则。 |
| PC-03 | P1 | L2 去重只删 assistant.toolCalls 中的重复 knowledge call，没有删对应 tool result，破坏原子轮次。 | 移除按标题单独删除tool call的去重分支，保留每次调用及其对应结果。 |
| PC-04 | P1 | JSON 修复在解析前全局删除围栏/尾逗号，静默修改合法字符串内容；截断回收也有同类问题。 | 共用字符串感知修复；AI旧入口保留re-export，字符串内逗号/围栏不再被删除。 |
| PC-05 | P2 | 首次并发 _getGateway 调用会各建一个 gateway，拆开 concurrency/rate-limit/circuit state。 | await动态import后第二次检查gateway实例，首次并发共享同一闸门。 |
| PC-06 | P2 | maxRetries:0 被 \|\| 默认值改成3，宿主不能关闭 OpenAI/DeepSeek/Gemini 的重试。 | nullish缺省保留显式零次重试。 |
| PC-07 | P2 | 内部请求超时与主动取消都被归成 AbortError，timeout 不会走现有 ETIMEDOUT 的重试/熔断路径。 | 内部超时独立记录并抛ETIMEDOUT；外部取消继续保留AbortError路径。 |
| PC-08 | P2 | post 只监听未来 abort，没有检查已取消 signal；直接 transport 调用仍会发请求。 | 请求发出前检查已取消signal。 |
| PC-09 | P2 | resetToPromptOnly/resetForNewStage 未清 collapseThreshold，旧投影下标会重新作用于新消息。 | 两种reset都清collapseThreshold，避免旧投影索引作用于新阶段。 |
| PC-10 | P1 | summarize await AI 后使用旧快照重写文件，会永久丢掉等待期间 append 的新消息。 | 摘要写回前重读快照；有新增/删除/替换则放弃旧摘要而不覆盖。 |
| PC-11 | P2 | 公开工具缓存 key 未包含查询作用域/参数；read 仅识别 filePath 且不区分行区间。当前 V2 code handler 自有缓存已包含更多参数，此问题属于 SessionStore 组件接口。 | 完整稳定请求key，兼容params/扁平和path/filePath；顶层action权威，维持只读缓存。 |
| PC-12 | P2 | JSON/checkpoint 往返丢失 evidenceStore，恢复后已有维度报告无法经 searchEvidence 找到。 | 序列化真实Finding列表；新快照以显式evidenceStore为准，缺字段才重建旧报告索引。 |
| PC-13 | P2 | loadCheckpoint 没有调用现有形状校验，且解析中直接逐字段改状态；坏快照可返回成功或留下部分状态。 | 统一深度校验/clone后恢复；load用纯归一化结果原子替换，不创建临时带timer实例。 |
| PC-14 | P2 | Claude embed 返回空数组，但继承 supportsEmbedding()=true；宿主认为支持 embedding，跳过真实 fallback。 | Claude明确声明embedding不支持，宿主可继续走既有fallback。 |
| PC-15 | P2 | fallback 排除对象取环境原值而非实际探测到 provider；auto/别名/缺钥回退时可能重新选择同一个失败厂商。 | fallback排除基于实际primary标准身份，不用auto/别名环境原文。 |
| PC-16 | P2 | chat/chatStructured 的 transport.chat 返回 string，完全绕开 #emitUsage；Provider structured output 调用也没有 token recorder 事件。 | chat复用完整响应通道并提取text；JSON格式/schema随工具请求路径透传，usage只报一次。 |
| PC-17 | P2 | scratchpad 整体超预算就整段舍弃，低重要长发现可让最高重要短发现也消失，反而给低优先观察日志留预算。 | 按重要性逐条选择能放入的发现，不再因整个scratchpad超限全丢弃。 |
| PC-18 | P2 | configure 只改 totalBudget 不重算 allocation；静态 PM/SS 注入也未传实际预算，名义预算与真实输入脱节。 | 重算既有profile并清surplus；预算传PM/SS，实际PM/SS渲染使用token预算且含裁剪footer。 |
| PC-19 | P2 | 所有非 rejected 的 knowledge 动作都会计为提交，detail/search 及部分失败形状可使状态机过早收敛。 | 统一持久化提交判定，knowledge读取/重复/未创建不计数，仅真实created+id+lifecycle计生产进度。 |
| PC-20 | P2 | PersistentMemory.append 忽略调用者 importance；MemoryCoordinator 写入 decision 明确传7，最终 SQLite 永远5。 | AppendEntry可选importance透传新记忆，去重时显式更高重要性可提升已有值。 |
| PC-21 | P2 | 冲突替换发生在 transaction 外，后续普通候选写入失败时，冲突更新已永久生效而整个 consolidate 抛错。 | 冲突更新、普通合并、capacity在同一事务；冲突写错误传播触发回滚。 |
| PC-22 | P2 | 显式 apiKey 存在时提前 return config，使 GatewayConfig.timeout 全局覆盖配置失效。 | 显式凭证分支同样执行global timeout override，保留其他transport配置。 |
| KNOW-01 | P1 | sliceEvidenceForJudge 对模型 reasoning.sources 直接 join + readFileSync，允许 ../ 及 symlink 读取 projectRoot 外文件；judgeCandidate 再将切片发送给 chat。 | MiningJudge uses resolveProjectPath with lexical/realpath containment and validates absolute paths, caps and ranges. Normal and escaping slice tests retained. |
| KNOW-02 | P2 | extractRequestedRange 只读顶层 args，真实 args.params 范围被忽略；单文件展示态范围 10..11 被记成 1..2，破坏引用与 freshness。派生视图 fallback 又附 requestedRange，与 file-only 注释矛盾。 | EvidenceCapture unwraps nested params and derives source ranges from actual contiguous numbered output; declared derived views no longer inherit requested ranges. |
| KNOW-03 | P1 | isErrorString 在整个源码和搜索正文匹配 error/failed 等词；正常错误处理源码被丢弃，命中的搜索被反记为 not_found。 | EvidenceCollector recognizes anchored tool-error prefixes instead of rejecting arbitrary Error/failed words in source/search content. |
| KNOW-04 | P2 | JSON.parse 结果未经 object/schema 校验即作为 RelationDiscoveryResult；合法 JSON null 抛 TypeError，malformed relation 成员原样透传。 | Relation projection guards null/non-object JSON, validates nonnegative safe analyzed counts and relation member types, and exposes invalidRelationCount. |
| KNOW-05 | P2 | record repair 的 evidenceMap renderer 读取 snippet.line，但生产 CodeSnippet 字段是 startLine/endLine；已采集的行号变为一个空列表项。 | Record-repair evidence renderer uses CodeSnippet.startLine/endLine and keeps a path fallback. |
| KNOW-06 | P1 | Analyst 与 retry/record-repair 提示仍明确要求 note_finding({finding,evidence,importance})；真实 memory handler 已硬切 evidenceRefs，旧 evidence 必拒。 | Analyst/retry/repair examples now use evidenceRefs and optional excerpt/depth fields. Repair instructions allow querying already captured evidence. |
| KNOW-07 | P2 | collectEvolutionDecisionIds 与 evolutionGateEvaluator 重复按工具请求计决策，ok=true 的 duplicate_blocked submit(supersedes) 仍令旧 Recipe 被标已处理；没有产生持久化替代仍可通过完成门。 | Evolution gate and run share collectSuccessfulEvolutionIds/evolutionOutcome; duplicate_blocked submit cannot mark a replacement complete, absent result is not success, explicit Core outcome overrides compatibility status. |
| KNOW-08 | P2 | producerRejectionGateEvaluator 只按 knowledge 工具名计 submit，总数混入 search/detail/manage，查询会稀释拒绝率；还忽略 envelope.ok=false 的失败。 | Rejection gate identifies knowledge action=submit and accepts only validated persisted candidates; reads and failed envelopes cannot dilute rejection counts. |
| KNOW-09 | P2 | createFsSnippetRangeReader 仅词法拒绝 ..，statSync/readFileSync 仍跟随项目内 symlink 读取仓外；与明确的 projectRoot 内限定契约矛盾。 | Artifact snippet grounding now resolves the physical path through shared containment before source reads; symlink escape test passed. |
| KNOW-10 | P3 | applyGraphRetryGate 删除后 GRAPH_RELATIONSHIP_CN_RE、GRAPH_GAP_REASON 与 RELATIONSHIP_CN_RE import 遗留零消费者。 | Retired graph-retry private constants and unused Core import removed; current module coverage gate remains. |
| KNOW-11 | P1 | 测试从 @alembic/core/project-context-foundation 导入 createProjectContextFileRef，真实当前 Core export 在 @alembic/core/project-context；造成 20 个 durable review 用例初始化失败。 | Durable semantic review test imports createProjectContextFileRef from the actual @alembic/core/project-context facade. |
| KNOW-12 | P1 | 评估普通模块路径的 fake gateway 仅实现 create，真实 knowledge.submit 调 createOrStage/evaluateReadiness，普通 eval fixture 提交全部因接线不匹配失败；严格 fixture 由 capturedCandidates 旁路掩盖。 | eval-mining injects shared createEvaluationRecipeGateway with createOrStage/evaluateReadiness and pending/id/raw records. No legacy create-only port remains. |
| KNOW-13 | P2 | record repair / Analyst RECORD 虽在运行闸门允许 evidence.get/search，实际 advertised schema 无条件只剩 note_finding；repairStage 本身也只注入 memory。模型无法使用提示承诺的台账自救工具。 | Repair stage adds evidence; RECORD/repair schema projection retains evidence alongside note_finding. Runtime restriction still blocks unrelated exploration and writes. |
| KNOW-14 | P2 | judge 评审阶段允许缺失证据并捕获单样本错误，但最终 collectSourceFileReceipts 对每个声明 source 无条件 readFileSync；任一旧路径/缺失文件让报告阶段整体 ENOENT，丢失已完成评审结果。 | Calibration receipt collection records missing/unreadable/outside evidence as null hash/error rows instead of aborting report generation. The introduced malformed-sources regression is also closed by MAINT-03. |
| MT-01 | P2 | CI没有运行多数已声明的阻断门禁，PR可在public/Core/layer/doctrine/provider-neutral/signature/floor/retirement发生回归时通过。 | CI invokes check:ci for the full Agent/Core-compatible gate chain and retains public import smoke. Real Alembic host consumer remains in full local check and is explicitly documented as a separate environment requirement. |
| MT-02 | P1 | 缺钥测试未隔离真实环境凭证且不mock fetch；apiKey空字符串会回退读取ALEMBIC_*_API_KEY，测试可能产生真实计费请求。 | Missing-credential tests clear the four provider key environments and install a fail-if-called fetch stub; afterEach restores both. |
| MT-03 | P2 | dry-run宣称打印完整改名计划，但文件计划输出循环为空，成功dry-run无可审阅结果。 | Codemod dry-run prints each specifier/path-string plan plus rename rows without applying changes; the new temp-root test asserts visible plan and unchanged source bytes. |
| MT-04 | P2 | 跨目录移动未按importer的新位置计算相对import，移动文件对未移动依赖的import也完全跳过，apply后可破坏模块解析。 | Codemod computes imports from final importer/dependency positions, including dependencies not renamed. Original-offset reverse application also closes the subsequent cascading regression MAINT-02. |
| MT-05 | P2 | 构建未清理旧dist，发布staging整目录复制dist，会携带源码已删除/重命名后的旧JS和声明。 | package build now clears generated dist before tsc, and release:stage calls build before copying. The cleanup target is now a no-trailing-slash path and MAINT-01 symlink regression is covered. |
| MT-06 | P3 | 中文目录地图和出口列表落后当前实现：不存在agent/capabilities；未标evidence/evaluation拆分；缺./runs、./production、./evaluation及strict-consumer门禁。 | Chinese README removes the nonexistent capabilities directory, lists evidence/toolsets/current presets and all 15 exports, and documents strict host-consumer validation and host wiring. No API was changed to match outdated docs. |
| MT-07 | P3 | 当前入口副作用说明将所有scripts/*.mjs称为read-only，并将MemoryStore写成只读；与实际codemod --apply、release staging、SQLite CRUD/schema初始化不符。 | Current effects text now describes MemoryStore reads/writes through injected DB and distinguishes explicit build/release/codemod writes from checks. Dated Census is preserved with an explicit current reconciliation section. |
| MT-08 | P2 | declared test计数只识别it(/test(，完全忽略it.each，安全表驱动重构会被误记成覆盖减少。 | Validation-floor declaration count uses TypeScript AST and recognizes it.each/test.each outer invocations without double-counting the each builder. Frozen floors were not lowered. |
| MT-09 | P3 | staged发布包仅复制英文README，而英文README顶部链接本地README.zh-CN.md，导致发布包内链接悬空。 | README.zh-CN.md is now included in root package files, the staged manifest, and staging copy operations; the local README language link has a packaged target. Root will verify an actual release staging run separately. |
| MT-10 | P3 | standingExceptionsOutOfScope仍指向不存在的runtime/capabilities/RuntimeCapability.ts及旧reach-up状态，而layer-contract已记录2026-06-19解决。 | The obsolete RuntimeCapability reach-up exception was removed from the current machine companion record. Historical Census remains intact and its current reconciliation explicitly records that the reach-up was already resolved. |
| MAINT-01 | P1 | The recursive clean target is a file URL ending in dist/. On both Node 22 and Node 24 this follows a dist symlink and recursively deletes the external target directory, leaving the dangling link. | build-agent now passes fileURLToPath(new URL(../dist,...)) without trailing slash to rmSync; new temp-root test asserts external symlink target sentinel survives and dist link is removed. |
| MAINT-02 | P2 | Sequential replaceAll applies later import rewrites to text produced by earlier rewrites; moving an importer can collapse distinct imports onto the wrong target. | Codemod collects edits against original source offsets, avoids overlaps and applies descending offsets; the regression asserts ./b and ../b remain distinct after moving the importer. |
| MAINT-03 | P2 | The new receipt helper removed the original Array.isArray guard for candidate.reasoning.sources. Object/number source lists now throw during final report generation instead of being skipped or reported. | Receipt helper restores Array.isArray normalization; regression table covers object, number, string and null source lists. |
| ROOT-01 | P2 | 批量结果裁剪浅拷贝外壳后仍改写原 batchResults，污染调用方保留的原始工具结果。 | 批量搜索裁剪改为复制 batchResults 后处理，删除相邻不可达分支；原始工具结果不被污染。 |
