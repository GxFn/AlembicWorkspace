# V2 Alembic Main strict-test private pipeline — controller acceptance rework4

## Controller Acceptance

- User goal: 先完成最新冷启动测试模式的真实后端接入，使后端自动选择一个适用维度、复用唯一 Agent/Main 私有严格链并生成可耐久回读的 canonical terminal/report；不得混入前端连接修复、legacy bootstrap、DaemonJob 重构或 production/public 写入。
- Scope reviewed: `v2-alembic-main-strict-test-private-pipeline-t1` 在 `v2-alembic-main-strict-test-private-pipeline-rework4-p1` 的 result revision 6；只评审 Alembic Main 的请求/消费者权威、真实 HTTP 状态矩阵、私有全链、失败耐久化、生成类型与边界。
- Original requirement authority: `v2-alembic-main-strict-test-private-pipeline-controller-contract.md` 的 Authority and Outcome、Completion Definition 与 Required RED/GREEN Probes；任务包的五个 acceptance anchors；`legacy-flow-closure-and-v2-restart-decision.md` 的 V2 Entry Scope、Completion Definition 与 Test Boundary。
- Target/window: Alembic；提交 `b50bff157448b4986064ddbe20d8d2ad9305c738`，父提交 `3a591f59d0b3cf598a0cdb8901034672094a5e23`，工作树干净。
- Evidence reviewed: target result revision 6；提交 diff；Main runtime parser/provider/generator/generated consumer types；compile-time consumer contract；真实 HttpServer integration matrix；controller 本轮重新执行的 build、67 个聚焦测试、真实 probe、34 例双向解析一致性挑战、实际 fetch 响应 schema 交叉挑战、边界/漂移/lint 检查。
- Implementation reality: `projectRoot` 的 canonical absolute-path 判定由 Main runtime authority 和稳定 format id 共同拥有，生成消费者必须显式注入同一 validator，缺失时 fail closed；请求、path/query、public DTO、普通 problem、带 durable status 的 start problem、operation map 与 response guards 均从 provider artifact 生成。真实 Main HttpServer 保持一条 AgentService 管线，并完成 private corpus/ref/index/G4/serving 与 Core terminal/report 的成功和失败耐久回读。
- Validation result: `npm run build:check` 通过并包含 strict-test consumer compile contract；5 个聚焦文件 67/67 通过；34 例 runtime/generated 请求判定 0 mismatch；真实 probe 返回 200→202→200→200，代表性 409/422/400 正确，Agent pipeline 1 次、模型调用 2 次，成功与真实失败均可重开；生产面不变，legacy/DaemonJob/reset/publication lock/public CAS 调用均为零。
- HTTP/schema disposition: 真实路由覆盖 preflight `[200,400,422]`、start `[202,400,404,422]`、status `[200,400,404,422]`、report `[200,400,404,409,422]`。controller 的 in-memory fetch challenge 证明 preflight success、run/status success、report success 和带 durable data 的真实 start failure 只匹配各自 schema；无 `data` 的 ordinary problem 同时匹配 `schema-4` 与包含 ordinary-problem 分支的 `schema-6`，这是同形 union 的预期重叠，不是跨状态误判。
- Blockers: 本任务范围内无 P0/P1 阻塞；rework4 明确要求的三项消费者权威缺口均已关闭，没有发现新的根因。
- Missing evidence: 无。目标窗口的五个 acceptance-anchor 映射完整，controller 已独立重跑主要正反路径。
- Residual risks: lint 仍报告 5 个既有 `any` warning，均不在本提交改动范围；普通 problem 与 start problem 的 ordinary 分支有设计性 schema 重叠，但消费者可由 operation/status map 正确收窄，不授权扩展本任务。
- TODO/backlog rollup: 关闭本 Alembic target；不从既有 lint warning、可选测试细化或同形 schema overlap 新增 TODO。V2 demand 仍未完成，Dashboard 前端接线/入口切换保持下一消费者阶段；DaemonJob 重构仍是另一问题，不与测试模式混合；真实 Test 继续暂停，且只能在全部 required non-Test 接受和用户明确启动后进入。
- Decision: `accept-target-result`。
- Next action: reduce 本结果并记录 accept；随后依据已确认的 producer→consumer 顺序为 AlembicDashboard 建立独立后续包，不把 Main 验收表述为前端已连通、真实 BiliDili 已测试或完整冷启动需求已完成。

