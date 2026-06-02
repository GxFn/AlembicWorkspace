# Package AA Alembic Project-Space Cold-Start Baseline

Run ID: `pcv-20260530-1515-alembic-cold-start`
Scope: `live-ai-local Alembic project-space test-mode cold-start`
Owner: `PCVM`

## Boundary

This record is a baseline capture only. It does not classify root cause or declare token-efficiency pass/fail.

Test target:

- Project: `Alembic`
- Project root: `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`
- Dimension: `design-patterns`
- Trigger: Dashboard manual cold-start click
- Job source: `dashboard`
- Request: `maxFiles=500`, `contentMaxLines=120`, `skipGuard=false`
- Provider scope: configured live AI provider through local test-mode runtime

Source/runtime proof:

- Required AlembicAgent ancestor: `2be54a6`
- Runtime source: AlembicAgent `2be54a68...` or newer local state
- Runtime realpath: local AlembicAgent `dist`
- Alembic worktree: clean before/after test per AlembicTest report

Raw evidence:

- Raw dir: `../AlembicTest/tmp/pcvm-package-aa-alembic-project-space-cold-start-2026-06-01`
- Job/session: `bootstrap_mpu1u4fq_287d3c49` / `bs_1780248253809_xejzi8`
- API/Dashboard: `http://127.0.0.1:56164`
- Data root: `/Users/gaoxuefeng/.asd/workspaces/ecf32806`
- Artifacts: `/Users/gaoxuefeng/.asd/workspaces/ecf32806/.asd/job-artifacts/bootstrap_mpu1u4fq_287d3c49`
- Summary file: `package-aa-analysis-summary.json`
- Submit ledger: `package-aa-submit-ledger.json`
- Final events: `events-final.json`
- Report copy: `report-bs_1780248253809_xejzi8.json`

Runtime:

| Metric | Value |
| --- | ---: |
| completedAt | `2026-05-31T17:35:54.082Z` |
| duration | `704s` |
| artifact input/output files | `31 / 32` |
| API event count | `50` |

## Token Baseline

| Stage | Iterations | Tool calls | Input | Output | Reasoning | Cache hit | Total model |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| analyze | 20 | 69 | 264952 | 16112 | 5822 | 117504 | 286886 |
| produce | 11 | 10 | 86215 | 22099 | 11451 | 53376 | 119765 |
| route | 31 | 79 | 351167 | 38211 | 17273 | 170880 | 406651 |

Unit references:

| Unit | Value |
| --- | ---: |
| total model / Analyst structured target | 18484.1 |
| total model / Producer-visible target | 40665.1 |
| total model / accepted Recipe | 40665.1 |
| analyze total / Analyst structured target | 13040.3 |
| produce total / accepted Recipe | 11976.5 |

## Output/Coverage Baseline

| Metric | Value |
| --- | ---: |
| Analyst structured finding target | 22 |
| max tracker memory finding count | 22 |
| Producer-visible target | 10 |
| created candidates | 10 |
| accepted candidates | 10 |
| rejected candidates | 0 |
| Producer accepted coverage vs Analyst target | 45.45% |
| Producer accepted coverage vs Producer-visible target | 100% |
| final summary unsubmitted rows | 12 |

Candidate titles:

1. `ServiceContainer - core dependency injection container`
2. `EventBus - EventEmitter3 global event bus`
3. `Gateway - chain-of-responsibility and event-driven gateway`
4. `EnhancementPack - template method enhancement strategy base`
5. `ProjectDiscoverer - template method project discovery strategy base`
6. `SeatbeltProfileBuilder - builder-style chain builder`
7. `FileMonitorStatus - factory-created immutable status object`
8. `Logger - static getInstance singleton`
9. `HttpServer - Express middleware pipeline`
10. `CacheCoordinator - subscribe/unsubscribe observer variant`

## Structural Baseline

- Producer provider-visible tools: `knowledge`, `memory`, `meta`.
- Producer did not expose `code` schema.
- Producer did not call `knowledge.detail`, `knowledge.manage`, or `knowledge.search`.
- Producer did not call `meta.review`.
- Producer had no real missing-required-field reject.
- After `10/10` Producer-visible coverage, Producer emitted one final no-tool summary and stopped.

## Issue Placeholders For Next Analysis

These are not root-cause conclusions yet:

- Producer target mismatch: Analyst target was `22`, but Producer-visible target became `10`.
- Final Producer summary listed `12` unsubmitted structured findings, so full Analyst-target coverage did not pass.
- This Alembic project-space run uses `maxFiles=500`, `contentMaxLines=120`, `skipGuard=false`; it is a new project-space baseline, not directly comparable to BiliDili same-input packages.
- The next analysis must read raw LLM inputs/outputs and submit ledger before deciding whether the mismatch is caused by Analyst record shape, Producer artifact projection, tracker state, final summary interpretation, or another code path.
