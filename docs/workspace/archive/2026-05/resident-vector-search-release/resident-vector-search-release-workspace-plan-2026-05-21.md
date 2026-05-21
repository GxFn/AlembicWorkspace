# Resident Vector Search Release Workspace Plan

状态：已完成（VEC-6 cache 已刷新，workspace 文档已提交）
总控窗口：AlembicWorkspace
创建日期：2026-05-21
适用范围：`AlembicPlugin`、`Alembic`、`AlembicCore`、`AlembicTest`、`AlembicAgent`、`BiliDili`

## 用户目标

删除 `AlembicPlugin` 中会让人误以为 embedding 可执行的占位逻辑，并把 `AlembicPlugin` 与本地 `Alembic` resident service 连接起来，让 Codex prime / search 在 Alembic 存在时消费 Alembic 已经生成的真实向量索引和本地千问 embedding 能力。

目标不是把 Codex-facing `prime` 交给 Alembic 执行，也不是让 Plugin 自己补一套向量 provider。`AlembicPlugin` 仍拥有 Codex tool envelope、prime knowledge material、receipt shout、fallback 和错误语义；`Alembic` 作为常驻本地服务按需提供 semantic / hybrid search 增强。

如果 Alembic resident service 不存在，向量搜索不可用是符合设计的自然结果，不应被包装成 Plugin 内部向量失败。此时 Plugin 应继续使用自身 embedded runtime 里可用的 baseline keyword / FieldWeighted / knowledge search，并在 metadata 中标明 `residentVector.available=false` 或等价原因。这里的 embedded search 只表示 Plugin 自带的词法 / 结构化知识检索，不包含 embedding provider、query vector 生成或 HNSW semantic search。

## 真实代码与运行证据

- `AlembicPlugin/lib/codex/HostAiAdapter.ts` 的 `unavailableProviderMethods()` 会给 host-managed provider 塞入会抛错的 `embed()` 占位方法，错误文案为 `AI execution is provided by the host agent and is not bundled in AlembicPlugin.`。
- `AlembicPlugin/lib/codex/HostAiAdapter.ts` 的 `normalizeHostProvider()` 用 `typeof provided.embed === 'function'` 推断 `__hostEmbedExecutable`，导致占位 `embed()` 被误判为 embedding 可执行。
- `AlembicPlugin/lib/injection/modules/VectorModule.ts` 会把 `ct.singletons._embedProvider || aiProvider` 注入 `VectorService`；因此 Plugin 日志可能显示 `embedAvailable=true`，但实际调用占位 `embed()` 后降级为 sparse-only。
- `AlembicCore/src/service/vector/VectorService.ts` 在 `hybridSearch()` 中捕获 embed 失败后记录 `embed failed, degrading to sparse-only`，并继续用 sparse 结果融合。
- BiliDili Ghost workspace 已有真实 HNSW 向量索引：`vector_index.asvec`，118 条向量，1024 维。
- 本地 Ollama 已安装 `qwen3-embedding:0.6b`，手动生成 query embedding 后直查 HNSW，6ms 返回真实 Recipe 命中，包括 `VideoURLPreloader`、`lazy var UI`、`AsyncRxBridge` 等。
- `Alembic` resident service 的 `/api/v1/search?mode=semantic` 已能返回同一批语义命中；这证明 Alembic 侧真实向量能力存在。
- 最近 Plugin-owned prime/search 日志仍有 `hasVector=false` 和 `embed failed, degrading to sparse-only`；当前问题是 Plugin 路径没有真实 embedding executor，不是 BiliDili 没向量。
- Test-2026-05-21-06 已证明 VEC-4R bridge removal 生效：direct `alembic_search(auto)` / `alembic_search(semantic)` 均 `success=true`，payload 和 stderr 不再出现 `/api/v1/mcp/call` 或 `daemon-mcp-compat-bridge`，`serviceBoundary.executionPath=plugin-owned-codex-facing`；AlembicTest commit `e6aae4b4fb146213abd7fa2bfae7335f3c47c0ba`。
- Test-2026-05-21-06 仍失败：daemon `/api/v1/search` 裸探测 HTTP 200 且有 6 条命中，但 `searchMetaKeys=[]`；direct semantic 的 resident inner `searchMeta={}`，缺少 `semanticUsed` / `vectorUsed`，无法证明真实 vector route 被使用。
- Test-2026-05-22-01 已证明 VEC-5R 闭环通过：direct `alembic_search(auto)` `success=true`，metadata 同时保留 `codexRequestedMode=auto` 与 `residentRequestMode=semantic`，actual mode 为 `semantic`，`semanticUsed=true`、`vectorUsed=true`、`residentVector.available=true`。
- Test-2026-05-22-01 同时证明 daemon `/api/v1/search` 运行态已返回 `searchMeta`，负向扫描未发现 `/api/v1/mcp/call` 或 `daemon-mcp-compat-bridge` 回归，prime delivered 与 Codex 可见知识摘要保持，BiliDili 前后干净；AlembicTest commit `0943ce085a1cb9c84141cc6c85673418c8248e29`。
- 代码证据显示 `AlembicPlugin/lib/service/search/ResidentSearchClient.ts:89` 使用 `request.mode || 'auto'`，并在同文件后续把该值原样传入 `/api/v1/search` 的 `mode` query；`AlembicPlugin/lib/external/mcp/handlers/search.ts:213` 到 `AlembicPlugin/lib/external/mcp/handlers/search.ts:219` 会把 direct search 的 `auto` mode 原样交给 resident client。
- 代码证据显示 `Alembic/lib/shared/schemas/http-requests.ts:164` 的 `SearchQuery.mode` 只允许 `keyword`、`bm25`、`semantic`；这解释了 Test-06 中 direct `alembic_search(auto)` 的 resident request 返回 `Query parameter validation failed`。
- 代码证据显示 `Alembic/lib/http/routes/search.ts:116` 会在 `/api/v1/search` 调用 `buildResidentSearchMeta()`，`Alembic/lib/http/routes/search.ts:223` 到 `Alembic/lib/http/routes/search.ts:267` 构造 `route/service/semanticUsed/vectorUsed/residentVector/fallbackReason/workspace`；Test-06 报告记录 running daemon `startedAt=2026-05-21T07:46:15.220Z` 早于 VEC-4R dist 文件 mtime，因此当前 `searchMeta` 缺失优先按运行中 daemon 未加载最新 dist / 运行态刷新问题处理，若刷新后仍缺失再回到 Alembic 代码修复。

