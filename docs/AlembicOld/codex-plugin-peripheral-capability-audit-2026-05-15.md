# Codex 插件旁支能力清理审计

日期：2026-05-15

## 结论速览

这轮只审计，不做源码删除。结论按 Codex 插件定位判断：

| 能力 | 当前状态 | Codex 插件是否需要 | 建议 |
| --- | --- | --- | --- |
| AppleScript 复用 Chrome 标签页 | 基本无生产引用，仍被打进插件 runtime | 不需要 | 可优先删除 |
| 独立 ScreenCaptureService | 无生产引用 | 不需要 | 可优先删除 |
| macOS 截图/窗口列表工具组 | 注册到 UnifiedToolCatalog，但不进入 Codex MCP 和 V2 工具路由主链路 | 不需要 | 建议整组删除 |
| CLI `ui` 自动打开浏览器 | 传统 CLI 仍会用 `open` 包打开 Dashboard | Codex 插件不需要 | 若保留传统 CLI，可暂留；若 Codex-only，改成只输出 URL |
| `daemon start --no-open` | 选项仍在，但 daemon start 当前不会打开 Dashboard | 不需要 | 可删除这个无效选项 |
| Codex status 中 `.cursor` / `.vscode` 项目痕迹 | 仍报告旧 IDE artifact | Codex 插件不需要 | 可从 Codex status 输出中移除 |
| 旧 Cursor/VSCode MCP 安装链路 | VSCode 扩展源码已删，但安装脚本、旧 MCP server、Cursor delivery 仍在 | Codex 插件不需要 | 作为第二阶段大边界清理 |

## 审计范围

重点扫描：

- 截图、窗口列表、ScreenCaptureKit、TCC 权限。
- 打开浏览器、AppleScript、Chrome 标签页复用。
- Codex MCP 工具是否会触达这些能力。
- HTTP / Agent Runtime / UnifiedToolCatalog / V2 ToolRouter 的连通性。
- 打包脚本是否仍把旁支资源放进 Codex 插件 runtime。
- 旧 IDE 安装链路在 VSCode 扩展删除后是否仍残留。

未纳入本轮：

- Dashboard 本身。
- tree-sitter grammars。
- Git diff checkpoint。
- Codex 插件 manifest 中的截图素材，这只是市场展示资产，不是运行时截图能力。

## 浏览器能力

相关路径：

- `lib/platform/OpenBrowser.ts`
- `resources/openChrome.applescript`
- `scripts/prepare-codex-plugin-runtime.mjs`
- `scripts/dev-watch-codex-plugin.mjs`
- `package.json`
- `bin/cli.ts`
- `plugins/alembic-codex/skills/alembic/SKILL.md`

当前证据：

- `OpenBrowser.ts` 导出 `openBrowserReuseTab()` 和 `hasMacOSBrowserControlGranted()`，扫描后没有发现生产调用方。
- `resources/openChrome.applescript` 仍被 `prepare-codex-plugin-runtime.mjs` 复制进 Codex 插件 runtime。
- `dev-watch-codex-plugin.mjs` 仍监听 `resources/openChrome.applescript`。
- `package.json` 的 `files` 仍包含 `resources/openChrome.applescript`。
- Codex 插件 skill 明确要求 `alembic_codex_dashboard` 返回 Dashboard URL，不要自己打开浏览器。
- `CodexMcpServer.openDashboard()` 只返回 `dashboardUrl`，不打开浏览器。

判断：

- AppleScript 复用 Chrome 标签页是旧桌面/IDE 使用习惯，不符合 Codex 插件 MCP 的职责。
- 它还会引入 macOS Automation 权限、Chrome/Chromium 应用探测和 AppleScript 失败路径。
- 对 Codex 插件而言，返回 URL 即可。是否打开浏览器应该交给 Codex 客户端或用户。

建议删除：

- 删除 `lib/platform/OpenBrowser.ts`。
- 删除 `resources/openChrome.applescript`。
- 从 `scripts/prepare-codex-plugin-runtime.mjs` 删除 openChrome 复制逻辑。
- 从 `scripts/dev-watch-codex-plugin.mjs` 删除 openChrome 监听项。
- 从 `package.json` 的 `files` 删除 `resources/openChrome.applescript`。

保留条件：

- 如果仍要支持传统 CLI 的 `alembic ui` 自动打开浏览器，`open` 依赖可暂留，因为 `bin/cli.ts` 直接使用 `open(dashUrl)`，不是通过 `OpenBrowser.ts`。

## 截图与 macOS 平台能力

相关路径：

