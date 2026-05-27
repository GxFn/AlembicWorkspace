# Alembic CCIC-5 执行记录

日期：2026-05-23
窗口：Alembic
任务包：CCIC-P5-A
目标仓库：`/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`
提交 hash：`4c35757ebed1b4ca0a31418a20835b68fbcbc648`

## 当前窗口定位

本窗口是 `Alembic` 主仓库执行窗口。`Alembic` 本轮职责是本地增强底座、CLI、daemon、HTTP/API、resident service handler 和本地运行链路的 `lib/external/mcp` retained consumer 收窄。

本轮不承担 `AlembicCore` public API readiness 修改，不承担 `AlembicPlugin` Codex-facing MCP/runtime artifact 修改，不承担 `AlembicAgent` runtime / provider / tool system 修改，不执行真实项目复测。

## 完成范围

- 新增 `lib/resident/tool-handlers/bootstrap-internal.ts` 和 `lib/resident/tool-handlers/rescan-internal.ts`，作为 Alembic-owned coldstart / rescan resident handler surface。
- 将 `bootstrapRefine` 真实实现迁入 `lib/resident/tool-handlers/bootstrap/refine.ts`，旧 `lib/external/mcp/handlers/bootstrap/refine.ts` 改为 compatibility alias。
- 将 CLI `coldstart` / `rescan`、`DaemonJobRunner` bootstrap / rescan job、HTTP candidates `bootstrap-refine` route 从 `lib/external/mcp/handlers/*-internal` 切到 `lib/resident/tool-handlers/*-internal`。
- 将 `test/integration/GoSupport.test.ts` 的 bootstrap module load test 切到 resident handler path。
- 扩展 `test/unit/ResidentServiceBoundary.test.ts`，断言 Alembic-owned bootstrap / rescan 消费方不再使用旧 external MCP path，并断言旧 files 仅作为 resident compatibility alias。

## 关键代码证据

- Resident 新入口：
  - `Alembic/lib/resident/tool-handlers/bootstrap-internal.ts`
  - `Alembic/lib/resident/tool-handlers/rescan-internal.ts`
  - `Alembic/lib/resident/tool-handlers/bootstrap/refine.ts`
- 生产消费方已迁移：
  - `Alembic/bin/cli.ts`
  - `Alembic/lib/daemon/DaemonJobRunner.ts`
  - `Alembic/lib/http/routes/candidates.ts`
- 旧路径保留为兼容 alias：
  - `Alembic/lib/external/mcp/handlers/bootstrap-internal.ts`
  - `Alembic/lib/external/mcp/handlers/rescan-internal.ts`
  - `Alembic/lib/external/mcp/handlers/bootstrap/refine.ts`

## 职责边界判断

- `bootstrapKnowledge` / `rescanInternal` / `bootstrapRefine` 是 Alembic 本地 resident service / CLI / daemon / HTTP 运行链路，不是 Codex-facing Plugin MCP tool ownership。
- `lib/external/mcp/handlers/bootstrap-internal.ts`、`rescan-internal.ts`、`bootstrap/refine.ts` 现在只承担 legacy import compatibility，删除前必须确认无外部 release / historical tests 仍按旧路径加载。
- `lib/external/mcp/handlers/knowledge.ts`、`panorama.ts` 等仍有 targeted unit 消费，本轮没有真实 resident 替代入口，不做伪迁移。
- `lib/external/mcp/{tools,envelope,errorHandler,zodToMcpSchema}` 和 `handlers/types.ts` 已是 CCIC-3 建立的 schema compatibility alias，本轮不重复迁移。

## 删除 / 下沉 / 不得移动候选

