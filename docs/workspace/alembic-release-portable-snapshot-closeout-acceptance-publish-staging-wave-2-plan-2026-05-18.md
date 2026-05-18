# Alembic Release Portable Snapshot Closeout Acceptance And Publish Staging Wave 2 Plan

日期：2026-05-18

状态：待启动

## 总控验收结论

`alembic-release-portable-snapshot-closeout-workspace-plan-2026-05-18.md` 本轮通过总控验收。

本轮交付的不是“立刻可以 npm publish”，而是把本地源码优先与发布/便携交付边界分开，并为错误发布建立硬闸：

- `AlembicCore` 已具备 `@alembic/core` release readiness baseline。
- `AlembicAgent` 保留 `@alembic/core: file:../AlembicCore` 日常开发入口，并在 root pack/publish 前阻断 `file:../...`。
- `Alembic` 保留本地 Core / Agent / Dashboard 入口，并在 root publish 前阻断 `file:../...` 与 `alembic-ai` 包名冲突。
- `AlembicPlugin` 保留 root local Core dev 入口；Codex embedded runtime 继续使用 `file:vendor/AlembicCore`，并已验证 `.alembic-source.json` source metadata。
- `AlembicDashboard` 仍为观察窗口；`BiliDili` 无任务。

## 总控复验

工作区状态：

- `AlembicCore`：clean，HEAD `abcf84f chore: add core release readiness guard`
- `AlembicAgent`：clean，HEAD `019022b Guard agent package release manifest`
- `Alembic`：clean，HEAD `9813101 chore: guard main release package boundary`
- `AlembicPlugin`：clean，HEAD `3a5a492 chore: gate plugin release portable snapshots`
- `AlembicPlugin/plugins/alembic-codex`：clean，HEAD `7544898 build: refresh portable runtime release metadata`

总控实际运行命令：

| 窗口 | 命令 | 结果 |
| --- | --- | --- |
| `AlembicCore` | `npm run release:check` | 通过；`@alembic/core@0.1.0`，source commit `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`，pack entries 716，working tree dirty `no`。 |
| `AlembicAgent` | `npm run release:package-guard` | 预期失败；阻断 `package.json` 与 root lockfile 中的 `@alembic/core=file:../AlembicCore`。 |
| `AlembicAgent` | `npm run smoke:public-imports` | 通过；15 public subpaths imported。 |
| `Alembic` | `npm run release:package-guard` | 预期失败；阻断 `@alembic/agent=file:../AlembicAgent`、`@alembic/core=file:../AlembicCore`、lockfile local links 和 `alembic-ai` 包名归属未确认。 |
| `Alembic` | workflow YAML parse | 通过；`.github/workflows/ci.yml` 和 `.github/workflows/release.yml` 可解析。 |
| `AlembicPlugin` | `npm run verify:release-package-boundary` | 通过；root publish blocked，embedded runtime dependency 为 `file:vendor/AlembicCore`，embedded Core source 为 `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。 |
| `AlembicPlugin` | `node scripts/verify-release-package-boundary.mjs --publish` | 预期失败；阻断 root package `@alembic/core=file:../AlembicCore` 发布泄漏。 |
| `AlembicPlugin` | `npm run verify:codex-plugin` | 通过；`./runtime.tgz -> alembic-ai@0.1.2`。 |
| `AlembicPlugin` | workflow YAML parse | 通过；`.github/workflows/ci.yml` 和 `.github/workflows/release.yml` 可解析。 |
| 跨仓库 | release boundary `rg` scan | 通过；`file:../...` 只保留在 root dev package/lockfile 并被 hard gate 捕获；`file:vendor/AlembicCore` 只保留在 Plugin embedded runtime 允许例外中。 |

总控修正：

- `docs/AlembicAgent/alembic-agent-release-package-boundary-2026-05-18.md` 中的 Core baseline 已从旧 `b904b66907e16e61f29a6dc0eeedc59231ddfb53` 修正为当前验收基线 `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。