- `lib/platform/ScreenCaptureService.ts`
- `lib/tools/adapters/MacSystemAdapter.ts`
- `lib/tools/adapters/MacSystemCapabilities.ts`
- `resources/native-ui/screenshot.swift`
- `test/unit/MacSystemAdapter.test.ts`
- `lib/injection/modules/AgentModule.ts`
- `package.json`
- `scripts/prepare-codex-plugin-runtime.mjs`

当前证据：

- `ScreenCaptureService.ts` 没有生产引用。它是独立旧服务，会在运行时尝试编译 Swift helper。
- `MacSystemAdapter.ts` 直接依赖 `resources/native-ui/screenshot`，不依赖 `ScreenCaptureService.ts`。
- `MacSystemCapabilities.ts` 定义了 `mac_system_info`、`mac_permission_status`、`mac_window_list`、`mac_screenshot`，生命周期为 `experimental`，surface 只有 `runtime`。
- `AgentModule.ts` 仍把 MacSystem capability 注册进 `UnifiedToolCatalog`，并把 `MacSystemAdapter` 挂到 `LightweightRouter`。
- `AgentRuntimeBuilder` 当前优先传入 V2 `toolRouter`，不是 `UnifiedToolCatalog.getRouter()`。
- `AgentRuntime` 的 schema 来自容器里的 `capabilityCatalog`，也就是 `V2CapabilityCatalog`。V2 registry 里没有 `mac_screenshot` 等工具。
- Codex MCP 工具列表不包含 macOS 截图、窗口列表或权限检查。
- HTTP 直通工具入口使用 V2 `toolRouter`，macOS 工具不是 V2 工具，无法通过这条链路正常执行。

判断：

- `ScreenCaptureService.ts` 是明确死代码。
- MacSystem 工具组当前更像“注册残留”：代码存在、测试存在、资源被打包，但 Codex 插件主链路不可达。
- 截图和窗口标题属于敏感本机信息，且依赖 macOS Screen Recording/TCC 权限，不应该作为 Alembic Codex 插件的默认能力。
- 这类能力若未来需要，应放到独立的本机控制插件里，而不是 Alembic 项目知识插件里。

建议删除：

- 删除 `lib/platform/ScreenCaptureService.ts`。
- 删除 `lib/tools/adapters/MacSystemAdapter.ts`。
- 删除 `lib/tools/adapters/MacSystemCapabilities.ts`。
- 删除 `test/unit/MacSystemAdapter.test.ts`。
- 删除 `resources/native-ui/screenshot.swift` 和二进制 `resources/native-ui/screenshot`。
- 从 `AgentModule.ts` 删除 MacSystem imports、manifest 注册和 adapter 注册。
- 删除 `package.json` 的 `build:screenshot` 脚本。
- 从 `package.json` 的 `files` 删除 `resources/native-ui/screenshot.swift` 和 `resources/native-ui/screenshot`。
- 从 `scripts/prepare-codex-plugin-runtime.mjs` 删除 `resources/native-ui` 复制逻辑。
- 更新 `AGENTS.md` 中 `platform/` 的旧说明，避免继续写 `OpenBrowser、ScreenCaptureService`。

## CLI 打开浏览器

相关路径：

- `bin/cli.ts`
- `package.json` 依赖 `open`

当前证据：

- `alembic ui` 在生产 Dashboard 已构建时会调用 `open(dashUrl)`。
- `alembic ui --no-open` 仍有实际意义。
- `alembic daemon start --no-open` 仍存在，但当前 daemon start 不会自动打开 Dashboard，选项描述已经失真。
- Codex MCP 的 `alembic_codex_dashboard` 只返回 URL，不调用 `open`。

判断：

- 传统 CLI 的自动打开浏览器是非 Codex 插件能力。
- 如果 Alembic 仍保留通用 CLI，`alembic ui` 的 `open` 可暂时保留。
- 如果 Alembic 收束为 Codex 插件优先，可以把 CLI UI 改成默认只输出 URL，彻底移除 `open` 依赖。

建议：

- 立即删除 `daemon start --no-open`。
- 是否改 `alembic ui` 的自动打开浏览器，需要产品边界确认。

## 旧 IDE 与传统 MCP 残留

相关路径：

- `bin/mcp-server.ts`
- `lib/external/mcp/McpServer.ts`
- `scripts/install-vscode-copilot.ts`
- `scripts/install-cursor-skill.ts`
- `scripts/setup-mcp-config.ts`
- `lib/external/mcp/McpToolDiscovery.ts`
- `lib/cli/deploy/FileManifest.ts`
- `lib/cli/deploy/FileDeployer.ts`
- `lib/service/delivery/CursorDeliveryPipeline.ts`
- `bin/cli.ts`
- `lib/codex/StatusService.ts`
- `package.json`

