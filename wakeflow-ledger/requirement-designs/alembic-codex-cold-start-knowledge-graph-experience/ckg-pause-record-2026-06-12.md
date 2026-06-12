# CKG Sequence Pause Record (2026-06-12)

Recorded by: AlembicWorkspace controller (claude-code host), executing the
user-directed pause per the portfolio execution plan.
Pause decision: USER, 2026-06-12. Scope: CKG dispatch stops at the current
stable point; CKG4-CKG7 (incl. the real host-agent cold-start acceptance)
defer to a user-decided resumption.

## Verified pause state (controller evidence, 2026-06-12 ~06:55 local)

1. **CKG dispatch stopped.** The codex-host controller itself recorded the
   pause at 2026-06-11T22:40:24Z: CKG3 state machine moved to
   `needs-rework` (rev 5) with the reason ending "Pause after recording
   rework per user instruction." No in-flight codex delivery remained; the
   stale per-window delivery lock on AlembicPlugin (ckg3 p1 delivery,
   created 22:10Z) was released by this controller as pause cleanup.
2. **Codex window quiesced.** No codex CLI dispatch process is running.
   A `codex-mcp.js` process (started ~06:51 local) is the Codex desktop
   app's MCP server connection — user-side application runtime, passive,
   not automation. The codex host keep-live (caffeinate) worker is still
   up; it dispatches nothing and stays under codex-host ownership for
   resumption.
3. **AlembicPlugin tree clean and pushed.** Working tree has zero
   modifications; this controller pushed the final unpushed commit
   (`838da9e..ef90c9b`, fast-forward); branch now even with origin/main.
4. **AlembicCore also clean/pushed** through CKG2's `68f7ad5`
   ("feat: wire source graph lifecycle"), which is a direct child of the
   CO sequence's final `c73d5c4` — clean lineage, no divergence.

## TRUE machine state at pause (corrects the plan's "CKG1-CKG3 landed" shorthand)

| Demand | Machine state | Commits |
| --- | --- | --- |
| CKG1 onboarding contract | completed (rev 10) | Plugin `01a7278` + `838da9e` |
| CKG2 source-graph lifecycle | completed (rev 6) | Core `68f7ad5` |
| CKG3 bootstrap→recipe loop | **needs-rework (rev 5)** — local submit_knowledge + dimension_complete evidence gates are real and targeted tests/build pass, but the full completion definition is NOT met | Plugin `ef90c9b` (committed + pushed) |

CKG3's recorded gaps (owned by the CKG sequence at resumption): real
Plugin MCP route proof through at least one dimension; restart/resume
proof; lease enforcement proof; host-agent/daemon/Core parity matrix;
rich Recipe sample proof; repair-loop proof.

## Consequences (effective immediately)

- **Plugin hands-off is LIFTED.** The P3 Plugin unified train gate is OPEN
  per the portfolio plan's gate redefinition (pause verified clean).
- P3 step 7 (tool-surface duality) proceeds on the CURRENT committed
  surface (no CKG4 dependency); CC3/CC4 run against what CKG1-CKG3
  commits ACTUALLY delivered — P0 re-freezes that delivery, explicitly
  including CKG3's needs-rework status (CC3/CC4 must not assume the
  unproven CKG3 surfaces work end-to-end; the P0 re-freeze names what is
  proven vs pending).
- The cross-controller TODO `CKG1-ONBOARDING-STATUS-TESTS-RED` remains
  owned by the CKG sequence; P3's Plugin train re-checks it on entry
  (CKG1 closed at rev 10 — its closure evidence governs; verify the two
  tests on the current tree during P3 step 0).

## Addendum (2026-06-12 ~07:25 local): pause-stabilization tail

Three further commits landed at 06:57:52-06:58:28 local (after the 06:55
verification pass, before the P0 census pinned HEADs): Alembic `b22d87c`
and Plugin `e9d1bb8` (each +2 lines in ProjectAnalysisMaterialization.test
aligning expectations to CKG2's sourceGraph field) and Core `c820ce6`
(.github/workflows/ci.yml ordering: build package output before the
boundary gate). All pushed; all trees clean; no state-machine or delivery
activity after 06:40. Controller verified all three are test/CI-only with
zero product-surface impact. The CLEAN PAUSE BASELINE is therefore:
**Alembic `b22d87c`, Core `c820ce6`, Plugin `e9d1bb8`** (supersedes the
d58e4a3/68f7ad5/ef90c9b triple named above for baseline-pinning purposes;
the CKG content commits remain as listed).

## Resumption

See [ckg-resumption-package-2026-06-12.md](ckg-resumption-package-2026-06-12.md).
Resumption is a USER decision; the package accumulates inputs until then.
