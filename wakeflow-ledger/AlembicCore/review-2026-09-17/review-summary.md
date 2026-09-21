# AlembicCore 审查、修复与精简

本轮以 `e274e31` 为基线，清单覆盖 830 个跟踪文本文件、232,370 行，其中 580 个源码文件。新增文件另列；二进制 grammar、锁文件和构建产物不冒充人工源码审查。源码按模块阅读全文，测试、配置、脚本和文档分别记录人工阅读或结构检查的真实深度。

用户授权 Core 全仓 review、修复与清理，并允许 Alembic / AlembicPlugin 的必要接线。未修改 vendor、发布快照、其他仓库产品代码或 Wakeflow 控制状态。用户原有 AGENTS.md / CLAUDE.md 修改及原先被 ignore 隐藏的 coverage/index.ts 均保留在本轮提交之外。

## 当前代码如何工作

|层/模块|实际职责与主链路|
|---|---|
|domain/knowledge、dimension|KnowledgeEntry 与 Content/Reasoning/Stats 等值对象，六态生命周期、维度规范、创作校验与质量/检索就绪判定。门禁和建议评分用途不同。|
|core/ast、analysis、discovery、enhancement|grammar/plugin 解析、符号/调用/数据关系与项目构建清单发现；框架增强包中 Guard 规则有真实消费者，其余扩展 hook 不等于已接入业务链路。|
|infrastructure|SQLite/Drizzle/migrations、文件写入区域、配置、日志、事件/信号、缓存、JSON/HNSW 向量与 WAL。|
|repository|知识、来源引用、图、快照、会话、演化提案、覆盖账本等持久化；SQLite 是查询索引，知识 Markdown 是持久真相。|
|service/knowledge、sustain|候选归并/校验/准入→文件写入→DB更新；来源校验、补丁、staging、生命周期和进化提案。|
|service/search、vector、guard|关键词/字段/向量候选检索与事实投影、排名和过滤；代码/AST/跨文件 Guard、反馈与违规历史。宿主负责 AI/provider 装配。|
|service/project-context、source-graph|source slice→symbol→flow→module/layer→map→repo/space 的可追溯上下文，以及持久图的增量、freshness、查询和验证建议。JS/TS SourceGraph 仍包含既有规则提取器，不宣称完整编译器语义。|
|service/production、project-context/foundation|冻结事实、内容身份、见证绑定、执行/语义审查收据、防重放、私有 revision 与持久化验证；不同协议版本有兼容职责，不能当普通重复文件删除。|
|workflows、daemon|规划、宿主会话/briefing、维度完成、checkpoint、结果持久化及 job/runtime/display 契约。Core 不承担宿主 Agent、MCP transport、CLI 或 UI。|

## 已修复的问题类别

- **数据与恢复**：生命周期/补丁/规则启停的文件与数据库不一致；UoW 错误补偿误删已有文件；同名知识文件覆盖；文件 hash 不一致；会话 reload 丢后续写入；失败时误清 checkpoint；source graph generation 非原子替换。
- **向量持久化**：WAL 保存失败仍清日志、恢复后提前确认、保存期间追加漏写、非 WAL 并发漏写、空向量仍召回旧 embedding、路径 ID 碰撞及已删除文件残留。旧 ID 保留；无法证明来源归属的旧残留不自动删除。
- **检索与上下文**：同秒更新遗漏、上下文缓存串用、降权后排序失序、同步接口抛错拖垮健康通道、`constructor` 搜索词导致 NaN、知识集合 type 别名失配、正式 repository 丢 scope/dimension/tags；来源歧义、注释导出误报、同名调用方错绑、模块变化/环计数和 NodeNext 适配缺口。
- **解析与项目发现**：真实 AST callee 与参数字符串混淆、多语言合法名称撞对象原型、Python 导入漏项、增量 ProjectGraph 清错贡献；Bazel/JVM/Generic/SPM/CMake 的路径、迭代、实例重置、目标文件和依赖接线问题。
- **边界与严格验证**：缓存/trace 路径逃逸、配置原型写入、坏配置覆盖、SourceGraph 越界符号链接读取与重复预算；witness 关系重绑定、非布尔支持证据和未完成 SQLite checkpoint 被错误签发。
- **Guard**：ruleId 清理忽略过滤、规则停用被同步恢复、行号、同秒历史去重，以及已通过 AST 规则校验却不能保存的问题。

具体复现、修复位置和 RED→GREEN 证据见逐模块 findings；不是用全绿测试代替对缺陷的解释。独立复核和消费回归还发现并修正了本轮自身的兼容回归：旧 frontmatter key 空白、legacy bridge refs、动态 callee selector、incoming 符号边和旧 plain-stats 输入。

