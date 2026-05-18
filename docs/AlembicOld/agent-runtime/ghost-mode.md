# Ghost Mode — 无痕本地辅助模式

## 动机

当前 Alembic 在用户项目中会创建大量文件和目录（`Alembic/`、`.asd/`、`AGENTS.md`、IDE 配置等）。
对于不想在项目仓库中留下任何 Alembic 痕迹、仅需本地辅助的用户，需要一种 **Ghost Mode**：

> **所有 Alembic 产物存储在项目目录之外，用户项目保持完全干净。**

---

## 当前产物分析

### 项目内创建的文件

| 类别 | 路径 | 是否 Git-tracked | 可外置？ |
|------|------|:---:|:---:|
| **运行时** | `.asd/` (DB、日志、缓存、对话、向量索引) | ❌ | ✅ 完全可外置 |
| **配置** | `.asd/config.json` | ✅ | ✅ 可外置 |
| **知识库** | `Alembic/` (recipes、candidates、skills、wiki) | ✅ | ✅ 可外置 |
| **宪法** | `Alembic/constitution.yaml`、`boxspec.json` | ✅ | ✅ 随知识库 |
| **Agent 指令** | `AGENTS.md` / `CLAUDE.md` | ✅ | ⚠️ 需特殊处理 |
| **IDE 集成** | `.cursor/`、`.vscode/mcp.json`、`.github/copilot-instructions.md` | ✅ | ⚠️ 需特殊处理 |
| **Git 配置** | `.gitignore` 追加块 | ✅ | ⚠️ Ghost 模式仍保留作为安全网 |
| **环境变量** | `.env` | ❌ | ✅ 可外置 |
| **CI/CD** | `.github/workflows/alembic-guard.yml` | ✅ | ✅ Ghost 模式不部署 |

### 结论

- **完全可外置**：`.asd/`、`Alembic/`、`.env`、CI 文件
- **仍保留在项目内**：`.gitignore`（安全网 —— 防止意外产物被 git 追踪）
- **需要特殊处理**：IDE 配置（MCP server 地址需要指向外置路径）、Agent 指令文件

---

## 设计方案

### 核心思路

引入一个全局注册表 `~/.asd/projects.json`，将每个项目的所有 Alembic 数据映射到 `~/.asd/workspaces/<hash>/`：

```
~/.asd/
├── projects.json              # 项目注册表 { projectPath → workspaceId }
└── workspaces/
    └── <sha256-8>/            # 每个项目的独立工作区
        ├── config.json        # 等价于 .asd/config.json
        ├── alembic.db         # 等价于 .asd/alembic.db
        ├── logs/              # 等价于 .asd/logs/
        ├── conversations/     # 等价于 .asd/conversations/
        ├── memory.jsonl       # 等价于 .asd/memory.jsonl
        ├── context/           # 等价于 .asd/context/ (向量索引)
        ├── cache/             # 等价于 .asd/cache/
        ├── recipes/           # 等价于 Alembic/recipes/
        ├── candidates/        # 等价于 Alembic/candidates/
        ├── skills/            # 等价于 Alembic/skills/
        ├── wiki/              # 等价于 Alembic/wiki/
        ├── constitution.yaml  # 等价于 Alembic/constitution.yaml
        └── boxspec.json       # 等价于 Alembic/boxspec.json
```

### 模式选择

```
alembic setup                    # 默认：标准模式（项目内创建文件）
alembic setup --ghost            # Ghost 模式（零项目痕迹）
```

Ghost 模式也可在已有项目上切换：
```
alembic config set ghost true    # 切换到 Ghost 模式（迁移现有数据到外置目录）
alembic config set ghost false   # 切换回标准模式（迁移数据回项目内）
```

### 配置存储

`~/.asd/projects.json`：
```json
{
  "version": 1,
  "projects": {
    "/Users/dev/my-app": {
      "id": "a1b2c3d4",
      "ghost": true,
      "createdAt": "2026-04-18T00:00:00Z"
    },
    "/Users/dev/another-app": {
      "id": "e5f6g7h8",
      "ghost": false,
      "createdAt": "2026-04-15T00:00:00Z"
    }
  }
}
```

