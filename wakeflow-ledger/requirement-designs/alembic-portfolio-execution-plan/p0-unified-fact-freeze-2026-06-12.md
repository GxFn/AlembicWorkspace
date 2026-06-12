# P0 Unified Fact Freeze And Planning Baseline (2026-06-12)

Status: controller-accepted baseline; the single dispatch source for Trains
H/A/B, P2, P3, P4, and the R release wave.
Merges: IC0 + AD0 + CC0 + MT0(census half) per portfolio merger #1.
Constituent requirement designs stay authoritative for evidence
requirements; this baseline freezes the FACTS they demanded.

**Frozen baseline commits (all clean, all pushed, quiet since 06:58):**
Alembic `b22d87c` · AlembicCore `c820ce6` · AlembicAgent `35901cf` ·
AlembicDashboard `11c2c61` · AlembicPlugin `e9d1bb8`.
(The 06:58 pause-stabilization tail is test/CI-only — see the CKG pause
record addendum.)

Method: four read-only census subagents (advisory) + controller
spot-checks of every load-bearing number (tool counts 19/22 re-counted;
./tools consumer count re-counted; DCR consumer scans controller-executed;
HEAD race investigated and resolved). Raw spot-check outputs in the P0
state root `evidence/`.

## 1. IC census (seams) — feeds Trains A/B, P3

- **Wire-type duplication (IC1, Train A)**: 4 shared concepts, Core owns
  all — KnowledgeEntryWire (Core `src/types/knowledge-wire.ts:95`,
  60+ fields) vs Dashboard hand-copy (`src/types.ts:697`, ~57 fields,
  missing usageGuide, agentNotes shape differs); failure/problem envelope
  (Core FailureTaxonomy 16 entries + 11 diagnostic codes + 9 error
  classes; Alembic HTTP adapter maps all 16; Plugin Zod validator derives
  Core; Dashboard loose hand-projection); job kinds (Core
  ALEMBIC_JOB_KINDS authority, Alembic re-exports — already singular);
  candidate status enums (OPEN locator — Train A closes it).
- **Dashboard contract (IC2, Train B)**: zero generated artifacts, zero
  drift gates; 33 authoritative routes in Alembic provider-contracts vs
  ~35 hand-written Dashboard api methods; drift-prone files enumerated
  (types.ts:687-745, api.ts:278-313, normalizers at api.ts:2470+).
  Type-artifact spec: §8 below.
- **./tools migration list (IC3, Train B) — FROZEN at 23 files**
  (controller re-count `grep -rl "from '@alembic/agent/tools'"
  Alembic/lib = 23`; the census agent's 24th row was an aggregate, not a
  file). Top symbols: ToolExecutionRequest ×64, ToolResultEnvelope ×41,
  ToolCapabilityManifest ×20. No consumers outside Alembic. Stop rule:
  any consumer outside the frozen list → re-rule.
- **Error-taxonomy registry inputs (IC4, Train A)**: five per-repo
  taxonomies located (Core authority ×2 files; Alembic HTTP adapter
  complete over 16 kinds; Agent classifyLlmError independent —
  integrate-or-document decision executes in Train A; Plugin MCP
  validator derives Core; Dashboard loose projection pending IC2 gate).
  Scheduled same-wave repairs: CO2-PANORAMA-RUNNER-INVERSION removal,
  CO3-TAXONOMY-FACADE-PROMOTION staging (ships in R).
