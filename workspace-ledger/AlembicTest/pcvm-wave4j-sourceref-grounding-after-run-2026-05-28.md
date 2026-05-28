# PCVM Wave 4J SourceRef Grounding After-run

日期：2026-05-28
窗口：AlembicTest
任务：PCVM-W4J-ALEMBICTEST-SOURCEREF-GROUNDING-AFTER-RUN
状态：已完成，待总控验收
提交 hash：无；本轮是测试执行、证据报告和 active workspace 回填，未提交 AlembicTest 仓库代码。

## 结论

通过。

Wave 4I `AlembicAgent` sourceRef grounding 后，BiliDili 真实 / 默认 AI test-mode after-run 的 latest report、persisted bootstrap report 和 persisted session report 均出现 N11 `sourceRefValidity`，且三者一致为 `valid`：`11 total / 11 valid / 0 invalid / ratio 0`。N11 `status=linked`，`missingLinkReasons=[]`，未触发 `producer_source_refs_invalid`。

对比边界：Wave 4H deterministic replay 的 `9/33` 是固定 fixture baseline；Wave 4G runtime 的 `1/20` 是 Wave 4I 前真实 AI 输出漂移样本；本轮 `0/11` 只能证明 Wave 4I 后的真实/default AI after-run 指标可读且当前输出没有 invalid sourceRefs，不能证明真实 AI 每次会生成同一组 sourceRefs。

## 执行范围

- 目标项目：BiliDili Ghost workspace。
- fixture：真实/default AI、`ALEMBIC_TEST_MODE=1`、单维度 `architecture`、`maxFiles=4`、`contentMaxLines=40`、`skipGuard=true`。
- 不包含：不跑 full cold-start，不做 Dashboard comparison UI，不修改 `Alembic` / `AlembicAgent` / `AlembicDashboard` / `AlembicPlugin` / `BiliDili` 业务源码。

## 使用配置

- 配置来源：target project Alembic Ghost workspace AI config。
- provider/model：`deepseek / deepseek-v4-pro`。
- key presence：`deepseek=true`。
- secret：未打印、未复制、未提交。

## 版本与 runtime linkage

- `Alembic` HEAD：`df4c89c27f113330216ce3493f725c9fe771b586`。
- `AlembicAgent` HEAD：`4acc068284cab54bf71d33aaa4a26e102e85356a`。
- PCV source commit：`3322646aa57c67c164eec20626ec5edd9d05b113`。
- `Alembic/package.json` 依赖 `@alembic/agent: file:../AlembicAgent`。
- `Alembic/node_modules/@alembic/agent` 是指向 `../../../AlembicAgent` 的 symlink。
- focused scan 命中：
  - `Alembic/dist/lib/workflows/capabilities/execution/internal-agent/BootstrapPcvNodeLocalEvidence.js` 包含 `sourceRefValidity` / `producer_source_refs_invalid`。
  - `Alembic/dist/lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillFinalizer.js` 包含 N11 `sourceRefValidity` summary。
  - `AlembicAgent/dist/agent/prompts/insight-producer.js` 与 `AlembicAgent/dist/tools/v2/handlers/knowledge.js` 包含 sourceRef grounding / normalization 相关逻辑。

## Job / Report

- jobId：`bootstrap_mppmq6h8_4ce6fa05`
- sessionId：`bs_1779980996266_699dsm`
- Dashboard：`http://127.0.0.1:53241/jobs?job=bootstrap_mppmq6h8_4ce6fa05`
- final status：`completed`
- probe：`classification=pass`，duration `429039ms`

## 实际命令

```text
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture <node-22> AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --no-dev-link
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture <node-22> AlembicTest/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:53241 --data-root <BiliDili ghost dataRoot> --max-files 4 --content-max-lines 40 --skip-guard --timeout-ms 900000 --poll-ms 2500 --output AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-timeline.json
curl /api/v1/modules/bootstrap/report/latest
curl /api/v1/modules/bootstrap/reports/bs_1779980996266_699dsm
curl /api/v1/jobs/bootstrap_mppmq6h8_4ce6fa05/events?limit=240
curl /api/v1/jobs/bootstrap_mppmq6h8_4ce6fa05?compact=false
```

说明：第一次 restart preclean 已清理旧日志并杀掉旧 daemon pid，但脚本将 kill 确认状态判为失败；第二次 restart 成功启动 daemon。该脚本健壮性现象已记录为运行风险，不影响本轮 after-run report 结论。

