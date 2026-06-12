# Alembic Space Structure And Naming Findings

Status: evidence base / Design-window naming census + structural knowledge from prior audits
Date: 2026-06-12
Audited Heads: Core `68f7ad5`, Alembic `d58e4a3`+AO, Agent `35901cf`, Dashboard `11c2c61`, Plugin `838da9e` (committed)
Design Key: alembic-space-structure-naming-normalization

## N1. File Naming Census (non-test .ts; SN0 re-freezes and adds .tsx)

| Repo | Total | PascalCase | kebab-case | camelCase (stragglers) | single-lower |
| --- | --- | --- | --- | --- | --- |
| AlembicCore/src | 375 | 229 (61%) | 44 | 4 | 89 |
| Alembic/lib | 201 | 127 (63%) | 19 | 9 | 46 |
| AlembicAgent/src | 215 | 139 (65%) | 18 | 0 | 51 |
| AlembicDashboard/src (.ts only) | 25 | 0 | 0 | 10 | 15 |
| AlembicPlugin/lib | 168 | 85 | 30 | 7 | 46 |

- A dominant convention already exists: PascalCase for class/contract
  modules, single-lower for barrels and simple modules, kebab-case for
  multi-word non-class modules. camelCase files are stragglers (~30
  across the space; Agent is already clean at 0).
- Dashboard's React components are `.tsx` (PascalCase by React
  convention) and were not counted here — SN0 must census `.tsx` and
  decide the per-artifact-type rule for the React repo separately.
- Directory naming is already uniform: all lowercase; kebab for
  multi-word (Core 7, Alembic 8 kebab dirs; Agent all single-word).
  Known straggler style inside files only (e.g.
  `bootstrapDimensionConfigs.ts` vs sibling `cold-start.ts` patterns).

## N2. Folder-Hierarchy State (from the session audit chain)

- Core: 9 areas with a written layer contract + blocking direction lint
  (CO2) — the structural reference model.
- Alembic: 16 lib/ areas, acyclic but contract-less until AD3; the
  repository-vestige case (AO2) showed physical structure can lag the
  semantic ruling.
- Agent: hub-and-spoke agent/ (post-AG2 decomposition) + tools/ + ai/;
  AD3 writes its contract.
- Dashboard: small src (views/api/state implicit); AD3 adds a light
  conventions contract.
- Plugin: `lib/codex/` (73 files) is host-named although the content is
  host-parameterized — CC explicitly deferred the cosmetic rename
  ("future cleanup if ever"); this demand is that future cleanup's
  natural home (SN0 user gate).

## N3. Rename Blast-Radius Constraints (what a real landing plan must respect)

- Public export maps: Core `package.json` exports keys map specifiers to
  dist paths. Moves of exports-MAPPED files are shieldable (specifier
  stays, map updates). Moves of WILDCARD-exposed directories
  (`./domain/*`, `./core/*` — 61 groups, Plugin keep-alive 37) change
  public specifiers — frozen until SD-5 phase 2 lands, then revisit
  release-aligned.
- Path-based gate configs must move in the same commit as their targets:
  boundary lints (Core layer contract, Agent referenceLimits/export
  lists, Alembic extraction/repo-boundary lints), RC5 shared-asset
  manifest paths, public-api-boundary policy paths, validation-floor
  snapshots, biome override paths, tsconfig paths.
- Git history: renames need `git mv`, single-purpose commits, and a
  `.git-blame-ignore-revs` entry per wave to keep blame usable.
- In-flight collision: a mass rename conflicts with every open diff —
  execution waves must run as the FINAL cleanup train after the queued
  sequences (CKG, IC, AD, MT bodies) land per repo; the Plugin wave
  additionally waits for CKG completion and the CC packaging demands.
- Dashboard has zero package consumers (HTTP-only) — safest pilot.

## N4. Inputs This Demand Consumes

- AD2 functional charters + AD3 internal layer contracts are the
  semantic source for target trees (physical structure follows the
  written responsibility model, not taste).
- IC wire-type/single-sourcing outcomes fix several file homes before
  renaming.
- The MT certification cards and CC packaging land before the
  corresponding repo waves so renames do not invalidate fresh evidence.
