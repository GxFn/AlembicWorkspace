# Alembic 0.2.0 Version Unification Workspace Plan

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：V020-1R 待启动（`AlembicAgent` lockfile Core snapshot 返工）
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
3. `AlembicPlugin` 读取 `AlembicCore` 生成 portable runtime / embedded Core snapshot，所以必须等 `AlembicCore` 回填后启动。
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
| V020-1 | 部分完成 | `AlembicCore` / `AlembicAgent` / `AlembicDashboard` | 上游源 package version 统一为 `0.2.0`，同步 lockfile 和必要测试断言。 | `AlembicCore` 与 `AlembicDashboard` 已通过总控复核；`AlembicAgent` package/root lock 已到 `0.2.0`，但 lockfile `../AlembicCore` snapshot 仍是 `0.1.0`。 | 否 |
| V020-1R | 待启动 | `AlembicAgent` | 在 Core 已完成 `0.2.0` 后，刷新 Agent lockfile 中 `../AlembicCore` snapshot 到 `0.2.0` 并补验证。 | AlembicAgent 返工提交 hash、残留扫描和验证回填。 | 是 |
| V020-2 | 阻塞 | `Alembic` | 在上游版本完成后，更新 `alembic-ai` 源 manifest / lock / release staging 到 `0.2.0`。 | Alembic 提交 hash、`.release/alembic-ai` staging 证据、release boundary 验证。 | 否，等待 V020-1R |
| V020-3 | 阻塞 | `AlembicPlugin` | 在上游版本完成后，更新 root/plugin/channel/runtime 到 `0.2.0`，消除 `0.1.1` hardcode / fallback，重新生成 Codex runtime。 | AlembicPlugin 提交 hash、AlembicCodex runtime artifact 提交 hash、plugin/channel/session 验证。 | 否，等待 V020-1R |
| V020-4 | 阻塞 | `AlembicWorkspace` | 验收 V020-2/V020-3，刷新本机 Codex plugin cache 到 `0.2.0`，记录部署缓存证据。 | cache marker、workspace 文档提交。 | 否，等待下游回填 |

## 窗口分派

当前只发送 `AlembicAgent` 做 V020-1R 返工。`Alembic` 和 `AlembicPlugin` 继续不发送，避免在上游 lockfile 仍残留 `0.1.0` 时生成不完整发布口径。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>阻塞 | 等 V020-1R 修掉 `AlembicAgent` lockfile 中 `../AlembicCore` snapshot `0.1.0` 后，再更新 root `alembic-ai@0.2.0`、lockfile、publish staging 与 release metadata。 |
| `AlembicCore`<br>已完成 | V020-1 总控复核通过：提交 `f30beacedf89abab13b91e87e4686d0db38e7d29`，`@alembic/core` package / lock root 自有版本已统一为 `0.2.0`，目标残留扫描无命中。 |
| `AlembicAgent`<br>待启动 | V020-1R 返工：在 Core 已是 `0.2.0` 后刷新 `package-lock.json` 中 `../AlembicCore` snapshot，当前残留为 `AlembicAgent/package-lock.json:30` 的 `"version": "0.1.0"`。 |
| `AlembicDashboard`<br>已完成 | V020-1 总控复核通过：提交 `5160a2a0fb164005f1922b8f58f28ca0ec88df56`，私有 `alembic-dashboard` package / lock root 自有版本已统一为 `0.2.0`。 |
| `AlembicPlugin`<br>阻塞 | 等 V020-1R 完成后再更新 root/plugin/channel/runtime/cache 版本，不提前生成 runtime。 |
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

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V020-TODO-1 | 已完成 | 版本源 | P0 | `AlembicCore` | `@alembic/core` 自有版本统一为 `0.2.0`。 | 是 | 总控复核通过：提交 `f30beacedf89abab13b91e87e4686d0db38e7d29`，源 package / lock 版本为 `0.2.0`，目标残留扫描无命中。 | `AlembicCore` |
| V020-TODO-2 | 待启动 | 版本源返工 | P0 | `AlembicAgent` | 刷新 `package-lock.json` 中 `../AlembicCore` snapshot 到 `0.2.0`，让 Agent 当前 lockfile 不再保留 Alembic 自有 `0.1.0` 版本位。 | 是 | Core 已完成；总控复核命中 `AlembicAgent/package-lock.json:30`。 | `AlembicAgent` |
| V020-TODO-3 | 已完成 | 版本源 | P1 | `AlembicDashboard` | 私有 `alembic-dashboard` 自有 package version 统一为 `0.2.0`。 | 是 | 总控复核通过：提交 `5160a2a0fb164005f1922b8f58f28ca0ec88df56`，源 package / lock 版本为 `0.2.0`；`package-lock.json` 中第三方 `0.1.0` 不属于本轮自有版本位。 | `AlembicDashboard` |
| V020-TODO-4 | 阻塞 | release staging | P0 | `Alembic` | root / lock / `.release/alembic-ai` 统一为 `0.2.0`，staging dependency replacement 读取上游 `0.2.0`。 | 是 | 等 V020-1R。 | `Alembic` |
| V020-TODO-5 | 阻塞 | Codex plugin runtime | P0 | `AlembicPlugin` | root / plugin manifest / channel / runtime / tests / MCP metadata / cache sync fallback 统一为 `0.2.0`。 | 是 | 等 V020-1R。 | `AlembicPlugin` |
| V020-TODO-6 | 阻塞 | 部署缓存 | P0 | `AlembicWorkspace` | 验收后刷新本机 Codex plugin cache 到 `0.2.0`，记录 marker 和当前加载路径。 | 是 | 等 `AlembicPlugin` V020-3 回填。 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 阻塞 | 否 | publish staging 读取 Core / Agent / Dashboard 版本，等 Agent lockfile 返工完成后启动。 |
| `AlembicCore` | 已完成 | 否 | V020-1 已通过总控复核。 |
| `AlembicAgent` | 待启动 | 是 | 当前唯一返工项，需刷新 lockfile 中 `../AlembicCore` snapshot。 |
| `AlembicDashboard` | 已完成 | 否 | V020-1 已通过总控复核。 |
| `AlembicPlugin` | 阻塞 | 否 | 等 Agent lockfile 返工完成后再进入下游 runtime / cache 版本统一。 |
| `AlembicTest` | 观察 | 否 | 本轮不是真实项目行为变更；如需复测后续单独建测试单。 |
| `BiliDili` | 无任务 | 否 | 不改真实项目源码。 |

## 可复制分派提示词

发送给：`AlembicAgent`。

```text
读取 docs/workspace/alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md，按照文档，领取并完成分配给你所在窗口的 V020-1R 返工任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicCore`（已完成）、`AlembicDashboard`（已完成）、`Alembic`（阻塞等待 V020-1R）、`AlembicPlugin`（阻塞等待 V020-1R）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

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
