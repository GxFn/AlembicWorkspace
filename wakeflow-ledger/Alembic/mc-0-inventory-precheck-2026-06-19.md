# MC-0 Inventory + Precheck — Evidence & Conclusions (2026-06-19)

- Demand: `alembic-main-capability-inventory-cleanup-2026-06-19`
- Task: MC-0 (pure audit / research — **no code changed**)
- Window / repo: `Alembic` = `alembic-ai` main repo
- HEAD: `2341fe7` (branch `main`, clean tree)
- Status: **audit complete; gated on controller decisions before MC-1/2/3 dispatch**
- Method: read-only git/grep/read across `Alembic`, `AlembicDashboard`, `AlembicPlugin`, `AlembicCore` (+ `AlembicAgent`); boundary lints + `build:check` run as baseline. Highest-impact, plan-contradicting findings independently re-verified by the controller window.

---

## ④ Boundary-lint + build:check baseline — ALL GREEN (Node 22)

Run at HEAD `2341fe7`, Node **v22.22.1** (npm 10.9.4):

| Check | Result | Evidence |
| --- | --- | --- |
| `lint:agent-extraction-boundary` | **EXIT 0 ✅** | product `#agent` call sites 0; local Agent files 0; `@alembic/agent/tools/v2` consumers 0; duplicate tool/terminal files 0 |
| `lint:core-import-boundary` | **EXIT 0 ✅** | scanned 392 files / 435 `@alembic/core` imports OK; local `../AlembicCore` source |
| `lint:repo-boundary` | **EXIT 0 ✅** | passed; `@escape-hatch` 1/75 threshold (permanent 1, temporary 0; shrink-only baseline 1) |
| `build:check` | **EXIT 0 ✅** | `build:core` (local `../AlembicCore`) + `tsc --noEmit` clean |

**Operational gotcha (must propagate to MC-1/2/3 + Test):** these gates REQUIRE **Node ≥22** (`.nvmrc`=`22`). Under the default Node 18 the boundary/build scripts crash with a false `TypeError ERR_INVALID_ARG_TYPE: path … undefined` because `import.meta.dirname` is `undefined` on Node 18 (`scripts/workspace-source.mjs:4`, `scripts/lint-repo-boundary.mjs:23`). This is **not** a real boundary violation — it is an env artifact. Downstream windows must `nvm use 22` (or invoke the v22 binary) before running gates, else they will see spurious red and a false regression. **This green baseline is the MC-1/2/3 regression reference.**

---

## ① CCR-ALMB in-flight cleanup final-state review (HARD PRECONDITION) — SATISFIED

**Verdict: the CCR-ALMB / DRR / P4 cleanup line is FULLY LANDED on `main` and pushed; it is NOT in-flight; it is essentially clear of this demand's deletion set, with one bounded scope-overlap (not a git conflict).**

Cleanup line = 8 contiguous commits at the tip of `main` (one continuous agent-extraction + cross-repo retirement effort):

| Hash | Subject | Touched |
| --- | --- | --- |
| `2341fe7` (HEAD) | drop V2 class labels in tool wiring (P4b) | AgentModule + 2 v2 tests (label-only) |
| `d634615` | repoint @alembic/agent/tools/v2 → /tools/runtime (P4a) | AgentModule, tools/v2/ToolContextFactory, 3 tests |
| `41ef368` | remove ToolForge wiring after Agent ./forge removal | AgentModule (M) + deletes 5 ToolForge tests |
| `cfffda0` | repoint guard:ci/guard:staged SOURCE_EXTS (CCR-ALMB rework-2) | bin/cli.ts |
| `33530e0` | CCR-ALMB retire coverage/compliance consumers + DI + analyzer tests | bin/cli.ts, routes/guardRules.ts, ServiceMap, GuardModule, 2 tests; deletes CoverageAnalyzer.test |
| `14f426c` | W3-ALMB DRR-3 delete DecisionRegisterStore impl | deletes `lib/service/task/DecisionRegisterStore.ts` (945 L), InfraModule, ServiceMap, http-requests, 3 tests |
| `7400f76` | W2-ALMB DRR-2 delete decision-register HTTP entry | deletes `lib/http/routes/decision-register.ts` (254 L), HttpServer, provider-contracts, dashboard-api-types, 4 tests |
| `66ba6bd` | W1-ALMB DRR-1 prime/IntentEvidence consumer + CCR-1 guardReport HTTP removal | deletes `routes/guardReport.ts`; **modifies (M)** `lib/service/task/IntentEvidence.ts` (−56) & `lib/service/task/PrimeInjectionPackage.ts` (−49); HttpServer, provider-contracts, dashboard-api-types, 1 test |

Landed/in-flight evidence: `git rev-list --left-right --count origin/main...main` → `0  0`; `git status --porcelain` empty; `git stash list` empty; only `main` + `origin/main` branches. `DecisionRegisterStore` → 0 refs anywhere in HEAD.

