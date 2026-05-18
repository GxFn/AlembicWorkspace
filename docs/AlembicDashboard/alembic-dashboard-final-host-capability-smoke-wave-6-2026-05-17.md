# AlembicDashboard Final Host Capability Smoke Wave 6

日期：2026-05-17
状态：已完成
提交：`c3d4ca0 docs: record final host capability smoke`

来源任务：`docs/workspace/alembic-agent-cutover-final-integration-readiness-wave-6-plan-2026-05-17.md` 的 `AlembicDashboard` Wave 6 分派。

## 完成范围

- 执行 Dashboard 最低门禁 `npm run build`。
- 复核 Alembic Wave 6 host capability / API shape 回填：
  - host `toolRegistry.toLightweightSchemas()` 返回 21 个 schema。
  - terminal capability id 为 `terminal_pty`、`terminal_run`、`terminal_script`、`terminal_session_cleanup`、`terminal_session_close`、`terminal_session_status`、`terminal_shell`。
  - daemon health、CLI status、host capability catalog smoke 均已在 Alembic 窗口通过。
- 扫描 Dashboard 前端消费点，确认当前 Dashboard 不直接消费 `toolRegistry.toLightweightSchemas()` 或 terminal capability id 列表，也不接入 terminal execution。
- 确认 Dashboard 仅展示后端返回的摘要字段：
  - `api.getTestModeConfig()` 的 `terminal: { enabled, toolset }`。
  - `BootstrapReportSummary` 的 `terminalCapability`、`terminalEnabled`、`terminalSuccessRate`。
  - `BootstrapProgressView` / `Header` / `SignalReportView` 的终端能力展示。

本轮未发现 Dashboard 源码需要修改的 API/UI 兼容缺口。

## Live Smoke 判断

未触发 live daemon / UI smoke。

理由：

- Alembic Wave 6 新增或复验的是 host terminal/sandbox execution 与 capability catalog shape。
- Dashboard 只展示终端能力摘要，不执行 terminal tool，也不解析 21 个 lightweight schema 的具体结构。
- Dashboard 已在 Wave 2 完成 Plugin live host-managed smoke，覆盖候选补齐、候选润色和 AI Chat fail-closed contract；本轮 Alembic terminal capability shape 不影响该路径。

如果后续后端改变 `/modules/test-mode`、signal report summary 或 Dashboard 实际接入 capability catalog 列表，再启动 live API/UI smoke。

## 验证命令

```text
npm run build
```

结果：通过；Vite 仅保留 large chunk warning。

补充扫描：

```text
rg -n "capabil|terminal|toolRegistry|toLightweightSchemas|HOST_AI_MANAGED|hostManaged|daemon/health|/health|ai/chat|candidates/refine|candidates/enrich" src package.json
```

结果：确认没有 `toolRegistry.toLightweightSchemas()` 直接消费；terminal 相关前端代码只展示后端摘要字段。

## 遗留风险

- 本轮没有启动 Alembic live daemon，也没有采集浏览器截图；原因是 capability/API shape 未触发 Dashboard live smoke 条件。
- Dashboard 仍依赖后端维持 `terminal: { enabled, toolset }` 和 signal report terminal summary 的兼容字段。若这些字段被替换为新的 capability catalog 结构，需要另开 Dashboard API adapter 任务。
- `npm run build` 的 Vite large chunk warning 为既有构建提示，本轮未扩大到性能拆包。

## 下一步建议

- Wave 6 总控可将 Dashboard 标记为已完成。
- 后续如果 Alembic 将 21 个 lightweight schema 暴露给 Dashboard 页面，应先定义稳定 API view model，再补 UI smoke，不要让前端直接绑定 host executor 或 terminal runtime。
- Dashboard 继续保持只展示状态与摘要，不接入 terminal/sandbox 执行能力。
