# Alembic Recipe 生产端与检索表达整体质量优化 — Original Plan

- Design Key: `alembic-recipe-production-retrieval-quality-2026-07-13`
- Date: 2026-07-13
- Status: confirmed; ready-for-controller-intake
- Owner Window: Design
- Receiving Window: AlembicWorkspace controller
- Requirement Type: requirement
- Priority: P0
- Auto Claim: no

## User Goal

基于 Alembic 五个产品仓库的真实代码和 BiliDili / AlembicWorkspace 真实知识检索表现，重构 Recipe 从生成、审阅、持久化、关键词投影、document embedding 到向量维护的完整生产链，使 Recipe 自身提供真实、可追溯、可审阅、适合关键词与向量共同消费的检索表达，并清理所有不属于最终四类生产能力的历史提交旁路。

最终受支持的 Recipe 生产能力只有：

1. 冷启动；
2. 增量；
3. 模块扫描；
4. 知识提交。

四类能力可以分别由 Alembic 主体、AlembicAgent 或 AlembicPlugin 提供宿主适配，但它们必须汇入同一个 AlembicCore authoring / readiness / persistence contract。现存 `AiScanService → KnowledgeService.create`、`POST /api/v1/knowledge → KnowledgeService.create`、Dashboard `knowledgeCreate → auto publish` 等实现只是待替换或删除的历史路径，不是要保留的并行入口。

## Problem

上一需求已经完成了 `EmbeddingPort`、`VectorIndexReader/Writer`、`KnowledgeRetrievalPort`、权威 DB truth projection、Recipe 聚合/refill、Search/Prime 共同消费和只读查询边界。本需求不重做这些消费者架构，而是处理其上游仍在持续制造低质量检索材料的问题。

当前代码与真实知识数据共同证明：

- 关键词与 document embedding 从不同字段集合生成，同一 Recipe 在两个 lane 中表达的事实不一致。
- 固定九类 region 把同一标题和 trigger 重复锚定到多个向量文档，却遗漏最丰富的 `content.markdown`、`coreCode` 和 `usageGuide`；路径和质量台账还可成为独立召回文档。
- Recipe 的“字段完整/内容较长/评分为 B”不代表适合检索。BiliDili 目标 Recipe 的 `topicHint` 是无意义默认值、`moduleName` 为空、`coreCode` 被机械替换为整份贡献文档，但仍通过现有评分和发布链。
- 真实八查询当前稳定 public Search 排名为 `1/1/1/1/1/5/5/1`。第 6、7 条的 dense rank 已分别为 2、1，但 sparse rank 为 23、28，融合后均第 5；只调 embedding 或 RRF 不能闭环。
- 真实 BiliDili 查询每次仍过滤 5–14 个 orphan vector；当前 reconcile 只检查 `entry_<id>`，不能证明每条 Recipe 的全部预期 region 都存在且来自当前投影版本。
- 同维模型切换、provider/model 变化或 Recipe 投影 schema 变化没有 index generation fingerprint。当前迁移先 clear 再 full rebuild，失败时旧索引已经丢失。
- AlembicAgent、Plugin、Alembic CLI/HTTP、Dashboard 的生产门和修复策略不同；部分入口直接绕过 `RecipeProductionGateway`。
- 现有八查询 fixture 直接给目标候选拼接英文概念并注入 dense ranks，不能证明真实生产数据和实模检索。

## Confirmed Product Decisions

### Recipe retrieval expression

- 新增持久化、Dashboard 可审阅、带 provenance 与 `schemaVersion` 的 Recipe 检索表达。
- 实现优先作为 Recipe 内嵌 `retrievalProfile` / Markdown section 和现有 SQLite wire 字段的增量扩展；不预设独立数据库或第二套知识状态系统。
- 检索表达以项目主语言为主，并包含从源码 evidence 派生的英文技术 summary、concepts、scenarios 与 exclusions。
- 禁止使用冻结测试 query、目标 Recipe ID、全局硬编码同义词或针对单一 Recipe 的特判来生产检索表达。

### Publish readiness

