# Workspace Skills

This directory stores reusable Codex skill assets owned by AlembicWorkspace.

These files are workspace assets only. They are not automatically installed into
Codex, bundled into AlembicPlugin, or published anywhere unless a control plan
explicitly assigns that work.

Recommended layout:

- `dev/<skill-name>/`: skills that are actively developed from this workspace
  and may be synced into the local Codex skills directory for live use.
- `library/<skill-name>/`: complete workspace-approved skill assets.
- `templates/`: reusable skill templates and drafting helpers.

Skill assets kept here must:

- describe their trigger, scope, and expected user intent;
- avoid secrets, local absolute paths, and environment-specific assumptions;
- name their intended installation or consumption path when they are promoted;
- stay focused on workflow guidance, verification, or coordination rather than
  duplicating child repository runtime implementation.

Current drafts:

- `dev/alembic-workspace-control/`: trial extraction for bulky
  AlembicWorkspace control-center details. It currently holds TODO / Backlog,
  window dispatch, and workspace script pipeline references that used to live
  inline in `AGENTS.md` or ad hoc conversation memory. `AGENTS.md` remains the
  hard boundary source and points to this skill only when those detailed
  workflows are needed.

Development workflow:

1. Keep active skill work in `skills/dev/<skill-name>/`.
2. Validate the skill structure before local use.
3. Sync or link the skill into the local Codex skills directory only when the
   user explicitly wants to use it from Codex runtime.
4. Promote to `skills/library/<skill-name>/` only when the skill is stable and
   meant to be a workspace-approved reusable asset.
