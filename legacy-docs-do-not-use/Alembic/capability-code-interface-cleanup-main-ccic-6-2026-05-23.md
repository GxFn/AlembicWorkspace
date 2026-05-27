# Alembic CCIC-6 执行记录

日期：2026-05-23
窗口：Alembic
任务包：CCIC-P6-A
目标仓库：`/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`
提交 hash：`bfd03984079caea94aae2ce32aa455422db0fa3a`

## 当前窗口定位

本窗口是 `Alembic` 主仓库执行窗口。`Alembic` 本轮职责是本地增强底座、CLI、daemon、HTTP/API、resident service handler、DI 装配和 Alembic-owned runtime 边界。

本轮只承担 `CCIC-P6-A`：基于 `AlembicCore` CCIC-5 已验收 stable / provisional facade 做 Alembic residual replacement、收紧 `config/core-import-boundary.json`，并对已退化为纯 alias 的 bootstrap / rescan / refine old external MCP path 做最终删除。

本轮不承担 `AlembicCore` public API readiness 修改，不承担 `AlembicPlugin` Codex-facing MCP / runtime artifact 修改，不承担 `AlembicAgent` runtime / provider / tool system 修改，不承担 Dashboard UI 或真实项目复测。

## 完成范围

- 将 Alembic 可安全替换的 Core deep imports 切到 CCIC-5 已验收 facade：
  - `@alembic/core/knowledge`：`getRequiredFieldsDescription`、`UnifiedValidator`
  - `@alembic/core/evolution`：`assessDiffImpact`、`assessFileImpact`、`extractRecipeTokens` 等 ContentImpactAnalyzer helpers
  - `@alembic/core/memory`：`MemoryRepositoryImpl`
  - `@alembic/core/host-agent-workflows`：full reset / rescan cleanup policies
  - `@alembic/core/core/capability`：`CapabilityProbe`
  - `@alembic/core/service/{bootstrap,quality,recipe}`：已验收 provisional exact facades
- 删除旧 external MCP compatibility alias：
  - `lib/external/mcp/handlers/bootstrap-internal.ts`
  - `lib/external/mcp/handlers/rescan-internal.ts`
  - `lib/external/mcp/handlers/bootstrap/refine.ts`
- 更新 `test/unit/ResidentServiceBoundary.test.ts`，断言 Alembic-owned bootstrap / rescan consumers 继续使用 resident path，并断言旧 alias files 已不存在。
- 收紧 `config/core-import-boundary.json`：
  - 删除已无消费方的 `domain/knowledge/{FieldSpec,RecipeReadinessChecker,UnifiedValidator,values/*}`、`domain/evolution/EvolutionPolicy`、`repository/memory/MemoryRepository`、`service/evolution/ContentImpactAnalyzer`、`WorkflowCleanupPolicies`、quality / recipe / bootstrap deep file path allowlist。
  - 新增并保留已消费 facade：`@alembic/core/evolution`、`@alembic/core/memory`、`@alembic/core/core/capability`、`@alembic/core/service/{bootstrap,quality,recipe}`。
  - `@alembic/core/domain/knowledge/Lifecycle` 仅保留 2 处 integration test-only allowance，因为当前 `@alembic/core/knowledge` 未导出 `normalizeLifecycle`，本轮按文档要求不猜 Core symbol。

## 关键代码证据

- Alembic resident old-path closeout：
  - `Alembic/lib/resident/tool-handlers/bootstrap-internal.ts`
  - `Alembic/lib/resident/tool-handlers/rescan-internal.ts`
  - `Alembic/lib/resident/tool-handlers/bootstrap/refine.ts`
  - `Alembic/test/unit/ResidentServiceBoundary.test.ts`
- Core facade replacement：
  - `Alembic/lib/injection/modules/AppModule.ts`
  - `Alembic/lib/injection/modules/InfraModule.ts`
  - `Alembic/lib/injection/ServiceMap.ts`
  - `Alembic/lib/service/evolution/FileChangeHandler.ts`
  - `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`
  - `Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`
  - `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapRescanState.ts`
  - `Alembic/lib/http/HttpServer.ts`
  - `Alembic/lib/http/middleware/roleResolver.ts`
  - `Alembic/lib/external/mcp/handlers/{consolidated,knowledge}.ts`

## 职责边界判断

- `bootstrapKnowledge` / `rescanInternal` / `bootstrapRefine` 是 Alembic 本地 resident service / CLI / daemon / HTTP 运行链路，不是 Codex-facing Plugin MCP tool ownership。旧 `lib/external/mcp/handlers/*-internal` alias 在 CCIC-5 后已无真实生产消费方，本轮删除成立。
- `lib/external/mcp/handlers/knowledge.ts`、`panorama.ts` 等仍没有本轮已验收 resident replacement，不删除、不整目录清理 `lib/external/mcp`。
- `core/enhancement`、AST lang、Drizzle schema / migrations 仍属于 keep-transitional / test-only / DB infrastructure，不在本轮伪迁移。
- `@alembic/core/domain/knowledge/Lifecycle` 2 处 integration test-only deep import 保留，原因是 Core facade 缺 `normalizeLifecycle`；这是 Core 后续 additive readiness 候选，不由 Alembic 本轮猜接口。

## 删除 / 下沉 / 不得移动候选

