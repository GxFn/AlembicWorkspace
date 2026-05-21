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
  project testing. It defaults to the workspace `BiliDili` project, first runs
  `npm run dev:link` in the Alembic repository to refresh the local global
  development environment, then calls the Alembic CLI
  `start --restart --no-open --json`, prints the active Dashboard URL, daemon
  pid, and compact bootstrap job probe. Use `--monitor` to immediately hand off
  to the read-only bootstrap monitor after restart. Use `--no-dev-link` only
  when intentionally testing an already-linked build. Because Alembic must write
  `~/.asd/runtime-control.json` to register the active runtime, the script
  preflights that write and should be run with elevated sandbox permissions
  inside Codex.
- `monitor-alembic-bootstrap.mjs`: read-only bootstrap monitor for cold-start
  runs. It never starts, stops, cancels, or kills Alembic; it resolves the
  current daemon URL/data root, polls the compact jobs API
  (`/api/v1/jobs?kind=bootstrap&limit=1&compact=true`), counts candidate
  files, and tails focused log signals such as `coding-standards`,
  `note_finding`, `QualityGate`, timeout, cancellation, and failed dimensions.
  It must not call heavyweight Dashboard compatibility endpoints such as
  `/api/v1/modules/bootstrap/status` for routine monitoring. Inside Codex,
  standalone localhost polling can be blocked by the sandbox; prefer
  `restart-alembic.mjs --monitor` with elevated permissions when restarting and
  watching a real cold start.
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

Restart local Alembic and monitor cold-start progress:

```bash
node scripts/restart-alembic.mjs --monitor
```

Monitor an already-running Alembic cold start:

```bash
node scripts/monitor-alembic-bootstrap.mjs --watch
```

Archive dry-run example:

```bash
node scripts/archive-workspace-docs.mjs --topic interface-boundary --file docs/workspace/example-completed-plan.md
```

Index-only pruning example:

```bash
node scripts/archive-workspace-docs.mjs --prune-index-only --apply
```
