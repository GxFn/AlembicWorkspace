# AlembicCore Comprehensive Optimization — Final Acceptance Archive

Date: 2026-06-12
Controller: AlembicWorkspace (claude-code host)
Sequence: `alembic-core-comprehensive-optimization` (CO0-CO5)
Status: COMPLETED with controller acceptance per demand and a final CO5 gate
matrix; open decisions are registered below, none block closure.

## 1. Per-Demand Acceptance Table

| Demand | State root rev | Accept / complete events | Commit(s) | Substance |
| --- | --- | --- | --- | --- |
| CO0 fact freeze + decision matrix | 5 (completed) | evt-20260611180606-0004 / evt-20260611180617-0005 | none (controller window) | Census frozen (Alembic 404/122, Agent 54/0, Plugin 387/157, Dashboard 0); 14/14 zero-consumer exports re-verified; Plugin file:-link keep-alive constraint frozen; A1-E5 decision matrix; USER GATE: 14 removals + 7 silent-to-loud items approved (write-strict/read-tolerant), C7 docs+diagnostics only. |
| CO1 public API surface convergence | 10 (completed) | p1 tc-20260611184158-0004; p2 tc-20260611211947-0009; complete evt-20260611212007-0010 | Core `4f7abf6`; Alembic `d58e4a3` | 14 removals (curated 140→126); single canonical source-graph facade with resurrection gating; 61 wildcard groups mapped/owned; SD-5 phase-1 deprecate-marks (67 dated, removalRelease 0.3.0, review-by 2026-09-12); prescriptive boundary gate + consumer-lint + smoke BLOCKING with demonstrated failures; p2 migrated the last scanner-visible transitional consumer ref onto the stable `@alembic/core/database` facade with allowlist shrink + regression-impossible demo; p3 dissolved (Agent zero transitional refs, controller-re-verified). |
| CO2 layer contract + responsibility repair | 6 (completed) | evt-20260611191439-0005 / evt-20260611191457-0006 | Core `215e7a4` | Written layer contract + semantic glossary; dependency lint BLOCKING (FAIL demo); ModuleDiscoverer→TargetClassifier extraction (0 deep consumers); validateCandidatesUnified façade (3 equivalence tests); B7 closed; B6 deferred on export-reachability proof; lint caught a second audit-missed inversion (PanoramaScanner→ProjectIntelligenceRunner) → exact-edge allowlisted exception + TODO. |
| CO3 failure semantics + edge hardening | 6 (completed) | tc-20260611201317-0004 / evt-20260611201350-0006 | Core `f8c45d0` | All seven user-approved silent-to-loud items (W1/W2/W4 PersistenceError/DivergenceError, W3 lifecycle-bypass ValidationError, R1/R2 degraded-but-usable with stable reasons, V1 explicit reconcile contract; transactional batch correctly rejected per STOP rule); C6 symlink/depth guards; C7 docs+busy-diagnostics only; C8 listener/timer hygiene (real `knowledge:deleted` leak fixed); C9 input validation; 11 stable diagnostic codes centralized; facade pinned to the original 7 error classes; 17 negative tests; census silent 80→72 (method script; controller re-run byte-identical). Delivery-loss incident recovered (see §5). |
| CO4 test + gate floor closure | 6 (completed) | tc-20260611204714-0004 / evt-20260611204752-0006 | Core `c73d5c4` | 65 new real-behavior tests / 8 suites, all above CO0 §5 minimums (migrations 6 incl. 002/003 gap tolerance + partial-failure recovery on fresh DBs); vitest 1068→1133; 4 gate-blocking proofs (induced exit-1 + clean revert; consumer gate proven at mechanism level via scratch fixture); infrastructure/vector noExplicitAny override removed, remaining dirs owned in docs/lint-debt.md; skip/only falsification re-confirmed (0 modifiers); REAL DEFECT found and repaired in-package: getStaleCountsByRecipe whole-table totalCount (see §4); coverage thresholds proven never-runnable (see §6). |
| CO5 final acceptance + archive | this demand | this document | none (controller window) | Final gate matrix, census deltas, decision-matrix closure, archive, Wakeflow verification. |

## 2. Final Gate Matrix (fresh runs, 2026-06-12, raw logs in the CO5 state root `evidence/raw/`)

