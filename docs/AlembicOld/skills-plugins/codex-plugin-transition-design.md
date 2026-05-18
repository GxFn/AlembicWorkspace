# Alembic Codex 插件化转向设计

日期：2026-05-08

本文档基于当前 Alembic 仓库的实际代码结构，分析将 Alembic 转向 Codex 插件版本时应保留、收束和新增的能力边界。重点不是把 Alembic 重写成一个插件，而是在保留现有扫描、知识治理、内部 Agent、外部 Agent、Dashboard 和 MCP 能力的基础上，提供接近“市场点击安装即可使用”的 Codex 插件体验。

## 结论先行

Alembic 适合采用“薄 Codex 插件 + Alembic Core + 按需 daemon”的三层形态。

```text
Codex Marketplace Plugin
  ├─ plugin.json / marketplace metadata
  ├─ Codex Skills: 触发词、任务协议、权限边界
  └─ alembic-codex-mcp: 轻量 stdio 入口

Alembic Daemon
  ├─ HTTP API / Dashboard / Realtime
  ├─ Job 管理: bootstrap、rescan、internal agent fill
  ├─ DB / vector / search / guard / panorama cache
  └─ local-only health、ready、tool-call bridge

Alembic Core
  ├─ ProjectIntelligence: 文件、AST、依赖、Guard、Panorama
  ├─ External Agent workflow: Mission Briefing → Codex 补全
  ├─ Internal Agent workflow: 服务端 AgentRuntime 异步填充
  ├─ Knowledge / Recipe / Governance / Evolution
  └─ WorkspaceResolver / Ghost Mode / PathGuard
```

关键判断：

1. 不需要新代码库作为第一步，插件适配层应先放在 Alembic monorepo 内。
2. 现有内部 Agent 与外部 Agent 双路径是合理的，不应为插件化砍掉其中任何一条。
3. 当前 `alembic-mcp` 可以支撑 MVP，但它启动时会直接初始化 Bootstrap、DB 和 DI，长期不适合作为市场插件的最终入口。
4. 插件最终应暴露一个新的轻量入口 `alembic-codex-mcp`，由它按需启动或连接 Alembic daemon。
5. 后台服务不应在插件安装或 Codex 打开仓库时启动，而应在 Alembic 能力被调用时分级唤醒。
6. 需要新增 `setup --codex` 或 `alembic codex init`，默认走 Ghost 且跳过 Cursor/VS Code 项目文件部署。

## 当前实现证据