---

## 实现计划

### Phase 1：路径抽象层 — `Paths` 重构

**改动文件**：`lib/shared/Paths.ts`（或新建 `lib/shared/WorkspaceResolver.ts`）

当前 `Paths` 类的所有路径都是 `projectRoot` 的相对路径。需要让每个路径方法感知 Ghost 模式：

```typescript
class WorkspaceResolver {
  readonly projectRoot: string;
  readonly ghost: boolean;
  readonly workspaceDir: string; // ghost ? ~/.asd/workspaces/<id> : projectRoot

  /** 运行时数据根 */
  get runtimeRoot(): string {
    return this.ghost
      ? this.workspaceDir            // ~/.asd/workspaces/<id>/
      : path.join(this.projectRoot, '.asd');
  }

  /** 知识库根 */
  get knowledgeRoot(): string {
    return this.ghost
      ? this.workspaceDir            // ~/.asd/workspaces/<id>/
      : path.join(this.projectRoot, 'Alembic');
  }

  /** 数据库路径 */
  get databasePath(): string {
    return path.join(this.runtimeRoot, 'alembic.db');
  }

  /** Recipes 目录 */
  get recipesDir(): string {
    return path.join(this.knowledgeRoot, 'recipes');
  }

  // ... 其他路径方法同理
}
```

**影响范围**（需要使用 `WorkspaceResolver` 的模块）：

| 模块 | 当前路径来源 | 改动 |
|------|-------------|------|
| `DatabaseConnection` | `PathGuard.projectRoot + '.asd/alembic.db'` | → `resolver.databasePath` |
| `Logger` | `config.file.path \|\| '.asd/logs'` | → `resolver.logsDir` |
| `PathGuard` | 硬编码 `.asd/`、`Alembic/` | → `resolver.runtimeRoot`、`resolver.knowledgeRoot` |
| `KnowledgeRepository` | `Alembic/recipes/` | → `resolver.recipesDir` |
| `SetupService` | 直接创建项目内目录 | → 按模式分支 |
| `FileDeployer` | 部署 IDE 配置到项目内 | → Ghost 模式跳过或使用符号链接 |
| `SignalCollector` | `.asd/logs/signals/` | → `resolver.signalLogsDir` |
| `ConversationStore` | `.asd/conversations/` | → `resolver.conversationsDir` |
| `VectorAdapter` | `.asd/context/index/` | → `resolver.vectorIndexDir` |

### Phase 2：Setup 流程适配

**改动文件**：`lib/service/bootstrap/SetupService.ts`

```typescript
async setup(options: { ghost?: boolean }) {
  if (options.ghost) {
    // 1. 生成 workspace ID
    const id = createHash('sha256')
      .update(this.projectRoot)
      .digest('hex')
      .slice(0, 8);

    // 2. 创建外置目录
    const wsDir = path.join(os.homedir(), '.asd', 'workspaces', id);
    await fs.mkdir(wsDir, { recursive: true });

    // 3. 注册到 projects.json
    await projectRegistry.register(this.projectRoot, { id, ghost: true });

    // 4. 在外置目录中创建子目录
    for (const sub of ['recipes', 'candidates', 'skills', 'wiki', 'logs', 'context', 'conversations', 'cache']) {
      await fs.mkdir(path.join(wsDir, sub), { recursive: true });
    }

    // 5. 写入 constitution.yaml、boxspec.json 到外置目录
    // 6. 不修改项目内任何文件（不写 .gitignore、不创建 .asd/、不创建 Alembic/）
  } else {
    // 现有标准流程
  }
}
```

### Phase 3：IDE 集成适配

Ghost 模式下 IDE 配置的处理策略：

