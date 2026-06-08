# Workspace Record Map

Status: starter long-term map
Maintained Window: AlembicWorkspace controller

This map is the long-term entrypoint for project-specific Wakeflow records. The
active workspace should link here instead of scattering direct links to old
archive files.

## Current Entries

| Type | Entry | Description |
| --- | --- | --- |
| Active workspace | ../../.workspace-active/workspace/ | Current index, status, TODOs, Design/Test intake, and state roots. |
| Requirement designs | ../requirement-designs/ | Original plans, requirement designs, and code implementation dependency research. |
| AFAPI remaining demands | ../requirement-designs/plugin-agent-facing-public-api-redesign/ | AFAPI 08-12 rebuilt for the new Wakeflow controller surface; AFAPI 01-07 are completed upstream and not recreated. |
| Goal-stage confirmation | ../goal-stage-confirmation/ | Reusable goal/stage confirmation process. |
| Archive | archive/ | Completed or superseded workspace history. |

## TODO Records

| Record | Entry | Description |
| --- | --- | --- |
| Active TODO board | ../../.workspace-active/workspace/current/global-todo-board.md | Current non-completed TODO, hold, and scheduling rows. |
| AFAPI completed TODO archive | archive/2026-06/global-todo/ | Completed AFAPI 08-12 demand rows and closed probe-policy row compacted from the active TODO board. |

## Requirement Completion Records

| Record | Entry | Description |
| --- | --- | --- |
| AFAPI 08-12 completed demands | archive/2026-06/afapi-completed-demands/ | Demand-level completion summary for AFAPI 08-12, including final revisions, controller conclusions, and evidence maps. |

## Workflow References

| Topic | Entry | Description |
| --- | --- | --- |
| Requirement to wave flow | requirement-to-wave-execution-flow.md | Standard path from Design/user demand to task packages. |
| TODO and window scheduling | todo-window-scheduling-policy.md | How TODOs affect active plans and dispatch. |
| Archive policy | workspace-doc-archive-policy.md | When and how current docs move to the long-term archive. |

## Window Evidence

Per-window ledgers live next to this workspace ledger:

```text
wakeflow-ledger/<WindowName>/
```

Each window ledger keeps collaboration notes, acceptance evidence, and handoff
records that are too project-specific for the reusable Wakeflow package.

## Archive Topics

| Topic | Directory | Description |
| --- | --- | --- |
| 2026-06/afapi-completed-demands | archive/2026-06/afapi-completed-demands/ | AFAPI 08-12 demand-level completion summary with final revisions, conclusions, and evidence map. |
| 2026-06/global-todo | archive/2026-06/global-todo/ | Completed AFAPI 08-12 demand TODO history and closed probe-policy row compacted on 2026-06-07. |
