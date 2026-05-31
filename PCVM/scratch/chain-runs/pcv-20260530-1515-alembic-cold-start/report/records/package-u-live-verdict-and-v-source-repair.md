# Package U Live Verdict And Package V Source Repair

Run ID: `pcv-20260530-1515-alembic-cold-start`
Owner: `PCVM`
Status: `partial(scope=live-ai-local, package=U); repaired(scope=source-unit, package=V); superseded-by-package-w-live-verdict`

## User Correction

The user clarified that LLM input/output optimization is not stopped and has not reached the final goal. Any prior `stopped-by-user` PCVM status for this LLM token run is invalid for the active mainline.

## Package U Evidence Read

Raw Package U route:

- Raw dir: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-u-same-input-live-rerun-2026-05-31`
- Events: `events.json`
- Timeline: `timeline.json`
- Job/session from events: `bootstrap_mptvdbij_f1710a27` / `bs_1780237377715_cigear`
- Job artifacts: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/job-artifacts/bootstrap_mptvdbij_f1710a27`
- Candidate files: `/Users/gaoxuefeng/.asd/workspaces/02a25032/Alembic/candidates/design-patterns/*.md`

Important artifact note:

- `timeline.json` has `ok:false`, `enqueue:null`, and `finalJob:null`, so the timeline probe did not capture the job lifecycle.
- `events.json` is the authoritative retained live evidence here: it contains `86` retained events and ends with `Bootstrap job completed`.

Package U raw metrics:

| Metric | Package U |
| --- | --- |
| retained events | `86` |
| analyze inputs / outputs | `15` / `15` |
| produce inputs / outputs | `15` / `15` |
| created candidates | `6` |
| input / output / reasoning tokens | `275108` / `23987` / `6044` |
| total model tokens | `305139` |
| total model tokens / created Recipe | `50856.50` |
| tool calls | `62` |
| QualityGate total score | `99` |

Compared with Package S:

- Total model tokens regressed from `275450` to `305139` (`+29689`, `+10.78%`).
- Input tokens regressed from `246703` to `275108` (`+28405`, `+11.51%`).
- Output tokens regressed from `22825` to `23987` (`+1162`, `+5.09%`).
- Reasoning tokens regressed from `5922` to `6044` (`+122`, `+2.06%`).
- Producer rounds regressed from `7` input/output pairs to `15` input/output pairs.

Package U fixed parts:

- Producer no longer selected `knowledge.detail` or `knowledge.manage`.
- Producer final summaries did not claim stored candidates had partial fields after all six were created.
- The runtime submit ledger and compacted `payloadSummary` were visible in Producer inputs.

Package U remaining failures:

- Provider-visible tool descriptions still leaked broad words: `Knowledge management: search, submit, detail, manage` and `Agent self-reflection: tool schema queries, planning, review`, even though `action.enum` was narrowed.
- `knowledge.submit` provider schema still exposed `params` as a generic object with only a natural-language description of required fields.
- Producer generated one invalid empty `knowledge` call and one `knowledge.submit` missing `description`; the latter was rejected with `Missing required param "description" for knowledge.submit`.
- Producer spent the first three produce rounds on `17` `code.read` calls before creating any candidate, which violates the intended Analyst/Producer responsibility split.
- Producer produced a correct completion-like summary at iteration `13`, then received a continue nudge, called `meta.review` at iteration `14`, and emitted a second final summary at iteration `15`.

Verdict:

- Package U is `partial(scope=live-ai-local)`.
- Package T's action-enum and submit-ledger fixes helped, but the route is not a pass because the primary token efficiency target regressed and Producer responsibility remains mixed.
- This is not random variance: the raw artifacts show deterministic source-contract causes.

## Package V Source Repair

Implemented in `AlembicAgent` after reading Package U evidence.

Source changes:

- `src/tools/v2/registry.ts`
  - Single-action tool projections now use the real action parameter schema for `params`, instead of a generic object plus descriptive text.
  - Restricted provider descriptions now describe only the allowed actions, so narrowed `knowledge.submit` no longer exposes `detail/manage/search` wording.
- `src/tools/v2/capabilities/BootstrapProduce.ts`
  - Removed `code.read` from bootstrap Producer allowed tools.
  - Reworded Producer capability text so Analyst owns evidence retrieval and Producer owns formatting/submission.
- `src/agent/prompts/insight-producer.ts`
  - Removed Producer `code.read` guidance.
  - Clarified that missing snippets should use Analyst evidence/summary or be reported as a blocker, not trigger source rereads.
- `src/agent/runtime/LLMInputAssembly.ts`
  - Runtime stage policy/tool contract now says Producer must not read source files or explore.
- `src/agent/context/ExplorationTracker.ts`
  - Recognizes Package U wording such as `所有 6 个结构化发现已全部提交完毕，无需继续` as terminal after target submits.

Verification:

- `npm test -- test/tool-v2-contract.test.ts test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts` passed `39` tests.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed `178` tests across `28` files.
- `npm run lint:core-import-boundary` passed.
- `git diff --check` passed.

Next live gate:

- Superseded by Package W live verdict. This section is historical Package U/V evidence, not the current blocker.
- Package W same-input live rerun verified Package V visible tool-contract effects and exposed the next source issue now tracked in `package-w-live-verdict-and-x-source-repair.md`.
- Package W consumed these requested checks:
  - Producer tool schemas expose `knowledge.submit` with real required params and no broad `detail/manage/search` description.
  - Producer provider-visible schema no longer exposes `code`.
  - Producer has no pre-submit code-read rounds.
  - No missing-`description` rejects.
  - Completion at `6/6` stops without meta.review or a second final summary.
  - Route total model tokens and per created Recipe tokens improve versus Package U and should recover below Package S.
