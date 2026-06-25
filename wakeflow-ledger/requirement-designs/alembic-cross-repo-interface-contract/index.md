# Alembic Cross-Repository Interface Contract Demand Sequence

Status: completed through D32 / independent demand definitions archived
Maintained Window: AlembicWorkspace
Date: 2026-06-09

## Controller Judgment

The original Design handoff confirmed the full five-repository interface
contract goal. The user then confirmed unattended automation mode and clarified
that each item can be an independent demand as long as the order is clear.
On 2026-06-09 the user confirmed all D0-D7 global decisions, including
deferring version/evolution strategy, preserving full functionality, rejecting
thin minimum implementations, applying field exposure controls, using explicit
capability discovery, restricting compatibility to real current consumers, and
allowing unattended continuation unless a stop condition is triggered.

This directory therefore defines an ordered independent demand sequence. These
files are demand definitions, not dispatch packets. State roots are created one
at a time when total control claims the next demand.

## Entry Points

- Sequence manifest: [alembic-interface-contract-demand-sequence-2026-06-09.json](alembic-interface-contract-demand-sequence-2026-06-09.json)
- Deep optimization continuation manifest: [alembic-interface-contract-deep-optimization-demand-sequence-2026-06-10.json](alembic-interface-contract-deep-optimization-demand-sequence-2026-06-10.json)
- Post-D14 long-horizon interface governance manifest: [alembic-interface-contract-post-deep-interface-audit-sequence-2026-06-10.json](alembic-interface-contract-post-deep-interface-audit-sequence-2026-06-10.json)
- Post-D14 real-code analysis and landing-plan basis: [post-d14-interface-governance-real-code-analysis-2026-06-10.md](post-d14-interface-governance-real-code-analysis-2026-06-10.md)
- Design requirement: [../../../Design/docs/current/alembic-cross-repo-interface-contract-requirement-design-2026-06-09.md](../../../Design/docs/current/alembic-cross-repo-interface-contract-requirement-design-2026-06-09.md)
- Design handoff: [../../../Design/docs/current/alembic-cross-repo-interface-contract-workspace-handoff-2026-06-09.md](../../../Design/docs/current/alembic-cross-repo-interface-contract-workspace-handoff-2026-06-09.md)
- Current controller status: [../../../.wakeflow-active/current/workspace-current-status.md](../../../.wakeflow-active/current/workspace-current-status.md)

## Controller Artifacts

- D0 accepted inventory evidence: [../../../.wakeflow-active/current/alembic-interface-contract-d0-inventory/evidence/contract-inventory-2026-06-09.md](../../../.wakeflow-active/current/alembic-interface-contract-d0-inventory/evidence/contract-inventory-2026-06-09.md)
- D1 contract registry: [contract-registry-2026-06-09.json](contract-registry-2026-06-09.json)
- D1 source-of-truth ADR: [source-of-truth-adr-2026-06-09.md](source-of-truth-adr-2026-06-09.md)
- Final governance acceptance archive: [final-governance-acceptance-archive-2026-06-10.md](final-governance-acceptance-archive-2026-06-10.md)

## Independent Demand Order

