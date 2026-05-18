# Agent 目录重组剩余实现计划

> 这份文档承接 `agent-module-directory-reorganization-plan.md`。前一轮完成了主干迁移和兼容 stub 删除；本轮继续落实“命名清晰、职责单一、文件层级反映边界”。

## 1. 任务状态

### R1：Agent 聚合文件细拆

状态：已完成。

完成内容：

- `lib/agent/policies/index.ts` 已收缩为 barrel。
- `Policy.ts`、`BudgetPolicy.ts`、`SafetyPolicy.ts`、`QualityGatePolicy.ts`、`PolicyEngine.ts` 已独立。
- `lib/agent/strategies/index.ts` 已收缩为 barrel。
- `Strategy.ts`、`SingleStrategy.ts`、`FanOutStrategy.ts`、`AdaptiveStrategy.ts`、`StrategyRegistry.ts` 已独立。
- `PipelineStrategy.ts` 直接依赖 `Strategy.ts` 与 `StrategyRegistry.ts`，避免通过 barrel 形成隐式循环。
- `lib/agent/capabilities/index.ts` 已收缩为 barrel。
- `Capability.ts`、`Conversation.ts`、`CodeAnalysis.ts`、`KnowledgeProduction.ts`、`ScanProduction.ts`、`SystemInteraction.ts`、`EvolutionAnalysis.ts`、`CapabilityRegistry.ts` 已独立。

### R2：Agent run helper 子目录化

状态：已完成。

完成内容：

- 新增 `lib/agent/runs/index.ts` 作为 run helper barrel。
- `scan/` 承载 `ScanAgentRun.ts` 与 `ScanRunProjection.ts`。
- `translation/` 承载 `TranslationAgentRun.ts`。
- `relation/` 承载 `RelationAgentRun.ts`。
- `evolution/` 承载 `EvolutionAgentRun.ts`。
- `lib/agent/service/index.ts` 改为从 `../runs/index.js` 统一导出 run helper。
- 旧扁平 run 文件已删除，不保留 re-export stub。

### R3：Profile definitions 从 registry 拆出

状态：已完成。

目标结构：

```text
lib/agent/profiles/
  AgentProfileRegistry.ts
  AgentProfileCompiler.ts
  AgentStageFactoryRegistry.ts
  presets.ts
  definitions/
    bootstrap.profile.ts
    chat.profile.ts
    evolution.profile.ts
    index.ts
    relation.profile.ts
    remote.profile.ts
    scan.profile.ts
    signal.profile.ts
    translation.profile.ts
```

完成内容：

- `AgentProfileRegistry.ts` 不再承载内置 profile 数据，只负责注册、查询和序列化校验。
- `definitions/*.profile.ts` 只导出 profile 数据，不依赖 runtime/container。
- `definitions/index.ts` 聚合 `BUILTIN_PROFILES`，供 registry 默认注册。

### R4：Bootstrap workflow 子目录化

状态：已完成。

目标结构：

```text
lib/workflows/deprecated-cold-start/
  BootstrapWorkflow.ts
  agent-runs/
  briefing/
  checkpoint/
  config/
  consumers/
  context/
  delivery/
  incremental/
  mock/
  phases/
  projections/
  reports/
  session/
```

完成内容：

- `agent-runs/` 承载 session/dimension run input 和 execution builder。
- `projections/` 承载 session/dimension result projection。
- `consumers/` 承载 dimension/session/tier/skill/semantic/candidate side effects。
- `context/` 承载 runtime initializer、rescan state、dimension context。
- `checkpoint/` 承载 checkpoint store 和 restore state。
- `incremental/` 承载 snapshot 与 incremental bootstrap。
- `config/` 承载 dimension configs、base dimensions、tier scheduler。
- `reports/`、`delivery/`、`mock/` 分别承载 report/snapshot、wiki delivery、mock pipeline。
- bootstrap 根目录只保留 `BootstrapWorkflow.ts` 主入口。

### R5：MCP bootstrap handler 瘦身

状态：已完成核心迁移。

完成内容：

