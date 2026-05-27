# Obsidian AI / Skills 能力拆解与 Alembic 对比

> 调研时间：2026-05-09  
> 目的：基于公开资料分析 Obsidian 及其社区 AI / Skill / MCP 生态的主要实现逻辑，比较它与 Alembic 的定位差异，并提炼 Alembic 可借鉴的产品和工程方向。  
> 范围说明：Obsidian 官方本体、Web Clipper Interpreter、Smart Connections、MCPVault Obsidian Skill、Obsidian Sidekick，以及相关 MCP/Skills 生态。以下分析基于公开文档、README、产品页和本仓库当前代码，不代表 Obsidian 官方未公开实现细节。

## 1. 结论先行

Obsidian 的 AI 能力强，不是因为它把一个超大 Agent 写进核心应用，而是因为它把四个层次组合得非常顺：

```text
本地 Markdown Vault
  -> 插件 API / URI / metadata cache
    -> 语义检索、模板解释、AI chat、agent panel
      -> Skills / MCP / Git / app action 的意图路由
```

它的核心优势有三个：

1. **可被 AI 直接理解的数据基座**  
   笔记就是本地 Markdown 文件。LLM、搜索、MCP、git、脚本、外部编辑器都能直接读写，不需要先穿过复杂私有数据库。

2. **低摩擦的“当前上下文”体验**  
   Smart Connections 这类插件不是等用户主动搜索，而是在用户写当前笔记时自动浮出相关笔记、块和可复用上下文包。AI 能力贴着工作现场长出来。

3. **Skill 不是大而全插件，而是可读的操作手册和路由策略**  
   MCPVault 的 Obsidian Skill 把“读写搜索走 MCP、打开/触发 App 走 Obsidian URI/CLI、同步备份走 Git”写成清晰路由矩阵。Sidekick 则把 `SKILL.md` 作为可开关、可安装、可组合的领域知识。

Alembic 的优势更偏“代码项目知识治理”：Recipe 生命周期、Guard 审计、Bootstrap 分维度分析、sourceRefs、增量演化、MCP 工具和项目 Skill 生成。这比 Obsidian 笔记生态更工程化，也更适合团队代码规范。但 Alembic 现在的体验仍偏“任务触发型”：先 bootstrap、search、prime、guard，再让 Agent 使用。

Alembic 最值得学习的不是“做一个 Obsidian”，而是把已有能力包装成更自然的工作流：

- 像 Smart Connections 一样，围绕当前文件/当前 diff 主动浮出相关 Recipe、Skill、Guard 风险和代码证据。
- 像 MCPVault Skill 一样，生成一个面向 Agent 的高质量 `alembic` 路由 Skill，明确每种意图该调哪个工具、何时需要确认、何时只读。
- 像 Sidekick 一样，把 Project Skills 做成可发现、可安装、可开关、可版本化、可按 Agent profile 选择的能力层。
- 像 Web Clipper Interpreter 一样，为知识捕获提供模板变量、上下文裁剪和模型解释流程，减少“创建候选知识”时的手工说明成本。

## 2. 公开来源摘要

### 2.1 Obsidian 官方本体

Obsidian 官方文档把 Vault 定义为一组本地文件夹和子文件夹。插件可以通过 Vault API 访问 Markdown 文件，并使用 `Vault.process()` 这类方法在读改写时避免覆盖用户的新内容。Obsidian URI 允许外部通过 `obsidian://` 执行打开笔记、创建笔记、打开搜索、跳转到标题或块等操作。

The Verge 对 Obsidian CEO Steph Ango 的访谈也解释了 Obsidian 的产品哲学：Markdown 本地文件、用户拥有数据、插件生态承担大量长尾能力。访谈里还明确提到，Obsidian 官方目前没有把 AI 塞进主应用，除 Web Clipper Interpreter 外，AI 更多交给插件生态探索。

### 2.2 Web Clipper Interpreter

Web Clipper Interpreter 是官方 AI 能力中最典型的一块。它让用户在剪藏网页时使用自然语言 prompt 变量，例如在模板里写 `{{"a summary of the page"}}`，由模型基于网页上下文生成结果，再替换到模板变量中。

它的实现逻辑有几个关键点：

