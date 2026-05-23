# Alembic Global Responsibility Function Division Scheme

状态：长期方案
维护窗口：AlembicWorkspace
最后更新：2026-05-22

## 定位

本文是 Alembic 系列仓库的全局职责功能划分方案。它基于已验收的 GFBD 证据和长期契约，用来指导后续新功能、旧能力清理、共享层下沉、跨仓库协作和测试交接。

本文和 [alembic-repository-responsibility-function-boundary-contract.md](alembic-repository-responsibility-function-boundary-contract.md) 的关系：

- 契约回答“边界是什么”。
- 本文回答“遇到一个真实能力时，如何判断它应该放在哪里、如何跨仓库协作、如何验证没有走偏”。

本文不是当前执行计划，不直接派发窗口，不替代当前总控计划、仓库 `AGENTS.md`、package exports、测试规则或发布说明。后续任何真实代码调整仍必须新建或激活具体总控计划，并以真实代码证据、提交和验证结果为准。

## 证据底座

本方案只使用已经验收的长期文档和 GFBD 证据，不重新发明仓库职责。

- 当前职责契约：[alembic-repository-responsibility-function-boundary-contract.md](alembic-repository-responsibility-function-boundary-contract.md)。
- Plugin first 路线：[alembic-plugin-first-enhancement-contract.md](alembic-plugin-first-enhancement-contract.md)。
- GFBD 总控计划：[global-function-boundary-design-workspace-plan-2026-05-22.md](global-function-boundary-design-workspace-plan-2026-05-22.md)。
- Alembic 证据：[../Alembic/global-function-boundary-evidence-main-2026-05-22.md](../Alembic/global-function-boundary-evidence-main-2026-05-22.md)。
- AlembicCore 证据：[../AlembicCore/global-function-boundary-evidence-core-2026-05-22.md](../AlembicCore/global-function-boundary-evidence-core-2026-05-22.md)。
- AlembicAgent 证据：[../AlembicAgent/global-function-boundary-evidence-agent-2026-05-22.md](../AlembicAgent/global-function-boundary-evidence-agent-2026-05-22.md)。
- AlembicDashboard 证据：[../AlembicDashboard/global-function-boundary-evidence-dashboard-2026-05-22.md](../AlembicDashboard/global-function-boundary-evidence-dashboard-2026-05-22.md)。
- AlembicPlugin 证据：[../AlembicPlugin/global-function-boundary-evidence-plugin-2026-05-22.md](../AlembicPlugin/global-function-boundary-evidence-plugin-2026-05-22.md)。
- AlembicTest 证据：[../../AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md](../../AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md)。

## 总体模型

Alembic 的长期模型不是“谁能做就谁做”，而是按用户入口、运行时能力、确定性共享层、AI runtime、前端体验、验证和总控治理分层。

```text
Codex / 开发者
  -> AlembicPlugin：Codex host agent 入口、MCP、Skill、prime/search/Guard 可见交互
  -> Alembic：安装后增强，daemon、HTTP/API、Dashboard server、ProjectRegistry、JobStore、resident search
  -> AlembicCore：确定性 headless contract / service / repository / workflow / resource
  -> AlembicAgent：Alembic internal AI runtime、provider、tool system、memory/context/prompt
  -> AlembicDashboard：前端 UI、API client、可视化
  -> AlembicTest：真实项目测试、复现、回归和证据
  -> AlembicWorkspace：总控设计、派发、验收、归档和长期规则
```

核心原则是 `Plugin first, Alembic install enhances`：

- `AlembicPlugin` 是 Codex host agent 的第一入口，不是 Alembic daemon 的空壳 client。
- `Alembic` 是本地增强底座，不是另一个 Codex 插件或 IDE Agent 聚合器。
- `AlembicCore` 只承载确定性共享能力，不承载 host agent 表达、daemon lifecycle、AI provider、Dashboard UI 或 Codex MCP。
- `AlembicAgent` 是 internal AI / Agent runtime，不是 Codex host agent。
- `AlembicDashboard` 只消费 Alembic API，不通过 Plugin 承载业务 API。
- `AlembicTest` 只验证和回填证据，不承载产品实现。
- `AlembicWorkspace` 只做跨仓库总控治理，不写产品功能。

## 七个职责层

### 1. Host Agent 入口层

归属：`AlembicPlugin`。

