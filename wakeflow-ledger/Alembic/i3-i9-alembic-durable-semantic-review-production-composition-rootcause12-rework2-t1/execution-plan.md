# Rootcause12 rework2 execution plan

## Scope, authority, and stop boundary

- Window/repository: Alembic Main only.
- Exact starting commit: `044c952e4a0bf3e82d1d8484f914725676bfc5aa`.
- Controller defects to reproduce:
  1. after a completed enrollment, deleting or replacing both
     `.asd/semantic-review-trust/signing-key.pk8` and `approved-policies.json` is misclassified as
     a first bootstrap and self-authorizes a new policy;
  2. a group/world-writable custody directory is accepted.
- Preserve the existing partial-pair, registry-file-mode, `O_NOFOLLOW`, ancestor-symlink, and
  realpath-confinement repairs from `044c952`.
- Preserve the real V5 production composition and its exact 15-receipt/8-group authority.
- Stop instead of widening if the repair requires AlembicCore, AlembicAgent, AlembicPlugin, Test,
  vendor, Wakeflow, an in-memory sentinel, a test-only entrypoint, or a second trust platform.

## Re-derived root-cause hypothesis

The trust pair cannot prove its own prior existence: when both files are absent, current code has
no independent fact that distinguishes a pristine operator-authorized installation from deletion
after enrollment. A valid repair therefore needs a host-owned durable authority outside the pair,
or an explicit operator re-enrollment gate. The existing workspace `.asd/config.json`, created by
the setup boundary and resolved from the production `WorkspaceResolver`, is the candidate authority.
The implementation must prove this from the real factory/DI call chain before adopting it.

The directory defect is narrower: `assertSecureDirectory` rejects symlink/non-directory entries but
does not reject `mode & 0o022`, so a `0777` custody root remains writable by non-owner principals.

## Controller finding response

1. `PAIR_REPLACEMENT_REAUTHORIZED`: agree; reproduce through unit, built two-process, and real
   Facade recovery before editing production code.
2. `ACCEPTED_WORLD_WRITABLE_CUSTODY`: agree; reproduce for the custody root and applicable parent
   components before editing production code.
3. Prior result overstated replacement/self-authorization coverage: agree; the new result will name
   only cases demonstrated by raw tests and built probes.
4. No second trust platform or sentinel: agree; only the existing host config authority or an
   explicit operator gate is admissible.

## Ordered work

1. Pin Main/Core/Agent/Plugin heads and clean worktrees; run the accepted focused baseline.
2. Trace `AgentModule -> resolveDataRoot/WorkspaceResolver -> StrictSemanticReviewRuntimeFactory ->
   SemanticReviewTrustStore`, including setup/config creation and all config mutation boundaries.
3. Add one behavior at a time and capture RED:
   - full pair deletion after enrollment must fail with zero new key/registry/approval writes;
   - full pair replacement must not match the prior durable authority;
   - `0777` data root, `.asd`, and custody directory must fail before trust reads/writes;
   - the real Facade `PUBLIC_CAS_PREPARED` recovery must fail after full-pair deletion and recover
     only after restoring the exact prior authority.
4. Implement the minimum production authority/gate and secure-directory mode check. Keep the
   existing V5 request/group/attestation code untouched.
5. Run the same tests GREEN, then built two-process deletion/replacement and writable-directory
   probes.
6. Run build, build:check, scoped formatting/lint, full `npm run check`, full `npm test`, repository
   boundary checks, exact head/diff/worktree checks, and scoped Alembic Guard.
7. Perform two-stage self-review: original package compliance, then security/code quality by
   severity. Create one clean child commit only if no task-scope blocker remains.
8. Record the TargetResultEnvelope and complete the controller-return host send/readback/delivery
   run. Target completion is evidence for controller review, not acceptance.

## Validation questions

- Success: exact prior enrollment authority survives restarts; deleting/replacing the pair cannot
  reopen enrollment; an explicit operator-authorized first enrollment still works; writable custody
  paths fail; recovery does not remint/review; V5 counts and lineage stay exact.
- Failure: any missing authority is inferred from the pair itself, any task/checkpoint can authorize
  enrollment, any failure writes a new key/registry/approval, or the V5 production chain changes.
- Invalid conclusions: passing unit tests alone does not prove built/fresh-process or real-Facade
  recovery; target backfill does not equal controller acceptance.

## Baseline and raw-source evidence

- Baseline at `044c952e4a0bf3e82d1d8484f914725676bfc5aa`:
  `npm run build:check && npx vitest run test/unit/SemanticReviewTrustStore.test.ts
  test/unit/RecipePipelineFacadeStrict.test.ts test/unit/StrictProductionJournal.test.ts
  test/integration/StrictRecipePipelineFacade.integration.test.ts` — PASS, 4 files / 39 tests.
