# Alembic Cross-Repository Interface Contract Demand Sequence

Date: 2026-06-09
Status: ready-for-workspace
Owner Window: Design
Receiving Window: Wakeflow
Design Key: alembic-cross-repo-interface-contract-2026-06-09
Source Requirement: `alembic-cross-repo-interface-contract-requirement-design-2026-06-09.md`

## Purpose

Define an ordered sequence of independent Wakeflow demands for the confirmed
Alembic cross-repository interface contract goal. The sequence can be advanced
by unattended Wakeflow automation after controller intake. These are not
dispatch packets by themselves. Total control should claim one independent
demand at a time, create its state root, and then promote task packages only
after checking that state root.

## User Confirmation

The user confirmed that this work should be refined into multiple requirements
so total control can continue claiming and driving the work to completion in
unattended automation mode. The user also clarified that each item may be an
independent demand as long as the order is clear.

## D0-D7 Global User Decisions

The user confirmed all global rules for the full D0-D7 sequence on 2026-06-09:

- Defer version and long-term evolution strategy.
- Preserve full existing functionality; do not reduce scope to a thin minimum
  implementation.
- Delete only after no-consumer proof, replacement evidence where needed, and
  representative validation.
- Preserve only compatibility that has a real current consumer and a
  `currentCompatibilityOwner`.
- Require explicit capability discovery instead of consumer guessing.
- Apply field exposure classes globally; ordinary outputs include only `public`
  and `consumer-needed` fields.
- Use `detailRef` / `artifactRef` for large logs, reports, snapshots,
  diagnostics, and replay payloads.
- Use Test only after product self-verification when D7 still needs independent
  real runtime observation.
- Continue unattended through D0-D7 unless a stop condition is triggered.
- Keep product commits/evidence in product windows; controller owns
  root/Design/ledger docs and final acceptance.

## Unattended Automation Defaults

- Default mode: AFK after controller intake.
- Default completeness rule: this is optimization, not feature reduction. Each
  independent demand must preserve existing functional behavior unless the user
  explicitly approves removal or downgrade.
- Stop for user/controller decision only when P0 evidence changes the confirmed
  five-repository scope, requires deleting a still-owned capability, reveals a
  security/privacy exposure whose product decision is unclear, or conflicts
  with a repository `AGENTS.md` boundary.
- Default contract ownership: producer-owned source files plus a controller
  visible cross-repo registry. Do not centralize every contract in Core.
- Default registry location: workspace ledger/active state root for controller
  tracking, with repo-local contract files as the source of truth where the
  producer owns executable schemas.
- Default Test usage: no Test dispatch until product windows complete their
  self-checks and a real daemon/Dashboard/Plugin/Agent runtime smoke still
  needs independent observation.
- Default consumer order: consumers wait for accepted provider contract
  evidence. Do not let Dashboard, Plugin, or Agent guess future fields.
- Default compatibility rule: no old compatibility layer unless a real consumer,
  removal trigger, and validation path are recorded.
- Default classification rule: every contract must have exactly one primary
  `functionClass` from `package-export`, `rest-query`, `rest-command`,
  `event-stream`, `job-artifact`, `mcp-tool`, `agent-tool`,
  `dashboard-view-model`, or `diagnostic-observability`. Add secondary tags
  only for routing; the primary class controls validation and output shape.
- Default deferred rule: do not design versioning, deprecation windows,
  remove-after dates, breaking-change policy, or long-term evolution strategy
  in this sequence. Record only current active consumers, compatibility owners,
  and cleanup blockers needed for this optimization.
- Default landing dimensions: D0/D1 must record capability coverage,
  capability discovery, error kind, exposure class, artifact policy, fixture
  policy, drift gate, current compatibility owner, and observability keys.
- Default anti-thin rule: no independent demand may complete with an empty API,
  placeholder adapter, docs-only shell, static mock, narrow demo, or minimal
  happy-path implementation. Completion requires representative success and
  non-success behavior evidence for the affected function class.

## Dependency Order

