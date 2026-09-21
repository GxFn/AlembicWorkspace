# V2 Main strict-test private pipeline — execution plan

Task: `v2-alembic-main-strict-test-private-pipeline-t1`

## Fixed authority and boundary

- Main baseline: `c95dccb87bdc5a8412792f97917aed6992024b7e`.
- Accepted Agent producer: `8688311c3970054c68a74b0ce30d8f3db4f15be6`.
- Only Alembic Main source, tests, scripts, and package metadata may change.
- The profile must never call legacy bootstrap/DaemonJob, production reset/setup,
  publication locking, public CAS, or public route mutation.
- Dashboard, Plugin, Core, Agent, Test, and real BiliDili execution remain outside
  this package.

## Acceptance-anchor RED mapping

| Anchor | RED test/probe seam | Expected RED before implementation | Required GREEN |
| --- | --- | --- | --- |
| `v2-main-explicit-profile-entry` | `StrictTestRequestContracts.test.ts`, `StrictTestDimensionApi.test.ts`, and `StrictTestDimensionHttpContract.integration.test.ts` through the mounted Main router | strict-test contracts/router are absent; exact requests cannot enter and invalid production/legacy/manual fields have no dedicated fail-closed boundary | only the exact independent preflight/runs/status/report surface enters; mixed, legacy, environment, dimension, confirmation, and production fields are rejected without a bootstrap job |
| `v2-main-automatic-selection-authority` | `StrictTestDimensionOrchestrator.test.ts` and the real Main pipeline integration using current facts and a complete compiled 26-dimension Plan | no Main preflight/automatic-selection/projection owner exists | the backend recommendation selects exactly one supported non-empty dimension and all eligible cells while conserving every full-universe hash; unknown/empty/stale/binding drift fails before Agent invocation |
| `v2-main-same-run-agent-receipt` | `StrictTestDimensionPipeline.integration.test.ts` with the public real `AgentService`, controlled provider, call counters, and receipt tamper matrix | Main does not request or consume `strictTestExecutionReceipt` | exactly one existing Agent pipeline supplies the completed same-run receipt; missing/partial/cross-run/reordered/extra/missing/rehashed evidence causes zero private writes |
| `v2-main-private-chain-nonmutation` | `StrictTestPrivateWorkspace.test.ts`, pipeline integration, and `probe:strict-test-main` with production snapshots plus reset/publication/CAS counters | no isolated strict-test root or private-only chain exists | selected cells traverse real corpus/ref/index/seal/G4/vector/serving validation only under the derived private root; production/public hashes remain equal and forbidden call counts stay zero, including injected stage failures |
| `v2-main-durable-terminal-report` | orchestrator/API unit tests, HTTP integration, and the deterministic Main probe reopening success and failure from disk | there is no durable strict-test status/report | restart reads canonical Core `STRICT_TEST_COMPLETED_PRIVATE` or correctly staged `STRICT_TEST_FAILED` terminal/report with conserved lineage and both production flags false |

All five seams are testable from existing public Main or accepted package
boundaries; no replacement requirement is needed.

## Ordered implementation

1. Pin the clean baseline and run `build:check` plus the nearest strict suites.
2. Add exact Main-owned request contracts and a distinct HTTP router/service
   wiring; observe and preserve RED/GREEN for explicit entry isolation.
3. Add the sole strict-test orchestrator preflight, derived private-workspace
   policy, automatic selection, and projection; verify full authority and
   pre-Agent failures.
4. Extend the existing strict analysis runtime at its real port boundary to
   consume and independently validate the accepted same-run Agent receipt;
   verify one real Agent execution and tamper failures before private writes.
5. Parameterize existing private corpus/finalization components only where
   needed for selected cells and private-only G4/serving completion; prove
   production/public non-mutation and forbidden-call zero counts.
6. Persist and reopen Core canonical success/failure terminal and audit report,
   then mount status/report from the real Main server.
7. Add `probe:strict-test-main`, run every package-required focused/regression/
   full check, two-stage self-review, scoped Guard when available, and commit one
   clean Main change.
8. Record `TargetResultEnvelope` with exactly one RED/GREEN craft entry for each
   authored anchor and complete the permitted controller return.

## Completion boundary

This package proves only the Main private strict-test backend and its production
non-mutation. It does not wire Dashboard, expose public MCP data, run real Test,
or claim controller acceptance/final demand completion.

## Rework 1 — controller verdict response and RED map

Controller review: `v2-alembic-main-strict-test-private-pipeline-controller-review-rework1.md`.
Baseline at `b0f3f31494c991030f4aeae7bff75f99a07253dd`: the six focused files pass
53/53, so the returned defects are missing/incorrectly modelled behavior rather
than inherited suite failures.

