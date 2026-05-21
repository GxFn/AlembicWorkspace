# AlembicTest Exchange

状态：Test-2026-05-21-03 已完成，AlembicTest 仓库封口完成
维护窗口：AlembicWorkspace
执行窗口：AlembicTest
更新日期：2026-05-21

本文件是总控窗口与 `AlembicTest` 之间的专门测试交流文档。总控只在这里创建测试单、写清目标和验收标准；`AlembicTest` 读取测试单后执行，并在这里回填摘要与证据。详细测试报告保存在 `AlembicTest/docs/`。

长期流程见 [alembic-test-exchange-policy.md](alembic-test-exchange-policy.md)。

## 当前测试单

`Test-2026-05-21-01` 已由 AlembicTest 执行并回填，总控验收结论为失败。`Alembic` 已补齐 daemon MCP bridge 兼容能力，但总控根据用户决策调整边界：Alembic 作为 resident service 被 Plugin 按需请求，Codex-facing `prime` 不应做 MCP tool ownership bridge。`AlembicPlugin` service request 边界修正与 `Test-2026-05-21-02` 均已通过。当前 `AlembicPlugin` 已完成并通过总控验收 prime immediate receipt shout；`Test-2026-05-21-03` 已验证 BiliDili 真实可见行为并由 `AlembicTest` 封口提交。当前没有待启动测试单，等待 `AlembicPlugin` 完成 SHOUT-5 可见摘要优化后再决定是否创建新复测单。

| 测试单 | 状态 | 目标 | 执行窗口 | 报告 |
| --- | --- | --- | --- | --- |
| Test-2026-05-21-03：BiliDili prime immediate receipt shout 可见行为复测 | 已完成 | 功能验收通过；`AlembicTest` 已提交测试报告 / probe 脚本 / 文档变更，commit `b532cd8bf7c40c8f12b93f91380befdea617d999` | `AlembicTest` | [../../AlembicTest/docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md) |
| Test-2026-05-21-02：BiliDili prime shout service boundary 复测 | 已完成 | 功能验收通过；`AlembicTest` 已提交测试报告 / probe 脚本 / 文档变更，commit `af0430ad69b4da50469eeaded8caa77c59e996e5` | `AlembicTest` | [../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md) |
| Test-2026-05-21-01：BiliDili prime 注入与 Codex 知识呐喊插件验证 | 已完成 | 结论为失败：BiliDili Recipes 可读，但 `prime` 未返回 `primeKnowledgeMaterial`；后续复测已转入 Test-2026-05-21-02 | `AlembicTest` | [../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md) |

### Test-2026-05-21-03：BiliDili prime immediate receipt shout 可见行为复测

状态：已完成（功能通过，AlembicTest 仓库封口提交完成）
创建日期：2026-05-21
总控来源：`AlembicPlugin` 已完成并通过总控验收 prime immediate receipt shout；需要在 BiliDili 真实项目中验证 Codex 可见行为确实是 prime 后立即呐喊，而不是最终总结时才呐喊。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明在 BiliDili 项目上下文中触发 `alembic_task(operation="prime")` 后，Codex 的下一条开发者可见响应就是 knowledge receipt shout。
- 证明该呐喊由 Codex 根据 `primeKnowledgeMaterial` 自主总结，说明接收到哪些 Recipe / Guard / 项目知识、哪些 evidenceRefs 有行号或缺行号，以及 empty / degraded 时不能假装有项目知识。
- 证明 payload 包含 immediate receipt shout 新时序字段：`hostResponse.action === "shout_prime_knowledge_receipt"`、`timing === "immediate_after_prime"`、`requiredBeforeNextAction === true`、`visibility === "developer_visible"`。
- 证明 installed Codex plugin cache / Skill / MCP runtime 已覆盖 `AlembicPlugin` 提交 `829f838704159c7ed205f93ecd986c6234173721` 和 AlembicCodex runtime artifact `682e5d32b9442c1caba9df87f61efb8b0835e870`。
- 证明 BiliDili 真实项目在测试前后 git 状态保持干净。

#### 非目标

- 不重新生成 BiliDili Recipes。
- 不启动完整 cold-start / rescan。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不验证 publish / deprecate / approve / fast_track 等管理权限。
- 不把失败定位直接修在 BiliDili；若插件、Skill、runtime 或 Codex host 行为有问题，回填证据后交回对应源仓库。

#### 前置条件

