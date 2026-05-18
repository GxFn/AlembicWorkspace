# Google Code Wiki、DeepWiki 与 Alembic 对比分析

> 调研时间：2026-05-06
> 调研对象：<https://codewiki.google/>、<https://codewiki.google/faq>、示例仓库页 <https://codewiki.google/github.com/google-gemini/gemini-cli>、<https://deepwiki.com/>、<https://deepwiki.com/google/dotprompt>、Devin DeepWiki 文档与 DeepWiki MCP 文档。

## 结论摘要

Google Code Wiki 是一个面向 GitHub 开源仓库的 AI 生成代码理解门户。它把一个仓库转化为可浏览、可搜索、可问答的 Wiki：包含仓库概览、架构主题页、自动图示、源码链接、聊天入口，并周期性随上游仓库变化刷新。它的价值不只是“生成文档”，而是把代码库变成一个对 Agent 和开发者都友好的理解界面。

DeepWiki 是 Devin 体系中的仓库理解与问答产品，公开站点自称提供“up-to-date documentation you can talk to, for every repo in the world”，也就是“面向 GitHub 的 Deep Research”。它与 Code Wiki 很像，都是自动生成仓库 Wiki、源码链接、架构图和问答；但 DeepWiki 的 Agent 接口更明确：官方提供免认证的远程 MCP，允许其他 Agent 直接读取 Wiki 结构、Wiki 内容并对公开仓库提问。

截至本次调研，没有发现 Code Wiki 或 DeepWiki 服务本身的公开开源实现仓库。Code Wiki 更像 Google 托管服务：公共开源仓库免费访问，当前仅支持 GitHub；私有仓库能力标注为未来通过 Gemini CLI 扩展在用户自己的环境内生成和托管。DeepWiki 也更像 Devin 托管服务：公共版免费用于公开 GitHub 仓库，私有仓库能力需要 Devin 账号或 Devin MCP。两者都开放了“使用入口”，但没有开放核心索引、规划、生成和问答系统源码。

对 Alembic 而言，Code Wiki 和 DeepWiki 的启发不在于“再做一个文档生成器”，而在于把 Alembic 已有的 Knowledge、Recipe、Graph、Search、Wiki、Skill、Guard、Rescan 能力组织成一个持续更新的“项目理解平面”。Code Wiki 偏 Google/Gemini 生态的公开代码理解，DeepWiki 偏 Devin/Agent 生态的可问答知识接口，Alembic 可以走得更深：让 Wiki 连接可执行 Skill、Guard 审计、Recipe 生命周期、增量扫描、演进提案和工作流验证。

## 公开可验证功能

### 1. 自动生成仓库 Wiki

Code Wiki 首页将自己描述为“Gemini-generated documentation, always up-to-date”。FAQ 进一步说明：Code Wiki 是一个 AI-powered documentation hub，使用专门的 AI agent 分析源代码，生成自然语言摘要、架构图和关键洞察。

它不是传统 README 汇总，而是围绕仓库结构生成多层级主题。例如 `google-gemini/gemini-cli` 的 Code Wiki 页面包含：

- 项目简介与能力概览。
- Monorepo 结构说明。
- 贡献流程、测试评估、发布管理。
- CLI 核心架构、上下文管理、工具系统、Skill 管理、A2A、IDE 集成等专题。
- 每个专题下继续拆出二级主题，例如 React/Ink UI、Hook System、Policy、Sandbox、SDK、MCP、VS Code companion。

这说明 Code Wiki 的生成单元不是“单文件摘要”，而是“仓库主题图谱”：先识别大主题，再为每个主题生成解释、表格、子章节、源码引用和图示。

### 2. 源码强链接

示例页中的说明大量链接回 GitHub 源码，且 URL 通常固定到具体 commit SHA。例如 Gemini CLI 页面链接到 `GEMINI.md`、`packages/cli`、`packages/core`、测试文件、配置文件和文档文件。

这带来两个重要效果：

- 可验证：读者能从自然语言解释跳回实际代码。
- 可复现：生成页绑定到某次仓库状态，避免“文档描述的是哪个版本”的歧义。

Code Wiki 的“文档可信度”很大程度来自这种链接策略。它没有要求用户相信 AI 总结，而是把总结和源码证据并排组织。

### 3. 架构图和交互图

