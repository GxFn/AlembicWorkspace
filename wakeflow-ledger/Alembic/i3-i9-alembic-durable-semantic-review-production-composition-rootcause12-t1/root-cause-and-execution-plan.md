# Rootcause12: Main V5 production composition

## Accepted baseline

- Alembic: `1c16269796f270ec95ab8a3b1ae9c129573b9ee6`
- AlembicCore: `c0a6633d9570178494cb208b42a268f2f3899911`
- AlembicAgent: `a882f61cad34eed873db5ac52870475e6d71da52`
- Baseline verification:
  `npm run build:check && npx vitest run test/integration/StrictRecipePipelineFacade.integration.test.ts test/unit/RecipePipelineFacadeStrict.test.ts test/unit/StrictProductionJournal.test.ts`
  passed with 3 files and 30 tests.

## Root cause and accepted upstream repair

Rootcause11 proved that Main reuses one physical Evidence Ledger entry and one witness binding for
every applicable strict fact obligation on a file. The production fixture therefore presented 15
receipt bindings across eight physical harvest groups, including a harvest reused by more than one
analysis scale. Core/Agent V4 required every binding under one evidence authority to share one
harvest key, harvest receipt, and file-execution hash, so the real Facade route failed before an
Agent provider invocation.

Accepted Core/Agent V5 removes exactly that incompatibility:

- Core alone derives the canonical `expectedHarvestGroups` for each physical evidence root.
- Agent authenticates the complete Core-authored groups against the retained Ledger snapshot and
  witness binding without selecting, splitting, merging, reordering, or duplicating them.
- A V5 load receipt carries the complete group set while preserving one physical entry/snapshot/
  witness load.
- Main receives only the public V5 attestation and uses Core public assert/consume entrypoints.

## Main defect inventory

The current Main strict route still has these production-reachable gaps:

1. `StrictFactExecutionRuntime` creates a synthetic Ledger snapshot and witnesses, then returns only
   facts/receipts/manifest. The physical authority needed by Agent V5 is discarded.
2. `StrictDispositionReviewRuntime` authors a custom prompt, directly calls `AgentService`, parses
   a caller-defined V1 result, and locally mints `KnowledgeDispositionReviewV1`.
3. `StrictPrivateCorpusRuntime` uses that custom path for reviewed merge/duplicate terminal rows.
4. `StrictFinalizationRuntime` uses it for investigated-empty G3 coverage.
5. `StrictColdStartOrchestrator` checkpoints only derived V1 reviews. It does not persist an
   independently enrolled trust policy, serialized V5 attestation, execution hash, or request hash,
   and therefore cannot verify/consume after a fresh-process reopen without review replay.

The older Analyst/Producer typed contracts may still contain Core `KnowledgeDispositionReviewV1`
values for their own zero-hypothesis/falsification structures. They are not Main mint callers and
the accepted public V5 request context does not replace those Agent-owned analysis contracts. The
Main-owned custom/direct caller above is the compatibility path that must become unreachable.

## Authorized implementation chain

1. Add a Main host trust store under the existing workspace `.asd` runtime root. It owns stable
   Ed25519 custody and an independently persisted public-policy registry; no key/provider/runtime
   object enters checkpoint, journal, report, log, or public evidence.
2. Register one DI composition factory. It derives per-run Ledger coordinates and reviewer load
   identity from trusted workspace/provider/runtime receipts, opens Agent's public production
   Ledger, retains portable witness reconstruction data, and returns an opaque task session.
3. Make strict fact execution capture through that exact Agent Ledger authority and reuse it across
   baseline plus expansion execution. Receipt grouping remains entirely Core-authored.
4. Replace the Main custom V1 reviewer with Core V1 semantic-request creation, Agent public V5
   execution, JSON serialization, independent-policy assert, and Core V5 consume.
5. Add a single checkpoint block for review intents/attestations/consumed hashes. A durable
   attestation is reused after restart; an ambiguous provider-completed-but-unpersisted attempt
   fails closed instead of reminting.
6. Bind review manifest/policy/execution hashes into the existing expression-closure and candidate
   coverage journal rows. Only consumed reviews may reach terminal rows, private persistence,
   G3/G4, or CAS.
