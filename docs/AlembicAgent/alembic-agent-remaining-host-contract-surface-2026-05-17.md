# AlembicAgent Remaining Host Contract Surface

Date: 2026-05-17

Owner window: `AlembicAgent`

Status: completed.

Commit: `bd97459`

## Completed Scope

Added explicit public subpaths for the remaining host-facing Agent contracts needed by `Alembic` Wave 3 cutover:

- `@alembic/agent/forge`
- `@alembic/agent/tasks`
- `@alembic/agent/profiles`

Code changes:

- Added `src/agent/forge/index.ts`.
- Added `src/agent/tasks/index.ts`.
- Added `src/agent/profiles/index.ts`.
- Added package exports for `./forge`, `./tasks`, and `./profiles`.
- Exported real task handler context/type contracts from `AgentTaskHandlers.ts`.
- Added `test/remaining-host-contract.test.ts`.
- Updated package phase metadata to `phase-8-remaining-host-contract`.

## Public Contracts

### `@alembic/agent/forge`

Exports:

- `ToolForge`
- `DynamicComposer`
- `SandboxRunner`
- `TemporaryToolRegistry`
- `ToolRequirementAnalyzer`
- Related request/result/spec/type contracts.

### `@alembic/agent/tasks`

Exports:

- `taskCheckAndSubmit`
- `taskDiscoverAllRelations`
- `taskFullEnrich`
- `taskQualityAudit`
- `taskGuardFullScan`
- `TaskContext`
- `TaskAiProvider`
- `CandidateInput`
- `DuplicateEntry`
- `KnowledgeItem`
- `KnowledgeServiceLike`
- `GuardViolation`

### `@alembic/agent/profiles`

Exports:

- `PRESETS`
- `getPreset`
- `resolveStrategy`
- `AgentProfileCompiler`
- `AgentProfileRegistry`
- `AgentStageFactoryRegistry`
- `BUILTIN_PROFILES`
- Built-in profile definition groups.

## Host Boundary

Not moved into `AlembicAgent`:

- Alembic DI container wiring.
- Dashboard/Mac/Skill/Terminal execution adapters.
- `ToolContextFactory`.
- Codex plugin delivery, MCP schema, or plugin runtime code.
- Alembic HTTP route / module glue.

The exported contracts are real implementation barrels over the existing migrated code, not empty facades.

## Verification Commands

Run from `AlembicAgent`:

- `npm run build:check`
- `npm run test`
- `npm run check`
- `npm run build`
- Self-reference import smoke for:
  - `@alembic/agent/forge`
  - `@alembic/agent/tasks`
  - `@alembic/agent/profiles`

## Verification Results

- `npm run build:check`: passed.
- `npm run test`: passed, 7 test files and 30 tests.
- `npm run check`: passed.
- `npm run build`: passed.
- Self-reference import smoke: passed.
- Biome still reports the existing 27 warnings, but they do not block `npm run check`.

## Residual Risks

- `Alembic` still needs to switch the last local production imports to these new subpaths.
- Local `Alembic/lib/agent/**` deletion remains Wave 4 work and is not unlocked until Alembic import scans prove production local Agent imports are zero.
- `ToolForge` is now exported as a contract, but concrete host wiring still belongs in `Alembic`.

## Recommended Next Step

`Alembic` can start Wave 3 cutover:

- `lib/injection/modules/AgentModule.ts` should import `ToolForge` from `@alembic/agent/forge`.
- `lib/http/routes/ai.ts` should import task handlers from `@alembic/agent/tasks`.
- `lib/http/routes/ai.ts` should import `PRESETS` from `@alembic/agent/profiles`.

After that, `Alembic` should extend boundary lint to catch production relative imports into local `lib/agent/**`.