## 完整功能闭环

输入：

- 用户在 Codex 窗口对 BiliDili 发起自然语言任务。
- Codex 调用 `alembic_task(operation="prime")` 或 `alembic_search`。
- 本地 Alembic daemon 已启动，BiliDili workspace 有 Recipes 与 HNSW 向量索引。

处理：

- Plugin 解析意图并保持 Codex-facing tool ownership。
- Plugin 判断 Alembic resident service 是否可用且具备 search / semantic search 能力。
- Alembic resident service 可用时，Plugin 对需要语义召回的查询请求 Alembic，由 Alembic 执行真实 semantic / hybrid search。
- Alembic resident service 不可用时，Plugin 不尝试本地向量，不调用 host-managed placeholder `embed()`，只走 Plugin embedded baseline search。
- Alembic resident service 读取 workspace settings 中的 `embedProvider=ollama`、`embedModel=qwen3-embedding:0.6b`，执行真实 query embedding 与 SearchEngine / VectorService / HNSW 检索。
- Plugin 将 Alembic 返回的搜索结果作为 resident vector / hybrid enhancement 纳入 `primeKnowledgeMaterial`；若同时保留 Plugin embedded baseline 结果，融合只发生在 Plugin 的 prime material assembly 层，不能把 Plugin baseline 结果伪装成 vector 命中。

输出：

- Codex 可见的 prime receipt shout 仍由 Plugin 生成。
- `primeKnowledgeMaterial.searchMeta` 或等价诊断中能看出 resident search route、actual mode、是否使用 semantic/vector、降级原因和耗时。
- 开发者能区分：真实向量可用、Alembic 未安装 / daemon 不可用所以无向量增强、Plugin embedded baseline search、Alembic semantic search 降级、以及高置信关键词跳过 semantic。

完成定义：

- Plugin 不再把不可执行的占位 `embed()` 标记为可执行。
- Plugin 在 Alembic resident service 可用时请求 Alembic 获取真实 semantic/vector search 结果。
- local daemon ready 时，BiliDili prime/search 可证明至少一条 semantic query 由 resident service 返回 `mode=semantic` 或等价 vector-used 诊断。
- local daemon down / Alembic 未安装时，Plugin 不报告“向量失败”，而是报告 resident vector enhancement unavailable，并继续 embedded baseline search。
- resident semantic search 请求失败时，Plugin 明确降级到 embedded baseline sparse / FieldWeighted，并在 payload / 日志中给出原因。
- AlembicTest 在 BiliDili 真实项目验证：BiliDili 不被修改，prime delivered，知识注入成功，searchMeta 能证明 resident vector route 被尝试并成功或有明确降级。

## 非目标

- 不把 `alembic_task prime` 整个转发给 Alembic daemon。
- 不恢复 AlembicPlugin 内置 AI execution。
- 不把 Ollama / 千问 provider 复制进 AlembicPlugin。
- 不改 BiliDili 产品源码。
- 不要求 Codex 自己产 embedding。
- 不把 Dashboard UI 改造列入本轮发布。

## 发布阶段

