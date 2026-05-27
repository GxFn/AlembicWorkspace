# Alembic VS Code Extension 实施方案

本文档说明如何把已经验证过的 `alembic-codex` 插件体验迁移到 VS Code 扩展，并让 GitHub Copilot Agent Mode、VS Code MCP、Open VSX 兼容 IDE 都能以更自然的方式使用 Alembic。

## 目标判断

Alembic 的 VS Code 扩展不应该只是提示用户运行 `npm install -g alembic-ai` 的薄壳。更理想的体验是：

```text
用户安装 Alembic VS Code Extension
→ 扩展检查/安装私有 Alembic runtime
→ 扩展以 Ghost mode 初始化当前 workspace
→ 扩展注册 Alembic MCP server
→ Copilot Agent Mode 发现 Alembic tools
→ 用户直接 prime/search/guard/bootstrap/rescan
```

因此，npm 包仍然是 runtime 交付单元，但用户默认不再直接管理全局 npm 包、终端服务和 MCP 配置。

## 改造前基础

仓库里已经有 `resources/vscode-ext`。本轮改造前的能力包括：

- VS Code commands：search/create/audit/status。
- 状态栏、Guard diagnostics、remote command poller。
- `vscode.lm.registerTool` 形式的 `alembic` Language Model Tool。
- 依赖外部 HTTP API server，README 仍要求用户手动 `npm install -g alembic-ai` 和 `alembic ui`。

这说明 VS Code 扩展不是从零开始。真正要补的是“插件 runtime 管理层”和“正式 MCP provider”。

## 目标架构

```text
VS Code Extension
  ├─ RuntimeManager
  │   ├─ 检测 Node/npm 与 Alembic runtime
  │   ├─ 安装/升级 pinned alembic-ai 到 globalStorage
  │   ├─ 初始化 Ghost workspace
  │   └─ 管理 daemon/MCP 子进程健康
  ├─ McpServerProvider
  │   └─ 注册 alembic-mcp 给 VS Code / Copilot Agent Mode
  ├─ WorkspaceController
  │   ├─ bootstrap/rescan/status/dashboard commands
  │   └─ workspace folder 切换与 project root 解析
  ├─ Guard/Diagnostics/FileChangeCollector
  │   └─ 复用现有 resources/vscode-ext 能力
  └─ Optional UI
      ├─ 状态栏
      ├─ output channel
      └─ command palette / settings

Alembic runtime
  ├─ alembic-mcp
  ├─ daemon
  ├─ ContextIndex / SQLite / Ghost data root
  ├─ Recipe / SourceRef / RecipeEdge
  └─ dashboard
```

## 与 Codex 插件的对应关系

| Codex 插件能力 | VS Code 扩展对应实现 |
| --- | --- |
| `alembic_codex_status` | `Alembic: Show Status` command + status bar |
| `alembic_codex_init` | `Alembic: Initialize Workspace`，默认 Ghost mode |
| `alembic_codex_bootstrap` | `Alembic: Bootstrap Project` command，后台 job |
| `alembic_codex_job` | `Alembic: Show Jobs` / dashboard link |
| Codex MCP tools | VS Code MCP provider 注册 `alembic-mcp` |
| Codex skill instructions | VS Code extension README + Agent Plugin/指令文件 |
| Ghost data root | extension globalStorage + Alembic WorkspaceResolver |
| 权限边界 | VS Code trust prompt + Alembic confirmation dialogs |

## Runtime 安装策略

推荐三层策略，避免让用户手动全局安装：

1. **MVP：managed npm install**
   - 扩展首次激活时检查 `context.globalStorageUri/alembic-runtime/<version>`。
   - 如果不存在，弹窗请求允许安装 pinned 版本：`alembic-ai@x.y.z`。
   - 使用用户本机 `npm` 安装到扩展私有目录，不写全局 npm。
   - 安装完成后从私有目录启动 `alembic-mcp` 和 daemon。

