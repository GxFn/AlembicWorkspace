# Routed Disposition — Plugin `evolution` / `panorama` HTTP Surfaces (from RC4)

Design note for RC6 structural-debt decision gate (routed item, not an SD
candidate). Drafted by the Design window, task
`alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-t1`.

Re-verification baselines (2026-06-12): AlembicPlugin `41ee2a7`, Alembic
`7a63e7b`.

## Problem

RC4 pruned 8 of 9 remove-candidate plugin HTTP routes and reclassified `auth`
keep-with-consumer, but explicitly routed two surfaces here with NO silent
deletion: `evolution` and `panorama` have no named in-repo consumer beyond
their `HttpServer` mounts. (`modules` is NOT in question — RC4 found a real
Dashboard consumer, `AlembicDashboard src/api.ts:3238-3361`.) The controller
must decide whether these two surfaces live, die, or fold into a successor
demand. A second, optional question RC4 flagged: whether release-flow
documentation mirroring justifies a deliberate `GxFn/AlembicCodex` submodule
commit.

## Evidence and re-verification (2026-06-12)

Refs: RC4 disposition
(`alembic-redundancy-stale-logic-cleanup-rc4-plugin-docs-legacy-governance/evidence/p4-route-disposition-2026-06-11.md`),
RC4 raw scans (`evidence/raw/p4-route-scan-{evolution,panorama}.txt`), RC4
execution summary §"Residual risks" items 2 and 5; RC0 matrix P4 verdicts +
the 2026-06-12 auth-correction lesson.

Fresh scan (this note, 2026-06-12 — includes dynamic `import(` forms and HTTP
path literals across all five repos per the RC4 auth lesson):

- `AlembicPlugin/lib/http/routes/evolution.ts` (**272** lines) — zero
  consumers of `/api/v1/evolution` or `routes/evolution` anywhere in the five
  repos other than the plugin `HttpServer` mount and the MAIN repo's own twin
  route (main's mount is contract-required there: `Alembic
  lib/http/provider-contracts.ts:542` I22). Dashboard has no evolution
  callers. Matches RC4.
- `AlembicPlugin/lib/http/routes/panorama.ts` (**377** lines) — same result;
  only consumer is the plugin unit test (`PresentationRoutes.test.ts`).
  Notably `panorama.ts` is byte-identical between main and plugin (SD-1
  identical-file scan), and the MAIN twin is contract-mounted
  (`provider-contracts.ts:541`).
- Both routes are NOT in the plugin's required-route contract
  (`CODEX_EMBEDDED_RUNTIME_REQUIRED_ROUTES`, `EmbeddedRuntimeContract.ts:8-17`
  — 7 routes). Current plugin route files: 11 (auth, daemon, evolution, guard,
  health, jobs, knowledge, modules, panorama, search, skills).
- Service-layer logic behind both routes remains reachable through other
  surfaces (RC4 finding), so deletion would remove only the HTTP read surface,
  not capability.
- Caveat that kept them alive at RC4: a consumer on an external Codex host
  would not be visible in-repo; and the auth precedent proved zero-consumer
  scans can be wrong (dynamic import + cross-repo HTTP literals were missed by
  RC0 — found by RC4).

## Options

### Option 1 — Delete both surfaces now

External-deletion rule status: import scan clean (twice: RC4 + this note,
with the improved scan method), replacement entrypoint n/a (read surface
only, service logic reachable elsewhere), build/smoke would be re-run at
execution. Collateral: trim `PresentationRoutes.test.ts` panorama block;
panorama drops out of the SD-1 byte-identical set.

- Cost: small, well-rehearsed (RC4 removed 8 routes with this exact recipe).
- Risk: the invisible-external-consumer scenario. Two clean scans lower but
  cannot zero it; the RC4 auth falsification is a recent, concrete reminder.

### Option 2 — Keep by policy with a register entry + deletion deadline

Add both to the RC4-created `docs/legacy-register.md` pattern:
keep-with-reason, owner = AlembicPlugin window, re-scan condition, and a
concrete trigger ("if no consumer is named by the next plugin release
decision, delete in that release's cleanup wave").

- Cost: one register entry now, deletion deferred one release cycle.
- Risk: ~none structurally; 649 route lines persist temporarily but are
  drift-gated nowhere and consumed nowhere.

### Option 3 — Fold into an SD-1/SD-6 successor demand

Treat panorama (byte-identical twin) under SD-1's lib-manifest work and
evolution under a daemon/diagnostics surface decision.

- Cost: couples a small, already-scoped decision to larger demands with
  unconfirmed scope. Risk: the decision rots while waiting; SD-1's
  recommendation explicitly leaves intentional/unconsumed surfaces undeclared,
  so this routing adds nothing.

## Recommendation

**Option 2** (deadline-marked keep), executed as a one-line register change on
the AlembicPlugin window; the deletion trigger fires at the next plugin
release decision. Do not choose Option 3 — it dissolves a decided question
into undecided demands. The main-repo twins stay untouched regardless (their
mounts are contract-required in main).

## Optional question routed from RC4 P5 — RELEASE-PLAYBOOK mirroring

Facts (verified): RC4 documented the `vendor/AlembicCore` refresh flow in
`AlembicPlugin/AGENTS.md` (current lag 24 commits, explained state).
`RELEASE-PLAYBOOK.md` lives inside the `plugins/alembic-codex` submodule
(separate repo `GxFn/AlembicCodex`, pinned `9f8b9dc`) and contains NO vendor
mention (grep clean); RC4 reverted a draft submodule edit to avoid expanding
the repository boundary.

Recommendation: **do not make a standalone doc-only submodule commit.** The
AGENTS.md section is the single authoritative home; add a one-line pointer to
it in RELEASE-PLAYBOOK.md as a RIDER on the next planned `alembic-codex`
release commit (which bumps the submodule pointer anyway), recorded as a TODO
on that release decision. This keeps the boundary discipline RC4 chose while
closing the discoverability gap at zero extra release surface.

## Affected repositories

AlembicPlugin (register entry now; route deletion at trigger). GxFn/AlembicCodex
submodule only as a rider on its next release commit.

## Validation outline

- Register entry present; `git diff --check` + docs verification.
- At deletion trigger: fresh per-route scan (dynamic imports + HTTP literals,
  five repos) attached raw; plugin vitest + `lint-repo-boundary` +
  `smoke-codex-plugin` + MCP `tools/list`/callTool samples green; boundary
  test updated to pin the removals (same proof shape as RC4's 8 removals).
