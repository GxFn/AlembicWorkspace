# Workspace Skills

This directory stores reusable Codex skill assets owned by AlembicWorkspace.

These files are workspace assets only. They are not automatically installed into
Codex, bundled into AlembicPlugin, or published anywhere unless a control plan
explicitly assigns that work.

Recommended layout:

- `library/<skill-name>/`: complete workspace-approved skill assets.
- `templates/`: reusable skill templates and drafting helpers.

Skill assets kept here must:

- describe their trigger, scope, and expected user intent;
- avoid secrets, local absolute paths, and environment-specific assumptions;
- name their intended installation or consumption path when they are promoted;
- stay focused on workflow guidance, verification, or coordination rather than
  duplicating child repository runtime implementation.
