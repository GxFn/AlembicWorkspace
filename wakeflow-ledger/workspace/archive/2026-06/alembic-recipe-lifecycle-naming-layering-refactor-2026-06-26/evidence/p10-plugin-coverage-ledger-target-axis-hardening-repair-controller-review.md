# P10 Controller Review - Plugin coverage ledger target-axis hardening

Date: 2026-06-28
Controller: AlembicWorkspace

Dispatch group:
- `p10-plugin-coverage-ledger-target-axis-hardening-repair-p1`

Target task:
- AlembicPlugin / `p10-plugin-coverage-ledger-target-axis-hardening-repair-t1`

## Decision

Decision: `accept-target-result`.

AlembicPlugin completed the assigned source repair for the P10 module-axis
blocker. This acceptance is limited to the Plugin rework package. It does not
accept P10, the BiliDili real-test gate, G4, G6, P11, P12, P13, or the demand as
complete.

## Raw Evidence Reviewed

- Target result:
  `target-results/tr-p10-plugin-coverage-ledger-target-axis-hardening-repair-t1.json`
- Task package:
  `task-packages/p10-plugin-coverage-ledger-target-axis-hardening-repair-p1.json`
- Prior controller review / failure authority:
  `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-controller-review.md`
- AlembicPlugin commit:
  `bdd0b62fb80082c032f299d3393eacb5bfd78eeb`
- Source evidence:
  `AlembicPlugin/lib/recipe-generation/host-agent-workflows/coverage-ledger-target-axis.ts`
  `AlembicPlugin/lib/recipe-generation/host-agent-workflows/dimension-completion.ts`
  `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  `AlembicPlugin/lib/service/module/ModuleService.ts`
- Test evidence:
  `AlembicPlugin/test/unit/CoverageLedgerTargetAxis.test.ts`
  `AlembicPlugin/test/unit/HostAgentDimensionCompletionWorkflow.test.ts`
  `AlembicPlugin/test/unit/RescanCoverageModuleAxis.test.ts`
  `AlembicPlugin/test/unit/HostAgentSessionLease.test.ts`
  `AlembicPlugin/test/unit/ModuleServiceHostManagedBoundary.test.ts`

## Controller Findings

The previous Test failure showed three Plugin-owned paths could still introduce
or surface aggregate/root coverage-ledger module ids:

- host dimension-completion wrote aggregate module cells after the before-host
  ledger was already target-scoped;
- host rescan seed could still include root or plan-scope modules;
- coverage advisory surfaced mixed target plus aggregate/root gaps.

The Plugin repair addresses all three paths:

- `coverage-ledger-target-axis.ts` adds shared target-axis helpers:
  `isTargetScopedCoverageModuleId`, `preferTargetScopedCoverageItems`,
  `countTargetScopedCoverageItems`, and
  `uniqueTargetScopedCoverageModuleCount`.
- `dimension-completion.ts` filters mixed module axes to target-scoped modules
  and skips aggregate writes when existing ledger cells already prove a target
  axis. This directly covers the before-host target-only -> bootstrap aggregate
  pollution failure.
- `knowledge-rescan.ts` filters rescan seed modules to target scope, rejects
  ProjectMap root ids such as `root` and `module:root:*`, and filters coverage
  advisory cells before computing/surfacing gaps.
- `ModuleService.ts` now prefers target-derived canonical modules from repo
  targets before falling back to package/source-root aggregate modules when a
  ProjectContext map is unavailable.

The repair preserves required boundaries:

- no Core source change;
- no vendor/release/version/freeze edit;
- no BiliDili source, DB, session, or provider-config mutation;
- no claim that the real P10 BiliDili parity gate passed.

## Validation Replayed By Controller

From `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`:

- `npm run test:unit -- test/unit/CoverageLedgerTargetAxis.test.ts test/unit/RescanCoverageModuleAxis.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/HostAgentSessionLease.test.ts test/unit/ModuleServiceHostManagedBoundary.test.ts`
  - PASS: 5 files, 30 tests.
- `npm run build:check`
  - PASS; Core build used `../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- `npx biome check lib/recipe-generation/host-agent-workflows/coverage-ledger-target-axis.ts lib/recipe-generation/host-agent-workflows/dimension-completion.ts lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts lib/service/module/ModuleService.ts test/unit/CoverageLedgerTargetAxis.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
  - PASS: checked 7 files, no fixes applied.
- `git diff --check`
  - PASS.

AlembicPlugin reported `alembic_code_guard` failed twice due an Alembic MCP
internal schema error (`unrecognized key "data"`). This is not accepted as a
guard pass, but it is not a blocker for this narrow source repair because the
controller re-reviewed the diff and replayed repository validation.

## Residual Risk

The real BiliDili P10 gate has not been rerun after `bdd0b62`. Test must rerun
the direct real workspace scenario before P10 can advance.

Required next Test proof:

- R-2 root/dataRoot proof still holds;
- provider routing remains DeepSeek generation plus local Qwen embedding;
- host coverage ledger remains non-empty and target-scoped only after bootstrap
  and rescan;
- coverage advisory no longer surfaces aggregate/root module ids when target
  cells exist;
- noPadding cleanup remains recovered;
- in-process `moduleScope=["BiliDili"]` keeps nested ProjectMap targets and
  writes a non-empty ledger;
- host vs in-process parity diff is empty and not a 0-vs-0 comparison.

## Forbidden Conclusions

- Do not accept P10 or the whole demand from this Plugin result alone.
- Do not treat helper/unit-test coverage as a substitute for BiliDili real-test
  parity.
- Do not manually prune or repair BiliDili DB rows to manufacture target-only
  evidence.