- BiliDili Recipes 已由测试线生成完成。
- `AlembicPlugin` immediate receipt shout 已通过总控验收：Plugin 提交 `829f838704159c7ed205f93ecd986c6234173721`。
- AlembicCodex runtime artifact 已刷新：`682e5d32b9442c1caba9df87f61efb8b0835e870`。
- 总控已刷新本机 Codex plugin cache：cache marker `gitHead=829f838704159c7ed205f93ecd986c6234173721`，`localMcpEntry` 指向 `AlembicPlugin/dist/bin/codex-mcp.js`；cache Skill 已包含 immediate receipt shout 文案，cache runtime dist 已包含 `immediate_after_prime` / `requiredBeforeNextAction`。
- 测试前记录 BiliDili git 状态；测试后再次记录，确认真实项目未被修改。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中通过 Codex / Alembic Codex 插件触发 `alembic_task prime`。
- 允许操作：读取 BiliDili 已生成 Recipes、调用 Alembic Codex 插件 prime、截取 / 保存 MCP payload 摘要、记录 prime tool result 后的下一条 Codex 可见回复、读取插件 / daemon / Codex 相关日志。
- 禁止操作：不得写入或修改 BiliDili 业务源码；不得启动 cold-start / rescan；不得清理或重建真实项目；不得把测试脚本写回 BiliDili；不得手动补造 Recipes 来让测试通过。
- 允许读取：BiliDili Recipes、插件 prime 返回 payload、Codex 可见回复、Alembic / plugin runtime 版本和日志、BiliDili git 状态、Codex plugin cache marker 和 Skill 文案。
- 禁止修改：BiliDili 仓库任何受 git 跟踪文件；如运行时产生缓存或临时文件，必须记录路径、原因和是否影响真实项目。

#### 观察点

- 安装态版本：cache marker `gitHead` 应为 `829f838704159c7ed205f93ecd986c6234173721`；Skill Daily Coding Flow 应包含 immediate receipt shout；runtime dist task 应包含 `immediate_after_prime` 和 `requiredBeforeNextAction`。
- MCP / plugin payload：`success` 应为 true；`data.primeKnowledgeMaterial.status` 应为 `delivered`、`empty` 或 `degraded`；`hostResponse` 必须包含新时序字段；`shoutInstruction` 必须包含 immediate-before-next-action 语义。
- Codex 可见行为：prime tool result 后，下一条开发者可见响应必须先声明接收到的知识 / empty / degraded，再继续任何搜索、读代码、编辑、Guard 或最终总结。
- Codex 呐喊内容：若 delivered，应包含至少若干具体 Recipe / Guard 名称或 trigger、摘要 / actionHint、路径 / 行号证据；若 evidenceRef line 为 null，应如实说明行号缺失。
- 契约回归：payload 和 nextActions 不应包含 `codex_host_response` tool；`alembic_task prime` 仍应为 `plugin-owned-codex-facing` service boundary。
- 真实项目状态：BiliDili 测试前后 git 状态应保持干净。

#### 验收标准

