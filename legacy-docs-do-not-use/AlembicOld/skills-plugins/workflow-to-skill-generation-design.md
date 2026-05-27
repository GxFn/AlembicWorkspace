# 从开发流程到 Skill 的自动沉淀方案

本文档描述一个新的 Alembic 能力方向：当用户在真实开发过程中形成了有价值、可复用的工作流时，Alembic 能否分析这些流程，抽象成可被 Agent 调用的 Skill，并以草稿、候选或可安装包的形式交给用户确认。

结论：可以，而且这很符合 Alembic 的定位。Alembic 已经具备 Recipe、Skill、Memory、Guard、Signal、Agent 分析和候选生成等基础能力。下一步可以把这些能力串起来，从“识别代码知识”扩展到“识别开发流程知识”。

## 目标

目标不是自动把每段聊天都变成 Skill，而是捕捉那些在开发中已经被证明有效的流程方式：

- 用户反复用同一种方式排查长链路问题。
- Agent 和用户通过多轮互动形成了稳定节点推进协议。
- 某次复杂修复产生了清晰的计划、证据、命令、补丁和重验结果。
- 某类任务总是需要相同的输入、权限、检查项和安全边界。
- 团队希望以后可以点名调用这个流程，而不是每次重新解释。

这些流程不适合沉淀成 Recipe。Recipe 更像代码模式、规则、事实和项目标准；Skill 更适合沉淀多步骤、带交互、带工具使用和带产物的工作流。

## 核心产品形态

建议把这个能力命名为 `Workflow Skill Forge` 或 `Skill Forge`。它由三种使用模式组成。

### 模式一：显式沉淀

用户在一次开发会话后说：

```text
把这次流程沉淀成一个 Skill
```

Alembic 分析本轮会话、修改记录、命令、测试结果和产物，生成 Skill 草稿，并让用户确认是否保存。

这是第一优先级模式，风险最低，用户意图最明确。

### 模式二：推荐沉淀

Alembic 观察到某类流程反复出现，例如连续多次长链路验证、固定发布检查、固定迁移验证，于是提示：

```text
发现一个可复用流程：progressive-chain-validation。
建议生成 Skill 草稿，用于以后按节点推进长链路验证。
```

用户可以忽略、查看草稿、编辑或批准。

### 模式三：从计划产物生成

当某个通用工作流已经产出 `plan.md`、`rounds/`、`evidence/`、`final-report.md` 等文件时，Alembic 可以直接从这些产物生成 Skill。

例如 `docs/progressive-chain-validation-skill-design.md` 描述的长链路渐进验证流程，执行几轮后会留下稳定模板。Skill Forge 可以把这些模板、步骤和安全边界组合成一个 `SKILL.md` 包。

## 什么值得生成 Skill

Alembic 不应该把所有经验都升格成 Skill。建议使用以下判定标准。

### 正向信号

- 流程包含三个以上稳定步骤。
- 流程需要特定输入契约，例如项目路径、权限、配置、测试数据。
- 流程有明确阶段边界和可验证产物。
- 流程在一次或多次真实任务中成功降低风险或提高效率。
- 流程可跨任务复用，而不是只服务一个一次性 bug。
- 流程有安全边界，例如禁止生产数据、必须 sandbox、必须用户确认。
- 用户显式表达“以后都这样做”“这个流程很有用”“沉淀下来”。

### 反向信号

- 只是单个命令、单个修复或单文件操作。
- 依赖某个一次性环境、临时凭证或不可复现数据。
- 只是一段项目事实，更适合 Recipe 或文档。
- 没有可验证结果，只有主观经验。
- 包含敏感数据、私有 token、生产账号或不可公开路径。
- 需要默认执行高风险写入或破坏性命令。

## 与现有 Alembic 能力的关系

Alembic 当前已经有若干可复用基础。

### SkillAdvisor

`lib/service/skills/SkillAdvisor.ts` 已经能基于 Guard 违规、Memory 偏好、Recipe 分布、候选积压等信号推荐 Skill。它的定位偏规则和使用模式分析，适合回答“项目可能缺什么 Skill”。

Workflow Skill Forge 可以复用它的推荐框架，但信号源要扩展到工作流事件：计划、命令、测试、补丁、节点证据、用户确认和最终报告。

### WorkflowSkillCompletionCapability

`lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts` 已经有从分析文本生成 Skill 内容并写入项目 Skill 的能力。它可以作为后端写入器和质量校验器。

需要补强的地方是：当前输入偏单段 analysis text；Workflow Skill Forge 需要输入结构化 episode，包括步骤、证据、权限、模板、失败处理和触发语。

### SignalBus 与 HitRecorder

技术参考中已经把 SignalBus 描述为统一信号循环。Workflow Skill Forge 可以新增或复用信号类型：

- `workflow_episode`
- `workflow_step`
- `workflow_success`
- `workflow_retry`
- `workflow_user_confirmation`
- `skill_candidate_generated`
- `skill_candidate_accepted`
- `skill_invocation_success`

这些信号用于判断某个流程是否真的值得沉淀，而不是只靠一次聊天热度。

### Recipe / Skill 边界

Recipe 记录“项目如何写代码”；Skill 记录“Agent 如何完成一种任务”。

举例：

- “Swift 网络层使用 NWPathMonitor”适合 Recipe。
- “验证一次增量扫描长链路时如何拆节点、造证据、重验”适合 Skill。
- “本项目禁用某个 API”适合 rule Recipe，也可被 Skill 引用。
- “发布前如何跑 smoke test、检查 report、生成交接摘要”适合 Skill。

Skill 可以引用 Recipe，但不应该复制大量 Recipe 正文。Agent 执行 Skill 时可以按需调用 Alembic 搜索 Recipe。

## 推荐架构

```text
Agent Session / CLI / Dashboard / Test Runs
        ↓
Workflow Signal Collector
        ↓
Workflow Episode Store
        ↓
Workflow Skill Miner
        ↓
Skill Candidate Draft
        ↓
Quality / Safety Validator
        ↓
User Review / Dashboard Approval
        ↓
Project Skill Package
```

### Workflow Signal Collector

负责采集开发过程中的低层事件。采集必须是可配置、可关闭、可审计的。

可采集信号包括：

- 用户显式目标和约束。
- Agent 生成的计划。
- 执行过的关键命令及摘要结果。
- 测试运行结果。
- 文件修改摘要。
- 节点 evidence。
- 用户确认、拒绝或纠正。
- 最终报告和残留风险。

默认不采集完整聊天全文、完整文件内容、完整 prompt、完整 tool result。需要 heavy 级证据时必须显式开启并截断。

### Workflow Episode Store

把一次有边界的工作流记录成 episode。

建议数据结构：

```ts
interface WorkflowEpisode {
  id: string;
  projectRoot: string;
  startedAt: string;
  endedAt?: string;
  objective: string;
  workflowType: string;
  permissionLevel: 'observe' | 'test-write' | 'code-fix' | 'sandbox-run';
  artifactRoot?: string;
  steps: WorkflowStep[];
  outcomes: WorkflowOutcome[];
  userSignals: WorkflowUserSignal[];
  sourceRefs: string[];
  safetyNotes: string[];
}
```

`WorkflowStep` 需要记录节点名称、输入、命令摘要、证据路径、是否通过、失败分类和重验结果。

### Workflow Skill Miner

负责判断 episode 是否值得沉淀成 Skill。

它可以使用两类策略：

- 规则策略：步骤数量、重跑次数、成功结果、用户正向反馈、重复出现频次。
- AI 策略：让模型从 episode 摘要中判断是否存在可复用 workflow，并提取触发语、输入契约、步骤、验证标准和安全边界。

第一阶段建议规则优先、AI 辅助。不要让模型直接自动创建 Skill；先生成候选草稿。

### Skill Candidate Draft

Skill 候选不是最终 `SKILL.md`，而是一个可审阅中间态。

建议结构：

```ts
interface WorkflowSkillCandidate {
  id: string;
  name: string;
  description: string;
  rationale: string;
  triggerExamples: string[];
  sourceEpisodeIds: string[];
  inputs: SkillInputSpec[];
  permissions: SkillPermissionSpec;
  workflowSteps: SkillWorkflowStep[];
  artifacts: SkillArtifactSpec[];
  safetyRules: string[];
  draftSkillMarkdown: string;
  confidence: number;
  status: 'draft' | 'needs_review' | 'approved' | 'rejected' | 'installed';
}
```

这样 Dashboard 可以展示“为什么建议创建这个 Skill”，用户也可以编辑 name、description、步骤和安全规则。

