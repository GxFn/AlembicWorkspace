# 冷启动 Project Skill 交付给 Codex 设计草案

状态：已提升为当前主线，进入 Wave 1 Phase 1
维护窗口：AlembicWorkspace
创建时间：2026-05-23 21:41 CST
对应 TODO：`GTODO-2026-05-23-026`

## 用户目标

冷启动 / bootstrap 生成 project skills 后，Codex 应该立刻知道“本项目有哪些可用 skill 资产、它们为什么生成、什么时候该用、如何检查来源”。Codex 面向开发者的呐喊应该是可读的知识摘要，而不是把文件路径或内部验证命令堆出来。

用户进一步确认：`alembic_skill` 的逻辑比较落后；如果有更好的交付方案，可以删除或替换旧 `alembic_skill` 能力，不必为了兼容旧入口牺牲新设计。

用户 2026-05-24 进一步澄清：这里的 skill 是产生 Recipe 的另一种交付物，不是外部附加物。它从同一批代码知识中挑选出符合 Codex / Agent skill 定义的内容进行交付。产出路线至少有两条：`Alembic` 冷启动产出，以及 `AlembicPlugin` 自己的冷启动产出。

用户 2026-05-24 再次澄清：主要逻辑代码已经存在，本需求重点不是重做 skill 生成逻辑，而是补齐“生成后的 skill 如何交付给 Codex”的逻辑。双链路需要分别讲清 producer route 和 delivery surface，避免把“已生成 project skill”“已通过 prime 交付给 Codex”“已安装为 Codex runtime skill”混成一件事。

用户 2026-05-24 接受前述下沉方案：`ProjectSkillDeliveryReceipt` 作为共享交付 contract 下沉到 `AlembicCore`；`Alembic` 和 `AlembicPlugin` 分别按各自冷启动路线产出 receipt；`AlembicPlugin` 作为 Codex host agent 入口负责消费 receipt，并在 prime / bootstrap 时把 skill 交付结果喊给 Codex 和开发者。

用户 2026-05-24 进一步确认：runtime export 应进入第一版目标。期望效果是 Codex 能直接使用项目内 skill；如果只做 receipt 降级交付而不进入 Codex runtime skill 发现机制，实际很可能不会被持续使用。

用户 2026-05-24 确认第一版策略：

- 用户允许方式按项目级授权模型执行：第一次给某个 `projectScopeId + codexSkillRoot` export 时需要用户允许；允许后可记录“本项目后续自动允许”。
- 冲突策略：skill 需要有自动生成标记。由 Alembic / Plugin 自动生成的 skill，后续允许自动更新覆盖；非自动生成或来源不明的已有 skill 默认不覆盖，必须等待用户确认。
- 跨多文件夹项目策略先列为 TODO，等真正支持多项目 / 多 root 时一起考虑，不进入第一版完成门禁。
- Ghost 模式反转为默认模式：Alembic-managed project skill store 默认位于 Ghost data root；standard/project `.alembic` 模式作为兼容路径，未来可能逐步弃用。
- `.agents/skills` 下的生成 symlink 默认不提交 git，作为本机项目级 runtime 产物；可通过本地 exclude 避免污染 `git status`。
- 授权记录保存在 Alembic / Plugin 的 project runtime metadata，不写用户全局配置，也不写项目源码文件。
- export 后刷新方式由 receipt 的 `refreshRequired` 和 `AlembicTest` 真实验证收口。

## 最终目标

让冷启动产出的 project skills 成为 Codex 可明确接收、可声明、可追证、可使用的知识交付物。

具体来说：`Recipe` 和 `Project Skill` 都来自同一批真实代码知识。`Recipe` 是 Alembic 知识库中的结构化知识交付；`Project Skill` 是从代码知识中筛选出符合 Codex / Agent skill 定义的另一种交付物。本需求不重写已有 skill 生成主逻辑，而是补齐交付层：