- Prompt 不是一个额外聊天窗口，而是模板变量的一种。
- Interpreter 会把页面上下文和模板中的所有 prompt 一次性发给模型。
- 用户可以裁剪上下文，例如只解释某个 selector 的 HTML，降低成本和延迟。
- 支持 Anthropic、OpenAI、Gemini、DeepSeek、Ollama、OpenRouter 等 provider，也支持本地模型。
- 结果还能继续走 filters，例如日期格式、文本转换、HTML 清理等。

这是一种很轻的 AI 集成：AI 不替用户“思考整个 vault”，只在捕获网页时完成结构化提取、摘要、翻译、清洗和元数据填充。

### 2.3 Smart Connections / Smart Plugins

Smart Connections 的公开说明强调本地优先、离线可用、语义检索和当前笔记相关性。它的基本循环是：

```text
当前笔记
  -> 本地 embeddings / 索引
  -> 相关 notes / blocks 排名
  -> sidebar / footer / inline / lookup / graph
  -> 预览、拖拽成链接、复制或发送到 Smart Context
```

它的核心价值不是“给 vault 加一个聊天框”，而是让相关上下文在用户写作时自然出现。Smart Lookup 处理“我记得意思但忘了关键词”的问题，Connections 处理“我正在写这个笔记，哪些旧内容该被召回”的问题，Smart Context 再把检索结果打包成 AI 可用上下文。

第三方 `smart-connections-mcp` README 进一步暴露了可复用架构：MCP server 读取 Smart Connections 生成的 `.smart-env/smart_env.json` 和 `.smart-env/multi/*.ajson` embeddings，使用 cosine similarity 做语义搜索、相似笔记、connection graph 和块级内容读取。公开示例里提到 384 维 `TaylorAI/bge-micro-v2` 向量、预计算 embeddings、近实时搜索和块映射。

### 2.4 MCPVault Obsidian Skill

MCPVault 的 Obsidian Skill 是一个非常值得 Alembic 研究的样板。它不是只提供工具，而是把工具使用策略写成 Skill：

```text
读/写/搜索/patch/frontmatter/tag/move
  -> MCP server

打开笔记、触发 Obsidian App 行为、导出
  -> Obsidian CLI / URI / app context

同步、备份、跨设备存储
  -> Git CLI
```

它的安全默认值也很清晰：

- 文件变更优先走 MCP 写入。
- MCP server 做 vault root sandbox、路径穿越防护、原子写入和 frontmatter 校验。
- 删除和移动要求显式确认参数。
- 命令使用结构化参数，不做 shell 字符串拼接。
- Git sync 前做 preflight，检查 git、repo、identity、remote，再提交、pull rebase、push。

这说明一个好 Skill 不只是“提示词增强”，而是把意图路由、工具边界、失败恢复和安全策略写成可复用流程。

### 2.5 Obsidian Sidekick

Obsidian Sidekick 展示的是另一种形态：把 Agent panel、模型 provider、tools、skills、inline 操作和搜索直接嵌入 Obsidian。它的 agent 配置放在 Markdown frontmatter 中：

```yaml
name: ...
description: ...
model: ...
tools: ...
skills: ...
```

其中 `tools` 和 `skills` 可以省略、置空或列出特定项。省略表示全部启用，置空表示全部禁用，列出表示只启用指定能力。Skills 是 `sidekick/skills/<name>/SKILL.md` 子目录，可以从 skills.sh 下载，也可以在 toolbar 里开关。

这和 Alembic 当前 Project Skill 的差异不在格式，而在“控制面”：Sidekick 把 skill 是否启用、和哪个 agent/profile 绑定、哪些 MCP server 开启，变成用户日常可见的操作。

## 3. Obsidian AI / Skills 的主要实现逻辑

### 3.1 本地文件是最低层协议

Obsidian 的最强底座不是 AI，而是“所有知识默认是本地 Markdown 文件”。这个选择让多个系统能同时成立：

- Obsidian App 可以通过 Vault API 和 metadata cache 管理文件、链接、heading、block、frontmatter。
- 插件可以用 TypeScript/JavaScript 快速扩展 UI、命令、编辑器行为和数据读取。
- 外部 Agent 可以通过 MCP server 在 vault root 内安全读写。
- Git 可以自然做同步、备份、审计和冲突处理。
- LLM 对 Markdown 友好，不需要复杂格式转换。

