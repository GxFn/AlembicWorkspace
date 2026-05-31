# PCVM Workspace

状态：artifact 工作面 / LLM 阶段 token efficiency 已完成 Package Q live 失败复核与 root-cause 定位；下一步阻塞在 Package R Producer 覆盖率 source/unit 修复；工具与终端使用基线已基于 AlembicTest 报告完成 controlled baseline helper 修复

## 定位

本目录是 AlembicWorkspace 下的 PCVM artifact 工作面。AlembicWorkspace 总控使用 canonical Progressive Chain Validation source 生成源代码驱动的链路计划、阶段指标和 scorecard artifact；本目录保存这些产物。

## 当前 Run

| Run ID | 目标 | 主产物 | 状态 |
| --- | --- | --- | --- |
| `pcv-20260530-1515-alembic-cold-start` | Reduce duplicated and oversized LLM input/output in Alembic cold-start stages | [scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/plan.md](scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/plan.md) | `fail(scope=live-ai-local, package=Q); diagnosed(scope=source-logic, package=Q); blocked(scope=producer-coverage-source-unit-repair, package=R)` |
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

旧轮次、旧任务包和旧 AI 分析文件已删除，不再作为 PCVM 入口或判断依据。

## Source

- Canonical PCV source: `../progressive-chain-validation/progressive-chain-validation/`
- Workspace control: `../codex-control-workspace/.workspace-active/workspace/current/`

## Fixed Route

当前默认线路：`S0-intake -> S1-source-chain-map -> S2-plan-artifact -> S3-round-registry -> S4-node-or-round-execution -> S5-record-classification -> S6-engineering-repair-packaging -> S8-verdict-and-next-round`。

当前 LLM token run 下一步：Package Q live 复测失败。Q 证明 Package P 已消除 missing-`description` reject，且没有复现 Package O 的 completion 后 continue nudge/额外 no-tool final round；但 accepted Recipes 从 O 的 `7` 跌到 `1`，5 条结构化发现未提交。PCVM root-cause 判断：这不是可接受的偶发波动，而是 Producer tool schema、非 submit 动作边界和 `roundsSinceSubmit >= 3` 退出逻辑共同暴露的代码逻辑缺口。下一步是 Package R source/unit 修复 Producer 覆盖率与字段契约，不要重跑 Test。

当前工具/终端使用基线 run 下一步：AlembicTest controlled baseline helper 已实现并验证；不要为了造更好看的数字单独重跑 Test。等下一次真实 PCVM Tool/Terminal 任务出现时，用新脚本做 before/after。全历史 baseline 仍阻塞在真实 telemetry source。
