# 参考实现与本地取舍

本批先以真实消费链为依据，再参考资源生命周期与缓存实现经验。

- [Node.js timers 官方说明](https://nodejs.org/api/timers.html#timeoutunref)：unref 只让 timer 不维持进程存活，并不取消回调。本次仍 unref，同时在空缓存时停止任务；没有把退出控制误当成资源回收。
- [node-lru-cache 官方实现说明](https://github.com/isaacs/node-lru-cache)：TTL 清理与容量/LRU 是不同策略。这里只借鉴明确区分策略的做法；Core 保留已有 60 秒主动回收和 get 时判断，不引入 LRU、容量配置或新依赖。
- 本地 TencentDB-Agent-Memory，固定 commit `06414ac10766b9bd61e4a69f3cf0ea414afb6d4f`：局部阅读 `MemoryCore/src/core/store/store-pool.ts` 的池化、pendingCloses、关闭与 Skill store 淘汰（约 70–180、250–330 行）。它明确区分池化拥有者、借用实例与延迟关闭；本地 Core 的共享内存缓存同样不能交给任一 HTTP 借用者销毁。这是职责上的类比，不是等价实现；没有搬入 Kafka、provider 或 grace-close 机制，也不声称全文审查该外部文件。

测试的独有价值取决于它验证的边界：Core 验证算法/恢复不变量，宿主验证真实包、装配和生命周期。两层测试可以覆盖同一条完整链，但无须各自维护同一套 91 个底层算法 callback。最终取舍由本仓行为映射与实际验证支持，不由项目名或通用“最佳实践”替代。
