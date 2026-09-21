# Alembic 五个知识工具深度审计与修复 Workspace Handoff

Design Key: alembic-five-knowledge-tools-deep-audit-2026-07-11
Date: 2026-07-11
Status: delivered-controller-claimable
Source Window: Design
Receiving Window: Wakeflow

## Summary

Design 已基于五仓最新源码完成五个知识工具的深度审计，并把问题按 `architecture / hybrid / targeted / preserve-no-change` 重新归类。历史截图中的 Swift/Package.swift 解析和部分 Plugin schema 问题已经被近期提交修复；当前真正需要优先处理的是会制造错误结论的主线缺陷：Guard 假通过、Graph 固定四仓截断、Recipe Map 截断后再计数、Search 合流后排序前截断、Prime 对 Guard rule 绕过信任门。

推荐落地不是“大重构”或零散补丁集合，而是 **5 个 Plugin-owned 共享完整性机制 + 每工具局部闭环**：结论完整性、collection/projection 分离、ProjectScope identity、Search→Prime→Guard 证据信任链、contract/effect/build provenance。共享机制只扩展现有 leaf primitives、纯规则和真实 collector seam，不恢复统一大信封或万能 service；每项必须与至少一个真实工具消费者同阶段落地。

用户已确认最终 Test 必须同时覆盖 AlembicWorkspace 五产品仓多仓模式和 BiliDili 独立真实知识项目模式。两边现有知识库都保留为只读真实快照；stale 现状先做负例，aligned 与 205+ 边界只在 demand-owned 副本中运行。MCP refresh 后分别新开两个对应 cwd 的临时 Codex 窗口，以首个 status/provenance readback 证明新进程加载了目标 dist 且 host=selected=active。

本文件是已正式交付的 controller intake 输入，不是任务派发。用户在需求设计完成后明确授权总控领取并自动化推进；Design 已调用 `wakeflow_deliver`，写入 `pending-claim`、`Auto Claim=yes`、P0。Design 仍未创建 state root、产品/Test 包或实现派发。

## Handoff Type

requirement-delivery (controller-claimable, auto-claim authorized)

## Confirmed User Goal

- 新建独立需求，深挖 Alembic 空间和五个相关源码仓库。
- 全面检查 `alembic_search`、`alembic_recipe_map`、`alembic_prime`、`alembic_code_guard`、`alembic_graph`。
- 截图来自最近但非最新代码，必须以最新源码重新判断。
- 只在 Design 当前窗口做真实代码挖掘，不进行派发。
- 基于现状区分可由架构机制根治、需要架构+局部结合、只需针对性修复和应保持不变的问题，并更新统一真实落地方案。
- AlembicWorkspace 多仓模式与 BiliDili 独立项目模式都进入测试验收，不能相互替代。
- MCP 更新需要重载时，允许在刷新后新开临时 Codex 窗口取得新进程证据。
- 每个阶段都要落到真实文件/函数、代码动作、验证命令、二进制退出门和失败回路；每个已登记问题都要能追溯到一个实施切片。

## Final Completion Definition

- 五工具不再产生 false pass、false ready、false trust 或 silent omission。
- 五仓 ProjectScope、200+ Recipes、多语言、重复名称、stale/renamed refs 和文件错误都有明确正确语义。
- 公共输出保留内层 verdict/coverage/freshness/trust/error 事实。
- 五工具共同满足结论不强于证据、完整事实先于展示截断、ProjectScope 身份不冲突、信任证据可追溯、read-only 零写和 runtime provenance 可核验。
- 每个共享机制有同阶段真实消费者；每个局部缺陷有明确 owner、依赖与二进制验收，不接受空架构或永久临时 contract。
- 39 个登记问题全部映射到 P0-P3 的代码级切片；P4 只做双模式 fresh-process acceptance，不承担产品修复。
- 两个模式均有完整 source/knowledge/runtime manifest、五工具原始 JSON、filesystem/isolation evidence；跨项目 mismatch 为零知识泄漏。
- MCP refresh 后两个独立临时进程都证明实际加载的 Plugin/Core commit 与 entry hash；旧窗口结果不计入验收。
- Plugin/Core/Alembic/Agent 相关产品检查和后续隔离 Test matrix 全部通过。
- Dashboard 只有真实 HTTP/UI 影响时才参与。

## Current Design Status

