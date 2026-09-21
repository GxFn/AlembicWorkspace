# Recipe 冷启动生产质量重建 — Original Plan

- Design Key: `recipe-coldstart-production-quality-2026-07-15`
- Date: 2026-07-15
- Priority: P0
- Type: requirement
- Status: S1 同一 demand 原位重设计；controller revision 154 因 strict external setup 把停写前全根观测误作停写后 snapshot 基准而 `blocked`；用户已确认两阶段 quiesce 合同与 Test 暂停门，等待 controller re-intake；修订实现、重新验收和 T6 真实 Test 均未完成
- Auto Claim: false（既有 TODO 已由 controller 显式 claim；不得再次 claim、deliver、复制 TODO 或创建第二个 demand/state root）
- Execution boundary: Design 只更新四份 S1 文档，不修改产品、数据、TODO、dispatch 或 Wakeflow state

## Goal

从两个真正空库场景出发，建立一条“项目事实可信 → LLM 主导理解 → 独立门禁裁决 → 会话级原子发布”的 DeepSeek Recipe 生产链。Plan、Analyst、Producer 仍是 LLM 主认知角色；ProjectContext、parser、fact miner、query/selector、compiler 和 gate 不替代认知，而是给 LLM 提供完整、可追溯、可分页、可反驳的事实空间，并约束它不能发明源码事实、越过范围或自行宣告完成。

ProjectContext 仍是 Plan 前置硬门：任何新实现不得把它默认成完好，最终 accepted artifacts 仍须重放完整 producer/consumer inventory 和 `PCFBaselineReceipt` lineage。当前同一 demand 已经把非 Test 主链推进到进入真实场景的阶段；I9 入口暴露了更靠前的 strict setup blocker：`StrictExternalSetupRecovery` 用停写前 whole-root hash 要求停写后 target 精确相等，而真实 graceful shutdown 会删除 `daemon.json`/`daemon.pid` 并 checkpoint/关闭 SQLite。修订后的正确顺序必须是“外部 authority/lease/header durable → 由现有 daemon 边界完成 run-bound authenticated graceful quiesce → 生成 immutable post-quiesce receipt → snapshot/reset”，否则不得继续 Plan、Recipe 或 Test。

通过 PC-F 后，每次严格冷启动按以下职责协作：

| 能力 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| ProjectContext/Foundation | 完整 source inventory、九类 request outcome、revision/blob/range、parser/query 状态、可重载 artifact | 不决定知识价值，不替 LLM 归纳模式 |
| anatomy/applicability baseline | 以 structure/boundary、entrypoint/contract、dependency/call/data/control、state/lifecycle/persistence、error/recovery/concurrency、config/build/migration、API/protocol、cross-cutting、idiom、evolution 十类视图逐 scope 判定 required/excluded/unsupported | 不是第27个dimension，不按项目名写死清单，不允许运行时延期 |
| Plan LLM | 复用并扩展现有 `PlanIntent`/`PlanNextAction`；把问题拆为 subquestions→anatomy lens→subject/scale→capability/query→support/counterevidence→stop/escalate，并在硬上限内分配priority/breadth/expansion/counterquery reserve | 不执行 live source 工具，不直接决定最终 cells、事实完整性、Recipe数量或预算硬上限 |
| deterministic Plan compiler | 校验范围、适用性、referential integrity、caps、排除与守恒；实例化 policy-required obligations并把 accepted intent 编译成保留priority/tool/budget strategy的 executable projection | 不替 Plan LLM 发明项目问题、语义优先级或预判哪些 Recipe 有价值 |
| fact backends/miners | 对冻结 canonical subjects按source-range→symbol→file→module→package→repo→project产出 anchored direct facts或premise-witnessed derived facts、完整/分页 populations、错误和 omission receipts | 不把 schema 声明、Top-N、错误或超时伪装成已有语义或“无模式” |
| Analyst LLM | 主动调用受控 fact-query/miner ports，对出现位置、变体、异常、负例和边界做比较，提出、收窄或推翻机制假设 | 不重读未冻结 live filesystem，不自行持久化或宣布 coverage |
| deterministic lineage/conservation | 保存 direct/derived witness、multiscale population、candidate pre-group、cluster member、merge/split 与 source lineage，规范化 ID 并校验唯一 disposition/守恒 | 不决定 final cluster membership/机制/merge/split 语义；这些由 Analyst 提议并受独立复核，不强造 recurring pattern |
| Producer LLM | 只消费 Analyst/falsification 后 `survived|narrowed` 的 Producer-eligible hypotheses，并归纳成 0/1/N Recipe，负责项目化表达、usageGuide、retrieval profile 和 negative intent；cluster 的 zero-hypothesis/refuted 分支由 Analyst disposition 终结 | 不补事实、不探索新源码、不自审或持久化，也不为零归纳分支伪造表达集 |
| G1 / independent G2 / coverage / G4 | 分别裁决硬正确性、实际价值、coverage closure 和 serving readiness | 不用 Recipe 数、文件数、文本长度、工具数或 LLM 自信代替结论 |

