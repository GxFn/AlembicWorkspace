# Cold-start Project Skill Delivery Wave 1

状态：已完成 / 已归档（`CSSD-P4B-TestMode-Test` 已通过总控验收；当前无发送窗口）
维护窗口：AlembicWorkspace
创建时间：2026-05-24 14:23 CST
对应 TODO：`GTODO-2026-05-23-026`
目标阶段确认：[cold-start-skill-delivery-goal-stage-confirmation-2026-05-24.md](cold-start-skill-delivery-goal-stage-confirmation-2026-05-24.md)
代码依赖调研：[../../requirement-designs/cold-start-skill-delivery/code-implementation-dependency-research-2026-05-24.md](../../../../requirement-designs/cold-start-skill-delivery/code-implementation-dependency-research-2026-05-24.md)

## 当前最终目标

让 Alembic / AlembicPlugin 双链路冷启动生成的 project skills，在用户项目级允许后，通过 `symlink-first` 项目级 runtime export 进入 Codex 当前项目 skill 发现机制，使 Codex 能直接看见、触发和使用这些 skill；同时用 `ProjectSkillDeliveryReceipt` 记录来源、证据、授权、export 状态和 Codex 呐喊摘要。

## 当前剩余差距

- `AlembicCore` 共享 receipt/export/marker contract 已通过总控验收：已补齐授权 / 覆盖安全依赖的 `projectScopeId + codexSkillRoot`、managed marker `generatedSkillId` / `generationHash` / `projectScopeId` 和 `runtimeExport.refreshRequired` 等字段。
- `Alembic` route producer 已通过总控验收：真实 `ProjectSkillDeliveryReceipt`、workflow report、dimension completion payload 和 job process event 可读面均已闭合。
- `AlembicPlugin` 已通过总控验收：新增 Plugin route receipt、项目级授权、`symlink-first` export、managed marker、conflict handling、`alembic_project_skill` 默认入口和 runtime artifact；总控复跑 build / targeted unit / check / build / runtime prepare / verify / smoke / diff checks 均通过。
- `CSSD-P4A-Plugin-Tool-Visibility` 已通过总控验收：`alembic_project_skill` 在 initialized / no usable knowledge / bootstrap-running 状态下可见，legacy `alembic_skill` 仍不提前暴露，runtime artifact 已同步。
- `alembic_skill` 已降级为 legacy Alembic storage compatibility；Codex runtime delivery 默认入口改为 `alembic_project_skill`。
- `AlembicTest` 旧测试尝试未能闭合验收：用户因全量 cold-start 耗时中断；`AlembicTest/docs/cold-start-llm-display-live-monitor-2026-05-24.md` 只证明取消链路与 `llm.input` 事件可读，未证明 project skill delivery。
- `AlembicTest/tmp/project-skill-delivery-probe-*.json` 的历史证据显示 MCP `tools/list` 只暴露 11 个 tool，缺少 `alembic_project_skill`；该 blocker 已由 `AlembicPlugin` 提交 `3e422ab9ed081783d3273b82d6c3beacd61ee2e7` 修复，等待 `AlembicTest` 在真实 BiliDili test mode 环境复测闭环。
- Alembic 已有测试模式能力：`ALEMBIC_TEST_MODE=1`、`ALEMBIC_TEST_BOOTSTRAP_DIMS` / `ALEMBIC_TEST_RESCAN_DIMS` 可过滤维度，bootstrap session 和 `/api/v1/modules/test-mode` 会暴露 testMode 状态。下一轮真实项目验收不再跑全量 cold-start 硬等，而使用测试模式 + 小样本参数证明 delivery 链路。
- `GTODO-2026-05-24-031` 不改变 project skill 主线完成定义；Dashboard UI follow-up 已通过总控验收并关闭。

完成结论：真实 BiliDili test-mode 环境已证明 project skill create / export / symlink / marker / conflict / no-global-write / Alembic route receipt 全闭环。

