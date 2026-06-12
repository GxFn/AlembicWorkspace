# SN0 — Convention Spec, Census Freeze, Target Trees, Constraints (2026-06-12)

Controller artifact (P4 SN train, SN0). Inputs: three evidence sweeps
(naming census ×5 repos, public-path constraint map, path-referencing gate
inventory), P0 census, AD2 charters, AD3 layer contracts.

## 1. Naming convention (codified dominants — NOT a redesign)

| Artifact type | Convention | Evidence |
| --- | --- | --- |
| Classes/services/presenters/contracts | PascalCase.ts | dominant 63-75% in Core/Alembic/Agent |
| React components | PascalCase.tsx | Dashboard 67% |
| Hooks | useX.ts camelCase | Dashboard hooks/ |
| Utilities/helpers/middleware | camelCase.ts | second dominant everywhere |
| Scripts (.mjs) and configs | kebab-case | universal |
| Drizzle migrations | NNN_snake_case.ts | DELIBERATE artifact type, not stragglers — exempt |
| Agent profile modules | x.profile.ts | DELIBERATE pattern — exempt, codified |
| Tests | ClassName.test.ts under test/ (Plugin/Core/Agent/Alembic) | Dashboard: node --test files in test/ |

Naming-lint spec: per artifact-type pattern with the two exempt families
(migrations, .profile.ts) and per-repo exception lists carrying
owner/reason — the AD-era config idiom.

## 2. Straggler counts (rename candidates per wave)

- Core: ~44 kebab + 27 camel in class positions; 9 migrations EXEMPT.
- Alembic: 8 camelCase middleware/util files (errorHandler.ts etc.).
- Agent: 17 kebab shared modules; 7 .profile.ts EXEMPT.
- Dashboard: ~10 model/hook naming mixes (knowledgePayload.ts etc.).
- Plugin: heterogeneous; lib/ areas largely consistent; lib/codex/ = 75
  files (SN5 rename target CONFIRMED to exist).

## 3. Public-path constraint map (rename-safety freeze)

- **AlembicCore: 9 FROZEN wildcard subtrees** — shared/domain/daemon/core/
  infrastructure/repository/service/types/workflows. These cover ALL of
  src/. **Consequence: SN4 (Core wave) source renames are GATED on SD-5
  phase-2 execution (user decision C3)**; until then SN4 may touch ONLY
  scripts/, test/, config/, docs/ names. 65 exact keys are shieldable
  (rename + exports edit in-commit) but only meaningful post-SD-5-p2.
- AlembicAgent: 14 exact keys, ZERO wildcards — fully shieldable.
- AlembicPlugin: no exports; bin bootstrap pins dist/lib/* (incl.
  dist/lib/codex/*) — the SN5 lib/codex rename must move the shells'
  bootstrap requires in the same commit (both shells + cross-shell gate).
- AlembicDashboard: no public path constraints — correct pilot repo.

## 4. Gate-config move protocol (65 path entries, from the inventory)

Any rename commit MUST update, in the same commit, every affected row in:
layer-contract.json blessed files (Core 2 / Agent 1), blessed-singletons +
lintExemptions (Core 22), side-effect-doctrine (Agent 6), doctrine-lint-
exemptions (Plugin 17), shared-asset-manifest (Alembic+Plugin pair, 10
paths — copies-match!), check-generated-api-types constants (Dashboard 3),
vitest coverage includes (Alembic 3) + Agent aliases, wire-type-manifest
authorities, PLUGIN-SOURCE.json. AREA-path configs (scanRoots,
core-import subpath keys) break only on directory renames. The per-wave
packet quotes its repo's exact rows from the inventory sweep.

## 5. Wave sequencing implications (deltas vs the design's nominal order)

- SN1 Dashboard pilot: UNCONSTRAINED — proceed first as designed.
- SN2 Agent: fully shieldable — proceed (move 14 export keys in-commit
  where touched).
- SN3 Alembic: no package wildcards; bin scripts + shared-asset manifest
  paths move in-commit; proceed.
- **SN4 Core: source-tree renames PARKED until SD-5 p2 executes (C3
  ruling)**; a reduced SN4a (scripts/test/config naming) can run anytime.
- SN5 Plugin: design gate (CKG complete) UNCHANGED + dist/lib bootstrap
  pin protocol above.
- SN6 terminal acceptance: after the above; doubles as portfolio census
  review.

## 6. Migration tooling spec + per-wave commit protocol (user gates 1-4)

- Codemod pipeline (BUILT in SN1, spec here): script-driven rename pass =
  `git mv` (never delete+add) + import-specifier rewrite across the repo +
  gate-config row rewrite (section 4 rows for that repo) in the SAME
  change set; dry-run mode prints the full rename/rewrite plan before
  `--apply`; pipeline lives with the owning repo's scripts/ and is reused
  by every later wave.
- Single-purpose commits: rename/move commits contain ONLY renames, the
  mechanical specifier rewrites, and the in-commit gate-config row moves.
  No behavior edits, no refactors, no formatting drive-bys. Naming-lint
  wiring is its own commit.
- `.git-blame-ignore-revs` (user gate #3): each wave appends its rename
  commit hashes to the repo's `.git-blame-ignore-revs` in a follow-up
  commit, so blame stays usable.
- Behavior-neutrality proof per wave: the repo's full check green at its
  TRUE baselines + downstream consumer build green (Agent→Alembic,
  Core→all) before controller acceptance.
- User gates honored: (1) codify dominants only — section 1; (2)
  `lib/codex/` rename rides SN5 only; (3) ignore-revs discipline above;
  (4) wildcard-frozen paths — section 3 (SN4 parked on SD-5 p2).
