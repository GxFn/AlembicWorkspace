# Recipe 冷启动生产质量重建 — Workspace Handoff

- Design Key: `recipe-coldstart-production-quality-2026-07-15`
- Date: 2026-07-15
- Priority: P0
- Type: requirement
- Status: S1 同一 demand 原位重设计；controller revision 154 因 strict setup 的 pre/post-quiesce whole-root 观测矛盾为 `blocked`；用户已确认两阶段 graceful-quiesce 合同与 Test 暂停门；等待 controller re-intake，不声称修订实现、重新验收或 T6 已完成
- Source Window: Design
- Receiving Window: AlembicWorkspace
- Auto Claim: false（既有 TODO 已显式 claim；不得再次 claim/deliver、复制 TODO 或创建第二个 root）
- Delivery Action: none；不调用 `wakeflow_deliver`，不修改 TODO/state/package/dispatch

## 1. Handoff Outcome

四份同一 Design Key 的文档已按当前真实源码和用户最新决定协调更新。目标架构不是“用确定性 selector 取代 LLM”，而是把事实、认知、裁决和编排分清：

- ProjectContext/Foundation 负责完整、可重载、可追溯的项目事实；PC-F 必须先修稳，不能默认完好。
- 十类 project-anatomy views 与 26 维正交：structure/boundary、entrypoint/contract、dependency/call/data/control、state/lifecycle/persistence、error/recovery/concurrency、config/build/migration、API/protocol、cross-cutting、idiom、evolution。每个scope均有required/excluded/unsupported证据，不是新registry或运行时延期表。
- Plan LLM 复用扩展现有 `PlanIntent`/`PlanNextAction`，负责 question/subquestion→anatomy→subject/scale→tool/query→support/counterevidence→stop/escalate 的拆解及硬上限内 priority/breadth/expansion/counterquery reserve；compiler只校验/实例化required obligations并保留这些字段，不替Plan发明项目语义。
- fact backends 对 canonical subjects 做 dimension-free harvest；direct fact复用ProjectContext ref/frozen anchor，跨view/scale不重复；aggregate/absence必须有premise/denominator witness。SourceGraph schema中没有真实producer的edge保持unsupported。
- Analyst LLM 是主动模式理解主力，经受控 fact-query/miner ports 比较 multiscale occurrences、variants、outliers 和 negative contrasts；deterministic grouping只给candidate pre-group，final mechanism cluster由Analyst提出。探索和 claim-applicable counterquery 都必须先进入 append-only schedule再执行。
- Analyst induction负责假设语义；每个final cluster都有reviewed terminal induction/zero-hypothesis disposition。Producer LLM只消费`survived|narrowed` hypotheses，负责 0/1/N Recipe表达、usageGuide、retrievalProfile、negative intent；refuted/zero-induction分支不伪造expression set。任何语义discard和merge/duplicate/zero suppression按合同独立复核，二者均不补事实或自审。每个Producer-eligible hypothesis的所有expression/repair/reject/suppression/content-ready fate进入不可变集合收据，`unresolved=0`后才允许G3。
- G1、non-persisting admission、independent calibrated G2、G3/G4、tool-neutral `ServingSnapshotValidationReceipt` 和 final CAS 分别裁决硬正确性、重复/价值、覆盖、serving 与公开；Plugin 不参与 candidate 状态机。I8 验证 exact-artifact serving-contract 兼容，CAS 后 Test 才运行正式五工具真实矩阵；任何一步不能靠 Recipe 数、字数、文件数、工具数或 LLM 自信代替。
- 所有 non-pass 使用同一逻辑 typed return，唯一绑定 owner、permitted mutation、repair depth、invalidated seal 和 resume state；gate-triggered Analyst re-fixpoint/cluster-hypothesis split-merge 与 Producer wording repair共享因果parent/root-set，换ID或seal不能把`semanticRepairDepth>2`归零；strict path 禁止 generic retry/skip/degrade/completed-with-errors。
- G2若暴露假设机制/新颖性缺陷，不能只重做该行：单一strict journal追加revisioned `ANALYSIS_FIXPOINT_INVALIDATED`，旧fixpoint的expression/admission/review/persist/ref/content-ready/set后代只保留为证据；关闭旧repository handles并封存其root后，新fixpoint使用批准Ghost data root内独立、confined、absent-before-create的revision leaf。受限resolver保留source/projectScope identity、只覆盖dataRoot，通过Core supported DB migration/init验证canonical `{version,migrationArtifactSha256}` semantic hash（BiliDili含017）、identity/config引用及zero knowledge/ref/coverage/vector/publication后才生成`PrivateCorpusRevisionHandleV1`；raw `applied_at`只留审计且可不同。随后复用同一Repository/Gateway/KnowledgeService/WriteZone栈按完整eligible集合重放。所有下游收据绑定fixpoint+revision+init/root manifest，切换后旧root open/read=0，旧Recipe不得参与去重、覆盖、assembly或被“同fingerprint幂等”复活；这不是第二个语料服务、schema过滤层或编排器。
- strict persistence不能继续由`KnowledgeEntry`随机分配ID：journal先写prepared ID，只有受`journalStepToken`授权的内部Gateway方法可把`preparedRecipeId`经`#prepareCreateData`映射到`KnowledgeEntryProps.id`；公共/legacy caller无ID注入权，DB/file/ref回读必须`actual=prepared`且strict UUID allocation=0。
- 候选始终私有。Main/Core 只做消费者中立 serving admission，不新增 Main→Plugin 依赖、candidate handle/reader 或内部 MCP 路由。最终只有一个 `publicSessionPointer`/`PublicKnowledgeRoute` compare-null CAS 公开 sealed session；Graph live-source、Recipe-free，Map 才在 CAS 后挂载 Recipe。
- revision 154 的 setup 合同改为两阶段：pre-quiesce whole-root observation 只作授权/漂移/恢复 provenance；external authority、existing root-identity lease 与 `StrictRunJournalHeaderV2` durable 后，strict child 才通过现有 daemon HTTP/token/shutdown 边界请求 run-bound graceful quiesce；old PID exit、真实 SQLite checkpoint 和 exact control-state delta 共同形成 `QuiescedPreResetObservationReceiptV1`，只有其 whole-root hash 可以授权 snapshot/reset。
- Test 仍必需但当前暂停。Alembic 修订实现和全部非 Test target 须先由 controller 接受，精确 artifacts/manifest 需重建并核验，然后还要用户再次明确开始并配合环境操作；现在不创建 Test task/card/dispatch，也不把 Test 当正确性兜底。

