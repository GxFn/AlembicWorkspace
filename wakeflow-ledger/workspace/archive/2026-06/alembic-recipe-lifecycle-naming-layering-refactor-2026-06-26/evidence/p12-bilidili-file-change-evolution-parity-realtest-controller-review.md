# P12 BiliDili File-Change Evolution Parity Realtest - Controller Review

Date: 2026-06-28

Dispatch group: `p12-bilidili-file-change-evolution-parity-realtest-p1`
Task: `p12-bilidili-file-change-evolution-parity-realtest-t1`
Target: `Test`

## Raw Evidence Reviewed

- `Test/tmp/p12-bilidili-file-change-evolution-parity-realtest-t1/p12-run-summary.json`
- `Test/tmp/p12-bilidili-file-change-evolution-parity-realtest-t1/parity-selected-host-vs-daemon.json`
- `Test/tmp/p12-bilidili-file-change-evolution-parity-realtest-t1/after-host-tokenized-code-guard-snapshot.json`
- `Test/tmp/p12-bilidili-file-change-evolution-parity-realtest-t1/after-host-tokenized-code-guard.json`
- `Test/tmp/p12-bilidili-file-change-evolution-parity-realtest-t1/explicit-inprocess-file-change-response.json`
- `Test/tmp/p12-bilidili-file-change-evolution-parity-realtest-t1/after-explicit-inprocess-post.json`
- `Test/tmp/p12-bilidili-file-change-evolution-parity-realtest-t1/evolution-maintenance-sweep-evidence.json`
- `Test/tmp/p12-bilidili-file-change-evolution-parity-realtest-t1/final-after-cleanup.json`
- `Test/tmp/p12-bilidili-file-change-evolution-parity-realtest-t1/final-daemon-health.json`
- Local verification: `git -C BiliDili status --short` returned clean; controller-return delivery run is `sent` with readback OK.

## Controller Findings

1. Baseline was valid: BiliDili checkpoint started at `6f1bf34cf1b6daca4e08895db211939115dac868`, active DB had `evolution_proposals=0`, and SQLite integrity was `ok`.
2. Host path routed the committed tokenized source change: checkpoint advanced to `8224df56b6720b9cc850ddb9d30c6a439a99838c`, `last_route_status` was `routed`, and proposal `ep-1782655456012-2b280e44` was created with `source=file-change`, `verifiedBy=commit-driven-unified-evolution`, `sourceStatus=modified`, `impactLevel=pattern`, and matched tokens including `AppModule`, `ServiceRegistry`, `SchemeRouter`, `moduleDidLoad`, and route/register symbols.
3. Daemon/in-process path routed the same source change: explicit `POST /api/v1/file-changes` returned HTTP 200 with `needsReview=1`, `suggestReview=true`, `impactLevel=pattern`; DB proposal `ep-1782655499392-7270ac7c` had `source=file-change`, `producerKind=alembic-file-monitor`, `changeKind=modified`, and the same source path.
4. Selected host vs daemon normalized parity passed: `semanticDiff=[]`, action `update`, same staging recipe `<redacted>`, same source path `BiliDili/Modules/NetworkModule.swift`, same source class `file-change`, modified change kind, and same semantic matched-token set.
5. Maintenance sweep evidence was captured after proposals: periodic sweep completed; latest captured sweep had `rejectedCount=1`, `waitingCount=5`, and no driver errors. There was no in-flight guard log match in this run, so this evidence proves sweep completion, not a forced concurrent in-flight guard branch.
6. Cleanup boundary is acceptable for this realtest: BiliDili worktree is clean, probe text is absent, `BiliDili/.asd` is absent, final SQLite integrity is `ok`, and daemon health is ready. BiliDili HEAD is left at cleanup revert commit `8487b82d...` rather than the original commit because Test used non-destructive revert cleanup.

## Boundary Judgment

The assigned P12 behavior question is answered: both host and daemon/in-process file-change routes produced semantically equivalent evolution proposals on the same covered BiliDili source change, and the normalized diff is empty.

The public `alembic_code_guard` response still fails MCP schema validation with `unrecognized key "data"`, so the requested public field `data.unifiedEvolution.evidenceGate.verdict` is not readable through that public tool response. Controller does not treat this as a P12 parity failure because the host route is independently proven by the DB checkpoint and proposal side effects (`last_route_status=routed`, proposal verified by `commit-driven-unified-evolution`). This remains a public response-schema evidence-readback risk, not a blocker for accepting the P12 file-change evolution parity result.

Decision recommendation: accept this Test result for P12 realtest closure and continue to P13. Do not count this as fixing the public `alembic_code_guard` schema drift.