| Original anchor | Rework RED seam | Expected RED on `b0f3f31` | Required GREEN |
| --- | --- | --- | --- |
| `v2-main-explicit-profile-entry` | Public DTO tests plus `HttpServer -> real ServiceContainer -> real strict-test orchestrator`; recursively scan preflight/start/status/report bodies and challenge legacy bootstrap | start/status serialize the private checkpoint, including `executionContext`, certified source `contentBase64`, `runRoot`, and private trust/path material; the existing HTTP integration substitutes a mock service | exact 200 preflight, 202 accepted start, 200 status/report DTOs expose only safe run/selection/terminal/report fields; real DI is used and a forbidden legacy request creates zero DaemonJob |
| `v2-main-automatic-selection-authority` | Real start revalidation probes that mutate provider/model, runtime manifest, source bytes, and owner/private policy after accepted preflight, with Agent/provider counters | only production/public/policy/source carrier hashes are refreshed; provider and manifest drift can pass to automatic selection/Agent | one Main-owned fresh observer rebuilds and compares every frozen semantic binding before selection; all four drift classes stop with zero Agent/model calls |
| `v2-main-same-run-agent-receipt` | Real investigated-empty pipeline plus a two-module/two-cell selected dimension and receipt missing/reordered/extra/rehashed challenges | legal investigated-empty receipt is rejected because Main validates against `[]` trust policies; current fixture has only one cell | Main supplies the exact same-run review-stage `expectedTrustPolicies` to the public Agent validator and independently conserves the full two-cell receipt lineage before private writes |
| `v2-main-private-chain-nonmutation` | Seed DB/WAL/SHM, Recipe/ref/index/session/config, bundle/manifest/route sentinels; use actual bootstrap/DaemonJob/reset/publication/CAS spies; inject persistence, seal, index/vector, G4 and serving failures | probe counters are constants and most failures collapse to `PRIVATE_WORKSPACE_READY`; mutation can be persisted as an ordinary failed terminal | actual instrumentation remains zero, every sentinel hash is byte-identical, each injected boundary persists its exact Core failure stage, and detected production/public mutation returns a typed fail-closed response rather than a normal private terminal |
| `v2-main-durable-terminal-report` | Restart fresh orchestrator then alter/delete owner, alias private data, delete/alter private-chain/corpus/index/G4/serving artifacts; inspect status/report | durable reads validate only embedded checkpoint hashes and can still return completed | completed status/report reopen owner/policy/workspace and all terminal-bound private artifacts; any owner/alias/missing/hash drift returns a typed integrity failure and never a completed DTO |

Every original anchor has an executable RED seam. The controller's five blocking
defects and evidence repairs stay within those anchors; no new product scope is
introduced.

### Rework execution order

1. Add public DTO and durable integrity RED tests; fix the public seam and reopen
   verification first because later HTTP evidence depends on both.
2. Add the fresh-binding observer and four pre-Agent drift RED probes, then make
   preflight and start share it without changing receipt timestamps.
3. Add real investigated-empty and multi-cell receipt RED cases; pass the sealed
   trust policy set and extend Main's independent lineage checks.
4. Add typed stage instrumentation/fault injection and real forbidden-operation
   counters; make every private boundary report its exact Core stage and make
   non-mutation drift fail closed outside ordinary private failure reporting.
5. Replace the mock HTTP/probe evidence with real DI, seeded production/public
   sentinels and measured counters; run focused, regression and full checks.
6. Re-read the package/rework verdict, perform two-stage self-review, create one
   superseding clean commit, and return result revision 2 through the rework1
   dispatch group.

### Rework execution finding — investigated-empty contract conflict

The trust-policy implementation defect is repaired: Main now retains the exact
same-run G2 `expectedTrustPolicies` and passes that set into the public Agent
receipt validator. A real empty-source RED probe still cannot reach the required
`investigated-empty` terminal through the unmodified canonical Main preflight.

The probe used the real full compiled Plan, Main fact backends, `AgentService`,
`PipelineStrategy`, and durable private chain. Its schedule contained terminal
`inspected-no-pattern` receipts for the AST/config families, but the mandatory
`architecture-dependency`, `history-fix-pattern`, and
`synthesis-cross-cutting` project-context obligations emitted matched facts.
Consequently the Agent population was non-empty and correctly closed the cell
as `rejected`, not `investigated-empty`.

