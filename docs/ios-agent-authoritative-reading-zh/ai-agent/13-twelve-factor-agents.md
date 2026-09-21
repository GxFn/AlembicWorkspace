# 12-Factor Agents：构建可靠 LLM 应用的原则

- **原文标题**：*12-Factor Agents — Principles for building reliable LLM applications*
- **作者/机构**：Dex Horthy；HumanLayer；仓库贡献者
- **唯一内容源**：[HumanLayer 官方仓库](https://github.com/humanlayer/12-factor-agents)
- **固定版本**：[提交 `d20c728368bf9c189d6d7aab704744decb6ec0cc`](https://github.com/humanlayer/12-factor-agents/tree/d20c728368bf9c189d6d7aab704744decb6ec0cc)
- **正文与图片许可证**：[Creative Commons Attribution-ShareAlike 4.0 International（CC BY-SA 4.0）](https://creativecommons.org/licenses/by-sa/4.0/)
- **代码许可证**：[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- **翻译日期**：2026-07-27
- **译文性质**：非官方中文翻译。本译文属于改编：自然语言正文、标题和图注译为中文；原仓库的 README、软件史、12 个零填充 factor 文件及 pre-fetch 附录合并为单一 Markdown；完全重复的导航列表只保留一次；代码保持原文；相对仓库链接和图片改成固定提交下的绝对 GitHub URL。上述修改并非原作者所作。
- **译文许可**：本译文的文字与排版改编以同一 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 许可共享；其中原样保留的代码仍按 [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) 许可使用。

[![代码许可证：Apache 2.0](https://img.shields.io/badge/Code-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![内容许可证：CC BY-SA 4.0](https://img.shields.io/badge/Content-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Discord Server](https://img.shields.io/badge/chat-discord-5865F2)](https://humanlayer.dev/discord)
<a href="https://www.youtube.com/watch?v=8kMaTybvDUw"><img src="https://img.shields.io/badge/aidotengineer-conf_talk_(17m)-white" alt="AI Engineer 演讲（17 分钟）" /></a>
[![YouTube 深入讲解](https://img.shields.io/badge/youtube-deep_dive-crimson)](https://www.youtube.com/watch?v=yxJDyQ8v6P0)

> 追踪像素说明：原 README 嵌入了一个无可见内容的 [Scarf analytics 像素](https://static.scarf.sh/a.png?x-pxid=2acad99a-c2d9-48df-86f5-9ca8061b7bf9)。为避免阅读本地译文时主动发送遥测请求，这里保留其绝对来源和修改说明，但不嵌入该像素。

<!-- 原 README 的 Scarf 像素原样记录于此，但特意保持注释状态，以免本地阅读触发遥测：
<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=2acad99a-c2d9-48df-86f5-9ca8061b7bf9" />
-->

本项目秉承 [12-Factor App](https://12factor.net/) 的精神。项目源码公开于 [HumanLayer/12-factor-agents](https://github.com/humanlayer/12-factor-agents)，作者欢迎反馈和贡献：让我们一起把这件事弄明白。

> **提示**
>
> 错过 AI Engineer World's Fair？[在这里观看演讲](https://www.youtube.com/watch?v=8kMaTybvDUw)。
>
> 在找 Context Engineering？[直接跳到原则 3 的固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-03-own-your-context-window.md)。
>
> 想为 `npx/uvx create-12-factor-agent` 做贡献？参阅[讨论帖](https://github.com/humanlayer/12-factor-agents/discussions/61)。

[![12-Factor Agents 首页视觉导航](https://github.com/user-attachments/assets/23286ad8-7bef-4902-b371-88ff6a22e998)](#内容导航)

## README：为什么写这份指南

嗨，我是 Dex。我已经[折腾 AI](https://youtu.be/8bIHcttkOTE)、研究 [AI Agent](https://theouterloop.substack.com) [有一阵子了](https://humanlayer.dev)。

**市面上的 Agent 框架我几乎都试过**：从即插即用的 CrewAI、LangChain，到号称“极简”的 smolagents，再到号称“生产级”的 LangGraph、Griptape 等等。

**我也和许多非常厉害的创业者聊过**，既有 YC 体系内的，也有体系外的；他们都在用 AI 做令人印象深刻的产品。大多数人都在自己搭栈。我很少看到面向生产环境客户的 Agent 真正在使用这些框架。

**让我意外的是**，很多自称“AI Agent”的产品其实并没有那么强的 Agent 性。它们大多仍是确定性代码，只是在恰当的位置点缀几个 LLM 步骤，从而让体验真正显得神奇。

Agent——至少是优秀的 Agent——并不遵循“[这是提示、这是一袋工具，不断循环直到达到目标](https://www.anthropic.com/engineering/building-effective-agents#agents)”的模式。相反，它们主要仍由软件组成。

于是，我开始回答这个问题：

> ### 我们可以遵循哪些原则，构建真正好到足以交付给生产客户的 LLM 软件？

欢迎来到 12-Factor Agents。正如从 Daley 以来的每一任芝加哥市长一直在这座城市各大机场到处贴的那句话：很高兴你来了。

特别感谢 [@iantbutler01](https://github.com/iantbutler01)、[@tnm](https://github.com/tnm)、[@hellovai](https://www.github.com/hellovai)、[@stantonk](https://www.github.com/stantonk)、[@balanceiskey](https://www.github.com/balanceiskey)、[@AdjectiveAllison](https://www.github.com/AdjectiveAllison)、[@pfbyjy](https://www.github.com/pfbyjy)、[@a-churchill](https://www.github.com/a-churchill) 和 SF MLOps 社区对本指南的早期反馈。

## 内容导航

即使 LLM [继续以指数速度变强](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-10-small-focused-agents.md#what-if-llms-get-smarter)，仍会有一些核心工程技术，能够使 LLM 软件更可靠、更具扩展性，也更容易维护。

- [我们如何走到这里：软件简史](#我们如何走到这里软件简史)
- [原则 1：把自然语言转换为工具调用](#原则-1把自然语言转换为工具调用)
- [原则 2：掌控自己的提示](#原则-2掌控自己的提示)
- [原则 3：掌控自己的上下文窗口](#原则-3掌控自己的上下文窗口)
- [原则 4：工具只是结构化输出](#原则-4工具只是结构化输出)
- [原则 5：统一执行状态与业务状态](#原则-5统一执行状态与业务状态)
- [原则 6：用简单 API 启动暂停恢复](#原则-6用简单-api-启动暂停恢复)
- [原则 7：通过工具调用联系人类](#原则-7通过工具调用联系人类)
- [原则 8：掌控自己的控制流](#原则-8掌控自己的控制流)
- [原则 9：把错误压缩进上下文窗口](#原则-9把错误压缩进上下文窗口)
- [原则 10：小而专注的 Agent](#原则-10小而专注的-agent)
- [原则 11：从任何地方触发在用户所在之处与他们相遇](#原则-11从任何地方触发在用户所在之处与他们相遇)
- [原则 12：把 Agent 做成无状态 reducer](#原则-12把-agent-做成无状态-reducer)
- [荣誉提名／原则 13：预取可能需要的全部上下文](#附录原则-13预取可能需要的全部上下文)

原 README 在末尾又完整重复了一次同一份 12 条原则导航；本译文按任务要求合并为上面这一份，不重复机械抄录。各条原始文件固定链接如下：

- [软件简史原文件](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/brief-history-of-software.md)
- [Factor 01](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-01-natural-language-to-tool-calls.md)
- [Factor 02](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-02-own-your-prompts.md)
- [Factor 03](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-03-own-your-context-window.md)
- [Factor 04](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-04-tools-are-structured-outputs.md)
- [Factor 05](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-05-unify-execution-state.md)
- [Factor 06](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-06-launch-pause-resume.md)
- [Factor 07](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-07-contact-humans-with-tools.md)
- [Factor 08](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-08-own-your-control-flow.md)
- [Factor 09](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-09-compact-errors.md)
- [Factor 10](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-10-small-focused-agents.md)
- [Factor 11](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-11-trigger-from-anywhere.md)
- [Factor 12](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-12-stateless-reducer.md)
- [Pre-fetch 附录](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/appendix-13-pre-fetch.md)

### 视觉导航

| | | |
| --- | --- | --- |
| [![原则 1](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/110-natural-language-tool-calls.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-01-natural-language-to-tool-calls.md) | [![原则 2](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/120-own-your-prompts.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-02-own-your-prompts.md) | [![原则 3](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/130-own-your-context-building.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-03-own-your-context-window.md) |
| [![原则 4](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/140-tools-are-just-structured-outputs.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-04-tools-are-structured-outputs.md) | [![原则 5](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/150-unify-state.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-05-unify-execution-state.md) | [![原则 6](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/160-pause-resume-with-simple-apis.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-06-launch-pause-resume.md) |
| [![原则 7](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/170-contact-humans-with-tools.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-07-contact-humans-with-tools.md) | [![原则 8](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/180-control-flow.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-08-own-your-control-flow.md) | [![原则 9](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/190-factor-9-errors-static.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-09-compact-errors.md) |
| [![原则 10](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1a0-small-focused-agents.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-10-small-focused-agents.md) | [![原则 11](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1b0-trigger-from-anywhere.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-11-trigger-from-anywhere.md) | [![原则 12](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1c0-stateless-reducer.png)](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-12-stateless-reducer.md) |

## README：我们如何走到这里（短版）

如果想深入了解作者的 Agent 探索历程，以及是什么把这份指南带到这里，请阅读后文“[我们如何走到这里：软件简史](#我们如何走到这里软件简史)”。下面先给出 README 中的快速版本。

### Agent 的承诺

我们会大量谈到有向图（Directed Graph，DG）以及它们的无环朋友 DAG。先指出一件事：软件本来就是有向图。过去人们用流程图表示程序是有原因的。

![软件 DAG](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/010-software-dag.png)

### 从代码到 DAG

大约 20 年前，DAG 编排器开始流行。经典工具包括 [Airflow](https://airflow.apache.org/)、[Prefect](https://www.prefect.io/)，也包括一些更早的工具，以及较新的 [Dagster](https://dagster.io/)、[Inngest](https://www.inngest.com/) 和 [Windmill](https://www.windmill.dev/)。它们沿用相同的图模式，并额外提供可观测性、模块化、重试和管理等能力。

![DAG 编排器](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/015-dag-orchestrators.png)

### Agent 的承诺

作者不是第一个[这样说的人](https://youtu.be/Dc99-zTMyMg?si=bcT0hIwWij2mR-40&t=73)，但他开始学习 Agent 时最大的收获是：可以把 DAG 扔掉。不再由软件工程师编写每一个步骤和边缘情况，而是给 Agent 一个目标和一组转换：

![Agent DAG](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/025-agent-dag.png)

然后让 LLM 实时做决定，找出路径。

![由 LLM 选择路径的 Agent DAG](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/026-agent-dag-lines.png)

这里的承诺是：你可以少写一些软件；只给 LLM 图的“边”，让它自己找出节点。你可以从错误中恢复，可以少写代码，也可能发现 LLM 找到了问题的新解法。

### Agent 作为循环

后文会看到，事实证明，这种方式并没有完全奏效。

再深入一步：Agent 包含一个循环，原文说是三个步骤，实际列出了以下四项：

1. LLM 确定工作流中的下一步，并输出结构化 JSON（“工具调用”）。
2. 确定性代码执行工具调用。
3. 把结果追加到上下文窗口。
4. 重复上述过程，直到下一步被判定为 `done`。

```python
initial_event = {"message": "..."}
context = [initial_event]
while True:
  next_step = await llm.determine_next_step(context)
  context.append(next_step)

  if (next_step.intent === "done"):
    return next_step.final_answer

  result = await execute_step(next_step)
  context.append(result)
```

初始上下文只是起始事件：可能是用户消息、cron 触发，也可能是 webhook 等。随后，我们要求 LLM 选择下一步（工具），或者判定工作已经完成。

下面是一个多步示例：

[![Agent 循环动画](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/027-agent-loop-animation.gif)](https://github.com/user-attachments/assets/3beb0966-fdb1-4c12-a47f-ed4e8240f8fd)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/027-agent-loop-animation.gif">GIF 版本</a></summary>

![Agent 循环动画 GIF](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/027-agent-loop-animation.gif)

</details>

## README：为什么是 12-Factor Agents

归根到底，这种方法的效果并没有达到我们的期待。

在构建 HumanLayer 的过程中，作者至少和 100 位 SaaS 构建者聊过，其中大多数是技术型创始人；他们都想让现有产品更具 Agent 性。这段旅程通常如下：

1. 决定要构建 Agent。
2. 做产品设计、UX 映射，确定要解决的问题。
3. 为了快速推进，拿来 `$FRAMEWORK` 就开始做。
4. 做到 70%–80% 的质量门槛。
5. 意识到对大多数面向客户的功能而言，80% 远远不够。
6. 意识到要超过 80%，就必须逆向分析框架、提示和流程等。
7. 推倒重来。

### 一些随手写下的免责声明

**免责声明 1：** 作者不确定该在哪里说这句话，但这里和任何地方一样合适：**这绝不是在嘲讽任何现有框架，也不是在嘲讽开发这些框架的聪明人。** 这些框架让许多不可思议的事成为可能，也加速了 AI 生态的发展。

作者希望本文的一个结果，是 Agent 框架构建者能够从他自己和其他人的经历中吸取经验，把框架做得更好，尤其服务于那些既想快速推进、又需要深度控制的构建者。

**免责声明 2：** 本文不会讨论 MCP。你大概能看出它适合放在哪里。

**免责声明 3：** 示例主要使用 TypeScript，原因见[这篇帖子](https://www.linkedin.com/posts/dexterihorthy_llms-typescript-aiagents-activity-7290858296679313408-Lh9e?utm_source=share&utm_medium=member_desktop&rcm=ACoAAA4oHTkByAiD-wZjnGsMBUL_JT6nyyhOh30)，但这些内容同样适用于 Python 或你偏爱的任何其他语言。

好了，回到正题。

### 优秀 LLM 应用的设计模式

在翻过数百个 AI 库、与数十位创业者共事之后，作者的直觉是：

1. 有一些核心要素能让 Agent 变得优秀。
2. 全面押注某个框架，进行实质上的绿地重写，可能适得其反。
3. 有一些核心原则能让 Agent 变得优秀；如果引入一个框架，你通常会获得其中大部分或全部。
4. **但是**，作者见过的、让构建者最快把高质量 AI 软件交到客户手里的办法，是从 Agent 构建中抽取小而模块化的概念，再把它们融入现有产品。
5. 即使没有 AI 背景，大多数熟练的软件工程师也能定义并应用这些 Agent 模块化概念。

> #### 作者见过的最快办法，是从 Agent 构建中抽取小而模块化的概念，再把它们融入现有产品，从而把优秀的 AI 软件交到客户手中。

## README：荣誉提名与其他建议

- [原则 13：预取可能需要的全部上下文](#附录原则-13预取可能需要的全部上下文)

## README：相关资源

- [参与本指南贡献](https://github.com/humanlayer/12-factor-agents)
- 2025 年 3 月，作者在 [Tool Use podcast](https://youtu.be/8bIHcttkOTE) 中谈到了其中许多内容
- 作者在 [The Outer Loop](https://theouterloop.substack.com) 撰写相关文章
- 作者与 [@hellovai](https://github.com/hellovai) 一起举办[关于最大化 LLM 性能的网络研讨会](https://github.com/hellovai/ai-that-works/tree/main)
- 依照这套方法构建开源 Agent：[got-agents/agents](https://github.com/got-agents/agents)
- 团队无视了自己全部建议，构建了一个[在 Kubernetes 中运行分布式 Agent 的框架](https://github.com/humanlayer/kubechain)
- 本指南引用的其他链接：
  - [12-Factor Apps](https://12factor.net)
  - [Building Effective Agents（Anthropic）](https://www.anthropic.com/engineering/building-effective-agents#agents)
  - [Prompts are Functions](https://thedataexchange.media/baml-revolution-in-ai-engineering/)
  - [Library patterns: Why frameworks are evil](https://tomasp.net/blog/2015/library-frameworks/)
  - [The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
  - [Mailcrew Agent](https://github.com/dexhorthy/mailcrew)
  - [Mailcrew Demo Video](https://www.youtube.com/watch?v=f_cKnoPC_Oo)
  - [Chainlit Demo](https://x.com/chainlit_io/status/1858613325921480922)
  - [TypeScript for LLMs](https://www.linkedin.com/posts/dexterihorthy_llms-typescript-aiagents-activity-7290858296679313408-Lh9e)
  - [Schema Aligned Parsing](https://www.boundaryml.com/blog/schema-aligned-parsing)
  - [Function Calling vs Structured Outputs vs JSON Mode](https://www.vellum.ai/blog/when-should-i-use-function-calling-structured-outputs-or-json-mode)
  - [BAML on GitHub](https://github.com/boundaryml/baml)
  - [OpenAI JSON vs Function Calling](https://docs.llamaindex.ai/en/stable/examples/llm/openai_json_vs_function_calling/)
  - [Outer Loop Agents](https://theouterloop.substack.com/p/openais-realtime-api-is-a-step-towards)
  - [Airflow](https://airflow.apache.org/)
  - [Prefect](https://www.prefect.io/)
  - [Dagster](https://dagster.io/)
  - [Inngest](https://www.inngest.com/)
  - [Windmill](https://www.windmill.dev/)
  - [The AI Agent Index（MIT）](https://aiagentindex.mit.edu/)
  - [NotebookLM on Finding Model Capability Boundaries](https://open.substack.com/pub/swyx/p/notebooklm?selection=08e1187c-cfee-4c63-93c9-71216640a5f8)

## README：贡献者

感谢所有为 12-Factor Agents 做出贡献的人。

| 贡献者 | 头像 | 贡献者 | 头像 |
| --- | --- | --- | --- |
| [dexhorthy](https://github.com/dexhorthy) | ![dexhorthy](https://avatars.githubusercontent.com/u/3730605?v=4&s=80) | [Sypherd](https://github.com/Sypherd) | ![Sypherd](https://avatars.githubusercontent.com/u/50557586?v=4&s=80) |
| [tofaramususa](https://github.com/tofaramususa) | ![tofaramususa](https://avatars.githubusercontent.com/u/66259401?v=4&s=80) | [a-churchill](https://github.com/a-churchill) | ![a-churchill](https://avatars.githubusercontent.com/u/18105223?v=4&s=80) |
| [Elijas](https://github.com/Elijas) | ![Elijas](https://avatars.githubusercontent.com/u/4084885?v=4&s=80) | [hugolmn](https://github.com/hugolmn) | ![hugolmn](https://avatars.githubusercontent.com/u/39267118?v=4&s=80) |
| [jeremypeters](https://github.com/jeremypeters) | ![jeremypeters](https://avatars.githubusercontent.com/u/1882972?v=4&s=80) | [kndl](https://github.com/kndl) | ![kndl](https://avatars.githubusercontent.com/u/380402?v=4&s=80) |
| [maciejkos](https://github.com/maciejkos) | ![maciejkos](https://avatars.githubusercontent.com/u/16674643?v=4&s=80) | [pfbyjy](https://github.com/pfbyjy) | ![pfbyjy](https://avatars.githubusercontent.com/u/85041180?v=4&s=80) |
| [0xRaduan](https://github.com/0xRaduan) | ![0xRaduan](https://avatars.githubusercontent.com/u/36044389?v=4&s=80) | [zyuanlim](https://github.com/zyuanlim) | ![zyuanlim](https://avatars.githubusercontent.com/u/7169731?v=4&s=80) |
| [lombardo-chcg](https://github.com/lombardo-chcg) | ![lombardo-chcg](https://avatars.githubusercontent.com/u/15862501?v=4&s=80) | [sahanatvessel](https://github.com/sahanatvessel) | ![sahanatvessel](https://avatars.githubusercontent.com/u/160066852?v=4&s=80) |

## README：许可证

全部文字内容和图片按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 许可使用。

代码按 [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) 许可使用。

---

## 我们如何走到这里：软件简史

[← 返回 README 部分](#readme为什么写这份指南) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/brief-history-of-software.md)

### 更长的版本：我们如何走到这里

#### 你不必听我的

无论你是刚接触 Agent，还是像作者一样脾气执拗的老兵，作者都会试着说服你：抛开关于 AI Agent 的大部分既有想法，退后一步，从第一性原理重新思考它们。（如果你没留意几周前 OpenAI Responses 的发布，这里先剧透一句：把**更多** Agent 逻辑藏到 API 后面，并不是答案。）

### Agent 是软件：一段简史

先谈谈我们是如何走到今天的。

#### 60 年前

我们会大量谈到有向图（Directed Graph，DG）以及它们的无环朋友 DAG。先指出一件事：软件本来就是有向图。过去人们用流程图表示程序是有原因的。

![60 年前：软件是一张有向图](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/010-software-dag.png)

#### 20 年前

大约 20 年前，DAG 编排器开始流行。经典工具包括 [Airflow](https://airflow.apache.org/)、[Prefect](https://www.prefect.io/)，也包括一些更早的工具，以及较新的 [Dagster](https://dagster.io/)、[Inngest](https://www.inngest.com/) 和 [Windmill](https://www.windmill.dev/)。它们沿用相同的图模式，并额外提供可观测性、模块化、重试和管理等能力。

![20 年前：DAG 编排器](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/015-dag-orchestrators.png)

#### 10～15 年前

当机器学习模型开始好用到足以产生实际价值时，人们开始在 DAG 中点缀 ML 模型。你可以想象这样的步骤：“把这一列的文本摘要到一个新列中”，或者“按严重程度或情绪对支持工单分类”。

![10～15 年前：点缀着机器学习的 DAG](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/020-dags-with-ml.png)

但归根到底，它仍然主要是我们熟悉的、可靠的确定性软件。

#### Agent 的承诺

作者不是第一个[这样说的人](https://youtu.be/Dc99-zTMyMg?si=bcT0hIwWij2mR-40&t=73)，但他开始学习 Agent 时最大的收获是：可以把 DAG 扔掉。不再由软件工程师编写每一个步骤和边缘情况，而是给 Agent 一个目标和一组转换：

![只提供转换的 Agent DAG](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/025-agent-dag.png)

然后让 LLM 实时做决定，找出路径。

![由 LLM 实时选择路径](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/026-agent-dag-lines.png)

这里的承诺是：你可以少写一些软件；只给 LLM 图的“边”，让它自己找出节点。你可以从错误中恢复，可以少写代码，也可能发现 LLM 找到了问题的新解法。

#### Agent 作为循环

换一种说法，你得到的是一个循环。原文称它包含三个步骤，实际列出了以下四项：

1. LLM 确定工作流中的下一步，并输出结构化 JSON（“工具调用”）。
2. 确定性代码执行工具调用。
3. 把结果追加到上下文窗口。
4. 重复上述过程，直到下一步被判定为 `done`。

```python
initial_event = {"message": "..."}
context = [initial_event]
while True:
  next_step = await llm.determine_next_step(context)
  context.append(next_step)

  if (next_step.intent === "done"):
    return next_step.final_answer

  result = await execute_step(next_step)
  context.append(result)
```

初始上下文只是起始事件：可能是用户消息、cron 触发，也可能是 webhook 等。随后，我们要求 LLM 选择下一步（工具），或者判定工作已经完成。

下面是一个多步示例：

[![Agent 循环多步示例动画](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/027-agent-loop-animation.gif)](https://github.com/user-attachments/assets/3beb0966-fdb1-4c12-a47f-ed4e8240f8fd)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/027-agent-loop-animation.gif">GIF 版本</a></summary>

![Agent 循环多步示例 GIF](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/027-agent-loop-animation.gif)

</details>

而刚刚生成的“物化”DAG 大致会是这样：

![Agent 循环物化后的 DAG](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/027-agent-loop-dag.png)

#### “不断循环直到解决问题”模式的问题

这个模式最大的问题是：

- 上下文窗口太长时，Agent 会迷失方向——反复尝试同一个已经失败的方案，越转越失控。
- 真的就这一条，但它已经足以让整个方法瘫痪。

即使你没有手搓过 Agent，也很可能在使用 Agent 式编程工具时见过这个长上下文问题。工具运行一阵后就会迷路，你只好重新开一个聊天。

作者甚至愿意提出一个自己经常听到、而你可能也已经形成直觉的判断：

> ### 即使模型支持越来越长的上下文窗口，小而专注的提示与上下文也**永远**会带来更好的结果。

作者聊过的大多数构建者，在意识到 10～20 轮以上就会变成 LLM 无法自行恢复的一团糟后，都把“工具调用循环”这个想法**放到了一边**。即使 Agent 有 90% 的时候做对，距离“足以交给客户”仍然差得很远。你能想象一个网页应用在 10% 的页面加载中崩溃吗？

**2025-06-09 更新：** 作者非常喜欢 [@swyx 的这段表述](https://x.com/swyx/status/1932125643384455237)：

<a href="https://x.com/swyx/status/1932125643384455237"><img width="593" alt="swyx 关于 Agent 长上下文问题的帖子截图" src="https://github.com/user-attachments/assets/c7d94042-e4b9-4b87-87fd-55c7ff94bb3b" /></a>

#### 真正有效的做法：微型 Agent

作者在真实项目里经常看到的一种做法，是把 Agent 模式点缀到一个范围更大、确定性更强的 DAG 中。

![确定性 DAG 中的微型 Agent](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/028-micro-agent-dag.png)

你可能会问：“既然如此，为什么还要使用 Agent？”后面很快会讲到。简而言之，让语言模型管理边界清晰的一组任务，可以很容易地纳入实时的人类反馈，把反馈翻译成工作流步骤，同时避免在上下文错误循环里失控。参见[原则 1](#原则-1把自然语言转换为工具调用)、[原则 3](#原则-3掌控自己的上下文窗口)和[原则 7](#原则-7通过工具调用联系人类)。

> #### 让语言模型管理边界清晰的一组任务，可以轻松纳入实时人类反馈……又不会在上下文错误循环中越转越失控。

#### 一个真实的微型 Agent

下面这个例子展示了：确定性代码如何运行一个微型 Agent，由它负责部署流程中需要人类参与的步骤。

![Deploybot 高层流程](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/029-deploybot-high-level.png)

- **人类**把 PR 合并到 GitHub 的 main 分支。
- **确定性代码**部署到 staging 环境。
- **确定性代码**对 staging 运行端到端（e2e）测试。
- **确定性代码**把生产部署交给 Agent，并提供初始上下文：“将 SHA 4af9ec0 部署到生产环境。”
- **Agent** 调用 `deploy_frontend_to_prod(4af9ec0)`。
- **确定性代码**请求人类批准这个动作。
- **人类**拒绝该动作，并反馈：“能先部署后端吗？”
- **Agent** 调用 `deploy_backend_to_prod(4af9ec0)`。
- **确定性代码**请求人类批准这个动作。
- **人类**批准该动作。
- **确定性代码**执行后端部署。
- **Agent** 调用 `deploy_frontend_to_prod(4af9ec0)`。
- **确定性代码**请求人类批准这个动作。
- **人类**批准该动作。
- **确定性代码**执行前端部署。
- **Agent**判断任务已经成功完成，流程结束。
- **确定性代码**对生产环境运行端到端测试。
- **确定性代码**完成任务；或者把失败交给回滚 Agent 审查，并视情况回滚。

[![Deploybot 动画](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/033-deploybot.gif)](https://github.com/user-attachments/assets/deb356e9-0198-45c2-9767-231cb569ae13)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/033-deploybot.gif">GIF 版本</a></summary>

![Deploybot GIF](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/033-deploybot.gif)

</details>

这个例子来自一个真实的[开源 Agent：HumanLayer 用它管理自己的部署](https://github.com/got-agents/agents/tree/main/deploybot-ts)。下面是作者在写原文前一周与它的一段真实对话：

![Deploybot 真实对话](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/035-deploybot-conversation.png)

团队并没有给这个 Agent 一大堆工具或任务。LLM 的主要价值，是解析人类的纯文本反馈，并提出更新后的行动方案。团队尽可能隔离任务与上下文，让 LLM 始终专注于一个只有 5～10 步的小工作流。

这里还有另一个[更经典的支持／聊天机器人演示](https://x.com/chainlit_io/status/1858613325921480922)。

#### 那么，Agent 到底是什么？

- **提示**：告诉 LLM 应该如何行动，以及它可以使用哪些“工具”。提示的输出是一个 JSON 对象，描述工作流的下一步，即“工具调用”或“函数调用”。参见[原则 2](#原则-2掌控自己的提示)。
- **switch 语句**：根据 LLM 返回的 JSON，决定如何处理。它是[原则 8](#原则-8掌控自己的控制流)的一部分。
- **累积的上下文**：保存已经发生的步骤及其结果列表。参见[原则 3](#原则-3掌控自己的上下文窗口)。
- **for 循环**：在 LLM 发出某种“终止”工具调用或纯文本响应之前，不断把 switch 语句的结果加入上下文窗口，再让 LLM 选择下一步。参见[原则 8](#原则-8掌控自己的控制流)。

![Agent 的四个组成部分](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/040-4-components.png)

在 Deploybot 的例子中，掌控控制流和上下文累积给团队带来几个好处：

- 在 **switch 语句**和 **for 循环**中，可以劫持控制流，暂停并等待人类输入，或者等待长时间运行的任务完成。
- 可以非常容易地序列化**上下文**窗口，以实现暂停与恢复。
- 可以在**提示**中极尽优化之能事，决定如何把指令和“迄今为止发生了什么”传给 LLM。

[第二部分](#内容导航)会把这些模式**形式化**，让你可以在任何软件项目中加入令人印象深刻的 AI 功能，而不必全面押注传统的“AI Agent”实现或定义。

[原则 1：把自然语言转换为工具调用 →](#原则-1把自然语言转换为工具调用)

---

## 原则 1：把自然语言转换为工具调用

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-01-natural-language-to-tool-calls.md)

Agent 构建中最常见的模式之一，是把自然语言转换为结构化工具调用。这个强大的模式让你可以构建能够推理任务并执行任务的 Agent。

![把自然语言转换为工具调用](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/110-natural-language-tool-calls.png)

当以原子方式应用时，这个模式就是把这样一句话：

> 能否为 Terri 创建一个 750 美元的付款链接，用于赞助二月的 AI Tinkerers 聚会？

简单地翻译为一个描述 Stripe API 调用的结构化对象：

```json
{
  "function": {
    "name": "create_payment_link",
    "parameters": {
      "amount": 750,
      "customer": "cust_128934ddasf9",
      "product": "prod_8675309",
      "price": "prc_09874329fds",
      "quantity": 1,
      "memo": "Hey Jeff - see below for the payment link for the february ai tinkerers meetup"
    }
  }
}
```

**说明：** 真实的 Stripe API 要复杂一些。一个[真正执行这项工作的 Agent](https://github.com/dexhorthy/mailcrew)（[视频](https://www.youtube.com/watch?v=f_cKnoPC_Oo)）会先列出客户、产品和价格等，再用正确 ID 构造这个载荷；或者直接把这些 ID 放进提示／上下文窗口中。后面会看到，这两件事在某种程度上其实是一回事。

接下来，确定性代码可以接过这个载荷，并对它做些事情。原则 3 会进一步讨论这一点。

```python
# The LLM takes natural language and returns a structured object
nextStep = await llm.determineNextStep(
  """
  create a payment link for $750 to Jeff 
  for sponsoring the february AI tinkerers meetup
  """
  )

# Handle the structured output based on its function
if nextStep.function == 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return  # or whatever you want, see below
elif nextStep.function == 'something_else':
    # ... more cases
    pass
else:  # the model didn't call a tool we know about
    # do something else
    pass
```

**说明：** 完整 Agent 接下来会接收 API 调用结果，带着它继续循环，最终返回类似这样的内容：

> 已成功为 Terri 创建一个 750 美元的付款链接，用于赞助二月的 AI Tinkerers 聚会。链接如下：https://buy.stripe.com/test_1234567890

**不过**，这里会先跳过那一步，把它留给后面的另一条原则。至于是否也要采用那条原则，由你决定。

[← 我们如何走到这里](#我们如何走到这里软件简史) · [原则 2：掌控自己的提示 →](#原则-2掌控自己的提示)

---

## 原则 2：掌控自己的提示

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-02-own-your-prompts.md)

不要把提示工程外包给框架。

![掌控自己的提示](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/120-own-your-prompts.png)

顺便说一句，[这远远不是什么新建议](https://hamel.dev/blog/posts/prompt/)：

![Hamel 关于直接掌控提示的文章截图](https://github.com/user-attachments/assets/575bab37-0f96-49fb-9ce3-9a883cdd420b)

有些框架提供如下“黑盒”方式：

```python
agent = Agent(
  role="...",
  goal="...",
  personality="...",
  tools=[tool1, tool2, tool3]
)

task = Task(
  instructions="...",
  expected_output=OutputModel
)

result = agent.run(task)
```

这种方式非常适合在起步阶段直接引入一些**顶尖的**提示工程。不过，当你需要调优，或者逆向分析框架以便把恰好正确的 token 送进模型时，它往往很难处理。

因此，请掌控自己的提示，把它们视为一等代码：

```rust
function DetermineNextStep(thread: string) -> DoneForNow | ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation {
  prompt #"
    {{ _.role("system") }}
    
    You are a helpful assistant that manages deployments for frontend and backend systems.
    You work diligently to ensure safe and successful deployments by following best practices
    and proper deployment procedures.
    
    Before deploying any system, you should check:
    - The deployment environment (staging vs production)
    - The correct tag/version to deploy
    - The current system status
    
    You can use tools like deploy_backend, deploy_frontend, and check_deployment_status
    to manage deployments. For sensitive deployments, use request_approval to get
    human verification.
    
    Always think about what to do first, like:
    - Check current deployment status
    - Verify the deployment tag exists
    - Request approval if needed
    - Deploy to staging before production
    - Monitor deployment progress
    
    {{ _.role("user") }}

    {{ thread }}
    
    What should the next step be?
  "#
}
```

上例使用 [BAML](https://github.com/boundaryml/baml) 生成提示，不过你可以采用任何喜欢的提示工程工具，甚至直接手工套模板。

如果这个签名看上去有点奇怪，原则 4“工具只是结构化输出”会继续解释。

```typescript
function DetermineNextStep(thread: string) -> DoneForNow | ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation {
```

掌控自己的提示有以下关键好处：

1. **完全控制**：准确写下 Agent 所需的指令，没有黑盒抽象。
2. **测试和评估**：像对待其他代码一样，为提示构建测试和评估。
3. **迭代**：根据真实世界表现快速修改提示。
4. **透明度**：确切知道 Agent 正在遵循什么指令。
5. **角色技巧（Role Hacking）**：利用支持非标准 user／assistant 角色用法的 API，例如 OpenAI 现已废弃的非聊天版 `completions` API。这也包括一些所谓的“模型 gaslighting”技巧。

请记住：提示是应用逻辑与 LLM 之间的主要接口。

完全掌控提示，才能获得生产级 Agent 所需的灵活性和提示控制能力。

作者不知道哪一种提示最好，但他知道：你会希望拥有尝试**一切办法**的灵活性。

[← 原则 1：把自然语言转换为工具调用](#原则-1把自然语言转换为工具调用) · [原则 3：掌控自己的上下文窗口 →](#原则-3掌控自己的上下文窗口)

---

## 原则 3：掌控自己的上下文窗口

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-03-own-your-context-window.md)

向 LLM 传递上下文，并不一定非得使用标准的消息格式。

> #### 在任何一个时刻，Agent 给 LLM 的输入都可以概括为：“这是迄今发生的一切，下一步是什么？”

<!-- 原文待办：todo syntax highlighting -->

<details>
<summary>原文件中由 HTML 注释隐藏的旧版配图（本译文保留）</summary>

![掌控自己的上下文窗口：旧版配图](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/130-own-your-context-building.png)

</details>

一切都是上下文工程。[LLM 是无状态函数](https://thedataexchange.media/baml-revolution-in-ai-engineering/)，把输入转换成输出。要得到最好的输出，就必须给它们最好的输入。

优秀上下文的构成包括：

- 给模型的提示和指令；
- 检索到的文档或外部数据，例如 RAG；
- 过去的状态、工具调用、结果或其他历史；
- 来自相关但彼此独立的其他历史／对话的过往消息或事件，也就是记忆；
- 有关应输出何种结构化数据的指令。

![上下文工程的组成](https://github.com/user-attachments/assets/0f1f193f-8e94-4044-a276-576bd7764fd0)

### 关于上下文工程

这份指南关心的是如何尽可能榨出当今模型的能力。值得注意的是，下面这些内容没有被纳入讨论：

- 修改模型参数，例如 `temperature`、`top_p`、`frequency_penalty`、`presence_penalty` 等；
- 训练自己的补全模型或嵌入模型；
- 微调现有模型。

再说一次：作者不知道向 LLM 提供上下文的最佳方式是什么，但他知道，你会希望拥有尝试**一切办法**的灵活性。

### 标准上下文格式与自定义上下文格式

大多数 LLM 客户端使用如下标准的消息格式：

```yaml
[
  {
    "role": "system",
    "content": "You are a helpful assistant..."
  },
  {
    "role": "user",
    "content": "Can you deploy the backend?"
  },
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "1",
        "name": "list_git_tags",
        "arguments": "{}"
      }
    ]
  },
  {
    "role": "tool",
    "name": "list_git_tags",
    "content": "{\"tags\": [{\"name\": \"v1.2.3\", \"commit\": \"abc123\", \"date\": \"2024-03-15T10:00:00Z\"}, {\"name\": \"v1.2.2\", \"commit\": \"def456\", \"date\": \"2024-03-14T15:30:00Z\"}, {\"name\": \"v1.2.1\", \"commit\": \"abe033d\", \"date\": \"2024-03-13T09:15:00Z\"}]}",
    "tool_call_id": "1"
  }
]
```

这种格式对大多数用例都很好用。但如果想真正榨干当今 LLM 的能力，就必须用 token 效率和注意力效率尽可能高的方式，把上下文送入 LLM。

除了标准消息格式之外，你还可以构建针对自身用例优化的上下文格式。例如，使用自定义对象，并按实际需要把它们打包／展开到一条或多条 user、system、assistant 或 tool 消息中。

下面这个例子把整个上下文窗口放进一条 user 消息：

```yaml

[
  {
    "role": "system",
    "content": "You are a helpful assistant..."
  },
  {
    "role": "user",
    "content": |
            Here's everything that happened so far:
        
        <slack_message>
            From: @alex
            Channel: #deployments
            Text: Can you deploy the backend?
        </slack_message>
        
        <list_git_tags>
            intent: "list_git_tags"
        </list_git_tags>
        
        <list_git_tags_result>
            tags:
              - name: "v1.2.3"
                commit: "abc123"
                date: "2024-03-15T10:00:00Z"
              - name: "v1.2.2"
                commit: "def456"
                date: "2024-03-14T15:30:00Z"
              - name: "v1.2.1"
                commit: "ghi789"
                date: "2024-03-13T09:15:00Z"
        </list_git_tags_result>
        
        what's the next step?
    }
]
```

模型也许能根据你提供的工具 schema 推断出你是在问它“下一步是什么”，不过把这句话直接写进提示模板总没有坏处。

### 代码示例

可以用类似下面的代码构建这种格式：

```python

class Thread:
  events: List[Event]

class Event:
  # could just use string, or could be explicit - up to you
  type: Literal["list_git_tags", "deploy_backend", "deploy_frontend", "request_more_information", "done_for_now", "list_git_tags_result", "deploy_backend_result", "deploy_frontend_result", "request_more_information_result", "done_for_now_result", "error"]
  data: ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation |  
        ListGitTagsResult | DeployBackendResult | DeployFrontendResult | RequestMoreInformationResult | string

def event_to_prompt(event: Event) -> str:
    data = event.data if isinstance(event.data, str) \
           else stringifyToYaml(event.data)

    return f"<{event.type}>\n{data}\n</{event.type}>"


def thread_to_prompt(thread: Thread) -> str:
  return '\n\n'.join(event_to_prompt(event) for event in thread.events)
```

### 上下文窗口示例

用这种方式构建出的上下文窗口可能如下所示。

**最初的 Slack 请求：**

```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
</slack_message>
```

**列出 Git tag 之后：**

```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
    Thread: []
</slack_message>

<list_git_tags>
    intent: "list_git_tags"
</list_git_tags>

<list_git_tags_result>
    tags:
      - name: "v1.2.3"
        commit: "abc123"
        date: "2024-03-15T10:00:00Z"
      - name: "v1.2.2"
        commit: "def456"
        date: "2024-03-14T15:30:00Z"
      - name: "v1.2.1"
        commit: "ghi789"
        date: "2024-03-13T09:15:00Z"
</list_git_tags_result>
```

**出错并恢复之后：**

```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
    Thread: []
</slack_message>

<deploy_backend>
    intent: "deploy_backend"
    tag: "v1.2.3"
    environment: "production"
</deploy_backend>

<error>
    error running deploy_backend: Failed to connect to deployment service
</error>

<request_more_information>
    intent: "request_more_information_from_human"
    question: "I had trouble connecting to the deployment service, can you provide more details and/or check on the status of the service?"
</request_more_information>

<human_response>
    data:
      response: "I'm not sure what's going on, can you check on the status of the latest workflow?"
</human_response>
```

接下来，你的下一步可能是：

```python
nextStep = await determine_next_step(thread_to_prompt(thread))
```

```python
{
  "intent": "get_workflow_status",
  "workflow_name": "tag_push_prod.yaml",
}
```

XML 风格的格式只是一种示例。关键在于，你可以构建符合自身应用需求的格式。如果你能够灵活试验不同的上下文结构，以及哪些内容需要保存、哪些内容需要交给 LLM，就能得到更好的质量。

掌控自己的上下文窗口有以下关键好处：

1. **信息密度**：用能够最大化 LLM 理解程度的方式组织信息。
2. **错误处理**：用有助于 LLM 恢复的格式纳入错误信息。错误解决后，可以考虑把错误和失败调用从上下文窗口中隐藏。
3. **安全性**：控制哪些信息会传给 LLM，过滤敏感数据。
4. **灵活性**：随着对用例中有效方法的认识加深，调整格式。
5. **Token 效率**：针对 token 效率和 LLM 理解效果优化上下文格式。

上下文包括提示、指令、RAG 文档、历史、工具调用和记忆。

请记住：上下文窗口是你与 LLM 之间的主要接口。掌控信息的组织与呈现方式，可以显著提高 Agent 的表现。

信息密度示例——同一条消息，更少的 token：

![同一消息以更少 token 表达的信息密度示例](https://github.com/user-attachments/assets/5cf041c6-72da-4943-be8a-99c73162b12a)

### 不要只听作者的一面之词

12-Factor Agents 发布大约两个月后，“上下文工程”开始成为一个相当流行的术语。

<a href="https://x.com/karpathy/status/1937902205765607626"><img width="378" alt="Karpathy 关于上下文工程的帖子截图" src="https://github.com/user-attachments/assets/97e6e667-c35f-4855-8233-af40f05d6bce" /></a> <a href="https://x.com/tobi/status/1935533422589399127"><img width="378" alt="Tobi 关于上下文工程的帖子截图" src="https://github.com/user-attachments/assets/7e6f5738-0d38-4910-82d1-7f5785b82b99" /></a>

此外，[@lenadroid](https://x.com/lenadroid) 在 2025 年 7 月发布了一份很不错的[上下文工程速查表](https://x.com/lenadroid/status/1943685060785524824)。

<a href="https://x.com/lenadroid/status/1943685060785524824"><img width="256" alt="上下文工程速查表" src="https://github.com/user-attachments/assets/cac88aa3-8faf-440b-9736-cab95a9de477" /></a>

这里反复出现的主题仍是：作者不知道哪种方法最好，但他知道，你会希望拥有尝试**一切办法**的灵活性。

[← 原则 2：掌控自己的提示](#原则-2掌控自己的提示) · [原则 4：工具只是结构化输出 →](#原则-4工具只是结构化输出)

---

## 原则 4：工具只是结构化输出

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-04-tools-are-structured-outputs.md)

工具不必复杂。从根本上说，它们只是 LLM 产生的、会触发确定性代码的结构化输出。

![工具只是结构化输出](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/140-tools-are-just-structured-outputs.png)

假设你有两个工具：`CreateIssue` 和 `SearchIssues`。要求 LLM“使用若干工具中的一个”，其实只是要求它输出 JSON，而我们可以把这段 JSON 解析为代表这些工具的对象。

```python

class Issue:
  title: str
  description: str
  team_id: str
  assignee_id: str

class CreateIssue:
  intent: "create_issue"
  issue: Issue

class SearchIssues:
  intent: "search_issues"
  query: str
  what_youre_looking_for: str
```

这个模式很简单。以下编号保持原文的 `1、3、4`：

1. LLM 输出结构化 JSON。
3. 确定性代码执行相应动作，例如调用外部 API。
4. 捕获结果，并把结果送回上下文。

这样就在 LLM 的决策与应用动作之间建立了清晰边界。LLM 决定做什么，但你的代码控制具体怎样做。LLM“调用了一个工具”，并不意味着你每次都必须以同样方式执行某个特定的对应函数。

还记得前面的 switch 语句：

```python
if nextStep.intent == 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return # or whatever you want, see below
elif nextStep.intent == 'wait_for_a_while': 
    # do something monadic idk
else: #... the model didn't call a tool we know about
    # do something else
```

**说明：** 关于“纯提示”“工具调用”“JSON 模式”各自的优点，以及它们之间的性能权衡，业界已经讨论了很多。原文说稍后会链接一些资料，但不在这里展开。可参阅 [Prompting vs JSON Mode vs Function Calling vs Constrained Generation vs SAP](https://www.boundaryml.com/blog/schema-aligned-parsing)、[When should I use function calling, structured outputs, or JSON mode?](https://www.vellum.ai/blog/when-should-i-use-function-calling-structured-outputs-or-json-mode#:~:text=We%20don%27t%20recommend%20using%20JSON,always%20use%20Structured%20Outputs%20instead) 和 [OpenAI JSON vs Function Calling](https://docs.llamaindex.ai/en/stable/examples/llm/openai_json_vs_function_calling/)。

“下一步”未必像“运行一个纯函数并返回结果”那样原子化。一旦把“工具调用”理解为模型输出 JSON，用来描述确定性代码应做什么，就能释放很大的灵活性。把这条原则与[原则 8：掌控自己的控制流](#原则-8掌控自己的控制流)结合起来。

[← 原则 3：掌控自己的上下文窗口](#原则-3掌控自己的上下文窗口) · [原则 5：统一执行状态与业务状态 →](#原则-5统一执行状态与业务状态)

---

## 原则 5：统一执行状态与业务状态

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-05-unify-execution-state.md)

即使在 AI 世界之外，许多基础设施系统也会尝试把“执行状态”与“业务状态”分开。对 AI 应用而言，这可能意味着引入复杂抽象，跟踪当前步骤、下一步骤、等待状态和重试次数等信息。这种分离会带来复杂度；复杂度可能值得，也可能远超你的用例所需。

一如既往，应由你决定什么适合自己的应用。但不要以为你*必须*分别管理二者。

说得更明确一些：

- **执行状态**：当前步骤、下一步骤、等待状态、重试次数等。
- **业务状态**：Agent 工作流迄今发生了什么，例如 OpenAI 消息列表、工具调用及结果列表等。

如果可能，请**简化**：尽量把两者统一起来。

[![统一执行状态与业务状态动画](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/155-unify-state-animation.gif)](https://github.com/user-attachments/assets/e5a851db-f58f-43d8-8b0c-1926c99fc68d)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/155-unify-state-animation.gif">GIF 版本</a></summary>

![统一状态 GIF](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/155-unify-state-animation.gif)

</details>

实际上，你可以把应用设计成能够从上下文窗口推断全部执行状态。在许多情况下，执行状态——当前步骤、等待状态等——只是“迄今发生了什么”的元数据。

有些内容不能放进上下文窗口，例如 session ID、密码上下文等；但目标应当是尽量减少这类内容。采用[原则 3](#原则-3掌控自己的上下文窗口)，你就能控制真正送入 LLM 的内容。

这种方法有几个好处：

1. **简单**：所有状态只有一个事实来源。
2. **序列化**：线程可以非常容易地序列化／反序列化。
3. **调试**：全部历史都能在一个地方看到。
4. **灵活**：只需增加新的事件类型，就能轻松增加新状态。
5. **恢复**：加载线程即可从任意位置恢复。
6. **分叉**：把线程的某个子集复制到新的上下文／状态 ID 中，即可在任意位置分叉线程。
7. **人类界面与可观测性**：可以非常容易地把线程转换为人类可读的 Markdown，或者功能丰富的 Web 应用 UI。

[← 原则 4：工具只是结构化输出](#原则-4工具只是结构化输出) · [原则 6：用简单 API 启动、暂停、恢复 →](#原则-6用简单-api-启动暂停恢复)

---

## 原则 6：用简单 API 启动、暂停、恢复

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-06-launch-pause-resume.md)

Agent 只是程序，而对于如何启动、查询、恢复和停止程序，我们本来就有一套预期。

[![暂停与恢复动画](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/165-pause-resume-animation.gif)](https://github.com/user-attachments/assets/feb1a425-cb96-4009-a133-8bd29480f21f)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/165-pause-resume-animation.gif">GIF 版本</a></summary>

![暂停与恢复 GIF](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/165-pause-resume-animation.gif)

</details>

用户、应用、流水线和其他 Agent 都应当能通过简单 API 轻松启动一个 Agent。

当需要长时间运行的操作时，Agent 及其编排用的确定性代码应当能够暂停 Agent。

Webhook 等外部触发器应当能让 Agent 从中断之处继续，而不必与 Agent 编排器进行深度集成。

这条原则与[原则 5：统一执行状态与业务状态](#原则-5统一执行状态与业务状态)及[原则 8：掌控自己的控制流](#原则-8掌控自己的控制流)密切相关，但也可以独立实现。

**说明：** AI 编排器通常允许暂停和恢复，却不允许在“选择工具”与“执行工具”之间暂停。另请参见[原则 7：通过工具调用联系人类](#原则-7通过工具调用联系人类)和[原则 11：从任何地方触发，在用户所在之处与他们相遇](#原则-11从任何地方触发在用户所在之处与他们相遇)。

[← 原则 5：统一执行状态与业务状态](#原则-5统一执行状态与业务状态) · [原则 7：通过工具调用联系人类 →](#原则-7通过工具调用联系人类)

---

## 原则 7：通过工具调用联系人类

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-07-contact-humans-with-tools.md)

默认情况下，LLM API 依赖一个影响重大的基础 token 选择：要返回纯文本内容，还是返回结构化数据？

![通过工具调用联系人类](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/170-contact-humans-with-tools.png)

你把很大的权重压在第一个 token 的选择上。对于 `the weather in tokyo`，这个 token 是：

> “the”

而对于 `fetch_weather`，它则是一个表示 JSON 对象开始的特殊 token：

> `|JSON>`

如果让 LLM **始终**输出 JSON，再用 `request_human_input` 或 `done_for_now` 这类包含自然语言 token 的意图来表明目的，而不是使用 `check_weather_in_city` 这种“正经”工具，你也许能得到更好的结果。

再强调一次：这样做也可能没有任何性能提升。但你应当做实验，并确保自己有自由尝试奇怪的办法，以得到最佳结果。

```python

class Options:
  urgency: Literal["low", "medium", "high"]
  format: Literal["free_text", "yes_no", "multiple_choice"]
  choices: List[str]

# Tool definition for human interaction
class RequestHumanInput:
  intent: "request_human_input"
  question: str
  context: str
  options: Options

# Example usage in the agent loop
if nextStep.intent == 'request_human_input':
  thread.events.append({
    type: 'human_input_requested',
    data: nextStep
  })
  thread_id = await save_state(thread)
  await notify_human(nextStep, thread_id)
  return # Break loop and wait for response to come back with thread ID
else:
  # ... other cases
```

之后，你可能会从负责处理 Slack、电子邮件、短信或其他事件的系统收到 webhook。

```python

@app.post('/webhook')
def webhook(req: Request):
  thread_id = req.body.threadId
  thread = await load_state(thread_id)
  thread.events.push({
    type: 'response_from_human',
    data: req.body
  })
  # ... simplified for brevity, you likely don't want to block the web worker here
  next_step = await determine_next_step(thread_to_prompt(thread))
  thread.events.append(next_step)
  result = await handle_next_step(thread, next_step)
  # todo - loop or break or whatever you want

  return {"status": "ok"}
```

上面的代码包含了[原则 5](#原则-5统一执行状态与业务状态)、[原则 8](#原则-8掌控自己的控制流)、[原则 3](#原则-3掌控自己的上下文窗口)、[原则 4](#原则-4工具只是结构化输出)以及其他几条原则中的模式。

如果使用原则 3 的 XML 风格格式，经过几轮后，上下文窗口可能如下：

```xml

(snipped for brevity)

<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy backend v1.2.3 to production?
    Thread: []
</slack_message>

<request_human_input>
    intent: "request_human_input"
    question: "Would you like to proceed with deploying v1.2.3 to production?"
    context: "This is a production deployment that will affect live users."
    options: {
        urgency: "high"
        format: "yes_no"
    }
</request_human_input>

<human_response>
    response: "yes please proceed"
    approved: true
    timestamp: "2024-03-15T10:30:00Z"
    user: "alex@company.com"
</human_response>

<deploy_backend>
    intent: "deploy_backend"
    tag: "v1.2.3"
    environment: "production"
</deploy_backend>

<deploy_backend_result>
    status: "success"
    message: "Deployment v1.2.3 to production completed successfully."
    timestamp: "2024-03-15T10:30:00Z"
</deploy_backend_result>
```

好处包括：

1. **清晰的指令**：为不同的人类联系方式设置不同工具，让 LLM 能表达得更具体。
2. **内循环与外循环**：让 Agent 工作流可以运行在传统 ChatGPT 式界面之外；此时控制流和上下文初始化可能是 `Agent->Human`，而不是 `Human->Agent`。例如，由 cron 或事件启动的 Agent。
3. **接入多个人类**：通过结构化事件，轻松跟踪和协调不同人类的输入。
4. **多 Agent**：这个简单抽象很容易扩展，以支持 `Agent->Agent` 的请求和响应。
5. **持久可靠**：结合[原则 6](#原则-6用简单-api-启动暂停恢复)，可以形成持久、可靠且可内省的多人工作流。

[这里有更多关于 Outer Loop Agent 的讨论](https://theouterloop.substack.com/p/openais-realtime-api-is-a-step-towards)。

![Outer Loop Agent](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/175-outer-loop-agents.png)

它与[原则 11：从任何地方触发，在用户所在之处与他们相遇](#原则-11从任何地方触发在用户所在之处与他们相遇)配合得很好。

[← 原则 6：用简单 API 启动、暂停、恢复](#原则-6用简单-api-启动暂停恢复) · [原则 8：掌控自己的控制流 →](#原则-8掌控自己的控制流)

---

## 原则 8：掌控自己的控制流

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-08-own-your-control-flow.md)

掌控自己的控制流，就可以做很多有意思的事。

![掌控自己的控制流](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/180-control-flow.png)

为具体用例构建真正合适的控制结构。具体而言，某些类型的工具调用可能意味着应当跳出循环，等待人类响应，或者等待训练流水线这类长时间运行的任务。你也可能想自定义实现：

- 对工具调用结果进行摘要或缓存；
- 用 LLM-as-judge 评判结构化输出；
- 压缩上下文窗口，或者进行其他[记忆管理](#原则-3掌控自己的上下文窗口)；
- 日志、追踪和指标；
- 客户端限流；
- 持久 sleep／pause／“等待事件”。

下面的例子展示了三种可能的控制流模式：

- `request_clarification`：模型要求更多信息；跳出循环，等待人类响应。
- `fetch_git_tags`：模型要求 Git tag 列表；取得 tag，追加到上下文窗口，再直接把上下文交回模型。
- `deploy_backend`：模型要求部署后端；这是高风险动作，因此跳出循环，等待人类批准。

```python
def handle_next_step(thread: Thread):

  while True:
    next_step = await determine_next_step(thread_to_prompt(thread))
    
    # inlined for clarity - in reality you could put 
    # this in a method, use exceptions for control flow, or whatever you want
    if next_step.intent == 'request_clarification':
      thread.events.append({
        type: 'request_clarification',
          data: nextStep,
        })

      await send_message_to_human(next_step)
      await db.save_thread(thread)
      # async step - break the loop, we'll get a webhook later
      break
    elif next_step.intent == 'fetch_open_issues':
      thread.events.append({
        type: 'fetch_open_issues',
        data: next_step,
      })

      issues = await linear_client.issues()

      thread.events.append({
        type: 'fetch_open_issues_result',
        data: issues,
      })
      # sync step - pass the new context to the LLM to determine the NEXT next step
      continue
    elif next_step.intent == 'create_issue':
      thread.events.append({
        type: 'create_issue',
        data: next_step,
      })

      await request_human_approval(next_step)
      await db.save_thread(thread)
      # async step - break the loop, we'll get a webhook later
      break
```

这个模式允许你按需中断和恢复 Agent 流程，从而形成更自然的对话与工作流。

**示例：** 对市面上每一个 AI 框架，作者最想要的功能都是：能够中断正在工作的 Agent，并在稍后恢复；尤其要能在工具**选择**之后、工具**调用**之前中断。

如果没有这种细粒度的恢复能力，就无法在工具调用运行之前对其进行审查／批准。于是，你只能被迫选择：

1. 在等待长时间任务完成时，把任务暂停在内存里——例如 `while...sleep`；一旦进程中断，就从头重启。
2. 把 Agent 限制在研究和摘要这类低风险、低影响的调用上。
3. 让 Agent 有权做更大、更有用的事，然后 YOLO 式地祈祷它别搞砸。

你可能已经注意到，这与[原则 5](#原则-5统一执行状态与业务状态)和[原则 6](#原则-6用简单-api-启动暂停恢复)密切相关，但仍然可以独立实现。

[← 原则 7：通过工具调用联系人类](#原则-7通过工具调用联系人类) · [原则 9：把错误压缩进上下文窗口 →](#原则-9把错误压缩进上下文窗口)

---

## 原则 9：把错误压缩进上下文窗口

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-09-compact-errors.md)

这一条很短，但值得一提。Agent 的一个好处是“自愈”：对于短任务，LLM 可能会调用一个失败的工具。优秀 LLM 很有机会读懂错误消息或堆栈跟踪，并判断出后续工具调用需要改什么。

大多数框架都实现了这个能力，但即使完全不采用其他 11 条原则，你也可以**只实现这一条**。例如：

```python
thread = {"events": [initial_message]}

while True:
  next_step = await determine_next_step(thread_to_prompt(thread))
  thread["events"].append({
    "type": next_step.intent,
    "data": next_step,
  })
  try:
    result = await handle_next_step(thread, next_step) # our switch statement
  except Exception as e:
    # if we get an error, we can add it to the context window and try again
    thread["events"].append({
      "type": 'error',
      "data": format_error(e),
    })
    # loop, or do whatever else here to try to recover
```

你可能希望为某个特定工具调用实现 `errorCounter`：把同一工具的尝试次数限制在大约 3 次，或者采用任何适合自身用例的逻辑。

```python
consecutive_errors = 0

while True:

  # ... existing code ...

  try:
    result = await handle_next_step(thread, next_step)
    thread["events"].append({
      "type": next_step.intent + '_result',
      data: result,
    })
    # success! reset the error counter
    consecutive_errors = 0
  except Exception as e:
    consecutive_errors += 1
    if consecutive_errors < 3:
      # do the loop and try again
      thread["events"].append({
        "type": 'error',
        "data": format_error(e),
      })
    else:
      # break the loop, reset parts of the context window, escalate to a human, or whatever else you want to do
      break
  }
}
```

达到某个连续错误阈值，可能正是[升级给人类](#原则-7通过工具调用联系人类)的绝佳时机：既可以由模型决定，也可以由确定性代码接管控制流。

[![错误自愈动画](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/195-factor-09-errors.gif)](https://github.com/user-attachments/assets/cd7ed814-8309-4baf-81a5-9502f91d4043)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/195-factor-09-errors.gif">GIF 版本</a></summary>

![错误自愈 GIF](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/195-factor-09-errors.gif)

</details>

好处包括：

1. **自愈**：LLM 可以阅读错误消息，并判断后续工具调用需要改什么。
2. **持久可靠**：即使某次工具调用失败，Agent 仍能继续运行。

你大概会发现，如果把这件事做得**太过头**，Agent 会开始失控，反复重现同一个错误。

这正是[原则 8：掌控自己的控制流](#原则-8掌控自己的控制流)和[原则 3：掌控自己的上下文窗口](#原则-3掌控自己的上下文窗口)发挥作用的地方。你不必把原始错误原封不动地塞回上下文；可以彻底重构错误的表示方式，从上下文窗口移除先前事件，或者执行任何经验证能让 Agent 回到正轨的确定性操作。

不过，防止错误循环失控的首要办法，是采用[原则 10：小而专注的 Agent](#原则-10小而专注的-agent)。

[← 原则 8：掌控自己的控制流](#原则-8掌控自己的控制流) · [原则 10：小而专注的 Agent →](#原则-10小而专注的-agent)

---

## 原则 10：小而专注的 Agent

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-10-small-focused-agents.md)

不要构建试图包办一切的单体 Agent，而要构建只做好一件事的小型、专注的 Agent。Agent 只是一个规模更大、主体仍然是确定性系统中的一块积木。

![小而专注的 Agent](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1a0-small-focused-agents.png)

这里的关键洞见来自 LLM 的局限：任务越大、越复杂，需要的步骤就越多，上下文窗口也就越长。上下文增长后，LLM 更容易迷路或失去焦点。让 Agent 专注于特定领域，把流程控制在 3～10 步、最多也许 20 步，可以让上下文窗口保持可控，让 LLM 保持较高表现。

> #### 上下文越长，LLM 越容易迷路或失去焦点。

小而专注的 Agent 有以下好处：

1. **上下文可控**：较小的上下文窗口意味着更好的 LLM 表现。
2. **职责清晰**：每个 Agent 都有定义良好的范围和目的。
3. **可靠性更高**：不容易在复杂工作流中迷路。
4. **更容易测试**：更容易测试和验证具体功能。
5. **更容易调试**：问题出现时，更容易定位和修复。

### 如果 LLM 变得更聪明呢？

如果 LLM 聪明到足以处理超过 100 步的工作流，我们还需要这条原则吗？

简短回答：需要。随着 Agent 和 LLM 改进，它们**可能**自然扩展到能够处理更长的上下文窗口，也就能够处理一张大型 DAG 中**更多**的部分。小而专注的方法确保你在**今天**就能得到结果；随着 LLM 上下文窗口变得更可靠，再逐步扩大 Agent 的范围。（如果你重构过大型确定性代码库，此时可能正在点头。）

[![Agent 范围随模型能力逐渐扩大](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1a5-agent-scope-grow.gif)](https://github.com/user-attachments/assets/0cd3f52c-046e-4d5e-bab4-57657157c82f)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1a5-agent-scope-grow.gif">GIF 版本</a></summary>

![Agent 范围增长 GIF](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1a5-agent-scope-grow.gif)

</details>

关键在于：有意识地控制 Agent 的大小／范围，并且只以能够维持质量的方式扩张。正如[构建 NotebookLM 的团队所说](https://open.substack.com/pub/swyx/p/notebooklm?selection=08e1187c-cfee-4c63-93c9-71216640a5f8&utm_campaign=post-share-selection&utm_medium=web)：

> 我始终觉得，在构建 AI 时，最神奇的时刻往往出现在我真正、真正、真正贴近模型能力边界的时候。

无论这条边界在哪里，只要能找到它，并持续稳定地把事情做对，你就能构建出神奇的体验。这里可以形成许多护城河；不过一如往常，它们需要工程上的严谨。

[← 原则 9：把错误压缩进上下文窗口](#原则-9把错误压缩进上下文窗口) · [原则 11：从任何地方触发 →](#原则-11从任何地方触发在用户所在之处与他们相遇)

---

## 原则 11：从任何地方触发，在用户所在之处与他们相遇

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-11-trigger-from-anywhere.md)

如果你一直在等 [HumanLayer](https://humanlayer.dev) 的产品推介，那么你等到了。如果已经采用[原则 6](#原则-6用简单-api-启动暂停恢复)和[原则 7](#原则-7通过工具调用联系人类)，你就已经准备好纳入这条原则。

![从任何地方触发](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1b0-trigger-from-anywhere.png)

让用户可以从 Slack、电子邮件、短信或者他们想用的任何其他渠道触发 Agent。让 Agent 也能通过相同渠道响应。

好处包括：

- **在用户所在之处与他们相遇**：这有助于构建行为像真人一样的 AI 应用；至少也会像数字同事。
- **Outer Loop Agent**：让 Agent 能由非人类主体触发，例如事件、cron、故障或其他任何东西。Agent 也许会工作 5 分钟、20 分钟或 90 分钟；但到达关键节点时，它可以联系人类，寻求帮助、反馈或批准。
- **高风险工具**：如果能够快速把各种人类拉进循环，就可以让 Agent 执行风险更高的操作，例如发送外部邮件、更新生产数据等。维持明确标准，便能获得可审计性，也能更有信心让 Agent [完成更大、更好的事情](#如果-llm-变得更聪明呢)。

[← 原则 10：小而专注的 Agent](#原则-10小而专注的-agent) · [原则 12：无状态 reducer →](#原则-12把-agent-做成无状态-reducer)

---

## 原则 12：把 Agent 做成无状态 reducer

[← 返回 README 部分](#内容导航) · [查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/factor-12-stateless-reducer.md)

好了，写到这里已经有超过 1000 行 Markdown。这一条主要只是为了好玩。

![把 Agent 做成无状态 reducer](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1c0-stateless-reducer.png)

![以 foldl 表示 Agent reducer](https://raw.githubusercontent.com/humanlayer/12-factor-agents/d20c728368bf9c189d6d7aab704744decb6ec0cc/img/1c5-agent-foldl.png)

[← 原则 11：从任何地方触发](#原则-11从任何地方触发在用户所在之处与他们相遇) · [附录／原则 13：预取上下文 →](#附录原则-13预取可能需要的全部上下文)

---

## 附录／原则 13：预取可能需要的全部上下文

[查看固定版本原文](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/content/appendix-13-pre-fetch.md)

如果模型很可能会调用工具 X，就不要浪费 token 和往返轮次去告诉模型先获取它。也就是说，不要使用下面这种伪提示：

```jinja
When looking at deployments, you will likely want to fetch the list of published git tags,
so you can use it to deploy to prod.

Here's what happened so far:

{{ thread.events }}

What's the next step?

Answer in JSON format with one of the following intents:

{
  intent: 'deploy_backend_to_prod',
  tag: string
} OR {
  intent: 'list_git_tags'
} OR {
  intent: 'done_for_now',
  message: string
}
```

此时，代码如下：

```python
thread = {"events": [initial_message]}
next_step = await determine_next_step(thread)

while True:
  switch next_step.intent:
    case 'list_git_tags':
      tags = await fetch_git_tags()
      thread["events"].append({
        type: 'list_git_tags',
        data: tags,
      })
    case 'deploy_backend_to_prod':
      deploy_result = await deploy_backend_to_prod(next_step.data.tag)
      thread["events"].append({
        "type": 'deploy_backend_to_prod',
        "data": deploy_result,
      })
    case 'done_for_now':
      await notify_human(next_step.message)
      break
    # ...
```

不妨直接获取 tag，并把它们放进上下文窗口：

```diff
- When looking at deployments, you will likely want to fetch the list of published git tags,
- so you can use it to deploy to prod.

+ The current git tags are:

+ {{ git_tags }}


Here's what happened so far:

{{ thread.events }}

What's the next step?

Answer in JSON format with one of the following intents:

{
  intent: 'deploy_backend_to_prod',
  tag: string
- } OR {
-   intent: 'list_git_tags'
} OR {
  intent: 'done_for_now',
  message: string
}

```

代码则变为：

```diff
thread = {"events": [initial_message]}
+ git_tags = await fetch_git_tags()

- next_step = await determine_next_step(thread)
+ next_step = await determine_next_step(thread, git_tags)

while True:
  switch next_step.intent:
-    case 'list_git_tags':
-      tags = await fetch_git_tags()
-      thread["events"].append({
-        type: 'list_git_tags',
-        data: tags,
-      })
    case 'deploy_backend_to_prod':
      deploy_result = await deploy_backend_to_prod(next_step.data.tag)
      thread["events"].append({
        "type": 'deploy_backend_to_prod',
        "data": deploy_result,
      })
    case 'done_for_now':
      await notify_human(next_step.message)
      break
    # ...
```

甚至可以直接把 tag 放进线程，并从提示模板中移除专门的参数：

```diff
thread = {"events": [initial_message]}
+ # add the request
+ thread["events"].append({
+  "type": 'list_git_tags',
+ })

git_tags = await fetch_git_tags()

+ # add the result
+ thread["events"].append({
+  "type": 'list_git_tags_result',
+  "data": git_tags,
+ })

- next_step = await determine_next_step(thread, git_tags)
+ next_step = await determine_next_step(thread)

while True:
  switch next_step.intent:
    case 'deploy_backend_to_prod':
      deploy_result = await deploy_backend_to_prod(next_step.data.tag)
      thread["events"].append(deploy_result)
    case 'done_for_now':
      await notify_human(next_step.message)
      break
    # ...
```

总体原则是：

> #### 如果你已经知道希望模型调用哪些工具，那就用确定性代码直接调用它们，让模型去完成真正困难的部分：弄清楚如何使用这些工具的输出。

再强调一次：AI 工程归根到底都是[上下文工程](#原则-3掌控自己的上下文窗口)。

[← 原则 12：把 Agent 做成无状态 reducer](#原则-12把-agent-做成无状态-reducer) · [延伸阅读](#readme相关资源)
