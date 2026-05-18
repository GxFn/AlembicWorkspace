# Alembic Terminal Sandbox Agent Tool Boundary Wave 5 Plan

日期：2026-05-17
总控窗口：AlembicWorkspace
状态：已完成

本文承接 `docs/workspace/alembic-agent-cutover-plugin-cleanup-wave-4-deletion-plan-2026-05-17.md`。Wave 4 已完成：`Alembic` 删除本地 `lib/agent/**`、generic Tool V2 duplicate、tool core/catalog/workflow duplicate，只保留 `ToolContextFactory` 和 host adapters。下一波不继续扩大删除面，而是专门处理 terminal/sandbox 的 Agent tool 边界。

## 1. Wave 4 验收结论

| 窗口 | 结论 | 证据 |
| --- | --- | --- |
| `Alembic` | 已完成 | 提交 `6abf1321b39b31a4a33c59b4d357d7f1e191cf39`；`lib/agent` 不存在；`lib/tools/v2` 只剩 `adapter/ToolContextFactory.ts`；边界 lint 通过。 |
| `AlembicAgent` | 观察中 | Wave 4 未触发新增 contract。 |
| `AlembicPlugin` | 已完成 | 保持 agent / tool / local AI runtime 清理完成状态。 |
| `AlembicDashboard` | 观察中 | Wave 4 未发现 API/UI 变更。 |
| `AlembicCore` | 观察中 | Wave 4 未发现 Core 缺口。 |

总控复验已跑：

```text
git -C Alembic status --short
git -C Alembic log -3 --oneline
rg -n "#agent/|\.\./agent/|\.\./\.\./agent/|lib/agent/" lib bin scripts test --glob '*.ts' --glob '*.js' --glob '*.mjs'
rg --files lib/agent
rg --files lib/tools/v2
npm run lint:agent-extraction-boundary
npm run build:check
npm run test:unit -- test/unit/AgentModuleBoundaries.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentTaskHandlers.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/AgentService.test.ts test/unit/AgentRuntime.test.ts test/unit/MemorySystem.test.ts
npm run check
npm run build
node dist/bin/cli.js status --json
```

关键结果：

- `Alembic` 工作树干净。
- `local Agent relative imports: 0`。
- `preserved local Agent files: 0`。
- `duplicate generic Tool V2 files: 0`。
- `duplicate generic tool core/catalog/workflow files: 0`。
- targeted 7 个 test files、177 个 tests 通过。
- `npm run check`、`npm run build`、CLI status smoke 通过。

## 2. 下一波问题定义

Wave 4 复验时，`npm run lint:agent-extraction-boundary` 仍显示 terminal 相关文件被分类保留：

```text
agent-common-terminal-adapter: 1
agent-common-terminal-capabilities: 4
agent-common-terminal-execution: 12
agent-common-terminal-policy: 6
agent-common-terminal-session: 2
```

这个结果不阻塞 Wave 4，因为 Wave 4 的目标是删除本地 Agent runtime 和 generic Tool V2 duplicate。但 terminal 不应长期全部归为 Alembic host adapter。正确边界是：

- `AlembicAgent` 拥有 terminal 作为 Agent tool 的 portable contract。
- `Alembic` 拥有真实终端执行、PTY、macOS Seatbelt sandbox、approval、audit、artifact、session storage 和 DI wiring。

已读到的代码事实：

- `AlembicAgent/src/tools/v2/handlers/terminal.ts` 已有 `terminal.exec` V2 handler，并通过 `ToolContext.sandboxExecutor` 接受宿主注入。
- `AlembicAgent/src/tools/v2/registry.ts` 已把 terminal 注册为 V2 tool。
- `AlembicAgent/src/agent/forge/SandboxRunner.ts` 是 Agent-owned 生成工具验证沙箱，和 OS 级终端 sandbox 不是同一层。
- `Alembic/lib/tools/adapters/terminal-capabilities/**` 定义 `terminal_run`、`terminal_script`、`terminal_shell`、`terminal_pty`、terminal session capability manifests。
- `Alembic/lib/tools/adapters/terminal-policy/**` 定义 terminal policy input/decision、risk、cwd/env/timeout/network/filesystem/interactivity/session plan。
- `Alembic/lib/tools/adapters/TerminalSession.ts` 是 portable session plan；`TerminalSessionManager.ts` 同时包含 interface 与 Alembic 当前 in-memory host implementation。
- `Alembic/lib/tools/adapters/terminal-adapter/**` 包含 host execution、PTY、audit、artifact、environment、envelope helpers。
- `Alembic/lib/sandbox/**` 是 macOS Seatbelt `sandbox-exec`、sandbox profile、network proxy、environment cleanup、violation parser 的 host execution layer。