- Requirement design status: complete for design scope, including architecture/targeted classification and unified landing design.
- User confirmation status: audit scope, dual-mode Test environment, fresh-window method and unattended controller progression confirmed.
- Mainline relation status: `pending-claim`, submitted with Auto Claim=yes.
- Original plan confirmation status: confirmed by direct request.
- Code fact status: sufficient for controller planning; latest five-repo baseline recorded.
- Code-level execution guidance: complete for Design scope; exact source seams, required tests, phase commands and repository evidence bundles are recorded.
- Needs Wakeflow code research: no broad research; owner windows must verify touched seams before implementation.
- Detached Design mode: yes.
- Relation to Wakeflow current mainline: none. Active index/status are stale projections of a deleted prior demand and were not modified.

## Recommended Next Step

Controller should claim the delivered row, create the authoritative state root, preserve P0→P4 ordering, and build one combined package per participating repository. Core must not receive a speculative package: current public pagination, ProjectContext identity and `auditFiles` are already sufficient, so any Core escalation needs a failing consumer test and renewed boundary review.

This recommendation is for Wakeflow review only. It is not an implementation-window prompt.

## Functional Loop Summary

- User scenario: developer retrieves project knowledge and validates code in either an AlembicWorkspace five-repo ProjectScope or the independent BiliDili real-knowledge project.
- Input: mode manifest plus query/focus/ref/task/files with explicit project identity, revision vector and budgets.
- Output: truthfully ranked knowledge, complete/explicitly truncated graph/map, trust-labeled Prime, coverage-backed Guard verdict.
- State change: read tools remain read-only; Guard side effects are explicit and receipt-bound.
- Producer: Plugin public MCP; Core deterministic capabilities; Alembic resident search.
- Consumer: Codex host and developer; Agent only as shared-Core regression consumer.
- Failure path: invalid/missing/unreadable/stale/truncated/unavailable/mismatch/old-MCP-process remain visible and cannot become success or cross-project evidence.

## Top Findings For Controller Review

| Priority | Finding | Current Owner | Why It Blocks Trust |
| --- | --- | --- | --- |
| P0 | Guard missing/unreadable files and round cap can return pass; public output hides the decisive fields. | AlembicPlugin | “通过”可能代表没有完成检查。 |
| P0/P1 | Graph hard caps ProjectScope at four folders with no omission diagnostic. | AlembicPlugin | 五仓需求天然漏一个仓。 |
| P0/P1 | Prime Guard rules skip the Recipe evidence/0.45 trust gate and become trusted-to-obey. | AlembicPlugin | 弱规则可被当成强制规范。 |
| P1 | Recipe Map truncates mounts before rollup and lists only first 200 Recipes. | AlembicPlugin | 汇总数量可能是错误事实。 |
| P1 | Search auto limits keyword-first merged results before global candidate ranking. | AlembicPlugin | 高价值 semantic-only 命中可被提前淘汰。 |
| P1 | Map is advertised read-only but writes/deletes a per-project singleton fullMap file. | Plugin + Core transport | Ref 可被后续/并发调用覆盖，且 annotation 不诚实。 |
| P0/P1 | 两个确认环境均报告 `freshness=current`，但 BiliDili checkpoint 落后 4 commits，AlembicWorkspace checkpoint 只属于一个 repo。 | AlembicPlugin + Alembic | stale/partial knowledge 可被误当成完整 current，正向验收失效。 |
| P1/P2 | Main repo retains dead old MCP schemas while live contract is Plugin-owned. | Alembic | 容易修错事实源并形成重复契约。 |

## Architecture Versus Targeted Repair Summary

| Repair Class | Problems | Landing Decision |
| --- | --- | --- |
| Architecture A-01: conclusion integrity | Guard/Graph/Search 的内层失败、partial 与外层强结论不一致。 | 共享 `CollectionCoverage` / `ConclusionDisposition` 纯规则；Guard、Graph 同阶段首批接入，各工具保留自身 output。 |
| Architecture A-02: collection before projection | Graph repo、Map Recipe/mount、Search candidate 在 truth calculation 前被 cap。 | 全量/有界可续收集先形成 coverage，再算 rollup/rank/status，最后执行 presentation limit。 |
| Architecture A-03: project-scoped identity | Graph 裸名称 id 在多仓冲突。 | 直接复用 Core `ProjectContextRef.id` 与 repo scope；不在 Plugin/Core 再造第二套身份。 |
| Architecture A-04: retrieval evidence/trust | Search lane、Prime kind/source/trust、Guard adoption 语义割裂。 | Search evidence → Prime hydration/trust → Guard delivered/overlapped/applied/violated receipt。 |
| Architecture A-05: contract/effect/provenance | no-op schema、read-only 写盘、影子契约、scalar freshness、source/dist 不可证明。 | catalog-indexed honesty tests、零写断言、project revision vector + build manifest、consumer scan 后清理 shadow。 |
| Targeted closures | `auditFiles` 未接、operation 冲突、Graph 特判、Map `newPath`/unknown、Search 硬编码 intent、Prime 旧诊断。 | 在现有 handler/normalizer/schema seam 直接修并绑定二进制 fixture，不新增架构层。 |
| Preserve/no-change | Core 当前分页/ref/auditFiles、Agent intentional boundary、Dashboard 无消费者、project mismatch gate。 | 默认不改；只有新代码证据触发条件回归或用户边界决策。 |

