# AlembicCore Comprehensive Optimization Requirement Design

Status: candidate / user-requested 2026-06-12 / user scope decisions recorded 2026-06-12 / needs controller intake
Date: 2026-06-12
Design Key: alembic-core-comprehensive-optimization
Primary Product Window: AlembicCore
Related Product Windows: Alembic, AlembicAgent, AlembicPlugin (consumers; coordinated bumps only)
Validation Surface: AlembicWorkspace controller; Test only if a real-scenario gap appears

## Problem

AlembicCore is the shared capability engine for four consumers, but its
public surface and internal structure have accumulated drift that makes
interfaces hard to trust and edge behavior hard to predict:

- The package exposes 140 export keys; 98 are transitional (61 wildcard,
  45 of those with no migration target) and 14 curated exports have zero
  external consumers. Four parallel source-graph facades coexist with no
  consumer yet.
- There is no written, enforced layer contract. The de-facto layering is
  mostly clean, but service imports workflows and core, workflows imports
  core, and validator/persistence responsibilities straddle layers.
- Failure semantics are inconsistent: of ≈180 service-layer catch blocks,
  43 swallow errors silently and 33 return null/false; file-first knowledge
  writes can succeed while the DB transaction fails with no alarm; the
  search index silently returns empty when its table is missing.
- Naming overloads (recipe/candidate/entry, dimension-as-key vs
  dimension-as-concept, session vs snapshot) and behavior-switching boolean
  flags make semantics ambiguous at call sites.
- The test floor has holes exactly where risk is highest: zero migration
  re-run tests, near-zero coverage in repository/code|sync|sourceref and
  service/candidate|panorama, and the consumer-import lint plus public-api
  smoke are not wired into the main check pipeline.

Evidence base: [core-audit-findings-2026-06-12.md](core-audit-findings-2026-06-12.md)
(five-agent deep scan at Core `ed42960`, findings A1-E5 with file:line).

## Goal

AlembicCore reaches a state where:

1. The public API surface is intentional: every export key has a consumer or
   a written deprecation path; one canonical facade per capability; the
   boundary gate enforces narrowness and no-growth, and consumer-import
   drift fails loudly in the main pipeline.
2. Layer responsibilities are written and enforced: a documented layer
   contract (what core/domain/service/repository/infrastructure/workflows/
   shared/daemon/types each own, and the allowed import directions) with a
   dependency-direction lint; the four upward imports are either blessed by
   the contract or repaired.
3. Edge behavior is honest: critical-path errors are typed and loud, the
   file/DB write split is observable, lifecycle transitions cannot be
   bypassed, and concurrency/path-safety policies are explicit.
4. Semantics are unambiguous: one glossary for recipe/candidate/entry/
   dimension/session/snapshot used consistently in types and docs; mode
   enums replace behavior-switching boolean flag clusters where confirmed.
5. The validation floor holds the line: migration re-run tests exist,
   near-zero-coverage areas get targeted suites, and the main check pipeline
   includes the consumer/import and smoke gates.

This is a hardening and clarification demand. User-visible product behavior
does not change except where a silent failure becomes a loud, documented
one — and every such change is listed and confirmed before implementation.

## Non-goals

- No new product features and no capability removal. Delete only
  zero-consumer surface with scan + replacement + gate proof (workspace
  external-deletion rule).
- No redo of RC2 headless/deterministic work.
- No source-graph lifecycle wiring (CKG2 owns it) and no
  submit_knowledge/dimension_complete evidence-gate enforcement (CKG3 owns
  it). CO records those boundaries; it does not implement them.
- No MissionBriefing/staged-SOP restructuring or guidance-text dedup — CKG1
  rebuilds that area from the domain SOP baseline; CO must not refactor it
  in parallel.
- No layer-sinking migrations from other repos into Core (RC6 decision-gate
  scope; Core-specific RC6 outputs route into this demand at intake).
- No AlembicPlugin code modifications anywhere in this sequence
  (user-directed 2026-06-12): the Codex host is actively executing the CKG
  sequence in AlembicPlugin. CO leaves stable interfaces for the Plugin and
  defers every Plugin-side import migration to the Plugin window after CKG,
  with owner and trigger recorded.
- No package version bumps or releases without explicit user direction.
- No Dashboard changes (it has zero package imports; it consumes HTTP).

## Current Baseline (verified 2026-06-12, Core `ed42960`)

