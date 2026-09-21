# V2 Alembic Main strict-test private pipeline controller review — rework 3

Date: 2026-08-01

## Review conclusion

- User goal: finish the exact Alembic Main strict-test backend before any Dashboard or real Test
  phase, so a later consumer can use one complete, production-safe contract.
- Target: `Alembic / v2-alembic-main-strict-test-private-pipeline-t1`.
- Reviewed superseding commit: `7df05174c5df6319c3e183405e0655cc556594c9`, parent
  `07ec74090a633a0d5a0ca9f340a18915fbc76499`; repository worktree is clean.
- Decision: **rework**. Rework 2 repaired its stated route matrices, canonical problems and failed
  terminal projection, but controller challenge testing found that the stated matrices themselves
  model only service outcomes. They omit route-level parser/query outcomes and leave the request
  authority and failed-start response data structurally open.
- This is a new root-cause hypothesis, not another unconstrained point fix: the provider authority
  does not model the complete HTTP route outcome algebra (request, path/query validation, service
  result, durable recovery and response projection).
- Forbidden conclusion: this review does not authorize Dashboard wiring, real BiliDili Test,
  DaemonJob redesign, Core/Agent work, investigated-empty work, or a repository-wide OpenAPI
  dialect migration.

## Independently accepted evidence to preserve

Controller source review and fresh execution accept the following current implementation facts:

1. The real normal route follows `HTTP -> DI -> StrictTestDimensionOrchestrator -> AgentService ->
   PipelineStrategy` once, persists only under the private run root, and produces durable status
   and report artifacts.
2. The strict test automatically selects eligible dimensions/cells from the validated authority;
   no manual confirmation or legacy bootstrap is introduced.
3. Public success projections and canonical problem mapping do not serialize private paths,
   source bytes, execution context or trust material.
4. Production/public/official Recipe sentinels remain byte-identical and forbidden DaemonJob,
   reset, publication-lock and public-CAS calls remain zero.
5. Provider generation is deterministic and the generated Dashboard API artifact has a working
   byte-for-byte drift gate.

Fresh controller commands:

```text
npm run build:check                                                                 PASS
npx vitest run test/unit/StrictTestDimensionApi.test.ts \
  test/unit/AlembicProviderContracts.test.ts \
  test/unit/DashboardApiTypesDrift.test.ts \
  test/integration/StrictTestDimensionPipeline.integration.test.ts --reporter=dot   PASS 4 files / 44 tests
npx vitest run test/integration/StrictTestDimensionHttpContract.integration.test.ts \
  --reporter=dot                                                                    PASS 1 file / 1 test
npm run probe:strict-test-main                                                      PASS
npm run lint:repo-boundary                                                          PASS
npm run lint:consumer-core-imports                                                  PASS
npm run check:shared-asset-drift                                                    PASS
git diff --check 07ec74090a633a0d5a0ca9f340a18915fbc76499..7df05174c5df6319c3e183405e0655cc556594c9  PASS
```

The probe observed `200/202/200/200`, pre-start report `409`, wrong authority `422`, legacy
activation `400`, 26 dimensions / 52 cells / 12 eligible cells / 2 selected cells, one pipeline,
two model calls, a completed private terminal, twelve unchanged production/public sentinels, no
leak findings and no forbidden calls.

## Blocking evidence

### 1. Runtime-reachable GET 400 responses are absent from the provider authority

Both status and report routes validate an empty query and parse `runId` inside the route. A
`ZodError` is returned as HTTP `400`; the existing unit test already proves that a non-empty GET
query returns `400`. The provider/generated matrices instead advertise:

- status: `200/404/422`;
- report: `200/404/409/422`.

Therefore the runtime route, provider manifest and generated consumer artifact are not exact.

### 2. Start 422 data is not closed to the public status projection

The route may attach the safe public status DTO to a durable failed-start `422`. The response
schema reuses the generic problem schema whose optional `data` accepts a typed JSON extension.
An independent Ajv challenge accepted a private-shaped object containing `runRoot` and
`executionContext.contentBase64`. Runtime code currently projects safely, but the published
contract cannot prove or enforce that boundary.

### 3. The alleged HTTP authority describes responses only

The provider route contract and generated OpenAPI paths do not describe the two closed POST
bodies or the required `{runId}` path parameter. A later consumer cannot derive the exact request
DTOs or path authority from the claimed single source. This is the same incomplete-route-model
root cause as the response omissions, not Dashboard implementation scope.

