# AFAPI REQ-06 Work Evidence Lifecycle Code Fact Dossier

Generated: 2026-06-06

## Window And Scope

- Current window: AlembicPlugin execution window.
- Task id: AFAPI-REQ-06-WORK-EVIDENCE-LIFECYCLE-CODE-FACT-T1.
- Dispatch group: AFAPI-REQ-06-WORK-EVIDENCE-LIFECYCLE-GROUP.
- State root: `.workspace-active/workspace/current/afapi-req-06-work-evidence-lifecycle`.
- Scope: Stage 0 code fact review only for Codex MCP, public agent tools, skill guidance, plugin runtime, install validation, and Codex host adaptation inside AlembicPlugin.
- Explicit non-scope: no Alembic, AlembicCore, AlembicAgent, AlembicDashboard, AlembicDesign, or AlembicTest responsibility was claimed. No product implementation, runtime bundle mutation, submodule mutation, or commit was performed.

## Source Inputs Read

- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AGENTS.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/AGENTS.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/index.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/current/afapi-req-06-work-evidence-lifecycle/controller-state.json`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/current/afapi-req-06-work-evidence-lifecycle/demand.json`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/current/afapi-req-06-work-evidence-lifecycle/developer-progress.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/current/afapi-req-06-work-evidence-lifecycle/task-packages/AFAPI-REQ-06-WORK-EVIDENCE-LIFECYCLE-CODE-FACT-P1.json`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/workspace-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-06-work-evidence-lifecycle-landing-2026-06-05.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/skills/dev/codex-automation-target/SKILL.md`

## Summary Judgement

AlembicPlugin already has public `alembic_work_start` and `alembic_work_finish` surfaces that split concrete evidence-producing work from the older `alembic_task` create/close lifecycle. The active public contract and skill guidance point agents to the public work tools and keep legacy `alembic_task` hidden from `tools/list`.

The current work lifecycle is not durable. Work records are held in an in-process `Map`, so the current code can support same-process work start/finish evidence and same-session runtime probes, but it must not be described as a durable cross-process work ledger.

`alembic_work_finish` does not run Guard. It returns a scoped `guardRecommendation` when changed files make Guard relevant, and the caller is expected to invoke `alembic_code_guard` separately.

Opportunistic evolution remains attached to legacy `alembic_task` close only. Public `alembic_work_finish` is not currently an evolution trigger. Any future public finish integration should be implemented as a non-blocking hint/proposal path and must not auto-evolve solely because work was finished.

## Code Facts

### Public Tool Schemas

- `lib/shared/schemas/mcp-tools.ts` defines `WorkStartInput` with optional `intentRef`, `primeRef`, `title`, and `workScope` (`goal`, `files`, `summary`). The schema text treats `workScope` as host-declared concrete scope evidence, not hidden policy.
- `lib/shared/schemas/mcp-tools.ts` defines `WorkFinishInput` with optional `workRef`, `intentRef`, `primeRef`, `outcome`, `summary`, `changedFiles`, `evidenceRefs`, and `reason`. The output description is finishRef/detailRefs plus scoped Guard recommendation; it does not describe auto-running Guard.
- The same file still defines legacy `TaskInput` operations (`prime`, `create`, `close`, `fail`, `record_decision`) for direct-call compatibility while preferring public tools for the public agent-facing surface.

### Public Work Handlers

- `lib/codex/mcp/handlers/agent-public-tools.ts` stores work records in `WORK_RECORDS = new Map<string, WorkRecord>()`. `rememberWorkRecord` caps this local map at 100 entries. This is process-local memory, not durable storage.
- `workStartHandler` resolves whether the request is concrete work or should be skipped. Mechanical envelopes, status-only requests, and missing concrete work scope are skipped instead of creating a workRef. Ready work creates a `workRef`, detail refs, a local work record, and session intent binding.
- `workFinishHandler` requires a valid in-process `workRef`. Missing or fake work refs return a blocked result with `missing-work-ref`. Successful finish normalizes changed files, stores outcome/evidence locally, creates a `finishRef`, and returns changed files, evidence refs, detail refs, and `guardRecommendation`.
- `buildGuardRecommendation` calls `decideGuardTrigger` and returns a `run` recommendation for `alembic_code_guard` only when changed files are task-scoped code diffs. Otherwise it returns a skip reason.
- `bindWorkSession` binds the current session intent to the work reference, task title, metadata, and tool call.

