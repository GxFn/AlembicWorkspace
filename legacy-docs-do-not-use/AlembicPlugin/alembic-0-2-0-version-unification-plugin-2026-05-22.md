# AlembicPlugin 0.2.0 版本统一执行记录

日期：2026-05-22
窗口：AlembicPlugin
阶段：V020-3
状态：总控验收通过

## 完成范围

- `AlembicPlugin` root `package.json` / `package-lock.json` 已从 `alembic-ai@0.1.2` 统一到 `0.2.0`，并将 lockfile 中本地 `../AlembicCore` snapshot 刷新为 `0.2.0`。
- Codex plugin shell 已统一到 `0.2.0`：`plugins/alembic-codex/.codex-plugin/plugin.json`、`plugins/alembic-codex/package.json`、`PLUGIN-SOURCE.json`、README 安装示例和 embedded runtime 文案已更新。
- `channels/codex/channel.json` 的 embedded portable runtime package version 已更新为 `0.2.0`。
- `lib/external/mcp/CodexMcpServer.ts` 不再自报旧 `0.1.1`，MCP server version 改为读取当前 package manifest。
- `scripts/sync-codex-plugin-cache.mjs` 移除了旧 `0.1.1` fallback；如果 plugin manifest 没有版本会直接失败，避免开发态 cache 同步落入旧版本槽位。
- 相关单元测试改为从 package / plugin manifest 派生版本，不继续硬编码旧 `0.1.x`。
- 已重新运行 `prepare:codex-plugin-runtime`，`plugins/alembic-codex/runtime/package.json`、runtime 内 channel / plugin shell snapshot、embedded `vendor/AlembicCore/package.json` 和 `runtime.tgz` 均进入 `0.2.0` 口径。

## 提交

- AlembicPlugin：`9a2be1f88254fbb5604ce125706185bba77a5ac3`
- AlembicCodex runtime artifact：`36385f7a89d2e473727b8895c5b72b29a01e2e9f`

两个仓库均已推送到 `origin/main`，工作区干净。

## 验证命令与结果

- `npm run build:check`：通过；使用 `../AlembicCore @ f30beacedf89abab13b91e87e4686d0db38e7d29`。
- `npm run build`：通过；生成 `dist/` 并完成 `postbuild`。
- `npm run prepare:codex-plugin-runtime`：通过；输出 `alembic-ai@0.2.0` runtime 和 `plugins/alembic-codex/runtime.tgz`。
- `npm run verify:codex-plugin`：通过；`./runtime.tgz -> alembic-ai@0.2.0`。
- `npm run verify:codex-channel`：通过；channel package 为 `alembic-ai@0.2.0`。
- `npm run verify:release-package-boundary`：通过；root registry publish disabled，embedded runtime Core dependency 为 `file:vendor/AlembicCore`，embedded Core source commit 为 `f30beacedf89abab13b91e87e4686d0db38e7d29`。
- `npm run verify:codex-session`：通过；1 个测试文件 / 5 个用例。
- `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexModuleBoundary.test.ts test/unit/CodexPluginCacheSync.test.ts test/unit/CodexProjectRootResolver.test.ts`：通过；5 个测试文件 / 51 个用例。
- `npm run lint -- --diagnostic-level=error`：通过；182 个文件无错误。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

## 残留扫描

计划建议扫描：

```bash
rg -n '0\.1\.2|0\.1\.1|"version": "0\.0\.0"|alembic-codex.*0\.1\.' package.json package-lock.json lib test scripts channels .agents plugins/alembic-codex
```

结果仅剩非 Alembic 自有版本位：

- `package-lock.json` 中第三方依赖 `github-from-package@0.0.0`。
- `test/unit/CustomConfigDiscoverer.test.ts` 中 fixture `AFNetworking 4.0.1.2`，命中原因是宽松正则把 `4.0.1.2` 中的 `0.1.2` 片段识别出来。

补充精确扫描：

```bash
rg -n -P '(?<![0-9.])0\.1\.(?:1|2)(?![0-9.])|alembic-codex.*0\.1\.' package.json package-lock.json lib test scripts channels .agents plugins/alembic-codex
rg -n '"version": "0\.0\.0"' package.json plugins/alembic-codex/package.json plugins/alembic-codex/.codex-plugin/plugin.json channels .agents plugins/alembic-codex/.agents plugins/alembic-codex/PLUGIN-SOURCE.json
```

结果：均无命中。当前源码、manifest、channel、Skill shell snapshot、runtime package、embedded Core package 和 `runtime.tgz` 未发现 Alembic 自有旧版本残留。

## 遗留风险

- 本窗口未刷新 `$CODEX_HOME/plugins/cache`，这是总控 V020-4 的明确职责；本机 Codex 已安装插件缓存仍可能停留在旧版本，直到总控刷新并记录 marker。
- `.agents/plugins/marketplace.json` 和 `plugins/alembic-codex/.agents/plugins/marketplace.json` 当前没有自有 version 字段；本轮没有新增 schema 外字段，实际版本继续由 `.codex-plugin/plugin.json` 承载。
- 本轮未创建 AlembicTest 真实项目复测单；当前变更是版本源、Codex artifact 和文案/测试断言收口，真实 Codex cache 验证应在 V020-4 cache refresh 后再决定是否需要。

