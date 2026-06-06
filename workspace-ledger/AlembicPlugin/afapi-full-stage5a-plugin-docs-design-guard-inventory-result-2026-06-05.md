# AFAPI Full Stage 5A Plugin Docs Design Guard Inventory Result 2026-06-05

## Target

- Window: AlembicPlugin execution window.
- Task: `AFAPI-FULL-STAGE5A-PLUGIN-DOCS-DESIGN-GUARD-P8B`.
- Dispatch group: `AFAPI-FULL-STAGE5A-CONDITIONAL-CLOSURE-INVENTORY-20260605`.
- Scope: read-only conditional inventory for `AFAPI-FULL-19` and Plugin-side `AFAPI-FULL-20`.

## Position And No-Commit Reason

- I am the AlembicPlugin execution window and only reviewed AlembicPlugin-owned Codex MCP, Skill guidance, channel/runtime-facing code, install/runtime consumer contracts, and Codex host adaptation.
- This task explicitly forbids product implementation. No AlembicPlugin product source, runtime bundle, embedded runtime submodule, shipped Skill, README, test, or marketplace/channel file was modified.
- No product commit was created because the required output is a read-only inventory dossier plus `TargetResultEnvelope`.

## Verdicts

| Item | Plugin-side verdict | Reason |
| --- | --- | --- |
| `AFAPI-FULL-19` docs/design lint/check separate capability | `不应做` inside `alembic_code_guard`; `待裁决` for any new independent no-code lint/check tool | Plugin code and active guidance already make `alembic_code_guard` code/file scoped. Docs/design/status no-code work should not be routed through Code Guard. No separate docs/design lint/check MCP tool exists in Plugin today; adding one would be a new product decision outside Stage 5A. |
| Plugin-side `AFAPI-FULL-20` intent record / intent episode naming exposure | `已覆盖` for active public tool surface; producer migration remains `待 Alembic P8C 裁决` | Active public tools expose `intentRef` and local `IntentRecord` semantics, and intentionally keep physical `IntentEpisode` handoff out of `alembic_prime`. Plugin still has compatibility/resident client consumers for `/api/v1/intent-episodes`; if Alembic producer renames or migrates the physical route/store, Plugin will need a compatibility-aware follow-up only after that producer decision. |

## AFAPI-FULL-19 Evidence

- Public tool description is explicitly code-scoped: `lib/codex/mcp/public-tools/descriptions.ts:56-65` says `alembic_code_guard` runs over explicit files or inline code, selected when code/diff scope is explicit, and does not infer unbounded repository scope or no-args whole-diff review.
- Public schema is explicit-scope only: `lib/shared/schemas/mcp-tools.ts:226-246` describes `CodeGuardInput.files` as explicit files, states empty/omitted scope returns a structured blocker, and says no-args whole-diff behavior is intentionally blocked.
- Handler enforces the boundary: `lib/codex/mcp/handlers/agent-public-tools.ts:630-676` returns `blocked` / `missing-guard-scope` when neither files nor inline code is present; `agent-public-tools.ts:678-739` only calls underlying Guard for inline `code` or explicit `files`.
- Legacy guard compatibility now matches the boundary: `lib/codex/mcp/handlers/guard.ts:1-8` documents no-args as structured blocker, and `guard.ts:330-355` blocks old no-args `alembic_guard` with `GUARD_SCOPE_REQUIRED` and points to `alembic_code_guard` with explicit files or inline code.
- Shipped guidance does not route docs/design to Code Guard: `plugins/alembic-codex/skills/alembic-guard/SKILL.md:10-51` says `alembic_code_guard` checks specific files or inline snippets, and missing scope should be reported as blocked instead of forcing no-args checks. `plugins/alembic-codex/skills/alembic/SKILL.md:26-32` recommends Guard only after meaningful code edits and only with explicit returned files.
- Cross-host prompt snapshot is aligned: `lib/codex/mcp/public-tools/cross-host-readiness.ts:105-106` says to use `alembic_code_guard` only with explicit files or inline code.
- Lifecycle policy treats no-code/docs-only work as non-Guard: `lib/service/task/TaskLifecyclePolicy.ts:159-189` skips Guard for no diff and docs-only diffs. `test/unit/TaskLifecyclePolicy.test.ts:106-121` locks `no-code-diff` and `docs-only-diff` behavior.
- Repo search found no Plugin-owned docs/design/status lint/check public tool. Targeted searches for `alembic_docs`, `alembic_design`, `docs/design.*code_guard`, docs/design lint/check, and no-code guard surfaces only found status docs wording, lifecycle no-code reason codes, and unrelated `alembic_check_duplicate` metadata.

