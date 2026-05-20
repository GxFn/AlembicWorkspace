# Alembic Bootstrap Agent Efficiency Observability Workspace Plan

更新日期：2026-05-20
总控窗口：AlembicWorkspace
状态：Wave 8 已完成总控验收；single-dimension regression 因外部 AI 数据导出安全策略阻塞，等待用户决策

## 背景

用户在 `BiliDili` 真实项目上启动 DeepSeek 冷启动后，观察到候选产出慢、任务进度不够清晰、工具调用数偏高，并在看到总控提示“可能存在 token / tool 调用浪费”后主动取消任务。取消后 Dashboard Jobs 页又把该任务归类到“已完成”，说明当前链路同时暴露了三类问题：

- Agent 执行效率：重复读取 / 搜索、过晚收敛、重复 nudge / replan、强制总结和过量工具结果会浪费 token 与时间。
- 可观测性：用户看不到当前维度、阶段、AI provider 等待、工具调用、token、cache / compaction 等真实状态，只能从日志和最终数字猜测。
- 状态语义：取消、失败、完成、部分产出完成需要在 JobStore、session、API、Dashboard 和报告里一致表达，不能把取消任务显示为完成。

本计划把这批 TODO 升级为正式收口主线，不再作为冷启动测试中的零散修复。

## 最终目标

- 用户可以在真实项目上启动 cold-start / bootstrap，并在 Dashboard 中看到真实、紧凑、持续更新的执行状态：当前维度、阶段、AI provider 等待、工具调用数、token / cache / compaction 摘要、候选产出和取消状态。
- 取消任务必须立即阻止后续维度调度和不必要 AI / tool 调用；已取消任务在 API、Jobs 页、报告和历史记录中都归类为 `cancelled`。
- `AlembicAgent` 在 bootstrap / rescan 这种系统任务中具备明确的执行效率护栏：重复 deterministic 工具调用可复用或短路，nudge / replan 有预算与收敛条件，空回复 / 强制总结不额外消耗无意义 token。
- `Alembic` 能消费 Agent 产出的效率指标，把每个维度的 token、tool、cache、重复调用、重试、nudge、compaction 和取消原因保存到 job / report，方便后续验收和性能优化。
- `AlembicDashboard` 只展示真实后端状态，不用静态 mock 或假进度填充；慢模型运行时能显示“正在等待 AI provider / 当前维度处理中”，而不是让用户以为卡死。

## 非目标

- 不修改 `BiliDili` 业务源码；它只作为真实 cold-start 验证对象。
- 不改用户的 AI Provider 配置、密钥或模型选择。
- 不删除 Alembic internal AI 线，也不把 Codex host-agent 线与 internal AI 混用。
- 不把效率优化做成空 adapter、空 provider 或未被消费的 metrics 类型；每个新增指标必须有生产方、消费方和验证方式。
- 不把 Dashboard 当前可用页面大重构成新产品；本轮只围绕 bootstrap / job / report 状态闭环。

## 代码事实与 TODO 来源

本轮来源是 BiliDili 冷启动真实运行、Dashboard Jobs / Candidates 观察、Alembic daemon 日志和相关代码阅读。

- `Alembic` Job / session 当前需要统一取消语义：历史 job 可能保存为 completed，但 `finalSession` 已标记 aborted；列表过滤和统计必须按真实 normalized status 展示。
- `Alembic` bootstrap task manager 需要保证 cancel 后不继续把任务标为 completed，不继续调度剩余维度。
- `AlembicAgent` `NudgeGenerator` / `PlanTracker` 当前会在较晚阶段才收敛，并可能把 verbose nudge 作为 user message 注入上下文，增加 token。
- `AlembicAgent` `ToolExecutionPipeline` 有 trace / observation / dedup 等 middleware，但缺少面向 read / search / structure 等 deterministic 工具的执行效率护栏。
- `AlembicAgent` `BudgetController` 已有 token / cache / compaction 数据，但这些数据没有完整进入 dimension result、JobStore、Dashboard 和最终报告。
- `Alembic` `BootstrapConsumers` / `BootstrapProjections` 已记录 toolCallCount 和基础 tokenUsage，但缺少 cache hit、duplicate、nudge、retry、compaction、provider wait 等效率指标。
- `AlembicDashboard` Jobs / bootstrap UI 能显示 toolCalls 和完成数，但缺少阶段、当前维度、取消归类、紧凑轮询、效率指标和慢模型等待提示。
- `BiliDili` Wave 4 小范围真实回归已完成，业务仓库保持干净，但真实 API 暴露出运行态仍未满足 Wave 2 / Wave 3 contract：`compact=true` 仍带 heavy `result`、取消 job 的 top-level / progress / summary 状态不一致、Jobs / Reports 缺少 efficiency、Codex plugin diagnostics 仍报告 runtime pin mismatch。

## 分阶段路线

### Wave 0：取消语义与状态真相

负责窗口：`Alembic`

目标：先把已经暴露的取消状态修准，避免用户继续把 cancel 后的任务误认为完成。

必须完成：

- `cancelDaemonJob` 找到运行中的 bootstrap session 后，真正中止对应 session，并把 job finalize 为 `cancelled`。
- Job 列表、状态筛选和统计必须基于 normalized status；历史 `completed + aborted finalSession` 记录也要显示为 cancelled。
- Bootstrap task manager 在取消后不再把后续任务标记为 completed，也不再继续启动新维度。
- 补 targeted tests 覆盖 running cancel、历史 aborted record normalization、cancel 后不继续调度。

当前总控已有一份本地补丁和 targeted 验证记录；`Alembic` 窗口领取时必须先检查现有工作区改动，不要重复重写或回退用户 / 总控已有修改。若补丁已经存在，任务是验收、补齐遗漏测试、提交并回填。

### Wave 1：Agent 效率 producer

负责窗口：`AlembicAgent`

目标：让 Agent runtime 自己能证明“为什么用了这些 tool / token”，并先从 producer 侧减少已知浪费。

必须完成：

- 在 runtime diagnostics 或等价结果对象中产出效率摘要：toolCalls、duplicateToolCalls、cacheHits / cacheMisses、token input / output / reasoning、compaction level、nudge count、replan count、empty retries、forced summary、cancel reason。
- 为 read / search / structure / inspect 类 deterministic 工具增加 session-level efficiency guard：同一输入、同一项目快照、同一工具策略下，优先复用可审计缓存或短路重复调用；不得短路 submit / mutate / side-effect 工具。
- 调整 `PlanTracker` / `NudgeGenerator` 的 bootstrap 场景策略：已有足够证据、连续无新信息、已进入 PRODUCE / RECORD / SUMMARY 时，减少 verbose nudge 和 replan；nudge 需要有预算或 TTL。
- 强制总结只在确实缺少可用输出时触发；scan / bootstrap 维度已经产出有效 digest / candidate 时，不要为了“补总结”再发一轮无价值 LLM。
- 补单元测试或 runtime tests，证明重复工具调用减少、nudge / replan 不过量、side-effect 工具不被短路、取消信号不会继续触发工具。

禁止事项：

- 不得为“未来可能用”只新增未消费的 telemetry 类型。
- 不得把所有工具调用都粗暴缓存；写入、提交、生成候选、修改状态、发送事件类工具必须保持真实执行。
- 不得降低 Agent 对真实代码的读取深度；优化目标是减少重复与噪音，不是减少必要证据。

### Wave 2：Alembic 消费 Agent 效率指标

负责窗口：`Alembic`

依赖：`AlembicAgent` Wave 1 回填指标 schema / 提交 hash。

目标：把 Agent producer 指标接入 bootstrap dimension、session、job、report 和 token usage 记录。

必须完成：

- `BootstrapProjections` / `BootstrapConsumers` 接收 Agent efficiency summary，并写入 dimension result、JobStore final result、bootstrap report。
- 维度摘要区分 model token、tool call、cache hit、duplicate short-circuit、nudge / replan、retry / empty response、compaction 与 cancel reason。
- job summary 支持紧凑状态输出，避免 Dashboard 轮询整个 heavy session payload。
- 结构化日志增加 jobId、sessionId、dimension、pass / stage、retry、provider wait、cancel reason；减少裸 ANSI nudge 噪音。
- targeted tests 覆盖 metrics projection、cancelled job summary、compact job / bootstrap status。

### Wave 3：Dashboard 进度与效率展示

负责窗口：`AlembicDashboard`

依赖：`Alembic` Wave 2 后端 API / payload 定稿。

目标：把用户看得见的“卡住 / 浪费 / 取消”问题转成真实可读状态。

必须完成：

- Jobs 页统计正确区分 active / completed / failed / cancelled。
- Bootstrap / Jobs 页面展示当前维度、阶段、最后事件时间、AI provider 等待、tool calls、token、cache / duplicate / compaction 摘要。
- 慢模型场景显示真实等待状态，不再用静态假阶段或让进度长期看起来为 0。
- Candidates / Reports 能跳转到对应 job / dimension 证据，方便用户判断是否继续、取消或重新启动。
- 补前端构建和必要 UI smoke；如果涉及视觉状态，附截图或说明。

### Wave 4：BiliDili 真实回归

负责窗口：`BiliDili` 观察，总控或 Alembic 窗口执行验证。

依赖：Wave 0 到 Wave 3 完成。

目标：用真实项目验证 cold-start 是否可继续使用，并形成后续性能基线。

验证顺序：

- 先清理测试 job / workspace 状态，确认不改 BiliDili 业务源码。
- 先跑测试模式或小维度 bootstrap，确认 cancel / status / Dashboard 展示正确。
- 再由用户决定是否跑完整 cold-start。
- 验证报告记录：维度数、候选数、耗时、toolCalls、token、cache hit、duplicate short-circuit、取消 / 完成状态、用户可见问题。

验收结论：Wave 4 已完成但未通过功能完整性验收；进入 Wave 5 修复。

