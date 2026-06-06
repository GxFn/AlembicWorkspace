# AFAPI REQ-04 Prime Independent Knowledge Entry Code Fact

- Date: 2026-06-06
- Window: AlembicPlugin
- Task: AFAPI-REQ-04-PRIME-INDEPENDENT-KNOWLEDGE-ENTRY-CODE-FACT-T1
- Dispatch group: AFAPI-REQ-04-PRIME-INDEPENDENT-KNOWLEDGE-ENTRY-GROUP
- Repository boundary: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- Product repository HEAD: `d5afb4e0628edd48decbf3f7ae3b6fd39291c2ab`
- Embedded runtime repository status: clean before/after; no runtime bundle commit created in this read-only pass.

## Scope

This dossier is Stage 0 code fact evidence for REQ-04. It only verifies the current AlembicPlugin implementation and packaged runtime shape for the independent `alembic_prime` knowledge-entry path. It does not implement product changes, edit runtime bundles, change submodules, or take Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest ownership.

## Sources Read

- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AGENTS.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/AGENTS.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/index.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/current/afapi-req-04-prime-independent-knowledge-entry/*`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/workspace-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-04-prime-independent-knowledge-entry-landing-2026-06-05.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicDesign/docs/current/plugin-prime-task-decoupling-requirement-design-2026-06-04.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/workspace-ledger/requirement-designs/plugin-intent-knowledge-route/plugin-intent-knowledge-route-requirement-design-2026-05-26.md`

## Current Code Facts

1. `alembic_prime` exists as an agent-facing public MCP tool, separate from the hidden legacy `alembic_task` compatibility surface.
   - Schema: `lib/shared/schemas/mcp-tools.ts` defines `PrimeInput` with `intentRef`, fallback `query`, fallback `recognizedIntent`, `sourceRefs`, `outputBudget`, and host/project context.
   - Tool declaration: `lib/codex/mcp/tools.ts` registers `alembic_prime` with `PrimeInput`; `alembic_task` is defined only in `LEGACY_DIRECT_CALL_COMPATIBILITY_TOOLS`.
   - Tool catalog: `lib/codex/mcp/PluginToolSurfaceCatalog.ts` maps `alembic_prime` to `McpServer.agent-public-tools` with `resident-project-scope` policy.
   - Router: `lib/codex/mcp/McpServer.ts` routes `alembic_prime` to `agentPublicToolHandlers.primeHandler`.

2. `primeHandler` consumes structured intent material rather than requiring `alembic_task(operation=prime)`.
   - If `intentRef` resolves to a local intent record, handler uses that record. Otherwise it builds intent intake from host-declared/fallback structured input.
   - Missing `intentRef` plus no fallback intent blocks with `missing-required-intent`.
   - `inputSource === "automation-envelope"` with no `sourceRefs` blocks with `missing-referenced-docs`.
   - Raw mechanical automation envelopes are skipped earlier by intent lifecycle policy and are not persisted as consumable local intent records.

3. The public prime output has explicit refs and trust material.
   - `primeHandler` creates a `primeRef`, carries `detailRefs`, and returns an agent public result envelope with `toolName: "alembic_prime"`.
   - Result envelopes include `legacyCompatibility.usesLegacyTaskHandler = false` through `createAgentPublicToolResultEnvelope`.
   - `data.primePackage.trustReceipt` contains receipt id, status, host response, and trust posture.
   - `data.primeKnowledgeMaterial` carries `acceptedKnowledge`, `acceptedGuards`, `trustPosture.receiptChecklist`, `antiEmptyReceipt`, `hostResponse`, `intentEvidence`, `retrievalConsumer`, and optional `primeInjectionPackage`.

4. Prime knowledge retrieval is implemented through `PrimeSearchPipeline`.
   - `lib/service/task/PrimeSearchPipeline.ts` builds multi-query retrieval from structured intent, host intent handoff, active file/module/language, and sourceRefs.
   - It combines Plugin baseline search (`auto`, `semantic`, `keyword`) with optional resident semantic search through `AlembicResidentServiceClient`.
   - Resident search metadata is preserved in `searchMeta.residentSearch`; resident `intentEvidence`, `retrievalConsumer`, and `primeInjectionPackage` are surfaced when provided.
   - When resident semantic search is unavailable, pipeline falls back to Plugin baseline search and records resident-unavailable metadata.

5. Resident PrimeInjectionPackage summary is compacted, not blindly dumped.
   - `lib/service/resident/AlembicResidentServiceClient.ts` compacts resident package fields including `intent`, `search`, `vector`, `relations`, `selectedKnowledge`, `omitted`, `trace`, `decisionRegister`, `feedback`, and `retrievalQuality`.
   - Arrays are capped and evidence strings are redacted/compacted.
   - Field-level package availability still depends on Alembic resident metadata. Plugin can pass through compact metadata, but it does not synthesize a full PrimeInjectionPackage when the producer does not provide one.

6. Trust receipt behavior is explicit for ready, empty, and degraded outcomes.
   - `lib/service/task/PrimeKnowledgeMaterial.ts` sets material status to `delivered`, `empty`, or `degraded`.
   - `trustPosture.receiptChecklist` splits material into `trusted-to-obey`, `trusted-to-use`, `context-only`, `requires-verification`, and `not-available-or-degraded`.
   - Empty/degraded outcomes add `not-available-or-degraded` guidance saying not to claim usable/trusted project knowledge.
   - `antiEmptyReceipt` forbids generic receipt slogans and requires the visible receipt to name actual trust layers.

7. Output budget exists for result summaries, while full data payload remains intentionally richer.
   - `buildResultSummary` caps `result.summary.compact` at `min(outputBudget.maxChars, 2000)` and records truncation metadata.
   - The MCP response `message` uses the compact summary plus trust posture checklist.
   - The structured `data` payload still includes `primeKnowledgeMaterial`, `knowledge`, `searchMeta`, `projectRuntime`, and retrieval metadata. A future output-governance pass should decide whether any host needs a smaller default data projection.

8. Legacy `alembic_task(operation=prime)` remains as hidden direct-call compatibility.
   - `lib/codex/mcp/handlers/task.ts` still routes `operation: "prime"` to a compatibility `_prime` path and builds `PrimeKnowledgeMaterial`.
   - Public shipped skills and tests state `alembic_task` is not advertised as a public workflow surface.
   - This residue is a cleanup / compatibility decision, not evidence that `alembic_prime` currently depends on the legacy task handler.

9. Packaged runtime mirrors the active implementation.
   - Runtime dist contains `plugins/alembic-codex/runtime/dist/lib/codex/mcp/handlers/agent-public-tools.js` with `alembic_prime`, `missing-referenced-docs`, `primeKnowledgeMaterial`, and compact trust output.
   - Runtime skills instruct `alembic_intent` + `alembic_prime` and warn against raw-prime automation/direct-thread envelopes.
   - Runtime dist still contains legacy hidden `alembic_task` compatibility code, matching source.

## Validation Commands

All commands were run from `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`.

```bash
rg -n "alembic_prime|primeHandler|PrimeSearchPipeline|PrimeKnowledgeMaterial|PrimeInput|PrimeInjectionPackage|trustPosture|receiptChecklist|outputBudget|missing-referenced-docs|knowledge-empty|resident-unavailable|legacyCompatibility|usesLegacyTaskHandler|primeRef" lib test scripts plugins/alembic-codex -g '*.ts' -g '*.mjs' -g '*.js' -g '*.json'
npm test -- test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts
npm test -- test/unit/AgentPublicSkillLegacyCleanup.test.ts
npm run build:check
npm run lint:repo-boundary
git diff --check
git -C plugins/alembic-codex diff --check
git status --short
git -C plugins/alembic-codex status --short
```

Verification result:

- Prime/public-tools targeted tests: 4 files passed, 32 tests passed.
- Skill legacy cleanup test: 1 file passed, 2 tests passed.
- `npm run build:check`: passed; core build used `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`.
- `npm run lint:repo-boundary`: passed; escape-hatch count 0 / 75.
- `git diff --check`: passed.
- `git -C plugins/alembic-codex diff --check`: passed.
- Product and embedded runtime git status remained clean before product edits. This dossier is the only intentional file addition in the workspace ledger.

## Stage 0 Judgment

The current AlembicPlugin code already has an independent public `alembic_prime` entrypoint. It consumes `intentRef` or structured fallback intent, blocks raw automation-envelope prime without `sourceRefs`, uses `PrimeSearchPipeline`, returns `primeRef` / `detailRefs`, and provides trust-labeled `PrimeKnowledgeMaterial`. The active public path does not depend on `alembic_task(operation=prime)` and public guidance no longer advertises the legacy operation.

The main unresolved area is not the existence of an independent entrypoint; it is field-level and runtime-acceptance convergence:

- Whether the public prime result should expose a smaller canonical `PrimeKnowledgePackage` projection in addition to the rich `primeKnowledgeMaterial`.
- Whether local fallback retrieval should synthesize a complete PrimeInjectionPackage-like structure when resident metadata is unavailable, or clearly report that only resident-provided packages have full lexical/vector/relations/selectedKnowledge/omitted/trace fields.
- Whether the full `data` payload should be budgeted or separated into detailRefs for hosts that cannot handle large MCP data payloads.
- Whether old `alembic_task(operation=prime)` code should be physically removed after cross-host compatibility acceptance confirms no real consumers still call it.

## Recommended Next Wave

1. Contract convergence: define the canonical `alembic_prime` public result projection for ready/degraded/blocked states, including `primeRef`, `detailRefs`, `trustPosture`, `receiptChecklist`, source/runtime policy, compact package, and diagnostics names.
2. Runtime acceptance: probe packaged Codex runtime for ready, blocked raw automation, resident unavailable, and knowledge-empty paths; verify the visible host message never claims trusted knowledge on degraded/empty.
3. Producer contract check: if resident PrimeInjectionPackage metadata is incomplete, route the producer-side work to Alembic rather than implementing producer semantics inside AlembicPlugin.
4. Legacy cleanup decision: after acceptance proves no active host needs `alembic_task(operation=prime)`, delete or further quarantine the compatibility prime path in a separate implementation task.
