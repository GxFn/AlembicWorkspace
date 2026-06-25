# AlembicPlugin MCP And Host Legacy Rewrite Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d12-plugin-mcp-host-legacy-rewrite-2026-06-10`
Sequence Order: 13
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Rewrite remaining Plugin MCP, host-adapter, clean-output, resident-service, and
Codex-local legacy interface logic onto tool-specific contracts and accepted
Alembic provider fixtures.

## Completion Definition

- Every active MCP tool has a tool-specific input schema, output schema,
  projector, error/problem shape, and fixture/golden coverage.
- Tools return only fields needed by that tool and consumer; global reusable
  field bags do not leak unrelated refs, diagnostics, or internal values.
- Large logs, reports, snapshots, replay data, and long diagnostics use compact
  summaries plus `detailRef` or `artifactRef`.
- Resident-service and host-adapter clients replay accepted Alembic provider
  fixtures and fail closed when the provider is unavailable or unsupported.
- Real MCP sampling is used for representative public tools where feasible,
  and documentation-only or schema-only completion is rejected.
- Existing Plugin host-facing capabilities remain available after cleanup.

## Stage Plan

1. Read D1, D4, D8, D9, and D11 evidence.
2. Identify MCP tools and host/resident paths still using old generic payloads,
   broad refs objects, fallback success, or stale compatibility fields.
3. Implement per-tool projectors and fixture-backed validation without
   removing required behavior.
4. Run Plugin build/check, MCP contract tests, missing-projector tests, resident
   client replay tests, and representative smoke checks.
5. Return real MCP/output examples and deletion notes for D14.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d12-plugin-mcp-host-legacy-rewrite-p1` |
| Target window | `AlembicPlugin` |
| Target task | `alembic-interface-contract-d12-plugin-mcp-host-legacy-rewrite-t1` |
| Target summary | Rewrite remaining Plugin old MCP/host/resident interface logic onto per-tool contracts and prove clean, tool-specific outputs. |

## Boundaries And Non-Goals

- Do not create a central catch-all output envelope that lists every possible
  field for every tool.
- Do not keep old bad fields without a real current consumer, cleanup blocker,
  and validation evidence.
- Do not replace live MCP behavior with static fixtures only.
- Do not modify Alembic provider behavior from this demand unless a paired
  controller package explicitly authorizes it.