## N11 Validity 结果

latest report、persisted bootstrap report 和 persisted session report 三者一致：

```json
{
  "dimensionN11": {
    "status": "linked",
    "missingLinkReasons": [],
    "sourceRefValidityStatus": "valid",
    "sourceRefValidity": {
      "checked": true,
      "totalSourceRefCount": 11,
      "validSourceRefCount": 11,
      "invalidSourceRefCount": 0,
      "invalidSourceRefRatio": 0,
      "status": "valid",
      "invalidSourceRefs": []
    }
  },
  "scorecardN11": {
    "statuses": { "linked": 1 },
    "sourceRefValidity": {
      "totalSourceRefCount": 11,
      "validSourceRefCount": 11,
      "invalidSourceRefCount": 0,
      "invalidSourceRefRatio": 0,
      "statuses": { "valid": 1 }
    }
  }
}
```

filesystem check：N11 11 个 sourceRefs 均可在 BiliDili 项目根下解析；其中 `Sources/Core/ServiceKit` 为目录，其余为真实文件。invalid refs 为空。

## 事件计数

```json
{
  "workflow": 5,
  "checkpoint": 1,
  "llm.input": 24,
  "llm.reflection": 11,
  "llm.output": 24,
  "tool": 1,
  "summary": 4,
  "artifact": 1
}
```

socket / REST：timeline probe 记录 `socketConnected=true`、`socketJoinedNotifications=true`、`socketObservedMatchingEvents=true`；events API 返回 retained developer views，`missingProducerKinds=[]`。

## 证据路径

- summary：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-summary.json`
- timeline：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-timeline.json`
- latest report：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-latest-report.json`
- session report API：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-session-report-api.json`
- persisted bootstrap report：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-persisted-bootstrap-report.json`
- persisted session report：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-persisted-session-report.json`
- job final：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-job-final.json`
- events：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-events.json`
- health：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-health.json`
- reports index：`AlembicTest/tmp/pcvm-wave4j-sourceref-grounding-after-run-reports-index.json`
- browser DOM：`AlembicTest/tmp/pcvm-wave4j-codex-browser-job-dom.txt`
- browser screenshot：`AlembicTest/tmp/pcvm-wave4j-codex-browser-job.png`

## Git 状态

- `BiliDili`：clean。
- `Alembic`：存在本轮前已有 `AGENTS.md` dirty；本轮未修改产品源码。
- `AlembicAgent`：存在本轮前已有 `AGENTS.md` dirty；本轮未修改产品源码。
- `AlembicTest`：存在本轮前已有测试窗口配置 / 文档 / 脚本变更；本轮新增证据在 ignored `tmp/`，新增长期报告在 `workspace-ledger/AlembicTest/`。
- `codex-control-workspace`：本轮只回填 active workspace 文档，不提交 control workspace 能力仓库。

## 结论边界

成功能推出：

- Wave 4I 后真实/default AI after-run 的 N11 sourceRef validity surface 可读。
- latest report、session report API、persisted bootstrap report、persisted session report 均一致表达 `0/11` invalid。
- 本轮结果不需要回 `Alembic` 修 report / persistence surface，也没有证据要求立刻回 `AlembicAgent` 返修 sourceRef grounding。

不能推出：

- 不能推出 full N0-N14 baseline 完成。
- 不能推出 Dashboard comparison UI 完成。
- 不能推出真实 AI output 会稳定产生 11 个 refs 或每轮都为 0 invalid。
- 不能把本轮 `0/11` 与 Wave 4H `9/33` 当作严格同输入 deterministic comparison；它是 after-run runtime 信号。

## 遗留风险与下一步

- 风险：真实 AI 输出仍有自然漂移；严格 before / after 还应继续依赖 Wave 4H deterministic replay 或固定 producer output。
- 风险：restart preclean 对已 kill pid 的确认仍会导致第一次重启返回失败；建议后续由 `AlembicTest` 或 `Alembic` 归口改进脚本状态归类。
- 风险：本窗口收到 heartbeat 后删除 app automation 成功，但 `record-stop --reason "target received"` 曾返回 “No active automation run found”；建议总控检查 VAD runtime 记录一致性。
- 建议：总控可按“Wave 4J after-run 通过，N11 sourceRef validity 当前 0 invalid”验收，并据此决定下一步是扩展 deterministic comparison，还是进入下一个 PCVM 可观察节点优化。
