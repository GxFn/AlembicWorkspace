# Alembic 0.2.0 Version Unification Workspace Plan

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：V020-3R 待启动
来源 TODO：`GTODO-2026-05-22-011`

## 用户目标

用户判断当前 Alembic 已经进入“稍微可用”的版本，要求把所有 Alembic 自有版本号位置统一为 `0.2.0`，并在代码完成后更新部署、刷新 Codex 插件缓存。

本计划的目标是完成真实发布链路版本统一，而不是只改单个 `package.json`：

- 源仓库 package manifest 版本统一为 `0.2.0`。
- 发布 / staging / Codex plugin runtime 产物中引用的 Alembic 自有版本统一为 `0.2.0`。
- 代码中对 MCP / plugin / runtime version 的硬编码不得继续停留在 `0.1.x`；能从 manifest 读取的，应以 manifest 为准。
- Codex 插件缓存刷新到 `alembic-codex@0.2.0`，并能通过 marker 或 manifest 看出新版本与本地 MCP 入口。

## 范围边界

进入版本统一范围：

- Alembic 自有 package / plugin / channel / marketplace / release staging / runtime artifact 版本号。
- 与版本号强绑定的测试断言、cache path 断言、plugin manifest 断言。
- `AlembicPlugin` Codex runtime 重新生成后产生的 `runtime/package.json`、`runtime.tgz`、runtime 内 plugin shell snapshot 和 embedded Core package metadata。
- `Alembic` publish staging 重新生成后产生的 `.release/alembic-ai/package.json` 和 release source metadata。

不进入版本统一范围：

- 第三方依赖版本、Node engine 范围、Vitest / Vite / React 等生态依赖版本。
- 历史归档文档、历史测试证据、旧回填记录中作为当时事实出现的 `0.1.x`。
- `node_modules`、npm registry 包内部版本、generated lockfile 中第三方包版本。
- 子仓库 `vendor/*` 作为历史快照时不手工改散；只有由 runtime / staging 生成脚本重新复制出的 portable snapshot 可以随源版本更新。

## 真实代码证据

总控启动前已扫描到以下当前事实：

- `Alembic/package.json` 是 `alembic-ai@0.1.0`，`Alembic/.release/alembic-ai/package.json` 也是 `0.1.0`，且 staging 依赖 `@alembic/core@0.1.0`、`@alembic/agent@0.1.0`。
- `AlembicCore/package.json` 是 `@alembic/core@0.1.0`。
- `AlembicAgent/package.json` 是 `@alembic/agent@0.1.0`。
- `AlembicDashboard/package.json` 是私有包 `alembic-dashboard@3.3.8`。按用户“所有有版本号位置统一为 0.2.0”的口径，本次也纳入自有 package version bump；第三方依赖不改。
- `AlembicPlugin/package.json` 是 `alembic-ai@0.1.2`，`package-lock.json` root 也记录 `0.1.2`。
- `AlembicPlugin/plugins/alembic-codex/.codex-plugin/plugin.json` 是 `alembic-codex@0.1.2`，`channels/codex/channel.json` 的 embedded runtime package 是 `0.1.2`。
- `AlembicPlugin/plugins/alembic-codex/package.json` 是 private shell `0.0.0`；本轮作为 Alembic 自有版本位统一到 `0.2.0`。
- `AlembicPlugin/plugins/alembic-codex/runtime/package.json` 是由 `scripts/prepare-codex-plugin-runtime.mjs` 从 root package 生成的 `alembic-ai@0.1.2`。
- `AlembicPlugin/scripts/prepare-codex-plugin-runtime.mjs` 会复制 `../AlembicCore` 的 `package.json` / `dist` / resources 到 runtime `vendor/AlembicCore`，所以 Plugin runtime 必须等 `AlembicCore` 版本先更新。
- `Alembic/scripts/prepare-publish-staging.mjs` 会读取相邻 `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 的 package version 写入 staging metadata 和 registry dependency replacement，所以 `Alembic` 必须等这三个上游版本先回填。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts` 仍有 MCP server version `0.1.1` 硬编码；本轮应删除硬编码或至少更新到 manifest-derived `0.2.0`，避免发布后工具层自报旧版本。
- `AlembicPlugin/scripts/sync-codex-plugin-cache.mjs` 的 fallback plugin version 仍是 `0.1.1`；实际会优先读 plugin manifest，但本轮应消除这个迷惑性旧 fallback。

