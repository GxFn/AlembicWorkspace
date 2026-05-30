# Progressive Chain Validation Metrics Wave 6D - Canonical Node After-run

日期：2026-05-29
状态：Wave 6D 总控验收完成 / 转 Wave 6E fresh Agent dist after-run
发送给：无
总控定位：本文件是 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 的当前总控计划。Wave 6B 已验收 `AlembicAgent` consumer contract，Wave 6C 已验收 `Alembic` bootstrap map producer；本轮只做最小真实 / 默认 AI after-run 验证，不扩大为 full cold-start。

## 目标判断

- 用户目标：使用 PCVM 对 cold-start 链路拆小阶段并逐个隔离优化，让 cold-start analyze 从第一轮 LLM burn 起就携带可度量证据身份。
- 最终完成定义：最小真实 / 默认 AI after-run 能证明 Wave 6B + Wave 6C 的 canonical `pcvStageNodeMap` / `pcvChainNodes` 在运行时 evidence、process events 或 report 中被消费；至少能观察 N9 analyze / quality_gate / record_repair 与 N11 produce 的 canonical node identity 或明确缺口。
- 当前是否已经达到：Wave 6D 作为测试边界已完成并被总控复核；它证明 canonical map 已进入 runtime input，但测试运行使用的 `AlembicAgent/dist` 是旧的，不能直接判定产品 report projection 失败。
- 未达到时剩余差距：需要在 fresh `AlembicAgent/dist` linkage 下重跑同一最小 after-run，再判断 canonical node identity 是否进入后续 runtime evidence / report。
- 已达到时验收 / 归档判断：Wave 6D 不按“产品失败”归档，而按“测试环境 / dist linkage 发现”收束，转 Wave 6E 重测。
- 当前任务分区：真实场景测试交接。
- 不纳入本轮事项：不改产品源码；不优化 Agent prompt；不改变 DeepSeek V4 tool policy；不跑 full cold-start；不做 Dashboard comparison UI。

## 总控决策记录

- 本次决策触发：`AlembicAgent` commit `c70094d0b3841c4fba56a3e155c4fecc14f38086` 与 `Alembic` commit `acd273eca051c569094781f868b0271e91622458` 均已通过总控验收。
- 需求 / 测试结果理解：现在第一阻塞点不是源码 map 生产或消费，而是真实 runtime report 是否能看见 canonical node identity。
- 已核对证据：Wave 6B / 6C targeted tests 证明 direct input、planned child input、lazy child input、process event projection 和 Agent consumer fallback 逻辑均存在。
- 是否需要先验证 / 重新计划 / 用户确认：不需要。该测试不改变用户目标、不删减能力、不修改真实项目；它只复核真实 / 默认 AI after-run 表面。
- 本次允许更新：`AlembicTest` 测试报告 / 临时证据；workspace 当前计划和 `test-exchange.md`。
- 本次不得更新：`Alembic`、`AlembicAgent`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`BiliDili` 产品源码。
- 自动化状态：关闭；本轮使用手动分派提示词。

## 代码事实与边界

- 上游 producer：`Alembic` commit `acd273e`，bootstrap dimension input 注入 canonical `pcvStageNodeMap` / `pcvChainNodes`。
- 上游 consumer：`AlembicAgent` commit `c70094d`，Agent process metadata / evidence 能优先使用 canonical stage node map，缺失时才 fallback。
- 目标测试环境：`AlembicTest` 管理的受保护真实 / 默认 AI 环境，优先复用 BiliDili Ghost 默认 AI 配置和既有 test-mode 小样本。
- 真实测试项目是否涉及：涉及读取 / 运行受保护测试目标；不得修改真实项目业务源码、配置 secret 或用户数据。
- 总控不能自测理由：本轮问题必须回答真实 / 默认 AI runtime after-run、daemon/API/report/log 可见性和当前环境 linkage；总控已完成源码和 targeted unit 复核。

## 阶段顺序