| 阶段 | 状态 | 主窗口 | 目标 | 关键产物 | 验收重点 |
| --- | --- | --- | --- | --- | --- |
| VEC-0 | 已完成 | AlembicWorkspace | 锁定发布目标、证据、边界和阶段顺序。 | 本计划。 | 用户已确认，可以派发 VEC-1。 |
| VEC-1 | 已完成 | AlembicCore / Alembic | 固化 resident search 可观测 contract：至少暴露 search route、requested mode、actual mode、semantic/vector 是否使用、降级原因、耗时和 workspace identity。 | Core contract `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`；Alembic resident telemetry `d6526aa0541dc8ce54e10d4efe97366b7646e7bf` + 返工 `2cfd935b83241ee72263e18528c9647ded65dec7`。 | 旧客户端仍可读 `items`；Alembic 已优先保存 Core `searchMeta.semanticUsed/vectorUsed/fallbackReason`，不会把 sparse-only RRF 重新误报成 vector used。 |
| VEC-2 | 已完成 | AlembicPlugin | 删除误导性占位 embedding 可执行判断；新增 resident search client / adapter，让 prime/search 在 Alembic 可用时按需请求 resident service。 | HostAiAdapter 修正；resident search adapter；PrimeSearchPipeline 接入；enhancement unavailable / fallback 诊断；提交 `7a81721061bbaaba437343876a56eec62356297a`。 | Plugin-owned prime envelope 不变；不新增 `codex_host_response` tool；Alembic 不存在时 baseline search 继续工作。 |
| VEC-3 | 已完成 | AlembicPlugin | 刷新 Codex runtime artifact、Skill 和安装验证；发布前确保本机 cache 后续刷新能包含 SHOUT-7 与 VEC 变更。 | `runtime.tgz`、runtime dist、Skill 快照、channel / plugin verify；AlembicCodex 提交 `c160c062e95329ff0126cb98f1a9c36bbd451678`。 | portable runtime 不捆绑 AI execution；只请求 resident service。 |
| VEC-4 | 已完成（失败） | AlembicTest | BiliDili 真实项目复测 resident vector route。 | Test-2026-05-21-05，测试报告，probe 证据，AlembicTest commit `cb1a1c5a9d8f5691d0959b3e0a241c823f5cd8b2`。 | prime 成功且 Plugin-owned 边界保持；direct `alembic_search` 被错误桥接到不存在的 `/api/v1/mcp/call`；daemon `/api/v1/search` 有命中但运行态未返回 telemetry；BiliDili 前后干净。 |
| VEC-4R | 已完成 | AlembicPlugin / Alembic | 删除 `/api/v1/mcp/call` 兼容桥，改成明确服务边界：Codex-facing 工具由 Plugin 执行，Alembic 只提供 resident service API。 | Plugin `f46e28179aac306e7fff12fe9d7d68965494c1d8`，runtime artifact `daec908a340f4dbe60a8cec643efdc126cf9ff77`；Alembic `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`。 | 源码负向扫描无 `/api/v1/mcp/call` / `callDaemonBridge` / `daemon-mcp-compat-bridge` 残留；Alembic `/api/v1/search` 仍是 resident service API。 |
| VEC-5 | 已完成（失败，部分通过） | AlembicTest | 产品修复后 BiliDili resident vector search route 复测。 | Test-2026-05-21-06，测试报告，probe 证据，AlembicTest commit `e6aae4b4fb146213abd7fa2bfae7335f3c47c0ba`。 | bridge removal / Plugin-owned direct search / baseline fallback 通过；daemon `/api/v1/search` 运行态 `searchMeta` 缺失、`auto` resident mode validation failure、semantic/vector used telemetry 缺失。 |
| VEC-5R | 已完成 | AlembicPlugin / Alembic | 修复 Test-06 剩余两个断点：Plugin 不再把 `auto` 原样传给 Alembic `/api/v1/search`；Alembic 运行态 `/api/v1/search` 必须能返回 resident telemetry。 | Plugin mode normalization `2c98f69b1388c478bbbb255e487c51fde621cff7`，runtime artifact `33689ec1cd0266023fab2d7c1bebf7ad6fd59732`；Alembic 运行态由 Test-2026-05-22-01 证明 `/api/v1/search` 已返回 `searchMeta`。 | direct `alembic_search(auto)` 不再因 daemon query schema 失败；`semantic` resident response 已携带 `semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`；未恢复 `/api/v1/mcp/call`。 |
| VEC-5T | 已完成 | AlembicTest | VEC-5R 后重建测试单并再次复测 BiliDili resident vector route。 | Test-2026-05-22-01，测试报告，probe 证据，AlembicTest commit `0943ce085a1cb9c84141cc6c85673418c8248e29`。 | BiliDili 只读、前后干净；Plugin mode normalization 与 Alembic running daemon `searchMeta` telemetry 已真实闭环。 |
| VEC-6 | 已完成 | AlembicWorkspace | 复测通过后总控验收、归档、刷新本机 Codex plugin cache、提交 workspace 文档。 | 验收记录、索引更新、cache refresh 证据、workspace 提交。 | cache 已刷新到 AlembicPlugin `2c98f69b1388c478bbbb255e487c51fde621cff7`；workspace 文档已提交。 |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 已补 `SearchResponse.searchMeta`、resident search telemetry helper 与 VectorService sparse-only 真实 `vectorUsed` 透传；提交 `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`。 |
| `Alembic`<br>已完成 | VEC-5R 运行态已由 Test-2026-05-22-01 验收：daemon `/api/v1/search` 返回 `searchMeta`，`semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`；当前 HEAD `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`。 |
| `AlembicPlugin`<br>已完成 | VEC-5R Plugin 侧已完成并通过真实复测：`ResidentSearchClient` 将 Codex-facing `auto` 规范化为 daemon-supported `semantic` 请求，同时在 metadata 中保留 `codexRequestedMode=auto` / `residentRequestMode=semantic`；runtime artifact 已同步。 |
| `AlembicTest`<br>已完成 | Test-2026-05-22-01 已通过并封口，AlembicTest commit `0943ce085a1cb9c84141cc6c85673418c8248e29`；BiliDili 前后干净。 |
| `AlembicAgent`<br>观察中 | 当前 OllamaProvider / AiFactory 已能提供真实 embed provider；只有 Alembic 侧验证失败才回到 AlembicAgent。 |
| `AlembicDashboard`<br>无任务 | 本轮不改 Dashboard UI；后续若要展示 vector status，再另开任务。 |
| `BiliDili`<br>观察中 | 作为 VEC-4 真实项目验证对象；本轮不改产品源码、不派发执行窗口。 |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `AlembicCore` | 已完成 | SearchResponse / resident search metadata contract 已沉淀到 Core，且不会破坏旧 `items` 读取。 | 否 |
| `Alembic` | 已完成 | running daemon telemetry 已由 Test-2026-05-22-01 验明；后续只保留 `residentVector.stats.indexSize=0` 指标语义为观察风险。 | 否 |
| `AlembicPlugin` | 已完成 | 已把 Codex-facing `auto` 与 daemon-supported resident request mode 分开；提交 `2c98f69b1388c478bbbb255e487c51fde621cff7`，runtime artifact `33689ec1cd0266023fab2d7c1bebf7ad6fd59732`，真实复测通过。 | 否 |
| `AlembicTest` | 已完成 | Test-2026-05-22-01 已通过并提交封口证据；当前无新的测试单。 | 否 |
| `AlembicAgent` | 观察 | OllamaProvider / AiFactory 当前已有真实 embedding provider；只有 Alembic 验证失败才回到 Agent。 | 否 |
| `AlembicDashboard` | 无任务 | 本轮不改 UI。 | 否 |
| `BiliDili` | 观察 | 后续只作为真实项目验证对象；当前不修改产品源码。 | 否 |

