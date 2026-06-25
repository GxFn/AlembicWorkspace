# Agent Result Diagnostic Content Cleanup Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d23-agent-result-diagnostic-content-cleanup-2026-06-10`
Sequence Order: 24
Maintainer: AlembicWorkspace
Primary Window: AlembicAgent
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Separate AlembicAgent ordinary result content from diagnostics, artifacts,
resources, provider-private data, host-private data, and hidden reasoning while
preserving every important runtime branch.

## Completion Definition

- Agent output keeps distinct `success`, `partial`, `error`, `blocked`,
  `aborted`, `timeout`, and `needs-confirmation` states.
- Public result fields match the agent interface contract and do not include
  forbidden ordinary output fields.
- Provider request/response, hidden reasoning, credentials, host ids, thread
  ids, and raw policy context are private or diagnostic-only.
- Diagnostics are summarized with stable keys and large data is reachable via
  refs/artifacts where needed.
- Alembic provider consumers can replay Agent branch fixtures without relying
  on legacy `{ success, errorCode, message, data.result }` bags.

## Work Items

- Audit `ToolResultEnvelope`, provider adapters, tool routers, and host adapter
  paths against D17 field taxonomy.
- Add or repair tests for every branch in the Agent interface contract.
- Ensure private provider fields are not copied into ordinary structured
  output, logs, dashboard payloads, or MCP tool content.
- Preserve provider compatibility branches only when current adapters still
  require them.

## Real Code Evidence Requirements

- Anchor to `AlembicAgent/src/tools/core/ToolResultEnvelope.ts` and
  `AlembicAgent/src/agent/runtime/AgentInterfaceContract.ts`.
- Preserve rich Agent evidence internally, but project ordinary public output
  to branch-specific fields with diagnostics/artifacts/resources routed through
  stable refs.
- Verify forbidden ordinary fields from the Agent contract are absent in real
  provider-facing outputs: raw provider request/response, hidden reasoning,
  credentials, host credentials, and thread ids.
- Tests must cover success, partial, error, blocked, aborted, timeout, needs
  confirmation, provider error, host failure, and host-adapter branches.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d23-agent-result-diagnostic-content-cleanup-p1` |
| Target window | `AlembicAgent` |
| Target task | `alembic-interface-contract-d23-agent-result-diagnostic-content-cleanup-t1` |
| Target summary | Normalize Agent result and diagnostic content without losing branch semantics or evidence. |

## Boundaries

- Do not collapse partial or needs-confirmation behavior into generic error.
- Do not expose hidden reasoning or provider raw payloads in ordinary output.
- Do not break existing provider round-trip requirements without evidence.
