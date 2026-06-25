# Alembic MCP Clean Output Contract Requirement Design

Date: 2026-06-08
Status: ready-for-workspace
Owner Window: Design
Receiving Window: Wakeflow
Design Key: alembic-mcp-clean-output-contract-2026-06-08

## Confirmed Goal

Create a clean, unified Alembic MCP input/output contract across all MCP tools and complete the modification across the full AlembicPlugin MCP surface. "Unified" means a minimal common response base plus one independent output schema and projector per tool. It does not mean a global field bag shared by every tool.

Original plan: `Design/docs/current/alembic-mcp-clean-output-contract-original-plan-2026-06-08.md`.
Source demand: `.wakeflow-active/current/alembic-mcp-clean-output-contract/demand.json`.

Confirmed user decisions:

- Do not build output-budget gates, max-character truncation logic, or character-limit validation.
- Do not preserve old-version compatibility for known-bad fields.
- Review all Alembic MCP tools and remove fields that a specific tool does not need.
- Do not create global `refs`, `data`, or `diagnostics` bags that allow unrelated values to leak into a tool response.
- Each tool must return only fields allowed by its own output schema and projector.
- All MCP tools are in scope. Field inventory is only the first evidence step; final completion requires modifying and verifying every active AlembicPlugin MCP tool, including agent-facing, admin, status, diagnostics, and job tools.

## Design Skill Coverage

This requirement has been refined with the Design workspace skills:

- `requirement-clarification`: separated the user's actual requirement from workflow mechanics. The requirement is a verifiable MCP contract cleanup, not a gate, size limiter, compatibility layer, or generic "make output shorter" activity.
- `option-planning`: compared plausible contract routes and rejected routes that would preserve the current problem under a new name.
- `requirement-design`: structured the confirmed requirement into goals, non-goals, actors, behavior, testing decisions, acceptance criteria, risks, and controller intake notes.
- `work-slicing`: used only to shape candidate vertical slices for controller review. It did not create TODO rows, task packages, dispatch packets, or execution authority.
- `design-handoff`: used as the compact controller-facing handoff after the requirement itself was clarified and designed.

## Clarified Requirement

- Goal: Every Alembic MCP tool returns a clean, tool-specific visible result. The shared layer contains only minimal cross-tool status and summary fields.
- Primary actor: Codex or another MCP host agent that needs to consume Alembic MCP results without filtering old envelopes, unrelated refs, or diagnostic noise.
- Current evidence: User rejected character gates, old compatibility, and a global `refs` object; code sampling found old envelopes, pretty-printed handler objects, nested `data.result`, and `alembic_task` compatibility exposure.
- Scope: All active AlembicPlugin MCP tool declarations, handlers, response serialization, output schemas, projectors, tool descriptions, skill guidance, tests, and smoke/probe expectations.
- Non-goals: No character-budget feature, no old-version compatibility, no dashboard redesign, no product semantic rewrite, and no default Core promotion.
- Completion evidence: A field inventory exists for every AlembicPlugin MCP tool; each field is marked `keep`, `remove`, or `move-to-diagnostics`; every active MCP tool is modified to the new output contract; every tool has an independent output schema/projector test; focused tests plus build/check pass.
- Stop conditions: Stop if implementation proposes a global escape bag, passes handler-internal objects through, keeps old compatibility as active output, removes behavior instead of only cleaning visible output, or finds a real external consumer whose deletion impact needs controller/user decision.
- Recommended interpretation: Proceed with a breaking cleanup of the active MCP output contract, using a minimal base plus per-tool whitelisted result schemas.
- Open decisions: No open user decision for core scope. Controller may still decide execution phasing. Any AlembicCore helper requires code research proving a real second consumer.
- Ready for: controller intake and task-package planning after review; work-slicing remains candidate-only until controller promotes it.

## Final Completion Definition

Wakeflow may accept the demand only when the full MCP-surface modification is complete:

