# Recipe strict 冷启动单维度产品级测试模式 — Requirement Design Supplement

Status: ready for controller intake
Design Key: `recipe-coldstart-strict-test-profile-supplement-2026-07-30`
Type: `supplement`
Priority: P0
Parent demand / dependency: `recipe-coldstart-production-quality-2026-07-15`
Execution date: 2026-07-30
Auto Claim: no
Open product questions: **none**

## 1. Delta Authority And Scope

本文件只描述相对以下已确认合同的增量，不复制或改写原生产要求：

- [Original Plan](recipe-coldstart-production-quality-original-plan-2026-07-15.md)
- [Requirement Design](recipe-coldstart-production-quality-requirement-design-2026-07-15.md)
- [Test Environment Spec](recipe-coldstart-production-quality-test-environment-spec-2026-07-15.md)

本轮用户新增并确认的目标是：

> 在真实 BiliDili 全量 strict 冷启动之前，先用完整、只读的项目事实与 26 维目录验证项目身份、ProjectContext、源码清单、适用性、排除理由、配置和运行时工件；用户确认后，恰好选择一个已证明适用的维度，继续执行最新 strict 主链的产品级测试 profile。

本文件新增一个与 `strict-production` 并列、但不能完成生产发布的
`strict-test-dimension` execution profile。它不授权产品实现、Controller dispatch、
Test dispatch、正式 root reset 或 public CAS。

原 Requirement Design §23 “不得再次 deliver”的约束继续适用于 requirement
重复投递、第二 demand 和第二 state root；本轮用户指令只对以下一次操作构成窄覆盖：

- 以新的 Design Key 执行一次 append-only `wakeflow_deliver(type=supplement)`；
- `dependency` 必须指向现有 demand；
- Controller 只能把它 intake 回现有 state root；
- 不得据此 auto-claim、创建第二 demand、创建 task package 或 dispatch。

除此之外，原 Original Plan、Requirement Design 和 Test Environment Spec 均继续有效。

## 2. Outcome Delta

新增完成定义由两个连续门组成：

1. **Strict Test Preflight**：对真实 BiliDili 项目范围做全量只读冻结，得到可审计、
   hash-bound 的项目身份、事实、目录、适用性、配置和工件快照；任何 unknown、
   unsupported、空目录、空项目、漂移或 hash 不一致均 fail closed。
2. **Single-Dimension Strict Test Run**：用户对同一个 preflight receipt 明确确认恰好一个
   applicable dimension 后，只缩小 execution cells，继续复用最新 strict
   Plan、fact schedule、Analyst、Producer、独立 review、private persistence/ref/index、
   G4 和 private serving validation 链。

成功终点是 `STRICT_TEST_COMPLETED_PRIVATE`，不是 `FINALIZED`，更不是
production finalized。它只能证明：

- 该 frozen project/config/artifact universe 下的 preflight 成立；
- 所选维度的 strict 执行 cell 在私有隔离 workspace 中完成；
- 该 profile 的真实后端链、证据链和 UI/API 控制链已连通。

它不能证明未执行维度、完整生产覆盖、正式 root reset、public CAS、active route
切换或五公共 MCP 生产验收。

## 3. Independently Re-Read Code Facts

以下为本轮重新读取的当前源码事实。它们描述现状，不等于已实现本补充合同。

