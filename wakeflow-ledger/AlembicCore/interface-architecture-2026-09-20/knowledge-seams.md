# 知识写入接口与装配边界研究

日期：2026-09-20。读取时 Core HEAD：`4a0b277`。本轮只做接口架构研究，没有产品或测试修改，没有运行测试/探针/构建。本文的验收项都是后续实施建议，不是本轮已通过的验证结果。

## 存在性与阅读范围

在 Core `src/`、Main/Plugin `lib/` 扫描未找到 `KnowledgeWriteService` 类或文件。当前真实写入协调已经拆为 `KnowledgeService`、内部 `commitKnowledgeWrite` / `persistKnowledgeUpdate` 以及独立的同步批次 `KnowledgeUnitOfWork`；不能先假定存在一个 WriteService 再提出合并。

全文读取：Core `commitKnowledgeWrite.ts`、`persistKnowledgeUpdate.ts`、`KnowledgeUnitOfWork.ts`、domain `KnowledgeRepository.ts`、repository `KnowledgeFileStore.ts`。对 KnowledgeService 读取构造、CRUD、生命周期、usage/quality、写入 helper 和图关系同步主要段；对具体仓储、ConfidenceRouter、FileWriter、SyncService、两宿主四个 DI module、ServiceContainer 和后续 sourceRef/向量消费按相关方法追踪，不声称这些大文件已在本轮全文复审。测试只阅读相关真实持久化矩阵和定位既有覆盖，没有执行。

## 实际装配链

```text
宿主 database / WorkspaceResolver
  ├─ createAlembicRepositories(database) → 同一连接的仓储 bundle
  ├─ dataRoot + WriteZone → KnowledgeFileWriter
  └─ audit / quality / hooks / eventBus 等宿主端口
       ↓
KnowledgeModule 的 KnowledgeService / ConfidenceRouter / KnowledgeGraphService
       ↓
RecipeProductionGateway 或直接知识命令
       ↓
KnowledgeEntry + commitKnowledgeWrite → Markdown → repository → SQLite
       ↓
审计/关系投影/知识事件 → 搜索索引、向量维护、创建后 sourceRef/freshness
```

### InfraModule 与每容器实例

- Core `src/repositories.ts:239` 的 `createAlembicRepositories` 是实际共享工厂：解析同一个 database/Drizzle handle，再创建 knowledge、edge、proposal、sourceRef、lifecycle 等仓储。它不管理宿主容器或全局项目生命周期。
- Main `lib/injection/modules/InfraModule.ts:35` 将 bundle 缓存在 `_coreRepositoryBundle`，`:129` 暴露 knowledgeRepository；Plugin 对应 `:211` 缓存在 `coreRepositories`，`:104` 暴露同类仓储。这是两套容器分别缓存同一 Core 工厂的产物，不是每次 `get` 都重复创建数据库仓储。
- Main `InfraModule.ts:181`、Plugin `InfraModule.ts:166` 都用 `resolveDataRoot(ct)` 和已存在的 WriteZone 创建 KnowledgeFileWriter。路径/zone 绑定属于宿主适配，序列化和文件策略属于 Core；这四行重复不值得新造一个控制整个容器的 Core facade。
- Main ServiceContainer `:117–137`、Plugin `:231–244` 先注册 Infra，再准备 Signal/App，后注册 Knowledge/Vector/Guard。singleton 在 get 时惰性实例化；注册先后不等同于立即构造。

### KnowledgeModule 的关键注入