### Lifecycle Policy

- `lib/service/task/TaskLifecyclePolicy.ts` classifies automation envelopes, direct-thread follow-ups, status-only content, explicit task anchors, code changes, read-only requests, and design-only requests.
- `decideTaskAnchor` skips automation envelopes (`automation-envelope-no-anchor`), status-only requests (`status-only-no-anchor`), and read-only/design-only requests (`readonly-no-anchor`); it creates anchors for explicit task/code-change work.
- `decideGuardTrigger` skips no-task-anchor, no-code-diff, docs-only, and unrelated-dirty cases; it recommends Guard only for task-scoped code diffs.
- `normalizeTaskLifecycleFileRefs` strips absolute refs relative to projectRoot and filters unsafe, host, and knowledge refs.

### Legacy Compatibility

- `lib/codex/mcp/handlers/task.ts` keeps hidden direct-call `alembic_task` compatibility for create/close/fail paths.
- Legacy create binds a session intent and returns generated task id/title.
- Legacy close resolves the task id, scans Git diff plus explicit changed files, runs the same task lifecycle policy for Guard recommendation, persists intent-chain outcome, resets session intent, and returns legacy next-action data for `alembic_guard`.
- Legacy fail resolves the id, persists a failed outcome, and resets session intent.
- The legacy task handler still has a Prime next-action helper that can mention `alembic_task operation:create`, but active public Prime guidance now points to `alembic_work_start`.

### Public Surface And Guidance

- `lib/codex/ToolPolicy.ts` includes public `alembic_work_start` and `alembic_work_finish`, and says legacy `alembic_task` is no longer a visible public workflow surface.
- `lib/codex/mcp/tools.ts` registers public work tools and retains hidden legacy `alembic_task` direct-call support.
- `lib/codex/mcp/PluginToolSurfaceCatalog.ts` catalogs public work tools using `WorkStartInput` and `WorkFinishInput`.
- `lib/codex/mcp/public-tools/descriptions.ts` describes `alembic_work_start` as creating an evidence-producing workRef, and `alembic_work_finish` as closing a workRef with changed files, outcome, detail refs, and a Guard recommendation. It also states the tools do not run code checks or silently widen scope.
- `lib/codex/mcp/public-tools/contract.ts` includes public work tools and their refs/fields. `alembic_work_finish` requires `workRef`.
- `plugins/alembic-codex/skills/alembic/SKILL.md` instructs agents to use `alembic_work_start` for concrete implementation/fix/refactor/review/evidence-producing work and `alembic_work_finish` after meaningful edits; it directs agents to call `alembic_code_guard` only if finish recommends it.
- `plugins/alembic-codex/skills/alembic-guard/SKILL.md` says to prefer explicit file scope when `alembic_work_finish` recommends `alembic_code_guard`.

### Opportunistic Evolution Boundary

- `lib/codex/evolution/PluginOpportunisticEvolution.ts` currently attaches opportunistic evolution only to legacy `alembic_task` close.
- `extractTaskCloseOutcome` reads legacy `alembic_task` close data. No equivalent public `alembic_work_finish` extraction path was found in Stage 0 review.
- This is a future implementation boundary, not a current Stage 0 defect by itself. If AFAPI-06 later requires public work finish to feed evolution, it should be added as explicit non-blocking proposal logic, not as an automatic durable evolution side effect.

## Tests Reviewed