| 文件 | Ghost 策略 | 理由 |
|------|-----------|------|
| `.cursor/mcp.json` | **不写入** | 改用全局配置 `~/.cursor/mcp.json` |
| `.vscode/mcp.json` | **不写入** | 改用 User Profile 级别的 `mcp.json` |
| `.cursor/rules/*.mdc` | **不写入** | 改为通过 MCP 动态提供规则 |
| `AGENTS.md` / `CLAUDE.md` | **仍然写入** | Agent 指令文件保留在项目内，使用 marker 注入方式追加 |
| `.github/copilot-instructions.md` | **仍然写入** | 同上，使用 `<!-- alembic:begin/end -->` 标记间注入 |
| `.gitignore` | **仍然写入** | 安全网：防止 bug 或迁移中断导致 `.asd/`、`.env` 等意外产物被 git 追踪 |
| `.env` | **写入到外置目录** | `~/.asd/workspaces/<id>/.env` |

#### MCP 全局配置方案

两个 IDE 都支持全局级别的 MCP 配置，Ghost 模式利用这一点实现 **零项目文件侵入**：

| IDE | 全局配置位置 | 说明 |
|-----|------------|------|
| **Cursor** | `~/.cursor/mcp.json` | 所有项目自动生效 |
| **VS Code** | User Profile `mcp.json`（通过 `MCP: Open User Configuration` 命令打开） | 跨所有 workspace 生效 |

**配置内容**（写入一次，永久生效）：

```json
{
  "mcpServers": {
    "alembic": {
      "command": "alembic-mcp"
    }
  }
}
```

> **关键改动**：移除 `"env": { "ALEMBIC_PROJECT_DIR": "${workspaceFolder}" }`。
> `${workspaceFolder}` 在全局配置中不可用，改为由 MCP Server 运行时自动检测项目路径。

#### MCP Server 项目路径自动检测

MCP Server 启动时的项目路径解析优先级：

```typescript
function resolveProjectRoot(): string {
  // 1. 显式环境变量（兼容项目级配置）
  if (process.env.ALEMBIC_PROJECT_DIR) {
    return process.env.ALEMBIC_PROJECT_DIR;
  }

  // 2. MCP Roots 能力（IDE 通过协议告知当前工作区路径）
  //    Cursor 和 VS Code 都支持 MCP roots
  const roots = await server.listRoots();
  if (roots.length > 0) {
    return new URL(roots[0].uri).pathname;
  }

  // 3. 回退到 cwd（IDE 通常以项目根目录启动子进程）
  return process.cwd();
}
```

这样全局配置中不需要包含任何项目特定信息，一份配置适用所有项目。

#### Setup 流程

```bash
alembic setup --ghost
```

Ghost 模式的 setup 会：
1. 检测当前 IDE 类型（Cursor / VS Code）
2. 检查对应的全局 MCP 配置是否已包含 `alembic` 条目
3. 如果没有，自动写入全局配置（或输出提示让用户手动添加）
4. **不接触** `.cursor/mcp.json` 或 `.vscode/mcp.json`

### Phase 4：FileDeployer 改造

**改动文件**：`lib/cli/deploy/FileDeployer.ts`、`lib/cli/deploy/FileManifest.ts`

在 `FileManifest` 中为每个文件增加 `ghostPolicy` 字段：

```typescript
interface FileEntry {
  path: string;
  strategy: DeployStrategy;
  ghostPolicy: 'deploy' | 'skip' | 'external';
  // ...
}
```

- `deploy`：Ghost 模式下仍部署到项目（仅 MCP 配置）
- `skip`：Ghost 模式下完全跳过
- `external`：Ghost 模式下部署到外置目录

### Phase 5：MCP Server 启动适配

**改动文件**：`bin/mcp-server.ts`、`lib/external/mcp/McpServer.ts`

MCP Server 启动时需要能从 `projects.json` 查找项目的工作区：

