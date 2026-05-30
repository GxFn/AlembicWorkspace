---
name: pcvm-flow-controller
description: Use when AlembicWorkspace is using PCVM to generate or update source-derived chain plans, run scoped PCVM rounds, control round transitions, package engineering repairs, or prepare live AI/Test phases for Alembic cold-start or rescan optimization.
---

# PCVM Flow Controller

This skill fixes how PCVM is used. PCVM is a plan, metrics, and evidence-control surface. It is not a product implementation window and not a substitute for AlembicWorkspace judgment.

## Required Inputs

Before changing any PCVM artifact, read:

1. `../AGENTS.md`
2. `PCVM/AGENTS.md`
3. `PCVM/config/pcvm-flow-control.json`
4. `PCVM/index.md`
5. The active run `report/plan.md`
6. The active run `report/records/rounds.md`, `issues.md`, `data.md`, `progress.md`, and `task-packages.md` as needed

Load canonical PCV source only when method details or plan generation are needed:

```text
../progressive-chain-validation/progressive-chain-validation/SKILL.md
```

## Authority Boundaries

- PCVM owns plan artifacts, metrics, round records, issue records, and task-package design candidates.
- AlembicWorkspace owns final judgment, product task dispatch, Test handoff, acceptance, and TODO closure.
- Product source changes happen only in the owning product repository after a PCVM task package is accepted by AlembicWorkspace.
- `AlembicTest` is used only for live AI, real project, Dashboard/manual observation, runtime monitoring, or cross-repository integration evidence.
- Do not update `.workspace-active/workspace/current/` merely because a PCVM record changed.

## Request Routing

Classify the user request before editing:

| Request | Route |
| --- | --- |
| "fix PCVM flow", "write skill/config", "固化流程" | Update this skill and `config/pcvm-flow-control.json`; no product source edits. |
| "generate PCVM plan" | Create or update `report/plan.md` from source-derived chain map and PCV references. |
| "continue PCVM round" | Read current round and node cursor; advance only the authorized round/node. |
| "summarize first round issues" | Update records, task packages, and next-round gates; do not mark product acceptance. |
| "start engineering repair" | Prepare task package(s) and ownership; do not run live AI. |
| "start live AI round" | Verify R2 gates, create Test placeholder/result contract, then hand to AlembicTest if needed. |
| "accept/close PCVM" | Check scoped verdicts, unresolved issues, required round coverage, and evidence paths before recommending closure. |

## Fixed Flow Line

Follow this route unless the user explicitly changes PCVM scope:

1. `S0-intake`: state user goal, evidence scope, minimum closure, and first blocker.
2. `S1-source-chain-map`: derive chain boundaries from real source before applying overlays.
3. `S2-plan-artifact`: create/update `report/plan.md`; it is the plan state machine.
4. `S3-round-registry`: define round scope and verdict meaning in `records/rounds.md`.
5. `S4-node-or-round-execution`: execute only the current authorized node/round.
6. `S5-record-classification`: record data, issues, progress, and review in separate record files.
7. `S6-engineering-repair-packaging`: group deterministic issues into product-repo task packages.
8. `S7-live-ai-local-chain`: split AI-dependent behavior into local Test-ready stages.
9. `S8-verdict-and-next-round`: issue scoped verdict and name the next safe round or stop condition.

Never skip directly from discovery to live AI or delivery.

## Round Route

Use this default round order:

1. `R1-engineering-discovery`: source/unit/fixture discovery. Verdict scope: `fixture`.
2. `R2-engineering-repair`: deterministic repairs and before/after comparison. Verdict scope: `unit` or `targeted-integration`.
3. `R3-ai-local-analyze`: one live AI analyze/quality/record-repair segment. Verdict scope: `live-ai-local`.
4. `R4-ai-local-producer`: one live AI producer/sourceRef segment. Verdict scope: `live-ai-local`.
5. `R5-ai-expansion`: two/full live AI dimensions without delivery. Verdict scope: `live-ai-expansion`.
6. `R6-dashboard-observability`: daemon/Dashboard/manual observability. Verdict scope: `runtime-dashboard`.
7. `R7-delivery`: authorized delivery/write surfaces. Verdict scope: `delivery`.

Every round must declare entry gate, allowed actions, forbidden actions, metrics, artifacts, and exact verdict meaning.

## Artifact Rules

- `report/plan.md`: chain plan, current cursor, node status, scorecard summary, links to records.
- `records/data.md`: command evidence, source facts, measurement tables, report paths.
- `records/issues.md`: problems, risk classes, blockers, residual risk, open decisions.
- `records/progress.md`: chronological actions and user confirmations.
- `records/review.md`: round review and next-round reasoning.
- `records/rounds.md`: round contract, scope, gates, verdict semantics.
- `records/task-packages.md`: engineering repair package candidates.
- `records/ai-local-chain.md`: AI local stage split and Test result placeholders.

Do not put process notes, raw logs, or broad issue dumps into `plan.md`.

## Verdict Rules

- Plain `pass` is invalid. Use scoped verdicts such as `pass(scope=fixture)` or `blocked(scope=live-ai-local)`.
- A full run cannot auto-pass its internal nodes.
- A fixture verdict cannot prove runtime, AI, Dashboard, or delivery behavior.
- A round can complete while later rounds remain unopened.
- Improvement requires the same baseline/candidate metric and a passed quality gate.
- If evidence is missing, classify the gap as `product-risk`, `test-gap`, `probe-error`, `expected-boundary`, or `runtime-placeholder`.

## Engineering Repair Rules

For deterministic issues discovered in R1:

1. Classify the issue and owner repository.
2. Group related problems into a task package.
3. Define input/output contract cleanup, coupling reduction, tests, and before/after metrics.
4. Keep AI-dependent checks as placeholders unless the round is explicitly live AI.
5. Do not dispatch Test for problems that can be reproduced with source, unit, fixture, or targeted integration evidence.

## Live AI/Test Rules

Open a live AI round only after the engineering gate in `records/rounds.md` says R2 is complete or explicitly blocked with a Test-relevant reason.

The Test handoff must include:

- `roundId`
- AI stage ids
- project category
- command or UI route
- job/session/report paths expected
- dimension ids
- sourceRef validity metrics
- failed/missing/skipped dimensions
- delivery status
- what success proves
- what failure proves
- what the test cannot prove

No live AI round may authorize delivery unless the current round is `R7-delivery`.

## Final Response Checklist

When reporting PCVM work, say:

- which PCVM artifacts changed
- which round/stage is current
- what evidence scope the verdict covers
- what remains blocked or deliberately unopened
- whether any product source or live AI action was performed
