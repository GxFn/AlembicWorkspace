# Codex 插件终端能力边界验证

日期：2026-05-15

## 2026-05-15 同步更新：Alembic 自有沙箱已清理

本文件早期记录了 Codex Desktop 插件环境中，Alembic 再叠加 macOS `sandbox-exec` 后出现 `sandbox_apply: Operation not permitted` 的真实失败原因。清理后，当前准确信息如下：

- Alembic 已删除终端执行链路里的 macOS Seatbelt / `sandbox-exec` / network proxy 沙箱实现。
- `lib/sandbox/*` 旧实现与对应单元、集成测试已移除。
- V2 `ToolContextFactory` 不再注入 `sandboxExecutor`。
- V2 `terminal.exec` 和 `TerminalAdapter` 现在走直接子进程执行。
- Alembic 仍保留命令策略、项目根目录校验、cwd 限制、超时、输出预算、审计摘要、显式环境变量策略。
- `terminal_run` 现在拒绝所有显式传入的敏感环境变量名，而不是只在持久化环境变量时拒绝。
- `TerminalEnvironment` 会从宿主环境里剥离常见密钥、令牌、数据库连接串、socket、cookie 等敏感变量。
- Dashboard 测试模式不再展示 Alembic 自有 sandbox 状态。

因此，当前边界不是“关闭 Alembic 沙箱后才可用”，而是：Alembic 不再维护自己的终端 OS 沙箱；插件内部终端执行依赖 Codex/IDE 宿主提供的进程安全边界，Alembic 负责项目目录、命令意图、环境变量、超时、输出和审计层面的治理。

`lib/agent/forge/SandboxRunner.ts` 仍然保留。它用于动态生成工具代码的语法与运行时安全检查，不属于终端命令的 macOS Seatbelt 沙箱。

后续验证脚本已同步为直接执行链路：

```bash
node scratch/verify-codex-plugin-terminal-boundary.mjs /path/to/project
```

以下历史内容保留作为清理依据；涉及 `ALEMBIC_SANDBOX_MODE`、`sandboxExecutor`、`sandbox-exec` 默认执行路径的描述已经不代表当前实现。

本文记录一次针对 Alembic Codex 插件终端能力的真实验证，目标是确认：Alembic 插件到底能使用什么程度的终端能力，哪些能力适合作为核心能力保留，哪些能力在 Codex Desktop 环境中不应作为可靠默认链路。

## 核心结论

Alembic 插件当前不能把 Codex Agent 的终端能力当作插件内部 API 直接调用。

Codex Agent 可以使用自己的终端工具执行 `rg`、`git`、`npm`、`npx vitest` 等命令，但这是 Agent 侧能力，不是 Alembic MCP 插件进程内部可调用的能力。Alembic 插件内部如果需要终端结果，必须依赖自己的内部工具链，或者由宿主 Agent/IDE 在外部执行后把结果交给 Alembic。

对 Alembic 自身来说，真正适合保留的不是通用终端，而是项目根目录内的只读代码扫描能力。当前代码已经存在 `code.search`、`code.read`、`code.structure` 这类更贴近需求的内部工具；它们比 `terminal_shell`、`terminal_pty` 更适合作为长期核心能力。

## 已验证事实

### 1. 当前安装的 Alembic MCP 没有暴露 terminal 工具

实测调用当前 Codex 会话中的 Alembic 插件状态工具：

```bash
alembic_codex_status({ projectRoot: "/Users/gaoxuefeng/Documents/github/Alembic" })
```

结果显示插件运行于 `profile: "codex-plugin"`，能解析当前项目目录，已初始化，MCP 层暴露的是 Codex 插件状态、初始化、任务类工具。

源码侧也一致：`lib/external/mcp/tools.ts` 的工具清单描述为 16 个 agent 工具加 2 个 admin 工具，列表包括 `alembic_search`、`alembic_structure`、`alembic_guard`、`alembic_bootstrap`、`alembic_rescan` 等，没有 `terminal`、`terminal_run`、`terminal_shell`、`terminal_pty`。

补充搜索：

```bash
rg -n "terminal_run|terminal_shell|terminal_pty|terminal_script|name: 'terminal|terminal\\(" lib/external/mcp lib/shared/schemas/mcp-tools.ts lib/codex plugins/alembic-codex/.mcp.json plugins/alembic-codex/.codex-plugin/plugin.json
```

