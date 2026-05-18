# Alembic Agent Cutover Final Integration Readiness Wave 6 Plan

日期：2026-05-17
总控窗口：AlembicWorkspace
状态：已完成

本文承接 `docs/workspace/alembic-terminal-sandbox-agent-tool-boundary-wave-5-plan-2026-05-17.md`。Wave 5 已完成：`AlembicAgent` 拥有 terminal Agent tool portable contract，`Alembic` 消费 `@alembic/agent/tools/terminal` 并只保留真实 host terminal/sandbox bridge。

本轮不再扩大迁移范围，目标是最终跨仓库集成验收、release readiness、以及需要宿主权限的 terminal/sandbox smoke。除非验证失败暴露真实问题，本轮原则上不改业务实现。

## 1. Wave 5 验收结论

| 窗口 | 结论 | 证据 |
| --- | --- | --- |
| `AlembicAgent` | 已完成 | 提交 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`；`@alembic/agent/tools/terminal` export smoke 通过；terminal contract targeted tests 通过。 |
| `Alembic` | 已完成 | 提交 `6598857fddd2f94d3d5c05ec5c1836879d1fc657`；terminal portable duplicate files 为 0；`npm run lint:agent-extraction-boundary`、`build:check`、`check`、`build` 通过。 |
| `AlembicPlugin` | 观察中 | Wave 5 未接入 terminal contract，继续保持 agent-free。 |
| `AlembicDashboard` | 观察中 | Wave 5 未直接修改 Dashboard；若 capability/API shape 变化才需要 UI/API smoke。 |
| `AlembicCore` | 观察中 | Wave 5 未修改 Core。 |

总控复验要点：

- `Alembic` local Agent / Tool V2 / terminal portable duplicate hard gates 均为 0。
- `Alembic` 仍有真实 host terminal/sandbox bridge：`TerminalAdapter`、`TerminalSessionManager`、terminal executor/audit/artifact/environment、`lib/sandbox/**`。
- 当前 Codex sandbox 环境无法完成 `TerminalAdapter.test.ts` 的真实 execution success path，错误为 `sandbox-exec: sandbox_apply: Operation not permitted`。这不是 Wave 5 代码验收阻塞，但必须进入最终 host smoke。

## 2. Wave 6 目标

1. 在 `Alembic` 侧补最终 host terminal/sandbox smoke：确认真实执行、PTY、audit、artifact、session storage、CLI/daemon 状态在宿主权限环境中可用。
2. 在 `AlembicAgent` 侧锁定 public contract：确认所有迁移后的 subpath 都能 build/check/import，且 terminal contract 不夹带 host executor。
3. 在 `AlembicPlugin` 侧重跑 agent-free release readiness：确认 Plugin 没有回流 Agent/Tool/local AI runtime，并通过 Codex plugin verify/smoke。
4. 在 `AlembicDashboard` 侧确认 capability/API shape 没有破坏 UI；若有变化，跑 live smoke。
5. 在 `AlembicCore` 侧做最终 public API baseline，确保外层消费仍稳定。

## 3. 分派表

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | 已完成 | 最终 host integration：已重跑 boundary/build/check，补齐宿主权限 `TerminalAdapter.test.ts`、daemon health、CLI/capability shape 和 stale dist release readiness hard gate。 | 已新建 | `docs/Alembic/alembic-final-host-terminal-smoke-wave-6-2026-05-17.md` | 本文第 3 节 | 本文第 4.1 节和 Alembic 专项文档 | `npm run lint:agent-extraction-boundary`; `npm run build:check`; `npm run check`; `npm run build`; `npm run test:unit -- test/unit/TerminalAdapter.test.ts`; `node dist/bin/cli.js status --json`; terminal/daemon smoke | 已完成；提交 `00a8fe23af73717f313ad09dbab294534599e2a8`。 |
| `AlembicAgent` | 已完成 | Final contract lock：已确认 Agent public subpaths、terminal contract、tool v2/service/runtime/memory/context/forge/tasks/profiles exports 均稳定；未引入 host executor。 | 已新建 | `docs/AlembicAgent/alembic-agent-final-contract-lock-wave-6-2026-05-17.md` | 本文第 3 节 | 本文第 4.2 节和 Agent 专项文档 | `npm run check`; `npm run build`; public subpath import smoke; no host executor scan | 已完成；无新增代码提交，复验基线 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`。 |
| `AlembicPlugin` | 已完成 | Final agent-free release gate：已重跑 boundary report、build/check、Codex plugin/channel verify/smoke，并删除未使用旧 ambient Agent 类型声明、更新 `AGENTS.md` 当前 agent-free 边界；确认不引入 `@alembic/agent` 或 local Agent/AI/Tool runtime。 | 已新建 | `docs/AlembicPlugin/alembic-plugin-final-agent-free-release-gate-wave-6-2026-05-17.md` | 本文第 3 节 | 本文第 4.3 节和 Plugin 专项文档 | `npm run report:agent-extraction-boundary`; `npm run check`; `npm run build`; `npm run verify:codex-plugin`; `npm run verify:codex-channel`; `npm run smoke:codex-plugin`; agent-free scans | 已完成；普通 plugin smoke 不需要 live daemon，daemon/recovery 按脚本为 `skipped`。 |
| `AlembicDashboard` | 已完成 | Final UI/API smoke：已通过 `npm run build`；根据 Alembic 21 个 lightweight schema / 7 个 terminal capability 回填判断，不触发 Dashboard live smoke。 | 已新建 | `docs/AlembicDashboard/alembic-dashboard-final-host-capability-smoke-wave-6-2026-05-17.md` | 本文第 3 节 | 本文第 4.4 节和 Dashboard 专项文档 | `npm run build`; capability/API shape scan | 已完成；未触发 live smoke。 |
| `AlembicCore` | 已完成 | Final Core baseline：已确认 public API boundary、tests、build、package dry-run 仍稳定，未承接 Agent/terminal/Plugin runtime。 | 已新建 | `docs/AlembicCore/alembic-core-final-public-api-baseline-wave-6-2026-05-17.md` | 本文第 3 节 | 本文第 4.5 节和 Core 专项文档 | `npm run check`; `npm run build`; `npm run smoke:public-api`; `npm --cache <temporary-npm-cache> pack --dry-run` | 已完成；无新增代码提交，复验基线 `6b7b52a17fe214816c41344860caeb8bf35f1923`。 |

## 4. 执行细则

### 4.1 Alembic

执行目标：

- 复验 Wave 5 hard gate 没有回退：local Agent / generic Tool V2 / terminal portable duplicate 均为 0。
- 在允许 macOS Seatbelt / `sandbox-exec` 的宿主环境中跑真实 terminal execution success path。
- 若 `TerminalAdapter.test.ts` 仍因宿主环境失败，不直接改代码；先记录：
  - 运行环境。
  - `sandbox-exec` 可用性。
  - 是否处于嵌套 sandbox。
  - 失败用例和 stderr。
  - 是否需要新增“环境不可用时降级/skip”的测试策略。
- 确认 CLI status、daemon/capability shape 没有破坏 Dashboard / Plugin 既有契约。

最低验收：

```text
npm run lint:agent-extraction-boundary
npm run build:check
npm run check
npm run build
npm run test:unit -- test/unit/TerminalAdapter.test.ts
node dist/bin/cli.js status --json
```

回填（2026-05-17）：

- 状态：已完成，待总控验收。
- 完成范围：复验 Wave 5 hard gate 未回退；宿主权限运行 `TerminalAdapter.test.ts` 真实 terminal/sandbox success path；确认 CLI status、daemon start/health/stop、host capability catalog shape；修复验证暴露的 stale `dist` release readiness 问题，构建前清理 `dist` 并把 stale deleted duplicate dist artifacts 加入边界 lint。
- 提交 hash：`00a8fe23af73717f313ad09dbab294534599e2a8`（`00a8fe2 chore: harden final integration readiness`）。
- 验证命令与结果：
  - `npm run lint:agent-extraction-boundary`：通过；local Agent / generic Tool V2 / terminal portable duplicate 均为 0，`stale deleted duplicate dist artifacts: 0`，`@alembic/agent/tools/terminal consumer files: 10`。
  - `npm run build:check`：通过。
  - `npm run check`：通过；Biome 仍输出既有 warnings，退出码为 0。
  - `npm run build`：通过；执行 `clean:dist` 后 `tsc` 和 `postbuild` 正常完成。
  - `npm run test:unit -- test/unit/TerminalAdapter.test.ts`：宿主权限环境通过；1 个 test file、20 个 tests 全部通过。
  - `node dist/bin/cli.js status --json`：通过；workspace 可用，CLI status 当前环境 database 为 false。
  - `node --input-type=module` capability catalog smoke：通过；host `toolRegistry.toLightweightSchemas()` 返回 21 个 schema，terminal capability 为 `terminal_pty`、`terminal_run`、`terminal_script`、`terminal_session_cleanup`、`terminal_session_close`、`terminal_session_status`、`terminal_shell`。
  - `env ALEMBIC_DAEMON_FILE_CHANGES=0 node --input-type=module` daemon supervisor smoke：宿主权限环境通过；daemon `start` 为 `ready`，`/api/v1/daemon/health` 和 `/api/v1/health` 均返回 success/healthy，随后 `stop` 成功。
  - `sandbox-exec -p '(version 1)(allow default)' /bin/echo alembic-sandbox-smoke`：宿主权限环境通过；`sandbox-exec` 位于 `/usr/bin/sandbox-exec`。
  - `rg -n "#agent/\|\\.\\./agent/\|\\.\\./\\.\\./agent/\|lib/agent/" lib bin scripts test --glob '*.ts' --glob '*.js' --glob '*.mjs'`：无匹配；`rg` 退出码 1 表示未命中。
  - `rg -n "terminal-capabilities\|terminal-policy\|TerminalEnvelopes\|TerminalSession\\.js" lib bin test --glob '*.ts' --glob '*.js' --glob '*.mjs'`：无匹配；`rg` 退出码 1 表示未命中。
  - `git diff --check`：通过。
- 遗留风险：`npm run check` 的 Biome warnings 为既有源码 warnings；daemon 在普通 Codex 执行沙盒下会因本地监听被拒绝而失败（`listen EPERM: operation not permitted 127.0.0.1`），但同一 supervisor smoke 在宿主权限环境通过；轻量容器 capability smoke 在无 Bootstrap DB/API key 时会输出非阻塞日志，完整 daemon health 已通过。
- 下一步建议：Dashboard 窗口按 21 个 lightweight schema / 7 个 terminal capability 的 shape 判断是否需要 live UI/API smoke；后续 Agent terminal contract 若变化，Alembic 继续只消费 `@alembic/agent/tools/terminal`，不得恢复本地 portable terminal duplicate。

### 4.2 AlembicAgent

执行目标：

- 复验 public subpaths：
  - `@alembic/agent`
  - `@alembic/agent/agent`
  - `@alembic/agent/service`
  - `@alembic/agent/runtime`
  - `@alembic/agent/prompts`
  - `@alembic/agent/domain`
  - `@alembic/agent/forge`
  - `@alembic/agent/tasks`
  - `@alembic/agent/profiles`
  - `@alembic/agent/ai`
  - `@alembic/agent/tools`
  - `@alembic/agent/tools/v2`
  - `@alembic/agent/tools/terminal`
  - `@alembic/agent/memory`
  - `@alembic/agent/context`
- 扫描 terminal contract 不包含 host execution imports。
- 不继续添加功能，除非 `Alembic` host smoke 反馈 contract 缺口。

最低验收：

```text
npm run check
npm run build
node -e "Promise.all([...publicSubpaths.map((p)=>import(p))]).then(()=>console.log('agent public contract ok'))"
rg -n "node:child_process|child_process|sandbox-exec|Seatbelt|SandboxNetworkProxy|SandboxExecutor" src/tools/terminal test/terminal-contract.test.ts
```

回填（2026-05-17）：

- 状态：已完成。
- 完成范围：复验 `@alembic/agent`、`@alembic/agent/agent`、`@alembic/agent/service`、`@alembic/agent/runtime`、`@alembic/agent/prompts`、`@alembic/agent/domain`、`@alembic/agent/forge`、`@alembic/agent/tasks`、`@alembic/agent/profiles`、`@alembic/agent/ai`、`@alembic/agent/tools`、`@alembic/agent/tools/v2`、`@alembic/agent/tools/terminal`、`@alembic/agent/memory`、`@alembic/agent/context` public subpaths；复验 terminal contract 不包含 host execution imports。
- 提交 hash：无新增代码提交；本轮复验基线为 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`。
- 验证命令与结果：
  - `npm run check`：通过；8 个 test files、35 个 tests；lint 仍输出既有 warnings，退出码为 0。
  - `npm run build`：通过。
  - `node -e "const publicSubpaths=['@alembic/agent','@alembic/agent/agent','@alembic/agent/service','@alembic/agent/runtime','@alembic/agent/prompts','@alembic/agent/domain','@alembic/agent/forge','@alembic/agent/tasks','@alembic/agent/profiles','@alembic/agent/ai','@alembic/agent/tools','@alembic/agent/tools/v2','@alembic/agent/tools/terminal','@alembic/agent/memory','@alembic/agent/context']; Promise.all(publicSubpaths.map((p)=>import(p))).then(()=>console.log('agent public contract ok'))"`：通过，输出 `agent public contract ok`。
  - `rg -n "node:child_process|child_process|sandbox-exec|Seatbelt|SandboxNetworkProxy|SandboxExecutor" src/tools/terminal test/terminal-contract.test.ts`：无匹配；`rg` 退出码 1 表示未命中。
- 遗留风险：`npm run check` 的 lint warnings 为既有源码 warnings；真实 terminal/sandbox execution success path 属于 Alembic host smoke，不属于本窗口。
- 下一步建议：等待 `Alembic` 窗口完成 host terminal/sandbox smoke；若其发现 Agent contract 缺口，再由 AlembicAgent 接收精确修复任务。

### 4.3 AlembicPlugin

执行目标：

- 确认 Plugin 不依赖 `@alembic/agent`。
- 确认 Plugin 不恢复本地 Agent / Tool / AI provider runtime。
- 跑 release readiness，不发布、不推送，除非用户另行要求。

最低验收：

```text
npm run report:agent-extraction-boundary
npm run check
npm run build
npm run verify:codex-plugin
npm run smoke:codex-plugin
rg -n "@alembic/agent|lib/agent|local AI provider|Tool V2" lib bin config scripts plugins --glob '*.ts' --glob '*.js' --glob '*.mjs' --glob '*.json'
```

回填（2026-05-17）：

- 状态：已完成。
- 专项文档：`docs/AlembicPlugin/alembic-plugin-final-agent-free-release-gate-wave-6-2026-05-17.md`。
- 完成范围：删除未使用的旧 ambient Agent 类型声明 `lib/types/agent.d.ts`，同步清理 `lib/types/global.d.ts` 索引说明；更新 AlembicPlugin `AGENTS.md`，把旧 `lib/agent/**`、`lib/tools/**` 必须保留的过期说明改为当前 agent-free 插件边界；复验 AlembicPlugin 没有 `@alembic/agent`、`#agent/*`、`#tools/*`、`#external/ai/*`、本地 Agent / AI provider / Tool V2 runtime 回流；复验 Codex plugin 和 channel 打包链路。
- 提交 hash：最新提交 `68e0d4b6af0e13d44e6a10a084f5046f379024b7`；本轮代码/文档提交包括 `85a62846603c794b3203624e96613ab89bf7febc`（`chore: remove residual agent ambient types`）和 `68e0d4b6af0e13d44e6a10a084f5046f379024b7`（`docs: align plugin agent-free boundaries`）。
- 验证命令与结果：
  - `npm run report:agent-extraction-boundary`：通过；扫描 315 个 source files，Agent / AI / Tool boundary import 与 outside implementation 计数全部为 0。
  - `npm run check`：通过；`typecheck` 通过；Biome 仍有既有 123 warnings / 29 infos，退出码 0；Core import boundary 扫描 315 个文件和 517 个 `@alembic/core` imports，通过。
  - `npm run build`：通过。
  - `npm run verify:codex-plugin`：通过，`runtime.tgz` 为 `alembic-ai@0.1.2`。
  - `npm run verify:codex-channel`：通过，channel 为 `alembic-ai@0.1.2`。
  - `npm run smoke:codex-plugin`：通过；`install`、`stdio`、`npxRuntime` 为 `passed`，`recovery`、`daemon` 为 `skipped`。
  - `rg -n "@alembic/agent|lib/agent|local AI provider|Tool V2" lib bin config scripts plugins --glob '*.ts' --glob '*.js' --glob '*.mjs' --glob '*.json'`：仅命中 `scripts/report-agent-extraction-boundary.mjs` 中用于审计旧边界的 `lib/agent/` 标签；无运行时代码命中。
  - `rg -n "@alembic/agent|from ['\"]#agent|from ['\"]#tools|lib/agent|lib/tools|lib/external/ai|local AI provider|Tool V2" lib bin config scripts plugins --glob '*.ts' --glob '*.js' --glob '*.mjs' --glob '*.json'`：仅命中边界报告脚本的审计标签；无真实 import 或 runtime 回流。
  - `rg -n "PlanStep|DistilledContext|interface Plan|lib/types/agent|types/agent" lib bin config scripts plugins test --glob '*.ts' --glob '*.js' --glob '*.mjs' --glob '*.d.ts'`：无匹配。
- 边界判断：`lib/agent/**`、`lib/tools/**`、`lib/external/ai/**` 源码目录不存在；`lib/external/mcp/tools.ts` 是 Codex MCP tool schema，`plugins/alembic-codex/runtime/templates/instructions/agent-static.md` 是 Codex/AGENTS 指令模板，二者不属于本地 Agent / Tool V2 runtime；`scripts/report-agent-extraction-boundary.mjs` 的 `lib/agent/` 字符串仅为历史删除边界审计标签；AlembicPlugin `AGENTS.md` 已同步为允许 Codex MCP tool schema、禁止恢复本地 Agent / AI provider / Tool V2 runtime 的当前边界。
- 遗留风险：`npm run check` 的 Biome warnings / infos 为既有样式债；本轮普通 plugin smoke 不启动 live daemon，如发布前需要 live daemon 证据，需在允许本地端口监听的宿主环境额外运行 daemon smoke；`alembic-ai@0.1.2` 包名与 metadata 中的历史 `ai` / `agent` 关键词按用户前序口径暂不处理。
- 下一步建议：等待 `Alembic` 完成 host terminal/sandbox smoke，并根据 capability/API shape 决定 Dashboard 是否需要 live smoke；真实发布前重复本轮 release gate，并按需补 daemon smoke。

### 4.4 AlembicDashboard

执行目标：

- `npm run build` 作为最低门禁。
- 若 `Alembic` 回填 capability/API shape 有变化，使用 live daemon / API 做 Dashboard host-managed smoke。
- 不直接接入 terminal execution，也不把 terminal/sandbox 放到前端。

最低验收：

```text
npm run build
```

如触发 live smoke，必须回填 API endpoint、输入、响应 shape、UI 页面和截图/日志证据。

回填（2026-05-17）：

- 状态：已完成。
- 专项文档：`docs/AlembicDashboard/alembic-dashboard-final-host-capability-smoke-wave-6-2026-05-17.md`。
- 完成范围：执行 Dashboard 最低门禁 build；复核 Alembic Wave 6 capability/API shape 回填，host `toolRegistry.toLightweightSchemas()` 为 21 个 schema，terminal capability 为 `terminal_pty`、`terminal_run`、`terminal_script`、`terminal_session_cleanup`、`terminal_session_close`、`terminal_session_status`、`terminal_shell`；扫描 Dashboard 前端消费点，确认当前只展示 `terminal: { enabled, toolset }`、`terminalCapability`、`terminalEnabled`、`terminalSuccessRate` 等摘要字段，不直接消费 capability schema，也不接入 terminal execution。
- 提交 hash：`c3d4ca0 docs: record final host capability smoke`。
- 验证命令与结果：
  - `npm run build`：通过；仅保留 Vite large chunk warning。
  - `rg -n "capabil|terminal|toolRegistry|toLightweightSchemas|HOST_AI_MANAGED|hostManaged|daemon/health|/health|ai/chat|candidates/refine|candidates/enrich" src package.json`：确认没有 `toolRegistry.toLightweightSchemas()` 直接消费；terminal 相关前端代码只展示后端摘要字段。
- Live smoke 判断：未触发。Alembic Wave 6 改动和复验集中在 host terminal/sandbox execution 与 capability catalog；Dashboard 不解析 21 个 schema 或 7 个 terminal capability id，也不执行 terminal tool。Wave 2 已覆盖 Plugin host-managed AI fail-closed live contract，本轮不重复启动 live daemon。
- 遗留风险：如果后续后端把 `/modules/test-mode` 或 signal report terminal summary 从现有摘要字段替换为 capability catalog 结构，需要另开 Dashboard API adapter 和 live UI smoke；Vite large chunk warning 为既有构建提示。
- 下一步建议：Wave 6 可将 Dashboard 标记为已完成；未来如要展示 21 个 lightweight schema，应先定义稳定 Dashboard view model，继续禁止前端接入 terminal/sandbox 执行能力。

### 4.5 AlembicCore

执行目标：

- 复验 Core public API boundary 未受外层迁移影响。
- 不承接 Agent runtime、terminal runtime、Plugin runtime。

最低验收：

```text
npm run check
npm run smoke:public-api
```

回填（2026-05-17）：

- 状态：已完成。
- 完成范围：复验 Core public API boundary、typecheck、tests、lint、build、public API smoke 和 package dry-run；确认 Core 未承接 Agent runtime、terminal runtime 或 Plugin runtime。
- 提交 hash：无新增代码提交；本轮复验基线为 `6b7b52a17fe214816c41344860caeb8bf35f1923`（`6b7b52a chore: add public api boundary governance`）。
- 验证命令与结果：
  - `npm run check`：通过；Public API boundary 显示 134 个 package exports 已分类，Exact 73、Wildcard 61，Stable 15、Provisional 21、Transitional 98；Vitest 60 个 test files、926 个 tests 全部通过；Biome 检查 415 个文件。
  - `npm run build`：通过。
  - `npm run smoke:public-api`：通过，输出 `Imported 73 exact public API entrypoints.`。
  - `npm --cache <temporary-npm-cache> pack --dry-run`：通过；package dry-run 清单包含 715 个文件，package size 约 2.5 MB，unpacked size 约 22.5 MB。
- 遗留风险：`npm run test` 仍出现已知非阻塞 stderr：`error: Could not access 'HEAD'`，但测试通过；直接运行 `npm pack --dry-run` 会命中本机全局 npm cache 权限问题，已用临时 cache 验证 package 内容。
- 下一步建议：等待 Alembic host smoke、AlembicPlugin agent-free release gate、AlembicDashboard smoke 完成；如外层反馈真实 Core API 缺口，再按 public API 边界规则补 contract，继续禁止 Core 承接 Agent/terminal/Plugin runtime。

## 5. 完成标准

Wave 6 完成后，应达到：

- `AlembicAgent` public contract locked。
- `Alembic` host terminal/sandbox smoke 有明确通过证据，或有不可执行环境的准确风险记录和后续处理建议。
- `AlembicPlugin` agent-free release readiness 通过。
- `AlembicDashboard` build / 必要 live smoke 通过。
- `AlembicCore` public API baseline 通过。
- 总控索引把所有窗口标成 `已完成` 或明确的非代码环境风险，不留下“观察中但无证据”的灰区。

## 6. 可复制分派提示词

```text
读取 docs/workspace/alembic-agent-cutover-final-integration-readiness-wave-6-plan-2026-05-17.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

本提示词当前发给：

- `Alembic`
- `AlembicAgent`
- `AlembicPlugin`
- `AlembicDashboard`
- `AlembicCore`

## 7. 总控最终验收

验收时间：2026-05-17

总控结论：通过。Wave 6 已完成最终跨仓库集成验收；`Alembic` 已完整消费 `AlembicAgent` 的 Agent / Tool / terminal portable contract 并只保留 host-owned terminal/sandbox bridge，`AlembicPlugin` 已保持 agent-free release gate，`AlembicDashboard` 与 `AlembicCore` 均无新增迁移阻塞。

总控复核：

- 五个仓库 `git status --short` 均为干净状态。
- `Alembic` 最新提交为 `00a8fe2 chore: harden final integration readiness`。
- `AlembicAgent` 最新提交为 `10c672d Expose terminal tool contract`。
- `AlembicPlugin` 最新提交为 `68e0d4b docs: align plugin agent-free boundaries`。
- `AlembicDashboard` 最新提交为 `c3d4ca0 docs: record final host capability smoke`。
- `AlembicCore` 最新提交为 `6b7b52a chore: add public api boundary governance`。

总控补充验证：

```text
Alembic: npm run lint:agent-extraction-boundary
AlembicAgent: npm run build
AlembicPlugin: npm run report:agent-extraction-boundary
AlembicDashboard: npm run build
AlembicCore: npm run smoke:public-api
```

结果：全部通过。

最终收口：

- `AlembicAgent`：public contract locked；terminal contract 不包含 host executor。
- `Alembic`：已完成最终 host terminal/sandbox smoke；新增 clean build 和 stale dist hard gate。
- `AlembicPlugin`：agent-free release gate 通过；无 `@alembic/agent`、本地 Agent、AI provider、Tool V2 runtime 回流。
- `AlembicDashboard`：build 通过；当前 capability/API shape 不触发 live smoke。
- `AlembicCore`：public API boundary、public API smoke、package baseline 稳定。

遗留风险只保留非阻塞项：各仓库既有 lint / chunk warning、普通 Codex sandbox 不适合验证 host daemon/terminal 权限、Plugin live daemon smoke 仅在真实发布前按需补跑。
