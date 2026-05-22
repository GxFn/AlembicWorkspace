# AlembicPlugin Repository Folder Boundary Inventory

创建日期：2026-05-22
执行窗口：AlembicPlugin
对应总控计划：[repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](../workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)
任务：RFR-1 路径依赖清单
状态：已通过总控验收

## 完成范围

- 已读取 `AlembicPlugin/AGENTS.md`，本轮只做路径依赖清单和目标层级建议。
- 已扫描 `package.json`、`tsconfig.json`、`vitest*.config.ts`、`biome.json`、`config/default.json`、`bin/`、`lib/`、`scripts/`、`plugins/alembic-codex`、`channels/codex`、`.agents`、`injectable-skills`、`templates` 和 `test/` 中与路径、runtime、channel、cache、Codex MCP 相关的引用。
- 未移动文件、未改源码 import、未删除目录、未重建 `plugins/alembic-codex/runtime` 或 `runtime.tgz`。
- 本文档使用仓库相对路径；不记录本机绝对路径、密钥或用户环境私有路径。

## 真实目录职责

| 路径 | 当前职责 | 路径依赖强度 | RFR-1 判断 |
| --- | --- | --- | --- |
| `lib/` | TypeScript 主源码，包含 Codex adapter、MCP surface、daemon/http/service/infrastructure glue。 | 高：`package.json#imports`、`tsconfig.include`、`vitest` alias、`biome`、多处相对 import 直接绑定。 | 后续若移动必须先设计 package imports 和测试 alias，不允许一口气重排。 |
| `lib/codex/` | Codex runtime identity、status、diagnostics、module/source/service boundary、project root resolver。 | 高：MCP diagnostics、status、Dashboard handoff、channel/runtime 验证依赖这些常量和路径。 | Codex-facing 核心适配层，应保留清晰边界。 |
| `lib/external/mcp/` | Codex MCP server、tool schema、tool handlers、stdio/http glue。 | 高：`bin/codex-mcp.ts`、unit tests、Skill/tool contract 直接消费。 | 不建议并入 Core；若后续整理，优先只在本目录内分层。 |
| `bin/` | `alembic-codex-mcp` 和 daemon server TS 入口，编译为 `dist/bin/*`。 | 高：`package.json#bin`、release/smoke/prepare 脚本验证 `dist/bin/codex-mcp.js`。 | 保留顶层入口，后续移动需同步 package bin、postbuild 和 smoke。 |
| `config/` | 默认配置、constitution、Core import boundary allowlist。 | 中高：`ConfigLoader`、`PACKAGE_ROOT`、runtime prepare、package files 都消费。 | 可保持顶层；若移动需同步 `DEFAULT_FOLDER_NAMES.package.config` 和配置加载。 |
| `scripts/` | build、Core resolver、runtime prepare、Codex channel/plugin verify、cache sync、release guard。 | 高：`package.json#scripts` 与 CI/release 直接绑定。 | 作为正式脚本保留顶层；后续只可按脚本职责分组并同步 scripts 名称。 |
| `plugins/alembic-codex/` | Codex installable plugin shell，独立 `GxFn/AlembicCodex` 子仓库指针。 | 极高：`.gitmodules`、`.agents/plugins/marketplace.json`、`channels/codex/channel.json`、release/smoke/cache sync 全部绑定。 | 禁止当普通源码移动；属于交付仓库/渠道资产。 |
| `plugins/alembic-codex/runtime/` | `prepare:codex-plugin-runtime` 生成的 embedded runtime package。 | 极高：`verify:codex-plugin`、channel package、wrapper、`runtime.tgz` 绑定。 | 生成物，不手工移动；后续迁移只能通过 prepare 脚本改输出。 |
| `plugins/alembic-codex/runtime.tgz` | Codex wrapper 用 `npx --package ./runtime.tgz` 启动的 portable runtime artifact。 | 极高：`.mcp.json` wrapper、channel、verify/smoke、README/playbook 绑定。 | 发布物，禁止目录清理式移动。 |
| `channels/codex/` | Codex channel metadata，记录 plugin path、runtime package、artifact、env。 | 极高：`verify:codex-channel` 和 release flow 直接验证。 | 渠道资产，保留顶层。 |
| `.agents/plugins/marketplace.json` | repo-local GxFn marketplace，指向 `./plugins/alembic-codex`。 | 极高：channel verify、plugin verify、Codex marketplace install 依赖。 | 保留；移动 plugin shell 必须先改这里和所有校验。 |
| `injectable-skills/` | product builtin skills，runtime prepare 会复制到 embedded runtime。 | 高：`package-assets.ts`、`package.json#files`、tests 和 runtime prepare 绑定。 | 保留顶层；可在后续单独评估命名，但不能和 Codex plugin skills 混淆。 |
| `plugins/alembic-codex/skills/` | Codex marketplace plugin skills，对用户/host agent 可见。 | 高：plugin manifest、verify/smoke、runtime shell snapshot 绑定。 | 属于 plugin shell，不能与 `injectable-skills/` 合并。 |
| `templates/` | runtime-shipped recipes setup templates 和 constitution template。 | 中高：`package-assets.ts`、runtime prepare、package files 绑定。 | 保留顶层；若移动需要 Core folder names 和 config 同步。 |
| `vendor/AlembicCore/` | `GxFn/AlembicCore` 子仓库 fallback / portable runtime snapshot 来源。 | 极高：`local-source-paths.mjs`、`prepare-codex-plugin-runtime.mjs`、runtime `.alembic-source.json` 绑定。 | 禁止普通移动；只在 release/runtime snapshot 语境处理。 |
| `dist/` | TypeScript 编译输出和 release/smoke 输入。 | 极高但生成态：`package.json#main/bin/imports`、postbuild、runtime prepare 绑定。 | 生成物，不作为源码整理对象。 |
| `.asd/` | 本地 runtime/cache/log 数据。 | 中：config 默认 `.asd`，daemon/job/status/diagnostics 读写。 | 用户/运行时数据，禁止迁移时顺手删除或纳入源码结构。 |
| `skills/progressive-chain-validation/` | 独立 skill 子仓库。 | 中：`.gitmodules` 记录，当前不在 RFR-1 派发主范围。 | 需要总控确认；不要跟 Codex plugin skills 一起移动。 |
| `test/` | Vitest 单元/集成/场景验证。 | 高：大量 repo-relative imports、path fixtures、Codex cache/runtime tests。 | 实际迁移时必须同步更新 focused tests。 |

