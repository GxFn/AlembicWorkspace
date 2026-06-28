# P10 BiliDili Project-Index Workflow-Unify Rerun After Data-Root SQLite Repair

## Result

- Status: blocked
- Window: Test
- Task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-data-root-sqlite-repair-t1`
- Classification: execution-boundary blocker before official rebuild/parity.
- Route: real BiliDili workspace only; no product source edits; no bootstrap/rescan/parity was triggered after the boundary violation.

## What Was Verified

- Source pins matched the test card lower bounds:
  - Alembic: `af4d976c29fee58a93f05de8bfc334073575b46d`
  - AlembicPlugin: `aee228be0082e8ddb1d4494df07e0ffedc6ea292`
  - AlembicCore: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
  - BiliDili: `6f1bf34cf1b6daca4e08895db211939115dac868`
- Git status for all four repositories was clean.
- Provider setup remained the BiliDili target-project config: DeepSeek generation (`deepseek-v4-pro`) with local Qwen/Ollama embedding config already present in the Ghost workspace.
- Controller repair evidence was present: corrupt `alembic.db`, `alembic.db-wal`, and `alembic.db-shm` were quarantined under `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/.trash/p10-corrupt-db-quarantine-20260628T075655Z`.
- Before daemon restart, the repaired runtime DB path existed, `PRAGMA integrity_check` returned `ok`, and `.tables` was empty, matching the controller note that Ghost initialization left the workspace initialized but empty.

## Blocking Events

1. The current Codex Alembic MCP tool surface returned `Transport closed` for `alembic_status(projectRoot=BiliDili)`.
   - Test rules forbid repairing the current Codex host MCP session by Plugin reload or `--stop-mcp`.
   - This means the host `alembic_bootstrap({ rebuild: true })` route could not be executed through the current host MCP session.
2. `node Test/scripts/verify-test-environment.mjs --project BiliDili --json` reported `dashboard-url-unresolved`, so there was no ready Dashboard/daemon URL.
3. I started the BiliDili test-mode daemon with:

   ```bash
   ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture node Test/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --no-dev-link
   ```

   The daemon started successfully at `http://127.0.0.1:63477`, but the script's default preclean also cleaned log paths under non-BiliDili Ghost roots:
   - `/Users/gaoxuefeng/.asd/workspaces/13b22158/.asd/logs`
   - `/Users/gaoxuefeng/.asd/workspaces/278cdc6c/.asd/logs`
   - `/Users/gaoxuefeng/.asd/workspaces/ecf32806/.asd/logs`

   This violates the test card forbidden operation: do not touch `~/.asd` outside the BiliDili data root. I stopped immediately after read-only evidence collection and did not run official rebuild, host rescan, in-process rescan, noPadding, or parity.

## Read-Only Post-Stop Evidence

- Health: `GET /api/v1/health` returned `success=true`, `status=healthy`, `version=2.0.0`.
- Test mode: `GET /api/v1/modules/test-mode` returned `enabled=true`, `bootstrapDims=["architecture"]`, `rescanDims=["architecture"]`.
- Current daemon PID: `12245`, command `Alembic/dist/bin/daemon-server.js`.
- Runtime DB after daemon startup:
  - `PRAGMA integrity_check` returned `ok`.
  - Schema tables were present after daemon migration/startup, including `knowledge_entries`, `coverage_ledger`, `deep_mining_rounds`, source graph tables, and `schema_migrations`.
- Old active session file still contained the incomplete BiliDili session `bs-<redacted>`; this was not manually edited.
- The recent jobs endpoint showed only older historical jobs at the top of the persisted store; no new bootstrap/rescan job was intentionally triggered after this task's boundary stop.

## Boundary And Recommendation

- No BiliDili, Alembic, AlembicPlugin, or AlembicCore source code changed.
- No manual DB row/session/provider/package/source mutation was performed.
- Because the Test route touched non-BiliDili Ghost log roots during restart preclean, this run is not acceptable P10/G4/G6 evidence.
- Because current host Alembic MCP is `Transport closed`, the required host `alembic_bootstrap({ rebuild: true })` route remains unrun in this Codex session.
- Recommended controller action: treat this target as blocked, decide whether to repair/refresh the current Alembic MCP host surface through the owning AlembicPlugin path, and if rerunning Test, require a no-preclean/no-cross-root restart route such as `--no-preclean` or explicit BiliDili-only cleanup before any official rebuild/parity attempt.