This conflicts with the Core investigated-empty predicate in
`SemanticDispositionReviewExecution.ts`: every final-schedule execution receipt
must be `inspected-no-pattern`, every emitted fact set must be empty, and the
population must contain zero observations. Main's current canonical compiler
always schedules the complete registered fact-query catalog, so the requested
real empty terminal cannot be manufactured by changing only trust validation.
Filtering the schedule, synthesizing a receipt, or weakening the Core predicate
would add requirements or cross the explicitly forbidden Core/Agent contract
boundary. The target result must therefore remain `needs-review` unless the
controller supplies an authorized schedule/applicability rule or a Core/Agent
contract decision.

### Rework implementation and verification record

- Public HTTP responses are now constructed from explicit nested whitelists;
  preflight/start/status/report never serialize the private checkpoint, source
  bytes, trust material, run root, or private filesystem paths.
- Start revalidation re-observes provider/model, runtime artifacts and binding,
  source and Certified Project Facts lineage, private workspace policy, strict
  config, production/public/official state, and fact/parser/embed authorities
  before automatic selection or Agent invocation.
- Main validates the accepted Agent receipt against the exact same-run authority,
  review trust policies, schedule/manifest/fixpoint, analysis/review evidence,
  and the complete two-module selected-cell set before private persistence.
- The real private corpus/ref/index/G4/serving chain records exact stage
  boundaries. Completed status/report reopens the owner/workspace, verifies the
  sealed private-chain checkpoint, recomputes the full private data snapshot,
  and checks terminal coverage/G4/serving bindings.
- Mutation detection writes a sealed private integrity artifact and raises
  `STRICT_TEST_PRODUCTION_MUTATION_DETECTED`; it does not mint an ordinary
  canonical failure terminal over mutated production/public state.

Verification completed on 2026-08-01:

- `npm run build:check` — pass.
- Focused five-file strict-test suites — 47 tests pass.
- Full real pipeline integration — 20/20 pass; the ten receipt mutation cases
  separately pass for two modules, 52 universe cells, and two selected cells.
- Corrected `PRIVATE_INDEXES_VERIFIED` fault probe — 1 pass, 19 skipped; the
  stage is emitted only after vector generation activation and healthy
  inspection.
- `npm run probe:strict-test-main` — pass with HTTP 200/202/200/200,
  report-before-start 409, wrong authority 422, legacy activation 400, 26
  dimensions/52 cells, two selected cells, one Agent pipeline, two model calls,
  zero public leaks, zero DaemonJob/reset/publication-lock/public-CAS calls, and
  all 12 seeded production/public artifacts byte-identical.
- `npm run lint`, `npm run lint:repo-boundary`,
  `npm run check:shared-asset-drift`, changed-file `npx biome check`, and
  `git diff --check` — pass. Repository lint retains only five unrelated
  pre-existing `noExplicitAny` warnings.

Two-stage self-review found and fixed one P1 stage-order defect (index completion
was initially reported before vector rebuild). Requirements review confirms the
remaining investigated-empty gap is not safely implementable inside this task's
repository and contract boundaries, so the target outcome remains
`needs-review`, with the validated in-scope repairs committed for controller
inspection.

## Rework 2 — recurring-problem root cause and execution plan

Baseline is clean at `07ec74090a633a0d5a0ca9f340a18915fbc76499`; the current
provider/API/drift unit baseline passes 3 files / 20 tests. Controller rework 2
removes investigated-empty from this Main package and preserves every accepted
private-chain repair.

### Root-cause re-derivation

The recurring defect is not in the private pipeline. The public HTTP route and
provider manifest have two independent truth sources: `route()` always derives
a generic 200-centric response matrix, while `strict-test-dimension.ts` chooses
runtime statuses and writes ad-hoc error objects. The generated Dashboard
artifact faithfully reproduces the wrong provider manifest, so regeneration
cannot repair the mismatch until the provider contract is route-specific.
Likewise, the start handler assumes any resolved orchestrator result is an
accepted success, even though a durable failed checkpoint is a legal resolved
value. The bounded fix is therefore to make provider response schemas explicit
at the route authority, then make the router emit only those schemas through a
single safe problem projection.

### Rework-point response

1. Wrong provider status matrix: agree; add an explicit route response-schema
   override, closed strict-test DTO schemas, exact I22 matrices, and relax only
   the generic registry invariant from status 200 to at least one 2xx.
2. Failed durable start returned as 202 success: agree; project the status once,
   detect `STRICT_TEST_FAILED`, and emit a 422 canonical problem plus that safe
   status projection.
3. Ad-hoc/raw errors: agree; replace all strict-test errors with
   `buildAlembicHttpProblem()` and fixed public-safe messages, never raw error
   text/details/causes/paths.

### Acceptance-anchor RED mapping