下一步：当前主线无剩余阻塞，等待归档或开启新主线。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GTODO-2026-05-23-026` | 已完成 | cold-start skill delivery | P1 | `AlembicTest` | 双链路 project skill receipt + Codex 项目级 runtime export。 | 是 | `Test-2026-05-24-05` 已通过总控验收；Core contract、Alembic route producer、Plugin consumer/exporter、Plugin tool visibility 和真实项目 test-mode runtime delivery 均闭合。 |
| `GTODO-2026-05-24-030` | 待排期 | multi-root project skill export | P3 | `Alembic` / `AlembicPlugin` / `AlembicCore` | 多文件夹 / 多 root project skill export 绑定。 | 否 | 用户确认不进第一版；等真正支持多项目 / 多 root 时再设计。 |
| `GTODO-2026-05-24-031` | 已完成 | observability UI refinement | P2 | `AlembicDashboard` | 优化冷启动 / 增量扫描 process Timeline 的开发者展示：外层去描边、终端式固定高度底部刷新、最近前端展示数据本地保存、LLM 内容默认收起可展开。 | 否 | Dashboard 初版提交 `dc5b446`，追加 UI 返工提交 `f4b6768`；复跑 `npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD` 均通过。 |

## 阶段任务包

### CSSD-P1-Core

- 窗口：`AlembicCore`
- 状态：已完成
- 派发时间（北京时间）：2026-05-24 14:23 CST
- 状态更新时间（北京时间）：2026-05-24 15:00 CST
- 阶段目标：建立 project skill delivery 的共享 contract，让 Alembic 与 Plugin 后续不猜字段。
- 主线动作：
  - 基于真实代码边界新增 `ProjectSkillDeliveryReceipt`、asset、runtime export receipt、managed marker、authorization / conflict status、evidence ref、shout summary contract。
  - 提供 normalizer / validator / builder helper，字段需要覆盖 Alembic route 与 Plugin route。
  - 增加 public export，优先从 `@alembic/core/host-agent-workflows` 或更合适的现有 public boundary 暴露，不创建无消费方空 provider。
  - 更新 Core briefing 中旧 `alembic_skill({ operation: "load" })` 口径，改成 receipt / runtime export 语义。
  - 补 contract tests、public API smoke 或 boundary 配置。
- 合并 TODO：`GTODO-2026-05-23-026`
- 明确不包含：不实现 Alembic skill generator 改造；不写 `.agents/skills`；不创建 symlink；不改 Plugin MCP tools；不引入 Dashboard。
- 下一处真实阻塞点：已解除。Core contract 返工验收通过后，阻塞点转移到 Alembic route producer receipt。
- 阻塞点之前还能做：把 receipt 字段、marker、授权状态、conflict 状态、export target 表达和 old briefing wording 一次性封口。
- 验证命令：`npm run build:check`；新增 / 受影响 contract tests；`npm run smoke:public-api`；`git diff --check`。如仓库已有更严格 `npm run check`，一并运行并回填。
- 回填要求：回填完成范围、提交 hash、新增 contract 路径、public export 路径、关键类型样例、验证命令和结果、给 Alembic / Plugin 的消费说明、遗留风险。
- 执行前置硬规则：读取 workspace `AGENTS.md`、本 wave 文档、`AlembicCore/AGENTS.md`；开始前做定位声明，明确“我当前窗口是 AlembicCore，本轮职责是共享确定性 contract，不负责 Alembic producer、Plugin exporter 或测试验证”。
- 完成回填：[../../AlembicCore/cold-start-skill-delivery-core-contract-2026-05-24.md](../../../../AlembicCore/cold-start-skill-delivery-core-contract-2026-05-24.md)
- 提交：`821f4a1ee182323b464d51265907a4fe56871f02`
- 完成范围：新增 `ProjectSkillDeliveryContracts`，覆盖 receipt / asset / runtime export / managed marker / authorization / conflict / evidence / shout summary；通过 `@alembic/core/host-agent-workflows` 公共导出；更新 Core briefing 旧 `alembic_skill` 文案；补 contract tests 和 public API smoke 固化。
- 验证结果：`npm run check`、`npm run build`、`npm run smoke:public-api`、`git diff --check` 均通过。
- 遗留风险：仅完成 Core contract，不证明 Alembic / Plugin 已真实生成 receipt、写 `.agents/skills` 或创建 symlink；多 root export 仍为 `GTODO-2026-05-24-030`。
- 消费建议：当前已派 `Alembic` 做 Alembic route producer receipt；`AlembicPlugin` 等 Alembic route producer 回填后再做 Codex-facing consumer/exporter 与 Plugin route receipt。
- 总控验收结论：未通过。当前 contract 已覆盖 receipt 主体、route、runtime export 基本状态、managed marker 基本形状、normalizer / validator、public export 和 briefing 文案；但缺少第一版完成定义里的项目级授权与自动覆盖关键字段：
  - `ProjectSkillDeliveryAuthorization` 只有 `required/status/grantedBy/message`，缺少授权 scope，例如 `projectScopeId`、`codexSkillRoot` 或等价结构，无法固定“本项目后续自动允许”的边界。
  - `ProjectSkillRuntimeExportReceipt` 只有 `targetRoot/targetPath`，缺少明确 `projectScopeId`、`codexSkillRoot` 和 `refreshRequired`，下游无法统一判断项目级隔离与 Codex 刷新提示。
  - `ProjectSkillManagedMarker` 只有 `projectId/projectRoot/route/skillName/sourcePath/markerPath`，缺少 `generatedSkillId`、`generationHash` 和 `projectScopeId`，不足以支撑“自动生成项可自动覆盖、非自动生成或标记不匹配进入 conflict”的安全判断。
  - `ProjectSkillDeliveryContracts.test.ts` 只验证 route、exported status 和基本 marker，未覆盖 scope、hash、refresh 和 marker mismatch 关键路径。
- 返工要求：在 Core contract 中补齐上述字段、normalizer / builder / validator 和 contract tests；保持 Core 只定义 contract，不写 `.agents/skills`、不创建 symlink、不改 Alembic / Plugin 实现。返工后回填新提交 hash、字段样例、测试结果和给 Alembic / Plugin 的消费说明。
- 返工提交：`39accd063dcb7d55146d4a22b3f5ca12daa4b8c8`
- 返工完成范围：
  - `ProjectSkillDeliveryAuthorization` 增加 `projectScopeId`、`codexSkillRoot`，用于固定用户授权 scope。
  - `ProjectSkillRuntimeExportReceipt` 增加 `projectScopeId`、`codexSkillRoot`、`refreshRequired`，用于固定 Codex skill root 与刷新提示。
  - `ProjectSkillManagedMarker` 增加 `generatedSkillId`、`generationHash`、`projectScopeId`，用于后续自动覆盖安全判断。
  - 新增 `validateProjectSkillDeliveryReceipt` 和 validation issues：`authorization-scope-missing`、`runtime-export-scope-missing`、`managed-marker-identity-missing`。
  - contract tests 覆盖 Alembic route scope / hash / refresh、Plugin route normalizer 默认传播和缺失字段 validation。
- 字段样例：`projectScopeId: "scope-project-1"`、`codexSkillRoot: ".agents/skills"`、`runtimeExport.refreshRequired: true`、`managedMarker.generatedSkillId: "skill-architecture"`、`managedMarker.generationHash: "sha256:..."`。
- 返工验证结果：`npm run build:check`、`npx vitest run test/ProjectSkillDeliveryContracts.test.ts`、`npm run check`、`npm run build`、`npm run smoke:public-api`、`git diff --check` 均通过。
- 返工遗留风险：Core 仍只定义 contract / validator，不证明 Alembic / Plugin 已真实生成 receipt、写 `.agents/skills`、创建 symlink 或刷新 Codex runtime；这些仍需后续窗口完成。
- 返工消费建议：总控验收通过后先派 `Alembic` 使用 `createAlembicProjectSkillDeliveryReceipt` 写入 scope / hash / refresh 字段；`AlembicPlugin` 消费前使用 `normalizeProjectSkillDeliveryReceipt` + `validateProjectSkillDeliveryReceipt`，validation issues 非空时不得自动覆盖。
- 总控返工验收：通过。真实代码已在 `ProjectSkillDeliveryContracts.ts` 补齐 `authorization.projectScopeId/codexSkillRoot`、`runtimeExport.projectScopeId/codexSkillRoot/refreshRequired`、`managedMarker.generatedSkillId/generationHash/projectScopeId`，并新增 `validateProjectSkillDeliveryReceipt`；`ProjectSkillDeliveryContracts.test.ts` 覆盖 Alembic route scope / hash / refresh、Plugin route normalizer 传播和缺失字段 validation issues。总控复跑 `npm run build:check`、`npx vitest run test/ProjectSkillDeliveryContracts.test.ts`、`npm run smoke:public-api`、`npm run check` 和 `git diff --check HEAD^ HEAD` 均通过。`CSSD-P1-Core` 关闭。

### CSSD-P2-Alembic

- 窗口：`Alembic`
- 状态：已完成
- 派发时间（北京时间）：2026-05-24 15:00 CST
- 状态更新时间（北京时间）：2026-05-24 15:20 CST
- 阶段目标：Alembic route producer 在冷启动 / rescan / dimension completion 的 project skill 生成成功后产出真实 `ProjectSkillDeliveryReceipt`，并让 Plugin / Codex 后续能从 workflow / job 可读面消费，不再依赖旧 `alembic_skill(load)` hint。
- 主线动作：
  - 读取 Alembic 真实 skill 生成链路，重点从 `BootstrapConsumers`、`WorkflowSkillCompletionCapability`、job result / status / resident payload 出口开始剪枝。
  - 从 `@alembic/core/host-agent-workflows` 消费 `createAlembicProjectSkillDeliveryReceipt`、`validateProjectSkillDeliveryReceipt` 等 contract；不要在 Alembic 内自造重复 receipt 类型。
  - skill 生成成功后写入 Alembic route receipt，包含 asset path / content hash / evidence refs / shout summary / projectScopeId / codexSkillRoot / managedMarker / runtimeExport 初始状态。
  - 把 receipt 或 receipt summary 暴露到 cold-start / rescan / dimension completion 的 workflow result、job status 或现有 resident readable payload，让 AlembicPlugin 后续有稳定消费面。
  - 替换旧 `alembic_skill({ operation: "load" })` hint；如果保留只读内部读取路径，必须标明非默认、真实消费方和后续删除条件。
- 合并 TODO：`GTODO-2026-05-23-026`
- 明确不包含：不实现 Plugin runtime export；不写 Codex `.agents/skills` symlink；不处理 Plugin route producer；不改 Dashboard；不创建真实项目测试。
- 下一处真实阻塞点：Alembic route receipt 未回填前，AlembicPlugin 不应实现 Alembic route consumer/exporter。
- 阻塞点之前还能做：同一 Alembic 窗口内可一次性完成 receipt 产出、旧 hint 替换、job / workflow 可读面和 targeted tests。
- 验证命令：skill generation targeted tests；workflow / job result tests；resident payload tests；`npm run build:check`；`npm run lint` 或仓库等价检查；`npm run check` 如可用；`git diff --check`。
- 回填要求：回填完成范围、提交 hash、真实 receipt 样例、暴露到哪个 workflow / job / resident 可读面、替换旧 hint 的证据、验证命令和结果、遗留风险、给 `AlembicPlugin` 的消费建议。
- 执行前置硬规则：读取 workspace `AGENTS.md`、本 wave 文档、`Alembic/AGENTS.md`；开始前做定位声明，明确“我当前窗口是 Alembic，本轮职责是 resident route producer，不负责 Plugin exporter、Codex symlink 或真实项目测试”。
- 提交：`2f71c5204ab73037885afe0f9467b7268f157252`
- 完成范围：
  - `WorkflowSkillCompletionCapability.generateSkill` 在 `SKILL.md` 成功写入后消费 Core `createAlembicProjectSkillDeliveryReceipt` / `validateProjectSkillDeliveryReceipt`，产出 Alembic route receipt；字段包含 asset path、`sha256:<contentHash>`、evidence refs、`projectScopeId`、`codexSkillRoot`、managed marker、`runtimeExport.status: "pending"`、shout summary。
  - `BootstrapConsumers.consumeBootstrapSkills` 汇总 `skillResults.deliveryReceipts` / summaries / validation issues，并把 receipt 挂入 dimension skill completion payload。
  - `InternalDimensionFillFinalizer` 将 receipt 写入 workflow report 的 `projectSkillDelivery` 和 per-dimension `projectSkillDelivery` 摘要；同时保留原 efficiency augmentation。
  - 通过 `BootstrapEventEmitter.emitProcessEvents` 发出 `artifact` 事件，Daemon `JobProcessEventRecorder` 可在 `/api/v1/jobs/:jobId/events` 中读取和实时广播。
  - 生成路径和手动 skill create/update hint 已移除旧 `alembic_skill({ operation: "load" })` 默认验证口径，改为 receipt / runtime export 状态；load 仅作为人工检查入口保留。
- 真实 receipt 样例（由 Alembic 真实 `generateSkill` 在临时项目生成，路径折叠为 `<projectRoot>`）：

```json
{
  "id": "alembic-skill-e06c6ad3-project-api-1798ab71dcbe3c89",
  "route": "alembic",
  "projectScopeId": "project:e06c6ad3",
  "skillName": "project-api",
  "asset": {
    "kind": "skill-file",
    "path": "<projectRoot>/Alembic/skills/project-api/SKILL.md",
    "contentHash": "sha256:1798ab71dcbe3c89",
    "artifactRefs": [
      { "kind": "skill-file", "ref": "<projectRoot>/Alembic/skills/project-api/SKILL.md" },
      { "kind": "source-file", "ref": "src/api.ts" }
    ]
  },
  "authorization": {
    "status": "pending",
    "required": true,
    "projectScopeId": "project:e06c6ad3",
    "codexSkillRoot": "<projectRoot>/.agents/skills"
  },
  "runtimeExport": {
    "status": "pending",
    "strategy": "symlink-first",
    "linkMode": "none",
    "refreshRequired": true,
    "targetPath": "<projectRoot>/.agents/skills/project-api",
    "targetRoot": "<projectRoot>/.agents/skills"
  },
  "managedMarker": {
    "generatedSkillId": "alembic:project:e06c6ad3:project-api",
    "generationHash": "sha256:1798ab71dcbe3c89",
    "markerPath": "<projectRoot>/.agents/skills/project-api/.alembic-managed.json"
  },
  "shoutSummary": {
    "delivered": true,
    "runtimeVisible": false,
    "message": "Project Skill project-api generated by Alembic; Codex runtime export is pending."
  }
}
```

- 暴露面：
  - workflow 可读面：`.asd/bootstrap-report.json` 与 report history 中的 `projectSkillDelivery.receipts[]`、`projectSkillDelivery.summaries[]`、`dimensions.<dimensionId>.projectSkillDelivery`。
  - job / resident 可读面：`BootstrapConsumers` 通过 `emitProcessEvents` 发出 `kind: "artifact"`, `phase: "skill-delivery"` 的 job process event；Daemon 现有 `/api/v1/jobs/:jobId/events` 返回该 event，RealtimeService 继续通过 `JobProcessEventRecorder` broadcast。
  - dimension completion payload：`emitDimensionComplete` 的 skill payload 附带 `deliveryReceipt`、`deliveryReceiptSummary`、`deliveryReceiptValidation`，供同进程 resident / workflow listener 消费。
- 验证命令与结果：
  - `npm run build:self`：通过；用于刷新本地 `dist` 后运行 package-import 型 unit tests。
  - `npm run test:unit -- test/unit/WorkflowSkillCompletionCapability.test.ts test/unit/BootstrapSkillConsumer.test.ts test/unit/InternalDimensionFillFinalizer.test.ts test/unit/DaemonJobRunner.test.ts`：通过，4 files / 14 tests。
  - `npm run build:check`：通过。
  - `npm run lint`：通过。
  - `npm run check`：通过。
  - `npm run lint:repo-boundary`：通过。
  - `git diff --check`：通过。
  - receipt smoke：通过；真实 `generateSkill` 生成 `ProjectSkillDeliveryReceipt`，`validateProjectSkillDeliveryReceipt` 返回 `ok: true, issues: []`。
- 总控验收：通过。真实代码从 `@alembic/core/host-agent-workflows` 消费 Core contract，`WorkflowSkillCompletionCapability.generateSkill` 成功写入 `SKILL.md` 后产出 Alembic route receipt；`BootstrapConsumers` 汇总 `deliveryReceipts` 并发出 `kind: "artifact"`, `phase: "skill-delivery"` process event，content 中保留完整 receipt JSON；`InternalDimensionFillFinalizer` 写入 workflow report `projectSkillDelivery` 和 per-dimension summary；旧生成 hint 已切到 receipt / runtime export 状态口径。总控复跑 `npm run build:self`、targeted unit tests（4 files / 14 tests）、`npm run build:check`、`npm run lint`、`npm run check`、`npm run lint:repo-boundary`、`git diff --check HEAD^ HEAD` 和 `git diff --check` 均通过。`CSSD-P2-Alembic` 关闭。
- 遗留风险：
  - 本轮只完成 Alembic resident route producer；`runtimeExport.status` 仍为 `pending`，不会写 Codex `.agents/skills`、不会创建 symlink、不会刷新 Codex runtime。
  - Alembic 仓库没有外部 Codex-facing `alembic_dimension_complete` handler；该链路后续由 `AlembicPlugin` 消费同一 Core contract 衔接。
  - 真实项目 Codex skill discovery、managed marker conflict、Git 状态污染仍需 `AlembicPlugin` 完成 exporter 后交给 `AlembicTest` 验证。
- 给 `AlembicPlugin` 的消费建议：
  - 先消费 Alembic route 的 `projectSkillDelivery.receipts[]` 或 `/api/v1/jobs/:jobId/events` 中 `metadata.receiptId / runtimeExportStatus / projectScopeId` 对应的 artifact payload；不要重新推断 skill path、scope 或 content hash。
  - 使用 Core `normalizeProjectSkillDeliveryReceipt` + `validateProjectSkillDeliveryReceipt`；validation issues 非空时不得自动 export / 覆盖。
  - 对 `runtimeExport.status: "pending"` 的 receipt 执行项目级授权、conflict check、managed marker 校验和 `symlink-first` export；成功后产出 Plugin route 或 export-updated receipt，将 `runtimeExport.status` 推进为 `exported` 并设置 `linkMode: "symlink"`。

### CSSD-P3-Plugin

- 窗口：`AlembicPlugin`
- 状态：已完成
- 派发时间（北京时间）：2026-05-24 15:25 CST
- 状态更新时间（北京时间）：2026-05-24 15:55 CST
- 阶段目标：Codex-facing receipt 消费、项目级授权、symlink-first export、Plugin route receipt 和旧 `alembic_skill` 替代。
- 主线动作：
  - 消费 Core receipt contract 和 Alembic route receipt，完成 Codex-facing receipt normalization / validation / shout summary。
  - 实现项目级授权、`symlink-first` runtime export、conflict handling、managed marker 写入 / 校验、Codex project skill root 状态回填。
  - 为 Plugin route host-agent cold-start skill 生成链路产出同一 contract 的 receipt。
  - 删除、替换或明确降级旧 `alembic_skill` Codex-facing 默认管理入口，避免把 project knowledge asset 伪装成 runtime skill。
- 合并 TODO：`GTODO-2026-05-23-026`
- 明确不包含：不实现 Alembic resident producer；不写用户全局 `$HOME/.agents/skills`；不修改 Codex plugin cache；不支持多文件夹 / 多 root export；不做真实项目测试。
- 阻塞 / 依赖：`CSSD-P2-Alembic` 已通过总控验收，Alembic route receipt / job readable payload 可消费；Plugin 实现完成前，AlembicTest 继续阻塞。
- 下一处真实阻塞点：Plugin project-scoped runtime export、授权 / conflict handling、Plugin route receipt 和旧 `alembic_skill` 替代未闭合前，无法验证 Codex 真实发现和使用项目级 skill。
- 阻塞点之前还能做：同一 AlembicPlugin 窗口内可一次性完成 Alembic route consumer、Plugin route producer、symlink-first export、managed marker / conflict handling、prime/bootstrap shout 摘要和旧入口替代。
- 验证命令：project root / Ghost resolver tests；authorization / conflict / symlink behavior tests；MCP schema/tool visibility tests；runtime package verification；`npm run check` 或仓库等价检查；`git diff --check`。
- 回填要求：回填完成范围、提交 hash、receipt / export 样例、授权与冲突状态样例、旧 `alembic_skill` 替代结果、验证命令和结果、遗留风险、给 AlembicTest 的真实项目验证建议。
- 执行前置硬规则：读取 workspace `AGENTS.md`、本 wave 文档、`AlembicPlugin/AGENTS.md`；开始前做定位声明，明确“我当前窗口是 AlembicPlugin，本轮职责是 Codex-facing consumer/exporter 与 Plugin route producer，不负责 Alembic resident producer 或真实项目测试”。
- 提交：`9a4c7f0491b1215dd0c657e04a7f3f15512f6c96`
- AlembicCodex runtime artifact 提交：`d94e87563860af4c6426dbbed498eb6573330ceb`
- AlembicCodex runtime artifact hash：`a44435cdcc04f7524417312de91f5280ddfc09f86bdbe8a9f87093a44c385aa1`
- 完成范围：
  - 新增 `lib/codex/ProjectSkillDelivery.ts`，从 Core `@alembic/core/host-agent-workflows` 消费 `ProjectSkillDeliveryReceipt` normalizer / validator / builder，提供 Plugin route receipt、receipt scan、runtime export 与 conflict validation。
  - 新增 `alembic_project_skill` MCP tool / schema / gateway / handler：`list` 回填 Alembic storage、delivery receipt 和 `.agents/skills` runtime root；`load` 优先读取 runtime export；`export` 消费 receipt 并在授权后 symlink；`create/update` 写 Alembic storage 后生成 Plugin route receipt，可选 export；`delete` 保留 legacy storage 删除语义。
  - `WorkflowSkillCompletionCapability.generateSkill` 与外部 `alembic_dimension_complete` skill result 改为生成 / 返回 Plugin route delivery receipt，并在 host-agent workflow 内授权导出到当前项目 `.agents/skills/<skill>/SKILL.md`。
  - 实现项目级授权与冲突保护：未授权时 `authorizationStatus: "pending"` / `runtimeExportStatus: "blocked"`；已存在未托管目标时 `conflictStatus: "different-existing"` 且不覆盖；兼容 symlink 或 marker 可刷新。
  - 写入 `.alembic-managed.json` marker，包含 `generatedSkillId`、`generationHash`、`projectScopeId`、`sourcePath`、`route` 和 `skillName`，用于后续 managed refresh 判断。
  - 旧 `alembic_skill` tool 仍保留为 legacy storage compatibility，description、handler hint 和 consolidated wrapper 均指向 `alembic_project_skill` 作为 Codex runtime delivery 替代。
  - 更新 Alembic Codex Skill 文档与 `plugins/alembic-codex` runtime artifact。
- receipt / export 样例（路径折叠为 `<projectRoot>`）：

```json
{
  "receipt": {
    "id": "plugin-skill-<scope>-project-api",
    "route": "plugin",
    "skillName": "project-api",
    "authorizationStatus": "pending",
    "runtimeExportStatus": "pending",
    "codexSkillRoot": "<projectRoot>/.agents/skills",
    "managedMarker": {
      "generatedSkillId": "alembic:project:<scope>:project-api",
      "generationHash": "sha256:7576cd47...",
      "markerPath": "<projectRoot>/.agents/skills/project-api/.alembic-managed.json",
      "projectScopeId": "project:<scope>",
      "route": "plugin",
      "skillName": "project-api",
      "sourcePath": "<projectRoot>/Alembic/skills/project-api/SKILL.md"
    }
  },
  "exported": {
    "authorizationStatus": "granted",
    "runtimeExportStatus": "exported",
    "conflictStatus": "target-missing",
    "targetPath": "<projectRoot>/.agents/skills/project-api",
    "linkMode": "symlink",
    "markerExists": true
  }
}
```

- 授权与冲突状态样例：

```json
{
  "blockedWithoutAuthorization": {
    "authorizationStatus": "pending",
    "runtimeExportStatus": "blocked",
    "conflictStatus": "blocked",
    "message": "Project-level authorization is required before exporting this Project Skill into Codex runtime."
  },
  "blockedDifferentExistingTarget": {
    "authorizationStatus": "granted",
    "runtimeExportStatus": "blocked",
    "conflictStatus": "different-existing",
    "message": "Codex Project Skill target already exists and is not managed by this receipt: <projectRoot>/.agents/skills/project-api/SKILL.md"
  }
}
```

- 旧 `alembic_skill` 替代结果：

```json
{
  "replacementFor": "alembic_skill",
  "hint": "Use alembic_project_skill export/create/update for Codex runtime delivery; alembic_skill is legacy storage compatibility.",
  "codexRuntimeRoot": "<projectRoot>/.agents/skills"
}
```

- 验证命令与结果：
  - `npm run build:check`：通过。
  - `npx vitest run --config vitest.unit.config.ts test/unit/ProjectSkillDelivery.test.ts test/unit/WorkflowSkillCompletionCapability.test.ts test/unit/CodexMcpServer.test.ts`：通过，3 files / 40 tests。
  - `npm run check`：通过，typecheck / Biome / Core import boundary 均通过。
  - `npm run build`：通过。
  - `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime` 和 `runtime.tgz`。
  - `npm run verify:codex-plugin`：通过。
  - `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed。
  - `git diff --check`：通过。
  - `git -C plugins/alembic-codex diff --check`：通过。
