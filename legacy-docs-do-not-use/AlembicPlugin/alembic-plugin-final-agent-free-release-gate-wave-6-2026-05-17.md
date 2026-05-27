# AlembicPlugin Final Agent-Free Release Gate Wave 6

日期：2026-05-17
窗口：AlembicPlugin
状态：已完成
总控入口：`docs/workspace/alembic-agent-cutover-final-integration-readiness-wave-6-plan-2026-05-17.md`

## 1. 完成范围

- 删除未使用的旧 ambient Agent 类型声明：`lib/types/agent.d.ts`。
- 同步清理 `lib/types/global.d.ts` 中对该类型文件的索引说明。
- 更新 AlembicPlugin `AGENTS.md`，把旧 `lib/agent/**`、`lib/tools/**` 必须保留的过期说明改为当前 agent-free 插件边界。
- 复验 AlembicPlugin 没有 `@alembic/agent` 依赖，没有本地 Agent / AI provider / Tool V2 runtime 回流。
- 复验 Codex plugin 打包、channel、安装、stdio 和 npx runtime smoke。

本轮没有修改 Codex MCP tool schema、skill、channel、runtime env、release script 或 daemon/dashboard 能力。

## 2. 提交

- AlembicPlugin 最新提交：`68e0d4b6af0e13d44e6a10a084f5046f379024b7`
- 本轮提交：
  - `85a62846603c794b3203624e96613ab89bf7febc`：`chore: remove residual agent ambient types`
  - `68e0d4b6af0e13d44e6a10a084f5046f379024b7`：`docs: align plugin agent-free boundaries`

## 3. 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run report:agent-extraction-boundary` | 通过；扫描 315 个 source files；`filesWithBoundaryImports`、`agentImportFiles`、`aiImportFiles`、`toolImportFiles`、全部 outside implementation 计数均为 0。 |
| `npm run check` | 通过；`typecheck` 通过；Biome 检查 176 个文件，仍有既有 123 warnings / 29 infos，退出码 0；Core import boundary 扫描 315 个文件和 517 个 `@alembic/core` imports，通过。 |
| `npm run build` | 通过；先构建 vendor Core，再清理并构建本仓库 dist，`postbuild` 通过。 |
| `npm run verify:codex-plugin` | 通过；`runtime.tgz` 验证为 `alembic-ai@0.1.2`。 |
| `npm run verify:codex-channel` | 通过；Codex channel 验证为 `alembic-ai@0.1.2`。 |
| `npm run smoke:codex-plugin` | 通过；`install`、`stdio`、`npxRuntime` 均为 `passed`；`recovery` 和 `daemon` 为 `skipped`。 |
| `rg -n "@alembic/agent\|lib/agent\|local AI provider\|Tool V2" lib bin config scripts plugins --glob '*.ts' --glob '*.js' --glob '*.mjs' --glob '*.json'` | 仅命中 `scripts/report-agent-extraction-boundary.mjs` 中用于审计旧实现前缀的 `lib/agent/` 标签；未命中运行时代码、配置或插件资源。 |
| `rg -n "@alembic/agent\|from ['\"]#agent\|from ['\"]#tools\|lib/agent\|lib/tools\|lib/external/ai\|local AI provider\|Tool V2" lib bin config scripts plugins --glob '*.ts' --glob '*.js' --glob '*.mjs' --glob '*.json'` | 仅命中 `scripts/report-agent-extraction-boundary.mjs` 的审计标签；无真实 import 或 runtime 回流。 |
| `rg -n "PlanStep\|DistilledContext\|interface Plan\|lib/types/agent\|types/agent" lib bin config scripts plugins test --glob '*.ts' --glob '*.js' --glob '*.mjs' --glob '*.d.ts'` | 无匹配；旧 ambient Agent 类型删除后没有遗留引用。 |
| `git status --short` | AlembicPlugin 主仓库干净；`plugins/alembic-codex` 子仓库干净。 |

## 4. 边界判断

- `lib/agent/**`、`lib/tools/**`、`lib/external/ai/**` 在 AlembicPlugin 源码树中不存在。
- `@alembic/agent` 未出现在生产源码、配置、脚本或插件资源中。
- `#agent/*`、`#tools/*`、`#external/ai/*` 没有真实 import。
- `lib/external/mcp/tools.ts` 和对应插件 runtime dist 文件属于 Codex MCP tool 声明，是 AlembicPlugin 必须保留的宿主插件工具 schema，不是 Agent Tool V2 runtime。
- `plugins/alembic-codex/runtime/templates/instructions/agent-static.md` 是 Codex/AGENTS 指令模板，不是本地 Agent runtime。
- `scripts/report-agent-extraction-boundary.mjs` 保留 `lib/agent/`、`lib/external/ai/`、`lib/tools/` 字符串作为历史删除边界审计标签，不构成运行时代码回流。
- AlembicPlugin `AGENTS.md` 已同步为当前边界：允许保留 Codex MCP tool schema 和插件交付资源，禁止恢复本地 Agent / AI provider / Tool V2 runtime。

## 5. 遗留风险

- `npm run check` 仍输出既有 Biome warnings / infos；本轮未扩大到样式债清理。
- 本轮 `smoke:codex-plugin` 不启动 live daemon，daemon/recovery 项按脚本设计为 `skipped`。如发布前需要 live daemon 证据，应在允许本地端口监听的宿主环境中额外运行 daemon smoke，并回填端口、启动方式和日志。
- `alembic-ai@0.1.2` 包名和部分 metadata 仍包含历史 `ai` / `agent` 关键词；用户已明确该版本后续会丢弃，本轮不处理包名和版本策略。

## 6. 下一步建议

- 等待 `Alembic` 完成 Wave 6 host terminal/sandbox smoke，确认 capability/API shape 后再决定 Dashboard 是否需要 live smoke。
- 如准备真实发布，先重复本页 release gate，并按需补 live daemon smoke。
- 后续 AlembicPlugin 代码不得重新引入 `@alembic/agent`、`#agent/*`、`#tools/*`、`#external/ai/*` 或本地 Agent / AI provider / Tool V2 runtime。
