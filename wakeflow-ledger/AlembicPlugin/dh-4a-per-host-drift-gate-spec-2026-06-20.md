# DH-4a — Per-Host Products + Drift-Gate Per-Host Spec (AlembicPlugin side)

Date: 2026-06-20 · Window: AlembicPlugin · Demand: alembic-plugin-dual-host-architecture-refactor-2026-06-19
Baseline: HEAD `0221525` (DH-3 done) · Source: DH-4a task package + DH-0 precheck `dh-0-dual-host-precheck-2026-06-19.md` §①/§DH-4 + Design RC-4.

This doc is the DH-4a structural output: (B) the AlembicPlugin-side per-host forking spec for the **flagged Part 1 continuation**, and (C) the **Alembic-side drift-gate per-host spec for DH-4b**. Authority for the gate model is Alembic (governance); DH-4b implements it. AlembicCore = observing.

## A. DH-4a delivered this pass (committed, verified)

1. **manifest-seam de-Codex** (parent `67ebfed`) — PluginRegistry 5 host-agnostic shape-dispatch symbols de-prefixed (`CodexPluginHostShape→PluginHostShape`, `CodexPluginMcpDeclaration→PluginMcpDeclaration`, `CodexPluginRegistry→PluginRegistry`, `readCodexPluginMcpDeclaration→readPluginMcpDeclaration`, `loadCodexPluginRegistry→loadPluginRegistry`) + `CODEX_REQUIRED_SKILLS→REQUIRED_SKILLS`. Codex `.mcp.json` wire-byte preserved (read path = adapter `pluginMcpManifestPath`/`normalizePluginMcpArg`, untouched). Closes the DH-3g manifest-seam flag.
2. **cc shell manifest identity + gitlink** (submodule `f2c2929`, parent gitlink bump `53f9258`) — cc `.claude-plugin/plugin.json` now `ALEMBIC_PLUGIN_HOST=claude-code` (was `codex`, the DH-1 unsubmitted bug that forced cc to self-identify as codex and override shell-shape detection); dropped stray `ALEMBIC_CHANNEL_ID=codex` (codex `.mcp.json` does not carry it; nothing reads it). `ALEMBIC_CODEX_*` env-var *names* unchanged (frozen shared runtime keys both shells set). Submodule commit is local — **push is a separate release step (not done)**.

## B. Current per-host state (mapped, baseline 0221525)

- Two L4 shells: `plugins/alembic-codex/` (`.mcp.json` + `.codex-plugin/`) and `plugins/alembic-claude-code/` (inline MCP in `.claude-plugin/plugin.json`).
- **cross-shell-drift gate** (`scripts/check-cross-shell-drift.mjs`, in `npm run check`): requires `SHARED_PATHS=['bin','skills','LICENSE']` **byte-identical** between the two shells; manifests/READMEs/.mcp.json exempt.
  - **Status: RED at baseline (PRE-EXISTING, not a DH-4a regression).** Only `skills/alembic-recipes/SKILL.md` diverges cross-shell — line 39: codex shell `mode: "semantic"` vs cc shell `mode: "auto"`. The other 4 skills + `bin/` + `LICENSE` are byte-identical. This is a SCRIPT gate, not a vitest unit test (so not in the 39-file unit baseline).
- **shared-asset-drift gate** (`scripts/check-shared-asset-drift.mjs` + `config/shared-asset-manifest.json`, authority = Alembic): 9 assets, section-aware. 4 skills are `skill-shared-sections` ("shared sections: main; host sections: each host"), `config-default` is already `authority: per-host`, others `main-only`/`exact`/`directory-exact`. DH-0 §① found 3 drifts (plugin AHEAD of stale main) needing Alembic backport before DH-1 (needs-controller — confirm whether applied).
- **The core mismatch**: cross-shell-drift compares *byte-identical*; shared-asset-drift compares *marked sections* (host overlays allowed). The alembic-recipes line-39 divergence is a host overlay outside the wakeflow-shared markers — shared-asset-drift already tolerates it, but byte-identical cross-shell-drift flags it. **The per-host model = make cross-shell-drift section/per-host-aware instead of byte-identical.**

## C. Alembic-side drift-gate per-host spec (DH-4b — Alembic window implements; do NOT change Alembic from the Plugin window)

