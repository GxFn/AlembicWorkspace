# AFAPI REQ 01 Plugin Runtime Probe

日期：2026-06-06
窗口：AlembicPlugin
任务：AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME-PLUGIN-RUNTIME-PROBE-T2

## 范围

- 本轮只在 AlembicPlugin 仓库边界内执行 Codex MCP runtime / plugin cache / packaged wrapper probe。
- 不修改产品源码，不提交 runtime bundle / submodule，不代领 Alembic producer T3，不处理 AlembicCore / AlembicDashboard / AlembicTest 职责。
- 当前 TargetResultEnvelope 只作为目标窗口回填，不能替代总控验收。

## 结论

- local-dev direct-dist probe 通过：fresh installed cache 指向 `dist/bin/codex-mcp.js`，`alembic_codex_status` 读回 `projectRuntime.entryMode=local-dev-direct-dist`。
- packaged wrapper / `runtime.tgz` probe 通过：fresh installed cache 保持 wrapper + `./runtime.tgz`，`alembic_codex_status` 读回 `projectRuntime.entryMode=packaged-wrapper`。
- 多项目隔离 probe 通过：同一 installed cache 分别以 `project-alpha` / `project-beta` 启动，local-dev 与 packaged 两种入口均读回各自 `projectRoot` / `dataRoot` / `.asd/alembic.db`，未串到 installed cache、saved root 或另一个项目。
- fallback isolation 通过：`saved-project-root`、`runtime-control-selected-active`、`local-jobstore`、`embedded-plugin-owned-runtime` 均为 `effectiveIdentityAllowed=false` 且 `persistenceRootAllowed=false`。
- fail-closed 通过：无可信 projectRoot 时返回 `CODEX_PROJECT_ROOT_UNRESOLVED` 与 `needsUserInput=true`。

## 原始证据

Probe scratch 根目录：

- `AlembicPlugin/scratch/afapi-req-01-runtime-probe-2026-06-06/`

报告：

- `AlembicPlugin/scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-reload-report.json`
- `AlembicPlugin/scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-probe-report.json`
- `AlembicPlugin/scratch/afapi-req-01-runtime-probe-2026-06-06/packaged-probe-report.json`
- `AlembicPlugin/scratch/afapi-req-01-runtime-probe-2026-06-06/multi-local-alpha-report.json`
- `AlembicPlugin/scratch/afapi-req-01-runtime-probe-2026-06-06/multi-local-beta-report.json`
- `AlembicPlugin/scratch/afapi-req-01-runtime-probe-2026-06-06/multi-packaged-alpha-report.json`
- `AlembicPlugin/scratch/afapi-req-01-runtime-probe-2026-06-06/multi-packaged-beta-report.json`

代码和 artifact 证据：

- AlembicPlugin HEAD：`853aab14df934f952d6e157ab241171ef44eeb74`
- embedded plugin HEAD：`cc6316df849dc9d39530ed44d7e53f7cde2e6233`
- 本轮生成的 `runtime.tgz` sha256：`af3162eb27be0bd75ea25facbe3a1023677731238e2a64576ab874fa31c3843a`
- 本轮 `prepare:codex-plugin-runtime` 将 embedded Core source marker 从 `e3eda0450db9d27974c1ef1f945fb5a5f4793ea0` 刷到 workspace Core `9e51506be3c9078e44643346fa4a7d4d1271e716`。

## 实际命令

以下命令均在 `AlembicPlugin/` 执行，路径按仓库相对形式归一化：

