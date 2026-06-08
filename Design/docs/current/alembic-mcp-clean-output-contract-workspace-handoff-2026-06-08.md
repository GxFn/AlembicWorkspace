# Alembic MCP Clean Output Contract Workspace Handoff

Date: 2026-06-08
Status: ready-for-workspace
Source Window: Design
Receiving Window: Wakeflow
Design Key: alembic-mcp-clean-output-contract-2026-06-08

## Summary

Wakeflow should review a confirmed cleanup demand for Alembic MCP outputs. The important requirement is not merely shorter output and not merely inventory: every active AlembicPlugin MCP tool must be modified and verified under an independent output schema and projector so it cannot return fields unrelated to that tool. The shared response layer must stay minimal and must not become a global field bag.

Design has now applied the supporting requirement-design skills before handoff:

- `requirement-clarification` clarified and the user confirmed that this is a breaking full-MCP-surface contract cleanup, not a character gate, compatibility exercise, or inventory-only task.
- `option-planning` rejected global field bags, text-only cleanup, and compatibility adapters; it recommends minimal base plus per-tool projectors.
- `requirement-design` expanded the artifact into user scenario, functional loop, testing decisions, acceptance criteria, risks, and controller intake notes.
- `work-slicing` produced candidate slices only; it did not create TODO rows, task packages, or dispatch authority.

## Handoff Type

requirement-candidate

## Confirmed User Goal

- Clean and unify Alembic MCP input/output design.
- Review, modify, and verify all AlembicPlugin MCP tools so unnecessary output content is removed from the active contract.
- Do not keep old-version compatibility for known-bad output fields.
- Do not add character-budget gates or output-size limiting logic.
- Ensure each tool returns only its own schema-approved business fields.

## Final Completion Definition

- All AlembicPlugin MCP tools have a field-level output inventory.
- All active AlembicPlugin MCP tools are modified to use the new clean output contract. Inventory alone is not completion.
- A minimal shared response base exists only for cross-tool status fields.
- Each tool has its own output schema and projector.
- No tool can return unrelated refs, diagnostics, or legacy fields through a shared bag.
- Old fields such as `legacyCompatibility`, `data.result`, mixed `success/errorCode/message/data/meta`, and `alembic_task` compatibility exposure are removed from the active contract.
- Diagnostics appear only in diagnostic/status/job tools.
- Relevant AlembicPlugin tests, descriptions, skills, smoke/probes, and build/check pass.

## Current Design Status

- Requirement design status: ready-for-workspace after clarification, option-planning, requirement-design, and candidate slicing passes
- User confirmation status: confirmed for full MCP-surface cleanup; phasing remains controller scheduling judgment only
- Mainline relation status: `next-mainline`
- Original plan confirmation status: confirmed through current demand and user corrections
- Code fact status: partial; enough for intake, not enough for implementation without P0 inventory; final scope remains all MCP tools
- Needs Wakeflow code research: yes
- Detached Design mode: no
- Relation to Wakeflow current mainline: new demand after AFAPI remaining queue completion

## Recommended Next Step

controller review and full-surface task planning

This recommendation is for Wakeflow review only. It is not an execution-window prompt.

## Functional Loop Summary

- User scenario: A host agent calls any Alembic MCP tool and receives a clean, tool-specific structured result.
- Input: MCP tool name and that tool's input arguments.
- Output: Minimal status base plus the tool's own `result` shape.
- State change: Existing write tools keep their real state changes; output projection changes only the visible contract.
- Producer: AlembicPlugin MCP handler plus tool-specific projector.
- Consumer: Codex or other MCP host clients.
- Failure path: Unknown tool, schema failure, or operation failure returns only schema-approved error fields and no internal object leak.

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicPlugin | participates | Own full MCP-surface schema, handlers, projectors, tool descriptions, skills, tests, and plugin smoke/probes. | Needs P0 inventory before implementation; final scope is all active MCP tools. |
| AlembicCore | observing / needs-research | Participate only if code research proves a real shared contract with multiple consumers. | Do not promote Plugin-specific host MCP schemas by default. |
| AlembicDashboard | no-task | No default frontend work. | Only revisit if code research finds Dashboard consumes this MCP output contract. |
| Design | design-complete | Requirement design and handoff are ready. | None. |
| Test | observing | Use only if packaged Codex MCP/runtime behavior needs independent real-scenario verification. | AlembicPlugin self-verification first. |

