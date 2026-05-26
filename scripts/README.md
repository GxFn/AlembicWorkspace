# Workspace Scripts

This directory stores AlembicWorkspace-owned scripts for coordination,
verification, documentation maintenance, and cross-repository guardrails.

Scripts in this directory should:

- operate from the workspace root unless documented otherwise;
- avoid secrets, tokens, local absolute paths, and network access by default;
- avoid writing into child source repositories unless a current control plan
  explicitly assigns that work;
- report clear pass/fail evidence that can be pasted into workspace docs.

Human-facing document policy:

- Users should normally read only the goal / stage confirmation document and
  the current workspace control plan with its window task packages.
- Repeated status surfaces, generated inboxes, format anchors, archive maps,
  and script verification notes should stay script-owned and short.

Script-readable document format:

- New current plans should start from
  `templates/workspace-control-plan-template.md` so `workspace-sync`, dispatch,
  TODO, task-package, prompt, test handoff, and backfill anchors are present
  before scripts run.
- Current plans that drive `sync-current-plan.mjs` may include:

```md
<!-- workspace-sync
{
  "status": "<current status>",
  "indexPlanDescription": "<index current-plan row summary>",
  "indexStatusDescription": "<index current-status row summary>",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "<current index summary>",
  "currentStatusSummary": "<first summary bullet after the current-plan link>",
  "indexRows": [],
  "currentIndexRows": []
}
-->
```

- `workspace-sync` is mechanical metadata only. It must not decide readiness,
  TODO priority, Design acceptance, window acceptance, or product scope.
- Keep `workspace-sync` after `## 回填区`, near the end of the current plan.
  `sync-current-plan.mjs` fails closed if this script metadata is placed above
  human-facing plan content.
- `currentStatusSummary` is optional; when present, `sync-current-plan.mjs`
  uses it to keep the concise status page from retaining stale mainline text.
- Keep these section names stable when scripts need to read or sync them:
  `目标判断`, `总控决策记录`, `任务包`, `TODO / Backlog`, `空闲窗口调度`,
  `窗口分派`, `可复制分派提示词` / `可复制提示词`, `测试交接`, and `回填区`.
- Current plans must include `总控决策记录` before mechanical sync or
  acceptance checks. This section records what demand / evidence triggered the
  doc update, whether the evidence answered the right question, what should be
  verified or replanned first, and which conclusions are allowed or forbidden.
- Window dispatch tables should keep the narrow form:
  `| 窗口 / 状态 | 任务 |`.
- TODO / idle scheduling tables should keep explicit ID, status, owner,
  effect on dispatch / retest, send decision, and next-step fields.
- Design handoff inboxes, test exchange docs, current indexes, archive maps,
  and compact summaries are script or evidence surfaces; keep them concise and
  link back to the human-facing current plan instead of duplicating it.

Current scripts:

- `workspace-control.mjs`: command-style aggregator for common control-center
  workflows. It maps friendly subcommands such as `status`, `verify`,
  `sync`, `dispatch`, `design`, `runtime`, `scripts`, and `pipeline` onto the
  existing workspace scripts without replacing their dry-run / write gates.
  Use `--print` to inspect the exact commands before running them.
