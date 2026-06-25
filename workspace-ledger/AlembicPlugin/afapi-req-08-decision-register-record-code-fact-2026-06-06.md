# AFAPI-REQ-08 Decision Register Record Code Fact - AlembicPlugin

- Date: 2026-06-06
- Window: AlembicPlugin
- Task: AFAPI-REQ-08-DECISION-REGISTER-RECORD-CODE-FACT-T1
- Dispatch group: AFAPI-REQ-08-DECISION-REGISTER-RECORD-GROUP
- State root: `codex-control-workspace/.wakeflow-active/current/afapi-req-08-decision-register-record`
- Scope: Stage 0 read-only code fact for the AlembicPlugin host-facing consumer path.

## Window Boundary

AlembicPlugin owns the Codex MCP, Skill, channel / marketplace, plugin runtime, installation verification, and Codex host adaptation surfaces. This pass did not claim Alembic durable producer ownership, did not implement product changes, did not refresh runtime bundles, and did not perform controller acceptance.

## Code Facts

1. `alembic_decision_record` is present as a public host-facing MCP tool. Its input schema supports `create`, `update`, `revoke`, `delete`, `read`, and `list`; it exposes `decisionRef`, `intentRef`, `workRef`, title/description/rationale/tags/evidence refs, `includeDeleted`, `limit`, `sessionId`, and public statuses `active`, `revoked`, `deleted`, and `all`. It does not expose a first-class public `superseded` status.

2. The handler is wired directly through the MCP server and public tool contract. The public description states that confirmed user decisions are recorded in Alembic durable Decision Register when available, and that Plugin must not create Plugin-local fake decisions or treat tentative suggestions as confirmed decisions.

3. The handler performs local scope validation before attempting persistence: non-create/list actions require `decisionRef`; create requires a title or description; update requires at least one mutable decision field, tag/evidence change, or intent/work ref. Failed validation returns a blocker rather than attempting synthetic persistence.

4. The Plugin consumer path resolves a resident Decision Register client, preferring the split `residentDecisionRegisterClient` and falling back to the deprecated resident service facade for compatibility. If no resident route is available, it returns `decision-register-unavailable`; if route capability is incompatible, it returns `decision-register-capability-mismatch`. In both cases `durablePersistence.available` remains false and no local fake decision is emitted.

5. Successful resident calls return `success=true`, `result.status=ready`, `decisionRef`, detail refs, decision or decision list payloads, count, and durable persistence metadata identifying the Alembic-owned Decision Register route.

6. The resident client requires a local Alembic resident daemon and token, probes `/api/v1/decision-register/capability`, verifies `owner=alembic`, `route=decision-register`, `available=true`, and action lifecycle compatibility, then maps tool actions to HTTP methods and paths:
   - create: `POST /api/v1/decision-register`
   - update: `PATCH /api/v1/decision-register/:id`
   - revoke: `POST /api/v1/decision-register/:id/revoke`
   - delete: `DELETE /api/v1/decision-register/:id`
   - read: `GET /api/v1/decision-register/:id`
   - list: `GET /api/v1/decision-register`

7. The resident list/read query path forwards `includeDeleted`, bounded `limit`, `sessionId`, and `status`. Mutating requests include project scope, session, detail refs, source refs, intent/work refs, tags, rationale, and host metadata.

8. Plugin Prime/search consumer tests show Decision Register metadata is consumed as active/effective-only knowledge by default: accepted decision refs are surfaced, revoked/deleted statuses are listed as excluded, audit exclusions are counted separately, and vector admission is accepted-only. This is consumer evidence only; durable store production remains Alembic-owned.

9. The embedded runtime dist and packaged Alembic skill already mirror the same `alembic_decision_record` surface and route wording at the current embedded runtime commit.

## Primary Evidence