| Anchor | Rework 2 RED seam | Expected RED on `07ec740` | Required GREEN |
| --- | --- | --- | --- |
| `v2-main-explicit-profile-entry` | `StrictTestDimensionApi.test.ts` and `AlembicProviderContracts.test.ts` validate real public envelopes and exact route matrices | failed start is 202 success; errors are non-canonical; manifest advertises generic 200 | failed start is canonical safe 422, normal start remains 202, and exact preflight/start/status/report matrices validate actual bodies |
| `v2-main-automatic-selection-authority` | existing real Main HTTP/DI probe plus provider success schemas | runtime authority behavior is green but its public contract is generic | preserve 26/52 authority and automatic selection; preflight/start closed DTO schemas accept the real body |
| `v2-main-same-run-agent-receipt` | existing two-module receipt matrix and real Main probe | private-chain evidence is already accepted | preserve single-pipeline receipt checks; no provider repair changes Agent consumption |
| `v2-main-private-chain-nonmutation` | existing real production sentinels/spies and serialized error path challenge | success bodies are safe, but raw failures may expose private paths | private failure paths are redacted through canonical problem envelopes while all nonmutation evidence remains green |
| `v2-main-durable-terminal-report` | HTTP failed-start/not-ready/missing-run tests plus report/status provider schemas | durable failure is misclassified as success and report errors contradict schema | durable failed start is 422 with safe status data; 404/409 use canonical problems; status/report schemas are closed and exact |

### Ordered implementation

1. Add the HTTP and provider-manifest RED assertions and capture their failures.
2. Add closed public DTO schemas and explicit response-schema overrides in
   `provider-contracts.ts`; update the generic registry invariant.
3. Replace strict-test route errors with one fixed-message canonical problem
   builder and classify resolved failed starts as 422.
4. Make the authored RED tests green, regenerate
   `lib/generated/dashboard-api-types.ts` only through the generator, and run
   the byte-for-byte drift gate.
5. Run the required focused suite and real probe, perform two-stage self-review,
   commit a single scoped Alembic change, then return result revision 3.

### Rework 2 RED/GREEN and verification record

The pre-implementation RED run was:

`npx vitest run test/unit/StrictTestDimensionApi.test.ts test/unit/AlembicProviderContracts.test.ts test/unit/DashboardApiTypesDrift.test.ts --reporter=verbose --silent=passed-only`

It failed 6 of 24 assertions across all three files: the provider and generated
matrices were generic/200-centric, real integer-valued public status data did
not validate against the canonical problem extension schema, 404/409 responses
were ad-hoc, durable failed start was incorrectly 202 success, and raw private
error paths were exposed. These failures directly covered the controller's
three rework points before implementation.

GREEN implementation keeps the provider manifest as the authority: the four
I22 routes now own exact response matrices and closed preflight/status/report
DTO schemas, while the generated Dashboard artifact is derived only by
`npm run generate:dashboard-types`. The strict router projects resolved results
before response selection, maps a durable failed terminal to HTTP 422 with its
safe public status DTO, and constructs every non-2xx response with the Core
problem taxonomy. Fixed public messages and sanitized error codes prevent raw
causes, paths, checkpoints, source bytes, or trust material from crossing the
HTTP boundary. The generic JSON extension schema now uses `anyOf` because a
JSON integer is also a JSON number; the old `oneOf` made otherwise valid
canonical failure data self-contradictory.

Fresh verification on 2026-08-01:

- `npm run build:check` — PASS.
- Controller-required focused suite — 4 files / 44 tests PASS, including the
  20-case real Main/Agent/private pipeline integration.
- `npm run probe:strict-test-main` — PASS: HTTP 200/202/200/200; pre-start
  report 409, wrong authority 422, legacy activation 400; 26 dimensions, 52
  cells, 12 eligible cells, two selected cells, one Agent pipeline, two model
  calls; zero public leaks and zero DaemonJob/reset/publication-lock/public-CAS
  calls; all 12 seeded production/public surfaces byte-identical.
- Actual failed-start HTTP integration — PASS with status 422, canonical Core
  problem fields, safe public `STRICT_TEST_FAILED` status data, and no
  `runRoot`, `executionContext`, `contentBase64`, or `/private/` content.
- Generated matrix extraction — preflight `200/400/422`, start
  `202/400/404/422`, status `200/404/422`, report `200/404/409/422`.
- `npm run lint`, changed-file Biome, `npm run lint:repo-boundary`,
  `npm run lint:consumer-core-imports`, `npm run check:shared-asset-drift`, and
  `git diff --check` — PASS. Full lint reports only the same five unrelated
  pre-existing `noExplicitAny` warnings outside this change.

