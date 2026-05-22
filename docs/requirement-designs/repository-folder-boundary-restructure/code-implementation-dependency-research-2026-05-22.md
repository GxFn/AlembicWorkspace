# Repository Folder Boundary Restructure Code Dependency Research

创建日期：2026-05-22
状态：RFR-0 总控调研完成，等待 RFR-1 各仓库回填细化

## 调研范围

本轮只做本地代码事实调研，不联网。原因：用户当前目标是 Alembic 系列仓库的真实目录层级调整，关键风险来自本地 package scripts、exports、release/runtime 生成链路和历史边界，而不是外部标准缺失。

扫描对象：

- `Alembic/package.json`、`Alembic/scripts/`、`Alembic/lib/`
- `AlembicPlugin/package.json`、`AlembicPlugin/scripts/`、`AlembicPlugin/lib/`、`AlembicPlugin/plugins/alembic-codex/`
- `AlembicCore/package.json`、`AlembicCore/src/`、`AlembicCore/scripts/`
- `AlembicAgent/package.json`、`AlembicAgent/src/`、`AlembicAgent/scripts/`
- `AlembicDashboard/package.json`、`AlembicDashboard/src/`

## 总体目录事实

当前顶层事实：

- `Alembic`：`bin/`、`config/`、`dashboard/`、`injectable-skills/`、`lib/`、`resources/`、`scripts/`、`skills/`、`templates/`、`test/`、`vendor/`、`.release/`。
- `AlembicPlugin`：`bin/`、`channels/`、`config/`、`injectable-skills/`、`lib/`、`plugins/alembic-codex/`、`scripts/`、`skills/`、`templates/`、`test/`、`vendor/`。
- `AlembicCore`：`src/`、`resources/`、`scripts/`、`test/`、`config/`。
- `AlembicAgent`：`src/`、`config/`、`scripts/`、`test/`、`tmp/`。
- `AlembicDashboard`：`src/`、`public/`。

## Alembic 关键路径依赖

事实：

- `package.json` 的 `main` 是 `dist/lib/bootstrap.js`，`bin.alembic` 是 `dist/bin/cli.js`。
- package `imports` 同时维护开发态 `./lib/...` 和构建态 `./dist/lib/...`。
- scripts 中 `lint`、`lint:fix`、`format` 硬编码 `lib/ bin/ config/ scripts/`。
- release scripts 依赖 `dist/scripts/release.js`。
- package `files` 包含 `injectable-skills`、`dashboard/dist`、`resources/openChrome.applescript` 等发布资产。
- `lib/shared/package-assets.ts` 通过 package root 和 `DEFAULT_FOLDER_NAMES` 计算 `config`、`skills`、`injectable-skills`、`templates`、`resources`、`dashboard`。
- `scripts/prepare-publish-staging.mjs` 读取 root `package.json` 的 `files`，复制 payload 到 `.release/alembic-ai`，并读取相邻 Core / Agent / Dashboard package version。

风险：

- 直接把 `lib/` 改为 `src/` 会同时影响 imports、tsconfig、build 输出、lint/format、release scripts 和 package root resolver 的源码 / dist 假设。
- `dashboard/` 在 Alembic 主仓库中是 Dashboard server 静态资源承载路径，不等同于 `AlembicDashboard` 源码仓库。
- `.release/` 是 staging 生成物，不应被当源码整理。

## AlembicPlugin 关键路径依赖

事实：

