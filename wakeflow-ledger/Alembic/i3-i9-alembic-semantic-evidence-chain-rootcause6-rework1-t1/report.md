# Alembic strict semantic evidence chain rootcause6 rework1

## Outcome

- Task: `i3-i9-alembic-semantic-evidence-chain-rootcause6-rework1-t1`
- Dispatch group: `i3-i9-alembic-semantic-evidence-chain-rootcause6-rework1-p1`
- Status: completed inside the Alembic target boundary.
- Commit: `1c16269796f270ec95ab8a3b1ae9c129573b9ee6`
- Parent: `8d9eea3dda77cd4de7c33327cb66493e347b34ff`
- Tree: `51821d3cc5f36a648ebf777c51ba4e603ceaa748`
- Exact accepted siblings:
  - AlembicCore: `96655b9bbd56f22381ffa7f48a6cd52cabc5a1da`
  - AlembicAgent: `3c95549bb82aa011216d6d3be0f41741ba42d5ad`

Alembic Main no longer constructs `pass` `KnowledgeDispositionReviewV1` receipts for live producer merge/duplicate terminals or investigated-empty decisions. Each such decision now calls the configured `AgentService` through the real host boundary with tools disabled, requires a successful non-empty typed JSON response, validates the exact current fixpoint/population/proposed-disposition/final-schedule/evidence bindings, hashes the actual prompt and response, rejects invocation/output reuse, and only then forms the Core receipt. Missing, malformed, tool-calling, non-pass, stale, rebound, reused, and persisted output-hash-tampered authority all fail closed.

Resume now revalidates each persisted private terminal review against the current expression terminal, fixpoint, full sorted execution denominator, final schedule, population, receipt identity, invocation identity, and response-output hash uniqueness before expression closure or G3 can proceed.

## Changed files

- `lib/recipe-pipeline/generate/strict/StrictDispositionReviewRuntime.ts`
- `lib/recipe-pipeline/generate/strict/StrictPrivateCorpusRuntime.ts`
- `lib/recipe-pipeline/generate/strict/StrictFinalizationRuntime.ts`
- `lib/recipe-pipeline/generate/strict/StrictColdStartOrchestrator.ts`
- `test/integration/StrictRecipePipelineFacade.integration.test.ts`

No Core, Agent, Plugin, Dashboard, Design, Test, Wakeflow runtime, vendor, or cache source was changed.

## Test-first evidence

RED was established by strengthening the real Facade positive test to require five actual disposition-reviewer invocations before implementation:

```text
npx vitest run test/integration/StrictRecipePipelineFacade.integration.test.ts \
  -t "runs the real Facade/Generate/ColdStart chain through one public CAS without network access"

Expected: 5 actual disposition reviewer invocations
Observed before implementation: 0
```

No separate RED commit was created because the task requires one clean repair commit based exactly on the accepted parent.

## Runtime evidence

Fresh-process evidence root:

`wakeflow-ledger/Alembic/i3-i9-alembic-semantic-evidence-chain-rootcause6-rework1-t1/evidence/runtime-json`

The raw evidence includes `checkpoint.json`, `journal.jsonl`, `runtime-report.json`, `reviewer-invocations.json`, `public-route.json`, `marker.json`, and `public-bundle-probe.json`.

`reviewer-invocations.json` proves:

- actual AgentService invocation count: 5
- producer terminal review count: 5
- distinct Agent run count: 5
- distinct response-output hash count: 5
- unmatched invocation output hashes: 0
- unmatched terminal output hashes: 0
- every terminal `reviewer.outputHash` equals the corresponding actual response hash
- every invocation record retains the raw deterministic prompt, raw reply, prompt hash, response-output hash, and Agent run id

The same fresh run remains `FINALIZED` and reaches public CAS:

- fact count: 44 (40 direct, 4 derived)
- expression-set count: 1
- active recipe count: 1
- route hash: `sha256:3f841c7aa8ec8206edffc26429f94a715060c8c395f9dddd8445a929931181a7`
- snapshot id: `snapshot-a0f9ac2acef2fc212c2447cfc0f0288dd54f09cb9fe8745a0e36766383a23cb1`
- serving snapshot manifest: `sha256:8e9d04c6806875e42887576f629fe45776462e0fd747319ddb9e6fb5804a81b5`
- analysis fixpoint: `sha256:02a940a1ee3ae98abdcf19eda83af4df0502cce1cc361dad949a934854545b55`
- final expanded schedule: `sha256:a4d9864adea07a0081ee714b8bc9a80e75040267a8f2e9fac6c3c74c29d34845`
- hypothesis expression-set manifest: `sha256:983811c58a359c8a7d2985946b16bef61f0a757790042b0fbdd877091eb47ebf`

