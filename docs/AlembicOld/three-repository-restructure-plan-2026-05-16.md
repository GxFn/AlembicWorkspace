# Alembic 三仓库重组规划

日期：2026-05-16

## 背景

当前有两条 Alembic 代码线：

- `GxFn/Alembic-legacy.git`：旧版本，全功能形态。远端 `main` 为 `229039c...`，存在 `v0.0.x`、`v0.1.0`、`v3.3.x`、`v3.4.x` 等历史标签。浅克隆扫描显示它包含完整 `alembic` CLI、独立 MCP、Codex MCP、Dashboard、VS Code 扩展、Lark Remote、浏览器/截图/IDE 投递等历史能力。
- `GxFn/Alembic.git`：当前插件化整理线。远端 `main` 为 `b436dbc...`，当前包名仍是 `alembic-ai@0.1.2`，但 `bin` 只保留 `alembic-codex-mcp`。README 已明确当前定位为面向 IDE 插件的本地项目记忆内核，并已删除独立 CLI、旧 IDE 投递、Lark Remote、截图、浏览器打开、文件 watcher 等旁支能力。

本规划不以此前 mainline 相关文档为依据，也不恢复已经确认外移的 Lark Remote、旧 VS Code 扩展、实时文件 watcher、ReverseGuard 等能力。

## 实际代码状态与目标设计分离

需要先把“现在仓库里实际是什么”和“最终设计上每个仓库应该是什么”分开看。当前 `GxFn/Alembic.git` 的代码状态是迁移过程中的中间态，不等于最终 `Alembic` 仓库的产品定位。

### 当前实际代码状态

| 仓库 | 当前实际状态 | 在本规划中的身份 |
| --- | --- | --- |
| `GxFn/Alembic.git` | 当前工作仓库，已经做了大量插件化清理，保留 Codex MCP 入口和核心运行时混合代码；独立 CLI、旧 IDE 投递、Lark Remote、截图、浏览器、watcher 等已被移除。 | 迁移中间态，也是未来 `Alembic` 全能力仓库的同名目标仓库。当前代码不能直接代表最终边界。 |
| `GxFn/Alembic-legacy.git` | 旧版本全功能仓库，包含 `alembic` CLI、本地 daemon、Dashboard、VS Code 扩展、Lark Remote、浏览器/截图/IDE 投递等历史能力。 | 只作为成熟实现的回迁输入和对照，不继续作为开发主线。 |
| `GxFn/AlembicCore` | 用户已新建的核心能力仓库。 | 目标仓库，承载唯一核心能力。 |
| `GxFn/AlembicPlugin` | 用户已新建的插件统一仓库。 | 目标仓库，承载 Codex 以及后续其他 IDE/Agent 宿主插件。 |

### 目标设计状态

| 目标仓库 | 目标定位 | 与当前代码的关系 |
| --- | --- | --- |
| `GxFn/AlembicCore` | Alembic 共享核心能力仓库，提供 Headless Runtime 和可嵌入 API。 | 从当前 `GxFn/Alembic.git` 抽取真实核心实现，并按需回迁 `Alembic-legacy` 中仍成熟有效的核心逻辑。 |
| `GxFn/Alembic` | Alembic 独立全能力仓库，本地安装版和完整产品形态。 | 保留这个仓库名，但最终要从当前“插件化中间态”恢复为全能力本地版，吸收 legacy 的 CLI/Dashboard/daemon/外部 AI 冷启动能力，并依赖 `AlembicCore`。 |
| `GxFn/AlembicPlugin` | Alembic 插件统一仓库，先承载 Codex 插件，后续承载各 IDE/Agent 宿主插件适配。 | 从当前 `plugins/alembic-codex`、`channels/codex`、`lib/codex`、Codex 验证脚本迁入；后续按插件目录扩展，不在核心仓库内继续混放插件交付。 |

后续文档中提到“当前 Alembic 仓库”时，指眼前实际代码状态；提到“目标 `GxFn/Alembic`”时，指最终独立全能力仓库。