- 通过：版本证据匹配最新 Plugin / runtime / cache；BiliDili 上下文成功触发 `prime`；payload 包含 immediate hostResponse 字段；Codex 下一条可见响应先做 receipt shout，再继续任务；无 `codex_host_response` tool；BiliDili 仓库前后不被修改。
- 失败：Codex 静默继续、先搜索 / 读代码 / 编辑 / Guard / 总结再呐喊，或只在最终总结时提到 prime；payload 缺少 `timing` / `requiredBeforeNextAction` / `visibility`；Skill/cache 仍是旧文案但未按阻塞处理；出现 `codex_host_response` tool；BiliDili 被修改。
- 阻塞：插件不可用、Codex MCP 无法启动、BiliDili Recipes 未实际可读、cache marker 不是 `829f838704159c7ed205f93ecd986c6234173721`，或无法观察 prime 后下一条可见响应；需记录阻塞点和证据，不扩大测试范围。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short --branch
# 读取 Codex plugin cache marker / Skill / runtime dist 以确认安装态版本。
# 在 BiliDili 项目上下文中触发 Alembic Codex 插件 prime，并记录 payload / prime 后下一条 Codex 可见回复。
git -C ../BiliDili status --short --branch
```

#### 回填要求

- 测试结论：通过，已完成总控功能验收与 `AlembicTest` 仓库封口提交。BiliDili 上下文中 `alembic_task(operation="prime")` 成功返回 `primeKnowledgeMaterial.status=delivered`，且 prime tool result 后下一条开发者可见响应先声明收到的 Recipe / Guard / evidenceRefs，再继续读取 probe JSON、复核 git 和写报告。
- 执行范围：只读调用 Alembic Codex MCP stdio runtime 的 `alembic_codex_status` 与 `alembic_task prime`；未启动 cold-start / rescan；未修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 使用配置：`ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR` 指向 workspace 内 `BiliDili`；MCP entry 使用 cache marker 指向的 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；agent tier；`ALEMBIC_RUNTIME_MODE=plugin`；输出 JSON 为 `AlembicTest/tmp/bilidili-prime-immediate-receipt-shout-probe-2026-05-21.json`。
- plugin / runtime / Core / Alembic daemon / Codex plugin cache 版本证据：cache marker `.alembic-dev-refresh.json` 显示 `gitHead=829f838704159c7ed205f93ecd986c6234173721`、`localMcpEntry=AlembicPlugin/dist/bin/codex-mcp.js`；`AlembicPlugin` 当前 HEAD `681b8b6db02b0cd82b4e85e91574faa1e4572547` 且包含目标提交 `829f838704159c7ed205f93ecd986c6234173721`；AlembicCodex runtime artifact `AlembicPlugin/plugins/alembic-codex` HEAD 为 `682e5d32b9442c1caba9df87f61efb8b0835e870`；cache Skill 与 runtime Skill 的 `alembic/SKILL.md:25` 已要求 prime 后立即 receipt shout；cache runtime dist 与 workspace Plugin dist 的 `task.js:307,309,310` 含 `immediate_after_prime` / `requiredBeforeNextAction` / `developer_visible`；local daemon status 为 stale，但本次 `serviceBoundary.residentServiceRequested=false`。
- `prime` 调用入口：`node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-immediate-receipt-shout-probe-2026-05-21.json`，脚本内部调用 `alembic_task` 参数为 `operation=prime`、`activeFile=Sources/Features/VideoFeed/VideoFeedViewController.swift`、`language=swift`。
- `prime` payload 摘要：`success=true`；`status=delivered`；`acceptedKnowledge=5`；`acceptedGuard=1`；`evidenceRefs=18`；知识包括 `@schemerouter-url-decoupling`、`@route-error-eight-cases`、`@analytics-middleware-tracker`、`@lazy-var-uicomponents`、`@modulemanager-priority-lifecycle`，Guard 为 `@protocol-naming-suffixes`。
- `hostResponse` 新时序字段摘要：`action=shout_prime_knowledge_receipt`；`receiptId=prime-mpffae1u-1`；`timing=immediate_after_prime`；`required=true`；`requiredBeforeNextAction=true`；`visibility=developer_visible`；`reason` 明确要求此 receipt 必须是 prime tool result 后、任何后续 tool call / code reading / edit / Guard / final summary 前的下一条开发者可见响应。
- `serviceBoundary` 摘要：`executionPath=plugin-owned-codex-facing`；`owner=alembic-plugin`；`operation=prime`；`tool=alembic_task`；`residentServiceRequested=false`；`sharedContractCandidate=true`。
- prime tool result 后的下一条 Codex 可见响应原文或摘要：已先声明“收到 5 条 Recipe、1 条 Guard”，列出 SchemeRouter、RouteError、AnalyticsMiddleware、lazy var UI、ModuleManager、Protocol 命名后缀，并说明 `SchemeRoute.swift:8` 有行号，其余多条 evidenceRefs 只有路径无行号，不会伪装精确行号；同时声明 receipt `prime-mpffae1u-1` 已在任何后续验证动作前完成。
- 是否先呐喊再继续任务：是。probe tool result 后，下一条开发者可见响应就是 receipt shout；之后才继续读取 JSON、复核 BiliDili git 和写报告。
- 是否出现 `codex_host_response` tool：否。tool list 共 26 个工具，包含 `alembic_task`，不包含 `codex_host_response`；`nextActions` 仅包含可选 `alembic_task(operation=create)`。
- BiliDili git 状态前后对比：测试前 `## main...origin/main`；测试后 `## main...origin/main`；无受 git 跟踪或未跟踪文件变化。
- 关键日志信号：MCP stderr tail 为 `Alembic Codex MCP ready — 26 tools`；probe duration `4990ms`；status policy 有 `CODEX_DAEMON_STALE` warning，但本次 prime 由 Plugin-owned path 成功返回，未请求 resident service。
- 详细报告路径：[../../AlembicTest/docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md)
- `AlembicTest` commit hash：`b532cd8bf7c40c8f12b93f91380befdea617d999`
- 提交范围：`docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md`、`scripts/probe-codex-prime.mjs`、`scripts/README.md`；共 3 个文件，记录 Test-03 测试报告、probe immediate timing 字段校验和脚本说明更新。
- 是否仍有未提交变更：`AlembicTest` 仓库无未提交文件变更，`main` 相对 `origin/main` ahead 1；`BiliDili` 仍为 `## main...origin/main`，无未提交变更；本交换文档回填属于 workspace 总控文档变更，按规则留给主控窗口统一提交。
- 遗留风险：多数 evidenceRefs 只有路径没有行号，payload 和可见呐喊已如实说明，不阻塞本次通过；local Alembic daemon stale 不影响本次 Plugin-owned prime immediate receipt shout，但 Dashboard/daemon handoff 仍需另测；原始 probe JSON 位于 `AlembicTest/tmp/`，长期报告只保留脱敏摘要。
- 下一步建议：总控验收通过后可关闭 Test-2026-05-21-03；若要提升证据精度，后续交给 Alembic/AlembicCore 知识生成链路补强 evidenceRef 行号；若要验证 Dashboard handoff 或 daemon ready，另建独立测试单。
- 建议归属窗口：总控验收归 `AlembicWorkspace`；evidenceRef 行号补强建议归 `Alembic` / `AlembicCore`；本测试不建议改 BiliDili。

