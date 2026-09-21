# Schema 查询与接口接入整理

本轮直接用户确认继续上一轮明确的下一步：schema 查询、动作白名单、宿主可用性投影。修改仅在 Agent/Main；Core 与腾讯项目只读。最终提交及逐项命令在同目录 `verification.json`。

## 已落地

1. `ToolSchemaQueryPort` 一次返回 schema、有效动作集合及不可用原因。Runtime 直接消费该结果；五个旧查询入口保留包装，旧宿主探测集中到一个兼容模块。泛型 flat schema、模型覆盖、lazy 投影和 Capability hooks 保留。
2. 选择规则集中到 kernel 纯函数：顶层 null/undefined 不限制，空集合禁用，entry null/undefined 允许该工具全部动作。空/未知/重复动作和 Object.prototype 名称不会制造无效 schema 或扩展权限。
3. Router/Adapter 的 explain、执行前、队列放行后的准入使用同一判断。meta.tools 仅看到当前有效视图，handler 引用保留，全局 registry 不变。省略参数要检查真实默认值；需要 action 的 envelope 拒绝缺 action，泛型 flat 工具不被强加该参数。
4. Main factory 的查询与执行复用服务装配。查询不分配 scope、不执行业务方法或 sandbox 探测；可按原 DI 解析惰性实例。graph/outline 缺端口时剔除，knowledge 按管理分支保留可用项，memory/evidence 按当前运行资源判断。执行前重新读取能力，发现结果不是 actor 授权。
5. Main 将 Core SearchResponse 转成 Agent 搜索 DTO。Core 无 limit 前的生命周期过滤口，因此当前宿主明确只支持 all；recipe/candidate 既不误传为物理 kind，也不在截断后假装完成过滤。真实临时 SQLite 验证 search/prime/category。
6. 旧任务只有收到成功信封及必要结构化事实后才能给出检查通过结论；取消、超时、partial、缺字段不会变成 safe_to_submit。原信封保留在 Error.cause，没有新增旧工具替身。
7. Core 在并行工作中正式引入可空写回执。Agent/Main 统一报告未知写入、需要读回、不可自动重试；严格生产停止后续 content-ready/CAS。批量保留确认成功子集并单列未知项。created wrapper 已确认的身份不因 raw 详情为空而被抹掉。

Main AgentModule 对本仓工厂采用相对 import，修复开发测试中 package #imports 解析到旧 dist 的问题；源码与编译后的相对关系一致。没有用工厂替身替换原验收入口。

## 复审与修复证据

| 缺陷 | RED 事实 | 最终行为 |
| --- | --- | --- |
| 空/未知动作及继承键 | Router/catalog 不一致，constructor/toString 可抛错 | 同一选择规则，未知项过滤，无空 enum |
| explain 与执行相反 | 禁用 graph 时 explain 允许而 execute 拒绝 | 拒绝理由一致，无 context/handler 创建 |
| 自省泄露禁用动作 | 只允许 code.read 却广告 write | 阶段、capability、宿主约束共同收窄视图 |
| 默认分支越过约束 | 只支持 recipe，省略 kind 却执行 all | 默认值单源，缺省也受检查；不支持默认值时要求明确选择 |
| 队列期间能力撤销 | reject 排队后撤销仍执行 | 获得 slot 后重读，reject 调用为0 |
| 缺 action 越过阶段限制 | 外部 host 收到没有 action 的 code 调用 | 按实际 schema 的 required 约束拒绝，flat 工具兼容回归同时通过 |
| 失败被任务推断为通过 | 真 task→真 adapter 失败仍 safe_to_submit | 失败及缺事实明确中止，不新增推荐枚举 |
| 空回执被投影为成功 | HTTP 空 DTO/批量成功计数、strict TypeError | 真实写入已发生的 fixture 仍只调用一次，不回滚、不进入后续发布 |

库内部方法不运行真实模型，服务事实由实际 Core/临时数据库或明确的 nullable 合同 fixture 验证。发生过的 fixture 设置错误在各子报告中单列：没有把缺 catalog、错误测试状态值或尚未到达 Core 的 fixture 失败当作有效 RED。

## 验证结果与并行变更

- Agent 最终全量 `npm run check`：72 文件、1045 项通过，包含类型、lint、导入/分层边界、公开签名、strict consumer 和验证下限。15 个包入口、451 个既有运行时绑定保留。
- Main 构建、类型及边界检查通过；130 项接入/HTTP/宿主定向单测通过，最终并行提交后的复验结果以 verification.json 为准。现有 lint 仍报告5条既有 any 警告，位于未改动文件。
- 完整严格生产集成：18 通过、1 失败。失败不是空回执修复或配置重放断言；独立复现确定在 Core AST 重载路径，不能把孤立通过当作全套通过。
- 本轮期间，nullable 接入已经被并行工作纳入 Agent `9638f25` 与 Main `3832e71`；Main 后者还包含其他窗口的知识模块拆分。保留这些提交，不重复提交或回退。本轮剩余 schema/能力接线建立在其上，验证前后 HEAD 记录在 verification.json。

## 尚未修复的 Core 问题

完整集成的最后一个配置重放用例先在 `strict-counterexample` 后端自证失败。仅调用 Core 公共 AST API 的独立进程可复现：重复 reload 到118次，三份固定 TypeScript fixture 全返回 null，RSS约1.53GB；只 reload 一次后连续1000组均通过，RSS约181MB。额外观测到 Parser.initialize 抛出 `table index is out of bounds`，并且旧 parser 没有被 delete。

这证明反复重载路径有累计 native/WASM 资源问题；不把它武断归为 JavaScript heap OOM。相关代码早于本轮，Core f58093d 到随后 4b05225 的 AST 路径也没有差异。准确源码行、git blame、独立进程脚本和结果见 `core-ast-investigation.json` 及 evidence。

建议的后续 Core 修复范围：复用未变化的 WASM 语言加载，合并并发加载；替换/清空缓存时释放旧 parser；保留项目 grammar/plugin 更新的失效语义；加载完成后才发布 ready。需实际资源生命周期回归和整套严格集成验证，不能改事实裁决、阈值或隔离测试来掩盖问题。本轮没有编辑 Core；进入 Core 需要用户明确扩大范围。

## 采用的参考与保留边界

MCP 官方分别定义工具发现与执行，并要求执行时进行输入验证和访问控制；本轮据此保留执行重检，而非仅隐藏 schema。[MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

共享声明可以服务不同投影，但类型断言本身没有运行时检查能力；宿主仍需提供实际 adapter 与可复查调用。[TypeScript assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)

腾讯 MemoryProxy 的 skill bridge 在实际请求检查 allowlist/写权限并绑定会话身份，值得采用；Standalone runner 用空对象回落默认读写工具的行为不采用。路径、行号、源码 commit 与采用判断保存于 `reference-study.json`。

HTTP 既有身份/manifest 策略未重写；schema 可用性不被声称为完整授权。旧 DAG 的真实工具接入仍需其宿主补齐，本轮只阻止错误成功结论；AI DTO/错误叶子化仍是后续整理项。Main 全仓 integration/coverage 未作为本轮全绿声明。