本次没有实现产品代码、运行 build/冷启动/Test、操作 Ghost root、创建/修改 demand/state/TODO/package 或再次 delivery。

## 2. Source Artifacts

- Original Plan: `Design/docs/current/recipe-coldstart-production-quality-original-plan-2026-07-15.md`
- Requirement Design: `Design/docs/current/recipe-coldstart-production-quality-requirement-design-2026-07-15.md`
- Test Environment Spec: `Design/docs/current/recipe-coldstart-production-quality-test-environment-spec-2026-07-15.md`
- This handoff: `Design/docs/current/recipe-coldstart-production-quality-workspace-handoff-2026-07-15.md`
- Historical five-tool evidence: `wakeflow-ledger/workspace/archive/2026-07/alembic-five-knowledge-tools-deep-audit-2026-07-11/target-results/tr-p4-dual-mode-five-tool-acceptance-resume6-t1.json`
- Current blocked evidence: `.wakeflow-active/current/recipe-coldstart-production-quality-2026-07-15/target-results/tr-i9-alembic-main-external-setup-recovery-rootcause1-t1.json`
- Current superseded package: `.wakeflow-active/current/recipe-coldstart-production-quality-2026-07-15/task-packages/i9-alembic-main-external-setup-recovery-rootcause1-p1.json`
- Current code anchors: `Alembic/lib/recipe-pipeline/generate/strict/StrictExternalSetupRecovery.ts`, `Alembic/lib/daemon/runtime/DaemonSupervisor.ts`, `Alembic/bin/daemon-server.ts`, `Alembic/lib/http/routes/daemon.ts`, `Alembic/lib/Bootstrap.ts`

## 3. Current Progress And Code Truth

### 3.1 What is already real and reusable

- Core `service/project-context/foundation/*` already provides certified artifact contracts, source revision vector, immutable capture/store/readiness, root-confined reopen and one-preparation/one-run lease. Existing tests/audit prove meaningful substrate behavior; do not design a second store/readiness system.
- Historical controller evidence accepted successive non-Test packages through I8 sufficiently to enter real setup; final-artifact PC-F remains a mandatory regression, not a reason to restart a second demand.
- `PlanIntent`/`PlanNextAction` already carry dimension intent, priority, planned tool/action and evidence seams; `ProjectContextRef`/map already carry subject/relation/anchor/range; host-agent analysis units, `AnalysisArtifact`, Evidence Ledger, Capability Registry, PipelineStrategy, `CreateRecipeItem`, Gateway dedup/consolidation, retrieval contracts, writer/ref/vector primitives and formal five MCP executors are real reuse seams.
- These seams are not the finished strict chain: current Plan projects to thinner `PlanSelection`, SourceGraph declares more edge kinds than its indexer actually produces, ProjectGraph is partial, Evidence Ledger has no premise/denominator witness, and Producer currently can submit directly.
- Revision 97 的 T5 断链已由源码确认：Main package 不依赖 Plugin，Plugin package 不依赖 Main；Main `StrictPrivateCorpusRuntime.runCandidateFiveToolOracle` 只做 repository CRUD+sparse/vector probes，正式五工具 dispatch 位于 Plugin `embedded-executor.ts`，而 `ResidentServiceBoundary.test.ts` 禁止 Main 接管 Codex-facing MCP。用户因此确认删除该跨仓运行时门禁，而不是补造 caller/transport。
- Revision 154 的断链同样由源码与运行探针确认：`StrictExternalSetupRecovery.ts` 的 V1 authority/header 绑定 pre-quiesce whole-root hash，initialize/recover 却在 quiesce 后要求 canonical 相等；`DaemonSupervisor.start()` 的 ready shortcut 早于 strict classification，restart 会先 kill；真实 `daemon-server` shutdown 删除 state/PID，而 `Bootstrap.shutdown()` checkpoint(TRUNCATE)+关闭 SQLite。当前 Alembic baseline `43306622a06e2782381aa1aa257681f1f7aa8781` 未提交该修复，26/26 focused tests仅是旧基线。
- Current DimensionRegistry baseline is 26 dimensions: 13 universal, 7 language, 5 framework, 1 synthesis.

### 3.2 Historical foundation obligations retained for final-artifact regression

下表仍是需求正确性与最终重放标准，但不是 revision 154 当前要重新并发派发的 package 清单。当前唯一实现 blocker 是 Alembic two-stage quiesce/recovery；只有新 artifact 触及这些共享合同时才回到对应 owner。

