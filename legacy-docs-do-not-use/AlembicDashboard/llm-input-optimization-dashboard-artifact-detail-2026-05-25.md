# LLM Input Optimization Dashboard Artifact Detail

日期：2026-05-25
窗口：`AlembicDashboard`
任务包：`LLMI-P8-DASHBOARD-ARTIFACT-DETAIL`
状态：待总控验收
提交：`30b376cd3b5539d3fac0db2e019c4136bb98212d`

## 窗口定位

当前窗口是 `AlembicDashboard` 执行窗口。本轮只负责 Dashboard 前端消费 Alembic 已验收的 job artifact API / `artifactRefs[].ref`，补 Jobs Timeline 详情侧栏、artifact 内容、`llmMetrics` 和 `traceEnvelope` 展示。

明确不做：

- 不改 Alembic producer API。
- 不改 AlembicAgent source 或 dist。
- 不改 AlembicPlugin。
- 不改 BiliDili 或其它真实测试项目。
- 不跑 full cold-start / rescan。

## 完成范围

- 在 `src/api.ts` 新增 `JobProcessArtifactContent`、`normalizeJobProcessArtifactRequestPath(jobId, ref)` 和 `api.getJobProcessArtifact(jobId, artifactRef)`。
- `normalizeJobProcessArtifactRequestPath` 支持 API 返回的 `/api/v1/jobs/:jobId/artifacts/:artifactId`、`/jobs/:jobId/artifacts/:artifactId` 和 artifact id token，并拒绝跨 job ref。
- 在 `src/components/Views/JobsView.tsx` 的 Jobs process Timeline drawer 中新增右侧详情面板 `JobProcessEventDetailPanel`。
- Timeline 主列表继续显示开发者摘要 / 短内容；artifact 内容通过详情面板按需读取，不把完整 prompt / output 回塞到事件卡片主体。
- 对有 detail 价值的事件提供“产物详情”入口；artifact chip 也可直接打开对应 artifact。
- 详情面板展示 Timeline projection、artifact selector、完整 redacted artifact、artifact metadata、`llmMetrics` 和 `traceEnvelope`。
- 覆盖 artifact 状态：无 ref、读取中、读取失败、读取成功。
- 在 `scripts/dashboard-contract.test.mjs` 补 contract 断言，锁定 artifact fetch helper、详情面板、状态分支、metrics / trace rendering 和 Timeline projection / full artifact 区分。

## 关键代码证据

- `src/api.ts`
  - `JobProcessArtifactContent`
  - `normalizeJobProcessArtifactRequestPath(jobId: string, ref: string)`
  - `api.getJobProcessArtifact(jobId: string, artifactRef: JobProcessArtifactRef)`
  - `responseType: 'text'` 和 `transformResponse: [(data) => data]` 保留原始文本 artifact。
- `src/components/Views/JobsView.tsx`
  - `selectedTimelineDetail` 记录当前 Timeline 详情事件和 artifact ref。
  - `JobProcessEventDetailPanel` 负责侧栏详情，不污染主 Timeline 卡片。
  - `api.getJobProcessArtifact(event.jobId, selectedArtifactRef)` 只在详情面板中按需触发。
  - `getProcessEventRecordMetadata(event, 'llmMetrics')` 和 `getProcessEventRecordMetadata(event, 'traceEnvelope')` 只展示真实存在的 metadata，不制造伪指标。
  - `getArtifactMetadataItems(event)` 展示 artifact retained / truncated / storage 等生产方 metadata。
- `scripts/dashboard-contract.test.mjs`
  - `jobs process timeline consumes typed events contract` 已覆盖本轮新增消费链路。

## UI 策略

- Timeline projection：继续使用 process event 的 `summary` / `content` 作为开发者摘要，并在详情面板中标注它不是完整 prompt / output。
- 完整 artifact：只在详情面板内通过 artifact endpoint 读取完整 redacted 内容。
- 短内容 / 长内容：主 Timeline 沿用短内容直接展示、长内容折叠策略；完整 artifact 在详情侧栏内部展示，避免刷爆主 Timeline。
- 失败状态：artifact ref 缺失、读取中、读取失败和读取成功各有独立状态；失败不会影响 Timeline 基础浏览。

## 验证命令

```text
npm run test
npm run typecheck
npm run check
git diff --check
git diff --check HEAD^ HEAD
```

## 验证结果

- `npm run test`：通过，12/12 contract tests。
- `npm run typecheck`：通过。
- `npm run check`：通过，包含 lint、test、typecheck、build；保留既有 Vite large chunk warning。
- `git diff --check`：通过。
- `git diff --check HEAD^ HEAD`：通过。

浏览器自动化工具本会话未暴露可调用入口，因此本轮 UI 证据以 DOM / contract 断言、typecheck 和 build 为准；建议 `AlembicTest` 在 Test-08 做真实 UI/API 复测。

## 遗留风险

- 尚未做 AlembicTest 最小 test-mode 或小 cold-start 级真实复测，不能替代后续 UI/API/artifact 端到端验收。
- 若 producer 返回的 `artifactRefs[].ref` 未来出现非当前三类格式，需要 Alembic producer 或 Dashboard normalize contract 再补充。
- `AlembicAgent/dist` 未刷新仍是后置门禁，package/runtime 或 cold-start 集成验证前需要单独处理。

## 下一步建议

- 总控验收本提交后创建 `AlembicTest` Test-08。
- Test-08 最小覆盖：带 artifact 的 `llm.input` / `llm.output` 事件、artifact API 读取成功、404 / missing ref 可读状态、`llmMetrics` / `traceEnvelope` 展示、Timeline projection 不冒充完整 prompt / output、无 raw secret 泄漏。
- 只有 Test-08 证明 API ref、artifact 内容或 metadata 缺失时，才返修 `Alembic` 或 `AlembicAgent`。
