# P5 Plugin RecipeCount DB Semantics Evidence

## Task

- Window: AlembicPlugin
- Task: p5-plugin-recipecount-db-semantics-t1
- Dispatch group: p5-plugin-recipecount-db-semantics-p1

## Commit

- `c4a756460df0d6c62ba7cb5a69f98458ff35998f` - `align status recipe count with database recipes`

## Changed Files

- `lib/repository/skills/ProjectSkillKnowledgeRepository.ts`
- `lib/runtime/KnowledgeState.ts`
- `lib/runtime/status/StatusService.ts`
- `lib/recipe-generation/host-agent-workflows/cold-start.ts`
- `lib/runtime/mcp/host/tool-visibility.ts`
- `scripts/verify-codex-plugin-tools-local.mjs`
- `test/unit/CodexKnowledgeState.test.ts`
- `test/unit/CodexStatusService.test.ts`

## Implementation Summary

- `recipeCount` now reflects DB persisted Recipe reality by counting `knowledge_entries`.
- `dbRecipeCount` is exposed as an explicit DB count alias.
- `materializedRecipeCount` separately reports disk-exported `Alembic/recipes/*.md` files.
- Status, cold-start rebuild confirmation, explicit-root knowledge fallback, and local tool probe summaries now include the split fields.
- Added unit coverage for DB-only knowledge and mixed DB/materialized export fixtures.

## Consumer Scan

Command:

```bash
rg -n "recipeCount|materializedRecipeCount|dbRecipeCount|databaseEntryCount" lib test scripts plugins skills .agents docs config package.json
```

Conclusion:

- Updated consumers are `KnowledgeState`, `StatusService`, cold-start host-agent workflow, explicit project-root tool visibility fallback, local codex-plugin tool verifier, and unit tests.
- No Dashboard consumer exists in this repository.
- Unrelated `recipeCount` uses remain in source-ref rebuild/index code, module service stats, recipe-region vector bridge stats, and existing policy/status tests.

## Runtime Probe

Probe:

```bash
node /private/tmp/alembic-plugin-p5-recipecount-probe.mjs
```

Fixture:

- `knowledge_entries`: 4 rows
- materialized markdown exports: 2 files

Observed `alembic_status` result through built `HostMcpServer`:

```json
{
  "ok": true,
  "onboardingState": "project_handoff_unavailable",
  "knowledge": {
    "recipeCount": 4,
    "dbRecipeCount": 4,
    "databaseEntryCount": 4,
    "materializedRecipeCount": 2,
    "usable": true
  }
}
```

## Validation

- `npm run test:unit -- test/unit/CodexKnowledgeState.test.ts test/unit/CodexStatusService.test.ts`
  - PASS: 2 files, 17 tests.
- `npm run build:check`
  - PASS. Core build used `../AlembicCore @ 6477b4aa249b490dcb4d9b2a6e4fdb02c11d00e9`.
- `npm run build`
  - PASS. Dist refreshed before final probe.
- `git diff --check`
  - PASS: no output.
- Boundary scan:
  - `git diff -- ... | rg -n "fullTreeRef|candidateDimensions|evidenceGate|currentDomainSop|domainQueue|sopPack|alembic_plan|fileCount"`
  - PASS: no output, confirming this P5 change did not touch plan draft, candidate dimensions, evidence gate, or retired domain/SOP surfaces.

## Guard

- `alembic_code_guard` attempted with explicit changed files.
- Result was not usable as acceptance evidence because the tool returned an internal clean-output schema error: `Unrecognized key: "data"`.
