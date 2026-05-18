# Codex 插件安装后初始化链路审计

日期：2026-05-13

范围：Alembic Codex 插件从用户点击安装、依赖安装、MCP 启动，到 Alembic workspace 初始化的当前实现与风险边界。

不在本次范围：mainline 相关设计、Lark Remote 清理、Dashboard 功能改造。

## 结论

当前代码中，Codex 插件安装后不会自动执行 Alembic 初始化。安装完成后的实际行为是：Codex 按 `.mcp.json` 启动 `npx --package ./runtime.tgz alembic-codex-mcp`，MCP shim 启动后只暴露 `alembic_codex_status`、`alembic_codex_diagnostics`、`alembic_codex_init` 这组冷启动工具；真正的 Alembic 初始化要等用户或 Agent 调用 `alembic_codex_init`。

建议目标不是“插件/MCP 一启动就静默初始化”，而是两条有明确意图的初始化路线：用户主动调用 `alembic_codex_init` 时初始化；用户调用其他 Alembic 功能时，如果还没初始化，就先安全 Ghost init，再继续原功能。`status`、`diagnostics`、`tools/list` 保持只读观察，不触发写盘。

`alembic_codex_init` 本身走的是正确的 Codex profile：默认 Ghost mode、跳过 IDE 文件部署、不启动 daemon、不自动 bootstrap。它会创建运行时目录、知识库目录、SQLite 数据库、迁移表结构，并给出下一步 bootstrap/job 建议。

目前最大的阻塞不是 `SetupService` 能不能初始化，而是插件运行时如何可靠拿到用户项目根目录。`.mcp.json` 没有显式传 `ALEMBIC_PROJECT_DIR` 或 `CODEX_WORKSPACE_DIR`，`CodexMcpServer` 会 fallback 到 `INIT_CWD`、`PWD`、`process.cwd()`。在真实安装环境里，`cwd` 很可能是插件安装目录；本机 `alembic_codex_status` 实测也解析到了 `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.0`，而不是当前 Alembic 工作区。这意味着如果现在直接做“依赖安装后自动 init”，有把插件缓存目录初始化成 Alembic 项目的风险。

因此，按需初始化可以做，但必须先补一层“目标项目根目录可信”门禁。没有可信用户项目根目录时，应返回明确的 `project_root_unresolved` 诊断，而不是 fallback 到插件目录。

## 当前安装链路

1. Codex marketplace 指向插件：
   - 主仓库 marketplace：`.agents/plugins/marketplace.json`
   - 独立插件仓库 marketplace：`plugins/alembic-codex/.agents/plugins/marketplace.json`
   - 插件 manifest：`plugins/alembic-codex/.codex-plugin/plugin.json`

2. 插件 manifest 声明：
   - `skills: "./skills/"`
   - `mcpServers: "./.mcp.json"`
   - 默认 prompt 包含 diagnostics、status、init、bootstrap、prime、guard。

3. MCP 启动配置来自 `plugins/alembic-codex/.mcp.json`：
   - command: `npx`
   - args: `-y --package ./runtime.tgz alembic-codex-mcp`
   - cwd: `.`
   - env: `ALEMBIC_CHANNEL_ID=codex`、`ALEMBIC_PLUGIN_HOST=codex`、`ALEMBIC_RUNTIME_MODE=plugin`、`ALEMBIC_MCP_TIER=agent`、`ALEMBIC_CODEX_ENABLE_ADMIN=0` 等。

4. `npx` 安装/解析本地 `runtime.tgz` 和生产依赖后，执行 `alembic-codex-mcp`。

5. `bin/codex-mcp.ts` 调用 `ensureCodexRuntimeEnvironment()`，再启动 `CodexMcpServer`。这一步只启动轻量 MCP server，不初始化 Alembic workspace，不启动 daemon。

6. `CodexMcpServer.start()` 注册 tools/list 与 tools/call handlers。工具可见性由 `inspectCodexKnowledge(projectRoot)` 和 `resolveCodexToolPolicy()` 决定。

## 当前 projectRoot 解析

`CodexMcpServer` 构造时使用：

```ts
projectRoot ||
process.env.ALEMBIC_PROJECT_DIR ||
process.env.CODEX_WORKSPACE_DIR ||
process.env.INIT_CWD ||
process.env.PWD ||
process.cwd()
```

这对 CLI 测试友好，但对 Codex 市场插件安装不够安全。插件 `.mcp.json` 的 `cwd` 是插件根目录，且没有声明目标项目路径。如果 Codex host 没有额外注入 `CODEX_WORKSPACE_DIR`，fallback 会把插件安装目录当成用户项目。

本机实测 `alembic_codex_status` 返回的 `projectRoot` 是：

```text
/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.1.0
```

同时 diagnostics 中 npm/npx 报 `uv_cwd`，说明当前 MCP 进程的工作目录还可能指向一个已不存在或不完整的插件缓存目录。这不是 Alembic 初始化失败，而是插件运行时目标目录和宿主生命周期没有稳定绑定。

## 当前初始化动作

`alembic_codex_init` 调用 `CodexMcpServer.initializeWorkspace()`，内部创建：

```ts
new SetupService({
  projectRoot: this.projectRoot,
  force: Boolean(args.force),
  seed: Boolean(args.seed),
  ghost: args.standard !== true,
  profile: CODEX_SETUP_PROFILE,
  quiet: true,
})
```

Codex profile 的 `SetupService.getSteps()` 当前包含 5 步：

| 顺序 | 步骤 | 当前行为 |
| --- | --- | --- |
| 1 | 创建运行时目录与配置 | 创建 Ghost dataRoot 下的 `.asd/` 与 `.asd/config.json` |
| 2 | 初始化知识库与 recipes | 创建 `Alembic/`、`Alembic/recipes/`、`Alembic/candidates/`、`Alembic/skills/`，写入 constitution、boxspec、recipe template、README；`seed=true` 时写入示例 Recipe |
| 3 | 初始化数据库 | 设置 `ALEMBIC_PROJECT_DIR`、切换 cwd、配置 PathGuard，执行 `Bootstrap.initialize()`、数据库迁移、Recipe 文件同步到 DB |
| 4 | 平台相关初始化 | 当前返回 `{ skipped: true }` |
| 5 | 初始化向量索引 | best-effort；有 embedding provider 时尝试构建，没有 API key 或服务未注册时跳过，不阻塞 setup |

Codex profile 不执行 `stepIDE()`，所以不会写 `.vscode/mcp.json`、`.cursor/`、rules、hooks 等项目内 IDE 文件。这符合 Ghost mode 的零项目侵入目标。

初始化完成后，status 的期望状态是：

