# AlembicPlugin Recipe Interaction Contract Wave 1

状态：已完成（总控验收通过）
日期：2026-05-21
关联总控文档：[../workspace/alembic-codex-recipe-interaction-contract-wave-2026-05-21.md](../workspace/alembic-codex-recipe-interaction-contract-wave-2026-05-21.md)

## 完成范围

- W1-PKS-2B：`alembic_submit_knowledge` 的 `pendingSemanticReview -> alembic_consolidate` 消费侧已改为使用 Core 提供的真实 `pendingSemanticReview[].newRecipeId`；当 Core 只提供稳定 created item reference 时使用 `createdRecipe.id`；如果两者都缺失，Plugin 返回 `nextActionBlocked`，不生成空字符串 `newRecipeId`，也不猜 title。
- W1-PKS-4：默认 Codex 可见的 `alembic_knowledge_lifecycle` schema、tool description 和测试已收敛为只允许 `reactivate`；publish / deprecate / approve / fast_track 继续要求 Dashboard 或显式 admin 路径，未给默认 Codex agent 扩权。
- W1-PKS-5：prime payload 已把宿主回复动作从 MCP tool 语义中拆出为 `hostResponse`，保留 `shoutInstruction`，并确认 `nextActions` 不再暴露虚构的 `codex_host_response` 工具调用。
- Codex portable runtime 已刷新：`plugins/alembic-codex/runtime.tgz`、runtime dist、以及 embedded `vendor/AlembicCore` 快照已同步到 Core 提交 `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`。

## 提交 Hash

- `AlembicPlugin` W1-PKS-4 / W1-PKS-5：`b9abdc3efacb7879e34a1af1f8715008f00215d5`
- `AlembicCodex` W1-PKS-4 / W1-PKS-5 runtime artifact：`0fd5a9d5a90cd27169a87783fb27a013394285ce`
- `AlembicPlugin` W1-PKS-2B：`8602ae9e71874af389709db680104b2c1ee0edbb`
- `AlembicCodex` W1-PKS-2B runtime artifact：`4abb80efca55d37dc39667facdd18e8a35a08cad`

## 验证命令与结果

- `npx biome check --write lib/external/mcp/handlers/consolidated.ts test/unit/ConsolidatedSubmitKnowledge.test.ts`：通过。
- `npm run test -- test/unit/ConsolidatedSubmitKnowledge.test.ts`：通过，3 tests。
- `npm run build:check`：通过，Core build 使用 `../AlembicCore @ bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`。
- `npm run test -- test/unit/KnowledgeAPI.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts test/integration/ZodSchemas.test.ts test/unit/ConsolidatedSubmitKnowledge.test.ts`：通过，5 files / 154 tests。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run verify:release-package-boundary`：通过，确认 root registry publish disabled，embedded runtime 使用 `@alembic/core: file:vendor/AlembicCore`，embedded Core source 为 `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`。
- `git diff --check`（`AlembicPlugin`）：通过。
- `git diff --check`（`plugins/alembic-codex`）：通过。

## 遗留风险

- 本 wave 明确不新增 `AlembicTest` 真实项目复测；当前证据覆盖 Plugin 单元 / 集成契约、build、runtime artifact 和 channel/package boundary。
- `nextActionBlocked` 只会在 Core 未按契约返回 `newRecipeId` / `createdRecipe.id` 时出现；正常路径已由 Core 提交 `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24` 提供真实 ID。
- publish / deprecate 等管理能力仍留给 Dashboard 或 admin 路径，本轮没有实现新的 admin MCP 工具。

## 总控验收

- 2026-05-21 总控验收通过：W1-PKS-2B / W1-PKS-4 / W1-PKS-5 均已闭环；Plugin 本 wave 暂无新的待执行项。
- 本 wave 不新增 `AlembicTest` 测试单；后续如需真实项目链路复测，仍通过 `AlembicTest` 测试交流文档单独创建。