## Producer / Consumer 顺序

版本源上游先行：

1. `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 只改各自源 package / lock / 必要测试断言，互不依赖，可并行。
2. `Alembic` 读取上游 package version 生成 publish staging，所以必须等 `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 回填后启动。
3. `AlembicPlugin` 读取 `AlembicCore` 生成 portable runtime / embedded Core snapshot；为避免当前发布口径里仍留上游 `0.1.x`，本轮等 V020-1R 全部验收后再启动。
4. `AlembicWorkspace` 在 `AlembicPlugin` 回填后刷新本机 Codex plugin cache 到 `0.2.0` 并记录部署缓存证据。

## 完成功能闭环

输入：

- 用户或 release 脚本读取 Alembic 系列 package / plugin manifest。
- Codex 加载本地 `alembic-codex` 插件缓存。
- Alembic publish staging 与 Codex plugin runtime 读取相邻仓库版本。

处理：

- 上游源包版本统一到 `0.2.0`。
- 下游 release / plugin runtime 重新生成，不能残留 `0.1.x` 自有版本。
- 插件缓存同步脚本按 `0.2.0` manifest 写入 `$CODEX_HOME/plugins/cache/gxfn/alembic-codex/0.2.0`。

输出：

- 源 manifest、release staging、Codex channel、plugin manifest、embedded runtime 和 cache marker 均显示 `0.2.0`。
- `alembic` / `alembic-codex-mcp` 自报版本或 MCP server metadata 不再出现 `0.1.x`。
- 历史文档里的旧版本只作为历史证据保留，不参与当前发布口径。

完成定义：

- 各执行仓库提交 hash、完成范围、验证命令和残留扫描回填齐全。
- `rg` 针对当前源码 / manifest / release artifact / runtime artifact 中的 Alembic 自有 `0.1.x` 与 `0.0.0` 版本位无未解释残留。
- `AlembicPlugin` cache refresh 成功，目标版本为 `0.2.0`。
- workspace 文档、索引、TODO 和状态校验通过。

## 阶段计划

| 阶段 | 状态 | 主窗口 | 目标 | 输出 / 证据 | 是否可派发 |
| --- | --- | --- | --- | --- | --- |
| V020-0 | 已完成 | `AlembicWorkspace` | 扫描真实版本入口和依赖顺序，建立 0.2.0 发布计划。 | 当前计划、索引、状态和 TODO 已更新。 | 否，总控内完成 |
| V020-1 | 已完成 | `AlembicCore` / `AlembicAgent` / `AlembicDashboard` | 上游源 package version 统一为 `0.2.0`，同步 lockfile 和必要测试断言。 | `AlembicCore` / `AlembicAgent` / `AlembicDashboard` 源 package / root lock 均已到 `0.2.0`。 | 否 |
| V020-1R | 已完成 | `AlembicAgent` | 在 Core 已完成 `0.2.0` 后，刷新 Agent lockfile 中 `../AlembicCore` snapshot 到 `0.2.0` 并补验证。 | 总控复核通过：AlembicAgent `9de2cd97c3f4962a8b19595b76eeb7df00f853f5`，Core snapshot 为 `0.2.0`，目标残留扫描无命中。 | 否 |
| V020-2 | 已完成 | `Alembic` | 在上游版本完成后，更新 `alembic-ai` 源 manifest / lock / release staging 到 `0.2.0`。 | Alembic 提交 `1656c67484b99bf9326af34102e936f18073b9aa`；执行记录 `docs/Alembic/alembic-0-2-0-version-unification-main-2026-05-22.md`；staging metadata 读取 Core / Agent / Dashboard `0.2.0`；release boundary 验证通过。 | 否 |
| V020-3 | 待返工 | `AlembicPlugin` | 在上游版本完成后，更新 root/plugin/channel/runtime 到 `0.2.0`，消除 `0.1.1` hardcode / fallback，重新生成 Codex runtime。 | 主体产物已回填并基本通过；总控复核发现 `test/unit/ResidentSearchClient.test.ts:22` 仍有 daemon state fixture `version: '0.1.0'`，属于当前 Alembic 自有测试口径残留。 | 否 |
| V020-3R | 待启动 | `AlembicPlugin` | 清理 `ResidentSearchClient` daemon state fixture 的 `0.1.0` 残留，补精确残留扫描和 targeted test。 | AlembicPlugin 返工提交 hash、验证命令和残留扫描回填。 | 是 |
| V020-4 | 阻塞 | `AlembicWorkspace` | 验收 V020-3R，刷新本机 Codex plugin cache 到 `0.2.0`，记录部署缓存证据。 | cache marker、workspace 文档提交。 | 否，等待 Plugin 返工回填后解除 |