### Quality / Safety Validator

生成 Skill 前必须做质量和安全校验。

建议校验项：

- `name` 是 kebab-case，且不覆盖内置 Skill。
- `description` 包含可触发关键词，避免过泛。
- `SKILL.md` 有清晰的 When to Use / Inputs / Workflow / Safety / Artifacts。
- 不包含 token、密码、私有 API key、生产账号。
- 不包含只适用于单台机器的绝对路径，除非标记为示例。
- 不默认执行破坏性命令。
- 不把用户项目私有代码正文复制进 Skill。
- 不把一次性 bug 伪装成通用流程。
- 如果 Skill 会修改文件，必须包含确认和回滚策略。

### User Review / Approval

Skill Forge 的默认行为应该是生成草稿，不自动启用。

用户确认方式可以包括：

- Dashboard 候选列表。
- CLI `skill suggestions` / `skill approve`。
- Agent 对话中展示草稿并请求确认。

批准后再写入项目 Skill 目录，例如 `skills/<name>/SKILL.md` 或目标 IDE 支持的 `.github/skills/<name>/SKILL.md`。

## 生成出的 Skill 应该长什么样

一个从开发流程中生成的 Skill 包至少包含：

```text
<skill-name>/
  SKILL.md
  templates/
    plan.md
    round.md
    final-report.md
  references/
    source-episodes.md
```

`SKILL.md` 应包含：

- 何时使用。
- 需要用户提供什么输入。
- 权限档位和禁止事项。
- 标准步骤。
- Agent 应如何生成计划。
- Agent 应如何验证每一步。
- 失败时先补观测再修复的原则。
- 应产生哪些文件。
- 何时必须停下来问用户。

`references/source-episodes.md` 不应复制敏感日志，只记录：这个 Skill 来自哪些成功 episode、抽象出了哪些稳定模式、哪些细节被刻意泛化。

## 用户交互设计

### 显式生成

用户说：

```text
把这次调试流程生成一个 Skill
```

Agent 应执行：

1. 汇总本次 episode。
2. 判断更适合文档、Recipe 还是 Skill。
3. 生成 Skill 候选草稿。
4. 展示 name、description、触发场景、步骤和安全规则。
5. 询问用户是否保存。
6. 保存后提示如何调用。

### 推荐生成

Alembic 可以提示：

```text
最近 3 次任务都使用了类似的“节点化长链路验证”流程。
是否生成一个 progressive-chain-validation Skill 草稿？
```

提示必须克制。默认不应该在每次会话结束都打扰用户。

### 编辑和拒绝

用户可以：

- 修改 Skill 名称。
- 修改触发描述。
- 删除过度具体的步骤。
- 降低权限要求。
- 拒绝并记录原因。

拒绝原因本身也是信号，用于避免后续重复推荐。

## 和通用长链路验证 Skill 的关系

`docs/progressive-chain-validation-skill-design.md` 描述的是一个通用长链路验证 Skill。

Workflow Skill Forge 则是更上层的“Skill 生成能力”。两者关系如下：

- Progressive Chain Validation 是一个可被生成或手写的 Skill。
- Workflow Skill Forge 可以从多次渐进验证 episode 中自动生成或优化它。
- 渐进验证 Skill 执行时产生的 `plan.md`、`rounds/`、`evidence/`、`final-report.md`，正好是 Skill Forge 的高质量输入。

因此，长链路验证不仅是一个 Skill，也是产生更多 Skill 的方法。

## 与 Alembic 冷启动和增量扫描的结合

以当前冷启动和增量扫描长链路为例，Alembic 可以这样使用 Skill Forge：

1. 用户使用 progressive-chain-validation 验证 `rescan`。
2. Agent 生成计划并逐节点推进 N0 到 N14。
3. 每个节点留下 round 记录、evidence、命令和修复摘要。
4. 多次执行后，Skill Forge 发现这个流程稳定且复用价值高。
5. Alembic 生成一个 `alembic-bootstrap-rescan-chain-test` Skill 草稿。
6. 草稿引用正式文档，不复制完整节点细节。
7. 用户确认后，Skill 进入项目 skills 目录。

这条路径说明：先有真实开发流程，再有通用 Skill，再有项目专用 Skill。不是一次性手写所有规则。

## MVP 设计

