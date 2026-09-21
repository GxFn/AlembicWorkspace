# Recipe 冷启动生产质量 V2：从 AlembicAgent 同 run strict-test 回执链继续 进度

## 统一状态

<!-- unified-status:start -->
需求: recipe-coldstart-production-quality-v2-2026-07-31 - Recipe 冷启动生产质量 V2：从 AlembicAgent 同 run strict-test 回执链继续
主状态: planned
阶段: 无
当前任务包: v2-agent-same-run-strict-test-receipt-p1(pending)
窗口: AlembicAgent(pending)
阻塞项: 无
下一步: prepare-dispatch-from-state, add-task-package, wakeflow-render-progress
评审: 无
自动化: 未启用
需要用户决策: 无
最后更新: 2026-08-01 00:23 CST
来源状态: revision 3 / event evt-20260731162343-0003
<!-- unified-status:end -->

## 目标

继承旧 demand 已接受证据且保持未接受结果未接受，从已验证的 AlembicAgent 真实成功执行与 canonical receipt 断裂点恢复 strict-test 自动选维度执行链，再按原生产者/消费者顺序完成 Recipe 冷启动生产质量目标。

## 完成定义

Original Plan 的 Final Completion Definition 全部满足；AlembicAgent 的真实成功运行必须直接返回由同一次运行、同一 automatic-selection authority、同一 selected-cell set 的真实 stage/gate 输出构成的 canonical receipt；受影响下游 exact artifacts 均经 Controller 验收；全部 required non-Test 目标 accepted 后，仅由用户明确启动真实 Test；Test 与原最终定义均满足后才可完成。

## 阶段计划

P1 AlembicAgent same-run canonical receipt 修复与 Controller 原始证据验收；P1 accepted 后才依据实际受影响消费者按 producer→consumer 顺序建立后续包；Controller 完成 exact-artifact 自验；最后等待用户明确启动 Test 并做最终完成评审。

## 任务包

## 回填摘要

## 决策和追加日志

## Task Packages

- 2026-07-31T16:23:43.317Z v2-agent-same-run-strict-test-receipt-p1 → AlembicAgent — 修复 AlembicAgent 真实成功管线与 canonical execution receipt 的断裂，保留现有主链，不新增第二条 Agent pipeline。 (intent: 在现有 AgentService/PipelineStrategy 成功结果对象上建立唯一 canonical execution result/receipt builder；沿用已有 pipeline 与 Core automatic-selection authority，不建立并行实现。)
- 2026-08-01T09:40:31.549Z v2-alembic-main-strict-test-private-pipeline-p1 → Alembic — 在 Alembic Main 建立唯一显式 strict-test-dimension 后端，复用现有严格主链并保持 production/public 非变更。 (intent: 新增一个 Main-owned strict-test orchestrator 和独立 exact HTTP surface；参数化复用现有 strict analysis/private corpus/finalization 的真实部件，在 Agent/私有 resolver/无-public-route 三个边界接入 accepted Core+Agent authority。)
- 2026-08-03T12:52:25.163Z v2-dashboard-strict-test-entry-consumer-p1 → AlembicDashboard — 把 Candidates 页面冷启动入口从 legacy bootstrap 切换到 Main strict-test-dimension 的 preflight→自动选维→private run/status/report 真链路。 (intent: 在既有 api 单一 normalizer seam 下新增 strict-test route family，并用一个 project-scoped hook/view-model 串联 exact generated contract、长运行 start、并行 status polling、刷新恢复和 Candidates 权威状态面板；只替换 Candidates 冷启动 handler，不改 Jobs/rescan。)

## Decisions And Append Log

