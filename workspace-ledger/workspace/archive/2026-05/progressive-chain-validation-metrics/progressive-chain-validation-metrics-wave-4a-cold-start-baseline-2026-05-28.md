# Progressive Chain Validation Metrics Wave 4A - Cold-start Chain Baseline

日期：2026-05-28
状态：Wave 4J 总控验收通过，Wave 4A 待归档
发送给：无
总控定位：本文件是 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 的当前总控计划。PCV 作为方法源接入 Workspace 后，当前 PCV 产物跟随 Workspace 活跃账本：本文件承载当前 baseline / readiness，后续通过验收后再归档到 `workspace-ledger/`。

## 目标判断

- 用户目标：回归 PCV，先优化 cold-start 链路；在优化前，把 Alembic cold-start / bootstrap 按 PCV N0-N14 节点拆成可观察、可停止、可复验的 baseline。
- 最终完成定义：PCVM 能为 Alembic cold-start / rescan 给出节点级 baseline、artifact / trace / metrics / sourceRef 证据、blocked-by-observability-gap 判断、before / after comparison 入口，并据此选择第一个真实优化点。
- 当前是否已经达到：当前 Wave 4A cold-start sourceRef 优化闭环已达到。Wave 4H 固定 before baseline 为 `9/33` invalid，Wave 4I 完成 Agent producer / submit 侧 grounding，Wave 4J 真实 / 默认 AI after-run 为 `0/11` invalid，且 latest report、session report API、persisted bootstrap report、persisted session report 均一致。
- 未达到时剩余差距：本 Wave 4A 无剩余可派发阻塞。更大 PCVM 后续仍可继续做其它节点或 rescan baseline，但需要作为下一阶段目标重新裁决，不在本轮自动展开。
- 已达到时验收 / 归档判断：已达到，当前计划进入待归档；不自动领取 038 / 039 或其它新主线。
- 当前任务分区：验收 / 收束。Stage 0 源码事实基线已形成；Wave 4B / 4E / 4F / 4G / 4H / 4I / 4J 均已通过总控验收；当前不再派发窗口。
- 不纳入本轮事项：不优化 Agent prompt，不做 Dashboard comparison UI，不修改真实测试项目业务结构，不把 broad smoke 当成节点通过。

## 总控决策记录

- 本次决策触发：用户确认 PCV 已引入 Workspace，要求 PCV 产出跟随 Workspace 走，并继续 PCVM；截图中明确下一阶段是 `PCVM Wave 4A: Cold-start Chain Baseline / Readiness`。2026-05-28 21:06 CST 总控验收 Wave 4G runtime surface 通过，把固定数量 baseline 漂移归口到 Wave 4H deterministic replay；2026-05-28 21:48 CST 总控验收 Wave 4H 通过，进入第一轮 sourceRef grounding 优化；2026-05-28 22:34 CST 总控验收 Wave 4I 通过，进入真实 / 默认 AI after-run。
- 需求 / 测试结果理解：Wave 3D 证明 nested N9 evidence 可进入 linked baseline；Wave 4B 证明 N8 / N11 / N12 node-local evidence surface 已进入 Alembic report / process-event / unit 层。cold-start 优化前仍需要真实 runtime 确认，不能直接进入 Agent prompt 优化。
- 已核对证据：PCV source HEAD、PCV overlay、Alembic cold-start / daemon / dimension pipeline / process-event 源码和相关 targeted tests 均已核对；细项如下。
  - PCV source checkout：`progressive-chain-validation/`，HEAD `3322646aa57c67c164eec20626ec5edd9d05b113`。
  - Workspace PCV bridge：`codex-control-workspace/skills/dev/progressive-chain-validation/SKILL.md`，已更新 observed source commit。
  - PCV overlay：`progressive-chain-validation/progressive-chain-validation/references/overlays/alembic-coldstart-rescan.md`，规定 cold-start 顺序和 N9 / N11 evidence floors。
  - Alembic source HEAD：`070e46d94db4f579d46647a05c09fb7ca16db275`。
  - Alembic Wave 4B 提交：`070e46d94db4f579d46647a05c09fb7ca16db275`，新增 `BootstrapPcvNodeLocalEvidence`、`pcvScorecard`、per-dimension `pcvNodeEvidence` 和 targeted tests。
  - cold-start 入口：`Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`。
  - async dimension pipeline：`Alembic/lib/workflows/capabilities/execution/internal-agent/`。
  - job event / artifact linkage：`Alembic/lib/daemon/DaemonJobRunner.ts`、`Alembic/lib/daemon/PcvObservabilityLinkage.ts`、`Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts`。
- 是否需要先验证 / 重新计划 / 用户确认：当前不需要重新确认验收结论；继续下一个 PCVM 节点、rescan baseline、Dashboard comparison UI 或 038 / 039 需要另行总控裁决 / 用户确认，不在本 heartbeat 自动领取。
- Wave 4F 验收：`Alembic` commit `125be96a0086577bc731953eca7d7b3165593bc1` 已补 N11 sourceRef validity metrics / missing reasons / scorecard quality gate。总控复跑 `git diff --check HEAD^ HEAD`、`npm run lint`、`npm run typecheck`、`npm run test:unit -- BootstrapProcessEvents BootstrapProjection BootstrapDimensionConsumer InternalDimensionFillFinalizer` 均通过。
- Wave 4G 验收：总控复核 `AlembicTest/tmp/pcvm-wave4g-n11-sourceref-validity-summary.json`、latest report 和 persisted reports，确认 runtime surface 通过：N11 `status=blocked-by-observability-gap`、`producer_source_refs_invalid`、`sourceRefValidity` 进入报告；固定 `9/33` 未复现，实际 `1/20`，因此下一步 Wave 4H 补 deterministic replay。
- Wave 4H 验收：`Alembic` commit `df4c89c27f113330216ce3493f725c9fe771b586` 新增 deterministic N11 sourceRef replay 入口、Wave 4E 33-ref fixture 和 targeted unit。总控复跑 `git diff --check df4c89c^ df4c89c`、`npm run lint`、`npm run typecheck`、`npm run test:unit -- PcvN11SourceRefReplay` 均通过，固定 baseline 为 `9/33` invalid refs。
- Wave 4I 验收：`AlembicAgent` commit `4acc068284cab54bf71d33aaa4a26e102e85356a` 新增 producer sourceRef grounding prompt section，并在 `knowledge.submit` 中只对 projectRoot 真实文件、trusted analysis refs 精确命中或 basename 唯一命中的 sourceRefs 做规范化；未证实 ref 原样保留给 N11 scorecard。总控复跑 `git diff --check 4acc068^ 4acc068`、`npm run typecheck`、`npm test -- tool-v2-contract llm-input-layering`、`npm run check` 均通过。
- 本次允许更新：活跃 Workspace 当前计划、当前状态、TODO 挂载、测试交流、VAD runtime。
- 本次不得更新：产品源码、PCV source 方法内容、真实测试项目业务结构。

## Design / 需求来源

- 来源类型：`GTODO-2026-05-25-003` 提升 + 用户直接确认继续 PCV。
- 来源文档：
  - [PCVM Wave 0 / Wave 3 当前历史](../../../../../codex-control-workspace/.workspace-active/workspace/current/progressive-chain-validation-metrics-wave-0-2026-05-25.md)
  - [PCVM 目标阶段确认](../../../../../codex-control-workspace/.workspace-active/workspace/current/progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md)
  - [PCVM 代码实现依赖调研](../../../../requirement-designs/progressive-chain-validation-metrics/code-implementation-dependency-research-2026-05-25.md)
  - [Workspace PCV bridge](../../../../../codex-control-workspace/skills/dev/progressive-chain-validation/SKILL.md)
- 用户确认状态：已确认回归 PCV；本轮按 Stage 0 调研，不提前实现。
- 总控接收结论：PCV 产物进入 Workspace current / ledger 体系；PCV source 只保存通用方法，不保存 Alembic 项目运行账本。
- 是否需要目标阶段确认：已有 PCVM 目标阶段确认；Wave 4A 只补当前阶段执行计划。
- 是否需要代码实现依赖调研：本轮正在补 cold-start N0-N14 代码事实基线。

## 代码事实与边界

- 相关仓库：`progressive-chain-validation`、`codex-control-workspace`、`Alembic`。
- 关键入口：
  - PCV canonical package：`progressive-chain-validation/progressive-chain-validation/`。
  - Alembic cold-start internal workflow：`runInternalColdStartWorkflow()`。
  - Alembic daemon job runner：`enqueueDaemonJob()` / `runDaemonJob()`。
  - dimension async execution：`startInternalDimensionExecutionSession()` / `dispatchInternalDimensionExecution()` / `fillInternalDimensions()`。
  - process event / trace / metrics：`BootstrapProcessEvents.ts`、`PcvObservabilityLinkage.ts`。
