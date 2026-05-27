# Codex 插件生成车间设计记录

日期：2026-05-08

本文档记录关于把 Alembic 拆解重组为 **Codex 插件生成车间** 的产品与工程判断，供后续窗口继续推进。

## 背景

在讨论 `Codex Observer` 时，一个更高杠杆的方向浮现出来：与其把每个想法都直接塞进 Alembic，或者为每个想法手写一套插件骨架，不如让 Alembic 成为一个可以快速把想法生成 Codex 插件的车间。

Alembic 当前已经有足够多的基础能力：

- 项目理解与结构分析
- Recipes / skills / 规则沉淀
- MCP server 与工具分层
- daemon、jobs、dashboard、本地状态
- Codex plugin packaging
- plugin verifier
- 文档与 README 生成能力
- 对 Agent 工作流的拆解与治理经验

这些能力组合起来，可以支持一个新的主线：**从自然语言想法快速生成可运行、可验证、可继续迭代的 Codex 插件。**

## 核心判断

建议采用：

```text
Alembic 是车间。
插件是产品。
```

也就是说：

- 插件工厂本身先留在 Alembic 内。
- 生成出来的插件使用独立仓库。
- Observer、Notifier、Reviewer、Guard 类插件都可以是工厂产物。
- Alembic 不需要背负每个插件的产品复杂度。

这比把 `Codex Observer` 直接做成 Alembic 功能更干净，也比一开始就拆一个“插件工厂”新仓库更稳。

## 是否需要新建仓库

### 插件工厂本身

**暂时不建议新建独立仓库。**

原因：

- 插件工厂的核心不是模板，而是 Alembic 已经具备的理解、拆解、生成、验证和沉淀能力。
- 过早拆仓库会迫使工厂重新搬运 Alembic 的基础设施。
- 当前更需要快速试错生成能力，而不是先做一个干净但空心的独立工具。
- Alembic 的现有 daemon、dashboard、MCP、verifier、skills 机制都可以直接复用。

推荐先在 Alembic 内实现为：

```text
alembic create codex-plugin
```

或：

```text
alembic factory codex-plugin
```

### 生成出来的插件

**建议单独仓库。**

例如：

```text
codex-observer/
codex-notifier/
codex-reviewer/
codex-plugin-lab/
```

这样每个插件都可以保持“小而美”：

- 用户心智清晰
- 安装解释简单
- 发布节奏独立
- issue / README / roadmap 独立
- 不被 Alembic 主仓库复杂度影响

## 什么时候拆出插件工厂

未来可以考虑把工厂拆出 Alembic，但不应该作为第一步。

拆分条件：

- 很多用户只想使用插件生成器，不想理解 Alembic。
- 工厂已经不依赖 Alembic 的 project memory、daemon、dashboard。
- 工厂能独立成为轻量 CLI，例如 `codex-plugin-factory create observer`。
- 工厂发布节奏开始和 Alembic 主线互相拖累。
- 生成能力已经稳定，不再频繁依赖 Alembic 内部 API 快速变化。

在此之前，工厂应留在 Alembic 内，作为 Alembic 的高杠杆能力。

## 产品定位

暂定名称：

```text
Alembic Plugin Factory
```

一句话：

```text
把自然语言插件想法快速生成可运行、可验证、可发布的 Codex 插件骨架。
```

它应该回答的问题：

- 这个想法适合做成哪类 Codex 插件？
- 应该是 skill-only、MCP、hooks，还是 hybrid？
- 需要哪些文件、metadata、默认 prompt、README、测试和验证脚本？
- 插件是否应该单独成仓库？
- 如何保持小而美，不把能力做成大而全？

## 插件类型

工厂至少支持以下模板：

1. **Skill-only 插件**
   只生成 `SKILL.md`、assets、plugin metadata。适合工作流、规范、知识型插件。

2. **MCP 插件**
   生成 MCP server、tools、schemas、README、测试。适合真正需要工具调用的插件。

3. **Hooks 插件**
   生成事件采集、日志、通知、审计、状态记录。`Codex Observer` 属于这一类。

4. **Hybrid 插件**
   组合 skills、MCP、hooks、sidecar UI 或 dashboard。适合完整产品。

5. **Marketplace-ready 插件**
   补全 logo、screenshots、default prompts、verification checklist、发布说明。

## MVP 体验

第一版可以非常具体：

```text
alembic create codex-plugin
```

交互输入：

