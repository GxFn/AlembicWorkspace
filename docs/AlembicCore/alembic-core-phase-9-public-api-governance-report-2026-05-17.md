# AlembicCore Phase 9 Public API Governance Report

Date: 2026-05-17

## Scope

Phase 9 completes the first Core-side governance layer after all three repositories reached Phase 8.

This phase does not add new runtime public API. It makes the current public API boundary machine-readable and CI-enforced.

## Core Work Completed

- Added `AlembicCore/config/public-api-boundary.json` as the source of truth for export classification.
- Added `AlembicCore/scripts/public-api-boundary-policy.mjs` for shared classification logic.
- Added `AlembicCore/scripts/check-public-api-boundary.mjs`.
- Updated `AlembicCore/scripts/lint-consumer-core-imports.mjs` to use the shared policy.
- Updated `AlembicCore/test/support/public-api-inventory.ts` to read the shared policy.
- Added `npm run lint:public-api-boundary`.
- Added `npm run lint:public-api-boundary` into `npm run check`.
- Added Core CI step: `npm run lint:public-api-boundary`.
- Included the policy and boundary scripts in the npm package `files`.

## Current Locked Counts

| Status | Count |
| --- | ---: |
| Stable Public | 15 |
| Provisional Public | 21 |
| Transitional Internal | 98 |
| Internal Only | 0 |
| Forbidden | 0 |

Package exports:

| Type | Count |
| --- | ---: |
| Exact exports | 73 |
| Wildcard exports | 61 |
| Total exports | 134 |

## Outer Repository Scan

| Repository | Files | Core imports | Stable | Provisional | Transitional | Violations |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Alembic | 630 | 755 | 216 | 42 | 497 | 0 |
| AlembicPlugin | 601 | 688 | 211 | 8 | 469 | 0 |

## Phase 1-9 Outer Acceptance Update

After the Alembic and AlembicPlugin windows advanced through Phase 9, the current acceptance scan is recorded in:

- `docs/AlembicCore/alembic-core-phase-1-9-outer-repo-acceptance-report-2026-05-17.md`

Current post-migration scan:

| Repository | Files | Core imports | Stable | Provisional | Transitional | Violations |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Alembic | 630 | 755 | 321 | 42 | 392 | 0 |
| AlembicPlugin | 601 | 675 | 454 | 8 | 213 | 0 |

Important follow-ups:

- Alembic must fix CI submodule checkout and add Core boundary lint into CI.
- AlembicPlugin must format `config/core-import-boundary-allowlist.json` before CI can pass.
- AlembicPlugin should unify the old local boundary script count with the Core scanner count.

## Hard Rules

1. Public API export changes must update `config/public-api-boundary.json`.
2. Wildcard exports remain Transitional Internal during boundary construction.
3. New Stable Public entries require real implementation coverage, tests, and outer migration notes.
4. Consumer repositories must use Stable Public facades for new imports.
5. Transitional imports may stay only as existing baseline entries and must not grow.
6. Core still does not own Codex tools, AgentRuntime, AI providers, API keys, Dashboard presenter logic, or channel delivery.

## Next Work For Outer Windows

Alembic and AlembicPlugin should continue replacing existing deep imports with available stable facades:

- `@alembic/core/logging`
- `@alembic/core/events`
- `@alembic/core/io`
- `@alembic/core/workspace`
- `@alembic/core/knowledge`
- `@alembic/core/dimensions`
- `@alembic/core/project-intelligence`
- `@alembic/core/host-agent-workflows`

Any remaining unreplaceable import must be reported back with file path, current specifier, attempted stable replacement, and missing Core contract.