候选始终留在私有 working session。G3 只绑定 content-ready corpus；sparse/vector shadow build、G4、final reconciliation 和 immutable final coverage 完成后，由 Alembic/Core 的消费者中立 `ServingSnapshotValidationReceipt` 校验 sealed snapshot 的 schema、hash、identity、Recipe/ref/coverage 守恒以及 exact sparse/vector generation，再生成 serving manifest。最后以一个 `publicSessionPointer`（实现可名为 `PublicKnowledgeRoute`）compare-null CAS 作为唯一公开切换。Alembic 不调用或复制 Plugin 五工具；Plugin 对 serving contract 的兼容性在 controller I8 以 exact artifacts/fixtures 验收，正式五 MCP 在 CAS 后的真实 Test 场景首次作为完整端到端矩阵运行。authorized destructive reset 到该 CAS 之间 public knowledge 为 null；原子性保证是不暴露部分新 session，旧数据恢复依赖 snapshot/restore。

## Reuse And Tightening Strategy

| Decision | Contract |
| --- | --- |
| Reuse | Core `service/project-context/foundation/*`、九类 ProjectContext request、Tree-sitter/runtime、26 维 registry、现有 Plan/AnalysisArtifact/Evidence Ledger/PipelineStrategy/CreateRecipeItem/Gateway/retrieval contracts、judge 基础、coverage exploration、writer/ref/vector primitives、五 MCP handlers/executors |
| Repair/extend | Foundation 的真实 projection authority、request×language/parser coverage、module ownership；Main/Plugin artifact-only adapters；LLM Plan cognition；dimension-free fact harvest；population/cluster/induction；0/1/N Producer；独立 G2；严格 coverage/finalizer/public route |
| New logical receipts only | `PlanCognitionReceipt`只是扩展现有PlanIntent的不可变投影；anatomy/decomposition/budget嵌入Plan receipts，multiscale/witness嵌入fact/population bundles，typed gate return嵌入现有stage result/strict journal；candidate/final coverage、reset/publication同理。不按名词创建新平台/表，也不把拟议journal冒充现有能力 |
| Remove or isolate from strict path | pre-reset/double facts capture、caller placeholder projections 当生产证据、raw filesystem fallback、silent sampling、LLM 直接 executable Plan、Plan top20/Recipe floor、Markdown-derived findings、每 finding 一 Recipe、Producer direct submit、error→not_found、generic skip/degrade、partial/exhausted completion、Graph Recipe mounts、fire-and-forget finalization |

## Confirmed Scope

### Project modes

- `MR-ALEMBIC`：Alembic、AlembicCore、AlembicAgent、AlembicPlugin、AlembicDashboard。
- `SP-BILIDILI`：BiliDili 主工程与 `Packages/AOXFoundationKit`、`Packages/AOXNetworkKit`、`Packages/AOXPlayer`、`Packages/AOXUIKit`。

两种 mode 使用同一事实驱动 policy/compiler，不按项目名写死 dimensions、modules、queries 或 cells。

### Required true-empty scenarios

每种 mode 都必须运行且不可互相替代：

1. `pristine-init`：隔离非生产 root 从物理不存在的 DB/Recipe/index 开始；创建前用 existing authorized parent + absent leaf 的 `plannedAbsentPathReceipt` 证明未创建/无 symlink，受支持 init 后 actual realpath 必须相等，再完成 schema、全部 migrations 和 project identity 后冷启动。
2. `authorized-rebuild`：批准的既有 Ghost root 先在外部持久化 `PreResetAuthorizationManifest`、root-identity lease 与 strict journal header；再通过现有 daemon control/shutdown 边界完成认证的 run-bound graceful quiesce，取得 immutable `QuiescedPreResetObservationReceipt`；snapshot/restore probe 只从该 checkpoint 后稳定状态开始，之后才 exact reset 允许集合并证明 blank state。

顺序固定 MR→SP，每种 mode 内 pristine→rebuild。BiliDili 两个场景都验证 migration 017 和非空 scope identity。

### Deletion, configuration and deferral boundaries

