# DH-0 — Dual-Host Refactor Precheck (inventory + prerequisites; NO refactor)

- Demand: `alembic-plugin-dual-host-architecture-refactor-2026-06-19`
- Task: `DH-0` / dispatchGroup `dh0-plugin-precheck`
- Window: AlembicPlugin · Date: 2026-06-19 · Baseline HEAD `afbf25e` (daemon-removal + MC-3p; pure non-resident MCP)
- Status: **completed precheck** — no code change (precheck only; Plugin tree clean at `afbf25e`, AlembicCore clean `f0bf896`). Did NOT enter DH-1.
- Open items for controller: **needs-controller** = item ① Alembic-side drift apply (before DH-1). No `needs-user-decision` (item ② resolved feasible).

## Baseline (item ⑤ part 1)
- `tsc --noEmit` exit 0 · biome `lib/bin/config/scripts` = 0 err / 16 warn · vitest = 39 failed files (pre-existing sandbox baseline) · **drift-gate = RED** (3 drifts, pre-existing — item ①).

## ① pre-existing shared-asset drift gate (RED) — direction determined; Alembic-side apply (needs-controller)
Ran the governance authority `Alembic/scripts/check-shared-asset-drift.mjs`: **FAIL, 3 drifts** —
- `skill-alembic-recipes` — shared sections `intro-and-overview` + `use-context-tail`
- `skill-alembic-structure` — shared sections `title-intro` + `tools-and-graph`
- `templates-recipes-setup` — `README.md`

**Diff finding (direction):** in all 3, the **Plugin is ahead** (reflects the current merged-tool surface: `alembic_search` operation=search/get/expand + mode=auto/keyword/semantic, `alembic_code_guard`, `alembic_project_matrix`/`alembic_graph`, no `alembic_knowledge confirm_usage`); **Alembic main is stale** (old `alembic_knowledge` list/get/confirm_usage, `alembic_guard`, `alembic_structure` targets/files/metadata). This matches the design ("plugin RC5 = target → main catches up") + the manifest note (`templates-recipes-setup`: "README ... backported from plugin (RC5 p1)") — established pattern is **plugin innovates → main backports**.

**Resolution:**
- **Plugin side: nothing to sync** (plugin already holds the target content). No Plugin commit in DH-0.
- **Alembic side (needs-controller, cross-repo): backport the plugin's content** into `Alembic/skills/alembic-recipes/SKILL.md` (shared sections intro-and-overview + use-context-tail), `Alembic/skills/alembic-structure/SKILL.md` (title-intro + tools-and-graph), `Alembic/templates/recipes-setup/README.md` (the tool-surface lines) — to match `AlembicPlugin/{skills,templates}/...`. The controller dispatches the Alembic window to apply, **before DH-1**, then re-run the gate to green.
- **CAVEAT (entanglement with DH-4):** some drifted lines are genuinely host-divergent tool names (main CLI `alembic_knowledge`/`alembic_guard` vs plugin MCP `alembic_search`/`alembic_code_guard`). When backporting, the Alembic window should keep genuinely host-specific tool-name lines as `wakeflow-host:main` sections (not overwrite with plugin tool names). The clean long-term model is the DH-4 per-host fork; DH-0 only needs the shared-section content reconciled to green. If the Alembic window finds the divergence can't be reconciled as "shared" without forcing wrong content, that confirms these sections belong in the DH-4 per-host fork — flag back to controller.
- Authority (per manifest): shared sections = main; templates-recipes-setup = main (`directory-exact`, with the declared `_template.md` `v3-fields-heading` variant).

## ② cc-host hooks 8-cluster feasibility — cc adapter FEASIBLE (no needs-user-decision)
Combined the Claude Code capability research (claude-code-guide) with the repo-side codex-usage criticality (file:line). **Matrix:**

| Cluster | CC capability | Plugin criticality (codex side) | cc verdict |
|---|---|---|---|
| 1 Transport | **EQUIVALENT** — stdio MCP via `.mcp.json`/`.claude-plugin/plugin.json` | CORE but host-generic (standard SDK stdio; `PluginRegistry` already reads both shells) | works |
| 2 Project-root | **PARTIAL** — cwd=project root, `${CLAUDE_PROJECT_DIR}`; no explicit trusted env | **CORE** — `ProjectRootResolver.ts:280-285` trusts explicit/ALEMBIC_PROJECT_DIR/CODEX_WORKSPACE_*; cwd → `trust:'fallback'` → tools fail-closed | **degrades** (fail-closed; per-call `projectRoot` escape hatch exists). **#1 fix: add a cc workspace env to the trusted candidate list** |
| 3 Init profile | **EQUIVALENT** — `SessionStart` hook | NICETY — in-process init-on-demand; `CODEX_SETUP_PROFILE` only selects Ghost default | works |
| 4 Env | **PARTIAL** — `CLAUDECODE=1`, `${CLAUDE_PLUGIN_ROOT}`, declarable `env` | CORE-by-default/NICETY-in-practice — `ALEMBIC_PLUGIN_HOST=codex` is a default + diagnostics expectation, overridable; real driver is `hostShape` (manifest) | works |
| 5 Tool tiering / dynamic list | **NONE** — static ListTools | NICETY — execution gated by `preflightCodexTool` regardless; static list still callable | degrades (stale menu; calls still gated) |
| 6 Diagnostics / host status | **NONE** — no host introspection API | NICETY — `buildCodexRuntimeDiagnostics` self-generates from local state; never queries host | works (self-generated) |
| 7 Background jobs | **PARTIAL** — Monitor; long-lived MCP proc | CORE feature but in-process (`JobStore` file I/O, no host persistence) | works |
| 8 Execution/turn metadata | **NONE** — only tool args to MCP | NICETY — `readHostTurnMetaFromMcpRequest` reads generic MCP `_meta`; degrades to `undefined` | degrades cleanly |

