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
| Completed TODO archive | archive/2026-06/global-todo/ | Completed AFAPI 08-12 demand rows, closed probe-policy history, and the AFAPI-REQ-08 transient runtime-snapshot judgment compacted from the active TODO board. |

## Requirement Completion Records

| Record | Entry | Description |
| --- | --- | --- |
| AFAPI 08-12 completed demands | archive/2026-06/afapi-completed-demands/ | Demand-level completion summary for AFAPI 08-12, including final revisions, controller conclusions, and evidence maps. |
| Current demand rollup, 2026-06-13 | archive/2026-06/current-demand-rollup/current-demand-rollup-2026-06-13.md | Workspace-wide demand census after the R-group closeout: 103 completed state roots, release publish held for user trigger, old CKG3 superseded by CKG3R, interface parent intake superseded by D0-D32. |
| Alembic redundancy & stale-logic cleanup RC0-RC7 | ../requirement-designs/alembic-redundancy-stale-logic-cleanup/final-acceptance-archive-2026-06-12.md | Eight-demand cleanup sequence completed 2026-06-12: five-repo final gate sweep green + strict drift gate both sides, Dashboard zero code diff, all audit items dispositioned (audit doc §9), seven structural-debt design candidates decided (RC6 register) as future demands. |
| AlembicCore comprehensive optimization CO0-CO5 | ../requirement-designs/alembic-core-comprehensive-optimization/final-acceptance-archive-2026-06-12.md | Six-demand hardening sequence completed 2026-06-12: public surface 140→126 with prescriptive gate, lint-enforced layer contract, seven silent-to-loud failure-semantics repairs (census silent 80→72), test floor +65 suites tests (vitest 1133), final gate matrix green incl. release:check; one real data defect (per-recipe totalCount) found and repaired by the new floor; open decisions registered (coverage enforcement pending user; scanner blind-spot + Plugin migrations post-CKG). |

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
| 2026-06/current-demand-rollup | archive/2026-06/current-demand-rollup/ | Current demand-state rollup after the 2026-06-13 R-group closeout. |
| 2026-06/global-todo | archive/2026-06/global-todo/ | Completed TODO history compacted through 2026-06-13. |