```text
D0 inventory
  -> D1 registry and ADR
      -> D2 Core shared deterministic contracts
      -> D3 Alembic HTTP and event provider contracts
          -> D4 Plugin host/MCP/resident contracts
          -> D6 Dashboard consumer contracts
      -> D5 Agent runtime/tool/provider contracts
          -> D3 Alembic Agent-consumer integration checks
  -> D7 cross-repo acceptance and cleanup
```

D2 and D3 may proceed after D1 if their contract ownership decisions are clear.
D4 and D6 must wait for the relevant D3 provider contract evidence. D5 may
proceed after D1/D2, but Alembic integration checks wait for D5 evidence.

## Independent Demand Definitions

### D0: Full Cross-Repo Contract Inventory

- Type: AFK
- Demand key: `alembic-interface-contract-d0-inventory-2026-06-09`
- Owning window suggestion: AlembicWorkspace controller with read-only evidence
  from AlembicCore, Alembic, AlembicPlugin, AlembicAgent, and AlembicDashboard.
- Blocked by: none after current Design intake.
- User stories covered:
  - As controller, I can see every producer/consumer interface before changing
    any contract.
  - As repository owner, I can confirm which interfaces are mine and which are
    only consumed.
- What changes: no product source changes. Produce an inventory table covering
  package exports/imports, HTTP routes, OpenAPI seed, SSE/Socket/job events,
  MCP tools and output projectors, resident-service clients, Agent tool/runtime
  contracts, Dashboard API client/types/view models, and duplicate legacy
  contract surfaces.
- Observable result: a machine-readable or table-backed contract inventory with
  `contractId`, `functionClass`, `layer`, `producer`, `consumers`,
  `transport`, `schemaSource`, `codeRefs`, `validation`, `legacyDuplicate`,
  `removalRule`, and `risk`.
- Acceptance criteria:
  - Inventory records the existing functional behaviors each interface supports
    before cleanup.
  - Every active cross-repo interface has one producer and at least one named
    consumer, or is marked as orphaned with a deletion candidate.
  - Inventory cites concrete repo-relative file paths.
  - No implementation or cleanup is claimed from inventory alone.
- Validation path: controller raw evidence review, import/route/tool/client
  scans, and workspace docs verification.
- Evidence expected: inventory file, scan commands, raw file references, and
  explicit unknowns.
- Risks: missing dynamic event shapes, hidden CLI consumers, or generated files.
- Why this is a vertical slice: it creates the evidence path required for every
  later producer/consumer change and blocks premature cleanup.

### D1: Contract Registry And Source-Of-Truth ADR

- Type: AFK, HITL only if D0 finds a boundary conflict.
- Demand key: `alembic-interface-contract-d1-registry-adr-2026-06-09`
- Owning window suggestion: AlembicWorkspace controller, with Design only if a
  new product decision is needed.
- Blocked by: D0 inventory.
- User stories covered:
  - As controller, I can route each contract to its producer without ambiguity.
  - As implementer, I know whether the source of truth is OpenAPI, a typed event
    registry, package exports, MCP schema/projector, Agent manifest, or
    Dashboard view-model adapter.
- What changes: create the registry schema, initial registry rows from D0, and
  ADR-style decision record for contract ownership and drift checks.
- Observable result: a controller-visible registry and ADR that name the source
  of truth, validation command, removal blocker, cleanup evidence, and current
  compatibility owner for each contract layer.
- Acceptance criteria:
  - Registry separates producer contracts from consumer view models.
  - Registry rows include preserved capability notes or a user/controller
    removal decision reference.
  - Core is not assigned Codex MCP, UI, AI provider, daemon, or tool execution
    ownership.
  - The registry has explicit fields for consumer tests, provider checks,
    capability discovery, error kinds, exposure classes, artifact policies,
    fixture policies, drift gates, observability names, and security/property
    exposure notes.
  - Every registry row maps `functionClass` to a handling rule and validation
    family; no row uses a generic all-purpose output bag.
- Validation path: workspace docs verification, link checks, schema sanity
  check if a JSON registry is created.
- Evidence expected: registry path, ADR path, field definitions, and D0 mapping.
- Risks: registry becomes documentation-only. Mitigation: every row must name a
  validation command or later task package.
