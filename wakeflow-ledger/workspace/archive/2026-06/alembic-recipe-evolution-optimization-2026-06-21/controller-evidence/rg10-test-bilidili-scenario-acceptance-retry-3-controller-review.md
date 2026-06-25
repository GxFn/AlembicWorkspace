# RG-10 Test BiliDili Scenario Acceptance Retry 3 Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg10-test-bilidili-scenario-acceptance-retry-3-p1`
Task: `rg10-test-bilidili-scenario-acceptance-retry-3-t1`
Target: Test

## Controller Verdict

- User goal: finish RG-10 real BiliDili acceptance for the confirmed Recipe evolution demand, or route the smallest remaining in-scope repair.
- Scope reviewed: Wakeflow review pack, Test TargetResultEnvelope, Test summary, raw MCP probe JSON, and rescan-after-reconfirm JSON.
- Original requirement authority: RG-10 still requires the real BiliDili four-step chain: truthful Plan, scoped ProjectContext-anchored Recipe creation/retrieval, commit-driven evolution classification/routing, and observable vector degradation. This retry is acceptance evidence, not a new scope source.
- Test boundary: Test used isolated BiliDili worktree evidence and did not modify the original BiliDili checkout. It used AlembicPlugin `26361f24e006915cb5e83004aa81f7c192471b45` and AlembicCore `b18754d1ff238613af8619c294787f6a4ca6d4d8`.
- Positive evidence: Plan draft and strict confirm succeeded without `allowSignatureMismatch`; focused bootstrap succeeded with matching Plan signature; vector-degraded submit/retrieval stayed observable; first post-commit rescan correctly blocked on `PLAN_PROJECT_CONTEXT_STALE`; after Plan refresh/reconfirm, rescan returned ready with signature match.
- Positive evidence: Retry-3 proves the prior Plugin repair partially improved public output. Rescan preserved moduleScope for `Sources/Features/VideoFeed`, `Sources/Infrastructure/Networking`, and `Sources/RG10AcceptanceProbe`; top-level `gitDiffEvidence` surfaced rename/modified/created events; `generationChangeLog` and `recommendations` contain a new-module recommendation for `Sources/RG10AcceptanceProbe/RG10AcceptanceProbe.swift`.
- Blocking evidence: high-confidence rename sourceRef repair still fails in public output. After reconfirmed rescan, `planState.codeRecipeMapping` still reports missing old path `Sources/Features/VideoFeed/VideoFeedViewModel.swift:1-78` as `generated` and `active`, and `alembic_recipe_map` still mounts recipe `<redacted>` with the old sourceRef. `evolution.classificationCounts.renamed=1` but `repaired=0`.
- Blocking evidence: logic-change proposal lifecycle still fails. The same rescan reports `modified=1` for `Sources/Infrastructure/Networking/Repository/FeedRepository.swift`, but `pendingProposals=[]`, `proposals=[]`, and no source-modified generationChangeLog entry appears.
- Blocking evidence: public unified evolution routing is internally inconsistent. The rescan top-level `gitDiffEvidence` reports `dirtyPathCount=3`, `eventCount=3`, `headChanged=true`, and the expected rename/modified/created events, while `unifiedEvolution.evidenceGate.verdict` is `no-op` and nested `unifiedEvolution.gitDiffEvidence` reports `dirtyPathCount=0`, `eventCount=0`, and `headChanged=false`.
- Controller conclusion: the Test result is valid blocked evidence for an AlembicPlugin product gap, not a Test/environment blocker. The final RG-10 acceptance chain is still incomplete.
- TODO/backlog rollup: Do not redispatch Test again yet. Create one AlembicPlugin rework package for the remaining public `alembic_rescan` commit-driven evolution gap, then rerun RG-10 Test after controller accepts the product repair.
- Decision: request-rework.
- Next action: decide this candidate as rework and dispatch AlembicPlugin repair.

## Raw Evidence Notes

- Target result: `.wakeflow-active/current/alembic-recipe-evolution-optimization-2026-06-21/target-results/tr-rg10-test-bilidili-scenario-acceptance-retry-3-t1.json`
- Test summary: `Test/tmp/rg10-test-bilidili-scenario-acceptance-retry-3-20260622/evidence/rg10-retry3-target-result-summary.md`
- Probe JSON: `Test/tmp/rg10-test-bilidili-scenario-acceptance-retry-3-20260622/evidence/rg10-retry3-mcp-probe.json`
- Rescan JSON: `Test/tmp/rg10-test-bilidili-scenario-acceptance-retry-3-20260622/evidence/rg10-retry3-rescan-after-reconfirm.json`
- Controlled BiliDili commit: `1f911b1fe0db4672a71e4df885f39c69833f3923`, renaming `VideoFeedViewModel.swift`, modifying `FeedRepository.swift`, and creating `Sources/RG10AcceptanceProbe/RG10AcceptanceProbe.swift`.
- Review candidate: `tc-20260622054801-0089`.

## Repair Constraints For AlembicPlugin

- Keep the repair narrow to public `alembic_rescan` commit-driven evolution output and underlying Plugin routing/state projection.
- Preserve confirmed Plan authority, no Plan/generation-state double write, no daemon/watch behavior, and no broad Recipe quality work.
- Acceptance needs targeted tests or scenario coverage that reproduces retry-3's shape: after Plan refresh/reconfirm, top-level git diff evidence and `unifiedEvolution` must agree on the same rename/modified/created events; high-confidence rename must repair or explicitly stale-mark the old sourceRef with public lifecycle evidence; logic modified paths must produce pendingProposals or generationChangeLog/equivalent public evidence; new-module recommendation must remain present; moduleScope must remain preserved.