首页和 FAQ 明确提到 Diagrams。FAQ 说图由 AI agent 分析代码结构后生成，用于表示关系、层级和依赖，可以全屏查看、缩放、平移和探索。

这表明 Code Wiki 至少有一层结构化中间表示：它需要从代码和文档中抽取组件、目录、模块、依赖关系或工作流关系，然后再渲染为图。图不是独立装饰，而是 Wiki 主题的一部分。

### 4. 仓库问答 Chat

首页写有 “Talk to your codebase” / “Chat with your codebase”。FAQ 说明 Ask about this repo 由 Gemini 驱动，并且以 Wiki 内容作为主要上下文来源。

这点很关键：Code Wiki 的 Chat 不是直接把整个仓库塞进上下文，而是复用预生成 Wiki 作为检索和压缩后的知识层。也就是说，Wiki 既是给人看的文档，也是给问答系统用的 RAG 语料。

### 5. 更新机制

首页文案提到“stays perfectly in sync with every change”，并说 PR merge 后相关文档会自动更新。但 FAQ 更谨慎：Wikis are updated periodically，刷新频率是动态的，会根据项目流行度、使用量等因素变化，页面左下角可查看 last generated 日期。

因此更稳妥的理解是：Code Wiki 有增量或周期性刷新机制，但公开资料没有证明它对每个 PR merge 做强实时更新。产品文案强调随代码演化，FAQ 描述的是动态周期刷新。

### 6. 当前平台和私有仓库策略

FAQ 明确说明：

- 当前只支持 GitHub。
- 公共开源仓库免费。
- 如果某个公开仓库没有 Wiki，可以 request a repo。
- 私有仓库不是当前托管站点直接支持，而是计划发布 Gemini CLI 扩展，让用户在自己的环境中安全生成并托管 Wiki。
- 仓库所有者可以邮件申请移除自己的 Code Wiki。

这说明 Google 对隐私边界比较谨慎：公共仓库走托管服务，私有仓库倾向本地或自有环境部署。

## DeepWiki 是什么

DeepWiki 是 Devin 生态中的代码库理解产品。公开首页的定位是“Think Deep Research for GitHub”：用户输入或选择一个 GitHub 仓库后，DeepWiki 为它生成可浏览、可引用、可问答的 Wiki。Devin 官方文档进一步说明，DeepWiki 会自动索引仓库并生成架构图、源代码链接和代码库摘要，Ask Devin 会利用 Wiki 信息来更好地理解代码库并找到相关上下文。

### 1. 公共 GitHub 仓库 Wiki

DeepWiki 公共版覆盖公开 GitHub 仓库，首页展示了大量热门仓库入口，例如 `microsoft/vscode`、`huggingface/transformers`、`facebook/react`、`golang/go`、`kubernetes/kubernetes` 等。用户也可以提交自己的公开 GitHub 仓库 URL 进行索引。

示例页 `google/dotprompt` 展示出 DeepWiki 的典型页面结构：

- 左侧或页面索引列出层级化主题，如 Overview、Core Concepts、语言实现、开发工作流、测试、发布等。
- 页面底部或侧边显示 `Last indexed`，并链接到被索引的 commit。
- 正文中使用 `Sources:` 链回 GitHub 的具体文件和行范围。
- 页面包含自动生成的 ASCII/图示结构、表格、关键代码实体和处理流程。
- 页面有 `Edit Wiki`、Share 和 “Index your code with Devin” 等入口。

这说明 DeepWiki 和 Code Wiki 一样，都把仓库理解组织成“主题树 + 证据链接 + 问答”的形态。但 DeepWiki 的页面更明显地暴露了 source citation 和 indexed commit，读者可以更直接地检查文档依据。

### 2. `.devin/wiki.json` 可控生成

DeepWiki 一个值得重点关注的能力是“Steering DeepWiki”。官方文档说明，仓库根目录可以放置 `.devin/wiki.json` 来影响 Wiki 生成。该文件支持两类主要信息：

- `repo_notes`：为生成系统提供仓库背景、重点目录、关键组件、优先级和团队提示。
- `pages`：明确指定要生成的页面标题、目的、父子层级和页面级补充说明。