### 4. Failed-start evidence does not traverse the real failure chain

The current HTTP test injects a service that directly returns a failed checkpoint. In the real
orchestrator, the first stage failure persists a durable failed terminal/report and then throws;
only a later reopen returns that failed checkpoint normally. The evidence therefore proves the
router branch in isolation, not the same-run real `HTTP -> DI -> orchestrator` failure behavior
claimed by the result.

## Exact rework contract

Preserve the accepted private chain and close the complete HTTP route model in one bounded repair:

1. Make the provider contract the exact authority for each route's request/path and response
   outcomes. Declare these complete matrices:
   - preflight: `200`, `400`, `422`;
   - start: `202`, `400`, `404`, `422`;
   - status: `200`, `400`, `404`, `422`;
   - report: `200`, `400`, `404`, `409`, `422`.
2. Add closed request authority:
   - preflight body: exactly `demandKey`, `projectRoot`, `runId`;
   - start body: exactly `demandKey`, `preflightHash`, `runId`;
   - status/report path: required `runId` with the same public regex/length as runtime parsing;
   - GET query authority must not advertise arbitrary query fields.
   Runtime parsing and the provider schema must share or mechanically prove the same constraints;
   do not add a second drifting hand-written definition.
3. Give start `422` a route-specific closed response union:
   - a generic fail-closed canonical problem carries no arbitrary private `data`;
   - a genuinely persisted durable failed terminal carries `data` exactly matching the closed
     `StrictTestRunStatusPublic` schema.
   A body with `runRoot`, execution context, source bytes, trust material, unknown properties or
   another private-shaped extension must fail schema validation.
4. Make the first real same-run orchestrator failure observable consistently. After `start()`
   throws, the route may reopen the same durable run; attach the safe failed status only when a
   genuine owner-bound terminal failed checkpoint exists. If no valid terminal exists, return the
   generic canonical `422` without fabricating status or weakening integrity failures.
5. Add a table-driven contract test over the real HTTP server and real DI/orchestrator that
   enumerates every runtime-reachable status above and validates each body against the exact
   provider response schema. It must include invalid POST bodies, non-empty GET query, invalid
   `runId`, missing run, report-before-ready, wrong authority, first real stage failure, durable
   failed reopen, and normal completion.
6. Challenge the schemas with private-shaped failed-start data and invalid request/path bodies;
   all must be rejected. Preserve fixed public-safe error messages and path redaction.
7. Generate consumer request/path/response types and route metadata from the provider source,
   regenerate `lib/generated/dashboard-api-types.ts`, and keep the byte-for-byte drift gate. Do
   not edit AlembicDashboard or hand-edit the generated artifact.
8. Preserve the already accepted automatic selection, exact Agent/private chain, durable
   status/report checks, failure causal lineage, and production/public nonmutation guarantees.

Required fresh verification:

```text
npm run build:check
npx vitest run test/unit/StrictTestDimensionApi.test.ts test/unit/AlembicProviderContracts.test.ts test/unit/DashboardApiTypesDrift.test.ts test/integration/StrictTestDimensionPipeline.integration.test.ts test/integration/StrictTestDimensionHttpContract.integration.test.ts
npm run probe:strict-test-main
npm run lint:repo-boundary
npm run lint:consumer-core-imports
npm run check:shared-asset-drift
git diff --check
```

Return one superseding clean Alembic commit and a new legal result revision. Evidence must include:

- extracted request/path and response matrices from the regenerated artifact;
- Ajv rejection of private-shaped failed-start data;
- the first real same-run failed-start HTTP JSON and its reopened durable status/report JSON;
- normal-chain probe JSON with the production/public sentinel and forbidden-call summaries;
- exact fresh command outputs and the clean worktree/commit identity.

## Scope disposition and remaining risks

- The global OpenAPI 3.0-versus-JSON-Schema dialect mismatch and stronger cross-field semantic
  unions were observed during review. They pre-exist this strict-test route repair and are not
  required to prove the concrete runtime/provider break above. They are not silently promoted to
  this package or to TODO without separate requirement authority.
- `investigated-empty` remains outside this Main package exactly as decided in rework 2.
- Dashboard and Test remain blocked. Test may start only after every active non-Test target is
  accepted and the user explicitly starts the confirmed real-scenario Test phase.

## TODO / next action

- Rework the same Alembic task once under the new complete-route-outcome root cause.
- Do not dispatch another repository or broaden into a system-wide provider redesign.