## 3. Wave 5 目标

1. `AlembicAgent` 补齐 terminal tool public contract，让 terminal capabilities/policy/session/envelope 的 portable 层由 Agent 维护。
2. `Alembic` 在 Agent contract 可用后，改为消费 `@alembic/agent` terminal contract，并删除本地 portable terminal duplicate。
3. `Alembic` 继续保留真实 host executor/sandbox bridge，不把 macOS `sandbox-exec`、PTY、network proxy、audit、artifact、approval、DI wiring 迁入 Agent。
4. `AlembicPlugin` 继续保持 agent/tool/local AI runtime 清理状态。
5. `AlembicDashboard` 仅在 capability schema 或 HTTP response contract 变化时启动 UI smoke。

## 4. 边界规则

### 4.1 Agent-owned

`AlembicAgent` 应拥有：

- Terminal tool/capability public schema。
- `terminal_run`、`terminal_script`、`terminal_shell`、`terminal_pty`、`terminal_session_close`、`terminal_session_status`、`terminal_session_cleanup` manifests。
- Terminal risk/policy intent 和 decision 类型。
- Terminal policy input builder 与 evaluator 中不依赖 Alembic host execution 的逻辑。
- Terminal session plan 类型与 session manager interface。
- Terminal result envelope contract 与 portable normalization helpers。
- Package public export，例如 `@alembic/agent/tools/terminal`，具体命名可按 Agent 现有 package export 风格决定。
- Contract tests、public import smoke 和 package export coverage。

### 4.2 Alembic-owned

`Alembic` 应保留：

- `TerminalAdapter` 作为最小 host bridge。
- 真实 process / PTY execution。
- `/bin/sh` script materialization。
- macOS Seatbelt `sandbox-exec` bridge。
- `SandboxExecutor`、`SandboxPolicy`、`SeatbeltProfileBuilder`、`SandboxNetworkProxy`、`SandboxEnvironment`、`SandboxProbe`、`SandboxViolationParser`。
- Terminal audit sink、artifact output、environment assembly、approval/gateway、DI services、projectRoot/dataRoot/write-zone enforcement。
- Concrete terminal session storage implementation，例如当前 `InMemoryTerminalSessionManager` 或迁名后的 host implementation。

### 4.3 禁止事项

- 不允许把 `lib/tools/adapters/terminal-capabilities/**` 和 `terminal-policy/**` 作为 Alembic-owned generic layer 长期保留。
- 不允许把 macOS `sandbox-exec` / PTY / process spawn 迁入 `AlembicAgent`。
- 不允许让 `AlembicPlugin` 引入 `@alembic/agent` 或 Alembic terminal runtime。
- 不允许用空 facade 代替真实 contract。
- 不允许只改 import 路径而不补 public contract tests。

## 5. Wave 5 分派表

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicAgent` | 已完成 | 已补齐 terminal Agent tool contract export：capability manifests、policy intent/decision、session plan/interface、portable envelope contract；OS sandbox executor 保持 out of scope。 | 已新建 | `docs/AlembicAgent/alembic-agent-terminal-sandbox-tool-contract-wave-5-2026-05-17.md` | 本文第 5 节 | 本文第 6.1 节和 Agent 专项文档 | `npm run check`; `npm run build`; terminal contract targeted tests; package export import smoke | 已完成，提交 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`。 |
| `Alembic` | 已完成 | 消费 Agent terminal exports，删除本地 portable terminal capabilities/policy/session/envelope duplicate，只保留 host executor/sandbox bridge。 | 已新建 | `docs/Alembic/alembic-terminal-sandbox-host-bridge-consumption-wave-5-2026-05-17.md` | 本文第 5 节 | 本文第 6.2 节和 Alembic 专项文档 | `npm run lint:agent-extraction-boundary`; `npm run build:check`; targeted terminal/tool tests; CLI status smoke | 已完成，提交 `6598857fddd2f94d3d5c05ec5c1836879d1fc657`。 |
| `AlembicPlugin` | 观察中 | 保持 agent-free；本轮不接入 terminal contract。 | 无需新建 | 本文 | 本文第 5 节 | 本文第 6.3 节 | release 前重跑 plugin gates | 无。 |
| `AlembicDashboard` | 观察中 | 若 terminal capability schema 或 HTTP tools response contract 变化，执行 UI/API smoke；否则无任务。 | 按需新建 | `docs/AlembicDashboard/alembic-dashboard-terminal-capability-contract-smoke-wave-5-2026-05-17.md` | 本文第 5 节 | 本文第 6.4 节 | 如触发：`npm run build` 和相关 smoke | 等待 Alembic contract 变化。 |
| `AlembicCore` | 观察中 | 不承接 terminal runtime；只有可复用 deterministic policy helper 被明确抽象时才评估。 | 无需新建 | 本文 | 本文第 5 节 | 本文第 6.5 节 | 如触发：Core `npm run check` | 无。 |