- producer / consumer 依赖：PCV source 提供方法；Workspace 记录 baseline；`Alembic` 提供 cold-start / job / event / persistence 证据；`AlembicAgent` 只在分析质量或 prompt/runtime 需要改动时进入；`AlembicTest` 只在需要真实 cold-start / rescan / runtime 环境证据时进入。
- 不可提前消费的上游：N0-N14 节点 baseline 没形成前，不能把 full cold-start 结果当成节点 score；N8/N11/N12 证据不清前，不能进入 Agent prompt 优化。
- 不允许触碰的目录 / 仓库：Wave 4J 只允许 `AlembicTest` 做真实 / 默认 AI test-mode after-run 验证；不改 `Alembic`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicCore` 或真实测试项目业务代码。
- 真实测试项目是否涉及：已涉及 `AlembicTest` 受保护真实 / 默认 AI fixture 验证；未修改真实测试项目业务代码。

## PCV Source 与 Workspace 产物关系

- PCV source 仓库保存通用方法、overlay、metrics contract、templates 和 examples。
- Workspace current 保存当前 PCVM 运行产物：baseline、节点缺口、派发任务包和验收结论。
- `workspace-ledger/` 保存完成后的 Alembic 项目长期证据。
- 子仓库只保存产品代码和随产品长期维护的文档，不保存跨仓库 PCV 调度账本。

## Cold-start N0-N14 节点事实基线

本表使用 Workspace 统一状态机；PCV readiness 只作为证据标签，不作为独立主状态。

| 节点 | 代码边界 | 现有证据 | Workspace 状态 | PCV 证据标签 | 下一步 |
| --- | --- | --- | --- | --- | --- |
| N0 Environment / write boundary | `resolveProjectRoot()`、`resolveDataRoot()`、`buildColdStartWorkflowPlan()`、`runFullResetPolicy()` | workflow plan、cleanup result、dataRoot / projectRoot 进入 response 和 logs；PCV overlay 要求 source-root pollution check。 | 观察中 | partial-evidence | 需要显式 PCV scorecard 字段记录 write boundary 和 source-root pollution check。 |
| N1 Bootstrap / ServiceContainer lifecycle | `enqueueDaemonJob()`、`runDaemonJob()`、`JobProcessEventRecorder`、service container resolution | job queued / running / completion events、bootstrap bridge、taskManager linkage。 | 观察中 | partial-evidence | 需要把 service lifecycle 与 PCV node id / job event 关联。 |
| N2 cold-start intent | `createInternalColdStartIntent()`、`buildColdStartWorkflowPlan()` | intent、skipAsyncFill、dimensions、cleanup policy、maxFiles/contentMaxLines 进入 workflow plan。 | 观察中 | source-ready | 需要等价 intent summary / hash，避免相同输入无法比较 baseline。 |
| N3 discovery | `ProjectIntelligenceCapability.run()` | Phase 1-4 scan、allFiles、read failures、skips、truncation 来源。 | 观察中 | partial-evidence | 需要节点级 file selection / skipped dirs / read failure metrics。 |
| N4 materialization | `buildProjectSnapshot()`、`buildInternalColdStartReport()`、`buildInternalColdStartTargetFileMap()` | snapshot、report、targetFileMap、language stats、dependency graph。 | 观察中 | source-ready | 可先做 baseline extraction；需要把 snapshot sufficiency / degraded analyzers 写进 scorecard。 |
| N5 rescan preservation | cold-start full reset 不走 rescan preservation | PCV overlay 明确 pure cold-start 标记 not-applicable。 | 无任务 | not-applicable | 本轮 cold-start baseline 不使用；rescan Wave 另开。 |
| N6 dimension plan | `selectColdStartDimensions()`、`applyTestDimensionFilter()` | selected dimensions、test filter、taskDefs。 | 观察中 | partial-evidence | 需要 requested/skipped/gap/execution reasons 可比字段。 |
| N7 session / tasks | `startInternalDimensionExecutionSession()`、`BootstrapTaskManager`、`buildTaskDefs()` | session id、dimension tasks、status API、cancel / abort tests。 | 观察中 | partial-evidence | 需要任务数、session id、cancel / abort linkage 写进 PCV node report。 |
| N8 stage factory / tool policy | `prepareInternalDimensionFillRun()`、`initializeBootstrapRuntime()`、`buildBootstrapSessionExecutionInput()` | Wave 4B `Alembic` 提交 `070e46d` 已新增 stage order、additionalTools、terminal capability hints、producer tool restriction evidence，并通过 targeted tests。 | 待真实验证 | linked-code | 需要 `AlembicTest` 确认 runtime report / artifact 中可复核。 |
| N9 analyze quality | `buildBootstrapDimensionInputProcessEvents()`、`runInternalDimensionAgentSession()`、`buildBootstrapDimensionResultProcessEvents()`、`PcvObservabilityLinkage` | Wave 3D 已证明 nested `pcvNodeEvidence` 可进入 N9 linked baseline；LLM input / output / trace / metrics / sourceRefs 有最小链路。 | 已完成 | linked-minimal | 当前只代表 N9 最小 linked baseline；仍需和 N8/N11 cut 点分离。 |
| N10 evolve / prescreen | cold-start 只在 existing recipe truth / decay / prescreen 进入时使用 | PCV overlay 标记 conditional。 | 无任务 | conditional | 本轮不作为 cold-start 主链路必经节点。 |
| N11 produce | `projectBootstrapDimensionAgentOutput()`、`consumeBootstrapDimensionResult()`、candidate projection / consumer tests | Wave 4F `Alembic` commit `125be96a0086577bc731953eca7d7b3165593bc1` 已补 validity metrics；Wave 4H deterministic replay 固定 `9/33` before baseline；Wave 4I `AlembicAgent` grounding policy 已通过；Wave 4J after-run 为 `0/11` invalid。 | 已完成 | linked-after-run | N11 sourceRef validity 的第一轮 before / after 优化闭环已验收；真实 AI output 非确定性边界保留。 |
| N12 consumers / persistence | `consumeBootstrapSkills()`、`consumeInternalDimensionCandidateRelations()`、`persistWorkflowResult()` | Wave 4B `Alembic` 提交 `070e46d` 已新增 accepted candidate findability、failure details persisted、PCV node link。 | 待真实验证 | linked-code | 需要 `AlembicTest` 确认 runtime report / artifact 中可复核。 |
| N13 finalizer policy | `finalizeInternalDimensionFill()`、`runWorkflowCompletionFinalizer()`、`skipTargetDelivery` branch | delivery / wiki / semantic / vector refresh finalizer inputs，skipTargetDelivery 控制。 | 观察中 | partial-evidence | 需要 delivery safety、rescan isolation、step result 写进 node-level report。 |
| N14 report / snapshot / history | `persistWorkflowResult()`、`writeWorkflowReportHistory()`、Jobs API artifact/event read | latest report、history index、session report、artifact candidates、job artifact API。 | 观察中 | partial-evidence | 需要全节点 comparable PCV scorecard，而不是只记录最终 report。 |

## 阶段顺序

1. Wave 4A Stage 0：总控自执行 cold-start N0-N14 source baseline / readiness。状态：已形成。
2. Wave 4B：派 `Alembic`，补 N8 / N11 / N12 node-local harness 或 report 字段，让 cold-start 能在不跑 full delivery 的情况下产出节点级 scorecard。状态：总控代码侧验收通过。
3. Wave 4D：派 `AlembicTest` 做真实 cold-start / rescan 最小 runtime confirmation；旧结果已归口为 `runtime-gap`，原因是当时 dist / mock path 不足。
4. Wave 4E：AI-MOCK 完成后，用当前 `Alembic` dist 和真实 / 默认 AI 配置重跑最小 scorecard smoke。状态：总控验收通过。
5. Wave 4F：选择第一个 before / after 优化点与比较指标，并派 `Alembic` 补 N11 sourceRef validity scorecard。状态：总控代码侧验收通过。
6. Wave 4G：按同一 test-mode fixture 重跑最小 scorecard，确认 runtime report 能表达 N11 invalid refs，且 accepted candidate evidence 不被静默丢失。状态：总控验收通过，数量 baseline 漂移进入 Wave 4H。
7. Wave 4H：派 `Alembic` 补 deterministic sourceRef replay / fixture harness，让 `9/33` baseline 可复验，避免真实 AI 输出漂移影响 before / after 比较。状态：总控验收通过。
8. Wave 4I：派 `AlembicAgent` 优化 N11 producer sourceRef grounding policy，让 producer 更少产出不存在、错扩展名或缺路径前缀的 sourceRefs。状态：总控验收通过。
9. Wave 4J：派 `AlembicTest` 做真实 / 默认 AI after-run，比较 Wave 4I 后 N11 sourceRef validity 表现。状态：总控验收通过。

- 下一处真实阻塞点：当前 Wave 4A 无阻塞；后续若继续 PCVM，应重新选择下一个节点或 rescan baseline。
- 阻塞点之前还能做：归档本计划、更新 TODO 状态和保留证据入口。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：无。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PCVM-W4A-TC-COLDSTART-BASELINE | `AlembicWorkspace` | 总控自执行，建立 Alembic cold-start N0-N14 源码事实 baseline / readiness。 | 已形成 |
| PCVM-W4B-ALEMBIC-NODE-LOCAL-HARNESS | `Alembic` | 补 N8 / N11 / N12 node-local harness / report 字段 / scorecard evidence。 | 总控验收通过 |
| PCVM-W4D-ALEMBICTEST-COLDSTART-SCORECARD-SMOKE | `AlembicTest` | 旧真实 cold-start / rescan 最小确认，已证明当时 dist / mock path 不足。 | runtime-gap 已关闭 |
| PCVM-W4E-ALEMBICTEST-REAL-AI-SCORECARD-RERUN | `AlembicTest` | 用当前 `Alembic` dist 和真实 / 默认 AI 配置重跑最小 scorecard smoke。 | 总控验收通过 |
| PCVM-W4F-TC-FIRST-OPTIMIZATION-POINT | `AlembicWorkspace` | 基于 N8 / N11 / N12 scorecard 和 Stage 0 baseline，选择第一个 before / after 优化点、比较指标和下一波派发窗口。 | 已裁决 |
| PCVM-W4F-ALEMBIC-N11-SOURCEREF-VALIDITY-SCORECARD | `Alembic` | 为 N11 producer sourceRefs 增加目标项目文件存在性 validity metrics、missing reasons 和 quality gate。 | 总控验收通过 |
| PCVM-W4G-ALEMBICTEST-N11-SOURCEREF-VALIDITY-RERUN | `AlembicTest` | 用 Wave 4E 同一 fixture 重跑，确认 runtime report / persisted report 表达 N11 invalid sourceRefs。 | 总控验收通过，数量漂移进入 Wave 4H |
| PCVM-W4H-ALEMBIC-DETERMINISTIC-SOURCEREF-REPLAY | `Alembic` | 补 deterministic sourceRef replay / fixture harness，让 N11 `9/33` baseline 可复验。 | 总控验收通过 |
| PCVM-W4I-AGENT-SOURCEREF-GROUNDING-POLICY | `AlembicAgent` | 优化 producer sourceRef grounding policy，减少 invented / wrong-extension / missing-prefix sourceRefs。 | 总控验收通过 |
| PCVM-W4J-ALEMBICTEST-SOURCEREF-GROUNDING-AFTER-RUN | `AlembicTest` | 用真实 / 默认 AI test-mode fixture 复核 Wave 4I 后 N11 sourceRef validity 表现。 | 总控验收通过 |

### PCVM-W4A-TC-COLDSTART-BASELINE：Cold-start source baseline

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 11:00 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-28 11:00 CST

阶段目标：

- 不实现代码，先用 PCV overlay 对照 Alembic cold-start 源码，列出 N0-N14 每个节点的现有证据、缺失证据和可测指标。

主线动作：

- 验证 PCV source checkout 和 HEAD。
- 读取 PCV canonical skill / overlay / metrics floor。
- 读取 Alembic cold-start workflow、daemon job runner、dimension pipeline、process events、projection / consumer / persistence / finalizer tests。
- 写出节点 baseline 和下一步派发判断。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不修改产品源码。
- 不跑 full cold-start。
- 不创建 `AlembicTest`。
- 不优化 Agent prompt。

下一处真实阻塞点：

- N8 / N11 / N12 的 node-local evidence cut 不足，缺少可直接比较的 scorecard 字段。

阻塞点之前还能做：

- 总控可以完成本文件、更新 TODO 挂载、同步当前状态，并运行 workspace 文档校验。

验证命令：

```text
git -C progressive-chain-validation rev-parse HEAD
git -C Alembic rev-parse HEAD
cd codex-control-workspace && node scripts/sync-current-plan.mjs --plan .workspace-active/workspace/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md --check
cd codex-control-workspace && node scripts/verify-control-center.mjs --require-todo --require-task-packages
cd codex-control-workspace && git diff --check
```

回填要求：

- 完成范围：
- 验证命令和结果：
- N0-N14 节点裁决：
- 下一步建议派发：
- 遗留风险：

执行前置硬规则：

- 本包由总控执行，不派子窗口；仍需按 `AGENTS.md` 停止卡先判断用户目标、证据、最小闭环和第一阻塞点。
- 当前窗口定位：AlembicWorkspace 总控；当前仓库定位：control workspace 活跃账本，不是产品实现仓库。

### PCVM-W4B-ALEMBIC-NODE-LOCAL-HARNESS：Alembic node-local baseline harness 草案

窗口：`Alembic`

状态：总控验收通过，不再发送。

阶段目标：

- 让 Alembic cold-start 在不跑 full delivery / Dashboard UI / 真实项目破坏性写入的前提下，产出 N8 / N11 / N12 的 node-local scorecard evidence。

主线动作：

- 读取 `Alembic/AGENTS.md`、本计划、PCV overlay 和 Alembic cold-start / dimension pipeline 源码。
- 只围绕 N8 / N11 / N12 补最小可验证 evidence surface：stage order、tool policy、producer tool restrictions、submitted / accepted / rejected counts、sourceRefs、rejected reasons、candidate persistence / findability。
- 若现有代码已可输出，优先写 targeted unit / probe 证明；若缺字段，再补最小 report / artifact / event 字段。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不改 Agent prompt。
- 不跑 full cold-start。
- 不做 Dashboard UI。
- 不修改 `AlembicAgent` / `AlembicPlugin` / `AlembicTest`。

下一处真实阻塞点：

- 没有 N8 / N11 / N12 node-local evidence，就无法进入 before / after 优化。

阻塞点之前还能做：

- `Alembic` 可以先做 targeted source/unit harness 和 report/event 字段，不需要真实项目、不需要 full cold-start。

验证命令：

```text
git diff --check
npm run typecheck
npm run test:unit -- <targeted Alembic PCV / bootstrap tests>
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- N8 / N11 / N12 evidence 字段或阻塞点：
- 是否仍需 `AlembicAgent`：
- 是否具备 `AlembicTest` 真实 cold-start 条件：
- 遗留风险：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划和 `Alembic/AGENTS.md`。
- 当前窗口定位必须声明为 `Alembic`，当前仓库职责是本地增强底座 / daemon / cold-start workflow；不得代替 `AlembicAgent`、`AlembicTest` 或总控做其它窗口职责。