- 总控验收：通过。真实代码从 `@alembic/core/host-agent-workflows` 消费 Core receipt normalizer / validator / builder；`ProjectSkillDelivery.ts` 实现 project-scoped `.agents/skills` root、授权 gating、symlink-first export、managed marker、same-source symlink refresh 和 `different-existing` conflict block；`alembic_project_skill` 已在 MCP tool declaration、gateway 和 server router 挂载，`list/load/export/create/update/delete` 走 Codex-facing handler；Plugin route workflow skill 生成后返回 `deliveryReceipt` 并尝试项目级 export；runtime artifact 子仓库 `d94e87563860af4c6426dbbed498eb6573330ceb` 已刷新，`runtime.tgz` SHA-256 为 `a44435cdcc04f7524417312de91f5280ddfc09f86bdbe8a9f87093a44c385aa1`。总控复跑 `npm run build:check`、targeted unit tests（3 files / 40 tests）、`npm run check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin`、`git diff --check`、`git diff --check HEAD^ HEAD` 和 `git -C plugins/alembic-codex diff --check` 均通过；主仓库和 runtime artifact 子仓库工作区均干净。`CSSD-P3-Plugin` 关闭。
- 总控验收备注：根层 `SOUL.md` 仍有旧 `alembic_skill({ operation: "list" })` 文案，但不在 Codex plugin runtime artifact、skill 文案或 package files 中；当前 runtime-facing 替代目标不因此阻塞，后续若继续清理根层历史身份文档，可并入文档治理或 legacy doc cleanup。
- 遗留风险：
  - 本轮未做真实项目 Codex 新窗口 discovery；`.agents/skills` 被当前 Codex runtime 是否立即发现仍需 AlembicTest 真实项目复测。
  - 第一版仍不支持 multi-root / multi-folder export，继续由 `GTODO-2026-05-24-030` 排期。
  - Alembic route receipt job process event 的跨进程消费只在 Plugin 侧实现了 report scan / direct receipt export；真实 resident job event 到 Plugin export 的端到端操作需 AlembicTest 复核。
