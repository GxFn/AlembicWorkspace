# PCVM Workspace Instructions

本目录是 AlembicWorkspace 下的 `PCVM` artifact 工作面。AlembicWorkspace 总控主持 Progressive Chain Validation 的使用、计划生成、游标推进和总控验收；本目录只保存 PCVM 说明、run artifact、节点隔离设计、指标契约和 scorecard 证据。

## 窗口定位

- 当前目录：`PCVM/`。
- 当前职责：PCVM artifact / docs / scratch run 存放面，不是独立派发窗口。
- Canonical PCV source：`../progressive-chain-validation/progressive-chain-validation/`。
- 总控入口：`../codex-control-workspace/.workspace-active/workspace/index.md`、`../codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`。
- 当前任务以总控当前计划为准。
- 使用说明：`docs/pcvm-usage.md`。
- 流程控制 skill：`skills/pcvm-flow-controller/SKILL.md`。
- 流程控制配置：`config/pcvm-flow-control.json`。

## 固定流程线路

PCVM 推进必须先读流程控制 skill 和配置，再判断当前动作属于哪条线路：

1. `S0-intake`：确认用户目标、证据范围、最小闭环和第一阻塞点。
2. `S1-source-chain-map`：从真实源码切链路，不先套模板。
3. `S2-plan-artifact`：生成或更新 `report/plan.md`。
4. `S3-round-registry`：在 `records/rounds.md` 固定轮次 scope、门禁和 verdict 含义。
5. `S4-node-or-round-execution`：只推进当前授权节点或轮次。
6. `S5-record-classification`：数据、问题、推进和复盘分别入账。
7. `S6-engineering-repair-packaging`：确定性问题打成工程修复任务包。
8. `S7-live-ai-local-chain`：AI 相关行为拆成局部链路和 Test 占位。
9. `S8-verdict-and-next-round`：只写 scoped verdict 和下一轮入口 / 停止条件。

默认轮次顺序是 `R1 discovery -> R2 engineering repair -> R3 AI analyze -> R4 AI producer -> R5 AI expansion -> R6 Dashboard observability -> R7 delivery`。不得从 discovery 直接跳到 live AI、Dashboard 或 delivery。

## 最高停止卡

- 如果任务需要总控裁决、产品范围确认、窗口分派、TODO 关闭或验收结论，停止；这些职责只属于 `AlembicWorkspace`。
- 如果还没有读取父级 `AGENTS.md`、当前总控计划和 canonical PCV `SKILL.md`，不得生成 plan artifact。
- 如果准备修改 `Alembic`、`AlembicAgent`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili` 或 `progressive-chain-validation` source repo，停止；除非总控计划明确把该仓库任务派给 PCVM。
- 如果缺少 source-first chain map、node-local fixture、downstream cut、baseline metrics、quality gate 或 reference alignment，不得把 `report/plan.md` 标为 ready。
- 如果 plan 只是 N0-N14 表格、总控手写摘要或 broad full-run 命令清单，必须标为 incomplete。
- 如果需要运行会写 runtime data、DB、generated knowledge、delivery output 或真实项目文件的命令，先完成 PCV `N0-data-location`，并确认写边界。

## 工作规则

1. 先读取：
   - `../AGENTS.md`
   - `../codex-control-workspace/.workspace-active/workspace/index.md`
   - `../codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`
   - 当前总控计划
   - `config/pcvm-flow-control.json`
   - `skills/pcvm-flow-controller/SKILL.md`
   - `../progressive-chain-validation/progressive-chain-validation/SKILL.md`
2. 再按 PCV startup 顺序读取必要 references：safety boundary、artifact layout、data location preflight、plan quality standard、chain plan generation、metrics contract、Alembic adapter / overlay。
3. 生成或更新 PCV run artifact：
   - 主产物：`scratch/chain-runs/<run-id>/report/plan.md`
   - 附件只放大型命令输出、JSON、截图或机器产物。
4. plan 必须自包含，后续执行窗口不应为了理解节点定义而重新读取 PCV skill。
5. AlembicWorkspace 总控直接维护或验收 PCVM 产物；产品仓库派发和 `AlembicTest` 测试交接仍由总控决定。

详细流程、指标字段和产物关系见 [docs/pcvm-usage.md](docs/pcvm-usage.md)。流程线路以 [skills/pcvm-flow-controller/SKILL.md](skills/pcvm-flow-controller/SKILL.md) 和 [config/pcvm-flow-control.json](config/pcvm-flow-control.json) 为准。

## 当前默认产物位置

```text
scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/plan.md
```
