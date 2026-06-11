# Alembic Main Repository Comprehensive Optimization Requirement Design

Status: candidate / user-requested 2026-06-12 / repo-internal scope / needs controller intake
Date: 2026-06-12
Design Key: alembic-main-comprehensive-optimization
Primary Product Window: Alembic
Validation Surface: AlembicWorkspace controller; Test only if a real-scenario gap appears

## Problem

The Alembic main repository (daemon, HTTP provider API, resident MCP
surface, CLI) is structurally clean — the layer graph is acyclic and the
HTTP route registry matches reality — but its quality drifts in four ways
(evidence: [main-audit-findings-2026-06-12.md](main-audit-findings-2026-06-12.md)):

- Owned surfaces are unevenly hardened: 14 of 31 HTTP routes accept raw
  bodies; `/api-spec` and `/health` live outside the route registry; the
  resident tool handlers have no registry; three gateway mappings are
  closures that cannot be statically audited.
- Failure semantics are inconsistent: 40% of ~278 catch blocks swallow
  silently; the central problem taxonomy is used by only ~6 of 46 route
  files; routes mix `200 + success:false` and AI-fallback
  `200 + success:true`; a missing permission manager silently grants full
  access; a daemon job can look queued while its async execution already
  died.
- Semantics are overloaded: session/job/search mean different things per
  area; `HostIntentContext` switches between three compatibility modes by
  input presence; mode flags have no taxonomy; "deprecated" carries three
  causes with no reason field.
- The validation floor has the wrong shape: tests are not part of
  `npm run check`; auth/cancellation/wrong-scope negatives are missing;
  `build-dashboard` is wired nowhere (RC6 SD-2 unfulfilled); the
  escape-hatch count is capped at 75 but never surfaced.

## Goal

1. Every owned surface is uniformly contracted: all HTTP routes
   schema-validated, the route registry complete, problem-taxonomy adopted
   at boundaries with honest status codes, resident handlers registered,
   gateway mappings statically auditable.
2. Failure semantics follow the same posture as the Core demand (write
   strict, read tolerant): integrity failures are typed errors, degraded
   reads are visible, the permission fallback fails closed, job state never
   lies.
3. Semantics are unambiguous: one glossary for session/job/search/tool,
   explicit modes instead of presence-switched behavior, owned compatibility
   paths with consumer + cleanup trigger.
4. The validation floor holds: tests join the main check pipeline, the
   missing negative suites exist, build-dashboard is a wired gate (SD-2),
   and the escape-hatch count is visible and ratcheted.

Repo-internal only. No new product features. User-visible behavior changes
are limited to the AO0-confirmed list (security fail-closed and
status-code honesty are the expected entries).

## Non-goals

- No `@alembic/core` import-path changes (CO1's coordinated wave owns
  those).
- No changes to the shared-asset manifest/drift gate (RC5/RC7 output).
- No resident MCP tool schema changes without explicit AO0 confirmation
  (externally visible to IDE/external agents).
- No cross-repo interface negotiation — a separate interface-alignment
  demand is planned after CO + AO + AG + CKG complete.
- No AlembicPlugin or Dashboard-source edits; no version bumps or releases
  without user direction.

## Candidate Demand Sequence

### AO0 - Fact Freeze And Decision Matrix (AlembicWorkspace)

- re-verify the audit findings A1-D6 at dispatch time; freeze counts;
- user confirmations: the silent→loud list under the write-strict/
  read-tolerant posture (carried over from the Core demand decision); the
  permission-fallback fail-closed change; the status-code honesty change
  (no `200+success:false`); whether any resident tool schema item may be
  touched;
- confirm SD-2 absorption (build-dashboard wiring) into AO4;
- fix AO4 numeric targets and the AO1 route-validation closure list.

### AO1 - Owned Surface Convergence (Alembic)

- zod validation on all 31 HTTP routes (close the 14 raw routes);
- route registry completeness: `/api-spec` and `/health` represented (or
  their exclusion documented in the registry itself);
- problem-taxonomy adoption at HTTP boundaries: routes use
  `problemFromError()`/problem objects with honest status codes; the
  `200+success:false` and silent-AI-fallback patterns are eliminated per
  the AO0-confirmed list;
- resident tool handler registry (single wiring point), gateway resolver
  closures replaced by statically auditable declarations;
- contract doc generation verified against the completed registry.

### AO2 - Internal Responsibility And Semantics (Alembic)

- resolve the `lib/repository` vestige: complete the pattern or fold
  AuditRepository where it belongs, with the db-isolation lint updated;
