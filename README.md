# AlembicWorkspace

AlembicWorkspace is the coordination workspace for the Alembic repositories.

This repository tracks workspace-level instructions, plans, acceptance notes,
and cross-repository coordination documents. The child source repositories
inside the workspace are independent Git repositories and are intentionally
ignored here:

- `Alembic`
- `AlembicCore`
- `AlembicAgent`
- `AlembicDashboard`
- `AlembicPlugin`
- `BiliDili`

Do not add those child repositories as files, submodules, or gitlinks in this
workspace repository. Commit source changes in each child repository separately.
