# Controller Review Evidence: P0 Plugin Skill Discovery + Usage Baseline

Demand: `alembic-proactive-activation-2026-07-03`
Dispatch group: `p0-plugin-cc-skill-discovery-usage-baseline-p1`
Target: `AlembicPlugin / p0-plugin-cc-skill-discovery-usage-baseline-t1`
Reviewed at: 2026-07-07 15:24 CST

## Scope Reviewed

P0 required two proofs before later proactive-activation phases:

1. Confirm Claude Code's project-level skill discovery path with official docs plus true-machine loading behavior.
2. Implement and expose WS-1 session-level usage measurement for `alembic_prime`, `alembic_search`, `alembic_recipe_map`, and `alembic_graph`, without persistent telemetry or four-tool output contract changes.

## External Docs Checked

- Official Claude Code skills docs: `https://code.claude.com/docs/en/skills`
  - Project skills are documented under `.claude/skills/<skill-name>/SKILL.md`.
  - Claude Code discovers project skills from the starting directory, parents up to repo root, nested `.claude/skills`, and `.claude/skills` inside `--add-dir`.
- Claude Platform Agent Skills overview: `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview`
- Agent Skills specification: `https://agentskills.io/specification`

Conclusion: Claude Code branch for WS-2 should export to `.claude/skills/<skill-name>/SKILL.md`; `.agents/skills` is not the Claude Code project-skill path.

## True-Machine Probe

Probe directory: `/tmp/alembic-cc-skill-probe-20260707`

Skill files present:

- `/tmp/alembic-cc-skill-probe-20260707/.claude/skills/alembic-claude-probe/SKILL.md`
- `/tmp/alembic-cc-skill-probe-20260707/.agents/skills/alembic-agents-probe/SKILL.md`

Controller reran:

```text
claude --version
=> 2.1.199 (Claude Code)
```

Controller reran the positive `.claude/skills` probe:

```text
claude -p --no-session-persistence --permission-mode bypassPermissions --model sonnet --max-budget-usd 0.20 --output-format json "/alembic-claude-probe"
=> subtype=success, is_error=false, result=ALEMBIC_CLAUDE_SKILL_PROBE_20260707_1504
```

Controller reran the negative `.agents/skills` probe:

```text
claude -p --no-session-persistence --permission-mode bypassPermissions --model sonnet --max-budget-usd 0.20 --output-format json "/alembic-agents-probe"
=> subtype=success, is_error=false, num_turns=0, total_cost_usd=0, result=Unknown command: /alembic-agents-probe
```

Conclusion: generated files were not enough; the `.claude/skills` slash skill was actually loaded and executed by Claude Code, while the `.agents/skills` control was not.

## Code Reviewed

AlembicPlugin commit: `195b9b2227b7ab5fb6995bc0e361636338bc947d` (`Track MCP session tool usage`)

Touched files:

- `AlembicPlugin/lib/host-runtime/mcp/session-usage.ts`
- `AlembicPlugin/lib/host-runtime/mcp/HostMcpServer.ts`
- `AlembicPlugin/lib/host-runtime/mcp/McpServer.ts`
- `AlembicPlugin/lib/host-runtime/mcp/handlers/system.ts`
- `AlembicPlugin/lib/host-runtime/mcp/handlers/types.ts`
- `AlembicPlugin/lib/host-runtime/mcp/local-tools/output.ts`
- `AlembicPlugin/test/unit/HostMcpServer.test.ts`
- `AlembicPlugin/test/unit/McpCodexLocalToolsCleanOutputContract.test.ts`

Implementation facts:

- `trackMcpToolUsage` records in-memory counts and `lastCalledAt` only.
- `buildMcpToolUsageView` exposes exactly four public keys: `prime`, `search`, `recipeMap`, `graph`.
- Embedded `HostMcpServer` and routed `McpServer` both call the tracking hook after tool execution.
- `buildStatus` / system status include `usage: buildMcpToolUsageView(...)`.
- Local clean-output allowlist for `alembic_status` includes `usage`, so the strict projector does not drop the new status field.
- No persistent storage or resident telemetry was added.

## Controller Validation

Controller reran:

```text
npx vitest run test/unit/HostMcpServer.test.ts test/unit/McpCodexLocalToolsCleanOutputContract.test.ts
=> Test Files 2 passed (2); Tests 50 passed (50)
```

The new `HostMcpServer` assertion proves:

- after `alembic_prime` once and `alembic_search` twice, `session.toolCallCount === 3`;
- `session.toolsUsed === ["alembic_prime", "alembic_search"]`;
- `usage.byTool.prime.count === 1`;
- `usage.byTool.search.count === 2`;
- `usage.byTool.recipeMap` and `usage.byTool.graph` remain `{ count: 0, lastCalledAt: null }`.

Controller reran:

```text
npm run build:check
=> pass; Core build used ../AlembicCore @ 73cb9a340a4044eed68977d5ddbc36491deda674
```

## Decision Input

P0-A path decision is proven: Claude Code export should use `.claude/skills/<skill-name>/SKILL.md`.

WS-1 usage baseline is implemented and covered at the embedded host-server seam. The behavior is intentionally session-only and is not persistent telemetry.

WS-2 host-aware export remains intentionally out of scope for this P0 result; it is the next eligible phase once P0 is accepted.