- `initialized: true`
- `workspace.ghost: true`
- 如果还没有 Recipe 或 Project Skill：`onboarding.state = needs_bootstrap`
- 下一步建议：`alembic_codex_bootstrap` 与 `alembic_codex_job`

## 现有正确性保障

已有测试和 release smoke 覆盖了理想路径：

- `scripts/smoke-codex-plugin.mjs` 模拟 marketplace 安装，验证 fresh workspace 一开始是 `needs_init`。
- 同一 smoke 调用 `alembic_codex_init`，断言初始化后 `initialized=true`、`workspace.ghost=true`、下一步推荐 bootstrap。
- stdio smoke 验证真实 MCP client 连接后，fresh project 只暴露 `status`、`diagnostics`、`init`。
- 初始化后但知识为空时，只暴露 cold-start 工具：`status`、`diagnostics`、`init`、`bootstrap`、`job`，不暴露 `alembic_task` / `alembic_health`。
- `test/unit/CodexMcpServer.test.ts` 覆盖工具可见性、Ghost dataRoot 识别、admin 双门禁、status 不启动 daemon。
- `test/unit/CodexStatusService.test.ts` 覆盖 needs-init 和 initialized-empty onboarding。
- `test/unit/CodexRuntimeContext.test.ts` 覆盖插件 runtime identity、plugin registry、embedded runtime 诊断。

这些保障证明：当 `projectRoot` 被正确传入时，初始化流程是可工作的。

## 缺口与风险

### P0：安装后不会自动初始化

如果目标体验是“用户点击安装，依赖装完后 Alembic 自动完成基础初始化”，当前实现不满足。现在必须由 Agent 根据 status/onboarding 主动调用 `alembic_codex_init`。

### P0：自动 init 前缺少可信项目根目录

这是自动初始化前必须先修的边界。现状依赖环境变量，但 `.mcp.json` 没传用户项目目录；fallback 到 `PWD`/`process.cwd()` 在插件宿主场景下不可信。

风险结果：

- 初始化到插件缓存目录。
- `~/.asd/projects.json` 注册了错误项目。
- Ghost dataRoot 绑定到插件安装路径 hash。
- 用户真实项目没有初始化，但 status 看起来是在检查另一个“项目”。

### P1：测试没有覆盖“host 没传项目目录”的真实安装场景

`smoke:codex-plugin` 的 stdio 和 npx runtime smoke 都显式注入了：

```text
ALEMBIC_PROJECT_DIR=<tmp project>
CODEX_WORKSPACE_DIR=<tmp project>
```

这证明有 env 时可用，但没有证明真实 Codex host 安装后一定会提供 env。需要加一组缺失 env 的负向测试，确保不会误初始化插件根目录。

### P1：diagnostics 的 projectRoot 与 pluginRoot 没有明确分离诊断

现在 diagnostics 会检查 runtime、plugin manifest、npm/npx、daemon，但没有专门表达“目标项目根目录未解析/疑似插件根目录”。这会把根因混进 npm/npx 或 workspace 未初始化问题里。

### P2：Codex profile 的 CLI summary 仍提到 `alembic_health`

`SetupService.printSummary()` 在 Codex profile 下提示调用 `alembic_health`，但 fresh initialized empty workspace 中 project-knowledge tools 仍然隐藏，直到有 Recipe 或 Project Skill。这不影响 MCP quiet init，但 CLI 文案会误导。

### P2：wikiDir 只在 status 中报告路径，setup 不创建

`WorkspaceResolver` 有 `wikiDir`，status 返回该路径，但 `stepCoreRepo()` 当前只创建 `coreDir`、`recipesDir`、`candidatesDir`、`skillsDir`。这不是安装初始化的阻塞项，但如果后续期望 status 中所有 workspace 目录都可落地，应补齐。

## 建议改造边界

### 1. 先做项目根目录门禁

新增一个 Codex target project resolver，至少区分三类路径：

- trusted：来自 `ALEMBIC_PROJECT_DIR` 或 Codex host 明确传入的 `CODEX_WORKSPACE_DIR`。
- fallback：来自 `INIT_CWD`、`PWD`、`process.cwd()`。
- rejected：插件根目录、`~/.codex/plugins/cache/**`、不存在的 cwd、Alembic runtime package root。

Codex plugin runtime 下，`alembic_codex_init` 和未来 auto-init 只能接受 trusted root。没有 trusted root 时：

- `alembic_codex_status` 返回 `onboarding.state = project_root_unresolved`。
- `alembic_codex_diagnostics` 增加 issue：`CODEX_PROJECT_ROOT_UNRESOLVED`。
- `alembic_codex_init` 返回明确错误和 next action，不写任何数据。

### 2. 再做按需初始化，不做 MCP 启动即写盘

如果确认 Codex 插件没有独立 post-install hook，初始化应该绑定到两条有明确用户意图的路线，而不是 MCP server 一启动就写盘：

- 路线 A：用户或 Agent 主动调用 `alembic_codex_init`。
- 路线 B：用户调用其他需要 Alembic workspace 的功能时，如果 workspace 尚未初始化，先自动执行一次安全 Ghost init，再继续原功能。

`alembic_codex_status`、`alembic_codex_diagnostics`、`tools/list` 保持只读，不触发写盘初始化。它们只报告“是否需要初始化”和“如果现在调用功能是否会先初始化”。

按需初始化触发条件：

- runtime identity 是 `ALEMBIC_RUNTIME_MODE=plugin` 且 `ALEMBIC_PLUGIN_HOST=codex`。
- target project root 是 trusted。
- diagnostics 的 runtime/package/plugin metadata 通过。
- `inspectCodexKnowledge(projectRoot).initialized === false`。
- projectRoot 不在 rejected 范围。
- 当前 tool 属于 init-on-demand allowlist，且不是 status/diagnostics/list/cleanup 这类只读或危险工具。

路线 B 的自动初始化动作只允许：

```ts
SetupService({
  projectRoot,
  ghost: true,
  profile: 'codex-plugin',
  quiet: true,
  seed: false,
})
```

不要自动 bootstrap，不要启动 daemon，不要写 IDE 文件，不要 seed 示例 Recipe。原功能如果本身会启动 daemon，例如 dashboard/bootstrap/rescan，必须在 Ghost init 成功后再按原 tool 语义继续。

`tools/list` 本身不写盘，但为了让路线 B 可达，未初始化且 root trusted 时可以暴露“可按需初始化”的功能工具；这些工具的 description/annotations 应明确说明：首次调用会先执行 Ghost init。没有 trusted root 时仍只暴露 status/diagnostics/init，并让 init fail closed。

### 3. 初始化要幂等且可观测

建议在 Ghost dataRoot 写一个轻量 marker，例如：