- `MissionBriefingBuilder.ts` 迁入 `lib/workflows/deprecated-cold-start/briefing/`。
- `BootstrapSession.ts` 与 `ExternalSubmissionTracker.ts` 迁入 `lib/workflows/deprecated-cold-start/session/`。
- `bootstrap-phases.ts` 迁入 `lib/workflows/deprecated-cold-start/phases/BootstrapPhaseRunner.ts`。
- `dimension-text.ts` 迁入 `lib/workflows/deprecated-cold-start/briefing/BootstrapDimensionText.ts`。
- `base-dimensions.ts` 迁入 `lib/workflows/deprecated-cold-start/config/BaseDimensions.ts`。
- MCP handler 层现在通过 `#workflows/deprecated-cold-start/*` 调用 workflow 能力，不再承载这些重实现文件。

后续如需继续压薄，可再把 `bootstrap-external.ts` 的 request/response 拼装拆成 `BootstrapMcpRequestMapper.ts` 和 `BootstrapMcpResponsePresenter.ts`；这属于命名精修，不影响本轮重逻辑迁移结果。

### R6：`ChatAgentTasks` 迁出 domain

状态：已完成。

完成内容：

- `lib/agent/domain/ChatAgentTasks.ts` 迁入 `lib/agent/runs/chat/ChatAgentTasks.ts`。
- HTTP AI route 和测试引用已更新到新路径。
- `lib/agent/domain` 不再承载该 task orchestration helper。

## 2. 防回归约束

- `test/unit/AgentModuleBoundaries.test.ts` 覆盖旧 agent 顶层 stub、旧 tool/core 路径、旧 MCP bootstrap pipeline、旧 bootstrap helper 文件、旧 `ChatAgentTasks` 路径不可恢复。
- `index.ts` 保持 barrel 语义，不承载真实实现。
- 新跨目录引用优先使用 `#agent/*`、`#tools/*`、`#workflows/*`、`#external/*` 等显式边界 alias。

## 3. 验证记录

- `pnpm typecheck` 通过。
- `pnpm vitest run test/unit/AgentProfileCompiler.test.ts test/unit/ChatAgentTasks.test.ts test/unit/BootstrapSessionInputBuilder.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts test/unit/BootstrapSessionConsumer.test.ts test/unit/BootstrapProjection.test.ts test/unit/AuditEmission-MissionBriefing.test.ts test/unit/AgentModuleBoundaries.test.ts` 通过：8 个测试文件，27 个测试。
- 相关 lints 无错误。
# Agent 目录重组剩余实现计划

> 这份文档承接 `agent-module-directory-reorganization-plan.md`。前一轮完成了主干迁移和兼容 stub 删除，但“命名清晰、职责单一、文件层级反映边界”的目标还需要继续推进。
>
> 原则：不因为代码能跑就停止重构；只要职责仍混在大文件或旧语义目录里，就继续拆。

## 1. 剩余任务总览

### R1：Agent 聚合文件细拆

状态：已完成。

目标结构：

```text
lib/agent/policies/
  Policy.ts
  BudgetPolicy.ts
  SafetyPolicy.ts
  QualityGatePolicy.ts
  PolicyEngine.ts
  index.ts

lib/agent/capabilities/
  Capability.ts
  Conversation.ts
  CodeAnalysis.ts
  KnowledgeProduction.ts
  ScanProduction.ts
  SystemInteraction.ts
  EvolutionAnalysis.ts
  CapabilityRegistry.ts
  index.ts

lib/agent/strategies/
  Strategy.ts
  SingleStrategy.ts
  FanOutStrategy.ts
  AdaptiveStrategy.ts
  StrategyRegistry.ts
  PipelineStrategy.ts
  index.ts
```

验收：

- `index.ts` 只作为 barrel，不承载真实 class/function 实现。
- 现有 `../policies/index.js` / `../capabilities/index.js` / `../strategies/index.js` import 保持可用。

### R2：Agent run helper 子目录化

状态：已完成。

目标结构：

```text
lib/agent/runs/
  scan/
    ScanAgentRun.ts
    ScanRunProjection.ts
  translation/
    TranslationAgentRun.ts
  relation/
    RelationAgentRun.ts
  evolution/
    EvolutionAgentRun.ts
  index.ts
```

验收：

- `lib/agent/service/index.ts` 从 `../runs/index.js` 导出 run helper。
- 不保留旧 run re-export stub。
- 不再存在 `lib/agent/runs/{ScanAgentRun,ScanRunProjection,TranslationAgentRun,RelationAgentRun,EvolutionAgentRun}.ts` 扁平文件。

### R3：Profile definitions 从 registry/presets 中拆出