```bash
node scripts/dev-reload-codex-plugin.mjs --codex-home scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-codex-home --sync-target scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-installed-cache --project-root <AlembicPlugin> --report-path scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-reload-report.json --probe-report-path scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-probe-report.json --mcp-timeout-ms 90000
node scripts/dev-verify-codex-plugin.mjs --packaged --skip-build --skip-tests --skip-verify --skip-smoke --codex-home scratch/afapi-req-01-runtime-probe-2026-06-06/packaged-codex-home --sync-target scratch/afapi-req-01-runtime-probe-2026-06-06/packaged-installed-cache --project-root <AlembicPlugin> --report-path scratch/afapi-req-01-runtime-probe-2026-06-06/packaged-probe-report.json --mcp-timeout-ms 180000
node scripts/dev-verify-codex-plugin.mjs --probe-only --codex-home scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-codex-home --probe-target scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-installed-cache --project-root scratch/afapi-req-01-runtime-probe-2026-06-06/project-alpha --report-path scratch/afapi-req-01-runtime-probe-2026-06-06/multi-local-alpha-report.json --mcp-timeout-ms 90000
node scripts/dev-verify-codex-plugin.mjs --probe-only --codex-home scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-codex-home --probe-target scratch/afapi-req-01-runtime-probe-2026-06-06/local-dev-installed-cache --project-root scratch/afapi-req-01-runtime-probe-2026-06-06/project-beta --report-path scratch/afapi-req-01-runtime-probe-2026-06-06/multi-local-beta-report.json --mcp-timeout-ms 90000
node scripts/dev-verify-codex-plugin.mjs --probe-only --codex-home scratch/afapi-req-01-runtime-probe-2026-06-06/packaged-codex-home --probe-target scratch/afapi-req-01-runtime-probe-2026-06-06/packaged-installed-cache --project-root scratch/afapi-req-01-runtime-probe-2026-06-06/project-alpha --report-path scratch/afapi-req-01-runtime-probe-2026-06-06/multi-packaged-alpha-report.json --mcp-timeout-ms 180000
node scripts/dev-verify-codex-plugin.mjs --probe-only --codex-home scratch/afapi-req-01-runtime-probe-2026-06-06/packaged-codex-home --probe-target scratch/afapi-req-01-runtime-probe-2026-06-06/packaged-installed-cache --project-root scratch/afapi-req-01-runtime-probe-2026-06-06/project-beta --report-path scratch/afapi-req-01-runtime-probe-2026-06-06/multi-packaged-beta-report.json --mcp-timeout-ms 180000
npm test -- --run test/unit/CodexProjectRootResolver.test.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts test/unit/AlembicResidentServiceClient.test.ts test/unit/CodexDevReloadScript.test.ts test/unit/CodexPluginCacheSync.test.ts
npm run lint:repo-boundary
git diff --check
git status --short
```

## 验证结果

- `node scripts/dev-reload-codex-plugin.mjs ...`：通过；local-dev fresh MCP probe `ok=true`，两个 target 均为 `entryMode=local-dev-direct-dist`。
- `node scripts/dev-verify-codex-plugin.mjs --packaged ...`：通过；packaged fresh MCP probe `ok=true`，两个 target 均为 `entryMode=packaged-wrapper`。
- `multi-local-alpha` / `multi-local-beta`：通过；同一 local-dev installed cache 分别绑定 alpha / beta 的 dataRoot。
- `multi-packaged-alpha` / `multi-packaged-beta`：通过；同一 packaged installed cache 分别绑定 alpha / beta 的 dataRoot。
- `npm test -- --run ...`：通过，7 files / 84 tests。
- `npm run lint:repo-boundary`：通过。
- `git diff --check`：通过。

## 未修改范围

- 未修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / BiliDili。
- 未新增产品源码实现，未提交父仓库或 embedded plugin 子仓库。
- 未处理 Alembic producer-side ProjectRuntimeControl / projects route / stale selected-active cleanup；该范围属于 Alembic T3。

## 当前工作树状态

- AlembicPlugin 父仓库：`plugins/alembic-codex` 子仓库显示 dirty。
- embedded plugin 子仓库 dirty 文件：
  - `runtime.tgz`
  - `runtime/vendor/AlembicCore/.alembic-source.json`
- 上述 dirty 来自本轮 runtime probe 的 `prepare:codex-plugin-runtime` 生成物，未作为 T2 提交。
- scratch 报告目录被 git ignore，保留为本轮原始 probe evidence。

## 风险与下一步建议

- 风险：T2 证明 Plugin-owned local-dev / packaged runtime identity isolation；不证明 Alembic producer-side runtime-control source-of-truth 已清理，需等待 Alembic T3。
- 风险：`dev-verify-codex-plugin.mjs --probe-only` 的顶层 `mode` 在 packaged 单 target 复测中仍显示脚本默认值；本轮以 marker `mode=packaged-runtime`、marker `entryMode=packaged-wrapper` 和 runtime readback `entryMode=packaged-wrapper` 作为 packaged 证据。
- 建议：总控验收时独立读取上述 JSON 报告和 dirty artifact diff；若需要把 refreshed `runtime.tgz` / Core source marker 纳入发布物，再单独派 runtime artifact refresh / commit 任务，不在 T2 probe 里默认提交。
