# P5 real-machine acceptance — host-agent Recipe-production logic on the refreshed plugin

Date: 2026-06-30
Runner: AlembicWorkspace controller (claude-code), controller self-validation
Scope (per user): test the **host-agent Recipe-production logic** via the **refreshed
ClaudeCode plugin** — NOT DeepSeek/LLM generation quality. The cold-start briefing
front-load (`renderGuidance`) and the submit gate (`validateAgainst`) are
deterministic; the host agent (the controller, standing in for ClaudeCode) authored
the recipe by hand following the front-loaded contract. No DeepSeek/Qwen used.

## Build under test (the "refreshed plugin")

- `AlembicPlugin npm run build` → exit 0, "Core build used ../AlembicCore @ **47391c6**"
  (the accepted P4 Core commit). dist carries Core 47391c6 + Plugin ea186ad source.
- Driven via the plugin's own `HostMcpServer` (`dist/lib/runtime/mcp/HostMcpServer.js`)
  with the real `alembic_init` / `alembic_submit_knowledge` tool handlers
  (`server.handleToolCall(...)`) — the same runtime the refreshed CC plugin launches.
- **Sandbox 護真**: `ALEMBIC_HOME` pointed at a scratch dir; the resolved dataRoot was
  `.../scratchpad/p5/home/.asd/...` — the real `~/.asd` was never touched.

## Subject A — cold-start briefing FRONT-LOADS the full contract + gate-clean example ✅

`attachRecipeAuthoringFrontLoad({meta:{}})` (the Plugin cold-start front-load builder)
returns the front-load at `submissionSchema.recipeAuthoringFrontLoad` (15082 chars).
All contract fingerprints present:
- ✅ and ❌ markers present; lists the `validate` verb; states the 45-verb count;
  states the `narrow`/`file-local` scope-escape; states the ≥3-distinct-file floor;
  states the marker rule; carries the per-field contract.
- **Worked example present inline**, language-matched: `workedExample.language=typescript`,
  `candidate.title='UserService 的 Injectable 装饰器约定'`,
  `doClause='Use the @Injectable() decorator on every service class'`,
  `dontClause='Do not create a service class without the @Injectable() decorator'`.

⇒ The host agent sees the complete, gate-passing worked example + the full per-field
contract + verb allowlist + scope-escape + evidence floor **inline in the cold-start
briefing** — the demand's root-cause fix, live on the refreshed plugin.

## Subject B — a contract-following recipe ONE-PASSES ✅

A recipe authored to the front-loaded contract (imperative allowlisted doClause,
`Do not …` dontClause, ≥200-char markdown with project ✅/❌ contrast, all 15 required
top-level fields + nested reasoning) submitted via `alembic_submit_knowledge`:
- `success: true`, `errorCode: null`, message "已提交 1 条知识条目。", recipe id created,
  `rejectCodes: []` — **passed on the first submit**.

Live iteration proof: the FIRST hand-authored attempt (missing description/coreCode/
headers/knowledgeType/language/usageGuide/whyStandard) was rejected with
`INCOMPLETE_SUBMISSION` and a **precise per-field list** + the full requiredFields; the
SECOND attempt, following exactly that contract, one-passed. The gate's feedback IS the
contract — front-loading it removes the trial-and-error rounds (the demand's win).

## Subject C — a contract-violating recipe is REJECTED with the warned codes ✅

A recipe with a 3rd-person non-imperative doClause, no dontClause, no ✅/❌ contrast:
- Rejected `QUALITY_GATE_FAILED` with `DO_CLAUSE_NON_IMPERATIVE` +
  `DONT_CLAUSE_REQUIRED` + `CONTENT_CONTRAST_MISSING`.
- The rejection message **is** the guidance (guidance==gate live): "Start doClause with
  an imperative verb such as Use, Prefer, Validate, Keep, or Require | Rewrite dontClause
  as an English negative imperative clause, e.g. \"Do not …\" or \"Avoid …\" | Add … one
  ✅ correct project-specific example and one ❌ forbidden counterexample." Title: "Recipe
  content quality did not meet **P5 authoring constraints**".

## Subject D — doc-score concretely > 0.65 ✅

`QualityScorer.score()` (Core, the design P5.2(c) lever) on the one-passed recipe:
- **contentDepth (doc-score) = 0.884** — clearly above the ~0.65 baseline.
- overall score = 0.814, grade B.
The required-field gate that one-passed structurally forces the rich field set
(description, coreCode, headers, usageGuide, whyStandard, ✅/❌ markdown) that drives
contentDepth, so a passing recipe is a high-doc-score recipe by construction.

## Verdict

Design P5 pass criteria all met on the refreshed plugin build, sandboxed, no LLM:
(a) cold-start briefing contains a complete, language-matched, gate-passing worked
example inline ✅; (b) a contract-following submit one-passes ✅; (c) sampled doc-score
0.884 > 0.65 ✅; plus the guidance==gate rejection path ✅ and the live iteration loop ✅.
Gates were not relaxed — the violating recipe is still rejected with the exact codes.

## Out of scope / deployment follow-ups (user-gated)

- **Live CC plugin refresh**: rebuilding proved P0–P4 packages into a working plugin and
  driving its runtime proves the logic; making it live in the user's daily ClaudeCode
  (reinstall + restart-to-apply) is a deployment step the user controls.
- **push / release / version-bump**: all four repos' commits remain LOCAL UNPUSHED.
