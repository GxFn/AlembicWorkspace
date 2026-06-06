# AFAPI REQ-05 Prime Trust Receipt Runtime Golden - AlembicPlugin

## Target

- currentWindow: AlembicPlugin
- taskId: AFAPI-REQ-05-PRIME-TRUST-RECEIPT-RUNTIME-GOLDEN-T2
- dispatchGroup: AFAPI-REQ-05-PRIME-TRUST-RECEIPT-RUNTIME-GOLDEN-GROUP
- scope: AlembicPlugin packaged/installed Codex MCP runtime golden acceptance for public `alembic_prime`.

## Result

Completed. No AlembicPlugin product source, runtime bundle, or embedded runtime source changes were required.

Packaged runtime was refreshed into the Codex plugin cache and verified against:

- installed target: `/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.2.0`
- AlembicPlugin git head in installed marker: `0abe90ca00aa7e867444eb779d0258cca2abe157`
- embedded runtime git head from T1 / installed bundle: `4683da2723f8dae18d6dca6796ca1ef19636f19c`
- `plugins/alembic-codex/runtime.tgz` sha256: `0c78668944e83bd986853e04540452f7459b2f7524db2c9560c505fc5fd63e80`
- installed marker `runtimeTarball`: `0c78668944e83bd986853e04540452f7459b2f7524db2c9560c505fc5fd63e80`

## Evidence

- Packaged verify report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-req-05-prime-trust-receipt-runtime-golden-2026-06-06/dev-verify-packaged-report.json`
- Runtime golden probe: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-req-05-prime-trust-receipt-runtime-golden-2026-06-06/probe-prime-trust-receipt-runtime-golden.mjs`
- Runtime golden report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-req-05-prime-trust-receipt-runtime-golden-2026-06-06/prime-trust-receipt-runtime-golden-report.json`

Golden report summary:

- `ok: true`
- active tool surface includes `alembic_prime`
- active tool surface excludes hidden legacy `alembic_task`
- active public tool descriptions do not mention `alembic_task`
- ready scenario:
  - `status: ready`
  - `trustPosture.status: delivered`
  - `noTrustedClaimRequired: false`
  - output budget: `{ "mode": "compact", "maxChars": 64, "usedChars": 63, "truncated": true }`
  - receipt layer counts in order:
    - `trusted-to-obey: 1`
    - `trusted-to-use: 2`
    - `context-only: 2`
    - `requires-verification: 2`
    - `not-available-or-degraded: 0`
  - `trustReceipt.hostResponse.action: shout_prime_knowledge_receipt`
  - `trustReceipt.hostResponse.timing: immediate_after_prime`
  - `trustReceipt.hostResponse.requiredBeforeNextAction: true`
  - `trustReceipt.hostResponse.visibility: developer_visible`
  - `trustReceipt.hostResponse.reason` names `As Codex`, all five trust layers, and the before-next-action requirement.
  - `primeKnowledgeMaterial.shoutInstruction` names immediate visible receipt, first-person/Codex speaker, no generic receipt collapse, and no default `evidenceRefs` path dumping.
  - `compactPackage.counts.acceptedKnowledge: 1`
  - `compactPackage.counts.acceptedGuards: 1`
  - `diagnostics.retrieval.residentAvailable: true`
  - `retrievalConsumer.producerContract.available: true`
- empty/degraded scenario:
  - `status: degraded`
  - `trustPosture.status: empty`
  - `noTrustedClaimRequired: true`
  - output budget: `{ "mode": "compact", "maxChars": 64, "usedChars": 63, "truncated": true }`
  - receipt layer counts in order:
    - `trusted-to-obey: 0`
    - `trusted-to-use: 0`
    - `context-only: 2`
    - `requires-verification: 0`
    - `not-available-or-degraded: 1`
  - host-visible message and host response do not claim trusted project knowledge.
- raw automation blocked scenario:
  - `status: blocked`
  - `reasonCode: missing-referenced-docs`
  - `noTrustedClaimRequired: true`
  - `sourcePolicy.automationEnvelope.blockedWithoutSourceRefs: true`
  - receipt layer counts in order:
    - `trusted-to-obey: 0`
    - `trusted-to-use: 0`
    - `context-only: 0`
    - `requires-verification: 0`
    - `not-available-or-degraded: 1`

## Commands

Executed from `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`.

```bash
npm run dev:codex-plugin:verify -- --packaged --skip-build --skip-prepare --skip-tests --skip-verify --skip-smoke --project-root /private/tmp/afapi-req-05-prime-trust-receipt-runtime-golden-project --report-path scratch/afapi-req-05-prime-trust-receipt-runtime-golden-2026-06-06/dev-verify-packaged-report.json
node --check scratch/afapi-req-05-prime-trust-receipt-runtime-golden-2026-06-06/probe-prime-trust-receipt-runtime-golden.mjs
node scratch/afapi-req-05-prime-trust-receipt-runtime-golden-2026-06-06/probe-prime-trust-receipt-runtime-golden.mjs --project-root /private/tmp/afapi-req-05-prime-trust-receipt-runtime-golden-project --report-path scratch/afapi-req-05-prime-trust-receipt-runtime-golden-2026-06-06/prime-trust-receipt-runtime-golden-report.json
npm run test:unit -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsContract.test.ts test/unit/CodexToolPolicy.test.ts
npm run build:check
npm run verify:codex-plugin
git diff --check
git status --short
git -C plugins/alembic-codex status --short
shasum -a 256 plugins/alembic-codex/runtime.tgz
```

Notable command outputs:

- `npm run dev:codex-plugin:verify ...`: `ok: true`, `mode: packaged-runtime`, packaged wrapper entry, installed marker hash matched runtime tarball hash.
- `node ... probe-prime-trust-receipt-runtime-golden.mjs ...`: `ok: true`, target `issues: []`.
- `npm run test:unit ...`: 4 files passed, 39 tests passed.
- `npm run build:check`: passed; Core build used `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`.
- `npm run verify:codex-plugin`: `Codex plugin verification passed (./runtime.tgz -> alembic-codex-plugin-runtime@0.2.0).`
- `git diff --check`: passed.
- `git status --short`: clean.
- `git -C plugins/alembic-codex status --short`: clean.
- `shasum -a 256 plugins/alembic-codex/runtime.tgz`: `0c78668944e83bd986853e04540452f7459b2f7524db2c9560c505fc5fd63e80`.

## Unmodified Scope

- No AlembicPlugin product source changes.
- No runtime bundle rebuild or `runtime.tgz` mutation.
- No embedded runtime source changes under `plugins/alembic-codex`.
- No Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest responsibilities were claimed.

## Risk / Boundary

- The ready scenario uses a task-local resident stub to prove AlembicPlugin packaged runtime consumption, public `alembic_prime` receipt shaping, and resident producer boundary handling. It does not certify real Alembic resident producer quality or live project knowledge quality.
- Empty/degraded acceptance verifies Plugin-side no-trusted-claim behavior when resident knowledge is unavailable; it does not assert that a live resident daemon will always be unavailable or empty.
- The scratch probe is an acceptance artifact, not product code.

## Next Suggestion

Total control can review this T2 evidence with T1 code fact evidence and decide whether REQ-05 is closed or needs a downstream live-resident scenario outside AlembicPlugin.