### Test-2026-05-21-02：BiliDili prime shout service boundary 复测

状态：已完成（功能通过，AlembicTest 仓库封口提交完成）
创建日期：2026-05-21
总控来源：`AlembicPlugin` 已完成并通过总控验收 service request 边界修复，需要在 BiliDili 真实项目中复测 `prime` 注入和 Codex 知识呐喊。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明 Alembic Codex 插件在 BiliDili 项目根上下文中调用 `alembic_task(operation="prime")` 时，不再因为 local Alembic daemon ready 而把 Codex-facing prime 转发到 `/api/v1/mcp/call`。
- 证明返回 payload 包含 Plugin 生成的 `data.primeKnowledgeMaterial`、`hostResponse.action === "shout_prime_knowledge_receipt"`、`shoutInstruction` 和 `data.serviceBoundary`。
- 证明 Codex 在拿到 prime 后做开发者可见的知识呐喊：说明它接收到了哪些 BiliDili Recipe / Guard / 项目知识，引用哪些路径 / 行号证据，并如实说明 empty / degraded 情况。
- 证明 BiliDili 真实项目在测试前后 git 状态保持干净。

#### 非目标

- 不重新生成 BiliDili Recipes。
- 不启动完整 cold-start / rescan。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不验证 publish / deprecate / approve / fast_track 等管理权限。
- 不把失败定位直接修在 BiliDili；若插件、Core 或 Alembic resident service 有问题，回填证据后交回对应源仓库。

#### 前置条件

- BiliDili Recipes 已由测试线生成完成。
- `AlembicPlugin` service request 边界已通过总控验收：Plugin 提交 `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`。
- AlembicCodex runtime artifact 已刷新：`7a7c5dce492c632e4ee3301f7eb989faec1d5118`。
- `Alembic` daemon MCP bridge 兼容修复已完成：提交 `83130a6add9806c124d334281a0ec7f219afd33e`；本测试不把它作为 prime 主路径，只用于观察是否被绕开。
- 测试前记录 BiliDili git 状态；测试后再次记录，确认真实项目未被修改。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中通过 Codex / Alembic Codex 插件触发 `alembic_task prime`。
- 允许操作：读取 BiliDili 已生成 Recipes、调用 Alembic Codex 插件 prime、截取 / 保存 MCP payload 摘要、记录 Codex 可见回复、读取插件 / daemon / Codex 相关日志。
- 禁止操作：不得写入或修改 BiliDili 业务源码；不得启动 cold-start / rescan；不得清理或重建真实项目；不得把测试脚本写回 BiliDili；不得手动补造 Recipes 来让测试通过。
- 允许读取：BiliDili Recipes、插件 prime 返回 payload、Codex 可见回复、Alembic / plugin runtime 版本和日志、BiliDili git 状态。
- 禁止修改：BiliDili 仓库任何受 git 跟踪文件；如运行时产生缓存或临时文件，必须记录路径、原因和清理建议。

#### 观察点

- MCP / plugin payload：`success` 应为 true；`data.primeKnowledgeMaterial` 应包含 `acceptedKnowledge`、`acceptedGuards` 或等价知识材料、`evidenceRefs`、`shoutInstruction`、`hostResponse`。
- Service boundary：`data.serviceBoundary.executionPath === "plugin-owned-codex-facing"`、`owner === "alembic-plugin"`、`residentServiceRequested === false`、`tool === "alembic_task"`。
- Codex 呐喊：Codex 在拿到 prime 后，应以开发者可见自然语言说明“我接收到了哪些 BiliDili 项目知识”，并包含至少若干具体 Recipe / Guard 名称或摘要、对应路径 / 行号证据，以及对空结果 / 降级的如实说明。
- 契约回归：`nextActions` 不应包含 `tool: "codex_host_response"`；如果 payload 有宿主回复动作，应以非 MCP tool 语义字段表达。
- 路由回归：如果日志能观察到请求路径，应确认 `prime` 不走 daemon MCP bridge；若无法直接观察，也必须以 `serviceBoundary`、payload 和错误形态判断。
- 真实项目状态：BiliDili 测试前后 git 状态应保持干净；如果有运行时生成文件，必须说明是否未跟踪、是否应清理，以及是否影响真实项目。
- 版本证据：记录 AlembicPlugin / AlembicCodex runtime / embedded Core / Alembic daemon 的提交或 source snapshot，确认测试覆盖的是最新验收后的插件。

#### 验收标准

