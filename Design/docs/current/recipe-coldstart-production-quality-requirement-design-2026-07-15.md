# Recipe 冷启动生产质量重建 — Requirement Design

- Design Key: `recipe-coldstart-production-quality-2026-07-15`
- Date: 2026-07-15
- Priority: P0
- Type: requirement
- Status: S1 同一 demand 原位重设计；controller revision 154 因 strict setup 的 pre/post-quiesce whole-root 观测矛盾判定 `blocked`；用户已确认两阶段 graceful-quiesce 时序与 Test 暂停门，等待 controller re-intake；修订实现、重新验收与 T6 均未完成
- Auto Claim: false
- State Root: `.wakeflow-active/current/recipe-coldstart-production-quality-2026-07-15` 已存在；Design 只读其状态，不创建、替换、claim、派发或写入
- Implementation/Test claim: 此前同一 demand 的非 Test 包已推进至 I8，进入真实场景时暴露 revision 154 blocker；历史 package acceptance、当前 26/26 focused tests 和无补丁 checkout 只作基线证据，均不证明修订后的 graceful-quiesce/snapshot/recovery 链或 T6 已通过

## 1. Required Outcome

从可信空态开始，用同一份经验证的 ProjectContext facts 冻结 source inventory、revision 与事实边界；让 Plan、Analyst、Producer 三个 LLM 角色分别承担调查规划、主动模式理解和知识表达。确定性组件负责完整/显式分页的事实采集、边界校验、守恒、反证执行和状态转换，不替代 LLM 的认知工作：Plan LLM 提出问题、知识方向、优先级、探索策略和预期反证，compiler 将其编译为合法 executable projection；Analyst LLM 经受控 fact-query/miner ports 主动比较 occurrences、variants、outliers 和 negative contrasts，提出、收窄或推翻机制假设；Producer LLM 只对最终 `survived|narrowed` 且 eligible 的 hypotheses 做 0/1/N Recipe 表达并写 usage/retrieval/negative-intent。它们都不能发明事实、自审、持久化或宣告 coverage。只让事实正确、独立判定有价值、调查 lens/cell 闭合、持久化一致且可 serving 的 Recipe 进入 immutable serving snapshot；Main/Core 在 CAS 前只做消费者中立的 serving-snapshot admission，Plugin 不进入 candidate 状态机。Plugin 对 versioned serving contract 的兼容性由 controller 用 exact artifacts 验收，正式五 MCP 则在 CAS 后由 Test 运行真实场景矩阵。

本设计把先前偏抽象的合同收紧到现有代码：已有能力复用，真实缺口就地扩展。Core 的 ProjectContext substrate、既有 Plan/Agent/knowledge/vector/publication seams 继续按后文约束复用；最终 artifacts 仍须重放 PC-F，不允许因历史验收而默认完好。当前新增的最小修订只在 Alembic：继续使用已有 `StrictExternalSetupRecovery`、`DaemonSupervisor`、daemon HTTP/shutdown、`Bootstrap.shutdown()`、external operation lock 和单一 strict journal；不得另造 daemon control、lock、snapshot 或 recovery platform。`StrictSetupAuthorityReceiptV1` 把停写前 whole-root observation 既当授权事实又当停写后 equality target，这与真实 shutdown 删除控制文件并 checkpoint SQLite 冲突；新运行必须用 versioned 两阶段合同替代该语义。

## 2. Code-Truth Audit: Reuse, Extend, New, Remove

| Area | Real code today | Contract decision |
| --- | --- | --- |
| ProjectContext contracts | `AlembicCore/src/domain/project-context/ProjectContextContracts.ts` 已定义 contract v1 和 9 个 request kinds；`ProjectContextService.ts`/`capabilities.ts` 已有 handlers/facade | **Reuse.** 不建第二套 capability registry。readiness 直接基于这些单源与 parser map |
| ProjectContext foundation | Core 已有 `service/project-context/foundation/{contracts,capture,store,readiness,consumerPort,nodePorts,canonical,index}.ts` 与 public export；当前可见调用主要在 test/audit/smoke，Alembic/Plugin 生产链没有被证明接入，审计脚本的五 projection 仍是占位投影 | **Reuse and wire, not re-create.** PC-F 验证现有实现并补真实 consumer binding、完整 inventory/detail 与 loaded-artifact acceptance；任一“已有文件”或测试通过都不能被写成生产完成 |
| Repo-scope authority | Foundation capture 的 `repositories` 与 readiness 的 expected repo IDs 都是 caller input；审计脚本用同一列表同时生成 capture/expected，漏仓可自洽 | **Add one Core-owned pre-capture scope receipt.** approved project-mode declaration→`ProjectScopeManifestV1`→capture/readiness；caller 不能分别提供两套 authority，synchronized mutation也失败 |
| Request-row identity | v1 request index 主要只键控 `repoId+kind`，readiness 对除 module/module-layers 外多数 kind 要求恰一行；当前 audit 又只选第一个 parser-supported file | **Version the row/index/readiness.** strict V2 identity includes selector + `canonicalScopeHash` + language/parser/surface，完整保留 multi-language/multi-scope/surface rows；delete/duplicate/swap selector/language/scope 以及 scope-alias mutations 均失败 |
| Frozen source bytes | v1 detail 只把 selected keys 写入 chunk；omitted continuation 是 key hash而非可重开字节/API，inventory blob hash没有 blob resolver | **Extend the same store.** every readable eligible file gets a confined content-addressed blob/snapshot ref；detail只做presentation；restart/live mutation后仍读原bytes，否则PC-F fail |
| Workflow facts | `Alembic/lib/project-facts/ProjectContextWorkflowFacts.ts` 已有 `ProjectContextWorkflowFacts`、envelopes、modules、dimensions、session 和有限 file snapshot | **Adapter only.** 保留为 Main 的现有投影/会话适配器，不是 canonical runtime truth；strict mode 从 Core artifact 纯派生并携带 binding |
| Plan facts | Main `PlanSelectionGate.ts` 有 workflow facts + `collectPlanProjectContext`；Plugin Plan 也调用该 collector，generation 又有独立 `project-context-analysis.ts`（25/3/8），形成三种 strict-path collector/projection | **Remove duplicate producers.** Core 提供唯一 capture/artifact builder；Main/Plugin strict path 从同一 artifact 派生 Plan/generation view，三个旧 collector call count 均为 0 |
| Core Plan raw source facts | `collectProjectContext.ts` 直接调用 `projectSourceFacts.ts` 扫盘；默认总文件上限 5000、每 module owned-file 上限 400 | **Inventory and remove from strict truth.** 作为真实旁路列入 PC-F；strict Plan 从 artifact 投影，raw scanner call count=0。5000/400 只作 truncation regression，不是完整性标准 |
| Generation dependency facts | `AiDimensionPreparation.ts` 通过 `ProjectContextConsumerFacts.projectContextDependencyGraph()` 直接取 dependency graph，失败后继续；`ProjectContextConsumerFacts.ts` 还可从 `ProjectScopeRegistryStore` 合成 repo/dependency facts | **Artifact-only in strict mode.** generation/dependency graph 必须从 accepted artifact adapter 读取并记录同一 `artifactId/sourceVectorHash`；直接调用、静默 null 与合成 ProjectScope facts 计数均为 0 |
| Module coverage consumers | Main `ModuleService.ts` 直接读 ProjectContext repo/dependency graph并递归扫描；`ProjectContextWorkflowFacts.ts` 在 map 空时调 `ProjectMapModules.buildProjectMapModulesFromTargets()`，该路径直读 Package.swift/扫盘并有 per-prefix 80 cap，consumer seeds/owned files 又有 12 cap；Plugin `ModuleService.ts` 直接执行 repo/map/module requests、失败合成 modules 且有 24 cap | **Artifact-only in strict mode.** module planning/coverage 使用同一 canonical module inventory；`ProjectMapModules`/12/24/80/raw-filesystem/consumer-specific synthesis 旁路计数均为 0，>12/>24/>80 fixtures 不截断；legacy/manual mode 不被本合同全局删除 |
| Plugin submit module axis | `host-runtime/mcp/handlers/tool-router.ts#resolveSubmitKnowledgeModuleAxis` 通过 Plugin `ModuleService` 构造 submit Gateway module axis；缺失/异常时可返回空 axis 并 passthrough Core | **Inventory the real submit path.** strict submit/plan-confirm/module-axis callers 必须 applicable 或有不可达证据；applicable 路径用 artifact-bound canonical module resolver，missing/error/cap overflow fail closed，empty-axis/Core-passthrough counter=0 |
| Dimension completion | Plugin `dimension-completion.ts` 调用 Plugin `ModuleService.listCanonicalModules()`，coverage repository/module 缺失或写失败时可 advisory skip | **Split legacy exploration from strict receipt.** strict completion 从 artifact-bound canonical cell/module axis 读取并记录 lineage；required receipt/write 失败阻断，legacy advisory 行为可保留 |
| Generate session lineage | Core `GenerateSession.ts` 的 ProjectContext snapshot cache 默认可为 null，而 dimension completion 会读 session snapshot | **Verify and repair, do not assume.** strict session creation/persist/reload must carry the certified artifact binding; null or stale snapshot blocks dimension completion instead of recollecting |
| Session construction | Main `buildProjectContextWorkflowSessionOptions()` 与 Plugin `project-context-analysis.ts#createSession()` 当前只传摘要 facts，未传 snapshot/artifact binding | **Repair actual constructors.** strict Main/HostAgent session create→persist→reload 均携带同一 artifact/binding；缺失或 null fail closed |
| Incremental/rescan entrypoints | Main `IncrementalRescanWorkflow.ts` 独立开 workflow session、best-effort 写 legacy file snapshot；Plugin `knowledge-rescan.ts` cleanup 后再次调用 `buildHostAgentProjectContextAnalysis()` | **No silent bypass.** 两入口进入完整 consumer inventory。对本需求四个 strict cold-start 场景预期为 typed N/A + strict entry 不可达/call count=0；若后续实现选择复用任一入口，则该行改为 applicable 并必须使用同一 artifact-only adapter，不能第二次 capture |
| SP repo discovery | Plugin `GitSubmoduleRepoDiscovery.ts` 解析 `.gitmodules`，`ProjectGraphProvider.ts` 可用它扩展 live Graph repo scope | **Core-owned scope receipt is authoritative.** SP root+4 先由独立 `ProjectScopeManifestV1` 固定，Core capture 只能派生使用；`.gitmodules` 仅作 live Graph/shared discovery probe，逐项按 `repoId+relativeRoot+revision` 对账，不能另立 production truth |
| Graph | `ProjectGraphProvider.ts` 和 `read-only-graph-executor.ts` 是 request-scoped live-source；build session 是 process-local cache | **Keep live and Recipe-free.** 不建 frozen Graph registry；用 source revision/fingerprint 与 Plan facts 对账 |
| Current 5/5 capability | Plugin 已有 5/5 graph fixtures、region/session tests；历史验收曾只有 1/5。当前 loaded terminal repo envelope 已能出现 5/5，但整体仍是 degraded/partial，包含 errors/suppressed errors，不能把 repo accounting 当完整 request truth | **Audit and repair before Plan development.** 先验证 accepted artifact/config；任何确认缺陷必须修复并回归。仅当全部 PC-F gates 以真实产物证据通过且 open defects=0 时，才允许 `repairCommits=[]`；不得默认完好，也不得重复造 traversal |
| Dimension catalog | `AlembicCore/src/domain/dimension/DimensionRegistry.ts` 当前实际 26 项；synthesis 的 `layer` 仍写 `universal`，文件头仍称 25 | **Reuse + fix drift.** snapshot 是 registry payload 的 version/hash wrapper；显式分类 13/7/5/1，未接受 hash 漂移 fail closed |
| Plan selection | `PlanIntent` 已有 dimension intents、`plannedNextActions`、`evidenceRefs`，`PlanNextAction` 已有 tool/reason/order/scope；但 `PlanAgentRun` 当前直接产更薄的 executable `PlanSelection`，`planIntent.ts` projection 丢失 priority/actions，Plan profile action space 为 none，module candidates silent 截前20 | **Extend, do not fork.** strict Plan LLM 产扩展后的 `PlanIntent` cognition receipt：questions/subquestions、anatomy lenses、approved capability/query IDs、priority、within-cap allocation、support/counterevidence、stop/escalate；compiler 校验后投到 executable projection。`PlanCognitionReceipt` 是该既有 intent 的不可变 receipt 名，不是第二套 Plan 类型/服务 |
| ProjectContext semantic facts | `ProjectContextRefs.ts` 已有 symbol/file/relation-site/anchor-range refs；`ProjectContextMap.ts` 已有 symbol/relation endpoints、repo/module/layer/file-flow/file-symbol/source-slice DTO | **Reuse identities and anchors.** direct Fact subject uses accepted `ProjectContextRef.id` plus repo-relative frozen blob/range；relations reuse source/target/ref identities。Do not create a second semantic graph or universal cross-revision entity ID |
| Source graph semantics | `SourceGraphContracts.ts` declares rich edge kinds/provenance, but current `SourceGraphIndexer.ts` principally emits JavaScript-family import edges and some paths emit no edges | **Schema is not capability.** only edge kinds with loaded producer+fixture+terminal receipt may support a claim. Call/control/data/order/history/runtime remain unsupported or typed failed/N/A until an accepted backend exists |
| Analysis units | host-agent analysis packet already has stable units/read sets/evidence/completion, but builder is dimension-oriented and bounded | **Thin extension.** add canonical subject/parent/scale/view bindings to the existing unit projection; derive from frozen ProjectContext subjects. Do not create another AnalysisUnit subsystem |
| Parser/code-fact substrate | Core Tree-sitter runtime/grammar 已覆盖 Swift、Objective-C、TypeScript/TSX、JavaScript、Python、Java、Kotlin、Go、Dart、Rust；`ProjectGraph.ts` 默认 `maxFiles=500`、排除 tests，timeout/parse error 可返回 partial | **Reuse parser, split semantics.** 交互 Graph 保持 partial；strict mining 新建从 frozen inventory 派生的完整 `CodeFactGeneration` receipts，不增加第二 parser stack，不把 `ProjectGraph` partial 当覆盖 |
| Mining work model | 当前代码没有 versioned fact population/cluster/induction 或完整 terminal receipt；`code` search 默认10/最多50、graph tool limit最多100且无 authoritative continuation，不能代表总体 | **New minimal projections on existing ledgers.** fact harvest按 canonical subject/analysis scale 执行且与cell/dimension解耦；`lensBindings`把共享 facts/clusters/questions映射到cells。增加 population/cluster/induction/falsification projections和derivation witness，不建一名词一服务/表 |
| Analysis discovery | `EvidenceStarterBuilder` 是启发式 starter；`RuntimeInitializer` 把 `projectGraph=null`；`AiDimensionPreparation` 的 AST/call/Guard/panorama 可为null；`AnalysisArtifact` 可从Markdown派生findings并重读live filesystem；`EvidenceCollector`会截断并把部分错误推向`not_found` | **Keep Analyst LLM active, replace evidence authority.** Analyst通过受控fact-query/miner ports主动调查并可申请有界 expansion；完整population与typed failure来自确定性facts/ledger。strict Markdown/live-read/error→empty/quantity-floor为0 |
| Budget semantics | `planIntent.ts` 要 dimensions 非空、budget >0、每维/每 binding `targetRecipes>0`，并以 `dimensionCount*3` 形成最低 Recipe budget、总 cap 500；Plugin bindings cap 80 | **Remove Recipe-floor semantics, retain real upper bounds.** 现有 `dimensionBudgets`/Plan actions改表达调查资源分配与reserve，不是Recipe配额；strict candidate/query/token/time/cost hard caps来自 frozen production config。超出当前 wire capability即 unsupported，不截断，不把代码里的500/80误写成产品目标 |
| Deferred cells | `AlembicPlugin/lib/recipe-pipeline/plan/plan-confirm.ts` 会 best-effort 自动写 omitted cold-start cells 为 deferred | **Remove for this contract.** initial `deferredCells=[]`；任何未来延期必须有新的 user-confirmation receipt |
| Findings | `AlembicAgent/src/agent/evaluation/analysisArtifact.ts` 已有 `AnalysisArtifact`/normalized findings | **Reuse.** 版本化 metadata；“FindingEnvelope”仅作 evidence export view，不建新存储/domain type |
| Evidence | Core Evidence Ledger contract + Agent `EvidenceLedgerStore` 已有 append-only tool/path/range/content-hash evidence，但没有 semantic fact、denominator或premise→derived output witness | **Reuse + companion projection.** Raw evidence remains unchanged authority；strict fact/query receipt binds sourceVector/blob/ref IDs and a compact direct-anchor or premise derivation witness. Do not turn the ledger into a second fact store or proof engine |
| Recipe input | `RecipeProductionGateway.ts` 已有 `CreateRecipeItem`、`RecipeProductionPort`、dedup/similarity/consolidation；当前 `CreateRecipeItem` 没有 run/session binding | **Reuse + bind externally.** “RecipeDraft”是拟议的 session-bound evidence view，严格 journal/production-binding 将它映射到现有 `CreateRecipeItem`；strict consolidation failure fail closed |
| G1 | Core/Agent/Plugin 已有 authoring/content/source-evidence gates 和 golden corpus/drift tripwire | **Reuse.** G1 只承诺可确定性校验的 schema/hash/range/scope/profile/privacy，不虚称能确定性判断自然语言价值 |
| G2 | `AlembicAgent/scripts/lib/mining-judge.mjs` 已有 refute-first verdict、citation check；但只审有限 authored fields、直接重读可变源码，且没有 empty rubric | **Reuse infrastructure, extend contract.** 把 reviewer/citation/calibration 基础迁入 `src/agent/evaluation`，改读 immutable Evidence Ledger，补完整 authored projection、admission/novelty 和新的 investigated-empty rubric；不把现有脚本夸大成完整生产门禁 |
| Analysis quality | `qualityGates.ts` 用文件数、工具数、文本长度、结构和 finding count | **Keep as process gate only.** 不把这些 proxy 当 G2/value/completion |
| Coverage | `CoverageLedgerRepository` 是 module×dimension；Builder 用 path overlap；Write 明确 advisory/nonblocking；Advisor 允许 partial/exhausted 收敛 | **Keep exploration ledger.** 新增 hash-linked immutable `CandidateCoverageReceipt` + `FinalCoverageBindingReceipt` 作为发布真相，不冒充 coverage generation |
| Persistence | writer 先 cleanup/move old 再写；lifecycle 忽略 null；`KnowledgeUnitOfWork` 仅测试使用且自身不满足本合同 | **Repair real path.** 先修 `KnowledgeService`/`RecipeProductionGateway`/writer 的真实生产路径；只有经适配并证明收益时才复用 UoW，不为勾选合同强接一个不完整抽象 |
| Gateway batch | `RecipeProductionGateway.create` 是逐 item 写，允许部分成功；consolidation error 可 fallback direct submit | **Do not force global batch transaction.** working root 私有，partial results 留 evidence；strict finalization 只物化合格集合；strict consolidation fail closed |
| Source refs/vector completion | current consumers fire-and-forget；first vector `maintain()` without active returns planned | **Await in strict finalizer.** refs blockers=0；first generation explicit rebuild/inspect；不得用 legacy session completion |
| Sparse | `SearchEngine` 从 request DB 用 `FieldWeightedScorer` 建内存 index；BM25 unsupported | **Reuse.** 新增 `SparseVerificationReceipt`，不新增 persisted sparse generation/pointer，不称 BM25 |
| Vector | Core `RecipeVectorGenerationManager` 已有 shadow/build/inspect/CAS；Alembic、Plugin、public Search 当前 routes 不一致 | **Reuse manager, unify consumption.** public Search/Prime 必须读取 snapshot 指定的 exact generation ID/hash |
| Public readers | Search 只排 deprecated；Map `filter:{}`；Guard 包含 staging/evolving/decaying；public Search/Prime 读 legacy vector file | **Fix via one serving snapshot + resolver.** snapshot 只含 final ready corpus，四知识工具统一读 publication location |
| Strict setup authority | `StrictExternalSetupRecovery.ts` 的 current V1 authority/header binds `preResetObservation`; initialize/recover recompute the target and require canonical equality | **Version, do not weaken.** V2 keeps pre-quiesce observation as authorization/recovery provenance and adds post-quiesce snapshot authority; current V1 equality is superseded for new strict runs |
| Daemon ordering | `DaemonSupervisor.start()` checks `existing.ready && !restart` before strict action classification and restart termination precedes child spawn; parent ready wait can observe the old daemon | **Repair in place.** classify strict first, never pre-kill for strict, and require child/new identity for strict readiness/terminal action result |
| Graceful shutdown/checkpoint | `daemon-server.ts` shutdown removes daemon state/PID and invokes `AppRuntime.shutdown`; `Bootstrap.shutdown()` runs `wal_checkpoint(TRUNCATE)` then closes SQLite, while current strict authority assumes target bytes stay unchanged | **Expose exact outcome.** existing daemon route/shutdown supplies idempotent authenticated ack; strict child waits exact PID exit and verifies checkpoint/whole-root before receipt/snapshot. Control-file removal is recorded, not ignored |
| Public consumer execution | Plugin `EmbeddedToolExecutor` 与五个 read-only executors 已复用正式 handlers/schemas；Main 的 `StrictPrivateCorpusRuntime.runCandidateFiveToolOracle` 仅做 repository CRUD+sparse/vector probes，并非正式五工具 | **Do not couple to candidate publication.** 不新增 Main→Plugin 依赖、candidate handle/resolver 或内部 MCP 路由；Main/Core 只产 tool-neutral serving validation。Plugin 以 exact artifact + versioned serving fixtures 做 I8 compatibility，正式五工具只在 CAS 后 Test/公共读取运行 |
| Publication | 当前没有 session-level atomic public knowledge route | **New, minimal.** 一个 immutable serving snapshot + 一个 `publicSessionPointer`；不新增 Recipe/ref/coverage/sparse pointers |
| Reset | `Alembic/lib/service/cleanup/CleanupService.ts#fullReset` 会清 source graph、PC snapshots、tasks/audit/sessions，并移动 skills/wiki；无完整 restore | **Forbidden.** 新增 exact allowlist cold-start reset/restore protocol；现有 fullReset 不可调用 |
| Completion status | generic bootstrap 可把 `completed_with_errors` 映射 completed | **Add strict finalizer status only.** 不全局改变 legacy；strict run 只有 final receipt+CAS 才 finalized |

### 2.1 What this audit removes as overdesign

- 不建 `ProjectContextCertificationContext`、`CandidatePublicationHandle`、candidate reader 或跨仓 oracle transport；Main/Core 的 sealed-snapshot admission 使用现有 repository/vector/publication primitives，不复用或扩展 Plugin `ToolExecutionContext`。
- 不建第二套 `PlanCognition` domain、`AnalysisToolbox` 或 parallel mining orchestrator；strict cognition扩展现有 `PlanIntent`/`PlanNextAction`，tool/query选择使用现有 capability registry 的冻结 catalog，epoch编排扩展现有 `PipelineStrategy`。
- 不建第二个 semantic graph、全局跨版本 entity registry 或 proof/Datalog engine；Fact subject/anchor 复用 `ProjectContextRef`、frozen blob/range，derived witness只保存最小 premise/query lineage。
- 不把 live Graph 绑定为 frozen knowledge snapshot consumer。Graph 只携带 publication provenance 和 source-revision match status。
- 不建 Recipe、ref、coverage、sparse 四套 generation/pointer。前三者同在 SQLite/snapshot；sparse 可由 DB 确定性重建。
- 不建独立 FindingEnvelope、RecipeDraft、SourceEvidence persistence。分别复用 AnalysisArtifact、CreateRecipeItem、Evidence Ledger。
- 不把 content-ready/serving-ready 加入全局 `KnowledgeLifecycle`；它们是本 run 的 predicates/receipts。
- 不把 4096 candidates、128 modules、criticality 3/2/1 配额或其它未由代码/配置支持的数写成现有能力。当前 legacy MCP Plan wire 只证明 `moduleBindings.max=80`、Recipe-budget fields `max=500`，二者都不是新 strict candidate budget 的产品真理。strict V2 必须冻结自己的 module/cell/query/candidate upper bounds；若完整 scope 超出当前 wire，owner 先版本化并验收 wire/config，而不是截断、复用 500 的旧语义或缩 scope。
- 不把 sparse 叫 BM25，不虚构 sparse active generation。
- 不要求所有 universal dimensions 与所有 modules 做笛卡尔积；只生成有事实依据的 eligible cells。
- 不把外部系统整套搬进 Alembic：Glean 的 immutable fact generation、CodeQL 的 versioned query pack、Joern/CPG 的关系建模和 Soufflé/Datalog 的 provenance 只作为设计方法参考。第一版复用现有 Tree-sitter、ProjectContext/source graph 和 Evidence Ledger；只有明确 fact-query/backend 缺少 CFG/dataflow/history 语义且 controller 接受新的 artifact/backend 时才增加可选 backend。
- 不把 `SourceGraphContracts` 中声明但当前 producer 未产出的 call/control/data/order edge 当现成能力；schema presence、LLM猜测或无结果都不能升级 backend capability。
- 不为每个逻辑 receipt 建单独服务、表或文件。实现优先复用 Foundation immutable artifact、扩展后的 AnalysisArtifact/evidence bundle；需要运行恢复的投影统一存进 Alembic 拟议的单一 strict durable run journal。当前代码没有该 journal，必须作为一个明确实现与故障验收项，而不是假定存在。

### 2.2 Strict-path legacy quarantine and removal matrix

本表是实现边界，不是“建议清理”。owner 必须用 loaded-artifact trace 证明 strict entry 的旧分支计数为零；兼容模式可以暂留，但必须有显式 mode guard、owner 和全部 strict consumers 迁移后的删除触发器。

| Existing entry | Current harmful behavior | Strict replacement | Legacy fate and binary acceptance |
| --- | --- | --- | --- |
| `AlembicAgent/src/agent/runs/plan/PlanAgentRun.ts` | LLM 直接决定 executable Plan，runtime tool choice关闭，module候选静默截20 | 保留Plan LLM并让它输出扩展 `PlanIntent` 的 cognition receipt；Plan从冻结catalog选择capability/query IDs但不在Plan阶段执行源码工具；Core compiler校验facts/范围/anatomy lenses/caps并编译execution projection | strict legacy-PlanSelection invocation=0；strict Plan-cognition=`1 initial + 0..2 parent-linked semantic repairs`；完整decomposition/tool/budget strategy入receipt；未知module/tool、silent top20、第三次repair或LLM改caps均失败 |
| Foundation v1 caller `projections` + audit script placeholders | capture把调用方任意payload hash进artifact；audit用consumer/mode/repoIds/requestKinds摘要充当五projection | strict v2 canonical facts artifact不把placeholder当consumer evidence；实际loaded consumer adapter从artifact facts纯派生projection并产`ProjectContextConsumerProjectionReceipt` | placeholder projection不能过PC-F；v1仅兼容，迁移前不删store/readiness |
| Main `PlanSelectionGate.ts`、Core `collectProjectContext.ts`、Plugin `project-context-analysis.ts` | 多次 ProjectContext/raw source collection，限制与投影不一致 | 现有 Core Foundation artifact-only adapter | strict direct capture/raw scan count=0；全部生产消费者迁移并 accepted 后才删兼容分支 |
| `ProjectContextConsumerFacts.ts`、Main/Plugin `ModuleService.ts`、Plugin `dimension-completion.ts` | direct request、ProjectScope/module synthesis、filesystem fallback、advisory skip | 同一 artifact 的 dependency/module/cell projections + blocking receipt | direct/synthetic/raw fallback=0；required receipt failure blocks |
| Core `src/core/ast/ProjectGraph.ts` | 默认 500 files、排除 tests、timeout break、parse error continue | strict `CodeFactGeneration` 遍历 frozen eligible inventory，每 unit terminal | 保留交互 Graph partial semantics；strict mining import/result-as-completeness count=0 |
| `AiDimensionPreparation.ts`/`RuntimeInitializer.ts` | dependency/source graph fail-open，AST/call/Guard/panorama可null，`projectGraph=null` | artifact-bound fact-query/miner ports + population state供Analyst主动调查；required fact family fail closed | strict required-null/fail-open count=0；missing backend→failed/unknown，对受影响问题的Analyst/Producer call=0 |
| `analysisArtifact.ts` | Markdown 派生 finding、按模型路径重读 live filesystem | Observation/Hypothesis 只引用 immutable fact/evidence receipts | strict `derivedFindingCount=0`、live read count=0；route violation fails run |
| `EvidenceCollector.ts`/code search | 错误、截断、零结果可退化为`not_found`；结果Top-N且无权威continuation | `ObservationPopulation`记录full denominator/continuation/typed error，collector仅兼容展示 | 不得支持investigated-empty；`shown<total`无continuation或error→empty即失败 |
| `insightAnalyst.ts`、`ExplorationStrategies.ts`、`insightProducer.ts`、`GenerateProduce.ts` | ≥3 findings/files、每finding至少一Recipe、禁止合并；Producer action space含 `knowledge.submit` | Analyst主动查询/比较/反证；deterministic pre-group只组织候选，final cluster语义由Analyst；Producer只消费最终`survived|narrowed` eligible hypothesis做0/1/N proposal-only output | strict floor/enforced one-to-one/direct-submit=0；未登记反证、算法自定final cluster、无理由merge/split、缺失expression fate或未决population均失败 |
| `qualityGates.ts`、`depthReview.ts` | 文件/工具/长度/section/finding proxy | process diagnostics only；G2 uses evidence/value axes | 任一 proxy 不得置 G1/G2/coverage pass；mutation test 证明 |
| `submitEvidenceExpansion.ts`、`recipeProductionAdapter.ts` | 自动猜 refs/缩 scope/清空 unsafe `coreCode` 后继续 | typed revise/reject；任何 content change 进入同一 repair lineage 并重审 | strict auto-fix count=0；输入输出 fingerprint 非法变化 blocks |
| `RecipeProductionGateway.ts`、Agent `knowledge.ts` | validation/consolidation/persist 耦合，advisor fail 可 direct submit，readiness/quality 在 persist 后 | non-persisting admission → independent G2 → deterministic-ID persist/ref | strict fallback/direct-persist/post-write-first-review count=0；DB/file write before pass=0 |
| mutable coverage ledger/Advisor | path overlap/advisory、partial/exhausted 可收敛 | schedule obligation receipts → G3 immutable coverage | exploration only；G3 reads ledger-as-truth count=0 |
| `mining-judge.mjs` | 直接读可变源码，只是离线脚本 | production reviewer module reads immutable Evidence Ledger/full chunks；script calls same module | reviewer failure/advisory cannot pass；loaded production implementation/hash receipt required |

“零”由 instrumentation/call trace + negative route test 双证据证明，不能只靠源码搜索。兼容分支的最终删除属于同一需求内 owner cleanup，触发条件是所有列出的生产调用者已迁移、controller 接受兼容矩阵且 targeted regression 通过；在此之前必须隔离而不是贸然全局删除。

### 2.3 Minimal code-delta map

This is the implementation guide for the newly tightened mining contract. `Extend` means modify the named substrate; it does not authorize a sibling platform.

