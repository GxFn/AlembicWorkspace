# Alembic 五个知识工具深度审计与修复 Original Plan

Design Key: alembic-five-knowledge-tools-deep-audit-2026-07-11
Date: 2026-07-11
Status: delivered-controller-claimable
Owner Window: Design
Receiving Window: Wakeflow

## User Goal

基于 Alembic 空间与五个相关源码仓库的**最新代码**，新建一个独立需求，深入检查以下五个知识获取/使用入口，找出仍会造成错误结论、知识错配、证据缺失、跨仓遗漏或守门假通过的问题，并设计可真实落地、可验证的修复方案：

- `alembic_search`
- `alembic_recipe_map`
- `alembic_prime`
- `alembic_code_guard`
- `alembic_graph`

本轮只允许 Design 当前窗口做真实代码挖掘和需求设计；不派发、不创建执行任务包、不改产品仓、不运行真实项目测试。

2026-07-11 follow-up: 用户进一步要求不要把全部问题当作同一类补丁处理；需要区分架构性根因、架构与局部结合的修复、纯针对性缺陷，并形成一套统一但不空泛的整体落地方案。

2026-07-11 test follow-up: 用户指定 workspace 内 `BiliDili/` 为真实知识库项目，并进一步确认验收必须同时覆盖 **AlembicWorkspace 五产品仓多仓模式** 与 **BiliDili 独立项目模式**。若实现后的 MCP 需要刷新/重启才能加载，允许在刷新后为每种模式新开临时 Codex 窗口，以新进程 readback 作为验收证据。

2026-07-11 implementation-guidance follow-up: 用户要求继续基于真实代码把需求完善到可执行深度：每个阶段必须有真实文件/函数修改点、生产者/消费者顺序、测试命令、失败路由和二进制验收标准；39 个问题必须全部映射到明确实施切片，不能只停留在架构原则或问题描述。

2026-07-11 delivery authorization: 用户明确要求把本需求提交到总控可领取状态并自动化推进。Design 已通过 `wakeflow_deliver` 正式交付，属性为 `pending-claim`、`Auto Claim=yes`、P0；此前 no-dispatch 约束只约束需求设计阶段，不再阻止总控 intake。

## Background

- Trigger: 用户提供了三张来自“最近但非最新代码”的问题截图，要求先与最新源码对账，不能把历史症状直接当成当前事实。
- Workspace boundary: 当前窗口是 Design 需求窗口，不是 controller，也不是任何产品实现窗口。
- Wakeflow boundary: 当前没有为本需求创建 state root；`.wakeflow-active/index.md` 与 `workspace-current-status.md` 仍引用一个已由用户手动删除的旧需求目录，属于陈旧投影，不是本需求的执行授权。
- Alembic evidence boundary: 当前宿主项目与 Alembic 选中/活动项目不一致。依照 Alembic skill 的项目交接门，本轮没有调用 prime/search/graph/recipe_map/guard 来制造“现场证据”，只读最新源码、测试、README、package、公开入口和已加载运行产物元数据。
- Test environment decision: `AlembicWorkspace/` 与 `BiliDili/` 都是用户确认的后续验收根；文档只记录 workspace-relative coordinates，不固化用户本机绝对路径。
- Current multi-repo observation: AlembicWorkspace 自身有 96 条知识（91 active、5 deprecated），但当前 host=AlembicWorkspace、selected/active=BiliDili，且单一 knowledge checkpoint 只属于 `Alembic` 仓，不能代表五仓 revision vector。
- Current standalone observation: BiliDili 有 75 条知识（68 active、7 staging），源码 HEAD 比 knowledge checkpoint 前进 4 个 commit、涉及 66 个文件；这适合作为 stale negative snapshot，不能直接作为 aligned positive acceptance。
- Screenshot 1 historical signal: Package 归属识别错误、Plugin 内部 schema 错误、Guard 仍能按显式文件运行。
- Screenshot 2 historical signal: ProjectContext 已刷新，但跨仓图在大量 Core 文件上解析失败，只能导航，不能证明调用关系。
- Screenshot 3 historical signal: 宿主 `AlembicWorkspace` 与活动项目 `BiliDili` 不一致，因此拒绝把 96 条知识当作当前项目事实。

## Source Baseline

