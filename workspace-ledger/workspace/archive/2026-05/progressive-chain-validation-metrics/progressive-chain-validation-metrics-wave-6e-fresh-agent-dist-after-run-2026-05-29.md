# Progressive Chain Validation Metrics Wave 6E - Fresh Agent Dist After-run

日期：2026-05-29
状态：Wave 6E 总控验收通过 / 待 Wave 6F Alembic 返修计划
发送给：无
总控定位：本文件是 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 的当前总控计划。Wave 6D 已完成总控验收，结论不是产品 report projection 失败，而是当轮 `AlembicAgent/dist` 陈旧导致测试环境 linkage 不能支撑最终裁决；本轮只做 fresh Agent dist 下的同问题重测。

## 目标判断

- 用户目标：使用 PCVM 对 cold-start 链路拆小阶段并逐个隔离优化，让 cold-start analyze 从第一轮 LLM burn 起就携带可度量证据身份。
- 最终完成定义：最小真实 / 默认 AI after-run 能证明 Wave 6B + Wave 6C 的 canonical `pcvStageNodeMap` / `pcvChainNodes` 在 fresh `AlembicAgent/dist` linkage 下进入运行时 evidence、process events 或 report；至少能观察 N9 analyze / quality_gate / record_repair 与 N11 produce 的 canonical node identity，或明确归因到 Agent consumer / Alembic report projection / persistence 的下一处代码缺口。
- 当前是否已经达到：部分达到。AlembicTest 已在 fresh `AlembicAgent/dist` 下完成用户手动 Dashboard cold-start after-run；canonical identity 已进入 runtime process events，但 latest/session/persisted report 仍未承接 canonical `pcvm:*` identity。
- 未达到时剩余差距：总控已验收 AlembicTest 原始证据，裁决下一处缺口优先归属 `Alembic` host/daemon observability carry 与 report / persisted report projection：runtime event 内已有 canonical `pcvNodeEvidence`，但 `PcvObservabilityLinkage` 与 `pcvScorecard` 仍投射 legacy node id。
- 已达到时验收 / 归档判断：Wave 6E 测试任务验收通过，但 Wave 6 runtime identity 闭环尚未归档；下一步进入 Wave 6F，先派 `Alembic` 做最小 report / observability projection 返修，不扩大到 full cold-start。
- 当前任务分区：真实场景测试交接。
- 不纳入本轮事项：不改产品源码；不优化 Agent prompt；不改变 DeepSeek V4 tool policy；不跑 full cold-start；不做 Dashboard comparison UI；不扩展到 N0-N14 全链路。

## 总控决策记录

- 本次决策触发：Wave 6D AlembicTest 回填显示 canonical map 进入 `llm.input` runtime event，但 latest report / session report / persisted report 未承接 canonical `pcvm:*`；总控复核发现当轮 `AlembicAgent/dist` 未命中 Wave 6B consumer 字段。
- 需求 / 测试结果理解：第一阻塞点不是马上返修产品源码，而是先排除 stale dist linkage 对真实 after-run 的污染。
- 已核对证据：`AlembicAgent` package exports 指向 `dist/*`；总控执行 `npm run build` 后，`AlembicAgent/dist/agent/strategies/PipelineStrategy.js` 与 `dist/agent/runtime/PcvNodeEvidence.js` 已命中 `pcvStageNodeMap` / `pcvChainNodes`，且 `AlembicAgent` 无 tracked 变更。
- 是否需要先验证 / 重新计划 / 用户确认：不需要用户确认。本轮不改变用户目标、不删减范围、不修改真实项目，只重跑同一测试问题以排除环境 linkage。
- 本次允许更新：`AlembicTest` 测试报告 / ignored `tmp/` 证据、workspace 当前计划、`test-exchange.md`。
- 本次不得更新：`Alembic`、`AlembicAgent`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`BiliDili` 产品源码。
- 自动化状态：关闭；本轮使用手动分派提示词。

## 代码事实与边界

