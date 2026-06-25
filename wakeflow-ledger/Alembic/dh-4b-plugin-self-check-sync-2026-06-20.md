# DH-4b — AlembicPlugin self-check sync package (needs-controller)

Date: 2026-06-20 · Source window: Alembic · Demand: alembic-plugin-dual-host-architecture-refactor-2026-06-19 · Task: DH-4b
Alembic commit: `88a2abf` (direct to main; baseline `cf3b171`).

## Why this exists

DH-4b made `Alembic/scripts/check-shared-asset-drift.mjs` + `Alembic/config/shared-asset-manifest.json`
per-host aware so genuinely host-divergent tool surfaces no longer false-flag as drift. Those two files
are **self-check assets**: the gate requires AlembicPlugin to carry byte-identical copies. Alembic is the
authority and may not edit AlembicPlugin, so the byte-sync is a controller-dispatched follow-up.

After the Alembic commit, the gate vs the real (unsynced) plugin is GREEN on the 3 target assets and RED
only on these 2 self-check items. A synced mirror (plugin assets untouched, only these 2 files synced)
runs **0 drift / PASS** — proving this sync is the *only* remaining step and **no plugin SKILL.md / README
asset edits are needed**.

## What AlembicPlugin must do

Overwrite its copies of these 2 files with Alembic's committed (`88a2abf`) versions, byte-identical:

- `config/shared-asset-manifest.json`
- `scripts/check-shared-asset-drift.mjs`

Precise diff (plugin current == Alembic `cf3b171` → Alembic `88a2abf`):
`wakeflow-ledger/Alembic/dh-4b-plugin-self-check-sync-2026-06-20.patch`
(equivalently: `git -C Alembic show 88a2abf -- config/shared-asset-manifest.json scripts/check-shared-asset-drift.mjs`).

The change is additive/backward-compatible:
- script: `checkSkillSharedSections` gains optional `perHostSections` handling (sections listed there are
  excluded from cross-host coherence; remaining shared sections still compared; declared per-host sections
  asserted present on the main/codex authority side). No behavior change for assets without `perHostSections`.
- manifest: `skill-alembic-recipes.perHostSections=[intro-and-overview, use-context-tail]`,
  `skill-alembic-structure.perHostSections=[title-intro, tools-and-graph]`,
  `templates-recipes-setup.fileVariants["README.md"]` = 3 host-divergent tool-table rows.

## Verification after sync (Node ≥ 22 — repo .nvmrc=22; Node 18 false-reds with ERR_INVALID_ARG_TYPE)

From the Alembic repo (or the plugin's own `npm run check` once synced):

```
node scripts/check-shared-asset-drift.mjs
# expect: 11 checks, 0 drift, 0 pending-sync → PASS
```

## Boundary notes

- No AlembicPlugin asset (SKILL.md / README / _template.md) edits required — the per-host divergence is
  carried entirely by the manifest declarations + the existing directory-exact variant mechanism.
- Four-tool external MCP semantics unchanged on both hosts (each host keeps its own tool names; the gate
  stops cross-comparing the host-divergent sections instead of forcing one host's names onto the other).
- AlembicCore untouched.
