# AlembicCore Recipe Interaction Contract Wave 1

日期：2026-05-21
归属窗口：AlembicCore
状态：已完成
总控计划：`../workspace/alembic-codex-recipe-interaction-contract-wave-2026-05-21.md`

## 完成范围

- 完成 W1-PKS-1：修正 Core cold-start、rescan、Mission Briefing 中给 Codex host agent 的 Recipe 提交指令，只指向真实 MCP 工具 `alembic_submit_knowledge({ items: [...] })`，不再提示旧 `knowledge({ action: "submit" })` / `submit_batch`。
- 完成 W1-PKS-2A：`RecipeProductionGateway.pendingSemanticReview` 返回时能按原始 item index 关联真实创建结果，新增 `newRecipeId` 与 `createdRecipe` stable reference；同时 `created[]` 增加原始 `index`。
- 完成 W1-PKS-3：基于 Codex 写入来源已规范为 `host-agent` 的事实，将 `host-agent` 加入 `ConfidenceRouter` 默认 trusted source。该策略只使用更低 trusted threshold，不跳过内容完整性、reasoning、quality score、confidence 和 grace period gates。

## 关键文件 / 模块变化

- `src/workflows/cold-start/ColdStartPresenters.ts`
- `src/workflows/knowledge-rescan/KnowledgeRescanPresenters.ts`
- `src/workflows/capabilities/execution/external/MissionBriefingSupport.ts`
- `src/service/knowledge/RecipeProductionGateway.ts`
- `src/service/knowledge/ConfidenceRouter.ts`
- `test/unit/HostAgentMiningWorkflow.test.ts`
- `test/unit/production-gateway.test.ts`
- `test/unit/KnowledgeService.test.ts`

## 行为说明

- Codex 可见的 host-agent workflow 文案现在统一使用：

```text
alembic_submit_knowledge({ items: [...] })
```

- `pendingSemanticReview` 的每个 review 仍保留 `index`、`title`、`relatedRecipe`、`reason`，新增：
  - `newRecipeId`：创建成功时的真实新 Recipe ID。
  - `createdRecipe`：包含 `id`、`title`、`lifecycle` 的稳定创建结果引用。
- 如果某个 pending review 对应条目创建失败，则保留 review 原字段但不伪造 `newRecipeId`。
- `host-agent` trusted source 策略不等于自动发布；`ConfidenceRouter` 仍只返回 `auto_approve` / `pending` / `reject` 路由结果，实际 lifecycle 仍由 KnowledgeService / staging 机制处理。

## 提交

- `AlembicCore` 提交：`bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`
- 提交信息：`Fix Codex recipe interaction contracts`

## 验证命令与结果

```text
npm run build:check
```

结果：通过。

```text
npm run test -- test/PublicHostAgentWorkflowEntrypoints.test.ts test/unit/HostAgentMiningWorkflow.test.ts test/unit/production-gateway.test.ts test/unit/KnowledgeService.test.ts
```

结果：通过，4 个测试文件、86 个测试通过。

```text
npm run lint
```

结果：通过，Biome 检查 421 个文件。

```text
git diff --check
```

结果：通过。

```text
npm run check
```

结果：通过；包含 `build:check`、`lint:public-api-boundary`、全量 `test`、`lint`。全量 Vitest 63 个测试文件、940 个测试通过；测试环境输出一行既有 `error: Could not access 'HEAD'`，但命令退出码为 0。

```text
rg -n "knowledge\(\{ action|submit_batch" src/workflows/cold-start src/workflows/knowledge-rescan src/workflows/capabilities/execution/external
```

结果：无命中。该命令以 `rg` 的“无匹配”语义返回 1，表示目标 workflow 文案中没有旧工具提示残留。

## 遗留风险

- `AlembicPlugin` 已完成消费 `pendingSemanticReview[].newRecipeId` / `createdRecipe.id`，W1-PKS-2B 风险已关闭。
- `alembic_knowledge_lifecycle` 默认可见文案和 prime host response 表达已由 `AlembicPlugin` 在 W1-PKS-4 / W1-PKS-5 关闭；Core 未修改 Plugin。
- `host-agent` 被纳入 trusted source 后，会使用 trusted threshold；但该路径仍受内容、reasoning、quality 和 confidence gates 约束。后续若要改变 lifecycle 发布权限，必须走 Dashboard/admin 或单独策略确认。

## 下一步建议

- 2026-05-21 总控验收更新：`AlembicPlugin` 已完成并通过 W1-PKS-2B、W1-PKS-4、W1-PKS-5 验收。
- Core 本 wave 暂无新的待执行项。
