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