这是一种“开放文件系统即平台”的架构。AI 能力没有被锁在一个主应用进程里。

### 3.2 AI 被放在工作流节点上，而不是替代整个工作流

官方 Web Clipper Interpreter 只在剪藏阶段做结构化解释。Smart Connections 在写作阶段做相关性召回。MCPVault 在读写/同步阶段做工具路由。Sidekick 在 Obsidian 侧栏里做 agent chat、inline transform 和 tool call。

这些 AI 能力都贴着明确场景：

- 捕获网页时提取元数据。
- 写当前笔记时找相关旧笔记。
- 管理 vault 时安全 patch/frontmatter/tag。
- 需要 app 行为时通过 URI 打开笔记。
- 需要同步时走 git。

所以它看起来“强”，不是因为一个模型什么都做，而是每个场景都有一个小而稳的 AI/工具接口。

### 3.3 Skill 是“操作策略包”

在 Obsidian 生态里，Skill 更接近面向 Agent 的流程说明，而不是传统插件。它通常包含：

- 何时触发。
- 当前任务应该使用哪个 backend。
- 每个工具的输入输出形状。
- 出错时怎么恢复。
- 哪些操作需要确认。
- 哪些路径、文件、frontmatter、tag 约定要遵守。

这个模式的威力在于：工具 API 可以保持小而安全，复杂决策写在 `SKILL.md` 里。Agent 读 Skill 后能更像熟悉该生态的操作者。

### 3.4 检索不是一次性搜索，而是 ambient context

Smart Connections 的产品洞察很关键：用户不总是会主动提问“搜索我的 vault”。很多时候，最需要上下文的时刻是用户正在写、改、整理当前内容的时候。

因此它把检索做成 ambient context：

- 当前 note 自动成为 query。
- sidebar / footer / inline 持续显示相关结果。
- 结果可被拖拽成链接、复制、隐藏、pin。
- 搜索结果可升级为 Smart Context bundle，供 AI 使用。

这比传统 RAG 更像“上下文雷达”：不等 Agent 问，先把可能有用的东西放到用户眼前。

### 3.5 安全边界在每层都很具体

Obsidian 生态的安全逻辑比较务实：

- 主应用保持本地文件和插件模型，不把用户数据默认送云端。
- Web Clipper Interpreter 明确提示 provider 隐私边界，并支持本地模型。
- MCPVault 的 server 用 vault root 限制路径，过滤 `.obsidian`、`.git`、`node_modules` 等系统目录，并校验 frontmatter。
- Skill 层要求破坏性操作显式确认，命令不做字符串插值。
- Git sync 是可审计的普通文件版本管理。

这些设计不依赖“模型很聪明”，而是把风险压到工程边界里。

## 4. 与 Alembic 的核心差异

| 维度 | Obsidian / 社区 AI 生态 | Alembic |
| --- | --- | --- |
| 核心对象 | 个人或团队知识笔记、Markdown 文件、链接、frontmatter、块 | 代码项目、Recipe、Candidate、Guard、Wiki、Project Skill、语义索引 |
| 主要目标 | 让用户拥有、连接、检索和扩展自己的知识空间 | 让 AI coding assistant 按项目约定写代码，并持续治理知识 |
| AI 进入方式 | 官方谨慎，AI 多在 Web Clipper 和插件生态；社区通过 MCP/Skill/Sidekick 扩展 | AI 是核心工作流的一部分，用于 bootstrap、候选提取、Skill 生成、Wiki、rescan |
| 检索体验 | 当前 note 触发、sidebar/inline/footer 主动浮现、可拖拽成链接 | Agent 主动 prime/search，Dashboard 可查，更多是任务触发 |
| Skill 形态 | 可安装 `SKILL.md`，可按 agent/profile/tools 开关，偏路由和工作流说明 | 内置 injectable skills + Project Skills，可生成和加载，偏 Alembic 工具使用指南和项目流程 |
| 写入边界 | vault root sandbox、frontmatter AST/校验、原子 patch、app URI 和 git 分工 | WriteZone、PathGuard、Gateway、Permission、Guard、candidate review |
| 知识生命周期 | 文件和插件生态自然演化，部分插件有索引刷新 | pending/staging/active/evolving/decaying/deprecated 等治理更强 |
| 生态入口 | Obsidian Community Plugins、skills.sh、MCP servers、URI、Git | CLI、MCP、Codex plugin、Cursor/VS Code/Claude/Trae/Qoder/Xcode/Lark |

