# Alembic 0.3.0 Release Wave Requirement Design

Status: controller intake complete (reviewed 2026-06-13) / release-coupled, publish user-triggered / ready for user rulings — no wave executes until the user rules
Date: 2026-06-13
Design Key: alembic-0.3.0-release-wave
Primary Windows: AlembicWorkspace (gate + acceptance), AlembicCore (SD-5 + ./shared + SN4), AlembicPlugin (overlay routes, version pins)
Validation Surface: AlembicWorkspace controller; downstream builds of all consumers

## Problem

The portfolio left a release-coupled set staged but not executed, because
every item in it is a user release decision. The controller delivered the
package; nothing publishes or deletes until the user rules. These items are
genuinely coupled — SD-5 deletion changes the public surface, `./shared`
sequencing must precede that deletion, the runtime publish closes a
live-proven cold-start failure, and the Core source-naming wave (SN4) is
physically parked behind SD-5. Ruling and executing them as one 0.3.0 wave
keeps the public surface and the release consistent.

Source: [R — 0.3.0 decision package](../alembic-portfolio-execution-plan/r-delivery-0.3.0-decision-package-2026-06-12.md),
[0.3.0 ledger](../alembic-portfolio-execution-plan/release-wave-0.3.0-ledger-2026-06-12.md),
[SN6 census review](../alembic-space-structure-naming-normalization/sn6-terminal-census-review-2026-06-12.md).

## Goal

A consistent 0.3.0 public surface and a working cacheless cold start:

1. The pinned runtime `@gxfn/alembic-runtime@0.2.0` is published (closing
   the live-proven E404 cacheless cold-start failure on both hosts) — on
   the user's publish trigger, with the staged command.
2. SD-5 phase-2 executes: 67/67 verified-zero-consumer wildcard keys
   deleted and the keep-alive set folded (drizzle exact-row survives), on a
   fresh re-scan precondition, with expectedCounts moved to the closeout
   target.
3. `./shared` facade contents are settled (B2) BEFORE the deletion so MT2
   OutputBudget and the CO3 error classes keep a valid import path.
4. The SN4 Core source-naming wave runs once SD-5 un-parks the frozen
   src-covering wildcards (per the SN6 resumption pointer), with naming
   lint green and zero behavior change.
5. The R-1 plugin evolution/panorama overlay routes are resolved (A3):
   kept with a named consumer or deleted-in-0.3.0 with the RC4-style proof
   set.
6. The C2 version-pin / marketplace tail is closed: 0.2.0 pin policy
   (bump vs SHA), marketplace hosting/naming under `alembic@gxfn`, and the
   negative-cache clear step in the install docs.

## Non-goals

- No publish or version bump without the explicit user trigger — the wave
  stages and verifies; the user pushes the publish button.
- No deletion beyond the 67/67 SD-5-staged keys + the folded keep-alive
  set; the drizzle exact-row stays (5 consumers).
- No behavior change anywhere — SD-5 deletes only zero-consumer surface,
  SN4 is rename-only, `./shared` sequencing is import-path-only.
- No CKG work; no new features.

## Candidate Demand Sequence

### RW0 - Release Gate Freeze And B2/A3 Rulings (AlembicWorkspace)

- fresh full re-scan precondition for SD-5 (4-repo reference resolution,
  zero-served proof per row) — re-confirm 67/67 and the keep-alive 36/37;
- USER RULINGS: (a) B2 `./shared` route — promote OutputBudget + CO3
  PersistenceError/DivergenceError onto `./shared` with a budget raise,
  vs re-point MT2 docs to the root facade and delete as staged;
  (b) A3 R-1 overlays — name a consumer (keep with owner) vs delete-in-0.3.0;
  (c) C2 version-pin policy — exact 0.2.0 pin bump vs SHA-based; marketplace
  hosting confirm;
- confirm the wave ordering: B2 settle → SD-5 delete → SN4 unpark → publish
  on user trigger.

### RW1 - ./shared Sequencing (AlembicCore)

