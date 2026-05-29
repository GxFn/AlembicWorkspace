# PCVM Wave 6D Canonical Node After-run

日期：2026-05-29
窗口：AlembicTest
任务：PCVM-W6D-ALEMBICTEST-CANONICAL-NODE-AFTER-RUN
结论：部分通过，runtime input / process events 可见 canonical map；latest / persisted report 未承接 canonical N9 / N11 identity。

## 范围

- 本轮只跑 BiliDili 受保护真实 / 默认 AI test-mode 小样本 after-run。
- 配置：`ALEMBIC_TEST_MODE=1`、`ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture`、`ALEMBIC_TEST_RESCAN_DIMS=architecture`、`maxFiles=4`、`contentMaxLines=40`、`skipGuard=true`。
- 不跑 full cold-start，不优化 Agent prompt，不做 Dashboard comparison UI，不修改产品源码或 BiliDili 业务源码。
- 外部 AI：BiliDili Ghost workspace settings，provider `deepseek`，model `deepseek-v4-pro`；secret 只确认存在，未打印。

## 版本与 Linkage

- Alembic commit：`acd273eca051c569094781f868b0271e91622458`
- AlembicAgent commit：`c70094d0b3841c4fba56a3e155c4fecc14f38086`
- BiliDili commit：`5b10fd4c72ccc8aeda2e9b84289748b7d883d804`
- `Alembic/node_modules/@alembic/agent` 是 symlink，`package.json` realpath 指向 `AlembicAgent/package.json`，但 package `main` / exports 指向 `dist/*`。
- Linkage 复核：`Alembic/dist` 已包含 `pcvStageNodeMap`、`pcvChainNodes`、`pcvm:n9:*`、`pcvm:n11:produce`；`AlembicAgent/src` 有 Wave 6B/6C consumer 字段；`AlembicAgent/dist` 未命中 `pcvStageNodeMap` / `pcvChainNodes` / `pcvm:n9`。这使后续缺口存在 package/dist linkage 风险。

## Job

- Dashboard URL：`http://127.0.0.1:64364/jobs?job=bootstrap_mpqq5kz3_ccd25abd`
- jobId：`bootstrap_mpqq5kz3_ccd25abd`
- sessionId：`bs_1780047219972_oq3mvg`
- job 状态：completed
- probe classification：pass
- 事件计数：workflow 5、checkpoint 1、llm.input 24、llm.reflection 11、llm.output 24、tool 1、summary 4、artifact 1。
- Dashboard DOM：job 页面显示 `bootstrap_mpqq5kz3_ccd25abd` 和 completed；默认 DOM 未展开 canonical 字段，canonical 判定以 JSON evidence 为准。

## 命令

```bash
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture <node-22> AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --no-dev-link
```

第一次 restart preclean 清理旧 daemon 后返回失败，原因是旧服务被 kill，第二次同命令启动成功，Dashboard `http://127.0.0.1:64364`。

```bash
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture <node-22> AlembicTest/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:64364 --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 --max-files 4 --content-max-lines 40 --skip-guard --timeout-ms 900000 --poll-ms 2500 --output AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-timeline.json
```

补充取证：`curl /api/v1/daemon/health`、`curl /api/v1/jobs/bootstrap_mpqq5kz3_ccd25abd?compact=false`、`curl /api/v1/jobs/bootstrap_mpqq5kz3_ccd25abd/events?limit=1000`、`curl /api/v1/modules/bootstrap/report/latest`、`curl /api/v1/modules/bootstrap/reports`、`curl /api/v1/modules/bootstrap/reports/bs_1780047219972_oq3mvg`，并复制 persisted reports / daemon logs / Dashboard DOM 与截图。

## Canonical Identity 结果

- `pcvStageNodeMap` / `pcvChainNodes`：进入 `llm.input` runtime event content 与 metadata，包含 `analyze -> pcvm:n9:analyze`、`quality_gate -> pcvm:n9:quality_gate`、`record_repair -> pcvm:n9:record_repair`、`produce -> pcvm:n11:produce`。
- N9 runtime event：canonical `pcvm:n9:*` 只在初始 `llm.input` map 中出现；后续 `pcvN9Observability` / `traceEnvelope` 仍使用 `N9-agent-analyze-quality`。
- N11 runtime event：canonical `pcvm:n11:produce` 只在初始 `llm.input` map 中出现；producer output / report evidence 仍使用 `N11-produce`。
- latest report / session report API / persisted bootstrap report / persisted session report：均未出现 `pcvStageNodeMap`、`pcvChainNodes`、`pcvm:n9:*` 或 `pcvm:n11:produce`；report 中 `pcvNodeEvidence.n11` 与 `pcvScorecard` 仍为 `N11-produce`。

## 证据路径

- Summary：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-summary.json`
- Timeline：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-timeline.json`
- Linkage：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-linkage.json`
- Job final：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-job-final.json`
- Events：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-events.json`
- Latest report：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-latest-report.json`
- Session report API：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-session-report-api.json`
- Persisted reports：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-persisted-bootstrap-report.json`、`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-persisted-session-report.json`
- Logs：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-daemon-final.log`、`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-combined-final.log`
- Dashboard：`AlembicTest/tmp/pcvm-wave6d-dashboard-job-dom.txt`、`AlembicTest/tmp/pcvm-wave6d-dashboard-job.png`

## 边界与归因

- 成功能推出：Wave 6C 的 Alembic producer 已把 canonical map 注入真实 after-run 的 runtime input / process event；daemon event API、socket 和 probe timeline 正常。
- 失败能推出：canonical identity 没有进入最终 report surface，也没有替换下游 N9 / N11 evidence identity；缺口优先归为 Agent dist/package linkage 与 report projection / persistence 边界。
- 不能推出：不能推出 full cold-start、全 N0-N14 baseline、Dashboard comparison UI、真实 AI 输出稳定性，不能单凭本轮证明 prompt 质量问题。
- 建议第一修复归属：先由 `AlembicAgent` / `Alembic` 复核 package dist linkage，确保 `@alembic/agent` runtime exports 的 dist 包含 Wave 6B consumer；再由 `Alembic` 复核 report projection / persisted report 是否应携带 canonical map 或 canonical node ids。

## Git 状态

- `Alembic`：clean
- `AlembicAgent`：clean
- `BiliDili`：clean
- `AlembicTest`：clean；本轮证据在 ignored `tmp/`。
- 根 workspace 已有非本轮历史未提交 ledger/archive 变更；本轮新增本报告与 current workspace 回填。

## 遗留风险与下一步

- 风险：真实 AI 输出非确定；本轮只验证 architecture 小样本。
- 风险：`AlembicAgent/dist` 未命中 canonical consumer 字段，可能导致已验收源码逻辑没有进入 runtime。
- 下一步：总控验收后建议优先派 `AlembicAgent` / `Alembic` 做 runtime dist/linkage 与 report projection 最小修复，再用同一 W6D probe 复测。