一句话：Obsidian 更像“开放知识工作台”，Alembic 更像“代码知识治理引擎”。前者赢在贴近日常使用和生态低摩擦，后者赢在工程约束、代码理解和知识质量控制。

## 5. Alembic 当前已经具备的对应基础

从本仓库看，Alembic 已经有不少可复用基础：

| 能力 | 当前实现线索 | 对应 Obsidian 启发 |
| --- | --- | --- |
| Project Skill 发现/加载/创建 | `lib/external/mcp/handlers/skill.ts` | 类似 `SKILL.md` 能力包，但需要更强控制面 |
| Bootstrap 自动生成 Skill | `lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts` | 可从分析文本生成项目 Skill |
| Recipe/候选/生命周期 | `lib/domain/knowledge/*`、`lib/service/evolution/*` | 比 Obsidian 笔记更强的知识治理 |
| 语义搜索和 HNSW | README 中的 Semantic Search、`.asd/context` | 可学习 Smart Connections 的 ambient context 展示 |
| Guard 审计 | `lib/external/mcp/handlers/guard.ts`、README Guard | 可在当前文件/diff 场景主动浮出风险 |
| Wiki 生成 | `lib/external/mcp/handlers/wiki-external.ts`、`lib/service/wiki/*` | 可作为人和 Agent 共用的项目理解平面 |
| MCP/Codex plugin | `plugins/alembic-codex/README.md` | 可用 Skill 路由矩阵让 Agent 更稳地选择工具 |

问题不在“缺能力”，而在“能力还没有像 Obsidian 插件生态那样被自然编排到日常上下文里”。

## 6. Alembic 最值得学习的方向

### 6.1 做一个 `alembic` 路由 Skill

参考 MCPVault，把 Alembic 的工具使用策略写成一个高质量 Skill，并自动安装到 Codex/Cursor/Claude/VS Code 能看到的位置。

建议内容：

```text
用户问项目规范/怎么写
  -> 先 prime/search Recipes

用户要求保存模式/规范
  -> create candidate，带 sourceRefs 和 review 状态

用户完成代码修改/问是否符合规范
  -> guard current diff/files

用户问架构/模块/依赖
  -> structure / panorama / wiki

用户说冷启动/刷新知识库
  -> bootstrap/rescan durable job

用户要调试 Alembic 本身
  -> diagnostics/status/job/log/dashboard
```

这不是新增底层能力，而是把已有 MCP 工具变成 Agent 可稳定遵守的“操作手册”。它应明确只读默认、写入确认、长任务恢复、失败处理和结果摘要格式。

### 6.2 把 Search/Guard/Recipe 做成当前文件的 ambient context

Smart Connections 最大启发是“当前上下文自动召回”。Alembic 可以做代码版：

```text
active file + cursor region + imports + git diff + task prompt
  -> intent extractor
  -> recipe/search/guard/panorama hybrid ranking
  -> top N context cards
  -> Codex/Cursor/VS Code 注入或 Dashboard 侧栏展示
```

每张 context card 应包含：

- Recipe / Skill / Wiki section 标题。
- 为什么相关。
- sourceRefs。
- 适用范围。
- Guard 风险或反例。
- 一键“注入给 Agent”或“忽略/降低权重”。

这会让 Alembic 从“Agent 调用工具时才有记忆”变成“开发者/Agent 工作时旁边一直有项目雷达”。

### 6.3 引入 Context Bundle

Smart Context 的思想适合 Alembic。建议新增一种可序列化产物：

```ts
interface AlembicContextBundle {
  id: string;
  purpose: string;
  createdAt: string;
  query: {
    task?: string;
    files?: string[];
    diff?: string;
    intent?: string[];
  };
  items: Array<{
    type: 'recipe' | 'skill' | 'wiki' | 'guard' | 'source';
    title: string;
    summary: string;
    sourceRefs: string[];
    reason: string;
    confidence: number;
  }>;
}
```

