# PCVM Local Chain Optimization

PCVM can optimize a local chain segment without pretending to validate the whole workflow. A local chain segment is a bounded producer/consumer slice with explicit input, output, side effects, and metrics.

## 1. Local Segment Definition

Each segment must define:

| Field | Meaning |
| --- | --- |
| `segmentId` | Stable id such as `ai-analyze-quality` or `consumer-persistence`. |
| `ownerLayer` | Product layer that owns the code: Core, Alembic, Agent, Dashboard, Test. |
| `inputContract` | The data shape entering the segment. |
| `outputContract` | The useful unit leaving the segment. |
| `sideEffects` | Writes/events/report updates caused by this segment. |
| `upstreamFreeze` | Fixture or runtime artifact used as stable input. |
| `downstreamCut` | Where execution stops. |
| `metrics` | Stage loss and quality gate for the segment. |

## 2. Optimization Loop

Use the same loop for every local segment:

1. Select one segment.
2. Freeze upstream data.
3. Cut downstream effects.
4. Measure baseline.
5. Fix one class of problem.
6. Rerun the same measurement.
7. Record comparison and residual risk.
8. Only then expand to the next segment.

## 3. Metric Classes

| Metric Class | Examples |
| --- | --- |
| data contract | missing field, ambiguous status, duplicate ids, unknown skip reason |
| evidence linkage | missing node id, missing chain id, unlinked artifact, missing report surface |
| source grounding | invalid sourceRefs, no referenced files, fallback-only findings |
| side effect safety | unsafe write root, unapproved delivery, DB mutation outside round |
| runtime health | timeout, missing dimension result, cancellation leak, stale session |
| quality | rejected reason vague, quality gate incomplete, record repair incomplete |
| coupling | one function updates too many surfaces, optional step failure obscures core result |

## 4. Local Segment Verdicts

Local verdicts should be scoped:

```text
improved(scope=unit)
pass(scope=fixture)
blocked(scope=live-ai)
regression(scope=runtime)
```

The local verdict only applies to that segment. It does not close the whole PCVM run.

## 5. Alembic Cold-start Segment Map

| Segment | Owner Layer | Input | Output | First Metrics |
| --- | --- | --- | --- | --- |
| root-data-boundary | Alembic/Core | container/project root | safe runtime resolver facts | unsafe write risk, naked resolver fallback |
| intent-plan | Core | raw args | intent + plan | arg loss, ignored incremental reporting, dimension id handling |
| cleanup-discovery | Core/Alembic | plan cleanup + project root | cleaned data root + file set | unsafe deletion, generated-file exclusion, unreadable/target errors |
| materialization | Core | file set | project snapshot/report/target map | degraded warning quality, missing graph/report fields |
| dimension-plan | Core | snapshot + requested dimensions | selected dimensions + skipped reasons | unknown id visibility, duplicate collapse, test filter clarity |
| session-task | Alembic | selected dimensions | bootstrap session + task defs | skeleton response, cancellation, late transition |
| runtime-stage-policy | Alembic/Agent | dimension plan/runtime context | Agent run input + stage policy | terminal tool leakage, PCV map visibility |
| ai-analyze-quality | Agent/Alembic | Agent input | analysis + quality/repair evidence | grounding burns, invalid no-evidence, quality gate result |
| ai-producer | Agent/Alembic | analysis artifact | candidate submit/reject digest | invalid sourceRefs, rejected reason, terminal use |
| consumer-persistence | Alembic/Core | projection + tool calls | SessionStore/checkpoint/candidate relations | accepted not findable, missing failure reason |
| finalizer | Alembic/Core | session result | skills/delivery/memory summary | unapproved write, missing receipt, skipped reason |
| report-history | Core/Alembic | finalizer result + evidence | report/history/job evidence | missing node id, report mismatch, artifact link |

## 6. Engineering Before Live AI

Before opening live AI rounds, deterministic segments should have:

- stable input/output contracts
- explicit skipped/failed/not-applicable semantics
- reusable fixtures
- report evidence derived from one evidence envelope
- no hidden broad runtime writes

Live AI should then measure model behavior, not discover basic engineering ambiguity.
