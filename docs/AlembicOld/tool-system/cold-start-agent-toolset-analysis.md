# 冷启动 Agent 工具集分析与升级方案

## 背景

本文分析当前冷启动（bootstrap）场景下 Agent 实际可调用的工具集合，并基于项目已有的工具能力设计更适合冷启动的工具集升级方案。

当前版本的实施边界：冷启动继续使用现有 AgentRuntime、`insight` preset、`bootstrapDimensionPipeline` 和既有 Agent capability，不新建更多 Agent 文件或冷启动专用 Agent/capability 类；不新增前置阶段。终端能力需要进入冷启动测试路径；Skill 和 macOS 工具只做能力盘点，暂不进入本轮冷启动默认工具集设计。前端报告复用现有信号页 reports tab，不新建独立报告页。

结论先行：

- 冷启动当前不是“全量工具开放”，而是通过 `AgentService -> AgentProfileCompiler -> AgentRuntimeBuilder -> AgentRuntime`，由 profile/preset/capability/stage 共同决定工具白名单。
- `bootstrap-session` 是并发协调 profile，正常情况下由 `AgentRunCoordinator` 分发子任务，本身不进入普通 ReAct 工具循环。
- 真正执行工具的是 `bootstrap-dimension`，它基于 `insight` preset，并在 pipeline stage 中用 `capabilityOverride` 收敛为 `code_analysis`、`knowledge_production`，有旧知识时额外插入 `evolution_analysis`。
- 当前冷启动已有工程策划层面的全景数据（panorama / project graph / session context），优化重点不是新增 Agent 或前置探测环节，而是在现有 analyze / evolve / produce 阶段调整工具白名单、终端测试策略和提示词，使 Agent 更明确地使用全景上下文、图谱工具和受治理终端能力。

## 当前调用链

### 1. 服务入口

冷启动统一走 `AgentService.run()`：

- `lib/agent/service/AgentService.ts`
  - `run()` 编译 profile。
  - 若 profile 有 concurrency plan，则交给 `AgentRunCoordinator`。
  - 否则通过 `AgentRuntimeBuilder.build()` 创建 `AgentRuntime`。

冷启动输入由 bootstrap workflow 构造：

- `lib/workflows/deprecated-cold-start/agent-runs/BootstrapSessionInputBuilder.ts`
  - 构造 `profile: { id: 'bootstrap-session' }`。
  - `context.source = 'bootstrap'`，`runtimeSource = 'system'`。
- `lib/workflows/deprecated-cold-start/agent-runs/BootstrapDimensionInputBuilder.ts`
  - 构造 `profile: { id: 'bootstrap-dimension' }`。
  - 注入 `fileCache`、`systemRunContext`、`strategyContext`、`memoryCoordinator`、`sharedState`。
- `lib/workflows/deprecated-cold-start/agent-runs/BootstrapSessionExecutionBuilder.ts`
  - 构造 planned child input 和 lazy child input。
  - 维度真正开始执行时补齐运行态上下文。

### 2. Profile 与 preset

冷启动 profile 定义在：

- `lib/agent/profiles/definitions/bootstrap.profile.ts`

当前定义：

- `bootstrap-session`
  - `basePreset: 'insight'`
  - `actionSpace: { mode: 'none' }`
  - `strategy: fanout`
  - `concurrency: tiered`
- `bootstrap-dimension`
  - `basePreset: 'insight'`
  - `actionSpace: { mode: 'none' }`
  - `strategy: pipeline(factory: 'bootstrapDimensionPipeline')`

需要注意：`actionSpace: none` 只会让 `additionalTools` 为空，不会清空 base preset 的 capabilities。`AgentRuntimeBuilder` 仍会用 `basePreset` 解析出 preset capabilities。

相关路径：

- `lib/agent/profiles/AgentProfileCompiler.ts`
  - `additionalToolsFromActionSpace()` 对 `mode: none` 返回 `[]`。
  - profile definition 的 `defaults.actionSpace` 不直接覆盖 preset capability。
- `lib/agent/service/AgentRuntimeBuilder.ts`
  - 对 compiled profile 调用 `getPreset(profile.basePreset, profile.runtimeOverrides)`。
  - `runtimeOverrides.capabilities` 未设置时继续使用 preset capabilities。
- `lib/agent/profiles/presets.ts`
  - `insight.capabilities = ['code_analysis', 'knowledge_production']`。

### 3. Pipeline stage 动态收敛工具

`bootstrap-dimension` 的实际阶段由 `AgentStageFactoryRegistry` 生成：

- `lib/agent/profiles/AgentStageFactoryRegistry.ts`
  - `bootstrapDimensionPipeline`

阶段组合：

- 无候选需求：只运行 `analyze`。
- 常规冷启动：`analyze -> quality_gate -> produce -> rejection_gate`。
- 有既有 Recipe 且未 prescreen：`evolve -> evolution_gate -> analyze -> quality_gate -> produce -> rejection_gate`。

每个执行阶段通过 `PipelineStrategy` 传入 `capabilityOverride`：

- `lib/agent/strategies/PipelineStrategy.ts`
  - `runtime.reactLoop(..., { capabilityOverride: stage.capabilities })`

因此冷启动阶段实际工具来自 stage capability，而不是 runtime 顶层 capability 全集。

### 4. AgentRuntime 工具投影

工具白名单最终在 `AgentRuntime` 内收敛：

- `lib/agent/runtime/AgentRuntime.ts`
  - `#collectTools(caps)`：收集 capability 的 `tools`。
  - 合并 `#additionalTools`。
  - `#getToolSchemas(ids)`：调用 `capabilityCatalog.toToolSchemas(ids)` 生成给 LLM 的 tool schemas。

关键约束：

- 空 capability 列表意味着无工具。
- 不存在隐式全量工具展开。
- 工具 schemas 只按白名单 id 投影。

## 当前冷启动实际可调用工具

### bootstrap-session

`bootstrap-session` 由 `AgentRunCoordinator` 协调子任务，通常不创建 runtime 进入 ReAct loop。

实际工具：

- 无直接工具调用。
- 只负责分区、并发、合并子维度结果。

### bootstrap-dimension: analyze 阶段

Capability: `code_analysis`

定义文件：

- `lib/agent/capabilities/CodeAnalysis.ts`

当前工具：

- `get_project_overview`
- `get_class_hierarchy`
- `get_class_info`
- `get_protocol_info`
- `get_method_overrides`
- `get_category_map`
- `search_project_code`
- `read_project_file`
- `list_project_structure`
- `get_file_summary`
- `semantic_search_code`
- `query_code_graph`
- `get_previous_analysis`
- `note_finding`
- `get_previous_evidence`

适配冷启动的优点：

- 覆盖结构概览、符号关系、文本搜索、文件读取、语义检索。
- 支持工作记忆 `note_finding` 和历史证据回看。
- 与 `fileCache`、`SystemRunContext`、`MemoryCoordinator` 已配合。

不足：

- 没有 `get_environment_info`，无法让 Agent 自主确认语言、包管理器、平台、Git 状态。
- 没有 `get_tool_details`，工具 schema 不清楚时只能靠 prompt 记忆。
- 没有 `analyze_code` 聚合工具，可能重复执行 Guard + Recipe 搜索。
- 没有终端只读探测能力，遇到需要 `package.json` scripts、`git ls-files`、`tree`/`rg` 类快速核实时只能靠已有工具间接完成。

### bootstrap-dimension: produce 阶段

Capability: `knowledge_production`

定义文件：

- `lib/agent/capabilities/KnowledgeProduction.ts`

当前工具：

- `submit_knowledge`
- `submit_with_check`
- `read_project_file`

适配冷启动的优点：

- 工具集很窄，符合“生产阶段只提交知识”的边界。
- `submit_with_check` 把查重 + 提交合并，减少 ReAct 轮次。

不足：

- 缺少 `validate_candidate`，导致提交前自检只能依赖 prompt 或 `submit_with_check` 的后置拒绝。
- 缺少 `quality_score` / `review_my_output`，无法让 Producer 以工具化方式自审。
- 缺少 `check_duplicate` 作为轻量查重，只能走组合提交或直接提交。

### bootstrap-dimension: evolve 阶段

Capability: `evolution_analysis`

定义文件：

- `lib/agent/capabilities/EvolutionAnalysis.ts`

当前工具：

