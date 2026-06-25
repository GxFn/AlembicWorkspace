# Alembic Responsibility Governance Cleanup Requirement Design

Status: candidate / needs-controller-intake / no implementation dispatch
Date: 2026-06-13
Design Key: alembic-responsibility-governance-cleanup-2026-06-13
Owner Window: Design
Receiving Window: AlembicWorkspace

## Design Window Boundary

This document is a Design-window requirement design candidate. It is not a
controller state root, task package, TODO update, dispatch packet, acceptance
record, or product-code change.

Design conclusion: the cleanup request is valid, but it should be evidence-led.
The old constitution and developer-RBAC layer can be removed, because the user
confirmed its safety logic has moved into the real feature entrypoints. The
implementation plan must still prove those entrypoint protections before
removing the last effective gate. The real plan should simplify the actor
model, remove developer runtime RBAC, keep host/plugin admin opt-in as a
capability gate, and avoid large naming migration unless G0 finds a concrete
stale naming defect.

## User Intent

The user wants a new cleanup demand for the Alembic-related repositories:

- Alembic mainline should default to an external AI-facing surface.
- AlembicPlugin should default to a host AI plugin surface.
- Developer should not be a runtime permission actor.
- There should be no separate code-logic-management model for developers.
- Existing GitHub/package author metadata is enough for author or maintainer
  attribution.
- Existing constitution, user-responsibility, gateway, and permission concepts
  should be re-evaluated because much of the current wording appears to have no
  useful product meaning.

## User-Confirmed Decisions

Confirmed by the user in this Design conversation on 2026-06-13:

- Use the recommended Option B direction.
- Clean up the constitution safety layer; do not preserve it as a central
  governance mechanism merely because it exists today.
- Before deletion, verify that equivalent safety checks are already present at
  the real feature entrypoints. Any missing protection should be fixed at the
  owning feature entrypoint, not by keeping fake constitution authority.
- Treat naming as already largely unified. Run a narrow G0 naming check, but do
  not create a broad naming migration unless evidence shows a real stale
  contract.
- Use the recommended first-wave scope: Alembic and AlembicPlugin first.
  AlembicCore, AlembicAgent, and AlembicDashboard are read-only/evidence-based
  follow-ups unless G0 proves an active contract dependency.
- Treat Dashboard text alignment as a follow-up after backend contract cleanup
  by default, not a blocker for first-wave backend responsibility cleanup.
- Keep the rest of the recommended model: Alembic mainline defaults to external
  AI; AlembicPlugin defaults to host AI/plugin; developer is package/GitHub
  author or maintainer metadata only; plugin admin mode remains explicit
  capability opt-in rather than developer identity.

## Problem Statement

The current governance model is inconsistent with the desired product model.
The most visible mismatch is a runtime `developer` role with wildcard access,
plus `contributor` and `visitor` roles, in a system that should not model
developers as product actors. At the same time, several files named
`Constitution`, `Gateway`, or `PermissionManager` are wired into real bootstrap,
route, test, and audit paths. This does not mean the central constitution layer
is product-meaningful; it means cleanup has to prove that its remaining useful
safety checks are already owned by real feature entrypoints before removing it.

Therefore the demand should be framed as:

1. Replace the old actor/responsibility vocabulary.
2. Remove developer runtime permission management.
3. Remove the central constitution safety layer once entrypoint protection is
   verified.
4. Prove every deletion with import, route, test, and consumer evidence.

## Evidence Baseline

Source-graph status was stale during this Design pass for both Alembic and
AlembicPlugin, so this document relies on raw file reads and text search rather
than source-graph text.

Confirmed raw code facts:

- Both `Alembic/package.json` and `AlembicPlugin/package.json` already carry
  `author: "gaoxuefeng"`. This supports the user's point that maintainer
  attribution does not need a new runtime model.
- `Alembic/config/default.json` and `AlembicPlugin/config/default.json` both
  load `./config/constitution.yaml` with `strictMode: true` and enable
  `USE_NEW_GATEWAY`.
- `Alembic/lib/Bootstrap.ts` and `AlembicPlugin/lib/bootstrap.ts` both load
  `Constitution`, create `ConstitutionValidator`, create `PermissionManager`,
  create `Gateway`, and inject these dependencies into the gateway.
