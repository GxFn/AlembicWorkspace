# Guard 审查与修复回填

审查范围：`intelligence-review-remaining.json` 的 Guard 12 个文件，基线 4,715 行；全部逐文件全文语义读取，记录见 `guard-review.json`。最初为只读审查，5 个真实入口 probe 复现后，root 明确授权下面 5 项最小修复和两宿主必要 wiring。没有新增公共 exports、删除 Guard 能力、修改外层路由 DTO 或开展新协议重构。产品和测试已冻结；本文件是建议 diff 的审查材料，最终验收与提交归 root，本代理未 commit。

## 已修复的真实问题

### GUARD-01 / P1 / ruleId 清理误删其它规则

- 入口：Main `lib/http/routes/violations.ts` 调用 `ViolationsStore.clear({ruleId,file})`；Core `src/service/guard/ViolationsStore.ts:280`。
- 原行为：仅有 ruleId 时走全表清空；同时给 file 时也整行删除同次 run 内其它 rule 的违规。
- 修复：同步 Drizzle transaction 中，file 条件与精确 ruleId 相交。mixed run 仅过滤匹配违规并重算 violationCount；无剩余违规时才删除该 run。其余 run 不改。保留 id、triggeredAt、tool、surface 和原历史 summary，不伪造一次新审计的叙述。
- 兼容裁定：设计草案曾建议返回 affected run count；root 复核旧接口为 `Promise<void>` / `void` 后撤回返回值变更。实现保留 undefined，affectedRuns 仅写诊断。Main 路由原 cleared 字段不在本次范围内扩修。
- 正式回归：`test/ViolationsStoreAttribution.test.ts:82` mixed/unrelated，`:110` rule+file AND/unknown/file-only/all，`:142` 第二个真实 SQLite update trigger 失败后全事务回滚。不是 mock 调用次数。

### GUARD-02 / P1 / 启停只有 DB，下一次 sync 恢复旧文件状态

- 入口：Main GatewayActionRegistry、guardRules HTTP 批量/单条启停；两宿主 GuardModule；Core `src/service/guard/GuardService.ts:102` 可选 deps、`:178` enable、`:209` disable。
- 原行为：已有 active Markdown 下 disable 只改 SQLite，`KnowledgeSyncService.syncAll` 再读文件后规则恢复 active。create 同样没有文件真相；引擎缓存也没有随着 mutation 失效。
- 修复：构造 deps 增加可选 fileStore（旧位置参数/exports 不变）。启停重用本轮内部 `persistKnowledgeUpdate`：完整实体归一化→文件成功→DB更新/同id读回；文件失败阻止DB，DB失败报告 DivergenceError 并保留已写真相。新建沿用同一文件优先语义，有稳定 diagnostic、entryIds、fileOpsCompleted、reconcileVia，不能声称整批成功；成功 create/enable/disable 刷新可选 GuardCheckEngine cache。
- 兼容：不提供 writer 的旧构造仍可 DB-only 并有明确诊断；旧结构化 repository 的 void update 仍可用。新 file-first 路径需要完整 KnowledgeEntry，不能用局部 DTO 覆盖未读的元数据。未引入异步 SQLite 假事务。
- 宿主 producer：Main `lib/injection/modules/GuardModule.ts:40`、Plugin 对应文件`:43` 注入 InfraModule 已注册的 knowledgeFileWriter；writer 只依赖 dataRoot/WriteZone，无 Guard 反向依赖，因此无新增 DI 环。Plugin 保持 gateway=null 的既有退休接口兼容，不恢复 gateway。
- 正式回归：`test/GuardServicePersistence.test.ts` 覆盖实际 SQLite/writer/sync、预热缓存后的 create/disable/enable、已有 Markdown disable、file null 不写 DB、真实 INSERT/UPDATE trigger DBfail 后 DivergenceError 与 sync 修复。
- 两宿主：各自 `test/unit/GuardModuleFileFirst.test.ts:13` 使用真实 InfraModule + GuardModule + ServiceContainer 注册，真实 repository/writer/engine/audit 解析，断言源文件确实存在，再执行 create/disable/enable→sync→checkCode。没有手工给 GuardService 塞 options 代替装配。

### GUARD-03 / P2 / DB-only 违规行号按字面反斜杠计算

- Core `GuardService._checkCodeDbOnly` 原 `split('\\n')` 分隔文本反斜杠，而非真实换行，第三行命中报告第一行。
- 改为实际 LF 分割，CRLF 保持行数正确；真实公开 checkCode+SQLite、无 engine 的 legacy 构造覆盖 `first\nsecond\r\nBAD` 第三行。没有改变 violation 返回 shape。

### GUARD-04 / P2 / 同秒去重取错最近 run