| 主题 | 当前代码证据 | 对插件化的含义 |
| --- | --- | --- |
| npm 运行时入口 | `package.json` 暴露 `alembic` 和 `alembic-mcp` | 插件包无需复制 Core，可通过 npm 运行 Alembic runtime |
| MCP stdio 入口 | `bin/mcp-server.ts` 设置 `ALEMBIC_MCP_MODE=1` 后启动 `startMcpServer()` | 已有 IDE Agent 接入面，可以复用工具定义和 handler |
| MCP 初始化要求 | `lib/external/mcp/McpServer.ts` 要求 `ALEMBIC_PROJECT_DIR`，随后 `process.chdir(projectRoot)` 并初始化 Bootstrap | 多根 workspace 安全，但启动较重，插件最终需要轻量 shim |
| MCP 工具集 | `lib/external/mcp/tools.ts` 定义 agent/admin tier、Gateway 映射和 17 个工具 | Codex 插件默认应只暴露 agent tier，admin 后置 |
| API / Dashboard 服务 | `bin/api-server.ts` 与 `bin/cli.ts ui` 启动 `HttpServer` | 适合作为 daemon 基础，但目前缺少 daemon 状态文件和动态端口管理 |
| UI 启动任务 | `lib/service/bootstrap/UiStartupTasks.ts` 在 UI 启动后做 sync、staging、vector、index、proposal、signal subscription | daemon 启动时需要保留这类后台刷新，但不应阻塞首次响应 |
| Realtime | `lib/http/HttpServer.ts` 初始化 Socket.io RealtimeService 并桥接 EventBus | Dashboard 和内部 Agent 进度需要长生命周期服务承载 |
| 外部冷启动 | `lib/workflows/cold-start/external/ExternalColdStartWorkflow.ts` 返回 Mission Briefing，不启动内部 AI pipeline | Codex 外部 Agent 最适合接这条路径 |
| 内部冷启动 | `lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts` Phase 1-4 后 dispatch 内部维度填充 | 需要 daemon 保持进程存活，不能绑在 MCP stdio 生命周期上 |
| 外部 rescan | `lib/workflows/knowledge-rescan/external/ExternalKnowledgeRescanWorkflow.ts` 返回 allRecipes、evidencePlan 和 evolution guide | Codex 可以按维度执行 evolve → submit → complete |
| 内部 rescan | `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts` 结合 SourceRef、ImpactPlanner、EvolutionAgentRun 和内部填充 | 是后台长任务，适合 daemon job |
| Ghost Mode | `lib/shared/ProjectRegistry.ts` 和 `lib/shared/WorkspaceResolver.ts` 已支持项目注册与外置 dataRoot | 是市场一键体验的基础 |
| setup 流程 | `lib/cli/SetupService.ts` 默认会创建 runtime、知识库、IDE 集成、DB 和 vector index | 需要增加 Codex profile，否则插件安装体验仍太重 |
| IDE 交付 | `lib/cli/deploy/FileManifest.ts` 管理 Cursor/VS Code/AGENTS/gitignore 等部署 | Codex 插件模式应跳过大部分传统 IDE 交付 |
| Injectable Skills | `injectable-skills/alembic-*` 已覆盖 recipes、create、guard、structure、devdocs | 可迁移为 Codex 插件 skills 的第一版素材 |
| AutoApprove | `lib/external/mcp/autoApproveInjector.ts` 只面向 Cursor MCP 配置 | Codex 插件不应复用 Cursor autoApprove 机制 |
| VS Code 扩展 | `resources/vscode-ext/src/extension.ts` 依赖 API server 状态栏、Guard、Remote Poller | 插件版不是 VS Code 扩展替代品，Dashboard/API 仍需 daemon |
| 单进程项目绑定 | `ServiceContainer.initialize()` 禁止同一进程切换不同 projectRoot | daemon 必须 per workspace，不可一个 daemon 服务多个项目 |

## 目标用户体验

目标体验不是“用户安装后立刻启动服务、扫描项目”，而是：

```text
1. 用户在 Codex 插件市场点击安装 Alembic
2. Codex 获得 Alembic 插件卡片、starter prompts、skills 和 MCP server
3. 用户在某个项目中首次提出 Alembic 相关请求
4. alembic-codex-mcp 做 workspace inspection
5. 若未初始化，引导或自动执行 codex ghost init
6. 真正需要 search/prime/guard/bootstrap/dashboard 时才启动 daemon
7. daemon 持续承载 DB、Dashboard、内部 Agent、长任务和 Realtime
8. Codex 通过 MCP 工具使用 Alembic，用户不需要手动开终端
```

插件安装本身只提供入口，不产生项目副作用。扫描和长任务必须由用户明确触发。

## 场景矩阵

| 场景 | 触发 | 服务启动策略 | 期望结果 |
| --- | --- | --- | --- |
| S0 市场安装 | 用户点击安装插件 | 不启动 daemon，不扫描 | Codex 可发现 Alembic skills 和 MCP server |
| S1 打开项目 | Codex 工作区加载 | 可启动轻量 `alembic-codex-mcp`，但不启动 daemon | 插件处于待命状态 |
| S2 首次询问状态 | “Alembic 状态如何” | 不强制 daemon，先读取 ProjectRegistry / WorkspaceResolver | 返回是否已初始化、是否 ghost、daemon 是否运行 |
| S3 未初始化时搜索 | 用户问“项目规范怎么写” | 先返回需要初始化或执行 `alembic codex init` | 不偷偷扫描；用户确认后初始化 |
| S4 已初始化日常开发 | Codex 实现功能 | `prime/search` 前 `ensureDaemon(reason=prime)` | 返回 Recipe / Guard 规则 / sourceRefs |
| S5 写完代码审查 | Codex 调用 `alembic_guard` | `ensureDaemon(reason=guard)`，无参数可查 git diff | 返回违规和修复建议 |
| S6 外部冷启动 | 用户说“帮我冷启动” | 启动 daemon，执行 `alembic_bootstrap` external path | 返回 Mission Briefing，Codex 按维度补全 |
| S7 内部冷启动 | 用户选择“自动分析”或 Dashboard 点击 | daemon 创建 long-running job | 内部 Agent 异步填充，Dashboard 看进度 |
| S8 增量重扫 | 用户说“重扫最近变化” | daemon 创建 rescan job | Codex 或内部 Agent 执行 evolve/gap-fill |
| S9 打开 Dashboard | 用户要求审核 candidates | `ensureDaemon(reason=dashboard)`，返回 dashboard URL | 不默认打开浏览器，Codex 展示 URL |
| S10 多项目并行 | 两个 Codex workspace 使用 Alembic | 每个 projectRoot 独立 daemon/state/port | 避免 ServiceContainer 单进程切项目问题 |
| S11 daemon 崩溃 | MCP 调用发现 pid 假活 | health 校验失败后重启 daemon | job 若无持久化则提示恢复状态 |
| S12 离线 / npx 不可用 | 插件无法下载 runtime | 返回明确安装诊断 | 引导 `npm install -g alembic-ai` 或使用 bundled runtime |
| S13 管理员操作 | 用户要 publish/deprecate | 默认 agent tier 不暴露 admin | 需要显式 Admin 模式或 Dashboard |
| S14 卸载插件 | 用户移除插件 | 不删除 Alembic dataRoot | 可提供 `alembic codex cleanup` 清理 |

