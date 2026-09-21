# Production / Plan / Workflow 审查结果

本域已完成人工逐文件语义阅读：分配清单 124 项、基线 43,842 行；额外阅读 20 项，合计 144 项（115 源码、29 测试，当前约 56,813 行），全部为 `manual-full`。每项职责、消费者、状态/恢复路径、保留或精简理由见 `production-review.json` 的 `semanticReviewNotes`；初始导入/导出清单和 hash 仅是定位证据，未用机器模板代替全文阅读。

这是根线程的 review 输入，不是 Wakeflow 验收。所有产品修改均限根线程明确授权；没有 commit、没有改外层产品源码、没有修改 Wakeflow 状态、没有运行本仓全量测试。根线程正在共享工作区内独立修复其他模块，最终整体 diff、门禁与提交由根线程负责。

## 已确认问题与当前处置

下表“GREEN”仅指对应目标回归通过，不表示全仓/跨仓最终验收。根线程负责的三项已补读当前实现 diff 与回归用例，验证结论归根线程。

| ID | 问题与结果 | 真实回归 / 证据 |
| --- | --- | --- |
| PROD-001 | session reload 替换已交付活动对象，导致 lease 冲突后进度写入脱离持久化 map。根线程保留同 ID 对象并刷新磁盘新进度。 | GenerateSessionManager，原探针 `production-probes-output.json` |
| PROD-002 | snapshot/report 未持久化却清 checkpoint。根线程改为两者成功后只清本 session；其他 session/失败恢复点保留。 | PublicHostAgentWorkflowEntrypoints 的 4 种持久化结果 |
| PROD-003 | 未声明 dimension 可以提前完成并释放 lease。根线程校验 membership，历史非法记录不计入进度。 | GenerateSessionManager |
| PROD-004 | path-only save/diff 指纹来源不一致，显式空内容被磁盘替换。统一 `content ?? disk`。 | 真实 SQLite + 文件，2 RED → 7 GREEN，`production-file-diff-*` |
| PROD-005 | 提前舍入 best similarity 使次优覆盖最高 raw score。仅返回 DTO 时舍入。 | .654/.652 双顺序 RED → GREEN，`production-dedup-*` |
| PROD-006 | 正小数预算取整成 0。`<1` 按既有 invalid 策略回退默认，合法小数 floor/上限不变。 | public intent 数字/字符串各 RED；intent + workflow 10 GREEN，`production-rescan-subunit-test-*` |
| PROD-007 | guardPattern 测试可能运行零断言。改为两个结果存在且精确断言独立 .2 贡献。 | 现 GenerateDedup 行为套件 |
| PROD-008 | 源码 fallback 丢 code；frontmatter/多篇文档错误切分。加入保留 YAML、围栏、水平线的分段，路径已知源码保留全文。 | 新聚焦 RecipeParser 套件；TS JSDoc/Python 三引号围栏另 2 RED，最终 Parser 17/17、公开入口联合 19/19，含 CRLF 标记检测与原始字节保留 |
| PROD-009 | 同一规范文件短/长别名算多个来源；歧义短别名任意接地。归一到实际 valid path，歧义保守未接地。 | depth/QualityScorer 23 GREEN，`production-depth-path-*` |
| PROD-010 | Relations 值对象被当普通 bucket 数组枚举，deprecated reference 建议消失。使用规范 flat target 视图。 | 真实 KnowledgeEntry 经 public evolution 入口，3 GREEN |
| PROD-011 | SQLite FULL checkpoint busy 仍签旧主 DB hash。检查 busy/log/checkpointed，未完成抛稳定错误不签 receipt。 | 双真实连接/旧 reader/WAL，RED → 25 GREEN，`production-checkpoint-test-*` |
| PROD-012 | 同 ledger snapshot 跨文件 witness 重绑并重算 self hash 可通过。执行端重放现有 factory 与已登记 authority 的完整关系。 | 同 snapshot 双文件 RED；合法 worker/range/revision/unavailable 路径 3 suites/29 GREEN |
| PROD-013 | 模型输出 `supportsVerdict: "false"` / 数字按 truthiness 签 pass。共同 validator 强制 boolean。 | 实际 V5 gateway 4 种非法输出 RED；合法 false reject 与 true 保留，两 suites/20 GREEN |
| PROD-014 | 一个 recipe 多 source refs 在同 bucket 重复计数。每维、模块、cell 内独立按 recipe ID 去重。 | 真实 SQLite 一对多映射，保留 8 refs、每 bucket generated/stale 各 1；两 suites/13 GREEN |
| PROD-015 | 实际遗漏但 ref 附加未触发第二次 prune 时 truncated=false。标志直接依 omitted。 | 真实 2,000-byte 投影与完整磁盘 artifact，RED → 7 GREEN |
| PROD-016 | ProjectContext panorama 规范数组被 legacy summarizer 读空。兼容规范数组与 levels/Map/cycles 后按原预算投影。 | public builder 2 RED → 14 GREEN，含 legacy/snapshot 兼容 |
| PROD-017 | repo 语言总量再次加其部分采样文件。repo count 优先，仅缺统计语言由 files 补。 | public builder 1 RED → 15 GREEN |
| PROD-018 | custom-only 维度出现在任务但执行 tiers 为空；过滤空层使 hint 对应错位。先按实际 tier 号入桶再过滤空层。 | custom-only/mixed 两 RED；briefing/packet 联合 22 GREEN |