```text
.asd/codex-init.json
```

内容记录：

- `initializedAt`
- `initializedBy: "codex-plugin-auto" | "alembic_codex_init" | "cli"`
- `pluginVersion`
- `projectRoot`
- `dataRoot`
- `results`

status 可以展示最近初始化来源，方便区分自动初始化与手动 init。

### 4. 测试补齐

建议新增/扩展：

- `CodexProjectRootResolver.test.ts`
  - 有 `ALEMBIC_PROJECT_DIR` 时 trusted。
  - 只有 `CODEX_WORKSPACE_DIR` 时 trusted。
  - 只有 `PWD=插件根目录` 时 rejected。
  - cwd 不存在时 rejected。

- `CodexMcpServer.test.ts`
  - missing trusted project root 时不暴露 `alembic_codex_init` 或 init 调用不写数据。
  - 调用 init-on-demand tool 时，fresh trusted project 先变成 initialized ghost workspace，再继续原 tool。
  - auto-init 不启动 daemon。
  - `tools/list`、status、diagnostics 不触发初始化写盘。

- `smoke:codex-plugin`
  - 保留当前 happy path。
  - 增加 `--no-project-env` 负向路径，确保不会初始化 installed plugin root。

## 推荐实施顺序

1. 提取 Codex target project resolver，加入 plugin-root / cache-root 拒绝规则。
2. diagnostics/status 增加 project root health block。
3. 让 `alembic_codex_init` 在 project root unresolved 时 fail closed。
4. 补负向测试，证明不会写插件目录。
5. 接入 init-on-demand allowlist，默认只在 trusted root 且 diagnostics ok 时运行 Ghost init。
6. 确认 status/diagnostics/tools-list 只读。
7. 最后把 `smoke:codex-plugin` 扩到真实 `npx --package ./runtime.tgz` 无 env 场景。

## 当前判断

Alembic 初始化能力已经存在，且在测试传入正确 projectRoot 时行为正确。真正需要处理的是 Codex 插件安装后的“自动触发时机”和“目标项目根目录可信性”。在根目录可信性没有解决前，不应直接把 `alembic_codex_init` 挂到依赖安装后自动执行，否则会把安装目录或插件缓存目录初始化成 Alembic workspace。

## 联网调研补充：插件安装后自动初始化

用户目标是“插件安装好、依赖安装完成后，Alembic 自动执行初始化”。截至 2026-05-13 的公开资料和本地插件实现看下来，Codex 插件层没有一个可靠、已落地的“post install / after dependency install”生命周期 API。可落地方案应放在 Alembic 自己的 MCP server 内部：当用户主动调用初始化，或调用其他 Alembic 功能且 workspace 尚未初始化时，在可信项目根目录上先执行一次 Ghost mode 初始化。

### 公开规范与 API 事实

1. Codex 插件 manifest 支持的主要能力边界是 `skills`、`mcpServers`、`apps`，示例 spec 里还出现了 `hooks` 字段，但没有看到独立的 `postInstall`、`onInstall`、`afterDependencyInstall` 或类似安装生命周期字段。本地 Plugin Creator 参考 spec 也只列出这些字段。

2. OpenAI 官方插件仓库中的 `build-ios-apps` 使用 `.codex-plugin/plugin.json` + `.mcp.json`，通过 `npx xcodebuildmcp@latest mcp` 暴露 MCP server，没有安装完成后的初始化命令。公开文件：
   - https://raw.githubusercontent.com/openai/plugins/main/plugins/build-ios-apps/.codex-plugin/plugin.json
   - https://raw.githubusercontent.com/openai/plugins/main/plugins/build-ios-apps/.mcp.json

3. Figma 插件 manifest 只声明 `skills` 和 `apps`，没有声明 `mcpServers` 或 `hooks`；仓库里虽然有 `hooks.json`，但公开 manifest 并未把它接入插件能力。公开文件：
   - https://raw.githubusercontent.com/openai/plugins/main/plugins/figma/.codex-plugin/plugin.json
   - https://raw.githubusercontent.com/openai/plugins/main/plugins/figma/hooks.json

4. OpenAI Codex issue #17331 明确指出：插件 manifest/spec 看起来支持 `hooks`，但当前 runtime 没有把 plugin-scoped hooks 加载进 Codex hooks runtime；插件实际可贡献的是 skills、MCP servers、apps。这个 issue 说明即使 Alembic 增加 `hooks: "./hooks.json"`，也不能把“安装后自动初始化”建立在 plugin-local hooks 上。
   - https://github.com/openai/codex/issues/17331

5. MCP 规范的生命周期只有连接初始化、能力协商、正常运行、关闭。初始化阶段由 client 发送 `initialize`，server 返回 capabilities，随后 client 发送 `notifications/initialized`。工具能力通过 `tools/list` 发现，通过 `tools/call` 调用。规范没有插件安装事件，也没有 dependency-install-complete 事件。
   - https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle
   - https://modelcontextprotocol.io/specification/2025-06-18/server/tools

结论：不要把自动初始化设计成 Codex plugin install hook，也不要在 MCP server 启动时静默写盘。应把它设计成 Alembic MCP server 的按需初始化能力。

### 其他插件实现观察

本机已安装插件与公开插件基本一致：它们把“安装”当作能力注册，把“运行时准备”放在 MCP server 或显式 setup tool 里。

| 插件 | 实现方式 | 对 Alembic 的启发 |
| --- | --- | --- |
| `build-ios-apps` | manifest 声明 `skills` 和 `.mcp.json`；`.mcp.json` 用 `npx xcodebuildmcp@latest mcp` 启动 server | 没有 post-install 初始化；依赖解析完成后即进入 MCP server 生命周期 |
| `figma` | manifest 声明 `skills` 和 `apps`；本地存在 `hooks.json`，但 manifest 未接入 hooks | hooks 不能作为安装初始化依据 |
| `codex-lark-remote` | manifest 声明 `skills` 和 `.mcp.json`；MCP server 暴露 `codex_lark_configure`、`codex_lark_start`、`codex_lark_handoff`、`codex_lark_status` 等显式工具 | 需要配置/状态类能力时，插件倾向暴露 MCP setup/status tools，而不是安装时静默写状态 |

Alembic 和这些插件不同的是：Alembic 的基础初始化是本地项目工作区状态的一部分，且用户明确要求自动完成。因此 Alembic 可以比 Lark Remote 更主动，但主动性应绑定到用户初始化意图或功能调用意图；不能依赖 Codex host 私有安装 hook，也不能让只读探针触发写盘。

### Codex 工作区路径风险

公开 issue 显示 Codex/Codex VS Code 对 MCP server 的 cwd 和 workspace root 传递长期存在不稳定边界：

