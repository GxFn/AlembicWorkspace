# Package S Root-Cause Design Audit

Run ID: `pcv-20260530-1515-alembic-cold-start`
Date: `2026-05-31`
Status: `diagnosed(scope=design-root-cause); no-code-patch`

## Scope

This audit reads Package S live raw evidence and the real AlembicAgent/AlembicCore code paths before any new repair. It intentionally does not patch source code.

Primary question: why do Producer and adjacent stages keep exposing new failures after targeted fixes?

## Live Evidence Read

Raw Package S route:

- Test raw dir: `../AlembicTest/tmp/pcvm-package-s-same-input-live-rerun-2026-05-31`
- Job: `bootstrap_mptshl7z_b66ab16d`
- Session: `bs_1780232538380_vo8e6m`
- Job JSON: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mptshl7z_b66ab16d.json`
- Artifacts: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/job-artifacts/bootstrap_mptshl7z_b66ab16d`
- Candidates: `/Users/gaoxuefeng/.asd/workspaces/02a25032/Alembic/candidates/design-patterns/*.md`

Route summary:

- Timeline classification says `ok=true`, `classification=pass`, but PCVM does not accept this as the final verdict.
- Final retained events: `72`.
- Event kinds: `workflow=5`, `checkpoint=1`, `llm.input=24`, `llm.output=24`, `llm.reflection=12`, `tool=1`, `summary=4`, `artifact=1`.
- Stage counts include `llm.input.analyze=16`, `llm.output.analyze=16`, `llm.input.produce=7`, `llm.output.produce=7`.
- Job result: `extracted=6`, `created=6`, `degraded=false`, `toolCallCount=42`.
- Token usage: input `246703`, output `22825`, reasoning `5922`, cache hit `138496`.
- Total model tokens: `275450`; per created Recipe: `45908.33`.
- QualityGate: pass, total score `98`.

Package S repaired the Package Q useful-output collapse:

- Analyzer produced 6 structured core findings.
- Producer created 6 candidate files.
- Later Producer inputs show `trackerMetrics.submitCount=6`.
- Candidate files contain full fields and non-empty content, reasoning, clauses, and source refs.

But Package S is still not a clean pass:

- Producer still selected invalid actions after all submits: `knowledge.detail`, `meta.review`, and `knowledge.manage`.
- Runtime gate blocked invalid Producer actions with the submit-first error, which means the model still saw and attempted the wrong actions.
- Final Producer summary falsely says submitted candidates only carried partial fields and need later completion.
- One stored candidate contains a content typo: `aactor AuthMiddleware` / `aactor WBISigner`, while still receiving grade `A`.

## Root Cause 1: Action-Level Capability Contract Is Lost Before Provider Schema

Source chain:

- `BootstrapProduce.allowedTools` correctly declares:
  - `code: ['read']`
  - `knowledge: ['submit']`
  - `memory: ['recall']`
  - `meta: ['review']`
- `CapabilityV2.tools` returns only `Object.keys(this.allowedTools)`, losing allowed action lists.
- `AgentRuntime.#collectTools()` collects only tool ids from `cap.tools`.
- `AgentRuntime.#getToolSchemas()` passes only ids into `V2CapabilityCatalog`.
- `V2CapabilityCatalog.generateSchemas(ids)` expands every selected tool id back to all registered actions with `Object.keys(spec.actions)`.
- `generateLightweightSchemas()` can project allowed actions if it receives an action map, but the runtime path never gives it that map.

Live effect:

- Producer prompts tell the model to use only `knowledge.submit`, but provider-visible schemas still show `knowledge.search/submit/detail/manage` and `meta.tools/plan/review`.
- Package S inputs show `Knowledge management: search, submit, detail, manage` and `Agent self-reflection: tool schema queries, planning, review`.
- The execution-time `producerSubmitOnlyGate` blocks bad calls only after the model already spent a round choosing them.

Design diagnosis:

This is not an accidental model choice. The system has two conflicting contracts:

- Stage/capability contract says only specific actions are allowed.
- Provider schema contract exposes broader action space.

The runtime gate is a safety net, not the source of truth.

## Root Cause 2: Provider History Compaction Removes Submit Completeness Semantics

Source chain:

- `ContextWindow.appendAssistantWithToolCalls()` stores tool calls after `compactToolCallForProviderHistory()`.
- `compactKnowledgeArgsForProviderHistory()` compacts `knowledge.submit` to only `category`, `dimensionId`, `kind`, `knowledgeType`, `source`, `supersedes`, `title`, and `trigger`, plus `providerHistoryCompacted: true`.
- It drops `description`, `content`, `whenClause`, `doClause`, `dontClause`, `coreCode`, and `reasoning`.
- `limitToolResult('knowledge')` returns only a short result, and live `knowledge.submit` success carries `status/id/title`, not a field-completeness ledger.

Live effect:

- Persisted candidate files are complete.
- Producer final summary sees compacted history and concludes candidates were submitted with only partial fields.
- The summary's "need later completion" note is false, but it is an understandable inference from the provider-visible history.

Design diagnosis:

The compaction saved tokens but threw away semantic invariants. The system lacks a small authoritative submit ledger such as:

- `createdCount`
- `targetSubmits`
- per candidate `title`, `trigger`, `status`
- `requiredFieldsComplete: true`
- `payloadStored: true`
- optional `sourceCount` and persisted candidate ref

Final summaries should not infer candidate completeness from lossy provider history.

## Root Cause 3: Summary Stage Still Trusts LLM Reconstruction Over Runtime State

Package S final summary is internally inconsistent:

- It correctly says 6 candidates were created.
- It correctly says all 6 structured Analyst findings were covered.
- It incorrectly says candidate payloads only carried partial fields.

The reason is architectural:

- Runtime/tracker knows `submitCount=6`.
- Candidate files prove full payload persistence.
- Provider history only shows compacted submit calls.
- Final free-text summary is generated by the model using the compacted conversation, not from a runtime-owned state snapshot.

Design diagnosis:

The final summary needs a runtime-owned production summary source of truth. LLM prose can phrase it, but the factual fields must come from runtime state, not from replaying compressed tool calls.

## Root Cause 4: Quality Scoring Validates Shape, Not Exact Code Correctness

Source chain:

- `knowledge.submit` validation checks required field presence and minimum lengths for `title`, `description`, `content.markdown`, `content.rationale`, `kind`, `trigger`, `whenClause`, `doClause`, and `reasoning.sources`.
- `QualityScorer` scores completeness, content depth, delivery readiness, actionability, and provenance.
- It does not compare code snippets against source files and does not parse Swift snippet syntax.

Live effect:

- `singleton-thread-safety-strategy.md` contains `aactor AuthMiddleware` and `aactor WBISigner`.
- The candidate still receives `_quality.overall=0.89`, grade `A`.

Design diagnosis:

This is a separate quality-contract gap. It should not be mixed into the primary token-efficiency gate unless the target is expanded, but it must be recorded because it shows why "created + A grade" is not enough for final product quality.

## Root Cause 5: Responsibilities Are Split Across Prompt, Schema, Gate, Tracker, History, and Persistence

The same stage invariant currently appears in multiple places:

- Producer prompt says no broad exploration and submit all structured findings.
- Capability says allowed actions are submit/read/recall/review.
- Provider schema exposes broader actions anyway.
- Runtime gate blocks wrong actions after selection.
- Tracker counts submit coverage and phase transition.
- ContextWindow compacts payload history.
- Submit handler validates/persists payload.
- Quality scorer grades persisted payload.
- Final summary reconstructs completion from the compressed conversation.

This split is why each local fix exposes another failure:

- Package P fixed description/completion wording, but Q exposed coverage collapse.
- Package R fixed coverage/gating at source/unit level, but S exposed schema-contract leakage and summary-state leakage.
- If we now add only another Producer-specific schema filter, we may reduce one symptom while preserving the underlying contract split.

## Confirmed Root Cause

The repeated failures are caused by a missing single source of truth for stage contracts and stage state.

The root issue is not SourceRef, not Package S's test harness, and not a single hidden typo. It is a design mismatch:

1. Stage action permissions are declared at capability level but lost before provider schema generation.
2. Execution gates enforce constraints after the model has already seen invalid actions.
3. Token-saving history compaction removes the very facts the final summary needs.
4. Candidate quality scoring and submit validation check structural completeness, not exact-source correctness.

## Required Design Direction

The next repair must be a unified design repair, not a temporary Producer patch:

1. Preserve action-level `allowedTools` from capability resolution through provider schema projection.
2. Use the same action contract for provider schema, router permission, runtime allowlist, execution gate, diagnostics, and tests.
3. Add a compact runtime-owned Producer submit ledger that survives history compaction.
4. Make final Producer summaries read factual completion state from the ledger, not from compacted tool-call args.
5. Preserve compaction token savings while retaining semantic flags like `requiredFieldsComplete` and `payloadStored`.
6. Keep exact-source snippet validation as a separate quality improvement candidate, because it changes quality scope beyond token efficiency.

## Next Package Candidate

Package T should be a contract-unification source/unit package:

- Source target: `AlembicAgent`.
- Do not touch BiliDili.
- Do not reopen SourceRef.
- Do not implement only a Producer-specific ad hoc filter.
- Build tests that fail if a stage with `knowledge: ['submit']` exposes `knowledge.detail/manage/search` to the provider.
- Build tests that prove compacted submit history preserves payload-complete semantics without replaying full payloads.
- Build tests that prove Producer final summary can be generated from runtime submit ledger state after provider-history compaction.

Package T live rerun should only go to AlembicTest after source/unit tests prove the contract path is unified.
