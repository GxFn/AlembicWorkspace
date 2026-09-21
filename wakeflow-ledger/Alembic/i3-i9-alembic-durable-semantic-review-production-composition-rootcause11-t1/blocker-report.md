# Alembic rootcause11 production composition blocker

## Result

- Status: `blocked`
- Target: `i3-i9-alembic-durable-semantic-review-production-composition-rootcause11-t1`
- Main baseline / final clean HEAD: `1c16269796f270ec95ab8a3b1ae9c129573b9ee6`
- Accepted Core: `8602b9e6dd03a362736118a92cfd4ae24e35661e`
- Accepted Agent: `07efa7ef7aef638900c62e3efa68c03afdeee95e`
- Commit: none. A Main-only commit cannot satisfy the exact accepted V4 contracts against the real
  strict production schedule.
- Repository state after investigation: Main, Core, and Agent are all clean. The bounded Main
  custody/composition experiment and its test changes were fully reverted.

## Root-cause10 repair that is now proven

The accepted V4 contracts repair the exact rootcause10 defect:

- Core derives the complete canonical `expectedExecutionReceiptBindings` set instead of letting
  Agent select one receipt.
- Agent authenticates one Ledger entry/witness authority against that complete set instead of
  applying the former exact-one receipt selection.
- The Core and Agent positive fixtures prove two distinct scale/obligation receipts when both share
  one `harvestKey`, one `harvestReceiptHash`, and one `fileExecutionHash`.

That repair is real, but its contract is narrower than the real Main strict schedule. It supports
multiple receipt bindings only inside one shared harvest.

## New exact incompatibility

Main creates one Evidence Ledger entry and one witness binding per physical projected file before it
executes the complete schedule:

- `Alembic/lib/recipe-pipeline/generate/strict/StrictFactExecutionRuntime.ts:148-174` creates one
  evidence entry and witness binding per file.
- `Alembic/lib/recipe-pipeline/generate/strict/StrictAnalysisRuntime.ts:109-127` assigns one stable
  `E-n` identity per file and executes the full compiled schedule against those bindings.
- Core `StrictFactExecution.ts:648-664` indexes witness bindings by `repoId + relativePath`, so the
  same file evidence/witness is reused by every applicable obligation.

The real schedule contains multiple query families and therefore multiple physical harvests for the
same file Evidence entry. V4 cannot represent that legitimate population:

1. Core V4 calls
   `createSemanticDispositionReviewExpectedExecutionReceiptBindingsV3` for each evidence before
   loading the Ledger or invoking Agent
   (`DurableSemanticDispositionReviewAuthority.ts:303-319`).
2. The helper enumerates every receipt/file execution matching the evidence, then requires exactly
   one `harvestKey`, one `harvestReceiptHash`, and one `fileExecutionHash`
   (`SemanticDispositionReviewExecution.ts:1774-1823`). The real mixed-harvest set therefore fails
   with `SEMANTIC_DISPOSITION_REVIEW_EVIDENCE_EXECUTION_SET_INVALID`.
3. Even if that helper were bypassed, the V3 evidence-authority canonicalizer requires all receipt
   bindings to share the same harvest and source authority
   (`SemanticDispositionReviewExecution.ts:585-698`), otherwise
   `SEMANTIC_DISPOSITION_REVIEW_EVIDENCE_AUTHORITY_V3_HARVEST_MISMATCH` is raised.
4. Agent independently enforces the same single-harvest/file/witness invariant in
   `validateExpectedExecutionReceiptBindings` and `requireSharedHarvestAuthority`
   (`DurableSemanticReviewRuntime.ts:528-547,626-650`).

The bounded real-Facade composition probe failed at the first Core gate with:

```text
SEMANTIC_DISPOSITION_REVIEW_EVIDENCE_EXECUTION_SET_INVALID
```

A second probe added a valid file+repository shared-harvest pair while retaining the rest of the
real schedule. That pair passed the new shared-harvest cardinality check, but the resulting single
authority did not cover the other real receipt hashes and failed with:

```text
SEMANTIC_DISPOSITION_REVIEW_EVIDENCE_AUTHORITY_V3_MISMATCH
```

Both probes were diagnostic RED experiments only and were fully reverted.

## Why Main-only decomposition is impossible

