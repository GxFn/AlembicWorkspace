# Alembic Cold-Start Domain SOP Baseline

Status: design asset / user-requested 2026-06-12 / consumed by CKG1
Date: 2026-06-12
Design Key: alembic-codex-cold-start-knowledge-graph-experience
Maintained Window: AlembicWorkspace (Design-authored, LLM-assisted)

## Purpose And Consumption Contract

This document is the authoritative content source for the staged domain SOPs
that `alembic_bootstrap` returns to the Codex host agent. The user decision of
2026-06-12 set the route: SOP content is authored and maintained at
design/development time with LLM assistance and industry best-practice
grounding; the runtime renders SOPs from these playbooks plus real bootstrap
state (project identity, language stats, tool catalog, gates, progress); the
host agent consumes them. There is no runtime server-side LLM call on the
default provider-free route.

Consumption rules:

- CKG1 implements the SOP pack from this baseline. Implementation may
  restructure wording into template fields, but the domain goals, tool
  sequences, evidence rules, rejection examples, and completion criteria here
  are the contract.
- Updating SOP content is a change to this baseline (Design ledger), then a
  template sync in CKG1's implementation — never an edit to rendered output.
- Every SOP step must name a real, currently visible tool. This baseline uses
  only the verified canonical surface (2026-06-12): `alembic_codex_status`,
  `alembic_source_graph_status`, `alembic_code_explore`,
  `alembic_symbol_search`, `alembic_source_node`, `alembic_callers`,
  `alembic_callees`, `alembic_code_impact`, `alembic_validation_plan`,
  `alembic_intent`, `alembic_prime`, `alembic_search`, `alembic_structure`,
  `alembic_submit_knowledge`, `alembic_dimension_complete`. Removed or
  to-be-removed tools (`alembic_call_context`, standalone
  `alembic_affected_tests`) must not appear in SOP content. `alembic_graph`
  is knowledge-graph only and never appears as source-code evidence.
- The canonical dimension model produced by CKG0 maps dimension ids onto the
  seven domains below; this baseline stays at the domain level.

## SOP Architecture

```text
language-neutral core playbook (per domain, this document)
  + per-language overlay(s)          <- selected from project language stats
  + project-type adjustment          <- CLI / server / plugin / library / monorepo
  + bootstrap state injection        <- progress, gates, tool catalog, freshness
  = rendered current-domain SOP
```

- Language overlays are selected from project intelligence language statistics
  collected during cold start. Multi-language repositories compose multiple
  overlays; the SOP must then name which guidance applies to which source
  area.
- Languages without an overlay use the Generic Fallback Overlay and must mark
  reduced confidence explicitly (ties to the `partial`/unsupported freshness
  semantics).
- Project-type adjustment changes emphasis, not structure: a CLI project
  expands D1 entrypoint depth; a library expands D2 public-API depth; a
  server/daemon expands D3 and D6.

## Authoring Principles

Grounded in named industry practice; every domain playbook below applies all
seven:

1. **Evidence first.** No claim without a `file:line` source ref; no
   relationship claim without graph refs (callers/callees/edges) or an
   explicit raw-read fallback note. (Mirrors the CKG3 hard gate.)
2. **Actionable over descriptive.** A Recipe is durable how-to/reference
   knowledge for a future agent, in Diátaxis terms — not an explanation essay.
   Each Recipe needs when-to-apply, when-not-to-apply, and what-to-validate.
3. **Falsifiable completion.** Every domain SOP ends with completion criteria
   a gate can check (counts, coverage, evidence kinds), never "feels
   complete".
4. **Project-specific only.** Generic TypeScript/Swift/Python advice that
   would be true in any repository is rejection material (mirrors the Recipe
   quality contract).
5. **Validation attached.** Every behavioral Recipe names how a change in that
   area should be validated (test level per the test pyramid, existing gate
   scripts, smoke probes).
6. **Explicit uncertainty.** Stale graph, partial parse, or unsupported
   language must be named in the Recipe, not smoothed over.
7. **Config over convention-lore.** When the project carries its own config
   (lint, formatter, tsconfig, CI), cite the config as the rule's source; the
   public style guide is fallback grounding only.

## Evidence Floor — Inherited From The Main Cold-Start SOPs

User-confirmed 2026-06-12: the rendered domain SOPs inherit the strict
guidance that already exists in the main cold-start dimension SOPs. Verified
code anchors (Core `ed42960`):

