# 缓存生命周期与测试归属整合

日期：2026-09-20。用户确认继续上一批提出的跨仓重复测试与缓存生命周期审查。

本批完成两项优化：缓存后台任务跟随真实数据启停，关闭后复用可以恢复过期回收；向量行为测试按拥有模块维护，插件删除 91 项已有 Core 覆盖的算法副本，保留真实 package 与宿主接入检查。

## 提交与实现

| 仓库 | 提交 | 内容 |
| --- | --- | --- |
| AlembicCore | `d39b231c8b0c47254b02a6eb882ec451c6ff0913` | 缓存空闲不创建 interval、数据清空后释放、shutdown 后 set 恢复回收；3 项生命周期/兼容回归 |
| AlembicCore | `9e8d033ac4dbab4e3555d243fc711269b48eeab9` | 原 21 组向量测试原样分配给 HNSW、持久化、管线和排名文件；显式静态导入代替延迟赋值 |
| AlembicPlugin | `876a06e1cf42e13605cdd96536f54e42236af7c9` | 删除 1832 行 HnswVector 测试副本；在既有 VectorPipeline 文件增加 1 项完整 package 接入链 |
| AlembicPlugin | `54aeef03ca17532136f356ee6981bc0ac671a2b0` | 最终复核修正 fixture 的 reader/sparse 声明接入，省略无provider用例的冗余 null；全部断言保留 |
| Alembic | no-commit | 当前只通过已有 cache shim 初始化共享 adapter；实际导入/读写/清理探针与类型检查通过，无需改装配或赋予 HTTP 服务缓存销毁权 |

Core 先验证并提交，宿主随后完成测试整合。没有修改 vendor/release 指针、依赖或 Wakeflow 状态，没有发布/push。Core dist 已构建但不提交；原有 AGENTS.md、CLAUDE.md 和 Core 未跟踪 coverage/index.ts 保留。

## 逐文件与调用链结论

[file-review.json](file-review.json) 记录 13 份文件的实际阅读/修改范围与源码摘要。完整缓存实现审查与宿主局部调用追踪分开标注，不宣称全部仓库已审完。

缓存调用链：Main 的 daemon/api-server/CLI 创建 HttpServer → initializeServices → 宿主转发模块 → Core initCacheAdapter → 共享 cacheService。当前宿主只是初始化并持有，未发现实际 HTTP get/set 消费；所有默认 adapter 都借用同一个模块实例。因此某一 HttpServer.stop 不应取得共享缓存销毁权。CacheCoordinator 是另一种 SQLite data_version 失效协调，不与这个 TTL Map 合并。

CacheService 自己维护数据/清理任务状态：空实例不启动 interval；首次 set 启动唯一 60 秒 unref interval；最后一条被 get/delete/cleanup 移除或 clear 时停止；shutdown 清空，后续 set 可重新启动。保持 TTL 秒、严格 `expiresAt < now` 边界、null miss、false/0 数据以及 getStats 不主动清理。原有 Redis/分布式支持注释与实际实现不符，已更正。

独立复核见 [cache-consumers.md](cache-consumers.md)、[cache-review.md](cache-review.md)。产品契约随源码维护在 `AlembicCore/docs/cache-lifecycle.md`。

## 测试归属与删除依据

| 所有者 | 现在承担的行为 |
| --- | --- |
| Core HnswVector.test.ts，2432 → 910 行 | HNSW 图、heap、量化、召回、store 查询及 HNSW RRF |
| Core VectorPersistence.test.ts，803 行 | binary 快照、迁移、WAL、恢复、并发落盘 |
| Core VectorPipeline.test.ts，487 行 | 批处理、chunk/AST、文件索引的增量写入和清理 |
| Core SearchRanking.test.ts | 在原排名覆盖基础上接收通用 HybridRetriever 的数学/DTO 契约 |
| Plugin VectorPipeline.test.ts | 既有 8 项保留，新增 package→embedding port→真实 pipeline→flush/重开→两种 hybrid 返回契约 |
| Plugin 既有宿主测试 | DI、provider 选择、维护等待、generation 和关闭顺序保持独立 |

