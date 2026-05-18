# Alembic Core / Agent Interface Boundary Wave 2B Acceptance And Wave 2C Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已优化；由 `docs/workspace/alembic-core-agent-interface-boundary-wave-2c-optimized-plan-2026-05-18.md` 接管当前验收

本文承接 `docs/workspace/alembic-core-agent-interface-boundary-wave-2a-acceptance-wave-2b-plan-2026-05-18.md`，用于验收 `AlembicAgent` Wave 2B，并分派外层仓库 Wave 2C 本地源码依赖模式收口 / 验证任务。

暂停说明：2026-05-18 用户要求先停一轮，不继续按本文推进旧 Wave 2C，而是先统一调整 `Alembic`、`AlembicPlugin`、`AlembicAgent` 三个仓库的本地源码引入方式。当前执行入口改为 `docs/workspace/alembic-local-source-import-unification-workspace-plan-2026-05-18.md`。

优化说明：本地源码引入统一已完成并通过总控验收。本文中的旧 Wave 2C 分派不再直接发送；优化后的 Wave 2C 入口为 `docs/workspace/alembic-core-agent-interface-boundary-wave-2c-optimized-plan-2026-05-18.md`。

## 1. Wave 2B 验收结论

结论：通过。

`AlembicAgent` 已完成 Core facade consumption，提交 `1af571674d3eb123e5aad695cb9a02fc69ce37d6`（`Consume core public facades`）。工作区复核时为 clean。

验收通过的关键点：

- `MemoryRetriever.ts` 和 `MemoryStore.ts` 已将 similarity helper 切到 `@alembic/core/search`。
- `EvolutionAgentRun.ts` 已将 evolution 类型切到 `@alembic/core/evolution`。
- `MemoryStore.ts` 已移除 `@alembic/core/infrastructure/database/drizzle/schema`，改由 `@alembic/core/memory` 的 `ensureSemanticMemorySchema(...)` 负责 schema setup contract；Agent 保留同步 raw SQLite adapter 以维持现有调用面。
- `SessionStore.ts` 已本地化 Agent session cache defaults，不再消费 `@alembic/core/shared/constants`。
- `config/core-import-boundary.json` 已清空 non-stable allowlist。
- 无 config Core consumer scan 已从 Wave 2A 的 `issueCount: 6` 收敛为 `issueCount: 0`，48 个 `@alembic/core` imports 全部为 stable public。

## 2. 总控复核命令

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` in `AlembicAgent` | 通过。 |
| `npm run lint:public-api-boundary` in `AlembicAgent` | 通过；15 exact exports，无 wildcard exports。 |
| `npm run lint:core-import-boundary` in `AlembicAgent` | 通过；214 files / 48 Core imports，config allowlist 为空。 |
| `node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --format=json` in `AlembicAgent` | 通过；215 files / 48 refs / `issueCount: 0`；stable-public 48、provisional-public 0、transitional-internal 0。 |
| `rg -n "@alembic/core/(shared/similarity\|infrastructure/database/drizzle/schema\|shared/constants\|service/evolution)" src config scripts test --glob '!**/dist/**'` in `AlembicAgent` | 0 命中；`rg` 退出码 1 表示未找到匹配。 |
| `npm run check` in `AlembicAgent` | 通过；9 test files / 37 tests；Biome 仍输出 23 条既有 warning，未阻断。 |
| `npm run smoke:public-imports` in `AlembicAgent` | 通过；15 public subpaths imported。 |
| `git diff --check` in `AlembicAgent` | 通过。 |

## 3. Wave 2C 判断

用户已明确：源仓库会正常提交；当发布、runtime 快照、远程 CI 或安装包需要远程 / vendor 指针时，可以正常确认和记录。但 AlembicWorkspace 本地开发和总控验收应优先使用 workspace 本地源码；只要本地源码可用，就不要把远程指针或 vendor 指针检查作为日常阻塞。

因此 Wave 2C 从“同步 Core vendor”调整为“本地源码依赖模式收口”。本轮不要求例行更新 `vendor/AlembicCore` 指针；vendor 只保留为 release / portable runtime / 离线安装快照边界。

当前外层状态：

| 仓库 | 当前事实 | 判断 |
| --- | --- | --- |
| `Alembic` | `@alembic/agent` 已为 `file:../AlembicAgent`；`@alembic/core`、`build:core`、Core boundary scripts 仍主要指向 `vendor/AlembicCore`。 | 需要 Wave 2C。把本地开发 / 总控验证切到 workspace 本地 `../AlembicCore`，继续消费 `../AlembicAgent`，并评估 Dashboard 本地源码入口是否也应纳入同一规则；不把 vendor 指针检查作为本轮验收条件。 |
| `AlembicPlugin` | 不依赖 `@alembic/agent`；`@alembic/core`、Core build/lint 和 Codex plugin runtime snapshot 仍围绕 `vendor/AlembicCore`。 | 需要 Wave 2C。让本地 build/lint/check 优先消费 `../AlembicCore`；Codex plugin runtime / tarball 需要 portable snapshot 时，从本地源码生成并记录源 commit，继续保持 agent-free。 |
| `AlembicCore` | Wave 2A 已提交 stable facades：`b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 | 已完成，不发送。仅在外层发现缺失 public facade 时再回流新任务。 |
| `AlembicAgent` | Wave 2B 已提交 Core facade consumption：`1af571674d3eb123e5aad695cb9a02fc69ce37d6`。 | 已完成，不发送。 |
| `AlembicDashboard` | 不直接消费 `@alembic/core` / `@alembic/agent` package；本轮无 HTTP/API shape 变化。 | 观察中，不发送。若 `Alembic` 发现 Dashboard vendor / local source 入口需要统一，再由后续文档单独派发。 |
| `BiliDili` | iOS/Swift 真实测试项目，不消费这些 JS package。 | 无任务，不发送。 |

