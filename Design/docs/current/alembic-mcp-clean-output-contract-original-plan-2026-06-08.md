# Alembic MCP Clean Output Contract Original Plan

Design Key: alembic-mcp-clean-output-contract-2026-06-08
Date: 2026-06-08
Status: ready-for-workspace
Owner Window: Design
Receiving Window: Wakeflow

## User Goal

Create a clean unified input/output contract for all Alembic MCP tools. The user explicitly wants all MCP tools reviewed and modified to completion so unnecessary return fields are removed from the active MCP contract. The goal is not to stop at inventory, add output-size gates, or preserve old compatibility fields.

## Background

- Trigger: Alembic MCP tool results currently return too much content and include inconsistent, stale, or wrong fields.
- Existing context: A Wakeflow demand state root already exists at `.wakeflow-active/current/alembic-mcp-clean-output-contract/`.
- Related repositories/windows: AlembicPlugin is the primary implementation owner; AlembicCore only participates if code research proves a shared multi-consumer contract.
- Screenshots, logs, or links: User highlighted that a shared `refs` object listing all possible refs would let tools return values they do not need.

## Scope Candidate

| Area | In Scope Candidate | Out Of Scope Candidate | Notes |
| --- | --- | --- | --- |
| User-visible behavior | All Alembic MCP outputs become clean, predictable, and tool-specific. | Adding character-limit UX or truncation controls. | Visible text should summarize; structured output should be schema-specific. |
| Runtime/data behavior | Existing operations keep real behavior; visible output projection changes. | Semantic rewrite of search/guard/bootstrap/rescan. | Output cleanup must not downgrade tool capability. |
| Repositories/windows | AlembicPlugin primary; Wakeflow controller intake; Design docs; optional Test verification. | Default Dashboard work; default Core promotion. | Core only if real shared consumers exist. |
| Testing | Output schema/projector tests for every MCP tool; build/check; smoke/probe updates. | Preserving old-field tests as compatibility. | Old bad fields should be deleted, not supported. |

## Completion Definition Candidate

Wakeflow can accept only when every Alembic MCP tool has been inventoried, modified, and verified under the new output contract. Each tool must have a tool-specific output schema and a projector that prevents unrelated fields from returning. Active outputs must remove legacy/noisy fields such as `legacyCompatibility`, `data.result`, mixed old envelopes, and `alembic_task` compatibility exposure. Diagnostic fields must stay in diagnostic/status/job tools only.

## User-Confirmed Clarification

On 2026-06-08 the user confirmed:

- Scope is all Alembic MCP tools, including agent-facing and admin/status/diagnostics/job tools. Inventory is only the first evidence step; final completion requires unified modification and optimization across the full MCP surface.
- A field may remain in a tool response only when that tool's primary action needs it, the tool's immediate next consumer needs it, or the tool is explicitly a diagnostic/status/job tool returning diagnostic data.
- Old compatibility and old bad fields should be deleted from the active contract. If code research discovers a real external consumer, stop and return that impact to controller/user decision instead of silently adding compatibility.
- MCP output should use structured tool-specific results plus concise summary text. Do not add `maxChars`, `truncated`, `outputBudget`, or character-gate logic.

## Non-Goals

- No character-budget feature.
- No old-version compatibility adapter.
- No global all-purpose `refs`, `data`, `details`, or `diagnostics` bag.
- No Dashboard redesign.
- No Core promotion without real multi-consumer evidence.

## Known Evidence

- User evidence: User rejected output gates/character limits and old compatibility, then corrected the design to avoid global `refs`.
- Code evidence: MCP surfaces are declared in `AlembicPlugin/lib/codex/mcp/tools.ts` and `AlembicPlugin/lib/codex/mcp/PluginToolSurfaceCatalog.ts`; server call paths serialize handler results in `CodexMcpServer.ts` and `McpServer.ts`; old envelope is in `envelope.ts`.
- Test evidence: Existing public tool tests assert old public-tool envelope fields and will need updates.
- Missing evidence: Full field-level return inventory for every MCP tool.

## Confirmation Questions

None for core requirement scope. Implementation phasing remains controller scheduling, but final completion must cover all Alembic MCP tools.

## Confirmation Status

- User confirmation status: confirmed for full MCP-surface cleanup.
- Do not write execution phases or dispatch targets before controller confirmation.
