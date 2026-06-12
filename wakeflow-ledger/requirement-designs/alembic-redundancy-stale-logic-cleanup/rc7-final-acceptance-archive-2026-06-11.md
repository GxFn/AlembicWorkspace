# Final Acceptance & Archive

Demand Key: `alembic-redundancy-stale-logic-cleanup-rc7-final-acceptance-archive-2026-06-11`
Primary Window: AlembicWorkspace

## Goal

Prove the whole sequence held its hard rules, run the full cross-repository
gate set on the final state, and archive the evidence.

## Task Breakdown

1. **Gate sweep** — run and record:
   - Alembic: build + unit tests + core-import / agent-extraction boundary
     lints.
   - AlembicCore: vitest + `check-public-api-boundary` +
     `check-release-readiness` + `smoke-public-api`.
   - AlembicAgent: check gate + `lint-agent-public-api-boundary` (computed
     mode) + `release:pack-preview`.
   - AlembicPlugin: vitest + `lint-repo-boundary` + `smoke-codex-plugin` +
     MCP `tools/list` / callTool samples.
   - AlembicDashboard: `npm run check` (no diff expected in this repo —
     verify with `git status`).
   - RC5 shared-asset drift gate on both sides.
2. **Evidence review** — review RC1-RC5 raw evidence (diffs, scans, gate
   logs) against each demand's completion definition; reject any package that
   returned prose-only evidence.
3. **Regression spot-check** — confirm no behavior loss at the three
   user-visible touchpoints this sequence brushed: discovery confirmation
   prompt (RC2 relocation), plugin skills delivery (RC5 SKILL.md), plugin
   direct-call compatibility (RC4 legacy handling).
4. **Audit document closure** — annotate
   [audit-findings-2026-06-11.md](audit-findings-2026-06-11.md) item-by-item
   with final disposition (fixed / kept-with-reason / escalated-to-SD-x).
5. **Archive** — write the final acceptance archive in this directory,
   update the requirement-designs README status line, and record sequence
   completion in the workspace record map.

## Completion Definition

All gates green on the final state; every audit item carries a disposition;
the acceptance archive exists with links to raw evidence; AlembicDashboard
shows zero code diff for the sequence.

## Validation Floor

- Raw gate logs attached for all five repositories.
- Disposition table covers 100% of audit items.
- Wakeflow verification recorded.

## Stop Conditions

- Any gate red on the final state — return the owning demand to in-progress
  instead of archiving around it.
