# CacheService / UnifiedCacheAdapter 消费与生命周期追踪

日期：2026-09-20。开始审查时 Core HEAD：`c1f6d7760a5fe0549420b72babea39b4f9c02e3d`。

本轮只读追踪 Core 缓存实现、package 转发和 Main/Plugin 的活跃源码调用。没有修改产品或宿主，没有运行测试、启动 HTTP 服务或修改控制状态。主审负责 CacheService 修复与测试；本文记录旧实现、已观察到的候选 diff 和消费者兼容约束。

## 结论

- `new CacheService()` 的 Map 与 timer 属于该 CacheService 实例。
- 导出的 `cacheService` 是模块级单例；默认的所有 `UnifiedCacheAdapter` 实例都借用它。因此在同一 Core 模块实例内，adapter 不拥有独立缓存，也不拥有单独关闭共享缓存的权力。这不是跨进程/worker 共享缓存。
- Main 的 HttpServer 是真实初始化消费者。三个 bin 入口调用它；HttpServer 只保存 adapter，没有用它读取、写入、删除或清空 HTTP 缓存数据。
- Plugin 保留 package 转发文件，但本轮活跃源码扫描没有找到该 adapter 的初始化或数据操作。转发是公开兼容链，不能据此认定 Core 公共 API 可以删除。
- 旧实现存在具体生命周期缺口：导入公共 cache barrel 就创建空缓存 timer；shutdown 取消 timer 却不归零句柄，后续 set 仍可写但不会恢复周期清理。主审提出并已落盘的 lazy timer 方向与现有宿主所有权吻合。

## 实际审查范围

全文阅读：

- Core `src/infrastructure/cache/CacheService.ts` 的旧实现，以及本轮 lazy timer 完整 diff。
- Core `src/infrastructure/cache/UnifiedCacheAdapter.ts`、cache barrel，以及 `src/infrastructure/index.ts`。
- Main/Plugin 的 `lib/infrastructure/cache/{CacheService,UnifiedCacheAdapter,GraphCache}.ts` 转发文件。
- Main `lib/http/HttpServer.ts` 全文，共 639 行。
- Main `lib/infrastructure/cache/CacheCoordinator.ts` 全文，共 128 行。

局部调用追踪：

- Main `bin/daemon-server.ts` 的创建/初始化、EADDRINUSE 重试、关闭注册。
- Main `bin/api-server.ts` 的初始化、服务启动和关闭注册。
- Main `bin/cli.ts` 的动态 HttpServer 导入、实例化、start、Dashboard 挂载及开发模式退出路径。
- Main `ServiceContainer.#initCacheCoordinator`。
- Core/Main/Plugin package 相关 exports、imports 和本地 Core 依赖。
- `test/EntrypointEffects.test.ts` 中 import 效果测试；`PublicFoundationEntrypoints` 的 GraphCache 导入位置。新出现的 `CacheService.test.ts` 仅作消费者定位，未执行或独立验收。

扫描范围包括 Core `src/test/scripts`、Main 与 Plugin 的活跃源码和 bin/scripts，以及 Agent `src`；package/config 引用另外核对。排除 vendor、node_modules、dist 和生成产物。宿主测试中作为解析器输入字符串出现的 `CacheService?` 不计为运行消费者。

## 导出、别名与真实调用链

| 位置 | 实际关系 |
| --- | --- |
| `AlembicCore/package.json:269` | `./infrastructure/cache` 映射到 `dist/infrastructure/cache/index.js` 与 `.d.ts`，是明确存在的公开 package 子路径。 |
| `src/infrastructure/cache/index.ts:2–4` | `export *` 转发 CacheService、GraphCache、UnifiedCacheAdapter 模块；CacheService、CacheKeyBuilder、cacheService、UnifiedCacheAdapter、initCacheAdapter、getCacheAdapter 的命名表面保留。 |
| `UnifiedCacheAdapter.ts:7` | `cacheService as memoryCacheService` 是内部别名；constructor 将同一对象赋给公开 `memoryService` 字段。不是每个 adapter 创建一个 CacheService。 |
| Main `lib/infrastructure/cache/CacheService.ts:2` / `UnifiedCacheAdapter.ts:2` | 两个旧路径均 `export * from '@alembic/core/infrastructure/cache'`。 |
| Plugin 同名两个旧路径 | 同样转发整个 Core cache 子路径，不能只搜直接 import 类名就判定无公开消费者。 |
| Main/Plugin `GraphCache.ts:2` | 具名转发 GraphCache，但模块来源仍是整个 cache barrel；旧实现中加载该 barrel 也会执行 cacheService 的模块级构造。没有找到活跃宿主对这些 GraphCache shim 的进一步直接调用，不能将潜在加载链冒称当前业务调用。 |
| Main `HttpServer.ts:14` | 从旧 UnifiedCacheAdapter 路径具名导入 `initCacheAdapter`，实际执行落到 Core。 |

