# Alembic Provider Content Normalization Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d20-alembic-provider-content-normalization-2026-06-10`
Sequence Order: 21
Maintainer: AlembicWorkspace
Primary Window: Alembic
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Normalize Alembic HTTP/provider route inputs and outputs so each route returns
only the data its operation owns, with typed problem/failure shapes, explicit
detailRef/artifactRef policies, and clear command/query/diagnostic separation.

## Completion Definition

- Provider route schemas distinguish read/query, command, diagnostic, artifact,
  and event surfaces.
- Public response schemas are closed or have typed extension points justified by
  D17 field analysis.
- String-only errors and mixed `{ success, data, error }` command failures are
  replaced or wrapped with stable machine-readable problem/failure details.
- Project runtime routes remove ambiguous aliases where D18 says no active
  consumer remains; otherwise aliases are marked compatibility-private with
  cleanup evidence.
- OpenAPI/provider-contract fixtures cover success, partial, unavailable,
  conflict, timeout, cancelled, permission, and not-found branches where the
  route can produce them.

## Work Items

- Normalize `provider-contracts` schemas and fixtures.
- Audit project runtime routes, job routes, search/knowledge routes, decision
  register routes, guard routes, diagnostics routes, and artifact routes.
- Move large reports/logs/provider traces from ordinary route output to
  artifactRef/detailRef or diagnostic routes.
- Add route-level validation or tests that fail if extra fields leak into public
  schemas by accident.

## Real Code Evidence Requirements

- Anchor to `Alembic/lib/http/provider-contracts.ts`,
  `Alembic/lib/http/routes/projects.ts`, and
  `Alembic/lib/shared/schemas/http-requests.ts`.
- Replace accidental `additionalProperties: true` with strict schemas or named
  typed extension points; each extension point must name owner and consumer.
- Normalize mixed failure fixtures into typed problem/failure objects while
  preserving unavailable, partial, cancelled, conflict, timeout, permission, and
  not-found semantics.
- Classify `.loose()` and `.passthrough()` bodies by operation: true dynamic
  operation payload, internal metadata, compatibility alias, or cleanup target.
- Project runtime action responses must not expose whole internal action result
  objects unless D17 proves each returned field belongs to that route.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d20-alembic-provider-content-normalization-p1` |
| Target window | `Alembic` |
| Target task | `alembic-interface-contract-d20-alembic-provider-content-normalization-t1` |
| Target summary | Normalize Alembic provider request/response/problem schemas and route fixtures according to D15-D19 decisions. |

## Boundaries

- Preserve existing user-visible workflows and runtime states.
- Do not delete Dashboard/Plugin consumed fields until D24/D29 consumer proof
  exists.
- Do not flatten non-success states into generic failures.