- 通过：在 BiliDili 项目上下文中成功触发 `prime`，返回真实知识材料和 `plugin-owned-codex-facing` service boundary，Codex 做出可见知识呐喊，payload 中无虚构 `codex_host_response` MCP tool，BiliDili 仓库前后不被修改。
- 失败：`prime` 返回 empty / degraded 且无法解释为有效无数据；Codex 静默继续或只说“已完成”而未声明接收到的知识；payload 仍暴露 `codex_host_response` tool；`serviceBoundary` 缺失或仍显示 daemon ownership；`acceptedKnowledge` / evidence refs 缺失；BiliDili 被修改。
- 阻塞：插件不可用、Codex MCP 无法启动、BiliDili Recipes 未实际可读、或 runtime 版本不是本次验收后的插件；需记录阻塞点和证据，不扩大测试范围。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short
# 在 BiliDili 项目上下文中触发 Alembic Codex 插件 prime，并记录 payload / Codex 可见回复。
git -C ../BiliDili status --short
```

#### 回填要求

- 测试结论：
- 执行范围：
- 使用配置：
- plugin / runtime / Core / Alembic daemon 版本证据：
- `prime` 调用入口：
- `prime` payload 摘要：
- `serviceBoundary` 摘要：
- Codex 知识呐喊原文或摘要：
- 是否出现 `codex_host_response` tool：
- 是否观察到 daemon bridge 被绕开：
- BiliDili git 状态前后对比：
- 关键日志信号：
- 详细报告路径：建议 `AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md`
- 遗留风险：
- 下一步建议：
- 建议归属窗口：

### Test-2026-05-21-01：BiliDili prime 注入与 Codex 知识呐喊插件验证

状态：已完成
创建日期：2026-05-21
总控来源：用户说明 BiliDili 项目的 Recipes 已生成完成，要求在 BiliDili 项目里进行插件测试，检查 `prime` 注入和 Codex 呐喊。
执行窗口：AlembicTest
目标项目：BiliDili（真实测试项目，仅作为目标项目，不是独立执行窗口）

#### 测试目标

- 证明 Alembic Codex 插件在 BiliDili 项目根上下文中可以读取已生成 Recipes，并通过 `alembic_task prime` 返回真实的 `primeKnowledgeMaterial`。
- 证明 `primeKnowledgeMaterial` 能支撑 Codex host agent 做开发者可见的知识呐喊：Codex 需要主动说明它从 prime 接收到了哪些 BiliDili 项目知识、引用了哪些路径 / 行号证据、是否有 Guard / Recipe 约束，以及是否存在 empty / degraded 风险。
- 证明 Recipe 交互契约 Wave 1 的可见行为已进入插件真实运行面：`nextActions` 不再暴露虚构 `codex_host_response` MCP tool；宿主可见回复动作应通过 `hostResponse` / `shoutInstruction` 表达。

#### 非目标

- 不重新生成 BiliDili Recipes。
- 不启动完整 cold-start / rescan。
- 不修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。
- 不验证 publish / deprecate / approve / fast_track 等管理权限；默认 Codex agent 仍不应拥有这些能力。
- 不把失败定位直接修在 BiliDili；若插件或 Core 有问题，回填证据后交回对应源仓库。

#### 前置条件

- BiliDili Recipes 已由测试线生成完成。
- `AlembicPlugin` 已包含 Recipe 交互契约 Wave 1：Plugin 提交 `8602ae9e71874af389709db680104b2c1ee0edbb`，AlembicCodex runtime 提交 `4abb80efca55d37dc39667facdd18e8a35a08cad`。
- `AlembicCore` 已包含 Recipe 交互契约 Wave 1：Core 提交 `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`。
- 测试前记录 BiliDili git 状态；测试后再次记录，确认真实项目未被修改。

#### 执行范围

- 触发入口：在 BiliDili 项目上下文中通过 Codex / Alembic Codex 插件触发 `alembic_task prime`。
- 允许操作：读取 BiliDili 已生成 Recipes、调用 Alembic Codex 插件 prime、截取 / 保存 MCP payload 摘要、记录 Codex 可见回复、读取插件 / daemon / Codex 相关日志。
- 禁止操作：不得写入或修改 BiliDili 业务源码；不得启动 cold-start / rescan；不得清理或重建真实项目；不得把测试脚本写回 BiliDili；不得手动补造 Recipes 来让测试通过。
- 允许读取：BiliDili Recipes、插件 prime 返回 payload、Codex 可见回复、Alembic / plugin runtime 版本和日志、BiliDili git 状态。
- 禁止修改：BiliDili 仓库任何受 git 跟踪文件；如运行时产生缓存或临时文件，必须记录路径、原因和清理建议。

#### 观察点

- MCP / plugin payload：`status` 应为 `delivered`；`data.primeKnowledgeMaterial` 应包含 `acceptedKnowledge`、`acceptedGuards` 或等价知识材料、`evidenceRefs`、`shoutInstruction`、`hostResponse`。
- Codex 呐喊：Codex 在拿到 prime 后，应以开发者可见自然语言说明“我接收到了哪些 BiliDili 项目知识”，并包含至少若干具体 Recipe / Guard 名称或摘要、对应路径 / 行号证据，以及对空结果 / 降级的如实说明。
- 契约回归：`nextActions` 不应包含 `tool: "codex_host_response"`；如果 payload 有宿主回复动作，应以非 MCP tool 语义字段表达。
- 真实项目状态：BiliDili 测试前后 git 状态应保持干净；如果有运行时生成文件，必须说明是否未跟踪、是否应清理，以及是否影响真实项目。
- 版本证据：记录 AlembicPlugin / AlembicCodex runtime / embedded Core 的提交或 source snapshot，确认测试覆盖的是最新验收后的插件。

#### 验收标准

- 通过：在 BiliDili 项目上下文中成功触发 `prime`，返回真实知识材料，Codex 做出可见知识呐喊，payload 中无虚构 `codex_host_response` MCP tool，BiliDili 仓库前后不被修改。
- 失败：`prime` 返回 empty / degraded 且无法解释为有效无数据；Codex 静默继续或只说“已完成”而未声明接收到的知识；payload 仍暴露 `codex_host_response` tool；`acceptedKnowledge` / evidence refs 缺失；BiliDili 被修改。
- 阻塞：插件不可用、Codex MCP 无法启动、BiliDili Recipes 未实际可读、或 runtime 版本不是本次验收后的插件；需记录阻塞点和证据，不扩大测试范围。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身仓库脚本和 Codex 插件测试流程执行；总控不直接运行。
git -C ../BiliDili status --short
# 在 BiliDili 项目上下文中触发 Alembic Codex 插件 prime，并记录 payload / Codex 可见回复。
git -C ../BiliDili status --short
```

