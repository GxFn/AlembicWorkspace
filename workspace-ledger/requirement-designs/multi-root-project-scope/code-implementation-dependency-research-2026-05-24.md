# Code Implementation Dependency Research: Multi Root Project Scope

日期：2026-05-24
状态：已完成，供需求设计和目标阶段确认使用
维护窗口：AlembicWorkspace

## 调研结论

当前真实代码几乎全部以单一路径 `projectRoot` 作为 Project 身份、代码边界、daemon 状态、Dashboard 状态、Plugin MCP 上下文和 Agent 工具访问边界。多目录项目不能通过简单给 Dashboard 或 Plugin 增加 `folders[]` 字段完成；必须先在 `AlembicCore` 下沉 Project / Folder 共享合同，再让 `Alembic` 作为本地增强底座生产项目绑定与运行时状态，最后由 `AlembicPlugin`、`AlembicDashboard`、`AlembicAgent` 消费。

用户已确认的模型应作为实现前提：

- `Project` 是抽象项目边界，承载 dataRoot、knowledge、Recipe、search、prime、skill、job、monitor 和 evolution 归属。
- `Folder` 是实体文件夹 / 仓库 / 源码目录，一个 Project 可以包含多个 folder。
- Plugin 在某个 folder 启动时，只能确认当前 folder 自身为单 folder Project；多 folder 合并必须来自用户显式绑定。
- `AlembicWorkspace` 根目录可以作为控制 / 协作入口，但不能混入源码 `folders[]`，需要 `controlRoot` 或等价特别字段。
- 第一版 CLI 优先，Dashboard 做最小展示 / 添加；Plugin 在没有本地 Alembic 时继续单 folder 自洽。
- Ghost dataRoot 是唯一标准形态；旧 standard / project-root 写入不作为兼容路线或迁移分支，不再支持新建、读取分叉或切回。

## 外部调研判断

本轮不需要联网。原因：

- 用户需求是现有 Alembic 系列仓库内项目身份、dataRoot、MCP、daemon、Dashboard 和 Agent 工具边界的重构设计。
- 关键风险来自本地代码的单 `projectRoot` 假设，而不是外部平台规则。
- 后续若进入 Codex project skill runtime export 的安装 / discover 细节，或多工作区标准互操作，再按该子问题单独联网。

## 代码证据

### AlembicCore

`AlembicCore` 当前是单 root Project 合同的 source of truth。

- `AlembicCore/src/shared/ProjectRegistry.ts:1` 的注释把 registry 定义为全局项目注册表，条目包含 `id`、`ghost`、`createdAt`。
- `AlembicCore/src/shared/ProjectRegistry.ts:28` 的 `ProjectEntry` 只有 `id / ghost / createdAt`，没有 folder 数组、控制根、主 folder 或绑定来源。
- `AlembicCore/src/shared/ProjectRegistry.ts:51` 的 `RegistryData` 是 `version: 1; projects: Record<string, ProjectEntry>`，key 是路径。
- `AlembicCore/src/shared/ProjectRegistry.ts:72` 和 `AlembicCore/src/shared/ProjectRegistry.ts:80` 使用单一路径 realpath 规范化并生成 project id。
- `AlembicCore/src/shared/ProjectRegistry.ts:133` 的 `get(projectRoot)` 只按单一 normalized path 查项目。
- `AlembicCore/src/shared/ProjectRegistry.ts:143` 的 `inspect(projectRoot)` 返回单一 `projectRoot / projectRealpath / dataRoot / projectId`。
- `AlembicCore/src/shared/ProjectRegistry.ts:184` 的 `register(projectRoot, ghost)` 注册单一路径；`setWorkspaceMode(projectRoot, mode)` 同样只更新单一路径。
- 当前 `setWorkspaceMode(projectRoot, 'standard')` 仍允许切回项目目录写入；这与 multi-root ProjectScope 冲突，后续新 ProjectScope API 必须取消该产品动作，且不为 standard 保留兼容分叉。
- `AlembicCore/src/shared/WorkspaceResolver.ts:4` 说明 `dataRoot` 是运行时数据和知识库根目录；`AlembicCore/src/shared/WorkspaceResolver.ts:11` 明确 `projectRoot` 始终是真实项目目录。
- `AlembicCore/src/shared/WorkspaceResolver.ts:26` 的 `WorkspaceFacts` 只有 `targetProjectRoot`、`projectRealpath`、`dataRoot` 等单 root 字段。
- `AlembicCore/src/shared/WorkspaceResolver.ts:68` 的 constructor 只接收一个 `projectRoot`。
- `AlembicCore/src/shared/WorkspaceResolver.ts:102` 的 `fromProject(projectRoot)` 直接调用单 root `ProjectRegistry.inspect(projectRoot)`。
- `AlembicCore/src/shared/WorkspaceResolver.ts:119` 的 `toFacts()` 输出仍是单 root 事实。
- `AlembicCore/src/daemon/ProjectRuntimeContracts.ts:38` 的 `ProjectRuntimeTarget` 是 `{ projectId }` 或 `{ projectRoot }` 二选一；没有 folder target。
- `AlembicCore/src/daemon/ProjectRuntimeContracts.ts:42` 的 runtime control state 记录 active / selected projectRoot 和 projectId，均为单值。
- `AlembicCore/src/daemon/ProjectRuntimeContracts.ts:116` 的 `ProjectRuntimeScopeSummary` 是单 root summary。
- `AlembicCore/src/daemon/RuntimeContracts.ts:36` 的 dataRoot 来源只有 `project-root` 和 `ghost-registry`。
- `AlembicCore/src/daemon/RuntimeContracts.ts:69` 的 `AlembicRuntimeProjectIdentity` 只包含单一 `projectRoot`。
- `AlembicCore/src/daemon/ResidentServiceContracts.ts:93` 的 diagnostic paths 只包含一个 `projectRoot`。
- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts:215` 的 `AllPhasesOptions` 接收 `dataRoot` 但没有 folders。
- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts:317` 的 `runPhase1_FileCollection(projectRoot)` 只按单一 root detect/load/list targets。

