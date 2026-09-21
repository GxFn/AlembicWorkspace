# 知识持久化、生命周期与宿主接线独立复核

审查人：`boundaries_consumers`。时间：2026-09-18。对象是当前未提交工作树相对 HEAD 的最终差异，以及新建的内部 helper / 两个宿主真实接线测试。只读审查产品代码；本次只写 ledger 记录与独立 probe，没有修改产品或测试，没有 commit，没有操作 Wakeflow 状态。

最终结论：本轮独立复核确认的两个 P2 兼容回归（IK-001 / IK-002）均已由主线程修复，并以原始真实入口 probe 独立复核通过；当前审查范围没有待处理的 P0 / P1 / P2 阻断。全门禁与最终提交仍由主线程负责，此结论不把下述既有边界扩写为全服务原子保证。

## 已确认问题

### IK-001 / P2：所有权扫描拒绝旧解析器已支持的 ID key 空白 — 已修复并复核

- 位置：`AlembicCore/src/service/knowledge/KnowledgeFileWriter.ts:785`，`readKnowledgeFileOwnerId`。
- 旧 `parseKnowledgeMarkdown` 对冒号前 key 调用 `trim()`，可以读取 `id : legacy-id` 和 ` id: legacy-id`。本轮新增的所有权校验最初只匹配 `/^id:/`，使这些存量 Markdown 的正常更新、移除被拒绝。
- 独立真实入口：`KnowledgeFileWriter.persist` 写入文件，仅修改 frontmatter key 的空白；同一公开解析器仍读出相同 ID，再 persist 同一实体返回 null。规范 `id:` 对照成功。原复现见 `independent-knowledge-owner-probe.mjs` / `.log`。
- 主线程最小修复：唯一完整 ID 匹配改为 `/^[ \t]*id[ \t]*:[ \t]*(.*)$/gm`，未放宽重复 ID、未知 owner、前缀 ID 或不同 owner 的拒绝规则。
- 主线程在既有 `KnowledgeFileWriter.test.ts` 加两项更新 + remove 回归，已读取 `owner-key-spacing-red.log` 与 `owner-key-spacing-green.log`；GREEN 为 3 suites / 100 tests。
- 独立重跑同一 probe：`independent-knowledge-owner-verify.log`，规范 key、尾随空白 key、前导空白 key 三者 parser owner 均匹配且 persist 均成功。对最终 regex / 删除路径做了代码复核，未发现修复扩大文件所有权。

### IK-002 / P2：只改正文会清空旧桥表来源引用 — 已修复并复核

- 位置：修复前 `AlembicCore/src/service/sustain/ContentPatcher.ts:407` 的 `entry.reasoning?.sources ?? bridgePaths`，以及 `:423` 的无条件 reasoning / 桥表重建。
- `KnowledgeEntry` / `Reasoning.from` 已把存量行缺失 reasoning 归一化为 `sources: []`，所以 `??` 的兼容分支对真实仓储实体不起作用。
- 独立真实入口：临时 SQLite + migrations + 真实 KnowledgeRepository / RecipeSourceRefRepository / KnowledgeEntry；创建只有桥表 `src/example.ts:1`、reasoning sources 默认空的旧实体，仅提交 `content.markdown` replace。
- 无 writer 与真实 writer 两分支都返回成功、`fieldsPatched` 只有 `content.markdown`，但桥表 refs 从一个变为零。见 `independent-knowledge-legacy-refs-probe.mjs` / `.log`。这违反 ContentPatcher 自身“只修改 Patch 指定字段”的兼容边界。
- 主线程已完成最小修复：`:152` 传递 `fieldsPatched.includes('sourceRefs')`，`:426` 非 sourceRefs patch 保持 reasoning；仅当 canonical sources 缺失/空且旧桥表非空时，保留桥表全行并诊断。正常非空 canonical 来源继续保留旧 P-B 重建/指纹更新行为。显式 sourceRefs patch 将最终数组同时写入 reasoning 与桥表，显式 `[]` 继续清空。
- 已核对 Core 完整 ContentPatcher 与 unit suite、Productization 显式 old→new refs + sync/reconcile 用例、Main/Plugin patcher 引用及宿主旧测试；此方向不改变既有显式来源 patch 的落锚契约。不采用“空数组就无条件从桥表回填 reasoning”的修法，以免复活有意清空的权威来源。
- 已读 `patch-legacy-refs-red.log`（真实两分支各失败）和 `patch-legacy-refs-green.log`（4 suites / 75 tests）。新增回归在 `KnowledgeProductizationLifecycle.test.ts:321` 断言旧桥表全行（status / verifiedAt / contentFp）不变，reasoning 不复活，真实 writer 分支经 sync 仍保留，随后显式 `sourceRefs: []` 同时清空两边。
- 独立重跑原 probe未改输入：`independent-knowledge-legacy-refs-verify.log`，无 writer / 真实 writer 的 content-only patch 后 refs 都仍为 `src/example.ts:1`。复核了最终分支及原显式 old→new refs 行为，无剩余阻断。正常非空 canonical 分支仍执行原重建/落锚循环；未宣称所有正文 patch 都不触碰桥表。