| Blocker | Real code evidence | Required correction |
| --- | --- | --- |
| placeholder projection authority | Foundation v1 capture accepts caller `projections`; audit script creates only `{consumer,projectMode,repoIds,requestKinds}` summaries | strict-v2 canonical facts identity must not treat placeholders as consumer truth; each actual loaded adapter emits an artifact-bound projection receipt |
| repo-set self-certification | Foundation v1 capture repositories and readiness expected IDs are both caller inputs; audit uses the same list for both | Core-owned pre-capture `ProjectScopeManifestV1` derives from accepted project-mode scope; synchronized caller-list deletion/addition/alias still fails |
| request matrix too thin | v1 index/readiness assumes one row per most repo/kind pairs; audit chooses one first parser-supported file per repo for file-flow/symbols and one file for anchor/slice | V2 request row key includes selector/`canonicalScopeHash`/language/parser/surface; preserve all applicable rows and fail delete/duplicate/language-or-scope swap/alias mutations |
| omitted bytes are not frozen | v1 writes chunks only for selected detail keys; continuation is only omitted-key hash | freeze every readable eligible blob in Foundation CAS/equivalent snapshot; detail pages resolve it after restart/live-file mutation, never fallback live source |
| module owner heuristic | `inferOwnerModuleIds` uses path shapes such as `src`, `Sources`, `Packages` | record owner origin/confidence/evidence; heuristic alone cannot set criticality/exclusion/coverage; shared/ambiguous is typed |
| Main double facts | `PlanSelectionGate` builds workflow facts and separately calls Core Plan collector; Plan LLM and generation consume different objects | post-blank one artifact; Plan/generation/dependency/module actual projections share artifact/vector |
| Main/Plugin bypasses | Main consumer/workflow/AiDimension/ModuleService plus `ProjectMapModules` Package.swift/raw scan+12/80 caps, and Plugin project-context-analysis/module/dimension completion/submit `tool-router` 24-cap+empty-axis/Core passthrough can shrink/fail open | strict applicable paths use artifact-only canonical module adapters; direct/raw/synthetic/capped/empty-axis counters are zero; >12/>24/>80 conserve and missing submit axis fails closed |
| certification/adapter order | Foundation base certification is written at store.put; actual adapter runs only after preparation/lease/open | seal base certification first, then actual adapter receipts and immutable post-open consumer lineage; never write adapter evidence back into the base hash |
| current Plan is lossy | existing `PlanIntent`/`PlanNextAction` have priority/tool seams, but `PlanAgentRun` returns thin executable PlanSelection, runtime tools are disabled, candidates are sliced to first20, and projection loses priority/actions | extend existing intent with question DAG/anatomy/subject-scale/tool/budget/stop-escalate; Plan may select frozen tool IDs without executing them; compiler preserves accepted execution schedule; no second Plan domain or silent top20 |
| current fact inputs are weak | AiDimension inputs can be null/fail-open; RuntimeInitializer uses `projectGraph=null`; code/graph tools are Top-N; EvidenceCollector can coerce error toward `not_found`; rich SourceGraph edge schema exceeds real producer coverage; config parser errors may become empty | canonical direct-anchor/derived-witness/multiscale facts; loaded producer capability matrix; typed populations/continuations/errors; required missing producer blocks affected reasoning; error/schema presence never means fact or empty |
| finding/Recipe pressure | Markdown fallback derives up to five findings; prompts/GenerateProduce require one Recipe per finding and minimum findings; Producer action space includes direct submit; Plan budgets contain floors | strict path disables fallback/floors/direct submit, permits 0/1/N proposal-only output and uses Plan budgets only as investigation upper-bound allocations |
| Map semantic drift | loaded Map is partial; 98=15 mounts+83 deferred accounting is labeled complete; mounts-first continuation can show zero nodes | split `mountAccountingCompleteness` from project/final coverage; expose cumulative per-type paging and exact final coverage receipt |
| script-as-repo | package scripts become target then collapse into region kind repo and can consume overview budget | extend/filter taxonomy so command scripts are never repo/module nodes; actual repo node appears once |
| Graph terminal/cache ambiguity | progress can show 5 discovered/1 attempted; repoCoverage may say complete while terminal request set remains partial/degraded/suppressed errors; duplicate scoped roots observed. `factFingerprint` includes cache-sensitive metadata and output carries session/cursor refs | accept only terminal build/request matrix; cross-process gate uses scope + SourceRevisionVector + transient-free semantic output hash. Fingerprint/session ref are diagnostic; required partial/error/duplicate identity blocks PC-F |

### 3.3 PC-F final-artifact acceptance invariant

无论历史 package 已通过到何处，最终 rebuilt artifacts 仍只有在以下证据全部成立时才可进入用户授权的 Test：

- `unclassifiedEntries=0`;
- `unknownCriticalCapabilities=0`;
- `requiredRequestFailedOrPartial=0`;
- `openConfirmedDefects=0`;
- independent scope receipt fixes MR5/SP root+4;
- `eligibleFiles = frozenBlobAvailable + readFailed`, critical read failure=0; parser readiness separately covers all present language/parser families + accepted critical/module surfaces, while full obligation parsing belongs to fact generation;
- `refs = resolved + typedExternal + dangling`, critical dangling=0;
- sealed base certification precedes preparation/open; five actual consumer projection receipts then share one `artifactId/sourceVectorHash`, immutable post-open lineage references the unchanged base hash, and strict direct/raw/synthetic/capped/empty-axis counters=0;
- >12/>24/>80 module/owned-file fixtures conserve the full axis and Plugin submit missing-axis fails closed;
- terminal Graph/Map truth cards, MR5/5, SP root+4, inventory/detail/full-chunk/continuation/owner/identity conservation, mutation/differential and fresh-process cards pass.

`repairCommits=[]` is legal only for an owner whose complete matrix already passes. A file, interface, unit test or audit placeholder cannot close PC-F.

## 4. Design Tightening Matrix