Two-stage self-review found no remaining P0/P1 issue. Requirements review
confirms all five task anchors remain covered and the rework touches only the
bounded Main public contract/projection/tests/generated artifact; no Core,
Agent, Dashboard source, production root, official Recipe, public route, or
legacy transport was changed. Code-quality review confirms every actual route
body validates against its advertised schema, error messages/codes are safe,
and generation drift is zero. The prior investigated-empty concern is excluded
from this rework package by the controller and is not treated as residual work.

## Rework 3 — complete route authority and real failed-start evidence

Baseline is clean at `7df05174c5df6319c3e183405e0655cc556594c9`; the
controller-required five-file baseline passes 5 files / 45 tests. Live state
revision 23 is the legitimate delivery-sent advancement from prompt revision
22. Repository, window, task, package, dispatch group, and controller-return
identities all match.

### Recurring-problem root cause

Rework 2 repaired response selection, but it stopped at a response-only
contract. Runtime parsing remains authoritative in Zod while the provider and
generated artifact omit POST bodies, path parameters, and the exact empty GET
query. This leaves the public route contract unable to prove the same closed
request authority that the router enforces. The same partial model caused two
response gaps: status/report can return 400 although their advertised matrices
omit it, and start 422 reuses the generic extensible problem schema even though
only a closed safe status projection may accompany a genuine durable failure.

The failed-start evidence has the same structural cause: the isolated router
test supplies a mocked failed checkpoint, while the real orchestrator persists
the failed terminal and then throws. The existing catch path does not reopen
that same run, so real HTTP cannot return its durable public status. The bounded
repair is to derive JSON request authority mechanically from the runtime Zod
schemas, carry it through provider/OpenAPI/generated metadata, close the strict
problem schemas, and let the route reopen only an owner-bound failed checkpoint
after a real `start()` exception. No Core, Agent, Dashboard source, legacy,
production, official Recipe, or public publication surface is in scope.

### Rework-point response

1. Missing GET 400 authority: agree; add 400 to status/report so every reachable
   runtime status is advertised and body-validated.
2. Open start 422 extension: agree; replace the generic extension with a closed
   route-specific union of canonical problem-without-data or canonical problem
   with exactly the public strict status DTO.
3. Missing request/path/query authority: agree; mechanically derive draft-07
   schema fragments from the exact runtime Zod parsers and carry them through
   provider/OpenAPI/generated metadata without changing the global OpenAPI
   dialect.
4. Mock-only failed-start evidence: agree; retain router isolation, add a real
   DI/HTTP/orchestrator stage-failure run, and reopen the persisted same-run
   failure only when run, demand, preflight, owner, and terminal state match.

### Acceptance-anchor RED mapping

| Anchor | Rework 3 RED seam | Expected RED on `7df0517` | Required GREEN |
| --- | --- | --- | --- |
| `v2-main-explicit-profile-entry` | provider/OpenAPI/generated tests assert exact preflight/start bodies, required `{runId}`, empty GET query, and all reachable status matrices | provider exposes responses only; status/report 400 are absent | independent strict route owns closed request, path, query, and response authority; production/legacy activation remains rejected |
| `v2-main-automatic-selection-authority` | existing real preflight/start integration plus mechanically shared body constraints | runtime 26/52 authority is green but public request authority cannot prove caller selection fields are impossible | exact preflight/start schemas reject caller-supplied dimension/cell/confirmation fields while preserving backend recommendation and full 26/52 freeze |
| `v2-main-same-run-agent-receipt` | real DI/HTTP first-stage failure plus durable reopen; existing normal and receipt-drift matrices | mock service can produce 422, but the real orchestrator throws after persisting failure and the route loses the durable status | one real Agent/private run produces the same-run result; real thrown stage failure reopens only its matching durable terminal and never consumes cross-run or drifted data |
| `v2-main-private-chain-nonmutation` | Ajv challenge rejects private-shaped start 422 data; real HTTP table validates all reachable failures and production/public sentinels | generic problem `data` accepts arbitrary private-shaped objects | no strict error schema accepts private checkpoint/path/source/trust extensions, and the real private chain preserves all production/public sentinels |
| `v2-main-durable-terminal-report` | real HTTP table covers invalid POST/query/runId, missing run, not-ready report, wrong authority, real failed start/reopen, and normal completion | real failed start has no route-level reopen evidence; status/report 400 are contract drift | every reachable actual body validates its exact route schema; real failure is durable/reopenable and normal canonical terminal/report stays green |

### Ordered implementation

1. Author provider, generated-drift, API, and real HTTP RED probes for all five
   anchors and capture the failing run before production edits.
