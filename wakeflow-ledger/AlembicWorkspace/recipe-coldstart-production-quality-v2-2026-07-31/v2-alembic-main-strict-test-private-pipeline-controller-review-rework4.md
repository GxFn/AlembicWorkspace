# V2 Alembic Main strict-test private pipeline controller review — rework 4

Date: 2026-08-01

## Controller Acceptance

- User goal: finish the exact Alembic Main strict-test backend before Dashboard wiring or the
  explicitly user-started real Test phase.
- Scope reviewed: rework 3 Main HTTP request/path/query/response authority, real same-run failed
  start recovery, generated consumer artifact and production/public nonmutation.
- Original requirement authority: the V2 Main controller contract, automatic-selection user
  decision, V2 Test boundary, and the rework 3 exact repair contract.
- Target/window: `Alembic / v2-alembic-main-strict-test-private-pipeline-t1`.
- Evidence reviewed: commit `3a591f59d0b3cf598a0cdb8901034672094a5e23`, its eleven-file
  diff, runtime/request/provider/generator sources, generated artifact, five focused test files,
  real normal/failure probe JSON, target execution plan and result revision 5.
- Implementation reality: the complete response matrices, closed start `422`, same-run durable
  failure reopen and real private pipeline now work, but the request projection remains lossy and
  the generated artifact remains metadata-only rather than a typed consumer contract.
- Validation result: the target suite and all prescribed gates pass, while independent parity and
  artifact challenges reproduce the blocking gaps below.
- Blockers: three in-scope exact-contract defects below.
- Missing evidence: complete route/status runtime-to-schema coverage is not present.
- Residual risks: none promoted outside the confirmed Main scope; the pre-existing global OpenAPI
  dialect and cross-field response-union observations remain outside this package.
- TODO/backlog rollup: no new TODO is authorized. This is repair of the same Main task. Dashboard
  and Test remain blocked; investigated-empty remains excluded.
- Decision: **request-rework**.
- Next action: rework the same Alembic task under the new lossless-consumer-authority root cause.

## Accepted rework 3 results to preserve

1. Status and report advertise runtime-reachable `400`; the four route matrices are now:
   preflight `200/400/422`, start `202/400/404/422`, status `200/400/404/422`, report
   `200/400/404/409/422`.
2. Start `422` is a mutually exclusive closed union: canonical problem without data, or canonical
   problem with exactly the safe public status DTO. Private-shaped extensions fail Ajv.
3. The actual first orchestrator stage failure persists and reopens one matching same-run failed
   terminal/report, returns safe `422`, and later status/report reopen at `200`.
4. The real normal chain remains `HTTP -> DI -> AgentService -> PipelineStrategy -> private
   corpus/ref/index/G4/serving`; automatic selection uses 26 dimensions / 52 cells and exactly one
   Agent pipeline per run.
5. Twelve production/public surfaces stay byte-identical; DaemonJob/reset/publication-lock/public
   CAS counts remain zero; no public private-field leak is observed.

Fresh controller verification:

```text
npm run build:check                                                                  PASS
npx vitest run test/unit/StrictTestDimensionApi.test.ts \
  test/unit/AlembicProviderContracts.test.ts \
  test/unit/DashboardApiTypesDrift.test.ts \
  test/integration/StrictTestDimensionPipeline.integration.test.ts \
  test/integration/StrictTestDimensionHttpContract.integration.test.ts --reporter=dot PASS 5 files / 52 tests
npm run probe:strict-test-main                                                       PASS
npm run lint:repo-boundary                                                           PASS
npm run lint:consumer-core-imports                                                   PASS (447 files / 608 imports)
npm run check:shared-asset-drift                                                     PASS (17 checks / 0 drift)
git diff --check 7df0517..3a591f5                                                   PASS
```

## New root-cause hypothesis

Rework 3 correctly identified a response-only provider model, but the implementation equates
`z.toJSONSchema()` output and a schema-id registry with a lossless consumer API. That assumption is
false in two independent ways:

1. Zod custom refinements are not represented by the emitted JSON Schema, so a mechanically
   generated schema can be weaker than the runtime parser while still looking closed.
2. A registry of `Record<string, unknown>` schemas describes metadata, but does not generate the
   compile-time request/path/response DTO types required by a downstream consumer.

The same representative-sample assumption also explains the incomplete HTTP evidence table: green
examples were validated against schemas, but not every advertised route/status outcome was
executed. This is a new bounded root cause, not another response-status point fix and not a
requirement mismatch requiring Design.

## Blocking raw evidence

### 1. `projectRoot` runtime/provider parity is false

Runtime `CanonicalAbsolutePath` requires a normalized absolute path through a Zod custom refine.
The generated provider/Dashboard schema for `projectRoot` contains only `type:string` and
`minLength:1`. Independent controller challenge with the same three inputs produced:

```json
{"projectRoot":"relative/project","schema":true,"runtime":false}
{"projectRoot":"/workspace/project/../project","schema":true,"runtime":false}
{"projectRoot":"/workspace/project","schema":true,"runtime":true}
```

The provider therefore tells a consumer that requests are valid when the real API must return
`400`. This contradicts rework 3's explicit requirement that runtime parsing and provider authority
share or mechanically prove the same constraints.

### 2. The generated consumer artifact has no strict-test DTO types

`lib/generated/dashboard-api-types.ts` adds `DASHBOARD_API_INPUT_SCHEMAS` and schema ids, but has no
named strict-test preflight request, run request, run-id/path, preflight/status/report DTO, success
envelope, problem union, or operation request/response mapping. `DashboardApiRouteContract`
continues to expose schema ids over `Record<string, unknown>`.

This satisfies metadata transport and byte drift, but not rework 3 step 7: generate consumer
request/path/response **types** and route metadata. A later Dashboard implementation would still
need to hand-author or cast the actual payloads, recreating the disconnected authority that this
phase exists to prevent.

### 3. The real HTTP table is not the declared complete outcome table

The real integration covers representative outcomes, including the important normal and genuine
failed-start chains, but it does not execute every advertised route/status pair. Missing examples
include preflight `422`, start `400/404`, status `422`, and report `404/422`. Unit manifest checks
prove the codes are listed; they do not prove runtime bodies reach and validate those schemas.

The target result's claim that every listed HTTP status case validates is therefore stronger than
the raw evidence. This is an evidence and regression gap under rework 3 step 5.

## Exact rework contract

Preserve all accepted behavior and close only the lossless consumer authority:

1. Replace the lossy `projectRoot` projection with one shared, explicit authority that preserves
   the current normalized-absolute-path runtime behavior and emits an equivalent consumer
   validator/schema. Do not weaken the runtime parser to `minLength:1`. If pure standard JSON
   Schema cannot represent the platform semantics, publish the explicit extension/validator and
   make generated consumer validation use it rather than claiming plain-schema parity.
2. Add a bidirectional parser/provider parity table for every strict-test input scalar and object:
   accepted and rejected demand/run ids, canonical/noncanonical hashes, normalized absolute,
   relative, dot-segment and nonnormalized project roots, unknown body fields, missing fields,
   empty/nonempty query and invalid path parameters. For each case, runtime and generated
   validation must make the same decision.
3. Generate named, readonly consumer TypeScript types from the same authority for at least:
   preflight request, start request, run-id/path parameters, preflight public DTO, run-status public
   DTO, report public DTO, success envelopes, start problem union, ordinary strict problem and an
   operation map that binds each route/status to its exact request/response type. No duplicate
   handwritten Dashboard shapes or `unknown` casts may be required to call these four routes.
4. Keep the schema registries and route metadata if useful, but add compile-time tests that construct
   valid requests/responses and mark forbidden fields/private failure data as TypeScript errors.
   The generated artifact remains Main-owned; do not edit AlembicDashboard in this package.
5. Complete the actual HttpServer table for every advertised route/status pair. Use the real
   orchestrator/private store where the outcome depends on durable behavior; use controlled
   owner-bound corruption/authority inputs to reach `422`. Every actual body must validate its
   matching provider schema and reject all other status-specific strict schemas where shapes differ.
6. Preserve the genuine first-run failure/reopen proof, same-run Agent count, automatic selection,
   private-chain integrity, error redaction, production/public sentinels and forbidden-call zeros.
7. Regenerate `lib/generated/dashboard-api-types.ts` only through its generator and keep the
   byte-for-byte drift gate.

Required verification:

```text
npm run build:check
npx vitest run test/unit/StrictTestDimensionApi.test.ts test/unit/AlembicProviderContracts.test.ts test/unit/DashboardApiTypesDrift.test.ts test/integration/StrictTestDimensionPipeline.integration.test.ts test/integration/StrictTestDimensionHttpContract.integration.test.ts
npm run probe:strict-test-main
npm run lint
npm run lint:repo-boundary
npm run lint:consumer-core-imports
npm run check:shared-asset-drift
git diff --check
```

Return one superseding clean Alembic commit and a new legal result revision with:

- parser/provider/generated parity results for all input cases;
- an extracted list of generated named strict-test types and operation mappings;
- the complete route/status execution matrix;
- the unchanged normal/failure probe JSON and production/public summaries;
- exact command outputs and clean commit/worktree identity.

## Boundaries

- Do not modify AlembicCore, AlembicAgent, AlembicDashboard, AlembicPlugin or Test.
- Do not redesign DaemonJob, legacy bootstrap, production execution or public publication.
- Do not migrate the repository-wide OpenAPI dialect or add cross-field response state unions in
  this package; those observations remain outside the confirmed repair.
- Do not revive investigated-empty or user confirmation.
