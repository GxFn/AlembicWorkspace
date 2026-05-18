# Alembic Local Source Import Unification Workspace Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成

本文暂停上一份 `alembic-core-agent-interface-boundary-wave-2b-acceptance-wave-2c-plan-2026-05-18.md` 的旧 Wave 2C 直接派发，先统一处理 `Alembic`、`AlembicPlugin`、`AlembicAgent` 三个仓库的本地源码引入方式。

验收入口：

- 统一契约：`docs/workspace/alembic-local-source-resolver-script-contract-2026-05-18.md`
- 验收总结：`docs/workspace/alembic-local-source-import-unification-acceptance-summary-2026-05-18.md`

总控规则：

- 本地开发和总控验收优先使用 workspace 本地源码：`../AlembicCore`、`../AlembicAgent`、`../AlembicDashboard`。
- 正常提交仍由各源仓库完成；需要 release、Codex plugin runtime、npm package、离线安装、远程 CI 或 portable snapshot 时，再确认 vendor/submodule/远程指针并记录源 commit。
- BiliDili 默认不进入 Alembic 日常开发流程；只有真实 iOS/Swift 项目测试、扫描、接入、复现或回归验证需要时才纳入。

## 1. 真实代码事实

本轮读取到的当前状态：

| 仓库 | 当前事实 | 判断 |
| --- | --- | --- |
| `AlembicAgent` | `package.json` 已使用 `@alembic/core: file:../AlembicCore`；`lint:core-import-boundary` 已调用 `../AlembicCore/scripts/lint-consumer-core-imports.mjs`。 | 已接近目标口径，需要作为三仓库统一基线复核，并补执行记录 / 守门说明。 |
| `Alembic` | `@alembic/agent` 已是 `file:../AlembicAgent`；`@alembic/core` 仍是 `file:vendor/AlembicCore`；`build:core` 和 Core boundary lint 仍写死 `vendor/AlembicCore`；`scripts/build-dashboard.mjs` 写死 `vendor/AlembicDashboard`。 | 需要实际代码调整。目标是本地开发使用 `../AlembicCore` 和 `../AlembicDashboard`，vendor 只作为 workspace 外 fallback / release snapshot。 |
| `AlembicPlugin` | `@alembic/core` 仍是 `file:vendor/AlembicCore`；`build:core` 和 Core boundary lint 仍写死 `vendor/AlembicCore`；`build-dashboard`、watch、runtime packaging 多处写死 vendor；embedded runtime 仍必须保留 `file:vendor/AlembicCore` 以便 portable plugin 运行。 | 需要实际代码调整。根仓库本地开发使用 `../AlembicCore` / `../AlembicDashboard`；Codex plugin runtime 打包时从本地源码生成 `runtime/vendor/AlembicCore` 快照，runtime 内继续使用 `file:vendor/AlembicCore`。 |
| `AlembicCore` | 本轮是被消费源仓库，不需要改 Core 代码。 | 观察中。若三仓库发现缺 public facade，再回流新任务。 |
| `AlembicDashboard` | 本轮是被消费源仓库，不需要改 Dashboard 代码。 | 观察中。Alembic / Plugin 只调整自身构建脚本如何解析本地 Dashboard。 |
| `BiliDili` | 真实 iOS/Swift 测试项目，不参与当前 JS package 引入收口。 | 无任务。 |

## 2. 统一目标

三仓库统一成以下口径：

1. `AlembicAgent` 是当前参考模式：本地直接依赖 `../AlembicCore`，不走 vendor。
2. `Alembic` 的日常开发、build/check/lint/smoke 使用 workspace 本地 `../AlembicCore`、`../AlembicAgent`，Dashboard build 优先使用 `../AlembicDashboard`。
3. `AlembicPlugin` 的日常开发、build/check/lint 使用 workspace 本地 `../AlembicCore`，Dashboard build 优先使用 `../AlembicDashboard`。
4. `AlembicPlugin` 的 Codex plugin runtime / tarball 是 portable 交付物，允许并且必须生成 `runtime/vendor/AlembicCore` 快照；但快照来源应优先是本地 `../AlembicCore`，并在执行文档记录源 commit。
5. 不把 vendor/submodule/远程指针确认作为本地开发验收条件；只有 release / snapshot / workspace 外独立运行场景才触发。

## 3. 分派表

