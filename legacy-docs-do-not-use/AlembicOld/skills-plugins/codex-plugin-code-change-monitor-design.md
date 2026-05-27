# Codex 插件代码变更监控实现方案

日期：2026-05-13

本文定义 Alembic Codex 插件路径下的代码变更监控方案。结论先行：**Codex 插件内统一走 Alembic daemon 自有监控链路；VSCode extension 继续走 VSCode `FileChangeCollector` 链路；两条链路按入口边界分离，不设计运行时降级、替换或互相接管逻辑。**

## 背景

Alembic 已经有两类文件变更输入：

- VSCode extension：`resources/vscode-ext/src/FileChangeCollector.ts`，基于 IDE 事件、Git HEAD diff、working tree diff，向 `/api/v1/file-changes` 上报。
- daemon fallback：`lib/service/evolution/DaemonFileChangeCollector.ts`，在 daemon 内定时采样 Git worktree，把新增变更交给 `FileChangeDispatcher`。

此前 daemon fallback 的职责是“VSCode heartbeat 不新鲜时兜底”。新的插件策略不再按这个心跳做动态切换。原因是 Codex 插件路径和 VSCode extension 路径本来就是两个产品入口：

- 用户通过 Codex 插件使用 Alembic 时，代码变更监控由 daemon 承担。
- 用户通过 VSCode extension 使用 Alembic 时，代码变更监控由 extension 承担。

插件路径不再试图判断 VSCode extension 是否存在，也不在运行时把自己降级为“只在 extension 不可用时才工作”。

## 目标

1. Codex 插件路径拥有稳定、实时、可诊断的代码变更监控能力。
2. 监控必须绑定可信 `projectRoot`；没有准确项目目录时 fail closed。
3. 监控能力放在 daemon 内，而不是 MCP stdio 进程、Codex hook 或安装阶段。
4. 变更事件统一进入既有 `FileChangeDispatcher`，不绕开现有 Recipe/evolution/incremental pipeline。
5. 避免 watcher 丢事件导致知识状态长期失真，使用 Git reconciler 做确定性校验。
6. 不引入 Watchman/raw `fs.watch`/VSCode heartbeat 等后端选择矩阵。

## 非目标

- 不为 Codex 插件实现 VSCode extension API 等价层。
- 不依赖 Codex hooks 捕获文件变更；hooks 只适合 session/tool 生命周期，不是文件系统事件源。
- 不依赖 MCP resources subscription；那是 server 向 client 暴露资源更新，不是 client 向 server 推送本地文件变化。
- 不做 Watchman 可选后端。
- 不做 raw `fs.watch` 全仓递归监听。
- 不在插件安装阶段启动 watcher 或写项目文件。
- 不在 `alembic_codex_status` 这类只读诊断调用中隐式启动长驻监控。

## 入口边界

### Codex 插件路径

Codex 插件路径的时序是：

```text
Codex MCP tool call
  -> CodexMcpServer 解析/确认 trusted projectRoot
  -> 按需启动 Alembic daemon
  -> daemon 初始化 Bootstrap + ServiceContainer
  -> daemon 启动 CodeChangeMonitor
  -> CodeChangeMonitor 采集事件
  -> FileChangeDispatcher 分发
```

硬约束：

- `projectRoot` 必须来自可信解析结果。
- `projectRoot` 不得是 Codex plugin cache、Alembic runtime package、home、tmp root、文件系统根。
- `projectRoot` 变更时不能在同一个 daemon 进程内热切换；必须重启 daemon。
- daemon 未成功初始化前不启动 monitor。

### VSCode extension 路径

VSCode extension 路径继续保持：

```text
VSCode workspace events / Git diff signals
  -> resources/vscode-ext/src/FileChangeCollector.ts
  -> HTTP POST /api/v1/file-changes
  -> FileChangeDispatcher
```

Codex 插件 monitor 不读取 VSCode heartbeat，也不以 heartbeat 作为启停依据。VSCode extension 的实时弹窗、IDE 状态栏、编辑器上下文仍然属于 extension 自己的 UX surface。

## 固定监控栈

Codex 插件 daemon monitor 固定由两部分组成：

1. `ChokidarProjectWatcher`：实时文件系统事件源。
2. `GitWorktreeReconciler`：周期性 Git 状态校验源。

这两个组件是同一套插件 monitor 的组成部分，不是互相降级关系。

