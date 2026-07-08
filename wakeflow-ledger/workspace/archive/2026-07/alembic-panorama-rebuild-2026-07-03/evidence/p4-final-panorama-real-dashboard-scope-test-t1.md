# P4 Final Panorama Real Dashboard Scope Test

Status: blocked
Target window: Test
Task: p4-final-panorama-real-dashboard-scope-test-t1
Task package: p4-final-panorama-real-dashboard-scope-test-p1
State root: .wakeflow-active/current/alembic-panorama-rebuild-2026-07-03
Observed at: 2026-07-07T10:23+08:00

## Identity And Boundary

- Window identity confirmed: Test.
- Repository boundary: no product source edits, commits, checkout, reset, push, tag, release, snapshot-table deletion, or broad data-root cleanup by Test.
- Accepted commit heads matched the task package before runtime verification:
  - AlembicCore: 73cb9a340a4044eed68977d5ddbc36491deda674
  - Alembic: 9ccca4b212cacf022a8d46fc13f92f666cd4376e
  - AlembicDashboard: a1070f2ab52dbea06e94511892e2876074a2af9c

## Runtime

- Existing AlembicWorkspace daemon initially returned 404 for /api/v1/panorama*.
- Restarted AlembicWorkspace runtime with current accepted heads:
  - command: env -u ALEMBIC_TEST_MODE -u ALEMBIC_TEST_BOOTSTRAP_DIMS -u ALEMBIC_TEST_RESCAN_DIMS node Test/scripts/restart-alembic.mjs --project /Users/gaoxuefeng/Documents/AlembicWorkspace --json --wait 30000 --no-ai-fallback
  - Dashboard URL: http://127.0.0.1:60200
  - PID: 17665
  - projectRoot: /Users/gaoxuefeng/Documents/AlembicWorkspace
  - dataRoot: /Users/gaoxuefeng/.asd/workspaces/ecf32806
  - projectScopeId: project-scope-a8083fdb335c
  - test mode: disabled

## Gate Results

Gate 1: AlembicWorkspace Panorama endpoint/UI scope

- Result: blocked.
- /api/v1/daemon/health stayed healthy and jobs API responded.
- After restart, these required endpoints did not return within 30 seconds and produced curl exit 28 with 0 bytes received:
  - GET /api/v1/panorama
  - GET /api/v1/panorama/health
  - GET /api/v1/panorama/gaps
- The Dashboard /panorama page rendered the shell and all four tab controls, but no overview data body was visible:
  - 概览
  - 依赖关系
  - 知识图谱
  - 知识空白
- Daemon process showed high CPU after the panorama endpoint attempts, consistent with endpoint build/query blocking rather than whole-service unavailability.

Gate 2: BiliDili contrast

- Result: not executed.
- Reason: P4 stop condition triggered at Gate 1 because required AlembicWorkspace raw endpoint responses were missing/timeouts. Continuing into contrast testing would not rescue the primary gate and would expand runtime disturbance.

Gate 3: scoped rescan or equivalent incremental-chain proof

- Result: not executed.
- Reason: same stop condition. No rescan was triggered after the Panorama endpoint timeout/high-CPU condition.

## Evidence Files

- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-environment.json
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-project-scope-folders.json
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-pre-restart-panorama-not-found.json
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-pre-restart-panorama-health-not-found.json
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-pre-restart-panorama-gaps-not-found.json
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-panorama-endpoint-timeouts.json
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-panorama-ui-initial.png
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-panorama-ui-visible.json
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-panorama-ui-console.json
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-daemon-ps-after-panorama-timeout.txt
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-combined-log-tail.txt
- evidence/p4-final-panorama-real-dashboard-scope-test-t1/alembicworkspace-error-log-tail.txt

## Conclusion

P4 cannot pass in this run. The restored route family is mounted after rebuild/link, but the required Panorama endpoints hang on AlembicWorkspace and the UI remains a shell without data. Controller should route this as a product/runtime blocker for the Panorama endpoint build path before re-running P4.
