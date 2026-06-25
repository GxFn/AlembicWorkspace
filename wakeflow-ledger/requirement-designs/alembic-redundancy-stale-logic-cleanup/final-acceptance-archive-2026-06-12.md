# Alembic Redundancy & Stale-Logic Cleanup — Final Acceptance Archive (2026-06-12)

Sequence: `alembic-redundancy-stale-logic-cleanup` (RC0-RC7, eight demands).
Controller: AlembicWorkspace. User authorization: claim + unattended automation
(2026-06-11); automation ran to sequence completion with one user pause/resume.

## Per-Demand Acceptance Summary

| Demand | Window(s) | Final commits | State root closure | Core outcome |
| --- | --- | --- | --- | --- |
| RC0 readiness scan | AlembicWorkspace (self) | — (read-only) | rev 5, completed | Readiness matrix (17+ rows, all verdicts evidence-backed); 6 audit corrections; A4b/C2-precision findings routed. |
| RC1 Alembic docs & stale artifacts | Alembic | 5decbd7 (+655403fe scratch archive) | rev 6, completed | AGENTS.md matches real lib/ tree; `_slimSearchItem` deleted; 9 scratch decisions archived to ledger (SHA-256 checked); 1206 tests + lints green. |
| RC2 Core headless boundary | AlembicCore | ed42960 (amended hash of 97c454cf, same tree) | rev 6, completed | Interactive `promptDiscovererChoice` + readline deleted (zero consumers); deterministic prune counter; migration-gap verdict in-tree; 1048 tests + boundary/smoke + downstream builds green. |
| RC3 Agent hygiene & boundary configs | AlembicAgent | dc6d6f7 | rev 6, completed | Probe import fixed; referenceLimits from real scan + limit-0 denies (demonstrated FAIL); computed expectedCounts (demonstrated FAIL); V1 retirement register; MemoryStore ownership note; 197 tests + pack-preview green. |
| RC4 Plugin docs, legacy governance & routes | AlembicPlugin | be10c80 + 7382c62 | rev 6, completed | Plugin-scoped README; legacy register (1 removed-now, 3 deadline-marked); 8/9 routes deleted with fresh scans; auth RECLASSIFIED keep-with-consumer (RC0 verdict falsified, matrix corrected); scratch 4.4GB→9.5MB; vendor flow documented; full gate + MCP samples green. |
| RC5 shared-asset single-source & drift gate | Alembic + AlembicPlugin (producer/consumer) | 7a63e7b + 41ee2a7 | rev 10, completed | Authority manifest (9 assets); 4 SKILL.md shared-core + host-overlay (tool contracts intentionally divergent); STRICT drift gate green from both repos with injected-drift FAIL demos; byte-identical script/manifest copies; skill-delivery MCP samples byte-identical. |
| RC6 structural-debt decision gate | Design (+controller decisions) | — (design only) | rev 6, completed | Seven re-verified design notes; controller decision register (all ACCEPT of lowest-risk routes): `rc6-structural-debt-decisions-2026-06-12.md` + `structural-debt-candidates/`. Two audit premises corrected (SD-2 automation/submodule; SD-1 dup mass ≈16.6k). Future demands need user confirmation. |
| RC7 final acceptance & archive | Alembic (p1) + AlembicWorkspace (p2) | 1bd60af | this demand | p1: DynamicComposer root-cause (intentional D23 contract masked by stale linked dist; pins updated, zero production code) + strict-gate flag removal; p2: final gate sweep + this archive. |

Event-level acceptance records live in each state root's `controller-events.jsonl`
under `.wakeflow-active/current/alembic-redundancy-stale-logic-cleanup-*/`.

## Final Gate Sweep (RC7 p2, raw logs in the RC7 state root `evidence/raw/`)

