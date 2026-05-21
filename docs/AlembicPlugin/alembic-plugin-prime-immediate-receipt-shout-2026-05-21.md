# AlembicPlugin Prime Immediate Receipt Shout

状态：SHOUT-7 待总控验收；SHOUT-5 已通过总控验收；SHOUT-1/2 已通过总控验收
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

## SHOUT-5 可见摘要优化回填

状态：已通过总控验收

完成范围：

- `lib/external/mcp/handlers/task.ts` 的 delivered 态 `shoutInstruction` 已从 evidenceRefs 引用优先，改为要求 Codex 立即喊出简短、主动、有声量的知识接收摘要：说明接收到的 Recipe / Guard 约束、模式和后续判断依据。
- `message` 中的 delivered 条目不再附带 `sourceRefs` 路径清单；证据仍保留在 `primeKnowledgeMaterial.acceptedKnowledge[].evidenceRefs` 和 `acceptedGuards[].evidenceRefs` 中，供后续读代码、复核或用户要求引用。
- empty / degraded 态继续保持 prime tool result 后立即发声的时序，只把可见文案改成 “shout a clear receipt”。
- `hostResponse` 字段、`timing: "immediate_after_prime"`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"` 和 `receiptId` / `status` 结构未改变。
- Alembic Codex Skill 与 runtime artifact 已同步：runtime `task.js`、runtime Skill 和 `runtime.tgz` 均包含同样文案。

提交 Hash：

- AlembicPlugin：`58b82f8526d68aef516d68477d7a0e505fc114e9`
- AlembicCodex runtime artifact：`df608057bd274ebb6b39f6a9c0e964f1b8517426`
- 消费的本地 AlembicCore source hash（仅 build/verify 读取，未修改）：`bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`

验证命令 / 结果：

- `npx biome check --write lib/external/mcp/handlers/task.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`：通过。
- `npm run test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`：通过，38 tests passed。
- `npm run build:check`：通过。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run verify:release-package-boundary`：通过，root npm publish 仍禁用，embedded runtime 仍使用 `@alembic/core: file:vendor/AlembicCore` 和 `.alembic-source.json`。
- `rg "Cite evidenceRefs|line number is missing|evidence refs when present|📍" lib plugins/alembic-codex/skills plugins/alembic-codex/runtime/dist/lib/external/mcp/handlers/task.js plugins/alembic-codex/runtime/plugins/alembic-codex/skills/alembic/SKILL.md`：生产代码 / Skill / runtime artifact 0 命中。
- `git diff --check`（AlembicPlugin 和 AlembicCodex）：均通过。

边界判断：

- 未修改 BiliDili。
- 未修改 `Alembic` daemon bridge。
- 未新增 `codex_host_response` tool。
- local daemon ready 时 `alembic_task prime` 仍由 Plugin-owned Codex-facing handler 生成 payload。
- 不需要 Core 共享层下沉：当前仍只有 AlembicPlugin 生产并直接面向 Codex host agent 消费该契约。

后续建议：

- 需要总控验收后刷新本机 Codex plugin cache，推荐命令仍为 `npm run dev:codex-plugin:refresh`。
- 建议创建新的 AlembicTest 复测单，在 BiliDili 场景验证真实 Codex 可见呐喊是否变成简短、有声量的 Recipe / Guard 摘要，并确认不默认倾倒 evidenceRefs 路径 / 行号。

### 总控验收

- 2026-05-21：总控验收 SHOUT-5 通过。验收证据：`lib/external/mcp/handlers/task.ts:280` 的 tool result message 要求 “shout a short knowledge receipt” 并明确 `evidenceRefs` 留在 payload 中；`task.ts:418` 的 delivered 态 `shoutInstruction` 要求 “shout a short, active knowledge receipt”，`task.ts:419` 要求 “Make it feel like a real shout”，`task.ts:420` 明确不要默认列出 evidenceRefs 路径或行号；`task.ts:448-451` 保持 `timing: "immediate_after_prime"`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"`；Skill 与 runtime Skill 均已同步“briefly and actively shout”与不默认 dump paths / line numbers；单元测试覆盖短知识 receipt、旧证据倾倒文案负向断言和 Plugin-owned prime boundary。
- 2026-05-21：总控已刷新本机 Codex plugin cache。命令：`npm run dev:codex-plugin:refresh`。结果：成功；cache marker `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，`localMcpEntry=/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/dist/bin/codex-mcp.js`，runtime tarball hash `0f37bf3acaaa31df9d56531bafe46e853feaddd6815f50c9e958bdfa4a8697eb`；cache Skill 已包含 “briefly and actively shout”，cache runtime dist 已包含 “shout a short, active knowledge receipt”。
- 2026-05-21：下一步已创建 `Test-2026-05-21-04`，交给 `AlembicTest` 在 BiliDili 真实项目中复测可见摘要质量与不默认倾倒 evidenceRefs。

## SHOUT-7 可见主语收紧回填

状态：待总控验收

完成范围：

- `lib/external/mcp/handlers/task.ts` 的 delivered / empty / degraded 三态 tool result message 与 `shoutInstruction` 已明确要求 Codex / first-person 作为开发者可见 receipt 的说话者。
- delivered 态要求 “Speak as Codex or I” 与 “Use Codex/first-person as the speaker”；empty / degraded 态改成 “I did not receive...” 口径。
- `hostResponse.reason` 已改成 “As Codex...” 口径，并明确不要让 Alembic prime 成为 recipient / speaker。
- 保持 `hostResponse.action`、`timing: "immediate_after_prime"`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"` 和 `primeKnowledgeMaterial.evidenceRefs` 结构不变。
- Alembic Codex Skill 已要求 “shout as Codex or I”，并禁止 “Alembic prime”、prime 或工具 / 流程作为可见 receipt 的 speaker / subject。
- 已刷新 AlembicCodex runtime artifact：`runtime.tgz`、runtime dist `task.js`、runtime skill 均包含相同主语约束。

