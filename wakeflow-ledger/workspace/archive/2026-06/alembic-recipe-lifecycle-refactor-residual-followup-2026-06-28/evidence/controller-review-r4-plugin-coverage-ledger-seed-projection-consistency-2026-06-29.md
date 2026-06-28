# Controller Review - R4 Plugin Coverage Ledger Seed Projection Consistency

## Scope

- State root: `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28`
- Target task: `r4-plugin-coverage-ledger-seed-projection-consistency-t1`
- Target window: `AlembicPlugin`
- Target result: `target-result-r4-plugin-coverage-ledger-seed-projection-consistency-t1`
- Plugin commit reviewed: `f68478145670b408fa29f1a2c97e3edcaeb88bdd`

## Raw Evidence Reviewed

- Read target result JSON and target report.
- Reviewed `git -C AlembicPlugin show --patch --function-context f68478145670b408fa29f1a2c97e3edcaeb88bdd -- test/unit/HostAgentSessionLease.test.ts`.
- Reviewed `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts` around `reconcileCoverageLedgerSeedWithPersistedState`, `summarizeCoverageLedgerSeed`, `attachCoverageLedgerSeedMeta`, and the final rescan response attachment.

## Controller Findings

- Commit `f68478145670b408fa29f1a2c97e3edcaeb88bdd` changes only `test/unit/HostAgentSessionLease.test.ts`.
- The added regression `projects coverage ledger seed counts from SQLite rows after writing the seed` runs the host deepMining rescan with the real Core-backed `repositories.coverageLedgerRepository`, then reads raw SQLite `coverage_ledger` rows through `runtime.sqlite`.
- The test compares SQLite-derived `writtenCells`, `measuredCells`, `targetScopedCells`, `usableCells`, `moduleCount`, and `aggregateOrRootModuleIds` against `response.meta.coverageLedgerSeed`, `response.data.coverageLedgerSeed`, and `response.data.meta.coverageLedgerSeed`.
- The test asserts clean persisted state remains `status: "written"`, has no `reason`, has measured target-scoped rows, and has no aggregate/root module ids.
- Runtime source review confirms `reconcileCoverageLedgerSeedWithPersistedState` recomputes the seed from persisted cells via `coverageLedgerRepository.listByProjectRoot(projectRoot)`. Clean persisted state returns the recomputed persisted seed as `written`; aggregate/root pollution is still surfaced as `status: "inconsistent"` with a reason.
- `attachCoverageLedgerSeedMeta` projects the same coverage seed object into all route-visible surfaces. This means R-4 is covered by an independent SQLite/raw-row regression, not by lowering or hiding a route-count mismatch.

## Controller Validation

- PASS: `npx vitest run test/unit/HostAgentSessionLease.test.ts`
  - 1 file, 18 tests passed.
- PASS: `npm run build:check`
  - Core build used `../AlembicCore @ 92924503920c476d296b28aeb5482ac281f06b28`; TypeScript no-emit passed.
- PASS: `npx biome check test/unit/HostAgentSessionLease.test.ts`
  - Checked 1 file; no fixes applied.
- PASS: `git -C AlembicPlugin diff --check HEAD^ HEAD`
- PASS: `git -C AlembicPlugin status --short --branch`
  - `main...origin/main [ahead 3]`; no uncommitted files.
- PASS: `git -C AlembicCore status --short --branch`
  - `main...origin/main [ahead 2]`; no uncommitted files.

## Verdict

Acceptable for R-4. The target added direct raw SQLite evidence for host `coverageLedgerSeed` projection consistency, preserved the existing aggregate/root inconsistent guard, changed no runtime behavior or freeze literals, and did not touch BiliDili data, release metadata, vendor snapshots, or marketplace assets.

Residual note: target-side `alembic_code_guard` remained blocked by the installed MCP output-schema drift, which is the already-reviewed R-2 source issue; no additional source guard finding is available from this target.
