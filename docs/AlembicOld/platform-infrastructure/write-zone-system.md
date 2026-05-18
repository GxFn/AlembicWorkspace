# WriteZone — 本地化写入管理系统设计

> 基于全项目 120+ 处 `fs.*` 写入操作审计结果，设计统一的文件写入管理层。
> 
> **v2 — 2026-04-18** 补充真实代码审计、边界 case 修复、链路连通性验证

## 1. 问题诊断

### 1.1 现状

当前项目中文件写入存在以下问题：

| 问题 | 影响 | 举例 |
|------|------|------|
| **路径散落** | 120+ 处直接调用 `fs.mkdirSync` / `writeFileSync`，每处独立决定用 `projectRoot` 还是 `dataRoot` | `wiki-external.ts` 用了 `resolveProjectRoot` 导致 Ghost 泄漏 |
| **命名歧义** | 大量参数名为 `projectRoot` 但实际语义是 `dataRoot`，阅读代码时无法判断意图 | `HnswVectorAdapter`、`SignalCollector`、`checkpoint.ts` |
| **无编译期约束** | 传错根路径不会有类型错误，只会在运行时 Ghost 模式下出 bug | `findSimilarRecipes(projectRoot, ...)` 多处误传 |
| **双 API 并存** | `Paths.ts` 的 getter（无 Ghost 感知）与 `WorkspaceResolver` 的 getter（有 Ghost 感知）功能重叠 | `getProjectSkillsPath(root)` vs `resolver.skillsDir` |
| **PathGuard 绕过** | 部分写入未经 `PathGuard` 校验 | `commands.ts` HTTP 路由、`ProjectRegistry` 全局写入 |
| **同步/异步混用** | 8 个文件使用 `fs/promises` 异步写入，与当前 PathGuard（仅同步 API）不统一 | `checkpoint.ts`、`BinaryPersistence.ts`、`orchestrator.ts` |

### 1.2 已有基础设施

| 组件 | 职责 | Ghost 感知 |
|------|------|------------|
| `WorkspaceResolver` | 路径 getter（`.runtimeDir`、`.recipesDir` 等 20+ 属性） | ✅ 核心 |
| `PathGuard` | 运行时边界守卫（Layer 1 + Layer 2） | ✅ 白名单 |
| `Paths.ts` | 静态路径计算 + `ensureDir` | ❌ 需调用方传 `dataRoot` |
| `resolveDataRoot()` | 从 DI 容器获取 `dataRoot` | ✅ |
| `KnowledgeFileWriter` | Recipe markdown 持久化 | ✅ 经由 DI |
| `FileProtection` | Channel F 写入保护（backup/merge/force） | 部分 |

### 1.3 真实代码审计发现的新问题（v2 新增）

以下问题在对照真实代码后发现，属于原始设计的盲区：

#### P1: Logger.ts — Ghost 下日志路径的隐式依赖链

```
Logger._addTransports() 
  → config.file.path || './.asd/logs'   (默认是相对路径)
  → path.resolve(pathGuard.projectRoot, rawLogsDir)   (拼到项目根)
```

**安全性分析**：当前 `Bootstrap.initializeLogger()` 会在 Ghost 模式下将 `config.file.path` 覆盖为 `resolver.logsDir`（绝对路径 `~/.asd/workspaces/<id>/.asd/logs`），所以**主链路安全**。但：

- Logger 自身**不感知 Ghost**，只认 `config.file.path` 是相对还是绝对
- 若任何代码在 `Bootstrap.initializeLogger()` 之前调用 `Logger.getInstance({ file: { enabled: true } })`（带文件配置），日志会写到项目根下的 `.asd/logs`
- `mkdirSync` 在 Logger 内**不经过 PathGuard**

**WriteZone 迁移策略**：Logger 属于**最早期初始化组件**，在 DI 容器之前运行，无法直接注入 WriteZone。应保持现有 Bootstrap 覆盖路径机制，但在 WriteZone 体系中标注为**豁免项**。

#### P2: PathGuard 白名单不覆盖 `~/.asd/` 全局目录

实际代码（`PathGuard.configure()`）默认白名单仅包含：
- `~/.asd/cache`
- `~/.asd/snippets`
- macOS Xcode snippets 目录

**不包含** `~/.asd/projects.json`、`~/.asd/workspaces/` 等路径。

这意味着 WriteZone 设计中 `Zone.Global` 的 `#guardWrite` 用 `pathGuard.assertSafe()` **会误伤合法写入**：
- `wz.global('projects.json')` → `~/.asd/projects.json` → **被 PathGuard 拒绝** ❌
- `wz.global('workspaces/...')` → **被 PathGuard 拒绝** ❌

**修复方案**：`WriteZone` 构造时需要将 `~/.asd/` 整体加入 PathGuard 白名单，或者 Zone.Global 改用独立的轻量校验（仅检查路径前缀是否在 `~/.asd/` 下），不走 `assertSafe`。

#### P3: `const enum` 与 `isolatedModules: true` 不兼容

项目 `tsconfig.json` 启用了 `"isolatedModules": true`（第 16 行）。**`export const enum`** 在此模式下：
- 纯 `tsc` 编译时可工作（内联替换）
- 但跨文件引用时，Babel/swc/esbuild 等单文件转译器无法解析，会导致运行时 `undefined`
- TypeScript 5.x 官方文档明确建议在 `isolatedModules` 下避免使用 `const enum`

**修复方案**：改用 `as const` 联合类型：

```typescript
export const Zone = {
  Project: 'project',
  Data: 'data',
  Global: 'global',
} as const;

export type Zone = (typeof Zone)[keyof typeof Zone];
```

