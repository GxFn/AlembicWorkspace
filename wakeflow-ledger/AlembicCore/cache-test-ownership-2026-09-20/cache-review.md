# CacheService 生命周期独立审查

日期：2026-09-20。对照基线 HEAD `c1f6d77` 与本批未提交改动。本审查仅检查缓存生命周期，不接管主线程正在整理的 HNSW/测试归属切片。

结论：在已发现的真实消费者及 CacheService/UnifiedCacheAdapter 方法调用路径上，未发现 P1/P2。TTL 秒、严格过期边界、null miss、共享实例和 shutdown 后可重用语义保留；自动回收在重用后恢复。公开 Map/interval 字段仍可由外部改写，任意直接字段操作不在定时器同步的可观察范围内；下面明确记录一个可复现差异，不将它隐藏成“所有公开字段操作均完全等价”。

本审查者未修改产品或测试、未运行 Vitest/构建/全量检查，仅运行一个隔离内存探针并写本文档。没有新增 API、修改宿主关闭链或取得共享缓存销毁权。

## 实际读取范围

完整读取：

- `src/infrastructure/cache/CacheService.ts` 的 HEAD 基线全文、当前文件全文及完整 diff；CacheKeyBuilder 的公开键格式和模块单例出口无变化。
- `src/infrastructure/cache/UnifiedCacheAdapter.ts` 全文；本批没有修改该文件。
- `src/infrastructure/cache/index.ts` 全文。
- `test/CacheService.test.ts` 全部 3 个用例。
- Main 的 `lib/infrastructure/cache/UnifiedCacheAdapter.ts` 两行 Core re-export。

局部追踪，不计全文审查：

- Main `lib/http/HttpServer.ts` 缓存初始化约 115–129 行，以及 stop 约 500–532 行。
- Core/两宿主源码及测试中 CacheService、cacheService、UnifiedCacheAdapter、memoryService、cleanupInterval 和直接 Map 操作的符号扫描。
- Core `package.json` 的 `./infrastructure/cache` 出口、PublicFoundationEntrypoints 的 GraphCache barrel 消费、GraphCache 的相关搜索结果。未全文审查 GraphCache。
- 本目录 `execution-plan.md` 与审查时的 `checks.jsonl`；其中主线程检查记录不冒称本审查者执行。

## 真实消费与所有权

1. UnifiedCacheAdapter 构造函数始终将 memoryService 指向导入的模块级 cacheService；直接 new 多个 adapter 仍共享同一个 Map 和回收任务。
2. initCacheAdapter/getCacheAdapter 使用适配器单例；`initialize()` 仅记录内存模式诊断，不产生独立存储或 timer。
3. Main HttpServer.initializeServices 经本地 re-export 调用 Core `initCacheAdapter({mode:'memory'})`。本次扫描没有发现宿主直接写 cacheService.cache 或 cleanupInterval，也未发现宿主调用 cacheService.shutdown。
4. 导入 Core cache barrel（包括只使用 GraphCache 的路径）会实例化 cacheService。旧构造因此即使没有缓存内容也会启动 interval；新实现保持空单例无后台 sweep。
5. adapter 没有独占销毁所有权。不能为了关闭单个 HTTP Server 而新增清空全局共享缓存的宿主调用；本批没有这么做。

## 方法行为与状态核对

| 观察点 | HEAD 行为 | 当前行为/判断 |
| --- | --- | --- |
| 默认 TTL | 300 秒，换算为 `Date.now() + ttlSeconds * 1000` | 表达式及单位完全保留。 |
| 过期判断 | get/cleanupExpired 均使用 `expiresAt < now` | 相等仍命中；没有改为 `<=`。 |
| miss | get 无 entry 返回 null | 保留；0、false 等已存值不被当作 miss。 |
| delete | 返回 Map.delete 的 boolean | 保留；新增回收任务同步，不改变返回值。 |
| clear | 清空同一个 Map，返回 void | 保留，并在空缓存时取消回收任务。 |
| getStats | `{size, entries}`，按 Map 键顺序，无主动过期扫描 | 保留；不是一个隐式 sweep。 |
| 实例化空缓存 | 立即启动每 60 秒的 unref interval | 改为空闲；这是本批明确目标。 |
| 方法写入 | 使用已有常驻 interval | 第一次 set 启动一个 60 秒 interval；后续 set 不重复启动。 |
| 删除/读取过期项 | 数据删除，原 interval 继续存在 | get 删除过期项、delete、clear、cleanupExpired 都同步任务状态；最后一项消失时停 timer 并置 null。 |
| shutdown | 清 interval + clear；后续仍允许 set，但不恢复 sweep | 当前 clear 统一释放数据与 timer；后续 set 恢复 sweep，没有新增永久 closed 状态。 |
| Node 退出 | interval.unref | 当前仍调用 unref，不阻止进程退出。 |

未改变 TTL 取值的既有处理策略，也没有额外加入数值验证或默认值转换。周期的起点从“实例构造”改为“有数据时启动”；这会改变 sweep 的相位，但读取时的严格过期判定保持不变。