Per DH-0 §DH-4 (line 47), authoritative model:
1. **`Alembic/config/shared-asset-manifest.json`**: move the skill/template shared assets from single shared path → **per-host variant paths** — each `skills/alembic-*/SKILL.md` declares a `codex` variant and a `claude-code` variant (codex tool-name guidance vs cc tool-name guidance). Lowest-churn alternative: keep the existing `skill-shared-sections` model (shared sections validated vs main; host sections per-host) and only promote genuinely host-divergent tool-name lines to `wakeflow-host:<host>` sections — recommended where divergence is a single line (alembic-recipes) rather than whole-file.
2. **`Alembic/scripts/check-shared-asset-drift.mjs`**: add per-host comparison (validate each host variant against its per-host authority) + **optional cross-host coherence** (the shared, non-host sections must still match across codex/cc). The Plugin's copy `scripts/check-shared-asset-drift.mjs` is a self-check asset and must stay byte-identical to Alembic's.
3. **3-asset green expectation** under per-host model: alembic-recipes / alembic-structure / recipes-setup README host-divergent tool-name lines become `wakeflow-host` sections (or per-host variants) → shared-section comparison green; host overlays no longer flagged as drift.

## D. AlembicPlugin-side per-host forking spec (Part 1 — FLAGGED for continuation; do with DH-4b coordination)

1. **cross-shell-drift gate reshaping** (`scripts/check-cross-shell-drift.mjs`): change from byte-identical `['bin','skills','LICENSE']` to per-host-aware. Recommended: keep `LICENSE` byte-identical; for `skills/` compare only the wakeflow-shared marked sections cross-shell (coherence) and allow host overlays to differ; for `bin/` allow the host-default line to differ (or drop bin from cross-shell, relying on shared-asset/self-check). Update the gate's failure message + any expectation. Net failed-set must not grow (this is a script gate, separate from the 39 unit baseline) — document the cross-shell-drift expectation flip from RED→GREEN-under-per-host.
2. **cc bootstrap fork**: `plugins/alembic-claude-code/bin/alembic-start.mjs:100` `ALEMBIC_PLUGIN_HOST: input.env.ALEMBIC_PLUGIN_HOST || 'codex'` → cc default `|| 'claude-code'`. **Coupled to D.1** (bin/ is currently byte-identical cross-shell; forking it requires the gate to allow bin/ per-host first). Note: the cc manifest (delivered in A.2) already sets the env, so this default is defense-in-depth, not a correctness blocker.
3. **cc setupProfile per-host**: cc currently reuses `CODEX_SETUP_PROFILE='codex-plugin'` (a persistence-frozen init-marker `profile` value; `CodexInitMarker.profile` is type-locked to `typeof CODEX_SETUP_PROFILE` and SetupService keys off it). Introducing a distinct cc profile needs coordinated changes to the init-marker profile type + SetupService — **carefully preserve wire/persistence** (existing on-disk markers). Treat as its own sub-step.

## E. OPEN DETERMINATION (blocks a clean Part 1; needs controller/Design)

- **Is the alembic-recipes line-39 cross-shell divergence (codex `semantic` / cc `auto`) intentional host-divergence or mirror lag?** DH-0 §① caveat (line 23): genuinely host-divergent tool/mode lines belong in the DH-4 per-host fork; if a line "can't be reconciled as shared without forcing wrong content, that confirms it belongs in the per-host fork — flag back to controller." Need Design/git-history to decide: (a) intentional → make it a per-host overlay (both gates bless it); or (b) mirror lag → reconcile to one value (mirror) and keep cross-shell byte-identical for that line. This determination drives whether D.1 blesses the divergence or reconciles it.
- **DH-0 §① Alembic backport status**: confirm whether the Alembic window applied the 3-asset backport (plugin→main) before proceeding — shared-asset-drift vs main may still be RED if not.

## F. Boundaries / invariants (held)

- CC3 (user-visible "Codex" prose in skills/templates) NOT in scope — structure/markers/manifest only.
- Codex `.mcp.json:8` tool behavior, on-disk filenames (`codex-init.json`/`codex-project-root.json`), profile value `'codex-plugin'`, MCP error codes = wire/persistence-frozen, unchanged.
- AlembicCore untouched; Alembic not changed from this window (DH-4b implements the gate). Pure-MCP non-resident invariant + four-tool external MCP semantics intact.
