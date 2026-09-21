# Alembic durable semantic review consumption — blocker report

## Dispatch coordinates

- Window: `Alembic`
- Task: `i3-i9-alembic-durable-semantic-review-consumption-rootcause8-t1`
- Dispatch group: `i3-i9-alembic-durable-semantic-review-consumption-rootcause8-p1`
- State root: `.wakeflow-active/current/recipe-coldstart-production-quality-2026-07-15`
- Outcome: `blocked`
- Product files changed: none
- Commit: none; the task package's explicit production-key boundary prevents a fixture-only implementation.

## Exact clean baselines

- Alembic: `1c16269796f270ec95ab8a3b1ae9c129573b9ee6`
- AlembicCore: `d0d33e49cab732ec541bcfc3fb35447b6e2ad58d`
- AlembicAgent: `5f6e8b1e6745a46752c8a6b035827e8889bcefbf`
- All three worktrees were clean before investigation and remained unmodified.

Baseline verification:

- `npm run build:check` — passed.
- `npx vitest run test/integration/StrictRecipePipelineFacade.integration.test.ts` — passed, 1 file / 18 tests.
- These tests establish the clean Main V1 baseline only; they do not prove V3 signature/policy persistence or fresh-process consumption.

## Root cause

Main still owns the old semantic-review path:

- `lib/recipe-pipeline/generate/strict/StrictDispositionReviewRuntime.ts` constructs its own prompt, calls generic `AgentService.run`, derives invocation/output hashes locally, and directly mints `KnowledgeDispositionReviewV1`.
- `StrictPrivateCorpusRuntime.ts` and `StrictFinalizationRuntime.ts` consume only that V1 review and drop the execution record.
- Producer-zero has another V1 bypass through `set.zeroDisposition.dispositionReview`.
- `StrictColdStartOrchestrator` checkpoint schema and `StrictProductionJournal` do not persist a pinned V3 trust policy, serialized V3 attestations, or consumed execution hashes. Fresh-process replay therefore either re-invokes the reviewer or trusts an old V1 receipt without V3 verification.

Accepted upstream revisions do expose the necessary public contracts:

- Core exports `assertSemanticDispositionReviewTrustPolicyV3`, `assertSemanticDispositionReviewDurableAttestationV3`, and `consumeMainSemanticDispositionReviewDurableAttestationV3` from `@alembic/core/production`.
- Agent exports opaque `createDurableSemanticReviewRuntime` from `@alembic/agent/evaluation`.
- Core requires Main's `expectedTrustPolicy` to come from a durable, pre-approved configuration/trust store rather than from the task or the attestation being verified.
- Agent's trusted bootstrap requires a stable signing-key provider, pinned reviewer/model-load receipt, a real Evidence Ledger read port, and exact witness authority.

## Exact blocker

No real across-process stable configured Ed25519 key-custody/config route exists in the accepted Main/Core/Agent revisions.

The concrete breakpoints are:

1. Main config, runtime-config receipts, DI, and services have no `trustRootId`, `keyId`, signing-key locator/provider, rotation/version state, or pre-approved public trust-policy store.
2. The existing workspace secret store is an AI-provider API-key store. It has no create-once/load/rotate Ed25519 contract, key identity, policy enrollment, or public-policy pinning and therefore is not an existing stable key-custody route.
3. Using `runtime.trustPolicy` from the same just-created signer as Main's `expectedTrustPolicy` would make the signer self-authorizing, contrary to the Core consumer contract.
4. Agent's real `EvidenceLedgerStore` is private to Agent internals and is not exported through `@alembic/agent/evaluation` or another public package subpath. Main cannot legally obtain the required production read authority and must not deep-import it.
5. Main's fact runtime currently discards the exact evidence snapshot/witness authority at its return boundary, so a later V3 review cannot reconstruct the accepted historical evidence chain.
6. The only concrete Ed25519 key generation found in the accepted codebase is test/probe fixture generation. It is ephemeral and cannot satisfy fresh-process recovery.

The task package states that an across-process stable configured Ed25519 key must be used and that an ephemeral production key, a journaled private key, or a second key/reviewer/evidence/journal platform is forbidden. It further requires returning this exact blocker when no real stable key-custody/config route exists. Accordingly, no RED test or product implementation was added: any GREEN available inside the current package boundary would be fixture-only or would invent a new authority platform.

## Required upstream/architecture decision before redispatch

The controller should authorize and assign the owners of:

1. A real stable Ed25519 key-custody/config provider with explicit enrollment, key identity, rotation/revocation, and across-process loading. Task/request code must never receive the private key.
2. A separate durable public trust-policy store whose approved policy is pinned before review and compared field-for-field at Agent runtime bootstrap and Main consumption.
3. An Agent public production Evidence Ledger read authority (factory/service/readonly handle), rather than a deep import or structural test adapter.
4. Main retention of exact evidence snapshot/witness bundles across its fact-execution boundary, plus journal/checkpoint persistence of policy, serialized attestation, registry, and consumed execution hashes.

After those authorities exist, Main can replace every strict V1 path with:

`SemanticDispositionReviewRequestV1` → opaque Agent V3 runtime → persist serialized attestation → Core independent consumer with pre-pinned policy → terminal closure / persistence / G3 / CAS.

## Residual risk

Proceeding without the decision above would allow a fresh process to trust a newly generated key, remint a review, or reconstruct evidence outside the original authority. Any of those would falsely report durable semantic-review consumption while preserving the original integrity defect.
