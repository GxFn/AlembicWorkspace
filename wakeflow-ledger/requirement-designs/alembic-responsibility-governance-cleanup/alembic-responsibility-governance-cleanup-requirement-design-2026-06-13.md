# Alembic Responsibility Governance Cleanup Requirement Design

Status: active intake (state root rev 1) / user-requested 2026-06-13 / no dispatch yet
Date: 2026-06-13
Design Key: alembic-responsibility-governance-cleanup
Primary Windows: AlembicWorkspace (controller), Design (responsibility model), Alembic, AlembicPlugin, with AlembicCore/AlembicAgent/AlembicDashboard only where G0 proves affected references

## Problem

The current Alembic-space governance language appears to over-model reality:
charter logic, user-responsibility information, gateway logic, permission
concepts, and code-logic management may describe responsibilities that are no
longer meaningful in the actual product architecture.

The user wants a new responsibility system instead of continuing to preserve
old governance artifacts. The intended model is:

1. Alembic mainline is the external AI surface.
2. AlembicPlugin is the host AI plugin surface.
3. Developers are not runtime permission actors and do not need a separate
   permission-management or code-logic management model.
4. Current GitHub author information is enough for author/maintainer metadata.

## Goal

Create and execute a cleanup demand that makes the Alembic repositories reflect
that model in docs, configs, runtime checks, tests, and exposed behavior:

- Inventory every remaining charter, user-responsibility, gateway,
  permission, code-logic-management, and author/ownership reference.
- Decide whether each reference should be deleted, renamed, downgraded to
  documentation, kept with a real consumer, or moved into a separate future
  demand.
- Remove or simplify unsupported governance and permission concepts in the
  owning repositories.
- Preserve current GitHub author information and avoid creating a new
  developer authorization layer.
- Keep behavior, public APIs, persistence, and host compatibility stable unless
  the user explicitly approves a visible change.

## Non-goals

- No rewrite of Git history or GitHub author metadata.
- No new developer permission-management model.
- No broad code deletion before a reference/import scan and consumer-impact
  review.
- No fake replacement charter or empty gateway abstraction.
- No product implementation in the controller workspace.
- No Test handoff unless G0 finds a real scenario that cannot be safely
  verified by the owning repository and controller self-checks.

## Candidate Demand Sequence

### G0 - Fact Scan And Boundary Confirmation

- Search Alembic, AlembicPlugin, and any affected shared repos for charter,
  responsibility, gateway, permission, user, developer, owner, maintainer,
  code-logic-management, and author metadata references.
- Classify each finding as doc, config, runtime code, public contract, test,
  validation gate, generated artifact, or historical archive.
- Identify live consumers, import/reference paths, and validation commands.
- Produce the deletion/downgrade candidate table.

### G1 - Responsibility Model Design

- Convert the user's stated model into a concise responsibility map:
  Alembic external AI surface, AlembicPlugin host AI plugin surface, developer
  GitHub-author metadata only.
- Define allowed vocabulary and forbidden concepts.
- Decide which findings from G0 are in scope for this demand and which require
  a separate user ruling.

### G2 - Alembic Mainline Cleanup

- Remove, rename, or downgrade Alembic-side governance logic that conflicts
  with the external AI surface model.
- Preserve live routes, contracts, and runtime behavior unless G1 explicitly
  approves a visible change.
- Prove deletions with reference/import scans and representative checks.

### G3 - AlembicPlugin Host Cleanup

- Remove or simplify Plugin-side claims that developers participate in runtime
  permission management or code-logic management.
- Keep host AI plugin boundaries intact and preserve Codex/host compatibility.
- Prove that current GitHub author information remains sufficient metadata.

### G4 - Shared References And Gates

- Update only the AlembicCore, AlembicAgent, and AlembicDashboard references
  that G0 proves are linked to the old model.
- Remove or retarget tests and validation gates that only protect obsolete
  charter or permission concepts.
- Keep generated files and documentation consistent with the new model.

### G5 - Acceptance And Archive

- Confirm every G0 finding is closed, kept with a consumer, or routed to a
  future demand.
- Review raw evidence, diffs, reference scans, and representative checks from
  every touched repository.
- Reconcile TODO/backlog rows created during the demand and archive the result.

## Producer/Consumer Order

G0 must run before any cleanup. G1 consumes G0 and user direction. G2 and G3
may proceed in parallel after G1 because Alembic and AlembicPlugin own
different responsibility surfaces. G4 runs only for references proven affected
by G0. G5 accepts the whole demand after raw evidence review.

## Completion Definition

The demand is complete only when:

- A complete evidence table exists for relevant charter, user-responsibility,
  gateway, permission, code-logic-management, and author metadata references.
- The new responsibility model is recorded and applied consistently.
- Alembic reflects the external AI surface model.
- AlembicPlugin reflects the host AI plugin surface model.
- Developers are represented by GitHub author/maintainer metadata only, not by
  runtime permission or code-logic governance.
- Every obsolete reference is removed or downgraded with reference/import
  evidence and representative checks.
- No public API, persistence behavior, release route, or host compatibility is
  changed without explicit user confirmation.

## Validation Requirements

- G0 evidence table with file paths, finding class, consumer, and proposed
  disposition.
- For each deletion: reference/import scan and consumer-impact note.
- For each touched repository: its representative lint/check/test/smoke command
  as defined by that repository.
- For generated docs or configs: regeneration or drift check if the repo has
  one.
- Controller acceptance from raw evidence, followed by Wakeflow verification or
  a recorded pre-existing workspace-verification blocker.

## Stop Conditions

- A finding has no consumer analysis but is being deleted.
- A charter edit describes behavior that is not present in code.
- A gate removal weakens a live validation path rather than removing obsolete
  governance-only logic.
- A developer permission model is added, renamed, or preserved without a real
  product consumer.
- The demand starts implementing unrelated architecture cleanup.

## Decisions And Open Items

- User direction is confirmed for intake: simplify to external AI surface,
  host AI plugin surface, and GitHub author metadata.
- G0 must decide the concrete affected repository list from evidence rather
  than assuming every Alembic-related repo needs edits.
- G1 must ask for user confirmation before any visible behavior, public API,
  or compatibility change.