- issue #9989 讨论“把 workspace directory 传给 MCP servers”，并提到 MCP 进程 cwd 可能不是用户项目目录；建议在 tool-call 时使用 `CODEX_WORKSPACE_ROOT` 或 client 传入的 cwd。
  - https://github.com/openai/codex/issues/9989
- issue #14573 反馈 Codex app / VS Code 场景中本地路径与 MCP 启动目录不一致，导致相对路径解析失败。
  - https://github.com/openai/codex/issues/14573
- issue #4222 同样指出 MCP servers 没有从 VS Code workspace folder 启动，并建议捕获 `CODEX_WORKSPACE_ROOT` 或显式 workspace cwd。
  - https://github.com/openai/codex/issues/4222

本机 Alembic 插件实测也印证了这个风险：`alembic_codex_status` 在当前会话里把 `projectRoot` 解析到 `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.0`，不是当前 Alembic 仓库；诊断还显示插件 cache 版本/路径不一致。这说明“依赖安装完成后立即 init”如果使用 `cwd` fallback，会初始化错误位置。

## 推荐实现方案：两条按需初始化路线

目标行为：

用户安装 Alembic 插件后，插件本身不在 MCP server 启动时静默写盘。初始化只在两类明确场景发生：

1. 用户或 Agent 主动调用 `alembic_codex_init`。
2. 用户调用其他 Alembic 功能时，如果 workspace 尚未初始化，则先执行一次安全 Ghost init，再继续原功能。

两条路线的默认初始化都等价于：

```ts
new SetupService({
  projectRoot,
  force: false,
  seed: false,
  ghost: true,
  profile: 'codex-plugin',
  quiet: true,
}).run()
```

不自动 bootstrap，不自动启动 daemon，不写 IDE 配置，不创建示例 Recipe，不执行 Lark Remote 或 mainline 相关逻辑。

### 路线 A：主动初始化

当用户或 Agent 调用 `alembic_codex_init` 时：

- 先解析并校验 trusted project root。
- root rejected/unresolved 时返回结构化错误，不写任何文件。
- workspace 已初始化且 `force !== true` 时返回 `alreadyInitialized: true`，并附当前 status/nextActions。
- `force: true` 只在用户显式传入时生效；自动路线永远不设置 force。
- `standard: true` 只在用户显式传入时生效；自动路线永远使用 Ghost mode。
- 初始化成功后写 marker，`initializedBy = "alembic_codex_init"`。

### 路线 B：功能调用前按需初始化

当用户调用其他功能时，`CodexMcpServer.handleToolCall()` 在执行原功能前先调用 `ensureWorkspaceInitializedForTool(name, args)`。如果 workspace 未初始化且 tool 属于 init-on-demand allowlist，则先跑 Ghost init，再继续处理原 tool。

建议 allowlist：

- `alembic_codex_dashboard`
- `alembic_codex_bootstrap`
- `alembic_codex_rescan`
- `alembic_codex_job`
- daemon-backed project knowledge tools，例如 `alembic_guard`、`alembic_prime`、`alembic_task`，前提是这些工具在当前 tier/policy 下本来允许。

明确 denylist：

- `alembic_codex_status`
- `alembic_codex_diagnostics`
- `tools/list`
- `alembic_codex_cleanup`
- `alembic_codex_stop`
- 任何 admin tool

路线 B 的执行语义：

1. 只做 `force: false`、`seed: false`、`ghost: true`、`quiet: true`。
2. 初始化失败时不继续原功能，返回 `CODEX_AUTO_INIT_FAILED`。
3. 初始化成功后重新读取 `inspectCodexKnowledge(projectRoot)`，再走原来的知识门禁和 tool policy。
4. 如果原功能还需要 Recipe/Project Skill，但 Ghost init 后知识库仍为空，仍按现有 gate 返回 needs_bootstrap，不伪装成知识可用。
5. 原功能本身如果会启动 daemon，例如 dashboard/bootstrap/rescan，只能在 Ghost init 成功后继续启动。

`tools/list` 保持只读，但为了让路线 B 可达，未初始化且 root trusted 时应暴露 init-on-demand allowlist 中的功能工具，并在 description/annotation 中说明“首次调用会先初始化 Ghost workspace”。没有 trusted root 时，仍只暴露 status/diagnostics/init。

### 方案取舍

| 方案 | 判断 | 原因 |
| --- | --- | --- |
| 插件 `postInstall` hook | 不采用 | 未发现可靠公开 API；plugin-local hooks 当前也有 runtime 不加载的 issue |
| 插件 `hooks.json` 的 SessionStart | 不采用 | hooks 不是安装事件，且 plugin-scoped hooks 当前不可靠 |
| `defaultPrompt` / Skill 引导 Agent 调用 `alembic_codex_init` | 只能作为兜底 | 依赖 Agent 行为，不满足“自动执行初始化” |
| MCP server 启动时自动 init | 不采用 | 启动不是用户功能意图；status/diagnostics 探针也可能触发 MCP 启动，容易出现无意写盘 |
| `tools/list` 前 lazy init | 不采用 | tools/list 是发现协议，应保持只读；可以调整可见工具，但不初始化 |
| 主动 init + 功能调用前 init-on-demand | 推荐主路径 | 用户意图清楚；能满足“调用其他功能时自动补初始化”；也能保持 status/diagnostics 纯观察 |

建议做成“两路线触发”：

1. `alembic_codex_init` 走 `initializeWorkspace({ route: "explicit" })`。
2. 非只读功能 tool 的 `tools/call` 入口走 `ensureWorkspaceInitializedForTool(name, { route: "tool-call" })`。

这两个入口必须共享 singleflight/lock，避免主动 init 和功能调用并发触发重复 setup。

### 必须先补的项目根目录解析器

新增 `CodexProjectRootResolver`，不要继续让 Codex plugin runtime 裸用：

```ts
process.env.ALEMBIC_PROJECT_DIR ||
process.env.CODEX_WORKSPACE_DIR ||
process.env.INIT_CWD ||
process.env.PWD ||
process.cwd()
```

建议返回结构：

```ts
interface CodexResolvedProjectRoot {
  path: string | null;
  source:
    | 'explicit-option'
    | 'ALEMBIC_PROJECT_DIR'
    | 'CODEX_WORKSPACE_DIR'
    | 'CODEX_WORKSPACE_ROOT'
    | 'tool-call-cwd'
    | 'INIT_CWD'
    | 'PWD'
    | 'process.cwd';
  trust: 'trusted' | 'fallback' | 'rejected';
  reason: string;
}
```

Codex plugin runtime 下，自动 init 只接受 `trusted`：

