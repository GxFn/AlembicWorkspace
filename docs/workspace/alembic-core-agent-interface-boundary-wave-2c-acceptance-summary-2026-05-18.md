# Alembic Core / Agent Interface Boundary Wave 2C Acceptance Summary

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成

本文验收 `docs/workspace/alembic-core-agent-interface-boundary-wave-2c-optimized-plan-2026-05-18.md`。

## 1. 验收结论

结论：通过。

优化后的 Wave 2C 不再重复派发本地源码引入任务，不做例行 vendor / 远程指针同步；本轮只验收外层仓库对 Core / Agent interface boundary 的消费证据。

通过点：

- `Alembic` 已通过 `../AlembicCore` 和 `../AlembicAgent` 消费 Core / Agent public surface。
- `Alembic` Core consumer boundary 与 Agent extraction boundary 均通过。
- `AlembicPlugin` 已通过 `../AlembicCore` 消费 Core public surface，并保持 `@alembic/agent` 0 依赖。
- `AlembicPlugin` portable runtime 保留 `file:vendor/AlembicCore` 作为交付例外，并记录本地 Core 来源 commit。
- `AlembicAgent` Core imports 保持 stable public，public API boundary 仍为 15 exact exports，无 wildcard。

## 2. 提交与窗口状态

| 窗口 | 状态 | 证据 |
| --- | --- | --- |
| `Alembic` | 已完成 | 提交 `9461232072ae77a9b272554fcb61246ff9d1d856`；执行记录 `docs/Alembic/alembic-local-source-import-unification-2026-05-18.md`。 |
| `AlembicPlugin` | 已完成 | 提交 `70eaf130d96f5e61a53dfbdb19c24ff13eb80410`；runtime 快照提交 `09d4ac611408098d6ec3e88d1899d802510aadb5`；执行记录 `docs/AlembicPlugin/alembic-plugin-local-source-import-unification-2026-05-18.md`。 |
| `AlembicAgent` | 已完成 | 提交 `0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf`；Core facade consumption 提交 `1af571674d3eb123e5aad695cb9a02fc69ce37d6`；执行记录 `docs/AlembicAgent/alembic-agent-local-source-import-baseline-2026-05-18.md`。 |
| `AlembicCore` | 观察中 | 无新任务；Wave 2A 来源提交 `b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| `AlembicDashboard` | 观察中 | 无新任务；本轮只验证外层 build 使用 `../AlembicDashboard`。 |
| `BiliDili` | 无任务 | 默认不进入 Alembic 日常开发流程；本轮不是真实 iOS/Swift 项目测试。 |

## 3. 总控复核命令

| 仓库 | 命令 | 结果 |
| --- | --- | --- |
| `Alembic` | `npm run lint:core-import-boundary` | 通过；使用 local `../AlembicCore` scanner，453 files / 598 Core imports。 |
| `Alembic` | `npm run lint:agent-extraction-boundary` | 通过；local Agent relative imports 0，local service/runtime/prompts/domain consumers 0，duplicate generic Tool V2 files 0。 |
| `Alembic` | local dependency proof | 通过；`@alembic/core: file:../AlembicCore` realpath `../AlembicCore`；`@alembic/agent: file:../AlembicAgent` realpath `../AlembicAgent`。 |
| `Alembic` | stale vendor entry scan | 通过；无 `file:vendor/AlembicCore` 或 `vendor/AlembicCore/scripts`，仅剩允许的 Dashboard vendor fallback。 |
| `AlembicPlugin` | `npm run lint:core-import-boundary` | 通过；319 files / 517 Core imports。 |
| `AlembicPlugin` | `npm run verify:codex-plugin` | 通过；`runtime.tgz -> alembic-ai@0.1.2`。 |
| `AlembicPlugin` | `rg -n '@alembic/agent' ...` | 通过；0 命中，`rg` exit code 1 表示未找到。 |
| `AlembicPlugin` | runtime source metadata | 通过；`.alembic-source.json` 记录 `source: ../AlembicCore`、commit `b904b66907e16e61f29a6dc0eeedc59231ddfb53`、runtime dependency `file:vendor/AlembicCore`。 |
| `AlembicPlugin` | `node scripts/resolve-local-sources.mjs` | 通过；Core `../AlembicCore @ b904b66907e16e61f29a6dc0eeedc59231ddfb53`，Dashboard `../AlembicDashboard @ 7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。 |
| `AlembicAgent` | `npm run lint:core-import-boundary` | 通过；214 files / 48 Core imports。 |
| `AlembicAgent` | `npm run lint:public-api-boundary` | 通过；15 exact exports，无 wildcard exports。 |
| `AlembicAgent` | local dependency proof | 通过；`@alembic/core: file:../AlembicCore`，Core scanner 指向 `../AlembicCore/scripts/lint-consumer-core-imports.mjs`。 |
| `AlembicAgent` | `npm run smoke:public-imports` | 通过；build 后 15 public subpaths imported。 |

验收后工作区状态：

- `Alembic`：clean。
- `AlembicPlugin`：clean。
- `AlembicAgent`：clean。
- `AlembicPlugin/plugins/alembic-codex`：clean。

## 4. 结论与下一步

Wave 2C 已完成。

当前不发送提示词给任何窗口；继续发送会造成空转。

后续只剩两类可选方向，需另开文档：

1. 接口边界后续阶段：继续收敛 Core consumer allowlist、稳定 public facade、外层 adapter 边界。
2. release / portable snapshot 指针收口：确认 vendor/submodule/remote pointer、npm package、runtime tarball、远程 CI / 离线安装行为。
