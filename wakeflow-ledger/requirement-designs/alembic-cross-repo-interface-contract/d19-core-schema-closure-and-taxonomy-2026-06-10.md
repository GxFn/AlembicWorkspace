# Core Schema Closure And Field Taxonomy Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d19-core-schema-closure-and-taxonomy-2026-06-10`
Sequence Order: 20
Maintainer: AlembicWorkspace
Primary Window: AlembicCore
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.

## Goal

Turn the D15-D18 decisions into Core-owned schema taxonomy and contract-spine
corrections so every downstream repository has one deterministic vocabulary for
field ownership, extension points, diagnostics, refs, artifacts, sensitivity,
and compatibility status.

## Completion Definition

- Core contract rows reflect the post-D14 real owner/consumer map.
- Field taxonomy is explicit for public, consumer-needed, diagnostic, internal,
  sensitive, raw-provider, hidden-reasoning, artifactRef-only, and detailRef-only
  fields.
- Schema closure policy is documented in code: strict by default, explicit
  typed extension points where dynamic data is real.
- Existing `additionalProperties`, `Record<string, unknown>`, `unknown`, and
  compatibility fields are classified as valid dynamic points or future cleanup
  targets.
- Core validation catches missing taxonomy, missing owner, forbidden ownership,
  and public exposure of private/sensitive classes.

## Work Items

- Reconcile `CoreContractSpine` rows against D15 responsibility map and D16
  decisions.
- Add or adjust shared enums/types for field disposition, exposure class,
  interface role, and extension point policy.
- Add validation helpers that product repos can call without importing UI or
  Plugin logic.
- Add focused tests or smoke checks proving the taxonomy is exported and stable.

## Real Code Evidence Requirements

- Anchor to `AlembicCore/src/shared/CoreContractSpine.ts` and
  `AlembicCore/src/daemon/ProjectRuntimeContracts.ts`.
- Extend Core vocabulary only for cross-repo field disposition and validation:
  public, consumer-needed, diagnostic, internal, sensitive, raw-provider,
  hidden-reasoning, detailRef-only, artifactRef-only, compatibility-private,
  and typed-extension.
- Do not move provider route behavior, Plugin MCP behavior, Agent execution, or
  Dashboard UI state into Core; Core supplies taxonomy and validators only.
- Validation must catch public rows without owner, exposure class, extension
  policy, failure kind, diagnostic policy, and consumer validation command.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d19-core-schema-closure-and-taxonomy-p1` |
| Target window | `AlembicCore` |
| Target task | `alembic-interface-contract-d19-core-schema-closure-and-taxonomy-t1` |
| Target summary | Implement Core field taxonomy and schema-closure validation from D15-D18 decisions. |

## Boundaries

- Do not move product behavior into Core.
- Do not remove dynamic fields that are still required by provider, Plugin,
  Agent, or Dashboard consumers.
- Do not introduce version/evolution policy unless the user reopens it.
