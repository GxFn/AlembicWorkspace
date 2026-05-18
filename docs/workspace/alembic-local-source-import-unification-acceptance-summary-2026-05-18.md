# Alembic Local Source Import Unification Acceptance Summary

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成

本文验收 `docs/workspace/alembic-local-source-import-unification-workspace-plan-2026-05-18.md`，并挂载统一契约 `docs/workspace/alembic-local-source-resolver-script-contract-2026-05-18.md`。

## 1. 验收结论

结论：通过。

`Alembic`、`AlembicPlugin`、`AlembicAgent` 已完成本地源码引入口径统一：

- 日常开发 / 总控验收使用 workspace 本地 `../AlembicCore`。
- `Alembic` 继续使用 `../AlembicAgent`。
- `Alembic` / `AlembicPlugin` 的 Dashboard build 优先使用 `../AlembicDashboard`。
- `AlembicPlugin` 的 Codex plugin runtime 仍保留 portable `runtime/vendor/AlembicCore`，但快照来源记录为本地 Core commit。
- `BiliDili` 已明确默认不进入 Alembic 日常开发流程。

## 2. 提交与执行记录

| 窗口 | 结果 | 提交 / 记录 |
| --- | --- | --- |
| `Alembic` | 通过 | 提交 `9461232072ae77a9b272554fcb61246ff9d1d856`；执行记录 `docs/Alembic/alembic-local-source-import-unification-2026-05-18.md`。 |
| `AlembicPlugin` | 通过 | 提交 `70eaf130d96f5e61a53dfbdb19c24ff13eb80410`；plugin runtime 快照提交 `09d4ac611408098d6ec3e88d1899d802510aadb5`；执行记录 `docs/AlembicPlugin/alembic-plugin-local-source-import-unification-2026-05-18.md`。 |
| `AlembicAgent` | 通过 | 提交 `0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf`；执行记录 `docs/AlembicAgent/alembic-agent-local-source-import-baseline-2026-05-18.md`。 |
| `AlembicCore` | 观察通过 | 本轮不改代码；被消费来源 `b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| `AlembicDashboard` | 观察通过 | 本轮不改代码；被消费来源 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。 |
| `BiliDili` | 无任务 | 默认不进入本轮 Alembic 日常开发流程。 |

## 3. 总控复核命令

| 命令 | 结果 |
| --- | --- |
| `npm run lint:core-import-boundary` in `Alembic` | 通过；日志显示 `Using local AlembicCore source: ../AlembicCore`；453 files / 598 Core imports。 |
| `npm run lint:core-import-boundary` in `AlembicPlugin` | 通过；319 files / 517 Core imports。 |
| `npm run lint:core-import-boundary` in `AlembicAgent` | 通过；214 files / 48 Core imports。 |
| local dependency proof in `Alembic` | 通过；`@alembic/core` 为 `file:../AlembicCore`，realpath `../AlembicCore`；`@alembic/agent` 为 `file:../AlembicAgent`，realpath `../AlembicAgent`。 |
| `node scripts/resolve-local-sources.mjs` in `AlembicPlugin` | 通过；Core `../AlembicCore @ b904b66907e16e61f29a6dc0eeedc59231ddfb53`，Dashboard `../AlembicDashboard @ 7143a7ca610a504b7472ae4afac0eb2df2ebdda8`，runtime dependency `file:vendor/AlembicCore`。 |
| local dependency proof in `AlembicAgent` | 通过；`@alembic/core` 为 `file:../AlembicCore`，Core boundary script 指向 `../AlembicCore/scripts/lint-consumer-core-imports.mjs`。 |
| `rg -n '@alembic/agent' ...` in `AlembicPlugin` | 通过；0 命中，`rg` exit code 1 表示未找到。 |
| `cat plugins/alembic-codex/runtime/vendor/AlembicCore/.alembic-source.json` in `AlembicPlugin` | 通过；记录 `source: ../AlembicCore`、commit `b904b66907e16e61f29a6dc0eeedc59231ddfb53`、runtime dependency `file:vendor/AlembicCore`。 |
| `npm run verify:codex-plugin` in `AlembicPlugin` | 通过；`runtime.tgz -> alembic-ai@0.1.2`。 |
| `rg -n 'file:vendor/AlembicCore\|vendor/AlembicCore/scripts\|vendor/AlembicDashboard' package.json package-lock.json scripts AGENTS.md` in `Alembic` | 通过；仅剩 `scripts/build-dashboard.mjs` 的允许 Dashboard vendor fallback。 |

三仓库工作区在验收前均为 clean；Plugin runtime 子仓库 `plugins/alembic-codex` 也为 clean。

## 4. 契约落地判断

| 契约点 | 结果 |
| --- | --- |
| 脚本入口保留在各仓库 | 通过。没有把 workspace 根目录变成产品源码或统一脚本运行时。 |
| 本地开发优先 workspace sibling | 通过。三仓库 Core 入口均已使用或验证 `../AlembicCore`。 |
| Dashboard 本地优先 | 通过。Alembic / Plugin build 脚本均优先 `../AlembicDashboard`。 |
| vendor 不作为日常阻塞 | 通过。Alembic 和 Plugin 根仓库默认不再依赖 `file:vendor/AlembicCore`。 |
| portable runtime 例外 | 通过。Plugin runtime 内保留 `file:vendor/AlembicCore`，并记录本地 Core 源 commit。 |
| Plugin agent-free | 通过。`@alembic/agent` 扫描 0 命中。 |
| BiliDili 不进入日常流程 | 通过。workspace 与 BiliDili AGENTS 均已写明默认不派发。 |

## 5. 遗留风险

- 各仓库仍保留 repo-local resolver 脚本，名称和实现不完全相同；当前契约允许这种状态。若后续出现第三个以上同构扩展需求，再评估抽共享 dev tooling。
- `Alembic` / `AlembicPlugin` 执行记录中均提到 Biome 既有 warning/info，本轮不处理非引入口径问题。
- release / remote CI / portable snapshot 指针收口尚未启动；后续应另建阶段文档，不混入日常 local-source 开发流程。

## 6. 当前分派状态

当前无需要继续发送的执行提示词。

- `Alembic`：已完成。
- `AlembicPlugin`：已完成。
- `AlembicAgent`：已完成。
- `AlembicCore`：观察中，无任务。
- `AlembicDashboard`：观察中，无任务。
- `BiliDili`：无任务。

## 7. 下一步

本轮可以结束。后续若要继续推进，可二选一：

1. 回到接口边界迁移后续阶段。
2. 单独开启 release / portable snapshot 指针收口阶段。
