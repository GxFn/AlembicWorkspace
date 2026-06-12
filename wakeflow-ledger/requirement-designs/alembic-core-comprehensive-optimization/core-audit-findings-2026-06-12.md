# AlembicCore Comprehensive Audit Findings

Status: evidence base / Design-window five-agent deep scan
Date: 2026-06-12
Audited Head: AlembicCore `ed42960` (clean tree)
Design Key: alembic-core-comprehensive-optimization

Five parallel read-only scans: public API & consumers, layering & semantics,
service/infrastructure edge cases, workflows coupling, tests & gates. All
findings carry file:line evidence; counts are audit-time approximations from
grep/classification, to be re-frozen by CO0.

## Repository Shape

- 373 TS files, ~101k lines. Areas: core 64f/22.9k, service 78f/27.5k,
  workflows 58f/14.9k, infrastructure 44f/7.7k, shared 35f/8.5k, repository
  32f/6.6k, domain 27f/7.8k, daemon 8f/3.6k, types 9f/1.5k.
- package `@alembic/core` 0.2.0, 140 export keys; boundary policy
  `config/public-api-boundary.json` pins stable=18 / provisional=24 /
  transitional=98 (61 wildcard, frozen at max), with a closeout inventory and
  a facadeReadiness map covering only 16 of the 61 wildcard groups.
- Consumers (cross-repo grep): 849 `@alembic/core` imports — Alembic 210,
  AlembicPlugin 185, AlembicAgent 54, AlembicDashboard 0 (Dashboard consumes
  via HTTP, not the package). Top specifiers: logging 125, workspace 91,
  shared 81, project-intelligence 68, events 52, daemon 51, knowledge 46,
  host-agent-workflows 45, search 44, io 33.

## A. Public API Surface

- A1 [high] 61 wildcard exports are frozen as transitional but 45 groups have
  no documented migration target (`config/public-api-boundary.json` maxCounts
  wildcardExports=61 vs 16 facadeReadiness groups). Open-ended compatibility
  tail.
- A2 [high] Four parallel source-graph facades — `./source-graph` (stable),
  `./domain/source-graph`, `./service/source-graph`,
  `./repository/source-graph` — with zero external consumers today
  (`src/source-graph.ts` re-exports all). CKG2/CKG4 will create the first
  real consumer; the surface must be unified before that.
- A3 [medium] 14 curated (non-wildcard) exports have zero external
  consumption: aggregate roots `./domain`, `./infrastructure`, `./service`
  plus `./infrastructure/{config,event,io,logging,signal}`,
  `./domain/knowledge/values`, `./domain/source-graph`,
  `./repository/source-graph`, `./service/{evolution,knowledge,source-graph}`.
- A4 [medium] Boundary gate is descriptive, not prescriptive: it checks
  counts/classification (`scripts/check-public-api-boundary.mjs:38-147`) but
  validates neither facade narrowness nor consumer migration trend;
  facadeReadiness is advisory only.
- A5 [medium] Deep transitional imports persist in consumers (Plugin/Alembic
  import `infrastructure/database/drizzle` and migrations directly, e.g.
  `Alembic/test/unit/ConsolidatedProposal.test.ts:18-20`), pre-approved via
  allowlists with no shrink rule.
- A6 [low] `smoke-public-api.mjs` verifies import accessibility of 79
  entrypoints only — no behavioral contract; name overstates coverage.
- A7 [low] Duplicate stable/transitional pairs confuse routing:
  `./dimensions` vs `./domain/dimension`, `./knowledge` vs
  `./domain/knowledge`, `./evolution` vs `./service/evolution` — stable
  facade always wins in practice; the duplicates add surface without signal.

## B. Layering And Responsibility

- B1 Area map (de facto): core = multi-language AST/analysis leaf; domain =
  business entities/contracts (cleanly isolated); service = orchestration +
  rules; repository = drizzle/persistence; shared = leaf utilities;
  infrastructure = db/io/log/signal/vector; workflows = high-level
  orchestration; daemon = job/runtime contracts; types = cross-layer bridges.
  No written layer contract exists, and no dependency-direction lint enforces
  one.
