# AlembicPlugin Diagnostics Cwd Robustness Wave 7

更新日期：2026-05-20
执行窗口：AlembicPlugin
状态：待验收

## 完成范围

- 修复 `alembic_codex_diagnostics` 对 `npm` / `npx` 的探测 cwd：不再继承可能已被删除的 MCP 进程 cwd，而是显式使用已存在的稳定目录，优先级为插件根、runtime package root、系统临时目录。
- 新增 `probeCodexRuntimeCommand()`，返回 `cwd`、`available`、`version`、`error` 和 `staleCwd`，让 diagnostics 结果能解释命令探测实际运行位置。
- 将 `uv_cwd` / stale cwd 失败从 `NPM_UNAVAILABLE` / `NPX_UNAVAILABLE` 中拆出，归类为 `CODEX_STALE_COMMAND_CWD`，行动建议改为重启 Alembic Codex MCP 进程或开启新 Codex 会话。
- 保持 `PLUGIN_RUNTIME_PIN_MISMATCH` 与 cwd failure 分类边界：只有插件 MCP 配置、wrapper、runtime artifact 或 package pin 真实不一致时才报告 pin mismatch。
- 补充 `CodexRuntimeContext` 单元测试，覆盖稳定 cwd 探测和 `uv_cwd` 失败分类，防止再次把 stale cwd 误报为用户本机缺 npm / npx。
- 刷新 AlembicCodex embedded runtime artifact，并同步本机 Codex plugin cache 到 packaged runtime；使用 BiliDili projectRoot 执行 installed packaged probe。

## 提交 Hash

- AlembicPlugin：`cfacd28434f2f669bffd5048fc5e4b9c0e95f62c`
- AlembicCodex runtime artifact：`05c77fffc91d6c991a56308eab3a71cdc3d311ab`

## 验证命令与结果

- `npx vitest run --config vitest.unit.config.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexMcpServer.test.ts`：通过，2 个测试文件、41 个测试。
- `npx biome check lib/codex/Diagnostics.ts test/unit/CodexRuntimeContext.test.ts --diagnostic-level=error`：通过。
- `npm run check`：通过；保留仓库既有 Biome warning，TypeScript 与 consumer Core import boundary 通过。
- `npm run build`：通过；使用本地 AlembicCore 构建，`postbuild` 通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run verify:release-package-boundary`：通过；root package 仍为 private，root registry publish disabled，Codex artifact release enabled，embedded runtime Core dependency 保持 `file:vendor/AlembicCore`。
- `npm run dev:codex-plugin:sync -- --all-installed`：通过，已同步本机 Codex plugin cache 到 packaged runtime。
- `npm run dev:codex-plugin:probe-installed -- --packaged --project-root ../BiliDili --no-sync`：通过，`ok=true`、`mode=packaged-runtime`。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime 通过，recovery / dashboard / daemon 按脚本规则跳过。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

## 验证结果

- AlembicPlugin source repo 已提交并推送到 `origin/main`，提交 `cfacd28434f2f669bffd5048fc5e4b9c0e95f62c`。
- AlembicCodex runtime artifact 已提交并推送到 `origin/main`，提交 `05c77fffc91d6c991a56308eab3a71cdc3d311ab`。
- `probe-installed --packaged --project-root ../BiliDili --no-sync` 已证明 packaged runtime marker / wrapper / projectRoot trust / fail-closed cache path 门禁通过。

## 遗留风险

- 本阶段验证 diagnostics 分类与 packaged plugin probe，未启动完整 BiliDili cold-start。
- 当前已经打开的 Codex 会话可能仍持有旧 MCP 进程；要验证新 diagnostics 的真实 MCP 工具输出，需要新开会话或重启 Alembic Codex MCP 后在 BiliDili 项目运行 diagnostics。
- BiliDili 真实单维度 rescan + cancel 复测仍需总控决定是否派发；本阶段未修改 BiliDili 业务源码。

## 下一步建议

- 总控验收 AlembicPlugin Wave 7 提交和 packaged runtime artifact。
- 验收通过后，再回到 BiliDili 执行 diagnostics 门禁；门禁通过后才允许单维度 rescan + cancel 复测。
