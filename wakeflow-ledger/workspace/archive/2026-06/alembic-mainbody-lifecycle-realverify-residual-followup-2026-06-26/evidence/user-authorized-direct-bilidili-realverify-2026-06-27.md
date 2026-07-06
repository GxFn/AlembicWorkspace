# User-Authorized Direct BiliDili Realverify Boundary

## Decision

On 2026-06-27, after the Test package `verify-test-bilidili-mainbody-realverify-p1` was blocked by the confirmed `better-sqlite3 .backup()` sandbox precondition, the user authorized a revised verification boundary:

> BiliDili is itself the test project; continue the real verification directly against the BiliDili project without sandbox backup.

## Scope Change

The previous CG-1 boundary required a `better-sqlite3 .backup()` copy of the true BiliDili workspace DB into an `ALEMBIC_HOME` sandbox. That boundary is superseded for the follow-up verification only.

The next Test package may:

- run against `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`;
- use the BiliDili Alembic project data root directly;
- clean old BiliDili test/generated Alembic data as needed for a fresh true-run;
- run the true coldStart -> deepMining -> coverage-ledger gate -> moduleMining -> evolution -> anti-fabrication rejection verification chain on the BiliDili test project.

## Preserved Constraints

- BiliDili source code must not be edited by Test.
- No push, release, version bump, or product source mutation is authorized.
- Anti-fabrication, quality floor, coverage-ledger, and lifecycle gates remain strict.
- Acceptance still requires fresh true DB SQL/log/runtime evidence from the seven-step chain.
- Baseline rows in the existing DB are not completion evidence for the accepted FIX wave.
