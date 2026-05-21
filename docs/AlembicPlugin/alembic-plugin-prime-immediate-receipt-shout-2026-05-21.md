# AlembicPlugin Prime Immediate Receipt Shout

状态：已通过总控验收
日期：2026-05-21
对应总控计划：[../workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](../workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)

## 完成范围

- `alembic_task(operation="prime")` 的 `primeKnowledgeMaterial.hostResponse` 已新增立即时序契约：`action: "shout_prime_knowledge_receipt"`、`timing: "immediate_after_prime"`、`required: true`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"`。
- `shoutInstruction` 已覆盖 `delivered`、`empty`、`degraded` 三种状态，均要求 Codex 在 prime tool result 后、任何工具调用 / 代码阅读 / 编辑 / Guard / 最终总结前，先输出开发者可见的知识接收声明。
- `message` 中的提醒文案也同步为 immediate 语义，避免 tool result 文本和结构化字段互相打架。
- Alembic Codex Skill 的 Daily Coding Flow 已调整为 `prime -> immediate receipt shout -> search/read/edit/guard/final summary`。
- 已刷新 AlembicCodex runtime artifact：`runtime.tgz`、runtime dist `task.js`、runtime skill 均包含相同契约。
- local daemon ready 时 `alembic_task prime` 仍保持 Plugin-owned Codex-facing 路径；未改 `Alembic` daemon bridge，未新增虚构 `codex_host_response` tool。

## 提交 Hash

- AlembicPlugin：`829f838704159c7ed205f93ecd986c6234173721`
- AlembicCodex runtime artifact：`682e5d32b9442c1caba9df87f61efb8b0835e870`
- 消费的本地 AlembicCore source hash（仅 build/verify 读取，未修改）：`bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`

## 验证命令

- `npx biome check --write lib/external/mcp/handlers/task.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`
- `npm run test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`
- `npm run build:check`
- `npm run build`
- `npm run prepare:codex-plugin-runtime`
- `npm run verify:codex-plugin`
- `npm run verify:codex-channel`
- `npm run verify:release-package-boundary`
- `git diff --check`（AlembicPlugin）
- `git diff --check`（AlembicCodex）

## 验证结果

- Biome targeted check 通过。
- targeted vitest 通过：`TaskPrimeKnowledgeMaterial.test.ts` 3 tests，`CodexMcpServer.test.ts` 35 tests，共 38 tests passed。
- `build:check` 通过。
- `build` 通过，并完成 postbuild。
- `prepare:codex-plugin-runtime` 通过，产物路径为 `plugins/alembic-codex/runtime.tgz`。
- `verify:codex-plugin` 通过：`./runtime.tgz -> alembic-ai@0.1.2`。
- `verify:codex-channel` 通过：`alembic-ai@0.1.2`。
- `verify:release-package-boundary` 通过，root npm publish 仍禁用，embedded runtime 仍使用 `@alembic/core: file:vendor/AlembicCore` 和 `.alembic-source.json`。
- 两个仓库的 `git diff --check` 均通过。

## 关键契约

`hostResponse` 新增 / 保留字段：

```json
{
  "action": "shout_prime_knowledge_receipt",
  "timing": "immediate_after_prime",
  "required": true,
  "requiredBeforeNextAction": true,
  "visibility": "developer_visible",
  "receiptId": "<prime-receipt-id>",
  "status": "delivered|empty|degraded"
}
```

`shoutInstruction` 的共同顺序约束：

```text
Immediately after this prime tool result, before any further tool call, code reading, edit, Guard check, or final summary...
```

## 边界判断

- 不需要 Core 共享层下沉：当前只有 AlembicPlugin 生产并直接面向 Codex host agent 消费该契约，没有第二个真实生产方或稳定共享消费方。
- 可以创建 AlembicTest 真实项目复测单：建议总控验收后创建 BiliDili 复测，重点验证 Codex 在真实 prime 后立即发出开发者可见 receipt shout，而不是等最终总结。
- 未触碰 BiliDili、Alembic、AlembicCore 源码、AlembicAgent 或 AlembicDashboard。

## 遗留风险

- 单元测试和 artifact 验证能证明 payload / Skill / runtime 产物一致，但真实 Codex 可见行为仍依赖 host agent 按 Skill 和 tool result 契约执行，需要 AlembicTest 在 BiliDili 真实项目里补一轮可见行为复测。
- 当前契约仍是 Plugin 局部类型。若后续 Dashboard、Core 或其它宿主需要共同理解 `PrimeHostResponseInstruction`，再按真实双向消费证据评估 shared contract。

## 下一步建议

- 总控复核提交与文档后，在 `docs/workspace/alembic-test-exchange.md` 创建 `Test-2026-05-21-03`，验证 BiliDili 真实项目中 prime 后的下一条可见响应就是 knowledge receipt shout。
- 如果真实复测发现 Codex 未遵守 immediate receipt，可在 AlembicPlugin 继续增强 Skill 文案或 tool response schema，但仍不把 Plugin 改成替 Codex 生成固定全文。

## 总控验收

- 2026-05-21：总控验收通过。验收证据：`lib/external/mcp/handlers/task.ts` 的 `PrimeHostResponseInstruction`、`_buildPrimeShoutInstruction()` 和 `_buildPrimeHostResponseInstruction()` 均已体现 immediate-before-next-action 契约；`plugins/alembic-codex/skills/alembic/SKILL.md` 已要求 prime tool result 后下一条可见响应是 receipt shout；`test/unit/TaskPrimeKnowledgeMaterial.test.ts` 覆盖 delivered / empty / degraded 三态字段与文案；`test/unit/CodexMcpServer.test.ts` 覆盖 local daemon ready 时仍保留 Plugin-owned prime payload；runtime artifact commit `682e5d32b9442c1caba9df87f61efb8b0835e870` 已包含 runtime skill 和 dist task 产物。
- 2026-05-21：总控已刷新本机 Codex plugin cache，cache marker `gitHead=829f838704159c7ed205f93ecd986c6234173721`，可用于后续 AlembicTest 真实 Codex 可见行为复测。