- Boundary policy and gates exist and pass today: stable=18 /
  provisional=24 / transitional=98 pinned in
  `config/public-api-boundary.json`; `npm run check` = build:check +
  lint:public-api-boundary + vitest (1048 tests) + biome.
- Consumers: 849 imports (Alembic 210, Plugin 185, Agent 54, Dashboard 0);
  top facades logging/workspace/shared/project-intelligence/events/daemon/
  knowledge/host-agent-workflows/search/io.
- Layering is mostly clean (domain isolated; repository→infrastructure and
  service→domain/repository correct); violations are few and specific
  (GuardCheckEngine→AstAnalyzer, ModuleDiscoverer→TargetClassifier,
  ProjectIntelligenceRunner→AstAnalyzer/CallGraphAnalyzer).
- Full findings: [core-audit-findings-2026-06-12.md](core-audit-findings-2026-06-12.md).

## Candidate Demand Sequence

### CO0 - Fact Freeze And Decision Matrix (AlembicWorkspace)

Re-verify the audit at dispatch time and turn it into decisions:

- re-run the consumer-import census and freeze counts (imports move as RC5+
  and CKG land);
- per finding A1-E5: keep / fix-in-CO / route-to-CKG / route-to-RC6 /
  defer-with-owner, in one decision matrix;
- reconcile with RC6 outputs if RC6 has run (Core Wave 3B export closeout,
  MemoryStore ownership, layer sinking) — Core-specific items merge into
  CO1/CO2 scope instead of forking;
- confirm with the user every item that changes visible behavior (silent →
  loud failures list, export removals, busy/backoff policy);
- define the target export-surface shape (which curated keys remain, which
  facadeReadiness groups migrate now vs get owners + triggers);
- verify AlembicPlugin's real consumption routes before any surface change:
  the actual source-graph import path (package specifier versus the vendored
  `vendor/AlembicCore` copy — the two 2026-06-12 scans disagreed on this),
  and freeze the full list of Plugin-consumed specifiers that CO1 must keep
  alive untouched;
- fix numeric targets for CO4 (which areas get suites, threshold handling).

### CO1 - Public API Surface Convergence (AlembicCore)

Producer step — freeze the contract first so later internal work moves
behind a stable surface:

- remove the 14 zero-consumer curated exports after a fresh import scan
  across all four consumer repos (each removal: scan proof + replacement
  facade named + boundary gate updated);
- unify source-graph onto one stable facade Core-side; the domain/service/
  repository variants are deprecated in policy but stay importable until the
  Plugin/CKG side migrates (Codex is actively building on AlembicPlugin);
  the canonical facade is the interface CO leaves ready for CKG2/CKG4;
- execute facadeReadiness migrations for the 16 mapped wildcard groups where
  consumers are ready; for the remaining 45, either map a target or record
  owner + consumer + cleanup trigger per the compatibility rules — no
  unowned transitional surface;
- align with the accepted RC6 SD-5 route (Core Wave 3B export closeout,
  two-phase 98→31): this CO1 wave delivers the SD-5 phase-1 shape —
  deprecate-marks with date + removal release on the 67 zero-consumer
  transitional candidates, review-by dates for the 13 must-keep and 18
  keep-provisional — while the SD-5 phase-2 deletion stays release-aligned
  and gated on the post-CKG AlembicPlugin vendor refresh (vendor lag 24
  commits is an explained state until then);
- upgrade the boundary gate from descriptive to prescriptive: narrowness
  validation (provisional facades must re-export no more than their
  transitional predecessors), trend report on transitional/wildcard counts,
  and shrink-only maxCounts;
- wire `lint:consumer-core-imports` and `smoke:public-api` into the main
  check pipeline (or a justified equivalent gate point);
- consumer import updates land in the same wave for Alembic and AlembicAgent
  only (each owning window commits its own change). AlembicPlugin code is
  not modified: every Plugin-consumed specifier (per the CO0 freeze) stays
  available and behavior-identical as owned transitional surface, owner =
  AlembicPlugin window, trigger = post-CKG migration; the Plugin
  participates in validation through its build/check only.

### CO2 - Layer Contract And Responsibility Repair (AlembicCore)

- write the layer contract (one doc in Core): responsibility of each src
  area and the allowed dependency directions. User-decided 2026-06-12:
  `core/` is blessed as an importable analysis leaf for service/workflows —
  the contract records this and no service-adapter layer is introduced;
- add a dependency-direction lint that enforces the contract and wire it
  into `npm run check`;
