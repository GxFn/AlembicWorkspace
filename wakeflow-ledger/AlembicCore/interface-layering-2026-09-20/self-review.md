# 接口分层与结果整合自审

状态：本轮知识/检索/演化接口切片已实施、整合到原工作树并提交。不是全仓每一文件已经审毕的声明。用户明确选择采用并行的新结果语义，覆盖原先在 Main/Agent 保持 TypeError 的安排；Core DB-only 原运行时行为仍保持。未接管旧 planned demand，也未修改 Wakeflow 控制状态。

## 范围与分层

Core 将依赖契约、更新 schema、业务编排、写协调和仓储映射分开。KnowledgeServiceRepository 准确声明真实可空写后读回；两个旧 KnowledgeRepository 入口保留。FileStore、graph、routing、hooks 等按所需能力注入，Gateway 接收实体类并如实保留 raw 对象身份/null。SearchEngine 接收 raw DB 或句柄，解包留在 Core。package exports 的 68 个入口与基线完全一致。

Main/Plugin 的注册职责分成 KnowledgeModule / KnowledgeRetrievalModule / KnowledgeEvolutionModule；Main 两个仓储归 Infra。ServiceMap 与已有注册匹配，去除 76 处 get 调用的类型断言，以及整块 options、Gateway knowledgeService 断言和假的 EventBus import helper。类型擦除后的工厂 AST 对照确认 Main 54、Plugin 48 个注册项无增减、运行时工厂主体无变化。惰性工厂、初始化顺序及两宿主策略差异保留。

Main 空回执 helper 同时服务 HTTP 与严格生产流程；Agent 只改两个已授权结果消费源文件与原有测试。publish=null 明确 unknown / requiresReadback / 不自动重试；created.raw=null 保留已确认创建身份并增加 degraded 警告，不以模型内容冒充持久化详情。Core 原异常不被 helper 重标；批处理只将有回执项列入成功子集。

代码旁说明与产品地图见 [知识接口文档](../../../AlembicCore/docs/knowledge-integration.md)。先前腾讯本地源码与一手资料的取舍继续适用，见 [接口研究](../interface-architecture-2026-09-20/architecture-proposal.md) 与 [腾讯调用链](../interface-architecture-2026-09-20/tencent-reference.md)；没有照搬一个无人消费的 helper 或扩大到 provider/tool runtime。

## 两阶段自审

1. 目标与范围：本轮覆盖真实宿主装配、Core 契约、Agent 结果读取、HTTP/strict 消费与真实文件/数据库同步。Core 内核没有裁成占位接口，边界测试继续存在。Main/Agent 其它在途代码未加入本轮提交。
2. 正确性与维护：只读复核未发现本轮未解决的 P1/P2。Proxy 属性读取差异已按原 receiver 语义修复；过期预热注释已校准。额外发现并修复两项真实问题：symlink CLI gate 只 exit 0 却没有扫描；重复加载相同 WASM grammar 导致累计内存越界。两项均有真实入口 RED/GREEN 证据。

测试整理采用边界归属：复用原有持久化、hooks、生产链和装配 fixture，批量 HTTP 与 Agent 操作使用参数化用例；文件拆分用一次工厂 AST 对照，不新增逐工厂同义测试。保留必需 Core 边界测试，本批不以删掉失败测试换取通过。

## 最终验证

| 仓库/边界 | 命令与结果 | 证据 |
| --- | --- | --- |
| Core | npm run check；2266 passed / 1 skipped，typecheck/lint/retired gate 通过；npm run build 通过 | [组合检查](core-final-with-ast-cache.log)、[构建](core-ast-cache-build.log) |
| Core AST | 同一真实入口 140 次重载回归 RED→GREEN；500 次独立重载通过；损坏修复和同路径内容更新保持有效 | [根因与映射](ast-reload-root-cause.md) |
| Main 原工作树 | build:self、lint、Core import/repo gates 通过；7 个单元套件 30 passed，完整 strict 集成 19 passed | [接线测试](main-integrated-wiring-tests.log)、[strict 集成](main-integrated-strict-final.log)、[最终构建](main-build-with-current-agent.log) |
| Agent 原工作树 | build、build:check 通过；3 个知识/strict/scan 套件 125 passed。限定文件 lint、Core import gate 在隔离检出通过 | [定向测试](agent-integrated-tests.log)、[构建](agent-integrated-build.log) |
| Plugin | check 通过；使用最终 Core 重建，6 个接线套件 7 passed；完整 pack/install/startup/shellBootstrap/stdio smoke 通过 | [接线](plugin-final-wiring.log)、[构建](plugin-build-after-ast.log)、[smoke](plugin-final-smoke.log) |

所有运行命令、退出码、耗时、实际 cwd 与日志见 [checks.jsonl](checks.jsonl)。失败记录保留：早期未完成 clean build 时的消费方模块缺失；整合前两种空回执语义；严格套件触发的 AST 累计失败。不能把重跑后通过反写成基线全绿。Main lint 仍有 5 条既有 any 警告，位置在本轮未改的 AgentRunProjections.ts / handler-runtime.ts。Plugin smoke 是本地运行验证，不表示已经发布。

## 提交与并行工作

| 仓库 | 本轮提交 |
| --- | --- |
| Core | bcb8caa 依赖/schema/可空契约；f58093d Gateway 与 search ports；d1fbc14 symlink CLI gate；4b05225 宿主语义文档；d6a1b54 grammar 复用 |
| Main | 3832e71 模块分层及空回执消费 |
| Agent | 9638f25 已确认创建与缺发布回执语义 |
| Plugin | ef25c9f 知识/检索/演化装配分层 |

原先尝试 cherry-pick 因重叠脏文件被 Git 在合并前拒绝，没有覆盖文件，也未留下 CHERRY_PICK_HEAD。用户选择新语义后，先按 adopted-policy-snapshot.json 复制到隔离检出验证，再核对原工作树哈希，仅暂存限定文件。Main 提交 hook 未改变已验证内容。Main 的 13 个文件、Agent 的 3 个文件分别有整合提交清单。

隔离提交 fd98899 / 6e25e1e 仅保留整合前历史；后者的旧 TypeError 行为已被用户决定取代，不应再次 cherry-pick。Core 与四仓的规则文件、Core coverage/index.ts 和其它在途工作保持未提交。本轮不修改 vendor 指针、不提交 dist、不推送、不发布。Agent 其它在途文件持续变化，final-state.json 记录快照差异；本轮必要接线已验证，不代表对那些变化做了全面验收。

## 下游接入和下一步

继续用 file:../AlembicCore 与现有包子路径。构建顺序为 Core → Agent → Main；Plugin 从同一 Core 重建。宿主工厂直接注入真实 KnowledgeService；处理 nullable 时采用产品文档中的消费策略，不补回整块类型强转。严格流程只有收到发布确认才能产生 CONTENT_READY/PUBLIC_CAS。

原用户持续优化目标下的下一候选是 AST parser 缓存的 native 资源释放：当前注册/清空时仅删缓存引用，尚需独立的资源生命周期复现；未把此观察混入本轮 WASM grammar 根因修复，也未宣称进程资源已永久有界。后续 review 仍应按真实调用链推进，区分有实际消费方的 contract 与可删除的重复适配。