## 接口与冗余精简

保留全部 68 个 package export key：31 stable、8 provisional、29 transitional。根入口有历史聚合出口，本轮不做破坏式收缩；新消费者优先用稳定、聚焦的子路径。必要的新构造选项均有真实宿主消费，内部 helper 不扩到公共根入口。

- 收敛 9 份语义完全相同的引用去重、重复快照 row 映射、Jaccard 算法和来源标签映射。
- 删除已证实无调用的私有代码和非公开旧投影；保留有不同排序/覆盖语义的近似实现。
- 精简重复具名类型再导出；daemon/vector/foundation 三门面共 570 个 TypeScript 导出名称、symbol flags 与声明来源前后一致。
- CI 复用已有 `npm run check`，补齐普通 PR 漏跑的门禁；release 移除重复 build/smoke。未执行发布。

删除、替代入口和保留理由见 `root-cleanup-and-review.md`、`production-cleanup-map.md`、`intelligence-tests-findings.md`。

## 测试精简

移除 `DomainLifecycle.test.ts`、`ReportFacade.test.ts`、`AstGrammar.test.ts`，独有断言迁入已有行为/公共入口测试。合并重复 tokenizer/clear/生命周期断言，删除 mock 自证、`length >= 0` 等空断言和 throwaway 初始化；修复单 case 依赖前一 case 的索引初始化。四项 Core 边界测试完整保留。

新回归集中覆盖真实缺陷、SQLite、文件、grammar、索引重启和宿主 ServiceContainer 接线。总测试数量可能增加，不能用删掉错误路径覆盖来换取表面精简。

## 验证与交付

<!-- final-validation:start -->
最终代码使用 **Node 22.23.2** 验证：

|仓库|结果|
|---|---|
|AlembicCore|`npm run check` 全部通过；194 测试文件通过、1 跳过；**2155 项测试通过、1 跳过、0 失败**。所有13步检查通过。|
|Alembic|全仓 `tsc --noEmit`、8个改动文件 scoped Biome 通过；相关7套件共44项用例分批通过。|
|AlembicPlugin|全仓 `tsc --noEmit`、4个改动文件 scoped Biome 通过；相关8套件共54项用例分批通过。|

外层首轮唯一失败组为 legacy plain-stats 生命周期用例。Core 修复后，两边各16项用例重跑通过；其余28/38项先前已通过，未把重复运行计入总数。原失败与修复日志均保留。

原环境 Node 24 与已有 better-sqlite3 二进制 ABI 不匹配；本轮使用隔离 Node 22 验证，没有修改系统运行时。`dist/` 已构建且不提交。初始 Node 22 基线为1905通过/1跳过；本轮新增缺陷回归且合并重复断言后为2155通过/1跳过。

本地提交：

- AlembicCore：`fec4b763af7bdedf5aeea8ab3e579e9d745795e9`（`codex/core-review-cleanup`，213文件；8357行新增、2478行删除）。
- Alembic：`4dc86fbb95ae67a86ddf215406ae4767901f3dd8`（`codex/core-knowledge-writes`，8文件必要接线/回归）。
- AlembicPlugin：`aee9b5572055559d3b30995c0c16534eef0fb425`（`codex/core-knowledge-writes`，4文件必要接线/回归）。

三个仓库 `git diff --check` 通过。本次提交不含用户原有指令文档改动；Core剩余未跟踪coverage/index.ts也不是本轮产物。没有push或发布。

完整命令、分批测试口径与日志哈希见 `verification.json`；逐文件目录为 `file-review.json` / `file-review.csv`。共837项中749项完整语义阅读、88项结构/静态检查；全部583个现有及新增源码条目均完成语义阅读。
<!-- final-validation:end -->

## 保留边界

- 文件与 DB 不是分布式原子事务；已落文件会保留，失败明确暴露并给同步恢复路径。既有审计 best-effort 分支不因此被宣称为全服务事务保证。
- `destroy()` 保持同步接口；可靠向量关闭顺序为先 `await flush()`，再 `destroy()`。
- 未证明 producer 所有权的历史向量残留保留。JobDisplay 的 summary-only 是否约束独立 LLM 投影缺少明确产品契约，本轮不猜测改写。
- 未运行真实用户项目、远端服务或 AI 请求；外层验证限必要接线/消费，未声称外层全仓测试全部通过。
- 下游继续使用现有 `file:../AlembicCore` 包入口；先构建 Core dist。dist 不提交，不更新 vendor/release 指针。