## 后台服务启动时机

### 原则

后台 daemon 与插件安装解耦，与能力调用绑定。

```text
插件安装        -> 不启动
Codex 加载项目   -> 不启动重服务
本地状态检查     -> 不启动或只读 registry
prime/search    -> 按需启动 daemon
guard           -> 按需启动 daemon
bootstrap/rescan -> 启动 daemon + job
dashboard       -> 启动 daemon + 返回 URL
idle            -> 无任务、无 dashboard 连接后延迟停止
```

### ensureDaemon 协议

建议新增 `DaemonSupervisor.ensure()`：

```ts
interface EnsureDaemonInput {
  projectRoot: string;
  reason:
    | 'status'
    | 'prime'
    | 'search'
    | 'guard'
    | 'bootstrap'
    | 'rescan'
    | 'dashboard'
    | 'admin';
  waitUntilReadyMs?: number;
  startIfMissing?: boolean;
}

interface EnsureDaemonResult {
  status: 'not-needed' | 'ready' | 'starting' | 'failed';
  projectRoot: string;
  dataRoot: string;
  projectId: string | null;
  pid?: number;
  port?: number;
  url?: string;
  dashboardUrl?: string;
  reason: string;
  message?: string;
}
```

默认 `waitUntilReadyMs` 可以设为 3000。若 3 秒内 ready，MCP 工具继续执行；若仍在启动，返回 `starting` 和下一步提示，避免让 Codex 卡死。

### 状态文件

状态文件应放在 `WorkspaceResolver.runtimeDir` 下，Ghost 模式自然外置：

```text
<dataRoot>/.asd/
  daemon.json
  daemon.pid
  daemon.lock/
  daemon.log
  jobs/
    <job-id>.json
```

`daemon.json` 建议包含：

```json
{
  "schemaVersion": 1,
  "projectRoot": "/abs/project",
  "dataRoot": "/abs/data-root",
  "projectId": "a1b2c3d4",
  "pid": 12345,
  "host": "127.0.0.1",
  "port": 39127,
  "version": "0.0.9",
  "startedAt": "2026-05-08T10:00:00.000Z",
  "lastReadyAt": "2026-05-08T10:00:01.000Z"
}
```

不要只信 PID。Supervisor 必须请求 health endpoint，并校验：

- `projectRoot`
- `dataRoot`
- `projectId`
- `version`
- DB schema version
- daemon mode

### 端口策略

当前 `alembic ui` 默认固定 3000，插件模式应避免端口冲突。建议：

1. daemon 使用 `PORT=0` 或先探测可用端口。
2. HttpServer 启动后通过 `server.address()` 获取实际端口。
3. 写入 `daemon.json`。
4. Dashboard URL 永远从 `daemon.json` 读取。

现有 `alembic ui -p 3000` 可以保留给 CLI 用户。Codex 插件应走 daemon 动态端口。

## MCP 入口设计

### 为什么不直接长期使用现有 `alembic-mcp`

现有 `alembic-mcp` 的优点是成熟且工具完整。问题是它在启动时立即：

1. 要求 `ALEMBIC_PROJECT_DIR`
2. 切换 cwd 到项目根
3. 初始化 Bootstrap
4. 连接数据库并迁移
5. 初始化 ServiceContainer、Gateway、Search、Guard、Signal 等服务