| Fact | Current source evidence | Delta conclusion |
| --- | --- | --- |
| Main bootstrap strict 分支只有 `strictProduction` | `Alembic/lib/recipe-pipeline/RecipePipelineFacade.ts:28-52` 解析 `options.args.strictProduction`；`Alembic/lib/recipe-pipeline/generate/strict/StrictProductionContracts.ts:3-72` 的 exact-key request 只有授权、run、resume/setup 字段 | 现有 strict request 没有 test profile、preflight receipt、selected dimension 或 cell slice；不得把额外字段偷偷塞进 V1 |
| strict orchestrator 固定走完整生产链 | `Alembic/lib/recipe-pipeline/generate/strict/StrictColdStartOrchestrator.ts:183-300` 固定 blank→facts/planning→analysis→private corpus→finalize/publish；`StrictProductionJournal.ts:6-37` 固定包含 public CAS 和 `FINALIZED` | 新 profile 必须有独立、明确的非公开终点，不能在生产 orchestrator 中途返回后伪装成功 |
| strict facts 与目录当前是全量生产口径 | `StrictColdStartOrchestrator.ts:510-617` 以 `baseDimensions` 捕获 facts 并冻结 required universe、compiled Plan、baseline schedule；`AlembicCore/src/service/plan/intent/coldStartProductionPlan.ts:526-555` 要求 registry 精确匹配已接受 26 IDs | 测试切片只能发生在全量事实、目录、applicability 和 hard-gate universe 冻结之后 |
| strict 生产 selection 不允许 deferred cells | `coldStartProductionPlan.ts:371-394` 定义 `deferredCells: readonly []`；`coldStartProductionPlan.ts:1488-1506` 选择所有 eligible cells 并写 `deferredCells: []` | production 合同保持不变；test slice 必须是不同 execution profile，不能复用或弱化 production selection |
| strict 主链包含真实分析、生产、独立 review、私有 corpus、索引、G4 和 serving | `StrictColdStartOrchestrator.ts:621-676` 执行 strict analysis/production；`:678-760` 持久化并 seal private corpus；`:1161-1177` 记录 G4、serving、final coverage、snapshot validation 和 manifest | 新 profile 必须复用这些实际能力及 lineage，不得退回 briefing-only、prompt-only 或 legacy async fill |
| 普通 cold-start 的过滤在 destructive reset 后 | `Alembic/lib/recipe-pipeline/generate/ColdStartWorkflow.ts:129-175` strict 分支以外先 `runFullResetPolicy`；`:220-275` 才解析/过滤 dimensions；`:421-462` 调 `applyTestDimensionFilter` | `ALEMBIC_TEST_MODE`/普通 bootstrap 过滤不是非破坏 strict preflight，也不能作为本次 pass evidence |
| 环境 test mode 只做 bootstrap/rescan 维度过滤 | `AlembicCore/src/shared/testMode.ts:1-14,40-43,86-128` 从环境变量读取开关和维度 ID，启用但未配置时甚至原样返回 | 它没有 frozen project identity、applicability、receipt/hash、单维确认、私有 strict chain 或非公开终点 |
| Dashboard bootstrap body/API/UI 没有本补充合同 | `Alembic/lib/shared/schemas/http-requests.ts:298-302` body 仅有 `maxFiles/skipGuard/contentMaxLines`；`Alembic/lib/http/routes/modules.ts:521-538` 仅转发这三项；`AlembicDashboard/src/api/modules.ts:219-238` 固定 POST `{}`；`AlembicDashboard/src/App.tsx:587-609` 直接启动并消费 legacy bootstrap 结果 | Dashboard 当前无法 preview、推荐/选择、确认或展示 strict test 阶段证据；UI 不能假装已有后端能力 |
| Plugin `testMode` 是 confirmed Plan 后的 no-cleanup Mission Briefing 路径 | `AlembicPlugin/lib/host-runtime/mcp/tools.ts:272-283` 声明 skips fullReset、bounded dimensions/scale、returns Mission Briefing；`AlembicPlugin/lib/recipe-pipeline/plan/plan-generation-gate.ts:256-301,490-503` 投影 scope 并把 cleanup 置 `none`；`AlembicPlugin/lib/recipe-pipeline/generate/cold-start.ts:1-9,271-309,311-389` 构建并返回 briefing，不启动 Main strict pipeline | 旧 Plugin test mode 的已接受语义继续保留，但不能冒充本次 Main strict test profile；不得在 Plugin 复制 Main strict 主链 |

## 4. Product Decisions And No-Gap Finding

本轮没有需要用户再次回答的 publication/reset/isolation 产品问题：

- **Publication**：测试只产生私有 sealed bundle、private serving validation 和报告；
  不准备/提交 public CAS，不修改 active route，不覆盖正式 Recipe。
- **Reset**：不对现有生产 root 调用 `fullReset`、exact reset、cleanup 或 rebuild；
  生产 root 和正式 public route 在运行前后必须 byte/hash 等价。
- **Isolation**：每次运行使用 demand/run-scoped private workspace；正式 data root 只读。
  私有 workspace 在 Controller/Test 复核前不得自动删除；之后的清理必须是显式、
  可审计的独立操作。
