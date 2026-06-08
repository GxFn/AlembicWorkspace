# Legacy AlembicDesign Map

Status: reference map
Maintained By: Design
Last Rebuilt: 2026-06-08

## Purpose

`AlembicDesign/` is the previous Design repository for this workspace. Its
historical plans and handoffs remain in place. This `Design` directory is now
the configured active Design surface.

Use this map to find legacy material without migrating old data into the new
surface.

## Current Authority

- Active Design window: `Design`
- Active Design docs: `Design/docs/current/`
- Active handoff board: `Design/docs/current/workspace-handoff-board.md`
- Historical source: `AlembicDesign/`
- Historical docs: `AlembicDesign/docs/current/`
- Historical board: `AlembicDesign/docs/current/workspace-handoff-board.md`

Do not use old `AlembicDesign` dispatch identity, old
`codex-control-workspace` coordinates, or historical board rows as current
state-machine authority.

## Rebuilt Capability

The following legacy behaviors have been rebuilt in the new surface:

- Design Key stability and board `ID == Design Key`.
- Separation of fact, Design suggestion, user decision, and controller judgment.
- `workspace-signal` as a lightweight controller input, not a TODO mutation.
- `discussion-sequence` as decision-order evidence, not a handoff.
- Handoff readiness language such as `ready-for-workspace`,
  `needs-user-decision`, `needs-code-facts`, and `blocked`.
- Stop rule against turning thin bridges, empty interfaces, or unconfirmed
  Design recommendations into executable scope.

No separate legacy-continuity skill is kept. Historical continuity is a source
lookup concern handled by this map plus the existing Design skills, especially
`Design/skills/design-handoff/SKILL.md`.

## Historical Categories

Important historical Design material remains under
`AlembicDesign/docs/current/`:

- AFAPI and Plugin public-surface work:
  `plugin-agent-facing-public-api-redesign-workspace-handoff-2026-06-04.md`,
  `plugin-codex-public-api-discussion-sequence-2026-06-04.md`,
  `plugin-prime-task-decoupling-*.md`, and
  `plugin-task-public-api-split-addendum-2026-06-04.md`.
- Plugin runtime and MCP work:
  `plugin-mcp-multi-project-runtime-*.md`,
  `plugin-codex-task-lifecycle-redesign-*.md`, and
  `plugin-intent-structured-local-vector-requirement-design-2026-06-04.md`.
- Automation and Wakeflow transport work:
  `codex-direct-thread-dispatch-automation-*.md`,
  `codex-automation-closed-loop-*.md`, and
  `child-window-completion-signal-*.md`.
- Multi-repository and cleanup work:
  `multi-repository-interface-optimization-*.md`,
  `repository-residue-cleanup-requirement-design-2026-05-31.md`, and
  `workspace-workflow-optimization-*.md`.
- PCVM and validation work:
  `progressive-chain-validation-metrics-*.md`,
  `cold-start-stage-optimization-metrics-workspace-signal-2026-05-25.md`, and
  `timeline-artifact-recipe-drawer-optimization-*.md`.

For complete legacy inventory, read the source directory directly:

```bash
find AlembicDesign/docs/current -maxdepth 1 -type f -name '*.md' -print
```

## Use Rules

- Read historical artifacts in place.
- Create a new current artifact only when the user or controller asks for a
  refreshed plan, signal, requirement design, or handoff.
- When refreshing, keep the old `Design Key` only if it is the same requirement;
  create a new key if scope, completion definition, or user-visible behavior
  changed.
- Do not copy old localhost URLs, old status rows, old thread ids, or old
  controller-machine fields into current documents.
