# 搜索模块补充审查与修复记录

2026-09-18，`boundaries_consumers`。`intelligence-review-remaining.json` 中 `group=search` 的 8 个源码已全部人工全文语义读取：最终 4,511 行，逐文件具体函数、不变量、真实消费者、保留理由、审查 digest 见 `search-review.json`。这是源码阅读深度，不把阅读等同于全行为验证。

在独立只读审查中实证发现 S-001 / S-002，主线程授权最小修复；之后 S-003 及其真实双 adapter 回归暴露的 S-004 也分别获得授权。当前四项均已修复并有 RED/GREEN，本域没有已确认、尚未处理的功能 finding。产品修改已经冻结；不 commit、不操作 Wakeflow 状态、不修改外层仓库。主线程负责独立最终验收、全门禁及提交。

## S-001 / P2 — 合法代码词 constructor 污染词频字典，导致搜索命中丢失

- 根因：`src/service/search/FieldWeightedScorer.ts:74` 原 `docFreq = {}` / `topicDocFreq = {}` 对 `constructor` 读取到 Object.prototype 上的函数，累加后是字符串；IDF/tag specificity 传播 NaN，`totalScore > 0` 将准确命中排除。
- 真实入口：public `src/search.ts` 导出的 FieldWeightedScorer，以及实际临时 SQLite + public SearchEngine。标题/tag 为 constructor 的条目在 weighted / auto 返回空，factory 对照正常。证据 `search-public-review-probe.mjs` / `.log`。
- 最小修复：构造和 `clear()` 中两个字典均采用无原型 Record，保持数值 DF、公开属性访问、Object.keys 统计、评分公式、权重和排序合同。没有将公共 `docFreq` 改成 Map。
- 既有 `SearchEngine.test.ts` 新增公开 engine + 真库检索及重建测试，另覆盖 add/remove/clear 的 constructor DF。`search-constructor-red.log` 为 2 个真实失败；`search-constructor-green.log` 为 4 suites / 121 tests 通过，含 SearchRanking、SearchPipeline、public facade suites。

## S-002 / P2 — 同步检索端口错误绕过 allSettled，丢失健康通道

- 根因：`src/service/search/KnowledgeRetrieval.ts:187` 原来在创建 Promise.allSettled 输入前调用 `searchVector` / `sparse`；`Promise.resolve(sparse(...))` 不能捕获调用本身的同步 throw。KnowledgeSparseRetriever 合同明确允许同步返回。
- 真实入口：公开 KnowledgeRetrievalPolicy → HybridCandidateRetriever → KnowledgeTruthProjector。相同 sparse 错误以 async 抛出时保留 live dense Recipe并给诊断；同步抛出时整个 retrieve 拒绝。见 `search-public-review-probe.log`。
- 最小修复：仅把两个 port 调用放到 `Promise.resolve().then(...)` 内，统一进入原 allSettled 的单通道降级；保留原 fallbackReason、权威投影、预算、排名稳定性和 AbortSignal 检查。
- 既有 `KnowledgeRetrievalPolicy.test.ts` 分别覆盖 dense / sparse 同步 throw，断言健康通道的 live Recipe、lane flags 和具体诊断。`search-sync-lane-red.log` 为 2 RED；`search-sync-lane-green.log` 为 policy + truth projector 2 suites / 15 tests GREEN。

## S-003 / P2 — 旧知识集合 type 别名与实际 metadata 表示冲突

- 根因：`src/service/search/SearchEngine.ts:727` 原 scorer 分支只保留 `meta.type === 'recipe'`，而 `_buildDocMeta` 生成 `knowledge`。另外 `#normalizeMetadataFilters` 把 recipe / solution / knowledge 当成物理 type 值传入向量和 metadata 过滤。两者叠加导致同一合法集合在不同 mode 下丢失。
- 真实消费者：Main `lib/http/routes/search.ts:127` 明示 all / recipe / solution / rule，并在 `:200` 原样传给真实 Core engine；Main fallback 也将 recipe / solution 路由到同一 V3 知识集合。主线程独立确认后授权保持此兼容语义，不更改返回 wire type。
- 独立真库 probe：`search-type-alias-probe.mjs` / `.log`，raw adapter 与正式知识 repo 两分支，all 在 keyword / weighted / auto 均命中；knowledge 的 weighted / auto 为空；recipe / solution 三 mode 均为空。
- 最小修复：scorer 和两个旧语义分支复用现有 `#matchesTypeFilter`；metadata type 中三种全集别名不作为物理等值条件。数组按 OR：含任一全集别名已覆盖其余项，不能删掉别名后把 `[recipe, rule]` 错缩窄为 rule。保留 rule、未知 type 和其他字段过滤，未推导 candidate 的新语义。
- 真实两 adapter 用例跨 keyword / weighted / auto / semantic fallback，另通过真实 DB truth + 注入 vectorService / legacy vectorStore 两条 semantic 链；断言别名、OR、rule、未知 type、scope 与原结果 wire type。`search-type-alias-red.log` 有 4 RED。

## S-004 / P2 — 正式仓储投影丢筛选事实，与 raw adapter 不一致

