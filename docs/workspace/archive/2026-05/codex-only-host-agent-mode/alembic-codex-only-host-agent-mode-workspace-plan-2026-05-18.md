# Alembic Codex-Only Host Agent Mode Workspace Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已验收；核心代码路径通过，残留收口进入下一计划

## 目标

这次不做中间过渡，直接把 Alembic 的宿主 Agent 路线收束为：

- `AlembicPlugin`：唯一宿主 Agent 入口，只服务 Codex 插件模式。
- `Alembic`：保留安装后使用外部 AI Provider 的 internal AI 冷启动 / 增量扫描线。

`Alembic` 主包不再默认依赖多种 IDE Agent，也不再维护 Cursor / VS Code Copilot / Trae / Qoder / Claude Code 等项目内交付路径。用户项目侧的 Codex 体验由 `AlembicPlugin` 承担；不安装插件时，`Alembic` 只走 CLI / daemon / Dashboard / HTTP / internal AI。

## 真实代码发现

本轮扫描发现仍有三条需要处理的真实残留面：

- `Alembic` 主包仍有传统 IDE 路径：`SetupService` 默认 `full-ide`、`FileDeployer` / `FileManifest`、`UpgradeService`、`CursorDeliveryPipeline`、`bin/mcp-server.ts`、`alembic-mcp` bin、`cursor-rules` / `mirror` / `upgrade` CLI、`setup:mcp` / `install:cursor-skill` / `install:vscode-copilot` / `build:vscode-ext` / `package:vscode-ext` scripts，以及 `.cursor` / `.vscode` / `.github/copilot-instructions.md` / `.qoder` / `.trae` 写入逻辑。
- `AlembicPlugin` 已经是 Codex 插件仓库，但 Codex 默认状态和 skill 文档仍把 `alembic_codex_bootstrap` / `alembic_codex_rescan` 描述为 internal AI job；这会让 Codex 插件宿主 Agent 线和 Alembic internal AI 线混在一起。
- `AlembicDashboard` 可见文案仍有 IDE Agent / Cursor / VSCode Extension / Copilot / Trae / Qoder / Claude Code 描述，需要和新路线一致。

`AlembicCore` 目前保存的是宿主无关 workflow contract；`AlembicAgent` 负责 internal AI runtime。两者本轮先不派发代码任务，避免为了改名破坏仍被消费的稳定契约。

## 路线定义

### Codex 插件宿主 Agent 线

归属：`AlembicPlugin`

这条线利用 Codex 作为宿主 Agent，由 Codex 读取 mission briefing、分析项目、提交知识、完成维度。它不要求用户先配置 Alembic AI Provider。

保留 / 强化：

- `alembic_codex_init`：仍作为 Codex 插件安全初始化入口，默认 Ghost。
- `alembic_status` / `alembic_task` / `alembic_guard` / `alembic_submit_knowledge` 等 Codex 可见公共能力。
- `alembic_bootstrap` / `alembic_rescan` / `alembic_dimension_complete` 这类宿主 Agent 驱动的 external workflow，如果当前实现已稳定可用，应作为 Codex 插件 cold-start / rescan 的主路径。

需要调整：

- Codex status / onboarding / skill / README 的默认下一步不能再推荐 internal AI job 作为 Codex 插件主路径。
- `alembic_codex_bootstrap` / `alembic_codex_rescan` 如果保留，只能作为明确的 internal AI / daemon job 能力，不能是 Codex 插件默认 cold-start / rescan 推荐；如果实现判断已经没有必要，应从可见本地工具、文档和测试中移除。
- Host-agent bootstrap / rescan 不能因为未配置 AI Provider 而失败；AI Provider 只约束 Alembic internal AI 线。

### Alembic internal AI 线

归属：`Alembic` + `AlembicAgent`

这条线用于用户安装 `alembic-ai` 后，通过 `alembic ai configure` 或等价配置接入外部 AI Provider，让 Alembic 自己执行冷启动 / 增量扫描，结果写入同一套 Ghost / workspace 数据目录。

