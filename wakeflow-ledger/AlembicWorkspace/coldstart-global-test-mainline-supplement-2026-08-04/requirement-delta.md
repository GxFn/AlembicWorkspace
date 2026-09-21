# Cold-start Global Test Mainline Supplement

Date: 2026-08-04

## User-authorized delta

The user rejected the separate `strict-test-dimension` product lane and confirmed this replacement:

- cold start remains the real destructive clear-and-rebuild operation;
- the existing global test-mode state changes only the selected execution scope;
- normal mode executes all applicable dimensions;
- test mode deterministically executes exactly one applicable dimension;
- both modes use the same current production cold-start pipeline;
- one frontend action is sufficient; there is no dimension picker, second confirmation, dedicated
  strict-test API, private test pipeline, execution receipt lane, or frontend-generated
  `strictProduction` authorization object;
- the existing trash mechanism is the recovery trace for destructive cleanup;
- the public `/jobs/bootstrap` job transport must not fall back to legacy bootstrap.

This delta supersedes the rejected private/non-destructive strict-test supplement and its V2
implementation history. It does not remove the production-quality semantic Plan, fact harvest,
Analyst, Producer, review, persistence, indexing, or publication work that remains a real consumer
of the cold-start pipeline.

## Existing requirement authority

- The production-quality goal and quality gates remain anchored in
  `Design/docs/current/recipe-coldstart-production-quality-original-plan-2026-07-15.md` and
  `Design/docs/current/recipe-coldstart-production-quality-requirement-design-2026-07-15.md`.
- The rejected split was removed and accepted under
  `wakeflow-ledger/workspace/archive/2026-08/strict-test-split-removal-2026-08-03/`.
- The user's current decisions replace earlier statements that test mode is private,
  non-destructive, manually confirmed, or activated through a dedicated API/receipt lane.

## Goal

Connect the Dashboard clear-and-rebuild action to one Alembic Main cold-start job whose ordered
runtime is:

1. read-only project/preflight facts;
2. applicable-dimension resolution;
3. global test-mode scope filtering;
4. fail-closed trash snapshot/move and database reset;
5. the same production Plan-to-publication pipeline in either mode;
6. a durable Job result that exposes selected dimensions, terminal status, and trash reference.

## Completion definition

The supplement is complete only when all of the following are true:

1. `/jobs/bootstrap` is the single Dashboard cold-start entry and does not accept or require a
   complete `strictProduction` object.
2. Preflight and applicable-dimension resolution finish before any destructive reset. Invalid
   preflight or zero applicable dimensions leaves the current knowledge root unchanged.
3. Global test mode off executes every applicable dimension; global test mode on automatically and
   deterministically executes exactly one applicable dimension.
4. Both modes then call the same cleanup and production pipeline. No legacy bootstrap, private
   strict-test workspace, synthetic receipt, or alternate Agent pipeline is reachable.
5. Existing `CleanupService.fullReset()` remains the cleanup owner. File-to-trash or database
   snapshot failure stops before database clearing, and the Job result preserves the trash
   reference needed for recovery inspection.
6. Dashboard keeps the destructive warning, sends no strict authorization/config object, and shows
   the backend-selected scope and terminal Job result.
7. AlembicAgent remains the semantic execution owner only; AlembicPlugin remains outside this
   Dashboard/Main supplement unless a later user decision explicitly requests host-plugin parity.
8. Controller checks prove the call chain and failure boundaries before any real BiliDili Test
   dispatch.

## Repository responsibilities

### AlembicCore

Modify the existing global test-mode selector. It receives an already applicable ordered dimension
set and returns all dimensions when disabled or one deterministic dimension when enabled. It does
not introduce a new profile, API, receipt, state machine, or user confirmation.

### Alembic Main

Own the one job orchestration, read-only preflight, applicable-dimension resolution, cleanup,
production-stage execution, result/error reporting, and removal of the unproducible external
`strictProduction` request lane. `DaemonJob` stays a transport/lifecycle shell.

### AlembicDashboard

Consume the accepted Main route last. Reconnect Candidates and Jobs to the same ordinary bootstrap
job without strict/test request fields. Preserve the red destructive warning and render backend
state; do not derive authority or select a dimension locally.

### AlembicAgent and AlembicPlugin

No planned task. Agent consumes the selected production plan through its existing semantic runtime.
Plugin is a separate host path and is outside this supplement.

## Phase order

1. Resolve the exact existing runtime sources for Main planning inputs and identify the smallest
   replacement seam for the external authorization/manifest path. No implementation may copy test
   fixture values or invent budgets.
2. AlembicCore implements and proves the existing global selector contract.
3. Alembic Main integrates the Core selector into one preflight -> selection -> trash -> production
   job and removes the public external-object/legacy branches only after the replacement is covered.
4. AlembicDashboard connects the red clear-and-rebuild action to the accepted job contract.
5. The controller independently verifies each repository and the cross-repository call chain.
6. Real BiliDili Test remains paused until every required non-Test target is accepted and the user
   explicitly starts/cooperates with the destructive scenario.

## Initial code-fact gap

Fresh controller inspection established:

- `createMainStrictFactQueryFamiliesV1()` is the real Main fact-query family producer;
- Main already resolves the actual provider/model through the runtime container and workspace
  settings;
- `RuntimeConfigLoadReceiptV1` records model/prompt/config hashes but currently receives the strict
  planning bundle rather than producing it;
- the ten strict resource caps have validation ranges but no normal-runtime source/default factory;
- runtime artifact verification currently requires an externally supplied manifest path/hash;
- only tests/external setup currently construct the complete strict planning/authorization object.

The first Alembic package is therefore bounded read-only investigation. It must identify exact
existing source symbols and the smallest code seam that can remove the external object without
weakening the production pipeline. A missing source is a typed blocker requiring a controller/user
decision, not permission to choose fixture numbers.

## Non-goals and forbidden shortcuts

- Do not recreate the removed strict-test profile, API, receipt, private workspace, or report lane.
- Do not activate Plugin `testMode`, frontend dimension lists, or environment-driven dimension
  allowlists as a substitute for the existing global selector.
- Do not restore legacy bootstrap or add a fallback when production preflight fails.
- Do not add a second reset, snapshot, recovery, journal, daemon-control, or publication platform.
- Do not delete production semantic stages merely because their current entry contract is
  overdesigned.
- Do not use test fixtures, controller prose, or arbitrary constants as production planning input.

## Test decision

Controller unit/integration/build and route probes are required for every non-Test package. A real
BiliDili Test is required only after those packages are accepted. It must use the existing project,
start from the Dashboard action, observe exactly one dimension with global test mode enabled, and
verify the trash and terminal production result. Test does not choose configuration, implement
missing behavior, or redefine completion.
