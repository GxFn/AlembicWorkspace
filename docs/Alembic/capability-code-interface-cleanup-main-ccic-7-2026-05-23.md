# Capability Code Interface Cleanup — Alembic CCIC-7

日期：2026-05-23
窗口：`Alembic`
状态：待验收
提交：`2704216fdfda47b3327c7caf60f3a7df9b3429d2`

## 窗口定位

- 当前窗口：`Alembic` 主仓库执行窗口。
- 本轮职责：执行 `CCIC-P7-A`，从真实入口继续剪枝 `lib/external/mcp`，把仍需要的 resident handler 能力迁到 Alembic-owned 位置，删除无消费方 alias。
- 明确不承担：不修改 `AlembicPlugin`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard` 或 `AlembicTest`；不改变 Codex-facing MCP ownership；不删除 Core public export；不移动 cold-start / rescan workflow 到其它仓库。

## 完成范围

- 重新扫描 CLI / daemon / HTTP / tests 入口后确认：`knowledge`、`panorama` 等剩余旧 handler 的 repo 内直接消费者只剩 targeted tests / boundary tests，产品入口已经不依赖 `lib/external/mcp` 作为运行时路径。
- 将仍属于 Alembic resident service 的 handler 实现迁入 `lib/resident/tool-handlers/`：
  - `browse.ts`
  - `candidate.ts`
  - `consolidate.ts`
  - `consolidated.ts`
  - `guard.ts`
  - `knowledge.ts`
  - `panorama.ts`
  - `search.ts`
  - `structure.ts`
  - `system.ts`
- 删除无 repo 内消费方的旧 alias / legacy entrypoints：
  - `lib/external/mcp/{tools,envelope,errorHandler,zodToMcpSchema}.ts`
  - `lib/external/mcp/handlers/{skill,task,types,TargetClassifier,evolution-prescreen}.ts`
- 删除 `package.json` 中无消费方的 `#external/*` import map。
- 更新 targeted tests 改用 resident path，并在 `ResidentServiceBoundary.test.ts` 新增断言：`lib/external/mcp` 不得再出现 TypeScript entrypoints。
- 保留 `lib/external/mcp/README.md` 作为边界标记，说明 Codex-facing MCP runtime 不属于 Alembic 主仓库，新增 TypeScript modules 必须进入 resident 路径。

## 删除 / 保留判断

| 路径 / 类别 | 判断 | 证据 |
| --- | --- | --- |
| `lib/external/mcp/handlers/{browse,candidate,consolidate,consolidated,guard,knowledge,panorama,search,structure,system}.ts` | 已迁入 resident | handler 实现仍是 Alembic-owned resident capability，但旧路径无产品入口消费。 |
| `lib/external/mcp/{tools,envelope,errorHandler,zodToMcpSchema}.ts` | 已删除 | repo 内无真实 consumer，resident schema 已在 `lib/resident/tool-schema/**`。 |
| `lib/external/mcp/handlers/{skill,task,types}.ts` | 已删除 | HTTP routes 和 tests 已消费 resident paths；旧 alias 无真实 consumer。 |
| `lib/external/mcp/handlers/{TargetClassifier,evolution-prescreen}.ts` | 已删除 | 仅 re-export Core host-agent workflow symbol，repo 内无 import consumer。 |
| `lib/external/mcp/README.md` | 保留边界标记 | 不承载运行时模块；防止误以为空目录可重新放 MCP 源码。 |

## 验证命令

- `npm run build:check`：通过。
- `npm run lint:repo-boundary`：通过。
- `npm run lint:consumer-core-imports`：通过，扫描 361 files / 447 imports。
- `npx vitest run test/unit/ResidentServiceBoundary.test.ts test/unit/KnowledgeAPI.test.ts test/unit/McpPanorama.test.ts test/unit/AgentModuleBoundaries.test.ts`：通过，4 files / 72 tests。
- `npm run release:package-guard`：通过；仅提示 development lock 中 `../AlembicAgent` / `../AlembicCore` workspace-local entries，符合既有发布边界。
- `npm run lint:agent-extraction-boundary`：通过。
- `find lib/external/mcp -name '*.ts' -print`：无输出。
- `rg -n "external/mcp|#external" bin lib scripts package.json tsconfig.json config`：仅剩 `scripts/lint-agent-extraction-boundary.mjs` 中 `#external/ai/` historical guard 分支；无 `external/mcp` runtime path。
- `rg -n "external/mcp/handlers/(knowledge|panorama|search|candidate|guard|structure|consolidate|consolidated|browse|system)|../../lib/external/mcp|#external/mcp" test lib bin scripts package.json`：仅剩 `test/unit/AgentModuleBoundaries.test.ts` 的负向 fixture 字符串。
- `git diff --check HEAD^ HEAD`：通过。

## 额外验证说明

- `npm run lint` 仍失败于既有全仓 Biome 债，命中 `lib/bootstrap.ts` 非空断言、`lib/cli/SetupService.ts` console、`lib/governance/gateway/GatewayActionRegistry.ts` any 等；这些不在本轮修改范围内，且 CCIC-P7-A 要求的边界 lint / build / targeted tests 已通过。

## 遗留风险

- `test/unit/AgentModuleBoundaries.test.ts` 仍保留 `#external/mcp/...` 字符串作为 retired import 负向 fixture，不是产品消费方。
- `scripts/lint-agent-extraction-boundary.mjs` 中 `#external/ai/` 仅是历史 guard 分支；本轮未顺手处理，避免扩大到 Agent extraction lint 规则语义。
- Plugin 旧 Dashboard / 旧调用方兼容和 package/runtime/channel 身份仍由 `AlembicPlugin` 的 `CCIC-P7-P` 承担，本提交不覆盖。

## 下一步建议

- 总控验收 Alembic 提交 `2704216fdfda47b3327c7caf60f3a7df9b3429d2` 后，可将 `CCIC-P7-A` 标记为已完成。
- 等 `AlembicPlugin` 回填 `CCIC-P7-P` 后，再统一判断是否进入 CCIC-8 总体验收，或追加 Plugin 与 Alembic 主体 service contract / Core additive readiness 的窄任务。
