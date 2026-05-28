# PCVM Wave 4D cold-start scorecard smoke

日期：2026-05-28
执行窗口：`AlembicTest`
测试单：`Test-PCVM-W4D-ALEMBICTEST-COLDSTART-SCORECARD-SMOKE`
目标：确认真实 runtime report / artifact / log 是否能读到 N8 / N11 / N12 `pcvScorecard` / `pcvNodeEvidence`。

## 窗口定位

`AlembicTest` 只负责真实测试验证。本轮不做产品实现，不修改 `Alembic` / `AlembicAgent` / `AlembicPlugin` / `AlembicDashboard` / `AlembicCore` 源码，不触碰 `BiliDili`，不把 broad cold-start 成功当成节点 evidence 通过。

## 测试结论

未通过，归类为 `runtime-gap`。

受保护 fixture 上的 Alembic daemon/API cold-start 能启动并完成 job，但 runtime report、job JSON 和 daemon log 均没有出现 `pcvScorecard`、`pcvNodeEvidence`、`N8-stage-factory-tool-policy`、`N11-produce` 或 `N12-consumers-persistence`。

关键断点：`Alembic/lib/**` 源码包含 Wave 4B 的 PCV node-local evidence 字段，而当前实际运行的 `Alembic/dist/**` runtime artifact 不包含这些字段，也没有 `BootstrapPcvNodeLocalEvidence` dist 文件。daemon 运行的是 `dist/bin/daemon-server.js`，所以 runtime 不可能产出本轮要求的 N8 / N11 / N12 evidence。

另一个限制：本机测试环境没有 Alembic AI provider API key，本轮使用 `ALEMBIC_AI_PROVIDER=mock`。mock provider 会走 `MockBootstrapPipeline`，日志明确显示该路径绕过 internal-agent finalizer，因此不能证明真实 LLM provider 路径。

## 执行范围

- 使用受保护 fixture：`AlembicTest/tmp/pcvm-wave4d-fixture-project`
- 使用隔离 Alembic home：`AlembicTest/tmp/pcvm-wave4d-alembic-home`
- 使用 `ALEMBIC_TEST_MODE=1`
- 维度过滤：`ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture`
- provider：`ALEMBIC_AI_PROVIDER=mock`
- 未修改产品源码
- 未修改真实测试项目业务结构
- 未运行 Dashboard comparison UI

## 版本证据

- `Alembic`: `070e46d94db4f579d46647a05c09fb7ca16db275`
- `AlembicTest`: `32c1d7da171b689fdbf40cf70fb1252d2df36e74`
- `codex-control-workspace`: `9a2de3c4415bcfbdec352ba67ab55630d35c775c`

## 验证命令

```text
ALEMBIC_HOME=<workspace-root>/AlembicTest/tmp/pcvm-wave4d-alembic-home \
ALEMBIC_TEST_MODE=1 \
ALEMBIC_AI_PROVIDER=mock \
<node-22-binary> Alembic/dist/bin/cli.js setup \
  --dir <workspace-root>/AlembicTest/tmp/pcvm-wave4d-fixture-project \
  --ghost --force

ALEMBIC_HOME=<workspace-root>/AlembicTest/tmp/pcvm-wave4d-alembic-home \
ALEMBIC_PROJECT_DIR=<workspace-root>/AlembicTest/tmp/pcvm-wave4d-fixture-project \
ALEMBIC_TEST_MODE=1 \
ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture \
ALEMBIC_TEST_RESCAN_DIMS=architecture \
ALEMBIC_AI_PROVIDER=mock \
<node-22-binary> Alembic/dist/bin/daemon-server.js

node AlembicTest/scripts/probe-cold-start-process-timeline.mjs \
  --project <workspace-root>/AlembicTest/tmp/pcvm-wave4d-fixture-project \
  --url http://127.0.0.1:59218 \
  --data-root <workspace-root>/AlembicTest/tmp/pcvm-wave4d-alembic-home/.asd/workspaces/2ab284ad \
  --max-files 4 \
  --content-max-lines 40 \
  --skip-guard \
  --timeout-ms 240000 \
  --poll-ms 2500 \
  --output AlembicTest/tmp/pcvm-wave4d-coldstart-process-timeline.json

rg -n "pcvScorecard|pcvNodeEvidence|N8-stage-factory-tool-policy|N11-produce|N12-consumers-persistence|BootstrapPcvNodeLocalEvidence" \
  Alembic/lib/workflows/capabilities/execution/internal-agent

rg -n "pcvScorecard|pcvNodeEvidence|N8-stage-factory-tool-policy|N11-produce|N12-consumers-persistence|BootstrapPcvNodeLocalEvidence" \
  Alembic/dist/lib/workflows/capabilities/execution/internal-agent

rg -n "pcvScorecard|pcvNodeEvidence|N8-stage-factory-tool-policy|N11-produce|N12-consumers-persistence" \
  AlembicTest/tmp/pcvm-wave4d-alembic-home/.asd/workspaces/2ab284ad/.asd
```

