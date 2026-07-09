# Controller Review: P1 Plugin Consumption Wording Guidance

- Demand: `alembic-proactive-activation-2026-07-03`
- Dispatch group: `p1-plugin-consumption-wording-guidance-p1`
- Target: `AlembicPlugin / p1-plugin-consumption-wording-guidance-t1`
- Target commit reviewed: `0bf5734cd33488b41e0412fb60047b1d98f8552d`
- Controller decision input: acceptable after raw source, tests, build, check, and Guard review.

## Requirement Slice

Design authority is `Design/docs/current/alembic-proactive-activation-2026-07-03.md` §10.4 and §10.6 P1:

- Update only WS-4 proactive consumption wording and guidance.
- Add when-to-use first sentences for `alembic_recipe_map`, `alembic_search`, and `alembic_graph`.
- Leave `alembic_prime` description unchanged.
- Preserve capability bullets, Non-goal text, public schemas, output contracts, and non-WS-4 behavior.
- Make prime recommend `alembic_search` first, then `alembic_recipe_map` and `alembic_graph`.
- Add consumption-loop guidance in MCP initialize instructions and onboarding `stagedProtocol`.

## Source Evidence Reviewed

- `AlembicPlugin/lib/host-runtime/mcp/tools.ts`
  - `alembic_recipe_map` first line now says to use it when the user asks which Recipes govern a code region/file/module before editing.
  - `alembic_search` first line now targets project standards, conventions, prior decisions, and known rules.
  - `alembic_graph` first line now targets imports, dependencies, impact, structure, call paths, files, symbols, and project relations before code changes.
  - Existing capability bullets and Non-goal text remain present in the same declarations.
- `AlembicPlugin/lib/host-runtime/mcp/handlers/agent-public-tools.ts`
  - `buildPrimeProjectContextGuidance` now emits `recommendedQueries[0].tool = 'alembic_search'`.
  - `recommendedTools` is `['alembic_search', 'alembic_recipe_map', 'alembic_graph']`.
- `AlembicPlugin/lib/host-runtime/mcp/host/guidance.ts`
  - `buildConsumptionLoopPlaybookLine` was added to the playbook.
  - The line instructs host agents to call `alembic_search` after `alembic_prime` recommended queries or detail refs.
- `AlembicPlugin/lib/host-runtime/status/OnboardingContract.ts`
  - `stagedProtocol` now says to consume prime recommended queries/detail refs with `alembic_search` before coding, using recipe_map/graph for ProjectContext and relation evidence.

## Test Evidence Reviewed

- `AlembicPlugin/test/unit/KnowledgeContextPublicSurfaceGuidance.test.ts`
  - Locks the three new first lines.
  - Confirms prime description still contains the original active prime wording.
  - Confirms `alembic_search` and `alembic_graph` forbidden legacy phrases remain absent.
  - Confirms input schemas equal `zodToMcpSchema` for prime, recipe_map, search, and graph.
  - Confirms initialize guidance and staged protocol include consumption through search.
- `AlembicPlugin/test/unit/AgentPublicToolsActive.test.ts`
  - Locks prime `recommendedTools` order with `alembic_search` first and a first search recommended query.
- `AlembicPlugin/test/unit/HostMcpServer.test.ts`
  - Locks initialize instructions containing `Project knowledge consumption` and `call alembic_search first`.
- `AlembicPlugin/test/integration/ZodToMcpSchema.test.ts`
  - Keeps current schema expectations explicit.

## Controller-Rerun Validation

- `npx vitest run --config vitest.unit.config.ts test/unit/KnowledgeContextPublicSurfaceGuidance.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/HostMcpServer.test.ts`
  - PASS: 3 files, 76 tests.
- `npx vitest run test/integration/ZodToMcpSchema.test.ts`
  - PASS: 1 file, 19 tests.
- `npm run build:check`
  - PASS. Core build used `../AlembicCore @ 73cb9a340a4044eed68977d5ddbc36491deda674`; `tsc --noEmit` passed.
- `npm run check`
  - PASS. Typecheck, lint, core/layer/repo/scope boundary, shared/cross-shell drift, doctrine, naming, retired-symbols, and ring-direction all passed. Biome printed 19 pre-existing warnings outside this P1 changed-file set and exited 0.
- `git diff --check`
  - PASS.
- `alembic_code_guard`
  - PASS: `guard-public-mracdaj4-1`; 8 explicit files checked, 0 violations, 0 warnings. Guard's commit-driven side channel saw a stale checkpoint range including P0+P1 files, so controller acceptance uses only the explicit 8-file scope plus raw source/tests/build/check above.

## Boundary Judgment

- P1 stayed inside AlembicPlugin and WS-4. No WS-2 skill path, WS-5 managed context block, WS-6 cold-start auto-sync, telemetry/session usage behavior, project-scope routing, or output schema semantic behavior was changed.
- The target result originally mixed file paths and prose in `evidenceRefs`, so Wakeflow could not resolve the refs. Controller reviewed the raw evidence directly and repaired the refs to path-like evidence before reducer/decision.

## Controller Verdict Input

The implementation proves the assigned behavior: existing knowledge tools are more likely to be selected through when-to-use wording and prime-to-search/map/graph consumption guidance, while schemas and contracts remain unchanged. P1 is ready for controller acceptance.