总控验收：

- 回填：`Alembic` 完成 `BootstrapPcvNodeLocalEvidence`、`pcvScorecard`、per-dimension `pcvNodeEvidence`、N8 / N11 / N12 evidence surface，并提交 `070e46d94db4f579d46647a05c09fb7ca16db275`。
- 总控复核命令：`git diff --check HEAD^ HEAD`、`npm run lint`、`npm run typecheck`、`npm run test:unit -- BootstrapProcessEvents BootstrapSessionExecutionBuilder BootstrapProjection BootstrapDimensionConsumer InternalDimensionFillFinalizer`。
- 复核结果：全部通过。
- 裁决：代码侧验收通过；不进入 `AlembicAgent` prompt 优化，先进入真实 runtime scorecard confirmation。

### PCVM-W4D-ALEMBICTEST-COLDSTART-SCORECARD-SMOKE：Real cold-start scorecard confirmation

窗口：`AlembicTest`

状态：待验收（AlembicTest 已回填 runtime-gap，等待总控验收）。

阶段目标：

- 在真实测试环境中运行最小 cold-start / rescan 或等价 test-mode runtime，证明 `Alembic` 提交 `070e46d94db4f579d46647a05c09fb7ca16db275` 的 `pcvScorecard` / per-dimension `pcvNodeEvidence` 能被真实 report / artifact / log 读到。

主线动作：

- 读取本计划、`AlembicTest/AGENTS.md`、测试执行规则和 `test-exchange.md`。
- 使用受保护真实测试项目或 TestWindow 默认 fixture，运行最小 cold-start / rescan / test-mode 验证，不修改真实项目业务结构。
- 记录 report / artifact / runtime JSON / 日志路径，明确 N8 / N11 / N12 是否出现字段：stage order / tool policy、producer accepted / rejected / sourceRefs / no-terminal proof、consumer persistence / findability / failure details。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不优化 Agent prompt。
- 不做 Dashboard comparison UI。
- 不修改 `Alembic`、`AlembicAgent`、`AlembicPlugin` 或真实测试项目业务代码。
- 不把 broad cold-start 成功当成节点通过；必须点名 N8 / N11 / N12 evidence 字段。

下一处真实阻塞点：

- 若 runtime report / artifact 找不到 N8 / N11 / N12 evidence，回到 `Alembic` 修持久化 / report / artifact surface。

阻塞点之前还能做：

- `AlembicTest` 可以用真实环境最小验证回答 runtime 可见性问题；总控不再重复源码测试。

验证命令：

```text
以 AlembicTest 测试执行规则和当前 fixture 为准；至少提供命令、report/artifact/log 路径、runtime JSON 摘要。
```

回填要求：

- 完成范围：
- 提交 hash：无或说明测试资产 hash；TestWindow 自身临时资产不作为阻塞。
- 验证命令和结果：
- report / artifact / runtime JSON / 日志路径：
- N8 / N11 / N12 evidence 字段是否出现：
- 成功 / 失败分别能推出什么：
- 不能推出什么：
- 是否仍需 `Alembic` 返修：
- 是否仍需 `AlembicAgent`：
- 遗留风险：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划、`test-exchange.md`、`AlembicTest/AGENTS.md` 和测试执行规则。
- 当前窗口定位必须声明为 `AlembicTest`；本轮只做真实环境验证，不代替总控验收，不改产品源码，不扩大到 Dashboard UI 或 Agent prompt。

### PCVM-W4E-ALEMBICTEST-REAL-AI-SCORECARD-RERUN：Real AI scorecard rerun

窗口：`AlembicTest`

状态：总控验收通过。

阶段目标：

- 在 AI-MOCK 已完成、当前 `Alembic/dist` 已包含 PCV 字段的前提下，用真实 / 默认 AI 配置重跑最小 cold-start / rescan scorecard smoke。

主线动作：