- repair the one genuine violation: ModuleDiscoverer→TargetClassifier
  (extract TargetClassifier to a contract-clean location, removing the
  service→workflows direction); GuardCheckEngine→AstAnalyzer and
  ProjectIntelligenceRunner→AstAnalyzer/CallGraphAnalyzer become
  contract-blessed core-leaf imports with written reasons;
- unify the validator entry: one façade over UnifiedValidator +
  RecipeCandidateValidator + CandidateAggregator so callers cannot pick a
  weaker subset by accident (advisory quality scoring stays separate —
  enforcement remains CKG3);
- settle the KnowledgeFileStore (repository) vs KnowledgeFileWriter
  (service) write-strategy boundary;
- close deprecation debris: RecipeReadinessChecker (complete the migration
  or re-document), ProposalType @deprecated (migration status + removal
  condition), ProjectAnalysisCapability alias (consumer scan, then keep with
  owner or remove);
- publish the semantic glossary (recipe / candidate / knowledge entry /
  dimension-as-key vs dimension-as-concept / session vs snapshot) and align
  type names or add clarifying doc comments where renames are too invasive —
  renames that touch public API require CO0-confirmed scope;
- replace confirmed boolean-flag clusters (ColdStartIntent skip flags) with
  explicit mode types where CO0 confirms the change is internal-only.

### CO3 - Failure Semantics And Edge-Case Hardening (AlembicCore)

Scope is the CO0-confirmed list under the user-decided posture
(2026-06-12): **write strict, read tolerant** — write-path integrity
failures become typed errors; read paths stay usable but never silently
lie.

- write-path integrity becomes typed errors: audit insert failure
  (SyncRepoAdapter), knowledge files persisted while the DB transaction
  failed (KnowledgeUnitOfWork), lifecycle-transition bypass
  (KnowledgeService.update), FeedbackCollector save loss;
- read paths degrade visibly: SearchEngine.buildIndex on a missing table
  returns a visibly degraded result with a stable diagnostic reason instead
  of a silent empty list; FeedbackCollector load failures surface a
  diagnostic;
- file/DB consistency: KnowledgeUnitOfWork records and surfaces a
  files-persisted-but-db-failed state (diagnostic event + reconciliation
  visibility), instead of waiting silently for SyncService;
- vector sync: define orphan-vector behavior (transactional batch or
  explicit reconcile contract with diagnostics);
- lifecycle integrity: KnowledgeService.update routes lifecycle changes
  through the transition guard; direct bypass becomes a typed error;
- path safety: PathGuard exclusion re-check policy (configure-time staleness
  documented or runtime re-check added), SimilarityService filesystem walk
  gains symlink/depth guards;
- concurrency policy: document SQLite busy_timeout/WAL stance and add busy
  diagnostics (backoff only if CO0 confirms);
- error taxonomy adoption: critical paths use `shared/errors` types
  consistently; the catch-block census (7/21/54/43/33) is re-measured and
  the silent class shrinks to an agreed floor on critical paths;
- every change here preserves data structures and API shapes; semantics
  changes are exactly the CO0-confirmed visible-failure list.

### CO4 - Test And Gate Floor Closure (AlembicCore)

- migration re-run/idempotency tests (fresh db, re-run all, gap files 002/
  003 documented in-runner);
- targeted suites for repository/code, repository/sync,
  repository/sourceref, service/candidate, service/panorama,
  infrastructure/logging, and the weakest workflows paths (CO0 fixes the
  exact list and counts);
- resolve the 7 `.skip`/`.only` occurrences (re-enable, rewrite, or delete
  with reason);
- coverage thresholds hold or rise; no threshold lowering;
- biome `noExplicitAny` override shrink plan for core/ast, core/discovery,
  infrastructure/vector, service/panorama (execute where cheap, otherwise
  owner + trigger);
- pipeline wiring from CO1/CO2 (consumer-import lint, smoke, dependency
  lint) verified as blocking gates with demonstrated failures.

### CO5 - Final Acceptance And Archive (AlembicWorkspace)

- full gate set green: typecheck, build:check, lint:public-api-boundary
  (new prescriptive mode), vitest, biome, smoke:public-api,
  lint:consumer-core-imports, dependency-direction lint, release:check;
- downstream builds green: Alembic, AlembicAgent, AlembicPlugin (and
  Dashboard `npm run check` as participation);
- controller reviews raw diffs, demonstrated gate failures, census deltas
  (export counts, catch-block classes, coverage), and the decision matrix
  closure; archives the sequence to the ledger.

## Producer/Consumer Order

