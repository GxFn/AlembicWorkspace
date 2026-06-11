# Requirement Designs

Status: starter ledger directory
Maintained Window: AlembicWorkspace controller

## Purpose

This directory stores requirement-level planning assets for the installed
workspace. It does not replace the active controller index, state roots, task
packages, or per-window evidence records.

Use one subdirectory per substantial demand:

```text
<demand-slug>/
  README.md
  original-plan-YYYY-MM-DD.md
  requirement-design-YYYY-MM-DD.md
  code-implementation-dependency-research-YYYY-MM-DD.md
```

## Workflow

1. Capture the original user/developer goal before designing implementation.
2. Wait for confirmation when the original goal, scope, or completion
   definition is unclear.
3. Ground requirement design in local code facts and any necessary external
   references.
4. Record producer/consumer dependencies, state changes, validation, and
   non-goals.
5. Move toward goal-stage confirmation only after the requirement design is
   reviewable.

## Current Demand Sets

- `plugin-agent-facing-public-api-redesign/`: AFAPI remaining demands rebuilt
  for Wakeflow. AFAPI 01-07 are completed upstream; AFAPI 08-12 are queued as
  new Wakeflow demand definitions and must be claimed one at a time.
- `alembic-plugin-marketplace-runtime-bootstrap/`: Candidate requirement to
  change AlembicPlugin public marketplace distribution from embedded
  `runtime.tgz` / `node_modules` artifact delivery to a lightweight plugin
  shell plus pinned npm runtime package installed by the MCP startup path.
- `alembic-dashboard-chat-wiki-candidate-ai-removal/`: Candidate deletion
  requirement to remove candidate field completion/refinement plus Dashboard
  Chat, Wiki, and Signal pages/surfaces, and delete related page-specific
  Plugin HTTP, MCP, Core guidance, help, i18n, docs, and test support.

## Boundaries

- Requirement designs are not dispatch plans.
- Design candidates are not accepted goals until the controller records that
  decision.
- Current active execution belongs in `.workspace-active/workspace/current/` or
  a Wakeflow state root.
- Per-window completion evidence belongs in the matching window ledger.

## Templates

- `templates/original-plan-template.md`
- `templates/requirement-design-template.md`
- `templates/goal-stage-confirmation-template.md`