- `visible-dispatch.mjs`: local state manager for Visible Automation Dispatch.
  It stores mode / window registry / dispatch queue / automation run metadata
  under ignored `.workspace-local/visible-dispatch/`, supports explicit
  `--write` for mode, registry, unregister, enqueue, claim, complete, tick, arm-recording,
  stop-recording, controller-return recording, blocker, and acceptance operations, prints heartbeat arm
  payloads for a Codex window to pass to Codex automation tools, records
  returned automation ids with `record-arm`, records externally paused /
  deleted automation runs with `record-stop`, marks failed dispatch attempts
  with `block`, prunes old terminal queue residue with `prune-history`, separates
  low-frequency waiting checks from total-control acceptance verdicts, and
  exposes `controller-tick` as a read-only total-control loop classifier over
  mode, queue, current plan dispatch rows, and global TODO candidates. Target
  Window thread ids are local runtime data: `register` writes them under
  ignored `.workspace-local/visible-dispatch/window-registry.json` and redacts
  them from JSON output, rejects placeholder ids such as
  `current-codex-thread`, and can remove polluted entries with `unregister`, so
  they should not be copied into tracked docs or committed to GitHub. Before
  starting an automation fan-out, use `preflight --from-plan`, `preflight
  --group <id>`, `preflight --task <id>`, or `preflight --window <name>` to
  verify that each registered target thread resolves to a local Codex session
  file; `arm`, `arm-batch`, and controller-return payload generation reuse the
  same check and refuse / skip unverified targets before any Codex automation
  API payload is used. Target `enqueue --from-plan --group <id>
  --return-policy controller-last --write` creates a dispatch group, and
  `arm-batch --group <id> --json` prints all ready target heartbeat payloads so
  total control can fan out multiple windows in one batch. Target windows can
  use `finish --window <name> --thread <id>
  --backfill <text> --write --chain-next --json` at the end of their work to
  register their current thread, complete the claimed task with evidence, and
  print the next safe wake payload for an already queued / registered window or,
  for `controller-last` groups, print no payload until the final group task
  finishes. The final target window gets a `controller-return` payload for
  `AlembicWorkspace` and must record it with `record-return --group <id>`.
  Generated heartbeat payloads use `FREQ=MINUTELY;INTERVAL=1`, reference the
  `skills/dev/visible-automation-dispatch-target/` role-guard skill, and include
  a compact claim / finish / next-arm / record-stop sequence. Target windows may
  create a next heartbeat only when finish-chain returns
  `handoffPolicy=target-courier` and `payload.courierAllowed=true`; otherwise the
  next arm is total-control-owned. In dispatch-group mode, target windows may
  create a total-control return heartbeat only when finish-chain returns
  `handoffPolicy=controller-return` and `payload.controllerReturnAllowed=true`.
  `AlembicTest` next-hop arming is total-control-owned by default so product /
  plugin windows do not process or courier test-window automation accidentally.
  Visible automation is an explicit mode: when `mode --enable --write` is in
  effect, total control may keep running the acceptance / next-TODO loop and
  target windows may use finish-chain wake payloads; when `mode --disable
  --write` is in effect, completion evidence can still be recorded but
  controller loops stop and `finish --chain-next` refuses to produce a next
  wake payload. If a target heartbeat was already armed before the close switch,
  that target may still wake once, but its finish-chain result is
  `modeDisabled` with no `chain.payload`, so the next window jump no longer
  carries automation. Mode enabled does not make ordinary user discussion,
  Design work, total-control planning, or single-window development unattended:
  only heartbeat messages and tasks explicitly queued by the current plan should
  claim / finish / chain. On macOS, `mode --enable --write` starts a local
  `caffeinate -dimsu` keep-awake process owned by
  `.workspace-local/visible-dispatch/state.json`; `mode --disable --write`
  stops the recorded process. Use `--no-keep-awake` or
  `CODEX_VAD_KEEP_AWAKE=0` only for dry test surfaces that must not start a
  keep-awake process.
  The script still does not call Codex automation APIs directly, does not
  accept evidence, does not select new TODOs, and does not write product
  repositories.
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
  explicit window / repository positioning statement. Nonstandard extra
  windows are allowed when they are not send-eligible.
- `check-decision-preflight.mjs`: verifies that the current control plan
  records `总控决策记录` before document/state changes are treated as valid.
  It requires the trigger, demand / test-result interpretation, checked
  evidence, whether verification / replanning / user confirmation should happen
  first, allowed updates, and forbidden conclusions.
- `check-test-boundary.mjs`: verifies that `AlembicTest` cannot be made
  send-eligible for verification without an active test card that records why
  total control cannot self-test, the real scenario dependency, the exact
  question under test, object / window / thread / project boundaries, success /
  failure inference limits, and stop / no-start conditions. Explicit non-test
  thread-registry or Visible Automation Dispatch smoke rows are allowed only
  when the current plan says no test handoff, no real-project validation, and
  local-only runtime evidence.
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
- `check-script-docs.mjs`: verifies that every workspace `scripts/*.mjs` file
  is represented in this README, that test scripts appear in the workspace
  script-test instructions, and that `verify-control-center.mjs` with
  `--with-script-tests` runs all `*.test.mjs` files. Use `--root <workspace>`
  for fixture / CI execution and `--json` for machine output.