| 路径 | 本轮判断 | 证据 / 后续条件 |
| --- | --- | --- |
| `lib/external/mcp/handlers/bootstrap-internal.ts` | 已删除 | 生产消费方已在 CCIC-5 切到 resident path；本轮 old-path scan 无命中。 |
| `lib/external/mcp/handlers/rescan-internal.ts` | 已删除 | 同上。 |
| `lib/external/mcp/handlers/bootstrap/refine.ts` | 已删除 | HTTP candidates route 经 resident bootstrap handler 消费 refine；old path scan 无命中。 |
| `lib/external/mcp/handlers/knowledge.ts` / `panorama.ts` 等 | 不得本轮移动 | 仍有 legacy handler / targeted test / schema compatibility 责任，缺少已验收 resident replacement。 |
| `@alembic/core/domain/knowledge/Lifecycle` | test-only 保留 | 等 Core additive 导出 `normalizeLifecycle` 后再迁移。 |
| `@alembic/core/core/enhancement`、AST lang、Drizzle / migrations | keep-transitional | CCIC-5 明确不消费这些路径的替代入口。 |

## 验证命令与结果

通过：

- `npm run lint:consumer-core-imports`
- `npm run build:check`
- `npm run lint:repo-boundary`
- `npm run test:unit -- test/unit/ResidentServiceBoundary.test.ts test/unit/ContentImpactAnalyzer.test.ts test/unit/FileChangeHandler.test.ts test/unit/KnowledgeAPI.test.ts test/unit/ProposalExecutor.test.ts test/unit/lifecycle-supervisor.test.ts test/unit/RedundancyAnalyzer.test.ts test/unit/EvolutionGateway.test.ts`
- `./node_modules/.bin/vitest run test/integration/ProbeResolver.test.ts test/integration/DomainLifecycle.test.ts test/integration/KnowledgeGovernance.test.ts`
- `npm run release:package-guard`
- `rg -n "@alembic/core/domain/evolution/EvolutionPolicy|@alembic/core/service/evolution/ContentImpactAnalyzer|@alembic/core/repository/memory/MemoryRepository|@alembic/core/service/bootstrap/BootstrapDedup|@alembic/core/service/quality/|@alembic/core/service/recipe/|@alembic/core/workflows/capabilities/WorkflowCleanupPolicies|@alembic/core/core/capability/CapabilityProbe" bin lib scripts test`，无命中。
- `rg -n "external/mcp/handlers/(bootstrap-internal|rescan-internal)|external/mcp/handlers/bootstrap/refine|lib/external/mcp/handlers/(bootstrap-internal|rescan-internal)|lib/external/mcp/handlers/bootstrap/refine" bin lib scripts test package.json tsconfig.json config`，无命中。
- `git diff --check HEAD^ HEAD`

补充说明：

- 曾尝试 `npm run test:integration -- test/integration/ProbeResolver.test.ts test/integration/DomainLifecycle.test.ts test/integration/KnowledgeGovernance.test.ts`，但该 npm script 固定附带 `test/integration`，因此实际跑了整套 integration；当前沙箱环境命中既有 HTTP listen `EPERM ::1` 和 macOS sandbox stdout 失败，不作为本轮验收命令。已改用 direct Vitest targeted integration 命令并通过。
- `npm run release:package-guard` 通过，但保留既有 warning：`package-lock` 中的 `../AlembicAgent` / `../AlembicCore` 本地 workspace entry 只允许开发态存在，不得进入 publish staging manifest。

## 残留扫描结果

- 已替换路径负向扫描：`EvolutionPolicy`、`ContentImpactAnalyzer`、`MemoryRepository`、`BootstrapDedup`、quality / recipe deep file path、`WorkflowCleanupPolicies`、`CapabilityProbe` deep file path 均无命中。
- 旧 external MCP alias path 负向扫描无命中。
- 剩余 `@alembic/core/domain/knowledge` 命中 2 处：
  - `test/integration/DomainLifecycle.test.ts`
  - `test/integration/KnowledgeGovernance.test.ts`
  原因：当前 `@alembic/core/knowledge` 未导出 `normalizeLifecycle`；本轮按 Core symbol gap 规则保留 test-only deep import，并通过 `config/core-import-boundary.json` 限定为 2 处。

## 遗留风险

- Core knowledge facade 缺 `normalizeLifecycle`，因此 Lifecycle integration tests 仍有 2 处 test-only deep import。建议 Core 后续 additive 导出后再由 Alembic / Plugin 消费。
- `core/enhancement`、AST lang、Drizzle / migrations 仍是明确 keep-transitional，不应在 CCIC-6 后续为了清零而伪迁移。
- `lib/external/mcp` 目录内仍有 `knowledge` / `panorama` / schema compatibility 等合法 legacy surface，本轮只删除三条已无消费方 alias。

## 下一步建议

- 总控验收 `Alembic` 提交 `bfd03984079caea94aae2ce32aa455422db0fa3a` 与 `AlembicPlugin` CCIC-6 回填后，再决定 CCIC-6 是否整体关闭或进入 CCIC-7 contract 收束。
- 若进入后续 Core readiness 返工，优先补 `@alembic/core/knowledge` 的 `normalizeLifecycle` additive export，再移除 Alembic 2 处 test-only `domain/knowledge/Lifecycle` allowance。
- 本轮未触发 Codex plugin cache、Dashboard 手动体验或真实项目 prime/search/cold-start 用户路径变化，暂不建议创建 `AlembicTest` 测试单。