#### P4: 缺少异步写入 API — 8 个文件使用 `fs/promises`

当前使用 `fs/promises` 的写入站点：

| 文件 | 异步操作 | PathGuard 校验 |
|------|----------|----------------|
| `checkpoint.ts` | `mkdir` + `writeFile` + `rm` | 仅 `clearCheckpoints` 有 `assertSafe` |
| `orchestrator.ts` | `mkdir` + `writeFile` | ❌ 无 |
| `BinaryPersistence.ts` | `writeFile` (saveAsync) | ❌ 无 |
| `guard.ts` | 异步读写 | 部分 |
| `BootstrapSnapshot.ts` | 异步快照 | ❌ 无 |
| `ConfigWatcher.ts` | 异步文件监听 | 只读 |
| `parser-init.ts` | AST 解析 | 只读 |
| `SourceFileCollector.ts` | 文件收集 | 只读 |

WriteZone 仅提供同步 API 的话，这些站点要么改为同步（性能退化），要么继续绕过 WriteZone。

**修复方案**：补充完整的异步 API 镜像：

```typescript
async writeFileAsync(target: ZonedPath, content: string | Buffer): Promise<void>
async ensureDirAsync(target: ZonedPath): Promise<string>
async removeAsync(target: ZonedPath, options?: { recursive?: boolean }): Promise<void>
async appendFileAsync(target: ZonedPath, content: string): Promise<void>
```

#### P5: UpgradeService — Ghost 模式下 Skills 迁移路径泄漏

`UpgradeService._migrateSkillsPath()` 硬编码使用 `this.projectRoot`：

```typescript
const oldSkillsDir = join(this.projectRoot, '.asd', 'skills');        // ❌ Ghost 下应为 dataRoot
const newSkillsDir = join(this.projectRoot, DEFAULT_KNOWLEDGE_BASE_DIR, 'skills');  // ❌ 同上
```

虽然 `UpgradeService.ghost` 已从 `ProjectRegistry.isGhost()` 读取，但 `_migrateSkillsPath()` 完全没有使用该标志来切换路径。Ghost 模式下会在真实项目根下创建 `.asd/skills` 和 `Alembic/skills` 目录。

**风险等级**：⚠ 中 — 仅在执行 `alembic upgrade` 且旧 skills 存在时触发。

**修复方案**：构造 `WorkspaceResolver`，使用 `resolver.runtimeSkillsDir` 和 `resolver.skillsDir`。

#### P6: DiscovererPreference — Ghost 下写入 `.asd/` 到项目根

`savePreference()` 使用 `join(projectRoot, '.asd', 'discoverer-preference.json')`：

```typescript
const PREFERENCE_DIR = '.asd';
const prefDir = join(projectRoot, PREFERENCE_DIR);  // ❌ Ghost 下应为 dataRoot
```

**风险等级**：ℹ 低 — `savePreference` 目前仅导出但**无调用点**（`loadPreference` + `detectConflict` 有调用，但 `save` 没有）。但若未来启用，会在 Ghost 项目根创建 `.asd/` 目录。

#### P7: ai.ts `.env` 写入 — 设计决策正确但需明确归区

`_getProjectEnvPath()` 始终解析到 `projectRoot/.env`，即使在 Ghost 模式下。这是**正确的**，因为 `.env` 属于 Zone.Project（用户项目配置），但文档中三区模型需明确标注。

#### P8: 跨 Zone `rename` 的 EXDEV 风险

`fs.renameSync()` 在跨文件系统时抛出 `EXDEV` 错误。Ghost 模式下：
- `Zone.Project` → 真实项目目录（可能在 `/Users/xxx/code/`）
- `Zone.Data` → `~/.asd/workspaces/<id>/`（可能在不同挂载点）

如果 `CleanupService` 或其他服务尝试在两个 Zone 之间 `rename`，会失败。

**修复方案**：`rename` 方法应捕获 `EXDEV` 并自动 fallback 到 copy + delete：

```typescript
rename(src: ZonedPath, dest: ZonedPath): void {
  this.#guardWrite(src);
  this.#guardWrite(dest);
  try {
    fs.renameSync(src.absolute, dest.absolute);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      fs.cpSync(src.absolute, dest.absolute, { recursive: true });
      fs.rmSync(src.absolute, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}
```

#### P9: DI 生命周期盲区 — `alembic setup` 阶段无法使用 WriteZone

以下写入发生在 `ServiceContainer.initialize()` **之前**，无法从 DI 获取 WriteZone：

| 组件 | 写入行为 | 时机 |
|------|----------|------|
| `SetupService.stepRuntime()` | 创建 `.asd/`、写 `config.json`、`.env` | 最早的 setup 阶段 |
| `SetupService.stepCoreRepo()` | 创建 `Alembic/` 目录树 | setup 阶段 |
| `FileDeployer.deployAll()` | IDE 配置文件部署 | setup/upgrade 阶段 |
| `ProjectRegistry.register()` | 写 `~/.asd/projects.json` | 任意时刻 |
| `Logger._addTransports()` | 创建日志目录 | Bootstrap 早期 |

**修复方案**：提供 DI 无关的静态工厂：

```typescript
// 供 setup/upgrade/CLI 等 pre-DI 场景使用
static fromResolver(resolver: WorkspaceResolver): WriteZone
static async fromProjectRoot(projectRoot: string): Promise<WriteZone>  // 内部创建临时 resolver
```

## 2. 设计目标

