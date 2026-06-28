# Controller Review: R-1 Core + R-2 Plugin HIGH Packages

Review date: 2026-06-29

## Scope

- State root: `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28`
- Candidate: `tc-20260628215830-0007`
- Reviewed target results:
  - AlembicCore / `r1-core-coverage-module-axis-canonical-t1`
  - AlembicPlugin / `r2-plugin-code-guard-public-schema-t1`

This review accepts only the two producer/package results below. It does not
complete R-1 end-to-end coverage parity, does not run real BiliDili tests, and
does not push, release, bump versions, or change freeze literal values.

## Original Requirement Authority

- R-1 requires canonical coverage module-id derivation to converge on
  `target:{moduleName}:{modulePath}` across in-process, host rescan, and
  dimension-completion writers.
- R-2 requires public `alembic_code_guard` output schema to accept and preserve
  `data.unifiedEvolution.evidenceGate.verdict` while keeping clean-output
  validation strict.
- Final R-1 acceptance still requires downstream consumer wiring plus a
  non-empty ProjectMap host-vs-in-process coverage parity run with `diff=[]`
  and BiliDili no-regression evidence.

## Raw Evidence Reviewed

- Target result:
  `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28/target-results/tr-r1-core-coverage-module-axis-canonical-t1.json`
- Target report:
  `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28/evidence/r1-core-coverage-module-axis-canonical-t1-report.md`
- Target result:
  `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28/target-results/target-result-r2-plugin-code-guard-public-schema-t1.json`
- Target report:
  `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28/evidence/r2-plugin-code-guard-public-schema-t1-report.md`
- AlembicCore commit:
  `cf5317efbef3f9e80cd3bd4c516272acdcf9923a` (`Canonicalize coverage module axis ids`)
- AlembicPlugin commit:
  `bb2d192b892a80fe334912fff98f0a32b7740930` (`Fix code guard public data schema`)

## Controller Verification

AlembicCore:

- Inspected `src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts`.
- Verified `buildCanonicalCoverageLedgerModuleId` preserves already
  target-scoped ids, derives `target:Auth:src/auth` from moduleName/modulePath,
  falls back for missing path, and filters aggregate/root axes.
- Ran `npx vitest run test/unit/BuildCoverageLedger.test.ts`: passed
  1 file / 11 tests.
- Ran a dist import probe:
  `{"helper":"target:Auth:src/auth","targetScoped":true,"aggregate":null}`.
- AlembicCore working tree remained clean, with local `main` ahead of origin by
  one commit.

AlembicPlugin:

- Inspected `lib/runtime/mcp/public-tools/output.ts` and
  `test/unit/AgentPublicToolsContract.test.ts`.
- Verified `AgentCodeGuardOutputSchema` now includes strict
  `data.unifiedEvolution` support and tests explicitly reject unknown `data`
  fields.
- Re-ran `npm run build:check` after the Core producer commit landed: passed;
  it built Core from `../AlembicCore @ cf5317efbef3f9e80cd3bd4c516272acdcf9923a`.
- Ran `npx vitest run test/unit/AgentPublicToolsContract.test.ts`: passed
  1 file / 11 tests.
- Ran `npm run build`: passed and regenerated `dist`.
- Ran a dist-level public-output probe:
  `{"verdict":"routed","rejectsUnknownData":true}`.
- AlembicPlugin working tree remained clean, with local `main` ahead of origin
  by one commit.

## Decision

Accept both target results.

- R-1 Core producer is accepted as a shared Core foundation and export surface.
  It is not final R-1 completion; consumer wiring and real parity tests remain.
- R-2 Plugin source and built public-output schema are accepted. The prior
  `needs-review` blocker was external to Plugin source and is resolved by the
  landed Core commit plus controller rerun of `npm run build:check`.

## Residual Risks And Next Work

- R-1 still needs Alembic in-process consumer wiring and AlembicPlugin host /
  dimension-completion wiring to the Core canonical helper.
- R-1 still needs a real non-empty ProjectMap parity run and BiliDili
  no-regression evidence.
- The installed Alembic MCP surface may continue showing the old
  `unrecognized key "data"` behavior until the local plugin runtime consumes or
  reloads AlembicPlugin commit `bb2d192b892a80fe334912fff98f0a32b7740930`; this
  is a runtime-consumption/reload concern, not a source fix gap.
- No push/release/version action was performed.