这对 Cursor/VS Code 项目级 MCP 是可以接受的，但对市场插件的“一键安装、按需使用”体验太重。Codex 可能在插件启用时就启动 MCP server，因此重初始化会让“打开项目”变成“启动 Alembic 服务”。

### 推荐新增 `alembic-codex-mcp`

`alembic-codex-mcp` 是轻量 stdio MCP server：

```text
alembic-codex-mcp
  ├─ 导入 `TOOLS` 获取 schema，但不初始化 Bootstrap
  ├─ 注册少量 Codex-local tools
  ├─ 对 Alembic core tools 执行 ensureDaemon()
  ├─ 调用 daemon 的 local HTTP tool bridge
  └─ 返回统一 ToolResultEnvelope
```

建议新增本地 Codex tools：

| 工具 | 是否需要 daemon | 作用 |
| --- | --- | --- |
| `alembic_codex_status` | 否 | 检查插件、runtime、workspace、daemon 状态 |
| `alembic_codex_init` | 否，执行 setup 时会初始化 DB | Codex 专用 Ghost 初始化 |
| `alembic_codex_dashboard` | 是 | 确保 daemon 后返回 Dashboard URL |
| `alembic_codex_stop` | 是 | 停止当前项目 daemon |

现有 Alembic tools 保持原名：

```text
alembic_health
alembic_task
alembic_search
alembic_guard
alembic_bootstrap
alembic_rescan
...
```

这样 Codex Skills 不需要学习一套新 API。

### daemon tool bridge

daemon 需要新增一个本地 HTTP bridge。建议路径：

```text
POST /api/v1/mcp/call
```

请求：

```json
{
  "name": "alembic_task",
  "args": {
    "operation": "prime",
    "userQuery": "实现用户注册接口",
    "activeFile": "src/routes/user.ts"
  },
  "actor": {
    "role": "external_agent",
    "surface": "codex"
  }
}
```

响应复用 `ToolResultEnvelope`。实现可以复用当前 `McpToolAdapter` 和 `LightweightRouter`，避免为 Codex 写第二套 handler。

安全约束：

- 仅监听 `127.0.0.1`
- 请求必须带本地 session token，token 存在 `daemon.json` 或单独 `daemon.token`
- token 文件权限 `0600`
- bridge 不暴露到非本机地址
- 默认 tier 为 `agent`

## Codex 专用 setup 设计

当前 `SetupService` 对传统 IDE 非常友好，但对市场插件偏重。Codex 模式需要新增 profile。

### CLI 入口

建议支持两种等价入口：

```bash
alembic setup --codex --ghost
alembic codex init
```

`alembic codex init` 是产品化入口，内部调用 SetupService。

### SetupService 扩展

建议增加：

```ts
interface SetupOptions {
  projectRoot: string;
  force?: boolean;
  seed?: boolean;
  ghost?: boolean;
  profile?: 'full-ide' | 'codex-plugin' | 'headless';
}
```

行为差异：

| 步骤 | full-ide 当前行为 | codex-plugin 建议行为 |
| --- | --- | --- |
| runtime/config | 创建 | 创建，默认 Ghost |
| knowledge base | 创建 | 创建，默认 Ghost |
| `.env` | 当前写项目根 | Ghost 下写 dataRoot，Codex profile 不写项目根 |
| Cursor/VS Code MCP | 部署 | 跳过 |
| Cursor rules/skills | 部署 | 跳过 |
| AGENTS/Copilot instructions | 部署 | 默认跳过，可选开启 |
| `.gitignore` | 部署 | 默认跳过，因为无项目内产物 |
| DB init | 创建并迁移 | 创建并迁移 |
| vector init | best effort | best effort，但不可阻塞 |

也就是说，`codex-plugin` profile 应把项目副作用降到零。用户要把 Alembic 知识随 git 走时，再显式切换到标准模式或运行 `alembic remote`。

## 插件包结构

建议仓库内新增：

```text
plugins/alembic-codex/
  .codex-plugin/plugin.json
  .mcp.json
  skills/
    alembic/
      SKILL.md
    alembic-recipes/
      SKILL.md
    alembic-create/
      SKILL.md
    alembic-guard/
      SKILL.md
    alembic-structure/
      SKILL.md
    alembic-devdocs/
      SKILL.md
  assets/
    icon.png
    logo.png
```

`plugin.json` 参考：