## 6. 执行细则

### 6.1 AlembicAgent

执行窗口应先读取真实实现：

- `Alembic/lib/tools/adapters/terminal-capabilities/**`
- `Alembic/lib/tools/adapters/terminal-policy/**`
- `Alembic/lib/tools/adapters/TerminalSession.ts`
- `Alembic/lib/tools/adapters/TerminalSessionManager.ts`
- `Alembic/lib/tools/adapters/terminal-adapter/TerminalEnvelopes.ts`
- `Alembic/lib/tools/adapters/TerminalAdapter.ts`
- `AlembicAgent/src/tools/v2/handlers/terminal.ts`
- `AlembicAgent/src/tools/v2/registry.ts`
- `AlembicAgent/src/tools/catalog/CapabilityManifest.ts`

执行目标：

- 新增或整理 Agent-owned terminal contract 模块，优先形成一个清晰 public subpath。
- 保持 `terminal.exec` V2 现有能力可用，并评估是否需要与 `terminal_run` / `terminal_shell` / `terminal_script` / `terminal_pty` contract 统一命名或桥接。
- 把 portable policy/session/capability/envelope contract 纳入 Agent package exports。
- 为 terminal contract 增加 targeted tests：
  - capability manifest list 完整。
  - policy input builder/evaluator 对危险命令、cwd 越界、env、timeout、network/filesystem/interactivity 的行为稳定。
  - session plan validation 稳定。
  - public import smoke 通过。
- 写清楚 out-of-scope：不迁移 macOS Seatbelt、PTY/process execution、network proxy、audit/artifact、approval/gateway、DI wiring。

最低验收：

```text
npm run check
npm run build
node -e "Promise.all([import('@alembic/agent/tools/terminal')]).then(() => console.log('terminal contract import ok'))"
```

如果最终 public subpath 不是 `@alembic/agent/tools/terminal`，必须在专项文档和本文回填中写明正式路径。

回填（2026-05-17）：

- 状态：已完成。
- 完成范围：新增 `@alembic/agent/tools/terminal` public subpath；导出 terminal capability manifests、portable policy input builders/evaluators、policy intent/decision types、session plan validation、`TerminalSessionManager` interface 和 portable terminal envelope helpers。
- 文件/模块变化：
  - `package.json` 新增 `./tools/terminal` package export。
  - `src/tools/terminal/**` 新增 capabilities / policy / session / envelope / index。
  - `src/tools/index.ts` 汇总导出 terminal contract。
  - `test/terminal-contract.test.ts` 新增 targeted contract tests。
  - `src/index.ts`、`test/index.test.ts` 更新 package migration metadata 为 `phase-9-terminal-contract`。
- 提交 hash：`10c672d2bd2bf709b88104ef1b4b277c28f97dd9`。
- 验证命令与结果：
  - `npm run build:check`：通过。
  - `npm run test -- test/terminal-contract.test.ts`：通过，1 个 test file、5 个 tests。
  - `npx biome check src/tools/terminal test/terminal-contract.test.ts`：通过，新增 terminal contract 范围无 Biome 问题。
  - `npm run check`：通过，8 个 test files、35 个 tests；lint 输出既有 warnings，退出码为 0。
  - `npm run build`：通过。
  - `node -e "Promise.all([import('@alembic/agent/tools/terminal')]).then(() => console.log('terminal contract import ok'))"`：通过，输出 `terminal contract import ok`。