## 依赖与派发顺序

1. 用户已确认本计划。
2. `AlembicCore` 已完成 resident search contract；`Alembic` 已完成 resident HTTP response telemetry，并用 `2cfd935b83241ee72263e18528c9647ded65dec7` 修正 `d6526aa0541dc8ce54e10d4efe97366b7646e7bf` 的 `searchMeta` 覆盖问题。
3. `AlembicPlugin` 已完成 resident search API shape 消费、prime/search 接入和 runtime artifact 刷新，总控代码复核通过。
4. `AlembicTest` Test-2026-05-21-05 已完成且失败：`alembic_task prime` 成功，direct `alembic_search` 被错误桥接到 `/api/v1/mcp/call`；daemon `/api/v1/search` 能命中但运行态缺 telemetry。
5. 用户确认删除 `/api/v1/mcp/call`；`AlembicPlugin` 与 `Alembic` 均已完成 VEC-4R 产品修复。
6. `AlembicTest` Test-2026-05-21-06 已完成且失败但部分通过：bridge removal 与 Plugin-owned direct search 生效，真实向量 telemetry 未闭环。
7. VEC-5R 已完成；`AlembicPlugin` mode normalization 已提交，`Alembic` running daemon telemetry 已由 Test-2026-05-22-01 验明。
8. Test-2026-05-22-01 已通过：direct `alembic_search(auto)` 保留 `codexRequestedMode=auto` 并以 `residentRequestMode=semantic` 请求 Alembic；daemon `/api/v1/search` 和 direct `auto/semantic` 均返回 `semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`；BiliDili 前后干净。
9. VEC-6 已完成：真实 Codex plugin cache 已刷新到 AlembicPlugin `2c98f69b1388c478bbbb255e487c51fde621cff7`，`.mcp.json` 指向 workspace local MCP entry；workspace 文档已提交。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VEC-TODO-1 | 已完成 | mainline | P0 | `AlembicPlugin` | 删除 HostAiAdapter 对占位 `embed()` 的可执行误判，避免 `embedAvailable=true` 但运行时必然抛错。 | 是 | AlembicPlugin 提交 `7a81721061bbaaba437343876a56eec62356297a` 已完成，总控代码复核通过。 | `AlembicPlugin` |
| VEC-TODO-2 | 已完成 | resident service | P0 | `Alembic` / `AlembicCore` | 明确 resident semantic search API / metadata contract，让 Plugin 可证明真实 vector route。 | 是 | Core `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`；Alembic `d6526aa0541dc8ce54e10d4efe97366b7646e7bf` + `2cfd935b83241ee72263e18528c9647ded65dec7`。 | `AlembicCore` / `Alembic` |
| VEC-TODO-3 | 已完成 | integration | P0 | `AlembicPlugin` / `Alembic` | Plugin prime/search 在 Alembic 可用时请求 resident service，保持 Plugin-owned envelope 和 embedded baseline sparse fallback；Alembic 不存在时标记 resident vector enhancement unavailable。 | 是 | AlembicPlugin 提交 `7a81721061bbaaba437343876a56eec62356297a` 已完成，总控代码复核通过。 | `AlembicPlugin` |
| VEC-TODO-4 | 已完成（失败） | real project test | P0 | `AlembicTest` | BiliDili 真实项目验证 resident vector route、prime delivered、fallback 可解释、项目未修改。 | 是 | Test-2026-05-21-05 已完成，结论失败；AlembicTest commit `cb1a1c5a9d8f5691d0959b3e0a241c823f5cd8b2`；BiliDili 前后干净。 | `AlembicTest` |
| VEC-TODO-5 | 已完成 | release | P0 | `AlembicWorkspace` | 刷新 runtime artifact、channel、release boundary、本机 Codex plugin cache；记录 SHOUT-7 + vector bridge 同步状态。 | 是 | cache marker 已刷新到 AlembicPlugin `2c98f69b1388c478bbbb255e487c51fde621cff7`，workspace 文档已提交。 | `AlembicWorkspace` |
| VEC-TODO-6 | 已完成 | product repair | P0 | `AlembicPlugin` / `Alembic` | 删除 `/api/v1/mcp/call` 兼容桥：Plugin 不再 POST daemon MCP bridge，Alembic 不再提供该 route；`alembic_search` 使用 Plugin handler + Alembic `/api/v1/search` resident service API。 | 是 | Plugin `f46e28179aac306e7fff12fe9d7d68965494c1d8` / runtime `daec908a340f4dbe60a8cec643efdc126cf9ff77`；Alembic `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`。 | `AlembicPlugin` / `Alembic` |
| VEC-TODO-7 | 已完成（失败，部分通过） | real project retest | P0 | `AlembicTest` | 产品修复后重跑 BiliDili resident vector search route 真实项目复测，验证 direct `alembic_search` resident metadata 与 fallback。 | 是 | Test-2026-05-21-06 已完成，AlembicTest commit `e6aae4b4fb146213abd7fa2bfae7335f3c47c0ba`；bridge removal 通过，daemon telemetry / auto mode 仍失败。 | `AlembicTest` |
| VEC-TODO-8 | 已完成 | product/runtime repair | P0 | `AlembicPlugin` / `Alembic` | 修复 Test-06 剩余断点：Plugin `auto` resident request mode normalization；Alembic running daemon `/api/v1/search` telemetry freshness / reload / 必要代码修复。 | 是 | Test-2026-05-22-01 已通过；direct auto/semantic 与 daemon endpoint 均有 resident telemetry。 | `AlembicPlugin` / `Alembic` |
| VEC-TODO-9 | 已完成 | real project retest | P0 | `AlembicTest` | VEC-5R 完成后新建下一张测试单，复测 BiliDili resident vector search route，证明 daemon telemetry 与 Plugin metadata 闭环。 | 是 | Test-2026-05-22-01 已通过；AlembicTest commit `0943ce085a1cb9c84141cc6c85673418c8248e29`。 | `AlembicTest` |
| VEC-TODO-10 | 已完成 | release closeout | P0 | `AlembicWorkspace` | VEC-6：刷新本机 Codex plugin cache 或发布态验证，并把 SHOUT-7 + resident vector bridge 的最终安装态证据写入 workspace 收口。 | 是 | 已执行 `npm run dev:codex-plugin:local-mcp -- --clean --all-installed`；cache marker `gitHead=2c98f69b1388c478bbbb255e487c51fde621cff7`、mode `local-mcp`、target `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.2`；workspace 文档已提交。 | `AlembicWorkspace` |
| VEC-TODO-11 | 观察中 | diagnostics quality | P2 | `Alembic` / `AlembicCore` | `residentVector.stats.indexSize=0` 容易被误读；虽然本轮 `semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true` 不受影响，后续可解释或调整该指标语义。 | 否 | Test-2026-05-22-01 遗留风险；不阻塞 VEC-6。 | `Alembic` / `AlembicCore` |

