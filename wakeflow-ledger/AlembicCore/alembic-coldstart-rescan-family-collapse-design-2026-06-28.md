# Cold-start / Knowledge-rescan family collapse — grounded design

> Scope: collapse the two structurally-twin workflow families in **AlembicCore**
> (`src/workflows/cold-start/*` and `src/workflows/knowledge-rescan/*`) into one
> mode-parameterized "project-index" family, INDEX vocabulary (`full` |
> `incremental`). Behavior refactor + R1-protected name (`ColdStartWorkflow`).
> Persisted/contract literals stay FROZEN. Lands AFTER CG-3 (coverage-ledger-write
> sink) and the mainbody-realverify-followup waves; hot-zone, respect merge-churn.

---

## 0. CRITICAL SCOPE CORRECTION (read first)

The prompt frames "two structurally-twin workflow FAMILIES" with an
`intent build → plan build → execution/step list → presenter/output` pipeline,
implying the **execution/step list lives in Core**. It does NOT.

**Grounded fact: AlembicCore owns only the data + projection halves of each
family — intent factory, plan builder, dimension selector, and presenter
functions. The actual end-to-end orchestration (the step list: resolve intent →
cleanup → scan → snapshot → select → present → async-fill) lives in the two
SIBLING repos:**

- In-process AI orchestrators (the `internal-agent` executor):
  - `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts` → `runColdStartWorkflow`
  - `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts` → `runKnowledgeRescanWorkflow`
- Host-agent orchestrators (the `host-agent` executor):
  - `AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts` → `runHostAgentColdStartWorkflow`
  - `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts` → `runHostAgentKnowledgeRescanWorkflow`

Core's own would-be orchestration presenters — `presentInternalColdStartResponse`
(`ColdStartPresenters.ts:140`), `presentInternalKnowledgeRescanResponse`
(`KnowledgeRescanPresenters.ts:71`), `buildInternalColdStartReport`
(`ColdStartPresenters.ts:62`), `buildInternalColdStartTargetFileMap`
(`:46`) — have **NO production consumer in any of the three repos**. The live
orchestrators use their OWN presenters (`presentProjectContext*` in Alembic,
`presentHostAgent*` in Plugin). The `presentInternal*` set is kept green ONLY by
`AlembicCore/test/ColdStartSelectionSummary.test.ts:8` (a unit test). It is a
test-only / reserved surface, not load-bearing.

**Consequence for the merge:** the Core "families" are MUCH thinner than the
orchestrators. What Core actually exposes and what is actually consumed:

| Core symbol | cold-start | knowledge-rescan | live consumers |
|---|---|---|---|
| intent factory (internal) | `createInternalColdStartIntent` (`ColdStartIntent.ts:59`) | `createInternalKnowledgeRescanIntent` (`KnowledgeRescanIntent.ts:63`) | `Alembic/.../ColdStartWorkflow.ts:42`, `KnowledgeRescanWorkflow.ts:36` |
| intent factory (host) | `createHostAgentColdStartIntent` (`:84`) | `createHostAgentKnowledgeRescanIntent` (`:90`) | `AlembicPlugin/.../cold-start.ts:165`, `knowledge-rescan.ts:173` |
| plan builder | `buildColdStartWorkflowPlan` (`ColdStartPlan.ts:44`) | `buildKnowledgeRescanWorkflowPlan` (`KnowledgeRescanWorkflowPlan.ts:26`) | all 4 orchestrators |
| dimension selector | `selectColdStartDimensions` (`ColdStartPlan.ts:92`) + `buildColdStartSelectionSummary` (`:104`) | `selectKnowledgeRescanDimensions` (`KnowledgeRescanWorkflowPlan.ts:69`) | **none in prod** (Alembic uses its own `resolveColdStartWorkflowDimensionSelection`; selection-summary only in Core test) |
| host-agent response presenter | `presentHostAgentColdStartResponse` (`ColdStartPresenters.ts:224`) | `presentHostAgentKnowledgeRescanResponse` (`KnowledgeRescanPresenters.ts:189`) | Plugin only |
| internal response presenter | `presentInternalColdStartResponse` (`:140`) | `presentInternalKnowledgeRescanResponse` (`:71`) | **test-only** |
| gap plan (rescan-only) | — | `buildKnowledgeRescanPlan` (`KnowledgeRescanPlanBuilder.ts:154`) + `projectHostAgentRescanEvidencePlan` (`RescanEvidenceProjectors.ts:163`) | Alembic + Plugin rescan orchestrators |

This correction does NOT kill the collapse — it sharpens it. The real Core-side
collapse target is the **intent + plan + (thin) presenter trio**, not an
imagined step-list executor. The orchestrator-side collapse (sibling repos) is a
separate, larger question handled in §2.5 / §4 sequencing.

---