当前证据：

- VSCode 扩展目录已删除，但 `install:vscode-copilot` 脚本仍存在。
- `setup:mcp` 仍会写 VSCode 和 Cursor MCP 配置。
- `bin/mcp-server.ts` 是旧 Cursor/VSCode MCP server 入口，`package.json` 仍暴露 `alembic-mcp`。
- `McpToolDiscovery` 启动时扫描 `.vscode/mcp.json` 和 `.cursor/mcp.json`，再尝试把内联工具 schema 注入主 catalog。
- `FileManifest` 仍包含 `.cursor/mcp.json`、`.vscode/mcp.json`、`.cursor/rules/*`、`.github/copilot-instructions.md`、autoApprove 注入等项目写入项。
- `SetupService` 的 Codex profile 会跳过 `stepIDE()`，但这些旧 IDE 能力仍作为 full-ide profile、CLI 命令和 package scripts 留在仓库里。
- `CodexStatusService` 仍报告 `cursorDirExists`、`vscodeMcpExists` 等旧 IDE artifact。

判断：

- 这些是比截图/浏览器更大的边界，属于“非 Codex 插件的旧 IDE 发行链路”。
- 如果 Alembic 仍要作为 Cursor/VSCode MCP 工具使用，不能直接删。
- 如果 Alembic 现在只作为 Codex 插件发展，这一整组应该从核心仓库清出。

建议分两步：

1. 先清 Codex 可见残留：
   - 从 `CodexStatusService` 删除 `.cursor` / `.vscode` artifact 报告。
   - 从 Codex 文案中移除旧 `alembic_task`、`alembic_health` 等不准确提示，统一指向当前 Codex 工具。
2. 再清传统 IDE 链路：
   - 删除 `bin/mcp-server.ts` 和 `alembic-mcp` bin。
   - 删除 `scripts/install-vscode-copilot.ts`、`scripts/install-cursor-skill.ts`、`scripts/setup-mcp-config.ts`。
   - 删除 `FileManifest` / `FileDeployer` 中 Cursor、VSCode、Copilot、autoApprove 写入逻辑。
   - 删除 `cursor-rules`、`mirror`、旧 `ghost` MCP 切换中与 Cursor/VSCode 绑定的命令。
   - 删除或重命名 `CursorDeliveryPipeline` 及相关字段，前提是 Recipe 产出不再面向 Cursor Rules。

## 已经是空壳或失真文案的点

- `SetupService.stepPlatform()` 已经只返回 `{ skipped: true }`，但文件头仍写“平台相关初始化（macOS → Xcode Snippets）”。
- `SetupService.printSummary()` 的 Codex 分支仍提到 `alembic_health` 和 `alembic_task(operation=prime)`，与当前 Codex MCP 工具不一致。
- `bin/cli.ts` 的 `task list` 是废弃提示。
- `package.json` 仍有 `install:vscode-copilot`、`setup:mcp` 这类旧安装脚本。

这些可以和旁支删除一起顺手清理。

## 推荐清理顺序

### 第一阶段：低风险死代码

删除明确无生产引用且不改变 Codex 行为的内容：

- `OpenBrowser.ts` 与 `openChrome.applescript`。
- `ScreenCaptureService.ts`。
- `daemon start --no-open`。
- 打包和开发刷新脚本里的 openChrome 复制/监听。
- Codex 状态里旧 IDE artifact 的展示。

### 第二阶段：macOS native 工具组

整体删除：

- `MacSystemAdapter`。
- `MacSystemCapabilities`。
- `resources/native-ui`。
- `build:screenshot`。
- 对应测试和 AgentModule 注册。

这一阶段会减少敏感本机能力、平台二进制和 Codex runtime 体积。

### 第三阶段：旧 IDE 发行链路

需要确认 Alembic 是否仍支持 Cursor/VSCode MCP 作为独立入口。若不支持，清理：

- 旧 MCP server。
- Cursor/VSCode MCP 配置生成。
- Cursor Rules / Skills 交付。
- Copilot instructions 写入。
- autoApprove 注入。
- 相关 CLI 命令、package scripts、状态输出。

## 需要确认的边界

1. 是否将 Alembic 明确收束为 Codex 插件，不再支持传统 Cursor/VSCode MCP 安装链路？
2. 是否保留 `alembic ui` 的自动打开浏览器？如果不保留，可以删除 `open` 依赖。
3. 是否直接删除 macOS 截图/窗口列表整组能力？从 Codex 插件角度，我建议删除。
