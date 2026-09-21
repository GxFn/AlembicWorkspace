# Recipe 冷启动生产质量重建 — Test Environment Spec

- Design Key: `recipe-coldstart-production-quality-2026-07-15`
- Date: 2026-07-15
- Test Required: yes
- Earliest Start: T6 remains in the existing single demand/state root, but only after every revised non-Test target is accepted, exact artifacts/manifest are rebuilt+verified, all bindings are revalidated, and the user explicitly starts and cooperates with environment operations
- Artifact Policy: run exact accepted prebuilt artifacts; Test may not build, install, patch or substitute
- Environment Owner: controller supplies symbolic environments/config/authorization; Test does not choose them
- Current Status: paused at controller revision 154; prior I9 entry/preflight exposed the strict pre/post-quiesce observation blocker, so the T6 production matrix did not run. Existing binding/artifact receipts are historical inputs and must be regenerated or revalidated after the Alembic repair; no new Test task/card/dispatch is authorized

## 1. Test Question

在产品仓库和 controller 已证明 strict cold-start 完整实现、实际加载 hash 正确后，Alembic workspace 与 BiliDili 能否在两个真正空库场景中：先按“external authority/lease/header durable → authenticated graceful quiesce → post-quiesce whole-root/checkpoint receipt → snapshot/reset”建立可恢复空态；再得到完整、正确、可用、可重复的 ProjectContext facts；由 Plan LLM、真实 loaded fact backends、Analyst LLM 和 Producer LLM 完成可追溯、可反驳的调查与0/1/N Recipe表达；只把硬正确、独立判定有价值且 lens/cell 覆盖闭合的 Recipe 安全持久化；验证 sparse/首个 vector、tool-neutral serving snapshot 和 single public CAS；最后在 CAS 后用正式五 MCP 运行真实 developer oracle，并在真实 provider、打包、迁移、并发、崩溃与恢复条件下保持这些性质？

Test 的第二目标是发现产品级 acceptance 难以暴露的 hidden bugs。有效 bug 由 Test 交 controller 归因，返回 owning repository 修复；产品与 controller 重新验收并重建同 hash contract 的 artifacts 后，Test 才复验。Test 不直接修复。

## 2. Mandatory Matrix And Order

Two confirmed project modes:

- `MR-ALEMBIC`: Alembic、AlembicCore、AlembicAgent、AlembicPlugin、AlembicDashboard。
- `SP-BILIDILI`: BiliDili root + AOXFoundationKit、AOXNetworkKit、AOXPlayer、AOXUIKit。

Each must run both empty-state scenarios:

| Order | Environment symbol | Project mode | Scenario | Required start | Destructive scope |
| --- | --- | --- | --- | --- | --- |
| 1 | `TEST_MR_ALEMBIC_PRISTINE` | MR-ALEMBIC | pristine-init | isolated non-production root; root/DB/Recipe/index paths physically absent | create only demand-owned Test root |
| 2 | `TEST_MR_ALEMBIC_REBUILD` | MR-ALEMBIC | authorized-rebuild | exact user-approved Alembic Ghost knowledge root | exact manifest allowlist after snapshot+restore probe |
| 3 | `TEST_SP_BILIDILI_PRISTINE` | SP-BILIDILI | pristine-init | isolated non-production root; root/DB/Recipe/index paths physically absent | create only demand-owned Test root |
| 4 | `TEST_SP_BILIDILI_REBUILD` | SP-BILIDILI | authorized-rebuild | exact user-approved BiliDili Ghost knowledge root | exact manifest allowlist after snapshot+restore probe |

Pristine and rebuild never substitute for each other. Stop the broader sequence after the first valid product failure; preserve raw evidence and return to controller. After an accepted fix, resume the failed row and rerun any affected prior rows/regressions.

Both confirmed production entrypaths used by these project modes must have product acceptance before Test: Alembic main/daemon strict orchestration and Plugin host prepare→confirm→execute/public MCP consumption. The eventual user-authorized Test card names which entrypath a step invokes; no unaccepted fallback path is permitted.

### 2.1 Executable symbolic environment bindings

These are **exact symbolic keys**, not filesystem paths. Controller previously materialized a binding receipt for the blocked attempt, but revision 154 and rebuilt artifacts require readback/revalidation before any resumed Test. Test must not infer a path, identity or authorization.