## Independent Evidence

### Fresh controller commands

```text
npm run build:check
PASS: local AlembicCore build + tsc --noEmit + test/typecheck consumer contract

npx vitest run test/unit/StrictTestDimensionApi.test.ts test/unit/AlembicProviderContracts.test.ts test/unit/DashboardApiTypesDrift.test.ts test/integration/StrictTestDimensionPipeline.integration.test.ts test/integration/StrictTestDimensionHttpContract.integration.test.ts --reporter=dot
Test Files  5 passed (5)
Tests       67 passed (67)

controller runtime/generated request parity challenge
total=34 accepted=4 rejected=30 mismatchCount=0

npm run probe:strict-test-main
preflightStatus=200 startStatus=202 statusStatus=200 reportStatus=200
reportBeforeStartStatus=409 wrongAuthorityStatus=422 legacyActivationStatus=400
pipelineExecutionCount=1 modelCallCount=2
productionStateUnchanged=true publicRouteUnchanged=true
daemonJobServiceAccessCount=0 fullResetCallCount=0 publicationLockCallCount=0 publicCasCallCount=0
realFailedStart.status=422 reopen.status=200 reopen.reportStatus=200

controller in-memory fetch response-schema challenge
preflight 200 -> schema-3 only
start 202 / status 200 -> schema-5 only
report 200 -> schema-7 only
real failed start 422 with durable data -> schema-6 only
ordinary no-data problems -> schema-4 plus schema-6 ordinary branch (expected same-shape overlap)

npm run lint
PASS with 5 pre-existing warnings
npm run lint:repo-boundary
PASS
npm run lint:consumer-core-imports
PASS
npm run check:shared-asset-drift
PASS: 17 checks, 0 drift
npm run check:dashboard-types-drift
PASS: regenerated output byte-for-byte
git diff --check
PASS
git status --porcelain=v1
clean
```

## Rework4 Point Disposition

1. Shared path authority: runtime Zod、provider JSON schema 和生成消费者共用稳定 format id 与相同 validator；relative、dot-normalized、double-slash、missing 与 missing-validator 均失败关闭。
2. Generated consumer contract: exact readonly request/path/query/public/success/problem/operation types 和 runtime type guards 已生成；compile-time contract 同时证明合法消费与 forbidden private/legacy/undeclared-status 字段不能编译。
3. Actual HTTP matrix: 16 个实际 route/status cells 均由真实 HttpServer 到达并用 provider response schema 校验；成功 DTO、report DTO 与带 durable status 的真实失败 DTO 在不同 schema 间保持可判别，ordinary problem 仅保留声明的同形复用。
4. Pipeline invariants: 自动选择、same-run receipt、私有 chain、失败 checkpoint、terminal/report reopen 与 production/public nonmutation 均继续通过；没有新增 Agent pipeline 或 legacy fallback。
5. Generator authority: committed generated artifact 与 generator byte-for-byte 一致；未出现手改 generated-only contract。

## Forbidden Conclusions

- 本验收不表示 V2 demand 或完整冷启动优化完成。
- 本验收不表示 AlembicDashboard 已接线、前端按钮已切换或 legacy bootstrap 已从 UI 移除。
- 本验收不授权把测试模式问题与 DaemonJob 过度设计/连接断裂合并处理。
- 本验收不允许启动 Test；仍需后续 required non-Test 消费者完成、controller 自验通过，并由用户明确启动。
- 本验收不把 private strict-test 结果解释为 production finalized、public CAS 或完整 26 维生产验收。