- 给 AlembicTest 的真实项目验证建议：
  - 在真实项目中分别触发 Alembic route cold-start / rescan 和 Plugin route `alembic_dimension_complete`，确认两条 route 都产出 `ProjectSkillDeliveryReceipt`。
  - 调用 `alembic_project_skill({ operation: "export", receipt, authorizeProjectSkillExport: true })`，确认 `.agents/skills/<skill>/SKILL.md` 为 symlink，`.alembic-managed.json` 存在且 marker 字段匹配 receipt。
  - 打开新的 Codex 会话或刷新插件 cache 后验证 Project Skill 能被 Codex skill discovery 看到；同时确认默认可见 shout / summary 不倾倒 evidence refs。
  - 预置一个非 Alembic managed 的 `.agents/skills/<skill>/SKILL.md`，确认 export 返回 `different-existing` 且不覆盖用户文件。
  - 检查真实项目 git status，确认只出现预期 `.agents/skills` 项目级 runtime export 变更，没有写入 `$HOME/.agents/skills`、Codex plugin cache 或其它全局位置。

### SPLO-FU-031-Dashboard

- 窗口：`AlembicDashboard`
- 状态：已完成（总控验收通过；用户反馈追加 UI 返工已提交）
- 派发时间（北京时间）：2026-05-24 16:21 CST
- 状态更新时间（北京时间）：2026-05-24 17:03 CST
- 阶段目标：在不改变 Alembic 后端事件 contract 的前提下，把 cold-start / rescan process Timeline 调整成更适合开发者长时间观察与复盘的 UI。
- 主线动作：
  - 基于真实代码改 `JobsView` 的 process Timeline：外层去掉 `rounded-xl border ... bg-surface` 这种卡片描边噪声，内部仍保留事件时序线 / dot。
  - 将 Timeline 事件区改成 terminal-like 固定高度窗口，内部可滚动并保持最新消息从底部可读；active job 需要有 `thinking` / waiting 类状态提示。
  - LLM 类事件（`llm.input` / `llm.output` / `llm.reflection`）的长内容默认收起，用户点击后展开；summary、kind、phase、artifact 和 chips 仍应默认可扫。
  - 增加 Dashboard 本地最近展示数据保存：只保存 developer view model / UI 展开状态 / 最近事件快照，日志和 Alembic `/api/v1/jobs/:jobId/events` 仍为权威来源；缓存必须 bounded，有 TTL 或数量上限，并按 jobId 隔离。
  - 补 Dashboard contract / unit-style 检查，锁住 local cache、LLM 默认收起、固定高度滚动容器和事件 normalizer 不退化。
- 合并 TODO：`GTODO-2026-05-24-031`
- 明确不包含：
  - 不改 `Alembic` recorder、JobStore、HTTP events API 或 socket broadcast。
  - 不处理 `GTODO-2026-05-24-029` 的逐 tool call 近实时性 / producer 频率问题。
  - 不修改真实测试项目，不创建 AlembicTest 测试单。
  - 不把 raw log 作为前端主展示源，不对 developer-facing 内容做截断或额外脱敏。
- 代码事实 / 边界证据：
  - `Alembic/lib/daemon/JobProcessEventRecorder.ts` 已有 bounded per-job recorder、developer view projection 和 best-effort broadcast。
  - `Alembic/lib/http/routes/jobs.ts` 已有 `GET /api/v1/jobs/:jobId/events`，并在 bootstrap / rescan enqueue response 返回 `eventsUrl`。
  - `AlembicDashboard/src/hooks/useJobProcessEvents.ts` 目前通过 REST + `job:process-event` socket 合并事件，但没有本地展示缓存。
  - `AlembicDashboard/src/components/Views/JobsView.tsx` 目前 `JobProcessTimeline` 外层是 bordered card，事件列表不是固定高度 terminal window；`ProcessEventItem` 对 `event.content` 直接完整展开。
- 下一处真实阻塞点：如果 Dashboard 不先处理 local cache 与 LLM 默认收起，开发者刷新页面或面对长 LLM 内容时仍会被刷屏，`GTODO-031` 不能关闭。
- 阻塞点之前还能做：Dashboard 单仓库即可完成 UI、local cache、contract test 和前端 build；不需要 Alembic 上游改动。
- 验证命令：`npm run check`；`git diff --check`；必要时补一个 Dashboard contract test 或 browser / DOM scroll probe，证明固定高度容器可滚动、LLM 内容默认收起且可展开、本地 cache 可恢复。
- 回填要求：回填完成范围、提交 hash、改动文件、local cache key / TTL / 数量上限 / 清理策略、LLM 展开交互样例、固定高度滚动证据、验证命令和结果、遗留风险和是否可关闭 `GTODO-2026-05-24-031`。
- 执行前置硬规则：读取 workspace `AGENTS.md`、本 wave 文档、`AlembicDashboard/AGENTS.md`；开始前做定位声明，明确“我当前窗口是 AlembicDashboard，本轮职责是 process Timeline UI / 前端状态 / local display cache，不负责 Alembic 后端 producer、JobStore 持久化或真实项目测试”。

执行窗口回填（2026-05-24）：

- 完成范围：
  - `src/components/Views/JobsView.tsx`：`JobProcessTimeline` 外层去掉原卡片式 rounded/border/bg-surface 包裹，改为标题工具行 + 固定高度 terminal-like 事件窗口；active job 显示 `等待新事件` / `同步中` 状态；事件窗口会在事件数量或刷新状态变化时滚到底部；追加返工后窗口高度调整为 `h-[36rem]`，并通过 `overflow-x-hidden` 与长文本断行去掉横向滚动。
  - `src/components/Views/JobsView.tsx`：所有带 `event.content` 的事件默认收起，只保留 summary、kind、phase、artifact refs、metadata chips 等可扫信息；按钮 `展开内容` / `收起内容` 控制单条事件展开。该策略覆盖 `llm.input` / `llm.output` / `llm.reflection`，并扩展到 summary / artifact 等其它结构化事件。
  - `src/hooks/useJobProcessEvents.ts`：在 REST initial / incremental、socket append 和 content 展开状态变化时读写 Dashboard 本地展示缓存；缓存只作为前端最近展示恢复，Alembic `/api/v1/jobs/:jobId/events` 与 `job:process-event` 仍是权威来源。
  - `src/utils/jobProcessEvents.ts`：新增 job process display cache helper、stable event key 导出、TTL / job 数量 / event 数量限制和清理策略。
  - `scripts/dashboard-contract.test.mjs`：补 contract 检查，锁住 local cache、内容默认收起、固定高度滚动容器、底部自动滚动、无横向溢出断行和 socket / REST normalizer 统一入口。