- Every Alembic MCP tool declared through the Plugin MCP surface has a field-level inventory with each existing return field marked `keep`, `remove`, or `move-to-diagnostics`.
- Every active AlembicPlugin MCP tool is modified to use the new clean output contract. Inventory alone is not completion evidence.
- A minimal shared MCP response base exists for cross-tool status only, with no all-purpose business field container.
- Every MCP tool has its own output schema and projector. The projector is the only path from handler-internal objects to MCP-visible output.
- Output schemas reject unrelated fields. For example, search output cannot include intent/work/guard/decision refs, and intent output cannot include guard or decision result fields.
- Old compatibility/error fields are removed from active output contracts, including `legacyCompatibility`, `data.result` nesting, mixed `success/errorCode/message/data/meta` envelopes, and hidden `alembic_task` direct-call compatibility.
- Runtime diagnostics fields such as `projectRuntime`, `residentService`, `serviceBoundary`, `enhancementRoute`, and `telemetry` appear only in tools whose purpose is diagnostics/status/job inspection.
- MCP call results expose the new structured result and a concise `summary` text. No character-budget feature is introduced.
- Tool descriptions, skills, tests, and smoke/probe scripts are updated to match the new output contract.
- AlembicPlugin build/check and focused output schema/projector tests pass.

## User Confirmation Record

On 2026-06-08 the user confirmed:

- All Alembic MCP tools must be uniformly modified and optimized to completion, not merely inventoried.
- The field-necessity rule is confirmed: a tool may return only fields required by that tool's primary action, immediate consumer need, or explicit diagnostic/status/job purpose.
- Old compatibility deletion is confirmed. Do not preserve old bad fields as a compatibility surface.
- Structured tool-specific output plus concise summary text is confirmed. Do not add character gates, `maxChars`, `truncated`, or `outputBudget`.

## User Scenario

- Actor: Codex or another host agent using Alembic MCP tools.
- Starting state: Alembic MCP tools return large, inconsistent objects with nested envelopes, old compatibility fields, and diagnostic data mixed into ordinary business results.
- Action: The host agent calls a tool such as `alembic_search`, `alembic_intent`, `alembic_code_guard`, or `alembic_codex_status`.
- Expected result: The tool returns a small, schema-specific result with only the fields needed for that tool's job.
- Failure visibility: If a handler tries to return an unrelated field, the tool-specific projector/schema test fails before the output contract is accepted.

## Functional Loop

| Part | Description |
| --- | --- |
| Input | MCP tool name plus that tool's input schema arguments. No output-mode or max-character controls are required for this demand. |
| Producer | AlembicPlugin MCP handler performs the real operation, then passes internal data through the tool-specific output projector. |
| State/Data Change | Read-only tools change no state. Write tools keep their real existing state changes, but their visible response is projected through a per-tool whitelist. |
| Consumer | Host agents and MCP clients consume the structured tool output without parsing nested old envelopes or filtering unrelated diagnostics. |
| Output | Minimal shared base plus each tool's own `result` object. No global `refs`, `data`, `diagnostics`, or arbitrary extension bag. |
| Failure Path | Unknown tool, schema validation failure, or operation failure returns the same minimal base with a tool-specific error code and no leaked internal object. |
| User Verification | Sample calls for each MCP tool show no unrelated fields and no old compatibility fields. |

## Option Planning Result

### Option 1: Global Field Bag

- Summary: Define one broad response object such as `refs`, `data`, `details`, or `diagnostics` and let each tool populate what it has.
- User-visible behavior: Output may look organized, but unrelated fields can still appear on tools that do not need them.
- Repositories/windows: Mostly AlembicPlugin.
- Interfaces/contracts: One broad shared contract with many optional fields.
- Validation path: Hard to prove absence of unrelated fields because the global schema allows them.
- Rollout or migration: Quick, but it preserves the original failure mode.
- Risks: Recreates the exact issue the user called out in the screenshot.
- Fit: Rejected.

### Option 2: Minimal Base Plus Per-Tool Projectors Across The Full MCP Surface