- Why this is a vertical slice: it gives the controller an executable routing
  map that downstream windows can use without inventing interface ownership.

### D2: AlembicCore Shared Deterministic Contract Spine

- Type: AFK after D1.
- Demand key: `alembic-interface-contract-d2-core-spine-2026-06-09`
- Owning window suggestion: AlembicCore.
- Blocked by: D1 registry/ADR for Core-owned rows.
- User stories covered:
  - As Alembic, Plugin, Agent, or Dashboard, I can import stable deterministic
    runtime/project/job contracts through public Core exports only.
  - As Core maintainer, I can reject host/UI/MCP/AI responsibilities.
- What changes: tighten Core public exports, validators, runtime/project/job
  DTOs, contract tests, and import-boundary checks for shared deterministic
  contracts identified by D0/D1.
- Observable result: consumers have a stable Core contract spine and cannot
  reach into Core internals or force unrelated host/UI/AI shapes into Core.
- Acceptance criteria:
  - Existing Core-owned consumer behavior remains covered; cleanup does not
    narrow the public surface to only a minimal import path.
  - Every Core-owned contract has export path, schema/type owner, consumers,
    validation, and removal/compatibility rule.
  - No Codex MCP, Dashboard UI state, AI provider runtime, CLI daemon behavior,
    or Agent tool execution moves into Core.
  - Boundary tests cover both accepted public exports and rejected internal
    imports where feasible.
- Validation path: AlembicCore `npm run build:check`, tests/check script used by
  the repo, package export tests, and consumer import-boundary lint if present.
- Evidence expected: code diff, export map diff, tests, command output, and
  downstream consumer notes.
- Risks: adding a shared contract before there are two real consumers.
- Why this is a vertical slice: it creates a real producer contract consumed by
  later Alembic, Plugin, Agent, or Dashboard work, with tests and boundaries.

### D3: Alembic HTTP, Runtime, And Event Provider Contracts

- Type: AFK after D1, with D2 dependency for Core-backed DTOs.
- Demand key: `alembic-interface-contract-d3-alembic-provider-2026-06-09`
- Owning window suggestion: Alembic.
- Blocked by: D1 registry/ADR and any D2 Core DTO evidence needed by routes.
- User stories covered:
  - As Dashboard and Plugin, I can consume Alembic daemon/API/event contracts
    from a checked provider source instead of guessing response shapes.
  - As Alembic maintainer, I can expose `/api/v1`, runtime, job, and event
    contracts without leaking internal store objects.
- What changes: align `/api/v1` route schemas, OpenAPI coverage, SSE/Socket/job
  event manifest or typed event registry, daemon health/runtime contracts, and
  provider fixture generation for real consumers.
- Observable result: Alembic becomes the checked provider for REST and event
  contracts consumed by Dashboard and Plugin.
- Acceptance criteria:
  - Existing Alembic API/event/runtime behavior remains available through clean
    contracts, not reduced to a subset of easy routes.
  - OpenAPI or equivalent checked schema covers active `/api/v1` consumer
    routes.
  - Event registry covers active SSE, Socket.io, and job lifecycle events.
  - Provider fixtures include success, failure, partial, cancellation, and
    unavailable-runtime cases where routes/events support them.
  - Internal stores and implementation-only fields are not public contracts.
- Validation path: Alembic `npm run check`, route/schema tests, OpenAPI
  generation or diff check, event registry tests, and focused daemon/job smoke
  when supported by the repo.
- Evidence expected: provider schema files, event registry, route tests,
  generated spec/diff output, and consumer fixture notes.
- Risks: event shapes hidden in runtime callbacks. Mitigation: D0 must include
  dynamic event source scans and D3 must add replayable fixtures.
- Why this is a vertical slice: it gives downstream Plugin and Dashboard real
  provider contracts with runnable validation before consumer cleanup.

### D4: AlembicPlugin Host, MCP, And Resident-Service Contracts

