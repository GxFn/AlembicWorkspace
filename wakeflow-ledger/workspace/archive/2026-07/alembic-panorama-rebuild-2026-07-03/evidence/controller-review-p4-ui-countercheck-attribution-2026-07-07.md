# Controller Review: P4 Panorama UI Countercheck Attribution

Demand: `alembic-panorama-rebuild-2026-07-03`
Reviewed target result: `Test / p4-final-panorama-ui-final-state-countercheck-rework-t1`
Dispatch group: `p4-final-panorama-ui-final-state-countercheck-rework-p1`
Controller conclusion: rework required in the Alembic main backend/runtime scope chain.

## Requirement Gate

The P4 final gate requires the real AlembicWorkspace dashboard panorama to show only
the AlembicWorkspace space members across all four panorama tabs, with no BiliDili
leakage, while BiliDili's own dashboard remains non-regressed. The Test result is
therefore an in-scope product blocker, not a new requirement.

## Test Evidence Reviewed

- `target-results/tr-p4-final-panorama-ui-final-state-countercheck-rework-t1.json`
- `evidence/p4-final-panorama-ui-final-state-countercheck-rework-t1.md`
- `evidence/p4-final-panorama-ui-final-state-countercheck-rework-t1/countercheck-summary.json`
- `evidence/p4-final-panorama-ui-final-state-countercheck-rework-t1/aw-fresh-storage-final.json`
- `evidence/p4-final-panorama-ui-final-state-countercheck-rework-t1/aw-ui-dependencies.json`
- `evidence/p4-final-panorama-ui-final-state-countercheck-rework-t1/aw-ui-dependencies-visible.png`
- `evidence/p4-final-panorama-ui-final-state-countercheck-rework-t1/aw-api-v1-project-scope-folders.json`
- `evidence/p4-final-panorama-ui-final-state-countercheck-rework-t1/aw-api-v1-panorama.json`
- `evidence/p4-final-panorama-ui-final-state-countercheck-rework-t1/bilidili-api-v1-panorama.json`

The Test run used a fresh in-app browser tab with empty local/session storage and no
cookie state. The AW panorama and scope APIs stayed scoped to AlembicWorkspace, but
the UI still showed `BiliDili` in the top project button and the Dependencies tab
rendered BiliDili modules after loading.

## Controller Live Probes

Probe target: real AlembicWorkspace daemon on `http://127.0.0.1:64506`.

`GET /api/v1/daemon/health`

- `projectRoot`: `/Users/gaoxuefeng/Documents/AlembicWorkspace`
- `dataRoot`: `/Users/gaoxuefeng/.asd/workspaces/ecf32806`
- `projectScope.displayName`: `AlembicWorkspace`
- `projectScope.folderCount`: `5`
- member folders: `Alembic`, `AlembicCore`, `AlembicPlugin`, `AlembicDashboard`, `AlembicAgent`

`GET /api/v1/modules/dep-graph?level=module`

- `success`: `true`
- returned `projectRoot`: `/Users/gaoxuefeng/Documents/AlembicWorkspace`
- returned node count: `11`
- returned node ids:
  - `module:root:Account:BiliDili`
  - `module:root:Following:BiliDili`
  - `module:root:Home:BiliDili`
  - `module:root:LiveChat:BiliDili`
  - `module:root:Networking:BiliDili`
  - `module:root:PaginationKit:BiliDili`
  - `module:root:Profile:BiliDili`
  - `module:root:ServiceKit:BiliDili`
  - `module:root:VideoFeed:BiliDili`
  - `module:root:VideoPlay:BiliDili`
  - `module:root:WebSocket:BiliDili`

`GET /api/v1/projects`

- `selectedProject.projectId`: `02a25032`
- `selectedProject.displayName`: `BiliDili`
- `selectedProject.projectRoot`: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- `activeRuntimeProject`: `null`
- the same response lists AlembicWorkspace with dashboard URL `http://127.0.0.1:64506`

## Attribution

The first repair owner is Alembic, not AlembicDashboard:

- The Dependencies tab uses the Dashboard modules API client, but the AW daemon's
  own `/api/v1/modules/dep-graph?level=module` endpoint already returns BiliDili
  ProjectContext module nodes while declaring the AW `projectRoot`.
- The AW daemon's `/api/v1/projects` endpoint also reports BiliDili as the selected
  project for the AW dashboard session.
- `/api/v1/daemon/health` and the panorama endpoints are scoped to AW, so the
  defect is a split runtime/source selection path inside the Alembic backend rather
  than a total daemon-root mismatch.

Dashboard may need a later consumer retest, but the next repair should first make
the Alembic backend bind modules/dep-graph and projects selected/active state to
the current AW runtime/scope.

## Repair Acceptance Notes

The Alembic repair should prove:

- AW daemon `/api/v1/modules/dep-graph?level=module` no longer returns BiliDili
  module ids/labels and instead reflects the AW project/scope data, or returns an
  explicitly empty/valid AW-scoped graph if no module dependency graph exists.
- AW daemon `/api/v1/projects` no longer makes stale BiliDili the top selected
  project for the AW dashboard route.
- BiliDili's own project daemon/dashboard remains scoped to BiliDili.
- The panorama overview/health/gaps behavior and rescan/provider chain remain
  unchanged unless directly required by the fix.
