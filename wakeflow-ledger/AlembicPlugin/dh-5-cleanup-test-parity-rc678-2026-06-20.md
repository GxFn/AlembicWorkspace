# DH-5 — Final cleanup + test parity (RC-6/7/8 + DH-4 carry-over)

Date: 2026-06-20 · Window: AlembicPlugin · Demand: alembic-plugin-dual-host-architecture-refactor-2026-06-19
Baseline: HEAD `764dfc6` (DH-4c accepted) · Completion = RC-1~8 implementation DONE → requirement enters DH-6 acceptance.

## RC-7 — cc test parity (main deliverable)

`test/unit/ClaudeCodeHostRuntime.test.ts` (commit `b523ee7`): **14 cc-path RUNTIME tests** (cc coverage was ~5% / schema-only). Covers cc runtime-context + identity, cc project-root discovery via `CLAUDE_PROJECT_DIR` (trusted, not fail-closed), cc init-marker / saved-root persistence round-trips through the cc adapter, cc env bootstrap, cross-host parity (codex↔cc share host-agnostic runtime context + identical project-root resolution; only L3 selects the host), and HostMcpServer cc-path dispatch + codex/cc dispatch parity. cc adapter forced via `CODEX_PLUGIN_ROOT_ENV`→cc shell root (production shape-detection, no test-only injection). Full unit failed-set IDENTICAL to baseline (39 files; +14 in passed 1105→1119).

## RC-6 — layer-contract fixation

`scripts/lint-layer-boundary.mjs` + `npm run lint:layer-boundary` (in `check`); commit `f985c68`. Enforces the one-way contract around the MCP surface: L2 (`lib/runtime/mcp`) imports services/workflows (L1) one-way; L1 (`lib/service`, `lib/workflows`) must not import back into L2. Fixed the one backslip found: `lib/service/module/ModuleService.ts` imported `inferLang` from `lib/runtime/mcp/handlers/LanguageExtensions.js` (an L2 re-export of `@alembic/core`) — re-pointed to import from `@alembic/core/host-agent-workflows` directly; removed the now-dead `LanguageExtensions.ts`. Gate starts GREEN; the 26 clean L2→L1 seams (16 files) are unaffected.

## RC-8 — compatibility-residue decisions (no intent rework)

- **HostDeclaredIntentInput** (`lib/service/task/host-turn-meta.ts:9`) = **LIVE, KEEP**. Consumed by `lib/runtime/mcp/handlers/agent-public-tools.ts` + `lib/shared/schemas/mcp-tools.ts`; an optional, size-limited (trim+slice 1600) semantic-metadata carrier retained after PDR-1. Not the deleted intent paradigm.
- **file-monitor** (`lib/runtime/EnhancementRoute.ts`) = **pure diagnostic measurement, KEEP**. Reads the daemon `fileMonitor` status and projects `available`/`mode`/`longLivedOwner` into the enhancement-route status shape — no behavior branch (`FileChangeHandler`/`GitDiffCheckpointService` were deleted by PDR-1). Kept to preserve the user-visible status shape; not trivially dead.
- **intent paradigm deletion** = owned and completed by daemon-removal **PDR-1** (2026-06-18). DH-5 does NOT re-own it; it only preserves the four-tool external MCP semantics. Cross-requirement boundary recorded.

## DH-4 carry-over

- **AGENTS.md** «共享资产单源与漂移门禁» synced: documented the DH-4b `perHostSections` model (skill-shared-sections assets may declare per-host, host-divergent tool-surface sections that the gate cross-host-coherence-skips, coexisting with "in-marker = shared").
- **structure skill 0-coherence** = accepted tradeoff (recorded in AGENTS.md): `skill-alembic-structure`'s two shared sections (`title-intro` / `tools-and-graph`) are both host-divergent → both per-host → 0 cross-host-coherent shared sections. Honest result under the "plugin assets unchangeable" constraint; a future two-sided refactor could restore host-agnostic prose coherence.
- **cc setupProfile** = controller-ruled **CC3 / not in this requirement** (no code change here). `CODEX_SETUP_PROFILE='codex-plugin'` is a persistence-frozen init-marker `profile` value (`InitMarker.profile` type-locked + `SetupService` keys ghost-mode off it); cc reusing it is functionally correct (both shells are marketplace plugins). A distinct cc profile value is a wire/persistence migration whose only real benefit is the name — that is CC3 wording territory.

## RC-1~8 completion

All implementation phases (DH-1~DH-5) are DONE. Two drift gates GREEN (Node≥22). de-Codex misnaming zeroed; host-name branches only in L3; four-tool MCP semantics + wire/persistence-frozen values intact; pure-MCP non-resident invariant held. The requirement now enters **DH-6 acceptance** (real cc validation by Test; codex externally). Outstanding non-blocking: cc submodule commits (`f2c2929` DH-4a, `15fce77` DH-4c) are local — push is a separate release step.
