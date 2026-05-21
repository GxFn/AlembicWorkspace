# AlembicTest Exchange

状态：无待启动测试单，Test-2026-05-21-01 已验收为失败，等待 AlembicPlugin service request 边界修正后复测
维护窗口：AlembicWorkspace
执行窗口：AlembicTest
更新日期：2026-05-21

本文件是总控窗口与 `AlembicTest` 之间的专门测试交流文档。总控只在这里创建测试单、写清目标和验收标准；`AlembicTest` 读取测试单后执行，并在这里回填摘要与证据。详细测试报告保存在 `AlembicTest/docs/`。

长期流程见 [alembic-test-exchange-policy.md](alembic-test-exchange-policy.md)。

## 当前测试单

当前没有可启动测试单；`Test-2026-05-21-01` 已由 AlembicTest 执行并回填，总控验收结论为失败。`Alembic` 已补齐 daemon MCP bridge 兼容能力，但总控根据用户决策调整边界：Alembic 作为 resident service 被 Plugin 按需请求，Codex-facing `prime` 不应做 MCP tool ownership bridge。下一步进入 [alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)，先由 `AlembicPlugin` 修正 service request 边界，再创建 / 启动复测。

| 测试单 | 状态 | 目标 | 执行窗口 | 报告 |
| --- | --- | --- | --- | --- |
| Test-2026-05-21-01：BiliDili prime 注入与 Codex 知识呐喊插件验证 | 已完成 | 结论为失败：BiliDili Recipes 可读，但 `prime` 未返回 `primeKnowledgeMaterial`；后续等待 Plugin service request 边界修正 | `AlembicTest` | [../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md) |

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

发送给：无

```text
当前没有可发送给 AlembicTest 的测试任务；等待 AlembicPlugin 修正 service request 边界后再启动复测。
```

当本文出现状态为 `待启动` 的测试单时，使用：

```text
读取 docs/workspace/alembic-test-exchange.md，领取状态为 `待启动` 且执行窗口为 `AlembicTest` 的测试单；按测试单执行测试，详细报告写入 AlembicTest/docs/，并回填本文的测试结果、证据摘要、报告路径、遗留风险和下一步建议。
```

## 统一测试单模板

统一模板保存在 [../../templates/alembic-test-handoff-template.md](../../templates/alembic-test-handoff-template.md)。总控创建测试单时，从该模板复制到本文“当前测试单”或新建具体测试单段落；本文只保留当前测试交流状态，不重复维护模板正文。

## 回填区

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
- 后续动作：`Alembic` bridge 修复 wave 已收口；当前切换到 [alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)，只发送给 `AlembicPlugin` 修正 service request 边界；`AlembicTest` 等待 Plugin 修复后复测。