本轮原发送给 `Alembic`、`AlembicPlugin`、`AlembicAgent`，当前均已完成并通过总控复核。其中 `Alembic` 和 `AlembicPlugin` 是代码调整窗口；`AlembicAgent` 是基线确认和守门记录窗口。其它窗口不发送，避免空转。

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | 已完成 | 已将本地开发 / 总控验证的 Core 入口从 `vendor/AlembicCore` 调整为 `../AlembicCore`；保持 `@alembic/agent: file:../AlembicAgent`；Dashboard build 优先使用 `../AlembicDashboard`，vendor 只作 fallback / snapshot；已更新本仓库 `AGENTS.md` 中过时的 vendor-only 规则；host gates 已通过。 | 已新建 | `docs/Alembic/alembic-local-source-import-unification-2026-05-18.md` | 本文第 3 节；`docs/workspace/index.md` 当前总控入口 | 本文第 5.1 节 | 已通过，见验收总结 | 已提交 `9461232072ae77a9b272554fcb61246ff9d1d856`；总控复核通过。 |
| `AlembicPlugin` | 已完成 | 已将根仓库本地开发 / build / lint 的 Core 入口从 `vendor/AlembicCore` 调整为 `../AlembicCore`；Dashboard build/watch 优先使用 `../AlembicDashboard`；Codex plugin runtime 打包脚本从本地 Core 生成 portable `runtime/vendor/AlembicCore` 快照，runtime 内依赖仍保持 `file:vendor/AlembicCore`；已更新本仓库 `AGENTS.md`；`@alembic/agent` 扫描 0 命中。 | 已新建 | `docs/AlembicPlugin/alembic-plugin-local-source-import-unification-2026-05-18.md` | 本文第 3 节；`docs/workspace/index.md` 当前总控入口 | 本文第 5.2 节 | 已通过，见验收总结 | 已提交 `70eaf130d96f5e61a53dfbdb19c24ff13eb80410`；runtime 快照提交 `09d4ac611408098d6ec3e88d1899d802510aadb5`；总控复核通过。 |
| `AlembicAgent` | 已完成 | 已复核并记录本仓库采用 `@alembic/core: file:../AlembicCore` 和本地 Core scanner；已更新本仓库 `AGENTS.md` 的 Core 接入规则，明确自己是 local-source-first 基线；Agent build/boundary/smoke 已通过。 | 已新建 | `docs/AlembicAgent/alembic-agent-local-source-import-baseline-2026-05-18.md` | 本文第 3 节；`docs/workspace/index.md` 当前总控入口 | 本文第 5.3 节 | 已通过，见验收总结 | 已提交 `0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf`；总控复核通过。 |
| `AlembicCore` | 观察中 | 不改代码；等待三仓库消费反馈。 | 无需新建 | 无 | 本文第 3 节 | 本文第 5.4 节 | 暂不运行 | 只有发现缺 public facade 才派发。 |
| `AlembicDashboard` | 观察中 | 不改代码；等待 Alembic / Plugin 对本地 Dashboard build 入口的消费反馈。 | 无需新建 | 无 | 本文第 3 节 | 本文第 5.5 节 | 暂不运行 | 只有发现 Dashboard build contract 缺口才派发。 |
| `BiliDili` | 无任务 | 默认不进入 Alembic 日常开发流程；当前不是 iOS/Swift 真实项目测试。 | 无需新建 | 无 | 本文第 3 节 | 本文第 5.6 节 | 暂不运行 | 不发送提示词。 |

## 4. 执行边界

### 4.1 Alembic

- 可改：`package.json`、lockfile、`scripts/*` 中 Core / Dashboard 路径解析、`AGENTS.md` 的接入规则、必要的 config 或 smoke 脚本。
- 不可改：`AlembicCore`、`AlembicAgent`、`AlembicDashboard` 源码；不得恢复本地 duplicate Agent implementation。
- 需要证明：本地开发不再依赖 `vendor/AlembicCore` 作为默认入口；Agent public subpaths 仍从 `../AlembicAgent` 消费；Dashboard build 优先使用 `../AlembicDashboard` 或清楚说明未改原因。

### 4.2 AlembicPlugin