保留 / 强化：

- CLI、daemon、Dashboard server、HTTP/API。
- `alembic ai status` / `alembic ai configure`。
- internal bootstrap / rescan job、JobStore、Dashboard job 观察。
- `@alembic/agent` 的 provider、runtime、tool、prompt、memory、context 能力。

需要删除：

- Alembic 主包内为多 IDE Agent 交付而存在的 setup 默认、脚本、bin、CLI、模板、文件部署和自动注入逻辑。
- 用户项目内 `.cursor` / `.vscode` / `.github/copilot-instructions.md` / `.qoder` / `.trae` 生成或修改行为。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已删除主包多 IDE Agent 默认 / 支持路径，保留 CLI / daemon / Dashboard / HTTP / internal AI，并让 setup 默认成为无 IDE 交付的数据初始化。 |
| `AlembicPlugin`<br>已完成 | Codex 插件 cold-start / rescan 主路径已切成 Codex 宿主 Agent 线，避免默认推荐或要求 internal AI Provider。 |
| `AlembicDashboard`<br>已完成 | 已更新可见文案和帮助页，删除 IDE / Cursor / VSCode / Copilot / Trae / Qoder / Claude Code 项目交付叙述，改成 Codex host agent + Alembic internal AI 两线。 |
| `AlembicCore`<br>观察中 | 本轮不改 Core；只观察是否有 host-agent contract 阻塞 Plugin 收束。 |
| `AlembicAgent`<br>观察中 | 本轮不改 Agent；它是 Alembic internal AI 线的执行 runtime。 |
| `BiliDili`<br>观察中 | 不改真实测试项目；最多作为 Alembic / Plugin 改完后的只读 smoke 目标。 |

## Alembic 执行要求

文档动作：新建执行记录。

保存位置：`docs/Alembic/alembic-codex-only-internal-ai-main-cleanup-2026-05-18.md`

挂载入口：本文“回填区 / Alembic”。

目标：

- `alembic setup` 不再部署 IDE agent 文件，默认不得创建或修改 `.cursor`、`.vscode`、`.github/copilot-instructions.md`、`.qoder`、`.trae`。
- `SetupService` 去掉 `full-ide` 默认路线；如果仍保留 profile 概念，默认必须是无 IDE 交付的数据初始化。
- 删除或隔离 `FileDeployer` / `FileManifest` / `UpgradeService` / `CursorDeliveryPipeline` / IDE install scripts / VSCode extension build/package 路线，不能再作为 `npm run check` 或正常开发路径的一部分。
- 删除主包 `alembic-mcp` bin 和通用 IDE MCP server 入口，除非实现发现某个非 IDE 内部流程仍真实依赖；若不能删除，必须在执行记录中写明阻塞和替代方案。
- 删除 `cursor-rules`、`mirror`、传统 IDE `upgrade` 等 CLI 命令，或把它们从公开帮助、README、package scripts 和测试入口中彻底移出。
- 更新 README、CLI help、status / setup summary，让用户看到的是 Codex 插件入口或 Alembic internal AI 入口。
- `dev:link` / `dev:verify` 不再要求全局 `alembic-mcp` 存在。

禁止事项：

- 不删除 CLI、daemon、HTTP/API、Dashboard server、internal AI job、AI provider 配置、JobStore、Recipe / candidate / wiki / guard 能力。
- 不把 Codex 插件逻辑复制进 Alembic 主包。
- 不改 `AlembicCore` / `AlembicAgent` 源码来绕过主包删除难点。
- 不触碰 `vendor/*` 指针，除非执行中发现发布产物必须同步，并在执行记录中说明原因。

建议验证命令：