| Scenario symbol | Project/source root ref | Data root ref | Snapshot root ref | External operation-lock root ref | Evidence root ref | Ghost/project identity + authorization ref | Reset/restore/cleanup policy | Current resolution |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TEST_MR_ALEMBIC_PRISTINE` | `SRC_MR_ACCEPTED` = same-demand accepted five-repo source vector | `ENV.TEST_MR_ALEMBIC_PRISTINE.dataRootRef` | `NOT_APPLICABLE_PHYSICAL_ABSENCE` | `ENV.TEST_MR_ALEMBIC_PRISTINE.operationLockRootRef` | `ENV.TEST_MR_ALEMBIC_PRISTINE.evidenceRootRef` | `IDENTITY_MR_ACCEPTED` + `AUTH_MR_PRISTINE_ALLOCATION` | `PRISTINE_SUPPORTED_INIT__NO_RESET__DISCARD_DEMAND_ROOT_WITH_RECEIPT` | `MATERIALIZED_FOR_BLOCKED_ATTEMPT__REVALIDATE_AFTER_REBUILD` |
| `TEST_MR_ALEMBIC_REBUILD` | `SRC_MR_ACCEPTED` | `APPROVED_GHOST_MR.dataRootRef` | `ENV.TEST_MR_ALEMBIC_REBUILD.snapshotRootRef` | `ENV.TEST_MR_ALEMBIC_REBUILD.operationLockRootRef` | `ENV.TEST_MR_ALEMBIC_REBUILD.evidenceRootRef` | `APPROVED_GHOST_MR.identityReceipt` + `AUTH_MR_REBUILD_PRE_RESET` | `QUIESCE__POST_RECEIPT__SNAPSHOT__RESTORE_PROBE__EXACT_RESET__RESTORE_ON_PRE_CAS_FAILURE` | `MATERIALIZED_FOR_BLOCKED_ATTEMPT__REVALIDATE_AFTER_REBUILD` |
| `TEST_SP_BILIDILI_PRISTINE` | `SRC_SP_ACCEPTED` = BiliDili root+four named relative Packages and revisions | `ENV.TEST_SP_BILIDILI_PRISTINE.dataRootRef` | `NOT_APPLICABLE_PHYSICAL_ABSENCE` | `ENV.TEST_SP_BILIDILI_PRISTINE.operationLockRootRef` | `ENV.TEST_SP_BILIDILI_PRISTINE.evidenceRootRef` | `IDENTITY_SP_ACCEPTED` + `AUTH_SP_PRISTINE_ALLOCATION` | `PRISTINE_SUPPORTED_INIT__NO_RESET__DISCARD_DEMAND_ROOT_WITH_RECEIPT` | `MATERIALIZED_FOR_BLOCKED_ATTEMPT__REVALIDATE_AFTER_REBUILD` |
| `TEST_SP_BILIDILI_REBUILD` | `SRC_SP_ACCEPTED` | `APPROVED_GHOST_SP.dataRootRef` | `ENV.TEST_SP_BILIDILI_REBUILD.snapshotRootRef` | `ENV.TEST_SP_BILIDILI_REBUILD.operationLockRootRef` | `ENV.TEST_SP_BILIDILI_REBUILD.evidenceRootRef` | `APPROVED_GHOST_SP.identityReceipt` + `AUTH_SP_REBUILD_PRE_RESET` | `QUIESCE__POST_RECEIPT__SNAPSHOT__RESTORE_PROBE__EXACT_RESET__RESTORE_ON_PRE_CAS_FAILURE` | `MATERIALIZED_FOR_BLOCKED_ATTEMPT__REVALIDATE_AFTER_REBUILD` |

Binding rules:

- `SRC_MR_ACCEPTED` resolves the exact same-demand worktree commit/tree vector for Alembic/Core/Agent/Plugin/Dashboard; `SRC_SP_ACCEPTED` is controller-bound because BiliDili is not a repository mapping in the current Wakeflow config. The four Package roots are source scopes, never separate data roots.
- `APPROVED_GHOST_MR` resolves through the accepted ProjectScope identity and its five-folder identity receipt; `APPROVED_GHOST_SP` resolves through the accepted project registry/marker and root+4 source receipt. Current registry candidates are read-only discovery facts, not destructive authorization.
- Existing rebuild targets/parents are resolved to confined realpath receipts. A pristine target or any not-yet-created snapshot/lock/evidence leaf instead uses `plannedAbsentPathReceipt` over an authorized existing parent realpath + normalized leaf chain + lstat/no-symlink/nonexistence; creating the target early is forbidden. After supported creation, the actual realpath must equal the planned confined path. All **applicable** target/snapshot/lock roots are pairwise non-overlapping; pristine has no snapshot root, and evidence/journal state stays outside the mutable target. No durable evidence records an absolute path.
- `AUTH_*_REBUILD_PRE_RESET` references the user's deletion-boundary confirmation **and** the controller-generated `PreResetAuthorizationManifest` for the exact resolved identity. `AUTH_*_PRISTINE_ALLOCATION` proves the isolated root is demand-owned and absent. A generic “Ghost” label is insufficient.

Executable production-config bindings:

| Mode | Provider/config source ref | Required credential-location symbols | Resolution contract |
| --- | --- | --- | --- |
| MR-ALEMBIC | `PROD_CONFIG_MR = WorkspaceSettingsStore(APPROVED_GHOST_MR) → WorkspaceResolver.configPath.vector.localEmbedding fallback → accepted RuntimeConfigLoadReceipt` | `CRED_MR_DEEPSEEK = WorkspaceSecretsLocation::MR::ai.providerKeys.deepseek`; `CRED_MR_EMBED = WorkspaceSecretsLocation::MR::embedApiKey\|typed-not-required` | pristine and rebuild load the same accepted effective config through supported entrypoints; no secret copy |
| SP-BILIDILI | `PROD_CONFIG_SP = WorkspaceSettingsStore(APPROVED_GHOST_SP) → WorkspaceResolver.configPath.vector.localEmbedding fallback → accepted RuntimeConfigLoadReceipt` | `CRED_SP_DEEPSEEK = WorkspaceSecretsLocation::SP::ai.providerKeys.deepseek`; `CRED_SP_EMBED = WorkspaceSecretsLocation::SP::embedApiKey\|typed-not-required` | same rule; exact embedding model/endpoint must come from the load receipt, not settings-file presence alone |

Each `RuntimeConfigLoadReceipt` records source precedence, key presence, sanitized effective provider/model/endpoint symbol, prompt/SOP/budgets, embedding/vector parameters and config hash. Required key names are:

- runtime identity: `ALEMBIC_PROJECT_DIR`, `ALEMBIC_HOME`, `NODE_ENV`;
- AI: `ALEMBIC_AI_PROVIDER`, `ALEMBIC_AI_MODEL`, `ALEMBIC_AI_PROXY`, `ALEMBIC_AI_REASONING_EFFORT`, `ALEMBIC_DEEPSEEK_BASE_URL`, `ALEMBIC_DEEPSEEK_REASONING_EFFORT`, `ALEMBIC_AI_MAX_CONCURRENCY`, `ALEMBIC_DEEPSEEK_API_KEY`;
- embedding: `ALEMBIC_EMBED_PROVIDER`, `ALEMBIC_EMBED_MODEL`, `ALEMBIC_EMBED_BASE_URL`, `ALEMBIC_EMBED_API_KEY`.

Only key names, source symbols and presence/N/A reasons enter evidence. Current code persists `ALEMBIC_AI_REASONING_EFFORT` while `DeepSeekProvider` reads `ALEMBIC_DEEPSEEK_REASONING_EFFORT`, and the base URL is not part of the workspace-settings persistence map. Product acceptance must repair or explicitly reconcile these effective-load mismatches; Test cannot choose a value.

The existing controller binding receipt and artifact manifest are evidence from the blocked attempt, not reusable authorization by assumption. Before resumed Test the controller must emit/read back a revalidation receipt proving all four scenario bindings, two Ghost identities, source vectors, effective provider/embedding config, credentials-location symbols and external operation-state roots still match the newly accepted artifacts. Missing/drifted binding blocks. Separately, `TEST-START-USER` remains false until the user explicitly starts and cooperates; this is a deliberate pause, not an environment defect or product-scope question.

## 3. Hard Entry Gate — Product Acceptance Before Test

Test is blocked unless controller provides a signed acceptance bundle proving all of the following:

1. `PCFBaselineReceipt` proves same-demand I1/I2 was reviewed before I3+, and final artifacts reran PC-F with `unclassifiedEntries=0`, `unknownCriticalCapabilities=0`, `requiredRequestFailedOrPartial=0`, `openConfirmedDefects=0`: one Core facts artifact/store/lease; an independent pre-capture scope receipt fixing MR5/SP root+4; V2 repo×nine-request×selector×canonical-scope×applicable-language/parser/surface terminal rows; all-eligible frozen-blob/read/ref/module-owner conservation; sealed base certification before open, then actual loaded projection receipts (not audit placeholders) sharing `artifactId/sourceVectorHash` across Plan/generation/dimension completion/dependency graph/module coverage and one post-open lineage receipt; strict bypass counters=0; terminal Graph/region request matrix; Graph script-as-repo/duplicate root=0; Map mount accounting separated from project coverage with honest continuation.
2. Core, Agent, Alembic, Plugin and conditionally triggered Dashboard packages passed their full repository checks and targeted requirement tests.
3. Controller reviewed raw evidence for RESET, PC-RUN, ANATOMY/APPLICABILITY + extended-PlanIntent decomposition/tool/priority/budget + PLAN/SCHEDULE, anchored/witnessed FACT QUERY and multiscale population, ANALYSIS FIXPOINT, HYPOTHESIS/claim-applicable FALSIFICATION/DISPOSITION REVIEW, CONTENT, final-obligation+lens+cell G3, DURABLE, INDEX/G4, SERVING RECONCILIATION/FINAL COVERAGE, tool-neutral SERVING SNAPSHOT VALIDATION/SERVING MANIFEST and PUBLIC gates; prose/backfill or test counts alone are insufficient.
4. Isolated product-level end-to-end tests proved both entrypaths execute blank-before-Plan; one facts capture; Plan LLM cognition+compile with all ten anatomy rows and no-starvation budget; dimension-free direct/derived fact witnesses and multiscale populations; Analyst active query/final semantic clustering/induction with enrolled falsification; Producer proposal-only 0/1/N expression-set conservation; typed one-owner gate returns; strict reader isolation; serving snapshot validation and compare-null CAS. Separately, the exact accepted Plugin artifact passed versioned serving-contract/schema/handler fixtures without accessing a run-private candidate. Test must not be the first place a role, shared contract or chain is missing/disconnected.
5. Product-controlled evidence proves strict `execute|recover|complete` classification precedes ready short-circuit; external authority/root-identity lease/header readback+fsync precede any quiesce mutation; the existing daemon boundary performs authenticated run-bound graceful shutdown; post-exit SQLite checkpoint/WAL/SHM and exact volatile delta produce the immutable post-quiesce snapshot authority; snapshot/reset and every journal-stage fresh-process recovery pass; exact restore precedes a normal runtime that creates fresh PID/state/token; ordinary non-strict daemon behavior does not regress. Writer/DB/ref/vector/publication/CAS faults also pass.
6. A complete accepted `RuntimeArtifactManifest`, compatibility matrix and runtime load-check mechanism exist, including a consistent `dashboard-build` required/N/A branch.
7. `PCFBaselineReceipt`, controller acceptance bundle, RuntimeArtifactManifest and Test card name the same demand key/state root; controller resolves every §2.1 binding to exact symbolic receipts.
8. Exact production provider/config references resolve without exposing credentials.
9. Required V2 authority/header, strict-quiesce route/ack, post-quiesce receipt, snapshot, restore, exact reset, supported migration, strict publication and fault-injection entrypoints exist in the accepted artifacts.
10. Controller rebuilt and revalidated the exact artifact manifest and all §2.1 bindings after the revision 154 repair, and the user has explicitly set `TEST-START-USER=true` by asking to begin and agreeing to cooperate with the environment operation.

Missing any item is `blocked`, not a product failure, and does not authorize Test to implement or improvise it.

## 4. Runtime Artifact Provenance

Required prebuilt artifacts:

| Artifact ID | Producer | Required scope |
| --- | --- | --- |
| `core-package-dist` | AlembicCore | existing Foundation/ProjectContextRef/PlanIntent substrates plus independent scope and strict projection authority; anatomy/applicability + Plan compiler; canonical-subject/multiscale direct/derived fact witness, population/cluster/induction/falsification/final-schedule contracts; typed gate returns, coverage/persistence/vector/publication |
| `agent-package-dist` | AlembicAgent | extended PlanIntent decomposition/tool/budget strategy, Analyst active-query/final semantic clustering/counterquery proposals, Producer proposal-only 0/1/N expression sets, typed PipelineStrategy routing and calibrated independent reviewer |
| `alembic-runtime-release` | Alembic | V2 authority/header, strict-action-before-ready dispatch, existing-daemon authenticated graceful quiesce, post-quiesce checkpoint/whole-root receipt, exact snapshot/reset/restore and stage-specific fresh-process resume; then one-capture preparation, single strict journal, anatomy/Plan→facts→Analyst→Producer orchestration, strict finalizer, tool-neutral serving snapshot validation/manifest/CAS and zero Plugin/MCP dependency |
| `plugin-mcp-package-server` | AlembicPlugin | host handshake with artifact/schedule lineage, ordinary public publication resolver, versioned serving-fixture compatibility and five public tools; no private candidate factory/reader |
| `prompt-sop-evaluator-bundle` | Core + Agent | exact production prompts, SOP and evaluator rubric/goldens/version |
| `fact-query-pack-code-fact-backends` | AlembicCore (artifact owner); Alembic supplies a separate load/execution receipt | exact fact/query specs, current parser/grammar/backend producer artifacts, supported edge-kind matrix, direct-anchor/derived-witness canonicalizer, pagination/omission contract and positive/negative/edge/counterexample fixtures; schema-only edge kinds are unsupported. No unlisted backend repository/window may be inferred |
| `migration-bundle` | Core/Alembic | ordered supported migrations including 017 |
| `vector-adapter` | AlembicCore manager/contracts + Alembic build/runtime + AlembicPlugin public consumer | exact embedding provider/model/dimensions/store adapter and compatibility/load receipts across the fixed three owners, consumed by public Search/Prime; no generic “integration owner” |
| `dashboard-build` (conditional) | AlembicDashboard | when triggered: accepted read-only UI dist/API types; when not triggered: explicit N/A with controller trigger-decision receipt |

Each provenance entry records:

- artifact ID, owning repository, commit/tree or immutable package hash;
- artifact SHA-256 and byte size;
- deterministic build recipe, toolchain/runtime versions, lockfile hash;
- exported contract/schema/canonicalizer/migration/prompt/vector versions;
- fact-query pack, query, grammar/parser/backend, counterquery and fixture hashes where applicable;
- compatibility requirements and provider;
- controller acceptance evidence refs;
- sanitized symbolic entrypoint.

The manifest also records `PCFBaselineReceipt`, final PC-F capability/API contract hash, migration/compatibility result and final-artifact PC-F regression evidence. An initially accepted PC-F artifact hash may differ from a later same-demand NEXT-package final hash, but missing receipt lineage or unexplained contract drift blocks Test.

If Dashboard is triggered, its row records repository commit/tree/package, dist SHA-256/size, lock/toolchain/build recipe, generated API/schema hash and controller evidence; the compatibility matrix binds generated API types to the accepted Alembic runtime schema, and `RuntimeArtifactLoadReceipt` proves the actually served dist plus artifact-metadata hash. If not triggered, artifact, compatibility and load rows are all `not-applicable` with the same trigger-decision receipt; Test does not start Dashboard and draws no Dashboard runtime conclusion.

At process start, `RuntimeArtifactLoadReceipt` compares expected SHA-256/package version/dependency resolution to the actually loaded entry. A stale dist, second package copy, incompatible contract or missing artifact blocks before any root mutation.

Test may not run build, install, dependency update, code generation, compilation, package repair, cache refresh that changes artifacts, or source cleanup. It executes the provided artifacts exactly.

## 5. Frozen Production Configuration

For each scenario, resolve a secret-free config manifest before root creation/reset:

- exact DeepSeek provider, endpoint/region/project symbols, model ID and SDK/API version;
- prompt/SOP/evaluator versions and hashes;
- temperature, top-p/seed if supported, response format/schema;
- request/run token/time/cost budgets;
- concurrency, queue width, rate limit, retry/backoff/circuit and total repair cap;
- ProjectContext contract/readiness/canonicalizer and Plan policy/compiler versions;
- anatomy-catalog/applicability version; extended PlanIntent decomposition/tool-catalog/budget-strategy schema; code-fact/direct-anchor/derived-witness/multiscale canonicalizer; fact-query pack/counterquery versions; accepted parser/grammar/backend producer and supported-edge hashes; harvest/lens-binding/compiler version;
- strict `candidateAttemptCap`, cell-universe cap and independent request/file/detail/token/time/cost/repair caps within accepted wire limits; source/config of every value;
- strict fact/query/backend timeout/result/expansion caps as upper bounds; harvest budget is distinct from Recipe candidate attempts;
- sparse scorer/projection/config version;
- embedding provider/model/dimensions/normalization/batch/retry;
- vector store/schema/distance/inspection/route adapter;
- immutable strict enrollment from accepted config+project identity, target marker schema, external operation-lock root/order/recovery, serving snapshot/public route schema and MCP schemas;
- migration bundle and source revision vector;
- symbolic credential locations only.

Any resolved value change creates a new run authorization. No provider/model/prompt/budget/adapter fallback or budget raise is allowed mid-run. Secret values and secret-derived hashes never enter evidence.

## 6. Fixtures And Independent Oracles

### 6.1 Source fixtures

- exact accepted commits/trees for all five MR repositories;
- exact BiliDili root revision including four Packages;
- independent repo/package/file/module/critical-entrypoint inventory not generated from ProjectContext output;
- adjudicated bounded source ranges for identity, architecture, dependencies, public surfaces and Recipe facts.

The four real scenario rows use the controller-accepted clean commit/tree set; dirty source, unexpected package or revision drift stops that row. The discriminated dirty/non-Git `SourceRevisionVectorV1` branches are still exercised in product/contract fault fixtures so equality cannot collapse to a `dirty` boolean.

### 6.2 Root fixtures

Pristine:

- demand-owned root symbol;
- physical absence receipt for root, DB, Recipe files and publication/vector paths;
- pre-quiesce public/vector observations null; V2 authority/lease/header and typed `targetState=absent,rootTreeHash=null`; snapshot/reset receipts marked N/A physical absence.

Authorized rebuild:

- exact approved Ghost root symbol and identity marker;
- pre-quiesce whole-root/public/vector/DB/table/file observation bound to V2 authority, plus exact authenticated daemon request/ack and old-PID exit;
- post-quiesce checkpoint/WAL/SHM and exact control-state delta receipt;
- immutable snapshot manifest covering the approved entire data root and matching the post-quiesce `rootTreeHash`;
- disposable restore probe with exact whole-root/SQLite/vector/public-route equality to the post-quiesce receipt;
- exact allowed and forbidden sets.

Known live counts are pre-reset reconciliation fixtures only:

- Alembic: 98 Recipes (73 active/20 staging/5 deprecated), 261 refs, 93 with refs, 134 paths, 126 thin cells, 2/98 profile+usage.
- BiliDili: 75 (71 active/4 staging), 337 refs/215 paths, 60 drifted refs affecting 30 active, coverage 22 covered/64 partial/125 thin, missing 017 and null scope IDs.

They are never expected post-run counts and never prove success.

### 6.3 ProjectContext cards

Cards cover:

- independent `ProjectScopeManifestV1` built before capture from accepted mode/scope; mutation cards delete/add/alias a repo and also alter caller `expectedRepoIds`, yet readiness must still fail against the accepted scope receipt;
- all 9 request kinds, expanded as V2 rows across repo×selector×canonical scope×applicable language/parser family×accepted representative critical/module surfaces; each unique row has applicability/policy reason, exact selector/`canonicalScopeHash`, parser/query initialization, terminal status, error/empty reason, continuation and output hash. A single first-parser file or one `repoId+kind` row cannot pass; delete/duplicate/swap-language/scope-only-swap/scope-alias mutations fail;
- MR 5/5 and SP root+4 identity/status;
- module/file/ref conservation, owner origin/confidence/evidence, entrypoints, public API and build/package facts; path heuristic cannot be sole authority and shared/ambiguous ownership is typed;
- complete inventory plane and include/exclude policy hash, with `eligibleFiles=frozenBlobAvailable+readFailed`, unaffected by Main 6/3/8, Plugin 25/3/8, Core raw scanner 5000-file/per-module-400-owned-file limits, Main consumer seed/owned-file 12, Plugin module 24, `ProjectMapModules` per-prefix 80, Main/Plugin ModuleService 500-file guards, public 50-ref or mount byte/page limits; >12/>24/>80 fixtures conserve the full module/owned-file axis;
- every readable eligible file has an immutable content-addressed blob. Select a file outside initial detail, restart the process, mutate/delete its live copy and require retrieval of original frozen bytes; missing blob or live fallback fails;
- bounded detail-plane selectors, explicit omissions/pages/continuations and content-addressed full chunks; v1 omitted-key hash alone is a negative fixture, not a resolver;
- dependency/layer/cross-repo relations and resolvable refs/source slices;
- continuation, cancellation, timeout, pruning/redaction and content-addressed full chunks;
- same-capture Plan, Recipe-generation, dimension-completion, dependency-graph and module-coverage projections from actual loaded adapters, all recording identical `artifactId/sourceVectorHash`, each with distinct adapter/version/payload receipt and surviving session reload. Audit placeholder payloads are negative fixtures;
- complete entry inventory for Core Plan raw scan, Main/Plugin Plan/generation collectors, `AiDimensionPreparation`, `ProjectContextConsumerFacts`, Main `ProjectMapModules`, both ModuleService implementations, Plugin dimension completion, `tool-router.resolveSubmitKnowledgeModuleAxis` plus plan-confirm/module-axis callers, both session constructors, Main incremental rescan and Plugin knowledge rescan. Every row is applicable or typed N/A; N/A includes strict-entry unreachability trace, while applicable strict rows have zero direct ProjectContext/raw-filesystem/synthetic-ProjectScope/capped-module/empty-axis-passthrough fallback;
- Core-authoritative repo set and Plugin `.gitmodules` discovery exact tuple reconciliation by canonical `repoId+relativeRoot+revision`, including working-tree content hashes for dirty/non-Git sources;
- separate live-source Recipe-free Graph/region **terminal** receipt with full request outcomes; progress `attempted=1`, repo-only complete, partial/degraded/suppressed errors, duplicate scoped roots and script-as-repo are negative fixtures;
- Recipe Map card separates `mountAccountingCompleteness` from project/final coverage and verifies per-type cumulative continuation so a mounts-first page cannot claim the final node count is zero;
- fresh-process canonical-hash repeatability and exact `SourceRevisionVectorV1` comparator; canonical Graph build scope + vector + `terminalSemanticOutputHash` stay stable. Semantic projection excludes session/cursor/resultRef/time/absolute-host-path fields; `factFingerprint`/`factSessionRef` are diagnostic only and may differ. A touch-without-content-change fixture keeps vector/semantic hash while allowing fingerprint change; content/scope mutation changes vector or semantic hash.

Expected facts derive from independent inventory/source ranges, not ProjectContext self-status.

### 6.4 Fact, population, Analyst, cluster and falsification fixtures

For every family marked `required` by the frozen anatomy/applicability matrix—not merely every family an implementation chooses to enable—the fixture bundle includes:

- positive, negative and edge inputs with independently adjudicated dimension-free Fact IDs, existing ProjectContext subject/ref identity where applicable, source/blob/range/relation tuples, supported-producer evidence and normalized order; a rich schema edge with no producer is a negative capability fixture;
- parser/backend unavailable, timeout, truncation, malformed result, source-drift and denominator-mismatch cases that must end `failed|unknown`, never empty;
- population with more than five occurrences proving long-tail retention, `raw=accepted+duplicate+excluded+error`, variants/outliers/negative controls and presentation Top-N independence;
- the same direct fact bound to multiple views/scales/lenses without duplicate Fact ID; parent aggregate uses an ordered-premise witness; tampered/missing premise/anchor fails; enumeration/query/cell/view/scale order changes do not change fact/population hash;
- one source-range→symbol→file→module→package→repo/project fixture proves parent containment, `supportOccurrenceCount` versus distinct subjects per scale, and exact cross-cutting back-map;
- Analyst active queries, accepted/rejected bounded expansion, deterministic candidate pre-groups whose final membership differs under Analyst evidence, at least one singleton, many-observations→one mechanism, one cluster→multiple usage/scope variants and zero-output induction;
- same-mechanism cross-query/lens/module clustering, different-mechanism non-merge, deceptive text similarity, claim-kind `required|not-required|unsupported-blocked` counterquery applicability, counterexample found/absent/incomplete and scope split/narrowing;
- clean rebuild twice and, if incremental fact generation is implemented, incremental-versus-clean equality fixtures;
- route-violation fixtures proving strict `ProjectGraph` partial output, mutable filesystem reads, Markdown-derived findings, auto evidence/scope fix and LLM-added facts cannot enter the lineage.

Expected outputs include anatomy/applicability universe, extended-PlanIntent cognition lineage, baseline dimension-free harvest/lens schedule, direct-anchor/derived-witness/multiscale facts, append-only expansion/schedule revisions, final CodeFactGeneration/expanded-schedule/fixpoint, final ObservationPopulation revisions, Analyst-owned KnowledgeCluster, Induction/Falsification, typed gate returns, independent disposition reviews and unique dispositions. Goldens assert mechanism, authority, variants/bounds and epistemic status, not prose similarity.

### 6.5 Value and retrieval goldens

Adjudicated Alembic and BiliDili cases include:

- high-value correct project knowledge;
- generic low-value advice;
- factual inaccuracy;
- exact/semantic duplicate and consolidation;
- narrow fact overgeneralized;
- positive and negative-intent retrieval;
- sufficient and insufficient investigated-empty;
- one-file high-value pass, three-file generic reject, one-cell single Recipe and another cell zero-finding accepted empty without min3/filler;
- source changed after Evidence Ledger capture, which must fail reviewer validation.

The evaluator must satisfy the accepted calibration receipt before it can auto-pass G2/empty.

Every G2 golden asserts the six fixed axis rows, their discrete `2|1|0|null` mapping, per-axis typed reason/evidence, explicit novelty decision and explicit duplicate decision/matched target. Mutation cards flip one axis, citation, novelty class, corpus revision or duplicate fingerprint at a time and require the mechanically derived total verdict; a weighted average or overall reviewer prose cannot pass.

### 6.6 Five-tool cards

Each card records sanitized developer question/input, expected project/publication, acceptable Recipe/source/structure facts, forbidden results, schema assertions, negative controls and value rationale. It does not embed exact handler output strings as the oracle.

## 7. Allowed And Forbidden Operations

Allowed:

- read accepted source/artifacts/config references and approved root for preflight/snapshot;
- hash/load only accepted artifacts;
- create demand-owned pristine/evidence/restore-probe areas;
- quiesce/lock an approved rebuild root through supported entrypoints;
- run supported init/migrations, exact allowlist reset and strict cold start;
- allocate/remove only run-owned, absent-before-create private-corpus revision children inside the approved Ghost data root; each child uses the accepted repository/Gateway/KnowledgeService stack and never changes the source root;
- invoke frozen DeepSeek/embedding/MCP configurations within budgets;
- inject declared faults through accepted test ports/isolated copies;
- restore the approved snapshot and clean only demand-owned transient roots.

Product source and all accepted prebuilt artifacts remain read-only. The current approved scenario data root is intentionally writable, but only through accepted init/reset/generation/persistence/index/publication/recovery entrypoints and only within the manifest allowlist.

Forbidden:

- any source write/checkout/reset/clean/build/install/compile/dependency or product fix;
- executing an artifact whose loaded hash differs from the accepted manifest;
- writing any root outside the current approved/demand-owned row;
- destructive action before authorization + snapshot/restore probe;
- calling broad legacy `fullReset()` for this requirement;
- manual SQLite/file/vector/public-route edits to manufacture success;
- logging secrets, user absolute paths or real thread IDs in durable evidence;
- pre-blank ProjectContext/Plan reuse, second consumer-specific source collection or raw-source fallback;
- runtime deferral, scope shrink, filler Recipe, minimum-count completion or partial/exhausted success;
- public transport injection of candidate paths/context;
- treating Test result as controller acceptance/dispatch authority.

## 8. Scenario Setup Protocol

### 8.1 Common preflight

1. Verify controller acceptance bundle and all actual artifact load hashes.
2. Resolve symbolic root/project identity, accepted runtime-artifact load hashes, config hash and credential availability. Rebuild records an existing confined target realpath; pristine records the planned absent path against its existing authorized parent without creating the leaf. The source observation is authorization/recovery evidence only; post-blank ProjectContext remains the sole Plan input.
3. Freeze `ObservedPreQuiesceRootReceiptV1`, publication/vector/DB/file facts and `ObservedPreResetPublicationModeReceipt`; build `StrictSetupAuthorityReceiptV2`. Pre-quiesce whole-root hash is authorization/drift/recovery provenance only. Pristine records physical absence/N/A. Do not invent Recipe/ref/coverage/sparse pointers.
4. Freeze exact allowlist/forbidden set, supported migrations, strict enrollment/marker policy, run-owned private-corpus namespace, external snapshot (when applicable), existing external operation-lock root and evidence/journal root. Freeze the exact volatile policy: only resolved daemon state/PID removal, plus a proved exact daemon-log append if applicable; DB/WAL/SHM, `daemon-entrypoint.json`, marker and provider config remain semantic/protected.
5. The strict child acquires the existing external root-identity operation lease, then creates/readbacks/fsyncs `StrictRunJournalHeaderV2` under the external evidence root. Authority→lease→header durability must precede every target change, including daemon quiesce. A live writer is expected in the rebuild probe and is not rejected or pre-killed.
6. Through the existing daemon HTTP/token/shutdown boundary, send the one hashes-only run-bound quiesce request. Verify exact accepted ack, old PID exit, state/PID removal and real post-exit SQLite checkpoint/WAL/SHM state; seal `QuiescedPreResetObservationReceiptV1`. Timeout/conflict/malformed ack blocks and cannot fall through to SIGKILL+snapshot. Pristine absent emits the typed absent/not-running receipt.

### 8.2 Pristine-init

1. Prove root/DB/Recipe/publication/vector paths physically absent and bind `QuiescedPreResetObservationReceiptV1(targetState=absent,rootTreeHash=null)` to the already durable authority/lease/header; no daemon shutdown or snapshot is fabricated.
2. Run supported init and complete migrations.
3. Record the created target realpath and prove it equals `plannedAbsentPathReceipt`; verify project identity, SQLite integrity, zero knowledge/refs/coverage, no private-corpus revision leaf yet and public/vector route null.
4. Verify supported init installed `.asd/context/recipe-publications/marker.json` with mode `strict-v1`, route schema, project-identity and migration hashes; provider/model config hash is unchanged. Route absent resolves four knowledge tools to typed unavailable while Graph remains source-capable.
5. For BiliDili, prove migration 017 and non-null scope IDs.
6. Emit `BlankStateReceipt` with activation expected public/vector null; snapshot/reset N/A receipts name physical absence.

### 8.3 Authorized-rebuild

1. From the immutable post-quiesce receipt produced in common preflight, snapshot the whole approved knowledge root to the authorized non-overlapping external snapshot root; snapshot `rootTreeHash` must exactly equal the receipt, and fsync/hash/permission/retention receipts are mandatory.
2. Restore to a disposable probe; verify exact post-quiesce whole-root hash, SQLite integrity/checkpoint state and the captured migration-ledger, counts/files/vector/public route, marker and reader-mode/config. For BiliDili this probe preserves the known missing-017 state; it does not require 017 yet. It never compares the post-quiesce root to the pre-quiesce tree hash.
3. Execute only the accepted exact reset. Verify forbidden bytes/hashes unchanged and allowed target empty.
4. Run only approved supported migrations/identity repair.
5. Verify SQLite integrity, zero authorized Recipe/ref/coverage/index-generation/candidate-publication targets, no private-corpus revision leaf yet and public/vector route null; unrelated tables/paths remain byte-identical.
6. Verify accepted strict enrollment and matching dedicated target marker; route-null is unavailable. Exercise missing/mismatched marker and require fail closed rather than legacy fallback; provider/model config stays unchanged.
7. For BiliDili, prove 017 and non-null scope IDs without manual DB edits.
8. Emit `BlankStateReceipt`; observed pre-quiesce values remain authorization/recovery evidence only, while post-quiesce receipt remains snapshot/restore authority.

Setup must not invoke authoritative ProjectContext capture, Plan or DeepSeek until blank receipt passes.

## 9. Per-Scenario Execution And Gates

### T0 — Blank-before-Plan and ProjectContext foundation truth

- read back the accepted product evidence that strict action dispatch, authority/lease/header-first, authenticated quiesce, post-quiesce checkpoint receipt, snapshot/reset and the scenario's fresh-process recovery path already passed; Test only observes the exact loaded artifact behavior and does not repair it;
- load accepted PC foundation baseline;
- capture one authoritative post-blank facts set;
- build/verify the independent pre-capture project-scope receipt, then execute unique V2 repo×nine-request×selector×canonical-scope×applicable-language/parser×accepted-critical/module-surface rows; fail a caller-self-certified repo set, v1 single-row proof, scope-only swap/alias, required partial or empty-without-reason;
- reconcile the complete inventory plane, include/exclude policy, all repos/packages/modules/files, all eligible frozen blobs and shared `SourceRevisionVectorV1` against independent evidence;
- exercise module/owned-file populations above 12, 24 and 80; prove Main `ProjectMapModules` Package.swift/raw scan and Plugin submit `tool-router` empty-axis/Core-passthrough are not reached in strict mode, and missing module axis fails closed rather than producing a smaller valid-looking scope;
- verify bounded detail selectors, every omission/page/continuation/ref and content-addressed full chunks; exercise a source set above old sampling/display limits and retrieve a non-selected frozen blob after live mutation/restart;
- prove exact ordering: seal/read back base certification at artifact put → create preparation/bind lease/open → derive five projections through actual loaded adapters and reload them through session boundaries → seal the post-open consumer-lineage receipt. Reject a changed base certification hash, audit placeholder, early/fabricated adapter receipt or projection without adapter/version/entrypoint/load receipt;
- verify `eligibleFiles=frozenBlobAvailable+readFailed`, critical read failures=0, parser readiness across every present family plus accepted critical/module surfaces, `refs=resolved+typedExternal+dangling`, critical dangling=0, every owner has evidence, and unclassified/unknown/required-partial/confirmed-defect counters are all zero. PC-F does not claim parse-all; T2A executes the frozen fact obligations;
- run terminal Graph/region and Map truth cards: repo identities/paths unique, script-as-repo=0, required terminal errors=0, mount accounting separated from project coverage, per-type continuation cumulative and honest;
- fail before Plan/DeepSeek if any required item is omitted/partial/truncated/unresolved or hashes drift.

Pass evidence: production run records one authoritative capture and no comparison capture, durable artifact/store/receipt/lease, independently fixed exact repo set, all V2 matrix rows and all frozen blobs. Strict-v2 recomputes artifact identity from facts/blobs/vector/request outcomes and seals the base certification before open; each actual adapter projection and the later lineage receipt reference the unchanged binding without rewriting it. Compatibility v1 additionally requires stored projection hash equality but placeholders never pass. Direct/synthetic/raw fallbacks are zero. Graph/region use terminal live-probe receipts; cross-process equality ignores diagnostic `factFingerprint`/`factSessionRef` and hashes only the canonical semantic projection. Same Foundation `runId` reopens the artifact and different run conflicts; five consumer receipts and proposed journal binding are separately proven. Mutation fixtures removing/swapping a scope tuple/request row/canonical scope/frozen blob/parser/continuation/owner/consumer or changing the base receipt after put make PC-F fail.

### T1 — Plan LLM cognition, deterministic compile and work schedule

- generate registry payload directly from accepted 26-dimension source;
- derive `ModulePlanningFactsV1`/role vocabulary, the complete normalized cell universe and a ten-row `AnatomyLensCatalogSnapshot` applicability matrix per eligible scope before Plan cognition; every row is required/typed-excluded/unsupported-blocked with evidence, but any required unsupported row is a typed blocker and cannot advance to an accepted Plan;
- apply one facts-driven applicability/criticality/exclusion policy and prove eligible+excluded conservation, including repo/package coverage scopes versus display-only aggregates;
- invoke exact Plan LLM once initially on complete artifact-bound context; allow 0..2 serial parent-linked semantic repairs and record transport retries separately. Require an extended existing `PlanIntent` question/subquestion DAG with anatomy/subject/scale bindings, selected frozen capability/query IDs, priority/dependencies, expected support/counterevidence, synthesis target, uncertainty, stop/escalate and within-hard-cap breadth/expansion/counterquery reserves plus starvation guard;
- validate/revise/reject cognition, then compile the complete cell universe and baseline schedule as `required applicability universe ∪ accepted unique Plan additions`; generate canonical-subject/scale obligations and cell→anatomy/fact/cluster/question bindings with no cell×unit duplication or deletion of required rows. The compiler must return Plan revise for missing project decomposition, not invent it;
- verify discriminated V2 and `ColdStartExecutionProjectionV2`, catalog=26, eligible dimensions⊆catalog, and exact accepted strict-v2 module/cell/obligation/candidate bounds from frozen config+wire provenance. The legacy 80 module-binding and 500 Recipe-budget maxima are compatibility fixtures, not the new candidate cap; if the full universe exceeds an accepted wire, the owner must version and reaccept it rather than truncate;
- freeze `maxAuthoredCandidatesPerCellPass` and deterministic batch-barrier policy; verify concurrent outputs are buffered/canonically sorted and a per-cell/global overflow fails the whole pass rather than truncating;
- verify no hidden top20/first-N, auto deferred, Recipe quantity floor, unknown subject/tool/query ref, critical-lens starvation or LLM hard-cap override;
- freeze cognition, catalog/policy, fact-query/backend, Plan, harvest/lens schedule and run manifest hashes;
- prove execution projection preserves accepted question dependencies, tool/query IDs, priority and allocation/reserves; replay the same cognition in a fresh process for byte-identical compiler output. Independently rerun Plan LLM and require boundary/anatomy/baseline/cap conservation; legal new-question deltas are recorded and later independently adjudicated, not failed merely because conclusions differ.

Pass evidence: `deferredCells=[]`, all ten anatomy rows classified per scope, `requiredUnsupportedBlockedCount=0`, typed exclusions/N/A, required⊆baseline schedule, exact cell/lens/harvest conservation, complete question DAG/tool/budget strategy with no starvation, and Plan-cognition calls=`1 initial + 0..2 repairs`. Legacy executable-Plan/top20/dual-capture/Recipe-floor calls=0. Same-receipt compiler replay is byte-identical; independent LLM rerun preserves invariants and any valid discovery delta enters normal review. Harvest does not consume Recipe attempts.

### T2A — Baseline facts, iterative Analyst epochs, clustering and falsification fixpoint

- run exact loaded backends once per baseline dimension-free fact-family×canonical-subject/scale and write anchored direct facts or premise-witnessed derived facts in an immutable baseline-generation receipt rather than prematurely sealing the final generation;
- require one terminal receipt per baseline obligation, complete denominator/continuation and `raw=accepted+duplicate+excluded+error`; error/timeout/Top-N never becomes empty;
- invoke iterative Analyst epochs over current multiscale populations: deterministic algorithms may pre-group candidates, but Analyst proposes final semantic observation dispositions/cluster membership/mechanisms/hypotheses and bounded expansion; deterministic code only validates/canonicalizes/conserves and executes queries. Exact-duplicate/policy-excluded discards may pass mechanically; every semantic irrelevant/generic/no-value discard receives independent review, and a high-value singleton discard fixture must fail;
- every accepted unique expansion carries `purpose=exploration|counterexample`, appends a schedule revision and immutable child fact/query receipt, then any parent-linked population revision before the next epoch; rejected/duplicate expansion remains evidence;
- for each hypothesis, validate §4.3-style `required|not-required|unsupported-blocked` counterquery applicability. Before executing a required query, enroll it through the same expansion ledger with deterministic obligation ID, parent schedule hash and schedule revision; duplicate queries link an existing terminal receipt and any direct unregistered falsifier call or LLM waiver fails. Analyst then explains contradiction-driven narrow/split/refute and an independent reviewer verifies that interpretation; incomplete/unsupported required semantics are unknown/blocked;
- close only when an epoch accepts no further exploratory/counterquery expansion and all observations/clusters/hypotheses/enrolled counterqueries/Analyst disposition reviews are terminal; seal final CodeFactGeneration, `finalExpandedScheduleHash` and AnalysisFixpoint;
- assert fact authority and claim strength: direct fact needs frozen anchor, derived fact needs replayable witness, schema-only edge/heuristic alone cannot proceed, observed-only cannot become a general rule, and mechanism/invariant is required for rule claims;
- prove strict calls to partial `ProjectGraph` as coverage, mutable filesystem grounding, Markdown-derived finding, auto evidence/scope/content repair and LLM-added facts are zero.

Pass evidence: required⊆baseline⊆final schedule; every accepted expansion and final population revision is hash-linked/terminal; direct Fact IDs repeat across clean executions and remain unchanged by cell/lens/query/view/scale order; derived witnesses replay and parent containment/count conservation pass; long-tail >5 is retained; same mechanism clusters across lenses while different mechanisms remain split; Analyst owns final semantics while deterministic code proves uniqueness. Every item has one disposition/review and each claim has a valid counterquery applicability decision. A recurring pattern needs two occurrences, but a singleton explicit contract/invariant/failure mechanism may proceed. Missing producer/backend/query/denominator/source yields failed/unknown, blocks affected induction/Producer and cannot become investigated-empty.

### T2B — Producer authoring, objective gates and private content-ready materialization

- invoke exact Producer DeepSeek/SOP separately from Plan/Analyst/reviewer;
- pass only final-fixpoint `survived|narrowed` Producer-eligible hypotheses into Producer through structured AnalysisArtifact (`derivedFindingCount=0`). Every final cluster still has a terminal reviewed induction/zero-hypothesis disposition; refuted/zero branches stop there. Analyst's 0/1/N concerns semantic hypotheses; Producer's distinct 0..N concerns **Recipe expression** cardinality/usage variants and cannot rewrite hypothesis semantics. For every Producer-eligible hypothesis Producer must enumerate the canonical expression set with stable proposal/fingerprint/parent IDs; when N=0 it must additionally emit exactly one typed non-draft disposition row outside the Recipe-expression count. Producer action space contains no fact-query, `knowledge.submit`, persist or review tool;
- require the final AnalysisFixpoint to include independent review of semantic observation discards and Analyst zero/narrow/split/refute decisions before Producer starts;
- for every Producer reviewable Recipe-expression proposal **or mandatory zero-expression disposition row**, run applicable deterministic G1, then canonically serialized non-persisting Gateway admission/dedup/consolidation and re-G1 if changed. Only **after** that AdmissionReceipt: independently review merge/duplicate/non-drafting rows, or run calibrated G2 for surviving drafts. These reviews apply even if the cell already has another Recipe; high-value-no-value suppression fails and appends a repair child or remains unresolved;
- for every surviving draft, require six fixed G2 axis rows with per-axis verdict/`2|1|0|null`/typed reason/evidence, plus explicit novelty and duplicate decisions bound to the exact private-corpus revision and Admission match target. Only all-axis pass with allowed novelty and resolved duplicate state may pass; a repairable axis=1 yields bounded revise, while any 0/null, generic/already-covered/unknown novelty or unresolved duplicate rejects;
- permit post-fixpoint repair only within the accepted hypothesis's Recipe expression. Any change to facts/cluster/mechanism/hypothesis/evidence is `ANALYSIS_FIXPOINT_INVALID` and requires a new immutable fixpoint attempt before Producer, never in-place mutation;
- before any row enters G1/admission, create the absent revision leaf through the restricted internal resolver that preserves certified source/projectScope identity and overrides only its confined data root; call accepted Core `openAlembicDatabase(...,runMigrations=true)`, then seal `PrivateCorpusRevisionInitReceiptV1` over `migrationLedgerSemanticHash=SHA256(canonical sorted {version,migrationArtifactSha256})` joined to the accepted bundle, SQLite integrity/FK, non-null accepted identity/scope, sanitized config/credential-location refs and zero knowledge/ref/coverage/vector/publication plus empty Recipe/candidate state. Version/artifact sets are exact and BiliDili includes 017; raw `schema_migrations` rows remain evidence but `applied_at`, row order and DB page layout are excluded from cross-revision equality. No provider secret/config copy or full public Bootstrap is allowed; init mismatch blocks before Repository construction;
- bind every expression/disposition, G1, Admission, disposition-review/G2, persistence, ref, content-ready and expression-set row to the exact `analysisFixpointHash`, `privateCorpusRevision`, init receipt and revision-root manifest. On `ANALYSIS_FIXPOINT_INVALID`, require an append-only invalidation row, close/fsync/seal the old repository root as evidence-only, close its handles, prove the next confined leaf physically absent, repeat supported resolver+DB init, then open a fresh revision-scoped SQLite/Recipe/ref stack and replay **all and only** final-fixpoint Producer-eligible hypotheses from the first canonical row. Instrument repository/file/similarity opens and reads: after the switch old-root counts are zero; no old revision row may be queried as a duplicate target or flow to expression closure, G3 or assembly;
- enforce batch barriers and one causal repair DAG: initial hypotheses get immutable `KnowledgeLineageRootId` values; every gate-triggered Analyst re-fixpoint/cluster-or-hypothesis split/merge and Producer wording repair names causal parents, inherits the sorted root set and computes `semanticRepairDepth=1+max(parentDepth)`. Cells are applicability only; depth≤2 while transport retries are separate;
- require every non-pass gate result to name one owner, permitted mutation, invalidated seal and resume state: expression wording returns to Producer; mechanism/novelty rooted in the hypothesis returns to Analyst/new fixpoint; persistence/ref failure returns to deterministic owner/journal and never calls an LLM;
- after G2 pass, write `PERSIST_PREPARED` with the deterministic strict Recipe ID and expected hashes, then invoke only the journal-token-authorized internal Gateway method that maps `preparedRecipeId` through `#prepareCreateData` to `KnowledgeEntryProps.id`. Read back actual DB/file/ref ID and require `actual=prepared`; strict UUID allocation and public caller ID injection counts are zero. Persist only the exact reviewed fingerprint through the repaired writer/KnowledgeService/Gateway path; write the Recipe production binding, inject canonical module resolver, and synchronously reconcile all source-ref representations;
- treat G1/admission/disposition-or-G2/persist-or-dispose as a nested per-expression-or-disposition-row serial loop, not global stage barriers: an accepted draft must reach durable `CONSUMED` before the next canonical row is admitted, so dedup always observes the actual accepted private corpus and the mandatory zero row cannot bypass the loop;
- for each Producer attempt/repair version, conserve 0..N Recipe-expression rows and exactly one zero-disposition row iff N=0. Retain every rejected/revised/repair-superseded expression or disposition row with one terminal fate and parent-child edge. After refs/contentReady, seal one `HypothesisExpressionSetReceiptV1` per `survived|narrowed` Producer-eligible hypothesis over all versions and their G1/Admission/disposition-or-G2/Persistence/Ref receipts. Only the terminal head decides closure: expressed with ≥1 content-ready ID, represented-by a reviewed merge/duplicate target whose exact expression/fingerprint reaches final contentReady, or independently reviewed non-draft; target failure reopens the source and `unresolved|failed|unknown>0` blocks G3. Refuted/zero-induction branches must have zero expression-set receipts.