**Overlap (bounded, NOT a conflict):** commit `66ba6bd` already trimmed `lib/service/task/IntentEvidence.ts` and `lib/service/task/PrimeInjectionPackage.ts` (stripped their decisionRegister sub-sections). **Both files still exist in HEAD** and are in MC-3's whole-file deletion set (`lib/service/task/` currently holds all 8: HostIntentContext, IntentEpisodeStore, IntentEvidence, IntentExtractor, IntentSearchPlan, PrimeInjectionPackage, PrimeSearchPipeline, TaskDispatchService). MC-3's full-file delete **supersedes** the partial edit — no git conflict (everything landed, working tree clean). → `needs-controller-decision (low)`: confirm MC-3 owns full-file removal of these two and that no decisionRegister nuance from `66ba6bd` must be preserved.

**Path corrections for the deleter** (demand spec implied wrong dirs — use REAL HEAD paths): `CrossEncoderReranker` → `lib/service/search/`; `WikiUtils` → `lib/service/wiki/`; `AppConfigLoader` → `lib/infrastructure/config/`; `refreshPanorama` impl → `lib/workflows/completion/CompletionSteps.ts`; `SkillCompletionCapability` → `lib/workflows/skill-delivery/`.

---

## ② `/task` · `/intent-episodes` · `alembic_task` runtime-consumer check — NO live consumer (MC-3 safe)

Scanned Alembic + AlembicDashboard + AlembicPlugin (+ AlembicCore/Agent).

- **`alembic_task` (MCP tool):** retired & fail-closed in Plugin (`AlembicPlugin lib/runtime/mcp/McpServer.ts:322`, `HostMcpServer.ts:235` → "alembic_task has been retired"). In Alembic only a Zod schema entry (`lib/shared/schemas/mcp-tools.ts:515`) + `meta:{tool:'alembic_task'}` telemetry strings inside `TaskDispatchService`. **No live consumer.**
- **`/api/v1/task` route:** defined `lib/http/routes/task.ts`, mounted `lib/http/HttpServer.ts:326`. The ONLY client is `AlembicPlugin AlembicResidentServiceClient.primeWithResult()` (`RESIDENT_TASK_PATH='/api/v1/task'`) — a **dead lane**: no MCP handler/route/bin invokes `prime`/`primeWithResult`; the live prime path uses local `PrimeSearchPipeline` on the local `searchEngine`, and the live resident lane is `/api/v1/search`. **Confirms design — safe to delete.**
- **`/api/v1/intent-episodes` route:** defined `lib/http/routes/intent-episodes.ts`, mounted `HttpServer.ts:329`. No caller in any repo (Plugin `AppModule.ts:76` comment: intentEpisode client lanes already dropped). **Safe to delete the route.** ⚠ Coupling: `IntentEpisodeStore` is live **via DI inside `TaskDispatchService`** (`:172,659,690,714,739`), NOT via the HTTP route — deleting the route ≠ deleting the store. Since MC-3 deletes all of `lib/service/task/`, route + store go together; just don't delete the store while keeping TaskDispatchService.

No `needs-controller-decision` for live consumers here — all four targets have none.

---

## ③ `/api/v1/monitoring` + dashboard stats disposition

