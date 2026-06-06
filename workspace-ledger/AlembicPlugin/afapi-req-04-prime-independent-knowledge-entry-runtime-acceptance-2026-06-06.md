# AFAPI REQ-04 Prime Independent Knowledge Entry Runtime Acceptance

- Date: 2026-06-06
- Window: AlembicPlugin
- Task: AFAPI-REQ-04-PRIME-INDEPENDENT-KNOWLEDGE-ENTRY-RUNTIME-ACCEPTANCE-T3
- Dispatch group: AFAPI-REQ-04-PRIME-RUNTIME-ACCEPTANCE-GROUP
- Product repository commit: `0abe90ca00aa7e867444eb779d0258cca2abe157`
- Embedded runtime repository commit: `4683da2723f8dae18d6dca6796ca1ef19636f19c`
- Runtime tarball sha256: `0c78668944e83bd986853e04540452f7459b2f7524db2c9560c505fc5fd63e80`
- Product source changes: none

## Completed Scope

Completed packaged / installed Codex plugin runtime acceptance for `alembic_prime` after P2 contract convergence.

Verified installed cache target:

- Mode: packaged runtime wrapper.
- Cache marker git head: `0abe90ca00aa7e867444eb779d0258cca2abe157`.
- Cache marker runtime tarball hash: `0c78668944e83bd986853e04540452f7459b2f7524db2c9560c505fc5fd63e80`.
- MCP command: `node ./bin/alembic-codex-mcp-wrapper.mjs`.
- Probe project root: `/private/tmp/afapi-req-04-prime-runtime-acceptance-project` (non-Alembic temporary project).

Readback scenarios:

- `degradedEmpty`: `alembic_intent` returned ready; `alembic_prime` returned canonical `PrimePublicPackage` with status `degraded`, reason `resident-unavailable`, stable `primeRef`, 4 `detailRefs`, `sourcePolicy.rawAutomationEnvelopeUsedAsQuery=false`, `runtimePolicy.sourcePolicy.selectedOrActiveCanOverrideEffectiveIdentity=false`, output budget metadata, producer-boundary diagnostics, and `trustPosture.noTrustedClaimRequired=true`.
- `rawAutomationBlocked`: raw automation-envelope prime without source refs returned canonical `PrimePublicPackage` with status `blocked`, reason `missing-referenced-docs`, stable `primeRef`, 3 `detailRefs`, `sourcePolicy.automationEnvelope.blockedWithoutSourceRefs=true`, `rawAutomationEnvelopeUsedAsQuery=false`, `rawThreadIdsPersisted=false`, output budget metadata, and no trusted claim.
- `ready`: packaged runtime read a temporary local resident stub through daemon health + `/api/v1/search`; `alembic_prime` returned canonical `PrimePublicPackage` with status `ready`, 1 accepted Recipe/pattern item, 1 accepted Guard/rule item, 4 `detailRefs`, `trustPosture` layers for trusted-to-obey/trusted-to-use/context-only/requires-verification, `retrievalConsumer.producerContract.available=true`, `diagnostics.retrieval.residentAvailable=true`, `PrimeInjectionPackage.availability=resident-provided`, and `pluginSynthesized=false`.

## Evidence Files

- `AlembicPlugin/scratch/afapi-req-04-prime-runtime-acceptance-2026-06-06/dev-verify-packaged-report.json`
- `AlembicPlugin/scratch/afapi-req-04-prime-runtime-acceptance-2026-06-06/prime-runtime-acceptance-report.json`
- `AlembicPlugin/scratch/afapi-req-04-prime-runtime-acceptance-2026-06-06/probe-prime-runtime-acceptance.mjs`

## Validation

Commands run from `AlembicPlugin`:

```bash
npm run dev:codex-plugin:verify -- --packaged --skip-build --skip-prepare --skip-tests --skip-verify --skip-smoke --project-root /private/tmp/afapi-req-04-prime-runtime-acceptance-project --report-path scratch/afapi-req-04-prime-runtime-acceptance-2026-06-06/dev-verify-packaged-report.json
node scratch/afapi-req-04-prime-runtime-acceptance-2026-06-06/probe-prime-runtime-acceptance.mjs --project-root /private/tmp/afapi-req-04-prime-runtime-acceptance-project --report-path scratch/afapi-req-04-prime-runtime-acceptance-2026-06-06/prime-runtime-acceptance-report.json
npm run build:check
npm run verify:codex-plugin
git diff --check
git status --short
git -C plugins/alembic-codex status --short
```

Results:

- Installed cache packaged verify: passed.
- Prime runtime acceptance probe: passed.
- `npm run build:check`: passed.
- `npm run verify:codex-plugin`: passed.
- `git diff --check`: passed.
- Parent AlembicPlugin worktree: clean.
- Embedded `plugins/alembic-codex` worktree: clean.

## Not Done

- Did not modify Alembic, AlembicCore, AlembicAgent, AlembicDashboard, AlembicDesign, AlembicTest, or any real project.
- Did not implement Alembic resident producer fields.
- Did not physically delete hidden legacy `alembic_task(operation=prime)`.
- Did not claim total-control acceptance; this report is target-window evidence only.

## Risks And Next Suggestions

- The ready readback used a task-local resident stub to verify Plugin packaged runtime consumer behavior. It proves Plugin consumes resident search metadata and does not synthesize producer-only fields; it does not prove Alembic resident production quality.
- Total control should decide whether REQ-04 can close after this runtime acceptance or whether a later Alembic-owned resident producer verification is needed.
