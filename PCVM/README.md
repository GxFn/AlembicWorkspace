# PCVM Workspace

PCVM 是 AlembicWorkspace 下的 Progressive Chain Validation artifact 工作面。AlembicWorkspace 总控主持 PCVM 的使用、计划生成和游标推进；本目录负责保存 source-derived 计划、阶段指标、节点隔离闭环和 scorecard artifact。

## 入口

- 工作规则：[AGENTS.md](AGENTS.md)
- 当前地图：[index.md](index.md)
- 使用说明：[docs/pcvm-usage.md](docs/pcvm-usage.md)
- 流程控制 skill：[skills/pcvm-flow-controller/SKILL.md](skills/pcvm-flow-controller/SKILL.md)
- 流程控制配置：[config/pcvm-flow-control.json](config/pcvm-flow-control.json)
- 产物校验脚本：[scripts/validate-pcvm-run.mjs](scripts/validate-pcvm-run.mjs)
- 多轮次模型：[docs/pcvm-round-model.md](docs/pcvm-round-model.md)
- 局部链路优化：[docs/pcvm-local-chain-optimization.md](docs/pcvm-local-chain-optimization.md)
- Canonical PCV source：`../progressive-chain-validation/progressive-chain-validation/`
- 总控当前计划：`../codex-control-workspace/.workspace-active/workspace/current/`

## 当前默认 Run

```text
scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/
```

当前状态：当前以清理后的产品代码事实为准。PCVM 不维护独立的伪指标契约或分类口径。R5、Dashboard、delivery、full cold-start 和 Alembic self-hosting 仍关闭。

主产物必须是：

```text
scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/plan.md
```

没有这份 `report/plan.md`，总控不应派发 Alembic 产品仓库做阶段优化。

问题、数据和推进记录不堆进 plan，放在：

```text
scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/records/
```

`plan.md` 只保留链路计划、节点指标契约、当前游标、verdict 和必要链接。

当前 run 的短期状态只保留 `records/data.md`、`records/issues.md` 和 `records/progress.md`。旧轮次、旧任务包和旧 AI 分析文件已删除，不再作为入口。

机器形态 probe 摘要、JSON 输出和大块命令产物放在：

```text
scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/artifacts/
```

## 边界

- AlembicWorkspace 总控生成 / 更新 / 验收 PCVM plan。
- PCVM 目录保存计划、指标、问题记录、数据记录和推进记录。
- PCVM 不修改 Alembic 产品源码。
- PCVM 不修改 canonical PCV source，除非总控明确派发 PCV source 改动。
- PCVM 不把 full cold-start 运行结果当作多个节点自动通过。

## 固定流程

后续 PCVM 推进先按 `config/pcvm-flow-control.json` 判断状态线路，再按 `skills/pcvm-flow-controller/SKILL.md` 执行。不得把已删除的旧分析和任务包文档继续作为当前判断，也不得把 fixture、unit/typecheck、partial/failure 或 source pass 直接升级成 full runtime / Dashboard / delivery 验收。
