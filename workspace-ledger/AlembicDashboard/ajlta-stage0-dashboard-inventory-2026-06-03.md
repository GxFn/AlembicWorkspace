# AJLTA Stage 0 Dashboard Inventory

日期：2026-06-03
任务：`AJLTA-STAGE0-DASHBOARD-P0`
窗口：`AlembicDashboard`
范围：只读复核 Dashboard Jobs UI / API client / 前端状态 / artifact detail / snapshot viewer 候选。

## 执行边界

- 本轮未修改 `AlembicDashboard` 产品源码。
- 未修改 `Alembic` / `AlembicCore` / `AlembicAgent` / `AlembicPlugin` / `AlembicTest` / `BiliDili`。
- 提交 hash：`无`。当前 Dashboard HEAD 仅作为盘点基线：`cb6b35237e6cc353d20657819d2b50c3bce96a7e`。
- Alembic project-knowledge prime 当前不可用，返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`；本轮未启动 cold-start 初始化。

## 关键代码事实

1. Jobs 页面入口是 `src/components/Views/JobsView.tsx`。
   - `JobsView` 用 `api.listJobs({ limit: 100, compact: true })` 拉取列表，见 `src/components/Views/JobsView.tsx:245-253`。
   - URL query `?job=<id>` 会选中 job 并打开 timeline，见 `src/components/Views/JobsView.tsx:242-296`。
   - Job 卡片只有 `查看过程` / candidates / reports / cancel 等动作，未见 snapshot 打开入口，见 `src/components/Views/JobsView.tsx:560-680`。

2. Jobs API client 当前只有 list/detail/events/artifact 读法。
   - `DaemonJobRecord` 没有 display snapshot / checksum / evidenceIncomplete 字段，见 `src/api.ts:777-814`。
   - `JobProcessDeveloperView` 只包含 event-level `content`、`artifactRefs`、`metadata`，见 `src/api.ts:853-871`。
   - REST 入口为 `/jobs`、`/jobs/{id}`、`/jobs/{id}/events`、`/jobs/{id}/artifacts/{ref}`，见 `src/api.ts:1961-2019`。
   - `normalizeJobProcessArtifactRequestPath` 会拒绝跨 job artifact ref，见 `src/api.ts:892-923`。

3. 旧 job 详情当前依赖 process events，不是 durable snapshot。
   - `JobProcessTimeline` 调用 `useJobProcessEvents(job.id, { enabled: open, active: isActive, limit: 120 })`，见 `src/components/Views/JobsView.tsx:687-713`。
   - `useJobProcessEvents` 初次读取 `/jobs/{id}/events`，active job 轮询增量，Socket 监听 `job:process-event`，见 `src/hooks/useJobProcessEvents.ts:96-169`。
   - 如果 events 为空，UI 文案明确提示“旧任务或后端重启后可能只保留基础进度”，见 `src/components/Views/JobsView.tsx:170-175` 和 `src/components/Views/JobsView.tsx:780-785`。

4. 前端存在 display cache，但它不是本需求允许的持久化。
   - cache key 为 `alembic.dashboard.jobProcessEvents.v1`，TTL 6 小时，最多 40 个 job / 120 条 event，见 `src/utils/jobProcessEvents.ts:3-7`。
   - `useJobProcessEvents` 会读写 localStorage cache，见 `src/hooks/useJobProcessEvents.ts:82-94`、`src/hooks/useJobProcessEvents.ts:107-116`、`src/hooks/useJobProcessEvents.ts:143-148`。
   - 该 cache 只能作为临时 UI display cache，不能满足服务重启后长期 readback 的完成定义。

5. 现有 artifact detail drawer 可复用，但还不是 snapshot viewer。
   - `ProcessEventItem` 以 event projection + artifactRefs 展示 timeline，见 `src/components/Views/JobsView.tsx:911-1050`。
   - `JobProcessEventDetailPanel` 可展示 timeline projection、artifact refs、完整 redacted artifact、metrics、trace envelope、artifact metadata，见 `src/components/Views/JobsView.tsx:1053-1194`。
   - artifact content 直接由 `api.getJobProcessArtifact(event.jobId, selectedArtifactRef)` 获取并以 `<pre>` 展示，见 `src/components/Views/JobsView.tsx:1078-1178`。
   - artifact 读取失败已有 error state，见 `src/components/Views/JobsView.tsx:1160-1164`。

6. 当前已有长内容与完整性提示基础，但缺 snapshot completeness。
   - LLM output hint 可展示 visible output、reasoning omitted、finishReason、provider/Alembic truncation，见 `src/utils/jobProcessEvents.ts:313-395`。
   - 事件内容超过 10 行默认折叠，见 `src/utils/jobProcessEvents.ts:3-7`、`scripts/dashboard-contract.test.mjs:285-311`。
   - 现有代码未发现 `evidenceIncomplete`、`displaySnapshot`、`snapshotRef`、`checksum` 等 job snapshot 一等字段。

7. Bootstrap running panel 只展示 recent key events。
   - `BootstrapProgressView` 从 `activeJobId` 调用 `useJobProcessEvents(... limit: 40)`，只取 3 条 recent key events，见 `src/components/Views/BootstrapProgressView.tsx:528-545`。
   - “任务详情”按钮跳转到 Jobs tab 并带 `?job=<id>`，见 `src/components/Views/BootstrapProgressView.tsx:370-470` 和 `src/App.tsx:1208-1210`。

## Dashboard 侧结论

- 当前旧 job UI 不可读的 Dashboard 消费层原因：Dashboard 只能从 `/jobs` 找到 job，再从 `/jobs/{id}/events` 和 per-event artifact ref 读取详情；如果后端重启后没有恢复 events / artifact refs / artifact content，Dashboard 只能显示基础 job summary、空 timeline 或 artifact 读取失败。
- Dashboard 没有 durable display snapshot contract，也没有 snapshot manifest/ref/checksum/read API client；因此不能在前端独立满足“同一份 persisted snapshot artifact / view-model”。
- 现有 `JobProcessTimeline` + `JobProcessEventDetailPanel` 是 Stage 3 可复用的 UI 基础：drawer stack、artifact detail、long text pre-wrap、LLM completeness hints、artifact error state 都已经存在。
- 现有 localStorage display cache 必须在 Stage 3 明确降级为临时体验优化；不能作为 snapshot readback、completion evidence 或后端重启后的 source of truth。

## Stage 3 Dashboard 实现建议

等待 Alembic producer/API contract 后再实现 Dashboard，建议包：

1. 在 `src/api.ts` 增加 typed display snapshot client。
   - 依赖后端提供 job-scoped snapshot ref / manifest / checksum / warnings / evidenceIncomplete / redaction / truncation / retention。
   - 可选形态：`getJobDisplaySnapshot(jobId)` 或 `DaemonJobRecord.summary.displaySnapshot` + artifact open API；具体以 Alembic Stage 1/2 contract 为准。

2. 在 `src/components/Views/JobsView.tsx` 增加 snapshot viewer 入口。
   - Job row 增加 snapshot 状态与打开按钮。
   - 若旧 job 有 snapshot ref，优先打开 same snapshot viewer；events timeline 作为 snapshot 内 section 或辅助 timeline，不从散字段重组主视图。
   - 若 snapshot 缺失 / 不可读 / 被截断 / 被脱敏，显示 evidence warning / `evidenceIncomplete`，不得空白或伪装完整。

3. 复用现有 drawer stack。
   - 复用 `PageOverlay` + `Drawer.Panel` responsive pattern。
   - 复用 artifact detail 展示思想，但建议抽出 `JobDisplaySnapshotPanel`，避免把 canonical snapshot 混入单个 process event detail。

4. 长内容策略。
   - 第一版可复用现有 `<pre className="whitespace-pre-wrap break-all">`。
   - 若 snapshot 很大，按 contract 中的 sections / artifact refs 做 lazy section / pagination / virtualized body；UI 策略不能改变同一 snapshot 是事实源。

5. 测试建议。
   - 在 `scripts/dashboard-contract.test.mjs` 或后续 targeted UI test 中锁定：Dashboard 不用 localStorage 作为 snapshot persistence、不新增 HTML 报告、snapshot API client 存在、warning states 存在、same snapshot ref/checksum 可展示。
   - 保留现有 Jobs timeline contract test，扩展 snapshot viewer contract。

## 依赖与风险

- 依赖 Alembic 明确 snapshot contract 和 read API；Dashboard 不能先消费不存在的 storage contract。
- 若后端只给 events/artifacts 而不给 canonical snapshot manifest/ref/checksum，Dashboard 会被迫从散字段重组主视图，违背用户裁决。
- 若 snapshot 只作为普通 artifact ref 出现但没有 job-level evidenceIncomplete/warnings，Dashboard 可显示内容但无法证明 same-snapshot 完整性。
- 当前没有进行真实 Dashboard 手动观察；本轮只读代码 inventory 足以给 Stage 3 设计边界，不代表产品验收。

## 验证

- `git status --short`：无输出，Dashboard 工作树 clean。
- `git diff --check`：无输出。
- `npm run test`：15/15 pass。
- `npm run lint`：Dashboard lint passed，86 source files checked。
