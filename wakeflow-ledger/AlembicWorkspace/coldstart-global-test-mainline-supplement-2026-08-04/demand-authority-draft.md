# Cold-start global test mainline supplement — proportional demand-authority draft

Date: 2026-08-04

Status: **not frozen / pending one strict-budget simplification confirmation**

This document reconstructs the supplement under Wakeflow 0.9.4. It is a controller draft, not an
implementation package and not `demand-authority.json`.

## Confirmed goal

The Dashboard red clear-and-rebuild action starts one real Alembic Main cold-start Job. Main first
resolves the project and applicable dimensions without mutation. The existing global test state
changes only the dimension range: disabled selects all applicable dimensions; enabled selects one
deterministic applicable dimension. Both modes then run the same trash cleanup and the same
production Plan-to-publication chain.

## Completion definition

The supplement is complete only when:

1. Dashboard and ordinary clients call the existing bootstrap Job without caller-owned
   `strictProduction`, reset, planning, reviewer, runtime-artifact, or dimension-authority fields.
2. Main performs one read-only facts/applicability preflight before any trash or database mutation.
   Invalid preflight and zero applicable dimensions leave the current knowledge state unchanged.
3. Core's existing global selector returns all applicable dimensions when disabled and exactly one
   deterministic applicable dimension when enabled; no allowlist is required for cold start.
4. `CleanupService.fullReset()` is the sole destructive cleanup owner. Every required file move and
   DB snapshot completes before the first `DELETE`; failure is typed, fail-closed, and preserves a
   durable trash reference.
5. Main reuses the accepted strict Plan, fact execution, Analyst/Producer, independent review,
   persistence, ref/index, serving validation, sealed snapshot, and public-route CAS stages. It does
   not keep a parallel legacy or test-only business pipeline.
6. The Job result exposes backend-selected dimensions, trash reference, strict production terminal
   state, and failure stage. A post-clean failure leaves the prior active public route unchanged.
7. Dashboard preserves the red destructive warning and renders backend Job state; it neither
   selects dimensions nor manufactures authority.
8. Controller checks cover each repository and the end-to-end call graph before the explicitly
   authorized BiliDili destructive Test run.

## Supersession map

The production-quality semantic stages and their quality/failure behavior remain useful authority
from the original requirement design. The following earlier mechanisms are superseded for this
supplement and must not be reintroduced:

- external `strictProduction` request/receipt objects;
- external setup authority, daemon quiesce, whole-root snapshot/restore, and exact-reset control
  plane;
- private strict-test API/workspace/receipt/status lane;
- frontend dimension picker or caller-provided dimension list;
- legacy bootstrap fallback;
- Plugin participation in the Dashboard/Main cold-start path.

The existing trash mechanism, not another snapshot platform, is the recovery trace for this
destructive operation.

## Runtime authority disposition

### Derive from existing runtime

Main owns or can derive these values without a caller object:

- Job/run/owner identity from `DaemonJobRunner`;
- project root, data root, project scope, certified-facts identity, and applicable dimensions from
  the workspace resolver and the single preflight capture;
- operation storage from the existing confined Job-artifact namespace;
- fact-query families from `createMainStrictFactQueryFamiliesV1()`;
- actual provider/model identity from the injected Agent provider;
- migration semantic hash from the loaded Core migration bundle;
- current public-route hash under the existing publication lock;
- private revision, serving snapshot, vector, finalization, and CAS receipts from the existing
  strict runtime.

### Remove as external/audit-only authority

The new ordinary Job must not require these values from HTTP, Dashboard, environment setup, Test,
or controller-generated receipts:

- caller run id, resume owner, reset paths/tables, public route, and setup/recovery fields;
- caller `modelHash` and `promptHash`; the actual prompt input digest must be generated at the Agent
  invocation boundary, and provider/model identity must come from the live runtime;
- caller reviewer identity, credential symbol, method version, or calibration hash; the existing
  Main/Agent semantic-review runtime must bind the provider/model/method it actually loads. A field
  that merely decorates a receipt but has no production producer must not remain a pre-clean gate;
- controller-owned runtime-artifact manifest path/hash as a Job input. Package/load compatibility
  may be verified from the actual loaded artifacts, but it cannot be an external execution ticket.

### Simplify strict budgets instead of creating another policy object

Fresh code inspection shows that the ten-value strict config is itself partly duplicative:

- Agent profiles already own executable `maxIterations`, `maxTokens`, and `timeoutMs` limits;
- `providerRequestCap`, `detailRequestCap`, `tokenCap`, `timeMsCap`, and `costMicrousdCap` currently
  validate numbers authored in Plan JSON, but they do not meter the actual run; keeping a second
  caller/config set would create false authority;
- `moduleWireBound` and `cellWireBound` are arbitrary external ceilings over counts the certified
  preflight already knows exactly;
- candidate and fact-query bounds can be derived from the accepted cell/applicability universe,
  the fixed semantic repair limit, and the enrolled expansion ledger.

