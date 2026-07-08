# Target Evidence: p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1

Status: completed

Window: Test
Task: p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1
Dispatch group: p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-p1
State root: .wakeflow-active/current/alembic-panorama-rebuild-2026-07-03

## Scope

This run verified the real dashboard after the Alembic dep-graph project-selection repair. It did not edit product source, tracked config, secrets, registry scope, or data roots. Test evidence was written under:

`.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1/`

## Runtime Proof

- Alembic was built before restart with `npm run build`: passed.
- Alembic HEAD used for runtime: `a5f8ff4d900b16abe5041c0d04b08e3f9db1ba7b`, satisfying the required accepted repair commit or later gate.
- AlembicWorkspace daemon restart:
  - Evidence: `restart-aw.json`
  - `ok=true`, `ready=true`
  - Dashboard/API: `http://127.0.0.1:50866`
  - Project root: `/Users/gaoxuefeng/Documents/AlembicWorkspace`
  - Data root: `/Users/gaoxuefeng/.asd/workspaces/ecf32806`
  - PID: `52054`
  - Preclean skipped.
  - AI config source: target project settings.
  - Embed config: `ALEMBIC_EMBED_PROVIDER=ollama`, `ALEMBIC_EMBED_MODEL=qwen3-embedding:0.6b`, `ALEMBIC_EMBED_BASE_URL=http://127.0.0.1:11434`.
- BiliDili daemon restart:
  - Evidence: `restart-bilidili.json`
  - `ok=true`, `ready=true`
  - Dashboard/API: `http://127.0.0.1:50897`
  - Project root: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
  - Data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
  - PID: `54345`
  - Preclean skipped.

## AlembicWorkspace API Evidence

Raw response files:

- `aw-api-v1-daemon-health.json`
- `aw-api-v1-projects.json`
- `aw-api-v1-project-scope-folders.json`
- `aw-api-v1-panorama.json`
- `aw-api-v1-panorama-health.json`
- `aw-api-v1-panorama-gaps.json`
- `aw-api-v1-modules-dep-graph-level-module.json`

Observed result:

- `/api/v1/projects` selected project is `AlembicWorkspace`, project id `ecf32806`, and active runtime project is also `AlembicWorkspace`.
- `/api/v1/project-scope/folders` returns exactly 5 active folders:
  - `Alembic` as `primary-source`
  - `AlembicCore` as `source`
  - `AlembicPlugin` as `source`
  - `AlembicDashboard` as `source`
  - `AlembicAgent` as `source`
- `/api/v1/modules/dep-graph?level=module` is scoped to project root `/Users/gaoxuefeng/Documents/AlembicWorkspace` and returns exactly 5 nodes:
  - `project-scope:Alembic`
  - `project-scope:AlembicAgent`
  - `project-scope:AlembicCore`
  - `project-scope:AlembicDashboard`
  - `project-scope:AlembicPlugin`
- The AlembicWorkspace dep-graph response does not contain `BiliDili` or `02a25032`.

Boundary note: `/api/v1/projects` still lists all registered projects, including BiliDili, as registry inventory. The scoped evidence is the selected/active runtime project plus ProjectScope and dep-graph payloads, not registry list removal.

## AlembicWorkspace UI Evidence

The browser opened `http://127.0.0.1:50866/panorama?wfFresh=p4-depgraph-selection-repair` in a clean same-origin context. Local storage keys, session storage keys, and cookies were empty for the capture.

Captured tabs and screenshots:

- Overview: `aw-ui-overview.json`, `aw-ui-overview.txt`, `aw-ui-overview-visible.png`
- Dependencies: `aw-ui-dependencies.json`, `aw-ui-dependencies.txt`, `aw-ui-dependencies-visible.png`
- Knowledge graph: `aw-ui-graph.json`, `aw-ui-graph.txt`, `aw-ui-graph-visible.png`
- Gaps: `aw-ui-gaps.json`, `aw-ui-gaps.txt`, `aw-ui-gaps-visible.png`
- Summary: `aw-ui-tabs-summary.json`

Observed result:

- All four required tabs were visible and clicked exactly once: `概览`, `依赖关系`, `知识图谱`, `知识空白`.
- The project control/button text was `AlembicWorkspace`.
- Every captured AlembicWorkspace tab contained `AlembicWorkspace`.
- No captured AlembicWorkspace tab contained `BiliDili` or `02a25032`.
- The Dependencies tab showed `包列表 (5)` and `依赖边 (0)`, consistent with the scoped 5-node dep-graph.

Representative screenshot:

`/Users/gaoxuefeng/Documents/AlembicWorkspace/.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1/aw-ui-dependencies-visible.png`

