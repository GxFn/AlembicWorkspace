# LLM 接入实施记录

用户在阅读 LLM 接入补充方案后明确“确认 继续”。本轮沿已确认顺序实施，产品修改仅限 AlembicAgent；Core、宿主和腾讯项目只读。本记录不是 Wakeflow 派发包，不写 controller 状态。

基线：AlembicAgent `94df98f`。已有 AGENTS.md / CLAUDE.md 修改保持原样。执行 Node 22，provider 验证使用 mock/fake HTTP，不需要真实 key。

1. 固定 AI 测试与类型检查基线。先在真实调用入口加入取消缺陷回归，记录 RED；修复自定义 Error 取消原因的分类，保持请求超时与用户取消分离，验证同一测试 GREEN。
2. 提取 AI DTO 与错误的底层合同，保留旧导出路径；让 Transport/Gateway 消费底层合同。贯通 structured、embedding、probe 的可选取消参数及本仓实际调用者。每类新行为单独 RED/GREEN。
3. 对接严格 schema 验证和 SDK 错误归一化。保留已知公开返回合同，通过结构化诊断区分解析、schema 不符与取消；不手写不完整 JSON Schema validator。
4. 固定 AI SDK 与 OpenAI provider 兼容版本，实现首个可用 transport，真实接入现有 facade/Gateway；覆盖 chat/responses/tools/structured/embedding、代理和取消。SDK 不执行工具、不自动修复工具调用、不重试，工具仍由本仓执行管道管理。
5. 自审公开 API、生命周期、输入/输出、错误、权限和部分结果；运行相关合同套件及仓库要求检查。按可独立验证的变更提交，仅提交本轮文件。

测试映射：取消→provider/reliability真实入口；合同提取→公共导入/签名/strict consumer；schema→真实provider facade+HTTP fixture；SDK→真实adapter+fake HTTP及Runtime工具纵向调用；重试→断言实际请求次数；错误/权限→分类与executor次数；嵌入→输入顺序/有限向量/取消/批次失败。

完成标准：首个 SDK provider 的现有消费面可真实调用，失败/取消/权限等路径有可复跑证据；不以未接线的新接口或mock-only实现报告接入完成。后续其他 provider 按同一合同迁移，不提前删除未迁移的实现。
