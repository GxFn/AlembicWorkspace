# Cold-start Project Skill Delivery Code Dependency Research

状态：已完成，作为 `GTODO-2026-05-23-026` 当前主线阶段依据
维护窗口：AlembicWorkspace
调研时间：2026-05-24 14:23 CST
来源设计：[../../workspace/archive/2026-05/cold-start-skill-delivery/cold-start-skill-delivery-workspace-plan-2026-05-23.md](../../workspace/archive/2026-05/cold-start-skill-delivery/cold-start-skill-delivery-workspace-plan-2026-05-23.md)

## 调研目标

确认双链路冷启动生成的 project skills 如何从“已有生成物”变成 Codex 当前项目可直接发现和使用的 runtime skills，并据此确定第一波 producer / consumer 阶段顺序。

本调研只做代码事实与依赖判断，不直接改产品源码。

## 关键代码事实

### Core 已有路径基础，但缺交付 contract

- `AlembicCore/src/shared/WorkspaceResolver.ts:49` 到 `WorkspaceResolver.ts:96` 已区分 `projectRoot` 与 `dataRoot`，Ghost 模式通过 `ProjectRegistry` 定位外置 data root。
- `AlembicCore/src/shared/WorkspaceResolver.ts:212` 到 `WorkspaceResolver.ts:236` 已同时定义 runtime skills dir 与 knowledge skills dir；当前 project skill 仍落在 `knowledgeDir/skills`。
- `AlembicCore/src/infrastructure/io/WriteZone.ts:77` 到 `WriteZone.ts:101` 已提供 `project()`、`data()`、`knowledge()` 分区写入路径，可承接“Ghost store + 项目级 export”的边界表达。
- `AlembicCore/src/workflows/capabilities/execution/external/MissionBriefingSupport.ts:225` 到 `MissionBriefingSupport.ts:236` 仍把后续动作写成 `alembic_skill({ operation: "load", name })`，说明 Core briefing 层还没有 receipt/export 语义。

判断：`AlembicCore` 是第一上游。它不应实现 Codex 项目目录写入，但必须先提供 `ProjectSkillDeliveryReceipt`、runtime export receipt、managed marker、authorization/conflict status 和 normalizer / validator，避免 Alembic 与 Plugin 分叉。

### Alembic 已有 canonical producer，但结果只有名字和旧 hint

- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts:730` 到 `BootstrapConsumers.ts:768` 遍历 `skillWorthy` dimensions 并汇总 `SkillResults`。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts:789` 到 `BootstrapConsumers.ts:805` 用维度分析文本、referenced files 和 key findings 调用 `generateSkill`。
- `Alembic/lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts:57` 到 `WorkflowSkillCompletionCapability.ts:87` 负责生成 skill 内容，并只返回 `{ success, skillName }`。
- `Alembic/lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts:140` 到 `WorkflowSkillCompletionCapability.ts:176` 写入 `SKILL.md`。
- `Alembic/lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts:192` 到 `WorkflowSkillCompletionCapability.ts:200` 返回旧 `alembic_skill(load)` hint。

判断：`Alembic` 第一阶段不需要重写 skill 生成主逻辑；需要在生成成功后补 receipt、managed marker 和 workflow/job result 表达，并替换旧 hint。它是 Alembic route 的 producer，向 Plugin / Codex 提供可信 receipt。

### AlembicPlugin 已有 host-agent producer 与 Codex 入口，但缺 runtime export

- `AlembicPlugin/lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts:56` 到 `WorkflowSkillCompletionCapability.ts:86` 与 Alembic 侧几乎同构，说明 Plugin route 已具备 host-agent 生成 project skill 的基础。
- `AlembicPlugin/lib/external/mcp/handlers/dimension-complete/ExternalDimensionCompletionWorkflow.ts:575` 到 `ExternalDimensionCompletionWorkflow.ts:599` 在 `dimension_complete` 时调用 `generateSkill`，source 为 Codex host-agent route。
- `AlembicPlugin/lib/codex/KnowledgeState.ts:188` 到 `KnowledgeState.ts:207` 只扫描 `resolver.skillsDir` 统计 skill 数量，不检查 Codex runtime skill root。
- `AlembicPlugin/lib/codex/KnowledgeState.ts:289` 到 `KnowledgeState.ts:295` 只把 `resolver.skillsDir/<name>/SKILL.md` 当作 project skill 统计来源。
- `AlembicPlugin/plugins/alembic-codex/.codex-plugin/plugin.json:25` 只声明插件固定 reusable skills：`"skills": "./skills/"`。项目冷启动生成物不会自然进入该插件包。