- `package.json` 的 `main` 是 `dist/lib/bootstrap.js`，`bin.alembic-codex-mcp` 是 `dist/bin/codex-mcp.js`。
- package `imports` 同时维护开发态 `./lib/...` 和构建态 `./dist/lib/...`，并额外包含 `#codex/*`。
- scripts 中 `lint`、`lint:fix`、`format` 硬编码 `lib/ bin/ config/ scripts/`。
- `plugins/alembic-codex` 是 Codex plugin shell / runtime artifact 位置，不能当普通源码目录随意移动。
- `channels/codex` 是 channel 交付资产。
- `scripts/prepare-codex-plugin-runtime.mjs` 要求存在 `dist/bin/codex-mcp.js`、`dist/bin/daemon-server.js`、`dist/lib/external/mcp/CodexMcpServer.js`，并复制 `dist`、`config`、`templates`、`injectable-skills`、`channels`、`.agents`、embedded Core、plugin shell snapshot 到 runtime。
- `lib/shared/package-assets.ts` 通过 package root 和 `DEFAULT_FOLDER_NAMES` 计算 Plugin 自身配置、skills、injectable skills、templates、resources。

风险：

- `lib/external/mcp`、`lib/codex`、`plugins/alembic-codex`、`channels/codex`、`.agents` 共同组成 Codex-facing 功能闭环；任何拆分都必须同步 runtime prepare、cache sync、verify scripts。
- Plugin 当前仍有部分 `lib/http/routes` 和 dashboard operation 兼容层，迁移时要先确认是否仍有真实消费方。
- `vendor/AlembicCore` 是 portable runtime 例外，不能当普通依赖目录移动。

## AlembicCore 关键路径依赖

事实：

- `AlembicCore` 已使用 `src/` 源码根。
- `package.json` 暴露大量 public exports，包含 `./domain/*`、`./core/*`、`./infrastructure/*`、`./repository/*`、`./service/*`、`./workflows/*` 等深层路径。
- scripts 包含 `smoke:public-api`、`lint:public-api-boundary`、`lint:consumer-core-imports`，说明 public API 边界已有治理脚本。
- `src/shared/package-root.ts` 明确说明在源码布局和编译布局下都要定位 package root，并导出 `config`、`skills`、`injectable-skills`、`templates`、`resources`、`dashboard` 等默认包目录。

风险：

- 目录调整可能直接变成 public API 变更，不能只改内部 import。
- 需要先判断哪些 exports 是正式 API，哪些是历史兼容路径。

## AlembicAgent 关键路径依赖

事实：

- `AlembicAgent` 已使用 `src/` 源码根。
- `package.json` exports 指向 `./agent`、`./service`、`./runtime`、`./prompts`、`./domain`、`./forge`、`./tasks`、`./profiles`、`./ai`、`./tools`、`./memory`、`./context`。
- scripts 包含 `lint:agent-import-boundary`、`lint:public-api-boundary`、`lint:core-import-boundary`、`release:stage`、`smoke:public-imports`。

风险：

- Agent 内部结构已按 runtime/tool/provider 域分层，目录调整优先级低于边界说明和 public exports 稳定。
- `./ai` export 指向 `src/external/ai`，后续如果调整命名要注意 Alembic 主体 AI 配置入口与 Agent provider 能力的边界。

## AlembicDashboard 关键路径依赖

事实：

- `AlembicDashboard` 是标准前端包，scripts 只有 `dev`、`build`、`preview`。
- 当前目录为 `src/components`、`src/constants`、`src/hooks`、`src/i18n`、`src/lib`、`src/theme`、`src/utils`、`public`。

风险：

- 当前结构风险较低，第一波只需要确认是否有长期目录整理需求。
- 后续若整理为 feature-based 结构，必须保护 API client、socket hooks、i18n、theme 和 build。

## 当前结论

1. 第一波不允许任何窗口移动源码目录；只做路径依赖清单、目标层级建议和验证矩阵。
2. 第二波优先处理 `AlembicPlugin`，因为它的历史镜像结构最容易造成职责误解，但 runtime/channel/cache 链路也最敏感。
3. 第三波处理 `Alembic`，但必须保护 CLI、daemon、HTTP/API、Dashboard server、release staging、资源和 package root resolver。
4. `AlembicCore` / `AlembicAgent` / `AlembicDashboard` 先做 inventory，是否实际迁移由回填结果决定。
