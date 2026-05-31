# Package T Contract Unification Source/Unit Repair

Run ID: `pcv-20260530-1515-alembic-cold-start`
Date: `2026-05-31`
Status: `repaired(scope=source-unit-fixture); blocked(scope=same-input-live-rerun)`

## Goal

Repair the Package S design root cause without another temporary Producer patch:

1. Preserve stage capability action constraints through provider schema projection.
2. Use the same action contract for runtime allowlist blocking.
3. Preserve submit payload completeness semantics while keeping provider history compact.
4. Provide a compact runtime submit ledger for Producer final summaries.

## Source Changes

Owner repo: `AlembicAgent`

Changed files:

- `src/tools/v2/adapter/V2CapabilityCatalog.ts`
- `src/agent/runtime/AgentRuntime.ts`
- `src/agent/runtime/LoopContext.ts`
- `src/agent/runtime/AgentRuntimeTypes.ts`
- `src/agent/runtime/DiagnosticsCollector.ts`
- `src/agent/runtime/ToolExecutionPipeline.ts`
- `src/agent/context/ContextWindow.ts`
- `src/agent/runtime/LLMInputAssembly.ts`
- `test/tool-v2-contract.test.ts`
- `test/llm-input-layering.test.ts`
- `test/ContextWindow.test.ts`
- `test/ExplorationStrategies.test.ts`

Implemented outcomes:

- `AgentRuntime` now collects a `RuntimeToolContract` with both tool ids and action allowlists.
- V2 capability `allowedTools` now reaches `V2CapabilityCatalog.toMixedSchemasForActions()` / `toToolSchemasForActions()`.
- Provider-visible Producer schema now projects `knowledge.action.enum=["submit"]`, `meta.action.enum=["review"]`, and `memory.action.enum=["recall"]`; broad `knowledge.detail/manage/search` and `meta.tools/plan` are not exposed by the schema for `knowledge_production`.
- Direct `note_finding` schema is only exposed when `memory.note_finding` is allowed. Producer has `memory.recall`, so it no longer gets accidental direct `note_finding`.
- `ToolExecutionPipeline.allowlistGate` now checks action-level allowlists before tool execution, so runtime blocking uses the same contract as provider schema.
- `ContextWindow` compacted `knowledge.submit` history now includes a small `payloadSummary` with `requiredFieldsComplete`, `sourceCount`, omitted field names, and `contentOmittedForProviderHistory=true`.
- `submitDedup` records a compact `_producerSubmitLedger` after successful Producer `knowledge.submit` creation.
- `LLMInputAssembly` injects `producerSubmitLedger` into the runtime input layer so final summaries can treat `payloadStored` and `requiredFieldsComplete` as authoritative runtime facts instead of inferring from compacted tool-call args.
- `DiagnosticsCollector` records `allowedToolActions` alongside `allowedToolIds`.

## Verification

Commands run in `../AlembicAgent`:

| Command | Result | Coverage |
| --- | --- | --- |
| `npm test -- test/tool-v2-contract.test.ts test/llm-input-layering.test.ts test/ContextWindow.test.ts test/ExplorationStrategies.test.ts` | pass; 4 files, 45 tests | V2 action schema projection, Producer schema contract, compact payload summary, Producer submit ledger, action-level runtime gate. |
| `npm run build` | pass | TypeScript compile. |
| `npm run lint` | pass | Biome checks 246 files. |
| `npm test` | pass; 28 files, 177 tests | Full Agent suite. |
| `npm run lint:core-import-boundary` | pass | Core import boundary scanned 246 files and 48 imports. |
| `git diff --check` | pass | No whitespace errors. |

## PCVM Reading

Package T repairs the Package S design root causes at source/unit level:

- The provider no longer receives broad actions for restricted V2 capabilities.
- Runtime action blocking and provider schema are driven by the same capability action contract.
- Compact submit history no longer erases payload completeness semantics.
- Producer final summaries now have an authoritative compact submit ledger.

This is not live evidence. The next blocker is a same-input live rerun in AlembicTest to verify that Package S's retained invalid `knowledge.detail/manage` calls and final-summary partial-field note disappear under the real provider route.

Do not reopen SourceRef. Do not mix exact-code snippet validation into the Package T live gate unless the user expands scope; that remains a separate quality-contract issue.