## 关键路径依赖

### Root package and TypeScript

- `package.json` 的 `imports` 把 `#shared/*`、`#infra/*`、`#service/*`、`#inject/*`、`#core/*`、`#external/*`、`#http/*`、`#workflows/*`、`#codex/*` 映射到 `./lib/**` 和 `./dist/lib/**`。移动 `lib/` 或子目录时必须同步 runtime imports。
- `package.json#main` 是 `dist/lib/bootstrap.js`，`bin.alembic-codex-mcp` 是 `dist/bin/codex-mcp.js`；`scripts/postbuild.mjs` 也硬编码 `dist/bin/daemon-server.js` 与 `dist/bin/codex-mcp.js`。
- `tsconfig.json` include 只覆盖 `lib/**/*.ts`、`bin/**/*.ts`、`config/**/*.ts`、`scripts/**/*.ts`；exclude 仍显式排除 `dashboard`、`resources`。若后续新增源码根，必须先改 include/lint/format/test coverage。
- `vitest.config.ts` 用自定义 alias 把 `#alias/foo.js` 解析到 `./lib/<directory>/foo.ts`；其中 `agent`、`tools`、`domain`、`platform`、`sandbox`、`repo` 属于历史 alias，扫描显示当前真实 `#agent/`、`#tools/` 命中只存在于 `scripts/report-agent-extraction-boundary.mjs` 的审计标签。后续可作为低风险清理候选，但不属于 RFR-1 执行动作。
- `biome.json`、`package.json#lint/format` 以 `lib/ bin/ config/ scripts/` 为扫描根。