- Summary: Keep only minimal cross-tool fields in a shared base, then define one output schema and projector per MCP tool across the full active AlembicPlugin MCP surface.
- User-visible behavior: Each tool returns only fields needed for that tool's job.
- Repositories/windows: AlembicPlugin primary; AlembicCore only if code research proves a real shared consumer.
- Interfaces/contracts: Shared base plus independent tool result contracts. Projectors are the only path from handler internals to MCP-visible output.
- Validation path: Unit tests can sample each tool projector and reject unrelated fields.
- Rollout or migration: Inventory first, then migrate tools by visible surface groups.
- Risks: Requires complete inventory and test rewrites, but the risk is controllable.
- Fit: Confirmed Design route and aligned with user decisions.

### Option 3: Text Summary Cleanup Only

- Summary: Keep existing structured objects but make MCP text shorter or prettier.
- User-visible behavior: Visible text is lighter, but structured output and handler internals still carry stale/noisy fields.
- Repositories/windows: AlembicPlugin.
- Interfaces/contracts: Old envelope remains active.
- Validation path: Cannot prove the contract is clean because old fields still exist.
- Rollout or migration: Cheap but incomplete.
- Risks: Hides the noise instead of removing it.
- Fit: Rejected as insufficient.

### Option 4: Compatibility Adapter

- Summary: Add new output while preserving old fields or old `alembic_task` route for existing consumers.
- User-visible behavior: New consumers still see or can depend on bad legacy fields.
- Repositories/windows: AlembicPlugin, possible docs/tests.
- Interfaces/contracts: Dual contract with cleanup ambiguity.
- Validation path: Tests must keep legacy expectations, weakening the cleanup.
- Rollout or migration: Safer only if a real external consumer is found.
- Risks: Directly conflicts with the user's "no old compatibility" decision.
- Fit: Rejected unless code research discovers a specific external consumer that must return to controller/user decision.

## Repository Boundaries

| Window / Repository | Role | Expected Change | Upstream Dependency | Downstream Consumer |
| --- | --- | --- | --- | --- |
| Wakeflow | Controller/runtime support | Intake, phase judgment, task package creation only after review. | This Design handoff and state root. | AlembicPlugin window. |
| Design | Requirement design support | This requirement design and handoff. | User-confirmed decisions in current discussion. | Wakeflow controller. |
| AlembicPlugin | Primary implementation owner | MCP schema, handler projection, tool descriptions, skills, tests, and Codex plugin smoke updates. | Wakeflow task package after intake. | Codex/host MCP clients. |
| AlembicCore | Observing / possible narrow contributor | Only if a truly shared contract already has multiple consumers. Do not move Plugin-specific host-facing output schemas into Core by default. | Plugin code research. | AlembicPlugin if needed. |
| AlembicDashboard | No-task by default | No dashboard frontend changes unless code research proves a dashboard consumer of MCP output contract. | None. | None by default. |
| Test | Optional real-scenario verification | Only if controller decides real MCP runtime or packaged Codex smoke cannot be verified in AlembicPlugin alone. | Plugin self-verification evidence. | Wakeflow acceptance. |

## Code Facts

- Confirmed entrypoints:
  - `AlembicPlugin/lib/codex/mcp/PluginToolSurfaceCatalog.ts` lists tool owners, schemas, gates, and handler owners.
  - `AlembicPlugin/lib/codex/mcp/tools.ts` declares MCP tool schemas and still defines `LEGACY_DIRECT_CALL_COMPATIBILITY_TOOLS` for `alembic_task`.
  - `AlembicPlugin/lib/codex/mcp/CodexMcpServer.ts` serializes handler results with `JSON.stringify(result, null, 2)` in text content.
  - `AlembicPlugin/lib/codex/mcp/McpServer.ts` also serializes non-MCP-tool-response results as pretty JSON text.
  - `AlembicPlugin/lib/codex/mcp/envelope.ts` defines the old mixed envelope shape.
  - `AlembicPlugin/lib/shared/schemas/mcp-tools.ts` contains MCP input schemas and currently includes agent output budget input fields.
  - `AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts` returns nested `data.result` shapes for the six public agent tools.
- Confirmed call chain:
  - MCP `tools/list` reads tool declarations from `tools.ts` / tool visibility logic.
  - MCP `tools/call` invokes `CodexMcpServer.handleToolCall` or `McpServer._handleToolCall`.
  - Handlers return internal objects or old envelopes, then server code serializes them into MCP text content.
