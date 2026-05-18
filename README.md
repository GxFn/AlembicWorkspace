# AlembicWorkspace

AlembicWorkspace is the coordination workspace for the Alembic repositories.

This repository tracks workspace-level instructions, plans, acceptance notes,
cross-repository coordination documents, and reusable workspace-level support
assets.

Tracked workspace assets:

- `AGENTS.md`: root coordination rules for Codex windows.
- `docs/`: cross-repository plans, acceptance notes, migration history, and
  repo-specific coordination records.
- `scripts/`: workspace maintenance and verification scripts.
- `skills/`: workspace-owned reusable Codex skill drafts or shared skill
  assets.
- `templates/`: reusable document, prompt, and dispatch templates.

The child source repositories inside the workspace are independent Git
repositories and are intentionally ignored here:

- `Alembic`
- `AlembicCore`
- `AlembicAgent`
- `AlembicDashboard`
- `AlembicPlugin`
- `BiliDili`

Do not add those child repositories as files, submodules, or gitlinks in this
workspace repository. Commit source changes in each child repository separately.

Workspace common assets must stay repo-neutral: they may help with planning,
verification, dispatch, documentation, or local agent workflow, but they must not
duplicate product/runtime implementation owned by the child repositories.
