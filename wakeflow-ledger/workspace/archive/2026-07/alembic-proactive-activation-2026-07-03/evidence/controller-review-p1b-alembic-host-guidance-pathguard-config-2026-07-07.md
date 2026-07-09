# Controller Review: p1b-alembic-host-guidance-pathguard-config

Demand: `alembic-proactive-activation-2026-07-03`
Dispatch group: `p1b-alembic-host-guidance-pathguard-config-p1`
Target task: `p1b-alembic-host-guidance-pathguard-config-t1`
Target window: `Alembic`
Review date: 2026-07-07

## Authority Checked

- `AGENTS.md`
- `.wakeflow-active/index.md`
- `.wakeflow-active/current/workspace-current-status.md`
- `.wakeflow-active/current/alembic-proactive-activation-2026-07-03/task-packages/p1b-alembic-host-guidance-pathguard-config-p1.json`
- `Design/docs/current/alembic-proactive-activation-2026-07-03.md` sections 10.5 and 10.6
- Target result `target-results/tr-p1b-alembic-host-guidance-pathguard-config-t1.json`

## Target Evidence Reviewed

- Commit: no Alembic commit. The target reported no main-owned WS-5 host guidance writer exists after accepted Core and Plugin work.
- Relevant main files:
  - `Alembic/lib/Bootstrap.ts`
  - `Alembic/lib/recipe-pipeline/generate/skill-delivery/SkillCompletionCapability.ts`
  - `Alembic/lib/recipe-pipeline/generate/skill-delivery/SkillConsumer.ts`
  - `Alembic/test/unit/WorkflowSkillCompletionCapability.test.ts`
- Accepted producer evidence:
  - `evidence/controller-review-p1b-core-managed-block-pathguard-2026-07-07.md`
  - `evidence/controller-review-p1b-plugin-managed-block-refresh-wiring-2026-07-07.md`

## Controller Code Review

- Design section 10.5 assigns the managed-block utility and PathGuard hook to Core, and the concrete `refreshKnowledgeSkills` host guidance upsert/remove wiring to Plugin.
- `Alembic/lib/Bootstrap.ts:62` configures PathGuard with `projectRoot`, `packageRoot`, `knowledgeBaseDir`, and `extraProjectWritableFiles: ['.env']`. It does not currently select or write `AGENTS.md` / `CLAUDE.md`.
- `Alembic/lib/recipe-pipeline/generate/skill-delivery/SkillCompletionCapability.ts:188` creates a Project Skill delivery receipt with `runtimeExport.status: 'pending'`, meaning Alembic main generates the skill artifact and receipt while runtime export remains a later host concern.
- `Alembic/lib/recipe-pipeline/generate/skill-delivery/SkillCompletionCapability.ts:343` writes generated project skill files under the configured write zone or guarded skill directory. It does not write host context files or managed guidance blocks.
- Static search under Alembic `lib`, `bin`, `config`, `scripts`, and `test` found no `refreshKnowledgeSkills`, `ProjectSkillService`, `upsertAlembicManagedBlock`, `removeAlembicManagedBlock`, `ALEMBIC_MANAGED`, `HOST_GUIDANCE`, or `addProjectWritableFile` consumer in main source, apart from shared-asset documentation strings.
- Therefore adding `AGENTS.md` / `CLAUDE.md` to Alembic main PathGuard configuration in this package would create permission without a main-owned writer and would weaken root-file protection. The accepted Plugin task already owns the actual WS-5 host guidance consumer.

## Controller Verification

Ran from `Alembic`:

- `npx vitest run --config vitest.unit.config.ts test/unit/WorkflowSkillCompletionCapability.test.ts`
  - Passed: 1 file, 2 tests.
- `npm run build:check`
  - Passed; Core build used local `../AlembicCore`.
- `git diff --check`
  - Passed with no output.
- `git status --short --branch`
  - Clean: `main...origin/main`.

## Decision

Accept. The Alembic main task satisfied the assigned consumer-check package with no code change. The no-commit result is correct because there is no main-owned WS-5 host guidance writer to configure, and root-file allowlisting should remain attached to a real writer.

Residual gates remain for later phases:

- P2: Plugin host-aware project skill export and associated PathGuard prefix coupling.
- P2b: cold-start finalizer auto-refresh.
- P4: true Codex and Claude Code host-session validation that managed guidance is loaded and increases Alembic tool consumption.
