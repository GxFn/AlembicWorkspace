# AFAPI REQ-07 Scoped Code Guard Runtime Golden

Date: 2026-06-06
Window: AlembicPlugin
Task: AFAPI-REQ-07-SCOPED-CODE-GUARD-RUNTIME-GOLDEN-T3
Dispatch group: AFAPI-REQ-07-SCOPED-CODE-GUARD-RUNTIME-GOLDEN-GROUP
State root: codex-control-workspace/.workspace-active/workspace/current/afapi-req-07-scoped-code-guard

## Scope

Runtime/golden acceptance only for AlembicPlugin scoped Code Guard. This pass did not modify product source, did not commit runtime bundle or submodule changes, did not claim total-control acceptance, did not create target-window next hop, and did not modify Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest.

AlembicPlugin responsibility confirmed: Codex MCP, Skill, channel / marketplace, plugin runtime, install validation, and Codex host adaptation.

## Runtime Result

- Real MCP stdio runtime proves `alembic_code_guard` no-scope calls block with `missing-guard-scope` and no `guardResultRef`.
- Real MCP stdio runtime proves inline `code` scope returns `status=ready`, `explicitScope.kind=code`, `guardResultRef`, and `detailRefs`.
- Real MCP stdio runtime proves explicit `files` scope returns `status=ready`, `explicitScope.kind=files`, scoped `src/example.ts`, `guardResultRef`, and `detailRefs`.
- Real MCP stdio runtime proves same-session `workRef` derives scoped files and returns `status=ready`, `explicitScope.kind=workRef`, scoped `src/example.ts`, `guardResultRef`, and `detailRefs`.
- Real MCP stdio runtime proves missing / stale `workRef` blocks with `missing-work-ref`.
- Real MCP stdio runtime proves active `workRef` with no scoped files returns `status=skipped`, `reason.code=no-code-scope`, and empty `explicitScope.files`.
- Public `alembic_code_guard` schema exposes `files`, `code`, and `workRef`, and does not expose `diffRef`, `primeRef`, `acceptedGuards`, or `applicableRecipe`.
- Unsupported `diffRef` / `primeRef` / `acceptedGuards` / `applicableRecipe` inputs do not create public scope; runtime returns `missing-guard-scope` with no `guardResultRef`.
- `alembic_work_finish` returns scoped `guardRecommendation.tool=alembic_code_guard` and changed files, but does not auto-run Guard or return a `guardResultRef`.
- Active/root/runtime packaged guidance files no longer present old `alembic_guard`-first wording.
- Local-dev installed cache marker and packaged wrapper copy both match accepted runtime tarball hash `e8c074f85ce14fd4fe27483b7c0f434392caec69834645b1c8e84ee72b7bff5d`.

## Code Evidence

- AlembicPlugin accepted commit: `7bb10507196479883f877d7f008ae59e818d1d4b`
- Embedded runtime accepted commit: `522033eb0b2eb623b719dae92f0204bd41cf31a1`
- Runtime tarball hash: `e8c074f85ce14fd4fe27483b7c0f434392caec69834645b1c8e84ee72b7bff5d`
- Dev reload report: `AlembicPlugin/scratch/afapi-req-07-runtime-golden-2026-06-06/reload-report.json`
- Dev reload MCP probe report: `AlembicPlugin/scratch/afapi-req-07-runtime-golden-2026-06-06/reload-probe-report.json`
- Runtime golden report: `AlembicPlugin/scratch/afapi-req-07-runtime-golden-2026-06-06/runtime-golden-report.json`
- Packaged wrapper target used for runtime golden: `AlembicPlugin/scratch/afapi-req-07-runtime-golden-2026-06-06/packaged-installed-cache`

## Verification

- `node --check scratch/afapi-req-07-scoped-code-guard-runtime-golden-probe.mjs` -> passed.
- `npm run dev:codex-plugin:reload -- --report-path scratch/afapi-req-07-runtime-golden-2026-06-06/reload-report.json --probe-report-path scratch/afapi-req-07-runtime-golden-2026-06-06/reload-probe-report.json --mcp-timeout-ms 45000` -> passed; fresh installed-cache MCP probe ok; marker `gitHead=7bb10507196479883f877d7f008ae59e818d1d4b`.
- `node scratch/afapi-req-07-scoped-code-guard-runtime-golden-probe.mjs --target-root /Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.2.0 --target-root scratch/afapi-req-07-runtime-golden-2026-06-06/packaged-installed-cache --report-path scratch/afapi-req-07-runtime-golden-2026-06-06/runtime-golden-report.json --expected-plugin-commit 7bb10507196479883f877d7f008ae59e818d1d4b --expected-runtime-commit 522033eb0b2eb623b719dae92f0204bd41cf31a1 --expected-runtime-hash e8c074f85ce14fd4fe27483b7c0f434392caec69834645b1c8e84ee72b7bff5d --mcp-timeout-ms 60000` -> passed; 12 assertions true across local-dev cache and packaged wrapper target.
- `npm run verify:codex-plugin` -> passed.
- `npm run verify:codex-channel` -> passed.
- `npm run test:unit -- test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts` -> passed; 2 files / 21 tests.
- `npm run smoke:codex-plugin` -> passed; install / stdio / npxRuntime all passed.
- `npm run build:check` -> passed; Core build used `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`.
- `git diff --check` -> passed.
- `git -C plugins/alembic-codex diff --check` -> passed.
- `git status --short` -> clean.
- `git -C plugins/alembic-codex status --short` -> clean.

## Unmodified Range

- No product source files changed in T3.
- No runtime bundle or submodule commit was created in T3.
- Scratch probe/report assets are local evidence only and remain outside git status.
- No Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest files were modified.

## Risks

- `workRef` scope remains session-local by design. Cross-process or stale `workRef` returns `missing-work-ref`; T3 did not add durable workRef lookup.
- `diffRef`, `primeRef`, `acceptedGuards`, and `applicableRecipe` remain intentionally non-public for Code Guard scope. T3 only proves they do not silently become scope.
- Installed cache readback uses local-dev direct-dist mode after `dev:codex-plugin:reload`; packaged wrapper behavior is separately covered by the runtime golden packaged target and `smoke:codex-plugin`.

## Next Suggestions

1. Controller can review T3 evidence and close AFAPI-REQ-07 if no additional cross-host readback is required.
2. If Design later requires `diffRef` / `primeRef` / accepted guard material as real Code Guard scope, create a new resolver/schema/runtime task rather than extending this T3 acceptance retroactively.
