# AlembicDashboard Plugin Live Host-Managed Verification

日期：2026-05-17

来源任务：`docs/workspace/alembic-agent-extraction-boundary-wave-2-acceptance-next-plan-2026-05-17.md` 的 `AlembicDashboard` wave 2 分派。

## 完成范围

本轮在 Plugin live daemon 下复验 Dashboard 对 host-managed / fail-closed AI contract 的前端兼容性：

- Candidate enrich：对应 `CandidatesView` 的候选补齐入口与 `api.enrichCandidates`。
- Candidate refine / Global Chat refine：对应候选润色入口、`GlobalChatDrawer` 和 `api.refinePreviewStream` / `api.refinePreview`。
- AI Chat：对应 `AiChatView` / Global Chat 普通对话与 `api.chatStream`。
- Dashboard 静态壳：Plugin daemon 可返回 production Dashboard HTML。

本轮未发现需要修改 Dashboard 源码的 UX 缺口；`0927faf fix: handle host-managed AI endpoints` 的前端适配在 live contract 下仍成立。

Dashboard 完成提交：`17a4ff5 docs: record plugin live host-managed verification`

说明：本提交为空提交，用于标记 Dashboard 窗口 wave 2 验收完成；协作文档保存在 workspace `docs/AlembicDashboard/`，不纳入 Dashboard 仓库提交。

## Live 手动记录

临时启动 Plugin daemon 后，完成以下 live 检查：

| 路径 | 结果 |
| --- | --- |
| `GET /api/v1/daemon/health` | 返回 `success: true`，`surface: "codex-plugin"`，`mode: "daemon"`，版本 `0.1.2`。 |
| `GET /` | 返回 `200 OK` Dashboard HTML，包含 `<div id="root">`。 |
| `POST /api/v1/candidates/enrich` | 返回 `success: true`，`hostManaged: true`，`unavailable: true`，单条结果 `reason: "HOST_AI_MANAGED"`。 |
| `POST /api/v1/candidates/refine-preview-stream` | 返回 `success: false`，`error.code: "HOST_AI_MANAGED"`，`data.hostManaged: true`，未创建本地 AI session。 |
| `POST /api/v1/candidates/refine-preview` | 返回 `success: false`，`error.code: "HOST_AI_MANAGED"`，`data.hostManaged: true`，`preview: null`。 |
| `GET /api/v1/candidates/refine-preview/events/fake-session` | 返回 host-managed fail-closed body，前端同一错误模型可覆盖 event stream 不可用场景。 |
| `POST /api/v1/ai/chat/stream` | 返回 `success: false`，`error.code: "HOST_AI_MANAGED"`，`data.hostManaged: true`，未返回 `sessionId`。 |

临时候选仅用于 refine live contract 验证；未写入 Dashboard 仓库。

## 前端路径结论

- Candidates enrich：`api.enrichCandidates` 会保留 `hostManaged` / `unavailable` 字段；`CandidatesView` 首次发现后展示 host-managed banner，并禁用补齐/润色按钮，避免误报成功。
- Global Chat refine：`GlobalChatDrawer` 调用 `api.refinePreviewStream`；host-managed 响应会被转换为可理解的宿主 Agent 提示，不再落入 “No sessionId returned”。
- AI Chat：`AiChatView` 和 Global Chat 普通对话调用 `api.chatStream`；host-managed 响应会展示宿主执行提示，不再显示普通请求失败。

## 验证命令

```text
npm run build
```

结果：通过；Vite 仅保留 large chunk warning。

补充验证：

```text
curl http://127.0.0.1:39123/api/v1/daemon/health
curl http://127.0.0.1:39123/
curl -X POST http://127.0.0.1:39123/api/v1/candidates/enrich
curl -X POST http://127.0.0.1:39123/api/v1/candidates/refine-preview-stream
curl -X POST http://127.0.0.1:39123/api/v1/candidates/refine-preview
curl http://127.0.0.1:39123/api/v1/candidates/refine-preview/events/fake-session
curl -X POST http://127.0.0.1:39123/api/v1/ai/chat/stream
```

结果：均按上方 live 手动记录返回预期 host-managed / fail-closed contract。

## 遗留风险

- 本轮完成 live daemon HTTP contract 与前端代码路径映射复验；未采集浏览器点击截图。原因是 Dashboard 仓库当前没有 Playwright 运行依赖，本轮也避免接管用户正在使用的 Chrome 标签页。
- 本地沙箱直接监听 `127.0.0.1` 会被系统拒绝；live daemon 启动使用了用户批准的临时提权，仅用于本轮验证，结束后已停止进程。
- 当前 UX 是 fail-closed 提示和禁用入口；若后续宿主 Agent 提供正式 handoff endpoint，Dashboard 还需要新增“交给宿主执行”的主动入口。

## 下一步建议

- AlembicPlugin release readiness 文档中将本轮 live host-managed contract 作为 Dashboard 联动证据引用。
- 后续若 Dashboard 仓库接受浏览器测试依赖，可新增一个轻量 smoke，自动覆盖 Candidates enrich/refine 与 AI Chat host-managed UI 提示。
- 在宿主 Agent handoff API 稳定前，Dashboard 继续保持当前禁用和解释性提示，不要降级为静默失败或普通错误 toast。