- `explicit-option`：测试或内部调用传入。
- `ALEMBIC_PROJECT_DIR`：Alembic 明确项目目录。
- `CODEX_WORKSPACE_DIR` / `CODEX_WORKSPACE_ROOT`：Codex host 明确工作区目录。
- `tool-call-cwd`：只有当 SDK/host 明确在 request metadata 中提供，并且不是插件目录时才可信。

以下必须 rejected：

- `~/.codex/plugins/cache/**`
- Alembic 插件根目录。
- Alembic runtime package root。
- 不存在的目录。
- 当前用户 home、`/`、`/tmp` 这类非项目目录。
- 只有 `INIT_CWD` / `PWD` / `process.cwd()` 且位于插件 cache 或 npx cache。

只有 fallback 时，`status` 和 `diagnostics` 可以报告路径候选，但不能初始化。

### Init-on-demand 运行护栏

主动 init 与功能调用前 init-on-demand 都必须满足这些护栏：

1. `ALEMBIC_RUNTIME_MODE=plugin`。
2. `ALEMBIC_PLUGIN_HOST=codex`。
3. target project root 为 trusted。
4. target project root 不在 rejected path 集合。
5. `inspectCodexKnowledge(projectRoot).initialized === false`。
6. diagnostics 中插件 manifest / MCP / assets / skills 基础检查通过；npm/npx 检查失败不一定阻塞，因为当前进程已经由 npx 成功启动，但要记录 warning。
7. 没有正在运行的同项目 setup lock。
8. 路线 B 的 tool 在 init-on-demand allowlist 中。
9. 自动路线不得传入 `force`、`standard`、`seed`。
10. 初始化 marker 只能在全部 step 成功后写入。

失败策略：fail closed。init-on-demand 失败不能继续执行原功能，应在 tool result、`status`、`diagnostics` 中展示：

- `autoInit.attempted`
- `autoInit.ok`
- `autoInit.reason`
- `autoInit.source`
- `autoInit.lastError`
- `autoInit.lastAttemptedAt`

并发策略：

- 进程内用 singleflight promise 合并并发初始化。
- dataRoot 内写 lock/attempt marker，防止多 MCP 进程同时初始化同一项目。
- 同一个 projectRoot 的显式 init 与 init-on-demand 共享锁。
- 如果已有初始化正在运行，后到请求等待同一个结果；超时后返回 `CODEX_INIT_IN_PROGRESS`，不另开一次 setup。

### 初始化 marker

建议写入 Ghost dataRoot：

```text
.asd/codex-init.json
```

内容：

```json
{
  "schemaVersion": 1,
  "initializedAt": "2026-05-13T00:00:00.000Z",
  "initializedBy": "alembic_codex_init",
  "route": "explicit",
  "projectRoot": "/abs/project",
  "dataRoot": "/abs/data-root",
  "profile": "codex-plugin",
  "ghost": true,
  "pluginVersion": "0.1.1",
  "results": []
}
```

功能调用前自动初始化时，`initializedBy` 使用 `codex-plugin-init-on-demand`，`route` 使用 `tool-call`，并额外记录 `requestedTool`。这样 status 可以区分“用户主动初始化”和“调用功能时自动补初始化”。

### Status / diagnostics 调整

`alembic_codex_status` 增加：

```ts
projectRootResolution: {
  path,
  source,
  trust,
  reason,
  rejected,
  userMessage,
  requiredActions,
}
autoInit: {
  enabled,
  attempted,
  ok,
  skippedReason,
  route,
  requestedTool,
  markerPath,
  markerExists,
}
```

`alembic_codex_diagnostics` 增加 issue：

- `CODEX_PROJECT_ROOT_UNRESOLVED`：没有 trusted root。
- `CODEX_PROJECT_ROOT_REJECTED`：root 是 plugin cache / runtime root / 非项目目录。
- `CODEX_AUTO_INIT_FAILED`：自动 init 尝试失败。
- `CODEX_AUTO_INIT_SKIPPED_UNTRUSTED_ROOT`：只拿到 fallback root，主动跳过。

`alembic_codex_init` 手动调用也必须走同一个 resolver。在 Codex plugin runtime 下，如果没有 trusted root，返回结构化错误，不写任何文件。错误必须向上抛给 agent / 用户，明确说明：

- Alembic Codex 无法确定目标项目目录，因此项目工作流暂时不可用。
- 需要提供目标项目的绝对路径。
- 可通过显式 `projectRoot`、`ALEMBIC_PROJECT_DIR`、`CODEX_WORKSPACE_DIR` 或 `CODEX_WORKSPACE_ROOT` 提供。

结构化错误应包含 `needsUserInput: true`、`required.projectRoot = "absolute path"`、`requiredActions[]`，让 agent 可以直接转述给用户，而不是把插件 cache、cwd 或 runtime root 当成项目目录继续执行。

### 推荐代码落点

| 文件 | 调整 |
| --- | --- |
| `lib/codex/ProjectRootResolver.ts` | 新增 resolver、trusted/rejected 规则、marker path helper |
| `lib/external/mcp/CodexMcpServer.ts` | 构造函数保存 resolution；`initializeWorkspace()` 处理路线 A；非只读 `tools/call` 调用 `ensureWorkspaceInitializedForTool()` 处理路线 B；status/diagnostics/tools-list 不写盘 |
| `lib/codex/StatusService.ts` | 返回 projectRootResolution 与 autoInit 状态 |
| `lib/codex/Diagnostics.ts` | 增加 project root 与 init-on-demand issues |
| `lib/codex/index.ts` | 导出 resolver/类型 |
| `scripts/smoke-codex-plugin.mjs` | 增加 explicit-init、init-on-demand、read-only-no-init、no-env negative smoke |

### 测试矩阵

必须新增：

1. `CodexProjectRootResolver.test.ts`
   - `ALEMBIC_PROJECT_DIR` 是 trusted。
   - `CODEX_WORKSPACE_DIR` 是 trusted。
   - `CODEX_WORKSPACE_ROOT` 是 trusted。
   - 只有 `PWD=~/.codex/plugins/cache/...` 时 rejected。
   - 只有 `process.cwd()` 是插件目录时 rejected。
   - 不存在目录 rejected。

2. `CodexMcpServer.test.ts`
   - trusted fresh project 调用 `alembic_codex_init` 后 Ghost init。
   - trusted fresh project 调用 init-on-demand allowlist tool 后先 Ghost init，再继续原 tool。
   - 自动 init 不 seed、不 bootstrap、不启动 daemon。
   - missing trusted root 时不写插件目录。
   - 手动 `alembic_codex_init` 在 rejected root 下返回结构化错误。
   - `tools/list`、status、diagnostics 不触发初始化写盘。
   - 并发显式 init + 功能 tool call 只触发一次 setup。

