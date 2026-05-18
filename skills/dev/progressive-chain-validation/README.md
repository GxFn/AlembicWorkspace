# Progressive Chain Validation Skill

Development source: https://github.com/GxFn/progressive-chain-validation.git

Current observed upstream HEAD: `a6c371c8b123fc79f218d362cd6bae61a0679d61`

Owner: GxFn

Workspace role:

- Treat this as a workspace-supported development skill.
- Keep active local development under this directory when the user wants
  AlembicWorkspace to manage changes.
- Do not assume it is installed in Codex runtime unless a sync/link step has
  been performed and recorded.
- When pulling or syncing from the upstream repository, record the source commit
  and any local changes in the relevant workspace control document.

Intended use:

- Progressive validation of multi-step agent work.
- Useful as a complement to workspace acceptance scripts when a task needs
  staged evidence rather than one final status check.

Current contents:

- This directory records the development slot and upstream source after the
  repository rename.
- The upstream repository stores the skill package under
  `progressive-chain-validation/`.
