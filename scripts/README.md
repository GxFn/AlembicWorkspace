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
- `check-workspace-current-layout.mjs`: verifies that short-term workspace docs
  live under `docs/workspace/current/`, that the current index target points
  there, and that active docs/scripts/templates do not reference the old
  root-level short-term paths.
- `check-dispatch-coverage.mjs`: verifies that the current control plan covers
  every expected window, that the declared copyable prompt send list matches
  task statuses, and that sendable prompts require reading `AGENTS.md` plus an
  explicit window / repository positioning statement.
- `check-todo-board.mjs`: verifies that plans using the TODO submode contain a
  `TODO / Backlog` section and idle-window scheduling coverage. Use
  `--require` when TODO items affect dispatch, parallel scheduling, or the next
  wave order.
- `check-task-packages.mjs`: verifies that plans using package-based dispatch
  contain a task-package section with stage goal, mainline actions, merged
  TODOs, exclusions, blockers / dependencies, verification, and backfill
  fields, plus the `AGENTS.md` reading and explicit positioning precondition.
  Use `--require` when TODOs and mainline work are bundled for a wave.
- `check-runtime-residue.mjs`: read-only check for Alembic daemon, Dashboard
  dev server, and Codex MCP process residue. It does not start, stop, or kill
  anything; use `--strict` only when a clean runtime surface is required.
- `verify-control-center.mjs`: one-command control-center verification that
  runs boundary, repo status, workspace docs, dispatch coverage, and
  `git diff --check`. Add `--require-todo` when TODO scheduling must be
  present, `--require-task-packages` when package-based dispatch must be
  present, `--with-runtime` for a read-only runtime residue report, or
  `--strict-runtime` to fail when Alembic daemon / Dashboard dev residue is
  present.
- `archive-workspace-docs.mjs`: dry-run by default; moves completed workspace
  control documents into `docs/workspace/archive/YYYY-MM/<topic>/`, rewrites
  relative links inside moved documents, rewrites index links, removes archived
  rows from the current index table, and adds / updates a topic entry in
  `docs/workspace/workspace-record-map.md` only when `--apply` is provided. Use
  `--keep-index-rows` only when a
  historical row must remain visible. The script protects active first-row
  plans, but completed first-row plans can be archived once a new current or
  idle status entry is ready.
- `compact-workspace-index.mjs`: dry-run by default; compacts historical rows
  from `docs/workspace/index.md` into a topic manifest under
  `docs/workspace/archive/YYYY-MM/<topic>/index.md`, and updates
  `docs/workspace/workspace-record-map.md`. Use this after moving old documents, or
  when old execution rows still clutter the current index.
- `archive-global-todo-board.mjs`: dry-run by default; moves completed global
  TODO rows and old sync records from `docs/workspace/current/global-todo-board.md` to
  `docs/workspace/archive/YYYY-MM/global-todo/`, keeping the active board small.
- `generate-archive-topic-summaries.mjs`: dry-run by default; creates or
  refreshes `index.md` summary files for the archive root, month folders, and
  every `docs/workspace/archive/YYYY-MM/<topic>/` folder, preserving historical
  body files as evidence snapshots while giving each archive folder a readable
  map.

Suggested pre-acceptance sequence:

```bash
node scripts/verify-control-center.mjs
```

Dispatch plan with TODO and task packages:

```bash
node scripts/verify-control-center.mjs --require-todo --require-task-packages
```

TODO scheduling plan check:

```bash
node scripts/check-todo-board.mjs --require
```

Task package dispatch check:

```bash
node scripts/check-task-packages.mjs --require
```

Runtime residue check:

```bash
node scripts/check-runtime-residue.mjs
node scripts/verify-control-center.mjs --with-runtime
```

Archive dry-run example:

```bash
node scripts/archive-workspace-docs.mjs --topic interface-boundary --file docs/workspace/current/example-completed-plan.md
```

Workspace archive cleanup sequence:

```bash
node scripts/archive-workspace-docs.mjs --topic example-topic --file docs/workspace/current/example-completed-plan.md --apply
node scripts/compact-workspace-index.mjs --topic example-topic --match 'example-topic|EXAMPLE' --apply
node scripts/archive-global-todo-board.mjs --apply
node scripts/generate-archive-topic-summaries.mjs --apply
```

Index-only pruning example:

```bash
node scripts/archive-workspace-docs.mjs --prune-index-only --apply
```

Real-project test scripts live under `AlembicTest/scripts/` so the workspace
root `scripts/` directory stays focused on control-center governance.
