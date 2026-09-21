# 参考实现与取舍

[LangChain.js TextSplitter 的官方实现](https://github.com/langchain-ai/langchainjs/blob/main/libs/langchain-textsplitters/src/text_splitter.ts)
将长度度量与分割策略区分，并在入口处理 overlap/budget 关系。本批采用单一预算规则与
共享跨度计算，但保留 Core 同步入口、统一 estimateTokens 和 overlap>=budget 时前进的
既有语义；没有直接复制其异步接口、默认字符度量或抛错策略。

[Tree-sitter 官方位置说明](https://tree-sitter.github.io/tree-sitter/using-parsers/2-basic-parsing.html)
区分源位置与零起始行/列。Core 应从同一段原文产生块内容和位置，而不能插入换行后
再推测源行号。C API 字节偏移与本库 JavaScript 索引不能混同；本批用真实 grammar 的
Unicode/LF/CRLF/CR 样本确认当前 JS 入口的跨度和行号。

本地 TencentDB-Agent-Memory 的此前分层学习继续作为背景；本批具体分块/快照选择
由本仓实际生产者、消费方和错误复现决定，没有从外部项目搬入 provider、Agent 或
存储后端。每个共享点都有真实调用方：文本跨度被两种分块器消费，快照输入被三种
写入入口消费，可读性判定被 adapter、迁移和只读 reader 消费。
