# Alembic Codex Cold Start Knowledge Graph Experience

Status: PAUSED by user decision 2026-06-12 — paused at the CKG1/CKG2/CKG3 landed point (onboarding contract `838da9e`, source-graph lifecycle Core `68f7ad5`, evidence gates `ef90c9b`); CKG4-CKG7 including the real host-agent cold-start acceptance are deferred to a later user-decided resumption. The controller executes the pause: stop CKG dispatch, verify the Codex window quiesced and the Plugin tree clean/pushed, and open the resumption package (Train H tool findings, the duality-resolved surface from the P3 train, the SOP host-variable signal, MT certification state feed in). Plugin hands-off lifts once the pause is verified clean.
Maintained Window: AlembicWorkspace
Date: 2026-06-11 (code-fact verification 2026-06-12; paused 2026-06-12)
Design Key: alembic-codex-cold-start-knowledge-graph-experience

## Controller Judgment

The user wants AlembicPlugin to become a practical Codex entrypoint for creating
an Alembic project knowledge base from a cold start, then using source graph /
syntax relationship capabilities to help the host agent produce better Recipes.

This is not a request to replace Recipe generation with a graph database. The
required direction is a layered system:

```text
Codex user action
  -> AlembicPlugin MCP cold-start/onboarding
  -> AlembicCore source graph and project intelligence facts
  -> host-agent Recipe production with verifiable source evidence
  -> knowledge/search/prime/Guard/Dashboard use after bootstrap
```

## Entry Points

- Requirement design:
  [alembic-codex-cold-start-knowledge-graph-experience-requirement-design-2026-06-11.md](alembic-codex-cold-start-knowledge-graph-experience-requirement-design-2026-06-11.md)
- Candidate demand sequence:
  [alembic-codex-cold-start-knowledge-graph-experience-demand-sequence-2026-06-11.json](alembic-codex-cold-start-knowledge-graph-experience-demand-sequence-2026-06-11.json)
- Live observation:
  [cold-start-observation-2026-06-11.md](cold-start-observation-2026-06-11.md)
- Domain SOP baseline:
  [domain-sop-baseline-2026-06-12.md](domain-sop-baseline-2026-06-12.md)

## Evidence Baseline

- Current Plugin cold start routes `alembic_bootstrap` through the host-agent
  workflow, performs full project intelligence scanning, returns Mission
  Briefing, and expects Codex to submit knowledge plus complete dimensions.
- Current Core owns project intelligence phases such as file collection, AST,
  code entity graph, call graph, dependency graph, Guard audit, and Mission
  Briefing construction.
- Current Alembic status already exposes project-scope identity, ghost storage,
  knowledge readiness, daemon jobs, file monitor, Dashboard handoff, and source
  graph schema presence, but the user-facing Codex cold-start experience is not
  yet a clean product workflow.
- The completed CGK track established the architecture direction: source graph
  is the code-fact layer, Recipe remains the higher-level agent judgement layer.
- A live cold-start observation on 2026-06-11 proved that Codex can generate 55
  staged candidates across 17 dimensions, but also exposed product gaps in reset
  semantics, wrong-scope protection, Ghost source graph storage, plugin runtime
  startup, host MCP transport recovery, process-local bootstrap sessions, empty
  source graph tables, weak relation evidence, Project Skill export visibility,
  and staged-vs-active Recipe semantics.
- Controller code review confirmed that the legacy IDE/external-agent path did
  not have a stricter server-side evidence gate. CKG3 must add a new Core-owned
  hard gate for `submit_knowledge` and `dimension_complete`; prompt or Mission
  Briefing wording alone is not a valid repair.
- Controller repair scope now requires `alembic_bootstrap` to return staged
  cold-start guidance: an initial tool-capability briefing, structured
  bootstrap state, and the first domain SOP. Later domain SOPs are returned only
  after the previous domain completes or needs repair. Project architecture
  facts must come from tools such as source graph, knowledge, validation, Guard,
  and Dashboard/progress tools; SOPs tell Codex which tool to use and what
  evidence to extract. A single disconnected prompt is not an acceptable product
  contract.
- `BootstrapPackage` may remain as a compact machine-readable state contract:
  session ref, tool catalog, domain queue, current SOP, hard gates, progress,
  repair/rebuild state, artifact refs, and current-domain next actions. It
  should not become a static project architecture dump.
- Controller tool-surface classification: keep the new Codex-local source graph
  tools as code-fact tools, keep `alembic_graph` only as Recipe/knowledge graph,
  fold standalone `alembic_affected_tests` into `alembic_validation_plan` and
  remove it from the Codex-visible MCP surface unless current external consumer
  proof blocks removal, and remove `alembic_call_context` from Codex source-code
  relationship guidance/routing unless consumer proof blocks removal.