- Main `lib/injection/modules/KnowledgeModule.ts:78–120`、Plugin `:117–162` 共用 Core ConfidenceRouter、KnowledgeGraphService、KnowledgeService。两者均注入 writer、qualityScorer、skillHooks、eventBus、edge/proposal repo，以及调用 Core `resolveGroundedSourcePaths` 的宿主 grounding 闭包。
- Core KnowledgeService `src/service/knowledge/KnowledgeService.ts:191` 的第三个 `gateway` 参数目前只存不读。Main 仍传真实 gateway（`:93`），Plugin 因宿主已退休该服务而传 null（`:133–135`）。必须保留旧位置参数，不能在通用 factory 中强行要求两个宿主都解析 gateway，也不能据此删除外层权限流程。
- 两宿主同一 writer 还传给 StagingManager、ContentPatcher、LifecycleStateMachine：Main `KnowledgeModule.ts:251/301/315`；Plugin `:323/389/403`。这些服务不反向依赖 KnowledgeService，因此当前装配不会形成写服务循环。
- RecipeProductionGateway 的 singleton：Main `KnowledgeModule.ts:356`、Plugin `:450`，接入现有 knowledgeService、similarity/consolidation/proposal 端口。Plugin 注释明确：需要 canonical 模块轴的 async submit 构造另有真实入口（`:472–476`）；不能为了减少 factory 名称而把同步 DI 与异步上下文采集强行合并。

## 真实接口的输入、输出与状态变化

| 接口 | 输入→输出 | 持久化、信号及边界 |
| --- | --- | --- |
| KnowledgeService.create，`:228` | KnowledgeEntryProps + userId → 已读回 KnowledgeEntry | 原始输入基础检查、标题查重、实体归一化、可阻断 submit hook、ConfidenceRouter。默认 pending，但路由可设 staging/deprecated，并非注释所说永远 pending。之后文件→DB，再关系/审计/事件。 |
| KnowledgeService.update，`:367` | 白名单 patch → 已读回实体 | 先拒绝 lifecycle 管理字段；retrievalProfile 校验只挡 wire 结构，不代替 readiness。保留系统 tags、knowledgeType→kind 派生；实体归一化后写文件，再更新 DB。成功后关系投影、审计和 knowledge:changed。 |
| KnowledgeService 生命周期，`:923` | id + method + userId → 已迁移实体 | active 转换先做 readiness；实体状态机允许后记录 actor/history，再移动文件→DB。成功发 lifecycle:transition。不是通用 update 可绕过的字段赋值。 |
| KnowledgeService.delete，`:523` | id + userId → `{success:true,id}` | 先移除文件，再持久化反向引用清理、删除主行；仓储内部同步事务处理相关 FK 行。成功后兼容性索引清理/审计，再发 knowledge:deleted。失败后的修复路径是重试删除，不是把已删文件伪造回来。 |
| updateQuality，`:845` | 已存条目 + 可选 actor → score/dimensions/grade | 读取真实 grounding，投影 scorer 输入，持久化 Quality/必要 authority，然后审计。和创建前路由评分不是同一次业务判定。 |
| incrementUsage，`:806` 起相关段 | usage 别名/反馈 → 条目 | 计数映射到现有 Stats 并经文件优先写入；feedback 只有审计，不凭空增加计数或文件写入。 |
| persistKnowledgeUpdate，`:13` | repo + fileStore + id + patch → void | fileStore 存在时读完整实体，合并为 prospective KnowledgeEntry，调用单条写协调；无 writer 的旧路径保留 DB-only，不强制增加完整实体读回。 |
| commitKnowledgeWrite，`:13` | 已准备实体、文件操作、异步 commit 回调 → 回调结果 | 只负责顺序、file/null/false 语义、写后 id 凭据及分歧归类，不拥有业务准入、审计或事件。 |
| KnowledgeUnitOfWork.commit，`:94` | 文件操作列表 + 同步 Drizzle 回调列表 → `{dbCommitted,fileOpsCompleted}` | 全部文件完成后才运行一个同步 DB transaction。文件批次不是原子事务：完成的 write/move 保留，已删文件尽力重建；没有 async repository 回调生产链。 |
| KnowledgeRepositoryImpl，`:129/168/207` | 实体或 patch/ID → entity/null/bool | SQLite 映射与本库约束；update 检查 changes=1，再读回；delete 在同步事务内维护相关表。不能由服务重复写 SQL 规则替代。 |

### 事件不是持久化事务的一部分

