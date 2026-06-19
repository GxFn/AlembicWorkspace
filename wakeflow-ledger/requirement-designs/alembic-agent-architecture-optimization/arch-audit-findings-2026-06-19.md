# AlembicAgent Architecture Audit Findings (2026-06-19)

Method: two-pass multi-agent review — 6 subsystem maps -> 6 dimension reviews
-> per-finding adversarial verification. 40 raw findings, 39 confirmed (1
rejected). Counts: 1 critical, 13 high, 18 medium, 7 low. All file:line-
grounded. Phase column maps to the requirement design.

## Critical

- **AgentRuntime god class** — `src/agent/runtime/AgentRuntime.ts` 2758 LOC
  (class body ~1960 + ~41 module helpers): owns ReAct loop, LLM orchestration,
  tool-call processing, evidence formatting, secret redaction, dev formatting,
  per-provider quirks. No internal seam. [AAO5]

## High

- **Layer contract treats all `agent/` as one opaque area** — 13 subsystems'
  internal direction ungoverned; `config/layer-contract.json:13` +
  `lint-layer-contract.mjs:50`. [AAO0]
- **ExitController half-wired** — 5 of 6 exit-decision methods
  (`checkAfterLLM/AiError/ToolCalls/TextResponse/ToolChoiceViolation`) defined
  but unused; live exit logic duplicated inline in AgentRuntime. [AAO1]
- **ToolRouterAdapter ships `EMPTY_DIAGNOSTICS`** — `#toEnvelope:145` /
  `#errorEnvelope:165` hardcode a frozen all-false diagnostics; every tool
  timeout/partial/fallback is invisible to the ReAct loop and run result. [AAO2]
- **Tool handlers emit zero logs on degrade/fallback/timeout/skip** —
  `handlers/{code,terminal,knowledge,graph}.ts`; `ctx.logger` available
  (`kernel/context.ts:107`) but unused. Violates AGENTS.md:146. [AAO2]
- **Asymmetric router robustness** — production `ToolRouter`/Adapter has no
  envelope-level timeout/abort guard; `LightweightRouter.#executeWithControls`
  does. The agent loop runs through the weaker one. [AAO2]
- **~1170 LOC dead/unwired modules** — capability classes, `AgentRouter`,
  `ConsolidationGate`, `AiProvider` reliability machinery, etc. [AAO1]
- **Token estimation fragmented across 5+ formulas** — `shared/tokenUtils`
  (CJK-weighted) vs `kernel/registry.ts:268` (len/4) vs memory/context copies;
  all gate budget decisions. [AAO4]
- **AgentStageFactoryRegistry indexes PRESETS stages positionally** —
  `:70-143` `presetStages[0..3]`; reordering a stage silently corrupts the
  bootstrap pipeline. [AAO4]
- **Tool kernel contracts unversioned + non-replayable** — no `schemaVersion`;
  `Date.now()`-based ids. Violates AGENTS.md:144 (versioned + replayable). [AAO3]
- **Claude/Google/Ollama transports have zero protocol tests** — only
  OpenAI/DeepSeek covered; the two most divergent vendor translators untested.
  [AAO0]
- (and the EMPTY_DIAGNOSTICS / silent-fallback findings cross-listed under the
  contracts-observability dimension)

## Medium

- Layer-contract census stale (claims 44/18 @ 6bf266e; reality 43/11). [AAO0]
- Blessed tools->agent reach-up is placement-only — `Capability.ts` is a
  zero-import abstract that belongs in a leaf. [AAO6]
- `WorkflowRegistry` no in-repo consumer — **but live main-repo API**
  (`WorkflowAdapter`); keep + document. [AAO1]
- `LightweightRouter` no in-repo wiring — **but live main-repo API**
  (`AgentModule.setRouter`); keep + document. [AAO1]
- `AgentRouter` defined/exported but never instantiated; no main-repo consumer
  -> delete. [AAO1]
- `DiagnosticsCollector.recordToolCallEnvelope` drops `envelope.diagnostics`.
  [AAO2]
- knowledge/graph/memory/meta handlers ignore `ctx.abortSignal`, no timeout —
  cancelled backend work leaks. [AAO2]
- `ToolContext` types all 9 DI services as `unknown`, re-cast per handler. [AAO3]
- Strategy resolved twice (compiler.compileStrategy + builder.resolveStrategy).
  [AAO4]
- `buildAnalystPrompt` slot-9 cast mismatch makes the Evolution prompt section
  silently dead. [AAO4]
- `ContextWindow` (1209) + `PipelineStrategy` (1104) bundle 3 concerns each. [AAO5]
- Provider key->env triplicated; `summarize()` copy-pasted 5x. [AAO4]
- Two "canonical" tool-result shapes; adapter drops `_meta`. [AAO3]
- `isToolResultEnvelope` duplicated + divergent (kernel vs ActiveContext). [AAO3]
- Production `ToolRouter` concurrency lock untested + check-then-act race. [AAO0]
- Heavily-tested `LightweightRouter` is the host router; wired `ToolRouter`
  under-tested on the same boundaries. [AAO0]
- Validation floor is substring-presence — a gutted test body still passes. [AAO0]
- `AiFactory.getProviderWithFallback` (returns fallback without probing key)
  untested. [AAO0]

## Low

- Internal direction rests on one coarse lint; sibling import-boundary lint
  checks only external bans. [AAO0]
- `StrategyRegistry.create()/_registry` unused; `resolveStrategy` switch is the
  live path. [AAO1]
- Migration-phase metadata frozen into the public package descriptor
  (`src/index.ts:7-12`) and the G5 signature surface. [AAO1]
- `errorClassify` counts any no-status throw as a server error -> code bugs
  trip the circuit breaker. [AAO2]
- `RuntimeCapabilityCatalog` ships 5 projection methods all delegating to one,
  ignoring their differentiating args. [AAO1]
- `ai-provider.test.ts:287-368` tests the dead legacy reliability path. [AAO1]

Source: workflow runs `wf_785d8649-ad6` (maps) + `wf_f0f4808f-573`
(reviews + adversarial verification).
