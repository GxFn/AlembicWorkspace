# Alembic Repository Folder Boundary Inventory

创建日期：2026-05-22
执行窗口：Alembic
对应计划：`docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md`
阶段：RFR-1 路径依赖清单
状态：已通过总控验收

## 完成范围

本轮只做 Alembic 主仓库路径依赖清单、目标层级建议、禁止移动项和后续验证矩阵；未移动文件，未修改源码 import，未删除目录，未重命名 package exports，未重建 runtime / release artifact。

已覆盖目录和入口：

- `lib/`、`bin/`、`config/`、`scripts/`
- `dashboard/`、`resources/`、`injectable-skills/`、`templates/`
- `.release/`、`dist/`、`vendor/`
- `test/`、`.github/workflows/`
- `package.json`、`tsconfig.json`、`vitest*.config.ts`、`biome.json`

## 仓库定位结论

Alembic 主仓库是本地增强底座，不能按“Core 已抽出所以主仓库可瘦身”的方式移动或删减。当前目录已经承载真实运行闭环：

- CLI：`bin/cli.ts`、`bin/api-server.ts`、`bin/daemon-server.ts` 编译到 `dist/bin/*`，由 npm `bin.alembic` 暴露。
- daemon / HTTP / Dashboard server：`lib/daemon/**`、`lib/http/**`、`dashboard/dist` 共同提供本地 resident service。
- 宿主能力：`lib/platform/**`、`lib/sandbox/**`、`lib/tools/**`、`lib/injection/**`、`lib/service/**` 仍属于主仓库边界。
- 注入与资源：`injectable-skills/`、`templates/`、`resources/` 通过 package assets 和 npm files 进入发布包。
- 共享内核消费：开发态 `@alembic/core` 与 `@alembic/agent` 使用 `file:../...`；发布 staging 替换成 registry version。
- fallback / release snapshot：`vendor/AlembicCore`、`vendor/AlembicDashboard` 是 workspace 外和便携场景 fallback，不是普通源码目录。

## 路径依赖清单

### package manifest

`package.json` 是当前最核心路径契约：

- `main`: `dist/lib/bootstrap.js`，依赖 TypeScript 输出目录不变。
- `bin.alembic`: `dist/bin/cli.js`，依赖 `bin/cli.ts` 编译后位置不变。
- `imports`：
  - `#shared/*` -> `./lib/shared/*` / `./dist/lib/shared/*`
  - `#infra/*` -> `./lib/infrastructure/*` / `./dist/lib/infrastructure/*`
  - `#service/*` -> `./lib/service/*` / `./dist/lib/service/*`
  - `#inject/*` -> `./lib/injection/*` / `./dist/lib/injection/*`
  - `#core/*` -> `./lib/core/*` / `./dist/lib/core/*`
  - `#external/*` -> `./lib/external/*` / `./dist/lib/external/*`
  - `#platform/*` -> `./lib/platform/*` / `./dist/lib/platform/*`
  - `#types/*` -> `./lib/types/*` / `./dist/lib/types/*`
  - `#http/*` -> `./lib/http/*` / `./dist/lib/http/*`
  - `#workflows/*` -> `./lib/workflows/*` / `./dist/lib/workflows/*`
  - `#tools/*` -> `./lib/tools/*` / `./dist/lib/tools/*`
  - `#sandbox/*` -> `./lib/sandbox/*` / `./dist/lib/sandbox/*`
- scripts 直接引用 `scripts/*.mjs`、`dist/scripts/*.js`、`dist/bin/cli.js`、`lib/ bin/ config/ scripts/`。
- `files` 发布白名单包含 `dist`、`config`、`scripts/clean-dist.mjs`、`scripts/postbuild.mjs`、`injectable-skills`、`templates`、`dashboard/dist`、`resources/openChrome.applescript`。
- `directories.lib`、`directories.test` 保留 npm 元数据含义。

结论：`lib/` 内任意一级目录迁移都必须同步改 `package.json imports`、源码 import、测试 import、Biome/Lint、tsconfig、release staging。`dist/`、`dashboard/dist`、`injectable-skills/`、`templates/`、`resources/openChrome.applescript` 是发布白名单，不可直接移动。

### TypeScript / Vitest / Biome

- `tsconfig.json`：
  - include: `lib/**/*.ts`、`bin/**/*.ts`、`config/**/*.ts`、`scripts/**/*.ts`
  - exclude: `dashboard`、`scratch`、`dist`、`test`、`resources`
  - `rootDir` 为 `.`，`outDir` 为 `dist`
- `test/tsconfig.json`：
  - include: `./**/*.ts`、`../lib/**/*.ts`、`../bin/**/*.ts`、`../config/**/*.ts`