- `Alembic` 冷启动产出的 skill，通过统一 receipt 交付给 Codex。
- `AlembicPlugin` 自己的冷启动产出的 skill，也通过同一 receipt contract 交付给 Codex。
- Codex 在 prime / bootstrap 拿到 receipt 后，立即面向开发者喊出“我接收到了哪些 project skills、它们让我知道什么、什么时候该用”。
- 默认呐喊只展示开发者一眼能看懂的知识摘要；证据路径、行号、asset ref 和生成来源保留在 receipt 中，按需追证。
- 第一版必须完成项目级 runtime export，让 project skill 被 Codex 当前项目 runtime skill 发现机制直接使用；receipt 继续负责交付回执、呐喊、来源和证据追踪。runtime export 必须项目级隔离，不默认写入用户全局 `$HOME/.agents/skills`。

完成标准：

- `AlembicCore` 有统一 `ProjectSkillDeliveryReceipt` contract、producer route、knowledge basis、installation status、evidence refs 和 validator / normalizer。
- `Alembic` 冷启动 / rescan / dimension completion 在已有 skill 生成链路后产出 receipt，并替换旧 `alembic_skill(load)` 验证提示。
- `AlembicPlugin` cold-start / recoverable host-agent job 能按同一 contract 产出 Plugin route receipt。
- `AlembicPlugin` prime / bootstrap 能消费 Alembic route 和 Plugin route receipt，并让 Codex 在接收阶段完成摘要呐喊。
- `AlembicPlugin` 能在用户项目级授权后，把当前项目 scope 下的 project skills materialize / export 到 Codex 项目级 runtime skill 发现位置，使 Codex 后续可通过 skill 机制直接使用。
- Codex-facing 能力不再误导开发者把未 export 的 project skill asset 当成已安装 Codex runtime skill；已 export 时 receipt 必须明确 runtime installation status 和项目级位置。
- 旧 `alembic_skill` 管理入口被删除、替换或明确降级为非默认只读路径。
- `AlembicTest` 在真实项目里验证至少一条 Alembic route 和一条 Plugin route：Codex 能喊出摘要，receipt 可追证，项目级 runtime skill 可被 Codex 发现和使用，且不会污染其它项目或用户全局 skill。
- 自动生成 skill 带有稳定标记；自动生成项可安全覆盖更新，非自动生成项不会被覆盖。

## 关键区分

- `Recipe`：Alembic 知识库中的结构化项目知识，偏向规则、模式、事实、Guard 约束和可检索证据，是长期知识源。
- `Alembic Project Skill`：冷启动生成的项目知识资产，当前写在 Alembic knowledge path 下，可被 Alembic / Plugin 查询，但不等于 Codex runtime 已安装 skill。
- `Plugin Project Skill`：`AlembicPlugin` 在没有本地 Alembic resident 增强，或需要围绕 Codex host agent 自洽闭环时，通过 Plugin 冷启动产出的项目 skill 资产。它仍应来自真实代码知识和证据，不应伪装成 Alembic resident 产物。
- `Codex Runtime Skill`：Codex 按官方 skill 发现机制加载的 skill，例如 repo `.agents/skills`、用户 `$HOME/.agents/skills`、admin/system 目录或 Codex plugin manifest 中声明的 `skills`。
- `Skill Delivery Receipt`：Alembic 生成给 Codex 的交付凭证。它说明生成了哪些 project skills、为什么生成、证据在哪里、是否已安装为 Codex runtime skill、下一步如何使用或导出。

第一版目标不是只把 project skills 作为可信知识资产清楚交付给 Codex，而是同时完成项目级 runtime export：Codex 既能在 prime / bootstrap 时喊出 receipt 摘要，也能在当前项目后续任务中按 Codex skill 机制直接使用这些 project skills。

因此，本需求的核心是建立从代码知识到 `Recipe` / `Project Skill` 两类交付物的共同语义，并完成两步交付：先让 Codex 清楚喊出本次接收到了哪些 skill 交付物，再把这些 project skills 项目级 export 到 Codex runtime skill 发现路径，保证后续真实可用。

## 真实代码事实

### 当前生成链路

- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts:728` 到 `BootstrapConsumers.ts:816` 会遍历 skill-worthy dimensions，调用 `generateSkill`，并把成功项写入 `skillResults.skills`。
- `Alembic/lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts:140` 到 `WorkflowSkillCompletionCapability.ts:142` 使用 `getProjectSkillsDir` 得到 project skill 目录，并拼出 `SKILL.md`。
- `WorkflowSkillCompletionCapability.ts:168` 到 `WorkflowSkillCompletionCapability.ts:176` 写入 `SKILL.md`。
- `WorkflowSkillCompletionCapability.ts:192` 到 `WorkflowSkillCompletionCapability.ts:200` 返回的 hint 仍是 `Use alembic_skill({ operation: "load" }) to verify content`，这说明当前交付口径还停留在“生成后让 Agent 手动 load 验证”。
- `AlembicCore/src/infrastructure/config/Paths.ts:116` 到 `Paths.ts:121` 把 project skills 定义为 `knowledgePath/skills`，注释说明它跟随项目知识库走。

### 当前读取 / 管理入口

- `Alembic/lib/tools/adapters/SkillAdapter.ts:210` 到 `SkillAdapter.ts:222` 会合并 builtin skills 与 project skills，project skill 可覆盖同名 builtin。
- `Alembic/lib/tools/adapters/SkillAdapter.ts:345` 到 `SkillAdapter.ts:348` 用 `dataRoot || runtime.dataRoot || projectRoot` 定位 project skills。
- `Alembic/lib/resident/tool-handlers/consolidated.ts:175` 到 `consolidated.ts:214` 暴露 `alembic_skill`，操作包含 `list/load/create/update/delete`。
- `AlembicPlugin/lib/external/mcp/tools.ts:161` 把 `alembic_skill` 标为 `localWriteTool('Manage Alembic Skills')`。
- `AlembicPlugin/lib/external/mcp/McpServer.ts:569` 把 `alembic_skill` 路由到 consolidated skill handler。
- `AlembicPlugin/lib/external/mcp/handlers/skill.ts:90` 到 `skill.ts:141` 列出 builtin 与 project skills，但 hint 仍写成旧 `load_skill` 风格。
- `AlembicPlugin/lib/external/mcp/handlers/skill.ts:165` 到 `skill.ts:226` 读取完整 skill content，并返回 `source`、`content`、`createdBy`、`createdAt` 等字段。

### Codex 固定 skill 交付面

- `AlembicPlugin/plugins/alembic-codex/.codex-plugin/plugin.json:25` 通过 `"skills": "./skills/"` 声明插件自带 runtime skills。
- OpenAI Codex Skills 官方文档说明：skill 是包含 `SKILL.md` 的目录；Codex 会从 repo `.agents/skills`、用户 `$HOME/.agents/skills`、admin/system 目录和插件等位置发现 skills；插件是分发 reusable skills / app integrations 的安装单元。也就是说，当前 Alembic `knowledgePath/skills` 生成物天然不是 Codex runtime skill，除非经过明确 export / sync。

## 双产出路线与双交付面

### 外部调研校准

OpenAI Codex Skills 官方文档当前说明：

- skill 是带 `SKILL.md` 的目录，`SKILL.md` 需要 `name` 和 `description`，可附带脚本、引用资料和资产。
- Codex 使用 progressive disclosure：初始上下文只放 skill name、description、file path，只有决定使用某个 skill 时才读取完整 `SKILL.md`。
- Codex 可以通过显式调用或根据 `description` 隐式选择 skill；因此 description 是 runtime 触发边界，不是 Alembic project skill receipt 的替代品。
- Codex 会从 repo `.agents/skills`、用户 `$HOME/.agents/skills`、admin/system 等位置发现 skills。
- plugin 是可安装分发单元，可以 bundle skills、apps 和 MCP servers；plugin manifest 可声明 `"skills": "./skills/"`。

设计含义：

- Alembic / Plugin 冷启动写出的 project skill asset 不会天然进入 Codex runtime skill list。
- 第一版必须同时完成两件事：通过 `prime` / `bootstrap` receipt 把 skill 作为知识交付给 Codex，让 Codex 马上喊出“我接收到了什么”；再把 project skill 项目级 export 到 Codex 当前项目可发现的 runtime skill 路径，让 Codex 后续能直接使用。
- 写到 Codex 官方发现位置或插件包路径后，才可称为 runtime skill；第一版默认只做 project-scoped export，不写用户全局 skills。

### Route A：Alembic cold-start producer

`Alembic` resident / CLI 冷启动拥有本地增强底座能力，可以围绕项目知识库、Recipe 生成、向量 / hybrid 检索、JobStore、Dashboard 和长期知识治理产出 canonical project knowledge。

这条路线的 skill 应该被视为 Alembic project knowledge asset 的派生产物：

- 输入：冷启动 / 增量扫描得到的真实代码事实、Recipe 候选、证据 refs、维度分析和知识治理结果。
- 输出：Recipe + Project Skill + Skill Delivery Receipt。
- 归属：Alembic 知识库与 resident service。
- Codex 消费：Plugin 通过 prime / bootstrap / resident service 接收 receipt，再由 Codex 喊出摘要。

### Route B：AlembicPlugin cold-start producer

`AlembicPlugin` 需要保持围绕 Codex host agent 的自洽闭环。当本地 Alembic 不存在，或需要 Plugin 自己完成 recoverable host-agent cold-start job 时，Plugin 也可以产出 project skill 资产。

这条路线的 skill 不应被说成 Alembic resident 增强产物，也不应要求 Plugin 控制项目；它是 Plugin 在当前 Codex host agent 上下文中，从可读代码和 host-agent 执行结果中提炼出的 Plugin project skill deliverable。

- 输入：Codex host agent 可读取的真实代码事实、host-agent bootstrap/rescan 过程、Plugin 自己的 recoverable job 状态和证据 refs。
- 输出：Plugin Project Skill + Skill Delivery Receipt。
- 归属：AlembicPlugin embedded capability。
- Codex 消费：Plugin 在 prime / bootstrap 返回中直接交付 receipt，并由 Codex 喊出摘要。

两条路线都必须满足相同交付语义：skill 是从真实代码知识中筛选出来、符合 skill 定义的交付物；receipt 必须标明 producer、证据和 runtime installation status，避免 Codex 或开发者误判来源。

### Delivery Surface 1：prime / bootstrap receipt

这是第一版的接收 / 呐喊交付面。它解决 Codex 和开发者“知道已经收到哪些 skill”的问题，但不能替代 runtime export。`Alembic` 或 `AlembicPlugin` 生成 project skill asset 后，把 `ProjectSkillDeliveryReceipt` 放进 prime / bootstrap 可见结果中；Codex 接收后立即面向开发者喊出摘要，并在同一闭环内继续完成项目级 runtime export。

这条链路解决的是“Codex 知道了哪些 skill 交付物，并让开发者知道 Codex 已经知道”。

### Delivery Surface 2：Codex project runtime skill export

这是第一版真实可用交付面。用户期望 Codex 能直接使用项目内 skill，因此 project skill 必须进入 Codex 当前项目可发现的 runtime skill 路径。

隔离原则：

- 默认只做 project-scoped export，不写用户全局 `$HOME/.agents/skills`。
- export 目标不能简单等同于单个文件夹；它应由 `projectScopeId` 绑定到当前 Codex 可见的 skill roots。
- 当前最小实现优先在当前 Codex workspace / repo 的 `.agents/skills/<skill-name>` 创建指向 Alembic-managed project skill store 的 symlink，让项目目录只暴露一个轻量入口。
- 第一版只支持当前 Codex 窗口识别到的单一 `codexSkillRoot`；多文件夹项目 / 多 root 绑定作为 TODO，等真正支持多项目时结合 ProjectRegistry 一起设计。
- Codex 官方文档允许扫描 symlinked skill folders；因此第一版默认策略改为 `symlink-first`。只有在目标文件系统、权限、Codex 扫描或测试证明 symlink 不可用时，才 fallback 为项目级副本，并在 receipt 中标明 fallback reason。
- symlink 的默认 canonical target 是 Ghost data root 中的 Alembic-managed project skill store；standard/project `.alembic` data root 仅作为兼容路径。
- `.agents/skills` 下自动生成的 symlink 默认不进入 git 提交范围；Plugin / Alembic 应尽量通过本地 exclude 或文档提示避免污染项目源码状态。
- receipt 必须记录 `runtimeInstallation.status`、`targetKind`、`targetPath`、`projectScopeId`、冲突处理和刷新提示。

授权与冲突策略：

- 第一次对某个 `projectScopeId + codexSkillRoot` 做 runtime export 前，需要用户允许。
- 用户可授权“仅本次允许”或“本项目后续自动允许”；授权状态必须绑定 project scope 和 skill root，不得扩散到用户全局。
- 授权状态保存到 Alembic / Plugin project runtime metadata；不写用户全局配置，不写项目源码文件。
- 自动生成 skill 必须带稳定标记，例如 frontmatter / sidecar metadata 中记录 `managedBy: alembic`、`projectScopeId`、`sourceRoute`、`generatedSkillId`、`generationHash`。
- 如果目标 `.agents/skills/<skill-name>` 已存在且带有 Alembic / Plugin 自动生成标记，允许自动更新覆盖 symlink 指向或 Alembic-managed source 内容。
- 如果目标已存在但没有自动生成标记，或标记不匹配当前 project scope，不覆盖，进入 conflict 状态并等待用户确认。

这一步不再是后续可选增强，而是第一版完成定义的一部分。仍然禁止静默写用户全局目录或插件缓存；项目级写入需有明确 project scope、目标路径和回滚 / 覆盖规则。

## 问题判断

### 1. `alembic_skill` 混合了两类语义

它既像“读取生成的 project skill”，又提供 `create/update/delete` 管理能力，还被用作冷启动后的验证提示。对 Codex 来说，这容易误导成“skill 已经安装并能按 Codex skill 触发规则自动启用”。

### 2. 冷启动结果缺少交付凭证

当前 `autoSkills.skills` 只记录名字，生成能力返回 path 和 hint，但没有告诉 Codex：

- 这是 project knowledge asset 还是 runtime skill。
- 摘要是什么。
- 触发场景是什么。
- 可信证据在哪里。
- 本轮任务是否应立即参考它。
- 是否需要用户确认后导出到 Codex skill 目录。

### 3. Codex 呐喊应发生在接收 prime / bootstrap 结果时

用户要的不是总结阶段回顾，而是 Codex 在拿到 project skills 后主动喊出“我知道了什么”。这需要交付数据本身支持摘要，而不是要求 Codex 读完整 `SKILL.md` 后再自行猜。

## 推荐设计

### 方案核心

用 `ProjectSkillDeliveryReceipt` 替代旧的 `alembic_skill(load)` 验证口径。

Receipt 是冷启动 / rescan / dimension completion 后产生的结构化交付结果，Codex 只需要读取 receipt 就能喊出项目知识摘要；需要深入时再按 receipt 的 asset ref 读取完整 project skill。它必须同时覆盖 `Alembic` cold-start producer 和 `AlembicPlugin` cold-start producer，并明确标出 producer route。

建议字段：

```ts
interface ProjectSkillDeliveryReceipt {
  receiptId: string;
  contractVersion: 1;
  generatedAt: string;
  producerRoute: 'alembic-cold-start' | 'plugin-cold-start';
  projectScope: {
    scopeId: string | null;
    displayName: string | null;
  };
  producer: 'alembic-cold-start' | 'alembic-rescan' | 'dimension-complete' | 'plugin-host-agent-cold-start' | 'plugin-host-agent-rescan';
  sourceJobId?: string;
  assets: ProjectSkillDeliveryAsset[];
  codexRuntimeInstallation: {
    status: 'not-installed' | 'exported' | 'failed';
    targetKind?: 'project-agents-skills' | 'project-symlinked-skill' | 'plugin-bundle';
    targetPath?: string;
    projectScopeId?: string;
    refreshRequired?: boolean;
  };
  shout: {
    audience: 'developer';
    summary: string;
    bullets: string[];
    instruction: string;
  };
  evidenceRefs: Array<{
    path: string;
    line?: number;
    role: 'generator' | 'asset' | 'source-evidence' | 'contract';
  }>;
}

