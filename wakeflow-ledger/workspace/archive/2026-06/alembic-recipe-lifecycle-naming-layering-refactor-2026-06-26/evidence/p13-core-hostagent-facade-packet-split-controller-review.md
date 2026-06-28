# P13 Core HostAgent Facade Packet Split Controller Review

## Scope

- State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
- Dispatch group: `p13-core-hostagent-facade-packet-split-p1`
- Target task: `p13-core-hostagent-facade-packet-split-t1`
- Target window: `AlembicCore`
- Review decision: accept this Core producer task; P13 remains open for Plugin/runtime consumer rename and BiliDili REAL-TEST.

## Raw Evidence Reviewed

- Target result: `target-results/tr-p13-core-hostagent-facade-packet-split-t1.json`
- Target report: `evidence/p13-core-hostagent-facade-packet-split-t1-report.md`
- Core commit: `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`
- Alembic repin commit: `f79a67fa2be64c3b7ba4371f6643fcb14a07ddf6`
- AlembicPlugin repin commit: `359c66319cde7d3a185536df5ba92048932f3897`

## Controller Checks

- `git -C AlembicCore rev-parse HEAD` matched Core commit `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- `git -C Alembic rev-parse HEAD` matched repin commit `f79a67fa2be64c3b7ba4371f6643fcb14a07ddf6`.
- `git -C AlembicPlugin rev-parse HEAD` matched repin commit `359c66319cde7d3a185536df5ba92048932f3897`.
- `git status --short` for AlembicCore, Alembic, and AlembicPlugin returned clean output.
- `git show --name-status --no-renames HEAD` showed the Core diff is confined to host-agent facade/builder split files and the compatibility test.
- Alembic and AlembicPlugin HEAD diffs only update `vendor/AlembicCore`.
- `git -C Alembic ls-tree HEAD vendor/AlembicCore` and `git -C AlembicPlugin ls-tree HEAD vendor/AlembicCore` both point to `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- Source inspection confirmed `HostAgentAnalysisPacketBuilder.ts` is the implementation, `IDEAgentAnalysisPacketBuilder.ts` is an R1 re-export shim, and old `IDEAgent*` names are aliases rather than separate logic.
- Dist import probe passed:

```json
{"rootHostProjectContext":"function","rootLegacyProjectContext":true,"hostHostProjectContext":"function","hostLegacyProjectContext":true,"hostUnitKey":true,"hostProgressSeed":true,"directHostBuilder":true,"directLegacyBuilder":true,"snapshotNotRoot":true}
```

## Target Validation Reviewed

- AlembicCore `npm run build:check` passed.
- AlembicCore `npm run lint` passed.
- AlembicCore `npm run build` passed.
- AlembicCore `npm run test` passed: 145 files, 1418 tests.
- AlembicCore `npm run lint:public-api-boundary` passed: 61 exports, stable=24, provisional=8, transitional=29, no growth.
- AlembicCore `npm run lint:consumer-core-imports` passed with AlembicAgent/Alembic/AlembicPlugin issues=0.
- AlembicCore `npm run lint:layer-contract` passed: 404 runtime imports, 257 type-only bridges.
- AlembicCore, Alembic, and AlembicPlugin `git diff --check` passed before their commits.
- Alembic `npm run build:check` passed after vendor/AlembicCore repin.
- AlembicPlugin `npm run build:check` passed after vendor/AlembicCore repin and reported Core at `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.

## Frozen And Boundary Result

- `PlanStageId`, response tool names, `coverage_ledger`, `deep_mining_rounds`, `/api/v1/file-changes`, `file-change`, and the R2 root ternary remain unchanged per target grep evidence.
- `moduleMiningRoutes` was not deleted or renamed in this Core producer task.
- Public subpath `@alembic/core/host-agent-workflows` remains the import surface; package paths were not renamed.

## Residuals

- `npm run lint:naming` still fails only on pre-existing untouched Core files: `src/project-context-capabilities.ts`, `src/recipe-context-capabilities.ts`, and `src/test-fixtures.ts`; this is not a P13 Core blocker.
- Alembic guard failed on local tool-surface/knowledge mismatch (`unrecognized_keys: data`), so repository validation evidence is used for this review.
- P13 Plugin runtime surface rename, response field compatibility handling, and BiliDili REAL-TEST remain pending follow-up tasks.

## Decision

Accept `p13-core-hostagent-facade-packet-split-t1` as the Core producer package. The next dispatch should move to the Plugin consumer/runtime surface rename and response compatibility package before P13 real-scenario Test.
