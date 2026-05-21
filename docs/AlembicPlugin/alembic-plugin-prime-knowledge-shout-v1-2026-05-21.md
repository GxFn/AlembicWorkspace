# AlembicPlugin Prime Knowledge Shout V1

更新日期：2026-05-21
执行窗口：AlembicPlugin
状态：已完成

## 完成范围

- 在 `alembic_task prime` 响应中新增 `data.primeKnowledgeMaterial`，保留现有 `data.knowledge`、`data.searchMeta` 和 `_taskRules` 兼容字段。
- `primeKnowledgeMaterial` 提供 `status`、`receiptId`、`intent`、`acceptedKnowledge`、`acceptedGuards`、`shoutInstruction` 和 `nextActions`。
- `status=delivered` 时上浮 Recipe / Guard 的 `id`、`title`、`trigger`、`actionHint`、`summary`、`score` 和 `evidenceRefs`。
- `sourceRefs` 证据只解析真实存在于搜索结果中的字符串；支持 `path:line` / `path:Lline`，没有行号时返回 `line: null`，不编造行号。
- `status=empty` 覆盖无匹配 Recipe / Guard 的成功路径，要求 Codex 明确声明没有接收到可用项目知识。
- `status=degraded` 覆盖 prime search pipeline 不可用或异常路径，要求 Codex 明确声明 prime 降级且不得假装接受了 Recipe / Guard。
- 新增 `TaskPrimeKnowledgeMaterial` 单元测试覆盖 delivered / empty / degraded 三条路径。
- 刷新 AlembicCodex packaged runtime artifact，确保 Codex 插件产物包含 V1 闭环实现。

## 提交 Hash

- AlembicPlugin：`d83683bd23b6027b99c6085943639f2df9868840`
- AlembicCodex runtime artifact：`a76fa073ecabf1a6c1bfd83eeffeb0146892b5e0`
- Embedded AlembicCore snapshot：`15a9fb21301c44e8b9d57ee0343ff54d0b0d1ce0`

## 验证命令与结果

- `npx vitest run --config vitest.unit.config.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts`：通过，3 个测试。
- `npx biome check lib/external/mcp/handlers/task.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts --diagnostic-level=error`：通过。
- `npm run build:check`：通过，Core build 使用 `../AlembicCore @ 15a9fb21301c44e8b9d57ee0343ff54d0b0d1ce0`，TypeScript no-emit 通过。
- `npm run test -- test/integration/ZodSchemas.test.ts`：通过，65 个测试。
- `npm run test -- test/unit/CodexMcpServer.test.ts`：通过，34 个测试。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime` 和 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run verify:release-package-boundary`：通过；root package 仍为 private，root registry publish disabled，Codex artifact release enabled，embedded runtime Core dependency 保持 `file:vendor/AlembicCore`。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

## 验证结果

- `prime` delivered 路径能返回结构化材料，并保留旧 `knowledge` / `searchMeta`。
- `sourceRefs` 中的 `path:line` 会转成 `{ path, line }`；只有路径时返回 `{ path, line: null }`。
- empty / degraded 路径均返回可执行的 `shoutInstruction`，避免 Codex 静默继续或假装接收项目知识。
- AlembicPlugin 与 AlembicCodex runtime artifact 均已提交并推送到 `origin/main`。

## 是否需要启动 AlembicCore

暂不需要。V1 闭环可完全使用现有 `SlimSearchResult.sourceRefs`、`description`、`actionHint` 和 `searchMeta` 完成；本轮没有修改 Core search/sourceRef 类型。

## 遗留风险

- 本轮没有固定 Codex 最终呐喊文案，只提供结构化材料和动作指令，符合 V1 用户确认范围。
- 本轮没有做 sourceRef status / verifiedAt / origin 上浮、trust 分级、证据片段或 delta shout。
- 仍需总控用真实 MCP prime 调用验收 Codex 是否会按 `shoutInstruction` 在开发者可见消息中声明接收结果。

## 下一步建议

- V1 主线已通过总控验收；暂不启动 AlembicCore，也不新增 AlembicTest 测试单。
- 后续优化另起任务：固定模板、降噪、sourceRef 元数据上浮、Core 类型增强，或区分 host-response action 与真实 MCP tool call。

## 总控验收回填

- 验收结论：通过。`prime -> Codex 接受知识 -> Codex 自主呐喊 -> 开发者知道 Codex 接受了哪些知识` 的 V1 最小闭环已形成。
- 总控实跑：`npm run test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts` 通过 3 个测试；`npm run test -- test/unit/CodexMcpServer.test.ts` 通过 34 个测试；`npm run test -- test/integration/ZodSchemas.test.ts` 通过 65 个测试；`npm run build:check` 通过；`git -C AlembicPlugin diff --check` 通过。
- Payload 验收：直接调用 `dist/lib/external/mcp/handlers/task.js` 的 `taskHandler(prime)`，样例返回 `status=delivered`、`acceptedKnowledge`、`acceptedGuards`、`evidenceRefs`、`shoutInstruction`，旧 `knowledge` / `searchMeta` 仍存在。
- 遗留风险：`nextActions[].tool = codex_host_response` 是宿主可见回复动作而非真实 MCP 工具，V1 可接受；已在 workspace 计划中登记为后续 TODO。