## 窗口分派

当前只发送 `AlembicPlugin` 做 V020-3R 小返工。总控暂不进入 V020-4 cache refresh，避免把仍含当前 Alembic 自有 `0.1.0` 测试 fixture 的提交作为最终可用版本缓存出去。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | V020-2 已完成：提交 `1656c67484b99bf9326af34102e936f18073b9aa`，root `alembic-ai@0.2.0`、lockfile、publish staging 与 release metadata 已读取 Core / Agent / Dashboard 的 `0.2.0`。 |
| `AlembicCore`<br>已完成 | V020-1 总控复核通过：提交 `f30beacedf89abab13b91e87e4686d0db38e7d29`，`@alembic/core` package / lock root 自有版本已统一为 `0.2.0`，目标残留扫描无命中。 |
| `AlembicAgent`<br>已完成 | V020-1R 总控复核通过：提交 `9de2cd97c3f4962a8b19595b76eeb7df00f853f5`，`package-lock.json` 中 `../AlembicCore` snapshot 已刷新到 `0.2.0`，目标残留扫描无命中。 |
| `AlembicDashboard`<br>已完成 | V020-1 总控复核通过：提交 `5160a2a0fb164005f1922b8f58f28ca0ec88df56`，私有 `alembic-dashboard` package / lock root 自有版本已统一为 `0.2.0`。 |
| `AlembicPlugin`<br>待启动 | V020-3R 返工：`test/unit/ResidentSearchClient.test.ts:22` 的 daemon state fixture 仍是 `version: '0.1.0'`；这是当前 Alembic 自有测试口径，不属于第三方依赖或历史文档，需要改为 `0.2.0` 或从当前 package / daemon version 口径派生，并补 targeted test / 残留扫描。 |
| `AlembicTest`<br>观察中 | 本轮先不创建测试单；如用户需要真实 Codex / BiliDili 复测，在 V020-4 后创建。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码；只可能作为后续测试对象。 |

## V020-1 执行要求

### `AlembicCore`

文档动作：新建单仓库执行记录。

保存位置：`docs/AlembicCore/alembic-0-2-0-version-unification-core-2026-05-22.md`

验证建议：

- `npm run build:check`
- `npm run test -- --runInBand` 若不支持该参数，改运行仓库现有 `npm run test`
- `npm run build`
- `rg -n '"version": "0\\.1\\.0"|@alembic/core.*0\\.1\\.0' package.json package-lock.json src test scripts`
- `git diff --check`

### `AlembicAgent`

文档动作：新建单仓库执行记录。

保存位置：`docs/AlembicAgent/alembic-0-2-0-version-unification-agent-2026-05-22.md`

验证建议：

- `npm run build` 或仓库当前最小 typecheck/build 脚本
- `npm run test` 若当前仓库测试可运行
- `rg -n '"version": "0\\.1\\.0"|@alembic/agent.*0\\.1\\.0|@alembic/core.*0\\.1\\.0' package.json package-lock.json src test scripts`
- `git diff --check`

### `AlembicDashboard`

文档动作：新建单仓库执行记录。

保存位置：`docs/AlembicDashboard/alembic-0-2-0-version-unification-dashboard-2026-05-22.md`

验证建议：

- `npm run build`
- `rg -n '"version": "3\\.3\\.8"|alembic-dashboard.*3\\.3\\.8' package.json package-lock.json src`
- `git diff --check`