- Type: AFK after D2/D3 provider evidence.
- Demand key: `alembic-interface-contract-d4-plugin-host-mcp-2026-06-09`
- Owning window suggestion: AlembicPlugin.
- Blocked by: D2 Core contract rows used by Plugin, D3 resident-service/API
  provider contracts, and the existing MCP clean-output contract evidence.
- User stories covered:
  - As Codex host agent, I receive clean per-tool MCP structured output without
    unrelated fields or compatibility bags.
  - As Plugin maintainer, I consume Alembic resident-service contracts through a
    typed client rather than copying backend internals.
- What changes: align MCP input/output schemas, per-tool projectors, clean
  result envelopes, resident-service client DTOs, tool catalog contracts,
  missing-projector fail-closed behavior, and contract tests.
- Observable result: Plugin exposes host-friendly MCP contracts and consumes
  Core/Alembic provider contracts without leaking raw provider shapes.
- Acceptance criteria:
  - Existing Plugin host-facing capabilities remain available through clean
    per-tool contracts.
  - Every active MCP tool has a tool-specific output schema/projector.
  - No global `refs`/diagnostic bag returns fields a tool does not need.
  - No old bad-field compatibility is preserved without a named consumer and
    removal trigger.
  - Resident-service client tests replay Alembic provider fixtures.
- Validation path: AlembicPlugin `npm run build:check`,
  `npm run lint:repo-boundary`, MCP contract tests, missing-projector tests, and
  `npm run smoke:codex-plugin` when scope requires.
- Evidence expected: per-tool schema/projector matrix, tests, smoke output, and
  consumer fixture mapping.
- Risks: treating MCP inventory as completion. Mitigation: every tool must have
  changed or verified clean output behavior.
- Why this is a vertical slice: it completes a real host-facing path from
  Alembic provider contracts through Plugin MCP output to Codex consumers.

### D5: AlembicAgent Runtime, Tool, And Provider Contracts

- Type: AFK after D1/D2.
- Demand key: `alembic-interface-contract-d5-agent-runtime-tools-2026-06-09`
- Owning window suggestion: AlembicAgent.
- Blocked by: D1 registry/ADR and D2 Core deterministic contracts used by Agent.
- User stories covered:
  - As Alembic runtime, I can call Agent through stable runtime/tool/result
    contracts.
  - As Agent maintainer, I can evolve AI providers and tool routing without
    leaking provider-specific implementation details.
- What changes: align Agent tool manifests, tool execution request/response
  envelopes, provider adapter contracts, host adapter contracts, cancellation,
  timeout, permission denial, partial result, and error classification paths.
- Observable result: Agent has a checked public runtime/tool contract consumed
  by Alembic and protected from provider-specific drift.
- Acceptance criteria:
  - Existing Agent runtime/tool/provider behavior remains available through
    explicit result branches.
  - Tool result envelopes cover success, failure, cancellation, timeout,
    permission denial, and partial results.
  - Provider adapter fields are not exposed as public runtime contracts unless
    intentionally mapped.
  - Alembic integration seam is named and ready for D3 follow-up checks.
- Validation path: AlembicAgent `npm run check`, public API boundary lint,
  tool/router tests, result-envelope tests, mock-provider tests, and targeted
  Alembic consumer seam check after Agent evidence is accepted.
- Evidence expected: manifest/result envelope files, adapter tests, provider
  mock output, and Alembic consumer notes.
- Risks: tool contracts become too generic to validate. Mitigation: require
  concrete example fixtures for every result branch.
- Why this is a vertical slice: it gives Alembic a real Agent consumer path with
  validated success and failure semantics.

### D6: AlembicDashboard Consumer Contract And View-Model Cleanup

- Type: AFK after D3 provider evidence.
- Demand key: `alembic-interface-contract-d6-dashboard-consumer-2026-06-09`
- Owning window suggestion: AlembicDashboard.
- Blocked by: D3 HTTP/event provider contracts and fixtures.
- User stories covered:
  - As Dashboard user, I see stable UI behavior backed by provider contracts,
    not stale frontend-only assumptions.
  - As Dashboard maintainer, I can adapt backend DTOs into explicit view models
    without making frontend types the backend source of truth.