| Gate | Target state | Result |
| --- | --- | --- |
| AlembicCore `npm run check` (typecheck, prescriptive public-api boundary, layer contract, consumer-core-imports, smoke, vitest, biome) | `c73d5c4` | exit 0; 1133/1133 tests (95 files); boundary 126 exports, transitional ≤98, wildcard ≤61; layer 367 edges OK; consumer gate 0 issues ×3 repos; smoke 65 entrypoints |
| AlembicCore `npm run release:check` | `c73d5c4` | exit 0 on clean tree (`@alembic/core@0.2.0`, pack 814 entries). First run exit 1 only because the user-local uncommitted `.claude/settings.json` permission seed dirties the tree; stash → green → restored. |
| Alembic `npm run build` | `d58e4a3` | exit 0 (full check evidence from the CO1 p2 run on the same HEAD: unit 137 files, integration 40, coverage 3, drift gate strict 11/0/0, CHECK_EXIT=0) |
| AlembicAgent `npm run check` | `35901cf` (AG-sequence live HEAD) | exit 0 |
| AlembicPlugin `npm run build` | `838da9e` (CKG-sequence live HEAD) | exit 0 |
| AlembicDashboard `npm run check` (participation) | `11c2c61` | exit 0; zero code diff from this sequence |

## 3. Census Deltas vs the CO0 Frozen Targets

| Metric | CO0 baseline | Final | Verdict |
| --- | --- | --- | --- |
| Curated package export keys | 140 | 126 (exact 65 + wildcard 61) | 14 user-approved removals executed; shrink-only maxCounts live |
| Transitional exports | 98 | ≤98 enforced, SD-5 phase-1 marks on 67 zero-consumer candidates (phase-2 deletion release-aligned post-CKG) | on the accepted two-phase path |
| Wildcard export groups | 61 (37 unmapped) | 61, every group mapped or owned (owner+consumer+trigger); Plugin keep-alive 37/37 import-proven | met |
| Service-layer silent catch sites | 80 (audit approx. 43 by a different method) | 72; every named critical site left the silent class (typed errors / stable-reason diagnostics) | met for the user-confirmed scope; remaining 72 are non-critical scanners (future demand candidates) |
| Core vitest | 1048 (sequence start) | 1133 (CO2 +3, CO3 +17, CO4 +65) | met; CO0 §5 per-area minimums all exceeded |
| Coverage (stmts/branch/funcs/lines) | 44.72 / 37.39 / 48.37 / 45.18 (first-ever real measurement at CO4) | 45.50 / 38.06 / 49.74 / 45.95 | every metric improved; enforcement decision PENDING USER (§6) |
| Consumer import hygiene | Alembic transitional 1 visible (+1 multi-line invisible), Agent 0, Plugin 19 allowlisted | Alembic 0 visible / 1 true (allowlisted drizzle, limit 3, named consumer); Agent 0 true; Plugin unchanged (CKG-frozen, its own allowlist green) | met under the controller true census; scanner blind spot routed (§4) |
| noExplicitAny overrides | 4 dirs | 3 dirs (vector removed + fixed); core/ast 918 / discovery 13 / panorama 1 owned in docs/lint-debt.md | met per CO0 §5 (cheapest dir executed, rest owner+trigger) |

## 4. Findings Discovered DURING the Sequence (all dispositioned)

1. **Real data defect repaired (CO4)**: `RecipeSourceRefRepository.getStaleCountsByRecipe`
   correlated subquery bound the outer table reference to the inner alias →
   `totalCount` silently reported whole-table counts; consumers
   SourceRefReconciler (`staleRatio = stale/total` — rescan signals were being
   suppressed by the inflated denominator) and KnowledgeRescanPlanner.
   Rewritten as two grouped queries, same signature/shape, regression test
   pinned (old code fails 3-vs-2). Controller verified both consumers.
2. **Consumer-lint scanner multi-line blind spot (CO1 p2)**: import statements
   split across lines are invisible to byStatus counters and referenceLimits.
   Controller true census (from-line grep + policy classifier): Alembic 1
   allowlisted transitional ref (DrizzleORM integration test, ≤ limit 3),
   Agent 0, Plugin drizzle true=4 vs limit=1 — shipping the regex fix now
   would redden the pipeline on the CKG-frozen Plugin config. → TODO
   `CO1-SCANNER-MULTILINE-BLIND-SPOT` (owner AlembicCore + consumer windows,
   trigger post-CKG reconciliation wave; folds 7 zero-usage allowlist rows +
   the dead `frozenMaxOccurrences` field verdict).