1. **一个入口** — 所有文件写入通过 `WriteZone` 完成，杜绝裸 `fs.*` 调用
2. **编译期安全** — 用 TypeScript 类型系统区分不同 Zone，传错路径会报类型错误
3. **Ghost 透明** — 消费者无需关心 Ghost 模式，Zone 自动解析到正确根路径
4. **审计友好** — `grep 'writeZone\.'` 即可审计全部写入
5. **渐进迁移** — 新代码用 `WriteZone`，旧代码可逐步迁移
6. **同步/异步统一** — 同时提供 sync 和 async API，覆盖全部写入模式（v2 新增）
7. **pre-DI 可用** — 通过静态工厂支持 setup/CLI 等 DI 容器建立前的场景（v2 新增）

## 3. 核心设计

### 3.1 三区模型

```
WriteZone
├── Zone.Project  → projectRoot      用户项目根目录（真实路径）
│   ├── .cursor/rules/*.mdc          IDE 规则交付
│   ├── .cursor/skills/asd-*/        IDE 技能交付
│   ├── .github/copilot-instructions.md
│   ├── AGENTS.md, CLAUDE.md
│   ├── .gitignore
│   └── .env                         ← 注意: AI 配置写入此处 (ai.ts)
│
├── Zone.Data     → dataRoot         数据根目录（Ghost 下为外置路径）
│   ├── .asd/                        运行时数据
│   │   ├── alembic.db               数据库
│   │   ├── logs/                    日志、信号、报告
│   │   ├── context/                 向量索引、记忆嵌入
│   │   ├── conversations/           对话历史
│   │   ├── bootstrap-checkpoint/    断点续传
│   │   ├── cache/                   图缓存
│   │   ├── discoverer-preference.json  ← 修正: 原在 Zone.Project (bug)
│   │   └── .trash/                  回收站
│   └── Alembic/                     知识库
│       ├── recipes/                 代码模式
│       ├── candidates/              候选
│       ├── skills/                  项目技能
│       ├── wiki/                    文档
│       └── Alembic.boxspec.json     项目规格
│
└── Zone.Global   → ~/.asd/          全局配置
    ├── projects.json                项目注册表
    ├── workspaces/                  Ghost 工作区
    ├── cache/                       全局缓存
    └── snippets/                    代码片段
```

### 3.2 类型定义（v2 修正：使用 `as const` 替代 `const enum`）

```typescript
// lib/infrastructure/io/WriteZone.ts

/**
 * 写入区域常量 — 编译期类型安全的核心
 * 
 * 使用 `as const` 而非 `const enum`，因为项目启用了 isolatedModules: true，
 * const enum 在单文件转译器下会导致运行时 undefined。
 */
export const Zone = {
  /** 项目根：IDE 配置、Agent 指令文件等必须留在真实项目目录的文件 */
  Project: 'project',
  /** 数据根：知识库、运行时数据等在 Ghost 模式下应外置的文件 */
  Data: 'data',
  /** 全局：~/.asd/ 下的跨项目配置和缓存 */
  Global: 'global',
} as const;

export type Zone = (typeof Zone)[keyof typeof Zone];

/** 类型化的路径标记 — 防止不同 Zone 的路径混用 */
export interface ZonedPath<Z extends Zone = Zone> {
  readonly zone: Z;
  readonly absolute: string;
}

/** 项目区路径 — 只能用于 IDE 交付类操作 */
export type ProjectPath = ZonedPath<'project'>;

/** 数据区路径 — 知识库和运行时数据 */
export type DataPath = ZonedPath<'data'>;

/** 全局区路径 — ~/.asd/ 下的全局文件 */
export type GlobalPath = ZonedPath<'global'>;
```

### 3.3 WriteZone 核心类（v2 大幅修正）

