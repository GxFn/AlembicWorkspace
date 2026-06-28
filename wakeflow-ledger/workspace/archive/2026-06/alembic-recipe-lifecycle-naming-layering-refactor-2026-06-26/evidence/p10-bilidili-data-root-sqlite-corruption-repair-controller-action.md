# P10 Controller Action: BiliDili Data-Root SQLite Corruption Repair

Action time: 2026-06-28T07:56:55Z to 2026-06-28T07:59:01Z

User authorization: the user instructed the controller to handle the BiliDili data-root SQLite corruption first, then continue.

## Boundary

- Project root confirmed: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- Alembic project id confirmed by `alembic_status`: `02a25032`
- Data root confirmed by `alembic_status`: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- Files touched:
  - `.asd/alembic.db`
  - `.asd/alembic.db-wal`
  - `.asd/alembic.db-shm`
- Files copied for evidence only:
  - `.asd/bootstrap-sessions/active-sessions.json`
- No BiliDili source files, provider config, package versions, or other `~/.asd/workspaces/*` roots were edited.

## Evidence Before Repair

- `sqlite3 .../.asd/alembic.db 'PRAGMA integrity_check;'` returned malformed database evidence, including:
  - `Tree 4 page 4 cell 0: Rowid 3 out of order`
  - multiple unused pages
  - wrong/missing entries in `knowledge_entries` indexes
- `lsof` initially showed Alembic Node processes holding the DB/wal/shm files:
  - `AlembicPlugin/dist/bin/host-mcp.js`
  - `Alembic/dist/bin/daemon-server.js`
- After `TERM` to those Alembic processes, `lsof` showed no remaining holder for the DB/wal/shm files.

## Repair Performed

Quarantine directory:

`/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/.trash/p10-corrupt-db-quarantine-20260628T075655Z`

Steps:

1. Created a timestamped quarantine under the BiliDili data root.
2. Copied DB/wal/shm files and the active-session file into `evidence-copy/`.
3. Captured `integrity-check.before.txt` and sha256/size metadata for copied evidence.
4. Moved the runtime DB/wal/shm files out of `.asd/` into `runtime-removed/`.
5. Verified `.asd/` no longer contained `alembic.db*`.
6. Ran `alembic_init` for the BiliDili project to restore Ghost workspace initialization.

## Post-Repair State

- `alembic_status` now reports the workspace initialized but empty: `initialized_empty`, `databaseExists=true`, `databaseEntryCount=0`.
- `sqlite3 .../.asd/alembic.db 'PRAGMA integrity_check;'` returns `ok`.
- The runtime DB is no longer the malformed pre-repair DB. The prior corrupt files are preserved under the quarantine directory.
- The old active-session file was not manually removed. This keeps the next verification honest: Alembic `rebuild:true` must clear/replace stale sessions through the repaired source path, or Test should report that as a remaining blocker.

## Remaining Gate

This repairs the SQLite corruption blocker only. It does not prove P10 host/in-process parity, G4 coverage, G6 readiness, or final demand completion.

Next action: dispatch Test to rerun the real BiliDili P10 project-index workflow-unify verification from the repaired data-root state. Required pass remains non-empty target-scoped host/in-process coverage with empty diff, no aggregate/root module ids, coverageLedgerSeed present, and no stale active session/open round after completion.