- 只允许两个批准的 Ghost knowledge roots 和 demand-owned pristine roots；禁止源码、其他知识库和 allowlist 外写入。
- `observedPreResetPointers` 只服务授权、漂移检查和 snapshot 恢复；post-blank `activationExpectedPointers.publicSession` 才是最终 CAS expected value，本需求四场景均为 null。
- authorized rebuild 另冻结实际 pre-reset legacy/strict reader binding、resolver/config/enrollment、dedicated publication marker和只读基线结果；恢复必须逐项相等，不能用 route-null 假装旧数据已可服务。
- snapshot、target、external operation-lock roots 相互不重叠；root-identity lock 覆盖 reset、restore、candidate build 和 CAS。
- 一个 external strict run journal 位于 demand-owned evidence/operation-state root，和 target/snapshot 分离；authority、root-identity lease 与 `StrictRunJournalHeaderV2` 必须在任何 target-root 变化（包括停写）前 readback/fsync。随后只复用现有 daemon HTTP/token/shutdown 边界执行 quiesce；不得先 kill/restart writer，也不得让 ready short-circuit 吞掉 strict action。snapshot/init/reset 必须等待 post-quiesce receipt，Plan/manifest 只在后续 append bind。strict marker 固定在 `.asd/context/recipe-publications/marker.json` 允许域，不能修改 provider/model config。
- 使用运行时解析出的精确生产 DeepSeek/provider/model/prompt/SOP/temperature/token/concurrency/retry-cost/embedding/vector 配置；凭据只记录位置符号，不记录 secret。
- 初始 `deferredCells=[]`；运行时无延期或缩范围开关，未来任何延期、删除扩张或能力缩减需用户重新确认。

## Current Implementation Truth

| Checkpoint | Verified result | Consequence |
| --- | --- | --- |
| Core Foundation | controller历史上先接受覆盖到`AlembicCore@cb517460d9c1f9d7853b51bd914062cd5ba3a116`的Foundation checkpoint，后续同一 demand 已推进更多非 Test packages | 复用，不重建；历史 checkpoint/acceptance 仍须由 revision-154 后的 final artifacts 重放 PC-F，不能单独证明当前整链 |
| Projection authority | Foundation v1 的 `capture` 接收调用方 `projections`；审计脚本给五 consumer 生成 `{consumer, projectMode, repoIds, requestKinds}` 占位 payload | placeholder hash/lineage 不能证明真实 consumer payload；strict v2 必须由实际 adapter 产生 projection receipt |
| Repo scope authority | Foundation v1 的 `capture.repositories` 和 readiness `expectedRepoIds` 都来自调用方，审计脚本还用同一 repositories 同时喂两边 | 新增 Core-owned、capture 前生成且由已确认 project-mode scope 驱动的 `ProjectScopeManifestV1`；同步篡改 capture/expected lists 也必须失败 |
| Request coverage | v1 readiness/index 对多数 kind 只容许每仓一行；审计计划对 file-flow/file-symbols 只选每仓第一个 parser-supported file，对 anchor/source-slice 也只选一个文件 | strict V2 row identity必须包含 repo/kind/selector/`canonicalScopeHash`/language/parser/surface，保留全部适用行；删除/复制/交换语言或scope-only swap/alias均失败 |
| Frozen source bytes | v1 只给 detail-selected keys 写 chunk；omitted continuation 是 key hash，不能在进程重启后解析原字节 | 每个 eligible readable file 必须有 immutable content-addressed blob/ref；detail 只是 presentation，live 文件变化/删除后仍能取冻结 bytes，绝不 fallback live read |
| Module facts | `inferOwnerModuleIds` 主要按路径启发式归类 | owner origin/confidence 与 package/build/source evidence 必须显式；启发式不可单独驱动 criticality、exclusion 或 coverage |
| Main facts | `PlanSelectionGate` 分别构建 workflow facts 与 Core Plan projection；generation使用前者、Plan LLM使用后者；module candidates silent `.slice(0,20)` | Plan/generation 当前不同源；必须 post-blank 同一 artifact、无 silent truncation |
| Main/Plugin bypass | Main workflow/consumer/module/AiDimension、`ProjectMapModules` Package.swift/raw scan+12/80 caps，以及 Plugin project-context-analysis/module/dimension completion/submit `tool-router` 24-cap、empty-axis/Core-passthrough 仍可生成缩小且貌似有效的 module axis | 全部进入 PC-F inventory；strict applicable paths 改用 artifact-only canonical module adapter，旁路 counters=0；>12/>24/>80不截断，missing submit axis fail closed |
| Foundation receipt order | base certification 在 store.put 时已写入，actual adapter 只能在 preparation/lease/open 后运行 | 顺序固定为base cert+put→open→adapter receipts→immutable consumer lineage/PCFBaseline；不回写base certification hash |
| Current loaded Map | `partial`；mount conservation 把 98=15+83 写 `complete`；第一页可显示 0 nodes；package scripts 被投影成 repo nodes | mount accounting 与 project coverage 分字段；continuation 诚实；script-as-repo=0 |
| Current loaded Graph | 曾见 5 discovered/1 attempted 的进行中投影；terminal loaded结果仍 partial/degraded，有 suppressed errors、重复 scoped paths；repo-only success 不等于九类 request完整 | 只接受 terminal build/request matrix，任何 required error/duplicate identity 未关闭则 PC-F blocked |
| Strict setup observation | `StrictExternalSetupRecovery.ts` 当前 authority/header 绑定停写前 `rootTreeHash`，initialize/recover 又要求停写后的 whole-root canonical 精确相等 | 旧合同不可执行；pre-quiesce observation 只作授权/漂移/恢复 provenance，snapshot authority 改为 post-quiesce receipt |
| Real daemon shutdown | `DaemonSupervisor.start()` 的 ready fast-path 早于 strict action 分类，restart 可先 kill writer；`daemon-server.ts` shutdown 会删除 daemon state/PID，`Bootstrap.shutdown()` 会 checkpoint(TRUNCATE)+关闭 SQLite | strict action 必须先分类；child 先 durable external authority/header，再经现有认证 daemon boundary graceful-quiesce 并等 exact ack/PID exit/checkpoint receipt；timeout 不得 SIGKILL 后继续 snapshot |

