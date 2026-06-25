# AlembicPlugin Host, MCP, And Resident-Service Contracts Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d4-plugin-host-mcp-2026-06-09`
Sequence Order: 5
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Align Plugin MCP, host adapter, clean output, and resident-service contracts
with accepted Core and Alembic provider evidence.

## Completion Definition

- Every active MCP tool has tool-specific input/output schema and projector
  behavior.
- No MCP tool returns unrelated data through global field bags or bad legacy
  compatibility surfaces.
- Resident-service client tests replay Alembic provider fixtures.
- Missing projector and unavailable resident routes fail closed with structured
  blockers.
- Plugin build/check, repo-boundary lint, MCP contract tests, and relevant
  smoke checks pass.
- Existing host-facing Plugin capabilities remain available through clean
  per-tool contracts.

## Stage Plan

1. Read accepted D1, D2, and D3 evidence.
2. Map each active MCP tool to its specific input/output schema and projector.
3. Align resident-service client DTOs with Alembic provider fixtures.
4. Remove or isolate duplicate/legacy fields with consumer and cleanup rules.
5. Run contract tests, missing-projector tests, repo-boundary lint, and smoke
   where scope requires.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d4-plugin-host-mcp-p1` |
| Target window | `AlembicPlugin` |
| Target task | `alembic-interface-contract-d4-plugin-host-mcp-t1` |
| Target summary | Read state root and Plugin AGENTS, update only Plugin-owned contracts, and return MCP/resident-service evidence. |

## Boundaries And Non-Goals

- Do not move MCP ownership into Core or Alembic main.
- Do not replace full MCP behavior with a narrow demo or placeholder projector.
- Do not treat inventory as completion; every active MCP surface must be
  changed or verified against the clean contract.
- Do not preserve old bad fields unless a real consumer and cleanup trigger are
  recorded.
