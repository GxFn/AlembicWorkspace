# AlembicCore PC-F foundation authority V2 rework1 execution evidence

- Task: `i1-i2-core-foundation-authority-v2-rework1-t1`
- Rework event: `evt-20260715172218-0024`
- Accepted parent: `e86aca85997b48e0d9180e98722746d1e2e239d8`
- Single repair commit: `f82bfec58e36ea71e575a23bee356623a7a28381`
- Repair tree: `33f993435e0e52a2f565b12ce47780b5a2b6e074`
- Changed files: `src/service/project-context/foundation/capture.ts`, `test/ProjectContextFoundation.test.ts`
- Runtime report: `wakeflow-ledger/AlembicCore/recipe-coldstart-production-quality-2026-07-15/project-context-capability-audit-core.json`
- Runtime report semantic hash: `sha256:21c34c8364a12f6e8a85549a1af198c03db1b59492d409d62bf8242216334d43`
- Runtime report file SHA-256: `b327a10116adfdb9bbf8f1c0865667bef68a6e8d52d43f2c009f1cee37bc55a4`
- Runtime report size: `3,296,219` bytes
- Loaded runtime hash: `sha256:a26e776283e1337b5d07b2482541894e6a714b80063de4f6109b50f416ad7643`
- Loaded foundation entry hash: `sha256:08262be7dbeb2d2777f8d43a9f95c5bf9073112e46e5fd06186a9d359b5a602e`
- Loaded capture hash: `sha256:f1cabfec5937a6df4a409be89ec5087a8ae923eaff40c34980bce1197b0c70cf`

## Controller verdict response and root cause

The controller finding is confirmed. The public V1 `captureCertifiedProjectFacts` entry structurally detected an object carrying `projectScope` and `requestMatrix`, then entered strict-V2 output construction after validating only the embedded manifest/matrix. It did not verify the runtime `ProjectScopeCaptureBindingV1`. A caller could therefore present an accepted scope A while placing a shadow repository B in the V1 `repositories` field; Core captured B and still returned `pcf-readiness-v2=passed`.

The repair removes structural mode promotion entirely:

- The public V1 entry rejects own, inherited, or partial `projectScope` / `requestMatrix` fields before any host-port access and directs callers to the explicit V2 entry.
- The public V2 entry detaches `projectScope` and `requestMatrix` once, verifies their binding and matrix from those detached values, and passes an explicit private `StrictV2CaptureContext` through the existing capture, request, terminal-reread, source-stability, and readiness pipeline.
- The detached verified authority graph is deep-frozen before host callbacks. Host-port mutation of repository roots or request plans therefore fails closed rather than redirecting capture after verification.
- Cyclic authority extensions are rejected with a stable `TypeError`; shared acyclic references remain valid.
- V1 retains the same private capture core and does not freeze or reinterpret ordinary V1 input objects.

No new store, readiness, capture, Main/Plugin consumer, parser, registry, I3+, or global PC-F implementation was added.

## RED -> GREEN

RED was executed before implementation on accepted parent `e86aca8`:

- An accepted scope A plus empty shadow B passed through the V1 entry, returned inventory `0`, and reported `pcf-readiness-v2=passed`; the new rejection assertion failed.
- A strict-V2 request-matrix getter mutated the original scope root A to B between reads; the capture accessed B.
- A malicious host port mutated a verified repository root to B; Core returned a readiness-passed empty artifact.
- A cyclic strict authority extension overflowed with `RangeError: Maximum call stack size exceeded`.

GREEN regressions now prove:

- own-field, inherited-field, projectScope-only, and requestMatrix-only V1 upgrades all reject with zero enumerate, execute, observe, read, or snapshot-verification calls;
- accessor side effects cannot change the detached verified A snapshot, only A is accessed, and its four fixture files are captured;
- host mutation fails closed before B is used;
- cyclic authority input returns a stable pre-source-access `TypeError`;
- the existing legal strict V2 path and pure V1 path still pass.

