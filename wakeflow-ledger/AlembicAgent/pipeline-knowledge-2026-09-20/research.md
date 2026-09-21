# 本轮参考与采用判断

访问日期：2026-09-20。参考只为当前实际调用链提供设计依据，不引入新的 workflow、数据库或宿主。

| 来源 | 已核对的事实 | 本仓库采用方式 |
| --- | --- | --- |
| [Node 22 AbortSignal](https://nodejs.org/download/release/v22.23.1/docs/api/globals.html#class-abortsignal) | abort 通知监听者；文档建议注册前检查 aborted，并用 once 清理取消监听。 | shared/operation 统一拥有 timer/listener；父取消与 timeout 先确定终态，再传播子 signal；结束后清理资源。业务层分别指定默认期限。 |
| [Temporal Activity Execution](https://github.com/temporalio/documentation/blob/main/docs/encyclopedia/activities/activity-execution.mdx) | Activity 可能忽略取消；调用方可决定是否等待其接受取消。Timeout 可能来自任务失联，不能直接证明函数未被执行。 | 将“停止本次等待”与“外部写入已回滚”分开。保留已观测工具与真实 Core 创建回执；未知执行历史的硬超时不能凭零回执自动重试。这里是针对本仓库的设计推论，不声称引入 Temporal 的持久执行保证。 |
| 本地 TencentDB-Agent-Memory `06414ac10766b9bd61e4a69f3cf0ea414afb6d4f`：MemoryProxy/src/injection/prewarm.ts:68、143、169 | prewarm 分别设置 hook 和总期限，将失败投影为结构化状态；withTimeout 仅结束等待，没有传播 AbortSignal。总期限的 timer 在快速完成时仍会保留。 | 借鉴明确期限与结构化结果；使用本仓库已有的可取消、可清理生命周期实现，避免复制只 race 不取消或不清理的代码。 |
| 同一 Tencent 基线：MemoryProxy/src/injection/pipeline.ts:503 | observer 的异常通过 safeCall 隔离，避免回流到主处理。 | 只在 Core 确认写入后，把 readiness/会话记录错误标记为附加处理降级；保留明确日志与诊断。不能把权限、证据或 Core 持久化异常作为普通 observer 吞掉。 |

前轮 Tencent hook registry/context/pipeline/observer 职责分离的复核详见 `../layering-2026-09-19/reviews/middleware-research.json`。本轮继续按能力归属划分模块，以实际消费者、类型边界与行为回归决定拆分，不按长度删除能力。

`LangGraph durable-execution` 的当前官方 JavaScript URL 重定向到 persistence，本轮未用旧页面推导额外保证，也不以非官方镜像作技术依据。
