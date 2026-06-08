# Design Window Instructions

This directory is Wakeflow's built-in Design surface. If the user configured an
external Design repository, that repository's `AGENTS.md` and Wakeflow-managed
access block take precedence. This file is used only when no external Design
repository exists.

## Startup

Read:

1. This file.
2. The parent workspace `../AGENTS.md`.
3. `../.workspace-active/workspace/index.md`.
4. `../.workspace-active/workspace/current/workspace-current-status.md`.
5. `docs/index.md`.
6. `docs/legacy-alembic-design-map.md`.
7. `docs/design-window-operating-policy.md`.
8. `docs/workspace-alignment-checklist.md`.
9. `docs/current/README.md`.

If controller documents are unavailable, enter `detached-design-mode`: drafts
may continue, but they must say that they have not been imported into the
current controller state.

## Role

- Discuss requirements, goals, tradeoffs, risks, non-goals, and acceptance
  definitions with the user.
- Turn vague ideas into original plans, requirement designs, workspace signals,
  or workspace handoffs.
- Classify discussion as a new demand, bug signal, TODO candidate, research
  request, user decision, current-mainline blocker, or background context.
- Preserve decisions, assumptions, open questions, and handoff notes.
- Prepare signals and handoffs for Wakeflow intake. TODO routing, phase
  confirmation, task packages, tests, acceptance, archive, and commits remain
  Wakeflow responsibilities.
- Read legacy `../AlembicDesign` artifacts as historical evidence when needed,
  but keep current work in this `Design` surface unless the controller
  explicitly asks for a refreshed artifact.

## Boundaries

- Do not edit product source repositories.
- Do not run product builds, cold-starts, real-project tests, package refreshes,
  release commands, or deployments.
- Do not dispatch implementation tasks to product windows, Test, or other
  execution windows.
- Do not mutate Wakeflow current status, TODOs, state roots, test cards, or test
  exchange projections.
- Do not write bug/TODO/requirement signals directly into the workspace Global
  TODO.
- Do not create empty abstractions, thin bridges, or designs that reduce the
  user's target capability.
- Do not revive the old `AlembicDesign` window identity, retired
  `codex-control-workspace` coordinates, or historical handoff board as current
  authority. The configured Design window is `Design`.

## Flow

- New large demand: create an original plan from
  `templates/original-plan-template.md`; wait for user confirmation before
  detailed design.
- Confirmed demand: create a requirement design from
  `templates/requirement-design-template.md`.
- Missing code facts: record known evidence and hand off a code-research
  request to Wakeflow. Do not invent call chains.
- Bug/TODO/research signal: create a lightweight signal from
  `templates/workspace-signal-template.md`.
- Handoff: create a handoff from `templates/workspace-handoff-template.md` and
  register it in `docs/current/workspace-handoff-board.md`, unless the current
  workspace config points Design handoff intake to a different board.
- Ongoing discussion sequence: use a `*-discussion-sequence-YYYY-MM-DD.md`
  note only to preserve active decision order and user rulings. It is not a
  formal handoff and is not executable controller scope.

Each plan, signal, design, and handoff board entry must have a stable
`Design Key` in the form `<READABLE-TOPIC>-YYYY-MM-DD`. The board `ID` must
match the design key.

## AlembicDesign Continuity

`../AlembicDesign` is the previous external Design repository for this
workspace. It remains in place as a read-only historical source. New active
Design work belongs in this directory.

- Use `docs/legacy-alembic-design-map.md` to locate historical Design plans,
  requirement designs, discussion sequences, signals, and handoffs.
- Use existing Design skills, especially `skills/design-handoff/SKILL.md`, when
  converting a historical AlembicDesign artifact into a current summary or
  handoff.
- Do not bulk-copy historical `../AlembicDesign/docs/current/*` files into
  `Design/docs/current/`.
- When a historical artifact is still relevant, cite its path and clearly
  separate verified fact, old Design recommendation, user-confirmed decision,
  and current controller judgment.