结果无匹配，说明 terminal 能力没有作为外部 MCP 工具直接暴露给 Codex。

相关代码：

- `lib/external/mcp/tools.ts:1` 标注 MCP 工具定义范围。
- `lib/external/mcp/tools.ts:143` 到 `lib/external/mcp/tools.ts:170` 是 MCP 工具注解清单，无 terminal 工具。

### 2. terminal capability 明确标记为 runtime-only

`lib/tools/adapters/terminal-capabilities/TerminalCapabilityHelpers.ts` 中：

- `TERMINAL_RUNTIME_SURFACES` 仅为 `['runtime']`。
- terminal governance 默认 `allowInRemoteMcp: false`。
- terminal governance 默认 `allowInComposer: false`、`allowInNonInteractive: false`。

这说明 `terminal_run`、`terminal_script`、`terminal_shell`、`terminal_pty` 是 Alembic 内部 Agent runtime 工具，不是外部 MCP 工具，也不应被远程 MCP 直接调用。

相关代码：

- `lib/tools/adapters/terminal-capabilities/TerminalCapabilityHelpers.ts:3`
- `lib/tools/adapters/terminal-capabilities/TerminalCapabilityHelpers.ts:5`
- `lib/tools/adapters/terminal-capabilities/TerminalCapabilityHelpers.ts:49`
- `lib/tools/adapters/terminal-capabilities/TerminalCapabilityHelpers.ts:61`

### 3. 默认 bootstrap 只开启最小 terminal-run 档位

`BootstrapTerminalToolset` 的默认档位是 `terminal-run`：

- `baseline`：不启用终端工具。
- `terminal-run`：只启用 run。
- `terminal-shell`：启用 run + shell。
- `terminal-pty`：启用 run + shell + pty。

默认 `terminal-run` 在 analyze 阶段映射到 V2 工具名 `terminal`，produce 阶段不启用 terminal。evolve 阶段最多只会启用 `terminal` 和 `terminal_shell`，不会启用 `terminal_pty`。

策略提示也写明 terminal 只是 analyze/evolve 的可选代码分析证据工具，并明确禁止 installs、network operations、project writes、deletions、chmod/chown、sudo、daemons。

相关代码：

- `lib/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:17`
- `lib/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:35`
- `lib/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:51`
- `lib/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:72`

### 4. `code.search` 更适合代码库扫描定位

V2 `code` 工具已经提供专门的代码库交互能力：

- `code.search`：优先调用 `rg --json`。
- `code.read`：读取文件，长文件自动返回 outline 或片段。
- `code.outline`：通过 AST 获取结构。
- `code.structure`：生成目录树。

`code.search` 默认限制：

- 每次最多 10 个 pattern。
- 每次最多返回 50 条结果。
- `rg` 超时 15 秒。
- 排除 `.git`、`node_modules`、`dist`、`build`、`.next`、`coverage`、`.turbo` 等噪音目录。
- 如果 `rg` 失败，会降级到 Node 文件遍历和正则搜索。

这条链路比 terminal 更贴近“快速扫描查找定位信息”的实际需求。它不需要开放通用 shell，不需要 PTY，也不需要长期 session。

相关代码：

- `lib/tools/v2/handlers/code.ts:1`
- `lib/tools/v2/handlers/code.ts:47`
- `lib/tools/v2/handlers/code.ts:83`
- `lib/tools/v2/handlers/code.ts:119`
- `lib/tools/v2/handlers/code.ts:138`
- `lib/tools/v2/handlers/code.ts:174`

### 5. V2 `terminal.exec` 是内部 shell 执行工具，但边界比 code.search 更宽

V2 `terminal.exec` 接收 shell command string，执行流程是：

安全检查 → cwd 校验 → sandbox 或 plain exec → 输出压缩 → token budget 截断。

它的边界：

- cwd 必须在 projectRoot 内。
- timeout 默认 30 秒，最多 120 秒。
- 阻止 `sudo`、`su`、`rm -rf /`、`shutdown`、`reboot`、`mkfs`、`dd if=`、`chmod 777` 等危险命令。
- 阻止 `curl/wget | shell`。
- 优先使用注入的 `sandboxExecutor`。
- 未注入 sandboxExecutor 时才降级 plain exec。

当前 `ToolContextFactory` 总是注入 `SandboxExecutorBridge`，并用：

- `network: 'none'`
- `filesystem: 'project-write'`
- `/bin/sh -c <command>`

