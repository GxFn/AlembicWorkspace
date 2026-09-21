# I3-I10 Core strict-test profile rework1 controller review

- Reviewed target: `i3-i10-core-strict-test-profile-foundation-rework1-t1`
- Reviewed dispatch group: `i3-i10-core-strict-test-profile-foundation-rework1-p1`
- Reviewed commit: `933920fa214c1ba04787244f073145bcc48e929c`
- Controller decision: `rework`

## Passing evidence

The rework correctly closes all five semantic-forgery paths from the previous controller review:

- a projection cannot omit 25 dimension states;
- a projection cannot replace full-universe lineage;
- a confirmation cannot move to another demand/run;
- a terminal cannot replace serving facts/source or use an invalid snapshot identity;
- audit creation cannot mint a report from that forged completion terminal.

Controller reruns passed:

- five named tamper probes: 5 passed, 7 skipped;
- focused compatibility suite: 5 files and 59 tests passed;
- full Core suite: 195 files passed, 1 skipped; 1,917 tests passed, 1 skipped;
- build/typecheck/public API/boundary/layer/consumer/scope/output/space/naming/lint/retired
  checks and `git diff --check`.

The commit changes only
`AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts` and
`AlembicCore/test/StrictTestDimensionProfile.test.ts`. Protected strict-production, legacy
test-mode, and production-persistence source hashes remain unchanged.

## Blocking causal-lineage finding

The rework made `assertStrictTestPrivateTerminalReceiptV1` require preflight, confirmation, and
projection for every terminal receipt, including failures. Failure receipts themselves still allow
`confirmationHash=null` and `projectionHash=null` for stages before those receipts exist.

Controller probe 1 created a valid failure at `PREFLIGHT_UNIVERSE_VALIDATED`, with both optional
hashes null:

```json
{
  "withoutFutureContext": {
    "accepted": false,
    "error": "STRICT_TEST_PRIVATE_TERMINAL_CONTEXT_REQUIRED: preflight, confirmation and projection"
  },
  "withPostFailureContext": {"accepted": true},
  "auditWithPostFailureContext": {"accepted": true}
}
```

The supplied confirmation occurred after the failure. Therefore a causally valid early failure
cannot be validated with the evidence available at failure time, while manufacturing later
confirmation/projection contexts makes both the terminal validator and audit accept it.

Controller probe 2 created a failure at `PRIVATE_G4_READY` but omitted the confirmation and
projection hashes that must already exist at that stage:

```json
{
  "failedStage": "PRIVATE_G4_READY",
  "confirmationHash": null,
  "projectionHash": null,
  "terminalOutcome": {"accepted": true},
  "auditOutcome": {"accepted": true}
}
```

This violates the confirmed requirement that any stage failure records the failure stage and all
already-produced predecessor receipt hashes. The implementation is stage-blind in both directions:
it requires future contexts for early failure and permits missing predecessor lineage for late
failure.

Evidence:

- `Design/docs/current/recipe-coldstart-strict-test-profile-supplement-requirement-design-2026-07-30.md`
  section 5.2;
- `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts:1183`;
- `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts:1241`;
- `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts:1306`;
- `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts:1390`.

## Required rework

- Define a stage-aware failure authority contract.
- Require only contexts that existed at the reported failure stage; never require or accept
  after-the-failure confirmation/projection as substitute authority.
- Require confirmation/projection hashes for every stage where those receipts must already exist;
  reject null or mismatched predecessor lineage.
- Make the failure audit/report path accept the stage-appropriate optional contexts instead of
  requiring a successful confirmation/projection chain for every failure.
- Cover at least one pre-confirmation failure and one post-projection failure with negative causal
  ordering and missing-lineage tests.
- Preserve the five repaired completion-tamper gates, strict-production behavior, Core boundaries,
  and existing public entrypoints.

Until this stage-aware failure route is fixed, downstream integration remains blocked because the
public terminal/audit contract cannot faithfully represent and validate the required failure state
machine.

## Controller implementation contract for rootcause2

This section removes implementation discretion from
`i3-i10-core-strict-test-failure-causal-lineage-rootcause2-t1`. It is the authoritative
function-level contract for the task. The target may choose local helper names and factorization,
but it must not choose a different authority matrix, nullable shape, timestamp policy, compatibility
fallback, or report meaning.

### Failure-stage meaning and exact authority matrix

For this contract, `failedStage` is the last state whose entry requirements had been satisfied when
the run terminated. A receipt for a stage must carry exactly the authorities shown below. Required
authorities cannot be null; forbidden authorities must be null and must not be accepted merely
because their hashes are internally valid.

| `failedStage` | preflight | confirmation | projection |
| --- | --- | --- | --- |
| `PREFLIGHT_REQUESTED` | forbidden | forbidden | forbidden |
| `PREFLIGHT_FACTS_FROZEN` | forbidden | forbidden | forbidden |
| `PREFLIGHT_UNIVERSE_VALIDATED` | forbidden | forbidden | forbidden |
| `AWAITING_CONFIRMATION` | required | forbidden | forbidden |
| `SELECTION_CONFIRMED` | required | required | forbidden |
| `PRIVATE_WORKSPACE_READY` | required | required | required |
| `PLAN_COMPILED` | required | required | required |
| `FACT_SCHEDULE_FROZEN` | required | required | required |
| `ANALYSIS_FIXPOINT_CLOSED` | required | required | required |
| `EXPRESSION_SETS_REVIEWED` | required | required | required |
| `PRIVATE_CORPUS_SEALED` | required | required | required |
| `PRIVATE_INDEXES_VERIFIED` | required | required | required |
| `PRIVATE_G4_READY` | required | required | required |
| `PRIVATE_SERVING_VALIDATED` | required | required | required |