## 1. BEHAVIOR-DIFF (the core evidence)

Per pipeline stage, comparing the Core-side builders. All file:line are
**AlembicCore/src** unless prefixed.

### 1a. Intent build

`ColdStartIntent.ts` vs `KnowledgeRescanIntent.ts`. Both produce a
`{kind, executor, analysisMode, cleanupPolicy, completionPolicy, projectAnalysis,
dimensionIds, internalExecution?}` shape over the shared
`WorkflowExecutor`/`WorkflowAnalysisMode` types (`shared/WorkflowTypes.ts:45-46`).

| Field | cold-start (`ColdStartIntent.ts`) | knowledge-rescan (`KnowledgeRescanIntent.ts`) | verdict |
|---|---|---|---|
| `kind` | `'cold-start'` (`:48`,`:63`,`:85`) | `'knowledge-rescan'` (`:48`,`:70`,`:97`) | DIVERGENT literal (internal symbol, NOT persisted — see §note) |
| `analysisMode` | always `'full'` (`:50`,`:65`,`:86`) | `forceMode ? 'full' : 'incremental'` (`:72`,`:99`) | **DIVERGENT** = the mode axis itself |
| `cleanupPolicy` | always `'full-reset'` (`:51`,`:66`,`:87`) | `forceMode ? 'force-rescan' : 'rescan-clean'` (`:67`,`:94`); type also allows `'none'` (`:51`) | **DIVERGENT** = mode-derived |
| `completionPolicy` | `'auto-fill'` (internal) / `'host-agent-dimension-complete'` (host) (`:52`,`:67`,`:90`) | identical pair (`:52`,`:74`,`:101`) | SHARED (keyed on executor, not mode) |
| `projectAnalysis.sourceTag` | `'bootstrap'` / `'bootstrap-host-agent'` (`:37`,`:72`,`:95`) | `'rescan-internal'` / `'rescan-host-agent'` (`:26`,`:79`,`:105`) | DIVERGENT literal (persisted as job source — FROZEN, see §note) |
| `projectAnalysis.summaryPrefix` | `'Bootstrap host-agent scan'` (host only) (`:96`) | `'Rescan-Internal scan'` / `'Rescan scan'` (`:79`,`:106`) | DIVERGENT label (log/summary text) |
| `projectAnalysis.generateAstContext` | internal `true` (`:73`), host `false` (`:97`) | internal `true` (`:80`), host `false` (`:107`) | SHARED (keyed on executor) |
| `maxFiles`/`contentMaxLines` defaults | inline `?? 500` / `?? 120` (`:69-70`) | named consts + clamp-to-max via `resolveKnowledgeRescanAnalysisOptions` (`:114-128`) with `MAX_*` ceilings (`:7-8`) | **DIVERGENT logic** — rescan clamps to 20_000 / 2_000, cold-start does not. Mergeable: rescan's clamp is strictly more permissive; folding cold-start onto the clamp path is behavior-preserving for cold-start's small inputs. |
| `internalExecution` | `{skipAsyncFill, skipTargetDelivery}` (`:42-45`,`:76-79`) | `{skipAsyncFill}` only (`:31-33`,`:84-86`) | **DIVERGENT** — cold-start has an extra `skipTargetDelivery` knob |
| `ignoredFileDiffIncremental` | present (`:56`,`:80`,`:99`) | absent | cold-start-only field |
| `reason` | absent | present (`:56`,`:83`,`:110`) | rescan-only field |
| `perDimensionTargets` / `moduleDimensionTargets` | absent | present (`:57-60`) — U2b plan-fed per-cell targets | **rescan-only**, real divergence (gap-fill specific) |

The divergent branches quoted:

cold-start (`ColdStartIntent.ts:65-66`):
```ts
analysisMode: 'full',
cleanupPolicy: 'full-reset',
```
knowledge-rescan (`KnowledgeRescanIntent.ts:66-72`):
```ts
const forceMode = args.force ?? false;
const cleanupPolicy = forceMode ? 'force-rescan' : 'rescan-clean';
...
analysisMode: forceMode ? 'full' : 'incremental',
```

**Verdict (intent):** ~70% shared shape; the divergence is exactly the `mode`
axis (`full` ⇒ full-reset/full-scan, `incremental` ⇒ rescan-clean/incremental)
plus three small mode-orthogonal extras (`skipTargetDelivery`,
`ignoredFileDiffIncremental` on full; `reason`, `perDimensionTargets`,
`moduleDimensionTargets` on incremental). This is a clean `mode` switch.

### 1b. Plan build

`ColdStartPlan.ts:buildColdStartWorkflowPlan` (`:44-90`) vs
`KnowledgeRescanWorkflowPlan.ts:buildKnowledgeRescanWorkflowPlan` (`:26-67`).
Both return `{intent, cleanup, projectAnalysis:{projectRoot,prepare,scan,
materialize}, response:{tool}}` over the SAME `ProjectAnalysisPlanTypes.ts`
shapes.