2. **稳定版：bundled runtime tarball**
   - release 时执行 `npm pack` 生成 `alembic-ai-x.y.z.tgz`。
   - VSIX 内携带 tarball，首次激活时解包/安装到 globalStorage。
   - 仍需处理 native dependency，例如 `better-sqlite3` 的平台兼容。

3. **企业版：platform-specific runtime**
   - 按 `darwin-arm64`、`darwin-x64`、`linux-x64`、`win32-x64` 发布扩展变体或扩展包。
   - 尽量减少首次激活网络访问。

兜底策略：

- 如果私有 runtime 安装失败，但用户机器上有全局 `alembic` 或 `alembic-mcp`，允许用户显式选择使用全局 runtime。
- 全局 runtime 只作为 fallback，不作为默认路径。

## Ghost 初始化

VS Code 扩展默认应该使用 Ghost mode，避免对用户项目产生侵入：

```text
projectRoot = 当前 workspace folder
dataRoot = Alembic WorkspaceResolver 解析出的外置数据区
project writes = 默认不写，除非用户选择导出 MCP 配置或 agent 指令文件
```

实现建议：

- 在 `SetupService` 中增加 `vscode-plugin` profile，行为接近当前 `codex-plugin`：
  - 默认 `ghost=true`。
  - 不自动写 `.vscode/mcp.json`。
  - 不自动写 `.cursor` / `AGENTS.md` / `CLAUDE.md`。
  - 注册项目到 Ghost registry。
- 也可以先复用 `codex-plugin` profile，但长期应改名或抽象为 `agent-plugin`，避免把 Codex 作为通用插件模式的语义来源。

## MCP 集成

VS Code 当前支持扩展通过 MCP server definition provider 注册 MCP server。Alembic 扩展应走这个路线，而不是默认写 `.vscode/mcp.json`。

`resources/vscode-ext/package.json` 增加：

```json
{
  "contributes": {
    "mcpServerDefinitionProviders": [
      {
        "id": "alembic",
        "label": "Alembic"
      }
    ]
  }
}
```

扩展激活时注册 provider：

```ts
vscode.lm.registerMcpServerDefinitionProvider('alembic', {
  onDidChangeMcpServerDefinitions,
  provideMcpServerDefinitions() {
    return [
      new vscode.McpStdioServerDefinition('Alembic', runtime.command, runtime.args, {
        env: {
          ALEMBIC_PROJECT_DIR: projectRoot,
          ALEMBIC_MCP_MODE: '1',
          ALEMBIC_EXTENSION_HOST: 'vscode'
        }
      })
    ];
  },
  async resolveMcpServerDefinition(definition) {
    await runtime.ensureReady(projectRoot);
    return definition;
  }
});
```

要点：

- MCP provider 是主通道，Copilot Agent Mode 会通过它发现 Alembic tools。
- 旧的 `vscode.lm.registerTool` 代理已移除，避免和正式 MCP provider 形成两套 Agent 通道。
- `.vscode/mcp.json` 只作为手动导出功能，服务于其他 MCP client 或团队共享配置。

## Extension commands

第一版建议补齐这些命令：

- `Alembic: Initialize Workspace`
- `Alembic: Show Status`
- `Alembic: Bootstrap Project`
- `Alembic: Rescan Project`
- `Alembic: Restart MCP Server`
- `Alembic: Open Dashboard`
- `Alembic: Export MCP Config`
- `Alembic: Use Global Runtime`
- `Alembic: Clear Managed Runtime`

这些命令都应该通过 RuntimeManager 调用同一套 Alembic runtime，而不是各自拼 shell 命令。

## 推荐代码落点

在现有 `resources/vscode-ext/src` 下新增：

```text
runtime/
  AlembicRuntimeManager.ts
  ManagedRuntimeInstaller.ts
  RuntimePaths.ts
  RuntimeProcess.ts
mcp/
  AlembicMcpProvider.ts
workspace/
  AlembicWorkspace.ts
  GhostInitializer.ts
commands/
  initialize.ts
  bootstrap.ts
  rescan.ts
  dashboard.ts
  runtime.ts
```

