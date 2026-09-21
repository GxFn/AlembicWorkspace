# AlembicPlugin I2.2 Graph suppressed-observation root-cause evidence

Task: `i2-2-alembic-plugin-pcf-graph-map-rootcause3-t1`

## Repository identity

- Required baseline: commit `612738bd750324577e35a40689100e1fdc450763`, tree `542f7808a7c2c10a4fbe4a1186a3057c484ab357`.
- Repair commit: `aba8c511be2a0de812fb8e9976062090fe49998d`.
- Repair tree: `692dfa44f2b9b8cead5adde2755cc6396b75a643`.
- Parent: `612738bd750324577e35a40689100e1fdc450763`; exactly one new Plugin commit.
- Loaded Core stayed fixed at commit `4a3e8bab3fc7aa05ef7b680593599634422513aa`, tree `c7941aff9e489b65ce0b80765e26a803bfa75d76`.
- Final AlembicPlugin worktree: clean.

## Root cause and delivered behavior

The previous Graph terminal path reduced every suppressed ProjectContext diagnostic to one anonymous `suppressedErrorCount`. That allowed MR5's 514 and SP's 104 suppressed observations to coexist with `status=ready` and a passed terminal receipt without proving whether any observation was required, a confirmed defect, or unclassified.

The repair adds a versioned `ProjectContextSuppressedObservationSummary` to the public Graph schema, Graph metadata, terminal live-probe receipt, and terminal semantic projection/hash. Every suppressed observation is conserved into stable categories with disposition, reason, count, and at most three hash-only samples. The legacy count must equal the typed observed total.

Classification is fail-closed and uses request kind, severity/code, path/applicability, and the loaded Foundation request outcomes:

- severity `error`, Foundation `confirmed-defect`, ambiguous authority, and unclassified observations block Graph readiness;
- Foundation `expected-external` and `advisory` observations are non-blocking;
- structurally unsupported broad-source parser warnings are `not-applicable` only when request kind, warning code/severity, path extension, and broad-query applicability all agree;
- narrow Map external-dependency, module-layer advisory, and focused broad-scan cases retain explicit typed reasons rather than blanket message-only classification.

`deriveGraphStatus` now degrades on any blocking suppressed observation. `ProjectContextLiveProbeReceipt` records the summary and explicit blocking/unclassified reasons. The production Graph entrypoint passes the Foundation artifact's `requestOutcomes` into the provider. The audit requires conservation, equality with the legacy count, `blockingCount=0`, and `unclassifiedCount=0` before terminal readiness passes.

Changed production surfaces are limited to:

- `AlembicGraphOutput` suppressed-observation contract and conservation helper;
- `ProjectGraphProvider` classification, accounting, status, receipt, and semantic hash;
- the certified Graph MCP entrypoint's Foundation request-outcome handoff;
- the Plugin real-scenario audit invariant and receipt evidence;
- focused Graph regression tests.

## RED, GREEN, and mutation evidence

- RED: `npx vitest run test/unit/ProjectGraphTool.test.ts` failed the two new assertions because the old public output had no `suppressedObservations`; the existing 33 Graph tests still passed.
- GREEN: `npx vitest run test/unit/ProjectGraphTool.test.ts test/unit/PluginCertifiedEmptyStartLoadedEntrypoint.test.ts` passed 39/39.
- Expanded Graph/Map/schema focus: `npx vitest run test/unit/ProjectGraphTool.test.ts test/unit/RecipeMapTool.test.ts test/unit/KnowledgeContextContracts.test.ts test/integration/ZodSchemas.test.ts --reporter=dot` passed 137/137.
- Required parser error regression: a diagnostic that the broad Graph projection suppresses is typed `required`, produces blocking count 1, returns `degraded`, and blocks the terminal receipt.
- Unsupported broad-source warning regression: the same suppression lane is typed `not-applicable`, conserved, and remains non-blocking/ready.
- Mutation regression: changing `observedCount` or deleting the category makes the shared conservation audit return false.