| Repository | Audited HEAD | Current Role In Five-Tool Chain |
| --- | --- | --- |
| `AlembicPlugin` | `4146ac4db07c` | 五个公开 MCP 工具的 schema、catalog、routing、output 和大部分适配逻辑所有者。 |
| `AlembicCore` | `6b60bcd159e9` | SearchEngine、ProjectContext、RecipeContext、GuardCheckEngine、共享 DTO/transport 的确定性能力所有者。 |
| `Alembic` | `8a9592238b7f` | daemon/runtime 与 resident `/api/v1/search` provider；不是 Codex MCP 五工具所有者。 |
| `AlembicAgent` | `8aa184b88cbe` | 共享 SearchEngine 的内部 Agent 消费者；另有有意分叉的 in-process `knowledge.search/prime`。 |
| `AlembicDashboard` | `f26427682f45` | HTTP/UI 消费者；其 Knowledge Graph 是后端知识图，不是 Codex `alembic_graph` 公共工具。 |
| `BiliDili` (Test fixture, not product owner) | `e25b2908a8b5` + four recorded submodule commits | 用户确认的独立真实知识项目；只提供后续隔离 Test source/data，不承担 Alembic 产品修复。 |

已加载插件的 `.alembic-dev-refresh.json` 记录 `gitHead=7f893a4`，并直接指向 `AlembicPlugin/dist/bin/host-mcp.js`。该 dist 生成时间晚于 `7f893a4`，文件哈希与 refresh 记录一致；当前源码 HEAD 只比它多一个格式化提交 `4146ac4`，没有发现语义差异。结论是“当前已加载 dist 很可能包含本轮语义修复”，但缺少把构建产物与源码 commit 强绑定的机器可验证 provenance。

## Scope Candidate

| Area | In Scope | Out Of Scope | Notes |
| --- | --- | --- | --- |
| Public tool truthfulness | 五工具输入 schema、执行路由、状态、诊断、证据、公开输出。 | 新增无关工具或扩大 Alembic 产品能力。 | `ready` / `passed` 必须能由实际覆盖证据支持。 |
| Retrieval correctness | keyword/semantic 合流、排序、freshness、Prime 信任分层。 | 重做整个向量系统或更换 embedding provider。 | 修复确定性错序、漏检和错误信任。 |
| ProjectContext coverage | 五仓 ProjectScope、repo/package/target id、解析错误与截断。 | 把自动图当源码调用关系真相。 | 图仍是导航/线索工具，源码验证是最终证据。 |
| Recipe mounting | focus/radius、完整分页、mount/rollup、renamed refs、预算。 | 返回完整 Recipe 正文。 | map 继续是结构挂载，不变成 semantic search。 |
| Guard correctness | 文件覆盖、读取失败、轮次、跨文件检查、公开 verdict、Prime feedback。 | 把 Guard 当完整编译/测试替代品。 | 不允许“没检查到”被投影成通过。 |
| Cross-repo ownership | Plugin/Core/Alembic/Agent/Dashboard 的真实生产者/消费者和回归面。 | 为了形式覆盖五仓而给无消费者仓库造修改。 | Dashboard 默认 no-task，Agent 默认 regression-only。 |
| Integrity architecture | 完整性、结论强度、ProjectScope 身份、信任证据和工具副作用的共享叶子契约与纯判定规则。 | 新建统一大信封、万能 service 或无消费者抽象层。 | 每个架构机制必须与真实工具消费者在同一阶段落地。 |
| Targeted repair | 单 handler 的路径校验、分页循环、字段传递、状态派生、旧文案和硬编码启发式。 | 用局部补丁掩盖跨工具重复根因。 | 局部修复需绑定二进制验收用例。 |
| Validation | 产品单测/契约测试；AlembicWorkspace 多仓真实源码模式；BiliDili 真实知识项目模式；跨项目隔离；MCP fresh-process readback。 | 本轮执行构建、测试、刷新 MCP、开启临时窗口、部署或真实数据写入。 | Test 环境已由用户确认，但只在后续 controller/Test 流程运行。 |

## Completion Definition Candidate

Wakeflow 以后只能在以下条件全部满足后接受本需求：

