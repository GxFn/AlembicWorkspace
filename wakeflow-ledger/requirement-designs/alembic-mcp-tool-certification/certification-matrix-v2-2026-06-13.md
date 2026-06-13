# Alembic MCP Tool Certification Matrix v2 — P5 Dual-Shell Re-Cert (Test window, 2026-06-13)

Demand: alembic-portfolio-execution-plan-p5-recert-2026-06-13 (p2 / t2)
Lineage: certification-matrix-v1 (Train H state root) → this v2 on the RENAMED tree.
Tree under test: AlembicPlugin `f5bdab6` (CC shell submodule `ca6edcf`, Codex shell
submodule `c452de3`); runtime `@gxfn/alembic-runtime@0.2.0` via the local-dev cache
pin (package dist diff-verified == repo dist, .d.ts stripped); BOTH shell entries
launch `bin/alembic-start.mjs`. serverInfo `name=alembic` observed live on every
run — per the user's C2 ruling enacted by N1 (the `alembic-v3` SdkMcpServer
instance present in dist never surfaced on the wire).
Raw evidence: p5-recert state root `evidence/v2-runs/<run>/raw/` (10 valid runs;
the first battery's 8 usable/admin runs were INVALIDATED by a Test-window
target-generation bug — wrong ALEMBIC_PROJECT_DIR/TIER values from shell heredoc
parsing — disclosed, deleted, and re-run with python-written targets; cold runs
were unaffected and kept).

## Tier / tools-list (both shells identical)

| Config | tools/list | Matches |
| --- | --- | --- |
| cold scratch (agent) | 26 | v1 baseline, zero drift |
| usable fixture (agent) | 39 | v1 baseline |
| usable fixture (admin enabled) | 40 (+alembic_knowledge_lifecycle) | v1 baseline |

## Run × gate table

| Run | tools/list | ran | complFAIL | edgePASS | edgeFAIL | completeness-fail tools |
| --- | --- | --- | --- | --- | --- | --- |
| cc-cold | 26 | 26 | 9 | 26 | 0 | code_guard, codex_bootstrap, codex_dashboard, codex_rescan, decision_record, dimension_complete, prime, submit_knowledge, work_finish |
| cc-usable-main | 39 | 35 | 12 | 34 | 0 | code_guard, codex_bootstrap, codex_dashboard, codex_rescan, decision_record, dimension_complete, graph, guard, panorama, prime, submit_knowledge, work_finish |
| cc-rescan | 39 | 1 | 0 | 1 | 0 |  |
| cc-bootstrap | 39 | 1 | 1 | 1 | 0 | bootstrap |
| cc-admin | 40 | 2 | 1 | 2 | 0 | knowledge_lifecycle |
| cx-cold | 26 | 26 | 9 | 26 | 0 | code_guard, codex_bootstrap, codex_dashboard, codex_rescan, decision_record, dimension_complete, prime, submit_knowledge, work_finish |
| cx-usable-main | 39 | 35 | 12 | 34 | 0 | code_guard, codex_bootstrap, codex_dashboard, codex_rescan, decision_record, dimension_complete, graph, guard, panorama, prime, submit_knowledge, work_finish |
| cx-rescan | 39 | 1 | 0 | 1 | 0 |  |
| cx-bootstrap | 39 | 1 | 1 | 1 | 0 | bootstrap |
| cx-admin | 40 | 2 | 1 | 2 | 0 | knowledge_lifecycle |

Gating = connectivity + completeness + edgeHonesty (budget/description stay
report-only as in v1). Exit=1 rows are explained below; rescan segments exited 0.

## Completeness classification

Every completeness FAIL except ONE sits in the v1-certified honest-usage-gate
classes (builder-minimal calls hitting documented usage gates: scope/args/state
preconditions — code_guard, codex_bootstrap/dashboard/rescan (selected-project
block with the t6 executable nextActions), decision_record, dimension_complete,
graph, guard, prime, submit_knowledge, work_finish, knowledge_lifecycle
(nonexistent-id), bootstrap (the t6 consent refusal on a usable KB — the
CERTIFIED-CORRECT gate, observed verbatim on both shells)).

**F-V2-3 — REGRESSION (the one exception): `alembic_panorama` bare call on a
usable KB now returns `INTERNAL_ERROR` with raw JS text "Cannot read properties
of undefined (reading 'count')" on BOTH shells.** v1 baseline (e9d1bb8): success
"Panorama request completed." (339 B). 500-class crash text on the wire; named
operations (module/governance_cycle/staging_check/unknown-op) still respond
honestly. Blame window: e9d1bb8 → f5bdab6 (P3 trains + Core vendor lineage +
SN5 renames). Routed to the owning Plugin/Core windows — NOT fixed here per the
re-cert stop conditions. Raw: `cc-usable-main/raw/alembic_panorama__rep__minimal.json`
(+ cx twin) vs Train H `bilidili-agent-usable/raw/alembic_panorama__rep__minimal.json`.

## edgeHonesty — CERTIFIED for the first time

- ZERO edgeHonesty failures across all 10 runs; per-shell edge executions:
  cold 181, usable-main 243, rescan 9, bootstrap 9, admin 10 (instances).
