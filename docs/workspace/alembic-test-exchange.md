# AlembicTest Exchange

状态：Test-2026-05-22-01 已完成（测试通过，AlembicTest 仓库封口提交完成）
维护窗口：AlembicWorkspace
执行窗口：AlembicTest
更新日期：2026-05-22

本文件是总控窗口与 `AlembicTest` 之间的专门测试交流文档。总控只在这里创建测试单、写清目标和验收标准；`AlembicTest` 读取测试单后执行，并在这里回填摘要与证据。详细测试报告保存在 `AlembicTest/docs/`。

长期流程见 [alembic-test-exchange-policy.md](alembic-test-exchange-policy.md)。

## 当前测试单

`Test-2026-05-21-01` 已由 AlembicTest 执行并回填，总控验收结论为失败。`Alembic` 已补齐 daemon MCP bridge 兼容能力，但总控根据用户决策调整边界：Alembic 作为 resident service 被 Plugin 按需请求，Codex-facing `prime` 不应做 MCP tool ownership bridge。`AlembicPlugin` service request 边界修正与 `Test-2026-05-21-02` 均已通过。`AlembicPlugin` prime immediate receipt shout、可见摘要优化与 `Test-2026-05-21-03` / `Test-2026-05-21-04` 已验证。`Test-2026-05-21-05` 已完成且结论失败，用户确认删除 `/api/v1/mcp/call`。`Test-2026-05-21-06` 已完成 VEC-4R 复测：direct `alembic_search` 已不再走 compat bridge，但 daemon `/api/v1/search` 运行态仍缺 `searchMeta`，测试结论为失败但部分修复通过。用户口径更新 `AlembicPlugin` / `Alembic` VEC-5R 均完成；`Test-2026-05-22-01` 已完成 VEC-5R 后 BiliDili 真实项目复测，结论通过。

| 测试单 | 状态 | 目标 | 执行窗口 | 报告 |
| --- | --- | --- | --- | --- |
| Test-2026-05-22-01：BiliDili resident vector search route VEC-5R 复测 | 已完成 | 测试通过；direct `alembic_search(auto)` 已显示 `codexRequestedMode=auto` / `residentRequestMode=semantic`，不再出现 query validation failure；daemon `/api/v1/search` 和 direct `semantic/auto` 均返回 resident searchMeta，`semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`；prime delivered 与 Codex 可见知识摘要保持；BiliDili 前后干净；AlembicTest 已提交报告 / probe 脚本 / 文档变更，commit `0943ce085a1cb9c84141cc6c85673418c8248e29`。 | `AlembicTest` | [../../AlembicTest/docs/bilidili-resident-vector-search-vec5r-retest-2026-05-22.md](../../AlembicTest/docs/bilidili-resident-vector-search-vec5r-retest-2026-05-22.md) |
| Test-2026-05-21-06：BiliDili resident vector search route VEC-4R 复测 | 已完成 | 测试失败但部分修复通过；direct `alembic_search auto/semantic` 已离开 `/api/v1/mcp/call` 与 `daemon-mcp-compat-bridge`，并走 Plugin-owned handler；semantic resident metadata 出现但 daemon `/api/v1/search` 运行态仍无 `searchMeta`，无法证明 semantic/vector used；`AlembicTest` 已提交报告 / probe 负向断言 / 文档变更，commit `e6aae4b4fb146213abd7fa2bfae7335f3c47c0ba` | `AlembicTest` | [../../AlembicTest/docs/bilidili-resident-vector-search-vec4r-retest-2026-05-21.md](../../AlembicTest/docs/bilidili-resident-vector-search-vec4r-retest-2026-05-21.md) |
| Test-2026-05-21-05：BiliDili resident vector search route 真实项目复测 | 已完成 | 测试失败；`alembic_task prime` 成功且边界保持 Plugin-owned，但 direct `alembic_search auto/semantic` 被桥接到不存在的 `POST /api/v1/mcp/call`，daemon `/api/v1/search` 能返回命中但没有 resident telemetry；`AlembicTest` 已提交测试报告 / probe 脚本 / 文档变更，commit `cb1a1c5a9d8f5691d0959b3e0a241c823f5cd8b2` | `AlembicTest` | [../../AlembicTest/docs/bilidili-resident-vector-search-route-test-2026-05-21.md](../../AlembicTest/docs/bilidili-resident-vector-search-route-test-2026-05-21.md) |
| Test-2026-05-21-04：BiliDili prime readable receipt shout 可见摘要复测 | 已完成 | 功能验收通过；`AlembicTest` 已提交 readable receipt shout 测试报告 / probe 脚本 / 文档变更，commit `60bbd360be147062f834ee881630ca25918663d0` | `AlembicTest` | [../../AlembicTest/docs/bilidili-prime-readable-receipt-shout-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-readable-receipt-shout-test-2026-05-21.md) |
| Test-2026-05-21-03：BiliDili prime immediate receipt shout 可见行为复测 | 已完成 | 功能验收通过；`AlembicTest` 已提交测试报告 / probe 脚本 / 文档变更，commit `b532cd8bf7c40c8f12b93f91380befdea617d999` | `AlembicTest` | [../../AlembicTest/docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md) |
| Test-2026-05-21-02：BiliDili prime shout service boundary 复测 | 已完成 | 功能验收通过；`AlembicTest` 已提交测试报告 / probe 脚本 / 文档变更，commit `af0430ad69b4da50469eeaded8caa77c59e996e5` | `AlembicTest` | [../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md) |
| Test-2026-05-21-01：BiliDili prime 注入与 Codex 知识呐喊插件验证 | 已完成 | 结论为失败：BiliDili Recipes 可读，但 `prime` 未返回 `primeKnowledgeMaterial`；后续复测已转入 Test-2026-05-21-02 | `AlembicTest` | [../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md) |

### Test-2026-05-22-01：BiliDili resident vector search route VEC-5R 复测

状态：已完成（测试通过，AlembicTest 仓库封口提交完成）
创建日期：2026-05-22
总控来源：Test-2026-05-21-06 失败后，`AlembicPlugin` 已完成 VEC-5R mode normalization；用户口径更新 `Alembic` 已完成 running daemon telemetry 处理。总控复核本地 `Alembic` 仓库未发现新代码提交，当前用真实项目复测验证运行态。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明 BiliDili 上下文中 direct `alembic_search(auto)` 不再把 `mode=auto` 原样传给 Alembic `/api/v1/search`，不再出现 `Query parameter validation failed`。
- 证明 direct `alembic_search(auto)` 的 resident metadata 能同时看出 Codex 原始请求是 `auto`，resident request mode 是 daemon 支持的 `semantic`，例如 `requestedMode=auto` / `residentRequestMode=semantic` / `codexRequestedMode=auto` 或等价字段。
- 证明 direct `alembic_search(semantic)` 和 daemon `/api/v1/search?mode=semantic` 运行态返回 `searchMeta`，至少包含 route / service / requestedMode / actualMode / semanticUsed / vectorUsed / residentVector / fallbackReason 或等价诊断字段。
- 证明 semantic/vector 真实使用时有 `semanticUsed=true` 或 `vectorUsed=true`；若运行态仍无法使用真实 vector，必须给出清晰 fallbackReason，不得用空 `searchMeta={}` 或 `residentVector.available=false` 且 reason `null` 通过。
- 证明 `/api/v1/mcp/call` 和 `daemon-mcp-compat-bridge` 没有回归。
- 证明 `alembic_task(operation="prime")` 仍保持 Plugin-owned Codex-facing 边界，能返回 delivered `primeKnowledgeMaterial`，Codex 可见响应仍是知识摘要，不默认倾倒 telemetry / evidenceRefs。
- 证明 BiliDili 真实项目在测试前后 git 状态保持干净。

#### 非目标

- 不重新生成 BiliDili Recipes 或向量数据。
- 不启动完整 cold-start / rescan；如果 daemon 未 reload 或向量状态阻塞，记录证据，不扩大测试范围。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不刷新本机 Codex plugin cache；cache refresh 是后续 VEC-6 总控动作。
- 不在 AlembicTest 窗口修复 `AlembicPlugin` 或 `Alembic` 源码；发现问题只回填证据和建议归属。

#### 前置版本

- `AlembicPlugin` VEC-5R：`2c98f69b1388c478bbbb255e487c51fde621cff7`
- AlembicCodex runtime artifact：`33689ec1cd0266023fab2d7c1bebf7ad6fd59732`
- `Alembic`：当前本地 HEAD 为 `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`；用户口径 VEC-5R 完成但总控未发现新代码提交，因此本测试必须记录 running daemon startedAt、dist mtime、实际 endpoint payload。
- `AlembicCore` resident telemetry contract：`39bcebe94c451f92e405b0da38d2cbe67e8e0f82`
- BiliDili Recipes / vector 数据已存在；测试窗口必须记录实际使用的 MCP entry、plugin cache marker、daemon state 和版本。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中调用 `alembic_codex_status`、`alembic_task(operation="prime")`、`alembic_search(auto)`、`alembic_search(semantic)`。
- 建议复用并更新 `AlembicTest/scripts/probe-resident-vector-search.mjs`，重点新增对 VEC-5R `residentRequestMode` / `codexRequestedMode` 与 daemon `searchMeta` 的断言。
- 允许只读探测 daemon `/api/v1/search`，用于区分 Plugin metadata、resident endpoint 和 running daemon telemetry。
- 禁止写入或修改 BiliDili 仓库受 git 跟踪文件；禁止 cold-start / rescan / 重建向量 / 手动改 plugin dist 或 daemon state。

#### 观察点

- version / runtime：记录 `AlembicPlugin` HEAD、AlembicCodex runtime artifact HEAD、实际 MCP entry、cache marker、Alembic HEAD、daemon process、daemon health `startedAt`、search route dist mtime。
- direct auto：不得再出现 `Query parameter validation failed`；payload 应显示 resident route attempted，并保留 `auto -> semantic` 的模式转译证据。
- direct semantic：若 resident result used=true，必须能看到来自 daemon 或 Plugin 保留的 `semanticUsed` / `vectorUsed` / `residentVector`；如果缺失，按失败记录。
- daemon endpoint：`/api/v1/search` 不应缺失 `searchMeta`；若缺失，按失败记录，并记录是否 running daemon 仍早于 dist / 未 reload。
- bridge removal：probe 日志、payload、stderr 或显式负向扫描不得出现对 `POST /api/v1/mcp/call` 的调用；若出现，按失败记录。
- Codex 可见行为：prime 后下一条开发者可见响应仍应由 Codex / 我喊出知识摘要，不默认列 evidenceRefs 或 telemetry dump。
- BiliDili 状态：测试前后 `git -C ../BiliDili status --short --branch` 应保持一致且干净。

#### 验收标准