- Controller quality floor: cold-start Recipes must be true, source-grounded,
  content-rich, future-actionable, and useful as guidance for later Codex
  agents. Generic advice, fake snippets, shallow duplicate candidates, weak
  source refs, and relationship claims without evidence are not acceptable
  bootstrap output.
- Controller interaction model: CKG should implement cold start as staged domain
  SOP flow by default. Every stage must preserve the same hard gates:
  orientation, domain analysis, candidate judgement, submission, dimension
  completion, next-domain handoff, repair/rebuild, resume, and final review.
- Controller rebuild rule: weak, generic, fake, shallow, source-mismatched, or
  non-actionable Recipes are rejected before persistence and returned with a
  domain-specific rebuild instruction. Rejected candidates do not count toward
  `dimension_complete`.
- Controller real-agent acceptance rule: CKG7 must use a real Codex agent
  cold-start run with raw tool outputs, transcript evidence, Recipe sample
  audits, and repeat-after-rework proof when quality is below contract. Scripted
  MCP clients and manual stdio probes may supplement diagnostics, but they do
  not replace real agent acceptance.
- Code-fact verification 2026-06-12 (Plugin `7382c62`, Core `ed42960`, Alembic
  resident surface `5decbd7`, Dashboard `11c2c61`) confirmed all design code
  anchors and corrected the baseline: Core already ships the source graph
  schema (migration 010) and `SourceGraphIndexer` with full/incremental build
  plus freshness inspection, and the Plugin codex-local tools already query
  the durable tables through Core `SourceGraphService` — CKG2 is completion
  and wiring (Ghost/PathGuard, cold-start trigger, startup catch-up,
  durable-population proof), not a from-scratch build.
- Verified tool surface: 40 Codex-visible tools (18 codex-local + 22
  plugin-embedded-core). `alembic_status` does not exist — the real names are
  `alembic_codex_status` / `alembic_health`; the Decision Register tool is
  `alembic_decision_record`.
- The bootstrap dimension model diverges across surfaces: resident
  `alembic_bootstrap` text advertises 8 dimensions x 3 tiers, the 2026-06-11
  live run checkpointed 17 dimensions, Dashboard `DIMENSION_EXECUTION_ORDER`
  lists 23. CKG0 must reconcile one canonical model before CKG1 presents the
  domain queue.
- Dimension completion weakness is now pinned to exact code: `candidateCount`
  prefers the caller value (`HostAgentDimensionCompletionWorkflow.ts:224`),
  success returns even when `qualityReport.pass` is false, and the host-agent
  bootstrap session is in-memory with a 2-hour TTL and no restart recovery.
- 2026-06-12 design supplement (user-confirmed): canonical Core-owned dimension
  model; project-scoped bootstrap single-writer lease across the three real
  entrypoints with a `bootstrap_in_progress` state; SOP keeps LLM participation
  within state-grounded, budgeted, schema-testable sections while gates stay
  code-enforced; generation-bound stale-evidence lifecycle after rescan;
  reconstruction-based session recovery with activity-sliding TTL; knowledge
  reset operation contract (scopes, backup with restore ref, Ghost-aware,
  idempotent); reuse of the D25 error/problem taxonomy and the existing job
  process event stream; three-layer measurable quality rubric with diversity
  check and live-run-baseline floors; quantified CKG7 sample audit; dispatch
  recommendation CKG2 before CKG1; graph-first default with marked raw-read
  fallback; Test-owned sample project; Dashboard scope = BootstrapProgressView
  increment; `alembic_graph` keeps its name. Remaining open: graph storage
  ownership (CKG0 probe added), optional CKG1 split.
- 2026-06-12 (late) SOP route clarified and closed: "LLM participation" means
  LLM-assisted authoring of authoritative, multi-language SOP content at
  design time; runtime renders templates plus bootstrap state (no server-side
  LLM call, default route stays provider-free). Authoritative content
  baseline: [domain-sop-baseline-2026-06-12.md](domain-sop-baseline-2026-06-12.md)
  — seven domain playbooks with tool sequences, evidence rules, rejection
  examples, completion criteria, plus TypeScript/Swift/Python overlays,
  compact Go/Rust/JVM overlays, a generic fallback overlay, and
  rendering/budget rules. CKG1 implements the SOP pack from this baseline.
