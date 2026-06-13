# Current Demand Rollup Archive

Archive Date: 2026-06-13
Maintained Window: AlembicWorkspace
Source: `.workspace-active/workspace/current/`

This record compacts the current AlembicWorkspace demand state after the
R-group closeout and TODO archive pass. It does not accept unfinished work. It
only records the controller-visible state-root facts and the remaining
user-gated boundaries.

## Archive Actions Performed

- Ran `wakeflow_archive_todo` with `apply=true` for 2026-06.
- Archived one completed TODO row:
  `AFAPI-REQ-08-PLUGIN-RUNTIME-SNAPSHOT-RELEASE-JUDGMENT`.
- Refreshed archive summaries for 2026-06.
- Dry-ran workspace document archiving for the current status file; Wakeflow
  correctly refused to archive the active current plan.
- Moved generated CKG real-project cold-start test mirrors out of active
  current scanning into `.workspace-local/archive/ckg-real-project-cold-start-tests-2026-06-13/`.
  These are local test artifacts, not active demands or long-term ledger docs.

## State-Root Census

Controller scan of `.workspace-active/workspace/current/*/wakeflow-state.json`
found:

| State | Count | Meaning |
| --- | ---: | --- |
| `completed` | 103 | Accepted or closed demand state roots with no controller blocker. |
| `planned` | 1 | `alembic-0.3.0-release-wave` remains release-ready but not complete. |
| `needs-rework` | 1 | Original CKG3 state root, superseded by completed CKG3R and the CKG v2 handoff. |
| `intake` | 1 | Original cross-repo interface root, superseded by D0-D32 completed child demands. |

## Currently Not Archived As Complete

| Demand | State | Controller Judgment |
| --- | --- | --- |
| `alembic-0.3.0-release-wave` | `planned` rev 11 | R-group release work is release-ready, but the runtime publish is deliberately held for a user trigger. Do not complete/archive as final release until publish and cacheless cold-start verification are run. |
| `alembic-codex-cold-start-knowledge-graph-experience-ckg3-bootstrap-to-recipe-production-integration` | `needs-rework` rev 5 | Historical CKG3 failure record. Its blocker set was consumed by CKG3R, which completed at rev 14. Keep as historical evidence; do not dispatch from this old root. |
| `alembic-cross-repo-interface-contract` | `intake` rev 1 | Parent intake shell. The executable D0-D32 child demands completed and have final governance acceptance records. Do not use this intake shell as an active demand. |

## Completed Requirement Families

| Requirement Family | Current Controller State |
| --- | --- |
| AFAPI 08-12 | Completed; remaining AFAPI TODO judgment archived on 2026-06-13. |
| Alembic cross-repo interface contract D0-D32 | Completed; final governance archive exists under the requirement ledger. |
| Compatibility removal cleanup CR0-CR7 | Completed; final runtime acceptance archive exists. |
| Redundancy and stale-logic cleanup RC0-RC7 | Completed; final acceptance archive exists. |
| Core comprehensive optimization CO0-CO5 | Completed; final acceptance archive exists. |
| Main comprehensive optimization AO0-AO5 | Completed; final acceptance archive exists. |
| Agent comprehensive optimization AG0-AG5 | Completed; final acceptance archive exists. |
| Portfolio execution P0 / Trains A-B-H / P2 / P3 / P4 / P5 | Completed to user-decision boundary. |
| Governance decision enactment | Completed rev 14; closeout record exists. |
| Quality debt burndown | Completed rev 12; closeout record exists. |
| CKG current wave | CKG0-CKG2 completed, CKG3R completed; CKG v2 remains a Codex-window future verification track and is non-blocking for other work. |
| Marketplace/runtime bootstrap MPB0-MPB3 | Completed state roots. |
| Dashboard chat/wiki/candidate AI removal DCR0-DCR7 | Completed state roots. |
| MCP clean output contract | Completed state root. |

## Active Or Held TODO Rows

The active TODO board still intentionally keeps non-completed or user-held rows:

- `TRAIN-H-SCRATCH-REGISTRY-CLEANUP` — real `~/.asd` mutation requires user approval.
- `C7-GHOST-WORKSPACE-DB-CORRUPT` — real `~/.asd` mutation requires user approval.
- `CO3-TAXONOMY-FACADE-PROMOTION` — export-surface decision for a future wave.
- `TEST-INFRA-STALE-DIST-ALIAS` — Plugin pack-path half closed; Alembic/Agent alias-to-dist half remains.
- `CC4-FIRST-SESSION-MCP-CONNECT` — backlog for negative-cache docs plus optional lock fail-fast wave.
- `CC4-TIER-FLIP-CONNECT-CACHE` — host behavior limit deferred to Codex-led CKG or later recert.

Rows marked `resolved-as-status-quo` or `partially closed` are not moved by the
archive tool because they still carry explicit future context or user override
conditions.

## Repository Boundary Snapshot

Wakeflow status repo scan reported clean and even product repositories except
for AlembicPlugin, which has a separate dirty worktree from the Codex cold-start
work. This rollup did not touch product source repositories.

Local generated CKG mirror artifacts were moved out of
`.workspace-active/workspace/current/` so Wakeflow workspace-doc verification no
longer scans their copied repository docs as controller documents.

## Next Controller Boundary

The Workspace controller is idle for demand dispatch. Valid next actions are:

- user-triggered release publish for `@gxfn/alembic-runtime@0.2.0`;
- explicit user instruction for real `~/.asd` cleanup rows;
- user-confirmed future wave intake for open TODO rows;
- Codex-window continuation of CKG v2.

No downstream dispatch should be created from archived, superseded, or completed
state roots.
