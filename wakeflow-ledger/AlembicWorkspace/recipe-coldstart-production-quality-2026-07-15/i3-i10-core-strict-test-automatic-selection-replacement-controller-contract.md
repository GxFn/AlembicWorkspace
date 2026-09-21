# I3-I10 AlembicCore strict-test automatic-selection replacement controller contract

Date: 2026-07-30

## Authority and replacement boundary

- User decision:
  `i3-i10-strict-test-automatic-selection-user-decision-2026-07-30.md`.
- Accepted Core baseline:
  `744616bde2322efa92aecd66b0b4f862f17fe69a`.
- The accepted read-only preflight, frozen full universe, recommendation algorithm, private
  non-mutation contracts, terminal receipts, and causal failure-authority rules remain required.
- This package replaces only the second-step manual confirmation authority. It does not add a
  second strict-test profile, change production strict contracts, implement Agent/Main/Dashboard,
  or make the production cold-start entry use test mode.
- The superseded Agent package and its uncommitted files are not an implementation source.

The externally visible sequence for this Core profile must become:

`PREFLIGHT_REQUESTED → PREFLIGHT_FACTS_FROZEN → PREFLIGHT_UNIVERSE_VALIDATED → AUTOMATIC_SELECTION_READY → SELECTION_AUTO_SELECTED → PRIVATE_WORKSPACE_READY → … → STRICT_TEST_COMPLETED_PRIVATE`

There is no `AWAITING_CONFIRMATION`, `SELECTION_CONFIRMED`, `confirmedBy`, synthetic system
confirmation, caller dimension choice, or second authorization event in the active
`strict-test-dimension` contract.

## Verified current code facts

The replacement is localized in
`src/service/plan/intent/strictTestDimensionProfile.ts`, currently exported from
`src/plans.ts` and `src/production.ts`.

Current manual authority is carried by:

- `StrictTestPreflightReceiptV1.state = AWAITING_CONFIRMATION`;
- `StrictTestPreflightPreviewV1.canConfirm`;
- `StrictTestSelectionConfirmationV1`;
- `createStrictTestSelectionConfirmationV1`;
- `assertStrictTestSelectionConfirmationV1`;
- `StrictTestDimensionExecutionProjectionV1.confirmationHash`;
- resume, completion, failure, terminal, and audit paths that carry `confirmation` /
  `confirmationHash`;
- `STRICT_TEST_FAILURE_STAGE_AUTHORITY_V1` rows keyed by confirmation-era states.

These names and fields must not remain as a parallel active route for this not-yet-integrated
strict-test profile.

## Required implementation

### 1. Automatic-selection receipt

Export:

- `StrictTestAutomaticSelectionReceiptV1`;
- `createStrictTestAutomaticSelectionReceiptV1`;
- `assertStrictTestAutomaticSelectionReceiptV1`.

The creator input must have exactly:

- `preflight: StrictTestPreflightReceiptV1`;
- `currentBindings: StrictTestPreflightBindingsV1`;
- `selectedAt: string`.

It must not accept `selectedDimensionId`, `selectedDimensionIds`, `confirmedBy`, a recommendation
override, a frontend preference, or any legacy test-mode field.

The creator must:

1. call `assertStrictTestPreflightCurrentV1(preflight, currentBindings, selectedAt)`;
2. validate the embedded recommendation and dimension-result conservation again;
3. resolve the selected row only from `preflight.recommendation.dimensionId`;
4. require that row to be `applicable`, `requiredFactsSupported=true`, and
   `eligibleCellCount > 0`;
5. require its exact eligible-cell IDs and cell-set hash to match the preflight row;
6. copy every and only that row's eligible cells in canonical preflight order;
7. preserve the recommendation reason and evidence refs;
8. produce a frozen canonical receipt.

The receipt must contain exactly the semantic authority needed downstream:

- `schemaVersion: 1`;
- `canonicalizerVersion: canonical-json-v1`;
- `profile: strict-test-dimension`;
- `algorithmVersion: strict-test-preflight-recommendation-v1`;
- `state: SELECTION_AUTO_SELECTED`;
- demand/run/root identities;
- `preflightHash`, `bindingHash`, and `driftInvalidationHash`;
- full catalog, catalog-source-artifact, cell-universe, eligible/excluded-cell,
  applicability-universe, fact-query-catalog, and baseline-schedule hashes;
- Certified Project Facts content/source/vector/consumer hashes;
- source revision vector and source inventory hashes;
- selected dimension ID;
- exact selected eligible-cell IDs, count, and canonical set hash;
- recommendation reason and copied recommendation evidence refs;
- strict-config, provider/model, prompt/SOP, fact-query backend, parser backend, embedding vector,
  runtime artifact manifest/binding, and private workspace policy hashes;
- `privateStrictTestOnly=true`;
- `productionFinalized=false`;
- `publicRouteChanged=false`;
- `selectedAt`;
- `automaticSelectionHash`.

The assertion must enforce exact keys, canonical hash reconstruction, timestamp ordering, current
preflight lineage, recommendation equality, exact selected-cell conservation, and all copied
hashes. It must fail closed for stale/expired/rehashed/cross-demand/cross-run preflight,
missing/unknown/empty/unsupported recommendation, reordered or replaced selected cells, extra
fields, invalid algorithm/profile/state, or any recommendation override.

### 2. Preflight state and preview

Keep the preflight operation read-only and keep its deterministic recommendation logic unchanged,
but rename its terminal pre-execution state to `AUTOMATIC_SELECTION_READY`.

`StrictTestPreflightPreviewV1` remains an optional observation projection only. Replace the
confirmation implication with:

- `state: AUTOMATIC_SELECTION_READY`;
- `canAutoSelect: true`.

It may display the recommendation, all dimension rows, and blockers, but it must not authorize or
require a user action.

### 3. Execution projection

Change `createStrictTestDimensionExecutionProjectionV1` input to exactly:

- `preflight`;
- `automaticSelection`;
- `currentBindings`;
- `projectedAt`.

Change `assertStrictTestDimensionExecutionProjectionV1` to validate against `preflight` and
`automaticSelection`.

The projection must:

- use `state: SELECTION_AUTO_SELECTED`;
- carry `automaticSelectionHash`, not `confirmationHash`;
- derive `selectedDimensionId` and `executionCellIds` only from the automatic-selection receipt;
- preserve all full-universe hashes unchanged;
- mark exactly one dimension `selected-for-execution`;
- mark every other catalog dimension `not-executed-by-strict-test-profile`;
- execute every and only the selected row's eligible cells;
- reject any time earlier than `selectedAt`.

No compatibility overload may accept a confirmation or caller-selected dimension.

### 4. Resume, terminal, failure, and audit authority

Replace every strict-test private authority input/field named `confirmation` or
`confirmationHash` with `automaticSelection` or `automaticSelectionHash`, including:

- `StrictTestPrivateTerminalAuthorityContextV1`;
- `StrictTestPrivateCompletionReceiptV1`;
- `StrictTestPrivateFailureReceiptV1`;
- `assertStrictTestResumeContextV1`;
- completion/failure constructors and terminal validators;
- private completion/failure lineage reconstruction;
- final audit-report input, lineage, and hash fields;
- all exact-key arrays and canonical semantic builders.

The failure-stage matrix must use the three authority slots
`preflight | automaticSelection | projection` and the new state names:

- failures through `PREFLIGHT_UNIVERSE_VALIDATED` forbid all three receipts;
- `AUTOMATIC_SELECTION_READY` requires preflight and forbids automatic selection/projection;
- `SELECTION_AUTO_SELECTED` requires preflight + automatic selection and forbids projection;
- `PRIVATE_WORKSPACE_READY` and all later non-terminal stages require all three.

