# Current Design Work

Use this directory for active Design drafts that still belong to the Design
surface:

- `<topic>-original-plan-YYYY-MM-DD.md`
- `<topic>-requirement-design-YYYY-MM-DD.md`
- `<topic>-discussion-sequence-YYYY-MM-DD.md`
- `<topic>-workspace-signal-YYYY-MM-DD.md`
- `<topic>-workspace-handoff-YYYY-MM-DD.md`
- `workspace-handoff-board.md`

Design drafts are not executable controller plans. They become executable only
after Wakeflow intake attaches them to a state root, TODO, task package, or
controller decision.

## Status Classification（2026-07-09 历史遗留整理）

本目录 110+ 文件**原地保留、一个不移**——已归档需求的证据链（humanContextRef 等）引用这些路径，
移动会打断历史证据链。分类如下：

### 1. 历史设计（对应已归档需求 —— 只作参考，不作执行根）

文件名与[需求链总账](../../../wakeflow-ledger/workspace/demand-chain-ledger.md)中已归档 demand
同名/同前缀的（含其 `-original-plan` / `-workspace-handoff` / `-signal` 变体），以及 ≤2026-06-18
压缩史时期的 requirement-design/requirement-group 文档——**全部为历史**。按 no-guess 纪律：
不得从这些文档派发或将其当作当前需求权威；查结论走总账，查证据走对应归档目录。

### 2. 疑似未来候选（2026-07 上旬产出、无对应归档需求 —— 启用前需用户确认）

| 文档 | 备注 |
| --- | --- |
| `alembic-mcp-five-tools-value-upgrade-2026-07-06.md` | 最晚近的设计草案 |
| `alembic-recipe-pipeline-structure-cleanup-2026-07-04.md` | |
| `alembic-coldstart-evidence-ledger-redesign(-original-plan)-2026-07-04.md` | |
| `alembic-agent-mining-output-upgrade-2026-07-04.md` | 关联 ledger/AlembicAgent 下 2026-07-10 的 mining-quality-upgrade 需求文档（更新的后继） |
| `alembic-dashboard-workspace-scope-fix(-original-plan)-2026-07-02.md` | |
| `alembic-recipe-pipeline-unification-2026-07-02.md` | |

启用其一 = Design 补齐出口门（含 testing decision）→ `wakeflow_deliver` 上 TODO 板,而非直接派发。

### 3. 通用工作材料（跨需求参考,保留）

结构图与词表（`alembic-w3..w7-*-structure-map`、`alembic-s4-bootstrap-symbol-map`、
`alembic-workspace-survey-raw` / `-optimization-backlog` / `-unification-plan`）、
`wakeflow-controller-master-loop*`、`wakeflow-parallel-dev-intent-drift`、
`workspace-handoff-board.md`（交接板,按板面状态为准）。

> 新需求开发起步时,只需要看第 2 类(候选)与第 3 类(参考);第 1 类一律经总账回看。
