# Gateway 可空契约与下游接线

状态：用户已授权 Agent 必要结果接线，且已选择采用并行的新结果语义。Core 契约、两宿主分层及 Main/Agent 新策略均已整合提交；提交与最终验证见 self-review.md。

问题：旧 Gateway 依赖要求带字符串索引签名的对象，真实 KnowledgeService 返回实体类；DB-only update/publish 也可能返回 null。宿主整块 knowledgeService 强转掩盖了两项差异。

1. Core 的内部保存结果只要求现有 id/title/lifecycle 与可选 kind，create 非空，update/raw/publish 明确可空。raw 直接保留对象或 null，不序列化、不回退旧值。strict prepared/admission 的 recipe 仍非空。
2. Main/Plugin 的 Gateway 工厂直接接收真实 KnowledgeService。Main strict 的 proof 参数使用 NonNullable，发布缺回执时经共享 helper 中止后续 CONTENT_READY/PUBLIC_CAS。
3. Main HTTP 编辑、生命周期、发布统一通过宿主回执 helper；缺回执返回 KNOWLEDGE_WRITE_RECEIPT_UNAVAILABLE、writeState=unknown、requiresReadback=true、retryable=false。批处理保留已确认子集。Core 异常原样传播。
4. Agent management 的 publish 缺回执走既有 writeStarted 失败分类，附同名结构化错误；submissionResult 接收 object 详情并投影白名单。created.raw=null 时保留已确认身份和创建成功结果，只增加 degraded 警告，不从模型候选补造详情、不重做 create。

验证使用既有 Gateway、持久化和 Agent 生产链测试；Main strict 测试真实写库后只丢弃回执，检查数据已 active 且未进入后续发布事实门。详见 checks.jsonl、self-review.md。

边界：没有修改 Agent runtime、provider、tool registry、调度策略；仅两个结果消费源文件及已有测试。Core 仍保持 DB-only 旧返回与事件/审计顺序。用户这次策略决定覆盖此前外层保持 TypeError 的方案，旧隔离提交不得作为最终行为版本使用。