- Splitting the same Evidence entry into one authority per harvest is rejected because Request V3
  requires unique `(sessionId, evidenceEntryId)` authority identities
  (`SemanticDispositionReviewExecution.ts:889-893`).
- Retaining only one authority is rejected because authority receipt hashes must exactly equal the
  semantic request's complete receipt universe (`SemanticDispositionReviewExecution.ts:895-900`).
- Core V4 verifies the same complete load-receipt union again
  (`DurableSemanticDispositionReviewAuthority.ts:839-887`).
- Splitting the population into multiple semantic requests is rejected because every V1 request
  must carry the entire `finalExpandedSchedule.obligationIds` receipt set
  (`SemanticDispositionReviewExecution.ts:2120-2142`).
- Filtering, selecting, grouping, rewriting, or duplicating bindings in Main is both forbidden by
  this task's boundary and rejected by the canonical union/final-schedule gates.
- Creating per-harvest Evidence entries inside Main would change the accepted strict fact
  evidence/witness identity contract and is not an adapter-level composition change.
- `@alembic/core/production` exposes V4 verification/consumption and types, not a public alternate
  authority minting route. The host-agent workflow gateway and Agent runtime still enforce the
  same invariants.

The Core regression test explicitly rejects a mixed-harvest authority
(`AlembicCore/test/SharedHarvestSemanticEvidenceAuthority.test.ts:223-271`). The Agent positive V4
fixture explicitly proves only two scales inside one harvest
(`AlembicAgent/test/durable-semantic-review-runtime.test.ts:174-228`). Thus the observed failure is
the contract's tested behavior, not a Main wiring defect.

## Required upstream repair

Core and Agent must first expose and accept a canonical public authority model for one Evidence
Ledger entry/witness used across multiple legitimate harvest groups in one complete semantic
request. A compatible repair could take either form:

1. allow one evidence authority/load receipt to carry multiple canonical harvest groups while
   conserving every exact obligation/receipt/file/witness binding and the complete receipt union; or
2. define per-harvest evidence/witness identities in strict fact execution, with compatible
   manifest, request-evidence uniqueness, receipt-union, and fresh-process Ledger semantics.

The repair needs a positive public Core + Agent integration fixture with one physical file, one
semantic request, at least two distinct harvest keys, at least one same-harvest file+repository
pair, and a complete V4 attestation accepted through consumption. Existing mixed-harvest negative
coverage must then distinguish unauthorized mixing from this legitimate complete population.

After that sibling change is authorized and accepted, Main can safely resume stable Ed25519
custody, independent public-policy enrollment, opaque Agent runtime injection, V4
journal/checkpoint persistence, Core consumption before terminal closure/G3/G4/CAS, and
fresh-process no-remint recovery.

## Validation and repository proof

- Baseline command before any experiment:
  `npm run build:check && npx vitest run test/integration/StrictRecipePipelineFacade.integration.test.ts test/unit/RecipePipelineFacadeStrict.test.ts test/unit/StrictProductionJournal.test.ts`
  passed: build/typecheck passed; 3 files and 30/30 tests passed, including 18/18 integration tests.
- The bounded host custody/session implementation reached GREEN before the real Facade V4
  composition exposed the mixed-harvest gate; it was not retained because the assigned end-to-end
  capability remains impossible.
- Post-revert `npx tsc --noEmit --pretty false`: passed.
- Final `git diff --check`: passed.
- Final `git diff --exit-code`: passed.
- Final Main/Core/Agent worktree checks: empty.
- Final exact HEADs:
  - Main `1c16269796f270ec95ab8a3b1ae9c129573b9ee6`
  - Core `8602b9e6dd03a362736118a92cfd4ae24e35661e`
  - Agent `07efa7ef7aef638900c62e3efa68c03afdeee95e`
- Alembic Guard: not applicable to retained code because no source or test diff remains.
- Full build/check/test matrix was not rerun after the proven upstream gate. Running unrelated
  suites cannot establish the missing cross-harvest V4 contract and would not authorize sibling
  changes.

## No-commit reason

No Main commit exists because all safe Main-only designs still terminate at an accepted Core/Agent
contract rejection. Committing only custody scaffolding, a filtered receipt path, or a test-only
shared-harvest fixture would be a partial implementation and would falsely report the requested
real production composition as complete.