| Prior risk | Final contract |
| --- | --- |
| new ProjectContext platform | reuse Foundation capture/store/readiness/lease; add only strict-v2 actual adapter projection receipts and coverage semantics |
| LLM Plan disabled or parallel Plan domain | keep Plan LLM as semantic planner by extending existing `PlanIntent`/`PlanNextAction`; Plan names later tool/query IDs and budget strategy but performs no live tool call; deterministic compiler preserves the accepted action schedule |
| project understood from dimensions alone | freeze ten anatomy views per scope before Plan; dimensions classify knowledge/coverage while anatomy decomposes code; neither list may silently thin the other |
| facts physically partitioned by dimension/view/scale | direct Fact identity reuses canonical subject+anchor and excludes cell/dimension/query/view/scale order; aggregates require ordered premise witnesses; reuse via `lensBindings` |
| selector becomes cognitive authority | fact-query/miner is an Analyst tool and evidence producer; Analyst owns mechanism understanding within typed facts |
| schema equals implementation | every relation family needs a loaded producer/hash/fixture; unproduced SourceGraph edge, parser failure or config error is unsupported/failed, not a fact or empty |
| findings go directly to Recipes | baseline population → iterative Analyst expansion/population revisions → mechanism cluster → induction → enrolled falsification/fixpoint → Producer 0/1/N expression-set conservation |
| Top-N/error interpreted as no pattern | population carries full denominator, continuation, long tail and `raw=accepted+duplicate+excluded+error`; partial/error stays unknown |
| one finding one Recipe / min count | Producer may propose merge/split/zero Recipe expression with typed reason; every suppression is independently reviewed, and a singleton contract/invariant may pass without a recurrence floor |
| self-certifying value | G1 hard correctness then Gateway admission then independent calibrated G2; Producer invocation cannot review itself |
| generic retry/degrade | each non-pass has one typed owner, permitted mutation, repair count, invalidated seal and resume state; persistence/index faults never call an LLM |
| cell-specific fact explosion | cell requires explainable lens binding, not a dedicated selector; shared cluster can close multiple cells only with applicability evidence |
| path overlap/exhausted closes coverage | coverage ledger remains advisory; immutable candidate/final receipts bind contentReady/servingReady IDs or independently reviewed empty |
| Graph consumes Recipe | Graph stays live/Recipe-free; Map combines region with deterministic Recipe mounts |
| every candidate must pass Plugin five tools before CAS | remove the cross-repo runtime gate: Alembic/Core validates the sealed serving contract per run; controller I8 validates exact Plugin artifact compatibility with versioned fixtures; T6 runs the first complete formal five-tool matrix after CAS |
| many public pointers | one sealed serving snapshot + one public route; sparse is deterministically verified, vector keeps its real internal generation ID |
| one pre-quiesce whole-root hash used for both authorization and snapshot | V2 two-stage contract: pre-quiesce receipt is provenance; external lease/header precede the existing daemon's authenticated graceful quiesce; post-quiesce checkpoint+whole-root receipt alone authorizes snapshot/reset |
| broad daemon recovery redesign | minimal Alembic-only extension of `StrictExternalSetupRecovery` + `DaemonSupervisor` + existing daemon route/shutdown + `Bootstrap`; no second control/lock/journal/snapshot platform |
| Test discovers missing implementation | controller first accepts complete connected products and exact artifacts; Test then looks for hidden environment/packaging/timing/semantic bugs |

All proposed receipt/type names are requirement contracts, not current implementation claims. Frozen facts/tool observations may extend Foundation/Evidence Ledger metadata; LLM semantic clusters/hypotheses live only in extended AnalysisArtifact/evidence bundles and reference ledger IDs; recovery state lives in Alembic's proposed single strict journal. Do not create one store per noun or present the journal as existing code.

The recent external research is incorporated as executable constraints rather than a bibliography: Glean/Kythe inform immutable fact and anchor/subject identity; ReAct/SWE-agent inform Plan tool/action decomposition and typed interfaces; Concern Graphs informs cross-cutting back-maps; PR-Miner/HAGGIS and MAPO/GrouMiner inform full populations, protocol variants and counterqueries; Soufflé informs compact derivation witnesses; Getafix informs multiscale history evidence. Requirement §25 maps each source to an exact contract, test and explicit non-adoption. None of those systems is claimed installed or required.

## 5. Earlier Controller Findings Mapping

| Finding | Final location |
| --- | --- |
| deterministic 26-dimension/scale/cell policy | Original Plan completion/phase I3; Requirement §§10.1–10.7; Test T1 |
| G3/G4 cycle removed | Requirement §§6, 12, 14–15; Test T3–T5 |
| final public pointer unique and last | Requirement §§14–15; Test T5/fault matrix |
| pristine-init + authorized-rebuild | Original Plan scope; Requirement §§8, 17; Test §§2,8 |
| Graph Recipe-free | Original Plan five MCP; Requirement §§6,15–16; Test five-tool matrix |
| objective G2 and investigated-empty | Requirement §§11.6,12.2; Test fixtures/T2B/T3 |
| prebuilt artifact provenance | Requirement §§18.6–20; Test §§3–5 |
| pre-reset authorization before Plan | Requirement §§8–10; Test setup/T0–T1 |
| one demand/sequential NEXT packages | all four document status/phase sections |
| complete ProjectContext consumers | Requirement §§2,7,9; Test §6.3/T0 |
| final coverage before tool-neutral serving admission; public Map after CAS reads exact receipt | Requirement §§12,14–16; Test T4–T6 |
| executable Test bindings/Dashboard branch | Test §§2.1,3–5,12,16; Requirement §§18.5,19 |
| LLM-centered fact-driven mining | Original Plan goal/I3–I6; Requirement §§3–4,10–12,18; Test T1–T3 |
| anatomy decomposition + existing PlanIntent reuse | Original Plan responsibilities/completion/I3; Requirement §§2,4,10.3–10.7,18; Test fixtures/T1; Handoff §§1,3–4,8–10 |
| multiscale direct facts + derived witnesses + real producer capability | Requirement §§2,4,10.5,11.2–11.8,18; Test fixtures/T2A/faults/evidence bundle |
| typed one-owner gate return | Requirement §§6,11,17–18; Test T2B/fault matrix; Handoff §§9–11 |
| external research method→minimal contract | Requirement §25; no external platform is an implementation dependency |
| counterquery schedule conservation | Original Plan completion/I5; Requirement §§4.2,11.2–11.3,12.4,17; Test T2A/T3/fault matrix |
| hypothesis→0..N expression conservation | Original Plan completion/I5–I6; Requirement §§4.2,11.6–11.8,12.4; Test T2B/T3/evidence pack |
| semantic re-fixpoint dependency invalidation | Original Plan completion/I6; Requirement §§4.2,6,11.6–11.8,17–18; Test T2B/T3/T7/fault matrix |
| physical corpus-revision init/isolation + deterministic persistence ID | Original Plan completion/I6; Requirement §§4.2,6,11.6–11.8,13,18; Test T2B/T3/T7/fault/evidence pack |
| revision 154 pre/post-quiesce state-machine repair | Original Plan true-empty/phase I8-R; Requirement §§2.3,4.2,6,8,17,18.3; Test §§3,8,10,12–16 |
| Test explicit pause/start gate | Original Plan completion/ledger; Requirement §§18.6,20,22–23; Test status/§§3,12,16; Handoff §§7–14 |