- 通过：版本证据匹配 VEC-5R；direct `alembic_search(auto)` 不再触发 daemon query validation failure；resident request mode 转译证据可见；daemon `/api/v1/search` 返回 `searchMeta`；search payload 有 resident semantic/vector metadata 或清晰 fallback；prime delivered 且 Codex 可见呐喊保持摘要；BiliDili 前后干净。
- 失败：仍请求 `/api/v1/mcp/call`；仍出现 `daemon-mcp-compat-bridge`；`auto` 仍因 `Query parameter validation failed` 降级；daemon `/api/v1/search` 没有 `searchMeta`；semantic/vector used 为空且无 fallbackReason；fallback 被误写成 Plugin embedding failure；BiliDili 被修改。
- 阻塞：实际 MCP entry 未覆盖 VEC-5R 版本、daemon 不可用、BiliDili Recipes / vector 数据缺失、无法读取 prime/search payload 或无法观察 Codex 可见响应。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short --branch
# 记录实际 MCP entry / plugin cache marker / AlembicPlugin / Alembic / Core 版本。
# 调用 alembic_codex_status、alembic_task prime、alembic_search auto/semantic，并保存 payload 摘要。
# 只读探测 daemon /api/v1/search，记录 searchMeta 和 daemon startedAt / dist mtime。
git -C ../BiliDili status --short --branch
```

#### 回填要求

- 测试结论：通过。probe 分类为 `resident-success`；VEC-5R 后 direct `alembic_search(auto)` 不再出现 daemon `mode=auto` validation failure，resident metadata 显示 `codexRequestedMode=auto` / `residentRequestMode=semantic`；daemon `/api/v1/search` 和 direct `auto/semantic` 均返回 resident telemetry，`semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`。
- 执行范围：只读调用 Alembic Codex MCP stdio runtime 的 `alembic_codex_status`、`alembic_task prime`、`alembic_search auto`、`alembic_search semantic`，并额外只读探测 daemon `/api/v1/search`；未 cold-start、未 rescan、未重建向量、未刷新 cache、未修改 BiliDili。
- 使用配置：`ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR` 指向 workspace 内 `BiliDili`；MCP entry 使用 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；输出 JSON 为 `AlembicTest/tmp/bilidili-resident-vector-search-vec5r-probe-2026-05-22.json`。
- 版本证据：`AlembicPlugin` HEAD 为 `2c98f69b1388c478bbbb255e487c51fde621cff7`；AlembicCodex runtime artifact `AlembicPlugin/plugins/alembic-codex` HEAD 为 `33689ec1cd0266023fab2d7c1bebf7ad6fd59732`；`Alembic` HEAD 为 `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`；`AlembicCore` HEAD 为 `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`；cache marker 仍为 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，但 `localMcpEntry` 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`，本次实际使用 local MCP entry。
- daemon state / startedAt / dist mtime：`alembic_codex_status` 解析到实际 daemon URL 为 `http://127.0.0.1:53068`，pid `53669`，health ready，`version=0.1.0`，`mode=daemon`，project 指向 BiliDili，schema migration `009_knowledge_dimension_id`，`startedAt=2026-05-21T15:57:55.147Z`；`Alembic/dist/lib/http/routes/search.js` 与 `daemon.js` 文件 mtime 均为 2026-05-21 23:00:37，`AlembicPlugin/dist/bin/codex-mcp.js` 文件 mtime 为 2026-05-22 00:04:12。
- `prime` payload 摘要：`success=true`；`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuards=3`；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`owner=alembic-plugin`、`residentServiceRequested=false`；tool list / `nextActions` 不含 `codex_host_response`。
- direct `alembic_search(auto)` 摘要：`success=true`；requested mode `auto`；actual mode `semantic`；result count `6`；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`owner=alembic-plugin`、`residentServiceRequested=true`；`searchMeta.residentSearch.route=alembic-resident-service`、`coreRoute=core-search-engine`、`service=alembic-daemon`、`attempted=true`、`available=true`、`used=true`、`codexRequestedMode=auto`、`residentRequestMode=semantic`、`requestedMode=auto`、`actualMode=semantic`、`semanticUsed=true`、`vectorUsed=true`、`fallbackReason=null`；`residentVector.available=true`，stats count `118`、dimension `1024`；代表性命中包括 `@lazy-var-uicomponents`、`@schemerouter-url-decoupling`、`@async-await-repository-bridge`、`@main-thread-ui-dispatch`、`@base-viewcontroller-template`。
- direct `alembic_search(semantic)` 摘要：`success=true`；requested / actual mode 均为 `semantic`；result count `6`；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`owner=alembic-plugin`、`residentServiceRequested=true`；resident route `alembic-resident-service`，`coreRoute=core-search-engine`，`service=alembic-daemon`，`attempted=true`、`available=true`、`used=true`、`codexRequestedMode=semantic`、`residentRequestMode=semantic`、`semanticUsed=true`、`vectorUsed=true`、`resultCount=12`、`fallbackReason=null`；`residentVector.available=true`，stats count `118`、dimension `1024`；代表性命中包括 `@base-viewcontroller-template`、`@video-url-preloader-cache`、`@lazy-var-uicomponents`、`@builder-urlrequest-image`、`@session-pool-ignore-urlcache`。
- daemon `/api/v1/search` 摘要：semantic 查询 `VideoFeedViewController lazy var UI SchemeRouter route guard` 返回 HTTP 200、`success=true`、`actualMode=semantic`、`itemCount=6`；`searchMetaKeys` 包含 `route`、`service`、`coreRoute`、`requestedMode`、`actualMode`、`semanticUsed`、`vectorUsed`、`residentVector`、`vector`、`workspace` 等字段；`route=resident-search`、`service=alembic-daemon`、`coreRoute=core-search-engine`、`semanticUsed=true`、`vectorUsed=true`、`degraded=false`、`residentVector.available=true`；代表性命中包括 `@lazy-var-uicomponents`、`@schemerouter-url-decoupling`、`@async-await-repository-bridge`、`@main-thread-ui-dispatch`、`@base-viewcontroller-template`。
- `/api/v1/mcp/call` / `daemon-mcp-compat-bridge` 负向证据：probe 对 direct search payload 和 MCP stderr 扫描结果为 `containsMcpCallPath=false`、`containsDaemonCompatBridge=false`。
- Codex 可见行为：prime 后下一条开发者可见响应先做知识摘要并补充 VEC-5R 证据：`Prime 收到了 BiliDili 的关键约束：5 条 Recipe 和 3 条 Guard 已就位；后续判断先守住 SchemeRouter 解耦、RouteError/RouteResult、AnalyticsMiddleware 注入、lazy var UI、ModuleManager 生命周期和 Protocol 命名后缀。Resident search 的 VEC-5R 证据也到了：auto 已保留 Codex 请求为 auto、resident 请求转成 semantic，daemon 和 direct search 都显示 semanticUsed=true / vectorUsed=true，而且没有 /api/v1/mcp/call 回归。`
- 是否默认倾倒 evidenceRefs / telemetry：否。可见响应未列长路径清单、逐条 path:line，也未把 resident telemetry 当作可见呐喊主体。
- BiliDili 状态：测试前 `## main...origin/main`；测试后 `## main...origin/main`；无受 git 跟踪或未跟踪文件变化。
- 详细报告路径：[../../AlembicTest/docs/bilidili-resident-vector-search-vec5r-retest-2026-05-22.md](../../AlembicTest/docs/bilidili-resident-vector-search-vec5r-retest-2026-05-22.md)
- `AlembicTest` commit hash：`0943ce085a1cb9c84141cc6c85673418c8248e29`
- 提交范围：`docs/bilidili-resident-vector-search-vec5r-retest-2026-05-22.md`、`scripts/probe-resident-vector-search.mjs`、`scripts/README.md`；共 3 个文件，记录 Test-2026-05-22-01 VEC-5R 复测报告、probe mode normalization / daemon searchMeta 断言和脚本说明更新。
- 是否仍有未提交变更：`AlembicTest` 仓库无未提交文件变更，`main` 相对 `origin/main` ahead 3；`BiliDili` 仍为 `## main...origin/main`，无未提交变更；本交换文档回填属于 workspace 总控文档变更，按规则留给主控窗口统一提交。
- 遗留风险：Codex plugin cache marker 仍是旧 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，本次实际使用 workspace local MCP entry；真实安装态 cache refresh 仍属于后续 VEC-6。daemon vector stats 显示 `indexSize=0`，但 searchMeta 已明确 `semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`，不阻塞本测试通过；若要避免误读，建议产品窗口后续解释或调整该指标语义。本轮未覆盖其它真实项目、cold-start/rescan 后 telemetry 稳定性或刷新后的 Codex plugin cache。
- 下一步建议：总控可将 Test-2026-05-22-01 标记为通过 / 已完成；继续按 resident vector search 发布计划推进 VEC-6：刷新真实 Codex plugin cache 或发布态验证；可选由 `Alembic` / `AlembicCore` 后续解释 `residentVector.stats.indexSize=0` 的诊断语义。

#### 总控验收与后续分派

- 验收结论：Test-2026-05-22-01 证据充分，按测试通过处理。通过点包括 Plugin `auto -> semantic` resident request mode normalization、daemon `/api/v1/search` `searchMeta` 运行态 telemetry、direct auto/semantic resident metadata、`/api/v1/mcp/call` 负向证据、prime delivered / Codex 可见知识摘要，以及 BiliDili 前后干净。
- 后续分派：回到 [resident-vector-search-release-workspace-plan-2026-05-21.md](archive/2026-05/resident-vector-search-release/resident-vector-search-release-workspace-plan-2026-05-21.md) 的 VEC-6，由总控处理真实 Codex plugin cache refresh / 发布态验证和 workspace 文档收口。当前不再派发 `AlembicTest`，也不向 `BiliDili`、`AlembicPlugin`、`Alembic`、`AlembicCore` 发送新提示词。
- 遗留观察：`residentVector.stats.indexSize=0` 只作为后续诊断语义优化观察项，不阻塞本测试通过；真实安装态 cache marker 仍旧，留给 VEC-6 处理。

### Test-2026-05-21-06：BiliDili resident vector search route VEC-4R 复测

状态：已完成（测试失败，AlembicTest 仓库封口提交完成）
创建日期：2026-05-21
总控来源：Test-2026-05-21-05 失败后，用户确认删除 `/api/v1/mcp/call`；`AlembicPlugin` / `Alembic` 已完成 VEC-4R 产品修复并通过总控代码复核。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明 BiliDili 上下文中 direct `alembic_search(auto)` / `alembic_search(semantic)` 不再请求 `POST /api/v1/mcp/call`，也不再返回 `daemon-mcp-compat-bridge`。
- 证明 direct `alembic_search` 进入 Plugin-owned handler，并通过 ResidentSearchClient 请求 Alembic resident `/api/v1/search`；成功时 payload 中出现 `searchMeta.residentSearch` / `residentVector` 或等价 metadata。
- 证明 Alembic `/api/v1/search` 运行态返回 `searchMeta`，至少包含 route / service / requestedMode / actualMode / semanticUsed / vectorUsed / residentVector / fallbackReason 或等价诊断字段。
- 证明 resident service 不可用或请求失败时，Plugin 降级到 embedded baseline search，并把原因写成 resident unavailable / request failure，不误报为 Plugin embedding provider failure。
- 证明 `alembic_task(operation="prime")` 仍保持 Plugin-owned Codex-facing 边界，能返回 delivered `primeKnowledgeMaterial`，Codex 可见响应仍是知识摘要。
- 证明 BiliDili 真实项目在测试前后 git 状态保持干净。

#### 非目标

- 不重新生成 BiliDili Recipes 或向量数据。
- 不启动完整 cold-start / rescan；如果 daemon 或向量状态阻塞，记录阻塞证据，不扩大测试范围。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不刷新本机 Codex plugin cache；cache refresh 是后续 VEC-6 总控动作。
- 不在 AlembicTest 窗口修复 `AlembicPlugin` 或 `Alembic` 源码；发现问题只回填证据和建议归属。

#### 前置版本

- `AlembicPlugin` VEC-4R：`f46e28179aac306e7fff12fe9d7d68965494c1d8`
- AlembicCodex runtime artifact：`daec908a340f4dbe60a8cec643efdc126cf9ff77`
- `Alembic` VEC-4R：`d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`
- `AlembicCore` resident telemetry contract：`39bcebe94c451f92e405b0da38d2cbe67e8e0f82`
- BiliDili Recipes / vector 数据已存在；测试窗口必须记录实际使用的 MCP entry、plugin cache marker、daemon state 和版本。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中调用 `alembic_codex_status`、`alembic_task(operation="prime")`、`alembic_search(auto)`、`alembic_search(semantic)`。
- 建议复用并更新 `AlembicTest/scripts/probe-resident-vector-search.mjs`，重点新增对 `/api/v1/mcp/call` 负向路径的断言。
- 允许只读探测 daemon `/api/v1/search`，用于区分 Plugin handler、resident endpoint 和 telemetry 运行态。
- 禁止写入或修改 BiliDili 仓库受 git 跟踪文件；禁止 cold-start / rescan / 重建向量 / 手动改 plugin dist 或 daemon state。

#### 观察点

- tool / payload 边界：`serviceBoundary.executionPath` 不应为 `daemon-mcp-compat-bridge`；tool list 和 `nextActions` 不应出现 `codex_host_response`。
- direct search：`auto` / `semantic` 至少应成功返回 baseline 或 resident 结果；若 resident ready 且有向量数据，至少一个查询应体现 resident route attempted，并给出 semantic/vector used 或清晰 fallbackReason。
- daemon endpoint：`/api/v1/search` 不应缺失 `searchMeta`；若缺失，按失败记录。
- bridge removal：probe 日志、payload、stderr 或显式负向扫描不得出现对 `POST /api/v1/mcp/call` 的调用；若出现，按失败记录。
- Codex 可见行为：prime 后下一条开发者可见响应仍应由 Codex / 我喊出知识摘要，不默认列 evidenceRefs 或 telemetry dump。
- BiliDili 状态：测试前后 `git -C ../BiliDili status --short --branch` 应保持一致且干净。