- `AlembicCore/src/domain/dimension/DimensionSop.ts` — per-dimension
  three-phase SOPs plus `SHARED_SUBMIT_CHECKLIST`: candidate count is decided
  by evidence ("有几条扎实证据就提交几条，不凑数", a dimension with no real
  content submits 0 and skips), content carries correct-vs-forbidden
  (✅ / ❌) framing where applicable, `coreCode` is a copyable complete
  skeleton, and every claim cites concrete file paths and code lines.
- `AlembicCore/src/domain/dimension/DimensionSop.ts` `PRE_SUBMIT_CHECKLIST` —
  MUST floor (markdown >= 200 chars with `(来源: file:line)` source marks,
  `coreCode` 3-8 lines syntactically complete, do/dont/when clauses,
  non-empty `reasoning.sources` and `sourceRefs`), SHOULD floor (single
  knowledge point per candidate, project-real code over pseudocode,
  confidence >= 0.85 before submitting), and FAIL_EXAMPLES (bad/good/why
  pairs).
- `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts`
  — submission spec applied per dimension: minimum 3 / target 5 candidates
  per dimension (1-2 is failing), per-candidate >= 3 file references
  (auto-generated SOP checklist; explicit SOPs carry equivalent per-phase
  evidence outputs such as "每个模式至少有 3 个文件证据，含具体行号"), full
  repo-relative path + line citations as top priority (bare filenames
  forbidden), module attribution per candidate, cross-dimension dedup (hard
  rejection of same-title resubmission), and `dimension_complete` floors
  (referencedFiles, 3-5 keyFindings, analysisText >= 500 chars).

Inheritance rules:

- The playbooks in this baseline ADD tool sequences, source-graph evidence
  routes, and language overlays on top of that floor. They never weaken it.
  If a playbook section here reads weaker than the inherited floor, the floor
  wins and this baseline must be corrected.
- Staged delivery (CKG1) re-renders this guidance one domain at a time; the
  floor travels with each domain SOP instead of arriving once in a giant
  bundle.
- Prompt guidance teaches; gates enforce. CKG3 promotes the numeric floors to
  kind-aware enforcement: `pattern`/`rule` candidates making cross-module
  claims need at least 3 distinct in-scope file refs or an explicitly
  declared narrower (single-file/module) scope; `fact` candidates need at
  least 1 precise ref. Padding refs that do not support the claim fail the
  snippet/validity checks rather than satisfying the count — the
  "不凑数" rule survives enforcement.

## Domain Playbooks

### D1 — Runtime And Entrypoints

- **Goal**: a future agent knows every way this system starts and is invoked,
  and how to add or change an entrypoint safely.
- **Tool sequence**:
  1. `alembic_source_graph_status` — confirm graph freshness before
     relationship claims.
  2. `alembic_code_explore` with entry-oriented queries (main, serve, listen,
     bin, daemon, job, tool registration).
  3. `alembic_symbol_search` for the concrete candidates the overlay names
     (e.g. `bin` entries, route mounts, MCP tool maps).
  4. `alembic_source_node` on each confirmed entrypoint; `alembic_callers` to
     prove what reaches it, `alembic_callees` to prove what it starts.
  5. Targeted raw reads of the package manifest(s) named by the overlay.
- **Extract**: CLI binaries, server listen/mount chains, plugin/MCP tool
  registration, daemon/job/scheduled paths, startup order, environment and
  config gates (required env vars, trusted-root checks), shutdown/disposal.
- **Recipe expectations**: at least one entry inventory (`fact`), one
  startup/lifecycle `pattern`, one `rule` for adding a new entrypoint
  correctly (where to register, what to validate).
- **Evidence**: manifest refs plus code refs with line ranges; caller evidence
  for every "X is invoked by Y" claim.
- **Reject**: an entrypoint list copied from README without code refs; "the
  server starts in index.ts" without the listen/mount chain; generic process
  lifecycle advice.
- **Complete when**: every externally reachable start path is documented with
  evidence, and the add-an-entrypoint rule cites the real registration site.
- **Grounding**: The Twelve-Factor App (processes, port binding,
  disposability); Command Line Interface Guidelines (clig.dev); Model Context
  Protocol spec for tool surfaces.

### D2 — Source Structure And Ownership

- **Goal**: a future agent knows where code belongs, which direction
  dependencies flow, and what is public surface versus internal or generated.
- **Tool sequence**: `alembic_structure` for module metadata;
  `alembic_code_explore` for boundary candidates; `alembic_source_node` +
  dependency edges for direction proof; `alembic_callers` on public-API
  symbols to identify real consumers; raw reads of export manifests the
  overlay names.