- enact the B2 ruling so MT2 OutputBudget and the CO3 error classes have a
  valid, stable import path independent of the wildcard deletion;
- prove no consumer's import path breaks (Core + downstream builds green).

### RW2 - SD-5 Phase-2 Execution (AlembicCore)

- delete the 67/67 verified-zero-consumer wildcard keys; fold the keep-alive
  set (drizzle exact-row survives); update expectedCounts to the closeout
  target; closeout report shows candidates 0;
- boundary gate, smoke, and three-consumer import scans green; downstream
  Alembic/Agent/Plugin builds green.

### RW3 - SN4 Core Source Naming Wave (AlembicCore)

- with the src-covering wildcards un-frozen by RW2, run the parked SN4
  source-naming wave per the SN6 resumption pointer: git-mv codemod,
  single-purpose commits, `.git-blame-ignore-revs`, gate-config moves
  in-commit;
- naming lint green (already BLOCKING), full check green, mechanical-diff
  audit proves zero behavior change.

### RW4 - R-1 Overlay Routes And Version-Pin Tail (AlembicPlugin)

- enact the A3 ruling on the evolution/panorama overlay routes (keep with
  owner record, or delete with the RC4-style proof set);
- close the C2 version-pin tail: pin policy applied, marketplace
  hosting/naming under `alembic@gxfn`, negative-cache clear step added to
  install docs;
- both shells' Codex/Claude-Code parity gates byte-stable.

### RW5 - Publish And Release Acceptance (AlembicWorkspace; publish = user trigger)

- on the user's publish trigger: run the staged
  `npm publish --access public` for `@gxfn/alembic-runtime@0.2.0` and
  verify the cacheless cold start resolves on both hosts (E404 gone);
- AFAPI-REQ-08 runtime-snapshot release judgment: decide commit-vs-discard
  for the nested `plugins/alembic-codex` runtime snapshot changes that the
  P5 cache reload generated — this is the release/runtime-snapshot path the
  row was held for; record the decision and leave the tree clean;
- full release gate matrix: all five repos green, boundary closeout at the
  new target, naming lints green, downstream builds green;
- controller acceptance from raw evidence; 0.3.0 ledger closed; archive;
  Wakeflow verification.

## Completion Definition

- Runtime published (user trigger) and cacheless cold start verified on
  both hosts; SD-5 deletion done with expectedCounts at the closeout
  target and zero behavior change; `./shared` settled with valid import
  paths; SN4 Core naming wave landed rename-only with lint green; R-1
  overlays resolved; C2 tail closed.
- All five repos green, downstream builds green, 0.3.0 ledger closed,
  archived.

## Validation Requirements

RW0 fresh re-scan evidence; RW1/RW2 three-consumer import scans + downstream
builds; RW3 mechanical-diff audit + naming lint; RW4 dual-shell parity
gates; RW5 the publish verification + full release matrix + Wakeflow
verification. Every new or changed gate carries a demonstrated failure.

## Stop Conditions

- A "zero-consumer" SD-5 key shows a live consumer on the fresh re-scan —
  stop that key, re-rule.
- Any deletion or rename would change behavior or a public specifier
  outside the SD-5/SN4 ruled set.
- A downstream build breaks — stop, do not weaken a gate to pass.
- Publish attempted without the user trigger.
- Prose-only evidence.

## Decisions And Open Items

Inherited: publishes user-triggered; C2 naming already RULED (plugin =
`alembic`, runtime = `@gxfn/alembic-runtime`) — only the version-pin /
marketplace tail remains. For RW0 user rulings: B2 route, A3 keep/delete,
C2 pin policy. For intake: whether RW3 SN4 runs immediately after RW2 or as
a fast-follow once the boundary closeout settles.

Controller intake note (2026-06-13): partition gap closed — the
AFAPI-REQ-08 runtime-snapshot release-judgment row (R-package §4) is homed
here at RW5 as a release-path decision; it was previously unhomed across the
group. No other R-package / AD2-register / open-TODO item is unhomed (index
partition guarantee re-verified).
