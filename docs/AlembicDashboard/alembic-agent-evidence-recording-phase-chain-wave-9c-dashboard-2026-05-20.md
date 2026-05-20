# AlembicDashboard Wave 9C Evidence State Display

状态：待验收
执行日期：2026-05-20
对应总控文档：`docs/workspace/alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md`
Dashboard 提交：`b2c62b5e01fad4a256f6815da63b0ef7f34bfe86`

## 完成范围

- 新增前端证据状态归一化工具 `src/utils/evidenceStatus.ts`，只消费后端 payload 中已有的 `status`、`action`、`qualityGate.action`、`diagnostics.gateFailures`、`diagnostics.timedOutStages`、`degraded`、`efficiency.cancelReason` 等字段，不新增后端决策。
- 扩展 API 类型，允许 Jobs summary、Bootstrap report dimension 携带 `status`、`reason`、`diagnostics`、`qualityGate`、`efficiency`、`error` 和 candidate 计数字段。
- Jobs 页面将 `record_repair` / `quality_gate_record_repair`、`record_repair_incomplete`、`needs_evidence_repair`、`degraded_no_findings`、`timeout`、`blocked`、`aborted`、`error`、`failed`、`cancelled` 显示为独立证据/任务状态；统计卡和状态筛选不再把非正常完成归入普通完成；候选入口会避开失败类非正常状态。
- Bootstrap progress 任务卡从 `task.result` 中识别非正常状态，改用对应色彩、徽标和原因文案；session `failed` / `aborted` / `cancelled` 也会被视为结束态。
- Signal reports 的 bootstrap detail 展示非正常 dimension 状态摘要，包括 dimension、状态、提交/拒绝候选数和原因；保留完整 JSON 详情便于追踪 diagnostics。

## 修改文件

- `src/api.ts`
- `src/hooks/useBootstrapSocket.ts`
- `src/utils/evidenceStatus.ts`
- `src/components/Views/JobsView.tsx`
- `src/components/Views/BootstrapProgressView.tsx`
- `src/components/Views/SignalReportView.tsx`

## 验证命令

```text
npm run build
npm run check
git diff --check
```

## 验证结果

- `npm run build`：通过，完成 `tsc && vite build`；Vite 仍提示 vendor chunk 超过 1500 kB，为既有打包体积 warning。
- `npm run check`：未通过，原因是 Dashboard `package.json` 未配置 `check` script；本轮不将其记录为通过。
- `git diff --check`：通过。

## 遗留风险

- 本轮只做 Dashboard 前端消费与展示，未执行真实 DeepSeek / BiliDili 单维度复测。
- 真实 runtime 中旧 compact 协议错误仍归属 `AlembicAgent` provider transcript normalization，需要后续 Wave 9A3 修复后再进入 BiliDili 小范围真实验证。
- Bootstrap report 当前若仍未下发 dimension `status` / `diagnostics` 字段，Dashboard 只能在 raw JSON 中展示既有 payload；本轮已兼容 Alembic Wave 9B 写入的 `dimensionStats` 结构。

## 下一步建议

- 总控窗口验收 Dashboard Wave 9C 后，插入 `AlembicAgent` Wave 9A3 修复 DeepSeek L4 compact transcript 合法性。
- `BiliDili` Wave 9D 继续阻塞，等待 Dashboard 验收、L4 compact 修复和用户确认真实项目外部 AI 数据发送策略。