上述是问题证据，不是通过结论；不得用 Core/Agent/Alembic 局部测试数替代真实 loaded-artifact lineage。

## Final Completion Definition

只有以下全部成立才完成：

1. **PC-F 基地通过。** `unclassifiedEntries=0`、`unknownCriticalCapabilities=0`、`requiredRequestFailedOrPartial=0`、`openConfirmedDefects=0`；独立 scope receipt固定 MR5/SP root+4；`eligibleFiles = frozenBlobAvailable + readFailed` 且 critical read failure=0；parser readiness按全部 present language/parser families +代表性 critical/module surfaces 守恒，parse-all留给 I4；`refs = resolved + typedExternal + dangling` 且 critical dangling=0。N/A 由 frozen applicability policy 和 controller review 证明，不能由 owner 自报。
2. **真实消费者同源。** base certification 在 artifact put 时先封印，然后 preparation/lease/open；Plan、Recipe generation、dimension completion、dependency graph、module coverage 的实际 loaded entrypoint 再产生 artifact-bound projection receipt，并由不回写base hash的 post-open lineage 汇总。五者共享 `artifactId/sourceVectorHash`；strict direct ProjectContext、raw filesystem、synthetic ProjectScope、capped module/empty-axis passthrough counters 均为 0。Graph/region 是单独 live probe，不伪装 artifact consumer。
3. **ProjectContext 真实可用。** MR 5/5、SP root+4来自独立 scope manifest而非 caller自证；九 request 按 V2 repo×selector×`canonicalScopeHash`×适用 language/parser/surface 终态验证；完整 inventory、all-eligible frozen blobs、可解析 detail/full chunks/continuation、identity/path/module/ref 守恒；>12/>24/>80 module fixtures不截断；Map/Graph 的 script、paging、partial/completeness 和重复 path defects 关闭。跨进程门禁只比较 canonical scope + exact SourceRevisionVector +排除session/cursor/time/path等瞬态字段的 `terminalSemanticOutputHash`；`factFingerprint/factSessionRef`只作cache诊断，mtime-only touch允许改变fingerprint。
4. **blank 后才认知 Plan。** reset/init/blank → single certified facts → Plan LLM cognition → deterministic compile。任何 pre-reset facts、double capture、partial facts、silent top-N 或 per-round re-Plan 均阻断。
5. **Plan 可执行且不过度承诺。** 26 维 catalog 与十类 anatomy lens 正交；每个 eligible scope 的 anatomy applicability、module/cell universe、exclusions、caps 与 `deferredCells=[]` 守恒。Plan LLM 的扩展 `PlanIntent` 形成完整 question/subquestion/tool/priority/within-cap budget/stop-escalate decomposition；compiler只校验并实例化required obligations，执行投影不得丢priority/tool/budget。Plan只保证调查可执行，不自证价值或覆盖。
6. **fact harvest dimension-free、view-free且multiscale守恒。** direct fact复用ProjectContext subject/ref和frozen anchor，在不同lens/scale只记一次；file/module/repo聚合是带ordered premise witness的derived fact，不能复制raw fact。SourceGraph schema未被真实producer产出的edge不得出现；cells通过`lensBindings`复用facts/clusters/questions。
7. **发现过程可归纳且不丢项。** policy+artifact先形成不可由Plan删减的 anatomy/fact baseline；每个 population 保存完整 denominator、long tail、variant/outlier/negative controls 和 typed omissions。Analyst以 append-only expansion epochs迭代 query→population revision→candidate pre-group→Analyst-owned cluster→induction→claim-applicable counterquery，探索和反证查询都必须先登记 obligation/parent schedule/revision再执行，直到 final schedule/fixpoint seal；每个 observation 有 Analyst语义 disposition和确定性守恒。Induction负责假设语义，Producer只表达最终 `survived|narrowed` 且 eligible 的假设；每个语义 discard 和 merge/duplicate/zero suppression均按合同独立复核。每个 eligible hypothesis 的0..N表达及所有 repair/reject/suppression/content-ready fate均进入不可变集合收据，refuted/zero-induction分支留在Analyst终态且无伪造表达集，`unresolved=0`后才能G3，不能因 cell已有Recipe而丢掉潜在知识。若内容门禁暴露机制/新颖性缺陷并触发新fixpoint，旧fixpoint的全部下游行只保留为证据；必须从空的私有语料revision按新fixpoint完整重放，旧Recipe不得污染去重、覆盖或候选快照。
8. **LLM 是主能力但无自证权。** Plan负责调查拆解，Analyst负责机制理解/final clustering并可主动提出受控查询，Producer负责0/1/N表达；任何 LLM-added fact、schema-only edge、live-FS grounding、Markdown finding、数量填充、Producer direct-submit或自评均失败。每个non-pass只有一个owner/permitted mutation/resume state，不能generic retry/skip/degrade。
9. **G1/G2/coverage 客观。** G1硬正确性、non-persisting admission、独立且经 golden calibration 的 G2、investigated-empty reviewer、G3 content-ready coverage 与 G4 serving readiness均有 typed receipt；Recipe数、文件数、字数、引用数、工具数不作为价值 proxy。
10. **停写、持久化与 finalization 可恢复。** pre-quiesce authority、external lease、journal header 全部 durable 后，现有 daemon 边界才接受同一 run 的认证 graceful-quiesce；post-quiesce whole-root/checkpoint receipt 才是 snapshot 基准。每个private-corpus revision使用批准Ghost data root内独立、confined、absent-before-create的物理data root并复用同一Repository/Gateway/KnowledgeService栈，旧root封存只读且后续open/read=0；停写中、receipt前、snapshot后、reset后、CAS前后的 fresh-process 恢复均有幂等阶段；writer/KnowledgeService/lifecycle/ref/journal 路径经故障注入；refs、coverage、sparse、首个 vector generation 和 G4全部 awaited；authorized恢复精确 post-quiesce snapshot 后用正常 runtime 建立新的 daemon PID/state/token，绝不恢复陈旧进程身份；`completed_with_errors` 不可 finalized。
11. **覆盖/发布无环且消费者中立。** content-ready→G3→private assembly/sparse/vector→G4→serving reconciliation→immutable final coverage→`ServingSnapshotValidationReceipt`→serving manifest→final CAS。Main 不依赖 Plugin、不构造 candidate handle、不运行 MCP handler；生产者门禁不以消费者实现反证自身前置条件。
12. **公共行为正确且分层验收。** I8 先证明 exact Plugin artifact 与 versioned serving contract 兼容；CAS 后 Test 才通过正式 Search/Prime/Map/Guard 读取同一 pointed serving snapshot，并以 live-source、Recipe-free 的 Graph 完成真实正/负/跨项目/漂移/schema oracles。Plugin/Test 缺陷归消费者 owner，不自动否定已通过内在门禁的 Recipe candidate。
13. **controller 先完整验收，用户再启动 Test。** 所有修订后的非 Test 产品仓、cross-chain、真实 daemon quiesce/checkpoint、fault、fresh-process、artifact/load hash证据通过后，controller 重建并核验精确 artifacts/manifest；只有用户再次明确开始并配合环境操作，才恢复 T6。Test只跑预构建 accepted artifacts；不能兜底证明实现正确，bug回 owner修复→controller reaccept→artifact rebuild→用户确认后 Test rerun。

