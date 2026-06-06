# Plugin Agent-Facing Public API Redesign 独立需求落地索引

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
日期：2026-06-05
状态：standard-progress-docs-ready / sequence-manifest-ready
维护窗口：AlembicWorkspace
来源窗口：AlembicDesign

## 定位

本目录把 AFAPI umbrella handoff 拆回 12 个可独立领取、独立调研、独立实现、独立验收的标准需求推进文档。每篇文档都是 developer-readable progress document，包含唯一 `Unified Status` 区和固定追加区；机器顺序和 state-root 绑定由 [afapi-independent-demand-sequence-2026-06-06.json](afapi-independent-demand-sequence-2026-06-06.json) 维护。

这些文档不替代已完成的 AFAPI 历史总控计划，也不自动重启实现派发。后续如果任一方向需要返工或增强，必须从对应标准文档领取 state-root，先做 Stage 0 代码事实复核，再进入实现计划。

## 新方案推进入口

- 开发者可读入口：本目录 12 篇 `AFAPI xx ... Progress` 标准文档。
- 机器顺序入口：`afapi-independent-demand-sequence-2026-06-06.json`。
- 状态 authority：每个需求领取后生成的 `.workspace-active/workspace/current/<demand-key>/controller-state.json`。
- 文档状态同步：在 `codex-control-workspace/` 下执行 `node scripts/workspace-control.mjs sequence sync-doc --root .. --manifest workspace-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-independent-demand-sequence-2026-06-06.json --demand-key <DEMAND-KEY> --write --json`。
- 领取下一个需求：在 `codex-control-workspace/` 下执行 `node scripts/workspace-control.mjs sequence claim-next --root .. --manifest workspace-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-independent-demand-sequence-2026-06-06.json --write --json`。
- 领取只创建 state-root 和初始任务包，不创建 dispatch、不发送线程、不验收证据、不自动完成需求。

## 领取顺序分析

领取顺序按依赖关系而不是旧 TODO 编号决定：

1. Runtime identity 先行：所有 public tool 都必须知道当前 host 窗口的真实 projectRoot、ghost dataRoot、ProjectScope 和 resident readiness。
2. Unified public contract 第二：六个 agent-facing tool、统一 schema、result envelope 和 legacy boundary 是后续 intent / prime / work / guard / decision 的共同地基。
3. Intent 第三：prime、work、guard、decision 都需要结构化意图或可解释的 skip / blocked reason。
4. Prime 第四：结构化 Recipe knowledge package 是 work 前的知识入口，不能继续依赖 raw prompt 或旧 task operation。
5. Trust receipt 第五：只有 prime delivered / degraded / empty 以后，host agent 才能向用户可见声明信任边界。
6. Work lifecycle 第六：work_start / work_finish 只服务真实 evidence-producing work，依赖 intent / prime 的 refs。
7. Scoped code guard 第七：guard 依赖明确代码 scope、work evidence、accepted Recipe / Guard 上下文。
8. Decision Register 第八：decision_record 需要 Alembic durable producer 和 Plugin consumer，且 prime 默认只消费 active / effective 决定。
9. Skill / prompt cleanup 第九：旧 prime/create/close/guard/record_decision 话术只能在新 contract 可验证后清理。
10. Evaluation / smoke / cross-host 第十：评测必须覆盖工具契约、错误调用、legacy cleanup、真实 Codex / resident smoke 和 cross-host no-schema-fork。
11. Dashboard diagnostics 第十一：只有 runtime readiness / sourceOfTruth 需要用户可见诊断时，Dashboard 做只读消费。
12. Core shared schema promotion 第十二：只有出现真实多消费者阻塞时，才把 Plugin 内 contract 提升到 Core；不得提前造空 shared layer。

## 独立文档列表

| 顺序 | 独立需求 | 文档 | 标准推进状态 |
| --- | --- | --- | --- |
| 01 | Runtime identity / multi-project MCP runtime | [afapi-01-runtime-identity-multi-project-runtime-landing-2026-06-05.md](afapi-01-runtime-identity-multi-project-runtime-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 02 | Agent-facing public API contract | [afapi-02-agent-facing-public-api-contract-landing-2026-06-05.md](afapi-02-agent-facing-public-api-contract-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 03 | Intent structured local-vector entry | [afapi-03-intent-structured-local-vector-landing-2026-06-05.md](afapi-03-intent-structured-local-vector-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 04 | Prime independent knowledge entry | [afapi-04-prime-independent-knowledge-entry-landing-2026-06-05.md](afapi-04-prime-independent-knowledge-entry-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 05 | Prime trust receipt | [afapi-05-prime-trust-receipt-landing-2026-06-05.md](afapi-05-prime-trust-receipt-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 06 | Work evidence lifecycle | [afapi-06-work-evidence-lifecycle-landing-2026-06-05.md](afapi-06-work-evidence-lifecycle-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 07 | Scoped code guard | [afapi-07-scoped-code-guard-landing-2026-06-05.md](afapi-07-scoped-code-guard-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 08 | Decision Register / decision_record | [afapi-08-decision-register-record-landing-2026-06-05.md](afapi-08-decision-register-record-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 09 | Skill / tool prompt / automation guide cleanup | [afapi-09-skill-tool-prompt-automation-guide-cleanup-landing-2026-06-05.md](afapi-09-skill-tool-prompt-automation-guide-cleanup-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 10 | Evaluation / smoke / cross-host readiness | [afapi-10-evaluation-smoke-cross-host-readiness-landing-2026-06-05.md](afapi-10-evaluation-smoke-cross-host-readiness-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 11 | Dashboard runtime diagnostics UI | [afapi-11-dashboard-runtime-diagnostics-ui-landing-2026-06-05.md](afapi-11-dashboard-runtime-diagnostics-ui-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |
| 12 | Core shared schema promotion decision | [afapi-12-core-shared-schema-promotion-decision-landing-2026-06-05.md](afapi-12-core-shared-schema-promotion-decision-landing-2026-06-05.md) | 标准模板已重建；状态区待 sequence 领取后同步。 |

## 当前总控裁决

- 本次动作重建的是 12 篇标准需求推进文档和机器 sequence manifest；不创建 dispatch，不启动 automation，不改产品源码。
- 这些文档不能被旧 `AFAPI-FULL-00` 到 `AFAPI-FULL-21` TODO 账本替代；旧 TODO 只作为历史推进证据。
- 如果发现某个需求与当前代码实现不完全等价，应在该标准文档中保留差异，并由对应 state-root 管理后续状态。
- 旧 umbrella TODO / 旧当前计划不能再作为 AFAPI 新推进入口。
