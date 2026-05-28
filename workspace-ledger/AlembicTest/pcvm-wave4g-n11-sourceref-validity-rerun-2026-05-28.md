# PCVM Wave 4G N11 SourceRef Validity Rerun

日期：2026-05-28
窗口：AlembicTest
任务：PCVM-W4G-ALEMBICTEST-N11-SOURCEREF-VALIDITY-RERUN
状态：已完成，待总控验收
提交 hash：无；本轮是测试执行、证据报告和 active workspace 回填，未提交 AlembicTest 仓库代码。

## 结论

部分通过。

通过项：`Alembic` commit `125be96a0086577bc731953eca7d7b3165593bc1` 的 N11 sourceRef validity 字段已经进入真实 / 默认 AI test-mode runtime 的 latest report 与 persisted bootstrap report。N11 不再被单纯 `linked` 掩盖，而是进入 `blocked-by-observability-gap`，并带有 `producer_source_refs_invalid`。

未完全匹配项：本轮真实 AI rerun 未复现总控预期的 `9/33` baseline。当前同 fixture 运行产出为 `1/20` invalid sourceRefs，invalid ref 为 `docs/Architecture.m`。因此本轮只能证明 runtime report surface 与 quality gate 可用，不能证明固定的 `9/33` 数量 baseline 已稳定复现。

## 执行范围

- 目标项目：BiliDili Ghost workspace。
- fixture：真实默认 AI、`ALEMBIC_TEST_MODE=1`、单维度 `architecture`、`maxFiles=4`、`contentMaxLines=40`、`skipGuard=true`。
- 不包含：不跑 full cold-start，不优化 Agent prompt，不做 Dashboard comparison UI，不改 `Alembic` / `AlembicAgent` / `AlembicPlugin` / `AlembicDashboard` / BiliDili 业务源码。

## 使用配置

- 配置来源：target project Alembic Ghost workspace AI config。
- provider/model：`deepseek / deepseek-v4-pro`。
- key presence：`deepseek=true`。
- secret：未打印、未复制、未提交。

## 版本与 dist 证据

- `Alembic` HEAD：`125be96a0086577bc731953eca7d7b3165593bc1`。
- 运行前发现 `dist/` 尚未包含 W4F sourceRef validity 字段；为避免重复旧 runtime gap，本轮在 `Alembic` 执行 `npm run build:self` 刷新 ignored `dist/`。
- dist focused scan 命中：
  - `dist/lib/workflows/capabilities/execution/internal-agent/BootstrapPcvNodeLocalEvidence.js`
  - `dist/lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillFinalizer.js`
  - 字段 / reason：`sourceRefValidity`、`invalidSourceRefCount`、`totalSourceRefCount`、`validSourceRefCount`、`producer_source_refs_invalid`。
- `Alembic` git 状态：clean；`dist/` 为 ignored build output。

## Job / Report

- jobId：`bootstrap_mppgszwo_136e6e35`
- sessionId：`bs_1779971049952_uiawqz`
- Dashboard：`http://127.0.0.1:52535/jobs?job=bootstrap_mppgszwo_136e6e35`
- final status：`completed`
- probe：`classification=pass`，duration `597386ms`

## 实际命令

```text
cd Alembic && npm run build:self
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture <node-22> AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --no-dev-link
<node-22> AlembicTest/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:52535 --data-root <BiliDili ghost dataRoot> --max-files 4 --content-max-lines 40 --skip-guard --timeout-ms 900000 --poll-ms 2500 --output AlembicTest/tmp/pcvm-wave4g-n11-sourceref-validity-timeline.json
curl /api/v1/modules/bootstrap/report/latest
curl /api/v1/jobs/bootstrap_mppgszwo_136e6e35/events?limit=1000
curl /api/v1/jobs/bootstrap_mppgszwo_136e6e35?compact=false
```

说明：第一次 restart preclean 已清理旧日志并杀掉旧 daemon pid，但脚本将 kill 确认状态判为失败；第二次 restart 成功启动 daemon。该脚本健壮性问题不影响本轮 runtime report 结论。

## N11 Validity 结果

latest report、persisted bootstrap report 和 persisted session report 三者一致：

