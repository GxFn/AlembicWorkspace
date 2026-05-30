# AI Local Chain PCVM Plan: Alembic Internal Cold-start

Run ID: `pcv-20260530-1515-alembic-cold-start`
Created at: `2026-05-30 17:15 CST`
Parent round plan: `records/rounds.md`
Status: placeholder until `R2-engineering-repair` completes.

## Boundary

This file defines the live AI local chain stages. It does not authorize a live AI run.

Live AI stages must be executed by or with evidence from `AlembicTest` when they require a real project, Dashboard observation, runtime monitoring, or model/provider evidence.

## AI Local Chain Overview

| Stage | Segment | Owner | Evidence Scope | Current Status |
| --- | --- | --- | --- | --- |
| `AI0-readiness` | provider/runtime readiness | Alembic/AlembicTest | runtime | placeholder |
| `AI1-input-assembly` | Agent input and stage policy | Alembic/AlembicAgent | fixture then live-ai | placeholder |
| `AI2-analyze-grounding` | analyze stage tool/evidence behavior | AlembicAgent/AlembicTest | live-ai | placeholder |
| `AI3-quality-gate` | quality gate pass/reject behavior | AlembicAgent/AlembicTest | live-ai | placeholder |
| `AI4-record-repair` | repair after poor/partial analyze output | AlembicAgent/AlembicTest | live-ai | placeholder |
| `AI5-producer` | candidate production | AlembicAgent/AlembicTest | live-ai | placeholder |
| `AI6-source-ref-validation` | sourceRef validity and usefulness | Alembic/AlembicTest | live-ai + runtime | placeholder |
| `AI7-consumer-persistence` | live projection consumed into persistence | Alembic/AlembicTest | runtime | placeholder |
| `AI8-report-observability` | scorecard/process/report surfaces | Alembic/AlembicTest | runtime/dashboard | placeholder |

## Stage Details

### AI0 Readiness

Question:

Can the selected safe project/data root invoke the internal Agent runtime without crossing write boundaries?

Entry gate:

- R2 deterministic boundary repair complete.
- ProjectScope-aware entrypoint confirmed.
- AI credentials/provider readiness confirmed without printing secrets.

Metrics:

- provider ready status
- selected project/data root
- no source repo writes
- no delivery writes
- session/job id generated if runtime starts

Test placeholder:

- `TEST-AI-0`: AlembicTest verifies safe provider/runtime readiness with no dimension execution if supported.

### AI1 Input Assembly

Question:

Does the real selected dimension receive the expected prompt context, stage map, terminal policy, and source file map?

Entry gate:

- AI0 ready.
- selected one dimension.
- no delivery.

Metrics:

- stage order
- PCV stage node map present
- source file map count
- producer terminal tool count
- token/input size

Test placeholder:

- `TEST-AI-1A`: capture or report redacted Agent input metadata for one dimension.

### AI2 Analyze Grounding

Question:

Does live analyze produce source-grounded findings rather than planning-only or fallback-only text?

Entry gate:

- AI1 pass.

Metrics:

- grounding burn count
- evidence-produced count
- deterministic-evidence-consumed count
- invalid-no-evidence count
- referenced files count
- fallback/degraded indicators

Pass meaning:

`pass(scope=live-ai)` only if findings have source-backed evidence or quality gate rejects with actionable reason.

Test placeholder:

- `TEST-AI-1B`: one selected dimension, live analyze only if pipeline can cut before producer; otherwise collect stage evidence from one no-delivery run.

### AI3 Quality Gate

Question:

Does quality gate correctly pass useful analysis and reject weak analysis?

Entry gate:

- AI2 evidence collected.

Metrics:

- quality gate action
- pass boolean
- suggestions/reasons
- timedOut flag
- missingLinkReasons

Pass meaning:

Quality gate must be observable. A rejection can pass this stage if the reason is specific and downstream producer is not allowed to create weak candidates.

Test placeholder:

- `TEST-AI-1C`: collect quality gate phase evidence and report-facing N9 projection.