Pass evidence: every final cluster has one terminal independently reviewed induction or zero-hypothesis disposition; every `survived|narrowed` Producer-eligible hypothesis—and only those hypotheses—has one immutable expression-set receipt. Refuted or zero-hypothesis cluster branches do not fabricate Producer sets. Every Producer version satisfies the conditional zero-row rule, every expression/disposition row has exactly one terminal fate and repair parent, rejected/superseded entries remain visible, every merge/duplicate binds the exact final content-ready representative, terminal-head `unresolved=0`, and content-ready IDs trace facts→final population→cluster→induction/falsification→Producer→G1→Admission→disposition-or-G2→Persistence→Ref. Every G2 receipt contains all six axis rows, novelty/duplicate decisions and mechanically correct total. The semantic re-fixpoint fixture first persists row A, then makes a later row expose a mechanism/novelty defect; it proves distinct confined revision roots and DB/file hashes; each root has the same accepted migration semantic hash/identity/config/initial-blank receipt (including BiliDili 017) while raw `applied_at` may differ; old handles are closed and subsequent old-root open/read counts zero; the replacement leaf is absent-before-create, initialized and replaying its full eligible set; old A cannot influence dedup/coverage/final snapshot; and no duplicate visible Recipe exists. The persistence-crash fixture proves prepared ID equals actual DB/file/ref ID before and after resume, strict UUID allocation=0 and public/legacy callers cannot set or invoke the prepared-ID path. Duplicate admission, deterministic crash recovery, repair depth≤2 even when a repair changes cluster/hypothesis IDs or fixpoint hash, one-file high value/three-file generic, high-value-no-value suppression, source drift and 1/0/N expression fixtures behave as specified. Counts/proxies are not pass criteria.