## V020-1R 返工要求

### `AlembicAgent`

目标：Core 已完成 `@alembic/core@0.2.0` 后，刷新 `AlembicAgent/package-lock.json` 中 `packages["../AlembicCore"].version`，消除当前 `0.1.0` snapshot。

范围：

- 只改 `AlembicAgent` 仓库内 lockfile / 必要执行记录。
- 不改 `AlembicCore`、`AlembicDashboard`、`Alembic`、`AlembicPlugin`。
- 不改第三方依赖版本。

验证建议：

- `node -e "const l=require('./package-lock.json'); console.log(l.packages['../AlembicCore']?.version)"`
- `rg -n '"version": "0\\.1\\.0"|@alembic/agent.*0\\.1\\.0|@alembic/core.*0\\.1\\.0' package.json package-lock.json src test scripts`
- `npm run build`
- `npm run test`
- `git diff --check`

## V020-2 执行要求

### `Alembic`

目标：把 Alembic 主仓库当前发布包与 publish staging 统一到 `0.2.0`。

范围：

- 更新 `package.json`、`package-lock.json` 中 `alembic-ai` 自有版本位到 `0.2.0`。
- 重新生成 `.release/alembic-ai` staging，确保 `.release/alembic-ai/package.json` 是 `alembic-ai@0.2.0`，依赖中的 `@alembic/core` / `@alembic/agent` 为 `0.2.0`，release source metadata 中 Dashboard package version 为 `0.2.0`。
- 不修改 `vendor/*` 快照，除非当前 release staging 脚本真实需要并在回填中说明。
- 不发布 npm，不刷新 Codex plugin cache。

文档动作：新建单仓库执行记录。

保存位置：`docs/Alembic/alembic-0-2-0-version-unification-main-2026-05-22.md`

验证建议：

- `npm run build:check`
- `npm run build`
- `npm run release:staging:prepare`
- `npm run release:staging:pack`
- `npm run release:package-guard`
- `rg -n '"version": "0\\.1\\.0"|@alembic/(core|agent).*0\\.1\\.0|alembic-ai.*0\\.1\\.0' package.json package-lock.json .release/alembic-ai/package.json .release/alembic-ai/alembic-release-source.json lib bin scripts test`
- `git diff --check`

## V020-3 执行要求

### `AlembicPlugin`

目标：把 Codex plugin 交付链路统一到 `0.2.0`，并准备由总控刷新本机 cache。

范围：

- 更新 `AlembicPlugin/package.json` / lock root、`plugins/alembic-codex/.codex-plugin/plugin.json`、`plugins/alembic-codex/package.json`、`channels/codex/channel.json`、`.agents/plugins/marketplace.json` 中属于 Alembic 自有版本位的内容到 `0.2.0`。
- 清理 `CodexMcpServer` / cache sync / tests 中 `0.1.1`、`0.1.2`、`0.0.0` 版本硬编码；能从 manifest 读取的不要继续硬编码旧版本。
- 重新运行 build 与 `prepare:codex-plugin-runtime`，让 `plugins/alembic-codex/runtime/package.json`、runtime shell snapshot、embedded Core package 与 `runtime.tgz` 都进入 `0.2.0` 口径。
- 不刷新 `$CODEX_HOME/plugins/cache`；V020-4 由 `AlembicWorkspace` 做本机部署缓存刷新。

文档动作：新建 / 更新单仓库执行记录。

保存位置：`docs/AlembicPlugin/alembic-0-2-0-version-unification-plugin-2026-05-22.md`

验证建议：

- `npm run build:check`
- `npm run build`
- `npm run prepare:codex-plugin-runtime`
- `npm run verify:codex-plugin`
- `npm run verify:codex-channel`
- `npm run verify:release-package-boundary`
- `npm run verify:codex-session`
- `rg -n '0\\.1\\.2|0\\.1\\.1|\"version\": \"0\\.0\\.0\"|alembic-codex.*0\\.1\\.' package.json package-lock.json lib test scripts channels .agents plugins/alembic-codex`
- `git diff --check`

## V020-3R 返工要求

### `AlembicPlugin`

目标：清理 V020-3 总控复核发现的最后一个 Alembic 自有旧版本 fixture。

