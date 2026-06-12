# SN6 — Terminal Space Census Review (2026-06-12/13)

Controller exit review for the P4 SN train
(alembic-portfolio-execution-plan-p4-sn-train-2026-06-12). Doubles as the
portfolio space-structure census closure per the execution plan.

## Stage closure summary

| Stage | Closure | Key landings |
| --- | --- | --- |
| SN0 | CLOSED (t0, controller) | convention spec w/ 2 exempt families; straggler census; public-path freeze (Core 9 src-covering frozen wildcards → SN4 parked on SD-5 p2 per C3); 65-row gate-config move protocol; tooling/commit protocol (user gates 1-4) |
| SN1 | CLOSED (t1, Dashboard 18837ef) | reusable codemod built; 5 case-only PascalCase renames R100; layer-contract rows + report in-commit; naming lint wired; 4 BINDING tooling lessons; pilot report |
| SN2 | CLOSED (t2, Agent 9c2a4b3) | 18 renames 97-100% (3 Pascal + 15 camel by export shape); exports map byte-stable; NodeNext codemod delta b04e58c; pack floor honest recalibration 434→432 (controller-reviewed); lint w/ .profile.ts family |
| SN3 | CLOSED (t3, Alembic 720dc28) | honest ZERO-RENAME wave — all 9 candidates correctly named under export-shape rule; bootstrap.ts Core-coupling discovered+verified (isOwnDevRepo marker) → deferred pair candidate; lint 243 files |
| SN4a | CLOSED (t4, Core fa464c7) | 6 test renames R100 + AGENTS.md row in-commit; src/ untouched (diff empty); lint w/ migrations family FIRST inside parkedScopes carrying the C3 un-park note; codemod printing restoration a43519e |

Acceptance basis every stage: controller independent re-runs (full checks,
downstream builds where src changed) + raw evidence review. All five repos
now run a naming lint in their blocking check chains at zero-or-justified
exceptions; every wave's commits pushed; behavior change across the entire
train: ZERO (the SN2 pack-floor edit is a measurement calibration).

## Parked waves (resumption pointers)

- **SN4 proper (Core src/ renames, ~44 kebab + 27 camel class-position)**:
  GATED on SD-5 phase-2 execution = user decision C3 (0.3.0 ledger row 1).
  Un-park procedure: move the parked rules in Core config/naming-lint.json
  to active (migrations family stays first), then run the SN wave protocol
  with the 65-key exports shield map from the SN0 sweep.
- **SN5 (Plugin wave incl. lib/codex/ 75-file rename)**: design-GATED on
  CKG completion (user-paused; see ckg-resumption-package-2026-06-12.md).
  Must move both shells' dist/lib bootstrap requires in-commit
  (cross-shell gate) and source the codemod from Core fa464c7.

## Deferred items and observations (SN6 register)

1. lib/bootstrap.ts → Bootstrap.ts needs a Core-coordinated PAIR wave:
   AlembicCore src/shared/isOwnDevRepo.ts hardcodes existsSync(lib/
   bootstrap.ts) as the alembic-ai dev-repo marker (verified in source).
2. Alembic kebab contract/model family (provider-contracts.ts etc.) was
   never in the frozen straggler class — reclassifying = user gate #1
   scope decision; large import blast radius if approved.
3. lib/http/routes kebab/camelCase mix has no convention row — codifying
   one is likewise a user-gate-#1 decision.
4. Agent test/ filenames (mixed) + Core/test support files (setup.ts,
   helpers/) are uncodified — no SN0 row exists; future census candidate.
5. Codemod lineage rule: Agent b04e58c and Alembic 42c2d4c copies carry
   the dormant dry-run-printing defect; ANY future wave refreshes from
   Core fa464c7 (or re-applies the a43519e restoration).
6. Reference discipline: shared-asset-manifest path counts vary across
   artifacts (10/9/11-checks) — pair packets must quote the manifest FILE.
7. Shared-asset-manifest pair renames (Alembic+Plugin copies-match) ride
   SN5-or-later with both sides in one coordinated wave.
8. Stale-dist pack measurement sensitivity → TODO row
   TEST-INFRA-STALE-DIST-ALIAS (clean-build-before-pack-gate candidate).

## Verdict

P4 completion definition met for every wave that is dispatchable under the
standing user gates: convention codified and ENFORCED by blocking lints in
all five repos, all discovered in-scope stragglers renamed with in-commit
gate-row moves and zero behavior change, tooling hardened across three
defect-fix generations (NodeNext resolution, printing restoration), and the
two remaining waves are parked on their named user gates with executable
resumption pointers. The demand completes at this gate boundary; SN4/SN5
re-enter as their gates open (C3 rides the 0.3.0 decision set; SN5 rides
CKG resumption).
