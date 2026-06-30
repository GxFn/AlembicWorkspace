# P0.0 Gate-Truth Enforcement Matrix — first-hand verified (controller grounding + acceptance oracle)

Date: 2026-06-30
Verified by: controller (subagent code-investigation a71949f + controller spot-checks: verb count, evidence-gate file identity).
Purpose: resolve the "two investigations contradicted each other" ambiguity with first-hand source evidence BEFORE building the canonical module. This is the controller's independent P0.0 grounding; the AlembicCore window still produces its own `recipe-gate-enforcement-matrix.json` fixture as P0's first step, which the controller verifies against THIS oracle at acceptance.

Resolution of the contradiction: **the rules are LAYERED, not duplicated.** Stage 1 (Plugin) owns verb/marker; Stage 2 (Plugin, cold-start-only) owns evidence/snippet/graph; Stage 3 (Core, all paths) owns field/markdown-floor/uniqueness. An investigation that read only Core saw stage 3; one that read only Plugin saw stages 1+2. Both were partially right.

## 🔴 File-identity finding (NOT in the design doc — confirmed by controller)
There are **TWO** `recipe-evidence-gate.ts` files in AlembicPlugin:
- **LIVE**: `AlembicPlugin/lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts` — imported by `tool-router.ts:29` via `#recipe-generation/host-agent-workflows/recipe-evidence-gate.js` (package.json `#recipe-generation/*` → `lib/recipe-generation/*`). **All stage-2 lift/re-point work targets THIS file.**
- **DEAD DUPLICATE**: `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/recipe-evidence-gate.ts` — imported by nothing (controller grep = 0 importers). **Observation only — NOT in this demand's scope** (carry-item: potential dead-file cleanup, route separately). Do NOT edit it; do NOT delete it under this demand.

## Pipeline shape (`tool-router.ts:151-198` `routeSubmitKnowledgeTool`, sequential short-circuit)
- **Stage 1 content-quality** `:163` — ALWAYS runs. File: `lib/runtime/mcp/handlers/recipe-content-quality-gate.ts`. PURE-DATA (operates on `items[]`, no fs/session).
- **Stage 2 evidence** `:172-181` — COLD-START ONLY, gated by `shouldRunRecipeEvidenceGate` (`recipe-evidence-gate.ts:88-110`: `session || sessionId || bootstrapSessionRef || requireProductionSession || dimensionId || item.dimensionId`). File: LIVE `lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts`.
- **Stage 3 field** `:183-189` inside `createSubmitKnowledgeRecipes` → `RecipeProductionGateway.create` → `UnifiedValidator.validate` (`RecipeProductionGateway.ts:359`) — ALWAYS runs. File: `AlembicCore/src/domain/knowledge/UnifiedValidator.ts`.
- All-rejected fallback `buildAllRejectedSubmitResponse` → `INCOMPLETE_SUBMISSION` `tool-router.ts:694-711`.

## Stage 1 reject codes (recipe-content-quality-gate.ts — ALL PURE)
| rejectCode | line | rule |
|---|---|---|
| `DO_CLAUSE_REQUIRED` / `DONT_CLAUSE_REQUIRED` | :113 (:110 guard) | clause missing/empty |
| `DO/DONT_CLAUSE_NON_ENGLISH` | :128 (:125) | clause matches `NON_ENGLISH_SCRIPT_RE` |
| `DO_CLAUSE_NON_IMPERATIVE` | :143/:164 | doClause first word ∉ POSITIVE set (45) |
| `DONT_CLAUSE_NON_IMPERATIVE` | :143/:166-169 | dontClause first word ∉ NEGATIVE set (12) AND not `do not` |
| `CONTENT_MARKDOWN_REQUIRED` | :180 (:177) | content.markdown missing/empty (`readContentMarkdown:204-210`) |
| `CONTENT_CONTRAST_MISSING` | :192 (:189) | markdown lacks ✅ OR ❌ each with ≥4 trailing non-space chars on its line (`hasMarkerExample:212-217`, `>=4` at :215). **BOTH required; NO parallel/adjacent placement required.** |