### T3 — Coverage and durable private state

- reconcile baseline schedule + append-only exploration/counterquery ledger into `finalExpandedScheduleHash`: every final fact/query obligation, final population item, cluster/hypothesis, independent disposition review and lens binding has one terminal disposition; no direct counterquery exists outside that schedule;
- require one immutable hypothesis-expression-set receipt per `survived|narrowed` Producer-eligible hypothesis and zero for refuted/zero-induction branches; every Producer version conserves 0..N expression rows plus its mandatory zero-disposition row iff N=0, every row/fate/repair edge and content-ready binding conserves, every merge/duplicate resolves to the exact final content-ready representative, rejected/superseded rows remain evidence and terminal-head `unresolved|failed|unknown=0` before coverage;
- verify all bounded Analyst repairs completed in T2A before AnalysisFixpoint and all bounded expression repairs completed in T2B before the immutable expression-set seal. T3 performs no repair; any revise/unresolved signal after either seal invalidates the corresponding seal and returns to the owning product/controller acceptance loop rather than mutating it;
- accept only the latest non-invalidated `analysisFixpointHash` and its sealed `PrivateCorpusRevisionHandleV1`; prove every G1/Admission/review/G2/persistence/ref/content-ready/set row belongs to that fixpoint/revision/root hash, every repository open/read is current-handle-bound, and no evidence-only descendant or old physical root appears in dedup targets, coverage inputs or the candidate data manifest;
- write immutable `CandidateCoverageReceipt`, closing each cell with content-ready IDs and lens→cluster lineage or accepted investigated-empty;
- then run the R5 DB/file/ref/binding reconciliation read-only. A mismatch must invalidate that receipt and route to the exact pre-G3 durable/content-ready owner; no in-place fix may continue into T4, and a corrected run must recompute G3;
- require investigated-empty only after complete populations/lens bindings/Analyst induction/counterqueries and independent review; do not infer global nonexistence;
- inject file/rename/fsync/DB/ref/journal faults and verify idempotent recovery;
- use the controller-accepted static/integration inventory to prove every MCP/daemon/CLI/HTTP/repository reader and promotion/EventBus/afterPublish hook cannot expose or mutate working data while strict route=null. Run the Dashboard reader leak probe only when `dashboard-build=required` and its accepted hash is loaded; in the N/A branch prove Dashboard was not started and make no Dashboard runtime claim.

