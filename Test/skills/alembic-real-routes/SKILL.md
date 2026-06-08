---
name: alembic-real-routes
description: Use when Test needs to run or monitor reusable Alembic test routes: environment readiness, BiliDili/AlembicWorkspace cold-start, resident service, multi-root ProjectScope, or explicitly assigned Codex Plugin / host MCP evidence. Follow verified routes and collect evidence instead of inventing new paths.
---

# Test Real Routes

Use this skill after reading `Test/AGENTS.md` and the current state-root test card / control test document. It contains command routes and evidence checklists; `AGENTS.md` remains the authority for boundaries and stop cards.

Internet research may help discover candidate practices or tool details, but do
not treat it as proof that a Test route works. Promote a route only after local
commands, API responses, logs, Dashboard evidence, reports, or probe output
validate it.

First classify the current route:

- Codex Plugin / host MCP / environment probe evidence.
- BiliDili real-project cold-start / rescan / after-run / AI route.
- AlembicWorkspace or another protected real-project route.
- Multi-root ProjectScope route.
- Environment readiness only.

If the requested route is not assigned by the user, state root, test card, or
controller document, stop and ask total control to assign Test explicitly.

## Route Selection

- Codex Plugin route: host MCP, local environment, installed / packaged
  runtime smoke, or IDE / direct-thread readback evidence. It is evidence only;
  Plugin reload and current host MCP repair belong to `AlembicPlugin`.
- `BiliDili`: open-source real test project. If the current user request, state-root test card, or automation dispatch assigns Test to run BiliDili cold-start / rescan / after-run, use the automatic test-mode route.
- `AlembicWorkspace` or protected targets: start Alembic, open Dashboard, start passive monitoring, then wait for the developer to click cold-start / rescan unless the test document explicitly authorizes automatic context sending.
- Multi-root ProjectScope route: use `probe-multi-root-project-scope.mjs` only
  when the question is ProjectScope binding, folder resolution, or ghost
  storage behavior.
- Dashboard/front-end checks: use Codex in-app browser first. If the Browser tool is unavailable and UI evidence is required, pause with the exact URL instead of pretending the page was observed.

## Environment Readiness Route

Use this route when the task is only to make the Alembic test environment available and stable, or before any cold-start / after-run probe.

1. Start or restart with `restart-alembic.mjs` only if no suitable daemon is already running or the target/test mode is wrong.
2. Run the deterministic environment check:

```bash
node Test/scripts/verify-test-environment.mjs --project BiliDili --json
node Test/scripts/verify-test-environment.mjs --url <dashboardUrl> --json
```

3. Treat `ok=true` / `verdict=ready` as the environment baseline: daemon health is good, test mode is enabled when expected, URL/dataRoot are resolved, and compact jobs API responds.
4. If the verdict is `codex-localhost-sandbox-blocked`, do not call the daemon broken. Rerun the same script with escalated Codex permissions, or use direct `curl` snapshots:

```bash
curl -sS --max-time 10 <dashboardUrl>/api/v1/health
curl -sS --max-time 10 <dashboardUrl>/api/v1/modules/test-mode
curl -sS --max-time 10 '<dashboardUrl>/api/v1/jobs?kind=bootstrap&limit=1&compact=true'
```

5. If the environment is ready and the user did not ask Test to run the cold-start chain, stop there and report the ready URL/pid/test-mode state.

## Test Codex MCP Reload Boundary

`Test` can verify Codex MCP behavior when assigned, but it does not
own Plugin reload or current host MCP repair. `Test` must not use this
route for real-project cold-start / rescan work.

- `npm run dev:codex-plugin:reload` belongs to AlembicPlugin. Its safe default
  refreshes the installed plugin projection and runs a fresh MCP probe; it does
  not live-reload the current Codex host MCP process already attached to the
  running Codex session.
- Use MCP probes only for evidence collection requested by the
  current test order:

```bash
node Test/scripts/probe-codex-prime.mjs --project <target>
node Test/scripts/probe-resident-vector-search.mjs --project <target>
node Test/scripts/probe-unified-resident-service.mjs --phase baseline
node Test/scripts/probe-unified-resident-service.mjs --phase resident
node Test/scripts/probe-multi-root-project-scope.mjs --help
```

- If the current Codex host tool returns `Transport closed`, do not repair it by
  running Plugin reload with `--stop-mcp` from Test. First distinguish
  fresh MCP startup evidence from the current host session; current-session
  refresh requires AlembicPlugin projection work plus a Codex restart/refresh.
- `--stop-mcp` and watch `--restart-mcp` are forbidden in Test unless the
  active state-root test card explicitly asks to validate that destructive path
  and accepts that the current Codex session will lose Alembic MCP until Codex
  restarts.

## BiliDili Test-Mode Cold-Start / After-Run Route

