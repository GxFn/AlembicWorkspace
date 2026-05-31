# Repository Residue Cleanup Acceptance

日期：2026-05-31
状态：总控复核通过 / 已归档
主题：`REPOSITORY-RESIDUE-CLEANUP-2026-05-31`

## 目标

处理源码仓库根目录里的运行态 / 投影态残留，不用 `.gitignore` 掩盖问题，而是确认生成来源、清理当前污染，并建立后续总控可重复验证的守卫。

## 复核结论

总控接受该 bugfix / workspace hygiene 项并归档。当前 workspace 配置内仓库没有 blocking residue；`.asd/`、`.cursor/skills`、`.agents/skills`、`.agents/.DS_Store` 已进入默认 residue 守卫。

`AlembicCore` Logger 根因修复成立：当文件日志路径位于源码 projectRoot 内且 `PathGuard` 判定不安全时，日志会重定向到 `/tmp/alembic-dev/logs`，避免 Alembic 源码仓库继续生成 `.asd/logs`。`Alembic` 与 `AlembicPlugin` vendor copy 已同步该边界。

合法例外保留：tracked marketplace 资产如 `AlembicPlugin/.agents/plugins/marketplace.json` 不被 residue 守卫误删；未来若某个项目确实允许 `.agents/skills` runtime projection，必须由当前计划显式写入 allowlist。

## 证据

- Design 需求设计：`AlembicDesign/docs/current/repository-residue-cleanup-requirement-design-2026-05-31.md`
- Handoff board：`AlembicDesign/docs/current/workspace-handoff-board.md`
- 守卫脚本：`codex-control-workspace/scripts/check-repository-residue.mjs`
- 守卫单测：`codex-control-workspace/scripts/check-repository-residue.test.mjs`
- Logger 根因修复：`AlembicCore/src/infrastructure/logging/Logger.ts`
- Logger 单测：`AlembicCore/test/LoggerRuntimeBoundary.test.ts`
- Alembic vendor copy：`Alembic/vendor/AlembicCore/src/infrastructure/logging/Logger.ts`
- AlembicPlugin vendor copy：`AlembicPlugin/vendor/AlembicCore/src/infrastructure/logging/Logger.ts`

## 验证

- `node scripts/check-repository-residue.mjs --json`：`ok=true`、`residueCount=0`、`blockingCount=0`
- `node --test scripts/check-repository-residue.test.mjs`：2 tests passed
- `node scripts/check-script-docs.mjs`：passed
- `npm test -- test/LoggerRuntimeBoundary.test.ts` in `AlembicCore`：1 test file passed, 1 test passed
- `node scripts/verify-control-center.mjs --with-script-tests --require-todo`：passed；workspace script tests 66 passed

## 边界

- 不改变 038 / 039 / IDE Agent 当前主线能力目标。
- 不启动 automation，不派产品实现窗口，不修改真实项目源码。
- 不把 Design 交接里的建议扩大成新的产品重构范围。
- `BiliDili` 等真实测试项目默认不允许 `.agents/skills` runtime projection，除非当前测试计划显式授权。