## 架构判断

本轮发现的重复和边界问题：

1. `Alembic` 与 `AlembicPlugin` 同时使用 root npm package name `alembic-ai`。这是发布层面的真实冲突，不能只靠两个 hard gate 长期维持。
2. `AlembicAgent` 与 `Alembic` 需要 publish staging manifest 逻辑，把日常 `file:../...` dev manifest 转成可发布 registry dependency；`AlembicPlugin` 则需要从 root npm publish 逻辑中退出，转为 artifact-only release。
3. `AlembicPlugin` 的 `file:vendor/AlembicCore` 不是重复实现，也不是要删除的 vendor 回退；它是 Codex portable runtime 的必要快照。

用户纠正后的总控决策：

- `alembic-ai` 由 `Alembic` 主仓库拥有，用于 Alembic npm 包发布。
- `AlembicPlugin` 不走 npm registry 包发布；它产出 Codex 插件产物、channel / marketplace 资源和 portable runtime artifact。
- `AlembicPlugin` 可以继续生成本地 `runtime.tgz` 这类 package-like portable artifact，但这不是 registry npm package ownership。embedded runtime 继续允许 `@alembic/core: file:vendor/AlembicCore` 并记录 source metadata。
- `@alembic/core` 是第一发布包；`@alembic/agent` 依赖 `@alembic/core`；`Alembic` 的 `alembic-ai` publish staging 依赖 registry `@alembic/core` 和 `@alembic/agent`。

## Wave 2 目标

把 release hard gate 从“只会失败保护”推进到“有明确 staging 和包名归属”的状态：

1. `AlembicCore` 补齐真实 release workflow / playbook，使 `@alembic/core` 能作为下游 registry dependency 的源头。
2. `AlembicAgent` 补齐 publish staging manifest / pack preview：开发 manifest 保持 `file:../AlembicCore`，staging manifest 使用 registry `@alembic/core`。
3. `Alembic` 补齐 `alembic-ai` publish staging manifest / pack preview：开发 manifest 继续使用 local source，staging manifest 使用 registry `@alembic/core` 与 `@alembic/agent`。
4. `AlembicPlugin` 退出 root npm registry publish 链路，改为只产出 Codex 插件产物和 portable runtime artifact；release workflow 不再发布 root npm package。

