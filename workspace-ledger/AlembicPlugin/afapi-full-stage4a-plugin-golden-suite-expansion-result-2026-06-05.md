# AFAPI Full Stage 4A Plugin Golden Suite Expansion Result 2026-06-05

## Target

- Window: AlembicPlugin
- Task: `AFAPI-FULL-STAGE4A-PLUGIN-GOLDEN-SUITE-EXPANSION-P7`
- Dispatch group: `AFAPI-FULL-STAGE4A-GOLDEN-SUITE-EXPANSION-20260605`
- Scope: AlembicPlugin-only prompt / golden / evaluation coverage for `AFAPI-FULL-18`.

## Completion Scope

- Expanded `test/unit/AgentPublicToolsEvaluation.test.ts` with a Stage 4A golden suite matrix for the remaining `AFAPI-FULL-18` slices.
- Added prompt/guidance assertions across active public tool descriptions, the shipped Alembic Codex skill, and cross-host prompt snapshots.
- Added real handler evaluation for wrong-call, missing-call, raw-envelope, fake-work, noisy-guard, stale-decision, over-budget, and adoption/feedback drift.
- Extended the prime search fixture with resident retrievalConsumer feedback metadata so adoption/feedback metadata is asserted instead of inferred.

## Commits

- Parent AlembicPlugin commit: `472287a2a3f0172daf27cb789f55c627b2c4c551` (`test: expand agent public golden suite`)
- Embedded runtime commit: no new commit. Current nested `plugins/alembic-codex` HEAD remains `cc6316df849dc9d39530ed44d7e53f7cde2e6233`; Stage 4A only changed a parent test file and did not change host-visible runtime, plugin assets, channel, marketplace, packaged runtime, or installed-cache assets.

## Changed Files

- `test/unit/AgentPublicToolsEvaluation.test.ts`

## Coverage Matrix

| Slice | Tool / Surface | Expected semantics | Evidence |
| --- | --- | --- | --- |
| wrong-call | `tools/list` / hidden compatibility | `skipped`; old `alembic_task` public call is hidden from active tools while hidden direct-call compatibility remains | Stage4A matrix outcome `legacy-public-call-hidden`; active `TOOLS` does not include `alembic_task` |
| missing-call | `alembic_prime` | `blocked` / `missing-required-intent` | Prime with no `intentRef` and no explicit fallback blocks instead of guessing |
| raw-envelope | `alembic_intent` | `skipped` / `mechanical-envelope-only` | Raw `<codex_delegation>` intake skips and requests curated intent/source refs |
| fake-work | `alembic_work_finish` | `blocked` / `missing-work-ref` | Fake `workRef` has no active work record and cannot become completion evidence |
| noisy-guard | `alembic_code_guard` | `blocked` / `missing-guard-scope` | No-scope guard blocks and states it will not fall back to whole-diff review |
| stale-decision | `alembic_decision_record` | `blocked` / `decision-register-unavailable` | Stale/missing durable route blocks and summary states no Plugin-local fake record was written |
| over-budget | `alembic_work_start` | `ready` with `outputBudget.truncated=true` | Long host-visible summary is compacted within `maxChars=48` |
| adoption/feedback | `alembic_prime` | `ready`; resident feedback metadata preserved | `retrievalConsumer.feedback.observeOnly=true`, supported signals include `searchHit`, `view`, `adoption`, and `feedbackSignalCount=3` |

## Legacy Guidance Evidence

- Active public tool descriptions still omit old `operation=prime`, `operation=create`, `operation=close`, `Task and decision management (5 operations)`, and `primary action is \`alembic_task\`` wording.
- Cross-host prompt snapshots still do not contain `alembic_task`.
- The shipped Alembic Codex skill still names the six public tools and only mentions legacy `alembic_task` as hidden direct-call compatibility, not as a public workflow surface.

## Verification

- `npx vitest run --config vitest.unit.config.ts test/unit/AgentPublicToolsEvaluation.test.ts` -> 1 file / 6 tests passed.
- `npm test -- --run test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsCrossHostReadiness.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/CodexMcpServer.test.ts` -> 5 files / 69 tests passed.
- `npm run build:check` -> passed; Core build used `../AlembicCore @ e3eda0450db9d27974c1ef1f945fb5a5f4793ea0`.
- `npm run build` -> passed; Core build used `../AlembicCore @ e3eda0450db9d27974c1ef1f945fb5a5f4793ea0`.
- `npm run lint:repo-boundary` -> passed.
- `npm run lint -- --diagnostic-level=error` -> passed; 201 files checked, no fixes applied.
- `npx biome check --diagnostic-level=error test/unit/AgentPublicToolsEvaluation.test.ts` -> passed.
- `git diff --check` -> passed.
- `git -C plugins/alembic-codex diff --check` -> passed.
- Final parent status after commit: clean.
- Final embedded runtime status after commit: clean.

## Not Modified

- Did not modify Alembic, AlembicCore, AlembicDashboard, AlembicAgent, AlembicDesign, AlembicTest, or any real project.
- Did not add or change public MCP schema/enums.
- Did not delete hidden direct-call compatibility.
- Did not refresh local-dist, packaged wrapper, installed cache, channel, marketplace, or runtime bundle because host-visible runtime/assets did not change.
- Did not run a new real host smoke because this Stage 4A task is focused prompt/golden/evaluation coverage, not external host session verification.

## Risks

- This proves focused Plugin prompt/golden/evaluation behavior and active guidance snapshots, but it does not prove a fresh real Codex/Claude/generic host session.
- The wrong-call slice is represented as active-surface hiding plus hidden compatibility evidence; no compatibility cutoff or physical deletion was attempted.

## Next Suggestion

- Total control can review commit `472287a2a3f0172daf27cb789f55c627b2c4c551` and this dossier for Stage 4A acceptance.
- No Core promotion, Dashboard UI work, AlembicTest handoff, or user decision is required by this Stage 4A result; conditional `AFAPI-FULL-17/19/20` should remain total-control/final-acceptance decisions.
