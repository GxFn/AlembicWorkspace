# Parameter And Data Content Audit Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d17-parameter-data-content-audit-2026-06-10`
Sequence Order: 18
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.wakeflow-active/current/`; this document is not a dispatch packet.
Design Basis: [post-d14-interface-governance-real-code-analysis-2026-06-10.md](post-d14-interface-governance-real-code-analysis-2026-06-10.md)

## Goal

Analyze the parameter content and returned data content of the post-D14
interfaces, then produce a concrete cleanup and normalization design.

This audit must produce field-level evidence for D19-D32. It must distinguish
valid dynamic extension points from obsolete compatibility bags, and must not
treat openness as a defect until consumer need and owner responsibility are
checked.

## Completion Definition

- Every reviewed parameter is classified by caller responsibility, required or
  optional meaning, state-changing intent, identity/project scope, capability
  discovery, implicit default, environment coupling, validation rule, security
  sensitivity, and diagnostic-only status.
- Every returned field is classified by consumer need, exposure class, source of
  truth, derivation, size, sensitivity, diagnostic context, artifact/detail
  reference policy, and whether it belongs in that interface.
- Interface outputs identify fields that are tool-specific, route-specific, UI
  presentation-only, diagnostic-only, internal-only, sensitive, or obsolete.
- The audit identifies where broad global field bags, over-wide refs objects,
  raw provider payloads, duplicated derived data, and unrelated diagnostics
  should be removed or replaced.
- The result is a normalization design that preserves behavior while making
  input/output content clean and purposeful.

## Stage Plan

1. Read D15 responsibility map and D16 reasonability decisions.
2. Select interfaces with unclear, overloaded, over-wide, or consumer-sensitive
   parameter/data shapes.
3. Analyze parameters and returned data against real scenarios, consumers,
   failure paths, and exposure policy.
4. Define desired input/output shape, artifact/detail reference use, and
   validation requirements.
5. Produce D18 decision and slicing inputs.

## Real Code Evidence Requirements

- Audit provider `additionalProperties`, HTTP `.loose()`/`.passthrough()`,
  Plugin `UnknownRecordSchema`/`z.unknown()`, Agent diagnostics/trust fields,
  and Dashboard fallback extractors as concrete field groups.
- For every retained dynamic parameter or returned field, name caller,
  operation, consumer, exposure class, schema policy, and validation owner.
- For every removed or moved field, name the replacement: strict field,
  typed extension, `meta`, `detailRef`, `artifactRef`, diagnostic route, or
  private adapter state.
- Include sensitive fields such as api keys, raw provider data, hidden
  reasoning, host/session/thread ids, and private paths in the audit even when
  they are only reachable through diagnostics or fixtures.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d17-parameter-data-content-audit-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d17-parameter-data-content-audit-t1` |
| Target summary | Audit post-D14 parameter and returned-data content, classify field responsibility/exposure, and design clean normalized shapes. |

## Boundaries And Non-Goals

- Do not reduce functionality by dropping fields that have real current
  consumers.
- Do not normalize data by hiding failure, partial, unavailable, permission, or
  diagnostic states.
- Do not turn diagnostic or derived fields into success criteria unless a real
  consumer requires them.
