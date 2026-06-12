# Alembic Space Cross-Repo Seam Findings

Status: evidence base / Design-window post-completion seam scan
Date: 2026-06-12
Audited Heads: Core `c73d5c4`, Alembic `d58e4a3`+AO commits (`5eb0067`,
`8b277fe`, `ff1dc6b`, `a7dea7e`), Agent `35901cf`, Dashboard `11c2c61`,
Plugin `838da9e` (read-only; CKG in flight)
Design Key: alembic-space-interface-cleansing

Inputs: the three completed optimization closeouts (CO/AO/AG final
acceptance archives), the RC6 decision register, and a two-agent cross-repo
seam scan run after completion. IC0 re-freezes all counts.

## S1. Tool-Surface Duality (resident vs Plugin MCP)

- Two hand-maintained tool lists with zero shared definition source:
  Alembic resident surface 17 tools (`lib/resident/tool-schema/tools.ts`)
  vs Plugin embedded surface 22 tools (`lib/codex/mcp/tools.ts`; plus 18
  codex-local tools).
- 15 tool names exist on BOTH surfaces; 5 of them have already diverged in
  schema/semantics: `alembic_guard` (parameterless blocked vs legacy
  fallback modes), `alembic_submit_knowledge` (Plugin adds unit tracking),
  `alembic_rescan` (Plugin adds ideAgentAnalysis), `alembic_dimension_complete`
  (Plugin backfills unit state), `alembic_knowledge_lifecycle` (resident 5
  ops vs Plugin reactivate-only).
- Resident-only: `alembic_skill`, `alembic_task`, `alembic_wiki`,
  `alembic_enrich_candidates`. Plugin-only: intent/prime/work_start/
  work_finish/code_guard/decision_record/project_skill.

## S2. DCR Residue On The Resident/Main Surfaces

The DCR deletion sequence (completed 2026-06-11) removed candidate
enrich/refine + Chat/Wiki/Signal from Dashboard UI, Plugin HTTP/MCP, and
Core guidance — but the Alembic main repo was not in its scope:

- resident tool surface still exposes `alembic_enrich_candidates` and
  `alembic_wiki`;
- the main-repo HTTP API still mounts `POST /candidates/enrich` (registry
  row verified) and Dashboard `api.ts` still carries the enrich method.

Either these have real non-Dashboard consumers (then: document owner +
consumer) or they are deletion residue (then: extend the DCR deletion to
the main/resident surfaces). Needs a user/controller ruling at IC0.

## S3. Dashboard ↔ HTTP Contract Hand-Sync

- Dashboard `src/api.ts` (~35 HTTP methods) against
  `lib/http/provider-contracts.ts` (33 registry routes): spot-checks match
  today, but there is NO generated artifact, NO type sharing, and NO drift
  check — alignment is pure hand-sync plus normalizer functions
  (`normalizeProjectsSnapshot`, `normalizeJobDisplaySnapshot`) and a
  documented adapter-policy note.
- Dashboard imports zero Core types: `KnowledgeEntry` (~60 fields) and
  `KnowledgeLifecycle` are hand-copied in `Dashboard/src/types.ts:687,697`.

## S4. Duplicate Wire Types And Enums

- `KnowledgeLifecycle` / `KnowledgeEntry`: authority in Core
  (`domain/knowledge/KnowledgeEntry.ts`, `types/knowledge-wire.ts`);
  re-defined locally in Dashboard types and route-level validators in
  Alembic and Plugin.
- Problem/error envelope: Core `shared/FailureTaxonomy.ts` + Alembic
  `lib/http/problem-taxonomy.ts` + Plugin `lib/codex/mcp/error-taxonomy.ts`
  + Dashboard `DashboardErrorProblemProjection` (api.ts:293) — four shapes.
- Daemon job kinds: NO authoritative source — hardcoded arrays in Alembic
  and Plugin route files.

## S5. Error-Taxonomy Decentralization

- Core: 11 stable diagnostic codes (`shared/DiagnosticCodes.ts:14-37`,
  CO3) + 7 error classes (`shared/errors/BaseError.ts`).
- Alembic: `problemFromError` adoption measured low (~4 matches) after AO —
  IC0 must verify how AO1 actually implemented boundary problems (the AO
  closeout says status-code honesty landed; the helper may not be the
  mechanism).
- Agent: pure `classifyLlmError` (`src/ai/shared/error-classify.ts`),
  provider-neutral, no cross-repo registry reference.
- No central cross-repo registry was found (the D25-era taxonomy did not
  materialize as a single artifact). Today: four per-repo taxonomies.

## S6. Plugin Coupling State (CKG-gated wave inputs)

- `vendor/AlembicCore` is a git submodule pinned at `c252431` — 16 commits
  behind Core `c73d5c4`; Plugin `package.json` depends on
  `"@alembic/core": "file:../AlembicCore"`.
- 37 frozen keep-alive transitional specifiers (Plugin imports), recorded
  in Core `config/public-api-boundary.json` (keep-alive list, line ~815);
  zero growth allowed.
- SD-5 phase-1 deprecation marks are machine-readable in
  `config/public-api-boundary.json` (`deprecations` block: 67 export
  paths, `deprecatedAt: 2026-06-12`, `removalRelease: 0.3.0` gated on the
  post-CKG Plugin vendor refresh; `reviewBy` dates all 2026-09-12).

## S7. ./tools Downstream Migration Is Ready Now

- AG preserved public `@alembic/agent/tools` compatibility pending
  downstream migration evidence. Current consumption: ~24 Alembic files
  (top symbols: ToolExecutionRequest ×64, ToolResultEnvelope ×41,
  ToolCapabilityManifest ×20, V2ToolRouterAdapter ×3, V2CapabilityCatalog
  ×3; top consumers: terminal-adapter executors, AgentModule injection).
- Alembic already consumes V2 adapter contracts (no V1 ToolRuntimeBridge
  references found) — the migration is a re-point to stable Agent facades
  plus the `./tools` retirement under the Agent boundary gates. No Plugin
  involvement.

## S8. Registered Future Waves From The Three Closeouts

- SD-5 phase 2: delete the 67 marked exports, expectedCounts 98→31,
  release-aligned (0.3.0), gated on Plugin vendor refresh (post-CKG).
- `CO2-PANORAMA-RUNNER-INVERSION`: allowlisted exact-edge layer exception
  awaiting its user-confirmed repair wave.
- `CO3-TAXONOMY-FACADE-PROMOTION`: PersistenceError/DivergenceError facade
  promotion (export-surface wave).
- CO scanner multi-line blind spot + 7 zero-usage allowlist rows fold —
  post-CKG reconciliation wave.
- Coverage enforcement PENDING USER: Core measured 45.50/38.06/49.74/45.95;
  Alembic whole-library 50.85/43.85/60.13/50.83 (AO4 scoped floor 81/77/81/81
  is blocking; global uplift is recorded debt).
- AG residuals: `./tools` retirement (S7), legacy bare catches in Agent;
  Core's remaining 72 non-critical silent scanners.
- SD-1 phase 2: selective Core sinking evaluation, sequenced after SD-5
  closeout.
- Glossary note: per-repo glossaries/layer contracts landed (Core
  `docs/semantic-glossary.md`, `docs/layer-contract.md`; Alembic and Agent
  counterparts) and look consistent; IC0 re-verifies exact locations and
  produces the unified cross-repo projection.