```json
{
  "name": "alembic-codex",
  "version": "0.1.0",
  "description": "Use Alembic project memory, Recipes, Guard, and bootstrap workflows from Codex.",
  "author": {
    "name": "gaoxuefeng",
    "url": "https://github.com/GxFn/Alembic"
  },
  "homepage": "https://github.com/GxFn/Alembic",
  "repository": "https://github.com/GxFn/Alembic",
  "license": "MIT",
  "keywords": ["coding", "mcp", "project-memory", "guard", "recipes"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "interface": {
    "displayName": "Alembic",
    "shortDescription": "Project memory, Recipes, and Guard checks for Codex",
    "longDescription": "Alembic distills source code into local project knowledge, exposes it through MCP, and helps Codex write code that follows the project's real conventions.",
    "developerName": "gaoxuefeng",
    "category": "Coding",
    "capabilities": ["Interactive", "Read", "Write"],
    "websiteURL": "https://github.com/GxFn/Alembic",
    "defaultPrompt": [
      "Initialize Alembic for this project",
      "Prime Codex with this project's Alembic Recipes",
      "Check my current changes with Alembic Guard"
    ],
    "brandColor": "#2563EB",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png",
    "screenshots": []
  }
}
```

`.mcp.json` 第一阶段可以直连 runtime：

```json
{
  "mcpServers": {
    "alembic": {
      "command": "npx",
      "args": ["-y", "alembic-ai@0.0.9", "alembic-codex-mcp"],
      "env": {
        "ALEMBIC_MCP_TIER": "agent"
      }
    }
  }
}
```

正式发布建议 pin 版本，不使用 `latest`。

## Skills 设计

现有 `injectable-skills/alembic-*` 可以迁入插件，但建议新增一个总入口 `alembic/SKILL.md`，让 Codex 先学会何时初始化、何时 prime、何时 guard、何时交给内部 Agent。

### 总入口 Skill 职责

`skills/alembic/SKILL.md` 应包含：

1. 每次用户请求项目规范、实现代码、审查 diff 时，优先 `alembic_codex_status`。
2. 未初始化时，提示或执行 `alembic_codex_init`。
3. 非 trivial coding task 开始前调用 `alembic_task(operation=prime)`。
4. 写完代码后调用 `alembic_guard`。
5. 发现新模式时使用 `alembic_submit_knowledge` 提交 candidate，不直接写 Recipe。
6. 冷启动或 rescan 按 Mission Briefing 执行维度任务。
7. Dashboard 审批交给用户，不由 Codex 默认 publish。

### 子 Skill 映射

| Skill | 来源 | Codex 插件中的用途 |
| --- | --- | --- |
| `alembic-recipes` | `injectable-skills/alembic-recipes` | 项目规范、Recipe 查询、Recipe 优先级 |
| `alembic-create` | `injectable-skills/alembic-create` | 提交 candidate、V3 字段和质量约束 |
| `alembic-guard` | `injectable-skills/alembic-guard` | diff/file/code 审查 |
| `alembic-structure` | `injectable-skills/alembic-structure` | targets、files、graph、impact |
| `alembic-devdocs` | `injectable-skills/alembic-devdocs` | wiki plan/finalize |

需要修正的点：

- `alembic-recipes` 中路径说明仍偏 `Alembic/.asd`，应改为 `WorkspaceResolver` 视角，兼容 Ghost。
- `alembic-devdocs` 写 `Alembic/wiki/`，应补充 Ghost dataRoot 场景。
- `alembic-guard` 示例 files 参数与当前 schema/handler 需要统一，当前 handler 接受 `{ path, content? }` 数组。

## 内部 Agent 与外部 Agent 的保留方式

插件化后双路径更需要清晰命名。

### 外部 Agent 路径

Codex 是外部 Agent。适合：

- 根据用户当前需求写代码。
- `prime/search/knowledge/structure` 查询项目知识。
- `guard` 检查当前 diff。
- `submit_knowledge` 提交候选。
- `bootstrap/rescan` 后按 Mission Briefing 补维度。
- 生成 wiki 文章内容，再调用 finalize。

流程：

```text
Codex user request
  -> alembic_task prime
  -> read/write code
  -> alembic_guard
  -> optional submit_knowledge
  -> close task
```

外部冷启动：

```text
alembic_bootstrap
  -> Mission Briefing
  -> Codex reads dimension package
  -> alembic_submit_knowledge
  -> alembic_dimension_complete
  -> alembic_wiki plan/finalize
```