- 可改：`package.json`、lockfile、`scripts/*` 中 Core / Dashboard 路径解析、Codex runtime packaging 的 Core snapshot source resolver、`AGENTS.md` 的接入规则。
- 不可改：不得引入 `@alembic/agent`；不得恢复 internal agent / AI provider / tool router；不得修改 Dashboard 源码。
- 需要证明：根仓库开发不再默认依赖 `vendor/AlembicCore`；embedded runtime 仍是 portable，runtime 内 `@alembic/core` 仍解析到 `file:vendor/AlembicCore`；runtime vendor 快照来源记录为本地 Core commit。

### 4.3 AlembicAgent

- 可改：`AGENTS.md`、必要的验证脚本或专项执行文档。
- 不可改：不要改 Core 或外层仓库；不要把 Core 源码路径绕过 `@alembic/core` package 入口。
- 需要证明：本仓库是 `@alembic/core: file:../AlembicCore` 的 local-source-first 基线，Core boundary scanner 仍通过。

## 5. 回填区

### 5.1 Alembic 回填

状态：已完成。

执行记录：`docs/Alembic/alembic-local-source-import-unification-2026-05-18.md`

提交：`9461232072ae77a9b272554fcb61246ff9d1d856`（`chore: use local source imports for main repo`）

本地源码来源：

- `../AlembicCore @ b904b66907e16e61f29a6dc0eeedc59231ddfb53`
- `../AlembicAgent @ 1af571674d3eb123e5aad695cb9a02fc69ce37d6`
- `../AlembicDashboard @ 7143a7ca610a504b7472ae4afac0eb2df2ebdda8`

完成范围：

