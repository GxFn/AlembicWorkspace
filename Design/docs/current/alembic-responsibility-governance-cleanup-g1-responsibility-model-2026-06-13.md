# Alembic Responsibility Governance Cleanup G1 Responsibility Model

Status: completed Design target artifact / controller-review-needed / no implementation dispatch
Date: 2026-06-13
Design Key: alembic-responsibility-governance-cleanup
Task: alembic-responsibility-governance-cleanup-g1-design-responsibility-model-t1
Dispatch Group: alembic-responsibility-governance-cleanup-g1-responsibility-model-design-p1
Owner Window: Design
Receiving Window: AlembicWorkspace

## Boundary

This is the G1 Design responsibility model for the active Wakeflow state root:

`.wakeflow-active/current/alembic-responsibility-governance-cleanup`

It is not an implementation package, TODO mutation, acceptance record, product
code edit, or Test request. It consumes the G0 fact scan and the user's
confirmed decisions, then gives the controller a reviewable model for later
task-package planning.

## Source Inputs

- User goal: rebuild the Alembic-space responsibility model so Alembic mainline
  defaults to external AI, AlembicPlugin defaults to host AI/plugin, and
  developer remains only GitHub/package author or maintainer metadata.
- User confirmation after G0: central constitution safety logic can be cleaned
  up because equivalent safety should live at real feature entrypoints; missing
  safety should be repaired at the owning entrypoint, not by keeping fake
  constitution authority.
- User confirmation after G0: naming has already been unified enough; run only
  a narrow stale-naming check and avoid a broad naming migration.
- State evidence: `evidence/g0-fact-scan-2026-06-13.md`.
- Existing Design artifact:
  `Design/docs/current/alembic-responsibility-governance-cleanup-requirement-design-2026-06-13.md`.

## G1 Model Summary

The new model separates four things that were previously blended:

1. AI actors: external AI for Alembic mainline and host AI for AlembicPlugin.
2. Capability gates: explicit admin/tool/session opt-in, project-scope
   authorization, and human confirmation events.
3. Author metadata: GitHub/package/repository author or maintainer attribution.
4. Feature-entrypoint safety: checks owned by the real route, tool, lifecycle,
   or write entrypoint.

The model rejects central user/team RBAC and central constitution authority for
this product. A remaining protection must be explainable as a real feature
entrypoint check or an explicit host/plugin capability gate.

## Allowed Vocabulary

| Term | Meaning | Allowed Use |
| --- | --- | --- |
| External AI | The default Alembic mainline-facing actor or adapter. | Alembic docs, runtime policy, tests, and task descriptions. |
| Host AI | The host-managed plugin agent, for example Codex or another host plugin agent. | AlembicPlugin runtime, MCP, skills, channel, and host integration docs. |
| Host plugin surface | The Plugin-owned host adapter and MCP/tool surface. | AlembicPlugin ownership and validation language. |
| Maintainer metadata | GitHub/package author, repo owner, release attribution, or docs owner. | Metadata and attribution only; never runtime authorization. |
| Author metadata | The source/user attribution attached to knowledge, Recipes, commits, or packages. | Provenance and display only. |
| Admin mode | Explicit elevated session or tool capability gate. | Plugin/admin tool visibility and maintenance tools. |
| Human confirmation | A decision event for destructive or lifecycle-changing actions. | Feature entrypoints and UX/API flows. |
| Project-scope authorization | A scoped write authorization for exporting or modifying project-visible assets. | Project skill export and similar scoped writes. |
| Feature-entrypoint safety | Validation owned by the route, tool, lifecycle, or write entrypoint. | Replacement for central constitution safety. |
| Gateway | Real routing, audit, transport, or LLM-provider gateway behavior. | Allowed only when it is not claiming central constitution authority. |
| Permission | Internal Agent tool permission or scoped capability check with a real call chain. | AlembicAgent or explicit tool policy contexts only. |

Compatibility note: existing actor ids such as `external_agent` may be kept
temporarily as wire compatibility ids if implementation evidence shows changing
ids would broaden the migration. Their displayed meaning should be external AI
or host AI, not developer/user RBAC.

## Forbidden Concepts

These should not remain in active product semantics:

- `developer` as a runtime permission actor.
- `developer` wildcard or full-access role.
- `contributor` / `visitor` as Alembic product responsibility roles.
- `git_write` as runtime authorization or proof of user authority.
- Central `Constitution` / "宪章" as safety authority.
- "only developer can ..." lifecycle or write claims.
- "3-role RBAC", "developer full access", or similar public security story.
- Developer code-logic management as a product feature.
- Dashboard text that claims Gateway/Constitution/Permission triple authority
  after backend cleanup removes that model.
