# P3 AppRuntime Rename Controller Review

Date: 2026-06-28
Controller window: AlembicWorkspace
Dispatch group: p3-appruntime-rename-p1
Target task: p3-appruntime-rename-t1
Target window: Alembic

## Reviewed Target Result

- Target result envelope: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p3-appruntime-rename-t1.json`
- Alembic commit reviewed: `d1a5bc6ddd6f9813fd7bec016761ff62581c9724`
- Commit subject: `refactor: rename app runtime bootstrap class`
- Worktree status after review: `## main...origin/main [ahead 1]`

Changed files from `git show --stat --name-status --oneline HEAD`:

```text
d1a5bc6 refactor: rename app runtime bootstrap class
M	bin/api-server.ts
M	bin/cli.ts
M	bin/daemon-server.ts
M	lib/Bootstrap.ts
M	lib/cli/SetupService.ts
M	test/fixtures/factory.ts
M	test/integration/BootstrapLifecycle.test.ts
M	test/integration/FullFlow.test.ts
M	test/integration/HttpApi.test.ts
M	test/integration/TaskGuardApi.test.ts
```

## Code Evidence

Positive AppRuntime anchors from `rg -n "export class AppRuntime|export default AppRuntime|export \{ AppRuntime as Bootstrap \}|new AppRuntime|AppRuntime\.configurePathGuard|import .*AppRuntime|type .*AppRuntime" bin lib test`:

```text
bin/daemon-server.ts:18:import AppRuntime from '../lib/Bootstrap.js';
bin/daemon-server.ts:36:type WorkspaceResolver = Awaited<ReturnType<AppRuntime['initialize']>>['workspaceResolver'];
bin/daemon-server.ts:71:  AppRuntime.configurePathGuard(projectRoot);
bin/daemon-server.ts:73:  const appRuntime = new AppRuntime({ env: process.env.NODE_ENV || 'development' });
bin/cli.ts:2096:  const appRuntime = new AppRuntime();
bin/cli.ts:2117:  AppRuntime.configurePathGuard(projectRoot);
bin/api-server.ts:12:import AppRuntime from '../lib/Bootstrap.js';
bin/api-server.ts:56:    AppRuntime.configurePathGuard(projectRoot);
bin/api-server.ts:59:    const appRuntime = new AppRuntime({ env: process.env.NODE_ENV || 'development' });
test/fixtures/factory.ts:31:  const appRuntime = new AppRuntime({ env: 'test' });
lib/Bootstrap.ts:37:export class AppRuntime {
lib/Bootstrap.ts:94:        AppRuntime.configurePathGuard(projectRoot);
lib/Bootstrap.ts:260:export { AppRuntime as Bootstrap };
lib/Bootstrap.ts:261:export default AppRuntime;
lib/cli/SetupService.ts:564:      AppRuntime.configurePathGuard(this.projectRoot, this.resolver?.knowledgeBaseDir);
lib/cli/SetupService.ts:570:      appRuntime = new AppRuntime({ env });
test/integration/BootstrapLifecycle.test.ts:70:      const b1 = new AppRuntime({ env: 'test' });
test/integration/BootstrapLifecycle.test.ts:76:      const b2 = new AppRuntime({ env: 'test' });
test/integration/BootstrapLifecycle.test.ts:98:        AppRuntime.configurePathGuard('/tmp/test-project');
test/integration/BootstrapLifecycle.test.ts:105:        AppRuntime.configurePathGuard('/tmp/test-project', 'Alembic');
test/integration/HttpApi.test.ts:19:import AppRuntime from '../../lib/Bootstrap.js';
test/integration/HttpApi.test.ts:33:    appRuntime = new AppRuntime({ env: 'test' });
test/integration/TaskGuardApi.test.ts:9:import AppRuntime from '../../lib/Bootstrap.js';
test/integration/TaskGuardApi.test.ts:31:    appRuntime = new AppRuntime({ env: 'test' });
test/integration/FullFlow.test.ts:1:import AppRuntime from '../../lib/Bootstrap.js';
test/integration/FullFlow.test.ts:8:    appRuntime = new AppRuntime({ env: 'test' });
```

Narrow old-class consumer scan:

Command:

```text
rg -n "import \{?\s*Bootstrap\b|import type \{?\s*Bootstrap\b|new Bootstrap\(|Bootstrap\.configurePathGuard\(|ReturnType<Bootstrap|: Bootstrap\b|as Bootstrap\b" bin lib test
```

Result:

```text
test/integration/GoSupport.test.ts:125:// L6: Bootstrap Go Conditional Dimension
test/integration/GoSupport.test.ts:127:describe('L6: Bootstrap go-module-scan dimension', () => {
lib/Bootstrap.ts:260:export { AppRuntime as Bootstrap };
test/integration/BootstrapLifecycle.test.ts:13:describe('Integration: Bootstrap Lifecycle', () => {
```

Controller interpretation: no remaining old app-runtime class construction, static use, or type use was found. The remaining `Bootstrap` hits are the required compatibility alias, test labels, or unrelated domain vocabulary outside P3.

Frozen-literal diff scan:

Command:

```text
git show --format= --unified=0 HEAD -- bin lib test | rg -n "alembic_bootstrap|alembic_rescan|alembic_dimension_complete|coverage_ledger|PlanStageId|deepMining|moduleMining|coldStart|response\.tool|jobKind|job kind|source:"
```

Result: no output.

Controller interpretation: the P3 diff did not touch the sampled frozen job/tool/source/stage/coverage literals from the P2 register.

## Controller Validation Reruns

Commands rerun in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`:

```text
npm run build:check
npm run lint:repo-boundary
npx vitest run test/integration/BootstrapLifecycle.test.ts
git diff --check
npm run lint
```

Observed results:

- `npm run build:check`: exit 0; output confirmed `Using local AlembicCore source: ../AlembicCore`.
- `npm run lint:repo-boundary`: exit 0; repository boundary check passed; `@escape-hatch count: 1 / 75 threshold`.
- `npx vitest run test/integration/BootstrapLifecycle.test.ts`: exit 0; 1 file passed, 8 tests passed.
- `git diff --check`: exit 0; no output.
- `npm run lint`: exit 0; 5 existing `noExplicitAny` warnings reported in `lib/service/handler-runtime/types.ts` and `lib/workflows/ai-execution/AgentRunProjections.ts`.

## Review Notes

- The file path remains `lib/Bootstrap.ts`, and imports still use that stable path. This matches P3 scope: class naming is updated while path/API compatibility remains.
- `export { AppRuntime as Bootstrap }` is present to preserve named compatibility.
- Controller review found no product-code blocker in P3 evidence.
- Target's `alembic_code_guard` attempts failed with tool schema error `unrecognized key "data"`; this is recorded as tool-surface risk, not as product validation failure.