The recommended proportional contract is therefore:

1. use the existing Agent profile/runtime budgets as the executable request/token/time authority;
2. remove the non-metered Plan-only cost/request/detail cap claims instead of inventing values;
3. derive module/cell/candidate/fact-query bounds deterministically from the frozen preflight and
   compiled plan, with conservation checks and no quantity floor;
4. keep the fixed semantic repair limit and all actual fail-closed execution gates.

This changes the old strict configuration contract and therefore requires explicit confirmation
before authority freeze. The rejected alternative is to introduce a new checked-in ten-value
policy whose numbers would have no current product source.

## Repository ownership and phase order

### Phase 1 — AlembicCore producer

One combined Core package:

- replace cold-start allowlist filtering with the confirmed deterministic one-dimension selector;
- retain rescan behavior unless explicitly changed by another requirement;
- simplify the strict config contract so actual Agent budgets and deterministic universe-derived
  bounds replace the ten caller/config values;
- prove disabled/all, enabled/one, empty input, stable order, derived-bound conservation, and
  rejection of plan claims beyond the actual runtime budget.

### Phase 2 — AlembicAgent producer

One combined Agent package, only for real producer contract changes:

- stop accepting caller-supplied Plan `modelHash`/`promptHash` as if they were runtime truth;
- bind the actual prompt input digest and live provider/model identity in Plan invocation lineage;
- remove externally supplied semantic-review metadata that is receipt-only, while preserving
  independent reviewer execution, evidence binding, fail-closed verdicts, and durable attestation.

This phase is required by current source: `PlanAgentRun` validates and echoes the two caller hashes,
so Main alone cannot truthfully repair that provenance.

### Phase 3 — Alembic Main consumer/orchestrator

One combined Main package after Core and Agent acceptance:

- make `/jobs/bootstrap` one path and reject removed caller authority fields;
- preflight/capture once, select scope before mutation, and reuse that frozen result;
- bind Job artifact storage, current route, runtime config/load evidence, and journal internally;
- harden `CleanupService.fullReset()` move/snapshot failures and persist the trash receipt early;
- run the existing strict semantic/publication tail without external setup/reset;
- delete obsolete public/external setup and duplicate reset code only after replacement reachability
  and failure probes are green;
- return selected dimensions, trash, failure stage, and strict terminal state through the Job.

### Phase 4 — AlembicDashboard consumer

One combined Dashboard package after Main acceptance:

- keep the existing red clear-and-rebuild action and warning;
- send an ordinary empty bootstrap body;
- show backend-selected dimensions, trash reference, stage/error, and terminal Job result;
- remove any strict/test request fields or UI-owned authority.

AlembicPlugin is out of scope. Test starts only after all four product targets and controller
cross-chain checks are accepted.

## Acceptance anchors for later packages

- Core: test mode enabled over any non-empty ordered applicable set always returns exactly one
  stable member; disabled returns the entire set without mutation.
- Agent: Plan/reviewer provenance is created from the invocation/runtime that actually executed;
  caller hashes cannot enter or satisfy the contract.
- Main: the no-object bootstrap path has the exact order preflight -> selection -> trash/reset ->
  strict semantic production -> publication; no branch reaches legacy or private strict-test code.
- Main: file-move or DB-snapshot failure causes zero DB deletes and leaves a durable trash/failure
  receipt.
- Main: a failure after cleanup leaves the prior public route unchanged and exposes recovery trace.
- Dashboard: the red action sends no authority/dimension object and renders the backend result.

## Non-goals

- No new API, test profile, execution receipt lane, private workspace, daemon business state
  machine, snapshot platform, or second publication route.
- No removal of semantic quality stages to make the route easier to connect.
- No external-authority compatibility fallback after the new path is accepted.
- No Plugin parity, rescan redesign, or real Test before the non-Test gate.

## Authority references intended for freeze

- original plan: `Design/docs/current/recipe-coldstart-production-quality-original-plan-2026-07-15.md`
- original requirement design: `Design/docs/current/recipe-coldstart-production-quality-requirement-design-2026-07-15.md`
- confirmed supplement and user decision: `wakeflow-ledger/AlembicWorkspace/coldstart-global-test-mainline-supplement-2026-08-04/requirement-delta.md`
- code facts: `wakeflow-ledger/Alembic/coldstart-global-test-mainline-supplement-2026-08-04/p0-main-runtime-input-authority-research-t1/runtime-input-authority-report.md`
- controller acceptance: `wakeflow-ledger/AlembicWorkspace/coldstart-global-test-mainline-supplement-2026-08-04/p0-main-runtime-input-authority-research-controller-acceptance.md`
- Test environment: `wakeflow-ledger/AlembicWorkspace/coldstart-global-test-mainline-supplement-2026-08-04/test-environment-spec-draft.md`

Freeze is forbidden until the strict-budget simplification and this repository coverage/phase
order are confirmed.