### Wave 5：运行态 contract 修复与插件 runtime pin 收口

负责窗口：`Alembic`、`AlembicPlugin`

依赖：`BiliDili` Wave 4 回填与总控只读复核。

目标：让真实运行中的本地 Alembic daemon / Codex plugin 状态与 Wave 2 / Wave 3 contract 对齐，再回到 `BiliDili` 做同一小范围回归。

必须完成：

- `Alembic` 先确认当前 daemon 是否只是旧进程未重启；如果是 stale runtime，修复或记录 `alembic start` / dev link / daemon restart 的刷新链路，保证用户从 CLI 启动的是当前构建。
- `Alembic` 修复 `/api/v1/jobs?compact=true` 和 `/api/v1/jobs/:jobId?compact=true`：真实运行态必须省略 heavy `result`，并保留足够的 `status`、`progress`、`summary`、`summary.efficiency`。
- `Alembic` 修复取消后的 late projection：cancelled job 的 top-level status、progress.status、summary、统计和筛选必须一致，不能被 child session / rescan projection 刷回 completed。
- `Alembic` 确认新生成 bootstrap / rescan job 的 efficiency 能进入 Jobs compact summary 与 Reports aggregate / per-dimension evidence；历史旧记录可以降级，但不能展示假数据。
- `AlembicPlugin` 修复 `PLUGIN_RUNTIME_PIN_MISMATCH`：Codex plugin MCP config、embedded runtime wrapper、runtime preparation 和 cache/install 结果必须一致；如果源仓库已正确但本地插件缓存未刷新，回填明确的刷新命令和证据。
- 修复后不直接启动完整 `BiliDili` cold-start；只允许重复同一单维度 rescan + cancel 回归，确认 contract 后再由用户决定完整 cold-start。

验收结论：Wave 5 代码 / 缓存修复通过；当前已运行的 daemon / MCP 进程仍可能是旧运行态，进入 Wave 6 做刷新后小范围复测。

### Wave 6：BiliDili 刷新后小范围复测

负责窗口：`BiliDili`

依赖：`Alembic` Wave 5 提交 `11a14bbb486fff059a2e3ea42557ca6ff17d810b`；`AlembicPlugin` packaged runtime cache refresh 已完成。

目标：不启动完整 cold-start，只验证当前用户真实项目在刷新后的 Alembic / Plugin 运行态下是否满足 compact / cancel / diagnostics contract。

必须完成：

- 先在新会话或重启后的 Codex MCP 进程中运行 BiliDili diagnostics；不得继续使用还持有旧 cache cwd 的 stale MCP 进程。
- diagnostics 必须不再出现 `PLUGIN_RUNTIME_PIN_MISMATCH`；如果只出现 `uv_cwd` 的 npm / npx 误报，先重启 MCP / 新开 BiliDili 窗口后重试，不要继续 rescan。
- 执行 `alembic start` 或当前 Alembic 文档要求的等价启动命令，确认 daemon 使用 Wave 5 后的当前构建；如果仍复用旧 61164 行为，停止并回填。
- 只跑单维度 rescan + cancel：验证 `/api/v1/jobs?compact=true` 与 `/api/v1/jobs/:jobId?compact=true` 不带 heavy `result`，且 top-level status、progress.status、summary.status 都为 `cancelled`。
- 检查 Jobs / Reports 是否能看到新 job 的 efficiency；旧历史记录没有 efficiency 可以降级，但不能展示假数据。
- BiliDili 业务源码前后必须保持干净；不启动完整 cold-start，完整 cold-start 仍需用户确认。

验收结论：Wave 6 已完成并按门禁停止。`PLUGIN_RUNTIME_PIN_MISMATCH` 已消失，BiliDili 业务仓库保持干净；但 diagnostics 仍因 `uv_cwd` 把 npm / npx 判为不可用，且在有效插件缓存目录直接执行 npm / npx 可返回版本。这不是 BiliDili 业务问题，也不是 runtime pin mismatch 回归；进入 Wave 7，由 `AlembicPlugin` 修复 diagnostics 命令运行目录和错误分类。

### Wave 7：AlembicPlugin diagnostics cwd robustness

负责窗口：`AlembicPlugin`

依赖：`BiliDili` Wave 6 diagnostics 门禁回填。

目标：Codex plugin diagnostics 不能因为当前 MCP 进程持有失效 cwd 就误判 npm / npx 不可用，也不能把 `uv_cwd` 混同为插件 runtime pin mismatch 或用户本机缺 npm。

必须完成：

- 复现或单测模拟 `process.cwd()` / child command cwd 指向已删除目录时，diagnostics 调用 npm / npx 报 `uv_cwd` 的场景。
- diagnostics 执行 npm / npx、runtime wrapper probe、plugin metadata probe 时必须使用一个已确认存在的稳定 cwd；优先使用插件根、runtime artifact 所在目录或安全临时目录，不依赖 stale process cwd。
- 如果 cwd 已失效，diagnostics 要给出明确的 stale cwd / restart MCP / refresh plugin cache 诊断，而不是 `Install npm` 这种误导动作。
- 保持 `PLUGIN_RUNTIME_PIN_MISMATCH` 与 npm / npx cwd failure 的分类边界：只有 `.mcp.json`、wrapper、runtime artifact 或 package pin 真实不一致时，才报告 pin mismatch。
- 保持 Plugin 只做 Codex 入口、packaged runtime、Dashboard URL handoff 和 diagnostics；不得重新引入 Dashboard 前端、Alembic daemon 主实现或 BiliDili 业务逻辑。
- 修复后不启动完整 `BiliDili` cold-start；只允许通过 diagnostics / probe installed 证明门禁可过，再由总控决定是否回到 BiliDili 做单维度复测。

建议验证命令：

```bash
npm run check
npm run verify:codex-plugin
npm run dev:codex-plugin:probe-installed -- --packaged --project-root ../BiliDili --no-sync
git diff --check
```

如果仓库脚本不同，以 `AlembicPlugin/AGENTS.md` 和 `package.json` 为准。需要补 targeted test 或 probe 脚本覆盖 stale cwd 情况。

验收结论：Wave 7 已通过总控验收。`AlembicPlugin` 已把 stale cwd / `uv_cwd` 从 npm / npx 缺失中拆出，且插件 source repo、runtime artifact、installed packaged probe 和 release boundary 均通过复核。进入 Wave 8，由 `BiliDili` 在新会话 / 重启 MCP 后先跑 diagnostics 门禁，门禁通过后才执行单维度 rescan + cancel 复测。

### Wave 8：BiliDili diagnostics gate + single-dimension regression

负责窗口：`BiliDili`

依赖：`AlembicPlugin` Wave 7 提交 `cfacd28434f2f669bffd5048fc5e4b9c0e95f62c`；AlembicCodex runtime artifact 提交 `05c77fffc91d6c991a56308eab3a71cdc3d311ab`。

目标：确认 BiliDili 在修复后的 Alembic Codex plugin diagnostics 下可通过门禁；然后只做单维度 `architecture` rescan + cancel，验证真实运行态 compact payload、cancelled 状态和 efficiency evidence。

必须完成：

- 必须新开 BiliDili Codex 会话或重启 Alembic Codex MCP；不要继续复用已知可能持有旧 MCP 进程的会话。
- 先检查 BiliDili git 状态，确认业务仓库干净；回归结束后再次确认干净。
- 运行 BiliDili diagnostics；不得再出现 `PLUGIN_RUNTIME_PIN_MISMATCH`、`NPM_UNAVAILABLE`、`NPX_UNAVAILABLE` 或 `CODEX_STALE_COMMAND_CWD`。如果 diagnostics 仍失败，立即停止并回填，不继续 rescan。
- diagnostics 通过后，确认 projectRoot、ghost workspace、Dashboard handoff、local daemon、active / selected runtime project 均指向 BiliDili。
- 只执行单维度 `architecture` rescan + cancel，不启动完整 cold-start。
- 验证 `/api/v1/jobs?compact=true` 与 `/api/v1/jobs/:jobId?compact=true` 不带 heavy `result`，并且 top-level status、progress.status、summary.status 均为 `cancelled`。
- 检查 Jobs / Reports 是否能看到新 job 的 efficiency；旧历史记录没有 efficiency 可以降级，但新 job 不得展示假数据。
- 不修改 BiliDili 业务源码、UI、网络、登录、播放或项目结构。

建议回填：

- diagnostics 结果和是否通过门禁。
- BiliDili git 状态前后是否干净。
- jobId、sessionId、维度、是否取消成功。
- compact payload 是否不含 heavy `result`。
- top-level / progress / summary 状态是否一致为 `cancelled`。
- Jobs / Reports 是否看到 efficiency evidence。
- 是否仍建议启动完整 cold-start。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `BiliDili`<br>阻塞 | Wave 8：diagnostics 门禁已通过，daemon refresh 窗口期证据已捕获；最终复核时 handoff 已断开 / daemon 已停止。单维度 `architecture` rescan 被外部 AI 数据导出安全策略阻塞，等待用户确认是否允许把项目内容发送给当前 DeepSeek provider，或改用本地 / 测试 provider / dry-run 路线。 |
| `AlembicPlugin`<br>已完成 | Wave 7 已通过总控验收：diagnostics stale cwd / `uv_cwd` 分类修复、packaged runtime artifact 和 installed probe 均通过。 |
| `Alembic`<br>已完成 | Wave 5 代码验收通过：修复 compact payload、cancelled progress / summary 一致性和 stale daemon refresh detection，提交 `11a14bbb486fff059a2e3ea42557ca6ff17d810b`；后续复测前再按文档重新启动 / 刷新 daemon。 |
| `AlembicDashboard`<br>观察中 | Wave 3 前端实现已通过；当前等待后续 BiliDili 真实 payload 复测。 |
| `AlembicAgent`<br>观察中 | Wave 1 producer 已完成；除非 Alembic 复核发现 Agent diagnostics 未真实产出，否则本轮不派发，避免空转。 |
| `AlembicCore`<br>无任务 | 当前问题不需要 Core contract 变化；如 JobStore / report schema 必须下沉到 Core，再重新判断。 |