| Stage | Existing code seam | Minimal change | Binary code-level acceptance |
| --- | --- | --- | --- |
| PC-F consumers | Core `foundation/consumerPort.ts`; Main/Plugin collectors and module services | wire five real artifact-only adapters and projection receipts | one artifact/vector across five consumers; direct/raw/synthetic/capped bypass=0 |
| Plan domain | Core `plan/intent/contracts.ts`, `planIntent.ts`; Agent `PlanAgentRun.ts`, `plan.profile.ts` | extend `PlanIntent`/`PlanNextAction` for decomposition, anatomy IDs, capability/query IDs, priority, allocation/reserves, stop/escalate; strict Agent emits intent receipt rather than PlanSelection | no top20 or Recipe floor; same receipt compiles identically; execution projection retains every accepted action field |
| Plan entry | Main `PlanSelectionGate.ts` | remove second facts collection; reopen accepted artifact and invoke Core compiler once | one capture/facts hash; old collector count=0; stale receipt fails before generation |
| Fact identity | `ProjectContextRefs.ts`, `ProjectContextMap.ts`, Foundation chunks | canonical subject/anchor projection and typed relation endpoints | stable same-revision IDs; dangling endpoint typed; no universal cross-revision ID or second graph |
| Backend truth | Tree-sitter/ProjectGraph, SourceGraph indexer, existing config parsers | emit explicit loaded producer/supported-kind/terminal diagnostics; wrap only needed families in fact-query adapters | schema-only edge, parser/config error or partial traversal cannot yield complete/empty; fixtures prove each enabled family |
| Multiscale units | existing host-agent `analysis-packet/Types.ts` and builder | add subject/parent/scale/view/fact/witness bindings derived from frozen artifact | parent containment and direct-fact de-duplication pass from source-range to project |
| Analyst transport | Capability Registry, `GenerateAnalyze.ts`, `PipelineStrategy.ts`, ActiveContext | artifact-bound paged query receipts; typed analysis epochs/owner-resume; candidate pre-group only | Top-N never complete; final cluster belongs to Analyst; strict skip/degrade=0 |
| Fact evidence | Evidence Ledger + fact/query receipt | keep raw ledger; embed direct anchor or ordered-premise/denominator witness in companion receipt | witness replay succeeds; tamper/missing premise/source drift fails deterministically |
| Producer | `insightProducer.ts`, `GenerateProduce.ts` | output proposal-only 0/1/N expression set; remove strict `knowledge.submit`/query/review actions | action-space mutation proves no direct persist; every hypothesis has one closed expression set |
| Gates | `qualityGates.ts`, PipelineStrategy gate interfaces, productionized judge | keep proxy metrics diagnostic; add G1/admission/independent G2 and typed owner/resume result | one-file high-value passes, three-file generic fails; every non-pass has one owner/re-entry |
| Persistence | Gateway/`knowledge.ts`/KnowledgeService/writer/reconciler | split non-persisting admission from reviewed deterministic-ID persistence; await refs | DB/file write-before-pass=0; crash replay produces one ID and one terminal receipt |
| External setup/quiesce | `StrictExternalSetupRecovery.ts`, `DaemonSupervisor.ts`, `daemon-server.ts`, daemon route, `Bootstrap.shutdown()` | version authority/header to separate pre-quiesce provenance from post-quiesce snapshot authority; classify strict action before ready fast-path; after external lease/header fsync, call one authenticated run-bound graceful-quiesce route on the existing daemon boundary and mint `QuiescedPreResetObservationReceiptV1` | live-ready strict execute is not swallowed or pre-killed; exact request/ack; checkpoint+PID exit precede receipt/snapshot; timeout/conflict cannot SIGKILL then continue; ordinary daemon behavior unchanged |
| Recovery/publication | Alembic outer pipeline + one strict journal; existing Core publication/vector primitives | resume by quiesce/snapshot/reset stage, persist phase receipts/typed returns, build/seal candidate, tool-neutral `ServingSnapshotValidationReceipt`, final compare-null public CAS | fresh-process fault at each boundary resumes/compensates; rebuild exact-restore verified before normal runtime creates fresh control state; Main has no Plugin/MCP dependency/private reader and one CAS winner |

## 3. Actors, Producer/Consumer Chain And Authority

| Actor | Produces | Consumed by | Must not do |
| --- | --- | --- | --- |
| Controller | existing single state root, packages, acceptance verdicts, artifact manifest, Test card | all product windows/Test | implement product code, treat Design prose/target backfill as acceptance, claim/deliver twice or create another root |
| AlembicCore | existing PC foundation/readiness; canonical facts and projection-receipt contracts; dimension-free fact/population/cluster schemas; Plan compiler; gates/coverage/persistence/vector/publication primitives | Agent/Alembic/Plugin | know local root symbols, dispatch, select Test environment, create a second facts store or cognitive agent |
| Plan LLM (Agent runtime) | investigation questions, knowledge lenses, priority, strategy, expected evidence/counterevidence and typed uncertainty | deterministic compiler | decide source universe/caps/final cells, invent modules, claim facts are complete |
| Analyst LLM (Agent runtime) | active controlled queries, occurrence comparisons, mechanism hypotheses, variants/outliers/negative contrasts and bounded expansion requests | clustering/induction/Producer | read mutable source, turn Top-N into population, persist or self-close coverage |
| Producer LLM (Agent runtime) | canonical 0/1/N Recipe expression sets, usageGuide/retrievalProfile/negative intent | G1→admission→expression-disposition review or G2; set conservation | explore new facts, strengthen evidence, persist or self-review |
| Independent reviewer | `ValueGateDecision`/`InvestigatedEmptyDecision` and semantic `KnowledgeDispositionReviewV1` after deterministic citation and calibration checks | strict orchestrator | share the producing invocation, invent facts or pass an uncalibrated advisory verdict |
| Alembic | main entry preparation/execution, exact reset, one capture, deterministic fact-query execution, strict finalizer, working root/tool-neutral serving snapshot admission/CAS/recovery | Plugin/controller | use broad fullReset, reuse pre-reset facts, let missing backend fall through to LLM, call/copy Plugin MCP handlers or report fire-and-forget completion |
| AlembicPlugin | host prepare/confirm/execute handshake, one-route public resolver, public five-tool execution and versioned serving-contract compatibility evidence | developer/Test/controller | make Graph consume Recipes, read run-private candidate, expose candidate path/context, own Main journal/manifest/CAS |
| Dashboard | optional read-only receipt display | human | create alternate state/decision/control surface |
| Test | accepted-artifact real scenarios, hidden-bug evidence and reruns | controller | build/install/fix product, dispatch owner directly, accept requirement |

Controller partition and producer order use the **one existing demand and state root created by the completed one-time explicit claim**:

1. `I0` 已完成：当前唯一 root 在 controller revision 154 为 `blocked`。不得再次 `wakeflow_deliver`、复制/新增 TODO、重复 claim，或创建额外 demand/state root。
2. 历史 I1–I8 package/review 只证明当时合同的阶段进展；进入真实 setup 后，I9 证据暴露 pre/post-quiesce observation 矛盾并暂停。不得把当前 26/26 focused tests、无补丁 checkout 或旧 acceptance 当作新合同通过。
3. 当前 NEXT 只允许 Alembic 在同一窗口修复两阶段 strict setup；controller 接受其 live-daemon、checkpoint、snapshot/reset、fresh-process restore 与普通 daemon regression 后，重建/核验 exact artifacts/manifest。其他仓仅在真实 shared contract 变化时才追加 NEXT，当前源码不要求。
4. Test 仍是最终阶段，但当前不创建 task/card/dispatch。只有全部修订后的非 Test target 已接受、exact artifacts/manifest 已重建核验、且用户再次明确开始并配合环境操作，才恢复 T6。一个 repository 同时最多一个 combined package。

Later same-demand packages may legitimately change package hashes, but must preserve or explicitly version/migrate the PC-F capability contract; final exact artifacts rerun the complete PC-F regression before Test. Design creates no demand/state root/package and performs no state transition.

## 4. Terms And Minimal Contracts

### 4.1 Existing code-native objects

- **ProjectContext facts**: Core nine-request envelopes plus the existing-but-not-yet-production-wired Foundation artifact are canonical；现有 `ProjectContextWorkflowFacts` 只作为 Main adapter/projection，不拥有 capture 或 durable truth。
- **Finding**: current `NormalizedFinding` is an `AnalysisArtifact` element with finding/evidence/importance fields; it is not independently versioned and is not necessarily ledger-bound. Strict mode extends the artifact metadata/projection so accepted finding/cluster/hypothesis lineage references immutable Evidence Ledger IDs.
- **Recipe candidate**: current `CreateRecipeItem` has no run/session binding. Strict mode binds its authored fingerprint and resulting Recipe ID through the proposed run journal/production-binding projection before submission to `RecipeProductionGateway`.
- **Recipe readiness**: existing `evaluateRecipeRetrievalReadiness()` plus this run's G1/G2/ref/coverage/index receipts.
- **Vector generation**: existing `RecipeVectorGenerationManifest`/route/store.
- **Sparse index**: request-local `FieldWeightedScorer` deterministically built from the selected DB; its verification is persisted as a receipt, not an index generation.

ProjectContext strict readiness has two planes, both derived in the single authoritative capture:

- **Inventory plane** is complete metadata for every eligible repo/package/module/file/path/language/owner plus include/exclude policy, counts and hashes. It is streamable/paged but never sampled by `maxFiles`, `seeds=6`, `details=3`, `files=8` or public ref/mount display limits.
- **Frozen source plane** gives every readable eligible inventory row a content-addressed `blobRef` whose bytes live in the confined immutable Foundation store. Current v1 detail selection writes chunks only for selected keys and its continuation is only an omitted-key marker; that is **not** a pageable frozen-source capability. Strict v2 must store every eligible blob (or an equivalent immutable source snapshot addressable by inventory blob hash) before readiness. Process restart plus live-file change/deletion must still return the original bytes; absence of a frozen blob fails PC-F and never falls back to live source.
- **Detail plane** is the bounded content/symbol/source-range presentation used by Plan and generation, entirely derived from the frozen source plane. Every omission is explicit, every page has a resolvable continuation, and every accepted ref has a content-addressed full-chunk route. A payload display limit or omitted-key hash is not evidence of inventory completeness or a resolver.

`ProjectScopeManifestV1` is a proposed Core-owned pre-capture scope receipt. A Core builder consumes the controller-accepted project-mode scope declaration, confined source-root ports and accepted project identity; it emits the canonical expected repo/package tuples and scope hash **independently of capture output**. `capture.repositories` and readiness expectations are derived from this receipt and cannot be supplied as two caller-controlled lists. MR acceptance binds exact five repositories; SP binds the root plus four confirmed Packages. Removing, adding or aliasing a repo fails against the independently accepted scope receipt even if a caller also changes `expectedRepoIds`.