1. Wave 6D：`AlembicTest` 跑最小真实 / 默认 AI after-run，观察 canonical node identity 是否进入运行时 evidence / report。
2. Wave 6E：总控基于 Wave 6D 裁决：收束 Wave 6、返修 report surface、或进入第一个实际优化点。

- 下一处真实阻塞点：无法确认真实 after-run 中 N9 / N11 evidence 是否已经消费 canonical node identity。
- 阻塞点之前还能做：总控已完成代码侧复核；没有必要再扩展源码检查。
- 当前可派发窗口：`AlembicTest`。
- 当前阻塞 / 观察窗口：`Alembic`、`AlembicAgent` 观察；除非 Wave 6D 证明 report surface 或 consumer 断裂，否则不返工源码。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PCVM-W6D-ALEMBICTEST-CANONICAL-NODE-AFTER-RUN | `AlembicTest` | 最小真实 / 默认 AI after-run，复核 N9 / N11 canonical node identity 是否进入 runtime evidence / report。 | 总控验收完成：测试有效但 dist linkage 陈旧，转 Wave 6E 重测 |

### PCVM-W6D-ALEMBICTEST-CANONICAL-NODE-AFTER-RUN：Canonical node after-run

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 17:13 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-29 17:46 CST

阶段目标：

- 用最小真实 / 默认 AI after-run 验证 Wave 6B + Wave 6C 的 canonical node identity 是否进入运行时 evidence / report，而不是只停留在源码和单测。

主线动作：

- 读取 `AlembicTest/AGENTS.md`、本计划、`test-exchange.md` 和相关测试规则。
- 使用受保护真实 / 默认 AI 配置，优先复用既有 BiliDili Ghost / test-mode 小样本。
- 记录 `Alembic` / `AlembicAgent` 当前 commit、runtime linkage、触发入口、job / session、report / events / logs 路径。
- 观察并回填：
  - `pcvStageNodeMap` / `pcvChainNodes` 是否进入 runtime input、process event、latest report 或 persisted report；
  - N9 analyze / quality_gate / record_repair 是否出现 canonical `pcvm:n9:*`；
  - N11 produce 是否出现 canonical `pcvm:n11:produce`；
  - 如果没有出现，缺口在 Agent progress event、Alembic report projection、persistence 还是测试环境 linkage。

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

- 真实 after-run report 是否能看见 canonical node identity。

阻塞点之前还能做：

- 无；源码侧已经由总控复核通过。

验证命令：

```text
由 AlembicTest 按现有 restart / probe 脚本选择最小真实 / 默认 AI after-run 命令，并回填实际命令、runtime JSON、report 和日志路径。
```

回填要求：

