# P15 BiliDili Action-Required Lifecycle Rerun Controller Review

Reviewed at: 2026-06-29

Dispatch group: `p15-bilidili-final-parity-rerun-after-action-required-lifecycle-repair-p1`

Target task: `p15-bilidili-final-parity-rerun-after-action-required-lifecycle-repair-t1`

Decision: accept target result as a valid Test signal; P15 and G4 remain open.

## Scope Reviewed

- Target result:
  `target-results/target-result-p15-bilidili-final-parity-rerun-after-action-required-lifecycle-repair-t1.json`
- Task package:
  `task-packages/p15-bilidili-final-parity-rerun-after-action-required-lifecycle-repair-p1.json`
- Test raw evidence:
  `Test/tmp/p15-bilidili-final-parity-rerun-after-action-required-lifecycle-repair-t1/`
- Upstream controller review:
  `evidence/p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-controller-review.md`

## Raw Evidence Reviewed

- `completed-summary.json` classifies the result as
  `Test-signal-valid-but-P15-needs-session-bound-Recipe-evidence`.
- Live BiliDili host MCP `alembic_rescan` clean output exposes:
  - `hostAgentLifecycle.actionRequired=true`;
  - `state=action-required`;
  - `terminal=false`;
  - `terminalGate.pass=false`;
  - `terminalGate.reason=host-agent-action-required`.
- The clean output lifecycle matches full briefing data.
- Authorized BiliDili-scoped `alembic_bootstrap rebuild:true` succeeded before the rerun.
- Host and in-process routes both produced 15 target-scoped `coverage_ledger` rows for `architecture`.
- Host and in-process parity is comparable and `diffEmpty=true`.
- SQLite integrity is ok, provider config stayed DeepSeek generation plus local Ollama/Qwen embedding, and all four checked repositories were clean at:
  - Alembic `0d60018d7f6c9e2bb4a660b8ed18c303aa6af8ad`
  - AlembicCore `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`
  - AlembicPlugin `2c03793562995c88fcf74b7e12ce48073e287453`
  - BiliDili `8487b82e7f3ceae7f35fcb19c6a5985022287422`

## Controller Verification

- `jq` assertion over `completed-summary.json` confirmed:
  - lifecycle signal valid;
  - clean output matches full briefing;
  - parity diff is empty;
  - host measured cells remain 0;
  - sessions and rounds are not closed;
  - P15 conclusion is `not-complete`;
  - G4 conclusion is `unproven-measuredCells-zero`.
- `jq` assertion over `parity-diff.json` confirmed:
  - comparable parity;
  - empty normalized diff;
  - host and in-process measured cells are both 0;
  - host and in-process open-round checks are false.
- `rg` confirmed the accepted Plugin lifecycle markers are present in source, tests, and generated `dist`.
- `git status --short` for Alembic, AlembicCore, AlembicPlugin, and BiliDili returned no changes.

## Controller Findings

- The AlembicPlugin repair is live in the real BiliDili route: clean MCP output no longer hides the productive action-required lifecycle behind a misleading ready response.
- This result resolves the previous ambiguity between terminal success and host-agent action required.
- The result does not satisfy P15 final parity or G4:
  - `measuredCells=0` on host and in-process routes;
  - `coveredPathCount=0`;
  - one BiliDili host-agent session remains active;
  - one host-agent rescan/deepMining round remains open.
- The open session and round are expected for `action-required`, because the route now waits for real session-bound `alembic_submit_knowledge` and `alembic_dimension_complete`.
- Test did not manually edit BiliDili SQLite, session, or round state, and did not use synthetic noPadding cleanup.

## Controller Acceptance

- User goal: complete Recipe lifecycle naming/layering refactor through P15 hard gates.
- Scope reviewed: real BiliDili rerun after accepted Plugin action-required lifecycle repair.
- Original requirement authority: P15 requires real BiliDili host-vs-in-process parity, G4 non-empty measured coverage, terminal lifecycle cleanup, and no manual DB/session/round edits.
- Target/window: Test / `p15-bilidili-final-parity-rerun-after-action-required-lifecycle-repair-t1`.
- Evidence reviewed: target result, task package, upstream controller review, Test raw JSON summaries, parity diff, marker grep, and repository status.
- Implementation reality: live output correctly exposes action-required lifecycle and preserves open productive session/round state.
- Validation result: Test signal accepted; final P15/G4 validation remains incomplete.
- Blockers: no blocker for this Test signal; remaining blocker is absence of real session-bound Recipe evidence and dimension completion.
- Missing evidence: no submitted real Recipe IDs bound to the live BiliDili host-agent session, no successful `alembic_dimension_complete`, no measured cells, no terminal session/round cleanup after evidence submission.
- Residual risks: accepting diff-empty seed parity as final success would be a false positive because both sides still have blank measured coverage.
- TODO/backlog rollup: create the next Test package for real session-bound Recipe submission and dimension completion, then rerun final host-vs-in-process parity.
- Decision: accept-target-result.
- Next action: create and dispatch `p15-bilidili-session-bound-recipe-evidence-realtest-p1` to Test.

## Forbidden Conclusions

- Do not complete the demand from this result.
- Do not accept P15, G4, G6, or final parity from `diffEmpty=true` alone.
- Do not classify the open session/round as a Plugin terminal cleanup regression while `hostAgentLifecycle.terminal=false`.
- Do not write or delete BiliDili SQLite/session/round files manually.
- Do not use synthetic Recipe ids or noPadding cleanup to close the session.
- Do not dispatch source repair unless the next Test proves a product-code defect in the public route.
