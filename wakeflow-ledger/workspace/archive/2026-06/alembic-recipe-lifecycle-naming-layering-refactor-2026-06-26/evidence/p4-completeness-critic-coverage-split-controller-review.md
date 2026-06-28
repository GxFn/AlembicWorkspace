# P4 CompletenessCritic Coverage Split Controller Review

Date: 2026-06-28
Controller window: AlembicWorkspace
Dispatch group: p4-completeness-critic-coverage-split-p1
Target task: p4-completeness-critic-coverage-split-t1
Target window: AlembicCore

## Reviewed Target Result

- Target result envelope: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p4-completeness-critic-coverage-split-t1.json`
- AlembicCore commit reviewed: `4695c929d70701cf0025d176e7ca51b42e800073`
- Alembic vendor re-pin commit reviewed: `1196353f83b876dcc6503c5e37af9d6a3ebbd34b`
- AlembicPlugin vendor re-pin commit reviewed: `b9be06285dc77c027687c7d086eaf62ee90523a3`

## Code Evidence

AlembicCore `git show --stat --name-status --oneline HEAD`:

```text
4695c92 Split coverage ledger builder from completeness critic
M	.gitignore
A	src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts
A	src/workflows/capabilities/coverage/shared/coveragePathMatching.ts
M	src/workflows/capabilities/host-agent/CompletenessCritic.ts
M	src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts
M	src/workflows/capabilities/host-agent/index.ts
M	test/unit/BuildCoverageLedger.test.ts
```

Controller interpretation:

- `buildCoverageLedger` and the coverage ledger axis/cell/input types moved out of `src/workflows/capabilities/host-agent/CompletenessCritic.ts`.
- The moved public symbols now live in `src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts`.
- `src/workflows/capabilities/host-agent/index.ts` re-exports `../coverage/CoverageLedgerBuilder.js`, preserving `@alembic/core/host-agent-workflows` access.
- `CoverageLedgerWrite.ts` imports the moved builder/types from `../coverage/CoverageLedgerBuilder.js`.
- Shared path helpers moved to `coverage/shared/coveragePathMatching.ts`; the shared helper set is neutral path normalization/matching/sorting, not scoring semantics.
- `.gitignore` adds explicit unignore rules for `src/workflows/capabilities/coverage/` because the existing `coverage/` ignore pattern would otherwise hide the new source folder.

Targeted symbol scan:

```text
src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts:16:  buildCoverageLedger,
src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts:17:  type CoverageLedgerCandidate,
src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts:18:  type CoverageLedgerCell,
src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts:19:  type CoverageLedgerExhaustedDeclaration,
src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts:20:  type CoverageLedgerModuleAxis,
src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts:9:export interface CoverageLedgerCandidate {
src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts:17:export interface CoverageLedgerModuleAxis {
src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts:24:export interface CoverageLedgerExhaustedDeclaration {
src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts:30:export interface BuildCoverageLedgerInput {
src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts:41:export interface CoverageLedgerCell {
src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts:64:export function buildCoverageLedger(input: BuildCoverageLedgerInput): CoverageLedgerCell[] {
```

Public export proof:

```text
node --input-type=module -e "const m=await import('@alembic/core/host-agent-workflows'); console.log(typeof m.buildCoverageLedger);"
function

dist/workflows/capabilities/host-agent/index.d.ts:1:export * from '../coverage/CoverageLedgerBuilder.js';
dist/workflows/capabilities/coverage/CoverageLedgerBuilder.d.ts:32:export interface CoverageLedgerCell {
dist/workflows/capabilities/coverage/CoverageLedgerBuilder.d.ts:54:export declare function buildCoverageLedger(input: BuildCoverageLedgerInput): CoverageLedgerCell[];
```

Note: `CoverageLedgerCell` is a TypeScript-only type and is not expected to exist as a runtime namespace export.

## Vendor Pin Evidence

Alembic:

```text
git ls-files -s vendor/AlembicCore
160000 4695c929d70701cf0025d176e7ca51b42e800073 0	vendor/AlembicCore

git -C vendor/AlembicCore rev-parse HEAD
4695c929d70701cf0025d176e7ca51b42e800073

git status --short --branch
## main...origin/main [ahead 2]
```

AlembicPlugin:

```text
git ls-files -s vendor/AlembicCore
160000 4695c929d70701cf0025d176e7ca51b42e800073 0	vendor/AlembicCore

git -C vendor/AlembicCore rev-parse HEAD
4695c929d70701cf0025d176e7ca51b42e800073

git status --short --branch
## main...origin/main [ahead 2]
```

AlembicCore:

```text
git status --short --branch
## main...origin/main [ahead 1]
```

## Controller Validation Reruns

Commands rerun in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore`:

```text
npm run build:check
npm run lint
npm run test -- test/unit/BuildCoverageLedger.test.ts
npm run test
npm run build
git diff --check
```

Observed results:

- `npm run build:check`: exit 0.
- `npm run lint`: exit 0; Biome checked 643 files.
- `npm run test -- test/unit/BuildCoverageLedger.test.ts`: exit 0; 1 file passed, 6 tests passed.
- `npm run test`: exit 0; 144 files passed, 1413 tests passed.
- `npm run build`: exit 0.
- `git diff --check`: exit 0; no output.

Commands rerun in consumers:

```text
# Alembic
npm run build:check

# AlembicPlugin
npm run build:check
```

Observed results:

- Alembic `npm run build:check`: exit 0; output confirmed `Using local AlembicCore source: ../AlembicCore`.
- AlembicPlugin `npm run build:check`: exit 0; output confirmed `Core build used ../AlembicCore @ 4695c929d70701cf0025d176e7ca51b42e800073`.

## Review Notes

- P4 is documented as a behavior-neutral cold-Core exception with no REAL-TEST requirement.
- The evidence supports pure relocation plus public-barrel preservation.
- No push, release, version bump, BiliDili mutation, or thread-id write was performed during controller review.
- Target-side Alembic Guard attempts failed with tool internal schema error `unrecognized_keys:data`; repository validations above passed.