- **Dimension**：实际维度不能在设计时猜。`architecture` 只是候选默认推荐；
  只有真实 preflight 证明它 applicable 且有非空 eligible cells 时才可推荐。
  用户尚未确认具体维度不是产品设计缺口，而是运行时确认门。

因此本文件可以 ready for controller intake。

## 5. New Execution Profile Contract

### 5.1 Profile discrimination

后端入口必须使用显式、互斥的 profile discriminant：

- `strict-production`：完全保持现有生产语义；
- `strict-test-dimension`：本文件新增语义。

不得从 `ALEMBIC_TEST_MODE`、dimensions 数量、Dashboard route、Plugin `testMode`、
环境变量、开发构建或小 budget 推断 profile。

`strict-test-dimension` 必须有自己的 versioned request/receipt schema。生产 V1 request
继续 exact-key fail closed；不得通过放宽 exact-key parser 让未知字段进入生产链。

### 5.2 Required state sequence

最小状态机为：

`PREFLIGHT_REQUESTED`
→ `PREFLIGHT_FACTS_FROZEN`
→ `PREFLIGHT_UNIVERSE_VALIDATED`
→ `AWAITING_CONFIRMATION`
→ `SELECTION_CONFIRMED`
→ `PRIVATE_WORKSPACE_READY`
→ `PLAN_COMPILED`
→ `FACT_SCHEDULE_FROZEN`
→ `ANALYSIS_FIXPOINT_CLOSED`
→ `EXPRESSION_SETS_REVIEWED`
→ `PRIVATE_CORPUS_SEALED`
→ `PRIVATE_INDEXES_VERIFIED`
→ `PRIVATE_G4_READY`
→ `PRIVATE_SERVING_VALIDATED`
→ `STRICT_TEST_COMPLETED_PRIVATE`.

任何失败进入 terminal `STRICT_TEST_FAILED`，保存失败阶段、错误码、前置 receipt hashes、
已产生的私有证据引用和“不允许推断”的结论。失败不能自动转 production、legacy
bootstrap 或 Plugin briefing fallback。

### 5.3 Resume and drift

只允许对同一个 demand/run、同一个 preflight hash、同一个 confirmation hash、
同一组 config/model/runtime artifact hashes 和同一 private workspace owner 做幂等 resume。

以下任何漂移都使原 preflight/selection 失效，并要求重新 preflight：

- project/control/source root identity；
- source revision vector 或 source inventory；
- ProjectContext facts/content hash；
- 26 维 catalog/source artifact hash；
- applicability/exclusion universe；
- strict config、provider/model、prompt/SOP、fact-query、parser/backend、embedding/vector；
- loaded runtime artifact manifest/binding；
- selected dimension 或 eligible cell projection。

## 6. Full Read-Only Preflight Contract

### 6.1 Side-effect boundary

Preflight 必须在任何 cleanup、reset、DB write、Recipe write、candidate write、index build、
session replacement、public route lock/CAS 之前完成。它只可：

- 读取真实 source/project/control roots；
- 运行只读 ProjectContext/fact/source inventory；
- 加载并验证配置、模型符号和 runtime artifact manifest；
- 规范化、hash 并持久化到 demand/run-scoped evidence root。

对生产 data root 的写入、锁占用、session replacement 或 public route probe-side repair
均为失败。

### 6.2 Frozen receipt

`StrictTestPreflightReceiptV1` 至少包含：

- `demandKey`、`runId`、profile/schema/canonicalizer versions；
- project/control/source root symbolic identities 与 canonical project identity hash；
- source revision vector、source inventory hash、file/module/language/parser/backend counts；
- Certified Project Facts artifact/content/source vector/consumer receipt hashes；
- 完整 26 维 `DimensionCatalogSnapshot`、catalog hash、source artifact hash；
- 完整 module × dimension cell universe；
- 每个维度的 `applicable | excluded | unknown` 结果、理由、证据引用；
- full required-fact applicability universe、query/backend support、unsupported/unknown counts；
- applicable dimension 的 eligible/excluded cell counts；
- strict config/load receipt、provider/model/prompt/SOP/fact-query/parser/backend、
  embedding/vector 和 runtime artifact manifest/binding hashes；