- publish the semantic glossary (session/job/search/tool, MCP tool vs
  adapter) and align names or add clarifying doc comments;
- `HostIntentContext`: explicit mode type instead of input-presence
  switching; the legacy-args path gets owner, consumer, and cleanup
  trigger or a removal plan (pending confirmation if removal);
- mode-flag taxonomy (actualMode/degradedMode/hookMode/runtimeMode/
  legacy-fallback) documented; internal-only flags become typed modes;
- "deprecated" lifecycle cause: add a reason field or document the三 causes
  (internal representation only unless AO0 confirms a visible change).

### AO3 - Failure Semantics And Edge Hardening (Alembic)

Posture: write strict, read tolerant (same as Core demand).

- permission fallback fails closed with a typed error and an audit log
  entry (security fix; AO0-confirmed);
- daemon job state truth: async failure after enqueue transitions the job
  record; job display snapshot staleness is marked;
- file-monitor change handling serialized with an idempotency token;
  daemon lock claim gets bounded retry with backoff;
- knowledge batch submit: entry/tracker consistency — tracker updated on
  the persistence path, quality scoring stays best-effort but visible;
- silent-swallow remediation on critical paths per the AO0 list; realtime
  broadcast failures surface a diagnostic;
- HTTP shutdown coordinates in-flight jobs and SSE streams; path-traversal
  refinement on file-touching routes; resident tool args validated.

### AO4 - Test And Gate Floor Closure (Alembic)

- tests join the main check pipeline (or a justified equivalent gate
  point) — `check` without tests is the current defect;
- new negative suites: HTTP auth 401/403, job cancellation, wrong project
  scope, resident tool arg validation;
- SD-2 execution: `build:dashboard` wired into release staging with a
  demonstrated stale-detection failure, source resolution unified, the
  Alembic vendor-refresh flow documented (mirroring RC4's plugin flow);
  submodule kept;
- escape-hatch count surfaced in check output and ratcheted (shrink-only);
- CLI and project-scope suites; coverage thresholds held or raised.

### AO5 - Final Acceptance And Archive (AlembicWorkspace)

- full gate set green: typecheck, biome, all boundary/drift lints, unit +
  integration + coverage, build-dashboard gate, escape-hatch report;
- controller reviews raw diffs, demonstrated gate failures, catch-census
  delta, and the AO0 matrix closure; archives the sequence.

## Producer/Consumer Order

AO0 → AO1 (surfaces) → AO2 (semantics) → AO3 (edge hardening) → AO4
(floor closure) → AO5. Single-window execution (Alembic) after AO0; no
other repo is modified.

## Completion Definition

- All 31 routes schema-validated; registry complete; problem taxonomy at
  every HTTP boundary with honest status codes; resident handlers
  registered; gateway statically auditable.
- The AO0-confirmed silent-failure list eliminated; permission fallback
  fail-closed with audit logging; job records never lie about execution
  state; monitor/lock concurrency policies explicit and tested.
- Glossary published; presence-switched behavior replaced by explicit
  modes; every compatibility path has owner + consumer + trigger.
- Tests in the main check; the named negative suites exist; build-dashboard
  gate wired with demonstrated failure; escape-hatch count visible and
  shrink-only; thresholds held.
- All gates green; controller acceptance from raw evidence; archived.

## Validation Requirements

Per demand: typecheck, biome lint, lint:agent-extraction-boundary,
lint:core-import-boundary, lint:consumer-core-imports,
check:shared-asset-drift, test:unit + test:integration + coverage — plus
each newly introduced gate with one demonstrated failure. AO5 adds Wakeflow
verification.

## Stop Conditions

- A change would alter user-visible behavior beyond the AO0-confirmed
  list (including any resident tool schema change).
- A "raw" route turns out to have a consumer depending on non-validated
  permissive parsing — record and decide, do not silently break.
- Coverage thresholds would drop, the escape-hatch count would grow, or a
  gate must be weakened to pass.
- Any step would require editing another repository — stop and route
  (interface-alignment demand or CO).
- Prose-only evidence without diffs, scans, and gate logs.

## Decisions And Open Items

Adopted from the user's 2026-06-12 decisions on the Core demand (same
logic requested): write-strict/read-tolerant posture; single-wave
packaging per demand; Plugin hands-off globally; version bumps stay
user-directed.

For AO0 confirmation: the exact silent→loud list; permission fail-closed
(recommended yes — security); status-code honesty (recommended yes);
resident tool schema touch list (default: none); SD-2 absorption
(recommended yes); HostIntentContext legacy path retire-vs-own.
