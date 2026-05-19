# AlembicPlugin GitHub Actions Failure Recovery

更新日期：2026-05-19
执行窗口：AlembicPlugin
状态：已完成

## 完成范围

- 补齐原失败 run `26089289726` 的完整 checkout log，确认真实失败点是 `Checkout AlembicPlugin` 中 `submodule update --init --force --depth=1` 无法从 `GxFn/AlembicCodex` 取到 `0607fb8b8224cb01f83a51e520570d4f250e1b12`。
- 将 AlembicCodex 本地 detached commit `0607fb8b8224cb01f83a51e520570d4f250e1b12` 安全快进发布到 `GxFn/AlembicCodex` `main`，不强推，不改写历史。
- 在 AlembicPlugin 父仓库内把 `vendor/AlembicCore` 和 `vendor/AlembicDashboard` gitlink 改到各自远端 `main/HEAD` 可达提交，避免 checkout 修完 Codex 后继续卡在后续 submodule。
- 修复 Build & Lint 后暴露的 Biome 格式 / import 排序问题。
- 修复后续 CI 暴露的 AlembicPlugin unit test 失败：Core handoff 后的 `BootstrapTerminalToolset` facade import、semantic memory consolidation 非阻塞错误路径、WikiGenerator null dependency 兼容面、WorkflowCompletionFinalizer 测试缺失 import、Codex plugin cache sync 测试超时。

## 提交 Hash

- AlembicCodex 源仓库：`0607fb8b8224cb01f83a51e520570d4f250e1b12`，已发布到 `GxFn/AlembicCodex` `main`。
- AlembicPlugin 修复提交 1：`3824290 ci: restore submodule checkout reachability`。
- AlembicPlugin 修复提交 2：`1f0c44f test: restore plugin unit suite after core handoff`。

## 完整失败日志摘要

原 run：https://github.com/GxFn/AlembicPlugin/actions/runs/26089289726

失败 job：`Build & Lint (22)` / `76710448559`

真实失败步骤：`Checkout AlembicPlugin`

关键错误：

```text
git -c protocol.version=2 submodule update --init --force --depth=1
fatal: remote error: upload-pack: not our ref 0607fb8b8224cb01f83a51e520570d4f250e1b12
fatal: Fetched in submodule path 'plugins/alembic-codex', but it did not contain 0607fb8b8224cb01f83a51e520570d4f250e1b12. Direct fetching of that commit failed.
The process '/usr/bin/git' failed with exit code 128
```

结论：不是 npm / build / lint 失败，而是 AlembicPlugin 当前 gitlink 指向的 AlembicCodex commit 当时未在远端可达引用中。

## Submodule 远端可达性

| Submodule | AlembicPlugin 当前 gitlink | 远端可达性结果 |
| --- | --- | --- |
| `plugins/alembic-codex` | `0607fb8b8224cb01f83a51e520570d4f250e1b12` | 已发布到 `GxFn/AlembicCodex` `main/HEAD`。 |
| `vendor/AlembicCore` | `ab5e332843d6da89c3def6bf33631e0397552566` | 指向 `GxFn/AlembicCore` `main/HEAD`，远端可达。 |
| `vendor/AlembicDashboard` | `bf493c9eb6a395b294c0e9e22d96327ebedb00e2` | 指向 `GxFn/AlembicDashboard` `main/HEAD`，远端可达。 |
| `skills/progressive-chain-validation` | `a6c371c8b123fc79f218d362cd6bae61a0679d61` | 指向 `GxFn/progressive-chain-validation` `main/HEAD`，远端可达。 |

## 验证命令与结果

- `git submodule sync --recursive`：通过。
- `git submodule update --init --recursive`：通过。
- `npm run build`：通过。
- `npm run lint -- --diagnostic-level=error`：通过。
- `npm run lint:core-import-boundary`：通过。
- `npm run build:dashboard`：通过。
- `npx vitest run --config vitest.unit.config.ts test/unit/BootstrapTerminalToolset.test.ts test/unit/SemanticMemoryCompletionStep.test.ts test/unit/WikiGenerator.test.ts test/unit/WorkflowCompletionFinalizer.test.ts`：通过，4 files / 27 tests。
- `npx vitest run --config vitest.unit.config.ts test/unit/CodexPluginCacheSync.test.ts`：通过，2 tests。
- `npm run test:unit`：通过，95 files / 1474 tests。
- `git diff --check` / `git diff --cached --check`：通过。

## GitHub Actions 新 Run

- 中间 run：https://github.com/GxFn/AlembicPlugin/actions/runs/26092984894
  - `Build & Lint (22)`、`API Smoke Test`、`Integration Tests` 通过。
  - `Unit Tests` 暴露 6 个迁移后测试失败，已在 `1f0c44f` 修复。
- 最终 run：https://github.com/GxFn/AlembicPlugin/actions/runs/26093455839
  - `Build & Lint (22)`：通过。
  - `API Smoke Test`：通过。
  - `Unit Tests`：通过。
  - `Integration Tests`：通过。

## 遗留风险

- AlembicPlugin 当前 CI 已通过，无 checkout / build / lint / smoke / unit / integration 遗留阻塞。
- 旧 gitlink `vendor/AlembicCore@e58234c` 和 `vendor/AlembicDashboard@d25624d` 不再被 AlembicPlugin 引用；本轮未发布这些旧 detached commits。
- Workspace 文档由执行窗口回填，按规则不在 AlembicWorkspace 仓库提交。

## 下一步建议

- 总控窗口复核本记录、当前计划回填区和 `docs/workspace/index.md` / `workspace-current-status.md` 后，统一提交 AlembicWorkspace 文档。
- 后续若再次刷新 AlembicPlugin submodule gitlink，应先确认对应 commit 已在远端 `main/HEAD` 或其它长期引用可达，再提交父仓库。
