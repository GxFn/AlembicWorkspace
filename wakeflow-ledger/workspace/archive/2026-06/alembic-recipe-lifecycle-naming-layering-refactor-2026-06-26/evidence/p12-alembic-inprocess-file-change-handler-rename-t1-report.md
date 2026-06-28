# P12 Alembic In-Process File-Change Handler Rename

Target task: `p12-alembic-inprocess-file-change-handler-rename-t1`
Dispatch group: `p12-alembic-inprocess-file-change-handler-rename-p1`
Target window: `Alembic`
Status: completed

## Commit

- Alembic commit: `91a254901ab5a7367d9965d9ab5be9fdbd4595e1`
- Commit message: `refactor: rename in-process file change handler`
- Starting point confirmed before edits: `51b2e38828b8011a14fb89459f7b52d56b73fcca`
- Repository state after commit: `main...origin/main [ahead 1]`, clean worktree.

## Changed Files

- `lib/service/evolution/InProcessFileChangeHandler.ts`
- `lib/service/evolution/FileChangeHandler.ts`
- `lib/injection/modules/KnowledgeModule.ts`
- `lib/http/routes/file-changes.ts`
- `lib/service/evolution/DaemonFileChangeCollector.ts`
- `lib/service/evolution/EvolutionMaintenanceSweep.ts`
- `test/unit/InProcessFileChangeHandler.test.ts`
- `test/unit/FileChangesRoute.test.ts`
- `test/unit/ProposalExecutor.test.ts`

## Implementation Evidence

- Added `InProcessFileChangeHandler` as the in-process daemon-reactive handler class and moved the implementation into `lib/service/evolution/InProcessFileChangeHandler.ts`.
- Kept `lib/service/evolution/FileChangeHandler.ts` as an R1 compatibility shim:
  - exports `InProcessFileChangeHandler`
  - exports `InProcessFileChangeHandler as FileChangeHandler`
- Updated real Alembic consumers to import and instantiate `InProcessFileChangeHandler` directly:
  - `lib/injection/modules/KnowledgeModule.ts`
  - `test/unit/FileChangesRoute.test.ts`
  - `test/unit/InProcessFileChangeHandler.test.ts`
- Updated non-contractual implementation diagnostics and comments from `FileChangeHandler` to `InProcessFileChangeHandler`.
- Preserved frozen runtime literals and behavior:
  - `/api/v1/file-changes`
  - `source: 'file-change'`
  - `producerKind: 'alembic-file-monitor'`
  - lifecycle values and coverage/deep_mining schemas were not touched.
- Did not touch AlembicCore, AlembicPlugin, AlembicAgent, Test, BiliDili, vendor, package version, release assets, provider config, thread ids, Core `RecipeSimilarity`, or consolidation symbols.

## Grep Evidence

`rg -n "\\bFileChangeHandler\\b|\\bInProcessFileChangeHandler\\b" lib test -S`

- Real source imports now use `InProcessFileChangeHandler`.
- Remaining `FileChangeHandler` references are intentionally limited to:
  - the R1 shim export in `lib/service/evolution/FileChangeHandler.ts`
  - the compatibility assertion in `test/unit/InProcessFileChangeHandler.test.ts`
  - explanatory shim text.

`rg -n "source: 'file-change'|'/api/v1/file-changes'|producerKind: 'alembic-file-monitor'" ...`

- `source: 'file-change'` remains in handler submit paths and focused assertions.
- `/api/v1/file-changes` remains in route tests.
- `producerKind: 'alembic-file-monitor'` remains in rename/delete/modified proposal evidence.

## Characterization

Focused unit tests passed:

`npx vitest run --config vitest.unit.config.ts test/unit/InProcessFileChangeHandler.test.ts test/unit/FileChangesRoute.test.ts test/unit/ProposalExecutor.test.ts test/unit/EvolutionGateway.test.ts`

- PASS: 4 files, 57 tests.
- Handler behavior covered:
  - rename with source ref -> update proposal and no automatic sourceRef/content patch
  - rename no-hit -> skipped/no proposal
  - delete last source ref -> deprecate proposal
  - delete with remaining active refs -> stale/skip
  - modified pattern -> update proposal and review signal
  - modified reference -> signal/no proposal
  - modified no diff -> skipped
  - created -> skipped/no proposal
  - ignored `.git`/`.asd`/`node_modules` paths -> skipped
  - `FileChangeHandler` named import remains the same class as `InProcessFileChangeHandler`
- Route behavior covered:
  - `/api/v1/file-changes` dispatches valid file-change events to the handler
  - unsafe paths are rejected
  - dispatcher failures return typed failure
  - daemon native watcher events create reviewable proposals
- Evolution proposal behavior covered:
  - `source: 'file-change'` update/deprecate proposal paths still route through `EvolutionGateway`
  - signal-driven deprecate rejection remains keyed by `source_modified`/impact metadata.

## Required Validation

- `npm run build:check`
  - PASS.
- `npm run lint:repo-boundary`
  - PASS.
  - Output included repository boundary check passed and escape-hatch count `1 / 75`.
- `git diff --check`
  - PASS.
- `git diff --cached --check`
  - PASS before commit.
- `git diff HEAD^ HEAD --check`
  - PASS after commit.

## Alembic Tooling

- `alembic_status` confirmed the Alembic project root is trusted but local knowledge is initialized-empty and selected/active project alignment is mismatched, so MCP knowledge was not used as acceptance evidence.
- `alembic_work` failed with internal MCP schema error `unrecognized key "data"`.
- `alembic_code_guard` failed with the same internal MCP schema error.
- Repository checks, raw grep evidence, and focused tests are the validation evidence for this target.

## Residual Risks

- This is Alembic source evidence only. It does not accept P12, G4, G6, P13, or whole-demand completion.
- AlembicPlugin has a parallel P12 host-agent handler package; controller should review both sides before P12 REAL-TEST.
- P12 REAL-TEST is still required to prove dual-host evolution parity in real BiliDili runtime.

## Readiness

Alembic side is ready for P12 REAL-TEST after controller review and after the parallel AlembicPlugin P12 package is also available.