- What changes: replace or check manual API normalization against Alembic
  provider schemas/fixtures, create explicit view-model adapters, event
  consumer tests, runtime diagnostics contract tests, and UI state handling for
  loading/empty/error/partial/unavailable cases.
- Observable result: Dashboard consumes checked Alembic provider contracts and
  isolates presentation-only shapes at the view-model edge.
- Acceptance criteria:
  - Existing Dashboard user-visible behavior remains available after client and
    view-model cleanup.
  - Dashboard API client is generated from or tested against provider schemas
    and fixtures.
  - Frontend view-model types are clearly presentation contracts, not backend
    truth.
  - Event consumers replay provider event fixtures.
  - Unknown diagnostic fields are handled intentionally, not leaked as public
    contract guarantees.
- Validation path: AlembicDashboard `npm run check`, contract tests,
  typecheck/build, event replay tests, and browser verification only when UI
  behavior changes.
- Evidence expected: client/view-model diff, provider fixture tests, build
  output, and browser evidence if applicable.
- Risks: generated types are accepted without runtime fixture coverage.
- Why this is a vertical slice: it completes the user-visible API/event path
  from Alembic provider contracts to Dashboard presentation behavior.

### D7: Cross-Repo Acceptance, Drift Gates, And Legacy Cleanup

- Type: AFK after D2-D6, HITL only for scope-changing deletion.
- Demand key: `alembic-interface-contract-d7-acceptance-cleanup-2026-06-09`
- Owning window suggestion: AlembicWorkspace controller, product windows for
  repo-owned fixes, Test only for final real-runtime observation if required.
- Blocked by: accepted evidence from D2, D3, D4, D5, and D6.
- User stories covered:
  - As user, the multi-repo interface cleanup is complete, connected, and
    verifiable across real producer/consumer paths.
  - As controller, I can detect contract drift before accepting completion.
- What changes: run cross-repo contract drift checks, import-boundary scans,
  build/check matrix, provider/consumer contract replay, deletion of replaced
  duplicate contracts, and final real runtime smoke where justified.
- Observable result: the final demand can be accepted with raw evidence, not
  docs-only or target backfill.
- Acceptance criteria:
  - Final review proves feature preservation across the full sequence, not only
    contract shape cleanup.
  - All registry rows have producer evidence, consumer evidence, validation
    output, and deletion/compatibility status.
  - Cross-repo builds/checks pass or failures are classified with repair tasks.
  - Replaced duplicate contracts are deleted only after import scans,
    replacement entrypoints, and representative validation pass.
  - Final acceptance includes at least one real end-to-end path for CLI/daemon
    or API, Plugin MCP, Agent tool/runtime, and Dashboard consumer behavior.
- Validation path: controller review pack, per-repo validation matrix,
  contract replay/drift checks, workspace verification, and optional Test card
  for real runtime observation.
- Evidence expected: review pack, registry final state, command outputs, smoke
  logs, deletion scans, and controller decision records.
- Risks: target windows report success without raw artifacts. Mitigation:
  controller acceptance must inspect files, command output, fixtures, and real
  consumer behavior before completion.
- Why this is a vertical slice: it closes the full confirmed user goal across
  all producers, consumers, validation gates, and cleanup rules.

## Controller Promotion Checklist

- Promote D0 first. Do not dispatch D2-D6 before D0/D1 evidence exists unless a
  package is explicitly read-only.
- Each promoted task package must include identity gates for the target window,
  target repository `AGENTS.md`, current state root, non-goals, file boundary,
  validation path, and backfill requirements.
- Keep producer/consumer dependencies explicit. Downstream consumers wait for
  accepted provider evidence.
- After each target result, reduce and review raw evidence before continuing.
- If an independent demand finishes with new TODOs, route them only if they
  advance this final completion definition.
- Do not archive the parent demand until D7 acceptance is complete.

## Suggested Controller Next Action

Attach this slicing artifact to the existing state root, then create the first
claimable controller package for D0 inventory. If D0 and D1 complete without
scope-changing blockers, total control may continue through D2-D7 in dependency
order without asking the user again.