## 验证策略

`AlembicCore` / `Alembic`：

- SearchResponse / HTTP response 类型测试。
- `/api/v1/search?q=...&mode=semantic&limit=5` 返回 `mode=semantic` 或等价 actual mode。
- 本地 Ollama / qwen3 embedding 与 HNSW 检索证据：维度、命中条数、耗时、命中 Recipe 标题。
- daemon health / capability 若扩展，需保持旧字段兼容。

`AlembicPlugin`：

- HostAiAdapter 单元测试：host-managed placeholder 不再被判断为 executable embed provider。
- PrimeSearchPipeline / task handler 单元测试：resident service ready 时请求 Alembic search；daemon unavailable / Alembic 未安装时不尝试向量并标记 resident enhancement unavailable；resident search failure 时降级 embedded baseline sparse 并记录原因。
- `alembic_task prime` 保持 Plugin-owned serviceBoundary，不转移 tool ownership。
- `npm run prepare:codex-plugin-runtime`、`verify:codex-plugin`、`verify:codex-channel`、`verify:release-package-boundary`。

`AlembicTest`：

- 通过 `docs/workspace/alembic-test-exchange.md` 新建测试单后执行。
- 测试前后 `BiliDili` git 干净。
- 证据包括 daemon status、vector index stats、prime payload searchMeta、Codex 可见 shout、Plugin / Alembic / Core / runtime artifact 版本。

## 当前可复制分派提示词

发送给：无。

当前不要发送给：`AlembicPlugin`（已完成）、`Alembic`（已完成）、`AlembicCore`（已完成）、`AlembicTest`（已完成）、`AlembicAgent`（观察中）、`AlembicDashboard`（无任务）、`BiliDili`（观察中，不改产品源码）。

VEC-6 已完成，当前不需要复制提示词给其它窗口。

## 回填区