## 下一步建议

- AlembicWorkspace 总控进入 V020-4：复核 `AlembicPlugin` / `AlembicCodex` 提交，刷新本机 Codex plugin cache 到 `0.2.0`，记录 cache marker、加载路径和最终 workspace 文档提交。
- 如用户需要真实 Codex 安装态复测，在 V020-4 后再创建 AlembicTest 测试单；当前不建议直接改 BiliDili。

## 总控复核反馈

状态：V020-3R 已通过总控验收

总控复核确认 root/plugin/channel/runtime/embedded Core 等主体产物均已进入 `0.2.0` 口径，但补充精确扫描发现 `test/unit/ResidentSearchClient.test.ts:22` 仍有 daemon state fixture `version: '0.1.0'`。

该值表示 Alembic daemon state 版本，是当时测试口径中的 Alembic 自有版本残留，不属于第三方依赖或历史文档。因此总控曾暂缓 V020-4 cache refresh，并要求按总控计划 V020-3R 清理该 fixture、回填 targeted test 与精确残留扫描结果；该返工现已完成并通过最终验收。

## V020-3R 返工回填

状态：总控验收通过

完成范围：

- `test/unit/ResidentSearchClient.test.ts` 的 daemon state fixture 不再硬编码 `version: '0.1.0'`，改为从当前 `alembic-ai` package manifest 派生版本，避免测试口径继续保留 Alembic 自有旧版本。
- 按 V020-3R 精确扫描发现 `plugins/alembic-codex/RELEASE-PLAYBOOK.md` 与 runtime shell snapshot 中仍有 `0.1.0` tag 示例；该文件属于当前插件发布文档，不是历史归档，因此同步改为 `0.2.0` 示例。
- 重新运行 `prepare:codex-plugin-runtime`，同步 `runtime/plugins/alembic-codex/RELEASE-PLAYBOOK.md` 与 `runtime.tgz`。

提交：

- AlembicPlugin：`441029fdfcd07d85b59df13e6b8e9e2f0c728ae9`
- AlembicCodex runtime artifact：`54456b0582b3544d070b65853f6e9d6636f9280d`

验证命令与结果：

- `npm run prepare:codex-plugin-runtime`：通过；输出 `alembic-ai@0.2.0` runtime 和 `plugins/alembic-codex/runtime.tgz`。
- `npm run test:unit -- test/unit/ResidentSearchClient.test.ts`：通过；1 个测试文件 / 2 个用例。
- `rg -n -P '(?<![0-9.])0\.1\.(?:0|1|2)(?![0-9.])|alembic-(?:ai|codex|dashboard).*0\.1\.|@alembic/(?:core|agent).*0\.1\.' package.json package-lock.json lib test scripts channels .agents plugins/alembic-codex`：无命中。
- `npm run verify:codex-plugin`：通过；`./runtime.tgz -> alembic-ai@0.2.0`。
- `npm run verify:codex-channel`：通过；channel package 为 `alembic-ai@0.2.0`。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

遗留风险：

- 本窗口仍未刷新 `$CODEX_HOME/plugins/cache`，V020-4 继续由 AlembicWorkspace 总控执行。
- 本轮未创建 AlembicTest 真实项目复测单；变更集中于测试 fixture、发布文档示例和 Codex runtime artifact，同步后建议由总控先做 cache refresh 验收。

下一步状态：

- 总控已复核 AlembicPlugin `441029fdfcd07d85b59df13e6b8e9e2f0c728ae9` 与 AlembicCodex `54456b0582b3544d070b65853f6e9d6636f9280d`，并完成 V020-4 本机 Codex plugin cache refresh 到 `0.2.0`。

## 总控最终验收

状态：通过

- 总控复核确认 `AlembicPlugin` 工作区干净，HEAD 为 `441029fdfcd07d85b59df13e6b8e9e2f0c728ae9`；`plugins/alembic-codex` 工作区干净，HEAD 为 `54456b0582b3544d070b65853f6e9d6636f9280d`。
- V020-3R 精确残留扫描无命中，确认当前源码、manifest、channel、Skill shell snapshot、runtime package、embedded Core package 和 `runtime.tgz` 不再保留 Alembic 自有 `0.1.x` 版本位。
- 总控已执行 V020-4 cache refresh：`npm run dev:codex-plugin:local-mcp -- --clean --all-installed` 成功，cache 目标为 `$CODEX_HOME/plugins/cache/gxfn/alembic-codex/0.2.0`。
- cache marker 显示 `mode=local-mcp`、`gitHead=441029fdfcd07d85b59df13e6b8e9e2f0c728ae9`；cache 内 plugin manifest 为 `alembic-codex@0.2.0`，runtime package 为 `alembic-ai@0.2.0`，embedded `@alembic/core@0.2.0`。
