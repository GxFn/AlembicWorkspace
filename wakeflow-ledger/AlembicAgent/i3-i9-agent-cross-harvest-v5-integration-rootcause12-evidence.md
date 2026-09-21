# Agent cross-harvest V5 integration evidence

## Result

- Target: `i3-i9-agent-cross-harvest-v5-integration-rootcause12-t1`
- Status: completed; pending controller acceptance
- Agent baseline: `07efa7ef7aef638900c62e3efa68c03afdeee95e`
- Accepted Core: `c0a6633d9570178494cb208b42a268f2f3899911`
- Agent commit: `a882f61cad34eed873db5ac52870475e6d71da52`
- Agent tree: `2b2af813b3538308d957a5227ab102c15c04ea58`
- Commit parent: `07efa7ef7aef638900c62e3efa68c03afdeee95e`
- Changed files:
  - `AlembicAgent/src/agent/evaluation/DurableSemanticReviewRuntime.ts`
  - `AlembicAgent/test/durable-semantic-review-runtime.test.ts`
  - `AlembicAgent/test/fixtures/strict-semantic-authority.ts`
  - `AlembicAgent/scripts/fixtures/strict-public-connected-probe.mjs`
  - `AlembicAgent/scripts/probe-agent-public-strict-consumer.mjs`
- `AlembicCore`, `Alembic`, and other sibling repositories were not edited. Core and Main were
  clean at final scope verification.

## Root cause and repair

The task package records the real Main population as one semantic Evidence Ledger occurrence reused
by 15 execution receipts across 8 harvest groups. The rootcause11 blocker report proves why that is
legitimate: Main captures one physical evidence entry and witness per file, then executes the full
multi-family schedule against that stable identity.

The former Agent V4 adapter accepted the flat
`expectedExecutionReceiptBindings` list and then independently required every binding to share one
`harvestKey`, one `harvestReceiptHash`, and one `fileExecutionHash`. This duplicated Core V4's scalar
one-harvest restriction. It rejected the real request with
`SEMANTIC_DISPOSITION_REVIEW_EVIDENCE_EXECUTION_SET_INVALID` before the ledger load or reviewer
invocation.

Choosing one group, filtering receipts, or selecting a representative binding inside Agent would
still be wrong:

- the semantic request and final expanded schedule require the complete receipt universe;
- one authority identity cannot be duplicated per harvest without changing the physical ledger
  occurrence;
- a selected group would omit valid receipt hashes and fail Core's request/authority union checks;
- Agent would become a second canonical selector instead of consuming Core's public authority.

The repair consumes Core V5 `expectedHarvestGroups` exactly once per evidence root. Agent verifies
that every canonical group/binding resolves to a complete request receipt and that all groups share
the same physical Evidence Ledger entry, witness, ProjectContext ref, path, blob, source revision,
and canonical subject. Harvest and file-execution identities remain group-specific. Agent forwards
the exact Core group set to the witness port and returns it to the V5 gateway without filtering,
rewriting, minting, or falling back to V4.

## Test-first evidence

The new one-root cross-harvest test was first run against the V4 runtime:

```text
npx vitest run test/durable-semantic-review-runtime.test.ts \
  -t 'loads one physical production evidence root once for the complete Core V5 cross-harvest groups' \
  --reporter=verbose
```

RED: one test failed with Agent code
`ALEMBIC_AGENT_SEMANTIC_REVIEW_EVIDENCE_AUTHORITY_INVALID`; the Core cause was
`SEMANTIC_DISPOSITION_REVIEW_EVIDENCE_EXECUTION_SET_INVALID`. The failure occurred before the
production store load and provider call, matching the rootcause11 gate.

After the V5 adapter implementation, the durable semantic runtime suite passed 20/20. The combined
focused regression passed 4 files and 61/61 tests.

## Production runtime fixture

The supported public-package probe uses:

- `@alembic/agent/production` for the real durable runtime and production Evidence Ledger/read
  facet;
