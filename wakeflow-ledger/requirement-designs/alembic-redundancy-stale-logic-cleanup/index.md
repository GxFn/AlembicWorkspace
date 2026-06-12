# Alembic Redundancy & Stale Logic Cleanup

Status: ready for controller confirmation / independent cleanup sequence
Maintained Window: AlembicWorkspace
Date: 2026-06-11

## Controller Judgment

A six-agent audit (2026-06-11) scanned the five product repositories for
out-of-responsibility code, redundant implementations, stale logic, and
documentation drift. Dependency direction across all five repositories is
clean; AlembicDashboard is grade A and needs no cleanup wave. The real debt
concentrates in four places:

1. Documentation that no longer matches reality (Alembic AGENTS.md source
   map; AlembicPlugin README is a stale copy of the main README).
2. Two genuine boundary violations inside AlembicCore (interactive readline
   prompt; non-deterministic pruning trigger).
3. Stale artifacts and unverified skip/deprecated remnants in Alembic,
   AlembicAgent, and AlembicPlugin.
4. Silent drift of shared assets between Alembic and AlembicPlugin
   (injectable-skills, constitution.yaml, templates, config defaults) on top
   of ~27.7k duplicated lib lines.

Structural debt (layer sinking to Core, V1→V2 tool convergence, MemoryStore
ownership, Dashboard artifact sync automation, Core Wave 3B export closeout)
must NOT be executed inside this sequence; RC6 converts it into design
candidates for separate confirmation.

## Entry Points

- Audit evidence base: [audit-findings-2026-06-11.md](audit-findings-2026-06-11.md)
- Sequence manifest: [alembic-redundancy-stale-logic-cleanup-demand-sequence-2026-06-11.json](alembic-redundancy-stale-logic-cleanup-demand-sequence-2026-06-11.json)

## Final Goal

Each repository contains only code and documents that match its declared
responsibility and current implementation:

- repo docs (AGENTS.md / README.md) describe the real tree and the real role;
- AlembicCore is fully headless and deterministic on product paths;
- verified-dead remnants (broken probe paths, deprecated helpers with no
  callers, empty placeholder dirs, tracked scratch reports) are removed or
  archived to the ledger;
- every remaining legacy compatibility marker carries an owner and a written
  retirement condition;
- shared assets between Alembic and AlembicPlugin have one authoritative
  source plus a drift check that fails loudly;
- remaining structural debt is captured as confirmed design candidates, not
  silent TODOs.

## Hard Rules

- Verify before delete: every medium/low-confidence audit finding must be
  re-verified by RC0 with consumer scans across all five repositories before
  any removal is dispatched.
- Do not remove behavior, failure branches, diagnostics, or user-visible
  workflows; this sequence removes only dead/duplicated/stale matter.
- Intentional Alembic↔Plugin divergence (daemon observability strip, route
  pruning, bootstrap strategy) is in scope for documentation, not for merging.
- AlembicDashboard receives no code changes in this sequence.
- Structural refactors are decision-gate outputs (RC6), never direct
  dispatch from this sequence.
- Every product package must return raw diff, scan output, test/gate logs,
  and residual risk — not prose summaries.

## Independent Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 1 | `alembic-redundancy-stale-logic-cleanup-rc0-readiness-scan-2026-06-11` | AlembicWorkspace | Re-verify medium/low-confidence findings and build the exact cleanup readiness matrix. |
| 2 | `alembic-redundancy-stale-logic-cleanup-rc1-alembic-docs-stale-artifacts-2026-06-11` | Alembic | Fix AGENTS.md drift; archive tracked scratch decisions; clear verified stale remnants. |
| 3 | `alembic-redundancy-stale-logic-cleanup-rc2-core-headless-boundary-2026-06-11` | AlembicCore | Remove CLI interaction and non-determinism from Core; record the migration-gap verdict. |
| 4 | `alembic-redundancy-stale-logic-cleanup-rc3-agent-hygiene-boundary-config-2026-06-11` | AlembicAgent | Fix/remove broken probe; encode boundary limits; automate expectedCounts; register V1 retirement intent. |
| 5 | `alembic-redundancy-stale-logic-cleanup-rc4-plugin-docs-legacy-governance-2026-06-11` | AlembicPlugin | Rewrite README for plugin scope; deadline-mark or remove legacy paths; scratch retention; route consumer pruning. |
| 6 | `alembic-redundancy-stale-logic-cleanup-rc5-shared-asset-single-source-2026-06-11` | AlembicWorkspace | Single-source injectable-skills/constitution/templates with a sync + drift gate. |
| 7 | `alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-2026-06-11` | AlembicWorkspace | Convert structural debt into reviewable design candidates; no implementation. |
| 8 | `alembic-redundancy-stale-logic-cleanup-rc7-final-acceptance-archive-2026-06-11` | AlembicWorkspace | Run the full cross-repo gate set, review raw evidence, archive the sequence. |

## Validation Backbone

The sequence must pass, at minimum:

- Alembic: build + unit tests + core-import / agent-extraction boundary lints.
- AlembicCore: vitest suite + `scripts/check-public-api-boundary.mjs` +
  `scripts/check-release-readiness.mjs` + `scripts/smoke-public-api.mjs`.
- AlembicAgent: repo check gate + `scripts/lint-agent-public-api-boundary.mjs`
  + `npm run release:pack-preview` staging proof.
- AlembicPlugin: vitest suite + `scripts/lint-repo-boundary.mjs` +
  `scripts/smoke-codex-plugin.mjs` + representative MCP `tools/list` and
  callTool samples.
- AlembicDashboard: `npm run check` (validation participation only).
- Shared-asset drift gate (new in RC5) green in both Alembic and AlembicPlugin.
- Wakeflow verification.

## Stop Conditions

- A removal candidate still has a current consumer in any of the five
  repositories or in published package surfaces.
- A "stale" artifact turns out to be referenced by release/ledger tooling.
- A documentation rewrite would change a contract instead of describing it.
- Shared-asset single-sourcing would force a behavior change in either
  runtime — that escalates to RC6 design instead.
- Any target returns only prose or docs-only evidence.