现有文件迁移建议：

- `extension.ts` 只保留 activation wiring，不继续堆业务逻辑。
- `taskTool.ts` 降级为 compatibility shim，内部优先提示使用 MCP tools。
- `apiClient.ts` 继续服务 dashboard/HTTP API，但不再是 Agent 主通道。
- `projectScope.ts` 继续复用 Ghost registry 检测。
- `FileChangeCollector` 继续作为 IDE-side signal collector。

## 发布路径

第一阶段：内部 VSIX

```bash
npm run install:vscode-ext
npm run build:vscode-ext
npm run package:vscode-ext
```

第二阶段：VS Code Marketplace

- 注册 publisher。
- 使用 `@vscode/vsce` 打包发布。
- marketplace README 必须明确：
  - 默认 Ghost mode。
  - 会安装/管理私有 Alembic runtime。
  - 会注册本地 MCP server。
  - 不会默认上传代码或 secrets。

第三阶段：Open VSX

- 使用 `ovsx` 发布同一个 VSIX。
- 覆盖 Cursor、Windsurf、Kiro、Antigravity、VSCodium 等 VS Code-compatible IDE。

## 测试计划

必须覆盖：

- 无 Alembic runtime：首次安装成功，globalStorage 出现 runtime。
- 已有 runtime：不重复安装。
- Ghost 初始化：registry 写入正确，项目目录不出现 `.asd`。
- MCP provider：VS Code 能列出 Alembic server definition。
- MCP 启动：stdio server 能响应 `initialize` 和 `tools/list`。
- Copilot Agent Mode：工具可见，`prime/search/guard` 至少一个 happy path 可用。
- workspace 切换：不同 workspace 使用不同 `ALEMBIC_PROJECT_DIR`。
- remote/devcontainer：runtime 安装在 extension host 所在环境。
- 卸载/清理：不删除用户数据，只提供显式 cleanup command。

## 安全与权限

默认原则：

- 不写项目文件，除非用户显式执行导出。
- 不读取 secrets，除非某个 MCP tool 明确需要并经过用户确认。
- 不自动联网安装 runtime，除非首次弹窗授权或用户配置允许。
- daemon/MCP 日志写入 Alembic data root 或 VS Code globalStorage。
- 所有 destructive 操作必须走 Alembic 原有权限边界。

## 当前实现状态

本轮已经在 `resources/vscode-ext` 内实现插件侧骨架：

- `runtime/AlembicRuntimeManager.ts`：统一管理 Ghost 初始化、runtime 解析、managed runtime 安装/清理。
- `runtime/ManagedRuntimeInstaller.ts`：将 pinned `alembic-ai` 安装到 VS Code `globalStorage` 下，不写全局 npm。
- `workspace/GhostInitializer.ts`：按 Alembic `~/.asd/projects.json` 格式注册当前 workspace 为 Ghost 项目，并创建外置 data root。
- `mcp/AlembicMcpProvider.ts`：通过 VS Code MCP server definition provider 暴露 Alembic MCP server。
- `commands/runtime.ts`：新增初始化、安装 runtime、刷新 MCP、打开 dashboard、导出 MCP 配置等命令。
- `package.json`：新增 MCP provider contribution、runtime/MCP 配置项和命令面板入口。
- 已移除旧的 `vscode.lm.registerTool` 代理、CodeLens 指令入口和远程指令轮询入口；MCP provider 是新的 Agent 主通道。
- `auto` runtime 模式不再静默回退到全局命令；全局 runtime 必须由用户显式选择或配置。
- 文件变更采集器改成动态作用域判断：扩展激活后再执行 Ghost 初始化，也能在不重载窗口的情况下开始工作。
- 状态查看改成只读检查，不会因为用户点状态栏就写入 Ghost registry。
- 主工程已新增通用插件 profile：`agent-plugin` / `vscode-plugin`，`codex-plugin` 作为 Codex 兼容别名保留。
- `alembic setup --profile=vscode-plugin --ghost --json` 已可供扩展调用，默认不部署 `.vscode`、`.cursor`、指令文件等项目物料。
- `alembic daemon ensure|bootstrap|rescan|job --json` 已作为 extension-host 友好的稳定 CLI 面提供。
- VS Code 扩展的 Initialize/Bootstrap/Rescan/Open Dashboard 命令已改为直接调用 managed/dev/global Alembic CLI，不再通过 Copilot Chat prompt 间接触发。
- 根工程已新增 VS Code Marketplace / Open VSX 相关 release/publish 脚本入口。

