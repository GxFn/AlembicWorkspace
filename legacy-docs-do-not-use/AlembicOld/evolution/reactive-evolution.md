# Reactive Evolution — 文件变更监测与 Recipe 进化

> 设计目标：统一的文件变更感知层，与业务逻辑完全解耦。

## 背景

原有 `SourceRefReconciler` + `DecayDetector` 是 **被动全量扫描** 模型——在 `alembic sync` / UI 启动 / rescan 时遍历所有 Recipe 的 sourceRef。延迟在小时~天级。

本方案分两层：
1. **FileChangeCollector**（扩展侧）— 统一采集所有文件变更信号，与业务无关
2. **ReactiveEvolutionService**（服务端）— 消费文件变更事件，驱动 Recipe 进化

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│  VSCode Extension                                           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              FileChangeCollector                      │  │
│  │                                                       │  │
│  │  信号源（Signals）           EventBuffer              │  │
│  │  ┌──────────────────┐       ┌───────────────────┐     │  │
│  │  │ onDidRenameFiles │──┐    │                   │     │  │
│  │  │ onDidDeleteFiles │──┤    │  去重 + 合并       │     │  │
│  │  │ onDidCreateFiles │──┼──▶ │  节流（3s flush）  │──▶ HTTP POST  │
│  │  │ WorkingTreeDiff  │──┤    │  增量过滤          │     │  │
│  │  │ GitHeadDiff      │──┘    │                   │     │  │
│  │  └──────────────────┘       └───────────────────┘     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                  POST /api/v1/file-changes
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  API Server                                                 │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐    │
│  │  FileChangeRoute │──▶│  FileChangeDispatcher        │    │
│  │  (路由层)        │    │                              │    │
│  └─────────────────┘    │  subscriber 1: ReactiveEvol  │    │
│                          │  subscriber 2: (future)      │    │
│                          └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**关键决策**：扩展只负责"发生了什么文件变更"，不知道 Recipe / Evolution 的存在。业务路由在服务端 Dispatcher 完成。

---

## 第一层：FileChangeCollector（扩展侧）

### 统一事件模型

```typescript
interface FileChangeEvent {
  type: 'created' | 'modified' | 'renamed' | 'deleted';
  path: string;           // 相对路径（workspace-relative）
  oldPath?: string;        // 仅 renamed 时有值
}
```

只有这一个结构，所有信号源统一输出。

### 五个信号源

| # | 信号源 | VSCode API | 产生事件 | 触发时机 |
|---|--------|-----------|----------|----------|
| 1 | IDE Rename | `onDidRenameFiles` | renamed | 实时 |
| 2 | IDE Delete | `onDidDeleteFiles` | deleted | 实时 |
| 3 | IDE Create | `onDidCreateFiles` | created | 实时 |
| 4 | Git HEAD Diff | `FileSystemWatcher(.git/HEAD)` | modified | HEAD 变化后 2s |
| 5 | Working Tree Diff | `onDidChangeWindowState` + 定时器 | created / modified | 窗口聚焦 / 5min 定时 |

#### 信号 1-3：IDE 文件操作（实时）

直接映射 VSCode workspace 事件。覆盖 IDE 内的所有文件操作（包括 AI Agent 通过 `vscode.workspace.fs` 执行的操作）。

```typescript
workspace.onDidRenameFiles(e => {
  for (const f of e.files) {
    buffer.push({
      type: 'renamed',
      path: asRelative(f.newUri),
      oldPath: asRelative(f.oldUri),
    });
  }
});

workspace.onDidDeleteFiles(e => {
  for (const f of e.files) {
    buffer.push({ type: 'deleted', path: asRelative(f) });
  }
});

workspace.onDidCreateFiles(e => {
  for (const f of e.files) {
    buffer.push({ type: 'created', path: asRelative(f) });
  }
});
```

#### 信号 4：Git HEAD Diff（commit/pull/switch 后）

监听 `.git/HEAD` 文件变化。改进：存储 `lastKnownHead`，用精确 diff 替代 `HEAD~1`。

```typescript
let lastKnownHead: string | undefined;

// 激活时记录初始 HEAD
lastKnownHead = execSync('git rev-parse HEAD').trim();

watcher.onDidChange(() => {
  // 防抖 2s（等 git 操作完成）
  debounce(async () => {
    const currentHead = exec('git rev-parse HEAD');
    if (lastKnownHead && currentHead !== lastKnownHead) {
      const files = exec(`git diff --name-only ${lastKnownHead}..${currentHead}`);
      for (const f of files) {
        buffer.push({ type: 'modified', path: f });
      }
    }
    lastKnownHead = currentHead;
  }, 2000);
});
```

#### 信号 5：Working Tree Diff（覆盖未 commit 的变更）

