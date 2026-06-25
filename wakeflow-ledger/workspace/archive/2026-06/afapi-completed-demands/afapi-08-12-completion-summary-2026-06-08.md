# AFAPI 08-12 Completed Demands Archive

Archive Date: 2026-06-08
Maintained Window: AlembicWorkspace controller
Source: `.wakeflow-active/current/`

This archive summarizes AFAPI 08-12 completed Wakeflow demands after controller
acceptance. It preserves demand-level conclusions and evidence pointers without
copying local delivery runtime files, thread ids, or `.wakeflow-local`
transport records.

## Summary

| Demand | Final State | Revision | Controller Conclusion |
| --- | --- | ---: | --- |
| AFAPI-REQ-08-DECISION-REGISTER-RECORD | completed | 20 | Durable Decision Register producer and Plugin `alembic_decision_record` success/blocked behavior accepted; hidden legacy `alembic_task record_decision` fails closed and writes no Plugin-local decision. |
| AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP | completed | 10 | Active host-facing docs, tools/list, shipped skills, injectable skills, and runtime copies no longer advertise legacy `alembic_task` operation flow as primary guidance. |
| AFAPI-REQ-10-EVALUATION-SMOKE-CROSS-HOST-READINESS | completed | 10 | Public tools evaluation matrix and cross-host P0 schema/prompt/no-schema-fork readiness accepted; actual Claude Code/generic-host runtime remains outside this completion claim. |
| AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI | completed | 10 | Dashboard read-only runtime diagnostics UI hardening accepted; sourceOfTruth-present details are visible and sourceOfTruth-missing remains unavailable/no-fake. |
| AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION | completed | 6 | No Core schema promotion now; existing Core deterministic contracts are sufficient and Plugin public schemas remain Plugin-owned. |

## Evidence Map

| Demand | Runtime State Root | Primary Evidence |
| --- | --- | --- |
| AFAPI-REQ-08-DECISION-REGISTER-RECORD | `.wakeflow-active/current/afapi-req-08-decision-register-record/wakeflow-state.json` | P2 durable producer evidence, P3 Plugin success evidence, P4 legacy cleanup evidence, P5 cache reprobe evidence, controller readback `AlembicPlugin/scratch/afapi-req-08-p5-controller-readback.json`. |
| AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP | `.wakeflow-active/current/afapi-req-09-skill-tool-prompt-automation-guide-cleanup/wakeflow-state.json` | Stage 0 guidance facts, P2 active-surface regression evidence, `AgentPublicSkillLegacyCleanup` coverage, public-tools readback. |
| AFAPI-REQ-10-EVALUATION-SMOKE-CROSS-HOST-READINESS | `.wakeflow-active/current/afapi-req-10-evaluation-smoke-cross-host-readiness/wakeflow-state.json` | P1 code facts, P2 probe matrix evidence, `AgentPublicToolsEvaluation` tests, public-tools ok=true readback, source stdio smoke. |
| AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI | `.wakeflow-active/current/afapi-req-11-dashboard-runtime-diagnostics-ui/wakeflow-state.json` | P1 code facts, P2 hardening evidence, Dashboard browser text evidence, normalizer/model tests, lint/typecheck/build. |
| AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION | `.wakeflow-active/current/afapi-req-12-core-shared-schema-promotion-decision/wakeflow-state.json` | AlembicCore code facts, Core boundary tests, Plugin public schema facts, outside-Plugin consumer scan, Core/Plugin/Alembic build validation. |

## Residual Non-Archived Hold

`AFAPI-REQ-08-PLUGIN-RUNTIME-SNAPSHOT-RELEASE-JUDGMENT` remains on the active
TODO board with status `release-path-hold`. It is intentionally not archived
because the release/runtime snapshot commit or discard decision is still outside
the completed AFAPI demand archive.
