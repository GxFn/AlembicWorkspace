# Controller Review: fix-plugin-coverage-ledger-core-reimport

State root: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`
Dispatch group: `fix-plugin-coverage-ledger-core-reimport-p1`
Target: `AlembicPlugin / fix-plugin-coverage-ledger-core-reimport-t1`

## Scope

Requirement authority: `Design/docs/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26.md` section 3.6 item 2.

Accepted upstream producer: `AlembicCore` commit `c4cac6b4b9dc482a51d33b9d0e2dc5d403bd66e3`.

This Plugin task is consumer-only:

- Keep the stable Plugin import path at `lib/recipe-generation/host-agent-workflows/coverage-ledger-write.ts`.
- Re-export the Core `writeCoverageLedgerForCompletion` and `reflowDeepMiningRoundOnCompletion` helpers from `@alembic/core/host-agent-workflows`.
- Remove duplicated Plugin helper implementation after confirming consumers still resolve through the compatibility facade.
- Do not change dimension completion behavior, anti-fabrication gates, plan gates, B4/PD-7 scope, or Alembic mainbody coverage writeback.

## Raw Evidence

Reviewed Plugin commit:

```text
99315965f77dc6ffb6e6102c97629a953a3f0acf Reimport coverage ledger helpers from Core
```

Changed files:

```text
lib/recipe-generation/host-agent-workflows/coverage-ledger-write.ts
test/unit/CoverageLedgerWiring.test.ts
```

`git show --stat` result:

```text
2 files changed, 17 insertions(+), 197 deletions(-)
```

Source review:

- `coverage-ledger-write.ts` is now a compatibility facade only.
- It re-exports `CoverageLedgerWriteInput`, `CoverageLedgerWriteLogger`, `CoverageLedgerWriteResult`, `DeepMiningRoundReflowResult`, `writeCoverageLedgerForCompletion`, and `reflowDeepMiningRoundOnCompletion` from `@alembic/core/host-agent-workflows`.
- The previous local implementation, local `buildCoverageLedger` import, and local helper interface/function bodies were removed.
- Existing consumers remain on the stable Plugin path:
  - `lib/recipe-generation/host-agent-workflows/dimension-completion.ts`
  - `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `test/unit/CoverageLedgerWiring.test.ts` adds an identity assertion that the Plugin facade functions are the exact Core function references.

## Controller Verification

Environment and commits:

```text
node --version -> v22.22.1
../AlembicCore HEAD -> c4cac6b4b9dc482a51d33b9d0e2dc5d403bd66e3
AlembicPlugin HEAD -> 99315965f77dc6ffb6e6102c97629a953a3f0acf
git status --short -> clean
```

Build:

```text
npm run build:check
Core build used ../AlembicCore @ c4cac6b4b9dc482a51d33b9d0e2dc5d403bd66e3.
exit 0
```

Targeted unit tests:

```text
npm run test:unit -- CoverageLedgerWiring.test.ts HostAgentDimensionCompletionWorkflow.test.ts KnowledgeRescanPlan.test.ts
3 files passed
36 tests passed
```

Boundary and whitespace checks:

```text
npm run lint:consumer-core-imports
Core import boundary OK: scanned 438 files and 440 @alembic/core imports.

npm run lint:repo-boundary
Repository boundary check passed.

git diff --check HEAD^ HEAD
exit 0
```

Lint:

```text
npm run lint
Checked 263 files. No fixes applied. Found 17 warnings.
exit 0
```

The lint warnings are existing unrelated warning classes in `lib/runtime/host-adapter/ClaudeCodeHostAdapter.ts` and scripts. The changed Plugin facade and `CoverageLedgerWiring.test.ts` are not in the warning set.

Core public export proof:

```text
node --input-type=module -e "import('@alembic/core/host-agent-workflows').then((m)=>{ if (typeof m.writeCoverageLedgerForCompletion !== 'function' || typeof m.reflowDeepMiningRoundOnCompletion !== 'function') throw new Error('missing core exports'); console.log('core-host-agent-workflows-coverage-ledger-exports-ok') })"
core-host-agent-workflows-coverage-ledger-exports-ok
```

Discarded probe:

```text
node --input-type=module -e "import('./dist/recipe-generation/host-agent-workflows/coverage-ledger-write.js')..."
ERR_MODULE_NOT_FOUND
```

This was not used as failure evidence because the validated gate for this task is `build:check` (`tsc --noEmit`), and the facade identity is proven by the source-level unit test plus Core public import proof. The task did not require producing or validating a Plugin `dist` artifact.

## Controller Decision Input

Plugin consumer scope is satisfied:

- The duplicate Plugin implementation was removed.
- The compatibility import path remains stable for current Plugin consumers.
- Core helper identity is proven by test.
- Build, targeted tests, consumer Core import lint, repo boundary lint, diff check, and lint all passed under Node 22.

Residual gap:

- This does not complete Phase FIX by itself. `Alembic / fix-main-knowledge-rescan-coverage-ledger-write-t1` is still missing in the state root and must return before the group can be reduced/accepted as a phase.
