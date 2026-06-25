# Global TODO Completed Archive

Archive Date: 2026-06-25
Source: ../../../../../.wakeflow-active/current/global-todo-board.md

This file preserves completed TODOs and historical sync records compacted from `.wakeflow-active/current/global-todo-board.md` . Active and observing items remain on the global TODO board.

## Completed TODOs

| ID | Status | Type | Priority | Owner | Item / Goal | Affects Retest / Dispatch | Dependency / Trigger | Recommended Window | Current Mount |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| alembic-plan-draft-pure-collection-2026-06-23 | completed / claimed | requirement | P0 | Design | alembic_plan draft Pure-Collection Redesign — make draft a PURE COLLECTOR: Pillar A full untrimmed ProjectContext facts + Pillar B all 25 dimensions with SOP and a factual languageApplicable tag only (no judgment filter); pre-delete the draft judgment filter (P0a) and the orphaned ProjectIntelligenceRunner/CodeEntityGraph pipeline (P0b, preserving live types DimensionDef/ProjectSnapshot/GuardAudit); phased P1-P4 with raw draft-payload quality gates. REVERSES residual-gap B1/B2. Auto-Claim=no (controller confirm). Design docs: Design/docs/current/alembic-plan-draft-pure-collection-2026-06-23.md + alembic-plan-draft-pure-collection-workspace-handoff-2026-06-23.md | no | none | AlembicWorkspace | .wakeflow-active/current/alembic-plan-draft-pure-collection-2026-06-23 | no |  |
| alembic-plan-stateless-precondition-contract-2026-06-24 | completed / claimed | requirement | P0 | Design | Make alembic_plan a stateless precondition run before EACH cold-start/deep-scan/module-scan: draft returns only a byte-budget-bounded projectInfoTree pyramid (64KB stop-point) + all candidate dimensions with miningGuidance; Agent selects dimensions+scale for that one stage; confirm validates (no re-analysis, no DB) and returns single-stage planSelection; bootstrap/rescan require planSelection (gate storage-read deleted). DELETE the whole plan persistence layer (plans table/migration 012/PlanRepository/PlanLedgerService persistence/get/signature/version); RELOCATE the pure coverage-projection engine to a Recipe-domain module; git-diff checkpoint seeds from current HEAD; SOP+missionBriefing become fixed bindings from selected dimensions at generation. Developer-decision strict spec with per-field/interface/deletion/rewire file:line + per-phase pass criteria. Fixes the live 4.5MB draft. Supersedes pure-collection; reverses recipe-evolution plan-persistence. | no | none | AlembicWorkspace | .wakeflow-active/current/alembic-plan-stateless-precondition-contract-2026-06-24 | no | [plan](../../../../../Design/docs/current/alembic-plan-stateless-precondition-contract-2026-06-24.md) [design](../../../../../Design/docs/current/alembic-plan-stateless-precondition-contract-2026-06-24.md) |

## Historical Sync Records