#### 验收标准

- 通过：版本证据匹配 VEC-4R；direct `alembic_search` 不再走 `/api/v1/mcp/call`；resident `/api/v1/search` 返回 telemetry；search payload 有 resident metadata 或清晰 baseline fallback；prime delivered 且 Codex 可见呐喊保持摘要；BiliDili 前后干净。
- 失败：仍请求 `/api/v1/mcp/call`；仍出现 `daemon-mcp-compat-bridge`；direct search 整体失败且无 baseline fallback；daemon `/api/v1/search` 没有 `searchMeta`；fallback 被误写成 Plugin embedding failure；BiliDili 被修改。
- 阻塞：实际 MCP entry 未覆盖 VEC-4R 版本、daemon 不可用、BiliDili Recipes / vector 数据缺失、无法读取 prime/search payload 或无法观察 Codex 可见响应。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short --branch
# 记录实际 MCP entry / plugin cache marker / AlembicPlugin / Alembic / Core 版本。
# 调用 alembic_codex_status、alembic_task prime、alembic_search auto/semantic，并保存 payload 摘要。
git -C ../BiliDili status --short --branch
```

#### 回填要求

- 测试结论：失败，但 VEC-4R bridge removal 与 direct search Plugin-owned 路由已部分通过。direct `alembic_search(auto)` / `alembic_search(semantic)` 均 `success=true`，未再出现 `/api/v1/mcp/call` 或 `daemon-mcp-compat-bridge`；`semantic` 返回 `searchMeta.residentSearch.route=alembic-resident-service` 且 `available=true` / `used=true`；但 daemon `/api/v1/search` 裸探测仍 `searchMetaKeys=[]`，direct semantic resident inner `searchMeta={}`，没有 `semanticUsed` / `vectorUsed`，因此不能证明真实 vector route 使用。
- 执行范围：只读调用 Alembic Codex MCP stdio runtime 的 `alembic_codex_status`、`alembic_task prime`、`alembic_search auto`、`alembic_search semantic`，并额外只读探测 daemon `/api/v1/search`；未 cold-start、未 rescan、未重建向量、未刷新 cache、未修改 BiliDili。
- 使用配置：`ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR` 指向 workspace 内 `BiliDili`；MCP entry 使用 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；输出 JSON 为 `AlembicTest/tmp/bilidili-resident-vector-search-vec4r-probe-2026-05-21.json`。
- 版本证据：`AlembicPlugin` HEAD 为 `f46e28179aac306e7fff12fe9d7d68965494c1d8`；AlembicCodex runtime artifact `AlembicPlugin/plugins/alembic-codex` HEAD 为 `daec908a340f4dbe60a8cec643efdc126cf9ff77`；`Alembic` HEAD 为 `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`；`AlembicCore` HEAD 为 `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`；cache marker 仍为 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，但 `localMcpEntry` 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`，本次实际使用 local MCP entry。
- daemon state：health ready，`version=0.1.0`，`mode=daemon`，project 指向 BiliDili，schema migration `009_knowledge_dimension_id`；`ps -axo pid,command` 显示 pid `90465` 运行 `Alembic/dist/bin/daemon-server.js`；daemon health `startedAt=2026-05-21T07:46:15.220Z`，早于 VEC-4R dist 文件 mtime `2026-05-21 23:00:37`，因此裸 `/api/v1/search` 缺少 telemetry 可能是运行中 daemon 尚未重启加载最新 dist。
- `prime` payload 摘要：`success=true`；`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuards=3`；`hostResponse.action=shout_prime_knowledge_receipt`；`timing=immediate_after_prime`；`requiredBeforeNextAction=true`；`visibility=developer_visible`；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`owner=alembic-plugin`、`residentServiceRequested=false`；tool list / `nextActions` 不含 `codex_host_response`。
- direct `alembic_search(auto)` 摘要：`success=true`；actual mode `auto(weighted-fallback,conf=15)`；result count `6`；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`owner=alembic-plugin`、`residentServiceRequested=true`；`searchMeta.residentSearch.route=alembic-resident-service`、`attempted=true`、`available=false`、`used=false`、reason `Query parameter validation failed`、fallbackReason `vector_service_hybrid_unavailable`；baseline fallback 有结果，代表性命中包括 `@schemerouter-url-decoupling`、`@base-viewcontroller-template`、`@main-thread-ui-dispatch`、`@continuation-once-guard`、`@route-error-eight-cases`。
- direct `alembic_search(semantic)` 摘要：`success=true`；actual mode `semantic`；result count `6`；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`owner=alembic-plugin`、`residentServiceRequested=true`；`searchMeta.residentSearch.route=alembic-resident-service`、`attempted=true`、`available=true`、`used=true`、`requestedMode=semantic`、`actualMode=semantic`、`resultCount=12`、fallbackReason `null`；但 `semanticUsed` / `vectorUsed` 未返回，`residentVector.available=false` 且 reason `null`，inner `searchMeta={}`；代表性命中包括 `@base-viewcontroller-template`、`@video-url-preloader-cache`、`@lazy-var-uicomponents`、`@builder-urlrequest-image`、`@session-pool-ignore-urlcache`。
- daemon `/api/v1/search` 摘要：semantic 查询 `VideoFeedViewController lazy var UI SchemeRouter route guard` 返回 HTTP 200、`success=true`、`actualMode=semantic`、`itemCount=6`；`searchMetaKeys=[]`，无 `route`、`service`、`semanticUsed`、`vectorUsed`、`residentVector` 或 fallbackReason；代表性命中包括 `@lazy-var-uicomponents`、`@schemerouter-url-decoupling`、`@async-await-repository-bridge`、`@main-thread-ui-dispatch`、`@base-viewcontroller-template`。
- `/api/v1/mcp/call` 负向证据：probe 对 direct search payload 和 MCP stderr 扫描结果为 `containsMcpCallPath=false`、`containsDaemonCompatBridge=false`。
- Codex 可见行为：prime 后下一条开发者可见响应先做知识摘要并明确分层结论：`Prime 收到了 BiliDili 的关键约束：5 条 Recipe 和 3 条 Guard 已就位；接下来判断会先守住 SchemeRouter 解耦、RouteError/RouteResult、AnalyticsMiddleware 注入、lazy var UI、ModuleManager 生命周期和 Protocol 命名后缀。Resident search 证据留在 payload 中：VEC-4R 已经不再碰 /api/v1/mcp/call，direct search 改为 Plugin-owned；但 daemon /api/v1/search 只读探测仍缺 searchMeta，所以这次结论会更像“部分修复通过、整体测试失败”。`
- 是否默认倾倒 evidenceRefs / telemetry：否。可见响应未列长路径清单、逐条 path:line，也未把 resident telemetry 当作可见呐喊主体。
- BiliDili 状态：测试前 `## main...origin/main`；测试后 `## main...origin/main`；无受 git 跟踪或未跟踪文件变化。
- 详细报告路径：[../../AlembicTest/docs/bilidili-resident-vector-search-vec4r-retest-2026-05-21.md](../../AlembicTest/docs/bilidili-resident-vector-search-vec4r-retest-2026-05-21.md)
- `AlembicTest` commit hash：`e6aae4b4fb146213abd7fa2bfae7335f3c47c0ba`
- 提交范围：`docs/bilidili-resident-vector-search-vec4r-retest-2026-05-21.md`、`scripts/probe-resident-vector-search.mjs`、`scripts/README.md`；共 3 个文件，记录 Test-06 VEC-4R 复测报告、probe bridge removal 负向断言和脚本说明更新。
- 是否仍有未提交变更：`AlembicTest` 仓库无未提交文件变更，`main` 相对 `origin/main` ahead 2；`BiliDili` 仍为 `## main...origin/main`，无未提交变更；本交换文档回填属于 workspace 总控文档变更，按规则留给主控窗口统一提交。
- 遗留风险：当前 daemon 进程可能未加载 VEC-4R 后的最新 `Alembic/dist`，本次按非目标未重启 daemon；`auto` resident 请求仍因 `Query parameter validation failed` 降级；`semantic` resident available / used 但没有 `semanticUsed` / `vectorUsed`，`residentVector.available=false` 且 reason 为 `null`；cache marker 仍是 SHOUT-5，cache refresh 属于后续 VEC-6。
- 下一步建议：总控应将 Test-2026-05-21-06 标记为失败 / 待产品或运行态修复；建议 `Alembic` 窗口确认 running daemon 是否需要重启加载 `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10` 并复核 `/api/v1/search` 是否稳定返回 `searchMeta`；建议 `AlembicPlugin` 窗口确认 `alembic_search(auto)` resident request 的 mode 参数是否要转译，避免 daemon validation failure；修复或刷新运行态后重跑 `AlembicTest/scripts/probe-resident-vector-search.mjs`。

#### 总控验收与后续分派

- 验收结论：Test-2026-05-21-06 证据充分，按失败但部分修复通过处理。通过部分是 VEC-4R bridge removal、Plugin-owned direct search、prime delivered 和 BiliDili 前后干净；失败部分是 daemon `/api/v1/search` 运行态 telemetry 未闭环、direct semantic 无 `semanticUsed` / `vectorUsed`、direct auto resident request mode validation failure。
- 后续分派：已回到 [resident-vector-search-release-workspace-plan-2026-05-21.md](archive/2026-05/resident-vector-search-release/resident-vector-search-release-workspace-plan-2026-05-21.md) 的 VEC-5R，当前只派发 `AlembicPlugin` / `Alembic`。`AlembicTest` 暂不继续复测，等 VEC-5R 回填后再由总控创建下一张测试单。

### Test-2026-05-21-05：BiliDili resident vector search route 真实项目复测

状态：已完成（测试失败，AlembicTest 仓库封口提交完成）
创建日期：2026-05-21
总控来源：resident vector search 发布计划中，`AlembicCore` VEC-1、`Alembic` VEC-1 返工、`AlembicPlugin` VEC-2 / VEC-3 均已通过总控代码复核；需要在 BiliDili 真实项目里验证 Plugin 到 Alembic resident service 的真实 semantic/vector route。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明在 BiliDili 项目上下文中，当前 `AlembicPlugin` 能通过 Alembic resident service 请求真实 semantic/vector search，而不是继续使用 Plugin 内 misleading placeholder embedding provider。
- 证明 `alembic_task(operation="prime")` 的 `primeKnowledgeMaterial` / task intent payload 保留 `searchMeta.residentSearch` 或等价 resident route metadata，能看出 `route=alembic-resident-service`、resident service 是否可用、是否使用 semantic/vector、以及 fallbackReason。
- 证明直接 `alembic_search` 的 `auto` / `semantic` 查询在 resident service 可用且命中时优先返回 resident 结果；resident 不可用或请求失败时，Plugin 降级到 baseline embedded search，并把原因标为 resident enhancement unavailable / resident search failure，而不是误报为 Plugin embedding failure。
- 证明 Codex receipt shout 仍然是开发者可见的知识摘要，不默认倾倒 evidenceRefs 路径 / 行号，也不把 resident telemetry 当作可见呐喊主体。
- 证明 `alembic_task prime` 仍为 Plugin-owned Codex-facing 入口，不出现 `codex_host_response` tool，不把 prime 转成 daemon MCP ownership bridge。
- 证明 BiliDili 真实项目在测试前后 git 状态保持干净。

#### 非目标

- 不重新生成 BiliDili Recipes 或向量数据。
- 不启动完整 cold-start / rescan；如果 resident service 未 ready 或向量数据缺失，记录阻塞或降级证据，不扩大为冷启动任务。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不刷新本机 Codex plugin cache；cache refresh 是 resident vector search 计划 VEC-5，由总控在真实复测通过后处理。
- 不在 AlembicTest 窗口修复 `AlembicCore`、`Alembic` 或 `AlembicPlugin` 源码；发现问题只回填证据和建议归属。

#### 前置条件

