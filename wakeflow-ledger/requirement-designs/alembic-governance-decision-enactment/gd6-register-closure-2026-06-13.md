# GD6 — AD2 Placement Register Closure And Acceptance (2026-06-13)

Controller closeout for the governance + placement decision enactment demand.
Every AD2 placement-register row is ruled-and-enacted or
acknowledged-with-trigger; the charter reflects reality across the five repos;
no behavior or API changed.

## Enacted rows (with evidence)

| Row | Ruling | Enactment | Evidence |
| --- | --- | --- | --- |
| B1 resident MCP registry | delete unbound registry + re-charter "HTTP/daemon host" | Alembic deleted the zero-importer registry; Core charter amended | Alembic `188938e` (g1, accepted) + Core `471c270` (GD1, accepted) |
| 15-tool resident-vs-plugin duality | resolve toward the served surface | B1 delete removed the second advertiser; AlembicPlugin is the single MCP advertiser in the charter | Core `471c270` charter reconciliation (GD1) |
| B7 three Alembic charter areas | apply (lib/tools host adapters, lib/governance, lib/workflows) | charter-wording batch landed; all three dirs verified to exist | Core `471c270` `config/space-allowed-edges.json` (+5/-5); drift test `SpaceAllowedEdges.test.ts` 6/6 |
| W1-core contract-types surface | apply ("+ host-integration contract types, types-only") | charter line added; `ResidentServiceContracts.ts` verified types-only | Core `471c270` (GD1) |
| W1-dashboard | apply ("state realized by hooks + theme + i18n") | charter line added; Dashboard `src/{hooks,theme,i18n}` verified | Core `471c270` (GD1) |
| W1-plugin | R-1 overlay wording mooted by A3 delete | dropped the overlay clause so no charter line describes removed code | Core `471c270` (GD1) |
| C5 codex_stop / codex_cleanup | add destructive-tool visibility sheets | two Train-H expectation sheets written; load-check green (40 plugin sheets, onServerNotSheeted=[]); registry 383/383 | GD4 (Test, accepted) — workspace-local Train-H assets |
| C8 daemon-route rebuild parity | document the asymmetry | dated note appended to the certification-matrix-v2 ledger; reverse-checked at Plugin `1256b1d` | GD4 → `certification-matrix-v2-2026-06-13.md` (committed `8ea3ea1`) |

## Acknowledged standing defaults (controller-applied; user may override)

| Row | Default | Standing trigger |
| --- | --- | --- |
| B5 Capability base-contract | keep the blessed exception (behavior-neutral, re-justified) | a future user request to relocate; layer-contract matrix already pins it |
| B6 service-locator floor | keep current + re-measure (no http-route reduction wave) | the proven area-by-area reduction pattern stays available on request |
| W2 Dashboard stray transports | leave pinned (exact-set-equality pin prevents growth) | a user request to consolidate into api.ts |
| A1 SD-1 phase-2 kernel-sinking | keep dual copies under the drift gate (no evaluation pulled forward) | a user request for the sinking evaluation (design candidates only) |
| A2 / A4 / B3 / B4 | acknowledged standing defaults | their recorded register triggers (no pull-forward requested) |
| C2 version-pin | exact-version pins kept; marketplace hosting confirmed | release RW4 tail (already closed) |

## Charter-reflects-reality verification

- Reverse-check clean: every charter line verified against live code at GD1
  accept (no orphan line, no empty area; resident-MCP wording removed since
  the registry is deleted).
- Charter drift test `SpaceAllowedEdges.test.ts` 6/6 green (every repo names a
  non-empty charter).
- Core full check exit 0 at GD1 accept (108 files / 1193 tests; boundary 59;
  naming lint src-active 437/14; space-edge gate OK) — layer-contract and
  doctrine lints green.
- No behavior or API change: GD1 was config-only (+5/-5, zero src); g1 deleted
  a zero-importer registry; C5/C8 were docs/sheets only.

## Verdict

The AD2 placement decision register is closed: all rows ruled-and-enacted or
acknowledged-with-trigger. The keystone (B1) unblocked the charter wording and
the duality, both resolved. zodToMcpSchema disposition: KEEP (still imported by
`lib/shared/schemas/mcp-tools.ts` post-registry-deletion; Alembic-owned,
advisory note only). No open governance row remains; the register is archived
with this closeout. The user may override any controller-default row at any
time.