Pass evidence: final scheduled fact/query obligations=terminal, the latest non-invalidated AnalysisFixpoint hash matches final populations/dispositions and the sealed private-corpus revision, expression-set hashes match every and only `survived|narrowed` Producer-eligible hypothesis/content-ready ID, every cluster including zero-induction/refuted branches has one reviewed terminal disposition, every population/cluster/lens binding is disposed and no partial/exhausted/failed/unknown/deferred cell; DB/files/refs/coverage conserve; no invalidated descendant, candidate leak or automatic lifecycle/index side effect.

### T4 — Candidate assembly, sparse/vector, seal and G4

- create a private mutable assembly from only content-ready corpus/G3 coverage; synchronously transition every qualified pending Recipe to existing `Lifecycle.ACTIVE`, clear incompatible staging-only fields and emit lifecycle receipts inside it;
- build sparse verification and explicitly build/inspect the first vector generation from the exact qualified entries; do not query all non-deprecated working rows or accept `planned`;
- reconcile rows/files/refs/coverage/vector, checkpoint WAL, hash and seal `candidate-data-manifest`; no writes after seal;
- prove the sealed-bundle DB/vector adapters and resolver dependencies load the exact generation ID/hash and pass fixed-root/hash checks without any Plugin dependency, candidate reader or Search/Prime handler invocation;
- run retrieval readiness plus Core candidate-data/publication-schema prerequisite validation over the sealed bundle; the final coverage receipt, serving-validation receipt and serving manifest must not exist yet. Post-seal failure uses a new snapshot ID.