- 2026-06-12 (late) guidance inheritance confirmed: the strict main-path
  Recipe guidance already lives in Core (`DimensionSop.ts` three-phase SOPs,
  `SHARED_SUBMIT_CHECKLIST`, `PRE_SUBMIT_CHECKLIST`) and the host briefing
  already consumes it via `MissionBriefingBuilder.ts` (min 3 / target 5
  candidates per dimension, per-candidate >=3 file refs, full relative path +
  line citations, cross-dimension dedup, dimension-complete floors). CKG1's
  staged SOPs must inherit this floor per domain without regression; CKG3
  promotes it to kind-aware enforced floors (pattern/rule cross-module claims
  >=3 distinct file refs or declared narrower scope; fact >=1 precise ref;
  padding refs fail snippet/validity checks).

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 1 | `alembic-codex-cold-start-knowledge-graph-experience-ckg0-current-flow-and-user-scenario-baseline-2026-06-11` | AlembicWorkspace | Reconfirm current cold-start, source graph, project scope, knowledge, Dashboard, daemon, and Codex plugin paths against real code and raw runtime probes. |
| 2 | `alembic-codex-cold-start-knowledge-graph-experience-ckg1-codex-onboarding-and-tool-choice-contract-2026-06-11` | AlembicPlugin | Design and implement a clean Codex-facing cold-start/onboarding contract: status, init, bootstrap state, graph readiness, MCP tool capability catalog, staged SOP pack, domain queue, gates, session, and required next actions. |
| 3 | `alembic-codex-cold-start-knowledge-graph-experience-ckg2-source-graph-lifecycle-and-freshness-core-2026-06-11` | AlembicCore | Make source graph initialization, full index, catch-up, incremental sync, freshness state, stale-file reporting, and query contracts first-class Core capabilities. |
| 4 | `alembic-codex-cold-start-knowledge-graph-experience-ckg3-bootstrap-to-recipe-production-integration-2026-06-11` | AlembicPlugin + AlembicCore | Integrate bootstrap gates, staged domain SOPs, source graph evidence, dimension plans, source refs, rebuild-required rejection, and hardened `submit_knowledge` / `dimension_complete` into a reliable Codex Recipe production loop. |
| 5 | `alembic-codex-cold-start-knowledge-graph-experience-ckg4-relationship-tool-surface-clean-output-2026-06-11` | AlembicPlugin | Expose project syntax relationship tools with compact, per-tool clean outputs, and delete stale overlaps from the CKG surface: primary status/explore/search/node/callers/callees/impact/validation-plan, affected-tests folded into validation-plan unless blocked by external consumer proof, call-context removal unless blocked by external consumer proof, and graph-vs-source-graph separation. |
| 6 | `alembic-codex-cold-start-knowledge-graph-experience-ckg5-knowledge-use-after-bootstrap-2026-06-11` | AlembicPlugin + AlembicCore | Ensure `intent -> prime -> search/structure/graph -> work -> Guard -> decision` can use both Recipe knowledge and source graph evidence without mixing their responsibilities. |
| 7 | `alembic-codex-cold-start-knowledge-graph-experience-ckg6-dashboard-and-progress-observability-2026-06-11` | AlembicDashboard + Alembic | Show cold-start progress, source graph freshness, dimension completion, Recipe evidence coverage, stale/drift states, and actionable recovery paths. |
| 8 | `alembic-codex-cold-start-knowledge-graph-experience-ckg7-real-codex-cold-start-acceptance-2026-06-11` | AlembicWorkspace + Test as assigned | Validate from a real Codex agent/plugin cold start: install/start, status, bootstrap, knowledge creation, dimension completion, graph queries, Recipe quality, rescan after edit, Dashboard review, failure branches, and repeat-after-rework when the generated knowledge is not good enough. |

## Stop Conditions

- The flow only creates an empty MCP route, type contract, or Dashboard mock
  without a real Codex cold-start knowledge-creation loop.
- `alembic_bootstrap` only returns revised prompt wording, or returns a briefing
  that is not backed by structured tool capability catalog, staged SOP pack,
  domain queue, hard gates, session, progress, repair/rebuild state, and
  current-domain next actions.
- Source graph tools return large raw dumps, unstable internal fields, or stale
  facts without freshness warnings.
- Bootstrap or skill guidance advertises `alembic_graph` as source-code proof,
  keeps `alembic_call_context` as an equal Codex source-graph path, or keeps
  `alembic_affected_tests` as primary without consumer proof.
- Recipe production loses source evidence, dimension completion, Guard, Decision
  Register, or prime/search behavior.
- Codex-generated Recipes are generic, thin, fake-snippet-based, weakly cited,
  duplicate, or not useful as future-agent guidance.
- The implementation treats CodeGraph-style facts as automatic Recipe decisions.
- The user can run `alembic_bootstrap` but cannot tell what to do next, what was
  indexed, what knowledge was created, or which relationship tools are safe to
  trust.
- Validation does not include a real Codex/plugin scenario with raw MCP outputs
  and post-bootstrap knowledge/graph checks.
- CKG7 tries to accept a one-shot smoke even though the real Codex agent output
  is generic, weakly sourced, hard to reuse, or below the Recipe quality
  contract.