### Alembic Wave 5 执行要求

范围：

- `lib/daemon/DaemonJobRunner.ts`
- `lib/http/routes/jobs.ts`
- `lib/service/bootstrap/BootstrapTaskManager.ts`
- `lib/service/bootstrap/BootstrapEfficiency.ts`
- `lib/service/bootstrap/BootstrapProjections.ts`
- `lib/service/bootstrap/BootstrapConsumers.ts`
- `lib/workflows/capabilities/execution/internal-agent/*`
- CLI / daemon start / dev link 相关入口
- 相关 unit tests、job / bootstrap status tests 和 live smoke

本轮必须先做：

- 复现总控只读观察：`compact=true` 带 `result`、cancelled job 的 progress / summary 被刷成 completed、Reports 缺少 efficiency。
- 判断 running daemon 是旧进程未重启、dist 未刷新，还是源码缺陷；不能只改测试或只重启本机后写“已修复”。
- 修复真实运行态 contract：compact response 不带 heavy `result`，cancelled / aborted / completed 归一化一致，late rescan / child session 不得覆盖 cancelled summary。
- 确认新 job 的 efficiency 进入 Jobs compact summary 与 Reports evidence；旧历史记录没有 metrics 时只降级展示。
- 明确 `alembic start` / `npm run dev:link` / daemon restart 后使用当前本地构建的方式，避免用户再次跑到 stale daemon。

验证命令：

```bash
npm run test:unit -- test/unit/JobsRoute.test.ts test/unit/DaemonJobRunner.test.ts test/unit/BootstrapTaskManager.test.ts
npm run build:check
npm run lint -- --diagnostic-level=error
git diff --check
```

如果改到 projection / consumer / finalizer，再补对应 targeted tests。必须补一个运行态 smoke：启动或重启本地 daemon 后，用 BiliDili 项目重复轻量 job 查询，证明 `compact=true` 不带 `result` 且状态一致；不要启动完整 cold-start。

文档动作：无需新建单独执行文档，直接回填本文“回填区”；如改动范围扩大，再在 `docs/Alembic/` 新建执行记录并从本文挂回。

回填位置：本文“回填区”的 `Alembic` 小节。

### AlembicPlugin Wave 5 执行要求

范围：

- `.mcp.json`
- `plugins/alembic-codex/.mcp.json`
- `plugins/alembic-codex/bin/*`
- `scripts/prepare-codex-plugin-runtime.mjs`
- `runtime.tgz` / embedded runtime preparation 相关产物与验证脚本

本轮必须先做：

- 复核 BiliDili `alembic_codex_status` / diagnostics 中的 `PLUGIN_RUNTIME_PIN_MISMATCH` 来源。
- 修复 Codex plugin MCP config 与 embedded runtime wrapper 的不一致；确保插件使用预期 wrapper / runtime artifact，而不是误走未 pin 的全局命令。
- 如果源仓库已经正确但本地 Codex plugin cache 未刷新，给出明确刷新步骤和验证证据；不要把 cache 问题伪装成代码完成。
- 保持 Plugin 只做 Codex 入口和 Dashboard URL handoff，不重新引入 Dashboard 前端源码或服务能力。

验证命令：

```bash
npm run check
npm run prepare:codex-plugin-runtime
git diff --check
```

如果仓库脚本不同，以 `AlembicPlugin/AGENTS.md` 和 `package.json` 为准。回填必须包含 source repo 验证和本地 plugin cache / install 验证两部分。

文档动作：无需新建单独执行文档，直接回填本文“回填区”；如修复涉及安装 / cache 流程说明，保存到 `docs/AlembicPlugin/` 并从本文挂回。

回填位置：本文“回填区”的 `AlembicPlugin` 小节。

### AlembicAgent 观察要求

本轮不发送。`AlembicAgent` Wave 1 producer 已完成；只有当 `Alembic` 复核证明 diagnostics.efficiency 没有真实产出，或重复工具调用 / nudge / forced summary 控制仍失效，才新建后续任务。

### AlembicDashboard 观察要求

本轮不发送。`AlembicDashboard` Wave 3 已消费真实 payload contract；当前 BiliDili 回归暴露的是后端 running payload 和 Plugin runtime pin 问题。修复后若字段形态变化，再派发前端微调。

后续若再次派发，优先参考：

- Jobs API `compact=true` response 的 `status`、`progress`、`summary.efficiency`。
- `progress.activeTaskLabel`、`progress.totalToolCalls`、`progress.percent`、`progress.sessionId`。
- `summary.efficiency.toolCalls`、`duplicateToolCalls`、`cacheHits`、`cacheMisses`、`tokenUsage.input/output/reasoning/cacheHit`、`maxCompactionLevel`、`totalCompactedItems`、`nudgeCount`、`replanCount`、`emptyRetries`、`forcedSummary`、`cancelReason`。
- bootstrap / workflow report 中的 aggregate `efficiency` 和 per-dimension efficiency，作为 Jobs / Candidates / Reports 跳转后的证据。

后续微调才考虑：

- Jobs 页统计和卡片正确区分 active / completed / failed / cancelled。
- 慢模型等待时显示当前维度、最后事件时间、AI provider 等待或任务处理中状态，不再让用户误以为卡死。
- 展示 token / cache / duplicate / compaction 摘要，帮助用户判断是否存在执行浪费。
- Candidates / Reports 能跳到对应 job / report 证据；没有 efficiency 的旧记录要优雅降级。
- 不改后端 payload；如果发现 payload 缺口，回填阻塞给 Alembic，不在前端造假字段。

后续验证参考：

```bash
npm run build
git diff --check
```

如涉及 UI 状态，补本地页面截图或 Playwright / browser smoke 说明。

### BiliDili Wave 6 复测要求

已完成；本节不再作为当前发送内容。`BiliDili` Wave 4 已完成并暴露后端 / 插件问题；`Alembic` 与 `AlembicPlugin` Wave 5 已完成，Wave 6 已按 diagnostics 门禁停止；`AlembicPlugin` Wave 7 已修复 diagnostics cwd robustness，当前重新复测要求以 Wave 8 为准。

后续复测时必须完成：

- 先读取 `BiliDili/AGENTS.md` 和本文档；确认当前窗口确实在 `BiliDili` 项目，不要在 Alembic 产品仓库里冒充真实项目。
- 不修改 BiliDili 业务源码、UI、网络、登录、播放或项目结构；如产生 Alembic 配置、缓存或报告，只按 Alembic 工作流记录证据。
- 检查 BiliDili git 状态，确认回归前后业务源码无非预期改动。
- 修复后只重复同一类小范围验证：优先测试模式或单维度 rescan + cancel，确认 Jobs / Reports 能展示 cancelled、progress、efficiency、token/cache/duplicate/compaction 和 report 证据跳转。
- 不直接启动完整 cold-start；只有用户明确确认后，才执行完整 cold-start。
- 若 diagnostics 仍报告 `PLUGIN_RUNTIME_PIN_MISMATCH`，或 npm / npx 仍因 `uv_cwd` 失败，先停止并回填，不继续启动 rescan。

建议回填：

- 项目状态：是否已初始化、workspace mode、Dashboard handoff / local Alembic 状态。
- 验证范围：测试模式或小维度范围、是否取消、是否生成候选、是否生成 report。
- UI 观察：Jobs / Reports 是否显示 status、active task、efficiency、cancel reason、report evidence。
- 业务保护：BiliDili git 状态前后是否干净。
- 遗留风险：是否需要再跑完整 cold-start。

## 总控验收

总控于 2026-05-20 复核 `Alembic` Wave 0 和 `AlembicAgent` Wave 1，结论：通过，可进入 Wave 2。

复核证据：

- `Alembic` 工作区干净，提交 `c3af481dbda617d3ceb720a452fdf713b9e8aef5` 与 `6a13b0bda471447040064c72bc647e6696ed1df2` 已在主分支；实现覆盖 cancel session、cancelled job normalization、late transition guard、lazy child input cancel guard 和 `compact=true` jobs response。
- `AlembicAgent` 工作区干净，提交 `ea4c9ecc6fc26629794dda70623269265ab9ac95` 已在主分支；实现覆盖 `diagnostics.efficiency`、deterministic duplicate guard、nudge / replan 收敛、forced summary / empty retry / token / compaction / cancel reason 记录。
- 复跑 `Alembic` targeted tests：`npm run test:unit -- test/unit/JobsRoute.test.ts test/unit/DaemonJobRunner.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts` 通过，4 个测试文件、15 个测试。
- 复跑 `Alembic` `npm run build:check` 通过。
- 复跑 `AlembicAgent` `npm run test -- test/runtime-efficiency.test.ts` 通过，1 个测试文件、5 个测试。
- 复跑 `AlembicAgent` `npm run build:check` 通过。
- `git -C Alembic diff --check` 与 `git -C AlembicAgent diff --check` 通过。

功能完整性判断：

- 取消语义已经形成可用闭环：取消会中断 session、阻止后续维度启动，并在 Jobs response 中按 cancelled 展示。
- Agent efficiency producer 已形成真实生产点：runtime diagnostics 能输出工具、token、cache、重复短路、nudge / replan、retry、forced summary、compaction 和 cancel reason。
- Alembic 消费层已在 Wave 2 完成并通过总控复核；下一步启动 Dashboard Wave 3。

### Wave 2 总控验收

总控于 2026-05-20 复核 `Alembic` Wave 2，结论：通过，可进入 Dashboard Wave 3。

复核证据：