### Core source and portable runtime

- 开发态 `@alembic/core` 为 `file:../AlembicCore`；`scripts/local-source-paths.mjs` 优先解析 `../AlembicCore`，再 fallback 到 `vendor/AlembicCore`。
- portable runtime 中 `@alembic/core` 必须转为 `file:vendor/AlembicCore`；`scripts/prepare-codex-plugin-runtime.mjs` 会写入 `runtime/vendor/AlembicCore/.alembic-source.json`，并把 Core `package.json`、`dist`、`resources`、`config`、`scripts` 复制到 runtime。
- `scripts/resolve-local-sources.mjs` 明确输出 `runtimeCoreDependency: "file:vendor/AlembicCore"`；这个例外不能被路径重构误删。

### Codex plugin shell, channel, cache

- `.agents/plugins/marketplace.json` 指向 `./plugins/alembic-codex`；`channels/codex/channel.json` 也记录同一路径、`runtimeSpecifier: "./runtime.tgz"`、`embeddedRuntimePath: "runtime"`、artifact `plugins/alembic-codex/runtime.tgz`。
- `plugins/alembic-codex/.mcp.json` 以 `cwd: "."` 启动 `./bin/alembic-codex-mcp-wrapper.mjs`，并设置 `ALEMBIC_CODEX_PLUGIN_ROOT="."`、`ALEMBIC_RUNTIME_MODE=plugin`、`ALEMBIC_PLUGIN_HOST=codex`。
- `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs` 依赖安装后插件根目录下的相对 `./runtime.tgz`，并使用 plugin-specific npm cache 与启动锁。移动 shell 或 runtime artifact 必须保持相对路径语义。
- `scripts/sync-codex-plugin-cache.mjs` 从 `channels/codex/channel.json` 读取 plugin path，再把 `plugins/alembic-codex` 同步到 Codex cache；`--local-mcp` 会把 cached `.mcp.json` 改写到 root `dist/bin/codex-mcp.js`。实际迁移必须验证 cache marker hash。
- `scripts/verify-codex-plugin.mjs` 和 `scripts/verify-codex-channel.mjs` 对上述路径有硬断言；它们是实际移动后的最低验收门。

### Package asset resolver and runtime data

- `lib/shared/package-assets.ts` 通过向上查找 `package.json` 且 `name === "alembic-ai"` 定位 `PACKAGE_ROOT`，再由 Core `DEFAULT_FOLDER_NAMES` 派生 `config`、`skills`、`injectable-skills`、`templates`、`resources`。如果 root package 名称或源码层级改变，需先验证 root resolver。
- `config/default.json` 中仍有 `package.dashboard`、`package.resources` folder name；当前 Dashboard 前端已迁出，runtime verify 会确认 embedded runtime 不含 Dashboard frontend。后续不要把这些配置键误判为要恢复 Dashboard 源码。
- daemon/MCP 入口以 `ALEMBIC_PROJECT_DIR` 和 `process.cwd()` 区分 host project 与 plugin runtime；多根 workspace 下不能把 package root、plugin root、host project root 混用。
- `.asd/` 是 runtime data/log/cache 默认目录，配置和多处服务会读写；目录整理不得把它加入发布物或当作源码搬迁。

## 可迁移 / 保留 / 禁止移动判断

### 可迁移目录

- `lib/` 内部可在后续分波做小范围整理，但必须先保留 package imports 语义，并一次只移动一个主模块。
- `scripts/` 可在后续分组为 build/release/dev/verify 子目录，但必须保留 root npm script 名称和 CI 调用。
- `test/` 可跟随源码迁移更新 focused tests，但不能先改测试路径再补实现。

### 应保留目录