- `read_project_file`
- `search_project_code`
- `propose_evolution`
- `confirm_deprecation`
- `skip_evolution`

适配冷启动的优点：

- 对既有 Recipe 的真实性校验足够聚焦。
- 决策动作分为 evolve / deprecate / skip，符合进化网关语义。

不足：

- 缺少 `get_recipe_detail` / `search_recipes`，若 prompt 上下文没有完整 Recipe 内容，Agent 自主追溯能力不足。
- 缺少 `query_code_graph` / `query_call_graph`，对“代码仍被使用吗”的判断可能不够结构化。
- 缺少 `quality_score`，无法对旧知识质量做量化辅助。

## 项目当前支持的工具能力全集

当前 capability catalog 在 `AgentModule` 中聚合：

- `lib/injection/modules/AgentModule.ts`

注册来源：

- 内部工具：`TOOL_CAPABILITY_MANIFESTS`
- Dashboard operations：`DASHBOARD_OPERATION_MANIFESTS`
- 终端工具：`TERMINAL_CAPABILITY_MANIFESTS`
- Skill 工具：`SKILL_CAPABILITY_MANIFESTS`
- macOS 工具：`MAC_SYSTEM_CAPABILITY_MANIFESTS`

执行 adapter：

- `InternalToolAdapter`
- `DashboardOperationAdapter`
- `TerminalAdapter`
- `SkillAdapter`
- `MacSystemAdapter`
- `WorkflowAdapter`

### 内部工具

定义入口：

- `lib/tools/handlers/index.ts`

主要类别：

- 项目访问：`search_project_code`、`read_project_file`、`list_project_structure`、`get_file_summary`、`semantic_search_code`
- 知识查询：`search_recipes`、`search_candidates`、`get_recipe_detail`、`get_project_stats`、`search_knowledge`、`get_related_recipes`
- Guard：`list_guard_rules`、`get_recommendations`、`guard_check_code`、`query_violations`
- 生命周期：`submit_knowledge`、`approve_candidate`、`reject_candidate`、`publish_recipe`、`deprecate_recipe`、`update_recipe`、`record_usage`、`quality_score`、`validate_candidate`、`get_feedback_stats`
- 知识图谱：`check_duplicate`、`add_graph_edge`
- 基础设施：`graph_impact_analysis`、`rebuild_index`、`query_audit_log`、`load_skill`、`create_skill`、`suggest_skills`、`bootstrap_knowledge`
- 组合/元工具：`analyze_code`、`knowledge_overview`、`submit_with_check`、`get_tool_details`、`plan_task`、`review_my_output`
- AST / 图谱：`get_project_overview`、`get_class_hierarchy`、`get_class_info`、`get_protocol_info`、`get_method_overrides`、`get_category_map`、`get_previous_analysis`、`note_finding`、`get_previous_evidence`、`query_code_graph`、`query_call_graph`
- 系统交互基础：`write_project_file`、`get_environment_info`
- Scan / Evolution：`collect_scan_recipe`、`propose_evolution`、`confirm_deprecation`、`skip_evolution`

### 终端工具

定义入口：

- `lib/tools/adapters/terminal-capabilities/index.ts`

工具：

- `terminal_run`
- `terminal_script`
- `terminal_shell`
- `terminal_pty`
- `terminal_session_close`
- `terminal_session_status`
- `terminal_session_cleanup`

冷启动适配性：

- 适合：只读、短超时、无网络、read-only filesystem 的 `terminal_run`。
- 谨慎：`terminal_shell`、`terminal_pty` 需要 `confirm-every-time`，不适合默认非交互冷启动自动调用。
- 不建议：`terminal_script` 默认高风险，适合人工确认后的诊断，不适合冷启动主循环。

### Skill 工具

定义入口：

- `lib/tools/adapters/SkillCapabilities.ts`

工具：

- `skill_search`
- `skill_load`
- `skill_load_resource`
- `skill_validate`

冷启动适配性：

- 很适合用于加载项目/语言/框架相关分析技巧。
- 当前冷启动更多依赖外部 bootstrap orchestration 的 skill/context 注入，Agent 自主 toolset 中没有显式开放这些工具。
- 本轮暂不纳入默认冷启动工具集，避免同时扩展终端、Skill 两条变量。

### macOS 工具

定义入口：

- `lib/tools/adapters/MacSystemCapabilities.ts`

工具：

- `mac_system_info`
- `mac_permission_status`
- `mac_window_list`
- `mac_screenshot`

冷启动适配性：

- `mac_system_info` 可辅助本机环境判断，但与代码冷启动关系弱。
- window/screenshot 属敏感本机上下文，不应进入默认冷启动 Agent 工具集。
- 本轮暂不纳入默认冷启动工具集。

### Dashboard / Workflow / MCP

Dashboard operations 只暴露在 `dashboard` surface，不适合冷启动 Agent 默认调用。

Workflow adapter 当前依赖 `WorkflowRegistry` 动态注册 workflow。它适合未来把“冷启动预检”“项目结构探针”做成 workflow，但当前并不是 bootstrap Agent 的默认工具来源。

MCP capability projection 在 `lib/external/mcp/McpCapabilityProjection.ts`，surface 为 `mcp`，并有 trust decision。冷启动内部 Agent 不应默认接入外部 MCP 工具，除非显式 allowlist 且输出按不可信文本处理。

## 当前问题

### 1. 冷启动阶段工具集过于复用通用能力

`code_analysis` 同时服务聊天、扫描、冷启动。它包含大量结构化分析工具，但缺少冷启动 first pass 很常用的环境探测和自省工具。

结果是：

- 对 package manager、语言栈、构建系统、测试框架、生成目录的判断更多依赖预处理上下文。
- Agent 自己无法低成本确认“该项目该从哪里开始读”。
- 遇到工具参数不确定时没有 `get_tool_details`。

### 2. 冷启动的“分析、验证、生产”边界需要更显式

不新增 preflight 阶段的前提下，现有阶段边界应进一步明确：

- `analyze`：使用全景数据、结构化代码工具和终端测试验证事实。
- `produce`：只做候选格式化、校验和提交，不再探索。
- `evolve`：只做既有知识真实性校验和演化决策。

### 3. Producer 阶段缺少提交前自检工具

当前 Producer 主要靠 `submit_with_check` 和 rejection gate。可以继续保留 submit path 的严格校验，但应给 Producer 显式自检工具，减少提交失败和 retry。

### 4. 终端能力已经具备，但不应直接全量给冷启动

终端工具近期已具备：

- structured execFile
- artifact-backed script
- governed shell
- Python PTY transcript
- bounded one-shot stdin
- persistent session metadata

但冷启动是非交互后台流程，默认开放 shell/PTY/script 会扩大风险和审批阻塞。应只设计一个冷启动专用的“只读命令 profile”，而不是把 `system_interaction` 整体加入 bootstrap。

### 5. actionSpace 语义容易误读

`bootstrap-dimension.defaults.actionSpace = { mode: 'none' }` 让人以为该 profile 没有工具，但实际工具来自 `insight` preset 和 stage capability override。

建议在文档和代码中明确：

- `actionSpace` 只控制 `additionalTools`。
- capability tools 仍由 preset/override 决定。
- pipeline stage 的 `capabilities` 是最终阶段工具白名单。

## 推荐的冷启动工具集升级

### 目标原则

1. 冷启动继续使用现有 `bootstrap-session` / `bootstrap-dimension` profile 和 `insight` pipeline，不新增 Agent 类型、Agent 文件或冷启动专用 capability 文件。
2. 不新增 preflight / dimension_preflight 等前置阶段；现有全景数据、项目图谱、session context 作为 analyze/evolve/produce prompt 的输入。
3. 工具集按现有阶段最小化：analyze 做探索和验证，produce 做候选校验和提交，evolve 做旧知识真实性判断。
4. 终端能力用于真实测试，但通过 `terminalTest` 开关进入现有阶段，不把 `system_interaction` 整体加入 bootstrap。
5. 工具职责保持单一；不新增会让 Agent 犹豫“该用组合工具还是原子工具”的模糊工具。

## 现有 Capability 的工具集调整

### 1. `code_analysis`

用途：维持现有分析阶段能力，不新建 `bootstrap_analysis`。在冷启动 analyze 阶段，结合已有全景数据和图谱工具完成维度分析，并在测试模式下使用终端验证关键工程事实。