KnowledgeService 的 `knowledge:changed` 在 create `:331`、update `:501` 发出，delete `:565` 发 knowledge:deleted，生命周期 `:1015` 发 lifecycle:transition。commitKnowledgeWrite 不发送这些事件。审计是 await；关系投影有 best-effort 路径，created hook/自动关系发现还有非阻塞路径。将所有事件移进通用 commit helper 会改变发射时机和失败顺序，不能仅因重复 emit 语句而合并。

另一个真实链路是 LifecycleStateMachine：`src/service/sustain/LifecycleStateMachine.ts:202` 写文件/DB后，`:211` 记录 TransitionEvent，再 `:506` 发送 SignalBus lifecycle 信号。SignalBridge `src/infrastructure/signal/SignalBridge.ts:16` 将其转为 EventBus 的 signal:event；它不等同于 KnowledgeService 的 lifecycle:transition。Vector SyncCoordinator 监听 knowledge:changed/deleted/lifecycle:transition（`:212/225/250`），不能把这些不同通道按相似名称删成一个。

## 应保留的事务与信任边界

1. **原始输入、实体、仓储验证不同层。** KnowledgeService `_validateCreateInput:1078` 提供 API 输入错误；实体 `.isValid` 检查归一化后内容；repository.create `:130` 保护直接仓储入口和后续可变 hook/调用者边界。RecipeProductionGateway 的 Stage-3/strict 准入又负责更强的创作与授权事实。不能因为都提到 title/content 就删为一层。
2. **文件 ownership 与业务字段校验不可互代。** KnowledgeFileWriter `:265–304` 处理 id/title、目标所有权、sourceFile、序列化、durable write 和旧路径清理；`moveOnLifecycleChange:363` 已委托同一 persist 策略。FileStore 是能力契约，FileWriter 是实现，不是两个重复服务。
3. **文件+DB 不是跨资源 ACID。** commitKnowledgeWrite 文件失败为 FileWriteError；文件成功、DB 失败/无同 id 读回为 DivergenceError。已落盘文件保留，sync 或命令重试负责恢复。不能把 async repository 调用塞进同步 Drizzle transaction 获得所谓原子性。
4. **删除结果有意不同。** 单条 helper `commitKnowledgeWrite:48` 将 remove=false 视为无匹配文件、继续派生 DB 清理；UoW `:194` 仍将 false 当作文件操作拒绝。本批已有公开契约与测试不同，不能共用一个布尔结果分类函数而改变其中一边。
5. **写后读回与 SQL affected-row 不是重复验证。** repository.update `:189` 防止 RAISE(IGNORE) 产生同 id 的旧行；单条 helper `:72` 防止读回丢失/不符 id。二者证明的事实不同。
6. **actor 字符串不等于授权证明。** ServiceContext 携带 userId 用于审计/历史；不能从未使用的 gateway 构造字段推断外层权限检查都可删除。

## 确认可整理的接口接缝

### 首选：只读质量字段投影单源化

真实重复在 `ConfidenceRouter.ts:124–151` 和 `KnowledgeService.ts:1115–1149`：content/reasoning 读取与 title、trigger、description、language、category、do/dont/when/coreCode、正文、理由、来源、headers/tags 的同名扁平投影。

建议只提炼 Core 内部纯函数（例如 `projectKnowledgeQualityFields(entry)`），两个真实调用者复用。它不做验证、状态转移、存储或依赖装配，也不新增公开 facade。

必须保留调用者增量差异：

- ConfidenceRouter 的 usageGuide 只回退到 content.markdown；KnowledgeService 还回退到 doClause（`:1141`）。不能在公共投影内统一成较强回退。
- KnowledgeService 另加 views/clicks/rating、constraints、steps/verification、alternatives、groundedSourcePaths/groundedRanges 与 groundingAvailable（`:1150–1164`）。创建前路由不应被动得到这些上下文或改变公式。
- 不复用或缓存最终 quality score：创建前路由用它选择 pending/staging；持久化后的 updateQuality 使用当前 grounding/engagement，并写入 Quality/authority，时机与业务作用不同。

