# P15 Controller Review - Final Parity Rerun After Bootstrap Session Release Repair

Reviewed at: 2026-06-29

Dispatch group: `p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-p1`

Target task: Test / `p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-t1`

Decision: accept blocked Test evidence; P15 final parity remains open.

## Scope Reviewed

- Target result:
  `target-results/target-result-p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-t1.json`
- Raw Test blocker:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-t1/blocked-summary.json`
- Authorized rebuild/reset evidence:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-t1/bootstrap-rebuild-evidence.json`
- Host rescan evidence:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-t1/host-rescan-evidence.json`
- In-process rescan evidence:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-t1/inprocess-rescan-evidence.json`
- Parity and final summaries:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-t1/parity-diff.json`
  and `Test/tmp/p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-t1/final-summary.json`
- Prior accepted Plugin repair:
  `evidence/p15-plugin-host-bootstrap-rebuild-session-release-repair-controller-review.md`

## Evidence Summary

Positive evidence:

- Loaded code points were correct: Alembic `0d60018d7f6c9e2bb4a660b8ed18c303aa6af8ad`, Core `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`, Plugin `0d1c257a632186b72fea820b81ca9a467156d03d`, and BiliDili `8487b82e7f3ceae7f35fcb19c6a5985022287422`.
- Provider route stayed correct: DeepSeek generation plus local Ollama/Qwen embedding.
- Scoped git status for Alembic, AlembicCore, AlembicPlugin, and BiliDili was clean.
- SQLite integrity remained `ok`.
- Plugin repair markers were loaded in source/dist/runtime.
- Authorized `alembic_bootstrap rebuild:true` succeeded, reset BiliDili coverage rows from 15 to 0, kept aggregate/root module ids absent, and kept open rounds at 0.
- The previous `BOOTSTRAP_IN_PROGRESS` blocker is fixed: host `alembic_rescan` after rebuild no longer failed with 409 and replaced the fresh empty rebuild-boundary session.
- Host and in-process routes both produced 15 target-scoped persisted coverage rows, with no aggregate/root module ids.
- Route-visible `coverageLedgerSeed` matched SQLite-derived seed on both host and in-process evidence.
- Normalized host-vs-in-process parity was comparable and empty.

Blocking evidence:

- Final summary still failed: `hostRouteOk=false`, `inprocessRouteOk=false`, `parityOk=false`, and `sessionsAndRoundsClosed=false`.
- Host `alembic_rescan` returned `ok=true` / `status=ready` but `coverageAdvisory.shouldStop=false`, with 15 high-value blank architecture gaps and no submitted Recipe evidence.
- Host route left one active BiliDili host-agent session and one open host-agent-rescan/deepMining round after the successful route.
- In-process evidence matched the same target-scoped coverage state, but also observed the same open session/round state.
- G4 remains unproven: both host and in-process `coverageLedgerSeed` values have `measuredCells=0` and `coveredPathCount=0`.
- Test correctly did not invoke no-padding cleanup with synthetic Recipe ids and did not manually edit BiliDili SQLite/session/round state.

## Ownership Judgment

This Test blocker is valid and should be accepted as evidence. It is not the previous bootstrap 409 blocker, SQLite corruption, provider drift, wrong HEAD, aggregate/root pollution, or Test-side manual cleanup.

First source owner: AlembicPlugin host-agent project-index/rescan route.

Reasoning:

- The public host route now starts successfully and writes target-scoped seed output, so the accepted session-release repair improved the live chain.
- The first remaining failure is that Plugin-owned host `alembic_rescan` returns a ready response without any submitted Recipe evidence or measured cells while leaving lifecycle state open.
- Prior P10 real evidence proves BiliDili can produce measured target-scoped cells and close sessions/rounds through the public deepMining path, so G4 is not inherently unreachable.
- AlembicCore may be implicated only if Plugin proves the current session/round or coverage APIs cannot express the safe terminal behavior. Alembic main should not be dispatched unless a later clean rerun proves an independent in-process defect.

The repair must first preserve the real host-agent semantics:

- If `alembic_rescan` is intentionally returning an actionable host-agent briefing, Plugin must make the response/lifecycle explicit enough that terminal gates are not falsely reported as success while a host-agent action remains required.
- If the route is expected to finish the P15 project-index chain without external submitted Recipes, Plugin must produce/submit/complete real session-bound evidence or close the exact no-output lifecycle state without hiding G4 failure.
- Do not broadly release productive sessions, invent synthetic Recipe ids, or mark coverage measured from blank seed rows.

## Controller Acceptance

- User goal: finish the Recipe lifecycle naming/layering refactor through P15 hard gates.
- Scope reviewed: Test final parity rerun after accepted Plugin bootstrap session release repair.
- Original requirement authority: state-root P15 hard gates require real BiliDili evidence, target-scoped non-empty coverage rows, no aggregate/root success rows, route-visible seed consistency, closed sessions/rounds, SQLite integrity, host-vs-in-process parity, and G4 non-empty measured coverage.
- Target/window: Test / `p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-t1`.
- Evidence reviewed: review pack, target result, raw blocked summary, rebuild/reset evidence, host rescan evidence, in-process evidence, parity diff, final summary, and prior Plugin repair review.
- Implementation reality: the accepted Plugin repair fixed the previous fresh empty bootstrap session blocker, but final P15 still fails on host-agent rescan actionable-output/terminal lifecycle and G4 measured coverage.
- Validation result: Test execution is valid; P15 pass predicate is not met.
- Blockers: host-agent rescan returns ready with 15 blank gaps and no submitted Recipe evidence; one active BiliDili host-agent session and one open round remain; measuredCells stays 0.
- Missing evidence: no source repair proving correct host-agent rescan terminal/actionable-output behavior; no final clean BiliDili host-vs-in-process parity rerun after that repair.
- TODO/backlog rollup: create a narrow AlembicPlugin repair package, then rerun Test only after source repair is accepted.
- Decision: accept-target-result as blocked evidence.
- Next action: create-next-package for AlembicPlugin host-agent rescan actionable-output / terminal lifecycle repair.

## Forbidden Conclusions

- Do not complete or archive the demand.
- Do not accept P15 from `diffEmpty=true` alone.
- Do not call the previous `BOOTSTRAP_IN_PROGRESS` blocker unresolved.
- Do not call this SQLite corruption or aggregate/root persistence pollution.
- Do not manually edit BiliDili SQLite/session/round state.
- Do not mark blank seed rows as measured coverage.
- Do not dispatch another Test rerun until source repair lands and is reviewed.
- Do not push, version, release, or remove compatibility aliases from this evidence.