### 已调整的迁移执行顺序

更贴合当前状态的执行顺序是：

1. 先把当前 `GxFn/Alembic.git` 的实际代码整体搬到 `GxFn/AlembicPlugin`。
2. 再把 `GxFn/Alembic-legacy.git` 的 `v0.1.0` 版本代码搬回 `GxFn/Alembic`，恢复独立全能力仓库。
3. 最后在两个目标仓库都稳定后，新建并抽取 `GxFn/AlembicCore`。

这个顺序比“先抽 Core”更符合现状：当前仓库已经偏插件化，先迁到 `AlembicPlugin` 的反向改造最少；`Alembic` 需要恢复的是 legacy 全能力产品面；`AlembicCore` 则应该在插件形态和本地全能力形态都清晰后，再抽真实共享能力，避免提前抽成空壳接口。

## 总体判断

Alembic 不应该继续把“核心知识系统”“本地完整运行时”“Codex 插件交付”塞在同一个仓库里。当前问题不是简单做两个版本，而是需要把稳定核心和宿主适配拆开：

1. 核心能力必须只有一份，避免本地版和插件版分叉。
2. 本地安装版可以拥有完整自主能力，包括 CLI、daemon、Dashboard、外部 AI Provider、后台知识挖掘。
3. Codex 插件版必须服从 Codex 宿主边界，默认让 Codex 主 Agent 驱动知识挖掘，不能在插件里隐藏启动外部 AI 后台 Agent。

因此目标是维护三个清晰分工的仓库：

| 新仓库 | 定位 | 主要来源 |
| --- | --- | --- |
| `GxFn/AlembicCore` | Alembic 共享核心和 Headless 运行内核 | 当前 `lib/domain`、`lib/core`、`lib/service`、`lib/infrastructure`、`lib/agent` 中真正通用的部分 |
| `GxFn/Alembic` | 独立全能力仓库，本地安装版和完整产品形态 | `Alembic-legacy` 的 CLI、本地 daemon、Dashboard、AI 配置、冷启动命令等，加上当前仓库已沉淀的安全初始化和核心整理 |
| `GxFn/AlembicPlugin` | 插件统一仓库，先承载 Codex，后续承载各 IDE/Agent 宿主插件 | 当前 `plugins/alembic-codex`、`channels/codex`、`lib/codex`、Codex 验证脚本，以及后续 VS Code/JetBrains/Xcode 等插件适配 |

## 仓库一：`GxFn/AlembicCore`

### 职责

`AlembicCore` 是唯一的 Alembic 知识系统来源。它提供可嵌入的 Headless API，不直接面向用户安装，也不承担任何 IDE 或 Codex 的交互体验。

它应该包含：

- Recipe 领域模型、生命周期、校验、SourceRef、readiness。
- Project discovery、语言识别、tree-sitter AST、项目结构图。
- 知识挖掘流水线：scan、bootstrap、rescan、candidate、consolidation。
- Guard 正向检查、知识检索、结构检索、向量索引、SQLite/Drizzle 数据层。
- Ghost workspace、路径解析、数据目录、项目注册表。
- daemon job 的领域契约、JobStore、可恢复任务状态。
- AI Provider 抽象、模型注册、参数保护、provider transport 的共享实现。
- 插件和本地运行时都需要的 preflight 基础能力：项目目录可信度、初始化状态、AI 配置状态、知识状态。

### 不负责

`AlembicCore` 不应该包含：

- `alembic` 用户 CLI。
- Codex MCP server、Codex plugin manifest、Codex Skill。
- VS Code/Cursor/JetBrains/Xcode 等宿主插件代码。
- Dashboard 产品壳、浏览器打开、截图采集、macOS GUI 工具。
- Lark Remote。
- 旧 IDE 配置投递，例如 `.cursor`、`.vscode`、Trae/Qoder 镜像。

### 对外接口

核心仓库应以 TypeScript 包形式发布，建议包名：