| Order | Demand | Primary Window | Document |
| --- | --- | --- | --- |
| 1 | `alembic-interface-contract-d0-inventory-2026-06-09` - Full Cross-Repo Contract Inventory | AlembicWorkspace | [document](d0-inventory-2026-06-09.md) |
| 2 | `alembic-interface-contract-d1-registry-adr-2026-06-09` - Contract Registry And Source-Of-Truth ADR | AlembicWorkspace | [document](d1-registry-adr-2026-06-09.md) |
| 3 | `alembic-interface-contract-d2-core-spine-2026-06-09` - AlembicCore Shared Deterministic Contract Spine | AlembicCore | [document](d2-core-spine-2026-06-09.md) |
| 4 | `alembic-interface-contract-d3-alembic-provider-2026-06-09` - Alembic HTTP, Runtime, And Event Provider Contracts | Alembic | [document](d3-alembic-provider-2026-06-09.md) |
| 5 | `alembic-interface-contract-d4-plugin-host-mcp-2026-06-09` - AlembicPlugin Host, MCP, And Resident-Service Contracts | AlembicPlugin | [document](d4-plugin-host-mcp-2026-06-09.md) |
| 6 | `alembic-interface-contract-d5-agent-runtime-tools-2026-06-09` - AlembicAgent Runtime, Tool, And Provider Contracts | AlembicAgent | [document](d5-agent-runtime-tools-2026-06-09.md) |
| 7 | `alembic-interface-contract-d6-dashboard-consumer-2026-06-09` - AlembicDashboard Consumer Contract And View-Model Cleanup | AlembicDashboard | [document](d6-dashboard-consumer-2026-06-09.md) |
| 8 | `alembic-interface-contract-d7-acceptance-cleanup-2026-06-09` - Cross-Repo Acceptance, Drift Gates, And Legacy Cleanup | AlembicWorkspace | [document](d7-acceptance-cleanup-2026-06-09.md) |
| 9 | `alembic-interface-contract-d8-deep-optimization-control-plane-2026-06-10` - Deep Optimization Control Plane | AlembicWorkspace | [document](d8-deep-optimization-control-plane-2026-06-10.md) |
| 10 | `alembic-interface-contract-d9-core-legacy-contract-convergence-2026-06-10` - AlembicCore Legacy Contract Convergence | AlembicCore | [document](d9-core-legacy-contract-convergence-2026-06-10.md) |
| 11 | `alembic-interface-contract-d10-agent-runtime-legacy-rewrite-2026-06-10` - AlembicAgent Runtime Legacy Rewrite | AlembicAgent | [document](d10-agent-runtime-legacy-rewrite-2026-06-10.md) |
| 12 | `alembic-interface-contract-d11-alembic-runtime-provider-legacy-rewrite-2026-06-10` - Alembic Runtime And Provider Legacy Rewrite | Alembic | [document](d11-alembic-runtime-provider-legacy-rewrite-2026-06-10.md) |
| 13 | `alembic-interface-contract-d12-plugin-mcp-host-legacy-rewrite-2026-06-10` - AlembicPlugin MCP And Host Legacy Rewrite | AlembicPlugin | [document](d12-plugin-mcp-host-legacy-rewrite-2026-06-10.md) |
| 14 | `alembic-interface-contract-d13-dashboard-consumer-legacy-rewrite-2026-06-10` - AlembicDashboard Consumer Legacy Rewrite | AlembicDashboard | [document](d13-dashboard-consumer-legacy-rewrite-2026-06-10.md) |
| 15 | `alembic-interface-contract-d14-cross-repo-legacy-removal-acceptance-2026-06-10` - Cross-Repo Legacy Removal And Deep Acceptance | AlembicWorkspace | [document](d14-cross-repo-legacy-removal-acceptance-2026-06-10.md) |
| 16 | `alembic-interface-contract-d15-post-deep-current-state-responsibility-map-2026-06-10` - Post-Deep Current-State Responsibility Map | AlembicWorkspace | [document](d15-post-deep-current-state-responsibility-map-2026-06-10.md) |
| 17 | `alembic-interface-contract-d16-interface-reasonability-review-2026-06-10` - Interface Reasonability Review | AlembicWorkspace | [document](d16-interface-reasonability-review-2026-06-10.md) |
| 18 | `alembic-interface-contract-d17-parameter-data-content-audit-2026-06-10` - Parameter And Data Content Audit | AlembicWorkspace | [document](d17-parameter-data-content-audit-2026-06-10.md) |
| 19 | `alembic-interface-contract-d18-post-audit-decision-register-and-slicing-2026-06-10` - Post-Audit Decision Register And Slicing | AlembicWorkspace | [document](d18-post-audit-decision-register-and-slicing-2026-06-10.md) |
| 20 | `alembic-interface-contract-d19-core-schema-closure-and-taxonomy-2026-06-10` - Core Schema Closure And Field Taxonomy | AlembicCore | [document](d19-core-schema-closure-and-taxonomy-2026-06-10.md) |
| 21 | `alembic-interface-contract-d20-alembic-provider-content-normalization-2026-06-10` - Alembic Provider Content Normalization | Alembic | [document](d20-alembic-provider-content-normalization-2026-06-10.md) |
| 22 | `alembic-interface-contract-d21-dashboard-consumer-adapter-cleanup-2026-06-10` - Dashboard Consumer Adapter Cleanup | AlembicDashboard | [document](d21-dashboard-consumer-adapter-cleanup-2026-06-10.md) |
| 23 | `alembic-interface-contract-d22-plugin-mcp-per-tool-output-cleanup-2026-06-10` - Plugin MCP Per-Tool Output Cleanup | AlembicPlugin | [document](d22-plugin-mcp-per-tool-output-cleanup-2026-06-10.md) |
| 24 | `alembic-interface-contract-d23-agent-result-diagnostic-content-cleanup-2026-06-10` - Agent Result Diagnostic Content Cleanup | AlembicAgent | [document](d23-agent-result-diagnostic-content-cleanup-2026-06-10.md) |
| 25 | `alembic-interface-contract-d24-consumer-driven-fixture-replay-2026-06-10` - Consumer-Driven Fixture Replay | AlembicWorkspace | [document](d24-consumer-driven-fixture-replay-2026-06-10.md) |
| 26 | `alembic-interface-contract-d25-error-problem-taxonomy-2026-06-10` - Error Problem Taxonomy | AlembicWorkspace | [document](d25-error-problem-taxonomy-2026-06-10.md) |
| 27 | `alembic-interface-contract-d26-capability-discovery-operation-inventory-2026-06-10` - Capability Discovery And Operation Inventory | AlembicWorkspace | [document](d26-capability-discovery-operation-inventory-2026-06-10.md) |
| 28 | `alembic-interface-contract-d27-diagnostics-refs-observability-split-2026-06-10` - Diagnostics Refs Observability Split | AlembicWorkspace | [document](d27-diagnostics-refs-observability-split-2026-06-10.md) |
| 29 | `alembic-interface-contract-d28-sensitive-private-field-quarantine-2026-06-10` - Sensitive Private Field Quarantine | AlembicWorkspace | [document](d28-sensitive-private-field-quarantine-2026-06-10.md) |
| 30 | `alembic-interface-contract-d29-compatibility-deletion-wave-2026-06-10` - Compatibility Deletion Wave | AlembicWorkspace | [document](d29-compatibility-deletion-wave-2026-06-10.md) |
| 31 | `alembic-interface-contract-d30-generated-contract-drift-gates-2026-06-10` - Generated Contract Drift Gates | AlembicWorkspace | [document](d30-generated-contract-drift-gates-2026-06-10.md) |
| 32 | `alembic-interface-contract-d31-runtime-dashboard-scenario-validation-2026-06-10` - Runtime Dashboard Scenario Validation | AlembicWorkspace | [document](d31-runtime-dashboard-scenario-validation-2026-06-10.md) |
| 33 | `alembic-interface-contract-d32-final-governance-acceptance-archive-2026-06-10` - Final Governance Acceptance And Archive | AlembicWorkspace | [document](d32-final-governance-acceptance-archive-2026-06-10.md) |

