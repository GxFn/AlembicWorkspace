# Alembic Capability Code Interface Cleanup CCIC-2 Execution

日期：2026-05-23
窗口定位：Alembic 执行窗口
目标仓库：`/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`
任务包：CCIC-P2-A
状态：待总控验收

## 当前窗口定位与职责

本窗口只负责 Alembic 主仓库。本轮任务职责是关闭 Alembic scripts 中已确认可替代的 Core deep import boundary issue，并补齐 `lib/external/mcp` resident handler / schema legacy naming 的迁移前置分类账本。

目标仓库职责：

- Alembic 继续拥有 CLI、daemon、HTTP/API、Dashboard server、本地 runtime、ProjectRegistry、JobStore、file monitor、internal AI jobs、平台能力和本地安装 / dev / release。
- Alembic 本轮只修改自身 `scripts/` 中消费 Core facade 的方式，并记录 `lib/external/mcp` 分类证据。

明确不承担：

- 不删除或整体重命名 `lib/external/mcp`。
- 不把 Alembic resident service handler 迁入 AlembicPlugin。
- 不删除 Core public export，不修改 AlembicCore 源码。
- 不修改 AlembicPlugin、AlembicDashboard、AlembicAgent、AlembicTest 或真实测试项目。
- 不新增空 adapter；所有 import replacement 均使用 Core 现有 exact facade。

## 完成范围

提交：Alembic `1a27cba52f767c223b201fe3e620f0c4cb4f6790` (`fix: replace core deep imports in scripts`)

源码完成范围：

- `scripts/bench-real-projects.mts`
  - 将 `@alembic/core/core/discovery`、`@alembic/core/core/ast`、`@alembic/core/core/AstAnalyzer` 替换为 `@alembic/core/project-intelligence`。
  - 使用 `loadProjectAstPlugins()` 显式替代原 `@alembic/core/core/ast` side-effect import。
  - 使用 `isProjectAstAvailable()` 替代 `AstAnalyzer.isAvailable` deep import。
  - 保留 `@alembic/core/core/enhancement`，原因是当前总控计划明确该入口仍在 Alembic allowlist 内，本波不伪迁移到无真实 symbol 的 facade。
- `scripts/collect-test-project-stats.mts`
  - 将 `@alembic/core/core/discovery` 与 `@alembic/core/shared` 中的 discovery / language imports 合并迁移到 `@alembic/core/project-intelligence`。

关闭的 Core import issue：

- `scripts/bench-real-projects.mts` 的 `@alembic/core/core/discovery`
- `scripts/bench-real-projects.mts` 的 `@alembic/core/core/ast`
- `scripts/bench-real-projects.mts` 的 `@alembic/core/core/AstAnalyzer`
- `scripts/collect-test-project-stats.mts` 的 `@alembic/core/core/discovery`

保留的 Core deep import：

- `@alembic/core/core/enhancement` 仍在 `scripts/bench-real-projects.mts` 中保留。当前 `config/core-import-boundary.json` 已 allowlist 该入口，且 CCIC-2 计划明确“暂无合适 exact facade 时保留并写明原因”。本轮未新增替代 facade，也未扩大 allowlist。
- `config/core-import-boundary.json` 中仍记录语言 AST 插件 allowlist 与 historical reference limits，这不是本轮 scripts import boundary 阻塞点。

## `lib/external/mcp` 分类表

