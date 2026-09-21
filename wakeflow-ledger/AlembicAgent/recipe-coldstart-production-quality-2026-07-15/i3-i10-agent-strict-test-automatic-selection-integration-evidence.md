# I3-I10 Agent strict-test automatic-selection integration evidence

Date: 2026-07-30  
Target: `i3-i10-agent-strict-test-automatic-selection-integration-t1`  
Dispatch group: `i3-i10-agent-strict-test-automatic-selection-integration-p1`

## Result

AlembicAgent now exposes a versioned automatic-selection authority, an exact selected-cell
binding for the existing strict production runtime port, and a canonical Agent execution receipt.
The existing `AgentService -> generate-dimension -> AgentStageFactoryRegistry ->
PipelineStrategy` route remains the only execution pipeline. A valid Core authority binds the
complete applicable cell set for the automatically selected dimension into both Analyst and
Producer scope; invalid authority fails before the first model call.

This result does not complete private strict-test execution, production finalization, public-route
activation, Main/Daemon integration, Dashboard work, or real BiliDili validation.

## Recoverable cleanup and baseline

- Required Agent parent: `a882f61cad34eed873db5ac52870475e6d71da52`.
- Initial worktree contained exactly the five superseded manual-confirmation paths named by the
  controller contract and no additional dirty path.
- Recoverable stash:
  - ref: `stash@{0}`;
  - stash commit: `fb8af8850b89d5f1aff9ba912991d5bb69343f34`;
  - subject: `wakeflow/superseded-i3-i10-agent-manual-confirmation`.
- The stash contains only the five superseded paths, was never applied, and remains present.
- Implementation began from a clean worktree at the required parent.

## Commit authority

- Accepted Core commit:
  `0815eb24944ea0ab3d4f4e2390205fbfe35f59f0`.
- Accepted Core tree:
  `9f0eda3cd7104c897bc62932708e14d7b6639ba8`.
- Agent parent:
  `a882f61cad34eed873db5ac52870475e6d71da52`.
- Agent commit:
  `7dfb4bada72d78a5bc9e65cafa54574cb36ae698`.
- Agent tree:
  `f663d2f66b1690bfddf8984e8665397d112b07b0`.
- Commit subject: `feat: bind strict test automatic selection`.
- Post-commit worktree: clean.

## Changed files

1. `config/agent-public-api-signatures.json`
2. `package.json`
3. `scripts/probe-strict-test-dimension-agent.mjs`
4. `scripts/smoke-agent-public-imports.mjs`
5. `src/agent/production/StrictProductionStages.ts`
6. `src/agent/production/StrictTestDimensionAgentContract.ts`
7. `src/agent/production/index.ts`
8. `src/production.ts`
9. `test/fixtures/public-strict-consumer/strict-facades.ts`
10. `test/fixtures/strict-test-durable-review.ts`
11. `test/public-strict-facades.test.ts`
12. `test/strict-test-dimension-agent-contract.test.ts`

No adjacent repository was modified.

## Contract and functional evidence

### Authority

- Creator input is exact-key constrained to Core current bindings, preflight, automatic selection,
  execution projection, and compiled Plan.
- Core preflight-current, automatic-selection, execution-projection, and resume-context validators
  run before Agent authority creation.
- The creator reconstructs preflight from the compiled Plan, then binds the complete catalog,
  cells, applicability, fact-query, schedule, Certified Project Facts, source, selected cells, and
  timestamps into one canonical authority.
- Assertions use all own keys, including non-enumerable and symbol keys, and reconstruct the nested
  Core receipt chain; caller edit-and-rehash attempts are rejected.
- There is no confirmation, confirmed-by, selection override, second authorization, environment
  activation, or legacy/manual field in production source or public signatures.

### Existing runtime binding

- Binder input and bound-port fields are exact-key constrained.
- Runtime rows must be unique, canonically ordered, selected-dimension-only, and equal every and
  only the compiled Plan's selected eligible cells.