结论：

- `AlembicCore` 必须先提供 V2 Project 合同，否则各仓库只能继续复制单 `projectRoot` 假设。
- 第一版不能直接删除旧 `projectRoot` 参数形态；需要把单 folder Project 映射到新 ProjectScope，将旧 `ProjectRegistry.inspect(projectRoot)` 解释为“按 folder 解析 ProjectScope”。

### Alembic

`Alembic` 当前是 daemon / ProjectRegistry / Dashboard server / jobs / monitor 的本地增强底座，但运行时仍按单 root 启动。

- `Alembic/lib/daemon/ProjectRuntimeControl.ts:126` 的 `listProjects()` 直接读取 `ProjectRegistry.list()`，并按 `projectRoot` 排序。
- `Alembic/lib/daemon/ProjectRuntimeControl.ts:174` 的 `selectProject()` 写入 `selectedProjectRoot` 和 `selectedProjectId` 单值。
- `Alembic/lib/daemon/ProjectRuntimeControl.ts:447` 的 `buildProjectSummary()` 用单一 `projectRoot` 创建 `WorkspaceResolver.fromProject(projectRoot)`。
- `Alembic/lib/daemon/ProjectRuntimeControl.ts:463` 到 `Alembic/lib/daemon/ProjectRuntimeControl.ts:502` 的 summary 输出单一 `displayName / projectRoot / dataRoot / databasePath / runtimeDir`。
- `Alembic/lib/daemon/ProjectRuntimeControl.ts:505` 的 `resolveTarget()` 只通过 `projectId` 或 `projectRoot` 解析，`projectId` 仍来自单 root registry entry。
- `Alembic/lib/http/routes/projects.ts:13` 到 `Alembic/lib/http/routes/projects.ts:17` 暴露 `/api/v1/projects` snapshot；当前没有 folder 绑定 API。
- `Alembic/lib/http/routes/projects.ts:38` 到 `Alembic/lib/http/routes/projects.ts:54` 的 select 只接收 projectId / projectRoot。
- `Alembic/bin/daemon-server.ts:46` 用 `ALEMBIC_PROJECT_DIR || process.cwd()` 得到单 `projectRoot`。
- `Alembic/bin/daemon-server.ts:61` 到 `Alembic/bin/daemon-server.ts:65` 会 `chdir(projectRoot)` 并配置单 root PathGuard。
- `Alembic/bin/daemon-server.ts:96` 到 `Alembic/bin/daemon-server.ts:101` 启动文件变化收集器时只传入单 `projectRoot`。
- `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts:25` 的 options 只有 `projectRoot`。
- `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts:55` 到 `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts:64` 只检查 `projectRoot/.git`。
- `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts:134` 到 `Alembic/lib/service/evolution/DaemonFileChangeCollector.ts:139` 只在单一 git worktree 里执行 diff / ls-files。
- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:87` 到 `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:90` 从 container 解析单 `projectRoot` 和 `dataRoot`。
- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:125` 到 `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:131` 调用 `ProjectIntelligenceCapability.run({ projectRoot })`。
- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:143` 到 `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts:148` 构建 snapshot 仍使用单 `projectRoot`。

结论：

- `Alembic` 应成为 ProjectScope 绑定的主要生产方：CLI / HTTP / daemon health / runtime boundary / job context 都应能输出 project + folders。
- 文件监控是后续主线，不应塞入第一波完整实现；但第一波合同必须给 monitor 留 `folders[]`、folderId 和 event source 归属。
- cold-start / rescan 是第一版自用闭环的核心消费方，需要在 ProjectScope 绑定后能扫多个 folder 并写入同一个 Project dataRoot。

### AlembicPlugin

`AlembicPlugin` 是 Codex host agent 入口，当前能通过本地 Alembic resident service 增强 search / jobs / dashboard handoff，但自己的上下文仍是单 `projectRoot`。

- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:162` 到 `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:186` 的 Codex MCP server 存储单一 `projectRoot`。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:239` 到 `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:267` 允许工具参数覆盖 `projectRoot`，并创建新的 scoped server。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:274` 到 `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:304` 的 preflight / auto init 都基于 `this.projectRoot`。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:345` 到 `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:352` 的 status 使用单 `projectRoot`。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:780` 到 `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:814` 的 bootstrap / rescan enqueue 通过 resident service，但 body 未携带 ProjectScope / folder 归属。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts:841` 的 embedded `JobStore` fallback 仍用单 `projectRoot`。
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:70` 的 options 只有 `projectRoot`。
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:124` 到 `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:216` 的 resident search 调用 `/api/v1/search`，只传 query / mode / limit / type；没有 projectId、folderId 或 serviceScopeId。
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:348` 到 `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:390` 的 probe 先按单 root 读取 daemon state，再调用 health。
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:403` 到 `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:433` 已经有 local Alembic 与 embedded plugin route 的能力边界判断，可复用为 multi-root resident capability discovery。
- `AlembicPlugin/lib/external/mcp/handlers/search.ts:80` 到 `AlembicPlugin/lib/external/mcp/handlers/search.ts:135` 搜索先尝试 resident，再 fallback 到 plugin baseline search。
- `AlembicPlugin/lib/external/mcp/handlers/search.ts:251` 只在 `auto` 和 `semantic` 模式询问 resident。
- `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts:89` 到 `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts:145` 的 prime enrichment 使用搜索结果生成 knowledge / guard。
- `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts:215` 到 `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts:219` 明确语义增强由本地 Alembic resident service 提供，不再由 Plugin 持有 embedding executor。
- `AlembicPlugin/lib/external/mcp/handlers/task.ts:192` 到 `AlembicPlugin/lib/external/mcp/handlers/task.ts:312` 的 `prime` 负责提取 intent、调用搜索 pipeline、生成 `primeKnowledgeMaterial`。
- `AlembicPlugin/lib/external/mcp/handlers/task.ts:423` 到 `AlembicPlugin/lib/external/mcp/handlers/task.ts:448` 已实现 Codex 第一人称立即呐喊指令。
- `AlembicPlugin/lib/codex/ProjectSkillDelivery.ts:52` 的 Codex project skill root 是 `projectRoot/.agents/skills`。
- `AlembicPlugin/lib/codex/ProjectSkillDelivery.ts:60` 的 `buildProjectScopeId(projectRoot)` 由单 root hash 得到。
- `AlembicPlugin/lib/codex/ProjectSkillDelivery.ts:68` 到 `AlembicPlugin/lib/codex/ProjectSkillDelivery.ts:139` 的 receipt 只记录单 root `projectRoot / codexSkillRoot / projectScopeId`。
- `AlembicPlugin/lib/codex/ProjectSkillDelivery.ts:141` 到 `AlembicPlugin/lib/codex/ProjectSkillDelivery.ts:279` 的 runtime export 只校验 receipt root 与当前 Codex project root 相同，并只导出到一个 skill root。
- `AlembicPlugin/lib/codex/ProjectRootResolver.ts:75` 到 `AlembicPlugin/lib/codex/ProjectRootResolver.ts:124` 从环境变量、显式参数、saved root 等候选中解析单 root。
- `AlembicPlugin/lib/codex/ProjectRootResolver.ts:218` 到 `AlembicPlugin/lib/codex/ProjectRootResolver.ts:260` 的 init marker 仍基于 `WorkspaceResolver.fromProject(projectRoot)`。
- `AlembicPlugin/lib/bootstrap.ts:64` 到 `AlembicPlugin/lib/bootstrap.ts:70` 配置单 root PathGuard。
- `AlembicPlugin/lib/bootstrap.ts:240` 到 `AlembicPlugin/lib/bootstrap.ts:251` 初始化单 root `WorkspaceResolver`，Ghost 时只把单 dataRoot 加入 allow path。

结论：

- Plugin 不应成为项目控制台，但必须能把当前 folder 解析到 Alembic resident 生产的 ProjectScope。
- Plugin baseline route 保留单 folder Project；只有 local Alembic resident 可用并明确报告 folder binding 时，Plugin 才使用跨 folder Project knowledge。
- Project skill export 必须从单 `codexSkillRoot` 升级到 `codexSkillRoots[]` 或等价 target 列表，但源码 `folders[]` 与 `controlRoot` 要分开。

### AlembicDashboard

`AlembicDashboard` 当前能展示 runtime / project 状态，但 contract 仍是单 root。已有 `folders` tab 是 ModuleExplorer 的临时目录扫描，不是 Project folder binding。

- `AlembicDashboard/src/types.ts:233` 到 `AlembicDashboard/src/types.ts:251` 的 `DashboardProjectRuntimeScopeSummary` 只包含单 `projectRoot / projectRealpath / dataRoot / runtimeDir`。
- `AlembicDashboard/src/types.ts:281` 到 `AlembicDashboard/src/types.ts:302` 的 `ProjectData` 只包含单 `projectRoot / projectName`。
- `AlembicDashboard/src/api.ts:316` 到 `AlembicDashboard/src/api.ts:340` normalize project scope 只读取单 `projectRoot`。
- `AlembicDashboard/src/api.ts:1450` 到 `AlembicDashboard/src/api.ts:1475` 的 project API 只支持 snapshot、current、open dashboard、switch、stop。
- `AlembicDashboard/src/components/Views/ModuleExplorerView.tsx:100` 到 `AlembicDashboard/src/components/Views/ModuleExplorerView.tsx:160` 的 folders tab 只是目录浏览和虚拟 target scan。
- `AlembicDashboard/src/App.tsx:232` 到 `AlembicDashboard/src/App.tsx:240` 使用 `localStorage` 按 `data.projectRoot` 存 custom folder targets。
- `AlembicDashboard/src/App.tsx:1090` 到 `AlembicDashboard/src/App.tsx:1112` 的 custom folder add/remove 也只是 UI localStorage，不是 Alembic ProjectRegistry。

结论：

- Dashboard 第一版只需要消费并展示 ProjectScope summary，提供最小 add folder 入口；不要复用 ModuleExplorer custom folder localStorage 作为 Project folders source of truth。
- Dashboard 的 project cache key、session cache、custom folder localStorage 后续应改为 projectId / projectScopeId，而不是单 `projectRoot`。

### AlembicAgent

`AlembicAgent` 的工具访问安全边界是单 root，这对多 folder internal AI 影响很大。

- `AlembicAgent/src/tools/v2/types.ts:85` 到 `AlembicAgent/src/tools/v2/types.ts:88` 的 `ToolContext` 只有单 `projectRoot`。
- `AlembicAgent/src/tools/v2/handlers/code.ts:83` 到 `AlembicAgent/src/tools/v2/handlers/code.ts:99` 的 search 在单 `ctx.projectRoot` 下运行。
- `AlembicAgent/src/tools/v2/handlers/code.ts:325` 到 `AlembicAgent/src/tools/v2/handlers/code.ts:328` 的 read 只允许路径在单 `ctx.projectRoot` 下面。
- `AlembicAgent/src/tools/v2/handlers/terminal.ts:73` 到 `AlembicAgent/src/tools/v2/handlers/terminal.ts:77` 的 terminal cwd 也限制在单 root。
- `AlembicAgent/src/agent/service/AgentRuntimeBuilder.ts:37` 到 `AlembicAgent/src/agent/service/AgentRuntimeBuilder.ts:63` 的 runtime shared options 是单 `projectRoot / dataRoot`。

结论：

- 第一版不应贸然把 Agent tool context 改成任意多 root；这会影响安全边界。
- 可优先让 Alembic cold-start / rescan 对每个 folder 创建单 root scan context，再汇总到 Project dataRoot。
- 后续若需要 Agent 一次工具调用跨 folder 读取代码，必须增加 `allowedFolders[] / folderId / path resolver` 等明确安全 contract。

## 实现依赖链

### 上游必须先完成

1. `AlembicCore` ProjectScope contract：
   - registry v2 schema。
   - `ProjectDescriptor`、`ProjectFolderDescriptor`、`ProjectControlRoot`。
   - folder path -> project resolution。
   - 单 folder Ghost-only resolution，不维护 standard 分叉。
   - sourceRef / evidenceRef 的 folder 级表达建议。

2. `Alembic` ProjectScope producer：
   - CLI 添加 / 列出 / 解析 folders。
   - HTTP `/projects` summary 输出 folders / controlRoot。
   - daemon health / resident service status 输出 ProjectScope。
   - cold-start / rescan 能读取 ProjectScope 并按 folders 扫描。

### 中游消费

3. `AlembicPlugin` ProjectScope consumer：
   - 用当前 Codex folder 解析 Project。
   - local Alembic 可用时消费 ProjectScope 和 resident project knowledge。
   - local Alembic 不可用时保持单 folder baseline。
   - prime / search / project skill receipt 使用 project-level id 和 dataRoot。

4. `AlembicDashboard` minimal UI：
   - 项目列表展示 folders / controlRoot。
   - 提供最小 add folder。
   - 不把 ModuleExplorer 临时目录扫描误当成 Project folder binding。

### 后续增强

5. `AlembicAgent` multi-folder safe tool context：
   - 只有当 internal AI 需要一次跨 folder 读取时再做。
   - 第一版以 per-folder scan + project-level aggregation 替代。

6. `AlembicTest`：
   - 用 AlembicWorkspace 自身作为 smoke 目标。
   - 验证多 folder 绑定、prime/search 归属、evidence folder 前缀、skill export target。

## 关键设计约束

- 不允许 Plugin 自己维护一套真实多项目 / 多 folder control plane；它只能在 local Alembic 不存在时保持单 folder baseline。
- 不允许 Dashboard 的 custom folder scan localStorage 成为 Project folders 的持久 source of truth。
- 不允许把 `AlembicWorkspace` 根目录放入源码 `folders[]`；它只能作为 `controlRoot` / `coordinationRoot` 之类特殊字段。
- 不允许把 file monitor 和 knowledge evolution 全部塞进第一版；但 ProjectScope 合同必须保证后续能扩展。
- 不允许用“统一 projectRoot 数组”替代完整数据模型；需要 folderId、role、realpath、displayName、source refs 和 include / exclude 的长期空间。

## 推荐目标模型

```ts
interface ProjectDescriptor {
  schemaVersion: 2;
  projectId: string;
  displayName: string;
  storageMode: 'ghost';
  dataRoot: string;
  primaryFolderId: string | null;
  controlRoot?: ProjectControlRoot | null;
  folders: ProjectFolderDescriptor[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectControlRoot {
  path: string;
  realpath: string;
  role: 'coordination' | 'workspace-control';
  includeInSourceScan: false;
}

interface ProjectFolderDescriptor {
  folderId: string;
  path: string;
  realpath: string;
  displayName: string;
  role: 'source' | 'core' | 'plugin' | 'dashboard' | 'agent' | 'test' | 'docs' | string;
  status: 'active' | 'missing';
  include?: string[];
  exclude?: string[];
  addedAt: string;
}
```

旧参数映射策略：

- 未注册 path：解析为单 folder Ghost-only Project。
- 旧 `projectRoot` 参数：视为当前 folder root。
- 新 Project identity：以 `projectId` 和 project-level `dataRoot` 为准。
- 新 ProjectScope 只创建 Ghost dataRoot；旧 standard 不保留兼容读取 / 迁移分支，也不得提供转回 project-root 写入的入口。
- evidenceRef：第一版可保留字符串，但应新增结构化 `sourceRefs[]` 或 metadata：`{ folderId, folderDisplayName, path, line }`，给 Codex 和 Dashboard 使用。

## 风险

- 直接修改 `projectRoot` 语义会影响大量调用方。第一版应保持旧字段，并新增 `projectScope / folders / controlRoot`，避免下游一次性破坏。
- Ghost 从“可选模式”变成唯一标准后，不要保留旧 `mode: 'standard' | 'ghost'` 的分叉语义，也不要暗示用户可以切回 project-root 写入。
- `PathGuard` 当前单 root。多 folder 写权限不能开放成任意目录；第一版只应允许写 project-level dataRoot 和 skill export 目标，代码读取仍按明确 folder 解析。
- project skill export 的 `symlink-first` 目标从一个变多个，必须保留 managed marker，避免覆盖用户自有 skill。
- cold-start 如果简单串行扫描多个 repo，耗时会明显上升；第一版要支持 CLI / job 参数限制 folders 或 maxFiles。
- 多 folder evidence 如果只写相对路径，Codex 很难判断来自哪个仓库；必须至少有 folderId / displayName 或路径前缀。

## 下一步

- 已基于本调研形成 `requirement-design-2026-05-24.md`。
- 已创建任务级目标阶段确认和 Wave 1 执行计划；第一波发送给 `AlembicCore`。
