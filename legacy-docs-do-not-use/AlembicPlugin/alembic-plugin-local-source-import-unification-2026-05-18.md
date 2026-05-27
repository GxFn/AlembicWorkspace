# AlembicPlugin Local Source Import Unification

日期：2026-05-18
窗口：AlembicPlugin
状态：已完成

来源总控文档：`docs/workspace/alembic-local-source-import-unification-workspace-plan-2026-05-18.md`

## 完成范围

- 已将根仓库本地开发依赖改为 `@alembic/core: file:../AlembicCore`，`package-lock.json` 与本地安装解析同步到 workspace 相邻 Core。
- 新增 `scripts/local-source-paths.mjs`，统一解析 `../AlembicCore` / `../AlembicDashboard`，并保留 `vendor/AlembicCore` / `vendor/AlembicDashboard` 作为 workspace 外 fallback。
- 新增 `scripts/build-core.mjs` 与 `scripts/lint-consumer-core-imports.mjs`，让 `build:core` 和 Core boundary lint 默认使用本地 Core 源仓库。
- 已调整 Dashboard build/watch：`scripts/build-dashboard.mjs` 与 `scripts/dev-watch-codex-plugin.mjs` 优先使用 `../AlembicDashboard`，并在 watch 中使用本地 Core grammar source。
- 已调整 `scripts/prepare-codex-plugin-runtime.mjs`：Codex plugin runtime 从本地 Core 生成 portable `runtime/vendor/AlembicCore` 快照，runtime package 内 `@alembic/core` 仍保持 `file:vendor/AlembicCore`。
- 已在 runtime 快照写入 `runtime/vendor/AlembicCore/.alembic-source.json`，记录来源 `../AlembicCore`、Core commit 与 runtime 内依赖口径。
- 已更新 `AGENTS.md`，把 AlembicPlugin 的 Core / Dashboard 入口规则改为 local-source-first，vendor 只作为 fallback 或 portable runtime snapshot。
- 已保持 `@alembic/agent` 0 依赖；未恢复 internal agent、AI provider 或 tool router。
- 已通过 `tsconfig.json` 的 symlink / package dependency identity 适配，解决本地 Core symlink 下 Drizzle / Zod 类型身份分裂问题。

## 提交 Hash

| 范围 | 提交 |
| --- | --- |
| AlembicPlugin 外层 | `70eaf130d96f5e61a53dfbdb19c24ff13eb80410` |
| `plugins/alembic-codex` runtime 快照 | `09d4ac611408098d6ec3e88d1899d802510aadb5` |
| runtime embedded Core 来源 | `b904b66907e16e61f29a6dc0eeedc59231ddfb53` |
| runtime embedded Dashboard 消费来源 | `7143a7ca610a504b7472ae4afac0eb2df2ebdda8` |

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `node scripts/resolve-local-sources.mjs` | 通过；Core 解析为 `../AlembicCore`，Dashboard 解析为 `../AlembicDashboard`，runtime dependency 保持 `file:vendor/AlembicCore`。 |
| `node -e "const fs=require('fs'); console.log(fs.readlinkSync('node_modules/@alembic/core'));"` | 通过；`node_modules/@alembic/core` 解析到 workspace 相邻 Core。 |
| `npm run lint:core-import-boundary` | 通过；wrapper 调用本地 Core scanner，扫描 319 files / 517 Core imports。 |
| `rg -n "@alembic/agent" lib bin config scripts plugins test --glob "*.ts" --glob "*.js" --glob "*.mjs" --glob "*.json"` | 通过；0 命中。 |
| `npm run build:check` | 通过；Core build 使用 `../AlembicCore @ b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| `npm run check` | 通过；Biome 仍有既有 warning/info 输出但 exit code 为 0，未阻断。 |
| `npm run build` | 通过；含本地 Core build 与 postbuild。 |
| `npm run build:dashboard` | 通过；Dashboard build 使用 `../AlembicDashboard @ 7143a7ca610a504b7472ae4afac0eb2df2ebdda8`；Vite chunk-size warning 为既有非阻断提醒。 |
| `npm run prepare:codex-plugin-runtime` | 通过；刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过；`runtime.tgz` 验证通过。 |
| runtime snapshot source proof | 通过；`runtime/package.json` 内 `@alembic/core` 为 `file:vendor/AlembicCore`，`.alembic-source.json` 记录来源 `../AlembicCore @ b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| `npm run smoke:codex-plugin` | 通过；install、stdio、npxRuntime 通过；recovery 与 daemon smoke 按脚本条件跳过。 |
| `npm run verify:codex-channel` | 通过；Codex channel verification passed。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

## 残留扫描结果

- `@alembic/agent`：生产 / 脚本 / runtime / 测试扫描 0 命中。
- `runtime/vendor/AlembicCore/.alembic-source.json`：已进入 runtime 快照与 `runtime.tgz`。
- 根仓库默认 Core dependency：`file:../AlembicCore`。
- portable runtime Core dependency：`file:vendor/AlembicCore`。

## 遗留风险

- workspace 根目录不是 git 仓库，本执行记录和总控索引回填没有单独 workspace 文档提交；代码与 runtime 快照已在 AlembicPlugin 相关仓库提交。
- `npm run check` 中 Biome 的 warning/info 是既有非阻断输出，本轮未处理格式或风格范围外问题。
- runtime 快照仍是 portable 交付物，需要后续 release / snapshot 阶段继续确认 embedded Core 来源 commit 与 tarball 内容。
- AlembicPlugin 已完成本轮 local-source-first 改造；总控仍需等待 `Alembic` 窗口完成同一口径后统一复核。

## 下一步建议

- 总控等待 `Alembic` 窗口完成本地 Core / Agent / Dashboard 引入口径调整。
- 三个执行窗口完成后，再统一复核 local-source-first、portable runtime snapshot 和 release snapshot 指针是否需要进入下一阶段。