- Confirmed tests/builds:
  - Existing tests include `AlembicPlugin/test/unit/AgentPublicToolsEvaluation.test.ts`, which asserts current public-tool envelope fields and will need contract updates.
- Missing code facts:
  - Full current return-field inventory for every declared MCP tool.
  - Exact final output schema per tool.
  - Which existing tests/smoke probes read old fields and must be rewritten or deleted.
  - Whether any non-Codex consumer relies on current old fields. This is code-research input only, not a compatibility requirement.

## Phase Candidates

Phases are candidates for Wakeflow review. They are not task packages.

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| P0 | MCP output inventory | Reads all tool declarations and representative handler returns before designing final schemas. This is evidence only, not completion. | Field table exists for every tool with `keep/remove/move-to-diagnostics`. |
| P1 | Contract design | Uses P0 inventory and user decisions. | Minimal base type and per-tool output schema plan exist with no global business field bag. |
| P2 | Public agent tool migration | Depends on P1. | Six agent public tools return only their own schema fields; old `legacyCompatibility`, `outputBudget`, and `data.result` are removed. |
| P3 | Core/query/write/workflow tool migration | Depends on P1 and lessons from P2. | Search, knowledge, structure, graph, call context, guard, submit, project skill, bootstrap/rescan/evolve/consolidate/dimension/panorama outputs are schema-specific. |
| P4 | Codex runtime tool migration | Depends on P1. | Status/diagnostics/job tools keep diagnostics only where purposeful; ordinary runtime tools do not leak broad context. |
| P5 | Old surface removal and docs/tests | Depends on P2-P4. | Old compatibility fields and `alembic_task` compatibility exposure are removed; tests, descriptions, skills, smoke/probes pass. |

## Work-Slicing Candidate Notes

These are Design slice candidates only. They do not mutate TODO/Backlog and are not task packages.

### Candidate 1: Full MCP Output Inventory

- Type: AFK candidate after controller confirmation
- Owning window suggestion: AlembicPlugin
- Blocked by: controller phase decision
- User stories covered: Host agent can know which fields are intentionally present or removed for every tool.
- What changes: Produce a field-level inventory from tool declarations, handlers, and representative returns.
- Observable result: Every visible MCP tool has `keep`, `remove`, or `move-to-diagnostics` decisions for current return fields.
- Validation path: Review inventory against `tools.ts`, `PluginToolSurfaceCatalog.ts`, and handler returns.
- Why this is a vertical slice: It covers the whole MCP surface as evidence before any schema implementation.

### Candidate 2: Projector Contract Infrastructure With One Tool Group

- Type: AFK candidate after inventory
- Owning window suggestion: AlembicPlugin
- Blocked by: Candidate 1
- User stories covered: Host agent receives tool-specific output instead of old nested envelopes.
- What changes: Add minimal response base, per-tool output schema/projector pattern, and migrate the first public agent tool group.
- Observable result: Migrated tools cannot return unrelated fields or old `data.result` shapes.
- Validation path: Focused projector/schema tests plus existing public-tool tests rewritten to the new contract.
- Why this is a vertical slice: It proves the new contract through real MCP-visible tools, not just type definitions.

### Candidate 3: Remaining MCP Tool Surface Migration

- Type: AFK candidate after contract pattern is accepted
- Owning window suggestion: AlembicPlugin
- Blocked by: Candidate 2
- User stories covered: Host agent gets the same clean contract across all Alembic MCP tools.
- What changes: Migrate query/write/workflow/runtime tools and keep diagnostics only in diagnostic/status/job tools.
- Observable result: Sample calls across the full MCP surface show only schema-approved fields.
- Validation path: Table-driven tool sampling tests and build/check.
- Why this is a vertical slice: It covers the remaining user-visible MCP call paths through the established projector route.

### Candidate 4: Old Surface Removal And Documentation/Test Alignment