**核心盲区覆盖**：无论 AI 还是人工编辑，只要文件改了但没 commit，前 4 个信号都捕获不到。

```typescript
let lastWorkingSet = new Set<string>();

async function diffWorkingTree(folder: WorkspaceFolder) {
  // tracked 文件的 unstaged 变更
  const tracked = exec('git diff --name-only');
  // staged 但未 commit
  const staged = exec('git diff --name-only --cached');
  // 新文件（untracked，排除 .gitignore）
  const untracked = exec('git ls-files --others --exclude-standard');

  const current = new Set([...tracked, ...staged, ...untracked]);
  // 只报告增量
  for (const f of current) {
    if (!lastWorkingSet.has(f)) {
      buffer.push({
        type: untracked.includes(f) ? 'created' : 'modified',
        path: f,
      });
    }
  }
  lastWorkingSet = current;
}
```

**触发时机**：

| 触发器 | 说明 |
|--------|------|
| `onDidChangeWindowState(focused=true)` + 3s 防抖 | 用户切回窗口 = "一段编辑告一段落" |
| 5 分钟定时器 | 用户长时间不切窗口时兜底 |

### EventBuffer 设计

所有信号源将事件推入 buffer，buffer 负责去重、合并、节流后统一 flush：

```typescript
class EventBuffer {
  private pending: Map<string, FileChangeEvent> = new Map();
  private flushTimer: ReturnType<typeof setTimeout> | undefined;

  /** 信号源推入事件 */
  push(event: FileChangeEvent) {
    const key = event.type === 'renamed'
      ? `renamed:${event.oldPath}:${event.path}`
      : `${event.type}:${event.path}`;

    // 合并规则：
    // - created + modified → 保留 created（文件是新的）
    // - modified + modified → 保留一个（去重）
    // - created + deleted → 互相抵消（移除）
    // - renamed + deleted → 保留 deleted（使用 oldPath）
    const existing = this.pending.get(event.path);
    if (existing) {
      if (existing.type === 'created' && event.type === 'deleted') {
        this.pending.delete(event.path);
        return;
      }
      if (existing.type === 'created' && event.type === 'modified') {
        return; // 保留 created
      }
    }

    this.pending.set(key, event);
    this.scheduleFlush();
  }

  /** 3 秒节流 flush */
  private scheduleFlush() {
    if (this.flushTimer) { return; }
    this.flushTimer = setTimeout(() => {
      this.flush();
      this.flushTimer = undefined;
    }, 3000);
  }

  /** 将 pending 事件批量发送 */
  private async flush() {
    if (this.pending.size === 0) { return; }
    const events = [...this.pending.values()];
    this.pending.clear();
    // 过滤 .asd/ 等运行时目录
    const filtered = events.filter(e => !this.isIgnored(e.path));
    if (filtered.length > 0) {
      await apiClient.reportFileChanges(filtered);
    }
  }

  private isIgnored(path: string): boolean {
    return path.startsWith('.asd/') || path.startsWith('.git/');
  }
}
```

**设计要点**：

1. **Map 去重** — 同一路径的重复事件自动合并
2. **3s 节流** — 第一个事件后 3s 统一发送，避免逐个推送
3. **合并语义** — created→deleted 抵消，created→modified 保留 created
4. **路径过滤** — 忽略 `.asd/`、`.git/` 等运行时目录

### API 协议

```
POST /api/v1/file-changes
Content-Type: application/json

{
  "events": [
    { "type": "modified", "path": "src/utils/api.ts" },
    { "type": "renamed", "path": "src/hooks/useAuth.ts", "oldPath": "src/hooks/useLogin.ts" },
    { "type": "created", "path": "src/components/NewWidget.tsx" },
    { "type": "deleted", "path": "src/legacy/old.ts" }
  ]
}
```

端点路径从 `/evolution/file-changed` 改为 `/file-changes`——不再绑定 evolution 概念。

---

## 第二层：服务端 Dispatcher

### FileChangeDispatcher

服务端收到事件后，通过发布-订阅模式分发给业务消费者：

```typescript
class FileChangeDispatcher {
  private subscribers: FileChangeSubscriber[] = [];

  register(subscriber: FileChangeSubscriber) {
    this.subscribers.push(subscriber);
  }

  async dispatch(events: FileChangeEvent[]): Promise<void> {
    await Promise.allSettled(
      this.subscribers.map(s => s.onFileChanges(events))
    );
  }
}

interface FileChangeSubscriber {
  onFileChanges(events: FileChangeEvent[]): Promise<void>;
}
```

### 当前订阅者

| 订阅者 | 职责 |
|--------|------|
| `ReactiveEvolutionService` | renamed → patch sourceRef；deleted → deprecate recipe；modified → 返回需要审查的列表 |

### 未来可扩展

