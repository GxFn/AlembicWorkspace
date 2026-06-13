# RW5 — 0.3.0 Release Readiness And Acceptance (2026-06-13)

Controller self-assessment closing the release wave up to the publish gate.
Publish (C1) is HELD for the explicit user trigger; everything before the
publish button is staged, verified, and frozen.

## Release code waves — all accepted

| Wave | Window | Scope | Commits | Accept |
| --- | --- | --- | --- | --- |
| RW0+RW1+RW2 (rw-t1) | AlembicCore | fresh re-scan precondition; B2 `./shared` re-point to root facade; SD-5 phase-2 deletion of the 67 zero-consumer wildcard keys + keep-alive fold | `2823939..fd940f2` (re-point `7777dcb`, deletion `fd940f2`) | accepted |
| RW3 / SN4 (rw-t3) | AlembicCore | Core source-naming wave (32 internal renames, export-shape rule), `.git-blame-ignore-revs`, gate-config moves in-commit | `fd940f2..a59bbcf` (rename `e1a4d58`, lint src-flip `dfc822d`, blame-ignore `a59bbcf`) | accepted |
| RW4 (rw-t2) | AlembicPlugin | A3 R-1 evolution/panorama overlay-route delete (RC4-style proof, route inventory 11→9) + C2 version-pin/marketplace tail | `28ed99c` (+ C2 tail) | accepted |

Controller independent cross-checks recorded at accept: SD-5 deletion safe
(`git diff fd940f2..a59bbcf -- package.json` exports = 0 changed lines;
downstream AlembicAgent `tsc --noEmit` exit 0 against the renamed Core);
naming lint src-active and green in every repo (BLOCKING); dual-shell parity
byte-stable for the RW4 Plugin change.

## AFAPI-REQ-08 runtime-snapshot release judgment

RESOLVED 2026-06-13 — the user marked it completed. Controller verified the
parent `plugins/` tree and both shells were clean / even with origin, so the
P5 cache-reload changes were transient install-cache state with nothing
tracked to commit or discard. No release-path action pending.

## Full release gate matrix (frozen, controller-verified 2026-06-13)

| Repo | HEAD | clean | even w/ origin | version |
| --- | --- | --- | --- | --- |
| Alembic | `188938e` | yes | yes | 0.2.0 |
| AlembicCore | `471c270` | yes | yes | 0.2.0 |
| AlembicAgent | `9c2a4b3` | yes | yes | 0.2.0 |
| AlembicDashboard | `18837ef` | yes | yes | 0.2.0 |
| AlembicPlugin | `5f879ec` | yes | yes | 0.2.0 |

Runtime package `@gxfn/alembic-runtime` = 0.2.0 (source
`packages/alembic-codex-runtime` and the staged `.tmp` prepared package).
No version bump anywhere — the non-goal "no publish or version bump without
the explicit user trigger" is honored. Each wave ran its owning repo's full
check green at accept; the trees are unchanged (clean + even) since, so the
matrix is frozen at the accepted, verified state.

## The one remaining step — HELD for the user

C1 runtime publish is the only thing left, and it is the user's button:

1. Staged command (user-triggered): `npm publish --access public` for
   `@gxfn/alembic-runtime@0.2.0`.
2. After publish, verify the cacheless cold start resolves on both hosts
   (the live-proven E404 disappears once the package exists on the registry).

Until the user triggers the publish, the cacheless cold-start E404 remains
the expected pre-publish state (the runtime was never published; the tgz is
the artifact a publish ships). `verify:codex-runtime-package` failing at the
install-of-tarballs step pre-publish is this same expected state, not a
defect.

## Release-readiness verdict

Release-ready. The 0.3.0 public surface is consistent and frozen across all
five repos at 0.2.0; SD-5 deletion landed at the closeout target with zero
behavior change; `./shared` settled on the root facade with valid import
paths; the SN4 Core naming wave landed rename-only with lint green; the R-1
overlays are deleted with the proof set; the C2 version-pin/marketplace tail
is closed. The publish is the single user-gated action; the cold-start
verification rides it.

## Routed (not blockers)

- The 9 RW2-residue `facadeReadiness` deep-path doc keys (pre-existing from
  the SD-5 deletion, doc-only) — fold into a future Core doc touch.
- `CO3-TAXONOMY-FACADE-PROMOTION` stays a deferred export-surface decision:
  RW1 re-pointed to the root facade (keep-internal), so PersistenceError /
  DivergenceError were not promoted onto `./shared`; revisit at a future
  export-surface wave if external consumers need the facade classes.
