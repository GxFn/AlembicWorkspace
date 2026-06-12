# SD-5 — Core Wave 3B Transitional-Export Closeout

Design note for RC6 structural-debt decision gate. Drafted by the Design
window, task `alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-t1`.

Re-verification baseline (2026-06-12): AlembicCore `ed42960` (note: the RC2
result envelope cites commit `97c454cf`; `git diff 97c454cf ed42960` is empty —
same tree, amended message; `ed42960` is the surviving hash).

## Problem

AlembicCore's public API still carries 98 transitional-internal exports
awaiting the planned Wave 3B convergence. Until they close, the "stable
facade" story is aspirational: downstream repos can still deep-import
internals, and the boundary check guards counts rather than intent.

## Evidence and re-verification (2026-06-12)

Refs: audit C4; RC2 result (boundary counts unchanged at acceptance:
stable=18 / provisional=24 / transitional=98 — RC2's C1 deletion was
symbol-level inside unchanged export subpaths, so counts mechanically held).

Fresh checks:

- `config/public-api-boundary.json` `expectedCounts`: stable-public **18**,
  provisional-public **24**, transitional-internal **98** — UNCHANGED vs RC2
  acceptance. Structure note: the named `transitionalInternalExports` list has
  37 entries; the 98 figure = 37 named + 61 wildcard-derived export paths
  (confirmed by the closeout report: "98 exports (61 wildcard)").
- `node scripts/report-public-api-closeout.mjs` (read-only, run 2026-06-12):
  - Categories: promote-to-stable **0**, keep-provisional **18**,
    consumer-replace-first **0**, **no-consumer-deprecate-candidate 67**,
    must-keep-transitional **13** (sum 98).
  - Consumer scans: AlembicAgent transitional refs **0** (51 refs, all
    stable); Alembic transitional refs **1** (451 refs total); AlembicPlugin
    transitional refs **19** (457 refs total).
  - All 19 Plugin transitional refs fall in must-keep buckets: deep migration
    paths (`infrastructure/database/migrations/00x_*`), per-language AST
    modules (`core/ast/lang-{kotlin,dart,go,java,rust,swift}`), and
    `infrastructure/database/drizzle/schema`. Replacement readiness:
    readyRefs **0/19**, keep-transitional 19.
- Sequencing fact: AlembicPlugin's `vendor/AlembicCore` snapshot is pinned at
  `648055b`, **24 commits behind** Core HEAD (RC4-documented explained lag).
  Any closeout is invisible to the portable runtime until a deliberate vendor
  refresh + release.

Interpretation: the closeout is NOT a consumer-migration problem — it is 67
dead exports (zero consumers anywhere) plus 31 already-classified keepers.
Nothing is currently in the "consumer must migrate first" state.

## Options

### Option A — Single deletion wave

Delete the 67 no-consumer-deprecate-candidates and tighten
`wildcardExportStatus` in one demand; update `expectedCounts` (98 → 31).

- Cost: one wave; large export-map diff.
- Risk: Core ships in published runtime packages and vendor snapshots — an
  out-of-workspace consumer (older published `alembic-ai`, external clone)
  could deep-import a deleted path. The workspace external-deletion rule
  (clean import scan + connected replacement + representative build/smoke) can
  be satisfied for the five repos but NOT proven for published consumers in
  one step.

### Option B — Two-phase: deprecate-mark, then delete (release-aligned)

Phase 1: mark the 67 candidates `deprecated-transitional` in the boundary
config (date + removal release), keep the check green, publish/stage one
release cycle carrying the marks; refresh the Plugin vendor snapshot so the
portable runtime sees them. Phase 2 (next release window): delete, update
`expectedCounts` 98 → 31, re-run the closeout report showing
no-consumer-deprecate-candidate = 0.

- Cost: two smaller waves + one release-cycle latency.
- Risk: low; each phase independently green; aligns with the staged
  cross-repo deletion rule in workspace governance.

### Option C — Leave until breakage motivates closure

- Cost: zero. Risk: 67 dead exports rot, the wildcard surface (61 paths)
  keeps inviting new deep imports, and the boundary check normalizes a
  permanently stale "transitional" status — the exact drift this sequence
  exists to stop.

## Recommendation

**Option B.** Sequencing: no dependency on SD-1/SD-3/SD-4 (Agent already has
zero transitional refs; Plugin's 19 are must-keep and survive closeout), but
phase 2 must ride the next release staging together with a deliberate
`vendor/AlembicCore` pointer refresh in AlembicPlugin (per its AGENTS.md
vendor flow) so lag does not grow past the closeout. The 13
must-keep-transitional entries and 18 keep-provisional get their own
review-by date in the boundary config so "must-keep" remains a decision, not
a default.

## Affected repositories

AlembicCore (primary); AlembicPlugin (vendor refresh + validation);
Alembic/AlembicAgent (build validation only — 1 and 0 transitional refs).

## Validation outline

- Per phase: Core vitest + `check-public-api-boundary.mjs` +
  `check-release-readiness.mjs` + `smoke-public-api.mjs` green.
- `report-public-api-closeout.mjs` before/after deltas attached (phase 2 must
  show deprecate-candidates 67 → 0; consumer scans still issues=0).
- Downstream builds: Alembic, AlembicAgent, AlembicPlugin green against the
  new Core; Plugin additionally after the vendor pointer refresh.
- Boundary check demonstrated FAIL on stale `expectedCounts` before the
  deliberate update (same proof shape as RC3 G5).