- 完成范围：写清 after-run 维度、文件样本、是否 test-mode、是否跳过 Guard、是否 full cold-start。
- 使用配置：只写配置来源、provider/model 和 key presence；不得写 secret。
- 目标项目 / fixture：写清真实测试目标和保护边界。
- Alembic / AlembicAgent commit 与 runtime linkage：必须写 commit、dist / symlink / package linkage。
- 触发入口和实际命令：列出 restart / probe / API / report 读取命令。
- latest report / persisted report / runtime JSON / 日志路径：列出可复核路径。
- canonical identity 结果：N9 analyze、quality_gate、record_repair、N11 produce 是否出现 canonical node identity。
- 成功 / 失败分别能推出什么：严格限定本测试边界。
- 不能推出什么：不能推出 full cold-start、全 N0-N14、Dashboard comparison UI 或真实 AI 输出稳定。
- 是否仍需 `Alembic` / `AlembicAgent` 返修：根据缺口归因说明。
- 遗留风险和下一步建议。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 `AlembicTest/AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、`AlembicTest` 真实测试职责、本轮只验证真实 / 默认 AI after-run，以及本窗口明确不承担的源码修改职责。
- 若没有真实 / 默认 AI 配置或无法保护测试目标，停止并回填阻塞，不得用 product mock 或静态假数据替代。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-003 | Wave 6E 待启动 | agent / llm optimization loop | P0 | PCV source / `Alembic` / `AlembicAgent` / `AlembicTest` | 使用 PCVM 拆分 cold-start 链路，并从第一个隔离优化点开始补齐每轮 burn 的 canonical evidence identity。 | 是 | Wave 6D 证明 runtime input 有 canonical map，但当轮 `AlembicAgent/dist` 陈旧；需 fresh dist 重跑再裁决。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察中 | 否 | after-run 显示 report surface 未承接 canonical identity，待总控验收归因。 |
| `AlembicCore` | 无任务 | 否 | 本轮不下沉 shared contract。 |
| `AlembicAgent` | 观察中 | 否 | after-run linkage 发现 `AlembicAgent/dist` 未命中 canonical consumer 字段，待总控验收归因。 |
| `AlembicDashboard` | 无任务 | 否 | 不做 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不涉及 Plugin。 |
| `AlembicDesign` | 无任务 | 否 | 用户目标已确认，不需要需求设计。 |
| `AlembicTest` | 待验收 | 否 | 已完成最小真实 / 默认 AI after-run，等待总控验收。 |
| `BiliDili` | 无任务 | 否 | 受保护测试目标只能由 `AlembicTest` 按保护规则读取 / 运行，不直接分派。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | after-run 证据显示 report surface 未承接 canonical identity；等待总控验收后决定是否返修。 |
| `AlembicCore`<br>无任务 | 本轮不下沉 shared contract。 |
| `AlembicAgent`<br>观察中 | after-run linkage 发现 runtime exports 使用 dist，而 dist 未命中 canonical consumer 字段；等待总控验收后决定是否返修。 |
| `AlembicDashboard`<br>无任务 | 不做 UI。 |
| `AlembicPlugin`<br>无任务 | 不涉及 Plugin。 |
| `AlembicDesign`<br>无任务 | 不需要需求设计。 |
| `AlembicTest`<br>待验收 | `PCVM-W6D-ALEMBICTEST-CANONICAL-NODE-AFTER-RUN`：完成最小真实 / 默认 AI after-run，结论 `partial-runtime-only`。 |
| `BiliDili`<br>无任务 | 受保护测试目标不直接分派；只由 `AlembicTest` 按保护规则使用。 |

## 可复制提示词

发送给：无（历史提示词已执行，本轮不再发送）

```text
继续当前总控任务：PCVM Wave 6D / AlembicTest canonical node after-run。

先读：AGENTS.md、codex-control-workspace/.workspace-active/workspace/index.md、codex-control-workspace/.workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6d-canonical-node-after-run-2026-05-29.md，以及本窗口/目标仓库 AGENTS.md。

定位：声明你是 AlembicTest，本轮只做受保护真实 / 默认 AI after-run 验证，不修改产品源码。

领取：PCVM-W6D-ALEMBICTEST-CANONICAL-NODE-AFTER-RUN。

