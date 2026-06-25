# MC-3p — Remove dead resident-prime `/api/v1/task` bypass (consumer-before-producer)

- Demand: `alembic-main-capability-inventory-cleanup`
- Task: `MC-3p` / dispatchGroup `mc3p-plugin-prime-task-lane`
- Window: AlembicPlugin · Date: 2026-06-19 · Base `dddb767` → HEAD `afbf25e` (1 commit on main)
- Status: **completed** · no Core change (AlembicCore clean at `f0bf896`)
- Cross-repo role: hard prerequisite for main Alembic `MC-3` deleting `/api/v1/task` (consumer removed before producer).

## Step 1 — Deadness verification (the decision-critical gate) — CONFIRMED DEAD
The resident prime path `AlembicResidentServiceClient.prime` / `primeWithResult` → `RESIDENT_TASK_PATH='/api/v1/task'` is unreachable on **any** live prime path. Reachability trace (first-hand):
- **No live caller of `.prime(`/`.primeWithResult(`** anywhere in lib — the only references were: the resident client's own def, the `ResidentSearchClient.prime`/`primeWithResult` capability wrappers, the AppModule DI **binds** (`AppModule.ts:84/:85`), and tests. Nothing **invokes** the bound methods (grep of `residentServiceClient.prime*` / `clients.search.prime` consumers = 0).
- **Live prime = local**: `agent-public-tools.primeHandler` (:181) → `runPrimeSearch` (:197) → `getPipeline` → `container.get('primeSearchPipeline')` → local `PrimeSearchPipeline.search`. `PrimeSearchPipeline` header: "resident-handoff lane removed in PDR-1d." It imports resident-prime *types* for optional evidence fields but never calls the resident prime.
- **Live resident lane = search**: `handlers/search.ts` `tryResidentSearch` (:1868) → `residentSearchClient.search(...)` → `/api/v1/search`. Not prime.
- **No enhancement-route resident-prime branch** (`selectEnhancementRoute` is now `resident`/`pure-local` from PDR-5; no resident-PRIME routing).
→ The "dead path" premise of user decision ③ holds. (Had it been reachable, the task required STOP + `needs-controller-decision`; it was not.)

## Step 2 — Surgical removal (only the dead bypass)
Removed (each grep-confirmed orphaned after prime removal):
- `AlembicResidentServiceClient.ts`: `prime()` + `primeWithResult()` methods; `RESIDENT_TASK_PATH` + `RESIDENT_PRIME_TIMEOUT_MS` + `residentPrimeTimeoutMs`; prime-only helpers `buildResidentPrimeBody`/`taskPrimeItems`/`buildResidentPrimeSearchMeta` (held the `:1671` `endpoint: RESIDENT_TASK_PATH` ref); `ResidentPrimeRequest` type; an orphaned local `recordArray` helper.
- `AlembicResidentCapabilityClients.ts`: `ResidentSearchClient.prime` + `.primeWithResult` wrappers (kept the class + its `search`/`searchWithResult`).
- `AppModule.ts`: the `prime:` (:84) + `primeWithResult:` (:85) DI binds.
- Tests: the 2 `/api/v1/task` prime test cases in `AlembicResidentServiceClient.test.ts`.

KEPT (shared with the LIVE search lane / local pipeline — verified consumers):
- Live lanes: `probe`, `resolveProjectScopeIdentity`, `search`/`searchWithResult` (+ `RESIDENT_SEARCH_PATH`), `enqueueJob`/`readJob` (+ `RESIDENT_JOBS_PATH`).
- Shared types: `ResidentSearchResult`, `ResidentPrimeInjectionPackageSummary`, `ResidentPrimeRetrievalConsumerSummary`, `ResidentSearchAttemptMeta` (imported by `PrimeSearchPipeline.ts` as optional-evidence types).
- Shared helpers: `summarizeResidentHostIntentHandoff`, `compactResidentPrimeInjectionPackage`, `unavailablePrimeRetrievalConsumerSummary` (called by the search-lane `searchWithResult`/`buildResidentMeta`/`buildUnavailableSearchResult`).

## Evidence (gates)
- `npx tsc --noEmit` = exit 0 at HEAD `afbf25e`.
- grep-clean across lib/bin/scripts/config = **0** for `RESIDENT_TASK_PATH`, `/api/v1/task`, `primeWithResult`, `ResidentPrimeRequest`, `buildResidentPrimeBody`, `taskPrimeItems`, `buildResidentPrimeSearchMeta`, `RESIDENT_PRIME_TIMEOUT_MS`, and resident `.prime(` callers.
- Live search lane intact: `RESIDENT_SEARCH_PATH`/`RESIDENT_JOBS_PATH` present; `tryResidentSearch → residentSearchClient.search` intact; `PrimeSearchPipeline` shared-type imports intact.
- biome `lib/ bin/ config/ scripts/` = 0 errors / 16 warnings (= baseline; no new).
- **0 net-new test failures**: vitest JSON failed-file-set baseline-diff (pre-MC-3p `dddb767` vs HEAD) = 39 = 39 identical (total tests −2 = exactly the 2 removed prime/task cases).
- No Core change: `git -C AlembicCore` clean at `f0bf896`.

## Cross-repo handoff
The AlembicPlugin consumer is now fully detached from `/api/v1/task`. The main Alembic repo's **MC-3** can delete the `/api/v1/task` route (producer) — the consumer-before-producer ordering is satisfied. Runtime full-chain (resident search/job round-trips against a live host) → Test.
