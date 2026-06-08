# Test Scripts

This directory stores only reusable scripts for the active `Test` surface. Old
one-off verification probes remain in `AlembicTest/scripts/` and historical
reports remain in `AlembicTest/docs/`.

## Keep Criteria

Keep a script here only when it has a current Test consumer:

- environment readiness;
- real-project runtime restart or passive monitoring;
- Codex Plugin / MCP evidence collection assigned to Test;
- BiliDili / AlembicWorkspace cold-start or resident route evidence;
- multi-root ProjectScope verification;
- raw evidence retention audit.

Do not rebuild old wave-specific probes here merely because they existed in
`AlembicTest`.

## Current Scripts

- `restart-alembic.mjs`: restart or inspect the local Alembic runtime for a
  selected test target, with secret-safe AI config reporting.
- `verify-test-environment.mjs`: read-only daemon readiness check for health,
  test-mode, resolved URL/data root, and compact jobs API.
- `monitor-alembic-bootstrap.mjs`: passive bootstrap monitor using compact jobs
  API and focused log signals.
- `probe-codex-prime.mjs`: fresh Codex MCP prime evidence when a controller
  test card assigns Plugin / host-environment verification to Test.
- `probe-resident-vector-search.mjs`: fresh Codex MCP resident search evidence
  for assigned Plugin / resident-route checks.
- `probe-unified-resident-service.mjs`: unified resident-service boundary probe
  for baseline and resident phases.
- `probe-cold-start-process-timeline.mjs`: bounded real-project cold-start
  process timeline probe.
- `probe-multi-root-project-scope.mjs`: AlembicWorkspace multi-root
  ProjectScope daemon/API probe.
- `tmp-evidence-retention.mjs`: dry-run raw evidence retention audit.

## Legacy Scripts Not Rebuilt

The following old AlembicTest scripts were intentionally not rebuilt in this
active Test surface because they were wave-specific, duplicated by current Test
skills, or had no standing consumer:

- Dashboard artifact-detail LLMI probe;
- LLM input layering / observation-ledger / package-runtime probes;
- PCV / PCVM baseline and N9 observability probes;
- PrimeInjectionPackage G037 smoke;
- project-skill runtime delivery probe;
- Tool/Terminal baseline helper.

Use the historical `AlembicTest/` copy only when a controller state root asks to
replay that old evidence path.

## Commands

```bash
npm --prefix Test run check
npm --prefix Test run verify:env -- --json
npm --prefix Test run monitor -- --watch
npm --prefix Test run probe:cold-start-timeline -- --project BiliDili
npm --prefix Test run probe:multi-root-project-scope -- --output Test/tmp/multi-root-project-scope.json
```