验收：先保存现有两个公开入口的完整 scorer 输入/输出及路由状态，再重构并逐项相等；特别覆盖 usageGuide/markdown 为空但 doClause 存在、无 grounding port、有 port 但零接地、低质量高置信度、正常 staging。保留 `test/unit/KnowledgeService.test.ts:733/749` 的路由边界和 `test/KnowledgeServicePersistence.test.ts:74` 的质量落盘矩阵。本轮没有运行或声称这些方案已通过。

### 次选：内部写入 port 去除具体仓储依赖

`persistKnowledgeUpdate.ts:4/14` 当前以 `Pick<KnowledgeRepositoryImpl,'findById'|'update'>` 依赖具体实现。可改为一个内部结构 port，明确 findById 和 update 的实体/null 返回；它有 sustain、Guard 和 KnowledgeService usage 的真实消费者，不是未使用的类型占位。

需要保留现有兼容入口，不直接改两个同名公共契约：

- domain `KnowledgeRepository.ts:20/69` 是运行时可导出的兼容 class，create/update 类型承诺非 null，方法默认抛 Not implemented。
- `src/repositories.ts:166` 的同名 type 实际别名是 KnowledgeRepositoryImpl；实际 create/update 最后调用 findById，可能返回 null（Impl `:137/192`）。
- 不能简单把两个名称合并或把运行时 class 删成 type-only；先在内部 helper 用准确窄 port，再评估公共类型迁移。KnowledgeService 的旧参数仍可结构性满足新内部 port。
- KnowledgeService `fileWriter` 仍依赖具体 KnowledgeFileWriter（`:125/178`），实际调用只需 persist/remove/move。后续可采用现有 KnowledgeFileStore 能力面，但 `_fileWriter` 是公开属性，不能在未检查外部类型消费者时声称完全无公共面影响。

验收：编译检查覆盖真实 Impl 与旧 DB-only adapter；file null、SQL ignore、missing readback、delete false 和 sync 恢复的现有矩阵必须保留。不要新增运行时验证层来弥补只改类型的工程。

### 不能直接合并的两种 update 准备方式

KnowledgeService `#persistUpdate:1036` 复用业务入口已读取的实体，为文件构造 prospective，但向 repository 传部分 updates；`persistKnowledgeUpdate:32–47` 会再读取实体，构造完整 prospective，并把完整实体传给 repository。repository.update `:170–179` 也区分完整实体与部分更新。

它们看起来都做 fromJSON，但读取时点、部分 patch 合并及路径回写不同。直接统一成“少一次读取/转换”可能改变并发写入时未修改字段的合并语义；本轮没有运行并发复现，不能把这种差异宣布为已确认 bug。若要收敛，应先固定真实 SQLite 交错更新下文件/DB 的期望，再决定准备后的实体是否同时成为两端共同提交快照，不引入未经授权的 validation 票据或全面版本协议。

## 宿主工厂：可简化与必须保留

| 项目 | 结论 |
| --- | --- |
| createAlembicRepositories 与两宿主 lazy bundle 缓存 | 共享业务构造已在 Core。保留每容器生命周期，不移成 Core 全局单例。 |
| writer 的 dataRoot/WriteZone factory | 保留薄适配。两个宿主调用同一个 Core 类，本身不是两套文件策略。 |
| KnowledgeService 的整块 `as ConstructorParameters[...]` | 可先改为具名、受类型检查的 options 变量或 satisfies，揭示真实不匹配；不为消除断言而发明万能 factory 或退回 any。必要的 Repo nullable/type 差异需先对齐。 |
| Main gateway / Plugin null | 保留位置参数与各宿主选择；不由通用 builder 擅自解析已退休服务。 |
| Main动态 sourceIdentityProvider / Plugin直接 projectRoot+gitReader | 保留实际 multi-folder 与单项目生命周期区别，不能复用构造时空数组作为固定 scope。 |
| 两边 lifecycle/staging/content writer 注入 | 必须保留；缺失会使文件 sync 覆盖 DB-only 变更。不能把注入行当冗余配置删除。 |
| KnowledgeSyncService 装配 | 不完全相同：Plugin InfraModule `:175–191` 注入 awaited vectorMaintenance；Main `:187–194` 没有该端口。此差异不能在共用 factory 时静默抹平或凭空补成相同副作用。 |