**Conclusion:** the claude-code-guide's "3 NONE = big gaps" (clusters 5/6/8) map exactly to **NICETY** clusters that already degrade gracefully. The only **CORE** coupling is **project-root (2)**, which cc handles via the built-in per-call `projectRoot` + a small trusted-candidate-list addition. Transport/init/env work; the **L3 dual-host seam already partially exists** (`PluginRegistry.CodexPluginHostShape = 'codex'|'claude-code'`; `Diagnostics.ts` already special-cases `hostShape==='claude-code'`). → **cc adapter is feasible, narrower in niceties; NO needs-user-decision STOP.** DH-2/DH-3 must: (a) add a cc workspace env to `ProjectRootResolver` trusted candidates (#1), (b) accept static tool list on cc, (c) accept absent turn-meta/host-introspection on cc.

## ③ CC3 wording boundary (confirmed)
Per the design (§已决/分阶段): **DH-4 = structural per-host fork** (per-host dirs/markers/manifest + drift-gate model change) — IN this demand. **CC3 = wording unification** (remove "Codex" terminology user-facing, `PLUGIN-SOURCE.json` hostWordingDebt) — NOT in this demand; mutually non-blocking. Boundary line: DH-4 changes *structure/markers/manifest paths* (where per-host assets live + how the gate compares them); it does NOT rewrite "Codex"→neutral wording in skill/template prose (that's CC3). The `de-Codex` of code symbols (item ⑤, ~52 mis-named) is DH-3/RC-3b (code identifiers), distinct from CC3's user-facing prose.

## ④ cross-repo coordination points (Alembic side, for DH-4 dispatch + item ① now)
- **Now (item ①, before DH-1):** Alembic window backports the 3 drifted shared assets (list above) → gate green.
- **DH-4 (cross-repo):** change the shared-asset model from single-path to **per-host path** — `Alembic/config/shared-asset-manifest.json` (the skill/template assets become per-host: `skills/alembic-*/SKILL.md` → codex + claude-code variants) + `Alembic/scripts/check-shared-asset-drift.mjs` per-host comparison (+ optional cross-host coherence check). Governance authority stays Alembic side; the Plugin's `scripts/check-shared-asset-drift.mjs` copy must stay in sync (self-check asset). AlembicCore = observing (no change).

## ⑤ 92 Codex* surface review (refinements feed DH-2/DH-3)
- **Surface count: ~221 distinct `Codex*`/`CODEX_*` identifiers / 1118 occurrences / 58 files** — the design's "~92" undercounts ~2.4× (it ≈ exported func/const names excluding types/interfaces). **Restate the denominator as ~221.**
- **~40 host-specific is OVER-counted.** The true L3 host-adapter seam is concentrated in **~5 files**: `ProjectRootResolver.ts` (host env/trust), `runtime/RuntimeContext.ts` (env identity, `CODEX_PLUGIN_HOST`, `ensureCodexRuntimeEnvironment`), `PluginRegistry.ts` (host shape — already dual-host aware), `diagnostics/Diagnostics.ts` (host expectations/mismatch), and `SetupService`/`CODEX_SETUP_PROFILE` (profile identity). The overwhelming majority (~80%) are host-agnostic logic with a cosmetic `Codex` prefix → **de-prefix to L1/L2**.
- Design's 3 named "mis-named host-agnostic" examples **confirmed host-agnostic** (file:line verified): `resolveCodexServiceRequestBoundary` (ServiceRequestBoundary.ts — always `executionPath:'plugin-owned-codex-facing'`, no host branch), `buildCodexProjectRuntimeContext` (ProjectRuntimeContext.ts:174 — zero env/host reads), `CODEX_*_TOOL_NAMES` (ToolPolicy.ts:75-141 — plain `Set<string>` of `alembic_*`).
- **1 design misclassification flagged:** `buildCodexMcpInitializeInstructions` (guidance.ts) is **host-agnostic** (pure `tools→string`, delegates to `buildCodexMcpGuidance`), NOT host-specific — the design's L3 example list is wrong on this one. The real guidance/identity seam is PluginRegistry/RuntimeContext/Diagnostics/ProjectRootResolver.

## Boundaries honored
DH-0 = precheck only: no refactor, no four-tool MCP semantic change, no L3 built, no per-host fork, pure-MCP non-resident invariant intact, no Core sink, AlembicCore untouched (`f0bf896`). Did NOT enter DH-1.

## Returned flags
- **needs-controller**: item ① Alembic-side drift backport (precise list + caveat) → dispatch Alembic window before DH-1; re-run gate to green.
- **Evidence for controller review before DH-1**: ② cc adapter feasible (no STOP) + the #1 project-root fix; ⑤ surface restated ~221 + true-L3 ≈ 5 files + the 1 misclassification; ③ CC3 boundary; ④ cross-repo list.
- Runtime/full-chain (cc real acceptance) → Test/DH-6.