建议工具：

- `get_project_overview`
- `list_project_structure`
- `get_file_summary`
- `search_project_code`
- `read_project_file`
- `semantic_search_code`
- `query_code_graph`
- `query_call_graph`
- `get_class_hierarchy`
- `get_class_info`
- `get_protocol_info`
- `get_method_overrides`
- `get_category_map`
- `get_previous_analysis`
- `get_previous_evidence`
- `note_finding`
- `analyze_code`
- `terminal_run`
- `terminal_shell`
- `terminal_pty`

变化点：

- `analyze_code` 只用于“已选代码片段的局部审查”，不能替代结构化搜索和文件读取。
- `terminal_run` 默认可进入冷启动终端测试；`terminal_shell` / `terminal_pty` 只在 `terminalTest` 启用时进入模型 schema。
- `get_environment_info` 不进入默认 analyze 工具集，项目语言、模块角色、层级和耦合优先来自已有 `projectInfo`、`panorama`、`CodeEntityGraph`、`sessionStore`。
- 如需环境事实，优先通过受限终端命令验证，不新增 preflight。

### 2. `knowledge_production`

用途：维持现有生产阶段能力，不新建 `bootstrap_production`。Producer 只负责把已经通过 gate 的分析转成候选，不再做额外探索。

建议工具：

- `submit_with_check`
- `submit_knowledge`
- `validate_candidate`
- `check_duplicate`
- `read_project_file`
- `review_my_output`
- `quality_score`

不要放入：

- `approve_candidate`
- `reject_candidate`
- `publish_recipe`
- `deprecate_recipe`
- `update_recipe`
- `record_usage`

理由：

- 冷启动负责生产候选，不应直接进入人工审核/发布生命周期。
- `validate_candidate` 和 `review_my_output` 可以在提交前降低 rejection gate 压力。
- Producer 阶段不开放终端，避免“验证”和“提交”职责混杂。

### 3. `evolution_analysis`

用途：维持现有演化阶段能力，不新建 `bootstrap_evolution`。仅在 `hasExistingRecipes && !prescreenDone` 时启用，用于旧知识真实性校验。

建议工具：

- `search_recipes`
- `get_recipe_detail`
- `read_project_file`
- `search_project_code`
- `semantic_search_code`
- `query_code_graph`
- `query_call_graph`
- `propose_evolution`
- `confirm_deprecation`
- `skip_evolution`
- `quality_score`
- `terminal_run`
- `terminal_shell`

注意：

- `confirm_deprecation` 是强 side-effect，保留可以兼容现有流程，但应只在 hasExistingRecipes 分支启用。
- `terminal_shell` 只在 `terminalTest` 启用时开放，用于验证旧知识描述的命令/脚本事实。
- 不开放 `terminal_pty`，避免旧知识校验变成交互观察。

## 推荐阶段编排

### 当前编排

常规：

1. `analyze` with `code_analysis`
2. `quality_gate`
3. `produce` with `knowledge_production`
4. `rejection_gate`

有既有 Recipe：

1. `evolve` with `evolution_analysis`
2. `evolution_gate`
3. `analyze`
4. `quality_gate`
5. `produce`
6. `rejection_gate`

### 推荐编排

维持当前编排，不新增前置阶段：

常规：

1. `analyze` with `code_analysis`
2. `quality_gate`
3. `produce` with `knowledge_production`
4. `rejection_gate`

有既有 Recipe：

1. `evolve` with `evolution_analysis`
2. `evolution_gate`
3. `analyze` with `code_analysis`
4. `quality_gate`
5. `produce` with `knowledge_production`
6. `rejection_gate`

改造点只发生在现有 stage 的工具白名单、prompt、terminalTest 参数、report 采集上。

## 实现建议

### R1. 修改现有 capability 的工具白名单

修改：

- `lib/agent/capabilities/CodeAnalysis.ts`
- `lib/agent/capabilities/KnowledgeProduction.ts`
- `lib/agent/capabilities/EvolutionAnalysis.ts`

要求：

- 仍然使用 `code_analysis`、`knowledge_production`、`evolution_analysis` 这三个既有 capability 名称。
- 不新增 `Bootstrap*` capability 文件。
- 工具职责必须单一；不要把“项目探测 + 终端 + 报告”合并成一个大工具。

### R2. 修改 bootstrap stage factory 的参数注入

修改：

- `lib/agent/profiles/AgentStageFactoryRegistry.ts`

要求：

- 不改变阶段数量和顺序。
- 只把 `terminalTest`、全景数据摘要、阶段工具策略传给现有 stage promptBuilder / context。
- `terminalTest` 关闭时不把 shell/pty 放入 schema。

### R3. 增加冷启动终端测试治理

不要直接把 `system_interaction` 加入 bootstrap。

更好的实现路径：

1. 增加 `TerminalCommandPolicy` 的 profile/context 字段，或新增 terminal policy evaluator option。
2. 支持 `terminal_run` / `terminal_shell` / `terminal_pty` 的 `purpose` 或 `source.name` 判定，例如 `bootstrap-terminal-test`。
3. 在 analyze/evolve prompt 中约束终端使用：
   - 优先使用结构化代码工具和全景数据。
   - 只在需要验证工程事实、命令入口、测试脚本、CLI 行为时调用终端。
   - 不运行 install、写入、删除、长期服务和网络命令。

可选允许命令：

- `git status --short`
- `git ls-files`
- `git rev-parse --show-toplevel`
- `node --version`
- `npm --version`
- `pnpm --version`
- `python --version`
- `python3 --version`

### R4. 增加工具集回归测试

建议新增/扩展测试：

- `test/unit/CapabilityCatalog.test.ts`
  - 现有 capability 工具出现在 schemas 中。
- `test/unit/AgentRuntime.test.ts`
  - `bootstrap-dimension` analyze stage 在 `terminalTest=false` 和 `true` 下暴露不同终端工具。
- `test/unit/AgentFactory.test.ts` 或新增 `BootstrapProfileTools.test.ts`
  - 编译 `bootstrap-dimension` 后仍使用既有 capability 名称和既有阶段顺序。
- `test/unit/ToolRouterGovernance.test.ts`
  - 冷启动终端测试模式允许受治理 shell/pty，仍拒绝 script、写入、网络、危险命令。

### R5. 文档和提示同步

需要同步：

- `docs-dev/agent-tool-system-decoupled-implementation-plan.md`
- `lib/agent/capabilities/CodeAnalysis.ts`
- `lib/agent/capabilities/KnowledgeProduction.ts`
- `lib/agent/capabilities/EvolutionAnalysis.ts`
- `lib/agent/prompts/insight-analyst.ts`
- `lib/agent/prompts/insight-producer.ts`
- `lib/agent/prompts/insight-evolver.ts`

## 推荐工具集清单

### 默认安全集

用于大多数冷启动项目：

- `code_analysis`
  - `get_project_overview`
  - `list_project_structure`
  - `get_file_summary`
  - `search_project_code`
  - `read_project_file`
  - `semantic_search_code`
  - `query_code_graph`
  - `query_call_graph`
  - `get_class_hierarchy`
  - `get_class_info`
  - `get_protocol_info`
  - `get_method_overrides`
  - `get_category_map`
  - `get_previous_analysis`
  - `get_previous_evidence`
  - `note_finding`
  - `analyze_code`
- `knowledge_production`
  - `submit_with_check`
  - `submit_knowledge`
  - `validate_candidate`
  - `check_duplicate`
  - `read_project_file`
  - `review_my_output`
  - `quality_score`
- `evolution_analysis`
  - `search_recipes`
  - `get_recipe_detail`
  - `read_project_file`
  - `search_project_code`
  - `semantic_search_code`
  - `query_code_graph`
  - `query_call_graph`
  - `propose_evolution`
  - `skip_evolution`
  - `confirm_deprecation`
  - `quality_score`

### 可选增强集

仅在显式启用 `terminalTest` / `ALEMBIC_BOOTSTRAP_TERMINAL_TEST` 时开放：

- `terminal_run`
- `terminal_shell`
- `terminal_pty`
- `terminal_session_status`
- `terminal_session_cleanup`

不默认开放：

- `terminal_script`
- `write_project_file`
- `rebuild_index`
- `bootstrap_knowledge`
- `dashboard.*`
- `skill_search`
- `skill_load`
- `skill_load_resource`
- `skill_validate`
- `mac_window_list`
- `mac_screenshot`

