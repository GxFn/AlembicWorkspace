# AlembicCore Small Fix / Cleanup Self-Check

日期：2026-05-23
窗口：AlembicCore
任务包：SFC-P1
状态：待总控验收

## 窗口定位

当前窗口定位为 `AlembicCore`。本轮目标仓库职责是自检 `@alembic/core` 的共享 headless 内核、public exports、contract、schema、确定性工具、public API boundary 和复用边界。

本轮明确不承担：

- 不直接修复产品源码、不删除兼容层、不移动目录。
- 不修改 `Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard` 或 `AlembicTest`。
- 不改变 Plugin first / Alembic install enhances 边界。
- 不操作 BiliDili 或其它真实项目。

## 自检范围

- 读取 workspace `AGENTS.md`、`docs/workspace/index.md`、`docs/workspace/current/workspace-current-status.md`、当前自检计划和 `AlembicCore/AGENTS.md`。
- 检查 Core 仓库状态、package scripts、package exports、release docs、CI / release workflow、public API boundary、consumer import boundary、旧口径 / 旧别名 / 兼容层残留、文档说明和轻量验证命令。
- 本轮只做证据采集和问题回填，没有直接修改 Core 产品源码。

## 发现问题清单

| ID | 严重度 | 类型 | 现象 | 证据 | 影响范围 | 建议修复方式 | 是否需要用户确认 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SFC-CORE-001 | P2 | 仓库规则口径 | `AlembicCore/AGENTS.md` 的外层接入规则仍写成统一通过 `vendor/AlembicCore` / `file:vendor/AlembicCore` 接入，但当前 workspace 本地源码模式下三个消费仓库都使用 `file:../AlembicCore`。 | `AlembicCore/AGENTS.md:30-32`；`Alembic/package.json:123`、`AlembicAgent/package.json:117`、`AlembicPlugin/package.json:128`。 | 新窗口可能误以为日常本地开发必须更新 vendor / 子仓库指针，和 workspace 根规则的本地源码优先口径冲突。 | 修正文档口径：日常 workspace 本地开发优先 `file:../AlembicCore`；仅发布、portable runtime、vendor snapshot 或当前总控文档明确要求时再处理 `vendor/AlembicCore` / 子仓库指针。 | 否，属于规则自洽修正；但若要改变真实接入模式，需要总控确认。 |
| SFC-CORE-002 | P2 | public API readiness / 已知观察项 | `normalizeLifecycle` 已在 `domain/knowledge/Lifecycle.ts` 中实现，但未通过 `@alembic/core/knowledge` 稳定 facade 导出；当前全局 TODO 已记录 Alembic test-only residual 仍依赖 deep `@alembic/core/domain/knowledge/Lifecycle` allowance。 | `docs/workspace/current/global-todo-board.md` 的 `GTODO-2026-05-23-019`；`AlembicCore/src/domain/knowledge/Lifecycle.ts:86`；`AlembicCore/src/knowledge.ts:19-39` 未导出 `normalizeLifecycle`。 | 不影响当前 Core build/test；影响后续继续收束 Alembic test-only residual 和 public API closeout。 | 下一修复包可在 `src/domain/knowledge/index.ts` 与 `src/knowledge.ts` additive 导出 `normalizeLifecycle`，补 public facade smoke / targeted test，再由 Alembic 窗口替换 test-only deep import。不得为了清零 deep import 删除 allowance。 | 否；当前已有观察 TODO，修复前由总控决定是否升级到下一包。 |
| SFC-CORE-003 | P3 | 文档注释误导 | `src/shared/concurrency.ts` 头部用法示例仍写 `#shared/concurrency.js`，但 Core `AGENTS.md` 明确 Core 代码不要依赖外层 `#shared/*` package imports。 | `AlembicCore/src/shared/concurrency.ts:6-12`；`AlembicCore/AGENTS.md` 技术栈规则。 | 不影响运行时代码；可能误导后续 Core 内新增代码或外层复制示例。 | 将注释示例改为 Core public/package 入口或相对导入示例，例如 `@alembic/core/shared` 或同目录相对路径；无需改运行时代码。 | 否。 |
| SFC-CORE-004 | P3 | release check 门禁强度 | `scripts/check-release-readiness.mjs` 会计算并输出 `workingTreeDirty`，但没有把 dirty working tree 加入 `issues`，而 `RELEASE-PLAYBOOK.md` 前置条件要求发布前 working tree clean。 | `AlembicCore/scripts/check-release-readiness.mjs:197-218` 只设置 `workingTreeDirty`；`AlembicCore/scripts/check-release-readiness.mjs:222-229` 在 `issueCount=0` 时仍可输出 OK。 | CI / release workflow checkout 正常情况下是 clean，因此当前发布链不受影响；本地手动 release:check 对 dirty tree 的失败语义不够硬。 | 将 dirty tree 纳入 release readiness issue，或在 playbook 中明确 `release:check` 只报告 dirty，由 workflow / 人工 precondition 兜底。推荐前者，保持脚本和文档一致。 | 否。 |
| SFC-CORE-005 | P3 | 测试输出噪声 | `npm run check` 的 Vitest 阶段出现一次非致命 `error: Could not access 'HEAD'` 输出，但 65 个测试文件 / 949 个测试全部通过。 | `npm run check` 输出：`error: Could not access 'HEAD'`，随后 `Test Files 65 passed (65)` / `Tests 949 passed (949)`。代码中 git diff / HEAD 相关入口集中在 `src/shared/diff-parser.ts`、`src/service/evolution/ContentImpactAnalyzer.ts`、release 脚本。 | 不影响本轮验证结果；如果 CI 日志把 stderr 视为异常信号，会增加排障噪声。 | 下一修复包可定位是哪一个测试触发无 git HEAD 场景，并让对应 fallback 静默或通过 logger debug 输出；如果只是预期 fallback，应增加测试说明。 | 否；低优先级清理。 |

