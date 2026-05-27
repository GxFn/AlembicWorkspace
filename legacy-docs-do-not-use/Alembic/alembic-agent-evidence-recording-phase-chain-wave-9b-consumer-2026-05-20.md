# Alembic Agent Evidence Recording Phase Chain Wave 9B Consumer

日期：2026-05-20
窗口：Alembic
状态：待总控验收

## 完成范围

- 已确认 `@alembic/agent` 本地依赖通过 symlink 指向 `../AlembicAgent`，源仓库 HEAD 为 `99f0a9f38a79b3cd1504dc2511d06f0a56e9e5c3`。
- 在 bootstrap projection 层新增 `resolveBootstrapDimensionRunIssue()`，统一识别 `timeout`、`blocked`、`aborted`、`error`、`degraded_no_findings` 和 `record_repair_incomplete`。
- session child result 回调已用统一 issue 识别拦截 `timeout` / `blocked` / `aborted` / `error`，不再只处理 `error` / `aborted`。
- dimension consumer 已把 degraded evidence run 写入非正常状态：不增加 candidate created、不挂 submitted candidate、事件和 dimensionStats 均保留 `degraded_no_findings` / `record_repair_incomplete` 状态与 reason。
- error consumer 已把失败状态写入 dimensionStats 和事件 payload，避免 `child-run-error`、timeout、blocked 被混作普通完成。
- 补充 mock 单测覆盖 degraded evidence run 和 timeout child result 路由；未调用真实 DeepSeek，未对 BiliDili 做真实单维度复测。

## 提交

- Alembic 提交 hash：`fd992047d7e998883284143b90c8321b2de25287`
- 提交信息：`fix: consume agent evidence repair statuses`

## 验证命令

```text
git -C ../AlembicAgent rev-parse HEAD
npm run build
npm run build:check
npm run test:unit -- test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts
npm run lint:repo-boundary
git diff --check
```

## 验证结果

- `git -C ../AlembicAgent rev-parse HEAD`：通过，输出 `99f0a9f38a79b3cd1504dc2511d06f0a56e9e5c3`。
- `npm run build`：通过，包含 `build:core`、`clean:dist`、`tsc` 和 `postbuild`。
- `npm run build:check`：通过，包含 `build:core` 和 `tsc --noEmit`。
- `npm run test:unit -- test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts`：通过，2 个测试文件、8 个用例通过。
- `git diff --check`：通过。
- `npm run lint:repo-boundary`：失败，命中 18 个既有 repository boundary 问题，位置集中在 `lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`lib/infrastructure/audit/AuditStore.ts`、`bin/daemon-server.ts`；本轮改动文件不在命中范围内。

## 遗留风险

- 当前实现将非正常状态作为 Alembic consumer 本地 contract 写入事件 / dimensionStats；若后续需要 Dashboard 或 Core 共享状态枚举，应由总控另开 contract 下沉任务。
- `lint:repo-boundary` 仍有既有失败项，需要独立清理，不应阻塞本轮 Agent evidence 语义接入验收。
- 未执行真实 DeepSeek / BiliDili 单维度复测；仍需用户确认外部 AI 数据发送或提供本地 / 测试 provider 路线。

## 下一步建议

- 总控验收 Alembic Wave 9B payload 后，再判断是否启动 `AlembicDashboard` Wave 9C 展示 record repair / degraded 状态。
- BiliDili 真实复测继续保持阻塞，直到用户确认数据发送策略。
