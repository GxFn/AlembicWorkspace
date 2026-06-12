# Cleanup Readiness Scan

Demand Key: `alembic-redundancy-stale-logic-cleanup-rc0-readiness-scan-2026-06-11`
Primary Window: AlembicWorkspace

## Goal

Re-verify every medium/low-confidence finding from
[audit-findings-2026-06-11.md](audit-findings-2026-06-11.md) against current
code, and produce a per-item readiness matrix that RC1-RC5 can execute
without re-investigating.

## Task Breakdown

1. **Skip-marker verdict (A5)** — `grep -n "\.skip\|\.only\|xit\|xdescribe"`
   over `Alembic/test/unit/ExitController.test.ts` and the 10 other flagged
   unit files; classify each match as disabled-test vs business counter;
   record the verdict per file.
2. **Deprecated search helper (A4)** — enumerate all call sites of the
   deprecated helper in `Alembic/lib/resident/tool-handlers/search.ts:391`
   across all five repos; mark migrate-then-delete or keep-with-reason.
3. **Scratch tracking status (A3, P3)** — `git ls-files scratch/` in Alembic
   and AlembicPlugin; list tracked files, check whether any are referenced by
   scripts/docs/ledger; propose archive target paths under
   `wakeflow-ledger/`.
4. **Core migration gap (C3)** —
   `git log --oneline --name-only -- src/infrastructure/database/migrations/`
   in AlembicCore; determine whether 002/003 were merged, renamed, or never
   existed; draft the runner comment text.
5. **`promptDiscovererChoice()` consumers (C1)** — grep all five repos for
   call sites and re-exports; record the landing repo for the interactive
   prompt (expected: Alembic CLI layer) and the exact Core surface to keep
   (load/save preference only).
6. **Plugin route consumer map (P4)** — for each of the 19 files in
   `AlembicPlugin/lib/http/routes/`, find current consumers (MCP handlers,
   daemon supervisor, smoke/verify scripts, acceptance packs); mark
   keep / remove-candidate / unknown.
7. **Plugin legacy markers (P2)** — for `LEGACY_DIRECT_CALL_COMPATIBILITY_TOOLS`,
   legacy error-code mapping, `LEGACY_IDE_AGENT_SOURCE`,
   `legacyEffectiveIdentityFallback`: enumerate consumers and host versions
   that still need them; classify remove-now vs deadline-mark.
8. **Shared-asset drift inventory (section 7)** — produce unified diffs for
   the 4 drifted SKILL.md files, `templates/constitution.yaml`,
   `config/default.json`, `templates/recipes-setup/`; for each hunk mark
   intentional-divergence vs missed-backport, and name the authoritative side.
9. **Release snapshot check (A7)** — compare `.release/alembic-ai/package.json`
   against root manifest; record whether release tooling regenerates it.

## Completion Definition

A readiness matrix exists in the RC0 state root listing, for every item:
finding id, verification command + raw output reference, current consumers,
delete-ready status (ready / migrate-first / keep-with-reason / escalate-to-RC6),
owning demand (RC1-RC6), validation command, and stop condition. No
medium/low-confidence finding remains unverified.

## Validation Floor

- Raw grep/git outputs attached, not summarized claims.
- Matrix covers 100% of audit items A3-A7, C1, C3, G1-G5, P2-P4, and the
  shared-asset drift table.

## Stop Conditions

- Any scan reveals a finding was wrong — correct the audit document in place
  and re-route the item before dispatching product packages.
