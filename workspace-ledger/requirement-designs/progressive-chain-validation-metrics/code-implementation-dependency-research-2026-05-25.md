# Progressive Chain Validation Metrics Code Dependency Research

日期：2026-05-25
状态：已完成，支撑目标阶段确认
维护窗口：AlembicWorkspace

## 调研来源

- Design 原始计划：[progressive-chain-validation-metrics-original-plan-2026-05-25.md](progressive-chain-validation-metrics-original-plan-2026-05-25.md)
- Design 需求设计：[progressive-chain-validation-metrics-requirement-design-2026-05-25.md](progressive-chain-validation-metrics-requirement-design-2026-05-25.md)
- Workspace TODO：`GTODO-2026-05-25-003`
- 当前确认入口：[progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md](../../workspace/current/progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md)

本轮没有联网调研。原因：PCVM 第一阶段问题是本地 progressive-chain-validation skill、Alembic process artifact / trace / metrics、AlembicAgent N9 analyze 链路和 AlembicTest 证据入口的真实连通性确认；本地代码事实足够决定 producer / consumer 顺序。

## 总结结论

`GTODO-2026-05-25-003` 可以提升为新主线，但第一波不能先派 `AlembicTest` 或直接优化 `AlembicAgent`。进一步复核后，PCV 也不应直接在 `Alembic` 父仓库中开发：`Alembic` 和 `AlembicPlugin` 都通过 submodule 引入同一个 `GxFn/progressive-chain-validation.git` source。用户已确认将 PCV 单独拉出；当前 canonical source 是 workspace 顶层 `progressive-chain-validation/`，后续再由两个父仓库删除 / 替换内部 submodule。

当前建议：

- 顶层 `progressive-chain-validation` skill source 作为 Wave 0 producer，补 PCV skill、cold-start / rescan overlay、plan template 和 N9 analyze quality baseline / scorecard / comparison 报告格式。
- `AlembicPlugin` 与 `Alembic` 作为 Wave 1 consumers，删除 / 替换内部 `skills/progressive-chain-validation` submodule，调整 `.gitmodules`、gitlink、测试和文档；不得在父仓库制造分叉版 skill。
- `AlembicAgent` 第一波只作为代码事实来源和观察窗口，不改 prompt/runtime。
- `AlembicTest` 等 PCV source 与两个父仓库消费验证回填后再接测试单，验证真实 baseline 证据和默认使用规则。
- `AlembicDashboard` 不参与第一版 UI；`AlembicPlugin` 参与 submodule consumer 验证但不承载 skill 内容分叉。
- `AlembicCore` 第一波不新增共享 schema；只有出现稳定跨包 consumer 后再评估 contract 下沉。

## 代码事实

### Alembic / PCV skill

- `Alembic/skills/progressive-chain-validation/progressive-chain-validation/SKILL.md` 已存在 progressive-chain-validation skill。
- `Alembic/skills/progressive-chain-validation/progressive-chain-validation/references/chain-plan-generation.md` 和 `references/overlays/alembic-coldstart-rescan.md` 已承载 chain plan / cold-start rescan overlay。
- `Alembic/skills/progressive-chain-validation/progressive-chain-validation/templates/plan.md` 是当前 plan 输出模板。
- `Alembic/test/unit/progressive-chain-validation-skill.test.ts` 已存在 skill 级单测入口。
- `Alembic/skills/progressive-chain-validation` 是 submodule，远程为 `https://github.com/GxFn/progressive-chain-validation.git`，当前 hash 为 `a6c371c8b123fc79f218d362cd6bae61a0679d61`。
- 当前没有发现 PCV scorecard / baseline / before-after comparison 的稳定报告契约；因此第一波应先在独立 skill source 的 skill / overlay / template 层补方法和验证，而不是让下游猜格式。

### 顶层 PCV source

- `progressive-chain-validation/` 已作为 workspace 顶层真实仓库拉出，远端为 `https://github.com/GxFn/progressive-chain-validation.git`，当前 hash 为 `a6c371c8b123fc79f218d362cd6bae61a0679d61`。
- AlembicWorkspace `.gitignore` 已加入 `/progressive-chain-validation/`，避免总控仓库误跟踪 PCV 源码。
- 顶层仓库是 PCV canonical source；`Alembic` 与 `AlembicPlugin` 内部 checkout 后续只作为待删除 / 待替换的 consumer residual。

### AlembicPlugin / PCV skill

- `AlembicPlugin/skills/progressive-chain-validation` 同样是 `https://github.com/GxFn/progressive-chain-validation.git` submodule，当前 hash 同为 `a6c371c8b123fc79f218d362cd6bae61a0679d61`。
- `AlembicPlugin/test/unit/progressive-chain-validation-skill.test.ts` 与 `Alembic` 侧有同名 skill 消费测试。
- `diff -qr Alembic/skills/progressive-chain-validation AlembicPlugin/skills/progressive-chain-validation` 当前无差异；这说明两边目前不是普通手写双份，而是同一 source 的两个 checkout。
- `a6c371c8b123fc79f218d362cd6bae61a0679d61` 的最后提交时间为 `2026-05-10 23:35:42 +0800`，提交信息为 `Create progressive chain validation skill`。PCVM 进入开发前，必须把 canonical source 和 submodule pointer 更新路线写清。