如果只提供 `repo_notes`，系统仍然自动规划页面，但会参考这些提示。如果提供 `pages`，DeepWiki 会绕过默认的 cluster-based planning，只生成用户明确列出的页面。这对大型仓库尤其重要，因为自动聚类可能遗漏重要目录或团队真正关心的模块。

公开文档还给出限制：普通场景最多 30 个页面，企业版最多 80 个页面；总 notes 数量最多 100；每条 note 最多 10,000 字符；页面标题必须唯一且非空。

这其实是一个非常实用的设计：AI 文档生成不应完全黑箱自动化，而应该允许项目团队用轻量结构化文件表达“这里什么重要、应该怎么分层、哪些内容不能漏”。

### 3. DeepWiki MCP

DeepWiki 相比 Code Wiki 更明确地开放了 Agent 接口。官方 DeepWiki MCP 文档说明：DeepWiki MCP server 是一个免费的远程服务，不需要认证，用于访问公开仓库文档和 Ask Devin 的搜索/问答能力。

它提供三个主要工具：

- `read_wiki_structure`：读取某个 GitHub 仓库的文档主题结构。
- `read_wiki_contents`：读取某个 GitHub 仓库的 Wiki 文档内容。
- `ask_question`：对某个 GitHub 仓库提问，返回基于上下文的 AI 答案。

它支持两个协议入口：

- 推荐的 Streamable HTTP：`https://mcp.deepwiki.com/mcp`。
- 旧的 SSE：`https://mcp.deepwiki.com/sse`，官方提示正在被弃用。

这意味着 DeepWiki 不只是一个网页产品，也是一层公共仓库知识 API。Agent 不必打开网页，就可以把 DeepWiki 当作只读代码库知识源。

### 4. 私有仓库策略

Devin 文档说明，DeepWiki 会在 Devin onboarding 时为连接的仓库自动生成 Wiki；公开版和 DeepWiki MCP 提供基础文档与问答能力；完整 Ask Devin 体验，包括高级代码搜索、规划和 session 创建，在 Devin app 中提供。

对于私有仓库，DeepWiki MCP 文档建议注册 Devin 账号，并使用带 Devin API key 的 Devin MCP server。这与 Code Wiki 的私有仓库路线不同：Code Wiki 计划通过 Gemini CLI extension 在用户自己的环境内生成和托管；DeepWiki 则更偏 Devin app / Devin MCP 账户体系。

## 推断的实现逻辑

以下是基于公开页面表现和 FAQ 的合理推断，不代表 Google 官方实现细节。

### 1. 仓库接入与快照层

Code Wiki 需要先把 GitHub 仓库解析为稳定快照：

1. 接收 `github.com/owner/repo` URL。
2. 选择一个 commit 或默认分支 HEAD。
3. 拉取文件树、README、docs、配置、源码、测试、CI、包管理文件。
4. 根据语言和目录结构做文件过滤。
5. 为生成页保留 commit SHA，用于源码链接。

示例页里的源码链接都落到固定 commit，说明快照是生成和引用的核心单位。

### 2. 结构发现层

Code Wiki 不只是全文索引，而是要识别仓库主题。它很可能会组合多种信号：

- 目录和包结构，例如 `packages/cli`、`packages/core`、`packages/sdk`。
- README、GEMINI.md、CONTRIBUTING、docs 目录。
- package/workspace 配置、Makefile、CI workflows。
- 入口文件、导出文件、测试文件和命名模式。
- 符号和引用关系，至少对主流语言做轻量 AST 或语言服务分析。

这一层输出的是“仓库知识骨架”：有哪些模块、每个模块做什么、模块之间如何关联、哪些文档和源码可作为证据。

### 3. 主题规划层

Code Wiki 页面的“On this page”包含多个一级主题和二级主题，说明生成前很可能先做 topic planning：

- 仓库总览。
- 使用入门。
- 核心架构。
- 工具系统。
- 配置与安全。
- SDK / A2A / IDE 集成。
- 质量保障和发布流程。

这类主题不是固定模板完全套用，而是根据项目特征动态生成。例如 Gemini CLI 有 Skill、A2A、VS Code companion、DevTools；Kubernetes 或 React 的主题会明显不同。

### 4. 证据包与生成层

每个主题应该会获得一个 evidence package：相关源码路径、文档片段、测试文件、配置文件、依赖关系、可能的符号定义。生成器再使用 Gemini 写成自然语言文档，并插入源码链接、表格和图示。