1. 五个工具不会在请求文件缺失、不可读、仓库被截断、知识过期或证据不足时返回误导性的 `ready` / `passed` / `trusted-to-obey`。
2. `alembic_search` 在 auto 双通道中先完成可解释的跨通道合流和全局排序，再执行 limit；get/expand 与 search 使用一致 freshness 姿态。
3. `alembic_recipe_map` 的 focus/radius/detailLevel 要么真实生效，要么从公开 schema 删除；Recipe 列表完整分页；rollup 基于完整候选集计算，截断只影响展示；renamed/unknown source ref 不被默认为 active。
4. `alembic_graph` 覆盖所有配置 source folders，或明确返回被省略仓库与截断原因；节点 id 带 repo scope；错误状态、freshness 和预算字段与实际行为一致。
5. `alembic_prime` 对 Guard rule 使用与普通知识同等级的相关性和源证据门，不把弱匹配/无锚规则提升为 `trusted-to-obey`；region hit 保留真实 kind/source 语义。
6. `alembic_code_guard` 对每个请求文件给出 checked/missing/unreadable/out-of-root 结论；轮次上限只能阻塞或返回 incomplete，不能 force-pass；公共输出保留 verdict、覆盖、文件错误、跨文件违规和不确定性。
7. 主仓旧 MCP schema 影子得到 import/consumer 证明后删除或明确降级为非运行时资产；运行产物能报告对应源码 commit。
8. Plugin/Core/Alembic/Agent 的相关产品检查通过；Dashboard 只有在真实 UI/API 契约改变时才参与。
9. 后续真实 Test 同时完成两种模式：AlembicWorkspace 五产品仓多仓模式，以及 BiliDili 独立真实知识项目模式；两种模式都要运行五工具的适用正/负路径，不能用其中一个替代另一个。
10. 没有以文档、mock、空 adapter、单一 happy path、旧截图复述或“图看起来合理”替代真实代码与运行证据。
11. 跨工具重复问题由共享完整性机制封口：collection coverage 与 projection limit 分离、结论强度不超过证据完整度、ProjectContext identity 复用 Core 现有 ref scope、Search→Prime→Guard 使用同一证据信任语义。
12. 每个问题都有明确 repair mode（architecture / hybrid / targeted / preserve-no-change）、真实 owner、首个消费入口、依赖顺序和可判定验收，不接受“建层后以后再接工具”。
13. 每种正向模式都有独立 `SourceRevisionManifest`：逐 repo commit/dirty state、knowledge snapshot/checkpoint、Plugin/Core build commit 和 entry hash 全部一致；单一 repo commit 或 `freshness=current` 文案不能替代 revision-vector 对账。
14. 任何 MCP refresh/reinstall 后，分别在以 AlembicWorkspace 和 BiliDili 为 cwd 的新临时 Codex 窗口中运行首个 status/provenance readback；旧窗口或无法证明加载新 dist 的结果不进入验收。
15. BiliDili 真实源码和用户知识库保持不变；真实语义验证使用只读快照，Guard 写入、205+ pagination、renamed/unresolved、不可读文件和并发边界只在 demand-owned 隔离副本/overlay 中执行。
16. P0-P4 每阶段都有可重复命令和二进制 exit gate；39 个问题全部可从 problem id 追溯到 repository、file/symbol、代码动作、fixture 与验收证据。
17. `AlembicPlugin` 后续仍为一个 combined repository package，内部按实施切片串行推进；切片不是并行任务，也不能绕过 controller 的阶段确认。

## Non-Goals

- 不修改 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 源码。
- 不在本轮创建 state root、task package、dispatch packet 或 Test card。
- 不调用 `wakeflow_deliver`，不向 controller 或产品窗口发送任务。
- 不运行构建、测试、daemon、rescan、bootstrap、部署或知识库写入。
- 不在本轮刷新/重装 MCP、重启 Codex 或新开临时测试窗口；用户授权的是未来 Test 方法，不是当前 Design 执行授权。
- 不把宿主/活动项目 mismatch 当成五工具实现 bug；它是本轮正确的安全停止条件。
- 不修改 BiliDili 产品源码，不对用户当前 BiliDili/AlembicWorkspace 知识库执行 destructive bootstrap、测试写入或污染性 fixture 注入。
- 不把 Dashboard Knowledge Graph 与 Codex `alembic_graph` 合并。
- 不统一或删除 Agent 内部 `knowledge.prime`；只有共享 Core 行为改变时做消费者回归。
- 不扩大到登录、后台、持久化、实时同步、UI 改版或其它产品能力。

## Known Evidence

### User Evidence

- 三张截图证明历史代码曾出现 package 归属错、图解析失败、Plugin schema 异常和项目交接 mismatch。
- 用户明确指出截图不是最新代码，并要求更深入检查，禁止沿用历史结论。
- 用户明确指定 BiliDili 为可用于测试验收的真实知识库项目。
- 用户明确要求 AlembicWorkspace 多仓模式和 BiliDili 独立模式都进入验收，并允许 MCP 刷新后通过新临时 Codex 窗口验证新进程。

### Current Code Evidence

- Swift/ObjC/Kotlin file-flow 与 Package.swift/SPM package 归属已在 2026-07-10/11 的 Core/Plugin 提交中修复。
- Plugin graph 仍固定 `folders.slice(0, 4)`，无法完整覆盖五仓空间。
- Guard review 过滤不存在文件；全部被过滤后返回 passed；读取异常也按 0 violations 计 passed；第 6 轮 force-pass。
- Recipe map 在 `recipeMountLimit` 截断后计算 rollup，且只 list 前 200 Recipes；公共 catalog 标 `readOnlyHint=true`，大结果却写/删 `.asd/tmp` 单例文件。
- Search auto 先放 keyword items、后放 semantic items，Map 去重不排序，再在候选再排序前切 limit。
- Prime Guard rule 绕过普通知识的 0.45 信任地板与源锚证据门，直接进入 `trusted-to-obey`。
- Alembic 主仓仍有一份只被测试导入的旧 `TOOL_SCHEMAS`，其中 graph/guard contract 与 Plugin 当前公共工具不同。