**`/api/v1/monitoring`:** route `lib/http/routes/monitoring.ts`, mounted conditionally (`config.enableMonitoring`) at `HttpServer.ts:316`. **Zero runtime callers** in any repo — AlembicDashboard health polling hits `/daemon/health` + `/panorama/health` (`AlembicDashboard src/api.ts`), never `/monitoring`. **MC-2 safe** to delete the route + I23 contract entry. The `infrastructure/monitoring/` middleware (ErrorTracker/PerformanceMonitor) are separate (MC-2's own decouple scope).

**Dashboard stats `guardHits`/`searchHits`/`searchHitsLast30d` — KEY CORRECTION TO THE PLAN PREMISE:**

These fields are **NOT produced or owned by HitRecorder or the intent chain.** They are defined in **Core's** `KnowledgeStatsWire` (`AlembicCore/src/types/KnowledgeWire.ts`; vendor mirror `vendor/AlembicCore/src/types/knowledge-wire.ts:54,55,62`) and are produced **and read by live Core logic**: `SearchEngine`, `KnowledgeService`, `DecayDetector`, `ProposalExecutor`, `EnhancementSuggester`, `EvolutionPolicy`, `Stats`, knowledge/search repositories (10 Core files reference them). `HitRecorder` is only **one** writer: it maps `guardHit→guardHits`/`searchHit→searchHits` (`lib/service/signal/HitRecorder.ts:50-56`) and emits `guard`/`search`/`usage` signals — **never an `intent` signal** (`:59-65`). In Alembic non-generated code the only field references are `lib/service/handler-runtime/types.ts:302,304` (loose optional DTO) + the HitRecorder mapping. `HitRecorder.record()` has **no production caller** in `Alembic/lib` (only DI registration `lib/injection/modules/SignalModule.ts:62-71` + type in `ServiceMap.ts:174`).

**Consequence:** deleting HitRecorder + the intent chain does **NOT** remove or zero these fields — they survive via Core and keep feeding evolution/decay scoring. The field disposition is **independent of the HitRecorder deletion**, so MC-3 (HitRecorder removal) is **not blocked** by this decision either way.

Two drift gates (independent, compare TYPE text not values): Alembic `test/unit/DashboardApiTypesDrift.test.ts` (byte-equal vs generator, runs in `test:unit`) + AlembicDashboard `check:api-types-drift`.

| Option | Touches AlembicDashboard? | Core change? | Drift-gate churn | Risk |
| --- | --- | --- | --- | --- |
| (a) remove fields + regen + frontend edit | YES (`KnowledgeView.tsx:812/820`, i18n, regen `src/generated/api-types.ts`) | **YES — edit `KnowledgeStatsWire`+`Stats`** (OUT OF SCOPE: Core/Agent unchanged); breaks live evolution/decay readers | both gates must be re-satisfied in both repos | **High / partly out of scope** |
| (b) keep fields as-is (delete only HitRecorder) | NO | NO | NONE | **Low** |

**Recommendation: Option (b).** Do nothing to the stat fields; just delete HitRecorder (not the authoritative producer). Only `searchHitsLast30d` is genuinely dead (never computed nonzero, never displayed) — but it lives in Core's wire type, so removing it is **out of this repo's scope** (Core unchanged). → **`needs-controller-decision` (explicitly reserved to controller).**

---

## ⑤ Confirmed-dead / shells / retired-routes grep recheck

Only **4 of 11** candidates are truly safe direct-deletes; **7 are NOT pure dead/shell** and need decoupling or a controller decision.

### Cleanly DEAD — MC-1 may direct-delete within the package

| # | Item | Location | Note |
| --- | --- | --- | --- |
| 1 | `CrossEncoderReranker` | `lib/service/search/CrossEncoderReranker.ts:29` (+ its unit test) | wired `null` at `lib/injection/modules/KnowledgeModule.ts:121`; never instantiated. **KEEP the `crossEncoderReranker: null` wiring line** — vendor `SearchEngine` still reads that option key |
| 2 | `ReactiveEvolutionService` alias | `lib/service/evolution/FileChangeHandler.ts:484` | `export { FileChangeHandler as ReactiveEvolutionService }`; delete the alias line (+ `:483` JSDoc) ONLY; keep `FileChangeHandler` (live-wired) |
| 3 | `WikiUtils.BUILD_SYSTEM_MARKERS` | `lib/service/wiki/WikiUtils.ts:517` | @deprecated alias of `LanguageService.buildSystemMarkers`; no live consumer; delete alias + JSDoc |
| 7 | `lib/workflows/agent-project-context/` | empty, git-untracked dir | `rmdir` (no `git rm` needed) |

### NOT pure-dead / shell → `needs-controller-decision`

| # | Item | Location | Why it is not a clean delete |
| --- | --- | --- | --- |
| 4 | `refreshPanorama` shell | `lib/workflows/completion/CompletionSteps.ts:21` | empty BODY but **live-called** on default path at `CompletionFinalizer.ts:74` + asserted by `WorkflowCompletionFinalizer.test.ts:184`. Delete = remove no-op step + call site + `panoramaMode` machinery + test (refactor, not file delete) |
| 5 | `PanoramaModule` | `lib/injection/modules/PanoramaModule.ts:9` | no-op `register()`; production-dead BUT `PanoramaWiring.test.ts` deliberately asserts it stays importable as a compatibility shim. Confirm compat contract is droppable |
| 6 | `AppConfigLoader` | `lib/infrastructure/config/AppConfigLoader.ts` | **MISCLASSIFIED as shell.** 3 live consumers (`lib/Bootstrap.ts:10`, `lib/cli/SetupService.ts:547`, `bin/cli.ts:1999`) + load-bearing side effect `ConfigLoader._findPackageRoot = () => PACKAGE_ROOT`. "Over-wrapped" is style only. Recommend **drop from deletion set** OR rescope to "inline the override," not delete |
| 8 | `deliveryMode 'run'` "delivery retired" branch | `lib/workflows/completion/CompletionFinalizer.ts:50,66-70` | both branches are no-ops (`deliveryVerification`/`Status` hard-set before the `if`); removable as a no-op logic edit but it removes a user-visible "retired" log line; bundle with #4 |
| 9 | `regenerateEditorIndex` shell | `lib/workflows/skill-delivery/SkillCompletionCapability.ts:493` | empty BODY but **live-called** by exported `generateSkill` (`:354`); result surfaced as `editorIndex` in the API response (`:365`) → user-visible shape change. (Distinct from `SkillFileService._regenerateEditorIndex` — do NOT conflate) |
| 10 | `auth` 410 tombstone | `lib/http/routes/auth.ts` | **MOUNTED** at `HttpServer.ts:302`; intentional 410 compat. Delete makes `AuthLoginBody` schema + `ZodSchemas.test` cases dead; behavior 410→404. **KEEP the inline `/auth/probe` at `HttpServer.ts:305` regardless** |
| 11 | `search/context-aware` | `lib/http/routes/search.ts:771-789` | **MOUNTED** 410 tombstone AND **AlembicDashboard still POSTs to it** (`AlembicDashboard src/api.ts:3840`). The design's "确认无消费后直删" precondition **FAILS** — removing the handler turns the Dashboard's degraded-410 into a 404. Cross-repo retirement: needs Dashboard-side change first OR keep the tombstone |

---

## Consolidated `needs-controller-decision`

1. **Dashboard stats disposition** (③): choose Option (a) vs (b). Strong recommendation **(b) keep-as-is**; key fact: fields are Core-owned/read, independent of HitRecorder — MC-3 not blocked.
2. **AppConfigLoader** (⑤#6): misclassified as a shell — it is load-bearing with 3 consumers. Drop from deletion set or rescope.
3. **`search/context-aware`** (⑤#11): live cross-repo consumer (AlembicDashboard) — not "no-consumer"; deletion is a cross-repo decision (Dashboard first).
4. **`auth` 410 tombstone** (⑤#10): mounted intentional tombstone + schema/tests coupling; preserve `/auth/probe`.
5. **`refreshPanorama` / `regenerateEditorIndex` / `deliveryMode 'run'`** (⑤#4,8,9): "shells" that are live-called / surfaced in responses — deletion requires decoupling call sites + tests + (for #9) an API response-shape change, not a file delete.
6. **`PanoramaModule`** (⑤#5): production-dead but a deliberately-kept compat shim with a dedicated test — confirm the compat contract may be dropped.
7. **`IntentEvidence.ts` / `PrimeInjectionPackage.ts`** (①): already partially trimmed by `66ba6bd`; confirm MC-3 owns the full-file removal (no conflict; landed).
8. **Node ≥22 requirement** (④): ensure all MC windows + Test run gates under Node 22, else false reds.

---

## Executable recommendations for MC-1 / MC-2 / MC-3

- **MC-1 (safe direct-delete):** delete only items **1, 2, 3, 7** above (keep `crossEncoderReranker: null` wiring; alias-line-only for 2; `rmdir` for 7). Re-route items 4/5/6/8/9/10/11 to controller decision (most fit MC-3's "decouple-first" cluster, not MC-1's "isolated direct-delete").
- **MC-2 (monitoring):** delete `lib/http/routes/monitoring.ts` + mount `HttpServer.ts:316` + provider-contracts I23; Dashboard has zero `/monitoring` runtime dependency (confirmed). Decouple `initErrorTracker`/`initPerformanceMonitor` + perf-timer middleware + `getErrorTracker`/`getPerformanceMonitor` per the plan, then delete `lib/infrastructure/monitoring/`.
- **MC-3 (intent paradigm):** delete `lib/service/task/*` (all 8) + `lib/service/signal/HitRecorder.ts` + `lib/http/routes/task.ts` + `lib/http/routes/intent-episodes.ts`; decouple per plan (mcp-tools, HttpServer mounts, ServiceMap/InfraModule/AppModule DI, handler-runtime/types, SignalModule `subscribe('intent')` + `hitRecorder`). No runtime consumers (confirmed). Dashboard stat fields: keep as-is (Option b) unless controller picks (a). `/search` is independent of `PrimeSearchPipeline` (confirmed) — no retrieval breakage. Run gates under Node 22.

---

## Residual risks / limits

- Read-only audit; no code changed. Baseline build/lint were run (build artifacts in `dist/` only; no source change; Core unchanged).
- `HitRecorder.record()` "no production caller" is from a negative grep over `Alembic/lib`; a caller in Core was not separately traced, but Core increments `guardHits` via its own `GuardCheckEngine.incrementGuardHitsSync` (not via HitRecorder), so HitRecorder removal is safe regardless.
- `searchHitsLast30d` "never computed nonzero" is from a negative grep over `Alembic/lib` + vendored Core; a writer existing only in the sibling `AlembicCore` repo was not exhaustively traced (field has no reader either → low risk).
- The 8-commit CCR-ALMB line boundary was inferred from commit subjects + per-commit `git show`; `git log --grep` with combined `-E` mis-parsed (returned empty) — set is evidenced by oneline log + stats.