### ChokidarProjectWatcher

职责：

- 监听 `projectRoot` 下的文件创建、修改、删除。
- 将 chokidar 事件归一化为 Alembic `FileChangeEvent`。
- 对 atomic write、chunked write、短时间重复保存做 debounce/coalesce。
- 对不可监听、权限错误、文件句柄耗尽等问题进入 unhealthy 状态并上报 diagnostics。

初始配置建议：

```typescript
chokidar.watch(projectRoot, {
  cwd: projectRoot,
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 750,
    pollInterval: 100,
  },
  atomic: true,
  ignored: shouldIgnoreProjectPath,
});
```

事件映射：

| chokidar event | Alembic event |
| --- | --- |
| `add` | `created` |
| `change` | `modified` |
| `unlink` | `deleted` |
| `addDir` | 忽略 |
| `unlinkDir` | 忽略或转为目录级 dirty marker |

chokidar 本身不可靠区分 rename。rename 可由 Git reconciler 的 `git diff --name-status` 识别。

### GitWorktreeReconciler

职责：

- 周期性读取 Git worktree 快照。
- 捕捉 chokidar 可能遗漏的 rename、staged change、批量 checkout、分支切换、外部工具写入。
- 校验 watcher 事件是否造成实际 Git dirty 状态。
- 将 Git name-status 结果归一化为 `created`、`modified`、`deleted`、`renamed`。

扫描命令：

```text
git diff --name-status
git diff --name-status --cached
git ls-files --others --exclude-standard
git rev-parse HEAD
```

建议间隔：

- 正常：60s。
- watcher 事件风暴后：延迟 5s 执行一次 reconciliation。
- HEAD 变化后：延迟 2s 执行一次 reconciliation。

首轮行为：

- monitor 启动后先捕获 baseline，不分发历史 dirty 文件。
- 后续只分发相对 baseline 新出现或状态变化的事件。

### EventBuffer

daemon monitor 需要复用/迁移 VSCode extension 中成熟的事件缓冲思想，但实现放到 core/service 层，供插件 daemon 使用。

能力：

- 3s flush debounce。
- per-path `modified` 冷却，建议 30s。
- `created + modified` 合并为 `created`。
- `created + deleted` 在同一 flush 窗口内抵消。
- `deleted + created` 可由 Git reconciler 补正为 `modified` 或 `renamed`。
- 最大批次限制，建议 500。
- 超过阈值时不逐文件同步处理，写入 dirty marker 并触发后续 incremental rescan。

## 忽略规则

第一版固定忽略：

- `.git/`
- `.asd/`
- `node_modules/`
- `dist/`
- `coverage/`
- `.next/`
- `.nuxt/`
- `.turbo/`
- `.vite/`
- `build/`
- `DerivedData/`
- `target/`
- `vendor/`
- lock/cache/temp/log 文件目录

规则来源：

- 内置默认忽略。
- 后续可读取项目配置，但配置变更只影响下一轮 monitor reload，不在事件处理中动态改 matcher。

安全要求：

- 忽略判断必须基于相对 `projectRoot` 的 normalized POSIX path。
- 任何解析后逃逸 `projectRoot` 的路径直接丢弃并记录 warning。

## 状态与诊断

`alembic_codex_status` 和 diagnostics 需要展示 monitor 状态，但不隐式启动 monitor。

建议状态结构：

```json
{
  "codeChangeMonitor": {
    "surface": "codex-plugin",
    "mode": "daemon-chokidar-git",
    "enabled": true,
    "active": true,
    "healthy": true,
    "projectRoot": "/path/to/project",
    "watcher": {
      "backend": "chokidar",
      "ready": true,
      "watchedDirectoryCount": 123,
      "lastEventAt": "2026-05-13T10:00:00Z"
    },
    "reconciler": {
      "backend": "git",
      "lastScanAt": "2026-05-13T10:00:15Z",
      "lastHead": "abc123",
      "dirtyPathCount": 4
    },
    "lastDispatch": {
      "at": "2026-05-13T10:00:16Z",
      "eventCount": 3,
      "source": "git-worktree"
    },
    "errors": []
  }
}
```

错误必须可操作：

