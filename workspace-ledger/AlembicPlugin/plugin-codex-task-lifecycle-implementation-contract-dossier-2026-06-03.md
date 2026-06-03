# Plugin Codex Task Lifecycle Implementation Contract Dossier

Task ID: `PCTL-STAGE0-PLUGIN-P0`
Date: 2026-06-03
Window: `AlembicPlugin`
Status: Stage 0 read-only code-fact review complete

## Window Boundary

This dossier is produced by the `AlembicPlugin` execution window. The reviewed
scope is limited to Codex MCP, Plugin skills, channel / marketplace-facing
runtime contract, install/runtime verification, and Codex host adaptation inside
the AlembicPlugin responsibility boundary.

No product source code, runtime artifact, packaged cache, Alembic / Core /
Dashboard / Test repository, or real project source was modified for Stage 0.

## Inputs Read

- `AGENTS.md`
- `codex-control-workspace/.workspace-active/workspace/index.md`
- `codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`
- `codex-control-workspace/.workspace-active/workspace/current/plugin-codex-task-lifecycle-redesign-workspace-plan-2026-06-03.md`
- `codex-control-workspace/skills/dev/codex-automation-target/SKILL.md`
- `codex-control-workspace/.workspace-local/codex-automation-loop/dispatch-packets/PCTL-STAGE0-PLUGIN-FACTS-20260603__AlembicPlugin__PCTL-STAGE0-PLUGIN-P0.json`
- `AlembicPlugin/AGENTS.md`
- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-original-plan-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-code-fact-review-2026-06-03.md`

Repository state at review:

- AlembicPlugin HEAD: `f0a94e9`
- `plugins/alembic-codex` HEAD: `e8ae215`
- AlembicPlugin `git status --short`: clean
- AlembicPlugin `git diff --check`: passed with no output

## Executive Conclusion

Design's code-fact review still matches the current AlembicPlugin code. The
current task lifecycle remains a strong IDE-agent-era contract:

- `prime` is still described as mandatory before every user-input turn in tool
  descriptions and built-in skills.
- `create` is still recommended for non-trivial work using size heuristics.
- `close` still returns a required no-args `alembic_guard` next action.
- Guard no-args still chooses files from project-level git diff and is not
  scoped to the current task id, task title, host intent, or source refs.
- `HostIntentFrame` already provides a good intake boundary for Codex-curated
  semantic input; a new public prime schema is not needed for Stage 1.
- `close` must not be removed because it persists intent chain state and is the
  attachment point for Plugin opportunistic evolution.

Stage 1 can proceed as an AlembicPlugin implementation wave. The recommended
implementation is a small Plugin-owned lifecycle policy service plus handler /
schema / skill / test updates. AlembicCore should remain observation-only unless
Stage 1 discovers a shared consumer.

## Code-Fact Alignment

### Task Handler Operations

Latest code confirms `alembic_task` exposes exactly five public operations and
does not classify input source before dispatch:

- `lib/codex/mcp/handlers/task.ts:239` defines `_taskRules`.
- `lib/codex/mcp/handlers/task.ts:243` says prime before every message.
- `lib/codex/mcp/handlers/task.ts:244` says create for non-trivial work.
- `lib/codex/mcp/handlers/task.ts:270` to `lib/codex/mcp/handlers/task.ts:283`
  dispatch only on `prime/create/close/fail/record_decision`.

Contract implication: keep the public operation set stable in Stage 1. Add
classification and decision metadata around existing operations rather than
creating a sixth public operation.

### Prime Intake

Latest code confirms prime already merges Codex host hints with deterministic
signals:

- `lib/codex/mcp/handlers/task.ts:307` calls `prepareHostIntentInput`.
- `lib/codex/mcp/handlers/task.ts:315` still extracts intent from
  `hostIntentInput.userQuery`.
- `lib/service/task/HostIntentFrame.ts:149` defines `prepareHostIntentInput`.
- `lib/service/task/HostIntentFrame.ts:170` to
  `lib/service/task/HostIntentFrame.ts:176` falls back from
  `hostDeclaredIntent.query/summary/goal/action` to the effective query.
- `lib/service/task/HostIntentFrame.ts:192` to
  `lib/service/task/HostIntentFrame.ts:230` builds resident handoff from
  declared query, keywords, labels, source refs, scenario, and host turn meta.

Contract implication: implement `PrimeInputBuilder` as an enhancement to
`HostIntentFrame` / `prepareHostIntentInput`, not as a parallel public schema.
Automation or card envelopes should be converted to `hostDeclaredIntent` and
`hostTurnMeta` before prime, rather than copied into `userQuery`.

### Prime Trust Receipt

Latest code confirms the adjacent Prime Trust Receipt work is already present:

- `lib/codex/mcp/handlers/task.ts:418` builds `primeKnowledgeMaterial`.
- `lib/codex/mcp/handlers/task.ts:874` and `lib/codex/mcp/handlers/task.ts:912`
  produce Codex-visible receipt instructions.
- `lib/codex/mcp/handlers/task.ts:931` returns optional create guidance after
  prime.

Contract implication: Stage 1 should not redesign receipt content. It should
only decide when prime is appropriate and what semantic input is sent to prime.

### Create

Latest code confirms create is a simple task anchor and does not decide whether
the current turn deserves a task:

- `lib/codex/mcp/handlers/task.ts:948` requires only `title`.
- `lib/codex/mcp/handlers/task.ts:957` generates a task id.
- `lib/codex/mcp/handlers/task.ts:960` to `lib/codex/mcp/handlers/task.ts:964`
  binds the id to the active session intent when present.

Contract implication: `TaskAnchorPolicy` must be expressed in tool instructions,
prime next actions, and optionally handler result metadata. The handler can
remain conservative: it should not create automatically; it should make
Codex-visible reasons for create/skip clear.

### Close

Latest code confirms close already requires an existing task id but still forces
Guard:

- `lib/codex/mcp/handlers/task.ts:979` resolves `id` from args or session
  intent.
- `lib/codex/mcp/handlers/task.ts:980` to `lib/codex/mcp/handlers/task.ts:985`
  returns failure if there is no task anchor.
- `lib/codex/mcp/handlers/task.ts:990` to `lib/codex/mcp/handlers/task.ts:997`
  persists intent chain and resets session intent.
- `lib/codex/mcp/handlers/task.ts:1003` requires no-args Guard.
- `lib/codex/mcp/handlers/task.ts:1010` to `lib/codex/mcp/handlers/task.ts:1015`
  returns `nextAction.required=true`.

Contract implication: keep close as the created-task completion boundary, but
change Guard from mandatory to conditional. Close should return a guard decision
with a run/skip reason instead of unconditional no-args Guard.

### Guard

Latest code confirms no-args Guard scans project git diff and is independent of
task state:

- `lib/codex/mcp/handlers/guard.ts:321` to
  `lib/codex/mcp/handlers/guard.ts:326` documents no-args git diff selection
  and no task id binding.
- `lib/codex/mcp/handlers/guard.ts:371` to
  `lib/codex/mcp/handlers/guard.ts:372` calls `_detectChangedFiles`.
- `lib/codex/mcp/handlers/guard.ts:375` to
  `lib/codex/mcp/handlers/guard.ts:383` returns a no-source-files pass.
- `lib/codex/mcp/handlers/guard.ts:589` to
  `lib/codex/mcp/handlers/guard.ts:610` defines code-like source extensions.
- `lib/codex/mcp/handlers/guard.ts:615` to
  `lib/codex/mcp/handlers/guard.ts:625` uses git diff / staged / untracked
  files without task scope attribution.

Contract implication: Stage 1 should not make close call no-args Guard by
default. When Guard is required, close should pass explicit task-scoped files to
`alembic_guard` so unrelated dirty source files are not attributed to the
current task.

### Tool Schema and Tool Description

Latest code confirms the old lifecycle is still part of the MCP contract text:

- `lib/shared/schemas/mcp-tools.ts:427` to
  `lib/shared/schemas/mcp-tools.ts:432` describes `close=完成+Guard`.
- `lib/codex/mcp/tools.ts:185` to `lib/codex/mcp/tools.ts:193` describes
  no-args Guard as preferred after coding.
- `lib/codex/mcp/tools.ts:317` to `lib/codex/mcp/tools.ts:327` describes
  every-turn prime, non-trivial create, close-trigger-Guard, and close
  opportunistic evolution.

Contract implication: Stage 1 must update schema descriptions and tool
descriptions in the same implementation wave as handler behavior. Otherwise
Codex may keep following the old contract even if handler data changes.

### Plugin Skills

Latest code confirms built-in skills still include old trigger language:

- `plugins/alembic-codex/skills/alembic/SKILL.md:3` says prime before every
  user-input turn when project knowledge exists.
- `plugins/alembic-codex/skills/alembic/SKILL.md:24` to
  `plugins/alembic-codex/skills/alembic/SKILL.md:30` repeats every-turn prime
  and after-edits Guard.
- `plugins/alembic-codex/skills/alembic-recipes/SKILL.md:37` repeats every-turn
  prime for code reading / search / edit / Guard / conclusion.
- `plugins/alembic-codex/skills/alembic-guard/SKILL.md:3` is already closer to
  the target: proactive Guard only when project knowledge exists, and empty
  projects only on explicit Guard request.

Contract implication: update `alembic` and `alembic-recipes` skill wording in
Stage 1. Treat `alembic-guard` as the closer baseline: after edits or explicit
Guard requests, not every lifecycle close.

### Tool Policy

Latest code confirms `alembic_task` is intentionally visible as a lifecycle
surface in initialized-empty projects:

- `lib/codex/ToolPolicy.ts:89` to `lib/codex/ToolPolicy.ts:92` says
  `alembic_task` is not Recipe/Search/Guard knowledge consumption.
- `lib/codex/ToolPolicy.ts:240` to `lib/codex/ToolPolicy.ts:245` makes
  `alembic_task` visible when knowledge is initialized even if unusable.
- `lib/codex/ToolPolicy.ts:253` to `lib/codex/ToolPolicy.ts:255` still hides
  tools for uninitialized/unusable projects without resident ProjectScope.

Contract implication: do not hide or delete `alembic_task` as the solution.
Lifecycle policy must distinguish uninitialized, initialized-empty,
knowledge-ready, and resident ProjectScope-ready states.

### Opportunistic Evolution

Latest code confirms close is also the Plugin opportunistic evolution attachment
surface:

- `lib/codex/evolution/PluginOpportunisticEvolution.ts:155` to
  `lib/codex/evolution/PluginOpportunisticEvolution.ts:160` attaches only for
  `alembic_task` close.
- `lib/codex/mcp/host/opportunistic-evolution-presenter.ts:16` to
  `lib/codex/mcp/host/opportunistic-evolution-presenter.ts:35` attaches the
  surface after a successful close result.

Contract implication: close should remain for real created tasks, but
opportunistic evolution should inherit the same task-scope / code-diff evidence
gate as Guard so docs-only or envelope-only closes do not create misleading
evolution hints.

## Recommended Stage 1 Contract

### Policy Location

Create a Plugin-owned deterministic policy module, recommended path:

`lib/service/task/TaskLifecyclePolicy.ts`

Rationale:

- More testable than embedding all decisions in `task.ts`.
- Still inside AlembicPlugin; no Core extraction and no AlembicAgent runtime.
- Reusable by task handler, tool result presenter, and focused unit tests.
- Avoids public MCP operation churn.

Handler-local glue should remain in `lib/codex/mcp/handlers/task.ts`:

- Parse MCP args.
- Build `HostIntentFrame`.
- Call policy helpers.
- Shape result envelope and Codex-visible next actions.

### Input Classification

Recommended decision object:

```ts
type TaskLifecycleInputSource =
  | 'user-intent'
  | 'automation-envelope'
  | 'direct-thread-follow-up'
  | 'system-or-tool-continuation'
  | 'status-or-readonly'
  | 'unknown';