- `lib/codex/`、`lib/external/mcp/`、`bin/`、`config/`、`injectable-skills/`、`templates/` 当前应保留顶层表达，避免在 Codex-facing 入口尚未重写时造成多处 breakage。
- `channels/codex/` 与 `.agents/` 应保留顶层渠道入口，除非先完成 channel schema 与 marketplace 路径重写。

### 生成物 / 发布物目录

- `dist/`、`plugins/alembic-codex/runtime/`、`plugins/alembic-codex/runtime.tgz`、`.asd/`、`node_modules/` 属于生成物、发布物或运行时数据，不纳入源码目录重构对象。

### 禁止移动目录

- `plugins/alembic-codex/`：独立 plugin distribution 子仓库指针，受 `.gitmodules`、channel、marketplace、cache sync、release scripts 约束。
- `vendor/AlembicCore/`：Core snapshot/fallback 子仓库，portable runtime 依赖它的相对路径。
- `plugins/alembic-codex/.codex-plugin`、`plugins/alembic-codex/.mcp.json`、`plugins/alembic-codex/bin/`、`plugins/alembic-codex/skills/`：Codex installed plugin shell contract。

### 需要总控确认目录

- `skills/progressive-chain-validation/`：是独立 skill 子仓库，不在 RFR-1 AlembicPlugin 主派发范围；如需调整，应另开 skill/submodule 边界任务。
- `config/default.json` 中遗留的 `dashboard` / `resources` folder names：可能是 Core 默认 folder names 的兼容字段，不能仅凭名称删除。
- `vitest.config.ts` 中历史 alias：可作为后续小清理候选，但需要总控确认是否纳入 RFR-2 或独立 clean-up。

## Codex-facing 优先迁移方案

1. RFR-2 如果优先整理 AlembicPlugin，应先冻结 `plugins/alembic-codex`、`channels/codex`、`.agents`、`vendor/AlembicCore`、`runtime.tgz` 的路径，不把它们作为移动目标。
2. 第一轮代码迁移只建议在 `lib/` 内部做局部重排，例如进一步收敛 `lib/codex` 的 diagnostics/status/runtime context，或在 `lib/external/mcp` 内整理 handlers；不要同时移动 `bin/`、release scripts 和 plugin shell。
3. 如果要调整 script 层级，先新增/更新 npm script 指向，再跑 `verify:codex-channel`、`verify:codex-plugin`、`smoke:codex-plugin`；不要改 script 文件路径后让 channel/release 断开。
4. 如果要清理历史 alias，先单独删除 `vitest.config.ts` 中无调用方的 alias 并跑 focused unit；不要把 alias 清理和源码移动混在同一提交。
5. 任何涉及 `prepare-codex-plugin-runtime.mjs` 的变化，都必须重建 runtime artifact 并同步 `GxFn/AlembicCodex` 子仓库提交；RFR-1 阶段不做。

## 后续最小验证矩阵