2. Export draft-07 JSON schema fragments mechanically from the runtime Zod
   parsers; extend provider route metadata and OpenAPI generation with closed
   request body, required path parameter, and exact query authority.
3. Correct all four response matrices and define route-specific closed problem
   schemas, including the safe start 422 union.
4. Reopen a same-run durable failed checkpoint after a real orchestrator throw,
   validate its owner/authority before projection, and otherwise emit only the
   generic canonical 422 problem.
5. Regenerate the Dashboard API artifact through its generator, make the RED
   suite green, run all task verification gates, perform requirements and
   severity self-review, commit one scoped change, and return a new result
   version and one legal controller callback.

### Rework 3 RED evidence

The pre-production focused RED run preserved the prior green behavior and
failed only at the newly authored seams: generated and provider status matrices
omitted status/report 400; provider and generated routes had no request body,
path, or query schema authority; actual GET 400 bodies had no advertised schema;
and the start catch path never called `status(runId)` to reopen the durable
failure. The run was intentionally stopped after these failures and several
unchanged real-pipeline cases had passed, avoiding a second full baseline while
still proving that all four rework defects were red before implementation.

### Rework 3 GREEN, self-review, and verification record

Implementation commit: `3a591f59d0b3cf598a0cdb8901034672094a5e23`.

The exact runtime Zod parsers now mechanically emit embedded draft-07 schemas
for preflight/start bodies, run ids, and the empty query authority; local
`$schema` markers are stripped so the existing OpenAPI 3.0 dialect remains
unchanged. Provider, OpenAPI, and generated Dashboard metadata all carry those
same closed inputs plus required `{runId}` path authority. The final matrices
are preflight `200/400/422`, start `202/400/404/422`, status
`200/400/404/422`, and report `200/400/404/409/422`.

Strict errors no longer reuse the generic route-data extension. Every ordinary
strict problem forbids `data`; start 422 is a closed union whose only data-bearing
branch requires the exact public status DTO. Ajv accepts canonical no-data and
durable-failure bodies while rejecting private-shaped extensions. Both resolved
start results and thrown-start recovery must match demand, run, and preflight.
Recovery additionally requires a failed terminal with stage/error and a sealed
report hash before the route publishes the safe status projection.

The real integration table covers invalid POST, nonempty GET query, invalid
run id, missing run, report-before-ready, wrong authority, normal completion,
first real `EXPRESSION_SETS_REVIEWED` failure, and durable failed status/report
reopen. The failure evidence is produced by the real HttpServer → DI →
orchestrator → AgentService/PipelineStrategy chain, not the router-isolation
mock. The normal and failed runs each execute exactly one Agent pipeline; all
seeded production/public surfaces remain byte-identical and all forbidden
DaemonJob/reset/publication-lock/public-CAS observations remain zero.

Final verification on 2026-08-01:

- `npm run build:check` — PASS.
- Controller-required five-file suite — 5 files / 52 tests PASS.
- `npm run probe:strict-test-main` — PASS; normal HTTP `200/202/200/200`,
  26 dimensions / 52 cells / 12 eligible cells / two selected cells, one Agent
  pipeline / two model calls; nested genuine failed-start evidence is HTTP 422,
  durable status/report reopen is 200, and its Agent pipeline count is one.
- `npm run lint` — PASS with the same five unrelated pre-existing
  `noExplicitAny` warnings.
- `npm run lint:repo-boundary` — PASS.
- `npm run lint:consumer-core-imports` — PASS (447 files / 608 Core imports).
- `npm run check:shared-asset-drift` — PASS (17 checks, zero drift).
- Changed-file Biome and `git diff --check` — PASS.

Stage-1 requirements review: all five original anchors and all four rework-3
points are covered end to end; changes remain within the Alembic Main HTTP
contract/router/generator/probe/tests and preserve the accepted private chain.
No Core, Agent, Dashboard source, legacy transport, production root, official
Recipe, or public route was changed. Stage-2 severity review found and fixed
one P1 before commit: a resolved service result also needed authority validation,
and a reopened failure needed proof of a durable report, not only a failed phase.
After those repairs and the final full rerun, no P0/P1/P2 finding remains.

## Rework 4 — lossless consumer authority and complete HTTP outcome evidence

Baseline commit is `3a591f59d0b3cf598a0cdb8901034672094a5e23` with a
clean worktree. Prompt revision 25 and live revision 26 are consistent: revision
26 is the recorded rework4 delivery send. Window `Alembic`, repository, task,
package, dispatch group, controller return, and upstream Agent identities match.

### Recurring-problem root cause