- 遗留风险：
  - 全量 lint 仍显示本轮前已存在的 Agent 源码 warnings；新增 terminal contract 范围已单独通过 Biome check。
  - 本轮只提供 portable contract，不迁移 process/PTY execution、macOS Seatbelt、network proxy、audit/artifact、approval/gateway 或 DI wiring。
  - `terminal.exec` V2 handler 保持不变；后续如需统一 `terminal.exec` 与 `terminal_run` 等命名，应由 Alembic consumption / adapter bridge 阶段评估。
- 下一步建议：`Alembic` 窗口解除阻塞，消费 `@alembic/agent/tools/terminal` 并删除本地 portable terminal duplicate；`AlembicPlugin` 保持 agent-free；`AlembicDashboard` 继续观察 capability/API response shape。

总控复验（2026-05-17）：

- 复验结论：通过。`AlembicAgent` terminal contract 可作为 `Alembic` 下一步消费入口。
- `git -C AlembicAgent status --short`：干净。
- `git -C AlembicAgent log -5 --oneline`：最新提交 `10c672d Expose terminal tool contract`。
- `package.json` 已包含 `./tools/terminal` export，指向 `dist/tools/terminal/index.js` 和对应类型声明。
- `find AlembicAgent/src/tools/terminal AlembicAgent/test -maxdepth 4 -type f` 确认新增 capabilities / policy / session / envelope / terminal contract test。
- `rg -n "child_process|node:child_process|spawn\(|execFile|sandbox-exec|Seatbelt|SandboxNetworkProxy|SandboxExecutor|pty\.fork" src/tools/terminal test/terminal-contract.test.ts` 未发现真实执行实现导入；只在 capability 描述文本中出现 `execFile` / `pty.fork`。
- `npm run build:check`：通过。
- `npm run test -- test/terminal-contract.test.ts`：通过，1 个 test file，5 个 tests。
- `npx biome check src/tools/terminal test/terminal-contract.test.ts`：通过，17 个文件无新增问题。
- `npm run check`：通过，8 个 test files，35 个 tests；仍输出既有 27 个 Biome warnings。
- `npm run build`：通过。
- `node -e "import('@alembic/agent/tools/terminal')..."`：通过，确认 `TERMINAL_CAPABILITY_MANIFESTS` 为 7 个，并存在 policy/session/envelope 导出。

### 6.2 Alembic

状态：已完成。

解除阻塞后执行目标：

- `TerminalAdapter.ts` 改为消费 Agent-owned terminal contract。
- 删除或迁出 Alembic 本地 portable terminal duplicates：
  - `lib/tools/adapters/terminal-capabilities/**`
  - `lib/tools/adapters/terminal-policy/**`
  - `lib/tools/adapters/TerminalSession.ts` 中的 portable session plan
  - `lib/tools/adapters/terminal-adapter/TerminalEnvelopes.ts` 中的 portable result contract
- 保留并必要时重命名 host implementation：
  - concrete `TerminalSessionManager`
  - `terminal-adapter/TerminalExecutors.ts`
  - `TerminalRunExecutor.ts`
  - `TerminalScriptExecutor.ts`
  - `TerminalShellExecutor.ts`
  - `TerminalPtyExecutor.ts`
  - `TerminalPtyRunner.ts`
  - `TerminalArtifacts.ts`
  - `TerminalAudit.ts`
  - `TerminalEnvironment.ts`
  - `lib/sandbox/**`
- 更新 `scripts/lint-agent-extraction-boundary.mjs` 和 `config/agent-extraction-boundary.json`，新增 Wave 5 hard gate：
  - local portable terminal capability duplicate files = 0。
  - local portable terminal policy duplicate files = 0。
  - local portable terminal session plan duplicate files = 0。
  - host executor/sandbox bridge files 允许保留并明确分类。

最低验收：

```text
npm run lint:agent-extraction-boundary
npm run build:check
npm run test:unit -- test/unit/TerminalAdapter.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentModuleBoundaries.test.ts
npm run build
node dist/bin/cli.js status --json
rg -n "terminal-capabilities|terminal-policy|TerminalSession" lib/tools/adapters --glob '*.ts'
```