## Stage 2 reject codes (LIVE recipe-evidence-gate.ts)
| rejectCode | line | rule | pure/runtime |
|---|---|---|---|
| `SESSION_NOT_FOUND` | :163 | no bootstrap session | RUNTIME (session) |
| `WRONG_SCOPE` | :170/:182 | projectRoot≠root or dimensionId∉session.dimensions | RUNTIME (session) |
| `SOURCE_REFS_MISSING` | :207 | zero sourceRefs/reasoning.sources | PURE |
| `SOURCE_REF_LINE_MISSING` | :514 | ref fails `^(.+?):(\d+)(?:-(\d+))?$` | PURE (regex :510) |
| `SOURCE_REF_INVALID` | :531/:545 | isAbsolute / `..` / outside root (path math) | PURE (path) |
| `SOURCE_REF_NOT_FOUND` | :558 | `fs.existsSync`/`statSync` (:555) | RUNTIME (fs) |
| `SOURCE_REF_LINE_OUT_OF_RANGE` | :572 | `fs.readFileSync` (:568) range exceeds file | RUNTIME (fs) |
| `SNIPPET_MISMATCH` | :272 | `snippetMatchesSourceRange` fails | PURE logic / fs-fed `rangeText` |
| `PLACEHOLDER_EVIDENCE` | :259 | `looksLikePlaceholder` hit | PURE |
| `INSUFFICIENT_EVIDENCE` | :298/:311 | distinct FILES <3 (rule/pattern) / <1 (fact) | PURE logic / fs-fed refs |
| `GRAPH_REF_INVALID` | :628 | relationship claim, no graphRefs | PURE |
| `STALE_GRAPH` | :635 | graphRef matches `/\bstale\b|\bpartial\b|\bpending\b/i` | PURE |
| `SOURCE_REF_BARE` | declared :9 | **DEAD — never emitted** | n/a |

Dimension-complete-only (serves `dimension_complete`, NOT submit-knowledge): `DIMENSION_*`, `QUALITY_GATE_FAILED` (`validateDimensionCompletionEvidenceGate:344-473`) — out of submit-path scope, but enumerate in the matrix as `path:[dimension_complete]`.

