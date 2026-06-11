# Alembic Compatibility Removal Cleanup

Status: ready / independent post-D32 cleanup sequence
Maintained Window: AlembicWorkspace
Date: 2026-06-10

## Controller Judgment

The D0-D32 interface-contract sequence is complete. D32 intentionally preserved
several compatibility paths because they still had current consumers, diagnostic
owners, external-consumer uncertainty, or cleanup blockers. The user has now
confirmed a new independent cleanup goal: continue removing those compatibility
paths and converge cross-repository integration onto the new interfaces and
contracts, without split paths or downgrade behavior.

This is a new demand sequence, not D33+. It must consume D29/D32 preserved
compatibility evidence and remove only after current consumers are migrated and
representative validation proves the replacement path.

## Entry Points

- Sequence manifest: [alembic-compatibility-removal-cleanup-demand-sequence-2026-06-10.json](alembic-compatibility-removal-cleanup-demand-sequence-2026-06-10.json)
- D29 deletion wave evidence: [../alembic-cross-repo-interface-contract/../../../.workspace-active/workspace/current/alembic-interface-contract-d29-compatibility-deletion-wave/evidence/d29-compatibility-deletion-wave-2026-06-10.md](../alembic-cross-repo-interface-contract/../../../.workspace-active/workspace/current/alembic-interface-contract-d29-compatibility-deletion-wave/evidence/d29-compatibility-deletion-wave-2026-06-10.md)
- D32 final acceptance archive: [../alembic-cross-repo-interface-contract/final-governance-acceptance-archive-2026-06-10.md](../alembic-cross-repo-interface-contract/final-governance-acceptance-archive-2026-06-10.md)

## Final Goal

Remove or quarantine preserved compatibility paths so current product-to-product
integration uses only canonical post-D32 interfaces:

- canonical request/response fields, not aliases;
- canonical `projectScopeId` / `qualifiedPath`, not legacy path lookup;
- canonical provider problem/capability/diagnostic fields, not Dashboard
  guessing fallbacks;
- canonical MCP `inputSource` and per-tool `structuredContent`, not legacy
  input or envelope parsing in public paths;
- canonical Agent public result projection, not public compatibility semantics.

Provider-private shims may remain only when they represent a real current
external provider quirk and are hidden behind the canonical public contract with
owner, validation, and no cross-repository compatibility exposure.

## Hard Rules

- Do not delete before migrating current consumers.
- Do not remove behavior, failure branches, diagnostics, or user-visible
  workflows.
- Do not replace compatibility cleanup with arbitrary truncation, filters, or
  docs-only assertions.
- Do not keep dual public paths after the cleanup package is accepted.
- If an external current consumer cannot be disproven, mark the exact path as a
  release/breaking-change decision instead of silently deleting it.
- Every product package must return raw diff, commit, import scan, tests/probes,
  and residual risk.

## Independent Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 1 | `alembic-compatibility-removal-cleanup-cr0-readiness-scan-2026-06-10` | AlembicWorkspace | Build the exact deletion readiness matrix from D29/D32 and current code. |
| 2 | `alembic-compatibility-removal-cleanup-cr1-core-projectscope-2026-06-10` | AlembicCore | Remove cross-repo dependency on Core legacy path compatibility after consumers are migrated. |
| 3 | `alembic-compatibility-removal-cleanup-cr2-alembic-runtime-aliases-2026-06-10` | Alembic | Remove public project runtime request aliases and whole-result compatibility. |
| 4 | `alembic-compatibility-removal-cleanup-cr3-dashboard-fallbacks-2026-06-10` | AlembicDashboard | Replace Dashboard compatibility fallbacks with canonical provider/capability fields. |
| 5 | `alembic-compatibility-removal-cleanup-cr4-plugin-legacy-io-2026-06-10` | AlembicPlugin | Remove public legacy input/envelope compatibility from MCP tool paths. |
| 6 | `alembic-compatibility-removal-cleanup-cr5-agent-public-compat-2026-06-10` | AlembicAgent | Ensure Agent public results expose only canonical contract semantics while provider-private quirks stay private. |
| 7 | `alembic-compatibility-removal-cleanup-cr6-drift-gate-tightening-2026-06-10` | AlembicWorkspace | Tighten D30 drift gates so old compatibility fields cannot reappear publicly. |
| 8 | `alembic-compatibility-removal-cleanup-cr7-runtime-acceptance-archive-2026-06-10` | AlembicWorkspace | Run runtime/MCP/Dashboard/consumer replay acceptance and archive final cleanup. |

## Validation Backbone

The final sequence must pass, at minimum:

- D30 cross-repo drift gate command set.
- Consumer import scans for deleted compatibility symbols/fields.
- Product-owned unit/contract tests for changed repositories.
- Real MCP tools/list and representative callTool samples after Plugin cleanup.
- Alembic runtime smoke and decision-register route probe after provider cleanup.
- Dashboard contract tests and UI/view-model evidence after fallback cleanup.
- Wakeflow verification.

## Stop Conditions

- A cleanup would reduce or hide existing functionality.
- A current consumer still depends on the compatibility path.
- Replacement path lacks runtime, fixture, or consumer proof.
- External public HTTP/MCP compatibility cannot be safely removed without a
  release/breaking-change decision.
- Any target returns only prose or docs-only evidence.
