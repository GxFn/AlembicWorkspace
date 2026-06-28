# Controller Review: P10 BiliDili rerun after combined source repairs

Date: 2026-06-28
Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-p1`
Target task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1`
Target window: `Test`
Controller verdict: request source rework

## Scope Reviewed

The reviewed Test card asked whether real BiliDili P10 recovers after the accepted
AlembicPlugin noPadding cleanup repair (`9eaf89a`) and Alembic root moduleScope
alias repair (`bf328ea`). The required gate was not just non-empty output: the
normalized host vs in-process coverage ledger diff had to be empty.

Reviewed raw evidence:

- `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1-report.md`
- `evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1-summary.json`
- `target-results/tr-p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/after-nopadding-cleanup-with-recipe-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/after-host-rescan-nopadding-with-recipe-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/final-snapshot.json`
- `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-t1/parity-diff.json`

## Evidence Findings

The two prior source-repair goals are proven improved in real BiliDili:

- The terminal noPadding candidate-insufficient path with submitted recipe ids
  released the file-backed host-agent session: active session count `0`,
  matching project count `0`, open rounds `0`.
- Host bootstrap/rescan reached `coverageLedgerSeed`, wrote a non-empty
  coverage ledger, and ended with no active session or open round.
- In-process bootstrap/rescan with `moduleScope=["BiliDili"]` completed, kept
  nested targets, wrote a non-empty coverage ledger, and ended with no active
  session or open round.
- Provider evidence stayed on DeepSeek generation and local Qwen embedding.
- The result is comparable and not a `0 vs 0` false pass.

The remaining P10 hard gate still fails:

- Host coverage ledger row count: `8`.
- In-process coverage ledger row count: `15`.
- `parity-diff.json` reports `comparable=true`, `diffEmpty=false`,
  `onlyHost=8`, `onlyInprocess=15`.

The diff is a module-axis / seed-shape mismatch:

- Host rows use aggregate or canonical roots, for example `BiliDili`, `Sources`,
  `Packages/AOXFoundationKit`, `Packages/AOXNetworkKit`, `Packages/AOXPlayer`,
  `Packages/AOXUIKit`, `root`, and `module:root:BiliDili:BiliDili`.
- In-process rows use ProjectMap target-scoped ids, for example
  `target:Account:Sources/Infrastructure/Account`,
  `target:ServiceKit:Sources/Core/ServiceKit`, and package target ids.

## Source Ownership

Controller source inspection points to AlembicPlugin as the first repair owner:

- `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  builds host rescan coverage modules from `analysis.moduleSeeds` plus
  `planGate.moduleBindings`.
- `HostAgentProjectContextAnalysis` already carries `presenterInput.map?.modules`,
  but the host coverage seed path does not use that ProjectMap module axis.
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts` builds
  in-process coverage modules from `projectMapModules`, producing the target
  axis currently expected by the Test parity artifact.
- `AlembicCore` provides the shared builder/repository; current evidence points
  to caller input mismatch, not a Core builder defect.

## Decision

Decision: request rework.

This is a product-code defect in the P10 parity route, not a Test blocker and
not a user/design decision. The next source package should repair the
AlembicPlugin host rescan coverage-ledger module axis so the host path writes
the same target-scoped ProjectMap axis as in-process, or returns a grounded
blocker proving a shared Core/Alembic helper is required.

Forbidden conclusions:

- Do not accept P10 real-test or G4 from this result.
- Do not treat non-empty host and in-process ledgers as success while
  `diffEmpty=false`.
- Do not manually repair BiliDili DB/session files.
- Do not re-open the already-proven noPadding cleanup or root alias repairs
  unless new evidence contradicts this review.
