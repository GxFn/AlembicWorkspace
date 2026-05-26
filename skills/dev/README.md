# Development Skills

This directory stores skills that are actively developed from
AlembicWorkspace.

Development skills may be edited frequently and can be synced or linked into a
local Codex skills directory for live use when requested. They are not
automatically installed, bundled, or promoted to stable workspace assets.

Current development skills:

- `alembic-workspace-control/`: total-control procedures and references for
  TODO, dispatch, testing, workspace ledger / document-surface, and script
  pipeline work. Hard anti-failure rules remain in workspace `AGENTS.md`.
- `visible-automation-dispatch-target/`: target-window rules for real VAD
  heartbeat claim / finish / courier handoff, with strict role boundaries.
- `visible-automation-dispatch-controller/`: total-control rules for VAD
  controller-return heartbeats, unattended acceptance / retest / next-wave
  decisions, and avoiding small-task drift while pursuing the approved goal.

Promotion path:

1. Develop in `skills/dev/<skill-name>/`.
2. Validate locally.
3. Use from Codex through an explicit sync/link step.
4. Promote to `skills/library/<skill-name>/` when the skill becomes stable.
