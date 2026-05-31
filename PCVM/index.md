# PCVM Workspace

状态：artifact 证据保留 / `GTODO-2026-05-25-003 / PCVM` 已按用户裁决从活跃 TODO 删除；LLM token run 历史停在 Package T source/unit 修复，Package U same-input live rerun 不再作为当前下一步

## 定位

本目录是 AlembicWorkspace 下的 PCVM artifact 工作面。AlembicWorkspace 总控使用 canonical Progressive Chain Validation source 生成源代码驱动的链路计划、阶段指标和 scorecard artifact；本目录保存这些产物。

## 当前 Run

| Run ID | 目标 | 主产物 | 状态 |
| --- | --- | --- | --- |
| `pcv-20260530-1515-alembic-cold-start` | Reduce duplicated and oversized LLM input/output in Alembic cold-start stages | [scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/plan.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/plan.md) | `stopped-by-user(scope=active-pcvm); historical-evidence-retained(package=S/T)` |
| `pcv-20260531-1506-tool-terminal-usage-baseline` | Establish baseline facts and key metrics for current tool and terminal usage before optimization | [scratch/chain-runs/pcv-20260531-1506-tool-terminal-usage-baseline/report/plan.md](scratch/chain-runs/pcv-20260531-1506-tool-terminal-usage-baseline/report/plan.md) | `repair-implemented(scope=alembictest-controlled-baseline-helper); blocked(scope=historical-all-session-baseline)` |

## 说明文档

- [README.md](README.md)：PCVM 工作空间快速入口。
- [docs/pcvm-usage.md](docs/pcvm-usage.md)：PCVM 使用方式、plan 生成与更新、指标报告和附件关系。
- [skills/pcvm-flow-controller/SKILL.md](skills/pcvm-flow-controller/SKILL.md)：PCVM 使用与流程控制 skill。
- [config/pcvm-flow-control.json](config/pcvm-flow-control.json)：PCVM 固定状态线路、轮次顺序、门禁和 artifact 落点。
- [docs/pcvm-round-model.md](docs/pcvm-round-model.md)：PCVM 多轮次模型。
- [docs/pcvm-local-chain-optimization.md](docs/pcvm-local-chain-optimization.md)：局部链路 PCVM 优化模型。

## 当前 Run Records

Tool / Terminal usage baseline:

- [data.md](scratch/chain-runs/pcv-20260531-1506-tool-terminal-usage-baseline/report/records/data.md)：AlembicTest raw evidence 复核、baseline sample 和指标。
- [issues.md](scratch/chain-runs/pcv-20260531-1506-tool-terminal-usage-baseline/report/records/issues.md)：telemetry source blind spots、output noise、file placement mismatch 修复状态和历史 baseline 阻塞。
- [progress.md](scratch/chain-runs/pcv-20260531-1506-tool-terminal-usage-baseline/report/records/progress.md)：当前工具/终端 baseline 推进记录。

LLM token efficiency run:

- [data.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/data.md)：当前代码事实和验证证据。
- [issues.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/issues.md)：当前有效问题和边界。
- [progress.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/progress.md)：当前推进记录。
- [package-m-structure-self-check.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/package-m-structure-self-check.md)：Package M 全量逐条 input/output/reflection 产出阅读、自检和 live verdict。
- [package-o-structure-self-check.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/package-o-structure-self-check.md)：Package O 全量逐条 input/output/reflection 产出阅读、自检和 live verdict。
- [package-q-failure-root-cause.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/package-q-failure-root-cause.md)：Package Q live 失败 root-cause，区分偶发模型选择与确定性代码逻辑缺口。
- [package-r-source-unit-repair.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/package-r-source-unit-repair.md)：Package R Producer 覆盖率、submit 字段可见性和工具边界 source/unit 修复证据。
- [package-s-root-cause-design-audit.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/package-s-root-cause-design-audit.md)：Package S live raw evidence 与真实源码链路根因审计；确认剩余问题是设计契约断层，不再打临时补丁。
- [package-t-contract-unification-repair.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/package-t-contract-unification-repair.md)：Package T stage capability/action contract、runtime action gate、compact submit ledger 与 final summary source-of-truth source/unit 修复证据。

旧轮次、旧任务包和旧 AI 分析文件已删除，不再作为 PCVM 入口或判断依据。

## Source

- Canonical PCV source: `../progressive-chain-validation/progressive-chain-validation/`
- Workspace control: `../codex-control-workspace/.workspace-active/workspace/current/`

## Fixed Route

当前默认线路：`S0-intake -> S1-source-chain-map -> S2-plan-artifact -> S3-round-registry -> S4-node-or-round-execution -> S5-record-classification -> S6-engineering-repair-packaging -> S8-verdict-and-next-round`。

当前 LLM token run 状态：Package S/T 记录只作为历史诊断和源码修复证据保留。用户已裁决 `GTODO-2026-05-25-003 / PCVM` 不做并从活跃 TODO 删除，因此 Package U same-input live rerun 不再作为当前下一步；不要重开 SourceRef，不要新增伪指标，不要启动新的 PCVM live gate。

当前工具/终端使用基线 run 下一步：AlembicTest controlled baseline helper 已实现并验证；不要为了造更好看的数字单独重跑 Test。等下一次真实 PCVM Tool/Terminal 任务出现时，用新脚本做 before/after。全历史 baseline 仍阻塞在真实 telemetry source。
