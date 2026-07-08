# Controller Review: P4 Alembic Depgraph/Project Selection Scope Repair

Demand: `alembic-panorama-rebuild-2026-07-03`
Reviewed target result: `Alembic / p4-alembic-panorama-depgraph-project-selection-scope-repair-t1`
Dispatch group: `p4-alembic-panorama-depgraph-project-selection-scope-repair-p1`
Controller decision: accept target result; dispatch Test final rerun next.

## Requirement Authority

P4 requires the real AlembicWorkspace dashboard panorama to show only workspace
members across all four tabs, with no BiliDili leakage, while BiliDili's own
dashboard and rescan chain do not regress. The previous Test countercheck proved
two Alembic backend/runtime leakage points:

- AW daemon `/api/v1/modules/dep-graph?level=module` returned BiliDili nodes.
- AW daemon `/api/v1/projects` selected BiliDili for the AW dashboard port.

This repair package was scoped only to those Alembic backend/runtime points.

## Target Evidence Reviewed

- TargetResultEnvelope:
  `target-results/tr-p4-alembic-panorama-depgraph-project-selection-scope-repair-t1-20260707051540-2ygr.json`
- Commit: `Alembic a5f8ff4d900b16abe5041c0d04b08e3f9db1ba7b`
- Changed files:
  - `Alembic/lib/project-facts/ProjectContextConsumerFacts.ts`
  - `Alembic/lib/daemon/runtime/ProjectRuntimeControl.ts`
  - `Alembic/test/unit/ProjectContextConsumerFacts.test.ts`
  - `Alembic/test/unit/ProjectRuntimeControl.test.ts`
- Prior controller attribution:
  `evidence/controller-review-p4-ui-countercheck-attribution-2026-07-07.md`

## Implementation Reality

Alembic fixed the two identified backend seams:

- `ProjectContextConsumerFacts.loadProjectContextRepo()` now detects when the
  requested `projectRoot` is a registered ProjectScope control root and creates a
  ProjectScope-bounded repo context from member folders. For control roots, the
  dependency graph returns ProjectScope member nodes instead of asking ambient
  ProjectContext repo/map discovery for stale single-project facts.
- `ProjectRuntimeControl.snapshot()` now binds read snapshots to the current daemon
  project when a persisted selected project is stale and there is no trusted active
  runtime. It changes the read snapshot/flags, not the persisted runtime-control
  state, so stale selection can no longer drive the AW header while the AW daemon
  serves the request.

The changes are in Alembic main only. No Dashboard/Core/BiliDili source changes were
made by this package.

## Controller Verification

Controller reran the target's focused tests from current checkout:

```text
npx vitest run --config vitest.unit.config.ts test/unit/ProjectContextConsumerFacts.test.ts test/unit/ProjectRuntimeControl.test.ts

Test Files  2 passed (2)
Tests       14 passed (14)
```

Controller also reviewed the commit diff and confirmed:

- `ModuleService` calls the repaired `loadProjectContextRepo()` /
  `projectContextDependencyGraph()` path used by `/api/v1/modules/dep-graph`.
- `/api/v1/projects` uses `ProjectRuntimeControl.snapshot()`.
- The new ProjectScope test fails closed if ambient ProjectContext discovery is
  called for the control root.
- The new ProjectRuntimeControl test proves stale selectedProject is not surfaced
  when the current daemon project should own the read snapshot, while persisted
  state remains unchanged.

Alembic repository status after review: `main...origin/main [ahead 7]`, working tree
clean.

## Decision

Accept this Alembic target result. It satisfies the source repair package and
provides focused regression coverage for both previously proven backend leakage
points.

This is not P4 demand completion. The final gate still requires Test to restart or
otherwise use the daemon/runtime built from `a5f8ff4d900b16abe5041c0d04b08e3f9db1ba7b`
and rerun the real dashboard countercheck:

- AlembicWorkspace panorama four tabs post-load show only AW member data.
- `/modules/dep-graph` and the Dependencies tab have no BiliDili nodes.
- `/projects` / header no longer show stale BiliDili on the AW dashboard.
- BiliDili dashboard contrast and rescan/provider terminal proof remain green.