```typescript
// lib/infrastructure/io/WriteZone.ts

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import pathGuard from '#shared/PathGuard.js';
import type { WorkspaceResolver } from '#shared/WorkspaceResolver.js';

export class WriteZone {
  readonly #resolver: WorkspaceResolver;
  readonly #globalRoot: string;

  constructor(resolver: WorkspaceResolver) {
    this.#resolver = resolver;
    this.#globalRoot = path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.asd'
    );
  }

  // ─── 静态工厂（v2 新增：pre-DI 场景） ──────────────

  /**
   * 从 WorkspaceResolver 创建 — 供 SetupService/UpgradeService 等
   * 不依赖 DI 容器的场景使用
   */
  static fromResolver(resolver: WorkspaceResolver): WriteZone {
    return new WriteZone(resolver);
  }

  /**
   * 从项目根路径创建（异步）— 最简便的入口，内部自动构建 resolver
   * 适用于 CLI 工具、脚本等一次性场景
   */
  static async fromProjectRoot(projectRoot: string): Promise<WriteZone> {
    const { WorkspaceResolver: WR } = await import('#shared/WorkspaceResolver.js');
    return new WriteZone(WR.fromProject(projectRoot));
  }

  // ─── 路径解析 ─────────────────────────────────────

  /** 将相对路径解析为 Zone.Project 标记的绝对路径 */
  project(relativePath: string): ProjectPath {
    const abs = path.resolve(this.#resolver.projectRoot, relativePath);
    return { zone: Zone.Project, absolute: abs };
  }

  /** 将相对路径解析为 Zone.Data 标记的绝对路径 */
  data(relativePath: string): DataPath {
    const abs = path.resolve(this.#resolver.dataRoot, relativePath);
    return { zone: Zone.Data, absolute: abs };
  }

  /** 将相对路径解析为 Zone.Global 标记的绝对路径 */
  global(relativePath: string): GlobalPath {
    const abs = path.resolve(this.#globalRoot, relativePath);
    return { zone: Zone.Global, absolute: abs };
  }

  // ─── 常用数据区快捷路径 ──────────────────────────

  /** .asd/ 子路径（运行时数据） */
  runtime(sub: string): DataPath {
    return this.data(path.join('.asd', sub));
  }

  /** Alembic/ 子路径（知识库数据） */
  knowledge(sub: string): DataPath {
    return this.data(path.join(this.#resolver.knowledgeBaseDir, sub));
  }

  // ─── 同步写入操作 ─────────────────────────────────

  /** 确保目录存在（同步） */
  ensureDir(target: ZonedPath): string {
    this.#guardWrite(target);
    if (!fs.existsSync(target.absolute)) {
      fs.mkdirSync(target.absolute, { recursive: true });
    }
    return target.absolute;
  }

  /** 写入文件（同步覆盖） */
  writeFile(target: ZonedPath, content: string | Buffer): void {
    this.#guardWrite(target);
    this.#ensureParentDir(target.absolute);
    fs.writeFileSync(target.absolute, content);
  }

  /** 追加写入（同步） */
  appendFile(target: ZonedPath, content: string): void {
    this.#guardWrite(target);
    this.#ensureParentDir(target.absolute);
    fs.appendFileSync(target.absolute, content);
  }

  /** 复制文件（同步） */
  copyFile(src: string, dest: ZonedPath): void {
    this.#guardWrite(dest);
    this.#ensureParentDir(dest.absolute);
    fs.copyFileSync(src, dest.absolute);
  }

  /** 删除文件或目录（同步） */
  remove(target: ZonedPath, options?: { recursive?: boolean }): void {
    this.#guardWrite(target);
    fs.rmSync(target.absolute, { force: true, ...options });
  }

  /**
   * 移动/重命名（同步）
   * 自动处理跨文件系统 EXDEV 错误（Ghost 模式下 Zone 可能跨挂载点）
   */
  rename(src: ZonedPath, dest: ZonedPath): void {
    this.#guardWrite(src);
    this.#guardWrite(dest);
    try {
      fs.renameSync(src.absolute, dest.absolute);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
        this.#ensureParentDir(dest.absolute);
        fs.cpSync(src.absolute, dest.absolute, { recursive: true });
        fs.rmSync(src.absolute, { recursive: true, force: true });
      } else {
        throw err;
      }
    }
  }

  // ─── 异步写入操作（v2 新增） ──────────────────────

  async ensureDirAsync(target: ZonedPath): Promise<string> {
    this.#guardWrite(target);
    await fsPromises.mkdir(target.absolute, { recursive: true });
    return target.absolute;
  }

  async writeFileAsync(target: ZonedPath, content: string | Buffer): Promise<void> {
    this.#guardWrite(target);
    await this.#ensureParentDirAsync(target.absolute);
    await fsPromises.writeFile(target.absolute, content);
  }

  async appendFileAsync(target: ZonedPath, content: string): Promise<void> {
    this.#guardWrite(target);
    await this.#ensureParentDirAsync(target.absolute);
    await fsPromises.appendFile(target.absolute, content);
  }

  async removeAsync(target: ZonedPath, options?: { recursive?: boolean }): Promise<void> {
    this.#guardWrite(target);
    await fsPromises.rm(target.absolute, { force: true, ...options });
  }

  // ─── 安全校验（v2 修正） ──────────────────────────

  #guardWrite(target: ZonedPath): void {
    switch (target.zone) {
      case Zone.Project:
      case Zone.Data:
        pathGuard.assertProjectWriteSafe(target.absolute);
        break;
      case Zone.Global:
        // Global 区独立校验：只检查路径前缀在 ~/.asd/ 下
        // 不走 assertSafe() — 因为默认白名单不包含 ~/.asd/ 全局目录
        this.#assertGlobalSafe(target.absolute);
        break;
    }
  }

  /**
   * Global 区专用校验 — 确保写入路径在 ~/.asd/ 目录下
   * 不使用 PathGuard.assertSafe()（默认白名单仅覆盖 cache/snippets）
   */
  #assertGlobalSafe(targetPath: string): void {
    const resolved = path.resolve(targetPath);
    const normalizedGlobal = path.resolve(this.#globalRoot);
    if (!resolved.startsWith(normalizedGlobal + path.sep) && resolved !== normalizedGlobal) {
      throw new Error(
        `[WriteZone] Global 写入越界: ${resolved} 不在 ${normalizedGlobal}/ 下`
      );
    }
  }

  // ─── 内部工具 ─────────────────────────────────────

  #ensureParentDir(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async #ensureParentDirAsync(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fsPromises.mkdir(dir, { recursive: true });
  }
}
```

### 3.4 DI 注册 + 静态工厂

```typescript
// lib/injection/modules/InfraModule.ts（在现有 register 方法中新增）

import { WriteZone } from '#infra/io/WriteZone.js';

// 在 InfraModule.register(c) 中：
c.singleton('writeZone', (ct: ServiceContainer) => {
  const resolver = ct.singletons._workspaceResolver;
  if (!resolver) {
    throw new Error('[WriteZone] WorkspaceResolver not initialized');
  }
  return new WriteZone(resolver);
});
```

**pre-DI 场景**（SetupService、UpgradeService、ProjectRegistry）：

```typescript
// SetupService 构造函数中
const wz = WriteZone.fromResolver(this.resolver);

// CLI 脚本中
const wz = await WriteZone.fromProjectRoot(process.cwd());
```