```json
{
  "pcvSummary": {
    "blockedNodes": 1,
    "dimensionCount": 1,
    "linkedNodes": 2,
    "nodeCount": 3
  },
  "nodesN11": {
    "statuses": { "blocked-by-observability-gap": 1 },
    "missingLinkReasons": ["producer_source_refs_invalid"],
    "sourceRefValidity": {
      "totalSourceRefCount": 20,
      "validSourceRefCount": 19,
      "invalidSourceRefCount": 1,
      "invalidSourceRefRatio": 0.05,
      "statuses": { "invalid": 1 }
    }
  },
  "dimensionN11": {
    "status": "blocked-by-observability-gap",
    "sourceRefValidityStatus": "invalid",
    "missingLinkReasons": ["producer_source_refs_invalid"],
    "invalidSourceRefs": [
      {
        "ref": "docs/Architecture.m",
        "normalizedPath": "docs/Architecture.m",
        "reason": "file-not-found"
      }
    ]
  }
}
```

line-aware filesystem check：20 个 refs 中 1 个缺失；带 `:line` 的 sourceRef 在剥离行号后均能解析到真实文件。

## 证据路径

- summary：`AlembicTest/tmp/pcvm-wave4g-n11-sourceref-validity-summary.json`
- timeline：`AlembicTest/tmp/pcvm-wave4g-n11-sourceref-validity-timeline.json`
- latest report：`AlembicTest/tmp/pcvm-wave4g-n11-latest-report.json`
- persisted bootstrap report：`AlembicTest/tmp/pcvm-wave4g-n11-persisted-bootstrap-report.json`
- persisted session report：`AlembicTest/tmp/pcvm-wave4g-n11-persisted-session-report.json`
- job final：`AlembicTest/tmp/pcvm-wave4g-n11-job-final.json`
- events：`AlembicTest/tmp/pcvm-wave4g-n11-events.json`
- health：`AlembicTest/tmp/pcvm-wave4g-n11-health.json`
- browser DOM：`AlembicTest/tmp/pcvm-wave4g-codex-browser-job-dom.txt`
- browser screenshot：`AlembicTest/tmp/pcvm-wave4g-codex-browser-job.png`

## 事件计数

```json
{
  "workflow": 5,
  "checkpoint": 1,
  "llm.input": 29,
  "llm.reflection": 14,
  "llm.output": 29,
  "tool": 1,
  "summary": 4,
  "artifact": 1
}
```

## Git 状态

- `BiliDili`：clean。
- `Alembic`：clean。
- `AlembicTest`：存在本轮前已有的未提交测试窗口配置 / 文档 / 脚本变更；本轮新增证据在 ignored `tmp/`，新增长期报告在 `workspace-ledger/AlembicTest/`。
- `codex-control-workspace`：存在本轮前已有的 VAD / workspace 脚本与 skill 变更；本轮只按任务回填 active docs，不提交 control workspace。

## 结论边界

成功能推出：

- W4F 的 N11 sourceRef validity 字段已进入 current runtime latest report 与 persisted reports。
- N11 invalid refs 不再被 `linked` 掩盖；final scorecard 汇总能表达 blocked node、invalid counts 和 `producer_source_refs_invalid` reason。
- 本轮不需要为了 report / persistence surface 回 `Alembic` 返修。

不能推出：

- 不能推出固定 `9/33` baseline 已稳定复现；本轮真实 AI 输出为 `1/20`。
- 不能推出 full N0-N14 baseline 完成。
- 不能推出 Agent prompt 优化有效，也不能推出 Dashboard comparison UI 可用。

## 遗留风险与下一步

- 风险：真实 AI 输出存在波动，同一小样本 fixture 不能保证复现 W4E 的 33 个 refs；若总控需要严格 before / after 数量比较，应补一个 deterministic fixture / replay harness，或固定 producer output 作为 baseline。
- 风险：events API / job JSON 仍不是完整 final scorecard 主载体；本轮 latest / persisted report 已满足验证目标，但事件层是否需要摘要增强由总控裁决。
- 建议：总控可按“runtime surface 通过、固定数量 baseline 未匹配”验收本轮；若下一步目标是减少 invalid refs，再决定是否派 `AlembicAgent` 做 produce/analyze prompt 或 runtime policy 优化。
