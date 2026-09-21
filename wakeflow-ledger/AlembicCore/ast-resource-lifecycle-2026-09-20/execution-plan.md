# AST 资源生命周期补齐计划

用户从 Agent 任务明确转交此问题。本轮是普通用户授权修复，不是 Wakeflow 派发；不创建任务、不改控制状态。Core 基线 d6a1b54 已有 grammar 内容缓存，500 次重载与 Main 完整 19 项通过；原调查基于较早 Core，不重复制造已修复的内存越界。保留 Core AGENTS.md / CLAUDE.md 与 coverage/index.ts 既有修改。

范围：Core AstAnalyzer.ts 的 parser 所有权，ast/parserInit.ts 的初始化并发与缓存重试，ast/index.ts 的加载完成/重载协调；必要时调整 ensureGrammars 的委托，保持包入口、查询语义、strict fixture 和降级返回。Main/Agent 只运行消费者回归，不改产品文件。

1. 基线与精确复现：同一公开 reload/analyze 探针记录声明 [2,0,1]、Parser 创建/释放、RSS/heap/external；新回归先证明 replacement/reset/bind failure 未 dispose 以及并发 load 提前完成。
2. Parser 所有权：缓存淘汰和测试 reset 释放旧 Parser；已返回 Tree 仍归调用方，跨 reload 保持可用；初始化/绑定失败时不遗留已构造 Parser。不按稳定 plugin 对象身份跳过失效。
3. 加载协调：复用 in-flight 初始化/加载；只有注册完成后标记本轮已加载；重载请求在正在运行的一轮中发生时合并后续刷新，观察新文件内容，失败可重试且不忙循环。继续以真实 WASM 内容 hash 复用 Language，保持错误的 null 降级。
4. 验证并提交：原回归 RED→GREEN；超过原失败点的同进程重载、资源配对与内存趋势；损坏/修复/并发/插件替换/grammar 更新；Core 相关套件及组合检查、build，再同进程跑 Main 完整 StrictRecipePipelineFacade 和 Agent 生产链回归。构建完成后才启动依赖 dist 的消费者测试。

验证映射：

| 用户要求 | 回归/探针 | 改前期望 |
| --- | --- | --- |
| 正确 dispose，树不失效 | 既有 AstAnalyzerTreeLifetime 的缓存替换/reset/绑定失败用例 | Parser.delete 未调用 |
| 重载超过失败点且资源不持续累积 | 500 次公开 reload/analyze，记录活跃 parser 和内存趋势 | d6a1b54 声明保持，但未释放 parser 累积 |
| 并发等待完成、失败重试 | AstPluginLoading 控制真实装载等待/故障，检查所有等待者与最终解析 | 第二调用提前 ready/resolve |
| grammar/plugin新增更新 | 临时真实 WASM 字节更新、插件注册替换及重载中失效 | 字节更新基线正常，不能被新缓存策略遮蔽 |
| 消费者完整闭环 | Main 原文件 19 项同进程，Agent 生产链 | 不跳过、不改裁决与阈值 |

前序证据见 ../interface-layering-2026-09-20；转交调查见 ../../AlembicAgent/schema-projection-2026-09-20/core-ast-investigation.json。

门禁补充：首次组合检查在 doctrine gate 停止，指出新 reloadRevision 尚未归入已登记的生命周期。根据既有 ast-grammar-family 注册项，同步 config/blessed-singletons.json 的实际所有权、释放/重载语义及 reloadRevision/grammarLoads 字段声明；保留扫描器和阈值，未用变量命名或 const 包装绕过门禁。此配置属于 Core 本次资源生命周期的必要声明。
