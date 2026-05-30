# PCVM Issue Records: Alembic Internal Cold-start

Run ID: `pcv-20260530-1515-alembic-cold-start`
Owner: `AlembicWorkspace`
Purpose: store open risks, failures, residual boundaries, and follow-up questions. The plan remains in `../plan.md`.

## Open Issues

### I-017: Full-Dimension Pass Is No-Live Fixture Only

Status: `expected boundary / deferred`
Issue class: `expected-boundary`
First seen: `2026-05-30 16:37 CST`
Related node: `EXP-full-dimensions`

Facts:

- `EXP-full-dimensions` passed through focused tests and a deterministic full TypeScript active-dimension report/history fixture.
- No broad cold-start, daemon, Dashboard, live Agent/model/provider call, real delivery/wiki/skill export, or runtime DB mutation was executed.
- The pass proves report/history/PCV node-local expansion behavior for all selected dimensions, including skill-only N11 `not-applicable` branch handling.

Constraint:

- Do not reuse `EXP-full-dimensions` pass as proof that a real full cold-start completed.
- A true runtime/AI/delivery confirmation must be opened as a new explicit round with its own safety boundary and, if it depends on a real project or Dashboard observation, an `AlembicTest` handoff.

### I-016: AlembicCore ProjectSkillDeliveryContracts Vitest Hang

Status: `process issue / excluded evidence`
Issue class: `probe-error`
First seen: `2026-05-30 16:16 CST`
Related node: `N13-finalizer-policy`

Facts:

- Extra command `npm test -- test/ProjectSkillDeliveryContracts.test.ts` in `AlembicCore` produced only the npm/vitest header and then no test output.
- The lingering npm/vitest processes were terminated so no background test remained.
- N13 pass evidence does not rely on this command; it relies on Alembic focused tests and a direct no-write receipt augmentation probe.

Constraint:

- Do not treat the AlembicCore hang as N13 product failure or pass evidence.
- If Core receipt contracts become the optimization target, rerun that test under a separate focused Core investigation.

### I-015: N11 Live Producer Behavior Not Exercised

Status: `expected boundary / deferred`
Issue class: `expected-boundary`
First seen: `2026-05-30 16:10 CST`
Related node: `N11-produce-candidates`

Facts:

- N11 passed with focused unit tests and a deterministic frozen producer-only cut.
- No live producer/model call was executed.
- The pass verdict proves producer evidence projection, sourceRef validation, rejected reason visibility, and terminal-tool policy under frozen input.

Constraint:

- Do not reuse N11 pass as proof that a live producer prompt will generate valid candidates.
- Live producer behavior can only be evaluated in a later explicitly authorized runtime/AI node or real-project evidence task.

### I-014: N10 Helper-Level Admission Probe Was Insufficient

Status: `process issue / corrected`
Issue class: `probe-error`
First seen: `2026-05-30 16:08 CST`
Related node: `N10-evolve-prescreen`

Facts:

- A first direct N10 probe called `buildBootstrapDimensionAdmissionDecisions()` with both incremental skip and rescan force lists.
- That helper receives already-resolved skip lists and does not itself remove force-execute dimensions from incremental skip.
- The corrected probe used `resolveBootstrapDimensionAdmissions()`, which performs the composition-level force-execute filtering and matched the focused unit test behavior.

Constraint:

- Do not use helper-only admission decisions as N10 pass evidence for rescan force semantics.
- Forced execution must be evaluated at the `resolveBootstrapDimensionAdmissions()` composition boundary.

### I-013: N9 Live Provider Behavior Not Exercised

Status: `expected boundary / deferred`
Issue class: `expected-boundary`
First seen: `2026-05-30 16:07 CST`
Related node: `N9-agent-analyze-quality`

Facts:

- N9 passed with focused unit tests and a deterministic frozen Agent-result projection probe.
- No live Agent/model/provider call was executed in N9.
- The pass verdict proves canonical N9 evidence projection and observability linkage, not live model quality.

Constraint:

- Do not reuse N9 pass as proof that a live provider will produce good findings.
- Live provider behavior can only be evaluated in a later explicitly authorized runtime/AI node or `AlembicTest` real-project evidence task.

### I-012: N8 Tier Expectation Probe Error

Status: `process issue / corrected`
Issue class: `probe-error`
First seen: `2026-05-30 16:04 CST`
Related node: `N8-stage-factory-tool-policy`

Facts:

- The first direct N8 fixture probe expected `dimensionParam.tier` to equal `2`.
- Source behavior resolves `tierHint` into a one-based display/runtime tier; the actual fixture value for the API dimension was `1`.
- A diagnostic rerun printed the dimension param and stage maps, then the corrected assertion passed.

Constraint:

- Do not treat one-based dimension tier projection as N8 failure.
- Future probes should assert source-derived tier semantics instead of assuming raw tier hint passthrough.

### I-011: N7 Workflow Presenter Skeleton Not Emitted

Status: `boundary gap / monitor`
Issue class: `test-gap`
First seen: `2026-05-30 15:53 CST`
Related node: `N7-session-task-manager`

Facts:

- N7 passed task/session manager behavior with direct fixture evidence.
- The fixture did not call `presentInternalColdStartResponse()`, so it did not produce a full workflow skeleton response envelope.

Constraint:

- Treat N7 as task/session skeleton proof only.
- If response-envelope correctness becomes the optimization target, add a presenter-level skeleton fixture before N8+ runtime evidence is used as end-to-end proof.

### I-010: N6 Unknown Requested Dimensions Have No Skip Reason Surface

Status: `stage-loss risk / open`
Issue class: `product-risk`
First seen: `2026-05-30 15:50 CST`
Related node: `N6-dimension-plan`

Facts:

- N6 pure probe requested `missing` together with valid dimensions.
- `selectColdStartDimensions()` silently dropped the unknown id because it filters active dimensions by a `Set`.
- The behavior is deterministic and did not fail N6, but there is no explicit skip reason surfaced at this boundary.

Constraint:

- Later report/observability optimization should decide whether unknown requested dimension ids need user-visible skipped-reason evidence.

### I-009: N6 Probe Import Path Error

Status: `process issue / not a node failure`
Issue class: `probe-error`
First seen: `2026-05-30 15:50 CST`
Related node: `N6-dimension-plan`

Facts:

- The first N6 pure probe imported `./dist/shared.js`, which does not exist in AlembicCore.
- The corrected import path `./dist/shared/index.js` passed the same assertions.

Constraint:

- Treat the first failure as probe setup error only.

### I-008: N5 Real Rescan Runtime Remains Separate

Status: `expected branch boundary / monitor`
Issue class: `expected-boundary`
First seen: `2026-05-30 15:47 CST`
Related node: `N5-rescan-preservation-gate`

Facts:

- N5 passed as a branch-gate for the pure cold-start run and through focused rescan policy tests.
- No real `alembic_rescan` runtime was executed.
- Variant C remains the owner for real rescan runtime evidence.

Constraint:

- Do not use N5 branch-gate pass as proof that a real rescan completed.
- If the optimization target switches to rescan behavior, open the Variant C path explicitly.

### I-007: N4 Degraded Analyzer Case Not Forced

Status: `edge gap / monitor`
Issue class: `test-gap`
First seen: `2026-05-30 15:45 CST`
Related node: `N4-project-intelligence-materialization`

Facts:

- N4 fixture completed with no warnings.
- The pass proves happy-path deterministic materialization and projection, not the quality of warning text when an analyzer degrades.

Constraint:

- If N4 optimization targets degraded-path observability, add a forced analyzer-degradation fixture before changing downstream nodes.

### I-006: N3 Broad Runtime Cleanup Still Unexecuted

Status: `expected boundary / monitor`
Issue class: `expected-boundary`
First seen: `2026-05-30 15:41 CST`
Related node: `N3-full-reset-and-discovery`

Facts:

- N3 passed through isolated temporary cleanup and discovery fixtures only.
- The real Alembic ProjectScope runtime data root was not full-reset.
- Unreadable-file and target-error branches were not forced in the N3 fixture.

Constraint:

- Do not infer real runtime cleanup safety beyond the isolated full-reset contract.
- Later runtime nodes must still use ProjectScope-aware data roots and must not broaden into real bootstrap until their own gates pass.

### I-005: N2 Dimension De-dup Assumption

Status: `resolved as source fact / not a product failure`
Issue class: `expected-boundary`
First seen: `2026-05-30 15:35 CST`
Related node: `N2-entry-intent`

Facts:

- An initial N2 probe expected `normalizeDimensionIds(["quality", "", "architecture", "quality"])` to de-duplicate repeated ids.
- Source and existing unit tests show the normalization contract is comma split, trim, empty filtering, and non-string filtering only.
- The corrected pure probe passed with duplicate ids preserved in `intent.dimensionIds`.
- Downstream `selectColdStartDimensions()` wraps `intent.dimensionIds` in a `Set`, so duplicate task execution must be evaluated in N6 rather than N2.

Constraint:

- Do not treat duplicate-preserving intent output as N2 failure.
- N6 must explicitly verify selected dimensions and skipped/filtered behavior.

### I-004: Broad Integration Misrun

Status: `process issue / not a node failure`
Issue class: `probe-error`
First seen: `2026-05-30 15:29 CST`
Related node: `N1-bootstrap-container-lifecycle`

Facts:

- Command `npm run test:integration -- test/integration/ServiceContainer.test.ts` expanded to the full integration suite because the npm script itself already passes `test/integration`.
- The broad run failed in unrelated sandbox / readonly database / HTTP listen areas.
- The corrected command `npx vitest run test/integration/ServiceContainer.test.ts` passed 15/15.

Constraint:

- Use direct `npx vitest run <file>` for single-file integration checks in this run.
- Do not treat the broad integration failure as N1 product failure.

### I-001: Naked Resolver Fallback Risk

Status: `open / constrained`
Issue class: `product-risk`
First seen: `2026-05-30 15:13 CST`
Related node: `N0-data-location`

Facts:

- `resolveAlembicWorkspace('/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic')` resolves through ProjectScope to Ghost dataRoot `/Users/gaoxuefeng/.asd/workspaces/ecf32806`.
- The raw ProjectRegistry at `/Users/gaoxuefeng/.asd/projects.json` does not individually register the Alembic child repo; it registers the parent workspace and BiliDili.
- A naked `WorkspaceResolver.fromProject(projectRoot)` / `resolveDataRoot()` path without container `_workspaceResolver` or Alembic `resolveAlembicWorkspace()` could fall back to the source repo.

Constraint:

- Future execution packets must require ProjectScope-aware bootstrap/container/daemon entrypoints.
- Do not invoke internal cold-start with a naked container.

### I-002: Pre-existing Source Markers

Status: `not caused by this run / monitor`
Issue class: `expected-boundary`
First seen: `2026-05-30 15:13 CST`
Related node: `N0-data-location`

Facts:

- The Alembic source repo already contains `.asd`, `.cursor/skills`, and `skills`.
- N0 was read-only and did not create these paths.

Constraint:

- These paths are not N0 failure evidence by themselves, but future runtime nodes must prove they do not write new cold-start artifacts into the source tree.

### I-003: Runtime Still Blocked After N0

Status: `expected block`
Issue class: `runtime-placeholder`
First seen: `2026-05-30 15:13 CST`
Related node: `N1-bootstrap-container-lifecycle`

Facts:

- N0 only proves path/write-root resolution.
- It does not prove service lifecycle, job state, cleanup, project analysis, Agent execution, candidate production, persistence, finalizer, report history, Dashboard, or real project behavior.

Constraint:

- Next allowed node is `N1-bootstrap-container-lifecycle`.
- Broad cold-start, daemon start, Dashboard start, AI call, delivery, DB mutation, and real project mutation remain blocked.