Core 原 21 个完整 describe 的源码（包含断言、hooks 和模板字符串）与基线逐组 SHA256 完全相同，且每组只有一个新所有者；见 [core-test-moves.json](core-test-moves.json) 与 [verify-core-test-moves.mjs](verify-core-test-moves.mjs)。证明不包含 import 初始化，因此还必须实际运行拆分后的套件。

插件 91 项中，85 个 callback 经 TypeScript AST printer 正规化后与 Core 相同；另 6 项逐体检查，Core 均有等价或更强覆盖，其中批量回退归 EmbeddingPort。见 [plugin-duplicate-proof.json](plugin-duplicate-proof.json)、[hnsw-vector-ownership.md](hnsw-vector-ownership.md) 和逐项 JSON 映射。删除前扫描未发现活跃脚本/文档依赖旧测试路径，且替代接入链已通过。

新插件测试使用临时目录、真实 Core 包构建产物和真实存储；embedding 是确定性离线夹具。它验证持久化重开与消费结果，不宣称实测模型质量、进程 kill/crash 或 ANN 召回率。算法与 WAL 故障矩阵继续在 Core 执行。

## 验证与自审

| 验证 | 最终结果 |
| --- | --- |
| Core npm run check | 退出 0；196 suites 通过、1 原有 skipped；2202 tests 通过、1 原有 skipped |
| Core 拆分相关六套测试 | 189 项通过 |
| Core build / 公共 API / 分层 / consumer imports / smoke / budgets / doctrine / naming / Biome | 均由完整 check 通过 |
| Core npm run build:check | 通过 |
| Main 与 Plugin tsc --noEmit | 均通过 |
| Main cache shim → Core 包实际运行探针 | 通过：共享实例、空闲无 timer、set/get 假值、unref、clear 释放 |
| Plugin 七套接入/宿主测试 | 43 项通过 |
| Plugin 最终 fixture 修正 | 目标文件 9 项再次通过；文件全部 TypeScript 语义诊断为 0 |
| Plugin 修改文件 Biome / commit hook | 通过，无诊断 |
| Core/两宿主 git diff --check | 通过 |

命令和中间失败完整记录在 [verification.md](verification.md) 与 [checks.jsonl](checks.jsonl)，没有省略失败以制造全绿叙述。运行使用已安装 Node 22.23.2。

阶段一范围自审：本次只有缓存生命周期产品修改、明确测试职责重排及获准的宿主测试清理；68 个 package exports key/映射与基线一致，未削减算法、持久化或宿主能力。四个 Core 硬边界套件保留并在完整检查中运行。

阶段二质量自审：关闭后重用无法自动回收的问题已修复；空闲常驻 timer 已移除。拆分时的遗漏 imports、测试时把日志 immediate 计入 timer 的仪器问题均已修正后重新验证。最终独立审查发现新 fixture 违反公开 reader/sparse 的类型声明（Vitest 可运行，而宿主 no-emit 不含测试），已在 fixture 内适配并对整个文件确认零语义诊断；没有放宽 Core API 或使用 any。证据见 [final-plugin-vector-types-complete.json](final-plugin-vector-types-complete.json)。当前明确修改范围内没有未处理 P1/P2。

## 兼容边界、剩余事项和下游建议

- cache 与 cleanupInterval 字段仍可见；空实例 handle 现在为 null，周期从首次写入开始。直接改 Map 或 timer 会绕过方法调度，不能宣称这种外部字段改写也完全等价；活跃消费扫描未发现该用法。本次不为假设的写法增加 Proxy 或新 API。
- timer 仍 unref，变化是空闲后台工作与重用回收，不应把旧实现描述为阻止进程退出。
- 未运行两个宿主全量套件、外部模型网络或插件发布/安装/会话验收；本次未改这些入口。
- 两个宿主继续通过 file 依赖消费已构建 Core，无需迁移 package 导入或更新 vendor。
- 下一批可继续逐条加强本次发现的弱测试断言（overlap、level clamp、qvector 恢复及“crash”命名），并追踪其真实实现。它们是原持续 review 目标下的审查发现，尚未证实产品缺陷，也未在本批冒充已修复。具体边界见覆盖审查报告。