interface ProjectSkillDeliveryAsset {
  name: string;
  title: string;
  summary: string;
  trigger: string;
  whyGenerated: string;
  knowledgeBasis: 'recipe-derived' | 'code-fact-derived' | 'mixed';
  projectSkillPath: string;
  loadRef: string;
  status: 'created' | 'updated' | 'unchanged' | 'failed';
}
```

### Codex 呐喊格式

Codex 拿到 receipt 后，只喊开发者需要马上知道的摘要。第一版正常完成时应使用“已接收并启用”的项目级 runtime export 成功口径：

```text
Codex 已接收并启用本项目 Alembic project skills：
- <skill title>：<一句话说明它让我知道什么，什么时候用>
- <skill title>：<一句话说明它让我知道什么，什么时候用>

这些 skill 已写入当前项目的 Codex runtime skill 路径，我后续会按 skill 描述自动判断是否使用；证据和来源保留在 Alembic receipt 中。
```

只有 export 未完成或失败时，才能使用降级口径，并且必须明确这是未完成状态，不能当作第一版完成：

```text
Codex 已接收 Alembic project skills，但尚未启用为本项目 Codex runtime skills：
- <skill title>：<一句话说明它让我知道什么，什么时候用>
- <skill title>：<一句话说明它让我知道什么，什么时候用>

