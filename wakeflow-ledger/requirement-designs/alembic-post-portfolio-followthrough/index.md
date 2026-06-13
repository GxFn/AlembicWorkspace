# Alembic Post-Portfolio Follow-Through Group

Status: ADVANCED 2026-06-13 under "开始整个 R 任务组的自动化推进，ckg ckg-v2 除外" — member 2 (governance) COMPLETED, member 3 (quality) COMPLETED; member 1 (release) RELEASE-READY, paused at the publish hard gate (publish HELD for user trigger); member 4 (CKG/ckg-v2) excluded by the user (→ Codex window)
Maintained Window: AlembicWorkspace
Date: 2026-06-13
Design Key: alembic-post-portfolio-followthrough

## Why This Group Exists

The controller executed the entire portfolio execution plan to its designed
user-decision boundary (P0, Train H, P1 Trains A+B, P2 AD1-AD7, P3 Plugin
train 1-9 incl. CC1-CC4 Claude Code support, P4 SN train SN0-SN6, R
delivery, P5 re-certification, Core hardening — 22 task packages accepted,
unattended, zero interruption). Pushed heads at this organization:
Core `2823939` / Alembic `fca6e6a` / Agent `9c2a4b3` / Dashboard `18837ef`
/ Plugin `1256b1d` (CC shell `6c39111`, Codex shell `c452de3`) /
AlembicClaudeCode `973bf71` / AlembicCodex `89a7095`.

What is left is exactly the user-decision boundary the plan was designed to
stop at: the 0.3.0 release-coupled set, the A/B/W placement-decision
register, and the accumulated quality/test-infra TODO debt. This group
re-states those three remainders as proper requirement designs so each is
ready to become real work the moment the user rules on it. CKG is handled
separately (re-organized for the Codex window — see member 4).

Source artifacts (controller-delivered, not re-derived here):
- [R — 0.3.0 decision package](../alembic-portfolio-execution-plan/r-delivery-0.3.0-decision-package-2026-06-12.md)
- [0.3.0 release-wave ledger](../alembic-portfolio-execution-plan/release-wave-0.3.0-ledger-2026-06-12.md)
- [AD2 placement decision register](../alembic-space-architecture-deepening/ad2-placement-decision-register-2026-06-12.md)
- [SN6 terminal census review](../alembic-space-structure-naming-normalization/sn6-terminal-census-review-2026-06-12.md)
- [CKG resumption package](../alembic-codex-cold-start-knowledge-graph-experience/ckg-resumption-package-2026-06-12.md)

## Members

| # | Requirement | Covers | Gating |
| --- | --- | --- | --- |
| 1 | [alembic-0.3.0-release-wave](../alembic-0.3.0-release-wave/index.md) | C1 runtime publish, C3 SD-5 phase-2 deletion, SN4 Core src naming (unparks on C3), B2 ./shared sequencing, A3 R-1 overlay routes, C2 version-pin/marketplace tail | release-coupled; rule together; publish stays user-triggered |
| 2 | [alembic-governance-decision-enactment](../alembic-governance-decision-enactment/index.md) | A1 SD-1 p2 evaluation, B1 resident registry (keystone → 15-tool duality + charter wording), B5/B6/B7 placement, W1/W2/W-wording charter batch, A2/A4/B3/B4 acknowledgements, C5/C8 tool-contract decisions | per-item user decisions; B1 unblocks several |
| 3 | [alembic-quality-debt-burndown](../alembic-quality-debt-burndown/index.md) | TEST-INFRA-STALE-DIST-ALIAS (4 instances), CODE-GUARD-SCHEMA-LOOSENESS, C4 coverage enforcement, C6 scratch cleanup, C7 ghost-DB, CC4 connect rows + lock-fail-fast, CO4 sibling drill, MT residuals | mostly mechanical; several ride any next touch |
| 4 | [CKG v2 (Codex window)](../alembic-codex-cold-start-knowledge-graph-experience/ckg-v2-requirement-design-2026-06-13.md) | full re-statement on the renamed tree for real-verification development by the Codex window | user reorganizes → Codex window; not blocking anything |

## Partition Guarantee

Every item in the R-package §1-4 and the AD2 register A1-A4/B1-B7/W1-W2/
W-wording/C1-C8, plus every open TODO row, lands in exactly one member.
C2 (naming) is already RULED and enacted; only its version-pin/marketplace
tail rides member 1. No item appears twice; no remaining item is unhomed.

Controller intake 2026-06-13 re-verified the partition against the live AD2
register and TODO board and closed one gap: AFAPI-REQ-08 (runtime-snapshot
release judgment, R-package §4) was unhomed and is now in member 1 at
release-wave RW5. With that, the partition is complete and exclusive.

## Execution Outcome (2026-06-13)

Autonomous advancement of the R group (CKG excluded) reached the user-decision
boundary the plan was designed to stop at:

- **Member 2 — governance** ✅ COMPLETED (rev 14). B1 resident registry deleted
  (zero-importer) + charter re-chartered "HTTP/daemon host"; B7/W1 charter batch
  applied (config-only, drift test green); C5/C8 tool-contract decisions
  enacted; B5/B6/W2/A1 + A2/A4/B3/B4 acknowledged as controller-defaults (user
  may override). Closeout:
  [gd6-register-closure](../alembic-governance-decision-enactment/gd6-register-closure-2026-06-13.md).
- **Member 3 — quality** ✅ COMPLETED (rev 12). QD1 stale-dist gate + QD2 schema
  honesty + SN5 residues + CO4 drill accepted; coverage recorded at status-quo
  (thresholds never lowered); C6/C7 surfaced (HELD, not auto-mutated); TODO
  board reconciled. CC4 connect-hardening + the Alembic/Agent stale-dist half
  are explicitly-owned backlog (surfaced, not silently dropped). Closeout:
  [qd-burndown-closeout](../alembic-quality-debt-burndown/qd-burndown-closeout-2026-06-13.md).
- **Member 1 — release** ⏸ RELEASE-READY, paused at the publish hard gate. All
  code waves accepted (RW0-RW4: B2 ./shared re-point, SD-5 phase-2 deletion,
  SN4 Core naming, A3 overlay delete, C2 version-pin tail); all five repos clean
  + even with origin at 0.2.0. The only remaining step is
  `npm publish --access public @gxfn/alembic-runtime@0.2.0` + cacheless
  cold-start verification on both hosts — HELD for the explicit user trigger.
  Readiness:
  [rw5-release-readiness](../alembic-0.3.0-release-wave/rw5-release-readiness-2026-06-13.md).
- **Member 4 — CKG/ckg-v2** ⏸ EXCLUDED by the user; owned by the Codex window.

User-gated remainders (the stopping boundary): the runtime **publish** (C1) and
the real-`~/.asd` **C6/C7** cleanups. Everything else in the R group is done and
verified.

## Standing Constraints (inherited, unchanged)

- Publishes and version bumps are user-triggered.
- Plugin behavior on both shells stays byte-stable unless a member
  explicitly rules a change (Codex parity gate per wave).
- Naming lints are BLOCKING in all five repos (SN train output) — every
  member's waves keep them green.
- CKG stays non-blocking; member 4 is owned by the Codex window after the
  user reorganizes it.

## Validation Backbone

Each member runs the owning repos' full check pipelines plus any new gate
with a demonstrated failure; release-affecting waves add downstream builds;
the group closes when members 1-3 are accepted and member 4 is handed off.
Wakeflow verification per member acceptance.