本层负责让 Codex 知道 Alembic 能力、调用 Alembic 能力，并把知识以 Codex 能理解和能对开发者可见的方式表达出来。

应拥有：

- Codex MCP server、tool schema、tool result payload。
- Codex Skills、channel、marketplace、plugin cache、runtime artifact。
- `prime`、search、Guard、knowledge submit、dashboard handoff 等 Codex-facing envelope。
- `hostResponse`、`shoutInstruction`、receipt shout、next action 等开发者可见交互契约。
- Host project resolution、permission / tier / gateway / constitution 等 Plugin 自洽治理。
- Alembic resident service request client，例如搜索增强、daemon status、job handoff。

不应拥有：

- 第三方 AI provider runtime。
- Alembic daemon、ProjectRegistry、JobStore、file monitor。
- Dashboard 业务 API。
- Alembic internal Agent runtime。
- 真实项目测试脚本。

关键判断：如果能力的第一消费方是 Codex tool / Skill / Codex 可见文字，先看 `AlembicPlugin`；如果能力需要本地常驻服务增强，再由 Plugin 请求 `Alembic`。

### 2. 本地增强服务层

归属：`Alembic`。

本层负责安装 Alembic 后出现的本地长期能力，提供跨项目、后台任务、HTTP/API、Dashboard server 和本地数据管理。

应拥有：

- CLI、daemon lifecycle、HTTP/API、Dashboard server/static hosting。
- ProjectRuntimeControl、ProjectRegistry、WorkspaceResolver、data root、ghost root。
- JobStore、cold-start/rescan job、file monitor、system telemetry。
- Resident semantic/vector search、search telemetry、vector index service host。
- Internal AI jobs 的宿主装配、AI settings/env persistence、ToolContextFactory、sandbox/tool adapters。
- Release staging、本地安装、dev link、npm package 主发布。

不应拥有：

- Codex MCP / Skill / channel / marketplace onboarding。
- Dashboard 前端源码主实现。
- Core public API 源实现。
- Agent runtime 源实现。
- 真实项目测试执行。

关键判断：如果能力需要常驻进程、跨项目 registry、后台 job、HTTP API、Dashboard server 或本地持久化，先看 `Alembic`。

### 3. 确定性共享内核层

归属：`AlembicCore`。

本层负责无宿主依赖、可复用、可测试、可被多个仓库消费的确定性 contract 和 headless 内核。

应拥有：

- Public API、types、schema、deterministic service / repository / workflow contract。
- Recipe / Guard / project intelligence / vector / database 等可共享 deterministic contract。
- Resources、grammars、facade、public API boundary policy。
- `host-agent-workflows` 这类宿主 Agent 可消费的 workflow / session / evidence / checkpoint contract。

不应拥有：

- CLI、daemon process lifecycle、HTTP route、Dashboard server。
- Codex MCP、Skill、channel、marketplace。
- AI provider、AgentRuntime、tool router。
- Dashboard UI。
- 真实项目测试脚本。

关键判断：只有当能力不依赖宿主环境，且已有真实生产方 / 消费方，或者明确需要多个仓库共享稳定 contract，才下沉 Core。`host-agent-workflows` 是 workflow contract，不是 Core 拥有 Agent runtime 的证据。

### 4. Internal Agent Runtime 层

归属：`AlembicAgent`。

本层负责 Alembic 自身 internal AI 能力，不负责 Codex host agent 的 MCP 入口。

应拥有：

- Agent runtime、AgentService、AgentRuntimeBuilder。
- AI provider adapter、provider manager、model/tool strategy。
- Tool system、Tool V2、terminal portable policy、runtime contracts。
- Memory、context、prompt、task/profile/domain、execution loop。
- `@alembic/agent` public exports。

不应拥有：

- Codex MCP、Skill、channel、marketplace。
- Alembic daemon/API/CLI/Dashboard server。
- Core deterministic repository/search/AST/Guard 源实现。
- Dashboard UI。
- 真实项目测试操作。

关键判断：如果能力在 Alembic internal AI jobs 中运行，并涉及 provider、tool execution、memory/context/prompt 或 runtime loop，先看 `AlembicAgent`；如果能力是 Codex host agent 交互，仍归 `AlembicPlugin`。

### 5. 前端体验层

归属：`AlembicDashboard`。

本层负责浏览器内用户体验，只消费 Alembic 主体提供的 API 和事件。

