# Workspace Scripts

This directory stores AlembicWorkspace-owned scripts for coordination,
verification, documentation maintenance, and cross-repository guardrails.

Scripts in this directory should:

- operate from the workspace root unless documented otherwise;
- avoid secrets, tokens, local absolute paths, and network access by default;
- avoid writing into child source repositories unless a current control plan
  explicitly assigns that work;
- report clear pass/fail evidence that can be pasted into workspace docs.

Current scripts:

- `collect-repo-status.mjs`: summarizes branch, HEAD, dirty state,
  untracked files, and latest commit for each workspace child repository.
- `check-workspace-boundary.mjs`: verifies that child source repositories and
  local noise files are not tracked by the workspace Git repository.
- `verify-workspace-docs.mjs`: checks the workspace index, current control
  plan, required sections, Markdown links, and completed document references.
- `check-dispatch-coverage.mjs`: verifies that the current control plan covers
  every expected window and that the declared copyable prompt send list matches
  task statuses.
- `archive-workspace-docs.mjs`: dry-run by default; moves completed workspace
  control documents into `docs/workspace/archive/YYYY-MM/<topic>/` and rewrites
  index links only when `--apply` is provided.

Suggested pre-acceptance sequence:

```bash
node scripts/check-workspace-boundary.mjs
node scripts/collect-repo-status.mjs
node scripts/verify-workspace-docs.mjs
node scripts/check-dispatch-coverage.mjs
```

Archive dry-run example:

```bash
node scripts/archive-workspace-docs.mjs --topic interface-boundary --file docs/workspace/example-completed-plan.md
```
