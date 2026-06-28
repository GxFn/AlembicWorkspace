# Recipe Lifecycle Freeze Register

Demand: `alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
Phase: P2 / FREEZE
Created: 2026-06-28

This register is the P2 freeze baseline for the Recipe lifecycle naming and layering
refactor. It records values that later rename, folder isolation, and workflow
collapse work must not change without a separate compatibility decision. P2 is
doc-only: it does not authorize product code changes, route changes, schema changes,
release changes, or version changes.

Authority:

- Execution authority: `Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md` section A and section 12.
- Design authority: the same document section 11 and section 11.I.
- P2 acceptance: `git diff --check` plus Wakeflow workspace docs verification.

## Frozen Literals

| Surface | Frozen value(s) | Anchor / current evidence | Rule |
| --- | --- | --- | --- |
| Plan stage contract | `'coldStart'`, `'deepMining'`, `'moduleMining'` | `AlembicCore/src/service/planIntent/contracts.ts:1` | Do not change enum values in P3-P15. Internal names may gain aliases or wrappers only where the phase explicitly allows it. |
| Daemon job kind | `'bootstrap'`, `'rescan'` | `AlembicCore/src/daemon/RuntimeContracts.ts:45`; `AlembicCore/src/daemon/JobStore.ts:13` | Treat as runtime/API/persisted job vocabulary. Do not rename route payloads or stored job kind values. |
| Daemon job source | `'codex'`, `'dashboard'`, `'http'`, `'system'` | `AlembicCore/src/daemon/JobStore.ts:15` | `codex` is frozen even though it is a host-name leak; document future deprecation separately. |
| MCP response tool names | `'alembic_bootstrap'`, `'alembic_rescan'`, `'alembic_dimension_complete'` | `AlembicPlugin/lib/runtime/mcp/tools.ts:291,306,352`; `Alembic/lib/shared/schemas/mcp-tools.ts:608-610` | Do not rename public tool names in this demand unless an explicit alias/compatibility phase says so. |
| Core workflow response tools | `'alembic_bootstrap'`, `'alembic_rescan'` | `AlembicCore/src/workflows/cold-start/ColdStartPlan.ts:88`; `AlembicCore/src/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts:65` | P3-P15 may move files, but response tool values stay byte-stable. |
| Knowledge lifecycle states | `'evolving'`, `'decaying'` | `AlembicCore/src/domain/knowledge/Lifecycle.ts:20,22` | Treat as domain/persistence-facing lifecycle vocabulary. |
| Coverage persistence tables | `'coverage_ledger'`, `'deep_mining_rounds'` | `AlembicCore/src/infrastructure/database/drizzle/schema.ts:671,708`; migrations 015/016 | Table names and persistence meaning are frozen. Do not rename columns or table names in this demand. |
| HTTP job routes | `'/api/v1/jobs/bootstrap'`, `'/api/v1/jobs/rescan'` | `AlembicCore/src/daemon/RuntimeContracts.ts:47,50`; `Alembic/lib/http/provider-contracts.ts:397-398`; dashboard generated clients | Route values are public runtime contracts. Do not rename routes or generated route literals in this demand. |
| File-change route | `'/api/v1/file-changes'` | `AlembicCore/src/daemon/RuntimeContracts.ts:26`; `Alembic/lib/http/routes/file-changes.ts:47` | Keep as runtime contract; P12/N-9 may rename classes but not this route. |
| Bootstrap session ref prefix | `'bootstrap-session:'` | `Alembic/lib/workflows/knowledge-rescan/ProduceSessionRoute.ts:216`; `AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts:821` | Prefix is a cross-process reference format. Do not rename in this demand. |
| Core export paths | `@alembic/core/host-agent-workflows`, `@alembic/core/plans`, `@alembic/core/evolution` | public subpath imports and design C2/R3 | File moves may repoint barrels, but these import paths remain stable. |
| Project-context source tags | `'alembic-main-bootstrap'`, `'alembic-main-rescan'` | `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts:34`; call sites in cold-start and knowledge-rescan workflows | Do not rename source tags while restructuring host workflows. |
| Evolution proposal source tag | `'file-change'` | `AlembicCore/src/shared/sourceContracts.ts:17`; `AlembicPlugin/lib/recipe-generation/evolution/FileChangeHandler.ts:139`; `Alembic/lib/service/evolution/FileChangeHandler.ts:187` | P12/N-9 may rename handler classes only; proposal source stays stable. |
| Plugin opportunistic separation tags | `'plugin-opportunistic'`, `'daemon-file-change'` | `AlembicPlugin/lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts:83-84,123-124` | Preserve producer/separation vocabulary. |
| Plugin defer verdict | `'defer-to-alembic-service'` | `AlembicPlugin/lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts:9,147` | Preserve verdict literal during FileChangeHandler rename/isolation. |

## INDEX Vocabulary Mapping

The internal INDEX vocabulary maps current lifecycle stages to the indexing model
introduced by section 11.I:

| Existing stage / route | INDEX meaning | P2 rule |
| --- | --- | --- |
| `coldStart` | `full` project index mode | Treat as full-index behavior. Keep public `coldStart` stage value frozen. |
| `deepMining` | `incremental` project index mode | Treat as incremental coverage rounds. Keep public `deepMining` stage value frozen. |
| `moduleMining` | `scoped` index scope | Treat as scoped/per-module selection. Keep public `moduleMining` stage value frozen. |
| `project-index` | internal folder/vocabulary for shared Core collapse | Allowed as internal folder/name in P9. It must not rename public stage values. |
| `ProjectIndex*` | internal alias/facade vocabulary | Allowed for aliases/facades where P9/P10 scope says so. |
| `mode` values `'full'` / `'incremental'` | explicit host-local orchestrator mode | Allowed for per-host `runProjectIndexWorkflow(mode)`. Do not create one cross-host orchestrator. |

## P2 Boundary

- `consolidation` and `RecipeSimilarity` are out of scope for this demand and get no symbol rename.
- Cold-start coverage remains as decided by the user: coldStart seeds only deferred empty placeholders and does not write measured coverage. Chain 2 coverage assertions stay `== baseline`.
- Module mining selector convergence is a later intentional behavior change: Entry B becomes binding-rich in P11 and requires its own REAL-TEST evidence.
- Product code, generated clients, migrations, routes, public tool names, version numbers, release assets, and vendor pins are unchanged by P2.

## Per-Phase Audit Rule

Before accepting any phase that touches names, folders, barrels, runtime routes,
MCP schemas, persistence, or workflow response payloads, audit the relevant frozen
tokens above. P15 must re-run a terminal four-repository grep audit against this
register and record zero forbidden drift before final acceptance.