状态：未完成。

现状：

- `AgentProfileRegistry.ts` 中仍直接定义 profile 列表。
- `presets.ts` 仍承担 legacy preset 解析和 profile 组合入口。

目标结构：

```text
lib/agent/profiles/
  AgentProfileRegistry.ts
  AgentProfileCompiler.ts
  AgentStageFactoryRegistry.ts
  presets.ts
  definitions/
    chat.profile.ts
    scan.profile.ts
    translation.profile.ts
    signal.profile.ts
    relation.profile.ts
    evolution.profile.ts
    bootstrap.profile.ts
```

验收：

- Registry 只负责注册/查询，不承载大段 profile 数据。
- definitions 文件只导出数据，不依赖 runtime/container。

### R4：Bootstrap workflow 子目录化

状态：未完成。

现状：

- `lib/workflows/deprecated-cold-start` 已从 MCP pipeline 迁出，但 25 个文件仍平铺。
- 文件名职责清楚，但目录层级还没有表达 projection / input builder / consumer / checkpoint / incremental / config / briefing。

目标结构：

```text
lib/workflows/deprecated-cold-start/
  BootstrapWorkflow.ts
  agent-runs/
  projections/
  consumers/
  context/
  checkpoint/
  incremental/
  config/
  reports/
  delivery/
  mock/
```

验收：

- `BootstrapWorkflow.ts` 只导入子目录 public 文件。
- `checkpoint.ts`、`BootstrapSnapshot.ts`、`IncrementalBootstrap.ts`、`dimension-configs.ts`、`dimension-context.ts` 不再位于 bootstrap 根目录。
- 不恢复旧 `lib/external/mcp/handlers/bootstrap/pipeline`。

### R5：MCP bootstrap handler 瘦身

状态：未完成。

现状：

- `lib/external/mcp/handlers/bootstrap/MissionBriefingBuilder.ts` 仍是较重 briefing 构建逻辑。
- `lib/external/mcp/handlers/bootstrap/BootstrapSession.ts` 仍维护 session/completion 状态。
- `lib/external/mcp/handlers/bootstrap/shared/bootstrap-phases.ts` 仍承载较多 phase orchestration 和 CodeEntityGraph 副作用。

目标：

```text
lib/external/mcp/handlers/bootstrap/
  BootstrapMcpHandler.ts
  BootstrapMcpRequestMapper.ts
  BootstrapMcpResponsePresenter.ts

lib/workflows/deprecated-cold-start/briefing/MissionBriefingBuilder.ts
lib/workflows/deprecated-cold-start/session/BootstrapSession.ts
lib/workflows/deprecated-cold-start/phases/BootstrapPhaseRunner.ts
```

验收：

- MCP handler 只做 request parse、service/container 获取、workflow 调用、response 映射。
- checkpoint、SessionStore、CodeEntityGraph、briefing build 不在 MCP handler 层实现。

### R6：`ChatAgentTasks` 迁出 domain

状态：未完成。

现状：

- `lib/agent/domain/ChatAgentTasks.ts` 是 task helper/orchestration，不是纯 domain 对象。

目标：

- 若只服务 Agent run，迁到 `lib/agent/runs/chat/ChatAgentTasks.ts`。
- 若变成 HTTP/CLI 复用 workflow，迁到 `lib/workflows/chat/ChatAgentTasks.ts`。

验收：

- `lib/agent/domain` 只保留真正领域模型/评估/证据对象。

## 2. 实施顺序

1. [x] R1：拆 `policies` / `capabilities` / `strategies`。
2. [x] R2：拆 `runs` 子目录，更新 service barrel。
3. [ ] R3：拆 profile definitions，降低 registry 复杂度。
4. [ ] R4：整理 `lib/workflows/deprecated-cold-start` 子目录。
5. [ ] R5：瘦 MCP bootstrap handler，把 briefing/session/phases 迁到 workflow。
6. [ ] R6：处理 `ChatAgentTasks` 归属。

## 3. 防回归约束

- `test/unit/AgentModuleBoundaries.test.ts` 已覆盖旧 stub/旧路径不可恢复。
- 后续每完成一个 R 阶段，都要补充边界测试或扩展现有测试。
- 每阶段至少跑 `pnpm typecheck` 和对应聚焦回归。

## 4. 执行记录

### R1 已完成