## 验证结果

- daemon health：通过
- bootstrap job：完成
- job id：`bootstrap_mpp1cta7_8ae512d8`
- session id：`bs-c5729d01-7371-407c-9de4-a5b1b57f5124`
- final session id：`bs_1779945100445_lzgu9v`
- timeline probe classification：`producer-gap`
- 汇总裁决：`runtime-gap`

JSON 证据：

- `AlembicTest/tmp/pcvm-wave4d-coldstart-process-timeline.json`
- `AlembicTest/tmp/pcvm-wave4d-coldstart-scorecard-summary.json`
- `AlembicTest/tmp/pcvm-wave4d-alembic-home/.asd/workspaces/2ab284ad/.asd/jobs/bootstrap_mpp1cta7_8ae512d8.json`

日志证据：

- `AlembicTest/tmp/pcvm-wave4d-alembic-home/.asd/workspaces/2ab284ad/.asd/daemon.log`

关键 checks：

```json
{
  "daemonHealthSuccess": true,
  "jobCompleted": true,
  "sourceHasPcvNodeLocalEvidence": true,
  "distHasPcvNodeLocalEvidence": false,
  "runtimeOutputHasPcvNodeLocalEvidence": false,
  "reportHasPcvScorecard": false,
  "reportDimensionHasPcvNodeEvidence": false,
  "finalSessionCompleted": true,
  "mockPipelineUsed": true
}
```

## N8 / N11 / N12 字段

| 字段 | 结果 | 证据 |
| --- | --- | --- |
| N8 stage order / tool policy | 未出现 | runtime job/report/log 无 `N8-stage-factory-tool-policy` 或 `pcvNodeEvidence.n8` |
| N11 produce counts / sourceRefs / no-terminal proof | 未出现 | runtime job/report/log 无 `N11-produce` 或 `pcvNodeEvidence.n11` |
| N12 consumer persistence / findability / failure details | 未出现 | runtime job/report/log 无 `N12-consumers-persistence` 或 `pcvNodeEvidence.n12` |
| `pcvScorecard` | 未出现 | job result `report` 无 `pcvScorecard` |

## 成功 / 失败分别能推出什么

本轮成功的部分只能推出：

- daemon/API bootstrap 在受保护 fixture 上可运行并完成；
- test mode 维度过滤生效；
- process timeline API / socket 仍能返回 workflow/checkpoint/summary/artifact 类事件；
- 源码层确实存在 Wave 4B 的 PCV evidence 字段。

本轮失败能推出：

- 当前可运行 `dist` runtime artifact 没有包含 Wave 4B PCV evidence surface；
- mock provider runtime 路径不能产出本轮要求的 N8 / N11 / N12 report evidence；
- 不能进入 Agent prompt/runtime 优化，需先回 `Alembic` 修 runtime artifact / test-mode path。

不能推出：

- 不能推出真实 LLM provider 路径一定失败；
- 不能推出 Dashboard comparison UI 状态；
- 不能推出 PCV 全链路 N0-N14 已可度量；
- 不能把 broad bootstrap job completed 当成 N8 / N11 / N12 节点通过。

## 归口与下一步

仍需 `Alembic` 返修或补验证：

- 确保 `dist` runtime artifact 包含 `BootstrapPcvNodeLocalEvidence`、`pcvScorecard` 和 per-dimension `pcvNodeEvidence` 相关代码；
- 确认 `alembic start` / daemon 实际运行的 artifact 与 source commit `070e46d` 一致；
- 如果 mock / test-mode runtime 是 AlembicTest 的推荐复测路径，应让 mock path 也能走 PCV report augmentation，或明确必须使用真实 AI provider；
- 返修后由 AlembicTest 重跑同一 fixture smoke。

暂不需要 `AlembicAgent`：在 N8 / N11 / N12 runtime evidence surface 可读前，不应进入 prompt/runtime 优化。

## 遗留风险

- 本轮没有真实 AI provider API key，无法覆盖真实 LLM provider full internal-agent path。
- 本轮没有验证 Dashboard comparison UI。
- `probe-cold-start-process-timeline` 的 `producer-gap` 是事件 kind 维度的既有分类；本报告的主裁决以 PCV 字段可见性为准。
