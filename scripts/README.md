# Workspace Scripts

This directory stores AlembicWorkspace-owned scripts for coordination,
verification, documentation maintenance, and cross-repository guardrails.

Scripts in this directory should:

- operate from the workspace root unless documented otherwise;
- avoid secrets, tokens, local absolute paths, and network access by default;
- avoid writing into child source repositories unless a current control plan
  explicitly assigns that work;
- report clear pass/fail evidence that can be pasted into workspace docs.

Current scripts:

- `collect-repo-status.mjs`: summarizes branch, HEAD, dirty state,
  upstream, ahead / behind counts, untracked files, and latest commit for each
  workspace child repository.
- `check-workspace-boundary.mjs`: verifies that child source repositories and
  local noise files are not tracked by the workspace Git repository.
- `verify-workspace-docs.mjs`: checks the workspace index, current control
  plan, required sections, Markdown links, and completed document references.
- `check-dispatch-coverage.mjs`: verifies that the current control plan covers
  every expected window and that the declared copyable prompt send list matches
  task statuses.
- `check-todo-board.mjs`: verifies that plans using the TODO submode contain a
  `TODO / Backlog` section and idle-window scheduling coverage. Use
  `--require` when TODO items affect dispatch, parallel scheduling, or the next
  wave order.
- `check-runtime-residue.mjs`: read-only check for Alembic daemon, Dashboard
  dev server, and Codex MCP process residue. It does not start, stop, or kill
  anything; use `--strict` only when a clean runtime surface is required.
- `restart-alembic.mjs`: one-command local Alembic runtime restart for real
  project testing. It defaults to the workspace `BiliDili` project, calls the
  Alembic CLI `start --restart --no-open --json`, then prints the active
  Dashboard URL, daemon pid, and bootstrap status probe.
- `verify-control-center.mjs`: one-command control-center verification that
  runs boundary, repo status, workspace docs, dispatch coverage, and
  `git diff --check`. Add `--with-runtime` for a read-only runtime residue
  report, or `--strict-runtime` to fail when Alembic daemon / Dashboard dev
  residue is present.
- `archive-workspace-docs.mjs`: dry-run by default; moves completed workspace
  control documents into `docs/workspace/archive/YYYY-MM/<topic>/`, rewrites
  relative links inside moved documents, rewrites index links, removes archived
  rows from the current index table, and adds a compact archive summary entry
  only when `--apply` is provided. Use `--keep-index-rows` only when a
  historical row must remain visible. The script protects active first-row
  plans, but completed first-row plans can be archived once a new current or
  idle status entry is ready.

Suggested pre-acceptance sequence:

```bash
node scripts/verify-control-center.mjs
```

TODO scheduling plan check:

```bash
node scripts/check-todo-board.mjs --require
```

Runtime residue check:

```bash
node scripts/check-runtime-residue.mjs
node scripts/verify-control-center.mjs --with-runtime
```

Restart local Alembic for `BiliDili`:

```bash
node scripts/restart-alembic.mjs
```

Archive dry-run example:

```bash
node scripts/archive-workspace-docs.mjs --topic interface-boundary --file docs/workspace/example-completed-plan.md
```

Index-only pruning example:

```bash
node scripts/archive-workspace-docs.mjs --prune-index-only --apply
```