`ProjectContextRequestOutcomeV2` replaces the v1 strict-readiness assumption of exactly one row per `repoId+kind`. Its stable row ID hashes `{repoId,kind,selectorHash,canonicalScopeHash,languageOrNone,parserFamilyOrNone,ownerSurfaceIdOrNone}`; its request-envelope index, canonical sorting and readiness conservation use that exact identity. `canonicalScopeHash` preserves the semantic request scope (`repoId`, source-folder/file/active-file/anchor/range fields where applicable) after replacing the absolute project root with the accepted root/scope symbol, normalizing confined relative paths/ranges and rejecting aliases/escape. Parser-dependent request kinds retain all applicable language/parser/surface rows. Deleting, duplicating or swapping selector/language/**scope** metadata changes conservation and fails. V1 one-row indexes may remain for compatibility but cannot prove strict multi-language or multi-scope readiness.

`SourceRevisionVectorV1` is the one cross-host revision contract produced by a Core helper and consumed by Alembic and Plugin. Each canonically sorted entry contains `{scopeId, repoId, relativeRoot, revision, eligibleInventoryHash, includeExcludePolicyHash}` and must reconcile with `ProjectScopeManifestV1`. `relativeRoot` is the slash-normalized, symlink-resolved path relative to the approved project source root (`.` for that root); absolute paths, `..` and aliases are rejected. `revision` is discriminated: a clean Git repo uses `{kind:"git-clean", commitId, treeId}`; a dirty Git repo uses `{kind:"git-dirty", commitId|null, treeId|null, workingTreeContentHash}`; a non-Git source uses `{kind:"content", workingTreeContentHash}`. `workingTreeContentHash` is SHA-256 of the canonical sorted eligible-file tuples `(relativePath, mode, blobSha256)` under the frozen include/exclude policy, so `dirty=true` alone can never identify a revision. Missing required fields fail PC-F. The vector hash is canonical JSON SHA-256; equality requires the same repo set and exact equality of every field. This is the precise `repoId+relativeRoot+revision` tuple. Plugin's existing `factFingerprint` remains a request-cache/continuation identity and is never compared as if it were this vector.

### 4.2 Receipt-only terms

- **contentReady(recipeId)**: G1 pass, authoritative G2 pass, admission pass, `PersistenceReceipt` authored fingerprint equals reviewed fingerprint, and a separate `RefReconciliationReceipt` proves canonical refs resolved. Every contributing row binds the same non-invalidated `analysisFixpointHash` and `privateCorpusRevision`; it is not a lifecycle.
- **servingReady(recipeId)**: contentReady plus `Lifecycle.ACTIVE`, no incompatible staging-only fields, existing retrieval readiness, final ref integrity, inclusion in serving DB/files, sparse/vector membership and public schema compatibility. It is not a new lifecycle value.
- **DimensionCatalogSnapshot / CoveragePlanPolicy / PlanSelectionReceipt**: named logical sections embedded in run evidence; implementations may share one Core contract file and one canonicalizer. They are not parallel services.
- **ValueGateDecision / InvestigatedEmptyDecision**: immutable reviewer/scan receipts derived from productionized existing judge logic. They are not Recipe entities.
- **AdmissionReceipt**: immutable output of Gateway dedup/similarity/consolidation over a normalized candidate; it binds the admitted authored fingerprint before G2 and does not persist a Recipe.
- **PersistenceReceipt**: binds AdmissionReceipt + G1/G2 decisions to the created Recipe ID, canonical authored fingerprint, storage hash and durable DB/file state; it does not claim ref reconciliation.
- **RefReconciliationReceipt**: separately binds the persisted Recipe/storage hash to canonical `sourceRefs`/`reasoning.sources`/retrieval provenance/bridge-row conservation and zero ref blockers.
- **RecipeCandidateFingerprintProjection**: authored content, retrieval profile, usage/negative intent, scope/module/dimension, canonical refs and lineage only. UUID, timestamps, lifecycle, quality/confidence and other storage-generated fields are excluded. `storageHash` separately covers the stored representation.
- **publicSessionPointer**: requirement name for one new strict `PublicKnowledgeRoute`; no other component pointer is public authority.
- **ObservedPreResetPublicationModeReceipt**: destructive-rebuild-only recovery authority that records the actually loaded pre-reset reader mode (`legacy|strict`), resolver artifact/config/enrollment hashes, dedicated publication-marker state/hash, public/vector route observations and a bounded read-only baseline probe. It never supplies the final CAS expected value or post-blank Plan facts.
- **ObservedPreQuiesceRootReceiptV1**: authority-time whole-root observation for authorized rebuild. It binds target/root identity, `rootTreeHash`, observed publication/pointer/data/config facts and observation time to the external authority. It is used only for authorization, drift detection, snapshot-restore provenance and proving what a recovery must re-establish; because legitimate shutdown mutates control/SQLite state, it is never the expected post-quiesce hash or snapshot source hash.
- **StrictSetupAuthorityReceiptV2 / StrictRunJournalHeaderV2**: versioned replacement for the current V1 equality semantics. Authority binds the reset/restore/path plan, `observedPreQuiesceReceiptHash`, root identity, accepted artifact/config, quiesce-policy and volatile-control-policy hashes. After acquiring the existing external root-identity lease, the header binds those hashes plus lease receipt/identity and is written, read back and fsynced **before any target-root change, including quiesce**. `planHash`/manifest hash remain absent until their later bind records. The authoritative journal lives under the demand-owned external evidence/operation-state root, never inside target or snapshot.
- **StrictQuiesceRequestV1 / StrictQuiesceAcceptedAckV1**: narrow hashes-only control message on the existing daemon HTTP/token/shutdown boundary. Request binds run/authority/header/root-identity/request hash; it contains no path or credential. The current daemon validates token and exact identity, returns the same accepted ack for the same request, conflicts on another request, then invokes its existing shutdown coordinator. It is not a second daemon-control service.
- **QuiescedPreResetObservationReceiptV1**: immutable post-quiesce snapshot authority. It binds run/authority/header/external-lease/root-identity hashes; scenario and `targetState=stable|absent`; pre-quiesce observation hash; accepted quiesce request/ack or typed `not-running|pristine-absent`; exact post-quiesce whole-root `rootTreeHash` (`null` only for a proven pristine absent target); checkpoint verification over the exact SQLite identity/integrity/WAL/SHM terminal state; protected config/reader/marker/public-route hashes; exact minimal volatile delta; canonical receipt hash. Snapshot source bytes and restore verification must match this receipt, never the pre-quiesce tree hash.
- **ProjectContextConsumerLineageReceiptV2**: proposed immutable **post-open** aggregate for the five strict artifact consumers only (`plan|recipe-generation|dimension-completion|dependency-graph|module-coverage`). It references, but never rewrites/re-hashes, the already sealed Foundation base `certificationBindingHash`. Each applicable row names the **real production** code entrypoint, shared `artifactId`/`sourceVectorHash`, that consumer's own `projectionContentHash`, selector/scope, session persist/reload result, direct-call/raw-fallback/synthetic-fact counters and verdict. Incremental/rescan/legacy entry rows must be applicable or typed N/A with reachability evidence. Audit-script self-reopen/placeholder projections cannot satisfy these rows.
- **ProjectContextConsumerProjectionReceiptV2**: proposed strict-v2 receipt emitted by the **actual loaded consumer adapter**, not by the audit script or capture caller. It binds `{artifactId,sourceVectorHash,factsContentHash,consumer,adapterVersion,projectionContentHash,entrypoint,runId}` and the payload schema/load evidence. Core v1 `artifact.projections` may remain for compatibility but cannot pass PC-F unless its producer is the same accepted adapter and its payload hash matches this receipt; placeholder projections are never production truth.
- **ProjectContextLiveProbeReceipt**: a separate proposed matrix for Recipe-free `live-graph|region`. Each row records `comparedArtifactId`, certified/observed source-vector hashes, canonical build scope, `terminalSemanticOutputHash`, selector/scope and diagnostic cache provenance (`factFingerprint`, `factSessionRef`). The semantic hash projects only canonical repo/package/module/edge/source identities, statuses and typed errors; it excludes `factSessionRef`, continuation cursor/resultRef, transient refs, generation time, absolute host paths and other presentation/transport fields. Both diagnostic values are process/cache identities: fingerprint may change on mtime-only touch and session ref may change across TTL/process. Cross-call/process equality uses canonical scope + exact source vector + semantic output hash, never fingerprint/session ref. The receipt never calls the probe an artifact consumer or places its live-call count in strict-consumer counters.
- **PlanCognitionReceiptV1**: requirement name for an immutable strict projection of the existing `PlanIntent`/`PlanNextAction`, not a parallel Plan model. It binds certified facts/catalog/tool-capability hashes and contains `PlanInvestigationDecompositionV1` plus `PlanBudgetStrategyV1`: question→subquestion DAG, anatomy-lens IDs, canonical subjects/scales, approved capability/query IDs, dependency/priority, expected support/counterevidence, synthesis target, uncertainty, stop/escalate; and within-hard-cap initial breadth/expansion reserve/counterquery reserve/starvation guard. It may reference only known subjects/modules/fact/query families, cannot execute live tools during Plan, set Recipe counts, raise caps, exclude scope or declare completeness.
- **AnatomyLensCatalogSnapshot / RequiredFactApplicabilityUniverseV1**: one logical baseline section computed from certified inventory, accepted 26-dimension catalog/policy and loaded backend capabilities **before** Plan cognition. It enumerates the ten mandatory project-anatomy views in §10.3 and, per eligible scope, records `required|typed-excluded|unsupported-blocked` with analysis scales, fact/query families and evidence. This is not a 27th dimension, second registry or service. Required obligations cannot be deleted, starved, demoted to optional or converted to N/A by an LLM.
- **CodeFactGenerationManifestV1 / FactRecordV1**: proposed logical projection derived from the accepted Foundation artifact and exact `SourceRevisionVectorV1`. The manifest freezes backend/parser/schema/canonicalizer, eligible canonical subjects/analysis scales, fact families and every unit terminal state. A direct fact reuses accepted `ProjectContextRef.id` where available and is revision-bound by `{sourceVectorHash,backendVersion,factFamily,canonicalSubjectRef,occurrenceAnchor,normalizedPayload}`; relation facts reference existing source/target/ref identities and keep unresolved endpoints typed. The same direct occurrence keeps one `factId` across lenses/scales. A higher-scale aggregate is a distinct derived fact only when its witness names lower-scale premise IDs. No fact identity contains `cellId`, `dimensionId`, Plan/query order or LLM pass.
- **FactQuerySpecV1 / FactQueryPackManifestV1**: proposed versioned query/miner contract over existing Tree-sitter/ProjectContext/config/source-graph/Evidence Ledger substrates. A query freezes `queryId/version/queryHash/backend`, fact/cluster family, authority requirement, analysis-unit denominator, positive/negative/edge fixtures, normalized result order and timeout/truncation/N/A semantics. “Selector” may remain an implementation alias, but is a tool available to Plan/Analyst, not the cognitive authority.
- **MiningWorkScheduleV1**: proposed baseline two-part projection. `factHarvestObligations` are keyed by accepted backend/query plus canonical subject/scale and cover each direct occurrence or derived rule once, independent of dimensions. `lensBindings` map each coverage cell to reusable anatomy lens, fact/cluster family and question IDs plus applicability reason/evidence. It is the union of the non-removable required applicability universe and accepted Plan additions; the compiler conserves both sets and must not expand `cell×query×unit` or duplicate the same parse/fact for every lens.
- **ExplorationExpansionLedgerV1 / FinalExpandedMiningScheduleReceiptV1**: proposed append-only run-journal projections for every post-baseline Analyst query, with `purpose=exploration|counterexample`. Before execution, each request receives a deterministic obligation ID, parent schedule hash, schedule revision and canonical reason; duplicates link to the existing obligation/terminal receipt, rejects remain evidence, and accepted unique work creates the next schedule-revision hash. The final receipt seals the canonical union of baseline obligations plus accepted exploratory and counterquery obligations, the ledger head, final population hashes and `finalExpandedScheduleHash`. It does not mutate `ColdStartRunManifest` or the baseline Plan receipt.
- **FactQueryExecutionReceiptV1**: one immutable runtime result per harvest/query obligation with terminal `matched|inspected-no-pattern|failed|unknown`, inspected denominator, facts/evidence, output hash, continuation/omission/error and backend/query hashes. Its embedded witness is either a direct frozen source anchor or `DerivedFactWitnessV1={outputFactId,derivationKind,queryOrRuleId/version/hash,orderedPremiseFactIds,evidenceRefs,scopeAndDenominator,backendIdentity}`. Negative/absence outputs additionally bind searched-universe hash, terminal unit receipts and zero omissions. This is a compact premise DAG in the strict journal/evidence bundle, not a proof engine. A zero result without complete denominator is `unknown`; error, timeout, truncation or Top-N are never coerced to empty.
- **ObservationPopulationV1 / MultiScaleNormalization**: proposed authoritative population for a normalized fact/query family. It records stable occurrence IDs at their finest provable scale, canonical subject/parent refs across `source-range|symbol|file|module|package|repository|project`, full denominator, accepted/duplicate/excluded/error conservation, typed reasons, variants, outliers, negative controls and continuation/full-chunk refs. `supportOccurrenceCount` and distinct subject counts per scale remain separate; parent aggregates reference premise facts instead of copying them. Accepted expansion appends a parent-linked population revision; presentation Top-N is a separate view and cannot alter any revision/hash.
- **KnowledgeClusterV1**: proposed mechanism-level grouping stored in the extended `AnalysisArtifact`, proposed strict journal or evidence bundle, while referencing immutable Evidence Ledger IDs. Deterministic similarity/co-change algorithms may only emit candidate adjacency/pre-groups; the Analyst LLM proposes final membership, mechanism, merge/split and scope, then independent review applies where required. The cluster records member observations, mechanism/invariant signature, variants/exceptions/outliers/negative contrasts, multi-scale distribution, contributing fact/query families, applicable anatomy lens IDs, prompt/model/version and stable identity. Same mechanism may serve several lenses; different mechanisms cannot merge merely by text similarity; a singleton stays a bounded fact.
- **ExplorationExpansionRequestV1**: Analyst LLM may request additional fact/query obligations only inside the frozen source universe, accepted backend/fact-family allowlist and remaining upper bounds. It carries `purpose=exploration|counterexample`; the compiler validates/deduplicates it and records accepted/rejected reasons before any query runs. It cannot add repos, change cells, defer scope or raise budgets.
- **InductionReceiptV1 / PatternHypothesisV1 / FalsificationReceiptV1**: cluster→0/1/N hypotheses plus many→one, one→N and zero-output reasons; each hypothesis states bounded claim/scope/support and a deterministic `counterqueryApplicability=required|not-required|unsupported-blocked` decision from claim kind/authority/scope. Required queries become enrolled `ExplorationExpansionRequestV1(purpose=counterexample)` with obligation/schedule lineage before execution. `not-required` is limited to exact bounded syntax/config/contract claims whose accepted model and exclusions fully close scope; recurring/rule/protocol/architecture/cross-cutting claims require claim-specific negative/violation/alternate-path work. Falsification binds terminal receipts and records frozen search universe, counterexamples and `survived|narrowed|refuted|unknown`; missing required semantic capability is blocked/unknown, never N/A.
- **KnowledgeDispositionReviewV1**: proposed use of the same independent reviewer infrastructure to adjudicate every **semantic** observation discard, Analyst counterevidence interpretation/semantic merge/split/zero-hypothesis decision and every Producer expression merge, duplicate suppression or zero-output/non-drafting disposition (`irrelevant|generic|duplicate|no-value|refuted|insufficient-evidence`) against the full cluster/population/falsification evidence. Only an exact duplicate with mechanical identity or a frozen policy exclusion may be discarded without semantic review; read/parse/query errors stay failed/unknown, never discarded. A Producer duplicate/suppression proposal must carry a reviewable normalized expression fingerprint so non-persisting admission can prove the match before expression-disposition review. Review applies even when another Recipe already covers the cell; Producer/Analyst cannot hide a valuable singleton/cluster behind a cell-level pass. This is a receipt on the existing lineage, not another review service.
- **AnalysisFixpointReceiptV1**: proposed final seal after iterative query/expansion→population revision→cluster→induction→counterquery/falsification epochs. It binds the final expanded schedule, final populations, unique Analyst dispositions, independent reviews of Analyst zero-hypothesis/suppression decisions and the assertion that no accepted expansion or unresolved cluster/hypothesis remains. It unlocks Producer; Producer's later expression-level merge/duplicate/non-drafting reviews close separately before content/coverage.
- **DraftProposal / AcceptedRecipeDraft / HypothesisDisposition**: Producer maps accepted induction/hypotheses to 0..N temporary **Recipe expression** proposals with typed draft/merge/duplicate reasons and retrieval/usage/negative-intent. If Recipe-expression cardinality is zero, Producer must emit one separate `HypothesisDisposition(non-draft)` row; that row does not turn 0 into 1 Recipe expression. G1/admission/authoritative G2 turn only a matching draft pass into AcceptedRecipeDraft, then existing `CreateRecipeItem`. Producer has no fact-query, persistence or review authority; after G1 and non-persisting admission, every non-drafting/merge/duplicate disposition must obtain a passing `KnowledgeDispositionReviewV1` before it receives a terminal reviewed fate or closes an expression set.
- **HypothesisExpressionSetReceiptV1**: proposed immutable strict-journal projection that conserves every final-fixpoint `survived|narrowed` hypothesis across all Producer attempt/repair versions. Each version has a canonically ordered 0..N Recipe-expression set; **that version** has exactly one mandatory non-draft disposition row iff N=0. The receipt binds `analysisFixpointHash`, `privateCorpusRevision`, hypothesis and set hashes; every expression/disposition row has stable ID/fingerprint/version/parent, source hypothesis IDs, rationale and terminal fate. Expression fates are `content-ready|reviewed-merge|reviewed-duplicate|g1-rejected|admission-rejected|g2-rejected|repair-superseded|failed|unknown`; zero-disposition fates are `reviewed-non-draft|rejected|repair-superseded|failed|unknown`. Historical rejected/revised/superseded rows remain evidence even if the terminal head changes from zero to nonzero or vice versa. The terminal head closes only as `expressed(contentReadyRecipeIds≥1)`, `represented-by(targetExpressionId,targetContentReadyRecipeId)` after a reviewed merge/duplicate whose Admission fingerprint matches that target, or `reviewed-non-draft`; `failed|unknown|unresolved` blocks G3. A merge/duplicate label without a final content-ready representative never closes knowledge. This is a conservation receipt in the proposed Alembic journal/extended AnalysisArtifact, not a new service or Recipe table.
- **Fixpoint invalidation / PrivateCorpusRevisionHandleV1**: one transition/handle family in the same strict journal. It is not a new store implementation, schema predicate or service; each revision is a separately confined instance of the existing store stack. Every Producer expression/disposition, G1, Admission, disposition-review/G2, persistence, ref, content-ready and expression-set row binds `{analysisFixpointHash,privateCorpusRevision,revisionRootManifestHash}`. The handle identifies one confined, demand-owned physical child of the approved Ghost data root containing that revision's SQLite, Recipe/candidate files and ref/coverage working state; source ProjectContext/root remains unchanged. Before the handle becomes usable, `PrivateCorpusRevisionInitReceiptV1` proves supported resolver construction, accepted migration-bundle semantic hash, DB integrity/FK, project/scope identity, sanitized runtime-config reference and zero knowledge/ref/coverage/vector/publication state. A semantic return to Analyst appends `ANALYSIS_FIXPOINT_INVALIDATED`, closes the revision's repository handles, seals it read-only as evidence, marks every descendant evidence-only/ineligible, and—after a new fixpoint closes—allocates and initializes a physically absent fresh revision root before canonically replaying admission and downstream work for **all and only** final-fixpoint eligible hypotheses. The prior root cannot be opened by strict admission, dedup, coverage, assembly or public resolvers. This per-root isolation reuses the existing resolver/Repository/Gateway/KnowledgeService/WriteZone stack and avoids the larger alternative of adding a mandatory revision predicate to every table/query/file scan.
- **migrationLedgerSemanticHash**: deterministic projection used for fresh-root compatibility, computed from canonically sorted `{version,migrationArtifactSha256}` after joining the `schema_migrations.version` set to the accepted migration-bundle manifest. Version set and artifact hashes must match exactly and BiliDili must include 017. Raw rows remain evidence, but `applied_at`, row order and SQLite page/layout bytes are excluded because each supported migration run legitimately generates new timestamps. Pre-reset snapshot restore still compares its captured raw ledger/hash to the restored copy; that is a different same-bytes recovery assertion.

### 4.3 Recipe fact authority and claim strength

Every fact/query result and Recipe claim carries one or more authority classes:

- `syntax-exact`: parsed syntax/CST fact from an accepted grammar over a frozen blob;
- `semantic-resolved`: symbol/call/type/dependency/control/data relation resolved by an accepted backend over a declared model;
- `config-exact`: deterministic config/build/migration/test-manifest fact;
- `history-observed`: commit/edit/fix occurrence over a frozen history range;
- `runtime-observed`: trace/event observed in an accepted Test run and exact artifact/config;
- `heuristic`: name/text/similarity/model suggestion without exact semantic proof.

`heuristic` alone never satisfies G1. A single occurrence may support a bounded fact, explicit contract/invariant/failure mechanism or project-specific decision, and such a strictly scoped item may become a Recipe after G1/G2; it simply cannot claim recurrence. Only a claim labeled `recurring-pattern` requires at least two independent normalized occurrences in distinct frozen analysis units plus completed counterexample search over its declared scope. This is a claim-strength rule, not a Recipe count or “three files” floor. A `rule` additionally requires an explicit code/config contract or mechanism/invariant and complete counterquery execution over its declared scope; frequency alone cannot promote a pattern to a rule. `runtime-observed` cannot be generalized beyond the observed artifacts/config/scenario unless static proof or repeated accepted Test evidence supplies that stronger basis.

Counterquery applicability is deterministic and claim-specific:

| Claim kind | Required counterquery decision |
| --- | --- |
| bounded syntax/config/API declaration exact | `not-required` is allowed only with exact frozen scope, direct anchor, accepted parser/model and explicit boundary/exclusions; it is not a waiver for missing evidence |
| recurring pattern | `required`: complete occurrence denominator plus violation/negative/outlier search over declared scope |
| rule/invariant/lifecycle/error claim | `required`: contradiction, violation, boundary and cleanup/error-path queries |
| API/protocol/order claim | `required` when an accepted semantic/order backend exists: reverse, missing, alternate sequence and failure cleanup; otherwise `unsupported-blocked` |
| architecture/dependency/cross-cutting claim | `required`: alternate path, missing edge and other module/repository search; schema-declared but unproduced edges are unsupported |
| history/runtime observed | remains observed-scope even after counterquery; it cannot auto-promote to a current general rule |

The Analyst proposes the claim; a deterministic policy validates this applicability row from claim kind/authority/scope. The LLM cannot waive a required query, and the compiler cannot invent an explanatory query solely to make a hypothesis pass.

Every hypothesis/Recipe claim has exactly one epistemic status:

- `proven-within-model`: entailed under an explicit accepted syntax/semantic/config model and scope;
- `supported-and-counterexample-searched`: supported by accepted facts and survived a complete bounded counterquery;
- `observed-only`: true only for the exact observed history/runtime/sample;
- `refuted`: contradicted inside the declared universe;
- `unknown`: incomplete backend, scope, execution or evidence.

Only the first two statuses may become a generally retrievable Recipe, and their scope/negative intent must retain the model boundary. `observed-only` may remain evidence or become an explicitly scenario-bound diagnostic only if the existing Recipe schema can represent that limitation without misleading retrieval; otherwise it is rejected. In this demand's four initial cold-start runs, Test happens after product/controller acceptance and does not feed new runtime facts into the candidate corpus; Test runtime observations validate or falsify published claims and route defects back to the owner. `refuted|unknown` never closes coverage.

### 4.4 Canonical hashing

All manifest/receipt hashes use UTF-8 canonical JSON and SHA-256:

1. object keys sort lexicographically;
2. paths normalize separators, remove root-specific prefixes and reject `..`/symlink escape;
3. dimensions sort by registry ordinal, then ID;
4. modules sort by normalized canonical module ID/path;
5. cells sort by `(moduleId, dimensionId, criticality)`;
6. set-like arrays deduplicate and sort; order-significant evidence/ranges keep declared order;
7. timestamps, process IDs, absolute paths, credential values and random IDs are excluded from semantic hashes;
8. every hash carries a schema/canonicalizer version. Unknown version or unaccepted catalog/policy hash fails closed.

ProjectContext identity uses a non-circular strict-v2 order while retaining v1 compatibility:

1. canonicalize only source inventory/detail/request outcomes/legacy-entry audit/blob table and `SourceRevisionVectorV1`; compute `factsContentHash` and the canonical facts manifest;
2. compute the Foundation artifact identity from that manifest. The accepted schema version may retain the existing `cpf-v1` prefix during migration, but strict evidence names the exact schema/canonicalizer; caller-supplied projections are not allowed to change whether source facts are equal;
3. seal and read back the base `CertifiedProjectFactsCertificationReceiptV2`/`certificationBindingHash` at `store.put`; it covers only artifact/facts/vector/scope/capability/parser/runtime/config/readiness and is immutable thereafter;
4. create preparation, bind the Foundation lease and reopen the accepted artifact;
5. each actual loaded consumer adapter derives its own projection and computes `projectionContentHash` over a payload that excludes artifact/vector IDs, receipt/lease, timestamps, host paths and random IDs, then emits `ProjectContextConsumerProjectionReceiptV2`;
6. seal `ProjectContextConsumerLineageReceiptV2` by attaching the five projection receipts, common artifact/facts/vector IDs, adapter versions/real entrypoints and unchanged base certification hash. Audit placeholders cannot satisfy a row and lineage never hashes back into the base artifact;
7. if compatibility v1 still stores projection hashes inside its artifact manifest, strict migration additionally proves that each accepted adapter payload exactly matches the stored hash. A mismatch fails; v1 artifact equality alone never proves consumer wiring.

`preparationId` is only an opaque resolver/lease key and is never an identity/equality key. Hashing lineage back into projection/facts or allowing an audit placeholder to stand in for an entrypoint is schema-invalid.

ProjectContext uses two further non-interchangeable hashes: `factsContentHash` covers canonical project facts only, while `certificationBindingHash` covers `artifactId`, `factsContentHash`, source revision, scope identity, capability/parser version, accepted runtime/config hashes and readiness verdict. Artifact/config drift may leave content equal but always invalidates the binding and its lease. The five strict consumers share these values and artifact/vector identity; live Graph/region record only the separate comparison fields above.

## 5. Problem Baseline — Evidence, Never Pass

| Surface | Verified current fact | Required conclusion |
| --- | --- | --- |
| Alembic DB | 98 Recipes = active73/staging20/deprecated5; 261 refs; 93 Recipes with refs; 134 paths; 126 cells all thin/covered0; 2/98 profile+usage | current corpus is not production-ready |
| BiliDili DB | 75 = active71/staging4; 337 refs/215 paths; 60 drifted refs affect 30 active; coverage 22 covered/64 partial/125 thin; migration 017 missing; scope IDs null | rebuild must prove migration/identity/ref repair, not preserve bad state |
| Search | only excludes deprecated and has returned staging/unready; “coverage” query recalled generic test coverage | serving filter/intent correctness unproved |
| Map | 98 candidates = 15 mounts + 83 deferred was called complete; script nodes polluted repo | accounting is not project coverage |
| Graph | historical real run discovered 5 repos but traversed 1/5; current source now has 5/5 fixtures | reproduce accepted artifact before deciding code repair |
| Current loaded Graph | progress/terminal views can be confused; latest live probe remains partial/degraded with suppressed errors and has shown duplicate scoped paths even when repoCoverage says 5/5 | repo-only success is not request/parser/fact completeness; accept only terminal build + full request matrix |
| Current loaded Map | `partial`; mount accounting reports 98=15+83 as `complete`; continuation can present zero base nodes; package scripts are projected as repo nodes | split mount accounting from project coverage, make paging cumulative/typed and remove script-as-repo |
| Historical Foundation evidence | controller first accepted Core lineage through `cb517460d9c1f9d7853b51bd914062cd5ba3a116`; later same-demand packages advanced through I8 | preserve as provenance, not current blocker conclusion; rebuilt revision-154 artifacts still rerun the complete final PC-F regression |
| Plan/generation facts | Main Plan gate captures workflow facts and separately collects Core Plan facts; Plan sees one projection while generation receives another | cannot prove same base or source fence; migrate before Plan feature work |
| Prime | real call schema mismatch/fail | public consumability unproved |
| Tests | historical five-tool 6 pass/2 fail/6 not-run; MR plan repeatability failed; Core86/Agent32/Alembic39 local passes; Plugin 17 group order failure/isolated pass | local counts cannot close production loop |
| Finalization | refs/vector nonblocking; maintain without active only planned; completed_with_errors may be completed | strict awaited finalizer is missing |
| Persistence | old file may be deleted before replacement; lifecycle move result ignored; UoW unused | file/DB correctness is not established |

## 6. State Machine And Non-Circular Invariants

The strict journal is append-only and its revision numbers are monotonic; the logical ANALYSIS/CONTENT stages may repeat only through the explicit revisioned invalidation loop below. No strict run can start until global `PC_F_ACCEPTED`. The successful run-level spine is:

`PC_F_ACCEPTED → AUTHORIZED → EXTERNAL_LEASE_HELD → JOURNAL_HEADER_DURABLE → QUIESCE_REQUESTED → QUIESCE_ACCEPTED|QUIESCE_NOT_RUNNING → QUIESCED_OBSERVED|PRISTINE_ABSENT_OBSERVED → SNAPSHOT_VERIFIED|PRISTINE_ABSENT → BLANK → PROJECT_FACTS_READY → REQUIRED_FACT_UNIVERSE_READY → PLAN_COGNITION_ACCEPTED → PLAN_COMPILED → BASELINE_FACT_SCHEDULE_FROZEN → CODE_FACTS_READY → BASELINE_POPULATIONS_READY → ANALYSIS_EPOCHS_OPEN → ANALYSIS_FIXPOINT_CLOSED → EXPRESSION_BATCH_OPEN → HYPOTHESIS_EXPRESSION_SETS_CLOSED → CONTENT_READY_CORPUS_SEALED → CANDIDATE_COVERAGE_CLOSED → CANDIDATE_ASSEMBLED → INDEXES_BUILT → CANDIDATE_DATA_SEALED → G4_READY → SERVING_RECONCILED → FINAL_COVERAGE_BOUND → SERVING_SNAPSHOT_VALIDATED → SERVING_MANIFEST_READY → PUBLIC_CAS_COMMITTED → FINALIZED`.

The only semantic backward-looking route advances immutable revisions rather than mutating an earlier state:

`ANALYSIS_EPOCHS_OPEN(r) → ANALYSIS_FIXPOINT_CLOSED(r) → EXPRESSION_BATCH_OPEN(r) → ANALYSIS_FIXPOINT_INVALIDATED(r) → ANALYSIS_EPOCHS_OPEN(r+1)`.

After `ANALYSIS_FIXPOINT_CLOSED(r+1)`, the runner proves the next confined revision leaf physically absent, creates it, runs the accepted database/schema/identity initialization, seals `PrivateCorpusRevisionInitReceiptV1`, then creates `PrivateCorpusRevisionHandleV1` and opens the existing repository stack only on that root. Replay cannot begin on an uninitialized directory or mismatched migration ledger. The journal never reopens or overwrites revision `r`; every old descendant is terminal evidence-only. The loop remains bounded by the shared causal semantic-repair depth≤2, and the successful spine may advance to expression-set closure only from the latest non-invalidated revision.

There is exactly one authoritative strict journal and one existing external root-identity operation lease. After `PreResetAuthorizationManifest`/`StrictSetupAuthorityReceiptV2` is sealed, Alembic acquires that lease and writes/readbacks/fsyncs `StrictRunJournalHeaderV2` under the external demand-owned evidence/operation-state root **before quiesce or any other target-root mutation**. Only then may the strict child request graceful quiesce from the currently running daemon and append request/ack/post-quiesce receipts. Snapshot, restore-probe, reset, blank-state and facts receipts follow. After Plan acceptance it appends `PLAN_ACCEPTED`; `ColdStartRunManifest` references the header and that head, then one `MANIFEST_BOUND` append binds `{planHash,manifestHash}`. Neither journal ID nor Plan binding may be replaced afterward. Files under target/snapshot may contain only hash-linked projections, never the recovery authority.

`EXPRESSION_BATCH_OPEN` is not a set of global barriers. It executes the canonically ordered **expression-or-disposition row** list through a nested serial substate loop:

`PROPOSED → G1_PASSED → ADMITTED → (EXPRESSION_DISPOSITION_PASSED → DISPOSED | G2_PASSED → PERSIST_PREPARED → PRIVATELY_PERSISTED → REFS_RECONCILED → CONTENT_READY) → CONSUMED`.

Reject/revise/failure substates retain their terminal row and repair edge. An accepted draft is durable and `CONSUMED` before the next expression-or-disposition row reaches admission, so the next dedup check sees the actual accepted private corpus. Only after every row across every Producer version is terminal and every hypothesis expression set closes may the run leave `EXPRESSION_BATCH_OPEN`; only then is the aggregate content-ready corpus sealed.

The serial loop is scoped to one immutable `analysisFixpointHash` and one monotonically allocated `privateCorpusRevision`. A mechanism/novelty/evidence defect that returns to Analyst does not resume at the offending row: the journal first appends `ANALYSIS_FIXPOINT_INVALIDATED`, invalidates the old fixpoint seal and every descendant expression/admission/review/persistence/ref/content-ready/set receipt, closes its SQLite/file/repository handles, and prevents that root from participating in any later corpus read. After the replacement fixpoint closes, the runner creates a physically separate empty revision root and replays the complete canonical final-fixpoint Producer-eligible set from its first row. Old private files/rows remain only in the sealed unpointed evidence root until scenario cleanup; they are not deleted in place, copied forward or consulted for dedup. G3 is unreachable until every row in the replacement revision is re-admitted/reconciled and the revision root plus logical receipt are sealed. This is the smallest safe replay rule; mandatory per-row revision filtering and incremental reuse are outside this demand.

Any error enters a typed failed/blocked state; it never skips forward.

Every non-pass transition is one logical `TypedGateReturnV1` stored in the existing/proposed phase result and strict journal, not a new gate service: `{gateId,subjectId,verdict,reasonCode,inputReceiptHashes,outputReceiptHashes,ownerStage,repairTarget,permittedMutation,attempt,lineageRootIds,semanticRepairDepth,invalidatedSeal,resumeState}`. Repair-lineage fields are absent for non-semantic deterministic faults. Existing `PipelineStrategy` open action strings/`skipOnFail` are insufficient for strict mode. Exactly one owner and re-entry point are required:

| Failure class | Owner / permitted mutation | Resume point |
| --- | --- | --- |
| PC-F fact/artifact/consumer/live-probe defect | Core, Alembic or Plugin PC-F owner; only the failed producer/adapter/probe contract | failed PC-F subphase; I3 remains blocked |
| Plan decomposition/tool/ref/within-cap allocation defect | Plan LLM, ≤2 semantic repairs; facts/hard caps immutable | Plan cognition validation then compile |
| missing backend/config/capability or hard-cap insufficiency | owning product/config/controller; Plan cannot invent backend or shrink scope | capability/config acceptance, then Plan/fact schedule |
| fact/query/denominator/witness failure | owning fact backend/orchestrator; no hypothesis wording repair | failed obligation and affected population; Analyst/Producer blocked |
| cluster/claim/counterevidence interpretation defect | Analyst; only open epoch semantics | current analysis epoch; sealed fixpoint invalidated if already closed |
| Recipe expression/usage/retrieval wording defect | Producer, ≤2 shared semantic repairs; facts/hypothesis immutable | expression G1/admission/review |
| G2 mechanism/novelty failure rooted in hypothesis | Analyst, not Producer paraphrase | new immutable analysis-fixpoint attempt |
| persistence/ref/index/publication/CAS failure | deterministic owning product + journal compensation/resume; no LLM call | exact failed durable substate |
| Test hidden bug | controller assigns owning repository; accepted artifacts rebuilt | controller reacceptance then affected Test row |

A generic `retry previous stage`, `skipOnFail`, `degrade`, `completed_with_errors` or repair-count reset after a new fingerprint is forbidden in strict mode.

Hard invariants:

1. ProjectContext deep audit, repair of every confirmed defect and global foundation acceptance precede every I3+ production Plan/Recipe implementation package. A Core substrate checkpoint is not global PC-F; projection authority, real consumers and Graph/Map facts must also close.
2. Per run, external authority/lease/header durability precedes graceful quiesce; immutable post-quiesce observation precedes snapshot/reset; blank state precedes authoritative ProjectContext capture; capture precedes Plan. A pre-quiesce root hash can never satisfy a post-quiesce equality or snapshot-source assertion.
3. certified facts → deterministic required fact/lens applicability baseline → Plan LLM cognition → deterministic compile/baseline schedule → dimension-free fact harvest → iterative Analyst epochs (`query/enrolled accepted expansion → population revision → mechanism cluster → induction → enrolled counterquery/falsification → independent semantic-disposition review`) → immutable analysis fixpoint/final expanded schedule → Producer 0/1/N expression proposals → G1/normalization → non-persisting admission/dedup → independent expression-disposition review for merge/duplicate/non-draft branches → independent G2 for surviving drafts → private durable write/ref reconciliation → content-ready corpus → immutable hypothesis→expression terminal-set closure → lens/cell G3 → assembly/sparse/vector/seal → G4 → serving reconciliation → immutable `FinalCoverageBindingReceipt` → tool-neutral `ServingSnapshotValidationReceipt` → serving manifest → public CAS. 正式五工具不在该生产者状态机内运行。
4. G3 binds content-ready IDs and never depends on final public search; G4 never uses already-public results to prove its own prerequisites.
5. Graph is live-source and Recipe-free. Its acceptance compares the shared source revision vector/inventory while retaining its own request fingerprint; Recipe mounts are never its gate.
6. The public route CAS is the only switch that exposes a **new** knowledge session and occurs last. Destructive reset intentionally makes the old session unavailable; internal DB/vector state may exist earlier but strict readers cannot reach it.
7. All four true-empty scenarios have activation expected public route = null.
8. `completed_with_errors`, not-run, partial, exhausted, failed, unknown or deferred cannot be finalized.

Phase labels are deliberately disjoint:

| Namespace | Meaning | Crosswalk |
| --- | --- | --- |
| `F0` | once-per-artifact ProjectContext foundation before implementation Plan work | implementation wave `I2`; controller gate `PC-F` |
| `R0`…`R7` | per-scenario runtime protocol below | authorization/reset through final public CAS |
| `I0`…`I10` | controller implementation/acceptance order in Original Plan | single-demand sequential package/acceptance order, not runtime state |
| `T0`…`T7` | Test-only scenario stages after product acceptance | Test Environment Spec |

Executable stage summary:

| Stage | Required input | Producer → output/state | Consumer | Primary code landing | Acceptance/failure |
| --- | --- | --- | --- | --- | --- |
| F0 | accepted artifacts + source revisions | Core/Alembic/Plugin → accepted PC capability/artifact contract + complete entry inventory + strict-consumer/live-probe receipts | controller PC-F verdict | Core ProjectContext/raw-plan services; Main workflow/session/AI/module/incremental paths; Plugin PC/session/rescan/Graph/dimension/module paths | PC-F; any unclassified entry, incomplete/hidden-truncated fact or lineage drift keeps every I3+ package blocked |
| R0 | authorization or physical absence | Alembic → external authority/lease/header, run-bound daemon quiesce ack, post-quiesce whole-root/checkpoint receipt, snapshot/restore/reset/blank receipts | R1 | `StrictExternalSetupRecovery.ts`; `DaemonSupervisor.ts`; `daemon-server.ts`; daemon route; `Bootstrap.ts`; exact-reset module/migrations/identity/publication marker | QUIESCE/RESET; ready short-circuit, pre-kill, missing ack/checkpoint, unknown volatile delta, snapshot-hash mismatch or non-idempotent recovery blocks and restores/discards by scenario |
| R1 | BlankStateReceipt + accepted F0 | one Core producer via host → certified facts artifact/lease | R2 and live Graph comparison | Core ProjectContext artifact/store; Main/Plugin host adapters | PC-RUN; no fallback collection |
| R2 | certified facts + registry + accepted query/miner capabilities + frozen config | Core policy → anatomy/applicability universe; Plan LLM extends existing PlanIntent with question DAG/tool choice/priority/within-cap budget strategy; Core compiler → cells/lens bindings/baseline dimension-free harvest schedule/execution projection/run manifest | R3/Alembic/Agent/Plugin | existing PlanIntent/PlanNextAction/PlanAgentRun refactor + Core compiler; Main/Plugin gates | PLAN; LLM cannot delete required baseline; invalid refs/tool IDs, incomplete decomposition, starvation, catalog/cap drift, stale receipt or silent truncation fail closed |
| R3 | compiled Plan + frozen facts/backends + DeepSeek/SOP | backends → anchored/direct or witnessed-derived facts and multiscale populations; iterative Analyst epochs + append-only expansions → final clusters/induction/falsification/Analyst-disposition reviews/fixpoint; Producer → 0..N Recipe expressions or mandatory zero-expression disposition; nested serial G1+admission → expression-disposition review or draft G2 → persist/ref/contentReady → immutable hypothesis-expression-set receipts | R4 | existing Evidence Ledger/PipelineStrategy/AnalysisArtifact/Agent prompts/Gateway/writer/reconciler + proposed strict journal | FACT/ANALYSIS/CONTENT; final expanded schedule, witnesses, all expression/disposition fates and set hashes conserved; typed non-pass has one owner/resume; no fact invention, self-suppressed high-value cluster, producer self-pass, direct persist or proxy value |
| R4 | planned cells/lens bindings + analysis fixpoint/final expanded schedule + closed hypothesis-expression-set hashes (`unresolved\|failed\|unknown=0`) + contentReady/negative evidence | Alembic finalizer → immutable candidate coverage receipt | R5/R6 | Core coverage receipt schema; existing ledger remains advisory | G3; every final obligation/population/disposition/expression-set/lens/cell terminal, every merge/duplicate target final content-ready, no partial/exhausted/deferred/failed/unknown |
| R5 | G3 receipt + private working state | Alembic → reconciled DB/files/refs/journal and isolation proof | R6 | KnowledgeService/writer/reconciler, strict DI/reader resolver | DURABLE; faults resume/compensate, route-null leaks fail |
| R6 | exact qualified corpus | Alembic/Core → built then sealed data bundle, sparse/vector/G4 receipts | R7 Main finalizer | SearchEngine, vector manager/runtime, publication primitives | INDEX/G4; no Plugin dependency, post-seal data write or planned generation |
| R7 | sealed bundle + G4 + expected public null | Alembic finalizer → serving reconciliation + immutable final coverage → tool-neutral snapshot validation → serving manifest → locked public CAS/finalized | controller, then public readers/Test | Core serving-manifest/route contracts, Alembic strict journal and PublicKnowledgeRoute store | PUBLIC; no MCP/candidate handle before CAS；null/exact-prepared/other-route outcomes deterministic；Plugin compatibility is I8 and real five-tool proof is post-CAS Test |

## 7. Foundation F0 — ProjectContext Foundation Before Plan

### 7.1 Investigation contract

This was the demand's first blocking phase and remains the non-regression contract for every rebuilt final artifact; it is not the current revision-154 dispatch. “Evidence-first” still means neither source files nor historical acceptance are assumed healthy: final loaded artifacts rerun every production-consumer and classification/conservation card below. `repairCommits=[]` is legal only when the complete inventory passes; current execution work is nevertheless confined to the Alembic setup repair unless this regression proves a new owner defect.

The minimum sequence is fixed:

| Subphase | Required task | Binary acceptance |
| --- | --- | --- |
| PC-F0 provenance/reproduction | record source/package/dist/runtime-loaded hashes; replay MR 5-repo and SP root+4; distinguish source bug, stale dist, config/root identity and progressive snapshot | expected=loaded hash; every historical/current symptom has raw terminal receipt and owner or typed unresolved blocker |
| PC-F1 Core correctness | reuse existing store/readiness; add independent Core-owned `ProjectScopeManifestV1`; stop treating caller repo/expected sets or placeholder projections as truth; add V2 request-row identity for repo×request kind×selector×canonical scope×applicable language/parser/surface; freeze every eligible readable blob; reconcile owner, identity/path, inventory/ref/error/omission | scope receipt exact MR5/SP root+4; all required V2 rows terminal; selector/scope-only mutation fails; frozen-blob/read conservation exact; `unclassifiedEntries=0`, `unknownCriticalCapabilities=0`, `requiredRequestFailedOrPartial=0`, critical read/ref failures=0 |
| PC-F2 Main migration | make Plan, generation, dependency and module projections derive from one reopened artifact; replace strict live/raw/synthetic paths in workflow facts, consumer facts, AiDimension, ModuleService and `ProjectMapModules` | four real Main lineage rows share artifact/vector; strict direct/raw/synthetic/12/80-cap fallback counters=0; any partial/hash drift blocks |
| PC-F3 Plugin migration | make dimension completion/module/submit-axis/host sessions derive from the same artifact; include `tool-router.resolveSubmitKnowledgeModuleAxis`; keep `.gitmodules` only as live probe | Plugin lineage shares artifact/vector; SP canonical tuples match Core; strict direct/raw/synthetic/24-cap/empty-axis-passthrough counters=0 |
| PC-F4 Graph/Map truth | Graph remains live/Recipe-free; accept only terminal request matrix; repair script taxonomy, repeated scoped paths, per-type continuation accounting; rename/split mount accounting from project coverage | repo node exactly once; script-as-repo=0; required terminal errors/suppressed defects=0; Map cannot emit mount accounting as knowledge coverage |
| PC-F5 controller acceptance | rerun actual loaded entrypoints, fresh-process repeatability, differential/mutation fixtures and both modes | controller records one `PCFBaselineReceipt`; otherwise I3+ remains blocked |

It must answer:

- Does the independent Core-owned scope builder produce the controller-accepted project-mode scope before capture, so capture input and readiness expected set cannot self-certify each other? Removing/adding/aliasing a repo must fail even when a malicious fixture changes both caller lists; MR is exact five and SP is exact root+4.
- Are all nine request kinds—`anchor-range`, `space`, `repo`, `map`, `module`, `module-layers`, `file-flow`, `file-symbols`, `source-slice`—usable for both modes? Strict V2 matrix granularity is repo×request kind×selector×canonical scope×applicable language/parser family×accepted critical/module surface, not the current single first-parser file per repo. Each `ProjectContextRequestOutcomeV2` row has a unique row ID, applicability, typed reason, exact selector/scope hash, language/parser/query initialization, terminal status, continuation and output hash. A scope-only swap/alias must fail. A callable method, one fixture or v1's single `repoId+kind` row is not acceptance.
- Are parser/language mappings, scope identity, canonical relative roots, repo/package discovery, module ownership, file conservation, refs, source slices, continuation, pruning and cancellation correct? Every owner row states `package/build/declaration|path-heuristic`, confidence and evidence; path heuristic alone cannot drive criticality/exclusion/coverage and ambiguous/shared ownership is typed rather than guessed.
- Do inventory-plane counts/hashes cover the full eligible source/module universe independently of Main 6/3/8, Plugin 25/3/8, Core Plan raw scanner 5000-file/per-module-400-owned-file limits, Main consumer seeds/owned-files 12, Plugin module axis 24, `ProjectMapModules` per-prefix 80, Main/Plugin ModuleService 500-file recursion guards, public 50-ref and mount display limits? Do >12/>24/>80 module/owned-file fixtures conserve the same artifact inventory without truncation? Is every readable eligible blob frozen in the immutable store, including files outside the initial detail selection? Are bounded detail selections explicitly paged/resolved from those frozen blobs rather than represented only by an omitted-key marker?
- Does MR traverse 5/5 and SP traverse root+4 with per-repo terminal status?
- Do Plan, Recipe generation, dimension completion, dependency graph and module coverage derive from the same authoritative capture and share `artifactId/sourceVectorHash`, while each **actual loaded adapter** emits its own deterministic `ProjectContextConsumerProjectionReceiptV2`? Are audit-script placeholders explicitly rejected? Are Core Plan raw scan, Main/Plugin collectors, `AiDimensionPreparation`, `ProjectContextConsumerFacts`, `ProjectMapModules`, both ModuleService implementations, Plugin `tool-router.resolveSubmitKnowledgeModuleAxis` plus plan-confirm/module-axis callers, both session constructors, Main incremental rescan and Plugin knowledge rescan recorded applicable or typed N/A with reachability evidence?
- Does Core-owned `ProjectScopeManifestV1` independently fix MR 5/5 and SP root+4 before capture, with capture deriving exactly those tuples? Is Plugin `.gitmodules` discovery used only as a live Graph/shared discovery probe and reconciled exactly by `repoId+relativeRoot+revision`, rather than becoming a second repo-set authority?
- For the same source revision, do Graph/region reconcile canonical build scope, exact source vector, `terminalSemanticOutputHash` and identity/repo/module inventory without pretending cache `factFingerprint` or process-local `factSessionRef` values are semantic identities? A metadata-only mtime touch may change fingerprint; fresh process may change both diagnostics while vector/semantic output stay stable. Is the receipt terminal rather than an in-progress `attempted=1` snapshot, and are partial/suppressed errors/duplicate scoped paths typed as defects rather than hidden by repoCoverage?
- Does Recipe Map expose `mountAccountingCompleteness` separately from `projectCoverageStatus` and final coverage receipt? Do continuation pages report per-type shown/total/remaining/cumulative counts so a mounts-first page cannot summarize zero nodes as final? Are package command scripts excluded from repo/module taxonomy?
- Are historical 1/5 and repeatability failures caused by source code, stale dist/package, wrong config/root identity or runtime assembly?

### 7.2 Code landing

| Owner | Existing landing | Required change |
| --- | --- | --- |
| Core | `ProjectContextContracts.ts`, `ProjectContextService.ts`, `capabilities.ts`, parser-language utilities, existing `service/project-context/foundation/{contracts,capture,store,readiness,nodePorts,canonical}.ts`, `service/plan/facts/{collectProjectContext,projectSourceFacts}.ts` | keep the existing capture/store/readiness. Add `ProjectScopeManifestV1` builder/receipt so capture repositories and readiness expected tuples derive from an independently accepted scope; add strict-v2 projection authority; extend request envelope/index/canonical/readiness to unique selector+`canonicalScopeHash`+language+parser+surface rows; freeze every eligible readable blob in the confined content-addressed store and make detail continuation resolve it; add owner provenance/ambiguity, inventory/ref/read-error conservation and canonical relative-root checks. Raw 5000/400 scanner remains inventoried but cannot feed strict Plan |
| Alembic | `ProjectContextWorkflowFacts.ts`, `ProjectMapModules.ts`, `PlanSelectionGate.ts`, `generate/execution/AiDimensionPreparation.ts`, `project-facts/ProjectContextConsumerFacts.ts`, `service/module/ModuleService.ts`, `generate/incremental/IncrementalRescanWorkflow.ts` | call/reopen the Core artifact once; pure-adapt it to Plan, Recipe generation, dependency graph and module coverage; strict session create/persist/reload carries binding; direct collector/capability, ProjectScope synthesis, Package.swift/raw scan, 6/3/8 and 12/80-cap paths are zero. Incremental rescan is explicit applicable/N/A, never an unrecorded second producer |
| Plugin | `recipe-pipeline/generate/project-context-analysis.ts`, `knowledge-rescan.ts`, `dimension-completion.ts`, `service/module/ModuleService.ts`, `host-runtime/mcp/handlers/tool-router.ts#resolveSubmitKnowledgeModuleAxis`, plan-confirm/module-axis callers, `plan-tool.ts`, `cold-start.ts`, `ProjectGraphProvider.ts`, `ProjectContextRegion.ts`, `RecipeMapProvider.ts`, continuation handlers, `ProjectContextBuildSessionManager.ts`, `GitSubmoduleRepoDiscovery.ts` | host reopens the same artifact; strict consumers execute neither competing collector, 24-cap/empty-axis passthrough nor synthesis fallback. Missing submit axis fails closed. Graph/region remain separate live probes; fix terminal/progressive semantics, duplicate scoped roots and script-as-repo taxonomy. Map separates mount accounting from project coverage and reports typed per-family continuation |

`ProjectContextCapabilityAuditReport` is controller evidence, not a new product registry. It contains artifact/load hashes; capability/parser hashes; reproduction inputs; independently accepted `ProjectScopeManifestV1`; the V2 repo×nine-request×selector×canonical-scope×language/parser/surface matrix; complete frozen-blob/read/module/ref conservation; complete producer/consumer/legacy-entry inventory including Main `ProjectMapModules` and Plugin submit `tool-router`; actual projection receipts; separate Graph/region terminal live-probe and Map truth receipts; root cause; `unclassifiedEntries`, `unknownCriticalCapabilities`, `requiredRequestFailedOrPartial`, `openConfirmedDefects`; `repairCommits[]` (empty only after every row passes); failing-before/passing-after, mutation/differential regressions and residual risk.

### 7.3 Acceptance gate PC-F

- runtime loaded hashes equal accepted artifacts;
- MR=5/5 and SP=root+4, twice in fresh processes, with no omitted/failed/timed-out required repo;
- Core-owned pre-capture scope receipt is the authoritative repo-set producer; capture derives from it. Plugin `.gitmodules`/Graph discovery has exact `repoId+relativeRoot+revision` conservation with that receipt; extra, missing or revision-drifted tuple fails PC-F;
- `ProjectScopeManifestV1` is produced before capture from independently accepted project-mode scope and reconciles exact MR5/SP root+4 tuples. Capture/readiness cannot accept caller-controlled `repositories` and `expectedRepoIds` as independent authority; synchronized delete/add/alias mutation of both inputs still fails the scope receipt;
- all nine request kinds have strict V2 rows keyed by repo/kind/selector/`canonicalScopeHash`/language/parser/surface as applicable, with typed N/A reason, normalized selector/scope, detected language, parser initialization/query availability and terminal result. Required parser/query absence or a required request returning only “callable” evidence fails. Deleting, duplicating, swapping a language/scope row or aliasing a scope fails canonical index/readiness conservation;
- parser-dependent rows cover every present applicable language/parser family and accepted representative critical/module surfaces; the current one-first-file audit shape alone fails. Every inventory entry is classified, and N/A follows frozen policy plus controller review;
- independent source inventory reconciles repo/package/file/module/critical entrypoints;
- PC-F does **not** claim parse-all. Inventory/frozen-source conservation is `eligibleFiles = frozenBlobAvailable + readFailed`, with critical read failures=0 and every readable file carrying language/parser-applicability classification; `refs = resolved + typedExternal + dangling` with critical dangling=0. Parser readiness separately covers every present applicable language/parser family plus accepted representative critical/module surfaces. Full per-obligation parsing belongs to R3 fact generation; no hidden read/stat failure is omitted or rewritten as complete;
- every module owner has origin/confidence/evidence; a path heuristic alone cannot exclude, lower criticality or close coverage. Shared/ambiguous ownership has typed terminal disposition;
- inventory plane conserves the complete eligible universe and policy hash; every `frozenBlobAvailable` row resolves original immutable bytes after process restart even if the live file changes or disappears. Bounded detail proves every selected/omitted item, continuation and full-chunk resolution from that frozen plane. Existing v1 selected-key chunks/omitted-key marker, 6/3/8, 25/3/8, Core 5000/400, Main 12/`ProjectMapModules` 80, Plugin 24, ModuleService 500-file and public display slices cannot be used as completeness evidence; >12/>24/>80 fixtures conserve without truncation;
- required refs resolve to bounded source ranges; truncation always has a content-addressed full-chunk route;
- base certification/store-put readback precedes preparation/lease/open; all five strict consumers then record equal non-empty `artifactId/sourceVectorHash` and each actual loaded adapter's own deterministic projection hash/receipt; immutable consumer lineage references the unchanged base hash. Audit placeholders do not count. Core raw scan, old collectors, Main `ProjectMapModules`, both ModuleService implementations, Plugin submit `tool-router`/plan-confirm module-axis callers, both session constructors, incremental/knowledge rescan and legacy snapshot entrypoints each have applicable/N/A + reachability evidence. Applicable strict counters for direct ProjectContext calls, raw-filesystem fallback, synthesized ProjectScope facts, 12/24/80 capped module output and empty-axis/Core passthrough are zero;
- Graph and region use the separate live-probe receipt: `comparedArtifactId`, certified/observed source-vector hashes, canonical build scope, `terminalSemanticOutputHash` and diagnostic `factFingerprint`/`factSessionRef`. They reconcile identity/repo/module inventory without claiming to consume the artifact. The semantic projection excludes session/cursor/resultRef/time/host-path fields; touch-without-content-change keeps vector+semantic hash while fingerprint may change. Content/scope change must change vector or semantic hash;
- terminal Graph receipt, not a progress update, has every required request outcome; repoCoverage alone cannot pass. Required partial/degraded/suppressed error, duplicate canonical root/path or omitted repo keeps PC-F blocked;
- Graph has exactly one node per canonical repo and zero command-script-as-repo nodes; Recipe Map names mount accounting separately from project coverage/final coverage, and continuation reports honest cumulative per-type counts;
- cancellation/timeout/continuation/error statuses are honest;
- same facts yield the same `factsContentHash`; the same full inputs yield the same `certificationBindingHash`; facts change changes the former, while source/scope/capability/artifact/config drift invalidates the latter even if content happens to remain equal;
- `unclassifiedEntries=0`, `unknownCriticalCapabilities=0`, `requiredRequestFailedOrPartial=0` and `openConfirmedDefects=0`; if every accepted-artifact card already passes, controller may accept `repairCommits=[]`. Fixture presence, placeholder lineage, interface reachability or fallback success is insufficient;
- every reproduced defect has owner, repair artifact, failing-before/passing-after and affected regression; mutation fixtures must fail when a scope tuple, V2 request row/`canonicalScopeHash`, frozen blob, parser, continuation, owner or consumer binding is removed/swapped, when >12/>24/>80 input truncates, or when base certification changes after put. A synchronized change to capture repositories and readiness expectations must still fail the independent scope receipt, proving the audit cannot pass a hollow/self-certified payload.

Failure leaves the existing single state root at `PC_F_BLOCKED`, blocks every I3+ Plan/Agent/cold-start package and authorizes no fallback implementation.

## 8. Runtime R0 — Authorization, Snapshot, Exact Reset And Blank State

### 8.1 PreResetAuthorizationManifest

Generated before any root mutation. Required fields:

- `scenario`, project mode and symbolic root identity. Rebuild records the existing target's confined realpath hash. Pristine records `plannedAbsentPathReceipt={authorizedExistingParentRealpathHash,normalizedLeafChain,parentIdentityHash,lstatNoSymlink,leafAbsent}` without creating the leaf; supported init later records the actual target realpath and it must resolve to that planned confined path. Any not-yet-existing snapshot/evidence/lock leaf uses the same parent+planned-leaf form until creation;
- approved root class and authorization reference;
- `observedPreQuiesceRootReceipt`: pre-quiesce whole-root hash, source-revision vector/hash, observed control/publication/data state, accepted `RuntimeArtifactManifest`/actual-load hash and resolved config hash. These values bind authorization/drift/recovery provenance only; they are not the post-quiesce snapshot expected hash, post-blank `CertifiedProjectFactsArtifact` or Plan input;
- `observedPreResetPointers`: only the existing public route and vector route values that physically exist; Recipe/ref/coverage state is represented by DB/table/file hashes and counts, not fictitious pointers; sparse pointer is absent by design;
- for authorized rebuild, `ObservedPreResetPublicationModeReceipt`: actual loaded `legacy|strict` reader mode, resolver artifact/config/enrollment hash and source, `.asd/context/recipe-publications/marker.json` state/hash/schema if present, public/vector route interpretation and a bounded read-only probe/result hash. An incoherent or unreplayable pre-reset mode blocks before reset;
- exact allowed tables, dependent rows, Recipe/candidate directories and vector/publication paths;
- the deterministic run-owned private-corpus namespace policy under the approved Ghost data root, including allowed create/seal/cleanup operations, absent-leaf/no-symlink rule and a prohibition on treating any revision child as source or public knowledge. No revision leaf is created before blank;
- explicit forbidden tables/paths including source graph, ProjectContext state, tasks/sessions/audit, skills/wiki, source/config and other roots;
- versioned `StrictSetupAuthorityReceiptV2` hash, root-identity/quiesce/volatile-control policy hashes and the rule that only `QuiescedPreResetObservationReceiptV1.rootTreeHash` authorizes snapshot bytes/restore equality;
- snapshot/restore policy and observed previous data hashes. Rebuild recovery must reproduce the verified post-quiesce snapshot first, then re-establish the pre-quiesce publication-mode/data contract through the supported normal runtime; it must not restore stale PID/token/state files;
- symbolic snapshot root, its confined realpath hash, proof that snapshot and target neither overlap nor resolve through each other, snapshot permissions/retention/cleanup policy and durable manifest/fsync receipt;
- strict publication marker expected after supported init at the dedicated knowledge-publication path `.asd/context/recipe-publications/marker.json`, schema `{mode:'strict-v1',routeSchemaVersion:1,projectIdentityHash,migrationBundleHash}`. It is an allowlisted migration/publication artifact inside the approved knowledge root, not `.asd/config.json` or any provider/model config;
- immutable strict enrollment from the controller-accepted `ResolvedProductionConfig + project identity`, including enrollment hash/schema. This authority is loaded before touching the target root and is independent of the on-disk marker;
- symbolic `operationLockRoot`, outside both target and snapshot roots, plus the **existing** root-identity lock key, lock-order version, owner/heartbeat/stale-recovery policy; no second lock is introduced;
- symbolic external `strictRunJournalRef` below the demand-owned evidence/operation-state root, outside target and snapshot and covered by the same operation lock; the manifest freezes its planned/existing-path receipt and `StrictRunJournalHeaderV2` schema. Authority, lease and header readback/fsync must all precede the first quiesce request;
- `StrictQuiescePolicyV1`: existing daemon endpoint/schema, token/identity validation, request/ack hashes, child/new-daemon identity rule, bounded ack/exit/checkpoint timeouts and `no-SIGKILL-then-continue` failure rule;
- `VolatileControlStatePolicyV1`: exact resolved `.asd/daemon.json` and `.asd/daemon.pid` removal; exact configured daemon log may append only when runtime evidence proves it is the active daemon stdio, and its final bytes remain inside the post-quiesce whole-root hash. Database, `-wal`, `-shm`, publication marker, provider config and `daemon-entrypoint.json` are semantic/protected, not volatile exclusions. Any other changed path blocks;
- supported migration set and project identity policy.

### 8.2 Required reset implementation

`CleanupService.fullReset()` is forbidden. Alembic adds an exact cold-start reset method/module adjacent to `Alembic/lib/service/cleanup/CleanupService.ts` with this algorithm:

1. `DaemonSupervisor.start()` classifies strict `execute|recover|complete` before the ordinary ready short-circuit. It spawns/identifies the strict child without killing/restarting the live writer and without accepting the old daemon's ready state as child readiness. The child validates `StrictSetupAuthorityReceiptV2`, acquires the existing root-identity operation lease, writes/readbacks/fsyncs `StrictRunJournalHeaderV2`, and only then inventories the authorized target.
2. If a writer is live, the child uses a narrow authenticated request on the existing daemon HTTP/control boundary. The route validates the current daemon token and exact root/run/authority/header identity, returns a stable idempotent `StrictQuiesceAcceptedAckV1` for the same request and `409` for a conflicting request, then invokes the existing shutdown coordinator. No path/secret is transmitted. If no writer exists, record typed `QUIESCE_NOT_RUNNING` only after proving no live PID/state; pristine absent uses typed `targetState=absent`.
3. Wait for the acknowledged old daemon PID to exit and the exact daemon state/PID files to disappear. Verify the real checkpointed SQLite state after exit, including DB identity/integrity, `wal_checkpoint(TRUNCATE)` outcome or equivalent accepted stable-state proof, and WAL/SHM terminal state. Timeout, malformed ack, identity drift, hook/checkpoint failure or conflicting request blocks; strict setup must not SIGKILL the writer and continue toward snapshot.
4. Re-read the entire approved target, compare the exact delta to `VolatileControlStatePolicyV1`, and seal `QuiescedPreResetObservationReceiptV1`. For rebuild, create the immutable whole-root snapshot **outside** target from exactly that `rootTreeHash`; for pristine physical absence, record `rootTreeHash=null` and no snapshot. Reject overlap, symlink escape, unknown path delta or insufficient durability.
5. Restore the rebuild snapshot to a disposable probe and verify exact post-quiesce whole-root bytes/hash, SQLite integrity, migration ledger, counts, files, vector/public route, publication marker and observed reader-mode/config facts. The known BiliDili rebuild baseline may still prove migration 017 absent here; migration 017 becomes required only in later supported init. Then delete only approved Recipe rows, schema-proven dependent ref/coverage rows, approved index generations and explicitly authorized candidate/Recipe/vector/publication artifacts in schema-aware order; generic categories are forbidden.
6. Run only approved supported migrations/identity repair and install/read back the dedicated strict publication marker; rescan allowed/forbidden sets and seal `BlankStateReceipt` plus `activationExpectedPointers`. Any extra mutation or residual target fails. Retain the existing operation lease through R7 CAS or scenario recovery; do not release it after blank state.

The exact table list is generated from the current schema/migration bundle and frozen in the manifest; implementation must not maintain a stale hand-copied list in two places.

### 8.3 BlankStateReceipt and activationExpectedPointers

After reset/init+migrations, re-read current state:

- `publicSessionPointer=null`;
- vector active route/generations absent;
- `knowledge_entries=0`, `recipe_source_refs=0`, project coverage rows=0, plus only those Recipe-dependent strict-run/candidate rows explicitly named in the authorized allowlist=0;
- the authorized private-corpus run namespace has no revision leaf yet; any pre-existing/colliding/symlinked leaf is `BLANK_POINTER_DRIFT`/path conflict, never reused or deleted opportunistically;
- candidate/Recipe publication files absent;
- no live pre-quiesce daemon PID/token/state survives. If the strict runner remains a separate child, its identity is external to the restored target control-state contract; normal daemon control state may be created only after exact restore or successful completion by the ordinary runtime path;
- no separate Recipe/ref/coverage/sparse pointer fields are invented;
- schema/migration and project identity remain valid; BiliDili includes 017 and non-null scope IDs.
- the accepted enrollment says strict and supported init has durably installed a matching `.asd/context/recipe-publications/marker.json`. Resolution uses two independent facts: enrolled-strict + matching marker applies strict routing; enrolled-strict + absent/corrupt/mismatched marker fails closed; enrolled-legacy + absent marker may retain legacy behavior; any enrollment/marker disagreement is config drift and never falls back. `strict-v1 + route absent` means typed knowledge-unavailable. Provider/model config hash remains unchanged by marker installation.

`activationExpectedPointers` contains only physically real activation authorities: public route expected null and, where vector manager needs an internal working-root CAS, vector expected null. The final public CAS uses only `activationExpectedPointers.publicSession`.

### 8.4 Acceptance gate RESET

- strict `execute|recover|complete` is classified before the ordinary ready shortcut; a live-ready daemon cannot swallow the strict action, and strict child readiness cannot be satisfied by the old daemon PID/state;
- external authority, root-identity lease and header durable/readback/fsync timestamps precede quiesce request, ack, daemon state/PID deletion and every checkpoint/root mutation;
- pristine proves physical absence before supported init; rebuild proves an authenticated exact request/ack, graceful old-writer exit, post-exit checkpoint verification, allowed minimal control-state delta and immutable post-quiesce receipt before snapshot;
- rebuild snapshot source `rootTreeHash` equals `QuiescedPreResetObservationReceiptV1.rootTreeHash`; restore probe reproduces that exact post-quiesce whole root and DB semantic state before reset. No assertion compares the post-quiesce root to the pre-quiesce hash;
- dry-run and actual allowlists match; forbidden bytes/hashes unchanged;
- reset leaves all knowledge target data empty and public route null;
- at `BlankStateReceipt`, `activationExpectedPointers.publicSession=null` and the internal vector active route/generations are absent; later private vector construction does not retroactively violate this receipt;
- BiliDili migration/identity verified in both scenarios;
- restore from snapshot reproduces the post-quiesce DB/files/vector/route/migration-ledger/marker/config hashes exactly; then the supported normal runtime creates fresh daemon PID/state/token and no stale process identity is restored;
- authorized recovery additionally reproduces `ObservedPreResetPublicationModeReceipt`: exact resolver artifact/config/enrollment/marker interpretation and baseline read-only result. Route-null alone never proves a restored legacy root is readable;
- the external strict journal header is durable before quiesce/snapshot/init/reset, survives target restore, and contains no Plan/manifest binding until their append-only bind points;
- operation lock is external/non-overlapping, survives whole-root restore, and enforces the fixed lock order `operation → SQLite/quiesce → vector-internal → public-route`; reverse acquisition is forbidden;
- fault injection at every stage from header durability through quiesce request/ack, old-PID exit, post-quiesce receipt, snapshot, quarantine/reset and restore is fresh-process idempotent; timeout/conflict leaves snapshot/reset prohibited, and reset-or-later failure requires exact snapshot restore receipt before normal runtime restart;
- ordinary non-strict daemon ready/start/restart/stop behavior passes unchanged;
- no Plan, ProjectContext authoritative capture or DeepSeek call occurs before this gate.

## 9. Runtime R1 — One Post-Blank ProjectContext Capture

### 9.1 Durable CertifiedProjectFactsArtifact and receipt

Do not create a new public ProjectContext context or registry. Core **already contains** one private, versioned `CertifiedProjectFactsArtifact` schema/capture/store/readiness/receipt/lease/consumer-port implementation under `service/project-context/foundation/*`; current evidence shows it is exercised mainly by tests/audit/smoke and its audit projections are not the five real production projections. I1/I2 therefore validates and repairs that substrate, then wires Alembic main and Plugin host through approved root/scope/file ports and real consumer projections. It must not build a second writer or semantically separate artifact. Because `prepare → confirm → execute` crosses tool calls/processes, process-local hashes remain insufficient; the existing content-addressed store and lease must be proven on the loaded production artifact. A host-selected private strict-run namespace may be `.asd/context/cold-start-runs/<preparationId>/project-facts/`.

The artifact contains the independently accepted scope hash, complete inventory plane, a content-addressed blob/ref for **every readable eligible file**, normalized ProjectContext envelopes, bounded detail and resolvable content-addressed references to every required full chunk. It does not claim every AST detail is inline; it does guarantee that later Plan/Analyst work can reopen the frozen source bytes without live filesystem fallback. Under strict-v2, `manifest.json` identity is based on source facts/blobs/vector/V2 request outcomes; real consumer projections are deterministic derived artifacts with later receipts. While compatibility v1 still requires five stored projections, they are not readiness evidence unless the actual adapters reproduce them exactly.

Core seals `CertifiedProjectFactsCertificationReceiptV2` with `certificationBindingHash` at the same base `store.put` boundary, **before** preparation/lease/open and before any actual consumer adapter can run. It records only base facts/readiness authority:

- ProjectContext contract/capability/parser hashes;
- shared `SourceRevisionVectorV1`, independent inventory/policy hashes and its exact comparator result;
- independent `ProjectScopeManifestV1`, normalized repo/package/module/file/critical-surface inventory and frozen-blob conservation;
- request kinds executed, per-repo terminal status, ref/full-chunk/continuation receipts;
- all nine strict V2 request-row applicability/selector/scope/language/parser/surface-init outcomes and request-index conservation;
- artifact/config hash, readiness validator version, `factsContentHash` and `certificationBindingHash`;
- full inventory totals plus detail selector/page/continuation/omission receipts; required omission, hidden truncation or unresolved full chunk makes it fail.

Only after `base certification + store.put → preparation/lease/open` may each actual loaded adapter emit `ProjectContextConsumerProjectionReceiptV2`. A separate immutable `ProjectContextConsumerLineageReceiptV2` then aggregates those five receipts, the complete applicable/N/A entrypoint and bypass inventory, session reload evidence and the unchanged base `certificationBindingHash`; it never writes back into the artifact/base receipt or changes `factsContentHash`. `PCFBaselineReceipt` references the base certification, consumer lineage, separate live Graph/region receipt and Map truth card. A crash/missing row at any point leaves PC-F blocked and resumes from the same sealed base; it cannot fabricate a pre-open consumer receipt.

Storage rules:

- prepare returns only opaque `preparationId`, artifact/binding hashes and receipt refs, never a caller-supplied path;
- confirm and execute reopen the artifact through a root-confined resolver, verify every blob/source/config binding and use the existing Foundation run lease;
- existing Foundation v1 lease semantics stay minimal and code-true: one `preparationId` immutably binds one `runId`; the same run may idempotently reopen the artifact (`acquired→resumed→completed→completed`), while a different run conflicts. The lease schema does **not** store consumer allowlists, journal/plan bindings, expiry or heartbeat. Five actual consumer receipts are proven separately; a second consumer in the same run is required, not a lease conflict;
- the proposed Alembic strict orchestration journal is already open externally from R0; it is not a duplicate Foundation lease state machine. Facts capture appends `{artifactId,sourceVectorHash}` to that same journal; after Plan acceptance `PLAN_ACCEPTED` and `MANIFEST_BOUND` append the immutable `{planHash,manifestHash}` binding. A different plan/journal for the same run fails. Liveness/heartbeat/stale-owner recovery belongs to the separately proposed external operation run lease, while the external journal supplies the durable history it fences;
- stale/missing/hash-mismatched artifact or Foundation run conflict blocks without recollection/fallback. Any `expired-before-execute` policy belongs only to the proposed host/orchestrator preparation receipt; it must not be presented as a Foundation v1 field or alter/copy the Foundation lease state machine;
- success retains the facts manifest in serving provenance; failed pristine cleanup discards it with the run root, and failed rebuild follows snapshot recovery/evidence policy.

The existing `project_context_file_snapshots` helper may be extended as a low-level file-inventory input, but its current limited payload and nonblocking failure are insufficient and it must not become a second truth source. The Plugin's process-local `ProjectContextBuildSessionManager` remains a request optimization, not durable transport.

### 9.2 Two entry paths

Both current entry paths need blank-before-Plan sequencing:

- **Alembic main/daemon path**: refactor `RecipePipelineFacade.ts` and `ColdStartWorkflow.ts` so preparation owns reset/init/capture and persists the facts artifact; `runGeneratePlanGate` loads that artifact and never captures; execute revalidates/consumes the lease and never resets again.
- **Plugin host path**: replace “stateless plan confirm then bootstrap full-reset” with `prepare → draft/confirm → execute`. The proposed host preparation receipt addresses the durable facts artifact and carries blank-state/config/artifact/source bindings; confirm loads it and returns a compiled Plan receipt; execute reopens it and rejects missing, stale, host-policy-expired-before-bind, Foundation-run-conflicting or finalized-by-another-run receipts while allowing same-run bound crash-resume. Host expiry is an orchestration policy, not a Foundation lease capability. This may be an additive operation/version on existing tools, not a duplicate tool family.

### 9.3 Acceptance gate PC-RUN

- trace order is reset/init → blank receipt → capture once → readiness → Plan;
- Foundation evidence order is base certification/store put+readback → preparation/lease/open → five actual adapter projection receipts → immutable consumer-lineage receipt/controller baseline. The base `certificationBindingHash` is identical before and after adapters; missing/early/fabricated adapter evidence blocks;
- normal production has `authoritativeCaptureCount=1` and `comparisonCaptureCount=0`. A separate fresh-process comparison exists only in F0/controller acceptance/Test, never in run state or input lineage;
- strict call counts are zero for Core `collectProjectSourceFileFacts`, `collectPlanProjectContext`, Plugin `buildHostAgentProjectContextAnalysis`, `AiDimensionPreparation`/Main/Plugin `ModuleService` direct ProjectContext fetches, `ProjectMapModules` Package.swift/raw-scan fallback, 12/24/80 capped module projections, Plugin submit empty-axis/Core passthrough, ProjectScope synthetic facts and other raw source/module fallbacks; those consumers use artifact-only adapters. Main incremental rescan and Plugin knowledge rescan are typed N/A with strict-entry unreachability/call-count-zero evidence for these four scenarios, unless an accepted implementation deliberately makes one applicable and migrates it to the same adapter. Explicit Graph/region probes use the separate live receipt and cannot feed Plan/generation/coverage truth;
- readiness failure makes Plan LLM/compiler and generation call counts zero;
- Plan, generation, dimension completion, dependency graph and module coverage reopen the same artifact, record equal `artifactId`, `sourceVectorHash`, facts content/binding hashes, and verify their own distinct pre-lineage `projectionContentHash`;
- SP root+4 comes from Core capture; Plugin discovery matches every canonical §4.1 `repoId+relativeRoot+revision` tuple exactly, including dirty/content hashes where applicable;
- source/artifact/config drift invalidates the receipt before execute;
- same-run crash after Foundation lease bind reopens the artifact; each of the five consumer adapters independently emits its projection receipt. A different run fails. A second same-run consumer cannot be rejected as conflict; proposed-journal plan-binding mismatch still fails. Foundation lease status alone is never consumer/journal evidence;
- Graph can independently read current source, but activation computes the same `SourceRevisionVectorV1` and requires exact vector/inventory/policy equality. Its own fact fingerprint is not substituted.

## 10. Runtime R2 — LLM Plan Cognition And Deterministic Compilation

### 10.1 DimensionCatalogSnapshot

This receipt is generated directly from `DIMENSION_REGISTRY`, not hand-authored:

- `version`, canonicalizer version, `catalogHash`;
- all 26 IDs and current classification: 13 universal, 7 language, 5 framework, 1 synthesis;
- code-native conditions, roles, tier, output mode, evidence/quality metadata needed by policy;
- source artifact hash.

The code-truth baseline that the generated receipt must reproduce is:

| Classification | Exact current IDs |
| --- | --- |
| universal (13) | `architecture`, `coding-standards`, `design-patterns`, `error-resilience`, `concurrency-async`, `data-event-flow`, `networking-api`, `ui-interaction`, `testing-quality`, `security-auth`, `performance-optimization`, `observability-logging`, `agent-guidelines` |
| language (7) | `swift-objc-idiom`, `ts-js-module`, `python-structure`, `jvm-annotation`, `go-module`, `rust-ownership`, `csharp-dotnet` |
| framework (5) | `react-patterns`, `vue-patterns`, `spring-patterns`, `swiftui-patterns`, `django-fastapi` |
| synthesis (1) | `cross-dimension-synthesis` |

The implementation must correct the current header/layer drift for synthesis or encode an explicit versioned classification projection. An unaccepted 25↔26 or layer/hash drift blocks Plan.

### 10.2 CoveragePlanPolicy

Core first derives a versioned `ModulePlanningFactsV1` from the inventory plane. Each row contains canonical module/scope ID and relative path, module class, owned production-file count, languages/frameworks/roles, evidence-backed entrypoint/public-surface/cross-repo-edge/boundary refs, and ownership origin/confidence. Path heuristics may seed review but cannot alone set criticality, exclusion or applicability. Missing/ambiguous required facts are `PLAN_FACT_MISSING`; neither compiler nor LLM guesses from a display label.

After Plan cognition is accepted, one Core `compileColdStartPlan(certifiedFacts, registryPayload, policy, planCognition, resolvedStrictConfig)` pure function validates the LLM proposal and applies this precedence. `resolvedStrictConfig`/its `strictColdStart` section is a **proposed sanitized receipt projection**, not a current config object or key: implementation extends the existing production config-resolution path, records every value's real source and load hash, and must not add a second hand-maintained config file.

1. generated/script and display-only aggregate nodes are excluded. A repo/package coverage scope with stable identity and owned files is **not** a display aggregate and remains eligible, including cross-cutting synthesis; only an ownership-free presentation node gets `DISPLAY_AGGREGATE`.
2. universal dimensions require a first-party owned production scope. Registry `relatedRoles` is evaluated only through a versioned, evidence-backed `PlanningRoleVocabularyV1` mapping table **inside `CoveragePlanPolicy`**, not another registry/service; it normalizes current ProjectContext module classes/surfaces to registry roles, and an unmapped required role blocks rather than silently excluding. Until that table is accepted, `relatedRoles` is advisory and executable applicability uses explicit owned/public/boundary surface predicates. MR/SP goldens must prevent vocabulary drift from emptying architecture/universal coverage.
3. language dimensions require owned production files whose normalized language intersects registry conditions; otherwise `LANGUAGE_NOT_APPLICABLE`.
4. framework dimensions require both compatible language and facts-proven framework/surface; otherwise `FRAMEWORK_NOT_APPLICABLE`.
5. synthesis cells are structurally frozen only for a named repo/package/cross-cutting scope with at least two eligible prerequisite cells. Their prerequisite IDs are part of the Plan. Runtime cannot add/remove cells; insufficient content-ready prerequisites later yields independently reviewed empty or unknown, never a dynamically rewritten Plan.
6. criticality is deterministic: `critical` when any entrypoint, public-surface, cross-repo-edge, persistence/security/concurrency/lifecycle boundary ref is present; `standard` for other first-party production; `non-critical` only for explicitly classified test/tool/support scopes. Missing module class blocks. Criticality controls canonical repair order, not deferral or invented quota weights.
7. The compiler first materializes the complete normalized module×dimension applicability universe. `eligibleCells + excludedCells = universe`, with no duplicate/omission; every exclusion carries one of `GENERATED_OR_SCRIPT`, `DISPLAY_AGGREGATE`, `NO_OWNED_PRODUCTION_FILES`, `ROLE_NOT_APPLICABLE`, `LANGUAGE_NOT_APPLICABLE`, `FRAMEWORK_NOT_APPLICABLE`, `SYNTHESIS_PREREQUISITE_INSUFFICIENT` or `REQUIRED_FACT_MISSING`, plus evidence refs. `cellUniverseHash`, eligible hash and excluded hash are recorded; exclusions remain audit-expandable even if stored in chunks/Merkle form.
8. Initial `deferredCells=[]`; policy has no runtime deferral switch. Any later deferral/scope reduction requires a new user-confirmation receipt and a new Plan.
9. `catalogDimensionSet` exactly equals the accepted 26-dimension catalog and `eligibleExecutionDimensionSet = distinct(eligibleCells.dimensionId) ⊆ catalogDimensionSet`. Module and cell counts must fit the **accepted strict-v2 wire/config bounds** recorded by `resolvedStrictConfig.strictColdStart`; the legacy wire's 80 module-binding limit implies only a compatibility requirement, not an allowed truncation or permanent product ceiling. If the complete universe exceeds the accepted wire/config, return `PLAN_SCALE_UNSUPPORTED` and version/accept the owner wire before retrying. Missing strict config is `CONFIG_UNSUPPORTED`; neither case may shrink scope.
10. `candidateAttemptCap`, `maxAuthoredCandidatesPerCellPass` (both upper bounds, never floors) and independent provider request/token/cost/time/detail limits come only from versioned `resolvedStrictConfig.strictColdStart`. The legacy Recipe-budget maximum 500 cannot be silently reinterpreted as the new candidate-attempt cap; the new field's exact lower/upper/effective values and schema bound must be supplied by accepted config/wire provenance. Semantic repair rounds are fixed by the accepted policy at ≤2. The compiler records configured/effective values and policy/config version; missing values are `CONFIG_UNSUPPORTED`, and no LLM chooses them.
11. Generation uses deterministic batch barriers, not arrival-time reservations. For each initial or typed-repair pass, concurrent outputs are fully buffered, normalized and sorted by `(criticality,moduleId,dimensionId,passOrdinal,authoredFingerprint)`. Each cell may emit at most `maxAuthoredCandidatesPerCellPass` normalized candidates in that pass. Only after the whole pass validates does the canonical list atomically append to the `CandidateAttemptLedger` **section of the one strict run journal**; this name does not authorize another database/service. Only an exact retry inside the same `{runId,analysisFixpointHash,privateCorpusRevision,cellId,authoredFingerprint,causalParentIds}` is idempotent. A replacement-fixpoint output is a new semantic attempt and consumes the applicable attempt/candidate cap even if its authored bytes/fingerprint match an invalidated row; it must emit new fixpoint/revision-bound receipts and cannot resurrect the old row. Malformed raw model output consumes request/token/cost budgets but not an authored attempt.
12. If any cell exceeds its per-pass upper bound, or the canonical batch would make `candidateAttempts>candidateAttemptCap`, the **whole pass** fails `CANDIDATE_CAP_OVERFLOW`; no first-N selection occurs. Initial discovery completes its barrier before any repair pass; only typed `revise` lineages enter the next canonical repair pass, up to the shared repair limit. If resource caps expire before every cell reaches G3 terminal state, remaining cells are unknown and the barrier fails; no filler, starvation-by-arrival, silent exclusion or runtime deferral is allowed.

### 10.3 Anatomy baseline and Plan LLM contract

Before the Plan LLM runs, Core deterministically materializes `AnatomyLensCatalogSnapshot` inside `RequiredFactApplicabilityUniverseV1`. It is project-name-independent and orthogonal to the 26 knowledge dimensions. The requirement's first accepted catalog is deliberately small:

| Anatomy lens | Question answered | Typical scales/backends |
| --- | --- | --- |
| `structure-and-boundary` | What are the real repositories, packages, modules, ownership and public boundaries? | module→project; certified ProjectContext |
| `entrypoint-and-contract` | Where do execution and API contracts begin, and what do they promise? | symbol→repository; refs/config/build facts |
| `dependency-call-data-control` | How do dependencies, calls, values and control move? | source-range→project; relation endpoints may cross repositories, but only loaded producers count |
| `state-lifecycle-persistence` | What state exists, who owns it and how does it transition/persist? | symbol→project; code/config/migration relations |
| `error-recovery-concurrency` | How do failures, compensation, idempotency and races behave? | source-range/symbol→project; branch/error/lock evidence |
| `configuration-build-migration` | Which configuration, build and migration facts alter behavior? | file→project; typed parsers with diagnostics |
| `api-protocol-usage` | What call/order/resource protocol must a developer follow? | source-range→repository; accepted semantic/order backend |
| `cross-cutting-concern` | Which concern spans otherwise separate modules and where is every source anchor? | module→project; exact back-map to facts |
| `idiom-and-convention` | Which local implementation idioms recur or encode explicit decisions? | symbol→repository; syntax/config populations |
| `evolution-and-rationale` | What change/co-change/fix evidence explains a pattern? | symbol→repository; only accepted frozen history backend |

For every eligible scope, every row is `required|typed-excluded|unsupported-blocked` with `requiredWhen`, analysis scales, fact/query families, backend capability IDs, denominator and evidence. Absence of a history or semantic-order backend may produce a typed exclusion only when policy says the lens is genuinely inapplicable; if a required claim depends on it, the result is `unsupported-blocked`. Runtime observations are Test evidence after publication in this demand and do not enter the initial static corpus. Neither LLM nor runtime cap pressure may defer a row.

Refactor the existing `AlembicAgent/src/agent/runs/plan/PlanAgentRun.ts`; do not bypass it or create a second Plan service. Strict output is an extended existing `PlanIntent` with `PlanNextAction` rows, sealed as `PlanCognitionReceiptV1`. Input is a complete, continuation-capable `PlanContextProjectionV1` derived from the certified artifact, not the current lossy summary/top-20 module list. This is the versioned serialized input payload for the existing Plan invocation, not a new store or collector. It includes source/module inventory, canonical subjects/scales, the anatomy/applicability universe, 26-dimension catalog, accepted capability/query catalog, frozen user scope/non-goals and hard cap boundaries.

`PlanInvestigationDecompositionV1` is a section of that intent. It must form an acyclic, referentially valid graph:

`questionId → subquestionIds → anatomyLensIds → subjectRefs/analysisScales → capabilityId/queryFamilyId → expected support/counterevidence → synthesis target → uncertainty → stop/escalate`.

Every required anatomy row has at least one scheduled action; optional additions cite a known fact gap. `PlanBudgetStrategyV1` is another section of the same intent: priority tier, initial breadth allocation, expansion reserve, counterquery reserve, starvation guard and rationale per question/lens. The Plan LLM allocates attention only **inside** controller/config hard caps; it cannot set Recipe targets, raise token/cost/time/concurrency/query/candidate caps, starve a critical required lens or convert cap exhaustion to N/A. If the hard caps cannot cover the required baseline, the compiler returns `PLAN_SCALE_UNSUPPORTED` for controller/config ownership; it does not first-N or shrink scope.

Plan may choose only IDs from the frozen capability/query catalog. It does not need to execute source tools during Plan, so the current runtime `toolChoiceOverride:'none'` may remain while the structured output still names the tools that later fact/Analyst stages must use. Unknown subject/module/tool/query refs, an incomplete question decomposition, a missing critical anatomy row, unsupported required backend, unjustified exclusion, scope expansion or claim of completeness produces a typed Plan revise/reject before compile.

`PlanCognitionLineageV1` records exactly one initial invocation plus 0..2 serial semantic repair invocations over the same facts/catalog/policy/caps, with parent/input/output/reason/model hashes. Transport retry does not create a new semantic version but is separately budgeted; a third semantic repair rejects the Plan. Plan cognition owns project understanding, questions, decomposition, tool choice, priority and within-cap allocation. The compiler owns referential/cap/applicability conservation and executable projection: it instantiates frozen catalog-required obligations and rejects omissions, but if project-specific decomposition is missing it returns Plan revise rather than inventing questions or semantic priorities.

### 10.4 PlanSelectionReceipt

Fields:

- certified facts hash, `SourceRevisionVectorV1` hash, source/config/artifact hash;
- catalog/policy hash;
- final extended-`PlanIntent`/`PlanCognitionReceipt` and `PlanCognitionLineageV1` hashes, Plan model/prompt/SOP/config identity, validator verdict, initial/repair/transport counts, question/subquestion DAG, anatomy-lens/subject/scale bindings, selected capability/query IDs, priorities, stop/escalate and within-cap budget/reserve strategy;
- eligible/excluded dimensions and modules with typed reasons/evidence;
- `ModulePlanningFactsV1` hash, complete `cellUniverseHash`, canonical eligible and excluded cells with criticality/reason/evidence and conservation counts;
- proposed versioned strict wire `ColdStartPlanSelectionV2` with `schemaVersion:2`, `kind:'cold-start-upper-cap'`, `generationStage:'coldStart'`, modules/dimensions/cells, `candidateAttemptCap`, `maxAuthoredCandidatesPerCellPass`, batch-barrier/policy version and independent request/detail/token/time/cost/repair caps;
- `deferredCells=[]`;
- canonical plan hash and compiler version;
- LLM rationale/uncertainty hash, non-authoritative for facts/coverage but authoritative as the accepted investigation strategy input.

The receipt also binds `AnatomyLensCatalogSnapshot`, `RequiredFactApplicabilityUniverseV1`, the accepted fact-query pack and baseline `MiningWorkScheduleV1`: dimension-free fact-harvest obligation counts by backend/fact-family/canonical subject/scale plus lens-binding counts by cell/anatomy/fact/cluster/question. The baseline schedule is `required universe ∪ accepted unique Plan additions`; required work cannot be removed. Fact/query execution budgets are independent from `candidateAttemptCap`; deterministic harvest never consumes a Recipe attempt.

Core also emits `ColdStartExecutionProjectionV2 = {factsBindingHash,sourceRevisionVectorHash,planCognitionHash,orderedDimensionIds,orderedCells,orderedInvestigationActions,anatomyApplicabilityHash,lensBindingsHash,factHarvestScheduleHash,moduleScope,synthesisPrerequisites,resourceCaps}`. `orderedInvestigationActions` preserves accepted question dependencies, priority and within-cap allocations; deterministic criticality may impose safety precedence but cannot silently erase Plan priority. Alembic `RecipePipelineFacade`, `PlanSelectionGate` and `ColdStartWorkflow` consume it. Plugin `plan-confirm` emits/validates V2 and removes automatic deferred writes. Strict rejects legacy executable PlanSelection/fallback, but it invokes the refactored Plan cognition exactly once initially plus at most two parent-linked semantic repair calls. A human/UI projection may resemble V1, but never fills `targetRecipes` or overrides the compiler.

### 10.5 FactQueryCatalogSnapshot And MiningWorkSchedule

One project-name-independent compiler first derives the non-removable required applicability universe from frozen module/language/framework/role facts and accepted backend capability metadata, then unions accepted Plan questions/lenses. It never hard-codes project lists and never lets the Plan LLM define the minimum fact baseline. Current first-release fact/knowledge families are:

| Knowledge family | Reused substrate | Required strict evidence |
| --- | --- | --- |
| syntax/idiom | existing Tree-sitter CST/queries | blob/range/query hash, occurrence normalization, positive/negative/edge fixtures |
| architecture/dependency | Certified ProjectContext + source/dependency graph | exact repo/module/edge set and declared graph completeness; interactive Graph partial is forbidden |
| API/protocol | symbol/call/order/control/data relations where accepted backend supports them | ordered relation evidence; unsupported semantic backend is N/A only when Plan policy excludes it, otherwise failed |
| lifecycle/error/invariant | static relations plus accepted config/contracts; runtime only in Test | mechanism/invariant and counterquery; runtime observation remains scoped |
| config/build/test/migration | deterministic parsers over frozen files | config key/value/schema/source hashes; no model extraction authority |
| history/fix pattern | optional accepted Git/AST edit backend | frozen revision range and occurrence/edit hashes; absent history backend cannot be silently sampled |
| synthesis/cross-cutting | accepted lower-level observations from prerequisite cells | prerequisite receipt hashes and explicit aggregation rule; no new fact invention |

This table is a capability target, not an assertion that every backend already exists. `ProjectContextRefs`/`ProjectContextMap` supply real subject, relation and anchor primitives; current SourceGraph rich schema does not prove that its indexer emits call/control/data/order edges. Tree-sitter initialization failure, ProjectGraph limits/excluded tests/partial traversal and config-parser error→empty behavior must be converted to explicit backend terminal diagnostics in strict mode. Only a loaded producer with positive/negative/edge fixtures and a matching hash can make a family applicable.

The compiler materializes two orthogonal baseline universes:

1. `factHarvestObligations`: policy-required applicable fact/query families × canonical subjects at scales `source-range|symbol|file|module|package|repository|project`, plus accepted Plan additions inside the envelope. The same direct AST/import/config occurrence is harvested once and reused; `cellId`/`dimensionId` are forbidden in its identity. An `edge` is a relation between canonical subjects, not a separate scale; history ranges are backend scope, not fabricated source subjects.
2. `lensBindings`: policy-required anatomy lens families for every eligible cell, plus accepted Plan questions/lenses. Each binding targets reusable `factFamily|clusterFamily|questionId`, with policy/evidence and counterquery applicability. A cluster may close several cells only when the binding proves applicability; a cell need not own a dedicated query.

Multiscale conservation reuses the existing host-agent `HostAgentAnalysisUnit` projection. Each strict unit adds `{canonicalSubjectRef,parentSubjectRefs,primaryScale,anatomyLensIds,factIds,witnessIds}`; builders derive it from the frozen artifact rather than dimension-first samples. A direct occurrence belongs to its finest provable subject exactly once; higher-scale summaries are derived facts with premise witnesses, and a cross-cutting cluster back-maps every source anchor. Therefore `directFactIds` are unique across views/scales, `derivedFactIds` are unique by rule+ordered premises, and lens/cell bindings never increase either count.

The pre-Plan `RequiredFactApplicabilityUniverseV1` is the deterministic subset that must execute. For the full capability×analysis-unit applicability domain, `required + optionalEligible + typedExcluded = applicabilityDomain`; every exclusion has policy/evidence and no runtime call. The baseline schedule satisfies `required ⊆ baselineScheduled = required ∪ acceptedUniquePlanAdditions`. Relation overlaps are refs, not double-counted denominators. Complete denominators and canonical ordering are stored independently from display Top-N.

Schedule conservation is exact:

`finalScheduledObligations = matched + inspectedNoPattern + failed + unknown`; `eligibleCellIds = distinct(lensBindings.cellId)`; and every individual lens binding has exactly one terminal analysis disposition at fixpoint.

Plan-time `not-applicable` is counted only in typed exclusions. Runtime cannot create N/A, drop required/baseline work, sample first-N, duplicate a fact per lens, convert cap exhaustion to empty or defer a cell. Analyst may add only validated unique obligations through the append-only expansion ledger; it never subtracts. If configured fact/query upper bounds would be exceeded, Plan or expansion validation fails `MINING_SCALE_UNSUPPORTED`; it never truncates. `deferredCells=[]` applies to cells and their required lens bindings.

### 10.6 ColdStartRunManifest

Created only after blank state, certified facts and compiled Plan. It references:

- pre-reset authorization/`StrictSetupAuthorityReceiptV2`, `ObservedPreQuiesceRootReceiptV1`, `observedPreResetPointers` and, for rebuild, `ObservedPreResetPublicationModeReceipt` hashes; these remain provenance, not activation expectation;
- external lease, `StrictRunJournalHeaderV2`, quiesce request/ack or typed not-running, immutable `QuiescedPreResetObservationReceiptV1`, snapshot/restore/reset/blank receipts;
- post-blank activation expected public/vector values;
- certified facts, required applicability universe, final accepted Plan cognition lineage, dimension catalog/policy, fact-query pack, baseline dimension-free harvest/lens-binding schedule and Plan receipt hashes;
- source/config/artifact/prompt/SOP/credential-symbol hashes;
- production/evaluator identities and budgets;
- approved data-root symbol, deterministic private-corpus namespace policy/hash, run/session ID and strict publication mode version. Actual revision leaves do not exist yet and are allocated later by `PrivateCorpusRevisionHandleV1`;
- external `StrictRunJournalHeaderV2` hash, `PLAN_ACCEPTED` head hash, journal schema/location symbol and stage-specific recovery policy. After manifest hashing, `MANIFEST_BOUND` appends this manifest hash to that same journal; the manifest never self-hashes the later head.

It never embeds a pre-reset ProjectContext or uses observed pointers for activation. Because Analyst expansions occur later, this immutable manifest records the baseline schedule plus expansion policy/caps; it does not pretend to know the future final schedule. `AnalysisFixpointReceiptV1`, G3, serving manifest and public route provenance later bind `finalExpandedScheduleHash` without mutating this manifest.

### 10.7 Acceptance gate PLAN/SCHEDULE

- the ten-row anatomy catalog is classified for every eligible scope: each row is `required|typed-excluded|unsupported-blocked`, every required row has at least one question/action and every true exclusion has policy/backend evidence. PLAN/SCHEDULE pass additionally requires `requiredUnsupportedBlockedCount=0`; `unsupported-blocked` is a typed owner/config stop, never an accepted exclusion/N/A or a merely “dispositioned” success. It is not a dimension or new registry and cannot be thinned by Plan;
- replaying the same final accepted `PlanCognitionReceipt` over the same facts/catalog/policy in a different enumeration order/fresh process yields byte-identical compiler/cell/lens/baseline-schedule hashes;
- an independent Plan LLM rerun need not use identical wording/order or pre-ordained accepted claims. It must preserve source boundary, anatomy applicability, required baseline, caps/prohibitions and no-starvation constraints; any legal new question/discovery delta is recorded and independently adjudicated rather than failed merely for non-equivalence. Unexplained omission or scope expansion fails;
- one source/framework/module fact change yields expected deterministic delta;
- Plan LLM controls an acyclic question/subquestion decomposition, anatomy/subject/scale bindings, approved capability/query selection, strategy/priority, support/counterevidence, stop/escalate and within-cap allocation/reserves. It cannot alter source universe, final executable cells, subject inventory or hard caps; unknown refs, an unscheduled required row, starvation and unjustified exclusions revise/reject;
- no cold-start quantity floor, auto deferred or explicit dimension bypass without confirmed provenance;
- cell universe, lens bindings and dimension-free fact/query schedule conservation are exact; every exclusion/N/A has a typed reason; repo/package coverage scopes are not confused with ownership-free presentation aggregates;
- exact strict-v2 candidate/module/cell bounds, per-cell-pass upper bound and batch-barrier policy are frozen/hashed with their config/wire origins; the legacy 80/500 fields are compatibility evidence only. Zero candidate cap crosses V2 without legacy floor validation; any accepted-bound overflow fails a whole pass rather than truncating, and a too-small wire is versioned by its owner rather than used to thin scope;
- every eligible cell has at least one explainable lens binding; a shared fact/cluster family may serve multiple cells. Missing required fact/query capability or unaccepted hash blocks; no dedicated-per-cell query requirement or cell×unit duplication is allowed;
- execution projection preserves accepted question dependencies, tool/query IDs, priorities and budget allocation; compiler safety ordering is explicit. A mutation that drops one action/priority/reserve or turns a required lens into first-N work fails;
- both entrypaths load `ColdStartExecutionProjectionV2`; strict Plan has exactly one initial cognition invocation and 0..2 parent-linked semantic repair invocations, while legacy executable PlanSelection, `.slice(0,20)`, dual facts capture, Recipe-floor validators, legacy fallback and automatic deferred counts are zero;
- Alembic main and Plugin host execute reject stale/missing/mismatched prepare/plan receipts.

## 11. Runtime R3 — Fact Harvest, LLM Analysis, Induction, Authoring, G1 And G2

### 11.1 Context propagation

`runId`, `journalId`, `manifestHash`, Plan-cognition-lineage/final-cognition/Plan hashes, required-universe hash, baseline-schedule hash, expansion-ledger parent/head, current/final-expanded-schedule hash, analysis-fixpoint hash, private-corpus revision, hypothesis-expression-set hash, `lensBindingsHash`, `questionId`, `factQueryObligationId`, `analysisUnitId`, source/artifact hashes, population-revision/cluster/hypothesis/expression/disposition-review IDs and Evidence Ledger refs must survive every applicable context whitelist. Fields not yet known are absent, never guessed; after fixpoint Producer/G3 must receive the final hashes. `cellId/moduleId/dimensionId` travel as lens/applicability bindings, never as Fact identity. Tests must catch silent field loss.

Strict quantity policy is `evidence-bounded-no-floor`. It must be wired through `DimensionCatalogPayload.ts`, `DimensionSop.ts`, `recipe-authoring-spec/dimensionCompletion.ts`, Mission Briefing presenters/builders, `HostAgentSubmissionTracker`, Alembic `AiDimensionSessionRunner.ts`, Agent `insightAnalyst.ts`/`insightProducer.ts`/`insightGate.ts`, exploration/nudge/scan-analyze paths and `GenerateProduce.ts`. Strict V2 permits 0 or 1 finding/candidate and never imports legacy min2/min3, target5, three-file or “one Recipe per finding” rules into catalog/SOP/briefing/completion/repair logic. Legacy modes may retain those rules.

### 11.2 CodeFactGeneration and fact-query execution

The strict orchestrator establishes an authoritative baseline fact base before any Recipe-producing model call; the Analyst LLM may then issue only validated bounded queries in append-only analysis epochs:

1. open the accepted Foundation artifact and source blobs through confined content-addressed ports; reject live drift;
2. run accepted fact backends over every baseline dimension-free fact-family×canonical-subject/scale obligation, emitting `FactRecordV1`, direct-anchor or derived-premise witness, unit terminal receipts and immutable baseline-generation receipt;
3. form baseline `ObservationPopulationV1` revisions for each query/fact family with full denominator, variants/outliers/negative controls and `raw=accepted+duplicate+excluded+error` conservation; presentation limits never alter them;
4. open iterative Analyst epochs with Plan questions, lens bindings and current population/cluster state. Analyst can compare facts and submit `ExplorationExpansionRequestV1(purpose=exploration)`; compiler accepts only deduplicated work inside the source/backend/budget envelope and appends a schedule revision;
5. when induction proposes a hypothesis-specific counterquery, normalize it through the **same** request/compiler/ledger with `purpose=counterexample`. Before any executor call it must have an obligation ID, parent schedule hash and schedule revision; a duplicate links to the existing terminal receipt. Direct unregistered falsifier queries are forbidden;
6. execute each accepted exploratory or counterquery obligation as an immutable child generation/query receipt, then append any affected parent-linked population revision and bind falsification to the enrolled obligation before the next epoch. A sealed generation is never mutated;
7. when an epoch proposes no accepted expansion and every observation/cluster/hypothesis/enrolled counterquery plus every Analyst semantic disposition/review is terminal, seal the canonical union as final `CodeFactGenerationManifestV1`, `FinalExpandedMiningScheduleReceiptV1` and `AnalysisFixpointReceiptV1`; Producer expression dispositions do not exist yet and are not a fixpoint prerequisite;
8. forbid Analyst inference for a question whose required final population is failed/unknown, and forbid Producer for any unresolved cluster/hypothesis/disposition review or unenrolled/nonterminal counterquery.

Backends are capability-specific, not one generic LLM: syntax/idiom uses existing Tree-sitter; module/dependency uses certified projections; config/build/migration extends existing parsers to return typed diagnostics; call/control/dataflow/order/history runs only with an accepted loaded producer. Existing `CapabilityRegistry`, `GenerateAnalyze` code/graph/evidence/meta tools and `PipelineStrategy` are reused as Analyst transport/orchestration seams, not replaced by an `AnalysisToolbox`; their current Top-N outputs become authoritative only through an artifact-bound adapter that supplies terminal pagination/denominator/error receipts. `ProjectGraph` partial traversal, schema-only SourceGraph edge kinds, `EvidenceCollector` negative signal and `EvidenceStarterBuilder` heuristic output may be hints but never authoritative population or investigated-empty evidence.

Gate `FACT` passes its baseline barrier only when every baseline obligation has exactly one terminal receipt, backends/query hashes match, every direct fact has a frozen anchor, every derived fact has a replayable premise witness, baseline population conservation closes, long-tail fixtures retain occurrences beyond five, enumeration/lens/scale order does not duplicate Fact IDs, and no required result is silently truncated. Final FACT/ANALYSIS closure additionally requires `required ⊆ baseline ⊆ final`, every accepted unique expansion terminal, parent/hash conservation for all schedule/population revisions and a sealed final aggregate. Multi-scale fixtures prove direct facts count once, parent aggregates cite premises and cross-cutting conclusions back-map all anchors. Incremental/epoch execution, if implemented, equals a clean canonical execution of the final schedule. Parser/config exception, timeout, missing grammar/query/producer, denominator mismatch, silent skip or blob drift yields `failed|unknown`; it cannot become `not_found`, investigated-empty or a stronger LLM claim.

### 11.3 Analyst investigation, clustering, induction and falsification

Analyst is the primary pattern-understanding role. It receives Plan questions/lenses, complete or explicitly incomplete populations, accepted fact-query tools and current clusters; it actively compares occurrences across modules/repos, identifies mechanism, variants, exceptions, outliers and negative contrasts, and proposes bounded hypotheses or further queries. Its output is always a claim over exact fact/observation IDs; a validator rejects invented fields or evidence.

Each analysis epoch is `Analyst query/interpretation → validated exploration enrollment/execution → population revision → Analyst cluster/induction proposal → counterquery enrollment in the same append-only schedule → deterministic counterquery execution → Analyst counterevidence interpretation → independent disposition review`. After each accepted Analyst pass:

- Analyst proposes every observation's `clustered|discarded|unresolved` disposition and mechanism explanation. Deterministic normalization only canonicalizes IDs, enforces exactly-one conservation and rejects evidence-free/contradictory labels; it never invents the semantic grouping or discard reason. `discarded` without independent review is legal only for mechanically identical duplicate or frozen policy exclusion; semantic irrelevant/generic/no-value discard requires `KnowledgeDispositionReviewV1`, otherwise it remains unresolved. Errors remain failed/unknown. Unresolved blocks affected lenses;
- deterministic normalizers/similarity can pre-group candidates only. The Analyst proposes `KnowledgeClusterV1` final membership and evidenced mechanism/invariant; same mechanism across selectors/dimensions/modules is one cluster, different mechanisms remain split, and a singleton remains a bounded fact rather than forced recurrence;
- `InductionReceiptV1` maps cluster(s) to 0/1/N semantic hypotheses, records many→one mechanism merge, one→N semantic scope split or zero hypothesis only for `refuted|insufficient-evidence|unknown`, and retains the final population hash. It does not decide `generic|duplicate|no-value`;
- only a claim explicitly labeled **recurring pattern** requires at least two independent normalized occurrences and exact scope. A singleton backed by an explicit API/config contract, invariant, failure mechanism or project-specific decision may form a strictly scoped hypothesis/Recipe and proceed through G1/G2; recurrence is not a general candidate floor. The §4.3 applicability matrix determines whether counterquery is required/not-required/unsupported-blocked; a rule cannot waive contradiction/violation work;
- deterministic falsifier executes only counterqueries already enrolled with `purpose=counterexample` and returns typed counterevidence/coverage, not semantic claim edits. Its receipt binds the obligation ID, parent/final schedule revisions and exact denominator. Analyst must explain whether that evidence narrows, scope-splits or refutes the hypothesis; ignoring an observed contradiction fails validation. Missing/truncated/unvisited/unenrolled work yields `unknown`. An independent reviewer verifies the interpretation;
- only `survived|narrowed` hypotheses with allowed epistemic status reach Producer. `refuted|unknown` do not draft or close coverage by themselves.

Gate `ANALYSIS` passes only at fixpoint: no accepted exploratory/counterquery expansion remains unexecuted, no population revision/cluster/hypothesis/Analyst-disposition/enrolled counterquery is unresolved, and the final expanded schedule hash seals both purposes. Singleton/many→one/one→many/zero fixtures, multi-scale identity, variant/outlier/negative-control and counterexample/scope-narrowing goldens pass; every cluster/hypothesis traces final population→fact/witness→source; every item has one Analyst-proposed, deterministically conserved disposition; every semantic discard/narrow/split/refute/zero outcome has independent review. Same-run resume or rerun with the exact same canonical expansion set keeps deterministic fact/population/schedule identity. An independent LLM run with a different legal expansion set may produce new valid discoveries; it must preserve required baseline/boundary/caps, and every claim delta receives the same G1/G2/disposition review and no-regression or explicit adjudication. Exact accepted-claim equivalence is not required in advance. No LLM-added fact, guessed ref, automatic scope downgrade, unreviewed suppression, direct falsifier query or unresolved population is accepted.

Only after this fixpoint does Producer consume the final `survived|narrowed` Producer-eligible hypotheses—not ProjectContext, zero/refuted branches or fact-query tools—and map **each eligible hypothesis to a canonically enumerated Recipe expression set** with cardinality 0..N. Nonzero sets contain `DraftProposal`/merge/duplicate expression rows with usage/scope rationale; a zero-expression result emits one mandatory typed non-draft `HypothesisDisposition` row outside that cardinality. It cannot merge distinct hypothesis semantics, rewrite a claim or use `generic|duplicate|no-value` as a final verdict. Section 11.6 first runs applicable G1 and non-persisting admission, then independently reviews every non-drafting/merge/duplicate disposition using that AdmissionReceipt. A failed/revise review returns an expression-only bounded repair or requires a draft; every version/fate remains in `HypothesisExpressionSetReceiptV1` and can never silently disappear because another Recipe covers the cell. A requested semantic hypothesis change invalidates the fixpoint rather than mutating it. Zero Recipe expressions are legal only after the mandatory non-draft row passes review and do not automatically establish investigated-empty.

### 11.4 Proposed mapping onto existing substrates after extension

The left-hand terms are requirement contracts, not current fields. The right-hand column states the smallest extension to a real substrate; none of these rows may be cited as “already implemented.”

| Requirement term | Current substrate and required extension |
| --- | --- |
| FindingEnvelope | current `AnalysisArtifact`/`NormalizedFinding` lacks population/cluster/induction/hypothesis and independent item versioning; extend its metadata/projection to reference those proposed objects plus Evidence Ledger IDs. Evidence export may use this label only |
| SourceEvidence | current Evidence Ledger stores tool evidence but does not universally carry the required blob/revision binding; extend its evidence metadata or companion immutable fact projection with path/range/blob/revision/tool/hash. Do not duplicate evidence as a second mutable array store |
| RecipeDraft | proposed transient `DraftProposal`; after matching G1/admission/G2 pass it becomes `AcceptedRecipeDraft` and maps to current `CreateRecipeItem`, which is not session-bound. Run/obligation/cell binding is persisted in the proposed strict journal/snapshot binding index because current Gateway metadata mapping is not lossless |
| retrieval/usage/negative intent | existing `RecipeRetrievalProfileWire`, `usageGuide`, exclusions and readiness projector |

Strict `buildAnalysisArtifact` requires structured final-population/cluster/induction/hypothesis/falsification/disposition-review projections and `derivedFindingCount=0`; Markdown fallback, post-hoc live filesystem grounding, automatic evidence guessing/scope narrowing and silent unsafe-content deletion are disabled. No accepted induction/hypothesis yields empty/unknown evaluation, never an inferred Recipe. Analyst owns semantic hypothesis merge/split; Producer may yield zero Recipe expressions, combine only hypotheses already proven semantically compatible, or split one hypothesis only for evidenced usage/scope variants, and every suppression/merge is independently reviewed.

### 11.5 G1 hard correctness

G1 reuses only the deterministic subset of existing gates and fails before admission/persistence when any hard axis fails:

- schema/required fields and allowed kind/category/dimension;
- manifest/session/cell/module identity and allowed module scope;
- source file existence, confined path, revision/blob hash, bounded line range and exact snippet;
- graph/source ref integrity where explicitly claimed;
- retrievalProfile/usageGuide/negative-intent provenance, source-content hash and bounded coreCode;
- credential/private-data/redaction rules;
- structured-finding lineage and `RecipeCandidateFingerprintProjection` canonicalization.
- exact direct-anchor or derived-premise FactRecord→multiscale ObservationPopulation→Analyst-owned KnowledgeCluster→Induction/Hypothesis→claim-applicable Falsification→DraftProposal lineage, loaded backend authority and claim-strength/scope compatibility.

File count, three-source rules, text length, tool count, section count, finding/Recipe count and stylistic depth are not strict G1 hard axes. They may remain analysis-process diagnostics. G1 does **not** claim deterministic proof of semantic entailment, contradiction absence, scope correctness or value; those are G2.

### 11.6 Non-persisting admission, then G2 ValueGateDecision

Split the current Gateway operation without duplicating its algorithms:

1. For every final-fixpoint `survived|narrowed` Producer-eligible hypothesis, each Producer attempt/repair version emits a canonical 0..N set of normalized, reviewable **Recipe expression** proposals: `draft|merge|duplicate`. The journal allocates stable expression/disposition IDs, version/parent edges and a set hash before gating. That version has exactly one separate non-draft disposition row iff N=0, with enough normalized authored projection to compute a fingerprint and run lineage/scope/source G1 axes; it is conserved but does not count as a Recipe expression. A cluster with a reviewed zero-hypothesis disposition and a refuted hypothesis never enters Producer and gets no expression-set receipt.
2. Run applicable deterministic G1 axes over each expression proposal **or mandatory zero-disposition row**, then `admitCandidate()` executes existing validation-compatible dedup, similarity and consolidation without calling `KnowledgeService.create`. It emits an immutable `AdmissionReceipt` with input fingerprint, exact/semantic matches, consolidation result/reason and final admitted fingerprint. Consolidation failure is fail closed.
3. If consolidation changes authored content, rerun full applicable G1 on the admitted fingerprint and update only that expression-or-disposition row version.
4. Branch on the admitted row: expression `merge|duplicate` or the mandatory `non-draft` disposition requires independent `KnowledgeDispositionReviewV1` bound to this `AdmissionReceipt`; `pass` records its reviewed fate, while `revise|reject` appends a bounded child Producer version and marks the old row rejected/repair-superseded, or leaves the terminal head unresolved. A merge/duplicate pass is provisional until it binds the exact target expression/fingerprint and that representative reaches final contentReady; target failure reopens the source as unresolved. A surviving `draft` proceeds to independent G2 over the exact admitted fingerprint. Every reject/revise/superseded row remains linked to its child or final unresolved reason.
5. Post-fixpoint repairs may change only Recipe wording/usage/retrieval/scope **within** the accepted hypothesis. They cannot change final facts, cluster membership, mechanism, hypothesis claim/evidence or analysis schedule. A requested semantic change is `ANALYSIS_FIXPOINT_INVALID`: append the invalidation transition, make all old-fixpoint descendants evidence-only, return to Analyst, close a new immutable fixpoint, open a fresh empty `privateCorpusRevision`, and replay the complete canonical eligible set from its first row. It cannot mutate the sealed receipt in place or retain an old Recipe as a dedup/coverage input.
6. `persistReviewedCandidate()` accepts only a draft with matching G1 + Admission + authoritative G2 receipts and then invokes the repaired real Gateway/KnowledgeService path. A passed suppression disposition never persists a Recipe but remains required expression-set/G3 lineage. No expression or disposition row may disappear because it was rejected, revised, merged or not persisted.

Do not introduce a distributed admission queue without evidence. Alembic must first implement one strict durable run journal; the initial strict path processes the canonically sorted expression-or-disposition row batch **serially** through G1 → admission → disposition-review-or-G2 → persist-or-dispose under that journal. Each receipt records the private-corpus revision it inspected. A rejected/revised draft is not inserted, so the next row is admitted against the actual accepted corpus; an accepted draft is durably consumed before the next row. This removes current check-then-write races with a smaller mechanism. If future measured throughput requires parallel G2, the owner may add durable reservations only through the same contract and concurrency fixtures; that optimization is not required for this demand.

Within a revision, admission may inspect only accepted rows from that exact physical revision root. Across a semantic re-fixpoint, it must open/query none of the invalidated root: the replacement revision is rebuilt from an absent leaf and all final-fixpoint rows are replayed in canonical order. A row that is textually unchanged may produce the same normalized fingerprint, but it still needs receipts bound to the new fixpoint/revision/root hash; old receipts are evidence, not reusable authority. Instrumented repository-open/read receipts must show `oldRevisionOpenCount=0` and `oldRevisionReadCount=0` after the switch.

Persistence uses the proposed strict durable run journal's write-ahead substate: `PERSIST_PREPARED → persisted → consumed`. Before calling KnowledgeService, the serial strict runner durably derives one deterministic Recipe ID from `(runId,analysisFixpointHash,privateCorpusRevision,admissionId,admittedFingerprint)` and records expected hashes/idempotency key. Current `CreateRecipeItem` has no trusted ID field, `RecipeProductionGateway.#prepareCreateData()` drops caller identity, and `KnowledgeEntry` otherwise allocates `uuidv4()`; therefore the implementation must add a **strict-internal-only** `persistReviewedCandidate({preparedRecipeId,journalStepToken,...})` path. After validating the current journal step, fixpoint/revision handle and reviewer receipts, that path alone passes `preparedRecipeId` through `#prepareCreateData` as `KnowledgeEntryProps.id`. Public/legacy Gateway callers cannot set or smuggle `id|preparedRecipeId`, and normal `createOrStage` semantics remain unchanged. DB/file/ref/Persistence receipts must read back `actualRecipeId===preparedRecipeId`; strict random-ID allocation count is zero. After a crash, resume queries the deterministic ID plus DB/file hashes: an exact durable match **inside that same fixpoint/revision** reconstructs `PersistenceReceipt` and marks the journal step consumed; absence retries the same ID; any mismatch is typed divergence/compensation. An invalidated-revision match is never a resume hit. Non-unique title is never the idempotency key. This is one trusted internal method and one journal transition, not a public ID injection surface, admission coordinator, queue or reservation service; persist-success/before-consumed crash cannot create a second Recipe in the accepted revision.

The existing judge is reusable reviewer infrastructure, not yet the complete contract. Move its refute-first/citation/calibration source into production code, make scripts consume it, replace direct `readFileSync(projectRoot)`/6×60 re-slicing with revision/blob-bound Evidence Ledger/full-chunk input, and extend the authored projection to title/kind/do/don't/markdown **plus** usageGuide, retrievalProfile, negative intent, scope/module/dimension and lineage. Source drift after capture fails the review. A separate `InvestigatedEmptyDecision` rubric is new and must not be claimed as already implemented.

One immutable `ValueGateDecision` records:

- candidate/reviewed fingerprint, producer and independent reviewer identity/method/model/prompt/version;
- Evidence Ledger refs and mechanically verified cited lines;
- one row for each fixed hard axis—`entailment`, `contradiction-free`, `project-specificity/nontriviality`, `actionability`, `scope/generalization-correctness`, `retrieval/negative-intent-fitness`—with `axisVerdict=pass|revise|fail|unknown`, discrete `score=2|1|0|null` (`pass=2`, `revise=1`, `fail=0`, `unknown=null`), an axis-specific typed reason, evidence refs and repairability. No arbitrary float or weighted average is allowed;
- `noveltyDecision=novel-project-specific|useful-extension|generic|already-covered|unknown` with typed reason/evidence, plus `duplicateDecision=no-match|exact-match|semantic-match|consolidated|unknown` with Admission algorithm/version, compared private-corpus revision, matched fingerprint/target IDs and consolidation fingerprint where applicable;
- total verdict `pass|revise|reject`, repair attempt, calibration receipt hash and the deterministic rule version that derives it;
- deterministic gate results and referenced `AdmissionReceipt`; it never contains or predicts a persisted Recipe ID/storage hash.

The same independent reviewer implementation also emits `KnowledgeDispositionReviewV1` for semantic observation discards, Analyst zero/narrow/split/refute interpretations and every Producer non-drafting/merge/duplicate proposal. It binds the final cluster/hypothesis/population/falsification hashes, proposed reason and affected lens/cells. Analyst-level reviews need no Recipe admission: their `revise` outcome stays inside the open analysis epochs and must be included in a later immutable fixpoint. Producer expression-level reviews additionally bind the non-persisting `AdmissionReceipt`; their `revise` outcome may change only expression wording/usage/scope within that sealed hypothesis. `pass` means the discard/suppression/merge is genuinely entailed, duplicate or not valuable/actionable under the calibrated rubric; `reject` means the knowledge item may not disappear and must remain unresolved or produce a reviewable draft. A cell already having a Recipe never waives this review.

Rules:

- `pass` iff all six axis rows are `pass/2`, citations and deterministic G1/Admission checks match the reviewed fingerprint, novelty is `novel-project-specific|useful-extension`, and duplicate is `no-match|consolidated` with any consolidated fingerprint re-G1 checked;
- `revise` iff no axis is `fail|unknown`, at least one row is `revise/1`, every such row is explicitly repairable inside the sealed hypothesis, novelty is not `generic|already-covered|unknown`, duplicate is not unresolved, and the inherited repair cap remains. The decision lists the exact Producer-owned fields permitted to change;
- `reject` if any axis is `fail/0|unknown/null`, citations are invalid/missing, content is ungrounded/trivial/generic, novelty is `generic|already-covered|unknown`, duplicate is unresolved or points to an unbound target, reviewer/calibration output is missing/null, or admitted/reviewed fingerprints differ. A reviewer infrastructure failure may additionally block the run, but can never become a pass;
- duplicate can only be reconsidered when admission consolidation produces a new fingerprint that is re-G1/reviewed;
- all axes are hard; totals, averages, Recipe/file/ref/tool/text counts and model confidence cannot compensate for a `revise|fail|unknown` axis;
- the producing model invocation cannot review its own candidate. An isolated evaluator call may be same provider only after golden calibration; before promotion it is advisory and requires human/controller adjudication;
- all **gate-triggered** content/semantic repairs share one durable causal repair DAG. The initially induced hypothesis receives `KnowledgeLineageRootId` from immutable run/Plan plus its initial cluster+hypothesis fingerprints; cells/lenses are applicability bindings, not knowledge identity. Any later Analyst re-fixpoint, cluster/hypothesis revision, split or merge created to answer a non-pass must name the causal parent node(s) and inherit the sorted root-ID set. Producer wording children do the same. `semanticRepairDepth=0` initially and `1 + max(parent.semanticRepairDepth)` for every content-changing repair; `depth>2` rejects even when cluster ID, hypothesis ID, fingerprint, evidence set or fixpoint seal changes. A genuinely new discovery from new accepted exploration may start a new root only when it is not the repair target of an earlier non-pass; the journal proves that distinction. Each node records parents, roots, stage/input/output/evidence/model/reason hashes and count delta. Byte-equivalent transport retry and deterministic normalization do not count but consume their own caps; a repaired fingerprint consumes a new candidate attempt.

Calibration reuses existing thresholds: judged≥30, agreement≥0.8, Cohen's κ≥0.6, negative cases≥5 with recall≥0.6, no overgeneralization self-bias. Goldens must include both projects and: high-value correct, generic low-value, inaccurate, duplicate, narrow fact overgeneralized, negative-intent, sufficient/insufficient investigated-empty.

### 11.7 Private persistence, refs, content-ready and expression-set closure

After G2 pass, and only then, `persistReviewedCandidate()` persists the exact reviewed authored projection through the repaired writer/KnowledgeService/Gateway path in the current strict private-corpus revision. A `PersistenceReceipt` binds Admission/G1/G2 hashes, `analysisFixpointHash` and `privateCorpusRevision` to Recipe ID, authored fingerprint, storage hash, DB/file hashes and initial lifecycle state; refs are not yet claimed. A versioned immutable `recipe-production-bindings.json` in the journal/snapshot maps Recipe ID to run/manifest/plan/cell/module/fixpoint/revision/fingerprint; implementation must not rely on `CreateRecipeItem.metadata` surviving `#prepareCreateData`.

Before contentReady, synchronously require:

- canonical module resolver injected on both main and Plugin strict paths; persisted `moduleName` must equal the Plan cell binding;
- canonical path/range set conservation across `sourceRefs`, `reasoning.sources`, retrieval provenance/sourceFieldRefs and `recipe_source_refs` (the reconciler currently derives bridges from `reasoning.sources`);
- a separate immutable `RefReconciliationReceipt` with zero missing/stale/drifted/out-of-project blockers and exact Recipe/file/ref hashes;
- strict `updateQuality` best-effort DB-first side effect disabled, or moved inside the same safe persistence/receipt boundary.

Only then is `contentReady(recipeId)` emitted for the current non-invalidated fixpoint/revision. The persistence implementation in Section 13 is a prerequisite, not a later optional phase.

The strict journal then closes the Producer collection, not merely its successful rows. For each final-fixpoint `survived|narrowed` hypothesis it writes one immutable `HypothesisExpressionSetReceiptV1` after every expression and zero-disposition row across all Producer versions has a terminal receipt. It proves:

- for every Producer version `v`, `recipeExpressionCount(v)=N≥0` and `zeroDispositionRowCount(v) = 1 iff N=0, else 0`; no version may contain both a zero-disposition row and Recipe expressions. Across all versions, `expressionRows = contentReady + reviewedMerge + reviewedDuplicate + rejected + repairSuperseded + failed + unknown`, and `zeroDispositionRows = reviewedNonDraft + rejected + repairSuperseded + failed + unknown`; each row appears exactly once and every repair child names one parent. Every reviewed merge/duplicate row additionally names its target expression/Recipe and admitted fingerprint;
- rejected/superseded rows remain auditable, while a rejected row alone cannot close its hypothesis; final hypothesis closure is exactly one of `expressed(contentReadyRecipeIds≥1)`, `represented-by(targetExpressionId,targetContentReadyRecipeId)` with matching Admission/fingerprint and a final content-ready target, independently reviewed `non-draft`, or blocking `failed|unknown`. A target that later fails G2/persistence/ref/contentReady returns the source hypothesis to unresolved;
- the final expression-set hash binds the non-invalidated AnalysisFixpoint, sealed private-corpus revision, Producer/model/SOP, all version/parent edges, G1/Admission/disposition/G2/Persistence/Ref receipts and exact content-ready IDs. A draft/disposition ID absent from the set, an unbound content-ready ID, a receipt from another/invalidated revision, duplicate terminal fate, missing repair child or terminal-head `unresolved>0` fails closure.

G3 may start only after every `survived|narrowed` Producer-eligible hypothesis from the **latest non-invalidated fixpoint** has one such immutable receipt, all expression/disposition rows across all versions are terminal, every eligible hypothesis has a blocking terminal closure, and the referenced physical private-corpus root contains no descendant of any invalidated fixpoint. Every final cluster separately has a reviewed terminal induction/zero-hypothesis disposition; refuted/zero branches require no fabricated Producer receipt. These receipts are append-only journal/AnalysisArtifact projections; they do not create another database, queue or model role.

### 11.8 Acceptance gates FACT/DISCOVERY/CONTENT

- Foundation artifact→anatomy/decomposition baseline→dimension-free direct/derived facts+witnesses→iterative schedule/multiscale population revisions→Analyst query/cluster/induction→hypothesis→claim-applicable enrolled falsification/disposition review→analysis fixpoint→Producer expression set→G1→Admission→expression disposition or G2→CreateRecipeItem→Persistence/Ref→contentReady→expression-set closure trace is lossless and hash-linked;
- every final fact/query obligation has one terminal receipt and every final population conserves raw/accepted/duplicate/excluded/error with typed reasons; required⊆baseline⊆final schedule and all revision parents/hashes reconcile. Missing backend/query, parser exception, timeout, truncation, source drift or denominator mismatch is failed/unknown and causes zero Producer calls for affected hypotheses;
- direct Fact IDs are independent of cell/dimension/query/view/scale order; multiple lens/parent bindings reuse one fact/population without duplicate authority records. Derived facts have exact rule+ordered-premise witnesses; missing/tampered premise, anchor or denominator fails;
- every observation is clustered/discarded/unresolved; unresolved blocks. Same-mechanism cross-lens observations cluster once; distinct mechanisms remain separate; variants/outliers/negative controls are retained;
- every Analyst zero-hypothesis and Producer non-drafting/merge/duplicate disposition has a matching independent `KnowledgeDispositionReviewV1`; every semantic observation discard does too unless exact-duplicate/policy-excluded; a fixture that labels a high-value cluster `no-value` or hides it behind an already-covered cell must fail;
- positive/negative/edge query and counterexample/scope-narrowing goldens pass; singleton/many→one/one→many/zero induction fixtures pass; every claim has a §4.3 counterquery applicability row, every required query is terminal, and claim strength never exceeds loaded authority. A schema-only/unproduced edge or unsupported semantic backend cannot pass;
- `derivedFindingCount=0`; one high-value single-file candidate can pass while a three-file generic candidate fails G2;
- stale source, forged/out-of-root range, wrong module, placeholder profile or private data cause zero content-ready output;
- process-quality proxy can trigger a typed owner-specific retry but cannot pass G2; every non-pass receipt names one owner, permitted mutation and resume state, with no generic skip/degrade;
- calibrated reviewer decisions match adjudicated goldens and invalid citations fail;
- producer/reviewer separation, accepted calibration and ≤2 semantic repairs are enforced across all repair entrypoints;
- serial canonical admission observes only the actual accepted private corpus; a rejected/revised predecessor cannot cause a later proposal to remain blocked, and replay cannot double-persist;
- a semantic G2 return invalidates the old AnalysisFixpoint and all descendant rows, rebuilds a fresh private-corpus revision from the complete replacement-fixpoint eligible set, and proves an old persisted Recipe cannot affect dedup, expression closure, G3 or the candidate snapshot;
- the replacement revision uses a distinct confined data-root/SQLite/file-root manifest; after the switch every strict repository open/read is bound to that handle and instrumentation proves zero old-root opens/reads. The latest sealed root alone supplies G3 and assembly;
- a crash at `PERSIST_PREPARED`, after file/DB durability or before `consumed` resumes with the same deterministic strict Recipe ID; exact state reconstructs one receipt, absence retries once by the same ID and divergence never creates a second Recipe;
- the real strict-internal Gateway→`#prepareCreateData`→`KnowledgeService.create` trace carries the journal-authorized prepared ID, reads back the same ID in DB/file/ref receipts and records zero UUID allocation; public/legacy requests containing an ID are rejected or ignored by their existing contract and cannot invoke the trusted path;
- changing pass ordinal, evidence set, candidate fingerprint, cluster/hypothesis ID or fixpoint seal cannot create a new repair allowance: causal parent edges preserve the root set and a child with `semanticRepairDepth>2` is rejected;
- Admission/G1/G2/Persistence fingerprints conserve the authored projection; storage-generated fields are checked only through `storageHash`, and refs only through `RefReconciliationReceipt`;
- exact ref-set and module-binding conservation passes before contentReady; every `survived|narrowed` Producer-eligible hypothesis then has one immutable expression-set receipt, every version conserves its 0..N expression rows and conditional zero-disposition row, every row has one terminal fate and terminal-head `unresolved=0` before G3; reviewed zero-induction/refuted branches remain Analyst dispositions and do not fabricate sets;
- a fixture with one valid Recipe in one cell and an independently accepted investigated-empty cell completes without hidden “at least 3” retry/filler; a zero Producer output without full population/induction/empty review remains unknown.

## 12. Runtime R4 — Coverage Closure Without G3/G4 Cycle

### 12.1 Exploration versus publication truth

Keep `coverage_ledger` grades/counts/path overlap for exploration and diagnosis. Strict publication uses two hash-linked immutable receipts, never a mutable “one receipt”:

- G3 writes `CandidateCoverageReceipt` with `candidateDisposition = covered-by-content-ready-candidate|investigated-empty|failed|unknown`. Covered cells bind content-ready IDs plus the exact lens→cluster→hypothesis→immutable expression-set→Recipe lineage and G1/Admission/disposition-or-G2/Persistence/Ref receipts; they do not claim serving readiness.
- After G4, final reconciliation computes `servingReady` over the sealed corpus and writes immutable `FinalCoverageBindingReceipt`. It references the exact candidate receipt/G4/data-manifest hashes and records `finalDisposition = covered-by-ready-recipe|investigated-empty|failed|unknown` plus the exact final Recipe ID/fingerprint mapping. The later tool-neutral snapshot validation and serving manifest may reference but never mutate it; public Recipe Map reads the exact hash only after CAS.

Both are immutable JSON in the snapshot's append-only metadata area, written by the Alembic strict finalizer from Core schemas and addressed by manifest hash. They are not a new coverage DB and never read `coverage_ledger` as publication truth. After CAS, Plugin's ordinary public resolver exposes a bounded Map summary plus continuation to the full final receipt; Map mount accounting remains separate.

`partial`, `thin`, `covered` grade, `exhausted=true`, low marginal yield or round cap are neither G3 candidate closure nor final publication decisions. `deferred` is absent in this demand.

### 12.2 InvestigatedEmptyDecision

Required fields:

- cell/manifest/fact-query-pack/baseline schedule/expansion-ledger head/final-expanded-schedule/lens-binding versions and inventory hash;
- every applicable question/lens, shared fact/query obligation, population denominator, cluster/induction disposition and eligible files/modules/symbols/edges/config/history units;
- fact/query execution and falsification receipts, variants/outliers/negative controls, negative evidence, continuation/truncation/timeout/backend status;
- reviewer identity, method/version/calibration, typed reason and verdict;
- query-suite and Analyst investigation closure, every observation/cluster/hypothesis disposition, and the reviewed conclusion that, **within the frozen inventory, accepted fact/query capabilities and this cell's lens bindings**, no hypothesis qualifying through falsification/G1/admission/G2 was found after bounded repairs.

Pass only when the final expanded schedule is sealed, every applicable final fact/query obligation is complete, all observations/clusters/hypotheses have typed independently reviewed non-qualifying dispositions, scan covers the denominator with no truncation/unresolved critical ref, required counterqueries complete, and an independent reviewer accepts negative-evidence sufficiency. `refuted` alone does not close a population if other members remain undisposed. It never proves global nonexistence. “LLM returned nothing”, an unreviewed zero/no-value disposition, zero cap, budget exhaustion, missing backend/query, partial population or agent-declared exhausted → `unknown`, never empty.

### 12.3 Execution shape

Do not use broad dimension fanout as coverage authority, but keep Analyst active until fixpoint. Harvest shared baseline facts in canonical analysis-unit order; buffer/canonicalize each population revision before Analyst decisions. Analyst works Plan questions/lenses and may submit bounded expansion requests; the compiler appends only deduplicated accepted obligations, then the next epoch revises populations/clusters/inductions/falsification. Producer starts only from the sealed final schedule/fixpoint and accepted cluster/hypothesis packets. Targeted repair revisits typed lineages and never changes source universe/cells/caps. Every authored attempt reserves the candidate cap; fact/query execution uses separate upper bounds. This preserves discovery breadth without duplicating facts or filling Recipes.

### 12.4 Acceptance gate G3

- the baseline schedule plus append-only accepted exploratory and counterquery expansions reconcile to `finalExpandedScheduleHash`; every final fact/query obligation has one terminal receipt, every final population revision is sealed and every cluster/hypothesis has one disposition/review; `finalScheduled = terminal` with no duplicate/missing fact identity or direct unregistered counterquery;
- every final cluster has a terminal reviewed induction/zero-hypothesis disposition; every `survived|narrowed` Producer-eligible hypothesis has one immutable `HypothesisExpressionSetReceiptV1`. Each Producer version conserves 0..N expression rows plus its mandatory zero-disposition row when N=0, every row has one terminal fate, rejected/superseded rows remain conserved, all repair links close, every merge/duplicate binds a matching final content-ready representative, and terminal-head `unresolved|failed|unknown=0` at the barrier. Refuted/zero-hypothesis branches do not fabricate sets;
- every planned cell has one immutable G3 disposition aggregated only after all its lens bindings close against the `AnalysisFixpointReceiptV1`, final population hashes and exact expression-set hashes;
- covered IDs all satisfy contentReady with matching fingerprints/source refs;
- investigated-empty has full frozen-inventory/final fact-query/counterquery obligation coverage, all matches disposed, no hidden truncation and independent review; it is scoped evidence, not proof of global nonexistence;
- no partial/exhausted/deferred/failed/unknown cell at the G3 barrier;
- candidate coverage receipt hash reconciles with Plan baseline hash, `finalExpandedScheduleHash`, analysis-fixpoint/expression-set hashes, candidate DB/files and Evidence Ledger; later final receipt must reference it without mutation;
- coverage write failure is blocking for strict finalizer even though legacy ledger writes remain advisory elsewhere.

## 13. Runtime R5 — Private Working Root And Durability Reconciliation

The capabilities in this section must land before Runtime R3 runs. At runtime, their initial write/ref operations create content-ready receipts before G3. Because `CandidateCoverageReceipt` already binds those exact DB/file/ref/binding hashes, the after-G3 reconciliation is **read-only verification** before candidate assembly. Any mismatch or needed repair invalidates that G3 receipt and returns to the exact pre-G3 persistence/ref/content-ready owner; only a newly computed G3 may proceed. Section order expresses ownership and final barrier, not permission to postpone or repair persistence after coverage.

### 13.1 Strict publication isolation

Before any real generation, strict publication mode must be implemented and controller-accepted. In strict mode:

- strict enrollment comes from the immutable accepted resolved-config receipt + project identity; `.asd/context/recipe-publications/marker.json` is the required second marker installed by supported migration/init in the allowlisted publication namespace. It is not `.asd/config.json` and cannot mutate provider/model configuration. Enrolled strict + matching marker + route null means Search/Prime/Map/Guard return typed knowledge-unavailable; enrolled strict + missing/corrupt/mismatched marker fails closed. Only an actually loaded, pre-reset-observed legacy binding + absent marker may use legacy resolution, including snapshot recovery proven by `ObservedPreResetPublicationModeReceipt`;
- Graph still reads source structure;
- the blank approved Ghost data root is the **base boundary**, not one mutable corpus shared by all fixpoints. Strict generation derives only confined children under the deterministic symbolic namespace `<approved-data-root>/.asd/context/recipe-runs/<runId>/corpora/<revision>/`; each leaf must be absent before allocation and records realpath/parent/no-symlink/root-manifest evidence;
- each leaf is initialized through a revision-scoped internal resolver factory that preserves the certified source `projectRoot`, project/scope identity, `knowledgeBaseDir` and folder conventions while overriding **only** the already-confined revision `dataRoot`. The factory must not register another Ghost project, rewrite source identity or expose a generic caller-selected data-root override. It calls Core `openAlembicDatabase({path: revisionResolver.databasePath},{workspaceResolver:revisionResolver,runMigrations:true})` with the accepted migration artifact, then verifies `migrationLedgerSemanticHash` (including migration 017 for BiliDili), SQLite integrity/FK, non-null accepted project/scope identity and the sanitized runtime config hash/credential-location symbol. The raw ledger with per-run `applied_at` is retained but not used for cross-revision equality. Provider/model secrets or config files are not copied; the handle references the immutable accepted config receipt;
- before Repository/Gateway construction, `PrivateCorpusRevisionInitReceiptV1` must also prove zero knowledge entries, refs, coverage, vector generations/routes and publication state plus empty Recipe/candidate directories. Only then may the same repository bundle, `KnowledgeFileWriter`/`WriteZone`, `KnowledgeService` and Gateway admission/dedup bind to that revision data root. A migration/identity/config/blank mismatch closes the DB, marks that leaf failed evidence and blocks replay; it is never repaired by manual DB edits or reused as a later revision;
- strict `admitCandidate()`/similarity/consolidation cannot call the current project-root file scan or a global repository. Their injected lookup must resolve only the current handle's repository/files and emit the inspected root hash. Any missing handle, global-container fallback, cross-revision open or source-root-as-knowledge-root use fails closed;
- all reachable ordinary MCP, daemon, CLI, HTTP, Dashboard and repository-reader entrypoints for both confirmed modes resolve knowledge only through one publication resolver;
- strict candidate DI disables/isolates `ConfidenceRouter`, `StagingManager`, legacy EventBus/index refresh, vector sync, `afterPublish`, automatic promotion and any reader/writer hook that can expose or mutate public/live knowledge. Final lifecycle activation is an explicit synchronous operation inside the private candidate assembly.

The implementation package must generate a reviewed reader/writer inventory from actual DI/route registration and prove every reachable current path is migrated or disabled in strict mode. Only genuinely unshipped future readers are out of scope; a current HTTP/Dashboard/repository path cannot be relabeled “future”. Legacy mode retains current behavior outside approved strict roots.

R0 acquires the external root-identity operation lock outside target/snapshot roots and retains it as the strict run lease through final CAS or recovery; this serializes mutable runs as well as reset/restore/CAS. Ordinary strict readers acquire its shared/read side (or observe an equivalent durable operation-state fence) before resolving data and return typed unavailable while the exclusive run lease is active. Owner token, heartbeat and journal prove same-run reentry/stale-lock recovery; deleting/replacing a lock path without proving owner death is forbidden.

### 13.2 File/DB correctness

Required changes:

- `KnowledgeFileWriter.persist`: write temp in destination dir → flush/fsync → atomic rename → fsync dir; delete an old different path only after new path is durable;
- `moveOnLifecycleChange`: never unlink old before new durable write; return failure explicitly;
- `KnowledgeService._lifecycleTransition`: null/false move blocks DB update;
- repair the actual `KnowledgeService`/Gateway/writer call chain and check every file-store return. `KnowledgeUnitOfWork` may be adapted/reused only if its behavior and production call path are independently proven; otherwise it remains unused and is not named as a guarantee;
- DB failure after durable file write emits typed divergence and an idempotent repair receipt; file failure never commits DB;
- strict Gateway consolidation/reviewer failure cannot fallback to direct acceptance.
- strict quality/lifecycle changes use the same safe boundary; the current best-effort `updateQuality` path cannot mutate a strict Recipe outside its PersistenceReceipt.

Gateway may still create items independently inside the **current revision-scoped** repository stack. On invalidation, the runner fsyncs/closes it, writes the immutable root manifest, makes the root evidence-only and atomically installs a newly allocated handle in the strict internal container before any replay. It never copies old DB/files forward. Finalization is session-atomic because only reconciled items from the latest sealed root are materialized, not because every generation attempt is one SQLite transaction.

### 13.3 Awaited refs and journal

Alembic must implement one durable idempotent strict journal matching Section 6. Its authority is the append-only log under the external evidence/operation-state root: header before any target mutation; snapshot/reset/blank/facts rows next; `PLAN_ACCEPTED`; then `MANIFEST_BOUND`. Target/snapshot copies are hash-linked projections only. It records each independently verified consumer projection receipt, awaits `SourceRefReconciler` per Recipe before content-ready and rechecks before assembly, records missing/stale/drifted/out-of-project blockers, and rejects any final Recipe with blocker. Existing fire-and-forget consumers may remain for legacy mode but are not strict completion evidence.

### 13.4 Acceptance gate DURABLE

- write/rename/fsync/DB/ref/journal faults injected one at a time;
- old file is never lost before replacement; failed file op never advances DB lifecycle;
- retry produces no duplicate Recipe/ref and resumes from last durable journal receipt;
- candidate DB/files/refs hashes reconcile exactly;
- every current-revision repository/file/similarity open carries the accepted `PrivateCorpusRevisionHandleV1` and matching init receipt; an invalidated-root open/read count is zero after switch, each revision's `migrationLedgerSemanticHash`/config/identity/initial-blank hashes match the accepted bundle while raw `applied_at` may differ, root/DB/file hashes differ across revisions, and only the latest sealed root is an assembly input;
- after-G3 reconciliation performs zero repair/write. A mismatch invalidates `CandidateCoverageReceipt`, routes to the typed pre-G3 owner, and requires G3 recomputation before assembly;
- every current reachable reader/writer/hook appears in the strict isolation inventory; route-null probes prove no working item is visible and no automatic lifecycle/index/public side effect ran;
- partial Gateway results remain private and are either repaired/rejected or omitted from serving snapshot.

## 14. Runtime R6 — Candidate Assembly, Sparse/Vector, Seal And G4

### 14.1 Candidate assembly, then immutable data-bundle seal

After G3, materialize the content-ready candidate corpus under a fixed confined publication namespace, for example:

```text
.asd/context/recipe-publications/
  active.json
  snapshots/<snapshotId>/
    manifest.json
    data/.asd/alembic.db
    data/.asd/config.json
    data/.asd/context/recipe-vector-generations/...
    data/<Recipe files>
```

The snapshot begins as a **private mutable assembly** opened only from the latest sealed `PrivateCorpusRevisionHandleV1`, containing only its content-ready IDs and dependent refs, strict production bindings, G3 coverage and provenance. Invalidated revision roots remain working evidence and are neither mounted nor scanned. Current `KnowledgeService.create` starts entries pending, so the explicit finalizer must synchronously transition every qualified Recipe to existing `Lifecycle.ACTIVE`, clear/reset all staging-only fields incompatible with active according to the current schema, safely persist file+DB, and emit a `LifecycleActivationReceipt`. It then builds sparse verification and the first vector generation from that exact active ID/entry set and runs DB/file/ref/coverage/vector conservation. Legacy automatic promotion/hooks remain disabled.

Only after all build writes finish does the finalizer checkpoint WAL, verify FK/integrity, hash every file and write `candidate-data-manifest.json`; then it seals the `data/` subtree immutable. G4、serving reconciliation/final coverage 和 tool-neutral serving validation 都只读该 sealed bundle。Versioned receipts and the eventual serving manifest live in a separate append-only metadata area and may only reference the sealed data hash. Failure before seal discards/rebuilds the assembly；failure after seal creates a new snapshot ID rather than mutating data。After G4，final reconciliation writes the immutable final coverage receipt；the finalizer then validates the Core serving contract and writes a serving manifest referencing the unchanged data manifest plus sparse、vector、G4、final-coverage 和 validation receipts。No data-bundle content is mutated after seal or before public CAS。

### 14.2 SparseVerificationReceipt

Create a fresh existing `SearchEngine` over the assembled exact candidate DB, run it read-only again after seal, and record:

- scorer/projection/config version/hash;
- corpus Recipe IDs and document-set/source-content hashes;
- exact/semantic-fallback/negative-intent and known “coverage” confusion fixtures;
- deterministic result IDs/ranks within declared tolerance;
- no write performed.

There is no sparse generation ID/pointer. BM25 remains unsupported unless separately implemented and approved.

### 14.3 Vector generation

Reuse Core `RecipeVectorGenerationManager`, which already accepts explicit entries and implements shadow/build/inspect/CAS. The strict path feeds only the exact qualified candidate entry set during assembly, explicitly builds/inspects the first generation and records the assembly-local active generation before seal. It must not call the current runtime rebuild that queries every non-deprecated working row, and it never accepts `maintain()` returning `planned`.

Unify:

- Alembic `.asd/context/recipe-vector-active.json` route;
- Plugin generation runtime route/store;
- public `read-only-search-snapshot.ts`, currently tied to legacy `vector_index.asvec`.

The serving snapshot manifest names exactly one generation ID/hash/store. Public Search/Prime must prove they load it.

### 14.4 G4 serving/public-schema readiness

G4 runs after the data bundle is sealed and requires:

- every final Recipe passes existing retrieval readiness, profile/usage/source hash and `LifecycleActivationReceipt`; serving DB query proves lifecycle exactly active and no incompatible staging field;
- candidate DB contains only formerly content-ready items that were synchronously activated inside assembly, plus exact dependent refs/G3 coverage; G4 proves all inputs required by the next servingReady reconciliation are present without changing the sealed bundle;
- sparse receipt healthy;
- vector expected IDs exactly equal present IDs; no missing/orphan/stale/duplicate/dimension/model/corpus hash mismatch;
- concrete DB/vector adapter constructors validate fixed-root confinement plus DB/config/vector/manifest hashes without a Plugin/candidate context;
- serialized Recipe/publication payloads validate against the Core serving manifest/route contracts, but G4 invokes no MCP handler or public reader;
- Graph live source revision still matches certified Plan revision.

G4 does not execute or depend on a Plugin/public consumer and does not write the final coverage receipt. A G4 pass only unlocks the separate, deterministic `SERVING_RECONCILED → FINAL_COVERAGE_BOUND → SERVING_SNAPSHOT_VALIDATED` transitions.

### 14.5 Acceptance gate INDEX/G4

- corruption of DB/config/Recipe/vector/manifest fails closed;
- first generation is ready/healthy, not planned;
- direct sealed-bundle vector adapter/load receipt resolves the exact healthy generation ID/hash; Search/Prime `vectorUsed` behavior is not called here and is proved by the CAS 后真实 Plugin/Test oracle；
- sparse goldens include negative intent and reject generic coverage confusion;
- sealed candidate/final snapshot contains no rejected/non-content-ready input and no non-serving-ready final Recipe;
- serving DB contains zero non-active Recipe rows and zero Recipe IDs missing a lifecycle receipt;
- no final public query is used to prove pre-CAS readiness.

## 15. Runtime R7 — Tool-Neutral Serving Admission And Final Public CAS

### 15.1 Sole runtime owner and code boundary

Alembic's existing strict finalizer path is the sole R7 coordinator and journal/CAS owner. It consumes the sealed R6 bundle and Core publication contracts; it does **not** import AlembicPlugin, call `EmbeddedToolExecutor`, construct a Plugin `ToolExecutionContext`, or expose a pre-CAS reader. `Alembic/lib/recipe-pipeline/generate/strict/StrictPrivateCorpusRuntime.ts#runCandidateFiveToolOracle` is code-truth evidence of repository CRUD+sparse/vector probes only and must be renamed/re-scoped or retired from the strict path rather than presented as formal five-tool execution. `Alembic/test/unit/ResidentServiceBoundary.test.ts` remains a hard boundary: Codex-facing MCP ownership stays in Plugin.

The smallest new logical result is `ServingSnapshotValidationReceipt`, implemented as a strict-journal/finalizer receipt over existing Core `ServingSnapshotManifestV1`/`PublicKnowledgeRouteV1` and repository/vector contracts, not as a new service or public API. It binds:

- run/session/snapshot ID plus candidate-data, G3, G4 and immutable final-coverage hashes;
- exact serving-ready Recipe IDs/fingerprints, lifecycle receipts, DB/file/ref/coverage conservation hashes and zero rejected/staging/unready members;
- sparse verification and exact healthy vector generation ID/manifest/model/dimensions/load receipt;
- certified source/project/scope identity, source-vector hash, Plan/fact-query/fixpoint/expression-set lineage and strict marker/config schema versions;
- Core serving-manifest/public-route schema versions and a deterministic validation verdict with typed failed predicate.

The validator receives already-resolved internal repository/vector objects from the strict finalizer DI. It accepts no arbitrary root/path and creates no reader handle. Existing `SparseVerificationReceipt` supplies exact/semantic-fallback/negative-intent and coverage-confusion service-level canaries; no result is labeled a formal Search/Prime/Map/Guard response. Graph is absent from this receipt because it is live-source and Recipe-free.

### 15.2 Final binding, validation and serving-manifest order

1. after G4, deterministically reconcile every sealed candidate from contentReady to servingReady and verify final DB/file/ref/sparse/vector identity without a public query;
2. write and seal immutable `FinalCoverageBindingReceipt`, hash-linked to the exact G3 receipt, G4 receipt and candidate data manifest; any `failed|unknown` final disposition blocks;
3. execute tool-neutral serving validation over that exact sealed bundle and durably append `SERVING_SNAPSHOT_VALIDATED` with `ServingSnapshotValidationReceipt`; failure names the deterministic owner/predicate and leaves the snapshot private;
4. write the immutable serving snapshot manifest referencing the unchanged data manifest, ProjectContext/Plan/fact-query pack/baseline schedule/expansion-ledger head/`finalExpandedScheduleHash`/analysis-fixpoint/hypothesis-expression-set/final CodeFactGeneration lineage, G3/G4/final-coverage/validation receipts and vector generation;
5. only this complete manifest may enter `PUBLIC_CAS_PREPARED`.

No formal five-tool handler runs before CAS. Plugin compatibility is independently proven at I8 against exact accepted Core/Main/Plugin artifacts and versioned serving fixtures. The first full formal Search/Graph/Recipe Map/Prime/Guard matrix over each real scenario runs after CAS in Test; it is required for final requirement acceptance but is not a producer-side candidate predicate.

### 15.3 PublicKnowledgeRoute

`active.json` contains only:

- schema version;
- session ID and snapshot ID;
- final serving snapshot manifest hash;
- vector generation ID and manifest hash;
- certified project facts hash and source revision vector hash;
- Plan cognition lineage, compiled Plan, fact-query catalog, required applicability universe, baseline harvest/lens schedule, expansion-ledger head, `finalExpandedScheduleHash`, analysis-fixpoint, hypothesis-expression-set and final CodeFactGeneration manifest hashes;
- committed timestamp outside the **semantic** hash but fixed before `PUBLIC_CAS_PREPARED`; it is included in the canonical route bytes and their byte hash.

It contains no arbitrary path and no Recipe/ref/coverage/sparse generation IDs. Resolver derives a confined path from snapshot ID.

Final CAS algorithm:

1. after `FINAL_COVERAGE_BOUND`, `SERVING_SNAPSHOT_VALIDATED` and `SERVING_MANIFEST_READY`, fix the timestamp and build the complete canonical next-route bytes. Durably append `PUBLIC_CAS_PREPARED` with the full bytes (or immutable content-addressed ref), `routeBytesHash` over **all** bytes including timestamp, and a separate semantic hash. The run's activation expectation is the post-blank `null` value, never the observed pre-reset route;
2. verify/re-enter the same run's external operation-lock lease, then acquire the exclusive route lock in the declared order; whole-root restore/reset cannot replace the lock authority. In the full strict protocol another run is stopped at this outer lease and cannot concurrently reach route CAS;
3. **inside both locks**, re-read `active.json`. If null, compare succeeds. If its canonical bytes and `routeBytesHash` exactly equal the durable prepared bytes, treat this as rename-succeeded/receipt-missing crash recovery. Semantic-hash equality with different timestamp/metadata/bytes is still conflict/drift;
4. still inside the lock, verify strict marker, candidate data, final serving manifest, serving-validation, source-vector and reconciliation hashes again;
5. when current is null, temp-write in the route directory → file fsync → atomic rename → parent-directory fsync → read back and compare exact payload;
6. durably append CAS receipt/`PUBLIC_CAS_COMMITTED`, release route then operation lock, then mark finalized. If a crash occurs after rename but before receipt, the exact-payload branch reconstructs the winner receipt idempotently;
7. ordinary product smoke may remain diagnostic, but the later Test five-tool matrix is a mandatory final-acceptance stage; a Test failure triggers scenario recovery/cleanup and owner repair rather than retroactively changing CAS atomicity.

### 15.4 Acceptance gate PUBLIC

- strict mode route=null: Search/Prime/Map/Guard knowledge-unavailable; Graph source structure works;
- no product transport or Main internal API can construct a candidate context because no such context/reader is introduced;
- Main package/runtime introduces no AlembicPlugin dependency, and Plugin introduces no Main reverse dependency for private candidate access; I8 compatibility uses versioned serving fixtures only;
- the full-protocol two-run fixture yields one operation-lease owner and one outer-lock loser before CAS. Separately, the isolated `PublicKnowledgeRouteStore` compare-null primitive is raced with two synthetic prepared payloads and yields exactly one null→payload winner; this lower-level fixture never authorizes two full runs to bypass the operation lease;
- crash after `PUBLIC_CAS_PREPARED`, after rename and before receipt, and after receipt has a deterministic null/exact-payload/other-payload outcome;
- CAS/route/manifest hash tampering fails closed;
- after CAS, Search/Prime/Map/Guard report one session/snapshot/vector provenance; Graph reports same publication session provenance but returns no Recipe/mount;
- Map mount accounting and coverage closure remain separate fields;
- public call does not write working or snapshot data.

## 16. Public Five MCP Acceptance Oracles

| Tool | Positive oracle | Negative/failure oracle | Code landing |
| --- | --- | --- | --- |
| Search | project-specific exact/semantic query returns serving Recipe, source trace, usage and selected vector generation | staging/unready/deprecated/drift/cross-project absent; negative intent honored; “项目知识覆盖” does not return generic unit-test coverage | `AlembicCore/src/service/search/SearchEngine.ts`, `AlembicCore/src/repository/search/SearchRepoAdapter.ts`; Plugin search executor/snapshot |
| Graph | complete repo/package/module/dependency/source orientation; refs/continuation/fingerprint | no Recipe fields/mounts; omitted/failed repo is partial/fail, not fabricated; script nodes excluded | `ProjectGraphProvider.ts`, Graph executor |
| Recipe Map | ProjectContext region plus stable mounts for all and only snapshot Recipes | mount conservation not labeled project coverage; no staging/deferred/script pollution | recipe-map handler/executor |
| Prime | schema-valid actionable knowledge pack with publication, Recipe, usage, source and negative boundaries | missing required evidence returns degraded/fail, never malformed/empty success | Prime pipeline/executor, same Search resolver |
| Guard | explicit file/overlay valid and violation cases use ready rule Recipes | missing/unreadable/out-of-root/incomplete knowledge never silently passes; snapshot remains read-only | Guard engine/code-guard executor |

I8 runs schema/handler/fixture compatibility against the exact accepted Plugin/Core/Main artifact combination without reading a run-private candidate. T6 then runs this complete matrix through the ordinary public route after CAS for every real scenario. Graph success never depends on Recipe count or mounts, and no pre-CAS result may be labeled a formal five-tool pass.

## 17. Failure, Compensation And Recovery

| Failure point | Required state/result |
| --- | --- |
| artifact/config/source drift before mutation | blocked; no root write |
| current V1 authority requires post-quiesce canonical equality to pre-quiesce `rootTreeHash` | superseded for every new strict run; never retry the impossible equality or weaken whole-root hashing. Use V2 authority + post-quiesce receipt |
| ready daemon causes strict action to short-circuit, or supervisor kills/restarts writer before external lease/header | ordering violation; no snapshot/reset. Strict action classification and child-PID readiness must be repaired before retry |
| quiesce authentication/root identity/request hash conflict | reject before shutdown; existing writer remains live, journal records typed conflict, no SIGKILL/snapshot/reset |
| quiesce accepted but ack/old-PID exit/checkpoint/post-observation times out or fails | blocked at exact journal stage; no forced kill followed by snapshot. Fresh process retries/waits using the same request hash or returns operator-visible failure |
| post-quiesce changed path exceeds exact volatile policy, DB/WAL/SHM state is unverified, or pre-quiesce hash is used as snapshot expected value | contract failure; no snapshot/reset. Unknown delta is not allowlisted |
| snapshot/restore mismatch against `QuiescedPreResetObservationReceiptV1.rootTreeHash` | rebuild blocked; no reset |
| pristine planned-absent path cannot be proven or post-init target realpath differs | blocked/fail before ProjectContext; never create early or fall back to reset |
| extra reset target or residual target | fail closed; restore snapshot if mutation began |
| enrollment/marker mismatch or marker deletion | config drift/fail closed for strict root, regardless of route null/active; no legacy fallback |
| marker path escapes dedicated publication namespace or provider/model config changes during marker install | unauthorized mutation/config drift; stop and restore/discard by scenario |
| external strict journal header missing/inside target-or-snapshot/not durable before quiesce/first mutation | recovery authority absent; stop before mutation or restore/discard if detected after fault |
| operation-lock owner crash | recover only from owner/heartbeat/journal proof; readers/CAS remain fenced until recovery receipt |
| at `BlankStateReceipt`, public/vector route non-null | `BLANK_POINTER_DRIFT`; no capture/Plan. A later private assembly vector route is expected and not this fault |
| ProjectContext/readiness failure | typed PC-F owner (`Core|Alembic|Plugin`); no Plan/DeepSeek; pristine root discard, rebuild snapshot restore if already reset |
| facts lease crash/replay | same Foundation `runId` reopens the artifact; different run conflicts. Five consumer receipts are separate. Same-run different journal/plan fails the proposed orchestrator binding; no recollection |
| Plan decomposition/tool/ref/priority/within-cap allocation defect | typed Plan revise, max 2; resume Plan validation with facts/hard caps unchanged; no fact generation |
| backend/config/capability missing or required schedule exceeds hard cap | owning product/config/controller blocked via `PLAN_SCALE_UNSUPPORTED` or `MINING_SCALE_UNSUPPORTED`; Plan cannot shrink scope or invent capability |
| fact backend/parser/query missing, timeout, truncation, denominator/witness mismatch or source drift | typed owning backend/orchestrator return; obligation/population `failed\|unknown`; no affected Analyst inference/Producer and never investigated-empty |
| counterquery finds contradiction | typed Analyst return in current epoch; hypothesis narrows/splits or is refuted; model cannot retain the broader claim |
| counterquery missing enrollment, direct executor call or incomplete terminal receipt | hypothesis `unknown`; final schedule/fixpoint fails; no DraftProposal or coverage closure |
| Producer version violates 0..N/conditional-zero-row conservation; expression/disposition row absent, duplicated fate or broken repair parent; merge/duplicate target not final content-ready; a Producer-eligible hypothesis has no terminal closure; or a refuted/zero-induction branch fabricates an expression set | expression/induction conservation failure; no G3 |
| G1 authored-expression defect | typed Producer bounded repair or reject; facts/hypothesis immutable and no content-ready |
| G2 mechanism/novelty defect rooted in hypothesis, reviewer/calibration failure | mechanism/novelty appends `ANALYSIS_FIXPOINT_INVALIDATED`, makes all old-fixpoint descendants evidence-only, returns to Analyst/new fixpoint, then rebuilds/replays a fresh private-corpus revision from empty; reviewer/calibration blocks its owner; Producer paraphrase or stale corpus reuse cannot pass it |
| serial admission proposal revised/rejected | no write; next canonical proposal observes the actual accepted corpus and cannot remain blocked by a rejected predecessor |
| crash from `PERSIST_PREPARED` through persist-before-consumed | query the journal-authorized deterministic strict Recipe ID and expected DB/file hashes; reconstruct or retry that same ID through the trusted internal Gateway path, assert actual=prepared and strict UUID allocation=0, or report divergence; never allocate a second ID or expose public caller ID injection |
| third semantic repair after pass/evidence/fingerprint/cluster/hypothesis/fixpoint change | causal parent/root-set check yields `semanticRepairDepth>2`; reject, and no new ID/seal can reset it |
| investigated-empty insufficient | cell unknown; barrier blocked |
| file/DB/ref/coverage failure | typed deterministic owner/journal resume; no LLM retry, snapshot or CAS; compensate or restore by scenario |
| sparse/vector/G4/tool-neutral serving validation failure | typed Core/Alembic predicate and journal resume; content corpus stays sealed unless the exact failed predicate invalidates it; snapshot remains private, no CAS |
| I8 Plugin serving-contract/schema/handler compatibility failure | blocks Plugin artifact acceptance and Test start; return to Plugin or shared-contract owner. It does not call Main candidate regeneration unless the evidence identifies a real manifest-contract defect |
| pre-CAS pristine failure | public null; preserve evidence, discard only demand-owned root |
| pre-CAS authorized-rebuild failure | old session is **not** presumed visible; recover/re-enter the external operation run lease, prove no committed route for this run, restore the exact post-quiesce snapshot and verify its receipt **before** starting normal runtime; never restore stale PID/token/state. Normal runtime then creates fresh control state and restore/reselect proves DB/file/vector/public-route/migration-ledger plus resolver-artifact/config/enrollment/marker interpretation and bounded baseline-read equality against the observed pre-reset contract before prior data can be served or the run resumes |
| restore/CAS race or CAS crash/conflict | external operation lock serializes full restore/reset/CAS runs, so the outer loser never reaches CAS. Route null may retry; only exact prepared canonical bytes/byte-hash reconstruct the winner receipt; same semantic hash with different timestamp/metadata or any other payload is conflict. An isolated route-store primitive race still proves two synthetic null contenders yield one winner/one loser |
| T6 post-CAS public five-tool failure | Test/product failure; preserve exact public evidence, fence readers, then discard pristine root or restore authorized-rebuild snapshot under the operation lock; return defect to the handler/shared-contract/data owner and rerun controller acceptance plus affected Test rows. CAS atomicity still means no partial new session, not that the requirement passed |

For authorized destructive rebuild, public knowledge is unavailable from reset until new CAS. Atomicity means “no partial new session,” not zero downtime. Future non-destructive shadow rebuild is outside this demand.

### 17.1 Strict external setup execute/recover/complete table

All recovery runs in a fresh process against the one external journal and the existing root-identity lease. `execute`, `recover` and `complete` are classified before ordinary daemon ready handling and can never return an ordinary ready-success result.

| Durable journal stage | `execute` / crash state | Fresh-process `recover` | `complete` eligibility |
| --- | --- | --- | --- |
| before `EXTERNAL_LEASE_HELD` | no authorized target mutation | revalidate authority/path/artifacts; acquire the existing lease or report conflict | forbidden |
| `EXTERNAL_LEASE_HELD`, before `JOURNAL_HEADER_DURABLE` | no quiesce/target mutation | write/readback/fsync the same V2 header or release a provably unused lease | forbidden |
| header durable, before `QUIESCE_REQUESTED` | old writer may remain live | revalidate same run/authority/header and send the one canonical request | forbidden |
| request sent, no accepted ack | delivery outcome unknown | retry the same request hash idempotently; same ack is accepted, conflicting request blocks; do not kill | forbidden |
| `QUIESCE_ACCEPTED`, writer draining | wait bounded for exact old PID exit and shutdown/checkpoint completion | resume wait/health/state checks from journal; timeout remains blocked and snapshot prohibited | forbidden |
| old PID dead, no `QUIESCED_OBSERVED` | target is stable but unauthoritative for snapshot | verify exact control-file delta and DB checkpoint/WAL/SHM state, then mint the same canonical post-quiesce receipt; mismatch blocks | forbidden |
| `QUIESCED_OBSERVED`, no snapshot | authorized rebuild target must still match receipt; pristine absence remains typed | snapshot the exact whole-root hash; discard/recreate only a partial run-owned snapshot leaf. If target drifted, fail before reset | forbidden |
| `SNAPSHOT_VERIFIED`, before reset | old runtime is stopped, public data files still exist but availability is not promised | verify snapshot+target unchanged; abort may restart normal runtime with fresh control state after exact verification | forbidden |
| reset/quarantine/mutation begun, before new public CAS | public route is null for this contract | close handles, exact-restore post-quiesce snapshot, verify whole-root/DB/pointers, then start normal runtime to create fresh PID/state/token and prove observed reader-mode baseline | forbidden |
| `PUBLIC_CAS_COMMITTED`, before `FINALIZED` | new session route is already atomic | verify exact prepared route/manifest/receipts; reconstruct missing committed/finalized receipt only for byte-identical winner | allowed only after every prior state and route readback passes |
| `FINALIZED` | terminal | idempotent readback only; no target mutation | returns the same final receipt |

`pristine-init` has no prior runtime/snapshot: a pre-CAS failure keeps public null and discards only the demand-owned root. Authorized rebuild recovery availability comes from the verified snapshot plus normal-runtime re-establishment, not from restoring daemon control files or claiming the old session stayed online.

## 18. Per-Window Sequential Package Plan And Controller Acceptance

### 18.0 I1–I2 opening PC-F gate and final-artifact regression — Core, Alembic, Plugin

In the **existing single demand/state root**, this was the opening strong gate and remains a mandatory final-artifact regression invariant. The historical package sequence has advanced beyond it; revision 154 does not reopen a second prerequisite demand or authorize concurrent reruns. The one product window/worktree per repository remains authoritative:

- **Core:** preserve the accepted Foundation substrate, then close newly verified PC-F gaps: strict-v2 projection authority, repo×request×language/parser audit coverage, owner provenance/ambiguity, canonical relative-root and inventory/ref/error conservation. Audit placeholder projections cannot be accepted; the 5000/400 raw Plan scanner remains an explicit strict-zero entry.
- **Alembic:** Main Plan/generation/AiDimension/dependency graph/ModuleService adapters and actual workflow/Generate session persistence reopen the Core artifact; `ProjectMapModules` Package.swift/raw scan and legacy 12/80-capped module projections are explicit bypass rows. Core/raw collector, synthetic ProjectScope and filesystem/capped fallback counts are zero. Incremental rescan/legacy snapshot rows are applicable or typed-unreachable N/A.
- **Plugin:** Plan/cold-start/dimension-completion/ModuleService adapters, `tool-router.resolveSubmitKnowledgeModuleAxis` and HostAgent session reopen the same artifact; missing submit axis fails closed, and legacy 24-cap/empty-axis/Core-passthrough counters are zero. Knowledge rescan is applicable or typed-unreachable N/A. Live Graph/region remain Recipe-free; fix terminal/progress distinction, duplicate scoped paths and script-as-repo. Map separates mount accounting from project coverage and reports honest per-type continuation; `.gitmodules` is only a probe.

The accepted baseline/final regression remains valid only with accepted load hashes; repo×nine-request×language/parser rows; full entry inventory; five actual-consumer projection receipts; terminal Graph/region/Map truth receipts; MR5/5 and SP root+4; inventory/detail/ref/owner conservation; full chunks/continuation; lease/replay; mutation/differential/fresh-process probes; and all four counters `unclassifiedEntries=0`, `unknownCriticalCapabilities=0`, `requiredRequestFailedOrPartial=0`, `openConfirmedDefects=0`. Revision 154 changes no ProjectContext product decision, but final rebuilt artifacts must rerun this evidence before Test.

For Core, Alembic or Plugin, later scope can be created only as a `NEXT combined package` after that repository's prior package is reviewed and global PC-F is accepted. At most one package for a repository is in flight. The next-package start receipt verifies that the same demand worktree still contains the accepted PC-F commit/tree and capability contract; a replacement base invalidates next-package start.

Current minimal landing for revision 154:

| Window | Current package | Binary producer/consumer gate |
| --- | --- | --- |
| Alembic | one NEXT combined package for V2 authority/header, strict-action dispatch, existing-daemon authenticated quiesce, post-quiesce receipt, snapshot/reset and fresh-process recovery | consumes existing authority/daemon/shutdown/checkpoint/lock/journal surfaces; emits §8/§17 receipts and passes §18.3 acceptance |
| AlembicCore / AlembicAgent / AlembicPlugin / Dashboard | no current package | `not-applicable` unless implementation proves an existing shared exported contract must change; Plugin five tools remain post-CAS and Test is not pulled into setup |
| Controller | review Alembic raw evidence, rerun cross-chain/PC-F regression, rebuild and verify exact RuntimeArtifactManifest | all revised non-Test targets accepted before any Test eligibility |
| Test | paused, no task/card/dispatch | starts only after controller gates and a fresh explicit user start/cooperation signal |

### 18.1 AlembicCore — producer contracts

**designIntent:** 复用并修正现有 ProjectContext Foundation、ProjectContextRef/relations 和 PlanIntent 合同，在 Core 单源内补齐 Plan compiler、dimension-free/multiscale fact-population lineage、coverage、persistence、vector 和 publication contracts；不复制认知 Agent、semantic graph 或 Pattern DB。

Implementation package:

- extend existing `service/project-context/foundation/*` only for independent `ProjectScopeManifestV1`, sealed base certification followed by post-open strict-v2 projection/lineage receipts, V2 selector+`canonicalScopeHash`+language/parser/surface row identity/index/readiness, all-eligible frozen blob refs, resolvable detail continuation and request/owner/read/ref conservation; do not recreate capture/store/readiness/lease;
- extend existing `plan/intent/contracts.ts`/`PlanNextAction` for the strict cognition projection; add deterministic compiler, `ModulePlanningFactsV1`, anatomy/fact-query catalog, non-removable `RequiredFactApplicabilityUniverseV1` and universe/exclusion hashes, `ColdStartPlanSelectionV2`, baseline dimension-free harvest + lens-binding schedule, expansion validation/final-expanded-schedule schemas and an execution projection that preserves question DAG/tool/priority/budget allocation;
- add minimal schemas/canonicalizers for canonical-subject `FactRecord`, direct/derived witness, multiscale `HostAgentAnalysisUnit` projection, ObservationPopulation, KnowledgeCluster, Induction/Falsification, purpose-tagged expansion validation, `TypedGateReturnV1`, `HypothesisExpressionSetReceiptV1`, `PrivateCorpusRevisionInitReceiptV1` and `PrivateCorpusRevisionHandleV1`; add only the journal fields/transitions needed to bind/invalidate `analysisFixpointHash`, allocate/confine/initialize/seal a revision root and reject cross-revision opens. Extend `WorkspaceResolver` only with a restricted internal revision factory preserving source/scope identity and use existing `openAlembicDatabase`/accepted migrations plus Repository/Gateway/KnowledgeService/WriteZone. Reuse `ProjectContextRef`/relation anchors and existing Evidence Ledger IDs. Semantic projections live in extended AnalysisArtifact/evidence bundles and Alembic's proposed single strict journal stores recovery state. Do not require a new graph, proof engine, corpus service, generic data-root override, revision column/filter across every query or mining service per receipt;
- strict `evidence-bounded-no-floor` authoring policy across catalog/SOP/completion/briefing/tracker assets;
- Evidence Ledger fact/query metadata, serial strict-journal admission receipts, `PERSIST_PREPARED` deterministic-ID recovery, two-stage Gateway methods including one journal-token-authorized internal prepared-ID path through `#prepareCreateData` (never a public caller field), fingerprint projections, separate persistence/ref receipts, production binding and obligation-aware immutable coverage receipt schemas;
- deterministic G1 allowlist and existing retrieval readiness; repair the actual writer/KnowledgeService/lifecycle/quality path (UoW only if adapted and proven);
- reuse vector manager explicit-entry build/inspect; public route/snapshot/strict-marker types without local path knowledge.

Controller acceptance:

- `npm run check` passes;
- same-demand repository revision at NEXT-package start contains the accepted PC-F lineage; targeted Plan anatomy/decomposition/tool/priority/budget conservation, Fact-ID view/scale/dimension independence, direct-anchor/derived-witness replay, population long-tail/conservation, cluster/induction singleton/many-one/one-many/zero, query/counterexample, clean-vs-incremental equality, Gateway/retrieval, coverage, writer/lifecycle/quality fault and vector tests pass;
- raw tests prove no duplicate catalog/store/graph/proof engine and no claimed but disconnected transaction path; schema-only edge kinds cannot appear without a loaded producer; an unenrolled counterquery cannot execute, missing/truncated backend fails closed, every non-pass has one owner/resume point, every hypothesis/expression version conserves one terminal fate, serial admission does not retain a rejected predecessor, a later semantic re-fixpoint uses a distinct absent-before-create revision data root whose init receipt has accepted migrations/identity/config/blank state and cannot open/read the old DB/files, and persist-before-consumed crash reuses the prepared ID with zero strict UUID allocation/no public ID injection and cannot create a second Recipe in the accepted revision;
- public API/package artifact hash and consumer compatibility accepted.

### 18.2 AlembicAgent — producer and independent reviewer

**designIntent:** 让 Plan/Analyst/Producer 三个 DeepSeek 角色分别主导调查策略、主动模式理解和0/1/N知识表达；所有角色受 certified facts、population/cluster lineage和独立review约束，既不降成模板填充，也不获得事实/通过自证权。

Implementation package:

- refactor `PlanAgentRun.ts` to emit an extended existing `PlanIntent`/`PlanNextAction` receipt containing question/subquestion DAG, anatomy/subject/scale bindings, selected frozen capability/query IDs, priorities, within-cap breadth/expansion/counterquery allocation, evidence/counterevidence and stop/escalate; remove silent top20 and direct executable selection in strict mode. Keep Plan runtime no-tool if desired: tool choice is a structured later-execution plan, not a live Plan action;
- propagate manifest/plan-cognition/question/lens/fact-query/population/cluster/hypothesis/revision/evidence context through all whitelists;
- modify `analysisArtifact.ts` and ActiveContext to carry canonical subject/scale, witness, population/cluster/induction/hypothesis/falsification semantic projections while referencing immutable Evidence Ledger IDs; keep raw EvidenceLedgerStore as tool evidence and put premise/denominator lineage in the companion fact/query receipt. Require `derivedFindingCount=0`, immutable facts/full chunks and zero post-hoc live reads;
- extend Agent-owned `src/agent/strategies/PipelineStrategy.ts` and its existing capability/stage/gate interfaces for Plan-cognition lineage, iterative analysis epochs, bounded expansion, fixpoint, disposition-review state and typed owner/resume returns; strict mode removes `skipOnFail`/generic degrade. Alembic invokes these interfaces and does not build a parallel orchestrator;
- remove strict-path floors/filler across analyst/producer/exploration/nudge/scan/generate and all semantic repair entrypoints;
- modify `insightAnalyst.ts` so Analyst actively compares multiscale occurrences/variants/outliers/negative controls, owns final semantic cluster membership and requests exploratory **and claim-applicable counterquery** work only through the validated expansion port; deterministic grouping is candidate organization only. Modify `insightProducer.ts`/`GenerateProduce.ts` so Producer consumes accepted induction/hypotheses and emits a complete typed 0/1/N expression set with stable proposal/repair lineage and no fact-query, `knowledge.submit`, persist or review tools;
- add a production evaluation module such as `src/agent/evaluation/IndependentValueReviewer.ts` plus `InvestigatedEmptyReviewer.ts`; move reusable pure logic from `scripts/lib/mining-judge.mjs` into it, make the script call production code, extend the full authored projection and separate empty rubric;
- dual-project goldens, calibrated evaluator, stable knowledge root-set + causal parent DAG with repair depth≤2 across pass/evidence/fingerprint/**cluster/hypothesis/fixpoint** changes, source-drift rejection and single-file-value/three-file-generic fixtures.

Controller acceptance:

- `npm run check` passes; then the accepted build is hashed and the exact accepted evaluation commands run against frozen config, for example `npm run build && npm run eval:mining -- --provider <frozen-provider> --model <frozen-model> --judge --judge-provider <frozen-reviewer-provider> --out <evidence-dir>` and `npm run build && npm run eval:judge-calibration -- --input <accepted-golden-export> --judge-provider <frozen-reviewer-provider> --judge-model <frozen-reviewer-model> --out <evidence-dir>`. If the script lacks `--judge-model`, implement it or emit a load receipt proving the resolved frozen model; an implicit auto-detected model is not acceptance evidence;
- targeted extended-PlanIntent decomposition/tool/budget, Analyst active-query, multiscale population/cluster/induction, claim-applicable falsification, typed gate routing, Producer 0/1/N proposal-only conservation and context-propagation tests pass;
- raw receipts prove zero LLM-added facts/live reads/direct Producer submit, all required counterqueries enrolled before execution, valid bounded expansions, variants/outliers retained, counterexample-driven narrowing/refutation, unique dispositions/proposal terminal fates, reviewer independence, citation validity, zero filler and rejection of a third content-changing repair even after replacing cluster/hypothesis IDs or the fixpoint seal.

### 18.3 Alembic — strict orchestration and persistence owner

**designIntent:** 把 broad-reset/fire-and-forget bootstrap 收敛为 external authority/lease/header→authenticated graceful quiesce→post-quiesce snapshot/reset/blank→one facts→LLM Plan cognition+compile→shared fact harvest→LLM Analyst/Producer→objective gates→awaited finalization→single CAS 的可恢复主链。

Implementation package:

- in `StrictExternalSetupRecovery.ts`, version the authority/header so pre-quiesce whole-root observation is provenance only and add immutable post-quiesce receipt as snapshot authority; in `DaemonSupervisor.ts`, classify strict actions before ready short-circuit, spawn/identify the strict child without pre-killing the old writer and require child/new identity for readiness; in `daemon-server.ts` plus the existing daemon route module, add the narrow token-authenticated idempotent strict-quiesce request/ack that invokes the existing shutdown coordinator; in `Bootstrap.ts`, make checkpoint/close failure observable to the strict ack/receipt path. Reuse the existing HTTP/token/shutdown/lock/journal/snapshot surfaces; no second platform;
- exact post-quiesce whole-root snapshot/reset/restore; forbid `fullReset` in strict mode and forbid broad volatile globs or DB/WAL/SHM hash exclusions;
- refactor `RecipePipelineFacade.ts`, `PlanSelectionGate.ts`, `ColdStartWorkflow.ts`, `AiDimensionPreparation.ts`, `ProjectContextConsumerFacts.ts`, `ProjectContextWorkflowFacts.ts`, `ProjectMapModules.ts`, Main `ModuleService.ts` and actual Generate/workflow session constructors to one Core facts artifact plus V2 execution projection; inventory `IncrementalRescanWorkflow.ts` as applicable or typed-unreachable N/A; strict direct collector/capability/synthetic-scope/Package.swift/raw-fallback and 12/80-cap call counts zero;
- implement the single strict durable run journal and extend Alembic's outer pipeline/run/session/finalizer orchestration rather than build a parallel orchestrator: call the Agent-owned PipelineStrategy interfaces, open accepted backends, execute anatomy/decomposition-driven fact-population barriers, persist direct/derived witnesses and typed gate returns, enroll exploratory/counterquery envelopes before execution, persist schedule revisions/cluster/induction/falsification/disposition/fixpoint receipts, bind all downstream rows to fixpoint+private-corpus revision/root manifest, invalidate descendants and close/seal the old root on semantic re-fixpoint, allocate a confined absent-before-create revision root, rebuild it from the complete final eligible set and switch only the strict internal repository DI before Producer replay;
- strict journal/finalizer runs Plan cognition→compile/lens freeze→fact harvest/population→Analyst investigation→cluster/induction→counterquery enrollment/falsification→analysis fixpoint→Producer expression set→G1→serial admission→expression disposition or G2→safe persist→refs→contentReady→hypothesis-expression-set closure→lens/cell G3→assembly/ACTIVE/build/seal→G4→serving reconciliation/final coverage→tool-neutral serving validation→manifest→public CAS;
- inject canonical module resolver on the main Gateway; enforce ref-set/binding conservation;
- revision-scoped private root resolver/init factory/handle, accepted migration+identity+blank receipt, strict marker, current reader/writer/hook inventory, candidate assembly/seal and lock-inside-compare public route CAS; preserve certified source root separately and forbid ordinary resolver/global-container access to revision roots;
- implement `ServingSnapshotValidationReceipt` in the existing strict finalizer/journal over Core manifest/route/repository/vector contracts; retire or rename/re-scope `runCandidateFiveToolOracle` so its CRUD/sparse/vector probes cannot be mistaken for formal MCP execution; add no AlembicPlugin dependency or Codex-facing handler;
- first vector explicit rebuild; scenario-specific compensation;
- strict completion status distinct from generic bootstrap.

Controller acceptance:

- `npm run check` plus targeted strict setup, `DaemonSupervisor`, external recovery, order/single-capture/reset/snapshot/Plan-schedule/fact-query/falsification/finalizer/ref/vector/public-CAS/fault tests pass;
- a real live-ready daemon strict `execute` reaches the strict child instead of ordinary ready success; malformed/conflicting authority leaves the writer live and target unchanged; durable timestamps/readback prove authority→lease→header precedes request/ack/control-file deletion; exact authenticated request contains no path/secret; the old daemon completes its existing shutdown hooks and a real post-exit checkpoint/WAL/SHM receipt is sealed before snapshot;
- snapshot bytes/hash equal the post-quiesce receipt, reset follows only afterward, and faults injected at every stage in §17.1 resume in a fresh process. Exact rebuild restore is verified before normal runtime creates fresh daemon state/PID/token; no stale process identity survives. `execute|recover|complete` are never swallowed by ready status, and normal non-strict start/ready/restart/stop tests do not regress;
- loaded trace proves one refactored Plan cognition session/stage with exactly one initial invocation plus 0..2 parent-linked semantic repair invocations; the execution projection retains decomposition/tool/priority/budget strategy. A fixture persists row A, lets a later row trigger an Analyst semantic re-fixpoint, and proves distinct confined revision roots/DB hashes, equal accepted `migrationLedgerSemanticHash` (including BiliDili 017) plus identity/config/initial-blank receipt for each leaf while raw `applied_at` may differ, old-root open/read count zero, A's old descendant cannot affect dedup/coverage/snapshot, the replacement revision replays all final eligible rows, and no duplicate Recipe is visible. Legacy executable PlanSelection, old collectors/raw scanner, partial ProjectGraph/schema-only edges as coverage, required-null AiDimension inputs, Markdown/live-FS grounding, quantity floors, auto deferred, generic skip/degrade, old coverage closure and direct persistence fallback are all zero;
- no source/forbidden table/path writes in isolated fixtures;
- fresh-process/idempotent resume and concurrent CAS raw evidence passes; `ResidentServiceBoundary.test.ts` still proves zero Main MCP ownership and the accepted package graph contains no Main→Plugin candidate-oracle dependency;
- accepted runtime/release artifact produced with exact dependency hashes.

### 18.4 AlembicPlugin — host handshake and five public consumers

**designIntent:** 复用正式五工具公共执行面，兼容 Core/Main 的 versioned serving contract；不读取 run-private candidate、不加入 Main publication 状态机。Graph 继续 live-source/Recipe-free，四知识工具只读 CAS 后 pointed snapshot。

Implementation package:

- host `plan-tool.ts`/`cold-start.ts` prepare→draft/confirm→execute using the existing Core Foundation and `ColdStartExecutionProjectionV2` including fact-query/baseline-schedule hashes; Plugin dimension completion, ModuleService, `host-runtime/mcp/handlers/tool-router.ts#resolveSubmitKnowledgeModuleAxis`, plan-confirm/module-axis callers and actual HostAgent session constructor carry the same artifact/schedule binding; inventory `knowledge-rescan.ts` as applicable or typed-unreachable N/A; strict calls to competing `project-context-analysis.ts`, `collectPlanProjectContext`, direct ProjectContext/module scan fallbacks, 24-cap/empty-axis/Core passthrough, V1 conversion and auto deferred are zero; missing module axis fails closed;
- `ProjectRuntimeContext` strict publication provenance and ordinary public resolver; persistent strict marker distinguishes route-null from legacy DB fallback；route=null 时四知识工具 unavailable，Graph仍读live source；
- Search/Prime/Map/Guard executors只使用 CAS 后 resolved snapshot；Graph keeps real project identity/source；
- search snapshot consumes selected vector generation, not legacy hard-coded route;
- add versioned serving fixture/compatibility tests that load the exact accepted Core/Main manifest/route schemas through existing `EmbeddedToolExecutor` handlers；do not add candidate handle、path override、private snapshot resolver、Main dependency or pre-CAS execution mode；
- enumerate ordinary MCP/HTTP/Dashboard/repository readers and legacy EventBus/StagingManager/afterPublish hooks; migrate/disable them in strict mode;
- Map coverage/accounting schema honesty with full continuation.

Controller acceptance:

- `npm run check` **and** `npm run test:unit`/targeted integration tests pass because Plugin `check` currently excludes tests;
- ProjectContext 5/5/root+4, build-session/region, prepare receipt/stale rejection, route-null isolation, vector consumption and exact-artifact serving-fixture compatibility tests pass；formal five-tool real-snapshot proof remains T6 after CAS；
- runtime package/distribution verification and loaded-hash probes pass;
- existing order-sensitive vector group test passes as a group repeatedly, not only isolated.

### 18.5 AlembicDashboard — conditional

**designIntent:** 仅在现有 APIs/logs 无法让用户观察 run phase、coverage/route/failure receipt 时展示权威状态，不另造判定。

Trigger: controller records a concrete observability gap after Core/Alembic/Plugin APIs exist. Without trigger, no package. If triggered, `npm run check` and API-type drift tests pass; UI cannot mutate/override state.

Provenance is total in both branches. If triggered, `RuntimeArtifactManifest` includes required `dashboard-build` with Dashboard commit/tree/package, dist SHA-256/size, lock/toolchain/build recipe, API/schema hash, controller evidence and a load receipt proving the served dist/metadata hash; compatibility binds generated API types to the accepted Alembic runtime schema. If not triggered, that same manifest row, compatibility row and load row are `not-applicable` with the controller trigger-decision receipt/hash, and Test must not start Dashboard or claim UI/read-path evidence. Including Dashboard in MR source ProjectContext never implies that its runtime is started.

### 18.6 Controller cross-chain gate before Test

The controller independently verifies, in order:

1. PC-F, external authority/lease/header-first, live-daemon authenticated graceful quiesce, post-quiesce whole-root/checkpoint receipt, stage-specific fresh-process recovery, RESET, PC-RUN, REQUIRED BASELINE/PLAN/SCHEDULE, FACT QUERY/EXPANSION/ANALYSIS FIXPOINT, OBSERVATION/HYPOTHESIS/ENROLLED-FALSIFICATION/ANALYST-DISPOSITION REVIEW, nested per-expression-or-disposition-row G1/ADMISSION/EXPRESSION-DISPOSITION-or-G2/PERSIST/REF/contentReady, immutable HYPOTHESIS-EXPRESSION-SET closure, final-obligation+lens+cell G3, DURABLE/ISOLATION, ASSEMBLY/SEAL, INDEX/G4, SERVING RECONCILIATION/FINAL COVERAGE, tool-neutral SERVING SNAPSHOT VALIDATION/SERVING MANIFEST and lock-inside-compare PUBLIC raw evidence;
2. final same-demand repository revisions preserve `PCFBaselineReceipt` lineage; same-repository NEXT packages started only after prior review, and main/host entrypoints preserve/version the PC-F capability contract, use the same contracts and reject stale receipts;
3. exact commits/packages/artifact hashes and actual runtime-loaded hashes, including Plugin compatibility against the same versioned Core/Main serving fixtures with no private candidate access or cross-repo runtime dependency;
4. source revisions, migration bundle, prompt/SOP and vector adapter compatibility;
5. isolated product-level end-to-end/fault/fresh-process/concurrency tests show the complete feature is connected;
6. the complete PC-F suite reruns on the exact final RuntimeArtifactManifest artifacts and loaded hashes, not only on the initially accepted PC-F artifacts;
7. no TODO/backfill/prose/local test count substitutes for raw evidence.

Only after every revised non-Test target is accepted and the exact RuntimeArtifactManifest is rebuilt/reverified may Test become technically eligible; it still remains paused until the user explicitly says to start and cooperates with the environment operation. No Test task/card/dispatch is created before that signal. A Test-discovered bug returns to its owning package, whose targeted + full acceptance and artifact rebuild rerun before the user-authorized Test resumes.

## 19. Artifact Provenance Required Before Test

The accepted `RuntimeArtifactManifest` includes:

- Core package/dist;
- Agent package/dist;
- Alembic runtime/release;
- Plugin MCP package/server;
- prompt/SOP/evaluator bundle;
- fact-query-pack/code-fact-backend bundle: required applicability, query sources/hashes, grammar/parser/backend binaries or packages, positive/negative/edge/counterexample fixtures and canonicalizer;
- migration bundle;
- vector adapter;
- conditional `dashboard-build`: required/present with full provenance when Section 18.5 is triggered; otherwise explicit `not-applicable` with the trigger-decision receipt.

It references `PCFBaselineReceipt`, records the final capability/API contract hash and compatibility/migration result, and links the PC-F regression rerun on these exact final artifacts. Final package hashes may differ when later same-demand NEXT packages changed them; unexplained contract drift is blocked.

Each entry records repository/commit/tree or package hash, artifact SHA-256/size, build recipe/toolchain/lock hash, provider, schemas/versions, producer, acceptance evidence and compatibility. Fact-query/backends additionally record every accepted query/grammar/counterquery hash and backend↔language↔artifact compatibility. Runtime load receipts must match exact hashes. The Dashboard branch must agree across trigger receipt, artifact row, compatibility row, load receipt and Test startup decision. Missing/stale/incompatible entry is blocked; Test cannot build a substitute.

## 20. Test Decision

Real Test is still required, but it is explicitly paused. Eligibility requires all of: Section 18.6 passes for every revised non-Test target (including live-daemon two-stage quiesce and fresh-process recovery); every symbolic binding in Test Environment Spec §2.1 resolves in the same state root; the controller rebuilds and verifies the exact RuntimeArtifactManifest/load hashes; and the user then explicitly says to start and cooperates with environment operations. Until that last signal, no Test task/card/dispatch is created. Product/controller acceptance must already prove the chain is implemented and connected; Test does not discover a planned feature or compensate for unproven quiesce/recovery. Once authorized, Test runs the accepted artifacts against MR-ALEMBIC and SP-BILIDILI in pristine-init and authorized-rebuild, including fact/schedule/result repeatability, failure injection and five MCP developer oracles.

When Test finds a valid hidden product bug:

`Test evidence → controller root-cause/owner decision → owning repository fix → owning full checks + controller cross-chain reacceptance → rebuilt/rehashed artifacts → Test rerun failed row and regression matrix`.

Test never edits product code or directly dispatches the owner.

## 21. Non-Goals And Forbidden Conclusions

- No product code/database/Test/delivery/TODO/state-root changes in Design.
- No Graph Recipe mounts or frozen Graph snapshot registry.
- No separate Recipe/ref/coverage/sparse generation or pointer; no persisted sparse/BM25 claim.
- No global lifecycle or legacy `completed_with_errors` behavior change.
- No full-reset reuse, query-time writes, runtime deferral, hidden truncation or minimum Recipe counts.
- No prompt/SOP/LLM self-report, heuristic starter, partial ProjectGraph or mutable filesystem read as code-fact, fact-query, falsification or coverage authority.
- No second ProjectContext store, parser stack, Pattern DB or wholesale Glean/CodeQL/Joern/Soufflé adoption; optional backend scope requires a demonstrated fact-query capability gap and accepted provenance.
- No one-physical-service/table/file-per-logical-receipt mandate; facts/tool evidence reuse existing immutable Foundation/Evidence Ledger storage, semantic projections extend AnalysisArtifact/evidence bundles, and recovery state shares the one proposed strict journal.
- No G1 semantic/value self-certification, producer self-review or advisory evaluator auto-pass.
- No activation before G4→final reconciliation/final coverage→tool-neutral serving validation→serving manifest completes. T6 post-public five-tool success is still required for final requirement acceptance, while remaining outside the producer's CAS predicate.
- No claim that destructive rebuild preserves old availability.
- No Dashboard control plane without a concrete trigger.
- No Test build/install/fix or Test-as-first-implementation-verification.
- No second daemon-control channel, operation lock, journal, snapshot or recovery platform; only a narrow authenticated operation on the existing daemon HTTP/token/shutdown boundary.
- No broad volatile allowlist, no ignoring whole-root bytes, and no classifying SQLite/WAL/SHM, publication/config or `daemon-entrypoint.json` as disposable control state.

## 22. User-Confirmation Ledger

| Decision | Confirmed result |
| --- | --- |
| Deletion/recovery | only two approved Ghost roots; pre-quiesce observed evidence + external lease/header + graceful quiesce + post-quiesce snapshot/restore; exact Recipe/ref/coverage/index/session reset; source/other roots forbidden |
| Publication | candidates remain private; one final compare-null public route; destructive interval may be null; snapshot recovery handles pre-CAS rebuild failure |
| Candidate/public consumer split | each candidate passes only Alembic/Core tool-neutral serving admission before CAS; no Plugin five-tool pre-CAS gate, candidate handle or Main→Plugin dependency. I8 owns exact-artifact Plugin compatibility and T6 owns the first complete formal five-tool run after CAS |
| Strict quiesce | external authority/root identity/lease/header first; existing daemon boundary then performs run-bound authenticated graceful shutdown; post-quiesce whole-root/checkpoint receipt is the only snapshot authority; pre-quiesce hash remains provenance |
| Projects | Alembic five repositories; BiliDili root + four named Packages |
| DeepSeek/config | exact current production provider/model/config/prompt/SOP/budgets/embedding-vector frozen; credential symbols only |
| Test | required but paused; only after revised non-Test/controller acceptance, rebuilt+verified exact artifacts/manifest and a fresh explicit user start/cooperation signal; MR then SP, pristine then rebuild; hidden bugs return to owner then reaccept/rebuild/retest |
| Deferral | initial `deferredCells=[]`; any future deferral/scope reduction needs renewed user confirmation |
| ProjectContext | before any Plan feature work: deep loaded-artifact investigation, actual consumer projection receipts, request×language/parser/owner/inventory/Graph/Map repair and all unknown/partial/defect counters zero; per run one post-blank capture, no dual/fallback facts |
| Execution partition | current single demand/state root already exists and remains the only root; I0 claim is complete; no second claim/delivery. Historical work advanced through I8; current revision-154 work is one Alembic NEXT repair, and same-repository packages never run concurrently |
| LLM architecture | Plan/Analyst/Producer remain main cognitive roles; deterministic facts/compiler/gates provide evidence, boundaries and state transitions, not a replacement cognition engine |
| Project understanding | ten anatomy views and multiscale canonical subjects decompose the code base; Plan composes questions/tools/budget, Analyst owns semantic clustering/induction, Producer owns expression. No second Plan/graph/mining platform |
| Mining authority | Recipe claims trace dimension-free facts→population→cluster→induction/hypothesis→enrolled falsification→Producer expression set→disposition-or-independent G2; prompt/SOP/LLM cannot alone establish fact, value, empty or coverage |

Open product questions: **none**. Current implementation blocker is the Alembic two-stage quiesce/recovery contract; Test bindings/receipts and the fresh user start signal are operational gates, not new product decisions. Any unresolved gate blocks Test execution.

## 23. Controller Intake Notes

- Preserve Design Key, priority P0, type requirement and `autoClaim=false`.
- Do not interpret proposed symbols as already implemented.
- Preserve the revision 97 correction: Main remains journal/manifest/CAS owner but never calls Plugin pre-CAS; Plugin remains the public five-tool owner. Do not manufacture Main→Plugin candidate transport.
- Supersede revision 154/rootcause3's impossible V1 clause that requires post-quiesce target equality to pre-quiesce `rootTreeHash`. Re-intake V2 authority/header + existing-daemon quiesce + post-quiesce receipt, without weakening whole-root snapshot/restore.
- Re-intake/reconcile these revised documents into the already existing single demand/state root without another claim or delivery. Create at most one Alembic NEXT combined package after controller review; no Core/Agent/Plugin/Dashboard package unless a real shared-contract change is proven.
- Do not call `wakeflow_deliver` again or manually add/edit/duplicate TODO rows; the one-time claim has already completed.
- Do not create/authorize/dispatch Test until the entire revised strict contract passes controller acceptance, exact prebuilt artifacts/manifest are rebuilt and verified, Test §2.1 bindings/authorization receipts are complete, and the user explicitly starts/cooperates with the real run.

## 24. Primary Source Map

### ProjectContext and Plan

- `AlembicCore/src/domain/project-context/ProjectContextContracts.ts`
- `AlembicCore/src/domain/project-context/ProjectContextRefs.ts`
- `AlembicCore/src/domain/project-context/ProjectContextMap.ts`
- `AlembicCore/src/service/project-context/ProjectContextService.ts`
- `AlembicCore/src/service/project-context/capabilities.ts`
- `AlembicCore/src/service/project-context/foundation/contracts.ts`
- `AlembicCore/src/service/project-context/foundation/capture.ts`
- `AlembicCore/src/service/project-context/foundation/store.ts`
- `AlembicCore/src/service/project-context/foundation/readiness.ts`
- `AlembicCore/src/service/project-context/foundation/consumerPort.ts`
- `AlembicCore/src/service/project-context/foundation/nodePorts.ts`
- `AlembicCore/src/service/project-context/foundation/canonical.ts`
- `AlembicCore/src/projectContextFoundation.ts`
- `AlembicCore/scripts/audit-project-context-foundation.mjs`
- `AlembicCore/src/core/ast/ProjectGraph.ts`
- `AlembicCore/src/core/ast/ensureGrammars.ts`
- `AlembicCore/src/domain/source-graph/SourceGraphContracts.ts`
- `AlembicCore/src/service/source-graph/SourceGraphIndexer.ts`
- `AlembicCore/src/service/plan/facts/collectProjectContext.ts`
- `AlembicCore/src/service/plan/facts/projectSourceFacts.ts`
- `AlembicCore/src/service/plan/intent/planIntent.ts`
- `AlembicCore/src/service/plan/intent/contracts.ts`
- `AlembicCore/src/service/plan/intent/planAuthoringSpec.ts`
- `AlembicCore/src/domain/dimension/DimensionRegistry.ts`
- `AlembicCore/src/domain/dimension/DimensionCatalogPayload.ts`
- `AlembicCore/src/domain/dimension/DimensionSop.ts`
- `AlembicCore/src/domain/knowledge/recipe-authoring-spec/dimensionCompletion.ts`
- `AlembicCore/src/workflows/surfaces/host-agent/briefing/MissionBriefingSupport.ts`
- `AlembicCore/src/workflows/surfaces/host-agent/briefing/MissionBriefingBuilder.ts`
- `AlembicCore/src/workflows/surfaces/host-agent/briefing/analysis-packet/Types.ts`
- `AlembicCore/src/workflows/surfaces/host-agent/briefing/HostAgentAnalysisPacketBuilder.ts`
- `AlembicCore/src/workflows/surfaces/host-agent/session/HostAgentSubmissionTracker.ts`
- `Alembic/lib/project-facts/ProjectContextWorkflowFacts.ts`
- `Alembic/lib/project-facts/ProjectContextConsumerFacts.ts`
- `Alembic/lib/recipe-pipeline/generate/execution/AiDimensionPreparation.ts`
- `Alembic/lib/recipe-pipeline/generate/execution/RuntimeInitializer.ts`
- `Alembic/lib/service/module/ModuleService.ts`
- `Alembic/lib/recipe-pipeline/plan/PlanSelectionGate.ts`
- `Alembic/lib/recipe-pipeline/RecipePipelineFacade.ts`
- `Alembic/lib/recipe-pipeline/generate/ColdStartWorkflow.ts`
- `Alembic/lib/recipe-pipeline/generate/incremental/IncrementalRescanWorkflow.ts`
- `AlembicPlugin/lib/recipe-pipeline/plan/plan-confirm.ts`
- `AlembicPlugin/lib/recipe-pipeline/plan/plan-generation-gate.ts`
- `AlembicPlugin/lib/recipe-pipeline/plan/plan-tool.ts`
- `AlembicPlugin/lib/recipe-pipeline/generate/project-context-analysis.ts`
- `AlembicPlugin/lib/recipe-pipeline/generate/knowledge-rescan.ts`
- `AlembicPlugin/lib/recipe-pipeline/generate/dimension-completion.ts`
- `AlembicPlugin/lib/recipe-pipeline/generate/cold-start.ts`
- `AlembicPlugin/lib/service/module/ModuleService.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/project/GitSubmoduleRepoDiscovery.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/contracts/ProjectContextRegion.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/recipe-map/RecipeMapProvider.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/session/ProjectContextBuildSessionManager.ts`
- `AlembicCore/src/workflows/surfaces/host-agent/session/GenerateSession.ts`
- `AlembicAgent/src/agent/runs/plan/PlanAgentRun.ts`
- `AlembicAgent/src/agent/profiles/definitions/plan.profile.ts`

### Production, gates and coverage

- `AlembicAgent/src/agent/evaluation/analysisArtifact.ts`
- `AlembicAgent/src/agent/evaluation/qualityGates.ts`
- `AlembicAgent/src/agent/evaluation/gateEvaluators.ts`
- `AlembicAgent/src/agent/evidence/EvidenceCollector.ts`
- `AlembicAgent/src/agent/evidence/EvidenceLedgerStore.ts`
- `AlembicAgent/src/agent/memory/ActiveContext.ts`
- `AlembicCore/src/domain/knowledge/evidence-ledger/EvidenceLedgerContract.ts`
- `AlembicCore/src/workflows/surfaces/host-agent/briefing/EvidenceStarterBuilder.ts`
- `AlembicAgent/src/agent/prompts/insightProducer.ts`
- `AlembicAgent/src/agent/prompts/insightAnalyst.ts`
- `AlembicAgent/src/agent/prompts/insightGate.ts`
- `AlembicAgent/src/tools/runtime/toolsets/GenerateProduce.ts`
- `AlembicAgent/src/tools/runtime/toolsets/GenerateAnalyze.ts`
- `AlembicAgent/src/tools/runtime/handlers/code.ts`
- `AlembicAgent/src/agent/strategies/PipelineStrategy.ts`
- `AlembicAgent/src/agent/profiles/presets/insightPreset.ts`
- `AlembicAgent/src/tools/runtime/handlers/submitEvidenceExpansion.ts`
- `AlembicAgent/src/tools/runtime/handlers/recipeProductionAdapter.ts`
- `AlembicAgent/src/tools/runtime/handlers/knowledge.ts`
- `Alembic/lib/recipe-pipeline/generate/execution/AiDimensionSessionRunner.ts`
- `AlembicAgent/scripts/lib/mining-judge.mjs`
- `AlembicAgent/scripts/eval-judge-calibration.mjs`
- `AlembicCore/src/service/knowledge/RecipeProductionGateway.ts`
- `AlembicCore/src/service/sustain/StagingManager.ts`
- `AlembicCore/src/service/knowledge/RecipeRetrieval.ts`
- `AlembicCore/src/repository/coverage/CoverageLedgerRepository.ts`
- `AlembicCore/src/workflows/surfaces/coverage/CoverageLedgerBuilder.ts`
- `AlembicCore/src/workflows/surfaces/coverage/CoverageLedgerWrite.ts`
- `AlembicCore/src/workflows/surfaces/coverage/CoverageLedgerAdvisor.ts`

### Persistence, indexing and public tools

- `AlembicCore/src/shared/WorkspaceResolver.ts`
- `AlembicCore/src/service/knowledge/KnowledgeFileWriter.ts`
- `AlembicCore/src/service/knowledge/KnowledgeService.ts`
- `AlembicCore/src/repository/knowledge/KnowledgeUnitOfWork.ts`
- `AlembicCore/src/service/knowledge/SourceRefReconciler.ts`
- `AlembicCore/src/repository/search/SearchRepoAdapter.ts`
- `AlembicCore/src/service/search/SearchEngine.ts`
- `AlembicCore/src/service/vector/RecipeVectorGeneration.ts`
- `Alembic/lib/service/cleanup/CleanupService.ts`
- `Alembic/lib/recipe-pipeline/generate/strict/StrictExternalSetupRecovery.ts`
- `Alembic/lib/daemon/runtime/DaemonSupervisor.ts`
- `Alembic/bin/daemon-server.ts`
- `Alembic/lib/Bootstrap.ts`
- `Alembic/lib/http/routes/daemon.ts`
- `Alembic/test/unit/DaemonSupervisor.test.ts`
- `Alembic/test/unit/StrictExternalSetupRecovery.test.ts`
- `Alembic/lib/injection/modules/InfraModule.ts`
- `Alembic/lib/service/vector/RecipeVectorGenerationRuntime.ts`
- `Alembic/lib/daemon/jobs/bootstrapStatusClassification.ts`
- `Alembic/lib/recipe-pipeline/generate/strict/StrictPrivateCorpusRuntime.ts`
- `Alembic/test/unit/ResidentServiceBoundary.test.ts`
- `Alembic/package.json`
- `AlembicPlugin/package.json`
- `AlembicPlugin/lib/host-runtime/context/ProjectRuntimeContext.ts`
- `AlembicPlugin/lib/host-runtime/mcp/HostMcpServer.ts`
- `AlembicPlugin/lib/injection/modules/KnowledgeModule.ts`
- `AlembicPlugin/lib/host-runtime/mcp/host/embedded-executor.ts`
- `AlembicPlugin/lib/host-runtime/mcp/host/read-only-search-snapshot.ts`
- `AlembicPlugin/lib/host-runtime/mcp/host/read-only-search-executor.ts`
- `AlembicPlugin/lib/host-runtime/mcp/host/read-only-graph-executor.ts`
- `AlembicPlugin/lib/host-runtime/mcp/host/read-only-recipe-map-executor.ts`
- `AlembicPlugin/lib/host-runtime/mcp/host/read-only-prime-executor.ts`
- `AlembicPlugin/lib/host-runtime/mcp/host/read-only-code-guard-executor.ts`

### Historical acceptance evidence

- `wakeflow-ledger/workspace/archive/2026-07/alembic-five-knowledge-tools-deep-audit-2026-07-11/target-results/tr-p4-dual-mode-five-tool-acceptance-resume6-t1.json`

## 25. External Method References — Design Input, Not Current Capability

| Primary source/method | Minimal rule adopted here | Exact contract/acceptance | Explicitly not adopted |
| --- | --- | --- | --- |
| [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) | syntax facts come from a versioned parser over frozen bytes with exact ranges | direct-anchor Fact witness; language/parser initialization and positive/negative/error fixtures | syntax parse as semantic/call/data proof; second parser stack |
| [Meta Glean](https://engineering.fb.com/2024/12/19/developer-tools/glean-open-source-code-indexing/) | immutable typed fact generations and provenance separate extraction from serving | Foundation artifact/source vector + Fact generation/load receipts | adopting Glean or a second fact store |
| [Kythe schema overview](https://kythe.io/docs/schema-overview.html) and [schema reference](https://kythe.io/docs/schema/) | distinguish source anchors, semantic subjects and labeled edges; identity is revision/corpus scoped | reuse `ProjectContextRef.id` plus frozen occurrence anchor; relations bind source/target/ref and typed unresolved endpoint | Kythe index/storage or universal cross-revision entity IDs |
| [CodeQL documentation](https://codeql.github.com/docs/) | semantic queries need version/hash, model, fixtures and complete result semantics | `FactQuerySpec`/pack/load/terminal receipt | mandatory CodeQL installation or query result without provenance |
| [Joern CPG specification](https://cpg.joern.io/) | syntax/call/control/data are distinct capabilities | backend capability matrix and `unsupported-blocked`; schema-only edge fails | claiming current SourceGraph already implements a CPG |
| [Soufflé provenance](https://souffle-lang.github.io/provenance) | a derived result should be explainable from premises | compact `DerivedFactWitnessV1` premise DAG and replay mutation tests | a Datalog/proof engine or full proof tree platform |
| [ReAct](https://arxiv.org/abs/2210.03629) | LLM reasoning benefits from explicit action/observation planning | extended PlanIntent question→tool/query→evidence/counterevidence and Analyst enrolled query epochs | unbounded autonomous live-source actions or LLM-owned facts |
| [SWE-agent](https://papers.neurips.cc/paper_files/paper/2024/file/5a7c947568c1b1328ccc5230172e1e7c-Paper-Conference.pdf) | tool interface shape affects an LLM agent's effectiveness | frozen capability catalog, typed outputs/errors and role-specific action spaces | a new agent framework or Producer persistence tools |
| [RepoCoder](https://aclanthology.org/2023.emnlp-main.151.pdf) | iterative retrieval/generation can refine repository context | bounded Plan/Analyst expansion ledger and delta review | treating similarity retrieval as complete project knowledge |
| [Concern Graphs](https://doi.org/10.1145/581339.581390) | cross-cutting concerns must back-map structural dependencies | cross-cutting anatomy lens, multiscale cluster and complete source-anchor back-map | a Concern Graph DB or inferred edge without a producer |
| [PR-Miner](https://doi.org/10.1145/1095430.1081755) and [HAGGIS](https://arxiv.org/abs/1404.0417) | mine full recurring/idiom populations and inspect violations/outliers | population denominator, recurrence claim rule, counterquery applicability and G2 | frequency/three files as value or Recipe floor |
| [MAPO](https://taoxiease.github.io/publications/msr06-mapo.pdf) and [GrouMiner](https://doi.org/10.1145/1595696.1595767) | API usages need sequence/variant/negative analysis | API/protocol anatomy lens; alternate/missing/error/cleanup sequence queries when a producer exists | fabricating order from imports/text or forcing a graph miner dependency |
| [Getafix](https://arxiv.org/abs/1902.06111) | general/specific change patterns need hierarchical evidence | evolution lens, multiscale normalization and frozen history witness | promoting one historical edit into a current rule |

These methods shape the minimum contracts and mutation fixtures only. Current capability truth remains the local source map above. Any optional semantic/history backend first needs a demonstrated gap, owner, accepted artifact/provenance/compatibility/load hashes and positive/negative/edge fixtures; otherwise the corresponding row is unsupported, not silently implemented.