#### 回填要求

- 测试结论：
- 执行范围：
- 使用配置：
- plugin / runtime / Core 版本证据：
- `prime` 调用入口：
- `prime` payload 摘要：
- Codex 知识呐喊原文或摘要：
- 是否出现 `codex_host_response` tool：
- BiliDili git 状态前后对比：
- 关键日志信号：
- 详细报告路径：建议 `AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md`
- 遗留风险：
- 下一步建议：
- 建议归属窗口：

## 可复制提示词

发送给：无。

当前没有待启动测试单；不要发送给 `AlembicTest`。下一轮真实复测需要等 `AlembicPlugin` 完成 SHOUT-5 后，由总控新建测试单。

## 统一测试单模板

统一模板保存在 [../../templates/alembic-test-handoff-template.md](../../templates/alembic-test-handoff-template.md)。总控创建测试单时，从该模板复制到本文“当前测试单”或新建具体测试单段落；本文只保留当前测试交流状态，不重复维护模板正文。

## 回填区

### Test-2026-05-21-03 总控功能验收

- 2026-05-21：总控功能验收通过。证据满足测试单通过条件：BiliDili 上下文 `alembic_task prime` 成功；`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuards=1`；`evidenceRefs=18`；`hostResponse.action=shout_prime_knowledge_receipt`；`hostResponse.timing=immediate_after_prime`；`hostResponse.requiredBeforeNextAction=true`；`hostResponse.visibility=developer_visible`；`serviceBoundary.executionPath=plugin-owned-codex-facing`；`residentServiceRequested=false`；tool list / `nextActions` 均不含 `codex_host_response`；prime tool result 后下一条开发者可见响应先声明收到 5 条 Recipe 和 1 条 Guard，再继续读取 JSON、复核 git 和写报告；BiliDili 测试前后 `git status --short --branch` 均为 `## main...origin/main`。
- 2026-05-21：功能验收后曾发现 `AlembicTest` 仓库仍有未提交变更：`scripts/README.md`、`scripts/probe-codex-prime.mjs`，以及未跟踪报告 `docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md`，因此当时先派发 `AlembicTest` 做封口提交。
- 2026-05-21：`AlembicTest` 已封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；提交范围为 `docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md`、`scripts/probe-codex-prime.mjs`、`scripts/README.md`；`AlembicTest` 与 BiliDili 工作区均干净。Test-2026-05-21-03 最终状态为已完成。

### Test-2026-05-21-02 回填

