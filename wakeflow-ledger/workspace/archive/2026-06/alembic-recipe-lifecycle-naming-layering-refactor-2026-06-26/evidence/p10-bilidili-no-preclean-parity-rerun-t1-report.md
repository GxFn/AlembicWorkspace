# P10 BiliDili No-Preclean Parity Rerun

Task: `p10-bilidili-no-preclean-parity-rerun-t1`
Dispatch group: `p10-bilidili-no-preclean-parity-rerun-p1`
Window: Test
Status: blocked

## Result

The no-preclean rerun stayed inside the BiliDili boundary, but the P10 parity
gate did not pass. Test reused the already-running BiliDili daemon at
`http://127.0.0.1:63477`; no restart was attempted, so the default preclean path
was not invoked. The current Alembic MCP status route still returned
`Transport closed`; Test did not repair, reload, stop, or clean the MCP/runtime.

The Dashboard/daemon host route did not produce usable coverage:

- bounded probe job: `bootstrap_mqxiy51y_b669e32c`
- probe duration: `180481` ms
- probe classification: `producer-gap`
- job status at probe timeout: `running`
- final action: cancelled only this probe job with reason
  `p10-bilidili-no-preclean-parity-rerun-t1 host probe exceeded bounded window`
- final job status: `cancelled`

Because the host route produced no non-empty target-scoped coverage and no
`coverageLedgerSeed`, Test did not run the in-process moduleScope route or a
host-vs-in-process parity diff. This avoids manufacturing a 0-vs-0 parity pass.

## Baseline Evidence

`verify-test-environment.mjs --url http://127.0.0.1:63477 --json` returned
`ok=true`, `verdict=ready`, `processAlive=true`, and pointed to:

- projectRoot: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- dataRoot: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- daemon PID: `12245`
- test mode: enabled, bootstrap/rescan dimensions `["architecture"]`

Runtime DB before the host probe:

- `PRAGMA integrity_check`: `ok`
- `coverage_ledger`: `0`
- `deep_mining_rounds`: `0`
- open rounds: `0`
- active BiliDili sessions: `1`

Provider/source evidence:

- Alembic `af4d976c29fee58a93f05de8bfc334073575b46d`
- AlembicPlugin `aee228be0082e8ddb1d4494df07e0ffedc6ea292`
- AlembicCore `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- BiliDili `6f1bf34cf1b6daca4e08895db211939115dac868`
- all four worktrees clean
- generation provider: `deepseek/deepseek-v4-pro`
- embedding provider: local Ollama `qwen3-embedding:0.6b`, local-first

## Host Route Evidence

Command:

```bash
node Test/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:63477 --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 --max-files 4 --content-max-lines 40 --skip-guard --timeout-ms 180000 --poll-ms 2500 --output Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-cold-start-process-timeline.json
```

The probe saw daemon health, event APIs, socket notifications, and LLM events,
but the job stayed `running` at the probe timeout. Monitor snapshots after the
timeout still showed:

- status: `running`, active task `architecture`, active status `filling`
- `coverage_ledger`: `0`
- target-scoped coverage rows: `0`
- `coverageLedgerSeed`: absent
- open rounds: `0`
- active BiliDili sessions: `1`

Test cancelled only the timed-out probe job through
`POST /api/v1/jobs/bootstrap_mqxiy51y_b669e32c/cancel`. After cancellation:

- job status: `cancelled`
- daemon health: healthy
- DB integrity: `ok`
- `coverage_ledger`: `0`
- `deep_mining_rounds`: `0`
- open rounds: `0`
- active BiliDili sessions: `1`

## Boundary

No BiliDili, Alembic, AlembicPlugin, or AlembicCore source files were edited.
No provider config, package version, DB row, or session file was manually
changed. No default preclean was run, no non-BiliDili Ghost roots were cleaned,
and no MCP reload/repair was attempted from Test.

## Raw Evidence

- `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/baseline.json`
- `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-cold-start-command.json`
- `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-cold-start-process-timeline.json`
- `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/after-host-probe-readback.json`
- `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-probe-monitor-1.json`
- `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/host-probe-monitor-2.json`
- `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/cancel-host-probe-job.json`
- `Test/tmp/p10-bilidili-no-preclean-parity-rerun-t1/p10-no-preclean-evidence.mjs`
- `evidence/p10-bilidili-no-preclean-parity-rerun-t1-summary.json`

## Recommendation

Return this task to the controller as blocked. The host route/session completion
path needs repair or a controller-authorized cleanup/retry strategy before Test
can proceed to in-process moduleScope parity. Test should not manually edit
DB/session/provider/source state to create a pass.