Main `package.json` 使用 `@alembic/core: file:../AlembicCore`；Plugin 同样使用该本地依赖。两仓 `#infra/*` 条件别名分别指向源 `lib/infrastructure/*` 或构建后的 `dist/lib/infrastructure/*`，并未形成第二份 cache 实现。

此处确认的是 package 子路径及其转发链，不需要假设 Core 顶层根入口导出了缓存类。没有以“未搜到直接 import”作为删除判断。

## HttpServer 字段读写与启停

`cacheAdapter` 的全部活跃宿主引用已定位：

1. `HttpServer.ts:64`：公开字段声明为 unknown。
2. `HttpServer.ts:85`：constructor 写入 null。
3. `HttpServer.ts:119`：initializeServices 写入 `await initCacheAdapter({ mode: 'memory' })` 的返回值。

全文和跨仓扫描未发现后续字段读取、解构、传给 middleware/routes，或经它调用 get/set/delete/clear/getStats/healthCheck。也未发现外层直接调用 `getCacheAdapter()`。因此当前 Main 是**初始化并持有句柄的消费者**，不能据类头“集成缓存”就宣称 HTTP 响应已经使用缓存。

`initialize()` 先调用 initializeServices，再注册 middleware/routes。`start()` 创建 HTTP server、监听并建立 realtime bridge，不负责初始化或重建 cache。`stop()`（约 501 行）关闭流响应、WebSocket 和 HTTP listener，没有清空 adapter 字段，也没有关闭 CacheService。

真实入口：

| 入口 | 创建与关闭行为 |
| --- | --- |
| Main `bin/daemon-server.ts:361` | `new HttpServer → initialize → start`；EADDRINUSE 时再建一个 port=0 的 HttpServer，并重复 initialize/start。两个实例仍得到同一个 Core adapter。 |
| 同文件约 181 行 | shutdown 注册等待 `httpServer.stop(...)`；另有 timerRegistry.dispose。未注册 cacheService.shutdown。 |
| Main `bin/api-server.ts:82` | 创建、initialize、start；约 98 行注册等待 stop，约 102 行注册 timerRegistry.dispose。没有 cache 关闭调用。 |
| Main `bin/cli.ts:2439` | 动态导入默认 HttpServer；2452 行实例化并 initialize/start；之后挂载 Dashboard。开发模式 SIGINT/SIGTERM 分支结束 Vite 并退出进程；该路径没有读取 cacheAdapter 或专门关闭 cache。 |

本轮未执行端口冲突、停服或进程重启测试。上表来自实际入口代码与引用追踪。新进程会重新加载自己的模块单例；同进程再次 initialize 会复用 `initCacheAdapter` 已保存的实例。

## 容易混淆的另一套缓存生命周期

Main 的 `CacheCoordinator` 是 SQLite `PRAGMA data_version` 轮询器，不是 Core CacheService 的 owner。

`ServiceContainer.#initCacheCoordinator`（约 216 行）将它注册到容器，并订阅 GuardCheckEngine.clearCache 与 SearchEngine.buildIndex。长驻模式才启动它。CacheCoordinator 使用 timerRegistry，并可 stop/dispose。

Core CacheService 旧实现使用原生 `setInterval`，没有注册到 timerRegistry。故宿主的 `timerRegistry.dispose()` 不能被当成已关闭 CacheService 的证据。本轮不把 Guard/Search 的真实缓存消费误算为 UnifiedCacheAdapter 的消费。

## 公开字段与所有权约束

