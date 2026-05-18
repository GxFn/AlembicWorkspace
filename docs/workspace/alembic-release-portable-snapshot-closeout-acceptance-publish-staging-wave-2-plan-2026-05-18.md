# Alembic Release Portable Snapshot Closeout Acceptance And Publish Staging Wave 2 Plan

日期：2026-05-18

状态：执行中

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
| `AlembicCore` | 已完成 | 已补齐 `@alembic/core` release workflow / playbook：保留 `release:check`；新增 `workflow_dispatch` dry-run release staging 与 `v*` tag publish 入口；记录 source commit、pack contents、npm provenance / registry 前置条件；`RELEASE-PLAYBOOK.md` 已进入 pack contents。 | 已新建 | `docs/AlembicCore/alembic-core-release-workflow-wave-2-2026-05-18.md` | 本文“窗口分派” | 本文“回填区 / AlembicCore” | `npm run check`；`npm run build`；`npm run smoke:public-api`；`npm run release:check`；workflow YAML parse；`npm --cache <writable-temp-cache> pack --dry-run --json` | 已提交 `9174c5173a7313b916b89b7c605ea2afdd874269`；真实 npm publish 仍依赖 `NPM_TOKEN`、OIDC provenance 和 registry 权限。 |
| `AlembicAgent` | 已完成 | 已新增 Agent publish staging manifest / pack preview。开发 `package.json` 继续 `@alembic/core: file:../AlembicCore`；staging manifest 使用 registry `@alembic/core@0.1.0`，并记录 Core source commit；root `prepack` hard gate 继续保留。 | 已新建 | `docs/AlembicAgent/alembic-agent-publish-staging-wave-2-2026-05-18.md` | 本文“窗口分派” | 本文“回填区 / AlembicAgent” | `npm run check`；`npm run smoke:public-imports`；`npm run release:package-guard` 预期失败；`npm run release:pack-preview`；`npm --cache tmp/npm-cache pack --dry-run` 预期失败 | 已提交 `f9d020f9ebaf95499bbd6e9afbdecafa0615a865`；真实 publish 仍依赖 registry 权限、版本唯一性和后续 release workflow/orchestration。 |
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

发送给：`Alembic`、`AlembicPlugin`

已完成且当前不再发送：`AlembicCore`、`AlembicAgent`

```text
读取 docs/workspace/alembic-release-portable-snapshot-closeout-acceptance-publish-staging-wave-2-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送窗口：`AlembicDashboard`、`BiliDili`

## 回填区

### AlembicCore

- 状态：已完成
- 完成范围：新增 `.github/workflows/release.yml`，提供手动 dry-run release staging 和 `v*` tag publish 入口；新增 `RELEASE-PLAYBOOK.md`，明确 `@alembic/core` package ownership、source commit evidence、pack contents evidence、npm provenance / registry 前置条件和下游发布顺序；更新 `README.md` 当前范围与 release 入口；将 `RELEASE-PLAYBOOK.md` 纳入 package `files`，并让 `release:check` 验证 pack output 包含该 playbook。未改动下游仓库，未提交 `dist/`。
- 提交 hash：`9174c5173a7313b916b89b7c605ea2afdd874269`（`chore: add core release workflow`）
- 验证命令：`node -e "const fs=require('fs'); const yaml=require('js-yaml'); for (const f of ['.github/workflows/ci.yml','.github/workflows/release.yml']) { yaml.load(fs.readFileSync(f,'utf8')); console.log(f + ' OK'); }"`；`npm run check`；`npm run build`；`npm run smoke:public-api`；`npm run release:check`；`npm --cache <writable-temp-cache> pack --dry-run --json`；`git status --short`；`git ls-files dist | wc -l`
- 验证结果：全部通过。Workflow YAML parse 通过；`npm run check` 通过，public API boundary 136 exports classified、75 exact / 61 wildcard、stable 17 / provisional 21 / transitional 98，60 test files / 919 tests 通过；`npm run build` 通过；`npm run smoke:public-api` imported 75 exact entrypoints；提交后 `npm run release:check` 通过，source commit `9174c5173a7313b916b89b7c605ea2afdd874269`，pack entries 717，unpackedSize 22481421，working tree dirty `no`；pack dry-run 通过并包含 `RELEASE-PLAYBOOK.md`；`git status --short` 干净；`dist` tracked file count 为 `0`。
- 遗留风险：本轮没有真实 npm publish；真实发布仍依赖 GitHub secret `NPM_TOKEN`、npm package 权限、OIDC provenance 配置和 registry 上版本可用性。当前版本仍为 `0.1.0`，如果 registry 已存在同版本，发布前需要升版本再打 tag。Wildcard exports 仍是 transitional/internal migration surface。
- 下一步建议：允许 `AlembicAgent` 继续基于 Core commit `9174c5173a7313b916b89b7c605ea2afdd874269` 做 publish staging manifest；`Alembic` 等 Core / Agent registry 版本确定后再解除 `alembic-ai` staging gate；`AlembicPlugin` 继续 artifact-only release，不进入 root npm registry publish。

### AlembicAgent

- 状态：已完成
- 完成范围：新增 `scripts/stage-agent-publish-package.mjs`，生成 `tmp/release/@alembic-agent` publish staging package；根 `package.json` 继续保留 `@alembic/core: file:../AlembicCore` 日常开发入口和 root `prepack` hard gate；staging manifest 将 `@alembic/core` 替换为 registry specifier `0.1.0`，并在 staging `package.json` 的 `alembicRelease` 字段和 `.alembic-source.json` 中记录 Agent / Core source commit；新增 `release:stage` / `release:pack-preview`；补 `README.md` 说明 package 范围和 staging 入口。未复制 Core 源码，未修改其它仓库。
- 提交 hash：`f9d020f9ebaf95499bbd6e9afbdecafa0615a865`（`Add agent publish staging preview`）
- 验证命令：`npm run release:pack-preview`；`npm run release:package-guard`；`npm --cache tmp/npm-cache pack --dry-run`；`npm run check`；`npm run smoke:public-imports`；`git diff --check`；`git status --short`
- 验证结果：`npm run release:pack-preview` 通过，staging package `@alembic/agent@0.1.0` pack entries 407，`@alembic/core` registry dependency 为 `0.1.0`，Core source commit `9174c5173a7313b916b89b7c605ea2afdd874269`，提交后 Agent source commit `f9d020f9ebaf95499bbd6e9afbdecafa0615a865` 且 `agentWorkingTreeDirty: false`；`npm run release:package-guard` 预期失败并阻断 root `file:../AlembicCore`；`npm --cache tmp/npm-cache pack --dry-run` 预期失败并触发 root `prepack` hard gate；`npm run check` 通过，9 test files / 37 tests，Biome 仍显示 23 条既有 warning；`npm run smoke:public-imports` 通过，15 public subpaths imported；`git diff --check` 通过；Agent 工作区干净。
- 遗留风险：本轮没有真实 npm publish；真实发布仍依赖 `@alembic/core@0.1.0` registry 可用、`@alembic/agent` 包权限、版本唯一性、npm token/OIDC provenance 和后续 release workflow/orchestration。当前版本仍为 `0.1.0`，若 registry 已有同版本，发布前需要升版本。`release:pack-preview` 要求相邻 Core 工作区干净，否则会阻断以避免记录不精确的 Core source commit。
- 下一步建议：`Alembic` 窗口可消费 Agent staging baseline，生成 `alembic-ai` staging manifest 并记录 Core / Agent source commits；后续如要从 preview 升级为真实发布，在 AlembicAgent 增加 release workflow 或由上游 release orchestration 调用 staging package。

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
