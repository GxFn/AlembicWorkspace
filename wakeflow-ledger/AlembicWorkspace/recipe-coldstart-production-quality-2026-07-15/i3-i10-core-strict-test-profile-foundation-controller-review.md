# I3-I10 Core strict-test profile foundation controller review

- Reviewed target: `i3-i10-core-strict-test-profile-foundation-t1`
- Reviewed dispatch group: `i3-i10-core-strict-test-profile-foundation-p1`
- Reviewed commit: `8383808cce71e80c717b6121235597c24229f10e`
- Controller decision: `rework`

## Passing baseline evidence

The submitted commit is clean and its declared happy-path validation was independently reproduced:

- focused strict-test and public-contract suite: 5 files, 54 tests passed;
- full Core suite: 195 files passed, 1 skipped; 1,912 tests passed, 1 skipped;
- TypeScript build check, build, public API smoke, package boundary checks, layer checks,
  consumer import checks, scope/retired-symbol checks, Biome lint, and `git diff --check` passed.

These results prove that the creators produce valid receipts and that the existing repository gates
remain green. They do not prove that persisted/deserialized receipts fail closed after semantic
tampering.

## Controller tamper probe

Starting from receipts created by the public strict-test functions, the controller changed one
semantic field set at a time, recomputed the affected canonical hash, and passed the object back to
the corresponding public validator. All five invalid objects were accepted:

```json
[
  {"label":"projection-missing-25-dimension-states","accepted":true},
  {"label":"projection-forged-full-eligible-hash","accepted":true},
  {"label":"confirmation-forged-demand-and-run","accepted":true},
  {"label":"terminal-forged-serving-facts-source-and-empty-snapshot","accepted":true},
  {"label":"audit-accepts-forged-terminal","accepted":true}
]
```

## Blocking findings

1. `assertProjectionShape` only counts one selected state and validates rows that happen to be
   unselected. It does not require the exact 26-dimension state set, unique dimension ids, a selected
   state whose id matches `selectedDimensionId`, or selected-state cells/count equal to the top-level
   projection. A projection containing only one selected row is therefore accepted.
   Evidence: `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts:816`.

2. `assertProjectionLineage` checks only a subset of the immutable preflight lineage. It omits the
   binding hash, demand/run identity, selected dimension, catalog source, eligible/excluded hashes,
   fact-query catalog, schedule, certified facts, and source inventory/revision bindings. Recomputing
   `projectionHash` after changing an omitted field is accepted.
   Evidence: `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts:849`.

3. `assertStrictTestSelectionConfirmationV1` does not conserve demand/run identity or the remaining
   strict config/model/runtime/private-workspace bindings from the supplied preflight. A confirmation
   can be moved to another demand/run and rehashed while still validating against the original
   preflight.
   Evidence: `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts:707`.

4. The standalone private terminal validator validates only internal self-hashes and a narrow subset
   of coverage/serving relations. It has no supplied preflight/projection context, does not enforce
   the serving manifest constructor invariants, and does not conserve certified facts/source
   lineage. A rehashed manifest with unrelated facts/source and an empty `snapshotId` is accepted.
   Evidence: `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts:997`.

5. `createStrictTestAuditReportV1` checks only terminal preflight/confirmation/projection hash
   references after running the context-free terminal validator. It therefore accepts the forged
   terminal above and mints a valid-looking audit report.
   Evidence: `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts:1059`.

## Required rework

- Make every public validator reject rehashed semantic tampering, not only accidental hash mismatch.
- Enforce exact 26-dimension projection conservation, uniqueness, selected-row identity and cells,
  and all unselected zero-cell states against the supplied preflight catalog/results.
- Conserve every projection/confirmation field derived from the supplied preflight and confirmation.
- Validate terminal completion with the supplied preflight, confirmation, and projection (or provide
  an equivalently complete authority receipt), including existing serving-manifest invariants and
  exact facts/source/cell lineage.
- Ensure audit creation invokes the contextual terminal validator rather than trusting self-consistent
  nested hashes.
- Add negative tests for each of the five controller probes, then rerun the focused and full Core
  suites plus build/boundary checks.

Until this rework passes, downstream Agent/Main consumption is blocked because this commit cannot
serve as a durable strict-test evidence trust root.