```typescript
// 启动流程
const projectRoot = resolveProjectRoot();
const registry = await ProjectRegistry.load();
const project = registry.get(projectRoot);

if (project?.ghost) {
  // 设置 WorkspaceResolver 指向外置目录
  const resolver = new WorkspaceResolver(projectRoot, {
    ghost: true,
    workspaceDir: path.join(os.homedir(), '.asd', 'workspaces', project.id),
  });
  container.bind(WorkspaceResolver, resolver);
} else {
  // 标准模式
  const resolver = new WorkspaceResolver(projectRoot, { ghost: false });
  container.bind(WorkspaceResolver, resolver);
}
```

### Phase 6：迁移工具

支持在标准模式和 Ghost 模式之间切换：

```typescript
// lib/service/ghost/GhostMigrator.ts

class GhostMigrator {
  /** 标准 → Ghost：将项目内数据迁移到外置目录 */
  async toGhost(projectRoot: string): Promise<void> {
    // 1. 创建外置 workspace
    // 2. 移动 .asd/* → ~/.asd/workspaces/<id>/
    // 3. 移动 Alembic/* → ~/.asd/workspaces/<id>/
    // 4. 删除项目内的 .asd/、Alembic/
    // 5. 还原 .gitignore（移除 Alembic 块）
    // 6. 删除 AGENTS.md / CLAUDE.md（如果是 Alembic 生成的）
    // 7. 更新 projects.json
  }

  /** Ghost → 标准：将外置数据迁移回项目 */
  async fromGhost(projectRoot: string): Promise<void> {
    // 反向操作
  }
}
```

---

## CLI 接口设计

```bash
# 新项目使用 Ghost 模式
alembic setup --ghost

# 查看当前模式
alembic config get ghost
# → ghost: true (workspace: ~/.asd/workspaces/a1b2c3d4)

# 切换模式
alembic ghost on          # 标准 → Ghost（迁移数据）
alembic ghost off         # Ghost → 标准（迁移数据回项目）

# 查看外置数据位置
alembic ghost status
# → Mode: ghost
# → Workspace: ~/.asd/workspaces/a1b2c3d4
# → Recipes: 12 files
# → Database: 2.3 MB
# → Logs: 156 KB

# 清理某个项目的外置数据
alembic ghost clean       # 确认后删除 ~/.asd/workspaces/<id>/
```

---

## 实现优先级

| 阶段 | 内容 | 工作量 | 依赖 |
|------|------|:------:|------|
| **P1** | `WorkspaceResolver` + `ProjectRegistry` | 中 | 无 |
| **P2** | `SetupService` Ghost 分支 | 中 | P1 |
| **P3** | 所有路径消费方适配 | 大 | P1 |
| **P4** | `FileDeployer` ghostPolicy | 小 | P1 |
| **P5** | MCP/API Server 启动适配 | 小 | P1 |
| **P6** | 迁移工具 `GhostMigrator` | 中 | P1-P5 |
| **P7** | CLI 命令 (`alembic ghost`) | 小 | P6 |

---

## 边界情况

### 1. 多个项目路径指向同一仓库
用 `realpath` 规范化后取 hash，避免重复注册。

### 2. 项目目录被移动
`projects.json` 中的路径失效。解决：
- MCP 启动时检测，如果 `projectRoot` 不在注册表中但 `.asd/` 存在，提示用户
- `alembic ghost repair` 更新注册表

### 3. 向量索引的路径引用
向量索引中存储的文件路径仍然使用项目相对路径，不受 Ghost 模式影响。

### 4. Git Submodule 知识库
标准模式下 `Alembic/recipes/` 可以是 Git submodule。Ghost 模式下外置目录也可以独立 git init，保留版本历史。

### 5. 团队共享
Ghost 模式是 **纯个人** 的。团队如果需要共享知识库，应使用标准模式或远程同步方案。

---

## 安全考量

- 外置目录权限：`~/.asd/workspaces/` 应设置 `0700`，防止其他用户读取
- `projects.json` 不应包含敏感信息（不存储 API key，key 在各 workspace 的 `.env` 中）
- 清理操作需要二次确认，防止误删知识库