- 读取本计划、`test-exchange.md`、`AlembicTest/AGENTS.md` 和测试执行规则。
- 使用 `AlembicTest` 的真实 / 默认 AI 配置规则：优先读取目标项目 Ghost / standard runtime AI 配置；没有可用配置时允许使用默认测试 AI 配置，但必须只回填 provider/model/key presence，不得写 secret。
- 使用当前 `Alembic` dist，而不是旧 Wave 4D 的 dist 结论；执行前用 focused scan 记录 `Alembic/dist` 是否包含 `pcvScorecard` / `pcvNodeEvidence` / `BootstrapPcvNodeLocalEvidence`。
- 运行最小 cold-start / rescan 或等价 test-mode runtime，确认 report / artifact / runtime JSON / log 是否出现 `pcvScorecard` 和 N8 / N11 / N12 per-dimension `pcvNodeEvidence`。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不优化 Agent prompt。
- 不做 Dashboard comparison UI。
- 不修改 `Alembic`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 或真实测试项目业务代码。
- 不把 broad bootstrap completed 当成 N8 / N11 / N12 节点通过。

下一处真实阻塞点：

- 如果当前真实 / 默认 AI runtime 仍无法产出 PCV 字段，需要区分是 report / artifact 持久化缺口、test-mode path 缺口、真实 AI provider 路径缺口，还是测试环境问题。

阻塞点之前还能做：

- `AlembicTest` 可以完成 current dist focused scan、真实 / 默认 AI 配置选择、最小 runtime smoke、日志 / API / artifact 证据和报告。

验证命令：

```text
按 AlembicTest 现有脚本或目标仓库入口执行；必须回填实际命令。
建议先复核 Alembic/dist 中的 PCV 字段，并复用 Wave 4D fixture smoke 的最小路径。
```

回填要求：

- 完成范围：
- 使用配置：只写来源、provider/model、key presence；不得写 secret。
- 目标项目 / fixture：
- Alembic 版本 / dist PCV focused scan：
- 触发入口和实际命令：
- report / artifact / runtime JSON / 日志路径：
- `pcvScorecard` 是否出现：
- N8 / N11 / N12 evidence 字段是否出现：
- 成功 / 失败分别能推出什么：
- 不能推出什么：
- 是否仍需 `Alembic` 返修：
- 是否仍需 `AlembicAgent`：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划、`test-exchange.md`、`AlembicTest/AGENTS.md` 和测试执行规则。
- 当前窗口定位必须声明为 `AlembicTest`；本轮只做真实环境验证，不代替总控验收，不改产品源码，不扩大到 Dashboard UI 或 Agent prompt。

总控验收：

- 回填：`AlembicTest` 使用 `BiliDili` Ghost workspace、真实默认 AI `deepseek / deepseek-v4-pro`、test-mode 单维度 `architecture`、4 文件小样本完成 bootstrap job `bootstrap_mppb1cos_3e517ce6`。
- 总控复核证据：`workspace-ledger/AlembicTest/pcvm-wave4e-real-ai-scorecard-rerun-2026-05-28.md`、`AlembicTest/tmp/pcvm-wave4e-real-ai-scorecard-summary.json`、`AlembicTest/tmp/pcvm-wave4e-real-ai-report-latest.json`、`AlembicTest/tmp/pcvm-wave4e-real-ai-job-final.json`、`AlembicTest/tmp/pcvm-wave4e-real-ai-events.json`；并复核 `Alembic` HEAD `c46e09d8f0ca689fe43d83488f860d9d0e3a400d`、`Alembic` clean、`BiliDili` clean。
- 复核结果：latest report API 与持久化 bootstrap report 均包含 `pcvScorecard`，`blockedNodes=0`、`dimensionCount=1`、`linkedNodes=3`；N8 / N11 / N12 均为 `linked`，N11 accepted count 为 6、rejected count 为 0，N12 findable count 为 6。
- 裁决：Wave 4E 通过。旧 Wave 4D runtime-gap 关闭为旧 dist / mock path 下的过期风险；当前 report scorecard surface 不需要 `Alembic` 返修。
- 边界：本结论不代表 full N0-N14、Dashboard comparison UI 或 full cold-start 稳定性已完成；events API / job JSON 不携带完整 final `pcvScorecard`，作为观察项而非本轮阻塞。

### PCVM-W4F-TC-FIRST-OPTIMIZATION-POINT：First optimization point selection

窗口：`AlembicWorkspace`

状态：已裁决。

阶段目标：

- 在不扩大到 prompt 优化 / Dashboard UI / full cold-start 的前提下，选择第一个可做 before / after 的真实优化点。

主线动作：

- 复核 Wave 4E latest report 的 N8 / N11 / N12 scorecard。
- 用 BiliDili 文件树校验 N11 sourceRefs 是否真实存在。
- 对照 PCV overlay 和 metrics contract 裁决 first optimization point。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不修改产品源码。
- 不启动 Agent prompt 优化。
- 不派 `AlembicTest` 重跑。

下一处真实阻塞点：

- N11 `linked` 状态没有表达 invalid sourceRefs，无法作为 before / after 质量门禁。

阻塞点之前还能做：

- 总控可完成现有 report / 文件树复核、写入当前计划并派发 `Alembic`。

验证命令：

```text
node scripts/sync-current-plan.mjs --check
node scripts/verify-control-center.mjs --require-todo --require-task-packages
```

回填要求：

- 已在本节记录总控裁决、基线证据、比较指标和下一步派发窗口。

总控裁决：

- 选择 N11 producer sourceRef validity 作为第一个 before / after 优化点。
- 不选择 N8：stage order / producer terminal policy 已满足当前 linked baseline，暂未出现 producer tool policy 破坏。
- 不选择 N12：accepted candidate findability 已为 6/6，当前问题更靠近 producer evidence 质量。
- 不选择 `AlembicAgent` prompt：当前真实缺口不是“产得不够多”，而是 `linked` scorecard 没有识别 invalid sourceRefs；先补可度量质量门禁，再谈 prompt 优化。

基线证据：

- `AlembicTest/tmp/pcvm-wave4e-real-ai-report-latest.json` 中 `architecture.n11.status=linked`、`acceptedCount=6`、`submittedCount=6`、`rejectedCount=0`。
- 总控用 BiliDili 文件树复核 N11 `sourceRefs`：`totalRefs=33`、`missingRefs=9`。
- 缺失引用示例：`BiliDili/RouterModule.swift`、`AGENTS.m`、`docs/LaunchFlow.m`、`RouterModule.swift`、多个不存在的 `Sources/**/Package.swift` 路径。

比较指标：

- `validSourceRefCount`
- `invalidSourceRefCount`
- `invalidSourceRefRatio`
- `sourceRefValidityStatus`
- `invalidSourceRefs`，需要保留数量上限，避免报告过长。
- `missingLinkReasons` 应包含可机器读取的 `producer_source_refs_invalid` 或等价 reason。

### PCVM-W4F-ALEMBIC-N11-SOURCEREF-VALIDITY-SCORECARD：N11 sourceRef validity metrics

窗口：`Alembic`

状态：待启动，发送给 `Alembic`。

阶段目标：

- 让 N11 producer scorecard 能判断 accepted producer sourceRefs 是否指向目标项目真实文件；`linked` 不再掩盖 invalid / missing sourceRefs。

主线动作：

- 读取 `Alembic/AGENTS.md`、本计划、PCV overlay 和 `BootstrapPcvNodeLocalEvidence.ts` / process-event / consumer / finalizer tests。
- 在 `Alembic` 中为 N11 evidence 增加 sourceRef validity 字段和 missing reason。优先复用 cold-start snapshot / targetFileMap / projectRoot 可得信息；如果当前 builder 没有项目文件集合，先做最小 dependency threading，不做全局重构。
- 保留原始 sourceRefs，同时输出 valid / invalid 计数与 invalid 列表摘要；不得静默删除 invalid refs。
- 当 `needsCandidates=true` 且 accepted producer sourceRefs 存在 invalid refs 时，N11 不能继续单纯 `linked`；至少要进入 `blocked-by-observability-gap` 或明确的 partial / invalid quality status，并能被 report scorecard 汇总。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不优化 Agent prompt。
- 不跑 full cold-start。
- 不做 Dashboard comparison UI。
- 不修改 `AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`AlembicTest` 或真实测试项目。
- 不把 invalid refs 静默过滤成“看起来更好”的结果。

下一处真实阻塞点：

- `buildPcvN11ProduceEvidence()` 当前只收集 `collectSourceRefsFromProjection(projection)`，未校验目标项目文件存在性；需要把目标文件集合或 resolver 传入 N11 evidence builder。

阻塞点之前还能做：

- `Alembic` 可以用 targeted unit 构造 projection + target file set，证明 valid / invalid refs、missing reasons 和 final `pcvScorecard` 汇总变化，不需要真实项目运行。

验证命令：

```text
git diff --check
npm run lint
npm run typecheck
npm run test:unit -- BootstrapProcessEvents BootstrapProjection BootstrapDimensionConsumer InternalDimensionFillFinalizer
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- N11 新增字段 / missing reasons：
- baseline 9/33 invalid refs 如何被 scorecard 表达：
- 是否需要 `AlembicTest` 重跑同一 fixture：
- 遗留风险：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划和 `Alembic/AGENTS.md`。
- 当前窗口定位必须声明为 `Alembic`，当前仓库职责是本地增强底座 / daemon / cold-start workflow；不得代替 `AlembicAgent`、`AlembicTest` 或总控做其它窗口职责。