- Runtime epoch lineage must match run, Plan cognition, Plan hash, applicability universe,
  baseline schedule, lens bindings, Certified Project Facts source artifact, and source revision
  vector.
- A port carrying either strict-test field must carry both and revalidate before every stage/gate
  access.
- Both Analyst and Producer prompts receive the immutable selected-cell scope. Ordinary strict
  production remains byte-for-byte on its prior prompt path when both fields are absent.

### Execution receipt

- The actual fact execution manifest is validated and bound to source revision and fact-query
  authority.
- Final expanded schedule and fixpoint are reconstructed with Core constructors from actual
  schedules, expansion receipts, cluster sets, terminal obligations, and execution receipts.
- Expression-set receipts are reconstructed with the Core validator.
- V5 durable attestations are validated only against externally supplied trust policies. Trust
  policy objects are not persisted in the receipt; only policy hashes are bound.
- Accepted producer evidence is bound to the exact nested review execution; investigated-empty
  uses an independent disposition-review attestation.
- Selected-cell dispositions are exact and ordered. Counts and completed/partial/failed segment
  status are derived, never caller supplied.
- `productionFinalized` and `publicRouteChanged` are always `false`.

## RED / GREEN evidence

RED was first exercised through the actual AgentService route. Before the stage-boundary
implementation, a forged authority was ignored: the route returned success and made two model
calls (Analyst and Producer). This proved the test was not a helper-only false green.

After implementation:

- focused command:
  `npx vitest run test/strict-test-dimension-agent-contract.test.ts
  test/strict-production-chain.test.ts test/strict-iterative-analysis.test.ts
  test/public-strict-facades.test.ts`;
- result: 4 files passed, 47 tests passed;
- the new contract file contributes 20 tests;
- valid route: Analyst and Producer both called with selected-cell authority;
- invalid route: malformed, forged, missing, extra, duplicate, reordered, wrong-dimension,
  excluded, stale, cross-run, cross-demand, edit-and-rehash, runtime-lineage, incomplete-field,
  non-enumerable-field, and post-binding-extra-field cases fail before model calls;
- the fixture conserves all 26 dimension states and uses two eligible modules for the selected
  `architecture` dimension;
- receipt coverage includes completed, partial, failed, accepted, rejected, investigated-empty,
  invalid evidence, count tampering, genuine Ed25519 V5 producer review, and genuine Ed25519 V5
  investigated-empty review.

## Deterministic runtime receipt

Command: `npm run probe:strict-test-dimension-agent`

```json
{"schemaVersion":1,"probe":"strict-test-dimension-agent-automatic-selection","selectedDimensionId":"architecture","selectedCellIds":["module-a::architecture","module-b::architecture"],"selectedCellSetHash":"sha256:1d0a321487cefa2f7a5dbcae7d1ffd4dc609d449f4e930557023241aa30481f6","fullCatalogHash":"sha256:0f1910337b20eb746c05bd951c8d9aacf7b822261a3e1379f14d78130e8d4da3","fullCellUniverseHash":"sha256:8710b24d4950e27179e19c5ac0a9854d32dd78d263c098c0f8dac09c2d296b23","fullEligibleCellsHash":"sha256:8710b24d4950e27179e19c5ac0a9854d32dd78d263c098c0f8dac09c2d296b23","fullExcludedCellsHash":"sha256:4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945","fullApplicabilityUniverseHash":"sha256:897d50a51883ae7da74ea62dd8b272cc7918b9ae73afbd691ee60a16c18a9281","fullFactQueryCatalogHash":"sha256:5730b4e8891e07eab76caadfc89ef20240434d0fce73de2c45256cafbd9f9bc0","fullBaselineScheduleHash":"sha256:c55a9844679e3c4302f69f423e7f45a656e1483ebd06d17789495a3043b49012","dimensionStateCount":26,"validRoute":{"status":"success","modelCallCount":2,"analystScopeBound":true,"producerScopeBound":true},"failClosedRoute":{"status":"error","modelCallCount":0,"errorCode":"STRICT_TEST_DIMENSION_AGENT_AUTHORITY_LINEAGE_MISMATCH"},"receipt":{"attemptedCount":2,"acceptedCount":0,"rejectedCount":0,"investigatedEmptyCount":0,"failedCount":2,"segmentStatus":"failed","productionFinalized":false,"publicRouteChanged":false,"receiptHash":"sha256:f79ac4eb52cccf76151209363afda0c50b2f04f15f6ce70bf65c957db0d726cd"}}
```

