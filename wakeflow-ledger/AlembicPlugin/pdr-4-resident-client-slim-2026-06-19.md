# PDR-4 — Slim AlembicResidentServiceClient (drop dead lanes)

- Demand: `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`
- Task: `pdr-4-resident-client-slim` / PDR-4 · dispatchGroup `pdr4-plugin-resident-slim`
- Window: AlembicPlugin · Date: 2026-06-19 · Base `7783144` (PDR-5) → HEAD `dddb767` (1 commit on main)
- Status: **completed** · no Core change (AlembicCore clean at `f0bf896`)

## What shipped (统领设计 ② landed: non-resident client consumes Core existing contracts)
Slimmed the resident-service layer by removing three **dead** lanes (backing already purged earlier in the demand) while keeping the live lanes fully functional. Live lanes KEPT (they back the four tools on the PDR-5 `'resident'` route): `probe()`, `resolveProjectScopeIdentity`/`#resolveProjectScopeIdentity`, `search`/`searchWithResult`/`prime`/`primeWithResult`, `enqueueJob`/`readJob` + `RESIDENT_SEARCH_PATH`/`RESIDENT_JOBS_PATH`.

Dropped:
- **intent-episodes lane** (IntentExtractor purged PDR-1): `start/latest/recent/updateIntentEpisodeOutcome` + `RESIDENT_INTENT_EPISODE*` path/feature + `ResidentIntentEpisode*`/`ResidentIntentEvidenceSummary` types; the prime material's vestigial `intentEpisode` (always an "unavailable" placeholder) + `intentEvidence` (never populated post-purge) fields + `PrimeIntentEpisodeMaterial`/`PrimeIntentEpisodeRecordSummary` + `createUnavailablePrimeIntentEpisodeMaterial`.
- **decision-register lane** (governance Gateway purged PDR-3): `decisionRegister`/`decisionRegisterCapability` + `RESIDENT_DECISION_REGISTER*` + `ResidentDecisionRegister*` types.
- **dashboard lane** (alembic_dashboard removed PDR-3): `ResidentDashboardClient` + `dashboard` field.
- **embedded-plugin-runtime self-status** (no embedded runtime post-PDR-3): the synthesis factory + recognition checks (the 7 refs); job branches collapse to `jobs.api-ai.*`. **lib now has 0 `embedded-plugin-runtime` refs total** (combined with PDR-5's removal).

Decoupled consumers (11 files): `AlembicResidentServiceClient.ts`, `AlembicResidentCapabilityClients.ts`, `ServiceMap.ts`, `AppModule.ts`, `PrimeKnowledgeMaterial.ts`, `PrimeSearchPipeline.ts`, `agent-public-tools.ts`, `handlers/types.ts` + 3 tests.

`ProjectRuntimeControlSnapshot`/`AlembicResidentService*` consumed exactly as-is (the kept project-scope/probe lanes already do the multi-to-one); no new Core wiring, no Core change.

## Prime-output-shape note
`PrimeKnowledgeMaterial` lost `intentEpisode` + `intentEvidence`, but these were **internal-only** — the public prime tool output (`PrimePublicPackageSchema` in `public-tools/contract.ts`/`output.ts`) never serialized them (grep-confirmed 0 refs + no live reader). So **no public contract/serialization change**; only the material/pipeline/searchMeta shapes + 3 tests were updated. Not a capability downgrade (the fields were dead surface).

## Documented residual (KEPT, by design)
`producerOnlyFields` enums `'decisionRegister'`/`'intent'` remain in `public-tools/contract.ts` (Zod) + `agent-public-tools.ts` — these describe the **Core resident-PRODUCER's emitted field surface**, NOT the dropped Plugin client lane. Removing them from the Zod enum could reject valid Core producer output (and would mis-model Core). Same accepted pattern as PDR-5's resident self-route residual. (`contract.ts:105` `'intent'` is an unrelated pre-existing `refType` enum value.)

## Evidence (gates)
- `npx tsc --noEmit` = exit 0 at HEAD `dddb767`.
- grep-clean across lib/bin/scripts/config = **0** for every dropped client symbol (startIntentEpisode/latestIntentEpisode/recentIntentEpisodes/updateIntentEpisodeOutcome, ResidentIntentEpisodeClient, residentIntentEpisodeClient, RESIDENT_INTENT_EPISODE*, ResidentDecisionRegisterClient, RESIDENT_DECISION_REGISTER*, ResidentDashboardClient, createUnavailablePrimeIntentEpisodeMaterial, PrimeIntentEpisodeMaterial, ResidentIntentEvidenceSummary) and **0 `embedded-plugin-runtime` in all of lib**.
- biome `lib/ bin/ config/ scripts/` = 0 errors / 16 warnings (= baseline; no new).
- **0 net-new test failures**: vitest JSON failed-file-set baseline-diff (pre-PDR-4 `7783144` vs HEAD) = 39 = 39, identical sets.
- No Core change: `git -C AlembicCore` clean at `f0bf896`.
- Kept lanes wired: probe/projectScope/search/prime/job all still defined + their call sites (search.ts, agent-public-tools, HostMcpServer) compile.

## Runtime gap
Real resident-service round-trips (search/prime/job against a live resident host) → Test/PDR-6. Verified here by tsc + static call-graph + targeted tests + baseline-diff.
