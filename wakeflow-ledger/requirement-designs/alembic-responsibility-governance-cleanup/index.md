# Alembic Responsibility Governance Cleanup

Status: active intake / user-requested 2026-06-13 / state root created rev 1 / no task package dispatched
Maintained Window: AlembicWorkspace
Date: 2026-06-13
Design Key: alembic-responsibility-governance-cleanup

## Controller Judgment

The user requested a new cleanup demand because the current Alembic-space
charter logic, user-responsibility wording, and gateway or code-logic
management model no longer match the desired operating reality.

The confirmed direction is a simpler responsibility system:

- Alembic mainline defaults to the external AI surface.
- AlembicPlugin defaults to the host AI plugin surface.
- Developers are maintainers/authors represented by the current GitHub author
  information, not runtime permission actors.
- No new developer permission-management model or code-logic management layer
  should be introduced.

This is a cross-repository cleanup demand, but it is not yet an execution wave.
The first required step is evidence collection: identify every affected
document, config, code path, test, and validation gate before deleting,
renaming, or downgrading anything.

## Entry Points

- Requirement design:
  [alembic-responsibility-governance-cleanup-requirement-design-2026-06-13.md](alembic-responsibility-governance-cleanup-requirement-design-2026-06-13.md)
- Current runtime state root:
  `.workspace-active/workspace/current/alembic-responsibility-governance-cleanup`

## Candidate Demand Order

| Order | Candidate | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | G0 fact scan and boundary confirmation | AlembicWorkspace, with product-window code facts | Inventory charter, user responsibility, gateway, permission, code-logic management, and author metadata references. |
| 1 | G1 responsibility model design | Design + AlembicWorkspace | Turn the user direction into a reviewable responsibility model and non-goal list. |
| 2 | G2 Alembic mainline cleanup | Alembic | Align Alembic with the external AI surface and remove or downgrade unsupported governance logic. |
| 3 | G3 AlembicPlugin host cleanup | AlembicPlugin | Align Plugin with the host AI plugin surface and remove unsupported developer permission/code-logic management claims. |
| 4 | G4 shared references and gates | AlembicCore, AlembicAgent, AlembicDashboard as proven by G0 | Reconcile affected shared config, tests, docs, and validation gates without creating empty governance layers. |
| 5 | G5 controller acceptance | AlembicWorkspace | Review raw evidence, deletion gates, representative checks, and archive the accepted result. |

## Cross-Demand Boundaries

- This demand may supersede or re-open parts of earlier governance wording only
  after G0 proves the current code or docs still contain the old model.
- It must not rewrite Git history, author metadata, or GitHub attribution.
- It must not add a developer authorization system.
- It must not preserve a charter, gateway, or permission concept without a real
  consumer and cleanup rationale.
- Product code changes belong to the owning repository windows.

## Validation Backbone

Every deletion or downgrade needs a reference/import scan, a consumer-impact
note, and the owning repository's representative check. Cross-repository
acceptance needs the final responsibility map plus Wakeflow verification or a
recorded existing workspace-verification blocker.

## Stop Conditions

- A cleanup would remove a live runtime route, public API, or compatibility
  path without replacement evidence.
- A charter edit would describe behavior that does not exist.
- A gateway or permission deletion lacks reference/import evidence.
- A new developer permission-management model is introduced.
- The demand turns into prose-only cleanup without code-fact evidence.
