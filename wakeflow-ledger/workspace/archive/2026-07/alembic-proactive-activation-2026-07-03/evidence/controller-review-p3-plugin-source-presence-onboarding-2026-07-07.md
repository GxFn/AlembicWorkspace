# Controller Review: p3-plugin-source-presence-onboarding-p1

Date: 2026-07-07
Demand: alembic-proactive-activation-2026-07-03
Dispatch group: p3-plugin-source-presence-onboarding-p1
Target: AlembicPlugin / p3-plugin-source-presence-onboarding-t1

## Scope Reviewed

- Requirement authority: Design/docs/current/alembic-proactive-activation-2026-07-03.md section 10.3 and section 10.6 P3.
- Task package: task-packages/p3-plugin-source-presence-onboarding-p1.json.
- Target result: target-results/tr-p3-plugin-source-presence-onboarding-t1.json.
- Product commit: AlembicPlugin e7dda4f05f5a50cbb8b8c4c0366b0a047c1de5bf, "Add source-aware status onboarding".

## Raw Evidence

- Commit e7dda4f changes only:
  - lib/host-runtime/status/SourcePresenceProbe.ts
  - lib/host-runtime/status/StatusService.ts
  - test/unit/SourcePresenceProbe.test.ts
  - test/unit/CodexStatusService.test.ts
  - test/unit/HostMcpServer.test.ts
- No Alembic main SetupService file, bootstrap runner, JobStore, or job-creation file is touched by this commit.
- SourcePresenceProbe mirrors ModuleService source extensions and scan exclusion directories, catches unreadable directories, and caps source counting at the configured limit.
- buildStatus probes source presence only when knowledge.initialized is false.
- needs_init onboarding now:
  - keeps alembic_init as the primary action with startsDaemon=false;
  - adds alembic_bootstrap only when sourcePresence.hasSource is true;
  - labels that bootstrap action as a post-init planning recommendation with startsDaemon=false;
  - states that status did not start bootstrap or create jobs;
  - keeps empty and ghost-empty projects without the bootstrap recommendation;
  - keeps ghost+source visible because this path returns onboarding data rather than writing project-root files.
- Existing needs_bootstrap remains the initialized-but-not-usable state and still uses the host-agent bootstrap action.

## Controller Verification

- `npx vitest run --config vitest.unit.config.ts test/unit/SourcePresenceProbe.test.ts test/unit/CodexStatusService.test.ts test/unit/HostMcpServer.test.ts`
  - PASS: 3 files, 60 tests.
  - Covered sourceful needs_init bootstrap recommendation, empty no-bootstrap recommendation, ghost-empty quiet, ghost+source recommendation, no .asd/jobs side effects, and HostMcpServer public status output.
- `npx vitest run test/integration/ZodToMcpSchema.test.ts`
  - PASS: 1 file, 19 tests.
- `npm run build:check`
  - PASS. Core build used ../AlembicCore @ 783b9f52aaa83767f4564ac8489cdfaf445bab35; tsc --noEmit passed.
- `npm run check`
  - PASS with 19 existing Biome warnings; exit code 0.
  - Boundary, scope-resolution, shared-asset-drift, cross-shell-drift, doctrine, naming, retired-symbol, and ring-direction checks passed.
- `git diff --check && git show --check --format=short e7dda4f`
  - PASS.
- `git status --short --branch`
  - Clean working tree on main, ahead 4 from prior accepted local commits.

## Acceptance Judgment

P3 WS-3 is implemented inside the assigned AlembicPlugin window and stays within the task package. The raw evidence proves host-visible status/onboarding now distinguishes sourceful uninitialized projects from empty projects, adds only a non-running post-init bootstrap recommendation, preserves ghost-empty restraint, and does not create bootstrap jobs. The public tool schema contract and repository gates remain green.

Residual risk is non-blocking for P3: the source presence scan is intentionally a bounded status hint rather than a full source index, and its depth boundary is not a production discovery contract. P4 must still perform the real Codex and Claude Code host-session validation required by the demand.

Decision: accept-target-result.
Next action: reduce and accept this result, then dispatch P4 Test real-host validation if no state gate blocks it.
