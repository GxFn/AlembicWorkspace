# 搜索架构与代码整理结果

完成日期：2026-09-20。开始基线：8ab3783。最终提交：f39e139cb127a094caf052c68adbd6e0c88a0913。

## 结果

本轮逐项复核了 16 个搜索相关源码文件（含两个新增内部文件），阅读范围与最终 digest 见 [file-review.json](file-review.json)。其他模块保留前轮审查结果，本轮没有宣称重新全文覆盖全仓。

- 仓储选列由 KnowledgeSearchProjection 单点维护；全量/增量、Drizzle/raw 共用 27 字段索引投影。schema 校验从每个 adapter 构造 11 次 PRAGMA 减至 1 次。
- SearchDocumentProjection 负责纯粹的行→文档投影；每条索引知识的 canonical document set 从重复 2 次变为 1 次，文本/meta 共用结果。SearchEngine 保留请求、缓存、召回与排名编排。
- 两条 dense 路径共用命中映射与后处理，保留来源分数/空值差异、去重和过滤顺序、预算、fallback。canonical truth/budget 与旧 RRF 的不同语义继续独立。
- 删除无读取方的排名状态和两个 signal subscription；upsert 去掉重复 remove；搜索分组复用同一个已存在的公共函数。
- 算法用例集中到 SearchRanking，Engine 用例负责真实读取/召回/编排；合并 membership/DF/tombstone、upsert 和初始化等重复断言，强化旧权重别名与分组输出验证。没有新增测试文件，也没有削弱四个 Core 边界门禁。

产品职责地图见 Core 的 docs/search-architecture.md；[研究与详细测试迁移映射](research-and-review.md) 包含 TencentDB 本地源码、Vespa 和 SQLite 一手资料及不照搬的边界。

## 修复的已复现问题

1. 正式仓储缺少 LIKE ESCAPE，不能正确使用 SearchEngine 已转义的下划线、百分号、反斜杠模式；raw 对照正常。现已对齐。
2. 正式详情读取漏 kind/knowledgeType，向量 metadata 缺字段时，按 knowledgeType 的语义搜索漏命中。两来源×两仓储的真实查询已覆盖。
3. 排名配置从普通对象继承属性，导致 constructor/__proto__ 等未知场景归零、难度 NaN、语言查表抛错，且 JSON 自有 __proto__ 配置丢失。现在使用无原型私有字典，正常/default/seasonality 与浅覆盖逻辑不变。
4. Engine 与公共 helper 的分组循环均可能对继承属性调用 push 而抛错。现统一为三类 bucket；未知 kind 按既有约定归入 pattern，输入顺序保留。

上述缺陷有实际公开入口或真实数据库的 RED/GREEN。初版探针的无效失败及未匹配测试路径已在 research-and-review.md 明确说明，没有作为修复证据计数。

## 验证

| 范围 | 命令/覆盖 | 结果 |
| --- | --- | --- |
| Core 全链 | npm run check | 2194 通过、1 原有跳过；193 套件通过、1 跳过；build/API/layer/消费者/scope/smoke/budget/doctrine/naming/lint/retired 全通过 |
| 分组顺序补充 | SearchEngine 两入口定向用例 | 2 通过；完整检查后仅新增断言与注释/文档，无执行逻辑变化 |
| 构建产物 | npm run build | 通过；下游使用前重新生成 dist |
| Alembic | 全仓 tsc --noEmit；SearchPipeline / SearchRouteTelemetry | 通过；24 用例通过 |
| AlembicPlugin | 全仓 tsc --noEmit；5 个 Search/Prime/只读/输出套件 | 通过；14 用例通过 |
| 独立复核 | 6 组文档投影与旧入口、12 组两路语义结果深比较；列映射/分组/字典检查 | 未发现未修复 P1/P2；证据范围不扩展为全系统保证 |

完整命令、输出日志 SHA-256 与结果在 [verification.json](verification.json)。差异检查通过。package exports 仍为 68 项且内容完全不变；新增 helper 没有进入公开 barrel。

## 提交与接入

- 688cbbb — remove unused ranking state and duplicate index updates。
- f39e139 — centralize search projections and result handling。
- 已本地提交，没有 push/发布。两个外层继续通过现有 file:../AlembicCore 消费，无额外接线改动，故没有外层提交。dist 未提交，vendor/release 指针未改。
- 工作区仅保留原有 AGENTS.md/CLAUDE.md 修改与原有未跟踪 coverage/index.ts，本轮代码全部提交。
- 保留旧公开 DTO、转发、_buildDocText/_buildDocMeta 和 signalBus 参数；不将不同算法/不同结果协议强行合并。没有整体吞吐基准，11→1、2→1 只说明实测的重复工作消除。
- 后续继续按文件职责及真实消费者选择模块；公开接口进一步收缩需要兼容设计，不依据直接引用为零删除。
