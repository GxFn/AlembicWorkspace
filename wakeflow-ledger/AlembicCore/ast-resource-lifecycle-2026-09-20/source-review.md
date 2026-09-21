# 所有权与并发自审

已读取转交的 Agent 调查，原报告基于 f58093d/4b05225；本轮以 d6a1b54 为基线，沿用已验证的 grammar 内容缓存。新基线探针确认：200 次重复 reload 声明均为 [2,0,1]，但 Parser 创建 200、删除 0，仍遗留 native 所有权问题；未把这一事实误称为 JavaScript heap OOM。

## 源码与上游依据

本地 web-tree-sitter 0.26.8 与同版本上游实现一致：[Parser](https://raw.githubusercontent.com/tree-sitter/tree-sitter/v0.26.8/lib/binding_web/src/parser.ts) 的 delete 释放 parser 及其缓冲；[Tree](https://raw.githubusercontent.com/tree-sitter/tree-sitter/v0.26.8/lib/binding_web/src/tree.ts) 独立保存 Language、文本回调和树句柄；[原生 Tree](https://raw.githubusercontent.com/tree-sitter/tree-sitter/v0.26.8/lib/src/tree.c) 有独立生命周期。由此推导并通过实际回归确认：缓存所有者释放 Parser 不应连带释放已经交付调用者的 Tree。

生产调用链仍是 Main strict backend → Core reloadProjectAstPlugins → 异步 grammar/插件装配 → AstAnalyzer。parseToTree 的实际生产消费者是 ASTChunker，已在 finally 中释放其 Tree；Guard/analyzeFile 自己拥有并释放 Tree。本轮没有增加 Tree 引用计数，没有改变 AST 事实判定。

## 两阶段审查

范围：仅 Core 三个运行时源文件、两个按职责组织的测试文件，以及既有生命周期清单。Tree 所有权测试保留在 AstAnalyzerTreeLifetime，grammar 读取/异步装配测试归 AstPluginLoading；原损坏/修复/内容替换用例迁入后一套并增加同内容失败重试与并发共享，未重复维护两份 fixture。消费者只运行原入口回归，不修改 Main/Agent 源码。

正确性：只读复核未发现阻断 P1/P2。Parser 淘汰先摘缓存后释放，reset 快照清空后释放，重复 reset 不重复 delete；grammar 绑定失败释放未入缓存的实例。运行时构造函数只在 init 完成后发布。loader 完成判定、_loaded 写入与 loading 清空之间没有 await，避免将新请求加入已结束的工作；进行中的更新合并到后续 pass。稳定 revision 的失败直接结束，不自动无限重试；下一次显式调用仍可修复。原 null 降级及可用旧插件在局部资源缺失时的行为保留，并增加对应诊断。

限制：资源稳定性针对相同 grammar 集合的重复 reload 和 Core 所有的 Parser；WASM 库没有语言模块卸载 API，连续引入不同二进制版本仍占进程资源。插件新增/替换指现有 registerLanguage 接口与已注册 grammar 资源；没有新增磁盘 JavaScript 插件代码热更新机制。