3. `CodexStatusService.test.ts`
   - status 展示 explicit/init-on-demand marker。
   - status 展示 project root unresolved。

4. `scripts/smoke-codex-plugin.mjs`
   - `--explicit-init`：传 trusted env，调用 `alembic_codex_init` 后 initialized。
   - `--init-on-demand`：传 trusted env，调用 bootstrap/dashboard 等功能前自动 initialized。
   - `--read-only-no-init`：传 trusted env，只调用 status/diagnostics/tools-list 不应写初始化文件。
   - `--no-project-env`：不传项目 env，确认插件 cache 目录没有 `.asd/` 或 Ghost dataRoot 注册。

### 实施顺序

1. 先实现 `CodexProjectRootResolver` 和 rejected path 规则。
2. 让 status/diagnostics 报告 resolution，但暂不自动 init。
3. 修改 `alembic_codex_init`，在 Codex plugin runtime 下没有 trusted root 时 fail closed。
4. 补 no-env negative tests，证明不会初始化插件目录。
5. 接入 `ensureWorkspaceInitializedForTool()`，只对 init-on-demand allowlist tool 开启安全 Ghost init。
6. 确认 `tools/list`、status、diagnostics 全程只读。
7. 补 marker 与 status 展示。
8. 最后调整 smoke：显式 init、init-on-demand、read-only-no-init、无 workspace env 安全跳过四条路径都覆盖。

## 真实 Codex Desktop 插件环境验证记录

时间：2026-05-13。

在当前 Codex Desktop 会话中直接调用已安装 Alembic 插件的 `alembic_codex_status` / `alembic_codex_diagnostics`，结果显示：

- `projectRoot` 被解析为 `/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.1.0`。
- `workspace.dataRoot`、`daemon.projectRoot`、`databasePath` 等也全部落在该插件 cache 目录下。
- 当前活动 MCP 进程仍是旧安装态，没有返回新版 `projectRootResolution` 字段。
- 本机已存在 `/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.1.1`，但当前会话里的 Alembic MCP 仍引用已删除的 `0.1.0` cwd，导致 diagnostics 里 `npm` / `npx` 报 `uv_cwd`。
- 当前已安装插件的 `.mcp.json` 只显式设置 Alembic 自身运行时 env：`ALEMBIC_CHANNEL_ID`、`ALEMBIC_PLUGIN_HOST`、`ALEMBIC_CODEX_*`、`ALEMBIC_MCP_*`、`ALEMBIC_RUNTIME_MODE`、`npm_config_cache`，没有设置 `ALEMBIC_PROJECT_DIR`、`CODEX_WORKSPACE_DIR` 或 `CODEX_WORKSPACE_ROOT`。

结论：

- 当前真实 Codex Desktop 插件链路没有给 Alembic 提供可用项目目录；至少没有提供旧 resolver 已支持的 `ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR`。
- 是否有 `CODEX_WORKSPACE_ROOT` 这类新版字段需要在 Codex Desktop 重新加载新版插件后再次确认；当前活动 MCP 仍是旧安装态，无法从新版 `projectRootResolution.source/trust/reason` 直接读出。
- 现有 fail-closed 设计是必要的：不能依赖 `cwd`、`PWD` 或插件 cache fallback 执行初始化。

### 0.1.2 重新安装验证

执行路线：

1. 将 Alembic runtime / Codex channel / plugin manifest 升到 `0.1.2`。
2. 运行 `npm run release:codex-plugin -- --skip-build`，结果通过：
   - `prepare:codex-plugin-runtime` 生成 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。
   - `verify:codex-channel` 通过。
   - `verify:codex-plugin` 通过，确认 `./runtime.tgz -> alembic-ai@0.1.2`。
   - `smoke:codex-plugin` 通过，`stdio` 与 `npxRuntime` 都是 `passed`。
3. 运行 `npm run dev:codex-plugin:sync -- --clean`，把最终产物同步到：
   `/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.1.2`。

当前会话内的 Alembic MCP tool 仍然返回旧进程：

- `packageVersion` 仍是 `0.1.1`。
- `projectRoot` 仍是 `/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.1.0`。
- 没有新版 `projectRootResolution` 字段。

这说明 Codex Desktop 当前线程不会热切换已连接的 MCP server；要验证 Desktop host 是否注入 workspace env，需要重启 Codex Desktop 或新开一个加载 `0.1.2` 插件的新会话。

为了确认 `0.1.2` 安装产物本身正常，手动从已安装 cache 用真实 `.mcp.json` 路径启动：

```bash
npx -y --package ./runtime.tgz alembic-codex-mcp
```

在不传 `ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR` / `CODEX_WORKSPACE_ROOT` 的情况下，`alembic_codex_status` 返回：

```json
{
  "packageVersion": "0.1.2",
  "projectRootResolution": {
    "source": "INIT_CWD",
    "trust": "rejected",
    "reason": "Project root points inside the Codex plugin cache.",
    "userMessage": "Alembic Codex cannot determine the target project directory, so project workflows cannot be used yet. Provide an absolute project root via projectRoot, ALEMBIC_PROJECT_DIR, CODEX_WORKSPACE_DIR, or CODEX_WORKSPACE_ROOT."
  },
  "onboarding": {
    "state": "project_root_unresolved"
  }
}
```

这证明新版 fail-closed 和向上抛错行为已经在安装产物中生效。剩余唯一未完成项是让 Codex Desktop 重新加载 `0.1.2` 后，再用真实 host 注入环境读取 `projectRootResolution.source/trust/reason`。

### 第一次 Codex Desktop 重启后的结果

用户重启 Codex Desktop 后，本线程中 Alembic MCP tool 仍不可调用，`alembic_codex_status` / `alembic_codex_diagnostics` 返回 `unsupported call`。进程检查也没有发现 `alembic-codex-mcp`、`runtime.tgz` 或 `alembic-codex` MCP 进程。

进一步检查发现 Codex 的 `gxfn` marketplace 工作副本仍是旧版本：

- `~/.codex/.tmp/marketplaces/gxfn/plugins/alembic-codex/.codex-plugin/plugin.json`：`0.1.0`
- `~/.codex/.tmp/marketplaces/gxfn/plugins/alembic-codex/runtime/package.json`：`0.1.0`

也就是说，上一轮只同步了安装 cache 的 `0.1.2`，但 Codex 重启时可见的 marketplace source 仍然是旧 `0.1.0`。随后已执行：

```bash
rsync -a --delete plugins/alembic-codex/ ~/.codex/.tmp/marketplaces/gxfn/plugins/alembic-codex/
npm run dev:codex-plugin:sync -- --clean
```