### 内部 Agent 路径

Alembic 内部 Agent 适合 daemon 执行：

- 自动冷启动填充。
- 自动 rescan gap-fill。
- evolution audit。
- 大批量候选生成。
- 长时间后台任务。
- Dashboard 进度可视化。

流程：

```text
Codex or Dashboard starts internal job
  -> daemon creates jobId
  -> ProjectIntelligence Phase 1-4
  -> InternalDimensionExecutionWorkflow
  -> BootstrapTaskManager / JobStore
  -> Realtime progress
  -> candidates / skills / reports
```

Codex 不应尝试复制内部 Agent Runtime。它只负责触发、解释、补外部维度和向用户呈现结果。

## 权限与安全

### 默认权限

Codex 插件默认：

- `ALEMBIC_MCP_TIER=agent`
- actor role 使用 `external_agent`
- 允许 read/search/prime/guard/submit candidate
- 不默认暴露 `alembic_knowledge_lifecycle`
- 不默认 expose admin tools

管理能力放在：

1. Dashboard。
2. 显式 `alembic-codex-admin` profile。
3. 后续单独 Admin 插件。

### 写入边界

Codex 插件应遵守：

- 不直接写 `recipes/`。
- 不直接 publish/deprecate。
- 不修改 `.cursor/mcp.json` 或 `.vscode/mcp.json`。
- Ghost 模式下不写用户项目文件，除非用户显式要求。
- 所有 dataRoot 写入走 `WorkspaceResolver` 和 `WriteZone`。

### 审批体验

Cursor 的 autoApprove 机制不应迁移到 Codex。Codex 有自己的工具审批和 sandbox 体验，Alembic 插件只需要：

- 工具说明清楚表达副作用。
- `submit_knowledge` 标注 candidate 写入。
- `bootstrap/rescan/internal job` 标注会扫描项目。
- `dashboard` 标注会启动本地服务。

## Daemon API 建议

新增本地 daemon 相关端点：

| Method | Path | 作用 |
| --- | --- | --- |
| GET | `/api/v1/daemon/health` | 返回 projectRoot/dataRoot/projectId/version/schema/jobs |
| GET | `/api/v1/daemon/ready` | 就绪检查 |
| POST | `/api/v1/mcp/call` | MCP tool bridge |
| POST | `/api/v1/jobs/bootstrap` | 启动内部 bootstrap job |
| POST | `/api/v1/jobs/rescan` | 启动内部 rescan job |
| GET | `/api/v1/jobs/:id` | 查询 job 状态 |
| POST | `/api/v1/jobs/:id/cancel` | 取消 job |
| POST | `/api/v1/daemon/shutdown` | 本地 token 保护的停止 |

现有 `health` 路由可以保留，但 daemon health 需要比普通 API health 更严格。

## Job 持久化

当前 `BootstrapTaskManager` 是内存会话管理。daemon 生命周期比 MCP 长，但仍可能崩溃或被用户重启。建议新增轻量 `JobStore`：

```text
<dataRoot>/.asd/jobs/
  job_<id>.json
```

最小字段：

```ts
interface AlembicJobRecord {
  id: string;
  type: 'bootstrap-internal' | 'rescan-internal' | 'bootstrap-external' | 'rescan-external';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  projectRoot: string;
  dataRoot: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  sessionId?: string;
  progress?: number;
  summary?: unknown;
  error?: string;
}
```

第一版可先记录 job metadata，不必持久化每个维度细节。Dashboard 实时进度仍通过 Realtime，Codex 恢复时通过 job summary 接上。

## 实现路线

### P0：设计与一致性修正

目标：不改产品行为，先消除插件化已知阻塞。

- 新增本文档。
- 统一文档和代码里的 `ALEMBIC_PROJECT_DIR`，避免旧 `ALEMBIC_PROJECT_ROOT` 误导。
- 盘点 `docs-dev` 与 package `directories.doc` 的关系，决定是否保留 `docs-dev` 作为开发资料。
- 为 `WorkspaceResolver.toFacts()` 增加 CLI 可读输出，供 Codex status 使用。

验收：

```bash
npm run typecheck
npx vitest run test/unit/WorkspaceResolver.test.ts
```

### P1：插件 scaffold MVP

目标：本地可安装 Codex 插件，但先复用现有 `alembic-mcp`。