## Confirmed Phase Order And Binary Acceptance

唯一 demand/state root 已存在；controller revision 154 当前为 `blocked`，I0 仍已完成。此前非 Test 包已推进至 I8 验收，进入 I9 时的真实入口证据暴露 R0 strict setup 合同不可能成立；这不是 T6 通过结论。全部修复继续留在该 root，不得创建额外 demand、重复 claim 或另行 delivery。同仓同一时刻只有一个 combined package，前包 review 后才可产生同仓 NEXT package。

| Phase | Task | Binary exit |
| --- | --- | --- |
| I0 (completed) | controller 已显式 claim 既有 TODO 并创建唯一 demand/state root | exact Design Key/TODO provenance；revision 154 的 redesign 不改变一次 claim/单 root 事实；后续不得第二次 claim/delivery/重复 TODO |
| I1 | actual loaded package/dist/config provenance + historical defect reproduction | loaded hash 与 controller evidence一致；无法归因 stale artifact/source/config则 blocked |
| I2.0 Core fact authority | 保留 Foundation store/readiness；新增独立 scope producer、含`canonicalScopeHash`的V2 request row/index/readiness和all-eligible frozen blobs；停止用 caller scope/placeholder projection自证；base certification在put时先seal，post-open actual adapter lineage另行聚合且不回写；补owner/inventory/read/ref conservation | 同步改 caller repo/expected lists仍失败；scope-only swap/alias失败；多语言/多scope行唯一完整；omitted detail file可离线重开；base hash前后不变；unknown/unclassified/confirmed defect counters=0 |
| I2.1 Main migration | `ProjectContextWorkflowFacts`、`ProjectContextConsumerFacts`、`ProjectMapModules`、Plan/generation/AiDimension/ModuleService/session strict paths改读同一 artifact；修双采集、top20、Package.swift/raw scan、12/80 caps、null/fail-open | Plan/generation/dependency/module lineage同 hash；>12/>80守恒；strict bypass=0；drift fail closed |
| I2.2 Plugin + Graph/Map | Plugin Plan/generation/dimension/module/submit `tool-router` 读取同一 artifact；修24-cap/empty-axis/Core passthrough；`.gitmodules`仅 live probe；修 terminal graph matrix、script taxonomy、pagination与mount-accounting命名 | SP root+4 tuple一致；>24守恒且missing axis fail closed；script-as-repo=0；required errors=0；Map不能冒充项目 coverage |
| I2.3 PC-F acceptance | 两项目 fresh-process、mutation/differential fixtures、实际 entrypoints总验收 | controller 写 `PCFBaselineReceipt`；任一缺口则 I3+仍 blocked |
| I3 Plan cognition | Core先从policy+artifact生成不可删的十类anatomy/fact applicability；Plan LLM扩展现有PlanIntent，输出question DAG、subject/scale、tool/query、priority、within-cap budget/reserve、support/counterevidence与stop/escalate；compiler生成cells/lens/harvest/execution projection | 每scope每anatomy row分类且`requiredUnsupportedBlockedCount=0`；unsupported-blocked是owner stop而非N/A；required work不被LLM变薄；同receipt compile byte-identical；投影保留priority/tool/budget；独立LLM新问题delta可审而非预设结论等价；无top20/floor/deferred/starvation |
| I4 fact harvest | 从 frozen blobs运行真实loaded versioned backends，生成anchored direct facts、premise-witnessed derived facts和multiscale complete populations | 每 baseline obligation终态守恒；同fact跨view/scale只记一次；derived witness可重放；schema-only edge/Top-N不能宣称能力/complete；error≠empty；clean rerun hash稳定 |
| I5 Analyst/induction/Producer | Analyst用append-only bounded expansion迭代population→candidate pre-group→Analyst final mechanism cluster→induction→**先登记再执行**claim-applicable counterquery直到fixpoint；Producer只对最终`survived|narrowed` eligible hypotheses proposal-only地枚举0..N Recipe表达，N=0时另有mandatory non-draft disposition；refuted/zero-induction止于Analyst终态 | finalExpandedSchedule含全部探索/required反证obligations且AnalysisFixpoint seal；singleton/many→one/one→many/zero fixtures；所有语义discard/suppression独立复核；Producer无submit/persist/review工具；每个non-pass有唯一owner/resume；任何事实越权/未决population阻断 |
| I6 content gates | 为当前fixpoint分配独立confined private-corpus data root，通过受限resolver+Core supported DB migration建立schema并验证identity/config/初始空态后才构造同一Repository栈；每个表达或mandatory zero-disposition row依次 G1→admission→expression-disposition review或independent G2→journal-authorized deterministic-ID private persistence→ref reconciliation→contentReady；关闭HypothesisExpressionSetReceipt；语义退回时封存旧root、失效下游并从新的物理空root完整重放 | 只有最终未失效fixpoint+sealed private-corpus root/revision可退出；每个leaf的canonical `{version,migrationArtifactSha256}` semantic hash相同且BiliDili含017（raw `applied_at`可不同）、project/scope identity、sanitized config ref、zero knowledge/ref/coverage/vector/publication初态通过；hard axes全过；producer/reviewer隔离；≤2 repair；每版本0..N表达与条件zero-row守恒，所有row有唯一terminal fate/parent、reject/supersede仍保留，merge/duplicate精确绑定最终content-ready代表，terminal-head `unresolved=0`；“先持久化A、后续行触发re-fixpoint”及“新旧fingerprint相同”fixtures证明root/DB hash分离、旧root open/read=0、旧A不参与去重/覆盖/快照且不被幂等复活；crash前后实际Recipe ID等于prepared ID、无公共caller自定ID/随机UUID/重复Recipe；无 quantity proxy/filler/重复 persist |
| I7 coverage/durability/index | G3→durability→assembly→sparse/first vector→seal→G4→final coverage→tool-neutral serving validation→manifest→CAS | 所有 required cells终态；无 partial/unknown/deferred；Main无Plugin依赖/MCP ownership；一个公开 winner；失败按场景恢复 |
| I8 controller product acceptance | Core→Agent→Alembic→Plugin→Dashboard(if triggered)最终产物/链路审查；Plugin 用 versioned serving fixtures 验证 exact artifact compatibility，不读取 run-private candidate | 历史包验收只证明当时合同；revision 154 后必须补验 authority/header-first、真实 daemon quiesce/checkpoint、post-quiesce snapshot、fresh-process recovery，并重建 exact artifacts/load hashes |
| I8-R current repair | Alembic 同仓 NEXT 修复 strict setup 两阶段时序，复用 `StrictExternalSetupRecovery`、`DaemonSupervisor`、`daemon-server`、`Bootstrap`，不另造控制/锁/journal/snapshot 平台 | live-ready strict execute 不被吞；header/lease 先于停写；认证 ack；真实 checkpoint 后 receipt；snapshot/reset；逐阶段 crash resume；exact restore 后新 PID/state/token；普通 daemon 无回归；controller 接受并重建 artifacts |
| I9 Test（暂停） | MR pristine/rebuild→SP pristine/rebuild；CAS 后首次用正式五工具运行完整真实 developer oracle，并做重复性/故障矩阵 | 只有 I8-R 与全部非 Test target accepted、精确 artifacts/manifest 重建核验、用户再次明确开始并配合环境后才可创建/派发 Test；任一五工具失败回 owner 修复并重验 |
| I10 | 对照本 completion definition 最终判定 | 全项通过才完成 |

