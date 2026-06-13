# R-Group Rulings And Applied Defaults (2026-06-13)

The user authorized autonomous advancement of the entire R task group except
CKG ("开始整个 R 任务组的自动化推进，ckg ckg-v2 除外") and resolved
AFAPI-REQ-08 ("AFAPI 可以标记为已完成"). This records the user rulings on the
non-defaultable items and the controller defaults applied to the rest, so the
automation is traceable.

## User rulings (AskUserQuestion, 2026-06-13)

| Row | Ruling | Enactment |
| --- | --- | --- |
| C1 runtime publish | **HOLD for explicit go** — automate + verify up to publish; the staged `npm publish @gxfn/alembic-runtime@0.2.0` waits for the user's trigger | release RW5 stops before the publish button |
| B2 ./shared + C3 SD-5 p2 | **Re-point to root facade, then delete as staged** — re-point MT2 OutputBudget + CO3 error imports/docs to the root facade, then delete the 67 zero-consumer wildcard keys (fresh re-scan + deletion-proof) | release RW1 (re-point) → RW2 (delete) |
| A3 R-1 overlay routes | **Delete in 0.3.0 with the RC4-style proof set** (no consumer named; git-recoverable) | release RW4 |
| B1 resident MCP registry | **Delete the unbound registry + re-charter as "HTTP/daemon host"** — resolves the 15-tool duality toward the served surface (registry has zero importers = behavior-neutral) | governance GD2 + GD1 wording |

## Controller defaults applied to the lower-stakes rows (user may override)

- **C2 version-pin**: exact-version pins kept (D3, already ruled at C2 enactment); marketplace hosting in AlembicClaudeCode confirmed — release RW4 tail, no change needed.
- **C4 coverage enforcement**: default **status-quo (leave unwired; provider installed)** — wiring a ratchet would lower CO0-frozen thresholds and needs explicit approval, so held at status-quo and recorded; user may later choose ratchet/uplift.
- **B5 Capability base-contract**: default **keep the blessed exception** (behavior-neutral; re-justified) — no placement move unless the user wants one.
- **B6 service-locator floor**: default **keep current + re-measure** (no http-route reduction wave) — conservative; the proven area-by-area pattern stays available on request.
- **B7 + W1 charter wording**: **apply** the additive charter-wording batch (three Alembic areas + W1-core/dashboard/plugin + the B1 "HTTP/daemon host" amendment) — behavior-neutral, reverse-check clean.
- **W2 Dashboard strays**: default **leave pinned** (the exact-set-equality pin already prevents growth) — no consolidation unless requested.
- **C5 codex_stop/cleanup**: **add the destructive-tool visibility sheets** (docs/sheets, no behavior change).
- **C8 daemon-route rebuild parity**: **document the asymmetry** (no behavior change) unless the user wants alignment.
- **A1 SD-1 phase-2**: default **keep dual copies under the drift gate** (no kernel-sinking evaluation pulled forward).
- **A2 / A4 / B3 / B4**: acknowledged standing defaults with their recorded triggers.

## Holds (NOT auto-executed — surfaced to the user)

- **C1 publish** — irreversible/outward; user trigger (above).
- **C6 scratch-registry stale entry** and **C7 corrupted ghost-workspace DB** — both live in the REAL `~/.asd` data root; the controller will not silently mutate the user's real data root. Quarantine-with-note or removal awaits explicit user instruction.

## Standing constraints (unchanged)

Publishes/version-bumps user-triggered; deletions carry the RC4-style proof
set (import-scan clean, replacement connected, build green) and are
git-recoverable; naming lints stay BLOCKING in all five repos; dual-shell
Plugin parity byte-stable; CKG excluded (ckg-v2 owned by the Codex window).
