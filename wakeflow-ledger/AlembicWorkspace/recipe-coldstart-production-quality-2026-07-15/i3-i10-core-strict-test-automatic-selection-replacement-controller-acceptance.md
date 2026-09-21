# I3-I10 AlembicCore strict-test automatic-selection replacement controller acceptance

Date: 2026-07-30

## Controller Acceptance

- User goal: one cold-start test start must let the backend validate the full preflight,
  deterministically auto-select one suitable dimension, and proceed without a second user
  confirmation.
- Scope reviewed: the Core-only replacement of the manual confirmation authority with automatic
  selection, including projection, resume, private terminal, failure, audit, public surfaces, and
  failure-stage causal authority.
- Original requirement authority:
  - `i3-i10-strict-test-automatic-selection-user-decision-2026-07-30.md`;
  - `i3-i10-core-strict-test-automatic-selection-replacement-controller-contract.md`.
- Target/window: AlembicCore /
  `i3-i10-core-strict-test-automatic-selection-replacement-t1`.
- Commit reviewed: `0815eb24944ea0ab3d4f4e2390205fbfe35f59f0`;
  parent `744616bde2322efa92aecd66b0b4f862f17fe69a`;
  tree `9f0eda3cd7104c897bc62932708e14d7b6639ba8`.

## Raw evidence reviewed

- Full commit diff and exact four-file scope:
  - `src/service/plan/intent/strictTestDimensionProfile.ts`;
  - `test/StrictTestDimensionProfile.test.ts`;
  - `test/StrictTestAutomaticSelectionReplacement.test.ts`;
  - `test/CorePackage.test.ts`.
- Source-level inspection of the new receipt creator/assertion, recommendation lineage,
  full-universe projection, resume context, private terminal constructors/validators, 14-stage
  failure authority matrix, and audit report.
- Public-source scan found no remaining
  `StrictTestSelectionConfirmationV1`,
  `createStrictTestSelectionConfirmationV1`,
  `assertStrictTestSelectionConfirmationV1`,
  `confirmationHash`,
  `AWAITING_CONFIRMATION`, or `SELECTION_CONFIRMED`.
- Runtime probe independently emitted:
  - recommendation and selected dimension both `architecture`;
  - exact selected cell `core::architecture`;
  - canonical automatic-selection and projection hashes;
  - catalog, catalog-source, cell-universe, eligible/excluded, applicability,
    fact-query-catalog, and baseline-schedule hashes;
  - completed private terminal lineage;
  - `AUTOMATIC_SELECTION_READY` failure with null downstream authority.

## Implementation reality

- `createStrictTestAutomaticSelectionReceiptV1` accepts exactly
  `preflight`, `currentBindings`, and `selectedAt`.
- The selected dimension is derived only from
  `preflight.recommendation.dimensionId`; caller dimension IDs, manual confirmation fields,
  legacy dimensions/testMode, Plugin hints, and Dashboard hints are rejected by exact-key
  validation.
- The receipt binds the selected dimension's complete eligible-cell list and all required
  preflight/facts/runtime/full-universe lineage.
- Projection consumes only the automatic-selection receipt, keeps 26 dimension states, selects
  exactly one dimension, and marks the remaining 25 as
  `not-executed-by-strict-test-profile`.
- Resume, completion, failure, and audit surfaces carry `automaticSelectionHash`.
- The failure matrix uses only
  `preflight | automaticSelection | projection`, enforces required/forbidden authority at all 14
  non-completed stages, and rejects authority timestamps after `failedAt`.
- No Agent, Main, Dashboard, Plugin, daemon, store, public-route, or production-finalization
  implementation was added.

## Controller reruns

- `npm run build:check` — passed.
- `npm run lint` — passed; 786 files.
- Focused strict-test/public package run — 3 files, 31 tests passed.
- Core delivery/tool-system/Codex/package boundary run — 4 files, 24 tests passed.
- Deterministic runtime probe — passed with the lineage listed above.
- `npm run build && npm test` — 196 files passed, 1 skipped; 1927 tests passed, 1 skipped.
- `git diff --check` — passed.
- Repository/worktree status — clean.
- `npm run check` — stopped at the existing doctrine violation in
  `src/infrastructure/vector/ASTChunker.ts:32`. The accepted parent contains the same file and this
  task did not modify it. All checks after that gate were run independently.

An earlier controller attempt ran `npm test` concurrently with `npm run check`; the latter's
`clean-dist` caused one transient `dist/index.js` import failure. The controller discarded that
contaminated run and reran `npm run build && npm test` sequentially to the green result above.

## Blockers and residual risks

- No blocker remains inside the Core task.
- The full user feature is not complete: AlembicAgent, Alembic Main, and Dashboard have not yet
  consumed this accepted authority.
- The superseded Agent manual-confirmation worktree residue is not accepted and must be replaced by
  the next Agent package.
- The inherited `ASTChunker` doctrine issue is outside this task and does not receive a new TODO
  from this evidence; it does not alter the current strict-test completion definition.

## TODO/backlog rollup

- Close the Core automatic-selection replacement task with this commit and evidence.
- Keep the existing strict-test integration work open.
- Next eligible producer/consumer step: replace the superseded Agent adapter with one that consumes
  `StrictTestAutomaticSelectionReceiptV1` and the accepted Core commit.
- Do not dispatch Main, Dashboard, or real BiliDili Test before the Agent step is independently
  accepted.

## Decision

`accept-target-result`

## Next action

Create and dispatch one precise AlembicAgent replacement package based on accepted Core commit
`0815eb24944ea0ab3d4f4e2390205fbfe35f59f0`, with target-owned cleanup of only the superseded
uncommitted manual-confirmation residue before implementation.