- 已将 Alembic 根依赖 `@alembic/core` 从 `file:vendor/AlembicCore` 切到 `file:../AlembicCore`，并同步 lockfile 与本地安装解析；`@alembic/agent` 保持 `file:../AlembicAgent`。
- 已新增 `scripts/workspace-source.mjs`，默认优先解析 workspace 相邻源码，保留 vendor 作为 workspace 外 fallback / release snapshot 入口。
- 已新增 `scripts/core-source-command.mjs`，让 `build:core`、`lint:core-import-boundary`、`lint:consumer-core-imports` 使用本地 Core 构建和 consumer boundary scanner。
- 已让 `scripts/build-dashboard.mjs` 优先使用 `../AlembicDashboard`，仅在本地源码不存在时 fallback 到 `vendor/AlembicDashboard`。
- 已更新 `AGENTS.md` 中过时的 vendor-only 规则。
- 已修正本地 Core symlink 暴露出的包实例边界问题：Alembic audit adapter 不再混用外层 Drizzle helper 与 Core Drizzle schema，改为 raw SQLite 访问 Core 拥有的 `audit_logs` 表；MCP input schema 补显式 `z.ZodType` 输出类型，避免声明引用 `@alembic/core/node_modules/zod`。
- 未修改 `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 源码。

验证命令与结果：

| 命令 | 结果 |
| --- | --- |
| `npm install` | 通过；`node_modules/@alembic/core` 更新为指向 `../AlembicCore`。`husky prepare` 因 `.git/config` lock 权限打印 warning，但安装完成。 |
| `npm run build:check` | 通过；日志显示 `Using local AlembicCore source: ../AlembicCore`。 |
| `npm run lint:agent-extraction-boundary` | 通过；local Agent relative imports 0，local service/runtime/prompts/domain consumers 0。 |
| `npm run lint:core-import-boundary` | 通过；日志显示使用 `../AlembicCore`，扫描 453 files / 598 Core imports，issue 0。 |
| `npm run check` | 通过；Biome 仍打印既有 warning/info，但 exit code 为 0。 |
| `npm run build` | 通过；日志显示 `build:core` 使用本地 Core。 |
| `npm run build:dashboard` | 通过；Dashboard build 使用 `../AlembicDashboard`；Vite chunk-size warning 非阻断。 |
| `node -e "import('@alembic/agent').then(...)"` | 通过；Agent public import loaded，`exportCount: 160`。 |
| local Core / Dashboard resolution proof | 通过；`coreLink: ../../../AlembicCore`，lockfile `node_modules/@alembic/core.resolved: ../AlembicCore`，Dashboard local source exists。 |
| `npm run test -- test/unit/AuditLogger.test.ts test/unit/Gateway.test.ts` | 通过；2 files / 27 tests passed。 |
| `rg -n "file:vendor/AlembicCore\|vendor/AlembicCore/scripts\|vendor/AlembicDashboard" package.json package-lock.json scripts AGENTS.md` | 通过；仅剩 `scripts/build-dashboard.mjs` 中允许的 Dashboard vendor fallback 文案 / fallback 路径，无 `file:vendor/AlembicCore` 或 vendor Core scanner 残留。 |
| `git diff --check` | 通过。 |

残留扫描结果：

- `file:vendor/AlembicCore`：0 命中。
- `vendor/AlembicCore/scripts`：0 命中。
- `vendor/AlembicDashboard`：仅剩 `scripts/build-dashboard.mjs` 的允许 fallback 路径和错误提示。
- `../AlembicCore`：命中 package dependency、lockfile、resolver 和 AGENTS 规则，符合本轮目标。
- `../AlembicDashboard`：命中 Dashboard resolver 和错误提示，符合本轮目标。

遗留风险：

- `npm run check` 仍输出既有 Biome warning/info，本轮未处理非 local-source 引入口径相关的历史风格问题。
- 本地 `file:../AlembicCore` 以 symlink 形式安装；如果外层继续直接组合 Core 内部 ORM schema 与外层 ORM helper，仍可能遇到重复包实例类型问题。本轮已在 Alembic audit adapter 和 MCP schema 声明处收口。
- `npm run build:dashboard` 的 Vite chunk-size warning 为既有非阻断产物体积提示；本轮不处理 Dashboard 分包优化。
- vendor fallback 仍刻意保留给 workspace 外独立运行、release snapshot 和便携交付校验，不应被视为默认开发入口。

下一步建议：总控复核 `Alembic`、`AlembicAgent`、`AlembicPlugin` 三个窗口的 local-source-first 口径；release / portable snapshot 指针收口另建阶段记录。

### 5.2 AlembicPlugin 回填

状态：已完成。

执行记录：`docs/AlembicPlugin/alembic-plugin-local-source-import-unification-2026-05-18.md`

提交：

- AlembicPlugin 外层：`70eaf130d96f5e61a53dfbdb19c24ff13eb80410`（`chore: use local source imports for plugin development`）
- `plugins/alembic-codex` runtime 快照：`09d4ac611408098d6ec3e88d1899d802510aadb5`（`build: refresh runtime from local core source`）
- runtime embedded Core 来源：`b904b66907e16e61f29a6dc0eeedc59231ddfb53`

完成范围：

- 已将根仓库本地开发依赖改为 `@alembic/core: file:../AlembicCore`，并同步 `package-lock.json` 与本地安装解析。
- 已新增统一 local source resolver：默认解析 `../AlembicCore` / `../AlembicDashboard`，保留 vendor 作为 workspace 外 fallback。
- 已让 `build:core` 与 Core boundary lint 使用本地 Core 源仓库。
- 已让 Dashboard build/watch 优先使用 `../AlembicDashboard`，watch 同步使用本地 Core grammar source。
- 已让 Codex plugin runtime 从本地 Core 生成 portable `runtime/vendor/AlembicCore` 快照；runtime 内 `@alembic/core` 仍保持 `file:vendor/AlembicCore`。
- 已写入 runtime 快照来源元数据 `.alembic-source.json`，记录 `../AlembicCore` 与源 commit。
- 已更新 `AGENTS.md` 中过时的 vendor-only 规则。
- 已保持 `@alembic/agent` 0 依赖，未恢复 internal agent / AI provider / tool router。

验证命令与结果：

| 命令 | 结果 |
| --- | --- |
| `node scripts/resolve-local-sources.mjs` | 通过；Core 为 `../AlembicCore`，Dashboard 为 `../AlembicDashboard`，runtime dependency 为 `file:vendor/AlembicCore`。 |
| `node -e "const fs=require('fs'); console.log(fs.readlinkSync('node_modules/@alembic/core'));"` | 通过；`node_modules/@alembic/core` 解析到 workspace 相邻 Core。 |
| `npm run lint:core-import-boundary` | 通过；本地 Core scanner 扫描 319 files / 517 Core imports。 |
| `rg -n "@alembic/agent" lib bin config scripts plugins test --glob "*.ts" --glob "*.js" --glob "*.mjs" --glob "*.json"` | 通过；0 命中。 |
| `npm run build:check` | 通过；Core build 使用 `../AlembicCore @ b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| `npm run check` | 通过；Biome 仍输出既有 warning/info，但 exit code 为 0。 |
| `npm run build` | 通过。 |
| `npm run build:dashboard` | 通过；Dashboard build 使用 `../AlembicDashboard @ 7143a7ca610a504b7472ae4afac0eb2df2ebdda8`；Vite chunk-size warning 非阻断。 |
| `npm run prepare:codex-plugin-runtime` | 通过；刷新 runtime 与 `runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过。 |
| runtime snapshot source proof | 通过；runtime package dependency 为 `file:vendor/AlembicCore`，embedded source 为 `../AlembicCore @ b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| `npm run smoke:codex-plugin` | 通过；install、stdio、npxRuntime 通过；recovery / daemon smoke 按脚本条件跳过。 |
| `npm run verify:codex-channel` | 通过。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