- `lib/agent/policies/index.ts` 已收缩为 barrel。
- 新增 `Policy.ts`、`BudgetPolicy.ts`、`SafetyPolicy.ts`、`QualityGatePolicy.ts`、`PolicyEngine.ts`。
- `lib/agent/strategies/index.ts` 已收缩为 barrel。
- 新增 `Strategy.ts`、`SingleStrategy.ts`、`FanOutStrategy.ts`、`AdaptiveStrategy.ts`、`StrategyRegistry.ts`。
- `PipelineStrategy.ts` 已改为直接依赖 `Strategy.ts` 与 `StrategyRegistry.ts`，不再通过 strategy barrel 形成隐式循环。
- `lib/agent/capabilities/index.ts` 已收缩为 barrel。
- 新增 `Capability.ts`、`Conversation.ts`、`CodeAnalysis.ts`、`KnowledgeProduction.ts`、`ScanProduction.ts`、`SystemInteraction.ts`、`EvolutionAnalysis.ts`、`CapabilityRegistry.ts`。

验证：

- `pnpm typecheck` 通过。
- `pnpm vitest run test/integration/StrategyPolicy.test.ts test/unit/AgentProfileCompiler.test.ts test/unit/AgentRuntime.test.ts test/unit/CapabilityCatalog.test.ts test/unit/ToolRouterGovernance.test.ts test/unit/AgentModuleBoundaries.test.ts` 通过：6 个测试文件，95 个测试。
- 相关 lints 无错误。

### R2 已完成

- 新增 `lib/agent/runs/index.ts` 作为 run helper barrel。
- `ScanAgentRun.ts` 与 `ScanRunProjection.ts` 迁入 `lib/agent/runs/scan/`。
- `TranslationAgentRun.ts` 迁入 `lib/agent/runs/translation/`。
- `RelationAgentRun.ts` 迁入 `lib/agent/runs/relation/`。
- `EvolutionAgentRun.ts` 迁入 `lib/agent/runs/evolution/`。
- `lib/agent/service/index.ts` 改为从 `../runs/index.js` 统一导出 run helper。
- 旧扁平 run 文件已删除，不保留 re-export stub。

验证：

- `pnpm typecheck` 通过。
- `pnpm vitest run test/unit/AgentService.test.ts test/unit/AgentProfileCompiler.test.ts test/unit/ChatAgentTasks.test.ts test/integration/StrategyPolicy.test.ts test/unit/AgentModuleBoundaries.test.ts` 通过：5 个测试文件，37 个测试。
- 相关 lints 无错误。

下一步：

- 执行 R3：拆 `profiles/definitions/*.profile.ts`，让 `AgentProfileRegistry.ts` 不再承载大段 profile 数据。
# Agent 目录重组剩余实现计划

> 这份文档承接 `agent-module-directory-reorganization-plan.md`。前一轮只完成了主干迁移和兼容 stub 删除，但没有把所有“命名清晰、职责单一、文件层级反映边界”的目标落实完。
>
> 本文档只记录未完成项，并作为后续实现清单。原则：不因为代码能跑就停止重构；只要职责仍混在大文件或旧语义目录里，就继续拆。

## 1. 当前未完成项

### R1：Agent 聚合文件仍未细拆

现状：

- `lib/agent/policies/index.ts` 仍承载 `Policy`、`BudgetPolicy`、`SafetyPolicy`、`QualityGatePolicy`、`PolicyEngine`。
- `lib/agent/capabilities/index.ts` 仍承载所有 capability 实现与 registry。
- `lib/agent/strategies/index.ts` 仍承载 `Strategy`、`SingleStrategy`、`FanOutStrategy`、`AdaptiveStrategy`、`StrategyRegistry`。

目标：

- `index.ts` 只能作为 barrel。
- 每个 policy / capability / strategy 独立成文件。
- Registry 独立成文件，只负责注册和实例化。

目标结构：

```text
lib/agent/policies/
  Policy.ts
  BudgetPolicy.ts
  SafetyPolicy.ts
  QualityGatePolicy.ts
  PolicyEngine.ts
  index.ts

lib/agent/capabilities/
  Capability.ts
  Conversation.ts
  CodeAnalysis.ts
  KnowledgeProduction.ts
  ScanProduction.ts
  SystemInteraction.ts
  EvolutionAnalysis.ts
  CapabilityRegistry.ts
  index.ts

lib/agent/strategies/
  Strategy.ts
  SingleStrategy.ts
  FanOutStrategy.ts
  AdaptiveStrategy.ts
  StrategyRegistry.ts
  PipelineStrategy.ts
  index.ts
```

