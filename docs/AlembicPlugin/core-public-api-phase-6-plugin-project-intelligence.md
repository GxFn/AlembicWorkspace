# AlembicPlugin Phase 6 Project Intelligence Boundary Execution

Date: 2026-05-17

Scope: AlembicPlugin only. This record follows `docs/alembic-core-public-api-boundary-construction-plan-2026-05-17.md` Phase 6 and keeps Plugin documentation in workspace-level `docs/AlembicPlugin`.

## Core Baseline

- Core submodule remained at `7865bf3 docs: unify agent document storage guidance`.
- Core stable entry used by Plugin: `@alembic/core/project-intelligence`.
- Verified grammar resource facade from Plugin runtime:
  - `resolveCoreGrammarResourcesDir()` resolves to `vendor/AlembicCore/resources/grammars`.
  - `listCoreGrammarResources()` reports 11 resources.

## Completed Plugin Batches

- Module and injection services now import project-intelligence capabilities through `@alembic/core/project-intelligence`:
  - `lib/service/module/ModuleService.ts`
  - `lib/injection/ServiceContainer.ts`
  - `lib/injection/ServiceMap.ts`
  - `lib/injection/modules/KnowledgeModule.ts`
  - `lib/injection/modules/PanoramaModule.ts`
- Wiki and AI helper code now uses the stable facade for `LanguageService`; Plugin-owned AI provider wiring stays in AlembicPlugin:
  - `lib/external/ai/AiProvider.ts`
  - `lib/service/wiki/WikiGenerator.ts`
  - `lib/service/wiki/WikiRenderers.ts`
  - `lib/service/wiki/WikiUtils.ts`
- MCP/workflow handlers now use the facade for project analysis, snapshots, diff planning, and `ProjectIntelligenceCapability`; MCP handler envelopes and Plugin delivery logic stayed local:
  - bootstrap/rescan/structure/guard handlers
  - internal dimension execution builders and pipeline files
- Project intelligence test and script imports were migrated to the stable facade where Core exports the API:
  - AST analyzer functions
  - discovery registry and config parsers
  - panorama analyzers/services/types
  - call graph analyzers
  - project snapshot builder/types
  - incremental project analysis planner and snapshot store

## Remaining Allowed Exceptions

- `@alembic/core/types/snapshot-views`
  - Still used for `PipelineFillView` in Plugin workflow files.
  - Reason: `PipelineFillView` is not exported by `@alembic/core/project-intelligence` yet.
  - Boundary status: retained as a documented transitional type import.
- `@alembic/core/core/ast/lang-*`
  - Still used only in `test/unit/CallGraphAnalyzer.test.ts` compatibility tests.
  - Reason: the facade does not expose language-specific AST module entrypoints, and these tests intentionally validate direct language module behavior.
  - Boundary status: retained as test-only migration compatibility imports.

## Boundary Gate Update

- `config/core-import-boundary-allowlist.json`
  - Phase label advanced to Phase 1 baseline with Phase 2/3/4/5/6 gates.
  - `referenceCount`: 801.
  - `uniqueSpecifierCount`: 138.
  - Added stable allowlist entry: `@alembic/core/project-intelligence`.
  - Removed obsolete Phase 6 deep project-intelligence paths from the allowlist:
    - `@alembic/core/core/AstAnalyzer`
    - `@alembic/core/shared/LanguageService`
    - `@alembic/core/core/analysis/*`
    - `@alembic/core/core/ast` and `@alembic/core/core/ast/ProjectGraph`
    - `@alembic/core/core/discovery*`
    - `@alembic/core/service/panorama/*`
    - `@alembic/core/types/project-snapshot*`
    - `@alembic/core/workflows/capabilities/project-intelligence/*`

## Validation

- `./node_modules/.bin/biome check --write ...`
  - Passed with existing warnings in integration tests.
- `npm run lint:core-import-boundary`
  - Passed: 801 refs, 138 unique specifiers.
- `npm run build:check`
  - Passed.
- `npm run test:unit -- test/unit/CallGraphAnalyzer.test.ts test/unit/PanoramaService.test.ts test/unit/ProjectIntelligenceIncrementalPlanner.test.ts`
  - Passed: 126 tests.
- Grammar facade runtime check:
  - Passed: 11 Core grammar resources visible from `@alembic/core/project-intelligence`.

## Next Core Blockers

- Export `PipelineFillView` or an equivalent snapshot view facade from Core before Plugin can remove `@alembic/core/types/snapshot-views`.
- Decide whether language-specific AST modules should receive stable public test entrypoints before removing `@alembic/core/core/ast/lang-*` compatibility imports.