- Production DI is `Bootstrap/ServiceContainer -> AgentModule -> resolveDataRoot(container) ->
  StrictSemanticReviewRuntimeFactory -> SemanticReviewTrustStore`; normal production does not use
  a task-supplied data root or trust store.
- No existing workspace-wide semantic-review enrollment authority was found. Per-run checkpoints
  protect only an existing run; settings/secrets, ProjectRegistry, and the pair itself cannot prove
  prior enrollment. `.asd/config.json` is the existing host-owned protected config carrier, but it
  requires an explicit semantic-review enrollment gate and durable public-key pin before it can
  serve as this authority.
- Current `assertSecureDirectory` checks symlink/type only. It does not inspect `mode & 0o022`.
- Raw-source inspection is the implementation proof for this task because Alembic ProjectContext
  was partial and incorrectly anchored the parent workspace for the target file.

## RED evidence

- `npx vitest run test/unit/SemanticReviewTrustStore.test.ts -t "complete custody loss|
  self-consistent replacement pair|group/world-writable"` — expected FAIL, 5 failed / 9 skipped.
- Full pair loss resolved instead of rejecting and minted a new Ed25519 policy.
- A self-consistent replacement pair reached the existing policy-approval logic rather than the
  durable trust-root rejection.
- `0777` data root, `.asd`, and custody root each resolved and minted trust artifacts rather than
  failing at the directory boundary.

## GREEN evidence (focused)

- `npm run build:check` — PASS after implementation.
- `npx vitest run test/unit/SemanticReviewTrustStore.test.ts test/unit/SetupService.test.ts
  test/integration/StrictRecipePipelineFacade.integration.test.ts -t "SemanticReviewTrustStore|
  SetupService workspace mode convergence|runs the real Facade/Generate/ColdStart chain through one
  public CAS"` — PASS, 23 passed / 17 skipped.
- The real Facade recovery now removes the entire trust directory at `PUBLIC_CAS_PREPARED`, receives
  `STRICT_SEMANTIC_REVIEW_TRUST_PAIR_MISSING`, observes no provider re-invocation and no key,
  registry, or host-authority rewrite, then restores the exact pair and reaches
  `PUBLIC_CAS_COMMITTED status=recovered`.
- `npm run build && node scratch/semantic-review-trust-rework2-probe.mjs` — PASS against built JS.
  The temporary probe used independent Node processes and reported:
  `TWO_PROCESS_PAIR_LOSS_FAIL_CLOSED`,
  `SELF_CONSISTENT_PAIR_REPLACEMENT_FAIL_CLOSED`, and
  `WORLD_WRITABLE_CUSTODY_FAIL_CLOSED`. The scratch probe was removed after execution.

## Final validation and self-review

- Final `npm run check` — PASS:
  - unit: 158 files / 1209 tests;
  - integration: 32 files / 480 passed / 10 skipped;
  - coverage: 3 files / 11 tests, configured thresholds green;
  - typecheck, repo/layer/doctrine/naming/import/agent-extraction boundaries, shared-asset drift,
    retired symbols, and ring direction all green;
  - Biome retained only 5 pre-existing `noExplicitAny` warnings outside the changed files.
- After the final registry existence/read-state race check:
  `npm run build:check` plus focused trust-store and real-Facade tests — PASS,
  16 passed / 17 skipped.
- Alembic work/guard evidence:
  - finish: `finish-public-ms594abj-2`;
  - first full-file Guard exposed one actionable new complexity warning plus 59 existing
    `SetupService`/test sync-I/O and console warnings;
  - the custody logic was decomposed; final scoped Guard
    `guard-public-ms59bgm9-5` passed 3 files / 0 violations;
  - the new SetupService authorization fragment and assertion passed inline Guard
    `guard-public-ms596t66-4`.
- Package compliance review: Main-only 5-file diff; no Core/Agent/Plugin/Test/vendor edits; task or
  checkpoint cannot open enrollment; V5 request/attestation/group code is untouched; real recovery
  preserves the exact semantic-review checkpoint, including the existing 15-receipt/8-group proof.
- Security/code-quality review: no P0/P1/P2 task-scope findings remain. Host config is the explicit
  operator boundary, not protection against compromise or replacement by the same OS owner.
  Existing registry read-modify-rename concurrency/CAS hardening is a code-inspection follow-up, not
  authorized by this rootcause12 repair and not required to close pair loss/replacement.

## Commit

- Commit: `602be24027a06284d0622e4d0d72fdbcd0831cc8`
- Parent: `044c952e4a0bf3e82d1d8484f914725676bfc5aa`
- Tree: `cce11a3c19c7caab88b59c85f407419c78b702f2`
- Exact committed scope: 5 Main files, 547 insertions / 64 deletions.
- Post-commit `npm run build:check` and 22 trust/setup unit tests — PASS.
- Main and all three sibling repositories are clean; no sibling commit or vendor pointer changed.