一个可能的内部流程是：

```text
repo snapshot
  -> file inventory
  -> structure extraction
  -> topic planning
  -> per-topic evidence package
  -> Gemini generation
  -> citation/link normalization
  -> diagram generation
  -> static/SSR wiki publication
  -> search/chat index refresh
```

这种流程和 Alembic 的 `alembic_wiki plan -> write -> finalize` 很接近，只是 Code Wiki 看起来把生成、发布、图示、搜索和聊天体验做成了完整托管产品。

### 5. 检索与 Chat 层

FAQ 说 Chat 以 Wiki 内容作为主要上下文。合理推断是：

- Wiki 页面、章节、源码引用和图结构会被切分并索引。
- 用户问题先检索相关 Wiki section 和源码证据。
- Gemini 基于检索结果回答，并可能返回相关页面或源码链接。
- 对低延迟要求，预生成 Wiki 和预构建索引比实时全仓库分析更重要。

也就是说，Code Wiki 的 Chat 不是“一个 Agent 临时看仓库”，而是“一个建立在长期生成知识层之上的仓库问答系统”。这正是 Alembic 可以吸收的核心思想。

### 6. 增量刷新层

FAQ 提到刷新频率动态变化。要做到相关文档随代码变化更新，系统至少需要：

- 比较新旧 commit 文件差异。
- 将变更文件映射到受影响主题。
- 只重建相关 evidence package。
- 重新生成受影响 Wiki section 和图。
- 更新搜索/chat 索引。
- 记录 last generated 时间。

这与 Alembic 已有的 incremental rescan、file diff、dimension plan、evolution pipeline 很有对应关系。Alembic 的优势是已经把“变更影响知识和规则”的链路纳入核心，而 Code Wiki 更像把变更影响“文档和问答”的链路产品化。

## 是否开源与开放接口

当前没有发现 Code Wiki 服务本身的开源代码库。公开证据如下：

- Code Wiki 首页和 FAQ 没有提供 GitHub 源码链接。
- FAQ 说私有仓库能力计划以 Gemini CLI 扩展形式提供，但没有给出扩展仓库。
- GitHub 搜索能看到一些 Google 仓库 README 中的 Code Wiki 徽章，例如 `google/adk-python`、`google/adk-go`、`google/dotprompt`。
- `google/dotprompt` 同时放了 `View Code Wiki` 和 `Ask DeepWiki` 徽章，说明 Code Wiki 当前更像与 DeepWiki 类似的托管代码理解服务。
- `google-gemini/gemini-cli` 是开源项目，并且有 Code Wiki 页面；但它是被 Code Wiki 分析的目标仓库，不是 Code Wiki 实现本身。

因此本文将 Code Wiki 视为闭源托管产品来分析。后续需要继续关注两条线：

- Gemini CLI 私有仓库 Code Wiki extension 是否发布。
- Google 是否公开 Code Wiki 生成器、索引器、图生成器或 badge/action 集成。

DeepWiki 也没有在公开文档中提供核心服务源码。它的开放性主要体现在接口和配置，而不是实现开源：

- 公共站点可访问大量公开 GitHub 仓库的 Wiki。
- 官方提供免认证远程 MCP，支持 `read_wiki_structure`、`read_wiki_contents`、`ask_question`。
- 仓库可以用 `.devin/wiki.json` steer Wiki 生成重点和页面结构。
- 私有仓库能力走 Devin app / Devin MCP 账号体系。

因此，DeepWiki 当前可以视为“闭源托管服务 + 开放只读 MCP + 可控生成配置”。这点对 Alembic 的启发很直接：即使不做公开托管服务，也可以把本地 Wiki 能力暴露成稳定的只读 MCP，让其他 Agent 安全地消费项目理解结果。

## 与 Alembic 的对比