## Negative probes

Producer non-draft terminal tests prove fail-closed handling before `privateCorpusContent`, candidate coverage, and public route creation for:

- missing response
- malformed response
- tool-calling response
- reject/non-pass verdict
- stale fixpoint echo
- rebound proposed-disposition echo
- reused response

Additional recovery mutation proves a persisted reviewer output-hash change is rejected by the Core actor/receipt integrity assertion before public CAS.

Investigated-empty uses the same production helper. Its direct host-boundary probes cover missing, malformed, tool-calling, non-pass, stale, rebound, and reused response output. The reachable matched-denominator path proves the actual independent review runs first, after which the accepted Core `InvestigatedEmptyReviewer` correctly rejects it with `STRICT_INVESTIGATED_EMPTY_REJECTED`.

The old shortcut is absent from production consumers: direct `createKnowledgeDispositionReviewV1` construction now exists only in the shared runtime after actual AgentService response validation; the deterministic fixture returns raw LLM-boundary replies and does not construct the authority receipt under test.

## Investigated-empty positive blocker

The task permits reporting the exact producer-contract blocker when current accepted Core/Agent contracts cannot create an all-inspected-no-pattern denominator without sibling changes. That is the current state:

- `AlembicCore/src/service/plan/intent/coldStartProductionPlan.ts` mounts `certified-project-context` on required anatomy lenses and emits those fact obligations from the required universe.
- `AlembicCore/src/service/production/StrictFactExecution.ts` returns `unknown` with `PROJECT_CONTEXT_OUTCOME_BINDING_MISSING` when a required project-context execution has no bound outcomes.
- The same backend returns `complete` with emitted facts when completed outcomes exist.
- `createExecutionReceipt` therefore maps the missing-outcome case to `unknown`, and the complete outcome case with emitted facts to `matched`; neither produces `inspected-no-pattern`.

Consequently, an all-inspected-no-pattern strict Main denominator is not reachable at the exact accepted Core/Agent hashes. No positive investigated-empty receipt or false-green claim was fabricated, and no sibling repository was changed to manufacture one.

## Validation

- `npm run build:check`: passed.
- `npx tsc --noEmit`: passed.
- `npx biome check --write` on the changed files: passed.
- Focused pre-commit Facade suite: 1 file, 18/18 passed.
- Combined strict private-corpus isolation plus Facade suite: 2 files, 19/19 passed.
- `npm run check`: passed:
  - typecheck passed
  - Biome passed with only the repository's five pre-existing `any` warnings
  - repo boundary passed
  - space-edge passed
  - layer contract passed
  - doctrine passed
  - naming passed
  - Agent extraction boundary passed
  - Core import boundaries passed
  - unit: 157 files, 1194/1194 passed
  - integration: 32 files, 480 passed, 10 existing skipped
  - coverage gate: 3 files, 11/11 passed
  - shared-asset drift: 17 checks, 0 drift, 0 pending sync
  - retired symbols passed
  - ring direction passed
- `npm run build`: passed using local AlembicCore.
- Post-commit focused suite: 2 files, 19/19 passed.
- `git diff --check HEAD^ HEAD`: passed.
- Alembic Guard: `guard-public-ms3aez0g-4`, 5/5 files checked, 0 violations.
- Repository lineage: HEAD parent is exactly the required baseline, exactly one repair commit, clean worktree.
- Sibling integrity: AlembicCore and AlembicAgent remained at the exact accepted commits with clean worktrees.

## Self-review and residual risk

Two-stage requirement and code review found no high-, medium-, or low-severity implementation defect in the scoped diff. The implementation remains within the existing Main `AgentService` plus Agent/Core evaluation/production contracts and introduces no second reviewer or proof platform.

The only residual item is the explicit investigated-empty positive blocker above. Resolving it would require an authorized Core contract change and is not part of this Main-only task. Controller review should treat the blocker as a contract constraint, not as proof of a positive investigated-empty path.