- `@alembic/core/production` for V5 assertion and Main consumption;
- two real strict fact executor harvests over one frozen artifact, one physical EvidenceEntry, and
  one witness binding;
- an Ed25519 key loaded only through the Agent signing-key custody port;
- the independent reviewer provider/load receipt path.

Observed proof:

- physical evidence roots: 1
- canonical harvest groups: 2
- distinct execution receipts: 3
- one group contains both `file` and `repository` analysis scales
- witness/root loads: exactly 1
- reviewer/provider executions: exactly 1
- V5 attestation schema: 5
- attested group/binding receipt hashes equal the complete semantic request receipt set
- JSON serialization is accepted by both V5 assertion and V5 Main consumption
- a fresh Node process reopens the production ledger, verifies the persisted identity/snapshot and
  EvidenceEntry, then asserts and consumes the serialized V5 attestation without reminting

The original shared-harvest behavior remains covered only as an explicit V5 single-group
compatibility case. The production runtime has no V5-to-V4 fallback.

## Negative and durability matrix

`AlembicAgent/test/durable-semantic-review-runtime.test.ts` proves fail-closed behavior for:

- missing, extra, duplicate, reordered, partial, or truncated request receipt universes;
- missing, extra, duplicate, or reordered serialized groups and bindings;
- mixed/rebound harvest, file execution, source revision, canonical subject, witness, path, blob,
  ledger snapshot, or ledger entry coordinates;
- wrong evidence session, absent evidence, partial evidence load, wrong witness binding/blob/ref,
  and caller-built evidence;
- a caller-supplied structural fake of the production ledger read facet or injected store/key/mint
  fields;
- provider failure, permission denial, malformed output, partial output, reviewer load mismatch,
  producer self-review, alternate trust policy, replayed reviewer identity, concurrent duplicate
  execution, cancellation, and timeout.

Snapshot equality checks prove these failures do not mutate or duplicate the production Evidence
Ledger. The concurrent duplicate is rejected without a second authority load or reviewer call.

## Boundary and compatibility review

- Core owns canonical harvest grouping, group and binding hashing, request conservation, V5
  attestation signing/verification, and Main consumption.
- Agent owns provider invocation, reviewer independence, key custody, production Evidence Ledger
  read-facet provenance, witness adapter validation, cancellation/timeout, and diagnostics.
- Only the public `@alembic/core/host-agent-workflows` V5 gateway contract and public production
  types are consumed.
- No private key, raw mint adapter, process-local registry, second evidence platform, private Core
  source import, or V5-to-V4 fallback was exposed.
- Severity self-review found no high-, medium-, or low-severity residual defect in the assigned
  boundary.

## Verification

- Baseline:
  - `npm run build:check` — passed
  - focused runtime/ledger/AgentRuntime/strict-production chain — 4 files, 60/60 tests passed
- Final:
  - `npm run build:check` — passed
  - focused runtime/ledger/AgentRuntime/strict-production chain — 4 files, 61/61 tests passed
  - `npm run build` — passed
  - `npm run smoke:strict-consumer` — passed
  - built public signature smoke — 15 exports, 451 bindings passed
  - public V5/fresh-process consumer probe — passed
  - `npm run lint:public-api-boundary` — 15 exact exports passed
  - `npm run lint:core-import-boundary` — 319 files and 93 Core imports passed
  - scoped Biome check over all five changed files — passed
  - `npm run check` — 73 test files, 609/609 tests passed; all build, lint, boundary, public,
    validation-floor, test, and retired-symbol stages completed
  - `git diff --check` and cached diff check — passed
  - Alembic Guard round 1 found one method-length warning in the public fixture; the executor
    invariant check was extracted without semantic change
  - Alembic Guard round 2: `guard-public-ms53m18l-2`, 5 files, 0 violations

## Residual risk and next step

Agent's producer contract is complete and committed. Main production composition remains blocked
until the controller accepts this Agent commit and redispatches the Main consumer against the
accepted Core V5 and Agent V5 pair. That follow-up is within the original rootcause12 demand but is
not authorized for this Agent-only target.
