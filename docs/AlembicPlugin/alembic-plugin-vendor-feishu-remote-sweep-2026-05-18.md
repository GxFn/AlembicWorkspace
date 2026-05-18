# AlembicPlugin Vendor Feishu Remote Sweep

日期：2026-05-18
窗口：AlembicPlugin
状态：已完成
总控入口：`docs/workspace/alembic-feishu-remote-removal-plan-2026-05-17.md`

## 1. 完成范围

- `vendor/AlembicCore` 已从 `6b7b52a17fe214816c41344860caeb8bf35f1923` 同步到 `0c64fd7549d58ceded8eed163dae85c6678ea679`。
- `vendor/AlembicDashboard` 已从 `bea8cd4b481b27a395456cb3936073729c8a6493` 同步到 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`。
- 清理 `vendor/AlembicCore` 的 ignored stale `dist/`，避免旧 `003_add_remote_commands` 生成物继续进入 Codex plugin runtime。
- 重新构建 Plugin、Core 和 Dashboard，并重新生成 `plugins/alembic-codex/runtime` 与 `plugins/alembic-codex/runtime.tgz`。
- 清理 AlembicPlugin `CHANGELOG.md` 中历史 Feishu/Lark 字样，避免 package-facing 文档继续携带 Lark 文案。
- 确认 Codex plugin runtime/package/channel 产物不带 `remote_commands`、`remote_state`、`remote-exec`、Feishu/Lark remote runtime symbols。

## 2. 提交

- AlembicPlugin 提交：`106ed71716e12db5c4c00a54b23984a40b5737b1`
- AlembicPlugin 提交说明：`chore: sweep feishu remote from plugin runtime`
- `plugins/alembic-codex` 子仓库提交：`d97fd7ac8364e26aa20513cb44ed5559a72a236f`
- `plugins/alembic-codex` 子仓库提交说明：`build: refresh runtime after remote schema removal`

## 3. 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run check` | 通过；`typecheck` 通过；Biome 仍报告既有 123 warnings / 29 infos，退出码 0；Core import boundary 扫描 315 个文件和 517 个 `@alembic/core` imports，通过。 |
| `npm run build` | 通过；重新构建 vendor Core 和 Plugin dist，`postbuild` 通过。 |
| `npm run build:dashboard` | 通过；vendor Dashboard build 成功并复制到 `dashboard/dist`；仅保留既有 Vite large chunk warning。 |
| `npm run prepare:codex-plugin-runtime` | 通过；重新生成 `plugins/alembic-codex/runtime` 和 `runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过；`runtime.tgz` 验证为 `alembic-ai@0.1.2`。 |
| `npm run verify:codex-channel` | 通过；Codex channel 验证为 `alembic-ai@0.1.2`。 |
| `npm run smoke:codex-plugin` | 通过；`install`、`stdio`、`npxRuntime` 均为 `passed`；`recovery` 和 `daemon` 为 `skipped`。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

## 4. 负向扫描剩余命中

严格 remote runtime 扫描：

```text
rg -n "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|remote_commands|remote_state|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|Channel\\.LARK|LARK_MESSAGE|fromLark|remote-exec" . --glob '!**/node_modules/**' --glob '!**/.git/**' --glob '!docs/**'
```

剩余命中：

- `vendor/AlembicCore/test/DatabaseRepository.test.ts` 中 `remote_commands` / `remote_state` 不存在断言，属于 Core Wave 2 验收证据。

package/channel/doc-facing 扫描：

```text
rg -n -i "lark|飞书|feishu|remote-exec|remote exec|remote_commands|remote_state" package.json package-lock.json README.md README_CN.md CHANGELOG.md channels plugins/alembic-codex/.codex-plugin plugins/alembic-codex/.mcp.json plugins/alembic-codex/.agents .agents --glob '!**/node_modules/**' --glob '!**/.git/**'
```

结果：无命中。

runtime / tarball 扫描：

```text
rg -n -i "lark|飞书|feishu|remote-exec|remote exec|remote_commands|remote_state" plugins/alembic-codex/runtime plugins/alembic-codex/.codex-plugin plugins/alembic-codex/.mcp.json plugins/alembic-codex/.agents channels .agents package.json package-lock.json --glob '!**/node_modules/**' --glob '!**/.git/**'
tar -tzf plugins/alembic-codex/runtime.tgz | rg -n "003_add_remote_commands|remote_commands|remote_state|remote-exec|feishu|飞书|@larksuiteoapi|ALEMBIC_LARK"
```

剩余命中分类：

- runtime 宽松 `lark` 扫描仅剩 `StarlarkParser` / `parseStarlarkBuildFile` / `starlark`，属于 Bazel / Buck / Pants Starlark parser，非 Feishu/Lark remote。
- `runtime.tgz` 严格 remote tarball 扫描无命中。
- `vendor/AlembicCore/dist/infrastructure/database/migrations` 已不包含 `003_add_remote_commands`。

其它宽松源码扫描剩余命中：

- `vendor/AlembicCore/AGENTS.md` 中“Core 不包含 ... Lark 集成”的边界说明，非 runtime、非 package/channel 文案。
- `vendor/AlembicCore/src` / `test` 中 Starlark parser 命中，属于计划明确允许的误伤。

## 5. 遗留风险

- `npm run check` 仍输出既有 Biome warnings / infos；本轮未扩大到样式债清理。
- `npm run smoke:codex-plugin` 默认不启动 live daemon，`recovery` / `daemon` 按脚本为 `skipped`；如发布前需要 live daemon 证据，需要额外运行 daemon smoke。
- Core 旧开发库不做 drop migration 是 Wave 2 用户决策；旧库如仍有 `remote_commands` / `remote_state`，需要重建数据库。
- `vendor/AlembicCore/AGENTS.md` 的 Lark 边界说明不是 runtime 残留；如果最终总控要求关键词绝对归零，应由 Core 后续文案清理统一处理。

## 6. 下一步建议

- 由总控执行最终跨仓库负向扫描，确认 Alembic 与 AlembicPlugin vendor/runtime sweep 均已纳入。
- 如准备真实 Codex plugin 发布，重复本页 release gate，并按需补 `smoke:codex-plugin -- --daemon`。
- 后续 AlembicPlugin 同步 Core vendor 时，必须先清理 ignored stale `vendor/AlembicCore/dist`，再构建并 prepare runtime，避免旧生成物重新进入 `runtime.tgz`。
