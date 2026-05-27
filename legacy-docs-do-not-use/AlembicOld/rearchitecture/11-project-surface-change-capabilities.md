# 11. 项目表层能力与变化采集主线

> 目标：把 Git、文件监控、IDE、插件、测试模式、Markdown 等项目现场能力迁入新主干，但只迁“契约、事实、解析、状态机”，不迁宿主安装、弹窗、HTTP、auto approve、VSIX、远程命令等重编排。

## 1. 本轮核心判断

这些能力都很重要，但它们不是新的上层主线。它们应该服务两条主线：

1. 编译期：稳定知道项目发生了什么变化，哪些文件是源码、文档、配置，哪些变化可以触发内容挖掘和 Recipe 关系重算。
2. 运行期：稳定知道当前 Agent/IDE/插件表面能接收什么上下文，哪些工具/Skill 可用，哪些生成文件应该排除出内容挖掘。

因此新主干新增一个轻量 `surface` 层，放 IDE、插件、Skill、MCP、工具能力 manifest。真实部署仍留在 legacy adapter。

## 2. 已迁入能力

| 新主线文件 | 承接能力 | 剪枝边界 |
| --- | --- | --- |
| `foundation/GitPort.ts` | `MainlineGitPort`、typed `GitChangeSet`、name-status/untracked parser、git change -> file event | 不迁 shell 串命令、不迁 Guard/daemon 的 git 流程。真实 git 只走 `execFile` adapter。 |
| `foundation/FileWatch.ts` | `FileChangeEvent`、合并/去重、`.asd/.git/node_modules` 忽略、IDE collector 心跳 TTL | 不迁 VSCode watcher、HTTP POST、弹窗、fallback polling 生命周期。 |
| `foundation/Markdown.ts` | fenced code block、heading、frontmatter、managed section 注入 | 不迁 KnowledgeFileWriter 的持久化和业务 schema。 |
| `foundation/TestMode.ts` | env 驱动 test mode、bootstrap/rescan ids、terminal/sandbox 配置 | 不迁旧 Logger、DimensionDef、全局静态变量。 |
| `foundation/ProjectMarkers.ts` | `.asd`、`Alembic`、`Alembic.boxspec.json` 的纯标记判断 | 不迁 ProjectRegistry、submodule 检测和写配置。 |
| `foundation/PathIdentity.ts` | 主线统一项目相对 POSIX path、绝对路径转项目相对路径 | 不让 data/compile/runtime 各自保留不同路径身份规则。 |
| `foundation/GeneratedProjectFiles.ts` | 排除 AGENTS/CLAUDE/Copilot/Cursor rules 等生成物 | 避免 Alembic 自己生成的指导文件被反向挖成 Recipe。 |
| `foundation/TextAnalysis.ts` / `Hashing.ts` | token 估算、API token、相似度、内容哈希 | 不迁 Recipe 权重模型、BM25、向量。 |
| `compile/DiffParser.ts` / `data/FileFingerprintSnapshotStore.ts` | unified diff hunk、diff token、唯一文件指纹快照 diff 接口 | 不迁 child_process git 和旧 EvolutionGateway；不再保留第二套 snapshot diff 形态。 |
| `runtime/ActiveWorkContextBuilder.ts` | 当前任务、活动文件、diff、错误位置统一成 `ActiveWorkContext` | 不扫描项目、不写索引、不触发 AI。 |
| `surface/IdeSurface.ts` | IDE artifact manifest、MCP server entry 投影 | 不部署 `.cursor/.vscode/.github`，只描述目标形状。 |
| `surface/PluginSurface.ts` | MCP inline tool declarations、Skill manifest validation | 不执行 Skill hooks、不安装插件、不刷新 Cursor rules。 |
| `surface/ToolCapabilitySurface.ts` | tool capability DTO、schema projection、surface 可用性判断 | 不迁 MCP server/HTTP stdio 协议壳。 |

## 3. 新的能力目录

`MainlineKernel` 继续作为新主干能力表。新增能力包括：

```text
git
file-watcher
markdown
text-analysis
project-markers
test-mode
path-identity
diff-parser
file-fingerprint-snapshots
active-work-context-builder
ide-surface
plugin-surface
```

这意味着多个任务窗口可以按照同一套边界并行：

1. 数据挖掘窗口只消费 `git/file-watcher/diff-parser/file-fingerprint-snapshots` 的事实。
2. Recipe 与编程交互窗口只消费 `surface/tool capability/skill/mcp` 的 manifest。
3. IDE/插件窗口只写 adapter，不把部署和安装逻辑写回核心。

## 4. 继续保留在 legacy 的重功能

| 旧能力 | 保留原因 |
| --- | --- |
| `FileDeployer`、`SetupService`、VSIX 安装 | 宿主安装和部署编排，容易拖重主线。 |
| `CursorDeliveryPipeline`、6-channel delivery | 适合高级显式同步，不适合默认运行链路。 |
| `autoApproveInjector`、remote command、Lark bridge | 宿主和远程控制行为，风险边界不属于核心。 |
| VSCode extension 的 watcher/popup/statusbar | UX adapter，不是主干事实模型。 |
| MCP stdio/HTTP server 壳 | 协议适配层，核心只认 capability/schema/result DTO。 |
| Skill create/update/delete/hooks | 有副作用，先只保留只读 catalog/load/validate/recommend 的方向。 |
| Vector incremental update | 现状仍可能传 changedFiles 但全量跑，暂不作为主干契约。 |

## 5. 下一步分工建议

1. 数据层窗口：用唯一 `FileFingerprintSnapshotStore` 接口承载文件快照 diff。
2. 编译期窗口：用 `GitChangeSet + DiffParser` 生成 `EvidencePackage`，让内容挖掘从真实 diff 开始。
3. 运行期窗口：通过 `KnowledgeInjectionRunner` 把 `ContextBundle` 投影进 `AgentInjectionPlanner`，`ToolCapabilitySurface + Skill manifest` 后续只作为注入片段。
4. IDE/插件窗口：写 legacy adapter，把 Cursor/VSCode/Codex/Claude/Copilot 的配置投影成 `IdeSurface`，但不改变主干。
5. 测试窗口：围绕纯函数和状态机补边界测试，避免先启动 daemon、HTTP、Dashboard。

主线原则保持不变：底层能力越薄，上层闭环越快；宿主能力越明确，旧项目就越容易被逐层替换。
