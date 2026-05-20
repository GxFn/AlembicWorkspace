# AlembicPlugin Runtime Pin Cache Refresh Wave 5

更新日期：2026-05-20
执行窗口：AlembicPlugin
状态：已完成

## 结论

本轮 `PLUGIN_RUNTIME_PIN_MISMATCH` 不是 AlembicPlugin source repo 的发布配置缺陷，而是本机 Codex plugin cache 曾被开发态 `--local-mcp` 同步改写，导致缓存里的 `.mcp.json` 指向本地 `dist/bin/codex-mcp.js`，没有走插件内 `./bin/alembic-codex-mcp-wrapper.mjs` 和 `./runtime.tgz`。

已将本机 Codex plugin cache 恢复为 packaged runtime 模式。AlembicPlugin 源码、runtime artifact、AlembicCodex 子仓均无新增代码改动。

## 完成范围

- 复现 `BiliDili` 项目诊断：`PLUGIN_RUNTIME_PIN_MISMATCH` 来自缓存 `.mcp.json`，不是 source repo `.mcp.json`。
- 复核 source repo：
  - `plugins/alembic-codex/.mcp.json` 使用 `node ./bin/alembic-codex-mcp-wrapper.mjs`。
  - `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs` 使用 `npx -y --offline --package ./runtime.tgz alembic-codex-mcp`。
  - wrapper 仍带插件专用 npm cache 和 startup lock。
- 执行 cache refresh：
  - dry-run 确认目标为 `$CODEX_HOME/plugins/cache/gxfn/alembic-codex/0.1.2`。
  - 实际执行 `npm run dev:codex-plugin:sync -- --all-installed`，将缓存恢复为 packaged runtime。
  - 缓存刷新 marker 记录 `mode=packaged-runtime`、`localMcpEntry=null`、source git head `2f5fd8dde85f8e83336e519b4c93da288cea41c5`。
- 重新执行 `npm run prepare:codex-plugin-runtime`，确认 source runtime artifact 可重新生成且没有产生仓库 diff。
- 通过 installed packaged probe 验证缓存内 wrapper / `runtime.tgz` 可启动，并保持 projectRoot explicit / saved / fail-closed 行为。

## 提交 Hash

- AlembicPlugin source repo：无新增提交；当前 HEAD `2f5fd8dde85f8e83336e519b4c93da288cea41c5`。
- AlembicCodex runtime artifact repo：无新增提交；当前 HEAD `1a896fd714a34a1aa08b2fd53d7386227097cb57`。
- 本轮实际修复对象：本机 Codex plugin cache，非 git-tracked source 文件。

## 验证命令与结果

- `alembic_codex_diagnostics --projectRoot ../BiliDili`：修复前复现 `PLUGIN_RUNTIME_PIN_MISMATCH`；修复后 `plugin.mcp.ok=true`、`embeddedRuntime=true`、`packagePin=true`，不再报告 `PLUGIN_RUNTIME_PIN_MISMATCH`。
- `npm run dev:codex-plugin:sync -- --dry-run --all-installed`：通过，目标 cache root 为 `$CODEX_HOME/plugins/cache/gxfn/alembic-codex/0.1.2`。
- `npm run dev:codex-plugin:sync -- --all-installed`：通过，缓存 marker 为 `mode=packaged-runtime`。
- `npm run prepare:codex-plugin-runtime`：通过，没有产生 AlembicPlugin / AlembicCodex git diff。
- `npm run check`：通过；Biome 仍输出既有 warning，但没有 error，core import boundary 通过。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm --version` 和 `npx --version` 在缓存 root 下均返回 `10.9.4`。
- `npm run dev:codex-plugin:probe-installed -- --packaged --project-root ../BiliDili --no-sync`：通过，`ok=true`、`mode=packaged-runtime`，explicit / saved projectRoot 和 fail-closed probe 均符合预期。
- `git diff --check`：通过。

## 遗留风险

- 缓存刷新会替换 plugin cache 目录；如果当前 Codex 会话中的 Alembic MCP 进程仍持有旧 cache 目录作为 cwd，短时间内再次运行 diagnostics 可能出现 `NPM_UNAVAILABLE` / `NPX_UNAVAILABLE` 且错误为 `uv_cwd`。这不是 runtime pin mismatch，也不是 npm/npx 缺失；新缓存目录下直接运行 `npm` / `npx` 和 packaged probe 均已通过。
- 当前 AlembicPlugin source repo 没有新增代码 diff；总控验收时应把本轮视为本机 cache/install 状态修复，而不是 source code release。
- 若其它机器或其它 Codex profile 曾用 `npm run dev:codex-plugin:local-mcp`，需要在对应机器 / profile 上重复 packaged sync。

## 总控验收

总控于 2026-05-20 复核通过：`PLUGIN_RUNTIME_PIN_MISMATCH` 已消失，`alembic_codex_status` 显示 `plugin.mcp.ok=true`、`embeddedRuntime=true`、`packagePin=true`、wrapper 存在且带 startup lock。当前 MCP 进程仍可能因旧 cache cwd 触发 `uv_cwd` npm / npx 误报；这不属于 pin mismatch 回归，BiliDili Wave 6 会通过新会话 / 重启 MCP 后复测。

## 下一步建议

- BiliDili 复测前，优先在新 Codex 会话或重启后的 MCP 进程中再跑一次 `alembic_codex_diagnostics --projectRoot ../BiliDili`，确认 npm/npx `uv_cwd` 不再来自旧进程。
- `AlembicPlugin` 本轮已完成；后续不应为这个 cache 问题改源码或重新引入 Dashboard / daemon 能力。若新会话仍出现 `uv_cwd`，再单独派发 diagnostics cwd robustness 修复。
