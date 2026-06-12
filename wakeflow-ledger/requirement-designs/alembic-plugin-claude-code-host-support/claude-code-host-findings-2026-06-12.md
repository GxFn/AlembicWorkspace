# AlembicPlugin Claude Code Host Support Findings

Status: evidence base / Design-window host-coupling census + local precedent inspection
Date: 2026-06-12
Audited Heads: AlembicPlugin `838da9e` (committed state; CKG in flight),
local Claude Code plugin precedent: installed Wakeflow plugin 0.5.1
Design Key: alembic-plugin-claude-code-host-support

## P1. The Architecture Already Anticipates Claude Code

- `lib/codex/mcp/public-tools/contract.ts:14` defines
  `AGENT_HOSTS = ['codex', 'claude-code', 'generic-host-agent']` with an
  `AgentHostSchema` and a `cross-host-readiness.ts` module. The public
  tool-contract envelope carries an `agentHost` field.
- Host identity is environment-driven, never branched:
  `ensureCodexRuntimeEnvironment()` (lib/codex/runtime/RuntimeContext.ts:48-55)
  sets `ALEMBIC_PLUGIN_HOST=codex` only if absent; all behavior keys off
  the env slot.
- The MCP wire is standard: SDK StdioServerTransport
  (lib/codex/mcp/CodexMcpServer.ts:11); tool routing by handler, not host.
- Project-root resolution (lib/codex/ProjectRootResolver.ts:69-80) tries
  `ALEMBIC_PROJECT_DIR`, `CODEX_WORKSPACE_DIR`, `PWD` — fits any host that
  can inject one env var.

## P2. Actual Codex Coupling Is Small And Enumerable

- 4 tool-description strings mention Codex by name (tools.ts:
  `alembic_project_skill` ×3 phrases, `alembic_knowledge_lifecycle` ×1).
- Packaging identity: `plugins/alembic-codex/.mcp.json` sets
  `ALEMBIC_PLUGIN_HOST=codex`, `ALEMBIC_CHANNEL_ID=codex`,
  `ALEMBIC_MCP_MODE=1`, `ALEMBIC_RUNTIME_MODE=plugin` and launches
  `node ./bin/alembic-codex-start.mjs`; bin entry `alembic-codex-mcp`.
- Project Skill delivery targets the Codex runtime convention
  `.agents/skills/<name>/SKILL.md` (lib/codex/ProjectSkillDelivery.ts) —
  Claude Code needs its own export target convention.
- `lib/codex/` path naming (73 files) is cosmetic, not semantic.
- Initialize guidance/playbook text is host-neutral; diagnostics use the
  host env slot.

## P3. Local Claude Code Plugin Precedent (Wakeflow 0.5.1, installed)

- Manifest: `.claude-plugin/plugin.json` with name/version/description/
  author/keywords and `"mcpServers": "./.mcp.json"`.
- MCP wiring: `.mcp.json` →
  `{"command":"node","args":["${CLAUDE_PLUGIN_ROOT}/mcp/server.cjs"],
  "env":{"...":"${CLAUDE_PROJECT_DIR}"}}` — Claude Code substitutes
  `CLAUDE_PLUGIN_ROOT` and `CLAUDE_PROJECT_DIR`; the latter maps directly
  onto `ALEMBIC_PROJECT_DIR`.
- Cache layout: plugin ships `skills/`, `commands/`, `mcp/`, `lib/`,
  `scripts/`, docs; marketplace registry lives under
  `~/.claude/plugins/{marketplaces,known_marketplaces.json,
  installed_plugins.json}` with the user's `gxfn` namespace already in
  use.
- CC0 must re-verify the official plugin/marketplace spec against current
  docs (the precedent is authoritative-by-existence but version-bound).

## P4. Runtime Packaging State (MPB interaction)

- Committed state shows `packages/alembic-codex-runtime/` as a thin
  package.json (8K) and no `runtime.tgz`/embedded `node_modules` —
  packaging appears to have moved toward the MPB direction during CKG
  work. CC0 must re-freeze the actual distribution shape and the MPB
  candidate's remaining scope before reusing it for the Claude Code
  shell.
- `@alembic/core` is `file:../AlembicCore` (workspace-local development
  link; release staging converts).

## P5. Cross-Demand Interactions

- CKG (in flight, Codex executing): the cold-start bootstrap/SOP contract
  is being built Codex-first. TIMING SIGNAL: the staged-SOP renderer
  should treat the host name as a render variable (the host slot already
  exists in env + contract) so Claude Code reuses the same SOP pack —
  worth relaying to the CKG side now, before wording hardens Codex-only.
- RC5 shared assets: injectable-skills are single-sourced with host
  overlays; a Claude Code overlay becomes the third consumer (manifest +
  drift gate extension, Alembic-side coordinated commit).
- IC5 tool-surface duality: this requirement adds NO third tool list —
  the same MCP server serves both hosts; only packaging, env identity,
  guidance wording, and skill delivery targets differ.
- Plugin hands-off: all Plugin edits remain gated until CKG completes;
  only CC0 (controller-window facts) may run before the gate.