## BiliDili Contrast Evidence

Raw response files:

- `bd-api-v1-daemon-health.json`
- `bd-api-v1-projects.json`
- `bd-api-v1-panorama.json`
- `bd-api-v1-panorama-health.json`
- `bd-api-v1-panorama-gaps.json`
- `bd-api-v1-modules-dep-graph-level-module.json`
- `bd-api-v1-jobs-rescan-compact.json`

Observed API result:

- `/api/v1/projects` selected project is `BiliDili`, project id `02a25032`.
- `/api/v1/modules/dep-graph?level=module` is scoped to project root `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili` and returns 15 nodes:
  - `Account`
  - `AOXFoundationKit`
  - `AOXNetworkKit`
  - `AOXPlayer`
  - `AOXUIKit`
  - `Following`
  - `Home`
  - `LiveChat`
  - `Networking`
  - `PaginationKit`
  - `Profile`
  - `ServiceKit`
  - `VideoFeed`
  - `VideoPlay`
  - `WebSocket`
- The BiliDili dep-graph does not contain AlembicWorkspace member nodes such as `AlembicAgent`.

Observed UI result:

- The browser opened `http://127.0.0.1:50897/panorama?wfFresh=p4-depgraph-selection-repair-bd` in a clean same-origin context.
- All four BiliDili tabs were captured.
- The project control/button text was `BiliDili`.
- BiliDili Dependencies showed `包列表 (15)` with BiliDili modules.
- `AlembicWorkspace` appears in BiliDili text only as the parent path segment of `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`; it did not appear as AlembicWorkspace ProjectScope member data.

Representative screenshot:

`/Users/gaoxuefeng/Documents/AlembicWorkspace/.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1/bd-ui-dependencies-visible.png`

## BiliDili Scoped Rescan And Provider Proof

Helper:

- `run-bilidili-rescan-proof.mjs`

Request:

```json
{
  "reason": "p4-panorama-depgraph-selection-repair-rerun-scoped-terminal-proof",
  "dimensions": ["architecture"],
  "maxFiles": 4,
  "contentMaxLines": 40,
  "maxRounds": 1,
  "scaleCap": 1
}
```

Evidence files:

- `bilidili-rescan-submit.json`
- `bilidili-rescan-polls.jsonl`
- `bilidili-rescan-status-latest.json`
- `bilidili-rescan-events-latest.json`
- `bilidili-rescan-display-snapshot-latest.json`
- `bilidili-rescan-jobs-latest.json`
- `bilidili-rescan-final-summary.json`
- `bilidili-rescan-run.log`
- `provider-and-rescan-log-lines.txt`

Observed result:

- Job id: `rescan_mra7tn96_508f639e`
- Bootstrap session id: `bs_1783402536916_bhly1s`
- Final status: `completed`
- Created at: `2026-07-07T05:35:35.418Z`
- Completed at: `2026-07-07T05:47:49.126Z`
- Progress: `completed=1`, `failed=0`, `cancelled=0`, `percent=100`, `totalToolCalls=29`
- Summary diagnostics: `v3-pipeline-complete: 1`
- Display snapshot available with checksum `d18144c24985ca50eb310e6b3f39bcccca0216e8e687d52e0ab9346f99812cc2`.
- Runtime log proof includes `AiFactory`, `Dedicated embed provider`, `ollama`, `qwen`, and terminal completion lines (`Dimension metrics recorded`, `Task "architecture" completed`, `Daemon bootstrap job finalized`, `Pipeline complete`).

Boundary note: the generation provider is DeepSeek (`deepseek-v4-pro`) while embedding used the local Ollama/Qwen route configured for AlembicWorkspace runtime. The evidence does not show a DeepSeek embedding fallback.

## Repository State Check

After the run:

- `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`: `main...origin/main [ahead 7]`, no dirty files.
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`: `main...origin/main`, no dirty files.
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicDashboard`: `main...origin/main [ahead 1]`, no dirty files.
- Top workspace had pre-existing Design/doc and untracked marker/document changes outside this Test evidence path; Test did not modify them.

## Conclusion

The rerun passes the Test card:

- AlembicWorkspace dashboard and APIs selected AlembicWorkspace and used the `ecf32806` data root.
- AlembicWorkspace ProjectScope and dep-graph were constrained to the five expected Alembic source folders.
- The prior BiliDili/`02a25032` dep-graph leakage was not reproduced in AlembicWorkspace API or UI captures.
- BiliDili remained independently scoped to BiliDili and retained its 15-module dep-graph.
- A BiliDili scoped rescan completed successfully without preclean or data root deletion, with local Ollama/Qwen embedding provider evidence and terminal completion proof.