## Five MCP Responsibilities

| MCP | Fixed responsibility | Required acceptance |
| --- | --- | --- |
| Search | 只从 pointed snapshot检索 serving-ready Recipes，使用其 sparse + exact vector generation | 无 staging/unready/deprecated/drift/cross-project；知识覆盖查询不误召回通用 test coverage；negative intent生效 |
| Graph | live-source ProjectContext/source structure，Recipe-free | MR5/5、SP root+4；terminal request matrix/continuation/identity诚实；无 script-as-repo或 Recipe mount |
| Recipe Map | ProjectContext region + deterministic serving Recipe mounts | `mountAccountingCompleteness` 与 project coverage 分离；读取 exact final coverage receipt；paging累计诚实 |
| Prime | 用正式 retrieval 组装 schema-valid知识包 | Recipe/usage/source/negative intent/publication provenance完整；缺证据时 degraded/fail |
| Guard | 对显式 files/overlay应用 pointed ready rule Recipes | positive/negative/missing/unreadable/out-of-root；知识不足不假 pass；只读 snapshot |

## Known Problem Baseline — Never Pass Evidence

- Alembic live DB：98 Recipes = active73/staging20/deprecated5；261 refs；93有refs；134 paths；126 coverage cells全thin/covered0；仅2/98有retrievalProfile+usageGuide。
- BiliDili live DB：75 Recipes = active71/staging4；337 refs/215 paths；60 drifted refs影响30 active；coverage 22 covered/64 partial/125 thin；缺migration 017；scope IDs为null。
- Search只排deprecated且返回过staging/unready；“覆盖度”误召回通用测试覆盖率。Map 98 candidates/15 mounts/83 deferred的账目守恒被误叫coverage complete。Prime真实调用schema mismatch/fail。
- 历史Graph发现五仓仅遍历1/5；当前代码虽有5/5 fixtures，loaded Graph仍见partial/degraded、suppressed errors、progress/terminal混淆和重复path风险。
- Plan/generation当前双事实输入；真实 `PlanIntent`/`PlanNextAction` 已有 priority/tool/action seam，但执行投影丢失它们；`PlanAgentRun`截前20 modules并直接产PlanSelection；Plan/authoring存在dimension×3、targetRecipes>0、每finding一Recipe等填充压力。
- ProjectContext 已有 subject/ref/range/relation原语，但 SourceGraph rich edge schema 的真实 indexer主要只产部分import edges；Tree-sitter/ProjectGraph有500-file、排除tests、timeout/parse partial，config parser又可能error→empty。它们都不能直接冒充完整call/data/control/order/history事实。
- `AiDimensionPreparation`多项fact输入为null或失败后继续；EvidenceCollector有截断/error→not_found；AnalysisArtifact可Markdown派生最多5 findings；coverage partial/exhausted可收敛；refs/vector/afterPublish nonblocking；`completed_with_errors`可映射completed。
- writer可能先删旧文件；lifecycle move返回值未检查。Core86/Agent32/Alembic39和Plugin17中的顺序敏感失败只是历史局部基线，不能替代生产闭环。