现在两处都已是 `0.1.2`：

- `~/.codex/.tmp/marketplaces/gxfn/plugins/alembic-codex`
- `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.2`

需要再重启 Codex Desktop 或新开会话，才能让当前工具集真正加载 `0.1.2`。

### 第二次 Codex Desktop 重启后的结果

用户再次重启 Codex Desktop 后，确认安装源与缓存已经都是 `0.1.2`：

- `~/.codex/.tmp/marketplaces/gxfn/plugins/alembic-codex/.codex-plugin/plugin.json`：`0.1.2`
- `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.2/.codex-plugin/plugin.json`：`0.1.2`
- `~/.codex/config.toml` 中 `[plugins."alembic-codex@gxfn"] enabled = true`

但是当前 Codex 线程仍没有暴露 Alembic MCP namespace：

- `mcp__alembic__alembic_codex_status` / diagnostics 在本线程不可用。
- 进程列表中有 Codex Desktop、Lark Remote、xcodebuildmcp、Computer Use、node_repl 等进程，但没有 `alembic-codex-mcp`、`runtime.tgz` 或 `alembic-codex` MCP 进程。
- 当前 shell 环境只有 `PWD=/Users/gaoxuefeng/Documents/github/Alembic`，没有 `CODEX_WORKSPACE_DIR` / `CODEX_WORKSPACE_ROOT`。

这次结果不能证明 Codex Desktop 没有向 MCP server 注入 workspace env，因为 Alembic MCP server 根本没有被当前线程启动或挂载。当前状态更准确地归类为：

```text
plugin source/cache installed 0.1.2 + plugin enabled
but current Codex thread toolset does not mount Alembic MCP
```

下一步验证应先解决 “Alembic MCP 被当前线程挂载” 这一层，再读取 `projectRootResolution.source/trust/reason`。如果 Alembic 插件在 Codex UI 中需要显式加入当前 chat / 项目上下文，需要先选择或启用该插件后重新触发 `alembic_codex_status`。

### 切换为独立 Alembic 本地插件安装

用户删除 `gxfn` 统一 marketplace 后，将本机 Codex 配置切换为 Alembic 单插件 marketplace：

```toml
[marketplaces.alembic-codex]
source_type = "local"
source = "/Users/gaoxuefeng/Documents/github/Alembic/plugins/alembic-codex"

[plugins."alembic-codex@alembic-codex"]
enabled = true
```

同时移除 `alembic-codex@gxfn` 和 `codex-lark-remote@gxfn` 的旧插件引用，保留 `codex-lark-remote@codex-marketplace-global`。当前 `~/.codex/config.toml` 已无 `gxfn` 字样。

为避免 Codex 启动时落回旧 cache，已把插件产物同步到独立 cache：

```text
~/.codex/plugins/cache/alembic-codex/alembic-codex/0.1.2
```

验证结果：

- 独立 cache manifest 是 `alembic-codex@0.1.2`。
- `.mcp.json` 仍按真实插件路径运行 `npx -y --package ./runtime.tgz alembic-codex-mcp`。
- 初次验证遇到 `/tmp/alembic-codex-npm-cache/_npx` 中断残留导致的 npm `ENOTEMPTY`，清理该插件专用临时 `_npx` cache 后恢复。
- 真实 `npx --package ./runtime.tgz` 启动成功，stderr 输出 `Alembic Codex MCP ready — 7 tools`。
- 通过 MCP client 调用 `alembic_codex_status` 成功：
  - `toolCount: 7`
  - `packageVersion: 0.1.2`
  - `projectRootResolution.source: ALEMBIC_PROJECT_DIR`
  - `projectRootResolution.trust: trusted`
  - `projectRootResolution.path: /Users/gaoxuefeng/Documents/github/Alembic`

### Codex Desktop 真实挂载后的 workspace env 验证

切换到独立 Alembic 本地插件后，当前 Codex Desktop 线程已经能调用 `mcp__alembic__alembic_codex_status` 和 diagnostics，说明 Alembic MCP 已被真实挂载。

`alembic_codex_status` 返回：

```json
{
  "packageVersion": "0.1.2",
  "projectRootResolution": {
    "path": "/Users/gaoxuefeng/.codex/plugins/cache/alembic-codex/alembic-codex/0.1.2",
    "source": "INIT_CWD",
    "trust": "rejected",
    "reason": "Project root points inside the Codex plugin cache."
  }
}
```

结论：当前 Codex Desktop MCP host 没有向 Alembic MCP 注入 `CODEX_WORKSPACE_DIR` / `CODEX_WORKSPACE_ROOT` / `ALEMBIC_PROJECT_DIR`。如果 Desktop 注入了 workspace env，这里应显示 `source: CODEX_WORKSPACE_DIR` 或 `source: CODEX_WORKSPACE_ROOT`，`path` 应为用户项目目录，`trust` 应为 `trusted`。现在只有 `INIT_CWD` 候选，且路径是插件 cache，因此 fail-closed 护栏按预期生效。

### 显式 projectRoot 参数路线

为解决 Desktop 不注入 workspace env 的现实约束，Codex 本地工具现在支持 `projectRoot` 参数：

- 所有 Alembic Codex tool schema 都暴露可选 `projectRoot`。
- `projectRoot` 必须是绝对路径。
- 每次 tool call 如果带 `projectRoot`，MCP server 会为该调用创建项目作用域上下文，并在转发 daemon / job / init 逻辑前移除 `projectRoot` 控制字段。
- 如果当前 MCP 进程只能看到插件 cache，并且用户调用非 status / diagnostics 工具时没有提供 `projectRoot`，直接 fail-closed，返回 `CODEX_PROJECT_ROOT_REJECTED` / `CODEX_PROJECT_ROOT_UNRESOLVED` 与 `required.projectRoot = "absolute path"`。
- 因为 Desktop 的 `tools/list` 没有项目目录参数，当默认根目录不可信时，插件仍会暴露核心工具，但这些工具的 schema 都包含 `projectRoot`；真正执行时仍由 per-call resolver 决定是否可信。

安装产物验证：

```json
{
  "ready": true,
  "toolCount": 26,
  "hasTask": true,
  "statusToolProjectRoot": {
    "type": "string"
  },
  "taskToolProjectRoot": {
    "type": "string"
  },
  "projectRootResolution": {
    "path": "/Users/gaoxuefeng/Documents/github/Alembic",
    "source": "explicit-option",
    "trust": "trusted"
  }
}
```

### 保存项目目录

为避免每次工具调用都重复传 `projectRoot`，Alembic Codex 现在会在第一次收到显式且可信的 `projectRoot` 后保存项目目录：

