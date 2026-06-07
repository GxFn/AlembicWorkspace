# Plugin Agent-Facing Public API Redesign Remaining Wakeflow Demands

Status: rebuilt / remaining-only / no active state root
Maintained Window: AlembicWorkspace
Date: 2026-06-07

## Controller Judgment

The old AFAPI audit shows AFAPI 01-07 completed with accepted target tasks. AFAPI 08 reached old review-ready code-fact evidence but was not accepted or completed as a full demand. AFAPI 09-12 were not claimed.

This directory therefore rebuilds only AFAPI 08-12 for the new Wakeflow control surface. These files are new demand definitions, not copied old controller state and not dispatch packets.

## Entry Points

- Remaining sequence manifest: [afapi-remaining-demand-sequence-2026-06-07.json](afapi-remaining-demand-sequence-2026-06-07.json)
- Active queue projection: [../../../.workspace-active/workspace/current/global-todo-board.md](../../../.workspace-active/workspace/current/global-todo-board.md)
- Current controller status: [../../../.workspace-active/workspace/current/workspace-current-status.md](../../../.workspace-active/workspace/current/workspace-current-status.md)

## Completed Upstream Demands

| Original Order | Demand | Status Used Here |
| --- | --- | --- |
| 01 | AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME - AFAPI 01 Runtime Identity / Multi-project MCP Runtime | completed upstream; not recreated |
| 02 | AFAPI-REQ-02-AGENT-FACING-PUBLIC-API-CONTRACT - AFAPI 02 Agent-Facing Public API Contract | completed upstream; not recreated |
| 03 | AFAPI-REQ-03-INTENT-STRUCTURED-LOCAL-VECTOR - AFAPI 03 Intent Structured Local-Vector Entry | completed upstream; not recreated |
| 04 | AFAPI-REQ-04-PRIME-INDEPENDENT-KNOWLEDGE-ENTRY - AFAPI 04 Prime Independent Knowledge Entry | completed upstream; not recreated |
| 05 | AFAPI-REQ-05-PRIME-TRUST-RECEIPT - AFAPI 05 Prime Trust Receipt | completed upstream; not recreated |
| 06 | AFAPI-REQ-06-WORK-EVIDENCE-LIFECYCLE - AFAPI 06 Work Evidence Lifecycle | completed upstream; not recreated |
| 07 | AFAPI-REQ-07-SCOPED-CODE-GUARD - AFAPI 07 Scoped Code Guard | completed upstream; not recreated |

## Rebuilt Remaining Demands

| New Sequence | Original Order | Demand | Target Window | Document |
| --- | --- | --- | --- | --- |
| 1 | 08 | AFAPI-REQ-08-DECISION-REGISTER-RECORD - AFAPI 08 Decision Register / Decision Record | AlembicPlugin | [document](afapi-08-decision-register-record-recreated-2026-06-07.md) |
| 2 | 09 | AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP - AFAPI 09 Skill / Tool Prompt / Automation Guide Cleanup | AlembicPlugin | [document](afapi-09-skill-tool-prompt-automation-guide-cleanup-recreated-2026-06-07.md) |
| 3 | 10 | AFAPI-REQ-10-EVALUATION-SMOKE-CROSS-HOST-READINESS - AFAPI 10 Evaluation / Smoke / Cross-host Readiness | AlembicPlugin | [document](afapi-10-evaluation-smoke-cross-host-readiness-recreated-2026-06-07.md) |
| 4 | 11 | AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI - AFAPI 11 Dashboard Runtime Diagnostics UI | AlembicDashboard | [document](afapi-11-dashboard-runtime-diagnostics-ui-recreated-2026-06-07.md) |
| 5 | 12 | AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION - AFAPI 12 Core Shared Schema Promotion Decision | AlembicCore | [document](afapi-12-core-shared-schema-promotion-decision-recreated-2026-06-07.md) |

## Wakeflow Rules

- Claim at most one demand at a time from the sequence manifest.
- Claiming creates the state root and initial task package; it still does not send direct-thread delivery.
- Direct-thread delivery requires the claimed state root, a target task, registered thread id, and controller judgment.
- Old AFAPI evidence can be referenced during Stage 0, but new acceptance belongs to the new Wakeflow state root.