- npm 包：`@alembic/core`
- Node 版本：Node.js 22+
- 模块：ESM，NodeNext

推荐导出分层 API：

```ts
import {
  createAlembicRuntime,
  resolveAlembicWorkspace,
  runBootstrap,
  runRescan,
  searchKnowledge,
  checkGuard,
  submitKnowledgeCandidate,
} from "@alembic/core";
```

核心 API 需要接受明确的 `projectRoot`。当项目目录缺失或不可信时，必须抛出结构化错误，由上层宿主决定如何请求用户补充。

### 迁移输入

从当前 `GxFn/Alembic.git` 迁入：

- `lib/domain/**`
- `lib/core/**`
- `lib/service/**`
- `lib/repository/**`
- `lib/infrastructure/database/**`
- `lib/infrastructure/vector/**`
- `lib/daemon/JobStore.ts` 等任务状态基础设施
- `lib/shared/WorkspaceResolver.ts`、`resolveProjectRoot.ts`、`ProjectRegistry.ts` 等通用路径能力

从 `Alembic-legacy.git` 只回迁已被当前线清理但仍属于核心的成熟逻辑，例如：

- 更完整的 `AiScanService` 中真正属于知识挖掘的部分。
- 旧冷启动 CLI 背后调用的 scan/bootstrap/rescan 实现细节。
- 仍有效的 Dashboard 数据 API 背后的读写模型，而不是 Dashboard 产品入口。

## 仓库二：`GxFn/Alembic`

### 职责

目标 `GxFn/Alembic` 保留为独立全能力仓库，面向明确执行 `npm install -g` 或类似安装动作的用户。它是“完整 Alembic 自主运行形态”，允许用户显式配置外部 AI Provider 并启动后台知识挖掘。

这里要特别注意：当前实际 `GxFn/Alembic.git` 已经被清理成偏 Codex 插件的中间态，但目标设计不是把 `Alembic` 永久做成插件仓库，而是让它回到完整本地产品形态。

它应该包含：

- 用户 CLI：`alembic setup`、`alembic ghost`、`alembic ai configure/status`、`alembic coldstart`、`alembic rescan`、`alembic guard`、`alembic search`、`alembic sync`、`alembic daemon`、`alembic ui`。
- 本地 daemon 进程入口和状态管理。
- Dashboard 本地产品面，用于候选审核、Recipe 查看、任务状态、AI 配置。
- 外部 AI Provider 的显式配置和审计提示。
- 完整冷启动和增量扫描命令。
- 本地开发验证脚本、CLI smoke、daemon smoke、真实项目 dry-run。
- Ghost 模式和标准模式初始化。

### 不负责

目标 `GxFn/Alembic` 不应该负责 Codex 插件安装体验，也不应该内置 Codex Skill 或 Codex marketplace 结构。它可以提供插件需要的 npm 依赖或核心版本，但 Codex 的 MCP manifest、Skill、preflight 文案应该属于 `AlembicPlugin`。

它也不应该恢复：

- Lark Remote。
- 已删除的旧 VS Code 扩展。
- 文件 watcher 实时演化系统。
- 浏览器打开和截图采集作为核心能力。

### 对外形态

建议包名继续使用：

- npm 包：`alembic-ai`
- 用户命令：`alembic`

建议最小第一版命令面：

```bash
alembic setup --ghost --dir <project>
alembic ghost --dir <project>
alembic ai status --dir <project>
alembic ai configure --dir <project>
alembic coldstart --dir <project>
alembic rescan --dir <project>
alembic guard --dir <project> <path>
alembic search --dir <project> <query>
alembic daemon start --dir <project>
alembic ui --dir <project>
```

所有命令必须支持显式 `--dir <project>`。默认 `.` 只在当前目录存在项目标记时可用；如果不能确认项目目录，应直接失败并提示用户传入 `--dir`。

### 迁移输入

从 `Alembic-legacy.git` 迁入：