## 4. 真实链路连通性验证（v2 新增）

### 4.1 启动时序与 WriteZone 可用性

```
┌──────────────────────────────────────────────────────────┐
│  进程启动                                                 │
│                                                          │
│  1. pathGuard.configure(projectRoot)                     │
│     ↓ 白名单: cache, snippets                            │
│                                                          │
│  2. WorkspaceResolver.fromProject(projectRoot)           │
│     ↓ Ghost? → pathGuard.addAllowPath(dataRoot)          │
│                                                          │
│  3. Bootstrap.initializeLogger()                         │
│     ↓ Ghost? → config.file.path = resolver.logsDir       │
│     ↓ Logger.getInstance(config) → mkdirSync(logsDir)   │
│     ↓ ★ Logger 此处不经过 PathGuard (豁免项)             │
│                                                          │
│  4. Bootstrap.initializeDatabase()                       │
│     ↓ mkdirSync(.asd/)                                   │
│                                                          │
│  5. ServiceContainer.initialize({workspaceResolver})     │
│     ↓ InfraModule.register → singleton('writeZone')      │
│     ↓ ★ WriteZone 从此刻起可从 DI 获取                   │
│                                                          │
│  6. 后续所有 Module 注册完成                               │
│     ↓ Service 可通过 container.get('writeZone') 使用      │
└──────────────────────────────────────────────────────────┘
```

**关键发现**：步骤 3-4 的写入发生在 DI 容器建立前，必须使用 `WriteZone.fromResolver()` 或保持现有机制。

### 4.2 核心链路逐一验证

| 链路 | 入口 | WriteZone 可用? | 方案 |
|------|------|----------------|------|
| `alembic setup` | CLI → `SetupService` | ❌ 无 DI | `WriteZone.fromResolver(this.resolver)` |
| `alembic upgrade` | CLI → `UpgradeService` | ❌ 无 DI | `WriteZone.fromResolver(resolver)` + 修复 `_migrateSkillsPath` |
| `alembic ui` | HTTP → Bootstrap → DI | ✅ 步骤 5 后 | `container.get('writeZone')` |
| `alembic coldstart` | MCP → DI → Bootstrap pipeline | ✅ 步骤 5 后 | `container.get('writeZone')` |
| Bootstrap 内部 | Logger、DB init | ❌ 步骤 3-4 | 保持现有 + WriteZone 豁免 |
| `ProjectRegistry` | 任意时刻 | ❌ 模块级 | `WriteZone.fromProjectRoot()` 或独立守卫 |

### 4.3 PathGuard 竞态窗口分析

```
configure()     →  addAllowPath(dataRoot)  窗口内: 无 async、无 await
     ↓ 同步                ↓ 同步
  设置 projectRoot      Ghost dataRoot 加入白名单
```

**结论**：`configure()` 到 `addAllowPath()` 之间是同步调用栈，**无竞态窗口**。但如果某代码路径只调用了 `configurePathGuard` 却跳过了 `initializeWorkspaceResolver`（如 `runAllPhases` 内部的兜底配置），则 Ghost `dataRoot` 不在白名单中。

**建议**：在 `WriteZone.#guardWrite(Zone.Data)` 中，如果 PathGuard 拒绝且路径在 `dataRoot` 下，应给出明确的错误提示："dataRoot 未加入 PathGuard 白名单，请确保 Bootstrap.initializeWorkspaceResolver() 已执行"。

## 5. 迁移指南

### 5.1 迁移规则

| 原始模式 | 迁移为 | 示例 |
|----------|--------|------|
| `fs.mkdirSync(path.join(projectRoot, '.asd', 'logs'), ...)` | `wz.ensureDir(wz.runtime('logs'))` | SignalModule |
| `fs.writeFileSync(path.join(dataRoot, 'Alembic', 'wiki', 'meta.json'), ...)` | `wz.writeFile(wz.knowledge('wiki/meta.json'), ...)` | wiki-external |
| `fs.mkdirSync(path.join(projectRoot, '.cursor', 'rules'), ...)` | `wz.ensureDir(wz.project('.cursor/rules'))` | RulesGenerator |
| `fs.writeFileSync(path.join(HOME, '.asd', 'projects.json'), ...)` | `wz.writeFile(wz.global('projects.json'), ...)` | ProjectRegistry |
| `await fs.mkdir(checkpointDir, { recursive: true })` | `await wz.ensureDirAsync(wz.runtime('bootstrap-checkpoint'))` | checkpoint.ts |
| `await fs.writeFile(path.join(dir, file), ...)` | `await wz.writeFileAsync(wz.runtime('bootstrap-checkpoint/' + file), ...)` | checkpoint.ts |

### 5.2 审计检查

迁移完成后，业务代码中应当**零匹配**以下模式：

```bash
# 同步写入 — 应为 0 匹配（测试/类型定义/WriteZone 自身除外）
rg 'fs\.(writeFileSync|mkdirSync|appendFileSync|copyFileSync|rmSync|renameSync|cpSync)' \
   lib/ --type ts \
   --glob '!lib/infrastructure/io/WriteZone.ts' \
   --glob '!lib/shared/PathGuard.ts'

# 异步写入 — 应为 0 匹配
rg 'fsPromises?\.(writeFile|mkdir|appendFile|rm|rename|cp)\(' \
   lib/ --type ts \
   --glob '!lib/infrastructure/io/WriteZone.ts'

# 裸 fs/promises import — 仅 WriteZone 允许
rg "from 'node:fs/promises'" \
   lib/ --type ts \
   --glob '!lib/infrastructure/io/WriteZone.ts'
```