- **Extract**: module/package boundaries, dependency direction rules, public
  API surfaces and their consumers, generated/vendor/runtime-cache areas that
  must not be hand-edited, ownership seams (which module owns a concern).
- **Recipe expectations**: architecture-boundary Recipes (`rule`) with
  direction statements ("X must not import Y") backed by edge evidence; a
  placement `rule` ("new Z code belongs in...") naming real precedents.
- **Evidence**: dependency edges or import refs for every direction claim;
  export-manifest refs for public-surface claims.
- **Reject**: a directory listing restated as architecture; boundary claims
  with no counter-example or edge evidence; Clean-Architecture sermons not
  tied to this repository.
- **Complete when**: each top-level module has an ownership statement, the
  dependency direction rule set covers the verified edges, and
  generated/vendor areas are flagged.
- **Grounding**: C4 model (containers/components), arc42 building-block view,
  Architecture Decision Records (Nygard) for boundary decisions.

### D3 — State And Persistence

- **Goal**: a future agent knows what durable state exists, who writes it,
  and how schema or data shape changes are made safely.
- **Tool sequence**: `alembic_symbol_search` for stores, repositories,
  migrations, sessions, caches; `alembic_source_node` on schema/migration
  modules; `alembic_callers` on write paths to prove writers;
  `alembic_code_impact` (advisory) to sketch blast radius of store changes.
- **Extract**: data roots and storage modes, schema/migration mechanism and
  ordering, store ownership (single-writer expectations), session/checkpoint
  lifecycles, caches and their invalidation, idempotency and transactional
  boundaries.
- **Recipe expectations**: a persistence-map `fact`; a migration `rule` (how
  to add one, numbering/ordering, rollback stance); a state-lifecycle
  `pattern` (e.g. session/checkpoint flow) with writer evidence.
- **Evidence**: migration file refs, writer call-chain refs; never claim
  "only X writes this" without a caller scan.
- **Reject**: ORM/database generalities; lifecycle descriptions without the
  actual writer chain; invented rollback procedures.
- **Complete when**: every durable table/file family has an owner and a
  change procedure, and single-writer claims carry caller evidence.
- **Grounding**: evolutionary database design / Refactoring Databases
  (Fowler, Sadalage); idempotency and transactional-boundary practice.

### D4 — Tool Contracts And Outputs

- **Goal**: a future agent knows the public contracts (MCP tools, HTTP APIs,
  CLI outputs), their versioning discipline, and what is public versus
  diagnostic.
- **Tool sequence**: `alembic_code_explore` for schema/contract modules;
  `alembic_symbol_search` for tool definitions, route tables, output
  projections; `alembic_source_node` on each contract module;
  `alembic_callers` to find which surfaces consume shared schemas.
- **Extract**: the real tool/route inventory, input/output schema locations,
  output projection and clean-output rules, error/problem taxonomy and stable
  codes, public-versus-diagnostic field policy, contract change procedure.
- **Recipe expectations**: tool-contract Recipes (`rule`) — how to add or
  change a public tool/route correctly (schema, projection, tests, docs); an
  error-taxonomy `fact` naming the stable codes and their registry.
- **Evidence**: schema definition refs and at least one consumer ref per
  contract; taxonomy refs to the real registry module.
- **Reject**: restating JSON Schema or SemVer doctrine without the project's
  actual mechanism; field inventories with no projection/consumer evidence.
- **Complete when**: every public surface family has a change-procedure
  Recipe and the error-code registry is documented with its enforcement
  point.
- **Grounding**: Semantic Versioning; JSON Schema practice; MCP tool
  definition conventions; API evolution / consumer-driven contract practice.

### D5 — Validation And Safety

- **Goal**: a future agent knows how this project proves a change is safe:
  which tests exist at which level, which gate scripts are mandatory, and
  what a failure means.
- **Tool sequence**: `alembic_validation_plan` (advisory buckets) on
  representative areas; `alembic_symbol_search` for test directories, gate
  scripts, CI configs; `alembic_source_node` on gate scripts to document what
  they actually check; raw reads of CI/check pipelines.
- **Extract**: test taxonomy and where each level lives, mandatory gate
  scripts (boundary lints, smoke probes) and their exact commands, what each
  gate proves and what it cannot prove, security/input-validation chokepoints
  where applicable.
