# P15 Final Freeze / CG-5 Audit Controller Review

Date: 2026-06-29
Controller: AlembicWorkspace
Task: `p15-final-freeze-cg5-audit-t1`
State revision observed after gap task creation: 218

## Decision

P15 is blocked, not completed.

The freeze and CG-5 isolation checks are green, but the final demand completion
gate is not satisfied because the state root does not contain an accepted fresh
real BiliDili host-vs-in-process project-index/deepMining parity proof with
`diffEmpty=true` after the latest P10 seed-output repair.

The controller added the missing Test package:

- `p15-bilidili-final-project-index-parity-gap-rerun-p1`
- `p15-bilidili-final-project-index-parity-gap-rerun-t1`

No `complete_demand`, archive, push, release, version bump, or G6 cleanup is
authorized from this audit.

## Evidence Reviewed

- Design authority: `Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md` section 12.2 P15 and hard gates.
- Accepted P14 controller review: `evidence/p14-agent-project-index-module-mining-folder-controller-review.md`.
- BiliDili real-test reviews:
  - `evidence/p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-controller-review.md`
  - `evidence/p9-bilidili-project-index-parity-realtest-controller-review.md`
  - `evidence/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-controller-review.md`
  - `evidence/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-fully-covered-target-repair-controller-review.md`
  - `evidence/p12-bilidili-file-change-evolution-parity-realtest-controller-review.md`
  - `evidence/p13-bilidili-hostagent-bootstrap-realtest-controller-review.md`
- Raw P10 parity artifacts that remain failing:
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/parity-diff.json`
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/parity-diff.json`
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-t1/parity-diff.json`

## Freeze Audit

Targeted grep audit found the expected frozen anchors still present:

- `PlanStageId` values remain `coldStart`, `deepMining`, and `moduleMining` at `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:773`, with related stage schema anchors at lines 857, 861, 1072, and 1156.
- Tool names remain `alembic_bootstrap`, `alembic_rescan`, `alembic_dimension_complete`, and `alembic_submit_knowledge` in `AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts`, `AlembicPlugin/lib/runtime/ToolPolicy.ts`, `AlembicPlugin/lib/runtime/mcp/core-tools/output.ts`, and the shared MCP schemas.
- Coverage table names remain `coverage_ledger` and `deep_mining_rounds` in `AlembicCore/src/infrastructure/database/drizzle/schema.ts:670` and `:708`, plus migrations 015/016.
- Runtime route constants remain `/api/v1/jobs/bootstrap`, `/api/v1/jobs/rescan`, and `/api/v1/file-changes` in `AlembicCore/src/daemon/RuntimeContracts.ts`; Alembic still mounts `/api/v1/file-changes`.
- `bootstrap-session:` remains in Alembic and Plugin session references.
- Source tags remain `file-change`, `alembic-main-bootstrap`, and `alembic-main-rescan`.
- Producer/verdict strings remain `plugin-opportunistic`, `daemon-file-change`, and `defer-to-alembic-service`.
- AlembicAgent P14 preserved runtime keys: `moduleMining`, `module-mining-session`, `module-mining-dimension`, `projectContextModules`, and `moduleMiningResults`.

No package version, release asset, provider config, thread id, or public freeze
value drift was found in the reviewed source and state-root evidence.

## CG-5 / Validation

Controller reran or reviewed final validation:

- `AlembicCore`: `npm run build:check` passed.
- `AlembicPlugin`: `npm run build:check`, `npm run lint:repo-boundary`, and `npm run lint:core-import-boundary` passed.
- `Alembic`: `npm run build:check`, `npm run lint:repo-boundary`, and `npm run lint:core-import-boundary` passed.
- `AlembicAgent`: `npm run build:check`, `npm run lint:core-import-boundary`, `npm test -- module-mining-agent-run.test.ts plan-agent-run.test.ts`, and `git diff --check` passed during P14 review.
- Read-only consumer check: `Alembic npm run build:check` passed after P14.
- Wakeflow MCP verification with runtime enabled passed workspace boundary, repository residue, repo status, workspace docs, script docs, current layout, git diff whitespace, and runtime residue checks.
- Product repository statuses for `AlembicCore`, `AlembicPlugin`, `Alembic`, and `AlembicAgent` were clean.

Current reviewed product HEADs:

- AlembicCore `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`
- AlembicPlugin `91eebc9f88fdd073aad161fc63aa129ffe9c5630`
- Alembic `0d60018d7f6c9e2bb4a660b8ed18c303aa6af8ad`
- AlembicAgent `e26f04414b71e36c72bc0f29b787579279d18f25`

## BiliDili Gate Review

Accepted positive evidence exists for several required chains:

- P6: full reset clears stale coverage/round rows; fresh in-process deepMining produced non-empty measured coverage and stopped through the advisor.
- P9: dimension-complete host/in-process coverage write parity passed with `diff == []`.
- P10 latest positive result: no-preclean public deepMining route exposed `coverageLedgerSeed`, produced 15 target-scoped coverage rows with 2 measured rows, had no aggregate/root module ids, SQLite integrity `ok`, and zero active sessions/open rounds.
- P11: Entry B binding-rich selector produced `plannedDimensions=["architecture"]`, materialized source refs, moved the selected target cell from thin to covered, and did not advance deepMining rounds.
- P12: file-change host vs daemon/in-process evolution proposal parity had normalized semantic diff `[]`.
- P13: real BiliDili HostAgent bootstrap produced HostAgent analysis surfaces while preserving old IDEAgent aliases and R-2 data-root safety.

The missing completion evidence is specific:

- Prior P10 parity raw artifacts are all negative or invalid:
  - combined-source-repairs: `comparable=true`, `diffEmpty=false`, host rows 8, in-process rows 15.
  - repairs rerun: host rows 27, in-process rows 0, `diffEmpty=false`.
  - source-repairs: `comparable=false`, host rows 0, in-process rows 0, `diffEmpty=false`.
- The latest accepted P10 seed-output no-preclean rerun explicitly did not run
  broader parity; its target result says controller must decide parity/follow-up.

Therefore the final completion definition is not yet met:

- P1-P14 accepted: yes.
- Freeze zero drift: yes.
- CG-5 isolation checks: yes.
- G4 non-empty coverage: partially yes through P6/P10/P11 positive evidence.
- Six-chain/final BiliDili host-vs-in-process parity `diff==empty`: no, missing fresh proof after the latest P10 repair.

## Next Action

Dispatch `p15-bilidili-final-project-index-parity-gap-rerun-t1` to Test. The
pass condition is intentionally narrow: real BiliDili, no sandbox, provider
routing preserved, both host and in-process sides non-empty and target-scoped,
`coverageLedgerSeed` present, SQLite/session/open-round cleanup closed, and
normalized parity diff empty.
