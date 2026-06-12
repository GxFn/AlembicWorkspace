# AFAPI-FULL-STAGE1A-ALEMBIC-RETRIEVAL-DECISION-P1 Report

Task: Alembic producer foundation for AFAPI-FULL-03/04/05/06/11 retrieval decision metadata.

Implemented:
- Added Decision Register searchable/indexable producer view via `DecisionRegisterStore.searchable()`.
- Added `GET /api/v1/decision-register/searchable` with default active/effective-only lifecycle filtering.
- Added explicit audit readback through `includeAudit=true&status=all`; revoked/deleted documents remain `acceptedForRetrieval=false`.
- Added `decision` and `decision-register` search types for HTTP resident search.
- Merged active/effective Decision Register documents into HTTP resident search and resident MCP search.
- Added Decision Register lifecycle, retrieval quality, relation, and feedback metadata to `IntentEvidence` and `PrimeInjectionPackage`.

Lifecycle proof:
- Default searchable view returns only `status=active` documents with `retrievalLifecycle=effective`.
- Revoked/deleted documents are excluded from default searchable/search/prime accepted results.
- Explicit audit readback returns active/revoked/deleted documents while keeping revoked/deleted audit-only.
- SourceRef handling remains observe-only; no production gate was added.

Verification:
- `npx biome check lib/service/task/DecisionRegisterStore.ts lib/shared/schemas/http-requests.ts lib/http/routes/decision-register.ts lib/service/task/PrimeInjectionPackage.ts lib/service/task/IntentEvidence.ts lib/http/routes/search.ts lib/resident/tool-handlers/search.ts test/unit/DecisionRegisterStore.test.ts test/unit/DecisionRegisterRoute.test.ts test/unit/SearchRouteTelemetry.test.ts` passed.
- `npx vitest run --config vitest.unit.config.ts test/unit/DecisionRegisterStore.test.ts test/unit/DecisionRegisterRoute.test.ts test/unit/SearchRouteTelemetry.test.ts` passed: 13 tests.
- `npx vitest run --config vitest.unit.config.ts test/unit/PrimeSearchPipelineIntentPlan.test.ts test/unit/IntentEpisodeStore.test.ts test/unit/IntentEpisodeTask.test.ts` passed: 3 tests.
- `npm run build:check` passed.
- `git diff --check` passed.
- `npm run test:unit` ran 128 files: 127 passed, 1 all-run hook timeout in `test/unit/ConsolidatedProposal.test.ts`; isolated rerun of that file passed 8/8.

Remaining gaps:
- Plugin consumer route/schema/helper remains downstream consumer work; this commit exposes the Alembic producer contract only.
- No blocking sourceRef gate was introduced by design.