- 提交 hash：
  - `dc5b446`（`feat: refine job process timeline display`）：初版 Timeline / local cache / LLM 默认收起。
  - `f4b6768`（`fix: expand process timeline content`）：按用户反馈加高 terminal、去横向滚动，并让所有 `event.content` 支持默认收起后展开。
- 改动文件：
  - `src/components/Views/JobsView.tsx`
  - `src/hooks/useJobProcessEvents.ts`
  - `src/utils/jobProcessEvents.ts`
  - `scripts/dashboard-contract.test.mjs`
- local cache：
  - key：`alembic.dashboard.jobProcessEvents.v1:<encodeURIComponent(jobId)>`，按 `jobId` 隔离。
  - TTL：`JOB_PROCESS_EVENTS_CACHE_TTL_MS = 6 * 60 * 60 * 1000`，即 6 小时。
  - 数量上限：`JOB_PROCESS_EVENTS_CACHE_JOB_LIMIT = 40` 个 job；`JOB_PROCESS_EVENTS_CACHE_EVENT_LIMIT = 120` 条最近事件 / job；`expandedContentEventIds` 只保留仍在最近事件集合中的 key。
  - 清理策略：读缓存时发现过期 / jobId 不匹配 / JSON 损坏即移除；写缓存前后执行 `cleanupJobProcessEventsDisplayCache`，删除过期 entry，并按 `updatedAt` 保留最近 40 个 job；localStorage quota / privacy mode 异常只跳过缓存，不影响实时 Timeline。
- 内容默认收起与展开交互证据：
  - 当前默认收起条件：任意事件只要存在 `event.content`，默认展示 `内容已收起`，按钮 `展开内容` / `收起内容` 控制展开；这包含 `llm.input`、`llm.output`、`llm.reflection`，也包含其它 structured content。
  - 默认展示：summary / title / timestamp / kind / phase / dimension / target / severity / artifact refs 仍直接显示；长标题、summary、content、artifact refs 和 metadata chips 均使用断行策略避免横向滚动。
  - 展开交互：内容区按钮调用 `onContentExpandedChange(!contentExpanded)`；展开状态由 `setContentExpanded(eventKey, expanded)` 写入本地 display cache，刷新后可恢复。
- 固定高度滚动证据：
  - terminal 事件窗口 class 包含 `h-[36rem] overflow-y-auto overflow-x-hidden ... overscroll-contain`。
  - `timelineListRef.current.scrollTop = timelineListRef.current.scrollHeight` 在 `visibleEvents.length` 或 `refreshing` 变化时触发，确保最新消息从底部可读。
  - contract test 覆盖 `h-[36rem] overflow-y-auto overflow-x-hidden`、`max-w-full whitespace-pre-wrap break-all` 和底部滚动赋值。
- 验证命令：
  - `npm run check`
  - `git diff --check`
  - `git diff --check HEAD^ HEAD`
- 验证结果：
  - `npm run check` 通过：Dashboard lint passed；`node --test scripts/dashboard-contract.test.mjs` 8/8 pass；`tsc --noEmit` 通过；`vite build` 通过。
  - `git diff --check` 通过。
  - `git diff --check HEAD^ HEAD` 通过。
- 遗留风险：
  - 本轮只做 Dashboard 展示与 local display cache，不改变 Alembic recorder、JobStore、HTTP events API、socket broadcast 或 producer 频率。
  - 未启动真实后端做浏览器人工截图；固定高度滚动、内容默认收起和 cache 恢复由代码路径与 Dashboard contract test 约束。
  - localStorage 只是最近展示恢复，不保证跨浏览器、隐私模式或 quota 满时可用；失败时实时 REST/socket 展示不受影响。
- 下一步建议：
  - 总控复核 `dc5b446` + `f4b6768` 后可继续保持 `GTODO-2026-05-24-031` 关闭。
  - 如 AlembicTest 后续发现真实长 LLM 内容仍影响阅读，再由 Dashboard 做视觉微调；如发现事件缺失或频率不足，应归口 Alembic producer / recorder，不在本任务内处理。

总控验收（2026-05-24 16:43 CST；追加 UI 返工见下方）：

- 验收结论：通过，`GTODO-2026-05-24-031` 关闭。
- 代码复核：
  - `JobsView.tsx` 的 `JobProcessTimeline` 已去掉外层 card-style 描边包裹，保留标题工具行和内部事件时序线；事件窗口追加返工后使用 `h-[36rem] overflow-y-auto overflow-x-hidden ... overscroll-contain`，并在 `visibleEvents.length` / `refreshing` 变化时执行 `scrollTop = scrollHeight`。
  - `ProcessEventItem` 追加返工后对所有带 `event.content` 的事件默认只展示摘要、kind、phase、artifact refs 和 metadata chips，内容区由 `展开内容` / `收起内容` 控制。
  - `useJobProcessEvents` 在 REST initial / incremental、socket append 和展开状态变化时写入 display cache；`jobProcessEvents.ts` 按 jobId 隔离、6 小时 TTL、40 个 job 和 120 条事件上限清理。
  - `dashboard-contract.test.mjs` 覆盖 local cache、内容默认收起、固定高度滚动容器、无横向溢出断行、底部滚动赋值和 socket / REST normalizer。
- 总控复跑验证：
  - `git -C AlembicDashboard diff --check HEAD^ HEAD`：通过。
  - `git -C AlembicDashboard diff --check`：通过。
  - `npm run check`：通过，包含 Dashboard lint、`node --test scripts/dashboard-contract.test.mjs` 8/8、`tsc --noEmit` 和 `vite build`。
- 工作区状态：`AlembicDashboard` 工作区干净。
- 遗留风险：未做真实后端浏览器截图；本任务范围为 Dashboard-only UI / local display cache follow-up，真实项目测试仍由 `AlembicTest` 的 `Test-2026-05-24-04` 承接。

执行窗口追加返工（2026-05-24 17:03 CST）：

- 触发原因：用户反馈 Timeline 窗口仍偏短、terminal 区域出现横向滚动，并希望所有 content 都支持默认收起后展开，不只 LLM 事件。
- 提交 hash：`f4b6768`（`fix: expand process timeline content`）。
- 改动范围：
  - `JobsView.tsx` 将 Timeline terminal 从 `h-96` 调整为 `h-[36rem]`，增加 `overflow-x-hidden`，并对事件标题、summary、content、artifact refs、metadata chips 使用 `break-all` / `max-w-full`，避免横向滚动条。
  - `ProcessEventItem` 删除只针对 LLM 的 `showContent` 分支；所有带 `event.content` 的事件默认显示 `内容已收起`，点击 `展开内容` 后展示完整内容，展开状态继续写入同一 local display cache。
  - `dashboard-contract.test.mjs` 更新固定高度、无横向溢出和所有 content 默认收起的 contract 检查。
- 验证命令与结果：
  - `npm run check`：通过，包含 Dashboard lint、`node --test scripts/dashboard-contract.test.mjs` 8/8、`tsc --noEmit` 和 `vite build`。
  - `git diff --check`：通过。
  - `git diff --check HEAD^ HEAD`：通过。
- 功能范围确认：未改 Alembic 后端 recorder、JobStore、HTTP events API、socket broadcast、producer 频率或真实项目；local cache key、TTL、数量上限和清理策略保持不变。

### CSSD-P4-Test

- 窗口：`AlembicTest`
- 状态：未通过（全量 cold-start 被用户中断，且轻量 probe 在 tool visibility 阶段失败）
- 阶段目标：真实项目验证双 route、Codex runtime skill 可见性、symlink、git 状态、冲突保护和 shout。
- 主线动作：
  - 在真实项目中验证 Alembic route 与 Plugin route 都能生成 project skill receipt。
  - 验证项目级 runtime export 后 Codex 能发现并使用 `.agents/skills/<skill-name>` 下的 symlinked project skill。
  - 验证 receipt 可追证、默认呐喊不堆证据路径、Git 状态不污染、冲突保护不静默覆盖非 managed skill。
- 合并 TODO：`GTODO-2026-05-23-026`
- 明确不包含：不修改产品实现仓库；不改真实测试项目业务代码；不修复 Alembic / Plugin 问题，只回填复现证据和源仓库归口。
- 阻塞 / 依赖：`CSSD-P2-Alembic` 与 `CSSD-P3-Plugin` 均已通过总控验收，但 Plugin tool visibility 仍未覆盖 initialized / bootstrap-running / no usable knowledge 的 project skill delivery 场景。
- 测试证据：
  - `AlembicTest/docs/cold-start-llm-display-live-monitor-2026-05-24.md`：用户于 15:09 CST 取消全量 cold-start，job 末态为 cancelled；events API 有 `llm.input:2`，没有 `llm.output` / `llm.reflection` / `tool`，不能证明 skill delivery。
  - `AlembicTest/tmp/project-skill-delivery-probe-2026-05-24T08-36-25-799Z.json`：`ok=false`，MCP `tools/list` 只有 11 个 tool，`hasAlembicProjectSkill=false`；`alembic_codex_status` 显示 BiliDili initialized、`bootstrapRunning=true`、`knowledge.usable=false`、vector ready，导致 project skill tool 没有进入可见工具集。