- 当前 production root/public route/official Recipe 的只读 before-state hashes；
- 推荐维度、推荐理由和替代 applicable dimensions；
- receipt hash、生成时间、有效期策略和 drift invalidation fields。

### 6.3 Hard preflight gates

以下条件全部成立才可进入 `AWAITING_CONFIRMATION`：

- 目录精确包含已接受的 26 个 ID，无 duplicate/missing/extra；
- project identity、facts 和 source inventory 非空且彼此 lineage 一致；
- module/source universe 非空；
- 每个维度都被判为 `applicable` 或有证据支持的 `excluded`；
- `unknownDimensionCount=0`、`unknownApplicabilityCount=0`；
- required fact/query/backend 中没有 unknown 或 unsupported-blocked；
- 至少一个 applicable dimension 有非空 eligible cells；
- 所有 config/model/runtime artifact hashes 可加载、可复核且兼容；
- preflight 期间 production before-state 不变。

unknown、不适用但无理由、空维度、空 eligible cells、目录漂移、事实 lineage 缺失、
backend 不可用或 loaded artifact 不匹配均 fail closed。不得把空/未知维度静默删除后继续。

## 7. Exactly-One Dimension Selection

### 7.1 Recommendation

推荐器只可从 preflight 的 applicable dimensions 中选择。默认优先
`architecture`，但必须同时满足：

- `architecture` 在真实 BiliDili preflight 中为 `applicable`；
- 它有至少一个 eligible cell；
- required facts/query backends 对其全部可用；
- 没有比它更早暴露当前 blocker 的证据化理由。

若任一条件不成立，推荐器必须给出另一个 applicable dimension 及证据理由；
不能为了保留默认而把 unknown/excluded 改成 applicable。

### 7.2 Explicit confirmation

用户确认必须绑定：

- preflight receipt hash；
- selected dimension ID；
- full cell universe hash；
- selected eligible cell IDs/hash；
- config/model/runtime artifact hashes；
- private workspace policy；
- “仅私有 strict test，非 production finalized”声明。

确认必须恰好包含一个 dimension。零个、多个、已 excluded/unknown、eligible cells 为空、
或 receipt 已漂移时均拒绝。未确认时停在 `AWAITING_CONFIRMATION`，不得自动运行。

### 7.3 Slice conservation

切片只能缩小执行 cell：

- project/source roots、Certified Project Facts、source inventory 不变；
- 26 维 catalog 不变；
- module universe 不变；
- applicability/exclusion universe 不变；
- required fact/query/backend universe 与 hard-gate definitions 不变；
- selected execution cells 必须等于所选维度下的全部 eligible cells；
- 不再允许额外 moduleScope、文件子集或第二维度切片。

未选维度必须标为 `not-executed-by-strict-test-profile`，不能改写成 deferred、
excluded、applicable-empty 或 completed。production 仍要求完整 eligible cell
execution 和 `deferredCells=[]`。

## 8. Strict Test Execution Chain

### 8.1 Reused cognitive and deterministic chain

确认后必须运行最新 strict 能力，而不是 legacy bootstrap：

1. 用 frozen full facts/catalog/applicability 编译 strict Plan；
2. 冻结 full hard-gate universe，并派生 one-dimension execution-cell projection；
3. 为 selected cells 生成并执行 fact schedule；
4. Analyst 执行调查、聚类、归纳、反证和 fixpoint；
5. Producer 生成表达集合；
6. 与 Producer 独立的 reviewer 做 semantic/disposition review；
7. 通过 G1/G2/G3 类硬门并持久化 private content-ready corpus；
8. 建 refs、candidate、sparse/vector indexes 并 seal private bundle；
9. 通过 G4、final coverage binding 和 tool-neutral private serving validation；
10. 生成完整 audit report 并结束于 `STRICT_TEST_COMPLETED_PRIVATE`。

Plan/Analyst/Producer 继续是原合同定义的认知角色。deterministic facts/compiler/gates
提供边界和证据，不替代认知；Producer 不得自审。

### 8.2 Full-universe versus execution-projection receipts

报告必须同时保留两个分母：

- **full universe**：全部 modules × 26 dimensions 的 applicable/excluded/unknown/cell
  统计与 hashes；