### 5.1 Revision 154 supersede mapping

| Old blocked clause/behavior | Superseding contract | Preservation rule |
| --- | --- | --- |
| V1 authority/header freezes `preResetObservation.rootTreeHash` and initialize/recover requires exact post-quiesce canonical equality | V2 authority keeps pre-quiesce receipt as provenance; immutable post-quiesce receipt supplies snapshot/restore hash | whole-root hashing remains exact; no ignore list weakens knowledge/DB bytes |
| `DaemonSupervisor.start()` ready fast-path may return before strict classification | classify strict `execute|recover|complete` first and require strict-child/new identity | ordinary non-strict ready behavior stays unchanged |
| restart path may terminate writer before child authority/header | strict child acquires existing external lease and fsyncs header before it requests existing-daemon shutdown | no pre-kill and no second lock/control service |
| generic shutdown/timeout can end in kill and caller proceeds | hashes-only authenticated idempotent quiesce request/ack; timeout/conflict blocks snapshot/reset | existing daemon HTTP/token/shutdown coordinator remains owner |
| daemon state/PID deletion and SQLite checkpoint appear as unauthorized whole-root drift | exact minimal volatile delta plus semantic DB/WAL/SHM checkpoint receipt, then post-quiesce whole-root hash | no stale PID/token/state restore; `daemon-entrypoint.json`, marker/config and unknown paths stay protected |
| generic crash recovery around snapshot/reset | §17 stage table for before header, request/ack, draining, receipt, snapshot, reset, restore and CAS | fresh-process idempotency; exact restore before normal-runtime restart |
| current I9 rootcause package attempts the impossible V1 equality | preserve its failing evidence, supersede its contract, and create one reviewed Alembic NEXT package only after controller re-intake | do not rewrite old result, dispatch Test, or add another demand/TODO |

## 6. Pointer-State Recovery Contract

| State | Meaning | Permitted use |
| --- | --- | --- |
| `observedPreResetPointers` | existing route/vector observations plus DB/file hashes/counts before destructive work | authorization, drift check, snapshot/restore only |
| `ObservedPreResetPublicationModeReceipt` | actually loaded legacy/strict resolver artifact, config/enrollment, dedicated marker interpretation and bounded baseline read before rebuild | snapshot recovery must reproduce it before prior data may be served; never activation expected value |
| `ObservedPreQuiesceRootReceiptV1` | whole-root/control/DB observation before daemon shutdown | authorization, drift and recovery provenance only; never snapshot expected hash |
| `StrictSetupAuthorityReceiptV2` + external lease + `StrictRunJournalHeaderV2` | run/root/policy/artifact authority durably recorded outside target | must readback/fsync before quiesce or any target mutation |
| `QuiescedPreResetObservationReceiptV1` | authenticated ack or typed absence, old-PID exit, checkpoint/WAL/SHM proof, exact minimal control delta and post-quiesce whole-root hash | sole snapshot source/restore equality authority; null tree only for proven pristine absence |
| `activationExpectedPointers` | post-init/reset blank-state re-read | final CAS expected value; all four scenarios require public session null and no active vector generation |
| final route payload | sealed serving manifest/vector/source/Plan lineage; timestamp fixed before prepare | `PUBLIC_CAS_PREPARED` stores/refers to full canonical bytes + all-byte hash and separate semantic hash; recovery accepts only exact bytes, then lock-inside-compare null→payload |

- pristine pre-CAS failure: candidate private, public null, preserve evidence and discard only demand-owned root.
- authorized rebuild pre-CAS failure: old session was not continuously visible; under the existing external lock restore and verify the exact post-quiesce snapshot before runtime restart, never restore stale PID/token/state, then let normal runtime create fresh control state and restore/reselect the observed reader-mode binding. Prove DB/files/vector/route/migration-ledger plus resolver/config/enrollment/marker and baseline-read equality before reuse. Route-null alone is not serviceability.
- CAS conflict: full runs first contend on the external operation lease, so the loser never reaches CAS; an isolated route-store primitive race still proves one null→route winner. Any unexpected non-null is drift/conflict, not assumed valid old state.
- post-CAS T6 five-tool failure: CAS remains an atomic whole-session switch but the requirement/Test row fails. Preserve public evidence and exact loaded hashes, fence readers, discard pristine or restore the rebuild post-quiesce snapshot as above, then return to the exact owner and rerun controller acceptance, artifact rebuild and user-authorized Test.
- guarantee: no partial new session. Authorized destructive rebuild has a deliberate public-null interval.

## 7. Confirmed Decisions

| Decision | Confirmed result |
| --- | --- |
| Execution partition | the only demand/state root remains revision 154/blocked; I0 claim is complete; no second claim/delivery. Historical non-Test packages advanced to I8; current work is one reviewed Alembic NEXT repair, never concurrent same-repo work |
| LLM roles | Plan/Analyst/Producer remain primary cognitive roles; facts/compiler/gates provide evidence/boundaries/state transitions |
| Mining decomposition | ten anatomy views + multiscale canonical subjects; Plan question/tool/budget composition, Analyst final mechanism clustering/induction, Producer proposal-only expression; no second Plan/graph/mining platform |
| Deletion/recovery | only two approved Ghost roots; pre-quiesce authority/lease/header, then existing-daemon graceful quiesce and post-quiesce receipt, then snapshot/restore/exact reset; source/other roots forbidden |
| Publication | per-item pass private; one final compare-null route; destructive interval may be public null |
| Candidate/public consumer split | per-run pre-CAS gate is Alembic/Core tool-neutral serving validation only; no Plugin five-tool candidate gate or Main→Plugin dependency. I8 owns exact-artifact Plugin compatibility and post-CAS Test owns the full formal five-tool matrix |
| Strict quiesce | pre-quiesce whole-root hash is provenance only; authenticated post-quiesce checkpoint/whole-root receipt is snapshot authority; no pre-kill, ready short-circuit, broad volatile allowlist or second daemon-control platform |
| Projects | MR Alembic five repos; SP BiliDili root + four named Packages |
| Config | exact current production provider/model/prompt/SOP/budgets/embedding/vector frozen; credential-location symbols only |
| Deferral | initial `deferredCells=[]`; any later deferral/scope reduction needs renewed user confirmation |
| Test | required but paused; revised non-Test acceptance + rebuilt/reverified artifacts/manifest + fresh explicit user start/cooperation are all required; then MR→SP, pristine→rebuild, fault/five-tools; hidden bug→owner fix→reaccept/rebuild→retest |

