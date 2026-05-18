# AlembicAgent AI Source Boundary Agent Runtime

日期：2026-05-18
窗口：AlembicAgent
状态：待验收
来源计划：`docs/workspace/alembic-ai-source-boundary-plugin-enhancement-workspace-plan-2026-05-18.md`

## 完成范围

- Tool V2 `knowledge.submit` 非 bootstrap 新写入默认 source 从旧泛化 `agent` 收敛为 `alembic-agent`。
- Tool V2 `knowledge.submit` 的 gateway 批次级 source 与 userId 也收敛为 `alembic-agent`，不再保留泛化 `agent-tool` / `agent` 身份。
- Tool V2 `knowledge.manage` evolution 决策默认 source 从 `ide-agent` 切到 `alembic-agent`。
- `ide-agent` 保留为 evolution source 兼容输入，只用于读取 / 历史兼容，不再作为默认写入 fallback。
- 保留 domain-specific source：`file-change`、`rescan-evolution`、`metabolism`、`decay-scan`、`consolidation`、`relevance-audit`。
- terminal / sandbox 仍保留在 Agent tool capability 内，本轮未迁移给 Plugin。

## 文件变化

- `src/tools/v2/handlers/knowledge.ts`
  - 新增 `AGENT_RUNTIME_SOURCE = "alembic-agent"` 与 `LEGACY_IDE_AGENT_SOURCE = "ide-agent"`。
  - `knowledge.submit` 的非 bootstrap candidate source 改为 `alembic-agent`。
  - `knowledge.submit` 的 gateway `source` 与 `options.userId` 改为 `alembic-agent`。
  - evolution source 白名单新增 `alembic-agent`，保留 `ide-agent` 兼容。
  - `resolveEvolutionSource` 默认 fallback 改为 `alembic-agent`。
- `test/tool-v2-contract.test.ts`
  - 覆盖 `knowledge.submit` candidate source、gateway source 与 userId 的新默认值。
  - 覆盖 evolution 默认 `alembic-agent`，并验证 `ide-agent`、`file-change`、`rescan-evolution` 仍可通过。

## 提交

- `7dbf724f2f2ac1dea526c671da67d73122b3dc23` - `Align agent source defaults`
- `07ec864e8878fc0eaa233365dc27fddab949a228` - `Align agent gateway source identity`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npx biome format --write src/tools/v2/handlers/knowledge.ts test/tool-v2-contract.test.ts` | 通过，2 个文件已检查，无格式修复。 |
| `npx vitest run test/tool-v2-contract.test.ts` | 通过，1 个测试文件、6 个测试通过。 |
| `npm run build:check` | 通过。 |
| `npm run smoke:public-imports` | 通过，15 个 public subpath 可导入，5 个 forbidden subpath 被拒绝。 |
| `npm run lint:public-api-boundary` | 通过，15 个精确 export，无 wildcard export。 |
| `git diff --check` | 通过，无 whitespace error。 |
| `rg -n "ide-agent\|ide-edit\|host-agent\|alembic-agent\|agent-tool\|rescan-evolution\|file-change" src test --glob '!**/dist/**'` | 通过，剩余命中均为预期兼容、保留 domain source、测试断言或 Core public import 路径；`agent-tool` 无命中。 |
| `npm run check` | 通过，9 个测试文件、39 个测试通过；Biome 仍报告 23 个既有 warning，本轮未新增相关 warning。 |

## 残留扫描结果

- `alembic-agent`：仅出现在新 Agent runtime source 常量、测试断言和测试临时路径命名中。
- `ide-agent`：仅保留在 legacy compatibility source 常量与测试断言中。
- `agent-tool`：无命中。
- `file-change` / `rescan-evolution`：仍保留在 evolution domain source union / whitelist 与测试断言中。
- `host-agent`：仅命中 `src/agent/profiles/AgentStageFactoryRegistry.ts` 的 `@alembic/core/host-agent-workflows` public import path；不是 knowledge source 写入值，也不是 AI provider fallback。
- `ide-edit`：无命中。

## 遗留风险

- AlembicAgent 侧不需要新增 Core helper；当前 Core source contract 对本轮默认值切换已经足够。
- `@alembic/core/host-agent-workflows` 的包路径名称会继续出现在 Agent 关键词扫描里，但语义是 Core 提供的 host workflow helper，不是 Agent 写入 source。总控验收时应按路径命中解释，不作为错误 source 写入。
- `Alembic` 已回填 provider / route choice 边界并进入待验收；剩余消费层重点在 `AlembicPlugin` 的 `host-agent` / enhancement resolver 和 `AlembicDashboard` 的 source label 展示。

## 下一步建议

- `Alembic` 与 `AlembicAgent` 进入待验收，不再重复派发领取任务。
- `AlembicPlugin` 继续将外部宿主写入收敛为 `host-agent`，并实现本地 Alembic enhancement probe / resolver。
- `AlembicDashboard` 继续补齐 `host-agent`、`alembic-agent` 与 legacy source 的类型、筛选和 label 展示。
- 总控验收时运行跨仓库 source 负向扫描，确认新写入默认不再使用 `ide-agent` / `ide-edit`。