- 上游 producer：`Alembic` commit `acd273eca051c569094781f868b0271e91622458` 已注入 bootstrap canonical stage node map。
- 上游 consumer：`AlembicAgent` commit `c70094d0b3841c4fba56a3e155c4fecc14f38086` 已在源码侧支持 canonical stage node identity consumer。
- 关键 runtime linkage 事实：`Alembic/node_modules/@alembic/agent` 指向 `AlembicAgent` symlink，但 package exports 消费 `AlembicAgent/dist/*`；因此运行前必须证明 dist fresh。
- 目标测试环境：`AlembicTest` 管理的受保护真实 / 默认 AI 环境，优先复用 BiliDili Ghost 默认 AI 配置和既有 test-mode 小样本。
- 真实测试项目是否涉及：涉及读取 / 运行受保护测试目标；不得修改真实项目业务源码、配置 secret 或用户数据。
- 总控不能自测理由：总控已完成源码、dist freshness 和 raw JSON 复核；本轮要回答真实 / 默认 AI runtime after-run、daemon/API/report/log 可见性和当前环境 linkage，必须由 `AlembicTest` 承接。

## 阶段顺序

1. Wave 6E：`AlembicTest` 先证明 `AlembicAgent/dist` fresh，再跑同一最小真实 / 默认 AI after-run。
2. Wave 6F：总控基于 Wave 6E 裁决：收束 Wave 6、返修 `AlembicAgent` consumer carry、返修 `Alembic` report projection / persistence，或进入第一个实际优化点。

- 下一处真实阻塞点：`Alembic` report / persisted report 与 host observability carry 仍使用 legacy `N11-produce`、`analyze-evidence-grounding-ledger`、`N9-agent-analyze-quality`，未消费 runtime canonical `pcvNodeEvidence`。
- 阻塞点之前还能做：总控已完成源码和 stale dist 复核；没有必要扩大源码检查。
- 当前可派发窗口：`AlembicTest`。
- 当前阻塞 / 观察窗口：`Alembic`、`AlembicAgent` 观察；除非 Wave 6E 证明 fresh dist 后仍断裂，否则不返工源码。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PCVM-W6E-ALEMBICTEST-FRESH-AGENT-DIST-AFTER-RUN | `AlembicTest` | fresh `AlembicAgent/dist` 下重跑最小真实 / 默认 AI after-run，复核 N9 / N11 canonical node identity 是否进入 runtime evidence / report。 | 总控验收通过 |

### PCVM-W6E-ALEMBICTEST-FRESH-AGENT-DIST-AFTER-RUN：Fresh Agent dist canonical after-run

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 21:46 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 22:51 CST

执行状态：总控验收通过

阶段目标：

- 在 fresh `AlembicAgent/dist` linkage 下重跑 Wave 6D 同一最小 after-run，裁决 canonical node identity 是否能进入 downstream runtime evidence / report。

主线动作：

- 读取 `AlembicTest/AGENTS.md`、本计划、`test-exchange.md` 和相关测试规则。
- 执行前先证明 Agent dist fresh：
  - 记录 `AlembicAgent` commit。
  - 执行 `npm --prefix AlembicAgent run build`，或使用会刷新 `AlembicAgent/dist` 的等价 dev-link 路径。
  - 扫描 `AlembicAgent/dist/agent/strategies/PipelineStrategy.js` 与 `AlembicAgent/dist/agent/runtime/PcvNodeEvidence.js`，确认命中 `pcvStageNodeMap` / `pcvChainNodes`。
- 使用受保护真实 / 默认 AI 配置，复用 Wave 6D 的 BiliDili Ghost / test-mode 小样本参数。
- 记录 `Alembic` / `AlembicAgent` 当前 commit、runtime linkage、触发入口、job / session、report / events / logs 路径。
- 观察并回填：
  - `pcvStageNodeMap` / `pcvChainNodes` 是否进入 runtime input、process event、latest report 或 persisted report；
  - N9 analyze / quality_gate / record_repair 是否出现 canonical `pcvm:n9:*`；
  - N11 produce 是否出现 canonical `pcvm:n11:produce`；
  - 如果没有出现，缺口在 Agent progress event carry、Alembic report projection、persistence 还是测试环境 linkage。

合并 TODO：

- `GTODO-2026-05-25-003`。

明确不包含：

- 不跑 full cold-start。
- 不优化 Agent prompt。
- 不改变 DeepSeek V4 tool policy。
- 不做 Dashboard comparison UI。
- 不修改真实测试项目业务代码。
- 不打印、复制或提交 API key / token / secret。