- BiliDili Recipes 已由测试线生成完成，且当前测试只读取既有知识库和向量状态。
- `AlembicCore` resident telemetry contract 已完成：commit `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`。
- `Alembic` resident `/api/v1/search` telemetry 已完成并返工通过：commit `d6526aa0541dc8ce54e10d4efe97366b7646e7bf`、`2cfd935b83241ee72263e18528c9647ded65dec7`。
- `AlembicPlugin` VEC-2 / VEC-3 已通过总控代码复核：commit `7a81721061bbaaba437343876a56eec62356297a`；AlembicCodex runtime artifact `c160c062e95329ff0126cb98f1a9c36bbd451678`；embedded Core source `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`。
- 测试窗口必须记录实际使用的 MCP entry、plugin cache marker、runtime artifact 和 daemon 状态；如果 installed cache 尚未覆盖上述 Plugin/runtime 版本，应标为阻塞或使用当前总控计划授权的 workspace local MCP entry，并明确记录入口，不自行刷新 cache。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中通过 Alembic Codex 插件触发 `alembic_task(operation="prime")`，并用 `alembic_search` 执行至少一次 `auto` 或 `semantic` 查询。
- 允许操作：读取 BiliDili git 状态、Alembic Codex MCP status、daemon health / capabilities / search response、prime/search payload、Codex 可见响应、Plugin cache marker、相关日志摘要。
- 禁止操作：不得写入或修改 BiliDili 仓库受 git 跟踪文件；不得冷启动、重扫、重建向量或补造 Recipes；不得手动改 daemon state、cache marker 或 plugin dist 来让测试通过。
- 建议查询：选择 BiliDili 已有 Recipes 能覆盖的语义，例如 `VideoFeedViewController lazy var UI`、`BaseViewController setupUI bindViewModel`、`video URL preloader cache` 或 `repository protocol struct Sendable`。具体查询可由 AlembicTest 根据现有 probe 脚本选择。

#### 观察点

- 版本证据：记录 `AlembicPlugin` HEAD、AlembicCodex runtime artifact、embedded Core source、Alembic daemon source / version、installed cache marker 或 local MCP entry。
- daemon / resident service：记录 daemon 是否 ready、project 是否指向 BiliDili、token / endpoint 是否可用、resident search capability 是否暴露、vector stats 或 HNSW 数据是否存在。
- `prime` payload：记录 `primeKnowledgeMaterial.status`、accepted knowledge / guard 数量、`searchMeta.residentSearch` 或等价 metadata、resident route 是否 attempted / used、fallbackReason。
- `alembic_search` payload：记录 direct search 的 `searchMeta.residentSearch`、`residentVector.available`、`semanticUsed`、`vectorUsed`、`fallbackReason`、结果来源和命中摘要。
- fallback 分类：区分 Alembic 不存在、daemon stale、resident unavailable、resident request failure、resident sparse-only、resident vector used；不得把 Alembic 不存在或 resident failure 写成 Plugin embedding provider failure。
- Codex 可见行为：prime 后下一条开发者可见响应仍应由 Codex / 我喊出知识摘要；不默认列长路径清单、逐条 path:line 或 resident telemetry。
- 工具边界：tool list 和 `nextActions` 不应出现 `codex_host_response`；`alembic_task prime` 仍应是 Plugin-owned Codex-facing path。
- 真实项目状态：测试前后 `git -C ../BiliDili status --short --branch` 应保持一致且干净。

#### 验收标准

- 通过：版本证据匹配当前 VEC-2 / VEC-3；BiliDili 上下文能触发 `prime` 和 direct `alembic_search`；当 resident service ready 且有向量数据时，至少一个 semantic/auto 查询体现 resident route success，并能看到 `route=alembic-resident-service` 与 semantic/vector metadata；resident 不可用或请求失败时，baseline search 正常降级且 metadata 清晰；Codex receipt shout 仍是知识摘要；BiliDili 前后干净。
- 失败：Plugin 仍把 host-managed placeholder embed 当作 executable embedding；`embedAvailable=true` 等 misleading 状态仍出现；resident service ready 且有向量数据但 Plugin 从未尝试 resident search；direct semantic/auto search 没有 resident metadata；fallback 被误写为 Plugin embedding failure；prime 被转到 daemon MCP ownership bridge；BiliDili 被修改。
- 阻塞：daemon 不可用、BiliDili 向量数据缺失、installed cache 未覆盖目标版本且无法使用 local MCP entry、无法读取 prime/search payload 或无法观察 Codex 可见响应。阻塞时只记录证据和最小下一步，不扩大测试范围。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short --branch
# 读取 Codex plugin cache marker / Skill / runtime dist / AlembicPlugin HEAD，确认实际入口。
# 在 BiliDili 项目上下文中调用 alembic_codex_status、alembic_task prime、alembic_search auto/semantic，并保存 payload 摘要。
git -C ../BiliDili status --short --branch
```

#### 回填要求

- 测试结论：失败。BiliDili 上下文可成功触发 `alembic_task(operation="prime")`，但 direct `alembic_search(auto)` 与 `alembic_search(semantic)` 均未返回 resident route metadata，也没有 baseline fallback 结果；daemon `/api/v1/search` 本体能返回 6 条语义命中，但当前运行态没有 `searchMeta` / `residentVector` telemetry，无法证明 semantic/vector route 真实使用。
- 执行范围：只读调用 Alembic Codex MCP stdio runtime 的 `alembic_codex_status`、`alembic_task prime`、`alembic_search auto`、`alembic_search semantic`，并额外只读探测 daemon `/api/v1/search`；未 cold-start、未 rescan、未重建向量、未刷新 cache、未修改 BiliDili。
- 使用配置：`ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR` 指向 workspace 内 `BiliDili`；MCP entry 使用 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；输出 JSON 为 `AlembicTest/tmp/bilidili-resident-vector-search-probe-2026-05-21.json`。
- 版本证据：`AlembicPlugin` HEAD 为 `7a81721061bbaaba437343876a56eec62356297a`；AlembicCodex runtime artifact `AlembicPlugin/plugins/alembic-codex` HEAD 为 `c160c062e95329ff0126cb98f1a9c36bbd451678`；`AlembicCore` HEAD 为 `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`；`Alembic` HEAD 为 `2cfd935b83241ee72263e18528c9647ded65dec7`；cache marker 仍为 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，但 `localMcpEntry` 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`，本次实际使用 local MCP entry。
- daemon 状态证据：health ready，`version=0.1.0`，`mode=daemon`，project 指向 BiliDili，schema migration 为 `009_knowledge_dimension_id`；observed health payload 未暴露 `residentSearch` capability；daemon `/api/v1/search` 可读。
- `prime` payload 摘要：`success=true`；`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuards=3`；未出现 `searchMeta.residentSearch` / `residentVector`；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`owner=alembic-plugin`、`residentServiceRequested=false`；tool list / `nextActions` 不含 `codex_host_response`。
- direct `alembic_search` payload 摘要：`auto` 与 `semantic` 均 `success=false`，message 均为 `Route not found: POST /api/v1/mcp/call`；search payload 的 `serviceBoundary.executionPath=daemon-mcp-compat-bridge`、`owner=alembic-resident-service`、`residentServiceRequested=true`；没有 `searchMeta.residentSearch`、`residentVector`、fallbackReason 或 baseline 结果。
- daemon `/api/v1/search` 摘要：semantic 查询 `VideoFeedViewController lazy var UI SchemeRouter route guard` 返回 HTTP 200、`success=true`、`actualMode=semantic`、`itemCount=6`；`searchMetaKeys=[]`，无 `route`、`service`、`semanticUsed`、`vectorUsed`、`residentVector` 或 fallbackReason；代表性命中包括 `@lazy-var-uicomponents`、`@schemerouter-url-decoupling`、`@async-await-repository-bridge`、`@main-thread-ui-dispatch`、`@base-viewcontroller-template`。
- fallback 证据：direct `alembic_search` 没有进入 baseline fallback；失败被归类为 daemon MCP compat bridge route 缺失，不是 Plugin embedding provider failure，也不是 resident sparse-only fallback。
- Codex 可见行为：prime 后下一条开发者可见响应先做知识摘要并明确归类失败：`Prime 收到了 BiliDili 的 5 条 Recipe 和 3 条 Guard；我后续会先按这些项目约束判断，而不是先散开去读路径清单。最终证据包确认：MCP direct search 被错误桥接到 POST /api/v1/mcp/call，daemon /api/v1/search 能返回 6 条语义命中但没有 resident telemetry，这一轮 Test-05 结论会是失败而不是通过。`
- 是否默认倾倒 evidenceRefs / telemetry：否。可见响应未列长路径清单、逐条 path:line，也未把 resident telemetry 当作可见呐喊主体。
- 工具边界：`codex_host_response` 未出现；`alembic_task prime` 仍为 Plugin-owned Codex-facing；direct `alembic_search` 则被错误路由到 daemon MCP compat bridge。
- BiliDili 状态：测试前 `## main...origin/main`；测试后 `## main...origin/main`；无受 git 跟踪或未跟踪文件变化。
- 详细报告路径：[../../AlembicTest/docs/bilidili-resident-vector-search-route-test-2026-05-21.md](../../AlembicTest/docs/bilidili-resident-vector-search-route-test-2026-05-21.md)
- `AlembicTest` commit hash：`cb1a1c5a9d8f5691d0959b3e0a241c823f5cd8b2`
- 提交范围：`docs/bilidili-resident-vector-search-route-test-2026-05-21.md`、`scripts/probe-resident-vector-search.mjs`、`scripts/README.md`、`package.json`；共 4 个文件，记录 Test-05 resident vector search 测试报告、probe 脚本、脚本说明和 check 命令更新。
- 是否仍有未提交变更：`AlembicTest` 仓库无未提交文件变更，`main` 相对 `origin/main` ahead 1；`BiliDili` 仍为 `## main...origin/main`，无未提交变更；本交换文档回填属于 workspace 总控文档变更，按规则留给主控窗口统一提交。
- 遗留风险：本次不允许 cold-start / rescan / cache refresh，未验证重启 daemon 后是否会暴露新的 `/api/v1/search` telemetry；direct `alembic_search` 未进入 baseline fallback，无法验证成功降级路径；daemon semantic 命中没有 `semanticUsed` / `vectorUsed`，不能作为 resident vector success 证据；原始 probe JSON 位于 `AlembicTest/tmp/`，长期报告只保留脱敏摘要。
- 下一步建议：总控应将 Test-2026-05-21-05 标记为失败 / 待产品修复；建议 `AlembicPlugin` 优先修正 direct `alembic_search` 的 local daemon ready 路由，避免请求当前不存在的 `/api/v1/mcp/call`，并返回 `searchMeta.residentSearch` / `residentVector`；建议 `Alembic` 确认实际 daemon runtime 是否覆盖 `2cfd935b83241ee72263e18528c9647ded65dec7` 的 `/api/v1/search` telemetry；产品修复后再重跑 `AlembicTest/scripts/probe-resident-vector-search.mjs`。

#### 总控验收与后续分派

- 验收结论：Test-2026-05-21-05 证据充分，结论按失败处理，不继续扩大 BiliDili 测试范围。
- 用户决策：删除 `/api/v1/mcp/call` 兼容桥，而不是修补该 route。
- 后续分派：已回到 [resident-vector-search-release-workspace-plan-2026-05-21.md](archive/2026-05/resident-vector-search-release/resident-vector-search-release-workspace-plan-2026-05-21.md) 的 VEC-4R，并已由 `AlembicPlugin` / `Alembic` 完成产品修复；当前 Test-2026-05-21-06 已完成复测，结论为失败但部分修复通过。

### Test-2026-05-21-04：BiliDili prime readable receipt shout 可见摘要复测

状态：已完成（功能通过，AlembicTest 仓库封口提交完成）
创建日期：2026-05-21
总控来源：`AlembicPlugin` SHOUT-5 已通过总控验收并刷新本机 Codex plugin cache；需要在 BiliDili 真实项目中验证 Codex 可见呐喊是否从 evidenceRefs 路径清单转为主动、有声量的知识摘要。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明在 BiliDili 项目上下文中触发 `alembic_task(operation="prime")` 后，Codex 的下一条开发者可见响应仍然先做 receipt shout，再继续任何搜索、读代码、编辑、Guard 或最终总结。
- 证明 delivered 态 receipt shout 默认输出主动、有声量、开发者一眼能懂的知识摘要：喊出接收到的 Recipe / Guard 约束、模式、风险或后续判断依据。
- 证明 Codex 不默认倾倒 evidenceRefs 路径 / 行号，不把“缺少行号”作为可见呐喊重点；证据只作为 payload 中的后续复核材料或用户要求时引用。
- 证明 payload 仍保留 `primeKnowledgeMaterial.acceptedKnowledge[].evidenceRefs` / `acceptedGuards[].evidenceRefs`，且 `hostResponse` 仍包含 `timing=immediate_after_prime`、`requiredBeforeNextAction=true`、`visibility=developer_visible`。
- 证明 installed Codex plugin cache / Skill / MCP runtime 已覆盖 `AlembicPlugin` 提交 `58b82f8526d68aef516d68477d7a0e505fc114e9` 和 AlembicCodex runtime artifact `df608057bd274ebb6b39f6a9c0e964f1b8517426`。
- 证明 BiliDili 真实项目在测试前后 git 状态保持干净。

