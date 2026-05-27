# 统一定时器管理方案

> 设计文档 — 2026-04-17

## 1. 现状问题

### 1.1 定时器分布（18 处）

| 类型 | 数量 | 代表组件 |
|------|------|----------|
| 持久后台定时器 | 9 | SignalCollector, HitRecorder, SignalAggregator, SessionStore, TemporaryToolRegistry, PerformanceMonitor, ErrorTracker, HttpServer/Proposal |
| 模块级裸定时器 | 2 | remote.ts (Lark 健康检查 + 超时清理) |
| 请求级短生命周期 | 5 | SSE 心跳, 长轮询 |
| 基础设施 debounce | 2 | HnswVectorAdapter, AsyncPersistence |

### 1.2 核心问题

1. **无统一注册中心** — 各组件自行管理 `setInterval`/`setTimeout`，shutdown 必须逐一手动调用 `stop()/dispose()/shutdown()`
2. **shutdown 遗漏** — `bin/api-server.ts` 只注册了 `bootstrap` 和 `http-server`，SignalCollector、HitRecorder、SignalAggregator、SessionStore、TemporaryToolRegistry 的清理没有接入 shutdown coordinator
3. **裸模块定时器** — `remote.ts` 的 2 个 `setInterval` 在模块导入时启动，无法从外部清理
4. **unref 不一致** — HitRecorder/SessionStore/TemporaryToolRegistry 做了 unref，SignalAggregator/PerformanceMonitor/ErrorTracker 没有
5. **生命周期语义不统一** — `stop()` / `dispose()` / `shutdown()` / `destroy()` 四种方法名，无统一接口

## 2. 设计方案

### 2.1 核心接口：`Disposable`

```typescript
// lib/shared/lifecycle.ts

/**
 * 可释放资源的统一接口
 * 所有持有定时器、连接、文件句柄的组件必须实现此接口
 */
export interface Disposable {
  /** 释放所有资源（定时器、连接等），幂等调用安全 */
  dispose(): Promise<void> | void;
}

/**
 * 可启停的服务接口（Disposable 的超集）
 * 适用于需要显式 start/stop 生命周期的组件
 */
export interface Startable extends Disposable {
  start(): void;
  /** stop 等价于 dispose，语义更明确 */
  stop(): Promise<void> | void;
}
```

### 2.2 定时器注册中心：`TimerRegistry`

```typescript
// lib/shared/TimerRegistry.ts

import type { Disposable } from './lifecycle.js';

type TimerHandle = ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;

interface TimerEntry {
  label: string;
  handle: TimerHandle;
  kind: 'interval' | 'timeout';
  createdAt: number;
  /** 是否允许阻止进程退出 */
  blocking: boolean;
}

/**
 * TimerRegistry — 全局定时器注册中心
 *
 * 职责：
 *   1. 所有 setInterval/setTimeout 通过此中心创建 → 自动 unref + 记录
 *   2. shutdown 时一键 disposeAll() 清理所有定时器
 *   3. 提供诊断接口：列出活跃定时器（名称、创建时间、类型）
 *
 * 不替代组件内部的定时器引用（组件仍可持有 handle 做 reschedule），
 * 但保证 shutdown 时兜底清理。
 */
class TimerRegistryImpl implements Disposable {
  readonly #timers = new Map<TimerHandle, TimerEntry>();
  readonly #disposables = new Map<string, Disposable>();

  /**
   * 创建 setInterval 并自动注册
   */
  setInterval(fn: () => void, ms: number, label: string, opts?: { blocking?: boolean }): ReturnType<typeof setInterval> {
    const handle = setInterval(fn, ms);
    const blocking = opts?.blocking ?? false;
    if (!blocking && handle.unref) {
      handle.unref();
    }
    this.#timers.set(handle, {
      label,
      handle,
      kind: 'interval',
      createdAt: Date.now(),
      blocking,
    });
    return handle;
  }

  /**
   * 创建 setTimeout 并自动注册
   */
  setTimeout(fn: () => void, ms: number, label: string, opts?: { blocking?: boolean }): ReturnType<typeof setTimeout> {
    const handle = setTimeout(() => {
      this.#timers.delete(handle); // 自然到期后自动移除
      fn();
    }, ms);
    const blocking = opts?.blocking ?? false;
    if (!blocking && handle.unref) {
      handle.unref();
    }
    this.#timers.set(handle, {
      label,
      handle,
      kind: 'timeout',
      createdAt: Date.now(),
      blocking,
    });
    return handle;
  }

  /**
   * 手动清除已注册的定时器
   */
  clear(handle: TimerHandle): void {
    const entry = this.#timers.get(handle);
    if (!entry) { return; }
    if (entry.kind === 'interval') {
      clearInterval(handle);
    } else {
      clearTimeout(handle);
    }
    this.#timers.delete(handle);
  }

  /**
   * 注册一个 Disposable 组件（shutdown 时自动调用 dispose）
   */
  registerDisposable(label: string, disposable: Disposable): void {
    this.#disposables.set(label, disposable);
  }

  /**
   * 移除已注册的 Disposable
   */
  unregisterDisposable(label: string): void {
    this.#disposables.delete(label);
  }

  /**
   * 清理所有定时器 + 调用所有已注册 Disposable 的 dispose
   */
  async dispose(): Promise<void> {
    // 1. 清除所有定时器
    for (const [handle, entry] of this.#timers) {
      if (entry.kind === 'interval') {
        clearInterval(handle);
      } else {
        clearTimeout(handle);
      }
    }
    this.#timers.clear();

    // 2. 调用所有 Disposable（并行，单个失败不阻断）
    const results = await Promise.allSettled(
      [...this.#disposables.entries()].map(async ([label, d]) => {
        try {
          await d.dispose();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`[TimerRegistry] dispose "${label}" failed: ${msg}\n`);
        }
      })
    );
    this.#disposables.clear();
  }

  /**
   * 诊断：列出所有活跃定时器和 Disposable
   */
  diagnostics(): { timers: Array<{ label: string; kind: string; ageMs: number }>; disposables: string[] } {
    const now = Date.now();
    return {
      timers: [...this.#timers.values()].map(e => ({
        label: e.label,
        kind: e.kind,
        ageMs: now - e.createdAt,
      })),
      disposables: [...this.#disposables.keys()],
    };
  }

  /** 活跃定时器数 */
  get timerCount(): number { return this.#timers.size; }

  /** 注册的 Disposable 数 */
  get disposableCount(): number { return this.#disposables.size; }
}

/** 全局单例 */
export const timerRegistry = new TimerRegistryImpl();
```