- `Alembic` 工作区干净，提交 `cc5b68146c6b6997362c23dce3607dbb2fd78029` 已在主分支并同步 `origin/main`。
- 新增 `BootstrapEfficiency` 归一化 / 聚合工具，直接消费 `AlembicAgent` 的 `AgentEfficiencySummary` schema，不自造一套不兼容字段。
- `BootstrapProjections`、`BootstrapConsumers`、`BootstrapTaskManager`、`InternalDimensionFillFinalizer` 和 Jobs compact response 都已接入 efficiency。
- Jobs compact summary 可从 `summary.efficiency`、session top-level `efficiency` 或 task result `efficiency` 聚合得到，旧记录可优雅降级。
- report finalizer 会把 aggregate 和 per-dimension efficiency 写回 workflow report，Dashboard 后续可展示证据。

复跑验证：

```text
Alembic: npm run test:unit -- test/unit/BootstrapProjection.test.ts test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/JobsRoute.test.ts test/unit/DaemonJobRunner.test.ts test/unit/InternalDimensionFillFinalizer.test.ts
Alembic: npm run build:check
Alembic: npm run lint -- --diagnostic-level=error
Alembic: git diff --check
```

结果：全部通过；6 个 targeted 测试文件、19 个测试通过。

### Wave 3 总控验收

总控于 2026-05-20 复核 `AlembicDashboard` Wave 3，结论：通过，可进入 BiliDili Wave 4。

复核证据：

- `AlembicDashboard` 工作区干净，提交 `904778f2002b5576c9f14b2d19409d0d81bd0125` 在本地 `main`；当前分支相对 `origin/main` ahead 1，尚未由总控主动推送。
- Jobs API client 使用 `api.listJobs({ limit: 100, compact: true })`，真实消费 Alembic Wave 2 定稿的 compact payload。
- 新增 `src/utils/efficiency.ts` 统一归一化 Jobs summary、bootstrap report aggregate 和 per-dimension efficiency；旧记录没有 efficiency 时不展示假指标。
- Jobs 页面展示 status、active task / current dimension、last event、provider wait / processing、progress、totalToolCalls、token、cache、duplicate、compaction、nudge / replan、empty retry、forced summary 和 cancel reason。
- Reports 页面支持 `view=reports&reportType=bootstrap&session=<id>`，可打开对应 bootstrap report，并展示 aggregate / per-dimension efficiency。

复跑验证：

```text
AlembicDashboard: npm run build
AlembicDashboard: git diff --check
AlembicDashboard route smoke: /jobs -> 200 OK
AlembicDashboard route smoke: /signals?view=reports&reportType=bootstrap&session=bs-smoke -> 200 OK
```

结果：全部通过。`npm run build` 仅保留 Vite 既有大 chunk warning。

功能完整性判断：

- Dashboard 已消费真实后端 payload，没有造前端假字段。
- Jobs / Reports 两条用户可见路径都具备 efficiency 展示和证据跳转。
- 尚未完成真实 BiliDili cold-start 回归；这正是 Wave 4 的范围。

### Wave 4 总控验收

总控于 2026-05-20 复核 `BiliDili` Wave 4，结论：业务保护通过，功能完整性未通过，进入 Wave 5。

复核证据：

- `BiliDili` 回归前后工作区干净，未修改业务源码；HEAD 为 `c37007b39b1d1b891d17d9d5849870a679be8be3`。
- `alembic_codex_status` 确认 BiliDili projectRoot、ghost workspace、local Alembic daemon、Dashboard handoff 和 internal AI provider 处于可用状态。
- 总控只读复核真实 API：`/api/v1/jobs?limit=5&compact=true` 与 `/api/v1/jobs/:jobId?compact=true` 仍返回 heavy `result`；取消 job `rescan_mpde2fs1_63fbe469` top-level 为 `cancelled`，但 `progress.status` 为 `completed`，`summary.completed=1`；Jobs / Reports 均未出现 efficiency。
- 运行进程指向当前 workspace 的 `Alembic/dist/bin/daemon-server.js`，而 dist 文件已包含 compact / efficiency 代码；下一波必须区分“进程未刷新旧代码”和“源码仍有缺陷”，不能只做静态检查。
- diagnostics 仍报告 Codex plugin runtime pin mismatch，说明 `AlembicPlugin` 也有实际收口任务。

功能完整性判断：

- 真实用户路径还不能安全进入完整 BiliDili cold-start：取消状态、compact payload、efficiency evidence 和插件 runtime pin 仍不可信。
- `AlembicDashboard` 前端不是当前主要阻塞；它能展示的前提是后端真实 payload 正确。
- 下一步只派发能修复阻塞的 `Alembic` 和 `AlembicPlugin`，不再给 `BiliDili`、`AlembicDashboard` 或 `AlembicAgent` 空转任务。

### Wave 5 总控验收

总控于 2026-05-20 复核 `Alembic` 与 `AlembicPlugin` Wave 5，结论：源码 / 缓存修复通过，可进入 `BiliDili` Wave 6 小范围复测。

复核证据：

- `Alembic` 工作区干净，最新提交 `11a14bbb486fff059a2e3ea42557ca6ff17d810b`；回填验证覆盖 `JobsRoute`、`DaemonJobRunner`、`BootstrapTaskManager`、`DaemonSupervisor`、`InternalDimensionFillFinalizer`、`build:self`、`build:check`、lint 和 runtime smoke。
- `Alembic` runtime smoke 证明新构建的 compact list / detail 不再返回 heavy `result`，cancelled job 的 top-level / progress / summary 状态一致。
- 总控只读查询当前已运行的 61164 daemon 时，旧 BiliDili job 仍返回 `hasResult=true` 且 progress / summary 为旧完成态；这说明当前 daemon 进程尚未刷新到新构建，不能作为 Wave 5 源码失败证据，但必须在 BiliDili Wave 6 前刷新。
- `AlembicPlugin` source repo 工作区干净，当前 HEAD `2f5fd8dde85f8e83336e519b4c93da288cea41c5`；执行记录确认 source `.mcp.json` 使用 packaged wrapper，cache 已恢复 packaged runtime，`PLUGIN_RUNTIME_PIN_MISMATCH` 消失。
- 总控复查 `alembic_codex_status`：`plugin.mcp.ok=true`、`embeddedRuntime=true`、`packagePin=true`、wrapper 存在且带 startup lock。
- 总控复查 `alembic_codex_diagnostics`：当前 MCP 进程仍因 `uv_cwd` 报 `NPM_UNAVAILABLE` / `NPX_UNAVAILABLE`，但从当前 cache root 直接执行 `npm --version` 和 `npx --version` 均返回 `10.9.4`。这符合 AlembicPlugin 回填的“旧 MCP 进程持有已替换 cache cwd”风险，不是 pin mismatch 回归。

功能完整性判断：

- `Alembic` 代码修复可以验收，但 BiliDili 真实 daemon 还需要刷新后复测。
- `AlembicPlugin` pin mismatch 可以验收，但当前 stale MCP 进程的 `uv_cwd` 误报需要通过新会话 / 重启 MCP 消除；如果新会话仍复现，则再派发 AlembicPlugin 做 diagnostics cwd robustness 修复。
- Wave 5 当时下一步只发送给 `BiliDili` 做小范围复测；不启动完整 cold-start。

### Wave 6 总控验收

总控于 2026-05-20 复核 `BiliDili` Wave 6，结论：BiliDili 按门禁正确停止，不再给 BiliDili 空转；进入 `AlembicPlugin` Wave 7。

复核证据：

- `BiliDili` 工作区干净，HEAD 仍为 `c37007b39b1d1b891d17d9d5849870a679be8be3`；未修改业务源码，未启动完整 cold-start。
- `alembic_codex_status` 显示 projectRoot 为 BiliDili、ghost workspace、Dashboard handoff 与 active runtime project 对齐，local daemon ready。
- Plugin pin mismatch 已消失：`plugin.mcp.ok=true`、`embeddedRuntime=true`、`packagePin=true`，wrapper 存在并带 startup lock。
- `alembic_codex_diagnostics` 仍为 `ok=false`，错误集中在 `NPM_UNAVAILABLE` / `NPX_UNAVAILABLE`，底层原因均为 `uv_cwd`。
- 总控在有效插件缓存目录直接执行 `npm --version` 与 `npx --version` 均返回 `10.9.4`，证明不是用户本机 npm / npx 缺失。

功能完整性判断：

- BiliDili 执行窗口遵守门禁，没有在 diagnostics 失败时继续 rescan / cold-start，这是正确行为。
- 当前问题应由 `AlembicPlugin` 修复 diagnostics 对 stale cwd 的处理和错误分类；继续重开 BiliDili 复测会浪费窗口。
- Alembic / Dashboard / Agent / Core 本轮不承担新任务；待 Plugin 修复后，再决定是否回到 BiliDili 做单维度 rescan + cancel 复测。

### Wave 7 总控验收

总控于 2026-05-20 复核 `AlembicPlugin` Wave 7，结论：通过，可进入 `BiliDili` Wave 8 diagnostics 门禁和单维度复测。

复核证据：

- `AlembicPlugin` 工作区干净，提交 `cfacd28434f2f669bffd5048fc5e4b9c0e95f62c` 已在 `main` 并同步 `origin/main`。
- `AlembicPlugin/plugins/alembic-codex` runtime artifact 工作区干净，提交 `05c77fffc91d6c991a56308eab3a71cdc3d311ab` 已在 `main` 并同步 `origin/main`。
- `lib/codex/Diagnostics.ts` 新增稳定 cwd command probe：npm / npx 探测不再继承 stale process cwd，优先使用插件根、runtime package root 或系统临时目录。
- `uv_cwd` 失败现在归类为 `CODEX_STALE_COMMAND_CWD`，不会继续误报 `NPM_UNAVAILABLE` / `NPX_UNAVAILABLE`；`PLUGIN_RUNTIME_PIN_MISMATCH` 仍只用于真实 MCP config / wrapper / runtime artifact / package pin 不一致。
- `test/unit/CodexRuntimeContext.test.ts` 覆盖 stable plugin cwd 探测和 `uv_cwd` 分类，证明不会把 stale cwd 当成用户本机缺 npm / npx。