`STRICT_TEST_COMPLETED_PRIVATE` is never a legal `failedStage`. The projection is the transition
authority used to enter `PRIVATE_WORKSPACE_READY`; therefore it is forbidden on a
`SELECTION_CONFIRMED` failure and required starting at `PRIVATE_WORKSPACE_READY`.

Core must own this table as one frozen/versioned constant or one total resolver used by failure
creation, terminal validation, and audit composition. The public `plans` and `production` facades
must expose the same resolver/contract so Agent and Main do not duplicate or reinterpret it.

### Receipt and context shapes

Keep the existing exported entrypoint names, but replace the stage-blind raw-hash input with one
authority context:

```ts
interface StrictTestPrivateTerminalAuthorityContextV1 {
  readonly currentBindings: StrictTestPreflightBindingsV1;
  readonly preflight: StrictTestPreflightReceiptV1 | null;
  readonly confirmation: StrictTestSelectionConfirmationV1 | null;
  readonly projection: StrictTestDimensionExecutionProjectionV1 | null;
}
```

`createStrictTestPrivateFailureReceiptV1` must accept this context plus the failure fields. It must
not accept caller-supplied `preflightHash`, `confirmationHash`, or `projectionHash`; it derives them
from the validated context after enforcing the matrix.

`StrictTestPrivateFailureReceiptV1` must contain:

- `observedBindingsHash`, derived canonically from `currentBindings`;
- nullable `preflightHash`, `confirmationHash`, and `projectionHash`;
- the existing failure stage, error, evidence, forbidden-inference, non-mutation, time, and terminal
  fields.

For a pre-preflight failure, demand/run and production/public before-state hashes come from
`currentBindings`. Once preflight is required, demand/run and the before-state baseline come from
the preflight receipt and must still agree with `currentBindings` on demand/run. A changed observed
binding hash may be recorded as failure evidence; failure construction must not call the
success-only `assertStrictTestPreflightCurrentV1` in a way that prevents recording expiry or drift
itself as the failure.

`assertStrictTestPrivateTerminalReceiptV1` must accept the receipt plus the authority context.
Completion still requires all three successful receipts. Failure uses the table above. Do not add
an overload or fallback that silently supplies successful confirmation/projection for an early
failure.

### Causal time

`StrictTestDimensionExecutionProjectionV1` currently has no production timestamp, so the current
code cannot prove that a projection preceded a failure. Add hash-bound `projectedAt` to the
projection input and receipt. Its constructor/validator must enforce:

```text
preflight.generatedAt <= confirmation.confirmedAt
confirmation.confirmedAt <= projection.projectedAt
```

Failure creation and terminal validation must enforce every supplied authority existed no later
than `failedAt`:

```text
currentBindings.generatedAt <= failedAt
preflight.generatedAt <= failedAt              when preflight is required
confirmation.confirmedAt <= failedAt            when confirmation is required
projection.projectedAt <= failedAt              when projection is required
```

An expired preflight may still be recorded as a failure. Structural/hash/lineage validation remains
mandatory, but a success-only currency check must not erase evidence of the expiry. Any required
authority timestamp after `failedAt` fails with
`STRICT_TEST_FAILURE_CONTEXT_AFTER_FAILURE`.

### Exact failure validation

Creation, terminal validation, and audit must all:

1. resolve the same matrix row;
2. reject missing required context;
3. reject present forbidden/future context rather than ignoring it;
4. validate each present receipt structurally and in order;
5. require exact demand/run and predecessor-hash equality;
6. recompute and compare `observedBindingsHash`;
7. enforce the causal times above;
8. enforce production/public non-mutation;
9. recompute `terminalHash`.

Missing, extra, null, or mismatched stage authority fails with
`STRICT_TEST_FAILURE_AUTHORITY_MISMATCH`. Malformed underlying receipts keep their existing
specific validator errors. Do not infer authority from `failedStage`, evidence refs, error text, or
later receipts.

### Stage-aware audit report

`StrictTestAuditReportV1` and `createStrictTestAuditReportV1` must use the same authority context.
The report must not manufacture successful-state fields:

- `preflightHash`, `confirmationHash`, and `projectionHash` are nullable and equal the terminal
  lineage exactly;
- `fullUniverse` is null without preflight and is reconstructed from validated preflight when
  present;
- `executedProjection` and `unexecutedDimensionIds` are null without projection and are
  reconstructed from validated projection when present;
- a failed terminal produces a non-null `{ failedStage, errorCode }` failure summary; completion
  produces null;
- failure `privateEvidenceRefs` must be conserved into `privateArtifactRefs`, not dropped or
  replaced;
- forbidden conclusions and non-mutation flags remain exact.

The audit creator first validates the terminal against the same context and then derives report
fields. It must never accept a later successful context to fill null early-failure fields.

### Mandatory regression set

The focused test must include table-driven coverage for every non-completed state plus these
boundaries:

1. all three pre-preflight stages succeed only with all receipts null;
2. `AWAITING_CONFIRMATION` requires only preflight;
3. `SELECTION_CONFIRMED` requires preflight + confirmation and rejects projection;
4. `PRIVATE_WORKSPACE_READY` and every later nonterminal stage require all three;
5. each boundary rejects one missing required authority and one forbidden extra authority;
6. rehashed mismatched predecessor hashes are rejected;
7. future preflight, confirmation, and projection timestamps are each rejected;
8. early and late failure audits preserve the exact nullable/non-null authority shape;
9. the five prior completion-forgery probes remain green;
10. both public facades expose the same matrix/resolver and updated versioned contracts.

No changes are allowed to strict-production behavior, legacy test mode, external repositories,
Dashboard routes, daemon orchestration, persistence, public CAS, or fallback behavior.
