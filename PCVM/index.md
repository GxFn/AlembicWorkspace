# PCVM Workspace

状态：artifact 工作面 / 当前 run 第一轮 no-live fixture 已完成 / R2 工程修复待开启

## 定位

本目录是 AlembicWorkspace 下的 PCVM artifact 工作面。AlembicWorkspace 总控使用 canonical Progressive Chain Validation source 生成源代码驱动的链路计划、阶段指标和 scorecard artifact；本目录保存这些产物。

## 当前 Run

| Run ID | 目标 | 主产物 | 状态 |
| --- | --- | --- | --- |
| `pcv-20260530-1515-alembic-cold-start` | Alembic cold-start source-derived plan and metrics | [scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/plan.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/plan.md) | R1 complete; R2 planned |

## 说明文档

- [README.md](README.md)：PCVM 工作空间快速入口。
- [docs/pcvm-usage.md](docs/pcvm-usage.md)：PCVM 使用方式、plan 生成与更新、指标报告和附件关系。
- [skills/pcvm-flow-controller/SKILL.md](skills/pcvm-flow-controller/SKILL.md)：PCVM 使用与流程控制 skill。
- [config/pcvm-flow-control.json](config/pcvm-flow-control.json)：PCVM 固定状态线路、轮次顺序、门禁和 artifact 落点。
- [docs/pcvm-round-model.md](docs/pcvm-round-model.md)：PCVM 多轮次模型。
- [docs/pcvm-local-chain-optimization.md](docs/pcvm-local-chain-optimization.md)：局部链路 PCVM 优化模型。

## 当前 Run Records

- [rounds.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/rounds.md)：轮次定义和后续真实轮次入口。
- [task-packages.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/task-packages.md)：第一轮暴露问题整理成 R2 工程任务包。
- [ai-local-chain.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/ai-local-chain.md)：AI 局部链路真实阶段拆分和 Test 占位。
- [review.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/review.md)：第一轮复盘。

## Source

- Canonical PCV source: `../progressive-chain-validation/progressive-chain-validation/`
- Workspace control: `../codex-control-workspace/.workspace-active/workspace/current/`

## Fixed Route

当前默认线路：`S0-intake -> S1-source-chain-map -> S2-plan-artifact -> S3-round-registry -> S4-node-or-round-execution -> S5-record-classification -> S6-engineering-repair-packaging -> S7-live-ai-local-chain -> S8-verdict-and-next-round`。

当前 run 推荐下一步：`R2-engineering-repair`，先处理 `task-packages.md` 中 P0-P3 的工程确定性问题，再进入真实 AI 局部轮次。