应拥有：

- React/Vite UI、routes、components、hooks。
- API client、SSE/EventSource、WebSocket/socket client。
- Frontend state、i18n、theme、visualization、Help/onboarding 文案。
- 前端测试和 build 输出。

不应拥有：

- Alembic daemon/API 主实现。
- Codex Plugin runtime 或业务 API。
- Internal AI jobs。
- Core / Agent runtime。
- 真实项目测试脚本。

关键判断：如果能力表现为页面、前端状态、可视化或前端文案，先看 `AlembicDashboard`；如果需要数据或任务执行，由 Dashboard 调 Alembic API，而不是反向拥有运行时。

### 6. 测试验证层

归属：`AlembicTest`。

本层负责真实项目验证、复现、冷启动监控和证据整理。

应拥有：

- 测试单执行、真实项目复测、smoke、回归、probe。
- Restart / monitor / clean / report 等测试脚本。
- `AlembicTest/docs/` 下的测试报告和证据。
- 通过 [alembic-test-exchange.md](alembic-test-exchange.md) 与总控交接。

不应拥有：

- 产品源码实现。
- 仓库目录迁移。
- 发布物主构建。
- 真实测试项目业务改造。

关键判断：如果任务要操作 BiliDili 或其它真实项目，默认进入 `AlembicTest`，总控只写测试单和验收，不亲自执行。

### 7. 总控治理层

归属：`AlembicWorkspace`。

本层负责跨仓库设计、派发、验收、归档和长期规则。

应拥有：

- 需求设计、目标阶段确认、wave 计划。
- TODO / Backlog、任务包、窗口调度、证据验收。
- 长期契约、规则、模板、脚本、索引。
- 测试交接文档和归档入口。

不应拥有：

- 产品源码实现。
- 真实项目测试执行。
- 发布包主实现。
- Runtime 服务。

关键判断：如果任务是“决定怎么做、派给谁、验收是否完成”，归 Workspace；如果任务是“产品能力本身”，必须回到对应源仓库。

## 能力流方案

### Prime / Recipe 知识交付

目标：Codex 拿到 prime 后，能主动说出自己接收到了哪些知识，并继续任务。

职责分配：

- `AlembicPlugin` 拥有 Codex-facing prime tool、knowledge material projection、host response、shout instruction、开发者可见摘要和 next action。
- `Alembic` 在已安装时增强 Recipe / search / vector / job / daemon telemetry 等本地服务能力。
- `AlembicCore` 只承接可共享的 deterministic projection / evidence / schema / scoring contract，不能承接 Codex 可见表达。
- `AlembicDashboard` 可以展示 Recipe / search / job 状态，但不生成 Codex receipt shout。
- `AlembicTest` 只在需要真实项目复测时验证可见行为。

边界结论：

- Codex 的“呐喊”不是 Alembic 工具替 Codex说话，而是 Plugin 把必要知识材料和行为要求交给 Codex，由 Codex 在下一步行动前主动发出。
- 文件路径和行号证据属于 Codex 内部可信依据；开发者可见内容应优先是知识摘要。

### Search / Vector 能力

目标：Codex search/prime 在无 Alembic 时可基本工作，有 Alembic 时获得真实 resident semantic/vector 增强。

职责分配：

- `AlembicPlugin` 拥有 Codex-facing search tool、query payload、result envelope、fallback 状态说明和 resident service request client。
- `Alembic` 拥有 resident semantic/vector index、daemon `/api/v1/search`、telemetry 和本地向量数据生命周期。
- `AlembicCore` 拥有可复用的 search contract、scoring / vector metadata 类型和 deterministic helper。
- `AlembicPlugin` 不拥有 embedding provider 或假向量能力。Alembic 不存在时，向量增强自然不可用；这不是错误。

边界结论：

- Plugin 可以有自己的 Codex-facing search 管线，但不能伪装成拥有真实 embedding / HNSW 向量能力。
- 真正的 semantic/vector 能力来自 Alembic resident service；Plugin 只请求、解释和呈现结果。

### Cold-start / Rescan / Knowledge 生成

目标：无 Alembic 时 Codex 能通过 host agent 路线完成基础流程；安装 Alembic 后，重任务交给本地增强底座。

职责分配：