- `vitest.config.ts`：
  - setup: `test/setup.ts`
  - test include: `test/**/*.test.ts`
  - coverage include/exclude: `lib/**/*.ts`、`lib/**/index.ts`、`lib/bootstrap.ts`
  - resolve condition: `alembic-dev`
- `vitest.unit.config.ts`：
  - include: `test/unit/**/*.test.ts`
  - exclude: `test/integration/**`、`test/e2e/**`
- `biome.json`：
  - includes: `lib/**`、`bin/**`、`config/**`、`scripts/**`、`test/**` 和根层 JS/TS 文件。

结论：`lib/`、`bin/`、`config/`、`scripts/`、`test/` 是构建 / 测试 / lint 显式根。若实际迁移，必须先改配置，再改 import，最后跑 build、lint、unit/integration。

### config / package assets

- `config/default.json` 的 `paths.folderNames.package` 固定：
  - `config`
  - `dashboard`
  - `injectable-skills`
  - `skills`
  - `resources`
  - `templates`
- `lib/shared/package-assets.ts` 用 `DEFAULT_FOLDER_NAMES` 定位：
  - `CONFIG_DIR`
  - `INJECTABLE_SKILLS_DIR`
  - `SKILLS_DIR`（deprecated，但仍指向 injectable skills）
  - `TEMPLATES_DIR`
  - `RESOURCES_DIR`
  - `DASHBOARD_DIR`

结论：这些目录名是 runtime asset resolver 的一部分，不是纯视觉层级。迁移前必须先让 Core `DEFAULT_FOLDER_NAMES`、Alembic config、package asset adapter、release files 和运行时消费方同时就绪。

### scripts / release / source resolver

- `scripts/workspace-source.mjs`：
  - `../AlembicCore` 优先，`vendor/AlembicCore` fallback。
  - `../AlembicDashboard` 优先，`vendor/AlembicDashboard` fallback。
- `scripts/core-source-command.mjs`：
  - build 使用 `../AlembicCore` 或 `vendor/AlembicCore` 的 `tsconfig.json`。
  - lint-consumer-imports 调用 Core 的 `scripts/lint-consumer-core-imports.mjs`，并使用 `config/core-import-boundary.json`。
- `scripts/build-dashboard.mjs`：
  - build `../AlembicDashboard` 或 `vendor/AlembicDashboard`。
  - 复制 Dashboard `dist` 到 Alembic `dashboard/dist`。
- `scripts/prepare-publish-staging.mjs`：
  - 输出 `.release/alembic-ai`。
  - 读取 `../AlembicCore/package.json`、`../AlembicAgent/package.json`、`../AlembicDashboard/package.json`。
  - publish staging 将 `file:../...` 替换成 registry version。
  - npm dry-run cache 使用 `.release/.npm-cache`。
- `scripts/verify-release-package-boundary.mjs`：
  - 校验 `.release/alembic-ai/package.json` 和 `.release/alembic-ai/alembic-release-source.json`。
  - 禁止 staging manifest 继续含 `file:../` 或 `file:vendor/`。
- `scripts/postbuild.mjs`：
  - 给 `dist/bin/cli.js`、`dist/bin/api-server.js`、`dist/bin/daemon-server.js` 加 shebang 和执行权限。

结论：`scripts/` 是发布 / 构建 / workspace source resolver 的核心，不适合迁到无语义的 `tools/`。`vendor/`、`.release/`、`dashboard/dist` 的相对位置已进入脚本契约。

### CLI / daemon / Dashboard runtime

- `bin/cli.ts` 直接引用 `../lib/**`，并包含 Dashboard dev/static 解析：
  - dev source: `../AlembicDashboard`
  - fallback source: `vendor/AlembicDashboard`
  - static source: `dashboard/dist`
- `bin/daemon-server.ts` 使用 `DASHBOARD_DIR` 挂载静态 Dashboard，并记录 `ALEMBIC_DAEMON_DASHBOARD_MOUNTED`。
- `lib/http/HttpServer.ts` 包含 `dashboard/dist` 静态挂载入口。

结论：`dashboard/` 不是普通前端源码目录，当前在主仓库里主要承担“已构建 Dashboard 静态产物托管点”。源码迁移已属于 `AlembicDashboard` 仓库；主仓库不应再把 `dashboard/` 改成复杂前端源码树。

### tests

测试大量使用相对 import，例如：

- `test/unit/**` -> `../../lib/**`
- `test/integration/**` -> `../../lib/**`
- `test/e2e/**` -> `../../lib/**`
- 部分边界测试硬编码检查 `lib/http/HttpServer.ts`、`lib/external/mcp/**`、`lib/workflows/**`。