用途：

- Agent 开始编码前生成“任务上下文包”。
- Guard 失败后生成“修复上下文包”。
- PR/交接时附带“本次修改相关项目约定”。
- Dashboard 支持复制、引用、重用。

这会把 Alembic 的检索结果从一次性 tool output 变成可复用 artifact。

### 6.4 Project Skills 做成可安装、可开关、可版本化

Alembic 现在已经能创建和加载 Project Skills，但可以进一步学习 Sidekick：

- Skill 有 `source`：builtin、project、generated、installed、remote。
- Skill 有 `enabled`、`trustLevel`、`version`、`requirements`、`lastUsedAt`、`successRate`。
- Agent profile 可声明启用哪些 skills。
- Dashboard 可 toggle skills，展示触发语和使用统计。
- 支持从 GitHub/skills.sh 导入通用技能，也支持导出 Alembic 生成的技能。
- Skill 更新需要 diff review，避免远程技能静默改变 Agent 行为。

这可以把 Alembic 的 Skill 从“生成的文档文件”升级为“可治理能力包”。

### 6.5 创建 Knowledge Clipper / Candidate Interpreter

Web Clipper Interpreter 的模板变量机制适合 Alembic 的知识捕获。可以设计一个 “Knowledge Clipper”：

```text
选中文件/代码片段/PR diff/终端错误/聊天片段
  -> 模板变量抽取
  -> 模型解释为 candidate draft
  -> sourceRefs 绑定
  -> 用户 review
  -> Recipe / Skill / Wiki
```

模板例子：

```md
title: {{"用一句话概括这段代码模式"}}
rationale: {{"这个模式解决了什么问题"}}
do: {{"提取应该遵守的做法"}}
dont: {{"提取容易违反的反例"}}
sourceRefs: {{selection.sourceRefs}}
```

这会降低手动创建 candidate 的门槛，尤其适合用户说“把这段沉淀下来”的场景。

### 6.6 Block-level / Symbol-level retrieval

Smart Connections 不只检索笔记，也强调 blocks。Alembic 的代码场景应进一步做到 symbol/block 级别：

- 函数、类、导出、测试用例、配置段、README section 都可作为 block。
- Recipe sourceRefs 不只指文件，也指 symbol 或 range。
- 语义索引支持“当前函数”而不是整个文件。
- Guard 结果能映射到具体 symbol。
- Wiki section、Recipe、Skill 都能引用同一代码实体。

Alembic 已有 tree-sitter、call graph、sourceRefs、knowledge graph。下一步是把这些实体变成用户和 Agent 都能感知的最小上下文单位。

### 6.7 保持 Obsidian 式边界：AI 不吞掉用户判断

Obsidian 官方对 AI 谨慎的态度值得学习。Alembic 是 AI-native，但仍应保持：

- AI 生成的是候选，不直接篡改项目标准。
- 重要 Recipe/Skill 变更可 review、可 diff、可 rollback。
- 写入和删除要有明确权限边界。
- sourceRefs 永远保留，回答和规则都能回到代码证据。
- 本地优先，云模型可选，embedding 可本地。

Alembic 的强项正是治理和证据链，不应该为了“自动化酷炫”牺牲这点。

## 7. 推荐落地路线

### P0：先做 `alembic` 路由 Skill

最小实现：

1. 生成 `skills/alembic/SKILL.md` 或 Codex/Cursor/Claude 可识别的等价位置。
2. 写清楚 Alembic 工具路由矩阵、长任务恢复、只读默认、写入确认、失败处理。
3. Codex plugin 安装时自动携带或暴露该 Skill。
4. Dashboard Skills 页展示它，并允许复制/安装到目标 IDE。

收益：立即提高 Agent 使用 Alembic MCP 工具的稳定性。

### P1：Context Bundle

最小实现：

1. 给 `prime/search/guard` 增加可选 `bundle=true` 输出。
2. 将结果保存为 Markdown/JSON，包含 sourceRefs、reason、confidence。
3. Codex plugin 或 Dashboard 支持“把 bundle 注入当前任务”。

收益：把 Alembic 的知识检索变成可复用上下文资产。

### P2：当前文件 ambient context

最小实现：