提交 Hash：

- AlembicPlugin：`45db3a780759b7e4db24f920acbd56f0b4684d63`
- AlembicCodex runtime artifact：`2d4d8f0ce2b0a884e88a799be4fba7dffd47626a`
- 消费的本地 AlembicCore source hash（仅 build/verify 读取，未修改）：`bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`

验证命令 / 结果：

- `npx biome check --write lib/external/mcp/handlers/task.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`：通过。
- `npm run test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`：通过，38 tests passed。
- `npm run build:check`：通过。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run verify:release-package-boundary`：通过，root npm publish 仍禁用，embedded runtime 仍使用 `@alembic/core: file:vendor/AlembicCore` 和 `.alembic-source.json`。
- `npm run verify:codex-session`：通过，6 tests passed。
- `rg "Alembic prime (has )?(accepted|received)|Alembic prime 已接收|prime 已接收|Cite evidenceRefs|line number is missing|evidence refs when present|📍" lib plugins/alembic-codex/skills plugins/alembic-codex/runtime/dist/lib/external/mcp/handlers/task.js plugins/alembic-codex/runtime/plugins/alembic-codex/skills/alembic/SKILL.md`：0 命中。
- `git diff --check`（AlembicPlugin 和 AlembicCodex）：均通过。

边界判断：

- 未修改 BiliDili。
- 未修改 `Alembic` daemon bridge。
- 未新增 `codex_host_response` tool。
- local daemon ready 时 `alembic_task prime` 仍由 Plugin-owned Codex-facing handler 生成 payload。
- 不需要 Core 共享层下沉。
- 不创建新的 AlembicTest 真实项目复测单；用户明确 SHOUT-7 只按 Plugin 内部文案 / 契约 / 单元测试自验收口。

后续建议：

- 本机 Codex plugin cache 已在 resident vector search VEC-6 中一并刷新到后续 AlembicPlugin commit `2c98f69b1388c478bbbb255e487c51fde621cff7`，该提交包含 SHOUT-7 主语文案；cache marker `mode=local-mcp`，`.mcp.json` 指向 workspace local MCP entry。
- 若后续用户仍看到工具名主语，再追加更强的 Skill 示例句或 host receipt schema 约束。
