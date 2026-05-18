# AlembicDashboard Host-Managed API Adapter

日期：2026-05-17

来源任务：`alembic-agent-extraction-boundary-acceptance-next-plan-2026-05-17.md` 的 `AlembicDashboard` P1。

## 领取任务

Dashboard 需要适配插件仓库在 Agent/AI runtime 抽取后形成的 host-managed / fail-closed API contract，避免前端继续把这些端点当成本地 AI 能力：

- `/api/v1/candidates/enrich`
- `/api/v1/candidates/bootstrap-refine`
- `/api/v1/candidates/refine-preview`
- `/api/v1/candidates/refine-preview-stream`
- `/api/v1/ai/chat/stream`
- `/api/v1/ai/chat/events/:sessionId`

## 完成内容

提交：`0927faf fix: handle host-managed AI endpoints`

代码范围：

- `src/api.ts`
- `src/components/Views/CandidatesView.tsx`
- `src/components/Shared/GlobalChatDrawer.tsx`
- `src/components/Views/AiChatView.tsx`
- `src/i18n/locales/zh.ts`
- `src/i18n/locales/en.ts`

实现摘要：

- 增加 `HostManagedUnavailableError`、`HostManagedUnavailableDetails`、`isHostManagedUnavailable`。
- 统一识别 `HOST_AI_MANAGED`、`hostManaged: true`、501、410。
- `chatStream` 和 `refinePreviewStream` 在 JSON fail-closed 响应下先解析 host-managed 状态，不再硬性期待 `sessionId`。
- `enrichCandidates` 兼容插件侧 200 + `hostManaged: true` + `unavailable: true` 的语义成功但能力不可用响应。
- `bootstrapRefine`、`refinePreview`、`refineApply` 将 501 host-managed 响应转换为统一前端错误。
- Candidates 页面在发现 host-managed 后显示说明 banner，并禁用候选补齐/润色入口，避免用户误以为操作已执行。
- Global Chat 和 AI Chat 对 host-managed 错误显示宿主执行提示，不再显示普通请求失败。
- 中英文文案已补齐，明确由 Codex/IDE 宿主 Agent 生成补齐、润色或对话结果。

## 验证记录

已运行：

```text
npm run build
```

结果：通过，生成 `dist/index.html`。

边界检查：

- Dashboard 源码没有新增跨仓源码 import。
- 没有新增本机绝对路径。
- 没有把插件、Agent、AI provider 或 Tool runtime 迁入 Dashboard。

手动验收记录：

- 插件端 `/candidates/enrich` 的 200 `hostManaged: true` contract 已在 `enrichCandidates` 中保留并透传到 Candidates UI。
- 插件端 `/candidates/refine-preview-stream` 和 `/ai/chat/stream` 的 501 JSON contract 已在 stream 启动阶段解析，不再落入 “No sessionId returned”。
- 插件端 410 event stream contract 已被同一 host-managed 错误模型覆盖；Dashboard 不再把缺少 session 当作成功路径继续消费。
- Wave 2 已完成 Plugin live daemon 复验，记录见 `docs/AlembicDashboard/alembic-dashboard-plugin-live-host-managed-verification-2026-05-17.md`；live contract 未暴露 Dashboard 源码缺口。

## 剩余事项

- 如果宿主 Agent 后续提供正式 handoff endpoint，Dashboard 可把当前禁用反馈升级为明确的宿主执行入口。
