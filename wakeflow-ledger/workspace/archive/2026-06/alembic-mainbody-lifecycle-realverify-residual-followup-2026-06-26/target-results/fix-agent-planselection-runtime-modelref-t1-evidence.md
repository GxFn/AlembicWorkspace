# fix-agent-planselection-runtime-modelref-t1 Evidence

## Target

- currentWindow: AlembicAgent
- taskId: fix-agent-planselection-runtime-modelref-t1
- dispatchGroup: fix-agent-planselection-runtime-modelref-p1
- stateRoot: .wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26

## Result

Completed AlembicAgent-owned rework for the direct BiliDili cold-start blocker.

Commit:

- a98a22871a7ff883da69cb9b691845a6789eadb5 Fix plan selection model routing

Changed files:

- src/ai/gateway/LLMGateway.ts
- src/agent/profiles/definitions/plan.profile.ts
- test/LLMGateway.test.ts
- test/plan-agent-run.test.ts

Implemented scope:

- LLMGateway now splits provider-prefixed `modelRef` values at the first colon only. `ollama:gemma3:4b` resolves provider `ollama` and API model id `gemma3:4b`, preserving tagged Ollama model ids.
- The `plan-selection` profile runtime budget now allows the first real LLM turn to run before BudgetPolicy's pre-iteration stop check. This keeps the profile no-tool and single-result in practice while avoiding the zero-LLM forced-summary path.
- Tests now cover tagged model-ref routing into the Ollama/OpenAI-compatible request body.
- Tests now cover a real `AgentService` + `AgentRuntimeBuilder` + runtime plan-selection call returning valid PlanSelection JSON with exactly one no-tool provider call.
- Existing parser tests still reject invalid JSON, non-JSON text, invalid PlanSelection shape, and empty dimension lists. The Core `assertPlanSelectionShape` gate is unchanged.

## Validation

Passed:

- npm run test -- test/LLMGateway.test.ts test/plan-agent-run.test.ts
- npm run build:check
- npm run check
- git diff --check

Notes:

- npm run check passed with the repository's existing four Biome warnings in scripts/codemod-rename.mjs, scripts/smoke-agent-public-signatures.mjs, and scripts/verify-agent-validation-floor.mjs.
- Alembic code guard was invoked for the four changed files, but the plugin returned an internal schema error instead of a usable guard result. This is recorded as a validation-surface issue, not product-code evidence.

## Consumer Rebuild / Retest

- Alembic mainbody direct verification should rebuild/restart the consumer process before retest so it picks up this AlembicAgent commit.
- No AlembicPlugin rebuild is required by this Agent-only patch unless a later controller step intentionally refreshes packaged/vendor Agent artifacts.

## Residual Risks

- No known AlembicAgent product-code risk remains for the two assigned blockers.
- A broader runtime budget semantic issue remains possible for other profiles that set `maxIterations: 1`, but this task authorized only the plan-selection direct BiliDili blocker; translation or unrelated profiles were not changed.
- Alembic code guard could not complete because the MCP plugin returned an internal response-shape error.
