# PCVM Round Model

PCVM uses rounds because one pass over a long chain cannot honestly prove every layer. A round has a narrow evidence scope, a clear entry condition, and a bounded verdict. Later rounds add stronger evidence without rewriting the meaning of earlier rounds.

## 1. Round Purpose

A PCVM round answers one question:

```text
Under this exact evidence scope, did the selected chain segment improve, regress, pass, or remain blocked?
```

The first round is allowed to be limited. Its value is to reveal chain shape, data boundaries, basic engineering gaps, and metric baselines. It should not pretend to be a real runtime or AI acceptance round.

## 2. Round Types

| Round Type | Evidence Scope | Purpose | May Prove | Cannot Prove |
| --- | --- | --- | --- | --- |
| `R-discovery` | source + unit + fixture | map chain, find obvious engineering gaps, define metrics | chain shape, deterministic contracts, fixture behavior | live runtime, AI quality, delivery safety |
| `R-engineering-repair` | source + unit + fixture + targeted integration | fix deterministic gaps and rerun same metrics | before/after improvement under stable fixtures | model quality, real project behavior |
| `R-runtime-smoke` | runtime, no live delivery | run safe local runtime boundaries | write roots, daemon/session/report wiring | AI output quality unless live AI enabled |
| `R-live-ai-local` | live AI, local chain segment | validate AI subchain one stage at a time | analyze/quality/producer behavior for scoped project/dimensions | full product acceptance |
| `R-live-ai-expansion` | live AI, broader dimensions | expand from one dimension to two/full dimensions | missing/failed dimensions, sourceRef validity, timeouts | delivery/export safety |
| `R-dashboard-observability` | daemon + Dashboard/manual observation | verify user-visible job/process/report surfaces | UI/job observability and cancellation behavior | AI content quality unless paired with live round |
| `R-delivery` | authorized delivery/wiki/skill export | verify final write surfaces | delivery safety and exported artifacts | earlier AI quality if not already proven |

## 3. Required Round Fields

Every round record should include:

| Field | Meaning |
| --- | --- |
| `roundId` | Stable id, for example `R1-engineering-discovery`. |
| `roundType` | One of the round types above. |
| `chainSegment` | Whole chain or local segment under review. |
| `evidenceScope` | `source`, `unit`, `fixture`, `runtime`, `live-ai`, `dashboard`, `delivery`. |
| `entryGate` | What must already be true before the round starts. |
| `allowedActions` | What commands/actions may run. |
| `forbiddenActions` | What remains out of scope. |
| `metrics` | The metric set used by this round. |
| `expectedArtifacts` | Plan, data, issues, progress, attachments, reports. |
| `verdictMeaning` | Exact meaning of `pass` or `blocked` for this round. |
| `nextRoundCandidates` | Safe next rounds if this one passes. |

## 4. Round Data Semantics

Data is evidence scoped to its round.

- `R-discovery` data is good for design, task packaging, and deterministic bug fixes.
- `R-engineering-repair` data is good for before/after engineering comparison.
- `R-live-ai-local` data is good for model-dependent chain metrics.
- `R-dashboard-observability` data is good for user-visible job/status/report behavior.
- `R-delivery` data is good for final write surfaces.

Do not combine data from different rounds into one verdict unless the comparison explicitly says how scopes differ.

## 5. Verdict Scope

Every node verdict must carry a scope:

```text
pass(scope=fixture)
pass(scope=runtime)
pass(scope=live-ai)
blocked(scope=dashboard)
```

Plain `pass` is not enough for PCVM.

## 6. Round Completion

A round is complete when:

- the current node set has verdicts within the declared scope
- data and issue records are updated
- unresolved risks are typed as product risk, test gap, probe error, expected boundary, or runtime placeholder
- the next round is either named or explicitly left unopened

Completion does not imply final product acceptance unless the round type and evidence scope say so.