- `bin/cli.ts`
- `bin/api-server.ts`
- `bin/mcp-server.ts` 中本地通用 MCP 能力
- `lib/cli/AiScanService.ts`
- `lib/cli/CliLogger.ts`
- `lib/cli/UpgradeService.ts` 中仍需要的本地升级逻辑
- `dashboard/**`
- `templates/**` 中仍属于本地安装版的模板

从当前 `GxFn/Alembic.git` 迁入：

- 已清理后的 `SetupService`、`KnowledgeSyncService`。
- 当前更安全的 Codex 初始化经验中可复用的 projectRoot/preflight 逻辑，但不能把 Codex 宿主策略搬进本地 CLI。

## 仓库三：`GxFn/AlembicPlugin`

### 职责

`AlembicPlugin` 是插件统一仓库。它先承载 Codex 插件版，后续也承载其他 IDE/Agent 宿主的插件适配。它只负责插件安装、宿主交互、MCP tools、Skills、前置检查和插件验证，不拥有 Alembic 核心知识系统。

插件仓库内部可以按宿主分目录：

```text
AlembicPlugin
├── plugins/codex
├── plugins/vscode
├── plugins/jetbrains
├── plugins/xcode
└── shared
```

当前阶段只迁入和维护 Codex 插件，其他插件目录等有真实需求时再建立。

它应该包含：

- `.codex-plugin/plugin.json`
- `.mcp.json`
- Codex MCP wrapper
- Codex Skills：`alembic`、`alembic-recipes`、`alembic-create`、`alembic-guard`、`alembic-structure`
- Codex preflight：项目目录、初始化状态、AI 配置状态、知识状态、工具可见性。
- Codex status/diagnostics/init/job/bootstrap/rescan 的 MCP tool 外壳。
- Codex 会话模拟验证脚本和场景。
- 本地插件开发刷新、安装、smoke 验证脚本。

### 默认策略

Codex 插件版默认应走 Codex-native 路线：

1. 插件检查项目目录和初始化状态。
2. 如果项目未初始化，先执行 Ghost 初始化。
3. 如果缺少关键信息，向 Codex Agent 返回结构化错误，请 Agent 或用户补齐。
4. 知识挖掘默认由 Codex 主 Agent 读取代码、提交候选知识。
5. 插件只存储、校验、检索、注入和审计知识。

外部 AI 后台扫描只能走两条路线：

- 用户安装并显式运行目标 `GxFn/Alembic` 本地全能力版本，例如 `alembic coldstart --dir <project>`。
- 或 Codex 插件中明确配置本地模型，例如 Ollama，且 preflight 可证明不会把代码发送给第三方。

### 不负责

`AlembicPlugin` 不应该负责：

- 完整本地 CLI。
- 独立 Dashboard 产品面。
- 外部 AI Provider 的隐藏后台扫描。
- 旧 MCP server 的通用 IDE 适配。
- VS Code/Cursor 的 UI、CodeLens、诊断、文件监听。

### 对外形态

建议仓库作为插件统一发行仓库：

- GitHub 仓库：`GxFn/AlembicPlugin`
- 插件名：`alembic-codex`
- MCP server 名：`alembic`
- Runtime 来源：依赖 `@alembic/core`，或打包 `@alembic/core` 到插件 runtime tarball。

Codex 插件不应该继续把完整 Alembic 源码镜像进 `runtime/`。更稳的方案是：

1. `@alembic/core` 作为明确版本依赖。
2. `AlembicPlugin` 的 Codex release 构建一个只包含 Codex wrapper、Skills、manifest、runtime lockfile 的插件包。
3. 本地开发时通过脚本刷新插件缓存，确保每次代码更新立即生效。

## 三仓库依赖关系

推荐依赖方向：

```text
AlembicCore
  ↑
  ├─ Alembic
  └─ AlembicPlugin
```

禁止反向依赖：

- `AlembicCore` 不依赖 `Alembic`。
- `AlembicCore` 不依赖 `AlembicPlugin`。
- `Alembic` 不依赖 `AlembicPlugin`。
- `AlembicPlugin` 不依赖 `Alembic` 的 CLI/UI 产品壳。

