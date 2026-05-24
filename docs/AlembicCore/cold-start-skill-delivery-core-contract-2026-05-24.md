# Cold-start Skill Delivery Core Contract

状态：CSSD-P1-Core 返工已通过总控验收
窗口：AlembicCore
完成时间：2026-05-24 14:42 CST
首次提交：`821f4a1ee182323b464d51265907a4fe56871f02`
返工提交：`39accd063dcb7d55146d4a22b3f5ca12daa4b8c8`

## 当前窗口定位

本窗口是 `AlembicCore`。本轮只承担共享、确定性、headless contract：为 Alembic / AlembicPlugin 后续冷启动 project skill delivery 提供统一 receipt、marker、runtime export 状态、normalizer / validator / builder 和公共导出。

本轮不承担 Alembic skill generator 改造，不写 `.agents/skills`，不创建 symlink，不实现 Plugin MCP tools，不改 Dashboard，不操作 AlembicTest 或真实测试项目。

## 完成范围

- 新增 `ProjectSkillDeliveryContracts`，覆盖 `ProjectSkillDeliveryReceipt`、`ProjectSkillDeliveryAsset`、`ProjectSkillRuntimeExportReceipt`、`ProjectSkillManagedMarker`、authorization / conflict / link mode / runtime export status、evidence ref 和 shout summary。
- 提供 Alembic route 与 Plugin route builder：`createAlembicProjectSkillDeliveryReceipt`、`createPluginProjectSkillDeliveryReceipt`。
- 提供 normalizer / validator：`normalizeProjectSkillDeliveryReceipt`、`isProjectSkillDeliveryReceipt`，并校验 `contractVersion`。
- 提供 `createProjectSkillDeliveryEvidenceRef` 与 `summarizeProjectSkillDeliveryReceipt`，便于 producer / consumer 统一证据引用和 developer-facing 摘要。
- 通过 `@alembic/core/host-agent-workflows` 暴露值与关键类型，并在 public API smoke 中固化。
- 更新 Core mission briefing：旧 `alembic_skill({ operation: "load" })` 口径改为 `ProjectSkillDeliveryReceipt` + `runtimeExport.status` 语义。
- 新增 contract tests，并补 HostAgentMiningWorkflow 测试防止旧 `alembic_skill` 文案回归。
- 返工补齐 `projectScopeId` / `codexSkillRoot` 授权 scope、`runtimeExport.projectScopeId` / `runtimeExport.codexSkillRoot` / `runtimeExport.refreshRequired`、`managedMarker.generatedSkillId` / `managedMarker.generationHash` / `managedMarker.projectScopeId`。
- 返工新增 `validateProjectSkillDeliveryReceipt`，用于区分基础 shape normalizer 与第一版安全语义校验；contract tests 覆盖 scope、hash、refresh 和缺失字段 validation issues。

## 新增 / 修改路径

- `AlembicCore/src/workflows/capabilities/execution/external/ProjectSkillDeliveryContracts.ts`
- `AlembicCore/src/workflows/capabilities/execution/external/index.ts`
- `AlembicCore/src/host-agent-workflows.ts`
- `AlembicCore/src/workflows/capabilities/execution/external/MissionBriefingSupport.ts`
- `AlembicCore/test/ProjectSkillDeliveryContracts.test.ts`
- `AlembicCore/test/unit/HostAgentMiningWorkflow.test.ts`
- `AlembicCore/scripts/smoke-public-api.mjs`

## 公共导出

公共消费入口：

```ts
import {
  createAlembicProjectSkillDeliveryReceipt,
  createPluginProjectSkillDeliveryReceipt,
  normalizeProjectSkillDeliveryReceipt,
  validateProjectSkillDeliveryReceipt,
  type ProjectSkillDeliveryReceipt,
} from '@alembic/core/host-agent-workflows';
```

关键枚举 / 常量：

- `PROJECT_SKILL_DELIVERY_CONTRACT_VERSION`
- `PROJECT_SKILL_DELIVERY_ROUTES`
- `PROJECT_SKILL_RUNTIME_EXPORT_STRATEGIES`
- `PROJECT_SKILL_RUNTIME_EXPORT_STATUSES`
- `PROJECT_SKILL_AUTHORIZATION_STATUSES`
- `PROJECT_SKILL_CONFLICT_STATUSES`
- `PROJECT_SKILL_LINK_MODES`
- `PROJECT_SKILL_ASSET_KINDS`

## 类型样例

```ts
const receipt = createAlembicProjectSkillDeliveryReceipt({
  id: 'receipt-1',
  createdAt: '2026-05-24T10:00:00Z',
  projectRoot: '/workspace/project',
  projectId: 'project-1',
  projectScopeId: 'scope-project-1',
  codexSkillRoot: '.agents/skills',
  skillName: 'architecture',
  dimensionId: 'architecture',
  targetName: 'main',
  asset: {
    path: 'Alembic/skills/architecture/SKILL.md',
    contentHash: 'sha256:...',
    artifactRefs: [{ kind: 'source-file', ref: 'src/app.ts', dimensionId: 'architecture' }],
  },
  authorization: {
    required: true,
    status: 'granted',
    grantedBy: 'user',
    projectScopeId: 'scope-project-1',
    codexSkillRoot: '.agents/skills',
  },
  runtimeExport: {
    status: 'exported',
    strategy: 'symlink-first',
    linkMode: 'symlink',
    projectScopeId: 'scope-project-1',
    codexSkillRoot: '.agents/skills',
    refreshRequired: true,
    targetRoot: '.agents/skills',
    targetPath: '.agents/skills/architecture',
  },
  managedMarker: {
    generatedSkillId: 'skill-architecture',
    generationHash: 'sha256:...',
    projectScopeId: 'scope-project-1',
    markerPath: '.agents/skills/architecture/.alembic-managed.json',
  },
});

const validation = validateProjectSkillDeliveryReceipt(receipt);
// validation.ok === true；缺少授权 scope / runtime scope / marker identity 时会返回 issues。
```