7. Prove the real Facade schedule, negative boundaries, and fresh-process no-remint recovery, then
   run repository validation and Alembic Guard.

## Non-goals

- No Core, Agent, Plugin, Test-window, Wakeflow runtime, or vendor changes.
- No V5-to-V4 fallback.
- No Main-authored harvest group or receipt regrouping.
- No second journal, evidence platform, reviewer platform, or publication authority.
- No task-level key/signer/policy/provider/Ledger/witness/gateway/prebuilt-attestation injection.

## Implemented production composition

Commit `e8610b504498cd85cb06a4e31fb48e5dfe84f005` (tree
`8c45f5a76f2c49e64b5ce6982fe09bbfe1e8ef01`) is based exactly on Main
`1c16269796f270ec95ab8a3b1ae9c129573b9ee6`. The local accepted siblings stayed at
Core `c0a6633d9570178494cb208b42a268f2f3899911` and Agent
`a882f61cad34eed873db5ac52870475e6d71da52`, both clean.

The commit changes twelve Main files only:

- `lib/infrastructure/config/SemanticReviewTrustStore.ts`
- `lib/injection/ServiceMap.ts`
- `lib/injection/modules/AgentModule.ts`
- `lib/recipe-pipeline/generate/strict/StrictAnalysisRuntime.ts`
- `lib/recipe-pipeline/generate/strict/StrictColdStartOrchestrator.ts`
- `lib/recipe-pipeline/generate/strict/StrictDispositionReviewRuntime.ts`
- `lib/recipe-pipeline/generate/strict/StrictFactExecutionRuntime.ts`
- `lib/recipe-pipeline/generate/strict/StrictFinalizationRuntime.ts`
- `lib/recipe-pipeline/generate/strict/StrictPrivateCorpusRuntime.ts`
- `lib/service/semantic-review/StrictSemanticReviewRuntimeFactory.ts`
- `test/integration/StrictRecipePipelineFacade.integration.test.ts`
- `test/unit/SemanticReviewTrustStore.test.ts`

The resulting call chain is:

1. DI constructs `StrictSemanticReviewRuntimeFactory` from the real configured provider, Agent
   production Evidence Ledger/witness authority, and Main's stable trust store.
2. Strict fact execution retains the real physical evidence and witness projection. Main never
   creates or transforms harvest groups.
3. Core creates the semantic request and its complete eight-group/fifteen-receipt expectation.
4. Agent V5 performs one authenticated Ledger/witness load and one provider evaluation for that
   evidence root and returns a serialized V5 attestation.
5. Main JSON-roundtrips and checkpoints the attestation and its independently enrolled public
   policy/execution/request hashes before calling Core V5 assert/consume.
6. Only a `consumed` checkpoint record may reach expression closure, private-corpus terminal rows,
   candidate coverage/G3/G4, finalization, or CAS.
7. Fresh-process recovery reads the public registry and persisted attestation, re-verifies and
   consumes it without opening private custody, reloading the Ledger, or invoking the provider.

The previous production-reachable Main custom-prompt/V1 mint caller was removed. Searches over the
changed production package found no reachable V1/V3/V4 semantic disposition reviewer path. Older
Agent Analyst/Producer typed `KnowledgeDispositionReviewV1` values remain only in their separate
upstream analysis contracts; they do not authorize Main terminal persistence.

## Durable custody and recovery

- The stable Ed25519 PKCS#8 key lives under the existing
  `<dataRoot>/.asd/semantic-review-trust/signing-key.pk8` with mode `0600`.
- The independently approved public policy registry is the sibling
  `approved-policies.json` with mode `0644`.
- Once a registry exists, a missing key fails closed. Unsafe modes, invalid key bytes, policy/key
  rotation, registry tampering, and revoked enrollment all fail closed.
- Main derives the expected policy only from trusted bootstrap configuration and refuses
  task/checkpoint/runtime supplied policy, signer, key, provider, Ledger, witness, gateway, or
  prebuilt attestation injection.
- A persisted `intent` without an attestation is treated as ambiguous provider completion and is
  not reminted. Persisted `attested` records are consumed once; `consumed` records are replayed
  without provider execution.

The built-artifact two-child-process custody probe reopened one runtime root twice and returned:

```json
{"ok":true,"processes":2,"samePolicyHash":true,"sameEnrollmentHash":true}
```

The Facade integration fixture additionally recreates the factory/session from disk, proves that
the provider invocation count does not grow, and reruns Core assert/consume against the serialized
checkpoint attestation.

## Runtime and negative evidence

The real `RecipePipelineFacade` / `StrictColdStartOrchestrator` fixture reaches `FINALIZED` with five
serialized-and-consumed V5 reviews. Each review binds:

- one physical E-1 Evidence Ledger root and one witness;
- exactly fifteen execution receipts;
- exactly eight Core-authored harvest groups;
- at least one group reused across multiple analysis scales;
- exactly one physical Ledger/witness load and one independent provider invocation.

Receipt union and group order are rechecked by Core/Agent public contracts. Focused negative cases
reject missing/extra/duplicate/reordered/partial groups and bindings, mixed coordinates,
file/source/blob/witness/Ledger rebound, serialized attestation tampering, key/policy
missing/replacement/rotation/revocation/self-authorization, provider malformed/tool/permission/
cancel/timeout failures, replay/concurrency, and crashes around intent/attestation/consumption.
Failure cases are checked before production Ledger mutation, terminal persistence, G3/G4, and CAS.

## Validation evidence

Baseline RED reproduced the rootcause11 V4 single-harvest rejection before any provider invocation.
The final commit passed:

- focused V5 custody/policy/journal/recovery/Facade suite: 4 files, 33 tests;
- `npm run build:check`;
- `npm run lint` (five pre-existing unrelated warnings only, in `AgentRunProjections.ts` and
  `handler-runtime.ts`);
- `npm run lint:repo-boundary`;
- `npm run check:shared-asset-drift` (17 checks, no drift);
- `npm run check` (unit 158 files/1197 tests, integration 32 files/480 passed + 10 skipped,
  coverage 3 files/11 tests, plus all type/layer/public-import/Agent-extraction/naming/retired/ring/
  shared-asset gates);
- `npm test` (191 files, 1699 passed + 10 skipped);
- `npm run build`;
- `git diff --check`;
- exact Main parent/head/tree, accepted Core/Agent heads, and all three clean-worktree checks;
- Alembic Guard after warning repairs: 12 files, 0 violations,
  `guard-public-ms569wk2-2`.

Alembic lifecycle references are `prime-public-ms54m6xs-1`,
`work-public-ms54n9y6-1`, and `finish-public-ms56rz06-1`.

## Known accepted upstream limitation

An additional exploratory test attempted to prove a positive all-`inspected-no-pattern`
investigated-empty run on an actually empty frozen source. The attempt did not change the commit and
was removed after proving the same accepted Core reachability limitation already recorded by
rootcause6 rework1:

- with the required ProjectContext families present, absent request outcomes return
  `unknown / PROJECT_CONTEXT_OUTCOME_BINDING_MISSING`;
- every completed matching ProjectContext outcome emits a fact, so the population is non-empty;
- removing the ProjectContext families makes the Agent Plan reject its frozen action set with
  `PLAN_UNKNOWN_FROZEN_QUERY`.

Evidence:

- `AlembicCore/src/service/production/StrictFactExecution.ts`,
  `createProjectContextFactQueryBackendV1`;
- `AlembicAgent/src/agent/runs/plan/PlanAgentRun.ts`, `parseStrictPlanIntent`;
- prior accepted result
  `.wakeflow-active/current/recipe-coldstart-production-quality-2026-07-15/target-results/tr-i3-i9-alembic-semantic-evidence-chain-rootcause6-rework1-t1.json`.

This is not a new Main V5 composition defect and resolving it would require an unauthorized sibling
contract change. The current task still proves the production-reachable investigated-empty branch
fails closed and never falls back to the removed Main V1 reviewer.

## Final self-review

The final diff remains limited to Main host composition, checkpoint/journal integration, and
tests. It does not modify Core/Agent ownership, does not derive or select groups, does not expose
private key material, and does not add a second journal/reviewer/evidence platform. No high,
medium, or low implementation findings remain after the two-stage review and Guard repair. The
only residual is the previously accepted positive investigated-empty reachability limitation above.