- `Alembic/config/constitution.yaml` and
  `AlembicPlugin/config/constitution.yaml` define `external_agent`,
  `chat_agent`, `contributor`, `visitor`, and `developer`; `developer` has
  wildcard `*` permissions and requires `git_write`.
- `PermissionManager` is a real runtime gate based on `(actor, action,
  resource)` and explicitly treats wildcard permission as admin access.
- `Gateway` is a real runtime pipeline: `validate -> guard -> route -> audit`.
  Its guard step invokes both `PermissionManager.enforce(...)` and
  `ConstitutionValidator.enforce(...)`.
- `ConstitutionValidator` currently enforces four data-safety rules:
  destructive operations need confirmation, candidate/Recipe creation needs
  content, AI cannot directly create or approve Recipe, and batch operations
  need authorization.
- `Alembic/lib/http/middleware/roleResolver.ts` still maps runtime requests to
  `visitor`, `developer`, and trusted header roles. Without a probe it defaults
  local requests to `developer` for backward compatibility.
- Some Alembic HTTP routes still check developer-like roles directly, for
  example AI config update and monitoring reset/clear routes.
- AlembicPlugin already has a more appropriate host-plugin model in
  `lib/runtime/ToolPolicy.ts` and `lib/runtime/runtime/RuntimeContext.ts`:
  default MCP tier is `agent`; `admin` is effective only when both tier and
  explicit admin opt-in are set.
- AlembicPlugin preflight hides admin tools with
  `CODEX_ADMIN_OPT_IN_REQUIRED`. This is a capability/session gate, not a
  developer identity model, and should be retained or renamed carefully.
- A narrow naming check found existing naming lint configs in Alembic and
  AlembicPlugin, plus a plugin runtime naming ruling from 2026-06-13. The
  current evidence supports the user's view that this demand does not need a
  broad naming cleanup.
- AlembicAgent explicitly owns internal Agent/tool permission policy, tool
  execution, provider adapters, and host adapter contracts. That permission
  model is a different product concern and should not be deleted just because
  Alembic mainline developer RBAC is obsolete.
- AlembicCore is the deterministic headless kernel and should not own Codex
  MCP, Dashboard UI, AI provider, internal Agent, or tool system. Core does
  export shared errors and contracts such as `ConstitutionViolation` and
  `developerIdentity`; these require evidence before renaming or deletion.
- AlembicDashboard contains user-facing stale security/RBAC strings, but its
  repository rules say Dashboard mirrors backend contracts and does not own
  backend governance logic. Dashboard cleanup should follow backend contract
  decisions.

## New Responsibility Model

Recommended vocabulary:

| Concept | New Meaning | Runtime Role? |
| --- | --- | --- |
| External AI | Default Alembic mainline-facing actor or adapter. Can read, analyze, submit candidates, and request guarded workflows. | Yes, as an AI actor class. |
| Host AI | Host-managed plugin agent, such as Codex or another plugin host. AlembicPlugin adapts host AI tools to Alembic capabilities. | Yes, as a host/plugin actor class. |
| Maintainer metadata | GitHub/package author, repository owner, release attribution, docs ownership. | No. |
| Admin mode | Explicit elevated session/capability gate for dangerous tools or maintenance actions. | Capability gate, not identity. |
| Human confirmation | Confirmation input for destructive or lifecycle-changing operations. | Event/decision, not developer RBAC. |

Terms to retire from live product semantics unless a real consumer is proven:

- `developer` as wildcard runtime role.
- `contributor` / `visitor` as product-level Alembic responsibility model.
- `git_write` as proof of runtime authorization.
- "only developer can ..." wording.
- "3-role RBAC" or "developer full access" security claims.
- "constitution" as a central safety or authority layer.

Terms that can remain with narrowed meaning:

- `author`, `maintainer`, or `owner` in package metadata, docs attribution,
  GitHub ownership, release notes, or Recipe authorship.
- `permission` inside AlembicAgent tool execution if it is scoped to Agent tool
  policy with real tests and call chains.
- `authorization` for explicit project skill export, admin opt-in, destructive
  confirmation, or host/session capability gates.
- `gateway` only for real routing/audit or AI-provider gateway behavior, not for
  fake constitution authority.

## Option Comparison

### Option A: Docs/config-only wording cleanup

This would rewrite README/help text and maybe `constitution.yaml` comments while
leaving the live `developer` wildcard role and runtime role resolver intact.

Design judgment: not enough. It would preserve the broken behavior under
cleaner words.