- `lib/shared/schemas/mcp-tools.ts:251` defines `DecisionRecordInput` with action, refs, list/read controls, and status enum.
- `lib/codex/mcp/McpServer.ts:560` wires `alembic_decision_record` to `decisionRecordHandler`.
- `lib/codex/mcp/public-tools/descriptions.ts:66` describes durable Alembic Decision Register behavior and the confirmed-decision boundary.
- `lib/codex/mcp/public-tools/contract.ts` includes the tool name, decision-record action kind, and Decision Register blocker reason codes.
- `lib/codex/mcp/handlers/agent-public-tools.ts:959` implements `decisionRecordHandler`.
- `lib/codex/mcp/handlers/agent-public-tools.ts:1466` validates decision scope and builds the resident request.
- `lib/injection/modules/AppModule.ts:68` registers split resident capability clients, including the Decision Register client.
- `lib/service/resident/AlembicResidentCapabilityClients.ts:86` wraps the split resident Decision Register client.
- `lib/service/resident/AlembicResidentServiceClient.ts:285` defines Decision Register actions and statuses.
- `lib/service/resident/AlembicResidentServiceClient.ts:640` implements capability probing and Decision Register route calls.
- `lib/service/resident/AlembicResidentServiceClient.ts:923` enforces local resident daemon route availability.
- `lib/service/resident/AlembicResidentServiceClient.ts:2573` verifies Alembic-owned capability compatibility and builds HTTP method/path/query/body mapping.
- `test/unit/AgentPublicToolsActive.test.ts:1035` covers successful create through the resident route and durable persistence metadata.
- `test/unit/AgentPublicToolsActive.test.ts:1109` covers update, revoke, delete, read, and list action forwarding.
- `test/unit/AgentPublicToolsActive.test.ts:1204` covers resident route unavailable blockers.
- `test/unit/AgentPublicToolsActive.test.ts:1241` covers capability mismatch blockers.
- `test/unit/AgentPublicToolsEvaluation.test.ts` covers public tool evaluation behavior, including no fake local persistence on stale/blocked decision recording.
- `test/unit/PrimeSearchPipelineResidentSearch.test.ts` covers Decision Register metadata consumption in resident search, including accepted refs, audit exclusion count, active/effective-only lifecycle, and excluded revoked/deleted statuses.
- `test/unit/TaskPrimeKnowledgeMaterial.test.ts` covers Prime material trust posture around Decision Register knowledge.
- `plugins/alembic-codex/runtime/dist` and `plugins/alembic-codex/runtime/plugins/alembic-codex/skills/alembic/SKILL.md:32` mirror the current packaged runtime/tool wording.

## Verification

All commands were run inside `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin` unless noted.

- `npm run test:unit -- test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/AlembicResidentServiceClient.test.ts`
  - Passed: 5 test files, 45 tests.
- `npm run build:check`
  - Passed. The check used AlembicCore at `9e51506be3c9078e44643346fa4a7d4d1271e716`.
- `npm run verify:codex-plugin`
  - Passed.
- `git diff --check`
  - Passed.
- `git -C plugins/alembic-codex diff --check`
  - Passed.
- `git status --short`
  - Clean before ledger write.
- `git -C plugins/alembic-codex status --short`
  - Clean.

## Target Result And Controller Return

- `node scripts/controller-state.mjs import-target-result --state-root .wakeflow-active/current/afapi-req-08-decision-register-record ... --write --json`
  - Passed. Wrote `target-results/afapi-req-08-decision-register-record-code-fact-20260606.json`.
- `node scripts/codex-automation-loop.mjs submit-result --target-window AlembicPlugin --task-id AFAPI-REQ-08-DECISION-REGISTER-RECORD-CODE-FACT-T1 ... --write --json`
  - Passed. Wrote `.wakeflow-local/codex-automation-loop/target-results/AFAPI-REQ-08-DECISION-REGISTER-RECORD-GROUP__AlembicPlugin__AFAPI-REQ-08-DECISION-REGISTER-RECORD-CODE-FACT-T1.json`.
- `node scripts/controller-state.mjs reduce-results --state-root .wakeflow-active/current/afapi-req-08-decision-register-record --write --json`
  - Passed. State moved from `planned` to `review-ready`; candidate `tc-20260606122649-0003` was created for controller review.
- `node scripts/codex-automation-loop.mjs review-pack --state-root .wakeflow-active/current/afapi-req-08-decision-register-record --json`
  - Passed. `groupStatus=ready`, `decision=needs-controller-review`, evidence refs exist, and raw evidence pull is required by total control.
- `node scripts/codex-automation-loop.mjs build-controller-return --group AFAPI-REQ-08-DECISION-REGISTER-RECORD-GROUP ... --write --json`
  - Failed closed with `No matching dispatch packets found for review.` No controller-return delivery envelope was generated. This is a transport metadata limitation for this directly delivered task, not a product-code failure.

## Unmodified Scope

- No AlembicPlugin product source files were changed for this Stage 0 fact pass.
- No embedded runtime source or dist files were changed.
- No runtime bundle refresh, package publish, channel update, or marketplace install mutation was performed.
- No Alembic durable producer code was changed or claimed by this window.

## Commit / Revision Evidence

- AlembicPlugin repository HEAD during verification: `7bb10507196479883f877d7f008ae59e818d1d4b`.
- Embedded runtime subrepository HEAD during verification: `522033eb0b2eb623b719dae92f0204bd41cf31a1`.
- Stage 0 produced only this workspace ledger artifact.

## Risks And Next Suggestions

- Stage 0 is static/unit code fact evidence. It does not prove a live Alembic resident daemon Decision Register producer route in a real runtime session.
- `superseded` is not currently a first-class public Plugin status. Current public statuses are `active`, `revoked`, `deleted`, and `all`; replacement/supersession semantics would need an explicit schema, producer, and retrieval decision if required.
- Because T1 made no code changes, no runtime refresh was performed. Current runtime/package evidence shows the already-packaged surface mirrors the repository contract.
- Controller can accept this as Plugin consumer code fact evidence, then decide whether Alembic producer evidence is already sufficient or whether to request a separate Alembic producer/runtime acceptance pass before Plugin runtime acceptance.