Verified non-destructive checks on 2026-05-30:

- `restart-alembic.mjs --help` exposes the needed restart flags.
- `probe-cold-start-process-timeline.mjs --help` exposes `--max-files`, `--content-max-lines`, `--skip-guard`, `--url`, `--data-root`, and `--output`.
- A test-mode BiliDili daemon responded healthy at `/api/v1/health`.
- `/api/v1/modules/test-mode` returned `enabled=true` with `bootstrapDims=["architecture"]` and `rescanDims=["architecture"]`.

Default command shape:

```bash
ALEMBIC_TEST_MODE=1 \
ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture \
ALEMBIC_TEST_RESCAN_DIMS=architecture \
node Test/scripts/restart-alembic.mjs \
  --project BiliDili \
  --json \
  --wait 20000 \
  --no-dev-link
```

If preclean already killed the old daemon but the restart script reports preclean failure, first confirm the old pid stopped, then rerun the same environment with `--no-preclean`. Do not change dimensions or disable test mode during the rerun.

After restart, verify before triggering a job:

```bash
node Test/scripts/verify-test-environment.mjs --url <dashboardUrl> --json
curl -sS --max-time 10 <dashboardUrl>/api/v1/health
curl -sS --max-time 10 <dashboardUrl>/api/v1/modules/test-mode
curl -sS --max-time 10 '<dashboardUrl>/api/v1/jobs?kind=bootstrap&limit=1&compact=true'
```

Open the new Dashboard URL in the Codex in-app browser. For visible testing, prefer the most specific page: `jobs?job=<jobId>` > `jobs` > `candidates` > `recipes`.

Trigger and collect evidence with the probe, not a bare bootstrap POST:

```bash
node Test/scripts/probe-cold-start-process-timeline.mjs \
  --project BiliDili \
  --url <dashboardUrl> \
  --data-root <dataRoot> \
  --max-files 4 \
  --content-max-lines 40 \
  --skip-guard \
  --timeout-ms 180000 \
  --poll-ms 2500 \
  --output Test/tmp/<task-id>-cold-start.json
```

Use a larger sample only when the current test document explicitly asks for it. If a full run starts by mistake, cancel it, record the cancellation evidence, and rerun the bounded route.

## Protected Project Manual Route

1. Start Alembic in test mode when the plan allows it.
2. Verify health and test-mode state.
3. Open Dashboard in the Codex in-app browser.
4. Start direct `curl` snapshots for health, compact job list, job events, report/artifact APIs, and logs.
5. Tell the developer exactly which button to click.
6. After the click, record the job id, session id, Dashboard URL, API snapshots, report path, and log signals.

Never use BiliDili's open-source rule to justify sending protected project context automatically.

## Monitoring Route

- Use direct `curl` snapshots as the primary monitoring path.
- Quote URLs with `?` to avoid shell globbing.
- Avoid `sleep 30; curl ...; node read-file` chains; one failed command can manufacture misleading follow-up errors.
- Avoid Node `fetch` or Node child-process `curl` as the primary localhost monitor inside Codex unless the command is running with appropriate permissions; ordinary sandbox runs may fail with EPERM even when direct `curl` or an escalated script succeeds.
- On a single API disconnect, immediately check health, pid/state, logs, and persisted job files. Continue only if daemon health or pid/log evidence shows the service is still alive.
- If a monitor wrapper fails, stop only that monitor after verifying its pid/command; do not kill the Alembic daemon or a developer-triggered job.

## Restart Troubleshooting

- If `restart-alembic.mjs` preclean already killed the old daemon but reports failure because cleanup escalated to SIGKILL, first verify the old pid/state is gone. Then rerun the same target/test-mode/AI config with `--no-preclean`. Do not call this product failure unless the old process remains alive, runtime state is unwritable, or log cleanup damaged the test boundary.
- If test mode looks disabled, inspect the raw `/api/v1/modules/test-mode` response before concluding environment drift. Some endpoints wrap values under `data`.
- If `verify-test-environment.mjs` reports `daemon-connection-refused`, check `daemon.json`, pid, `ps`, and `.asd/logs/` before restarting.
- If a full run or wrong-parameter job starts accidentally, cancel only that job with evidence, then rerun the bounded route. Do not let an out-of-bound job become the test conclusion.

## Evidence Checklist

Every real-project report or backfill should include:

- target project and why it is allowed for this route;
- command route and key parameters;
- Dashboard URL and whether it was opened in Codex in-app browser;
- job id / session id when a job runs;
- health, test-mode, jobs/events/report/log evidence;
- provider/model and AI config source, with secret presence only;
- source commit and runtime linkage when the current test card asks for them;
- real project git status before/after when relevant;
- clear boundary: what passed, what failed, what cannot be concluded.