验收：

- `rg "export class .*Policy|export class .*Strategy|export class .*Capability" lib/agent/*/index.ts` 不应再匹配真实实现。
- 现有 `../policies/index.js` / `../capabilities/index.js` / `../strategies/index.js` import 保持可用。
- `pnpm typecheck` 和策略/profile/runtime 回归通过。

### R2：Agent run helper 仍是扁平目录

现状：

- `lib/agent/runs/ScanAgentRun.ts`
- `lib/agent/runs/ScanRunProjection.ts`
- `lib/agent/runs/TranslationAgentRun.ts`
- `lib/agent/runs/RelationAgentRun.ts`
- `lib/agent/runs/EvolutionAgentRun.ts`

目标：

```text
lib/agent/runs/
  scan/
    ScanAgentRun.ts
    ScanRunProjection.ts
  translation/
    TranslationAgentRun.ts
  relation/
    RelationAgentRun.ts
  evolution/
    EvolutionAgentRun.ts
  index.ts
```

验收：

- `lib/agent/service/index.ts` 从 `../runs/index.js` 或具体子目录导出，不再直接依赖扁平 run 文件。
- 不保留旧 run re-export stub。

### R3：Profile definitions 仍混在 registry/presets 中

现状：

- `AgentProfileRegistry.ts` 中仍直接定义 profile 列表。
- `presets.ts` 仍承担 legacy preset 解析和 profile 组合入口。

目标：

```text
lib/agent/profiles/
  AgentProfileRegistry.ts
  AgentProfileCompiler.ts
  AgentStageFactoryRegistry.ts
  presets.ts
  definitions/
    chat.profile.ts
    scan.profile.ts
    translation.profile.ts
    signal.profile.ts
    relation.profile.ts
    evolution.profile.ts
    bootstrap.profile.ts
```

验收：

- Registry 只负责注册/查询，不承载大段 profile 数据。
- definitions 文件只导出数据，不依赖 runtime/container。

### R4：Bootstrap workflow 仍是扁平目录

现状：

- `lib/workflows/deprecated-cold-start` 已从 MCP pipeline 迁出，但 25 个文件仍平铺。
- 文件名职责清楚，但目录层级还没有表达 projection / input builder / consumer / checkpoint / incremental / config / briefing。

目标：

```text
lib/workflows/deprecated-cold-start/
  BootstrapWorkflow.ts
  agent-runs/
  projections/
  consumers/
  context/
  checkpoint/
  incremental/
  config/
  reports/
  delivery/
  mock/
```

验收：

- `BootstrapWorkflow.ts` 只导入子目录 public 文件。
- `checkpoint.ts`、`BootstrapSnapshot.ts`、`IncrementalBootstrap.ts`、`dimension-configs.ts`、`dimension-context.ts` 不再位于 bootstrap 根目录。
- 不恢复旧 `lib/external/mcp/handlers/bootstrap/pipeline`。

### R5：MCP bootstrap handler 仍不够薄

现状：

- `lib/external/mcp/handlers/bootstrap/MissionBriefingBuilder.ts` 仍是较重 briefing 构建逻辑。
- `lib/external/mcp/handlers/bootstrap/BootstrapSession.ts` 仍维护 session/completion 状态。
- `lib/external/mcp/handlers/bootstrap/shared/bootstrap-phases.ts` 仍承载较多 phase orchestration 和 CodeEntityGraph 副作用。

目标：

```text
lib/external/mcp/handlers/bootstrap/
  BootstrapMcpHandler.ts
  BootstrapMcpRequestMapper.ts
  BootstrapMcpResponsePresenter.ts
```

workflow 侧承接：

```text
lib/workflows/deprecated-cold-start/briefing/MissionBriefingBuilder.ts
lib/workflows/deprecated-cold-start/session/BootstrapSession.ts
lib/workflows/deprecated-cold-start/phases/BootstrapPhaseRunner.ts
```

验收：

- MCP handler 只做 request parse、service/container 获取、workflow 调用、response 映射。
- checkpoint、SessionStore、CodeEntityGraph、briefing build 不在 MCP handler 层实现。