## 后续优化

这些改动会让 VS Code 插件体验更完整，但仍建议分后续版本处理：

- 等 managed runtime 覆盖稳定后，移除 VS Code 扩展内的 `GhostInitializer` fallback，完全交给主工程 setup profile。
- 为 `alembic daemon job` 增加 richer progress 输出，例如当前 filling 维度、percent、候选数量。
- 增加 VSIX smoke test：安装扩展、触发 MCP definition、投递 daemon bootstrap job。
- Open VSX 发布前补齐 icon、screenshots、publisher token 文档和 README badges。

## 分阶段实施

### Phase 1：插件化 runtime MVP

- 新增 RuntimeManager。
- 私有安装 pinned `alembic-ai`。
- Ghost 初始化当前 workspace。
- 状态栏显示 runtime / MCP / daemon health。

### Phase 2：MCP provider

- `package.json` 增加 `mcpServerDefinitionProviders`。
- 实现 `AlembicMcpProvider`。
- Copilot Agent Mode 可见 Alembic tools。
- `.vscode/mcp.json` 改为可选导出。

### Phase 3：Codex 插件体验对齐

- 对齐 `status/init/bootstrap/job/dashboard`。
- VS Code commands 调用同一套 daemon job store。
- Output Channel 显示可恢复 job id 和 dashboard URL。

### Phase 4：Marketplace 投放

- 更新 README、icon、categories、screenshots。
- 发布 VS Code Marketplace。
- 发布 Open VSX。
- 增加 GitHub release VSIX。

### Phase 5：Agent plugin 扩展

- 评估 VS Code Agent Plugins preview。
- 将 Alembic skills、slash commands、MCP server bundle 成 agent plugin。
- 与 Cursor/Claude Code 插件形态共享同一份 Agent Integration Contract。

## 外部依据

- VS Code MCP developer guide：扩展可以通过 `mcpServerDefinitionProviders` 和 `vscode.lm.registerMcpServerDefinitionProvider` 注册 MCP server。  
  https://code.visualstudio.com/docs/copilot/guides/mcp-developer-guide
- VS Code MCP servers：Copilot Agent Mode 可安装、管理和调用 MCP server tools。  
  https://code.visualstudio.com/docs/copilot/customization/mcp-servers
- VS Code Agent Plugins preview：插件可以打包 commands、skills、agents、hooks 和 MCP servers。  
  https://code.visualstudio.com/docs/copilot/customization/agent-plugins
- VS Code extension publishing：通过 `@vscode/vsce` 打包和发布 Marketplace 扩展。  
  https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Open VSX publishing：通过 `ovsx` 发布 VS Code-compatible 扩展。  
  https://github.com/eclipse/openvsx/wiki/Publishing-Extensions

## 结论

Alembic 已经有 Codex 插件和 VS Code companion extension 的基础。下一步不是再做一个独立 CLI，而是把现有 `resources/vscode-ext` 升级为真正的 Agent/IDE host adapter：扩展负责安装和管理 Alembic runtime，MCP 负责给 Copilot/Agent 暴露工具，Ghost mode 负责无侵入数据隔离，npm 包继续作为底层 runtime 复用。
