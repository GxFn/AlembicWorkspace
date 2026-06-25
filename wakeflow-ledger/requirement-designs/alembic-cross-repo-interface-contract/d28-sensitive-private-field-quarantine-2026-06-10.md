# Sensitive Private Field Quarantine Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d28-sensitive-private-field-quarantine-2026-06-10`
Sequence Order: 29
Maintainer: AlembicWorkspace
Primary Window: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Find and quarantine sensitive/private fields across public HTTP, MCP, Agent,
Dashboard, logs, fixtures, and artifacts so interface cleanup never leaks raw
provider, hidden reasoning, credentials, host ids, thread ids, secrets, or
unnecessary private paths.

## Completion Definition

- Sensitive/private field taxonomy is applied to all public outputs and
  fixtures touched by D19-D27.
- Raw provider request/response, hidden reasoning, credentials, hostCredential,
  threadId, session/conversation raw ids, secrets, and private paths are absent
  from ordinary output.
- If a private value must remain for provider round-trip or internal recovery,
  it is stored behind the owning internal adapter boundary and never surfaced as
  public contract data.
- Tests or probes prove representative outputs are redacted or absent.
- Existing fixtures and docs do not gain new private local absolute paths.

## Work Items

- Search source and fixtures for sensitive/private field names.
- Add redaction/omission assertions where surfaces serialize results.
- Ensure host metadata is redacted before persistence or returned payloads.
- Mark any required private retention with owner and reason.

## Real Code Evidence Requirements

- Anchor to API key request/config surfaces, Agent forbidden ordinary fields,
  Plugin host metadata redaction, Dashboard host-managed parsing, runtime
  status/detailRefs, fixtures, logs, and generated docs.
- Public ordinary outputs must not include raw provider request/response,
  hidden reasoning, credentials, host credentials, raw session/conversation or
  thread ids, secrets, or unnecessary private paths.
- If a private value is required for internal provider protocol or recovery,
  record internal owner, storage boundary, redaction rule, and proof it does not
  cross HTTP/MCP/Dashboard public surfaces.
- Validation must include source search plus representative runtime/MCP/API
  samples, not only static pattern matching.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d28-sensitive-private-field-quarantine-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d28-sensitive-private-field-quarantine-t1` |
| Target summary | Quarantine sensitive/private fields across public interface outputs and fixtures. |

## Boundaries

- Do not remove private provider fields needed for internal provider protocol
  round-trip; keep them internal.
- Do not write user absolute paths into long-term docs.
- Do not treat redaction evidence as functional acceptance by itself.