- pending / staging 可以保存不完整或待修的 Recipe。
- `publish → active` 只受确定性的 `RetrievalReadiness` 结构约束。
- provider 离线、向量待同步、真实查询排名、瞬时检索降级都不得阻断 publish。
- 现有 active legacy Recipe 不立即下线；它们进入迁移报告并通过兼容投影继续可读。

### Final production boundary

- 最终只支持冷启动、增量、模块扫描、知识提交四类 Recipe 生产能力。
- `AiScanService` 的模块扫描能力保留，但其 direct create 实现必须改接 Core 的统一生产合同。
- 通用 HTTP `POST /api/v1/knowledge` 不作为 Recipe 创建入口继续存在；其真实 caller 迁移后删除或返回明确 retired contract，不得暗中继续直写。
- Dashboard 保留 retrieval profile / readiness 的人工审阅和编辑职责，但不保留创建 Recipe 后自动 publish 的旁路。
- 临时兼容桥只在真实 caller 无法一次迁移时允许存在，并必须记录 consumer、理由、移除条件、cleanup trigger 和 owner。

## Scope

| Area | In scope | Out of scope | Notes |
| --- | --- | --- | --- |
| Recipe truth | 内嵌 retrieval profile、provenance、schema version、readiness | 第二知识数据库、查询答案缓存 | Markdown 仍是真相源，SQLite 为权威索引 |
| Producer | 冷启动、增量、模块扫描、知识提交统一合同 | 新增第五种生产入口 | 宿主适配可不同，落库合同唯一 |
| Keyword | 与 dense 共用同一 retrieval document set | 查询词特判、全局同义词表 | 字段权重可按文档 role 定义 |
| Dense | query/document adapter 保持；优化 document 生产 | 更换模型代替修复数据 | provider-specific format 仍只在 adapter |
| Region | 语义角色收敛、信息密度/重复控制 | 固定九块机械切分继续扩张 | source path 不再独立参与召回 |
| Lifecycle | generation manifest、exact reconcile、shadow build、rollback | query-time rebuild/reconcile | Markdown→SQLite→vector 单向派生 |
| Legacy cleanup | caller replacement、桥接、删除与证据 | 将旧路径重命名后长期并行 | 删除必须在 consumer 迁移后 |
| Dashboard | profile/readiness 审阅、编辑、迁移状态 | Recipe 创建/自动发布旁路 | 仍可审阅 pending/staging 和触发合法 publish |
| Validation | 产品仓测试、controller copied-snapshot 双项目验收 | 修改真实 BiliDili/AlembicWorkspace 知识 | no Test window |

## Priority Rationale

Priority 为 P0，原因是当前受支持和历史旁路都能继续写入检索表达失真的 active Recipe，生产越久，后续需要诊断、迁移和重嵌入的存量越大。P0 不授权跳过 Core→consumer 顺序、不授权修改真实知识库，也不授权 auto claim。

## Primary User Scenarios

### New Recipe production

开发者通过四类受支持能力之一生成或提交 Recipe。系统保存完整 Recipe 和 evidence-grounded retrieval profile，在 pending/staging 阶段展示确定性 readiness 缺口；只有结构 readiness 通过后才允许 active。active 后 keyword 与 vector writer 从同一投影生成文档。

### Existing Recipe maintenance

Recipe 更新、删除、替换、provider/model/dimension 或投影 schema 变化时，维护链生成新的预期文档集合，以新 generation 完成写入和验证后再切换；失败保留旧 generation 并留下可观察的 pending/stale/failed 证据。用户查询从不触发修复。

### Human review

维护者在 Dashboard 查看 profile、字段 provenance、readiness 缺口、projection version 和 index generation 状态；可以编辑受支持字段并通过合法 publish transition，但不能绕过生产合同创建并自动发布 Recipe。

### Retrieval acceptance

总控在受控副本上复跑 BiliDili 八查询、AlembicWorkspace 控制查询、Search/Prime 候选一致性、keyword/dense/RRF 贡献、生命周期故障注入和索引代际切换。正确的历史查询不能回退，失败查询必须改善，同时真实知识数据前后指纹不变。

