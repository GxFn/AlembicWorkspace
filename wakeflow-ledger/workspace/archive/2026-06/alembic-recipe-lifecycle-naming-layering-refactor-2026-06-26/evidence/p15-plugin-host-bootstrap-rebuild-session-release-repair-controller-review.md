# P15 AlembicPlugin Host Bootstrap Rebuild Session Release Repair Controller Review

Reviewed at: 2026-06-29

Dispatch group: `p15-plugin-host-bootstrap-rebuild-session-release-repair-p1`

Target task: `p15-plugin-host-bootstrap-rebuild-session-release-repair-t1`

Decision: accept target result; P15 remains open for a fresh real BiliDili Test parity rerun.

## Scope Reviewed

- Target result:
  `target-results/target-result-p15-plugin-host-bootstrap-rebuild-session-release-repair-t1.json`
- Target report:
  `evidence/p15-plugin-host-bootstrap-rebuild-session-release-repair-t1-report.md`
- Task package:
  `task-packages/p15-plugin-host-bootstrap-rebuild-session-release-repair-p1.json`
- Prior Test blocker review:
  `evidence/p15-bilidili-final-parity-rerun-after-terminal-cleanup-seed-consistency-repair-controller-review.md`
- AlembicPlugin commit:
  `0d1c257a632186b72fea820b81ca9a467156d03d` (`Release empty bootstrap session before rescan`)

## Raw Evidence Reviewed

- `git show --stat --oneline --no-renames 0d1c257a632186b72fea820b81ca9a467156d03d`
  showed changes confined to:
  - `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  - `lib/recipe-generation/host-agent-workflows/project-context-analysis.ts`
  - `test/unit/HostAgentSessionLease.test.ts`
- Source diff review found:
  - `alembic_rescan` now calls `releaseEmptyHostAgentSessionLeaseForProject` before acquiring its rescan plan-generation lease;
  - the fresh-session behavior is explicit opt-in with `allowFreshEmpty: true` and reason `rescan-route-replaces-empty-bootstrap-session`;
  - default callers still use the existing stale-only cleanup behavior;
  - cleanup still delegates to the existing empty-session predicate, which rejects sessions with completed dimensions, progress, session-store evidence, or submission-tracker evidence.
- Test diff review found:
  - a fresh empty file-backed bootstrap session no longer blocks moduleMining rescan;
  - a submitted session is still protected even when the rescan route opts into fresh empty cleanup.
- Current repository state:
  - AlembicPlugin `HEAD` is `0d1c257a632186b72fea820b81ca9a467156d03d`;
  - worktree status is clean;
  - generated `dist/` is ignored by Git, but was rebuilt locally and marker-checked.

## Controller Verification

- `npx vitest run test/unit/HostAgentSessionLease.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
  - PASS: 2 files, 17 tests.
- `npx biome check lib/recipe-generation/host-agent-workflows/project-context-analysis.ts lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/HostAgentSessionLease.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
  - PASS.
- `npm run build:check`
  - PASS; Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- `npm run build`
  - PASS; regenerated ignored runtime `dist/`.
- `npm run lint:repo-boundary`
  - PASS; escape hatch count 0 / 75.
- `npm run lint:core-import-boundary`
  - PASS; scanned 441 files and 445 `@alembic/core` imports.
- `npm run lint:layer-boundary`
  - PASS.
- `git diff --check`
  - PASS.
- `rg -n "allowFreshEmpty|rescan-route-replaces-empty-bootstrap-session|Released stale empty host-agent lease|fresh empty bootstrap rebuild-boundary session" ...`
  - PASS: markers present in source/tests and regenerated ignored dist output.

## Controller Findings

- The repair directly targets the accepted Test blocker: after a successful authorized `alembic_bootstrap rebuild:true`, a fresh empty durable host-agent bootstrap session could block the next Plugin-owned host `alembic_rescan` with `BOOTSTRAP_IN_PROGRESS`.
- The implementation is narrow and stays inside AlembicPlugin host-agent workflows plus adjacent tests. It does not change Core APIs, Alembic main, Test, BiliDili source/data, public MCP tool names, response `tool` values, PlanStageId/job/source/lifecycle strings, coverage/deep-mining schema names, export paths, package version, provider config, release assets, or G6 cleanup.
- The chosen seam is reasonable: keep general session cleanup stale-only by default, and let the rescan route explicitly replace only same-project fresh empty bootstrap sessions. Sessions with submitted evidence remain blocking, which protects productive bootstrap work.
- `alembic_code_guard` was attempted by the target and failed with the known Alembic MCP internal schema error `unrecognized key "data"`. This remains a tooling risk, not a product validation pass.
- Because no real BiliDili Test was run from AlembicPlugin, this review accepts only the source repair. It does not prove final P15 parity, G4 coverage, or G6 cleanup.

## Controller Acceptance

- User goal: finish the Recipe lifecycle naming/layering refactor through P15 hard gates.
- Scope reviewed: AlembicPlugin host bootstrap/rebuild session release repair after Test proved `alembic_rescan` was blocked by a fresh empty durable bootstrap session.
- Original requirement authority: P15 hard gates and the prior controller review required repairing the live Plugin host route before rerunning Test, without manual BiliDili SQLite/session edits or broad productive-session cleanup.
- Target/window: AlembicPlugin / `p15-plugin-host-bootstrap-rebuild-session-release-repair-t1`.
- Evidence reviewed: target result/report, task package, prior blocker review, commit diff, source/test inspection, controller-run focused tests, build check, build, boundary checks, diff check, and source/dist marker proof.
- Implementation reality: `alembic_rescan` now explicitly releases same-project fresh empty host-agent bootstrap sessions before acquiring its own rescan lease, while preserving stale-only default cleanup and protecting sessions containing submitted evidence.
- Validation result: controller verification passed.
- Blockers for this target: none.
- Missing evidence: real BiliDili host-vs-in-process parity has not yet been rerun after commit `0d1c257a632186b72fea820b81ca9a467156d03d`.
- Residual risks: sessions with submitted evidence are intentionally not released; if a future reset route leaves a productive session that still must be canceled, that needs a separate controller/Core decision.
- TODO/backlog rollup: accept this Plugin repair and create the next P15 Test rerun. Do not add Core or Alembic main repair unless the clean rerun proves an independent defect.
- Decision: accept-target-result.
- Next action: create and dispatch a Test rerun that proves authorized rebuild/reset, host rescan no longer fails `BOOTSTRAP_IN_PROGRESS`, SQLite integrity, no aggregate/root success rows, non-empty target-scoped coverage rows, no open rounds/sessions at terminal state, and normalized host-vs-in-process parity.

## Forbidden Conclusions

- Do not complete or archive the demand from this Plugin result.
- Do not accept P15 final parity, G4, or G6 from source/unit evidence.
- Do not manually clean BiliDili SQLite/session/round files.
- Do not dispatch Alembic main repair unless the next clean rerun proves an independent in-process defect.
- Do not push, version, release, or remove compatibility aliases from this evidence.