#### 非目标

- 不重新生成 BiliDili Recipes。
- 不启动完整 cold-start / rescan。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不验证 publish / deprecate / approve / fast_track 等管理权限。
- 不把失败定位直接修在 BiliDili；若插件、Skill、runtime 或 Codex host 行为有问题，回填证据后交回对应源仓库。

#### 前置条件

- BiliDili Recipes 已由测试线生成完成。
- `AlembicPlugin` SHOUT-5 已通过总控验收：Plugin 提交 `58b82f8526d68aef516d68477d7a0e505fc114e9`。
- AlembicCodex runtime artifact 已刷新：`df608057bd274ebb6b39f6a9c0e964f1b8517426`。
- 总控已刷新本机 Codex plugin cache：cache marker `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，`localMcpEntry` 指向 `AlembicPlugin/dist/bin/codex-mcp.js`；cache Skill 已包含 “briefly and actively shout”，cache runtime dist 已包含 “shout a short, active knowledge receipt”。
- 测试前记录 BiliDili git 状态；测试后再次记录，确认真实项目未被修改。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中通过 Codex / Alembic Codex 插件触发 `alembic_task prime`。
- 允许操作：读取 BiliDili 已生成 Recipes、调用 Alembic Codex 插件 prime、截取 / 保存 MCP payload 摘要、记录 prime tool result 后的下一条 Codex 可见回复、读取插件 / daemon / Codex 相关日志。
- 禁止操作：不得写入或修改 BiliDili 业务源码；不得启动 cold-start / rescan；不得清理或重建真实项目；不得把测试脚本写回 BiliDili；不得手动补造 Recipes 来让测试通过。
- 允许读取：BiliDili Recipes、插件 prime 返回 payload、Codex 可见回复、Alembic / plugin runtime 版本和日志、BiliDili git 状态、Codex plugin cache marker 和 Skill 文案。
- 禁止修改：BiliDili 仓库任何受 git 跟踪文件；如运行时产生缓存或临时文件，必须记录路径、原因和是否影响真实项目。

#### 观察点

- 安装态版本：cache marker `gitHead` 应为 `58b82f8526d68aef516d68477d7a0e505fc114e9`；Skill Daily Coding Flow 应包含 “briefly and actively shout” 和 “do not dump paths or line numbers by default”；runtime dist task 应包含 “short, active knowledge receipt”。
- MCP / plugin payload：`success` 应为 true；`data.primeKnowledgeMaterial.status` 应为 `delivered`、`empty` 或 `degraded`；`hostResponse` 必须保留 immediate 时序字段；`shoutInstruction` 必须要求 short / active / real shout，并禁止默认列 evidenceRefs 路径 / 行号。
- Codex 可见行为：prime tool result 后，下一条开发者可见响应必须先做 receipt shout，再继续任何搜索、读代码、编辑、Guard 或最终总结。
- Codex 呐喊内容：delivered 时应像真的呐喊一样主动、有声量地喊出 Recipe / Guard 摘要、关键约束、模式或后续判断依据；不应默认输出长路径清单、逐条 path:line 或“这些 evidenceRefs 缺少行号”。
- 契约回归：payload 和 nextActions 不应包含 `codex_host_response` tool；`alembic_task prime` 仍应为 `plugin-owned-codex-facing` service boundary。
- 真实项目状态：BiliDili 测试前后 git 状态应保持干净。

#### 验收标准

- 通过：版本证据匹配最新 Plugin / runtime / cache；BiliDili 上下文成功触发 `prime`；payload 包含 immediate hostResponse 字段且 evidenceRefs 仍在结构化材料中；Codex 下一条可见响应先做主动、有声量的知识摘要呐喊，再继续任务；默认不倾倒 evidenceRefs 路径 / 行号；无 `codex_host_response` tool；BiliDili 仓库前后不被修改。
- 失败：Codex 静默继续、先搜索 / 读代码 / 编辑 / Guard / 总结再呐喊，或只在最终总结时提到 prime；可见呐喊仍主要是 evidenceRefs 路径 / 行号清单；payload 缺少 `timing` / `requiredBeforeNextAction` / `visibility`；Skill/cache 仍是旧文案但未按阻塞处理；出现 `codex_host_response` tool；BiliDili 被修改。
- 阻塞：插件不可用、Codex MCP 无法启动、BiliDili Recipes 未实际可读、cache marker 不是 `58b82f8526d68aef516d68477d7a0e505fc114e9`，或无法观察 prime 后下一条可见响应；需记录阻塞点和证据，不扩大测试范围。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short --branch
# 读取 Codex plugin cache marker / Skill / runtime dist 以确认安装态版本。
# 在 BiliDili 项目上下文中触发 Alembic Codex 插件 prime，并记录 payload / prime 后下一条 Codex 可见回复。
git -C ../BiliDili status --short --branch
```

#### 回填要求

- 测试结论：通过，已完成总控功能验收与 `AlembicTest` 仓库封口提交。BiliDili 上下文中 `alembic_task(operation="prime")` 成功返回 `primeKnowledgeMaterial.status=delivered`；prime tool result 后下一条开发者可见响应先做主动、有声量的 readable receipt shout，再继续读取 JSON、复核 git 和写报告。
- 执行范围：只读调用 Alembic Codex MCP stdio runtime 的 `alembic_codex_status` 与 `alembic_task prime`；未启动 cold-start / rescan；未修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 使用配置：`ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR` 指向 workspace 内 `BiliDili`；MCP entry 使用 cache marker 指向的 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；agent tier；`ALEMBIC_RUNTIME_MODE=plugin`；输出 JSON 为 `AlembicTest/tmp/bilidili-prime-readable-receipt-shout-probe-2026-05-21.json`。
- plugin / runtime / Core / Alembic daemon / Codex plugin cache 版本证据：cache marker `.alembic-dev-refresh.json` 显示 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`、`localMcpEntry=AlembicPlugin/dist/bin/codex-mcp.js`；`AlembicPlugin` HEAD 为 `58b82f8526d68aef516d68477d7a0e505fc114e9`；AlembicCodex runtime artifact `AlembicPlugin/plugins/alembic-codex` HEAD 为 `df608057bd274ebb6b39f6a9c0e964f1b8517426`；cache Skill 与 runtime Skill 的 `alembic/SKILL.md:25` 包含 `briefly and actively shout` 以及 `do not dump paths or line numbers by default`；cache runtime dist 与 workspace Plugin dist 的 `task.js:281,283` 含 `shout a short, active knowledge receipt` 和 `do not list evidenceRefs paths or line numbers by default`；local daemon status 为 stale，但本次 `serviceBoundary.residentServiceRequested=false`。
- `prime` 调用入口：`node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-readable-receipt-shout-probe-2026-05-21.json`，脚本内部调用 `alembic_task` 参数为 `operation=prime`、`activeFile=Sources/Features/VideoFeed/VideoFeedViewController.swift`、`language=swift`。
- `prime` payload 摘要：`success=true`；`status=delivered`；`acceptedKnowledge=5`；`acceptedGuard=1`；`evidenceRefs=18`，且仍保留在 payload；知识包括 `@schemerouter-url-decoupling`、`@route-error-eight-cases`、`@analytics-middleware-tracker`、`@lazy-var-uicomponents`、`@modulemanager-priority-lifecycle`，Guard 为 `@protocol-naming-suffixes`。
- `hostResponse` 时序字段摘要：`action=shout_prime_knowledge_receipt`；`receiptId=prime-mpfgywqc-1`；`timing=immediate_after_prime`；`required=true`；`requiredBeforeNextAction=true`；`visibility=developer_visible`；`reason` 仍明确要求 receipt 必须是 prime tool result 后、任何后续 tool call / code reading / edit / Guard / final summary 前的下一条开发者可见响应。
- `shoutInstruction` 可见摘要约束摘要：要求 short / active knowledge receipt，像真正的呐喊一样先说收到的 Recipe / Guard 约束，讲出有用模式、guardrails 和后续判断依据；使用 trigger / actionHint / title / summary 让摘要可读；不默认列 evidenceRefs 路径或行号，不默认点出缺少行号；evidenceRefs 留给后续代码阅读、验证或用户要求引用。
- `serviceBoundary` 摘要：`executionPath=plugin-owned-codex-facing`；`owner=alembic-plugin`；`operation=prime`；`tool=alembic_task`；`residentServiceRequested=false`；`sharedContractCandidate=true`。
- prime tool result 后的下一条 Codex 可见响应原文或摘要：`Prime 收到了 BiliDili 的关键知识包：5 条 Recipe 和 1 条 Guard 已就位。接下来判断任何 VideoFeed/Home 相关改动时，我会先守住这些模式：跨 Feature 跳转走 SchemeRouter，不硬耦合页面；路由错误用 RouteError/RouteResult 表达；路由埋点通过闭包注入保持后端解耦；Feature UI 继续用 lazy var 延迟构建；ModuleManager 负责按优先级拆开同步注册和延迟初始化；Protocol 命名按 DI、Repository、Client capability 三层后缀守边界。证据 refs 已保留在 payload 里，需要复核时再展开。`
- 是否先呐喊再继续任务：是。probe tool result 后，下一条开发者可见响应就是 readable receipt shout；之后才继续读取 JSON、复核 BiliDili git 和写报告。
- 是否默认倾倒 evidenceRefs 路径 / 行号：否。可见响应未列长路径清单、逐条 path:line，也未把“缺少行号”作为可见重点；probe 检查 `codexVisibleShoutDefaultsDumpEvidenceRefs=false`。
- payload 中 evidenceRefs 是否仍保留：是。`evidenceRefCount=18`，`payloadEvidenceRefsRetained=true`，供后续复核或用户要求引用时使用。
- 是否出现 `codex_host_response` tool：否。tool list 共 26 个工具，包含 `alembic_task`，不包含 `codex_host_response`；`nextActions` 仅包含可选 `alembic_task(operation=create)`。
- BiliDili git 状态前后对比：测试前 `## main...origin/main`；测试后 `## main...origin/main`；无受 git 跟踪或未跟踪文件变化。
- 关键日志信号：MCP stderr tail 为 `Alembic Codex MCP ready — 26 tools`；probe duration `6711ms`；`shoutInstructionReadable=true`；`shoutInstructionNoDefaultEvidenceDump=true`；status 显示 local daemon stale，但本次 prime 由 Plugin-owned path 成功返回，未请求 resident service。
- 详细报告路径：[../../AlembicTest/docs/bilidili-prime-readable-receipt-shout-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-readable-receipt-shout-test-2026-05-21.md)
- `AlembicTest` commit hash：`60bbd360be147062f834ee881630ca25918663d0`
- 提交范围：`docs/bilidili-prime-readable-receipt-shout-test-2026-05-21.md`、`scripts/probe-codex-prime.mjs`、`scripts/README.md`；共 3 个文件，记录 Test-04 readable receipt shout 测试报告、probe readable/no-default-evidence-dump 检查和脚本说明更新。
- 是否仍有未提交变更：`AlembicTest` 仓库无未提交文件变更，`main` 相对 `origin/main` ahead 1；`BiliDili` 仍为 `## main...origin/main`，无未提交变更；本交换文档回填属于 workspace 总控文档变更，按规则留给主控窗口统一提交。
- 遗留风险：payload 中仍有部分 evidenceRefs 没有行号；SHOUT-5 的验收目标是不把缺行号当作可见重点，当前已通过；local Alembic daemon stale 不影响本次 Plugin-owned prime readable receipt shout，但 Dashboard/daemon handoff 仍需另测；原始 probe JSON 位于 `AlembicTest/tmp/`，长期报告只保留脱敏摘要。
- 下一步建议：总控可关闭 Test-2026-05-21-04；若要提升 evidenceRef 精度，后续交给 Alembic/AlembicCore 知识生成链路补强；若要验证 Dashboard handoff 或 daemon ready，另建独立测试单。
- 建议归属窗口：总控验收归 `AlembicWorkspace`；evidenceRef 行号补强建议归 `Alembic` / `AlembicCore`；本测试不建议改 BiliDili。

#### 总控功能验收

