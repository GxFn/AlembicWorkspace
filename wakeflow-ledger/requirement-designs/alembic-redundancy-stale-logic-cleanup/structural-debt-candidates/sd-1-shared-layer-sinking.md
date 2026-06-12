# SD-1 — Shared Layer Sinking (Alembic ↔ AlembicPlugin lib/ duplication)

Design note for RC6 structural-debt decision gate. Drafted by the Design
window, task `alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-t1`.
Design role: clarify / compare / recommend only — no implementation authority.

Re-verification baselines (2026-06-12): Alembic `7a63e7b`, AlembicPlugin
`41ee2a7`, AlembicCore `ed42960`.

## Problem

Alembic (main runtime) and AlembicPlugin (Codex portable runtime) each carry a
full `lib/` tree. The audit flagged `lib/governance/`, `lib/injection/`,
`lib/shared/schemas/`, `lib/types/` as ~90-100% identical and ~27.7k duplicated
lines overall (~42% of Alembic lib). Every shared fix must be applied twice;
the RC5 drift gate does NOT cover these trees (verified: the
`Alembic/config/shared-asset-manifest.json` asset list contains only the four
injectable SKILL.md files, `alembic-devdocs`, `templates/*`, and
`config/default.json` — no `lib/` entry).

## Evidence and re-verification (2026-06-12)

Audit refs: `audit-findings-2026-06-11.md` §7; RC0 matrix row "Drift"
(`alembic-redundancy-stale-logic-cleanup-rc0-readiness-scan/evidence/rc0-readiness-matrix-2026-06-11.md`);
RC5 outputs (`alembic-redundancy-stale-logic-cleanup-rc5-shared-asset-single-source/evidence/rc5-p2-execution-summary-2026-06-12.md`).

Live re-measurement (python difflib SequenceMatcher over same-named
`.ts/.js/.json` files; note this is a different method than the audit's
unstated one, so treat as the new baseline, not a strict delta):

- Common same-named files: **79** (audit said 87); byte-identical: **21**
  (2,582 lines); differing: **58** (audit said 61, 0 byte-identical).
- Sequence-matched shared lines: **≈16.6k** of Alembic lib's 65,730 total
  (~25%) — down from the audit's ~27.7k/42%. Reality moved: RC4 removed 8
  plugin routes (−2,494 lines, commit `7382c62`) and RC5 restructured skill
  assets; plugin lib is now 54,328 lines.
- Per-directory (Alembic lines → matched %):
  - `lib/governance/` 1,231 → **99.4%** (3 of 5 files differ, but only by a
    few lines: ConstitutionValidator, Gateway, GatewayActionRegistry).
  - `lib/types/` 195 → **99.0%** (`agent.d.ts`, `database.ts` main-only).
  - `lib/injection/` 2,050 common → **80.8%** (AiRuntimeStatus, AgentModule,
    AiModule main-only; SkillHooksModule plugin-only; 9 common files differ).
  - `lib/shared/schemas/` 1,159 → **52.7%** — the audit's "~90-100%" claim NO
    LONGER HOLDS here: `mcp-tools.ts` (609 vs 811 lines) reflects the
    RC0-verified intentional MCP tool-surface divergence (`alembic_guard` vs
    `alembic_code_guard`/source-graph tools), and `http-requests.ts` (550 vs
    229) shrank on the plugin side when RC4 deleted orphaned route schemas.
- Largest remaining duplication mass is NOT in the four audited dirs but in
  partially-matching service/cli/http files, e.g. `service/module/ModuleService.ts`
  (919 matched lines, 84%), `cli/SetupService.ts` (747, 90%),
  `service/cleanup/CleanupService.ts` (717, 86%), `service/skills/SkillHooks.ts`
  (421, 99%), `cli/KnowledgeSyncService.ts` (394, 99%),
  `infrastructure/monitoring/ErrorTracker.ts` (389, 97%).

Constraints (verified):

- Plugin self-containment: AlembicPlugin deploys as a Codex portable runtime;
  `vendor/AlembicCore` submodule is the portable/offline Core source
  (`AlembicPlugin/AGENTS.md:67,75,172-189`). It cannot depend on a `../Alembic`
  checkout at runtime; any shared package must reach it through the same
  package/vendor-snapshot mechanism as `@alembic/core`.
