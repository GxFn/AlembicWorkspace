# PDR-3 — Delete the full daemon carrier (Plugin is now a pure non-resident MCP process)

- Demand: `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`
- Task: `pdr-3-delete-daemon` / PDR-3 · dispatchGroup `pdr3-plugin-delete-daemon`
- Window: AlembicPlugin · Date: 2026-06-19 · Base: `7e6af98` (PDR-2b) → HEAD `42a4dc7`
- Status: **completed** · 8 staged commits on main (no branch) · **no Core change** (AlembicCore clean at `f0bf896`)
- Net diff vs `7e6af98`: **109 files, +247 / −9685** (carrier purge).

## What shipped (decouple-first, tsc-green + commit per logical step)
| Commit | Stage | Change |
|---|---|---|
| `40ad7f3` | 1 prep | Relocate the 2 **live-path** lib/http files out before deletion: `host-managed-boundary.ts`→`lib/service/module/` (ModuleService→code_guard/graph), `RateLimiter.ts`→`lib/runtime/mcp/` (`checkRecipeSave` on knowledge/tool-router live path). **Independent grep caught RateLimiter — the consumer map had missed it.** |
| `135fdd2` | 2 prep | Relocate `DaemonStatus`/`DaemonStatusKind` types → `lib/runtime/daemon-status.ts`; re-point 15 consumers. |
| `758ab22` | 3c | Delete `CacheCoordinator` (+test, ServiceContainer/ServiceMap wiring, unused `unwrapRawDb`). Single-process consistency stays via `KnowledgeModule knowledge:changed→searchEngine.refreshIndex`. |
| `5a1dda0` | 4a | Decouple `HostMcpServer`/`StatusService`/`local-tool-dispatcher` from daemon: drop supervisor field/option/interface; daemon status → `null` (live four-tool path, null-guarded) or synthetic `'stopped'` where downstream is non-null-typed; remove `openDashboard()`+`stopDaemon()`; `cleanupRuntime` keeps the local rmSync, drops `supervisor.stop`. |
| `366d81a` | 4/3a+3e | Delete `lib/daemon` (DaemonSupervisor+DaemonJobRunner), `lib/http` (HttpServer + all routes/middleware/utils incl auth tombstone), `bin/daemon-server.ts`. Trim EmbeddedRuntimeContract (daemon-server.js + http routes + RETAINED_DAEMON_ENTRY) + ModuleBoundary; drop daemon-server.js from 5 packaging scripts; remove `#http/*` from both manifests; re-home 2 RateLimiter doctrine-lint exemptions, drop sse-sessions one. Remove `alembic_dashboard` from the surface (catalog/ToolPolicy/output/ServiceRequestBoundary/Diagnostics/ModuleBoundary). Test suite cleaned. |
| `7488fda` | 5+6 / 3b+3d | Delete `lib/governance/gateway` (Gateway/GatewayActionRegistry/NoOpGateway) — pass `null` to Core GuardService/KnowledgeService gateway ctor param (Core stores but never reads it; **no Core change**). Delete `NoOpAuditLogger` + the dead `slimAuditGovernance` branch (its only setter, bin/daemon-server, is gone) → bootstrap always builds real AuditStore+AuditLogger. |
| `4572913` | 7 | Remove `alembic_dashboard` + `alembic_runtime action:'stop'` + obsolete daemon-recovery block from probe/smoke scripts. |
| `42a4dc7` | 8 | Purge dead helpers the decouple orphaned (summarizeResidentServiceResult/attachResidentServiceResult/readJsonFile + cascaded imports). |

## Sub-part completion (3a–3e)
- **3a daemon carrier**: deleted (lib/daemon, lib/http, bin/daemon-server). DaemonSupervisor/DaemonJobRunner/HttpServer consumers收口 (HostMcpServer/StatusService daemon-less; readJob uses the local Core JobStore only). No resident process remains.
- **3b governance Gateway**: 3 files deleted; Core GuardService/KnowledgeService receive `null` (Plugin-side only). EvolutionGateway/RecipeProductionGateway untouched (distinct live gateways).
- **3c CacheCoordinator**: deleted (Conclusion A).
- **3d NoOpAuditLogger + EmbeddedRuntimeContract**: NoOpAuditLogger deleted; AuditLogger/AuditStore kept; EmbeddedRuntimeContract daemon entries trimmed.
- **3e MCP surface**: `alembic_dashboard` fully removed; `alembic_runtime` is cleanup-only (local fs); `alembic_status` degrades to a stopped daemon status.
- **EnhancementRoute**: minimal收口 only (DaemonStatus type re-homed; `selectEnhancementRoute` selection logic byte-unchanged — the embedded-plugin-runtime branch reads plain booleans/strings). Full rewrite is **PDR-5**.

## Evidence (gates)
- `npx tsc --noEmit` = **exit 0** at HEAD `42a4dc7`.
- biome `lib/ bin/ config/ scripts/` = **0 errors / 16 warnings** (baseline was 2 err / 17 warn) → **no new issues** (fewer; remaining 16 are pre-existing noConsole/noTemplateCurlyInString in untouched scripts).
- **grep-clean**: zero code references to DaemonSupervisor / DaemonJobRunner / daemon-server / lib/http / HttpServer / CacheCoordinator / NoOpGateway / NoOpAuditLogger / alembic_dashboard / openDashboard across lib/bin/scripts/config. (`@alembic/core/daemon` JobStore/DaemonState etc. are the kept Core contract, not residual.)
- **No net-new test failures**: authoritative baseline-diff (vitest JSON failed-file sets) `7e6af98` vs HEAD = **39 vs 39 failed files, identical sets, 0 net-new**. None of the 39 reference daemon/dashboard/gateway/cache/http/supervisor (all pre-existing DB/vector/integration sandbox failures per the baseline memory).
- **No Core change**: `git -C AlembicCore` clean at `f0bf896` throughout.
- **Four-tool live path intact**: McpServer HANDLER_MAP routes alembic_prime/work/code_guard/search to in-process ServiceContainer handlers; buildPluginOwnedProjectRuntimeContext tolerates `daemonStatus=null` (downstream null-guarded). Verified by compile + call-graph; real full-chain run → Test/PDR-6.
- **Kept intact** (verified present): EvolutionGateway, RecipeProductionGateway, PluginOpportunisticEvolution/GitDiffScanner/alembic_evolve, AuditLogger/AuditStore, local vector (SearchEngine/VectorService), PDR-2 region/job localization.

## Runtime gaps / notes (deferred)
- Real full-chain runtime (MCP stdio boot, four-tool exec, packaging/smoke without daemon-server.js) → **Test/PDR-6** (sandbox can't boot the real MCP/vector/embed stack).
- **PDR-5** owns the `selectEnhancementRoute` rewrite (drop embedded-plugin-runtime branch) + further DaemonStatus-shape reduction; **PDR-4** the resident-client slim. The relocated `DaemonStatus` type is a vestigial daemon-less shape these consumers still reference until then.
- Minor residual: `test/fixtures/factory.ts` still exports an unused `mockGatewayRequest` builder (no import of any deleted file; harmless, biome/tsc-clean) — optional follow-up cleanup, not in PDR-3 scope.
- `vendor/AlembicCore` drift unchanged — release/PDR-6 concern.

## Boundaries honored
No Core change (only `null` to Core ctors). No daemon left. bootstrap/rescan tool interaction unchanged (envelopes preserved; alembic_job still returns a completed job record). Committed to main in 8 steps, no branch.