- 验收结论：已完成。`AlembicTest` 回填的 BiliDili 真实项目复测证明 SHOUT-5 已达成：prime tool result 后下一条开发者可见响应先做主动、有声量的知识摘要呐喊，payload 仍保留 evidenceRefs，但可见响应不默认倾倒路径 / 行号；`AlembicTest` 已完成仓库封口提交。
- 关键证据：`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuard=1`；`evidenceRefs=18`；`hostResponse.action=shout_prime_knowledge_receipt`；`timing=immediate_after_prime`；`requiredBeforeNextAction=true`；`visibility=developer_visible`；`serviceBoundary.executionPath=plugin-owned-codex-facing`；`residentServiceRequested=false`。
- 可见呐喊证据：下一条开发者可见响应先喊出 BiliDili 已收到 5 条 Recipe 和 1 条 Guard，并把 SchemeRouter、RouteError / RouteResult、AnalyticsMiddleware、lazy var UI、ModuleManager、Protocol 命名后缀等约束总结成开发者一眼能懂的摘要；仅说明证据 refs 已保留在 payload 中，需要复核时再展开。
- 负向证据：`codexVisibleShoutDefaultsDumpEvidenceRefs=false`；可见响应未列长路径清单、逐条 path:line，也未把“缺少行号”作为可见重点；tool list 和 `nextActions` 均未出现 `codex_host_response`。
- 真实项目状态：BiliDili 测试前后 `git status --short --branch` 均为 `## main...origin/main`，真实项目未被修改。
- 封口提交：`AlembicTest` commit `60bbd360be147062f834ee881630ca25918663d0`，提交范围为 readable receipt shout 测试报告、probe readable/no-default-evidence-dump 检查和 scripts README 更新；`AlembicTest` 当前无未提交文件变更，`main` ahead 1。

### Test-2026-05-21-03：BiliDili prime immediate receipt shout 可见行为复测

状态：已完成（功能通过，AlembicTest 仓库封口提交完成）
创建日期：2026-05-21
总控来源：`AlembicPlugin` 已完成并通过总控验收 prime immediate receipt shout；需要在 BiliDili 真实项目中验证 Codex 可见行为确实是 prime 后立即呐喊，而不是最终总结时才呐喊。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明在 BiliDili 项目上下文中触发 `alembic_task(operation="prime")` 后，Codex 的下一条开发者可见响应就是 knowledge receipt shout。
- 证明该呐喊由 Codex 根据 `primeKnowledgeMaterial` 自主总结，说明接收到哪些 Recipe / Guard / 项目知识、哪些 evidenceRefs 有行号或缺行号，以及 empty / degraded 时不能假装有项目知识。
- 证明 payload 包含 immediate receipt shout 新时序字段：`hostResponse.action === "shout_prime_knowledge_receipt"`、`timing === "immediate_after_prime"`、`requiredBeforeNextAction === true`、`visibility === "developer_visible"`。
- 证明 installed Codex plugin cache / Skill / MCP runtime 已覆盖 `AlembicPlugin` 提交 `829f838704159c7ed205f93ecd986c6234173721` 和 AlembicCodex runtime artifact `682e5d32b9442c1caba9df87f61efb8b0835e870`。
- 证明 BiliDili 真实项目在测试前后 git 状态保持干净。

#### 非目标

- 不重新生成 BiliDili Recipes。
- 不启动完整 cold-start / rescan。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不验证 publish / deprecate / approve / fast_track 等管理权限。
- 不把失败定位直接修在 BiliDili；若插件、Skill、runtime 或 Codex host 行为有问题，回填证据后交回对应源仓库。

#### 前置条件

- BiliDili Recipes 已由测试线生成完成。
- `AlembicPlugin` immediate receipt shout 已通过总控验收：Plugin 提交 `829f838704159c7ed205f93ecd986c6234173721`。
- AlembicCodex runtime artifact 已刷新：`682e5d32b9442c1caba9df87f61efb8b0835e870`。
- 总控已刷新本机 Codex plugin cache：cache marker `gitHead=829f838704159c7ed205f93ecd986c6234173721`，`localMcpEntry` 指向 `AlembicPlugin/dist/bin/codex-mcp.js`；cache Skill 已包含 immediate receipt shout 文案，cache runtime dist 已包含 `immediate_after_prime` / `requiredBeforeNextAction`。
- 测试前记录 BiliDili git 状态；测试后再次记录，确认真实项目未被修改。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中通过 Codex / Alembic Codex 插件触发 `alembic_task prime`。
- 允许操作：读取 BiliDili 已生成 Recipes、调用 Alembic Codex 插件 prime、截取 / 保存 MCP payload 摘要、记录 prime tool result 后的下一条 Codex 可见回复、读取插件 / daemon / Codex 相关日志。
- 禁止操作：不得写入或修改 BiliDili 业务源码；不得启动 cold-start / rescan；不得清理或重建真实项目；不得把测试脚本写回 BiliDili；不得手动补造 Recipes 来让测试通过。
- 允许读取：BiliDili Recipes、插件 prime 返回 payload、Codex 可见回复、Alembic / plugin runtime 版本和日志、BiliDili git 状态、Codex plugin cache marker 和 Skill 文案。
- 禁止修改：BiliDili 仓库任何受 git 跟踪文件；如运行时产生缓存或临时文件，必须记录路径、原因和是否影响真实项目。

#### 观察点

- 安装态版本：cache marker `gitHead` 应为 `829f838704159c7ed205f93ecd986c6234173721`；Skill Daily Coding Flow 应包含 immediate receipt shout；runtime dist task 应包含 `immediate_after_prime` 和 `requiredBeforeNextAction`。
- MCP / plugin payload：`success` 应为 true；`data.primeKnowledgeMaterial.status` 应为 `delivered`、`empty` 或 `degraded`；`hostResponse` 必须包含新时序字段；`shoutInstruction` 必须包含 immediate-before-next-action 语义。
- Codex 可见行为：prime tool result 后，下一条开发者可见响应必须先声明接收到的知识 / empty / degraded，再继续任何搜索、读代码、编辑、Guard 或最终总结。
- Codex 呐喊内容：若 delivered，应包含至少若干具体 Recipe / Guard 名称或 trigger、摘要 / actionHint、路径 / 行号证据；若 evidenceRef line 为 null，应如实说明行号缺失。
- 契约回归：payload 和 nextActions 不应包含 `codex_host_response` tool；`alembic_task prime` 仍应为 `plugin-owned-codex-facing` service boundary。
- 真实项目状态：BiliDili 测试前后 git 状态应保持干净。

#### 验收标准

- 通过：版本证据匹配最新 Plugin / runtime / cache；BiliDili 上下文成功触发 `prime`；payload 包含 immediate hostResponse 字段；Codex 下一条可见响应先做 receipt shout，再继续任务；无 `codex_host_response` tool；BiliDili 仓库前后不被修改。
- 失败：Codex 静默继续、先搜索 / 读代码 / 编辑 / Guard / 总结再呐喊，或只在最终总结时提到 prime；payload 缺少 `timing` / `requiredBeforeNextAction` / `visibility`；Skill/cache 仍是旧文案但未按阻塞处理；出现 `codex_host_response` tool；BiliDili 被修改。
- 阻塞：插件不可用、Codex MCP 无法启动、BiliDili Recipes 未实际可读、cache marker 不是 `829f838704159c7ed205f93ecd986c6234173721`，或无法观察 prime 后下一条可见响应；需记录阻塞点和证据，不扩大测试范围。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short --branch
# 读取 Codex plugin cache marker / Skill / runtime dist 以确认安装态版本。
# 在 BiliDili 项目上下文中触发 Alembic Codex 插件 prime，并记录 payload / prime 后下一条 Codex 可见回复。
git -C ../BiliDili status --short --branch
```

#### 回填要求

- 测试结论：通过，已完成总控功能验收与 `AlembicTest` 仓库封口提交。BiliDili 上下文中 `alembic_task(operation="prime")` 成功返回 `primeKnowledgeMaterial.status=delivered`，且 prime tool result 后下一条开发者可见响应先声明收到的 Recipe / Guard / evidenceRefs，再继续读取 probe JSON、复核 git 和写报告。
- 执行范围：只读调用 Alembic Codex MCP stdio runtime 的 `alembic_codex_status` 与 `alembic_task prime`；未启动 cold-start / rescan；未修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 使用配置：`ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR` 指向 workspace 内 `BiliDili`；MCP entry 使用 cache marker 指向的 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；agent tier；`ALEMBIC_RUNTIME_MODE=plugin`；输出 JSON 为 `AlembicTest/tmp/bilidili-prime-immediate-receipt-shout-probe-2026-05-21.json`。
- plugin / runtime / Core / Alembic daemon / Codex plugin cache 版本证据：cache marker `.alembic-dev-refresh.json` 显示 `gitHead=829f838704159c7ed205f93ecd986c6234173721`、`localMcpEntry=AlembicPlugin/dist/bin/codex-mcp.js`；`AlembicPlugin` 当前 HEAD `681b8b6db02b0cd82b4e85e91574faa1e4572547` 且包含目标提交 `829f838704159c7ed205f93ecd986c6234173721`；AlembicCodex runtime artifact `AlembicPlugin/plugins/alembic-codex` HEAD 为 `682e5d32b9442c1caba9df87f61efb8b0835e870`；cache Skill 与 runtime Skill 的 `alembic/SKILL.md:25` 已要求 prime 后立即 receipt shout；cache runtime dist 与 workspace Plugin dist 的 `task.js:307,309,310` 含 `immediate_after_prime` / `requiredBeforeNextAction` / `developer_visible`；local daemon status 为 stale，但本次 `serviceBoundary.residentServiceRequested=false`。
- `prime` 调用入口：`node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-immediate-receipt-shout-probe-2026-05-21.json`，脚本内部调用 `alembic_task` 参数为 `operation=prime`、`activeFile=Sources/Features/VideoFeed/VideoFeedViewController.swift`、`language=swift`。
- `prime` payload 摘要：`success=true`；`status=delivered`；`acceptedKnowledge=5`；`acceptedGuard=1`；`evidenceRefs=18`；知识包括 `@schemerouter-url-decoupling`、`@route-error-eight-cases`、`@analytics-middleware-tracker`、`@lazy-var-uicomponents`、`@modulemanager-priority-lifecycle`，Guard 为 `@protocol-naming-suffixes`。
- `hostResponse` 新时序字段摘要：`action=shout_prime_knowledge_receipt`；`receiptId=prime-mpffae1u-1`；`timing=immediate_after_prime`；`required=true`；`requiredBeforeNextAction=true`；`visibility=developer_visible`；`reason` 明确要求此 receipt 必须是 prime tool result 后、任何后续 tool call / code reading / edit / Guard / final summary 前的下一条开发者可见响应。
- `serviceBoundary` 摘要：`executionPath=plugin-owned-codex-facing`；`owner=alembic-plugin`；`operation=prime`；`tool=alembic_task`；`residentServiceRequested=false`；`sharedContractCandidate=true`。
- prime tool result 后的下一条 Codex 可见响应原文或摘要：已先声明“收到 5 条 Recipe、1 条 Guard”，列出 SchemeRouter、RouteError、AnalyticsMiddleware、lazy var UI、ModuleManager、Protocol 命名后缀，并说明 `SchemeRoute.swift:8` 有行号，其余多条 evidenceRefs 只有路径无行号，不会伪装精确行号；同时声明 receipt `prime-mpffae1u-1` 已在任何后续验证动作前完成。
- 是否先呐喊再继续任务：是。probe tool result 后，下一条开发者可见响应就是 receipt shout；之后才继续读取 JSON、复核 BiliDili git 和写报告。
- 是否出现 `codex_host_response` tool：否。tool list 共 26 个工具，包含 `alembic_task`，不包含 `codex_host_response`；`nextActions` 仅包含可选 `alembic_task(operation=create)`。
- BiliDili git 状态前后对比：测试前 `## main...origin/main`；测试后 `## main...origin/main`；无受 git 跟踪或未跟踪文件变化。
- 关键日志信号：MCP stderr tail 为 `Alembic Codex MCP ready — 26 tools`；probe duration `4990ms`；status policy 有 `CODEX_DAEMON_STALE` warning，但本次 prime 由 Plugin-owned path 成功返回，未请求 resident service。
- 详细报告路径：[../../AlembicTest/docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md)
- `AlembicTest` commit hash：`b532cd8bf7c40c8f12b93f91380befdea617d999`
- 提交范围：`docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md`、`scripts/probe-codex-prime.mjs`、`scripts/README.md`；共 3 个文件，记录 Test-03 测试报告、probe immediate timing 字段校验和脚本说明更新。
- 是否仍有未提交变更：`AlembicTest` 仓库无未提交文件变更，`main` 相对 `origin/main` ahead 1；`BiliDili` 仍为 `## main...origin/main`，无未提交变更；本交换文档回填属于 workspace 总控文档变更，按规则留给主控窗口统一提交。
- 遗留风险：多数 evidenceRefs 只有路径没有行号，payload 和可见呐喊已如实说明，不阻塞本次通过；local Alembic daemon stale 不影响本次 Plugin-owned prime immediate receipt shout，但 Dashboard/daemon handoff 仍需另测；原始 probe JSON 位于 `AlembicTest/tmp/`，长期报告只保留脱敏摘要。
- 下一步建议：总控验收通过后可关闭 Test-2026-05-21-03；若要提升证据精度，后续交给 Alembic/AlembicCore 知识生成链路补强 evidenceRef 行号；若要验证 Dashboard handoff 或 daemon ready，另建独立测试单。
- 建议归属窗口：总控验收归 `AlembicWorkspace`；evidenceRef 行号补强建议归 `Alembic` / `AlembicCore`；本测试不建议改 BiliDili。