## 风险分析

### 扩大工具集的风险

- 更多工具 schema 会增加上下文噪音。
- Producer 阶段如果看到太多查询工具，可能推迟提交。
- 终端工具若无专用治理，可能引入审批阻塞或后台执行风险。
- Skill/MCP 输出属于外部文本，应在 prompt 中提示为不可信上下文。

### 不升级的风险

- 对陌生技术栈的冷启动判断仍依赖预处理代码，而不是 Agent 自主验证。
- 提交失败率可能继续由 rejection gate 兜底，浪费轮次。
- 既有 Recipe 演化判断缺少知识详情和调用图辅助。
- 工具能力已经扩展，但冷启动没有吃到收益。

## 最小落地路径

推荐按以下顺序实现：

1. 保持现有 `bootstrapDimensionPipeline` 阶段顺序和既有 capability 名称。
2. 在 `code_analysis` / `knowledge_production` / `evolution_analysis` 中调整工具白名单。
3. 补工具白名单测试，确保冷启动阶段不意外暴露全量工具。
4. 在 `knowledge_production` 加入 `validate_candidate` / `review_my_output` / `quality_score`，观察 rejection rate。
5. 新增 `terminalTest` 开关，使终端工具进入 analyze/evolve 测试路径。
6. 扩展报告记录工具效果，接入现有信号页 reports tab。

这样能先提升冷启动质量，同时避免新增 Agent 文件、前置阶段或会让模型困惑的大型组合工具。

## 建议的目标状态

冷启动 Agent 不应是“通用 Agent + 更多工具”，而应是：

- Session coordinator：现有 `bootstrap-session`，无工具，只负责任务拆分和合并。
- Dimension Analyst：现有 `code_analysis`，基于全景数据、结构化代码工具和受治理终端验证事实。
- Knowledge Producer：现有 `knowledge_production`，提交前自检 + 候选生产。
- Evolution Reviewer：现有 `evolution_analysis`，旧知识真实性校验和演化决策。

每个阶段沿用现有 capability，并拥有清晰、最小、职责单一的工具白名单；所有高风险能力都必须通过显式 `terminalTest` 或人工确认进入。

## 本轮补充设计：工具链路、终端测试与前端报告

本节回应新的五项约束，并覆盖前文中“可考虑 Skill/macOS”的建议：本轮冷启动工具集升级暂不考虑 Skill 工具和 macOS 工具；终端能力需要进入冷启动测试路径，用真实冷启动来验证治理、效果和报告展示。

### 1. AgentRuntime 工具调用链路核对

当前链路是清晰且确定的：

1. `AgentService.run(input)` 编译 profile。
2. `AgentRuntimeBuilder.build(compiledProfile)` 用 `basePreset` 和 `runtimeOverrides` 创建 runtime。
3. `AgentRuntime.reactLoop()` 根据当前 stage 的 `capabilityOverride` 解析 capability。
4. `AgentRuntime.#collectTools()` 收集 `Capability.tools` 和 `additionalTools`。
5. `CapabilityCatalog.toToolSchemas(ids)` 投影给模型的工具 schema。
6. 模型返回 `functionCalls`。
7. `ToolExecutionPipeline.execute()` 先过 allowlist gate，再调用 `ToolRouter.execute()`。
8. `ToolRouter` 执行 governance、schema normalize、adapter preview、confirmation/concurrency/timeout/cache，然后分发到 adapter。
9. adapter 返回 `ToolResultEnvelope`，runtime 记录 `toolCalls`、diagnostics、progress、trace、memory 和 tracker signals。

关键文件：

- `lib/agent/service/AgentService.ts`
- `lib/agent/service/AgentRuntimeBuilder.ts`
- `lib/agent/runtime/AgentRuntime.ts`
- `lib/agent/runtime/ToolExecutionPipeline.ts`
- `lib/tools/core/ToolRouter.ts`
- `lib/tools/catalog/CapabilityCatalog.ts`

#### 已确认的优点

- Runtime 强制要求 `ToolRouter`，工具执行已经统一走 router，不再绕过治理。
- 工具 schema 由 capability 白名单投影，不存在默认全量工具泄露。
- `ToolExecutionPipeline` 有 allowlist gate，可阻断模型幻觉工具名。
- `ToolRouter` 统一处理 manifest、governance、preview、confirmation、timeout、concurrency、cache、diagnostics。
- `ToolResultEnvelope` 已进入 `ToolCallEntry.envelope`，前端报告有机会完整展示治理和执行结果。

#### 存在的问题

1. `actionSpace` 语义不够直观。
   - `actionSpace: none` 只表示不增加 `additionalTools`，并不关闭 preset capability tools。
   - 对冷启动 profile 来说容易误解为“无工具”。
   - 建议重命名或补字段：`additionalToolSpace` / `capabilityToolSpace` 分离。

2. `allowlistGate` 注释仍保留“全工具模式”语义。
   - 代码里 `toolSchemas` 为空时跳过 allowlist。
   - 但 `AgentRuntime.#getToolSchemas([])` 当前返回空数组，且无工具时 `toolChoice` 为 `none`，正常不会执行工具。
   - 风险在于未来如果某个 provider 仍返回 tool call，空 schema 下 allowlist 不拦截。
   - 建议改为显式 `allowedToolIds` 放入 `LoopContext`，allowlist gate 基于它判断；空数组即严格禁止全部工具。

3. 工具链路缺少“阶段工具集快照”。
   - 当前报告能统计 tool call 数，但不能稳定知道某阶段到底开放了哪些工具。
   - 建议每个 stage 开始时记录 `allowedTools`、`toolSchemaCount`、`capabilityNames` 到 diagnostics/report。

4. `needs-confirmation` 在后台冷启动里仍表现为工具失败。
   - 终端 `terminal_shell` / `terminal_pty` 默认 `confirm-every-time`，后台冷启动若直接调用会被 router 返回 `needs-confirmation`。
   - 本轮要测试终端效果，需要一个显式的冷启动测试 profile，而不是复用普通治理。

5. `ToolResultEnvelope` 已记录但前端没有展示。
   - 当前 bootstrap progress 只展示任务完成/失败和简短 result。
   - 需要把 envelope 中的 `status`、`decision`、`preview`、`durationMs`、`diagnostics` 聚合进报告。

### 2. 冷启动分阶段工具集设计

本轮目标不是新增 Agent 或前置环节，而是在现有冷启动管线中“有治理地放开测试”：终端能力进入 analyze/evolve 测试路径，但只通过 `terminalTest` 控制，不把 `system_interaction` 全量塞进默认 `insight`。

#### 会话级：`bootstrap_session_orchestrator`

职责：

- 读取预检结果。
- 分配维度。
- 聚合报告。

工具：

- 无模型工具。

实现建议：

- 继续由 `AgentRunCoordinator` 和 bootstrap workflow 完成。
- 不进入 ReAct loop。

#### 不新增预检阶段

取消该阶段。

原因：

- 当前项目已有工程策划层面的全景数据，不需要再引入独立 preflight Agent。
- 新增前置环节会改变冷启动节奏和并发模型，增加成本。
- 终端测试应作为 analyze/evolve 的验证手段，而不是新建阶段。

#### 分析阶段：`code_analysis`

职责：

- 维度级代码分析。
- 使用图谱、搜索、文件读取和有限终端验证发现。

工具：

- `get_project_overview`
- `list_project_structure`
- `get_file_summary`
- `search_project_code`
- `read_project_file`
- `semantic_search_code`
- `query_code_graph`
- `query_call_graph`
- `get_class_hierarchy`
- `get_class_info`
- `get_protocol_info`
- `get_method_overrides`
- `get_category_map`
- `get_previous_analysis`
- `get_previous_evidence`
- `note_finding`
- `analyze_code`
- `terminal_run`
- `terminal_shell`
- `terminal_pty`

说明：

- 分析阶段允许终端用于验证架构事实，例如 `git ls-files`、`pnpm test -- --runInBand <specific>`、`node -e` 快速解析配置。
- 终端工具必须进入报告，记录命令摘要、治理决策、输出大小、退出码、耗时、是否截断。
- `terminal_script` 不进入默认分析阶段，避免脚本落盘成为常态。

#### 生产阶段：`knowledge_production`

