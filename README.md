# AlembicWorkspace

This directory is the total-control workspace for the Alembic product family.
Wakeflow is consumed through the installed Codex or Claude Code plugin; it is
not vendored as a child source repository here.

## Entry points

- `AGENTS.md`: Codex controller rules and preserved workspace-local constraints.
- `CLAUDE.md`: Claude Code controller rules and preserved workspace-local constraints.
- `wakeflow.config.json`: managed windows, repositories, hosts, and ledger paths.
- `.wakeflow-active/index.md`: current runtime entrypoint and live projections.
- `.wakeflow-active/current/`: active demand state roots, TODO board, and status.
- `wakeflow-ledger/`: long-term requirement, acceptance, archive, and window records.

## Managed windows

- `Design/`: requirement clarification, design, and redesign support. Its local
  board is advisory history; executable intake is created through Wakeflow.
- `Test/`: controller-authorized real-environment and hidden-boundary testing.
- `Alembic/`, `AlembicCore/`, `AlembicAgent/`, `AlembicDashboard/`, and
  `AlembicPlugin/`: independently versioned product repositories.

Use Wakeflow MCP tools and installed Skills for status, delivery, review,
storage, verification, completion, and archive operations. Do not invoke plugin
cache scripts directly or copy reusable Wakeflow assets into product repositories.