- 结论：本轮不能算目标完成；全量冷启动太慢应从验收门移出，改为先修 tool visibility，再使用测试模式复测。
- 下一处真实阻塞点：`alembic_project_skill` 未在 no usable knowledge / bootstrap running 状态下可见。
- 阻塞点之前还能做：由 `AlembicPlugin` 修 tool policy / preflight / tests / runtime artifact；`AlembicTest` 暂停长跑，等待可见性修复后重启 test-mode 验证。
- 验证命令：本阶段无通过验收命令；失败证据以上述 report / temp JSON 为准。
- 回填要求：已转入 `CSSD-P4A-Plugin-Tool-Visibility` 和 `CSSD-P4B-TestMode-Test`。
- 执行前置硬规则：后续测试仍必须读取 workspace `AGENTS.md`、本 wave 文档、`AlembicTest/AGENTS.md` 并做定位声明。

### CSSD-P4A-Plugin-Tool-Visibility

- 窗口：`AlembicPlugin`
- 状态：已完成（总控验收通过）
- 派发时间（北京时间）：2026-05-24 16:50 CST
- 阶段目标：解除 `alembic_project_skill` 被 knowledge gate 误隐藏的 blocker，让 project skill delivery surface 在已初始化项目中可见，支持后续 test-mode 复测。
- 主线动作：
  - 基于 `ToolPolicy.ts`、`tool-visibility.ts`、`Preflight.ts` 和 `CodexMcpServer.test.ts` 深挖当前工具可见性规则；确认 `alembic_project_skill` 是 project skill runtime delivery / local write surface，不应和 Recipe search / Guard 等知识库消费工具一起被 `knowledge.usable` 硬门禁隐藏。
  - 将 `alembic_project_skill` 纳入 initialized project 可见工具集，至少覆盖 `knowledge.initialized=true`、`knowledge.usable=false`、`bootstrapRunning=true` 的 BiliDili 测试状态；保留 `alembic_skill` 为 legacy storage compatibility，除非有明确理由，不要把 legacy tool 重新提前暴露。
  - 修正 preflight hidden failure / allowed tools，使 `alembic_project_skill` 的 `list/load/create/export` 能在项目 root trusted 且 workspace initialized 时返回真实响应；未授权 export 仍必须 blocked，不能绕过 `authorizeProjectSkillExport`。
  - 补 unit / smoke：无 usable knowledge 但 initialized 时 `tools/list` 包含 `alembic_project_skill`；`alembic_skill` 不因本修复回到默认路径；BiliDili 类 bootstrap-running 状态下 project skill tool 可见；runtime artifact / plugin package 同步刷新。
  - 给 AlembicTest 回填可直接使用的轻量 probe 命令或脚本入口，说明是否需要重新 build / prepare runtime。
- 合并 TODO：`GTODO-2026-05-23-026`
- 明确不包含：不跑真实项目全量 cold-start；不改 Alembic resident producer；不修改 AlembicTest 脚本；不打开 admin tools；不把 legacy `alembic_skill` 恢复为默认 Codex runtime delivery 入口。
- 下一处真实阻塞点：Plugin visibility 修复并刷新 runtime artifact 前，`AlembicTest` 不能进入 project skill export / conflict / Codex discovery 复测。
- 阻塞点之前还能做：同一 Plugin 窗口内完成 policy、preflight、tests、runtime prepare、verify / smoke，并回填 tool list 证据。
- 验证命令：targeted `CodexMcpServer` / `ProjectSkillDelivery` tests；`npm run build:check`；`npm run check`；`npm run build`；`npm run prepare:codex-plugin-runtime`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin`；`git diff --check`；`git -C plugins/alembic-codex diff --check`。如 smoke 过重，至少回填为何不能跑和等价轻量 MCP `tools/list` 证据。
- 回填要求：回填提交 hash、改动文件、工具可见性前后对比、BiliDili 类状态下 `tools/list` 证据、legacy `alembic_skill` 是否仍降级、验证命令和结果、runtime artifact hash、给 AlembicTest 的 test-mode 复测命令。
- 执行前置硬规则：读取 workspace `AGENTS.md`、本 wave 文档、`AlembicPlugin/AGENTS.md`；开始前做定位声明，明确“我当前窗口是 AlembicPlugin，本轮职责是 Codex MCP tool visibility / preflight / runtime artifact，不负责真实项目测试或 Alembic resident producer”。

执行窗口回填（2026-05-24 17:08 CST）：

- 完成范围：
  - `AlembicPlugin/lib/codex/ToolPolicy.ts`：新增 `CODEX_PROJECT_SKILL_DELIVERY_TOOL_NAMES`，将 `alembic_project_skill` 作为 initialized project 的 Codex runtime delivery surface 放行；core tool filter 在 `knowledge.usable=false` 时仅额外允许 host-agent workflow tools 与 project skill delivery tool。
  - `AlembicPlugin/test/unit/CodexToolPolicy.test.ts`：补 initialized / bootstrap-running 可见性断言，确认 `alembic_project_skill` 可见且 legacy `alembic_skill` 不提前暴露。
  - `AlembicPlugin/test/unit/CodexMcpServer.test.ts`：补 BiliDili 类 `initialized/no usable knowledge/bootstrap-running` 状态，验证 `tools/list` 可见、`alembic_project_skill list` 成功、runtime root 指向项目 `.agents/skills`。
  - `AlembicPlugin/plugins/alembic-codex/runtime/dist/lib/codex/ToolPolicy.js` 与 `runtime.tgz`：已由 `npm run prepare:codex-plugin-runtime` 同步。
- 提交 hash：
  - `AlembicPlugin`：`3e422ab9ed081783d3273b82d6c3beacd61ee2e7`
  - `AlembicCodex` runtime artifact 子仓库：`eff3ea7ead8773e8315a923e7d4ea57281242f01`
- runtime artifact hash：`plugins/alembic-codex/runtime.tgz` sha256 `c9e545a8f0ea2679649dc13f7327fe34e41ba25bee4fd197cad3c137594a536f`
- 工具可见性前后对比：
  - 修复前：`Test-2026-05-24-04` 的 BiliDili probe 显示 MCP `tools/list` 为 11 个工具，`hasAlembicProjectSkill=false`；根因是 `knowledge.usable=false` / `bootstrapRunning=true` 时只放行 cold-start local tools 与 host-agent workflow tools。
  - 修复后：同类状态为 12 个工具，新增可见 `alembic_project_skill`；`alembic_skill=false`、`alembic_health=false`，未把 legacy storage 或知识消费工具提前放出。
- BiliDili 类状态下 `tools/list` 证据（本地 built dist 探针，状态为 `initialized/no-usable-knowledge/bootstrap-running`）：

```json
{
  "toolCount": 12,
  "hasAlembicProjectSkill": true,
  "hasLegacyAlembicSkill": false,
  "hasAlembicHealth": false,
  "names": [
    "alembic_codex_status",
    "alembic_codex_diagnostics",
    "alembic_codex_init",
    "alembic_codex_dashboard",
    "alembic_codex_bootstrap",
    "alembic_codex_rescan",
    "alembic_codex_job",
    "alembic_submit_knowledge",
    "alembic_project_skill",
    "alembic_bootstrap",
    "alembic_rescan",
    "alembic_dimension_complete"
  ],
  "projectSkillListSuccess": true,
  "replacementFor": "alembic_skill"
}
```

- 验证命令 / 结果：
  - `npx vitest run --config vitest.unit.config.ts test/unit/CodexToolPolicy.test.ts test/unit/CodexMcpServer.test.ts test/unit/ProjectSkillDelivery.test.ts`：通过，3 files / 47 tests。
  - `npm run build:check`：通过。
  - `npm run check`：通过，typecheck / biome / core import boundary 均通过。
  - `npm run build`：通过。
  - `node --input-type=module -e '<BiliDili-like tools/list probe>'`：通过，见上方 12 tools 证据。
  - `npm run prepare:codex-plugin-runtime`：通过。
  - `npm run verify:codex-plugin`：通过。
  - `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime 均 passed。
  - `git diff --check`、`git -C plugins/alembic-codex diff --check`、`git diff --check HEAD^ HEAD`、`git -C plugins/alembic-codex diff --check HEAD^ HEAD`：均通过。
- legacy `alembic_skill` 状态：仍只作为 compatibility / replacement 口径保留；在 initialized 但无 usable knowledge / bootstrap-running 状态下未进入默认 `tools/list`。
- 遗留风险：本轮只在 Plugin 内部与 BiliDili-like 本地状态验证工具可见性；真实 BiliDili 项目的 project skill create / export / conflict / no-global-write 仍需 `AlembicTest` 用 test mode 复测。
- 给 `AlembicTest` 的 test-mode 复测命令：

```bash
cd /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture node scripts/probe-project-skill-delivery.mjs --project BiliDili --plugin AlembicPlugin --timeout-ms 60000
```

总控验收（2026-05-24 17:16 CST）：