### 5.3 分批迁移优先级（v2 修正）

| 批次 | 范围 | 文件数 | 风险 | 详细说明 |
|------|------|--------|------|----------|
| **P0** | 已知 Ghost 泄漏修复点 | 18 | 高 — 已修复 | 上一轮审计已处理 |
| **P1** | 核心写入热点 | 5 | 中 | `KnowledgeFileWriter`、`CleanupService`、`WikiGenerator`、`checkpoint.ts`、`orchestrator.ts` |
| **P1.5** | **新发现的 Ghost 泄漏** | 2 | ⚠ 中 | `UpgradeService._migrateSkillsPath`、`DiscovererPreference.savePreference` |
| **P2** | DI 模块中的 Store 类 | 8 | 低 | Signal、Report、Feedback、Conversation 等 Store |
| **P3** | 交付管线 | 3 | 低 | `FileDeployer`、`RulesGenerator`、`SkillsSyncer` |
| **P4** | Agent 工具 & HTTP 路由 | 10 | 低 | 包括 `ai.ts` 的 `.env` 写入 |
| **P5** | 异步写入站点 | 5 | 低 | `BinaryPersistence`、`AsyncPersistence`、`BootstrapSnapshot` |

### 5.4 豁免项（不迁移到 WriteZone）

| 组件 | 原因 |
|------|------|
| `Logger._addTransports()` | 在 DI 之前运行；已通过 Bootstrap 覆盖路径机制保证 Ghost 安全 |
| `DatabaseConnection.ts` | better-sqlite3 内部管理文件句柄；仅 `mkdirSync` 确保父目录 |
| 测试文件 (`test/`) | 不在生产路径中 |

## 6. 与现有组件的关系

```
┌──────────────────────────────────────────────────────────────┐
│                  消费者（Service / Handler）                   │
│  wiki-external.ts  skill.ts  CleanupService  SetupService    │
│                         │                                    │
│              ┌──────────┴──────────┐                         │
│              │    writeZone.*()    │    ← 统一写入入口        │
│              └──────────┬──────────┘                         │
├─────────────────────────┼────────────────────────────────────┤
│                    WriteZone                                  │
│  ┌──────────┬───────────┼────────────┬──────────────┐        │
│  │ .project │  .data()  │  .global() │ Async 镜像   │        │
│  │ → projR  │  → dataR  │  → ~/.asd  │ *Async()     │        │
│  └──────────┴───────────┼────────────┴──────────────┘        │
│                         │                                    │
│  ┌──────────────────────┼────────────────────────┐           │
│  │        WorkspaceResolver (不变)                │           │
│  │  projectRoot ←→ dataRoot (Ghost 感知)         │           │
│  │  20+ 路径 getter (logsDir, recipesDir, ...)   │           │
│  └──────────────────────┬────────────────────────┘           │
│                         │                                    │
│  ┌──────────────────────┼────────────────────────┐           │
│  │          PathGuard (不变)                      │           │
│  │  Zone.Project/Data → assertProjectWriteSafe() │           │
│  │  Zone.Global → #assertGlobalSafe() (独立)     │  ← v2 修正│
│  └───────────────────────────────────────────────┘           │
│                                                              │
│  ┌───────────────────────────────────────────────┐           │
│  │  获取方式                                      │           │
│  │  DI:     container.get('writeZone')           │           │
│  │  静态:   WriteZone.fromResolver(resolver)     │  ← v2 新增│
│  │  轻量:   WriteZone.fromProjectRoot(root)      │  ← v2 新增│
│  └───────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

**层次关系**：
- `WriteZone` **包装**了 `WorkspaceResolver`（路径解析）和 `PathGuard`（安全校验）
- `WorkspaceResolver` **不变** — 仍然是路径解析的核心
- `PathGuard` **不变** — 仍然是运行时守卫
- `Paths.ts` **逐步废弃** — 其 getter 被 `WorkspaceResolver` + `WriteZone` 取代
- `resolveDataRoot()` **保留** — 作为不方便获取 `WriteZone` 实例时的轻量替代
- `Zone.Global` **独立守卫** — 不走 `assertSafe()`，用前缀校验（v2 修正）

## 7. 设计决策记录

### 为什么不直接在 WorkspaceResolver 上加写入方法？

`WorkspaceResolver` 是**纯路径解析器**（Pure Query），职责单一且可测试。文件 I/O 是副作用操作，应分离到独立类。这遵循 CQRS 原则。

### 为什么 ZonedPath 用 branded type 而非字符串？

裸字符串无法区分来源，类型系统无法防止 `projectRoot` 路径被传给需要 `dataRoot` 的函数。`ZonedPath<Zone>` 在编译期就能捕获错误。

### 为什么 Zone.Global 也纳入管理？

`~/.asd/projects.json` 等全局文件虽然不涉及 Ghost，但需要边界检查（防止写入非预期目录）。统一入口也便于审计。

### 为什么 Zone.Global 不走 PathGuard.assertSafe？（v2 新增）

PathGuard 默认白名单仅包含 `~/.asd/cache` 和 `~/.asd/snippets`。如果走 `assertSafe()`，对 `~/.asd/projects.json`、`~/.asd/workspaces/` 等合法路径会误报越界。

两种可行方案：
1. **扩展 PathGuard 白名单**：在 `configure()` 时将 `~/.asd/` 整体加入白名单 → 侵入性强，可能放松其他场景的安全约束
2. ✅ **WriteZone 独立守卫**：`#assertGlobalSafe()` 仅检查路径前缀在 `~/.asd/` 下 → 精确、无侵入