### Test-2026-05-21-02：BiliDili prime shout service boundary 复测

状态：已完成（功能通过，AlembicTest 仓库封口提交完成）
创建日期：2026-05-21
总控来源：`AlembicPlugin` 已完成并通过总控验收 service request 边界修复，需要在 BiliDili 真实项目中复测 `prime` 注入和 Codex 知识呐喊。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明 Alembic Codex 插件在 BiliDili 项目根上下文中调用 `alembic_task(operation="prime")` 时，不再因为 local Alembic daemon ready 而把 Codex-facing prime 转发到 `/api/v1/mcp/call`。
- 证明返回 payload 包含 Plugin 生成的 `data.primeKnowledgeMaterial`、`hostResponse.action === "shout_prime_knowledge_receipt"`、`shoutInstruction` 和 `data.serviceBoundary`。
- 证明 Codex 在拿到 prime 后做开发者可见的知识呐喊：说明它接收到了哪些 BiliDili Recipe / Guard / 项目知识，引用哪些路径 / 行号证据，并如实说明 empty / degraded 情况。
- 证明 BiliDili 真实项目在测试前后 git 状态保持干净。

#### 非目标

- 不重新生成 BiliDili Recipes。
- 不启动完整 cold-start / rescan。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不验证 publish / deprecate / approve / fast_track 等管理权限。
- 不把失败定位直接修在 BiliDili；若插件、Core 或 Alembic resident service 有问题，回填证据后交回对应源仓库。

#### 前置条件

- BiliDili Recipes 已由测试线生成完成。
- `AlembicPlugin` service request 边界已通过总控验收：Plugin 提交 `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`。
- AlembicCodex runtime artifact 已刷新：`7a7c5dce492c632e4ee3301f7eb989faec1d5118`。
- `Alembic` daemon MCP bridge 兼容修复已完成：提交 `83130a6add9806c124d334281a0ec7f219afd33e`；本测试不把它作为 prime 主路径，只用于观察是否被绕开。
- 测试前记录 BiliDili git 状态；测试后再次记录，确认真实项目未被修改。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中通过 Codex / Alembic Codex 插件触发 `alembic_task prime`。
- 允许操作：读取 BiliDili 已生成 Recipes、调用 Alembic Codex 插件 prime、截取 / 保存 MCP payload 摘要、记录 Codex 可见回复、读取插件 / daemon / Codex 相关日志。
- 禁止操作：不得写入或修改 BiliDili 业务源码；不得启动 cold-start / rescan；不得清理或重建真实项目；不得把测试脚本写回 BiliDili；不得手动补造 Recipes 来让测试通过。
- 允许读取：BiliDili Recipes、插件 prime 返回 payload、Codex 可见回复、Alembic / plugin runtime 版本和日志、BiliDili git 状态。
- 禁止修改：BiliDili 仓库任何受 git 跟踪文件；如运行时产生缓存或临时文件，必须记录路径、原因和清理建议。

#### 观察点

- MCP / plugin payload：`success` 应为 true；`data.primeKnowledgeMaterial` 应包含 `acceptedKnowledge`、`acceptedGuards` 或等价知识材料、`evidenceRefs`、`shoutInstruction`、`hostResponse`。
- Service boundary：`data.serviceBoundary.executionPath === "plugin-owned-codex-facing"`、`owner === "alembic-plugin"`、`residentServiceRequested === false`、`tool === "alembic_task"`。
- Codex 呐喊：Codex 在拿到 prime 后，应以开发者可见自然语言说明“我接收到了哪些 BiliDili 项目知识”，并包含至少若干具体 Recipe / Guard 名称或摘要、对应路径 / 行号证据，以及对空结果 / 降级的如实说明。
- 契约回归：`nextActions` 不应包含 `tool: "codex_host_response"`；如果 payload 有宿主回复动作，应以非 MCP tool 语义字段表达。
- 路由回归：如果日志能观察到请求路径，应确认 `prime` 不走 daemon MCP bridge；若无法直接观察，也必须以 `serviceBoundary`、payload 和错误形态判断。
- 真实项目状态：BiliDili 测试前后 git 状态应保持干净；如果有运行时生成文件，必须说明是否未跟踪、是否应清理，以及是否影响真实项目。
- 版本证据：记录 AlembicPlugin / AlembicCodex runtime / embedded Core / Alembic daemon 的提交或 source snapshot，确认测试覆盖的是最新验收后的插件。

#### 验收标准

- 通过：在 BiliDili 项目上下文中成功触发 `prime`，返回真实知识材料和 `plugin-owned-codex-facing` service boundary，Codex 做出可见知识呐喊，payload 中无虚构 `codex_host_response` MCP tool，BiliDili 仓库前后不被修改。
- 失败：`prime` 返回 empty / degraded 且无法解释为有效无数据；Codex 静默继续或只说“已完成”而未声明接收到的知识；payload 仍暴露 `codex_host_response` tool；`serviceBoundary` 缺失或仍显示 daemon ownership；`acceptedKnowledge` / evidence refs 缺失；BiliDili 被修改。
- 阻塞：插件不可用、Codex MCP 无法启动、BiliDili Recipes 未实际可读、或 runtime 版本不是本次验收后的插件；需记录阻塞点和证据，不扩大测试范围。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short
# 在 BiliDili 项目上下文中触发 Alembic Codex 插件 prime，并记录 payload / Codex 可见回复。
git -C ../BiliDili status --short
```

#### 回填要求

- 测试结论：
- 执行范围：
- 使用配置：
- plugin / runtime / Core / Alembic daemon 版本证据：
- `prime` 调用入口：
- `prime` payload 摘要：
- `serviceBoundary` 摘要：
- Codex 知识呐喊原文或摘要：
- 是否出现 `codex_host_response` tool：
- 是否观察到 daemon bridge 被绕开：
- BiliDili git 状态前后对比：
- 关键日志信号：
- 详细报告路径：建议 `AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md`
- 遗留风险：
- 下一步建议：
- 建议归属窗口：

### Test-2026-05-21-01：BiliDili prime 注入与 Codex 知识呐喊插件验证

状态：已完成
创建日期：2026-05-21
总控来源：用户说明 BiliDili 项目的 Recipes 已生成完成，要求在 BiliDili 项目里进行插件测试，检查 `prime` 注入和 Codex 呐喊。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明 Alembic Codex 插件在 BiliDili 项目根上下文中可以读取已生成 Recipes，并通过 `alembic_task prime` 返回真实的 `primeKnowledgeMaterial`。
- 证明 `primeKnowledgeMaterial` 能支撑 Codex host agent 做开发者可见的知识呐喊：Codex 需要主动说明它从 prime 接收到了哪些 BiliDili 项目知识、引用了哪些路径 / 行号证据、是否有 Guard / Recipe 约束，以及是否存在 empty / degraded 风险。
- 证明 Recipe 交互契约 Wave 1 的可见行为已进入插件真实运行面：`nextActions` 不再暴露虚构 `codex_host_response` MCP tool；宿主可见回复动作应通过 `hostResponse` / `shoutInstruction` 表达。

#### 非目标

- 不重新生成 BiliDili Recipes。
- 不启动完整 cold-start / rescan。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不验证 publish / deprecate / approve / fast_track 等管理权限；默认 Codex agent 仍不应拥有这些能力。
- 不把失败定位直接修在 BiliDili；若插件或 Core 有问题，回填证据后交回对应源仓库。

#### 前置条件

- BiliDili Recipes 已由测试线生成完成。
- `AlembicPlugin` 已包含 Recipe 交互契约 Wave 1：Plugin 提交 `8602ae9e71874af389709db680104b2c1ee0edbb`，AlembicCodex runtime 提交 `4abb80efca55d37dc39667facdd18e8a35a08cad`。
- `AlembicCore` 已包含 Recipe 交互契约 Wave 1：Core 提交 `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`。
- 测试前记录 BiliDili git 状态；测试后再次记录，确认真实项目未被修改。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中通过 Codex / Alembic Codex 插件触发 `alembic_task prime`。
- 允许操作：读取 BiliDili 已生成 Recipes、调用 Alembic Codex 插件 prime、截取 / 保存 MCP payload 摘要、记录 Codex 可见回复、读取插件 / daemon / Codex 相关日志。
- 禁止操作：不得写入或修改 BiliDili 业务源码；不得启动 cold-start / rescan；不得清理或重建真实项目；不得把测试脚本写回 BiliDili；不得手动补造 Recipes 来让测试通过。
- 允许读取：BiliDili Recipes、插件 prime 返回 payload、Codex 可见回复、Alembic / plugin runtime 版本和日志、BiliDili git 状态。
- 禁止修改：BiliDili 仓库任何受 git 跟踪文件；如运行时产生缓存或临时文件，必须记录路径、原因和清理建议。

#### 观察点

- MCP / plugin payload：`status` 应为 `delivered`；`data.primeKnowledgeMaterial` 应包含 `acceptedKnowledge`、`acceptedGuards` 或等价知识材料、`evidenceRefs`、`shoutInstruction`、`hostResponse`。
- Codex 呐喊：Codex 在拿到 prime 后，应以开发者可见自然语言说明“我接收到了哪些 BiliDili 项目知识”，并包含至少若干具体 Recipe / Guard 名称或摘要、对应路径 / 行号证据，以及对空结果 / 降级的如实说明。
- 契约回归：`nextActions` 不应包含 `tool: "codex_host_response"`；如果 payload 有宿主回复动作，应以非 MCP tool 语义字段表达。
- 真实项目状态：BiliDili 测试前后 git 状态应保持干净；如果有运行时生成文件，必须说明是否未跟踪、是否应清理，以及是否影响真实项目。
- 版本证据：记录 AlembicPlugin / AlembicCodex runtime / embedded Core 的提交或 source snapshot，确认测试覆盖的是最新验收后的插件。

#### 验收标准

- 通过：在 BiliDili 项目上下文中成功触发 `prime`，返回真实知识材料，Codex 做出可见知识呐喊，payload 中无虚构 `codex_host_response` MCP tool，BiliDili 仓库前后不被修改。
- 失败：`prime` 返回 empty / degraded 且无法解释为有效无数据；Codex 静默继续或只说“已完成”而未声明接收到的知识；payload 仍暴露 `codex_host_response` tool；`acceptedKnowledge` / evidence refs 缺失；BiliDili 被修改。
- 阻塞：插件不可用、Codex MCP 无法启动、BiliDili Recipes 未实际可读、或 runtime 版本不是本次验收后的插件；需记录阻塞点和证据，不扩大测试范围。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short
# 在 BiliDili 项目上下文中触发 Alembic Codex 插件 prime，并记录 payload / Codex 可见回复。
git -C ../BiliDili status --short
```

#### 回填要求

- 测试结论：
- 执行范围：
- 使用配置：
- plugin / runtime / Core 版本证据：
- `prime` 调用入口：
- `prime` payload 摘要：
- Codex 知识呐喊原文或摘要：
- 是否出现 `codex_host_response` tool：
- BiliDili git 状态前后对比：
- 关键日志信号：
- 详细报告路径：建议 `AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md`
- 遗留风险：
- 下一步建议：
- 建议归属窗口：

## 可复制提示词

发送给：无。