1. CLI/MCP 接收 `activeFile`、`cursorLine`、`diff`、`taskPrompt`。
2. 混合检索 Recipes、Skills、Wiki、Guard hints。
3. Dashboard 增加 Current Context 面板。
4. VS Code/Cursor 后续可接入侧栏或 CodeLens。

收益：让 Alembic 从“问了才知道”变成“写的时候就提醒”。

### P3：Skill Control Plane

最小实现：

1. 扩展 Skill metadata：source、version、enabled、trustLevel、requirements。
2. Skill list/load/create 返回这些字段。
3. Agent profile 或 workspace settings 支持启用/禁用 skill。
4. Dashboard 支持开关、查看 diff、查看使用记录。

收益：Project Skills 从生成物变成可治理能力。

### P4：Knowledge Clipper

最小实现：

1. 支持从 selection/diff/error/log 生成 candidate draft。
2. 用模板变量驱动 title/rationale/do/dont/sourceRefs。
3. 结果进入现有 Candidate review，而不是直接 publish。

收益：减少“知识捕获”的摩擦，扩大 Recipe 来源。

## 8. 不建议照搬的部分

1. **不要把 Alembic 做成通用笔记应用**  
   Alembic 的护城河是代码结构、规范治理、Guard、Recipe 生命周期和 IDE/Agent 集成。泛化成笔记系统会稀释重点。

2. **不要过早做开放 Skill 市场**  
   skills.sh 生态很有启发，但第三方 Skill 有安全风险。Alembic 可以先支持本地/项目内导入，再做受信任来源和审查机制。

3. **不要只靠自然语言 Skill 约束高风险行为**  
   MCPVault 的强处是 Skill 之外还有 path sandbox、frontmatter validation、atomic writes。Alembic 也应继续把安全放在 WriteZone、PathGuard、Permission、Guard 这些工程层。

4. **不要把 ambient context 做成噪音面板**  
   主动浮现上下文必须能 hide、pin、降权、解释“为什么相关”。否则它会从智能雷达变成打扰。

## 9. 总结判断

Obsidian AI/Skill 生态的本质是：

```text
开放本地数据
  + 插件化 UI
  + 语义索引
  + 可读 Skill
  + MCP 安全工具
  + Git/URI/app action 路由
  = 低摩擦的个人知识 Agent 工作台
```

Alembic 的本质是：

```text
代码结构理解
  + Recipe 生命周期
  + Guard 审计
  + Bootstrap/Rescan
  + sourceRefs
  + MCP/IDE delivery
  = 团队代码知识治理和 Agent 编码约束系统
```

二者不该互相替代。Alembic 最该吸收的是 Obsidian 的“工作现场感”：让知识在当前文件、当前 diff、当前任务旁边自动出现，让 Skill 成为清晰的工具路由手册，让上下文包成为可复用 artifact。这样 Alembic 会从“强大的知识库和守卫系统”进一步变成“开发时一直在场的项目智慧层”。

## 10. 参考链接

- Obsidian Vault Developer Documentation: <https://docs.obsidian.md/Plugins/Vault>
- Obsidian URI Help: <https://obsidian.md/help/Extending%2BObsidian/Obsidian%2BURI>
- Obsidian Web Clipper Interpreter: <https://obsidian.md/help/web-clipper/interpreter>
- Obsidian Web Clipper Variables: <https://obsidian.md/help/web-clipper/variables>
- Obsidian Web Clipper Filters: <https://obsidian.md/help/web-clipper/filters>
- The Verge Decoder interview with Obsidian CEO Steph Ango: <https://www.theverge.com/decoder-podcast-with-nilay-patel/760522/obsidian-ceo-steph-ango-kepano-productivity-software-notes-app>
- Smart Connections official site: <https://smartconnections.app/smart-connections/>
- Smart Plugins overview: <https://smartconnections.app/>
- Smart Connections MCP README: <https://github.com/msdanyg/smart-connections-mcp>
- MCPVault Obsidian Skill: <https://mcpvault.org/skill>
- MCPVault GitHub README: <https://github.com/bitbonsai/mcpvault>
- Obsidian Sidekick README: <https://github.com/vieiraae/obsidian-sidekick>
- skills.sh documentation: <https://skills.sh/docs>
