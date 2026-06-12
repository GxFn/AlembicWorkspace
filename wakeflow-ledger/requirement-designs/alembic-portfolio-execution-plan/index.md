# Alembic Demand Portfolio Execution Plan

Status: user-authorized for controller intake 2026-06-12 (the user confirmed the four structural mergers and authorized unattended advancement per this plan; releases stay user-triggered)
Maintained Window: AlembicWorkspace
Date: 2026-06-12
Design Key: alembic-portfolio-execution-plan

## Purpose

The portfolio-level consolidation the user requested: all six live
sequences (in-flight CKG; IC/AD/CC/MT/SN candidates; MPB residue)
organized into one execution plan with re-adjusted grouping. The plan
re-packages dispatch (same-window trains, five phases plus the
user-triggered 0.3.0 release wave) and makes exactly four structural
mergers; every demand definition stays the completion-definition source.

Plan document:
[portfolio-execution-plan-2026-06-12.md](portfolio-execution-plan-2026-06-12.md)

## Phase Summary

| Phase | Content | Gate |
| --- | --- | --- |
| P0 | Unified fact freeze (merges IC0+AD0+CC0+MT0-census; all rulings already adopted) + CKG host-variable signal relay | immediate |
| P1 | Train H (MT harness + full sweep) → Train A (Core: IC1+IC4+MT2+ratchets) ∥ Train B (Alembic+Agent+Dashboard: IC2+IC3+MT3) | per-window parallel, while CKG finishes |
| P2 | AD1→AD7 architecture deepening | after P1; window-interleaved with P3 |
| P3 | Plugin unified train (vendor refresh → IC5 migrations → CC1 → MT plugin fixes → distribution sub-wave incl. MPB remainder → CC3 → duality on the current surface → SD-5 p2 staging → CC4+IC6 acceptance) | CKG paused-clean (user-directed 2026-06-12) |
| P4 | SN final cleanup train (SN0 after AD3; SN5 after P3) | per-repo idle |
| R | 0.3.0 release wave (SD-5 p2 + facade promotion + runtime publication) | user-triggered |

## Structural Mergers (intake confirmation items)

1. IC0+AD0+CC0+MT0(census) → P0; MT harness build → Train H.
2. IC1+IC4+MT2+ratchet wiring → Train A (one Core wave).
3. IC2+IC3+MT3 → Train B (one coordinated wave).
4. IC5+CC1-CC4+MT-plugin+MPB-remainder+SD-5-p2-staging → P3 train; IC6
   merges into P3 acceptance; MPB dissolved as standalone.

Merged packages must satisfy ALL constituent demands' evidence
requirements and stop conditions.

## CKG Status (PAUSED by user 2026-06-12)

- CKG1/CKG2/CKG3 landed (`838da9e`, Core `68f7ad5`, `ef90c9b`); paused
  at this stable point. CKG4-CKG7 (including the real host-agent
  cold-start acceptance) deferred to a user-decided resumption.
- The controller executes the pause: stop CKG dispatch, verify the Codex
  window quiesced and the Plugin tree clean/pushed, write the pause
  record, open the resumption package. Plugin hands-off lifts at that
  verification — this is what opens P3.
- The resumption package accumulates: Train H tool findings, the
  P3-resolved tool surface, the SOP host-variable signal, MT
  certification state. Resuming after P3 gives CKG a cleaner surface to
  build on.
