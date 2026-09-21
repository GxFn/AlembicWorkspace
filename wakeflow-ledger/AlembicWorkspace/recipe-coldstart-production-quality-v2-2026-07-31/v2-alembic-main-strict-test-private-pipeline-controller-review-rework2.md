# V2 Alembic Main strict-test private pipeline controller review — rework 2

Date: 2026-08-01

## Review conclusion

- User goal: complete the Alembic Main strict-test backend before any Dashboard or real Test phase.
- Target: `Alembic / v2-alembic-main-strict-test-private-pipeline-t1`.
- Reviewed superseding commit: `07ec74090a633a0d5a0ca9f340a18915fbc76499`, parent
  `b0f3f31494c991030f4aeae7bff75f99a07253dd`; repository worktree is clean.
- Decision: **rework**. The private execution chain and four earlier implementation defects are
  repaired, but the public provider contract still contradicts the real HTTP behavior and a failed
  durable terminal is still returned as a successful `202` response.
- Forbidden conclusion: this review does not authorize Dashboard wiring, real BiliDili Test,
  DaemonJob redesign, or Core/Agent changes.

## Independently accepted repair evidence

Controller source review and fresh execution accept these rework results and require them to be
preserved:

1. `StrictTestPublicContracts.ts` now builds explicit public whitelist DTOs; successful
   preflight/start/status/report bodies do not serialize checkpoint execution context, frozen
   source bytes, trust material, or private paths.
2. Preflight and start share `observeStrictTestPreflightAuthority()`. Fresh provider/model,
   runtime manifest/binding, source/facts, parser/fact/embed authority, strict config, private
   policy and production/public/official Recipe hashes are compared before selection and Agent
   execution.
3. The existing `AgentService -> PipelineStrategy` chain is run once and the exact G2
   `expectedTrustPolicies`, full two-module selected-cell set, authority and stage hashes are
   independently checked before private persistence.
4. Private execution reports exact Core stage boundaries. Production/public mutation is sealed as
   an integrity event instead of an ordinary private failure terminal.
5. Completed status/report reopen the owner-bound private workspace, rehash the private data tree,
   reopen the sealed private-chain artifact and compare corpus/G4/serving bindings to the terminal.
6. The real HTTP-to-DI probe runs 26 dimensions / 52 cells, automatically selects two eligible
   cells, executes one Agent pipeline with two model calls, returns `200/202/200/200`, observes
   zero private-field leaks and zero DaemonJob/reset/publication-lock/public-CAS calls, and keeps
   twelve seeded production/public artifacts byte-identical.

Fresh controller commands:

```text
npm run build:check                                                     PASS
npx vitest run <four strict unit files> <two strict integration files>  PASS 6 files / 67 tests
npm run probe:strict-test-main                                          PASS
npm run lint:repo-boundary                                              PASS
npm run check:shared-asset-drift                                        PASS
git diff --check b0f3f31..07ec740                                       PASS
```

## Blocking public-contract defects

### 1. Provider contract still advertises the wrong status matrix

The runtime route returns:

- preflight `200`;
- start `202`;
- report-before-ready `409`;
- authority/runtime failures `422`;
- missing run `404`.

However `lib/http/provider-contracts.ts` still creates all four I22 strict-test entries with the
generic row helper. `lib/generated/dashboard-api-types.ts` therefore advertises `200` as the only
success for start and contains neither the route-specific `409` nor `422` matrix. Commit
`07ec740` does not change either file. This is a real Main-to-Dashboard contract break and directly
violates the previous rework instruction to declare the `202/409/422` shapes.

### 2. Failed durable start is still wrapped as HTTP success

`POST /strict-test-dimension/runs` always serializes `start()` as `{success:true}` with status
`202`. `start()` can legally return a checkpoint whose terminal is `STRICT_TEST_FAILED`; that
terminal is therefore still exposed as a successful accepted response. Existing failure-stage
tests call the orchestrator directly and never challenge the public HTTP behavior.

### 3. Error envelopes contradict the provider schema and can expose internal details