- `verify-control-center.mjs`: one-command control-center verification that
  runs boundary, repo status, workspace docs, script docs, current-plan sync
  check, decision preflight, dispatch coverage, test boundary, and
  `git diff --check`. Add `--require-todo` when TODO scheduling must be
  present, `--require-task-packages` when package-based dispatch must be
  present, `--with-runtime` for a read-only runtime residue report,
  `--strict-runtime` to fail when Alembic daemon / Dashboard dev residue is
  present, or `--with-script-tests` to run workspace script unit tests.
- `sync-current-plan.mjs`: dry-run by default; reads the current plan, plus an
  optional `<!-- workspace-sync { ... } -->` JSON block, and synchronizes the
  mechanical current-control surfaces: the first current-plan/current-status
  rows and window coverage table in `docs/workspace/index.md`, the active plan
  row in `docs/workspace/current/index.md`, and the status summary /
  window-dispatch / copyable-prompt sections in
  `docs/workspace/current/workspace-current-status.md`.
  It also supports controlled `indexRows` and `currentIndexRows` in the
  sync block for extra rows that the total-control plan has already decided.
  Use `--write` to apply, `--check` to fail when generated surfaces are stale,
  `--root <workspace>` for fixture / CI execution, and `--json` for machine
  output. Writes are restricted to workspace docs, use atomic file replacement,
  and validate workspace-relative row targets. This script does not create
  TODOs, alter Design handoff status, decide window readiness, accept window
  backfills, or edit product repositories.
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
- `import-design-handoffs.mjs`: reads
  `AlembicDesign/docs/current/workspace-handoff-board.md`, validates ready
  handoff rows, and with `--write` refreshes
  `docs/workspace/current/design-handoff-inbox.md`. It does not update global
  TODOs, current plans, or dispatch windows; the control window still decides
  whether and when to accept each Design handoff. Use `--id <Design Key>` to
  focus validation on one Design entry and verify its linked docs expose the
  same `Design Key` metadata.
- `run-workspace-pipeline-e2e.mjs`: creates a temporary fixture workspace and
  runs the complete governance-script chain from Design handoff intake through
  current-plan sync, dispatch / TODO / task-package verification, simulated
  test completion, archive apply, TODO archive, archive summary generation, and
  post-archive verification. It never writes product repositories. Use `--keep`
  to retain the fixture on success and `--json` for machine output.

Suggested pre-acceptance sequence:

```bash
node scripts/workspace-control.mjs verify
node scripts/verify-control-center.mjs
```

Dispatch plan with TODO and task packages:

```bash
node scripts/workspace-control.mjs verify --dispatch
node scripts/verify-control-center.mjs --require-todo --require-task-packages
```

Sync current plan metadata into repeated entry documents:

```bash
node scripts/workspace-control.mjs sync --write --verify --dispatch
node scripts/sync-current-plan.mjs --check
node scripts/sync-current-plan.mjs --write
node scripts/verify-control-center.mjs --require-todo --require-task-packages
```

Workspace script tests:

```bash
node scripts/check-script-docs.mjs
node --test scripts/check-decision-preflight.test.mjs scripts/check-dispatch-coverage.test.mjs scripts/check-script-docs.test.mjs scripts/check-test-boundary.test.mjs scripts/sync-current-plan.test.mjs scripts/visible-dispatch.test.mjs scripts/workspace-control.test.mjs
node scripts/workspace-control.mjs scripts --tests
node scripts/verify-control-center.mjs --with-script-tests
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
node scripts/workspace-control.mjs runtime
node scripts/check-runtime-residue.mjs
node scripts/verify-control-center.mjs --with-runtime
```

Design handoff inbox refresh:

```bash
node scripts/workspace-control.mjs design --write
node scripts/import-design-handoffs.mjs --write
node scripts/import-design-handoffs.mjs --id ARTIFACT-DRAWER-2026-05-25 --json
```

Full governance pipeline fixture:

```bash
node scripts/workspace-control.mjs pipeline
node scripts/run-workspace-pipeline-e2e.mjs
node scripts/run-workspace-pipeline-e2e.mjs --keep --json
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