职责：

- 提交候选。
- 提交前校验。
- 降低 rejection gate 压力。

工具：

- `read_project_file`
- `check_duplicate`
- `validate_candidate`
- `submit_with_check`
- `submit_knowledge`
- `review_my_output`
- `quality_score`

说明：

- 不开放 `approve_candidate`、`reject_candidate`、`publish_recipe`、`deprecate_recipe`、`update_recipe`、`record_usage`。
- 不开放终端，避免 Producer 分心跑测试；测试证据应由 analyze/evolve 阶段提供。

#### 演化阶段：`evolution_analysis`

职责：

- 判断既有 Recipe 是否仍真实。
- 生成替代提案或跳过。
- 必要时确认废弃。

工具：

- `search_recipes`
- `get_recipe_detail`
- `read_project_file`
- `search_project_code`
- `semantic_search_code`
- `query_code_graph`
- `query_call_graph`
- `quality_score`
- `propose_evolution`
- `skip_evolution`
- `confirm_deprecation`
- `terminal_run`
- `terminal_shell`

说明：

- `confirm_deprecation` 保留，但只允许在 `hasExistingRecipes && !prescreenDone` 分支。
- `terminal_pty` 不进入 evolution 默认集合，避免旧知识校验变成交互观察。

### 3. 实际工具改造清单

#### 保留并增强的工具

`search_project_code`

- 保留。
- 增强：返回命中去重摘要、查询 hash、命中文件分布、是否来自 cache。
- 增强：报告中聚合每个维度的 query 列表和高频文件。

`read_project_file`

- 保留。
- 增强：支持 `ranges`，避免读取大文件时只能整文件或依赖摘要。
- 增强：返回 `truncated`、`bytesRead`、`lineRange`、`contentHash`。

`list_project_structure`

- 保留。
- 增强：支持 depth/profile，例如 `bootstrap-overview` 自动排除 `node_modules`、构建产物、锁文件大目录。

`get_file_summary`

- 保留。
- 增强：输出 imports/exports/classes/functions 的结构化字段统一跨语言。
- 可与 `read_project_file` 合并为一个“read with summary”选项，但本轮先保留独立工具。

`semantic_search_code`

- 保留。
- 增强：报告记录向量是否可用、fallback 是否发生、结果分数分布。

`query_code_graph`

- 保留。
- 增强：冷启动报告展示实体数、边数、热点节点、缺失图谱原因。

`query_call_graph`

- 保留。
- 增强：用于 evolution 和 analysis 的“被调用证据”，报告展示调用链样本。

`analyze_code`

- 保留。
- 修改定位：从通用组合工具升级为分析阶段的“代码片段快速审查”。
- 增强：返回 guard 命中、相关知识、风险提示、建议深入文件。

`note_finding`

- 保留。
- 增强：写入 report trace，便于前端显示每个维度的关键发现时间线。

`get_previous_analysis` / `get_previous_evidence`

- 保留。
- 增强：明确返回来源 session/snapshot，避免新旧冷启动对比时混淆。

`check_duplicate`

- 保留。
- 增强：Producer 提交前必须可调用，返回重复风险等级和相似项。

`validate_candidate`

- 保留并前移。
- 修改：支持 dry-run 批量校验，返回字段级错误和可修复建议。

`submit_with_check`

- 保留。
- 修改：拆出内部步骤结果：duplicate check、validation、submit、quality update。
- 报告展示每次 submit 的通过/拒绝原因。

`submit_knowledge`

- 保留。
- 修改：作为低层提交工具，Producer 优先使用 `submit_with_check`，只有明确无需查重时才直接调用。

`review_my_output`

- 保留。
- 修改：从元工具升级为 Producer 自审工具；输入应允许指定候选草稿，而不是只依赖 session tool calls。

`quality_score`

- 保留。
- 修改：支持候选草稿评分和已入库知识评分两种模式，报告展示平均质量。

`search_recipes` / `get_recipe_detail`

- 保留。
- 修改：进入现有 `evolution_analysis`，用于旧知识追溯。

`propose_evolution` / `skip_evolution` / `confirm_deprecation`

- 保留。
- 增强：输出统一 decision envelope，报告展示每条旧知识的决策原因和证据。

#### 终端工具改造

`terminal_run`

- 保留并放入测试。
- 增强：支持 `purpose: 'bootstrap-analysis' | 'bootstrap-evolution'`。
- 增强：manifest/governance 支持冷启动测试模式，允许非交互后台执行。
- 增强：报告记录 bin、args hash、cwd、exitCode、stdout/stderr bytes、duration、truncated。

`terminal_shell`

- 本轮放开测试，但必须通过测试开关。
- 增强：允许 `approvalPolicy` 在 `source.name === 'bootstrap-terminal-test'` 时走 `explain-then-run` 或专用自动策略。
- 增强：强制 `timeoutMs`、`maxOutputBytes`、禁网络声明、项目 cwd。
- 报告必须展示 command redacted preview，而不是原始完整命令。

`terminal_pty`

- 本轮放开测试，验证 bounded one-shot stdin 和 transcript。
- 使用场景：需要 TTY 行为的 CLI help/version/status，不用于长交互。
- 增强：报告展示 transcript artifact/ref、stdin metadata、exitCode、pty rows/cols。

`terminal_script`

- 暂不进入冷启动默认测试集合。
- 保留人工诊断用途。
- 若后续需要，必须先设计脚本 artifact 展示、approval UI 和报告下载。

`terminal_session_status` / `terminal_session_cleanup` / `terminal_session_close`

- `status` 和 `cleanup` 可进入终端测试集合，用于确认没有遗留 session metadata。
- `close` 仅在引入 persistent session 后开放。
- 报告展示 session 数、清理数量、遗留 session。

#### 新建工具原则

本轮不新增会被 Agent 直接调用的大型组合工具。

明确不新增：

- `bootstrap_project_probe`
- `bootstrap_toolset_report`
- 任何“自动选择工具/自动规划工具”的元工具

原因：

- 当前已有全景数据和项目图谱，冷启动不需要再通过一个大工具重复探测。
- 大型组合工具会和 `get_project_overview`、`list_project_structure`、`query_code_graph`、`terminal_run` 职责重叠，让 Agent 不知道该调用原子工具还是组合工具。
- 报告生成应在 runtime/workflow 旁路采集，不作为模型可调用工具暴露。

可以新增但不暴露给 Agent 的后端能力：

- bootstrap report repository/service
- report diff utility
- terminal artifact reader

这些能力服务前端报告，不进入 `Capability.tools`。

#### 合并或下沉

`get_environment_info`

- 不删除。
- 本轮不进入默认冷启动工具集；环境事实优先来自已有项目上下文和全景数据，必要时由终端测试命令验证。

`knowledge_overview`

- 本轮不进入默认冷启动，因为用户要求暂不考虑 Skills/mac，且知识概览可后置到 evolution/production。
- 可作为报告对比时的后端数据源，不给模型默认调用。

`get_tool_details` / `plan_task`

- 本轮不进入默认冷启动。
- 原因：冷启动工具集应由 profile 确定，不让模型在后台自规划工具平台。

`write_project_file`

- 不进入冷启动。
- 本轮不修改。

`rebuild_index` / `bootstrap_knowledge`

- 不给冷启动 Agent 自调用，避免 bootstrap 内部递归触发 bootstrap。

### 4. 终端能力放开测试方案

这次引入终端能力的目的就是要测试使用效果，因此建议新增“冷启动终端测试模式”。

核心目标：终端能力是给冷启动分析 Agent 自主选择使用的代码分析工具，而不是远程执行专属能力。Agent 在 analyze/evolve 阶段可以根据问题需要选择结构化代码工具、图谱工具或终端工具；系统通过不同工具集配置记录效果差异，比较“无终端”“仅 `terminal_run`”“`terminal_run + shell/pty`”对分析质量、候选质量、耗时和失败率的影响。

启用方式：

- 环境变量：`ALEMBIC_BOOTSTRAP_TERMINAL_TEST=1`
- API 参数：`POST /api/v1/modules/bootstrap { terminalTest: true }`
- Profile params：`params.terminalTest === true`

测试模式开放：

- `terminal_run`
- `terminal_shell`
- `terminal_pty`
- `terminal_session_status`
- `terminal_session_cleanup`

工具集实验档位：

