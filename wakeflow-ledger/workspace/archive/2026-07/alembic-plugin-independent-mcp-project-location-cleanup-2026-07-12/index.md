# alembic-plugin-independent-mcp-project-location-cleanup-2026-07-12 — AlembicPlugin 独立 MCP 与单一项目定位清理

> State-root index. Generated from wakeflow-state.json (revision 3, event evt-20260712094928-0003). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: planned, revision 3)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `p1-plugin-independent-mcp-project-location-cleanup-p1` (pending) — Implement the user's authoritative AlembicPlugin independence architecture as one combined repository change and commit.

Current phase goal:
- Make AlembicPlugin MCP a standalone plugin runtime whose only project identity is the current call's explicit projectRoot (or the current host workspace root when omitted), resolved through exactly one project-location service into projectId, ghost mode, dataRoot, databasePath and database existence.
- Completely remove Alembic main selected/active/runtime-control influence and remove Plugin MCP dependence on Alembic resident/daemon availability, project selection, handoff, fallback probing or status. Do not modify Alembic main, AlembicCore, Agent, Dashboard or BiliDili.
- All public MCP tools remain visible and callable regardless of knowledge initialization/usability/freshness. Remove HostKnowledgeState-driven visibility, knowledge/tool policy, preflight knowledge gate and agent-public prebootstrap isolation block. If the request project has no database, no knowledge, or no match, each tool returns its own truthful empty/not-found/unavailable result without auto-init, blocking, cross-project fallback, stale downgrade or invented repair flow.
- Centralize projectRoot/ghost/dataRoot/databasePath resolution and physical confinement in one service used by status, initialization, query executors, skill/workflow paths and runtime composition. Remove duplicate per-handler identity validation after the service returns a resolved location. Keep only centralized path confinement and explicit destructive-write confirmation; do not create multiple new policy layers.
- Delete all selected/active mismatch/handoff fields, actions, diagnostics, onboarding states and bootstrap/rescan response metadata, including HostProjectAlignment/buildLocalSelectionMismatch and resident selected/active scope fallback.
- Delete old daemon MCP bridge residue. Preserve only a Plugin-owned embedded execution path if it has a real current caller; remove obsolete bridge adapters/comments/tests and all Alembic main/resident routing from public query execution.
- Delete alembic_task completely: retired intercepts, error taxonomy entries used only by it, ServiceRequestBoundary special cases, legacy policy/classification residues, prompt/docs/catalog/test references and compatibility tests. Do not replace it with another hidden route.
- Remove every MCP-consumer Git revision/checkpoint gate and public field: status/search/get/expand/graph/recipe-map/prime/guard must not read HEAD/checkpoint posture, attach gitDiffCheckpoint/sourceRevisionManifest, downgrade/suppress results, clear materials, remember manifests or demand rescan because commits differ. Keep Git diff/checkpoint code only where it is actually consumed by internal Recipe evolution/incremental maintenance; prove no public query consumer remains.
- Remove all Prime intent admission: obsolete intent rejection, taskAction/requirementGoal/locator-facet requirements, automation-envelope/sourceRefs requirement, intentKind non-code blocking, low-information intent suppression and related schemas/reasons/tests. Prime consumes optional query/context solely to retrieve and present project knowledge; absence of intent is not a blocker.
- Query tools may validate only executable input shape and use the centralized project location. Remove external readiness/trust/freshness checks that suppress otherwise queryable Recipe/Guard results. Recipe lifecycle/content/schema/sourceRefs and tool-local matching/ranking/display facts remain data semantics, not host-level availability gates.
- Remove Admin/tier/role visibility machinery (ALEMBIC_MCP_TIER, ALEMBIC_CODEX_ENABLE_ADMIN, effective tier, admin diagnostics/preflight/catalog tier filtering). Expose one ordinary tool surface. Keep or delete knowledge lifecycle only by real current capability, but it must not require an Admin role.
- Review the Plugin write-source normalizer. The current caller is the Plugin host-agent submission route; remove duplicate legacy source normalization and caller spoofable source overrides, using one canonical actual producer source at the write boundary or the existing Core canonical helper. It must not affect read/query behavior.
- Remove associated obsolete schemas, projections, descriptions, skills/prompts, tests and dead code; do not leave comments asserting deleted architecture.

Explicit non-goals:
- No Test window, no new synthetic environment, no edits to real BiliDili/AlembicWorkspace knowledge data.
- No Alembic main/Core/Agent/Dashboard product edits.
- Do not remove centralized projectRoot/dataRoot physical confinement, request input schema needed for execution, Guard explicit code/files scope, Recipe-owned lifecycle/schema/content rules, destructive rebuild/cleanup confirmation, or write-zone/path safety merely because host-level gates are removed.
- Do not create a universal policy framework, replacement state machine, hidden fallback, automatic bootstrap/rescan, or new status vocabulary.

Required implementation order:
1. Inventory real current callers and add failing regressions for project-location independence, always-visible/no-KB behavior, no revision gate, intent-free Prime, one public tier and complete alembic_task absence.
2. Land the single project-location service and migrate all consumers.
3. Remove main/resident/daemon/visibility/state/revision/intent/admin/legacy-source chains.
4. Remove dead schemas/projections/tests/docs and run a production import scan.
5. Commit the complete AlembicPlugin change.

Required validation and evidence:
- Focused before/after regressions proving foreign selected/active/runtime-control files cannot change any MCP identity or response; no knowledge returns tool-native empty/not-found; an advanced/dirty HEAD does not change public knowledge results; Prime works with minimal/no intent frame; all tools list without role/tier env; alembic_task and old bridge symbols have zero live/public callers.
- Request-root/ghost isolation tests proving AlembicWorkspace and BiliDili projectRoot values resolve distinct projectId/dataRoot/databasePath using the single service, with zero cross-project fallback.
- Exact full repository gates: npm run test:unit, npm run check, npm run build, npm run verify:codex-runtime-package, npm run verify:plugin-distribution, npm run verify:codex-plugin (or report exact unavailable script name as a blocker, never silently skip).
- Return touched files/symbols, deleted-chain inventory, production import/caller scans, focused/full raw summaries, representative public JSON for no-KB and knowledge-present cases, final commit hash and two-stage self-review.
- Completion leads to controller diff/raw-evidence review, local Plugin refresh and controller-owned direct real five-tool calls against explicit AlembicWorkspace and BiliDili projectRoot values after restart. No Test dispatch.

## Target tasks

- `p1-plugin-independent-mcp-project-location-cleanup-t1` -> window `AlembicPlugin` (pending)

## Sub-directories

- [task-packages/](task-packages/)
- `target-results/` — _(not present)_
- `transition-candidates/` — _(not present)_
- `intake/` — _(not present)_
- `test-cards/` — _(not present)_
- `evidence/` — _(not present)_
- `focus/` — _(not present)_
