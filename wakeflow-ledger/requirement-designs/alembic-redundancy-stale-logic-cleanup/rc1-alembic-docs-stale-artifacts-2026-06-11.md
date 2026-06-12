# Alembic Docs & Stale Artifact Cleanup

Demand Key: `alembic-redundancy-stale-logic-cleanup-rc1-alembic-docs-stale-artifacts-2026-06-11`
Primary Window: Alembic

## Goal

Make `Alembic/AGENTS.md` describe the post-Wave-4/5 reality, archive tracked
scratch decisions to the ledger, and remove the stale remnants RC0 verified
as dead.

## Task Breakdown

1. **AGENTS.md source map (A1)** — rewrite the source-layering section
   (`AGENTS.md:125-142`): drop `lib/agent/` and `lib/external/`; list the real
   `lib/` tree (cli, daemon, governance, http, infrastructure, injection,
   platform, project-scope, repository, resident, sandbox, service, shared,
   tools, types, workflows).
2. **Dashboard location note (A2)** — amend `AGENTS.md:117` to state that
   `dashboard/` holds built output only and AlembicDashboard is the sole
   source-of-truth repository.
3. **Scratch archive (A3)** — move the 9 git-tracked decision documents from
   `scratch/` to the archive path chosen by RC0 under `wakeflow-ledger/`;
   ensure `scratch/` returns to untracked-only working space.
4. **Deprecated search helper (A4)** — per the RC0 verdict: migrate remaining
   callers to `slimSearchResult` and delete the deprecated helper in
   `lib/resident/tool-handlers/search.ts`, or record the keep-with-reason note
   next to the marker.
5. **Skip markers (A5)** — apply the RC0 verdict per file: re-enable, delete,
   or annotate each disabled test with its reason; business counters need no
   change.
6. **Empty `skills/` (A6)** — delete the empty directory, or add a README
   stating its reservation purpose if release tooling expects it.
7. **Release snapshot (A7)** — apply the RC0 verdict: document the
   regeneration step or wire it into the release script.

## Completion Definition

AGENTS.md matches `ls lib/` reality; `git ls-files scratch/` is empty; the
deprecated helper has zero call sites or a recorded reason; every disabled
test has an owner note or is removed; the empty directory is resolved.

## Validation Floor

- Alembic build + unit test suite green.
- Core-import and agent-extraction boundary lints green.
- `git ls-files scratch/` output attached.
- Diff of AGENTS.md reviewed against actual tree listing.

## Stop Conditions

- A scratch document is referenced by tooling — escalate path choice to the
  controller instead of moving it.
- Deprecated-helper callers exist outside this repository — coordinate that
  migration first; do not delete under it.
