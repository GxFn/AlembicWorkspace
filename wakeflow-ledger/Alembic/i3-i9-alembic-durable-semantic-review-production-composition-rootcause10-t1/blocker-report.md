# Alembic rootcause10 production composition blocker

## Result

- Status: `blocked`
- Target: `i3-i9-alembic-durable-semantic-review-production-composition-rootcause10-t1`
- Main baseline / final clean HEAD: `1c16269796f270ec95ab8a3b1ae9c129573b9ee6`
- Accepted Core: `d0d33e49cab732ec541bcfc3fb35447b6e2ad58d`
- Accepted Agent: `2bf05831bc95a89347df7e4035bfeadbc93c3c09`
- Commit: none; a Main-only change cannot satisfy the accepted authority contracts.
- Repository state after investigation: clean. The rejected implementation experiment was fully reverted.

## Exact incompatibility

The real Main baseline schedule contains distinct obligations for multiple `analysisScale` values.
That cardinality is required by Core and cannot be deduplicated:

1. Core includes `analysisScale` in `FactHarvestObligationV1` identity and creates a distinct
   obligation/receipt for every supported scale.
2. Core intentionally excludes `analysisScale` and `obligationId` from `harvestKey`, so those
   receipts share one physical harvest, one `harvestReceiptHash`, and the same file
   `evidenceEntryId`.
3. A semantic-review request must contain every final-schedule execution receipt.
4. Core V2/V3 durable review requires evidence authorities to cover the exact set of all receipt
   hashes, while keeping evidence authority identities unique.
5. Agent `selectExactExecution` scans all request receipts for each evidence entry and requires
   exactly one match.

The accepted Core behavior is explicitly frozen by
`AlembicCore/test/StrictFactExecution.test.ts`: a `file + repository` schedule must produce two
receipts, one harvest, and the same `harvestReceiptHash`.

Consequently, a legitimate shared-harvest evidence entry matches multiple scale receipts and Agent
rejects it. Main cannot mint distinct evidence entries per scale either: doing so changes the file
execution and harvest hashes, after which Core rejects the combined fact manifest because identical
`harvestKey` values no longer conserve one `harvestReceiptHash`.

## Reproduction evidence

The actual `RecipePipelineFacade -> StrictColdStartOrchestrator` fixture produced both sides of the
conflict:

1. Reusing the real shared Evidence Ledger entry from the accepted Core full-schedule execution
   failed before V3 mint with:

   ```text
   STRICT_SEMANTIC_REVIEW_EVIDENCE_EXECUTION_AMBIGUOUS:E-1:
   [["repo:folder-strict-main:module:module:src",15]]
   ```

   This is the same cardinality rejected by Agent
   `ALEMBIC_AGENT_SEMANTIC_REVIEW_EVIDENCE_EXECUTION_MISMATCH` (`found 15` after entering the opaque
   runtime).

2. Capturing distinct production Ledger entries and executing each obligation separately made each
   single-obligation Core result valid, but combining the exact receipts failed Core at
   `assertHarvestReceiptConservation`:

   ```text
   STRICT_FACT_GENERATION_MANIFEST_INVALID
   ```

3. A possible dual-execution workaround was rejected during self-review. Keeping one receipt set
   for the accepted fact manifest and another for semantic review would detach the V3 attestation
   from the authoritative strict fact result. It exploits missing local cross-checks rather than
   satisfying the required exact Core authority chain.

## Why Main-only alternatives are invalid

- Removing one scale changes the required applicability universe, schedule hashes, canonical plan,
  final schedule, fixpoint, manifest, and public lineage. It also loses scale-specific aggregate
  semantics.
- Rewriting `harvestReceiptHash`, receipt IDs, capability IDs, subject bindings, or witness hashes
  would fabricate authority.
- Sending only one receipt violates final-schedule receipt conservation and Core V2 evidence
  authority coverage.
- Capturing one evidence entry per receipt violates Core harvest conservation for equal
  `harvestKey`.
- Maintaining a second review-only execution chain violates the task's exact retained
  evidence/witness/execution authority requirement.

## Required upstream repair

Core and Agent must first agree on shared-harvest cardinality. A compatible public contract needs
to let one authenticated Ledger entry/file execution authorize every exact receipt that
legitimately shares the same Core harvest, while still binding and verifying each distinct
obligation/scale receipt. For example:

- carry the selected `executionReceiptHash` as part of each authority load coordinate and allow
  multiple authorities to reference the same authenticated Evidence entry; or
- model one evidence authority as an authenticated set of same-harvest receipt/file-execution
  coordinates and verify the set against Core harvest conservation.

The repair must add a public Core + Agent fixture using at least two scales sharing one harvest.
The current upstream fixtures are evidence-to-receipt 1:1 and therefore do not cover this accepted
Core schedule behavior.

After that repair is accepted, this Main task can resume stable Ed25519 custody, independent policy
enrollment, real production Ledger reopen, V3 checkpoint/journal persistence, fresh-process
no-remint recovery, negative injection probes, Guard, and the requested clean Main commit.

## Commands and repository proof

- Baseline `npm run build:check`: passed.
- Trust-store RED experiment: missing module reproduced; the experimental GREEN test and source were
  not retained because the end-to-end contract is blocked.
- Focused real-facade reproductions: failed at the two exact authority gates above.
- Final `git diff --check`: passed.
- Final `git status --porcelain=v1 --untracked-files=all`: empty.
- Final `git rev-parse HEAD`: `1c16269796f270ec95ab8a3b1ae9c129573b9ee6`.