| 维度 | Google Code Wiki | DeepWiki | Alembic 当前能力 | 差距与机会 |
|------|------------------|----------|------------------|------------|
| 产品定位 | Google/Gemini 生态的公开代码理解门户 | Devin 生态的仓库 Wiki、Ask Devin 上下文层和公共 MCP | 本地/项目内的知识库、Recipe、Guard、Skill、Agent harness | Alembic 可从“知识后台”升级为“项目理解与行动前台” |
| 主要用户 | 开源项目浏览者、新贡献者、维护者、问答用户 | 开源浏览者、Devin 用户、需要 MCP 知识源的 Agent | 项目开发者、团队知识维护者、Agent | Code Wiki/DeepWiki 更适合 onboarding，Alembic 更适合持续协作和治理 |
| 知识来源 | GitHub 源码、README、docs、测试、配置 | GitHub 源码、文档、配置、`.devin/wiki.json` steering | 代码扫描、候选知识、Recipe、Graph、Search、Bootstrap、Rescan | Alembic 的知识更可治理，但需要更强的 Wiki/topic 呈现层 |
| 输出形态 | 托管 Wiki、图、Chat、源码链接 | 托管 Wiki、图、源码引用、Ask Devin、MCP 工具 | `alembic_wiki`、Dashboard Wiki、Rules、Skills、Snippets、Guard | Alembic 输出更丰富，但需要统一为一个项目理解界面 |
| 主题规划 | 公开表现为自动主题树 | 自动 cluster-based planning，可用 `.devin/wiki.json` 覆盖 | `alembic_wiki plan` 已有 topic/dataPackage 雏形 | Alembic 应引入可控 Topic Plan 与团队 steer 文件 |
| 更新机制 | 周期性动态刷新，可能按项目热度和使用量调度 | 页面显示 `Last indexed` 与 commit，Devin 内连接仓库后自动生成 | 冷启动、增量 rescan、evolve、file diff、缓存清理 | Alembic 可做更明确的变更影响、主题 stale 标记和知识演进记录 |
| 人工治理 | 自动生成，不接受直接 PR 编辑 | 支持 `.devin/wiki.json` steer 和页面 Edit Wiki 入口 | Candidate review、Recipe lifecycle、Guard、confirm_usage | Alembic 可把“人工 steering”和“候选审批”合并成更可信治理流 |
| Agent 接口 | 公开资料未发现官方 MCP | 官方免认证远程 MCP，公开仓库可读可问 | 本地 MCP tools：Search、Knowledge、Graph、Wiki、Skill 等 | Alembic 可提供只读 Wiki MCP 层，供外部 Agent 安全消费 |
| Chat 上下文 | 以 Wiki 内容作为主要上下文 | DeepWiki + Ask Devin，结合代码搜索和 Wiki | SearchEngine、Recipe、MemoryRetriever、MCP tools | Alembic 可把 Wiki/Recipe/Graph/SourceRef 组成更强 RAG 层 |
| 可执行性 | 主要是理解和问答 | 公共版主要是理解和问答；Devin app 内可进一步规划和创建 session | 可以触发 Guard、Skill、Rescan、Evolve、Task | Alembic 可形成“从理解到行动”的差异化 |
| 私有仓库 | 计划 Gemini CLI 扩展本地/自有环境生成托管 | Devin app / Devin MCP 账号体系 | 本来就是本地项目运行，保护源码和运行时数据 | Alembic 可天然做私有仓库优先、团队可控的 Code Wiki/DeepWiki |

## Alembic 可借鉴的设计

### 1. 把 Wiki 从“文档产物”升级为“项目理解索引”

Alembic 已有 `alembic_wiki` MCP、Dashboard Wiki、`WikiGenerator` 和 `alembic-devdocs` Skill。但从 Code Wiki 看，Wiki 不应只是生成 Markdown，而应成为多个能力的入口：

- 给人看：主题化仓库说明、架构图、源码链接。
- 给 Agent 用：高质量 RAG 上下文。
- 给治理用：展示哪些 Wiki section 来自哪些 Recipe、候选、源码证据。
- 给演进用：显示最近 rescan 后哪些主题发生变化。

建议将 Alembic Wiki 定义为 `Project Understanding Surface`，它不是单独功能，而是 Knowledge/Graph/Search/Skill/Guard 的可视层。

### 2. 引入 Topic Plan 作为稳定中间层

Code Wiki 和 DeepWiki 都值得学的是主题规划。Alembic 当前 `alembic_wiki plan` 已经有 topic + data package 雏形，可以进一步标准化为：

```ts
interface WikiTopicPlan {
  topicId: string;
  title: string;
  audience: 'newcomer' | 'maintainer' | 'agent' | 'reviewer';
  sourceRefs: Array<{ path: string; reason: string; commit?: string }>;
  relatedRecipes: string[];
  relatedSkills: string[];
  graphNodes: string[];
  staleRisk: 'low' | 'medium' | 'high';
  lastGeneratedAt?: string;
}
```