- B2 [high] Upward imports against the de-facto layering:
  service→core (`src/service/guard/GuardCheckEngine.ts:8` imports
  AstAnalyzer), service→workflows
  (`src/service/panorama/ModuleDiscoverer.ts:20` imports TargetClassifier —
  circular risk), workflows→core
  (`ProjectIntelligenceRunner.ts:20,26` imports AstAnalyzer +
  CallGraphAnalyzer). Whether core counts as an importable leaf is exactly
  the undocumented decision.
- B3 [medium] Validator responsibilities scattered with no unified entry:
  `domain/knowledge/UnifiedValidator.ts` (field gates),
  `service/recipe/RecipeCandidateValidator.ts`,
  `service/candidate/CandidateAggregator.ts` (Jaccard 0.85 title
  similarity), `workflows/.../HostAgentSubmissionTracker.ts` (quality scores,
  advisory).
- B4 [medium] File persistence straddle:
  `service/knowledge/KnowledgeFileWriter.ts:29` orchestrates
  `repository/knowledge/KnowledgeFileStore.ts` — write strategy split across
  layers without a stated boundary.
- B5 [medium] Naming overloads: KnowledgeEntry vs Recipe vs candidate vs
  entry; dimension as foreign key (`KnowledgeEntry.ts:31`) vs governance
  concept (`RecipeDimension.ts`) vs planning hint; Session vs Snapshot
  lifecycles blur (`BootstrapSession` holds snapshot cache;
  `BootstrapRepository.ts:266` maps snapshot.sessionId).
- B6 [medium] Behavior-switching boolean flags instead of modes:
  `workflows/cold-start/ColdStartIntent.ts:7-11` (skipGuard, skipAsyncFill,
  skipTargetDelivery) plus enableParallel/enabled elsewhere — composition
  semantics undefined.
- B7 [low] Deprecation debris: `domain/knowledge/RecipeReadinessChecker.ts`
  (self-described thin wrapper, still exported),
  `repository/evolution/ProposalRepository.ts:46` (@deprecated ProposalType
  for migration compat), `ProjectAnalysisCapability` alias
  (`ProjectIntelligenceCapability.ts:58-60`).

## C. Edge Cases And Failure Semantics

- C1 [high] Knowledge create is file-first then DB transaction
  (`repository/knowledge/KnowledgeUnitOfWork.ts:87-132`): if the DB tx
  fails, files persist invisibly until SyncService reconciliation — no
  alarm, no inconsistency surface.
- C2 [high] Vector sync is non-transactional
  (`service/vector/SyncCoordinator.ts:295-336`): per-op best effort; deletes
  racing a batch can orphan vectors; reconcile() is eventual-only.
- C3 [high] Error-handling census across src/service (≈180 catch blocks):
  typed rethrow 7, wrap+rethrow ≈21, swallow-with-log 54, silent swallow 43,
  return-null/false 33. Worst silent sites on real paths: audit insert
  (`repository/sync/SyncRepoAdapter.ts:70-72`), feedback load/save
  (`service/quality/FeedbackCollector.ts:118-147`), search index build
  silently returns empty when the table is missing
  (`service/search/SearchEngine.ts:152-154`). A shared error taxonomy exists
  (`shared/errors/BaseError.ts`) but adoption is inconsistent.
- C4 [medium] Migrations: 8 files with documented gaps (002, 003), per-file
  transactions + INSERT OR IGNORE tracking
  (`infrastructure/database/DatabaseConnection.ts:96-164`); one-way only, no
  re-run/idempotency tests anywhere (see E1).
- C5 [medium] Lifecycle bypass: `KnowledgeService.update()`
  (`service/knowledge/KnowledgeService.ts:268-423`) can set lifecycle fields
  directly without the state-machine transition guard.
- C6 [medium] PathGuard exclusion is configure-time only
  (`shared/PathGuard.ts:131-133`); excluded projects silently redirect the
  db path to tmpdir (`DatabaseConnection.ts:54-63`). SimilarityService walks
  the filesystem with no symlink/depth guard
  (`service/candidate/SimilarityService.ts:51-85`).
- C7 [medium] SQLite `busy_timeout=3000` with WAL
  (`DatabaseConnection.ts:84-87`) — no jitter/backoff policy, no busy
  diagnostics.
