# PCVM Issue Records: Tool And Terminal Usage Baseline

Run ID: `pcv-20260531-1506-tool-terminal-usage-baseline`
Owner: `PCVM`
Status: `current`

## Window Boundary

Current responsibility window: `PCVM-Tool-Optimization`

Boundary risks:

| Risk | Handling |
| --- | --- |
| Tool optimization drifts into LLM token implementation. | Keep Package F/G/H in the LLM run; this window only measures tool/terminal usage and proposes tool optimization. |
| Tool metrics become pseudo-progress without raw telemetry. | Use only the AlembicTest controlled ledger for scoped sample values; keep historical/all-session telemetry unavailable. |
| Lower command/tool count weakens verification. | Evidence quality and verification sufficiency remain quality constraints. |

## Current Blocker

Primary blocker:

- `historical-all-session-baseline`: AlembicTest produced a scoped controlled action ledger and the immediate controlled-ledger defects have an AlembicTest helper fix, but historical/all-session Codex telemetry remains unavailable.

Impact:

- Scoped numeric baseline values and optimization directions are valid only for `controlled-current-turn-ledger`.
- Historical baseline values remain blocked.
- Optimization must not claim global usage improvement until a broader raw evidence source exists.

Correct next action:

- Use the selected controlled-ledger directions on the next real PCVM Tool/Terminal task, and compare before/after without weakening evidence quality.

## Current Issues

| Issue | Evidence | Handling |
| --- | --- | --- |
| No complete historical Codex transcript/export path | AlembicTest `telemetry-source-map.json`; `baseline-metrics.json` evidenceMissingCount includes this gap | Do not call this an all-history baseline. Use controlled ledger unless/until a proper export source is available. |
| App terminal source unavailable | `read_thread_terminal` returned no attached app terminal | Do not depend on app terminal for PCVM baseline. |
| `order` vs `timestamp` field mismatch | `baseline-actions.json` has `order`; strict `timestamp` key check misses all 15 rows | Fixed for future controlled ledgers by `AlembicTest/scripts/tool-terminal-baseline.mjs`, which writes concrete `timestamp` plus `timestampMode`. |
| Output noise incident | Broad AlembicTest tmp inventory produced truncated/noisy output | Partially fixed for controlled baseline reporting: new script consumes explicit paths and does not broad-scan tmp. Future manual probes still need bounded globs. |
| File placement mismatch | Action `A10` wrote files under parent workspace; `A11` verification failed; `A13`/`A14` corrected placement | Fixed for generated baseline outputs: new script rejects `--out-dir` / `--report` outside AlembicTest and was verified with no parent workspace output. |
| Residual empty parent tmp directory | Parent misplaced files are gone, but `/Users/gaoxuefeng/Documents/AlembicWorkspace/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/` remains empty | Not a product/source issue. Record as cleanup residue; do not run destructive cleanup without explicit need. |

## Selected Optimization Directions

| Rank | Direction | Target Metric |
| ---: | --- | --- |
| 1 | Use absolute or explicit path-prefixed file targets for generated evidence/report writes, then verify expected paths immediately. | `filePlacementMismatchCount 1 -> 0`; placement-caused failure `0` |
| 2 | Replace broad artifact inventory reads with narrowed globs or count summaries before expansion. | `outputNoiseIncidents 1 -> 0` |
| 3 | Keep controlled action ledger as the near-term canonical source while historical transcript export is absent. | `baselineCoverage=1.0` with explicit `order`/timestamp semantics |
| 4 | Preserve parallel read batching only for bounded independent reads with clear evidence refs. | `parallelReadRatio >= 0.7` without output-noise increase |
| 5 | Preserve authorization boundaries. | `externalCallCount=0`, `sessionLeakCount=0`, `workdirMismatchCount=0` unless explicitly authorized |

## Repair Status

| Item | Status |
| --- | --- |
| Controlled ledger timestamp normalization | fixed in AlembicTest helper |
| Generated evidence/report path placement | fixed in AlembicTest helper |
| Metric recomputation from ledger | fixed in AlembicTest helper |
| Broad ad hoc inventory commands | partially mitigated by using explicit action/source-map inputs; still a manual discipline issue outside this helper |
| Historical all-session telemetry | still blocked |

## Risks

| Risk | Handling |
| --- | --- |
| Counting only visible recent actions may bias the baseline. | Mark evidence scope explicitly and avoid broad conclusions. |
| Shell history may lack tool calls, workdir, command result, or purpose. | Use shell history only as diagnostic evidence, not as full baseline unless supplemented. |
| Transcript or app telemetry may include sensitive unrelated content. | Read only scoped local evidence needed for this PCVM run and record blind spots. |
| Optimization may reduce verification quality. | Keep evidence quality and boundary safety as constraints. |
| File write tools may not honor terminal `workdir` expectations. | Use absolute paths for cross-repo evidence writes and verify path placement immediately. |