- **DCR residue — per-surface verdicts CLOSED (controller-executed scans)**:
  all three surfaces have NO external consumer (Dashboard/Plugin zero
  hits; only self-registrations + the route's internal aiProvider call):
  resident `alembic_enrich_candidates` → DELETE; resident `alembic_wiki`
  → DELETE; `POST /candidates/enrich` (route I22 + candidates.ts) →
  DELETE. Execute in Train B to the DCR7 proof standard (route-negative,
  tool-list, help/i18n sweep incl. Dashboard App.tsx:603 help row).

## 2. AD census (architecture) — feeds P2

- **DAG (AD1)**: Core ← Agent ← Alembic; Core ← Plugin; Dashboard
  zero-dep (confirmed). No space-level allowed-edge config; no Dashboard
  zero-dep gate. Toolchain: Node≥22, TS 5.9.3, Biome 2.4.6, Vitest 4.
- **Side-effect baseline (AD4) — re-measured, two counts materially WORSE
  than the audit approximation**: Logger.getInstance 148 total (Core 41 /
  Alembic 47 / Agent 30 / Plugin 30); getServiceContainer **216** (Alembic
  138 — concentrated in http/routes — Plugin 77, Core 1) vs audit "47+";
  pathGuard 53 (matches); timerRegistry 31, ModelRegistry 18; module-state
  5 sites (sse-sessions, RateLimiter buckets, auth TOKEN_SECRET
  import-time randomness, +2); HttpServer eventBus listeners ×4 with no
  off/dispose. Compliance floor ~27-30% (unchanged). AD4 scope confirmed
  necessary.
- **Layer contracts (AD3)**: Core complete (CO2: 9 areas, 4 blessed + 1
  temporary exception); Alembic/Agent/Dashboard have NONE.
- **AD5 anchors confirmed**: no prepared-stmt cache; cpuLimit p-limit(4)
  no workers; BatchEmbedder maxConcurrency=2 hardcoded; SignalAggregator
  no cap/backpressure; realtime delivery contract undocumented. Healthy
  areas recorded (WAL stance, drizzle migrations, HNSW, ConfigWatcher).
- **Charter gaps (AD2)**: no per-repo charter artifact; four parked
  registers (SD-1 p2, SD-6, R-1, SD-4) absorb into AD2's placement pass.
  Charter DRAFTS: §7 below.

## 3. MT census (tools) — feeds Train H/A/B, P3

- **Dual-surface inventory FROZEN (controller re-counted)**: Resident 19
  tools (14 agent + 2 admin + 3 workflow; registry
  `Alembic/lib/resident/tool-schema/tools.ts`), Plugin 22 (21 agent + 1
  admin; `AlembicPlugin/lib/codex/mcp/tools.ts`). Duality: 15 shared,
  7 Plugin-only (intent/prime/work_start/work_finish/code_guard/
  decision_record/project_skill), 4 Resident-only (skill/wiki/task/
  enrich_candidates — two of which are DCR-deletes, shrinking true
  resident-only to skill+task after Train B).
- **ROLLED 2026-06-12 (Train H p1 evidence — two surface-reality
  corrections)**: (a) the RESIDENT registry has ZERO importers and no MCP
  server binds it in the committed Alembic repo (no MCP SDK dependency,
  no mcp CLI subcommand) — the handlers are LIVE via daemon dynamic
  imports / HTTP routes / CLI, but the MCP facade is disconnected;
  "resident MCP runtime" does not exist today. Disposition: matrix v1
  records connectivity-FAIL for resident rows with live-consumer nuance;
  "bind vs delete-registry vs certify-via-HTTP" enters the per-item USER
  decision register. (b) the PLUGIN live surface is TIER-COMPOSED: at
  ALEMBIC_MCP_TIER=agent the server lists 26 tools = host-agent 10 +
  source-graph 8 + codex-local 7 + validation_plan 1, while the 12
  shared core tools are NOT exposed at that tier; the static TOOLS array
  (22) is one composition input, not the live list. Certification scope =
  union over tier configurations; 16 live-only tools sheeted in the p1
  supplement (registryOrigin field added). Raw evidence: Train H state
  root evidence/smoke-out/ (tools-list capture, matrix, summary).
- **Output-slicing magic numbers (MT2, Train A)**: Resident 3 sites
  (guard 10, browse 120, refine 20); Plugin 16+ sites (prime ×5 caps
  4/5/20/40/240; work_start ×4; work_finish 2000-char hard cap; more).
  ZERO truncation/overflow signals anywhere — the budget mechanism
  replaces all of these with declared budgets + honest overflow.
- **Usage-error surfaces (MT3, Train B)**: all inputs Zod-typed; mix of
  enum/required throws and silent degradation; silent truncation
  everywhere.
- **Real-misuse harvest sources**: ViolationsStore (guard_violations,
  200-run retention, fingerprint dedup) + Plugin
  `scratch/d25-mcp-error-taxonomy.json` (28 invocations, 14 failure
  kinds, structured). Harvest executes in Train H against these.
- **Expectation sheets**: skeleton = one card per tool × 41 (19+22),
  fields: purpose, modes, input contract, output budget, edge honesty,
  misuse cases, value verdict slot. Built and filled by Train H.

## 4. CC + MPB census — feeds P3

- **AGENT_HOSTS** already includes 'claude-code'
  (`AlembicPlugin/lib/codex/mcp/public-tools/contract.ts:14`).
- **ALEMBIC_CHANNEL_ID** mechanism proven (env propagation via
  channel.ts + start script + .mcp.json); claude-code value not yet wired
  (CC2 work).
- **Codex-named strings**: 4 sites in tools.ts (291, 292, 396) to
  host-parameterize in CC1.
- **Shared-manifest skills**: 2 consumers today (main + plugin overlays,
  RC5 drift gate); Claude Code plugin skills = third consumer (CC2).
- **Transport**: StdioServerTransport host-agnostic; ProjectRootResolver
  fallback chain ready for `ALEMBIC_PROJECT_DIR=${CLAUDE_PROJECT_DIR}`.
- **Local plugin-format precedent**: installed Wakeflow plugin
  (.claude-plugin/plugin.json + .mcp.json + ${CLAUDE_PLUGIN_ROOT}/
  ${CLAUDE_PROJECT_DIR}); official live-doc verification = first step of
  P3's CC1 (NOT closed in P0; do not freeze the manifest shape until then).
- **MPB re-freeze**: thin runtime package landed
  (packages/alembic-codex-runtime: manifest-only, no tarballs;
  RUNTIME_PACKAGE_SPECIFIER pinned @gxfn/alembic-codex-runtime@0.2.0);
  Codex shell artifacts proven (.codex-plugin/plugin.json + .mcp.json +
  bootstrap start script). Remaining MPB scope = P3 step 5 distribution
  sub-wave (one pinned npm runtime, two thin host shells). MPB standalone
  is DISSOLVED.
- **Actual CKG1-3 delivery**: CKG1 onboarding contract (+798-line
  OnboardingContract.ts etc., completed rev 10); CKG2 source-graph
  lifecycle (Core +146/+124 etc., completed rev 6); CKG3 evidence gates
  (+761-line recipe-evidence-gate.ts etc., committed but needs-rework
  rev 5 — six proof gaps named in the pause record). CC3/CC4 rely ONLY on
  proven CKG1/CKG2 + shell/runtime surfaces.

## 5. Naming census (SN0 pre-work) — feeds P4

camelCase file stragglers: 20 found (Alembic 9 of 207, Core 4 of 376,
Plugin 7 of 173; Agent/Dashboard not re-counted by the agent — SN0 slim
re-verifies) vs design ~30. .tsx inventory: 64 files, all Alembic lib/ui.

## 6. Coverage ratchet values (IC0 ruling: ratchet at measured)

| Repo | Measured floor (frozen) | Source |
| --- | --- | --- |
| AlembicCore | 45.50 stmts / 38.06 branch / 49.74 funcs / 45.95 lines | CO4 before/after table (provider now installed; enforcement wiring remains the open user decision — TODO CO4-COVERAGE-ENFORCEMENT-DECISION) |
| Alembic | 81.25% statements on its configured coverage scope; whole-lib ~51% recorded as debt | CO1 p2 full gate log; AO closeout |
| AlembicAgent | gate floor = AG validation-floor snapshot gates (235 tests); % coverage NOT MEASURED — Train B fixes the number when it touches Agent gates | AG closeout |
| AlembicDashboard | no coverage config; check = lint+test+typecheck+build | repo scripts |

Rule: floors never go below these measured values; raises land with the
train that measures them (no aspirational numbers — the CO4 lesson).

## 7. Charter drafts (AD2 inputs — drafts, confirmed at AD2)

- **AlembicCore**: knowledge/search/graph/guard/vector/evolution engine +
  persistence + migrations + shared taxonomy/errors. Importable leaf
  `core/` analysis. Must-never: host/UI/transport specifics.
- **Alembic**: resident MCP + HTTP + daemon + CLI host over Core; owns
  routes, injection, sandbox, UI (lib/ui .tsx). Must-never: re-implement
  Core engine capabilities; direct DB schema ownership.
- **AlembicAgent**: LLM provider/tool runtime (V2 catalog, transports,
  classification). Must-never: knowledge persistence; HTTP surface.
- **AlembicDashboard**: zero-dependency UI consumer of the HTTP contract
  via generated types. Must-never: @alembic package imports; business
  logic beyond projection.
- **AlembicPlugin**: Codex/Claude-Code host shells + plugin MCP surface +
  vendored Core runtime + distribution packaging. Must-never: fork Core
  semantics; main-repo route duplication beyond the declared overlay.

## 8. Dashboard type-artifact spec (IC2, Train B)

Generator in Alembic emits `AlembicDashboard/src/generated/api-types.ts`
from Core wire types + provider-contracts route table (KnowledgeEntryWire,
KnowledgeLifecycle, problem envelope, failure-kind enum, route
input/output shapes). Dashboard keeps zero package deps (artifact is
committed text, RC5 pattern). Drift gate in BOTH check pipelines:
regenerate + byte-compare (Alembic side) / hash-compare (Dashboard side).
Hand-written types.ts sections replaced by imports from generated file;
normalizers keep absorbing runtime nulls (their job), not contract drift.

## 9. Artifacts opened elsewhere

- 0.3.0 release-wave ledger:
  [release-wave-0.3.0-ledger-2026-06-12.md](release-wave-0.3.0-ledger-2026-06-12.md)
- Side-effect doctrine standing rule + blessed-singleton whitelist DRAFT:
  doctrine = "no import-time work, no module-scope mutable state, no
  direct singleton reach-through in new/changed code; effects flow through
  injected ports" (AD0 gate adopted as proposed — the AD design text is
  the rule source). Whitelist draft (AD4 confirms): pathGuard,
  timerRegistry, Logger (behind injected port), signalBus, ModelRegistry
  (Agent), drizzle singleton (test-only via stable facade). Everything
  else (incl. getServiceContainer in routes, TOKEN_SECRET import-time
  randomness, SSE/rate-limit maps) is REMEDIATION SCOPE, not whitelist.
- CKG resumption package (SOP host-variable signal lives there).
- MT expectation-sheet skeleton: built by Train H per §3.

## 10. Known OPEN items (owned, none block dispatch)

| Item | Owner |
| --- | --- |
| Candidate-status enum locator | Train A (IC1) |
| Agent classifyLlmError integrate-vs-document | Train A (IC4) |
| Claude Code official plugin-spec live verification | P3 CC1 first step |
| Agent coverage % measurement | Train B |
| SN0 Agent/Dashboard camelCase re-count | P4 SN0 slim |
| Glossary cross-repo projection | Train A (IC1 doc step) |