已定向扫描以下公开或别名路径：`cacheService`、`memoryCacheService`、`memoryService`、`cacheAdapter`、`cleanupInterval`、`CacheKeyBuilder`，并追踪命中 import/export 的别名。

- 当前 Main/Plugin/Agent 活跃源码未发现直接 `cacheService.cache.set/delete/clear`、替换该 Map、读取/改写 `cleanupInterval`，或通过 adapter.memoryService 直接管理 timer。
- Agent `SessionStore.cleanupIntervalMs` 是另一实现的配置，不是 Core CacheService 字段消费者。
- 同仓 Core 的直接 memoryService 调用全部位于 UnifiedCacheAdapter 的委托方法中。其 set/get/delete/clear/统计和健康返回合同仍须保留。
- 这些字段在公开类上可见、可写，因此扫描结论只覆盖当前工作树，不能证明外部 package 用户没有直接访问它们。

特别不能将 `HttpServer.stop()` 改为无条件调用 `cacheAdapter.memoryService.shutdown()`：同进程的其它 adapter/HttpServer 也借用这份单例，单个宿主停止不获得共享缓存的销毁权。

## 具体问题与最小方案

### 旧实现的实际缺口

1. CacheService constructor 即创建 60 秒 unref interval；模块末尾立即 `new CacheService()`。即使只有初始化、缓存始终为空，timer 也一直存在。unref 只是不阻止退出，不代表没有 timer 或周期回调。
2. shutdown 清除 interval 和 Map，但不将 `cleanupInterval` 置 null。对象没有 closed 状态，之后 set 仍成功；旧 set 不建立 timer，未读取的过期项就失去周期回收。不能把这个已存在的可写行为误认为明确的终态禁止写入合同。
3. `initCacheAdapter` 保留全局实例，没有 reset/shutdown API；cacheService.shutdown 后再 init 仍拿到原 adapter。仅修改宿主重复 initialize 不能修复底层 timer 状态。

这些是 Core 资源生命周期问题；当前 HttpServer 并未调用 shutdown，不能把它们夸大成已经发生的宿主停服数据故障。

### 与消费者匹配的最小方案

主审当前方案合理：constructor 和空缓存不持有清理 timer；通过 CacheService.set 写入后启动唯一 unref interval；get 淘汰最后一个过期项、delete、clear、cleanup 清空后停 timer 并归零句柄；shutdown 后下一次 set 恢复周期回收。

已经读取候选 diff，确认它没有增加宿主关闭权、没有改共享 singleton 身份、没有改 CacheKeyBuilder、adapter 方法或 package 导出。

应保留的既有语义：

- TTL 仍按 `expiresAt < Date.now()`，不顺手改到 `<=`。
- get 返回实际 value，0/false 不是 miss；miss 仍为 null。
- delete 仍返回 Map.delete 的 boolean；CacheService.set/clear 的既有返回约定及 adapter 包装不变。
- getStats 仍是当前 Map 视图，不追加隐式清理或 readiness 探测。
- clear 清空同一个 Map，不通过替换 Map 改变外部已持有引用。
- init 的 mode 参数仍是现有 memory 兼容占位，不宣称新增 Redis 或实例隔离。

需要明确记录的兼容变化：

- `cleanupInterval` 在 constructor/空缓存/shutdown 后为 null；周期起点从构造改为首次 set。这是有意的生命周期变化，不能描述为所有公开字段状态逐字不变。
- 直接写公开 Map 或替换 Map 会绕过 CacheService.set；当前宿主没有此消费者，但不能承诺这种外部直接写法仍自动启动 timer。本轮不建议为未确认消费者引入 Proxy、自定义 Map 或新公共接口。
- getStats 对未读取过期项的可见时长可能随周期相位变化；实际键的 get TTL 判定不变。

## 证据与验证声明

引用搜索不仅检查直接类名，还包括 package 子路径、旧 shim 路径、export *、`memoryCacheService` 别名、HttpServer.cacheAdapter 字段，以及 bin 入口中的默认 HttpServer 导入和变量使用。

本轮未运行大测试，也未独立执行新 CacheService fake-clock 用例。Core 修复的 RED/GREEN、timer 数量及重启行为验证由主审负责。本文没有使用未执行测试作为完成证据，也不据此建议删除公开 cache API。