| 潜在订阅者 | 职责 |
|------------|------|
| `CodeEntityUpdater` | modified/created → 增量更新 code_entities 表 |
| `GapDetector` | created → 检测新文件是否匹配已知 gap |
| `DashboardNotifier` | * → 推送 WebSocket 事件给 Dashboard UI |

---

## 第三层：ReactiveEvolutionService（业务层，现有不变）

统一入口 `handleFileChanges(events)`:

- **renamed** → `ContentPatcher` 修复 sourceRefs + 更新 `recipe_source_refs` 桥接表 + 更新 `reasoning.sources`
- **deleted** → 检查 Recipe 是否还有其他 active sourceRef
  - 有 → 只标记该 ref 为 stale
  - 无 → `RecipeLifecycleSupervisor.transition()` → deprecated
- **modified** → 跳过（计入 skipped），返回 `suggestReview=true` 提示 Agent 介入
- **created** → 跳过（新文件不影响已有 Recipe，但 Dispatcher 的其他订阅者可能关心）

---

## 对比：现有实现 vs 新方案

| 维度 | 现有实现 | 新方案 |
|------|---------|--------|
| 事件采集 | 3 处散落在 `activate()` 中 | 统一 `FileChangeCollector` 类 |
| 缓冲 | 无，每个事件直接 HTTP POST | `EventBuffer` 3s 节流 + 去重 + 合并 |
| AI 编辑检测 | ❌ 盲区 | ✅ Working Tree Diff 覆盖 |
| 新文件检测 | ❌ 无 `onDidCreateFiles` | ✅ 信号源 3 + Working Tree Diff |
| Git HEAD diff | `HEAD~1..HEAD`（merge/rebase 不准） | `lastKnownHead..HEAD`（精确） |
| 扩展→服务端耦合 | 直接调 `notifyFileChanges` + `showReviewSuggestion` | 只调 `reportFileChanges`，不处理业务返回 |
| 服务端扩展性 | 直写 ReactiveEvolutionService | Dispatcher 发布-订阅，可挂多个消费者 |
| API 端点 | `/evolution/file-changed` | `/file-changes`（领域无关） |

---

## 核心原则

```
采集层只管"发生了什么" → 不知道 Recipe 的存在
缓冲层做去重/合并/节流  → 减少 HTTP 调用
服务端 Dispatcher 分发  → 业务消费者各取所需
能自动修的 → 自动 patch + 写回
修不了的   → 直接 deprecated
结构变化   → 返回摘要，由 Agent 增量扫描判断
```

---

## DI 注册（`lib/injection/modules/KnowledgeModule.ts`）

```
fileChangeDispatcher     — 单例，注册所有订阅者
reactiveEvolutionService — 单例，作为 Dispatcher 的订阅者之一
```

依赖:
- `recipeSourceRefRepository`
- `knowledgeRepository`
- `contentPatcher`
- `lifecycleSupervisor`
- `signalBus`（可选）

---

## Review 提示机制

扩展侧不再根据 HTTP 返回值直接弹 UI。改为：

服务端在处理完事件后，如果需要用户介入（`suggestReview=true`），通过 **SignalBus** 广播 `evolution:review-suggested` 信号。Dashboard WebSocket 消费此信号显示通知。

扩展侧如果有 UI 需求（如状态栏提示），通过独立的 polling 机制（已有 `statusBar.startPolling()`）获取状态，而非从 file-change POST 的返回值中读取。

---

## 文件清单

### 扩展侧

| 文件 | 操作 |
|------|------|
| `resources/vscode-ext/src/FileChangeCollector.ts` | **新建** — 统一采集器（5 个信号源 + EventBuffer） |
| `resources/vscode-ext/src/extension.ts` | **修改** — 移除散落的 rename/delete/gitHead 监听，改为初始化 `FileChangeCollector` |
| `resources/vscode-ext/src/apiClient.ts` | **修改** — `notifyFileChanges` → `reportFileChanges`，事件类型扩展 created |

### 服务端

| 文件 | 操作 |
|------|------|
| `lib/types/reactive-evolution.ts` | **修改** — FileChangeEvent 增加 `created` 类型 |
| `lib/service/FileChangeDispatcher.ts` | **新建** — 发布-订阅 Dispatcher |
| `lib/service/evolution/ReactiveEvolutionService.ts` | **修改** — 实现 `FileChangeSubscriber` 接口 |
| `lib/http/routes/file-changes.ts` | **新建** — POST /file-changes（领域无关路由） |
| `lib/http/routes/evolution.ts` | **修改** — 移除 POST /evolution/file-changed |
| `lib/http/HttpServer.ts` | **修改** — 挂载 file-changes 路由 |
| `lib/injection/modules/KnowledgeModule.ts` | **修改** — 注册 FileChangeDispatcher + 订阅者 |