复跑验证：

```text
AlembicPlugin: npx vitest run --config vitest.unit.config.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexMcpServer.test.ts
AlembicPlugin: npm run verify:codex-plugin
AlembicPlugin: npm run dev:codex-plugin:probe-installed -- --packaged --project-root ../BiliDili --no-sync
AlembicPlugin: npm run check
AlembicPlugin: npm run verify:release-package-boundary
AlembicPlugin: git diff --check
AlembicPlugin/runtime artifact: git -C plugins/alembic-codex diff --check
```

结果：全部通过。`npm run check` 仅保留仓库既有 Biome warning；`probe-installed` 返回 `ok=true`、`mode=packaged-runtime`，BiliDili projectRoot 受信任，fail-closed cache path 门禁仍生效。

功能完整性判断：

- diagnostics cwd robustness 已形成真实可用闭环：有生产代码、有错误分类、有 targeted tests、有 packaged runtime artifact 和 installed probe。
- Plugin 没有重新引入 Dashboard 前端、Alembic daemon 主实现或 BiliDili 业务逻辑。
- 仍需在 BiliDili 新会话 / 重启 MCP 后验证真实 MCP 工具输出；因此下一波只派发 BiliDili 门禁和单维度复测，不启动完整 cold-start。

### Wave 8 总控验收

总控于 2026-05-20 复核 `BiliDili` Wave 8，结论：diagnostics 门禁和历史 job contract 复核通过；新的单维度 `architecture` rescan 因外部 AI 数据导出安全策略阻塞，当前不继续派发窗口。

复核证据：

- `BiliDili` 业务仓库前后保持干净，HEAD 为 `c37007b39b1d1b891d17d9d5849870a679be8be3`，未修改业务源码，未启动完整 cold-start。
- `alembic_codex_diagnostics` 已通过，不再出现 `PLUGIN_RUNTIME_PIN_MISMATCH`、`NPM_UNAVAILABLE`、`NPX_UNAVAILABLE` 或 `CODEX_STALE_COMMAND_CWD`。
- 刷新后的 daemon 窗口期中，Jobs compact list / detail 不再带 heavy `result`；历史 rescan job `rescan_mpde2fs1_63fbe469` 已归一为 `cancelled/cancelled/cancelled`；历史取消 bootstrap job `bootstrap_mpcvyr6s_37a26b05` 也归一为 `cancelled/cancelled/cancelled`，且 Jobs summary 可见 efficiency。
- Dashboard `/jobs` 与 Reports deep link 在 daemon 在线窗口期均可访问；最终复核时 daemon 已停止，handoff 断开，这是本轮安全收尾后的状态，不作为功能失败。
- 新 `architecture` rescan 未创建 jobId / sessionId，因为工具拦截了会把 BiliDili 私有项目内容发送给当前 DeepSeek provider 的操作。

功能完整性判断：

- 本轮证明 diagnostics、daemon refresh、compact payload 和历史 cancelled normalization 已形成可用闭环。
- 尚未证明“新生成 rescan job”的 cancel / compact / Reports efficiency 闭环，因为该验证需要真实 AI 扫描项目内容。
- 继续推进前必须由用户选择：显式允许本项目内容发送给当前 DeepSeek provider 做单维度复测，或切换到本地 / 测试 provider / 无外部数据导出的 dry-run / fixture 路线。
- 完整 BiliDili cold-start 仍不建议启动；必须等单维度闭环通过并由用户另行确认完整范围。

## 验收标准

- 取消任务不会继续消耗后续维度的 AI / tool 调用，Jobs / status / report 都显示 cancelled。
- Agent run result 能解释 token 和工具调用花在哪里，且至少覆盖重复工具调用、cache、nudge / replan、retry、forced summary、compaction。
- Alembic report 能按维度保留效率证据，后续用户说“哪里浪费了”时不需要只靠终端日志猜。
- Dashboard 能在慢模型运行时展示当前状态和最后事件时间，用户能判断继续等待、取消或重跑。
- BiliDili 回归不修改业务代码，且能证明本轮不是只修 UI 或只修类型，而是真实 cold-start 链路可用性提升。

## 可复制提示词

发送给：无。

当前没有可继续发送的执行窗口。`BiliDili` 已完成 diagnostics 门禁和既有 job contract 复核；新的单维度 rescan 涉及外部 AI 数据导出，必须先等待用户确认路线，避免空转或越过安全边界。

不发送给：`BiliDili`（阻塞，等待用户决策）、`AlembicPlugin`（Wave 7 已完成）、`Alembic`（Wave 5 已完成）、`AlembicDashboard`（观察中）、`AlembicAgent`（观察中）、`AlembicCore`（无任务）。

## 回填区

