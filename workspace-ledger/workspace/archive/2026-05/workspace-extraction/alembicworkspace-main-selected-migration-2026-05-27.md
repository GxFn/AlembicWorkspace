# AlembicWorkspace-main Selected Migration

状态：已执行
日期：2026-05-27
执行窗口：codex-control-workspace

## 目标

把 `AlembicWorkspace-main` 中仍真实在用或近期有复盘价值的 Alembic 项目文档迁入新的 `workspace-ledger` 层级；不做旧历史全量复制，不让 `codex-control-workspace` 通用仓库承载 Alembic 项目专属账本。

## 迁移原则

- `codex-control-workspace/`：只保留通用控制仓库能力、脚本、模板、skill 和示例。
- `workspace-ledger/`：保存 Alembic 项目专属当前账本、需求、TODO、归档和窗口证据。
- `AlembicWorkspace-main/`：作为旧源副本保留；旧历史不在新 ledger 全量引用，需要时再按需导入。

## 已迁入

| 类别 | 目标位置 | 内容 |
| --- | --- | --- |
| 当前总控账本 | `workspace-ledger/workspace/current/` | 当前状态、短期索引、全局 TODO、Design inbox、测试交流、PCV / VAD / 037 / Artifact Drawer 当前计划。 |
| 精选归档 | `workspace-ledger/workspace/archive/2026-05/` | `global-todo`、`plugin-intent-knowledge-route`、`visible-automation-dispatch`、`workspace-control-architecture-refresh`。 |
| 需求设计 | `workspace-ledger/requirement-designs/` | 037 intent recognition、037 plugin intent knowledge route、038/039 knowledge evolution TODOs、PCVM、VAD、Artifact Drawer、multi-root ProjectScope。 |
| 窗口证据 | `workspace-ledger/Alembic*` | PCV N9 / cleanup、LLM input 近期证据、Artifact Drawer 回填、multi-root Core contract。 |
| Design 清单 | `workspace-ledger/AlembicDesign/workspace-handoff-board.md` | AlembicDesign handoff board 快照。 |

## 未迁入

- `AlembicWorkspace-main` 的旧全量 workspace archive。
- 早期全窗口历史执行记录、旧脚本/skill/template 副本和旧测试交流全文。
- 与当前 TODO、037、038/039、PCV、VAD 或近期复盘无直接关系的旧需求目录。

这些内容仍保留在 `codex-control-workspace/AlembicWorkspace-main/` 源副本，后续需要时再按主题迁入。

## 当前可用入口

- 当前状态：[workspace-current-status.md](../../../../../codex-control-workspace/.wakeflow-active/current/workspace-current-status.md)
- 当前 TODO：[global-todo-board.md](../../../../../codex-control-workspace/.wakeflow-active/current/global-todo-board.md)
- 记录地图：[../workspace-record-map.md](../../../workspace-record-map.md)
- 测试交流：[test-exchange.md](../../../../../codex-control-workspace/.wakeflow-active/current/test-exchange.md)