总控验收：

- 回填：`Alembic` 完成 N11 producer sourceRef validity scorecard，提交 `125be96a0086577bc731953eca7d7b3165593bc1`（`fix: score n11 source ref validity`）。
- 总控复核命令：`git diff --check HEAD^ HEAD`、`npm run lint`、`npm run typecheck`、`npm run test:unit -- BootstrapProcessEvents BootstrapProjection BootstrapDimensionConsumer InternalDimensionFillFinalizer`。
- 复核结果：全部通过；targeted unit 4 files / 25 tests passed；`Alembic` 工作区 clean。
- 新增字段 / reason：`totalSourceRefCount`、`validSourceRefCount`、`invalidSourceRefCount`、`invalidSourceRefRatio`、`sourceRefValidityStatus`、`sourceRefValidity`、`invalidSourceRefs`；`missingLinkReasons` 增加 `producer_source_refs_invalid`。
- 裁决：Wave 4F 代码侧验收通过。该结论证明 source / unit 层已能识别 invalid refs；仍需 Wave 4G 用同一真实 / 默认 AI fixture 复核 latest report / persisted report 是否实际表达 baseline 9/33 invalid refs。

### PCVM-W4G-ALEMBICTEST-N11-SOURCEREF-VALIDITY-RERUN：Runtime validity rerun

窗口：`AlembicTest`

状态：已回填，待总控验收。

阶段目标：

- 用 Wave 4E 同一 BiliDili Ghost / 真实默认 AI / test-mode 单维度 `architecture` fixture，确认 `Alembic` commit `125be96a0086577bc731953eca7d7b3165593bc1` 的 N11 sourceRef validity 在 runtime report 中真实出现。

主线动作：

- 读取本计划、`test-exchange.md`、`AlembicTest/AGENTS.md` 和测试执行规则。
- 使用当前 `Alembic` dist / runtime，复用 Wave 4E 的最小参数：test-mode、单维度 `architecture`、4 文件小样本、真实 / 默认 AI 配置；不要跑 full cold-start。
- 读取 latest report API 与持久化 bootstrap report，检查 `pcvScorecard.nodes.n11.sourceRefValidity` 或等价字段，以及 per-dimension N11 evidence。
- 记录 `totalSourceRefCount`、`validSourceRefCount`、`invalidSourceRefCount`、`invalidSourceRefRatio`、`sourceRefValidityStatus`、`invalidSourceRefs` 摘要和 `producer_source_refs_invalid` reason。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不优化 Agent prompt。
- 不跑 full cold-start。
- 不做 Dashboard comparison UI。
- 不修改 `Alembic`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard` 或真实测试项目业务代码。
- 不把 invalid refs 静默过滤成“变好”的结果；必须保留原始 sourceRefs 和 invalid 摘要。

下一处真实阻塞点：

- 如果 runtime report 没有 N11 validity 字段，回 `Alembic` 修 dist / report / persistence surface。
- 如果 runtime report 表达 invalid refs，下一步总控再判断是否进入 `AlembicAgent` produce / analyze prompt 或 runtime policy 优化。

阻塞点之前还能做：

- `AlembicTest` 可以直接使用同一 fixture 做 runtime rerun；总控已完成代码侧验证，不需要重新派 `Alembic`。

验证命令：

```text
以 AlembicTest 测试执行规则和 Wave 4E fixture 为准；至少提供命令、report/artifact/log 路径、runtime JSON 摘要。
```

回填要求：

- 完成范围：
- 使用配置：只写来源、provider/model、key presence；不得写 secret。
- 目标项目 / fixture：
- Alembic commit / dist PCV focused scan：
- 触发入口和实际命令：
- latest report / persisted report / runtime JSON / 日志路径：
- N11 sourceRef validity 字段是否出现：
- baseline 9/33 invalid refs 是否被表达：
- N11 status / missingLinkReasons 是否不再被单纯 `linked` 掩盖：
- 成功 / 失败分别能推出什么：
- 不能推出什么：
- 是否仍需 `Alembic` 返修：
- 是否仍需 `AlembicAgent`：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划、`test-exchange.md`、`AlembicTest/AGENTS.md` 和测试执行规则。
- 当前窗口定位必须声明为 `AlembicTest`；本轮只做真实 / 默认 AI test-mode runtime 复核，不代替总控验收，不改产品源码，不扩大到 Dashboard UI 或 Agent prompt。

AlembicTest 回填：

- 回填时间：2026-05-28 20:40 CST。
- 详细报告：`workspace-ledger/AlembicTest/pcvm-wave4g-n11-sourceref-validity-rerun-2026-05-28.md`。
- 测试结论：部分通过，待总控验收。runtime latest report 与 persisted reports 均出现 N11 `sourceRefValidity`，N11 `status=blocked-by-observability-gap`，`missingLinkReasons=["producer_source_refs_invalid"]`；但本轮真实 AI output 为 `1/20` invalid refs，未复现预期 `9/33` 固定数量。
- job/session：`bootstrap_mppgszwo_136e6e35` / `bs_1779971049952_uiawqz`。
- 配置：BiliDili Ghost workspace，真实默认 AI `deepseek / deepseek-v4-pro`，key presence `deepseek=true`，test-mode 单维度 `architecture`，4 文件小样本，`skipGuard=true`。
- Alembic 证据：HEAD `125be96a0086577bc731953eca7d7b3165593bc1`；本轮运行前执行 `npm run build:self` 刷新 ignored `dist/`，dist scan 命中 W4F sourceRef validity 字段；`Alembic` clean。
- 关键 JSON：`AlembicTest/tmp/pcvm-wave4g-n11-sourceref-validity-summary.json`、`AlembicTest/tmp/pcvm-wave4g-n11-latest-report.json`、`AlembicTest/tmp/pcvm-wave4g-n11-persisted-bootstrap-report.json`、`AlembicTest/tmp/pcvm-wave4g-n11-persisted-session-report.json`、`AlembicTest/tmp/pcvm-wave4g-n11-events.json`。
- 真实项目状态：`BiliDili` clean；未修改业务源码。
- 建议：按“runtime surface 通过、固定数量 baseline 未匹配”验收；如需要可比较的 before / after 数量，先补 deterministic fixture / replay harness，再决定是否派 `AlembicAgent` 做 prompt/runtime policy 优化。

总控验收：

- 验收时间：2026-05-28 21:06 CST。
- 复核原始证据：`AlembicTest/tmp/pcvm-wave4g-n11-sourceref-validity-summary.json`、latest report、persisted bootstrap report、persisted session report 均存在并可解析。
- 复核结论：runtime surface 验收通过。N11 `sourceRefValidity` 已进入 latest / persisted reports，N11 `status=blocked-by-observability-gap`，`missingLinkReasons=["producer_source_refs_invalid"]`，final scorecard 汇总能表达 blocked node 和 invalid counts。
- 数量裁决：固定 `9/33` 未复现，当前真实 AI output 为 `1/20`；这不是 `Alembic` report / persistence 失败，而是真实 AI producer output 漂移，不能作为稳定 before / after 数量 baseline。
- 下一步：接受本任务，把数量稳定性拆入 `PCVM-W4H-ALEMBIC-DETERMINISTIC-SOURCEREF-REPLAY`。

### PCVM-W4H-ALEMBIC-DETERMINISTIC-SOURCEREF-REPLAY：Deterministic N11 baseline replay

窗口：`Alembic`

状态：待启动，发送给 `Alembic`。

阶段目标：

- 给 N11 sourceRef validity 增加 deterministic fixture / replay harness，让 Wave 4E 的 `9/33` baseline 或等价固定 producer output 可以被重复复验，不再依赖真实 AI 每次生成相同 sourceRefs。

主线动作：

- 读取本计划、`Alembic/AGENTS.md`、Wave 4E / 4G reports 和 N11 scorecard 相关源码。
- 优先使用 persisted report / producer output fixture / targeted unit 或 probe，复用现有 N11 validity builder；不要新增独立的第二套 scorecard 逻辑。
- 让 harness 能固定输入 sourceRefs，输出 `totalSourceRefCount`、`validSourceRefCount`、`invalidSourceRefCount`、`invalidSourceRefRatio`、`sourceRefValidityStatus`、`invalidSourceRefs` 和 `producer_source_refs_invalid`。
- 如果无法稳定复现 `9/33`，必须说明原因，并给出替代 deterministic baseline（例如固定 fixture 的 `1/20` 或专门构造的 sourceRefs 集合）和后续比较方式。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不优化 Agent prompt。
- 不跑 full cold-start。
- 不做 Dashboard comparison UI。
- 不修改 `AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`AlembicTest` 或真实测试项目业务代码。
- 不把 invalid refs 静默过滤成“变好”的结果。

下一处真实阻塞点：

- 没有 deterministic replay，就无法把 N11 invalid ref 数量作为 before / after 优化指标。

阻塞点之前还能做：

- `Alembic` 可以用 unit / fixture / replay harness 完成稳定 baseline，不需要真实 AI runtime 和 `AlembicTest`。

验证命令：

