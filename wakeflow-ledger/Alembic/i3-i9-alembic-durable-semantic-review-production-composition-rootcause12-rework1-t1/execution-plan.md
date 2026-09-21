# Rootcause12 rework1 execution plan

## Scope and recovery boundary

- Repository: Alembic Main only.
- Accepted parent: `e8610b504498cd85cb06a4e31fb48e5dfe84f005`.
- Product scope: `SemanticReviewTrustStore` bootstrap state, trust-file permissions, and custody
  path confinement.
- Test scope: existing trust-store unit suite and existing real-Facade V5 integration fixture.
- Stop instead of widening if a repair requires AlembicCore, AlembicAgent, AlembicPlugin, Test,
  Wakeflow, vendor, a second trust platform, or a change to V5 harvest-group/attestation semantics.

## Controller findings and responses

1. `approved-policies.json` deletion while `signing-key.pk8` remains currently reauthorizes a new
   registry.
   - Agree. The implementation passes only `registry !== null` into key loading, so a missing
     registry is indistinguishable from the first bootstrap even when durable key custody already
     exists.
   - Repair invariant: exactly zero trust artifacts may bootstrap; any partial durable custody
     state fails closed without creating or approving anything.
2. Registry mode `0666` is currently accepted.
   - Agree. Registry reads call `readRegularFile(..., 0)`, so no writable permission bits are
     forbidden.
   - Repair invariant: registry must reject group/other writable bits; key keeps the stricter
     existing rule.
3. A symlinked `.asd` or custody parent is currently followed.
   - Agree. `mkdir(..., recursive: true)` and leaf-only `lstat` do not validate ancestors.
   - Repair invariant: every existing component from `dataRoot` through the custody directory is a
     real non-symlink directory, and resolved custody remains confined beneath the configured real
     data root before any trust read or write.

## Ordered work

1. Baseline: run current trust-store unit tests and the real-Facade integration suite; record the
   accepted starting state.
2. RED: add unit regressions for registry deletion, `0666` registry, symlinked `.asd`, symlinked
   custody directory, and outside-root no-write assertions; run them against the accepted parent.
3. GREEN: minimally harden custody initialization and file reads in
   `SemanticReviewTrustStore.ts`; run the same unit regressions.
4. Compatibility: rerun the existing real-Facade V5 fixture and built trust probes, confirming
   15 receipts / 8 Core groups, one load/reviewer per evidence root, and no recovery remint.
5. Verification: run build/typecheck, lint, boundary/shared/public/layer/ring/naming/retired gates,
   full `npm run check`, full `npm test`, build, diff/head/worktree checks, and scoped Alembic
   Guard.
6. Closeout: perform spec-compliance and code-quality self-review, write exact evidence, create
   one clean child commit, finish the Alembic work ref, record the TargetResultEnvelope, and
   complete the controller-return send/readback run.

## Execution evidence

### Baseline and test-first proof

- Accepted Main `HEAD` was exactly `e8610b504498cd85cb06a4e31fb48e5dfe84f005`
  (tree `8c45f5a76f2c49e64b5ce6982fe09bbfe1e8ef01`).
- Accepted siblings were exact and clean:
  AlembicCore `c0a6633d9570178494cb208b42a268f2f3899911`,
  AlembicAgent `a882f61cad34eed873db5ac52870475e6d71da52`.
- Baseline command:
  `npm run build:check && npx vitest run test/unit/SemanticReviewTrustStore.test.ts test/integration/StrictRecipePipelineFacade.integration.test.ts`
  passed with 2 files / 21 tests.
- First RED run against the accepted implementation had 7 unit cases, 4 failures:
  registry deletion was reauthorized, mode `0666` was accepted, a symlinked `.asd` was followed,
  and a symlinked custody directory was followed.
- A second security-review RED added caller-pinned recovery on an empty root. It had 9 cases,
  1 failure: the implementation created a key and reached rotation comparison instead of refusing
  absent enrollment before custody creation.
- Final GREEN unit run: 9/9. The new matrix covers key-present/registry-absent, caller-pinned
  empty-root bootstrap, group/world-writable registry, configured data-root symlink, `.asd`
  symlink, custody-directory symlink, and no outside-root key/registry writes. Existing missing or
  unsafe key, rotation, tamper, replacement/self-authorization, and revoked enrollment cases
  remain green.

### Repair and invariant mapping

1. Registry deletion was fail-open because `registry !== null` was the only bootstrap-state bit
   passed to key loading. When the registry disappeared, the surviving key was loaded as if the
   workspace had never been enrolled and a new registry was written around that key.
   `openCustody` now classifies the durable pair before key loading. Only both-absent may bootstrap;
   key-present/registry-absent throws
   `STRICT_SEMANTIC_REVIEW_POLICY_REGISTRY_MISSING`. A caller-supplied expected policy on an empty
   root also fails before key creation. `readApprovedPolicy` uses the same corrupt-state diagnosis
   during finalized recovery.
2. Mode `0666` was accepted because registry reads called the shared file reader with a zero
   forbidden-mode mask. Registry reads now reject `0o022`; the existing key rule continues to
   reject every group/other permission bit. Leaf reads use `O_NOFOLLOW`, then validate the opened
   handle's regular-file type and mode.
