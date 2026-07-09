# AlembicCore Target Evidence: p1b-core-managed-block-pathguard-t1

## Result

Implemented the Core side of WS-5 for managed host guidance blocks and guarded
project-root host context file writes.

Commit:

- `783b9f52aaa83767f4564ac8489cdfaf445bab35` (`feat(io): add managed guidance block guard`)

Changed files:

- `src/io.ts`
- `src/shared/AlembicManagedBlock.ts`
- `src/shared/PathGuard.ts`
- `test/AlembicManagedBlock.test.ts`
- `test/PathGuard.test.ts`
- `test/PublicFoundationEntrypoints.test.ts`

## Implementation Notes

- Added `ALEMBIC_MANAGED_GUIDANCE_BEGIN` / `ALEMBIC_MANAGED_GUIDANCE_END` marker constants.
- Added text helpers:
  - `upsertAlembicManagedBlockText(content, body)`
  - `removeAlembicManagedBlockText(content)`
- Added file helpers:
  - `upsertAlembicManagedBlock(filePath, body)`
  - `removeAlembicManagedBlock(filePath)`
- File helpers write only when content changes and call `pathGuard.assertProjectWriteSafe(filePath)` before writing.
- Added `pathGuard.addProjectWritableFile(fileName)` for runtime, project-root-only writable-file allowlisting.
- Exposed the managed block helpers through the stable `@alembic/core/io` facade.
- Did not edit AlembicPlugin or the Alembic main repository.
- Did not wire `refreshKnowledgeSkills`.

## Coverage

Unit coverage added for:

- idempotent managed block upsert
- replacement without touching surrounding bytes
- append when markers are absent
- remove no-op when markers are absent
- remove preserving surrounding bytes
- malformed marker handling:
  - missing end marker
  - duplicate/nested begin marker
  - end marker before begin marker
- PathGuard root file behavior:
  - unrelated root files are still rejected
  - only explicitly added project-root file names are allowed
  - nested file names are rejected by `addProjectWritableFile`
- File helper behavior:
  - write blocked before allowlist
  - write succeeds after allowlist
  - idempotent second write does not rewrite
  - remove absent file is no-op and creates nothing

## Validation

Passed:

- `npm run build:check`
- `npx vitest run test/AlembicManagedBlock.test.ts test/PathGuard.test.ts test/PublicFoundationEntrypoints.test.ts`
- `npm run lint:public-api-boundary`
- `npm run lint`
- `git diff --check`
- `npm run build`
- `npm run test` (167 files passed; 1586 passed, 2 skipped)
- `npm run check`
- `alembic_code_guard` on 6 explicit changed files: passed, 0 violations (`guard-public-mrad720q-1`)

Validation note:

- An earlier `npm run test` was started concurrently with `npm run build`; the build clean step removed `dist/index.js` while `EntrypointEffects.test.ts` was importing it. This was an operator ordering issue, not a product failure. Re-running `npm run test` after build passed.

## Risks

- The file helpers intentionally preserve bytes outside marker bounds exactly. If a host wants extra blank-line cleanup around removed blocks, it should do that outside this Core primitive with explicit consumer tests.
- Malformed marker pairs throw `AlembicManagedBlockError`; Plugin should surface this as a repairable host guidance file conflict rather than silently rewriting user files.

## Next Consumer Contract For Plugin

- Import from `@alembic/core/io`.
- Before writing a project-root host guidance file, call:
  - `pathGuard.addProjectWritableFile('CLAUDE.md')`, or
  - `pathGuard.addProjectWritableFile('AGENTS.md')`
- Then call `upsertAlembicManagedBlock(filePath, body)` or `removeAlembicManagedBlock(filePath)`.
- Keep the P1b host-mode gate in Plugin: no project-root writing in ghost mode, and no Core-side `refreshKnowledgeSkills` wiring in this task.
