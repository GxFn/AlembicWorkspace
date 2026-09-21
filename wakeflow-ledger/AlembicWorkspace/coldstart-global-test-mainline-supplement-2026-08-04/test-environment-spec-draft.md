# BiliDili cold-start global-test environment specification — draft

Date: 2026-08-04

Status: **draft / not authorized for execution**

## Test question

From the real Dashboard red clear-and-rebuild action, does the accepted production build run one
ordinary bootstrap Job against the BiliDili project, automatically select exactly one applicable
dimension while global test mode is enabled, preserve a usable trash reference, complete the same
strict production-to-publication chain, and expose the terminal backend result?

## Environment

- project source: workspace-relative `BiliDili/`;
- project mode: the existing registered BiliDili project scope and its resolver-derived Ghost data
  root; Test must not invent or override either root;
- UI entry: the currently configured AlembicDashboard service and its Candidates/Jobs
  clear-and-rebuild action;
- backend entry: the accepted ordinary `POST /api/v1/jobs/bootstrap` contract;
- global state: `ALEMBIC_TEST_MODE=1` at service startup;
- bootstrap dimension allowlist: unset; the backend selector, not Test or Dashboard, chooses the
  one dimension;
- artifacts: exact product revisions/builds already accepted by the controller; Test does not
  rebuild or substitute packages;
- provider/config/credentials: the existing production BiliDili service configuration. Test may
  verify presence and report missing values, but may not choose replacements.

## Destructive boundary

The allowed mutation boundary is only the resolver-derived BiliDili knowledge data root and its
database/publication data. BiliDili source files, Git state, sibling project roots, AlembicWorkspace
knowledge data, and product repository data are forbidden.

The existing `CleanupService` trash folder is the recovery trace. This Test does not require or
authorize a new whole-root snapshot, external setup authority, daemon quiesce protocol, or automatic
restore. The final Test start still requires the user's explicit destructive-run authorization.

## Preconditions

1. Core, Agent, Main, and Dashboard targets for this supplement are accepted.
2. Controller cross-chain probes prove the route, order, failure boundaries, and exact loaded
   builds without using BiliDili as first implementation verification.
3. The service is restarted with global test mode enabled and no bootstrap allowlist.
4. BiliDili project/data-root identity is read back from the service and matches the intended
   registered scope.
5. Current Job state is idle and no competing writer is active.
6. The user explicitly authorizes the destructive run after seeing the resolved project identity
   and mutation boundary.

## Approved steps

1. Capture read-only pre-run project identity, applicable-dimension summary, active public route,
   and knowledge/trash inventory.
2. Click the Dashboard red clear-and-rebuild action once.
3. Observe one Job from preflight through selection, cleanup, strict semantic production, and final
   publication; do not issue another bootstrap or a direct API alternative.
4. Verify the selected set contains exactly one applicable dimension and was chosen by backend
   state, not UI/Test input.
5. Verify the Job exposes its trash reference and terminal strict status.
6. Verify a new active public route is visible only after successful terminal publication and that
   the resulting Recipe data belongs to the selected dimension's production chain.

## Success means

- exactly one destructive bootstrap Job and one backend-selected applicable dimension;
- no `strictProduction`, dimensions, reset, reviewer, artifact, or private-test request payload;
- one `CleanupService` trash/reset operation with a readable trash reference;
- the same production semantic/private/publication stages used by normal mode;
- terminal strict success and Dashboard readback of selected scope/trash/status;
- BiliDili source and all forbidden roots unchanged.

## Failure means

- preflight mutation, zero/multiple selected dimensions, caller-selected scope, legacy/private route,
  absent trash reference, cleanup proceeding after move/snapshot failure, semantic-stage omission,
  non-terminal/false-success Job, premature public-route switch, or any out-of-bound write.

## Cannot conclude

A passing one-dimension Test does not prove all-dimension quality, Plugin parity, rescan behavior,
failure injection coverage, or safety for another project root. Those are outside this Test card.

## Stop conditions

Stop without clicking when project/data-root identity is unresolved, global mode/build provenance is
not the accepted one, the Job system is busy, a competing writer exists, or the user has not given
the final destructive-run authorization. After start, stop further actions on any root mismatch or
out-of-bound mutation signal and preserve the existing Job/trash evidence.
