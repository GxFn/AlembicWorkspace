# MemGPT：让大语言模型像操作系统一样工作

- **原文标题**：MemGPT: Towards LLMs as Operating Systems
- **作者**：Charles Packer、Sarah Wooders、Kevin Lin、Vivian Fang、Shishir G. Patil、Ion Stoica、Joseph E. Gonzalez
- **机构**：University of California, Berkeley
- **原文版本**：arXiv v2，2024-02-12
- **原文链接**：[arXiv:2310.08560v2](https://arxiv.org/abs/2310.08560v2)
- **原文许可**：[Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/)
- **翻译日期**：2026-07-27
- **译文说明**：本文是非官方中文翻译，未获作者、UC Berkeley 或 arXiv 背书。本译文属于对 CC BY 4.0 原文的中文改编，已在此明确标明修改；模型名、函数名、代码、数学符号、数据、引用关系和图中原始文字保持不变。图像使用 ar5iv 对 arXiv v2 源文件生成的绝对地址，中文图注依据 v2 原文翻译。
- **原文关键词**：Machine Learning、ICML

## 摘要

大语言模型（LLM）给人工智能带来了革命性变化，但有限的上下文窗口也限制了它们在长时间对话和文档分析等任务中的用途。为了使用超出有限上下文窗口的信息，我们提出了*虚拟上下文管理*：这项技术受到传统操作系统分层内存系统的启发；后者通过在物理内存和磁盘之间进行分页，营造出更大虚拟内存的效果。

利用这项技术，我们提出 MemGPT（MemoryGPT）。该系统能够智能管理不同存储层级，从而在 LLM 有限的上下文窗口中有效提供扩展上下文。

我们在两个领域评估了这项受操作系统启发的设计；现代 LLM 的有限上下文窗口会严重削弱其在这两个领域的表现：其一是文档分析，MemGPT 能够分析远远超出底层 LLM 上下文窗口的大型文档；其二是多会话聊天，MemGPT 能够创建这样的对话 Agent——它们可以记忆、反思，并在与用户的长期互动中动态演进。

我们在 [MemGPT 研究网站](https://research.memgpt.ai/)公开了 MemGPT 的代码和实验数据。

## 1 引言

近年来，大语言模型（LLM）及其底层 Transformer 架构（Vaswani et al., 2017；Devlin et al., 2018；Brown et al., 2020；Ouyang et al., 2022）已经成为对话式 AI 的基石，并催生了大量消费级和企业级应用。尽管取得了这些进展，LLM 所采用的、长度固定且有限的上下文窗口，仍然严重妨碍它们应用于长对话或长文档推理。例如，使用最广泛的开源 LLM 在超过最大输入长度之前，只能支持数十轮往返消息，或对一份短文档进行推理（Touvron et al., 2023）。

由于 Transformer 架构采用自注意力机制，直接扩展 Transformer 的上下文长度，会使计算时间和内存成本呈二次增长；因此，设计新的长上下文架构已经成为一项紧迫的研究挑战（Dai et al., 2019；Kitaev et al., 2020；Beltagy et al., 2020）。开发更长上下文的模型仍是一个活跃研究领域（Dong et al., 2023）；然而，即使能够克服上下文扩展的计算难题，近期研究也表明，长上下文模型难以有效利用额外上下文（Liu et al., 2023a）。因此，考虑到训练最先进 LLM 所需的大量资源，以及上下文扩展收益递减的现象，迫切需要用其他技术来支持长上下文。

本文研究如何在继续使用固定上下文模型的同时，营造无限上下文的效果。我们的方法借鉴了虚拟内存分页思想：它通过在主存和磁盘之间分页数据，使应用可以处理远远超过可用内存的数据集。

我们利用 LLM Agent 函数调用能力方面的近期进展（Schick et al., 2023；Liu et al., 2023b），设计出 MemGPT——一个受操作系统启发、用于**虚拟上下文管理**的 LLM 系统。通过函数调用，LLM Agent 可以读写外部数据源、修改自身上下文，并选择何时向用户返回响应。

这些能力让 LLM 可以在上下文窗口（类似操作系统中的“主存”）与外部存储之间有效地“换入”和“换出”信息，类似于传统操作系统的分层内存。此外，函数调用还可以管理上下文管理、响应生成和用户交互之间的控制流。这样，Agent 就能选择在单项任务中*迭代地*修改自身上下文，从而更有效地利用有限上下文。

在 MemGPT 中，我们把上下文窗口视为受限内存资源，并为 LLM 设计一套类似于传统操作系统内存层级的内存层次结构（Patterson et al., 1988）。传统操作系统中的应用与*虚拟内存*交互；操作系统把溢出数据分页到磁盘，并在应用访问数据时（通过缺页故障）将其取回内存，从而让可用内存看起来比实际物理内存（即主存）更多。

为了营造类似的、更长上下文效果（对应虚拟内存），我们允许 LLM 通过一个称为 MemGPT 的“LLM OS”，自行管理要把什么放进自己的上下文（对应物理内存）。MemGPT 让 LLM 可以取回当前上下文中缺失的相关历史数据，也可以把相关性较低的数据逐出上下文，移入外部存储系统。图 3 展示了 MemGPT 的组成部分。

![图 1：MemGPT 在上下文空间有限的系统警告之后写入持久记忆](https://ar5iv.labs.arxiv.org/html/2310.08560v2/assets/x1.png)

**图 1。** MemGPT（左）收到关于上下文空间有限的系统警告之后，把数据写入持久记忆。

内存层次结构、操作系统函数和基于事件的控制流结合在一起，使 MemGPT 能够使用上下文窗口有限的 LLM 来处理无界上下文。为了证明这套受操作系统启发的新 LLM 系统的用途，我们在两个因有限上下文而使现有 LLM 表现严重受限的领域评估 MemGPT：文档分析与对话 Agent。在文档分析中，普通文本文件的长度很快就会超过现代 LLM 的输入容量；在对话 Agent 中，受限于有限对话窗口的 LLM 在长时间对话期间缺乏上下文感知、角色一致性和长期记忆。在两种场景中，MemGPT 都能够克服有限上下文的限制，超越既有的 LLM 方法。

![图 2：MemGPT 搜索上下文之外的数据](https://ar5iv.labs.arxiv.org/html/2310.08560v2/assets/x2.png)

**图 2。** MemGPT（左）可以搜索上下文之外的数据，把相关信息带入当前上下文窗口。

![图 3：MemGPT 系统组成与数据流](https://ar5iv.labs.arxiv.org/html/2310.08560v2/assets/x3.png)

**图 3。** 在 MemGPT 中，一个固定上下文的 LLM 处理器获得了分层内存系统，以及一组让它管理自身内存的函数。LLM 的提示词 token（输入），即*主上下文*，由系统指令、工作上下文和 FIFO 队列组成。LLM 的补全 token（输出）由函数执行器解释为函数调用。MemGPT 使用函数在主上下文与*外部上下文*（归档存储和回忆存储数据库）之间移动数据。LLM 可以在输出中生成特殊关键字参数（`request_heartbeat=true`），请求立即进行后续 LLM 推理，从而把函数调用串联起来；正是函数链让 MemGPT 能够执行多步检索，以回答用户查询。

## 2 MemGPT（MemoryGPT）

MemGPT 受操作系统启发的多级内存架构区分两类主要内存：**主上下文**（类似主存、物理内存或 RAM）和**外部上下文**（类似磁盘内存或磁盘存储）。

主上下文由 LLM 的*提示词 token* 构成——主上下文中的任何内容都被视为*上下文内*信息，LLM 处理器可以在推理时访问。外部上下文指存放在 LLM 固定上下文窗口之外的所有信息。这些*上下文外*数据必须显式移入主上下文，才能在推理时传给 LLM 处理器。

MemGPT 提供函数调用，让 LLM 处理器无须用户干预即可管理自身内存。

### 2.1 主上下文（*提示词 token*）

MemGPT 中的提示词 token 被划分为三个连续部分：**系统指令**、**工作上下文**和 **FIFO 队列**。系统指令是只读（静态）的，其中包含 MemGPT 控制流信息、不同内存层级的预期用途，以及如何使用 MemGPT 函数的说明（例如如何取回上下文外数据）。工作上下文是固定大小、可读写的非结构化文本块，只能通过 MemGPT 函数调用写入。在对话场景中，工作上下文用于存储关于用户和 Agent 所扮演角色的关键事实、偏好及其他重要信息，让 Agent 可以与用户流畅对话。

FIFO 队列保存滚动的消息历史，其中包括 Agent 与用户之间的消息、系统消息（例如内存警告），以及函数调用的输入和输出。FIFO 队列的第一个位置保存一条系统消息，其中包含已被逐出队列之消息的递归摘要。

### 2.2 队列管理器

队列管理器负责管理**回忆存储**和 **FIFO 队列**中的消息。系统收到新消息时，队列管理器会把传入消息追加到 FIFO 队列，拼接提示词 token，并触发 LLM 推理来生成 LLM 输出（补全 token）。队列管理器把传入消息和生成的 LLM 输出都写入回忆存储（MemGPT 消息数据库）。通过 MemGPT 函数调用取回回忆存储中的消息时，队列管理器会把它们追加到队列末尾，使其重新进入 LLM 的上下文窗口。

队列管理器还负责通过队列逐出策略控制上下文溢出。当提示词 token 超过底层 LLM 上下文窗口的“警告 token 数”（例如上下文窗口的 70%）时，队列管理器会向队列插入系统消息，警告 LLM 即将发生队列逐出（“内存压力”警告）；LLM 因而有机会使用 MemGPT 函数，把 FIFO 队列中的重要信息存进工作上下文或**归档存储**——后者是一个存储任意长度文本对象的读写数据库。

当提示词 token 超过“清空 token 数”（例如上下文窗口的 100%）时，队列管理器会清空部分队列，为上下文窗口释放空间：它逐出指定数量的消息（例如相当于上下文窗口 50% 的消息），并用既有递归摘要和被逐出的消息生成新的递归摘要。队列清空之后，被逐出的消息不再位于上下文内，LLM 也无法立即看到它们；不过，这些消息会无限期存放在回忆存储中，并可通过 MemGPT 函数调用读取。

### 2.3 函数执行器（处理*补全 token*）

MemGPT 通过 LLM 处理器生成的函数调用，编排主上下文与外部上下文之间的数据移动。记忆编辑和检索完全由系统自主决定：MemGPT 根据当前上下文自主更新并搜索自己的记忆。例如，它可以决定何时在上下文之间移动项目——比如当对话历史变得太长时，如图 1 所示——也可以修改主上下文，使其更准确地反映自己对当前目标与责任不断演进的理解，如图 3 所示。

为了实现自主编辑和检索，我们在系统指令中提供明确说明，指导 LLM 如何与 MemGPT 的内存系统交互。这些指令由两个主要部分组成：（1）对内存层次结构及各层用途的详细说明；（2）系统可以调用、用于访问或修改内存的函数模式，其中包括各函数的自然语言描述。

在每轮推理中，LLM 处理器以主上下文（拼接成单个字符串）作为输入，并生成一个输出字符串。MemGPT 会解析输出字符串以确保正确；如果解析器验证函数参数有效，就执行该函数。随后，MemGPT 会把结果反馈给处理器，其中包括发生的任何运行时错误（例如在主上下文已经达到最大容量时仍试图添加内容）。这个反馈循环让系统能够从行动中学习，并相应调整行为。

了解上下文限制是让自主编辑机制有效运作的关键。为此，MemGPT 会向处理器提供有关 token 限制的警告，以引导其作出内存管理决策。此外，内存检索机制也会考虑这些 token 限制，并实现分页，避免一次检索调用使上下文窗口溢出。

**表 1。常用模型和 LLM API 的上下文长度比较（数据收集于 2024 年 1 月）。** `*` 消息数为近似值，假设预提示占 1k token，平均每条消息为 $\sim 50$ token（$\sim 250$ 个字符）。“开放”表示模型开源或开放权重，而不是只能通过 API 使用。

| 模型 / API 名称 | 开放？ | 上下文窗口：Token | 上下文窗口：$^*$消息数 |
|---|---:|---:|---:|
| Llama (1) | ✓ | 2k | 20 |
| Llama 2 | ✓ | 4k | 60 |
| GPT-3.5 Turbo (release) | ✗ | 4k | 60 |
| Mistral 7B | ✓ | 8k | 140 |
| GPT-4 (release) | ✗ | 8k | 140 |
| GPT-3.5 Turbo | ✗ | 16k | 300 |
| GPT-4 | ✗ | 32k | $\sim 600$ |
| Claude 2 | ✗ | 100k | $\sim 2000$ |
| GPT-4 Turbo | ✗ | 128k | $\sim 2600$ |
| Yi-34B-200k | ✓ | 200k | $\sim 4000$ |

### 2.4 控制流与函数链

在 MemGPT 中，*事件*会触发 LLM 推理。事件是 MemGPT 的一般化输入，可以由用户消息（聊天应用中）、系统消息（例如主上下文容量警告）、用户交互（例如提醒用户刚刚登录，或提醒用户完成文档上传），以及按固定计划运行的定时事件组成；定时事件让 MemGPT 可以在没有用户干预的情况下“无提示”运行。

MemGPT 使用解析器处理事件，将其转换为可以追加到主上下文、并最终作为输入传给 LLM 处理器的纯文本消息。

许多实际任务要求连续调用多个函数，例如浏览同一查询的多页结果，或把来自不同查询、不同文档的数据汇集进主上下文。函数链使 MemGPT 能够在把控制权交还用户之前，连续执行多个函数调用。

在 MemGPT 中，调用函数时可以携带一个特殊标志，请求所调用函数执行完毕之后，立即把控制权交还处理器。如果存在该标志，MemGPT 会把函数输出加入主上下文，并继续处理器执行，而不是暂停。如果没有该标志（即一次*让出*），MemGPT 在下一个外部事件触发之前不会运行 LLM 处理器；外部事件例如用户消息或计划中断。

![图 4：MemGPT 更新已存储的信息](https://ar5iv.labs.arxiv.org/html/2310.08560v2/assets/x4.png)

**图 4。** 对话片段示例：MemGPT（左）更新已存储的信息。这里，信息被存放在工作上下文记忆中，而工作上下文位于提示词 token 内。

## 3 实验

我们在两个长上下文领域评估 MemGPT：对话 Agent 和文档分析。对于对话 Agent，我们扩展了既有的 Multi-Session Chat（MSC）数据集（Xu et al., 2021），并提出两个新的对话任务，用来评估 Agent 在长对话中保留知识的能力。对于文档分析，我们在 Liu et al.（2023a）的既有任务上对 MemGPT 进行基准测试，这些任务涉及对长文档进行问答和键值检索。我们还提出一项新的嵌套键值检索任务；它要求汇集多个数据源的信息，从而测试 Agent 汇集多个数据源信息的能力，即多跳检索。

为了促进后续研究，我们公开发布了扩展后的 MSC 数据集、嵌套 KV 检索数据集，以及一个包含 2,000 万篇 Wikipedia 文章嵌入的数据集。基准测试代码可在 [MemGPT 研究网站](https://research.memgpt.ai/)获取。

**实现细节。** 在讨论 OpenAI 模型时，除非另有说明，“GPT-4 Turbo”指具体的 `gpt-4-1106-preview` 模型端点（上下文窗口为 $128,000$），“GPT-4”指 `gpt-4-0613`（上下文窗口为 $8,192$），“GPT-3.5 Turbo”指 `gpt-3.5-turbo-1106`（上下文窗口为 $16,385$）。实验中，我们让 MemGPT 分别使用全部基线模型（GPT-4、GPT-4 Turbo 和 GPT-3.5），以展示底层模型性能如何影响 MemGPT 的表现。

### 3.1 用于对话 Agent 的 MemGPT

虚拟伙伴和个性化助手等对话 Agent，旨在与用户开展自然、长期的互动，而这种互动可能持续数周、数月，甚至数年。这给固定长度上下文的模型带来挑战，因为它们只能引用有限的对话历史。“无限上下文”Agent 应该可以无缝处理持续交流，而不存在边界或重置。与用户对话时，这样的 Agent 必须满足两项关键标准：

1. **一致性（Consistency）**——Agent 应该保持对话连贯。新提到的事实、偏好和事件，应当与用户和 Agent 先前的陈述一致。
2. **参与感（Engagement）**——Agent 应该利用关于用户的长期知识来个性化响应。引用先前对话会让交流更加自然、更有参与感。

因此，我们按照这两项标准评估所提出的 MemGPT 系统：

1. MemGPT 是否利用记忆提升对话一致性？它能否记住以往互动中的相关事实、偏好和事件，从而保持连贯？
2. MemGPT 是否利用记忆生成更有参与感的对话？它是否会自发引入远距离的用户信息来个性化消息？

通过评估一致性和参与感，我们可以确定，与固定上下文基线相比，MemGPT 处理长期对话互动挑战的能力如何。它能否满足这些标准，将表明无界上下文是否能给对话 Agent 带来有意义的收益。

**表 2。深度记忆检索（DMR）性能。** 在这项任务中，Agent 会被问及此前某次对话（会话 1–5）中讨论过的主题。Agent 的响应与标准答案进行评分。MemGPT 显著优于固定上下文基线。

| 模型 | 准确率 $\Uparrow$ | ROUGE-L（R）$\Uparrow$ |
|---|---:|---:|
| GPT-3.5 Turbo | 38.7% | 0.394 |
| $+$ MemGPT | 66.9% | 0.629 |
| GPT-4 | 32.1% | 0.296 |
| $+$ MemGPT | 92.5% | 0.814 |
| GPT-4 Turbo | 35.3% | 0.359 |
| $+$ **MemGPT** | **93.4%** | **0.827** |

**数据集。** 我们在 Xu et al.（2021）提出的 Multi-Session Chat（MSC）数据集上评估 MemGPT 和固定上下文基线。该数据集包含由人工标注者生成的多会话聊天记录；每位标注者都被要求在全部会话期间扮演同一个一致角色。MSC 中的每组多会话聊天总共包含五次会话，每次会话大约由十几条消息组成。作为一致性实验的一部分，我们创建了一个新会话（会话 6），其中包含相同两个角色之间的一组问答响应。

#### 3.1.1 深度记忆检索任务（一致性）

我们提出一项基于 MSC 数据集的新“深度记忆检索”（DMR）任务，用于测试对话 Agent 的一致性。在 DMR 中，用户向对话 Agent 提出一个明确回指先前对话的问题，而且预期答案范围非常狭窄。我们使用另一个 LLM 生成 DMR 问答（QA）对；该 LLM 获得的指令是：让一个用户向另一个用户提出只有依靠此前会话中获得的知识才能正确回答的问题（更多细节见附录）。

我们使用 ROUGE-L 分数（Lin, 2004）以及一个“LLM 裁判”，对生成响应相对于“标准响应”的质量进行评估。LLM 裁判被要求判断生成响应是否与标准响应一致；研究已经表明，GPT-4 与人类评估者具有较高一致度（Zheng et al., 2023）。

实践中，我们注意到，无论 MemGPT 还是基线，生成的响应通常都比标准响应更冗长。为了考虑生成的 Agent 回复相对于简短标准答案标签的冗长度，我们使用 ROUGE-L 召回率（R）指标。

**表 3。对话开场白性能。** 使用生成开场白与标准角色标签之间的相似度（SIM-1/3），以及与人类创作开场白之间的相似度（SIM-H），对 Agent 的对话开场白进行评估。在多种底层模型上，MemGPT 都能够超过人类创作的对话开场白。

| 方法 | $\Uparrow$ SIM-1 | SIM-3 | SIM-H |
|---|---:|---:|---:|
| Human | 0.800 | 0.800 | 1.000 |
| GPT-3.5 Turbo | 0.830 | 0.812 | **0.817** |
| GPT-4 | **0.868** | **0.843** | 0.773 |
| GPT-4 Turbo | 0.857 | 0.828 | 0.767 |

**MemGPT 利用记忆维持连贯性。** 表 2 展示了 MemGPT 与固定记忆基线的表现。我们比较采用不同底层 LLM 的 MemGPT，并以不使用 MemGPT 的基础 LLM 作为基线。为模拟持续的递归摘要过程，基线能够看到过去五次对话的有损摘要；MemGPT 则能访问完整对话历史，但必须通过对回忆存储进行分页搜索，把相关历史带入主上下文。在这项任务中，可以看到 MemGPT 明确提升了底层基础 LLM 的表现：从 MemGPT 换成对应的 LLM 基线后，准确率和 ROUGE 分数都明显下降。

#### 3.1.2 对话开场白任务（参与感）

在“对话开场白”任务中，我们评估 Agent 利用先前对话积累的知识，为用户创作有参与感消息的能力。为了利用 MSC 数据集评估开场白的“参与感”，我们把生成的开场白与标准角色设定进行比较：一个有参与感的开场白应该利用角色设定中包含的一项（或多项）数据；在 MSC 中，这些数据实际上概括了此前所有会话积累的知识。

我们还把结果与人类生成的标准开场白进行比较，也就是下一会话中的第一条响应。表 3 报告了 MemGPT 开场白的 CSIM 分数。我们测试了使用不同基础 LLM 的多个 MemGPT 变体。

![图 5：文档问答任务性能](https://ar5iv.labs.arxiv.org/html/2310.08560v2/assets/x5.png)

**图 5。文档 QA 任务性能。** MemGPT 的表现不受上下文长度增加影响。截断等方法可以扩展 GPT-4 这类固定长度模型的有效上下文长度，但随着所需压缩程度提高，此类压缩方法会导致性能下降。在这项任务上，使用 GPT-4 和 GPT-4 Turbo 运行 MemGPT 得到等价结果。

**MemGPT 利用记忆提升参与感。** 如表 3 所示，MemGPT 可以创作有参与感的开场白，其表现与人工编写的开场白相近，偶尔还会超过后者。我们观察到，与人类基线相比，MemGPT 往往会创作更冗长、同时覆盖更多角色信息方面的开场白。此外，还可以看到，把信息存入工作上下文是生成有参与感开场白的关键。

### 3.2 用于文档分析的 MemGPT

如今 Transformer 模型的上下文窗口有限，文档分析也因此面临挑战。如表 1 所示，开放模型与闭源模型都受到上下文长度限制（OpenAI 模型最高为 128k token）。然而，许多文档很容易超过这一长度；例如，年度报告（SEC Form 10-K）等法律或财务文档可以轻易超过 100 万 token。此外，许多实际文档分析任务要求跨多份此类长文档建立联系。

面对这些场景，很难把盲目扩展上下文想象成解决固定上下文问题的方案。近期研究（Liu et al., 2023a）也对简单扩展上下文的效用提出质疑：研究发现，大上下文模型的注意力分布并不均匀——相比位于上下文中部的 token，模型更能回忆上下文窗口开头或结尾的信息。为了支持跨文档推理，需要 MemGPT 这样更加灵活的内存架构。

![图 6：MemGPT 解决文档问答任务](https://ar5iv.labs.arxiv.org/html/2310.08560v2/assets/x6.png)

**图 6。** MemGPT（左）解决文档 QA 任务的示例。一组 Wikipedia 文档被上传到归档存储。MemGPT 通过函数调用查询归档存储，把分页搜索结果拉入主上下文。

#### 3.2.1 多文档问答

为了评估 MemGPT 分析文档的能力，我们在 Liu et al.（2023a）的检索器—阅读器文档 QA 任务上，将 MemGPT 与固定上下文基线进行基准比较。在这项任务中，先从 NaturalQuestions-Open 数据集选择一个问题，再由检索器为该问题挑选相关 Wikipedia 文档。随后，这些文档作为输入交给阅读器模型（LLM），并要求模型使用给定文档回答问题。与 Liu et al.（2023a）相同，我们评估检索文档数 $K$ 增加时阅读器的准确率。

在评估设置中，固定上下文基线和 MemGPT 使用同一个检索器；它在 OpenAI `text-embedding-ada-002` 嵌入上使用相似度搜索（余弦距离），选出排名前 $K$ 的文档。我们使用 MemGPT 的默认存储设置：归档记忆由 PostgreSQL 存储，并通过 pgvector 扩展启用向量搜索。我们预先计算嵌入并将其加载到数据库；数据库使用 HNSW 索引，支持近似且低于一秒的查询时间。

在 MemGPT 中，整套嵌入文档集都会加载到归档存储，而检索器会自然地通过归档存储搜索功能出现；该功能基于余弦相似度执行向量搜索。在固定上下文基线中，排名前 $K$ 的文档由检索器独立于 LLM 推理过程取得，类似 Liu et al.（2023a）原始的检索器—阅读器设置。

我们沿用此前 NaturalQuestions-Open 工作（Izacard & Grave, 2020；Izacard et al., 2021），使用 2018 年末的 Wikipedia 转储，并抽取 50 个问题的子集进行评估。抽取的问题和完成嵌入的 Wikipedia 段落都已公开发布。为了确保答案正确来自检索文档，并避免把非完全匹配的字符串判为错误，我们使用 LLM 裁判评估 MemGPT 与基线的表现。

图 5 展示了文档 QA 任务的结果。固定上下文基线的表现上限大致受检索器表现限制，因为它们只能使用上下文窗口中呈现的信息。例如，如果嵌入搜索检索器没有使用给定问题找到标准文章，固定上下文基线就一定无法看到该文章。

相比之下，MemGPT 实际上能够通过查询归档存储多次调用检索器，因此可以扩展到更大的有效上下文长度。MemGPT 主动从归档存储检索文档，并且可以迭代浏览多页结果，所以 MemGPT 可访问的文档总数不再受 LLM 处理器上下文窗口所能容纳文档数量的限制。

![图 7：嵌套 KV 检索任务性能](https://ar5iv.labs.arxiv.org/html/2310.08560v2/assets/x7.png)

**图 7。嵌套 KV 检索任务性能。** MemGPT 是唯一能够在嵌套层数超过 2 后仍持续完成嵌套 KV 任务的方法。尽管 GPT-4 Turbo 作为基线时表现更好，但采用 GPT-4 Turbo 的 MemGPT，表现却不如采用 GPT-4 的 MemGPT。

由于基于嵌入的相似度搜索存在局限，文档 QA 任务对所有方法都很困难。我们观察到，对于所选问题，其标准文档（由 NaturalQuestions-Open 标注）经常出现在前十几个检索结果之外，有时甚至排得更靠后。

检索器的表现会直接转化为固定上下文基线的结果：检索文档较少时，GPT-4 的准确率相对较低；随着更多文档加入上下文窗口，准确率会继续提高，因为它确实把回答限制在检索文档提供的信息之内。

理论上，MemGPT 不受次优检索器表现的限制：即使基于嵌入的排序有噪声，只要完整检索器排序中包含标准文档，通过分页执行足够多次检索调用，仍然可以找到它。然而我们观察到，MemGPT 往往会在穷尽检索器数据库之前，停止翻阅检索结果。

![图 8：MemGPT 解决嵌套 KV 任务](https://ar5iv.labs.arxiv.org/html/2310.08560v2/assets/x8.png)

**图 8。** MemGPT（左）解决嵌套 KV 任务的示例（为便于阅读，UUID 已缩短）。在这个具体示例中，键值对包含两个嵌套层级：`831..ea5` $\rightarrow$ `5b8..4c3` $\rightarrow$ `f37...617`。当对最终值（`f37...617`）的查询只返回一个结果时，说明该值本身不再是键，于是 MemGPT Agent 返回最终答案。

为了在超过默认上下文长度之后继续比较固定上下文基线与 MemGPT，我们会截断检索器返回的文档片段，使相同数量的文档能够装入可用上下文。正如预期，文档越短，标准文档中的相关片段越可能遭到删除，因此文档截断会降低准确率，如图 5 所示。使用 GPT-3.5 时，MemGPT 的表现显著下降，这是因为该模型的函数调用能力有限；使用 GPT-4 时表现最好。

#### 3.2.2 嵌套键值检索（KV）

我们提出一项新任务，它建立在先前工作（Liu et al., 2023a）提出的合成键值检索任务之上。这项任务旨在展示 MemGPT 如何汇集多个数据源的信息。在原始 KV 任务中，作者生成了一组合成键值对，其中每个键和值都是 128 位 UUID（通用唯一标识符）。随后，Agent 会获得一个键，并被要求返回与之关联的值。

我们创建了一个 KV 任务变体——*嵌套 KV 检索*。其中的值本身也可能是键，因此 Agent 必须执行多跳查找。在我们的设置中，UUID 对的总数固定为 140，约合 8k token，也就是 GPT-4 基线的上下文长度。我们把总嵌套层级从 0 变到 4：0 表示初始键值对的值不是键；4 表示必须总共执行 4 次 KV 查找才能找到最终值。我们抽样了 30 种不同的排序配置，其中同时改变初始键位置和嵌套键位置。

GPT-3.5 和 GPT-4 在原始 KV 任务上表现良好，但二者在嵌套 KV 任务中都遇到困难。GPT-3.5 无法完成嵌套变体，性能立即下降，在 1 层嵌套时准确率就变成 0%；我们观察到，它的主要失败模式是直接返回原始值。GPT-4 和 GPT-4 Turbo 优于 GPT-3.5，但也出现类似下降，到 3 层嵌套时准确率变成 0%。

另一方面，使用 GPT-4 的 MemGPT 不受嵌套层数影响，并且能够通过函数查询反复访问存储在主上下文中的键值对，完成嵌套查找。使用 GPT-4 Turbo 和 GPT-3.5 的 MemGPT 也优于对应的基线模型，但由于没能执行足够次数的查找，其性能仍会从 2 层嵌套开始下降。MemGPT 在嵌套 KV 任务上的表现，证明了它可以组合多次查询来执行多跳查找。

## 4 相关工作

**长上下文 LLM。** 多条研究路线都改善了 LLM 的上下文长度。例如，通过稀疏化注意力（Child et al., 2019；Beltagy et al., 2020）、低秩近似（Wang et al., 2020）和神经记忆（Lee et al., 2019），可以构造效率更高的 Transformer 架构。另一条研究路线试图把上下文窗口扩展到超过模型最初训练时的长度，例如 Press et al.（2021）和 Chen et al.（2023）。这些上下文长度方面的改进会扩大 MemGPT 的主存，因此 MemGPT 建立在它们之上。我们的主要贡献，是一套以长上下文 LLM 作为主存实现的分层内存。

**检索增强模型。** MemGPT 的外部存储设计建立在大量先前工作之上；这些工作使用外部检索器中的相关输入来增强 LLM（Ram et al., 2023；Borgeaud et al., 2022；Karpukhin et al., 2020；Lewis et al., 2020；Guu et al., 2020；Lin et al., 2023）。其中，Jiang et al.（2023）提出 FLARE，让 LLM 能够在生成过程中主动决定何时检索、检索什么。Trivedi et al.（2022）把检索与思维链推理交错执行，以改善多步问答。

**作为 Agent 的 LLM。** 近期工作探索了如何为 LLM 增加额外能力，使其可以在交互式环境中充当 Agent。Park et al.（2023）提出为 LLM 增加记忆并把 LLM 用作规划器；他们在一个受电子游戏 *The Sims* 启发的多 Agent 沙盒环境中观察到涌现的社会行为，其中 Agent 可以完成家务或爱好、上班、与其他 Agent 对话等基本活动。Nakano et al.（2021）训练模型在回答问题之前搜索 Web，并在 Web 浏览环境中使用与 MemGPT 相似的分页概念来控制底层上下文大小。Yao et al.（2022）表明，把思维链推理（Wei et al., 2022）与行动交错执行，可以进一步提升交互式 LLM Agent 的规划能力；类似地，MemGPT 中的 LLM 在执行函数时可以“把计划说出来”。Liu et al.（2023b）提出 AgentBench——一套用于评估交互式环境中 LLM Agent 的基准，涵盖电子游戏、思维谜题和网上购物。与之不同，我们的工作重点是解决如何让 Agent 拥有用户输入长期记忆的问题。

## 5 结论

本文提出 MemGPT：一个受操作系统启发、用于管理大语言模型有限上下文窗口的新型 LLM 系统。通过设计类似传统操作系统的内存层次结构和控制流，MemGPT 为 LLM 营造出拥有更多上下文资源的效果。我们在两个现有 LLM 因有限上下文长度而受限的领域评估了这套受操作系统启发的方法：文档分析和对话 Agent。

在文档分析中，MemGPT 通过有效地把相关上下文换入和换出内存，能够处理远远超过当前 LLM 上下文限制的长文本。在对话 Agent 中，MemGPT 能够在长时间对话中维持长期记忆、一致性和演进能力。总体而言，MemGPT 表明，即使受到固定上下文长度限制，分层内存管理和中断等操作系统技术仍能释放 LLM 的潜力。

这项工作开辟了大量未来探索方向，包括：把 MemGPT 应用于其他具有海量或无界上下文的领域；集成数据库、缓存等不同的内存层技术；进一步改进控制流和内存管理策略。MemGPT 把操作系统架构中的概念引入 AI 系统，代表了一条很有前景的新方向：在 LLM 的基本限制之内，最大限度发挥其能力。

> **版本核对说明（非论文原文段落）**：arXiv v2 的 `main.tex` 和源包没有独立的 **Limitations** 或 **Acknowledgements** 章节。为严格遵循“v2 为唯一原文”，本译文不混入 v1 中曾存在的 Limitations 内容，也不虚构致谢。v2 在实验部分明确讨论的限制——检索器排序、提前停止分页和函数调用能力——已在第 3 节相应位置完整翻译。

## 参考文献

以下 35 条参考文献按照 v2 的 `main.bbl` 顺序保留；为避免改变可检索的书目信息，论文题名和出版信息保留原文。

- Iz Beltagy, Matthew E. Peters, and Arman Cohan. “Longformer: The long-document transformer.” *arXiv preprint arXiv:2004.05150*, 2020.
- Sebastian Borgeaud, Arthur Mensch, Jordan Hoffmann, Trevor Cai, Eliza Rutherford, Katie Millican, George Bm Van Den Driessche, Jean-Baptiste Lespiau, Bogdan Damoc, Aidan Clark, et al. “Improving language models by retrieving from trillions of tokens.” In *International Conference on Machine Learning*, pp. 2206–2240. PMLR, 2022.
- Tom Brown, Benjamin Mann, Nick Ryder, Melanie Subbiah, Jared D. Kaplan, Prafulla Dhariwal, Arvind Neelakantan, Pranav Shyam, Girish Sastry, Amanda Askell, et al. “Language models are few-shot learners.” *Advances in Neural Information Processing Systems*, 33:1877–1901, 2020.
- Shouyuan Chen, Sherman Wong, Liangjian Chen, and Yuandong Tian. “Extending context window of large language models via positional interpolation.” *arXiv preprint arXiv:2306.15595*, 2023.
- Rewon Child, Scott Gray, Alec Radford, and Ilya Sutskever. “Generating long sequences with sparse transformers.” *arXiv preprint arXiv:1904.10509*, 2019.
- Zihang Dai, Zhilin Yang, Yiming Yang, Jaime Carbonell, Quoc V. Le, and Ruslan Salakhutdinov. “Transformer-XL: Attentive language models beyond a fixed-length context.” *arXiv preprint arXiv:1901.02860*, 2019.
- Jacob Devlin, Ming-Wei Chang, Kenton Lee, and Kristina Toutanova. “BERT: Pre-training of deep bidirectional transformers for language understanding.” *arXiv preprint arXiv:1810.04805*, 2018.
- Zican Dong, Tianyi Tang, Lunyi Li, and Wayne Xin Zhao. “A survey on long text modeling with transformers.” *arXiv preprint arXiv:2302.14502*, 2023.
- Kelvin Guu, Kenton Lee, Zora Tung, Panupong Pasupat, and Mingwei Chang. “Retrieval augmented language model pre-training.” In *International Conference on Machine Learning*, pp. 3929–3938. PMLR, 2020.
- Gautier Izacard and Edouard Grave. “Leveraging passage retrieval with generative models for open domain question answering.” *arXiv preprint arXiv:2007.01282*, 2020.
- Gautier Izacard, Mathilde Caron, Lucas Hosseini, Sebastian Riedel, Piotr Bojanowski, Armand Joulin, and Edouard Grave. “Unsupervised dense information retrieval with contrastive learning.” *arXiv preprint arXiv:2112.09118*, 2021.
- Zhengbao Jiang, Frank F. Xu, Luyu Gao, Zhiqing Sun, Qian Liu, Jane Dwivedi-Yu, Yiming Yang, Jamie Callan, and Graham Neubig. “Active retrieval augmented generation.” *arXiv preprint arXiv:2305.06983*, 2023.
- Vladimir Karpukhin, Barlas Oğuz, Sewon Min, Patrick Lewis, Ledell Wu, Sergey Edunov, Danqi Chen, and Wen-tau Yih. “Dense passage retrieval for open-domain question answering.” *arXiv preprint arXiv:2004.04906*, 2020.
- Nikita Kitaev, Łukasz Kaiser, and Anselm Levskaya. “Reformer: The efficient transformer.” *arXiv preprint arXiv:2001.04451*, 2020.
- Juho Lee, Yoonho Lee, Jungtaek Kim, Adam Kosiorek, Seungjin Choi, and Yee Whye Teh. “Set transformer: A framework for attention-based permutation-invariant neural networks.” In *International Conference on Machine Learning*, pp. 3744–3753. PMLR, 2019.
- Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, et al. “Retrieval-augmented generation for knowledge-intensive NLP tasks.” *Advances in Neural Information Processing Systems*, 33:9459–9474, 2020.
- Chin-Yew Lin. “ROUGE: A package for automatic evaluation of summaries.” In *Text Summarization Branches Out*, pp. 74–81, 2004.
- Xi Victoria Lin, Xilun Chen, Mingda Chen, Weijia Shi, Maria Lomeli, Rich James, Pedro Rodriguez, Jacob Kahn, Gergely Szilvasy, Mike Lewis, Luke Zettlemoyer, and Scott Yih. “RA-DIT: Retrieval-augmented dual instruction tuning.” 2023.
- Nelson F. Liu, Kevin Lin, John Hewitt, Ashwin Paranjape, Michele Bevilacqua, Fabio Petroni, and Percy Liang. “Lost in the middle: How language models use long contexts.” *arXiv preprint arXiv:2307.03172*, 2023a.
- Xiao Liu, Hao Yu, Hanchen Zhang, Yifan Xu, Xuanyu Lei, Hanyu Lai, Yu Gu, Hangliang Ding, Kaiwen Men, Kejuan Yang, et al. “AgentBench: Evaluating LLMs as agents.” *arXiv preprint arXiv:2308.03688*, 2023b.
- Reiichiro Nakano, Jacob Hilton, Suchir Balaji, Jeff Wu, Long Ouyang, Christina Kim, Christopher Hesse, Shantanu Jain, Vineet Kosaraju, William Saunders, et al. “WebGPT: Browser-assisted question-answering with human feedback.” *arXiv preprint arXiv:2112.09332*, 2021.
- Long Ouyang, Jeffrey Wu, Xu Jiang, Diogo Almeida, Carroll Wainwright, Pamela Mishkin, Chong Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray, et al. “Training language models to follow instructions with human feedback.” *Advances in Neural Information Processing Systems*, 35:27730–27744, 2022.
- Joon Sung Park, Joseph C. O’Brien, Carrie J. Cai, Meredith Ringel Morris, Percy Liang, and Michael S. Bernstein. “Generative agents: Interactive simulacra of human behavior.” *arXiv preprint arXiv:2304.03442*, 2023.
- David A. Patterson, Garth Gibson, and Randy H. Katz. “A case for redundant arrays of inexpensive disks (RAID).” In *Proceedings of the 1988 ACM SIGMOD International Conference on Management of Data*, pp. 109–116, 1988.
- Ofir Press, Noah A. Smith, and Mike Lewis. “Train short, test long: Attention with linear biases enables input length extrapolation.” *arXiv preprint arXiv:2108.12409*, 2021.
- Ori Ram, Yoav Levine, Itay Dalmedigos, Dor Muhlgay, Amnon Shashua, Kevin Leyton-Brown, and Yoav Shoham. “In-context retrieval-augmented language models.” *arXiv preprint arXiv:2302.00083*, 2023.
- Timo Schick, Jane Dwivedi-Yu, Roberto Dessì, Roberta Raileanu, Maria Lomeli, Luke Zettlemoyer, Nicola Cancedda, and Thomas Scialom. “Toolformer: Language models can teach themselves to use tools.” *arXiv preprint arXiv:2302.04761*, 2023.
- Hugo Touvron, Louis Martin, Kevin Stone, Peter Albert, Amjad Almahairi, Yasmine Babaei, Nikolay Bashlykov, Soumya Batra, Prajjwal Bhargava, Shruti Bhosale, et al. “Llama 2: Open foundation and fine-tuned chat models.” *arXiv preprint arXiv:2307.09288*, 2023.
- Harsh Trivedi, Niranjan Balasubramanian, Tushar Khot, and Ashish Sabharwal. “Interleaving retrieval with chain-of-thought reasoning for knowledge-intensive multi-step questions.” *arXiv*, abs/2212.10509, 2022. URL: https://api.semanticscholar.org/CorpusID:254877499.
- Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, and Illia Polosukhin. “Attention is all you need.” *Advances in Neural Information Processing Systems*, 30, 2017.
- Sinong Wang, Belinda Z. Li, Madian Khabsa, Han Fang, and Hao Ma. “Linformer: Self-attention with linear complexity.” *arXiv preprint arXiv:2006.04768*, 2020.
- Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Fei Xia, Ed Chi, Quoc V. Le, Denny Zhou, et al. “Chain-of-thought prompting elicits reasoning in large language models.” *Advances in Neural Information Processing Systems*, 35:24824–24837, 2022.
- Jing Xu, Arthur Szlam, and Jason Weston. “Beyond goldfish memory: Long-term open-domain conversation.” *arXiv preprint arXiv:2107.07567*, 2021.
- Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, and Yuan Cao. “ReAct: Synergizing reasoning and acting in language models.” *arXiv preprint arXiv:2210.03629*, 2022.
- Lianmin Zheng, Wei-Lin Chiang, Ying Sheng, Siyuan Zhuang, Zhanghao Wu, Yonghao Zhuang, Zi Lin, Zhuohan Li, Dacheng Li, Eric Xing, et al. “Judging LLM-as-a-judge with MT-Bench and Chatbot Arena.” *arXiv preprint arXiv:2306.05685*, 2023.

## 附录

### 提示词与指令

为简洁起见，论文中展示的 MemGPT 提示词经过编辑。包括完整、精确提示词在内的实现细节，请访问 [MemGPT 研究网站](https://research.memgpt.ai/)。

#### MemGPT 指令（DMR）

以下是聊天/对话相关任务中，MemGPT 角色所用指令的示例。

原始提示词：

```text
The following is information about myself. My task is to completely immerse myself in this role (I should never say that I am an AI, and should reply as if I am playing this role). If the user asks me a question, I should reply with a best guess using the information in core memory and conversation_search.
```

中文译文：

> 以下是关于我自己的信息。我的任务是完全沉浸在这个角色中（我绝不能说自己是 AI，并且应该像正在扮演该角色一样回答）。如果用户向我提问，我应该利用核心记忆和 `conversation_search` 中的信息，给出自己最合理的猜测。

基线通过系统提示词（预提示）收到以下指令。

原始提示词：

```text
Your task is to answer a question from the user about your prior conversations.
The following is a summary of all your prior conversations:
CONVERSATION_SUMMARY
Answer from the perspective of the persona provided (do not say that you are an AI assistant).
If you do not have enough information to answer the question, reply 'NO ANSWER'. Either reply with the answer, or reply 'NO ANSWER', do not say anything else.
```

中文译文：

> 你的任务是回答用户关于你们此前对话的一个问题。下面是你们此前所有对话的摘要：`CONVERSATION_SUMMARY`。请从给定角色的视角回答（不要说自己是 AI 助手）。如果没有足够信息回答问题，请回复 `NO ANSWER`。只能回复答案或 `NO ANSWER`，不要说任何其他内容。

#### LLM 裁判（DMR / 开场白）

为了检查 DMR 任务答案是否正确，我们使用了 LLM 裁判。LLM 裁判会获得基线方法和 MemGPT 生成的答案，并使用以下提示词作出判断。

原始提示词：

```text
Your task is to label an answer to a question as 'CORRECT' or 'WRONG'.
You will be given the following data: (1) a question (posed by one user to another user), (2) a 'gold' (ground truth) answer, (3) a generated answer which you will score as CORRECT/WRONG.
The point of the question is to ask about something one user should know about the other user based on their prior conversations.
The gold answer will usually be a concise and short answer that includes the referenced topic, for example:
Question: Do you remember what I got the last time I went to Hawaii?
Gold answer: A shell necklace
The generated answer might be much longer, but you should be generous with your grading - as long as it touches on the same topic as the gold answer, it should be counted as CORRECT.
For example, the following answers would be considered CORRECT:
Generated answer (CORRECT): Oh yeah, that was so fun! I got so much stuff there, including that shell necklace.
Generated answer (CORRECT): I got a ton of stuff... that surfboard, the mug, the necklace, those coasters too..
Generated answer (CORRECT): That cute necklace
The following answers would be considered WRONG:
Generated answer (WRONG): Oh yeah, that was so fun! I got so much stuff there, including that mug.
Generated answer (WRONG): I got a ton of stuff... that surfboard, the mug, those coasters too..
Generated answer (WRONG): I'm sorry, I don't remember what you're talking about.
Now it's time for the real question:
Question: QUESTION
Gold answer: GOLD_ANSWER
Generated answer: GENERATED_ANSWER
First, provide a short (one sentence) explanation of your reasoning, then finish with CORRECT or WRONG. Do NOT include both CORRECT and WRONG in your response, or it will break the evaluation script.
```

中文译文：

> 你的任务是把某个问题的答案标记为 `CORRECT` 或 `WRONG`。你将获得以下数据：（1）一个问题（由一名用户向另一名用户提出）；（2）一个“标准”（真实）答案；（3）一个生成答案，你需要把它评为 `CORRECT` 或 `WRONG`。问题旨在询问一名用户根据双方此前的对话，应该知道的关于另一名用户的事情。标准答案通常简短，并包含所引用的主题。例如，问题是“你还记得我上次去夏威夷买了什么吗？”，标准答案是“一条贝壳项链”。生成答案可能长得多，但评分时应该宽松：只要涉及与标准答案相同的主题，就应视为 `CORRECT`。
>
> 例如，以下答案应视为 `CORRECT`：“哦，对，那次太好玩了！我在那里买了好多东西，包括那条贝壳项链。”；“我买了一大堆东西……那块冲浪板、杯子、项链，还有那些杯垫……”；“那条可爱的项链。”
>
> 以下答案应视为 `WRONG`：“哦，对，那次太好玩了！我在那里买了好多东西，包括那个杯子。”；“我买了一大堆东西……那块冲浪板、杯子，还有那些杯垫……”；“抱歉，我不记得你在说什么。”
>
> 接下来是真实问题：问题为 `QUESTION`，标准答案为 `GOLD_ANSWER`，生成答案为 `GENERATED_ANSWER`。首先用一句话简要解释判断理由，然后以 `CORRECT` 或 `WRONG` 结束。响应中不要同时出现 `CORRECT` 和 `WRONG`，否则会破坏评估脚本。

#### 使用 Self-Instruct 生成 DMR 数据集

DMR 问答对使用以下提示词和原始 MSC 数据集生成。任务是为两个用户之间的模拟对话编写一道“记忆挑战”问题。

原始提示词：

```text
You get as input:
- personas for each user (gives you their basic facts)
- a record of an old chat the two users had with each other

Your task is to write a question from user A to user B that test's user B's memory.
The question should be crafted in a way that user B must have actually participated in the prior conversation to answer properly, not just have read the persona summary.
Do NOT under any circumstances create a question that can be answered using the persona information (that's considered cheating).
Instead, write a question that can only be answered by looking at the old chat log (and is not contained in the persona information).

For example, given the following chat log and persona summaries:

old chat between user A and user B
A: Are you into surfing? I'm super into surfing myself
B: Actually I'm looking to learn. Maybe you could give me a basic lesson some time!
A: Yeah for sure! We could go to Pacifica, the waves there are pretty light and easy
B: That sounds awesome
A: There's even a cool Taco Bell right by the beach, could grab a bite after
B: What about this Sunday around noon?
A: Yeah let's do it!

user A persona:
I like surfing
I grew up in Santa Cruz

user B persona:
I work in tech
I live in downtown San Francisco

Here's an example of a good question that sounds natural, and an answer that cannot be directly inferred from user A's persona:

User B's question for user A
B: Remember that one time we went surfing? What was that one place we went to for lunch called?
A: Taco Bell!

This is an example of a bad question, where the question comes across as unnatural, and the answer can be inferred directly from user A's persona:

User B's question for user A
B: Do you like surfing?
A: Yes, I like surfing

Never, ever, ever create questions that can be answered from the persona information.
```

中文译文：

> 你会获得以下输入：
>
> - 每名用户的角色设定（提供他们的基本事实）
> - 两名用户之间一段旧聊天的记录
>
> 你的任务是写出一道由用户 A 向用户 B 提出、用于测试用户 B 记忆的问题。
>
> 问题应当设计成：用户 B 必须真正参与过此前的对话才能正确回答，而不是只读过角色摘要就能回答。
>
> 任何情况下都不要创建可以使用角色信息回答的问题（那会被视为作弊）。
>
> 相反，请写出一道只能通过查看旧聊天记录回答、而且答案不包含在角色信息中的问题。
>
> 例如，给定下面的聊天记录和角色摘要：
>
> 用户 A 与用户 B 的旧聊天  
> A：你喜欢冲浪吗？我自己超级喜欢冲浪。  
> B：其实我正想学。也许你有空可以给我上一堂基础课！  
> A：当然可以！我们可以去 Pacifica，那里的浪很小，也比较容易。  
> B：听起来太棒了。  
> A：海滩旁边甚至还有一家很酷的 Taco Bell，结束后可以去吃点东西。  
> B：这个星期天中午怎么样？  
> A：好，就这么定！
>
> 用户 A 的角色设定：  
> 我喜欢冲浪。  
> 我在 Santa Cruz 长大。
>
> 用户 B 的角色设定：  
> 我从事科技行业。  
> 我住在 San Francisco 市中心。
>
> 下面是一个好问题的示例：它听起来自然，而且无法直接从用户 A 的角色设定推断答案。
>
> 用户 B 向用户 A 提问  
> B：还记得我们那次去冲浪吗？我们午饭去的那家店叫什么来着？  
> A：Taco Bell！
>
> 下面是一个坏问题的示例：问题听起来不自然，而且答案可以直接从用户 A 的角色设定推断。
>
> 用户 B 向用户 A 提问  
> B：你喜欢冲浪吗？  
> A：是的，我喜欢冲浪。
>
> 永远、绝对、绝对不要创建可以从角色信息回答的问题。

#### 文档分析指令

下面是文档分析任务的预提示中使用的指令示例。

原始提示词：

```text
You are MemGPT DOC-QA bot. Your job is to answer questions about documents that are stored in your archival memory. The answer to the users question will ALWAYS be in your archival memory, so remember to keep searching if you can't find the answer. Answer the questions as if though the year is 2018.
```

中文译文：

> 你是 MemGPT DOC-QA 机器人。你的工作是回答关于归档记忆中所存文档的问题。用户问题的答案一定存在于归档记忆中，因此如果没有找到答案，请记得继续搜索。请把当前年份视为 2018 年来回答问题。

问题通过以下提示词提供给 MemGPT。

原始提示词：

```text
Search your archival memory to answer the provided question. Provide both the answer and the archival memory result from which you determined your answer. Format your response with the format 'ANSWER: [YOUR ANSWER], DOCUMENT: [ARCHIVAL MEMORY TEXT]. Your task is to answer the question:
```

中文译文：

> 搜索你的归档记忆以回答给定问题。请同时提供答案，以及你据以确定答案的归档记忆结果。使用以下格式组织响应：`ANSWER: [YOUR ANSWER], DOCUMENT: [ARCHIVAL MEMORY TEXT]`。你的任务是回答以下问题：

对于基线，系统会提供以下提示词以及一组检索到的文档。

原始提示词：

```text
Answer the question provided according to the list of documents below (some of which might be irrelevant. In your response, provide both the answer and the document text from which you determined the answer. Format your response with the format 'ANSWER: <YOUR ANSWER>, DOCUMENT: [DOCUMENT TEXT]'. If none of the documents provided have the answer to the question, reply with 'INSUFFICIENT INFORMATION'. Do NOT provide an answer if you cannot find it in the provided documents. Your response will only be considered correct if you provide both the answer and relevant document text, or say 'INSUFFICIENT INFORMATION'. Answer the question as if though the current year is 2018.
```

中文译文：

> 根据下面的文档列表回答给定问题（其中一些文档可能无关）。响应中请同时提供答案和你据以确定答案的文档文本。使用以下格式组织响应：`ANSWER: <YOUR ANSWER>, DOCUMENT: [DOCUMENT TEXT]`。如果给出的文档都不包含问题答案，请回复 `INSUFFICIENT INFORMATION`。如果无法在给定文档中找到答案，不要提供答案。只有同时给出答案和相关文档文本，或回答 `INSUFFICIENT INFORMATION`，响应才会被视为正确。请把当前年份视为 2018 年来回答问题。

#### LLM 裁判（文档分析）

为了检查文档分析任务的答案是否正确，并确保答案确实来自给定文本而非模型权重，我们使用了 LLM 裁判。LLM 裁判会获得基线方法和 MemGPT 生成的答案，并使用以下提示词作出判断。

原始提示词：

```text
Your task is to evaluate whether an LLM correct answered a question. The LLM response should be the format "ANSWER: [answer], DOCUMENT: [document_text]" or say "INSUFFICIENT INFORMATION". The true answer is provided in the format "TRUE ANSWER:[list of possible answers]". The questions is provided in the format "QUESTION: [question]". If the LLM response contains both the correct answer and corresponding document text, the response is correct. Even if the LLM's answer and the true answer are slightly different in wording, the response is still correct. For example, if the answer is more specific than the true answer or uses a different phrasing that is still correct, the response is correct. If the LLM response if "INSUFFICIENT INFORMATION", or the "DOCUMENT" field is missing, the response is incorrect. Respond with a single token: "CORRECT" or "INCORRECT".
```

中文译文：

> 你的任务是评估 LLM 是否正确回答了问题。LLM 响应应采用 `ANSWER: [answer], DOCUMENT: [document_text]` 格式，或者回答 `INSUFFICIENT INFORMATION`。真实答案以 `TRUE ANSWER:[list of possible answers]` 格式提供，问题以 `QUESTION: [question]` 格式提供。如果 LLM 响应同时包含正确答案和对应文档文本，响应就是正确的。即使 LLM 的答案与真实答案在措辞上略有不同，仍然可以是正确的；例如，答案比真实答案更具体，或者使用了不同但仍然正确的表述，也应视为正确。如果 LLM 响应是 `INSUFFICIENT INFORMATION`，或者缺少 `DOCUMENT` 字段，响应就是错误的。请只用一个 token 回答：`CORRECT` 或 `INCORRECT`。

#### K/V 任务指令

MemGPT Agent 使用以下角色定义；它旨在鼓励 MemGPT 进行迭代搜索。

原始提示词：

```text
You are MemGPT DOC-QA bot. Your job is to answer questions about documents that are stored in your archival memory. The answer to the users question will ALWAYS be in your archival memory, so remember to keep searching if you can't find the answer. DO NOT STOP SEARCHING UNTIL YOU VERIFY THAT THE VALUE IS NOT A KEY. Do not stop making nested lookups until this condition is met.
```

中文译文：

> 你是 MemGPT DOC-QA 机器人。你的工作是回答关于归档记忆中所存文档的问题。用户问题的答案一定存在于归档记忆中，因此如果没有找到答案，请记得继续搜索。**在确认值不是键之前，不要停止搜索。**在满足这一条件之前，不要停止嵌套查找。

基线收到以下提示词。

原始提示词：

```text
Below is a JSON object containing key-value pairings, all keys and values are 128-bit UUIDs, and your task is to return the value associated with the specified key. If a value itself is also a key, return the value of that key (do a nested lookup). For example, if the value of 'x' is 'y', but 'y' is also a key, return the value of key 'y'.
```

中文译文：

> 下面是一个包含键值对的 JSON 对象，所有键和值都是 128 位 UUID。你的任务是返回与指定键关联的值。如果某个值本身也是键，则返回该键对应的值，也就是执行嵌套查找。例如，如果 `x` 的值是 `y`，但 `y` 同时也是键，则返回键 `y` 的值。
