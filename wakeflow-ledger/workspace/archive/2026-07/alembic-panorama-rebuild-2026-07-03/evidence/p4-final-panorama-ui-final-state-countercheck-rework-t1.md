# P4 Final Panorama UI Final-State Countercheck Rework

Status: blocked
Target: Test / `p4-final-panorama-ui-final-state-countercheck-rework-t1`
Dispatch group: `p4-final-panorama-ui-final-state-countercheck-rework-p1`
State root: `.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03`
Evidence dir: `evidence/p4-final-panorama-ui-final-state-countercheck-rework-t1/`

## Question

After the prior BiliDili rescan/provider gate passed, open the real
AlembicWorkspace dashboard `http://127.0.0.1:64506/panorama` from a fresh
browser tab with clean storage, wait for all four panorama tabs to finish
loading, and determine whether the UI is free of BiliDili / non-member leakage.

## Result

Blocked. The fresh/clean-storage UI still reproduces the conflict:

- AlembicWorkspace API stays scoped and clean.
- AlembicWorkspace UI final state shows `BiliDili` in the top project button on
  all four tabs.
- The dependencies tab renders BiliDili module names: `Account`, `Following`,
  `Home`, `LiveChat`, `Networking`, `PaginationKit`, `Profile`, `ServiceKit`,
  `VideoFeed`, `VideoPlay`, `WebSocket`.
- Storage does not explain the leak: `localStorageKeys=[]`,
  `sessionStorageKeys=[]`, `cookieLength=0`.

This is not a spinner/header-only gap. All four tabs had post-load text,
no loading signals, and visible screenshots.

## API Contrast

Same-time AlembicWorkspace API:

- `projectRoot=/Users/gaoxuefeng/Documents/AlembicWorkspace`
- `moduleCount=5`, `totalFiles=750`, `totalRecipes=91`
- member roots are the five workspace members:
  `Alembic`, `AlembicCore`, `AlembicPlugin`, `AlembicDashboard`,
  `AlembicAgent`
- raw AW project-scope + panorama payload contains no `BiliDili`,
  `/BiliDili`, or `02a25032`

Same-time BiliDili contrast API:

- `projectRoot=/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- `dataRoot=/Users/gaoxuefeng/.asd/workspaces/02a25032`
- `moduleCount=1`, `totalFiles=138`, `totalRecipes=7`
- no AlembicWorkspace member roots or member names appear in the BiliDili
  contrast payload, except the parent path segment inherent in the BiliDili
  project path.

## UI Evidence

Fresh browser route:

- URL: `http://127.0.0.1:64506/panorama?wfFreshCountercheck=1783399138926`
- Browser storage proof: `aw-fresh-storage-final.json`
- Console logs: `aw-ui-console.json` (`[]`)

Per-tab evidence:

- Overview: `aw-ui-overview.json`, `aw-ui-overview.txt`,
  `aw-ui-overview-visible.png`
- Dependencies: `aw-ui-dependencies.json`, `aw-ui-dependencies.txt`,
  `aw-ui-dependencies-visible.png`
- Graph: `aw-ui-graph.json`, `aw-ui-graph.txt`,
  `aw-ui-graph-visible.png`
- Gaps: `aw-ui-gaps.json`, `aw-ui-gaps.txt`, `aw-ui-gaps-visible.png`

Summary file:

- `countercheck-summary.json`

Note: the first hidden-tab full-page captures produced black images in the
in-app browser. The `*-visible.png` files are the authoritative visual
screenshots after making the browser visible; the DOM/text JSON was collected
from the same tab/session.

## Logs And Cleanliness

- AW daemon health/API snapshots saved under `aw-api-v1-*.json`.
- BiliDili contrast snapshots saved under `bilidili-api-v1-*.json`.
- AW log tail and relevant log lines saved in
  `aw-combined-log-tail.txt`, `aw-relevant-log-lines.txt`, and
  `aw-daemon-log-tail.txt`.
- Product heads / status saved in `product-heads-status.txt`:
  Alembic `76358d9ddbdf3ab9c316718aa841367e4c6f79d5`,
  AlembicDashboard `a1070f2ab52dbea06e94511892e2876074a2af9c`,
  BiliDili `fc66261158d57235dcef2a045bde1206546f6654`,
  AlembicCore `73cb9a340a4044eed68977d5ddbc36491deda674`.
  No source working-tree changes were introduced by this Test task.

## Classification

Return `blocked` to controller. The likely owner route is the
AlembicDashboard/Alembic dashboard runtime state or API-client project-scope
selection chain. Test should not patch product code.

Forbidden operations respected: no source edit, no provider config edit, no
preclean, no data-root deletion, no push/tag/release.
