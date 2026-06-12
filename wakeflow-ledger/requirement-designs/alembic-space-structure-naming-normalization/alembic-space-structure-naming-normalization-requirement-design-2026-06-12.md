# Alembic Space Structure And Naming Normalization Requirement Design

Status: candidate / user-requested 2026-06-12 / execution waves are the final cleanup train (per-repo gates) / needs controller intake
Date: 2026-06-12
Design Key: alembic-space-structure-naming-normalization
Primary Windows: AlembicWorkspace (spec, census, acceptance); one wave per product repo (Dashboard pilot → Agent → Alembic → Core → Plugin post-CKG)

## Problem

Folder hierarchy and file naming across the five repos grew by accretion.
The census ([structure-naming-findings-2026-06-12.md](structure-naming-findings-2026-06-12.md))
shows a real dominant convention (lowercase/kebab directories; PascalCase
class modules, single-lower barrels, kebab multi-word utilities) with a
small straggler set (~30 camelCase files; per-repo judgment cases like
`bootstrapDimensionConfigs.ts` next to `cold-start.ts`), an unwritten
status — nothing enforces any of it — and folder hierarchies that predate
the layer contracts now being written (AD3). Plugin still carries the
host-named `lib/codex/` tree that CC deferred. Renames look trivial but
their blast radius is not: public wildcard-exposed directories, a dozen
path-based gate configs, git history, and every open diff in the queued
sequences.

## Goal

1. **One written convention**, codified from the measured dominants (not
   an invented style): per artifact type — class/contract module, barrel,
   multi-word utility, test, script, config; directory casing; React
   `.tsx` rules for Dashboard; enforced by a naming lint in every repo.
2. **Target tree per repo**, derived from the AD2 charters and AD3 layer
   contracts: physical directories mirror the written responsibility
   model; stragglers and misplaced files get explicit target homes.
3. **A real landing plan**: per-repo migration waves executed as the
   final cleanup train — codemod tooling (`git mv` + import rewrite +
   same-commit gate-config updates), blame preserved
   (`.git-blame-ignore-revs`), full gates green per wave, behavior
   provably unchanged.
4. **Public-surface safety**: exports-mapped moves shielded by the map;
   wildcard-exposed directories frozen until SD-5 phase 2, then handled
   release-aligned or excluded.

## Non-goals

- No behavior, API, or contract changes — renames/moves only; every wave
  proves behavior-neutrality via full checks and downstream builds.
- No new structure invention against taste: the convention codifies
  measured dominants; the trees follow AD's written contracts.
- No public specifier changes outside the SD-5-phase-2-aligned ruling.
- No wave on a repo that has any other in-flight demand; Plugin wave
  additionally waits for CKG completion and the CC packaging demands.
- No version bumps or releases without user direction.

## Candidate Demand Sequence

### SN0 - Convention Spec, Census Freeze, Target Trees, Tooling Spec (AlembicWorkspace)

- full census re-freeze including `.tsx` and per-artifact-type
  classification; straggler list per repo;
- the written naming convention (codified dominants) as a space-level
  artifact, plus the naming-lint specification;
- target tree map per repo derived from AD2 charters + AD3 layer
  contracts (dependency: runs after AD3 outputs exist);
- the public-path constraint map: exports-mapped (shieldable) vs
  wildcard-exposed (frozen) paths; the path-based gate-config inventory
  that must move in-commit (boundary lints, RC5 manifest,
  boundary-policy paths, validation-floor snapshots, biome/tsconfig);
- migration tooling spec: codemod pipeline, `git mv` discipline,
  single-purpose commits, `.git-blame-ignore-revs` per wave;
- execute within the four user gates recorded 2026-06-12 (see
  Decisions): codify-dominants convention, `lib/codex/` rename in SN5,
  ignore-revs blame discipline, wildcard directories frozen until
  post-SD-5-phase-2 — SN0 turns these into the written convention
  artifact, the SN5 rename plan, the per-wave commit protocol, and the
  frozen-path list.

### SN1 - Tooling Build And Pilot Wave: AlembicDashboard

- build the codemod pipeline; pilot on the smallest, consumer-free repo;
- Dashboard wave: `.tsx`/`.ts` naming per spec, tree per its AD3
  conventions contract; naming lint wired into its check;
- pilot report: tooling defects, time-per-file, gate-config update
  pattern — feeds every later wave.