- Core boundary policy: Core carries only reusable, deterministic, runnable
  headless kernel capability — explicitly NOT host windows, UI, Codex plugin,
  release shells, or AI provider runtime (`AlembicCore/AGENTS.md:64,73`).
  `lib/injection/` (DI wiring), HTTP middleware, and host modules are host
  wiring and fail that test; pure types and some governance/cache pieces could
  pass it.
- SD-5 is concurrently converging Core's public API surface (98 transitional
  exports); sinking new surface into Core mid-closeout works against it.

## Options

### Option A — Sink eligible files into `@alembic/core`

Move only the subset that passes Core's deterministic-kernel test (candidates:
`lib/types/` shared wire types, `governance/constitution/Constitution.ts`,
`governance/permission/PermissionManager.ts`, `infrastructure/cache/*` — the
byte-identical 21-file set is the natural shortlist, ~2.6k lines).

- Cost: medium. New Core export paths while Wave 3B closeout (SD-5) is trying
  to shrink the surface; migrations in two consumer repos; Plugin picks the
  change up only via a deliberate `vendor/AlembicCore` refresh (currently 24
  commits behind).
- Risk: scope creep — most of the duplication mass (injection, service, cli,
  http) does NOT fit Core's policy, so Option A alone removes at most ~2.6k of
  ~16.6k matched lines; pressure will mount to bend the Core boundary for the
  rest.

### Option B — New shared package (e.g. `@alembic/runtime-shared`)

A sixth repository/package holding the shared host-runtime layer, consumed by
both runtimes; delivered to the Plugin via a second vendor submodule or a
published package for portability.

- Cost: high. New repo, release pipeline, vendor snapshot, boundary configs,
  drift/breakage surface between three packages instead of two; workspace
  window/config changes.
- Risk: the 58 differing files are not cleanly shared — they interleave
  intentional host divergence (verified for schemas/routes/bootstrap) with
  incidental drift; extracting them forces parameterization infrastructure that
  RC5 explicitly declined for assets ("single-sourcing beyond simple sync →
  escalate"). Disproportionate to the now-smaller (~16.6k incl. intentional
  divergence) duplication mass.

### Option C — Status quo + extend the RC5 drift-gate mechanism to `lib/`

Keep both trees; add the byte-identical files (21 today) and selected
high-match files to the proven shared-asset manifest as new asset modes
(`file-identical`, or `file-shared-sections` for files like `SkillHooks.ts` /
`KnowledgeSyncService.ts` / `ErrorTracker.ts` at 97-99% match), authority =
main, edit-in-authority-then-sync, gate strict in both `npm run check`
pipelines (machinery already exists and has a demonstrated injected-drift FAIL:
RC5 raw `rc5-p2-gate-injected-drift-fail.txt`).

- Cost: low — manifest entries + gate mode extension + one sync pass; no
  runtime behavior change; no new package or Core surface.
- Risk: duplication itself remains (double maintenance continues, but loudly
  instead of silently); manifest needs upkeep as files converge/diverge.

## Recommendation

**Option C now, with a recorded phase-2 trigger toward Option A.**
Phase 1 (own demand sequence, Alembic + AlembicPlugin): extend the RC5
manifest/gate to a declared `lib/` identical-file list; reconcile the 58
differing files file-by-file only where the diff is incidental (the 97-99%
matches), leaving intentional divergence (schemas, routes, bootstrap, daemon)
undeclared and untouched. Phase 2 (only after SD-5 closeout lands): evaluate
sinking the byte-identical kernel-eligible subset into Core under its boundary
policy, with a deliberate plugin vendor refresh. Reject Option B at current
duplication mass.

## Affected repositories

Phase 1: Alembic, AlembicPlugin. Phase 2 (if confirmed later): + AlembicCore.

## Validation outline

- Drift gate green strict in both repos + injected-drift FAIL demo on a newly
  declared lib file (same proof shape as RC5).
- Both full test suites; plugin `smoke-codex-plugin.mjs` + MCP samples
  (skill-delivery already covered by RC5 sample probe).
- For every newly declared identical file: per-file 5-repo consumer sanity scan
  including dynamic `import(` forms and HTTP path literals (RC4 auth lesson,
  RC0 matrix correction 2026-06-12).
- Phase 2 additionally: Core `check-public-api-boundary` / `smoke-public-api` +
  downstream builds (Alembic, Agent, Plugin) + vendor refresh recorded per
  `AlembicPlugin/AGENTS.md` vendor flow.