- 2026-05-21：用户确认本计划可以执行；总控激活 VEC-1，当前派发 `AlembicCore` / `Alembic`，其它窗口保持阻塞、观察或无任务。
- 2026-05-21：`AlembicCore` 完成 VEC-1 Core 侧 contract。执行记录：[../AlembicCore/resident-vector-search-release-core-2026-05-21.md](../../../../AlembicCore/resident-vector-search-release-core-2026-05-21.md)。提交 hash：`39bcebe94c451f92e405b0da38d2cbe67e8e0f82`。完成范围：新增 `SearchResponse.searchMeta`、resident search telemetry 类型与 `buildSearchResponseMeta()` helper；`SearchEngine.search()` 写入 route、requested/actual mode、semantic/vector 使用状态、fallbackReason、resultCount、durationMs；`VectorService.hybridSearch()` 透传 `vectorUsed` / `semanticUsed` / `fallbackReason`，避免 embed 失败后 sparse-only RRF 被误判为真实 vector 命中；导出 `@alembic/core/search` 与 `@alembic/core/vector` facade。验证：`npm run build:check` 通过；目标测试 3 文件 75 tests 通过；`git diff --check` 通过；`npm run check` 通过，全量 63 文件 943 tests。遗留风险：Alembic daemon `/api/v1/search` 仍需接入/透传该 contract，并回填真实 Ollama / HNSW semantic search 证据；Plugin 仍阻塞，等待 Alembic API shape 与证据。
- 2026-05-21：用户口径更新为 `AlembicCore` / `Alembic` 完成。总控复核 `Alembic` 提交 `d6526aa0541dc8ce54e10d4efe97366b7646e7bf`，结论为 `AlembicCore` 可收、`Alembic` 需返工：`Alembic/lib/http/routes/search.ts` 当前在 `SearchEngine.search()` 返回后重新构造并覆盖 `searchMeta`，且 `isSemanticActualMode()` 用 `actualMode.includes("rrf")` 推断 semantic/vector 使用；这会把 Core 已明确标为 `auto(sparse-rrf,conf=...)` 且 `vectorUsed=false` 的 sparse-only fallback 重新误报成 `vectorUsed=true`。代码证据：`Alembic/lib/http/routes/search.ts:125`、`Alembic/lib/http/routes/search.ts:131`、`Alembic/lib/http/routes/search.ts:215`、`Alembic/lib/http/routes/search.ts:216`、`Alembic/lib/http/routes/search.ts:357`；Core 反例证据：`AlembicCore/src/service/search/SearchEngine.ts:275`、`AlembicCore/src/service/search/SearchEngine.ts:310`、`AlembicCore/src/service/search/SearchEngine.ts:365`、`AlembicCore/test/SearchEngine.test.ts:369`。当前不启动 `AlembicPlugin`。
- 2026-05-21：用户口径更新为 `Alembic` 返工完成。总控复核 `Alembic` 提交 `2cfd935b83241ee72263e18528c9647ded65dec7`，代码验收通过：`Alembic/lib/http/routes/search.ts:223` 读取 `result.searchMeta`；`Alembic/lib/http/routes/search.ts:228` 明确 Core `searchMeta` 是 semantic/vector 是否真实命中的唯一事实源；`Alembic/lib/http/routes/search.ts:231` 和 `Alembic/lib/http/routes/search.ts:235` 优先保留 Core `semanticUsed` / `vectorUsed`；`Alembic/lib/http/routes/search.ts:239` 到 `Alembic/lib/http/routes/search.ts:263` 透传 `fallbackReason` / degraded 语义；`Alembic/test/unit/SearchRouteTelemetry.test.ts:128` 增加 sparse-only RRF 反例，断言 `vectorUsed=false`。Alembic 仓库工作区干净。未看到单仓执行记录或验证命令回填；总控未补跑产品测试，此项作为证据缺口保留，但 API shape 与代码事实已足够启动 `AlembicPlugin` VEC-2。
- 2026-05-21：`AlembicPlugin` 完成 VEC-2/VEC-3 执行，执行记录：[../AlembicPlugin/resident-vector-search-release-plugin-2026-05-21.md](../../../../AlembicPlugin/resident-vector-search-release-plugin-2026-05-21.md)。提交 hash：`AlembicPlugin` `7a81721061bbaaba437343876a56eec62356297a`；`AlembicCodex` runtime artifact `c160c062e95329ff0126cb98f1a9c36bbd451678`；embedded Core source `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`。完成范围：HostAiAdapter 不再把 host-managed placeholder `chat()` / `embed()` 判定为可执行；VectorModule 只向 Core VectorService 注入真实 embed provider；新增 ResidentSearchClient 调用 Alembic `/api/v1/search` 并消费 resident search telemetry；PrimeSearchPipeline 和 direct embedded `alembic_search` handler 接入 resident search / baseline fallback metadata；task intent 保存 residentSearch 诊断；Alembic Codex Skill、runtime dist、`runtime.tgz` 与 embedded Core vendor 均已刷新。验证：目标单元测试 4 文件 11 tests 通过；CodexMcpServer / ServiceRequestBoundary 2 文件 38 tests 通过；`npm run build:check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`verify:codex-plugin`、`verify:codex-channel`、`verify:release-package-boundary`、`verify:codex-session`、`lint:core-import-boundary`、AlembicPlugin / AlembicCodex `git diff --check` 均通过；`npm run lint` 通过退出但仍报告既有 warnings；`npm run lint:repo-boundary` 失败于既有 10 个非本轮 `db.prepare()` / `getDb()` 边界问题。遗留风险：尚未由 AlembicTest 进行 BiliDili 真实项目复测；本机 Codex plugin cache 尚未刷新，应由总控在 VEC-4/VEC-5 统一处理；`lint:repo-boundary` 历史问题需另开专项。
- 2026-05-21：总控复核 `AlembicPlugin` VEC-2/VEC-3 通过。代码证据：`AlembicPlugin/lib/codex/HostAiAdapter.ts` 的 `normalizeHostProvider()` 已用 `hostManaged` / `__hostEmbedExecutable` 防止 placeholder `embed()` 被视为可执行；`AlembicPlugin/lib/injection/modules/VectorModule.ts` 只注入 `providerSupportsExecutableEmbedding()` 为 true 的真实 embed provider；`AlembicPlugin/lib/service/search/ResidentSearchClient.ts` 读取 daemon state、调用 `/api/v1/search`、透传 `residentVector` / `semanticUsed` / `vectorUsed` / `fallbackReason` / `workspace`；`AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts` 将 resident semantic search 纳入 prime multi-query，并在失败时保留 baseline metadata；`AlembicPlugin/lib/external/mcp/handlers/search.ts` 在 direct embedded search 中优先使用 resident 结果并保留 fallback metadata。测试证据覆盖 resident 成功、daemon unavailable、resident request failure、direct search fallback。当前创建 Test-2026-05-21-05，派发 `AlembicTest` 做 BiliDili 真实项目复测。
- 2026-05-21：`AlembicTest` Test-2026-05-21-05 已完成且结论失败，AlembicTest commit `cb1a1c5a9d8f5691d0959b3e0a241c823f5cd8b2`。证据：BiliDili 上下文 `alembic_task prime` 成功，`serviceBoundary.executionPath=plugin-owned-codex-facing`，`codex_host_response` 未出现；direct `alembic_search auto/semantic` 均被错误路由到 `daemon-mcp-compat-bridge` 并请求 `POST /api/v1/mcp/call`，daemon 返回 `Route not found: POST /api/v1/mcp/call`，没有 baseline fallback 和 resident metadata；只读探测 daemon `/api/v1/search` 返回 6 条 BiliDili 语义命中，但运行态未返回 `searchMeta` / `residentVector` telemetry；BiliDili 前后 `git status --short --branch` 均为 `## main...origin/main`。用户确认删除 `/api/v1/mcp/call`，当前进入 VEC-4R，派发 `AlembicPlugin` / `Alembic`。
- 2026-05-21：`AlembicPlugin` 完成 VEC-4R Plugin 侧修复。提交 hash：`AlembicPlugin` `f46e28179aac306e7fff12fe9d7d68965494c1d8`；`AlembicCodex` runtime artifact `daec908a340f4dbe60a8cec643efdc126cf9ff77`。完成范围：删除 CodexMcpServer daemon MCP compat bridge 调用和 `callDaemonBridge()`；删除 Plugin 本地 HTTP `/api/v1/mcp/call` route；所有 Codex-facing Alembic tools 均进入 Plugin-owned embedded handler；`alembic_search` service boundary 标记 resident service API consumer；External bootstrap/rescan workflow 对 Core cleanup policy 注入 Plugin `CleanupService`，确保 host-agent bootstrap 在 Plugin 内真实产出 Mission Briefing；Codex session 场景改为断言 daemon ensure 未调用、serviceBoundary 为 `plugin-owned-codex-facing`；runtime dist 与 `runtime.tgz` 已同步。验证：目标 VEC 单测 4 文件 / 45 tests 通过；`npm run build:check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run verify:release-package-boundary`、`npm run verify:codex-session`、`npm run lint:core-import-boundary`、AlembicPlugin / AlembicCodex `git diff --check` 均通过；负向扫描 `rg -n "/api/v1/mcp/call|callDaemonBridge|callDaemonTool|daemon-mcp-compat-bridge" lib test scripts plugins` 无剩余命中。遗留风险：Alembic 侧仍需删除自身 route / dispatcher 并确认 `/api/v1/search` 运行态 telemetry；BiliDili 真实项目复测等待 Alembic VEC-4R 完成后再创建 Test-2026-05-21-06；本机 Codex plugin cache 尚未刷新。
- 2026-05-21：`Alembic` 完成 VEC-4R resident service 侧修复。提交 hash：`d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`。完成范围：删除 `lib/external/mcp/McpBridgeDispatcher.ts`、`lib/http/routes/mcp.ts`、旧 `test/unit/McpBridgeRoute.test.ts`，从 `lib/http/HttpServer.ts` 移除 `/mcp` route 挂载，新增 `test/unit/ResidentServiceBoundary.test.ts` 断言 daemon 不再暴露 MCP compat bridge。代码复核：`rg -n "/api/v1/mcp/call|McpBridgeDispatcher|routes/mcp|mcp/call|daemon-mcp-compat-bridge" Alembic/lib Alembic/test Alembic/package.json` 无剩余命中；`Alembic/lib/http/routes/search.ts` 仍在 `/api/v1/search` 返回 `searchMeta`，并通过 `buildResidentSearchMeta()` 暴露 `route/service/semanticUsed/vectorUsed/residentVector/fallbackReason/workspace`。Alembic 仓库工作区干净，`main` ahead 1。当时创建 Test-2026-05-21-06，派发 `AlembicTest` 做 BiliDili 真实项目复测。
- 2026-05-21：`AlembicTest` Test-2026-05-21-06 已完成，结论为失败但部分修复通过，AlembicTest commit `e6aae4b4fb146213abd7fa2bfae7335f3c47c0ba`。通过证据：direct `alembic_search(auto)` / `alembic_search(semantic)` 均 `success=true`，不再出现 `/api/v1/mcp/call` 或 `daemon-mcp-compat-bridge`，`serviceBoundary.executionPath=plugin-owned-codex-facing`，prime delivered 且 Codex 可见响应仍为知识摘要，BiliDili 前后 `## main...origin/main`。失败证据：daemon `/api/v1/search` 裸探测 `searchMetaKeys=[]`；direct semantic resident inner `searchMeta={}`，无 `semanticUsed` / `vectorUsed`；direct auto resident request 被 Alembic query schema 拒绝，reason `Query parameter validation failed`，随后 baseline fallback 返回结果。测试报告：[../../AlembicTest/docs/bilidili-resident-vector-search-vec4r-retest-2026-05-21.md](../../../../../AlembicTest/docs/bilidili-resident-vector-search-vec4r-retest-2026-05-21.md)。
- 2026-05-21：总控验收 Test-06 后进入 VEC-5R，不继续派发 AlembicTest。当前派发 `AlembicPlugin` 修复 resident request mode normalization；派发 `Alembic` 处理 daemon `/api/v1/search` telemetry 运行态刷新 / 必要修复。下一轮 BiliDili 真实项目复测需等待两个产品窗口回填后另建测试单。
- 2026-05-21：`AlembicPlugin` 完成 VEC-5R Plugin 侧修复。提交 hash：`AlembicPlugin` `2c98f69b1388c478bbbb255e487c51fde621cff7`；`AlembicCodex` runtime artifact `33689ec1cd0266023fab2d7c1bebf7ad6fd59732`。完成范围：`ResidentSearchClient` 新增 resident request mode normalization，Codex-facing `auto` 不再原样传给 Alembic `/api/v1/search`，而是以 daemon schema 支持的 `semantic` 发起 resident enhancement；metadata 保留 `requestedMode=auto`、`residentRequestMode=semantic`、`codexRequestedMode=auto`；semantic telemetry 缺失时不再声称 `residentVector.available=true`，而是标记 `resident_search_telemetry_missing`；Alembic Codex Skill 与 runtime artifact 已同步。验证：`npx vitest run test/unit/ResidentSearchClient.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts` 通过，3 files / 9 tests；`npx biome check lib/service/search/ResidentSearchClient.ts test/unit/ResidentSearchClient.test.ts test/unit/SearchHandlerResidentSearch.test.ts` 通过；`npm run build:check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run verify:release-package-boundary`、`npm run verify:codex-session`、`npm run lint:core-import-boundary`、AlembicPlugin / AlembicCodex `git diff --check` 均通过；负向扫描 `rg -n "/api/v1/mcp/call|callDaemonBridge|callDaemonTool|daemon-mcp-compat-bridge" lib test scripts plugins` 无剩余命中。遗留风险：Alembic running daemon `/api/v1/search` 仍需返回 `searchMeta` telemetry；BiliDili 真实项目复测等待 Alembic VEC-5R 完成后再创建 Test-2026-05-21-07；本机 Codex plugin cache 尚未刷新。
- 2026-05-22：用户口径更新为 `AlembicPlugin` / `Alembic` 均完成。总控复核当前本地仓库状态：`AlembicPlugin` HEAD 为 `2c98f69b1388c478bbbb255e487c51fde621cff7` 且工作区干净；`Alembic` HEAD 仍为 `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10` 且工作区干净，未发现 VEC-5R 后新代码提交或单仓执行记录。判断：Plugin 侧代码修复证据充分；Alembic 侧按用户口径视为运行态刷新 / 无代码变更完成，但必须通过下一轮 `AlembicTest` 真实复测验明 daemon `/api/v1/search` 是否已返回 `searchMeta`。当前创建 Test-2026-05-22-01，派发 `AlembicTest`。
- 2026-05-22：`AlembicTest` Test-2026-05-22-01 已完成且测试通过，AlembicTest commit `0943ce085a1cb9c84141cc6c85673418c8248e29`。证据：direct `alembic_search(auto)` `success=true`，`codexRequestedMode=auto`、`residentRequestMode=semantic`、`actualMode=semantic`、`semanticUsed=true`、`vectorUsed=true`、`residentVector.available=true`；direct `alembic_search(semantic)` 同样返回 resident telemetry；daemon `/api/v1/search` HTTP 200，`searchMetaKeys` 包含 `route/service/coreRoute/requestedMode/actualMode/semanticUsed/vectorUsed/residentVector/vector/workspace`，`semanticUsed=true`、`vectorUsed=true`、`degraded=false`；负向扫描 `containsMcpCallPath=false`、`containsDaemonCompatBridge=false`；prime delivered 且可见响应仍是知识摘要；BiliDili 前后 `## main...origin/main` 干净。遗留风险：真实 Codex plugin cache marker 仍为旧 gitHead，本次实际使用 workspace local MCP entry；`residentVector.stats.indexSize=0` 指标语义可后续解释，不阻塞本轮通过。当前进入 VEC-6，由总控刷新真实 Codex plugin cache / 发布态验证并收口 workspace 文档。
- 2026-05-22：总控执行 VEC-6 cache refresh。命令：`npm run dev:codex-plugin:local-mcp -- --clean --all-installed`（在 `AlembicPlugin` 仓库执行）。结果：成功；target roots 为 `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.2`；cache marker `gitHead=2c98f69b1388c478bbbb255e487c51fde621cff7`、`mode=local-mcp`、`pluginVersion=0.1.2`、`localMcpEntry=/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/dist/bin/codex-mcp.js`；`.mcp.json` command 为本机 Node，args 指向 workspace local MCP entry，env 包含 `ALEMBIC_CHANNEL_ID=codex`、`ALEMBIC_PLUGIN_HOST=codex`、`ALEMBIC_CODEX_MCP_MODE=1`、`ALEMBIC_RUNTIME_MODE=plugin`。`AlembicPlugin` 仓库刷新后仍干净。workspace 文档已提交，resident vector search 发布计划收口完成。
