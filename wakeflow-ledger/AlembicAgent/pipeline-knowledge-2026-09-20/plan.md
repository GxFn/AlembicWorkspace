# 阶段尝试与知识提交边界 review

用户持续授权逐文件 review、架构整理和自主提交。基线 230c635；仅 AGENTS.md、CLAUDE.md 是用户原有未提交修改，保持不动。8 个相关测试文件 / 142 项与 typecheck 基线通过。相邻 Core、宿主只读，不创建或接管其它 Wakeflow 计划。

## 已确认的闭环与顺序

1. **阶段尝试生命周期**：准备 prompt 与 reactLoop 置于同一次可取消、可清理的 attempt 边界。父取消可以及时结束等待；硬超时原因先确定再发取消；保留已观察到的工具及用量，不能把已提交候选当成零输出再重试。最终 reply 来自实际最后主阶段，而非 phaseResults 插入顺序里的旧 repair 结果。
2. **知识提交前后边界**：提交前的取消/非法输入应停止副作用；createOrStage 成功后保留已创建 id/lifecycle，readiness 或会话记录失败仅作明确后处理降级，不能报告为未创建。发布前的异步 readiness 也须复查取消。
3. **修复与共享状态**：风格修复有期限/取消，plain chat 透传 AbortSignal；尝试上限使用跨调用稳定的 session counter box。graphRefs 机械补充仍走同一个 prepared/evaluate 门禁，保留已剥离 coreCode 的原始诊断，不复制 Core 权威规则。
4. **职责分层**：提炼一个无业务依赖的可取消 operation 生命周期，MemoryReadPolicy、stage attempt 与工具风格修复分别定义自己的默认期限和降级政策。知识工具按路由、查询、提交前整理、持久化后投影、管理分别归属；阶段主循环/strict transition 验证归属保持，不凭文件长度机械删除能力。
5. **验证与提交**：每个缺陷先走实际入口 RED，再修复；行为修复与纯职责迁移分开提交。保留 public exports、旧回调优先级和 sharedState/ledger 的引用身份；用现有 AST fileBoundaries 限制新模块反向依赖。最终完整 check、公开签名/实际宿主 probe 和独立复审后提交。

## 验收场景

- promptBuilder 挂起时超时/取消；释放迟到 prompt 也不启动 reactLoop。
- 没有 stage timeout 的 runtime 忽略 signal，父取消仍能结束等待。
- hard timeout 时 cooperative runtime 同步 resolve 不覆盖 timeout 结论。
- 已有 onToolCall 完成记录的 timeout 不触发零输出 fast retry；回调仍按 stage 优先、runtime 次之调用；迟到回调不追加结果。
- retry 成本累计，主阶段重跑后的 reply 不被旧 summary rewrite 遮盖。
- create 成功后的 readiness reject、save reject/throw保留created状态；取消发生在写入前不调用gateway，已进入gateway的操作不承诺回滚。
- 新 runtime 投影共享一个 session counter box；直接 handle 的错误字段类型返回结构化失败。
- 原已有 graphRefs 与同样的自动注入 refs 获得同一 prepared gate 裁决。

## 明确保留

Core 仍是知识生产、严格 epoch/receipt 和数据库事实的权威；不在 Agent 重造这些能力。Core filesystem resolver 与当前 Agent symlink 约束不等价，继续保留现有安全 adapter。没有真实 API key 或线上知识库写入；不能以取消包装承诺中断不支持 signal 的外部代码或回滚已完成持久化。