## Validation commands

- `npm run check` — passed typecheck, Biome, Core import, layer/repository/scope, drift, doctrine, naming, retired-symbol, and ring-direction gates. Fifteen pre-existing script `console` findings remain warnings only.
- `npm run test:unit -- --reporter=dot` — passed 147 files / 1598 tests. One initial parallel run had a transient untouched `RecipeVectorGenerationRuntime` assertion; the file passed 10/10 in isolation and the full rerun passed 1598/1598.
- `npm run test:integration -- --reporter=dot` — 25 files / 664 tests passed; the sole failure is the already recorded untouched `RealProjectEnhancement.test.ts` Alamofire baseline (`expected 0`, Core registry returned 1).
- `npm test -- --reporter=dot` — 172 files / 2262 tests passed; only the same unrelated Alamofire baseline failed.
- `npm run build`, `npm run build:check`, and `git diff --check` — passed; both build gates loaded fixed Core `4a3e8bab...`.
- `npm run verify:codex-plugin`, `npm run verify:plugin-distribution`, and `npm run smoke:codex-plugin` — passed plugin manifest/distribution, runtime boundary, install, startup, shell bootstrap, and stdio.
- `npm run prepare:codex-runtime-package`, `npm run check:runtime-pack-freshness`, and `npm run verify:codex-runtime-package` — passed; 1393 packed files, no file dependencies, forbidden old shape rejected, installed entrypoint passed.
- `npm run probe:codex-plugin-startup-runtime` — passed first install, cached/offline reuse, version replacement, stale-lock recovery, all typed failure branches, and lock concurrency.

## Final real MR5/SP audit

Committed-build artifacts:

- `project-context-capability-runtime-plugin.json` — SHA-256 `0f5ccf67206016ac6fcc31ee4f2c9a45b759ec4a5bb729e7d8c8addc029c6f99`.
- `project-context-capability-audit-plugin.json` — SHA-256 `84d69f7f3f0d7b801b4e7bb301fd95d7c658e6a6f7dd4c584e6b35703a29af0b`.

Both scenarios used the production built entrypoint with a 360-second deadline and completed the unchanged I2 five-consumer lineage with exactly five repositories and five receipts.

- MR5: Graph `ready` in 16.752s; Map `ready` in 10.541s. The 514 suppressed observations are conserved as 12 `foundation-advisory` plus 502 `foundation-expected-external`; non-blocking 514, blocking 0, unclassified 0. The terminal receipt passed with no blocking reason.
- SP-BILIDILI: Graph `ready` in 1.389s; Map `ready` in 1.050s. The 104 suppressed observations are conserved as 12 `foundation-advisory` plus 92 `foundation-expected-external`; non-blocking 104, blocking 0, unclassified 0. The terminal receipt passed with no blocking reason.
- All 21 audit invariants are true, including the new `graphSuppressedObservationsConserved` gate; strict bypass counters remain zero, exact repository scope and all five receipts remain intact, and Graph identity/Map pagination invariants remain true.

## Two-stage self-review

Specification review confirmed that the repair addresses only the anonymous suppression truth hole while preserving rootcause2's five receipts, strict-bypass instrumentation, Core-aligned script inventory, Graph identity, Map continuation accounting, and the fixed Core commit. No I3, reset, Recipe, publication, serving, Test, or cross-repository implementation was introduced.

Correctness review checked classification priority, conflicting Foundation authority, count/category conservation, bounded sample handling, clone/delta paths, failed-output initialization, public schema validation, legacy count equality, focused diagnostic suppression, status derivation, terminal receipt reasons, semantic hash participation, and the real report distributions. No unresolved in-scope defect remained.

## Boundary

This proves the I2 Graph/Map terminal truth requested by this package. I3 exact authorized reset → single facts → LLM Plan rebuild remains pending. The reports and TargetResultEnvelope are controller review inputs, not acceptance, whole-demand completion, Test authorization, or permission to enter I3+/publication/serving work.