PROD-014 的 stable public projection 和 `createStrictProductionAuthorityReceiptV1` 当前未找到三外层直接运行调用，不将它们描述为已发生的外层线上故障，也未据此新增接线。Briefing 的两个 ProjectContext 入口实际由 Plugin cold-start.ts:323 和 knowledge-rescan.ts:1498 消费；私有 revision/checkpoint primitives 由 Main 严格运行链消费。

## 接口与冗余清理

已完成且有替代证据的清理详见 `production-cleanup-map.md`：

- GenerateDedup / RecipeSimilarity 完全重复的字符 ngram 算法收敛到现有 shared 内部 helper；上层权重、预处理和四个原公开导出不变。公共门面不新增符号。
- semantic gateway V3/V4 的私有 Map 只用 has/set，无 value 消费，改存 execution hash Set；V2 仍需回读执行记录，保留 Map。wire DTO、签名内容、旧 verifier 均保留。扫描见 `production-semantic-execution-retention-scan.log`，改前后 replay suites 20/20。
- SnapshotViews 的非公开零消费者 `toResponseData` 及专属说明删除；真实 `toSessionCache` 与其他类型保留。扫描源码/三外层和 61 exact facade / 7 wildcard 可达性均保存。三个实际消费者 suite 34/34、noEmit/public boundary 通过。
- PlanSelectionProjection 最后仅 typeof 四符号的测试删除；同文件前六项从同一 plans 门面已实际执行四函数并断言行为，PublicApiInventory 另锁公开面。删除后联合 10/10。

没有删除任何完整 strict suite、稳定公共 DTO、兼容 shim、旧签名 wire 版本。V1/V2 live authority 与 V3/V4/V5 durable signature、单 receipt/共享 harvest/跨 harvest 测试检验不同边界；相近 fixture 不是删除理由。

## 验证证据与可复现限制

全部命令、exit code、日志由 `run-check.py` 写入 `checks.jsonl`，使用 Node 22.23.2。最新本域 `production-final-typecheck`、`production-final-intent-lint`、`production-briefing-lint`、`production-final-diff-check` 通过；较早 ngram/shared 变更还通过 layer contract / public API boundary，当前 exports 68 项未因本域修改增加。各问题按真实入口 RED 后最小修复，不以只有私有 helper 的测试替代。

以下历史失败不当作缺陷 RED：`production-checkpoint-busy-red.log` 是初次 PathGuard fixture setup 失败，正确证据为 `*-red-confirmed`；`production-plan-coverage-grain-test-red.log` 初次缺 content，正确行为 RED 为 `*-red-confirmed`。Witness 第一轮 GREEN 命令暴露旧 unavailable-snapshot 失败协议回归，已修正并以 `production-witness-test-green-compatible` 的 29/29 为最终证据。

Probe 日志中的 JSON `status: RED` 表示观察到错误行为；脚本 exit 0 仅表示探针顺利执行。复杂探针复用现有 fixture 但实际调用 Core capture/AST/crypto/gateway；没有访问真实 AI provider。

## 保留的边界与后续核验

- `validRanges` 实际承载 `resolved.evidence.rangeText` 源码正文，不是坐标。保留兼容输入并纠正报告语义，没有编造行号校验协议。
- coverage advisor、CompletenessCritic、quality feedback、evidence starters 仍为提示/反馈；本域修复没有把它们变成新的生产门禁。
- Parser 自审追加的 CRLF 显式 frontmatter 兼容已按授权修复并 RED→GREEN；检测统一换行，原始 source bytes 不改。
- EvolutionPrescreen 的 dead→auto-deprecated 文字、MiningSessionStore 缓存 key、briefing 的字符长度预算等仅记录静态语义限制，没有真实端到端故障证据，未列作已修复 bug。
- 初期 rg 因 ignore 规则漏列 coverage 目录，但文件真实存在且 tracked，不是缺失导入。README / package 脚本差异由根线程另行处理。
- 下游接入保持 `file:../AlembicCore` 包入口；根线程统一完成 Core 构建/边界检查及必要 Plugin/Main consumer 验证后提交。本代理不提交的明确原因是所有 diff 作为根线程独立 review 输入。