3. **Second layer inversion (CO2)**: PanoramaScanner→ProjectIntelligenceRunner
   dynamic import, audit-missed, caught by the new lint → compliant
   exact-edge exception + TODO `CO2-PANORAMA-RUNNER-INVERSION` (user-confirmed
   repair wave).
4. **CO3 taxonomy facade decision**: PersistenceError/DivergenceError stay off
   the `./shared` facade (narrowness budget pinned at the original 7 classes);
   external consumers match BaseError + stable codes. → TODO
   `CO3-TAXONOMY-FACADE-PROMOTION` (future export-surface wave).
5. **batchInsertIgnore returned-count semantics (CO4)**: returns
   processed-entity count, not inserted count; single consumer ignores the
   value; behavior documented by a floor test that fails if semantics change.
   Not a defect today; becomes one only if a consumer starts reading it.

## 5. Incidents And Lessons

- **CO3 delivery loss (2026-06-12 03:17-03:20 local)**: the workspace tmux
  windows were rebuilt by the user moments after the CO3 send was
  submission-confirmed; the executing session died before any repository
  work. Recovery followed the RC3 lost-send playbook: repo verified clean,
  stale lock released, UNCHANGED envelope re-sent under the same delivery id,
  execution-confirmed readback, watcher restarted with `--state-root`.
  Evidence: CO3 state root `evidence/controller-resend-note-2026-06-12.md`.
  Standing gaps re-confirmed: `wakeflow_record_delivery` lacks a retry-run-id
  parameter (governance backlog).
- **release:check vs local permission seeds**: the user-local uncommitted
  `.claude/settings.json` in each repo makes `release:check` fail on
  dirty-tree; the gate is correct, the file is intentional local config.
  Releases must stash/exclude it; recorded here so future release waves are
  not surprised.
- Watchers must always pass `--state-root` (RC-era lesson, held all sequence).

## 6. Open Decisions Register (none block closure; owners assigned)

| Decision | Owner | Status |
| --- | --- | --- |
| Coverage enforcement strategy: configured 75/75/80/80 thresholds were NEVER runnable (provider absent, `--coverage` never wired); real ~45.5/38.1/49.7/46.0. Options: honest enforceable baseline + shrink-only ratchet (requires user approval to lower configured numbers), dedicated coverage waves to the configured bar, or status quo unwired. | USER (TODO `CO4-COVERAGE-ENFORCEMENT-DECISION`, P2) | PENDING USER |
| Consumer-lint multi-line scanner fix + referenceLimits recalibration + allowlist shrink + frozenMaxOccurrences verdict | AlembicCore + consumer windows (TODO `CO1-SCANNER-MULTILINE-BLIND-SPOT`, P2) | post-CKG reconciliation wave |
| PersistenceError/DivergenceError facade promotion | controller/future export-surface wave (TODO `CO3-TAXONOMY-FACADE-PROMOTION`, P3) | open |
| PanoramaScanner→ProjectIntelligenceRunner inversion repair | AlembicCore (TODO `CO2-PANORAMA-RUNNER-INVERSION`, P3) | user-confirmed repair wave |
| Plugin-side migrations (deep imports, source-graph facade adoption, SD-5 phase-2 deletion, vendor refresh) | AlembicPlugin window | post-CKG, per the CO0 A5 deferral and RC6 SD-5 phase-2 route |
| Consumer-gate true sibling violation drill | AlembicAgent (TODO `CO4-CONSUMER-GATE-SIBLING-DRILL`, P4) | optional, AG-sequence slot |

## 7. Sequence-Final Commits

- AlembicCore: `4f7abf6` (CO1) → `215e7a4` (CO2) → `f8c45d0` (CO3) → `c73d5c4` (CO4)
- Alembic: `d58e4a3` (CO1 p2, on the user's AO4 baseline `a7dea7e`)
- AlembicAgent: no sequence commits (p3 dissolved on evidence)
- AlembicDashboard: zero sequence diff (`11c2c61`)
- AlembicPlugin: untouched by this sequence (CKG hands-off honored)