- `Alembic`：已完成 Wave 0、Wave 2 与 Wave 5。Wave 0 主提交 hash：`c3af481dbda617d3ceb720a452fdf713b9e8aef5`；CI recovery 提交 hash：`6a13b0bda471447040064c72bc647e6696ed1df2`；Wave 2 提交 hash：`cc5b68146c6b6997362c23dce3607dbb2fd78029`；Wave 5 提交 hash：`11a14bbb486fff059a2e3ea42557ca6ff17d810b`。
  - Wave 5 完成范围：`JobsRoute` 响应装饰现在以 JobStore 终态为准，`cancelled` / `failed` 终态不会再被内嵌 late final session 的 `completed` 覆盖；`summary` 会补齐 `status`、取消 `aborted` 与取消 / 失败 reason；`compact=true` 继续省略 heavy `result` payload，同时保留 progress / summary / efficiency 轻量字段；新增 late completed final session + cancelled job 的 compact 回归用例；`DaemonSupervisor` 在 `status` / `start` 链路中检测运行中 daemon 的 `startedAt` 是否早于当前 `dist/bin/daemon-server.js`，若本地 build 已更新则标记 stale，后续 `daemon start` 会重启而不是复用旧 runtime。
  - Wave 5 验证命令：`npm run test:unit -- test/unit/JobsRoute.test.ts test/unit/DaemonJobRunner.test.ts test/unit/BootstrapTaskManager.test.ts` 通过，3 个测试文件、13 个测试；`npm run test:unit -- test/unit/DaemonSupervisor.test.ts` 通过，1 个测试文件、6 个测试；`npm run test:unit -- test/unit/InternalDimensionFillFinalizer.test.ts` 通过，1 个测试文件、1 个测试；`npm run build:self` 通过，用于同步 runtime smoke 所用 dist；`npm run build:check` 通过；`npm run lint -- --diagnostic-level=error` 通过；`git diff --check` 通过。
  - Wave 5 runtime smoke：使用临时测试项目与独立 `ALEMBIC_HOME` 预置一个带 heavy `result.finalSession` 的 cancelled bootstrap job；提权启动临时 daemon 后，`/api/v1/jobs?limit=5&compact=true` 返回 `hasResult=false`、`status=cancelled`、`progressStatus=cancelled`、`summaryStatus=cancelled`、`aborted=true`、`reason="Cancelled via smoke"`；`/api/v1/jobs/bootstrap_mpdevmyy_7b7d7ca3?compact=true` 同样返回 `hasResult=false` 且三处状态一致；临时 daemon 已通过 `daemon stop` 停止。
  - Wave 5 验证结果：Alembic 代码已提交并推送到 `origin/main`，提交 `11a14bbb486fff059a2e3ea42557ca6ff17d810b`；Jobs compact list 与 single-job 端点均不再泄露 heavy result；cancelled top-level / progress / summary 已一致；Reports efficiency 写入逻辑未在本轮改动，使用 `InternalDimensionFillFinalizer` 回归确认现有 aggregate / per-dimension augmentation 仍通过。
  - Wave 5 遗留风险：本轮没有在 BiliDili 上重新跑单维度 rescan + cancel，也没有启动完整 cold-start；旧历史 job / report 没有 efficiency 时仍按历史数据降级，不补假指标；`alembic start` / daemon freshness 以当前 build 的 `dist/bin/daemon-server.js` mtime 与 daemon `startedAt` 对比，若用户改源码但没有执行 build / dev:link，仍需先构建生成新的 dist。
  - Wave 5 下一步建议：总控先验收 AlembicPlugin Wave 5 pin mismatch 回填，再由 BiliDili 复跑同一单维度 rescan + cancel 回归，确认真实项目上 compact payload、cancelled 状态和 Jobs / Reports efficiency 可见；通过后再由用户决定是否启动完整 BiliDili cold-start。
  - Wave 2 完成范围：新增 Alembic 侧 `BootstrapEfficiency` 归一化 / 聚合工具，消费 `AlembicAgent` `diagnostics.efficiency`；`BootstrapProjections` 将 efficiency 投影到维度 projection、analysis metadata 和 producer result；`BootstrapConsumers` 将 efficiency 写入 dimensionStats、dimension complete payload、checkpoint 输入、结构化日志和 task result；`BootstrapTaskManager` 聚合任务 efficiency 到 running / final session status、summary 与 totalToolCalls fallback；Jobs API compact response 可从 `summary.efficiency`、session top-level efficiency 或 task result efficiency 构建轻量 summary；`InternalDimensionFillFinalizer` 在 Core report 写入后由 Alembic 侧回写 per-dimension / session / totals efficiency，避免修改 Core；`DaemonJobRunner` 增加 jobId、bootstrapSessionId、stage、status、cancelReason 等 session finalize 结构化日志；`BootstrapSessionExecutionBuilder` 将维度启动日志改为带 sessionId / dimension / stage 的结构化日志。
  - Wave 2 验证命令：`npm run test:unit -- test/unit/JobsRoute.test.ts test/unit/DaemonJobRunner.test.ts` 通过，2 个测试文件、10 个测试；`npm run test:unit -- test/unit/BootstrapProjection.test.ts test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/JobsRoute.test.ts test/unit/DaemonJobRunner.test.ts test/unit/InternalDimensionFillFinalizer.test.ts` 通过，6 个测试文件、19 个测试；`npm run build:self` 通过，用于同步当前测试运行时会读取的 dist；`npm run build:check` 通过；`npm run lint -- --diagnostic-level=error` 通过；`git diff --check` 通过。
  - Wave 2 验证结果：projection / consumer / TaskManager / Jobs compact summary / DaemonJobRunner cancel status / report augmentation 均有 targeted 覆盖；Alembic 代码提交已推送到 `origin/main`，提交 `cc5b68146c6b6997362c23dce3607dbb2fd78029`。
  - Wave 2 遗留风险：本轮未启动真实 BiliDili cold-start 回归，仍需 Wave 3 Dashboard 消费 compact status / efficiency payload 后再做端到端可见性验证；Core report builder 未改动，Alembic 通过 finalizer 二次增强 report，后续若 Core 接收 efficiency contract，可再收敛到 Core 侧统一 report schema。
  - Wave 2 下一步建议：总控验收 Alembic payload 后启动 `AlembicDashboard` Wave 3；Dashboard 应优先读取 Jobs compact `summary.efficiency`、`progress` 和 `status`，再补 Bootstrap / Jobs UI 的 cancelled、provider wait、token/cache/duplicate/compaction 摘要展示；BiliDili 保持观察，等 Dashboard 可见状态完成后再进入 Wave 4 真实回归。
  - Wave 0 完成范围：`cancelDaemonJob` 现在会先定位运行中的 bootstrap session，调用 `BootstrapTaskManager.abortSession()` 或 `markCancelled()`，并从 final session 归一化写回 `cancelled` / `failed` / `completed`；历史 `completed + aborted finalSession` 在 Jobs API 响应中归一化为 `cancelled`；Job list status filter 先 decorate 再按 normalized status 过滤；`BootstrapTaskManager` 取消后不再接受 late filling / completed / failed / finish transition；bootstrap child lazy input factory 在 session abort / user cancel 后抛出取消错误，避免继续启动新维度；Jobs 路由新增 `compact=true` 轻量响应，复用现有 `/api/v1/jobs` / `/api/v1/jobs/:jobId` 结构并省略 heavy `result` payload。
  - CI recovery 完成范围：修复 GitHub Actions run `26117248176` 暴露的四类失败：API smoke 从已删除的 `npm run dashboard` 切到当前真实入口 `npm run cli -- start --dev --api-only --port 3100 --no-open`；`ReasoningLayer` 单测同步 `AlembicAgent` 当前 planning nudge 文案 `总轮次 30`；`ToolExecutionPipeline` 单测 mock 补齐 `recordEfficiencyToolCall` 诊断钩子；`FullFlow` operation duration 测试将实际延迟提高到 30ms 并保留 20ms 最低断言，降低 CI 调度抖动导致的 19ms 边界误差。
  - 验证命令：`npm run test:unit -- test/unit/JobsRoute.test.ts test/unit/DaemonJobRunner.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts` 通过，4 个测试文件、15 个测试；`npm run test:unit -- test/unit/ReasoningLayer.test.ts test/unit/ToolExecutionPipeline.test.ts` 通过，2 个测试文件、86 个测试；`npx vitest run test/integration/FullFlow.test.ts` 通过，1 个测试文件、20 个测试；`npm run build:check` 通过；`npm run lint -- --diagnostic-level=error` 通过；`npm run lint:core-import-boundary` 通过；`npm run lint:consumer-core-imports` 通过；`npm run cli -- start --help` 通过；本地提权实启 API-only smoke 命令后，`/api/v1/health`、`/api/v1/health/ready`、`/api-spec` 均返回成功；`git diff --check` 通过。
  - 验证限制：本机 Codex 沙盒内完整 `npm run test:unit` 额外命中与本次 CI 失败无关的系统限制：`sandbox-exec: sandbox_apply: Operation not permitted` 与 `listen EPERM: operation not permitted 127.0.0.1`，失败集中在 `TerminalAdapter.test.ts` 和 `SandboxNetworkProxy.test.ts`；目标失败文件均已定向通过。
  - GitHub Actions 新 run：`https://github.com/GxFn/Alembic/actions/runs/26117931831`，headSha `6a13b0bda471447040064c72bc647e6696ed1df2`，结论 `success`；`Build & Lint (22)`、`Integration Tests`、`Unit Tests`、`API Smoke Test` 均通过。
  - Wave 0 遗留风险：Wave 0 后仍需由 Alembic 消费 `AlembicAgent` 已回填的 `diagnostics.efficiency` 到 bootstrap dimension / JobStore / report / compact status，此项已在 Wave 2 回填中补齐；Dashboard 仍需等待总控验收后展示 cancelled / compact / efficiency 状态；未对 BiliDili 执行真实 cold-start 回归。
- `AlembicAgent`：已完成 Wave 1 Agent efficiency producer。提交 hash：`ea4c9ecc6fc26629794dda70623269265ab9ac95`。完成范围：新增 `AgentDiagnostics.efficiency` / `AgentEfficiencySummary`，由 `DiagnosticsCollector` 汇总 toolCalls、duplicateToolCalls、cacheHits、cacheMisses、token input / output / reasoning / cacheHit、maxCompactionLevel、totalCompactedItems、nudgeCount、replanCount、emptyRetries、forcedSummary 和 cancelReason；`ToolExecutionPipeline` 增加 `deterministicDuplicateGuard`，仅对同一 session / project snapshot / strategy 下的 read/search/structure/inspect/read-like 工具短路复用，submit / mutate / side-effect 工具保持真实执行；`AgentRuntime` 将 LLM token、compaction、nudge / replan、empty retry、forced summary 和 abort cancel reason 写入 diagnostics，并在 tool 执行前检查 abortSignal，避免取消后继续触发工具；`NudgeGenerator` / `PlanTracker` 为 bootstrap 场景增加 nudge TTL / budget、PRODUCE / RECORD / terminal 阶段 replan 抑制和更紧凑的初始计划提示；新增 `test/runtime-efficiency.test.ts` 覆盖 deterministic duplicate 短路、side-effect 不短路、efficiency 字段累计、bootstrap PRODUCE nudge/replan 抑制。验证命令：`npm run build:check` 通过；`npm run test` 通过，10 个测试文件、45 个测试；`npm run lint` 通过但仍输出 21 条既有 warning；`npm run lint:agent-import-boundary` 通过；`npm run lint:public-api-boundary` 通过；`npm run lint:core-import-boundary` 通过；`npm run smoke:public-imports` 通过；`git diff --check` 通过。验证结果：AlembicAgent 仓库代码已提交，工作区除 workspace 回填文档外无未提交代码改动。遗留风险：真实 BiliDili cold-start 性能改善需要 Wave 3 / Wave 4 后再回归；当前 `npm run lint` 仍展示仓库既有 warning，但无 lint error。下一步建议：Dashboard 等 Alembic compact status / efficiency payload 经总控验收后再启动展示。
- `AlembicDashboard`：已完成 Wave 3，并经总控验收通过。提交 hash：`904778f2002b5576c9f14b2d19409d0d81bd0125`。
  - 完成范围：Dashboard Jobs 列表改为请求 Jobs API `compact=true`；前端类型补齐 `AgentEfficiencySummary`、Jobs `summary.efficiency`、bootstrap report aggregate / per-dimension efficiency 可选字段；新增 `src/utils/efficiency.ts` 统一归一化旧记录和新 payload；Jobs 卡片展示最后事件时间、当前维度 / active task、provider wait / task processing 状态、progress percent / totalToolCalls、token input / output / reasoning / cache-hit、cache hit / miss、duplicate tool calls、compaction、nudge / replan / empty retry、forced summary 与 cancel reason；保留 active / completed / failed / cancelled 统计；从 Jobs 卡片可跳转候选页和对应 bootstrap report evidence。Reports 页支持 `view=reports&reportType=bootstrap&session=<id>` URL 入口，自动打开对应 session，展示 aggregate efficiency 和最多 4 个 per-dimension efficiency 摘要；报告 / 日志筛选下拉改用统一 Select 组件，旧记录没有 efficiency 时不展示假指标。
  - 验证命令：`npm run build`；`git diff --check`；临时本地 dev server route smoke：`curl -I /jobs` 与 `curl -I /signals?view=reports&reportType=bootstrap&session=bs-smoke`。
  - 验证结果：`npm run build` 通过，Vite 仅保留既有大 chunk warning；`git diff --check` 通过；临时 dev server route smoke 两个前端路由均返回 `200 OK`；验证后已关闭临时 dev server，未更新或同步到运行环境。
  - 遗留风险：本轮没有实跑 BiliDili cold-start，也没有真实 daemon payload 的浏览器截图；provider wait 状态基于 `compact=true` 返回的 `progress.status`、`progress.activeTaskLabel` 和 job status 推导展示，没有新增后端字段；历史 reports / jobs 如果没有 efficiency 会优雅降级但无法补显示 token/cache/duplicate 证据。
  - 下一步建议：总控用真实 bootstrap job payload 复核 Jobs / Reports 展示，再进入 Wave 4 BiliDili 小维度真实回归；如后端后续增加显式 provider wait / stage 字段，Dashboard 可把当前推导展示收敛为直接字段展示。