## 隔离内存探针

本审查者使用 Node 22.23.2 将当前 CacheService 和 UnifiedCacheAdapter 源码在内存中转译、相互连接。只在该隔离进程替换 Date.now/setInterval/clearInterval，记录 60 秒回调与 unref 调用；手动执行已登记 sweep，未等待真实一分钟。Logger 使用工作区现有依赖并静音，不创建文件 transport。没有写临时源码或测试文件。

探针通过真实公开方法而非复制缓存逻辑，结果为：

```json
{
  "initial": {"timers": 0, "shared": true},
  "initReuse": true,
  "afterWrites": {"timers": 1, "interval": 60000},
  "exact": 0,
  "expired": null,
  "expiredWhileNonempty": 1,
  "lastDelete": 0,
  "shutdown": {"timers": 0, "size": 0, "handle": null},
  "resumed": 1,
  "swept": {"timers": 0, "size": 0},
  "missing": null,
  "unrefs": 3,
  "publicMapBypass": {"timers": 0, "getAfterExpiry": null}
}
```

关键覆盖：两个 new adapter 与模块单例身份一致；重复 init/get 返回同一 adapter；两个 set 只创建一个任务；1 秒 TTL 在 t=1000 仍返回 0、t=1001 返回 null；另一项仍存活时任务保留；删除最后一项停任务；shutdown 后另一 adapter 写入恢复回收；sweep 清空后再次停任务；缺失 key 返回 null。

这是隔离调度探针，不冒称实际 Node timer 在墙钟时间内完整运行，也不替代主线程的正式测试结果。

## 公开可写字段的兼容限制

### cache Map 直接修改

cache 字段和 Map 本身仍保持公开、可写；没有换成 Proxy 或增加新的管理 API。直接 `cacheService.cache.set(...)` 不会调用私有同步逻辑。

已实证：空缓存直接 Map.set 后仍为 0 timer；过期后通过 get 读取仍正确返回 null 并删除条目。HEAD 的构造常驻 timer 原本能在之后扫到这种直接写入，新实现不会仅因 Map 内部变化自动启动任务。因此不能宣称任意公开字段操作的后台回收行为完全不变。

三仓扫描未找到此直接写入的真实消费者。当前可确认的缓存消费使用 CacheService/UnifiedCacheAdapter 方法；对这些路径定时器起停完整。建议将“通过缓存方法更新才同步 timer”作为本次审查限制记录，不为未发现的调用方增加 Proxy、替换 Map 的新类型或恢复无数据常驻任务。

外部直接 clear/替换整个 Map 也不能立即触发同步；若原任务仍存在，下一次 sweep 会看到新状态。该限制与公开字段的可变性有关，不能靠类内部私有方法宣称拦截所有变化。

### cleanupInterval 外部修改

字段仍公开。外部可自行 clearInterval 却留下一个 truthy 旧句柄，也可将字段置 null/替换句柄；类无法仅凭该字段证明某个外部任务是否还活着。HEAD 也不能可靠处理任意外部篡改或追踪丢失的 timer。

本次没有找到相应真实消费者，不将这些任意字段变更推导成新的宿主生命周期需求。保持公开字段兼容，同时避免承诺对外部更换/销毁句柄的自动恢复。

## 三个测试的覆盖判断

1. `keeps the shared cache idle until used and releases its sweep when emptied`：锁定 barrel/adapter 初始化不产生空闲任务，首次写入启动、两键共用一个任务、自动 sweep 清空后停止、再次写入恢复、clear 停止。
2. `resumes automatic expiry when an existing instance is reused after shutdown`：锁定 shutdown 后可写和无人读取时仍能自动过期，避免只测 get 的惰性删除掩盖旧问题。
3. `preserves TTL seconds, the exact expiry boundary and falsy cache values`：锁定秒单位、相等边界、0/false、delete boolean 及最后 delete 后停止。

非阻断覆盖空缺：现有用例没有单独断言“只有一个正常 set 的条目被 get 判过期删除时，timer 立即停止”；代码路径已检查正确。共享多个 adapter、重复 init、直接 missing key 已由本审查的窄探针检查，测试中只有单 adapter 与模块单例身份断言。若要补永久覆盖，可在现有 3 个用例中增加这些断言，不必再建测试文件。

本文不替主线程判断整个测试拆分批次的通过状态。读取检查账本时，`red-cache-lifecycle` 和命名为 `green-cache-lifecycle` 的记录均是 exit 1，不能因为 label 含 green 就称已通过；`cache-types` 记录为 exit 0。后续更新结果以主线程最终检查记录为准。

## 回填

- 产品与测试修改：本审查者无。
- 直接运行：上述隔离内存探针；无大测试或全量检查。
- 结论：真实方法消费路径未发现 P1/P2；公开可写字段的行为边界已明确，不扩为新 API 或宿主销毁权。
- 提交：由主线程统一复核与提交；本审查者没有独立提交。