Rework 3 correctly made runtime Zod parsers the mechanical JSON Schema source,
but that source is not lossless for `CanonicalAbsolutePath`: Zod custom
normalization refinements disappear from `z.toJSONSchema()`. The resulting
provider/generated schema accepts relative and dot-segment paths that the real
Main parser rejects. The generated consumer file also transports schemas as
`Record<string, unknown>` metadata without named request/path/response DTOs or
an operation type map. Finally, the integration table proves representative
HTTP outcomes rather than every status advertised by the four routes. These are
three manifestations of one bounded consumer-authority defect, not a private
pipeline defect or a requirement redesign.

### Rework-point response

1. Lossy `projectRoot` projection: agree. Preserve runtime normalized absolute
   path behavior through one explicit authority, publish its consumer
   validation semantics, and challenge parser/generated validation parity.
2. Missing generated DTO/operation types: agree. Generate named readonly
   strict-test request, path, public DTO, envelope/problem, and operation-map
   types from the Main authority; do not hand-edit the generated artifact or
   add Dashboard source.
3. Incomplete real HTTP table: agree. Execute every advertised route/status
   pair through `HttpServer`; use real durable state where outcomes depend on
   the orchestrator and owner-bound controlled corruptions for remaining 422s.

### Acceptance-anchor RED mapping

| Anchor | Rework 4 RED seam | Expected RED on `3a591f5` | Required GREEN |
| --- | --- | --- | --- |
| `v2-main-explicit-profile-entry` | table-driven parser/provider/generated validator parity for exact POST bodies, run-id paths, empty GET query and normalized project roots; compile-time generated operation request types | relative and dot-segment `projectRoot` pass provider/generated validation while runtime rejects; generated routes expose only schema ids over `unknown` | every accepted/rejected strict input has the same runtime/generated decision, and named operation request/path types make manual/legacy/production fields compile-time errors |
| `v2-main-automatic-selection-authority` | generated preflight/start public DTO and operation types plus the existing real 26/52 Main run | runtime authority is green, but consumers have no typed full-authority preflight/selection result and can construct payloads only through untyped metadata | readonly generated public DTOs conserve full/selected authority and the real run remains one backend-selected dimension with all eligible cells |
| `v2-main-same-run-agent-receipt` | complete real HttpServer matrix including normal start, genuine thrown failed start/reopen, wrong authority and all start error statuses; preserve pipeline/model counts | normal/failure chains pass, but not every advertised start outcome is executed and schema-checked | every actual start body validates only its exact status schema while the normal and genuine failed runs retain exactly one same-run Agent pipeline |
| `v2-main-private-chain-nonmutation` | complete real route/status matrix plus unchanged normal/failure probe sentinels, leak scan and forbidden-call counters | private chain/nonmutation is green, but unexecuted advertised error outcomes leave response redaction and schema claims incomplete | every advertised error body is exercised and schema-validated without private fields; all production/public sentinels remain equal and forbidden calls remain zero |
| `v2-main-durable-terminal-report` | real status/report `200/400/404/409/422` table using durable success/failure plus owner-bound authority/corruption inputs; compile-time public status/report DTO checks | success/failure reopen is green, but status `422` and report `404/422` are not executed against `HttpServer` and generated consumer types are absent | every advertised status/report outcome is reached and validates its exact schema; named readonly terminal/report types preserve completed/failed lineage and false production flags |

All five original anchors remain testable. Rework4 adds no new product behavior;
it makes the already-required exact Main API authority lossless and proves its
complete advertised HTTP algebra.

### Ordered implementation

1. Run the controller-required five-file suite plus build check at `3a591f5` and
   record the clean baseline.
2. Add RED parity cases, compile-time type assertions, and the missing real
   route/status rows; capture the expected failures before production changes.
3. Replace lossy path projection with one shared runtime/consumer validator
   authority and make all scalar/object/query/path parity rows green.
4. Extend the generator to emit named readonly strict-test DTO/envelope/problem
   types and an exact operation map; regenerate only through the existing script
   and keep byte drift zero.
5. Complete the real HttpServer route/status table without weakening owner,
   authority, persistence, redaction, or production/public isolation.
6. Run the normal and genuine failed probe unchanged, every required gate,
   two-stage spec/severity self-review and the point-by-point rework response;
   commit one scoped Alembic change and return one new result revision through
   rework4.

### Rework 4 RED evidence

The clean baseline at `3a591f59d0b3cf598a0cdb8901034672094a5e23`
passed `npm run build:check` and the controller five-file suite (5 files / 52
tests). Three new seams then failed independently before implementation:

- provider validation accepted five `projectRoot` values rejected by the real
  parser: relative, dot-segment, duplicate-separator, double-leading-separator,
  and current-host Windows-style paths;