`Test-2026-05-22-01` 已由 `AlembicTest` 完成复测并封口提交，commit `0943ce085a1cb9c84141cc6c85673418c8248e29`。当前交流文档不再派发 AlembicTest；后续 cache refresh、发布态验证或新一轮真实项目复测应由总控回到 [resident-vector-search-release-workspace-plan-2026-05-21.md](archive/2026-05/resident-vector-search-release/resident-vector-search-release-workspace-plan-2026-05-21.md) 判断后另行创建测试单。

当前不派发 `AlembicTest`、`AlembicPlugin`、`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard` 或 `BiliDili`。

## 统一测试单模板

统一模板保存在 [../../templates/alembic-test-handoff-template.md](../../templates/alembic-test-handoff-template.md)。总控创建测试单时，从该模板复制到本文“当前测试单”或新建具体测试单段落；本文只保留当前测试交流状态，不重复维护模板正文。

## 回填区

### Test-2026-05-21-03 总控功能验收

- 2026-05-21：总控功能验收通过。证据满足测试单通过条件：BiliDili 上下文 `alembic_task prime` 成功；`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuards=1`；`evidenceRefs=18`；`hostResponse.action=shout_prime_knowledge_receipt`；`hostResponse.timing=immediate_after_prime`；`hostResponse.requiredBeforeNextAction=true`；`hostResponse.visibility=developer_visible`；`serviceBoundary.executionPath=plugin-owned-codex-facing`；`residentServiceRequested=false`；tool list / `nextActions` 均不含 `codex_host_response`；prime tool result 后下一条开发者可见响应先声明收到 5 条 Recipe 和 1 条 Guard，再继续读取 JSON、复核 git 和写报告；BiliDili 测试前后 `git status --short --branch` 均为 `## main...origin/main`。
- 2026-05-21：功能验收后曾发现 `AlembicTest` 仓库仍有未提交变更：`scripts/README.md`、`scripts/probe-codex-prime.mjs`，以及未跟踪报告 `docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md`，因此当时先派发 `AlembicTest` 做封口提交。
- 2026-05-21：`AlembicTest` 已封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；提交范围为 `docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md`、`scripts/probe-codex-prime.mjs`、`scripts/README.md`；`AlembicTest` 与 BiliDili 工作区均干净。Test-2026-05-21-03 最终状态为已完成。

### Test-2026-05-21-02 回填

- 测试结论：通过，已完成总控功能验收与 AlembicTest 仓库封口提交。`alembic_task prime` 在 BiliDili 上下文成功返回 delivered `primeKnowledgeMaterial`、`hostResponse`、`shoutInstruction` 和 `serviceBoundary`；Codex 可基于 payload 做知识接收呐喊；BiliDili git 前后保持干净。
- 执行范围：通过 AlembicTest 自有脚本启动 Alembic Codex MCP stdio runtime，在 BiliDili 上下文调用 `alembic_codex_status` 和 `alembic_task(operation=prime)`；未启动 cold-start / rescan；未修改 BiliDili 源码。
- 使用配置：目标项目 `BiliDili`；active file `Sources/Features/VideoFeed/VideoFeedViewController.swift`；language `swift`；prime query 聚焦 VideoFeed/Home、模块边界、Repository、lazy var、SchemeRouter 和 Guard 约束。
- plugin / runtime / Core / Alembic daemon 版本证据：AlembicPlugin `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`；AlembicCore `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`；Alembic 当前 HEAD `ae52f823d0ab0bb4bbb846c5cdeaed76924e3cf3`；插件 package `alembic-ai@0.1.2`；local daemon `http://127.0.0.1:63030` ready，version `0.1.0`。总控列出的 daemon bridge 修复提交 `83130a6add9806c124d334281a0ec7f219afd33e` 已被当前 Alembic HEAD 后续提交覆盖。
- `prime` 调用入口：`node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-service-boundary-probe-2026-05-21.json`。
- `prime` payload 摘要：`success=true`；`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuards=1`；`evidenceRefs=18`；`hostResponse.action=shout_prime_knowledge_receipt`；`hostResponse.required=true`；`shoutInstruction` 存在；`nextActions` 仅建议 `alembic_task operation=create`，不含 `codex_host_response`。
- `serviceBoundary` 摘要：`executionPath=plugin-owned-codex-facing`；`operation=prime`；`owner=alembic-plugin`；`residentServiceRequested=false`；`tool=alembic_task`；reason 明确说明 local daemon readiness must not transfer tool ownership。
- Codex 知识呐喊原文或摘要：Codex 可见呐喊说明已接收 5 条 Recipe 和 1 条 Guard，包括 `@schemerouter-url-decoupling`、`@route-error-eight-cases`、`@analytics-middleware-tracker`、`@lazy-var-uicomponents`、`@modulemanager-priority-lifecycle` 和 Guard `@protocol-naming-suffixes`，并引用 BiliDili/AppCoordinator、RouterModule、SceneDelegate、SchemeRoute.swift:8、RouteMiddleware、Feature ViewController、ServiceProtocols 等证据；无行号的 evidenceRef 已如实标注行号缺失。
- 是否出现 `codex_host_response` tool：未出现。MCP tool list 不含 `codex_host_response`，`primeKnowledgeMaterial.nextActions` 也不含该 tool。
- 是否观察到 daemon bridge 被绕开：是。运行前 `/api/v1/mcp/call` 日志记录为 combined.log 2 次、daemon.log 0 次；运行后仍为 combined.log 2 次、daemon.log 0 次，未新增 daemon bridge 请求；同时 payload 的 `serviceBoundary.executionPath` 明确为 `plugin-owned-codex-facing`。
- BiliDili git 状态前后对比：测试前后均为 `## main...origin/main`，无 tracked/untracked 变更。
- 关键日志信号：插件本地初始化成功；Search index built，entries=79；QueryRouter 对 BiliDili / VideoFeed / SchemeRouter 等 query 完成搜索；VectorService embedding 因插件不捆绑 AI execution 降级到 sparse-only，但 prime 仍 delivered。
- 详细报告路径：[../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md)
- 遗留风险：本次测试使用 workspace 内 AlembicPlugin 本地 `dist` 入口；全局 Codex plugin cache refresh marker 可能仍是旧 git head，若要验证真实安装态需另行授权刷新缓存后复测。部分 evidenceRef 无行号，payload/呐喊已如实暴露；如需强制行号级证据，应回到 Recipe/sourceRefs 生成链路补强。插件运行时 embedding 降级为 sparse-only，不阻塞本次通过，但可作为质量优化项。
- 下一步建议：总控可将 Test-2026-05-21-02 标记为通过 / 已完成；如需要覆盖真实 Codex 安装态，再安排插件 cache refresh 后复测。
- 建议归属窗口：`AlembicWorkspace` 总控验收；可选后续为 `AlembicPlugin` 优化 sparse-only / evidenceRef 行号提示。

### Test-2026-05-21-02 总控功能验收

- 2026-05-21：总控功能验收通过。证据满足测试单通过条件：`prime.success=true`；`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuards=1`；`checks.evidenceRefCount=18`；`hostResponse.action=shout_prime_knowledge_receipt` 且 `required=true`；`shoutInstruction` 存在；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`owner=alembic-plugin`、`residentServiceRequested=false`；`nextActions` 不含 `codex_host_response`；BiliDili 测试前后 `git status --short --branch` 均为 `## main...origin/main`。
- 2026-05-21：AlembicTest 仓库封口完成，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`。
- 提交范围：`package.json`、`scripts/README.md`、`scripts/probe-codex-prime.mjs`、`docs/bilidili-prime-shout-plugin-test-2026-05-21.md`、`docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md`、`docs/cold-start-bootstrap-analysis-2026-05-21.md`。
- 是否仍有未提交变更：AlembicTest 仓库无未提交文件变更；当前 `main` 分支相对 `origin/main` ahead 1，等待后续按总控需要 push。
- 遗留风险：本次提交只封口 AlembicTest 测试证据和 probe 脚本，不覆盖真实 Codex 已安装插件缓存刷新；如需验证用户实际安装态，仍需单独授权刷新插件 cache 后复测。部分 Recipe evidenceRef 仍无行号，当前测试已如实记录，不阻塞 service boundary 验收。

### Test-2026-05-21-01 回填

- 测试结论：失败。BiliDili Recipes 和插件 status 读取层通过，但真实 `alembic_task prime` 在 Plugin -> local Alembic daemon MCP bridge 处被 404 截断，未返回 `primeKnowledgeMaterial`，因此无法完成 delivered 知识呐喊验收。
- 执行范围：通过 AlembicTest 自有脚本启动 Alembic Codex MCP stdio runtime，在 BiliDili 上下文调用 `alembic_codex_status` 和 `alembic_task(operation=prime)`；未启动 cold-start / rescan；未修改 BiliDili 源码。
- 使用配置：目标项目 `BiliDili`；active file `Sources/Features/VideoFeed/VideoFeedViewController.swift`；language `swift`；prime query 聚焦 VideoFeed/Home、模块边界、Repository、lazy var、SchemeRouter 和 Guard 约束。
- plugin / runtime / Core 版本证据：AlembicPlugin `8602ae9e71874af389709db680104b2c1ee0edbb`；AlembicCore `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`；插件 package `alembic-ai@0.1.2`；local daemon version `0.1.0`；当前已安装 Codex plugin cache 标记仍是旧 git head，未在本测试中同步全局插件缓存。
- `prime` 调用入口：`node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-probe-2026-05-21-escalated.json`。
- `prime` payload 摘要：status probe 显示 `initialized=true`、`knowledge_ready`、`recipeCount=79`、`sourceRefs=196`、vector `ready`、`alembic_task` 工具可见；prime 返回 `success=false`、`CODEX_MCP_ERROR`、`Route not found: POST /api/v1/mcp/call`。
- Codex 知识呐喊原文或摘要：因未收到 `primeKnowledgeMaterial`，Codex 只能如实声明“我没有收到 primeKnowledgeMaterial，因此不能声称接收到了 BiliDili 的 Recipe 或 Guard 知识。”这不满足测试单要求的 delivered 知识呐喊。
- 是否出现 `codex_host_response` tool：MCP tool list 中未出现 `codex_host_response`；但由于 prime payload 缺失，无法验证 `nextActions` payload 层是否正确。
- BiliDili git 状态前后对比：测试前后均为 `## main...origin/main`，无 tracked/untracked 变更。
- 关键日志信号：daemon health ready；直接 POST `/api/v1/mcp/call` 返回 404 `NOT_FOUND`；daemon 日志记录 `/api/v1/mcp/call` 404 HTTP 请求。
- 详细报告路径：[../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md)
- 遗留风险：Plugin 在 `requirement: "mcp"` 时仅凭 daemon API ready 选择 `local-alembic-daemon`，没有确认 MCP bridge endpoint；本地 daemon health 未声明 MCP bridge capability；实际 Codex installed cache 可能尚未同步到目标提交。
- 下一步建议：`Alembic` 已补齐 `/api/v1/mcp/call` 兼容 bridge；后续由 `AlembicPlugin` 修正 service request 边界，让 Codex-facing `alembic_task prime` 留在 Plugin 并保留 `primeKnowledgeMaterial` / `hostResponse` / `shoutInstruction`；修复后由 `AlembicTest` 重跑本测试单。
- 建议归属窗口：`AlembicPlugin`，修复后回到 `AlembicTest` 复测。

### 总控验收

- 2026-05-21：总控验收 Test-2026-05-21-01 为“失败但有效”。证据满足失败分类：BiliDili Recipes/status 可读，`alembic_task` 可见，MCP tool list 不暴露 `codex_host_response`，BiliDili git 前后干净；但真实 `prime` 被 Plugin -> Alembic daemon `/api/v1/mcp/call` 404 截断，未返回 `primeKnowledgeMaterial`，因此未形成 Codex 知识呐喊闭环。
- 当时后续动作：`Alembic` bridge 修复 wave 已收口；`AlembicPlugin` service request 边界通过总控验收后，已创建 Test-2026-05-21-02 并发送给 `AlembicTest` 复测。

### Test-2026-05-21-02 总控创建

- 2026-05-21：总控创建 Test-2026-05-21-02，状态为 `待启动`。测试重点是 BiliDili 真实项目上下文中的 `alembic_task prime` payload、`data.serviceBoundary.executionPath === "plugin-owned-codex-facing"`、Codex 知识呐喊、无 `codex_host_response` MCP tool 回归和 BiliDili git 前后干净。
