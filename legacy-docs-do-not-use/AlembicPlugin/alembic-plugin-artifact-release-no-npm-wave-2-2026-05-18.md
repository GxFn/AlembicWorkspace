# AlembicPlugin Artifact Release No NPM Wave 2

日期：2026-05-18

状态：已完成

## 目标

按照 workspace 总控 Wave 2 决策，AlembicPlugin 退出 root npm registry package 发布链路，只产出 Codex 插件产物、channel / marketplace 元数据和 portable runtime artifact。embedded Codex runtime 继续保留 `@alembic/core: file:vendor/AlembicCore` 与 `.alembic-source.json` source metadata，不引入 Agent package 依赖。

## 完成范围

- root `package.json` 标记 `private: true`，`prepublishOnly` 改为 `release:root-npm-publish:disabled`，旧 root publish gate 脚本移除。
- `.github/workflows/release.yml` 从 registry publish job 改为 `build-test-artifacts`：保留 build、Dashboard build、runtime prepare、channel/plugin/boundary verify、lint、unit/integration、smoke，并上传 Codex plugin artifacts。
- `scripts/verify-release-package-boundary.mjs` 改为 artifact-only hard gate：普通 verify 通过，publish mode 永远阻断 root registry publication；同时校验 workflow 不包含 root publish 命令、包含 artifact upload、保留 `runtime.tgz`。
- `channels/codex/channel.json` 从 `registry: npm` 改为 `registry: portable-artifact`，明确 artifact 为 `plugins/alembic-codex/runtime.tgz`。
- Codex diagnostics / README / release playbook 删除全局 `alembic-ai` registry fallback 口径，改为 portable runtime artifact 指引。
- `scripts/prepare-codex-plugin-runtime.mjs` 不再把 vendored Core README 放入 runtime artifact，避免把 Core 文档中的 Agent package 文字带进 Plugin portable runtime。
- 刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`，Core source metadata 更新为 `9174c5173a7313b916b89b7c605ea2afdd874269`。

## 提交

- AlembicPlugin：`6883affe2668c33627aa5c9529e12096735f3abe`（`chore: disable root registry publish for plugin release`）
- `plugins/alembic-codex`：`dbbeb3a2da170256ed09b69b82771c6db1c7acf5`（`build: make codex runtime artifact-only`）

## 验证命令

- `npm run build:check`
- `npm run build`
- `npm run prepare:codex-plugin-runtime`
- `npm run verify:codex-plugin`
- `npm run verify:codex-channel`
- `npm run verify:release-package-boundary`
- `node scripts/verify-release-package-boundary.mjs --publish`
- `npm run smoke:codex-plugin`
- `npm run check`
- `npx vitest run --config vitest.unit.config.ts test/unit/CodexMcpServer.test.ts`
- workflow YAML parse
- root publish / global fallback / Agent package negative scan
- `git diff --check`
- `git -C plugins/alembic-codex diff --check`

## 验证结果

- `npm run build:check` 通过。
- `npm run build` 通过，Core build 使用 `../AlembicCore` commit `9174c5173a7313b916b89b7c605ea2afdd874269`。
- `npm run prepare:codex-plugin-runtime` 通过，生成 `runtime` 与 `runtime.tgz`。
- `npm run verify:codex-plugin` 通过：`./runtime.tgz -> alembic-ai@0.1.2`。
- `npm run verify:codex-channel` 通过。
- `npm run verify:release-package-boundary` 通过，root registry publish 为 disabled，embedded runtime Core dependency 为 `file:vendor/AlembicCore`，source metadata commit 为 `9174c5173a7313b916b89b7c605ea2afdd874269`。
- `node scripts/verify-release-package-boundary.mjs --publish` 预期失败，明确阻断 AlembicPlugin root registry publication，并保留 embedded `file:vendor/AlembicCore` 例外。
- `npm run smoke:codex-plugin` 通过：install / stdio / npxRuntime 均 passed。
- `npm run check` 通过；Biome 仍输出既有 warning/info，Core import boundary 通过。
- 聚焦单测 `CodexMcpServer.test.ts` 通过，29 tests passed。
- workflow YAML parse 通过，Release job 为 `build-test-artifacts`，包含 smoke 与 `actions/upload-artifact@v5`。
- 负向扫描 0 命中：root publish 命令、全局 `alembic-ai` fallback、`npm view alembic-ai`、`dist-tags`、`@alembic/agent`、旧 publish 脚本名均未命中。
- `git diff --check` 和子仓库 `git diff --check` 均通过。

## 已知失败

额外运行的完整 `npm run test:unit` 未作为本轮 gate 通过：失败集中在既有无关测试，包括 `SearchRanking.test.ts`、`BootstrapTerminalToolset.test.ts`、`CodexPluginCacheSync.test.ts`、`SemanticMemoryCompletionStep.test.ts`、`WikiGenerator.test.ts`、`WorkflowCompletionFinalizer.test.ts`。本轮直接修改的 Codex diagnostics 单测已用聚焦命令通过。

## 遗留风险

- 本轮没有真实发布或上传 GitHub artifact，只完成本地 workflow / artifact contract。
- `runtime.tgz` 仍通过 `npx --package ./runtime.tgz` 解析生产依赖；首次运行仍可能需要网络访问依赖 registry，但这不是 root AlembicPlugin npm package 发布。
- Release workflow 仍依赖相邻 Core / Dashboard checkout 的默认分支；若正式发布需要完全冻结源快照，后续应在总控 release orchestration 中 pin 上游 refs。

## 下一步建议

- Workspace 可将 Wave 2 状态标记为已完成，后续进入真实发布前按顺序确认 `@alembic/core`、`@alembic/agent`、Alembic 主仓库 `alembic-ai` 的 registry staging / publish 权限。
- AlembicPlugin 后续只维护 Codex plugin artifact、channel / marketplace metadata、portable runtime artifact 和 Codex host adapter，不再恢复 root registry package 发布入口。