- Broad naming migration unless G0 or implementation finds a real stale naming
  contract.

## Disposition Decisions For G0 Findings

| G0 Id | Decision | Owner Candidates | Notes |
| --- | --- | --- | --- |
| G0-01 Alembic runtime governance chain | First-wave cleanup. Remove developer runtime RBAC and central constitution safety after entrypoint protections are proven. Keep only real routing/audit/gateway behavior with clear purpose. | Alembic | Implementation must identify where destructive confirmation, content-required writes, AI Recipe lifecycle restrictions, and batch authorization live before deleting the old central gate. |
| G0-02 AlembicPlugin copied governance chain | First-wave cleanup. Remove copied constitution/RBAC model where MCP/runtime/tool policies already own behavior. Keep host admin opt-in and project-scope authorization. | AlembicPlugin | Host AI/plugin model is the source of truth. Plugin should not preserve copied mainline developer RBAC. |
| G0-03 Config/templates/setup constitution roles | First-wave cleanup. Remove or replace generated `developer`, `contributor`, `visitor`, `git_write`, and central constitution artifacts. | Alembic, AlembicPlugin | Shared-asset drift rules must be updated in the owning repo order; do not edit Plugin shared sections ahead of main authority if drift rules require main first. |
| G0-04 Core CapabilityProbe role model | Evidence-based dependency. Remove or downgrade only if Alembic/AlembicPlugin no longer consume probe roles. | AlembicCore if needed | Prefer local capability/status semantics over user responsibility roles. Keep Core stable if first-wave work can avoid Core changes. |
| G0-05 Dashboard public role/security copy | Follow-up after backend cleanup by default. | AlembicDashboard | User confirmed Dashboard text alignment should follow backend contract cleanup and is not the first-wave blocker. |
| G0-06 Dashboard UI permission hooks | Preserve until backend contract changes prove the replacement behavior. | AlembicDashboard | UI safety should not be removed as prose cleanup. Rework only when new backend contract exists. |
| G0-07 AGENTS/shared manifest/drift gates | Update only as needed by first-wave changes. | Alembic, AlembicPlugin, controller review | These are source-of-truth docs and drift gates; changes must match real implementation, not aspirational wording. |
| G0-08 `developerIdentity` author metadata | Keep as author metadata anchor. Rename only if low-risk and consumer-compatible. | AlembicCore if needed | This aligns with user's "GitHub/package author metadata is enough" direction. It is not runtime permission authority. |
| G0-09 Project skill export authorization | Keep. | AlembicPlugin | This is project-scoped write authorization, not developer RBAC. |
| G0-10 AlembicAgent developer labels/tool roles | Out of first wave unless active product-facing conflict is proven. | AlembicAgent if needed | Agent tool permission is a real Agent responsibility and should not be deleted by this demand. |

## Implementation Wave Boundaries

These are candidate controller waves, not Design dispatch.

### Wave 1 - Alembic mainline responsibility cleanup

Purpose:

- Remove runtime `developer` full-access RBAC from Alembic mainline.
- Remove central constitution safety authority after proving entrypoint checks.
- Align Alembic with the external AI model.

Required evidence before deletion:

- Entrypoint map for destructive writes, candidate/Recipe creation, Recipe
  lifecycle mutation, batch operations, AI config changes, and monitoring
  maintenance routes.
- Proof that each protected operation has an owning entrypoint check or a
  planned replacement in that same owning entrypoint.
- Import/reference scan for removed central governance classes/config/templates.

Out of scope:

- Broad renaming of actor ids.
- Dashboard UI changes.
- Agent tool-system permission changes.

### Wave 2 - AlembicPlugin host AI cleanup

Purpose:

- Remove copied constitution/RBAC semantics from Plugin runtime/config/templates
  where host MCP/runtime policy owns the behavior.
- Preserve `agent` default tier, explicit admin opt-in, project-scope skill
  export authorization, and host-plugin boundaries.

Required evidence before deletion:

- MCP/preflight/tool-policy map showing which checks own hidden admin tools,
  project skill export, bootstrap/rescan/job operations, cleanup confirm, and
  host-agent workflow writes.
- Import/reference scan for removed copied governance classes/config/templates.
- Plugin drift/smoke checks selected by the owning repo.

Out of scope:

- Changing host plugin identity names unless a stale naming contract is proven.
- Moving Plugin responsibility into Alembic mainline.