下一处真实阻塞点：

- fresh Agent dist 下，runtime events 已能看见 canonical node identity；但 latest/session/persisted report 与 `pcvScorecard` 仍未承接 canonical node identity。

阻塞点之前还能做：

- 无；总控已完成代码侧和 stale dist 复核。

验证命令：

```text
npm --prefix AlembicAgent run build
rg -n "pcvStageNodeMap|pcvChainNodes" AlembicAgent/dist/agent/strategies/PipelineStrategy.js AlembicAgent/dist/agent/runtime/PcvNodeEvidence.js

沿用 Wave 6D 的最小真实 / 默认 AI after-run 参数：
ALEMBIC_TEST_MODE=1
ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture
ALEMBIC_TEST_RESCAN_DIMS=architecture
maxFiles=4
contentMaxLines=40
skipGuard=true

实际 restart / probe / API / report 命令由 AlembicTest 按当前测试环境选择并回填；如果使用 --no-dev-link，必须先完成并回填 fresh dist proof。
```

回填要求：

- 完成范围：写清 after-run 维度、文件样本、是否 test-mode、是否跳过 Guard、是否 full cold-start。
- fresh dist proof：写清 build / dev-link 命令、dist scan 命中结果、Agent commit、是否有 tracked 变更。
- 使用配置：只写配置来源、provider/model 和 key presence；不得写 secret。
- 目标项目 / fixture：写清真实测试目标和保护边界。
- Alembic / AlembicAgent commit 与 runtime linkage：必须写 commit、dist / symlink / package linkage。
- 触发入口和实际命令：列出 restart / probe / API / report 读取命令。
- latest report / persisted report / runtime JSON / 日志路径：列出可复核路径。
- canonical identity 结果：N9 analyze、quality_gate、record_repair、N11 produce 是否出现 canonical node identity。
- 成功 / 失败分别能推出什么：严格限定本测试边界。
- 不能推出什么：不能推出 full cold-start、全 N0-N14、Dashboard comparison UI 或真实 AI 输出稳定。
- 是否仍需 `Alembic` / `AlembicAgent` 返修：根据 fresh dist 后缺口归因说明。
- 遗留风险和下一步建议。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 `AlembicTest/AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、`AlembicTest` 真实测试职责、本轮只验证 fresh Agent dist after-run，以及本窗口明确不承担的源码修改职责。
- 若没有真实 / 默认 AI 配置或无法保护测试目标，停止并回填阻塞，不得用 product mock 或静态假数据替代。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-003 | Wave 6E 总控验收通过 / 待 Wave 6F | agent / llm optimization loop | P0 | PCV source / `Alembic` / `AlembicAgent` / `AlembicTest` | 使用 PCVM 拆分 cold-start 链路，并从第一个隔离优化点开始补齐每轮 burn 的 canonical evidence identity。 | 是 | Wave 6E 证明 fresh dist 后 runtime events 有 canonical identity，report 仍未承接 canonical `pcvm:*`。 | `Alembic` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 待 Wave 6F 计划 | 否 | fresh dist 重测显示 report / persisted report 仍未承接 canonical `pcvm:*`；总控裁决下一步先返修 Alembic host/daemon observability carry 与 report projection / persistence。 |
| `AlembicCore` | 无任务 | 否 | 本轮不下沉 shared contract。 |
| `AlembicAgent` | 观察中 | 否 | fresh dist 重测显示 Agent runtime events 已有 canonical identity；本轮不先返修 Agent，若 Alembic projection 返修后仍缺 runtime metadata 再回到 Agent。 |
| `AlembicDashboard` | 无任务 | 否 | 不做 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不涉及 Plugin。 |
| `AlembicDesign` | 无任务 | 否 | 用户目标已确认，不需要需求设计。 |
| `AlembicTest` | 已完成 | 否 | 已完成 fresh dist 后用户手动 Dashboard cold-start after-run，并回填报告与 raw evidence。 |
| `BiliDili` | 无任务 | 否 | 受保护测试目标只能由 `AlembicTest` 按保护规则读取 / 运行，不直接分派。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待 Wave 6F 计划 | Wave 6E 已验收；下一步优先返修 host/daemon observability carry 与 report / persisted report projection。 |
| `AlembicCore`<br>无任务 | 本轮不下沉 shared contract。 |
| `AlembicAgent`<br>观察中 | Agent fresh dist 已证明 canonical identity 进入 runtime events；等待 Alembic projection 返修后再判断是否需要 Agent 侧补充。 |
| `AlembicDashboard`<br>无任务 | 不做 UI。 |
| `AlembicPlugin`<br>无任务 | 不涉及 Plugin。 |
| `AlembicDesign`<br>无任务 | 不需要需求设计。 |
| `AlembicTest`<br>已完成 | `PCVM-W6E-ALEMBICTEST-FRESH-AGENT-DIST-AFTER-RUN`：fresh Agent dist 下用户手动 Dashboard cold-start after-run 已完成，报告路径 `AlembicTest/docs/pcv-fresh-agent-dist-after-run-2026-05-29.md`。 |
| `BiliDili`<br>无任务 | 受保护测试目标不直接分派；只由 `AlembicTest` 按保护规则使用。 |

## 可复制提示词

发送给：无

```text
继续当前总控任务：PCVM Wave 6E / fresh Agent dist after-run。

