# Requirement Designs

Status: starter ledger directory
Maintained Window: AlembicWorkspace controller

## Purpose

This directory stores requirement-level planning assets for the installed
workspace. It does not replace the active controller index, state roots, task
packages, or per-window evidence records.

Use one subdirectory per substantial demand:

```text
<demand-slug>/
  README.md
  original-plan-YYYY-MM-DD.md
  requirement-design-YYYY-MM-DD.md
  code-implementation-dependency-research-YYYY-MM-DD.md
```

## Workflow

1. Capture the original user/developer goal before designing implementation.
2. Wait for confirmation when the original goal, scope, or completion
   definition is unclear.
3. Ground requirement design in local code facts and any necessary external
   references.
4. Record producer/consumer dependencies, state changes, validation, and
   non-goals.
5. Move toward goal-stage confirmation only after the requirement design is
   reviewable.

## Current Demand Sets

> PORTFOLIO EXECUTED 2026-06-13: the controller ran the
> `alembic-portfolio-execution-plan` to its designed user-decision boundary —
> the IC / AD / CC / MT / SN candidate sequences below were EXECUTED and
> accepted as the portfolio's P0-P5 phases (heads Core `2823939` / Alembic
> `fca6e6a` / Agent `9c2a4b3` / Dashboard `18837ef` / Plugin `1256b1d` with
> CC shell `6c39111` + Codex shell `c452de3`). Their entries below describe
> the original candidate scope and remain as the per-demand
> completion-definition source. What remains is re-stated as the
> `alembic-post-portfolio-followthrough` group (three members) plus the
> CKG v2 re-statement for the Codex window.

- `alembic-redundancy-stale-logic-cleanup/`: Eight-demand cleanup sequence
  (RC0-RC7) built from the 2026-06-11 six-agent audit: docs-vs-reality fixes,
  Core headless-boundary restoration, stale-artifact removal, Alembic/Plugin
  shared-asset single-sourcing with a drift gate, and a structural-debt
  decision gate. COMPLETED 2026-06-12: all eight demands accepted with raw
  evidence; final acceptance archive
  `final-acceptance-archive-2026-06-12.md`; audit dispositions closed in
  `audit-findings-2026-06-11.md` §9; seven RC6 design candidates recorded in
  `rc6-structural-debt-decisions-2026-06-12.md` as future demands awaiting
  user confirmation.
- `plugin-agent-facing-public-api-redesign/`: AFAPI remaining demands rebuilt
  for Wakeflow. AFAPI 01-07 are completed upstream; AFAPI 08-12 are queued as
  new Wakeflow demand definitions and must be claimed one at a time.
- `alembic-plugin-marketplace-runtime-bootstrap/`: Superseded-as-standalone
  2026-06-12 — packaging partially landed during CKG (thin runtime
  package, no embedded tarballs); the remaining Codex-shell scope folds
  into the portfolio plan's P3 distribution sub-wave alongside CC2 (one
  pinned npm runtime, two thin host shells).
- `alembic-codex-cold-start-knowledge-graph-experience/`: Candidate requirement
  to make AlembicPlugin a complete Codex cold-start experience that creates
  project knowledge, exposes source graph relationship tools, and uses graph
  evidence to improve Recipe production without replacing agent judgement.
- `alembic-dashboard-chat-wiki-candidate-ai-removal/`: Candidate deletion
  requirement to remove candidate field completion/refinement plus Dashboard
  Chat, Wiki, and Signal pages/surfaces, and delete related page-specific
  Plugin HTTP, MCP, Core guidance, help, i18n, docs, and test support.
- `alembic-core-comprehensive-optimization/`: Candidate six-demand hardening
  sequence (CO0-CO5) from the 2026-06-12 five-agent Core audit: public API
  surface convergence (absorbing RC6 SD-5 phase 1), written + lint-enforced
  layer contract, honest critical-path failure semantics, semantic glossary,
  and test/gate floor closure. User scope decisions recorded 2026-06-12
  (AlembicPlugin hands-off while Codex runs CKG; write-strict/read-tolerant;
  core-as-leaf; single CO1 wave). Needs controller intake.
- `alembic-main-comprehensive-optimization/`: COMPLETED 2026-06-12
  (AO0-AO5 controller-accepted): 31/31 route validation closed, permission
  fallback fail-closed, truthful daemon job state, tests + coverage floor
  into `npm run check`, SD-2 dashboard staging wired; whole-library
  coverage (~51%) recorded as future debt pending a user decision.
- `alembic-agent-comprehensive-optimization/`: COMPLETED 2026-06-12
  (AG0-AG5 controller-accepted, adjusted scope): V1 direct importers to
  zero via ToolRuntimeBridge, signature smoke + validation-floor snapshot
  gates added, 235 tests; public `./tools` compatibility preserved pending
  downstream migration evidence (now consumed by ~24 Alembic files).