```text
git diff --check
npm run lint
npm run typecheck
npm run test:unit -- <targeted N11 sourceRef validity / PCV replay tests>
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- deterministic fixture / replay 输入来源：
- baseline counts（9/33 或替代固定 baseline）：
- 与 Wave 4G `1/20` 漂移的边界说明：
- 是否仍需 `AlembicAgent`：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划和 `Alembic/AGENTS.md`。
- 当前窗口定位必须声明为 `Alembic`；本轮只做 deterministic replay / fixture harness，不代替总控裁决，不扩大到 Agent prompt、Dashboard UI 或 full cold-start。

总控验收：

- `Alembic` 提交：`df4c89c27f113330216ce3493f725c9fe771b586`（`test: add deterministic n11 source ref replay`）。
- 变更范围：`BootstrapPcvNodeLocalEvidence.ts` 新增 `buildPcvN11SourceRefReplayEvidence()`；`test/fixtures/pcv-n11-source-ref-replay.ts` 固定 Wave 4E 33 条 sourceRefs；`test/unit/PcvN11SourceRefReplay.test.ts` 验证 `9/33` baseline 和重复 replay determinism。
- 总控复核命令：`git -C ../Alembic diff --check df4c89c^ df4c89c`、`npm run lint`、`npm run typecheck`、`npm run test:unit -- PcvN11SourceRefReplay`，均通过。
- 验收结论：Wave 4H 通过。现在已具备固定 before baseline；下一步可以进入 producer sourceRef grounding 优化，不再因为真实 AI output 数量漂移而停在验证层。

### PCVM-W4I-AGENT-SOURCEREF-GROUNDING-POLICY：Producer sourceRef grounding policy

窗口：`AlembicAgent`

状态：总控验收通过，不再发送。

阶段目标：

- 围绕 N11 producer sourceRefs，优化 `AlembicAgent` 的 producer prompt / runtime policy / `knowledge.submit` guidance，让候选提交优先使用分析阶段已经验证或明确列出的真实相对路径，减少 invented path、错扩展名、缺路径前缀和模块别名。

主线动作：

- 读取本计划、`AlembicAgent/AGENTS.md`、Wave 4H fixed `9/33` baseline、`src/agent/prompts/insight-producer.ts`、`src/tools/v2/handlers/knowledge.ts`、`src/agent/runtime/PcvNodeEvidence.ts` 和相关 tests。
- 先确认 sourceRef ownership：哪些内容由 prompt 约束，哪些由 tool handler normalize，哪些必须留给 `Alembic` scorecard 检测。
- 在现有 producer / knowledge submit 链路内做最小真实优化：优先加强提示词和 submit guidance；只有已有上下文能提供真实 file list / referencedFiles 时，才做轻量校验或规范化。
- 保留原始 sourceRefs，不得静默丢弃 invalid refs；如果新增 normalization / warning，也必须保留可复核证据。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不修改 `Alembic` / `AlembicTest` / `BiliDili` / Dashboard UI。
- 不跑 full cold-start。
- 不把 sourceRef validity scorecard 从 `Alembic` 迁走。
- 不创建静态 mock、空 provider、无调用方 adapter 或只写文档的假优化。

下一处真实阻塞点：

- 还没有 after-change 的真实 AI runtime evidence；本轮先完成 `AlembicAgent` 代码侧 grounding 优化和 targeted tests。

阻塞点之前还能做：

- `AlembicAgent` 可以用 existing prompt / handler tests 证明 sourceRef grounding guidance 进入 producer chain；如果代码事实显示该能力不在 `AlembicAgent`，必须回填归属判断，不得跨仓库改 `Alembic`。

验证命令：

```text
git diff --check
npm run typecheck
npm test -- <targeted producer / knowledge submit / sourceRef grounding tests>
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- sourceRef ownership 判断：
- grounding policy / prompt / handler 改动：
- 与 Wave 4H `9/33` deterministic baseline 的关系：
- 是否需要 `Alembic` 或 `AlembicTest` 后续 after-run：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划和 `AlembicAgent/AGENTS.md`。
- 当前窗口定位必须声明为 `AlembicAgent`；本轮只处理 Agent runtime / prompt / tool policy 边界，不代替总控裁决，不跨仓库改 `Alembic`。

总控验收：

- `AlembicAgent` 提交：`4acc068284cab54bf71d33aaa4a26e102e85356a`（`Improve sourceRef grounding policy`）。
- 变更范围：`src/agent/prompts/insight-producer.ts` 增加 producer sourceRef grounding policy；`src/tools/v2/handlers/knowledge.ts` 对 `reasoning.sources` / `sourceRefs` 做可证明路径 grounding，并将 normalization / warning 写入 `agentNotes.sourceRefGrounding`；新增 / 更新 targeted tests。
- 总控复核命令：`git -C ../AlembicAgent diff --check 4acc068^ 4acc068`、`npm run typecheck`、`npm test -- tool-v2-contract llm-input-layering`、`npm run check`，均通过。
- 验收结论：Wave 4I 通过。该结论证明 producer / submit 侧已有 sourceRef grounding 机制；仍需 Wave 4J 用真实 / 默认 AI runtime 复核 after-change N11 sourceRef validity。

### PCVM-W4J-ALEMBICTEST-SOURCEREF-GROUNDING-AFTER-RUN：Real AI sourceRef grounding after-run

窗口：`AlembicTest`

状态：总控验收通过；发送给无。

阶段目标：

- 用真实 / 默认 AI test-mode fixture 复核 Wave 4I `AlembicAgent` sourceRef grounding 改动后的 N11 sourceRef validity 表现，并和 Wave 4H deterministic `9/33` baseline、Wave 4G runtime `1/20` 漂移做边界清楚的对比。

主线动作：

- 读取本计划、`test-exchange.md`、`AlembicTest/AGENTS.md` 和测试执行规则。
- 复用 Wave 4E / 4G 的最小真实 / 默认 AI fixture：BiliDili Ghost workspace、test-mode 单维度 `architecture`、4 文件小样本、真实 / 默认 AI 配置；不要跑 full cold-start。
- 运行前记录 `AlembicAgent` HEAD 是否包含 `4acc068284cab54bf71d33aaa4a26e102e85356a`，并确认 `Alembic` runtime 可消费当前 Agent 包 / workspace link。
- 读取 latest report API 与持久化 report，记录 N11 `sourceRefValidity`、`totalSourceRefCount`、`validSourceRefCount`、`invalidSourceRefCount`、`invalidSourceRefRatio`、`sourceRefValidityStatus`、`invalidSourceRefs` 摘要和 `missingLinkReasons`。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不修改 `Alembic`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 或真实测试项目业务代码。
- 不跑 full cold-start。
- 不做 Dashboard comparison UI。
- 不把真实 AI output 漂移误判为 report / persistence 失败；必须区分 runtime surface、producer output 和 deterministic baseline。

下一处真实阻塞点：

- 如果 after-run 仍无法读取 N11 validity 字段，回 `Alembic` 查 runtime report / dist / package linkage。
- 如果字段可读但 invalid ratio 未改善，回总控判断是 Agent prompt / context 输入不足、真实 AI 漂移，还是需要新的 deterministic after fixture。

阻塞点之前还能做：

- `AlembicTest` 可以完成最小 after-run、报告路径、summary JSON、项目 clean 状态和成功 / 失败边界说明。

验证命令：

```text
以 AlembicTest 测试执行规则和 Wave 4E / 4G fixture 为准；必须回填实际命令、report/artifact/log 路径和 runtime JSON 摘要。
```

回填要求：

- 完成范围：
- 使用配置：只写来源、provider/model、key presence；不得写 secret。
- 目标项目 / fixture：
- Alembic / AlembicAgent commit 与 runtime linkage：
- 触发入口和实际命令：
- latest report / persisted report / runtime JSON / 日志路径：
- N11 sourceRef validity 字段是否出现：
- after-run invalid sourceRef counts：
- 与 Wave 4H `9/33` deterministic baseline、Wave 4G `1/20` runtime 漂移的边界说明：
- 成功 / 失败分别能推出什么：
- 不能推出什么：
- 是否仍需 `Alembic` / `AlembicAgent` 返修：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划、`test-exchange.md`、`AlembicTest/AGENTS.md` 和测试执行规则。
- 当前窗口定位必须声明为 `AlembicTest`；本轮只做真实 / 默认 AI test-mode runtime 复核，不代替总控验收，不改产品源码，不扩大到 Dashboard UI 或 full cold-start。

总控验收：