The provider schema requires the canonical `ProblemEnvelope` produced by
`buildAlembicHttpProblem()`. `respondStrictTestError()` instead returns a small ad-hoc
`{code,message,details?}` object. It also copies `error.message` verbatim; errors such as
`STRICT_TEST_PRIVATE_WORKSPACE_OVERLAP:<resolved-root>` can disclose a private filesystem path.
Successful-body leak scans do not cover this failure surface.

## Exact repair contract

Keep the accepted private-chain changes and make only this bounded public-contract repair:

1. In `lib/http/provider-contracts.ts`, extend the route helper with an explicit route-level
   response-schema override (or an equivalently typed `successStatus` plus additional responses).
   Define closed schemas for the three public strict-test DTOs from
   `StrictTestPublicContracts.ts`; do not use the generic route-data extension as their success
   schema.
2. Declare exact I22 strict-test matrices:
   - preflight: `200`, `400`, `422`;
   - start: `202`, `400`, `404`, `422`;
   - status: `200`, `404`, `422`;
   - report: `200`, `404`, `409`, `422`.
   All non-2xx entries use the canonical provider `ProblemEnvelope`. The generic registry test
   must require at least one 2xx response, not hard-code `responseSchemas[200]` for commands whose
   success is `202`.
3. In `lib/http/routes/strict-test-dimension.ts`, project every error through
   `buildAlembicHttpProblem()` with a fixed public-safe message. Never serialize the raw internal
   error message, cause, resolved path, source content, trust material, or execution context.
4. After `start()`, build the public status DTO once. If its terminal is
   `STRICT_TEST_FAILED`, return `422` with `{success:false,error:<canonical problem>,data:<safe
   public status DTO>}`. Only a non-failed accepted/completed checkpoint returns `202` success.
5. Add public HTTP tests that prove:
   - a durable failed terminal is `422`, `success:false`, and still carries only the safe public
     status projection;
   - not-ready report is `409` and missing run is `404` using canonical problem fields;
   - an injected internal error containing a private absolute path never exposes that path or raw
     detail in the serialized body;
   - the provider manifest contains exactly the status matrices above and its response schemas
     validate the real success/failure bodies.
6. Regenerate `lib/generated/dashboard-api-types.ts` from the provider-contract single source and
   run the existing byte-for-byte drift gate. Do not edit the generated artifact by hand and do
   not copy it into AlembicDashboard in this package.

Required fresh verification:

```text
npm run build:check
npx vitest run test/unit/StrictTestDimensionApi.test.ts test/unit/AlembicProviderContracts.test.ts test/unit/DashboardApiTypesDrift.test.ts test/integration/StrictTestDimensionPipeline.integration.test.ts
npm run probe:strict-test-main
npm run lint:repo-boundary
npm run check:shared-asset-drift
git diff --check
```

Return one superseding clean Alembic commit and result revision 3. Its evidence must include the
actual failed-start HTTP JSON and an extracted route/status-to-schema matrix from the regenerated
provider artifact.

## Investigated-empty scope disposition

The Main trust-policy erasure bug is fixed and accepted: Main now validates the receipt with the
exact review-stage policy set. The requested end-to-end `investigated-empty` terminal is not an
original Main acceptance anchor. Independent source review confirms a separate cross-repository
semantic question: the full canonical Main schedule emits mandatory project-context facts while
the current Core investigated-empty predicate requires an all-`inspected-no-pattern`, zero-fact,
zero-observation denominator.

This Main package must not filter the canonical schedule, synthesize an empty receipt, or weaken
Core/Agent authority. The end-to-end empty-terminal probe is therefore removed from this Main
rework contract. The cross-repository semantic question remains a **pending product decision / code
observation**, not a new task or TODO authorized by this review. It does not excuse the provider
contract defects above.

## TODO / next action

- Rework the same Alembic task once with the exact public-contract changes above.
- Do not dispatch Dashboard or Test and do not create a Core/Agent package from the
  investigated-empty observation without separate requirement authority.
