# Controller Review: P1b Core Managed Block + PathGuard

Date: 2026-07-07

## Scope

- State root: `.wakeflow-active/current/alembic-proactive-activation-2026-07-03`
- Dispatch group: `p1b-core-managed-block-pathguard-p1`
- Target task: `p1b-core-managed-block-pathguard-t1`
- Target window: AlembicCore

## Requirement Authority

Design `Design/docs/current/alembic-proactive-activation-2026-07-03.md` §10.5 requires:

- Core managed-block utility for host context guidance blocks.
- Begin/end markers with idempotent upsert/remove.
- No writes outside the managed marker span.
- `PathGuard` root-file allowlist hook for host files such as `CLAUDE.md` / `AGENTS.md`.
- No Plugin wiring or `refreshKnowledgeSkills` work in this Core producer task.

## Raw Evidence Reviewed

- Target result: `target-results/tr-p1b-core-managed-block-pathguard-t1.json`
- Target evidence: `evidence/p1b-core-managed-block-pathguard-t1.md`
- AlembicCore commit: `783b9f52aaa83767f4564ac8489cdfaf445bab35`
- Changed files:
  - `src/io.ts`
  - `src/shared/AlembicManagedBlock.ts`
  - `src/shared/PathGuard.ts`
  - `test/AlembicManagedBlock.test.ts`
  - `test/PathGuard.test.ts`
  - `test/PublicFoundationEntrypoints.test.ts`

## Controller Verification

Controller independently reviewed the implementation and ran:

- `npm run build:check` — passed.
- `npx vitest run test/AlembicManagedBlock.test.ts test/PathGuard.test.ts test/PublicFoundationEntrypoints.test.ts` — passed, 3 files / 61 tests.
- `npm run lint:public-api-boundary` — passed, public API boundary unchanged within classified exports.
- `git diff --check HEAD~1..HEAD` — passed.
- `git show --check --format=short 783b9f52aaa83767f4564ac8489cdfaf445bab35` — passed.

## Controller Judgment

The Core task matches the assigned producer scope:

- `@alembic/core/io` exposes the managed block helper and marker constants.
- Text helpers replace/remove only the marker pair and enclosed body.
- File helpers call `pathGuard.assertProjectWriteSafe` before actual writes.
- `PathGuard.addProjectWritableFile` only accepts project-root file names and rejects nested paths.
- Existing root-file protection remains intact: unrelated root files still throw unless explicitly allowlisted.
- No AlembicPlugin or Alembic main wiring was included in this Core task.

Residual consumer contract is explicit: Plugin/main must choose the host file, call `pathGuard.addProjectWritableFile(...)`, preserve ghost/no-KB gating, and surface malformed-marker errors as repairable host guidance conflicts.

Decision: accept target result.