- 测试结论：通过，已完成总控功能验收与 AlembicTest 仓库封口提交。`alembic_task prime` 在 BiliDili 上下文成功返回 delivered `primeKnowledgeMaterial`、`hostResponse`、`shoutInstruction` 和 `serviceBoundary`；Codex 可基于 payload 做知识接收呐喊；BiliDili git 前后保持干净。
- 执行范围：通过 AlembicTest 自有脚本启动 Alembic Codex MCP stdio runtime，在 BiliDili 上下文调用 `alembic_codex_status` 和 `alembic_task(operation=prime)`；未启动 cold-start / rescan；未修改 BiliDili 源码。
- 使用配置：目标项目 `BiliDili`；active file `Sources/Features/VideoFeed/VideoFeedViewController.swift`；language `swift`；prime query 聚焦 VideoFeed/Home、模块边界、Repository、lazy var、SchemeRouter 和 Guard 约束。
- plugin / runtime / Core / Alembic daemon 版本证据：AlembicPlugin `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`；AlembicCore `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`；Alembic 当前 HEAD `ae52f823d0ab0bb4bbb846c5cdeaed76924e3cf3`；插件 package `alembic-ai@0.1.2`；local daemon `http://127.0.0.1:63030` ready，version `0.1.0`。总控列出的 daemon bridge 修复提交 `83130a6add9806c124d334281a0ec7f219afd33e` 已被当前 Alembic HEAD 后续提交覆盖。
- `prime` 调用入口：`node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-service-boundary-probe-2026-05-21.json`。
- `prime` payload 摘要：`success=true`；`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuards=1`；`evidenceRefs=18`；`hostResponse.action=shout_prime_knowledge_receipt`；`hostResponse.required=true`；`shoutInstruction` 存在；`nextActions` 仅建议 `alembic_task operation=create`，不含 `codex_host_response`。
- `serviceBoundary` 摘要：`executionPath=plugin-owned-codex-facing`；`operation=prime`；`owner=alembic-plugin`；`residentServiceRequested=false`；`tool=alembic_task`；reason 明确说明 local daemon readiness must not transfer tool ownership。
- Codex 知识呐喊原文或摘要：Codex 可见呐喊说明已接收 5 条 Recipe 和 1 条 Guard，包括 `@schemerouter-url-decoupling`、`@route-error-eight-cases`、`@analytics-middleware-tracker`、`@lazy-var-uicomponents`、`@modulemanager-priority-lifecycle` 和 Guard `@protocol-naming-suffixes`，并引用 BiliDili/AppCoordinator、RouterModule、SceneDelegate、SchemeRoute.swift:8、RouteMiddleware、Feature ViewController、ServiceProtocols 等证据；无行号的 evidenceRef 已如实标注行号缺失。
- 是否出现 `codex_host_response` tool：未出现。MCP tool list 不含 `codex_host_response`，`primeKnowledgeMaterial.nextActions` 也不含该 tool。
- 是否观察到 daemon bridge 被绕开：是。运行前 `/api/v1/mcp/call` 日志记录为 combined.log 2 次、daemon.log 0 次；运行后仍为 combined.log 2 次、daemon.log 0 次，未新增 daemon bridge 请求；同时 payload 的 `serviceBoundary.executionPath` 明确为 `plugin-owned-codex-facing`。
- BiliDili git 状态前后对比：测试前后均为 `## main...origin/main`，无 tracked/untracked 变更。
- 关键日志信号：插件本地初始化成功；Search index built，entries=79；QueryRouter 对 BiliDili / VideoFeed / SchemeRouter 等 query 完成搜索；VectorService embedding 因插件不捆绑 AI execution 降级到 sparse-only，但 prime 仍 delivered。
- 详细报告路径：[../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md)
- 遗留风险：本次测试使用 workspace 内 AlembicPlugin 本地 `dist` 入口；全局 Codex plugin cache refresh marker 可能仍是旧 git head，若要验证真实安装态需另行授权刷新缓存后复测。部分 evidenceRef 无行号，payload/呐喊已如实暴露；如需强制行号级证据，应回到 Recipe/sourceRefs 生成链路补强。插件运行时 embedding 降级为 sparse-only，不阻塞本次通过，但可作为质量优化项。
- 下一步建议：总控可将 Test-2026-05-21-02 标记为通过 / 已完成；如需要覆盖真实 Codex 安装态，再安排插件 cache refresh 后复测。
- 建议归属窗口：`AlembicWorkspace` 总控验收；可选后续为 `AlembicPlugin` 优化 sparse-only / evidenceRef 行号提示。

### Test-2026-05-21-02 总控功能验收

