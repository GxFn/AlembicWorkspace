# LLM Input Optimization Artifact Trace Metrics

日期：2026-05-25
窗口：`Alembic`
任务包：`LLMI-P7-ALEMBIC-ARTIFACT-TRACE-METRICS`
状态：待总控验收

## 完成范围

- Alembic daemon 在接收 `llm.input` / `llm.output` / visible output process event draft 时，先把完整 redacted developer-visible text 保存为 job artifact，再把 Timeline content 保持为摘要 / 截断投影。
- job process event 现在带 `artifactRefs`、artifact retained metadata、trace envelope 和真实可得的 `llmMetrics`。
- 新增 job artifact 读取路径 `GET /api/v1/jobs/:jobId/artifacts/:artifactId`，读取被限制在 dataRoot scoped job artifact 目录。
- 补 targeted tests 覆盖 artifact candidate、daemon artifact 落盘 / 回链、artifact route URL 和既有 process event recorder 行为。

## 提交

- Alembic 提交：`aa5419434d51aa4d944c3614ecebd8aff47a009f`
- 提交信息：`feat: retain llm process event artifacts`

## 文件 / 模块变化

- `lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts`
  - 从 Agent process events 构建完整 text artifact candidate。
  - 为 LLM 事件生成 `traceEnvelope`、`correlationId`、`parentEventId` 和 `llmMetrics`。
  - Timeline content 仍使用 `MAX_TEXT_CHARS = 6000` 的 projection，不把 projection 反写成完整 artifact。
- `lib/service/bootstrap/bootstrap-event-types.ts`
  - 为 bootstrap process event draft 增加 `textArtifactCandidate`。
- `lib/daemon/JobProcessEventArtifacts.ts`
  - 新增 job artifact materialize / read / API ref helper。
- `lib/daemon/DaemonJobRunner.ts`
  - 在录入 bootstrap process events 前 materialize artifact，并把 `artifactRefs`、artifact metadata 和 jobId trace 写回事件。
- `lib/http/routes/jobs.ts`
  - 新增 job artifact read endpoint。
- `test/unit/BootstrapProcessEvents.test.ts`
  - 覆盖 long LLM output 的完整 artifact candidate、projection 和 metrics / trace envelope。
- `test/unit/DaemonJobRunner.test.ts`
  - 覆盖 daemon 录入时 artifact 落盘、event 回链、traceEnvelope.jobId 注入和 dataRoot scoped 存储。
- `test/unit/JobsRoute.test.ts`
  - 覆盖 artifact URL helper。

## 关键代码证据

### Artifact 写入点

- `lib/daemon/DaemonJobRunner.ts` 在 `recordBootstrapProcessEventDrafts(...)` 中调用 `materializeJobProcessEventTextArtifact(...)`。
- `lib/daemon/JobProcessEventArtifacts.ts` 将 artifact 写入 `<dataRoot>/.asd/job-artifacts/<safeJobId>/<artifactId>`，并校验 resolved path 仍在 job artifact 根目录内。
- artifact 文件写入使用 `0o600`，避免扩散到项目源码目录或 Dashboard localStorage。

### ArtifactRef 回链点

- `lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts` 在 Timeline projection 之前用完整 redacted text 生成 `textArtifactCandidate`。
- `lib/daemon/DaemonJobRunner.ts` materialize 成功后把 `artifactRefs` prepend 到 event，同时写入：
  - `artifactRetained`
  - `artifactRef`
  - `artifactPath`
  - `artifactOriginalChars`
  - `artifactRetainedChars`
  - `artifactRedactionState`
  - `artifactStorage`

### Trace Envelope 字段来源

- `BootstrapProcessEvents.ts` 从 session / dimension / iteration / phase / event kind 构建 `traceEnvelope`。
- `DaemonJobRunner.ts` 在具体 job 录入时补入真实 `jobId`。
- 当前字段包含：`jobId`、`sessionId`、`dimensionId`、`iteration`、`correlationId`、`parentEventId`、`phase`、`chainNodeId`、`stageId`、`eventKind`。

### Metrics 字段来源

- `BootstrapProcessEvents.ts` 只从真实可得字段派生 `llmMetrics`，不制造伪指标。
- 覆盖字符 / token 估算、Timeline retained / truncated、message count、tool schema count、toolChoice、input stage profile、section count、output section count、duration、finishReason、duplicate tool calls、empty retries、cache hits / misses 和 token usage。
- 当上游 metadata 不存在时，对应 metric 不写入。

### Artifact Read API / Path Safety

- `lib/http/routes/jobs.ts` 提供 `GET /api/v1/jobs/:jobId/artifacts/:artifactId`。
- route 先确认 job 存在，再通过 `readJobProcessEventArtifact(...)` 从当前 dataRoot scoped job artifact 区域读取。
- `readJobProcessEventArtifact(...)` 校验 artifact id 和 resolved path，防止 `..` / 绝对路径逃逸。

## Artifact 存储位置

- 存储位置：dataRoot scoped `.asd/job-artifacts/<jobId>/<artifactId>`。
- Ghost / runtime dataRoot 由现有 `resolveDataRoot(container)` 决定。
- 不写入真实项目源码目录。
- 不写入 Dashboard localStorage。

## Redaction 边界

- 保存的是 Agent 已经生产的 redacted developer-visible prompt / output。
- 不保存 raw provider payload。
- 不保存 hidden reasoning。
- 不保存 secret 或 secret source class。
- 如果后续上游只传入已截断 text，Alembic 不会假装拥有完整 artifact；本次实现只对 `textArtifactCandidate` 的完整 text 落盘。

## 验证命令和结果

```text
npm run test:unit -- BootstrapProcessEvents.test.ts DaemonJobRunner.test.ts JobsRoute.test.ts JobProcessEventRecorder.test.ts
```

结果：通过，4 files / 28 tests passed。

```text
npm run typecheck
```

结果：通过。

```text
npm run lint -- --diagnostic-level=error
```

结果：通过，Checked 212 files。

```text
npm run lint:core-import-boundary
```

结果：通过，scanned 370 files and 451 `@alembic/core` imports。

```text
npm run lint:consumer-core-imports
```

结果：通过，scanned 370 files and 451 `@alembic/core` imports。

```text
git diff --check
```

结果：通过。

```text
npm run build
```

结果：通过。

## 遗留风险

- 本轮只完成 Alembic producer；Dashboard 仍需 Wave 5 消费 `artifactRefs[].ref`、Timeline 摘要和 artifact 详情侧栏。
- `AlembicAgent/dist` 未刷新，仍保留为 `GTODO-2026-05-25-002`；package/runtime 或 cold-start 集成验证前必须处理。
- 本窗口未跑 full cold-start / rescan；需要 AlembicTest 后续用 Test-08 做最小 test-mode / 小 cold-start 级验证。
- Metrics 只覆盖上游真实可得字段；缺来源字段不会伪造。

## 下一步建议

- `AlembicDashboard` Wave 5：从 process event 的 `artifactRefs[].ref` 拉取完整 redacted artifact，在 Timeline 保持摘要，在详情侧栏展示 full prompt / output 和 metrics。
- `AlembicTest` Test-08：验证 `llm.input` / `llm.output` event 能 fetch artifact，Timeline content 仍是摘要 / 截断，artifact 含完整 Observation Ledger，且无 raw debug key / secrets。
- `AlembicAgent`：在 package/runtime 或 cold-start 集成验证前刷新 `dist`，避免 source 与 runtime 产物不一致。