如果当前 sandbox 环境无法运行 `TerminalAdapter.test.ts` 中依赖 `sandbox-exec` 或 loopback listen 的用例，必须回填具体失败原因，并至少跑无 OS sandbox 依赖的 terminal policy/manifest/adapter contract tests。

回填（2026-05-17）：

- 状态：已完成，总控验收通过。
- 完成范围：Alembic 已消费 `@alembic/agent/tools/terminal` 的 terminal capability manifests、portable policy builders/evaluators、session plan type 和 envelope helpers；删除本地 portable terminal duplicate；保留 host executor/sandbox bridge。
- 文件/模块变化：
  - `lib/injection/modules/AgentModule.ts` 改为从 `@alembic/agent/tools/terminal` 注册 terminal manifests。
  - `lib/tools/adapters/TerminalAdapter.ts` 和 `lib/tools/adapters/terminal-adapter/*Executor.ts` 改为消费 Agent terminal policy / envelope contract。
  - `lib/tools/adapters/TerminalSessionManager.ts` 保留 concrete host session storage，并消费 Agent `TerminalSessionPlan` type。
  - 删除 `lib/tools/adapters/terminal-capabilities/**`、`lib/tools/adapters/terminal-policy/**`、`lib/tools/adapters/TerminalSession.ts`、`lib/tools/adapters/terminal-adapter/TerminalEnvelopes.ts`。
  - `scripts/lint-agent-extraction-boundary.mjs` 新增 Wave 5 hard gate。
  - `config/agent-extraction-boundary.json` 新增 `phase10TerminalSandboxAgentToolBoundary` 与 `terminalToolContractRules`，剩余 terminal 文件重分类为 Alembic host bridge。
- 提交 hash：`6598857fddd2f94d3d5c05ec5c1836879d1fc657`，`chore: consume agent terminal contract`。

验证命令与结果：

| 命令 | 结果 |
| --- | --- |
| `npm run lint:agent-extraction-boundary` | 通过；`@alembic/agent/tools/terminal consumer files: 10`，terminal capability/policy/session plan/envelope duplicate 均为 0。 |
| `npm run build:check` | 通过。 |
| `node --input-type=module` terminal contract import smoke | 通过；`manifestCount: 7`，policy/session/envelope exports 均存在。 |
| `npm run test:unit -- test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalSessionManager.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentModuleBoundaries.test.ts` | 通过；4 个 test files，82 个 tests。 |
| `npm run test:unit -- test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalSessionManager.test.ts test/unit/TerminalAdapter.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentModuleBoundaries.test.ts` | 已尝试；`TerminalAdapter.test.ts` 真实执行路径受当前 sandbox 限制失败，具体为 `sandbox-exec: sandbox_apply: Operation not permitted`；其余 4 个无 OS sandbox 依赖文件通过。 |
| `npm run check` | 通过；存在既有 Biome warnings，未阻断。 |
| `npm run build` | 通过。 |
| `node dist/bin/cli.js status --json` | 通过；workspace detected，当前测试环境 database not found。 |
| `rg -n "terminal-capabilities\|terminal-policy\|TerminalSession" lib/tools/adapters --glob '*.ts'` | 通过；只剩 host-owned `TerminalSessionManager` 相关引用。 |
| `rg -n "terminal-capabilities\|terminal-policy\|TerminalEnvelopes\|TerminalSession\\.js" lib/tools/adapters --glob '*.ts'` | 通过；无匹配。 |
| `git diff --check` | 通过。 |

遗留风险：

- `TerminalSessionManager` 保留 host-specific session storage 语义，包含 projectRoot 隔离、env 持久化元数据、lease 状态和 commandCount；这不是 portable session plan duplicate。
- 当前环境不能运行真实 `TerminalAdapter` sandbox execution 成功路径，需在允许 `sandbox-exec` / Seatbelt 的宿主环境中复跑 `TerminalAdapter.test.ts`。
- 如果未来 Agent terminal contract shape 改变，Alembic 应更新 host bridge 消费代码，不恢复本地 `terminal-capabilities`、`terminal-policy`、`TerminalSession.ts` 或 `TerminalEnvelopes.ts`。

下一步建议：

- 总控复验提交 `6598857fddd2f94d3d5c05ec5c1836879d1fc657` 的删除清单、hard gate 输出和 terminal host bridge 分类。
- Dashboard 仅在 tools/capabilities API response shape 变化时补 UI/API smoke；本轮 Alembic 没有直接修改 Dashboard contract。
- Plugin 继续保持 agent-free，不接入 terminal contract。