All constructor, terminal validator, resolver, and audit code must use this single matrix. A receipt
created after `failedAt`, a missing required authority, or a supplied forbidden authority fails
closed. Production/public-route non-mutation remains mandatory.

### 5. Remove the superseded active API

Because no accepted Agent/Main/Dashboard consumer exists yet, this package must remove from the
active public strict-test contract:

- `StrictTestSelectionConfirmationV1`;
- `createStrictTestSelectionConfirmationV1`;
- `assertStrictTestSelectionConfirmationV1`;
- confirmation-only exact-key arrays, error paths, fields, and tests;
- confirmation-era states `AWAITING_CONFIRMATION` and `SELECTION_CONFIRMED`.

Do not retain an alias, deprecated overload, hidden branch, `confirmedBy=system`, or dual state
machine. Existing unrelated production strict exports and behavior must remain unchanged.

## Error contracts

Use stable typed Core errors. At minimum, focused tests must distinguish:

- automatic-selection input/field invalidity;
- invalid/unknown/empty/unsupported recommendation;
- automatic-selection hash mismatch;
- automatic-selection/preflight lineage mismatch;
- automatic-selection time invalidity;
- stale/expired/drifted preflight;
- projection lineage/time/cell-conservation mismatch;
- failure-authority mismatch.

Do not translate any of these into a random fallback, architecture fallback outside the preflight
recommendation, legacy bootstrap, or caller-provided selection.

## Required tests

Update `test/StrictTestDimensionProfile.test.ts` and the established public/boundary fixtures to
prove:

1. valid preflight automatically selects exactly its recommendation with no selection argument;
2. architecture wins only when the existing preflight recommendation legitimately selects it;
3. the canonical first supported applicable recommendation is used otherwise;
4. zero/unknown/unsupported/empty recommendation fails before any downstream execution;
5. caller-selected IDs, manual confirmation fields, fake `confirmedBy`, legacy `dimensions`,
   environment test flags, and Plugin/Dashboard hints are rejected by exact-key guards or are
   absent from the API;
6. all 26 catalog dimensions and all full-universe hashes survive unchanged while exactly one
   dimension's complete eligible set becomes executable;
7. stale/expired/rehashed/cross-run/cross-demand/tampered selection fails;
8. projection, resume, completion, failure, and audit bind `automaticSelectionHash`;
9. all non-completed stages obey the new causal authority matrix;
10. public production/plans imports expose automatic-selection symbols and no longer expose manual
    confirmation symbols;
11. ordinary production cold-start and strict-production tests remain unchanged and green.

The RED proof must show the accepted baseline lacks automatic selection and still exposes the
manual confirmation contract. The GREEN proof must exercise creators and assertions, not only
types or static strings.

## Validation and target evidence

Return:

- one clean AlembicCore commit based on `744616bde2322efa92aecd66b0b4f862f17fe69a`,
  with parent/commit/tree hashes;
- exact changed files and exported/removed symbols;
- focused RED and GREEN output;
- a deterministic runtime JSON/probe containing preflight recommendation, selected dimension,
  selected cells, automatic-selection hash, projection hash, all full-universe hashes, and
  terminal/failure authority examples;
- `npm run build:check`;
- focused strict-test tests;
- public import/signature/consumer probes available in this repository;
- boundary/lint checks available in this repository;
- `npm run check`, full `npm test`, and `git diff --check`;
- a scan proving no Agent/Main/Dashboard/Plugin/daemon/store/public-route/production-finalization
  implementation or legacy activation path was added.

If an unrelated baseline failure appears, run the same command on parent and HEAD and report both.
Do not modify unrelated source merely to obtain green.

## Completion definition

This package is complete only when Core has one unambiguous, versioned, canonical
`preflight → automatic selection → execution projection → private terminal/audit` authority chain
that requires no second user action and cannot be overridden by callers. It does not by itself
complete the test mode or authorize downstream work before controller acceptance.