这些仍只是 Alembic 项目知识资产；我可以在本轮把它们作为可查询依据使用，但项目级 runtime export 仍未完成。
```

文件路径、行号、完整 evidenceRefs 留在 receipt 中；除非用户要求追证，不出现在默认呐喊里。

### 替换 `alembic_skill`

第一版建议不要继续增强旧 `alembic_skill`，而是建立更明确的新入口：

- `alembic_project_skills`：只读入口，支持 `receipt`、`list`、`read`、`validate`。
- `alembic_project_skill_export`：项目级 runtime export 入口，写入当前项目 Codex runtime skill 路径，并回填 installation status。

删除 / 替换规则：

- Plugin Codex-facing MCP 不再暴露 `alembic_skill create/update/delete`。
- 冷启动生成不再提示 `alembic_skill({ operation: "load" })`，改为返回 receipt 和 project skill read ref。
- 如果仍需内部读取 project skill，由 Alembic 内部 service 或新只读入口承担，不再把“管理 skill 文件”作为 Codex 默认能力。
- 旧 `alembic_skill` 如果存在真实测试或文档消费方，先标 deprecated 并给替代入口；如果没有真实消费方，直接删除。

### 项目级导出到 Codex Skills

导出到 Codex runtime skills 是第一版完成定义的一部分，但必须保持项目级隔离。

允许目标：

- 当前项目关联的 `.agents/skills/<skill-name>/SKILL.md`
- 当前项目关联 `.agents/skills/<skill-name>` 下指向 Alembic-managed skill store 的 symlink
- 插件包 `skills/` 只适合 AlembicPlugin 固定 reusable skills，不适合某个项目冷启动生成物

导出必须满足：

- 明确 `projectScopeId` 和 Codex 当前可见 skill root。
- 不写用户全局 `$HOME/.agents/skills`，除非用户后续明确把某个 project skill 提升为用户级通用 skill。
- 展示将写入的 skill 名、路径、摘要和冲突；第一版可由 prime/bootstrap 在当前项目 `.agents/skills` 下创建 symlink，但必须在 receipt 里记录。
- 自动生成 skill 的更新允许自动覆盖；非自动生成或标记不匹配的已有 skill 不能覆盖。
- 不写 Codex plugin cache。
- 不修改 `~/.codex/config.toml`，除非用户明确要求。
- 导出后返回 `codexRuntimeInstallation.status = 'exported'`、target path 和可能需要重启 / 刷新的提示。

## 阶段划分

### Phase 0：设计确认

窗口：`AlembicWorkspace`

目标：

- 确认 `alembic_skill` 可以作为旧入口删除 / 替换。
- 确认第一版要做 receipt + Codex 呐喊 + 项目级 runtime export。
- 确认 runtime export 只做 project-scoped，不默认写用户全局 skills。
- 确认授权方式为 `projectScopeId + codexSkillRoot` 级别。
- 确认自动生成标记与覆盖策略。
- 确认多文件夹项目 / 多 root 支持列入 TODO，不进入第一版。

当前状态：用户已明确旧 `alembic_skill` 可删除，并于 2026-05-24 14:23 CST 要求推进到下一阶段。本文件已提升为当前主线，上游代码依赖调研见 [../../requirement-designs/cold-start-skill-delivery/code-implementation-dependency-research-2026-05-24.md](../../../../requirement-designs/cold-start-skill-delivery/code-implementation-dependency-research-2026-05-24.md)，Wave 执行计划见 [cold-start-skill-delivery-wave-2026-05-24.md](cold-start-skill-delivery-wave-2026-05-24.md)。

### Phase 1：Core receipt contract

窗口：`AlembicCore`

目标：

- 定义 `ProjectSkillDeliveryReceipt`、asset、installation status、evidenceRefs 和 shout summary contract。
- 提供 normalizer / validator，保证 Alembic producer、Plugin producer 和 Plugin consumer 不猜字段。
- 不新增空 provider，不写 Codex 目录。

### Phase 2：Alembic producer

窗口：`Alembic`

目标：

- 冷启动 / rescan / dimension complete 生成 project skill 后写入 receipt。
- `autoSkills` 或 job status 返回 receipt summary。
- 删除 `WorkflowSkillCompletionCapability` 中 `alembic_skill(load)` hint，改为 receipt/read ref。
- 保留 project skill 文件生成，并为项目级 runtime export 提供可 materialize 的 skill content / metadata。

### Phase 3：Plugin producer + Codex consumer

窗口：`AlembicPlugin`

目标：

- Plugin 自己的 cold-start / recoverable host-agent job 能按同一 receipt contract 产出 Plugin Project Skill。
- `prime` / bootstrap / status 能读取并展示 `ProjectSkillDeliveryReceipt`。
- Codex host response 生成默认呐喊摘要，不默认展示证据路径。
- 将 Alembic route 和 Plugin route 的 project skills 导出到当前项目 Codex runtime skill root，并更新 receipt installation status。
- 删除或替换 Plugin MCP 的 `alembic_skill` 管理入口。
- 新增只读 `alembic_project_skills` 或把 receipt 投入已有 `alembic_task prime` 响应，具体以代码实现最小闭环为准。

### Phase 4：项目级 runtime export 封口

窗口：`AlembicPlugin` / `Alembic`

目标：

- 收敛项目级 skill root 选择、冲突策略、`symlink-first` 策略、fallback 副本策略和刷新提示。
- 支持当前项目 `.agents/skills` 优先；多文件夹项目后续 TODO 接 ProjectRegistry `codexSkillRoots`。
- 导出后验证 Codex 可发现 symlinked project skill，receipt installation status 为 `exported`。

该阶段不后置，是第一版“Codex 能直接使用项目内 skill”的完成门禁。

### Phase 5：真实项目验证

窗口：`AlembicTest`

目标：

- 在真实项目验证 Alembic route 和 Plugin route 生成 project skills 后，Codex 能在 prime / bootstrap 接收时喊出摘要。
- 验证已 export 的 project skill 能被 Codex runtime skill 发现并直接使用。
- 验证未 export 或失败 export 的 asset 不会被误称为 runtime skill。
- 验证旧 `alembic_skill` 删除后，Plugin 可用能力和 project skill 读取仍有替代路径。

## 窗口覆盖判断

| 窗口 / 状态 | 判断 |
| --- | --- |
| `Alembic`<br>待后续 | 负责生成 receipt，替换冷启动生成后的旧 hint，并为项目级 runtime export 提供可 materialize 的 skill content。 |
| `AlembicCore`<br>待后续 | 负责 receipt contract / validator；等待本 TODO 被提升为新主线或进入空闲窗口调度。 |
| `AlembicAgent`<br>无任务 | 第一版不涉及 Alembic internal AI runtime 变更。 |
| `AlembicDashboard`<br>无任务 | 不涉及 Dashboard。 |
| `AlembicPlugin`<br>待后续 | 负责 Codex-facing receipt 展示、prime 呐喊、项目级 runtime export、project scope 隔离和旧 `alembic_skill` 删除 / 替换。 |
| `AlembicTest`<br>待后续 | 实现完成后承接真实项目验证，确认 Codex 能发现并使用项目级 runtime skill。 |

## 当前调度判断

`GTODO-2026-05-23-026` 已提升为当前主线。当前执行顺序以 [cold-start-skill-delivery-wave-2026-05-24.md](cold-start-skill-delivery-wave-2026-05-24.md) 为准：先发送 `AlembicCore` 完成共享 contract；`Alembic`、`AlembicPlugin` 和 `AlembicTest` 等待上游解除阻塞。

## 外部依据

- OpenAI Codex Skills 官方文档：<https://developers.openai.com/codex/skills>

本设计只采纳官方文档中对 Codex skill 发现位置、skill 目录结构、插件分发角色和启用机制的事实；外部资料不替代 Alembic 当前代码事实。