- `AlembicTest` 回填报告：[../../../../workspace-ledger/AlembicTest/pcvm-wave4j-sourceref-grounding-after-run-2026-05-28.md](../../../../AlembicTest/pcvm-wave4j-sourceref-grounding-after-run-2026-05-28.md)。
- 原始证据：`../AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-summary.json`、`...-latest-report.json`、`...-session-report-api.json`、`...-persisted-bootstrap-report.json`、`...-persisted-session-report.json`。
- 总控复核：latest report、session report API、persisted bootstrap report、persisted session report 中 N11 均为 `status=linked`、`missingLinkReasons=[]`、`sourceRefValidityStatus=valid`、`11 total / 11 valid / 0 invalid / ratio 0`。
- 总控复核 BiliDili sourceRefs：11 条 sourceRef 均可在 `BiliDili` 中解析；`BiliDili` 工作区 clean；`Alembic` / `AlembicAgent` 仅有本轮前已存在的 `AGENTS.md` dirty，本轮未改产品源码。
- 验收结论：Wave 4J 通过。Wave 4A 的 N11 sourceRef optimization loop 已闭合：before deterministic baseline `9/33` invalid，Wave 4G runtime drift `1/20` 可解释，Wave 4J after-run 为 `0/11` invalid。真实 AI output 仍具非确定性，不能据此推出全 N0-N14、full cold-start 或 Dashboard comparison UI 完成。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-003 | Wave 4A 冷启动 sourceRef 优化闭环已验收 / 待归档 | agent / llm optimization loop | P0 | PCV source / `Alembic` / `AlembicAgent` / `AlembicTest` | 先把 cold-start / rescan 拆成可停止、可复验的节点链，再做优化。 | 否 | Wave 4J 已通过总控验收：after-run N11 `0/11` invalid；后续若继续 PCVM，应另行裁决下一个节点 / rescan baseline。 | 总控裁决 |
| PCVM-OBS-2026-05-28-EVENT-JOB-SCORECARD-SUMMARY | 观察中 | observability follow-up | P2 | `Alembic` | events API / job JSON 当前不携带完整 final `pcvScorecard`；若后续 Dashboard / automation 需要无需 report API 的 scorecard summary，再增强。 | 否 | Wave 4E report / persisted report 已通过；该项不阻塞 before / after 优化点选择。 | `Alembic` |
| PCVM-OBS-2026-05-28-PROBE-TIMEOUT | 观察中 | test harness follow-up | P2 | `AlembicTest` | real AI scorecard smoke 中 480s probe 先返回 producer-gap，但 job 693s completed；后续同类真实 AI smoke 建议 timeout 提高到 12 分钟。 | 否 | 当前 Wave 4E 已通过；后续测试脚本参数优化时处理。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | Wave 4H deterministic sourceRef replay 已通过总控验收。 |
| `AlembicCore` | 无任务 | 否 | 暂未发现需要下沉 Core contract 的字段；若 Alembic report schema 需要共享再评估。 |
| `AlembicAgent` | 已完成 | 否 | Wave 4I producer sourceRef grounding policy 已通过总控验收。 |
| `AlembicDashboard` | 无任务 | 否 | Dashboard comparison UI 明确不在第一版范围。 |
| `AlembicPlugin` | 无任务 | 否 | PCV source / Workspace bridge 已接入；本轮不涉及 Plugin。 |
| `AlembicDesign` | 无任务 | 否 | 需求方向已明确。 |
| `AlembicTest` | 已完成 | 否 | `PCVM-W4J-ALEMBICTEST-SOURCEREF-GROUNDING-AFTER-RUN` 已通过总控验收。 |
| `BiliDili` | 无任务 | 否 | 不触碰真实项目。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | Wave 4H deterministic replay 已通过总控验收。 |
| `AlembicCore`<br>无任务 | 暂无共享 contract 下沉需求。 |
| `AlembicAgent`<br>已完成 | Wave 4I producer sourceRef grounding policy 已通过总控验收。 |
| `AlembicDashboard`<br>无任务 | 不做 comparison UI。 |
| `AlembicPlugin`<br>无任务 | 不涉及 Plugin。 |
| `AlembicDesign`<br>无任务 | 不需要需求设计。 |
| `AlembicTest`<br>已完成 | `PCVM-W4J-ALEMBICTEST-SOURCEREF-GROUNDING-AFTER-RUN`：真实 / 默认 AI after-run 已通过总控验收。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：无（历史提示词保留供验收追溯，不再发送）。

```text
先读取 AGENTS.md、codex-control-workspace/.workspace-active/workspace/index.md、codex-control-workspace/.workspace-active/workspace/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位：你是 AlembicTest 窗口；当前仓库职责是真实 / 默认 AI test-mode runtime 验证，不代替总控验收，不改产品源码。

领取任务包 `PCVM-W4J-ALEMBICTEST-SOURCEREF-GROUNDING-AFTER-RUN`：复用 Wave 4E / 4G 的最小真实 / 默认 AI fixture，验证 Wave 4I `AlembicAgent` sourceRef grounding 改动后，N11 `sourceRefValidity` 在 latest report / persisted report 中的 after-run 表现。

边界：不修改 Alembic / AlembicAgent / BiliDili / Dashboard UI，不跑 full cold-start，不把真实 AI output 漂移误判为 report / persistence 失败。

验证建议：按 AlembicTest 测试执行规则和 Wave 4E / 4G fixture 执行；必须输出实际命令、latest report / persisted report / summary JSON / 日志路径。

完成后回填：完成范围、使用配置、目标项目 / fixture、Alembic / AlembicAgent commit 与 runtime linkage、触发入口和实际命令、latest report / persisted report / runtime JSON / 日志路径、N11 sourceRef validity 字段是否出现、after-run invalid sourceRef counts、与 Wave 4H `9/33` / Wave 4G `1/20` 的边界说明、成功 / 失败分别能推出什么、不能推出什么、是否仍需 Alembic / AlembicAgent 返修、遗留风险和下一步建议。
```

## 测试交接

- 是否需要 `AlembicTest`：本轮已完成。Wave 4J 真实 / 默认 AI runtime after-run 已通过总控验收，当前没有新的测试交接。
- 总控自测结论：总控已复核 W4I commit / diff / targeted unit / full check；代码侧 grounding 通过。
- 需要真实场景的理由：after-change 指标必须从真实 / 默认 AI runtime report 中读取，才能判断 producer output 是否改善；总控无法用源码测试替代真实 AI 输出。
- 测试前边界与多条件判断：本轮唯一问题是“Wave 4I 后，真实 / 默认 AI runtime report 中 N11 invalid sourceRef ratio 是否改善或出现可解释变化”。成功只能证明 after-run surface 可读并给出当前 output 指标；失败需区分 report / persistence 失败、Agent linkage 失败、AI output 漂移或环境问题；不能推出 full cold-start 完成、Dashboard comparison UI 完成或所有 N0-N14 节点可度量。
- 最近测试单：`PCVM-W4J-ALEMBICTEST-SOURCEREF-GROUNDING-AFTER-RUN`，总控验收通过，见 [test-exchange.md](../../../../../codex-control-workspace/.workspace-active/workspace/current/test-exchange.md)。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.workspace-active/workspace/current/test-exchange.md)
- 真实项目保护说明：本轮不触碰真实项目。

## 回填区