- 新增 `plugins/alembic-codex/`。
- 写 `.codex-plugin/plugin.json`。
- 写 `.mcp.json`，第一版可指向 `alembic-mcp` 或 `npx alembic-ai@<version> alembic-mcp`。
- 从 `injectable-skills/` 复制或生成 Codex skills。
- 新增总入口 `skills/alembic/SKILL.md`。
- marketplace entry 可后置。

验收：

```bash
npm run build
npm run mcp
```

手工验收：

- Codex 能发现插件 skills。
- Codex 能调用 `alembic_health`。
- 未设置 `ALEMBIC_PROJECT_DIR` 时错误信息清楚。

### P2：Codex 初始化 profile

目标：市场插件首次使用可零项目侵入初始化。

- `SetupService` 增加 `profile: 'codex-plugin'`。
- CLI 增加 `alembic codex init`。
- Codex profile 默认 `ghost=true`。
- Codex profile 跳过 FileDeployer 或仅部署用户显式允许的文件。
- `.env` 在 Ghost 模式写 dataRoot，不写项目根。
- 新增 `alembic codex status --json`。

验收：

```bash
alembic codex init --dir /tmp/example --json
alembic codex status --dir /tmp/example --json
```

测试：

- Ghost dataRoot 创建。
- 项目目录不出现 `.asd/`、`Alembic/`、`.cursor/`、`.vscode/mcp.json`、`.env`。
- DB 可初始化。

### P3：DaemonSupervisor

目标：把后台服务启动时机收束成稳定 API。

- 新增 `lib/daemon/DaemonSupervisor.ts`。
- 新增 `lib/daemon/DaemonState.ts`。
- CLI 增加：
  - `alembic daemon start`
  - `alembic daemon status`
  - `alembic daemon stop`
- 支持动态端口。
- 写入 `daemon.json`、`daemon.pid`、`daemon.lock/`。
- health 校验 projectRoot/dataRoot/version/schema。
- idle shutdown 策略先可配置，默认不自动停。

验收：

```bash
alembic daemon start --dir /tmp/example --no-open
alembic daemon status --dir /tmp/example --json
alembic daemon stop --dir /tmp/example
```

测试：

- 并发 ensure 只启动一个 daemon。
- pid 存在但 health 失败时能恢复。
- 端口冲突时自动换端口。

### P4：轻量 Codex MCP shim

目标：插件不再直接重初始化 Alembic Core。

- 新增 `bin/codex-mcp.ts`，package bin 暴露 `alembic-codex-mcp`。
- shim 导入 `TOOLS` 和 Codex local tools。
- shim 对 core tools 调 `DaemonSupervisor.ensure()`。
- daemon 新增 `/api/v1/mcp/call`。
- shim 通过 local token 调 daemon bridge。
- `.mcp.json` 改为 `alembic-codex-mcp`。

验收：

- Codex MCP 启动不连接 DB。
- 首次 `alembic_codex_status` 不启动 daemon。
- 首次 `alembic_search` 启动 daemon 并返回结果。
- Codex/MCP 进程重启不影响 daemon。

### P5：长任务和 Dashboard 体验

目标：bootstrap/rescan/internal agent 与 Dashboard 完整接入 daemon。

- 新增 JobStore。
- `alembic_codex_dashboard` 返回 dashboard URL。
- internal bootstrap/rescan 走 daemon job。
- external bootstrap/rescan 保持 MCP tool 返回 Mission Briefing。
- Dashboard job 页面读取 JobStore。
- Realtime 继续展示 BootstrapTaskManager 细节。

验收：

- Codex 触发 internal job 后断开，daemon 继续执行。
- Codex 恢复后能通过 job id 查询状态。
- Dashboard 能显示 candidates 和进度。

当前实现记录（2026-05-08）：

- 已新增 daemon JobStore 与 `/api/v1/jobs/*` 路由，支持 bootstrap/rescan 入队、查询和取消。
- Dashboard 已新增 `jobs` 页面，可查看任务列表、筛选状态、启动 bootstrap/rescan、取消运行中任务，并跳转 candidates。
- `/api/v1/jobs` 响应会基于 `BootstrapTaskManager.getSessionStatus()` 和 job 的 `finalSession` 装饰 `progress` / `summary`，用于 Codex 恢复和 Dashboard 轮询展示。
- `BootstrapProgressView` 的取消路径已联动 JobStore job cancel，避免 Dashboard 只取消 session 但 job 仍显示 running。
- 剩余验证重点：真实 Codex 插件安装后的 job 恢复体验，以及长时间内部 Agent 任务的跨进程重启语义。

