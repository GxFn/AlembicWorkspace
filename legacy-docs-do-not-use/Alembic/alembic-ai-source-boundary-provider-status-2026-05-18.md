# Alembic AI Source Boundary Provider Status

日期：2026-05-18
窗口：Alembic
状态：待验收
总控计划：[`docs/workspace/alembic-ai-source-boundary-plugin-enhancement-workspace-plan-2026-05-18.md`](../workspace/alembic-ai-source-boundary-plugin-enhancement-workspace-plan-2026-05-18.md)

## 完成范围

- 修正 `bin/cli.ts` 的 `status --json`：未配置或 `none` provider 现在输出 `aiProvider: null`、`aiModel: null`，不再把 AI provider fallback 写成 `host-agent`。
- 保留 daemon health / capabilities 中上一波建立的 `enhancement.route = local-alembic` 与 `capabilities.internalAi`；`internalAi` 继续只表达 Alembic internal AI 配置状态：
  - `provider`
  - `model`
  - `configSource`
  - `available`
- 将 Alembic 消费层 proposal / evolution 单测的新写入默认 source 从旧 `ide-agent` 字面量改为 Core public contract `HOST_AGENT_SOURCE`。
- 没有修改 `AlembicPlugin` Codex tool policy，没有删除 daemon、HTTP/API、Dashboard server、JobStore、ProjectRegistry 或 internal AI jobs。

## 边界判定

- AI provider / model / key / config source 属于配置状态，不是 knowledge source。
- `host-agent` 在 Alembic 主仓库中只作为 Core public source contract 或 Plugin 归属说明出现；不再作为 `aiProvider` / `provider` fallback。
- `alembic-agent` 在 Alembic 主仓库剩余命中来自 Agent 抽取边界配置记录，不代表 Codex host-agent route。
- `@alembic/core/host-agent-workflows` 是 Core 既有 public subpath 名称；本轮不在 Alembic 主仓库改名或复制 Core helper。

## 提交

- Alembic 提交 hash：`f6b7f2f429e4873a4a1184a65c81477e84ff4e38`
- 提交标题：`fix: separate ai provider status from source`

## 验证命令与结果

- `npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts test/unit/ProposalRepository.test.ts test/unit/ConsolidatedProposal.test.ts test/unit/EvolutionGateway.test.ts test/unit/ProposalExecutor.test.ts`
  - 通过；6 个测试文件、69 个测试通过。
- `npm run build:check`
  - 通过；使用本地 `../AlembicCore` 构建 Core 后完成 Alembic TypeScript no-emit 检查。
- `npm run lint:consumer-core-imports`
  - 通过；扫描 415 个文件、560 个 `@alembic/core` imports。
- `npx biome check --diagnostic-level=error bin/cli.ts test/unit/ProposalRepository.test.ts test/unit/ConsolidatedProposal.test.ts test/unit/EvolutionGateway.test.ts test/unit/ProposalExecutor.test.ts`
  - 通过；5 个文件无错误。
- `git diff --check`
  - 通过。
- `git diff --check HEAD~1..HEAD`
  - 通过。
- `rg -n "aiProvider.*host-agent|provider.*host-agent|'ide-agent'|\"ide-agent\"|'ide-edit'|\"ide-edit\"" bin lib config templates README.md README_CN.md test --glob '!**/dist/**' --glob '!CHANGELOG.md'`
  - 无命中。
- `rg -n "aiProvider.*host-agent|provider.*host-agent|host-agent|alembic-agent|ide-agent|ide-edit" bin lib config templates README.md README_CN.md test --glob '!**/dist/**' --glob '!CHANGELOG.md'`
  - 有命中，但均已分类：
    - `README.md` 中的 Codex host-agent 归属说明。
    - `config/agent-extraction-boundary.json` 中的 AlembicAgent 历史计划 / 状态记录。
    - `config/core-import-boundary.json`、`lib/**`、`test/**` 中的 `@alembic/core/host-agent-workflows` public import path。

## 遗留风险

- 总控验收需接受 `@alembic/core/host-agent-workflows` 作为 Core public subpath 残留；这不是 provider fallback，也不是新 knowledge source 写入默认值。
- 本轮未触碰 AlembicPlugin route resolver；Plugin probe 仍应消费 daemon health 的 `enhancement` / `capabilities` 字段。

## 下一步建议

- `AlembicPlugin` 继续完成 local Alembic enhancement probe / resolver，并保持 Codex 外部宿主新写入使用 `host-agent`。
- `AlembicDashboard` 继续消费 Core source labels，区分 `host-agent`、`alembic-agent` 和旧兼容来源。
