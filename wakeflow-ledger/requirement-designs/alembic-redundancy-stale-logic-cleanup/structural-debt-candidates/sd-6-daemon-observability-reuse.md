# SD-6 — Daemon Job Observability Reuse

Design note for RC6 structural-debt decision gate. Drafted by the Design
window, task `alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-t1`.

Re-verification baselines (2026-06-12): Alembic `7a63e7b`, AlembicPlugin
`41ee2a7`, AlembicCore `ed42960`.

## Problem

AlembicPlugin's `DaemonJobRunner` is a deliberately stripped variant of the
main repo's: the observability stack was removed when the plugin runtime was
carved out. That divergence is verified-intentional (audit §7 "intentional
divergence (verified healthy)"), but it leaves a structural consequence: if
the Codex plugin ever needs job observability, there is no shared substrate to
build on — it would either re-duplicate the main repo's stack or grow a third
implementation.

## Evidence and re-verification (2026-06-12)

Refs: audit §7; RC0 matrix row "Drift" (lib divergence classified
intentional).

- Line counts re-measured, EXACTLY matching the audit: main
  `Alembic/lib/daemon/DaemonJobRunner.ts` **1203** lines vs plugin
  `AlembicPlugin/lib/daemon/DaemonJobRunner.ts` **299** lines.
- Directory shape (fresh listing): main `lib/daemon/` has **10** modules —
  `DaemonJobRunner`, `DaemonSupervisor`, `FileMonitorStatus`,
  `JobDisplaySnapshotStore`, `JobProcessEventArtifacts`,
  `JobProcessEventRecorder`, `PcvObservabilityLinkage`,
  `ProjectRuntimeControl`, `ProjectRuntimeSourceOfTruth`, `RuntimeBoundary`.
  Plugin has **2**: `DaemonJobRunner`, `DaemonSupervisor`.
- What was stripped (import comparison): display snapshots
  (`JobDisplaySnapshotStore`), process-event artifacts/recording
  (`JobProcessEventArtifacts`), PCV observability linkage
  (`attachPcvN9ObservabilityCarry`), bootstrap process-event drafts, and the
  project-scope-registry coupling. The plugin variant keeps only create/run
  job mechanics.
- Shared substrate that DOES exist: both variants build on
  `@alembic/core/daemon` (`JobStore`, `DaemonJobKind/Record/Source` types) —
  Core already owns job persistence; only the observability layer is
  main-repo-private.
- Demand-side fact: no current plugin requirement for job observability was
  found in any RC0-RC5 evidence or plugin issue surface; the plugin's `jobs`
  HTTP route (a P4 keep, resident-client consumer) serves job state reads
  without the observability stack.

## Options

### Option A — Extract job observability into Core (`@alembic/core/daemon` extension)

Move the deterministic parts (process-event recording, artifact
materialization, snapshot persistence) into Core next to `JobStore`; hosts
keep their own wiring (PCV linkage and display concerns are main-product
specific and would stay behind).

- Cost: medium-large — untangling `ProjectScopeRegistry` / PCV / bootstrap
  couplings from the deterministic core; new Core surface while SD-5 is
  shrinking it; vendor-snapshot propagation for the plugin.
- Risk: building reusable capability with NO second consumer today — exactly
  the "empty abstraction / no real caller" pattern the workspace stop-cards
  forbid. The extraction would be speculative.

### Option B — Agent-hosted capability

- Poor fit: AlembicAgent owns the agent/tool runtime, not the daemon; neither
  daemon variant depends on Agent. Listed only for completeness.

### Option C — Main-repo-only by policy, with a written re-open trigger

Record in both repos' governance surfaces (Alembic + AlembicPlugin AGENTS.md
or the plugin's existing `docs/legacy-register.md` pattern): job observability
is an Alembic-main capability by design; the plugin daemon stays minimal; the
decision re-opens as a Core-hosted extraction (Option A) when the FIRST real
plugin job-observability requirement lands — and then preferably after SD-5
closeout so Core surface changes do not collide.

- Cost: ~zero (a register entry). Risk: if a Codex-host observability need
  arrives, capability starts a demand-cycle behind — accepted and explicit,
  versus paying extraction cost now for a consumer that may never come.

## Recommendation

**Option C.** The divergence is healthy today; the real debt is only the
UNDOCUMENTED nature of the reuse boundary. Write the policy + trigger into the
register so the next person finding the 1203-vs-299 split reads a decision,
not an anomaly. Revisit as Option A only on a named consumer, sequenced after
SD-5.

## Affected repositories

Documentation/register only: Alembic, AlembicPlugin. (AlembicCore untouched
unless the trigger fires.)

## Validation outline

- Register entries present in both repos naming: owner, policy, re-open
  trigger, and the RC6 SD-6 decision record reference.
- No code change → no test delta; `git diff --check` + docs verification only.
- If the trigger ever fires: that demand carries its own validation (Core
  suite, both daemon consumers, plugin smoke + vendor refresh).
