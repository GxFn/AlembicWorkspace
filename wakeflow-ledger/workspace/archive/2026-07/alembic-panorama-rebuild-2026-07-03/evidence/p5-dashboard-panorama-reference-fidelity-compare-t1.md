# P5 Dashboard Panorama Reference Fidelity Compare

Demand: `alembic-panorama-rebuild-2026-07-03`
Task: `p5-dashboard-panorama-reference-fidelity-compare-t1`
Window: `AlembicDashboard`
Repository: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicDashboard`

## Conclusion

P5 comparison passes after a narrow Dashboard-only fidelity repair.

The assigned scratchpad reference path `scratchpad/panorama-reference/frontend/PanoramaView.tsx`
was not present in this workspace checkout, so the comparison used the task-authorized
read-only fallback:

```text
git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicDashboard show 0e27445:src/components/Views/PanoramaView.tsx
```

Current Dashboard commit:

```text
4997883a3fcf4febf46be329ea0905e35560ec07 Tighten Panorama reference fidelity
```

This commit keeps the accepted P3 Panorama restore and fixes the two material
P5 drift points found during comparison:

- `networking` role label now matches the old visible label `Network`.
- Overview gaps summary now shows the first 5 gaps, matching the old reference,
  instead of the first 3.

No Alembic, AlembicCore, BiliDili, Test, Design, provider config, data root,
snapshot table, rescan chain, branch, push, tag, release, or version bump was
changed.

## Source Diff

```text
4997883 (HEAD -> main) Tighten Panorama reference fidelity
 src/components/Views/PanoramaView.tsx | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
