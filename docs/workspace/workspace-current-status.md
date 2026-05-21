# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：resident vector search 发布计划已完成，等待下一主线启动

## 状态摘要

新的主线是用户确认的方向：删除 `AlembicPlugin` 中会误导为 embedding 可执行的占位逻辑，并连接 `AlembicPlugin` 与本地 `Alembic` resident service，让 Codex prime / search 能使用 Alembic 已经生成的真实向量索引和本地千问 embedding 能力。

已确认的真实事实：

- BiliDili Ghost workspace 已有 HNSW 向量索引，118 条向量，1024 维。
- 本地 Ollama 已安装 `qwen3-embedding:0.6b`；手动生成 query embedding 后直查 BiliDili HNSW，6ms 返回真实 Recipe 命中。
- `Alembic` resident service 的 `/api/v1/search?mode=semantic` 能返回真实语义命中。
- `AlembicPlugin` 当前 HostAiAdapter 会给 host-managed provider 塞入占位 `embed()`，随后又把这个占位函数误判成可执行 embedding provider，导致 `VectorService` 运行时抛出 `AI execution is provided by the host agent and is not bundled in AlembicPlugin.` 并降级为 sparse-only。

当前发布计划：[resident-vector-search-release-workspace-plan-2026-05-21.md](resident-vector-search-release-workspace-plan-2026-05-21.md) 已完成。`AlembicCore` 已完成 resident search contract；`Alembic` 提交 `d6526aa0541dc8ce54e10d4efe97366b7646e7bf` 暴露 telemetry，返工提交 `2cfd935b83241ee72263e18528c9647ded65dec7` 已修正 Core `searchMeta` 覆盖问题。`AlembicPlugin` 已完成 VEC-2/VEC-3 并通过总控代码复核。`AlembicTest` Test-2026-05-21-05 已完成且结论失败：direct `alembic_search` 被错误桥接到不存在的 `/api/v1/mcp/call`，daemon `/api/v1/search` 能命中但运行态未返回 telemetry。用户确认删除 `/api/v1/mcp/call` 后，`AlembicPlugin` 已提交 `f46e28179aac306e7fff12fe9d7d68965494c1d8`，AlembicCodex runtime artifact 为 `daec908a340f4dbe60a8cec643efdc126cf9ff77`；`Alembic` 已提交 `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10` 删除 daemon MCP compat bridge。`AlembicTest` Test-2026-05-21-06 已完成且结论为失败但部分通过：direct search 已离开 `/api/v1/mcp/call`，但 daemon `/api/v1/search` 运行态仍缺 `searchMeta`，`auto` resident request 因 mode validation 降级。VEC-5R 中，`AlembicPlugin` 已提交 `2c98f69b1388c478bbbb255e487c51fde621cff7` 修复 mode normalization，AlembicCodex runtime artifact 为 `33689ec1cd0266023fab2d7c1bebf7ad6fd59732`；Test-2026-05-22-01 已完成且通过：direct `alembic_search(auto)` 显示 `codexRequestedMode=auto` / `residentRequestMode=semantic`，daemon `/api/v1/search` 与 direct `auto/semantic` 均返回 `semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`，`/api/v1/mcp/call` 未回归，prime delivered 与 Codex 可见知识摘要保持，BiliDili 前后干净，AlembicTest commit `0943ce085a1cb9c84141cc6c85673418c8248e29`。VEC-6 cache refresh 已完成：本机 Codex plugin cache marker 已刷新到 AlembicPlugin `2c98f69b1388c478bbbb255e487c51fde621cff7`，mode 为 `local-mcp`，`.mcp.json` 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；workspace 文档已提交。

上一条 prime receipt shout 计划：[prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md) 仍有 SHOUT-7 待总控验收；该项已由 `AlembicPlugin` 回填，用户明确不走 AlembicTest 真实项目测试。后续本机 Codex plugin cache refresh 应在 vector bridge 发布验收时统一处理，避免重复刷新。

- 当前发送窗口：无。
- 当前不发送给：`AlembicPlugin`（已完成）、`Alembic`（已完成）、`AlembicCore`（已完成）、`AlembicTest`（已完成）、`AlembicAgent`（观察中）、`AlembicDashboard`（无任务）、`BiliDili`（观察中，不改产品源码）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 已补 `SearchResponse.searchMeta`、resident search telemetry helper 与 VectorService sparse-only 真实 `vectorUsed` 透传；提交 `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`。 |
| `Alembic`<br>已完成 | VEC-5R 运行态已由 Test-2026-05-22-01 验收：daemon `/api/v1/search` 返回 `searchMeta`，`semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`；当前 HEAD `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`。 |
| `AlembicPlugin`<br>已完成 | VEC-5R Plugin 侧已完成并通过真实复测：提交 `2c98f69b1388c478bbbb255e487c51fde621cff7`，AlembicCodex runtime artifact `33689ec1cd0266023fab2d7c1bebf7ad6fd59732`；下一步由总控处理 cache refresh / 发布态验证。 |
| `AlembicTest`<br>已完成 | Test-2026-05-22-01 已通过并封口，AlembicTest commit `0943ce085a1cb9c84141cc6c85673418c8248e29`；当前无新测试单。 |
| `AlembicAgent`<br>观察中 | 当前 OllamaProvider / AiFactory 已能提供真实 embed provider；只有 Alembic 侧验证失败才回到 AlembicAgent。 |
| `AlembicDashboard`<br>无任务 | 本轮不改 Dashboard UI；后续若要展示 vector status，再另开任务。 |
| `BiliDili`<br>观察中 | 作为 VEC-4 真实项目验证对象；本轮不改产品源码、不派发执行窗口。 |

## 可复制提示词

发送给：无。

不发送给：`AlembicPlugin`（已完成）、`Alembic`（已完成）、`AlembicCore`（已完成）、`AlembicTest`（已完成）、`AlembicAgent`（观察中）、`AlembicDashboard`（无任务）、`BiliDili`（观察中）。

resident vector search 发布计划已完成；当前不需要复制提示词给其它窗口。

## 回填区

- 当前发布计划回填入口：`docs/workspace/resident-vector-search-release-workspace-plan-2026-05-21.md` 的“回填区”。
- AlembicPlugin VEC-2/VEC-3 执行记录：`docs/AlembicPlugin/resident-vector-search-release-plugin-2026-05-21.md`。
- 当前测试交流：`docs/workspace/alembic-test-exchange.md` 的 Test-2026-05-22-01 已完成通过。
- SHOUT-7 回填仍保留在 `docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md` 与 `docs/AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md`；待后续总控验收。
