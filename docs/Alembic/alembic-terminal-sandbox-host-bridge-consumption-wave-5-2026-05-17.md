# Alembic Terminal Sandbox Host Bridge Consumption Wave 5

日期：2026-05-17
状态：已完成，待总控验收
提交：`6598857fddd2f94d3d5c05ec5c1836879d1fc657`

本文记录 Alembic 在 Wave 5 中消费 AlembicAgent terminal public contract，并删除本地 portable terminal duplicate 的结果。本轮只处理 Alembic 仓库内容；真实 process / PTY / macOS Seatbelt sandbox / audit / artifact / DI wiring 继续由 Alembic host bridge 负责。

## 完成范围

- `TerminalAdapter`、terminal executors、Agent module 和 terminal policy tests 改为消费 `@alembic/agent/tools/terminal`。
- 删除本地 portable duplicate：
  - `lib/tools/adapters/terminal-capabilities/**`
  - `lib/tools/adapters/terminal-policy/**`
  - `lib/tools/adapters/TerminalSession.ts`
  - `lib/tools/adapters/terminal-adapter/TerminalEnvelopes.ts`
- 保留 host bridge：
  - `lib/tools/adapters/TerminalAdapter.ts`
  - `lib/tools/adapters/TerminalSessionManager.ts`
  - `lib/tools/adapters/terminal-adapter/Terminal*Executor.ts`
  - `lib/tools/adapters/terminal-adapter/TerminalArtifacts.ts`
  - `lib/tools/adapters/terminal-adapter/TerminalAudit.ts`
  - `lib/tools/adapters/terminal-adapter/TerminalEnvironment.ts`
  - `lib/tools/adapters/terminal-adapter/TerminalPtyRunner.ts`
  - `lib/sandbox/**`
- `TerminalSessionManager` 继续是 Alembic host-owned concrete session storage，但其 portable session plan type 已改为来自 `@alembic/agent/tools/terminal`。
- `scripts/lint-agent-extraction-boundary.mjs` 新增 Wave 5 hard gate：terminal capability/policy/session plan/envelope duplicate 必须为 0，并统计 `@alembic/agent/tools/terminal` consumers。
- `config/agent-extraction-boundary.json` 新增 `phase10TerminalSandboxAgentToolBoundary` 与 `terminalToolContractRules`，把剩余 terminal 文件重分类为 host bridge。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run lint:agent-extraction-boundary` | 通过；`@alembic/agent/tools/terminal consumer files: 10`，terminal capability/policy/session plan/envelope duplicate 均为 0。 |
| `npm run build:check` | 通过。 |
| `node --input-type=module` terminal contract import smoke | 通过；`manifestCount: 7`，policy/session/envelope exports 均存在。 |
| `npm run test:unit -- test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalSessionManager.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentModuleBoundaries.test.ts` | 通过；4 个 test files，82 个 tests。 |
| `npm run test:unit -- test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalSessionManager.test.ts test/unit/TerminalAdapter.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentModuleBoundaries.test.ts` | 已尝试；`TerminalAdapter.test.ts` 真实执行路径受当前 sandbox 限制失败，具体为 `sandbox-exec: sandbox_apply: Operation not permitted`；其余 4 个无 OS sandbox 依赖文件通过。 |
| `npm run check` | 通过；仍有既有 Biome warnings，未阻断。 |
| `npm run build` | 通过。 |
| `node dist/bin/cli.js status --json` | 通过；workspace 检测成功，当前测试环境 database not found。 |
| `rg -n "terminal-capabilities\|terminal-policy\|TerminalSession" lib/tools/adapters --glob '*.ts'` | 通过；只剩 host-owned `TerminalSessionManager` 相关引用。 |
| `rg -n "terminal-capabilities\|terminal-policy\|TerminalEnvelopes\|TerminalSession\\.js" lib/tools/adapters --glob '*.ts'` | 通过；无匹配。 |
| `git diff --check` | 通过。 |

## 遗留风险

- `TerminalSessionManager` 保留 host-specific session storage 语义，包含 projectRoot 隔离、env 持久化元数据、lease 状态和 commandCount；这不是 portable session plan duplicate。
- 当前环境不能运行真实 `TerminalAdapter` sandbox execution 成功路径，需在允许 `sandbox-exec` / Seatbelt 的宿主环境中复跑 `TerminalAdapter.test.ts`。
- 如果未来 Agent terminal contract shape 改变，Alembic 应更新 host bridge 消费代码，不恢复本地 `terminal-capabilities`、`terminal-policy`、`TerminalSession.ts` 或 `TerminalEnvelopes.ts`。

## 下一步建议

- 总控复验提交 `6598857fddd2f94d3d5c05ec5c1836879d1fc657` 的删除清单、hard gate 输出和 terminal host bridge 分类。
- Dashboard 仅在 tools/capabilities API response shape 变化时补 UI/API smoke；本轮 Alembic 没有直接修改 Dashboard contract。
- Plugin 继续保持 agent-free，不接入 terminal contract。
