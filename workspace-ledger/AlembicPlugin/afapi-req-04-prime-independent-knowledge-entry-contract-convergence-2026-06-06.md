# AFAPI REQ-04 Prime Independent Knowledge Entry Contract Convergence

- Date: 2026-06-06
- Window: AlembicPlugin
- Task: AFAPI-REQ-04-PRIME-INDEPENDENT-KNOWLEDGE-ENTRY-CONTRACT-CONVERGENCE-T2
- Dispatch group: AFAPI-REQ-04-PRIME-CONTRACT-CONVERGENCE-GROUP
- Parent repository commit: `0abe90ca00aa7e867444eb779d0258cca2abe157`
- Embedded runtime repository commit: `4683da2723f8dae18d6dca6796ca1ef19636f19c`
- Runtime tarball sha256: `0c78668944e83bd986853e04540452f7459b2f7524db2c9560c505fc5fd63e80`

## Completed Scope

Implemented AlembicPlugin-side `alembic_prime` contract convergence without deleting hidden legacy `alembic_task(operation=prime)` compatibility.

Changes:

- Added `PrimePublicPackageSchema` / `createPrimePublicPackage` to `lib/codex/mcp/public-tools/contract.ts`.
- Updated `primeHandler` so ready, degraded, and blocked prime results expose a canonical `primePackage`.
- Preserved existing rich `primeKnowledgeMaterial` and existing `primePackage.retrievalConsumer` / `structureFirst` consumer fields.
- Added stable compact package fields:
  - `primeRef`
  - `refs.detailRefs`
  - `trustPosture.receiptChecklist`
  - `trustReceipt`
  - `compactPackage`
  - `sourcePolicy`
  - `runtimePolicy`
  - `diagnostics.outputBudget`
  - `diagnostics.retrieval`
  - `diagnostics.producerBoundary`
- Blocked prime paths now still include a stable `primeRef`, source policy, runtime policy placeholder, diagnostics, and no-trusted-claim trust posture.
- Added explicit producer-boundary metadata: `PrimeInjectionPackage` lexical / vector / relations / selectedKnowledge / omitted / trace fields remain Alembic resident producer-owned; AlembicPlugin only passes through compact resident metadata and never synthesizes missing producer fields.
- Synchronized embedded Codex plugin runtime dist and `runtime.tgz`.

## Files Changed

Parent repository:

- `lib/codex/mcp/public-tools/contract.ts`
- `lib/codex/mcp/handlers/agent-public-tools.ts`
- `test/unit/AgentPublicToolsActive.test.ts`
- `test/unit/AgentPublicToolsContract.test.ts`
- `plugins/alembic-codex` pointer

Embedded runtime repository:

- `runtime/dist/lib/codex/mcp/public-tools/contract.js`
- `runtime/dist/lib/codex/mcp/handlers/agent-public-tools.js`
- `runtime.tgz`

## Validation

Commands run from `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`:

```bash
npm test -- test/unit/AgentPublicToolsContract.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts
npm run build
npm run prepare:codex-plugin-runtime
npm run build:check
npm run lint
npm run lint:repo-boundary
npm run verify:codex-plugin
git diff --check
git -C plugins/alembic-codex diff --check
rg -n "PrimePublicPackage|producer-only|PrimeInjectionPackage lexical|rawAutomationEnvelopeUsedAsQuery" plugins/alembic-codex/runtime/dist/lib/codex/mcp -g '*.js'
shasum -a 256 plugins/alembic-codex/runtime.tgz
```

Results:

- Focused tests: 5 files passed, 40 tests passed.
- `npm run build`: passed.
- `npm run prepare:codex-plugin-runtime`: passed and regenerated runtime artifact.
- `npm run build:check`: passed.
- `npm run lint`: passed.
- `npm run lint:repo-boundary`: passed.
- `npm run verify:codex-plugin`: passed for `runtime.tgz`.
- Parent `git diff --check`: passed before commit.
- Embedded runtime `git diff --check`: passed before commit.
- Post-commit parent and embedded runtime worktrees are clean.

## Not Done

- Did not modify Alembic, AlembicCore, AlembicAgent, AlembicDashboard, AlembicDesign, AlembicTest, or any real project.
- Did not physically delete hidden legacy `alembic_task(operation=prime)`.
- Did not synthesize Alembic resident producer-only PrimeInjectionPackage fields in Plugin.
- Did not run real Codex host installed-cache runtime acceptance; this remains a later runtime acceptance task if total control requires host readback.

## Risks And Next Suggestions

- Runtime host readback should verify packaged/installed `alembic_prime` returns `PrimePublicPackage` on ready, degraded, and blocked paths.
- If Alembic resident metadata lacks full `PrimeInjectionPackage` fields, route producer work to Alembic rather than adding Plugin synthesis.
- Hidden legacy task-prime physical removal should remain a later compatibility cleanup after consumer/runtime acceptance.