- `alembic-space-interface-cleansing/`: Candidate seven-demand cross-repo
  interface cleansing and space optimization sequence (IC0-IC6) from the
  2026-06-12 post-completion seam scan: wire-type single-sourcing,
  Dashboard-contract drift gate, `./tools` downstream migration and
  retirement, error-taxonomy registry unification, DCR-residue ruling,
  then the CKG-gated wave (SD-5 phase 2, Plugin vendor refresh and
  migrations, tool-surface duality resolution, SD-1 phase 2 evaluation).
  Four IC0 user rulings recorded 2026-06-12: default-delete DCR residue,
  ratchet coverage floors at measured values, ./tools retirement
  authorized, generated Dashboard types with drift gate. Needs controller
  intake; Plugin-touching demands gated on CKG completion.
- `alembic-space-architecture-deepening/`: Candidate eight-demand
  architecture sequence (AD0-AD7) above IC: space functional charters and
  a machine-enforced dependency DAG, internal layer contracts with
  direction lints for every repo, deep decoupling under a side-effect-free
  boundary doctrine (baseline ~30% compliance: 47 direct Logger calls, 53
  pathGuard imports, 47+ service-locator sites, unmanaged module state,
  undisposed listeners), audited foundational upgrades with measurements
  (prepared-statement cache, profile-gated AST worker pool, embedding
  concurrency, signal backpressure), and per-repo independence plus
  no-undeclared-effects proof. Absorbs the SD-1/SD-6/R-1/SD-4 placement
  questions into a per-item decision register. All four AD0 user gates
  adopted 2026-06-12 (doctrine standing rule, AD5 list as proposed,
  staging-tooling independence, SD-1 relocated from IC6 to AD2).
  Recommended intake after IC0-IC4; Plugin joins post-CKG. Needs
  controller intake.
- `alembic-plugin-claude-code-host-support/`: Candidate five-demand
  sequence (CC0-CC4) making Alembic installable as a Claude Code plugin:
  packaging artifact set (`.claude-plugin` manifest, CLAUDE_PROJECT_DIR
  wiring), the existing AGENT_HOSTS `claude-code` value completed
  end-to-end, shared-manifest skills as plugin skills (third consumer +
  drift gate), host-rendered CKG cold start, Claude Code Project Skill
  export convention, and a real Claude-Code-agent acceptance run — with a
  byte-stable Codex parity gate per demand. All three CC0 user gates
  adopted 2026-06-12 (local-path install first, MCP + skills only,
  ALEMBIC_CHANNEL_ID=claude-code). CC0 may run pre-gate; CC1-CC4 gated on
  CKG completion. Carries a timing signal to the CKG side: keep the SOP
  host name a render variable. Needs controller intake.

- `alembic-mcp-tool-certification/`: Candidate five-demand sequence
  (MT0-MT4) certifying every MCP tool on both surfaces one by one:
  expectation sheets + real-misuse evidence harvest + scripted
  certification harness, full connectivity/completeness sweep with raw
  outputs, a shared per-tool output-budget mechanism with honest
  overflow replacing magic-number slices, usage-error hardening with a
  regression test per harvested case, and per-tool certification cards
  with value verdicts (merge/deprecate candidates to a per-item user
  decision register). All three MT0 user gates adopted 2026-06-12
  (blocking budget gates, all-five-pass certification floor, per-item
  verdict register). Audit invokes both runtimes now; Plugin code fixes
  queue post-CKG; source-graph-tool findings hand to CKG4. Needs
  controller intake.

- `alembic-space-structure-naming-normalization/`: Candidate seven-demand
  sequence (SN0-SN6) unifying folder hierarchy and file naming across all
  five repos: one convention codified from the measured dominant styles
  (~30 camelCase stragglers space-wide) and lint-enforced everywhere,
  per-repo target trees derived from the AD charters/layer contracts, and
  a real landing plan — per-repo waves as the final cleanup train
  (Dashboard pilot → Agent → Alembic → Core with exports-map-shielded
  moves and wildcard dirs frozen until post-SD-5-p2 → Plugin post-CKG+CC
  including the deferred lib/codex host-neutral rename), with git-mv
  blame preservation, same-commit gate-config updates, and per-wave
  behavior-neutrality audits. All four SN0 user gates adopted 2026-06-12
  (codify-dominants convention, lib/codex rename in SN5, ignore-revs
  blame discipline, wildcard dirs frozen until post-SD-5-p2). Needs
  controller intake; SN0 runs after AD3.