| 分类 | 当前入口 / 文件 | 当前消费者 | 本轮判断 | 下一步 |
| --- | --- | --- | --- | --- |
| 进入 Alembic resident service handler | `handlers/bootstrap-internal.ts`、`handlers/rescan-internal.ts` | `bin/cli.ts`、`lib/daemon/DaemonJobRunner.ts`、`test/integration/GoSupport.test.ts` | Alembic CLI / daemon job 内部服务 handler，不是 Plugin Codex MCP ownership。 | CCIC 后续可迁到 resident/service handler 命名，但必须先建 alias 或分批改 consumer。 |
| 进入 Alembic HTTP resident route handler | `handlers/task.ts`、`handlers/skill.ts`、`handlers/bootstrap/refine.ts` | `lib/http/routes/task.ts`、`lib/http/routes/skills.ts`、`lib/http/routes/candidates.ts` | HTTP API 复用 resident handler / schema，当前不可删。 | 可按 route 所属功能拆入 `lib/http` 或 `lib/service` 专属 helper，但需 targeted route tests。 |
| 留在 legacy handler / schema contract | `handlers/types.ts`、`tools.ts`、`envelope.ts`、`errorHandler.ts`、`zodToMcpSchema.ts` | `test/unit/KnowledgeAPI.test.ts`、`test/integration/ZodToMcpSchema.test.ts`、`test/integration/WrapHandler.test.ts`、多处 handler imports | 这些文件仍承担 legacy tool schema、error envelope、handler type contract。 | consumer replacement 前不得删除；后续先拆 schema contract 与 resident handler contract。 |
| 不得删除 | `handlers/bootstrap/**` shared / pipeline 文件 | `test/unit/AgentModuleBoundaries.test.ts`、bootstrap/rescan handlers | 仍被 boundary tests 和 internal bootstrap workflow 消费。 | 仅在 bootstrap workflow 新入口稳定后分批迁移。 |
| 删除候选 | 仅历史 bridge 文件 `lib/external/mcp/McpBridgeDispatcher.ts` | `test/unit/ResidentServiceBoundary.test.ts` 负向断言 | 文件已不存在，测试保护旧 MCP bridge 不回潮。 | 保留负向测试；无源码删除动作。 |
| 反馈给 Plugin / Core | 无需要本轮反馈的源码入口 | 无 | 当前 `lib/external/mcp` 命名债属于 Alembic resident service legacy vocabulary，不是 Plugin 或 Core 要接手的实现。 | 后续如涉及 Codex-facing schema，再由总控派 Plugin；如需 Core facade，再先由 Core 提供 public API。 |

本轮未做小范围迁移，原因：当前 `lib/external/mcp` 的主要消费者横跨 CLI、daemon jobs、HTTP routes、unit/integration tests 和 boundary tests。没有一个子目录能在不引入 alias / 兼容层的情况下独立迁出并保持验证闭环，因此本轮只关闭已明确的 Core consumer issue，并把 resident handler 命名迁移前置分类写清。

## 验证命令与结果

在 Alembic 仓库执行：

```text
npm run lint:consumer-core-imports
npm run lint:core-import-boundary
npm run build:check
npm run lint:repo-boundary
npm run test:unit -- test/unit/CorePublicSurfaceSmoke.test.ts
npx biome check scripts/bench-real-projects.mts scripts/collect-test-project-stats.mts
rg -n "@alembic/core/core/(discovery|ast|AstAnalyzer)" scripts lib bin test config
git diff --check HEAD^ HEAD
```

验证结果：

- `npm run lint:consumer-core-imports` 通过：扫描 363 files / 483 `@alembic/core` imports，Core import boundary OK。
- `npm run lint:core-import-boundary` 通过，同一 consumer import boundary OK。
- `npm run build:check` 通过，使用本地 `../AlembicCore` source build。
- `npm run lint:repo-boundary` 通过，DB boundary 仍保持干净。
- `npm run test:unit -- test/unit/CorePublicSurfaceSmoke.test.ts` 通过：1 file / 6 tests。
- Targeted Biome 通过：2 个修改脚本无诊断。
- `rg -n "@alembic/core/core/(discovery|ast|AstAnalyzer)" scripts lib bin test config` 只剩 `config/core-import-boundary.json` 中 language AST allowlist / reference limit 历史记录，scripts / lib / bin / test 无剩余阻塞 import。
- `git diff --check HEAD^ HEAD` 通过。

## 遗留风险

- `@alembic/core/core/enhancement` 仍留在 benchmark script 中；这是有意保留的 allowlisted transitional import，后续需要 Core 提供真实 exact facade 或总控决定保留。
- `lib/external/mcp` 仍是命名债。本轮确认其属于 Alembic resident service handler / schema legacy vocabulary，但未做目录迁移；后续迁移必须 alias / consumer-replace-first。
- `config/core-import-boundary.json` 仍含 language AST plugin allowlist 和 historical reference limits；它们不是本轮 4 个 issue，但仍属于后续 public API closeout 的观察项。

## 下一步建议

- 等 AlembicCore CCIC-P2-C 回填 readiness map 后，总控复核是否能把 `core/enhancement` 也纳入 exact facade 迁移候选。
- CCIC-3 若继续 Alembic `lib/external/mcp` 实名迁移，建议先建立 “resident service handler / legacy schema contract / tool inventory” 三类目标目录和 alias 策略，再按 CLI bootstrap/rescan、daemon jobs、HTTP routes、tests 分批迁移。
- 不建议直接整目录 rename；当前真实消费者太多，强行迁移会把边界清理变成行为风险。
