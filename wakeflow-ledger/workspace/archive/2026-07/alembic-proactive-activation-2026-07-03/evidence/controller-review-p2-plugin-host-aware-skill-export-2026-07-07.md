# Controller Review: p2-plugin-host-aware-skill-export

Demand: `alembic-proactive-activation-2026-07-03`
Dispatch group: `p2-plugin-host-aware-skill-export-p1`
Target task: `p2-plugin-host-aware-skill-export-t1`
Target window: `AlembicPlugin`
Review date: 2026-07-07

## Authority Checked

- `AGENTS.md`
- `.wakeflow-active/index.md`
- `.wakeflow-active/current/workspace-current-status.md`
- `.wakeflow-active/current/alembic-proactive-activation-2026-07-03/task-packages/p2-plugin-host-aware-skill-export-p1.json`
- `Design/docs/current/alembic-proactive-activation-2026-07-03.md` sections 10.2 and 10.6
- P0 controller evidence proving Claude Code project skills load from `.claude/skills/<skill-name>/SKILL.md`
- Target result `target-results/tr-p2-plugin-host-aware-skill-export-t1.json`

## Target Evidence Reviewed

- AlembicPlugin commit: `dc85c94dc74e815f8cb0374a3c88c7b2bcb3a321` (`Wire host-aware project skill export`)
- Changed files reviewed:
  - `lib/host-runtime/host-adapter/HostAdapter.ts`
  - `lib/host-runtime/host-adapter/CodexHostAdapter.ts`
  - `lib/host-runtime/host-adapter/ClaudeCodeHostAdapter.ts`
  - `lib/service/skills/ProjectSkillDelivery.ts`
  - `lib/service/skills/ProjectSkillService.ts`
  - `lib/host-runtime/mcp/tools.ts`
  - `lib/shared/schemas/mcp-tools.ts`
  - `lib/host-runtime/mcp/PluginToolSurfaceCatalog.ts`
  - `lib/host-runtime/mcp/handlers/skill.ts`
  - `scripts/lint-layer-boundary.mjs`
  - `docs/declared-effects.md`
  - `test/unit/ClaudeCodeHostAdapter.test.ts`
  - `test/unit/ProjectSkillDelivery.test.ts`
  - `test/unit/ProjectSkillService.test.ts`

## Controller Code Review

- `HostAdapter` now exposes `projectSkillRoot(projectRoot)`.
- `CodexHostAdapter.projectSkillRoot` returns `<projectRoot>/.agents/skills`; `ClaudeCodeHostAdapter.projectSkillRoot` returns `<projectRoot>/.claude/skills`, matching the accepted P0 Claude Code proof.
- `getProjectSkillRoot(projectRoot)` delegates to `resolveHostAdapter().projectSkillRoot(projectRoot)`, and `resolveHostAdapter` chooses by `resolveHostRuntimeContext().expectedPluginHost`, which is derived from the shell shape.
- `ProjectSkillDelivery` builds receipts with the existing `codexSkillRoot` field names preserved, but the value is now the selected host skill root. `exportProjectSkillReceiptToRuntime` recomputes the selected host root at export time and updates receipt runtime paths accordingly.
- Runtime writes call `addProjectSkillRootWritePrefix(projectRoot, hostSkillRoot)` before asserting/writing the symlink and marker. The prefix is derived from the same selected host root, so Claude Code export is not blocked and the non-selected skill root remains unsafe.
- `ProjectSkillService` list/load/upsert/refresh/delete paths all use `getProjectSkillRoot` for runtime projection. The pre-existing WS-5 host guidance file split remains in guidance-only code; P2 did not add a new service-layer host branch for project skill runtime export.
- MCP-facing text was updated from Codex-only wording to host-runtime wording for `alembic_project_skill`, while schema fields and four core Alembic knowledge-tool contracts remained covered by schema/policy tests.
- A stale exported constant `PROJECT_SKILL_ROOT = .agents/skills` remains in `ProjectSkillDelivery.ts`, but controller search found the real runtime derivation uses `getProjectSkillRoot`; the constant is not the active export path. This is not a P2 blocker.

## Controller Verification

Ran from `AlembicPlugin`:

- `npx vitest run --config vitest.unit.config.ts test/unit/ClaudeCodeHostAdapter.test.ts test/unit/ProjectSkillDelivery.test.ts test/unit/ProjectSkillService.test.ts test/unit/McpToolSchemaHonesty.test.ts test/unit/CodexToolPolicy.test.ts test/unit/KnowledgeContextPublicSurfaceGuidance.test.ts`
  - Passed: 6 files, 42 tests.
- `npx vitest run test/integration/ZodToMcpSchema.test.ts`
  - Passed: 1 file, 19 tests.
- `npm run build:check`
  - Passed; Core build used local `../AlembicCore @ 783b9f52aaa83767f4564ac8489cdfaf445bab35`.
- `npm run check`
  - Passed with exit code 0. Biome printed existing unrelated warnings; the gate continued through all lint/boundary/drift/naming/ring checks successfully.
- `git diff --check`
  - Passed with no output.
- `git show --check --format=short dc85c94dc74e815f8cb0374a3c88c7b2bcb3a321`
  - Passed.
- `git status --short --branch`
  - Clean on `main...origin/main [ahead 2]`.

## Decision

Accept. The P2 Plugin task satisfies the design and package boundary:

- Codex path remains `.agents/skills`.
- Claude Code path is `.claude/skills` per P0 proof.
- Runtime skill export and refresh consume the host adapter instead of hard-coded `.agents/skills`.
- PathGuard authorization is coupled to the selected host skill root.
- Public field names are preserved; host-specific values now reflect the actual runtime root.
- WS-3 and WS-6 were not implemented early.

Residual gates remain:

- P2b / WS-6: cold-start final completion should automatically call `refreshKnowledgeSkills` once.
- P3: SourcePresenceProbe onboarding split.
- P4: real Codex + Claude Code host-session acceptance that the host context block and project skill loading are visible to the LLM and increase Alembic tool consumption.