### SN2 - AlembicAgent Wave

- already the cleanest (0 camelCase) — lowest-risk package repo;
- tree alignment per its AD3 contract; naming lint wired;
- same-commit updates: import boundary configs, public-api boundary
  policy paths, validation-floor snapshot; signature smoke and 15-export
  surface byte-stable; downstream Alembic build green.

### SN3 - Alembic Wave

- the largest tree (16 lib/ areas) aligned to its AD3 layer contract;
  straggler renames; naming lint wired;
- same-commit updates: extraction/repo-boundary lints, RC5 shared-asset
  manifest paths, provider-contract doc regeneration if file moves touch
  it; full check (units + integration + coverage floors + drift gate)
  green.

### SN4 - AlembicCore Wave

- the public-surface repo: exports-mapped moves with map updates
  (specifiers byte-stable, proven by the prescriptive boundary gate +
  smoke + consumer lint across all three consumers);
- wildcard-exposed directories handled per the SN0 ruling (frozen or
  release-aligned post-SD-5-p2);
- layer-contract lint, boundary policy, lint-debt doc paths updated
  in-commit; 1133+ tests green; downstream builds green.

### SN5 - AlembicPlugin Wave (gates: CKG complete + CC packaging landed)

- tree and naming per spec, including the SN0-ruled `lib/codex/`
  host-neutral rename (imports, tsconfig aliases, vendored-path
  references, `.mcp.json` command paths updated in-commit);
- Codex parity gate (tools/list + representative callTool byte-stable)
  and the CC Claude-Code parity equivalent both green; naming lint
  wired.

### SN6 - Space Acceptance And Archive (AlembicWorkspace)

- space-wide proof: naming lint green in all five repos; straggler count
  → 0 per the spec; target trees realized or deviations explicitly
  ruled; all gates and downstream builds green; behavior-neutrality
  attested per wave (no production-code semantic diffs beyond
  moves/renames — mechanical-diff audit);
- census deltas vs SN0; ledger archive; Wakeflow verification.

## Producer/Consumer Order And Queue Position

SN0 (after AD3 outputs) → SN1 pilot → SN2 → SN3 → SN4 → SN5 (post-CKG +
post-CC) → SN6. One wave per repo, never concurrent with another demand
on the same repo. Recommended global position: the FINAL cleanup train —
after the CKG/IC/AD/MT bodies land per repo — precisely because renames
conflict with every open diff.

## Completion Definition

- The written convention exists, is user-ruled, and is lint-enforced in
  all five repos; stragglers are zero.
- Each repo's physical tree matches its AD-derived target map or carries
  an explicit ruled deviation.
- Public specifiers unchanged (or changed only inside the ruled
  release-aligned wave); all path-based gates updated in-commit and
  green; blame preserved.
- All waves behavior-neutral by evidence; space acceptance archived.

## Validation Requirements

Per wave: the repo's full check pipeline + every path-based gate it
hosts + downstream builds of its consumers + the new naming lint with a
demonstrated failure; SN4 adds the three-consumer import scans; SN5 adds
both host parity gates; SN6 runs the space matrix, the mechanical-diff
audit, and Wakeflow verification.

## Stop Conditions

- A move would change a public specifier outside the SN0 ruling.
- A path-based gate config cannot be updated in the same commit as its
  targets.
- The target repo has any other in-flight demand.
- A wave diff contains semantic changes beyond moves/renames.
- Plugin wave before CKG completion and CC packaging.
- Prose-only evidence.

## Decisions And Open Items

Inherited: Plugin hands-off until CKG; releases user-directed; all
existing gates and ratchets are protection nets, never weakened.

Resolved by user confirmation on 2026-06-12 (all four SN0 gates, as
recommended):

- Convention route: codify the measured dominant styles per artifact
  type and normalize the stragglers — no new invented style.
- Plugin `lib/codex/` host-neutral rename IS in SN5 scope (the
  CC-deferred cleanup lands here).
- Blame strategy: `git mv` + single-purpose rename commits +
  `.git-blame-ignore-revs` entry per wave.
- Wildcard-exposed Core directories: frozen until SD-5 phase 2 lands,
  then a release-aligned ruling.

For intake: SN0 timing relative to AD3; whether SN2/SN3 may interleave
with remaining MT fixes per repo.