- **executed projection**：所选维度全部 eligible cells 的 attempted/accepted/rejected/
  investigated-empty/failed 统计与 hashes。

selected cell 的每项 terminal disposition 必须 conservation 成立。未选维度不能进入
selected coverage numerator，也不能导致 full production coverage claim。

### 8.3 Independent review and evidence

每个 accepted expression 必须保持从 frozen fact/source refs 到 Plan question、
fact execution、Analyst induction/falsification、Producer expression、
independent review、private Recipe/ref/index 和 serving receipt 的 lineage。

prompt/SOP、LLM self-report、维度完成事件、条目数量、Dashboard 进度或单次搜索命中
都不能单独形成 pass。

## 9. Non-Destructive Private Isolation

### 9.1 Workspace

运行必须创建物理隔离的 demand/run-scoped private workspace，至少隔离：

- operation journal/checkpoints；
- facts/Plan/analysis/review evidence；
- private DB/corpus/Recipe/refs；
- candidate/sparse/vector index；
- serving snapshot/manifest；
- audit report。

该 workspace 初始必须物理 absent 或经空态证明；但这不是正式 root 的 production blank。
不得把生产 root bind-mount、symlink 或路径别名成 private root。

### 9.2 Forbidden production mutations

运行前后必须证明以下对象未变：

- 正式 data root、DB/WAL/SHM；
- 正式 Recipe/ref/coverage/index/session；
- public CAS bundle、active route、serving manifest；
- daemon production operation lock/journal；
- 正式 runtime config 与 artifact manifest。

不得调用 production `fullReset`、setup execute/recover/complete、public publication lock、
`PUBLIC_CAS_PREPARED` 或 `PUBLIC_CAS_COMMITTED`。

### 9.3 Private serving validation

必须复用 Core/Alembic 的 tool-neutral serving admission、final coverage、schema/ref/index
一致性和 G4 规则，但对象是 sealed private bundle。可以运行只读 private serving probes；
不得创建 `PublicKnowledgeRoute`、切换 active route 或让 Plugin 五公共 MCP 指向测试 bundle。

### 9.4 Audit report

报告至少包含：

- preflight、selection、confirmation 和 loaded-artifact hashes；
- full universe 与 selected projection；
- 每阶段开始/结束/失败、journal hashes 和 evidence refs；
- Analyst/Producer/review/falsification/conservation；
- private corpus/ref/index/G4/serving receipts；
- production before/after non-mutation proof；
- verdict：`STRICT_TEST_COMPLETED_PRIVATE | STRICT_TEST_FAILED | BLOCKED`；
- 明文 `productionFinalized=false`、`publicRouteChanged=false`；
- 未执行维度和禁止推断列表；
- 可复现的验证命令/入口和私有 artifact refs。

## 10. API And Dashboard Contract

### 10.1 Backend is authoritative

Dashboard 只能控制和显示 Alembic 真实后端 contract。UI local state、环境变量、
模拟阶段、静态目录或前端筛选不能构成 preflight、selection、run 或 pass receipt。

后端至少提供四类 versioned operation：

1. `preflight`：启动/读取只读 preflight；
2. `preview`：返回完整目录、适用/排除、推荐和 blocker；
3. `confirm`：提交一个 dimension 并生成 hash-bound confirmation receipt；
4. `run/status/report`：启动 private strict test、读取阶段证据/失败和最终报告。

具体 route 命名由实现决定，但必须与 legacy `/modules/bootstrap` 明确区分，或以显式
profile discriminant 扩展且保持 incompatible input fail closed。

### 10.2 UI flow

Dashboard 至少展示：

- project identity、source/facts inventory 和 26 维 catalog completeness；
- 每个维度的 applicable/excluded/unknown、理由、eligible cell 数和证据；
- config/model/runtime artifact hashes 与 drift 状态；
- 推荐维度及理由；
- 恰好一个维度的选择器；
- 非破坏、私有、非 production finalized 的明确确认；
- `AWAITING_CONFIRMATION` 门；
- 运行阶段、当前状态、阶段 receipt/evidence refs、失败原因；
- production before/after non-mutation；
- private final report 和不可推断项。