第一版不要做全自动。推荐按下面顺序实现。

### Milestone 1：显式 episode 到 Skill 草稿

能力：用户明确要求“把这次流程沉淀成 Skill”。

实现：

- 从当前 artifact 目录读取 `plan.md`、`rounds/`、`final-report.md`。
- 生成 `WorkflowSkillCandidate`。
- 调用现有 Skill 写入能力创建草稿目录。
- 不自动启用，不覆盖已有 Skill。

验收：

- 能从一次 progressive-chain-validation 运行产物生成 `SKILL.md` 草稿。
- 草稿包含输入契约、步骤、验证、产物和安全边界。
- 不包含敏感信息和绝对私有路径。

### Milestone 2：推荐器接入 SkillAdvisor

能力：基于多次 episode 推荐 Skill。

实现：

- 为 SkillAdvisor 增加 workflow episode 分析维度。
- 统计重复 workflowType、成功率、用户确认次数和复用价值。
- 输出候选 name、description、rationale、priority 和 signals。

验收：

- 多次相似流程后出现推荐。
- 一次性任务不会推荐。
- 用户拒绝后短期内不重复推荐。

### Milestone 3：Dashboard 审阅

能力：在 Dashboard 查看、编辑、批准 Skill 候选。

实现：

- Skill candidate 列表。
- Diff 视图展示将写入的 `SKILL.md`。
- 安全校验结果展示。
- Approve / Reject / Edit 操作。

验收：

- 用户可以在写入前看到完整内容。
- 拒绝原因被记录为信号。
- 批准后可在 IDE 中调用。

### Milestone 4：使用效果回流

能力：Skill 被调用后，Alembic 记录是否成功，并用结果优化 Skill。

实现：

- 记录 skill invocation、完成状态、用户满意度、失败节点。
- 当 Skill 多次失败在同一步，建议更新 Skill。
- 当 Skill 长期不用，建议归档或降低优先级。

验收：

- Skill 不只是生成后静态存在，而是能进化。
- 失败反馈不会自动改 Skill，仍需用户批准。

## 数据与隐私边界

这是这个能力最容易出问题的地方。必须默认保守。

原则：

- 默认只保存摘要，不保存完整聊天全文。
- 默认只保存路径和摘要，不保存完整源代码。
- 默认不保存环境变量值。
- 任何包含 token、password、secret、key 的内容必须脱敏。
- 用户可以关闭 workflow episode 记录。
- 用户可以删除某个 episode 及其派生候选。
- 生成 Skill 前必须展示将写入内容。

对于企业或团队场景，还需要支持：

- 项目级开关。
- 只本地存储，不上传。
- 候选审批。
- 审计日志。
- 数据保留周期。

## 风险

### 风险：把偶然流程固化成规则

缓解：至少要求明确用户意图或多次成功信号；Skill 候选必须标注 confidence 和来源。

### 风险：Skill 过度具体，无法复用

缓解：生成时把绝对路径、具体项目名、临时数据替换成输入参数或示例。

### 风险：泄露敏感信息

缓解：默认摘要化、脱敏扫描、用户审批、禁止复制完整日志和凭证。

### 风险：Skill 与 Recipe 边界混乱

缓解：生成前先分类。如果是代码模式，走 Recipe；如果是多步骤 Agent 工作流，走 Skill；如果是长期设计判断，走 docs。

### 风险：生成太多低质量 Skill

缓解：推荐阈值、去重、拒绝冷却、使用效果回流、定期归档。

## 成功标准

这个能力成立时，应满足以下标准：

- 用户可以显式把一次成功开发流程转成 Skill 草稿。
- Alembic 能解释为什么这个流程适合 Skill，而不是 Recipe 或文档。
- 生成的 Skill 包含触发场景、输入契约、步骤、验证标准、产物和安全边界。
- Skill 草稿不包含敏感信息、临时路径和不可复现假设。
- 多次类似流程后，Alembic 能主动推荐 Skill，但不会频繁打扰。
- 用户批准后，Skill 能安装到项目并被 Agent 调用。
- Skill 调用后的成功或失败能回流，帮助后续优化。

最终目标是让 Alembic 不只管理“代码知识”，也能管理“开发方法知识”：当用户和 Agent 一起摸索出一套好用的流程，Alembic 能把它保存成下一次可以直接调用的能力。