```text
npm run build:check
npm run build
npm run dev:link -- --dry-run --verbose
npm run dev:link -- --skip-install --verbose
npm run dev:verify
npm run release:package-guard
npm run lint:agent-extraction-boundary
npm run lint:core-import-boundary
git diff --check
rg -n "full-ide|alembic-mcp|setup:mcp|install:cursor|install:vscode|build:vscode|package:vscode|cursor-rules|\\.cursor|\\.vscode|copilot-instructions|\\.qoder|\\.trae|Claude Code|Qoder|Trae|Copilot|VSCode Extension|IDE Agent" package.json README.md bin lib scripts templates resources test
```

允许的扫描例外：

- 历史归档文档不参与本轮删除扫描。
- 普通 UI / editor CSS 的 `cursor` 词义不是 Cursor IDE。
- progressive-chain-validation skill 里的 execution cursor 不是 Cursor IDE。

## AlembicPlugin 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicPlugin/alembic-plugin-codex-host-agent-single-line-2026-05-18.md`

挂载入口：本文“回填区 / AlembicPlugin”。

目标：

- Codex 插件的默认 cold-start / rescan 主路径改为 Codex 宿主 Agent 线：由 Codex 读取 briefing、分析、提交知识、完成维度。
- `alembic_codex_status` / onboarding / skill / README 的 recommended action 不再默认指向 `alembic_codex_bootstrap` / `alembic_codex_rescan` internal job。
- Host-agent cold-start / rescan 不依赖 AI Provider；`alembic_codex_ai_config` 只用于说明或配置 Alembic internal AI 线。
- 如果保留 `alembic_codex_bootstrap` / `alembic_codex_rescan`，必须让工具名、描述、可见性、preflight、测试全部明确它们是 internal AI job，不是 Codex 插件默认路径。
- 如果直接删除 `alembic_codex_bootstrap` / `alembic_codex_rescan`，同步删除 ToolPolicy、CodexMcpServer dispatch、tests、README、skill、runtime snapshot 中的引用，并确保 plugin artifact 仍可通过验证。
- 保持 `AlembicPlugin` 只产出 Codex plugin / marketplace artifact，不走 npm registry 包发布。

禁止事项：

- 不把 Alembic 主包的 internal AI job 复制进 Plugin 作为新的默认路径。
- 不要求用户在使用 Codex 插件 cold-start 前配置 API key。
- 不改 `AlembicCore` workflow contract，除非当前插件实现被 Core stable public API 明确阻塞，并在执行记录中回填阻塞点。
- 不触碰 `BiliDili` 源码。

建议验证命令：

```text
npm run build:check
npm run build
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
npm run verify:codex-channel
npm run smoke:codex-plugin
npm run check
git diff --check
rg -n "alembic_codex_bootstrap|alembic_codex_rescan|AI Provider|internal bootstrap|internal rescan" lib plugins test README.md channels
```

验收重点：

- Codex 插件初始化后的 recommended action 指向宿主 Agent 可执行路径。
- 未配置 AI Provider 时，Codex host-agent cold-start / rescan 不失败。
- Plugin runtime snapshot 与源文件一致。

## AlembicDashboard 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicDashboard/alembic-dashboard-codex-only-copy-update-2026-05-18.md`

挂载入口：本文“回填区 / AlembicDashboard”。

目标：

- 删除 Dashboard 可见文案中的传统 IDE Agent、Cursor、VSCode Extension、Copilot、Trae、Qoder、Claude Code 项目交付叙述。
- 帮助页、scan result、drawer、wiki 标签等用户可见区域统一表达为：Codex host agent 和 Alembic internal AI 两条线。
- 不删除 Dashboard 的 bootstrap / rescan job 观察和控制 UI；如果这些 UI 对应 Alembic internal AI / daemon job，只更新名称和说明。
- 保持英文 / 中文 i18n 同步。

禁止事项：

- 不重做 Dashboard 视觉结构。
- 不删除 candidate、recipe、wiki、guard、daemon、job 等产品功能。
- 不把 Dashboard 改成只服务 Plugin；Dashboard 仍属于 Alembic internal AI / 本地管理体验。

建议验证命令：

```text
npm run build
npm run check
git diff --check
rg -n "IDE Agent|Cursor|Copilot|VSCode Extension|Trae|Qoder|Claude Code|cursorIntegration|cursorDelivery|roleCursorAgent|cliCursor|cliMirror|vscodeExt" src
```