## Deep Optimization Continuation

D8-D14 continue the full `alembic-interface-contract` demand group after the
D0-D7 contract foundation and acceptance path. They are not D0-only follow-ups.
They are a second-stage automation sequence for rewriting old interface logic
according to the accepted producer-owned contract model.

Claiming guidance:

- Do not claim D8-D14 as a bypass for an open D7 blocker.
- Preferred path: finish or explicitly block D7 with controller evidence, then
  claim D8 from the continuation manifest.
- If D7 exposes a blocker that is itself part of the legacy-interface rewrite
  chain, carry it into D8/D11 as a named input while preserving D7 evidence.
- D8 must produce a second-stage execution matrix before D9-D13 product rewrite
  demands are dispatched.
- D14 is the final deep-optimization acceptance demand and must review raw
  evidence from D8-D13.

## Post-D14 Long-Horizon Interface Governance

D15-D32 run after D8-D14 are complete. They do not replace the deep rewrite
sequence and should not be used to bypass D14 acceptance. Their purpose is to
continue unattended optimization for a longer horizon: current-state sorting,
responsibility split, interface reasonability, parameter and returned-data
content analysis, Core/provider/Dashboard/Plugin/Agent implementation waves,
consumer-driven fixture replay, error/capability/diagnostic/sensitive-data
governance, compatibility deletion, drift gates, real runtime validation, and
final acceptance/archive.

