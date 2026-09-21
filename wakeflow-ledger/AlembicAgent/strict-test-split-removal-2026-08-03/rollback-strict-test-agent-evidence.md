# AlembicAgent strict-test split rollback evidence

## Scope and result

- Task: `rollback-strict-test-agent-t1`
- Repository: `AlembicAgent`
- Result: the four assigned product commits were reverted separately and in the required order. The interleaved documentation commit `248d1ed` remains in history and in the resulting tree.
- No replacement test mode, legacy bootstrap, `ALEMBIC_TEST_MODE`, Plugin path, DaemonJob path, adjacent-repository change, or ordinary production-pipeline redesign was introduced.

## Acceptance-anchor probes

### `agent-exact-revert-lineage`

RED before change:

- `HEAD` was `8688311`; all four assigned product commits were ancestors.
- No matching revert commit existed.
- `248d1ed` was an interleaved ancestor that had to be preserved.

GREEN after change:

| Original product commit | Exact revert commit |
| --- | --- |
| `8688311c3970054c68a74b0ce30d8f3db4f15be6` | `a47bc2fcd7752b8cf2f4c26c6e42612028a88c00` |
| `4a2649f0d758a43f0884af5377c8b8531eed0b41` | `81a40fdde802e9c547824a4b32a34ef0e20fcb87` |
| `077f4f6f08da731a40547c90f085460f434087f1` | `00169b3ca5925c84a0e0cc149878afb2419cb79b` |
| `7dfb4bada72d78a5bc9e65cafa54574cb36ae698` | `00a27d7f12b7478a4f6bdf79aabf48b0ebd00a05` |

- Every revert message contains the exact full original SHA in `This reverts commit ...`.
- `git diff --check origin/main..HEAD` passes.
- `git merge-base --is-ancestor 248d1ed HEAD` passes.
- The patch id of `git diff 7dfb4ba^ HEAD` equals the patch id of the preserved `248d1ed` commit: `a8f2d2827f9558158123d5bd9d4892ec51de9106`.
- `AGENTS.md` and `CLAUDE.md` match their state after `248d1ed`.
- Final tracked worktree is clean; branch is four commits ahead of `origin/main`.

### `agent-strict-receipt-lane-absent`

RED before change:

- A bounded scan over `src`, `test`, `scripts`, and `package.json` found 14 files and 642 occurrences for the assigned strict-test authority/receipt lane.
- The public API, Agent service/strategy/runtime contracts, production prompt stage, probe/package script, fixtures, and dedicated tests all contained the rejected lane.

GREEN after change:

- Exact symbol scan returns zero files for `StrictTestDimension`, `strictTestExecutionReceipt`, `strictTestAuthority`, `StrictTestAutomaticSelection`, `STRICT_TEST_DIMENSION`, and the dedicated probe/script names across `src`, `test`, `scripts`, `config`, and `package.json`.
- Filename scan returns zero dedicated strict-test-dimension contract/probe/durable-review files.
- The same symbol scan over the freshly rebuilt ignored `dist` tree returns zero files.
- `npm run build`, `npm run build:check`, and all import/API/layer/doctrine/naming/provider-neutral/retired-symbol linters pass.
- Public-signature smoke passes with 15 exports and 451 bindings. The removed 10 bindings are the rejected dedicated strict lane.

Two stale ignored `dist` artifacts from the previous revision were removed before rebuilding so local generated output cannot misrepresent the current source. They were not tracked or committed.

### `agent-production-preserved`

RED/baseline before change:

- `npm run build:check` passed.
- Focused ordinary production tests passed: 5 files, 50 tests.
- Full test baseline: 73 files passed, 1 failed; 631 tests passed, 20 failed. All 20 failures were in `test/durable-semantic-review-runtime.test.ts` because the adjacent local `@alembic/core` facade does not export `createProjectContextFileRef`.

GREEN/regression after change:

- The same focused ordinary production suite passes unchanged: 5 files, 50 tests.
- Full test result: 72 files passed, 1 failed; 589 tests passed, 20 failed. The 42 fewer passing tests are exactly the removed dedicated strict-test-dimension tests; the same pre-existing 20 external Core-facade failures remain.
- `npm run check` reaches and passes build, lint, boundary checks, and public-signature smoke, then stops at the same pre-existing strict-consumer/Core-facade import failure.
- Separately executed checks after that stop pass: `npm run verify:validation-floor` (73 test files, 564 declared tests, 15 stable exports, 52 Core refs, 571 pack entries) and `npm run lint:retired-symbols`.

Focused production regression command:

```text
npm test -- --run test/strict-production-chain.test.ts test/strict-production-rework.test.ts test/agent-surface-floor.test.ts test/pipeline-outcome-abandoned.test.ts test/mining-e2e-pipeline.test.ts
```

## Verification inventory

- PASS: `npm run build`
- PASS: `npm run build:check`
- PASS with 21 pre-existing warnings: `npm run lint`
- PASS: `npm run lint:agent-import-boundary`
- PASS: `npm run lint:public-api-boundary`
- PASS: `npm run lint:core-import-boundary`
- PASS: `npm run lint:space-edges`
- PASS: `npm run lint:layer-contract`
- PASS: `npm run lint:doctrine`
- PASS: `npm run lint:naming`
- PASS: `npm run lint:provider-neutral-kernel`
- PASS: `npm run lint:retired-symbols`
- PASS: `npm run smoke:public-signatures`
- PASS: `npm run verify:validation-floor`
- PASS: focused ordinary production suite, 50/50 tests
- BASELINE FAIL unchanged: `npm test` and `npm run smoke:strict-consumer` on missing adjacent Core facade export `createProjectContextFileRef`
- PASS: public surface, package script, filename, source, test, config, and rebuilt distribution zero-residue scans
- PASS: `git diff --check origin/main..HEAD`
- PASS: clean tracked worktree

## Self-review

- Severity review found no P0-P3 defect in the assigned rollback diff.
- The change is a four-commit mechanical reversal only; it does not add a new execution path or weaken unrelated production behavior.
- The only residual verification risk is the unchanged external Core-facade baseline failure. It predates the rollback and is outside this task/repository boundary.
