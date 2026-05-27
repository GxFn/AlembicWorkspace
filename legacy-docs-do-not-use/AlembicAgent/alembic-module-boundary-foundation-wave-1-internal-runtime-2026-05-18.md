# AlembicAgent Module Boundary Foundation Wave 1 Internal Runtime

日期：2026-05-18
窗口：AlembicAgent
状态：待验收
来源计划：`docs/workspace/alembic-module-boundary-foundation-wave-1-workspace-plan-2026-05-18.md`

## 完成范围

- 新增 `AgentRuntimeBoundary` public contract，明确 `AlembicAgent` 负责 Alembic internal AI runtime，不承接 Plugin Codex MCP / marketplace / host-agent route。
- 公开 internal runtime 模块边界：
  - `ai-provider`：`@alembic/agent/ai`
  - `tool-execution`：`@alembic/agent/tools`
  - `terminal-sandbox`：`@alembic/agent/tools/terminal`
  - `context-memory`：`@alembic/agent/context`
  - `prompt-runtime`：`@alembic/agent/prompts`
  - `tool-v2`：`@alembic/agent/tools/v2`
  - `host-agent-route`：显式标记为 host / Plugin-owned，不提供 Agent public subpath。
- terminal / sandbox 继续作为 Agent tool capability，保留 `@alembic/agent/tools/terminal` public contract；`@alembic/core/host-agent-workflows` 仅作为 Core public helper 引用，不代表 Agent 承接 Plugin host-agent route。
- 更新 public API boundary matrix，把 `internal runtime boundary manifest` 纳入 `@alembic/agent/runtime` 的 agent-owned public contract。
- 补充 contract surface 测试，锁定 runtimeLine、unsupported host routes、terminal-sandbox public subpath 和 host-agent-route ownership。

## 文件变化

- `src/agent/runtime/AgentRuntimeBoundary.ts`
  - 新增 `ALEMBIC_AGENT_RUNTIME_BOUNDARY` manifest。
  - 新增 `getAgentRuntimeBoundaryEntry()` 和 `supportsAgentRuntimeRoute()`。
  - 新增 boundary area / owner / manifest 类型。
- `src/agent/runtime/index.ts`
  - 显式导出 internal runtime boundary manifest、helper 和类型。
- `config/agent-public-api-boundary.json`
  - 将 runtime boundary manifest 写入 `./runtime` public contract matrix。
- `test/contract-surface.test.ts`
  - 覆盖 `@alembic/agent/runtime` 的 internal runtime boundary contract。

## 提交

- `e043122efb55c050a33cc06b9a6067ce685593c6` - `Add internal runtime boundary contract`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npx biome format --write src/agent/runtime/AgentRuntimeBoundary.ts src/agent/runtime/index.ts test/contract-surface.test.ts` | 通过，3 个文件处理，1 个文件格式化。 |
| `npx vitest run test/contract-surface.test.ts` | 通过，1 个测试文件、5 个测试通过。 |
| `npm run build:check` | 通过。 |
| `npm run smoke:public-imports` | 通过，15 个 public subpath 可导入，5 个 forbidden subpath 被拒绝。 |
| `npm run lint:public-api-boundary` | 通过，15 个精确 export，无 wildcard export。 |
| `npx vitest run test/tool-v2-contract.test.ts` | 通过，1 个测试文件、6 个测试通过。 |
| `npx vitest run test/contract-surface.test.ts test/tool-v2-contract.test.ts` | 通过，2 个测试文件、11 个测试通过。 |
| `git diff --check` | 通过。 |

## 验证结果

- `@alembic/agent/runtime` 现在可通过 public API 读取 Agent internal runtime 边界，不需要 deep import。
- `supportsAgentRuntimeRoute("alembic-internal-ai")` 返回 `true`，`supportsAgentRuntimeRoute("plugin-host-agent-route")` 返回 `false`。
- `ALEMBIC_AGENT_RUNTIME_BOUNDARY.hostAgentRouteSupported` 固定为 `false`。
- terminal / sandbox contract 仍通过 `@alembic/agent/tools/terminal` 暴露，真实进程、PTY、沙箱执行和审批 UI 仍由宿主注入或执行。

## 遗留风险

- `AgentRuntimeBoundary` 是模块边界 manifest，不替代 Core 的多项目 runtime / capability contract；若 Alembic / Plugin / Dashboard 需要统一 project identity、daemon capability、file monitor capability shape，应由 `AlembicCore` 本波补充或后续 wave 收口。
- `@alembic/core/host-agent-workflows` 仍会作为字符串和 import path 出现在 Agent 相关语境中；该命中表示 Core public helper，不是 Plugin host-agent route 归属。
- 本波没有迁移目录或拆大型实现，避免在前期模块划分阶段引入不必要 churn。

## 下一波模块划分建议

- `AlembicCore` 若补出 runtime / capability / route kind public contract，`AlembicAgent` 可在下一波把 `AgentRuntimeBoundary` 的 runtimeLine 或 area 字段对齐到 Core canonical 类型，而不是保留本地字符串。
- `Alembic` 接入 internal AI runtime 时优先消费 `@alembic/agent/runtime`、`@alembic/agent/ai`、`@alembic/agent/tools/v2`、`@alembic/agent/tools/terminal`，避免 deep import runtime internals。
- `AlembicPlugin` 若需要 host-agent route，应继续在 Plugin 自己的 Codex adapter 层实现；不要从 `AlembicAgent` 引入 Codex MCP / marketplace 路由。
- `AlembicDashboard` 若展示 runtime route，可消费后端 capability 字段；不要把 `AgentRuntimeBoundary` 当作前端路由策略来源。