### R6：`ChatAgentTasks` 仍留在 `domain`

现状：

- `lib/agent/domain/ChatAgentTasks.ts` 是 task helper/orchestration，不是纯 domain 对象。

目标：

- 若只服务 Agent run，迁到 `lib/agent/runs/chat/ChatAgentTasks.ts`。
- 若变成 HTTP/CLI 复用 workflow，迁到 `lib/workflows/chat/ChatAgentTasks.ts`。

验收：

- `lib/agent/domain` 只保留真正领域模型/评估/证据对象。

## 2. 实施顺序

1. R1：先拆 `policies` / `capabilities` / `strategies`，收益高且风险低。
2. R2：再拆 `runs` 子目录，更新 service barrel。
3. R3：拆 profile definitions，降低 registry 复杂度。
4. R4：整理 `lib/workflows/deprecated-cold-start` 子目录。
5. R5：瘦 MCP bootstrap handler，把 briefing/session/phases 迁到 workflow。
6. R6：最后处理 `ChatAgentTasks` 归属，避免与 profile/run 拆分互相打架。

## 3. 防回归约束

- `test/unit/AgentModuleBoundaries.test.ts` 已覆盖旧 stub/旧路径不可恢复。
- 后续每完成一个 R 阶段，都要补充边界测试或扩展现有测试。
- 每阶段至少跑 `pnpm typecheck` 和对应聚焦回归。
# Agent 模块目录重组剩余实现清单

> 本文档承接 `agent-module-directory-reorganization-plan.md`。主干迁移已经完成，但原设计中的若干“理想目标结构”仍未完全落地。这里把剩余项拆成可执行、可验收的实现批次，避免因为完成了大迁移就停止收敛。

## 当前差距

### R1：Agent 内部聚合文件仍未完全细拆

现状：

- `lib/agent/policies/index.ts` 仍承载 `Policy`、`BudgetPolicy`、`SafetyPolicy`、`QualityGatePolicy`、`PolicyEngine` 和工具函数。
- `lib/agent/strategies/index.ts` 仍承载 `Strategy`、`SingleStrategy`、`FanOutStrategy`、`AdaptiveStrategy`、`StrategyRegistry` 与相关类型。
- `lib/agent/capabilities/index.ts` 仍承载所有 Capability 实现与 registry。
- `lib/agent/runs` 是扁平文件，尚未按 `scan/translation/relation/evolution` 分组。
- `lib/agent/profiles` 尚未把 profile definitions 拆到 `profiles/definitions/*.profile.ts`。

目标：

- `index.ts` 只作为 public barrel，不承载真实实现。
- 每个策略、policy、capability 独立文件；共享类型放在 `types.ts` 或 `Policy.ts` / `Strategy.ts` / `Capability.ts`。
- run helper 可按任务域分组，但不为了移动而打断稳定调用方；先做低风险拆分。

验收：

- `lib/agent/policies/index.ts`、`lib/agent/strategies/index.ts`、`lib/agent/capabilities/index.ts` 不再包含 class 实现。
- 现有从 `../policies/index.js` / `../strategies/index.js` / `../capabilities/index.js` 的调用保持可用。
- `pnpm typecheck` 与策略/profile/runtime 相关测试通过。

## R2：Bootstrap workflow 目录仍是扁平结构

现状：

- `lib/workflows/deprecated-cold-start` 已承载真实 workflow，但 projection、consumer、checkpoint、incremental、config 等文件仍全部放在同一层。

目标：

- 按职责建立子目录：
  - `projections/`
  - `agent-runs/`
  - `consumers/`
  - `context/`
  - `checkpoint/`
  - `incremental/`
  - `config/`
  - `mock/`
- 可新增 `lib/workflows/deprecated-cold-start/index.ts` 作为 workflow public barrel，但禁止恢复旧 `external/mcp/.../pipeline` 路径。

验收：

- `BootstrapWorkflow.ts` 只从 workflow 内部职责目录导入 helper。
- 相关 bootstrap 单测全部改到新路径。
- `AgentModuleBoundaries.test.ts` 继续禁止旧 pipeline 路径恢复。

## R3：MCP bootstrap 外部入口仍偏厚

现状：