## Stage 3 blocking errors (UnifiedValidator.ts — Chinese strings not codes; `pass = errors.length===0` :95; ALL PURE)
| error | line | rule |
|---|---|---|
| missing REQUIRED field | :125 | any V3_FIELD_SPEC REQUIRED absent |
| content must be object | :136 | content present, not object |
| reasoning must be object | :143 | reasoning present, not object |
| kind invalid | :150 | kind ∉ rule/pattern/fact |
| markdown too short | :186 | markdown present & length<200 |
| markdown needs code/file-ref | :198 | markdown≥200 & no ```` ``` ```` block & no `.ext` ref |
| coreCode incomplete | :228 | coreCode first char ∈ `}` `)` `]` (ONLY these 3) |
| title too generic | :239 | `/^(Singleton\|Factory\|Observer\|MVC\|MVVM) (pattern\|模式)$/i` (:236) |
| title/trigger/code duplicate | :270/:275/:284 | uniqueness (skippable via `skipUniqueness`) |
Non-blocking warnings (enumerate in matrix snapshot per §C.12): EXPECTED missing :127, trigger no `@` :155, category non-standard :164, language non-standard :172, source-ref suggested :207, bare-name vs path :216, too-simple ≤2 lines :246, bare reasoning.sources :258.

## Corrections vs design doc (apply these; do NOT trust drifted doc line numbers)
1. **VERB COUNT = 45 POSITIVE / 12 NEGATIVE** (controller `awk|grep` confirmed). POSITIVE `:28-74`, NEGATIVE `:76-89`. **DERIVE count from the lifted Set in the test — never hard-code a literal number** (§C.10).
2. ✅/❌ threshold N = **4** (`hasMarkerExample:215` `>= 4`).
3. **FieldSpec REQUIRED top-level = 15, NOT 19** (15 top-level + 4 nested = 19 total REQUIRED). The in-file comment `FieldSpec.ts:229` "19 top-level" is stale; its own list `:230-232` names 15. `fields.ts` re-exports AS-IS so this is informational for the matrix only.
4. **FieldSpec EXPECTED = 2, NOT 1** (`dimensionId:126` + `topicHint:189`). OPTIONAL = 5 (scope, complexity, content.pattern, sourceFile, tags).
5. **No `confidence>=0.85` floor — CONFIRMED ABSENT.** `0.85` appears only at `UnifiedValidator.ts:144` as example text inside the "reasoning must be object" error string. ⇒ D-A correct (guidance says "recommended ≥0.85, not enforced"; gate-rules has NO confidence.floor).
6. coreCode check = `}` `)` `]` only (no `?`; doc hint `}/)/]?` was wrong).
7. `requiresMultiFileEvidence` scope-escape = **4 words** `/\b(single-file|file-local|local-only|narrow)\b/` (:676), but user-facing message (:304) only names "narrow"/"file-local" — real guidance drift to fix in P2.
8. `SOURCE_REF_BARE` dead (declared :9, never emitted).
9. Line drift confirmed throughout — the live line numbers in THIS file are authoritative as of 2026-06-30.

## Stage-2 SPLIT boundary (§C.1 — pure → domain `gate-rules.ts`; runtime → injected port)
**PURE-DATA (extract to domain):** `shouldRunRecipeEvidenceGate` trigger :88-110 · source-ref format regex :510 · path-shape `SOURCE_REF_INVALID` :528-554 (`isInsideRoot:781-784`) · `cleanSourceRef:740-745` · `looksLikePlaceholder:694-703` · `snippetMatchesSourceRange`+`normalizedCode:705-738` · `validateEvidenceFloor`+`requiresMultiFileEvidence`+`isFactCandidate:283-320,670-681` · `validateGraphEvidence`+`hasRelationshipClaim:613-668` · `collectSourceRefs/collectCodeEvidence`+`SOURCE_REFS_MISSING:593-611,205-213`.
**RUNTIME-BOUND (stay behind injected `sourceRefResolver`/`sessionScope` typed ports in `types` layer per §C.11):** top-level `import fs (:1)` + `import getOrCreateSessionManager from '@alembic/core/host-agent-workflows' (:3)` (the two couplings to sever) · `validateSourceRef` fs (:555/:568 → SOURCE_REF_NOT_FOUND/LINE_OUT_OF_RANGE) · `resolveBootstrapSession/getOrCreateSessionManager:72-86` · `validateRecipeSessionScope:151-189` (SESSION_NOT_FOUND/WRONG_SCOPE) · `validateDimensionCompletionEvidenceGate:344-473`.
**Nuance:** `INSUFFICIENT_EVIDENCE` + `SNIPPET_MISMATCH` predicates are pure but consume `validRefs`/`rangeText` produced by fs-bound `validateSourceRef`. The port must yield validated `{sourcePath, rangeText}`; pure predicates then operate on that.
**Acceptance:** after lift, `gate-rules.ts` has ZERO `node:fs` / `host-agent-workflows` imports; `lint:layer-contract` green.

## In-process parity (§C.4/§C.7) — 2 re-point sites confirmed (NOT one routing through the other)
- **(a) AlembicAgent** `src/tools/runtime/handlers/knowledge.ts:92` `handleSubmit` → `validateSubmitParams` (def :283-334, called :101) → `gateway.create:175`. `validateSubmitParams` is **LENGTH/PRESENCE-ONLY**: title 3-200 :294, description ≥10 :297, content object :300, markdown ≥200 :304, rationale ≥50 :308, kind enum :312, trigger ≥3 :315, whenClause ≥10 :318, doClause ≥10 :321, reasoning.sources non-empty :324-331. NO verb / NO ✅❌ / NO ≥3-file / NO snippet.
- **(b) Main body Alembic — CORRECTED 2026-06-30 (P1.4c investigation, controller-confirmed):** the originally-named `GatewayActionRegistry.ts` `candidate:create` (:24-29) + `recipe:create` (:77-82) are **DEAD code** — registered via `gateway.register()` but NEVER dispatched (whole-repo grep: the only live `req.gw(...)` Gateway dispatch is `guard_rule:create` at `guardRules.ts:185`; of 31 registered actions only that one fires; `buildGatewayRequest:221` never called). The V3 unified Candidate+Recipe move shifted creates to direct service calls. **The REAL live main-body in-process AI create is `lib/cli/AiScanService.ts:159` `knowledgeService.create(recipe, {userId:'ai-scan'})`** (the AI producer authors via `runScanAgentTask`→`AgentService.run(scan-extract)` LLM extract, then create+publish; live via `bin/cli.ts:1210` `new AiScanService`, the `alembic ai-scan` CLI; only Core stage-3, no stage-1/2). A second create `lib/http/routes/knowledge.ts:186` (POST /api/v1/knowledge, live via `HttpServer.ts:307`) is an **EXTERNAL HTTP API**, OUTSIDE CG-4's in-process-AI scope (tightening it = public-contract change = user decision, not this demand). ⇒ main-body CG-4 in-process re-point target = **AiScanService.ts:159** (Option A), NOT the dead Gateway actions.
- Both reach Core Stage-3; NEITHER runs Stage-1/Stage-2. ⇒ **in-process parity (CG-4) = 2 re-point sites; it is a TIGHTENING (will new-reject currently-passing in-process recipes), not a no-op.** Per §C.4: upgrade producer prompt FIRST, add currently-passing corpus regression, verify session plumbing exists in-process.

## Non-blocking scorer (QualityScorer.ts — advisory, no throw)
`contentDepth` weight = **0.30** (highest; QUALITY_WEIGHTS constants.ts:14 — completeness .25 / contentDepth .30 / deliveryReady .20 / actionability .15 / provenance .10). `#scoreContentDepth:151-188` levers: md `textScore(md,50,800,0.3)` :156 · heading `/^#{1,4}\s/m` +0.08 :160 · code +0.08 :163 · list `/^\s*[-*+]\s/m` +0.04 :166 · rationale `textScore(...,10,100,0.15)` :172 · whyStandard same :175 · sources `min(0.1,n*0.03)` :178-180 · usageGuide-if-differs `textScore(...,20,200,0.1)` :183. `textScore:65-77`: empty→0, <minLen→weight*0.2, ≤optimalLen→weight*(0.5+0.5*len/optimalLen), else full. **The 0.65 thin score = missing heading/code/list/length levers** — content-contract.ts encodes these as explicit numeric targets.

