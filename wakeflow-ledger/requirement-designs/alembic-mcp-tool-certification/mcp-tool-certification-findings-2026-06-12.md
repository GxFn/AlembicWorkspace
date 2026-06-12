# Alembic MCP Tool Certification Findings

Status: evidence base / Design-window structural census (no runtime invocation)
Date: 2026-06-12
Audited Heads: Alembic AO-final, AlembicPlugin `838da9e` (committed state; CKG in flight)
Design Key: alembic-mcp-tool-certification

User-reported symptoms driving this demand: agents still misuse tools
(使用错误) and some tool outputs are far too large (内容量很多). This
findings file records the structural facts; MT0 collects the runtime
evidence (the Design window does not invoke product runtimes).

## T1. The Tool Population (audit-time counts; MT0 re-freezes)

- Plugin Codex surface: 40 tools (18 codex-local + 22 plugin-embedded)
  per `PluginToolSurfaceCatalog`; canonical source-graph subset of 9 is
  CKG4 territory.
- Alembic resident surface: 17 tools (`lib/resident/tool-schema/tools.ts`).
- 15 names exist on both surfaces with 5 known schema/semantic
  divergences (guard, submit_knowledge, rescan, dimension_complete,
  knowledge_lifecycle) — surface-duality resolution is IC5 scope; this
  demand certifies per-tool quality on whatever surface ships.

## T2. Output-Size Discipline Is Ad-Hoc, Not Budgeted

- Plugin handlers cap content with scattered hardcoded slices —
  `agent-public-tools.ts` carries `slice(0, 8/20/40)` magic numbers and a
  240-char title truncation; `core-tools/output.ts` defines
  `maxChars`/`truncated` field slots but no per-tool budget policy.
- Resident handlers use per-handler `contentMaxLines` with `truncated`
  flags (guard.ts:691, structure.ts:287).
- No unified per-tool output budget, no measured size baselines, and no
  pagination/artifact-ref overflow route in handlers (the only
  artifact-ref hit is in error-taxonomy). Large results either flood the
  context or get silently sliced by magic numbers — both match the
  user-reported symptoms.

## T3. Usage-Error Surface (structural contributors)

- Tool descriptions vary in quality; the CKG tool-to-information matrix
  (what the tool answers / inputs / what it cannot prove / when to use)
  exists as design, not as a per-tool enforced description standard.
- 3 resident gateway mappings are resolver closures (not statically
  auditable); resident tool args historically bypassed schema validation
  (AO3 added validation — MT0 verifies actual coverage per tool).
- Multi-operation tools (action/mode unions) concentrate misuse risk:
  free-string modes, optional-but-actually-required fields, and
  errors without next-action guidance predate the D25 problem patterns
  on some paths.
- Real misuse evidence exists and must be collected, not invented: the
  2026-06-11 live cold-start observation, CKG run transcripts, and
  controller MCP smokes recorded actual wrong-tool/wrong-args/wrong-
  expectation cases.

## T4. Existing Contracts To Certify Against (not reinvent)

- D22 per-tool clean output contracts, D24 consumer-driven fixture
  replay, D25 error/problem taxonomy, D26 capability discovery — the
  completed interface-contract sequence defines what "clean" means.
- CKG1/CKG4 (in flight) define the cold-start tool catalog and the
  canonical source-graph tool outputs.
- The certification question per tool is therefore: does the SHIPPED
  behavior match the ALREADY-DEFINED design expectation — connectivity,
  completeness, edges, size, ergonomics — and is the tool worth its
  place.

## T5. Cross-Demand Boundary Notes

- IC5 owns duality (definition source for shared names); CKG4 owns the
  source-graph tool catalog; CC owns host packaging. This demand
  certifies per-tool quality and may PROPOSE merge/deprecate candidates,
  routed as per-item user decisions — it deletes nothing itself.
- Plugin hands-off: invoking the committed Plugin MCP server for audit
  is allowed (read-only runtime calls, CO-precedent smoke); Plugin CODE
  fixes are post-CKG; source-graph-tool findings are handed to CKG4 via
  the controller while CKG runs.
- Resident/embedded fixes (Alembic repo) can proceed immediately.