- Type: AFK candidate after all migrated tools pass
- Owning window suggestion: AlembicPlugin
- Blocked by: Candidate 3
- User stories covered: Host agent and future maintainers no longer see old compatibility fields as supported contract.
- What changes: Remove `legacyCompatibility`, active old `alembic_task` compatibility exposure, old envelope expectations, stale docs/skills/smoke probes.
- Observable result: No active docs/tests/tool descriptions advertise old fields.
- Validation path: Build/check, focused contract tests, smoke/probe updates, and `git diff --check`.
- Why this is a vertical slice: It closes the migration by aligning visible contract, tests, and operator guidance.

## Validation Strategy

- Controller self-verification:
  - Review inventory and phase evidence before dispatch acceptance.
  - Confirm no phase introduces a global field bag under another name.
- Product repository verification:
  - AlembicPlugin focused tests for output schemas and projectors.
  - AlembicPlugin build/check.
  - MCP handler tests that sample each declared tool and assert no unrelated fields.
- Test handoff required: no by default.
- Real scenario required because:
  - Only if packaged Codex MCP behavior or host runtime behavior cannot be covered by AlembicPlugin harness/smoke.
- Success means:
  - Every tool returns only its own schema-approved fields.
  - Old noisy fields are gone from active outputs.
  - Host agents can consume MCP outputs without parsing or filtering nested old envelopes.
- Failure means:
  - Any tool returns unrelated refs/diagnostics or old compatibility fields.
  - A broad escape hatch allows arbitrary internal data to leak.
  - Tests preserve old fields instead of rewriting to the new contract.
- This test cannot prove:
  - That the product semantics of search/guard/bootstrap are correct beyond the output contract unless those semantic tests are run separately.

## TODO / Backlog Candidates

| ID | Type | Priority | Owner Candidate | Reason | Current Mainline Relation |
| --- | --- | --- | --- | --- | --- |
| MCP-CLEAN-OUTPUT-P0 | code-research | P0 | AlembicPlugin | Need full field inventory before final schema decisions. | next-mainline |
| MCP-CLEAN-OUTPUT-P1 | implementation | P0 | AlembicPlugin | Need minimal base and per-tool output schema/projector infrastructure. | after P0 |
| MCP-CLEAN-OUTPUT-P2 | implementation | P1 | AlembicPlugin | Public agent tools are the most visible source of nested old fields. | after P1 |
| MCP-CLEAN-OUTPUT-P3 | implementation | P1 | AlembicPlugin | Remaining MCP tools must be migrated without returning unrelated fields. | after P2 |
| MCP-CLEAN-OUTPUT-P4 | validation/docs | P1 | AlembicPlugin | Tests, skills, descriptions, and smoke/probes must stop expecting old fields. | after P2-P3 |

## Risks And Decisions

- Confirmed decisions:
  - No output-budget/character-limit feature.
  - No old-version compatibility for bad fields.
  - Per-tool output schema/projector is mandatory.
  - Global all-purpose `refs`, `data`, or diagnostics bags are forbidden.
- Pending decisions:
  - Whether admin-tier tools are migrated in the same implementation phase as agent-tier tools or as a separate cleanup phase.
  - Whether any schema helper belongs in AlembicCore after code research proves multiple real consumers.
- Risks:
  - Tool descriptions/tests may accidentally keep old output fields alive.
  - A generic helper could reintroduce an arbitrary payload escape hatch.
  - Runtime diagnostics may be useful but should move to diagnostic tools, not leak through ordinary tools.
- Non-goals:
  - No UI/dashboard redesign.
  - No product semantic rewrite of search, guard, bootstrap, rescan, or decision register behavior.
  - No legacy compatibility adapter.
  - No character-budget feature.
- Forbidden shortcuts:
  - Do not replace the old `data` bag with a new global `refs` or `details` bag.
  - Do not pass handler-internal objects through as MCP output.
  - Do not keep `legacyCompatibility` or hidden `alembic_task` direct-call compatibility as active contract.
  - Do not move Plugin host-facing MCP contracts to Core without a real second consumer.

## Handoff Readiness

- Original plan confirmed: yes, by user decisions in this thread and Design original plan.
- Requirement design complete: yes, for controller intake.
- Code facts sufficient: sufficient for intake; not sufficient for implementation without P0 field inventory. P0 is required evidence before modification, not the final deliverable.
- Needs Wakeflow code research: yes, P0.
- Ready for workspace handoff: yes.
