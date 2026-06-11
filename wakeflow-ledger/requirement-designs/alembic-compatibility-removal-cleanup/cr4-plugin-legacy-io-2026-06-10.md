# Plugin Legacy Input And Envelope Removal

Demand Key: `alembic-compatibility-removal-cleanup-cr4-plugin-legacy-io-2026-06-10`
Primary Window: AlembicPlugin

## Goal

Remove public legacy input and legacy envelope compatibility from MCP tool
paths after host-facing callers use canonical input and output contracts.

## Completion Definition

Public agent-facing MCP tools require canonical `inputSource` and emit clean
per-tool `structuredContent`. Legacy fields such as `success`, `errorCode`,
`data.result`, and `legacyCompatibility` are absent from public parsing/output
except negative tests or private migration fixtures.

## Validation Floor

- Public tools contract tests.
- Core and Codex-local clean-output probes.
- Real MCP tools/list and representative callTool samples.
- Installed local plugin cache readback when source changes affect packaged MCP
  behavior.