范围：

- 处理 `test/unit/ResidentSearchClient.test.ts:22` 的 daemon state `version: '0.1.0'`，改为 `0.2.0` 或从当前 package / daemon version 口径派生。
- 不刷新 `$CODEX_HOME/plugins/cache`；V020-4 仍由 `AlembicWorkspace` 执行。
- 不改第三方依赖版本，不把 package-lock 中第三方 `0.0.0` 或测试 fixture `AFNetworking 4.0.1.2` 当 Alembic 自有版本处理。

验证建议：

- `npm run test:unit -- test/unit/ResidentSearchClient.test.ts`
- `rg -n -P '(?<![0-9.])0\\.1\\.(?:0|1|2)(?![0-9.])|alembic-(?:ai|codex|dashboard).*0\\.1\\.|@alembic/(?:core|agent).*0\\.1\\.' package.json package-lock.json lib test scripts channels .agents plugins/alembic-codex`
- `git diff --check`

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V020-TODO-1 | 已完成 | 版本源 | P0 | `AlembicCore` | `@alembic/core` 自有版本统一为 `0.2.0`。 | 是 | 总控复核通过：提交 `f30beacedf89abab13b91e87e4686d0db38e7d29`，源 package / lock 版本为 `0.2.0`，目标残留扫描无命中。 | `AlembicCore` |
| V020-TODO-2 | 已完成 | 版本源返工 | P0 | `AlembicAgent` | 刷新 `package-lock.json` 中 `../AlembicCore` snapshot 到 `0.2.0`，让 Agent 当前 lockfile 不再保留 Alembic 自有 `0.1.0` 版本位。 | 是 | 总控复核通过：提交 `9de2cd97c3f4962a8b19595b76eeb7df00f853f5`，Core snapshot 为 `0.2.0`，目标残留扫描无命中。 | `AlembicAgent` |
| V020-TODO-3 | 已完成 | 版本源 | P1 | `AlembicDashboard` | 私有 `alembic-dashboard` 自有 package version 统一为 `0.2.0`。 | 是 | 总控复核通过：提交 `5160a2a0fb164005f1922b8f58f28ca0ec88df56`，源 package / lock 版本为 `0.2.0`；`package-lock.json` 中第三方 `0.1.0` 不属于本轮自有版本位。 | `AlembicDashboard` |
| V020-TODO-4 | 已完成 | release staging | P0 | `Alembic` | root / lock / `.release/alembic-ai` 统一为 `0.2.0`，staging dependency replacement 读取上游 `0.2.0`。 | 是 | 提交 `1656c67484b99bf9326af34102e936f18073b9aa`，执行记录 `docs/Alembic/alembic-0-2-0-version-unification-main-2026-05-22.md`；`npm run build:check`、`npm run build`、`npm run release:staging:prepare`、`npm run release:staging:pack`、`npm run release:package-guard`、残留扫描和 `git diff --check` 通过。 | `Alembic` |
| V020-TODO-5 | 待返工 | Codex plugin runtime | P0 | `AlembicPlugin` | root / plugin manifest / channel / runtime / tests / MCP metadata / cache sync fallback 统一为 `0.2.0`。 | 是 | 主体产物已回填；总控复核发现 `ResidentSearchClient` daemon state fixture 仍为 `0.1.0`。 | `AlembicPlugin` |
| V020-TODO-5R | 待启动 | 测试版本 fixture | P0 | `AlembicPlugin` | 清理 `test/unit/ResidentSearchClient.test.ts:22` 的 Alembic 自有 `0.1.0` daemon state fixture，并补 targeted test / 精确残留扫描。 | 是 | V020-3 总控复核发现。 | `AlembicPlugin` |
| V020-TODO-6 | 阻塞 | 部署缓存 | P0 | `AlembicWorkspace` | 验收后刷新本机 Codex plugin cache 到 `0.2.0`，记录 marker 和当前加载路径。 | 是 | 等 `AlembicPlugin` V020-3R 回填后解除。 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | V020-2 已完成并回填，提交 `1656c67484b99bf9326af34102e936f18073b9aa`。 |
| `AlembicCore` | 已完成 | 否 | V020-1 已通过总控复核。 |
| `AlembicAgent` | 已完成 | 否 | V020-1R 已通过总控复核。 |
| `AlembicDashboard` | 已完成 | 否 | V020-1 已通过总控复核。 |
| `AlembicPlugin` | 待启动 | 是 | 当前唯一返工项：清理 `ResidentSearchClient` 里的 Alembic 自有 `0.1.0` fixture。 |
| `AlembicTest` | 观察 | 否 | 本轮不是真实项目行为变更；如需复测后续单独建测试单。 |
| `BiliDili` | 无任务 | 否 | 不改真实项目源码。 |

