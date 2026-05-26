# Progressive Chain Validation N9 Observability Linkage - Alembic

日期：2026-05-25

窗口：`Alembic`

任务：`PCVM-P3A-ALEMBIC-N9-OBSERVABILITY-CARRY`

提交 hash：`647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9`

## 当前窗口定位和仓库职责

- 当前窗口定位：`Alembic` 主仓库执行窗口。
- 本轮仓库职责：只负责 Alembic job / daemon / HTTP API 侧的 N9 observability carry，把已有 process event、artifactRefs、trace envelope、llm metrics、sourceRefs 和 artifact read API 串成 PCV 可读的同一节点证据链。
- 明确不承担：不做 `AlembicAgent` prompt / runtime 策略，不做 Dashboard UI，不做 `AlembicTest` 真实项目验证，不恢复内部 PCV submodule，不伪造 N9 quality score。

## 完成范围

- 新增 `lib/daemon/PcvObservabilityLinkage.ts`，定义 Alembic-owned N9 observability carry：
  - `metadata.pcvN9Observability`
  - `metadata.pcvObservability.n9`
  - enriched `metadata.traceEnvelope`
- 更新 `lib/daemon/DaemonJobRunner.ts`，在 bootstrap process event drafts 完成 artifact materialization 后、写入 `JobProcessEventRecorder` 前挂载 N9 linkage metadata。
- 更新 `test/unit/DaemonJobRunner.test.ts`，覆盖：
  - artifact / trace / metrics / sourceRefs 均存在时 `linkageStatus=linked`
  - Agent evidence 不完整时输出精确 missing-link reason，并保持 `blocked-by-observability-gap`
  - materialized artifact 仍可通过原有 artifact read path 读取

## N9 Linkage 字段

Alembic job process event metadata 暴露以下 developer-visible 字段：

- `metadata.pcvN9Observability.contractVersion`
- `metadata.pcvN9Observability.nodeId`
- `metadata.pcvN9Observability.nodeIdentitySource`
- `metadata.pcvN9Observability.linkageStatus`
- `metadata.pcvN9Observability.missingLinkReasons`
- `metadata.pcvN9Observability.evidenceLinks.artifactRefs`
- `metadata.pcvN9Observability.evidenceLinks.metricsPath`
- `metadata.pcvN9Observability.evidenceLinks.sourceRefs`
- `metadata.pcvN9Observability.evidenceLinks.traceId`
- `metadata.pcvN9Observability.firstFix`
- `metadata.traceEnvelope.pcvNodeId`
- `metadata.traceEnvelope.nodeId`
- `metadata.traceEnvelope.chainNodeId`
- `metadata.traceEnvelope.jobId`
- `metadata.traceEnvelope.artifactRefs`
- `metadata.traceEnvelope.metricsPath`
- `metadata.traceEnvelope.sourceRefs`
- `metadata.traceEnvelope.traceId`

N9 node id 固定为 `N9-agent-analyze-quality`。如果 Agent 已显式发出 `pcvNodeId` / `nodeId` / `chainNodeId`，Alembic 使用 `nodeIdentitySource=agent-explicit`；如果尚未显式发出，但 process event 是 analyze / verify / record stage profile，则使用 `nodeIdentitySource=host-stage-profile` 进行可诊断 carry。

## Missing-Link 语义

当任一必要证据缺失时，Alembic 不产生质量分，只记录：

- `linkageStatus=blocked-by-observability-gap`
- `artifact_missing`
- `trace_id_missing`
- `metrics_missing`
- `source_ref_missing`
- `node_identity_missing`

`firstFix` 会给出第一修复方向，供 `AlembicAgent` 或后续测试窗口定位缺口。

## AlembicAgent 依赖说明

本提交不依赖新的 `AlembicAgent` commit。当前 Alembic 可消费以下已有或未来稳定字段：

- `pcvNodeId` / `nodeId` / `chainNodeId`
- `metadata.llmMetrics`
- `metadata.sourceRefs` / `metadata.referencedFiles`
- `metadata.findings[].sourceRefs`
- `traceEnvelope.correlationId` / `traceEnvelope.traceId`
- process event text artifact candidate 生成的 `artifactRefs`

若 `AlembicAgent` 后续补齐 explicit N9 evidence producer，Alembic 会优先使用 explicit node identity；若字段仍缺失，则继续输出精确 missing-link reason。

## API 兼容性

- 不新增或修改 HTTP route。
- 不修改 artifact redaction 和 artifact read API。
- 不要求 Dashboard 新 UI。本轮字段通过现有 job process event developer view metadata 透出，Dashboard 现有消费应保持兼容。
- 本轮不需要 `AlembicCore` schema 变更；当前使用 `JobProcessEvent.metadata` 的扩展字段即可满足 Alembic 侧 carry。若 `AlembicAgent` 与 `AlembicTest` 后续确认需要跨包稳定 schema，再由总控评估是否下沉。

## 验证命令和结果

