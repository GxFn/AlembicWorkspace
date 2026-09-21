# I3-I10 strict-test automatic selection user decision

Date: 2026-07-30

## Decision authority

The user clarified the strict cold-start test mode after the first Agent package was dispatched:

> This mode exists to verify that the latest cold-start pipeline is connected. Starting the test must automatically select a suitable dimension and execute it; it must not wait for a second user confirmation.

This is a confirmed replacement of the manual-selection behavior in
`recipe-coldstart-strict-test-profile-supplement-requirement-design-2026-07-30.md`.
The earlier full read-only preflight, private/non-destructive execution, exact one-dimension
projection, latest strict chain, and non-production verdict remain required.

The operator previously directed the controller not to route this work through Design. This record
therefore captures an already-made user product decision; it is not a controller or target-window
design proposal.

## Correct user scenario

1. The user starts **Cold-start pipeline test** once.
2. The backend completes the authoritative full read-only preflight.
3. If preflight is valid, the backend deterministically selects exactly one applicable dimension.
4. The backend immediately executes every eligible cell for that dimension through the latest
   strict pipeline.
5. Dashboard displays the selected dimension, selection reason, stage evidence, failure, and final
   private report. It does not present a blocking selection/confirmation step.
6. Any invalid/unknown/empty preflight or invalid recommendation fails closed. There is no legacy
   bootstrap fallback.

The initial start action is the authorization to run the private test. No second confirmation or
manual dimension choice is part of this profile.

## Deterministic selection authority

Core must replace the manual `StrictTestSelectionConfirmationV1` authority in this profile with
`StrictTestAutomaticSelectionReceiptV1`.

The selection algorithm is backend-owned and versioned:

- algorithm version: `strict-test-preflight-recommendation-v1`;
- candidate dimensions come only from the same validated preflight receipt;
- a candidate must be `applicable`, have `eligibleCellCount > 0`, and have
  `requiredFactsSupported=true`;
- the selected dimension must equal `preflight.recommendation.dimensionId`;
- the recommendation remains deterministic: prefer `architecture` only when its real preflight
  evidence makes it applicable, supported, and non-empty; otherwise use the canonical first
  evidence-supported applicable dimension already produced by Core;
- the selected cell set is every and only eligible cell for that dimension;
- a missing, stale, rehashed, unsupported, empty, ambiguous, or inconsistent recommendation is a
  typed failure, never a reason to choose randomly or use a frontend fallback.

The receipt must bind at least:

- schema/profile/algorithm versions;
- demand and run identities;
- preflight, binding, drift-invalidation, full catalog, full cell universe, and full applicability
  hashes;
- selected dimension, exact selected eligible cell IDs, and selected cell-set hash;
- strict config, provider/model, prompt/SOP, runtime artifact, and private workspace policy hashes;
- selection reason and preflight evidence refs;
- `selectedAt`;
- `productionFinalized=false` and `publicRouteChanged=false`;
- canonical receipt hash.

It must not contain `confirmedBy`, synthetic `confirmedBy=system`, a user-confirmation statement, or
fields that imply a second authorization event.

## Required contract migration

### AlembicCore

- Add the automatic-selection receipt, validator, canonical hash, and negative invariants.
- Make execution projection and resume authority consume the automatic-selection receipt.
- Replace `SELECTION_CONFIRMED` with an accurately named automatic-selection state.
- Update the failure-stage authority matrix, terminal receipts, and audit report bindings.
- Keep all production strict contracts unchanged.
- Preserve full-universe-to-one-dimension conservation.

### AlembicAgent

- Consume the accepted Core automatic-selection receipt; do not retain or simulate manual
  confirmation.
- Bind the existing strict Agent pipeline to the exact automatically selected cell set while
  conserving the full preflight/Plan hashes.
- Reuse the existing Plan/Analyst/Producer/independent-review chain and emit its canonical segment
  receipt.

### Alembic Main

- A single explicit test start invokes preflight, automatic selection, private orchestration,
  status, and report.
- No private test run may call production reset/publication/CAS or legacy bootstrap.
- No environment variable, legacy dimensions field, Plugin test mode, or Dashboard-local choice may
  activate or replace the backend profile.

### AlembicDashboard

- Provide one test start action and display backend-selected dimension/reason.
- Do not block on a dimension selector or confirmation dialog.
- Disable/stop on backend blockers and never call `api.bootstrap()` as fallback.

## Acceptance

- One start request reaches the backend preflight and, when valid, automatically begins one
  dimension's latest strict pipeline.
- The chosen dimension and all executed cells are reproducible from the preflight receipt.
- No second user action is required.
- Invalid preflight or recommendation produces a typed stopped/failed state before any Agent model
  call.
- The full 26-dimension context remains frozen and visible in evidence.
- The run stays private and cannot claim production finalization.

## Superseded work

Task `i3-i10-agent-strict-test-execution-integration-t1` and its controller contract required a
manual confirmation receipt. That package is superseded and must not be accepted, repaired in
place, or used as the new implementation baseline.