- Union coverage: **175/178 executable registry edges ran per shell**; the 3
  never-ran require an initialized-but-EMPTY-KB config no current target
  provides (health#knowledge-base-empty, panorama#no-panorama-data,
  project_skill#refresh-without-stores) — documented residual, not silent.
- **Schema-reject probes: 21 per shell (42 total) — ALL validated at the
  SERVER (structured rejection envelopes with codes).** Semantics decision
  (recorded in harness README + matrix.mode): the registry's ajv results are
  CLIENT-side evidence only; the harness sends reject probes to the server and
  counts the server verdict distinctly. One divergence found:
  **F-V2-1 — `alembic_symbol_search` accepts `limit:"ten"`** (wire schema says
  number; client ajv rejects; server succeeds with a degraded result) —
  schema-vs-server coercion honesty gap, Train B class.
- Documented-not-run: 197 registry entries (109 resident-runtime + 88
  plugin-reasoned) recorded per run with reasons in `transport.error`;
  edgeHonesty=null (not certified, never counted as pass).

## Cross-shell parity

527 case-pairs compared (cc vs cx, same segment): **340 exact-byte identical;
109 identical after volatile-field normalization** (timestamps/epochs/ids/
generation ids/tmp paths); **78 residual — ALL one named per-host family**:
the embedded runtime-context block (`mcpConfigPath`, `mode:
marketplace-shell↔unknown`, diagnostics manifest checks) resolves
CODEX-shell-shaped paths only. Business outcomes (ok/status/error.code/summary)
are IDENTICAL across the residual set except the 6 diagnostics cases.

**F-V2-2 — `alembic_codex_diagnostics` is Codex-shell-shaped: under the CC
shell it reports status=degraded with 8 failing checks (pluginManifest/
pluginMcp/pluginMcpEntry/pluginAssets/pluginHost/pluginRuntimeMode/packagePin/
embeddedRuntime) and error actions referencing `plugins/alembic-codex/.mcp.json`,
while the Codex shell passes.** Regression-candidate vs the CC4 observation
(pre-rename CC cache copy reported diagnostics pass); the runtime-context
divergence also rides ~78 responses' meta blocks (mode=unknown on CC). Owner:
Plugin window (host-shape-aware diagnostics/manifest discovery).

## MT4 re-cert verdict

- Connectivity: PASS both shells, all configs (26/39/40, zero drift).
- Completeness: PASS within certified classes; ONE regression (F-V2-3 panorama).
- edgeHonesty: PASS — certifiable and certified (this was v1's open dimension).
- Budget/description: report-only, unchanged scope.
- Parity: byte-stable modulo volatiles; one named per-host family (F-V2-2).
- VERDICT: **re-certification HOLDS on both shell entries except the two named
  findings (F-V2-3 regression, F-V2-2 host-shape divergence) + one schema gap
  (F-V2-1)** — all routed, none fixed in this demand.

## CC4-timeline confirmation (p5 p3 question)

ANSWER: **the runtime cache was NOT being installed concurrently with the first
Claude Code session during CC4 — the install-lock attribution does NOT match
the CC4 instance.** Test-window records: the CC4 runtime cache was seeded by a
complete file copy minutes BEFORE any session (no npm installer, no
`.install.lock` remnant, no `.runtime/` npm logs in the claude-leg cache copy).
The CC4 instance instead fits the NEGATIVE-CACHE mode primed by two REAL
earlier failures in the same scratch profile (missing node_modules deps:
ERR_MODULE_NOT_FOUND manual boot + a failed `claude mcp list` health check),
FIXED before the interactive session; `mcp-needs-auth-cache.json` exists in the
CC4 scratch config (mtime 19:50 ≈ the Reconnect window, content since emptied)
— stale negative cache over a healthy server, bypassed and cleared by
`/mcp Reconnect`, later sessions clean. Whether the session-start failure was a
negative-cache skip or a live re-fail cannot be separated from surviving
artifacts (debug logs absent). The p3 lock-wait mechanism remains demonstrated
as a REAL potential mode — it is just not what bit CC4. The short-session
log-visibility note is recorded in the harness README.

## Incidents disclosed (Test-window hygiene)

- First-battery target-generation bug (invalid 8 runs, deleted + re-run).
- A failed early boot (missing cache env) created a stray `.runtime/` inside
  the CC shell REPO working tree — removed immediately; both shell repos
  verified clean after.

---

## ADDENDUM — Targeted re-certification after the p4 repair (P5 t5, 2026-06-13)

Tree: AlembicPlugin parent `1256b1d` (p4 repair commit: panorama project-root
wiring via canonical resolveProjectRoot + host-shape-aware diagnostics), CC
shell `6c39111`, Codex shell `c452de3`. Runtime cache re-seeded from the repo
dist at `1256b1d` (diff-verified identical). Targeted re-runs only — the rest
of the matrix stands on the runs above. Raw: p5-recert state root
`evidence/t5-reruns/`.

### F-V2-3 (panorama) → FIXED + RE-CERTIFIED

| Row | CC shell | Codex shell |
| --- | --- | --- |
| bare call (usable KB) | ok:true "Panorama request completed." | ok:true "Panorama request completed." |
| operation=module, unknown module | honest error "Module not found: nonexistent-module" | same |

Both targeted runs exit 0. Breaking-mechanism summary per p4: a LATENT Plugin
cwd-wiring defect (panorama resolved its project root from process cwd instead
of the canonical resolveProjectRoot route) — NOT a commit regression; the
e9d1bb8..f5bdab6 blame window named in the original F-V2-3 entry is CLEARED.

### F-V2-2 (diagnostics host shape) → FIXED + RE-CERTIFIED

- CC shell (fresh expectation, now in the expectation sheet citing p4):
  ok:true, status=ready, businessOk:true, **17/17 checks pass**,
  runtime-context mode=marketplace-shell.
- Codex shell: unchanged — t5 like-for-like comparison vs the v2 capture:
  state-free cases byte-stable after volatile normalization; the only residual
  deltas are JSON-RPC sequence ids and the autoInit context block, which echoes
  run composition (which tool first triggered ghost init + the per-run scratch
  path), not behavior. The fix did not move Codex bytes.
- Sheet update: `expectation-sheets/plugin/alembic_codex_diagnostics.md`
  carries the fresh CC expectation with the p4 citation; sheets reload clean
  (38 loaded, 0 parse problems).

### V1-FIDELITY NOTE

Matrix v1 (Train H) did NOT launch through a real shell entry — it executed the
repo dist server (`dist/bin/codex-mcp.js`) directly, so shell-entry defects of
the F-V2-2 class were invisible to v1. v2's dual-shell-entry fidelity
(`bin/alembic-start.mjs` on both shells) is the certification standard going
forward; v1 rows remain valid for tool behavior but not for shell-entry claims.

### MT4 verdict — revised

With F-V2-3 and F-V2-2 fixed and re-certified on both shells, and F-V2-1
(symbol_search limit coercion divergence) routed as a Train B schema-honesty
item (a sheet/schema documentation gap, not a certification gate):
**MT4 re-certification = UNQUALIFIED PASS on both shell entries.**

---

## C8 ASYMMETRY NOTE — daemon-route rebuild-confirmation parity (governance GD4, 2026-06-13)

Ruling enacted: **DOCUMENT THE ASYMMETRY** (default ruling, AD2 register C8;
r-group-rulings-2026-06-13). This is a DOCUMENTED DECISION — no behavior/
alignment edit was made. Source characterization: Train H / MT route analysis
and the t12 duality-resolution decision-prep row #1.

Reverse-checked against the renamed tree (AlembicPlugin 1256b1d):

| Route | Tool | Rebuild-confirmation pre-gate? | Evidence |
| --- | --- | --- | --- |
| Local host-agent cold start | `alembic_bootstrap` | **YES** — pre-gates on `inspectCodexKnowledge.usable` (the same predicate as the tools/list knowledge gate); usable && !rebuild → `CODEX_BOOTSTRAP_REBUILD_CONFIRMATION_REQUIRED` (failureKind needs-confirmation), recommends `alembic_rescan`, requires explicit `{"rebuild": true}`, archives to `.asd/.trash/<ts>/`. | lib/runtime/mcp/host-agent-workflows/cold-start.ts:245-280 (gate matrix; DataLossWorkflowGates.test.ts pins it); live in matrix-v2 bootstrap rows + addendum |
| Resident / daemon JOB | `alembic_codex_bootstrap` | **NO** — enqueues a resident-owned daemon job with no `rebuild:true` pre-gate (0 rebuild references on the dispatch/enqueue path). It IS host-project-selection-gated (alignment block with the t6 non-circular recovery nextActions), but it does not pre-gate rebuild-confirmation. | lib/runtime/mcp/host/local-tool-dispatcher.ts:51-52 → CodexMcpServer.ts enqueueJob (~943+); t12 duality doc row #1 |

**The asymmetry, stated:** the local route owns the destructive cold-start, so
it carries the rebuild-confirmation pre-gate; the daemon route delegates
execution to the resident service (resident-owned job semantics) and relies on
its own selection gate instead of a plugin-side rebuild pre-gate. Aligning them
would be a resident/daemon BEHAVIOR change (t12 options: (a) plugin-side
pre-gate before enqueue — parity-budgeted, plugin-owned; (b) resident-side job
gate — Alembic window; (c) keep asymmetric + document — THIS ruling). Under the
default ruling the asymmetry is accepted and recorded; revisit only if the user
later wants alignment. No certification gate depends on this — both routes are
honest within their own contract (the local route refuses-then-archives; the
daemon route is selection-gated and returns recoverable job state via
`alembic_codex_job`).

Ledger-commit note (for the controller): this C8 note and the C5
destructive-tool sheets are docs/sheets-only, behavior-neutral. The C5 sheets
(`alembic_codex_stop.md`, `alembic_codex_cleanup.md`) are workspace-local
Train-H state-root assets (no repo commit). This file
(`certification-matrix-v2-2026-06-13.md`) is the ledger doc — controller commits
it with the C5/C8 governance enactment.