### Alembic / artifact, trace, metrics

- `Alembic/lib/daemon/DaemonJobRunner.ts` 已能 materialize redacted prompt / output artifact，并构造 trace envelope；trace 字段包含 `chainNodeId`、`correlationId`、`dimensionId`、`iteration`、`parentEventId`、`phase`、`sessionId`、`stageId`。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts` 已构造 `llmMetrics` 和 trace envelope，并有 `chainNodeId` 提取逻辑。
- `Alembic/lib/daemon/JobProcessEventArtifacts.ts` 负责 job artifact 存储，storage scope 为 `ghost-data-root-job-artifacts`。
- `Alembic/lib/http/routes/jobs.ts` 已暴露 job events / artifacts API 和 `readJobProcessEventArtifact` 路径。
- 这些事实说明 PCVM 可以使用已有 artifact / trace / metrics 作为 baseline 证据来源；若某个节点无法关联到 `chainNodeId` 或 stage 语义，第一波必须显式记录 `blocked-by-observability-gap`，不得伪造 verdict。

### AlembicCore / shared contracts

- `AlembicCore/src/daemon/JobProcessEventContracts.ts` 已包含 `artifactRefs`、`content`、`correlationId`、`parentEventId`、`phase`、`dimensionId` 等 process event 字段。
- `AlembicCore/src/shared/folder-names.ts` 已包含 `chainRuns` folder name。
- 当前没有发现 PCV scorecard / comparison 的共享 contract；第一波不应提前新增 Core schema，除非 `Alembic` producer 实现中发现跨包消费已经稳定。

### AlembicAgent / N9 analyze quality

- `AlembicAgent/src/agent/prompts/scan-prompts.ts` 已定义 Analyze / Produce stage prompt，Producer 会消费 structured findings。
- `AlembicAgent/src/agent/profiles/AgentStageFactoryRegistry.ts` 已定义 analyze stage 配置和迭代边界。
- `AlembicAgent/src/agent/prompts/insight-gate.ts` 包含 `analysisQualityGate`、`note_finding` 要求和 record repair 逻辑。
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts` 已记录 LLM input assembly、`note_finding` tool calls 和 runtime 层事件。
- `AlembicAgent/src/agent/runtime/LLMInputAssembly.ts`、`src/agent/memory/ActiveContext.ts` 可作为 N9 input composition / Observation Ledger 质量判断来源。
- 已有相关测试：`test/llm-input-layering.test.ts`、`test/evidence-recording-phase-chain.test.ts`、`test/llm-input-correctness.test.ts`、`test/AgentRuntime.test.ts`、`test/memory-note-finding.test.ts`。
- 因此 N9 v1 可以定义真实 baseline；但 Agent prompt/runtime 优化应等 baseline 证明后进入下一主线，不应和 PCV 框架第一波混在一起。

### AlembicTest / verification

- 现有 probes 包含 `probe-llm-input-agent-correctness.mjs`、`probe-llm-input-layering.mjs`、`probe-llm-observation-ledger.mjs`、`probe-package-runtime-integration.mjs`、`probe-dashboard-artifact-detail.mjs`。
- `AlembicTest/scripts/README.md` 已索引 probe 入口。
- 已有报告证明 test-mode fixtures 和 package/runtime capture 可用，包括 `llm-input-agent-correctness-test-mode-2026-05-25.md`、`llm-input-layering-test-mode-2026-05-25.md`、`llm-input-observation-ledger-test-mode-2026-05-25.md`、`llm-input-dashboard-artifact-detail-test-mode-2026-05-25.md`、`llm-input-package-runtime-integration-2026-05-25.md`。
- 未发现现成 progressive-chain-validation scorecard / comparison probe；`AlembicTest` 应在 `Alembic` producer 回填后再创建 PCVM Test-01。

## 边界与非目标

- 第一版不做 Dashboard comparison UI。
- 第一版不要求真实 optimized-after；N9 只需要真实 baseline 和可复验 scorecard 证据。
- 第一版不直接优化 `AlembicAgent` prompt/runtime，避免没有 baseline 就改 Agent。
- 第一版不新增 Core schema，除非 producer 实现证明有稳定跨包 consumer。
- 第一版不把简单本地测试强制改成 PCV；PCV 应成为 cold-start / rescan 长链、Agent 优化、baseline / comparison 的默认入口，简单局部测试可以 opt out 并写明理由。

## 阶段依赖

1. 总控目标阶段确认：用户确认 PCVM 的最终完成定义、非目标、canonical source 和 producer / consumer 顺序。
2. `progressive-chain-validation` source producer：补 PCV scorecard / baseline / comparison 方法、模板、overlay 和 N9 baseline 示例 / gap verdict。
3. `AlembicPlugin` / `Alembic` consumer cleanup：删除 / 替换两边内部 submodule，移除或替换 progressive-chain-validation skill 单测，确认两个父仓库不再保留 PCV source copy。
4. `AlembicTest` consumer：基于 producer 和 submodule consumers 回填创建 PCVM Test-01，验证真实 baseline 证据和 PCV 默认使用规则。
5. 后续 Agent 优化主线：在 baseline 和 comparison format 稳定后，逐项优化 N9 / stage profile / Observation Ledger / tool policy，并用同 fixture before / after 证明。
