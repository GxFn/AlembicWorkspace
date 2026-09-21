# 接口整理实施结果

日期：2026-09-20。用户确认后，已落地上一轮建议中的向量窄能力、评分投影、内部写入端口和宿主纯转发清理。源引用、代际路由等有行为差异的整合不在本轮改动中。

## 提交与完成范围

| 仓库 | 提交 | 完成内容 |
| --- | --- | --- |
| AlembicCore | `25fd9f9` | 同步/检查只依赖所需读写方法；删除私有 LifecycleVectorStoreBridge 继承，保持配置优先级和 receiver |
| AlembicCore | `22db575` | 18 个共同评分字段单源投影；内部知识更新端口解除具体仓储依赖；合并测试准备与参数化场景 |
| Alembic | `bea42bb` | 真实缓存/shutdown 调用直接消费 Core；删除 6 个 relay，更新资产清单和导入迁移说明 |
| AlembicPlugin | `0f7d203` | shutdown/coverage/事件类型直接消费 Core；删除 10 个 relay 及一个函数身份同义测试，同步资产清单与说明 |

完整提交 hash、提交差异统计和结束时工作树状态在 [final-state.json](final-state.json)。未推送、未发布、未改变 vendor 指针或用户安装的插件。

## 架构变化与兼容性

向量同步从完整存储类依赖收窄为四个实际方法，代际检查只需要两个读取方法。闭包保留 reader/writer 的 this；aggregate store 对 region 路由及终态清理的优先级保持，live entry_* 退休仍走 writer。完整 Store 消费者继续兼容。

评分共有字段集中到内部纯函数；创建前路由、持久化后的重算仍保留不同 usageGuide 回退、engagement 和 grounding 数据，以及原有评分失败策略。内部更新 port 明确 nullable 返回，file-first / DB-only 函数体及公开仓储类没有改动。

宿主代码直接使用已有包入口，删除的文件均为纯 re-export。两份 shared-asset manifest 只退休六个 relay 对齐条目，剩余约束和门禁实现不变。旧源码别名及 dist 深路径现已移除，替代入口写入两宿主 README 的 Shared Core imports 表；工作区外仍使用旧深路径的集成需据此迁移。

Core package.json 与基线逐字相同，68 个 exports 保持：31 stable、8 provisional、29 transitional。最终 [AST 清单](interface-inventory.json) 中两宿主严格定义的纯 Core relay 数从 16 降为 0；[删除检查](relay-removal-check.json) 确认其源码及 .js/.d.ts 旧产物全部消失，旧消费者导入扫描无命中。该定义不包含有行为的 adapter，未把这些能力一并删除。

## 验证结果

| 对象 | 命令 / 验证范围 | 结果 |
| --- | --- | --- |
| Core 窄向量调用 | [编译探针](vector-port-probe.mjs)，实际调用 sync/inspect 并同时传完整 Store | 正确 RED：2 个 TS2345；GREEN：0 诊断 |
| Core 向量 | SyncCoordinator、RecipeRegionVectorIndex、RecipeVectorGeneration、VectorIndexPorts | 改前 65 passed；改后 67 passed |
| Core 知识 | KnowledgeService、grounded paths、quality depth、持久化、生命周期、FailureSemanticsCO3 六套 | 改前 153 passed；改后 157 passed |
| Core 整体 | `npm run check`：构建、API/分层/消费者/作用域等门禁、公开入口 smoke、全量测试、lint | **2247 passed、1 skipped**；196 个测试文件通过，1 个文件按既有配置跳过；全部命令成功 |
| Main | `build:self`、`lint`、`lint:repo-boundary`、`lint:consumer-core-imports`、`check:shared-asset-drift` | 通过；lint 有 5 条未触碰文件中的既有 noExplicitAny 告警 |
| Main 回归 | ShutdownCoordinator + HttpApi 的 Health Endpoints | **19 passed**；另外 15 个 HTTP 用例由名称筛选排除，不称为全量 Main 测试 |
| Plugin | `npm run check`、`npm run build` | 通过；check 覆盖类型、lint、边界、共享资产和双壳漂移 |
| Plugin 回归 | shutdown、ServiceContainerShutdown、CoverageLedgerWiring、HostAgentDimensionCompletionWorkflow | **54 passed**；原 55 项中删除 1 项纯身份同义断言 |
| Plugin 交付路径 | `verify:codex-plugin`、`verify:plugin-distribution`、`smoke:codex-plugin` | 打包、模拟安装、启动、shell bootstrap、stdio 全部通过 |
| 提交后 provenance | 源码/编译代码/入口哈希与已验证构建一致；postbuild 仅校准 commit；新临时 prepared runtime freshness | 全部通过，源码与运行代码哈希未变化 |
| 文档与工作树 | 三仓 `git diff --check`、交付物链接/JSON/路径自检 | 见 final-state.json 与 artifact-check.json |

命令、退出码、耗时、日志索引在 [checks.jsonl](checks.jsonl)。执行使用既有 Node.js 22 和已安装依赖。日志中的 workspace/home/系统临时根已归一化，保留相对文件名、诊断、计数和退出码。

本次保留测试先行过程的初始失败记录：编译探针曾漏 ambient declarations，新增断言曾误判 legacy entry 路由及 grounding rangeText；都在相应产品实现前纠正，最终基线通过。它们是探针/期望修正，不计作修复了三个产品 bug。评分投影与仓储类型为保持行为的重构，未制造运行时 RED。

## 自审、工作树与后续

[向量自审](vector-review.md)、[知识自审](knowledge-review.md)、[宿主自审](relay-review.md) 分别记录范围、兼容性、错误合同和证据。只读复核也未发现 P1/P2 或遗漏消费者；Main 独立的事件类型模块及负向边界断言按其职责保留。

Core 原有 AGENTS.md / CLAUDE.md 修改及未跟踪 coverage/index.ts，三个仓库的原有规则文件修改均未纳入本轮提交。结束时 Main 还出现本轮未修改的 AgentRunInputBuilders、DimensionRuntimeBuilder、相关测试以及若干新 adapter/context 文件，已原样保留并在 final-state.json 逐项记录。本轮验证对应本轮提交的切片，不替这些并行未提交改动做验收。

下游继续通过 `file:../AlembicCore` 消费，dist 已构建；发布形态没有变更版本或指针。Main 的 lint 告警位于未触碰的 AgentRunProjections.ts / handler-runtime.ts，保留为后续审查输入。没有运行真实用户 Codex 会话；本轮以临时项目的完整 stdio smoke 验证受影响启动接线。

下一步优先核对同名公共 KnowledgeRepository 的返回值契约，以及两个宿主 sourceRef / generation 的行为差异，再决定兼容迁移。它们来自上轮研究，当前没有把差异直接合成一种行为。