- `baseline`：现有代码分析工具，不开放终端。用于作为对照组。
- `terminal-run`：只开放 `terminal_run`。验证结构化命令对项目理解和文件查找的提升。
- `terminal-shell`：开放 `terminal_run` + `terminal_shell`。验证管道、重定向、命令替换对复杂查找的帮助。
- `terminal-pty`：开放 `terminal_run` + `terminal_shell` + `terminal_pty`。验证 TTY transcript、CLI help、bounded stdin 对代码分析的价值。

Agent 选择规则：

- 默认先用全景数据、`query_code_graph`、`search_project_code`、`read_project_file`。
- 当需要确认工程事实时使用 `terminal_run`，例如包管理器、脚本列表、git 文件集、测试入口、生成物排除。
- 当结构化命令无法表达管道/组合查询时使用 `terminal_shell`。
- 当命令行为依赖 TTY、彩色/交互式 help、bounded stdin transcript 时使用 `terminal_pty`。
- 终端调用必须服务于“分析代码逻辑和查找证据”，不能变成泛化运维执行。

测试模式仍禁止：

- `terminal_script`
- 长时 persistent interactive session
- 网络安装命令
- 写入项目文件的终端命令
- `sudo`、包安装、删除、权限修改、后台 daemon

推荐第一批测试命令类型：

- 环境版本：`node --version`、`pnpm --version`、`python3 --version`
- 仓库状态：`git status --short`、`git ls-files`
- 项目识别：`pnpm list --depth 0`、`npm pkg get scripts`、`node -e` 读取 package metadata
- 测试探测：只允许 `--help`、`--version`、`--list`、`--dry-run`、指定小范围测试
- PTY 测试：CLI help、彩色输出、需要 TTY 才格式化的命令；stdin 仅用 bounded one-shot

治理要求：

- 所有终端工具输出必须走 `ToolResultEnvelope`。
- 所有预览必须 redacted。
- 所有命令必须写入冷启动报告。
- 终端失败不应直接失败整个维度，除非该维度明确依赖终端验证。
- 报告里将终端效果单独统计：成功率、平均耗时、blocked 数、needs-confirmation 数、timeout 数、输出截断数。

对比指标：

- 每个维度的候选数量、候选通过率、重复率、平均质量分。
- analyze 阶段 tool call 数、终端工具占比、token 使用、耗时。
- 终端调用成功率、blocked/timeout/needs-confirmation 数。
- 终端是否发现了非终端工具未发现的入口文件、脚本、测试、模块关系。
- 用户审核通过率或后续 recipe 发布率。

### 4.5 提示词统一调整

工具集调整必须同步提示词，否则 Agent 会看到新工具但仍按旧节奏工作。提示词不新增新的 Agent prompt 文件，只修改现有 insight prompt。

#### Analyst prompt

修改文件：

- `lib/agent/prompts/insight-analyst.ts`

调整点：

- 在 `ANALYST_SYSTEM_PROMPT` 中明确优先级：
  1. 先使用注入的 panorama / projectInfo / codeEntityGraph / sessionStore。
  2. 再使用结构化工具验证关键事实。
  3. 只有在 `terminalTest` 启用且需要验证工程命令、脚本、测试入口、CLI 行为时才调用终端。
- 删除“每轮都必须调用工具”的绝对表述，改为“每轮必须产生新证据；若已有全景数据足够，可直接总结或记录发现”。
- 增加终端使用规则：
  - `terminal_run` 优先。
  - `terminal_shell` 只用于管道/重定向/命令替换确实必要时。
  - `terminal_pty` 只用于需要 TTY transcript 的 CLI 行为。
  - 禁止 install、删除、写文件、启动 daemon、网络命令。
- 增加工具选择规则：
  - 结构事实用 `get_project_overview` / `query_code_graph`。
  - 具体证据用 `search_project_code` / `read_project_file`。
  - 调用关系用 `query_call_graph`。
  - 局部质量审查用 `analyze_code`。
  - 不要为了同一问题同时调用多个语义重叠工具。

#### Producer prompt

修改文件：

- `lib/agent/prompts/insight-producer.ts`

调整点：

- `PRODUCER_SYSTEM_PROMPT` 从“唯一工作是格式化为 submit_knowledge”改为“格式化、校验、提交”。
- 明确工具顺序：
  1. 必要时 `read_project_file` 补证据。
  2. `check_duplicate` 判断重复风险。
  3. `validate_candidate` 做 dry-run 字段校验。
  4. 优先 `submit_with_check`。
  5. 只有明确无需查重时才直接 `submit_knowledge`。
  6. 结束前可用 `review_my_output` / `quality_score` 做自检。
- 明确 Producer 禁止终端、禁止新增搜索探索、禁止修改已发布知识生命周期。

#### Evolver prompt

修改文件：

- `lib/agent/prompts/insight-evolver.ts`

调整点：

- 明确旧知识校验优先用 `search_recipes` / `get_recipe_detail` 获取知识上下文。
- 代码真实性用 `search_project_code` / `read_project_file` / `query_code_graph` / `query_call_graph`。
- 终端只在 `terminalTest` 启用时用于验证工程命令事实。
- 决策顺序：`skip_evolution` 优先于强行废弃；有替代关系才 `propose_evolution`；证据明确过期才 `confirm_deprecation`。

#### Stage prompt context

修改文件：

- `lib/agent/profiles/AgentStageFactoryRegistry.ts`
- `lib/workflows/deprecated-cold-start/agent-runs/BootstrapDimensionInputBuilder.ts`
- `lib/workflows/deprecated-cold-start/agent-runs/BootstrapSessionExecutionBuilder.ts`

调整点：

- 不新增 stage。
- 将 `terminalTest`、`allowedTerminalModes`、`panoramaSummary`、`toolPolicyHints` 放入现有 `strategyContext` / `promptContext`。
- 每个 stage promptBuilder 根据这些 context 拼接工具使用约束。

### 5. 前端冷启动报告展示方案

当前已有基础：

- 后端 `BootstrapReportSnapshotConsumer` 会写 `.asd/bootstrap-report.json`。
- `BootstrapTaskManager` 通过 Socket.io 广播 `bootstrap:*` 进度。
- 前端 `useBootstrapSocket` 展示实时 session 状态。
- 前端 `BootstrapProgressView` 展示维度卡片、review pipeline、总进度。
- 前端 `SignalReportView` 已有 `reports` tab，可展示系统报告。
- `CandidatesView` 展示候选维度分组。

当前不足：

- `.asd/bootstrap-report.json` 没有专门 HTTP API。
- 前端只能看实时进度，不能查看完整报告。
- 不能查看历史报告。
- 不能对比两次冷启动工具集优化效果。
- 报告没有展示 stage 级工具白名单、终端命令、blocked/confirmation/timeout 等治理信息。

#### 后端 API 设计

新增 routes，建议放在 `lib/http/routes/modules.ts` 或独立 `lib/http/routes/bootstrap-reports.ts`：

- `GET /api/v1/modules/bootstrap/report/latest`
  - 返回最新报告。
- `GET /api/v1/modules/bootstrap/reports`
  - 返回历史报告列表。
- `GET /api/v1/modules/bootstrap/reports/:sessionId`
  - 返回单次完整报告。
- `GET /api/v1/modules/bootstrap/reports/:sessionId/diff?base=<sessionId>`
  - 返回两次报告对比。
- `GET /api/v1/modules/bootstrap/reports/:sessionId/artifacts/:artifactId`
  - 返回终端 transcript、tool trace、阶段摘要等 artifact。

报告存储建议：

- 保留 `.asd/bootstrap-report.json` 作为 latest。
- 新增 `.asd/bootstrap-reports/<sessionId>.json` 作为历史。
- 新增 `.asd/bootstrap-reports/index.json` 存 summary 列表。

#### 报告数据结构升级

在 `BootstrapReport` 中新增：

- `session`
  - `id`
  - `mode`
  - `startedAt`
  - `completedAt`
  - `profileVersion`
  - `terminalTest`
- `stageToolsets`
  - 每个 stage 的 `capabilities`
  - `allowedTools`
  - `toolSchemaCount`
- `toolUsage`
  - total
  - byTool
  - byStage
  - blocked
  - needsConfirmation
  - timeouts
  - avgDurationMs
- `terminal`
  - enabled
  - commands
  - ptyRuns
  - blocked
  - transcriptRefs
  - successRate