- Core `ViolationsStore.ts:77` appendRun 只按秒级 createdAt 排序；同秒 A→B→B 把 A 误当最近 run，额外插入 B。
- 增加 rowid 次序作为相同秒的稳定 tie break；200条保留、历史/分页按同一插入顺序，指纹规则/预算/DTO不变。
- 正式真实 SQLite Date 固定回归 `ViolationsStoreAttribution.test.ts:125`，断言返回第二 run 的同一 id、只保留两行及原顺序。

### GUARD-05 / P2 / AST-only 通过自己的校验却不能持久化

- Core `GuardService.createRule` 原接受 `type=ast, astQuery.queryType`，但构造 content.pattern=''，无note/rationale时真实 repo 以 title+content invalid 拒绝。
- 真实规则描述+实际 AST query JSON 作为 Markdown 正文；constraints 使用现有值对象 wire 字段 ast_query/fix_suggestion（原 camelCase 在归一化时丢失），不造 regex/代码占位。
- 归档后经 sync 实体仍保留真实 query，GuardCheckEngine 可读取该 AST 规则。没有 AST 引擎的 DB-only 降级遇到无 pattern 规则，明确诊断并跳过，避免 RegExp(undefined) 变成全字符串空匹配。
- 正式回归 `GuardServicePersistence.test.ts:110`：正文描述/query、完整 constraints、engine.getRules、无引擎 AST 不产生假 regex 命中。

## 验证记录与方法修正

所有命令均通过 `/tmp/alembic-core-review-20260917/run-check.py`，Node 22.23.2。原始 stdout、command、exitCode 在同目录 log 和 checks.jsonl。

- `guard-review-red.log`：最初5个真实入口 probe 失败；`guard-ast-valid-shape-red.log`：补入完整合法 mustCallThrough params 后仍因内容为空失败，排除无效fixture。
- `guard-fixes-red.log`：正式 Core 2 suites，9 failed / 3 passed。
- `guard-fixes-green.log`：首次修复后 AST wire query 仍被值对象丢失（1 fail），进一步沿真实 Constraints 实现改 producer；没有放松断言。
- `guard-fixes-green-2.log`：12 tests pass。
- `guard-main-wiring-red.log` / `guard-plugin-wiring-red.log` 首版测试意外通过：纯 DB 状态+sync 没有证明已写文件，旧无 sourceFile 条目也不会在空目录 sync 后自动 orphan。该轮不能作为有效 RED。
- 增加实际非空 sourceFile+文件存在断言，`guard-main-wiring-red-2.log` / `guard-plugin-wiring-red-2.log` 均因 sourceFile=null 正确 RED。只之后才加 factory writer 接线。
- `guard-main-final-green.log` / `guard-plugin-final-green.log`：真实注册测试各1 passed，含最终格式后重验。
- `guard-core-boundaries-green.log` 名称虽带 green，实际 exit1：6 suites中7个B新增IR-12 member-call cases失败；root确认属于B正在RED→GREEN的并发交叉运行。本日志不是绿色证据，也不是本代理回归范围内完成结论。
- `guard-core-final-green.log`：隔离本批及稳定边界，5 suites / 29 tests passed。命令为 `node node_modules/vitest/vitest.mjs run test/GuardServicePersistence.test.ts test/ViolationsStoreAttribution.test.ts test/GuardImmuneSystem.test.ts test/unit/GuardScopeFiltering.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts`。
- `guard-core-build.log`：TypeScript emit成功（ignored dist）；`guard-core-final-noemit.log`、`guard-main-noemit.log`、`guard-plugin-noemit.log` 全部 exit0。未改变清理接口返回值，两宿主长期类型验证通过。
- `guard-final-format.log` 检查Core 4文件通过；外部路径在Core忽略规则下未被该命令检查，另用各仓cwd独立 `guard-main-final-format.log` / `guard-plugin-final-format.log`，避免把跳过误记为覆盖。
- Core `git diff --check` exit0。最终全仓check、两宿主整合验证、commit归root；本代理冻结后不再build或修改产品。

## 保留面、清理与观察边界

12文件都存在真实公开或内部调用；没有新的安全产品删除候选。Guard immune、真实SQLite、AST grammar、作用域/过滤和不确定性测试必须保留。此前27测试的删除/迁移证据独立见 `intelligence-tests-findings.md`，不会因本次Guard审查重复删测。

未证实的静态观察（正则RegExp lastIndex、跨文件绝对路径归一化、batch uncertainty汇总、RuleLearner未触发分支、搜索分页过滤策略等）不列为已确认bug，不扩改。Plugin handler对feedback与appendRun的顺序和Main不同，属于需要真实宿主复现的消费疑点，当前未实现；不能以静态差别冒充已验证缺陷。

本次5项不存在已知未修的确认缺陷。旧无writer路径仍明确DB-only；采用该兼容路径的第三方须主动提供fileStore才能获得文件真相持久化。Core 仍不承诺文件与SQLite的跨资源原子性，已写真相遇DB失败通过typed divergence要求sync修复。