### Option B: Policy extraction and vocabulary simplification

This removes `developer` runtime RBAC and retires the central constitution
layer after verifying that real feature entrypoints already enforce the needed
checks. Gateway-like routing and audit can remain only where they are real
transport/routing/audit behavior. Plugin tier/admin visibility remains as
host-tool policy, not developer identity.

Design judgment: recommended and user-confirmed.

### Option C: Delete Gateway, PermissionManager, Constitution, and related tests

This is the fastest cleanup but highest risk. Current code uses those classes in
bootstrap, HTTP middleware, integration tests, request routing, MCP-style
check-only gates, and audit paths. Deleting them without replacements could
remove destructive confirmation, AI Recipe write protection, content checks,
and audit records.

Design judgment: not recommended without a prior replacement design and
consumer-proven deletion table.

## Requirement Design

The accepted demand should produce a scan-backed responsibility cleanup across
Alembic-related repositories.

### Required outcomes

- Alembic mainline presents and enforces an external-AI-first responsibility
  model.
- AlembicPlugin presents and enforces a host-AI/plugin responsibility model.
- Runtime `developer` permission logic is removed or converted to non-identity
  capability gates.
- Package/GitHub author metadata remains the only developer/maintainer
  attribution model unless the user later confirms a separate need.
- Constitution safety logic is removed from the central governance layer after
  G0/G3/G4 prove the equivalent checks live at the owning feature entrypoints.
- Plugin admin opt-in remains a host/plugin capability gate, not a developer
  permission model.
- Naming cleanup is limited to evidence-backed stale labels; no broad naming
  migration is part of this demand by default.
- Any retained old term has a consumer, reason, owner, and cleanup trigger.
- Any deleted term has reference/import/route/test evidence showing no live
  consumer or a verified replacement.

### Non-goals

- Do not rewrite Git history or GitHub attribution.
- Do not create a developer permission product feature.
- Do not delete AlembicAgent tool permission policy solely because Alembic
  mainline developer RBAC is being removed.
- Do not collapse host AI, external AI, admin mode, and human confirmation into
  one actor.
- Do not treat Design recommendations as executable scope before controller
  intake and user/controller confirmation.

## Real Plan Candidate

These are Design phases, not dispatch packages.

| Phase | Purpose | Primary Surfaces | Completion Signal |
| --- | --- | --- | --- |
| G0 | Evidence inventory | Alembic, AlembicPlugin first; Core/Agent/Dashboard read-only as needed | Disposition table with file, symbol/string, type, live consumer, proposed action, risk, and validation. |
| G1 | Model confirmation | Controller plus optional Design follow-up | User-confirmed vocabulary: external AI, host AI, admin mode, human confirmation, maintainer metadata; no broad naming migration by default. |
| G2 | Shared schema and error boundary | Core only if G0 proves shared contracts must change | Rename/delete plan for shared errors/contracts, or explicit retention reason. |
| G3 | Alembic mainline cleanup | Alembic config, templates, bootstrap, HTTP role routes, docs, tests | No runtime `developer` wildcard role; central constitution layer removed or isolated as temporary compatibility; feature entrypoint protections verified. |
| G4 | AlembicPlugin host cleanup | AlembicPlugin config, bootstrap, runtime policy wording, skills, docs, tests | Host AI/plugin model is default; admin opt-in remains capability gate; central copied constitution/RBAC model removed. |
| G5 | Dashboard/user-facing alignment | AlembicDashboard only if backend contract changed | Help/security strings mirror new backend model; no stale 3-role RBAC claims. |
| G6 | Acceptance and retained-exception ledger | Controller review | Raw evidence, passing checks, retained old terms with consumer/reason/cleanup trigger. |

## G0 Inventory Shape

The controller or product windows should produce an inventory with at least:

| Field | Meaning |
| --- | --- |
| repo | Alembic-related repository. |
| path | File path. |
| finding | Exact term, symbol, config role, route check, test expectation, or doc claim. |
| kind | runtime, config, template, generated doc, test, public contract, UI string, archive, vendor snapshot. |
| consumer | Importer, route, test, build script, generated artifact, user-facing page, or none. |
| proposed action | delete, rename, convert-to-policy, keep, exclude-as-history, route-to-other-demand. |
| risk | What could break if changed. |
| validation | Required command/test/review evidence. |

G0 should explicitly separate active source from vendor snapshots, generated
artifacts, old archives, and historical ledger documents.