## Evidence And Links

- Existing state root: `../.workspace-active/workspace/current/alembic-mcp-clean-output-contract/`
- Original plan: `Design/docs/current/alembic-mcp-clean-output-contract-original-plan-2026-06-08.md`
- Requirement design: `Design/docs/current/alembic-mcp-clean-output-contract-requirement-design-2026-06-08.md`
- Handoff: `Design/docs/current/alembic-mcp-clean-output-contract-workspace-handoff-2026-06-08.md`
- Code facts:
  - `AlembicPlugin/lib/codex/mcp/PluginToolSurfaceCatalog.ts`
  - `AlembicPlugin/lib/codex/mcp/tools.ts`
  - `AlembicPlugin/lib/codex/mcp/CodexMcpServer.ts`
  - `AlembicPlugin/lib/codex/mcp/McpServer.ts`
  - `AlembicPlugin/lib/codex/mcp/envelope.ts`
  - `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
  - `AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts`
- User decisions:
  - No character gates or maxChars/truncated logic.
  - No old compatibility.
  - No global field bag; every tool uses its own output schema.
  - All AlembicPlugin MCP tools must be modified and verified to completion; inventory is only the first evidence step.
- Related TODO / Backlog: none created by Design; Wakeflow should decide intake routing.

## Risks

- A generic response helper may accidentally become a new arbitrary payload tunnel.
- Tests may continue asserting old fields and preserve the wrong contract.
- Runtime diagnostics may be over-retained in ordinary tools instead of moving to diagnostic/status/job tools.
- Admin/status/diagnostics/job tools may be missed if inventory only looks at default agent-tier visibility; full MCP-surface coverage is confirmed scope.

## Non-Goals And Forbidden Shortcuts

- No product semantic rewrite of MCP tool operations.
- No dashboard redesign.
- No old compatibility layer.
- No output-size budget feature.
- Do not return all possible refs from a shared `refs` object.
- Do not return handler-internal data directly.
- Do not move Plugin host-facing MCP output schemas into AlembicCore without real multi-consumer evidence.

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| P0 | Inventory every MCP tool output | Must happen before schema finalization. It is evidence only, not completion. | Field-level keep/remove/move-to-diagnostics table. |
| P1 | Define minimal base and per-tool schemas | Depends on P0. | No global business field bag exists. |
| P2 | Migrate public agent tools | Depends on P1. | Six public tools return only their own fields. |
| P3 | Migrate remaining MCP tools | Depends on P1/P2. | Query/write/workflow/runtime tools use projectors. |
| P4 | Remove old surface and update tests/docs | Depends on P2/P3. | Old fields removed and verification passes. |

Phase candidates are for controller review only and are not task packages.

## Open Questions For Wakeflow

1. Which task-package split should controller use to cover all MCP tools without letting P0 inventory become the stopping point?

## Design Handoff

- Source: current user discussion, current state root, and code fact sampling.
- Goal: clean per-tool MCP output contracts.
- Confirmed decisions: no character gates, no old compatibility, no global field bag.
- Design recommendations: require P0 inventory before implementation; use tool-specific output schemas/projectors.
- Open questions: task-package split only; full MCP-surface completion is user-confirmed.
- Non-goals: dashboard redesign, semantic rewrites, compatibility adapters.
- Risks: broad helper reintroducing arbitrary payloads, stale tests preserving old fields.
- Required controller judgment: phase order and task package split.
- Suggested next action: controller review, then full-surface task planning starting with P0 code research.
- Suggested skills: wakeflow-governance, Design requirement clarification/option-planning/design artifacts, AlembicPlugin AGENTS, focused MCP/code-fact analysis.
- Source artifacts: requirement design and existing state root listed above.
- Redaction notes: no secrets or real thread ids included.
- Intake status: ready-for-controller-intake.

## Pre-Handoff Checklist

- Checked `docs/workspace-alignment-checklist.md` or the external Design repository equivalent: yes.
- This handoff does not include copyable implementation-window prompts: yes.
- Phases remain candidates, not task packages: yes.
- TODO / Backlog candidates are listed in Evidence And Links: yes, none created by Design.
- Any deletion, downgrade, deferral, compatibility retention, or boundary change is marked as pending confirmation: yes; old compatibility deletion is user-confirmed, phase execution remains controller judgment.