允许的扫描例外：

- React / CSS / editor 中的 `cursor` 交互语义不是 Cursor IDE。
- 如果类型 key 暂时保留但用户文案已替换，需要在执行记录中列出保留原因和后续删除条件。

## 观察窗口

`AlembicCore`

- 当前判断：不派发。Core 的 external/internal workflow contract 仍是 Plugin host-agent 和 Alembic internal AI 的共同基础。
- 触发条件：Plugin 或 Alembic 证明 Core 的 public API 命名 / schema 阻塞 Codex-only 表达，且不能在外层 adapter 解决。

`AlembicAgent`

- 当前判断：不派发。它是 Alembic internal AI runtime，不是多 IDE agent 交付层。
- 触发条件：Alembic internal AI 线在删除 IDE path 后缺少 Agent public API、provider、prompt、tool runtime 或 job contract。

`BiliDili`

- 当前判断：不派发。作为真实测试项目保护，不进入日常清理。
- 触发条件：Alembic / Plugin 完成后，需要只读验证 Ghost workspace、Codex plugin init、AI status 或 cold-start / rescan smoke。

## 执行顺序

这三项可以并行启动：

- `Alembic` 删除主包多 IDE agent 支持路径。
- `AlembicPlugin` 收束 Codex 插件默认 cold-start / rescan 到宿主 Agent 线。
- `AlembicDashboard` 更新可见文案。

并行后由总控统一验收跨仓库一致性。若 `Alembic` 删除 `alembic-mcp` 后影响 `AlembicPlugin` runtime 或 docs，两个窗口在回填区记录接口差异，由总控决定是否追加一轮专门收口。

## 总体验收条件

- `Alembic` 主包正常开发、构建、dev link 不再依赖 `alembic-mcp`、VSCode extension、Cursor skill 或多 IDE 交付脚本。
- `AlembicPlugin` Codex cold-start / rescan 默认是 host-agent 可执行路径，而不是 internal AI provider job。
- `AlembicDashboard` 用户可见文案不再宣传传统多 IDE Agent 模式。
- `AlembicCore` 和 `AlembicAgent` 没有被无必要改动。
- `BiliDili` 未被修改；如参与验证，只记录只读命令结果。
- 所有执行窗口都有各自执行记录、提交 hash、验证命令、验证结果、遗留风险和下一步建议。

总控复核命令：

```text
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
rg -n "full-ide|alembic-mcp|setup:mcp|install:cursor|install:vscode|build:vscode|package:vscode|cursor-rules|\\.cursor|\\.vscode|copilot-instructions|\\.qoder|\\.trae|Claude Code|Qoder|Trae|Copilot|VSCode Extension|IDE Agent|alembic_codex_bootstrap|alembic_codex_rescan" Alembic AlembicPlugin AlembicDashboard --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/vendor/**'
```

## 可复制分派提示词

发送给：无

`Alembic`、`AlembicPlugin`、`AlembicDashboard` 已完成本轮任务并回填证据；当前进入总控验收，不再发送领取提示词。

```text
当前无可发送执行窗口。
```

不发送给：`Alembic`、`AlembicPlugin`、`AlembicDashboard`、`AlembicCore`、`AlembicAgent`、`BiliDili`。

## 回填区

### Alembic