- **Recipe expectations**: validation `rule` per major area ("a change to X
  must run Y; failure of Z means..."); a test-organization `pattern` with
  real examples.
- **Evidence**: gate script refs and command lines; test file refs as
  placement precedents. `alembic_validation_plan` output is advisory input,
  never cited as acceptance.
- **Reject**: test-pyramid theory without the project's actual commands;
  "run the tests" Recipes that do not name the runner, scope, and expected
  signal.
- **Complete when**: every mandatory gate is documented with command, scope,
  and failure meaning, and each major module names its validation route.
- **Grounding**: practical test pyramid (Fowler/Cohn), Google Testing Blog
  test sizes, Google Engineering Practices (review expectations); OWASP ASVS
  spot-grounding for input/authorization chokepoints when present.

### D6 — Failure And Recovery

- **Goal**: a future agent knows how this system degrades, what the stable
  failure states are, and the recovery path for each.
- **Tool sequence**: `alembic_code_explore` for error classification,
  degraded modes, retry/timeout sites; `alembic_symbol_search` for stable
  error codes and recovery commands; `alembic_callers` on failure-state
  constructors to map which paths can enter each state; `alembic_source_node`
  for the recovery/cleanup operations.
- **Extract**: stable failure-state vocabulary (e.g. wrong-scope, stale,
  degraded, blocked families), retry/timeout/short-circuit sites and their
  reasons, diagnostic/log surfaces for each branch, recovery operations and
  their preconditions, what must fail closed versus degrade.
- **Recipe expectations**: failure-semantics Recipes (`rule`) mapping state ->
  meaning -> recovery action -> evidence surface; a degraded-mode `pattern`
  naming the limits that remain usable.
- **Evidence**: refs to the state definitions and at least one producer path
  per state; recovery command refs.
- **Reject**: circuit-breaker/retry doctrine not present in the code;
  recovery steps that bypass forbidden paths (e.g. manual data-root editing).
- **Complete when**: every stable failure state has meaning + recovery +
  evidence surface, and fail-closed boundaries are listed.
- **Grounding**: Release It! (Nygard) stability patterns; Google SRE book
  (observability, runbook framing); Twelve-Factor logs-as-streams.

### D7 — Project Conventions

- **Goal**: a future agent writes code that reads like this project's code:
  naming, comments, error idiom, logging idiom, test naming, file layout.
- **Tool sequence**: raw reads of the project's own config first (lint,
  formatter, language config, editorconfig, CI style jobs);
  `alembic_code_explore` for representative idiomatic modules;
  `alembic_source_node` to capture concrete positive examples;
  `alembic_search`/`alembic_prime` to avoid duplicating already-recorded
  standards.
- **Extract**: enforced rules (from config) versus practiced conventions
  (from code), comment policy, error-handling idiom, logging idiom, naming
  patterns, test naming/structure conventions.
- **Recipe expectations**: coding-standard Recipes (`rule`) each citing the
  enforcing config or two real code precedents; idiom `pattern` Recipes with
  one matching source example.
- **Evidence**: config refs for enforced rules; three distinct file refs for
  practiced-but-unenforced cross-module convention claims (the inherited
  main-path floor — one example is an anecdote); a narrower rule must declare
  its single-file/module scope explicitly.
- **Reject**: public style-guide content the project does not actually
  follow; cross-module convention claims evidenced by one or two files
  without a declared narrower scope; formatting rules already fully delegated
  to a formatter (record the delegation instead).
- **Complete when**: enforced and practiced rules are separated, each with
  evidence, and the "delegated to tooling" set is named.
- **Grounding**: the project's own configs first; per-language official style
  guides (see overlays) as fallback.

## Language Overlays

Overlay selection comes from project intelligence language statistics; a
multi-language repository composes all matching overlays and the SOP names
which areas each overlay governs.

### TypeScript / JavaScript (Node)

- **Inspect**: `package.json` (`bin`, `exports`, `engines`, workspaces),
  `tsconfig.json` strictness and module/resolution flags, ESM-versus-CJS
  reality, path aliases, lint/format configs (eslint, typescript-eslint,
  prettier), test runner (vitest/jest) configuration, async idioms (promise
  handling, AbortController/cancellation), error subclassing and `cause`
  usage.
- **D1 emphasis**: `bin` entries, server `listen`/mount chains, MCP/tool
  registration maps. **D2**: `exports` map is the public surface; deep
  imports are the violation to scan. **D5**: runner config defines test
  scope names.
- **Grounding**: TypeScript Handbook and tsconfig reference; Google
  TypeScript Style Guide; typescript-eslint recommended sets; Node.js ESM
  documentation; npm `exports` documentation.

