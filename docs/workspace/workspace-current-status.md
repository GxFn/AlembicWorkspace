# AlembicWorkspace Current Status

更新日期：2026-05-20
总控窗口：AlembicWorkspace
状态：Agent 执行效率与可观测性收口 Wave 8 阻塞，等待用户决策

## 状态摘要

当前主任务是把 `BiliDili` 真实 cold-start 运行暴露的问题统一收口：Agent 执行效率、取消语义、Job / report 可观测性、Dashboard 慢模型进度反馈，以及真实项目回归。

当前总控计划：[alembic-bootstrap-agent-efficiency-observability-workspace-plan-2026-05-20.md](alembic-bootstrap-agent-efficiency-observability-workspace-plan-2026-05-20.md)

关键判断：

- 这不是 UI 小修，也不是单个 cancelled label 修复；重点是减少 Agent 无意义 token / tool 调用，并让用户能看到真实执行状态。
- `Alembic` Wave 0 已完成取消语义和 compact status；本次 CI recovery 已推送最新提交 `6a13b0bda471447040064c72bc647e6696ed1df2`，新 Actions run `26117931831` 全部通过。
- `AlembicAgent` Wave 1 已回填 producer schema；总控复核通过。
- `Alembic` Wave 2 已提交并推送 `cc5b68146c6b6997362c23dce3607dbb2fd78029`，总控验收通过；效率指标已经进入 bootstrap dimension / JobStore / report / compact status。
- `AlembicDashboard` Wave 3 已经总控验收通过：Jobs / Reports 都消费真实 efficiency payload，并通过 build / route smoke。
- `BiliDili` Wave 4 小范围真实回归已完成，业务源码保持干净，但功能完整性未通过：真实 API 暴露 compact payload、cancelled progress / summary、Jobs / Reports efficiency 和 Codex plugin runtime pin 问题。
- `Alembic` Wave 5 已验收通过，提交 `11a14bbb486fff059a2e3ea42557ca6ff17d810b`；总控复核显示当前已运行 61164 daemon 仍是旧行为，因此 BiliDili 复测前必须刷新 daemon。
- `AlembicPlugin` Wave 5 已验收通过；`PLUGIN_RUNTIME_PIN_MISMATCH` 已消失。BiliDili Wave 6 复测确认当前剩余问题是 diagnostics 对 stale cwd / `uv_cwd` 的误判。
- `BiliDili` Wave 6 已完成并按门禁停止：业务仓库干净，pin mismatch 已消失，但 diagnostics 仍因 `uv_cwd` 把 npm / npx 判为不可用；总控在有效插件缓存目录直接执行 npm / npx 均正常。
- `AlembicPlugin` Wave 7 已通过总控验收：diagnostics stale cwd / `uv_cwd` 分类修复、packaged runtime artifact 和 installed probe 均通过。
- `BiliDili` Wave 8 diagnostics 门禁已通过，daemon refresh 窗口期和历史 job contract 已完成复核；新的单维度 `architecture` rescan 因外部 AI 数据导出安全策略阻塞。
- 当前不发送任何窗口。下一步需要用户确认：允许把 BiliDili 项目内容发送给当前 DeepSeek provider 做单维度复测，或改用本地 / 测试 provider / dry-run 路线。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `BiliDili`<br>阻塞 | Wave 8：diagnostics 门禁和历史 job contract 复核通过；新的单维度 `architecture` rescan 被外部 AI 数据导出安全策略阻塞，等待用户确认路线。 |
| `AlembicPlugin`<br>已完成 | Wave 7 已通过总控验收：diagnostics stale cwd / `uv_cwd` 分类修复、packaged runtime artifact 和 installed probe 均通过。 |
| `Alembic`<br>已完成 | Wave 5 代码验收通过；后续复测前再按文档重新启动 / 刷新 daemon。 |
| `AlembicDashboard`<br>观察中 | Wave 3 前端已通过；当前等待后续 BiliDili 新 job 真实 payload 复测。 |
| `AlembicAgent`<br>观察中 | Wave 1 producer 已完成；除非 Alembic 复核发现 diagnostics 未真实产出，否则不派发。 |
| `AlembicCore`<br>无任务 | 暂未发现需要 Core contract 变化。 |

## 可复制提示词

发送给：无。

当前没有可继续发送的执行窗口。`BiliDili` 已完成门禁与既有 job contract 复核；继续新 rescan 前需要用户确认数据发送策略或替代安全路线。

不发送给：`BiliDili`（阻塞，等待用户决策）、`AlembicPlugin`（Wave 7 已完成）、`Alembic`（Wave 5 已完成）、`AlembicDashboard`（观察中）、`AlembicAgent`（观察中）、`AlembicCore`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/alembic-bootstrap-agent-efficiency-observability-workspace-plan-2026-05-20.md` 的“回填区”。
- `Alembic`：Wave 5 已验收通过，提交 `11a14bbb486fff059a2e3ea42557ca6ff17d810b`；后续复测前再按文档重新启动 / 刷新 daemon。历史 Wave 2 已验收通过，提交 `cc5b68146c6b6997362c23dce3607dbb2fd78029`；Wave 0 已完成，主提交 `c3af481dbda617d3ceb720a452fdf713b9e8aef5`；CI recovery 提交 `6a13b0bda471447040064c72bc647e6696ed1df2`，新 Actions run `https://github.com/GxFn/Alembic/actions/runs/26117931831` 全部通过。
- `AlembicAgent`：已完成 Wave 1，提交 `ea4c9ecc6fc26629794dda70623269265ab9ac95`。
- `AlembicDashboard`：Wave 3 已验收通过，提交 `904778f2002b5576c9f14b2d19409d0d81bd0125`。
- `AlembicCore`：无任务。
- `AlembicPlugin`：Wave 5 已验收通过；Wave 7 已通过总控验收。Wave 5 执行记录 `docs/AlembicPlugin/alembic-plugin-runtime-pin-cache-refresh-wave-5-2026-05-20.md`；Wave 7 执行记录 `docs/AlembicPlugin/alembic-plugin-diagnostics-cwd-robustness-wave-7-2026-05-20.md`。Wave 7 提交 hash：AlembicPlugin `cfacd28434f2f669bffd5048fc5e4b9c0e95f62c`，AlembicCodex runtime artifact `05c77fffc91d6c991a56308eab3a71cdc3d311ab`。完成范围：diagnostics npm / npx 探测使用稳定 cwd，`uv_cwd` 归类为 `CODEX_STALE_COMMAND_CWD`，不再误报 `NPM_UNAVAILABLE` / `NPX_UNAVAILABLE`，并保持 `PLUGIN_RUNTIME_PIN_MISMATCH` 分类边界；已刷新 packaged runtime artifact 并同步本机 Codex plugin cache。总控复跑 targeted vitest、`npm run check`、`npm run verify:codex-plugin`、`npm run verify:release-package-boundary`、`npm run dev:codex-plugin:probe-installed -- --packaged --project-root ../BiliDili --no-sync`、`git diff --check`、`git -C plugins/alembic-codex diff --check` 均通过。遗留风险：需新会话或重启 MCP 后再在 BiliDili 项目复核真实 diagnostics 工具输出；未启动完整 cold-start。
- `BiliDili`：Wave 8 已完成 diagnostics 门禁和历史 job contract 复核；新的单维度 `architecture` rescan 被外部 AI 数据导出安全策略阻塞。BiliDili 业务仓库前后干净，HEAD 为 `c37007b39b1d1b891d17d9d5849870a679be8be3`；未产生 BiliDili 代码提交，未启动完整 cold-start。
