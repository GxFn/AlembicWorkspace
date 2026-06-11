# AlembicAgent Runtime Legacy Rewrite Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d10-agent-runtime-legacy-rewrite-2026-06-10`
Sequence Order: 11
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Rewrite remaining Agent tool/runtime/provider legacy interface logic onto the D5
public contract model so Alembic and future host consumers can rely on explicit
result branches, provider boundaries, and tool manifests.

## Completion Definition

- Tool manifests, router inputs, execution envelopes, result envelopes,
  provider-adapter outputs, and host-adapter seams use the accepted public
  contract model.
- Success, failure, cancellation, timeout, permission denial,
  needs-confirmation, partial result, provider error, and host failure paths
  have fixtures and tests.
- Provider-private fields, raw model payloads, hidden reasoning, and unrelated
  diagnostics do not leak into ordinary public output.
- Alembic consumer expectations for Agent result envelopes are documented in
  executable tests or fixtures, not only prose.
- Existing Agent capabilities remain reachable; old paths are removed only
  after replacement evidence and consumer validation.

## Stage Plan

1. Read D1, D5, D8, and D9 evidence.
2. Identify remaining old Agent execution/result/provider paths and any
   Alembic-side consumers that still expect legacy shapes.
3. Normalize Agent public contracts and branch fixtures without collapsing
   non-success states into generic errors.
4. Remove or quarantine legacy adapters only after no-consumer evidence.
5. Return focused unit, fixture, boundary, and consumer-impact evidence.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d10-agent-runtime-legacy-rewrite-p1` |
| Target window | `AlembicAgent` |
| Target task | `alembic-interface-contract-d10-agent-runtime-legacy-rewrite-t1` |
| Target summary | Rewrite remaining Agent old runtime/tool/provider interface logic onto accepted D5 public contracts and prove all result branches. |

## Boundaries And Non-Goals

- Do not edit Alembic consumer code from the Agent window unless a controller
  package explicitly authorizes it.
- Do not expose provider internals as public runtime contracts.
- Do not replace real tool execution behavior with mocks or happy-path-only
  envelopes.
- Do not delete host/provider compatibility paths without no-consumer proof.
