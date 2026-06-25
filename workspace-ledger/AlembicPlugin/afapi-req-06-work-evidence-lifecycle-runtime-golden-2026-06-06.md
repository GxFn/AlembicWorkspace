# AFAPI REQ-06 Work Evidence Lifecycle Runtime Golden

Generated: 2026-06-06

## Window And Scope

- Current window: AlembicPlugin execution window.
- Task id: AFAPI-REQ-06-WORK-EVIDENCE-LIFECYCLE-RUNTIME-GOLDEN-T2.
- Dispatch group: AFAPI-REQ-06-WORK-EVIDENCE-LIFECYCLE-RUNTIME-GOLDEN-GROUP.
- State root: `.wakeflow-active/current/afapi-req-06-work-evidence-lifecycle`.
- Scope: AlembicPlugin Codex MCP public `alembic_work_start` / `alembic_work_finish`, active public tool surface, embedded runtime artifact, installed-cache readback, and Codex host adaptation.
- Explicit non-scope: no durable work ledger/store was implemented, no cross-repo migration was made, and no Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest responsibility was claimed.

## Result

T2 found and fixed a runtime-golden gap: public `alembic_work_start` could create a workRef for status-only, raw automation, and design/read-only inputs when a query/title was present. The handler now only creates work when there is explicit work scope (`title`, `workScope`, `activeFile`) or the lifecycle policy classifies the turn as a task-anchor-creating code task. Raw automation envelopes still skip before scope evaluation, and status-only turns skip before workRef creation.

`alembic_work_finish` runtime behavior is unchanged and verified: valid same-session workRef returns `finishRef`, `changedFiles`, `evidenceRefs`, `outcome`, `detailRefs`, and a scoped `guardRecommendation`; missing/fake/stale workRef blocks with `missing-work-ref`; `work_finish` does not run Guard or return `guardResultRef`.

## Commits

- AlembicPlugin parent: `3947701274cb6f23902a04e1cc3271878d4f142e`
- Embedded runtime subrepo: `1635e6a0afac8355f15af673254f0f6373564ab2`
- Runtime tarball SHA-256: `8b0ce2b004a70ad0c5e70a57cf2528424ac9bd4a6c731b4ad0817e91bd418777`

## Changed Files

AlembicPlugin parent:

- `lib/codex/mcp/handlers/agent-public-tools.ts`
- `test/unit/AgentPublicToolsEvaluation.test.ts`
- `plugins/alembic-codex` submodule pointer

Embedded runtime subrepo:

- `runtime/dist/lib/codex/mcp/handlers/agent-public-tools.js`
- `runtime.tgz`

## Runtime JSON Evidence

Repo-relative report paths:

- `AlembicPlugin/scratch/afapi-req-06-work-lifecycle-runtime-golden-report.json`
  - Installed-cache/local-dev MCP readback.
  - `ok=true`.
  - Assertions true for legacy task hidden, no-work/status/raw automation/design-readonly skip, fake/missing/stale workRef blockers, same-session start/finish ready, finish evidence fields, scoped Guard recommendation, no auto Guard, process-local non-durable boundary, and no public work_finish auto-evolution trigger.
- `AlembicPlugin/scratch/afapi-req-06-work-lifecycle-packaged-golden-report.json`
  - Packaged wrapper / `runtime.tgz` MCP readback through `plugins/alembic-codex`.
  - `ok=true` with the same assertion set.
- `AlembicPlugin/scratch/afapi-req-06-dev-reload-report.json`
  - `npm run dev:codex-plugin:reload` readback.
  - `ok=true`; build, prepare runtime, installed-cache sync, and fresh MCP status probe passed.
- `AlembicPlugin/scratch/afapi-req-06-dev-reload-probe-report.json`
  - Fresh installed-cache MCP status probe after reload.
  - `ok=true`.
- `AlembicPlugin/scratch/afapi-req-06-existing-public-tools-readback.json`
  - Pre-fix baseline installed-cache public tools readback.
  - `ok=true` for existing general public tool flow, but it did not cover the T2 negative work_start cases.

## Verification Commands

All commands were run from `AlembicPlugin` unless noted.

```bash
node scripts/probe-agent-public-tools-evaluation.mjs --report-path scratch/afapi-req-06-existing-public-tools-readback.json --mcp-timeout-ms 45000
```

Result: passed before the T2 fix for the existing general public tools flow; this exposed that a narrower REQ-06 runtime probe was still needed.

```bash
node scratch/afapi-req-06-work-lifecycle-runtime-golden-probe.mjs --report-path scratch/afapi-req-06-work-lifecycle-runtime-golden-report.json --mcp-timeout-ms 45000
```

First run result: failed before the fix. The report showed `work_start` created workRefs for status-only, raw automation, and design/read-only inputs.

Final result: passed after the fix. Installed-cache/local-dev MCP readback returned `ok=true`.

```bash
node scratch/afapi-req-06-work-lifecycle-runtime-golden-probe.mjs --target-root plugins/alembic-codex --report-path scratch/afapi-req-06-work-lifecycle-packaged-golden-report.json --mcp-timeout-ms 45000
```

Result: passed. Packaged wrapper / `runtime.tgz` MCP readback returned `ok=true`.

```bash
npm run test:unit -- test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsContract.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts test/unit/CodexMcpServer.test.ts
```

Result: passed. 5 files / 74 tests passed.

```bash
npm run dev:codex-plugin:reload -- --report-path scratch/afapi-req-06-dev-reload-report.json --probe-report-path scratch/afapi-req-06-dev-reload-probe-report.json --mcp-timeout-ms 45000
```

Result: passed. Build, runtime prepare, installed-cache sync, and fresh MCP probe passed.

```bash
npm run build:check
npm run verify:codex-plugin
npm run lint:repo-boundary
npm run lint -- --diagnostic-level=error
git diff --check
git -C plugins/alembic-codex diff --check
```

Result: all passed.

Post-commit status:

```bash
git status --short
git -C plugins/alembic-codex status --short
```

Result: both returned empty output.

## Runtime Golden Assertions

- `alembic_task` is hidden from active `tools/list` before and after calls.
- Active public descriptions include `Non-goal:` and do not expose legacy primary wording.
- no-work / status-only / raw automation / design-read-only `alembic_work_start` inputs skip without `workRef`.
- missing / fake / stale cross-process workRefs block `alembic_work_finish` with `missing-work-ref`.
- valid same-session `alembic_work_start` -> `alembic_work_finish` returns ready envelopes with `workRef` and `finishRef`.
- `work_finish` returns `changedFiles`, `evidenceRefs`, `outcome`, `detailRefs`, `finishRef`, and scoped `guardRecommendation`.
- `guardRecommendation.tool = alembic_code_guard` and explicit files are scoped to the changed source file.
- `work_finish` does not run Guard: no `guardResultRef` is returned.
- stale cross-process finish blocks, proving current workRef is process-local. No durable store claim was made.
- public `work_finish` does not auto-trigger opportunistic evolution or decision recording.

## Risks And Next Suggestions

- Current workRef remains process-local by design. If durable lifecycle history is required later, it needs a separate store-backed design and producer/consumer acceptance.
- The T2 scratch probe is evidence-only and remains in ignored `scratch/`; if this scenario needs permanent CI coverage, promote the probe or an equivalent test harness into tracked `scripts/` or `test/` in a later task.
- Installed-cache reload used local-dev direct dist mode; packaged wrapper readback separately verified `plugins/alembic-codex` and `runtime.tgz`.