## 可复制分派提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md，按照文档，领取并完成分配给你所在窗口的 V020-3R 返工任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`Alembic`（已完成）、`AlembicCore`（已完成）、`AlembicAgent`（已完成）、`AlembicDashboard`（已完成）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 验证策略

总控文档更新需运行：

- `node scripts/verify-workspace-docs.mjs --all-workspace`
- `node scripts/check-dispatch-coverage.mjs`
- `node scripts/check-todo-board.mjs --require`
- `git diff --check`

V020-1 回填后，总控复核：

- 三个上游仓库工作区干净。
- 三个上游 package / lock 自有版本位为 `0.2.0`。
- 没有误改第三方依赖版本或历史文档。

V020-2 / V020-3 启动后，再补充 Alembic release staging、Plugin runtime、Codex channel、cache refresh 的 targeted 验证。

## 回填区

- 2026-05-22：总控创建本计划。当前已完成真实版本入口扫描和 producer / consumer 顺序判断；当前只发送 V020-1 给 `AlembicCore`、`AlembicAgent`、`AlembicDashboard`。`Alembic` 与 `AlembicPlugin` 等上游版本回填后再启动，避免生成不一致发布产物。
- 2026-05-22：`AlembicDashboard` V020-1 已完成，执行记录见 `docs/AlembicDashboard/alembic-0-2-0-version-unification-dashboard-2026-05-22.md`。完成范围：`package.json` 与 `package-lock.json` 中 `alembic-dashboard` 自有版本从 `3.3.8` 统一为 `0.2.0`，未修改第三方依赖。提交 hash：`5160a2a0fb164005f1922b8f58f28ca0ec88df56`。验证命令：`npm run build`、`rg -n '"version": "3\\.3\\.8"|alembic-dashboard.*3\\.3\\.8' package.json package-lock.json src`、`git diff --check`、`git status --short`。验证结果：构建通过且显示 `alembic-dashboard@0.2.0`，残留扫描无命中，diff 检查通过，Dashboard 工作区干净。遗留风险：V020-2 仍需由 `Alembic` 重新生成 publish staging 读取 Dashboard `0.2.0`；本轮未刷新部署环境或提交 `dist/`。下一步建议：等待 `AlembicCore` / `AlembicAgent` 回填后启动 `Alembic` V020-2，`AlembicPlugin` 继续等待 Core 回填后再启动。
- 2026-05-22：`AlembicAgent` V020-1 已完成并待总控验收。完成范围：`package.json`、`package-lock.json` 的 `@alembic/agent` 自有版本位从 `0.1.0` 更新为 `0.2.0`，未修改相邻仓库或第三方依赖。提交 hash：`39b2ab3`。验证命令：`npm run build`；`npm run test`；`rg -n '"version": "0\\.1\\.0"|@alembic/agent.*0\\.1\\.0|@alembic/core.*0\\.1\\.0' package.json package-lock.json src test scripts`；`git diff --check`；`alembic_guard files package.json package-lock.json`。验证结果：build 通过；test 通过，19 个测试文件 / 87 个测试用例；`git diff --check` 通过；残留扫描命中 `package-lock.json:30` 的 `../AlembicCore` snapshot `0.1.0`，原因是相邻 `AlembicCore` 当前只读版本仍为 `0.1.0`；`alembic_guard` 因本项目暂无可用 Alembic knowledge base 返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。执行记录：`docs/AlembicAgent/alembic-0-2-0-version-unification-agent-2026-05-22.md`。遗留风险：Core 完成后需要刷新 Agent lockfile 的 Core snapshot。下一步建议：继续等待 Core / Dashboard V020-1 回填，再启动 `Alembic` V020-2 和 `AlembicPlugin` V020-3。
- 2026-05-22：`AlembicCore` V020-1 已完成并待总控验收。执行记录：[../AlembicCore/alembic-0-2-0-version-unification-core-2026-05-22.md](../AlembicCore/alembic-0-2-0-version-unification-core-2026-05-22.md)。完成范围：`package.json`、`package-lock.json` 的 `@alembic/core` 自有版本位从 `0.1.0` 更新为 `0.2.0`，`test/RuntimeContracts.test.ts` 的 runtime version 断言同步到 `0.2.0`，未修改第三方依赖、历史文档或 `dist/`。提交 hash：`f30beacedf89abab13b91e87e4686d0db38e7d29`。验证命令：`npm run build:check`；`npm run test`；`npm run build`；`rg -n '"version": "0\\.1\\.0"|@alembic/core.*0\\.1\\.0' package.json package-lock.json src test scripts`；`npm run lint -- package.json package-lock.json test/RuntimeContracts.test.ts`；`git diff --check`。验证结果：build:check 通过；test 通过，63 个测试文件 / 943 个测试用例；build 通过；目标残留扫描无命中；lint 通过；diff 检查通过。残留说明：`RELEASE-PLAYBOOK.md` 的 `v0.1.0` 是 tag 格式示例，不是当前版本源，本轮未修改。遗留风险：`AlembicAgent` lockfile 中 `../AlembicCore` snapshot 残留需要在 Core `0.2.0` 完成后刷新；`Alembic` / `AlembicPlugin` 仍等待总控验收后启动。下一步建议：总控复核三个上游回填后，再启动 V020-2 / V020-3。
- 2026-05-22：总控复核 V020-1：`AlembicCore` 与 `AlembicDashboard` 通过；`AlembicAgent` 需要 V020-1R 返工。复核命令确认 `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 三个子仓库工作区干净，三者 root package / root lock 均为 `0.2.0`；但 `nl -ba AlembicAgent/package-lock.json | sed -n '1,70p'` 和 JSON 检查确认 `packages["../AlembicCore"].version` 仍为 `0.1.0`。这属于当前 lockfile 中 Alembic 自有版本位，不是历史文档或第三方依赖，因此 V020-2 / V020-3 继续阻塞，当前只派发 `AlembicAgent` 刷新 lockfile snapshot。
- 2026-05-22：`AlembicAgent` V020-1R 已完成并待总控验收。完成范围：`package-lock.json` 中 `packages["../AlembicCore"].version` 从 `0.1.0` 刷新为 `0.2.0`，未修改第三方依赖或其它仓库。提交 hash：`9de2cd9`。验证命令：`node -e "const l=require('./package-lock.json'); console.log(l.packages['../AlembicCore']?.version)"`；`rg -n '"version": "0\\.1\\.0"|@alembic/agent.*0\\.1\\.0|@alembic/core.*0\\.1\\.0' package.json package-lock.json src test scripts`；`npm run build`；`npm run test`；`git diff --check`。验证结果：Core snapshot 读取为 `0.2.0`；目标残留扫描无命中；build 通过；test 通过，19 个测试文件 / 87 个测试用例；`git diff --check` 通过。执行记录：`docs/AlembicAgent/alembic-0-2-0-version-unification-agent-2026-05-22.md`。遗留风险：下游 `Alembic` publish staging 与 `AlembicPlugin` runtime / channel / cache 仍需后续阶段重新生成并验证。下一步建议：总控复核后解除 V020-2 / V020-3 阻塞。
- 2026-05-22：总控复核 V020-1R 通过。复核命令确认 `AlembicAgent` 工作区干净，HEAD 为 `9de2cd97c3f4962a8b19595b76eeb7df00f853f5`；`package.json`、root lock、`packages["../AlembicCore"].version` 均为 `0.2.0`；目标残留扫描 `rg -n '"version": "0\\.1\\.0"|@alembic/agent.*0\\.1\\.0|@alembic/core.*0\\.1\\.0' AlembicAgent/package.json AlembicAgent/package-lock.json AlembicAgent/src AlembicAgent/test AlembicAgent/scripts` 无命中。V020-2 / V020-3 阻塞解除，当前派发 `Alembic` 与 `AlembicPlugin` 并行执行；`AlembicWorkspace` V020-4 等 Plugin 回填后刷新本机 Codex plugin cache。
- 2026-05-22：`Alembic` V020-2 已完成并回填。完成范围：`package.json` / `package-lock.json` 中 `alembic-ai` root 版本与本地 `../AlembicCore`、`../AlembicAgent` snapshot 统一到 `0.2.0`；重新生成 `.release/alembic-ai`，staging manifest 为 `alembic-ai@0.2.0`，依赖为 `@alembic/core@0.2.0`、`@alembic/agent@0.2.0`，release source metadata 中 `AlembicDashboard` package version 为 `0.2.0`；修正 `release:package-guard`，让它校验 staging publish boundary 而不是误判 root 开发态 file 依赖。提交 hash：`1656c67484b99bf9326af34102e936f18073b9aa`。执行记录：[../Alembic/alembic-0-2-0-version-unification-main-2026-05-22.md](../Alembic/alembic-0-2-0-version-unification-main-2026-05-22.md)。验证：`npm run build:check`、`npm run build`、`npm run release:staging:prepare`、`npm run release:staging:pack`、`npm run release:package-guard`、目标残留扫描、`git diff --check` 均通过；计划 `rg` 负向扫描仅剩第三方 `powershell-utils@0.1.0`，不属于 Alembic 自有版本位。遗留风险：`.release/` 为忽略目录，发布前需按流程重新生成 staging。下一步建议：等待 `AlembicPlugin` V020-3 后进入 V020-4 cache refresh。
- 2026-05-22：`AlembicPlugin` V020-3 已完成并回填。完成范围：root `alembic-ai@0.2.0`、root lock 和 `../AlembicCore` snapshot 已到 `0.2.0`；Codex plugin manifest / shell package / channel / README / `PLUGIN-SOURCE.json` 已到 `0.2.0`；`CodexMcpServer` version 改为读取 package manifest；cache sync 移除旧 `0.1.1` fallback；相关测试改为从 package / plugin manifest 派生版本；`prepare:codex-plugin-runtime` 已重建 runtime package、runtime shell snapshot、embedded Core package 和 `runtime.tgz`。提交 hash：`9a2be1f88254fbb5604ce125706185bba77a5ac3`；AlembicCodex runtime artifact 提交：`36385f7a89d2e473727b8895c5b72b29a01e2e9f`。执行记录：[../AlembicPlugin/alembic-0-2-0-version-unification-plugin-2026-05-22.md](../AlembicPlugin/alembic-0-2-0-version-unification-plugin-2026-05-22.md)。验证：`npm run build:check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run verify:release-package-boundary`、`npm run verify:codex-session`、相关单元测试、lint、负向扫描、`git diff --check` 均通过。计划宽松 `rg` 仅剩第三方 `github-from-package@0.0.0` 与 fixture `AFNetworking 4.0.1.2`；但总控复核补扫发现另有 `ResidentSearchClient` daemon state fixture `0.1.0`。遗留风险：本窗口未刷新 `$CODEX_HOME/plugins/cache`，需总控 V020-4 复核后执行 cache refresh。
- 2026-05-22：总控复核 V020-2 / V020-3。`Alembic` V020-2 通过：实体 manifest 与 staging metadata 均为 `0.2.0`，残留命中仅为第三方 `powershell-utils@0.1.0` / lockfile 第三方 `0.0.0`。`AlembicPlugin` V020-3 主体产物基本通过：root/plugin/channel/runtime/embedded Core 均为 `0.2.0`，工作区干净；但精确扫描命中 `AlembicPlugin/test/unit/ResidentSearchClient.test.ts:22` 的 daemon state fixture `version: '0.1.0'`。该值表示 Alembic daemon state 版本，是当前测试口径中的 Alembic 自有版本残留，不属于第三方依赖或历史文档，因此 V020-4 cache refresh 继续阻塞，当前只派发 `AlembicPlugin` 做 V020-3R 小返工。
