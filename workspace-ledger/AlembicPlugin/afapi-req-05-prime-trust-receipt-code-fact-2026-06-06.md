# AFAPI REQ-05 Prime Trust Receipt Code Fact

Date: 2026-06-06
Window: AlembicPlugin
Task: AFAPI-REQ-05-PRIME-TRUST-RECEIPT-CODE-FACT-T1
Scope: Stage 0 read-only receipt inventory for public `alembic_prime` and hidden legacy compatibility `alembic_task prime`.

## Result

AlembicPlugin already has the core Prime Trust Receipt implementation in source, tests, embedded runtime dist, and packaged runtime artifact. No product implementation change was made in this Stage 0 task.

Current commits:

- AlembicPlugin: `0abe90ca00aa7e867444eb779d0258cca2abe157`
- Embedded runtime `plugins/alembic-codex`: `4683da2723f8dae18d6dca6796ca1ef19636f19c`
- `plugins/alembic-codex/runtime.tgz` sha256: `0c78668944e83bd986853e04540452f7459b2f7524db2c9560c505fc5fd63e80`

## Code Facts

### Five-Layer Receipt Material Exists

`lib/service/task/PrimeKnowledgeMaterial.ts` defines the canonical material:

- `PrimeTrustLayer`: `trusted-to-obey`, `trusted-to-use`, `context-only`, `requires-verification`, `not-available-or-degraded` at lines 11-17.
- `PrimeKnowledgeMaterial` carries `trustPosture`, `shoutInstruction`, and `hostResponse` at lines 127-156.
- `buildPrimeKnowledgeMaterial()` computes delivered / empty / degraded status and builds receipt material at lines 173-232.
- `buildPrimeTrustPosture()` maps accepted guards to `trusted-to-obey`, accepted recipes / ready resident selected knowledge to `trusted-to-use`, host intent and intent evidence to `context-only`, source refs / candidate package fields to `requires-verification`, and empty / degraded / unavailable paths to `not-available-or-degraded` at lines 268-450.
- `buildPrimeShoutInstruction()` and `buildPrimeHostResponseInstruction()` require a developer-visible first-person receipt immediately after prime, before further tool calls, code reading, edits, Guard checks, or final summary at lines 592-647.

### Public `alembic_prime` Projects Receipt Into Stable Package

`lib/codex/mcp/handlers/agent-public-tools.ts`:

- `primeHandler()` builds `primeKnowledgeMaterial`, `result`, and `primePackage` for public `alembic_prime` at lines 318-495.
- Blocked prime still returns a canonical `PrimePublicPackage` with `primeRef`, `detailRefs`, source policy, runtime policy, and no trusted claim posture at lines 324-376.
- Ready / degraded / empty public prime returns `primeKnowledgeMaterial`, `primePackage`, `result`, `runtimePolicy`, `sourcePolicy`, and `detailRefs` at lines 472-494.
- `buildPrimePublicPackage()` keeps compact counts and refs in `compactPackage`, retains full receipt material separately, and marks `pluginSynthesized=false` for producer-only package fields at lines 1985-2084.
- `buildPrimeTrustPostureProjection()` guarantees five public receipt layers and sets `noTrustedClaimRequired` unless the result is ready and material status is delivered at lines 2091-2122.
- `buildPrimeSourcePolicy()` keeps `rawAutomationEnvelopeUsedAsQuery=false` and `rawThreadIdsPersisted=false` at lines 2136-2158.
- `buildResultSummary()` bounds only the visible compact summary; receipt / refs remain in structured fields at lines 2275-2290.

`lib/codex/mcp/public-tools/contract.ts`:

- `PRIME_PUBLIC_TRUST_LAYERS` fixes the five-layer order at lines 314-320.
- `PrimePublicPackageSchema` requires `trustPosture.receiptChecklist` with exactly five layers, `trustReceipt`, `sourcePolicy`, `runtimePolicy`, `compactPackage`, `diagnostics.outputBudget`, and producer-boundary fields at lines 322-485.

### Degraded / Empty No-Trusted-Claim Path Exists