UI 在 unknown、空 applicable universe、hash drift 或后端缺失时禁用确认/运行。
它不能自动回退调用 `api.bootstrap()`。

## 11. Affected Windows And Producer/Consumer Order

本补充的最小 producer/consumer 顺序是：

`AlembicCore → AlembicAgent → Alembic → AlembicDashboard → controller acceptance → optional real Test execution`

同一 demand 内每仓仍只有一个 combined task package，由 Controller 在 intake 和用户确认后
决定是否/何时创建；本文件不创建 package。

| Window | Required delta / designIntent | Produces | Consumed by |
| --- | --- | --- | --- |
| AlembicCore | 定义 profile、preflight/selection/confirmation/report receipts、full-universe↔single-dimension projection conservation、private G4/serving admission；保持 production `deferredCells=[]` | 共享 versioned contracts、canonical hashes、validators、negative invariants | Agent、Alembic、Dashboard adapters |
| AlembicAgent | 让现有 strict Plan/Analyst/Producer/independent-review 能在 full frozen context 下执行 selected cells；不引入 briefing-only 替代路径 | Plan/analysis/expression/review receipts 与完整 lineage | Alembic orchestrator |
| Alembic | 唯一 Main 后端 owner：只读 preflight、确认门、private workspace、strict orchestration、private persistence/index/G4/serving/report、production non-mutation | 可调用的真实 backend contract 和 runtime evidence | Dashboard、Controller、Test |
| AlembicDashboard | 为真实 backend contract 提供 preview、推荐/选择、明确确认、阶段证据、失败和 report UI | 用户控制与可视化证据 | 用户、Controller |
| AlembicPlugin | **默认不受影响**。只有已证明公共 MCP/host contract 必须新增一个只读、不会暴露 private bundle 的兼容面时才纳入 | 条件性 host/public compatibility | Controller |
| Test | 产品实现和 Controller acceptance 后，按 §13 执行真实 BiliDili 私有 profile；不选环境、不选维度、不修产品 | 真实运行证据 | Controller |

Plugin 不得复制 Main strict Plan/analysis/persistence/index/serving 链。若 Alembic +
Dashboard 已提供完整控制面，Plugin 为 not applicable。

## 12. Acceptance Criteria

### 12.1 Contract and negative-route acceptance

- production V1 parser 仍 exact-key；原 strict-production checks 全绿；
- test profile 不能由 env、legacy dimensions、Plugin testMode 或 Dashboard legacy bootstrap 触发；
- production request 携带 test fields、test request 缺 preflight/confirmation、或 profile 混用均 fail closed；
- `architecture` 不适用、空 cells 或 backend unsupported 的 fixture 不得进入 run；
- 多维、零维、module subset 和漂移后的 confirmation 均拒绝。

### 12.2 Preflight acceptance

- 真实项目 identity、facts/source inventory 非空并有 immutable lineage；
- 26 维 catalog exact，applicable/excluded 全解释，unknown=0；
- required facts/query/backends supported-blocked=0；
- config/model/runtime artifacts 全部 load/hash 一致；
- production before-state 未变；
- preview 能显示 recommendation 和 blocker。

### 12.3 Execution acceptance

- confirmation 绑定同一个 preflight 且恰好一个 applicable dimension；
- selected cells 等于该维度的全部 eligible cells；
- full facts/catalog/applicability/hard-gate hashes 在切片前后不变；
- strict Plan→fact schedule→Analyst→Producer→independent review→private corpus/ref/index
  →G4→private serving validation 全链真实执行并有 receipts；
- selected cell terminal disposition conservation 成立；
- private resume 只接受同一组 hashes 和 owner。

### 12.4 Isolation and final acceptance

- private workspace 与 production root 无路径别名；
- production DB/Recipe/ref/index/session/public CAS/active route before/after hashes 等价；
- 无 production reset、publication lock 或 public CAS journal state；
- private report 可审计、可回放、明确 `productionFinalized=false`；
- Dashboard 展示真实 backend receipts、错误和 non-mutation proof；
- test pass 不改变原 full-production Test Environment Spec 或 production acceptance。

## 13. Test Decision

### 13.1 Decision

**Real Test required, but not dispatched now.**

分两层验证：

