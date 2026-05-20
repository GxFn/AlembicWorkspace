# AlembicDashboard Wave 9F Job Progress Freshness

状态：待验收
执行日期：2026-05-20
对应总控文档：`docs/workspace/alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md`
Dashboard 提交：`c1aa2c09e6f171192ccfc81a89f392fb5b5c0848`

## 完成范围

- 扩展 Dashboard Jobs API type，显式支持 Alembic Wave 9E 新增的 `progress.updatedAt`、`activeTaskStartedAt`、`activeTaskUpdatedAt`、`activeTaskEventCount`、`activeTaskStatus`。
- Jobs 页面“最后事件”优先使用 `activeTaskUpdatedAt`，其次使用 `progress.updatedAt`，最后回退到 job `updatedAt`，避免运行中任务只看旧 job 更新时间。
- `ProgressBlock` 新增紧凑 freshness chips，展示 active task status、event count、active task 最近更新时间和 progress 最近更新时间。
- Jobs 页面新增 summary diagnostics 区块，展示 `diagnostics.statuses`、`issues`、`gateFailures`、`timedOutStages`、`forcedSummary`、`cancelReason`，与既有 evidence issue / efficiency 展示互补。
- 保持 Dashboard 只消费后端稳定 payload，不实现 Agent 决策，不修改 Alembic 后端和 BiliDili。

## 修改文件

- `src/api.ts`
- `src/components/Views/JobsView.tsx`

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

- 本轮未启动 BiliDili cold-start / rescan，也未做真实 DeepSeek 单维度复测。
- 是否可以进入 BiliDili 小范围真实复测仍需总控验收 Wave 9F，并由用户确认真实项目外部 AI 数据发送或替代安全路线。
- Jobs 页面已展示 summary diagnostics 中的主要字段；如果后续 Alembic 下沉更细粒度 L4 validation / hard stop metrics，可再按稳定 contract 增加专门可视化。

## 下一步建议

- 总控窗口验收 Wave 9F：重点复核 active task freshness 是否确实从 Alembic Wave 9E payload 投影到 Jobs UI。
- Wave 9F 总控验收通过后，仍不要直接启动 BiliDili 完整 cold-start；先按文档等待用户确认真实数据发送策略，再做小范围复测。
