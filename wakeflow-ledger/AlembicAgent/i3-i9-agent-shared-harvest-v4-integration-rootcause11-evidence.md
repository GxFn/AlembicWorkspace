# AlembicAgent Core V4 shared-harvest integration evidence

- Task: `i3-i9-agent-shared-harvest-v4-integration-rootcause11-t1`
- Dispatch group: `i3-i9-agent-shared-harvest-v4-integration-rootcause11-p1`
- Agent commit: `07efa7ef7aef638900c62e3efa68c03afdeee95e`
- Exact Agent parent: `2bf05831bc95a89347df7e4035bfeadbc93c3c09`
- Agent tree: `35f551cd9ca80497a76fb7dfd69d2afe60c48b0c`
- Exact Core upstream: `8602b9e6dd03a362736118a92cfd4ae24e35661e`
- Changed scope: 10 files in `AlembicAgent`; Agent and Core worktrees clean.

## Root cause and authority repair

At the exact Agent parent, `selectExactExecution` flat-mapped every request receipt whose
source/subject and complete file execution matched the evidence. A legitimate file-scale receipt
and repository-scale receipt sharing one physical harvest therefore produced two valid matches.
The scalar guard `matches.length !== 1` rejected that real authority with “found 2”.

The V3 store result also required the Agent adapter to return one `executionReceipt` and one
`fileExecutionHash`, which made Agent the scalar choice point. The repair removes those result
fields, consumes Core V4 `expectedExecutionReceiptBindings` as the sole grouping set, maps each
Core-supplied binding back to its exact accepted request receipt, and verifies that the complete
set shares the same harvest, file execution, witness, ProjectContext, source, subject, path and
blob coordinates. Agent loads the existing Ledger entry/snapshot/witness once; it does not select,
collapse, duplicate or synthesize receipts.

The test-first RED run failed with:

`ALEMBIC_AGENT_SEMANTIC_REVIEW_EVIDENCE_EXECUTION_MISMATCH: Expected exactly one accepted file execution for E-1; found 2.`

The temporary RED object was `a427a4bf1ddf002b368533f50b5e0dc639a2146e`; it was amended
with the implementation into the required single final commit.

## Runtime fixture

The built public consumer uses `@alembic/agent/production`, the real production Evidence Ledger
factory/read facet, Core strict fact execution and the Agent witness-authority port. One request
contains file/repository obligations with two distinct obligation IDs and receipt hashes, but one
harvest key, harvest receipt hash, file execution, witness and Ledger entry.

Observed proof:

- V4 attestation schema version: 4
- execution receipt binding count: 2
- evidence-authority/witness load count: 1
- independent provider call count: 1
- compiled prompt: exact Core prompt
- serialized V4 assertion: passed
- fresh-process production Ledger reopen: passed
- fresh-process Core V4 assertion and Main consumer: passed

## Negative and boundary evidence

`AlembicAgent/test/durable-semantic-review-runtime.test.ts` rejects missing, extra, duplicate,
reordered and truncated binding universes; mixed harvest/file/witness/blob/source coordinates;
partial/truncated execution; Ledger entry/snapshot rebound; witness mismatch; fake production
facets; reused/concurrent execution; malformed reviewer output; provider failure; permission
denial; cancellation and timeout. Failure probes compare the production Ledger snapshot before
and after to prove no duplicate or mutation.

`AlembicAgent/src/production.ts` exports the real runtime factory and public runtime ports.
`AlembicAgent/config/agent-public-api-boundary.json` keeps Core gateway/store adapters, private
keys, process-local registries and the underlying Ledger store private. Agent remains the
provider/key-custody/Ledger/witness orchestrator; Core remains the binding-set, gateway,
signature and verifier authority. Main integration remains downstream.

## Validation transcript

- Focused RED: shared-harvest fixture failed the old scalar selector with `found 2`.
- Focused GREEN:
  `npm test -- test/durable-semantic-review-runtime.test.ts test/production-evidence-ledger-authority.test.ts test/AgentRuntime.test.ts test/public-strict-facades.test.ts`
  — 4 files, 49 tests passed.
- `npm run build:check` — passed.
- `npm run smoke:strict-consumer` — built public two-binding V4 fixture and fresh-process
  verifier/consumer passed.
- `npm run smoke:public-signatures` — 15 exports, 451 bindings passed.
- `npm run lint:public-api-boundary` — 15 exact exports, no wildcard exports.
- `npm run lint:core-import-boundary` — 319 files, 92 Core imports passed.
- Scoped Biome over 8 changed TS/JS files — passed.
- `git diff --check` — passed.
- `npm run check` after final Guard repair — 73 test files, 608 tests passed; all build, lint,
  boundary, smoke, validation-floor and retired-symbol gates passed.
- Alembic lifecycle: `finish-public-ms4z44uc-1`.
- Alembic Guard: `guard-public-ms4z72p1-2`, 8 files checked, 0 violations.

Full Biome reports 21 existing warnings in unchanged files; the task-scoped files are clean and
the full check exits successfully.