统一不变量：结论强度 ≤ evidence completeness；exact total 只来自 complete collection；display limit 不改变 truth；public id 带 repo scope；obey 必须有 hydrated active source；public projector 不丢失败；read-only 零写；loaded runtime 可证明 source commit。

## Recommended Repository Coverage

| Window | Recommended Status | designIntent | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- | --- |
| AlembicPlugin | participates | `truth-before-convenience-without-universal-layer` | One combined package later, internally sequenced P0→P3: shared leaves/policies plus all five real consumers and local closures. | Needs confirmed state root and user phase confirmation; consumes current Core exports. |
| AlembicCore | observing/conditional | `reuse-existing-deterministic-capabilities` | Default no code change: current pagination/ref scope/`auditFiles` are sufficient; escalate only with a failing public-export consumer test. | Any escalation needs controller/user boundary review; no default producer task. |
| Alembic | participates | `resident-provider-shadow-cleanup-and-runtime-proof` | Preserve resident search; remove/relabel dead MCP shadow after consumer scan; verify runtime/build provenance. | Live Plugin contract stabilized first. |
| AlembicAgent | no-task/conditional regression | `preserve-intentional-in-process-boundary` | No public MCP work; regression only if Core actually changes. | No current dependency. |
| AlembicDashboard | no-task | `do-not-conflate-knowledge-graph` | No work unless a real Alembic HTTP/UI contract changes. | No current evidence. |
| BiliDili | future-test-fixture/no product task | `real-standalone-knowledge-ground-truth` | Supply a demand-owned copy of clean Swift/SPM source, four submodules and the real knowledge snapshot; no product/live-data mutation. | User-confirmed independent Test mode after product gates. |
| Design | design-complete | `evidence-led-requirement` | Maintain decisions and answer redesign questions only. | No dispatch/acceptance authority. |
| Test | future-participates | `dual-mode-real-project-proof` | Run AlembicWorkspace + BiliDili stale/aligned/205+/mismatch matrix in two post-refresh temporary Codex processes. | Environment confirmed; isolated data-root binding and product gates required. |

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| P0 | Safety containment with final leaves | Plugin minimal coverage/conclusion leaves → Guard/Graph/Prime high-risk branches. | Missing/read/max-round、第五仓遗漏、弱 Rule 均不能形成强结论；无临时平行 contract。 |
| P1 | Integrity spine + structural consumers | Guard/Graph full migration → Map complete pagination/count/identity/ref handling; reuse current Core exports. | Five repos and 205+ Recipes conserve counts or show explicit failures/omissions; duplicate ids remain separate. |
| P2 | Retrieval/trust chain | Search fusion/freshness → Prime hydration/trust → Guard receipt feedback. | Rank-before-limit、对称 trust gate、stale degrade、反馈事实不被混为 adoption。 |
| P3 | Contract/effect/provenance | Field/effect checks → project revision manifest → read-only continuation → shadow cleanup/build proof. | One live truth source, zero hidden write, complete repo vector and same-build runtime evidence. |
| P4 | Dual-mode fresh-process acceptance | Product checks → MCP refresh → new AlembicWorkspace window → new BiliDili window → controller raw-evidence review. | Both modes meet every binary criterion with matching build/revision manifests and no cross-project leakage. |

Phase candidates are for controller review only and are not task packages.

## Code-Level Slice Index

The full file/symbol changes, tests, commands and binary gates live in the Requirement Design `Code-Level Implementation Guide`. The controller should preserve this order inside one future combined `AlembicPlugin` package:

