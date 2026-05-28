# PCVM Wave 4E real AI scorecard rerun

日期：2026-05-28
执行窗口：`AlembicTest`
测试单：`Test-PCVM-W4E-ALEMBICTEST-REAL-AI-SCORECARD-RERUN`
VAD task：`PCVM-W4E-ALEMBICTEST-REAL-AI-SCORECARD-RERUN`

## 窗口定位

`AlembicTest` 是真实测试验证窗口。本轮只做真实 / 默认 AI 配置下的最小 runtime scorecard smoke，不做产品实现，不修改 `Alembic` / `AlembicAgent` / `AlembicDashboard` / `AlembicPlugin` / `AlembicCore` 源码，不修改 `BiliDili` 业务代码。

## 测试结论

通过，待总控验收。

在 `BiliDili` Ghost workspace、真实默认 AI 配置 `deepseek / deepseek-v4-pro`、`ALEMBIC_TEST_MODE=1`、单维度 `architecture`、4 文件小样本下，bootstrap job `bootstrap_mppb1cos_3e517ce6` 完成。`/api/v1/modules/bootstrap/report/latest` 与持久化 bootstrap report 均出现 `pcvScorecard`，并且 `architecture` 维度的 N8 / N11 / N12 node-local evidence 均为 `linked`。

关键边界：process events 中可见 N8 / N11，但未默认携带 N12 / `pcvScorecard`；job JSON 本身也未携带最终 `pcvScorecard`。本轮成功结论以 latest report API 和持久化 bootstrap report 为准。

## 执行范围

- 目标项目：`BiliDili`，作为受保护真实 Swift 项目。
- Runtime storage：Ghost workspace，不写入真实项目源码。
- AI 配置来源：target project Alembic workspace settings/secrets。
- Provider / model：`deepseek / deepseek-v4-pro`。
- Key presence：`deepseek=true`，未打印或保存 secret。
- Test mode：`ALEMBIC_TEST_MODE=1`。
- 维度过滤：`ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture` / `ALEMBIC_TEST_RESCAN_DIMS=architecture`。
- Bootstrap 请求：`maxFiles=4`、`contentMaxLines=40`、`skipGuard=true`。
- Dashboard：已在 Codex in-app browser 打开 `Jobs` 详情页。

## 版本证据

- `Alembic` HEAD：`c46e09d8f0ca689fe43d83488f860d9d0e3a400d`。
- `Alembic/dist` focused scan：
  - `BootstrapPcvNodeLocalEvidence.js` exists。
  - `InternalDimensionFillFinalizer.js` contains `pcvScorecard`。
  - `BootstrapProcessEvents.js` / `BootstrapSessionExecutionBuilder.js` contain `pcvNodeEvidence`。
  - `BootstrapConsumers.js` contains N12 consumer persistence evidence wiring.

## 触发入口与命令

```text
ALEMBIC_TEST_MODE=1 \
ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture \
ALEMBIC_TEST_RESCAN_DIMS=architecture \
PATH=<node-22-bin>:$PATH \
<node-22> AlembicTest/scripts/restart-alembic.mjs \
  --project BiliDili --json --wait 20000 --no-dev-link --no-preclean

<node-22> AlembicTest/scripts/probe-cold-start-process-timeline.mjs \
  --project BiliDili \
  --url http://127.0.0.1:64387 \
  --data-root <BiliDili ghost dataRoot> \
  --max-files 4 \
  --content-max-lines 40 \
  --skip-guard \
  --timeout-ms 480000 \
  --poll-ms 2500 \
  --output AlembicTest/tmp/pcvm-wave4e-real-ai-scorecard-rerun-timeline.json

curl /api/v1/modules/bootstrap/report/latest
curl /api/v1/jobs/bootstrap_mppb1cos_3e517ce6/events?limit=1000
rg "pcvScorecard|pcvNodeEvidence|N8-stage-factory-tool-policy|N11-produce|N12-consumers-persistence" \
  <BiliDili ghost dataRoot>/.asd/bootstrap-report.json \
  <BiliDili ghost dataRoot>/.asd/bootstrap-reports/bs_1779961362028_sdn5xk.json
```

## Runtime 结果

- Job id：`bootstrap_mppb1cos_3e517ce6`
- Session id：`bs_1779961362028_sdn5xk`
- Job status：`completed`
- Duration：693s
- Candidates submitted：6
- Candidates rejected：0
- Project skill receipt：1，runtime export pending
- Events count：84
- Events kind counts：`workflow=5`、`checkpoint=1`、`llm.input=30`、`llm.reflection=12`、`llm.output=30`、`tool=1`、`summary=4`、`artifact=1`

