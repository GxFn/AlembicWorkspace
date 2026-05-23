# Alembic Capability Code Interface Cleanup CCIC-3 Execution

日期：2026-05-23
窗口定位：Alembic 执行窗口
目标仓库：Alembic
任务包：CCIC-P3-A
状态：待总控验收

## 当前窗口定位与职责

本窗口只负责 Alembic 主仓库。本轮任务职责是完成 `lib/external/mcp` resident tool handler 命名迁移第一片：建立 Alembic-owned resident 语义入口，迁移本轮可闭环的内部 consumers，并保留旧路径 compatibility alias。

目标仓库职责：

- Alembic 继续拥有 CLI、daemon、HTTP/API、Dashboard server、本地 runtime、ProjectRegistry、JobStore、file monitor、internal AI jobs、平台能力和本地安装 / dev / release。
- 本轮只处理 Alembic 本地 resident service / resident tool handler 命名债，不把 Codex Plugin MCP ownership 拉回主仓库。

明确不承担：

- 不删除仍被真实消费者引用的 `lib/external/mcp` old path。
- 不修改 AlembicPlugin、AlembicCore、AlembicAgent、AlembicDashboard、AlembicTest 或真实测试项目。
- 不移动 cold-start / rescan workflow 出 `lib/workflows/**`。
- 不改变 CLI、daemon、HTTP API、Dashboard server 或真实项目 prime/search/cold-start 行为。

## 完成范围

提交：Alembic `c7e8c8d798103c549756ede5e7b1ac533917d64c` (`refactor: add resident tool handler aliases`)

目标目录选择：

- `lib/resident/tool-handlers/`：Alembic 本地 resident service / resident tool handler 的第一片实现入口。
- `lib/resident/tool-schema/`：resident tool schema、envelope、error handling、tool declarations 和 transitional handler types。

迁移到新语义入口的实现：

- `lib/resident/tool-handlers/task.ts`
- `lib/resident/tool-handlers/skill.ts`
- `lib/resident/tool-schema/types.ts`
- `lib/resident/tool-schema/tools.ts`
- `lib/resident/tool-schema/envelope.ts`
- `lib/resident/tool-schema/errorHandler.ts`
- `lib/resident/tool-schema/zodToMcpSchema.ts`

内部 consumer replacement：

- `lib/http/routes/task.ts` 改为消费 `../../resident/tool-handlers/task.js` 和 `../../resident/tool-schema/types.js`。
- `lib/http/routes/skills.ts` 改为消费 `../../resident/tool-handlers/skill.js`。
- 仍留在 `lib/external/mcp/handlers/` 的未迁移 handler，已把 `envelope` / `types` imports 指向 `lib/resident/tool-schema/**`，避免旧 schema helper 继续作为主实现入口。
- `test/integration/ZodToMcpSchema.test.ts`、`test/integration/WrapHandler.test.ts`、`test/unit/KnowledgeAPI.test.ts` 和 3 个 bootstrap / dimension type tests 改为消费 `lib/resident/tool-schema/**`。

保留的 legacy alias：

- `lib/external/mcp/handlers/task.ts`
- `lib/external/mcp/handlers/skill.ts`
- `lib/external/mcp/handlers/types.ts`
- `lib/external/mcp/tools.ts`
- `lib/external/mcp/envelope.ts`
- `lib/external/mcp/errorHandler.ts`
- `lib/external/mcp/zodToMcpSchema.ts`

这些文件现在只做 re-export / compatibility adapter，并在文件头写明真实实现已迁到 `lib/resident/**`、保留理由和删除条件。

本轮保留不迁移的真实实现：

- `lib/external/mcp/handlers/bootstrap-internal.ts`、`rescan-internal.ts` 仍被 CLI / daemon job / Go integration tests 消费；它们还连接 bootstrap / rescan workflow pipeline，本轮不拆。
- `lib/external/mcp/handlers/bootstrap/**` 仍是 cold-start pipeline compatibility surface，不做目录迁移。
- `lib/external/mcp/handlers/{browse,candidate,consolidate,consolidated,guard,knowledge,panorama,search,structure,system}.ts` 本轮保留在 legacy handler 目录，但已改用 resident schema helper。

## 删除候选与不得删除项

删除候选：

- 上述 7 个 `lib/external/mcp` alias 文件可在后续全部消费者切到 resident path、边界测试不再需要 old path allowlist，并经总控授权后删除。

