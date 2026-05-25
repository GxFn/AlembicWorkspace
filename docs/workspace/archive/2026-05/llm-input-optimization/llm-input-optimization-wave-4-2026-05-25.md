# LLM Input Optimization Wave 4

日期：2026-05-25
状态：总控验收通过，已转 Wave 5
发送给：无（`Alembic` 已验收通过，下游已转 [Wave 5](../../../current/llm-input-optimization-wave-5-2026-05-25.md)）
主线目标：在 Wave 3 Observation Ledger 已通过 source test-mode 验收后，把 LLM input / output 的完整 redacted artifact、trace envelope 和 metrics 做到 Alembic daemon / job process event 链路里，避免 Timeline 截断内容被误当作完整证据。

## 目标判断

用户当前目标仍是 LLM 输入优化主线，最终目标尚未完成。

已完成：

- Wave 1 correctness：`AlembicAgent` 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711`，`AlembicTest` Test-05 通过总控验收。
- Wave 2 input layering：`AlembicAgent` 提交 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`，`AlembicTest` Test-06 通过总控验收。
- Wave 3 Observation Ledger：`AlembicAgent` 提交 `8970327d73bf6c01476a1aeb5384f014483b68dd`，`AlembicTest` Test-07 通过总控验收。

剩余主要差距：

- `llm.input` / `llm.output` 当前仍主要经 process event developer view 展示，Alembic bridge 默认保留 `6000` 字；这适合 Timeline 摘要，不适合作完整 prompt / output 证据。
- `JobProcessEventRecorder` 当前以内存 retained recorder 为主，重启恢复和长期复盘不能依赖它保存完整内容。
- Dashboard 需要稳定的 artifact API / `artifactRef` / metrics 后才能做详情侧栏；在 Alembic 产出契约稳定前不应先改 UI。
- `AlembicAgent/dist` 未刷新保留为 `GTODO-2026-05-25-002`，package/runtime 或 cold-start 集成验证前必须处理；本波先做 Alembic source 侧 artifact / trace / metrics。

## 本波完成定义

本波完成后必须具备：

- Alembic 能在收到 `llm.input` / `llm.output` process event 时，把完整 redacted text 保存为 job artifact；Timeline 事件只保留开发者摘要 / 截断展示，并带 `artifactRef` 指向完整 artifact。
- Artifact 存储在 Ghost dataRoot / runtime data root 下的 job artifacts 区域，不写入真实项目源码目录，不写入 Dashboard localStorage。
- `contentOriginalChars`、`contentRetainedChars`、`contentTruncated`、`contentTruncatedChars`、`contentTruncationLimit`、artifact retained chars 等 metadata 能说明 Timeline 展示与完整 artifact 的关系。
- Trace envelope 至少固定 `jobId`、`sessionId`、`dimensionId`、`iteration`、`correlationId`、`parentEventId`、`phase`，并预留 `chainNodeId` / `stageId` 或等价字段，便于后续 `progressive-chain-validation` 节点级回放。
- Metrics 至少覆盖字符 / token / section / duration / finishReason / empty retry / duplicate tool calls / cache hit 等现有可得字段；不能为了指标新增伪数据。
- 复用或扩展现有 event / artifact contract，避免新建无消费方的空 provider；如果发现上游 `AlembicAgent` 只给了已截断内容，必须回填为阻塞证据，不能假装保存了完整 prompt。

## 真实代码证据

本波以以下真实代码入口为主要证据：

