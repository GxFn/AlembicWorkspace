# P13 Core HostAgent Facade Packet Split Target Report

## Scope

- Target window: AlembicCore
- Task id: p13-core-hostagent-facade-packet-split-t1
- Dispatch group: p13-core-hostagent-facade-packet-split-p1
- State root: .wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26

This target implemented the Core-side HostAgent facade vocabulary rename and
analysis-packet builder split. It did not perform Plugin runtime surface rename,
REAL-TEST, Test dispatch, or controller acceptance.

## Commits

- AlembicCore: edd79d26d9d539fd52e17cf67299ccdba20b4e5a
  - Message: Split host agent analysis packet facade
- Alembic: f79a67fa2be64c3b7ba4371f6643fcb14a07ddf6
  - Message: Pin core host agent facade split
  - Only diff: vendor/AlembicCore 99a7cf10d82056cd860eb0a1d9544662e3735b08 -> edd79d26d9d539fd52e17cf67299ccdba20b4e5a
- AlembicPlugin: 359c66319cde7d3a185536df5ba92048932f3897
  - Message: Pin core host agent facade split
  - Only diff: vendor/AlembicCore 99a7cf10d82056cd860eb0a1d9544662e3735b08 -> edd79d26d9d539fd52e17cf67299ccdba20b4e5a

## Core Changes

- Added `src/workflows/capabilities/host-agent/HostAgentAnalysisPacketBuilder.ts`
  as the real builder implementation and kept
  `src/workflows/capabilities/host-agent/IDEAgentAnalysisPacketBuilder.ts` as an
  R1 compatibility shim.
- Split packet helpers into focused modules:
  - `analysis-packet/Types.ts`
  - `analysis-packet/StableIdentity.ts`
  - `analysis-packet/UnitProgress.ts`
  - `analysis-packet/ProjectContextNormalize.ts`
  - `analysis-packet/Scoring.ts`
  - `analysis-packet/index.ts`
- Updated public barrels:
  - `src/host-agent-workflows.ts`
  - `src/index.ts`
  - `src/workflows/capabilities/host-agent/index.ts`
- Added new HostAgent exports while keeping old IDEAgent aliases for R1
  compatibility:
  - `buildIDEAgentAnalysisPacketFromProjectContext`
  - `createIDEAgentAnalysisProgressSeed`
  - `createIDEAgentAnalysisUnitKey`
  - `createIDEAgentAnalysisUnitProgress`
  - legacy IDEAgent type aliases
- Preserved the public subpath import path `@alembic/core/host-agent-workflows`.
  Package export paths were not renamed.
- Packet identifiers, unit-key prefixes, checkpoint kind strings, and source
  semantics stayed stable. The intentional metadata vocabulary change is
  `meta.builder: "HostAgentAnalysisPacketBuilder"`.

## Compatibility Proof

Dist import probe after `npm run build` returned:

```json
{
  "rootHostProjectContext": "function",
  "rootLegacyProjectContext": true,
  "hostHostProjectContext": "function",
  "hostLegacyProjectContext": true,
  "hostUnitKey": true,
  "hostProgressSeed": true,
  "directHostBuilder": "function",
  "directLegacyBuilder": true,
  "snapshotNotRoot": true
}
```

The compatibility test file `test/IDEAgentAnalysisPacketBuilder.test.ts` now
checks both new HostAgent names and legacy IDEAgent aliases. Fixed-input packet
expectations pass with the intended builder metadata rename.

## Frozen/R2 Checks

Verified unchanged by source search:

- Plan stage ids remain `coldStart`, `deepMining`, and `moduleMining`.
- Response tools remain `alembic_bootstrap`, `alembic_rescan`, and
  `alembic_dimension_complete`.
- Data names remain `coverage_ledger` and `deep_mining_rounds`.
- Runtime file-change route remains `/api/v1/file-changes`.
- Source change vocabulary remains `file-change`.
- R2 cleanup ternary remains:
  `projectRoot: intent.executor === 'host-agent' ? input.dataRoot : input.projectRoot`.
- `moduleMiningRoutes` was not deleted or renamed.

## Verification

AlembicCore:

- `npm run build:check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run test` passed: 145 files, 1418 tests.
- `npm run lint:public-api-boundary` passed: 61 package exports classified;
  stable=24, provisional=8, transitional=29; no-growth checks passed.
- `npm run lint:consumer-core-imports` passed:
  - AlembicAgent issues=0
  - Alembic issues=0
  - AlembicPlugin issues=0
- `npm run lint:layer-contract` passed: 404 allowed cross-area runtime imports,
  257 type-only bridges.
- `git diff --check` passed before Core commit.
- Dist import probe passed, as shown above.

Consumers:

- Alembic `npm run build:check` passed after vendor/AlembicCore repin.
- AlembicPlugin `npm run build:check` passed after vendor/AlembicCore repin and
  reported Core build used AlembicCore at
  edd79d26d9d539fd52e17cf67299ccdba20b4e5a.
- Alembic `git diff --check` passed before vendor commit.
- AlembicPlugin `git diff --check` passed before vendor commit.
- Alembic and AlembicPlugin worktrees are clean after their vendor-pin commits;
  each `vendor/AlembicCore` checkout is clean at
  edd79d26d9d539fd52e17cf67299ccdba20b4e5a.

## Residual IDEAgent Classification

Remaining `IDEAgent` references are intentional compatibility surfaces or tests:

- R1 alias exports in `src/index.ts`, `src/host-agent-workflows.ts`, and
  `src/workflows/capabilities/host-agent/index.ts`.
- R1 alias definitions in `HostAgentAnalysisPacketBuilder.ts`,
  `analysis-packet/Types.ts`, and `analysis-packet/UnitProgress.ts`.
- Old direct import shim
  `src/workflows/capabilities/host-agent/IDEAgentAnalysisPacketBuilder.ts`.
- Compatibility assertions in `test/IDEAgentAnalysisPacketBuilder.test.ts` and
  old snapshot non-export checks in public-entrypoint tests.

## Residual Risks

- `npm run lint:naming` still fails on pre-existing, untouched files:
  `src/project-context-capabilities.ts`, `src/recipe-context-capabilities.ts`,
  and `src/test-fixtures.ts`. This is not introduced by P13.
- Alembic guard could not produce a code-review result. `alembic_status` reported
  no usable local knowledge for this Core checkout and a selected-project
  mismatch; `alembic_code_guard` then failed internally with
  `unrecognized_keys: data`. This is recorded as a tool-surface failure, not a
  source-code validation failure.
- P13 Plugin runtime surface rename and BiliDili REAL-TEST remain outside this
  target task and require controller follow-up.