- 2026-05-28 11:00 CST：总控切入 PCVM Wave 4A Stage 0。PCV source HEAD 已核对为 `3322646aa57c67c164eec20626ec5edd9d05b113`；Alembic source HEAD 已核对为 `6eea782f85e94101043c535f11fa4a9c1a05187c`。当前裁决：N9 只有 minimal linked baseline；N8 / N11 / N12 是下一处真实阻塞点；不跑 full cold-start，不派 `AlembicTest`。
- 2026-05-28 11:15 CST：Stage 0 baseline 已形成，workspace 校验通过。总控裁决下一步只派 `Alembic` 执行 `PCVM-W4B-ALEMBIC-NODE-LOCAL-HARNESS`，不派 `AlembicAgent` / `AlembicTest`，不进入 full cold-start。
- 2026-05-28 12:55 CST：总控验收 `Alembic` Wave 4B 通过。提交 `070e46d94db4f579d46647a05c09fb7ca16db275` 已补 N8 / N11 / N12 node-local evidence surface；总控复跑 `git diff --check HEAD^ HEAD`、`npm run lint`、`npm run typecheck`、targeted unit tests 均通过。当前进入 Wave 4D，只派 `AlembicTest` 做真实 runtime scorecard confirmation。
- 2026-05-28 13:14 CST：`AlembicTest` 完成 `PCVM-W4D-ALEMBICTEST-COLDSTART-SCORECARD-SMOKE` 回填，结论为 `runtime-gap`。受保护 fixture daemon/API bootstrap job `bootstrap_mpp1cta7_8ae512d8` 完成，timeline probe `ok=true` / `classification=producer-gap`；但 runtime job report、daemon log 和 dataRoot artifact 中均无 `pcvScorecard` / `pcvNodeEvidence` / N8 / N11 / N12 字段。源码 `Alembic/lib/**` 有 Wave 4B PCV 字段，当前运行的 `Alembic/dist/**` 无对应 runtime artifact；建议回 `Alembic` 修 dist/runtime artifact 或 test-mode path 后重跑。详细报告：[../../../../workspace-ledger/AlembicTest/pcvm-wave4d-coldstart-scorecard-smoke-2026-05-28.md](../../../../AlembicTest/pcvm-wave4d-coldstart-scorecard-smoke-2026-05-28.md)。
- 2026-05-28 17:30 CST：总控归口 Wave 4D runtime-gap 后重新判断：AI-MOCK 已通过真实 / 默认 AI smoke，当前 `Alembic` HEAD 为 `c46e09d8f0ca689fe43d83488f860d9d0e3a400d`，`Alembic/dist/lib/workflows/capabilities/execution/internal-agent/` 已能检索到 `BootstrapPcvNodeLocalEvidence`、`pcvScorecard` 和 `pcvNodeEvidence`。下一步不返修 `Alembic`，先派 `AlembicTest` 执行 `PCVM-W4E-ALEMBICTEST-REAL-AI-SCORECARD-RERUN`。
- 2026-05-28 17:38 CST：VAD restart 创建并记录 `AlembicTest` heartbeat `visible-dispatch-alembictest`；group `progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28` 状态 `open`，任务状态 `armed`，等待目标窗口 claim / 回填。
- 2026-05-28 18:05 CST：`AlembicTest` 完成 `PCVM-W4E-ALEMBICTEST-REAL-AI-SCORECARD-RERUN` 回填，结论为通过、待总控验收。BiliDili Ghost workspace、真实默认 AI `deepseek / deepseek-v4-pro`、test-mode 单维度 `architecture`、4 文件小样本下 job `bootstrap_mppb1cos_3e517ce6` completed；latest report / persisted bootstrap report 中 `pcvScorecard` 出现，N8 / N11 / N12 均 `linked`，`blockedNodes=0`。详细报告：[../../../../workspace-ledger/AlembicTest/pcvm-wave4e-real-ai-scorecard-rerun-2026-05-28.md](../../../../AlembicTest/pcvm-wave4e-real-ai-scorecard-rerun-2026-05-28.md)。
- 2026-05-28 18:35 CST：总控验收 `PCVM-W4E-ALEMBICTEST-REAL-AI-SCORECARD-RERUN` 通过，并运行 VAD `accept --task ... --verdict accepted --write`。复核原始证据显示 latest report API 与持久化 report 均有 `pcvScorecard`，N8 / N11 / N12 均 `linked`；`Alembic` HEAD `c46e09d8f0ca689fe43d83488f860d9d0e3a400d` clean，`BiliDili` clean。旧 Wave 4D runtime-gap 关闭；events API / job JSON 不携带完整 final scorecard 作为观察项。下一步进入 Wave 4F：选择 first optimization point 与 before / after 指标。
- 2026-05-28 19:05 CST：总控完成 Wave 4F first optimization point 裁决。复核 `AlembicTest/tmp/pcvm-wave4e-real-ai-report-latest.json` 中 `architecture.n11.sourceRefs` 并对照 BiliDili 文件树：`totalRefs=33`、`missingRefs=9`，但 N11 仍为 `linked`。裁决第一优化点为 `N11 producer sourceRef validity`，派 `Alembic` 执行 `PCVM-W4F-ALEMBIC-N11-SOURCEREF-VALIDITY-SCORECARD`；不启动 `AlembicAgent` prompt 优化，不派 `AlembicTest`。
- 2026-05-28 19:52 CST：总控验收 `PCVM-W4F-ALEMBIC-N11-SOURCEREF-VALIDITY-SCORECARD` 通过，并运行 VAD `accept --task ... --verdict accepted --write`。`Alembic` commit `125be96a0086577bc731953eca7d7b3165593bc1` 已补 N11 sourceRef validity 字段、`producer_source_refs_invalid` reason 和 final `pcvScorecard` 汇总；总控复跑 `git diff --check HEAD^ HEAD`、`npm run lint`、`npm run typecheck`、targeted unit tests 全部通过，`Alembic` clean。下一步进入 Wave 4G：派 `AlembicTest` 用 Wave 4E 同一 fixture 重跑 runtime report。
- 2026-05-28 20:40 CST：`AlembicTest` 完成 `PCVM-W4G-ALEMBICTEST-N11-SOURCEREF-VALIDITY-RERUN` 回填，结论为部分通过、待总控验收。job `bootstrap_mppgszwo_136e6e35` / session `bs_1779971049952_uiawqz` completed；latest report 与 persisted report 中 N11 `sourceRefValidity` 出现，N11 `status=blocked-by-observability-gap`，`missingLinkReasons=["producer_source_refs_invalid"]`；但本轮真实 AI output 为 `1/20` invalid refs，未复现预期 `9/33`。详细报告：[../../../../workspace-ledger/AlembicTest/pcvm-wave4g-n11-sourceref-validity-rerun-2026-05-28.md](../../../../AlembicTest/pcvm-wave4g-n11-sourceref-validity-rerun-2026-05-28.md)。
- 2026-05-28 21:06 CST：总控验收 `PCVM-W4G-ALEMBICTEST-N11-SOURCEREF-VALIDITY-RERUN` 通过，并运行 VAD `accept --task ... --verdict accepted --write`。复核 `AlembicTest/tmp/pcvm-wave4g-n11-sourceref-validity-summary.json`、latest report、persisted bootstrap report 和 persisted session report：N11 validity runtime surface 可读，`blocked-by-observability-gap` / `producer_source_refs_invalid` 可进入 final scorecard；固定 `9/33` baseline 未复现，实际 `1/20`，裁决为真实 AI output 漂移，不是 report / persistence 失败。下一步进入 Wave 4H，只派 `Alembic` 补 deterministic sourceRef replay / fixture harness，不启动 `AlembicAgent` prompt 优化。
- 2026-05-28 21:48 CST：总控验收 `PCVM-W4H-ALEMBIC-DETERMINISTIC-SOURCEREF-REPLAY` 通过，并运行 VAD `accept --task ... --verdict accepted --write`。`Alembic` commit `df4c89c27f113330216ce3493f725c9fe771b586` 固定 Wave 4E 33 条 N11 sourceRefs，targeted replay 稳定复现 `9/33` invalid baseline；总控复跑 `git diff --check df4c89c^ df4c89c`、`npm run lint`、`npm run typecheck`、`npm run test:unit -- PcvN11SourceRefReplay` 均通过。下一步进入 Wave 4I，派 `AlembicAgent` 优化 producer sourceRef grounding policy。
- 2026-05-28 22:34 CST：总控验收 `PCVM-W4I-AGENT-SOURCEREF-GROUNDING-POLICY` 通过，并运行 VAD `accept --task ... --verdict accepted --write`。`AlembicAgent` commit `4acc068284cab54bf71d33aaa4a26e102e85356a` 增加 producer sourceRef grounding prompt section 与 `knowledge.submit` sourceRef grounding；总控复跑 `git diff --check 4acc068^ 4acc068`、`npm run typecheck`、`npm test -- tool-v2-contract llm-input-layering`、`npm run check` 均通过。下一步进入 Wave 4J，派 `AlembicTest` 做真实 / 默认 AI after-run。
- 2026-05-28 23:23 CST：`AlembicTest` 完成 `PCVM-W4J-ALEMBICTEST-SOURCEREF-GROUNDING-AFTER-RUN` 回填，结论为通过、待总控验收。BiliDili Ghost workspace、真实默认 AI `deepseek / deepseek-v4-pro`、test-mode 单维度 `architecture`、4 文件小样本下 job `bootstrap_mppmq6h8_4ce6fa05` / session `bs_1779980996266_699dsm` completed；latest report、session report API、persisted bootstrap report、persisted session report 均有 N11 `sourceRefValidity`，结果为 `11 total / 11 valid / 0 invalid / ratio 0`，N11 `status=linked`，`missingLinkReasons=[]`。事件计数：`llm.input=24`、`llm.output=24`、`llm.reflection=11`、`tool=1`、`summary=4`、`artifact=1`。BiliDili clean；`Alembic` / `AlembicAgent` 仅有本轮前已有 `AGENTS.md` dirty，本轮未改产品源码。详细报告：[../../../../workspace-ledger/AlembicTest/pcvm-wave4j-sourceref-grounding-after-run-2026-05-28.md](../../../../AlembicTest/pcvm-wave4j-sourceref-grounding-after-run-2026-05-28.md)。
- 2026-05-29 00:02 CST：总控验收 `PCVM-W4J-ALEMBICTEST-SOURCEREF-GROUNDING-AFTER-RUN` 通过，并运行 VAD `accept --task ... --verdict accepted --write`。总控复核 `summary.json`、latest report、session report API、persisted bootstrap report、persisted session report，确认 N11 `sourceRefValidityStatus=valid`、`11 total / 11 valid / 0 invalid / ratio 0`，11 条 sourceRef 均可解析到 `BiliDili` 文件 / 目录；`BiliDili` clean，产品仓库无本轮代码改动。Wave 4A cold-start sourceRef 优化闭环达到当前完成定义，下一步为归档或另行裁决下一个 PCVM 节点 / rescan baseline。

<!-- workspace-sync
{
  "status": "Wave 4J 总控验收通过，Wave 4A 待归档",
  "indexPlanDescription": "PCVM Wave 4J 总控验收通过；N11 sourceRef validity after-run 为 0/11 invalid，Wave 4A cold-start sourceRef 优化闭环待归档。",
  "indexStatusDescription": "当前状态切到 PCVM Wave 4A 待归档：Wave 4J 已通过总控验收，暂无发送窗口。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "PCVM Wave 4A 待归档：N11 before/after sourceRef validity loop 已验收。",
  "currentStatusSummary": "PCVM Wave 4J 已通过总控验收；N11 sourceRef validity after-run 为 0/11 invalid，Wave 4A 当前闭环待归档。",
  "indexRows": [
    {
      "type": "PCVM Wave 4A cold-start baseline",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md",
      "status": "Wave 4J 总控验收通过 / Wave 4A 待归档",
      "description": "PCV 产物进入 Workspace current；AlembicTest after-run 已通过总控验收，N11 0/11 invalid。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM Wave 4A cold-start baseline",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-4a-cold-start-baseline-2026-05-28.md",
      "description": "N0-N14 节点级源码事实、Alembic node-local evidence 验收和 AlembicTest runtime scorecard 派发。"
    }
  ]
}
-->
