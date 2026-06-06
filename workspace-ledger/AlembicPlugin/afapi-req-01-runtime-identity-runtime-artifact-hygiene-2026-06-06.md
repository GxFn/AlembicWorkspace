# AFAPI REQ 01 Plugin Runtime Artifact Hygiene

日期：2026-06-06
窗口：AlembicPlugin
任务：AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME-PLUGIN-RUNTIME-ARTIFACT-HYGIENE-T4

## 范围

- 本轮只在 AlembicPlugin 仓库边界内处理 packaged runtime artifact hygiene。
- 处理对象为 T2 probe 留下的 embedded plugin artifact diff：`runtime.tgz` 和 `runtime/vendor/AlembicCore/.alembic-source.json`。
- 不修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / 真实项目。
- 当前 TargetResultEnvelope 只作为 AlembicPlugin 目标窗口回填，不能替代总控验收。

## 路线与结论

- 选择路线：提交 refreshed runtime artifacts。
- 理由：本轮 dirty artifact 的 Core source marker 从旧 Core commit 刷到当前 workspace Core commit，且 refreshed `runtime.tgz` 已通过 packaged wrapper probe；恢复旧 artifact 会丢弃与当前 Core 对齐的发布物。
- AlembicPlugin 父仓库提交：`8ba07705cfa9b655317309a1a3f1194f6117ccab`
- embedded plugin 提交：`7036b3281cc894bd2373d729c7a6e264a7bd923f`
- embedded plugin runtime tarball sha256：`af3162eb27be0bd75ea25facbe3a1023677731238e2a64576ab874fa31c3843a`
- embedded Core source marker：`9e51506be3c9078e44643346fa4a7d4d1271e716`
- 最终状态：AlembicPlugin 父仓库 clean，embedded plugin 子仓库 clean。

## 原始证据

Probe scratch 根目录：

- `AlembicPlugin/scratch/afapi-req-01-artifact-hygiene-2026-06-06/`

报告：

- `AlembicPlugin/scratch/afapi-req-01-artifact-hygiene-2026-06-06/packaged-probe-report.json`

提交前 artifact diff 摘要：

- `runtime.tgz`：binary diff，大小保持 `22467578` bytes。
- `runtime/vendor/AlembicCore/.alembic-source.json`：Core commit 从 `e3eda0450db9d27974c1ef1f945fb5a5f4793ea0` 刷到 `9e51506be3c9078e44643346fa4a7d4d1271e716`。

提交证据：

- embedded plugin commit：`7036b3281cc894bd2373d729c7a6e264a7bd923f`，message `refresh runtime artifact for project identity`
- AlembicPlugin parent commit：`8ba07705cfa9b655317309a1a3f1194f6117ccab`，message `refresh codex runtime artifact`
- parent submodule diff：`plugins/alembic-codex` 从 `cc6316d` 更新到 `7036b32`

## Packaged Readback

最终 packaged probe 结果：

- `ok=true`
- `mode=packaged-runtime`
- marker `entryMode=packaged-wrapper`
- runtime readback `entryMode=packaged-wrapper`
- runtime readback `expectedEntryMode=packaged-wrapper`
- marker `gitHead=8ba07705cfa9b655317309a1a3f1194f6117ccab`
- marker `hashes.runtimeTarball=af3162eb27be0bd75ea25facbe3a1023677731238e2a64576ab874fa31c3843a`
- runtime source policy `effectiveIdentitySource=codex-current-project`
- runtime source policy `selectedOrActiveCanOverrideEffectiveIdentity=false`
- blocked fallbacks include `saved-project-root-effective-identity`、`runtime-control-selected-active-effective-identity`、`local-jobstore-default-effective-identity`
- fallback isolation shows saved/root selected-active/local-jobstore/embedded plugin-owned runtime cannot override effective identity or persistence root.
- fail-closed check returns `CODEX_PROJECT_ROOT_UNRESOLVED` with `needsUserInput=true` when no trusted project root is provided.

## 实际命令

以下命令均在 `AlembicPlugin/` 执行，除 embedded 子仓库命令另有说明：

```bash
git diff --stat
git diff -- runtime/vendor/AlembicCore/.alembic-source.json
git rev-parse HEAD
git rev-parse HEAD # in plugins/alembic-codex
node scripts/dev-verify-codex-plugin.mjs --packaged --skip-build --skip-tests --skip-prepare --skip-verify --skip-smoke --codex-home scratch/afapi-req-01-artifact-hygiene-2026-06-06/packaged-codex-home --sync-target scratch/afapi-req-01-artifact-hygiene-2026-06-06/packaged-installed-cache --project-root <AlembicPlugin> --report-path scratch/afapi-req-01-artifact-hygiene-2026-06-06/packaged-probe-report.json --mcp-timeout-ms 180000
npm run verify:codex-plugin
npm run lint:repo-boundary
npm run build:check
npm test -- --run test/unit/CodexPluginCacheSync.test.ts test/unit/CodexDevReloadScript.test.ts test/unit/CodexRuntimeContext.test.ts
git diff --check
git status --short
git add runtime.tgz runtime/vendor/AlembicCore/.alembic-source.json # in plugins/alembic-codex
git commit -m "refresh runtime artifact for project identity" # in plugins/alembic-codex
git add plugins/alembic-codex
git commit -m "refresh codex runtime artifact"
git status --short
git status --short # in plugins/alembic-codex
```

## 验证结果

- `node scripts/dev-verify-codex-plugin.mjs --packaged ...`：通过；fresh installed cache 保持 wrapper + `./runtime.tgz`，两个 target 均读回 packaged wrapper identity。
- `npm run verify:codex-plugin`：通过；`./runtime.tgz` 验证为 `alembic-codex-plugin-runtime@0.2.0`。
- `npm run lint:repo-boundary`：通过；`@escape-hatch count: 0 / 75 threshold`。
- `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`，`tsc --noEmit` 通过。
- `npm test -- --run test/unit/CodexPluginCacheSync.test.ts test/unit/CodexDevReloadScript.test.ts test/unit/CodexRuntimeContext.test.ts`：通过，3 files / 18 tests。
- `git diff --check`：AlembicPlugin 父仓库和 embedded plugin 子仓库均通过。
- `git status --short`：AlembicPlugin 父仓库和 embedded plugin 子仓库最终均为空。

## 未修改范围

- 未修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / 真实项目。
- 未新增 Plugin source implementation；本轮只提交 packaged runtime artifact 和父仓库 submodule pointer。
- 未处理 Alembic producer-side ProjectRuntimeControl / projects route / selected-active cleanup；该范围仍属于对应 Alembic producer 任务。
- 未创建目标窗口下一跳。

## 风险与下一步建议

- 风险：本轮证明 packaged runtime artifact 与当前 Core marker 对齐且 Plugin packaged wrapper probe 通过；不证明 Alembic producer-side 多项目 runtime-control 已完成。
- 风险：`runtime.tgz` 是 binary artifact，需以 hash、source marker、packaged readback 和 verification commands 共同验收。
- 建议：总控验收时独立读取 `packaged-probe-report.json`、两个 commit 和最终 clean status；若接受本轮 artifact hygiene，可关闭 T2 留下的 dirty artifact 风险。
