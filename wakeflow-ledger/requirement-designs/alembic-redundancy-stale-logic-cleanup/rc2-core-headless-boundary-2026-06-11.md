# Core Headless Boundary Restoration

Demand Key: `alembic-redundancy-stale-logic-cleanup-rc2-core-headless-boundary-2026-06-11`
Primary Window: AlembicCore

## Goal

Remove the two verified headless/deterministic violations from AlembicCore
and record the migration-gap verdict, without changing any consumer-visible
behavior.

## Task Breakdown

1. **Interactive prompt extraction (C1)** — split
   `src/core/discovery/DiscovererPreference.ts`:
   - Core keeps `loadPreference()` / `savePreference()` and a pure
     `resolveDiscovererChoice(candidates, savedPreference)` decision function
     that returns `resolved | needs-confirmation` without I/O.
   - Move `promptDiscovererChoice()` (readline, TTY detection, console
     output, lines 163-211) to the consumer repo identified by RC0
     (expected: Alembic CLI layer; Plugin path returns `needs-confirmation`
     to the host instead of prompting).
   - Coordinate the consumer-side landing as a follow-up task package on the
     Alembic window within this demand.
2. **Deterministic pruning (C2)** — replace
   `Math.random() < 0.01` in `src/repository/token/TokenUsageStore.ts:154`
   with a write-counter trigger (e.g. every N inserts); keep the same MAX_ROWS
   pruning semantics; add a unit test for the trigger cadence.
3. **Migration gap note (C3)** — write the RC0 git-history verdict for
   002/003 as a comment in the migration runner (or a
   `migrations/README.md`), so the gap is self-explanatory.

## Completion Definition

`grep -rn "readline\|process.stdin" src/` returns no product-path hits;
`grep -rn "Math.random" src/` hits only `HnswIndex.ts` (algorithm-inherent,
documented); the migration gap has a written in-tree explanation; consumers
build and behave identically (prompt still appears for CLI users, now issued
from the consumer layer).

## Validation Floor

- AlembicCore vitest suite green (incl. new pruning-cadence test).
- `scripts/check-public-api-boundary.mjs`,
  `scripts/check-release-readiness.mjs`, `scripts/smoke-public-api.mjs` green.
- Downstream builds named by RC0 (Alembic, AlembicPlugin, AlembicAgent) green
  after the prompt relocation.
- Raw before/after behavior note for the discovery confirmation flow.

## Stop Conditions

- Prompt relocation would change discovery behavior for any non-TTY host —
  pause and record a design note instead of forcing it.
- Public API boundary check reports an unplanned export change.
