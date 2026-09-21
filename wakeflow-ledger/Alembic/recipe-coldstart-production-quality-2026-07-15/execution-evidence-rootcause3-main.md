# Alembic Main PC-F adapters rootcause3 execution evidence

- Task: `i2-1-alembic-main-pcf-adapters-rootcause3-t1`
- Dispatch group: `dg-i2-1-alembic-main-pcf-adapters-rootcause3`
- Window / repository: `Alembic` / `Alembic`
- Result: implementation and target-side verification complete; controller acceptance is not claimed here.
- Alembic commit: `32578dc3d5fe02eb8c6d24d854066d780ffb668d`
- Alembic tree: `945b99963919bb273793c15001a1f845df5964ba`
- Clean baseline / parent: `7a8c1f1364efca2001fd8452bb919ca7ec735c41`
- Consumed Core commit: `4a3e8bab3fc7aa05ef7b680593599634422513aa`
- Consumed Core tree: `c7941aff9e489b65ce0b80765e26a803bfa75d76`

## Root causes and RED evidence

1. `buildCertifiedModules()` silently assigned an eligible source with no owner to `repo:<repoId>`. The expected-owner calculation repeated the same synthesis, so the emitted and expected counts matched and falsely reported zero loss. Before the fix, the real fixture containing `src/owned.ts` and root `loose.ts` resolved with `module:src` plus `repo:project` instead of rejecting the unowned source.
2. Dependency-graph and module-coverage reopened the in-memory carrier after the Generate session had been created, but neither actual production entrypoint replaced the session ProjectContext. Before the fix, a fresh `GenerateSessionManager` after the dependency entrypoint still observed only `plan` and `recipe-generation` receipts.
3. Capture-time empty instrumentation was not proof of post-open consumption. The repaired authority is the persisted post-open carrier and its canonical receipts, counters, instrumentation, and fresh-manager readback.

## Implemented production chain

- `lib/project-facts/CertifiedProjectFactsRuntime.ts`
  - Added a bounded Generate-session port and one `persistMainCertifiedProjectFactsCarrier()` boundary over Core `replaceProjectContext()`.
  - The boundary checks the project root, the full base binding, monotonic preservation of earlier receipts, immediate readback, and canonical carrier equality.
  - Removed all `repo:<repoId>` owner synthesis. Any eligible source with no certified module owner now fails closed before a module-coverage receipt can be persisted.
- `lib/recipe-pipeline/generate/execution/AiDimensionPreparation.ts`
  - The actual dependency-graph entrypoint now reopens the carrier from the same persisted Generate session, writes the new receipt back synchronously, and continues with that session carrier.
- `lib/service/module/ModuleService.ts`
  - The actual module-coverage entrypoint now requires a persistence boundary, writes the reopened receipt before returning, and treats receipt regression as a changed cached binding.
  - The session boundary factory stays inside the service layer, preserving the repository layer contract.
- `lib/injection/modules/AppModule.ts`
  - Production DI supplies the current same-project Core Generate session to the service-layer boundary; it creates no second store or Main-owned session implementation.
- `test/unit/ProjectContextCertifiedAdapters.test.ts`
  - Added a production-sequence test using actual dependency preparation and `ModuleService`, with a new manager after every stage.
  - Added a real owned-plus-unowned source fixture that proves `loose.ts` fails closed and leaves no module-coverage receipt.

## Raw runtime evidence

Raw JSON: `project-context-rootcause3-runtime-main.json`

SHA-256: `5c780a9e566039d5aeb0195d005b2a14e2395e878b09c3ebf61906359ea5904a`

The JSON was produced by a standalone `tsx` process, separate from Vitest, using a temporary 13-source fixture. The temporary probe was removed after capture. It exercised actual `prepareAiDimensionPipeline()` dependency preparation and actual `ModuleService.listTargets()` module coverage, then reopened the persisted session with three new manager instances.

Observed receipt progression on one persisted session:

1. `plan`, `recipe-generation`
2. `dependency-graph`, `plan`, `recipe-generation`
3. `dependency-graph`, `module-coverage`, `plan`, `recipe-generation`

All four receipts share exactly one artifact id, facts hash, source-vector hash, certification-binding hash, and canonical-scope hash. The raw evidence contains the four exact entrypoints, projection hashes, load-evidence hashes, and receipt hashes.