- `AlembicAgent/src/agent/runtime/AgentRuntime.ts:852` 到 `AgentRuntime.ts:887`：`llmInputAssembly` 生成 provider messages，`formatDeveloperVisibleLlmInput(...)` 作为 `llm.input` process event 文本发出，metadata 已带 `llmTrace`、`messageCount`、toolChoice、toolSchemaNames 和 input assembly metadata。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:13`：Alembic bridge 当前 `MAX_TEXT_CHARS = 6000`。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:629` 到 `BootstrapProcessEvents.ts:652`：`normalizeProcessEventContent(...)` 会对 event content text 做 `projectText(content.text, MAX_TEXT_CHARS)`，并只在 metadata 里记录截断信息。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:600` 到 `BootstrapProcessEvents.ts:622`：已有 efficiency summary 可提供 cache、duplicate、empty retry、token usage 等指标来源。
- `Alembic/lib/daemon/JobProcessEventRecorder.ts:55` 到 `JobProcessEventRecorder.ts:93`：当前 recorder 只做 bounded in-memory retained + broadcast。
- `Alembic/lib/daemon/DaemonJobRunner.ts:469` 到 `DaemonJobRunner.ts:498`：bootstrap task completed / `bootstrap:process-events` 会把 Agent process events 录入 job recorder。
- `AlembicCore/src/daemon/JobProcessEventContracts.ts:58` 到 `JobProcessEventContracts.ts:85`：现有 `JobProcessEvent` 已支持 `artifactRefs`、`correlationId`、`parentEventId`、`phase`、`dimensionId`、`retention`。
- `Alembic/lib/http/routes/modules.ts` 已有 bootstrap report artifact 读取路径，`AlembicCore/src/workflows/capabilities/persistence/WorkflowReportHistoryStore.ts` 已有 `bootstrap-reports/artifacts/<sessionId>/manifest.json` 思路；本波可复用设计，但必须明确 job artifact 的真实 API 和存储路径。

## 阶段顺序

1. Wave 1 / Agent correctness：已通过。
2. Wave 2 / Agent input layering：已通过。
3. Wave 3 / Observation Ledger：已通过。
4. Wave 4 / Artifact, trace and metrics：本波，只启动 `Alembic`。
5. Wave 5 / Timeline and artifact display：等 Alembic API / artifactRef 稳定后启动 `AlembicDashboard`。
6. Wave 6 / Package/runtime and integration verification：处理 `AlembicAgent/dist` / runtime 产物后，由 `AlembicTest` 做 test-mode / 小 cold-start 级验证。
7. 后续最高优先级 TODO：`GTODO-2026-05-25-003`，在监控可视化闭环建立后，用 progressive-chain-validation 做节点级 baseline 和优化。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| LLMI-P7-ALEMBIC-ARTIFACT-TRACE-METRICS | `Alembic` | 保存完整 redacted prompt / output artifact，补 artifactRef、trace envelope、metrics，并保持 Timeline 只展示摘要。 | 总控验收通过 |

### LLMI-P7-ALEMBIC-ARTIFACT-TRACE-METRICS：Alembic artifact / trace / metrics producer

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 14:32 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 14:32 CST

阶段目标：

- 让 Alembic 成为完整 redacted prompt / output artifact、trace envelope 和 metrics 的 producer。
- 让 Dashboard 后续只消费稳定 API / artifactRef，不再从 Timeline 截断内容猜完整 prompt。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/llm-input-optimization-research-2026-05-24.md`、`docs/workspace/current/llm-input-optimization-wave-3-2026-05-25.md` 和 `Alembic/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。
- 深挖 `BootstrapProcessEvents`、`DaemonJobRunner`、`JobProcessEventRecorder`、HTTP jobs / modules routes、JobStore / dataRoot / ProjectScope Ghost storage 的真实调用链。
- 在 Alembic 接收 Agent `llm.input` / `llm.output` process event 时，先基于收到的 redacted developer-visible text 保存完整 job artifact，再对 Timeline content 做摘要 / 截断投影；不要把已截断 Timeline 文本反向当作 artifact 正文。
- 为 job process event 增加或复用 `artifactRefs`，让事件 metadata 明确 `artifactRetained=true`、artifact kind、artifact path/ref、artifact original/retained chars、artifact redaction state、Timeline truncation state。
- 设计并实现 trace envelope：至少覆盖 `jobId`、`sessionId`、`dimensionId`、`iteration`、`correlationId`、`parentEventId`、`phase`；为后续 progressive chain 预留 `chainNodeId` / `stageId` 或等价字段，但不在本波实现完整 stopAt / 节点验证 harness。
- 提取 metrics：复用现有 `llmTrace`、input assembly metadata、efficiency summary、token usage、finish reason、duration、duplicate tool calls、empty retries、cache hits 等真实字段；没有来源的指标不要编造。
- 提供真实读取路径：要么扩展现有 job events endpoint 返回可 fetch 的 artifactRef，要么新增最小 job artifact endpoint；无论哪种，都要有 targeted test 证明 artifact 能读回，且路径被限制在 Ghost dataRoot / runtime root。
- 保持 source / secret 边界：不保存 raw provider payload、secret、hidden reasoning；artifact 只保存 redacted developer-visible prompt / output。若发现当前上游没有完整 redacted text，只能回填阻塞和所需 `AlembicAgent` 调整点。
- 回填执行记录到 `docs/Alembic/llm-input-optimization-artifact-trace-metrics-2026-05-25.md`，并从当前计划挂回。

合并 TODO：

- `GTODO-2026-05-24-040` 的 Wave 4 / prompt-output artifact、trace envelope、metrics producer。

明确不包含：

- 不改 Dashboard UI；Dashboard 等 Wave 5 消费稳定 API / artifactRef。
- 不刷新 `AlembicAgent/dist`；该后置门禁仍为 `GTODO-2026-05-25-002`。
- 不改 `AlembicPlugin`。
- 不做 full cold-start / rescan 复测。
- 不实现完整 `progressive-chain-validation` stopAt / node harness；本波只预留 trace 字段和 artifact / metrics 数据基础。
- 不把 raw provider payload、hidden reasoning 或 secrets 保存为 artifact。

下一处真实阻塞点：

- 没有 Alembic artifact / trace / metrics producer，Dashboard 只能继续消费被 `6000` 字投影截断的 Timeline content，无法可靠展示完整 LLM 输入输出，也无法给后续 Agent / LLM 优化建立可比较 baseline。

阻塞点之前还能做：

- 本包应一次完成 job artifact 写入、artifactRef 回链、trace envelope、可得 metrics、artifact read API 和 targeted tests；不要只加字段类型或空 artifact placeholder。

验证命令：

```text
# 由 Alembic 窗口按 Alembic/AGENTS.md 选择等价命令。
npm test -- BootstrapProcessEvents JobProcessEventRecorder DaemonJobRunner
npm run typecheck
npm run lint
git diff --check
```

回填要求：

- 完成范围、文件 / 模块变化、提交 hash。
- 真实代码证据：artifact 写入点、artifactRef 回链点、trace envelope 字段来源、metrics 字段来源、artifact read API / path safety。
- 验证命令和结果。
- 明确说明 artifact 存储位置、是否在 Ghost dataRoot / runtime root、是否不会写入真实项目源码目录。
- 明确说明 redaction 边界：保存的是 redacted developer-visible prompt / output，不是 raw provider payload。
- 若无法保存完整 artifact，必须说明是上游 `AlembicAgent` 事件源缺字段，还是 Alembic bridge 当前只拿到截断文本。
- 下一步建议：Dashboard 消费方式、AlembicTest 最小复测方式、`AlembicAgent/dist` 刷新时机。

执行前置硬规则：

- 先读取目标仓库 `Alembic/AGENTS.md`，并明确当前窗口定位 / 仓库职责。

## 执行回填

### LLMI-P7-ALEMBIC-ARTIFACT-TRACE-METRICS：Alembic

回填时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 20:36 CST

状态：总控验收通过

执行记录：[../../Alembic/llm-input-optimization-artifact-trace-metrics-2026-05-25.md](../../../../Alembic/llm-input-optimization-artifact-trace-metrics-2026-05-25.md)

完成范围：

- Alembic daemon 在录入 `llm.input` / `llm.output` / visible output process event draft 时，保存完整 redacted developer-visible text 为 job artifact。
- process event 带 `artifactRefs`、artifact retained metadata、trace envelope 和真实可得 `llmMetrics`。
- 新增 `GET /api/v1/jobs/:jobId/artifacts/:artifactId`，artifact 读取限制在 dataRoot scoped job artifacts 区域。
- 补 targeted tests 覆盖 artifact candidate、daemon 落盘 / 回链、artifact route URL 和既有 recorder 行为。

提交 hash：

- `aa5419434d51aa4d944c3614ecebd8aff47a009f`

验证命令 / 结果：

- `npm run test:unit -- BootstrapProcessEvents.test.ts DaemonJobRunner.test.ts JobsRoute.test.ts JobProcessEventRecorder.test.ts`：通过，4 files / 28 tests passed。
- `npm run typecheck`：通过。
- `npm run lint -- --diagnostic-level=error`：通过，Checked 212 files。
- `npm run lint:core-import-boundary`：通过，scanned 370 files and 451 `@alembic/core` imports。
- `npm run lint:consumer-core-imports`：通过，scanned 370 files and 451 `@alembic/core` imports。
- `git diff --check`：通过。
- `npm run build`：通过。

遗留风险：

- 本轮只完成 Alembic producer；Dashboard 仍需 Wave 5 消费 `artifactRefs[].ref`。
- `AlembicAgent/dist` 未刷新，仍保留为 `GTODO-2026-05-25-002`。
- 本窗口未跑 full cold-start / rescan；需要 AlembicTest 后续用 Test-08 做最小 test-mode / 小 cold-start 级验证。

下一步建议：

- 启动 `AlembicDashboard` Wave 5：从 process event `artifactRefs[].ref` 拉取完整 redacted artifact，Timeline 保持摘要，详情侧栏展示 full prompt / output 和 metrics。
- 启动 `AlembicTest` Test-08：验证 artifact fetch、Timeline projection、Observation Ledger 完整性和 secret / raw payload 边界。
- package/runtime 或 cold-start 集成前刷新 `AlembicAgent/dist`。

### 总控验收

验收时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 20:45 CST

验收结论：通过，已转入 [LLM 输入优化 Wave 5](../../../current/llm-input-optimization-wave-5-2026-05-25.md)。

总控复核要点：

- `Alembic` 工作区干净，提交 `aa5419434d51aa4d944c3614ecebd8aff47a009f` 覆盖 `BootstrapProcessEvents`、`DaemonJobRunner`、`JobProcessEventArtifacts`、jobs route 和 targeted tests。
- `BootstrapProcessEvents` 在 Timeline projection 前生成完整 redacted `textArtifactCandidate`，并写入 `traceEnvelope` 与真实可得 `llmMetrics`。
- `DaemonJobRunner` 在 dataRoot scoped `.asd/job-artifacts/<jobId>/` 下 materialize artifact，并把 `artifactRefs`、artifact retained metadata 和真实 `jobId` trace envelope 回链到 event。
- `JobProcessEventArtifacts` 使用 safe artifact id、path containment check 和 `0o600` 文件权限，避免写入真实项目源码目录或路径逃逸。
- `GET /api/v1/jobs/:jobId/artifacts/:artifactId` 先确认 job 存在，再从 dataRoot scoped artifact 区域读取。
- 总控复跑 `npm run test:unit -- BootstrapProcessEvents.test.ts DaemonJobRunner.test.ts JobsRoute.test.ts JobProcessEventRecorder.test.ts`：4 files / 28 tests passed。
- 总控复跑 `npm run typecheck`：通过。
- 总控复跑 `npm run lint -- --diagnostic-level=error`：通过，Checked 212 files。
- 总控复跑 `git diff --check HEAD^ HEAD`：通过。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-040 | 当前主线 Wave 4 已验收，已转 Wave 5 | internal agent llm input optimization | P0 | `AlembicDashboard` / `AlembicTest` | LLM 输入优化闭环。Wave 1/2/3/4 已通过总控验收；下一波补齐 Dashboard artifact 详情和测试复测。 | 是 | 当前转入 [llm-input-optimization-wave-5](../../../current/llm-input-optimization-wave-5-2026-05-25.md)。 |
| GTODO-2026-05-25-002 | 后置门禁 | build artifact sync | P1 | `AlembicAgent` | `AlembicAgent/dist` 未刷新，source test-mode 通过但 package/runtime/cold-start 验证前会消费旧产物。 | 是 | Source 侧输入结构稳定后，package/runtime 或 cold-start 集成验证前必须刷新并验证 dist；本波不处理。 |
| GTODO-2026-05-25-003 | 下一主线候选 | agent / llm optimization loop | P0 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | 监控可视化闭环建立后，用 baseline、artifact、trace 和 metrics 优化 Agent / LLM 输入输出，并结合 `progressive-chain-validation` 做节点级 baseline。 | 是 | 等 `GTODO-2026-05-24-040` 完整完成并归档后，经目标确认提升为下一主线。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | Alembic 已提交 `aa5419434d51aa4d944c3614ecebd8aff47a009f` 并通过总控复核。 |
| `AlembicCore` | 观察中 | 否 | 现有 Core event contract 已支持 `artifactRefs`、`correlationId`、`parentEventId`、`phase`；只有 Alembic 证明 contract 不足时再回填阻塞。 |
| `AlembicAgent` | 观察中 | 否 | Wave 3 source test-mode 已闭合；本波只有在 Alembic 发现上游没有完整 redacted event text 时才返修。 |
| `AlembicDashboard` | 阻塞 | 否 | 等 Alembic artifact API / artifactRef / metrics 稳定后再做 Timeline 摘要和 artifact 详情侧栏。 |
| `AlembicPlugin` | 无任务 | 否 | 本主线是 Alembic internal Agent 运行链路，不改变 Codex Plugin host-agent 路由。 |
| `AlembicTest` | 阻塞 | 否 | 等 Dashboard 回填后再创建 Test-08；当前不跑 full cold-start。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无（`Alembic` 已验收通过，下游已转 Wave 5）

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | `LLMI-P7-ALEMBIC-ARTIFACT-TRACE-METRICS` 已通过总控验收。 |
| `AlembicCore`<br>观察中 | 现有 event contract 暂够；若 Alembic 发现必须扩 contract，先回填阻塞。 |
| `AlembicAgent`<br>观察中 | 等 Alembic 验证上游事件是否包含完整 redacted text；必要时再返修。 |
| `AlembicDashboard`<br>阻塞 | 等 Alembic API / artifactRef 稳定后再启动 Wave 5。 |
| `AlembicPlugin`<br>无任务 | 不参与本轮。 |
| `AlembicTest`<br>阻塞 | 等 Dashboard 回填后再创建 Test-08。 |
| `BiliDili`<br>无任务 | 不参与本轮。 |

## 可复制分派提示词

当前文档不再发送提示词；新的可复制提示词见 [LLM 输入优化 Wave 5](../../../current/llm-input-optimization-wave-5-2026-05-25.md)。
