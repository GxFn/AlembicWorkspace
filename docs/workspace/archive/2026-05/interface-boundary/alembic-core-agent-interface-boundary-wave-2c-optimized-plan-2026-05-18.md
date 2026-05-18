# Alembic Core / Agent Interface Boundary Wave 2C Optimized Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成

本文接续 `docs/workspace/alembic-core-agent-interface-boundary-wave-2b-acceptance-wave-2c-plan-2026-05-18.md`，在 `docs/workspace/alembic-local-source-import-unification-acceptance-summary-2026-05-18.md` 已完成后，重新优化 Wave 2C 的边界、任务和验收口径。

验收总结：`docs/workspace/alembic-core-agent-interface-boundary-wave-2c-acceptance-summary-2026-05-18.md`

## 1. 优化原因

旧 Wave 2C 曾经有两个混在一起的目标：

- 外层仓库消费 `AlembicCore` / `AlembicAgent` 新接口。
- 本地开发依赖从 vendor / 远程指针切到 workspace 本地源码。

第二件事已经由本地源码引入统一阶段完成：

- `Alembic` 提交 `9461232072ae77a9b272554fcb61246ff9d1d856`。
- `AlembicPlugin` 提交 `70eaf130d96f5e61a53dfbdb19c24ff13eb80410`。
- `AlembicPlugin` runtime 快照提交 `09d4ac611408098d6ec3e88d1899d802510aadb5`。
- `AlembicAgent` 提交 `0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf`。
- 统一契约已写入 `docs/workspace/alembic-local-source-resolver-script-contract.md`。

因此优化后的 Wave 2C 不再派发“切本地源码入口”任务，也不做例行 vendor 指针同步。它只聚焦 Core / Agent interface boundary 的外层消费验收。

## 2. 优化后的 Wave 2C 范围

纳入 Wave 2C：

- `Alembic` 是否通过 `../AlembicCore` 与 `../AlembicAgent` 消费 Core / Agent public surface。
- `Alembic` 的 Core consumer boundary、Agent extraction boundary、representative build/check/smoke 是否仍通过。
- `AlembicPlugin` 是否通过 `../AlembicCore` 消费 Core public surface。
- `AlembicPlugin` 是否保持 `@alembic/agent` 0 依赖。
- `AlembicPlugin` portable runtime 是否把 Core snapshot 作为交付例外，并记录来源 commit。
- `AlembicAgent` 是否保持 Core imports 全 stable public，并作为 `file:../AlembicCore` 基线。

不纳入 Wave 2C：

- release / remote CI / npm package / vendor pointer 收口。
- 远程指针确认。
- 新增 Core public facade。
- Dashboard 源码修改。
- BiliDili 真实 iOS/Swift 项目验证。

release / portable snapshot 指针收口如有需要，应另开文档，不混入本轮。

## 3. 当前窗口判断

| 窗口 | 状态 | 判断 | 是否发送提示词 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 本地 Core / Agent / Dashboard 引入口径已完成；总控已按 Wave 2C 口径复核其 execution record 与代表性 gates。 | 不发送。 |
| `AlembicPlugin` | 已完成 | 本地 Core / Dashboard 引入口径已完成；Plugin runtime portable Core snapshot 例外已记录；总控已复核 agent-free 与 runtime verify。 | 不发送。 |
| `AlembicAgent` | 已完成 | Core stable public imports 与 local-source baseline 已完成；已纳入 Wave 2C 结论。 | 不发送。 |
| `AlembicCore` | 观察中 | Wave 2A 已完成；除非外层验收发现缺 facade，否则不派发。 | 不发送。 |
| `AlembicDashboard` | 观察中 | 本轮只验证外层 build 使用 `../AlembicDashboard`，不改 Dashboard 源码。 | 不发送。 |
| `BiliDili` | 无任务 | 默认不进入 Alembic 日常开发流程；当前不是真实项目测试。 | 不发送。 |

## 4. 总控验收清单

总控下一步直接验收，不再给执行窗口发提示词。

### 4.1 Alembic

验收来源：

- `docs/Alembic/alembic-local-source-import-unification-2026-05-18.md`
- 提交 `9461232072ae77a9b272554fcb61246ff9d1d856`

复核重点：

- `@alembic/core` 解析到 `file:../AlembicCore`。
- `@alembic/agent` 解析到 `file:../AlembicAgent`。
- `npm run lint:core-import-boundary` 使用本地 Core scanner 且 issue 0。
- `npm run lint:agent-extraction-boundary` 仍阻断 local duplicate Agent import。
- Agent public import smoke 仍可加载。
- `file:vendor/AlembicCore` 与 `vendor/AlembicCore/scripts` 不再作为默认本地入口。

### 4.2 AlembicPlugin

验收来源：

- `docs/AlembicPlugin/alembic-plugin-local-source-import-unification-2026-05-18.md`
- 提交 `70eaf130d96f5e61a53dfbdb19c24ff13eb80410`
- runtime 快照提交 `09d4ac611408098d6ec3e88d1899d802510aadb5`

复核重点：

- `@alembic/core` 解析到 `file:../AlembicCore`。
- `npm run lint:core-import-boundary` 使用本地 Core scanner 且 issue 0。
- `@alembic/agent` 扫描 0 命中。
- `plugins/alembic-codex/runtime/vendor/AlembicCore/.alembic-source.json` 记录 `../AlembicCore @ b904b66907e16e61f29a6dc0eeedc59231ddfb53`。
- runtime 内 `@alembic/core: file:vendor/AlembicCore` 只作为 portable runtime 例外。
- `npm run verify:codex-plugin` 通过。

### 4.3 AlembicAgent

验收来源：

- `docs/AlembicAgent/alembic-agent-local-source-import-baseline-2026-05-18.md`
- `docs/AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md`
- 提交 `0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf`
- 提交 `1af571674d3eb123e5aad695cb9a02fc69ce37d6`

复核重点：

- `@alembic/core` 解析到 `file:../AlembicCore`。
- Core imports 全部为 stable public，allowlist 为空。
- 15 个 public subpaths 仍保持 exact exports，无 wildcard。
- `npm run lint:core-import-boundary` 与 `npm run smoke:public-imports` 通过。

## 5. 验收命令建议

总控可以复用已经跑过的命令，不必让窗口重复执行。若需要重新复核，按以下最小组合：

| 仓库 | 命令 |
| --- | --- |
| `Alembic` | `npm run lint:core-import-boundary`; `npm run lint:agent-extraction-boundary`; local dependency proof; stale vendor entry scan。 |
| `AlembicPlugin` | `npm run lint:core-import-boundary`; `npm run verify:codex-plugin`; `rg -n '@alembic/agent' ...`; runtime `.alembic-source.json` check。 |
| `AlembicAgent` | `npm run lint:core-import-boundary`; `npm run lint:public-api-boundary`; `npm run smoke:public-imports`; local dependency proof。 |

这些证据已齐全，Wave 2C 已进入“已完成”总结。

## 6. 当前可复制分派提示词

当前不发送提示词。

原因：本轮执行窗口已经完成；优化后的 Wave 2C 是总控验收任务，不是新的代码实现任务。给窗口重复发送会空转。

## 7. 后续分叉

Wave 2C 验收通过后，下一步有两个方向，不能混在一起：

1. 接口边界迁移后续阶段：继续消化 Core consumer allowlist、稳定 public facade、外层 adapter 边界。
2. release / portable snapshot 指针收口：确认 vendor/submodule/remote pointer、npm package、runtime tarball、远程 CI / 离线安装行为。

总控应根据用户下一步目标另开文档。
