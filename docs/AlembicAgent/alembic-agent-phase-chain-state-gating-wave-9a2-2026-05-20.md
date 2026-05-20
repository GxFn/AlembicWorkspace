# AlembicAgent Phase Chain State Gating Wave 9A2

状态：已完成，等待总控验收
执行窗口：AlembicAgent
日期：2026-05-20
对应总控文档：`docs/workspace/alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md`
提交：`99f0a9f38a79b3cd1504dc2511d06f0a56e9e5c3`

## 完成范围

- 弱化 analyst `SCAN`：
  - `SCAN` 的 toolChoice 改为 `none`，只作为 briefing / plan seed，不再强制 LLM 调用工具重复 deterministic snapshot 已完成的项目概览。
  - `SCAN -> EXPLORE` 改为首轮轻量过渡，并更新阶段提示，明确基于已有项目快照进入定向探索。
- 收窄 analyst `VERIFY`：
  - 新增 `analystVerifyOnlyGate`，在 analyst `VERIFY` 阶段只允许 `code.read` / `code.outline`、聚焦实体的 `graph.query(class|protocol|hierarchy|callers|callees|overrides|extensions|impact)`、以及 `memory.note_finding` / `memory.recall` / `memory.get_previous_evidence`。
  - 明确阻断 `code.search`、`graph.query(search)`、`terminal`、`knowledge` 和写入类动作，避免验证阶段重新打开泛探索。
- 保持 `RECORD` / record repair 的 memory-only 边界：
  - Wave 9A 的 `recordRepairOnlyGate` 继续作为 repair 硬边界。
  - 本轮没有放宽 record repair 的工具面。
- 增加 `SUMMARIZE` / forced summary 状态门控：
  - `AgentRuntime` 在 abort、stage timeout、`degraded_no_findings`、record repair degraded 状态下不再调用 forced summary。
  - 非 tracker 模式的 max-iteration summary 路径也复用同一 suppression gate。
  - `ExitController` 将 `abort_signal` 和 `stage_timeout` 标记为不需要 summary。
- 完善 diagnostics：
  - `stage_timeout` 记录 `cancelReason` 和 timed-out stage。
  - `degraded_no_findings` 进入 diagnostics degraded 状态，和 `analysis_retry` / `record_repair` 区分。
- 增加 targeted tests：
  - `test/ExplorationStrategies.test.ts` 覆盖 `SCAN` no-tool briefing 和 `VERIFY` evidence-only gate。
  - `test/AgentRuntime.test.ts` 覆盖 abort、stage timeout、`degraded_no_findings` 不触发 forced summary。
  - `test/evidence-recording-phase-chain.test.ts` 补充同一 phase-chain 状态门控回归，和 Wave 9A record repair 主链路一起运行。

## 变更文件

- `src/agent/context/exploration/ExplorationStrategies.ts`
- `src/agent/context/exploration/NudgeGenerator.ts`
- `src/agent/runtime/AgentRuntime.ts`
- `src/agent/runtime/DiagnosticsCollector.ts`
- `src/agent/runtime/ExitController.ts`
- `src/agent/runtime/ToolExecutionPipeline.ts`
- `src/agent/runtime/index.ts`
- `test/AgentRuntime.test.ts`
- `test/ExplorationStrategies.test.ts`
- `test/evidence-recording-phase-chain.test.ts`

## 验证命令

```text
npm run build:check
npm run test -- test/evidence-recording-phase-chain.test.ts
npm run test -- ExplorationStrategies
npm run test -- AgentRuntime
npm run check
git diff --check
```

## 验证结果

- `npm run build:check`：通过。
- `npm run test -- test/evidence-recording-phase-chain.test.ts`：通过，1 个文件 / 9 个测试。
- `npm run test -- ExplorationStrategies`：通过，1 个文件 / 2 个测试。
- `npm run test -- AgentRuntime`：通过，1 个文件 / 3 个测试。
- `npm run check`：通过；包含 `build:check`、Biome lint、Agent import boundary、public API boundary、Core import boundary 和全量 vitest。Biome 仍打印仓库既有 21 个 warning，但命令返回 0；本轮新增/修改内容无 blocking lint error。
- `git diff --check`：通过。

## 遗留风险

- 本轮仍只修改 `AlembicAgent`，`Alembic` consumer 尚未接入 `stage_timeout` / `degraded_no_findings` / forced-summary suppression 的新语义。
- 真实 DeepSeek / BiliDili 单维度外部 AI 复测尚未执行，需等 Alembic consumer 接入和用户确认数据发送策略。
- `VERIFY` 的 graph allowlist 当前以聚焦实体参数为硬边界；若下游真实 graph adapter 使用其它字段名表达实体，需要在 consumer 接入或 adapter 测试中补充映射。

## 下一步建议

- 总控验收 Wave 9A2 后，再启动 `Alembic` Wave 9B。
- `Alembic` Wave 9B 应消费提交 `99f0a9f38a79b3cd1504dc2511d06f0a56e9e5c3` 的 `@alembic/agent` 语义，并验证 JobStore、dimension report、progress summary 不把 abort / timeout / `degraded_no_findings` 误计为 completed。
- Dashboard 和 BiliDili 仍保持观察 / 阻塞，等待 Alembic 后端 payload 稳定后再行动。