| Plan field | cold-start | knowledge-rescan | verdict |
|---|---|---|---|
| `prepare` | `{clearOldData:true, ...(host? {dataRoot}:{})}` (`:53-56`) | `{}` (`:35`) | **DIVERGENT** — full clears old data + sets dataRoot for host; incremental prepares nothing |
| `scan.incremental` | hardcoded `false` (`:65`) | `intent.analysisMode === 'incremental'` (`:43`) | **DIVERGENT** = mode |
| `scan.skipGuard` | `intent.projectAnalysis.skipGuard` (`:60`) | absent (rescan never sets skipGuard) | cold-start-only field |
| `scan.logPrefix` | `'Bootstrap'` (`:66`) | `'Rescan'` (`:44`) | DIVERGENT label |
| `materialize` | `{sourceGraph,dependencyEdges,moduleEntities,guardViolations}=true` (`:68-73`) | **identical** (`:46-51`) | **SHARED — byte-for-byte** |
| `cleanup.policy` | `'full-reset'` (`:78`) | `intent.cleanupPolicy` (`:56`) | DIVERGENT = mode-derived |
| `cleanup.projectRoot` | `host? dataRoot : projectRoot` (`:79`) | `dataRoot` (`:57`) | **DIVERGENT** — full keys on executor; incremental always dataRoot |
| `cleanup.dataRoot` | present (`:80`) | absent | full-only field |
| `response.tool` | `'alembic_bootstrap'` (`:88`) | `'alembic_rescan'` (`:65`) | DIVERGENT literal (= the MCP tool name surfaced; tied to job kind) |

Quoted divergent branches:

cold-start prepare/cleanup (`ColdStartPlan.ts:53-56`, `:77-81`):
```ts
const prepare: ProjectAnalysisPreparationOptions = {
  clearOldData: true,
  ...(intent.executor === 'host-agent' ? { dataRoot } : {}),
};
...
cleanup: {
  policy: 'full-reset',
  projectRoot: intent.executor === 'host-agent' ? dataRoot : projectRoot,
  dataRoot,
},
```
rescan prepare/cleanup (`KnowledgeRescanWorkflowPlan.ts:35`, `:43`, `:54-58`):
```ts
const prepare: ProjectAnalysisPreparationOptions = {};
...
incremental: intent.analysisMode === 'incremental',
...
cleanup: {
  policy: intent.cleanupPolicy,
  projectRoot: dataRoot,
},
```

**Verdict (plan):** `materialize` and the `scan` skeleton are shared; everything
divergent is a clean function of `mode` (full ⇒ clearOldData/incremental:false/
full-reset; incremental ⇒ empty-prepare/incremental-from-analysisMode/
intent.cleanupPolicy) plus `response.tool`. The `cleanup.projectRoot`
executor-vs-mode subtlety is the one trap (see §5 R-2).

### 1c. Dimension selection

cold-start: `selectColdStartDimensions` (`ColdStartPlan.ts:92-102`) +
`buildColdStartSelectionSummary` (`:104-147`, ~44 lines: dedup, unknown-id, and
filtered-after-selection accounting → `ColdStartSelectionSummary`).
rescan: `selectKnowledgeRescanDimensions` (`KnowledgeRescanWorkflowPlan.ts:69-79`,
a 10-line filter, NO summary).

The `select*` cores are near-identical (filter dimensions by requested id set;
return all if none requested). **DIVERGENT:** cold-start additionally builds a
rich `ColdStartSelectionSummary` (unknown/duplicate/skipped accounting); rescan
has nothing equivalent because rescan does its dimension reasoning in the
gap-plan (§1e) instead. NOTE: neither `select*` is consumed in production — the
live Alembic cold-start uses `resolveColdStartWorkflowDimensionSelection`
(`Alembic/.../ColdStartWorkflow.ts:166`, body `:325`); `buildColdStartSelectionSummary`
runs only in Core's own test. So this divergence is in dead/test-only code.

### 1d. Presenter / output

Two presenter pairs each (internal + host-agent).

**Host-agent presenters (LIVE, Plugin-consumed):**
- `presentHostAgentColdStartResponse` (`ColdStartPresenters.ts:224-250`):
  `{cleanup: presentFullResetCleanup(...), ...briefing}` + a "Bootstrap 仅完成第一步"
  message instructing the agent to fill all dimensions.
- `presentHostAgentKnowledgeRescanResponse` (`KnowledgeRescanPresenters.ts:189-232`):
  `{rescan:{preservedRecipes, cleanedTables, cleanedFiles, ...archive, reason},
  relevanceAudit, ...briefing}` + an "✅ Rescan 完成" message with the 3-step
  evolve/submit/complete instruction and `occupiedTriggers` warning.