Pass evidence: no rejected/non-content-ready input, zero non-active serving row and no missing lifecycle receipt; healthy sparse/vector; exact IDs/hashes/model/dimensions; immutable post-seal diff; tamper tests fail closed. Final coverage binding is asserted only at T5.

### T5 — Final binding, tool-neutral serving admission and final CAS

- after G4, final-reconcile every sealed content-ready candidate to a serving-ready Recipe without any public query;
- write and seal a hash-linked immutable `FinalCoverageBindingReceipt` that maps G3 dispositions to exact final `covered-by-ready-recipe`/`investigated-empty` IDs/fingerprints and references the G3/G4/data-manifest hashes; any final failed/unknown disposition blocks;
- run Alembic/Core's tool-neutral validator over the sealed snapshot and emit `ServingSnapshotValidationReceipt` binding exact active Recipe IDs/fingerprints, lifecycle, DB/file/ref/coverage conservation, sparse verification, healthy vector generation/load receipt, source/project/scope/config identity and Core serving-manifest/route schema versions;
- prove this step imports/calls no Plugin executor/handler, creates no candidate reader/handle/path override and introduces no Main→Plugin runtime dependency; service-level sparse/retrieval canaries must not be labeled formal MCP results;
- write the serving snapshot manifest referencing unchanged data, G3, G4, final-coverage, serving-validation and vector hashes;
- append `PUBLIC_CAS_PREPARED` only after that manifest is ready, storing/referring to the full timestamp-fixed canonical route bytes, all-byte hash and separate semantic hash; revalidate the already-held operation run lease then acquire route lock; inside both re-read and compare expected null; verify hashes; temp/fsync/rename/dir-fsync/readback; append committed receipt, release route then run lease;
- do not run formal five-tool cards in T5; they begin only through the ordinary public route in T6.

Pass evidence: G4 has no public-consumer dependency; immutable final coverage predates and is unchanged by tool-neutral validation/manifest creation; Main's loaded package graph has no Plugin dependency and `ResidentServiceBoundary` still forbids Main MCP ownership; route=null public knowledge tools are unavailable while Graph works. Two full runs yield one external-operation-lease owner and one pre-CAS loser; a separate isolated route-store primitive race with two synthetic compare-null payloads yields one winner. Rename-before-receipt crash reconstructs only the exact prepared route bytes; same-semantic/different-timestamp metadata and every other non-null payload conflict.

### T6 — Real developer public observation

From a fresh accepted Plugin process:

- run positive, negative, stale, cross-project, missing-evidence and out-of-root cards;
- capture raw request/response/schema/provenance/source traces;
- verify Search/Prime actual vector usage and Map deterministic mounts;
- verify Map reads the exact immutable final-coverage hash and separates mount accounting from project coverage; verify Graph uses live source, matches the certified revision and returns no Recipe/mount;
- verify no read path writes snapshot or working root.

This is the first complete formal five-tool run for the real scenario and a mandatory requirement-acceptance gate. Visibility has already switched atomically, so a failure does not retroactively make the CAS partial; it does fail the scenario, triggers the scenario-specific fence/cleanup or snapshot restore, and returns the smallest defect to the owning product before controller reacceptance and rerun.

### T7 — Repeatability and idempotency

- pristine: discard demand-owned root after evidence, repeat from a second physically absent root;
- rebuild: restore the same snapshot, verify equality, reauthorize/reset and repeat;
- for crash/resume of the **same run and same non-invalidated fixpoint/private-corpus root**, require byte-identical durable ProjectContext facts, final accepted Plan cognition lineage, compiler/baseline schedule, expansion-ledger head/final-expanded schedule, Fact IDs/final populations/fixpoint and deterministic proposed-journal decisions; idempotent Recipe/ref writes with the same prepared ID and same candidate/final snapshot hashes. A replacement fixpoint is not this retry class: even identical authored bytes/fingerprint consume a new semantic attempt, use a new physical root and produce new fixpoint/revision-bound rows;
- crash immediately before/after facts-lease binding proves same-run reopen and different-run conflict;
- for an **independent rerun**, require identical source/artifact/catalog/policy/caps/anatomy applicability/required-baseline/fact-family/canonical-subject boundaries. If the canonical accepted expansion set is identical, direct/derived Fact witnesses, population and schedule hashes must be identical; if a different legal expansion set is chosen, hashes may differ and every obligation/hash delta is recorded;
- independent reruns with different legal expansions preserve mandatory boundaries and terminal coverage. They may discover an additional valid cluster/claim; each delta must traverse normal falsification/G1/G2/coverage/serving validation and the post-CAS public Test matrix, with no unexplained accuracy/value regression. Exact cluster/claim equivalence is not required in advance, and Plan/Analyst/Producer wording/order need not be byte-identical.

## 10. Fault Matrix

