# 旧问题、接口与测试归属整理

直接用户任务：解决上轮23项旧测试失败，整理Agent与Main接口及测试职责，减少重复层次。用户已持续授权Agent与主仓改动/分别提交；Core、Plugin、Dashboard只读。Agent基线c5bc99b，Main基线615e4c4；原AGENTS.md/CLAUDE.md改动保留。与当前其他Wakeflow demand无关，不改控制状态。

顺序：1.复跑失败并逐项映射真实contract；2.把纯Agent行为回归并入Agent已有owner测试，主仓留下实际公共入口/装配覆盖，迁移独特场景后再删除重复文件；3.去掉AI装配内已无消费者的factory缓存、空能力标记、冗余导出和弱类型转接，以既有Manager contract连接HTTP/DI；4.审查embedding重建接线，选取能减少重复边界且保持显式迁移及权限的最小调整；5.两仓顺序构建、全量检查，分别提交并归档删除映射和验证。

硬约束：不降低成功回执、权限、profile、取消、超时、SDK协议校验；不通过skip/only/exclude隐藏失败；不删除V1/V2受保护兼容表面。使用受控HTTP、临时存储，无真实凭据或索引操作。