### 为什么改用 `as const` 替代 `const enum`？（v2 新增）

项目 `tsconfig.json` 启用了 `isolatedModules: true`（第 16 行）。TypeScript 文档明确指出 `const enum` 在此模式下有兼容问题。`as const` 对象 + 联合类型提供等价的类型安全，且对所有转译器兼容。

### 为什么需要异步 API？（v2 新增）

项目中有 8 个文件使用 `fs/promises` 进行异步写入。如果 WriteZone 只提供同步 API：
- 要么强制这些站点改为同步（`checkpoint.ts` 的 `saveDimensionCheckpoint` 在 await 链中调用，改为同步会阻塞事件循环）
- 要么这些站点继续绕过 WriteZone，审计目标无法达成

提供异步镜像是唯一不降低性能的方案。

### 为什么不用 ESLint 规则禁止裸 fs 调用？

可以作为补充手段，但核心保障应在类型系统层面。ESLint 规则可以在 P3 批次迁移时引入：

```jsonc
// .eslintrc.json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "node:fs",
        "importNames": ["writeFileSync", "mkdirSync", "appendFileSync", "copyFileSync", "rmSync"],
        "message": "Use WriteZone instead of direct fs operations"
      }]
    }]
  }
}
```

## 8. 已知遗留（当前审计发现的边界 case）

| 组件 | 状态 | 说明 | 修复方案 |
|------|------|------|----------|
| `Logger.ts` 文件日志 | 🟡 豁免 | 基于 `pathGuard.projectRoot` + Bootstrap 覆盖为绝对路径。Ghost 下主链路安全，但 `mkdirSync` 不经 PathGuard | 保持现有机制，标注为豁免项 |
| `UpgradeService._migrateSkillsPath` | 🔴 泄漏 | `this.projectRoot` 硬编码，Ghost 下在项目根创建 `.asd/skills` 和 `Alembic/skills` | 用 `WorkspaceResolver` 的 `runtimeSkillsDir` 和 `skillsDir` |
| `DiscovererPreference.savePreference` | 🟡 潜伏 | 写入 `projectRoot/.asd/`，但目前**无调用方** | 启用前需改为 `dataRoot` |
| `SignalCollector` | ℹ 已禁用 | `if (false)` 包裹，启用时需传 `dataRoot` | — |
| `CustomConfigDiscoverer` | ℹ 只读 | 从 `projectRoot` 读 boxspec，Ghost 下静默降级 | — |
| `ai.ts` `.env` 写入 | ✅ 正确 | 写入 `projectRoot/.env`，属于 Zone.Project | 迁移为 `wz.project('.env')` |
| `PathGuard` 默认白名单 | 🟡 限制 | 不覆盖 `~/.asd/` 全局目录，WriteZone.Global 需独立守卫 | `#assertGlobalSafe()` 前缀校验 |
| `rename` 跨 Zone | 🟡 风险 | `EXDEV` 跨文件系统错误 | fallback 到 copy + delete |
| `BinaryPersistence.saveAsync` | 🟡 绕过 | 异步写入不经 PathGuard | 迁移到 `wz.writeFileAsync()` |
| `checkpoint.ts` 部分函数 | 🟡 绕过 | `saveDimensionCheckpoint` 异步写入无 PathGuard | 迁移到 `wz.writeFileAsync()` / `wz.ensureDirAsync()` |
| `runAllPhases` 内 PathGuard 配置 | 🟡 边界 | 若进程内未跑 `Bootstrap.initialize()`，Ghost `dataRoot` 不在白名单 | WriteZone 在 guard 失败时给出诊断信息 |

## 9. 完整文件清单（写入操作分区总表）

### Zone A — Project Root（37 处）
必须留在真实项目目录的文件。

| 文件 | 操作 | 目标 |
|------|------|------|
| `RulesGenerator.ts` | writeFileSync ×3, mkdirSync ×1 | `.cursor/rules/*.mdc` |
| `SkillsSyncer.ts` | cpSync ×1, mkdirSync ×2, writeFileSync ×2 | `.cursor/skills/asd-*` |
| `CursorDeliveryPipeline.ts` | mkdirSync ×3, writeFileSync ×2, copyFileSync ×2 | `.cursor/skills/alembic-devdocs`, `.qoder/`, `.trae/` |
| `FileDeployer.ts` | writeFileSync ×12, mkdirSync ×8, copyFileSync ×5 | `.cursor/`, `.vscode/`, `.github/`, `AGENTS.md`, `.gitignore` |
| `FileProtection.ts` | writeFileSync ×6, copyFileSync ×2, mkdirSync ×1 | Channel F 根文件 |
| `skill.ts` (MCP) | mkdirSync ×1, writeFileSync ×1 | `.cursor/rules/alembic-skills.mdc` |
| `ai.ts` (HTTP) | writeFileSync ×1 | 根 `.env` |
| `SetupService.ts` | copyFileSync ×1, writeFileSync ×1 | 根 `.env` |

### Zone B — Data Root（75+ 处）
知识库和运行时数据，Ghost 模式下应外置到 `~/.asd/workspaces/<id>/`。