## Final Completion Definition

Wakeflow 只可在以下全部成立后接受本需求：

1. AlembicCore 提供一个真实被四类生产能力消费的 Recipe retrieval profile、readiness 和 projector 合同；没有 unused interface 或 type-only phase。
2. retrieval profile 作为现有 Recipe / Markdown / SQLite wire 的增量字段存在，带 `schemaVersion` 和字段级 provenance；没有第二套知识真相或查询答案数据库。
3. profile 的英文技术表达由当前 Recipe 的源码 evidence 和项目事实派生；测试 query、目标 Recipe ID、全局同义词表不出现在生产算法或配置中。
4. keyword 和 dense document 由同一 `RecipeRetrievalDocumentSet` 生成；两 lane 可采用不同权重或 provider formatting，但不能选择冲突的事实字段。
5. region 至少有一个必需 intent 文档，可选 guidance / implementation / rationale 文档只在信息充足且非重复时产生；source path、quality bookkeeping 和 bridge refs 只做 metadata/evidence，不成为独立召回主题。
6. `RetrievalReadiness` 只验证确定性结构、evidence grounding、字段语义和投影可生成性；排名、provider 在线、vector ready 不进入 publish gate。
7. pending/staging 可保存；所有合法 `publish → active` 路径均调用同一 readiness 判定。现有 active legacy Recipe 不被批量下线。
8. 四类受支持入口均连接统一 Core contract；AlembicAgent 和 AlembicPlugin 的提交路径不再各自发明检索字段语义。
9. 模块扫描不再直接调用 `KnowledgeService.create`；它通过已连接的生产端口保存并获得统一结果信封。
10. Dashboard 不再调用通用 Recipe create 后自动 publish；保留 profile/readiness 审阅、编辑和合法 lifecycle 操作。
11. `POST /api/v1/knowledge` 的所有真实 caller 完成替换；import/reference/API contract scan、代表性构建与测试通过后删除 Recipe create route 或将其变成明确 retired、零写入口。
12. 所有临时兼容桥均有真实 consumer、owner、移除条件和同需求 cleanup phase；需求结束时无无主兼容层。
13. entry incremental、full rebuild、Recipe region build 使用同一 projector 输入；不存在 event path title-only、rebuild path raw JSON 的文档漂移。
14. vector manifest 能区分 projection schema、provider、model、dimension、format profile 与 corpus generation；同维模型变化也能识别不兼容。
15. Recipe 更新采用 verified replacement；删除和 deprecated cleanup provider-independent；exact reconcile 能发现 orphan、missing、partial、duplicate 和旧 generation region。
16. full migration 使用 shadow build + verified switch，失败保留旧 generation；rollback 能恢复先前可用 generation，不能 clear-first 丢失当前索引。
17. BiliDili 八查询在受控快照和冷进程中重复运行，八条均非空，目标权威 Recipe 每条至少 Top 3；当前正确的第 1–5、8 条不得回退。
18. q6/q7 的 keyword 与融合缺口得到真实改善；证据包含 raw dense similarity/rank、sparse score/rank、RRF contribution 和最终 Recipe rank，不得只展示最终名次。
19. AlembicWorkspace 控制查询保持预期知识 Top 3，且不新增由路径、重复 region 或默认字段导致的主题污染。
20. Search 与 Prime 对相同 query/filter/candidate limit 的 ordered Recipe candidates 一致；Prime 只改变展示数量/分组。
21. 重复运行和新临时 Codex 窗口加载后的冷进程运行无偶发 sparse-only 回退；若 provider 真不可用，结果必须显式降级且 keyword truth 仍可用。
22. Core、Agent、Plugin、Alembic、Dashboard 各自完成其真实任务和提交证据；依赖顺序按 Requirement Design 执行。
23. 总控在 BiliDili 与 AlembicWorkspace 的只读原始数据上只做查询和指纹；重投影、重嵌入、迁移演练只在受控副本中运行。
24. 真实 DB/WAL/SHM/config/vector/Recipe 文件在验收前后 `exists + size + mtime + sha256` 一致；不通过修改真实知识内容制造排名通过。
25. 不创建 Wakeflow Test 窗口，不修改已归档 Graph/Recipe Map 分页架构，不重新引入查询时写入、Plugin↔Alembic 主体耦合、Git/host/knowledge-status 查询门禁。