- `npm run test:unit -- DaemonJobRunner.test.ts BootstrapProcessEvents.test.ts JobsRoute.test.ts`
  - 结果：通过，3 files / 28 tests passed。
- `npm run check`
  - 结果：通过，包含 typecheck、biome lint、agent extraction boundary、core import boundary、consumer core imports。
- `git diff --check`
  - 结果：通过。

## 遗留风险

- 真正解除 N9 observability gap 仍依赖 `AlembicAgent` 发出更稳定的 node-local evidence，例如 Observation Ledger、`note_finding` id、quality gate / repair / reject details 和 source refs。
- Host stage profile 只能让 Alembic 侧先建立可诊断 carry；不能替代 Agent explicit node identity，也不会生成质量分。
- Wave 3B 仍需 `AlembicTest` 用最小 test-mode fixture 验证 `linked` 与 `blocked-by-observability-gap` 两种结果能被 PCV scorecard 正确读取。

## 下一步建议

- `AlembicAgent` Wave 3A 应补齐 explicit `pcvNodeId=N9-agent-analyze-quality`、trace id、llm metrics、source refs / finding refs、quality gate evidence。
- `AlembicTest` Wave 3B 等 `AlembicAgent` 与 `Alembic` 均回填后，使用现有 job process events 和 artifact API 做最小 test-mode 验证。
- 若 `AlembicTest` 证明多个仓库需要同一字段契约，再评估是否把 N9 observability carry schema 下沉到 `AlembicCore`。

## Wave 3C Nested Evidence Consumer Extraction

任务：`PCVM-P3C-ALEMBIC-NESTED-EVIDENCE-CONSUMER-EXTRACTION`

提交 hash：`ae9531ac3315a4491e22e3df156cb05e13fc0879`

完成范围：

- 修复 `lib/daemon/PcvObservabilityLinkage.ts` 对 nested `metadata.pcvNodeEvidence.nodeId` / `chainNodeId` / `sourceRefs` / `referencedFiles` 的消费。
- 保持现有 top-level metadata、`metadata.pcvNode`、trace envelope 和 host-stage fallback。
- 在 `test/unit/DaemonJobRunner.test.ts` 新增 nested-only unit，覆盖无顶层 `sourceRefs` 时仍能从 nested evidence 进入 `linked`。

修改文件：

- `lib/daemon/PcvObservabilityLinkage.ts`
- `test/unit/DaemonJobRunner.test.ts`

nested `metadata.pcvNodeEvidence` 消费策略：

- N9 identity 判定现在同时读取 top-level `pcvNodeId` / `nodeId` / `chainNodeId`、`metadata.pcvNode.nodeId`、nested `metadata.pcvNodeEvidence.nodeId` / `chainNodeId` 和 trace envelope；任一 explicit candidate 命中 `N9-agent-analyze-quality` 即视为 `nodeIdentitySource=agent-explicit`。
- source refs 收集现在合并 top-level `sourceRefs` / `referencedFiles`、nested `pcvNodeEvidence.sourceRefs` / `referencedFiles`、top-level findings source refs 和 nested findings source refs，并按原逻辑去重。
- 缺字段时仍输出精确 `missingLinkReasons`，不伪造 source refs 或质量分。

nested-only unit 结果：

- 新增测试 `consumes nested PCV N9 evidence without top-level source refs`。
- 测试断言 nested `sourceRefs=["src/index.ts:42"]` 进入 `pcvN9Observability.evidenceLinks.sourceRefs` 和 enriched `traceEnvelope.sourceRefs`。
- 测试断言 `missingLinkReasons=[]`、`firstFix=[]`、`linkageStatus=linked`、`nodeIdentitySource=agent-explicit`。

验证命令和结果：

- `npm run test:unit -- DaemonJobRunner.test.ts`
  - 结果：通过，1 file / 9 tests passed。
- `npm run check`
  - 结果：通过，包含 typecheck、biome lint、agent extraction boundary、core import boundary、consumer core imports。
- `git diff --check HEAD^ HEAD`
  - 结果：通过。

是否可派 `AlembicTest` 重跑 `Test-2026-05-25-11`：

- 可以。Alembic 已修复 Test-11 指向的 nested sourceRefs consumer extraction 缺口，并有 nested-only unit 证明同一事件形态可以进入 `linked`。

遗留风险：

- 本轮没有运行 full cold-start / rescan，也没有直接执行 `AlembicTest` probe；真实跨仓库验收仍需 `AlembicTest` 重跑 Test-11 同一 probe。
- 若后续 Agent 扩展 `pcvNodeEvidence` 为更复杂结构，仍需评估是否抽出共享 schema；本轮不需要 `AlembicCore` schema 变更。

下一步建议：

- 总控验收本提交后，可派 `AlembicTest` 重跑 `Test-2026-05-25-11 / PCVM-P3B-N9-Observability-Linkage-Minimal` 同一 probe。
- 重跑通过后再考虑 Wave 4 Agent / LLM before-after 优化，避免在真实 N9 baseline linkage 未闭合前启动优化。
