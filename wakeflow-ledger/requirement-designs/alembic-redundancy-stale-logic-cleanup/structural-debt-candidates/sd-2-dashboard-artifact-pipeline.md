# SD-2 — Dashboard Artifact Pipeline (`dashboard/dist` + vendor copy)

Design note for RC6 structural-debt decision gate. Drafted by the Design
window, task `alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-t1`.

Re-verification baselines (2026-06-12): Alembic `7a63e7b`, AlembicDashboard
`11c2c61`.

## Problem

The audit (A2, §7) described `Alembic/dashboard/dist` as a "manually synced
AlembicDashboard build … no automation", and `Alembic/vendor/AlembicDashboard`
as a ~307MB full working copy needing disposition.

## Evidence and re-verification (2026-06-12) — the audit premise has moved

Audit refs: `audit-findings-2026-06-11.md` A2/A8 and §7 last bullet; RC0
matrix has no dedicated row (routed straight to RC6 by the sequence design).

Fresh facts that CORRECT the audit picture:

1. **Automation exists.** `Alembic/scripts/build-dashboard.mjs` (wired as
   `npm run build:dashboard`, `Alembic/package.json:68`) builds the Dashboard
   and copies `dist/` into `dashboard/dist`, with source preference
   `../AlembicDashboard` sibling first, `vendor/AlembicDashboard` fallback
   (`resolveWorkspaceSource`). `scripts/dev-link.mjs` verifies/rebuilds it
   (`dev-link.mjs:94,211-217`). The audit's "no automation" claim is stale or
   was wrong; the script predates RC1-RC5 (history: commits `6865f61`,
   `9461232`).
2. **`dashboard/dist` is NOT tracked.** `Alembic/.gitignore:12` ignores
   `dashboard/dist/`; `git ls-files dashboard/dist` is empty. It is a local
   regenerated artifact (4.9MB, last built 2026-06-04), served at runtime by
   `lib/http/HttpServer.ts:581`.
3. **`vendor/AlembicDashboard` is a git submodule, not a stray copy.**
   `Alembic/.gitmodules` pins `vendor/AlembicCore` → `GxFn/AlembicCore.git`
   and `vendor/AlembicDashboard` → `GxFn/AlembicDashboard.git`. Tracked
   content is just the two gitlink pointers. The 307MB on disk is dominated by
   `node_modules` (301MB) — local install state, never committed.
4. **Pointer freshness is unverifiable locally.** The pinned Dashboard commit
   `d25624d` (working copy dated 2026-05-18) does not exist in the sibling
   `AlembicDashboard` clone (HEAD `11c2c61`, 2026-06-11) — the two checkouts
   have unshared history, so commit-lag cannot be counted locally; by date the
   pin is ~3.5 weeks behind. Same for `vendor/AlembicCore` pin `e809140`
   (2026-05-31) vs Core HEAD `ed42960`. (Contrast: AlembicPlugin's
   `vendor/AlembicCore` pin `648055b` IS in local Core history — 24 commits
   behind, the RC4-documented "explained lag".)
5. **Release staging assumes the sibling, not the vendor.**
   `scripts/prepare-publish-staging.mjs:19` reads
   `../AlembicDashboard/package.json` directly — release flow currently
   depends on a sibling checkout and would fail standalone, while the build
   script tolerates vendor fallback. The two flows disagree on source
   resolution.

Remaining REAL gaps after correction: (a) nothing in the release flow
demonstrably invokes `build:dashboard`, so dist freshness at release time
depends on developer memory (the 2026-06-04 build date vs 2026-06-11 Dashboard
HEAD illustrates this); (b) Alembic has no documented vendor-refresh flow for
its two submodules (AlembicPlugin got one in RC4; Alembic did not); (c) the
sibling-vs-vendor inconsistency in (5).

## Options

### Option A — Wire `build:dashboard` into release staging + document refresh flow

Make `prepare-publish-staging.mjs` (or the release checklist it implements)
run/verify `build:dashboard` and fail on a stale `dashboard/dist`; unify
source resolution by reusing `resolveWorkspaceSource` in staging; add an
Alembic `AGENTS.md` vendor-refresh section mirroring the RC4-written
AlembicPlugin one (refresh command, lag check, explained-lag rule).

- Cost: small (one script touch + docs). Risk: low; behavior-preserving for
  dev flows.

### Option B — Published artifact package (e.g. `@alembic/dashboard-dist`)

Dashboard publishes its build; Alembic consumes the package at release; drop
the `vendor/AlembicDashboard` submodule.

- Cost: new publish pipeline + version coordination; removes the submodule and
  the 307MB local weight. Risk: offline/portable installs lose their in-repo
  source (the submodule exists for exactly that); registry becomes a release
  dependency. Premature while there is no external consumer of the artifact.

### Option C — Documented manual flow only

Write the procedure (when to run `build:dashboard`, when to bump the
submodule) without wiring enforcement.

- Cost: ~zero. Risk: the actual failure mode observed (stale dist vs Dashboard
  HEAD) remains possible; docs rot.

## Recommendation

**Option A.** Vendor-copy disposition: KEEP the submodule (it is the
documented offline/fallback source and costs 2 gitlink entries in git), but
(1) document its refresh flow in Alembic `AGENTS.md`, (2) note that
`node_modules` inside it is local state safe to clean, and (3) refresh the
pointer deliberately at the next release so its date-lag becomes an explained
state. Option B is deferable until a real registry consumer exists; Option C
is insufficient against the observed staleness.

## Affected repositories

Alembic (scripts + AGENTS.md). AlembicDashboard unchanged (its
`npm run build` already produces the artifact). No Core/Agent/Plugin impact.

## Validation outline

- From a clean `dashboard/dist`-removed state: `npm run build:dashboard` →
  `dashboard/dist/index.html` exists; staging run fails before / passes after
  (demonstrated stale-detection FAIL + green pair, RC-style evidence).
- `git -C Alembic submodule status` recorded before/after pointer refresh;
  refresh procedure executed once per the new doc.
- Alembic build + unit suite green (no runtime change expected).
