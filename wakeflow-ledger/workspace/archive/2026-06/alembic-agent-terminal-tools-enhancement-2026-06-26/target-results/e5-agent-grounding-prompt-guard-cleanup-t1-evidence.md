# e5-agent-grounding-prompt-guard-cleanup-t1 Evidence

## Target

- currentWindow: AlembicAgent
- taskId: e5-agent-grounding-prompt-guard-cleanup-t1
- dispatchGroup: e5-agent-grounding-prompt-guard-cleanup-p1
- stateRoot: .wakeflow-active/current/alembic-agent-terminal-tools-enhancement-2026-06-26

## Result

Completed E-5 within AlembicAgent only.

Commit:

- ea055569c64d5874bdf3cbc0ff578987328e9b03 Tighten analyst grounding prompt guidance

Changed files:

- src/agent/prompts/insightAnalyst.ts
- src/agent/runtime/AnalyzeGroundingGuard.ts
- test/llm-input-layering.test.ts

Implemented scope:

- ANALYST_SYSTEM_PROMPT now gives always-on, capability-neutral guidance for read-only terminal.exec evidence when available.
- Prompt guidance names git log/blame/diff/status, npm test/vitest run, tsc --noEmit, lint, grep/rg/find as read-only verification examples.
- Prompt guidance explicitly forbids install, network, project writes/deletes, sudo, chmod/chown, and daemon starts.
- buildAnalystPrompt terminal-capability block now states terminal results may feed PcvNodeEvidence / grounding guard evidence after review.
- AnalyzeGroundingGuard comment now matches current default-off / per-run opt-in behavior and does not flip runtime defaults.
- Existing PcvNodeEvidence code path already treats terminal tool calls as evidence-producing calls.

## Validation

Passed:

- npm run build:check
- npm run test -- test/llm-input-layering.test.ts test/pcv-observe-only-baseline.characterization.test.ts test/pcv-observe-only-five-scenario.acceptance.test.ts
- npm run check
- git diff --check
- rg -n 'terminal_shell|terminal_pty|terminal_run' src/agent/prompts src/agent/runtime test/llm-input-layering.test.ts config/agent-public-api-signatures.json package.json
- rg -n '@alembic/agent/tools/terminal|"./tools/terminal"|dist/tools/terminal|export \* from .*/terminal' package.json src test/contract-surface.test.ts test/entrypoint-effects.test.ts config/agent-public-api-signatures.json docs/entrypoint-effects.md

Notes:

- npm run check passed with the repository's existing four Biome warnings in scripts/codemod-rename.mjs, scripts/smoke-agent-public-signatures.mjs, and scripts/verify-agent-validation-floor.mjs.
- Alembic code guard was invoked for the three changed files, but the plugin returned an internal schema error instead of a usable guard result. This is recorded as a validation-surface issue, not product-code evidence.

## Residual Risks

- No product-code risk known from this E-5 change.
- Guard result could not be obtained due Alembic MCP internal response-shape failure; repository build, targeted tests, negative grep, and full check all passed.