| Fault | Required result |
| --- | --- |
| stale/mismatched artifact load | blocked before root write; no Test-built substitute |
| unresolved §2.1 root/source/config/Ghost authorization binding | blocked before root write; no guessed path, identity, endpoint or credential location |
| Dashboard trigger/artifact/compatibility/load/startup branches disagree | blocked; if N/A Dashboard is not started, if required the exact accepted served hash must load |
| pristine physical absence fails | blocked; never delete unexpected root |
| pristine target is created before absence proof, planned parent/leaf contains symlink/escape, or post-init realpath differs from `plannedAbsentPathReceipt` | blocked/fail; no Plan and no destructive fallback |
| live-ready daemon returns ordinary ready for strict `execute|recover|complete`, old daemon satisfies new-child readiness, or supervisor kills/restarts writer before external header | strict dispatch/order failure; no quiesce/snapshot/reset |
| authority/lease/header is not read back+fsynced before quiesce request or daemon control-file deletion | recovery-contract failure; preserve old writer when possible, no snapshot/reset |
| quiesce request has bad token/root/run/authority/header identity, leaks a path/secret, or conflicts with another request | reject/conflict; old writer remains live, no forced kill or snapshot |
| accepted quiesce times out before exact old PID exit/checkpoint, a shutdown hook/checkpoint fails, or strict path SIGKILLs then continues | blocked product failure; no post-quiesce receipt/snapshot/reset |
| post-quiesce delta contains an unknown path, DB/WAL/SHM is treated as volatile, or `daemon-entrypoint.json`/marker/config changes | product failure; no broad allowlist or weakened whole-root hash |
| snapshot target overlap/symlink escape/durability or restore hash/SQLite mismatch against the post-quiesce receipt | rebuild blocked; no reset |
| rebuild restore-probe migration ledger differs from the post-quiesce snapshot | rebuild blocked; this is distinct from the known BiliDili missing-017 baseline |
| exact reset proposes extra table/path | blocked/fail closed; no broad cleanup |
| post-reset supported migration/init/identity failure, including BiliDili 017 still absent | scenario failed before ProjectContext/Plan; no manual repair |
| strict journal header missing/not fsynced before quiesce/snapshot/init/reset, stored inside target/snapshot, or Plan/manifest fields appear before their bind records | recovery-contract failure; no target mutation/continuation |
| strict enrollment/marker quadrant: enrolled strict + marker absent/corrupt/mismatch, with route null or active | fail closed; no legacy fallback, including marker deletion after publication |
| strict marker is written outside `.asd/context/recipe-publications/marker.json` allowlist or provider/model config hash changes during marker install | unauthorized mutation/config drift; stop and no Plan |
| enrolled legacy + marker absent | legacy behavior only in an isolated compatibility fixture outside the four strict scenario roots |
| enrollment/marker disagreement | config drift; fail closed |
| at BlankStateReceipt public/vector route non-null | `BLANK_POINTER_DRIFT`; no Plan/generation; later private assembly vector route is not this check |
| capture repositories and readiness expected IDs are synchronously missing/extra/aliased | independent project-scope receipt mismatch; PC-F fails even though caller inputs agree with each other |
| duplicate/delete/swap a V2 selector/canonical-scope/language/parser/surface row, or scope-only alias/swap | request-index/readiness conservation failure; v1 one-row proof cannot pass |
| initial detail omits a file and its live bytes later change/disappear | original bytes must resolve by frozen blob hash after restart; missing blob/live fallback fails PC-F |
| PC repo/package/language-parser omission, unclassified owner, timeout, unresolved critical ref, inventory mismatch or sampling truncation | no Plan/DeepSeek; preserve diagnostics; discard pristine or restore rebuild snapshot |
| audit placeholder projection or consumer adapter receipt missing | PC-F/PC-RUN fail; placeholder hash cannot stand in for actual entrypoint |
| adapter receipt predates preparation/open, base certification hash changes after put, or consumer lineage writes back into base artifact | PC-F/PC-RUN ordering failure; fabricated lineage is rejected and Plan does not run |
| Graph progress/repo-only complete used as terminal, suppressed required error, duplicate root, script-as-repo or Map mount accounting used as coverage | PC-F fail; no Plan |
| facts lease crash/replay | same Foundation run reopens the artifact and different run conflicts; five consumer receipts are verified separately. Foundation lease alone cannot prove consumer/journal/expiry/heartbeat; proposed-journal plan mismatch fails; no recollection |
| any of Plan/generation/dimension completion/dependency graph/module coverage uses a different or missing artifact/vector hash | fail before Agent; no recollection/fallback |
| strict PC consumer performs undeclared direct call, raw filesystem fallback or ProjectScope synthesis | PC-F/PC-RUN failure; no Plan/DeepSeek |
| Main `ProjectMapModules`/12/80-cap fallback or Plugin 24-cap/submit empty-axis/Core-passthrough is reached, or >12/>24/>80 conservation truncates | PC-F/PC-RUN module-axis failure; missing axis fails closed; no Plan/Recipe submission |
| stale prepare/Plan receipt | both entrypaths reject; no fallback recollection |
| Plan cognition has unknown subject/tool/query, cyclic/incomplete decomposition, scope expansion, missing anatomy row, priority/allocation loss or critical-lens starvation | one typed Plan revise/reject; hard caps/facts unchanged; no silent top20/truncation/deferral |
| Plan tries to remove a required fact/lens baseline row, raise a cap, use Recipe targets or needs a third semantic repair invocation | reject; required universe remains intact and invocation lineage cannot reset |
| required baseline exceeds hard resource capability | typed product/config/controller `PLAN_SCALE_UNSUPPORTED`; never ask Plan to shrink scope or mark N/A |
| fact-query pack/grammar/backend hash missing or mismatched | blocked before fact execution; no Test-built substitute or LLM fallback |
| parser/backend producer exception, timeout, truncation, denominator/witness mismatch, schema-only edge or source mutation | typed fact-owner return; fact/population `failed\|unknown`; no affected induction/Producer and never investigated-empty |
| query returns zero after first-N sampling or error coercion | `unknown`, not `inspected-no-pattern`; G3 blocked |
| same direct fact duplicated across views/scales/cells, or a parent aggregate lacks ordered-premise witness | Fact-ID/witness/schedule conservation failure; no Analyst/coverage |
| population long tail, variant/outlier/negative control dropped or raw conservation fails | analysis blocked; Top-N cannot replace authority |
| Analyst expansion escapes source/backend/budget envelope | reject request and fail role-boundary test; Plan/cells unchanged |
| accepted Analyst expansion is absent from final schedule/population hash, or a sealed generation is mutated | analysis-fixpoint failure; no Producer/G3 |
| hypothesis-specific counterquery executes without expansion-ledger obligation/parent schedule/revision, or is missing from final schedule | role/schedule violation; hypothesis unknown; no fixpoint/Producer |
| deterministic pre-group is treated as final cluster, unresolved observation/cluster, or different mechanisms merge only by text similarity | typed Analyst return; analysis gate failed; no Producer |
| counterquery finds a contradiction | broader hypothesis must narrow/split/refute; retaining it is product failure |
| required counterquery incomplete/unsupported, a repo/unit unvisited, or LLM marks a required claim not-required | hypothesis/obligation unknown or blocked; no DraftProposal/coverage closure |
| Plan/Analyst/Producer adds a fact, uses live filesystem/Markdown fallback, or Producer receives query/persist/review authority | strict role violation; no G1/content-ready |
| Producer/Analyst marks a high-value cluster no-value/generic/duplicate/zero, including in an already-covered cell, without passing independent disposition review | unresolved/review failure; knowledge cannot disappear or close G3 |
| Producer invokes `knowledge.submit`/persist/query/review, G2 mechanism defect is routed to Producer wording repair, or a non-pass lacks one owner/resume state | role/typed-routing failure; no content-ready and no generic previous-stage retry |
| a cell/pass or canonical batch exceeds its per-pass/global candidate cap | whole pass `CANDIDATE_CAP_OVERFLOW`; no first-N selection and no arrival-time winner |
| DeepSeek timeout/429/5xx | bounded configured retry/circuit/cost; unresolved cell unknown; no filler |
| malformed output or repair exhaustion | reject after total content-changing repairs≤2; changing pass/evidence/fingerprint cannot reset the stable lineage root |
| Markdown-derived finding, reviewer not calibrated/independent, mutable-source re-slice or invalid citation | no G2 pass/content-ready |
| G2 axis row missing/weighted away, axis score/verdict mapping inconsistent, novelty generic/already-covered/unknown, duplicate target unresolved, or total verdict disagrees with the fixed derivation rule | reject/reviewer-contract failure; no content-ready |
| a G2 mechanism/novelty defect triggers Analyst re-fixpoint but any old expression/admission/persistence/content-ready row remains eligible, the replacement private corpus is not empty-before-replay, or an old row affects dedup/coverage/snapshot | dependency-invalidation failure; no G3. Append invalidation, rebuild the full replacement revision and preserve old descendants only as evidence |
| replacement-fixpoint Producer emits the same authored fingerprint as an invalidated row and the runner treats it as an idempotent old-row hit or skips the new attempt/receipts | fixpoint/revision-scoped idempotency failure; no content-ready/G3. Emit a new capped semantic attempt with new bound receipts; old row stays ineligible |
| replacement revision reuses the old data root/SQLite/files, leaf existed before allocation, ordinary/global resolver opens it, or any old-root open/read occurs after switch | physical revision-isolation failure; no replay/G3. Keep both roots private, preserve evidence and return to Alembic/Core owner |
| revision leaf opens Repository/Gateway before supported DB init; canonical version+artifact semantic hash, SQLite integrity/FK, identity/scope/config ref or initial blank state mismatches; BiliDili revision lacks 017 | revision-init failure; close DB, keep leaf failed/private evidence and block replay. Raw `applied_at` difference alone is allowed; no manual migration/config/identity edit or leaf reuse |
| admission/consolidation fails or receipt fingerprint differs | fail closed; no direct Gateway fallback/persistence |
| exact/semantic duplicate DraftProposals | serial canonical admission persists one representative; replay returns the same disposition, never two Recipes |
| Producer-eligible hypothesis lacks an expression-set receipt; refuted/zero-induction branch fabricates one; a version violates 0..N/conditional-zero-row conservation; any expression/disposition row disappears, has duplicate fate/broken repair parent; merge/duplicate target is absent/not final content-ready; or terminal head is unresolved/failed/unknown | expression/induction conservation failure; no G3 |
| an earlier proposal is revised/rejected | it is not inserted; next canonical proposal observes actual accepted corpus and cannot be blocked by stale journal state |
| crash after `PERSIST_PREPARED`, after DB/file durability or before journal step consumed | inspect the same journal-authorized prepared Recipe ID and expected hashes; reconstruct one receipt, retry the same ID through the trusted internal Gateway path if absent or fail divergence; actual ID must equal prepared, strict UUID allocation/public ID injection=0 and no second Recipe |
| third content-changing repair after a new pass/evidence/fingerprint/cluster ID/hypothesis ID/fixpoint seal | causal parent/root-set lineage yields `semanticRepairDepth>2`; reject, and renaming/resealing cannot reset it |
| incomplete investigated-empty scan | cell unknown; no coverage shortcut |
| file temp/write/fsync/rename failure | old file intact; no DB advance; journal typed failure |
| post-G3 DB/file/ref/binding reconciliation needs a repair or writes in place | invalidate CandidateCoverageReceipt, return to pre-G3 durable owner and recompute G3; T4 remains blocked |
| DB commit after file failure | forbidden; test fails product |
| DB failure after durable file | typed divergence/repair receipt; no finalization |
| lifecycle move returns null or strict best-effort quality side effect escapes receipt | DB/lifecycle unchanged or product failure; no finalization |
| assembly contains pending/staging/deprecated Recipe or incompatible staging-only field | no seal/G4; lifecycle activation defect |
| canonical module/ref-set drift, missing or out-of-project | contentReady/G3/finalizer blocked |
| sparse negative/coverage-confusion failure | no G4/snapshot publication |
| vector partial/missing/orphan/hash/model/dimension mismatch | generation unhealthy; no CAS |
| serving validation begins before immutable final coverage, reads a different hash or invokes Plugin/MCP code | state/ownership violation; candidate private; no serving manifest/CAS |
| I8 Plugin serving-fixture/schema/handler compatibility mismatch | Test blocked; return to Plugin/shared-contract owner, not automatic candidate regeneration |
| any ordinary MCP/daemon/CLI/HTTP/repository reader or automatic hook reaches/mutates candidate; or a loaded required Dashboard reader does so | isolation/security failure; stop. Dashboard N/A instead requires not-started evidence and permits no runtime inference |
| route/DB/vector/manifest tamper | resolver fail closed |
| two full strict runs contend | external operation lease admits one; the loser stops before route CAS and remains private |
| isolated route-store compare-null primitive receives two synthetic prepared payloads | lock-inside-compare yields exactly one winner; this fixture does not bypass the full protocol's outer lease |
| restore races final CAS | external operation lock serializes them; restore cannot replace lock authority and readers/CAS remain fenced until winner/recovery receipt |
| operation-lock owner crash/stale lock | only owner/heartbeat/journal-proven recovery; no second lock inode/path bypass |
| crash after CAS prepare, after rename/before receipt, after receipt | null retries; exact prepared payload reconstructs receipt; other payload conflicts |
| active route has the same semantic hash as prepared but a different timestamp or other non-semantic byte | byte-hash/payload mismatch; conflict, never winner reconstruction |
| unexpected non-null route not correlated to winner | pointer conflict/drift; no assumption old session is valid |
| crash before header, after header, request-without-ack, accepted/draining, old-PID-dead-before-receipt, post-receipt-before-snapshot, snapshot-before-reset, reset/quarantine, or restore-before-runtime-restart | fresh-process recovery resumes the exact journal stage idempotently. Snapshot/reset is impossible before post-quiesce receipt; reset-or-later rebuild failure exact-restores the post-quiesce snapshot before normal runtime creates fresh PID/state/token |
| restore copies stale daemon PID/token/state or restarts runtime before exact whole-root/DB/pointer verification | recovery failure; keep fence/lock and do not declare prior data serviceable |
| rebuild snapshot restored but resolver/config/enrollment/marker/read-only baseline differs from `ObservedPreResetPublicationModeReceipt` | keep operation lock/fence; previous data is not declared serviceable even when route is null |
| T6 public five-tool mismatch after CAS | Test/product failure; preserve evidence and loaded hashes, fence readers, then discard pristine root or restore authorized-rebuild snapshot; return to exact owner and rerun acceptance/Test |

## 11. Five-Tool Oracle Matrix

| Tool | MR-ALEMBIC | SP-BILIDILI | Negative controls |
| --- | --- | --- | --- |
| Search | useful ready knowledge across five repos with source/usage/vector trace | root and each Package family scoped correctly | no staging/unready/deprecated/drift/cross-project; knowledge coverage ≠ generic test coverage; negative intent excluded |
| Graph | 5/5 live-source traversal, refs/continuation/fingerprint | root+4 exact identity/structure | no Recipe/mount; no script nodes; omissions honest |
| Recipe Map | region + deterministic mounts for serving snapshot | root/package region + stable mounts | mount accounting separated from cell coverage; no staging/deferred/script pollution |
| Prime | schema-valid actionable pack with Recipe/usage/source/publication | same for Swift/packages without Alembic leakage | missing evidence degraded/fail, never malformed or empty success |
| Guard | ready rule Recipes on valid/violation multi-file overlay | Swift/Package valid+violation cases | missing/unreadable/out-of-root/incomplete knowledge never silent pass |

## 12. Success, Failure, Blocked And Cannot Infer

### Success

All four rows independently prove:

- exact accepted artifacts were loaded; Test built nothing;
- all §2.1 bindings were revalidated after the rebuilt artifacts, the user explicitly started/cooperated, and Dashboard required/N/A provenance and startup decision agree;
- scenario authorization/blank state correct and no unauthorized write; authority→external lease→header readback/fsync predates quiesce and every target mutation; live rebuild daemon returns an authenticated exact ack, exits gracefully, checkpoints SQLite and seals the post-quiesce whole-root receipt before snapshot; pristine planned-absent→actual realpath equality passes; the dedicated marker stays in its allowlist and provider/model config is unchanged;
- snapshot/reset uses only the post-quiesce receipt hash; fault recovery is fresh-process idempotent at every setup journal stage; rebuild exact restore is verified before normal runtime creates fresh PID/state/token, with no stale process identity;
- observed pre-reset recovery data remains distinct from activation expected public/vector null;
- one post-blank PC capture has independent scope, complete inventory/frozen-source/detail/vector and minimal Foundation run lease; V2 repo×nine-request×selector×canonical-scope×language/parser/surface/owner rows pass, base certification precedes open and remains unchanged, actual adapter receipts share `artifactId/sourceVectorHash`, >12/>24/>80 module conservation passes, all direct/raw/synthetic/capped/empty-axis bypass and unknown/partial/defect counters are zero, and terminal Graph/Map truth cards pass separately;
- BiliDili 017 and identity pass in both SP rows;
- ten-row anatomy applicability, extended-PlanIntent question/tool/priority/within-cap budget decomposition, compiler/baseline schedule/caps and execution-projection propagation pass, with no floor/filler/deferred/starvation/hidden truncation;
- dimension-free anchored direct facts, witnessed derived facts, multiscale populations and final-expanded schedule are hash-stable; schema-only edges never masquerade as capability; every required counterquery was enrolled before execution; iterative Analyst fixpoint/final semantic clusters/inductions/falsification/disposition reviews and Producer proposal-only expression-set receipts are complete with per-version 0..N/conditional-zero-row conservation, one terminal fate per expression/disposition row and no unresolved hypothesis; every Recipe traces Fact/Witness→final Population→Cluster→Induction/Hypothesis→Falsification→ExpressionSet and claim strength matches authority;
- every non-pass gate result has exactly one owner, permitted mutation, repair count, invalidated seal and resume state; strict path has no generic skip/degrade/completed-with-errors continuation;
- G1/admission/G2/persistence/ref/final-obligation+lens+cell coverage/assembly/seal/sparse/vector/G4 all pass by raw receipts; every G2 pass has six hard axis rows at `pass/2`, explicit allowed novelty and resolved duplicate decisions rather than an average/overall prose verdict; serving reconciliation and immutable final coverage complete before tool-neutral serving validation, and the serving manifest completes before CAS;
- candidate is invisible before one lock-inside-compare final CAS;
- after CAS the complete public five-tool matrix passes: Graph remains live-source/Recipe-free, Map reads exact final coverage, and the other four consume one serving snapshot/vector provenance;
- repeatability and fault outcomes match this spec;
- filesystem diff proves source/other roots/forbidden set unchanged.