3. Ancestor symlinks were followed because recursive `mkdir` plus leaf-only `lstat` never inspected
   `dataRoot`, `.asd`, or the custody parent. Custody preparation now validates/creates one
   directory component at a time, rejects symlink/non-directory components, realpaths both ends,
   and requires the exact confined path `<realDataRoot>/.asd/semantic-review-trust` before any
   trust-file read or write.

No new trust platform, journal, sentinel, fallback, policy/key injection, or sibling authority was
added. The changed production file remains the existing Main host `SemanticReviewTrustStore`.

### Real Facade and built-process evidence

The existing real `RecipePipelineFacade` / `StrictColdStartOrchestrator` positive fixture remains
unchanged in its semantic shape:

- five consumed serialized V5 review records;
- each record binds one physical Ledger/witness root, 15 execution receipts, and 8 Core-authored
  harvest groups, including a multi-scale group;
- report counts remain 5 V5 attestations, 5 Ledger loads, 5 witness resolutions, and 5 provider
  invocations;
- Core V5 assert/consume still runs for every serialized record before terminal closure,
  persistence, G3/G4, serving validation, and the single public CAS.

The recovery section now deletes `approved-policies.json` after the journal is truncated to
`PUBLIC_CAS_PREPARED`, reconstructs the real semantic-review factory, and proves:

- recovery fails with `STRICT_SEMANTIC_REVIEW_POLICY_REGISTRY_MISSING`;
- registry remains absent, signing-key bytes remain exact, and provider invocation count stays 5;
- restoring the original approved registry allows the same checkpoint to recover as `FINALIZED`;
- provider invocation count remains 5 through recovered and finalized replay.

Fresh Node processes importing
`dist/lib/infrastructure/config/SemanticReviewTrustStore.js` returned:

```json
{"scenario":"registry-delete","built":true,"outcome":"STRICT_SEMANTIC_REVIEW_POLICY_REGISTRY_MISSING","registryRecreated":false,"keyUnchanged":true}
{"scenario":"registry-mode-0666","built":true,"outcome":"STRICT_SEMANTIC_REVIEW_TRUST_FILE_INVALID","accepted":false,"observedMode":"666"}
{"scenario":"custody-parent-symlink","built":true,"followedSymlink":false,"rows":[{"component":"data-root","outcome":"STRICT_SEMANTIC_REVIEW_CUSTODY_PATH_INVALID","keyWrittenOutside":false,"registryWrittenOutside":false},{"component":".asd","outcome":"STRICT_SEMANTIC_REVIEW_CUSTODY_PATH_INVALID","keyWrittenOutside":false,"registryWrittenOutside":false},{"component":"semantic-review-trust","outcome":"STRICT_SEMANTIC_REVIEW_CUSTODY_PATH_INVALID","keyWrittenOutside":false,"registryWrittenOutside":false}]}
{"scenario":"fresh-process-public-policy-recovery","built":true,"processes":2,"samePolicyHash":true,"custodyBytesUnchanged":true,"privateKeyReadRequiredForRecovery":false}
```

### Validation

- Scoped Biome: 3 changed files, no findings.
- `git diff --check`: passed.
- `npm run build:check`: passed.
- `npm run build`: passed against local AlembicCore.
- Focused custody/journal/Facade suite: 4 files / 39 tests passed.
- `npm run check`: passed:
  - unit: 158 files / 1203 tests;
  - integration: 32 files / 480 passed + 10 skipped;
  - coverage: 3 files / 11 tests;
  - typecheck, repository boundary, space edges, layer, doctrine, naming, Agent extraction,
    Core/public consumer imports, retired symbols, ring direction, and shared assets all passed;
  - shared-asset drift: 17 checks / 0 drift / 0 pending sync.
- `npm test`: 191 files / 1705 passed + 10 skipped.
- `npm run lint` retains exactly five unrelated pre-existing `noExplicitAny` warnings in
  `AgentRunProjections.ts` and `handler-runtime.ts`; none is in this task's diff.
- Alembic Guard `guard-public-ms57t3nc-1`: 3 files, 0 violations.

### Two-stage self-review

Spec-compliance review found all controller findings covered by both source-level regressions and
built probes. The Facade recovery assertion exercises the public-policy read path, while unit and
built probes exercise session opening, so neither recovery branch can silently remint. The V5
request/group/load/attestation code is untouched, and exact 15-receipt/8-group/count assertions
remain green.

Code-quality/security review verified non-recursive component creation, non-symlink directory
checks, exact realpath confinement, `O_NOFOLLOW` leaf opens, registry `0o022` rejection, unchanged
key `0o077` rejection, and zero outside-root writes in all three parent-link cases. No high,
medium, or low task-scope finding remains. The five repository lint warnings are the unchanged
accepted baseline.

## Commit and post-commit verification

- Parent: `e8610b504498cd85cb06a4e31fb48e5dfe84f005`
- Commit: `044c952e4a0bf3e82d1d8484f914725676bfc5aa`
- Tree: `c0043ba368c21f18fa3d7450dc96d2f1f6f87fae`
- Changed files:
  - `lib/infrastructure/config/SemanticReviewTrustStore.ts`
  - `test/integration/StrictRecipePipelineFacade.integration.test.ts`
  - `test/unit/SemanticReviewTrustStore.test.ts`
- Post-commit `npm run build:check`: passed.
- Post-commit trust-store unit regression: 1 file / 9 tests passed.
- Main, Core, Agent, and Plugin worktrees were clean after commit; Core and Agent remained at the
  exact accepted heads recorded above.