- S-003 的真实兼容测试保留 `scope:'project'` 断言时，raw adapter 成功，宿主实际注入的 KnowledgeRepository 失败，见 `search-type-alias-green.log`（该日志是失败结果，不计 GREEN）。
- 根因：`src/repository/knowledge/KnowledgeRepositoryImpl.ts:1183`、`:1220`、`:1256`、`:1291` 四个 SearchKnowledgeRepo 生产方法遗漏 scope / dimensionId；keyword 投影还遗漏 tags。SearchEngine 收到的事实已丢失，后续 hard filter 只能排除真实命中。
- 经主线程授权，在这四个 producer 投影补回 scope / dimensionId，keyword 补 tags；保留原条件、排序、limit、去 deprecated 以及主线程的 Unix 秒 `gte` 水位。没有绕过或弱化 facet 断言。
- 新增真实两 adapter 测试按 scope + dimensionId + tags 同时筛选，初建和增量 refresh 后都验证返回值。有效 RED 是 `search-facet-projection-red-2.log`（正式 repo 失败、raw 对照通过）。初次 `search-facet-projection-red.log` 是测试草稿误嵌套导致 0 executed / 全 skipped，已纠正，**不作为 RED 证据**。
- S-003 / S-004 最终 `search-type-facets-green.log`：6 suites / 100 tests 通过，包含 SearchEngine 的已有真实同秒 insert / edit / deprecate 两 adapter 回归、SearchPipeline、公开搜索入口、RecipeContextAdapters、DatabaseRepository、公开数据库入口。

## 全文审查保留点与清理观察

- FieldWeightedScorer 的 id/tombstone/DF/压缩生命周期完整保留；topic-kind 联合证据与 canonical 多 role 交叉证据不是可删的重复权重。
- HybridRetriever 是仍由 VectorService 与两个宿主工厂消费的旧 RRF 合同；新 KnowledgeRetrievalPolicy另有 Recipe 真相过滤、去重、补窗和明确诊断，不能因为两者都计算 RRF 就合并删除旧公开类。
- KnowledgeTruthProjector 先读真实 Recipe、去掉 orphan / deprecated、重新分配 live unique rank；policy 以未见通道贡献上界判断 Top-K 成员和顺序是否稳定。不能用“候选数已够 topK”代替稳定性判断。
- 已独立复核主线程的 SearchEngine context-cache、最终漂移分数重排、两个仓储同秒水位修复：本轮新增修复未覆盖回退这些差异，相应 suites 已通过。
- SearchTypes 中 public DTO、slim 的 when/do/dont actionHint、sourceRefs/drifted 标注与 workspace 身份投影都有实际消费者。mode semantic/vector 推断 helper虽相似，公共符号语义不同，不做外部契约删除。
- tokenizer 的去重、大小写边界、CJK 单字/bigram/完整片段以及停用词服务 query coverage；与相似度和 recipeTokens 词法合同不同。未发现 `exact-duplicate-functions.json` 对这 8 文件的可直接删除候选；该索引结果不等于所有短 helper 均不相似。
- **S-CLEANUP-001，仅观察，未修改**：MultiSignalRanker `#realtimeWeights` / `#recentlyUsed` 全仓仅 set/add，rank 不读；订阅回调目前不影响排名。可独立精简私有死状态并保留接受的 signalBus 选项，不据此增加新的实时评分策略。
- **S-CLEANUP-002，错误建议已撤回，未修改代码**：`src/service/search/index.ts` 有真实公开 root 转发链：`src/index.ts:63` 的 `export *` → `src/service/index.ts:8` 的 `export *` → `src/service/search/index.ts`。原直接 import 扫描遗漏了 export 转发，不能据“没有专用子路径”推导非公开或零消费者。此 barrel 必须保留，不属于删除候选；稳定 `src/search.ts` facade 与 root 间接导出均为现有公共面。

## 最终验证与自审

- `search-final-typecheck-2.log`：`node node_modules/typescript/bin/tsc --noEmit` 通过。
- `search-final-biome-2.log`：本域 4 源码 + 2 既有测试共 6 文件 Biome 通过。`git diff --check` 通过。
- 所有命令由 `/tmp/alembic-core-review-20260917/run-check.py` 使用 Node 22 执行，精确命令、exit code、耗时在 `checks.jsonl`。未运行全量 gate。
- 自审第一轮检查功能语义：评分字典数值不变、同步/异步失败归类一致、全集别名 OR 不缩窄、rule/其他 facets 不丢、返回 wire 不改、same-second `gte` 保留。
- 自审第二轮检查最终差异与公共面：没有新增 exports、没有删除稳定 DTO/wire/公开类、没有改 provider/宿主注册；支持测试使用真实 SQLite /实际 ports，未使用私有 helper 的 tautological 测试替代公共入口。
- `search-owned-final-diff.patch` 是这 6 个共享文件的完整当前差异，包含主线程此前在 SearchEngine / KnowledgeRepository / SearchEngine.test 的改动，并非声称全部由本子域编写。独立子域新增范围为 S-001..004。
- 额外只读支持上下文包括 CoarseRanker / contextBoost 全文、两个外层 search 工厂/HTTP消费路径、SearchRepoAdapter 全文和 KnowledgeRepository 四个搜索投影；不将它们重复计入本次 8 源码全文统计。