The post-D14 design basis now contains a concrete P01-P15 problem map from
real code scans and external protocol/API/security/contract-testing practice.
Later demands must consume that map directly: each applicable problem must be
fixed, preserved with owner and consumer, deferred by user/controller decision,
or blocked with evidence. Do not add additional demand numbers or documents
merely to make the queue look longer.

Claiming guidance:

- Claim D15 only after D14 completes, or after the controller explicitly blocks
  D14 and the user asks for post-D14 audit despite that blocker.
- D15 builds the current responsibility map.
- D16 judges interface reasonability.
- D17 audits parameter and returned-data content.
- D18 consolidates decisions and implementation slices.
- D19-D23 perform the first product implementation wave by repository owner.
- D24-D30 add consumer proof, error taxonomy, capability inventory,
  diagnostics/ref routing, sensitive-data quarantine, compatibility deletion,
  and drift gates.
- D31 validates real runtime, Dashboard, and MCP scenarios.
- D32 reviews raw evidence, accepts or blocks, rolls TODO/backlog, and archives.

Completion note: D15-D32 were accepted by the controller on 2026-06-10. The
final acceptance archive records the P01-P15 disposition, reviewed product
heads, preserved compatibility paths, deletion decisions, and residual
out-of-scope follow-ups.

## Wakeflow Rules

- Claim at most one demand at a time from the sequence manifest.
- Claiming creates the state root and initial task package; it still does not
  send direct-thread delivery.
- The user has confirmed the D0-D7 global decisions. Total control may proceed
  unattended through the sequence until a listed stop condition is hit.
- This sequence is optimization, not feature reduction. Existing functional
  behavior must be preserved unless the user explicitly approves removal or
  downgrade.
- Do not accept thin minimum implementations, placeholder adapters, docs-only
  shells, static mocks, narrow demos, or happy-path-only evidence as completion.
- Versioning, deprecation windows, remove-after dates, breaking-change policy,
  and long-term evolution strategy are intentionally deferred.
- D0 classifies every interface by primary `functionClass`.
- D1 maps each `functionClass` to source-of-truth, handling rule, validation
  family, and deletion rule.
- D0/D1 also record capability coverage, capability discovery, error kind,
  exposure class, artifact policy, fixture policy, drift gate, current
  compatibility owner, and observability keys.
- D0 and D1 are controller-owned evidence and routing work.
- D2-D6 are product-window demands and must read the accepted D0/D1 evidence.
- D4 and D6 wait for D3 provider evidence. D5 can run after D1/D2, but any
  Alembic consumer integration waits for D5 evidence.
- D7 is the final acceptance demand and must review raw evidence from all
  previous demands before completion.
- Test is not a default demand. Use Test only if D7 needs independent real
  runtime observation after product self-checks.
- D8-D14 are continuation demands for deep old-interface logic rewrite across
  the full `alembic-interface-contract` group, not only D0 inventory.
- D15-D32 are the post-D14 long-horizon governance demands for current-state
  sorting, responsibility split, semantic clarity, parameter/data correction,
  product cleanup, consumer proof, deletion, drift gates, real validation, and
  final archive.