- 2026-07-31T16:24:48.372Z dispatched v2-agent-same-run-strict-test-receipt-t1 → AlembicAgent (delivery delivery-v2-agent-same-run-strict-test-receipt-p1__AlembicAgent__v2-agent-same-run-strict-test-receipt-t1)
- 2026-07-31T17:24:07.106Z decision rework (candidate tc-20260731171952-0005) — Request rework for two confirmed same-run integrity defects. (1) AgentService can return strict-test status=success with a nonempty early policy-reject reply and no completed PipelineStrategy execution or receipt; controller reproduced status=success with hasReceipt=false. Strict success must require a validated generate-dimension strict binding, completed pipeline outcome, and receipt whose runId, authorityHash, and selectedCellSetHash match the request authority. Missing or mismatched receipt, policy rejection, and early return must fail closed while ordinary non-strict behavior remains compatible. (2) Strict Analyst/Producer stage results remain mutable through the gate evaluator and are hashed only afterward; controller reproduced the original model reply being mutated before final phases and receipt hashing. Seal an immutable canonical stage snapshot/hash before any gate can access it, make gates and the final receipt consume that sealed evidence, and add RED/GREEN tests for policy rejection, missing/mismatched receipt, gate mutation, and non-strict compatibility. Keep AlembicCore, Alembic Main, and the unrelated 20 baseline failures out of this rework.
- 2026-07-31T17:25:39.275Z dispatched v2-agent-same-run-strict-test-receipt-t1 → AlembicAgent (delivery delivery-v2-agent-same-run-strict-test-receipt-rework1-p1__AlembicAgent__v2-agent-same-run-strict-test-receipt-t1)
- 2026-07-31T17:57:32.538Z decision rework (candidate tc-20260731175705-0008) — Request rework on a single root cause: strict-test receipt authority is enforced only after the non-coordinated runtime.execute return, not at every AgentService result boundary. Controller reproduced a canonical-shaped compiled strict profile with concurrency reaching AgentRunCoordinator and returning status=success, runId=generate-dimension:parent, no receipt, and zero runtime builds; this violates same-run and existing-chain anchors. Controller also reproduced ordinary chat passing through an unvalidated unsolicited strictTestExecutionReceipt. Centralize strict authority disposition: complete strict binding must forbid the coordinated parent route and can succeed only after one canonical generate-dimension runtime/PipelineStrategy completes with a matching receipt; absent strict binding must reject any strict receipt. Preserve ordinary non-strict chat/coordination. Add RED/GREEN for coordinator bypass, unsolicited receipt, all prior policy/early/mismatch/gate-mutation cases, and include a root-cause note explaining why every AgentService exit is now covered. Keep Core, Main, Dashboard, Plugin, Test, and the unrelated 20 baseline failures out of this rework.
- 2026-07-31T17:59:26.736Z dispatched v2-agent-same-run-strict-test-receipt-t1 → AlembicAgent (delivery delivery-v2-agent-same-run-strict-test-receipt-rework2-p1__AlembicAgent__v2-agent-same-run-strict-test-receipt-t1)
- 2026-07-31T18:17:13.298Z decision accept (candidate tc-20260731181651-0011) — Accept AlembicAgent result revision 3. Fresh controller review of commit 8688311c3970054c68a74b0ce30d8f3db4f15be6 confirms the recurring-problem root cause was re-derived and fixed at one shared AgentService authority disposition: complete strict bindings reject concurrency before coordinator dispatch and only a runtime-origin completed PipelineStrategy execution with matching canonical receipt can return strict success; ordinary runtime and coordinator exits reject unsolicited strictTestExecutionReceipt while receipt-free ordinary coordination remains compatible. Controller reran the four-file matrix (79/79), build:check, and the real strict-test automatic-selection probe; the probe used one existing pipeline, two model calls, matching run/authority/selected-cell/stage hashes, and failed closed for authority and cell-conservation drift. No P0/P1 or missing anchor evidence remains. The unchanged adjacent Core facade baseline and two optional unreachable-branch tests are outside this package and do not authorize scope expansion. Accept only this AlembicAgent target; V2 demand, downstream Alembic/Dashboard artifacts, and Test remain incomplete/paused.
- 2026-08-01T09:41:56.347Z dispatched v2-alembic-main-strict-test-private-pipeline-t1 → Alembic (delivery delivery-v2-alembic-main-strict-test-private-pipeline-p1__Alembic__v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T11:48:12.580Z decision rework (candidate tc-20260801114750-0015) — Alembic Main happy path is real, but acceptance fails: valid investigated-empty receipts are rejected by empty trust-policy validation; start revalidation does not freshly compare provider/model, prompt/config/backend/embedding/runtime-artifact and official-Recipe bindings; private execution failures are assigned inaccurate Core stages; public start/status leak the internal executionContext including source contentBase64; completed status/report do not reopen private owner/artifact integrity; forbidden-path probe counts are hard-coded and multi-cell/populated-production/real-HTTP negative evidence is missing. Rework the same task against the precise controller review contract; Dashboard and Test remain blocked.
- 2026-08-01T11:50:00.180Z dispatched v2-alembic-main-strict-test-private-pipeline-t1 → Alembic (delivery delivery-v2-alembic-main-strict-test-private-pipeline-rework1-p1__Alembic__v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T13:19:12.975Z decision rework (candidate tc-20260801131852-0018) — Rework required: commit 07ec740 repairs the private strict-test chain, but the public contract remains disconnected. The runtime returns 202/409/422 while provider-contracts and generated Dashboard API types still advertise generic 200-only success; POST /runs wraps a durable STRICT_TEST_FAILED terminal as success:true/202; and ad-hoc errors violate the canonical ProblemEnvelope and may expose raw private paths. Apply the exact bounded repair in the controller rework2 review. The investigated-empty end-to-end probe is removed from this Main package; no Core/Agent scope is authorized.
- 2026-08-01T13:21:53.411Z dispatched v2-alembic-main-strict-test-private-pipeline-t1 → Alembic (delivery delivery-v2-alembic-main-strict-test-private-pipeline-rework2-p1__Alembic__v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T14:05:42.833Z decision rework (candidate tc-20260801140522-0021) — New root cause: the provider authority models only service outcomes, not the complete HTTP route outcome algebra. Runtime-reachable GET parser/query 400 responses are absent, start 422 data remains structurally open to private-shaped extensions, request bodies/path parameters are not authoritative, and the claimed failed-start HTTP evidence bypasses the real first-run orchestrator throw/reopen chain. Preserve the accepted private pipeline and close this exact Main route contract; do not expand to Dashboard, Test, Core, Agent or a global OpenAPI migration.
- 2026-08-01T14:06:56.837Z dispatched v2-alembic-main-strict-test-private-pipeline-t1 → Alembic (delivery delivery-v2-alembic-main-strict-test-private-pipeline-rework3-p1__Alembic__v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T14:55:02.502Z decision rework (candidate tc-20260801145443-0024) — Rework3 preserves the verified private execution and durable-failure chain, but it is not acceptable because a new bounded code root cause remains: the generator treats lossy z.toJSONSchema projection plus a metadata-only schema registry and representative HTTP samples as a lossless, typed, complete consumer contract. CanonicalAbsolutePath normalization is lost in the provider schema, the generated artifact exposes no named strict-test DTO/operation types, and advertised route/status matrices are not all exercised against actual HttpServer response bodies. Rework4 must repair this exact consumer-authority boundary without changing the accepted runtime chain or expanding scope.
- 2026-08-01T14:56:02.109Z dispatched v2-alembic-main-strict-test-private-pipeline-t1 → Alembic (delivery delivery-v2-alembic-main-strict-test-private-pipeline-rework4-p1__Alembic__v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T15:59:16.581Z decision accept (candidate tc-20260801155900-0027) — Controller independently verified commit b50bff157448b4986064ddbe20d8d2ad9305c738: generated consumer authority, exact runtime/provider request parity, complete real HTTP status matrix, distinct response-schema discrimination, same-run private pipeline, durable success/failure reopen, and production/public nonmutation all pass. This accepts only the Alembic Main target; Dashboard wiring and real Test remain open.
- 2026-08-03T12:53:33.256Z dispatched v2-dashboard-strict-test-entry-consumer-t1 → AlembicDashboard (delivery delivery-v2-dashboard-strict-test-entry-consumer-p1__AlembicDashboard__v2-dashboard-strict-test-entry-consumer-t1)
- 2026-08-03T14:25:47.353Z decision rework (candidate tc-20260803142524-0031) — Spec compliance is incomplete and a Dashboard code defect is present. The result honestly reports needs-review: the real browser reached only strict preflight and failed closed at HTTP 422, so the required preflight→runs/status→report terminal sequence and terminal screenshot are absent. Independently, src/main.tsx mounts App under React.StrictMode while useStrictTestRun memoizes one controller and its effect cleanup permanently calls dispose(); StrictMode setup→cleanup→setup therefore reuses a disposed controller whose setState no longer notifies React. The 46-test npm run check passes but does not mount the hook lifecycle. Rework must make the hook/controller lifecycle StrictMode-safe, add a RED/GREEN hook-level lifecycle test covering setup/cleanup/setup and visible state propagation, preserve one-run/zero-legacy/exact-contract behavior, and remain honest about runtime completion. The missing runtime input is controller-owned: current V2 has no runtime artifact manifest, and the archived V1 manifest is path/stateRoot/hash-bound and must not be reused or fabricated by Dashboard.
- 2026-08-03T14:42:47.268Z demand cancelled — User rejected the independent strict-test-dimension design and explicitly ordered its implementation removed before any replacement design. Preserve accepted and review evidence as cancelled history; do not pretend the rejected demand completed.
- 2026-08-03T14:43:24.154Z archived → wakeflow-ledger/workspace/archive/2026-08/recipe-coldstart-production-quality-v2-2026-07-31 — Archive the user-rejected independent strict-test-dimension demand after honest cancellation, preserve its audit history, and release the mainline lane for the explicitly authorized removal demand.

## Backfill Summaries

- 2026-07-31T17:11:19.521Z AlembicAgent/v2-agent-same-run-strict-test-receipt-t1 returned completed (result tr-v2-agent-same-run-strict-test-receipt-t1)
- 2026-07-31T17:48:42.774Z AlembicAgent/v2-agent-same-run-strict-test-receipt-t1 returned completed (result tr-v2-agent-same-run-strict-test-receipt-t1)
- 2026-07-31T18:12:40.357Z AlembicAgent/v2-agent-same-run-strict-test-receipt-t1 returned completed (result tr-v2-agent-same-run-strict-test-receipt-t1)
- 2026-08-01T11:34:30.736Z Alembic/v2-alembic-main-strict-test-private-pipeline-t1 returned completed (result tr-v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T13:04:31.754Z Alembic/v2-alembic-main-strict-test-private-pipeline-t1 returned needs-review (result tr-v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T13:42:55.634Z Alembic/v2-alembic-main-strict-test-private-pipeline-t1 returned completed (result tr-v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T13:44:28.573Z Alembic/v2-alembic-main-strict-test-private-pipeline-t1 returned completed (result tr-v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T14:41:45.812Z Alembic/v2-alembic-main-strict-test-private-pipeline-t1 returned completed (result tr-v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-01T15:39:54.799Z Alembic/v2-alembic-main-strict-test-private-pipeline-t1 returned completed (result tr-v2-alembic-main-strict-test-private-pipeline-t1)
- 2026-08-03T14:19:14.651Z AlembicDashboard/v2-dashboard-strict-test-entry-consumer-t1 returned needs-review (result tr-v2-dashboard-strict-test-entry-consumer-t1)