如果 Codex 插件需要 daemon 能力，daemon 的任务执行协议和核心 job runner 应放在 `AlembicCore`，插件只负责启动或调用受限 runtime。

## 能力归属表

| 能力 | `AlembicCore` | `Alembic` | `AlembicPlugin` |
| --- | --- | --- | --- |
| Recipe 数据模型 | 是 | 通过 core 使用 | 通过 core 使用 |
| Ghost workspace | 是 | CLI 调用 | MCP 调用 |
| 项目目录解析 | 基础解析和错误 | CLI 参数和当前目录策略 | Codex env/tool 参数策略 |
| Bootstrap/Rescan 核心流水线 | 是 | 本地命令触发 | Codex 工具触发或 Agent 驱动 |
| 外部 AI Provider 实现 | 抽象和共享 transport | 显式启用 | 默认禁用，除非本地模型或明确安全策略 |
| Codex MCP tools | 否 | 否 | 是 |
| 用户 CLI `alembic` | 否 | 是 | 否 |
| Dashboard 产品面 | 否 | 是 | 默认否 |
| 通用 MCP server | 否 | 可选本地入口 | 否 |
| 旧 VS Code 扩展 | 否 | 否 | 否 |
| Lark Remote | 否 | 否 | 否 |
| 文件 watcher | 否 | 否 | 否 |
| git diff checkpoint | 是，作为核心能力 | CLI 调用 | MCP 调用 |

## 推荐迁移顺序

本节是当前推荐的执行路线，优先级高于前文的抽象目标描述。

### 阶段 1：把当前 `Alembic` 搬到 `AlembicPlugin`

目标：先承认当前实际代码已经偏 Codex 插件化，把这部分沉淀完整迁入插件统一仓库。

