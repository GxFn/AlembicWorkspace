# Alembic Main Repository Audit Findings

Status: evidence base / Design-window three-agent deep scan
Date: 2026-06-12
Audited Head: Alembic `1bd60af` (clean tree)
Design Key: alembic-main-comprehensive-optimization

Three parallel read-only scans: owned surfaces & layering, edge cases &
failure semantics, tests & gates. Counts are audit-time approximations; AO0
re-freezes them.

## Repository Shape

- `lib/` 206 TS files: http 46f/14.1k, service 27f/14.2k, workflows
  25f/9.8k, resident 20f/7.3k, daemon 10f/5.3k, tools 21f/3.6k, injection
  12f/2.5k, infrastructure 12f/2k, cli 4f/1.6k, governance 5f/1.2k, sandbox
  7f/0.9k, shared 4f/1.3k, project-scope 2f/0.8k, repository 1f/0.3k,
  types, platform. ~238 test files (~1178 cases), thresholds 75/75/80/80.
- Owned surfaces: HTTP API (31 REST routes, 32 mounts, registry
  `lib/http/provider-contracts.ts` accurate), resident MCP tool surface
  (17 tools, `lib/resident/tool-schema/tools.ts`, gateway map), CLI (4
  service-backed commands), daemon job kinds (bootstrap/rescan via Core).
- Layering is acyclic and clean: no service→resident, no http→workflows,
  no daemon→http imports; injection is the hub.

## A. Owned Surfaces

- A1 [high] Route validation asymmetry: 17/31 routes use zod `validate()`;
  14 routes take raw bodies (auth, logs, audit, health, violations,
  file-changes, extract, commands, skills, recipes, wiki, evolution,
  intent-episodes, signals-residual). Drift and malformed-input risk
  concentrates exactly where validation is absent.
- A2 [high] `/api-spec` and `/health` are mounted in `HttpServer.ts:262,267`
  but absent from `ALEMBIC_PROVIDER_ROUTE_MOUNTS`
  (provider-contracts.ts:514) — contract tooling that trusts the registry
  misses them.
- A3 [med] Resident tool handlers (15 files) have no barrel/registry; only
  2 are reused by HTTP routes; new handlers need manual wiring — orphan and
  duplicate-logic risk.
- A4 [med] 3 of the gateway mappings are resolver closures
  (tools.ts:199-238; wiki/guard/skill) — gating behavior is not statically
  auditable.
- A5 [low] Two meanings of "tool": MCP tools (resident) vs external-system
  adapters (`lib/tools/adapters`) — confusion risk at Plugin-facing docs.

## B. Internal Responsibility And Semantics

- B1 [med] `lib/repository/` is a vestige: one file (AuditRepository.ts,
  327 lines); the repository pattern exists nowhere else; db isolation is
  enforced by lint, not structure.
- B2 [med] Naming overloads: session (bootstrap session / intent episode /
  decision-register key), job (daemon job / intent task / bootstrap task),
  search split three ways (resident handler mode switching vs
  IntentSearchPlan scenarios vs workflow SearchIntent).
- B3 [med] `HostIntentContext.ts:60-67` carries a three-mode dual path
  (host-intent-frame / mixed / legacy-args-only) switched implicitly by
  input presence — no explicit mode, no recorded consumer/cleanup trigger
  for the legacy path.
- B4 [low] Mode-flag zoo: actualMode, degradedMode, hookMode, runtimeMode,
  'legacy-fallback' search mode — no unified taxonomy.
- B5 [low] Knowledge lifecycle has 6 states but "deprecated" carries three
  distinct causes (obsolete / user-rejected / decay) with no substate or
  reason field (knowledge.ts:154,276).

## C. Edge Cases And Failure Semantics

- C1 [high][security] Permission fallback silently grants full access:
  `lib/http/routes/knowledge.ts:67-69` — missing `permissionManager` is
  caught and swallowed; the route proceeds as authorized, no audit log.
- C2 [high] Daemon job enqueue is fire-and-forget:
  `lib/daemon/DaemonJobRunner.ts:137` — async failure after enqueue logs
  but does not transition the job record; a job can look queued/running
  while it already died.
- C3 [high] Catch census (≈278 blocks across service/daemon/http/
  workflows): typed 15 / wrap 40 / log 80 / silent 110 (40%) / null 33.
  Central `problem-taxonomy.ts` exists but only ~6 of 46 route files call
  `problemFromError()`; several routes return HTTP 200 with
  `{success:false}` or AI-fallback `{success:true}` (extract.ts:104,153),
  mixing success semantics.
- C4 [med] File monitor dispatches `handleFileChanges()` without
  serialization (DaemonFileChangeCollector.ts:275-286) — overlapping
  evolution proposals on rapid changes, no idempotency token.
- C5 [med] Daemon lock claim race: EEXIST retry vs staleness check
  (DaemonSupervisor.ts:224-235), unbounded loop, no backoff/jitter.
- C6 [med] Knowledge batch submit: entry persisted, quality update
  best-effort, tracker only updated on the quality-success path
  (resident/tool-handlers/knowledge.ts:310-328) — inconsistent
  entry-vs-tracker state.
- C7 [low] HTTP shutdown does not coordinate in-flight daemon jobs or SSE
  streams (HttpServer.ts:537-550); realtime broadcast failures are silently
  swallowed (JobProcessEventRecorder.ts:166).
- C8 [low] No explicit path-traversal refinement on file-touching command
  routes; resident tool args bypass zod (handlers validate ad hoc).

## D. Tests And Gates

- D1 [high] `npm run check` = typecheck + lint + 4 boundary/drift gates —
  **tests are not part of the main check pipeline** (unit/integration run
  separately).
- D2 [med] `build-dashboard.mjs` is not wired into check, and
  `prepare-publish-staging.mjs` copies dashboard/dist without invoking the
  build — RC6 SD-2's "wire/verify in release staging with demonstrated
  stale-detection failure" is unfulfilled.
- D3 [med] No HTTP auth negative tests (no 401/403 coverage found); job
  cancellation paths effectively untested; project-scope (2 files) has no
  wrong-scope negative tests; CLI (4 files) untested.
- D4 [med] lint-repo-boundary escape-hatch threshold is 75 but the current
  count is not surfaced in check output — drift invisible.
- D5 [low] Mock density ~43% of unit files on Core boundary; zero snapshot
  tests (procedural only).
- D6 Validation floor today: typecheck, biome lint,
  lint:agent-extraction-boundary, lint:core-import-boundary,
  lint:consumer-core-imports, check:shared-asset-drift, test:unit (~926),
  test:integration (~252), coverage 75/75/80/80.

## Cross-Demand Boundary Notes

- RC1/RC5/RC7 outputs (AGENTS.md alignment, shared-asset manifest + strict
  drift gate) are done — not re-opened; the drift gate stays untouched.
- RC6 SD-2 (Dashboard artifact pipeline, accepted small Alembic demand)
  fits AO4 — proposed absorption at intake.
- Core package import paths are CO1's wave — AO does not move
  `@alembic/core` specifiers.
- Resident MCP tool schema changes are externally visible (IDE/external
  agents) — any schema change needs AO0 confirmation.
- A future cross-repo interface-alignment demand (after CO + AO + AG + CKG)
  owns all cross-repo surface negotiation; AO stays repo-internal.
