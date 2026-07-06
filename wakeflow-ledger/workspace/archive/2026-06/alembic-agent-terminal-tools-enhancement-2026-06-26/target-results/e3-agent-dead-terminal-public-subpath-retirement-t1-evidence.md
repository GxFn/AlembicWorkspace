# E3 Agent Dead Terminal Public Subpath Retirement Evidence

Task: `e3-agent-dead-terminal-public-subpath-retirement-t1`
Window: `AlembicAgent`
Status: completed

## Commit

- `33ed20d Retire dead terminal public subpath`
- Repository status after commit: `main...origin/main [ahead 6]`, clean.

## Source Changes

- Deleted `src/tools/terminal/**`.
- Deleted `src/tools/core/LightweightRouter.ts`.
- Deleted `test/terminal-contract.test.ts`.
- Removed package export `./tools/terminal`.
- Removed root tools barrel reexports for `./terminal/index.js` and `./core/LightweightRouter.js`.
- Preserved live `src/tools/runtime/**` terminal.exec path.
- Updated runtime boundary and consumer seams to use `@alembic/agent/tools/runtime`.
- Updated public API boundary/signature snapshots to 12 stable exports.
- Updated entrypoint-effect docs and retirement/public-surface tests.
- Removed live prompt references to `terminal_pty` while preserving exec-only terminal guidance.

## Validation

- `npm run build:check` passed.
- Targeted tests passed:
  `npm run test -- test/runtime-terminal-safety.test.ts test/tool-v2-contract.test.ts test/tool-system.test.ts test/agent-dcr-retirements.test.ts test/contract-surface.test.ts test/entrypoint-effects.test.ts`
  Result: 6 test files, 46 tests.
- `npm run lint` passed with 4 existing warnings and exit code 0.
- `npm run lint:public-api-boundary` passed: 12 exact exports.
- `npm run lint:core-import-boundary` passed: 245 files, 46 `@alembic/core` imports.
- `npm run smoke:public-signatures` passed: 12 exports, 435 bindings.
- `npm run smoke:public-imports` passed: 12 public subpaths imported, 7 forbidden subpaths rejected.
- `npm run verify:validation-floor` passed:
  `testFiles=41 declaredTestCases=289 stablePublicExportCount=12 coreReferenceLimitTotal=52 packEntryCount=462`.
- `npm run check` passed:
  full build/lint/import/boundary/space/layer/doctrine/naming/signature/floor/test suite, 41 test files and 288 runtime tests.

## Negative Checks

- `test ! -d src/tools/terminal` passed.
- `test ! -f src/tools/core/LightweightRouter.ts` passed.
- `rg -n "terminal_shell|terminal_pty|terminal_run" src test docs config scripts` returned no matches.
- `rg -n "export \* from './terminal|\"\\./tools/terminal\"|dist/tools/terminal" package.json src/tools/index.ts config/agent-public-api-signatures.json test/entrypoint-effects.test.ts docs/entrypoint-effects.md` returned no matches.
- `rg -n "src/tools/terminal|#tools/terminal" src test docs config scripts package.json README.md` returned no matches.
- `git diff --check` passed.

## Risk

- Alembic Guard MCP was attempted and failed with a plugin schema/tool-surface internal error. No guard findings were produced. Repository validation commands above passed.