- `AlembicCore`：无任务。
- `AlembicPlugin`：Wave 5 已验收通过；Wave 7 已通过总控验收。
  - Wave 5 执行记录：[../AlembicPlugin/alembic-plugin-runtime-pin-cache-refresh-wave-5-2026-05-20.md](../AlembicPlugin/alembic-plugin-runtime-pin-cache-refresh-wave-5-2026-05-20.md)。Wave 5 无新增 source 提交；当时 AlembicPlugin HEAD `2f5fd8dde85f8e83336e519b4c93da288cea41c5`，AlembicCodex runtime artifact HEAD `1a896fd714a34a1aa08b2fd53d7386227097cb57`。
  - Wave 5 完成范围：复现并收口 BiliDili diagnostics 中的 `PLUGIN_RUNTIME_PIN_MISMATCH`；确认 source repo 的 `plugins/alembic-codex/.mcp.json` 使用 packaged wrapper，wrapper 通过 `runtime.tgz` 启动 embedded runtime；确认 mismatch 来源是本机 Codex plugin cache 曾被开发态 local MCP 改写；执行 `npm run dev:codex-plugin:sync -- --all-installed` 将缓存恢复为 packaged runtime；保持 Plugin 只做 Codex 入口和 Dashboard URL handoff，未引入 Dashboard 前端源码或服务能力。
  - Wave 5 验证结果：`alembic_codex_status` 已显示 `plugin.mcp.ok=true`、`embeddedRuntime=true`、`packagePin=true`；`PLUGIN_RUNTIME_PIN_MISMATCH` 已消失。
  - Wave 7 执行记录：[../AlembicPlugin/alembic-plugin-diagnostics-cwd-robustness-wave-7-2026-05-20.md](../AlembicPlugin/alembic-plugin-diagnostics-cwd-robustness-wave-7-2026-05-20.md)。
  - Wave 7 提交 hash：AlembicPlugin `cfacd28434f2f669bffd5048fc5e4b9c0e95f62c`；AlembicCodex runtime artifact `05c77fffc91d6c991a56308eab3a71cdc3d311ab`。
  - Wave 7 完成范围：`alembic_codex_diagnostics` 的 npm / npx 探测改为显式稳定 cwd，优先使用插件根、runtime package root、系统临时目录；`uv_cwd` / stale cwd 失败归类为 `CODEX_STALE_COMMAND_CWD`，不再误报 `NPM_UNAVAILABLE` / `NPX_UNAVAILABLE`；`PLUGIN_RUNTIME_PIN_MISMATCH` 仍只用于 MCP config、wrapper、runtime artifact 或 package pin 真实不一致；刷新 packaged runtime artifact 并同步本机 Codex plugin cache。
  - Wave 7 验证命令：`npx vitest run --config vitest.unit.config.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexMcpServer.test.ts` 通过；`npx biome check lib/codex/Diagnostics.ts test/unit/CodexRuntimeContext.test.ts --diagnostic-level=error` 通过；`npm run check` 通过；`npm run build` 通过；`npm run prepare:codex-plugin-runtime` 通过；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`npm run verify:release-package-boundary` 通过；`npm run dev:codex-plugin:sync -- --all-installed` 通过；`npm run dev:codex-plugin:probe-installed -- --packaged --project-root ../BiliDili --no-sync` 通过；`npm run smoke:codex-plugin` 通过；`git diff --check` 通过；`git -C plugins/alembic-codex diff --check` 通过。
  - Wave 7 验证结果：source repo 与 AlembicCodex runtime artifact 均已提交并推送到 `origin/main`；packaged probe 显示 `ok=true`、`mode=packaged-runtime`；release package boundary 保持 root package private、root registry publish disabled、Codex artifact release enabled、embedded runtime Core dependency `file:vendor/AlembicCore`。
  - Wave 7 遗留风险：当前已经打开的 Codex 会话可能仍持有旧 MCP 进程；要验证新 diagnostics 的真实 MCP 工具输出，需要新开会话或重启 Alembic Codex MCP 后在 BiliDili 项目运行 diagnostics。本阶段未启动完整 BiliDili cold-start，也未修改 BiliDili 业务源码。
  - Wave 7 下一步建议：已进入 BiliDili Wave 8；先执行 diagnostics 门禁，门禁通过后才允许单维度 rescan + cancel 复测。