- 状态：已完成
- 执行记录：`docs/Alembic/alembic-codex-only-internal-ai-main-cleanup-2026-05-18.md`
- 完成范围：删除 Alembic 主包传统多 IDE Agent 默认 / 支持路径，包括 `FileDeployer` / `FileManifest`、`UpgradeService`、`CursorDeliveryPipeline`、delivery service/repository、外部 cold-start/rescan workflow、`alembic-mcp` bin、通用 IDE MCP server 入口、VSCode extension 资源、Cursor / Claude Code 模板、IDE install/setup scripts、`cursor-rules` / `mirror` / 传统 IDE `upgrade` CLI 和相关单测；`alembic setup` 收束为无 IDE 交付的数据初始化；README、CLI help、status / setup summary 改为 Codex Plugin 外部宿主入口与 Alembic internal AI 入口；`dev:link` / `dev:verify` 不再要求全局 `alembic-mcp`。
- 提交 hash：`61621b18089898277c6ccee127162b0fd702eec9`
- 验证结果：`npm run build:check` 通过；`npm run build` 通过，`dist/bin` 仅保留 `cli.js` / `api-server.js` / `daemon-server.js`；`npm run dev:link -- --dry-run --verbose` 通过；`npm run dev:link -- --skip-install --verbose` 通过；`npm run dev:link -- --verbose` 通过，验证全局 `alembic --version` 且不再要求 `alembic-mcp`；`command -v alembic-mcp` 无输出；`npm run dev:verify` 通过；`npm run lint:agent-extraction-boundary` 通过；`npm run lint:core-import-boundary` 通过；`git diff --check` 通过；目标负向扫描 0 命中；package manifest / lockfile 对 `@modelcontextprotocol`、`alembic-mcp`、`mcp-server` 扫描 0 命中；setup smoke 通过且未生成传统编辑器 Agent 目录；本轮修改文件的 `npx biome check --diagnostic-level=error` 通过。
- 负向扫描剩余命中：Alembic 主仓库目标扫描 0 命中；历史归档文档未纳入本轮删除扫描。
- 遗留风险：`lib/external/mcp/handlers/**` 与 `lib/external/mcp/tools.ts` 仍保留内部 handler / tool schema 历史目录命名，但已无通用 IDE MCP server、MCP SDK dependency 或 `alembic-mcp` bin；`npm run release:package-guard` 仍因 dev manifest / lockfile 使用 `@alembic/core: file:../AlembicCore` 与 `@alembic/agent: file:../AlembicAgent` 被既有 publish staging guard 阻断；`npm run check` 的 `typecheck` 通过，但 repo-wide Biome lint 仍被既有非空断言 / `any` 旧债阻断。
- 下一步建议：总控运行跨仓库负向扫描和文档验收；如后续要彻底消除内部 `external/mcp` 命名误读，应单独制定兼容改名计划，不在本轮扩大删除范围。

### AlembicPlugin

- 状态：已完成
- 执行记录：`docs/AlembicPlugin/alembic-plugin-codex-host-agent-single-line-2026-05-18.md`
- 完成范围：Codex 插件默认 cold-start / rescan 推荐已从 `alembic_codex_bootstrap` / `alembic_codex_rescan` internal AI daemon job 切到 `alembic_bootstrap` / `alembic_rescan` Codex host-agent workflow；cold-start 阶段暴露 `alembic_bootstrap`、`alembic_rescan`、`alembic_submit_knowledge`、`alembic_dimension_complete`；`alembic_codex_ai_config`、`alembic_codex_bootstrap`、`alembic_codex_rescan` 均明确为 Alembic internal AI 线；无 AI Provider 的 Codex host-agent bootstrap 已有单测和会话场景覆盖；`plugins/alembic-codex` portable runtime artifact 已刷新，并保留 `@alembic/core: file:vendor/AlembicCore` 与 `.alembic-source.json`。
- 提交 hash：`36cde99`；nested `plugins/alembic-codex` artifact commit：`47c9b38`
- 验证结果：`npm run build:check` 通过；`npm run build` 通过；目标单测 40 个通过；`npm run verify:codex-session` 通过；`npm run prepare:codex-plugin-runtime` 通过；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`npm run smoke:codex-plugin` 通过；`npm run verify:release-package-boundary` 通过；`npm run release:root-npm-publish:disabled` 按预期阻断 root registry publication；`npm run lint:core-import-boundary` 通过；`git diff --check` 和 nested plugin `git diff --check` 均通过；`npm run check` 未完全通过，原因是既有未改文件 `lib/bootstrap.ts` / `lib/cli/SetupService.ts` lint 旧债阻断，`typecheck` 已通过。
- 负向扫描剩余命中：`rg -n "alembic_codex_bootstrap|alembic_codex_rescan|AI Provider|internal bootstrap|internal rescan" lib plugins test README.md channels` 共 120 行；非 runtime 72 行均为显式 internal AI job 定义 / preflight / dispatch / 测试 / 文档说明 / AI config 场景；runtime 48 行为同步产物、embedded Core 注释和 Dashboard dist 文案。未发现 status / onboarding / skill / README 默认推荐 internal AI job 的残留。
- 遗留风险：`npm run check` 的 lint 旧债未在本轮扩大范围修复；runtime Dashboard dist 中仍可能有 Dashboard 静态产物历史文案，需等待 Dashboard 产物同步策略统一后复核；portable runtime 同步了当前 `../AlembicCore` snapshot，这是 artifact 变化，不是修改 Core 源仓库。
- 下一步建议：Alembic 主包完成删除后，复核 Plugin 文案与 Alembic internal AI CLI 命名；如总控后续希望进一步降低误读，可单独评估是否把 `alembic_codex_bootstrap` / `alembic_codex_rescan` 从默认工具列表降为更窄显式入口。

