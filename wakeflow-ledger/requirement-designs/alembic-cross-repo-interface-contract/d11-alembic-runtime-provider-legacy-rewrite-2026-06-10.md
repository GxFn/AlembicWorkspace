# Alembic Runtime And Provider Legacy Rewrite Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d11-alembic-runtime-provider-legacy-rewrite-2026-06-10`
Sequence Order: 12
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Rewrite remaining Alembic CLI, daemon, HTTP, runtime-control, job, event, and
Agent-consumer legacy interface logic onto the accepted provider contract model.

## Completion Definition

- CLI/daemon/API runtime-control paths use explicit command semantics and do
  not mutate runtime state from diagnostics-read paths.
- REST query, REST command, event stream, job artifact, diagnostic, and Agent
  consumer paths use checked provider schemas and problem responses.
- D7 multi-project runtime smoke blockers, if still open, are fixed or returned
  with raw daemon logs and a precise blocker classification.
- Plugin and Dashboard provider fixtures remain valid after rewrite.
- Agent result-envelope consumer handling covers all public Agent branches,
  including `partial`, without generic fallthrough status errors.
- Existing Alembic CLI/API/daemon/event behavior remains available; old
  normalizers, implicit starts, fallback successes, and untyped payloads are
  removed only after replacement evidence.

## Stage Plan

1. Read D1, D3, D7, D8, D9, and D10 evidence.
2. Repair any open D7 runtime smoke blocker before broader cleanup if it is
   still present.
3. Replace legacy route/runtime/event/job/Agent-consumer logic with executable
   provider schemas, fixtures, and problem responses.
4. Verify consumer fixture compatibility for Plugin and Dashboard.
5. Return runtime smoke, route tests, event/job tests, Agent consumer tests,
   build/check evidence, and deletion notes for D14.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d11-alembic-runtime-provider-legacy-rewrite-p1` |
| Target window | `Alembic` |
| Target task | `alembic-interface-contract-d11-alembic-runtime-provider-legacy-rewrite-t1` |
| Target summary | Rewrite remaining Alembic old provider/runtime/Agent-consumer interface logic, fix open runtime smoke blockers, and return real route/runtime evidence. |

## Boundaries And Non-Goals

- Do not make diagnostics-read routes implicitly start, switch, or mutate
  runtime state.
- Do not narrow runtime/API behavior to only the smoke scenario.
- Do not edit Plugin, Dashboard, Agent, or Core source from this demand unless
  the task package explicitly authorizes a paired repair.
- Do not delete provider compatibility until consumer fixture replay and import
  scans pass.