| 变更类型 | 最小验证命令 | 验证目的 |
| --- | --- | --- |
| 仅文档/清单 | `git status --short`；`git diff --check` | 确认无源码移动和格式尾随空白。 |
| `lib/` 内部移动 | `npm run build:check`；`npm run lint`；对应 `vitest run --config vitest.unit.config.ts <focused tests>` | 验证 package imports、tsconfig、lint、focused behavior。 |
| `lib/codex` 或 MCP handler 移动 | `npm run build:check`；`vitest run --config vitest.unit.config.ts test/unit/CodexMcpServer.test.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexPluginCacheSync.test.ts` | 验证 Codex-facing tool/runtime/cache 契约。 |
| `bin/` 或 `package.json#bin` 移动 | `npm run build`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin -- --no-npx-runtime` | 验证编译入口、wrapper、MCP stdio smoke。 |
| `scripts/` release/cache 移动 | `npm run verify:codex-channel`；`npm run verify:codex-plugin`；`npm run dev:codex-plugin:sync -- --dry-run` | 验证 npm script、channel、marketplace/cache path。 |
| `prepare-codex-plugin-runtime` 或 runtime artifact 变化 | `npm run build`；`npm run prepare:codex-plugin-runtime`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin` | 验证 embedded runtime package、Core snapshot、runtime tarball。 |
| `plugins/alembic-codex` shell 变化 | `git -C plugins/alembic-codex status --short`；`npm run verify:codex-channel`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin` | 验证子仓库、plugin manifest、channel、install smoke。 |
| `vendor/AlembicCore` 变化 | `node scripts/resolve-local-sources.mjs`；`npm run build:core`；`npm run prepare:codex-plugin-runtime` | 验证 dev source / fallback snapshot / runtime metadata。 |

## 本轮验证命令 / 结果

| 命令 | 结果 |
| --- | --- |
| `git -C AlembicPlugin status --short --branch` | 通过：`main...origin/main`，RFR-1 开始前 AlembicPlugin 源仓库无未提交改动。 |
| `rg --files -g '!node_modules/**' -g '!dist/**' -g '!plugins/alembic-codex/runtime/**' -g '!vendor/**'` | 通过：枚举到 root manifest/config、`lib/`、`bin/`、`scripts/`、`plugins/alembic-codex` shell、`channels/codex`、`.agents`、`injectable-skills`、`templates`、`test/`。 |
| `rg -n "plugins/alembic-codex|channels/codex|runtime.tgz|runtime|vendor/AlembicCore|\\.alembic-source|\\.agents|injectable-skills|assets|dist/bin|dist/lib|../AlembicCore|file:../AlembicCore|file:vendor/AlembicCore|packageRoot|PACKAGE_ROOT|fileURLToPath|new URL|process\\.cwd|ALEMBIC|codex-plugin|local-mcp|marketplace|channel" scripts lib bin config plugins/alembic-codex channels/codex .agents injectable-skills templates test --glob '!plugins/alembic-codex/runtime/**' --glob '!dist/**' --glob '!vendor/**'` | 通过：确认主要路径依赖集中在 package imports/scripts、Core resolver、runtime prepare、channel/marketplace/plugin shell/cache sync、Codex runtime diagnostics 和 tests。 |
| `rg -n "#(agent|tools|domain|platform|sandbox|repo)/" lib test bin scripts config vitest.config.ts package.json --glob '!dist/**' --glob '!plugins/alembic-codex/runtime/**' --glob '!vendor/**'` | 通过：`#agent/`、`#tools/` 只命中 `scripts/report-agent-extraction-boundary.mjs` 的删除边界审计标签；未发现真实 source import。 |

## 遗留风险

- RFR-1 尚未移动代码，因此未跑 build/test/release；本文档结论是迁移前清单，不是实际迁移验收。
- `plugins/alembic-codex` 和 `vendor/AlembicCore` 都是子仓库，后续任何实际路径变更会牵动独立仓库提交、父仓库 gitlink、channel metadata 和 cache sync。
- `config/default.json` 中仍存在 `dashboard` / `resources` folder name；当前判断为兼容字段或 Core folder names，不作为删除依据。
- `vitest.config.ts` 历史 alias 可清理，但必须独立验证，避免把边界清理和目录迁移耦合。
- runtime 生成物扫描需要排除 `plugins/alembic-codex/runtime/**`、`dist/**`、`vendor/**`，否则会把打包快照中的路径重复当作源码命中。

## 下一步建议

- 总控先收齐五个产品仓库 RFR-1 清单，再决定 RFR-2 是否只启动 AlembicPlugin。
- 如果 RFR-2 启动 AlembicPlugin，建议优先做小范围 Codex-facing 目录表达优化，禁止移动 plugin shell、channel、runtime artifact、vendor Core。
- RFR-2 开始前应把最小验证命令固化到 wave 文档，并明确是否需要重建 `runtime.tgz` 和同步 AlembicCodex 子仓库。
