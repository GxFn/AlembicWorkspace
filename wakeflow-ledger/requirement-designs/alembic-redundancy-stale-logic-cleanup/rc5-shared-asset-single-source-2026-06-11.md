# Shared Asset Single-Sourcing & Drift Gate

Demand Key: `alembic-redundancy-stale-logic-cleanup-rc5-shared-asset-single-source-2026-06-11`
Primary Window: AlembicWorkspace (coordinating Alembic + AlembicPlugin)

## Goal

End silent drift of shared assets between Alembic and AlembicPlugin:
one authoritative source per asset, a mechanical sync path, and a drift gate
that fails loudly in both repositories.

## Scope

Assets (from the RC0 drift inventory):

- `injectable-skills/alembic-{create,guard,recipes,structure}/SKILL.md`
  (Plugin side newer: 2026-06-09 vs 2026-05-11)
- `injectable-skills/alembic-devdocs/` (main-only; confirm intent)
- `templates/constitution.yaml` (role naming diverged)
- `templates/recipes-setup/`
- `config/default.json` (intentional `ai`-block divergence to document)

Explicitly NOT in scope: merging the 61 drifted `lib/` code files —
intentional runtime divergence stays; structural dedup belongs to RC6.

## Task Breakdown

1. **Authority decision per asset** — from the RC0 hunk classification,
   record per asset: authoritative repo, and whether the other side is
   pure-copy or parameterized-variant (e.g. SKILL.md wording that legitimately
   differs per host: envelope vs structuredContent phrasing).
2. **Backport pass** — merge missed-backport hunks (expected mostly
   Plugin 06-09 → Alembic) so both sides start from a reconciled state;
   intentional variant hunks get inline `<!-- variant: codex-host -->`-style
   markers or move into a parameterized template.
3. **Constitution roles** — reconcile `templates/constitution.yaml` role
   definitions: shared role ids and semantics, host-specific display names
   expressed as explicit per-host overlay rather than forked full files —
   unless RC0 shows runtime depends on the fork, in which case escalate to
   RC6 and document the divergence instead.
4. **Sync + drift gate** — add a workspace script (e.g.
   `scripts/check-shared-asset-drift.mjs`, living in the authoritative repo
   and vendored into the other, or run from the controller) that compares the
   asset list across both repos modulo declared variant markers; wire it into
   both repos' check gates; document the "edit in source A, sync to B"
   procedure in both AGENTS.md files.
5. **`config/default.json` note** — document the intentional `ai`-block
   removal on the Plugin side (where the host injects provider config), so
   the divergence is declared rather than discovered.

## Completion Definition

Every in-scope asset has a declared authoritative source; both repos contain
reconciled content; the drift gate is green in both repos and demonstrably
fails when an asset is edited on the non-authoritative side without sync;
intentional variants are machine-distinguishable from drift.

## Validation Floor

- Drift gate green run + demonstrated failing run (inject a one-line drift).
- Alembic and Plugin test suites green after backports.
- Plugin smoke + skill-related MCP samples green (SKILL.md changes are
  user-visible to hosts).
- Side-by-side diff of constitution.yaml before/after with role mapping table.

## Stop Conditions

- A backport hunk changes runtime behavior in either repo — stop, classify it
  as intentional divergence or escalate to RC6.
- Single-sourcing would require build-time templating beyond simple sync —
  escalate the mechanism choice to RC6 rather than inventing infrastructure
  here.
