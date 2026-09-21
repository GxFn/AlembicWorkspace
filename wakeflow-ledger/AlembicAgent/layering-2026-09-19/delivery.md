# 工具执行管道分层：研究、实现与提交

本轮完成了工具执行主链的逐函数 review、职责拆分、依赖约束及独立提交。最终完整检查通过：**66 个测试文件、816 项测试全部通过**，公共接口维持 **15 个精确入口、451 个导出绑定**。

## 提交节奏

| 提交 | 完成内容 | 验证 |
| --- | --- | --- |
| `1b394ce` | 将前两轮相互依赖的 runtime/tool/memory/provider 修复、测试整合及维护门禁保存为完整基线 | 新一轮完整 check：65 文件、766 项通过 |
| `0caa65c` | 修复宿主瞬时错误被缓存、非 Error 拒绝值未正确归一的问题 | 真实工厂 3 项 RED→GREEN；相关 4 文件 94 项、typecheck、Biome 通过 |
| `230c635` | 拆分工具管道职责并执行逐文件依赖规则 | 60 项实现等价、16 个旧模块导出保留；完整 check、公开类型/签名/导入通过 |

提交只发生在本仓。用户原有 AGENTS.md、CLAUDE.md 改动保留且未提交；没有推送、发布或修改相邻产品仓库。

## 研究结论及落地

本地 TencentDB-Agent-Memory 的实际链是 handler → 配置与 adapter → 各 point/priority 的内容 hook → adapter 序列化；类型、注册、执行和装配分离值得借鉴。但它做的是内容注入，不能把单 hook 失败后继续执行的策略移植到权限门禁。其未被当前主链消费的工厂和未注册 L1 injector 均在研究中区分，未按文件名推断运行行为。详见 [本地源码研究及官方资料记录](reviews/middleware-research.json)，并参照 [TencentDB 项目](https://github.com/TencentCloud/TencentDB-Agent-Memory)。

[Fastify hooks](https://fastify.dev/docs/latest/Reference/Hooks/) 和 [生命周期](https://fastify.dev/docs/latest/Reference/Lifecycle/) 强调阶段、早退与错误边界；[Google ADK callbacks](https://adk.dev/callbacks/types-of-callbacks/) 区分执行前后及错误处理。本轮采用明确的生命周期契约和职责隔离，保留 Alembic 现有的 after 注册正序，没有引入框架依赖或改成逆序 onion 语义。

## 职责分层

旧 `ToolExecutionPipeline.ts` 从约 1300 行职责混合文件收敛为公开入口与装配；内部拆为 9 个有实际消费方的模块，最大单文件约 238 行。所有实现仍在 Agent 仓内，未把能力变成空壳，也未迁入 Core。

- contracts：复用公共 ToolMetadata，仅扩展内部 cache key；内部窄端口与公开完整 Runtime/LoopContext 分开。
- engine：只运行 before / executor / after，执行端口由入口注入；不依赖默认工厂、路由或业务实现。
- callNormalization、runtimeBridge：分别负责兼容翻译和唯一宿主调用边界。
- accessGates、phaseGates：分别负责通用访问限制和阶段动作范围。
- duplicateCache、observations、submissionLedger：分别负责复用、观察与真实持久化提交的记账。

[逐文件职责与符号清单](file-review.md) · [机器清单](file-review.json) · 产品说明：`docs/tool-pipeline.md`

默认顺序保留：控制门先于 cache/host；cache 快照先于 evidence 修改；evidence → memory → tracker → trace → submission 正序执行。sharedState、Set、ledger、signal 和 envelope 的引用身份经独立探针验证。progress/EventBus 仍不自动加入默认链，避免 Runtime 重复发事件。

## review 中修复的真实问题

只读 snapshot 工具第一次由宿主抛错时，旧实现返回 error、没有 envelope，却默认按成功准入缓存。第二次本可恢复的调用被永久短路。现已用统一结果归一判定缓存准入，Error、字符串和未知拒绝值均形成明确失败；下一次调用重新触达宿主，成功后第三次才命中缓存。

这项行为修复先单独提交，再进行实现搬迁。纯职责拆分阶段的 60 个函数/常量经 TypeScript 擦除类型、规范化语法树后逐项相同；公开 class 只将同一执行序列委托给 runner。见 [等价证据](reviews/relocation-equivalence.json) 与 [独立两轮复审](reviews/pipeline-extraction-review.json)。

## 架构门禁

旧门禁只区分顶层 area，无法阻止 agent 内部的 engine 反向导入 factory。新增 `fileBoundaries`，明确 10 个文件的运行时依赖列表，并要求 toolPipeline 目录下每个新文件登记。

检查器使用 TypeScript AST，处理 relative/#alias 统一路径、type-only/mixed import/export、类型查询、动态 import、import-equals 和直接 require。受约束文件的非字面动态加载拒绝；类型桥继续豁免。现有顶层矩阵及 blessed-edge 语义保留，顶层允许不会覆盖更严格的文件规则。

38 个真实 CLI 临时仓库用例包含正反例和 RED→GREEN。独立复核还修正了 extensionless 解析优先级和直接 require 漏口，未扩大为任意别名/eval 分析框架。当前 census 为 56 条运行时跨区边、24 条类型桥；旧正则把 7 条 `import('...').Type` 类型查询误计为运行时引用，已逐项核实。

## 验证记录与限制

- 初次基线复验有一个 suite 因相邻 Core logging 构建产物暂时不可解析而未加载。恢复后，新进程 import、该 suite 的 9 项和完整 766 项全部通过；保留了失败证据，没有错误修改 Agent import 来掩盖产物更新窗口。
- 生命周期表征在拆分前先通过：异步 before 等待、falsey result、blocked、after 正序、自定义 hook 异常传播、真实台账先于观察消费。
- 分层后 6 文件 123 项通过；完整 check 最终为 66 文件 / 816 项通过。
- 完整 check 后仅将内部 safety gate 的泛型限制为已经存在的窄端口；运行时 AST 仍相同，并重新完成 typecheck、Biome、build、公共签名和真实 strict consumer。
- public import smoke：15 个允许入口与 11 个禁止入口通过；`git diff --check` 通过。Biome 保留 17 个既存非阻断提示。
- 所有 provider 测试仍使用 fixture；未运行真实 API 或远程 CI，没有把静态分层门禁宣称为安全沙箱。
- 静态门禁不分析任意函数别名、eval 或宿主注入函数内部实现；完整上下文保留是公开 middleware 的兼容约束，不意味着内部模块可以任意增加依赖。

[验证摘要](evidence/full-check-summary.log) · [机器记录及提交 hash](verification.json) · [门禁与测试迁移复审](reviews/pipeline-validation-study.json)

后续逐模块整理仍应按“真实消费者和行为 → 职责方案 → 回归与依赖约束 → 独立提交”推进。PipelineStrategy、knowledge handler 等大文件可继续作为后续 review 对象；本轮不以行数大为由自动搬迁它们。