这意味着 V2 terminal 在内部 Agent runtime 中不是纯只读扫描工具，而是一个有项目写入能力声明的 shell 执行工具。即便策略提示不鼓励写入，它的默认 sandbox profile 仍然是 `project-write`。

相关代码：

- `lib/tools/v2/handlers/terminal.ts:21`
- `lib/tools/v2/handlers/terminal.ts:67`
- `lib/tools/v2/handlers/terminal.ts:73`
- `lib/tools/v2/handlers/terminal.ts:79`
- `lib/tools/v2/handlers/terminal.ts:81`
- `lib/tools/v2/handlers/terminal.ts:116`
- `lib/tools/v2/adapter/ToolContextFactory.ts:58`
- `lib/tools/v2/adapter/ToolContextFactory.ts:66`

### 6. terminal_run 策略本身是受控的

`terminal_run` 是结构化 execFile，而不是 shell string：

- `bin` 不能包含 shell meta。
- `args` 必须是字符串数组。
- cwd 必须在 projectRoot 内。
- 默认 `network: 'none'`。
- 默认 `filesystem: 'read-only'`。
- 默认 `interactive: 'never'`。

策略拒绝：

- `sudo`、`su`、`shutdown`、`reboot`、`halt`、`mkfs`、`dd`、`passwd`、`killall`。
- shell bin：`sh`、`bash`、`zsh`、`fish`、`osascript` 等。
- `rm -rf`。
- `network: 'open'`。
- `filesystem: 'workspace-write'`。
- interactive 命令。
- 持久化敏感环境变量。

因此，从设计上看，`terminal_run` 比 `terminal.exec` 更适合作为“必要时的最小终端能力”。

相关代码：

- `lib/tools/adapters/terminal-policy/TerminalRunPolicy.ts:24`
- `lib/tools/adapters/terminal-policy/TerminalRunPolicy.ts:55`
- `lib/tools/adapters/terminal-policy/TerminalRunPolicy.ts:75`
- `lib/tools/adapters/terminal-policy/TerminalRunPolicy.ts:94`
- `lib/tools/adapters/terminal-policy/TerminalRunPolicy.ts:108`
- `lib/tools/adapters/terminal-policy/TerminalRunPolicy.ts:116`
- `lib/tools/adapters/terminal-policy/TerminalRunPolicy.ts:124`

## 真实执行验证

### 验证命令 0：已安装插件环境逐级探针

为了避免只验证开发仓库或 Codex Agent 终端，新增了一个临时探针脚本：

```bash
scratch/verify-codex-plugin-terminal-boundary.mjs
```

执行时使用当前已安装插件 `.mcp.json` 中同一组插件环境变量，并把工作目录切到插件缓存目录：

```bash
ALEMBIC_CHANNEL_ID=codex \
ALEMBIC_PLUGIN_HOST=codex \
ALEMBIC_CODEX_ENABLE_ADMIN=0 \
ALEMBIC_CODEX_MCP_MODE=1 \
ALEMBIC_CODEX_PLUGIN_ROOT=. \
ALEMBIC_MCP_MODE=1 \
ALEMBIC_MCP_TIER=agent \
ALEMBIC_RUNTIME_MODE=plugin \
/Users/gaoxuefeng/.nvm/versions/node/v22.22.1/bin/node \
/Users/gaoxuefeng/Documents/github/Alembic/scratch/verify-codex-plugin-terminal-boundary.mjs \
/Users/gaoxuefeng/Documents/github/Alembic
```

当前安装插件的真实启动环境有一个额外注意点：插件缓存目录中的 `.mcp.json` 以插件目录为 cwd，但 MCP command 指向本仓库的 `dist/bin/codex-mcp.js`，因此这次验证覆盖的是“Codex 插件 env + 当前本地 dist runtime”。

逐级结果如下：