- 代码证据：`AlembicPlugin/lib/codex/ToolPolicy.ts` 与 `plugins/alembic-codex/runtime/dist/lib/codex/ToolPolicy.js` 均包含 `CODEX_PROJECT_SKILL_DELIVERY_TOOL_NAMES`，initialized project 在 `knowledge.usable=false` 时额外放行 `alembic_project_skill`；legacy `alembic_skill` 仍未进入该状态的默认可见工具集。
- 测试证据：`test/unit/CodexToolPolicy.test.ts` 和 `test/unit/CodexMcpServer.test.ts` 覆盖 initialized / no usable knowledge / bootstrap-running 状态下的 `tools/list` 与 `alembic_project_skill list`。
- 总控复跑验证：`npx vitest run --config vitest.unit.config.ts test/unit/CodexToolPolicy.test.ts test/unit/CodexMcpServer.test.ts test/unit/ProjectSkillDelivery.test.ts` 通过（3 files / 47 tests）；`npm run build:check`、`npm run check`、`npm run build`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin` 均通过。
- 干净性验证：`git diff --check HEAD^ HEAD`、`git diff --check`、`git -C plugins/alembic-codex diff --check HEAD^ HEAD`、`git -C plugins/alembic-codex diff --check` 均通过；`AlembicPlugin` 主仓库和 `plugins/alembic-codex` runtime artifact 子仓库工作区均干净。
- 结论：`CSSD-P4A-Plugin-Tool-Visibility` 通过，总控解除 `CSSD-P4B-TestMode-Test` 阻塞，当前只发送 `AlembicTest`。

### CSSD-P4B-TestMode-Test

- 窗口：`AlembicTest`
- 状态：已完成
- 阶段目标：用测试模式替代全量 cold-start 长跑，完成真实项目 project skill delivery 验收。
- 主线动作：
  - 不再把全量 cold-start 作为本轮硬门禁；启动 Alembic / Dashboard 测试流程时必须显式使用 `ALEMBIC_TEST_MODE=1`，并配置最小维度，例如 `ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture`，配合小样本 `maxFiles` / `contentMaxLines` 和必要时 `skipGuard=true`。
  - 在报告中记录 `/api/v1/modules/test-mode` 或 session payload 的 testMode 证据，证明本轮不是全量冷启动。
  - 复跑 `probe-project-skill-delivery.mjs` 或等价脚本，证明 `alembic_project_skill` 可见，`create` + `authorizeProjectSkillExport=true` 能生成 Plugin route receipt、symlink-first runtime export、managed marker、load uses codex-runtime、conflict blocks different-existing、git 状态只含预期 `.agents/skills` 产物且不写全局 `$HOME/.agents/skills`。
  - 使用测试模式触发最小 Alembic route producer，补充 Alembic route `ProjectSkillDeliveryReceipt` 出现在 workflow report / job events 的证据；若 test mode 仍过慢或外部 LLM 超时，记录最后状态和归口，不得口头通过。
  - 新建正式测试报告到 `AlembicTest/docs/project-skill-runtime-delivery-test-mode-2026-05-24.md`，不要只留 `tmp/*.json`。
- 合并 TODO：`GTODO-2026-05-23-026`
- 明确不包含：不修改真实测试项目业务源码；不写用户全局 skill；不修改 Codex plugin cache；不在 AlembicTest 修产品实现。
- 下一处真实阻塞点：等待 AlembicTest 在真实 BiliDili test mode 环境回填 project skill runtime delivery 证据。
- 阻塞点之前还能做：当前已经具备启动条件；AlembicTest 应直接进入 test-mode 复测，不再全量 cold-start 长跑。
- 验证命令：以 AlembicPlugin 回填的命令为准；测试报告必须记录 test mode env、job id / session id、probe JSON、git status、symlink / marker / conflict / no-global-write 证据。
- 回填要求：回填测试结论、使用配置、测试模式证据、job id / session id、Codex project skill discovery / use 证据、symlink / marker / conflict / git 证据、报告路径、失败归口和复测建议。
- 执行前置硬规则：读取 workspace `AGENTS.md`、本 wave 文档、`docs/workspace/current/alembic-test-exchange.md`、`AlembicTest/AGENTS.md`；开始前做定位声明，明确“我当前窗口是 AlembicTest，本轮职责是 test-mode 真实项目验证，不负责产品实现修复”。

总控验收（2026-05-24 17:45 CST）：

- 结论：通过，带观察项。`Test-2026-05-24-05 / CSSD-P4B-TestMode-Test` 证明第一版 project skill delivery 完成定义闭合。
- 报告：[../../../AlembicTest/docs/project-skill-runtime-delivery-test-mode-2026-05-24.md](../../../../../AlembicTest/docs/project-skill-runtime-delivery-test-mode-2026-05-24.md)。
- test mode 证据：`ALEMBIC_TEST_MODE=1`、`ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture`、`ALEMBIC_TEST_RESCAN_DIMS=architecture`；bootstrap request 使用 `maxFiles=8`、`contentMaxLines=40`、`skipGuard=true`；`/api/v1/modules/test-mode` 返回 `enabled=true`、bootstrap / rescan dims 为 `architecture`。
- Alembic route 证据：job `bootstrap_mpjkpvdy_c12ba098` / session `bs_1779614825558_snyz66` 完成，耗时 417 秒；1 维度、8 files、5 candidates、1 skill、1 `ProjectSkillDeliveryReceipt`；receipt `alembic-skill-02a25032-project-architecture-5baeb1ec18754d92`，`runtimeExport.status=pending`、`authorization.status=pending`，符合 Alembic route producer 只产 receipt、由 Plugin route 授权 export 的设计。
- events API 证据：`AlembicTest/tmp/cssd-p4b-testmode-events-bootstrap_mpjkpvdy_c12ba098.json` 最终保留 14 events，`hiddenCount=0`，包含 `workflow=5`、`checkpoint=1`、`llm.input=1`、`tool=1`、`llm.output=1`、`llm.reflection=1`、`summary=3`、`artifact=1`。
- Plugin route 证据：`AlembicTest/tmp/project-skill-delivery-probe-2026-05-24T09-28-08-585Z.json` 中 `ok=true`；`tools/list` 为 26 tools，包含 `alembic_project_skill` 和 legacy `alembic_skill`，本轮 runtime delivery 使用 `alembic_project_skill`；`create/export/load/conflict` checks 全部为 true。
- Codex project runtime 证据：`alembic_project_skill list` 指向 `BiliDili/.agents/skills`，runtime export `visible=true`、`managed=true`；`alembic_project_skill load` 返回 `success=true`、`source=codex-runtime` 并读到 probe sentinel。
- symlink / marker / conflict / git 证据：`SKILL.md` 是指向 Alembic-managed storage 的 symlink，`.alembic-managed.json` 与 receipt 字段匹配；非 managed 冲突返回 `different-existing` / `blocked` 且保留用户文件；总控复核 `git -C BiliDili status --short` 无输出，`BiliDili/.agents/skills` 目录为空，无全局 `$HOME/.agents/skills` 写入。
- 遗留观察：本轮是单维度 smoke，不是全量质量验收；active job 期间 REST events 曾落后但完成后 retained events 正确，继续由 `GTODO-2026-05-24-029` 观察；多 root export 保持 `GTODO-2026-05-24-030`；终端格式化语义展示保持 `GTODO-2026-05-24-032`。
- 结论：`CSSD-P4B-TestMode-Test` 关闭，`GTODO-2026-05-23-026` 主线完成。

## 窗口覆盖

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | `CSSD-P2-Alembic` 总控验收通过。 |
| `AlembicCore`<br>已完成 | `CSSD-P1-Core` 返工验收通过。 |
| `AlembicAgent`<br>无任务 | 第一版不改 Agent runtime。 |
| `AlembicDashboard`<br>已完成 | `SPLO-FU-031-Dashboard` / `GTODO-2026-05-24-031` 总控验收通过；追加 UI 返工提交 `f4b6768` 已完成。 |
| `AlembicPlugin`<br>已完成 | `CSSD-P4A-Plugin-Tool-Visibility` 总控验收通过；提交 `3e422ab9ed081783d3273b82d6c3beacd61ee2e7`，runtime artifact 子仓库提交 `eff3ea7ead8773e8315a923e7d4ea57281242f01`。 |
| `AlembicTest`<br>已完成 | `CSSD-P4B-TestMode-Test` / `Test-2026-05-24-05` 总控验收通过。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码，只可能由 `AlembicTest` 作为验证对象。 |

## 空闲窗口调度

| 窗口 | 调度状态 | 是否发送 | 说明 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | `CSSD-P2-Alembic` 总控验收通过。 |
| `AlembicCore` | 已完成 | 否 | `CSSD-P1-Core` 返工验收通过。 |
| `AlembicAgent` | 无任务 | 否 | 第一版不改 Agent runtime。 |
| `AlembicDashboard` | 已完成 | 否 | `GTODO-2026-05-24-031` 总控验收通过；追加 UI 返工提交 `f4b6768` 已完成。 |
| `AlembicPlugin` | 已完成 | 否 | `CSSD-P4A-Plugin-Tool-Visibility` 总控验收通过。 |
| `AlembicTest` | 已完成 | 否 | `CSSD-P4B-TestMode-Test` / `Test-2026-05-24-05` 总控验收通过。 |

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`阻塞`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicDashboard`<br>已完成 | `SPLO-FU-031-Dashboard` 已提交 `dc5b446`，追加 UI 返工提交 `f4b6768`，当前无新派发。 |
| `AlembicPlugin`<br>已完成 | `CSSD-P4A-Plugin-Tool-Visibility` 总控验收通过。 |
| `Alembic`<br>已完成 | `CSSD-P2-Alembic` 总控验收通过。 |
| `AlembicCore`<br>已完成 | `CSSD-P1-Core` 返工验收通过。 |
| `AlembicAgent`<br>无任务 | 第一版不改 Agent runtime。 |
| `AlembicTest`<br>已完成 | `CSSD-P4B-TestMode-Test` / `Test-2026-05-24-05` 总控验收通过。 |
| `BiliDili`<br>无任务 | 不改真实项目源码。 |

## 可复制提示词

发送给：无。

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`。

## 回填区

- 2026-05-24 14:23 CST：总控将 `GTODO-2026-05-23-026` 从旁路设计提升为当前主线，完成代码依赖调研和目标阶段确认，创建 Wave 1。当前只发送 `AlembicCore`。
- 2026-05-24 14:42 CST：`AlembicCore` 完成 `CSSD-P1-Core` 并提交 `821f4a1ee182323b464d51265907a4fe56871f02`；回填见 [../../AlembicCore/cold-start-skill-delivery-core-contract-2026-05-24.md](../../../../AlembicCore/cold-start-skill-delivery-core-contract-2026-05-24.md)。`npm run check`、`npm run build`、`npm run smoke:public-api`、`git diff --check` 均通过。当前等待总控验收，不发送下游窗口。
- 2026-05-24 14:48 CST：总控验收 `AlembicCore` 提交 `821f4a1ee182323b464d51265907a4fe56871f02` 未通过。真实代码已完成 receipt 主体、route、public export 和 briefing 文案，但缺少 `projectScopeId + codexSkillRoot` 授权 scope、managed marker `generatedSkillId` / `generationHash` / `projectScopeId`、`runtimeExport.refreshRequired` 与对应 tests；继续只发送 `AlembicCore` 返工。
- 2026-05-24 14:55 CST：`AlembicCore` 完成 `CSSD-P1-Core` 返工并提交 `39accd063dcb7d55146d4a22b3f5ca12daa4b8c8`；补齐 scope / marker / refresh 字段、`validateProjectSkillDeliveryReceipt` 和 contract tests。`npm run build:check`、`npx vitest run test/ProjectSkillDeliveryContracts.test.ts`、`npm run check`、`npm run build`、`npm run smoke:public-api`、`git diff --check` 均通过。当前等待总控验收，不发送下游窗口。
- 2026-05-24 15:00 CST：总控验收 `AlembicCore` 返工提交 `39accd063dcb7d55146d4a22b3f5ca12daa4b8c8` 通过；总控复跑 `npm run build:check`、`npx vitest run test/ProjectSkillDeliveryContracts.test.ts`、`npm run smoke:public-api`、`npm run check`、`git diff --check HEAD^ HEAD` 均通过。当前启动 `CSSD-P2-Alembic`，只发送 `Alembic`。
- 2026-05-24 15:20 CST：`Alembic` 完成 `CSSD-P2-Alembic` 并提交 `2f71c5204ab73037885afe0f9467b7268f157252`；在真实 `WorkflowSkillCompletionCapability.generateSkill` 成功写入 project skill 后生成 Alembic route `ProjectSkillDeliveryReceipt`，通过 `skillResults.deliveryReceipts`、workflow report `projectSkillDelivery`、dimension skill completion payload 和 `/api/v1/jobs/:jobId/events` artifact process event 暴露；旧 `alembic_skill({ operation: "load" })` 默认验证 hint 已替换为 receipt / runtime export 状态口径。验证：`npm run build:self`、targeted unit tests（4 files / 14 tests）、`npm run build:check`、`npm run lint`、`npm run check`、`npm run lint:repo-boundary`、`git diff --check`、receipt smoke 均通过。当前等待总控验收，不发送下游窗口。
- 2026-05-24 15:25 CST：总控验收 `Alembic` 提交 `2f71c5204ab73037885afe0f9467b7268f157252` 通过；总控复跑 `npm run build:self`、targeted unit tests（4 files / 14 tests）、`npm run build:check`、`npm run lint`、`npm run check`、`npm run lint:repo-boundary`、`git diff --check HEAD^ HEAD` 和 `git diff --check` 均通过。当前启动 `CSSD-P3-Plugin`，只发送 `AlembicPlugin`。
- 2026-05-24 15:55 CST：`AlembicPlugin` 完成 `CSSD-P3-Plugin` 并提交 `9a4c7f0491b1215dd0c657e04a7f3f15512f6c96`；AlembicCodex runtime artifact 子仓库提交 `d94e87563860af4c6426dbbed498eb6573330ceb`，`runtime.tgz` sha256 为 `a44435cdcc04f7524417312de91f5280ddfc09f86bdbe8a9f87093a44c385aa1`。新增 `alembic_project_skill`、Plugin route receipt、project-scoped symlink export、authorization / conflict handling、managed marker、旧 `alembic_skill` 替代文案和 runtime artifact。验证：`npm run build:check`、targeted unit tests（3 files / 40 tests）、`npm run check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin`、`git diff --check`、`git -C plugins/alembic-codex diff --check` 均通过。当前等待总控验收，不发送新窗口。
- 2026-05-24 16:03 CST：总控验收 `AlembicPlugin` 提交 `9a4c7f0491b1215dd0c657e04a7f3f15512f6c96` 通过；总控复跑 `npm run build:check`、targeted unit tests（3 files / 40 tests）、`npm run check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin`、`git diff --check`、`git diff --check HEAD^ HEAD` 和 `git -C plugins/alembic-codex diff --check` 均通过，主仓库和 runtime artifact 子仓库工作区均干净。当前创建 `Test-2026-05-24-04`，只发送 `AlembicTest`。
- 2026-05-24 16:21 CST：用户说明测试可能耗时，要求先处理 `GTODO-2026-05-24-031`；总控读取 Dashboard / Alembic 真实代码后判断第一波为 Dashboard-only：Alembic 已有 bounded recorder、events API 和 socket broadcast，缺口集中在 Dashboard `JobsView` 展示、`useJobProcessEvents` local display cache 和 LLM 内容默认收起。当前等待 `AlembicTest` 回填，并行发送 `AlembicDashboard`。
- 2026-05-24 16:37 CST：`AlembicDashboard` 完成 `SPLO-FU-031-Dashboard` / `GTODO-2026-05-24-031` 并提交 `dc5b446`；回填见上方 `SPLO-FU-031-Dashboard` 执行窗口回填。验证：`npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD` 均通过。当前等待总控验收，不发送新窗口。
- 2026-05-24 16:43 CST：总控验收 `AlembicDashboard` 提交 `dc5b446` 通过；真实代码确认 fixed-height terminal-like Timeline、bottom scroll、local display cache 和 LLM 默认收起均已落地；总控复跑 `npm run check`、`git -C AlembicDashboard diff --check HEAD^ HEAD`、`git -C AlembicDashboard diff --check` 均通过，Dashboard 工作区干净。`GTODO-2026-05-24-031` 关闭；当前仍等待 `AlembicTest` 回填 `Test-2026-05-24-04`。
- 2026-05-24 16:50 CST：用户回填 `AlembicTest` 完成但说明全量 cold-start 太久已中断，并建议改为开启测试模式后再派发。总控复查测试文档与真实代码：`cold-start-llm-display-live-monitor-2026-05-24.md` 只证明 cancelled / `llm.input`，不能证明 project skill delivery；`project-skill-delivery-probe-*.json` 显示 BiliDili 当前 MCP `tools/list` 缺少 `alembic_project_skill`，根因为 Plugin tool policy 在 `knowledge.usable=false` / `bootstrapRunning=true` 时隐藏非 host-agent workflow tool。当前启动 `CSSD-P4A-Plugin-Tool-Visibility`，只发送 `AlembicPlugin`；`AlembicTest` 等待后续 `ALEMBIC_TEST_MODE=1` 复测。
- 2026-05-24 17:03 CST：`AlembicDashboard` 根据用户反馈追加 UI 返工并提交 `f4b6768`：Timeline terminal 加高到 `h-[36rem]`，去掉横向滚动，长标题 / summary / content / artifact refs / metadata chips 断行；所有 `event.content` 默认收起并可展开，展开状态沿用 local display cache。验证：`npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD` 均通过；Dashboard 工作区干净。
- 2026-05-24 17:08 CST：`AlembicPlugin` 完成 `CSSD-P4A-Plugin-Tool-Visibility` 并提交 `3e422ab9ed081783d3273b82d6c3beacd61ee2e7`；AlembicCodex runtime artifact 子仓库提交 `eff3ea7ead8773e8315a923e7d4ea57281242f01`，`runtime.tgz` sha256 为 `c9e545a8f0ea2679649dc13f7327fe34e41ba25bee4fd197cad3c137594a536f`。修复后 BiliDili-like `initialized/no usable knowledge/bootstrap-running` 状态 `tools/list` 为 12 tools，`alembic_project_skill=true`、legacy `alembic_skill=false`、`alembic_health=false`，并且 `alembic_project_skill list` 返回 `success=true`。验证：targeted unit tests（3 files / 47 tests）、`npm run build:check`、`npm run check`、`npm run build`、BiliDili-like tools/list probe、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin`、diff checks 均通过。当前等待总控验收，不发送新窗口。
- 2026-05-24 17:16 CST：总控验收 `AlembicPlugin` 提交 `3e422ab9ed081783d3273b82d6c3beacd61ee2e7` 通过；总控复核源码与 runtime dist 可见性策略一致，复跑 targeted unit tests（3 files / 47 tests）、`npm run build:check`、`npm run check`、`npm run build`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin`、主仓库和 runtime artifact 子仓库 `git diff --check` 均通过，两个工作区均干净。当前解除 `CSSD-P4B-TestMode-Test` 阻塞，只发送 `AlembicTest`。
- 2026-05-24 17:45 CST：总控验收 `Test-2026-05-24-05 / CSSD-P4B-TestMode-Test` 通过。`AlembicTest` 报告证明 test mode 小维度 cold-start、Alembic route receipt、Plugin route `alembic_project_skill` create/export/load/conflict/no-global-write、Codex runtime root、symlink/marker 和 BiliDili clean git 状态均闭合。`GTODO-2026-05-23-026` 主线完成，当前无发送窗口。