- the isolated consumer `tsc` probe reported all 13 required named strict-test
  request/path/public/problem/operation exports missing from the generated
  artifact;
- the real Main HTTP matrix proved only 11 of 17 advertised cells and failed
  with the exact missing set: preflight 422, start 400/404, status 422, and
  report 404/422.

The self-review type-guard probe added after the first GREEN also failed as
intended: successful runtime validation left request/report values typed as
`unknown`. That was corrected before the final verification.

### Rework 4 GREEN implementation

`CanonicalAbsolutePath` now publishes the stable custom format
`alembic-canonical-absolute-path-v1` and calls the same exported Node
path-dialect predicate used by provider/generated validation. The mechanically
generated schema retains both `format` and `x-alembic-validator`; consumer
validation requires an injected format implementation and returns false when
it is absent. The parity table challenges normalized absolute roots, root and
trailing separators, spaces, dot-prefixed basenames, NUL preservation,
relative/dot/double-separator paths, the opposite platform dialect, empty
strings, and directly compares each provider result with the runtime parser.

The Dashboard contract generator now projects provider JSON Schema into named
readonly strict-test request, empty-query/path, run-path, public preflight,
public status, public report, canonical problem, success, and start-problem
types. A closed four-operation map binds request and numeric response cells.
Generated request/response validators consume the committed schema registries,
apply injected custom formats fail-closed, reject undeclared cells, and act as
operation-aware TypeScript type guards. `package.json` makes the positive and
`@ts-expect-error` consumer fixture part of `typecheck` and `build:check`, so
caller dimension/confirmation/production authority, GET bodies, path/query
extras, private response fields, mutation of readonly DTOs, and undeclared
statuses are compile failures.

The real `HttpServer` integration now executes the exact complete matrix:
preflight `200/400/422`, start `202/400/404/422`, status `200/400/404/422`,
and report `200/400/404/409/422`. Missing-run and parser errors use real HTTP;
preflight 422 replays one durable run with drifted project authority; status
and report 422 temporarily corrupt the completed run's owner policy hash and
restore it in `finally`. Every body is checked against its exact provider
schema and the public leak scanner. The same run still executes one real
AgentService/PipelineStrategy chain, and production/public snapshots plus all
forbidden-call counters remain unchanged.

### Rework 4 verification and self-review

Final verification on 2026-08-01:

- `npm run build:check` — PASS, including the generated consumer type gate.
- Controller five-file suite — 5 files / 67 tests PASS in 92.49s.
- Final delta probes after operation-aware type guards — consumer `tsc` PASS;
  generated runtime/provider tests PASS; the real 17/17 HTTP matrix PASS.
- `npm run probe:strict-test-main` — PASS: 26 dimensions / 52 cells / 12
  eligible cells, backend-selected `agent-guidelines` with two selected cells,
  one Agent pipeline / two model calls, completed and genuine failed durable
  reopen, byte-identical production/public surfaces, zero public leaks, and
  zero DaemonJob/fullReset/publication-lock/public-CAS calls.
- `npm run check` — PASS end to end: all static gates, unit suite, integration
  suite (34 files / 502 passed / 10 skipped), coverage (89.1% statements),
  shared-asset drift (17 checks / zero drift), retired-symbol and ring-direction
  gates. Lint retains only the same five unrelated pre-existing `noExplicitAny`
  warnings.
- `npm run check:dashboard-types-drift`, `npm run lint:repo-boundary`,
  `npm run check:shared-asset-drift`, and `git diff --check` — PASS.

Stage-1 requirements review found all five original anchors covered end to end:
the exact explicit entry is lossless, the 26/52 backend selection remains
unchanged, same-run receipt and private-chain evidence remain real, all 17 HTTP
cells are schema/redaction checked, and both terminal states remain durable.
No Core, Agent, Dashboard source, Plugin, Test-window, legacy transport,
production root, official Recipe, or public route was changed.

Stage-2 severity review found and fixed one P1 consumer usability gap before
the final gates: boolean validators did not narrow validated values. The final
generated functions are operation-aware type guards. Review of custom format
absence, platform dialect, `oneOf`/`allOf`/`not`, exact object keys, undeclared
statuses, tamper restoration, and production/public sentinels found no
remaining P0/P1/P2 issue.

Implementation commit:
`b50bff157448b4986064ddbe20d8d2ad9305c738`; parent:
`3a591f59d0b3cf598a0cdb8901034672094a5e23`; tree:
`dcee80f426f6c5c6f8b8a9bedf6d14a12674c016`. The post-commit generated
byte-drift check passed and `git status --short` is empty.
