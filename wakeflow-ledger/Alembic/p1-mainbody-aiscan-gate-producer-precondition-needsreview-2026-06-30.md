# P1.4c ai-scan gate — needs-review: producer-prompt-first precondition is UNMET and its fix is out-of-boundary (AlembicAgent)

Date: 2026-06-30 · Window: Alembic · Demand: alembic-recipe-authoring-guidance-optimization-2026-06-29 · Task: p1-mainbody-aiscan-gate (Option A, controller rework of p1-mainbody-inprocess-repoint)

Status: **needs-review (no code committed)** — gating `AiScanService.ts:159` opportunistically as-is would reject ~100% of ai-scan recipes as a should-pass-rejected case, because the ai-scan producer prompt is a SEPARATE, contract-unaware prompt that lives in AlembicAgent (which this task forbids touching). This trips the task's explicit STOP clause ("If the tightening would reject an ai-scan recipe you believe should pass, STOP and return needs-review") and the §C.4 discipline ("先升 producer prompt → 再启门"). The fix is cross-repo (AlembicAgent) and must be sequenced first.

## What the task asked (Option A, controller-confirmed)

Gate the real live in-process AI create `lib/cli/AiScanService.ts:159` `knowledgeService.create(recipe,{userId:'ai-scan'})`: run `validateAgainst([recipe], {stage:'all', path:'in-process', profile:resolveAuthoringProfile(ctx), sourceRefResolver, dimensionId})` before create, skip-and-report on violations, opportunistic profile. The task added: "VERIFY the ai-scan extract uses that embedded AlembicAgent producer [insightProducer, upgraded P1.4b] and note it; only if ai-scan has its OWN separate producer prompt do you upgrade it producer-first" and "If the tightening would reject an ai-scan recipe you believe should pass, STOP and return needs-review with the case."

I did the verification. The assumption ("producer-prompt-first most likely ALREADY satisfied") is FALSE for ai-scan.

## Verified ground truth (own source reads in AlembicAgent — read-only)

### Finding 1 — ai-scan extract uses a SEPARATE, contract-unaware producer prompt (NOT the P1.4b-upgraded insightProducer)

- `runScanAgentTask({task:'extract'})` (`AlembicAgent/src/agent/runs/scan/ScanAgentRun.ts:31`) runs profile `scan-extract` (`:60`).
- `scan-extract` (`AlembicAgent/src/agent/profiles/definitions/scan.profile.ts:19-28`): basePreset `insight` BUT `strategy:{type:'pipeline',factory:'scanPipeline'}`, `projection:'scan-recipes'`.
- The pipeline produce stage's `systemPrompt` = `producePrompt` (`AlembicAgent/src/agent/prompts/scanPrompts.ts:251`), and that producePrompt is the inline `extract.producePrompt` (`scanPrompts.ts:80-119`). `scanPrompts.ts` imports only `buildCodeContextSection` + `producerRejectionGateEvaluator` from insightProducer — **NOT** `PRODUCER_SYSTEM_PROMPT`/`STYLE_GUIDE`. The `renderGuidance('in-process',...)` upgrade (P1.4b) lives only at `insightProducer.ts:144` and is injected by `buildProducerPromptV2` (the bootstrap/cold-start preset), which the scan pipeline does NOT use.
- ⇒ The ai-scan extract agent authors recipes WITHOUT ever seeing the verb allowlist, the ✅/❌ contrast contract, the markdown floor, or the grounding rules. **Producer-prompt-first is NOT in place for ai-scan.**

### Finding 2 — the extract prompt never instructs `dontClause` or ✅/❌ contrast

Reading `scanPrompts.ts:80-119` verbatim: it asks for title, `content.markdown` (项目特写), `reasoning.sources` (path arrays), `kind`, `trigger`, **`doClause`**, `whenClause`, module name. It **NEVER** asks for **`dontClause`** (line 90: "trigger, doClause, whenClause 等" — no dontClause) and **NEVER** asks for the literal **✅/❌** markers that stage-1 `validateContentContrast`/`hasMarkerExample` require (both markers, ≥4 trailing non-space chars each). (The `summarize` task `:126-152` is the same — doClause yes, dontClause/✅❌ no.)

### Finding 3 — the recipe reaching `create` is lean, unnormalized LLM JSON (not the enriched item)