## Key constants (verbatim — for byte-identical lift)
- **POSITIVE (45)** `:28-74`: add align bind build call check cite collect compare configure copy create derive dispatch ensure expose fetch follow guard handle include inject keep load map normalize pass prefer preserve query read record reject require resolve return route run select store submit update use validate write
- **NEGATIVE (12)** `:76-89`: avoid block do exclude forbid keep omit prevent reject remove skip stop (+ `do`→requires `/^["'`([{]*do\s+not\b/iu` :167)
- `NON_ENGLISH_SCRIPT_RE` :24-25: `[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]` flags `u`
- `FIRST_WORD_RE` :26: `^[\s"'\`([{]*([A-Za-z]+(?:'[A-Za-z]+)?)` flags `u`
- source-ref regex :510: `^(.+?):(\d+)(?:-(\d+))?$` flags (none)
- distinct-FILES floor: rule/pattern `<3` (:295), fact `<1` (:308); scope-escape `/\b(single-file|file-local|local-only|narrow)\b/` (:676)
- `normalizedCode` :706: `value.replace(/\s+/g,'').trim()`; comment-strip `/^\s*(?:\/\/|#)\s*/` :718; significant-line `length >= 6` :721
- placeholder blacklist :694-703: `/\bawait\s+operation\s*\(/i` `/\boperation\s*\(/i` `/\bdoThing\b/` `/\bfoo\b/i` `/\bbar\b/i` `/\bTODO\b/`
- graph EN :664: `call chain|caller|callee|called by|depends on|impact path|relationship|invokes`; CN :666: `调用链|调用方|被调用|依赖|影响路径|关系|上游|下游`
- Stage-3: markdown `<200` :185; code/file-ref `/```[\s\S]*?```/` + `/\.\w{1,10}(:\d+)?/` :195-196; coreCode `}`/`)`/`]` :227; generic-title `/^(Singleton|Factory|Observer|MVC|MVVM) (pattern|模式)$/i` :236
