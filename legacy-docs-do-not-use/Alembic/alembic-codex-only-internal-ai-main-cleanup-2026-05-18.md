# Alembic Codex-Only Internal AI Main Cleanup

日期：2026-05-18
窗口：Alembic
状态：已完成

## 完成范围

- 删除 Alembic 主包内传统多 IDE Agent 交付路径：`FileDeployer` / `FileManifest`、`UpgradeService`、`CursorDeliveryPipeline`、delivery repository/service、外部 cold-start/rescan workflow、VSCode extension 资源、Cursor / Claude Code 模板、IDE install/setup 脚本和相关单测。
- 删除 `alembic-mcp` package bin、通用 IDE MCP server 入口、`setup:mcp`、`install:cursor-skill`、`install:vscode-copilot`、`build:vscode-ext`、`package:vscode-ext`、`diagnose:mcp` 等脚本入口，并从 package lock 移除 MCP SDK 依赖。
- `alembic setup` 收束为无 IDE 交付的数据初始化：只准备 runtime/config、knowledge repo、database、platform、vector；不再创建或修改编辑器目录 / Copilot instruction 文件。
- 删除公开 CLI 的 `cursor-rules`、`mirror`、传统 IDE `upgrade` 命令；更新 status / setup / README 文案，让主包只表达 CLI、daemon、Dashboard、HTTP/API、Alembic internal AI 和 Codex Plugin 外部宿主入口。
- `dev:link` / `dev:verify` 不再检查或要求全局 `alembic-mcp`；全局安装验证只检查 `alembic`。
- 保留 CLI、daemon、HTTP/API、Dashboard server、internal AI job、AI provider 配置、JobStore、Recipe / candidate / wiki / guard 能力；未修改 `AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`BiliDili` 源码。

## 提交

- Alembic：`61621b18089898277c6ccee127162b0fd702eec9`

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run build`：通过；`dist/bin` 仅生成 `cli.js`、`api-server.js`、`daemon-server.js` 对应产物。
- `npm run dev:link -- --dry-run --verbose`：通过；只提示验证全局 `alembic`。
- `npm run dev:link -- --skip-install --verbose`：通过；构建 Core、Agent、Alembic、Dashboard，跳过全局安装。
- `npm run dev:link -- --verbose`：通过；全局安装后 `alembic --version` 为 `0.1.0`，未再要求 `alembic-mcp`。
- `command -v alembic-mcp`：无输出，确认当前全局链接没有保留 `alembic-mcp`。
- `npm run dev:verify`：通过；只验证 `alembic`。
- `npm run lint:agent-extraction-boundary`：通过。
- `npm run lint:core-import-boundary`：通过，扫描 416 个文件和 555 个 `@alembic/core` import。
- `git diff --check`：通过。
- `rg -n "full-ide|alembic-mcp|setup:mcp|install:cursor|install:vscode|build:vscode|package:vscode|cursor-rules|\\.cursor|\\.vscode|copilot-instructions|\\.qoder|\\.trae|Claude Code|Qoder|Trae|Copilot|VSCode Extension|IDE Agent" package.json README.md bin lib scripts templates resources test`：0 命中。
- `rg -n "@modelcontextprotocol|alembic-mcp|mcp-server" package-lock.json package.json`：0 命中。
- `node dist/bin/cli.js setup --dir <system-temp>/alembic-setup-smoke-codex-only --force`：通过；生成目录仅包含 Alembic 数据目录和 `.asd` 运行目录，没有创建传统编辑器 Agent 目录。
- `npx biome check --diagnostic-level=error <modified ts/js files>`：通过。

补充验证：

- `npm run release:package-guard`：未通过，原因是当前 dev manifest / lockfile 仍使用 `@alembic/core: file:../AlembicCore` 与 `@alembic/agent: file:../AlembicAgent`；这是 publish staging guard 对本地源码依赖的既有阻断，不是本轮 IDE 删除引入的新问题。
- `npm run check`：未完全通过，`typecheck` 已通过；阻断来自既有 repo-wide Biome lint 旧债，包括 `lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/core/gateway/GatewayActionRegistry.ts`、`scripts/verify-context-api.ts` 中的非空断言 / `any` 规则。本轮修改文件的 `--diagnostic-level=error` 检查已通过。

## 负向扫描剩余命中

- 本轮 Alembic 主仓库目标扫描 0 命中。
- package manifest / lockfile 对 `@modelcontextprotocol`、`alembic-mcp`、`mcp-server` 扫描 0 命中。
- 历史归档文档未纳入删除扫描。

## 遗留风险

- `lib/external/mcp/handlers/**` 和 `lib/external/mcp/tools.ts` 仍保留内部 handler / tool schema 命名，这是 Alembic HTTP / Dashboard / internal API adapter 的历史目录与类型命名，不再包含通用 IDE MCP server、SDK dependency 或 `alembic-mcp` bin；若后续要彻底改名，应单独做 API 路径兼容计划。
- `npm run check` 与 `npm run release:package-guard` 仍有既有阻断，需要由 lint debt / publish staging 计划继续处理。
- setup smoke 会更新用户级 Alembic project registry，这是 setup 的既有行为；本轮只确认目标项目目录没有产生传统编辑器 Agent 文件。

## 下一步建议

- 总控可运行跨仓库负向扫描，确认 `Alembic`、`AlembicPlugin`、`AlembicDashboard` 三个执行窗口文案和入口一致。
- 若需要进一步减少误读，后续单独评估将 `lib/external/mcp/**` 目录名迁移为 host/public tool adapter 命名，并保留兼容层。
- publish staging 继续沿用现有计划处理 local source manifest 与 registry manifest 的分流，不要把本轮结果回退到 vendor 日常入口。