不得删除：

- 当前整个 `lib/external/mcp` 目录不得删除；bootstrap/rescan、knowledge/search/panorama 等 handler 仍有真实消费者。
- `McpContext` / `McpServiceContainer` 等 transitional type names 本轮不得强行重命名；它们仍是 legacy MCP-compatible tool contract 的类型桥。

## 负向扫描

```text
rg -n "external/mcp/(tools|envelope|errorHandler|zodToMcpSchema)|external/mcp/handlers/(task|skill|types)|#external/mcp/handlers/types" bin lib test package.json tsconfig.json
```

结果：只剩 `test/unit/AgentModuleBoundaries.test.ts:391` 的历史 boundary allowlist 命中。

```text
rg -n "from '../../external/mcp/handlers/(task|skill)|#external/mcp/handlers/types|\\.\\./envelope\\.js|from './types\\.js'|from '../types\\.js'" lib/http lib/external/mcp/handlers test
```

结果：只剩 `test/unit/AgentModuleBoundaries.test.ts:391` 的历史 boundary allowlist 命中。

## 验证命令与结果

在 Alembic 仓库执行：

```text
npm run build:check
./node_modules/.bin/tsc --noEmit
npm run lint:repo-boundary
npm run lint:consumer-core-imports
npm run lint
npm run test:unit -- test/unit/KnowledgeAPI.test.ts test/unit/BootstrapRuntimeInitializer.test.ts test/unit/BootstrapDimensionAdmission.test.ts test/unit/DimensionRestoreState.test.ts
./node_modules/.bin/vitest run test/integration/ZodToMcpSchema.test.ts test/integration/WrapHandler.test.ts
git diff --check
git diff --check HEAD^ HEAD
```

验证结果：

- `npm run build:check` 未进入 Alembic 自身 `tsc`，被本地 AlembicCore `src/evolution.ts` export mismatch 阻塞；错误集中在 `CandidateForConsolidation`、`ConsolidationAction`、`DecayScoreResult`、`EvolutionGateway`、`assessDiffImpact` 等 Core evolution exports，不是本轮 Alembic 改动引入。本轮未修改 AlembicCore。
- `./node_modules/.bin/tsc --noEmit` 通过，验证 Alembic 本仓库 TypeScript 编译。
- `npm run lint:repo-boundary` 通过。
- `npm run lint:consumer-core-imports` 通过：扫描 370 files / 483 `@alembic/core` imports。
- `npm run lint` 通过退出码 0；输出仍有既有 warning，但无 error。
- Targeted unit 通过：4 files / 59 tests。
- Targeted integration 通过：2 files / 25 tests。
- `git diff --check` 通过。
- `git diff --check HEAD^ HEAD` 通过。

补充说明：

- 曾尝试 `npm run test:integration -- test/integration/ZodToMcpSchema.test.ts test/integration/WrapHandler.test.ts`，但该 script 固定包含 `test/integration` 目录，实际跑成全量 integration；失败点为当前环境 `listen EPERM ::1` 与 macOS sandbox stdout 异常，和本轮改动无关。已改用 direct Vitest targeted command 作为本轮 integration 证据。

## 遗留风险

- bootstrap / rescan internal handler 仍在旧 `lib/external/mcp` 路径；后续迁移必须覆盖 CLI、daemon job、GoSupport integration 和 bootstrap pipeline boundary tests。
- `lib/external/mcp` 仍有多份未迁移 handler 实现；本轮只是第一片，不代表 old path 可删除。
- `Mcp*` type naming 仍为 transitional legacy vocabulary；下一片可考虑在不破坏消费者的前提下新增 resident-named type alias。
- `npm run build:check` 当前受本地 AlembicCore evolution export mismatch 阻塞；需要 Core 窗口修复或回填后再恢复完整 build:check 证据。

## 下一步建议

- 等总控验收本轮 alias / negative scan 后，再启动第二片：bootstrap/rescan handler 新语义入口 + CLI / daemon consumer replacement。
- 不建议在第二片之前删除 `lib/external/mcp` old path；必须先再次跑完整 consumer scan。
- 若 Core CCIC-P3-C 补齐 high-reference facade readiness，下一轮可独立处理 Alembic / Plugin Core deep import consumer replacement；不要和 resident handler rename 混在同一个提交里。