- `AlembicPlugin` 拥有 Codex host-agent bootstrap/rescan workflow 的 MCP 入口、Skill 指引、job handoff 和 user-facing status。
- `Alembic` 拥有 daemon job、JobStore、file monitor、ProjectRegistry、data root 和 internal AI jobs。
- `AlembicCore` 拥有 deterministic workflow/session/evidence/checkpoint contract。
- `AlembicAgent` 只在 Alembic internal AI jobs 需要 provider/runtime/tool/memory/prompt 时参与。

边界结论：

- `host-agent` 表示 Codex / 外部宿主 Agent 线。
- `alembic-agent` 表示 Alembic internal AI runtime 线。
- 两者不混用，不把 AlembicAgent 当 Codex host agent。

### Guard / Standards / Review

目标：Codex 能按项目知识做检查；本地 Alembic 安装后可增强数据来源和持久化。

职责分配：

- `AlembicPlugin` 拥有 Codex-facing Guard MCP tool、Skill 触发、tool result envelope 和 host permission 边界。
- `AlembicCore` 拥有可共享的 Guard standards、Recipe convention、deterministic check contract。
- `Alembic` 拥有 daemon 中的本地项目状态、数据读取和增强执行上下文。
- `AlembicDashboard` 只展示结果或配置入口。

边界结论：

- Guard 结果的 Codex 呈现归 Plugin。
- Guard 规则和确定性 contract 可以归 Core。
- Guard 的本地持久化和后台增强归 Alembic。

### Dashboard / UI

目标：Dashboard 是 Alembic 的前端体验，Plugin 只做 Codex 内的 URL handoff 或 artifact 指向。

职责分配：

- `AlembicDashboard` 拥有源码、页面、组件、API client、状态和文案。
- `Alembic` 拥有 Dashboard server/static hosting、API/SSE/WebSocket 数据面。
- `AlembicPlugin` 只拥有 Dashboard handoff、Codex tool 返回链接和必要 runtime artifact 指向。

边界结论：

- Dashboard 不接入 Plugin 业务 API。
- Plugin 中旧 Dashboard compatibility surface 没有真实消费方时应删除，不做无意义兼容保留。

### AI / Provider / Agent Runtime

目标：区分 Codex host agent、Alembic internal AI runtime 和 provider config，避免再维护两套 AI。

职责分配：

- `AlembicPlugin` 使用 Codex host agent 能力，不保留第三方 AI provider runtime、provider config 写入或 embedding provider。
- `Alembic` 拥有 internal AI jobs 的宿主装配、settings/env persistence、HTTP/daemon 状态和 provider hot reload trigger。
- `AlembicAgent` 拥有 provider adapter、runtime、tool system、memory/context/prompt。
- `AlembicCore` 只承接确定性 AI-adjacent contract，不承接 provider 执行。

边界结论：

- Provider / model / key 是配置能力，不是 knowledge source。
- Codex 写入 source 应用 `host-agent`；Alembic internal AI 写入 source 应用 `alembic-agent` 或更具体 domain source。

### Release / Runtime / Cache

目标：发布身份和 runtime artifact 不再制造“两个产品主包”的歧义。

职责分配：

