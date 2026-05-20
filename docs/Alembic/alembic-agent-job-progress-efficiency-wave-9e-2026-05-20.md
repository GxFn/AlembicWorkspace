# Alembic Agent Job Progress Efficiency Wave 9E

日期：2026-05-20
窗口：Alembic
状态：待总控验收

## 完成范围

- `BootstrapEventEmitter` 已把 `timeout`、`blocked`、`aborted`、`error`、`degraded_no_findings`、`record_repair_incomplete`、`l4_compaction_failed_budget_exhausted` 等非正常 dimension payload 路由到 failed task，而不是 `markTaskCompleted()`。
- `BootstrapTaskManager` 已为 session / task 增加 `updatedAt`、task `eventCount`，并在 failed task 上保留 result payload，使 failed / degraded / timeout 维度仍能进入 Job summary 的 efficiency 和 diagnostics 聚合。
- Jobs API progress payload 已新增 `updatedAt`、`activeTaskStartedAt`、`activeTaskUpdatedAt`、`activeTaskEventCount`、`activeTaskStatus`，用于 Dashboard 判断真实进度刷新，减少 activeTask stale 误判。
- Jobs API summary 已从 task result 聚合 diagnostics：dimension status 计数、issues、gateFailures、timedOutStages、degraded、forcedSummary、cancelReason。L4 hard stop / record repair / timeout 等原因可通过 summary diagnostics 被下游消费。
- 保持 Wave 9B / 9C 语义：非正常状态不会进入普通 completed bucket；Dashboard 仍只消费 Alembic 后端 payload，本轮不修改 UI。

## 提交

- Alembic 提交 hash：`633ed228d1c0ba9cd04ef431dc4aadac18c3ac06`
- 提交信息：`fix: surface bootstrap job progress efficiency`

## 验证命令

```text
npm run build
npm run build:check
npm run test:unit -- test/unit/BootstrapEventEmitter.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/JobsRoute.test.ts test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts
npm run test:unit -- test/unit/BootstrapEventEmitter.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/JobsRoute.test.ts
npm run lint -- --diagnostic-level=error
npm run lint:repo-boundary
git diff --check
```

## 验证结果

- `npm run build`：通过，包含 Core build、dist 清理、`tsc` 和 postbuild。
- `npm run build:check`：通过，包含 Core build 和 `tsc --noEmit`。
- targeted unit tests：通过，5 个测试文件 / 21 个用例通过。
- focused unit tests：通过，3 个测试文件 / 13 个用例通过。
- `npm run lint -- --diagnostic-level=error`：通过。
- `git diff --check`：通过。
- `npm run lint:repo-boundary`：失败，仍命中 18 个既有 DB boundary 问题；本轮改动文件不在命中范围。

## 遗留风险

- `lint:repo-boundary` 既有 18 个 DB boundary 命中仍需独立清理，不属于本轮 job progress / efficiency payload 改动面。
- 本轮未启动 BiliDili 完整 cold-start，也未修改 BiliDili 业务代码；真实复测仍需用户确认外部 AI 数据发送或替代本地 / 测试 provider 路线。
- Jobs summary 已下发 diagnostics 聚合；如果 Dashboard 需要更细粒度展示 L4 validation / hard stop 字段，应在总控验收 payload 稳定后再派 Dashboard 消费。

## 下一步建议

- 总控验收 Alembic Wave 9E payload 后，再决定是否启动 Dashboard 补充展示任务。
- BiliDili 小范围真实复测继续等待 Wave 9E 验收通过和用户确认数据策略。