结论：如果 `lib/` 内部迁移，测试 import 和边界测试也必须同波更新。RFR-1 阶段不应改测试。

## 目录分类

| 目录 | 当前职责 | 分类 | RFR 建议 |
| --- | --- | --- | --- |
| `bin/` | CLI / API server / daemon server 源入口 | 应保留 | 保持根级 `bin/`；它与 npm bin 和 postbuild 强绑定。 |
| `lib/cli/` | CLI 命令服务与交互 | 应保留 | 可保持现状；若后续整理，只在 `lib/cli` 内部细分。 |
| `lib/daemon/` | daemon supervisor、runtime control、job runner | 禁止跨仓移动 | 本地增强底座核心，后续只允许内部微整理。 |
| `lib/http/` | HTTP server、routes、middleware、Dashboard operation adapter | 禁止跨仓移动 | resident service API 核心，目录名进入 imports alias。 |
| `lib/service/` | 业务服务、bootstrap、search、wiki、skills、task、vector | 需要总控确认 | 体量较大，但仍是宿主服务层；可后续按 bounded context 内部整理。 |
| `lib/workflows/` | cold-start / rescan / internal-agent workflow | 需要总控确认 | 与 Agent/Core 边界敏感，移动前需确认真实消费方和 exports。 |
| `lib/external/` | MCP/tool handler adapter 等外部接口适配 | 需要总控确认 | Codex-facing 已迁 AlembicPlugin，但 resident API 仍需保留明确边界。 |
| `lib/tools/` | host-owned tool adapter / platform bridge | 应保留 | 不迁入 Core；可后续内部按 adapter/provider 整理。 |
| `lib/platform/` | Mac/system/native platform adapter | 应保留 | 主仓库宿主能力。 |
| `lib/sandbox/` | sandbox runner / proxy | 应保留 | 主仓库宿主能力。 |
| `lib/injection/` | ServiceContainer 和模块注入 | 禁止轻易移动 | 全局 wiring 中枢，改动影响面大。 |
| `lib/shared/` | 主仓库 shared helper / schemas / package assets | 需要总控确认 | 不能与 Core shared 混淆；迁移前需区分 host shared 和 core shared。 |
| `lib/core/` | Alembic-owned gateway/constitution/permission adapter | 需要总控确认 | 名称容易与 `@alembic/core` 混淆；可作为后续命名优化候选，但不能直接删。 |
| `config/` | default config、constitution、import boundary config | 应保留 | package files 和 runtime config 依赖根级 `config`。 |
| `scripts/` | build/release/dev-link/lint/smoke/source resolver | 应保留 | 正式脚本根；大量 package scripts 依赖。 |
| `dashboard/` | 已构建 Dashboard 静态产物落点 | 生成物 / 发布物目录 | 保留 `dashboard/dist`，不要扩展为源码树。 |
| `resources/` | native/system resources，如 AppleScript | 发布物目录 | `resources/openChrome.applescript` 在 npm files 中，保留。 |
| `injectable-skills/` | 产品内置注入 skill | 发布物目录 | package assets 和 npm files 依赖，保留。 |
| `templates/` | 初始化 / recipe 模板 | 发布物目录 | package assets 和 npm files 依赖，保留。 |
| `.release/` | npm publish staging、npm cache | 生成物目录 | 禁止当源码整理；可清理产物但不纳入源码迁移。 |
| `dist/` | TypeScript 编译输出 | 生成物目录 | 禁止手改；由 build 生成。 |
| `vendor/` | Core / Dashboard fallback 与 release snapshot | 发布 / fallback 目录 | 不当普通源码移动；更新需按源仓库 hash 记录。 |
| `test/` | unit/integration/e2e | 应保留 | 实际迁移时同波更新相对 import。 |

## 建议目标层级

第一优先级不是重排目录，而是固化“源码 / 入口 / 资源 / 生成物 / fallback”的表达：

```text
Alembic/
├── bin/                         # 保持：npm/CLI 入口源码
├── lib/                         # 保持：主仓库 host-owned runtime 源码
│   ├── cli/
│   ├── daemon/
│   ├── http/
│   ├── service/
│   ├── workflows/
│   ├── tools/
│   ├── platform/
│   ├── sandbox/
│   ├── injection/
│   ├── external/
│   ├── shared/
│   └── types/
├── config/                      # 保持：runtime / boundary config
├── scripts/                     # 保持：正式构建、发布、验证脚本
├── dashboard/dist/              # 保持：Dashboard 静态发布产物
├── injectable-skills/           # 保持：产品内置 skill 资源
├── templates/                   # 保持：初始化模板
├── resources/                   # 保持：native/system 资源
├── test/                        # 保持：测试根
├── vendor/                      # 保持：source fallback / snapshot
├── dist/                        # 生成物
└── .release/                    # 生成物 / npm publish staging
```

