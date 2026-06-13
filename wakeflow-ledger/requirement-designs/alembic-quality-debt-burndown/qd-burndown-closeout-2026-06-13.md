# Quality + Test-Infra Debt Burndown Closeout (2026-06-13)

Controller closeout (QD3 coverage record + QD6 acceptance) for the quality
debt member. The confirmed completion definition is met; C6/C7 are surfaced to
the user (not auto-mutated); the TODO board is reconciled.

## Accepted waves (with evidence)

| Wave | Window | Scope | Commit | Accept |
| --- | --- | --- | --- | --- |
| QD1 stale-dist family | AlembicPlugin | clean-build-before-pack gate + `.tmp` freshness pin; deterministic source/dist hashing; 4 demonstrated failures (Check A dist-stale, Check B .tmp-pin, prepare refusal, pass-on-clean); 5-test regression; 4 prior instances annotated closed | `5f879ec` | accepted |
| QD2 schema honesty + SN5 residue | AlembicPlugin | `strictToolInput()` on 22 routed schemas (unknown-key VALIDATION_ERROR); F-V2-1 source-graph arg-type validation (`symbol_search limit:"ten"`→reject); tools/list byte-stable; 5 negative tests; 2 SN5 split-join residues fixed | `8bb7573` | accepted |
| CO4 consumer-gate drill | AlembicAgent | belt-and-braces consumer-owned drill (induce→show-RED→revert, NO net change); proved `lint:core-import-boundary` fails from the consumer side | none (HEAD `9c2a4b3` unchanged, tree clean) | accepted |

All Plugin changes were parent-side; both shells untouched (CC `0f002f2`,
Codex `c452de3`); dual-shell parity byte-stable throughout; no version bump
(0.2.0 held).

## C4 coverage enforcement — recorded at status-quo (controller default)

Ruling: **status-quo (leave unwired; provider installed)**. The configured
75/75/80/80 thresholds were never runnable (provider absent, `--coverage`
never passed); real coverage is ~45.50/38.06/49.74/45.95 (improving). Wiring a
ratchet would lower the CO0-frozen never-lower thresholds, which needs
explicit user approval. Held at status-quo and recorded; thresholds never
lowered. The user may later choose (a) honest-baseline ratchet, (b) coverage
uplift waves, or (c) keep status-quo. When wiring, also gitignore `coverage/`.

## C6 / C7 — surfaced to the user, NOT auto-mutated (HELD)

Both live in the **real `~/.asd` data root**; the controller will not silently
mutate the user's real data root.

- **C6 — Train-H scratch-registry stale entry** (`TRAIN-H-SCRATCH-REGISTRY-CLEANUP`):
  one stale registry entry points at a deleted temp dir. Removal awaits
  explicit user OK (one registry-entry removal) — or fold into an Alembic
  touch with instruction.
- **C7 — corrupted ghost-workspace DB** in the real data root: quarantine-
  with-note or removal awaits explicit user instruction.

These are surfaced (the completion criterion), not executed.

## TODO reconciliation

Closed-with-evidence: `TEST-INFRA-STALE-DIST-ALIAS` (Plugin pack-path half),
`CODE-GUARD-SCHEMA-LOOSENESS`, `SN5-CODEMOD-SPLIT-JOIN-RESIDUE`,
`CO4-CONSUMER-GATE-SIBLING-DRILL`.

Resolved-as-default: `CO4-COVERAGE-ENFORCEMENT-DECISION` → status-quo (user
may override).

Kept open / explicitly owned (NOT in this demand's confirmed completion
definition — surfaced for the user to pull forward):

- **`TEST-INFRA-STALE-DIST-ALIAS` (Alembic/Agent half)** — the vitest
  `#alias`→`dist` shadowing half is NOT fixed here; re-scoped to a future
  Alembic/Agent test-infra touch (point `#alias` at source, or add an
  equivalent source-vs-dist freshness gate). Owner: Alembic + Agent.
- **`CC4-FIRST-SESSION-MCP-CONNECT`** — deliberately scoped out of this demand
  (the rulings pass did not rule the lock-fail-fast fix). Backlog: fix ruling
  (option B lock fail-fast ~20s, parity-budgeted) + 0.3.0 distribution docs
  (options C+D negative-cache ops note). Owner: AlembicPlugin.
- **`CC4-TIER-FLIP-CONNECT-CACHE`** — deferred (user 2026-06-13) to the
  Codex-led CKG phase or a user-scheduled MT4 re-cert.
- Empty-KB 3/178 edge residuals and the admin-tier scope note — accepted
  limitations / future re-cert, recorded with evidence.

## Touched repos green

AlembicPlugin `5f879ec` (clean + even; suite 2469/2469, check exit 0, validate
--strict PASS, verify/smoke:codex-plugin PASS, drift PASS), AlembicAgent
`9c2a4b3` (clean + even; CO4 drill left no net change). No other repo touched
by this demand.

## Verdict

Confirmed completion definition met: stale-dist family cannot recur silently
(gate + pin demonstrated); tool schemas reject malformed input with negative
tests while valid inputs stay byte-stable + parity holds; SN5 residues fixed;
coverage recorded at the ruled status-quo (thresholds never lowered); CO4 drill
done; C6/C7 surfaced (not auto-mutated); TODO board reconciled; touched repos
green. The CC4 connect-hardening and the Alembic/Agent stale-dist half are
explicitly owned backlog, surfaced for the user — not silently dropped.