| 路径 | 本轮判断 | 移除条件 |
| --- | --- | --- |
| `lib/external/mcp/handlers/bootstrap-internal.ts` | 可删候选，但当前保留 alias | 至少一轮 release / consumer scan 确认无 old path runtime / test import 后删除。 |
| `lib/external/mcp/handlers/rescan-internal.ts` | 可删候选，但当前保留 alias | 同上，需确认 CLI、daemon、HTTP 和历史集成测试均已稳定在 resident path。 |
| `lib/external/mcp/handlers/bootstrap/refine.ts` | 可删候选，但当前保留 alias | 需确认无 old refine path import；当前作为 compatibility file 保留。 |
| `lib/external/mcp/handlers/knowledge.ts` / `panorama.ts` 等 | 不得本轮移动 | 仍有 targeted unit / legacy handler 消费，缺少已验收 resident replacement。 |
| `lib/external/mcp` 整目录 | 不得整目录删除 | 目录内仍含 legacy handler、schema alias、边界负向测试和历史兼容入口。 |

## Residual Core Import 分类输入

`npm run lint:consumer-core-imports` 通过：扫描 373 files / 456 `@alembic/core` imports，`issueCount=0`。分类快照：stable-public 366、provisional-public 71、transitional-internal 19。

本轮没有新增 Core import，也没有消费 Core P5-C 未验收的新 facade。后续 residual 分类建议：

- stable / exact 已可长期消费：`@alembic/core/logging`、`project-intelligence`、`workspace`、`guard`、`events`、`knowledge`、`io`、`search`、`host-agent-workflows`、`repositories` 等。
- provisional / 需继续观察：`@alembic/core/types`、`@alembic/core/service/candidate`、`@alembic/core/infrastructure/report`、`@alembic/core/config`、`@alembic/core/database` 等。
- keep-transitional / consumer-replace-later：`@alembic/core/core/enhancement`、`@alembic/core/core/capability/CapabilityProbe`、AST lang deep paths、database drizzle / migration paths、quality / recipe service paths、`ContentImpactAnalyzer`。
- test-only / special-boundary：Go / real-project / guard integration tests 中保留的 enhancement、vector、guard、domain lifecycle 等 imports 需要 Core P5-C 给出 readiness 分类后再判断。

## 验证命令与结果

通过：

- `npm run build:check`
- `npm run lint:repo-boundary`
- `npm run lint:consumer-core-imports`
- `npm run test:unit -- test/unit/ResidentServiceBoundary.test.ts test/unit/AgentModuleBoundaries.test.ts test/unit/DaemonJobRunner.test.ts test/unit/KnowledgeAPI.test.ts`
- `./node_modules/.bin/vitest run test/integration/GoSupport.test.ts`
- `rg -n "external/mcp/handlers/(bootstrap-internal|rescan-internal)|external/mcp/handlers/bootstrap/refine" bin lib/daemon lib/http test/integration/GoSupport.test.ts`，无命中
- `git diff --check HEAD^ HEAD`

补充说明：

- `npm run test:integration -- test/integration/GoSupport.test.ts` 未作为验收命令使用；该 npm script 会固定跑完整 `test/integration` 目录，在当前环境命中既有 macOS sandbox stdout / 本地端口 listen EPERM 失败。已改用 direct vitest 目标文件验证并通过。
- `npm run lint` 仍受既有全仓 Biome warnings 阻塞，命中 `lib/bootstrap.ts`、`lib/cli/SetupService.ts` 等历史问题；本轮 touched files targeted Biome 检查无新增 error。

## 遗留风险

- 旧 `external/mcp` compatibility alias 仍存在，不能在 CCIC-5 内直接删除。
- `knowledge` / `panorama` 等 legacy handler 仍没有本轮已验收 resident replacement。
- Core residual import 分类需结合 `AlembicCore` CCIC-P5-C 已回填总账本，由总控统一验收后再判断 CCIC-6 replacement / deletion 范围。

## 下一步建议

- 总控验收 `AlembicCore` / `Alembic` / `AlembicPlugin` 三份 CCIC-5 回填后，再决定 CCIC-6 是否删除已证明无消费方的 old alias。
- 若进入 CCIC-6，优先删除或继续收窄 `bootstrap-internal` / `rescan-internal` / `bootstrap/refine` 三个已变成纯 alias 的 old files；不要整目录删除 `lib/external/mcp`。
- Core P5-C 未经总控验收前，Alembic 不消费新的 Core facade，也不修改 `config/core-import-boundary.json`。
