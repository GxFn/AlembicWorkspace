# PDR-5 — Rewrite selectEnhancementRoute (pure-local first-class)

- Demand: `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`
- Task: `pdr-5-enhancement-route-rewrite` / PDR-5 · dispatchGroup `pdr5-plugin-route-rewrite`
- Window: AlembicPlugin · Date: 2026-06-19 · Base `42a4dc7` (PDR-3) → HEAD `7783144` (1 commit on main)
- Status: **completed** · no Core change (AlembicCore clean at `f0bf896`)

## What shipped (统领设计 ③ landed)
Rewrote `lib/runtime/EnhancementRoute.ts` `selectEnhancementRoute` from the daemon-era 3-route fallback chain to **two first-class Plugin routes**:

```
export type CodexEnhancementRouteKind = 'resident' | 'pure-local';   // was = Core AlembicRuntimeRouteKind

function selectEnhancementRoute(input: { daemon }): CodexEnhancementRouteKind {
  if (input.daemon.residentService !== null) return 'resident';  // 有主体: resident Alembic service reachable → consume via Core contracts
  return 'pure-local';                                            // 无主体: in-process MCP + local cache + local vector — first-class, not a degrade
}
```

Before: 6-branch logic on `daemon.ready`/`daemon.route`/`requirement`/`localInstall` returning `local-alembic-daemon` / `local-alembic-install` / `embedded-plugin-runtime` (the last was an unconditional fallback at :305/:310 — dead after the PDR-3 daemon deletion).

Supporting changes (all `lib/runtime/`):
- Route kind is now **Plugin-local** (dropped `= AlembicRuntimeRouteKind`; removed that Core import — Core enum untouched). Verified no consumer feeds `selected` back into a Core API.
- Removed the **unconsumed** `HostEnhancementRouteChoice.embeddedRuntime` descriptor (the embedded-daemon-spawn shape) + its construction + the now-unused `runtime` param (call sites in StatusService/Diagnostics/HostMcpServer updated).
- `buildEnhancementRouteReason` → two branches (resident / pure-local-first-class).
- `inferRouteFromReadyDaemon` → `return null` (daemon self-route gone; drops the embedded literal).
- Consumers updated to the new kinds: `ModuleBoundary.ts` (`consumesLocalAlembicCapabilities = selected==='resident'`), `ProjectRuntimeContext.ts` (`=== 'resident'`), `StatusService.ts` (resident / pure-local route note), `Diagnostics.ts` (dropped the embedded-plugin-runtime self-route check).
- Tests updated (`CodexEnhancementRoute`, `CodexModuleBoundary`, `DataLossWorkflowGates`) to the new kinds + removed embeddedRuntime fixture.

## Evidence (gates)
- `npx tsc --noEmit` = exit 0 at HEAD `7783144`.
- `grep -rn "embedded-plugin-runtime" lib/runtime/EnhancementRoute.ts` = **0** (selectEnhancementRoute + route choice clean). `CodexEnhancementRouteKind` is the new 2-value union only.
- **prime route-agnostic UNAFFECTED**: `lib/runtime/mcp/handlers/agent-public-tools.ts` has zero references to `enhancementRoute`/`HostEnhancementRouteChoice`/`.selected`/route kind; `runPrimeSearch` uses the unified `pipeline.search` (PDR-1d). No rework.
- biome `lib/ bin/ config/ scripts/` = 0 errors / 16 warnings (= PDR-3 baseline; no new issues).
- **0 net-new test failures**: vitest JSON failed-file-set baseline-diff (pre-PDR-5 `42a4dc7` vs HEAD) = 39 = 39, identical sets, none route-related.
- **No Core change**: `git -C AlembicCore` clean at `f0bf896` (route kind is Plugin-local; GuardService/KnowledgeService still get null gateway from PDR-3).
- Local vector / four tools / evolution / kept items unaffected (compile + no net-new).

## Boundary note / PDR-4 follow-up (documented deviation)
7 `embedded-plugin-runtime` occurrences remain in `lib/service/resident/AlembicResidentServiceClient.ts` — these are `AlembicResidentServiceStatus.route` (the resident service's **self-reported Core route**, typed as Core `AlembicRuntimeRouteKind` which still contains the value). The client synthesizes/recognizes an "embedded Plugin runtime recoverable host-agent" resident-service status there. This is **resident-client internal + Core-contract**, NOT the Plugin's route selection — and the route selection never consumes it (it reads `daemonStatus.health.data.residentService`, null in the daemon-less Plugin → `pure-local`). Cleaning it would require resident-client slimming (**PDR-4**, explicitly out of PDR-5 scope) or a Core enum change (forbidden). Left for **PDR-4** to decide whether the synthesized embedded-plugin resident-service construct survives. PDR-5's own grep-clean target (selectEnhancementRoute / EnhancementRoute.ts) is fully satisfied.

## Runtime gap
Real route resolution against a live resident host vs pure-local (and the resident-detection wiring that PDR-4 adds) → Test/PDR-6. Verified here by tsc + static call-graph + targeted tests + baseline-diff.