Open product questions: **none**. Operational gates are the Alembic repair/reacceptance, rebuilt artifact+binding revalidation, and the later explicit user Test-start signal.

## 8. Producer/Consumer Order In The Existing Single Demand

### 8.1 I1–I2 PC-F first

`loaded-artifact provenance/reproduction → Core Foundation authority/correctness → Main actual adapters → Plugin actual adapters + Graph/Map truth → controller PCFBaselineReceipt`.

| Owner | PC-F work | Exit |
| --- | --- | --- |
| AlembicCore | preserve existing Foundation; strict-v2 projection authority; selector×canonical-scope×language/parser matrix; base-certification-before-open order; owner/identity/inventory/ref/error conservation | all Core required rows/counters zero; scope-only mutations fail; base hash unchanged after adapters; accepted load/hash/mutation evidence |
| Alembic | migrate Plan/generation/dependency/module/session and `ProjectMapModules` to one artifact; remove strict live/raw/synthetic/double capture and 12/80-cap fallback; loaded trace | four actual projections share artifact/vector; >12/>80 conserve; bypass=0; drift fails |
| AlembicPlugin | migrate dimension/module/submit `tool-router`/host sessions; remove 24-cap/empty-axis passthrough; `.gitmodules` only live probe; repair Graph terminal truth, duplicate paths, script taxonomy, Map accounting/paging | fifth projection same artifact/vector; >24 conserves and missing axis fails closed; SP tuples exact; Graph/Map cards pass |
| Controller | independently review raw evidence | one `PCFBaselineReceipt`; otherwise all I3+ blocked |

Foundation lease semantics remain separate from external setup. The single Alembic strict journal uses `StrictRunJournalHeaderV2` under the external evidence/operation-state root. Authority and the existing root-identity lease are validated first; header readback/fsync occurs before the quiesce request. The strict child then calls the existing daemon HTTP/token/shutdown boundary, waits for exact old-PID exit/checkpoint and seals the post-quiesce receipt before snapshot. Reset/blank/facts append later; `PLAN_ACCEPTED` and `MANIFEST_BOUND` remain later immutable bindings. No target/snapshot copy is recovery authority, and no second lock/control/journal platform is added.

### 8.2 I3+ sequential NEXT work

Historical planned order, retained as provenance rather than a fresh dispatch list:

| Order | Window | designIntent and package boundary |
| --- | --- | --- |
| 1 | AlembicCore NEXT | **编译边界而不替代认知。** 扩展现有PlanIntent/PlanNextAction；anatomy/applicability、Plan compiler、canonical-subject direct/derived witness、multiscale unit/population/cluster/induction/final-schedule/typed-return contracts；复用 Foundation/ProjectContextRef/Tree-sitter/Evidence Ledger，不建第二graph/proof engine |
| 2 | AlembicAgent first | **让三个 LLM 角色各司其职。** Plan question/tool/budget cognition、Agent-owned PipelineStrategy typed epochs、Analyst active-query/final cluster/counterevidence reasoning、claim-applicable counterquery request、Producer proposal-only 0/1/N expression sets、independent reviewer/goldens；无 live-read/floor/direct-submit/self-pass |
| 3 | Alembic NEXT | **连接单一可恢复主链。** 新增一个strict durable run journal；exact reset→one facts→extended PlanIntent/compile→anchored/witnessed facts→iterative analysis/enrolled-counterquery fixpoint→Producer expression set→G1/admission→disposition-or-G2→private finalizer/set closure→tool-neutral serving validation→manifest→CAS；typed failure精确resume，调用Agent PipelineStrategy接口，不另建平行认知orchestrator或Plugin依赖 |
| 4 | AlembicPlugin NEXT | **统一正式公共消费面。** host handshake、public route/vector、Search/Map/Prime/Guard；Graph live/Recipe-free；用versioned serving fixtures验 exact accepted artifacts，不读取private candidate、不增加Main依赖/handle |
| 5 | Dashboard conditional | only if controller proves an observability gap; read-only receipts, no control/state |
| 6 | Controller I8 | final loaded artifacts, cross-chain/fault/concurrency/fresh-process and full PC-F rerun |
| 7 | Test I9 | exact prebuilt artifacts, four real rows, hidden-bug loop; now paused after setup blocker and requires a fresh user start signal |

At most one combined package per repository is in flight. No downstream owner recollects ProjectContext, fabricates missing fields or weakens a gate.

Current revision-154 order is narrower:

| Order | Window | Current action and exit |
| --- | --- | --- |
| 1 | Alembic NEXT | V2 authority/header; strict dispatch before ready fast-path; existing-daemon authenticated graceful quiesce; post-quiesce checkpoint/whole-root receipt; exact snapshot/reset; §17 stage recovery and ordinary daemon regression |
| 2 | Controller | independently accept live traces/faults/fresh-process restore; rerun final cross-chain/PC-F regressions; rebuild and verify exact RuntimeArtifactManifest/load receipts |
| 3 | User gate | explicitly request Test start and cooperate with approved environment operations |
| 4 | Test | only then create/run T6 four-row matrix; no product patching |

