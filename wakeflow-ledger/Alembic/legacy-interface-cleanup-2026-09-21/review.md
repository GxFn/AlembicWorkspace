# 旧问题闭合与接口整理审阅

日期：2026-09-21。直接用户任务，范围为Agent与Main旧失败、对应接口和测试结构；Core/Plugin/Dashboard只读。原AGENTS.md/CLAUDE.md改动保留。未操作其他Wakeflow demand/state/dispatch。

提交：Agent `9bda075a013a4bfd748ece60a38b42e1372fd90b`，Main `43d6ad8d2bd4ce788a7ee7185a43b702b71fcd38`。基线分别为c5bc99b与615e4c4。

## 结果与职责

- 基线7文件124项复跑：23失败、101通过。按真实契约修正测试归属，未改SDK验证、持久化成功回执、质量门禁、工具权限、RPC回执或向量profile规则。
- Main删除6份仅消费Agent内部API的重复测试（1837行）；独特行为并入Agent现有7份测试文件。五文件84个旧case逐项对应owner-test-migration-map.json；LLM剩余23个旧case按路由/参数/SDK/结构化输出/错误/兼容默认分类记录在llm-migration.json。
- Main用公开Provider→真实DI/Manager→受控SDK HTTP→计量存储验证宿主消费，包含热切换和存储失败隔离。既有MainToolAvailability、ToolContextFactory/Scope与generate/runtime接线回归保留。
- AI装配移除无消费者的整模块缓存、write-only就绪标记、isAiRuntimeReady包装和重复recorder安装；Main通过ManagedAiProvider/AiProviderManager公开类型对接，删除两次HTTP→Record→Manager类型转接。计量故障由Manager统一诊断，不在宿主吞掉。
- 文件索引重建只传一次clear/force，由Core fullBuild/run负责顺序与结果；删除BuildResultLike和两套手写结构投影。ServiceMap声明实际store，两处profile包装直接使用同一store方法。Recipe generation显式确认、shadow/CAS链保持独立。
- 增量索引从hash-only假行改为真实写入/再次扫描/内容更新。root进一步合并注入、进度和存储三个场景，移除5个as any及expect(true)空断言，dryRun验证真实已有数据保留；该文件最终15项通过。子任务最初17项与5个旧警告记录保留，最终root证据覆盖后续清理。
- Main默认至多4个Vitest worker，依据前轮已观察到的宿主子进程争抢；不改测试选择或超时阈值，CLI可覆盖并发。测试说明已写入docs/testing.md。

Main产品源码净减116行；两仓本轮合计净减1227行。Agent运行时代码未改，仅扩充归属正确的回归与说明。

## 验证

| 命令 | 结果 | 证据 |
| --- | --- | --- |
| Agent npm run check | exit0；76文件/1280测试全部通过 | Agent同目录/full-check.log |
| Main npm run build:self | exit0；真实ESM重新编译完成 | build.log |
| Main npm run check | exit0；全部脚本顺序完成 | full-check.log |
| Main unit | 164文件/1238通过 | full-check.log |
| Main integration | 30文件/440通过，10既有外部联通性测试跳过 | full-check.log |
| Main局部coverage | 3文件/11通过，既有覆盖门槛通过 | full-check.log |
| 类型、包入口、Core/Agent边界、分层、共享资产、retired/ring | 通过；以两仓check实际包含范围为准 | 两仓full-check.log |

Agent仍有17项、Main5项既有lint警告；没有新增抑制规则。外部联通性跳过数量与基线一致，未用skip/only/exclude处理本轮失败。全部模型交互使用可控fixture，数据库/索引使用临时数据根，未调用真实模型或修改真实索引。

## 自审

阶段1：变更符合用户“旧问题、精简接口与测试”的范围；没有将失败用例直接丢弃。逐项迁移和新增真实消费链证明替代入口存在，原84-case映射还区分已有覆盖与无效实现镜像。SDK HTTP fixture使用真实Response，业务成功依赖实际回执，EventBus请求须等不同类型的关联回复。

阶段2：主要风险是删除后覆盖遗漏、索引清理顺序变化和固定profile检查错绑。通过owner矩阵、保留Main消费测试、HTTP重建参数RED→GREEN、profile失败/恢复、无LLM/缺embedding入口以及两仓完整check覆盖。未发现本轮遗留P0/P1。没有合并文件索引和Recipe代际迁移，不新增空适配器或重复Core实现。

## 后续范围

本轮23项稳定失败均已闭合。既有lint警告可另行逐类整理；真实模型网络/性能验收仍需其独立环境条件。本轮测试整理并不宣称已穷尽仓库其他模块的历史问题。维护后续功能时，Agent内部合同在Agent owner测试增补，Main保留宿主消费证据。