type TaskLifecycleIntentKind =
  | 'code-change-task'
  | 'read-only-analysis'
  | 'design-discussion'
  | 'status-report'
  | 'automation-control'
  | 'knowledge-query'
  | 'explicit-task-anchor'
  | 'unknown';

interface TaskLifecycleClassification {
  inputSource: TaskLifecycleInputSource;
  intentKind: TaskLifecycleIntentKind;
  primeDecision: PrimeDecision;
  taskAnchorDecision: TaskAnchorDecision;
  closeDecision?: TaskCloseDecision;
  guardDecision?: GuardTriggerDecision;
}
```

First implementation can classify from `hostDeclaredIntent`, `hostTurnMeta`,
`userQuery`, known automation fields, explicit task args, and changed-file
facts. It does not need a new public operation.

### Prime Input

Use current `HostIntentFrame` as the semantic intake boundary:

- Prefer `hostDeclaredIntent.query`.
- Else prefer `summary`, `goal`, or `action`.
- Include `keywords`, `labels`, `sourceRefs`, `scenario`, `language`, and
  `hostTurnMeta`.
- Avoid raw automation/card/direct-thread envelope text as `userQuery` unless
  Codex has no better semantic input and explicitly marks it degraded.

Recommended prime decision fields:

```ts
interface PrimeDecision {
  action: 'run' | 'skip';
  reasonCode:
    | 'knowledge-ready-code-task'
    | 'knowledge-ready-user-query'
    | 'automation-envelope-needs-context'
    | 'uninitialized-project'
    | 'status-only'
    | 'no-semantic-query';
  curatedQuery?: string;
  sourceRefs?: string[];
  keywords?: string[];
}
```

### Task Anchor Policy

Recommended create criteria:

- Run create when the user explicitly asks for a task anchor.
- Run create for explicit implementation / fix / refactor / multi-step code
  evidence work.
- Skip create for pure status, read-only review, Design discussion, dispatch
  envelope consumption, readback, and final summary.

Recommended result metadata:

```ts
interface TaskAnchorDecision {
  action: 'create' | 'skip';
  reasonCode:
    | 'explicit-code-change'
    | 'explicit-user-task-anchor'
    | 'multi-step-implementation'
    | 'readonly-no-anchor'
    | 'automation-envelope-no-anchor'
    | 'status-only-no-anchor';
  confidence: 'high' | 'medium' | 'low';
}
```

### Close Policy

Current close already fails when there is no task id. Keep that behavior.

Change close result from unconditional Guard to conditional lifecycle guidance:

```ts
interface TaskCloseDecision {
  action: 'close' | 'skip';
  reasonCode: 'task-anchor-exists' | 'no-created-task';
  taskId?: string;
}
```

Close should still persist intent chain and reset active session intent for
real task anchors.

### Guard Trigger Policy

Recommended run criteria:

- `hasCodeDiff === true`
- `guardRelevantFiles.length > 0`
- changed files belong to the current task scope, as inferred from task id,
  task title, active file, HostIntentFrame source refs, explicit changed files,
  or code edit paths captured by tests.

Recommended skip reasons:

- `no-code-diff`
- `docs-only-diff`
- `unrelated-dirty-diff`
- `no-task-anchor`
- `guard-not-relevant`

Recommended close result shape:

```ts
interface GuardTriggerDecision {
  action: 'run' | 'skip';
  reasonCode:
    | 'task-scoped-code-diff'
    | 'no-code-diff'
    | 'docs-only-diff'
    | 'unrelated-dirty-diff'
    | 'no-task-anchor'
    | 'guard-not-relevant';
  changedFiles: string[];
  guardRelevantFiles: string[];
  taskScopedFiles: string[];
}
```

For run:

```json
{
  "nextAction": {
    "tool": "alembic_guard",
    "args": { "files": ["src/example.ts"] },
    "required": true,
    "reason": "Task-scoped code diff requires Guard review.",
    "guardDecision": {
      "action": "run",
      "reasonCode": "task-scoped-code-diff"
    }
  }
}
```

For skip:

```json
{
  "nextAction": {
    "tool": "alembic_guard",
    "args": {},
    "required": false,
    "skipped": true,
    "reason": "No task-scoped guard-relevant code diff was detected.",
    "guardDecision": {
      "action": "skip",
      "reasonCode": "no-code-diff"
    }
  }
}
```

This preserves backward readability while stopping the forced no-args Guard.

### Schema / Tool / Skill Contract

Stage 1 should update these in one implementation commit group:

- `lib/shared/schemas/mcp-tools.ts`
- `lib/codex/mcp/tools.ts`
- `plugins/alembic-codex/skills/alembic/SKILL.md`
- `plugins/alembic-codex/skills/alembic-recipes/SKILL.md`
- `plugins/alembic-codex/skills/alembic-guard/SKILL.md` only if wording needs
  alignment with explicit skip reasons
- generated runtime artifacts after `npm run prepare:codex-plugin-runtime`

Required text changes:

- Replace "prime before every user-input turn" with "prime when project
  knowledge is relevant, using Codex-curated intent; do not raw-prime
  automation envelopes".
- Replace create size heuristics with task anchor policy.
- Replace "close triggers Guard" with "close may recommend Guard only when
  task-scoped guard-relevant code diff exists".
- Teach Codex to surface skip reasons instead of silently doing nothing.

## Recommended Focused Tests

Minimum Stage 1 tests:

1. `TaskLifecyclePolicy.test.ts`
   - classifies automation envelope as non-raw-prime unless curated intent is
     supplied.
   - skips create for status/read-only/design turns.
   - creates anchor for explicit code-change task.
   - skips Guard for no diff, docs-only diff, unrelated dirty source diff.
   - runs Guard with explicit file list for task-scoped source diff.

2. `TaskPrimeKnowledgeMaterial.test.ts`
   - prime accepts curated `hostDeclaredIntent` query / keywords / sourceRefs
     and does not require raw envelope text.
   - prime next actions recommend create only conditionally.

3. `CodexMcpServer.test.ts`
   - close returns `nextAction.required=false` with skip reason when no
     task-scoped code diff exists.
   - close returns explicit `files` for Guard when task-scoped source diff
     exists.
   - initialized-empty project can still close task and surface Plugin
     opportunistic evolution.

4. `ZodSchemas.test.ts` / `ZodToMcpSchema.test.ts`
   - schema continues accepting existing operations and hostDeclaredIntent.
   - descriptions no longer claim close always means Guard.

5. Skill / runtime verification
   - `npm run verify:codex-plugin`
   - `npm run prepare:codex-plugin-runtime`
   - status checks in parent and runtime subrepo.

## AlembicTest Recommendation

Do not start AlembicTest immediately after Stage 0. Stage 1 focused tests should
first prove handler, schema, skill, and runtime behavior.

AlembicTest should be considered after Stage 1 only if total control needs a
real Codex host smoke for either of these:

- automation/direct-thread envelope is not raw-primed in a real Codex turn.
- no-code close / no-code Guard skip is visible to the user in a real Codex
  session.

## Stage 1 Task Split Recommendation

Recommended as one AlembicPlugin implementation wave with internal checkpoints:

1. Add `TaskLifecyclePolicy` and focused unit tests.
2. Wire policy into `task.ts` prime next actions and close `nextAction`.
3. Add task-scoped changed-file detection for Guard trigger selection.
4. Update tool schema and tool descriptions.
5. Update built-in plugin skills.
6. Run focused tests, build/lint, `prepare:codex-plugin-runtime`,
   `verify:codex-plugin`, and clean status checks.

One implementation wave is preferable because handler behavior, tool contract,
skill wording, and packaged runtime artifacts must stay synchronized.

## Risks / Required Controller Decisions

- Guard task-scope attribution must avoid false confidence. If Stage 1 cannot
  reliably prove a dirty source file belongs to the current task, it should
  skip with `unrelated-dirty-diff` rather than run no-args Guard.
- Do not remove close. It is still needed for intent persistence and
  opportunistic evolution.
- Do not move lifecycle policy into AlembicCore until another repository has a
  concrete consumer.
- Do not alter direct-thread transport. The transport is only an input source to
  classification.
- Prime Trust Receipt remains an adjacent accepted contract; Stage 1 should not
  rewrite receipt trust posture.

## Verification Performed

```text
git status --short
```

Result: clean output in AlembicPlugin before dossier creation.

```text
git diff --check
```

Result: passed with no output in AlembicPlugin.

## Completion Boundary

Stage 0 only proves code facts and implementation contract. It does not prove
the redesigned lifecycle has been implemented. Stage 1 can begin after total
control accepts this dossier.