最新 Core consumer scanner 预扫结果：

- `node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json`：通过，451 files / 601 imports。
- `node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json`：通过，315 files / 517 imports。

因此 Wave 2C 重点是本地源码依赖模式、脚本解析路径、package/runtime 快照边界和验证口径收口，不是新增 import 边界改造，也不是例行远程指针确认。

## 4. Wave 2C 分派表

当前发送给 `Alembic` 和 `AlembicPlugin`。两者可并行执行，写入各自执行文档；其它窗口保持观察或无任务，避免空转。

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | 待启动 | 将本地开发 / 总控验证的 Core 入口切到 workspace 本地 `../AlembicCore`；保留 `@alembic/agent: file:../AlembicAgent`；评估 Dashboard 本地源码入口；重跑 host build/check/Agent boundary/Core boundary/public import smoke；不例行同步 `vendor/AlembicCore`。 | 新建 | `docs/Alembic/alembic-local-source-dependency-mode-wave-2c-2026-05-18.md` | 本文第 4 节；`docs/workspace/index.md` 当前总控入口 | 本文第 6.3 节 | `node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary.json`; `npm run build:check`; `npm run lint:agent-extraction-boundary`; `npm run lint:core-import-boundary`; `npm run check`; `npm run build`; Agent public import smoke covering 15 subpaths; representative `node -e "import('@alembic/agent/memory')"`; local Core resolution proof | 依赖 Core `b904b66` 和 Agent `1af5716` 已在 workspace 本地存在；当前可启动。 |
| `AlembicPlugin` | 待启动 | 将本地 build/lint/check 的 Core 入口切到 workspace 本地 `../AlembicCore`；Codex plugin runtime / tarball 需要 portable snapshot 时，从本地 Core 源码生成并记录源 commit；继续保持 `@alembic/agent` 0 依赖；不例行同步 `vendor/AlembicCore`。 | 新建 | `docs/AlembicPlugin/alembic-plugin-local-source-dependency-mode-wave-2c-2026-05-18.md` | 本文第 4 节；`docs/workspace/index.md` 当前总控入口 | 本文第 6.4 节 | `node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary-allowlist.json`; `npm run build:check`; `npm run lint:core-import-boundary`; `npm run check`; `npm run build`; `npm run verify:codex-plugin`; `npm run smoke:codex-plugin`; `rg -n "@alembic/agent" lib bin config scripts plugins test --glob "*.ts" --glob "*.js" --glob "*.mjs" --glob "*.json"`; local Core resolution proof | 依赖 Core `b904b66` 已在 workspace 本地存在；不得引入 Agent。当前可启动。 |
| `AlembicCore` | 已完成 | Wave 2A 已通过；本轮无新任务。 | 已新建 | `docs/AlembicCore/alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md` | 本文第 1-2 节 | 本文第 6.1 节 | 已复核 | 当前不发送提示词。 |
| `AlembicAgent` | 已完成 | Wave 2B 已通过；本轮无新任务。 | 已新建 | `docs/AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md` | 本文第 1-2 节 | 本文第 6.2 节 | 已复核 | 当前不发送提示词。 |
| `AlembicDashboard` | 观察中 | 无实际任务；仅在 Alembic local-source 评估发现 Dashboard 接入需要统一，或 HTTP/API shape 变化时触发。 | 无需新建 | 无 | 本文第 4 节 | 本文第 6.5 节 | 暂不运行 | 当前不发送提示词。 |
| `BiliDili` | 无任务 | 本轮不涉及 iOS/Swift 真实测试项目。 | 无需新建 | 无 | 本文第 4 节 | 本文第 6.6 节 | 暂不运行 | 当前不发送提示词。 |

## 5. Wave 2C 执行要求

### 5.1 Alembic

