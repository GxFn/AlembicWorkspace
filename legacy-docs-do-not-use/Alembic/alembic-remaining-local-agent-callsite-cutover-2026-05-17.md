# Alembic Remaining Local Agent Callsite Cutover

日期：2026-05-17
状态：已完成，待总控验收
提交：`4be3b1e`

本文记录 Alembic 在 Wave 3 中消费 AlembicAgent remaining host contract surface 的结果。本轮只切换最后 3 个生产侧本地 `lib/agent/**` 调用并补强边界 lint；未删除 `lib/agent/**`、`lib/tools/v2/**`、`ToolContextFactory` 或任何 host adapter。

## 完成范围

- `lib/injection/modules/AgentModule.ts`：`ToolForge` 从本地 `../../agent/forge/ToolForge.js` 切换为 `@alembic/agent/forge`。
- `lib/http/routes/ai.ts`：`PRESETS` 从本地 profiles 切换为 `@alembic/agent/profiles`。
- `lib/http/routes/ai.ts`：`taskCheckAndSubmit`、`taskDiscoverAllRelations`、`taskFullEnrich`、`taskGuardFullScan`、`taskQualityAudit` 从本地 task handlers 切换为 `@alembic/agent/tasks`。
- `scripts/lint-agent-extraction-boundary.mjs`：扩展为扫描 `lib`、`bin`、`scripts` 中的源码 import，并解析相对路径；生产侧相对导入只要解析到本地 `lib/agent/**` 且不在 preserved local Agent implementation 内，就会被阻断。
- `config/agent-extraction-boundary.json`：补充 Wave 3 evidence、相对路径本地 Agent import policy，以及 Wave 4 删除 / quarantine 入口条件。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `node -e "Promise.all([import('@alembic/agent/forge'), import('@alembic/agent/tasks'), import('@alembic/agent/profiles')])..."` | 通过；`ToolForge`、task handlers、`PRESETS` 可从 public subpaths 导入。 |
| `npm run lint:agent-extraction-boundary` | 通过；`local Agent relative import files: 0`，`local Agent relative imports: 0`。 |
| `rg -n "\\.\\./\\.\\./agent/\|\\.\\./agent/\|#agent/\|lib/agent/" lib bin scripts --glob '*.ts' --glob '*.js' --glob '*.mjs'` | 生产侧本地 `lib/agent/**` 相对导入无匹配；仅剩 lint 脚本文本和 classified `lib/tools/v2/capabilities/CapabilityV2.ts` 的 `#agent/capabilities/Capability.js`。 |
| `npm run build:check` | 通过。 |
| `npm run test:unit -- test/unit/AgentTaskHandlers.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/AgentModuleBoundaries.test.ts` | 通过；3 个 test files，15 个 tests。 |
| `npm run lint -- --diagnostic-level=error` | 通过。 |
| `npm run check` | 通过；存在既有 Biome warnings，未阻断。 |
| `npm run build` | 通过。 |
| `node dist/bin/cli.js status --json` | 通过；workspace 检测成功，当前测试环境 database not found。 |

## 遗留风险

- `lib/agent/**` 仍保留为删除候选；本轮只消除生产侧本地相对调用，不做目录删除。
- `lib/tools/v2/**` 仍保留为 Wave 4 删除 / quarantine 候选；`lib/tools/v2/adapter/ToolContextFactory.ts` 继续作为 Alembic host-owned bridge。
- `lib/tools/v2/capabilities/CapabilityV2.ts` 仍有 classified `#agent/capabilities/Capability.js`，其所在目录属于 local Tool V2 generic deletion candidate，应在 Wave 4 处理。
- `ToolForge` public declaration 仍携带 Agent package 内部 nominal class 类型；Alembic 用一个最小 constructor bridge 隔离 TypeScript 私有字段身份差异。后续可由 AlembicAgent 发布结构化 `ToolForgeOptions` contract 来移除该桥。

## 下一步建议

- 总控复验本轮 `4be3b1e` 的 validation 输出后，允许进入 Wave 4。
- Wave 4 优先做只读删除候选审计：区分 duplicate local Agent / Tool V2 implementation、host-owned adapters、测试仍需的 fixture 或 local implementation coverage。
- 删除或 quarantine 前继续保留 `ToolContextFactory`、Dashboard/Mac/Skill/Terminal/Workflow/MCP host adapters，并保持 `lint:agent-extraction-boundary` 阻断生产侧本地 Agent 相对路径回流。
