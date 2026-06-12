# Controller Artifacts + Generated-Output Convention (2026-06-13)

Origin: user suggestion after the b2 coverage-commit incident ("如果你经常
使用 coverage/ 或是产物，你可以在 AlembicWorkspace 里面新建统一的工具区域")
— adopted with boundary trimming.

## Convention

1. **Controller verification artifacts** (acceptance re-run logs,
   spot-check outputs) go to `<state-root>/evidence/controller/` —
   the existing designed evidence surface, per demand — NOT /tmp and
   NOT a new global directory. The P4 SN-train re-run logs
   (sn1/sn2/sn2-downstream/sn3/sn4a) were retro-filed there.
2. **Product-repo generated outputs are NEVER centralized** into the
   workspace: every product repo must work standalone (clone + check
   outside the workspace), so coverage/dist/tmp stay in-repo and the
   correct guard is the repo's own .gitignore. Centralizing them would
   couple repo configs to the workspace layout — rejected by boundary.
3. **Workspace-level tooling area**: not created — no current consumer
   beyond the two cases above (Stop Card: no structure without a real
   consumer). Re-evaluate if a third genuine shared-tooling consumer
   appears (candidate: a canonical SN-codemod reference if rename waves
   continue past SN4/SN5 — for now the per-repo copy + fa464c7 lineage
   rule stands).

## Generated-output ignore audit (all five repos, 2026-06-13)

| Repo | coverage/ ignored | Disposition |
| --- | --- | --- |
| AlembicCore | NO — and the CO4 coverage provider IS installed | one-line ignore rides the already-registered Core cleanup packet (old-name marker branch removal after b2) |
| Alembic | being added by the b2b rework | in flight |
| AlembicAgent | yes (+ tmp/) | clean |
| AlembicDashboard | NO (low risk: node --test, no coverage tooling) | one-line ignore rides next Dashboard packet |
| AlembicPlugin | NO (low risk; .tmp/ ignored; dist partially tracked BY DESIGN — shell bootstrap targets) | one-line ignore rides next Plugin packet (s5) |

Tracked-artifact scan: zero coverage//tmp/ files tracked anywhere
(Alembic's 16 were the b2 accident, removed by the rework).
