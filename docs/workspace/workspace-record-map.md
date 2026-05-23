# Workspace Record Map

状态：长期记录清单
维护窗口：AlembicWorkspace
更新日期：2026-05-23

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

## Test Records

| 记录 | 归档入口 | 说明 |
| --- | --- | --- |
| 历史测试交流正文 | [test-exchange-history](archive/2026-05/test-exchange-history/) | 2026-05-21 至 2026-05-22 的 BiliDili prime / shout / resident vector search 测试单和验收回填。 |
| AlembicTest 长期报告 | [AlembicTest docs](../../AlembicTest/docs/) | 真实项目测试报告、probe 脚本说明和证据由 AlembicTest 仓库维护。 |

## note_finding Closure Standard

| 记录 | 当前入口 | 归档入口 | 说明 |
| --- | --- | --- | --- |
| 长期判定口径 | [alembic-note-finding-closure-standard.md](alembic-note-finding-closure-standard.md) | [note-finding-closure-standard](archive/2026-05/note-finding-closure-standard/) | 当前长期口径与历史形成过程分离。 |

## Archive Topics

| 归档主题 | 目录 | 说明 |
| --- | --- | --- |
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