| 层级 | 验证项 | 结果 | 结论 |
| --- | --- | --- | --- |
| 0 | 插件 env | 通过 | cwd 是插件缓存目录，`ALEMBIC_RUNTIME_MODE=plugin`、`ALEMBIC_PLUGIN_HOST=codex`、`ALEMBIC_CHANNEL_ID=codex` 均存在。 |
| 1 | 插件进程 `child_process` 执行 Node | 通过 | `spawnSync(process.execPath, ...)` 返回 `execfile-ok`。Codex 没有禁止插件进程普通 child process。 |
| 2 | 插件进程 `/bin/sh -lc` | 通过 | `/bin/sh -lc 'printf shell-ok'` 返回 `shell-ok`。Codex 没有禁止插件进程启动非交互 shell。 |
| 3 | 插件进程调用 `rg` 扫项目 | 通过 | `rg --files -g package.json` 能在 Alembic 项目根目录返回匹配文件。代码库快速扫描能力可用。 |
| 4 | Alembic V2 `code.search` | 通过 | 内部 `code.search` 能用 `rg` 找到 `TerminalAdapter` 相关文件。 |
| 5 | V2 `terminal.exec`，不注入 sandboxExecutor | 通过 | 纯 plain exec fallback 返回 `terminal-plain-ok`。 |
| 6 | V2 `terminal.exec`，通过 `ToolContextFactory` 注入 Alembic sandbox | 受限 | 工具结果包装为 `ok: true`，但文本是 `[exit 71] sandbox-exec: sandbox_apply: Operation not permitted`，命令实际失败。 |
| 7 | legacy `TerminalAdapter` + enforce sandbox | 失败 | `ok: false`，`exitCode: 71`，stderr 为 `sandbox-exec: sandbox_apply: Operation not permitted`。 |
| 8 | legacy `TerminalAdapter` + `ALEMBIC_SANDBOX_MODE=disabled` | 通过 | 返回 `adapter-disabled-ok`，说明 TerminalAdapter 逻辑本身可用。 |
| 9 | `terminal_run` 策略执行 shell bin | 按策略拒绝 | `/bin/sh` 被 `shell-bin` 规则拒绝，这是 Alembic 自己的安全策略，不是 Codex 限制。 |

这组验证把 Codex 限制边界切得更清楚了：

- Codex 插件环境没有禁止 Alembic 插件进程启动普通 child process。
- Codex 插件环境没有禁止非交互 `/bin/sh -lc`。
- Codex 插件环境没有禁止插件进程调用 `rg` 扫描用户项目目录。
- 真正失败的是 Alembic 插件内部再次包一层 macOS `sandbox-exec`。
- 外部 MCP 工具层仍然没有 terminal 工具，因此这些能力只能是 Alembic 内部 runtime 能力，不能被 Codex Agent 直接当 MCP terminal tool 调用。

补充调用真实 MCP diagnostics：

```bash
alembic_codex_diagnostics({ projectRoot: "/Users/gaoxuefeng/Documents/github/Alembic" })
```

结果中 `node`、`npm`、`npx` 均为可用：

```text
node.ok = true
npm.available = true
npx.available = true
```

这说明真实运行中的 Alembic MCP 插件进程至少能执行诊断所需的本地命令。当前 diagnostics 的唯一错误是插件 runtime pin 配置不匹配，不是终端执行权限问题。

### 验证命令 1：策略与默认档位

```bash
npx vitest run test/unit/BootstrapTerminalToolset.test.ts test/unit/TerminalCommandPolicy.test.ts test/unit/TerminalAdapter.test.ts test/unit/SandboxEnvironment.test.ts test/unit/SandboxPolicy.test.ts
```

结果：

- `SandboxEnvironment.test.ts` 通过。
- `SandboxPolicy.test.ts` 通过。
- `BootstrapTerminalToolset.test.ts` 通过。
- `TerminalCommandPolicy.test.ts` 通过。
- `TerminalAdapter.test.ts` 失败 12 项。

失败原因一致指向真实执行阶段：

```text
sandbox-exec: sandbox_apply: Operation not permitted
exitCode: 71
```

结论：终端策略、默认档位、沙箱 profile 规则都能通过；但当前 Codex Desktop 环境里，Alembic 再套 macOS `sandbox-exec` 做内部命令执行会被系统/宿主环境拦截。

### 验证命令 2：关闭 Alembic 自己的 Seatbelt 沙箱

```bash
ALEMBIC_SANDBOX_MODE=disabled npx vitest run test/unit/TerminalAdapter.test.ts
```

结果：

```text
Test Files  1 passed
Tests       20 passed
```

结论：`TerminalAdapter` 逻辑本身可执行；真正不稳定的是 Codex Desktop 环境里叠加 Alembic 自己的 macOS Seatbelt sandbox。关闭 Alembic 内部 sandbox 后，execFile、shell、pty、session、audit 相关测试都能通过。

## 当前可用能力分级

### 可靠可用

Codex Agent 侧终端：

