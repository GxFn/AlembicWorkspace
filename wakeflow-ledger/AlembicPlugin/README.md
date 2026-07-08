# AlembicPlugin

This directory stores durable **technical reference documentation** for AlembicPlugin
(e.g. the complete implementation / architecture deep-dive of the source repo).

- Window responsibility: AlembicPlugin work window
- Source repository scope: `AlembicPlugin`
- Keep source code changes in the source repository.
- Keep only long-lived technical / architecture reference docs about this repo here.
- Do NOT store requirement-advancing / process records here — task packages,
  backfills, acceptance notes, handoff evidence, plans, designs, inventories,
  findings, specs, and progress belong in the workspace ledger
  (`wakeflow-ledger/workspace/archive/…`, `requirement-designs/`,
  `goal-stage-confirmation/`, or `wakeflow-ledger/AlembicWorkspace/`).

## Reference documents

- [alembic-plugin-implementation-architecture-deep-dive-2026-07-02.md](alembic-plugin-implementation-architecture-deep-dive-2026-07-02.md) — AlembicPlugin 完整实现深挖（架构分层、对外 MCP 工具、端到端数据流、设计模式、双宿主模型、数据持久化；13 章 / ~4900 行，基线 commit `c1d0daa`）。