DIVERGENT output keys: cold-start ships `cleanup` (full-reset shape); rescan
ships `rescan` (preservedRecipes/cleanedFiles/archive — the
**destructive-reset honesty** block, `KnowledgeRescanPresenters.ts:11-28`) +
`relevanceAudit`. SHARED: both spread `...briefing` and wrap in `envelope(...)`
(`shared/WorkflowEnvelope.ts:23`). The messages are entirely different prose.

**Internal presenters (TEST-ONLY):** `presentInternalColdStartResponse`
(`:140-222`, ~80 lines — targets, filesByTarget, dependencyGraph, guardSummary,
analysisFramework, astContext…) vs `presentInternalKnowledgeRescanResponse`
(`:71-187` — rescan/relevanceAudit/evolutionAudit/gapAnalysis…). These are
genuinely divergent (cold-start emits a full project skeleton; rescan emits a gap
report) but they are NOT production code, so they don't constrain the prod merge.

### 1e. Rescan-only capability spine (no cold-start twin)

The deepest divergence — rescan carries an entire analysis spine cold-start has
no counterpart for:

- **Recipe snapshot preservation:** `runRescanCleanPolicy` /
  `runForceRescanCleanPolicy` return `{recipeSnapshot, cleanResult}`
  (`WorkflowCleanupPolicies.ts:43-64`); `runFullResetPolicy` returns only
  `CleanupResult` (`:39-41`). Cold-start has no recipe to preserve (it wipes).
- **Relevance audit + gap plan:** `buildKnowledgeRescanPlan`
  (`KnowledgeRescanPlanBuilder.ts:154-283`) — per-dimension coverage
  (`buildCoverageByDimension` `:350-379`), execution-mode decision
  (`produce`|`verify-only`|`skip`, `:316-348`), per-(module×dimension) cell
  plans (`buildModuleCellPlans` `:291-314`), coverage-ledger-fed existingCount
  (`ledgerCoverageByDimension ?? coverageByDimension` `:197-198`). Quoted:
  ```ts
  const mode: RescanExecutionMode =
    gap > 0 ? 'produce' : requiresVerification ? 'verify-only' : 'skip';
  ```
- **Evidence projectors:** `projectHostAgentRescanEvidencePlan`
  (`RescanEvidenceProjectors.ts:163-242`), `projectInternalRescanGapPlan` (`:65`).
- **Coverage-ledger read/write** (rescan-only; CG-3 sink lands here).

Cold-start has exactly one thing rescan lacks: the `ColdStartSelectionSummary`
(test-only) and the full-reset cleanup shape.

### 1f. §note — frozen literals are NOT in the workflow families

`PlanStageId` (`'coldStart' | 'deepMining' | 'moduleMining'`) is defined in
`src/service/planIntent/contracts.ts:1` and `src/service/planIntent/planIntent.ts:5-11`
— a SEPARATE plan-driven-stage concern. The workflow families do NOT own those
literals. The persisted/contract literals the families DO touch:
- job `source` tags `'bootstrap'`/`'bootstrap-host-agent'`/`'rescan-internal'`/
  `'rescan-host-agent'` (intent `sourceTag`) — written to scan records → FROZEN.
- `response.tool` `'alembic_bootstrap'`/`'alembic_rescan'` — MCP tool names →
  FROZEN.
- `intent.kind` `'cold-start'`/`'knowledge-rescan'` — internal discriminant, NOT
  persisted anywhere I found (grep shows no DB/JSON write of `.kind`). Safe to
  rename internally, but cheapest to keep (see §2).

**Overall verdict: the two families are ~60-70% twin in their intent+plan
skeleton (the mergeable spine), and genuinely divergent in (a) the rescan-only
gap/audit/coverage analysis spine and (b) the presenters. The intent+plan
collapse is SAFE and worthwhile. The rescan-only spine must stay separate
(strategy/hook), NOT be forced into a mode switch.**

---

## 2. TARGET SHAPE (the mode-parameterized family)

Proposed folder `src/workflows/project-index/` (INDEX vocab; full build =
`full`/`initialIndex`, incremental = `incrementalIndex`):

```
src/workflows/project-index/
  ProjectIndexIntent.ts      // createProjectIndexIntent({mode,executor,...})
  ProjectIndexPlan.ts        // buildProjectIndexWorkflowPlan(intent,...)
  ProjectIndexPresenters.ts  // presentHostAgentProjectIndexResponse(mode, ...)
  index.ts
```

with a single `mode: 'full' | 'incremental'` axis. `mode='full'` = ex-cold-start,
`mode='incremental'` = ex-rescan.

### 2a. Intent — unified factory

