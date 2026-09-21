# 宿主转发层清理自审

授权来源：用户确认继续上一轮架构方案，沿用两个外层仓库必要接线授权。事实输入为 interface-architecture-2026-09-20/relay-retirement-review.md。范围仅纯 Core 转发、真实 import 消费者、对应清单与导入说明；不修改宿主业务、MCP schema、provider、generation 或文件写入策略。

## 删除闭环

1. 逐个读过 16 个文件，全部只有 Core re-export。静态/计算路径与跨仓检索见研究记录；9 个无静态 import 文件还有 shared-asset manifest 消费，按真实约束联动退休。
2. 先将 Main 的缓存/shutdown、Plugin 的 shutdown/coverage/event payload 消费者直接迁到既有 Core 子路径。Main 19 项定向回归、Plugin 54 项定向回归通过后删除文件。
3. 删除 Main 6 个、Plugin 10 个 relay；由权威 Main 修改 shared-asset manifest，再逐字同步 Plugin。机器对比确认仅移除六个 w2-shell 条目，其他资产完全不变，门禁程序未放宽。
4. 两边 clean build 清除旧 dist；relay-removal-check.json 证明 16 个源码与对应 .js/.d.ts 均不存在，旧 import 扫描无命中。Core package.json 与起点逐字相同。
5. 删除后 Main 再次 19 passed / 15 由名称筛选跳过，Plugin 54 passed。Plugin 55→54 是删除纯函数身份同义断言，写入/恢复/完成链行为用例保留。

## 两阶段自审

范围符合已确认的接口层整理：无新 Core API、无宿主能力迁移；README 明确旧 source/dist 深路径退休与替代包入口。不能宣称未知工作区外使用旧深路径的调用者自动兼容，发布前应按此迁移；当前没有执行发布、安装用户插件或更新 vendor 指针。

质量检查：Plugin bin 中 shutdown 的顶层 await 和异常处理安装顺序保持；Main 入口仍调用同一 Core shutdown 单例；HttpServer 的缓存实例初始化/生命周期保持。事件 payload 为 type-only 导入，coverage 仍调用相同 Core 实现。两宿主 ShutdownCoordinator 的 module reset 隔离与 LIFO/失败隔离回归保持通过。

主审未发现 P0/P1/P2 阻断项；另做只读复核作为参考输入。Main lint exit 0，但未触碰的 AgentRunProjections.ts / handler-runtime.ts 有五条既有 noExplicitAny 告警，未扩大本切片去改它们。

## 验证范围

- Main：build:self、lint、repo boundary、Core import boundary、shared-asset drift，以及 HTTP health/shutdown 定向回归。
- Plugin：完整 npm run check、build、shutdown/服务关闭/coverage/维度完成四套定向测试、verify:codex-plugin、verify:plugin-distribution、smoke:codex-plugin。
- smoke 通过本地临时 tarball、模拟安装、启动探针、真实 stdio 交互；使用临时项目/配置目录，不代表真实用户 Codex 会话或已发布 npm 版本验证。当前 package.json 没有 verify:codex-session 命令，未虚报执行。
- 本切片没有更改 Core 产品，不重复全量 Core 测试；Core 的 npm run check 已覆盖本轮两个 Core 提交的最终代码。

提交后校准 Plugin 构建 provenance 中的 commit，再运行 runtime freshness；代码无变化时不重复同一 smoke。最终提交 hash 和检查索引记入 review-summary.md。
