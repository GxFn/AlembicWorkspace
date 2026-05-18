# AlembicPlugin Npx Runtime Packaging Fix

日期：2026-05-17
窗口：AlembicPlugin
状态：已完成

本文记录 `alembic-agent-extraction-boundary-acceptance-next-plan-2026-05-17.md` 分派给 AlembicPlugin 的 P0 修复：完整 `npm run smoke:codex-plugin` 在 npx runtime 链路中无法解析 `@alembic/core`。

## 1. 问题结论

失败点不是本地 Agent / AI / Tool runtime 删除边界，而是 Codex plugin embedded runtime 的发布包不自包含：

- `runtime.tgz` 内的 `package.json` 声明 `@alembic/core: file:vendor/AlembicCore`。
- 旧 tarball 没有携带 `vendor/AlembicCore`，npx 安装后无法解析该 file dependency。
- 修复 `vendor/AlembicCore` 后，完整 smoke 又暴露出冷缓存 npx 安装会在无网络环境下超时，说明 runtime 仍依赖外部 registry 或本机缓存。

本轮修复目标因此收敛为：Codex plugin runtime tarball 必须自包含，npx 启动必须走离线安装路径。

## 2. 实现范围

AlembicPlugin 本轮只改插件发布链路，不触碰其它仓库：

- `scripts/prepare-codex-plugin-runtime.mjs`
  - 将 `vendor/AlembicCore` 复制进 embedded runtime。
  - 将生产依赖写入 `bundledDependencies`。
  - 将 root `node_modules` 复制到 runtime 打包临时目录，并把 `node_modules/@alembic/core` 替换为 packaged vendor Core 的实体副本。
  - runtime 打包改用非 JSON `npm pack` 输出解析，避免 bundled 文件列表过大导致 `spawnSync` buffer 溢出。
- `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs`
  - npx 启动参数改为 `npx -y --offline --package ./runtime.tgz alembic-codex-mcp`。
  - 设置 `npm_config_offline=true`、`npm_config_audit=false`、`npm_config_fund=false`，保留原有 per-run cache lock。
- `scripts/verify-codex-plugin.mjs`
  - 校验 wrapper 必须使用 offline npx。
  - 校验 runtime 必须携带 `vendor/AlembicCore`。
  - 校验每个生产 dependency 都进入 `bundledDependencies`。
- `scripts/smoke-codex-plugin.mjs`
  - 校验 root package 内 embedded runtime 的 vendor Core 文件。
  - 解包检查 `runtime.tgz` 中存在 `node_modules/@alembic/core`、`@modelcontextprotocol/sdk`、`better-sqlite3`。
  - 保留完整 npx runtime smoke，作为最终发布链路验收。

## 3. 边界确认

本修复没有重新引入以下能力：

- `@alembic/agent`
- `lib/agent/**`
- `lib/tools/**`
- `lib/external/ai/**`
- 本地 AI provider
- 本地 Agent tool router / capability runtime

`@alembic/core` 仍是 Plugin runtime 的 Core contract 依赖，只是从“未随包存在的 file path 假设”改为“随 runtime tarball 发布的 vendor + bundled dependency”。

无需修改 AlembicCore：当前缺口发生在 Plugin runtime 打包层，Core 已经提供可构建的 `dist`、resources 与 package metadata；Plugin 只需要在 embedded runtime 中正确携带这些产物。

## 4. 验证结果

已执行并通过：

```text
npm run prepare:codex-plugin-runtime
npm run build:check
npm run report:agent-extraction-boundary
npm run verify:codex-plugin
npm run smoke:codex-plugin
```

关键结果：

- `report:agent-extraction-boundary` 仍为 0 个 Agent / AI / Tool 边界导入。
- `verify:codex-plugin` 通过：`./runtime.tgz -> alembic-ai@0.1.2`。
- 完整 `smoke:codex-plugin` 通过，结果包含：
  - `install: passed`
  - `stdio: passed`
  - `npxRuntime: passed`
  - 未使用 `--no-npx-runtime`

## 5. 后续约束

- 后续 release / marketplace sync 必须先重新生成 embedded runtime。
- 不允许为了缩小 tarball 而移除 bundled production dependencies，除非同时提供等价的离线 npx smoke 证据。
- 如果 Core 发布形态改变，应重新评估 `@alembic/core` 在 Plugin runtime 中的表达，但不能回退到不可解析的 file dependency。
