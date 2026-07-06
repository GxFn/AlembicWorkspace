# Core Coverage Ledger Write Downshift Controller Review Evidence

Date: 2026-06-27
Demand: `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`
Dispatch group: `fix-core-coverage-ledger-write-downshift-p1`
Target: `AlembicCore / fix-core-coverage-ledger-write-downshift-t1`

## Scope Checked

Requirement authority: `Design/docs/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26.md` §3.6 and Phase FIX.

Expected producer-only Core work:
- Move the host-neutral `writeCoverageLedgerForCompletion` and `reflowDeepMiningRoundOnCompletion` helper behavior into Core under `@alembic/core/host-agent-workflows`.
- Export the helpers from the Core public host-agent workflow facade.
- Prove with SQLite-backed tests that an `empty` coverage cell can be rewritten to `partial`/`covered`, `coveredCount` becomes positive, `coveredSourceRefs` is populated, and `adviseCoverageLedger` can return `converged`.
- Do not wire Plugin re-import or mainbody `KnowledgeRescanWorkflow` in this producer package.
- Do not change anti-fabrication gates, `ensureCoverageLedgerCells`, `adviseCoverageLedger`, or round-count semantics.

## Commit And Files

Reviewed commit in `AlembicCore`:

```text
c4cac6b4b9dc482a51d33b9d0e2dc5d403bd66e3 Add core coverage ledger write helpers
```

Changed files:

```text
src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts
src/workflows/capabilities/host-agent/index.ts
test/CoverageLedgerWriteWorkflow.test.ts
```

`git show --stat` reported 3 files changed, 372 insertions.

## Source Review

`CoverageLedgerWrite.ts` exports:
- `writeCoverageLedgerForCompletion`
- `reflowDeepMiningRoundOnCompletion`
- supporting input/result/logger types

The helper calls `buildCoverageLedger`, writes only `coverage_ledger` cells via the supplied repository, and wraps writes in `try/catch` so advisory write failures do not block upstream workflows.

The `reflowDeepMiningRoundOnCompletion` helper updates only the latest existing deepMining round and returns `updated:false` when no round exists.

Static search in the new implementation:

```text
rg git_diff|checkpoint|ensureCoverageLedgerCells|adviseCoverageLedger|anti|fabricat|fs\.|readFile|openAlembicDatabase|await src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts
```

Only comments mention `git_diff_checkpoints`; there is no fs, database open, await, or direct checkpoint access in the implementation file.

Public export check:

```text
node --input-type=module -e "import('@alembic/core/host-agent-workflows').then((m)=>{ if (typeof m.writeCoverageLedgerForCompletion !== 'function' || typeof m.reflowDeepMiningRoundOnCompletion !== 'function') throw new Error('missing exports'); console.log('host-agent-workflows-coverage-ledger-exports-ok') })"
```

Output:

```text
host-agent-workflows-coverage-ledger-exports-ok
```

## Tests And Commands

Node:

```text
v22.22.1
```

`npm run build:check`:

```text
tsc -p tsconfig.json --noEmit
passed
```

Focused and adjacent tests:

```text
npm run test -- CoverageLedgerWriteWorkflow.test.ts CoverageLedgerRepository.test.ts unit/BuildCoverageLedger.test.ts unit/CoverageLedgerAdvisor.test.ts PublicHostAgentWorkflowEntrypoints.test.ts PublicConsumerCoreImportBoundary.test.ts
```

Output:

```text
Test Files  6 passed (6)
Tests       26 passed (26)
```

Full test:

```text
npm run test
```

Output:

```text
Test Files  144 passed (144)
Tests       1409 passed (1409)
```

Lint:

```text
npm run lint
Checked 641 files. No fixes applied.
```

Build:

```text
npm run build
passed
```

Diff whitespace:

```text
git diff --check c4cac6b4b9dc482a51d33b9d0e2dc5d403bd66e3^ c4cac6b4b9dc482a51d33b9d0e2dc5d403bd66e3
passed
```

`npm run check` result:

```text
build:check passed
lint:public-api-boundary passed
lint:layer-contract passed
lint:consumer-core-imports passed
smoke:public-api passed
check:output-budgets passed
check:space-edges passed
lint:doctrine passed
lint:naming failed on pre-existing baseline:
- src/project-context-capabilities.ts
- src/recipe-context-capabilities.ts
- src/test-fixtures.ts
```

## Controller Verdict Input

Evidence supports accepting the Core producer package. Remaining work is downstream:
- Plugin must re-import or re-export the Core helper and prove zero regression.
- Alembic mainbody must hook `writeCoverageLedgerForCompletion` into `KnowledgeRescanWorkflow` per-dimension generation and must not call round reflow.
- Final acceptance still requires BiliDili true-machine verification; this Core producer alone does not complete the demand.