Evidence:

- Empty / degraded material adds a `not-available-or-degraded` item and prevents `trusted-to-obey` / `trusted-to-use` claims in `PrimeKnowledgeMaterial.ts` lines 403-428 and 609-626.
- Public package projection sets `noTrustedClaimRequired=true` for non-ready or non-delivered results in `agent-public-tools.ts` line 2118.
- Public raw automation prime without `sourceRefs` is blocked and still returns source policy + no trusted claim posture, covered by `test/unit/AgentPublicToolsActive.test.ts` lines 692-776.

### Legacy Compatibility Prime Is Hidden From Active Guidance

`lib/codex/mcp/handlers/task.ts` still contains hidden direct-call compatibility `alembic_task prime` receipt logic:

- Legacy task rules explicitly say public tools are preferred at lines 257-275.
- `_prime()` builds `primeKnowledgeMaterial` and developer-visible receipt messages for delivered / degraded / empty paths at lines 316-512.
- It still carries the same receipt layers and hostResponse action at lines 515-578 and follow-on helper logic.

Active guidance is not polluted by this legacy path:

- `lib/codex/mcp/McpServer.ts` routes public `alembic_prime` to `agent-public-tools` and `alembic_task` only as a separate handler at lines 573-594.
- `test/unit/CodexToolPolicy.test.ts` verifies visible agent tools do not include `alembic_task` after initialization / resident scope / ready states at lines 136-196 and 260-272.
- `test/unit/AgentPublicToolsActive.test.ts` verifies `agent-public-tools.ts` does not import or call the legacy task handler and does not contain `alembic_task` at lines 1164-1174.
- `test/unit/AgentPublicToolsContract.test.ts` verifies public descriptions and catalog do not contain `alembic_task` or legacy operation wording at lines 68-85 and 348-358.

### Runtime Dist Contains Same Receipt Surface

The embedded runtime dist contains the same receipt and public package projection:

- `plugins/alembic-codex/runtime/dist/lib/service/task/PrimeKnowledgeMaterial.js`
- `plugins/alembic-codex/runtime/dist/lib/codex/mcp/handlers/agent-public-tools.js`
- `plugins/alembic-codex/runtime/dist/lib/codex/mcp/public-tools/contract.js`

Confirmed by grep for `PrimePublicPackage`, `trustReceipt`, `receiptChecklist`, `shout_prime_knowledge_receipt`, `noTrustedClaimRequired`, and `not-available-or-degraded`.

## Tests And Validation

Commands run from `AlembicPlugin`:

```text
npm run test:unit -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsContract.test.ts test/unit/CodexToolPolicy.test.ts
```

Result: passed, 4 files / 39 tests.

```text
npm run build:check
```

Result: passed. Core build used `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`.

```text
git diff --check
git status --short
git -C plugins/alembic-codex status --short
```

Result: passed / both product worktrees clean.

## Gaps And Risks

- This was a read-only code fact task, not runtime acceptance. It did not perform a fresh installed-cache Codex host readback for REQ-05.
- There is no product code gap found for the core five-layer receipt, public package projection, no-trusted-claim degraded path, or legacy-hidden active guidance.
- One useful follow-up would be a narrow runtime acceptance task for public `alembic_prime` receipt readback in packaged / installed runtime, especially with a small `outputBudget.maxChars`, to prove receipt fields remain structured even when `summary.compact` is truncated.
- Legacy `alembic_task prime` still carries duplicate receipt implementation for hidden compatibility. It does not appear in active public guidance today, but any future physical deletion must keep public `PrimeKnowledgeMaterial` and tests green first.

## Next Suggestion

Recommend total control accept Stage 0 as complete and choose between:

1. Direct REQ-05 acceptance if source + focused unit + build evidence is sufficient for this requirement.
2. A narrow Stage 1 runtime acceptance task for AlembicPlugin that calls packaged/installed public `alembic_prime` ready / empty / degraded paths and verifies `trustReceipt`, five-layer `trustPosture`, no-trusted-claim, `detailRefs`, and output-budget behavior.