判断：`AlembicPlugin` 是 Codex-facing consumer/exporter，也是 Plugin route producer。它需要在 Core contract 之后实现 project-scoped runtime export：`symlink-first` 到当前项目 `.agents/skills/<skill-name>`，目标指向 Ghost data root 中 Alembic-managed skill store，并写入 project runtime metadata 的授权 / 冲突状态。

### Plugin 与 Alembic resident 连接已有服务框架，但没有 skill delivery feature

- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:97` 到 `AlembicResidentServiceClient.ts:155` 已有 resident health/search/jobs 路径和 capability gating。
- 同文件 job 能力只覆盖 bootstrap / rescan enqueue 和 readJob；当前没有 project skill delivery / export receipt 读取 feature。

判断：第一版可以先让 Alembic job result / status 携带 receipt，由 Plugin 读取已有 job/status payload；若实现中发现 payload 不足，再以 `project-skills.delivery` resident feature 补小接口。不得绕回旧 `/api/v1/mcp/call` 或把 Plugin 做成 Alembic tool bridge。

## 阶段依赖判断

1. `AlembicCore` 必须先完成共享 contract，否则 Alembic producer、Plugin producer/exporter 会各自猜字段。
2. `Alembic` producer 和 `AlembicPlugin` exporter 在 Core 完成后可以并行推进，但 Plugin 对 Alembic route 的消费验收需要 Alembic 回填真实 receipt。
3. `AlembicPlugin` 删除 / 替换 `alembic_skill` 默认管理入口应与新只读 project skill receipt/read 入口同包完成，避免 Codex-facing 能力短暂断档。
4. `AlembicTest` 必须最后接手真实项目验证，包含 Alembic route、Plugin route、symlink export、Codex 可见性、git 状态和冲突保护。

## 第一版非目标

- 不支持多文件夹 / 多 root project skill roots；该事项保留为 `GTODO-2026-05-24-030`。
- 不写用户全局 `$HOME/.agents/skills`。
- 不修改 Codex plugin cache 或 `~/.codex/config.toml`。
- 不把 project skill asset 继续伪装成已安装 Codex runtime skill。
- 不增强旧 `alembic_skill create/update/delete` 作为默认路径。

## 推荐执行顺序

### Phase 1：Core contract

只发送 `AlembicCore`。产出 `ProjectSkillDeliveryReceipt`、`ProjectSkillRuntimeExportReceipt`、managed marker、authorization/conflict 状态、normalizer / validator、public export 和 contract tests，并修正 Core briefing 旧 `alembic_skill(load)` wording。

### Phase 2：Alembic producer

等待 Core 回填后启动 `Alembic`。在冷启动 / rescan / dimension completion skill 生成成功后产出 receipt，并把 receipt 写入 workflow result / job status 可读面；替换旧 hint。

### Phase 3：Plugin consumer/exporter + Plugin producer

等待 Core 回填后启动 `AlembicPlugin`。实现 receipt 消费、Codex 呐喊摘要、项目级授权、`symlink-first` export、conflict handling、Plugin route receipt，以及旧 `alembic_skill` 默认管理入口删除 / 替换。

### Phase 4：AlembicTest 真实验证

等待 Alembic 与 Plugin 完成后启动 `AlembicTest`。验证双 producer route、项目级 runtime skill 可见性、symlink 指向、git 不污染、Codex 呐喊和冲突保护。

## 窗口覆盖结论

| 窗口 | 当前判断 |
| --- | --- |
| `AlembicCore` | 当前唯一可发送窗口，解除共享 contract 阻塞。 |
| `Alembic` | 阻塞，等待 Core contract。 |
| `AlembicPlugin` | 阻塞，等待 Core contract；后续承担 Codex-facing 最大实现面。 |
| `AlembicAgent` | 第一版无任务。 |
| `AlembicDashboard` | 第一版无任务。 |
| `AlembicTest` | 阻塞，等待实现完成后真实验证。 |