## AFAPI-FULL-20 Evidence

- Active public API stores local intent records, not physical episodes: `lib/codex/mcp/handlers/agent-public-tools.ts:116-128` defines `IntentRecord`, `agent-public-tools.ts:170-176` keeps process-local `INTENT_RECORDS`, `agent-public-tools.ts:199-212` captures and remembers a record, and `agent-public-tools.ts:1816-1827` caps the map at 100 records.
- Active public prime intentionally excludes IntentEpisode handoff: `lib/codex/mcp/handlers/agent-public-tools.ts:312-318` passes `createUnavailablePrimeIntentEpisodeMaterial('agent-public-prime keeps IntentEpisode handoff out of Stage 3 active surface')`.
- Active prime expects `intentRef` / fallback intent rather than a physical store: `lib/codex/mcp/handlers/agent-public-tools.ts:1040-1066` blocks missing intent scope and missing local intent records unless explicit fallback intent exists.
- Host intent intake boundary is not durable storage: `lib/service/task/HostIntentFrame.ts:1-6` states this Plugin-owned host intent layer normalizes input and merges `IntentExtractor` results, and does not create persistent `IntentEpisode`.
- Plugin still has a resident compatibility consumer for producer routes: `lib/service/resident/AlembicResidentServiceClient.ts:223-283` defines `ResidentIntentEpisode*` types; `AlembicResidentServiceClient.ts:389-390` binds `/api/v1/intent-episodes`; `AlembicResidentServiceClient.ts:573-632` implements start/latest/recent/update calls; `AlembicResidentServiceClient.ts:830-910` degrades if local resident route/token/response is unavailable.
- DI exposes that compatibility client: `lib/service/resident/AlembicResidentCapabilityClients.ts:57-84` and `lib/injection/modules/AppModule.ts:68-108`.
- Legacy task prime/session flow still consumes resident IntentEpisode: `lib/codex/mcp/handlers/task.ts:1294-1364` handles start/latest/recent resident calls and `task.ts:1449-1469` uses redacted session identifiers.
- Tests cover both successful and degraded consumer behavior: `test/unit/AlembicResidentServiceClient.test.ts:719-885` verifies start/read/outcome calls on `/api/v1/intent-episodes`; `AlembicResidentServiceClient.test.ts:887-931` verifies old-daemon route absence degrades. `test/unit/TaskPrimeKnowledgeMaterial.test.ts:891-1008` verifies legacy task flow redacts raw ids/private paths and surfaces `intentEpisode` material safely.

## Verification Commands

- `npm test -- --run test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsCrossHostReadiness.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/AlembicResidentServiceClient.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/TaskLifecyclePolicy.test.ts` -> 7 files / 46 tests passed.
- `npm run build:check` -> passed; Core build used `../AlembicCore @ e3eda0450db9d27974c1ef1f945fb5a5f4793ea0`.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin diff --check` -> passed.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/plugins/alembic-codex diff --check` -> passed.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin status --short` -> clean before dossier creation and no product file changes after dossier creation.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/plugins/alembic-codex status --short` -> clean before dossier creation and no embedded runtime file changes after dossier creation.

## Not Modified

- No product source files under `AlembicPlugin/lib`.
- No Plugin tests under `AlembicPlugin/test`.
- No shipped skills or docs under `AlembicPlugin/plugins/alembic-codex`.
- No embedded runtime submodule files, runtime bundles, channel, marketplace, install verification scripts, or package metadata.
- No Alembic, AlembicCore, AlembicDashboard, AlembicAgent, AlembicDesign, AlembicTest, or real project files.

## Risks And Next Suggestions

- `AFAPI-FULL-19`: If the product now wants docs/design/status lint/check as a user-visible no-code capability, it should be a separate user-confirmed design package, not an expansion of `alembic_code_guard`.
- `AFAPI-FULL-20`: Plugin active public surface is clean, but resident compatibility naming remains tied to `/api/v1/intent-episodes`. Wait for Alembic producer inventory before deciding any Plugin rename/adapter work.
- If Alembic producer keeps the physical route for compatibility, Plugin can likely leave current consumers unchanged. If producer migrates route/store naming, require a compatibility matrix and targeted consumer tests before Plugin implementation.