```ts
export type ProjectIndexMode = 'full' | 'incremental';

export interface ProjectIndexWorkflowIntent {
  kind: 'project-index';            // internal discriminant
  mode: ProjectIndexMode;           // the collapsed axis
  executor: WorkflowExecutor;       // 'internal-agent' | 'host-agent' (unchanged)
  analysisMode: WorkflowAnalysisMode;
  cleanupPolicy: 'full-reset' | 'none' | 'force-rescan' | 'rescan-clean';
  completionPolicy: 'auto-fill' | 'host-agent-dimension-complete';
  projectAnalysis: ProjectIndexAnalysisIntent;
  dimensionIds?: string[];
  // mode-orthogonal extras kept as optionals, populated per mode:
  internalExecution?: { skipAsyncFill: boolean; skipTargetDelivery?: boolean };
  ignoredFileDiffIncremental?: boolean;     // full-only today
  reason?: string | null;                   // incremental-only today
  perDimensionTargets?: Record<string, number>;          // incremental-only
  moduleDimensionTargets?: ModuleDimensionTarget[];       // incremental-only
}
```

Each §1a divergent branch becomes a `mode` switch inside the factory (one factory
per executor, OR one factory with an `executor` arg — keep the current
internal/host split to preserve the executor-keyed `generateAstContext`/
`completionPolicy` decisions which are NOT mode-driven):

```ts
function resolveCleanup(mode, force) {
  if (mode === 'full') return { analysisMode: 'full', cleanupPolicy: 'full-reset' };
  return { analysisMode: force ? 'full' : 'incremental',
           cleanupPolicy: force ? 'force-rescan' : 'rescan-clean' };
}
```

The `sourceTag` stays a per-(mode×executor) FROZEN literal lookup — NOT
recomputed:
```ts
const SOURCE_TAG = {
  full:        { 'internal-agent': 'bootstrap',        'host-agent': 'bootstrap-host-agent' },
  incremental: { 'internal-agent': 'rescan-internal',  'host-agent': 'rescan-host-agent' },
} as const;   // values FROZEN — persisted job source
```

### 2b. Plan — unified builder