CO0 → CO1 (contract freeze, consumer-coordinated) → CO2 (internal layering
behind the frozen surface) → CO3 (edge semantics on the clarified
structure) → CO4 (floor closure; partly parallel with CO3 at controller
discretion) → CO5. CO1 is the only step that touches consumer repos — only
Alembic and AlembicAgent, and only for import-path updates.

Parallel-execution constraint (user-directed 2026-06-12): the CKG sequence
is being executed by the Codex host in AlembicPlugin while CO runs in this
workspace. CO therefore proceeds now on AlembicCore (plus Alembic and
AlembicAgent import updates), never edits AlembicPlugin, and leaves the
converged public surface as the ready interface for the Plugin/CKG side to
adopt after CKG completes.

## Completion Definition

- Every package export key is classified with a consumer or an owner +
  cleanup trigger; zero-consumer curated exports are gone; source-graph has
  one canonical facade; transitional/wildcard counts are on a shrink-only
  gate with trend reporting.
- A written layer contract exists and a dependency-direction lint enforces
  it in the main pipeline; the audited upward imports are repaired or
  contract-blessed with reasons.
- The CO0-confirmed silent-failure list is eliminated on critical paths:
  typed errors or diagnostic events with stable reasons; file/DB divergence
  is observable; lifecycle transitions cannot bypass the guard.
- The semantic glossary is published and reflected in types/docs; confirmed
  flag clusters are mode types.
- Migration re-run tests exist; the named near-zero-coverage areas have
  real suites; no `.skip`/`.only` remains without a written reason; main
  check pipeline includes consumer-import, smoke, and dependency lints.
- All gates and downstream builds green; controller acceptance from raw
  evidence; sequence archived.

## Validation Requirements

- Per-demand: the full Core floor (typecheck, build:check,
  lint:public-api-boundary, vitest 1048+, biome) plus the gates that demand
  introduces, each with at least one demonstrated failure case.
- CO1 additionally: fresh cross-repo import scans before/after, downstream
  builds of all three package consumers.
- CO3 additionally: negative tests for each remediated silent path and for
  lifecycle bypass; diagnostics visible in logs/events with stable codes.
- CO5: the complete matrix above plus Wakeflow verification.

## Stop Conditions

- A removal candidate turns out to have any consumer (code, script, test,
  or published surface) — stop that item, record, route to decision.
- A change would alter user-visible behavior beyond the CO0-confirmed
  visible-failure list — pending user decision.
- Transitional/wildcard counts would grow, a coverage threshold would drop,
  or a gate must be weakened to pass — stop and surface.
- A conflict emerges with CKG1/CKG2/CKG3/CKG4 scope or an RC6 decision —
  stop that item and reconcile at controller level.
- Any target returns prose-only evidence without diffs, scan output, and
  gate logs.

## Decisions

Resolved by user confirmation on 2026-06-12:

- Sequencing and territory: CO proceeds now, in parallel with the Codex host
  executing CKG in AlembicPlugin. CO never modifies AlembicPlugin; consumer
  import updates cover Alembic and AlembicAgent only; the converged surface
  is left as the ready interface for the Plugin/CKG side to adopt after CKG.
- Failure-semantics posture (CO3): write strict, read tolerant — write-path
  integrity failures (audit insert, file/DB divergence, lifecycle bypass,
  feedback save) become typed errors; read paths (search index missing,
  feedback load) stay usable but return visibly degraded results with
  stable diagnostic reasons, never silent emptiness.
- Layer ruling (CO2): `core/` is blessed as an importable analysis leaf; no
  service-adapter layer; the only direction repair is
  ModuleDiscoverer→TargetClassifier.
- CO1 packaging: one wave (after the CO0 re-scan), covering removals,
  source-graph facade unification, mapped migrations, and
  Alembic/AlembicAgent import updates together.

Remaining for controller intake:

- Whether CO4 runs partly parallel to CO3 or strictly after (same-window
  packaging decision).
- RC6 has produced its decision register
  (`../alembic-redundancy-stale-logic-cleanup/rc6-structural-debt-decisions-2026-06-12.md`):
  the proposed mapping is SD-5 phase 1 merged into the CO1 wave and SD-5
  phase 2 kept release-aligned after the post-CKG Plugin vendor refresh;
  SD-1 phase 2 (Core sinking) stays outside CO and sequenced after SD-5
  closeout. Intake must confirm or amend this mapping.
- The exact CO3 item list — CO0 confirms items within the decided
  write-strict/read-tolerant posture.
