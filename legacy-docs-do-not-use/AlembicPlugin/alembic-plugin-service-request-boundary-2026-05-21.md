# AlembicPlugin Service Request Boundary

状态：总控验收通过
日期：2026-05-21
关联总控文档：[../workspace/alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](../workspace/alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)

## 完成范围

- SERVICE-1：`alembic_task` 已建立 Codex-facing ownership。`prime / create / close / fail / record_decision` 以及未知 operation 的校验错误都由 `AlembicPlugin` 本地 handler 处理，不因 local daemon ready 而转发给 Alembic `/api/v1/mcp/call`。
- SERVICE-2：新增 `ServiceRequestBoundary` 判定层，显式区分 `plugin-owned-codex-facing` 与 `daemon-mcp-compat-bridge`。`CodexMcpServer` default 分支不再对所有普通工具一刀切走 `requirement: "mcp"` daemon bridge，而是先解析 service boundary。
- `alembic_task prime` 在 Plugin-owned 路径中懒初始化 embedded Plugin MCP handler tree，并给返回 payload 附加 `data.serviceBoundary`，便于复测确认 owner、executionPath 和 residentServiceRequested。
- Alembic `/api/v1/mcp/call` bridge 未修改，仍作为非 Plugin-owned 工具的兼容 resident-service 请求路径。
- Codex portable runtime 已刷新：`plugins/alembic-codex/runtime.tgz` 和 runtime dist 已包含 service boundary 改动。

## 提交 Hash

- `AlembicPlugin`：`c083c3c3c5b690a9b0f9711b3a5abe214bde0109`
- `AlembicCodex` runtime artifact：`7a7c5dce492c632e4ee3301f7eb989faec1d5118`

## 验证命令与结果

- `npx biome check --write lib/codex/ServiceRequestBoundary.ts lib/codex/index.ts lib/external/mcp/CodexMcpServer.ts test/unit/CodexMcpServer.test.ts test/unit/CodexServiceRequestBoundary.test.ts`：通过。
- `npm run test -- test/unit/CodexServiceRequestBoundary.test.ts`：通过，3 tests。
- `npm run build:check`：通过，Core build 使用 `../AlembicCore @ bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`。
- `npm run test -- test/unit/CodexMcpServer.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexServiceRequestBoundary.test.ts`：通过，3 files / 41 tests。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run verify:release-package-boundary`：通过，确认 root registry publish disabled，embedded runtime 仍使用 `@alembic/core: file:vendor/AlembicCore`，embedded Core source 为 `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`。
- `git diff --check`（`AlembicPlugin`）：通过。
- `git diff --check`（`plugins/alembic-codex`）：通过。

## 关键验收点

- local daemon ready 时，`alembic_task(operation="prime")` 仍由 Plugin 生成 Codex-facing payload：已由 `test/unit/CodexMcpServer.test.ts` 覆盖，断言不调用 fetch / `/api/v1/mcp/call`，不调用 `supervisor.ensure()`。
- `primeKnowledgeMaterial` / `hostResponse` / `shoutInstruction` 均保留：同一测试断言 `primeKnowledgeMaterial.hostResponse.action === "shout_prime_knowledge_receipt"` 且 `shoutInstruction` 存在；原有 `TaskPrimeKnowledgeMaterial` 测试继续通过。
- 是否需要 Core 共享层下沉：本轮暂不需要。`primeKnowledgeMaterial` 和 evidenceRefs 仍只有 Plugin 的 Codex-facing payload 消费方；若后续 Alembic resident service 也要长期生产相同 payload，再启动 Core schema / builder 下沉。
- 是否可以启动 AlembicTest 复测：可以在总控验收 `c083c3c3c5b690a9b0f9711b3a5abe214bde0109` 后启动 BiliDili prime shout 插件复测。

## 遗留风险

- 本轮只切断 `alembic_task` 的 tool ownership bridge；`alembic_bootstrap`、`alembic_rescan`、search / guard / knowledge 等仍保留现有兼容 bridge 或 resident-service 请求路径，后续需要按真实复测和 service API 设计逐步收敛。
- 单元测试里的 prime search 因缺少 bundled AI provider 走 sparse-only / empty 结果，但这不影响本轮目标；本轮验收的是 route ownership 和 Plugin host-facing payload 是否保留。
- 未修改 `Alembic` bridge、未修改 `BiliDili`，也未启动 BiliDili 复测。

## 下一步建议

- 总控验收 Plugin 提交后，派发 `AlembicTest` 重跑 BiliDili prime shout 插件测试，重点检查 `primeKnowledgeMaterial` delivered / empty 状态、Codex 知识呐喊、`serviceBoundary.executionPath === "plugin-owned-codex-facing"`，以及 BiliDili git 是否保持干净。
- 后续如要把 Recipe / Guard search 改成真正的 Alembic resident service request，应新增 service API / capability contract，不再用 MCP tool ownership bridge 扩展新主路径。

## 总控验收

- 2026-05-21：总控验收通过。真实代码证据显示 `ServiceRequestBoundary` 将 `alembic_task` intent lifecycle 留在 Plugin；`CodexMcpServer` default 分支先解析 service boundary，Plugin-owned 路径使用 embedded Plugin MCP handler tree，非 Plugin-owned 工具才保留 daemon MCP 兼容 bridge；返回 payload 附带 `data.serviceBoundary`。目标测试覆盖 local daemon ready 时 `alembic_task prime` 不调用 daemon bridge，并保留 `primeKnowledgeMaterial.hostResponse.action === "shout_prime_knowledge_receipt"` 与 `shoutInstruction`。
- 复测动作：已在 `docs/workspace/alembic-test-exchange.md` 创建 Test-2026-05-21-02，发送给 `AlembicTest` 执行 BiliDili prime shout service boundary 复测。
