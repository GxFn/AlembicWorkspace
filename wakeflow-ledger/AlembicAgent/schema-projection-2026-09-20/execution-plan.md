# Schema 与可执行能力投影

用户确认继续上一轮明确的下一步。基线：Agent `a99497e`、Main `df2d851`。本轮仅修改 Agent/Main 的工具合同、schema 查询、宿主能力投影和真实消费者；Core、腾讯与其他仓库只读。已有治理文件改动不纳入提交。当前是直接用户工作，不创建 Wakeflow 派发/控制状态。

## 顺序

1. 固定相关测试/类型基线及真实入口 RED。
2. Agent 建立单一 schema query 合同和动作选择词汇。RuntimeCapabilityCatalog、CapabilityCatalog/UnifiedToolCatalog、Router、runtime 与自省消费同一选择规则；旧公开方法保留为 wrapper，模型覆盖和 lazy 行为不变。
3. 把宿主服务的可用性接到 schema 与执行检查：不借查询分配会话/缓存，不调用实际工具探测；知识管理按 operation 保留可用分支，图谱缺服务明确不可用。Main 通过实际已绑定的服务/adapter 提供快照；执行时重查，不把发现结果当作授权。
4. 修复已确认的相关接线/结果问题：Core SearchResponse 转 Agent 搜索 DTO；旧任务不能将失败的工具回执推断为安全通过。保留 Core 业务规则，不虚构缺失能力。
5. 联合验证与独立 review，Agent/Main 分别提交，归档命令、结果、hash、遗留范围。

## 联测期间的依赖接入补充

Core 在本轮期间由相邻工作推进到 `f58093d`，正式公开写接口返回值可空。Main 基线先有 9 处类型错误（其中2处在本轮知识adapter内），随后另有5处严格生产消费者错误；本轮adapter已处理自身2处，其余共12处位于HTTP知识路由与StrictPrivateCorpusRuntime。为完成已授权Agent/Main接口接入和可构建闭环，增加这两个消费者的窄回执校验，不改Core、不创造新能力。null以未知写入状态/需要读回核对表示，已有Core异常原样保留，不伪造成功、回滚或重试依据。该项明确记录为外部Core合同变更后的必要接入，而非声称原基线全绿。

## 行为验收

| 行为 | 入口与 RED | GREEN |
| --- | --- | --- |
| 选择语义 | Router/catalog 对空、未知、重复动作不一致，继承键可崩溃 | 顶层缺省/null=未限制；空数组/对象=禁用；entry null/undefined=该工具全动作；空 action=禁用；未知项过滤，去重且顺序稳定 |
| 单一查询 | Runtime 当前鸭式依次探测五个方法 | 新 query 真实消费；旧宿主有明确兼容分支；模型/lazy 保留 |
| 决策一致 | Adapter explain 允许，而 execute 被 capability 拒绝 | 相同静态准入判断；拒绝时 executor 次数为0 |
| 自省受限 | meta.tools 展示被当前阶段禁用的动作 | 仅展示有效工具/动作/管理operation，不改变全局registry |
| 宿主可用性 | Main graph 无真实端口仍被展示，knowledge管理能力并非全有 | 缺服务剔除；条件分支保留；新失效在执行端仍拒绝；查询不分配run状态或执行sandbox/Core写入 |
| 搜索形状 | Main Core SearchResponse 到 Agent 时 .map 抛错 | 真 Core 临时fixture响应转换后 search/prime 可消费 |
| 结果真值 | 旧DAG工具失败被任务推断 safe_to_submit | 未完成检查明确失败/不可判断，不生成通过建议 |

不引入新的总框架，不删除旧公共合同，不把 schema 可见性升级为权限依据。AI DTO/错误叶子化为后续步骤；HTTP 的既有身份/鉴权仍属于宿主。