`buildProjectIndexWorkflowPlan(intent, projectRoot, dataRoot)`. The §1b divergent
branches become:
```ts
const prepare = intent.mode === 'full'
  ? { clearOldData: true, ...(intent.executor === 'host-agent' ? { dataRoot } : {}) }
  : {};
const scan = { ...sharedScan,
  incremental: intent.analysisMode === 'incremental',  // already mode-derived
  skipGuard: intent.mode === 'full' ? intent.projectAnalysis.skipGuard : undefined,
  logPrefix: intent.mode === 'full' ? 'Bootstrap' : 'Rescan' };
const cleanup = intent.mode === 'full'
  ? { policy: 'full-reset',
      projectRoot: intent.executor === 'host-agent' ? dataRoot : projectRoot,
      dataRoot }
  : { policy: intent.cleanupPolicy, projectRoot: dataRoot };
const response = { tool: intent.mode === 'full' ? 'alembic_bootstrap' : 'alembic_rescan' };
//                        ^^^^^^ FROZEN literals, selected by mode
```
`materialize` stays the single shared literal (it's already identical).

### 2c. Presenter — thin mode dispatch

Keep the two host-agent presenter BODIES (their output shapes/messages are
genuinely different — cold-start emits `cleanup`+briefing, rescan emits
`rescan`+`relevanceAudit`+briefing) but expose them under one module with a mode
param that dispatches:
```ts
export function presentHostAgentProjectIndexResponse(mode, args) {
  return mode === 'full'
    ? presentHostAgentFullIndexResponse(args)     // = ex presentHostAgentColdStartResponse
    : presentHostAgentIncrementalIndexResponse(args); // = ex presentHostAgentKnowledgeRescanResponse
}
```
Do NOT force the two output shapes into one — they diverge by design (full has no
recipes to preserve; incremental's whole point is the gap/audit report).

### 2d. What STAYS SEPARATE (strategy/hook, not forced)

The rescan-only analysis spine (§1e) does NOT move into the mode switch:
- `buildKnowledgeRescanPlan` + cell plans (`KnowledgeRescanPlanBuilder.ts`)
- `projectHostAgentRescanEvidencePlan` / projectors (`RescanEvidenceProjectors.ts`)
- recipe snapshot via `runRescanCleanPolicy`/`runForceRescanCleanPolicy`
- coverage-ledger read/write (CG-3 sink)

These stay in `workflows/capabilities/planning/knowledge/` as the
**incremental-mode strategy**, invoked by the orchestrator only when
`mode==='incremental'`. The unified family's job is the index op (cleanup +
scan + materialize + present); the gap analysis is a mode-gated capability the
orchestrator layers on. Forcing it into the factory would bloat `full` with
unreachable rescan fields.

### 2e. Orchestrator-side (sibling repos) — OUT of the Core collapse

The four orchestrators (`Alembic/.../ColdStartWorkflow.ts`,
`KnowledgeRescanWorkflow.ts`; `AlembicPlugin/.../cold-start.ts`,
`knowledge-rescan.ts`) are a separate, larger merge. They CAN later unify to a
`runProjectIndexWorkflow(mode)` shape, but that is a cross-repo wave with its own
risk budget. **Recommendation: collapse Core first (this design), leave the
sibling orchestrators on their current two-function shape, just re-pointing their
imports at the new unified Core symbols.** A sibling-orchestrator collapse is a
follow-up only if the user wants it — the Core collapse already delivers the
"one index op × mode" ideal at the contract layer.

---

## 3. R1 RECONCILIATION (don't break real imports)

**Real consumers of the renamed Core symbols (grounded grep across all 3 repos,
excluding `vendor/` snapshots and `.d.ts`):**

`buildColdStartWorkflowPlan` / `createInternalColdStartIntent` /
`createHostAgentColdStartIntent` / `runFullResetPolicy`:
- `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts:40-44,106,122`
- `AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts:13-20,165,167,225`
- `AlembicCore/test/PublicHostAgentWorkflowEntrypoints.test.ts:8,11,35`
- `AlembicCore/test/ColdStartSelectionSummary.test.ts:5-9`

`buildKnowledgeRescanWorkflowPlan` / `create*KnowledgeRescanIntent` /
`buildKnowledgeRescanPlan` / `runRescanCleanPolicy` / `runForceRescanCleanPolicy`:
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:30-48,193,207,217,460`
- `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts:18-34,173,198`
- `AlembicCore/test/*` (KnowledgeRescanIntent, KnowledgeRescanWorkflowPlan, unit/KnowledgeRescanPlanBuilder)

The package `exports` map (`AlembicCore/package.json:213-251`) publishes
`./workflows/cold-start` and `./workflows/knowledge-rescan` subpaths, and
`host-agent-workflows` re-exports both via `export *`
(`src/host-agent-workflows.ts:62-63`). The sibling repos import the symbols via
the FLAT `@alembic/core/host-agent-workflows` barrel (NOT the subpath) — e.g.
`Alembic/.../ColdStartWorkflow.ts:44` imports from `'@alembic/core/host-agent-workflows'`.
**This is the key R1 lever: callers depend on the barrel symbol NAMES, not the
folder path.** Renaming the folder is invisible to them as long as the barrel
keeps re-exporting compatible names.

**Reconciliation plan (compat-alias for one release, then staged migration):**

1. Create `workflows/project-index/` with the new unified symbols
   (`createProjectIndexIntent`, `buildProjectIndexWorkflowPlan`, …).
2. In the OLD `workflows/cold-start/index.ts` and `workflows/knowledge-rescan/
   index.ts`, replace the bodies with **thin compat shims** that delegate:
   ```ts
   // cold-start/ColdStartIntent.ts (shim)
   export const createInternalColdStartIntent = (args) =>
     createProjectIndexIntent({ mode: 'full', executor: 'internal-agent', ...args });
   export type ColdStartWorkflowIntent = ProjectIndexWorkflowIntent;  // alias
   export const buildColdStartWorkflowPlan = buildProjectIndexWorkflowPlan;
   ```
   Keep the `export *` lines in `host-agent-workflows.ts:62-63` and the
   `package.json` subpaths — both still resolve, now to shims. **Zero caller
   churn at step 2.**
3. Keep both old subpaths in `package.json exports` for one release (marked
   `@deprecated` in the shim JSDoc with the cleanup trigger = "after sibling
   repos migrate their imports to `@alembic/core/workflows/project-index`").
4. Staged caller migration (separate, low-risk commits, one repo each):
   - `Alembic` cold-start + rescan orchestrators → import unified symbols, pass
     explicit `mode`.
   - `AlembicPlugin` cold-start + rescan orchestrators → same.
   - Core's own tests → point at new module (or keep testing via shims until the
     shim-removal step).
5. After all live callers migrated + green, remove the shims and the deprecated
   subpaths (twin removal). The `presentInternal*` test-only surface
   (`ColdStartSelectionSummary.test.ts`) either migrates to the unified presenter
   or the test + dead presenters are removed together (they have no prod
   consumer — see §0).

**The R1 invariant honored:** at no commit is a real import left dangling. The
`ColdStart*` names survive as aliases through steps 2-4 and are only deleted in
step 5 after every importer has moved. `ColdStartWorkflow` (the sibling-repo
orchestrator class) is NOT renamed by this Core collapse at all — it keeps its
name and just re-points its imports.

---

## 4. SAFE STAGING (green-per-step)

Each step independently buildable (`npm run build:check`) + green
(`npm run test`) in AlembicCore. Lands AFTER CG-3 (coverage-ledger-write sink)
and the mainbody-realverify-followup waves — so the coverage-ledger read path the
incremental strategy depends on is already settled before we touch it.

**Step (a) — Behavior-diff lock + characterization tests (no source change).**
Add/extend characterization tests that pin the CURRENT output of every live and
test-only builder, so any merge regression shows as a red diff:
- `buildColdStartWorkflowPlan` (internal + host) → assert full `plan` object
  (cleanup policy, projectRoot executor-branch, scan.incremental=false,
  scan.skipGuard, materialize, response.tool='alembic_bootstrap').
- `buildKnowledgeRescanWorkflowPlan` (force + non-force + none) → assert
  cleanup.policy 3-way, scan.incremental, response.tool='alembic_rescan'.
- `createInternal*Intent` + `createHostAgent*Intent` → snapshot full intent
  (sourceTag, analysisMode, cleanupPolicy, completionPolicy, the extras).
- `buildKnowledgeRescanPlan` → already covered by
  `test/unit/KnowledgeRescanPlanBuilder.test.ts`; extend to lock execution-mode
  decisions + cell plans + ledgerCoverage path.
- Existing anchors to preserve: `PublicHostAgentWorkflowEntrypoints.test.ts`
  (asserts `response.tool`, `materialize`, `generateAstContext` per mode —
  `:61-63`), `KnowledgeRescanWorkflowPlan.test.ts`, `KnowledgeRescanIntent.test.ts`,
  `ColdStartSelectionSummary.test.ts`.
These tests are the rollback tripwire for §5.

**Step (b) — Extract shared core behind a façade (behavior-preserving).** Pull
the byte-identical `materialize` literal and the shared `scan` skeleton into a
private `buildProjectIndexScanSkeleton()`/`PROJECT_INDEX_MATERIALIZE` in a new
`project-index/` internal module. Old builders call it. No public symbol changes;
characterization tests stay green.

**Step (c) — Introduce the unified `createProjectIndexIntent` +
`buildProjectIndexWorkflowPlan` with the `mode` switch** (§2a/§2b). Do NOT wire
callers yet. Add NEW characterization tests asserting the unified builders
reproduce, for `mode='full'`, byte-equal output to `buildColdStartWorkflowPlan`,
and for `mode='incremental'`, byte-equal to `buildKnowledgeRescanWorkflowPlan`
(parameterized over force/non-force). This is the "merge is correct" proof.

**Step (d) — Route both old entrypoints through the unified core (alias shims).**
Replace old builder bodies with delegations (§3 step 2). Characterization tests
from (a) MUST stay green unchanged — that is the behavior-preservation gate.

**Step (e) — Migrate callers (sibling repos, one commit each).** Re-point
`Alembic` and `AlembicPlugin` orchestrator imports to the unified symbols, pass
explicit `mode`. Each sibling repo: build + its own test suite green. (These are
sibling-repo commits, gated by their own windows; Core just keeps the shims live
until they land.) **REAL-TEST verification required here** — see below.

**Step (f) — Remove twins / convert to alias.** After all live callers migrated +
green across repos, delete the `cold-start/` and `knowledge-rescan/` shim folders
(or keep a one-line alias index for one more release), drop the deprecated
`package.json` subpaths, remove the dead `presentInternal*` + test-only selection
surface (or migrate its test). Run `CorePackage.test.ts` + boundary tests.

**REAL-TEST verification (mandatory before step f).** This collapse touches the
generation pipeline. Before removing twins, run a real characterization pass on a
live project (the BiliDili faithful-copy recipe from the lifecycle e2e ledger):
- a real `mode='full'` bootstrap (ex-cold-start) on a sandbox `ALEMBIC_HOME` →
  assert the same scan/materialize/skeleton-creation behavior + job source
  `'bootstrap'` as the pre-collapse baseline.
- a real `mode='incremental'` rescan (ex-rescan) → assert recipe preservation,
  gap plan, coverage-ledger read (post-CG-3), evolution audit, job source
  `'rescan-internal'` unchanged.
Compare DB rows + response envelopes against a pre-collapse baseline snapshot.
The merge is accepted only if the real run is byte-equivalent on the frozen
literals and behavior-equivalent on the analysis spine.

**Merge-churn note (hot-zone):** sequence this AFTER the realverify-followup waves
have landed `KnowledgeRescanWorkflow.ts` / `KnowledgeRescanPlanBuilder.ts`
changes (CG-3 coverage-ledger-write, the deepMining writeback fix). Rebase onto
their final commits before step (b) so the unified incremental strategy wraps the
SETTLED gap/coverage code, not a moving target.

---

## 5. RISK & ROLLBACK

**R-1 — A divergent intent/plan branch silently dropped in the mode switch.**
E.g. cold-start's `prepare.clearOldData:true` not carried into `mode='full'`, so
full-index stops wiping → stale data leaks into a "fresh" bootstrap. Or rescan's
`scan.incremental` accidentally pinned false → incremental re-scans everything.
*Caught by:* step-(c) byte-equal characterization tests (full plan ≡ old
cold-start plan; incremental plan ≡ old rescan plan) — any dropped field is a red
assert. *Rollback:* the unified builders are unused until step (d); reverting is
deleting the new module.

**R-2 — `cleanup.projectRoot` executor-vs-mode confusion.** cold-start keys
projectRoot on `executor` (`host? dataRoot : projectRoot`,
`ColdStartPlan.ts:79`) while rescan always uses `dataRoot`
(`KnowledgeRescanWorkflowPlan.ts:57`). If the merge over-simplifies to "always
dataRoot" or "always executor-keyed", the in-process full-index cleanup targets
the wrong root → wrong directory wiped. This is the single most dangerous trap
(it's a destructive op). *Caught by:* a dedicated characterization test asserting
`mode='full' + internal-agent ⇒ projectRoot===projectRoot` and
`mode='full' + host-agent ⇒ projectRoot===dataRoot` and
`mode='incremental' ⇒ projectRoot===dataRoot`. *Mitigation:* keep the exact
ternary per §2b; do not "tidy" it.

**R-3 — Frozen literal drift.** Renaming leaks a frozen value: `sourceTag`
becomes e.g. `'full-index'` instead of `'bootstrap'`, or `response.tool` changes
→ persisted job source / MCP tool name breaks downstream consumers and DB
queries. *Caught by:* characterization tests asserting the EXACT frozen strings
(`'bootstrap'`, `'rescan-internal'`, `'alembic_bootstrap'`, `'alembic_rescan'`);
the SOURCE_TAG/response lookup tables (§2a/§2b) make the frozen values explicit
and greppable. *Rollback point:* these literals never change in any step; a test
red here blocks the merge outright.

**R-4 — R1 import break.** A caller still imports `ColdStartWorkflowIntent` after
the shim is removed prematurely. *Caught by:* sibling-repo `build:check` (TS
no-emit) in step (e) — a dangling import fails compile before any runtime.
*Mitigation:* §3 keeps aliases through steps 2-4; step (f) removal is gated on a
clean cross-repo grep (`grep -rn 'ColdStart\|KnowledgeRescan' Alembic/lib
AlembicPlugin/lib | grep -v vendor` returns only the orchestrator class names,
not Core symbol imports).

**R-5 — Rescan analysis spine accidentally entangled in the mode switch.** If the
gap/audit/coverage spine (§1e) gets pulled into the unified factory "for
symmetry", `mode='full'` carries dead rescan fields and the full-index path risks
running gap logic on a just-wiped DB. *Mitigation:* §2d — the spine stays a
mode-gated capability the ORCHESTRATOR invokes, never inside the factory.
*Caught by:* characterization that `mode='full'` intent/plan has NO
`perDimensionTargets`/`moduleDimensionTargets`/gap fields.

**Global rollback point:** every step before (d) leaves production untouched (new
code is unused). Step (d) is the first behavior-bearing commit and is fully
reverted by restoring the original builder bodies (the shims are pure
delegations). Steps (e)/(f) are per-repo and revert independently. The
characterization suite from step (a) is the persistent tripwire across all steps.

---

## HONESTY VERDICT (collapse / don't / partial)

**Collapse the intent+plan spine: YES.** It is genuinely ~60-70% twin and the
divergence is a clean `mode` axis (full ⇒ full-reset/full-scan; incremental ⇒
rescan-clean/incremental) plus a handful of mode-orthogonal optional fields. The
INDEX vocabulary (`full`/`incremental`) maps exactly onto the existing
`analysisMode`/`cleanupPolicy` divergence. This delivers the "one index op × mode"
ideal at the Core contract layer with low risk and a clean R1 alias path.

**Do NOT collapse:** (1) the rescan-only analysis spine (gap plan / relevance
audit / coverage ledger / evidence projectors) — keep it as the incremental-mode
strategy/hook; forcing it into a mode switch bloats `full` with unreachable
fields and risks running gap logic on a wiped DB. (2) The two presenter output
SHAPES — they diverge by design; unify only the dispatch entrypoint, not the
bodies. (3) The sibling-repo orchestrators (`ColdStartWorkflow` /
`KnowledgeRescanWorkflow`) — out of this Core wave; just re-point their imports.

**One surprise the prompt's framing missed (flag for the user/Design):** the
"execution/step list" is NOT in Core — it's in the sibling repos, and Core's own
`presentInternal*` orchestration presenters are dead/test-only. So the Core-side
"families" are thinner than assumed; the high-value, low-risk collapse is the
intent+plan trio. A full orchestrator-level unification (`runProjectIndexWorkflow`)
is a much larger cross-repo behavior refactor and should be a SEPARATE, explicitly
confirmed wave — not folded into this one.