## 未发现问题 / 通过项

- `dist/` 未被 git 跟踪，`.gitignore` 已包含 `dist/`、`node_modules/` 和 `*.tsbuildinfo`。
- `package.json` exports 均指向 `dist/`；public API boundary 扫描通过。
- Core boundary 测试仍覆盖 Codex / MCP / tool system / delivery 禁止项。
- `README.md` 与 `RELEASE-PLAYBOOK.md` 的主要发布命令仍与 CI / release workflow 对齐：`npm run check`、`npm run build`、`npm run smoke:public-api`、`npm run release:check`。
- 三个主要消费仓库的 Core import boundary scan 均为 `issueCount=0`。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `git status --short --branch` | 通过；Core 工作区 clean，当前 `main...origin/main`。 |
| `git ls-files dist` | 通过；无输出，`dist/` 未被跟踪。 |
| `npm run check` | 通过；`build:check`、public API boundary、Vitest、Biome 均通过；65 files / 949 tests。Vitest 阶段有一次非致命 `Could not access 'HEAD'` 输出，已记录为 SFC-CORE-005。 |
| `npm run build` | 通过；生成 ignored `dist/`。 |
| `npm run smoke:public-api` | 通过；导入 75 个 exact public API entrypoints。 |
| `npm run release:check` | 通过；`@alembic/core@0.2.0`，pack entries 724，working tree dirty: no。 |
| `npm run report:public-api-closeout` | 通过；98 closeout exports / 61 wildcard；consumer scans issue=0；当前剩余 replacement readiness 为 keep-transitional 19。 |
| `node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format=json` | 通过；`issueCount=0`，referencesScanned=447。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format=json` | 通过；`issueCount=0`，referencesScanned=457。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format=json` | 通过；`issueCount=0`，referencesScanned=49。 |
| `git diff --check` | 通过。 |

## 未运行命令理由

- 未运行 `npm run test:coverage`：覆盖率会明显增加耗时和产物，本轮自检已有全量 Vitest、lint、build、smoke 和 release dry-run 证据。
- 未运行真实项目、daemon cold-start、Dashboard 手动体验、Codex plugin cache 或 BiliDili 验证：本轮只做 Core repo-local 自检，不改变运行时路径，也未触发真实项目测试条件。
- 未运行发布 / npm publish / tag / push：本轮不是发布任务。

## 提交与文档

- Core 产品提交：无。本轮未修改 Core 源码或配置。
- 当前 Core HEAD：`a60dde335d76e901d31fd32eb7762bee35e7c9ea`。
- 回填文档路径：`docs/AlembicCore/small-fix-cleanup-self-check-2026-05-23.md`。
- Workspace 文档提交：无，按执行窗口规则等待总控统一验收提交。

## 遗留风险与下一步建议

- 建议总控把 SFC-CORE-001 至 SFC-CORE-005 纳入下一阶段修复包；其中 SFC-CORE-001 / 002 / 003 可以由 Core 窗口独立修，SFC-CORE-002 的 Alembic consumer 替换需等 Core additive export 完成后再派 Alembic。
- 当前没有发现阻塞 Core build/test/release dry-run 的 P0 / P1 问题。
- 若总控决定启动修复阶段，应继续保持“先修 Core additive / 文档口径，再让消费仓库替换”的顺序，不要直接删除 deep export 或 consumer allowlist。