### AlembicDashboard

- 状态：已完成
- 执行记录：`docs/AlembicDashboard/alembic-dashboard-codex-only-copy-update-2026-05-18.md`
- 完成范围：更新 Help 可见文案和中英文 i18n，将传统多编辑器 Agent / Cursor / VSCode Extension / Copilot / Trae / Qoder / Claude Code 项目交付叙述收束为 `Codex host agent` + `Alembic internal AI` 两线；ScanResult / Drawer 展示名从 `Cursor Delivery` 改为 `Agent Delivery`；Wiki source 可见标签从 `Cursor Docs` 改为 `Codex Docs`；代码编辑器内部 caret 回调从 `onCursorChange` 改为 `onCaretChange`，避免总控扫描误伤普通文本光标；保留 bootstrap / rescan job 观察和控制 UI。
- 提交 hash：`67edca51f092f592125fd5357d7824969cee7205`
- 验证结果：`npm run build` 通过，Vite 仅保留既有 large chunk warning；`npm run check` 未执行成功，原因是本仓库未定义 `check` 脚本；`git diff --check` 通过；总控建议 Dashboard 扫描 0 命中；旧 i18n/key 扫描 0 命中；可见旧 IDE/Cursor/Copilot/VSCode/Trae/Qoder/Claude Code 文案扫描 0 命中。
- 遗留风险：`WikiView` 中后端历史 source id `cursor-devdocs` 为兼容既有 payload 保留，用户可见 label 已改为 `Codex Docs`；Help 中 `asd ai status` / `asd ai configure` 文案依据总控定义的 Alembic internal AI 线，需在 Alembic 主包最终 CLI 命名落定后复核。
- 下一步建议：Alembic 完成主包删除后复核 Dashboard CLI 文案；AlembicPlugin 完成 Codex host-agent 主路径收束后复核 Help 中 Codex 插件描述；总控跨仓库扫描时把 CSS `cursor-*` 和 `cursor-devdocs` source id 作为允许命中处理。

### 总控验收

- 状态：已验收
- 结论：`Alembic`、`AlembicPlugin`、`AlembicDashboard` 三个执行窗口均已回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议；`AlembicCore`、`AlembicAgent`、`BiliDili` 保持观察且未改源码。总控复核通过 workspace 文档验证、派发覆盖、`git diff --check`、`Alembic npm run build:check`、`AlembicPlugin npm run build:check`、`AlembicDashboard npm run build`。核心代码路径验收通过，但跨仓库残留扫描发现 README_CN、config、templates、file-change VSCode heartbeat、Plugin runtime Dashboard artifact 等收尾项，已新建下一计划 `docs/workspace/alembic-codex-only-residual-runtime-docs-closeout-workspace-plan-2026-05-18.md`。
