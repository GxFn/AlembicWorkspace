# 阶段执行与知识提交 review 交付

2026-09-20。用户直接授权继续逐文件 review、架构分层、清理与自主提交。本轮从 `230c635` 推进到 `56900c5`，仅修改 AlembicAgent。当前工作区只保留用户原有的 AGENTS.md、CLAUDE.md 未提交改动。

## 实现与提交

| Commit | 结果 |
| --- | --- |
| `8cb0301` | 提炼共享可取消 operation；记忆读取保留自己的默认期限与诊断政策，消除重复 timer/listener 实现。 |
| `84aed5c` | 知识创建回执不再被后续 readiness/save 失败抹掉；plain chat取消到transport、风格修复30秒期限、稳定标题/修复预算、非法输入和graph重评修复。 |
| `b4fc184` | 准备与reactLoop归入同一次attempt；保留部分工具/成本，阻止未知执行的快重试，正确处理父取消及宿主aborted/partial，修复最终reply选择。 |
| `56900c5` | 知识工具拆为路由、输入、来源、authoring、状态、提交、已创建结果、查询/管理模块；收窄写口和读口，加fileBoundaries与产品说明，删除不可达提示和3个无外部消费者的helper export。 |

## 逐文件与缺陷闭环

本轮深化 [20个源码文件](file-review.md)，包含新模块及既有 Core adapter 的保留判断。知识原49个声明全部唯一保留，48个声明正文不变；handleSubmit 的输入、准备、created结果等7组结构经独立AST比较，再以真实handler/Core合同测试验证。原handle、Core waiver重导出、registry接线和包入口保留。

重点闭环：

- prompt准备挂起、父取消、cooperative abort抢先resolve、硬超时部分工具丢失；每次attempt独立收诊断并只合并一次。
- 回调与返回副本重复计数、不同call ID被误合并、快重试首轮成本丢失、旧summary rewrite覆盖最新主阶段reply。
- 宿主自报aborted后仍进入下一阶段、宿主partial要求读回仍重试，以及native零次观测覆盖显式未知计数。
- create成功后readiness拒绝/同步或异步save失败被误报提交失败；未知readiness与Core ready=false明确区分。
- 取消发生在style/readiness等待后仍进入写入；样式预算与标题预算在runtime投影/阶段浅拷贝后重置；constructor/__proto__标题计数错误。
- 直接handle非法字段抛trim异常；自动graphRefs与相同显式refs走不同prepared门禁。
- 抽取prepare引入的新await取消窗口：在真实写口前再次检查，实际入口RED→GREEN。

工具权限、Core知识生产、strict epoch/receipt裁决、真实文件接地及symlink约束均继续由原责任方承载。没有移动Core、宿主、插件、UI或V1退役范围。知识门禁保持原软/硬语义，删除的appeal提示原本恒为空，并未移除Core waiver功能。

## 验证

最终 `npm run check` 在 Node 22.23.2 下 exit 0：**66个测试文件、870项通过**。包括类型检查、Biome、Agent/Core/公共入口边界、分层、doctrine、命名、中立内核、公开签名、实际相邻宿主strict consumer、validation floor和退役符号扫描。

公开接口仍为 **15 exports / 451 bindings**。实际strict consumer验证17个runtime绑定、7个禁止深入口拒绝及continuity；内部layer检查63条runtime边/24条type-only桥。检查前后367个源码、测试、配置与产品说明文件指纹完全相同。相关定向集、日志摘要和hash见 [verification.json](verification.json)。Biome原有scripts console警告不阻塞，未借机改无关脚本。

测试继续复用现有文件与参数化fixture，整理理由见 [test-review.md](test-review.md)。全部provider验证使用mock fetch/provider；知识接地及strict合同走实际本地Core代码与可控临时fixture，不依赖真实API key。

独立复审与修复证据归档于 [reviews](reviews)，其中包括知识预算、知识抽取及阶段执行的复现与closure。新布局和宿主结果语义面向使用者记录在产品 `docs/execution-lifecycle.md`。

## 参考与边界

本轮读了固定commit的本地TencentDB injection/prewarm/observer，并核对Node 22、Temporal官方资料；采用判断与引用见 [research.md](research.md)。借鉴期限归属、观察与业务写入的分离；没有引入其他框架、数据库或服务。

遗留边界是端口实际能力：旧宿主/provider忽略signal时只能结束等待并丢弃迟到回执，不能保证外部代码停止；Core createOrStage/publish无取消参数，已调用后等待真实回执，不能承诺回滚。新的类型Pick限制正常代码可用的接口，不是运行时安全沙箱。

本轮范围已完成，无未闭合P1/P2。后续优先项仍属于用户原有架构review授权：继续审查PipelineStrategy的strict gate路由/epoch投影与StrictProductionStages之间的职责，及知识management的staging/evolution端口。应以实际调用与失败行为决定下一次抽取，保留Core裁决权，不把未来优化建议写成已实现能力。
