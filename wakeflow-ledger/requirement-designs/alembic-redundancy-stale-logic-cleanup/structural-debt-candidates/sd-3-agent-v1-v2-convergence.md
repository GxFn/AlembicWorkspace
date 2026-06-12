# SD-3 — Agent Tool-System V1 → V2 Convergence

Design note for RC6 structural-debt decision gate. Drafted by the Design
window, task `alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-t1`.

Re-verification baseline (2026-06-12): AlembicAgent `dc6d6f7` (the RC3 commit
itself is HEAD — no movement since RC3).

## Problem

AlembicAgent runs two tool systems: V2 (`src/tools/v2/`, primary) and the V1
surface (`src/tools/core/`) kept alive through `V2ToolRouterAdapter`. RC3
registered the retirement INTENT (no deletion authority): AlembicAgent
`AGENTS.md` section "工具系统 V1 退役登记（2026-06-11）" — V2 primary, V1 +
adapter compatibility-only, no new capability on them, removal gated on this
SD-3 decision. This note consumes that register and proposes the convergence
plan.

## Evidence and re-verification (2026-06-12)

Refs: audit G2; RC0 matrix row G2; RC3 result
(`alembic-redundancy-stale-logic-cleanup-rc3-agent-hygiene-boundary-config/target-results/tr-...-t1.json`)
and the register text in `AlembicAgent/AGENTS.md:140-160`.

Fresh scan (`grep -rln "from '.*tools/core" src --include='*.ts'`):

- **22** files import from `tools/core` in total; **16** of them are outside
  `src/tools/core/` itself (register said "~15 src files" — count is one
  higher by this method; treat 16 as the new baseline).
- Of the 16: **6** are type-only importers (`WorkflowRegistry`,
  `ActiveContext`, `DiagnosticsCollector`, `ToolForge`, `PcvNodeEvidence`,
  `AgentRuntimeBuilder`); **10** carry at least one value import
  (`UnifiedToolCatalog`, `TerminalEnvelopes`, `V2ToolRouterAdapter`,
  `AgentTaskHandlers`, `ToolExecutionPipeline`, `MessageAdapter`,
  `AgentRuntime`, `AgentInterfaceContract`, `DynamicComposer`,
  `TemporaryToolRegistry`).
- The V1 contract vocabulary (`ToolContracts` / `ToolResultEnvelope` /
  `ToolCallContext` / `InternalToolHandler` / `ToolDecision`) is what spreads:
  runtime, catalog, terminal, workflow, forge, tasks modules all type on it —
  exactly the register's diagnosis.
- `src/agent/runtime/AgentRuntimeBoundary.ts` references `V2ToolRouterAdapter`
  in the runtime boundary manifest.
- Public API boundary: `config/agent-public-api-boundary.json` keeps `./tools`
  and `./tools/v2` as separate export paths; `expectedCounts` =
  `stable-public: 15` (others 0), and since RC3 G5 the lint COMPUTES counts
  from `package.json` exports and fails loudly on mismatch (demonstrated FAIL
  in RC3 raw `g5-public-api-lint-fail.txt`) — any export-path change in this
  convergence is mechanically guarded.

## Options

### Option A — Single-wave full retirement

One demand: move contract types to a neutral home, migrate all 16 importers,
delete the V1 runtime (`LightweightRouter`, `ToolResultPresenter`,
`ToolRoutingServices`, handler glue) and `V2ToolRouterAdapter`, update
`AgentRuntimeBoundary`, package exports, and `expectedCounts`.

- Cost: large single diff across runtime-critical files; one review window.
- Risk: highest — the adapter sits on the live routing path; a single wave
  mixes mechanical type rewires with behavioral routing changes, which the
  sequence stop-cards explicitly discourage.

### Option B — Two-phase convergence (contracts first, runtime second)

Phase 1 (mechanical, behavior-preserving): extract the shared contract
vocabulary into a neutral module (e.g. `src/tools/contracts/`), re-point all
16 external importers, leave V1 runtime + adapter in place importing from the
new home. Phase 2 (behavioral): collapse `V2ToolRouterAdapter` into the V2
router path, update `AgentRuntimeBoundary` manifest, delete `src/tools/core/`
runtime files, retire/repoint the `./tools` export path, update
`expectedCounts` deliberately.

- Cost: two reviewable waves; each independently green; phase 1 is largely
  type-level (6 of 16 importers are already type-only).
- Risk: low in phase 1; phase 2 risk is contained because phase 1 already
  proved the vocabulary has no hidden V1-runtime dependence.

### Option C — Keep frozen indefinitely

The register already forbids extension; just keep V1 + adapter as a frozen
compat layer.

- Cost: zero now. Risk: contradicts the registered intent; the vocabulary
  keeps spreading through type-imports (the count already drifted 15 → 16),
  making every future convergence strictly more expensive.

## Recommendation

**Option B.** Suggested consumer-migration order inside phase 1: type-only
importers first (6, zero runtime risk), then catalog/terminal/workflow/forge,
then runtime files (`AgentRuntime`, `ToolExecutionPipeline`, `MessageAdapter`,
`AgentInterfaceContract`, `AgentTaskHandlers`). Target milestone: an
independent demand sequence on the AlembicAgent window; no producer/consumer
dependency on SD-1/SD-5 (Agent's transitional-Core refs are already 0 per the
SD-5 closeout report), so it can be scheduled freely. Public-api boundary
changes land only in phase 2 and must update `expectedCounts` in the same
commit (the RC3 G5 lint enforces this mechanically).

## Affected repositories

AlembicAgent. Alembic consumes Agent (`file:../AlembicAgent` direction per
audit §1) — downstream build validation required; no API change expected for
Alembic if `./agent` surface stays stable (the change is inside `./tools*`).

## Validation outline

- Per phase: `npm run check` green (RC3 baseline: 197/197 tests; build:check,
  biome, agent-import/public-api/core-import boundary lints).
- Phase 2: public-api lint demonstrated FAIL on the stale `expectedCounts`
  before the deliberate update, then green (same proof shape as RC3 G5).
- `npm run release:pack-preview` staging green (RC3 baseline: 431 entries).
- Downstream `Alembic` build + unit suite green after each phase.
- Final: `grep -rn "tools/core" src/` returns only the new contracts home (or
  nothing), attached as raw evidence.