## 窗口分派

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicCore` | 待启动 | 补齐 `@alembic/core` release workflow / playbook。要求保留 `release:check`，新增 tag/release 发布入口或明确 dry-run release staging，并记录 source commit、pack contents、npm provenance/registry 前置条件。 | 新建 | `docs/AlembicCore/alembic-core-release-workflow-wave-2-2026-05-18.md` | 本文“窗口分派” | 本文“回填区 / AlembicCore” | `npm run check`；`npm run build`；`npm run smoke:public-api`；`npm run release:check`；workflow YAML parse；`npm pack --dry-run --json` | 下游 staging manifest 使用 Core version 前，必须先有 Core release workflow 或明确 dry-run 口径。 |
| `AlembicAgent` | 待启动 | 新增 Agent publish staging manifest / pack preview。开发 `package.json` 继续 `@alembic/core: file:../AlembicCore`；staging manifest 必须替换为 registry `@alembic/core` 版本并记录 Core source commit；root `prepack` hard gate 继续保留，不能为了 staging 破坏日常 dev manifest。 | 新建 | `docs/AlembicAgent/alembic-agent-publish-staging-wave-2-2026-05-18.md` | 本文“窗口分派” | 本文“回填区 / AlembicAgent” | `npm run check`；`npm run smoke:public-imports`；`npm run release:package-guard` 预期失败；新增 staging pack/verify 命令通过；`npm pack --dry-run` 在 staging 目录通过 | 依赖 Core release baseline；不得复制 Core 源码进 Agent。 |
| `Alembic` | 待启动 | 作为 `alembic-ai` owner，新增/调整 publish staging manifest / pack preview。开发 `package.json` 继续 local-source-first；staging manifest 必须使用 registry `@alembic/core` 与 `@alembic/agent`，并记录 Core / Agent source commits；release workflow 应发布 staging package，而不是 dev root。 | 新建 | `docs/Alembic/alembic-ai-publish-staging-wave-2-2026-05-18.md` | 本文“窗口分派” | 本文“回填区 / Alembic” | `npm run build:check`；`npm run check` 或范围内等价命令；`npm run release:package-guard` 预期失败；新增 staging pack/verify 命令通过；workflow YAML parse；`npm pack --dry-run` 在 staging 目录通过 | 依赖 Core / Agent release baseline；不得改回 vendor 日常入口。 |
| `AlembicPlugin` | 待启动 | 退出 root npm registry publish 链路，改为只产出 Codex 插件产物和 portable runtime artifact。移除或禁用 release workflow 的 root `npm publish`；更新 `prepublishOnly`、release playbook 和 package boundary 文案，明确 `runtime.tgz` 是插件 artifact，不是 registry npm package。embedded runtime 继续 `file:vendor/AlembicCore` 且 source metadata 必须保留。 | 新建 | `docs/AlembicPlugin/alembic-plugin-artifact-release-no-npm-wave-2-2026-05-18.md` | 本文“窗口分派” | 本文“回填区 / AlembicPlugin” | `npm run build:check`；`npm run prepare:codex-plugin-runtime`；`npm run verify:codex-plugin`；`npm run verify:release-package-boundary`；`npm run smoke:codex-plugin` 按范围运行；workflow YAML parse；负向扫描 root `npm publish` | 不得删除 embedded `vendor/AlembicCore` 例外，不得重新引入 `@alembic/agent`，不得发布 root npm package。 |
| `AlembicDashboard` | 观察中 | 本轮不改 Dashboard 源码，只作为 Alembic / AlembicPlugin release workflow sibling build source。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / AlembicDashboard” | 无 | 若外层 workflow 发现 Dashboard build source 需要调整，再追加任务。 |
| `BiliDili` | 无任务 | 当前是 release staging / package ownership，不涉及真实 iOS/Swift 测试项目。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / BiliDili” | 无 | 默认不进入 Alembic 日常流程。 |

## 顺序

可以并行执行，但真实发布解除顺序必须是：

1. `AlembicCore` 完成 release workflow / baseline。
2. `AlembicAgent` 完成 staging manifest，指向 Core registry version。
3. `Alembic` 完成 `alembic-ai` staging manifest，指向 Core / Agent registry versions。
4. `AlembicPlugin` 完成 root npm publish exit，只保留 plugin artifact / portable runtime 产物链路。

## 可复制提示词

发送给：`AlembicCore`、`AlembicAgent`、`Alembic`、`AlembicPlugin`

```text
读取 docs/workspace/alembic-release-portable-snapshot-closeout-acceptance-publish-staging-wave-2-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送窗口：`AlembicDashboard`、`BiliDili`

## 回填区

### AlembicCore

- 状态：
- 完成范围：
- 提交 hash：
- 验证命令：
- 验证结果：
- 遗留风险：
- 下一步建议：

### AlembicAgent

- 状态：
- 完成范围：
- 提交 hash：
- 验证命令：
- 验证结果：
- 遗留风险：
- 下一步建议：

### Alembic

- 状态：
- 完成范围：
- 提交 hash：
- 验证命令：
- 验证结果：
- 遗留风险：
- 下一步建议：

### AlembicPlugin

- 状态：
- 完成范围：
- 提交 hash：
- 验证命令：
- 验证结果：
- 遗留风险：
- 下一步建议：

### AlembicDashboard

- 状态：观察中
- 观察结论：

### BiliDili

- 状态：无任务
- 判断理由：