```

Changed source:

- `src/components/Views/PanoramaView.tsx`

## Per-Tab / Per-Section Comparison

| Reference element | Old reference evidence | Current implementation evidence | Result |
| --- | --- | --- | --- |
| Four-tab container: `overview`, `dependencies`, `graph`, `gaps` | `git show 0e27445:src/components/Views/PanoramaView.tsx` lines 95-102, 173-180 | `src/components/Views/PanoramaView.tsx` lines 24, 123-128, 197-212 | PASS |
| Panorama data loading uses the three endpoint family calls with `Promise.allSettled` | reference lines 119-123 | current lines 88-117; API client endpoint calls in `src/api/panorama.ts` lines 337-350 | PASS |
| Overview 6-card stats: modules, layers, files, recipes, coverage, cycles | reference lines 265-279, 294-307 | current lines 271-278, 280-296 | PASS |
| Architecture pyramid / layer module list | reference lines 346-424 | current lines 300-397 | PASS |
| 14 role labels | reference lines 329-344 | current lines 27-42; P5 commit restores `networking: 'Network'` | PASS |
| Health bar: health score, avg coupling, cycles/gaps/high priority | reference lines 434-459 | current lines 399-434 | PASS |
| Overview gaps summary | reference lines 465-480, including `slice(0, 5)` | current lines 437-474; P5 commit restores `gaps.slice(0, 5)` | PASS |
| Full gaps panel | reference lines 493-543 | current lines 491-552 | PASS |
| `dependencies` tab embeds dependency graph path per CG-A | reference lines 177, 20 | current lines 21, 205; `DepGraphView` exists at `src/components/Views/DepGraphView.tsx` | PASS |
| `graph` tab embeds knowledge graph path | reference lines 178, 21 | current lines 22, 206; `KnowledgeGraphView` exists at `src/components/Views/KnowledgeGraphView.tsx` | PASS |
| 16 old `panorama.*` i18n keys preserved in en/zh | old `en.ts` lines 746-763; old `zh.ts` lines 743-760 | current `en.ts` lines 558-574; current `zh.ts` lines 555-571; both now have 35 direct `panorama` keys including the old 16 plus P2/P4 UI keys | PASS |
| P2 API endpoints and operation ids remain bound | reference used `getPanoramaOverview/Health/Gaps`; Design requires `/panorama`, `/panorama/health`, `/panorama/gaps` | `src/api/panorama.ts` lines 337-350 call those paths; generated contracts contain `getPanoramaOverview`, `getPanoramaHealth`, `getPanoramaGaps`; contract test checks these | PASS |
| No fake per-module `recipeCount` apportioning | old reference derived visual coverage from `mod.recipeCount / mod.fileCount` at reference lines 367-417 | current API type allows `recipeCount: number | null` in `src/api/panorama.ts` lines 18-27; UI renders null as unavailable in `src/components/Views/PanoramaView.tsx` lines 75-77, 347-351, 384-386 and shows degradation at lines 323-332 | PASS |
| No old deleted Panorama engines/services resurrected in Dashboard source | Design forbids `PanoramaService`, `DimensionAnalyzer`, `PanoramaAggregator`, `RoleRefiner`, `CouplingAnalyzer`, `LayerInferrer`, `panoramaService` | `rg -n "PanoramaService|DimensionAnalyzer|PanoramaAggregator|RoleRefiner|CouplingAnalyzer|LayerInferrer|panoramaService" src --glob '!src/generated/api-types.ts'` returned no matches | PASS |
| Product source outside Dashboard untouched | Task forbids edits outside Dashboard | Git diff/commit contains only `AlembicDashboard/src/components/Views/PanoramaView.tsx` | PASS |

## Intentional Contract Differences From Old Reference

These are not P5 failures because they are required by accepted P0-P4 constraints:

- Old reference assumed per-module `recipeCount` was numeric and rendered derived
  coverage from `recipeCount / fileCount`; current code preserves `recipeCount:
  number | null` and shows an unavailable/degraded state when P0/P2 direct
  module-id alignment is false.
- Current overview includes ProjectScope and degradation messaging so users can
  see the accepted scope boundary and CG-E degradation reason.
- Current dependencies and graph tabs use the accepted real `DepGraphView` and
  `KnowledgeGraphView` paths instead of resurrecting old backend engines.

## Existing Runtime Screenshot / API Evidence Used

P5 did not start or mutate real providers/data roots. It reused the accepted P4
runtime evidence that already captured the restored Dashboard UI after P4 source
repairs:

- `.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1/aw-ui-tabs-summary.json`
- `.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1/aw-ui-overview-visible.png`
- `.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1/aw-ui-dependencies-visible.png`
- `.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1/aw-ui-graph-visible.png`
- `.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1/aw-ui-gaps-visible.png`
- `.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1/api-capture-summary.json`

The P4 tab summary shows all four AlembicWorkspace tabs clicked once in a clean
browser context with empty local/session storage and no BiliDili or `02a25032`
text in any tab.

## Validation

Commands run in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicDashboard`:

```text
npm run check
```

Result: passed.

Covered gates:

- `npm run lint`: passed, 100 source files checked.
- `npm run check:api-types-drift`: passed, byte-identical to Alembic canonical.
- `npm run check:space-boundary`: passed, 487 import specifiers checked.
- `npm run check:layer-contract`: passed, 100 files / 197 runtime edges.
- `npm run check:doctrine`: passed.
- `npm run check:naming`: passed.
- `npm run test`: passed, 34/34 node tests.
- `npm run typecheck`: passed.
- `npm run build`: passed.

Build emitted only the pre-existing Vite warnings for escaped CSS property
`file` and large chunks; these did not fail the build and were present before P5.

```text
git diff --check
git diff --check HEAD~1 HEAD
```

Result: both passed.

Post-commit repository status:

```text
## main...origin/main [ahead 2]
```

Working tree clean.

## Residual Risks

- The scratchpad reference file named by the task package is absent in this local
  checkout; the comparison used the task-authorized `git show 0e27445` fallback.
- P5 did not rerun a fresh browser session after the two-line fidelity repair.
  The changed points are deterministic source-level UI text/count fixes, and the
  accepted P4 evidence already covers the real four-tab runtime surface. No
  provider or data-root mutation was needed for this comparison.