## Non-Goals And Forbidden Shortcuts

- 不新建第二套 ProjectContext store/registry/parser、Plan domain、AnalysisToolbox、semantic/Concern Graph DB、proof engine、Pattern DB、Graph snapshot registry、Recipe/ref/coverage/sparse多指针或 persisted sparse generation。
- 不把 deterministic miners 变成新的认知主角，也不把 LLM 降成只写 rationale；Plan/Analyst/Producer各自承担已定义认知职责。
- 不用 prompt/SOP、LLM 多次一致、schema-declared edge、Top-N、partial Graph、启发式 owner、mount accounting 或局部测试数证明事实完整、价值或覆盖。
- 不全局删除 legacy 路径或改变普通 lifecycle/completed语义；strict mode只对批准 roots生效，旧分支在真实 consumers迁移后再按接受证据隔离/删除。
- 不运行 broad `fullReset()`，不在 query 时补数据，不承诺 destructive rebuild期间旧 session在线。
- 不创建第二套 daemon control、lock、journal、snapshot 或恢复平台；不把 `daemon.json`/`daemon.pid` 之外的未知变化泛化成 volatile allowlist，不把 DB/WAL/SHM 排除出语义哈希。
- 不为发布前 candidate 新增 Main→Plugin 依赖、candidate handle/reader、内部五 MCP 调用或跨仓 oracle transport；五工具不是每次 candidate 的内在质量门禁。
- Design 不实现、测试、派发、accept、deliver、改TODO或state；Test不build/install/patch产品。