### P6：市场发布硬化

目标：从本地可用走向点击安装。

- pin runtime 版本。
- 加 runtime 诊断：Node >=22、npm/npx、package version、daemon version。
- 明确离线 fallback。
- assets、screenshots、default prompts 完整。
- Admin 模式拆分或二级开关。
- 插件卸载不清理用户数据，另提供 cleanup 命令。

当前实现记录（2026-05-08）：

- `.mcp.json` 已使用 `npx -y --package alembic-ai@<package.version> alembic-codex-mcp` 形式 pin runtime，避免多 bin package 的 npx 歧义。
- `alembic_codex_diagnostics` 已输出 Node/npm/npx、package pin、plugin manifest/assets/skills、daemon version、offline fallback、cleanup policy，并包含结构化 `issues` 与 `nextActions`。
- 默认 Codex 插件环境保持 `ALEMBIC_MCP_TIER=agent` 且 `ALEMBIC_CODEX_ENABLE_ADMIN=0`；admin tier 需要第二个显式 opt-in。
- 已新增 `alembic_codex_cleanup` dry-run-first 清理入口；插件卸载不自动删除知识库、Recipes、candidates 或项目数据。
- 已新增 `npm run verify:codex-plugin`，发布前检查插件 MCP pin、binary、默认权限、assets、skills、default prompts 和 README fallback；`prepublishOnly` 已串联该检查。
- `alembic_codex_job` 在 daemon 已运行时会读取 `/api/v1/jobs` 的实时进度快照；daemon 未运行时仍回退本地 JobStore，且不会启动 daemon。
- 已新增 `alembic codex diagnostics --json`，把 MCP 的 Node/npm/npx、plugin metadata、runtime pin、daemon version 与 nextActions 诊断暴露给终端，方便市场安装后和发布后排障。

## 风险清单

| 风险 | 现状 | 缓解 |
| --- | --- | --- |
| MCP 启动过重 | 当前 `alembic-mcp` 直接 Bootstrap | P4 新增轻量 `alembic-codex-mcp` |
| 插件安装产生项目副作用 | 当前 setup 会部署 IDE 文件 | P2 新增 Codex profile，默认 Ghost 且跳过部署 |
| daemon 重复启动 | 当前无 daemon state/lock | P3 atomic lock + health 校验 |
| 端口冲突 | 当前 `ui` 默认 3000 | daemon 动态端口写 state |
| 长任务随 MCP 断开丢失 | 内部 Agent 依赖进程存活 | daemon 承载，JobStore 记录 |
| 多项目串线 | ServiceContainer 禁止同进程切项目 | per workspace daemon |
| admin 权限误暴露 | MCP 有 admin tier | 插件默认 agent tier，admin 后置 |
| npx 在线依赖 | 市场安装后首次运行可能无网 | 诊断 + global install fallback + 后续评估 bundled runtime |
| Ghost 路径说明不一致 | 部分 skill 仍写项目内路径 | Codex skills 改成 resolver/dataRoot 叙述 |
| Cursor autoApprove 误用 | 现有机制写 `.cursor/mcp.json` | Codex 插件不使用 autoApproveInjector |

## MVP 与理想态差异

MVP 可以接受：

- 插件目录在 monorepo 内。
- `.mcp.json` 暂时使用现有 `alembic-mcp`。
- 用户首次需要 `alembic setup --ghost` 或 `alembic codex init`。
- Dashboard 仍通过 `alembic ui --api-only` 或手动命令启动。

理想态必须具备：

- 插件安装不启动服务。
- Codex MCP 启动不初始化 DB。
- 首次能力调用按需启动 daemon。
- 初始化默认零项目侵入。
- 长任务由 daemon 和 JobStore 承载。
- Dashboard URL 来自 daemon state。

## 推荐下一步

建议从 P1 和 P2 同时开始：

1. 新增 `plugins/alembic-codex/`，先做可安装插件骨架。
2. 新增 `alembic codex init/status`，让首次使用体验可控。
3. 暂时复用 `alembic-mcp` 做验证，不急着改 daemon。
4. 当本地插件跑通后，再实现 P3/P4，把启动时机和后台服务体验打磨成真正的市场安装体验。

这样可以避免一上来重构启动系统，同时不会把未来架构锁死在当前较重的 MCP 入口上。