- `alembic-portfolio-execution-plan/`: Candidate portfolio-level
  execution plan (user-requested 2026-06-12) organizing all six live
  sequences into five phases plus the user-triggered 0.3.0 release wave:
  P0 unified fact freeze (merges IC0+AD0+CC0+MT0-census), P1 mainline
  trains (H: MT harness+sweep; A: Core IC1+IC4+MT2; B: Alembic
  IC2+IC3+MT3), P2 AD architecture deepening, P3 Plugin unified train
  (IC5+CC1-4+MT-plugin+MPB-remainder+SD-5-p2 staging, acceptance
  CC4+IC6), P4 SN final cleanup train. Four explicit structural mergers;
  MPB dissolved as standalone; demand definitions stay authoritative for
  merged packages. EXECUTED to the user-decision boundary 2026-06-13
  (P0-P5 + R delivery + Core hardening, 22 task packages accepted).

- `alembic-post-portfolio-followthrough/`: GROUP, controller-intake-complete
  (2026-06-13), re-stating everything the executed portfolio left at the
  user-decision boundary, as three member requirements (ready for user
  rulings; publishes/version-bumps user-triggered): (1)
  `alembic-0.3.0-release-wave` (RW0-RW5: runtime publish, SD-5 phase-2
  deletion, SN4 Core source naming, `./shared` sequencing, R-1 overlays,
  C2 version-pin tail — release-coupled, publish user-triggered); (2)
  `alembic-governance-decision-enactment` (GD0-GD6: the AD2 placement
  decision register A/B/W rows — B1 resident-registry keystone + 15-tool
  duality, B5/B6/B7 placement, charter-wording batch, W2 strays, A1 SD-1
  p2 evaluation, C5/C8 contract decisions); (3)
  `alembic-quality-debt-burndown` (QD0-QD6: stale-dist family gate, tool
  schema honesty, coverage enforcement, CC4 connect race, scratch/ghost-DB
  cleanups). Every R-package and register row lands in exactly one member
  (controller intake 2026-06-13 closed the one gap — AFAPI-REQ-08 homed in
  member 1 RW5). Members 1-3 ready for user rulings; member 4 (CKG) awaits
  the user's reorganization → Codex window.

- `alembic-codex-cold-start-knowledge-graph-experience/` (CKG v2): the CKG
  requirement RE-ORGANIZED 2026-06-13 for the Codex window on the renamed
  tree (`lib/runtime`, plugin `alembic`, runtime `@gxfn/alembic-runtime`,
  two host shells). CKG1/CKG2 landed; CKG3 needs rework (F2/F-CC4-4/F-CC4-5
  + real-route/restart/lease/parity/rich-repair proofs); CKG4-CKG7 remain.
  Owned by the Codex window for real-verification development after the
  user reorganizes it; NON-BLOCKING for every other requirement. Fresh
  statement: `ckg-v2-requirement-design-2026-06-13.md`.

## Boundaries

- Requirement designs are not dispatch plans.
- Design candidates are not accepted goals until the controller records that
  decision.
- Current active execution belongs in `.wakeflow-active/current/` or
  a Wakeflow state root.
- Per-window completion evidence belongs in the matching window ledger.

## Templates

- `templates/original-plan-template.md`
- `templates/requirement-design-template.md`
- `templates/goal-stage-confirmation-template.md`

## Design Index（设计目录索引，2026-07-09 补建）

Forward links from each design directory to the demand(s) that executed it. Demands whose design
material travelled inside the archived state root are marked `in-archive` in the
[demand chain ledger](../workspace/demand-chain-ledger.md) and have no directory here.

| Design directory | Executed by / status |
| --- | --- |
| [alembic-0.3.0-release-wave](alembic-0.3.0-release-wave/) | Executed → [demand 2026-06-13](../workspace/archive/2026-06/alembic-0.3.0-release-wave-2026-06-13/)（publish HELD, 用户门） |
| [alembic-plugin-claude-code-host-support](alembic-plugin-claude-code-host-support/) | Executed → [dual-host refactor 2026-06-19](../workspace/archive/2026-06/alembic-plugin-dual-host-architecture-refactor-2026-06-19/) |
| [plugin-agent-facing-public-api-redesign](plugin-agent-facing-public-api-redesign/) | Executed → AFAPI 08–12 rollup（[archive](../workspace/archive/2026-06/afapi-completed-demands/)）；AFAPI 01–07 上游完成未重建 |
| [alembic-redundancy-stale-logic-cleanup](alembic-redundancy-stale-logic-cleanup/) | Executed → RC0–RC7（终验收档在目录内 final-acceptance-archive-2026-06-12.md） |
| [alembic-core-comprehensive-optimization](alembic-core-comprehensive-optimization/) | Executed → CO0–CO5（终验收档在目录内 final-acceptance-archive-2026-06-12.md） |
| [alembic-recipe-evolution-gpt55-fabrication-audit](alembic-recipe-evolution-gpt55-fabrication-audit/) | Historical audit（仅证据，不作执行根；关联 no-guess correction 链见总账 Wave A） |
| 其余 18 个目录 | 早期（≤06-18 压缩史）设计/研究材料或未单独执行的规划；与总账按名关联，引用前按 no-guess 纪律核对目录内文档现状 |