| Phase | Ordered slices | Hard dependency |
| --- | --- | --- |
| P0 | `P0-GUARD-VERDICT` → `P0-GRAPH-COVERAGE` → `P0-PRIME-RULE-TRUST` → `P0-REVISION-FAIL-CLOSED` | No later phase may reinterpret incomplete coverage as success. |
| P1 | `P1-GUARD-ENGINE` → `P1-GRAPH-IDENTITY`/`P1-GRAPH-FIELD-EFFECT` → `P1-MAP-FOCUS`/`P1-MAP-CONSERVATION`/`P1-MAP-REF-TRUTH`/`P1-MAP-READONLY` → `P1-PRIME-HYDRATE` | Graph coverage/identity precedes Map; full collection precedes rollup/projection; hydration precedes trust. |
| P2 | `P2-SEARCH-FUSION`/`P2-SEARCH-FRESHNESS`/`P2-SEARCH-HONESTY` → `P2-PRIME-CALIBRATION` → `P2-PRIME-GUARD-RECEIPT`; `P2-GRAPH-BOUNDARY` may self-sequence after P1 Graph | Search evidence is Prime input; Prime receipt is Guard feedback input. |
| P3 | `P3-CONTRACT-EFFECT` → `P3-SHADOW-CLEANUP`/`P3-SOURCE-REVISION-MANIFEST` → `P3-BUILD-PROVENANCE` → `P3-PRESERVE-BOUNDARIES` | Consumer scan precedes deletion; built artifact provenance precedes runtime claims. |
| P4 | freeze → stale negatives → isolated align → refresh/new windows → five-tool matrix → isolation/repeatability | Product gates and exact runtime provenance precede real-project acceptance. |

Repository completion evidence is mandatory: failing-before/passing-after test output, touched file/symbol list, phase gate output, final commit, changed public JSON samples and non-effect statement. Plugin also returns read-only filesystem hashes and build/cache manifest; Alembic returns the old-schema production consumer scan. Core, Agent and Dashboard remain no-diff unless their documented trigger occurs.

## Approach Tradeoff

- Recommended: staged Truth-First repair with Plugin retaining MCP ownership; five shared leaf/policy mechanisms plus tool-local closures, Guard/Graph/Prime safety containment first, then structural completeness, Search/Prime/Guard trust chain, contract/provenance cleanup and real Test.
- Architecture boundary: do not restore `KnowledgeContextToolOutput`, create a universal service, duplicate Core identity/pagination, or land a shared layer without a same-phase tool consumer and fixture.
- Conservative alternative: land only the Guard/Graph emergency blockers. This is acceptable as P0 containment but not as demand completion.
- Rejected boundary migration: moving Codex MCP into Core or Alembic would mix host/session semantics into shared/resident layers.
- Rejected downgrade: limiting Graph to four repos or removing Prime/Map behavior would change confirmed capability without user authorization.
- Recommendation invalidation: a real current consumer of old ids/fullMap path, a missing Core public primitive, or same-commit runtime evidence contradicting the audited call chain requires controller/user review before implementation continues.

## Proposed Test Decision

- Test needed: yes, later.
- Test now: no.
- Confirmation state: user-confirmed for Test design; still no Test card/dispatch in this Design turn.
- Mode A: demand-owned AlembicWorkspace five-product-repo snapshot + its copied real 96-row knowledge base; prove five-repo revision vector, complete ProjectScope and zero BiliDili leakage.
- Mode B: demand-owned BiliDili source/submodule snapshot + copied real 75-row knowledge base; prove real Swift/SPM Search/Map/Prime/Guard/Graph semantics and duplicate `AOXPlayerTests` identity.
- Each mode keeps current stale/mismatch posture as a negative lane, creates an aligned real lane, and uses a separate ≥205 test-only extension for pagination/status boundaries.
- After MCP refresh, select/activate the mode project first, then open a new temporary Codex window in that project root; the first status/provenance readback must prove host=selected=active and exact Plugin/Core entry hash.
- Completion is row-by-row, not a score: both modes, all five tools, cross-mode isolation, read-only filesystem, concurrency, repeatability and product gates must pass.

## Test Completion Snapshot