- `PROJECT_ROOT_UNRESOLVED`：没有可信项目目录，无法启动。
- `PROJECT_ROOT_UNTRUSTED`：目录指向插件缓存、runtime 或不安全根。
- `WATCHER_START_FAILED`：chokidar 启动失败。
- `WATCHER_RESOURCE_LIMIT`：文件句柄或系统 watcher 限制。
- `GIT_UNAVAILABLE`：不是 Git 仓库或 git 不可用。
- `RECONCILE_FAILED`：Git 校验失败。

`GIT_UNAVAILABLE` 的策略需要明确：插件 monitor 可以继续监听文件系统事件，但 diagnostics 必须标记 `reconciler.healthy=false`。如果后续业务要求 Git 为强依赖，可在实现阶段收紧为启动失败。

## 生命周期

### 启动

monitor 只在 daemon ready 路径启动：

1. `Bootstrap.initialize()` 完成。
2. `ServiceContainer.initialize()` 完成。
3. `FileChangeDispatcher` 可用。
4. `projectRoot` 通过 trust guard。
5. 启动 `CodeChangeMonitor.start()`。
6. baseline 完成后写入 daemon state/status。

### 停止

daemon shutdown 时必须：

- flush EventBuffer。
- close chokidar watcher。
- clear timers。
- 停止正在进行的 Git scan 或等待当前 scan 结束。
- 写清理日志。

### 重启

以下情况需要重启 monitor：

- daemon 重启。
- projectRoot 变化。
- ignore config 变化。
- watcher unhealthy 且用户显式请求 repair/restart。

不做自动无限重启。连续失败后进入 unhealthy，需要 diagnostics 明确原因。

## 与现有代码的关系

### 保留

- `resources/vscode-ext/src/FileChangeCollector.ts`：VSCode extension 专用。
- `lib/http/routes/file-changes.ts`：继续接收 extension HTTP 事件。
- `lib/service/FileChangeDispatcher.ts`：统一业务分发入口。
- `lib/types/reactive-evolution.ts`：复用 `FileChangeEvent` 类型。

### 替换/升级

- `lib/service/evolution/DaemonFileChangeCollector.ts`
  - 从“VSCode heartbeat fallback polling”升级为“Codex plugin daemon monitor”。
  - 移除 heartbeat gating 设计。
  - 拆出 watcher/reconciler/buffer/status 子组件。

- `lib/service/evolution/FileChangeSourceTracker.ts`
  - 不再作为插件 monitor 启停依据。
  - 如果 VSCode HTTP heartbeat 仍有 UI 诊断价值，可保留为 extension diagnostics；不参与 Codex plugin monitor 决策。

- `bin/daemon-server.ts`
  - 启动时通过明确 surface/mode 决定是否启动 plugin monitor。
  - Codex plugin daemon 默认启动。
  - 非 Codex plugin daemon 不默认启用该 monitor，避免侵入 VSCode extension 路径。

### 新增建议文件

```text
lib/service/evolution/code-change-monitor/
  CodeChangeMonitor.ts
  ChokidarProjectWatcher.ts
  GitWorktreeReconciler.ts
  FileChangeEventBuffer.ts
  ProjectWatchIgnore.ts
  CodeChangeMonitorStatus.ts
```

测试：

```text
test/unit/CodeChangeMonitor.test.ts
test/unit/ChokidarProjectWatcher.test.ts
test/unit/GitWorktreeReconciler.test.ts
test/unit/FileChangeEventBuffer.test.ts
test/integration/codex-plugin-code-change-monitor.test.ts
```

## 实现阶段

### Phase 1：类型和状态模型

- 定义 `CodeChangeMonitorStatus`。
- 定义 `CodeChangeMonitorOptions`。
- 定义 `ProjectWatchIgnore`。
- 将 status 接入 Codex diagnostics/status，但初始为 disabled/unavailable。

验收：

- 未初始化项目 status 不启动 monitor。
- 缺少 projectRoot 时返回结构化错误。
- status 中能看到 monitor surface/mode/reason。

### Phase 2：EventBuffer 抽取

- 从 VSCode extension 的 EventBuffer 行为抽象到 daemon service 层。
- 单元测试覆盖 created/modified/deleted/renamed 合并规则。
- 批量事件超过阈值时产出 dirty marker。

验收：

- 高频保存同一文件不会重复 dispatch。
- create-delete 同窗口抵消。
- 批量变更不会阻塞 daemon。

### Phase 3：GitWorktreeReconciler