### Swift

- **Inspect**: `Package.swift` targets/products (or Xcode project targets),
  access control levels (`public`/`internal`/`private`) as the real API
  boundary, protocol-oriented composition, value-versus-reference semantics,
  structured concurrency (`async/await`, actors, `Sendable`), XCTest layout,
  SwiftLint/swift-format configs.
- **D1 emphasis**: `@main`/App entry, scene/lifecycle, executable targets.
  **D2**: target boundaries and access levels are ownership evidence.
  **D6**: cancellation and actor-isolation failures are first-class failure
  semantics.
- **Grounding**: Swift API Design Guidelines (swift.org); Swift Package
  Manager documentation; Swift Concurrency documentation.

### Python

- **Inspect**: `pyproject.toml` (PEP 621 metadata, entry-points, build
  backend per PEP 517/518), typing usage (PEP 484) and checker config
  (mypy/pyright), package manager reality (uv/poetry/pip), `__init__`
  re-export surface, pytest configuration and fixtures, ruff/black configs,
  context-manager and exception idioms.
- **D1 emphasis**: console-script entry-points, `__main__` modules, WSGI/ASGI
  apps. **D2**: `__all__`/`__init__` exports as public surface. **D5**:
  pytest markers and fixture scopes.
- **Grounding**: PEP 8, PEP 484, PEP 517/518/621; Python Packaging User
  Guide; pytest documentation.

### Compact Overlays

- **Go**: `go.mod`, `cmd/` layout for entrypoints, exported-identifier casing
  as public surface, table-driven tests, error wrapping (`errors.Is/As`).
  Grounding: Effective Go; Go Code Review Comments.
- **Rust**: `Cargo.toml` workspaces, `pub` visibility and module tree,
  clippy configuration, `Result`/`?` idiom, feature flags. Grounding: Rust
  API Guidelines; Cargo book.
- **JVM (Java/Kotlin)**: build files (Gradle/Maven) for modules and entry
  tasks, package visibility, exception policy, JUnit layout. Grounding:
  Effective Java (Bloch); official Kotlin coding conventions.

### Generic Fallback Overlay

For languages without a specific overlay: discover the manifest and build
system first; locate entrypoints by build-target declarations and by
`alembic_symbol_search` over common entry tokens; rely on raw reads with
explicit per-claim refs; mark every relationship claim as raw-read fallback;
require the SOP to state reduced confidence and the `partial`/unsupported
graph status when applicable.

## Size Budgets And Rendering Rules

- Initial tool briefing: compact orientation only — identity/scope, gates,
  tool capability matrix, first domain SOP pointer. Budget order of
  magnitude: a few KB, not tens.
- Each rendered domain SOP: one domain (or one small coherent group), with
  the tool subset for that domain only — never the whole catalog repeated.
- Every SOP step is rendered as: tool -> required input -> evidence to
  extract -> stop condition. Free prose may connect steps but cannot replace
  these fields.
- Rendering injects live state (progress, freshness, gate status) from
  bootstrap state; templates never hardcode project facts that tools provide.
- Exact byte budgets are set by CKG1 implementation and asserted in its
  consistency tests; this baseline fixes the structure and the
  one-domain-at-a-time rule.

## Source References

The Twelve-Factor App; Command Line Interface Guidelines (clig.dev); Model
Context Protocol specification; C4 model; arc42; Architecture Decision
Records (Nygard); Refactoring Databases / evolutionary database design
(Fowler, Sadalage); Semantic Versioning; JSON Schema; practical test pyramid
(Fowler, Cohn); Google Testing Blog (test sizes); Google Engineering
Practices; OWASP ASVS; Release It! (Nygard); Google SRE book; Diátaxis
documentation framework; TypeScript Handbook; Google TypeScript Style Guide;
typescript-eslint; Node.js ESM and npm exports documentation; Swift API
Design Guidelines; Swift Package Manager and Swift Concurrency
documentation; PEP 8 / 484 / 517 / 518 / 621; Python Packaging User Guide;
pytest documentation; Effective Go; Go Code Review Comments; Rust API
Guidelines; Effective Java; Kotlin coding conventions.

## Maintenance

- This baseline is the content source of truth; CKG1 templates must stay in
  sync with it, and divergence is a defect.
- Adding a language overlay or domain is a Design-ledger change reviewed at
  controller intake; rendered SOPs are never edited directly.
- Per-project adaptation happens through overlays, project-type adjustment,
  and state injection — not by forking playbook text per project.