- C8 [low] TimerRegistry unrefs timers by default
  (`shared/TimerRegistry.ts:48-49,125-153`); SyncCoordinator leaks its event
  handler if destroy() is missed; no process shutdown hooks for db close.
- C9 [low] `FeedbackCollector.record()` accepts unvalidated ids/data
  (`service/quality/FeedbackCollector.ts:47-60`).

## D. Workflows Layer

- D1 [high] Guidance text duplicated across builders with inconsistent
  framing: "每维度最少 3 条，目标 5 条" in `MissionBriefingBuilder.ts:295`,
  `MissionBriefingSupport.ts:482`, `ColdStartPresenters.ts:245`;
  cross-dimension dedup stated as checklist warning
  (`MissionBriefingBuilder.ts:285`) and as system-enforced rule
  (`:303-307`); local-subpackage and source-annotation rules each duplicated.
  NOTE: this area is being restructured by CKG1 staged SOPs — dedup belongs
  to CKG1's template work, not this demand.
- D2 [medium] Quality gate computed but not enforced:
  `HostAgentSubmissionTracker.buildQualityReport` produces pass:boolean;
  `HostAgentDimensionCompletionWorkflow` returns success unconditionally
  (`:233,:281-310`). Enforcement repair is CKG3 scope; CO records the
  boundary only.
- D3 [medium] host-agent ↔ persistence coupling:
  `BootstrapSession.ts:23` ↔ `WorkflowSnapshotStore.ts:3-4` ↔
  `HostAgentDimensionCompletionWorkflow.ts:6` — persistence knows session
  internals.
- D4 [medium] `workflows/cold-start/` hosts both internal-agent and
  host-agent intents (`ColdStartIntent.ts:43-85`) under one name — easy to
  confuse with the three runtime bootstrap entrypoints.
- D5 [low] EpisodicMemory referenced in comments/type hints in workflows but
  owned elsewhere (`BootstrapSession.ts:10`,
  `bootstrapDimensionConfigs.ts:81`); MemoryStore ownership remains the
  RC0/RC6-flagged open item.
- D6 [low] MissionBriefingBuilder is 1240 lines against Support's 544 with
  fuzzy assembly-vs-template split.

## E. Tests And Gates

- E1 [critical] Zero migration re-run/idempotency tests (grep across test/
  finds none) against a one-way migration runner.
- E2 [high] Near-zero coverage areas by file count: repository/code,
  repository/sync, repository/sourceref, infrastructure/logging,
  service/candidate, service/panorama (contract-only); workflows 58 source
  files vs ~3-4 dedicated suites.
- E3 [high] Main pipeline (`npm run check` = build:check +
  lint:public-api-boundary + test + lint) does NOT include
  `smoke:public-api`, `lint:consumer-core-imports`, or `release:check` —
  consumer drift and packaging regressions ride on manual discipline.
- E4 [medium] 7 `.skip`/`.only` occurrences (SearchPipeline,
  DomainLifecycle, KnowledgeFileWriter, IDEAgentAnalysisPacketBuilder);
  ~258 mock/stub references with heavy gateway mocking; biome disables
  `noExplicitAny` for core/ast, core/discovery, infrastructure/vector,
  service/panorama.
- E5 Validation floor available today: typecheck, build:check,
  lint:public-api-boundary, vitest (1048 tests, thresholds branches 75 /
  functions 75 / lines 80 / statements 80), biome lint, smoke:public-api,
  lint:consumer-core-imports, release:check, plus downstream builds of
  Alembic / AlembicAgent / AlembicPlugin (RC2 floor) and Wakeflow
  verification.

## Cross-Demand Boundary Notes

- RC2 (completed) already restored headless/deterministic Core; not in
  scope here.
- RC6 (pending decision gate) owns converting structural debt into design
  candidates (Core Wave 3B export closeout, MemoryStore ownership, layer
  sinking). Core-specific RC6 outputs should be routed INTO this CO demand
  at controller intake instead of forking a parallel Core track.
- CKG1 owns MissionBriefing/staged-SOP restructuring (D1/D6 area); CKG2 owns
  source-graph lifecycle wiring; CKG3 owns submit/dimension evidence-gate
  enforcement (D2); CKG4 owns the Codex tool surface. CO touches the Core
  package surface and internals those slices stand on, so sequencing and
  facade unification (A2) must be coordinated at intake.
