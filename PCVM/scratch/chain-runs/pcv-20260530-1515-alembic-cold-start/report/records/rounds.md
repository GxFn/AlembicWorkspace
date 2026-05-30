# PCVM Rounds: Alembic Internal Cold-start

Run ID: `pcv-20260530-1515-alembic-cold-start`
Created at: `2026-05-30 17:10 CST`
Round model: `PCVM/docs/pcvm-round-model.md`

## Round Summary

| Round | Type | Scope | Status | Meaning |
| --- | --- | --- | --- | --- |
| `R1-engineering-discovery` | `R-discovery` | source + unit + fixture | complete | First pass mapped the chain, proved deterministic fixtures, and exposed engineering/test gaps. It did not prove live cold-start. |
| `R2-engineering-repair` | `R-engineering-repair` | source + unit + fixture + targeted integration | planned | Fix deterministic gaps and clean data/interface boundaries before live AI. |
| `R3-ai-local-analyze` | `R-live-ai-local` | live-ai, one dimension, no delivery | placeholder | Validate live analyze/quality/record-repair behavior after R2. |
| `R4-ai-local-producer` | `R-live-ai-local` | live-ai, one candidate-producing dimension, no delivery | placeholder | Validate live producer/sourceRef/rejected reason behavior after R3. |
| `R5-ai-expansion` | `R-live-ai-expansion` | live-ai, two/full dimensions, no delivery | placeholder | Expand live AI coverage after local AI stages pass. |
| `R6-dashboard-observability` | `R-dashboard-observability` | daemon + Dashboard + runtime reports | placeholder | Validate user-visible job/process/report surfaces. |
| `R7-delivery` | `R-delivery` | authorized delivery/write surfaces | placeholder | Validate delivery/wiki/project-skill export on a safe test project. |

## R1 Engineering Discovery

Purpose:

- Build the source-derived chain map.
- Verify deterministic boundaries with safe fixtures.
- Expose engineering gaps before live runtime.
- Establish metrics and data records for next rounds.

Evidence scope:

- source inspection
- focused unit/integration tests
- temporary fixtures
- deterministic projection probes
- no-live two/full dimension report fixtures

Allowed actions used:

- read source
- run focused tests
- run temporary no-live probes
- write PCVM records

Forbidden actions preserved:

- no broad cold-start
- no daemon/Dashboard
- no live AI provider
- no real delivery/wiki/skill export
- no real runtime DB mutation

R1 verdict:

```text
pass(scope=fixture)
```

Meaning:

R1 proves the chain can be decomposed, deterministic evidence surfaces can be projected, and full-dimension no-live report aggregation works. It does not prove real cold-start behavior.

## R2 Engineering Repair

Purpose:

- Fix deterministic engineering and test gaps found by R1.
- Make interfaces cleaner before invoking live AI.
- Reduce coupling in consumer/finalizer/report evidence paths.

Entry gate:

- R1 complete.
- Task packages in `task-packages.md` are reviewed and selected.
- No live AI or runtime mutation required.

Allowed actions:

- product source edits in the owning repos after a formal task package is accepted
- focused tests
- reusable fixture scripts
- before/after metric comparison

Expected outputs:

- code changes in owning product repos
- stable tests for repaired boundaries
- updated PCVM records with before/after metrics
- unchanged Test placeholders for AI-dependent behavior

R2 target metrics:

- unknown requested dimension ids surfaced
- presenter skeleton envelope verified
- degraded/error deterministic fixtures exist
- PCV evidence uses cleaner interface
- consumer/finalizer side effects become step-testable

## R3 AI Local Analyze

Purpose:

- Verify live Agent analyze, quality gate, and record repair on one dimension.

Entry gate:

- R2 deterministic repair complete.
- Test project and data root safety confirmed.
- `AlembicTest` task opened with clear evidence envelope.

Allowed actions:

- one selected dimension
- live AI
- no delivery
- no full dimensions

Primary metrics:

- grounding burn count
- invalid-no-evidence count
- evidence-produced count
- quality gate action
- record repair action/status
- missing artifact/node links

## R4 AI Local Producer

Purpose:

- Verify live producer behavior after live analyze quality is usable.

Entry gate:

- R3 passes or records a specific AI analyze blocker.

Allowed actions:

- one candidate-producing dimension
- live AI
- no delivery

Primary metrics:

- submitted/accepted/rejected count
- invalid sourceRef count and ratio
- rejected reason clarity
- terminal tool call count
- candidate usefulness sample

## R5 AI Expansion

Purpose:

- Expand live AI from local dimension to two dimensions, then full active dimensions.

Entry gate:

- R3 and R4 pass for local AI stages.

Primary metrics:

- failed/missing/skipped dimensions
- stage timeout count
- invalid sourceRef aggregate
- duplicate candidate ratio
- token/tool/cost summary
- report/history scorecard consistency

## R6 Dashboard Observability

Purpose:

- Validate daemon, Dashboard, process event, cancellation, and report surfaces.

Entry gate:

- runtime job path selected
- Test handoff opened if manual Dashboard observation is required

Primary metrics:

- job status correctness
- process event count and artifact refs
- report/latest/history alignment
- cancellation/timeout state clarity
- UI-visible status matches backend state

## R7 Delivery

Purpose:

- Validate final write surfaces only after analysis/producer/runtime evidence is trustworthy.

Entry gate:

- explicit authorization for delivery/wiki/project-skill export
- safe test project selected

Primary metrics:

- delivered skill/wiki count
- ProjectSkillDeliveryReceipt validity
- runtime export status
- write root safety
- rollback/cleanup path if needed

## Round Data Rules

- R1 data is retained as baseline and issue discovery.
- R2 data must use before/after comparison against R1 deterministic fixtures.
- R3-R5 data must be provided by real AI runs and should not inherit R1 pass verdicts.
- R6 data must include runtime job/session ids and report paths.
- R7 data must include delivery receipts and write-root proof.