后续若总控确认要实际迁移，建议只考虑小范围内部整理：

- `lib/service/` 可按 `bootstrap/ search/ vector/ wiki/ task/ skills/ module/ evolution/ cleanup` 继续内部收敛，但不要改根级 `service` alias。
- `lib/workflows/` 可补充 README / boundary 注释，暂不建议移动。
- `lib/core/` 名称与 `@alembic/core` 容易混淆，可作为后续单独命名议题；但必须先扫描所有 import、测试和 package alias。
- `dashboard/` 仅保留 `dist` 落点；不要把 AlembicDashboard 源码搬回主仓库。

## 禁止移动项

实际迁移前禁止移动或重命名：

- `bin/cli.ts` 与 `dist/bin/cli.js` 契约。
- `package.json imports` 中任一 `#.../*` 对应根目录。
- `config/default.json` 的 package folder names。
- `scripts/workspace-source.mjs` 依赖的 `../AlembicCore`、`vendor/AlembicCore`、`../AlembicDashboard`、`vendor/AlembicDashboard`。
- `scripts/build-dashboard.mjs` 输出的 `dashboard/dist`。
- `scripts/prepare-publish-staging.mjs` 输出的 `.release/alembic-ai`。
- `scripts/verify-release-package-boundary.mjs` 校验的 `.release/alembic-ai/package.json` 和 `alembic-release-source.json`。
- `injectable-skills/`、`templates/`、`resources/openChrome.applescript`，因为它们在 npm package `files` 白名单里。
- `vendor/`，除非当前波明确处理 release snapshot / fallback。
- `dist/` 和 `.release/`，因为它们是生成物。

## 后续实际迁移最小验证矩阵

若下一阶段只改文档：

- `git diff --check`

若下一阶段移动 `lib/**` 或 `bin/**`：

- `npm run build:check`
- `npm run lint`
- `npm run test:unit`
- `npm run test:integration`
- `npm run lint:repo-boundary`

若下一阶段移动 `config/**`、`injectable-skills/**`、`templates/**` 或 `resources/**`：

- `npm run build:check`
- `npm run test:unit`
- `npm run release:staging:prepare`
- `npm run release:package-guard`

若下一阶段影响 Dashboard 静态产物、Dashboard source resolver 或 release staging：

- `npm run build:dashboard`
- `npm run release:staging:prepare`
- `npm run release:staging:pack`
- `npm run release:package-guard`

若下一阶段影响 CLI / daemon / runtime control：

- `npm run build`
- `npm run test:unit`
- `npm run test:integration`
- `npm run smoke:multi-project-control`

## 本轮验证命令与结果

- `git -C Alembic status --short`：通过，Alembic 源码仓库无未提交改动。
- `rg -n 'lib/|src/|dist/|\.release|runtime|vendor/|plugins/alembic-codex|channels/codex|injectable-skills|templates|resources|dashboard|bin/|config/|scripts/' package.json tsconfig.json vitest.config.ts vitest.unit.config.ts biome.json scripts lib bin config test dashboard resources injectable-skills templates .github/workflows`：通过，已用于整理路径依赖清单；`plugins/alembic-codex` 与 `channels/codex` 在 Alembic 当前产品路径中无有效命中。
- `git diff --check`：通过。

## 遗留风险

- `lib/core/` 与外部 `@alembic/core` 命名相近，后续如果做目录表达优化，需要单独验收 public import、测试边界和 package alias，不能在大规模搬目录中顺手处理。
- `scripts/prepare-publish-staging.mjs` 直接读取 `../AlembicCore`、`../AlembicAgent`、`../AlembicDashboard`，发布 staging 依赖 sibling source 可用；若 workspace 文件夹层级改变，必须先改该脚本和 Release workflow。
- `test/unit/AgentModuleBoundaries.test.ts` 等边界测试硬编码部分 `lib/**` 路径；实际迁移会有较大测试更新面。
- `dashboard/dist` 是主仓库发布物落点，不是前端源码。后续整理若误删该目录，会破坏 npm package 的 Dashboard 静态托管。

## 下一步建议

- RFR-2 不建议先动 Alembic 主仓库；应等待 AlembicPlugin 的 Codex-facing 目录清单和总控验收。
- RFR-3 如进入 Alembic 主仓库，建议优先做“文档化目录边界 + 小范围 package asset resolver 验证”，再考虑任何源码移动。
- 若必须改目录，建议一次只处理一个根目录或一个 `lib/<bounded-context>`，每波都跑对应最小验证矩阵，避免 release、Dashboard 和 runtime control 同时受影响。
