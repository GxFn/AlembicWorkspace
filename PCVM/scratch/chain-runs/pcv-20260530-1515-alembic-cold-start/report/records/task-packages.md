# PCVM Task Packages: Alembic Internal Cold-start

Run ID: `pcv-20260530-1515-alembic-cold-start`
Created at: `2026-05-30 17:12 CST`
Round owner: `R2-engineering-repair`

These packages began as design candidates for the engineering repair round. Execution status is tracked here, while command output and measured facts remain in `data.md`.

## Execution Status

| Package | Status | Evidence |
| --- | --- | --- |
| P0 | `completed(scope=source+validator)` | PCVM validator passes; scoped verdicts and issue classes are present. |
| P1 | `completed(scope=unit+typecheck)` | Selection diagnostics and skeleton response tests pass in AlembicCore; internal workflow passes the summary through Alembic. |
| P2 | `partial(scope=unit+typecheck)` | N3 deterministic warning fixture passes; N4 analyzer degradation and Core receipt-contract hang remain follow-up. |
| P3 | `completed(scope=unit+typecheck)` | `PcvNodeEvidenceEnvelope` is produced by consumers and consumed by report augmentation with legacy compatibility. |
| P4 | `open` | Not started. |
| P5 | `open` | Not started. |
| P6 | `open` | Not started; no live AI/Test round started. |

## Package P0: PCVM Round Contract And Evidence Hygiene

Owner repo: `PCVM` first; product repos only if validators are integrated later.

Goal:

Make PCVM round/verdict/data semantics explicit enough that fixture evidence cannot be mistaken for runtime or live AI evidence.

Inputs:

- `docs/pcvm-round-model.md`
- `docs/pcvm-local-chain-optimization.md`
- current `plan.md`
- `records/issues.md`
- `records/review.md`

Tasks:

- Add `verdictScope` to node scorecards.
- Add issue classes: `product-risk`, `test-gap`, `probe-error`, `expected-boundary`, `runtime-placeholder`.
- Add round id and evidence scope to records.
- Move machine-shaped probe summaries into future `report/artifacts/`.
- Add a lightweight PCVM artifact validator for required fields.

Metrics:

- every node verdict has scope
- every issue has class
- every future pass has data link and residual risk
- no `pass` without a scope string

Dependencies:

- none

## Package P1: Cold-start Interface Contract Cleanup

Owner repo: `AlembicCore` and `Alembic`.

Goal:

Clarify deterministic data transfer from args to intent, plan, snapshot, dimensions, session, and report.

Problems from R1:

- unknown requested dimension ids are silently dropped
- duplicate ids are handled downstream but not reported
- presenter skeleton response was not verified
- plan/report/status vocabulary can imply more completion than actually happened

Tasks:

- Surface unknown requested dimensions in cold-start diagnostics/report.
- Preserve duplicate collapse as an explicit selection fact.
- Add presenter-level skeleton response test for `presentInternalColdStartResponse`.
- Add a typed `ColdStartSelectionSummary` or equivalent report-facing structure.

Metrics:

- unknown requested id count is visible
- selected/skipped/unknown/duplicate-collapsed counts are visible
- skeleton response includes session id, task count, selected dimensions, pending async fill status
- no product runtime writes needed for tests

Dependencies:

- P0 recommended but not required.

## Package P2: Deterministic Error And Degraded Fixtures

Owner repo: `AlembicCore` and `Alembic`.

Goal:

Make deterministic non-AI failure/degradation paths testable before live AI.

Problems from R1:

- N3 unreadable-file / target-error branches were not forced.
- N4 degraded analyzer warning path was not forced.
- N7 missing presenter skeleton envelope was not covered.
- AlembicCore `ProjectSkillDeliveryContracts` test hang is unresolved.

Tasks:

- Add N3 fixture for unreadable files and target errors.
- Add N4 fixture for analyzer degradation with explicit warning/reason.
- Add N7 presenter skeleton test if not covered in P1.
- Investigate or quarantine the Core receipt contract hang with a reproducible reason.

Metrics:

- deterministic warning paths produce explicit reasons
- target/file errors do not pass silently
- Core receipt contract test either passes or has a documented isolated failure

Dependencies:

- P1 for skeleton vocabulary if shared.

## Package P3: PCV Evidence Envelope Refactor

Owner repo: `Alembic`.

Goal:

Move PCV evidence from generic `dimensionStats.pcvNodeEvidence` into a cleaner first-class evidence envelope while preserving report compatibility.

Problems from R1:

- PCV evidence is technically available but travels as an optional generic field.
- report scorecard, comparison hints, and process events are assembled across multiple layers.
- skill-only N11 branch must remain explicit as `not-applicable`.

Tasks:

- Introduce a typed `PcvNodeEvidenceEnvelope` or similarly named structure.
- Build per-dimension evidence as a step output before report augmentation.
- Keep N8/N9/N11/N12 identity in one source of truth.
- Add reusable two/full dimension fixtures as product tests.

Metrics:

- report `pcvScorecard`, totals, comparison hints, history artifacts, and job metadata derive from the same envelope
- N11 sourceRef validity is visible per dimension and aggregate
- skill-only dimensions show N11 `not-applicable`, not missing evidence

Dependencies:

- P0 for verdict/evidence naming.
- P1 for cleaner dimension selection metadata.

## Package P4: Consumer Responsibility Split

Owner repo: `Alembic`.

Goal:

Split `consumeBootstrapDimensionResult` into testable steps with clear side effects.

Current coupling:

- projection consumption
- candidate accounting
- SessionStore report/digest/candidate updates
- token/efficiency logging
- checkpoint save
- event emission
- PCV evidence construction

Tasks:

- Extract projection validation and run-issue normalization.
- Extract SessionStore update step.
- Extract candidate accounting step.
- Extract checkpoint persistence step.
- Extract PCV evidence construction step.
- Extract event emission step.
- Add step-local tests using frozen projection input.

Metrics:

- each step has a typed input/output
- optional logging failure cannot affect dimension result
- checkpoint skip reason is visible
- PCVM can score consumer-persistence separately from projection quality

Dependencies:

- P3 recommended for evidence step.

## Package P5: Finalizer Responsibility Split

Owner repo: `Alembic`.

Goal:

Split finalizer side effects so delivery/wiki/semantic memory/report augmentation are independently measurable.

Current coupling:

- skill generation
- candidate relation graph population
- delivery/wiki/semantic memory
- workflow persistence
- efficiency/skill/PCV report augmentation
- file cache cleanup

Tasks:

- Extract skill generation finalizer step.
- Extract candidate relation finalizer step.
- Extract delivery/wiki/semantic finalizer step.
- Extract report persistence/augmentation step.
- Add no-delivery and rescan isolation tests for each step.

Metrics:

- delivery skipped/completed status is explicit
- semantic memory failure does not obscure report persistence
- report augmentation failure is warning-only with path/reason
- receipts and PCV scorecard remain present when expected

Dependencies:

- P3 for PCV report augmentation.

## Package P6: AI Round Preparation Without Running AI

Owner repo: `Alembic`, `AlembicAgent`, `AlembicTest` placeholder.

Goal:

Prepare live AI rounds without executing them prematurely.

Tasks:

- Define AI local chain inputs/outputs and metrics in `ai-local-chain.md`.
- Ensure one-dimension no-delivery run can be invoked through a safe ProjectScope-aware entrypoint.
- Define Test result envelope fields for live AI evidence.
- Keep Test placeholders open until R2 deterministic repair is complete.

Metrics:

- Test handoff can name dimension, command/UI route, job/session id, report path, sourceRef summary, failed/missing dimensions
- no live AI run starts in this package

Dependencies:

- P1-P5 should be at least designed; P2/P3 are recommended before actual AI run.

## Recommended Execution Order

1. P0: PCVM round/evidence hygiene.
2. P1 + P2: deterministic boundary gaps.
3. P3: evidence envelope.
4. P4 + P5: consumer/finalizer responsibility split.
5. P6: AI round preparation and Test handoff packets.

Do not open R3 live AI until P1/P2 are closed and P3 has at least a stable evidence envelope design.