## Non-goals

- 不修改 BiliDili 产品源码或真实知识内容。
- 不在验收中对真实 BiliDili / AlembicWorkspace 执行 init、bootstrap、rescan、reconcile、rebuild、re-embed 或 migration apply。
- 不新增独立 retrieval database、第二状态机或持久化查询答案。
- 不把真实查询排名、provider 健康、vector ready 变成 Recipe publish gate。
- 不为单一目标 Recipe 或八条查询硬编码同义词、概念、ID、权重或分支。
- 不把 `AiScanService` direct create、HTTP create、Dashboard auto publish 包装成“兼容入口”长期保留。
- 不删除仍被四类受支持能力真实使用的生产能力；只删除已接通 replacement 的重复实现和旁路。
- 不修改已归档 Graph / Recipe Map 的实时构建、分页、cursor 或 ProjectContextBuildSession 架构。
- 不恢复 Plugin 与 Alembic 主体的运行时直连。
- 不增加查询前置可见性、角色、Admin、host project、Git revision、knowledge status 或 index readiness 门禁。
- 不提高超时或扩大候选池来掩盖生产数据问题。
- 不创建 state root、task package、pod、Test card 或实现派发于 Design 阶段。

## Known Evidence

### Code evidence

- `AlembicCore/src/service/knowledge/RecipeProductionGateway.ts`: schema validation、similarity、consolidation、KnowledgeService create、best-effort quality 与 supersede proposal 的现有顺序。
- `AlembicCore/src/service/knowledge/KnowledgeService.ts`: file-first Markdown、SQLite write、`knowledge:changed` / delete / lifecycle event；`updateQuality` 不发 knowledge changed。
- `AlembicCore/src/service/vector/RecipeRegionVectorIndex.ts`: 固定九类 region、重复 title/trigger anchoring、遗漏 markdown/coreCode/usageGuide。
- `AlembicCore/src/service/search/SearchEngine.ts`: keyword corpus 与 field weights；moduleName/topicHint/coreCode/usageGuide 当前不进入 keyword corpus。
- `AlembicCore/src/service/search/KnowledgeRetrieval.ts`: 已落地的只读 common policy、truth projection、聚合与 refill。
- `AlembicCore/src/service/vector/SyncCoordinator.ts`: event/reconcile 文本投影不一致和 entry-only missing 判定。
- `AlembicCore/src/service/vector/VectorService.ts`、`HnswVectorAdapter.ts`: dimension-only guard 与 clear-first migration。
- `AlembicAgent/src/tools/runtime/handlers/knowledge.ts`: evidence/coreCode/style 机械修复后调用 gateway 的 in-process submit。
- `AlembicPlugin/lib/host-runtime/mcp/handlers/tool-router.ts`: host submit 的 stage gate 与 gateway route。
- `AlembicPlugin/lib/recipe-pipeline/generate/recipe-region-vector.ts`: rescan/rebuild 的 authoritative corpus region maintenance。
- `Alembic/lib/cli/AiScanService.ts`: 模块扫描 direct create + direct publish。
- `Alembic/lib/http/routes/knowledge.ts`: 通用 POST create 和 lifecycle routes。
- `AlembicDashboard/src/App.tsx`、`KnowledgePayload.ts`: create 后自动 publish、编辑只回写部分字段。

### Runtime evidence

- BiliDili current stable auto ranks: `1/1/1/1/1/5/5/1`。
- q6/q7 target dense ranks: `2/1`; sparse ranks: `23/28`; final ranks: `5/5`。
- q6/q7 keyword Top 12 均无目标；q8 keyword rank 11 但 semantic/auto rank 1。
- BiliDili 每条查询过滤 5–14 个 orphan candidates。
- AlembicWorkspace 三个控制查询的预期 Recipe 均 Top 1，filtered orphan 为 0/0/1。
- q6 Prime 接收前四条知识且目标不在其中，与 Search rank 5 一致。

