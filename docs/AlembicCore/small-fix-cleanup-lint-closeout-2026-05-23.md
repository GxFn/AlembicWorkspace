# AlembicCore SFC-R2 Lint Closeout 回填

日期：2026-05-23
目标仓库：`AlembicCore`
总控计划：`docs/workspace/current/small-fix-cleanup-lint-closeout-wave-2026-05-23.md`
任务包：`SFC-R2-CORE`

## 当前窗口定位

当前窗口定位为 `AlembicCore`。本轮仓库职责是维护 `@alembic/core` 的共享、确定性、可复用、可运行 Headless 内核能力，并关闭 Core 自身 release / check 基线的小问题。

本轮明确不承担：不做 consumer deep import 替换，不修改 Core public API，不发布，不处理 `AlembicAgent` L4 默认行为，不操作 `BiliDili`。

## 完成范围

- `SFC-CORE-004`：修复 `scripts/check-release-readiness.mjs`，将 dirty working tree 纳入 release readiness issue。现在 `release:check` 在未提交包状态下 fail-closed，clean tree 下正常通过。
- `SFC-CORE-004`：更新 `RELEASE-PLAYBOOK.md` failure handling，明确 `dirty-working-tree` 需要 commit / stash / revert 后再 staging release。
- `SFC-CORE-005`：修复 `src/shared/diff-parser.ts`，为可选 git diff 增强路径增加 `stdio: ['ignore', 'pipe', 'ignore']`，非 git worktree / 无 `HEAD` 场景安静降级为 `null`。
- `SFC-CORE-005`：补 `test/shared-basics.test.ts` targeted 用例，覆盖非 git 目录获取 diff 时不写 stderr。

## 提交 Hash

- `08a47233f4fccd49d6622aaf0bc123ca22925de3` (`fix: close core release check diagnostics`)

## 验证命令与结果

- `npm run release:check`（修改前 clean tree baseline）：通过，报告 `Working tree dirty: no`。
- `npm run release:check`（修改后、提交前 dirty tree）：按预期失败，输出 `dirty-working-tree` issue，证明 dirty tree 已成为 release readiness failure。
- `npm run test -- --run test/shared-basics.test.ts test/unit/RecipeImpactPlanner.test.ts`：通过，2 个测试文件、20 个测试通过。
- `npm run check`：通过，`build:check`、public API boundary、Vitest `65 passed / 950 tests passed`、Biome lint 均通过；本轮没有再出现 `Could not access 'HEAD'` 噪声。
- `npm run build`：通过。
- `git diff --check`：通过。
- `npm run release:check`（提交后 clean tree）：通过，source commit 为 `08a47233f4fccd49d6622aaf0bc123ca22925de3`，`Working tree dirty: no`。

## 仍保留项理由

- 未做 consumer deep import 替换：总控文档明确不包含。
- 未改 public API：本轮只处理 release/check 基线，不触碰 API surface。
- 未发布：本轮不是 release / staging 任务。

## 遗留风险

- `release:check` 现在会在 dirty tree 下失败；开发态若需要预览 package 内容，应先 commit / stash，或只运行更窄的非 release 命令。
- Core 仓库当前 `main` ahead `origin/main` 2 个提交，后续需要按总控发布 / push 节奏同步远端。

## 下一步建议

- 总控可将 `SFC-CORE-004`、`SFC-CORE-005` 标为待验收。
- 若后续需要验证 release workflow，可在 clean tree / CI 环境重复 `npm run check && npm run build && npm run smoke:public-api && npm run release:check`。