- `dimensions[dimId].stages`
  - analyze / produce / evolve 的耗时、工具调用、token、质量门结果
- `candidates`
  - submitted
  - accepted
  - rejected
  - validationErrors
  - duplicateRisk
- `comparisonHints`
  - 可用于前端提示“比上次更好/更差”的指标。

#### 前端页面设计

不新增页面。

复用：

- `dashboard/src/components/Views/SignalReportView.tsx`
- 现有 reports tab

页面模块：

- 在 reports tab 中增加 report type filter：`bootstrap` / `terminal` / `tool-usage` / `quality`。
- `ReportCard` 支持 bootstrap report 的富摘要展示：耗时、维度数、候选数、token、工具调用、终端成功率。
- 展开态显示维度矩阵、stage 时间线、工具使用表、终端测试摘要、候选质量摘要。
- 对比模式复用 reports tab 的选择能力，不新增导航页面。
- 原始 JSON 仍保留在展开态，便于调试。

前端 API client：

- `api.getBootstrapReportLatest()`
- `api.listBootstrapReports()`
- `api.getBootstrapReport(sessionId)`
- `api.diffBootstrapReports(sessionId, baseSessionId)`

Socket 增强：

- `bootstrap:stage-started`
- `bootstrap:stage-completed`
- `bootstrap:tool-call`
- `bootstrap:tool-result`
- `bootstrap:terminal-artifact`
- `bootstrap:report-ready`

UI 行为：

- 冷启动进行中展示实时进度。
- `bootstrap:report-ready` 后在现有信号页面 reports tab 出现最新报告。
- `BootstrapProgressView` 和 `CandidatesView` 只提供跳转/切换到信号页 reports tab 的入口。
- 对比报告时默认选择上一份同项目报告。

### 6. 具体落地实现方案

本方案按“先修工具链路，再开放工具集，再做实验报告，最后接前端”的顺序推进。每一步都应能独立测试和提交，避免一次性大改。

#### 6.1 实施原则

- 不新增冷启动 Agent 文件。
- 不新增冷启动前置阶段。
- 不新增前端页面。
- 继续复用现有 `insight` pipeline、`code_analysis`、`knowledge_production`、`evolution_analysis`。
- 终端能力只作为 analyze/evolve 阶段可选代码分析工具进入实验工具集。
- 工具保持单一职责，不新增 `bootstrap_project_probe`、`bootstrap_toolset_report` 这类组合型模型工具。
- 报告采集放在 runtime/workflow 旁路，不作为 Agent 可调用工具。

#### 6.2 第一阶段：修正工具白名单语义

目标：确保冷启动每个 stage 到底能用哪些工具是确定的、可记录的、可拦截的。

修改文件：

- `lib/agent/runtime/LoopContext.ts`
- `lib/agent/runtime/AgentRuntime.ts`
- `lib/agent/runtime/ToolExecutionPipeline.ts`
- `lib/agent/runtime/AgentRuntimeTypes.ts`
- `test/unit/AgentRuntime.test.ts`
- `test/integration/ToolPipeline.test.ts`

实现步骤：

1. 在 `LoopContext` 增加 `allowedToolIds: string[]` 字段。
2. `AgentRuntime.reactLoop()` 中将 `#collectTools(caps)` 的结果规范化为 `allowedToolIds`。
3. `#getToolSchemas()` 只负责 schema 投影，不再承担“是否允许”的隐含语义。
4. `allowlistGate` 从 `ctx.loopCtx.allowedToolIds` 判断，而不是从 `toolSchemas` 反推。
5. `allowedToolIds.length === 0` 时严格禁止所有非 temporary forged tools。
6. 保留 temporary forged tool 例外，但报告里必须能区分 temporary tool 与 capability tool。
7. `AgentDiagnostics` 增加 `stageToolsets` 或等价结构，记录 stage、capabilities、allowedToolIds、toolSchemaCount。

验收标准：

- capability 为空时，模型即使返回 tool call 也会被 `allowlistGate` 阻断。
- 有 capability 时，只允许当前 capability 工具和明确追加的工具。
- `diagnostics` 中能看到每次 loop 的工具集快照。
- 现有 forged temporary tool 测试不回退。

#### 6.3 第二阶段：调整现有 capability 工具集

目标：不新建能力文件，只升级现有三个能力的工具白名单。

修改文件：

- `lib/agent/capabilities/CodeAnalysis.ts`
- `lib/agent/capabilities/KnowledgeProduction.ts`
- `lib/agent/capabilities/EvolutionAnalysis.ts`
- `test/unit/CapabilityCatalog.test.ts`
- `test/integration/StrategyPolicy.test.ts`

`code_analysis` 默认工具：

- 保留：`get_project_overview`、`list_project_structure`、`get_file_summary`、`search_project_code`、`read_project_file`、`semantic_search_code`、`query_code_graph`、`get_class_hierarchy`、`get_class_info`、`get_protocol_info`、`get_method_overrides`、`get_category_map`、`get_previous_analysis`、`get_previous_evidence`、`note_finding`。
- 新增：`query_call_graph`、`analyze_code`。
- 不默认新增终端工具；终端由冷启动实验模式追加。

`knowledge_production` 默认工具：

- 保留：`read_project_file`、`submit_knowledge`、`submit_with_check`。
- 新增：`check_duplicate`、`validate_candidate`、`review_my_output`、`quality_score`。
- 禁止：终端工具、生命周期发布/废弃工具、搜索探索工具。

`evolution_analysis` 默认工具：

- 保留：`read_project_file`、`search_project_code`、`propose_evolution`、`confirm_deprecation`、`skip_evolution`。
- 新增：`search_recipes`、`get_recipe_detail`、`semantic_search_code`、`query_code_graph`、`query_call_graph`、`quality_score`。
- 不默认新增终端工具；终端由冷启动实验模式追加。

验收标准：

- 三个 capability 的 tool list 与文档一致。
- `insight` 默认 analyze/produce 不暴露全量 `system_interaction`。
- Producer 看不到终端工具。
- Evolution 默认不使用终端，但实验模式可追加 `terminal_run` / `terminal_shell`。

#### 6.4 第三阶段：增加冷启动终端实验开关

目标：让冷启动分析 Agent 可以在实验配置下选择终端工具，同时支持不同工具集档位对比。

修改文件：

- `lib/workflows/deprecated-cold-start/BootstrapWorkflow.ts`
- `lib/workflows/deprecated-cold-start/agent-runs/BootstrapSessionExecutionBuilder.ts`
- `lib/workflows/deprecated-cold-start/agent-runs/BootstrapDimensionInputBuilder.ts`
- `lib/agent/profiles/AgentStageFactoryRegistry.ts`
- `lib/agent/profiles/presets.ts`
- `lib/agent/policies.ts`
- `lib/agent/tools/system-interaction.ts`
- `test/unit/SystemInteractionTools.test.ts`
- `test/unit/AgentFactory.test.ts`

新增参数：

- `terminalTest?: boolean`
- `terminalToolset?: 'baseline' | 'terminal-run' | 'terminal-shell' | 'terminal-pty'`
- `allowedTerminalModes?: Array<'run' | 'shell' | 'pty'>`

解析优先级：

1. API 入参。
2. profile params。
3. 环境变量 `ALEMBIC_BOOTSTRAP_TERMINAL_TEST=1`。
4. 默认 `baseline`。

工具追加规则：

- `baseline`：不追加终端。
- `terminal-run`：analyze 追加 `terminal_run`。
- `terminal-shell`：analyze 追加 `terminal_run`、`terminal_shell`。
- `terminal-pty`：analyze 追加 `terminal_run`、`terminal_shell`、`terminal_pty`。
- evolution 在 `terminal-shell` 及以上追加 `terminal_run`、`terminal_shell`，默认不追加 `terminal_pty`。
- produce 永远不追加终端。

治理要求：

- 终端实验模式不等于开放 `system_interaction` capability。
- 后台冷启动中 `terminal_shell` / `terminal_pty` 需要专门的测试治理策略，避免全部落入 `needs-confirmation`。
- 第一版只允许只读命令、无网络、无项目写入、无 daemon、无 install。
- `terminal_script` 不进入本轮实验档位。

验收标准：

