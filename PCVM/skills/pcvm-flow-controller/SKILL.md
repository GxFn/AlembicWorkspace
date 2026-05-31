---
name: pcvm-flow-controller
description: Use when PCVM is generating or updating source-derived chain plans, running scoped PCVM rounds, dispatching product-window tasks, doing PCV-scoped code repair, calling AlembicTest, comparing metrics, or deciding the next PCV optimization round.
---

# PCVM Flow Controller

PCVM is the Progressive Chain Validation domain controller. Within a user-confirmed PCV scope it can plan, dispatch, self-repair, call AlembicTest, review evidence, and iterate without asking AlembicWorkspace for every step.

AlembicWorkspace is only the escalation surface for global workspace goals, non-PCV scope expansion, cross-mainline conflicts, final archive, global TODO closure, or user-visible scope changes.

## Required Inputs

Before changing a PCVM artifact or dispatching work, read:

1. `../AGENTS.md`
2. `PCVM/AGENTS.md`
3. `PCVM/config/pcvm-flow-control.json`
4. `PCVM/index.md`
5. The active run `report/plan.md`
6. The active run records needed for the task

Load these only when needed:

- PCV method details: `../progressive-chain-validation/progressive-chain-validation/SKILL.md`
- round semantics: `PCVM/docs/pcvm-round-model.md`
- local segment design: `PCVM/docs/pcvm-local-chain-optimization.md`
- artifact usage: `PCVM/docs/pcvm-usage.md`

## Controller Loop

1. State the user goal, current evidence, minimum closure, current round/node/segment, and first blocker.
2. Classify the request using `requestRoutes` in `config/pcvm-flow-control.json`.
3. Choose the smallest real action that removes the blocker:
   - update PCVM plan/records
   - self-repair a PCV-scoped code issue in the owning repository
   - dispatch a product-window task package
   - call AlembicTest for real AI/runtime/project evidence
   - review returned raw evidence and decide the next iteration
4. Record facts in the right artifact. Do not use document edits as proof of progress.
5. Issue only a scoped PCVM verdict, then continue, stop, or escalate.

## Authority Rules

- PCVM owns PCV plan artifacts, round records, metric contracts, task packages, PCV-scoped product dispatch, scoped self-repair, AlembicTest handoff, evidence review, and next-round decisions.
- Product source edits are allowed only when the code belongs to the current PCV objective. Read the target repo `AGENTS.md`, state the PCVM role, keep changes narrow, run verification, and record diff/evidence paths.
- Product-window dispatch prompts must require the target window to read workspace `AGENTS.md`, `PCVM/AGENTS.md`, the active PCVM plan, and the target repo `AGENTS.md`.
- AlembicTest is for live AI, real project, Dashboard/manual observation, runtime monitoring, regression, or cross-repository integration evidence. It is not for deterministic issues PCVM or the product repo can answer with source/unit/fixture/probe evidence.
- PCVM does not close global TODOs, declare final product acceptance, or archive the workspace.

## Fixed Flow

Use `flowStates` from config as the machine-readable route:

1. `S0-intake`
2. `S1-source-chain-map`
3. `S2-plan-artifact`
4. `S3-round-registry`
5. `S4-node-or-round-execution`
6. `S5-record-classification`
7. `S6-engineering-repair-packaging`
8. `S8-verdict-and-next-round`

Never skip directly from discovery to live AI, Dashboard, delivery, full cold-start, or self-hosting.

## Round Route

Use `roundRoute` from config as the default sequence:

1. `R1-engineering-discovery`
2. `R2-engineering-repair`
3. `R3-ai-local-analyze`
4. `R4-ai-local-producer`
5. `R5-ai-expansion`
6. `R6-dashboard-observability`
7. `R7-delivery`

Every round must declare entry gate, evidence scope, allowed actions, forbidden actions, metrics, expected artifacts, verdict meaning, and next-round candidates.

## Records

- `report/plan.md`: state machine, current cursor, node/round status, scoped verdict summary, links to records.
- `records/data.md`: source facts, command evidence, measurements, report paths, job/session ids.
- `records/issues.md`: blockers, risks, regressions, residual risks, open decisions.
- `records/progress.md`: chronological actions and user confirmations.

Do not put raw logs, long issue dumps, or process notes into `plan.md`.

## Metrics And Verdicts

- Plain `pass` is invalid. Use scoped verdicts such as `pass(scope=fixture)` or `blocked(scope=live-ai-local)`.
- Improvement requires a passed quality gate and same-scope baseline/candidate comparison.
- Loss reduction does not count if the useful unit gets weaker.
- Different rounds cannot be merged into one verdict unless the comparison names the scope difference.
- AI intervals always record stage token usage and whole-route cold-start token usage.
- Any primary metric regression pauses dispatch, Test, record rolling, and closure until root cause is analyzed.

## AI Guardrails

- Keep AI metrics to `primary`, `support`, and `diagnostic`; default to one primary gate.
- Do not add taxonomy, fields, reason splits, or explanation layers unless they directly answer a user goal, gate, repair action, or Test verdict.
- For LLM refs, keep only: stage, LLM output refs, final artifact refs, whether refs entered the final candidate, and evidence path.
- Do not treat temporary reasoning, debug notes, fallback text, or per-stage scratch refs as final candidate metrics.

## Product Task Packages

Each package must include:

- package id, owner repository, stage/round
- user-goal linkage and problem statement
- input contract, output contract, state changes, call chain
- coupling/boundary issue and proposed repair
- before/after metrics and verification commands
- forbidden actions
- expected return evidence
- whether AlembicTest is required, with reason

## AlembicTest Contract

Use AlembicTest only when the evidence requires a real project, live AI, runtime, Dashboard, delivery surface, regression, or cross-repo integration.

The Test task must include:

- round id and AI stage ids
- target project/category
- command or UI route
- expected job/session/report paths
- dimension ids
- primary/support/diagnostic metrics
- stage token usage and whole-route token usage
- failed/missing/skipped dimension semantics
- delivery status and no-delivery boundary
- what success proves
- what failure proves
- what the test cannot prove
- stop condition

After Test returns, PCVM reads raw evidence before writing any verdict.

## Escalate Only When

- scope, repo coverage, route, budget, or user-visible behavior changes
- a primary metric regresses
- required evidence is unavailable and cannot be self-produced
- final product acceptance, global TODO closure, or archive is being considered
- user confirmation is explicitly required

## Final Response Checklist

Report: changed artifacts, current round/stage, evidence scope, product-source/Test involvement, scoped verdict, first blocker, and whether PCVM will continue autonomously or needs escalation.