The task explicitly required one clean repair commit, so the real RED and GREEN command evidence is recorded here rather than split into a separate RED commit.

## Verification

- Baseline focused suite: 47/47 passed; baseline `npm run build:check` passed.
- Rework regressions: 4/4 passed.
- Final focused `ProjectContextFoundation.test.ts`: 51/51 passed.
- Final full `npm run test`: 185 files / 1,802 tests passed.
- `npm run build`, `npm run build:check`, naming lint, Biome, retired-symbol lint, and `git diff --check`: passed.
- Public API boundary, layer contract, consumer Core imports, scope resolution, 60-entry public API smoke, output budgets, and space-edge gates: passed.
- The repository is clean after the single commit.

`npm run check` stops only at the unchanged pre-existing doctrine finding in `src/infrastructure/vector/ASTChunker.ts:32`. Its accepted-parent and final SHA-256 are both `f1d75391bd61f2d1e33b895814de35740d05b246ff1377fcba5d7e3ae8a1915c`; this task neither modifies nor exempts it. Every gate after doctrine was run separately and passed.

## Clean-commit runtime audit

The audit loaded commit `f82bfec58e36ea71e575a23bee356623a7a28381` and tree `33f993435e0e52a2f565b12ce47780b5a2b6e074`, used a fresh isolated store root, and ran each mode in two independent Node processes.

MR-ALEMBIC:

- 5 repositories, 149 strict request rows, `pcf-readiness-v2=passed`, `allStable=true`.
- 2,439 eligible files = 2,439 frozen refs, 0 read failures, 2,286 unique CAS blobs.
- artifact `cpf-v1:44c0d3f4d7f64230d335d4e74532d97da5df49770c5e4d2566117ce78f7e5eb0`.
- source vector `sha256:2048a89cd6e411799754ec7521f476f00e06f978b34366fca52e3216f222d052`.
- 1,257 package-build owner rows, 0 untyped rows, 0 heuristic-exclusive rows.

SP-BILIDILI root+4:

- 5 repositories, 167 strict request rows, `pcf-readiness-v2=passed`, `allStable=true`.
- 216 eligible files = 216 frozen refs, 0 read failures, 216 unique CAS blobs.
- artifact `cpf-v1:52a64712e5c6ea76b8573f678e094cce29eb61a14b54cd75c0056b07bb7adc8b`.
- source vector `sha256:a1055ca9f909135fde110bdb089dcfbf3b2deb54a1739a00525d95e553f4a1b3`.
- 75 package-build and 111 path-heuristic owner rows, 0 untyped rows, 0 heuristic-exclusive rows.

Both modes match across processes for artifact, facts, certification, source vector, scope, request matrix, and frozen-manifest identity. `openConfirmedDefects=[]` applies only to this Core package. The report correctly keeps `globalPcF.status=pending` for controller-owned Main/Plugin adapters and reload, strict-bypass counters, `.gitmodules` reconciliation, terminal Graph/region truth, and Map accounting/continuation. No historical PlanFacts/I3+ probe was added.

## Two-stage self-review

Stage 1 — specification and scope:

- The diff is restricted to the exact V1/V2 capture authority boundary and focused Foundation regressions.
- It answers the controller's A/B bypass directly and preserves the explicit V2 entry as the only strict authority route.
- It does not claim global PC-F completion, change repository coverage, or touch any other product window.

Stage 2 — correctness, compatibility, performance, and adversarial behavior:

- The same detached values are used for verification, capture derivation, strict request identity, readiness, and final matrix evaluation.
- Explicit context propagation eliminates later structural re-detection and keeps one private capture/store/readiness implementation.
- Authority freezing closes host-callback mutation without freezing V1 caller objects; cycle detection is bounded by object-graph size and permits shared references.
- Four adversarial regressions cover structural entry bypass, getter TOCTOU, host mutation, and cyclic input; legal V1/V2 regressions plus the full suite cover compatibility.
- Independent read-only correctness and scope/performance reviews found no remaining P0/P1/P2 issue after the TOCTOU, host-mutation, and cycle repairs were added.