- 2026-05-21：总控功能验收通过。证据满足测试单通过条件：`prime.success=true`；`primeKnowledgeMaterial.status=delivered`；`acceptedKnowledge=5`；`acceptedGuards=1`；`checks.evidenceRefCount=18`；`hostResponse.action=shout_prime_knowledge_receipt` 且 `required=true`；`shoutInstruction` 存在；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`owner=alembic-plugin`、`residentServiceRequested=false`；`nextActions` 不含 `codex_host_response`；BiliDili 测试前后 `git status --short --branch` 均为 `## main...origin/main`。
- 2026-05-21：AlembicTest 仓库封口完成，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`。
- 提交范围：`package.json`、`scripts/README.md`、`scripts/probe-codex-prime.mjs`、`docs/bilidili-prime-shout-plugin-test-2026-05-21.md`、`docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md`、`docs/cold-start-bootstrap-analysis-2026-05-21.md`。
- 是否仍有未提交变更：AlembicTest 仓库无未提交文件变更；当前 `main` 分支相对 `origin/main` ahead 1，等待后续按总控需要 push。
- 遗留风险：本次提交只封口 AlembicTest 测试证据和 probe 脚本，不覆盖真实 Codex 已安装插件缓存刷新；如需验证用户实际安装态，仍需单独授权刷新插件 cache 后复测。部分 Recipe evidenceRef 仍无行号，当前测试已如实记录，不阻塞 service boundary 验收。

### Test-2026-05-21-01 回填

- 测试结论：失败。BiliDili Recipes 和插件 status 读取层通过，但真实 `alembic_task prime` 在 Plugin -> local Alembic daemon MCP bridge 处被 404 截断，未返回 `primeKnowledgeMaterial`，因此无法完成 delivered 知识呐喊验收。
- 执行范围：通过 AlembicTest 自有脚本启动 Alembic Codex MCP stdio runtime，在 BiliDili 上下文调用 `alembic_codex_status` 和 `alembic_task(operation=prime)`；未启动 cold-start / rescan；未修改 BiliDili 源码。
- 使用配置：目标项目 `BiliDili`；active file `Sources/Features/VideoFeed/VideoFeedViewController.swift`；language `swift`；prime query 聚焦 VideoFeed/Home、模块边界、Repository、lazy var、SchemeRouter 和 Guard 约束。
- plugin / runtime / Core 版本证据：AlembicPlugin `8602ae9e71874af389709db680104b2c1ee0edbb`；AlembicCore `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`；插件 package `alembic-ai@0.1.2`；local daemon version `0.1.0`；当前已安装 Codex plugin cache 标记仍是旧 git head，未在本测试中同步全局插件缓存。
- `prime` 调用入口：`node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-probe-2026-05-21-escalated.json`。
- `prime` payload 摘要：status probe 显示 `initialized=true`、`knowledge_ready`、`recipeCount=79`、`sourceRefs=196`、vector `ready`、`alembic_task` 工具可见；prime 返回 `success=false`、`CODEX_MCP_ERROR`、`Route not found: POST /api/v1/mcp/call`。
- Codex 知识呐喊原文或摘要：因未收到 `primeKnowledgeMaterial`，Codex 只能如实声明“我没有收到 primeKnowledgeMaterial，因此不能声称接收到了 BiliDili 的 Recipe 或 Guard 知识。”这不满足测试单要求的 delivered 知识呐喊。
- 是否出现 `codex_host_response` tool：MCP tool list 中未出现 `codex_host_response`；但由于 prime payload 缺失，无法验证 `nextActions` payload 层是否正确。
- BiliDili git 状态前后对比：测试前后均为 `## main...origin/main`，无 tracked/untracked 变更。
- 关键日志信号：daemon health ready；直接 POST `/api/v1/mcp/call` 返回 404 `NOT_FOUND`；daemon 日志记录 `/api/v1/mcp/call` 404 HTTP 请求。
- 详细报告路径：[../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md)
- 遗留风险：Plugin 在 `requirement: "mcp"` 时仅凭 daemon API ready 选择 `local-alembic-daemon`，没有确认 MCP bridge endpoint；本地 daemon health 未声明 MCP bridge capability；实际 Codex installed cache 可能尚未同步到目标提交。
- 下一步建议：`Alembic` 已补齐 `/api/v1/mcp/call` 兼容 bridge；后续由 `AlembicPlugin` 修正 service request 边界，让 Codex-facing `alembic_task prime` 留在 Plugin 并保留 `primeKnowledgeMaterial` / `hostResponse` / `shoutInstruction`；修复后由 `AlembicTest` 重跑本测试单。
- 建议归属窗口：`AlembicPlugin`，修复后回到 `AlembicTest` 复测。

### 总控验收

- 2026-05-21：总控验收 Test-2026-05-21-01 为“失败但有效”。证据满足失败分类：BiliDili Recipes/status 可读，`alembic_task` 可见，MCP tool list 不暴露 `codex_host_response`，BiliDili git 前后干净；但真实 `prime` 被 Plugin -> Alembic daemon `/api/v1/mcp/call` 404 截断，未返回 `primeKnowledgeMaterial`，因此未形成 Codex 知识呐喊闭环。
- 当时后续动作：`Alembic` bridge 修复 wave 已收口；`AlembicPlugin` service request 边界通过总控验收后，已创建 Test-2026-05-21-02 并发送给 `AlembicTest` 复测。

### Test-2026-05-21-02 总控创建

- 2026-05-21：总控创建 Test-2026-05-21-02，状态为 `待启动`。测试重点是 BiliDili 真实项目上下文中的 `alembic_task prime` payload、`data.serviceBoundary.executionPath === "plugin-owned-codex-facing"`、Codex 知识呐喊、无 `codex_host_response` MCP tool 回归和 BiliDili git 前后干净。
