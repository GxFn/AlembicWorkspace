# AlembicAgent Target Evidence: fix-agent-deepmining-planselection-modulebindings-t1

## Scope

- Window: AlembicAgent
- Task: `fix-agent-deepmining-planselection-modulebindings-t1`
- Dispatch group: `fix-agent-deepmining-planselection-modulebindings-p1`
- State root: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`
- Commit: `afe4c2b48ece5475f9fbfdcdd1ac974ad61fedcf` (`Require module bindings in plan selection`)

## Changed Files

- `src/agent/profiles/definitions/plan.profile.ts`
- `src/agent/runs/plan/PlanAgentRun.ts`
- `test/plan-agent-run.test.ts`

## Implementation Notes

- `runPlanAgent` now parses the LLM reply with Core stage-aware validation via `assertPlanSelectionStageRequirements(..., { expectedStage })`.
- `deepMining` and `moduleMining` replies with empty or non-target-producing `moduleBindings` are rejected in Agent before reaching the mainbody deepMining round context.
- The plan-selection prompt now extracts bounded ProjectContext module candidates from `projectMapModules`, `presenterInput.modules`, `presenterInput.map.modules`, and `moduleSeeds`, then instructs the LLM to copy module paths from those facts rather than inventing paths.
- The profile no longer shows `moduleBindings: []` as the general output example. It requires real `moduleBindings` for `deepMining`/`moduleMining` while preserving coldStart compatibility with empty bindings.
- No tools, persistence, global state, Core edits, Alembic mainbody edits, or fake plan synthesis were introduced.

## Verification

- `node --version` -> `v22.22.1`
- `npm run test -- test/plan-agent-run.test.ts` -> passed; 1 file / 10 tests.
- `npm run build:check` -> passed.
- `npm run check` -> passed; 41 files / 294 tests. Biome reported the same existing four warnings in:
  - `scripts/codemod-rename.mjs`
  - `scripts/smoke-agent-public-signatures.mjs`
  - `scripts/verify-agent-validation-floor.mjs`
- `git diff --check` -> passed.
- `git diff --cached --check` before commit -> passed.
- Alembic code guard attempted on the changed files but failed with plugin internal schema error: unrecognized key `data` / `CODEX_MCP_ERROR`.

## Residual Risks And Next Step

- Alembic mainbody still needs its own assigned gate-consumer repair if the controller has not accepted one; this Agent task only repairs the producer/parser side.
- Direct BiliDili verification must rebuild/restart the consumer process so it picks up Agent commit `afe4c2b48ece5475f9fbfdcdd1ac974ad61fedcf`, then rerun coldStart -> deepMining -> moduleMining -> evolution -> anti-fabrication evidence.
- The repository is local `main` ahead of `origin/main`; no push was performed.