## User-Confirmation Ledger

| Decision | Confirmed outcome |
| --- | --- |
| Demand partition | 已有且只保留当前唯一 demand/state root；I0 已完成；PC-F 是不可绕过的 Plan 前合同且须在 final artifacts 重放；历史执行已到 I8，当前仅一个 Alembic NEXT repair；不得再次 claim/deliver或并发同仓 package |
| LLM architecture | Plan/Analyst/Producer继续是主要认知能力；项目事实、miners、compiler、gates在正确时机提供事实和边界，不替代认知 |
| Mining decomposition | 项目事实按十类anatomy view与多尺度canonical subjects拆解；Plan负责问题/tool/budget编排，Analyst负责机制归纳，Producer负责表达；deterministic组件不替代语义理解 |
| Deletion/recovery | 仅两个批准Ghost roots；先授权/observed pointers/snapshot/restore，再exact reset；源码/其他知识库禁止触碰 |
| Publication | 单条通过仍私有；全barrier后一个compare-null public route；destructive interval可public=null |
| Candidate/public consumer split | 每次 candidate 只过 Alembic/Core 消费者中立 serving admission；不要求 Plugin 五工具发布前验收。Plugin compatibility 属 I8 exact-artifact 验收，正式五工具属于 CAS 后 Test |
| Strict quiesce | pre-quiesce authority/root identity/lease/header 必须先 durable；随后通过现有 daemon 边界执行 run-bound authenticated graceful shutdown；post-quiesce whole-root/checkpoint receipt 才能授权 snapshot/reset，停写前观测不得冒充 snapshot 基准 |
| Projects | Alembic五仓；BiliDili主工程+四个指定Packages |
| DeepSeek/config | 冻结运行时解析出的精确生产provider/model/prompt/SOP/budgets/embedding-vector；凭据仅位置符号 |
| Deferral | 初始`deferredCells=[]`；未来延期或缩减必须重新确认 |
| Test | 真实 Test 仍必需但当前暂停；修订后的全部非 Test target 由 controller 接受、精确 artifacts/manifest 重建核验后，还须用户再次明确开始并配合环境操作；MR→SP、pristine→rebuild、重复性/故障/五MCP；hidden bug回owner再复验 |

Open product questions: **none**. 当前真实阻断是 Alembic strict setup 两阶段 quiesce/recovery 尚未实现并通过 controller 非 Test 复验；随后还需重建/核验精确 artifacts/manifest。Test 的最后启动门是用户再次明确开始并配合环境操作；现在不得创建 Test task/card/dispatch。