1. 各产品 window 和 Controller 先用 targeted/full checks、contract tests、negative routes、
   loaded artifact hashes 和 private fixtures 证明实现与调用链存在；
2. Controller 接受 Core→Agent→Alembic→Dashboard 全链后，才允许用真实 BiliDili
   运行本 profile。

真实运行必须先由用户通过 Dashboard/API 看到并确认同一 preflight 的一个维度。
在获得具体 preflight hash、selected dimension、confirmation receipt 和 private workspace
bindings 前，不创建 Test task/card/dispatch。Test 不得自己选择维度或环境。

### 13.2 Supplemental Test Environment Spec

本 profile 的 Test binding 增量为：

- source/project scope：原 SP-BILIDILI root + 已确认四个 Packages；
- production data root/public route：只读，before/after hash oracle；
- private data root：Controller 指定的 demand/run-scoped fresh path；
- profile：`strict-test-dimension`；
- preflight：Controller 验证并绑定的 receipt/hash；
- dimension：用户确认的恰好一个 applicable dimension；
- runtime artifacts：Controller 已接受、构建和 hash 的 Core→Agent→Alembic→Dashboard
  exact artifacts；
- provider/model/config：原生产合同的 exact loaded hashes，凭据只传位置符号；
- allowed writes：仅 private workspace；
- forbidden writes：生产 root、public CAS/route、正式 Recipe/ref/index/session；
- completion：private report + non-mutation proof；
- stop：unknown/drift、缺 hash、非空 private root、路径别名、任何生产写入、任何 public
  publication 尝试。

本补充 Test 成功后，原 Requirement Design §20 和原 Test Environment Spec 的完整
MR→SP、pristine→rebuild、全维 production、public CAS、五工具矩阵仍然 required and
paused，直到其自己的用户启动门满足。strict-test pass 不能替代原 Test。

## 14. Non-Goals And Forbidden Conclusions

- 不实现产品、不建 dispatch、不建 Test card、不改 state root/task package。
- 不创建第二 demand 或重复 claim 原 demand。
- 不修改 production `deferredCells=[]`、完整 26 维执行、exact reset/public CAS 合同。
- 不把 test profile 变成 production budget/scope shortcut。
- 不复用 `ALEMBIC_TEST_MODE`、普通 async/bootstrap filter 或 Plugin briefing-only testMode
  作为 strict-test 实现或证据。
- 不允许 moduleScope、文件子集、第二维度或动态 Top-N 缩小执行。
- 不 fullReset、cleanup、rebuild 或覆盖生产 root。
- 不修改 public CAS、active route、正式 Recipe/ref/index/session。
- 不把 private bundle 暴露给正式五公共 MCP。
- 不让 Dashboard 模拟后端完成态。
- 不把选中维度通过称作其余 25 维、完整 BiliDili 或 production finalized。
- 不把未选维度改记为 excluded、deferred、empty 或 completed。
- 不因 test profile 失败自动回退 legacy 路径。

## 15. User-Confirmation Ledger Delta

| Decision | Confirmed result |
| --- | --- |
| 阶段性目标 | **用户本轮已确认阶段性前置验证 + 单维度后续**：真实 BiliDili 全量 strict 冷启动前，先完成全量只读 preflight，再明确确认一个 applicable dimension 继续 |
| Preflight | 冻结项目身份、ProjectContext/facts/source inventory、完整 26 维目录、适用/排除 universe、配置/模型/runtime artifact hashes；unknown/不适用无理由/空维度 fail closed |
| Selection | 恰好一个 applicable dimension；`architecture` 仅在真实 preflight 证明适用且 cells 非空时默认推荐；选择需显式确认 |
| Slice | 只缩小 execution cells，不缩小 facts/source/catalog/applicability/hard-gate universe；不允许 module subset |
| Execution | 复用最新 strict Plan→fact schedule→Analyst→Producer→独立 review→private persistence/ref/index→G4→private serving validation |
| Isolation/reset | demand/run-scoped private workspace；不 fullReset/cleanup/rebuild 正式 root；正式 objects before/after 不变 |
| Publication | private report/serving validation only；不 public CAS/active route/正式 Recipe；成功不是 production finalized |
| UI/API | 需要真实 backend preflight preview、推荐/选择、明确确认、状态/阶段证据/失败/report；Dashboard 只控制与展示 |
| Window order | Core→Agent→Alembic→Dashboard；Plugin 仅公共 host/MCP contract 真变化时条件纳入；之后 Controller acceptance，再按门禁决定 Test |
| Production compatibility | 原 production 继续 full 26 dimensions、all eligible cells、`deferredCells=[]`、exact reset/CAS；test profile 不构成捷径 |
| Test | 真实 BiliDili private profile 仍需 Test，但产品/Controller acceptance、exact artifacts、真实 preflight 和用户具体选维确认前不建 card/dispatch；原 full production Test 仍独立 required/paused |