- 可用于开发 Alembic 仓库。
- 可运行 `rg`、`sed`、`git`、`npm`、`npx vitest` 等。
- 受 Codex 会话沙箱和审批机制限制。
- 不是 Alembic 插件内部 API。

Alembic MCP 状态/初始化/任务工具：

- 可解析显式 projectRoot。
- 当前也能读取 saved-project-root。
- 不暴露 terminal 工具。
- diagnostics 内部可以执行 `node`、`npm`、`npx` 探测。

Alembic 插件进程普通 child process：

- 可执行 Node 子进程。
- 可执行非交互 `/bin/sh -lc`。
- 可执行 `rg` 对用户项目目录进行快速扫描。
- 这不是外部 MCP 暴露能力，而是插件进程内部实现能力。

Alembic 内部代码扫描工具：

- `code.search`、`code.read`、`code.outline`、`code.structure` 是更合适的代码库扫描入口。
- 依赖可信 projectRoot。
- 优先 `rg`，失败后降级文件遍历。

### 条件可用

Alembic 内部 `terminal_run`/`TerminalAdapter`：

- 在 `ALEMBIC_SANDBOX_MODE=disabled` 时验证通过。
- 在非 Codex Desktop 或不受嵌套 Seatbelt 限制的宿主环境中可能可用。
- 适合作为受控、结构化、短时、非交互命令能力。

V2 `terminal.exec`：

- 不注入 sandboxExecutor 时 plain exec fallback 验证通过。
- 通过 `ToolContextFactory` 注入 Alembic sandbox 后，在当前 Codex Desktop 环境返回 `[exit 71] sandbox-exec: sandbox_apply: Operation not permitted`。

### 不应作为可靠默认能力

Codex Desktop 插件环境中的 Alembic Seatbelt-wrapped terminal：

- 默认 enforce 模式下真实执行失败，错误为 `sandbox_apply: Operation not permitted`。
- 不适合作为 Codex 插件默认依赖链路。

`terminal_shell` / `terminal_script` / `terminal_pty`：

- 能力面太宽。
- 需要 shell/PTY/脚本物化。
- 更容易触发宿主沙箱、权限、交互、输出审计等复杂边界。
- 对“代码扫描查找定位信息”不是必要能力。

网络代理、监听端口、长期 session：

- 与当前 Codex Desktop 沙箱边界冲突风险高。
- 不适合作为核心默认能力。

## 对清理方向的判断

如果 Alembic 的主要终端使用场景是代码库快速扫描、查找和定位信息，那么不需要保留完整通用终端系统。

建议保留和强化：

- `code.search`
- `code.read`
- `code.outline`
- `code.structure`
- 必要时保留一个受控 `terminal_run`，但只作为 fallback 或明确授权能力。

建议收缩或移除默认链路：

- `terminal_shell`
- `terminal_script`
- `terminal_pty`
- 长期 terminal session
- sandbox network proxy
- 依赖 macOS `sandbox-exec` 的 Codex 插件默认执行路径

更稳的产品边界是：

1. Codex Agent 使用自己的终端完成强力开发验证。
2. Alembic 插件内部使用只读代码扫描工具收集证据。
3. Alembic 插件只有在确实需要运行命令时，才通过受控 `terminal_run` 或宿主适配层执行。
4. 没有可信 projectRoot 时，不执行扫描、不执行终端，直接向 Agent/用户抛出需要提供项目目录。

## 最终边界判定

Alembic 插件可用终端能力不是“完整 Codex 终端”，而是：

- 外部 MCP 层：无 terminal 工具。
- 插件进程层：Codex 没有禁止普通 child process、非交互 shell、`rg` 项目扫描。
- 内部 Agent runtime：有代码扫描工具，有 V2 `terminal.exec`，也有 runtime-only `terminal_run/script/shell/pty` 能力。
- Codex Desktop 环境：内部 terminal 若依赖 Alembic 自己的 Seatbelt sandbox，真实执行会失败；不走 Alembic sandbox 或关闭 Alembic sandbox 后终端执行通过。
- 对代码库扫描：应优先走 `code.search/read/outline/structure`，而不是走 shell。

因此，当前准确边界是：Alembic 作为 Codex 插件可以使用足够强的本地命令能力完成代码库扫描，但这应被收敛为 `code.search/read/outline/structure` 这类项目内只读扫描能力。不要把 Alembic 自己的 Seatbelt-wrapped 通用终端、PTY、脚本、网络代理作为 Codex 插件模式的稳定默认能力。
