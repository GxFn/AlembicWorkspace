# Plugin MCP Per-Tool Output Cleanup Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d22-plugin-mcp-per-tool-output-cleanup-2026-06-10`
Sequence Order: 23
Maintainer: AlembicWorkspace
Primary Window: AlembicPlugin
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Make every AlembicPlugin MCP tool output clean, compact, schema-backed, and
tool-specific, so unrelated fields cannot appear just because the global base
response allows a passthrough payload.

## Completion Definition

- `tools/list` exposes an `outputSchema` for every public MCP tool.
- `structuredContent` validates against the specific tool schema after the
  projector runs.
- Tool payloads include only the fields needed by that tool's caller scenario.
- Large evidence, logs, raw provider details, local runtime internals, and
  long diagnostic payloads move to `detailRefs`, `artifactRefs`, diagnostic
  tools, or `meta` where appropriate.
- Missing projectors fail closed with a clean structured blocker instead of
  leaking legacy output.
- Representative `callTool` samples prove that one tool cannot return another
  tool's private fields.

## Work Items

- Audit all MCP output projectors and public tool output schemas.
- Replace broad `UnknownRecordSchema`, `z.unknown()`, and local records with
  typed structures or refs where D17/D18 require it.
- Keep host metadata redaction and projectRoot trust boundaries intact.
- Add output-schema validation tests and real MCP sample evidence.

## Real Code Evidence Requirements

- Anchor to `AlembicPlugin/lib/codex/mcp/output-contract.ts`,
  `AlembicPlugin/lib/codex/mcp/public-tools/output.ts`,
  `AlembicPlugin/lib/codex/mcp/public-tools/contract.ts`, and MCP `tools/list`
  / representative `callTool` samples.
- Treat `CleanMcpResponseSchema.passthrough()` as an internal assembly point
  only; every public tool schema is the real output boundary.
- Replace or justify `UnknownRecordSchema`, `z.unknown()`, `localRecord`,
  broad guard/decision payloads, and runtime details with typed fields,
  `meta`, `detailRefs`, or `artifactRefs`.
- Add a negative check proving one tool cannot return fields owned by another
  tool.
- The large status payload must be split into compact ordinary status plus
  diagnostic/detail references or explicit diagnostic tool output.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d22-plugin-mcp-per-tool-output-cleanup-p1` |
| Target window | `AlembicPlugin` |
| Target task | `alembic-interface-contract-d22-plugin-mcp-per-tool-output-cleanup-t1` |
| Target summary | Tighten per-tool MCP output schemas and projectors so structuredContent is compact and tool-specific. |

## Boundaries

- Do not impose arbitrary character gates or truncation logic as the goal.
- Do not remove refs needed for evidence and recoverability.
- Do not keep old compatibility fields without a current consumer and cleanup
  trigger.