先读：AGENTS.md、codex-control-workspace/.wakeflow-active/index.md、codex-control-workspace/.wakeflow-active/current/progressive-chain-validation-metrics-wave-6e-fresh-agent-dist-after-run-2026-05-29.md，以及本窗口/目标仓库 AGENTS.md。

定位：声明你是 AlembicTest，本轮只做受保护真实 / 默认 AI after-run 验证，不修改产品源码。

领取：PCVM-W6E-ALEMBICTEST-FRESH-AGENT-DIST-AFTER-RUN。

完成后按当前计划和 test-exchange 回填 fresh dist proof、runtime/report 证据、边界、风险和下一步建议。
```

## 测试交接

- 是否需要 `AlembicTest`：是。
- 总控自测结论：Wave 6D 原始 JSON 已复核；总控确认 stale `AlembicAgent/dist` 是当前第一阻塞点，并已证明 build 后 dist 包含 canonical consumer 字段。
- 需要真实场景的理由：需要 daemon/API/report/log、真实 provider 输出和受保护测试目标环境。
- 测试前边界与多条件判断：
  - 测试要回答的问题：fresh Agent dist 下，真实 / 默认 AI after-run 的 runtime evidence / report 是否能观察到 N9 analyze / quality_gate / record_repair 与 N11 produce 的 canonical node identity。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：`AlembicTest`；目标项目只能作为受保护真实测试目标，不得修改业务源码。
  - 成功能推出的结论：Wave 6B + Wave 6C 的 canonical node identity 已进入 fresh runtime after-run 可见证据，可收束 Wave 6 或进入下一个 PCVM 隔离优化点。
  - 失败能推出的结论：如果 fresh dist proof 成立但 report 仍缺 canonical identity，才可按 evidence 分层归因到 `AlembicAgent` downstream carry、`Alembic` report projection 或 persistence。
  - 不能推出的结论：不能推出 full cold-start、全 N0-N14 baseline、Dashboard comparison UI 或真实 AI 输出稳定。
  - 停止或不开始条件：无法证明 dist fresh、找不到可保护测试目标 / 默认 AI 配置、需要打印 secret、需要修改真实项目业务源码、或只能用 product mock / 静态假数据替代。
- 测试单：`Test-PCVM-W6E-ALEMBICTEST-FRESH-AGENT-DIST-AFTER-RUN`，已写入 `test-exchange.md`。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md)
- 真实项目保护说明：`BiliDili` 只作为受保护真实测试目标，不直接分派、不修改业务源码、不提交其变更。

## 回填区

- 2026-05-29 21:46 CST：总控基于 Wave 6D 验收裁决 Wave 6E：fresh `AlembicAgent/dist` 后重跑同一最小真实 / 默认 AI after-run。该测试只回答 stale dist 排除后的 canonical node identity runtime visibility，不扩大为 full cold-start 或产品返修。
- 2026-05-29 22:47 CST：AlembicTest 回填 W6E。Codex 直接发起 CLI probe 被权限门禁拒绝后，用户改为在 Dashboard 手动点击 cold-start；AlembicTest 只确认服务、监控本机 daemon/API/log/report。job `bootstrap_mpr0rg8k_01f5bd68` / session `bs_1780065039431_a3xvpc` completed，events API 61 条（`llm.input` 20、`llm.output` 20、`llm.reflection` 11、`tool` 1、`summary` 4、`artifact` 1）。fresh dist proof 成立，runtime events 出现 canonical `pcvStageNodeMap` / `pcvChainNodes` / `pcvm:n9:*` / `pcvm:n11:produce`；但 latest/session/persisted report 均未出现 canonical `pcvm:*`，`pcvScorecard` 仍使用 legacy `N11-produce` 与 `analyze-evidence-grounding-ledger`。详细报告：`AlembicTest/docs/pcv-fresh-agent-dist-after-run-2026-05-29.md`；raw evidence：`AlembicTest/tmp/pcvm-wave6e-*`。真实项目和产品仓库 git tree clean。
- 2026-05-29 22:51 CST：总控验收 Wave 6E 通过。独立复核 `AlembicAgent/dist/agent/strategies/PipelineStrategy.js` / `dist/agent/runtime/PcvNodeEvidence.js` 命中 `pcvStageNodeMap` / `pcvChainNodes`，`Alembic/node_modules/@alembic/agent/package.json` realpath 指向 `AlembicAgent/package.json` 且 main 为 `dist/index.js`；`pcvm-wave6e-canonical-summary.json` 证明 events 中 `pcvm:n9:analyze=74`、`pcvm:n9:quality_gate=16`、`pcvm:n9:record_repair=16`、`pcvm:n11:produce=54`，但 latest/session/persisted report 对这些 term 均为 0，仍有 legacy `N11-produce=4` 与 `analyze-evidence-grounding-ledger=4`。代码事实复核显示 `Alembic/lib/daemon/PcvObservabilityLinkage.ts` 与 `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapPcvNodeLocalEvidence.ts` 仍固定 legacy node id；下一步进入 Wave 6F，优先派 `Alembic` 做最小 report / observability projection 返修。

<!-- workspace-sync
{
  "status": "Wave 6E 总控验收通过 / 待 Wave 6F Alembic 返修计划",
  "indexPlanDescription": "PCVM Wave 6E：fresh AlembicAgent dist 后真实 after-run 已回填；runtime events 有 canonical identity，report 仍未承接 canonical pcvm identity。",
  "indexStatusDescription": "当前状态：PCVM Wave 6E 总控验收通过；下一步优先派 Alembic 返修 report / observability projection 的 canonical identity 承接。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "PCVM Wave 6E：fresh Agent dist after-run 已通过总控验收，待 Wave 6F Alembic 返修计划。",
  "currentStatusSummary": "PCVM Wave 6E 总控验收通过：fresh dist 成立，runtime events 有 canonical pcv identity，report / persisted report 仍为 legacy identity；下一步优先派 Alembic。",
  "indexRows": [
    {
      "type": "PCVM Wave 6E fresh Agent dist after-run",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-6e-fresh-agent-dist-after-run-2026-05-29.md",
      "status": "Wave 6E 总控验收通过 / 待 Wave 6F",
      "description": "fresh dist 后用户手动 Dashboard cold-start completed；runtime events 有 canonical identity，latest/session/persisted report 仍未承接 canonical pcvm identity；下一步优先派 Alembic 修 projection。"
    },
    {
      "type": "PCVM Wave 6D canonical node after-run",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-6d-canonical-node-after-run-2026-05-29.md",
      "status": "Wave 6D 总控验收完成 / 转 Wave 6E",
      "description": "W6D 验证 canonical map 进入 runtime input，但当轮 Agent dist 陈旧；不能直接判定产品 report projection 失败。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM Wave 6E fresh Agent dist after-run",
      "doc": ".wakeflow-active/current/progressive-chain-validation-metrics-wave-6e-fresh-agent-dist-after-run-2026-05-29.md",
      "description": "fresh Agent dist after-run 已通过总控验收；下一步进入 Wave 6F Alembic report / observability projection 返修。"
    }
  ]
}
-->