### Source baseline

| Repository | Audited HEAD | Worktree |
| --- | --- | --- |
| `AlembicCore` | `d17db939ed49ea30bdbf380f400b783530b6d6a8` | clean |
| `AlembicPlugin` | `79f46cda0a1325b5e5a32a8e629fbb822ca65fdc` | clean |
| `Alembic` | `ac4921580ec1bbfb644886b6a201baeb1c1a2921` | clean |
| `AlembicAgent` | `8aa184b88cbe99f07349ce8bfff69443dd98143d` | clean |
| `AlembicDashboard` | `f26427682f45cce6ce5ce4304ce9dfde84c26f17` | clean |
| `BiliDili` | `12c0531cbf1bea36102f9d2d2b8ad4e1cef09221` | clean |

## User-Confirmation Ledger

| Decision | Status | Recorded boundary |
| --- | --- | --- |
| 持久化、Dashboard 可审阅的 Recipe 检索表达 | confirmed | 作为 Recipe 内嵌 retrieval profile/section 优先，不预设独立 DB 或第二状态系统。 |
| 主语言 + evidence-grounded English technical summary/concepts/scenarios/exclusions | confirmed | 禁止测试 query、目标 Recipe ID 和全局硬编码同义词。 |
| pending/staging 可保存 | confirmed | 不完整项可在非 active 生命周期审阅和修复。 |
| publish→active 使用确定性 RetrievalReadiness | confirmed | 只检查结构/evidence/projectability。 |
| provider 离线、vector pending、真实排名不阻断 publish | confirmed | 这些是派生维护和验收信号，不是生产准入。 |
| legacy active 不立即下线 | confirmed | 进入迁移报告并使用兼容投影。 |
| 最终只支持冷启动、增量、模块扫描、知识提交 | confirmed | 其它 Recipe 提交路径属于历史遗留。 |
| 旧旁路必须 replacement→bridge if needed→delete | confirmed | Dashboard review 不授权保留 create/auto-publish。 |
| 存量真实知识不在验收中原地修改或重建 | confirmed | 只要求 dry-run/shadow/rollback 能力与副本演练。 |
| Test decision | confirmed | no Test window；controller 双项目受控验收。 |
| Auto Claim | confirmed | false；交付后由 controller 人工领取。 |
| 未决产品问题 | none | 所有范围、行为、入口、迁移和验证取舍已确认。 |

## Testing Decision

- Decision: `no Test window`。
- Controller self-verification: 产品仓单元/契约/构建/边界测试、受控数据副本的 migration dry-run/shadow/rollback、BiliDili 八查询与 AlembicWorkspace 控制查询、Search/Prime parity、provider/model/schema 生命周期故障注入。
- Real read-only check: 只对 BiliDili 与 AlembicWorkspace 原始知识根运行 Search/Prime 和前后指纹；不运行任何维护命令。
- Cold process: 若 MCP 需刷新，controller 新开临时 Codex 窗口加载更新后的 MCP；这不是新 Test 环境或 Test 窗口。
- Success: 完成定义第 1–25 项均有原始代码、提交、命令输出、runtime JSON 和指纹证据。
- Failure: 任一受支持入口仍绕过合同、旧旁路仍可写、q6/q7 未改善、控制查询回退、generation 无法回滚、真实数据发生写入或测试依赖目标特判。
- This validation cannot prove: 未实际执行的生产数据原地迁移安全性；本需求只交付可演练的运维能力，真实 apply 需未来显式操作授权。

## Design Exit Gate

- Original Plan: complete and confirmed.
- Code-fact reconciliation: complete against current five product repositories and two real knowledge modes.
- Landing plan and per-window `designIntent`: complete in the linked Requirement Design.
- Non-goals: complete and confirmed.
- User-confirmation ledger: complete; no open product question.
- Test decision: complete; no Test window.
- Delivery authorization: confirmed; `autoClaim=false`.

## Linked Requirement Design

`Design/docs/current/alembic-recipe-production-retrieval-quality-requirement-design-2026-07-13.md`
