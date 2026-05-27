# Progressive Chain Validation N9 Observability Linkage - AlembicAgent

日期：2026-05-25
窗口：`AlembicAgent`
任务包：`PCVM-P3A-AGENT-N9-EVIDENCE-LINKAGE`
状态：待总控验收

## 当前窗口定位

- 本窗口是 `AlembicAgent` 执行窗口。
- 本轮仓库职责：只在 `AlembicAgent` 内实现 N9 analyze quality 的 node-local evidence producer，提供给 Alembic job-level carry / PCV scorecard 消费。
- 本轮不承担：不修改 `Alembic` daemon/API/Dashboard server，不修改 `AlembicCore` schema，不修改 `AlembicDashboard` UI，不修改 `AlembicPlugin`，不跑真实项目 full cold-start / rescan，不做 Agent prompt / runtime 策略优化。

## 完成范围

- 新增 `src/agent/runtime/PcvNodeEvidence.ts`，定义 PCVM node-local evidence summary 和 process metadata helper。
- `LoopContext` 初始化并返回 `pcvNodeEvidence`，使每次 `reactLoop` 的 `AgentResult` 都能携带当前节点证据摘要。
- `AgentRuntime` 在 LLM input assembly 后记录 `inputAssembly.ref`、stage identity、tool choice、tool schema names、correlation / model metadata；所有 developer-safe process event metadata 都挂载 compact `pcvNodeEvidence`。
- `AgentRuntime` 在 tool end 后记录 sourceRefs，并对 `note_finding` / `memory.note_finding` 写入 accepted / rejected finding refs、repair status 和 rejection reason。
- `insightGateEvaluator` 在 quality gate artifact 上挂载 `pcvNodeEvidence`，补齐 quality gate status、score、suggestions、memory finding count、sourceRefs 和 artifact finding refs。
- `runtime/index.ts` 显式导出 PCVM evidence 类型和 helper，供宿主或后续测试读取。
- 增加 targeted tests 覆盖 LLM input metadata、Observation Ledger ref、tool process event metadata、真实 direct `note_finding` accepted ref、quality gate artifact linkage。

## 提交 hash

- `AlembicAgent` commit：`7ab94575ed9b475dc57253c88738e1f061a3c547`（`feat: add pcv n9 evidence linkage`）

## N9 evidence producer 字段

- `nodeId` / `chainNodeId`：优先消费 runtime context 显式字段，缺省使用 `agent:<stage>:<dimension-scope>` 稳定生成。
- `stageIdentity`：包含 `pipelinePhase`、`trackerPhase`、`pipelineType`、`stageProfile`、`dimensionId`、`targetName`。
- `correlation`：包含 `dimensionId`、`dimensionScopeId`、`iteration`、`modelRef`、`runId`、`source`、`targetName`。
- `inputAssembly`：包含 `ref`、`stageProfile`、`inputSectionIds`、`providerVisibleSectionIds`、`staticSectionIds`、`messageCount`、`providerMessageCount`、`requestedToolChoice`、`effectiveToolChoice`、`toolSchemaNames`。
- `ledgerRefs`：当前从 `ActiveContext` 生成 `active-context:<dimension-scope>`，并携带 developer-safe stats。
- `findingRefs.accepted`：记录成功写入 ActiveContext 的 `note_finding`，以及 quality artifact 中已进入 gate 的 findings。
- `findingRefs.rejected`：记录失败或未写入 ActiveContext 的 `note_finding`，附带 reject reason。
- `sourceRefs`：从 tool args / result / envelope、finding evidence、quality artifact referenced files 中提取文件路径和行号。
- `qualityGate`：在 `insightGateEvaluator` 中挂载 `status`、`pass`、`action`、`reason`、`scores`、`totalScore`、`suggestions`、`memoryFindingCount`、`findingCount`、`referencedFileCount`。
- `repair`：记录 record repair 是否被要求、当前状态、原因和 evidence paths。
- `missingLinkReasons`：在字段缺失时输出 `missing-input-assembly-ref`、`missing-observation-ledger-ref`、`missing-finding-refs`、`missing-source-refs`、`missing-quality-gate-status`。

## 验证命令

- `npm test -- llm-input-layering`：通过，6 tests。
- `npm test -- AgentRuntime`：通过，9 tests。
- `npm test -- evidence-recording-phase-chain`：通过，11 tests。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run check`：通过，22 files / 106 tests；包含 build:check、lint、agent import boundary、public API boundary、Core import boundary 和全量 vitest。
- `git diff --check`：通过。

## 验证结果

- LLM input process event metadata 中存在 `pcvNodeEvidence.inputAssemblyRef`，且不泄漏 fixture secret。
- `AgentResult.pcvNodeEvidence.inputAssembly` 能稳定表达 analyze stage input assembly。
- Observation Ledger 场景输出 `ledgerRefs: ["active-context:architecture:analyst"]`。
- tool process event metadata 可携带 compact PCVM evidence，且 tool result secret 被脱敏。
- direct `note_finding` 实际经 runtime 转为 `memory.note_finding` 执行后，`pcvNodeEvidence.findingRefs.accepted` 写入 `src/foo.ts:10` sourceRef。
- insight quality gate artifact 输出 `pcvNodeEvidence.qualityGate.status=pass`，保留 input assembly、ledger ref、source refs 和 accepted finding refs。

## 与 Alembic carry 的消费说明

- Alembic 可优先读取 process event metadata 的 `pcvNodeEvidence.nodeId`、`chainNodeId`、`inputAssemblyRef`、`ledgerRefs`、`sourceRefs`、`acceptedFindingRefs`、`rejectedFindingRefs`、`qualityGate` 和 `repair`。
- 对完整 artifact / scorecard，Alembic 或 AlembicTest 应优先读取 `AgentResult.pcvNodeEvidence` 或 quality gate artifact 的 `pcvNodeEvidence`。
- 如果宿主只能看到 process event，process metadata 是 compact ref 层；如果宿主要生成 scorecard，仍应关联 result / artifact 中的完整 `pcvNodeEvidence`。

## 遗留风险

- 本轮只提供 producer evidence，不验证 Alembic job-level carry 与 Agent explicit fields 的真实跨仓库串联；该验证应进入 Wave 3B `AlembicTest`。
- 未新增 `AlembicCore` 共享 schema；若 Alembic / AlembicTest 后续需要跨包稳定类型，可再评估是否下沉 schema。
- 没有跑真实项目 full cold-start / rescan；本轮按总控要求只做 unit / boundary / package-level check。

## 下一步建议

- 总控验收 `AlembicAgent` commit 和本回填后，将 Wave 3A 状态切到等待 `AlembicTest`。
- 创建 Wave 3B `AlembicTest` 最小 test-mode 验证单：读取 `AlembicAgent` explicit `pcvNodeEvidence` 与 `Alembic` commit `647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9` 的 job-level carry，确认 N9 scorecard 是否能从 `blocked-by-observability-gap` 进入真实 baseline，或输出精确剩余 missing link。