- `ScanRecipe` type (`AlembicAgent/src/agent/runs/scan/ScanRunProjection.ts:4-13`) is lean: `title?, description?, summary?, usageGuide?, category?, headers?, tags?, trigger?` (+ index sig). No doClause/dontClause/content/reasoning/sourceRefs in the declared shape.
- `projectScanRunResult` (`ScanRunProjection.ts:38-84`): recipes come from `extractCollectedRecipes` (toolCalls with `status:'collected'`, `:86-97`) OR, if none, from parsing the produce reply as JSON (`:66-83`). Either way it is unnormalized LLM output, NOT the fully-shaped `item` the agent's own `knowledge.ts handleSubmit` builds (doClause/dontClause/coreCode/reasoning.sources at `knowledge.ts:152-177`) — that enrichment is inside the agent submit handler and is not what `AiScanService` receives.
- At the call site (`Alembic/lib/cli/AiScanService.ts:128-168`) the only mutations before create are `source`/`tags`/`moduleName`/`aiInsight`; no authoring-field synthesis.

## Consequence (the should-pass-rejected case)

An opportunistic `validateAgainst` before `AiScanService.ts:159` as-is would reject essentially EVERY ai-scan recipe, dominated by:
- `DONT_CLAUSE_REQUIRED` (stage-1) — dontClause never requested ⇒ absent.
- `CONTENT_CONTRAST_MISSING` / `CONTENT_MARKDOWN_REQUIRED` (stage-1) — ✅/❌ never instructed.
- likely `SOURCE_REFS_MISSING` / `SOURCE_REF_LINE_MISSING` (stage-2) — `sourceRefs` `path:line` array not guaranteed by the prose `(来源: path:行号)` instruction.

These are genuine should-pass-rejected cases: the ai-scan producer was never told the contract. Enabling the gate now would (a) break the `alembic ai-scan` CLI (publishes ~0 recipes), and (b) recreate the §C.4 "逆向试错门" trap the demand explicitly forbids. The §C.4 precondition — upgrade the producer prompt FIRST, then enable the gate — is unmet for ai-scan.

## Why I cannot fix it inside this task's boundary

- The producer-prompt-first fix = make the ai-scan extract producer render the Core authoring contract (instruct `dontClause` + ✅/❌ contrast + `sourceRefs` `path:line`, like P1.4b did for insightProducer). That prompt is `AlembicAgent/src/agent/prompts/scanPrompts.ts` — **this task forbids touching AlembicAgent**.
- Synthesizing the missing fields (dontClause/✅❌/sourceRefs) in the host (`AiScanService`) is fabrication of authoring content the AI did not produce — forbidden by the demand's no-guess principle and the repo's explicit anti-auto-fix discipline (see the standing comment at `AlembicAgent/src/tools/runtime/handlers/knowledge.ts:121-123` about NOT auto-classifying/repairing sourceRefs).
- Selectively disabling stage-1 content gates is "放松门禁" / re-implementing a partial gate — forbidden.

So there is no in-boundary way to make an opportunistic ai-scan gate safe.

## Options (controller decision)

- **Option A (recommended) — sequence the producer-prompt-first fix to AlembicAgent FIRST, then re-dispatch the main-body ai-scan gate.** AlembicAgent upgrades `scanPrompts.ts` `extract` (and `summarize`) producePrompt to render/instruct the Core authoring contract (dontClause + ✅/❌ contrast + sourceRefs `path:line`), mirroring the P1.4b producer-prompt-first discipline; ideally also reconcile the scan projection so a fully-shaped recipe reaches `create`. THEN the main-body adds the opportunistic gate before `AiScanService.ts:159` (the gate module is a faithful §C.11 mirror, ready to re-add) with a now-bounded new-reject set. This is true CG-4 closure for ai-scan, per §C.4.
- **Option B — treat the AlembicAgent bootstrap path (P1.4b) as the CG-4 in-process closure, and scope ai-scan OUT of this demand's CG-4.** ai-scan is a CLI extract utility whose authoring producer is a separate, non-contract prompt; closing CG-4 for it requires the producer upgrade (Option A's AlembicAgent step). If the controller prefers to keep CG-4 to the contract-aware authoring paths, ai-scan gating becomes a follow-up demand once its producer is contract-aware.

Recommendation: **A** with the AlembicAgent producer fix sequenced FIRST; do NOT gate ai-scan before that, or the CLI breaks and §C.4 is violated. Ready to implement the main-body gate immediately once the producer precondition is met.

## Boundary held

No code committed; the draft §C.11 gate module I had staged (`lib/shared/recipeAuthoringGate.ts`) was REMOVED to keep the tree clean (it is unwired glue until the producer precondition is met). AlembicCore / AlembicPlugin / AlembicAgent / FieldSpec untouched. The dead Gateway actions (Option C) and the external HTTP route (Option B from the prior return) were not touched. HEAD `ef30c0d`; working tree clean apart from the pre-existing installer-managed `CLAUDE.md` marker edit. No push/tag/version bump. See also the prior return: `wakeflow-ledger/Alembic/p1-mainbody-inprocess-repoint-deadpath-needsreview-2026-06-30.md`.