遗留风险：

- workspace 根目录不是 git 仓库，总控文档回填没有单独 workspace 文档提交；代码与 runtime 快照已在 AlembicPlugin 相关仓库提交。
- `npm run check` 中 Biome warning/info 为既有非阻断输出，本轮不处理格式 / 风格范围外问题。
- portable runtime 快照后续 release 阶段仍需继续确认 embedded Core 来源 commit 与 tarball 内容。
- Alembic / AlembicPlugin / AlembicAgent 均已完成，本轮无需继续派发。

下一步建议：release snapshot 指针收口另建阶段记录。

### 5.3 AlembicAgent 回填

状态：已完成。

执行记录：`docs/AlembicAgent/alembic-agent-local-source-import-baseline-2026-05-18.md`

提交：`0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf`（`Document local core source baseline`）

完成范围：

- 已复核 `package.json` 与 `package-lock.json`：`@alembic/core` 使用 `file:../AlembicCore`。
- 已复核本地安装解析：`node_modules/@alembic/core` 解析到 workspace 相邻的 `../AlembicCore`。
- 已复核 `lint:core-import-boundary`：调用 `../AlembicCore/scripts/lint-consumer-core-imports.mjs`。
- 已更新 `AGENTS.md` 的 Core 接入规则，明确 AlembicAgent 是 local-source-first 基线；vendor、submodule、远程 npm 包或 portable snapshot 只作为 release / 离线 / portable 场景例外，不是日常开发入口。
- 未修改其它 Alembic 仓库。

验证命令与结果：

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过。 |
| `npm run lint:public-api-boundary` | 通过；15 exact exports，无 wildcard exports。 |
| `npm run lint:core-import-boundary` | 通过；214 files / 48 Core imports。 |
| `npm run smoke:public-imports` | 通过；15 public subpaths imported。 |
| `npm run check` | 通过；9 test files / 37 tests；Biome 仍输出 23 条既有 warning，未阻断。 |
| `git diff --check` | 通过。 |
| local Core resolution proof | `dependency: file:../AlembicCore`；`coreBoundary: node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary.json`；`coreRealpath: ../AlembicCore`。 |

遗留风险：

- AlembicAgent 基线已完成；`Alembic` 与 `AlembicPlugin` 也已完成本地 Core / Dashboard 引入口径调整。
- `npm run lint` 仍输出既有 Biome warning，但完整 `npm run check` 通过；本轮不处理非 local-source 引入范围的问题。

下一步建议：后续 release snapshot 指针收口应另建阶段记录。

### 5.4 AlembicCore 回填

观察中，当前无实际任务。

### 5.5 AlembicDashboard 回填

观察中，当前无实际任务。

### 5.6 BiliDili 回填

无任务；默认不进入本轮 Alembic 日常开发流程。

## 6. 当前可复制分派提示词

```text
读取 docs/workspace/alembic-local-source-import-unification-workspace-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

本提示词当前不再发送给任何窗口；本轮三个执行窗口均已完成并通过总控复核。

本提示词已发送并由以下窗口执行完成，当前不再重复发送给：

- `Alembic`
- `AlembicAgent`
- `AlembicPlugin`

本轮不发送给：

- `AlembicCore`：观察中，等待消费反馈。
- `AlembicDashboard`：观察中，等待消费反馈。
- `BiliDili`：无任务，默认不进入日常 Alembic 开发流程。

## 7. 下一步总控动作

1. 本轮结束。
2. 后续可恢复接口边界后续迁移，或单独开启 release / portable snapshot 指针收口阶段。