## 逐模块差异结论

| 模块 | 独立复核的具体不变量与结论 |
| --- | --- |
| `src/service/knowledge/persistKnowledgeUpdate.ts`（新文件，全读） | 用现行实体 `toJSON` + updates 重建完整值对象；强制沿用 id / createdAt；同步持久化文件后才写派生 DB。真实 writer 的 null 和抛错均转为 FileWriteError，DB 抛错或同 id 读回缺失转为 DivergenceError，文件保留并给出稳定诊断与 sync 修复路径。无 writer 分支保持旧 DB-only 并打印诊断，没有引入虚假文件成功。 |
| `src/repository/knowledge/KnowledgeUnitOfWork.ts`（全读） | 对 persist/move 的 null、remove 的 false 在 DB 事务前失败；后续文件失败保留前面已完成的写入/移动，避免把旧知识一并删除；删除补偿为尽力恢复，失败有日志。DB 失败抛 DivergenceError；未把同步 DB callback 改为异步事务或声称文件批次具备原子回滚。 |
| `src/service/knowledge/KnowledgeFileWriter.ts`（差异及序列化、解析、persist/remove/move/cleanup完整路径） | hash 排除使用统一整行规则；原文件名和目录策略保留。覆盖目的地与清旧文件均先确认完整 ID 所有权，durable write 仍同目录临时文件→fsync→rename→目录 fsync。确认并关闭 IK-001；不能把所有权不明的拒绝改为强制覆盖。 |
| `src/service/knowledge/KnowledgeService.ts`（差异及 update、recordUsage、lifecycle、文件助手上下文） | JSON 内容更新恢复 Content/Reasoning/Constraints/Relations 值对象，防止 serialize 调用不存在的 toJSON；usageGuide 进入已公开白名单实际赋值分支。操作别名映射到已有 Stats counters，未知操作有类型化失败，feedback 保留只审计语义；计数写入先文件再 DB并可经 sync 保留。 |
| `src/domain/knowledge/values/Stats.ts`（全读） | 现役生命周期时钟、proposal ID、stagingReview、primeAdoptions 可往返；旧记录缺省字段不新增空键；review 对象在构造及序列化时复制。保留原有计数与 wire 字段，不将未知 Stats 键泛化公开。 |
| `src/service/sustain/LifecycleStateMachine.ts`（全读） | 状态合法性和 active 准入仍在写前；exit/entry metadata 与 lifecycle 通过同一次 file-first 更新持久化，成功后才记录 transition event 和发 signal。保留第五个 evaluator 参数，第六个可选 writer 不改变旧构造。updatedAt 秒/历史毫秒仅在年龄观察时归一，不重写历史 wire。 |
| `src/service/sustain/StagingManager.ts`（全读） | enter、review、rollback、发布元数据均经 helper；review fail 到期回 pending，pass/缺失沿原兼容策略；LSM 拒绝晋级不报 promoted。先状态迁移再发布元数据的两阶段结构保留，第二阶段异常会传播。 |
| `src/service/sustain/ContentPatcher.ts`（全读） | StructuredPatch 白名单、section 保留、append 去重、非结构化跳过、before/after snapshot 未被放宽。显式 sources 同时更新 Markdown reasoning 与派生 refs并落锚。IK-002 最小兼容分支已独立验证，不据旧桥表复活空 reasoning。 |
| Main / Plugin `lib/injection/modules/KnowledgeModule.ts`（本轮差异与相关工厂完整上下文） | staging、patcher、LSM 均拿 `ct.get('knowledgeFileWriter')`，与 KnowledgeService 共用同一注册实例。依赖方向是 sustain→repositories + writer；writer 不反向依赖 sustain / KnowledgeService，没有新循环。 |
| Main / Plugin `lib/injection/modules/InfraModule.ts`、ServiceContainer 相关初始化（只读接线核对） | writer 由 resolveDataRoot 和既有可选 WriteZone 构造；InfraModule 先于 KnowledgeModule 注册，lazy singleton 在消费时解析。此次接线未引入宿主实现到 Core，未绕过公共包入口。 |
| 两仓 `test/unit/KnowledgeModuleFileFirst.test.ts`（新增，全读） | 真实 ServiceContainer + 实际 KnowledgeModule 工厂 + public Core imports + 临时真实 SQLite / writer；从 staging→sync→promote→sync，再正文 patch→sync验证不被回滚。使用 guard/boundary-constraint 正式准入路径，未假造 readiness 成功。测试手动注入实际 writer/repositories，因此验证工厂消费接线，不能据此声称测试过完整 app bootstrap /所有 InfraModule 资源。 |