| Gate | Result | Evidence |
| --- | --- | --- |
| Alembic: build + 1206/1206 unit + check chain (typecheck, biome, agent-extraction, core-import, STRICT drift gate) | GREEN (final commit 1bd60af) | `rc7-p1-build-green.txt`, `rc7-p1-test-unit-full.txt`, `rc7-p1-check-strict-green.txt` + controller re-runs (DynamicComposer 10/10, strict gate exit 0) |
| AlembicCore: vitest + public-api boundary (18/24/98, no-growth) + release-readiness (clean tree, pack 808 entries) + smoke (79 entrypoints) | GREEN, all exit 0 | `rc7-p2-core-gate.txt` |
| AlembicAgent: check chain (197/197) + release:pack-preview (431 entries) | GREEN, all exit 0 | `rc7-p2-agent-gate.txt` |
| AlembicPlugin: full gate on SEQUENCE-FINAL commit 41ee2a7 | GREEN at RC5 p2 (vitest 2433/2433, lint-repo-boundary 0/75, smoke, strict drift gate, MCP skill samples; controller re-ran gates at acceptance) | RC5 state root `evidence/raw/rc5-p2-*` |
| AlembicPlugin sweep-time note | The sweep-time tree was 01a7278 — a CKG-sequence commit (`ckg1-plugin-onboarding-contract`, codex host, in flight) landed AFTER RC5 acceptance. 2 onboarding-status unit tests fail on 01a7278; attribution + ownership recorded (TODO `CKG1-ONBOARDING-STATUS-TESTS-RED`, RC7 t3 blocked-withdrawn record). Strict drift gate remained green 11/11 even on 01a7278. Out of this sequence's scope. | `rc7-p2-plugin-gate.txt`, `rc7-p2-plugin-vitest-solo-rerun.txt` |
| AlembicDashboard: npm run check + ZERO CODE DIFF | GREEN; `git status` empty (status-line-count=0) — zero code diff for the whole sequence | `rc7-p2-dashboard-gate.txt` |
| Shared-asset drift gate, both sides | GREEN strict (0 drift, 0 pending-sync) from Alembic and from AlembicPlugin | `rc7-p1-check-strict-green.txt`, `rc7-p2-plugin-gate.txt` |

## Regression Spot-Checks (user-visible touchpoints)

1. Discovery confirmation (RC2): `promptDiscovererChoice` 0 occurrences in Core
   src; `detectConflict`/`loadPreference`/`savePreference` intact; readline 0.
   Host layer owns confirmed choices, persistence preserved.
2. Plugin skills delivery (RC5): real MCP `alembic_project_skill` list/load
   delivered all 4 skills with `matchesRepoFile=true` and
   `carriesSharedMarkers=true` (RC5 `rc5-p2-skill-delivery-mcp-samples.json`).
3. Plugin direct-call compatibility (RC4): clean-output final-cleanup probe
   issues=0; error-taxonomy probe ok (28 calls, 14 failureKinds)
   (RC4 `rc4-probe-*.txt/json`).

## Audit Closure

Every audit item carries a final disposition:
[audit-findings-2026-06-11.md](audit-findings-2026-06-11.md) §9 "Final
Dispositions" (fixed-RCn / kept-with-reason / escalated-to-SD-x; includes the
RC4 auth-reclassification and the RC7 D23 regression resolution).

## Structural Follow-Ups (decided, NOT started)

`rc6-structural-debt-decisions-2026-06-12.md`: SD-1 lib/ drift-gate extension,
SD-2 dashboard build-on-release wiring, SD-3 V1→V2 convergence, SD-4 MemoryStore
tripwire, SD-5 transitional-export closeout, SD-6 observability policy entry,
R-1 evolution/panorama deadline-marked keep. Each becomes its own demand and
requires user confirmation before dispatch.

## Incidents & Process Lessons (recorded for Wakeflow governance)

1. RC3 lost send: a pasted prompt that never submitted passed an echo-only
   readback; window relaunch discarded the draft. Standard raised: send
   readback must show submitted message + empty composer + active processing.
2. RC0 auth zero-consumer verdict falsified at RC4: scans must include dynamic
   `import(` forms and HTTP path literals across all five repos.
3. D23 masked contract change: `file:`-linked sibling dist staleness can mask
   upstream contract changes; rebuild sibling dist before acceptance runs that
   follow sibling commits.
4. Pipe-masked exit codes (`cmd | tail; $?`) hid a real red gate twice; always
   capture the command's own exit status.
5. Cross-host concurrency: the per-window delivery lock correctly blocked a
   collision with the codex-host CKG sequence; out-of-sequence commits landing
   mid-acceptance must be attributed, owned, and excluded explicitly (RC7 t3).
6. `wakeflow_record_delivery` MCP surface lacks a retry run id parameter
   (governance backlog, found at the RC3 re-send).

## TODO Roll at Closure

Closed: `RC-DYNAMICCOMPOSER-ENVELOPE-PROJECTION-REGRESSION` (RC7 p1),
`RC5-MAIN-CHECK-DROP-PENDING-SYNC-FLAG` (RC7 p1). Opened:
`CKG1-ONBOARDING-STATUS-TESTS-RED` (cross-controller observation, owner = CKG
sequence controller). Pre-existing unrelated rows untouched.