这样 Wiki topic 不只是文章标题，而是可增量更新、可检索、可审计、可触发行动的结构化对象。

DeepWiki 的 `.devin/wiki.json` 说明了另一个关键点：Topic Plan 不应该只由模型自动决定，也要允许团队显式 steer。Alembic 可以设计 `Alembic/wiki.config.json` 或类似配置：

```json
{
  "repoNotes": [
    {
      "content": "增量扫描、Recipe 演进和 Guard 是本项目最关键的主链路，Wiki 应优先覆盖 lib/workflows、lib/service 和 skills。",
      "author": "maintainer"
    }
  ],
  "topics": [
    {
      "title": "Bootstrap 与 Rescan 长链路",
      "purpose": "解释冷启动、增量扫描、file diff、dimension plan 和 evolution 的关系",
      "parent": null,
      "mustInclude": ["lib/workflows", "docs/bootstrap-rescan-chain-test-plan.md"],
      "relatedSkills": ["progressive-chain-validation"]
    }
  ]
}
```

这个配置不应替代自动分析，而应成为“团队意图层”：自动规划负责发现，团队配置负责优先级、覆盖范围和不能遗漏的核心主题。

### 3. 建立源码证据链接规范

Code Wiki 的源码链接非常密集，这是 AI 文档可信度的关键。Alembic Wiki 也应强制每个主题至少包含：

- `sourceRefs`：真实源码路径和理由。
- `recipeRefs`：对应 Recipe 或候选知识。
- `generatedFrom`：来自 bootstrap/rescan 的哪个 session。
- `snapshot`：生成时的 commit 或文件 diff snapshot。
- `confidence`：生成置信度和缺口说明。

这与 Alembic 的 Recipe reasoning、sourceRefs、candidate lifecycle 可以统一。

### 4. 将 Chat 绑定到 Wiki + Recipe + Graph

Code Wiki 的 Chat 以 Wiki 内容为主要上下文。Alembic 可以做更强的组合检索：

```text
user question
  -> intent classification
  -> WikiTopic search
  -> Recipe search
  -> KnowledgeGraph expansion
  -> SourceRef retrieval
  -> Guard/Skill action suggestion
  -> answer with evidence and next action
```

例如用户问“这个项目的增量扫描链路怎么测试”，Alembic 不只返回文档，还可以推荐 `progressive-chain-validation` Skill，列出相关测试节点、最近 rescan 证据和可执行命令。

### 5. 增量刷新要以“主题影响”为单位

Code Wiki 的刷新价值来自“代码变了，相关文档也变”。Alembic 已有 file diff 和 rescan 逻辑，可以进一步生成 `WikiImpactPlan`：

```text
changed files
  -> affected targets/modules
  -> affected recipes
  -> affected wiki topics
  -> affected skills
  -> regenerate / mark stale / request review
```

这会让 Alembic Wiki 从静态结果变成持续维护的活知识层。它也能和此前设计的 `Workflow Skill Forge` 结合：当同一种验证流程在多个 topic 或任务里重复出现，就生成 Skill candidate。

### 6. 图示应从 Knowledge Graph 生成，而不是让模型凭空画

Code Wiki 图示的体验很强，但 Alembic 需要更强调可解释性。建议图生成来源优先级：

1. 结构扫描和模块依赖。
2. Knowledge Graph 实体关系。
3. Recipe relations。
4. 文件 diff impact。
5. LLM 补充布局和说明。

模型可以负责命名、摘要和布局建议，但边的来源应可追溯。

### 7. 私有仓库优先是 Alembic 的天然优势

Code Wiki 对私有仓库还在 Coming Soon，且选择本地/自有环境生成托管。Alembic 从一开始就是项目内运行，已有 PathGuard、dev repo 保护、SQLite/VectorStore、本地 Dashboard、MCP tools 等基础设施。

因此 Alembic 可以定位为：

- 本地优先的 Code Wiki。
- 可治理的 Code Wiki。
- 可执行的 Code Wiki。
- 面向 Agent 的 Code Wiki。

### 8. 提供只读 Wiki MCP