| 文件 | 操作 | 目标 | sync/async |
|------|------|------|------------|
| `CleanupService.ts` | mkdirSync ×3, renameSync ×1, cpSync ×1, rmSync ×3, writeFileSync ×1 | `.asd/.trash/`, 知识库目录重建 | sync |
| `KnowledgeFileWriter.ts` | mkdirSync ×1, writeFileSync ×1 | `Alembic/recipes/**/*.md` | sync |
| `WikiGenerator.ts` | mkdirSync ×1, writeFileSync ×2 | `Alembic/wiki/` | sync |
| `wiki-external.ts` | mkdirSync ×1, writeFileSync ×2 | `Alembic/wiki/` | sync |
| `skill.ts` (MCP) | mkdirSync ×1, writeFileSync ×2, rmSync ×1 | `Alembic/skills/` | sync |
| `SetupService.ts` | mkdirSync ×2, writeFileSync ×5, copyFileSync ×3, cpSync ×1, rmSync ×1, renameSync ×2 | `.asd/`, `Alembic/` 初始化 | sync |
| `checkpoint.ts` | mkdir ×1, writeFile ×1, rm ×1 | `.asd/bootstrap-checkpoint/` | **async** |
| `orchestrator.ts` | mkdir ×1, writeFile ×1 | `.asd/bootstrap-report.json` | **async** |
| `BootstrapSnapshot.ts` | 快照写入 | `.asd/` | **async** |
| `ConversationStore.ts` | mkdirSync ×2, appendFileSync ×1, writeFileSync ×2 | `.asd/conversations/` | sync |
| `MemoryEmbeddingStore.ts` | mkdirSync ×1, writeFileSync ×1 | `.asd/context/` | sync |
| `SignalTraceWriter.ts` | mkdirSync ×1, appendFileSync ×1 | `.asd/logs/signals/` | sync |
| `ErrorTracker.ts` | mkdirSync ×1, appendFileSync ×1 | `.asd/logs/errors/` | sync |
| `ReportStore.ts` | mkdirSync ×1, appendFileSync ×1 | `.asd/logs/reports/` | sync |
| `SignalModule.ts` | mkdirSync ×1, appendFileSync ×1 | `.asd/logs/signals/` | sync |
| `GraphCache.ts` | mkdirSync ×1, writeFileSync ×1 | `.asd/cache/` | sync |
| `FeedbackCollector.ts` | mkdirSync ×2, writeFileSync ×2 | `Alembic/feedback.json` | sync |
| `FeedbackStore.ts` | mkdirSync ×1, appendFileSync ×1 | `.asd/feedback.jsonl` | sync |
| `RuleLearner.ts` | mkdirSync ×2, writeFileSync ×2 | `Alembic/guard-learner.json` | sync |
| `ExclusionManager.ts` | mkdirSync ×2, writeFileSync ×2 | `Alembic/guard-exclusions.json` | sync |
| `HnswVectorAdapter.ts` | mkdirSync ×2, renameSync ×1 | `.asd/context/index/` | sync |
| `JsonVectorAdapter.ts` | mkdirSync ×1, writeFileSync ×1 | `.asd/context/index/` | sync |
| `BinaryPersistence.ts` | mkdirSync ×2, writeFileSync ×1, writeFile ×1 | `.asd/context/index/` | **混合** |
| `AsyncPersistence.ts` | mkdirSync ×1, appendFileSync ×1 | `.asd/context/index/*.wal` | sync |
| `autoApproveInjector.ts` | mkdirSync ×1, writeFileSync ×1 | `.asd/.auto-approve-pending` | sync |
| `DatabaseConnection.ts` | mkdirSync ×1 | `.asd/` (DB 父目录) | sync (豁免) |
| `UpgradeService.ts` ⚠ | mkdirSync ×1, cp -r | `.asd/skills/` → `Alembic/skills/` | sync (**Ghost 泄漏**) |
| `DiscovererPreference.ts` ⚠ | mkdirSync ×1, writeFileSync ×1 | `.asd/discoverer-preference.json` | sync (**潜伏泄漏**) |

### Zone C — Global（3 处）

| 文件 | 操作 | 目标 |
|------|------|------|
| `ProjectRegistry.ts` | mkdirSync ×1, writeFileSync ×1 | `~/.asd/projects.json` |
| `Paths.ts` (`ensureDir`) | mkdirSync ×1 | `~/.asd/cache/`, `~/.asd/snippets/` |

## 10. 附录：从 v1 到 v2 的变更清单

| 编号 | v1 设计 | v2 修正 | 原因 |
|------|---------|---------|------|
| A1 | `const enum Zone` | `as const` 对象 + 联合类型 | `isolatedModules: true` 不兼容 `const enum` |
| A2 | 仅同步 API | 同步 + 异步双 API | 8 个文件使用 `fs/promises`，需覆盖 |
| A3 | 仅 DI 注册 | DI + `fromResolver()` + `fromProjectRoot()` | `alembic setup`/`upgrade` 在 DI 之前执行写入 |
| A4 | Zone.Global 用 `assertSafe()` | `#assertGlobalSafe()` 前缀校验 | PathGuard 白名单不包含 `~/.asd/` 全局目录 |
| A5 | `rename` 仅 guard dest | guard src + dest + EXDEV fallback | 跨 Zone rename 可能跨文件系统 |
| A6 | 遗留表 5 项 | 扩展到 11 项 | 新发现 `UpgradeService`、`DiscovererPreference`、`checkpoint.ts`、`BinaryPersistence` 等问题 |
| A7 | 迁移优先级 P0-P4 | P0-P5 + P1.5 新增 | 插入新发现的 Ghost 泄漏修复 + 异步站点批次 |
| A8 | — | 启动时序分析 | 明确 WriteZone 在各链路的可用时间窗 |
| A9 | — | PathGuard 竞态窗口分析 | 确认无竞态但存在 `runAllPhases` 边界 case |
| A10 | — | 链路连通性验证表 | 逐条确认 setup/upgrade/ui/coldstart 链路方案 |