总控复验（2026-05-17）：

- 复验结论：通过。Wave 5 可以关闭，下一波进入最终跨仓库集成 / release readiness / 需要宿主权限的 terminal smoke。
- `git -C Alembic status --short`：干净。
- `git -C Alembic log -5 --oneline`：最新提交 `6598857 chore: consume agent terminal contract`。
- `git -C Alembic show --stat --oneline --name-status HEAD`：确认删除 `terminal-capabilities/**`、`terminal-policy/**`、`TerminalSession.ts`、`TerminalEnvelopes.ts`，并更新 host bridge / tests / boundary lint。
- `find Alembic/lib/tools/adapters -maxdepth 3 -type f`：剩余 terminal 文件为 `TerminalAdapter.ts`、`TerminalSessionManager.ts` 和 `terminal-adapter/*Executor.ts`、audit/artifact/environment/PTY runner。
- `rg -n "terminal-capabilities|terminal-policy|TerminalEnvelopes|TerminalSession\.js" lib/tools/adapters --glob '*.ts'`：无匹配。
- `rg --files lib/tools/adapters/terminal-capabilities lib/tools/adapters/terminal-policy lib/tools/adapters/TerminalSession.ts lib/tools/adapters/terminal-adapter/TerminalEnvelopes.ts`：路径均不存在。
- `rg -n "@alembic/agent/tools/terminal" lib test --glob '*.ts'`：10 个消费文件。
- `npm run lint:agent-extraction-boundary`：通过；`@alembic/agent/tools/terminal consumer files: 10`，duplicate terminal capability/policy/session plan/envelope files 均为 0。
- `npm run build:check`：通过。
- terminal contract import smoke：通过，`manifestCount: 7`，policy/session/envelope exports 均存在。
- `npm run test:unit -- test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalSessionManager.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentModuleBoundaries.test.ts`：通过，4 个 test files，82 个 tests。
- `npm run test:unit -- test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalSessionManager.test.ts test/unit/TerminalAdapter.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentModuleBoundaries.test.ts`：已尝试，`TerminalAdapter.test.ts` 的 12 个真实执行路径受当前宿主 sandbox 限制失败，错误为 `sandbox-exec: sandbox_apply: Operation not permitted`；其余 4 个文件 82 个 tests 通过。
- `npm run check`：通过；仍有既有 Biome warnings。
- `npm run build`：通过。
- `node dist/bin/cli.js status --json`：通过，workspace detected，测试环境 database not found。
- `git diff --check`：通过。

### 6.3 AlembicPlugin

执行目标：

- 不接入 terminal contract。
- 不恢复 Agent/Tool/AI runtime。
- release / marketplace sync 前继续使用既有 release readiness gate。

### 6.4 AlembicDashboard

执行目标：

- 观察。
- 如果 Alembic 的 tools/capabilities API response shape 因 terminal contract export 改变，再启动 Dashboard smoke。
- 不直接承接 terminal execution。

### 6.5 AlembicCore

执行目标：

- 观察。
- 不承接 terminal runtime、PTY、sandbox、Agent tool policy。

## 7. Wave 5 完成标准

Wave 5 完成后应达到：

- `AlembicAgent` 是 terminal Agent tool contract 的唯一维护仓库。
- `Alembic` 不再维护 portable terminal capability/policy/session/envelope duplicate。
- `Alembic` 仍保留真实 host terminal/sandbox executor bridge。
- `AlembicPlugin` 继续保持 agent-free。
- Dashboard/Core 无误接入，无遗漏窗口。
- 总控索引能追踪 Agent export、Alembic consumption、验证命令、失败环境限制和遗留风险。

## 8. 可复制分派提示词

```text
读取 docs/workspace/alembic-terminal-sandbox-agent-tool-boundary-wave-5-plan-2026-05-17.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

本提示词当前发给：

- 无。Wave 5 已完成。

`AlembicAgent` 已完成并回填 terminal public contract 提交 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`。`Alembic` 已完成并回填 host bridge consumption 提交 `6598857fddd2f94d3d5c05ec5c1836879d1fc657`。下一步以新的 workspace 总控文档为准。