- `terminalTest=false` 与当前默认行为兼容。
- `terminalToolset=terminal-run` 时 analyze schema 中只有 `terminal_run`。
- `terminalToolset=terminal-pty` 时 analyze schema 中包含 `terminal_pty`，produce schema 中仍不包含任何终端工具。
- 被策略阻断的终端命令不会失败整个维度，但会进入报告。

#### 6.5 第四阶段：同步提示词与工具选择规则

目标：让 Agent 知道什么时候不用工具、什么时候用结构化工具、什么时候用终端。

修改文件：

- `lib/agent/prompts/insight-analyst.ts`
- `lib/agent/prompts/insight-producer.ts`
- `lib/agent/prompts/insight-evolver.ts`
- `lib/agent/profiles/presets.ts`
- `test/unit/DynamicComposer.test.ts`

实现步骤：

1. Analyst prompt 明确优先使用 panorama / projectInfo / codeEntityGraph / sessionStore。
2. Analyst prompt 增加工具选择顺序：图谱和搜索优先，终端只做工程事实验证。
3. Analyst prompt 删除“为了调用而调用工具”的倾向，改成“每轮必须产生新证据”。
4. Producer prompt 明确提交前校验链路：`check_duplicate` -> `validate_candidate` -> `submit_with_check` -> `review_my_output` / `quality_score`。
5. Producer prompt 明确禁止终端和新增探索。
6. Evolver prompt 明确旧知识上下文优先来自 `search_recipes` / `get_recipe_detail`，代码事实用代码工具验证。
7. 根据 `terminalTest` / `terminalToolset` 在 stage prompt context 中注入终端使用约束。

验收标准：

- Prompt 中不会鼓励 Producer 搜索或跑终端。
- Prompt 中明确终端是可选验证工具，不是必调工具。
- `terminalTest=false` 时 prompt 不出现可用终端档位描述。
- `terminalTest=true` 时 prompt 中出现当前档位和禁止命令边界。

#### 6.6 第五阶段：扩展冷启动报告采集

目标：让每次冷启动都能回放“开放了什么工具、Agent 用了什么工具、终端带来了什么增量”。

修改文件：

- `lib/workflows/deprecated-cold-start/reports/BootstrapReportSnapshotConsumer.ts`
- `lib/workflows/deprecated-cold-start/consumers/BootstrapDimensionConsumer.ts`
- `lib/workflows/deprecated-cold-start/projections/BootstrapDimensionProjection.ts`
- `lib/workflows/deprecated-cold-start/checkpoint/BootstrapRestoreState.ts`
- `test/unit/AgentRuntime.test.ts`
- `test/integration/ToolPipeline.test.ts`

新增报告字段：

- `session`: sessionId、mode、startedAt、completedAt、terminalTest、terminalToolset。
- `stageToolsets`: stage、capabilities、allowedTools、toolSchemaCount。
- `toolUsage`: total、byTool、byStage、blocked、needsConfirmation、timeouts、avgDurationMs。
- `terminal`: enabled、toolset、commands、ptyRuns、blocked、successRate、transcriptRefs。
- `dimensions[dimId].stages`: analyze / produce / evolve 的耗时、工具调用、token、质量门结果。
- `comparisonHints`: 与上一份同项目报告可比的指标摘要。

实现步骤：

1. 从 `runResult.toolCalls` 和 `runResult.diagnostics.toolCalls` 聚合 tool usage。
2. 从 `diagnostics.stageToolsets` 聚合每个 stage 工具集快照。
3. 识别 `terminal_*` 工具调用，生成终端摘要，不把完整 stdout 直接塞进报告主体。
4. 长 transcript 以 artifact ref 形式记录。
5. `.asd/bootstrap-report.json` 保持 latest。
6. 新增 `.asd/bootstrap-reports/<sessionId>.json` 保存历史。
7. 新增 `.asd/bootstrap-reports/index.json` 保存列表摘要。

验收标准：

- 报告能看出某次运行是 `baseline` 还是某个终端档位。
- 报告能看出每个 stage 可用工具和实际调用工具。
- 报告能统计 blocked / needs-confirmation / timeout。
- 历史报告不会覆盖 latest。

#### 6.7 第六阶段：新增报告 HTTP API

目标：给现有信号页 reports tab 提供 latest、历史和 diff 数据。

修改文件：

- `lib/http/routes/modules.ts` 或新增 `lib/http/routes/bootstrap-reports.ts`
- `lib/http/routes/ai.ts`
- `test/unit/AiRouteDirectTool.test.ts` 或新增 route 单测

新增 API：

- `GET /api/v1/modules/bootstrap/report/latest`
- `GET /api/v1/modules/bootstrap/reports`
- `GET /api/v1/modules/bootstrap/reports/:sessionId`
- `GET /api/v1/modules/bootstrap/reports/:sessionId/diff?base=<sessionId>`
- `GET /api/v1/modules/bootstrap/reports/:sessionId/artifacts/:artifactId`

验收标准：

- 没有报告时返回空状态，不 500。
- latest 与历史 session 报告可分别读取。
- diff API 至少返回 toolUsage、terminal、candidate、duration 四类差异。
- artifact API 有路径约束，不能越权读取项目任意文件。

#### 6.8 第七阶段：接入现有前端 reports tab

目标：不新建页面，在现有信号页面中完整展示冷启动报告和对比信息。

修改文件：

- `dashboard/src/components/Views/SignalReportView.tsx`
- `dashboard/src/hooks/useBootstrapSocket.ts`
- `dashboard/src/lib/api.ts` 或现有 API client
- `dashboard/src/components/BootstrapProgressView.tsx`
- `dashboard/src/components/CandidatesView.tsx`

实现步骤：

1. API client 增加 latest/list/detail/diff 方法。
2. `SignalReportView` 的 reports tab 增加 report type filter。
3. `ReportCard` 显示冷启动摘要：耗时、维度数、候选数、token、工具调用、终端成功率。
4. 展开态显示 stage 工具集、工具使用表、终端摘要、候选质量摘要、原始 JSON。
5. 增加对比模式，默认选择上一份同项目报告作为 base。
6. `bootstrap:report-ready` 后刷新 reports tab 数据。
7. `BootstrapProgressView` / `CandidatesView` 只提供跳转入口，不承载完整报告页。

验收标准：

- 冷启动结束后能在 reports tab 看到最新报告。
- 能查看历史报告。
- 能对比 baseline 与 terminal 档位。
- 能看到终端命令摘要和治理结果，但不会泄露未 redacted 的完整敏感输出。

#### 6.9 第八阶段：实验运行与质量闭环

目标：用真实冷启动对比工具集，而不是只验证功能可用。

建议实验顺序：

1. 跑 `baseline`，记录候选数、通过率、耗时、tool calls。
2. 跑 `terminal-run`，比较是否更快识别脚本、入口文件、测试布局。
3. 跑 `terminal-shell`，比较组合查找是否减少无效搜索。
4. 跑 `terminal-pty`，只在 CLI/TTY 价值明确的项目中启用。

重点观察：

- 终端是否减少重复搜索。
- 终端是否提升候选通过率。
- 终端是否导致更多 blocked/needs-confirmation。
- 终端输出是否增加上下文噪音。
- PTY 是否真的带来超过 `terminal_run` 的收益。

回滚策略：

- 如果终端失败率高，只保留 `terminal-run` 档位。
- 如果 Producer rejection rate 上升，收紧 Producer prompt 和工具集。
- 如果 schema 噪音明显，缩减 analyze 默认工具，保留终端为显式实验档位。
- 如果报告体积过大，将 transcript 全部转 artifact ref。

#### 6.10 推荐提交拆分

1. `runtime-tool-allowlist`：`allowedToolIds`、allowlist gate、stage toolset diagnostics。
2. `bootstrap-capability-toolsets`：三个现有 capability 的工具清单和测试。
3. `bootstrap-terminal-toolset`：`terminalTest`、`terminalToolset`、stage context 注入、终端治理。
4. `bootstrap-prompts`：三类 insight prompt 与工具选择规则。
5. `bootstrap-report-model`：报告结构、历史存储、tool/terminal 聚合。
6. `bootstrap-report-api`：latest/list/detail/diff/artifact API。
7. `signal-report-ui`：现有 reports tab 展示、历史和对比。
8. `bootstrap-toolset-eval`：补实验脚本或测试 fixture，记录 baseline 与终端档位对比结果。