### Product failure

A fully preflighted accepted artifact violates any contract: incomplete ProjectContext, pre-reset facts reuse, invalid Plan cognition/compile, nondeterministic facts/populations, unenrolled counterquery, unresolved or wrong cluster/claim, lost/duplicate/unresolved expression fate, low-value Recipe, invalid source, lens/cell gap, persistence/ref/index mismatch, candidate leak, serving-contract/public-five-tool failure, partial public state, recovery failure or unauthorized write.

Test returns the smallest raw reproduction, loaded hashes, exact call chain and owner evidence. It does not patch.

### Blocked

- non-Test/controller acceptance bundle missing;
- revision 154 Alembic strict quiesce/recovery acceptance or rebuilt exact artifact/manifest revalidation is missing;
- user has not explicitly started/cooperated with this real Test run;
- PC-F reports an unresolved confirmed ProjectContext defect, fallback-masked failure or lacks failing-before/passing-after repair evidence;
- artifact provenance/load hash missing or mismatched;
- accepted fact-query-pack/code-fact-backend provenance, query/grammar/fixture hash or load receipt missing/mismatched;
- root identity/authorization/source/config/credential unresolved;
- any §2.1 binding lacks its post-repair revalidation receipt, including SP source or exact Ghost authorization;
- effective DeepSeek endpoint/reasoning/embedding load receipt is absent or the reasoning-key mismatch is unresolved;
- Dashboard trigger says required but its artifact/compatibility/load receipt is absent, or says N/A while Test attempts to start it;
- required supported snapshot/reset/fault port absent;
- product implementation only exists in source but accepted build is absent.

Blocked is neither pass nor fail.

### Cannot infer

Even a full pass does not prove:

- every future query always retrieves the ideal Recipe;
- any relation outside the frozen inventory, accepted backend model and fact-harvest/lens schedule was inspected;
- a Plan LLM or deterministic compiler guarantees valuable knowledge exists; together they define accountable questions/boundaries, while populations, Analyst induction/falsification, G2 and real oracles establish correctness/value;
- an accepted investigated-empty decision proves no valuable fact exists outside its frozen inventory/final fact-query universe or in future revisions;
- BiliDili application UI/runtime outside knowledge-tool scenarios;
- future source/model/config/version scale;
- Dashboard necessity if APIs/logs suffice;
- deployment authority, TODO closure or writes outside approved roots.

Any required row not run remains `not-run/unknown`.

## 13. Recovery And Cleanup

- Successful rebuild: leave the new public snapshot for controller/user inspection; retain the immutable post-quiesce recovery snapshot until final controller judgment.
- Failed rebuild after reset and before CAS: the new strict public route remains null. Under the existing external operation lock prove this run did not commit a route, close revision handles and restore the exact post-quiesce snapshot; verify whole-root/SQLite/pointers against `QuiescedPreResetObservationReceiptV1` **before** restarting. Do not restore stale daemon PID/token/state. Start the normal runtime to create fresh control state, then restore/reselect the exact observed legacy/strict reader-mode binding and require DB/files/vector/public route, migration-ledger, marker/resolver/config/enrollment and bounded baseline read to match the pre-reset recovery contract. Route-null alone is insufficient.
- Failed pristine before CAS: public remains null; preserve evidence and discard only demand-owned root through a cleanup receipt.
- T6 failure after CAS: first preserve the exact public route, five-tool request/response and loaded-artifact hashes, then keep/fence the operation root. For pristine, close readers and discard only the demand-owned root through a cleanup receipt. For authorized-rebuild, reacquire the external operation lock, restore the verified post-quiesce snapshot, verify it before normal-runtime restart, then re-establish the reader-mode binding and require the same pointer/data/hash/baseline-read equality as pre-CAS recovery. This recovery does not rewrite history: the CAS stayed atomic, but the scenario remains failed until owner repair, controller reacceptance, artifact rebuild and user-authorized rerun pass.
- CAS conflict: correlated winner may remain; loser private. Null follows scenario-specific cleanup/restore. Unexpected non-null is conflict, not automatic old-session validity.
- Unexpected write: stop and hash affected targets; do not erase evidence through cleanup.
- Test-discovered product bug: controller assigns owner. Product source/artifacts remain read-only; the approved scenario data root remains writable only through the accepted scenario/recovery entrypoints and later accepted-artifact rerun.

## 14. Required Evidence Pack

Each scenario emits one sanitized, immutable evidence bundle plus large content-addressed attachments where needed. The following are required **sections**, not mandated physical files, services or tables:

| Bundle section | Required contents |
| --- | --- |
| `controller-and-environment` | controller acceptance; existing state-root/scenario bindings; Ghost authorization; artifact manifest/load/compatibility/Dashboard branch; frozen config; source/scope/revision and independent inventory |
| `reset-and-recovery` | pre-quiesce authorization/pointers/reader-mode receipt; external lease and V2 header durability order; authenticated request/ack or typed absence; exact control-state delta and SQLite checkpoint/WAL/SHM; immutable post-quiesce receipt; planned-absent/actual realpath or snapshot/restore probe bound to that receipt; post-reset migration/identity, exact reset, blank/activationExpected pointers; marker/config immutability; stage-by-stage fresh-process recovery, exact restore before fresh daemon control state and equality+baseline-read cleanup/recovery |
| `project-context-foundation` | PC-F baseline/final regression; base certification/store readback/lease; inventory/frozen-blob/detail/request V2/owner/ref conservation; actual consumer projections/lineage/order; bypass matrix; live Graph/region and Map truth; repeatability |
| `plan-and-mining` | dimension + anatomy catalog; applicability/policy; extended PlanIntent decomposition/tool/priority/budget receipt and lineage; Plan/execution projection; run manifest; fact-query pack/load; canonical-subject schedules; direct-anchor/derived-witness/multiscale facts; expansion/counterquery ledger; populations; Analyst-owned clusters; induction/falsification/disposition reviews; fixpoint; typed gate returns |
| `content-and-durability` | Producer proposal-only expression sets and repair lineage; G1/admission/disposition decisions; G2 six-axis rows with typed evidence plus novelty/duplicate/mechanical total; serial journal/fixpoint-scoped idempotency; private-corpus root handles/manifests/absent-before-create; per-revision migration semantic hash plus raw ledger/identity/config/initial-blank receipts; repository-open/read counters; prepared-vs-actual ID/UUID-allocation trace; persistence/ref bindings; investigated-empty; hypothesis-expression closure; working DB/file/ref reconciliation and reader/writer/hook isolation |
| `coverage-and-serving` | candidate coverage; lifecycle assembly; candidate data manifest; sparse verification; vector generation/inspection; G4; final reconciliation/coverage; serving manifest; prepared/committed public CAS and recovery |
| `oracles-and-repeatability` | I8 exact-artifact Plugin serving-fixture compatibility, T6 post-CAS public five-tool matrices, scenario cleanup/restore on failure, clean/independent rerun comparison, fault matrix and hidden-bug owner/rerun history |
| `boundary-and-review` | forbidden-root/filesystem diff, secret/path redaction check, command/result summary and Test self-review |

Each section has schema/canonicalizer version, hash, attachment refs, readback result and `pass|fail|blocked|not-run`. Mode-level summaries reference but never replace scenario raw receipts. This grouping is an evidence packaging constraint only; it does not create a new product evidence store.

## 15. Stop Conditions

Stop immediately when:

- any entry precondition or loaded artifact hash fails;
- root/source/config/authorization/snapshot/restore/blank preflight fails;
- planned-absent path, external journal-header ordering/location, dedicated marker path/config immutability or observed pre-reset reader-mode recovery cannot be proven;
- live-ready strict action is swallowed/pre-killed, external authority/lease/header does not precede quiesce, authenticated ack/old-PID exit/checkpoint/post-quiesce receipt fails, or snapshot source hash differs from that receipt;
- accepted PC foundation baseline is absent/stale;
- ProjectContext independent scope, V2 request/language/parser/surface, frozen blob, owner/ref/consumer/Graph/Map facts are partial, unclassified, placeholder/caller-self-certified, omitted or nondeterministic;
- Plan or Agent starts before blank+facts readiness;
- Plan cognition starts before ProjectContext readiness, any anatomy row/decomposition/tool/budget strategy is missing, or Producer starts before anchored/witnessed facts/multiscale populations/cluster/induction/falsification readiness; any required backend/query producer receipt is missing/truncated/unknown;
- runtime truncates, defers, raises cap or changes provider/config;
- any final fact/query obligation, direct/derived witness or expansion revision is missing/duplicate/failed/unknown, final schedule/fixpoint is unsealed, any population/cluster/disposition review/lens is unresolved, a non-pass has no unique owner/resume state, or any cell remains partial/exhausted/failed/unknown/deferred;
- a private-corpus revision leaf is not absent/confined, old and new root/DB are not physically distinct, supported DB migration/identity/config/initial-blank receipt fails (including BiliDili 017), any old-root/global-resolver read occurs after switch, actual Recipe ID differs from journal-prepared ID, or strict persistence allocates a random UUID;
- candidate becomes public early, Graph emits Recipe, or snapshot/vector/route invariant fails;
- first valid product failure is fully captured.

Return evidence to controller; do not continue broader testing to manufacture a mixed pass count.

## 16. User Confirmation And Outstanding Operational Bindings

The user confirmed both project modes/scenarios, two approved Ghost roots, snapshot/reset/recovery, exact production config, credential symbols, `deferredCells=[]`, ProjectContext-before-Plan, LLM role boundaries and post-CAS five-tool Test. The user also confirmed the revised strict setup order: external authority/root identity/lease/header first, existing-daemon authenticated graceful quiesce second, immutable post-quiesce whole-root/checkpoint receipt third, and snapshot/reset only afterward. Test remains required but is now paused: all revised non-Test targets must pass controller acceptance, exact artifacts/manifest must be rebuilt and revalidated, and the user must then explicitly start and cooperate with the environment operation. Test remains the hidden-bug phase, never an implementation substitute.

Open product questions: **none**. Current gates are operational: Alembic repair/controller reacceptance, rebuilt artifact/binding revalidation, then `TEST-START-USER`. No Test task/card/dispatch exists until all three close.