- 以当前 `GxFn/Alembic.git` 的 `main` 为来源，迁入 `GxFn/AlembicPlugin`。
- 保留当前 Codex 插件相关能力：`plugins/alembic-codex/**`、`channels/codex/**`、`lib/codex/**`、`bin/codex-mcp.ts`、Codex 验证脚本、session simulation、插件 release/smoke 脚本。
- 暂时允许 `AlembicPlugin` 持有当前混合 runtime，先确保代码可构建、插件可安装、Codex MCP 可启动。
- 在迁入后把插件仓库 README 明确写成“插件统一仓库”，不要描述为 Alembic 全能力本地版。
- 迁移完成验收：`npm run build`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin`、Codex status/diagnostics/init 基本链路。

这一阶段不急着把 core 抽干净。先保证插件仓库拿到一份真实可运行的当前代码，避免边搬边抽造成不稳定。

### 阶段 2：用 legacy `v0.1.0` 恢复目标 `Alembic`

目标：让 `GxFn/Alembic` 回到独立全能力仓库，而不是继续使用当前插件化中间态。

- 以 `GxFn/Alembic-legacy.git` 的 `v0.1.0` 版本为恢复基线。
- `v0.1.0` 是 annotated tag；标签对象为 `b84554c...`，实际提交为 `229039c...`。
- 把 legacy `v0.1.0` 的完整代码搬到 `GxFn/Alembic`。
- 恢复 `alembic` CLI、本地 daemon、Dashboard、本地 MCP/API、本地 AI 配置、冷启动、rescan、guard、search、setup/ghost 等独立运行能力。
- 不回迁已经明确外移或删除的方向作为新能力路线：Lark Remote、旧 VS Code 扩展、文件 watcher、浏览器打开、截图采集。
- 对需要保留但要重审的历史能力，先列清单，再决定是否从 legacy 原样保留、简化还是删除。
- 迁移完成验收：`npm run build`、`npm run test:unit`、`alembic --version`、`alembic setup --ghost --dir <fixture>`、`alembic ai status --dir <fixture>`、daemon/Dashboard smoke。

这一阶段的原则是“恢复完整产品面”，不是继续削薄成本地 CLI 空壳。

### 阶段 3：最后新建并抽取 `AlembicCore`

目标：在 `AlembicPlugin` 和 `Alembic` 的真实边界稳定后，再抽唯一共享核心。

- 从 `Alembic` 中抽本地全能力运行时实际使用的核心能力。
- 从 `AlembicPlugin` 中抽 Codex 插件实际使用的核心能力。
- 交集优先进入 `AlembicCore`：Recipe 模型、Ghost workspace、项目目录解析、初始化状态、知识库、数据库、向量、项目发现、Guard、bootstrap/rescan pipeline、AI Provider 抽象、job contract。
- `AlembicCore` 必须从第一版就有真实实现和测试，不做纯接口仓库。
- 抽取后两个上层仓库只保留 adapter、CLI、plugin manifest、UI、host preflight 和发布脚本。
- 迁移完成验收：`Alembic` 和 `AlembicPlugin` 都依赖 `AlembicCore` 构建通过；核心测试覆盖本地 CLI 和 Codex 插件都依赖的链路。

这一阶段是架构收束，不是第一步。等两个产品形态先分开站稳，Core 才能抽得准确。

## 旧顺序对照

### 阶段 1：冻结边界

目标：不再在当前仓库继续混合扩张。此阶段已被新的阶段 1 吸收。

- 在当前实际 `GxFn/Alembic.git` 保持迁移中间态稳定，避免继续同时扩张核心、本地产品和插件交付。
- 将 `Alembic-legacy` 标记为迁移输入，不继续在 legacy 上开发。
- 使用已新建的 `GxFn/AlembicCore` 作为核心目标仓库。
- 使用已新建的 `GxFn/AlembicPlugin` 作为插件统一目标仓库。
- 保留 `GxFn/Alembic` 作为独立全能力目标仓库，但不要把当前插件化中间态误判成最终产品边界。

### 阶段 2：抽出 `AlembicCore`

目标：先保证核心能力可构建、可测试、可被两个上层仓库引用。这个路线现在不作为第一执行顺序，只作为最终阶段的抽取目标。

- 从当前仓库抽出领域、服务、数据库、向量、项目发现、Guard、知识检索、初始化基础。
- 建立 core 单元测试和集成测试。
- 先不迁移 Dashboard、CLI、Codex plugin。
- 保证 BiliDili 这类真实项目可以通过 core API 完成初始化状态检查和安全 dry-run。

### 阶段 3：恢复目标 `Alembic` 全能力仓库

目标：把 legacy 的完整本地能力恢复到 `GxFn/Alembic`，让它成为清晰的独立全能力仓库，而不是继续停留在当前插件化中间态。

- 从 legacy 回迁 `alembic` CLI。
- 接入 `@alembic/core`，删除重复核心实现。
- 恢复 `setup`、`ai configure`、`coldstart`、`rescan`、`guard`、`search`、`daemon`、`ui`。
- Dashboard 只作为本地版产品面。
- 明确外部 AI Provider 风险提示、配置落盘、审计输出。

### 阶段 4：迁出 `AlembicPlugin`

目标：把当前 Codex 插件从当前 `GxFn/Alembic.git` 中剥离到 `GxFn/AlembicPlugin`，并把插件统一仓库作为后续所有宿主插件的入口。

- 迁移 `plugins/alembic-codex/**`。
- 迁移 `channels/codex/**`。
- 迁移 `lib/codex/**` 中属于 Codex 的策略和文案。
- 迁移 Codex session simulation 验证脚本。
- 插件依赖 `@alembic/core`，不再嵌入整个 Alembic 仓库。
- 重新验证真实 Codex Desktop 安装、项目目录传递、Ghost 初始化、status/diagnostics。
- 后续新增插件时在 `AlembicPlugin` 下增加宿主目录，不再回到 `AlembicCore` 或 `Alembic` 中混放。

### 阶段 5：收尾 legacy 和当前中间态

目标：收尾旧入口，避免用户和开发者继续混淆。

- `Alembic-legacy` 保留归档说明。
- 当前 `GxFn/Alembic.git` 在完成回迁后继续作为独立全能力仓库，不归档、不改成插件仓库。
- README 指向 `AlembicCore` 和 `AlembicPlugin`，同时说明 `Alembic` 是独立全能力发行入口。
- npm 包发布关系固定：`@alembic/core`、`alembic-ai`、`alembic-codex`。

## 版本策略

建议：

- `@alembic/core` 使用严格语义版本，任何 API 破坏都升 major。
- `GxFn/Alembic` 锁定兼容的 `@alembic/core` 版本，例如 `^0.2.x`。
- `GxFn/AlembicPlugin` 下的每个插件使用自己的插件版本，release 时记录内置或依赖的 core 版本。
- 三个仓库都保留 `CHANGELOG.md`，但只有 `Alembic` 和 `AlembicPlugin` 面向用户写安装说明。

## 测试与验收

### `AlembicCore`

- `npm run build`
- `npm run test:unit`
- 数据库 migration 测试
- bootstrap/rescan pipeline contract 测试
- Guard/search/Recipe lifecycle 测试
- 真实项目只读 dry-run

### `Alembic`

- `npm run build`
- CLI smoke：`alembic --version`
- 初始化 smoke：`alembic setup --ghost --dir <fixture>`
- AI 配置 smoke：`alembic ai status --dir <fixture>`
- 本地 daemon smoke
- Dashboard build
- 外部 AI 路径必须有显式配置和审计输出

### `AlembicPlugin`

- 插件 manifest 校验
- MCP stdio smoke
- status/diagnostics 不启动 daemon
- init 在可信项目目录下执行 Ghost 初始化
- 无项目目录时返回结构化错误，不猜测
- 默认不触发第三方外部 AI Provider
- Codex session simulation 覆盖冷启动、缺配置、缺项目目录、已有 Recipe、job 恢复

## 关键风险

1. 核心抽取过早做成空壳，导致本地版和插件版各自补实现。
   处理：`AlembicCore` 放到最后抽取，并且必须迁入真实可运行 pipeline，而不是只定义接口。

2. Codex 插件继续打包完整本地版。
   处理：插件只保留 MCP/Skill/preflight/host strategy，完整 CLI 和 Dashboard 归目标 `GxFn/Alembic`。

3. 本地版和插件版的初始化规则不一致。
   处理：项目目录解析、Ghost workspace、初始化状态检查放在 core；上层只负责输入来源和提示文案。

4. 外部 AI Provider 安全边界不清。
   处理：`AlembicCore` 只提供能力，`Alembic` 显式启用，`AlembicPlugin` 默认禁用第三方后台扫描。

5. legacy 中成熟功能迁移时被误删。
   处理：迁移前按命令和模块做功能清单，先写 contract test，再迁移实现。

## 已确认决策与后续确认点

1. 已确认三个仓库名称和角色：
   - `GxFn/AlembicCore`：核心能力仓库。
   - `GxFn/AlembicPlugin`：插件统一仓库。
   - `GxFn/Alembic`：保留为独立全能力仓库。

2. 仍需确认 npm 包名：
   - `@alembic/core`
   - `alembic-ai`
   - `alembic-codex`

3. 已确认当前推荐迁移顺序：
   - 先把当前 `GxFn/Alembic.git` 搬到 `GxFn/AlembicPlugin`。
   - 再把 `GxFn/Alembic-legacy.git` 的 `v0.1.0` 版本搬到 `GxFn/Alembic`。
   - 最后新建并抽取 `GxFn/AlembicCore`。

4. 建议确认 `Alembic` 允许外部 AI 后台扫描，`AlembicPlugin` 默认只走 Codex-native 或本地模型。

5. 建议下一步先做 `AlembicPlugin` 迁移执行方案：明确目标仓库目录、remote、保留历史还是 squash 导入、是否保留当前 `plugins/alembic-codex` 子仓库结构、以及迁移后的验证命令。