### Wave 3 - Shared dependency reconciliation

Purpose:

- Touch AlembicCore only if Wave 1 or Wave 2 proves shared contracts such as
  probe roles, `ConstitutionViolation`, or author metadata need changes.

Default decision:

- Keep `developerIdentity` as author metadata unless the controller decides a
  rename is worth the compatibility cost.
- Prefer avoiding Core changes in first-wave implementation unless the old
  role model cannot be removed without it.

### Wave 4 - Dashboard text and UI contract alignment

Purpose:

- Update user-visible role/security copy after backend responsibility cleanup.
- Rework Dashboard permission hooks only if backend contract changes require it.

Default decision:

- Not a blocker for Wave 1 and Wave 2.
- Required before final acceptance if stale public claims remain active.

### Wave 5 - Controller acceptance

Purpose:

- Confirm every G0 finding is deleted, retained with a real consumer, routed to
  a follow-up, or excluded as historical/vendor material.
- Review raw evidence, diffs, reference scans, and representative checks from
  every touched repository.

## Validation Expectations

The controller should require evidence at the highest seam that proves behavior.

For Alembic:

- Entrypoint safety evidence for routes/tools/lifecycle writes replacing central
  constitution checks.
- Tests around removed/replaced governance wiring, role resolver behavior,
  setup/template generation, and protected route behavior.
- Reference/import scans for deleted classes, config roles, and generated
  constitution artifacts.
- Repository checks selected by Alembic rules.

For AlembicPlugin:

- Runtime/preflight/tool-policy tests for visible/hidden tools, admin opt-in,
  cleanup confirmation, project skill export authorization, and host-agent
  workflow writes.
- Plugin smoke/verification and shared-asset drift checks where affected.
- Reference/import scans for removed copied governance files and config roles.

For AlembicCore:

- Only if touched: package export/type tests, consumer boundary checks, and
  compatibility notes for any renamed shared contract.

For AlembicDashboard:

- If touched: type/build plus text/contract review; browser verification only
  if UI behavior changes.

For docs-only changes:

- `git diff --check` plus the repository's script-readable docs or drift check
  if one exists.

Invalid validation conclusions:

- Passing docs lint does not prove central safety can be removed.
- Removing tests that asserted old RBAC does not prove new entrypoint safety.
- Delivery success or target backfill is not controller acceptance.

## User Confirmation Status

Already confirmed:

- Use the Option B direction: simplify policy and responsibility rather than
  docs-only cleanup or blind deletion.
- Clean up central constitution safety logic, provided real entrypoints carry
  or receive equivalent protections.
- Do not start a broad naming migration.
- First wave focuses on Alembic and AlembicPlugin.
- Dashboard text alignment follows backend contract cleanup by default.
- Developer remains author/maintainer metadata only.

Still controller-evidence questions, not user blockers unless evidence changes
visible scope:

- Whether central governance classes are removed immediately or left as thin
  compatibility wrappers for one release.
- Which exact feature entrypoints already own each safety check.
- Which archives/vendor snapshots are excluded from acceptance scans.
- Whether a shared Core contract must change to remove old role semantics.

Ask the user again only if evidence requires a visible behavior change, public
API change, compatibility break, expanded repository scope, or retention of a
developer-like runtime authority.

## Controller Intake Notes

Design considers G1 complete enough for controller review and implementation
wave planning. The next controller action should not be product implementation
by default; it should first create evidence-backed Wave 1 and Wave 2 packages
that require entrypoint-safety proof before deletion.

Recommended controller stance:

- Treat G0's "keep write-safety chain" as superseded by the user's later
  confirmation only for central constitution authority.
- Continue to protect real write safety, but move ownership to feature
  entrypoints and host/plugin capability gates.
- Keep the first implementation wave narrow enough that missing entrypoint
  safety becomes a blocker, not a reason to preserve fake constitution
  authority indefinitely.

## Source References

- `.wakeflow-active/current/alembic-responsibility-governance-cleanup/task-packages/alembic-responsibility-governance-cleanup-g1-responsibility-model-design-p1.json`
- `.wakeflow-active/current/alembic-responsibility-governance-cleanup/evidence/g0-fact-scan-2026-06-13.md`
- `.wakeflow-active/current/alembic-responsibility-governance-cleanup/developer-progress.md`
- `Design/docs/current/alembic-responsibility-governance-cleanup-requirement-design-2026-06-13.md`
- User confirmation in this Design target thread on 2026-06-13.