### Confirmed Test-Environment Evidence

- AlembicWorkspace registered knowledge snapshot: 96 total / 91 active / 5 deprecated；当前 host 与 selected/active project mismatch，现状结果只能用于 fail-closed 负例。
- AlembicWorkspace 的五产品仓 HEAD 已分别记录；现有 knowledge checkpoint 只在 `Alembic` 仓可解析，证明多仓 positive lane 需要逐仓 revision manifest，而不是单 commit。
- BiliDili source baseline 是 clean Swift 6/SPM 工程，主仓加 4 个真实 Git submodules；根 `Package.swift` 与 AOXPlayer submodule 都有 `AOXPlayerTests` target，可作为真实重复 target-name identity fixture。
- BiliDili registered knowledge snapshot: 75 total / 68 active / 7 staging；当前 checkpoint 是源码 HEAD 的祖先且落后 4 commits，适合作为 stale/freshness 负例。
- 两个项目当前都走 supported pure-local route；active resident runtime 不作为 Test 必需前提。若未来实现保留 resident route，其兼容性由 Alembic 产品测试单独证明。

### Test Evidence

- 现有测试覆盖了 Swift parser、ProjectContext 基本 queryKind、map 确定性、search 双通道 union、Prime region evidence、Guard 公共投影和 Core `auditFiles`。
- 没有找到覆盖以下失败模式的测试：5+ repos、mount 截断后的 rollup、Guard 不存在/不可读文件、round-cap 非通过、公共 Guard 跨文件检查、graph freshness/no-op inputs、search 高分 semantic 被前置 keyword limit 淘汰。

### Missing Runtime Evidence

- AlembicWorkspace 五仓逐 repo revision 对齐、host/selected/active 对齐后的五工具原始 MCP JSON。
- BiliDili stale negative、aligned real-knowledge positive 与 205+ isolated boundary-extension 三组结果。
- 两种模式各自 fresh Codex process 的 Plugin/Core commit、entry hash 与首个 status readback。
- 大/small/concurrent map 的 continuation 稳定性和 read-only filesystem diff。
- Guard 真实文件权限失败、跨文件违规、round-cap 与 public coverage/verdict 输出。
- 双向 project mismatch 下零知识/零 source-ref 泄漏证据。

## User-Confirmation Ledger

| Decision | Status | Evidence / Boundary |
| --- | --- | --- |
| 新建独立需求 | confirmed | 用户本轮直接命令。 |
| 审计五个指定工具 | confirmed | 用户明确列出五个工具。 |
| 必须使用最新源码对账旧截图 | confirmed | 用户明确说明截图来自最近但非最新代码。 |
| 覆盖 Alembic 空间与五仓关系 | confirmed | 用户要求深挖空间和五个相关子仓库。 |
| 只在当前 Design 窗口做真实代码挖掘 | confirmed | 用户明确禁止派发。 |
| 本轮不实现、不测试、不部署 | confirmed by scope | 当前窗口职责和用户 no-dispatch 指令共同限定。 |
| 区分架构修复与针对性修复并统一整体方案 | confirmed | 用户 2026-07-11 明确要求更新进需求。 |
| 使用 AlembicWorkspace 多仓模式验收 | confirmed | 用户 2026-07-11 明确要求纳入测试验收。 |
| 使用 BiliDili 独立真实知识项目验收 | confirmed | 用户提供 workspace 内项目坐标并明确授权作为测试项目。 |
| MCP 更新后用新临时 Codex 窗口取证 | confirmed | 用户明确允许；每种项目模式使用独立 fresh process，当前不执行。 |
| Test 数据保护：真实项目/知识库只读，边界写入走隔离副本 | confirmed by requirement boundary | 延续 no-product-write 与真实项目保护规则。 |
| 后续 controller intake / phase promotion | pending future confirmation | 不属于本轮 Design 写文档授权。 |

## Confirmation Status

- User confirmation status: audit/design scope and dual-mode Test Environment confirmed; execution/controller intake remains unconfirmed.
- Design research status: complete; architecture/targeted classification and unified landing design incorporated.
- State root: not created by design and not authorized in this turn.
- Dispatch status: prohibited by the current user request.