DeepWiki MCP 是一个很直接的可借鉴点。Alembic 已经有丰富 MCP tools，但可以增加更窄、更安全、更适合外部 Agent 消费的 Wiki 只读接口：

- `read_wiki_structure`：返回项目 Wiki topic tree、更新时间、stale 状态和相关 Recipe/Skill。
- `read_wiki_contents`：按 topicId 返回 Wiki 正文、sourceRefs、recipeRefs、graphRefs。
- `ask_wiki_question`：只基于 Wiki + Recipe + Graph + SourceRef 回答项目问题。

它和现有 `alembic_search`、`alembic_knowledge` 的区别是：这个接口不暴露完整知识库写能力，也不允许直接修改项目文件，适合作为外部 Agent 的默认安全上下文源。

### 9. 将“生成可控性”纳入治理

DeepWiki 的 steer 文件解决的是“自动生成会遗漏重点”的问题。Alembic 可以进一步把它接入治理：

- 当 Wiki 生成缺证据时，创建 candidate 或 topic gap。
- 当用户在 Dashboard 中调整 topic 结构时，回写到 Wiki config。
- 当 rescan 发现某个 topic 长期 stale，提示维护者补充 repoNotes 或拆分 topics。
- 当某个 topic 频繁触发相同验证流程，生成 Skill candidate。

这样 Wiki 不是一次性生成结果，而是团队意图、代码事实、知识治理和 Agent 工作流之间的可维护协议。

## 建议的 Alembic 产品化路线

### P0：强化现有 Wiki 生成闭环

- 明确 `alembic_wiki plan` 的 topic/dataPackage schema。
- 每个 topic 必须包含 sourceRefs、recipeRefs、graphRefs、confidence。
- Dashboard Wiki 展示 last generated、source refs、related Recipes。
- Wiki finalize 做重复主题、缺证据、断链检查。
- 支持 `Alembic/wiki.config.json` 一类 steer 配置，用于表达 repoNotes、重点目录和必须生成的 topics。

### P1：增加 Code Wiki 式仓库入口页

- 为项目生成一个 `Project Overview` 首页。
- 首页展示模块地图、关键能力、主要工作流、知识健康度、最近变更。
- 每个主题页提供“查看源码”“查看 Recipe”“运行相关 Skill”“Guard 审计”入口。

### P2：引入 Wiki Impact 增量刷新

- 基于 file diff 计算受影响 topics。
- Rescan 后自动标记 stale topic。
- 只重写受影响 topic，不重写整站。
- 记录 topic history，展示本次变更影响了哪些理解页面。

### P3：Wiki Chat 与行动推荐

- Chat 检索 Wiki + Recipe + Graph + sourceRefs。
- 回答时给出证据链。
- 当问题可执行时，推荐 Skill、Guard、Rescan、Evolve 或 progressive validation。
- 对高风险行动保持用户确认和权限边界。
- 提供 DeepWiki MCP 风格的只读 Wiki tools，让外部 Agent 可以读结构、读内容和问答，但不能写知识库或改项目文件。

### P4：Workflow-to-Skill 与 Wiki 联动

- 从用户在 Wiki/Chat/Agent 中反复执行的流程中抽取 workflow episode。
- 生成 Skill candidate。
- 在相关 Wiki topic 中显示“可执行工作流”。
- 使用 Dashboard 审批后发布到项目 Skill。

## 对既有文档的衔接

这份分析可以和以下设计形成连续路线：

- `bootstrap-rescan-chain-workflow-strategy.md`：长链路验证方法如何沉淀。
- `progressive-chain-validation-skill-design.md`：将验证方法变成通用 Skill。
- `workflow-to-skill-generation-design.md`：从真实工作流中生成 Skill。
- 本文：把 Code Wiki 的“代码理解门户”思想引入 Alembic，使 Wiki、Skill、Graph、Recipe 和 Rescan 形成一个统一的项目理解与行动平面。
- 本文新增 DeepWiki 对比：把 `.devin/wiki.json` 式可控生成、公共 Wiki MCP、Last indexed/source citations 等能力纳入 Alembic 的 Wiki 设计参考。

最终方向不是复制 Code Wiki 或 DeepWiki，而是让 Alembic 形成自己的差异化：Code Wiki 和 DeepWiki 让代码库可理解、可问答；Alembic 应让代码库可理解、可治理、可执行、可演进。