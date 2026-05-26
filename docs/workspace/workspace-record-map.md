# Workspace Record Map

状态：长期记录清单
维护窗口：AlembicWorkspace
更新日期：2026-05-25

本文是 AlembicWorkspace 的长期记录地图。当前开发区只保留当前状态、长期规则、长期契约、当前测试交流面和活跃 TODO；所有短期计划、历史测试交流、已完成 TODO、阶段验收和执行证据都从这里进入归档区。

## 使用方式

- 查当前工作面：先看 [index.md](index.md) 和 [current/workspace-current-status.md](current/workspace-current-status.md)。
- 查历史计划、验收和执行证据：先在本文找到 topic，再进入对应归档目录。
- 查已完成 TODO：看本文的 [TODO Records](#todo-records)。
- 查测试历史：看本文的 [Test Records](#test-records)。
- 查 `note_finding` 判定形成过程：看本文的 [note_finding Closure Standard](#note_finding-closure-standard)。

当前开发区文档不直接散链到具体归档文件；需要历史细节时，从本文查询。

## Current Long-Term Entries

| 类型 | 当前入口 | 说明 |
| --- | --- | --- |
| 当前短期工作区 | [current/](current/) | 当前状态、活跃 TODO、测试交流和后续执行计划。 |
| 当前状态 | [current/workspace-current-status.md](current/workspace-current-status.md) | 只保留当前窗口状态、发送名单和活跃观察项。 |
| 全局 TODO | [current/global-todo-board.md](current/global-todo-board.md) | 只保留活跃 / 观察 TODO；已完成项见 [TODO Records](#todo-records)。 |
| 测试交流 | [current/alembic-test-exchange.md](current/alembic-test-exchange.md) | 只保留当前测试单；历史测试见 [Test Records](#test-records)。 |
| 职责长期契约 | [alembic-repository-responsibility-function-boundary-contract.md](alembic-repository-responsibility-function-boundary-contract.md) | 长期职责边界。 |
| 职责功能划分方案 | [alembic-global-responsibility-function-division-scheme.md](alembic-global-responsibility-function-division-scheme.md) | 长期能力归属判断方案。 |
| Plugin first 契约 | [alembic-plugin-first-enhancement-contract.md](alembic-plugin-first-enhancement-contract.md) | 长期产品路线。 |
| 归档规则 | [workspace-doc-archive-policy.md](workspace-doc-archive-policy.md) | 当前开发区与归档区分层规则。 |

## Recent Mainlines

| 记录 | 状态 | 归档入口 | 说明 |
| --- | --- | --- | --- |
| LLM output truncation bug | 已完成 | [llm-output-truncation-bug](archive/2026-05/llm-output-truncation-bug/) | Jobs Timeline `llm.output` 短内容像被截断的完整性标识与展示问题：Agent output completeness metadata、Alembic bridge truncation metadata、Dashboard completeness hints 和 AlembicTest BiliDili test-mode 复测通过；process events recovery / job progress / provider length fixture 转后续 TODO。 |
| Cold-start project skill delivery | 已完成 | [cold-start-skill-delivery](archive/2026-05/cold-start-skill-delivery/) | 双链路 project skill receipt + Codex 项目级 runtime export：Core contract、Alembic route receipt、Plugin route symlink export、tool visibility 和 BiliDili test-mode runtime delivery 复测通过。 |
| Scan progress live output | 已完成 | [scan-progress-live-output](archive/2026-05/scan-progress-live-output/) | cold-start / rescan process observability 第一版与旧终端语义补齐 follow-up：Core / Alembic / Agent / Dashboard / AlembicTest 验收通过，live append 严格逐条转入观察 TODO。 |
| Unified resident service | 已完成 | [unified-resident-service](archive/2026-05/unified-resident-service/) | Plugin -> Alembic 统一 resident service contract：Core contract、Alembic health producer、Plugin unified client、behavior cleanup 和 BiliDili 真实项目集成验证。 |
| SFC：小问题修复 / 清理修复 | 已完成 | [small-fix-cleanup](archive/2026-05/small-fix-cleanup/) | 六仓库自检、真实小问题修复、lint / check closeout、Plugin real-project 资产删除和 Alembic Codex-safe unit 命令封口。 |
| CCIC：能力代码 / 接口清理 | 已完成 | [capability-code-interface-cleanup](archive/2026-05/capability-code-interface-cleanup/) | 能力代码梳理、接口清洁、冗余删除、Plugin 身份和 Alembic MCP 外部入口剪枝。 |
| RFR：文件夹层级 / 拆仓残留清理 | 已完成 | [repository-folder-boundary-restructure](archive/2026-05/repository-folder-boundary-restructure/) | 文件夹层级重构、Plugin 旧 Dashboard / AI / Recipe compatibility surface 清理。 |
| GFBD：全局职责功能划分 | 已完成 | [global-function-boundary-design](archive/2026-05/global-function-boundary-design/) | 六窗口证据采集、长期职责契约和功能划分方案的来源记录。 |
| Version 0.2.0 unification | 已完成 | [version-unification](archive/2026-05/version-unification/) | 版本号统一、runtime artifact 和本机 plugin cache 刷新记录。 |
| Plugin external AI remnants removal | 已完成 | [plugin-external-ai-remnants-removal](archive/2026-05/plugin-external-ai-remnants-removal/) | 删除 AlembicPlugin 旧内置第三方 AI 能力残留。 |
| Prime immediate receipt shout | 已完成 | [prime-immediate-receipt-shout](archive/2026-05/prime-immediate-receipt-shout/) | Codex prime 后立即知识呐喊和可见摘要优化。 |
| Resident vector search release | 已完成 | [resident-vector-search-release](archive/2026-05/resident-vector-search-release/) | Plugin baseline search + Alembic resident vector / hybrid search 增强。 |

## TODO Records

| 记录 | 归档入口 | 说明 |
| --- | --- | --- |
| 已完成全局 TODO | [global-todo](archive/2026-05/global-todo/) | 已完成 TODO 和旧同步记录；当前活跃项仍在 [global-todo-board.md](current/global-todo-board.md)。 |
| `GTODO-2026-05-21-003` 来源 | [prime-immediate-receipt-shout](archive/2026-05/prime-immediate-receipt-shout/) | prime / Recipe evidence projection 是否下沉为 Core contract 的观察来源。 |
| `GTODO-2026-05-21-004` 来源 | [plugin-service-request-boundary](archive/2026-05/plugin-service-request-boundary/) | Alembic resident service API / capability / contract version 观察来源。 |
| `GTODO-2026-05-21-005` 来源 | [test-exchange-history](archive/2026-05/test-exchange-history/) | Recipe evidenceRef 行号级证据观察来源。 |
| `GTODO-2026-05-23-019` 来源 | [capability-code-interface-cleanup](archive/2026-05/capability-code-interface-cleanup/) | Core `normalizeLifecycle` public export readiness 观察来源。 |
| `GTODO-2026-05-23-020` 已完成 | [small-fix-cleanup](archive/2026-05/small-fix-cleanup/) | Alembic 新增 Codex sandbox-safe unit test 命令并保留完整 `test:unit`，提交 `69474767c84adc15fccaa9d8a8513bd8ff7f2ee5`。 |
| `GTODO-2026-05-23-021` 已完成 | [small-fix-cleanup](archive/2026-05/small-fix-cleanup/) | AlembicPlugin 删除 real-project 非逻辑资产，提交 `484174e9d08a2a7a0786c2cc2553de0b2fee5e0c`。 |
| `GTODO-2026-05-23-022` 来源 | [small-fix-cleanup](archive/2026-05/small-fix-cleanup/) | Dashboard `src/api.ts` 剩余动态 contract `any` 类型化观察来源。 |
| `GTODO-2026-05-23-023` 来源 | [small-fix-cleanup](archive/2026-05/small-fix-cleanup/) | Dashboard Mermaid async chunk 性能观察来源。 |
| `GTODO-2026-05-23-024` 来源 | [small-fix-cleanup](archive/2026-05/small-fix-cleanup/) | AlembicAgent L4 compaction 低优等待用户再次提及的来源。 |
| `GTODO-2026-05-23-025` 已完成 | [plugin-devdocs-wiki-removal-2026-05-23.md](../AlembicPlugin/plugin-devdocs-wiki-removal-2026-05-23.md) | AlembicPlugin 删除 Plugin 侧 `alembic-devdocs` / 旧 `alembic_wiki` / Plugin HTTP wiki route 和 Plugin-owned wiki service，提交 `f4efd2561a58562b1686689900ce497a3ff8de83`；AlembicCodex runtime 提交 `628fbad571242ee1891ecb590d0f2133e019b1a6`，runtime sha256 `c5bdbe9b0ace45458da61bd4a270522033626d8cbabcba04aef428bb118ab4bc`。 |
| `GTODO-2026-05-23-026` 已完成 | [cold-start-skill-delivery](archive/2026-05/cold-start-skill-delivery/) | 冷启动生成 project skills 交付给 Codex 主线完成：`Test-2026-05-24-05` 证明 test mode、MCP tool visibility、Plugin route receipt、symlink-first runtime export、managed marker、runtime load、conflict block、无全局写入、BiliDili git clean 和 Alembic route receipt 均闭合。 |
| `GTODO-2026-05-23-027` 已完成 | [unified-resident-service](archive/2026-05/unified-resident-service/) | Plugin 与 Alembic 统一 resident service contract 主线完成：Core `b5e3bd5496d8831ae167ecfa79598dd6d792b60b`、Alembic `70917fa509aed03cbd322d1d46acb1eb50f8f0cc`、Plugin Phase 3 `4f58d5e1a1982c13ca307d767e5813ca8e9ea002`、Plugin Phase 4 `139a7edfde8149aba7c6a89c00066928b0cb9a40`、AlembicTest `Test-2026-05-23-01` 通过。 |
| `GTODO-2026-05-23-028` 已完成 | [scan-progress-live-output](archive/2026-05/scan-progress-live-output/) | cold-start / rescan process observability 第一版完成：`Test-2026-05-24-03` 确认新 Dashboard 未触发 React #31，同一打开页面追加到 38 events，`tool` / `llm.output` / `llm.reflection` rich text 可读。 |
| `GTODO-2026-05-24-029` 来源 | [scan-progress-live-output](archive/2026-05/scan-progress-live-output/) | live append 批量延迟 / 更细实时性观察来源；不阻塞 `GTODO-2026-05-23-028` / `GTODO-2026-05-24-032` 完成。 |
| `GTODO-2026-05-24-031` 已完成 | [cold-start-skill-delivery](archive/2026-05/cold-start-skill-delivery/) | Dashboard Timeline UI follow-up 完成：提交 `dc5b446`，固定高度 terminal-like Timeline、bottom scroll、local display cache 和 LLM 默认收起通过总控验收。 |
| `GTODO-2026-05-24-032` 已完成 | [scan-progress-live-output](archive/2026-05/scan-progress-live-output/) | 冷启动前端过程展示补齐旧终端格式化语义；P5 证明阶段转换 / 短 LLM 默认展示、长内容折叠、颜色可读、active card / summary 均闭合。 |
| `GTODO-2026-05-24-033` 来源 | [llm-output-truncation-bug](archive/2026-05/llm-output-truncation-bug/) | LOTB-P2 发现 daemon restart 后旧 job events API 返回 0 条；后续需要归口 process events recovery / persistence。 |
| `GTODO-2026-05-24-034` 来源 | [llm-output-truncation-bug](archive/2026-05/llm-output-truncation-bug/) | LOTB-P2 发现 running job status/progress 长时间停在 `filling/0%`；后续需要对齐 session progress、job summary 和 Dashboard active card。 |
| `GTODO-2026-05-24-035` 来源 | [llm-output-truncation-bug](archive/2026-05/llm-output-truncation-bug/) | LOTB-P2 未自然触发 provider `finishReason=length`；后续需要 provider length 可控 fixture 或专用 test job。 |
| `GTODO-2026-05-24-036` 已完成待归档 | [multi-root-project-scope-wave-5](archive/2026-05/multi-root-project-scope/multi-root-project-scope-wave-5-2026-05-25.md) | Multi-root ProjectScope 当前硬门禁完成：P7 证明 `Alembic` / `AlembicCore` / `AlembicAgent` / `AlembicPlugin` / `AlembicDashboard` 五个 source folder 同属 `project-scope-a8083fdb335c`，Plugin `health` / `prime` / `search(auto/semantic)` 均成功并带 telemetry，Dashboard 显示 `5 个源文件夹`，source folders 无 runtime 写入；后续归档时移入归档 topic。 |
| `GTODO-2026-05-25-002` 来源 | [llm-input-optimization-wave-3](archive/2026-05/llm-input-optimization/llm-input-optimization-wave-3-2026-05-25.md) | Test-06 发现 `AlembicAgent/dist` 未刷新；source test-mode 通过但 package/runtime/cold-start 验证前必须刷新并验证 dist。 |

## Test Records

| 记录 | 归档入口 | 说明 |
| --- | --- | --- |
| `Test-2026-05-25-07` | [LLM input Observation Ledger test mode report](../../AlembicTest/docs/llm-input-observation-ledger-test-mode-2026-05-25.md) | Alembic internal Agent LLM 输入 Observation Ledger 最小 test-mode 复测通过：retained `llm.input` 与 provider message 均包含 `## Observation Ledger`，五类 category 均出现，raw debug 字段不进入 provider-facing ledger，scratchpad priority 与 Wave 1/2 regression 均闭合；遗留 `AlembicAgent/dist` 未刷新继续保留为 `GTODO-2026-05-25-002`。 |
| `Test-2026-05-25-06` | [LLM input layering test mode report](../../AlembicTest/docs/llm-input-layering-test-mode-2026-05-25.md) | Alembic internal Agent LLM 输入 layering 最小 test-mode 复测通过：retained `llm.input` section metadata、provider runtime layer、Record / Produce profile 和 Wave 1 regression 均闭合；遗留 `AlembicAgent/dist` 未刷新转 `GTODO-2026-05-25-002`。 |
| `Test-2026-05-25-05` | [LLM input Agent correctness test mode report](../../AlembicTest/docs/llm-input-agent-correctness-test-mode-2026-05-25.md) | Alembic internal Agent LLM 输入 correctness 最小 test-mode 复测通过：retained `llm.input` / `llm.output`、无 `[object Promise]`、真实 `code.read({ filePaths })` batch partial failure、SCAN planning / `toolChoice=none` 一致性闭合。 |
| `Test-2026-05-25-04` | [multi-root ProjectScope P7 report](../../AlembicTest/docs/multi-root-project-scope-agent-folder-coverage-2026-05-25.md) | AlembicWorkspace 多文件夹 ProjectScope 五 source folder 补测通过：`AlembicAgent` 加入同一 ProjectScope，五文件夹 Plugin resident-backed tools、Dashboard folder count 和 source folder no-write 闭合。 |
| `Test-2026-05-24-08` | [LLM output completeness test mode report](../../AlembicTest/docs/llm-output-completeness-test-mode-2026-05-24.md) | BiliDili 真实项目 test-mode 复测 Jobs Timeline `llm.output` 输出完整性：短 visible output、tool-call-only、hidden reasoning omission、Alembic bridge truncation 和 Dashboard DOM 展示通过；provider length 自然触发、process events recovery、job progress 转后续 TODO。 |
| `Test-2026-05-24-05` | [project skill runtime delivery test mode report](../../AlembicTest/docs/project-skill-runtime-delivery-test-mode-2026-05-24.md) | BiliDili 真实项目 test-mode 复测 project skill runtime delivery：`ALEMBIC_TEST_MODE=1` 单维度 `architecture`，Alembic route 产出 `ProjectSkillDeliveryReceipt`，Plugin route 完成 `alembic_project_skill` create/export/load/conflict/no-global-write，BiliDili 最终 git clean。 |
| `Test-2026-05-24-03` | [live socket append rich content report](../../AlembicTest/docs/live-socket-append-rich-content-retest-2026-05-24.md) | BiliDili 真实项目最小复测 Dashboard live socket append rich content：新 Dashboard 未触发 React #31，同一打开页面无需刷新追加到 38 events，`tool=3`、`llm.output=3`、`llm.reflection=4` 且 rich text 可见；批量延迟转后续观察。 |
| `Test-2026-05-24-02` | [cold-start process events retest report](../../AlembicTest/docs/cold-start-process-events-retest-2026-05-24.md) | BiliDili 真实项目复测 Phase 1E：events API 真实产出 `llm.input=2`、`tool=1`、`llm.output=1`、`llm.reflection=1`；REST recovery、Jobs timeline 滚动和 Candidates card 通过；Dashboard live socket append rich content 触发 React #31，已转 `AlembicDashboard` 最小修复。 |
| `Test-2026-05-24-01` | [cold-start process timeline report](../../AlembicTest/docs/cold-start-process-timeline-test-2026-05-24.md) | BiliDili 真实项目验证 cold-start Dashboard process timeline：health、eventsUrl、jobs events API、Jobs timeline、socket append、REST recovery、Candidates cold-start card 和 job details 入口连通；结论 `producer-gap`，`llm.input` / `llm.output` / `llm.reflection` / `tool` 未真实产生。 |
| `Test-2026-05-23-01` | [unified resident service BiliDili report](../../AlembicTest/docs/unified-resident-service-bilidili-integration-2026-05-23.md) | BiliDili 真实项目验证 Plugin baseline、local Alembic resident enhancement、resident search/vector telemetry、Dashboard handoff、prime shout、job boundary 和旧桥接负向证据，结论通过。 |
| 历史测试交流正文 | [test-exchange-history](archive/2026-05/test-exchange-history/) | 2026-05-21 至 2026-05-22 的 BiliDili prime / shout / resident vector search 测试单和验收回填。 |
| AlembicTest 长期报告 | [AlembicTest docs](../../AlembicTest/docs/) | 真实项目测试报告、probe 脚本说明和证据由 AlembicTest 仓库维护。 |

## note_finding Closure Standard

| 记录 | 当前入口 | 归档入口 | 说明 |
| --- | --- | --- | --- |
| 长期判定口径 | [alembic-note-finding-closure-standard.md](alembic-note-finding-closure-standard.md) | [note-finding-closure-standard](archive/2026-05/note-finding-closure-standard/) | 当前长期口径与历史形成过程分离。 |

## Archive Topics
| 归档主题 | 目录 | 说明 |
| --- | --- | --- |
| `2026-05/visible-automation-dispatch` | [visible-automation-dispatch](archive/2026-05/visible-automation-dispatch/) | 已归档 13 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/llm-input-optimization` | [llm-input-optimization](archive/2026-05/llm-input-optimization/) | 已归档 8 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/multi-root-project-scope` | [multi-root-project-scope](archive/2026-05/multi-root-project-scope/) | 已归档 6 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/llm-output-truncation-bug` | [llm-output-truncation-bug](archive/2026-05/llm-output-truncation-bug/) | Jobs Timeline `llm.output` 短内容像被截断的完整性标识与展示问题。 |
| `2026-05/scan-progress-live-output` | [scan-progress-live-output](archive/2026-05/scan-progress-live-output/) | 已压缩 20 条历史索引行到 topic manifest；当前索引只保留目录入口。 |
| `2026-05/cold-start-skill-delivery` | [cold-start-skill-delivery](archive/2026-05/cold-start-skill-delivery/) | 已压缩 4 条历史索引行到 topic manifest；当前索引只保留目录入口。 |
| `2026-05/unified-resident-service` | [unified-resident-service](archive/2026-05/unified-resident-service/) | 已压缩 4 条历史索引行到 topic manifest；当前索引只保留目录入口。 |
| `2026-05/small-fix-cleanup` | [small-fix-cleanup](archive/2026-05/small-fix-cleanup/) | 小问题修复 / 清理修复主线：自检、SFC-R1 直接修复、SFC-R2 lint / check closeout、SFC-R3 用户确认项封口。 |
| `2026-05/agent-evidence-recording-phase-chain` | [agent-evidence-recording-phase-chain](archive/2026-05/agent-evidence-recording-phase-chain/) | Agent evidence recording / phase chain 历史测试线计划。 |
| `2026-05/prime-knowledge-shout` | [prime-knowledge-shout](archive/2026-05/prime-knowledge-shout/) | Prime 知识呐喊、Recipe 交互契约和 BiliDili bridge repair 历史计划。 |
| `2026-05/plugin-service-request-boundary` | [plugin-service-request-boundary](archive/2026-05/plugin-service-request-boundary/) | Plugin 请求 Alembic service 的边界收口计划。 |
| `2026-05/plugin-external-ai-remnants-removal` | [plugin-external-ai-remnants-removal](archive/2026-05/plugin-external-ai-remnants-removal/) | Plugin 旧外部 AI 能力残留删除计划。 |
| `2026-05/version-unification` | [version-unification](archive/2026-05/version-unification/) | 0.2.0 版本统一和缓存刷新记录。 |
| `2026-05/global-function-boundary-design` | [global-function-boundary-design](archive/2026-05/global-function-boundary-design/) | 全局职责功能划分历史证据和分派记录。 |
| `2026-05/repository-folder-boundary-restructure` | [repository-folder-boundary-restructure](archive/2026-05/repository-folder-boundary-restructure/) | 仓库文件夹层级、拆仓残留审计和清理记录。 |
| `2026-05/capability-code-interface-cleanup` | [capability-code-interface-cleanup](archive/2026-05/capability-code-interface-cleanup/) | 能力代码 / 接口清理主线记录。 |
| `2026-05/prime-immediate-receipt-shout` | [prime-immediate-receipt-shout](archive/2026-05/prime-immediate-receipt-shout/) | prime 后立即知识接收呐喊记录。 |
| `2026-05/resident-vector-search-release` | [resident-vector-search-release](archive/2026-05/resident-vector-search-release/) | resident vector search 发布与测试记录。 |
| `2026-05/test-exchange-history` | [test-exchange-history](archive/2026-05/test-exchange-history/) | 历史测试交流正文。 |
| `2026-05/note-finding-closure-standard` | [note-finding-closure-standard](archive/2026-05/note-finding-closure-standard/) | `note_finding` 判定标准历史形成记录。 |
| `2026-05/global-todo` | [global-todo](archive/2026-05/global-todo/) | 已完成全局 TODO 和旧同步记录。 |
| `2026-05/github-actions-failure-recovery` | [github-actions-failure-recovery](archive/2026-05/github-actions-failure-recovery/) | GitHub Actions failure recovery 历史计划。 |
| `2026-05/agent-efficiency-observability` | [agent-efficiency-observability](archive/2026-05/agent-efficiency-observability/) | 冷启动效率、job 状态和 observability 历史计划。 |
| `2026-05/dev-link-global-environment` | [dev-link-global-environment](archive/2026-05/dev-link-global-environment/) | dev link / global environment 历史计划。 |
| `2026-05/init-convergence-contract` | [init-convergence-contract](archive/2026-05/init-convergence-contract/) | init convergence contract 历史计划。 |
| `2026-05/plugin-first-enhancement` | [plugin-first-enhancement](archive/2026-05/plugin-first-enhancement/) | Plugin first enhancement 和 runtime boundary 历史计划。 |
| `2026-05/codex-only-host-agent-mode` | [codex-only-host-agent-mode](archive/2026-05/codex-only-host-agent-mode/) | Codex-only host agent mode 历史计划。 |
| `2026-05/module-boundary-foundation` | [module-boundary-foundation](archive/2026-05/module-boundary-foundation/) | module boundary foundation 历史计划。 |
| `2026-05/multi-project-control` | [multi-project-control](archive/2026-05/multi-project-control/) | multi-project control redesign 历史计划。 |
| `2026-05/facade-readiness` | [facade-readiness](archive/2026-05/facade-readiness/) | Core facade readiness 历史计划。 |
| `2026-05/release-portable-snapshot-closeout` | [release-portable-snapshot-closeout](archive/2026-05/release-portable-snapshot-closeout/) | release / portable snapshot closeout 与 publish staging。 |
| `2026-05/interface-boundary` | [interface-boundary](archive/2026-05/interface-boundary/) | 接口边界优化与消费层收敛历史计划。 |
| `2026-05/local-source-import-unification` | [local-source-import-unification](archive/2026-05/local-source-import-unification/) | 本地源码引入统一历史计划。 |
| `2026-05/redundant-systems-removal` | [redundant-systems-removal](archive/2026-05/redundant-systems-removal/) | 飞书截屏连带、推荐系统、ReverseGuard 等冗余清理。 |
| `2026-05/feishu-remote-removal` | [feishu-remote-removal](archive/2026-05/feishu-remote-removal/) | Feishu / Lark remote removal。 |
| `2026-05/agent-extraction` | [agent-extraction](archive/2026-05/agent-extraction/) | AlembicAgent 抽取和 Plugin agent-free 历史 wave。 |