- 基于现有 `DaemonFileChangeCollector` 的 git snapshot 逻辑重建。
- 支持 rename 解析。
- 支持 HEAD 变化触发 reconciliation。
- 首轮只 baseline，不 dispatch 历史 dirty。

验收：

- modified、created、deleted、renamed 都能正确产出。
- staged 和 unstaged 都能识别。
- untracked 新文件能识别。
- 非 Git 仓库 diagnostics 明确。

### Phase 4：ChokidarProjectWatcher

- 新增 `chokidar` 依赖。
- 监听项目根目录。
- 使用固定 ignore matcher。
- 将 add/change/unlink 事件推入 EventBuffer。
- watcher ready/error/close 状态写入 status。

验收：

- 新建、修改、删除文件在 debounce 后进入 dispatcher。
- 忽略目录不会产生事件。
- watcher 启动失败时 status unhealthy，不静默降级。

### Phase 5：CodeChangeMonitor 组合

- 组合 watcher、reconciler、buffer。
- daemon ready 后启动。
- shutdown 时完整释放。
- status/diagnostics 展示最后事件、最后扫描、错误列表。

验收：

- Codex plugin 初始化项目后，daemon 自动启动 monitor。
- 修改项目文件后，dispatcher 收到事件。
- 批量变更后不会造成事件风暴。
- daemon 关闭后没有残留 timer/watcher。

### Phase 6：移除插件路径的 heartbeat fallback 语义

- 删除或隔离 `hasRecentVscodeExtension()` 对 daemon monitor 的启停影响。
- HTTP `/file-changes/heartbeat` 可以保留给 VSCode extension diagnostics，但不影响 Codex plugin monitor。
- 更新测试命名，避免继续叫 fallback collector。

验收：

- Codex plugin monitor 不因 VSCode heartbeat 停止。
- VSCode extension 路径仍能通过 HTTP 事件工作。
- 两条路径的测试分别覆盖，不互相依赖。

## 验证策略

单元测试：

- ignore matcher。
- event buffer 合并规则。
- Git name-status parser。
- status error mapping。

集成测试：

- 临时 Git repo 中启动 monitor。
- 修改 tracked 文件。
- 新增 untracked 文件。
- rename 文件。
- 删除文件。
- staged change。
- HEAD 切换。

本地手动验证：

```text
npm run build
npx vitest run test/unit/CodeChangeMonitor.test.ts
npm run dev:codex-plugin:watch -- --project-root <真实测试项目>
```

注意：按照仓库约定，不在 Alembic 核心仓库内执行用户项目命令测试。需要用独立测试项目验证插件运行时。

## 关键决策记录

1. **插件 monitor 放 daemon，不放 MCP stdio。**
   MCP stdio 进程生命周期不适合承载长期 watcher；daemon 已经是 Alembic 长驻能力边界。

2. **固定 `chokidar + git reconciler`，不做后端矩阵。**
   chokidar 负责实时性，Git reconciler 负责正确性。Watchman/raw fs.watch 不进入第一版设计。

3. **不再使用 VSCode heartbeat 做插件 monitor gating。**
   heartbeat 是历史 fallback 设计。新边界下，插件和 VSCode extension 是两个入口，不互相接管。

4. **没有 trusted projectRoot 就不启动。**
   项目目录是一切状态、数据库、watcher 和增量扫描的基石；缺失时必须向上抛给 agent/用户。

5. **事件采集不直接做重分析。**
   monitor 只产生 `FileChangeEvent`，业务仍由 `FileChangeDispatcher` 与后续 pipeline 决定。

## 调研依据

- OpenAI Codex plugin 文档：插件可打包 skills、MCP servers、apps、hooks 等 surface，但没有提供宿主级文件变更事件流。
- Codex hooks 文档：hooks 面向 session/tool 生命周期，不是文件系统 watcher。
- MCP roots/resources spec：roots 表示可访问目录边界，resources subscription 是 server-to-client 资源通知，不是本地文件变更输入。
- VSCode API 文档：VSCode extension 才有 `createFileSystemWatcher`、workspace file events 等 IDE 事件能力。
- Node `fs.watch` 文档：跨平台行为不完全一致，不适合作为全仓固定方案。
- chokidar 文档：对 raw `fs.watch` 事件做归一化，支持 recursive watch、atomic writes、awaitWriteFinish、ignore matcher。