- 保存位置：`~/.asd/codex-project-root.json`。
- 只保存显式 `projectRoot`，不会保存 `cwd`、`PWD`、`INIT_CWD` 或插件 cache fallback。
- 写入前必须通过同一套 project root 信任校验：目录必须存在，不能是文件系统根、用户 home、临时根目录、Codex plugin cache 或 Alembic runtime package root。
- 后续没有显式 `projectRoot` 时，resolver 会把已保存目录作为 `saved-project-root` trusted source 使用。
- 如果用户切换项目，Agent 应再次传新的显式 `projectRoot`，保存文件会被覆盖为新的项目目录。

验证覆盖：

- `CodexProjectRootResolver` 单测覆盖显式目录保存和 `saved-project-root` 恢复。
- `CodexMcpServer` 单测覆盖真实 plugin-cache fallback 场景：首次带 `projectRoot` 调用 status 后写入保存文件；第二个 server 实例不带 `projectRoot` 也能恢复到保存项目目录，且不会在插件 cache 创建 `.asd/`。
- 本机验证已把 `/Users/gaoxuefeng/Documents/github/Alembic` 写入 `/Users/gaoxuefeng/.asd/codex-project-root.json`，读回后 `resolveCodexProjectRoot()` 返回 `source: saved-project-root`、`trust: trusted`。

### 二次联网调研：projectRoot 路线是否还有更优替代

调研日期：2026-05-13。

官方文档确认的能力边界：

- Codex MCP 文档确认 STDIO server 支持 `command`、`args`、`env`、`env_vars`、`cwd`，但这些都是 MCP server 启动配置，没有看到“当前 Codex 线程项目根目录”会自动注入插件 MCP 的公开承诺。`cwd` 只是启动 server 的 working directory；`env_vars` 只是转发本地环境中的指定变量，不会合成 workspace root。来源：https://developers.openai.com/codex/mcp
- Codex 插件构建文档确认插件会安装到 `~/.codex/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME/$VERSION/`，并从安装副本加载。因此插件 `.mcp.json` 的 `cwd: "."` 在插件场景下天然更接近插件安装目录，而不是用户项目目录。来源：https://developers.openai.com/codex/plugins/build
- Hooks 文档确认 command hook 输入有 `cwd`，`SessionStart` 可追加上下文，但 hooks 是会话生命周期事件，不是插件安装后事件，也不是 MCP server 的稳定项目目录通道。来源：https://developers.openai.com/codex/hooks

公开 Codex issue 与本机现象一致：

- https://github.com/openai/codex/issues/9989：VS Code 扩展场景下 MCP cwd 不是 workspace；issue 内也把 `CODEX_WORKSPACE_ROOT` 归类为 tool-call time workaround，而不是 server spawn-time 解法。
- https://github.com/openai/codex/issues/16390：Codex Desktop 启动 Playwright MCP 时 cwd 可能是 `/`，且没有提供 active workspace roots。
- https://github.com/openai/codex/issues/14573：Codex App 中 project-local MCP 的相对 `args` 路径不稳定，CLI 可用但 App 不可用。
- https://github.com/openai/codex/issues/16430 与 https://github.com/openai/codex/issues/17331：plugin-local hooks 与当前 runtime 行为存在不一致；即使 manifest 文档展示 hooks 字段，也不能把 Alembic 初始化建立在 plugin hook 上。

本地成熟插件实现对照：

| 插件 | 观察 | 结论 |
| --- | --- | --- |
| `build-ios-apps` | `.mcp.json` 直接启动 `npx xcodebuildmcp@latest mcp`，没有传 workspace；skill 明确要求先调用 `session_set_defaults` 并传 `projectPath`/`workspacePath`/`scheme`/`simulatorId` | 项目上下文由 Agent 显式传入，不由 MCP 猜测 |
| `computer-use` | `.mcp.json` 使用 `cwd: "."` 启动本地 app MCP | 这是工具自身运行目录，不是用户项目目录 |
| `codex-lark-remote` | `.mcp.json` 使用 `cwd: "."`；业务通过 `configure`、`start`、`handoff` 等显式工具保存 routing state | 需要上下文时通过显式工具输入，而不是安装时初始化 |
| `figma` | 本地有 `hooks.json`，但主要能力来自 skills/apps；hook 不用于项目根目录发现 | hooks 只能算辅助，不适合作为 Alembic 初始化基础 |

本轮收敛后的实现取舍：

- 不在 Alembic `.mcp.json` 增加 `env_vars` 转发。虽然它可能在少数环境里自动生效，但会让“项目目录到底来自哪里”多一条分支；项目目录是 Alembic 初始化的一切基石，缺失时应优先要求 Agent/用户提供明确目录。
- skill/tool description 只提示 Agent 传当前工作区绝对路径，不再把“重启并设置 workspace env”作为推荐动作。

不建议采用的替代方案：

- `cwd = "."` 或 `process.cwd()`：真实插件环境里会落到 plugin cache。
- `cwd = "$workspace"` / `${workspaceFolder}`：官方文档没有声明这种变量展开语义。
- plugin `hooks` / `SessionStart` 自动 init：不是安装事件，且 plugin-scoped hooks 仍有 runtime 不一致记录。
- `tools/list` 时自动 init：违反发现协议只读边界，也会在 root 不可信时写错目录。
- 让 Agent 从自然语言中猜目录：可作为交互兜底，但不能作为系统初始化路径。

二次结论：当前 `projectRoot` per-call 参数 + fail-closed + 两条初始化路线，是目前公开文档和成熟插件模式下最稳妥的主方案。不要增加 best-effort 环境转发；没有可信项目目录时直接提示 Agent/用户提供 `projectRoot`，不能安全回到 MCP 启动时自动初始化。

## 最终建议

实现目标可以满足，但边界要定清楚：

- “安装好自动执行初始化”的实际工程含义应调整为：插件安装后不在 MCP 启动时静默写盘；当用户主动 init 或调用需要 Alembic workspace 的功能时，由 Alembic MCP server 在可信项目根目录上自动补一次 Ghost init。
- 不依赖 Codex plugin hooks，也不依赖 Agent 记得先调用 `alembic_codex_init`。
- status、diagnostics、tools/list 保持只读；功能 tool call 可以触发 init-on-demand。
- 没有可信项目目录时，优先返回结构化提示，让 Agent 把当前工作区绝对路径作为 `projectRoot` 传入。
- 初始化的安全前置是 trusted project root；没有 trusted root 时必须跳过并可观测，不能 fallback 到插件 cache。
- 这不是功能削减，而是把现有完整初始化能力接到两条明确用户意图路径上，同时保留 fail-closed 安全边界。