完成后按当前计划和 test-exchange 回填证据、边界、风险和下一步建议。
```

## 测试交接

- 是否需要 `AlembicTest`：是。
- 总控自测结论：Wave 6B / 6C 的源码、targeted unit 和 build checks 已由总控验收；本轮剩余问题必须依赖真实 / 默认 AI runtime after-run。
- 需要真实场景的理由：需要 daemon/API/report/log、真实 provider 输出和测试目标保护边界。
- 测试单：`Test-PCVM-W6D-ALEMBICTEST-CANONICAL-NODE-AFTER-RUN`，已写入 `test-exchange.md`。

## 回填区

- 2026-05-29 17:13 CST：总控基于 Wave 6C 验收裁决 Wave 6D：派 `AlembicTest` 做最小真实 / 默认 AI after-run。该测试只回答 canonical node identity runtime visibility，不扩大为 full cold-start。
- 2026-05-29 17:46 CST：AlembicTest 回填 W6D。BiliDili Ghost default AI / test-mode 小样本 after-run 完成，job `bootstrap_mpqq5kz3_ccd25abd`，session `bs_1780047219972_oq3mvg`，Dashboard `http://127.0.0.1:64364/jobs?job=bootstrap_mpqq5kz3_ccd25abd`。结论 `partial-runtime-only`：`pcvStageNodeMap` / `pcvChainNodes` 和 canonical `pcvm:n9:*` / `pcvm:n11:produce` 进入 `llm.input` runtime event；latest report、session report API、persisted bootstrap/session report 未出现 canonical `pcvm:*`，仍见旧 `N11-produce`。Linkage 证据显示 `@alembic/agent` 指向 `AlembicAgent` symlink 但 package exports 使用 `dist/*`，当前 `AlembicAgent/dist` 未命中 canonical consumer 字段。详细报告：`workspace-ledger/AlembicTest/pcvm-wave6d-canonical-node-after-run-2026-05-29.md`；summary：`AlembicTest/tmp/pcvm-wave6d-canonical-node-after-run-summary.json`。产品仓库 `Alembic` / `AlembicAgent` / `BiliDili` 均 clean；本轮不修改产品源码。
- 2026-05-29 21:39 CST：总控独立复核 W6D 原始 JSON：summary 同时包含 canonical `pcvm:n9:*` / `pcvm:n11:produce` 和旧 `N9-agent-analyze-quality` / `N11-produce`；latest report、session report API、persisted bootstrap/session report 均无 canonical map / canonical N9/N11，仅保留旧 `N11-produce`。随后总控执行 `npm run build` 于 `AlembicAgent`，不产生 tracked 变更；build 后 `AlembicAgent/dist/agent/strategies/PipelineStrategy.js` 与 `dist/agent/runtime/PcvNodeEvidence.js` 已命中 `pcvStageNodeMap` / `pcvChainNodes`。裁决：W6D 不能直接归因为产品 report projection 失败，第一阻塞点是当轮测试的 Agent dist linkage 陈旧；下一步为 Wave 6E 在 fresh dist 下重跑同一 after-run。

<!-- workspace-sync
{
  "status": "Wave 6D 总控验收完成 / 转 Wave 6E fresh Agent dist after-run",
  "indexPlanDescription": "PCVM Wave 6D 总控验收完成：最小真实 / 默认 AI after-run 发现 canonical map 进入 runtime input；总控复核确认当轮 Agent dist 陈旧，需 Wave 6E fresh dist 重测。",
  "indexStatusDescription": "当前状态：PCVM Wave 6D 已验收为 dist linkage 测试缺口，下一步 Wave 6E fresh AlembicAgent dist after-run。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "PCVM Wave 6D：canonical node identity after-run 验证。",
  "currentStatusSummary": "PCVM Wave 6D 已由总控复核：canonical map 进 runtime input，但当轮 AlembicAgent dist 陈旧；下一步用 fresh dist 重跑同一 after-run。",
  "indexRows": [
    {
      "type": "PCVM Wave 6D canonical node after-run",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6d-canonical-node-after-run-2026-05-29.md",
      "status": "Wave 6D 总控验收完成 / 转 Wave 6E",
      "description": "验证 Wave 6B/6C 后 canonical pcvStageNodeMap / pcvChainNodes 是否进入真实 runtime evidence / report；回填显示 runtime input 有，report 无，总控复核归因为当轮 Agent dist 陈旧，需 fresh dist 重测。"
    },
    {
      "type": "PCVM Wave 6C Alembic stage node map injection",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6c-alembic-stage-node-map-injection-2026-05-29.md",
      "status": "总控验收通过",
      "description": "Alembic commit acd273e 已注入 bootstrap canonical stage node map，并通过 targeted tests 与总控复核。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM Wave 6D canonical node after-run",
      "doc": ".workspace-active/workspace/current/progressive-chain-validation-metrics-wave-6d-canonical-node-after-run-2026-05-29.md",
      "description": "最小真实 / 默认 AI after-run，复核运行时 canonical node identity。"
    }
  ]
}
-->
