# Legacy AlembicTest Map

Status: reference map
Maintained By: Test
Last Rebuilt: 2026-06-08

## Purpose

`AlembicTest/` is the previous external Test repository. Historical reports
and raw evidence stay there. This `Test` directory is now the configured active
Test surface.

Use this map to locate legacy evidence without migrating old data.

## Current Authority

- Active Test window: `Test`
- Active config: `Test/config/defaults.json`
- Active scripts: `Test/scripts/`
- Active package wrappers: `Test/package.json`
- Active Alembic route skill: `Test/skills/alembic-real-routes/SKILL.md`
- Historical source: `AlembicTest/`
- Historical reports: `AlembicTest/docs/`
- Historical raw evidence: `AlembicTest/tmp/`

The old `AlembicTest` and `AlembicTest-IDE` identities are historical. Current
dispatch identity is `Test`; route selection happens inside Test based on the
state-root test card or user request.

## Rebuilt Capability

The following legacy capability has been rebuilt in the new surface:

- `config/defaults.json`: BiliDili / AlembicWorkspace test target defaults,
  restart and monitor timing, Codex MCP reload boundary notes, and AI config
  source names without secrets.
- `package.json`: script wrappers for restart, environment verify, monitoring,
  reusable probes, and tmp retention audit.
- `scripts/*.mjs`: reusable environment, real-project, MCP, resident,
  cold-start, multi-root ProjectScope, and evidence-retention probes.
- `skills/alembic-real-routes/SKILL.md`: route selection, BiliDili test-mode
  route, protected-project manual route, monitoring route, restart
  troubleshooting, and evidence checklist.

Old one-off scripts for LLMI, PCV / PCVM, G037 PrimeInjectionPackage,
project-skill runtime delivery, and Tool/Terminal baseline were not rebuilt in
`Test/`. They remain in `AlembicTest/scripts/` with their historical reports.

## Historical Report Categories

Important historical evidence remains under `AlembicTest/docs/`:

- BiliDili prime and resident routes:
  `bilidili-prime-*.md`, `bilidili-resident-vector-search-*.md`, and
  `unified-resident-service-bilidili-integration-2026-05-23.md`.
- Cold-start and Dashboard behavior:
  `cold-start-*.md`, `live-socket-append-rich-content-retest-2026-05-24.md`,
  and `llm-input-dashboard-artifact-detail-test-mode-2026-05-25.md`.
- LLM input and package integration:
  `llm-input-*.md`, `llm-output-completeness-test-mode-2026-05-24.md`, and
  `g037-prime-injection-package-real-smoke-2026-05-27.md`.
- Multi-root and project-scope checks:
  `multi-root-project-scope-*.md` and
  `project-skill-runtime-delivery-test-mode-2026-05-24.md`.
- PCV / PCVM evidence:
  `pcv-*.md`, `pcvm-*.md`, and
  `pcvm-tool-terminal-usage-baseline-2026-05-31.md`.

For complete historical inventory, read the source directory directly:

```bash
find AlembicTest/docs -maxdepth 1 -type f -name '*.md' -print
```

## Use Rules

- Read historical reports in place.
- Do not copy old `docs` reports or `tmp` raw evidence into `Test`.
- Do not reuse old localhost URLs, pids, ports, cache markers, mtimes, or
  runtime state as live facts.
- New evidence should use `Test/tmp/` for raw ignored output and `Test/docs/`
  for durable summaries unless the current state root names another location.
- Deleting old raw evidence requires explicit user or state-root authorization.