## 失败、恢复和旧构造的验证证据

- 独立执行的两个公开入口 probe：owner 空白和 legacy refs（见上述日志）。owner 修复后再执行同一 probe，未更改复现输入来制造 GREEN。
- 已逐项阅读 `test/KnowledgeProductizationLifecycle.test.ts` 本轮持久化新增用例：真实文件 rename 失败保持 DB 和事件不变；文件成功后 DB异常抛 DivergenceError，sync 修复；真实 SQL DELETE 插入 update/readback 之间造成 null，拒绝成功后 sync 重建。并阅读新增值对象、usageGuide、计数别名、feedback 和 invalid usage 行为。
- 已读取 `knowledge-mutation-readback-green.log`（2 suites / 31 tests）、`knowledge-uow-partial-truth-green.log`（1 suite / 22 tests）、`knowledge-service-mutations-green-2.log`（4 suites / 122 tests）。这些是本轮实现方验证日志，不冒称由独立审查者重新执行。
- 已读取 Main `knowledge-main-wiring-green-2.log`（2 suites / 3 tests）和 Plugin `knowledge-plugin-wiring-green.log`（3 suites / 4 tests）。两套新增真实注册测试内容均已读取。
- 无 writer 兼容保留原构造和 DB-only 分支；独立 legacy refs probe实际运行了无 writer constructor，正常执行正文更新并打印 DB-only诊断。`test/unit/ContentPatcher.test.ts` 的无 writer shape mock只证明旧调用契约；不能充当实际文件落盘证据。`LifecycleStateMachineTimeouts` 真仓储旧构造测试保留。

## 既有边界，不包装成本轮新增保证

- `LifecycleStateMachine.#recordEvent` 的 eventRepo.record 失败仍 catch + warn 后返回 event；这不是与文件/知识行同一事务的不可丢审计保证，现有行为未被本轮改变。文件/知识行更新失败会在此之前抛出。
- `KnowledgeService.update` / 人工 lifecycle 保留旧编排，未统一接入本轮 sustain helper 的同 id 读回检查；`_removeFile` 保留原 non-blocking remove 语义。不能从新 helper 的严格失败契约推导整个 KnowledgeService 已获得同样保证。此项为已读既有实现边界，没有作为本轮新回归另行修改。
- 文件与 DB 不具备跨介质原子性；本轮采用文件真相保留 + 显式失败 + sync 修复。Staging 晋级与发布元数据仍是两步，第二步失败可留下 active 但发布元数据未完成的显式失败状态，不报告整步成功。
- 本次未运行全量测试/构建、未修改产品或新增产品测试，最终全门禁及提交由主线程执行。独立发现均已修复关闭；审查涉及的产品/测试差异及 ledger 文档 `git diff --check` 通过。