Carrier evidence:

- Serialized size: `5570` bytes; limit: `32768` bytes.
- Frozen source bodies (`contentBase64`): absent.
- Consumer-reopen events: four, one per Main consumer.
- Module-projection events: one, with emitted count `1` and expected owner count `1`.
- All four legacy/cap counters: zero.
- Missing facts hash, changed facts hash, changed source vector, changed scope, and stale binding: all failed closed.
- Owned `src/owned.ts` plus unowned `loose.ts`: failed closed with no module receipt persisted.

This is a synthetic temporary Main adapter fixture. It is not an Alembic-production-repository, BiliDili, Plugin, global five-row, or whole-demand PC-F acceptance claim.

## Validation

- `npm run build:check`: passed against local Core source.
- Post-commit focused command covering the nine task-package suites: 9 files passed, 84 tests passed.
- `npm run check`: passed.
  - Unit: 141 files passed, 1087 tests passed.
  - Integration: 31 files passed, 462 tests passed, 10 skipped.
  - Coverage gate: 3 files passed, 11 tests passed; repository coverage thresholds passed.
  - Repository boundary, space-edge, layer-contract, doctrine, naming, Agent/Core import boundaries, shared-asset drift, retired-symbol, and ring-direction gates passed.
  - Biome reported five pre-existing non-blocking explicit-`any` warnings outside the changed files; no new warning was introduced by this task.
- `npm run test`: 173 files passed, 1571 tests passed, 10 skipped.
- `git diff HEAD^ HEAD --check`: passed.
- `npm ls @alembic/core --depth=0`: resolves the workspace link to `../AlembicCore`.
- `node --conditions=alembic-dev --input-type=module -e "console.log(import.meta.resolve('@alembic/core/host-agent-workflows'))"`: resolves the accepted Core build under `../AlembicCore/dist/host-agent-workflows.js`.
- Alembic, Core, Plugin, Agent, and Dashboard repository boundaries were inspected; only the single Alembic commit above was created.

The first full `npm run check` attempt found one task-local layer-contract violation from a direct `injection -> project-facts` runtime import. The implementation was corrected by moving the session boundary factory into `service/module`; the targeted layer gate, build, focused suite, full check, and full test were then rerun successfully.

## Two-stage self-review

### Stage 1 — requirement and root-cause review

- The two newly rejected root causes have direct RED evidence and dedicated GREEN tests.
- Dependency and module receipts are produced by their actual production entrypoints and are persisted before those entrypoints return.
- Fresh-manager readback, not capture-time empty counters, is the authority for the final carrier.
- Earlier plan and recipe receipts remain present; receipt loss is explicitly rejected.
- The unowned source is no longer synthesized into an owner and cannot produce a success receipt.
- The carrier remains metadata-only and bounded; no Plugin receipt or global five-row claim was manufactured.

Conclusion: no remaining task-contract gap found.

### Stage 2 — code quality, compatibility, and rollback review

- Core remains the sole Generate session persistence owner. Main consumes the accepted `replaceProjectContext()` boundary and adds no duplicate store, fake Core surface, schema, or migration.
- Session writes preserve unrelated ProjectContext fields and reject wrong-root, stale-binding, receipt-regression, or failed-readback states.
- Certified module coverage fails closed when its persistence boundary is absent. The no-carrier legacy path remains unchanged.
- The service-layer factory removes the initially detected forbidden dependency edge; final layer-contract verification is clean.
- Module caching includes the persisted module receipt hash, preventing a same-base but receipt-regressed carrier from being silently accepted.
- Rollback is one Alembic commit revert; there is no data migration or sibling-repository mutation.

Conclusion: no actionable correctness, security, compatibility, maintainability, or scope issue remains in the assigned Main package.

## Boundaries and controller decisions still reserved

- This target result does not accept the whole demand, authorize Test, claim a Plugin consumer, or assert the global PC-F row count.
- The focused fixture's source-graph catch-up warning is caused by its deliberately minimal container without a database; it occurs after the certified dependency receipt is persisted. Full integration and full test suites passed with the real application container.
- Cross-repository acceptance, any BiliDili real-cold-start scenario, and next-wave decisions remain with the controller.