### 创建后 sourceRef 链需要先对齐行为，才有资格合并

Main `KnowledgeModule.ts:516–583` 手动解析 reasoning.sources，按当前多 folder identity 过滤，使用 512KB 文件护栏计算指纹；即使文件不可读仍可写 active、缺省 fingerprint。Plugin `:560–564` 调用宿主 freshness runtime，再进入 Core RecipeFreshnessService 的 source-ref reconciliation 和 vector 刷新/报告。

二者不只是重复 upsert。若后续决定统一，优先消费已有 Core `SourceRefReconciler.reconcileRecipeSourceRefs` 或 RecipeFreshnessService，先确定 missing/ambiguous/不可读状态、512KB 护栏、是否刷新 vectors、何时等待完成的共同政策。不得直接删除 Main helper 并调用更强的全量刷新，否则会改变状态和副作用。当前研究不做该行为选择。

## 应保留的类、方法与错误契约

- KnowledgeService 保留业务编排、生命周期专用入口和已有 submit/approve/reject/toDraft/fastTrack 等兼容别名（`:651–680`）。
- commitKnowledgeWrite 是现存单条异步写协调，不需要另建 KnowledgeWriteService；persistKnowledgeUpdate 仍承担按 id 加载/准备实体的不同职责。
- KnowledgeUnitOfWork 的生产 new 调用在本次三仓扫描中未找到，但其公开导出和 FailureSemantics 测试是真实兼容面；不能据此删除，也不能把 async 单条 helper 换成同步 UoW。
- KnowledgeFileStore/FileWriter 保留契约与实现分层。moveOnLifecycleChange 已复用 persist 的 durable path，不需要第二套搬移实现。
- 仓储负责 FK/SQL 事务；反向知识引用涉及多个 Markdown 真相，属于更高层顺序提交，不能假称一个 SQLite transaction 覆盖所有文件。
- 无 fileStore 的旧构造继续 DB-only 且诊断；该兼容分支不是正式宿主应省略 writer 的理由。

## 建议验收矩阵（未执行）

| 证明事实 | 现有验证落点及需要保留的独有行为 |
| --- | --- |
| 四类 KnowledgeService 命令的真实文件/DB顺序 | `test/KnowledgeServicePersistence.test.ts:74–122`：create/update/quality/deprecate，文件拒绝、SQL abort/ignore、读回丢失、无提前事件、sync恢复。 |
| 删除/FK/反向引用/后台关系并发 | 同文件 `:125/145/162/200/280/286`；不能被 mock delete 次数替代。 |
| UoW 同步 DB 与部分文件真相 | `test/FailureSemanticsCO3.test.ts:90` 起；DB失败保文件、null/false拒绝、旧文件覆盖后不能补偿删除。 |
| 门禁与生命周期边界 | `FailureSemanticsCO3.test.ts:249–286`、`KnowledgeProductizationLifecycle.test.ts:102/203/228/357/375/402`。 |
| 结构化字段与 usage 合同 | `KnowledgeProductizationLifecycle.test.ts:445/474` 及参数化字段/计数案例；保留值对象、反馈仅审计、未知操作拒绝。 |
| 双宿主实际 writer 装配 | Main/Plugin `test/unit/KnowledgeModuleFileFirst.test.ts:14`：真实注册→staging/promote/patch→文件 sync；不只手工给服务构造 options。 |
| 宿主差异不能被 factory 抹掉 | Main `KnowledgeModuleEvolutionWiring.test.ts:32/49`；Plugin `KnowledgeVectorMaintenanceWiring.test.ts:19` 的 awaited maintenance。 |
| 第一切片评分投影 | 在已有 KnowledgeService/ConfidenceRouter 测试中增加旧行为 golden 对照，保留两调用者的不同附加字段和完整 route/result；不创建大量相互比较新 helper 的自证测试。 |

当前结论是研究输入：优先共享纯质量字段投影，再做内部窄 port 与装配类型检查；真正的存储、事务、准入和事件边界保留。没有实现、删除或声称任何新方案已获验证通过。