### 2.3 接入 Shutdown Coordinator

```typescript
// bin/api-server.ts 或 bin/mcp-server.ts 启动时
import { shutdown } from '#shared/shutdown.js';
import { timerRegistry } from '#shared/TimerRegistry.js';

// 注册为第一个 shutdown hook（最后执行，兜底清理所有残留定时器）
shutdown.register(() => timerRegistry.dispose(), 'timer-registry');
```

## 3. 各组件改造计划

### 3.1 第一优先级：修复裸定时器（无清理机制）

| 组件 | 改造 |
|------|------|
| `remote.ts` Lark 健康检查 | 提取为 `LarkHealthChecker` 类，实现 `Disposable`，通过 `timerRegistry.setInterval()` 创建定时器 |
| `remote.ts` 超时清理 | 合并到 `LarkHealthChecker` 或独立 `RemoteCommandCleaner` 类 |

### 3.2 第二优先级：统一 unref + 注册

| 组件 | 改造 |
|------|------|
| `SignalAggregator` | `start()` 中使用 `timerRegistry.setInterval()`，`stop()` 中使用 `timerRegistry.clear()` |
| `PerformanceMonitor` | 构造函数中使用 `timerRegistry.setInterval()` |
| `ErrorTracker` | 同上 |
| `SignalCollector` | `start()` 和 `#tick()` 中使用 `timerRegistry.setTimeout()` |

### 3.3 第三优先级：统一 Disposable 接口

| 组件 | 现状 | 改造 |
|------|------|------|
| `SignalCollector` | `stop()` | 实现 `Startable`，`dispose()` 委托 `stop()` |
| `HitRecorder` | `start()`/`stop()` | 实现 `Startable` |
| `SignalAggregator` | `start()`/`stop()` | 实现 `Startable` |
| `SessionStore` | `dispose()` | 实现 `Disposable` ✅ 已兼容 |
| `TemporaryToolRegistry` | `dispose()` | 实现 `Disposable` ✅ 已兼容 |
| `PerformanceMonitor` | `shutdown()` | 改为 `dispose()`，实现 `Disposable` |
| `ErrorTracker` | `shutdown()` | 改为 `dispose()`，实现 `Disposable` |
| `EventAggregator` | `destroy()` | 改为 `dispose()`，实现 `Disposable` |
| `HnswVectorAdapter` | 内部 flush | 实现 `Disposable`，`dispose()` 执行 final flush + clearTimeout |

### 3.4 不改造（短生命周期，自清理）

| 组件 | 原因 |
|------|------|
| SSE 心跳 (`sse.ts`) | 绑定 HTTP 请求生命周期，连接关闭时自动 clear |
| 长轮询心跳 (`candidates.ts`, `modules.ts`, `ai.ts`) | 同上 |
| `AsyncPersistence` WAL flush | debounce 定时器，flush 完自清理 |

## 4. DI 容器集成

```typescript
// lib/injection/Modules.ts — 服务注册时
container.registerSingleton('timerRegistry', () => timerRegistry);

// 各模块构造时从容器获取 timerRegistry
class SignalAggregator {
  constructor(signalBus, reportStore, opts, timerRegistry) {
    // ...
    this.#timer = timerRegistry.setInterval(() => void this.#flush(), this.#intervalMs, 'SignalAggregator');
  }
}
```

组件 shutdown 时，DI 容器的 `shutdown()` 方法自动调用所有已注册 Disposable 的 `dispose()`。

## 5. 实施步骤

```
Phase 1 — 基础设施（不影响现有逻辑）
  ├─ 创建 lib/shared/lifecycle.ts（Disposable / Startable 接口）
  ├─ 创建 lib/shared/TimerRegistry.ts
  └─ 在 shutdown coordinator 中注册 timerRegistry

Phase 2 — 修复裸定时器
  ├─ 重构 remote.ts 的模块级 setInterval → 类封装
  └─ 注册到 timerRegistry

Phase 3 — 逐步迁移
  ├─ 各组件实现 Disposable 接口
  ├─ 替换 setInterval/setTimeout → timerRegistry.*
  └─ 补齐 unref

Phase 4 — 验证
  ├─ 单元测试 TimerRegistry
  ├─ 集成测试 shutdown 全链路
  └─ 监控诊断接口（/api/v1/diagnostics/timers）
```

## 6. 诊断 API（可选）

```
GET /api/v1/diagnostics/timers

{
  "activeTimers": [
    { "label": "HitRecorder.flush", "kind": "interval", "ageMs": 45000 },
    { "label": "SignalCollector.tick", "kind": "timeout", "ageMs": 12000 },
    ...
  ],
  "disposables": ["SignalCollector", "HitRecorder", "SignalAggregator", ...],
  "summary": { "totalTimers": 6, "totalDisposables": 8 }
}
```