## 验证命令与结果

- `npm run build:check`：通过。
- `npx vitest run test/ProjectSkillDeliveryContracts.test.ts`：通过，4 tests。
- `npm run check`：通过。包含 `build:check`、`lint:public-api-boundary`、全量 `vitest run`（68 files / 964 tests）和 `biome check`。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，`Imported 75 exact public API entrypoints.`。
- `git diff --check`：通过，无空白错误。

## 总控验收

2026-05-24 15:00 CST：总控验收返工提交 `39accd063dcb7d55146d4a22b3f5ca12daa4b8c8` 通过。

- 真实代码已补齐 `authorization.projectScopeId/codexSkillRoot`、`runtimeExport.projectScopeId/codexSkillRoot/refreshRequired`、`managedMarker.generatedSkillId/generationHash/projectScopeId`。
- `validateProjectSkillDeliveryReceipt` 已区分基础 shape normalizer 与第一版安全语义校验，缺 scope / runtime scope / marker identity 会返回 validation issues。
- contract tests 覆盖 Alembic route scope / hash / refresh、Plugin route normalizer 默认传播和缺失字段 validation。
- 总控复跑 `npm run build:check`、`npx vitest run test/ProjectSkillDeliveryContracts.test.ts`、`npm run smoke:public-api`、`npm run check` 和 `git diff --check HEAD^ HEAD` 均通过。

结论：`CSSD-P1-Core` 关闭；下一阶段由 `Alembic` 承接 Alembic route producer receipt。

## 给 Alembic 的消费建议

- Alembic route producer 后续应从 `@alembic/core/host-agent-workflows` 导入 `createAlembicProjectSkillDeliveryReceipt`。
- producer 生成 Project Skill 后必须产出 receipt；`asset.path` 指向 Alembic-managed skill 源，`runtimeExport.status` 第一阶段可为 `not-requested` / `pending`，进入 Codex runtime export 后再改为 `exported` / `blocked` / `failed`。
- 用户授权结果写入 `authorization.status`；如果用户拒绝或未授权，不应写 `.agents/skills`，receipt 仍应保留并说明原因。
- 用户选择“本项目后续自动允许”时，Alembic 需要同时写入 `authorization.projectScopeId` 与 `authorization.codexSkillRoot`；这两个字段是授权边界，不要用全局用户目录或未归一化路径代替。
- runtime export 进入 Codex 项目级 skill root 后，需要写入 `runtimeExport.projectScopeId`、`runtimeExport.codexSkillRoot` 和 `runtimeExport.refreshRequired`；`refreshRequired` 为 true 时，Alembic 后续 response / shout 应提示 Codex runtime 需要刷新 skill 发现。
- symlink / conflict 检查结果写入 `runtimeExport.conflictStatus` 与顶层 `conflictStatus`；不要在 Alembic 侧自造其它字段名。
- 写入 marker 时使用 `managedMarker.generatedSkillId`、`managedMarker.generationHash` 和 `managedMarker.projectScopeId` 做自动覆盖安全判断；实际文件写入仍由 Alembic 自己负责，Core 不提供文件投递。

## 给 AlembicPlugin 的消费建议

- Plugin route producer 后续应从 `@alembic/core/host-agent-workflows` 导入 `createPluginProjectSkillDeliveryReceipt`。
- Plugin consumer 读取任意 route receipt 时应先调用 `normalizeProjectSkillDeliveryReceipt`，不要直接信任外部 JSON shape。
- Plugin consumer 在执行 runtime export 前应调用 `validateProjectSkillDeliveryReceipt`；出现 `authorization-scope-missing`、`runtime-export-scope-missing` 或 `managed-marker-identity-missing` 时，不应自动覆盖现有 Codex skill。
- Codex-facing export / authorization / conflict UI 或 MCP response 只消费 `runtimeExport`、`authorization`、`managedMarker` 和 `shoutSummary`，不要依赖旧 `alembic_skill(load)` 口径。
- `runtimeExport.strategy` 第一版按 `symlink-first` 解释；若实际复制 fallback，需要显式把 `linkMode` 设为 `copy` 并在 `message` 说明。
- Plugin 不应把 receipt 当作 Skill 内容本体；Skill 内容仍由 Alembic / Plugin generator 生成，receipt 只记录交付链路和 Codex 可见性。

## 遗留风险

- 本轮只完成 Core contract，不证明 Alembic / Plugin 已经真实生成 receipt 或执行 runtime export。
- Core 只定义 managed marker shape 和 validation issue，不写 marker 文件；冲突保护、symlink 权限、Git 状态保护仍需要 Alembic / Plugin 后续实现和 AlembicTest 真实项目验证。
- 多 root / 多 workspace folder export 仍保留为 `GTODO-2026-05-24-030`，不进入第一版。

## 下一步建议

1. 总控先验收返工提交 `39accd063dcb7d55146d4a22b3f5ca12daa4b8c8` 与本回填是否一致。
2. 验收通过后先派 `Alembic` 承接 Alembic route producer receipt，`AlembicPlugin` 继续阻塞或观察，避免提前猜 producer 输出。
3. Alembic route producer 回填后再派 `AlembicPlugin` 做 Codex-facing consumer/exporter 与 Plugin route receipt。
4. Alembic / Plugin 双侧完成后再通过 `AlembicTest` 创建真实项目验证单。