```text
插件名：Codex Observer
一句话：不中断主 agent 的状态观察和自然语言问答
类型：hooks + mcp + skill
输出：../codex-observer
```

产出：

```text
codex-observer/
  .codex-plugin/plugin.json
  skills/codex-observer/SKILL.md
  mcp/server.ts
  hooks/collector.ts
  src/timeline/
  src/status/
  src/ask/
  README.md
  scripts/verify-plugin.mjs
  package.json
  tsconfig.json
```

MVP 不追求生成完整产品逻辑，而是生成一个：

- 结构正确
- 能安装
- 能启动
- 能通过基本校验
- 有清晰 README
- 有下一步实现 TODO
- 有可持续迭代边界

## 与 Codex Observer 的关系

`Codex Observer` 可以作为插件工厂生产出的第一个真实插件。

这有几个好处：

- Observer 保持独立小仓库，不拖累 Alembic。
- Alembic 的工厂能力有真实用例验证。
- 生成器可以围绕真实痛点迭代，而不是只生成空模板。
- 后续其他插件可以复用 Observer 过程中沉淀的 hooks、timeline、ask 模式。

关系可以理解为：

```text
Alembic Plugin Factory
  -> 生成 codex-observer
  -> 生成 codex-notifier
  -> 生成 codex-reviewer
  -> 生成更多小插件
```

## 与 Alembic 主线的关系

插件工厂适合作为 Alembic 的一个新主线，但不要吞掉 Alembic 原有定位。

Alembic 原有定位：

- Auto Source Distill
- 项目知识
- Recipes
- Guard
- 代码库记忆
- agent bootstrap / rescan

插件工厂新增定位：

- 把项目知识和 agent workflow 经验转化为插件生产力
- 把“想法”变成“可运行插件”
- 帮助用户快速做小而美的 Codex 插件

两者可以相互增强：

- Alembic 的项目理解能力帮助生成更贴近代码库的插件。
- 插件工厂产出的插件可以反过来成为 Alembic 生态。
- Alembic 不需要把所有想法内置，只需要越来越擅长生产插件。

## 建议实现边界

Alembic 内部可以新增：

```text
lib/plugin-factory/
  intent/
  templates/
  generators/
  verifier/
  planner/

templates/codex-plugin/
  skill-only/
  mcp/
  hooks/
  hybrid/

docs-dev/skills-plugins/
  codex-plugin-factory-design.md
```

CLI 入口：

```text
bin/cli.ts
  create codex-plugin
```

或者先用脚本验证：

```text
scripts/create-codex-plugin.mjs
```

第一版建议避免引入太多抽象。先用真实产物验证模板质量，再抽取通用生成器。

## 质量标准

生成出来的插件至少应满足：

- `plugin.json` schema 合法
- skills 路径正确
- MCP 配置可启动或有明确 fallback
- README 说明安装、运行、开发和验证
- 默认 prompts 能体现插件价值
- verifier 能检查基本结构
- package metadata 清楚
- 不默认执行破坏性操作
- 不把 Alembic 作为必需依赖，除非用户选择 Alembic integration

## 风险

主要风险：

- 工厂变成大而全平台，失去“小而美”插件生产效率。
- 模板过多但质量不高，生成物看起来像半成品。
- 过早抽象导致实现速度变慢。
- 和 Alembic 主线混在一起，让用户搞不清 Alembic 到底是什么。
- 生成出来的插件过度依赖 Alembic，失去独立产品价值。

应对策略：

- 先用 `Codex Observer` 作为唯一真实样板。
- 先生成最小可运行结构，不追求全自动完成业务逻辑。
- 明确区分“工厂能力”和“插件产品”。
- 生成插件默认独立仓库。
- Alembic integration 必须是可选项。

## 下一步

建议下一窗口可以直接从以下任务开始：

1. 确定命令名：`alembic create codex-plugin` 还是 `alembic factory codex-plugin`。
2. 确定第一版模板：优先 `hooks + mcp + skill`，服务 `Codex Observer`。
3. 在 Alembic 中新增最小工厂模块或脚本。
4. 用工厂生成第一个独立仓库 `codex-observer`。
5. 为生成结果添加 verifier。
6. 根据生成过程反推模板和 README 质量标准。

## 结论

当前判断：

```text
不要先新建插件工厂仓库。
先把插件工厂作为 Alembic 的能力做出来。
用它生成独立的小插件仓库。
等工厂稳定后，再考虑拆成独立项目。
```

一句话总结：

```text
Alembic 做车间，Codex Observer 做第一件产品。
```