- `Alembic` 是 npm/local install 主包和本地增强底座发布线。
- `AlembicPlugin` 是 Codex plugin / channel / runtime artifact 发布线。
- `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 是各自包或构建产物的源仓库。
- `AlembicWorkspace` 只记录总控版本统一、部署刷新和验收证据。

边界结论：

- 当前 `alembic-ai@0.2.0` 在 Alembic 主包与 Plugin runtime 中的命名重叠是已知后续候选，不阻塞当前职责方案。
- Plugin runtime artifact 可以携带必要快照，但不因此拥有源实现。

## 归属判断步骤

遇到一个新功能、旧模块或删除候选时，按下面顺序判断。

### 第一步：找第一消费方

- 第一消费方是 Codex tool / Skill / Codex 可见响应：先看 `AlembicPlugin`。
- 第一消费方是 daemon / HTTP / Dashboard server / background job：先看 `Alembic`。
- 第一消费方是多个仓库共享的 deterministic contract：先看 `AlembicCore`。
- 第一消费方是 internal AI runtime：先看 `AlembicAgent`。
- 第一消费方是浏览器 UI：先看 `AlembicDashboard`。
- 第一消费方是真实项目测试：先看 `AlembicTest`。
- 第一消费方是跨仓库计划和验收：先看 `AlembicWorkspace`。

### 第二步：找状态和生命周期

- 短期 tool envelope / host response：Plugin。
- 长期后台进程 / job / registry / data root：Alembic。
- 无宿主状态的 pure contract：Core。
- Agent runtime session / memory / tool execution：Agent。
- Browser state：Dashboard。
- Test evidence state：Test。
- Plan / TODO / acceptance state：Workspace。

### 第三步：找生产方和消费方

如果只有一个仓库生产、同一个仓库消费，不要急着下沉 Core。

如果一个仓库生产，另一个仓库真实消费，并且 contract 稳定，可以考虑：

- deterministic contract 下沉 Core；
- runtime owner 保留在原宿主；
- presentation owner 留在消费入口；
- service owner 留在 Alembic。

### 第四步：判断删除或兼容保留

删除必须同时满足：

- 已有替代入口。
- import / route / tool / docs 扫描无真实消费方。
- 代表性 build / test / verify 通过。
- 执行记录写清删除范围、负向扫描和失败回滚点。

暂时保留兼容层必须同时写清：

- 真实消费方是谁。
- 为什么不能本轮删除。
- 移除条件是什么。
- 后续触发点和推荐窗口是谁。

没有真实消费方、没有移除条件的兼容保留，不应进入长期方案。

### 第五步：确定验证归属

- 产品源码改动：对应产品仓库自己验证。
- 跨仓库 contract：producer 先验证，consumer 后验证。
- Plugin runtime / channel / cache：Plugin 窗口验证，必要时总控刷新缓存。
- 真实项目行为：AlembicTest 测试单验证。
- 文档 / 总控规则：Workspace 文档校验即可，不等同于产品测试。

## 跨仓库连接方式

### Plugin 请求 Alembic

正确模型：`AlembicPlugin` 根据需要请求 `Alembic` resident service 的结果。

错误模型：把 Codex MCP tool ownership 桥接给 `Alembic`，让 Alembic 复制 Plugin 的 host-response、prime 呐喊或 Skill 契约。

允许：

- Plugin 调 Alembic daemon/API 获取 search、status、dashboard URL、job 状态。
- Plugin 在 Alembic 不存在时标记 resident enhancement unavailable，并继续自身 Codex baseline。

不允许：

- Plugin 显示自己有 embedding provider 或真实 vector index。
- Alembic 复制 Codex-facing envelope 和 shoutInstruction。

### Alembic 消费 Core

正确模型：`Alembic` 消费 `@alembic/core` public API 或受控 transitional deep export。

长期目标：

- 消费方替换优先。
- Core public API 稳定后再收紧 wildcard / deep export。
- 不为了边界好看直接删 transitional export。

### Alembic 消费 Agent

正确模型：`Alembic` 作为宿主装配 internal AI jobs，消费 `@alembic/agent` runtime/provider/tool contract。

分工：

- Agent 提供 runtime / provider / tool generic contracts。
- Alembic 提供 concrete projectRoot/dataRoot/container、HTTP/daemon wiring、credential persistence、Dashboard settings 和 ToolContextFactory。

### Dashboard 消费 Alembic

正确模型：`AlembicDashboard` 通过 Alembic API/SSE/WebSocket 读写状态。

不允许：

- Dashboard 直接依赖 Plugin。
- Plugin 保留 Dashboard 业务 compatibility route，只因为历史存在。

### Test 回填 Workspace

正确模型：`AlembicTest` 按测试交流文档执行真实项目验证，回填证据，总控验收。

不允许：

- 总控直接操作真实项目。
- Test 在产品仓库内修实现。

## 当前后续候选映射

这些不是本文直接派发的任务，只是方案层对现有长期候选的归类。

### 发布身份澄清

来源：`GFBD-OQ-1`。

推荐理解：

- `Alembic` 是 npm/local install 主包。
- `AlembicPlugin` 是 Codex plugin runtime artifact。

后续如处理，应由 Workspace 先做发布身份设计，再分派 Alembic / Plugin。

### Core public API 收敛

来源：`GFBD-OQ-2`、`GTODO-2026-05-21-003`。

推荐理解：

- Core 的 deep / wildcard / transitional exports 是 consumer replacement 债。
- 下游消费迁移前不能直接删除。

### Plugin remaining compatibility / HOST_AI_MANAGED

来源：`GFBD-OQ-3`。

推荐理解：

- 先确认真实消费方和 user-facing semantics。
- 如果只是旧 AI provider 残留，应按已确认路线删除。
- 如果是 Codex-facing fail-closed capability state，应改名或收敛语义，而不是恢复第三方 AI。

### Dashboard Help / i18n 文案债

来源：`GFBD-OQ-4`。

推荐理解：

- 这是 Dashboard 文案事实校准，不是 runtime ownership 改动。
- 文案应反映 Plugin first、Alembic install enhances 和 host agent / internal agent 的区分。

### Alembic DB boundary lint 债

来源：`GFBD-OQ-5`、`GTODO-2026-05-22-013`。

推荐理解：

- 这是 Alembic 主仓库质量线，不阻塞当前职责方案。
- 处理时应单独分析 DB access owner、repository/service/http/infrastructure 分层，不混入 Plugin/Core 迁移。

### Agent 文档口径债

来源：`GFBD-OQ-6`。

推荐理解：

- `host agent` 默认 Codex / external host agent。
- `AlembicAgent` 是 internal AI runtime。

### Alembic `lib/external/mcp` 命名债

来源：`GFBD-OQ-7`。

推荐理解：

- 当前仍被 CLI / daemon jobs / HTTP routes / tests 消费，不能直接删。
- 后续只能在确认替代命名、import 迁移和验证后作为 Alembic service handler / schema legacy naming 收敛。

### AlembicTest restart / clean 授权边界

来源：`GFBD-OQ-8`。

推荐理解：

- 脚本留在测试窗口。
- 通过测试单授权使用。
- 不迁入产品 runtime 或总控脚本。

## 开发者可读检查卡

设计、派发或验收任何跨仓库任务前，先用这张卡快速检查。

1. 这个能力的第一消费方是谁？
2. 它有没有长期本地状态、daemon lifecycle、job 或 registry？
3. 它是不是无宿主依赖的 deterministic contract？
4. 它是不是 internal AI runtime，而不是 Codex host agent？
5. 它是不是浏览器 UI，而不是 API owner？
6. 它是不是测试行为，而不是产品实现？
7. 它是否有真实生产方和真实消费方？
8. 如果保留兼容层，真实消费方和移除条件是什么？
9. 如果删除，替代入口、负向扫描和验证命令是否齐全？
10. 如果要派发，任务包是否要求读取 workspace `AGENTS.md`、目标仓库 `AGENTS.md` 并声明窗口定位？

## 典型错误和纠偏

错误：把 `AlembicPlugin` 做成只会转发给 `Alembic` 的空壳。

纠偏：Plugin 保留 Codex-facing MCP / Skill / host response / prime shout / permission / runtime artifact；Alembic 只增强需要本地服务的能力。

错误：把 `Alembic` 做成另一个 Codex 插件。

纠偏：Alembic 是本地增强底座；Codex-facing 入口和表达归 Plugin。

错误：看到 Core 的 `host-agent-workflows` 就认为 Core 拥有 Agent runtime。

纠偏：这是 workflow / session / evidence / checkpoint contract，不是 runtime loop 或 provider。

错误：把 Codex host agent 和 AlembicAgent 混为一谈。

纠偏：Codex host agent 归 Plugin 入口；AlembicAgent 是 internal AI runtime。

错误：为了“兼容”保留没有消费方的旧 route、旧 adapter 或旧 surface。

纠偏：没有真实消费方和移除条件的兼容层应进入删除候选。

错误：因为 Dashboard build artifact 会被服务，就把 Dashboard 源码迁到 Alembic 或 Plugin。

纠偏：Dashboard 源码归 AlembicDashboard；Alembic 服务 build artifact；Plugin 只 handoff。

错误：把 AlembicTest 的 restart / clean 脚本迁入产品 runtime。

纠偏：这些是授权测试工具，只留在测试窗口。

## 维护方式

- 本文只在长期职责判断变化时更新。
- 如果真实代码改变了职责边界，应先由对应窗口回填证据，再由总控更新本文和索引。
- 如果只是某个 wave 的执行细节，不写入本文，留在当前总控计划或执行记录。
- 新增下沉、删除、迁移候选时，优先写入当前计划 TODO / Backlog；只有长期有效的判断才同步进入本文。
- 每次把本文作为派发依据时，仍必须同时读取当前总控计划、目标仓库 `AGENTS.md` 和最新执行证据。
