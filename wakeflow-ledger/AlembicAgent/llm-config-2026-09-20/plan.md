# LLM 配置收敛执行记录

用户直接确认继续上一轮配置整合；本轮为 AlembicAgent 单仓开发，不是 Wakeflow 自动派发。基线 f863c52；已有 AGENTS.md、CLAUDE.md 改动不纳入提交。

1. 复现 Gateway 的 endpoint 优先级错误及惰性配置漂移；集中连接配置与默认值，创建时固定配置、SDK 仅消费有效值。验证真实 Gateway → SDK → fake HTTP。
2. 收敛 Factory / 五家 Provider 的身份、默认模型、embedding 配置、环境解析；规范回退模型归属，保留公开类、别名、默认选取顺序及非配置行为。用真实 facade/factory 入口测试。
3. 合并并发解析并拒绝不合法配置，避免 NaN 闸门无限排队；容量提示保留来源，验证真实调用。更新产品说明、分层边界并清理重复配置测试。
4. 两阶段自审，npm run check，提交并归档证据。

只读参考：TencentDB-Agent-Memory 06414ac10766b9bd61e4a69f3cf0ea414afb6d4f 的 runtime/gateway resolver 将有效连接计算与 runner 构造分离。本仓将解析器放在共同叶子层，不复制两个解析器。AI SDK 官方 provider-management 与 createOpenAI 配置支持集中显式实例；继续用现有 Registry/Gateway，不增加第二套 registry 或工具循环。

所有模型验证使用受控 fixture，不访问真实 API key 或线上模型。代理环境的按请求选择暂不改动；不修改相邻产品仓，不触及 V1 工具退役。