- `BiliDili`：已完成 Wave 4 小范围真实回归；Wave 6 已启动但按 diagnostics 门禁停止；Wave 8 diagnostics 门禁已通过，但单维度 `architecture` rescan 被外部 AI 数据导出安全策略阻塞，未执行新 rescan job。未修改 BiliDili 业务源码，未启动完整 cold-start。提交 hash：不适用（未产生 BiliDili 代码提交）；回归时 BiliDili HEAD 为 `c37007b39b1d1b891d17d9d5849870a679be8be3`。
  - 完成范围：读取本文档和 `BiliDili/AGENTS.md`，确认当前窗口位于 workspace 内的 `BiliDili` 项目；回归前后检查 BiliDili git 状态均干净；确认 Alembic projectRoot 为 BiliDili、workspace mode 为 ghost、projectId 为 `02a25032`；确认本地 Alembic daemon ready，Dashboard handoff URL 为 `http://127.0.0.1:61164`，active / selected runtime project 与 BiliDili 对齐；未执行完整 cold-start，只启动单维度 `architecture` rescan job `rescan_mpde2fs1_63fbe469` 并立即通过 Jobs API 取消，用于验证 cancel / status / compact / report 可见性。
  - 验证命令：`git status --short`（回归前 / 后）；`git rev-parse HEAD`；`git diff --check`；`alembic_codex_status --projectRoot <workspace>/BiliDili`；`alembic_codex_diagnostics --projectRoot <workspace>/BiliDili`；`alembic_codex_dashboard --projectRoot <workspace>/BiliDili`；`alembic_codex_rescan --projectRoot <workspace>/BiliDili --dimensions architecture --reason "Wave 4 BiliDili small-scope cancellation/status/efficiency visibility regression; no business source edits."`；`curl -s -X POST -H 'Content-Type: application/json' -d '{"reason":"Wave 4 BiliDili cancellation visibility regression"}' 'http://127.0.0.1:61164/api/v1/jobs/rescan_mpde2fs1_63fbe469/cancel'`；`alembic_codex_job --projectRoot <workspace>/BiliDili --jobId rescan_mpde2fs1_63fbe469`；`curl -s 'http://127.0.0.1:61164/api/v1/jobs?limit=5&compact=true'`；`curl -s 'http://127.0.0.1:61164/api/v1/jobs?status=cancelled&limit=10&compact=true'`；`curl -s 'http://127.0.0.1:61164/api/v1/jobs?status=running&limit=10&compact=true'`；`curl -I 'http://127.0.0.1:61164/jobs'`；`curl -I 'http://127.0.0.1:61164/signals?view=reports&reportType=bootstrap&session=bs_1779210459659_cw5r0o'`；`curl -s 'http://127.0.0.1:61164/api/v1/modules/bootstrap/reports'`；`curl -s 'http://127.0.0.1:61164/api/v1/modules/bootstrap/reports/bs_1779210459659_cw5r0o'`；`curl -s 'http://127.0.0.1:61164/api/v1/modules/bootstrap/reports/bs_1779240859487_ds94a8'`。
  - 验证结果：BiliDili 业务工作区回归前后 `git status --short` 均为空，`git diff --check` 通过；Dashboard `/jobs` 和 `/signals?view=reports&reportType=bootstrap&session=bs_1779210459659_cw5r0o` 前端路由均返回 `200 OK`；`alembic_codex_status` 显示 daemon ready、Dashboard available、internal AI provider `deepseek-v4-pro` ready、active jobs 为空；小范围取消 job `rescan_mpde2fs1_63fbe469` 创建后取消 API 初始返回 `status=cancelled`、`progress.status=aborted`、`totalToolCalls=0`；复查 `alembic_codex_job` 仍显示 job top-level `status=cancelled`，active/running job 数为 0；取消后生成了增量 snapshot `snap_8015a9fb56aa`，`dimensionCount=1`、`candidateCount=0`，未生成 cancelled report，`/api/v1/modules/bootstrap/reports/bs_1779240859487_ds94a8` 返回 `Report not found`；历史 bootstrap reports 列表可返回 2 条 BiliDili report summary，candidate 数分别为 7 和 3。
  - 发现的问题 / 阻塞：`/api/v1/jobs?compact=true` 和 `/api/v1/jobs/:id?compact=true` 当前仍返回 heavy `result` payload，不是 Wave 2 / Wave 3 预期的轻量 compact payload；历史 completed bootstrap job 与本次 cancelled rescan job 的 `summary.efficiency`、top-level `efficiency`、`result.efficiency` 均缺失，Reports aggregate / per-dimension efficiency 也缺失；本次取消 job 在取消瞬间为 `cancelled/aborted`，但约 1 分钟后 compact job payload 中同一 job 仍保持 top-level `status=cancelled`，却出现 `progress.status=completed`、`completed=1`、`failed=0`、`summary.completed=1`，说明取消后的 child session / projection 仍会把 progress / summary 刷成完成态；历史 job `bootstrap_mpcvyr6s_37a26b05` top-level 为 `completed`，但 `summary.aborted=true`、`reason="Cancelled by user via Dashboard"`，仍存在历史 cancelled normalization 未体现在 top-level status 的可见性问题。
  - Wave 4 当时遗留风险：本地 daemon / API 行为未体现 Wave 2 compact + efficiency contract，Dashboard 虽然路由可访问，但真实 BiliDili payload 无法展示 token/cache/duplicate/compaction 证据；取消语义仍有 top-level status、progress、summary 不一致风险；未运行完整 cold-start，也不建议在上述问题修复前运行完整 cold-start；当时 `alembic_codex_diagnostics` 报告 `PLUGIN_RUNTIME_PIN_MISMATCH`，此项已由 AlembicPlugin Wave 5 修复，Wave 6 需在新会话 / 重启 MCP 后复核。
  - 下一步建议：先回到 `Alembic` / daemon 侧复核当前运行的本地 daemon 是否包含 Wave 0 / Wave 2 提交，并修复 rescan cancel 后 child session / projection 继续覆盖 progress / summary 的问题；同步确认 Dashboard 连接的是已包含 Wave 2 compact / efficiency payload 的后端构建；修复后由 BiliDili 再重复同一单维度 rescan + cancel 回归，确认 compact payload 不含 heavy result、cancelled/progress/summary 一致、efficiency 在 Jobs / Reports 可见，再由用户决定是否启动完整 BiliDili cold-start。
  - Wave 6 完成范围：读取本文档和 `BiliDili/AGENTS.md`，确认当前窗口位于 workspace 内的 `BiliDili` 项目；检查 BiliDili git 状态为干净；执行 `alembic_codex_status` 与 `alembic_codex_diagnostics` 复核刷新后的 Plugin / daemon 状态。按 Wave 6 门禁要求，diagnostics 仍失败，因此未启动单维度 rescan + cancel，未生成新候选 / report，未触碰业务源码。
  - Wave 6 验证命令：`sed -n '1,260p' <workspace>/docs/workspace/alembic-bootstrap-agent-efficiency-observability-workspace-plan-2026-05-20.md`；`sed -n '261,620p' <workspace>/docs/workspace/alembic-bootstrap-agent-efficiency-observability-workspace-plan-2026-05-20.md`；`sed -n '1,220p' AGENTS.md`；`git status --short`；`git rev-parse HEAD`；`alembic_codex_status --projectRoot <workspace>/BiliDili`；`alembic_codex_diagnostics --projectRoot <workspace>/BiliDili`。
  - Wave 6 验证结果：BiliDili 业务工作区在复测前保持干净，HEAD 仍为 `c37007b39b1d1b891d17d9d5849870a679be8be3`；`alembic_codex_status` 显示 projectRoot 为 BiliDili、workspace mode 为 ghost、projectId 为 `02a25032`、Dashboard handoff 对齐且 local daemon ready；Plugin pin mismatch 已消失，`plugin.mcp.ok=true`、`embeddedRuntime=true`、`packagePin=true`、wrapper 存在且带 startup lock；`alembic_codex_diagnostics` 仍为 `ok=false`，错误为 `NPM_UNAVAILABLE` 与 `NPX_UNAVAILABLE`，两者均是 `Error: ENOENT: no such file or directory, uv_cwd`；总控在有效插件缓存目录直接执行 `npm --version` / `npx --version` 均返回 `10.9.4`，说明这是 diagnostics cwd handling 问题，不是 npm / npx 缺失。按文档要求，未继续执行 rescan。
  - Wave 6 遗留风险：当前 Codex MCP 进程仍持有失效 cwd，diagnostics 无法通过；因此尚未验证刷新后真实 BiliDili compact payload、cancelled top-level / progress / summary 一致性、Jobs / Reports efficiency evidence。由于未启动新 job，也不能判断 Alembic Wave 5 daemon 修复在 BiliDili 上是否已真实生效。
  - Wave 6 下一步建议：已进入 AlembicPlugin Wave 7 并验收通过；当前回到 BiliDili Wave 8 执行 diagnostics 门禁，门禁通过后再做单维度 `architecture` rescan + cancel，验证 compact payload 不含 heavy `result`、cancelled 状态三处一致，并检查 Jobs / Reports efficiency 后再考虑完整 cold-start。
  - Wave 8 完成范围：读取本文档和 `BiliDili/AGENTS.md`，确认当前窗口位于 workspace 内的 `BiliDili` 项目；检查 BiliDili git 状态为干净；执行 `alembic_codex_status` 与 `alembic_codex_diagnostics`，确认 projectRoot 为 BiliDili、workspace mode 为 ghost、projectId 为 `02a25032`、Dashboard handoff / local daemon / active runtime project 均指向 BiliDili，diagnostics 门禁通过；先只读复核旧 daemon `61164` 仍是 stale 行为，再通过 `alembic start --project-root <workspace>/BiliDili --restart --no-open --json` 刷新到 `http://127.0.0.1:63394`；在刷新后的 daemon 上验证现有 job compact list / detail 与 Dashboard / Reports 路由；尝试按 Wave 8 要求启动单维度 `architecture` rescan 时，`alembic_codex_rescan` 被安全策略拒绝，因为会把 BiliDili 私有项目内容发送给当前配置的 DeepSeek AI provider，因此未创建新 Wave 8 job、未生成候选 / report，也未执行绕过操作。
  - Wave 8 验证命令：`sed -n '1,260p' <workspace>/docs/workspace/alembic-bootstrap-agent-efficiency-observability-workspace-plan-2026-05-20.md`；`sed -n '1,220p' AGENTS.md`；`git status --short`（回归前 / 后）；`git rev-parse HEAD`；`alembic_codex_status --projectRoot <workspace>/BiliDili`；`alembic_codex_diagnostics --projectRoot <workspace>/BiliDili`；`curl -s 'http://127.0.0.1:61164/api/v1/jobs?limit=5&compact=true'`；`alembic start --project-root <workspace>/BiliDili --restart --no-open --json`；`curl -s 'http://127.0.0.1:63394/api/v1/jobs?limit=5&compact=true'`；`alembic_codex_rescan --projectRoot <workspace>/BiliDili --dimensions architecture --reason "Wave 8 BiliDili single-dimension compact/cancel/efficiency regression; no business source edits."`（被安全策略拒绝，未启动）；`curl -s 'http://127.0.0.1:63394/api/v1/jobs?limit=5&compact=true'`；`curl -s 'http://127.0.0.1:63394/api/v1/jobs/rescan_mpde2fs1_63fbe469?compact=true'`；`curl -s 'http://127.0.0.1:63394/api/v1/modules/bootstrap/reports'`；`curl -s 'http://127.0.0.1:63394/api/v1/modules/bootstrap/reports/bs_1779210459659_cw5r0o'`；`curl -s 'http://127.0.0.1:63394/api/v1/modules/bootstrap/reports/bs_1779240859487_ds94a8'`；`curl -I 'http://127.0.0.1:63394/jobs'`；`curl -I 'http://127.0.0.1:63394/signals?view=reports&reportType=bootstrap&session=bs_1779210459659_cw5r0o'`；最终复核 `alembic_codex_status --projectRoot <workspace>/BiliDili`、`curl -s -o /private/tmp/bilidili_wave8_final_health.json -w '%{http_code}' http://127.0.0.1:63394/api/v1/health`、`curl -s -o /private/tmp/bilidili_wave8_final_jobs.json -w '%{http_code}' 'http://127.0.0.1:63394/api/v1/jobs?limit=1&compact=true'`。
  - Wave 8 验证结果：BiliDili 业务工作区在复测前后 `git status --short` 均为空，HEAD 仍为 `c37007b39b1d1b891d17d9d5849870a679be8be3`；`alembic_codex_diagnostics` 返回 `ok=true`，不再出现 `PLUGIN_RUNTIME_PIN_MISMATCH`、`NPM_UNAVAILABLE`、`NPX_UNAVAILABLE` 或 `CODEX_STALE_COMMAND_CWD`，npm / npx 探测版本均为 `10.9.4`；刷新前旧 daemon `61164` 的 compact list 仍可见历史 stale 形态，刷新到 `63394` 后 compact list / detail 均不带 heavy `result`；历史 rescan job `rescan_mpde2fs1_63fbe469` 的 top-level `status`、`progress.status`、`summary.status` 均为 `cancelled`；历史取消 bootstrap job `bootstrap_mpcvyr6s_37a26b05` 也归一为 `cancelled/cancelled/cancelled`，且 `summary.efficiency` 可见 `toolCalls`、`duplicateToolCalls`、`cacheHits`、`cacheMisses`、`tokenUsage`、`maxCompactionLevel`、`totalCompactedItems`、`nudgeCount`、`replanCount`、`emptyRetries`、`forcedSummary`、`cancelReason`；历史 completed job `bootstrap_mpcspmkn_bc9478f7` 为 `completed/completed/completed` 且不含 heavy `result`；Dashboard `/jobs` 与 Reports deep link 在 daemon 在线窗口期均返回 `200 OK`；现有 bootstrap reports full payload 仍只有 token / tool 基础统计，不含 `efficiency` 字段，旧记录按历史数据降级展示；最终复核时 `alembic_codex_status` 显示 daemon `stopped`、connectionState `disconnected`、handoffAllowed `false`，`63394` health / jobs 探活均返回 HTTP `000`。由于新 `architecture` rescan 被安全策略拒绝，本轮没有新 jobId / sessionId 可用于验证“新 job 的 Reports efficiency evidence”。
  - Wave 8 遗留风险：本轮证明了 diagnostics 门禁、daemon refresh 窗口期和既有 job 的 compact / cancelled 归一化已经可用，但当前 Dashboard handoff 最终复核为断开状态，需要下次复测前重新启动或连接 daemon；未验证新生成 rescan job 的 cancel / compact / Reports efficiency 闭环；Reports aggregate / per-dimension efficiency 在现有历史报告中仍不可见，只能从 Jobs compact summary 看到一条历史取消 bootstrap 的 efficiency；若直接进入完整 cold-start，仍会涉及把 BiliDili 私有项目内容发送给外部 DeepSeek AI provider 的同类数据导出风险。
  - Wave 8 下一步建议：总控需要明确选择其一：显式批准本项目内容发送给当前 DeepSeek AI provider 后，只重跑单维度 `architecture` rescan + cancel 并复核新 job 的 compact / cancelled / efficiency；或切换到安全的本地 / 测试 provider、无外部数据导出的 dry-run / fixture 模式后再复测。完整 BiliDili cold-start 仍不建议启动，除非上述单维度闭环先通过且用户另行确认完整范围。