- `test/unit/AgentPublicToolsActive.test.ts` covers public tool list/schema, work start/finish outputs, detail refs, scoped Guard recommendation, legacy compatibility flags, status-only skip, and raw automation skip.
- `test/unit/AgentPublicToolsEvaluation.test.ts` covers skip/degraded/blocked/truncation behavior, fake workRef blocking, and a complete intent -> prime -> work_start -> work_finish -> code_guard -> decision_record flow.
- `test/unit/AgentPublicToolsContract.test.ts` checks public contract and descriptions exclude legacy `alembic_task`/operation create/close language and include expected refs/fields.
- `test/unit/AgentPublicToolsCrossHostReadiness.test.ts` checks cross-host guidance includes public work tools and excludes legacy task surface.
- `test/unit/AgentPublicSkillLegacyCleanup.test.ts` checks active skill/tool descriptions do not expose legacy operation create/close workflow wording.
- `test/unit/TaskLifecyclePolicy.test.ts` checks Guard trigger skip/run policy for no-code, docs-only, unrelated dirty diff, and task-scoped source diffs.
- `test/unit/CodexMcpServer.test.ts` checks `tools/list` excludes `alembic_task`, hidden direct calls are retained, legacy close remains Plugin-owned, and legacy Guard no-scope behavior is blocked.
- `test/unit/CodexServiceRequestBoundary.test.ts` checks legacy `alembic_task` operations remain inside the Plugin-owned boundary.

## Verification Commands

All commands were run from `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin` unless noted.

```bash
npm run test:unit -- test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsContract.test.ts test/unit/AgentPublicToolsCrossHostReadiness.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts test/unit/TaskLifecyclePolicy.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexServiceRequestBoundary.test.ts
```

Result: passed. 8 test files passed, 87 tests passed. `CodexMcpServer.test.ts` emitted expected runtime initialization/shutdown logs on stderr.

```bash
npm run build:check
```

Result: passed. The core build used `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`, then `tsc --noEmit` completed.

```bash
npm run verify:codex-plugin
```

Result: passed. `./runtime.tgz` verified as `alembic-codex-plugin-runtime@0.2.0`.

```bash
git diff --check
git -C plugins/alembic-codex diff --check
git status --short
git -C plugins/alembic-codex status --short
```

Result: passed. Both status commands returned empty output after verification.

```bash
git rev-parse HEAD
git -C plugins/alembic-codex rev-parse HEAD
shasum -a 256 plugins/alembic-codex/runtime.tgz
```

Result:

- AlembicPlugin HEAD: `0abe90ca00aa7e867444eb779d0258cca2abe157`
- Embedded runtime HEAD: `4683da2723f8dae18d6dca6796ca1ef19636f19c`
- `plugins/alembic-codex/runtime.tgz` SHA-256: `0c78668944e83bd986853e04540452f7459b2f7524db2c9560c505fc5fd63e80`

## Risks And Gaps

- Durable lifecycle gap: current public work records are process-local. A same-process workRef can be finished, but cross-process durability is not implemented in AlembicPlugin and should not be claimed.
- Runtime acceptance gap: Stage 0 code tests cover public work lifecycle, but packaged MCP runtime acceptance should still probe same-session `alembic_work_start` -> `alembic_work_finish`, fake/stale workRef blocking, and no legacy task exposure in `tools/list`.
- Public evolution gap: opportunistic evolution is still legacy `alembic_task` close-only. If public `alembic_work_finish` should participate, a later stage needs an explicit non-blocking proposal boundary.
- Compatibility residue: hidden legacy direct-call support remains by design. Active public descriptions and skills are clean, but legacy fallback behavior must keep being tested while compatibility remains.
- Guard boundary: `work_finish` correctly recommends `alembic_code_guard` instead of running Guard. Later stages should keep this as a hard regression guard.

## Next Implementation Wave Recommendation

- Stage 1: strengthen no-work handling around `alembic_work_start`: status-only, raw automation envelope, design/read-only, and missing concrete work scope must not create workRef.
- Stage 2: strengthen `alembic_work_finish` runtime acceptance: missing/fake/stale workRef blocks; valid same-session workRef returns finishRef, changedFiles, evidenceRefs, outcome, and detailRefs.
- Stage 3: keep Guard decoupled: finish returns a scoped `alembic_code_guard` recommendation for task-scoped code diffs and never auto-runs Guard.
- Stage 4: decide and implement the public work-finish opportunistic evolution boundary only if the requirement wants public finish to produce evolution proposals. Keep it non-blocking and evidence-gated.
- Stage 5: packaged runtime golden probe: verify public tools through the built plugin runtime, confirm `alembic_task` remains hidden from `tools/list`, confirm work_start/work_finish same-session flow, and confirm no durable ledger claim appears without store evidence.

## Completion Statement

Stage 0 code fact review is complete. No AlembicPlugin product code, embedded runtime bundle, or submodule content was changed. No commit was created.
