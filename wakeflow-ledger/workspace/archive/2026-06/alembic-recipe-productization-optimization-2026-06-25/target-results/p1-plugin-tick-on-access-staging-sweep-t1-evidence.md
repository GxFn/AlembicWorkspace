# p1-plugin-tick-on-access-staging-sweep-t1 evidence

## Scope

- Window: AlembicPlugin
- Task: p1-plugin-tick-on-access-staging-sweep-t1
- Dispatch group: p1-plugin-tick-on-access-staging-sweep-p1
- Upstream Core evidence reviewed: `tr-p1-core-staging-lifecycle-t1.json`
- Core interface used: `StagingManager.checkAndPromote()` with `LifecycleStateMachine.transition(...)`

## Implementation

- `lib/injection/modules/KnowledgeModule.ts`
  - Injects `lifecycleStateMachine` into `StagingManager`.
- `lib/runtime/mcp/host/staging-access-sweep.ts`
  - Adds daemon-less tick-on-access sweep helper.
  - Enabled tools: `alembic_submit_knowledge`, `alembic_dimension_complete`, `alembic_status`, `alembic_rescan`.
  - Per-project in-memory throttle, in-flight dedupe, timeout-bound result, non-throwing failure path.
- `lib/runtime/mcp/host/embedded-executor.ts`
  - Adds `withPluginOwnedContainer(...)` so Host can reuse the Plugin-owned MCP container without daemon bridging.
- `lib/runtime/mcp/HostMcpServer.ts`
  - Runs sweep before enabled tool dispatch when the workspace is initialized.
  - Skips `alembic_status` when `aspect === "runtime"` so runtime-control diagnostics remain read-only.
- `test/unit/StagingAccessSweep.test.ts`
  - Covers enabled tool set and throttle behavior.
- `test/unit/HostMcpServer.test.ts`
  - Covers default `alembic_status` access promoting due auto-approvable staging Recipe through DB lifecycle event persistence.

## Validation

- `npx biome check lib/runtime/mcp/host/staging-access-sweep.ts lib/runtime/mcp/HostMcpServer.ts lib/runtime/mcp/host/embedded-executor.ts lib/injection/modules/KnowledgeModule.ts test/unit/HostMcpServer.test.ts test/unit/StagingAccessSweep.test.ts`
  - Passed: `Checked 6 files ... No fixes applied.`
- `npm run build:check`
  - Passed.
  - Core build evidence: `Core build used ../AlembicCore @ 777c5b795784aa41bb80845dee3f9cd9ef9c60c1.`
- `git diff --check`
  - Passed.
- `npx vitest run --config vitest.unit.config.ts test/unit/StagingAccessSweep.test.ts test/unit/HostMcpServer.test.ts -t "StagingAccessSweep|status access runs daemon-less staging sweep|Codex host-agent bootstrap runs in the Plugin without the daemon MCP bridge|Codex bootstrap job runs in-process via local JobStore without the daemon|status recommends bootstrap after initialization|status inspects workspace and daemon state without ensuring daemon startup|Codex job status reads local JobStore without starting daemon"`
  - Passed: 2 files, 8 tests passed, 38 skipped.
  - Raw behavior asserted:
    - `p1-due-auto`: `staging -> active`, `publishedBy = "StagingManager"`, `staging_deadline = null`.
    - `p1-due-manual`: remains `staging`.
    - `p1-future-auto`: remains `staging`.
    - `lifecycle_transition_events`: one event for `p1-due-auto`, `trigger = "grace-period-expire"`, `operator_id = "StagingManager"`.
- `alembic_code_guard`
  - Attempted twice with explicit changed files.
  - Blocked by Guard tool internal/schema error, not by reported code findings:
    - `CODEX_MCP_ERROR`
    - `unrecognized key: "data"`

## Residual Test Notes

- Full `test/unit/HostMcpServer.test.ts test/unit/StagingAccessSweep.test.ts` was attempted and failed in unrelated existing Host expectations:
  - visible tool lists now include `alembic_plan`;
  - ProjectScope prime fixture hits current input validation;
  - runtime-control sourceOfTruth expectation remains null in the current implementation;
  - search structuredContent/project and resident job-status expectations are stale against current Host behavior.
- Focused P1 coverage and `build:check` are green.

## Commit

- AlembicPlugin commit: `0bea3c0`