### AI4 Record Repair

Question:

When quality gate needs repair, does record repair produce enough structured evidence or clearly stop?

Entry gate:

- AI3 identifies repair-required or stage-map-not-applicable case.

Metrics:

- repair phase present
- repair action
- added findings count
- remaining invalid-no-evidence count
- final status

Pass meaning:

If quality already passes, `record_repair` may be `not-applicable` with canonical identity. If repair is needed, it must either repair the record or return a clear failure status.

Test placeholder:

- `TEST-AI-1D`: force or capture one repair-required case if possible; otherwise mark not-applicable with evidence.

### AI5 Producer

Question:

Does live producer create useful candidates from the accepted analysis without using forbidden terminal tools?

Entry gate:

- AI2-AI4 pass for one candidate-producing dimension.

Metrics:

- submitted count
- accepted count
- rejected count
- rejected reason clarity
- terminal tool call count
- candidate title/trigger uniqueness

Pass meaning:

At least one accepted candidate or a clear no-candidate reason. Rejections must be actionable.

Test placeholder:

- `TEST-AI-2A`: one candidate-producing dimension live producer, no delivery.

### AI6 SourceRef Validation

Question:

Are live producer sourceRefs valid and useful against the actual project file set?

Entry gate:

- AI5 has submitted or attempted candidates.

Metrics:

- total sourceRefs
- valid sourceRefs
- invalid sourceRefs
- invalid ratio
- outside-project-root count
- sourceRef usefulness sample

Pass meaning:

Invalid sourceRef ratio must meet the threshold selected for the round. The earlier observed 7/44 invalid sourceRef risk must be explicitly retested.

Test placeholder:

- `TEST-AI-2B`: return sourceRef validity summary and sample invalid refs.

### AI7 Consumer Persistence

Question:

Are live accepted candidates and live failure reasons findable after consumption?

Entry gate:

- AI5/AI6 complete.

Metrics:

- accepted titles
- findable titles
- missing accepted titles
- persisted failure reason
- checkpoint written/skipped reason
- candidate relation result

Pass meaning:

Accepted candidates must be findable or failures must be persisted with non-empty reasons.

Test placeholder:

- `TEST-AI-2C`: collect SessionStore/checkpoint/candidate relation evidence for the same run.

### AI8 Report Observability

Question:

Do report/history/job surfaces preserve the AI stage evidence?

Entry gate:

- AI7 complete.

Metrics:

- pcvScorecard dimension count
- linked/blocked node count
- process event artifacts
- job/session id
- report/history path
- missing report surface count

Pass meaning:

Report, history, process events, and job surfaces must agree on node ids and session/dimension identity.

Test placeholder:

- `TEST-AI-3`: full no-delivery live run after local AI stages pass.
- `TEST-AI-4`: daemon/Dashboard observation after report surfaces pass in runtime.

## Expansion Rules

1. Start with one candidate-producing dimension.
2. Add one skill-only dimension only after candidate path is stable.
3. Expand to two dimensions.
4. Expand to full TypeScript active dimension set.
5. Only then consider delivery/export.

## Required AlembicTest Result Envelope

Each live AI Test result must include:

- `roundId`
- `stageIds`
- `projectCategory`
- `commandOrUiRoute`
- `jobId`
- `sessionId`
- `dimensionIds`
- `reportPath`
- `historyPath`
- `pcvScorecardSummary`
- `sourceRefValidity`
- `failedDimensions`
- `missingDimensions`
- `skippedDimensions`
- `deliveryStatus`
- `screenshots` only for Dashboard/manual UI evidence

## Stop Conditions

Stop the live AI round if:

- ProjectScope write boundary is unclear.
- Source repo writes appear.
- Provider/runtime readiness is unclear.
- Report surfaces cannot identify the selected session/dimension.
- Invalid sourceRefs exceed the selected threshold.
- Quality gate output is missing or unobservable.
- A Dashboard/manual observation task is required but no Test task has been opened.