| Gate | Required Pass Evidence |
| --- | --- |
| Environment | Two immutable source/knowledge/runtime manifests; positive aligned, negative stale/mismatch explicitly classified. |
| Fresh process | Two separate new Codex processes load the target Plugin/Core commits and entry hash before any five-tool call. |
| Search/Prime | Predeclared independent oracle cards all meet id/rank/trust ceilings; stale/unhydrated/weak evidence never becomes ready/obey. |
| Graph | Alembic mode succeeds for all five product repos; BiliDili root+4 submodules and duplicate target ids remain distinct. |
| Recipe Map | Real and ≥205 snapshots conserve counts; limit affects presentation only; concurrent continuations remain request-bound; zero hidden write. |
| Guard | Requested-file coverage is exact; missing/unreadable/out-of-root/cross-file/max-round cases never pass; receipt feedback is idempotent. |
| Isolation | Symmetric project mismatch returns zero foreign Recipe ids/source refs; live source and live knowledge roots remain unchanged. |
| Evidence | Raw structured MCP JSON, filesystem hashes, product logs and acceptance matrix are independently reviewable. |

## Evidence And Links

- Original Plan: `Design/docs/current/alembic-five-knowledge-tools-deep-audit-original-plan-2026-07-11.md`
- Requirement Design: `Design/docs/current/alembic-five-knowledge-tools-deep-audit-requirement-design-2026-07-11.md`
- Handoff: `Design/docs/current/alembic-five-knowledge-tools-deep-audit-workspace-handoff-2026-07-11.md`
- Historical candidate used only after current-code audit: `Design/docs/current/alembic-mcp-five-tools-value-upgrade-2026-07-06.md`
- Source evidence roots: `AlembicPlugin/lib/host-runtime/mcp`, `AlembicPlugin/lib/service/project-knowledge-context`, `AlembicPlugin/lib/service/task`, `AlembicCore/src/service`, `Alembic/lib/http/routes/search.ts`, `AlembicAgent/src/tools/runtime/handlers/knowledge.ts`.
- Real Test source roots: workspace-relative `Alembic/`, `AlembicCore/`, `AlembicPlugin/`, `AlembicAgent/`, `AlembicDashboard/`, and `BiliDili/` with its four package submodules. Local ghost data-root paths and temporary thread ids are intentionally omitted.

## Risks

- Namespaced graph ids may require a compatibility resolver for real current refs.
- Map continuation must replace fullMap file behavior before old transport is removed.
- Search score calibration can change visible ordering; preserve per-lane evidence and adversarial fixtures.
- Deleting main schemas without an implementation-time consumer scan would violate deletion safety.
- Running Test under the current mismatched project identity would invalidate results.
- A fresh Codex window does not itself switch Alembic selected/active project; status must prove alignment before testing.
- Current freshness labels conflict with raw revision facts; existing snapshots are negative fixtures until isolated alignment succeeds.
- Injecting ≥205 fixtures into live knowledge or citing synthetic rows as real semantic quality invalidates acceptance.

## Non-Goals And Forbidden Shortcuts

- No implementation, dispatch, state-root creation, Test start or deployment from Design.
- No reuse of old screenshot conclusions without latest-code proof.
- No force-pass, hidden error, wrong project knowledge, mock-only acceptance or graph-as-call-proof.
- No Dashboard/Agent work merely to make all five repositories look active.

## Open Questions For Future Wakeflow Intake

1. Which supported isolated data-root binding will the controller/Test use? It must be proven before any rescan and may not fall back to live knowledge.
2. Will implementation produce a failing consumer test that contradicts the current conclusion that Core public exports are sufficient? Without that evidence, Core remains no-task/observing.
3. Does a fresh import/package scan prove Alembic main’s old MCP schema has no real consumer and can be deleted?

## Pre-Handoff Checklist

- Checked Design AGENTS/startup docs and relevant Design skills: yes.
- Reconciled screenshots against latest five-repo code: yes.
- Recorded per-window landing plan and designIntent: yes.
- Classified architecture/hybrid/targeted/preserve issues and recorded one unified integrity architecture with same-phase consumers: yes.
- Recorded non-goals and user-confirmation ledger: yes.
- Made Test decision and recorded user-confirmed dual-mode environment, fresh-window protocol and binary completion standard: yes.
- Added code-level P0-P4 implementation slices, exact source seams, commands, failure routing and all-problem traceability: yes.
- This handoff contains no copyable implementation-window prompt: yes.
- Phases remain Design slices, not task packages: yes.
- Created state root: no; controller-owned next action.
- Called `wakeflow_deliver`: yes; `pending-claim`, Auto Claim=yes, P0.
- Sent product/Test task: no; only notified the controller that the claimable delivery exists.
