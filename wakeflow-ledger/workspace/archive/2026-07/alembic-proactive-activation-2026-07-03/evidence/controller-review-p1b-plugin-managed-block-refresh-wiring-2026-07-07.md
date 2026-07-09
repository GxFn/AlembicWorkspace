# Controller Review: p1b-plugin-managed-block-refresh-wiring

Demand: `alembic-proactive-activation-2026-07-03`
Dispatch group: `p1b-plugin-managed-block-refresh-wiring-p1`
Target task: `p1b-plugin-managed-block-refresh-wiring-t1`
Target window: `AlembicPlugin`
Review date: 2026-07-07

## Authority Checked

- `AGENTS.md`
- `.wakeflow-active/index.md`
- `.wakeflow-active/current/workspace-current-status.md`
- `.wakeflow-active/current/alembic-proactive-activation-2026-07-03/task-packages/p1b-plugin-managed-block-refresh-wiring-p1.json`
- `Design/docs/current/alembic-proactive-activation-2026-07-03.md` sections 10.5, 10.6, 10.7
- Target result `target-results/tr-p1b-plugin-managed-block-refresh-wiring-t1.json`

## Target Evidence Reviewed

- Commit: `33f2954901723abf85214abcae0cebaabb4cb1d4`
- Files changed:
  - `AlembicPlugin/lib/service/skills/ProjectSkillService.ts`
  - `AlembicPlugin/test/unit/ProjectSkillService.test.ts`
  - `AlembicPlugin/lib/host-runtime/mcp/tools.ts`
  - `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
  - `AlembicPlugin/docs/declared-effects.md`
- Core producer used by build: `AlembicCore @ 783b9f52aaa83767f4564ac8489cdfaf445bab35`

## Controller Code Review

- `refreshKnowledgeSkills` now calls the Core managed-block helpers through `@alembic/core/io`; no Core source bypass or cross-repo edit was introduced in the Plugin commit.
- Host file selection is host-aware: `claude-code` maps to `CLAUDE.md`; default/Codex maps to `AGENTS.md`.
- `pathGuard.addProjectWritableFile` is scoped to the selected host file before upsert/remove, and tests assert the non-selected root file remains blocked.
- Standard-mode detection is consistent with Core `WorkspaceResolver`: standard mode is `dataRoot === projectRoot`, while ghost/project-scope storage has an external data root and is skipped for project-root host guidance.
- The managed block body is short and includes the required concrete consumption example plus "grounded in THIS project's own code" wording.
- No-knowledge-base and disabled-host-guidance paths remove only the managed block and do not unlink user files.
- Malformed markers return `HOST_GUIDANCE_SYNC_FAILED` before knowledge skill refresh, preserving repair visibility.
- The task did not implement WS-6 cold-start auto-sync and did not claim real host-session validation, matching this task boundary.

## Controller Verification

Ran from `AlembicPlugin`:

- `npx vitest run --config vitest.unit.config.ts test/unit/ProjectSkillService.test.ts`
  - Passed: 1 file, 12 tests.
- `npx vitest run --config vitest.unit.config.ts test/unit/ProjectSkillService.test.ts test/unit/McpToolSchemaHonesty.test.ts test/unit/CodexToolPolicy.test.ts`
  - Passed: 3 files, 26 tests.
- `npx vitest run test/integration/ZodToMcpSchema.test.ts`
  - Passed: 1 file, 19 tests.
- `npm run build:check`
  - Passed; Core build used `../AlembicCore @ 783b9f52aaa83767f4564ac8489cdfaf445bab35`.
- `git diff --check 33f2954901723abf85214abcae0cebaabb4cb1d4^ 33f2954901723abf85214abcae0cebaabb4cb1d4`
  - Passed with no output.
- `npm run check`
  - Passed with exit code 0.
  - Existing Biome warnings remain in unrelated files; none are in the five files changed by this task.

## Decision

Accept. The Plugin P1b WS-5 consumer wiring satisfies the task package and design section 10.5 acceptance within the Plugin boundary.

Residual gates remain for later phases:

- P2/P2b: host-aware skill export and WS-6 cold-start auto-sync.
- P4: true Codex and Claude Code host-session validation that the host context file is loaded into LLM context.