## Per-Repository Guidance

### Alembic

Likely primary cleanup owner for old developer RBAC.

Candidate actions:

- Replace `developer`/`contributor`/`visitor` runtime roles with external AI,
  admin mode, and confirmation/capability concepts.
- Retire `PermissionManager` and `ConstitutionValidator` from the central
  governance path after route and test replacement proves the real entrypoints
  own equivalent checks.
- Update `roleResolver` and direct route guards so local compatibility no
  longer defaults to `developer` as a full-access identity.
- Update `SetupService`, templates, README, README_CN, and tests that still
  encode the old permission constitution.

High-risk files already seen:

- `config/constitution.yaml`
- `templates/constitution.yaml`
- `lib/Bootstrap.ts`
- `lib/governance/permission/PermissionManager.ts`
- `lib/governance/gateway/Gateway.ts`
- `lib/governance/constitution/ConstitutionValidator.ts`
- `lib/http/middleware/roleResolver.ts`
- `lib/http/routes/ai.ts`
- `lib/http/routes/monitoring.ts`
- `lib/cli/SetupService.ts`
- `test/integration/GatewayChain.test.ts`
- `test/integration/ProbeResolver.test.ts`
- `test/integration/FullFlow.test.ts`

### AlembicPlugin

Likely primary cleanup owner for host AI wording and plugin host policy.

Candidate actions:

- Keep Codex/host plugin default `agent` tier and explicit admin opt-in.
- Remove or rename copied `developer`/`contributor`/`visitor` role matrix if it
  remains active in plugin bootstrap.
- Remove copied constitution safety/RBAC wiring when host/plugin entrypoints
  and MCP preflight policies already own the relevant checks.
- Ensure `admin` tool visibility is described as explicit session capability,
  not developer permission.
- Update plugin skills/docs that say "developer-visible" only when they mean
  visible to the host AI user interface; otherwise rename.
- Keep project-skill export authorization if it is project-scoped write
  authorization, not developer RBAC.

High-risk files already seen:

- `config/constitution.yaml`
- `templates/constitution.yaml`
- `lib/bootstrap.ts`
- `lib/governance/**`
- `lib/runtime/ToolPolicy.ts`
- `lib/runtime/runtime/RuntimeContext.ts`
- `lib/runtime/preflight/Preflight.ts`
- `plugins/alembic-codex/README.md`
- `plugins/alembic-codex/skills/**`
- `test/unit/PermissionManager.test.ts`
- `test/integration/GatewayChain.test.ts`
- `test/integration/ProbeResolver.test.ts`

### AlembicCore

Do not assume Core owns this cleanup. Core should only be touched if G0 proves
shared contracts or shared error names must change.

Candidate actions:

- Review `developerIdentity`, `ConstitutionViolation`, shared source labels,
  and generated manifests.
- Keep deterministic contracts when external repositories still consume them.
- Rename shared terms only with package export and consumer compatibility
  evidence.

### AlembicAgent

Do not delete Agent tool permission policy as part of this demand. Agent owns
tool registry, tool permission, tool execution, provider adapters, and host
adapter contracts. Only wording that falsely models Alembic product developers
should be routed into this cleanup.

### AlembicDashboard

Dashboard should follow backend decisions. Stale UI/help text such as
developer responsibilities, 3-role RBAC, constitution/gateway/security claims,
or admin layer wording should be updated after Alembic/AlembicPlugin contract
changes are confirmed.

## Validation Strategy

Minimum validation should be chosen by the controller and owning repositories,
but the Design recommendation is:

- For G0: raw `rg` inventory plus import/route/test scans.
- For Alembic mainline changes: targeted unit/integration tests around
  removed/replaced governance wiring, real feature entrypoint protections,
  Bootstrap lifecycle, role resolver, HTTP protected routes, and setup/template
  generation; then repository `check` or a controller-approved subset.
- For AlembicPlugin changes: runtime policy/preflight tests, governance tests
  or replacements, plugin verification/smoke checks, shared asset drift checks,
  and skill/doc drift checks.
- For Core changes: package export/type tests and consumer boundary checks.
- For Dashboard changes: type/build plus UI text/contract review; browser
  verification only if UI behavior changes, not for text-only contract cleanup.
- For docs-only changes: `git diff --check` plus any script-readable doc drift
  check owned by the repository.

Validation must prove both sides:

- Removed constitution/developer-RBAC concepts are gone from active behavior.
- Real feature entrypoints still block dangerous writes or require the correct
  confirmation/authorization/admin opt-in after the central constitution layer
  is removed.

## Acceptance Criteria

- The controller has accepted a scan-backed inventory before implementation.
- Runtime `developer` wildcard permission no longer exists in active Alembic or
  AlembicPlugin behavior, unless the user explicitly confirms an exception.
- `git_write` is not used as runtime authorization for developer identity.
- Alembic mainline default responsibility is external AI.
- AlembicPlugin default responsibility is host AI/plugin.
- Admin elevation is an explicit capability/session gate, not a developer role.
- Human approval/confirmation is represented as a decision or authorization
  event, not as developer RBAC.
- Existing package/GitHub author metadata remains intact.
- Central Constitution/Permission-style governance is removed from active
  Alembic and AlembicPlugin behavior, unless a temporary compatibility
  exception is explicitly recorded with owner, reason, and cleanup trigger.
- Gateway-like code remains only where it is real routing/audit/provider-gateway
  behavior, not fake constitution authority.
- Naming remains stable except for evidence-backed stale labels found by G0.
- Deleted code has no active imports/routes/tests, or has a verified
  replacement path.
- Representative checks pass for every touched repository.
- Dashboard/user-facing claims no longer advertise stale 3-role RBAC or fake
  constitution authority.

## Risks

- Removing `developer` or central constitution wiring too early can break local
  HTTP routes, tests, setup generation, and existing compatibility paths.
- Assuming feature entrypoints already own all safety checks without proof could
  remove the last effective protection for a write path.
- Renaming `ConstitutionViolation` or exported Core contracts can break
  consumer package boundaries.
- Plugin admin tier is useful and should not be confused with old developer
  RBAC.
- Dashboard may contain stale text that looks like product policy but is only a
  projection of backend contracts.
- Historical archives and vendor snapshots can create false-positive search
  results; G0 must classify them rather than forcing cleanup of inactive files.

## Remaining Controller Evidence Questions

- Should G3/G4 remove the central governance classes immediately after
  entrypoint evidence, or leave thin compatibility wrappers for one release
  while all callers migrate?
- Which exact feature entrypoints already own destructive confirmation,
  content-required writes, AI Recipe lifecycle restriction, and batch
  authorization?
- Which archives/vendor snapshots are excluded from acceptance scans?

## Recommended Controller Intake

Recommended classification: cross-repository cleanup demand, Design-backed,
needs G0 evidence before task packages.

Recommended first controller action:

1. Reconcile this Design key with any earlier controller-created root for the
   same user request.
2. Open a G0 evidence inventory step focused on active references, real
   entrypoint safety ownership, and a narrow naming verification.
3. Treat the G1 responsibility vocabulary as user-confirmed unless new evidence
   creates a scope-changing decision.

Recommended first dispatchable work after G1:

- Alembic: remove/replace active developer RBAC in the mainline route/policy
  chain and remove the central constitution safety layer after entrypoint
  ownership is proven.
- AlembicPlugin: align copied governance/config/templates with host AI and keep
  admin opt-in as explicit capability gating; remove copied constitution/RBAC
  wiring where MCP/runtime policies already own the behavior.

Forbidden shortcut: deleting every file or symbol containing "gateway",
"permission", "constitution", "developer", or "admin" without proving live
consumer impact and replacement behavior.

## Source References

- User request in this Design conversation on 2026-06-13.
- Active Design rules: `Design/AGENTS.md`,
  `Design/docs/design-window-operating-policy.md`, and
  `Design/docs/workspace-alignment-checklist.md`.
- Current controller status read for orientation only:
  `.wakeflow-active/current/workspace-current-status.md`.
- Raw code references reviewed: `Alembic/config/constitution.yaml`,
  `Alembic/lib/Bootstrap.ts`, `Alembic/lib/governance/**`,
  `Alembic/lib/http/**`, `Alembic/lib/cli/SetupService.ts`,
  `AlembicPlugin/config/constitution.yaml`, `AlembicPlugin/lib/bootstrap.ts`,
  `AlembicPlugin/lib/governance/**`, `AlembicPlugin/lib/runtime/**`,
  `AlembicCore/AGENTS.md`, `AlembicAgent/AGENTS.md`,
  `AlembicDashboard/AGENTS.md`, and targeted text searches across active source
  and tests.
