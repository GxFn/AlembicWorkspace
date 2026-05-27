# AlembicPlugin Phase 8 Adapter Boundary Execution

Date: 2026-05-17

Scope: AlembicPlugin only. This record follows `docs/alembic-core-public-api-boundary-construction-plan-2026-05-17.md` Phase 8 and keeps Plugin documentation in workspace-level `docs/AlembicPlugin`.

## Core Baseline

- AlembicPlugin vendored Core submodule advanced from `8323aa2` to `dfb4c7c feat: add consumer core import boundary lint`.
- Core checker now available at `vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs`.
- The checker keeps Phase 8 policy separate from Plugin delivery logic:
  - stable public facades are allowed by default.
  - provisional/transitional/deep paths require the Plugin allowlist baseline.
  - `referenceLimits` prevent transitional references from growing.
  - mock references remain excluded by default, matching the current Plugin baseline.

## Plugin Integration

- Added package script:
  - `lint:consumer-core-imports`
  - command: `node vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary-allowlist.json`
- Updated `lint:core-import-boundary` to run both checks:
  - Plugin's existing exact-specifier/reference-limit checker.
  - Core's Phase 8 consumer import classifier.
- Updated `check` to include `npm run lint:core-import-boundary`.
- Updated `.github/workflows/ci.yml` Build & Lint job to run `npm run lint:core-import-boundary` after Biome lint.
- Kept `lint` as Biome-only so `npm run lint -- --diagnostic-level=error` continues to behave like the existing CI command.

## Boundary Result

Core Phase 8 checker:

- files scanned: 601
- `@alembic/core` references scanned: 688
- stable-public references: 211
- provisional-public references: 8
- transitional-internal references: 469
- issues: 0

Plugin exact boundary checker:

- references: 777
- unique specifiers: 113
- issues: 0

The count difference is expected: Core's Phase 8 checker excludes mock references by default; Plugin's existing checker keeps the stricter local historical count.

## Explicitly Preserved Plugin Responsibilities

- Codex MCP tool schemas and response envelopes.
- Codex Skill text and tool names.
- Permission/tool policy.
- Daemon bridge and runtime status.
- Plugin cache paths.
- Marketplace/channel packaging and release logic.
- API key readiness and AI provider execution.

## Validation

- `npm run lint:consumer-core-imports`
  - Passed: 601 files, 688 Core imports, 0 issues.
- `npm run lint:core-import-boundary`
  - Passed: 777 refs, 113 unique specifiers; Core checker also passed.
- `npm run lint -- --diagnostic-level=error`
  - Passed after applying two Biome-safe import ordering fixes.
- `npm run check`
  - Passed; existing Biome warnings remain warnings.
- `npm run build:check`
  - Passed.
- `git diff --check`
  - Passed.

## Notes

- No `adapterPathGlobs` broadening was added.
- No new Core deep path was added.
- No Codex/plugin/agent/provider/channel logic was moved to Core.
- Existing transitional imports remain governed by `config/core-import-boundary-allowlist.json`; future additions must be handled through documented Core gaps or stable facades.