## PCV 字段检查

| Surface | `pcvScorecard` | N8 | N11 | N12 | 结论 |
| --- | --- | --- | --- | --- | --- |
| latest report API | yes | linked | linked | linked | 通过 |
| persisted bootstrap report | yes | linked | linked | linked | 通过 |
| events API | no | yes | yes | no | 事件流只暴露部分 PCV evidence |
| job JSON | no | no | no | no | job store 不是最终 scorecard carrier |
| daemon log | no | n/a | n/a | n/a | log 不是 scorecard carrier |

Scorecard 摘要：

```json
{
  "blockedNodes": 0,
  "dimensionCount": 1,
  "linkedNodes": 3,
  "nodeCount": 3,
  "n8": "linked",
  "n11": "linked",
  "n12": "linked",
  "n11AcceptedCount": 6,
  "n11RejectedCount": 0,
  "n12FindableCount": 6
}
```

## 证据路径

- `AlembicTest/tmp/pcvm-wave4e-real-ai-scorecard-summary.json`
- `AlembicTest/tmp/pcvm-wave4e-real-ai-scorecard-rerun-timeline.json`
- `AlembicTest/tmp/pcvm-wave4e-real-ai-report-latest.json`
- `AlembicTest/tmp/pcvm-wave4e-real-ai-job-final.json`
- `AlembicTest/tmp/pcvm-wave4e-real-ai-events.json`
- `AlembicTest/tmp/pcvm-wave4e-codex-browser-job-dom.txt`
- `AlembicTest/tmp/pcvm-wave4e-codex-browser-job.png`
- Runtime report files:
  - `<BiliDili ghost dataRoot>/.asd/bootstrap-report.json`
  - `<BiliDili ghost dataRoot>/.asd/bootstrap-reports/bs_1779961362028_sdn5xk.json`

## 成功 / 失败分别能推出什么

本轮成功能推出：

- 当前 `Alembic/dist` 在真实 provider path 下能产出 runtime `pcvScorecard`。
- N8 / N11 / N12 node-local evidence 能进入 latest report API 和持久化 bootstrap report。
- AI-MOCK 后续前置已解除，本轮未走 product `mock` provider。
- 4 文件 / 单维度小样本下可以进入 PCV before / after 优化点选择。

本轮不能推出：

- 不能推出 PCV 全链路 N0-N14 都已可度量。
- 不能推出 Dashboard comparison UI 可用。
- 不能推出所有维度 / full cold-start 时长、质量和稳定性。
- 不能推出 events API / job JSON 已完整携带 final scorecard。

## 是否仍需返修

- 是否仍需 `Alembic` 返修：不需要为了 latest report / persisted report 的 N8 / N11 / N12 scorecard surface 返修。可作为后续观察项评估是否要让 events API / job JSON 也携带 final `pcvScorecard` 摘要。
- 是否仍需 `AlembicAgent`：本轮不需要；若总控下一步要做质量优化，可以基于本次 scorecard 进入 before / after 优化点选择。

## Git 状态

- `BiliDili`：clean。
- `Alembic`：clean。
- `AlembicTest`：存在本轮前既有未提交 docs/config/scripts 变更；本轮新增 ignored `tmp/` 证据和 workspace ledger 报告。
- `codex-control-workspace`：存在既有未提交 workspace automation / script 变更；本轮只回填活跃计划 / 测试交流。

## 遗留风险

- 单维度、4 文件 test-mode smoke，不覆盖 full cold-start。
- Runtime 写入 Ghost dataRoot，并清理了该 Ghost DB 内旧 bootstrap 数据；未修改 `BiliDili` git tracked 业务源码。
- `probe-cold-start-process-timeline` 固定 480s 时先返回 `producer-gap`，但 job 随后在 693s 完成；建议后续真实 AI scorecard smoke 将 timeout 提高到至少 12 分钟。
- events API / job JSON 不携带完整 final `pcvScorecard`，总控需裁决这是否进入后续观测 / artifact API 增强。

## 下一步建议

总控可将 `PCVM-W4E` 标为通过并进入验收：当前 runtime scorecard surface 已恢复。下一步不必返修 `Alembic` 的 dist/report surface，可选择进入 PCVM before / after 优化点选择，或单独建观察项跟踪 events API / job JSON 的 final scorecard 摘要承载。