Open product questions: **none**.

运行时尚待产生的 preflight result、推荐结果和具体 selected dimension 是执行输入，
不是未决产品设计。它们缺失时正确状态是 `AWAITING_CONFIRMATION`，不是猜测。

## 16. Controller Intake / Design Handoff

### Facts

- 现有 Main strict contract 没有 test profile 或 dimension slice，并固定 public finalization。
- 现有普通 env test filter 位于 legacy full-reset cold-start，不是 strict 链。
- 现有 Plugin testMode 是 no-cleanup scoped Mission Briefing，不执行 Main strict 主链。
- 现有 Dashboard bootstrap body/adapter/UI 不支持 preflight、selection 或 strict evidence。
- 原 production contract 要求完整 26 维、all eligible cells、`deferredCells=[]` 和 exact
  reset/CAS。

### User decisions

- 用户已确认全量 preflight 后再确认一个 applicable dimension 继续。
- 用户已确认测试运行非破坏、隔离、私有且不得冒充 production finalized。
- 用户已确认 Core→Agent→Alembic→Dashboard 的建议顺序与 Plugin 条件边界。

### Design recommendation

- 把本能力实现为显式 `strict-test-dimension` profile，复用共享 strict contracts/gates，
  但以独立 private terminal state 收尾。
- Controller intake 时把本 supplement 合并进现有 demand/state root，不新建 demand。
- 先重新检查当前已接受 artifacts 与本 delta 的真实代码差距，再形成每仓一个 combined
  package；同仓不得并行。

### Controller must not infer

- 本文中的 contract/type/state 名称不是现有实现。
- `architecture` 不是预先选定的维度。
- 本 supplement delivery 不是 implementation、dispatch 或 Test authorization。
- Plugin 默认不在 affected windows；只有真实公共 contract change 才能纳入。
- private strict-test 通过不是 production acceptance。

### Ready-for-controller-intake checklist

- [x] Parent demand 与三份原始合同已复读并保持兼容
- [x] 当前源码事实已独立复读并引用
- [x] 增量目标、非目标、状态机和完成定义明确
- [x] publication/reset/isolation 已确认，无待问产品问题
- [x] affected windows、producer/consumer 顺序和 per-window designIntent 明确
- [x] Test decision 与 supplemental environment bindings 明确
- [x] append-only delivery 限制为一次 supplement，dependency 指向现有 demand
- [x] 不创建 controller dispatch

## 17. Primary Source Map

- `Alembic/lib/recipe-pipeline/RecipePipelineFacade.ts`
- `Alembic/lib/recipe-pipeline/generate/strict/StrictProductionContracts.ts`
- `Alembic/lib/recipe-pipeline/generate/strict/StrictColdStartOrchestrator.ts`
- `Alembic/lib/recipe-pipeline/generate/strict/StrictProductionJournal.ts`
- `Alembic/lib/recipe-pipeline/generate/ColdStartWorkflow.ts`
- `Alembic/lib/http/routes/modules.ts`
- `Alembic/lib/shared/schemas/http-requests.ts`
- `AlembicCore/src/shared/testMode.ts`
- `AlembicCore/src/service/plan/intent/coldStartProductionPlan.ts`
- `AlembicCore/src/domain/dimension/DimensionRegistry.ts`
- `AlembicDashboard/src/api/modules.ts`
- `AlembicDashboard/src/App.tsx`
- `AlembicPlugin/lib/host-runtime/mcp/tools.ts`
- `AlembicPlugin/lib/recipe-pipeline/plan/plan-generation-gate.ts`
- `AlembicPlugin/lib/recipe-pipeline/generate/cold-start.ts`