Core/Agent/Plugin/Dashboard are `not-applicable` to the current repair unless Alembic implementation proves an existing shared exported contract must change. Plugin five tools remain post-CAS.

## 9. Controller Intake And Acceptance Duties

1. Re-intake/reconcile these four linked files in the existing single demand/state root. Preserve Design Key/P0/requirement/autoClaim=false. Supersede revision 154's V1 pre/post-quiesce equality clause with Requirement §§8/17 V2; preserve planned absence, whole-root snapshot, marker/config and public-CAS invariants. Do not deliver/claim/edit TODO/create another root.
2. Create at most one Alembic NEXT combined package. Do not reopen Core/Agent/Plugin/Dashboard unless the implementation proves a shared exported contract must change; do not involve Plugin five tools or Test pre-CAS.
3. Require actual runtime-loaded hashes before interpreting any source/test result.
4. Accept PC-F only with all classification/conservation counters zero, exact base-cert→put→open→actual-consumer→lineage order, canonical-scope and >12/>24/>80 mutations, strict module-axis bypass=0, terminal Graph/Map cards and mutation/differential/fresh-process evidence.
5. Translate only the revision-154 delta into the Alembic package: `StrictExternalSetupRecovery.ts`, `DaemonSupervisor.ts`, `daemon-server.ts`, existing daemon route, `Bootstrap.ts` and focused tests; require exact request/ack, volatile-state policy, stage journal and fresh-process recovery evidence.
6. For Plan, verify the extended existing PlanIntent has an acyclic question/anatomy/subject-scale/tool/query DAG, priorities, within-cap allocation/reserves and stop/escalate; `requiredUnsupportedBlockedCount=0` before PLAN pass; execution projection preserves them; one initial cognition plus at most two parent-linked semantic repairs; zero legacy executable Plan/top20/dual-capture/Recipe-floor paths. Do not treat unsupported as N/A or dispatch a “no LLM Plan”/second Plan domain.
7. For analysis, require non-removable anatomy/fact baseline, canonical direct Fact IDs, derived premise witnesses, multiscale conservation, append-only exploration/**claim-applicable counterquery** schedule, Analyst-owned final clusters/fixpoint, independent semantic review and Producer proposal-only 0/1/N sets. Do not create a query-per-cell platform, treat schema as producer capability or permit direct falsifier/Producer submit calls.
8. First review authority/lease/header-first, live-daemon strict dispatch, authenticated quiesce, old-PID exit/checkpoint, post-quiesce snapshot/reset and every §17 recovery stage. Then rerun affected RESET→PUBLIC cross-chain and final PC-F/artifact regression; old 26/26 tests or prose are insufficient.
9. Require Core/Agent/Alembic checks; Plugin check plus actual unit/integration tests; Dashboard only if triggered. Local counts never replace connected loaded traces.
10. Rebuild and reaccept the RuntimeArtifactManifest/load receipts after Alembic repair; prior package hashes are stale evidence for resumed Test even when unaffected artifacts remain byte-identical.
11. Revalidate the existing four symbolic environment bindings only after product acceptance. Then wait for the user's explicit Test-start/cooperation signal; before it, create no Test task/card/dispatch and perform no destructive root operation.
12. Test bug returns to owner through controller; rerun owner checks, cross-chain acceptance, rebuild/re-hash and user-authorized affected Test rows. Test pass does not auto-close the demand.

## 10. Required Raw Evidence

- exact repository/commit/tree/package/artifact and actual loaded hashes;
- PC-F counters, independent scope receipt, V2 repo×request×selector×`canonicalScopeHash`×language/parser/surface matrix, base certification/put/open/actual-projection/immutable-lineage order, frozen-blob/read/owner/ref and >12/>24/>80 module conservation, `ProjectMapModules`/submit-tool-router strict bypass traces and Graph/Map terminal cards;
- blank-before-Plan and one-capture traces for Main and host entrypaths;
- ten-row anatomy applicability per scope; extended-PlanIntent question DAG/subject-scale/tool-query/priority/budget/stop-escalate; compiler/execution-projection conservation, caps/origins, rerun delta adjudication and `deferredCells=[]`;
- canonical direct Fact IDs/frozen anchors, derived premise/denominator witnesses, multiscale unit/population conservation, real producer capability matrix, append-only exploration/claim-applicable counterquery schedule, `finalExpandedScheduleHash`, Analyst-owned final clusters/fixpoint, long tail, continuations/errors and independent reviews;
- every non-pass typed return with one owner/permitted mutation/repair depth/invalidated seal/resume state; causal parent/root-set mutation proves a third repair still fails after cluster/hypothesis/fixpoint ID changes; generic skip/degrade/direct Producer submit counters zero;
- persisted-A-then-later-G2-semantic-defect and same-fingerprint-after-re-fixpoint fixtures: append-only revision transition; distinct confined absent-before-create roots/DB hashes; each leaf has equal accepted migration semantic hash/identity/config/initial-blank receipt including BiliDili 017 while raw `applied_at` may differ; old handles closed and post-switch open/read counters zero; replacement root full replay; final dedup/coverage/snapshot free of stale A and no duplicate visible Recipe;
- `PERSIST_PREPARED` crash fixture: journal-authorized prepared ID traverses the real internal Gateway→`#prepareCreateData`→KnowledgeService path, actual DB/file/ref ID equals prepared before/resume, strict UUID allocation=0, and public/legacy ID injection is rejected/unreachable;
- 每个final cluster的terminal induction/zero-hypothesis disposition，以及每个`survived|narrowed` Producer-eligible hypothesis的0..N Recipe expressions + N=0 mandatory disposition row→G1→Admission→expression-disposition-or-G2→Persistence→Ref exact trace；G2六个hard axes逐轴`2|1|0|null`、typed reason/evidence、显式novelty/duplicate/matched-target与机械总判定；refuted/zero-induction无expression-set，eligible hypothesis恰有一个，merge/duplicate points to an exact final content-ready representative and terminal-head `unresolved=0`; reviewer calibration/separation;
- lens/cell candidate/final coverage, independently reviewed empty cases, durability/ref/vector/index/finalization receipts;
- planned-absent→actual path; V2 authority/external lease/header readback+fsync ordering; live-ready strict dispatch; exact authenticated quiesce request/ack; old PID exit and real checkpoint/WAL/SHM result; exact volatile delta and post-quiesce whole-root receipt; snapshot source/restore hash equality; crash at every setup journal boundary; exact restore before fresh normal-runtime PID/state/token; exact reset/migration/reader-mode/marker/config invariants; one public CAS;
- I8 exact-artifact Plugin serving-fixture compatibility with no private candidate access；T6 post-CAS public five-tool matrix；Graph Recipe-free/live；Map exact final coverage and honest mount accounting；
- filesystem forbidden-set diff and no unauthorized root/source write.

## 11. Failure Ownership

- Foundation strict-v2 projection authority, request/parser/owner/readiness, existing PlanIntent extension/compiler, anatomy/applicability, canonical-subject/witness/multiscale fact-population and typed-return schemas, G1/coverage/persistence/vector contracts, restricted revision resolver + supported DB-init/handle schemas and trusted prepared-ID Gateway seam → AlembicCore.
- Plan decomposition/tool/budget cognition, Analyst active investigation/final clusters/induction, claim-applicable counterquery proposals, Producer proposal-only 0/1/N sets, reviewer/goldens/repair lineage and PipelineStrategy owner/resume routing → AlembicAgent.
- Main artifact adapters plus V2 strict setup authority/header, strict dispatch-before-ready, existing-daemon quiesce route client/ack, checkpoint/post-quiesce receipt, exact snapshot/reset/restore, stage-specific recovery, witnessed fact execution, strict journal/finalizer/CAS → Alembic. Current package is Alembic-only unless a real shared contract gap is proven.
- Host artifact adapters including submit `tool-router`/24-cap/empty-axis fail-closed, Graph/Map truth, ordinary public resolver/five tools/vector route and versioned serving-fixture compatibility → AlembicPlugin. Plugin owns no private candidate reader, Main journal/manifest or CAS.
- display only → Dashboard if triggered.
- environment/artifact/config binding → controller and owning product; Test blocked.
- hidden product bug → Test evidence to controller, then owning repository.
- deferral/scope/capability/deletion expansion → user decision.

## 12. Operational Test Gates

- `TEST-GATE-IMPLEMENTATION`: Alembic two-stage quiesce/recovery not yet implemented or controller-accepted.
- `TEST-GATE-ARTIFACTS`: exact RuntimeArtifactManifest/load receipts and prior symbolic environment bindings have not yet been rebuilt/revalidated against the accepted repair.
- `TEST-START-USER`: user has not yet explicitly asked to begin the real run and cooperated with its approved environment operation.

All three must close. None permits guessed paths, credentials/provider settings, Test-built artifacts or a Test task/card/dispatch now.

## 13. Risks And Non-Goals

- LLM output varies; deterministic facts/populations and semantic outcome equivalence matter, not byte-identical prose.
- Plan cognition/compiler creates accountable investigation, not guaranteed valuable knowledge; Analyst/falsification/G2/coverage decide value and closure。五工具验证公共可消费性，不反向充当 candidate 内在价值门禁。
- Tree-sitter/ProjectContext and a rich SourceGraph schema do not prove every CFG/dataflow/order/runtime relation. Only a loaded producer+fixture can do so; unsupported required semantics fail/unknown, and an optional backend needs a demonstrated gap and accepted provenance.
- No second ProjectContext store/parser, Plan domain, AnalysisToolbox, semantic/Concern Graph DB, proof engine, Pattern DB, wholesale external mining platform, persisted sparse generation, multi-component public pointers or Graph Recipe mount.
- No prompt/SOP, heuristic starter, partial Graph, Top-N, mount accounting or LLM self-report as fact/value/coverage authority.
- No broad fullReset, query-time writes, runtime deferral, minimum Recipe count, hidden scope reduction or destructive old-session availability promise.
- No second daemon control, operation lock, journal, snapshot or recovery platform; no broad volatile allowlist or exclusion of DB/WAL/SHM from whole-root semantics.
- Design does not implement, Test, dispatch, accept, deliver, edit TODO or mutate state. Test does not build/install/fix.

## 14. Handoff Readiness And Next Action

- Original Plan, Requirement Design, Test Spec and this handoff now distinguish current Design S1 revision work from the already-existing single-demand execution state and use the same LLM-role, dimension-free fact, population/cluster/induction, coverage/publication and Test-after-acceptance terminology.
- Current implementation progress is distinguished from proposed contracts; historical I1–I8 acceptance and 26/26 focused tests do not prove the revision-154 contract.
- Revision 97 的断链已从需求层消除：不再寻找 Main 调 Plugin 的 caller/port/transport，也不把现有 CRUD+sparse/vector probe 冒充正式五工具。
- Revision 154 的状态机矛盾已从需求层消除：pre-quiesce observation 不再充当 snapshot equality；V2 authority/header-first、existing-daemon quiesce、post-quiesce receipt 和 stage recovery 有唯一 Alembic owner/源码落点/二元验收。
- No new product decision is open.
- Test is deliberately paused behind implementation, artifact/binding revalidation and explicit user start.

Next action: AlembicWorkspace controller 在同一 state root re-intake 四文档，supersede revision 154/rootcause3 的不可实现 V1 equality 条款，仅给 Alembic 创建一个 NEXT combined package完成两阶段 strict setup。接受真实 daemon/checkpoint/snapshot/reset/fresh-process recovery 与普通 daemon regression 后，controller 重建并核验 exact artifacts/manifest、重放 affected cross-chain/PC-F regression；随后停在用户 Test-start 门。不得 `wakeflow_deliver`、修改/复制 TODO、重复 claim、创建额外 root 或当前派发 Test。Design stops at S1 handoff.