## Public API evidence

- `npm run smoke:public-imports`: passed; 15 subpaths imported and 11 forbidden subpaths rejected.
- `npm run smoke:public-signatures`: passed; 15 exports and 457 bindings.
- `@alembic/agent/production`: 19 runtime values; signature hash
  `a63e575ec1f963f5e57c1f27de6059d04674004652c182e65f8674e5bbfb0486`.
- The production facade exposes the six authority/binder/receipt functions and their requested
  stable types. Root, service, evaluation, runtime, and unrelated facades were not widened.

## Validation matrix

- `npm run build:check`: passed.
- Focused strict tests: passed, 47/47.
- `npm run smoke:public-imports`: passed.
- `npm run smoke:public-signatures`: passed.
- `npm run lint:core-import-boundary`: passed; 323 files and 105 Core imports.
- `npm run lint:public-api-boundary`: passed; 15 exact exports, no wildcard export.
- `npm run lint:agent-import-boundary`: passed.
- `npm run verify:validation-floor`: passed; 74 test files, 576 declared test cases, 15 stable
  public exports, 573 package entries.
- `npm run lint:retired-symbols`: passed.
- `npm run lint`: exit 0 with the same 21 pre-existing warnings.
- `git diff HEAD^ --check`: passed.
- Alembic Guard: passed on 8 task code/test files with 0 violations;
  `guard-public-ms7987lf-2`.

### Parent-baseline comparison

The unrelated baseline imports `createProjectContextFileRef` at runtime from
`@alembic/core/project-context-foundation`, which does not export that value.

- `npm run smoke:strict-consumer`
  - parent: failed with the same missing named export;
  - current commit: failed with the same missing named export.
- `npm test`
  - parent: 1 failed / 72 passed files; 20 failed / 589 passed tests;
  - current commit: 1 failed / 73 passed files; 20 failed / 609 passed tests;
  - the identical 20 failures are all in `test/durable-semantic-review-runtime.test.ts` with
    `TypeError: createProjectContextFileRef is not a function`;
  - current adds one passing file and 20 passing tests, with no added failure.
- `npm run check`
  - parent and current both pass all preceding gates and stop at the same
    `smoke:strict-consumer` missing-export failure.

The unrelated baseline files were not modified.

## Boundary and self-review

- Changed-file scan: exactly 12 AlembicAgent paths.
- Production-source scans found no confirmation/manual lineage, environment activation,
  Main/Dashboard/Plugin/daemon/store code, production-finalization/public-route true claim, legacy
  bootstrap, or second Agent pipeline.
- `productionFinalized=false` and `publicRouteChanged=false` are asserted and receipt-bound.
- Alembic Guard initially identified one long test-fixture helper. It was split into population,
  analysis, and producer-review helpers; the same Guard scope then passed with zero violations.
- Final severity review found no critical, high, medium, or low unresolved issue in the assigned
  implementation.

## Residual risk and consumer notes

- The existing strict-consumer/durable-review import defect remains a repository baseline issue
  outside this package and should be repaired under separate authority.
- Main may import the new functions from `@alembic/agent/production` after controller acceptance.
  It must supply the accepted Core automatic-selection receipts, an existing strict runtime port,
  and the exact selected cell rows. It must not derive a second selection or bypass the Agent
  assertion.
- No Main, Dashboard, Daemon, Plugin, persistence, serving, or real-private-test work is authorized
  by this result. Controller acceptance is required before downstream integration.
