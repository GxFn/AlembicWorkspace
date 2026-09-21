# I3-I10 Core strict-test failure causal-lineage controller acceptance

## Controller Acceptance

- User goal: make the new strict cold-start test profile deterministic and causally trustworthy
  before any Agent, Main, Dashboard, or real-project integration; downstream must consume a precise
  Core contract rather than inventing stage semantics.
- Scope reviewed: AlembicCore task
  `i3-i10-core-strict-test-failure-causal-lineage-rootcause2-t1`, cumulative history from accepted
  baseline `933920f` through RED commits `a12f0e5` and `cd295c7`, and implementation commit
  `744616bde2322efa92aecd66b0b4f862f17fe69a`.
- Original requirement authority:
  `Design/docs/current/recipe-coldstart-strict-test-profile-supplement-requirement-design-2026-07-30.md`
  sections 5.2, 9.4, and 10, plus the exact controller implementation contract in
  `i3-i10-core-strict-test-profile-foundation-rework1-controller-review.md`.
- Target/window: AlembicCore only.
- Evidence reviewed:
  - exact two-file cumulative diff and clean final worktree;
  - `strictTestDimensionProfile.ts` matrix, resolver, authority context, receipt derivation,
    `projectedAt`, terminal validation, and audit composition;
  - `StrictTestDimensionProfile.test.ts` table-driven authority, causal-time, tamper, audit,
    facade-export, expiry, drift, and compatibility cases;
  - target evidence document and commit/tree identities;
  - controller reruns listed below.
- Implementation reality:
  - one frozen V1 matrix owns all 14 legal failure stages;
  - preflight, confirmation, and projection are required or forbidden exactly as specified;
  - failure construction receives actual authority objects and derives hashes rather than trusting
    caller-supplied predecessor hashes;
  - `observedBindingsHash` and hash-bound `projectedAt` close early-failure and future-projection
    substitution paths;
  - terminal validation and audit reuse the same context and resolver;
  - failure reports preserve the exact nullable authority shape, failure stage/error, evidence,
    forbidden conclusions, and production/public non-mutation;
  - both public facades expose the same matrix and resolver without an old-signature fallback.
- Validation result:
  - focused strict-test suite: 1 file, 19 tests passed;
  - full Core suite: 1,924 tests passed and 1 skipped on the stable serial run;
  - `build:check`, build, public API smoke (61 entrypoints), Biome lint, public API boundary,
    layer contract, consumer imports, scope resolution, and retired-symbol gates passed;
  - consumer-import gate reported zero issues for AlembicAgent, Alembic, and AlembicPlugin;
  - protected strict-production source hashes match the accepted baseline:
    `coldStartProductionPlan.ts` `0f98325...`,
    `shared/testMode.ts` `1faf35e...`,
    `ProductionPersistenceContracts.ts` `5dc9d47...`;
  - `git diff --check` passed and the final Core worktree is clean.
- Blockers: none inside the assigned Core contract.
- Missing evidence: none.
- Residual risks:
  - the inherited doctrine finding in unchanged `ASTChunker.ts` remains unrelated to this task;
  - Agent and Main must intentionally migrate to the new context and `projectedAt` contract; no
    compatibility fallback exists by design.
- TODO/backlog rollup: close this Core rootcause2 task on acceptance. Do not create a new TODO from
  the inherited doctrine finding. Retain the already-authorized downstream integration work in its
  producer/consumer order.
- Decision: `accept-target-result`.
- Next action: update controller state, then prepare the next already-confirmed downstream package;
  do not start Test or Dashboard from this Core acceptance alone.

