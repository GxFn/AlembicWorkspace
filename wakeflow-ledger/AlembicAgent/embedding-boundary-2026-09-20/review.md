# Embedding 与 LLM 解耦审阅记录

执行日期：2026-09-20 至 2026-09-21。直接用户任务；用户明确授权 Main 必要接线及单独提交。未创建或修改 Wakeflow demand/state/envelope。

## 需求符合性

Agent 提交 `c5bc99b218756657e7b0a37635e8022857669f70`，基线 `b303b3538d1b392d51461efc8aea69a0de2fe45b`。

- LLM 切换保留显式 embedding 实例；未配置时 getter 返回 null，不回退生成模型。
- 唯一生产宿主消费者迁移后删除 embedding fallback initializer 及专用类型；显式 SDK embedding API 保留兼容，并在产品文档登记替代入口与迁移。
- MemoryRetriever 在 query、document、回填及相似度路径区分输入用途并转发取消信号；sidecar 可选 profile 防止同维度异模型缓存混用。
- 未删除工具 V1/V2、宿主执行能力或 Core contract；原 AGENTS.md/CLAUDE.md 变更未纳入提交。Core/Plugin/Dashboard 保持只读。

## 代码审阅

本轮已处理的主要问题：P1 LLM 切换导致 embedding 跟随/清空；P1 Qwen query/document 用途在记忆调用中丢失；P1 同维度不同模型缓存混用。未发现本轮未处理的 P0/P1。

兼容风险：embedProvider 现在可为 null，旧 initializer 已移除；已扫描生产消费者并同时迁移 Main。旧无 profile sidecar 在宿主开始指定 profile 后不会参与召回；构造时不删除文件，后续缓存属于可重建数据。

## 验证

- `npm run check`：通过；76 文件、1222 测试，边界/类型/构建/导出检查通过。保留 17 项既有 lint 警告。本次提交在该检查后仅将 sidecar profile 注释从连接身份纠正为模型空间身份，没有行为变动。
- RED：`manager-red.log`、`memory-red.log`；GREEN：`manager-green.log`、`memory-green.log`；最终检查：`full-check.log`。
- 未调用真实模型、下载模型、使用真实 API key 或迁移用户索引。运行时为 Node 22.23.2。
- Main 宿主接线、真实 Core provider/存储、HTTP 与编译入口验证见同级 Main ledger 的同名任务目录。

下一步：按 Main 产品文档显式部署固定 Qwen embedding 并确认索引迁移；这属于实际环境配置，未在本轮代替用户执行。Main 全量旧测试契约偏差单独记录，不放宽产品正确性来迁就旧断言。