1. 读取本文和 `docs/AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md`。
2. 把本地开发、总控验证、Core build 和 Core boundary 相关脚本优先切到 workspace 本地 `../AlembicCore`；如果必须保留 fallback，只允许用于 workspace 外独立运行或 release snapshot，不作为日常验收阻塞。
3. 保持 `@alembic/agent` 指向 `../AlembicAgent`，并确认 host 能消费 Agent commit `1af571674d3eb123e5aad695cb9a02fc69ce37d6` 的 public subpaths。
4. 评估 Alembic 对 `AlembicDashboard` 的本地 / vendor 引用方式；若当前本地开发也能使用 `../AlembicDashboard`，按同一规则收口。若不需要改 Dashboard，回填理由即可。
5. 验证 15 个 Agent public subpaths 在 Alembic host 环境可 import，尤其覆盖 `@alembic/agent/memory`、`@alembic/agent/runtime`、`@alembic/agent/tools`、`@alembic/agent/tools/v2`、`@alembic/agent/tools/terminal`、`@alembic/agent/service`、`@alembic/agent/ai`。
6. 重跑 host Core boundary 和 Agent extraction boundary，证明它们使用的是本地源码口径或清楚记录 fallback 条件。
7. 新建执行记录 `docs/Alembic/alembic-local-source-dependency-mode-wave-2c-2026-05-18.md` 并回填。

禁止事项：

- 不要为了本地开发验收去例行同步 `vendor/AlembicCore` 或检查远程指针。
- 不要修改 `AlembicAgent` / `AlembicCore` 源码；若发现缺 facade，回填为上游新任务。
- 不要重新引入本地 duplicate Agent implementation。
- 不要把 `@alembic/agent`、`@alembic/core` 或 Dashboard 的消费改成不受控绝对路径。

### 5.2 AlembicPlugin

1. 读取本文和 `docs/AlembicCore/alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md`。
2. 把本地 build/lint/check 的 Core 入口优先切到 workspace 本地 `../AlembicCore`；`vendor/AlembicCore` 只作为 release / portable runtime / workspace 外 fallback，不作为日常验收阻塞。
3. 梳理 `scripts/prepare-codex-plugin-runtime.mjs`、tarball/channel verify 和 Codex plugin runtime：需要 portable snapshot 时，应从本地 Core 源码生成，并在执行文档记录源 commit；不需要每轮先确认远程或 vendor 指针。
4. 继续保持 `@alembic/agent` 0 依赖；任何 Agent 相关新增都视为回归。
5. 新建执行记录 `docs/AlembicPlugin/alembic-plugin-local-source-dependency-mode-wave-2c-2026-05-18.md` 并回填。

禁止事项：

- 不得引入 `@alembic/agent`。
- 不得恢复已删除的 internal agent / AI provider / tool router。
- 不要为了本地开发验收去例行同步 `vendor/AlembicCore` 或检查远程指针。
- 不要修改 Dashboard，除非验证发现 plugin runtime 引用到 Dashboard vendor 需要同步；若发生，必须在回填里说明触发原因。

## 6. 回填区

### 6.1 AlembicCore 回填

已完成并通过总控验收。提交：`b904b66907e16e61f29a6dc0eeedc59231ddfb53`。

### 6.2 AlembicAgent 回填

已完成并通过总控验收。提交：`1af571674d3eb123e5aad695cb9a02fc69ce37d6`。

### 6.3 Alembic Wave 2C 回填

待启动。请新建 `docs/Alembic/alembic-local-source-dependency-mode-wave-2c-2026-05-18.md` 并在完成后回填。

### 6.4 AlembicPlugin Wave 2C 回填

待启动。请新建 `docs/AlembicPlugin/alembic-plugin-local-source-dependency-mode-wave-2c-2026-05-18.md` 并在完成后回填。

### 6.5 AlembicDashboard 回填

当前无实际任务。仅在 Alembic local-source 评估触发后再派发。

### 6.6 BiliDili 回填

当前无任务；不发送提示词。

## 7. 当前可复制分派提示词

```text
读取 docs/workspace/alembic-core-agent-interface-boundary-wave-2b-acceptance-wave-2c-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

本提示词当前发送给：

- `Alembic`
- `AlembicPlugin`

本轮不发送给：

- `AlembicCore`：已完成。
- `AlembicAgent`：Wave 2B 已完成并通过总控验收。
- `AlembicDashboard`：观察中，无实际任务。
- `BiliDili`：无任务。

## 8. 下一步总控动作

1. 等 `Alembic` 和 `AlembicPlugin` 回填 Wave 2C。
2. 总控复核本地开发和总控验证是否优先使用 workspace 本地 `../AlembicCore`，而不是把 vendor / 远程指针作为日常前置条件。
3. 复核 Alembic host 能否消费 Agent commit `1af571674d3eb123e5aad695cb9a02fc69ce37d6`。
4. 复核 Plugin 仍为 agent-free，Codex runtime / package smoke 在本地源码快照规则下通过，并记录需要 portable snapshot 时的源 commit。
5. 如果两者均通过，本轮 Core/Agent interface boundary 可进入最终总结；如出现 release snapshot 或 workspace 外安装问题，再单独开 release dependency snapshot 文档。