- `lib/external/mcp/handlers/bootstrap/MissionBriefingBuilder.ts` 仍在外部入口目录中构建较重 briefing。
- `lib/external/mcp/handlers/bootstrap/BootstrapSession.ts` 仍维护 session/submission/cache 状态。
- `lib/external/mcp/handlers/bootstrap/shared/bootstrap-phases.ts` 仍包含 AST/graph/incremental/phase 编排逻辑。

目标：

- 外部入口目录只保留协议入口、request mapper、response presenter、轻量 session adapter。
- 可迁移到：
  - `lib/workflows/deprecated-cold-start/briefing/MissionBriefingBuilder.ts`
  - `lib/workflows/deprecated-cold-start/session/BootstrapSession.ts`
  - `lib/workflows/deprecated-cold-start/phases/BootstrapPhaseRunner.ts`
- MCP handler 只做参数解析、container/service 获取、workflow 调用、response envelope。

验收：

- `lib/external/mcp/handlers/bootstrap` 不直接维护 bootstrap 业务状态。
- `SessionStore`、checkpoint、incremental、CodeEntityGraph 写入等业务逻辑只在 workflow 或 service 层。
- MCP handler 回归通过。

## R4：Agent domain 中仍有 task orchestration 候选

现状：

- `lib/agent/domain/ChatAgentTasks.ts` 仍留在 domain。原文档指出如果它是 task orchestration，应迁到 workflow 或 run helper。

目标：

- 分析 `ChatAgentTasks.ts` 是否纯 domain helper。
- 若包含 task orchestration，则迁入 `lib/agent/runs/chat/` 或 `lib/workflows/chat/`。

验收：

- `lib/agent/domain` 只保留真正领域对象/规则，不承载 run/workflow 编排。

## 实现顺序

1. [x] R1.1 拆 `lib/agent/policies/index.ts`。
2. [x] R1.2 拆 `lib/agent/strategies/index.ts`。
3. [x] R1.3 拆 `lib/agent/capabilities/index.ts`。
4. [ ] R1.4 评估并拆分 `runs/` 与 `profiles/definitions/`。
5. [ ] R2.1 将 bootstrap projection/input builder/consumer 迁入 workflow 子目录。
6. [ ] R2.2 将 checkpoint/incremental/config/context/mock 迁入 workflow 子目录。
7. [ ] R3.1 迁移 `MissionBriefingBuilder.ts` 到 workflow briefing。
8. [ ] R3.2 迁移 `BootstrapSession.ts` 到 workflow session 或拆成协议 session adapter + workflow state。
9. [ ] R3.3 拆 `shared/bootstrap-phases.ts`。
10. [ ] R4.1 评估并迁移 `ChatAgentTasks.ts`。

## 本轮执行记录

### R1 已完成

- `lib/agent/policies/index.ts` 已收缩为 barrel。
- 新增 `Policy.ts`、`BudgetPolicy.ts`、`SafetyPolicy.ts`、`QualityGatePolicy.ts`、`PolicyEngine.ts`。
- `lib/agent/strategies/index.ts` 已收缩为 barrel。
- 新增 `Strategy.ts`、`SingleStrategy.ts`、`FanOutStrategy.ts`、`AdaptiveStrategy.ts`、`StrategyRegistry.ts`。
- `PipelineStrategy.ts` 已改为直接依赖 `Strategy.ts` 与 `StrategyRegistry.ts`，不再通过 strategy barrel 形成隐式循环。
- `lib/agent/capabilities/index.ts` 已收缩为 barrel。
- 新增 `Capability.ts`、`Conversation.ts`、`CodeAnalysis.ts`、`KnowledgeProduction.ts`、`ScanProduction.ts`、`SystemInteraction.ts`、`EvolutionAnalysis.ts`、`CapabilityRegistry.ts`。

验证：

- `pnpm typecheck` 通过。
- `pnpm vitest run test/integration/StrategyPolicy.test.ts test/unit/AgentProfileCompiler.test.ts test/unit/AgentRuntime.test.ts test/unit/CapabilityCatalog.test.ts test/unit/ToolRouterGovernance.test.ts test/unit/AgentModuleBoundaries.test.ts` 通过：6 个测试文件，95 个测试。
- 相关 lints 无错误。

下一步：

- 优先执行 R2：拆 `lib/agent/runs` 为按 task 域分组的子目录。
- 然后执行 R3：拆 `profiles/definitions/*.profile.ts`，让 registry 不再承载大段 profile 数据。
