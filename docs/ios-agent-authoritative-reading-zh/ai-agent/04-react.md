# ReAct：在语言模型中协同推理与行动

- **原文标题**：*ReAct: Synergizing Reasoning and Acting in Language Models*
- **作者**：Shunyu Yao、Jeffrey Zhao、Dian Yu、Nan Du、Izhak Shafran、Karthik Narasimhan、Yuan Cao
- **机构**：Princeton University Department of Computer Science；Google Research, Brain Team
- **作者联系方式**：`{shunyuy,karthikn}@princeton.edu`；`{jeffreyzhao,dianyu,dunan,izhak,yuancao}@google.com`
- **作者脚注**：Shunyu Yao 的相关工作在 Google 实习期间完成；原脚注同时给出项目与代码入口 [https://react-lm.github.io/](https://react-lm.github.io/)。
- **原文版本**：[arXiv:2210.03629v3](https://arxiv.org/abs/2210.03629v3)，2023-03-10；[PDF](https://arxiv.org/pdf/2210.03629v3)
- **项目与代码**：[ReAct 项目页](https://react-lm.github.io/)
- **原文许可证**：[Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/)
- **翻译日期**：2026-07-27
- **译文性质**：非官方中文翻译。本译文是对原文的改编：正文、标题、表题和图注译为中文，排版由 LaTeX/PDF 改为 Markdown，图像改为指向原始渲染资源的绝对链接；公式、模型名、数据集名、参考文献书目信息以及为复现实验而给出的提示与环境轨迹保留原样。上述修改并非原作者所作。

> 版本说明：arXiv v3 没有题为 “Limitations” 的独立章节。原文对方法局限的讨论位于第 1 节贡献概述、第 3 节结果分析、第 4 节结果分析、第 6 节结论及伦理声明中；本译文保留这些内容，不另造原文不存在的章节。原文也没有独立算法环境，数学定义均为行内公式。

## 摘要

尽管大型语言模型（LLM）已经在语言理解和交互式决策任务上表现出令人瞩目的能力，但它们的推理能力（例如思维链提示）和行动能力（例如动作计划生成）过去主要被当作两个彼此分离的主题来研究。

本文探索让 LLM 以交错方式同时生成推理轨迹和任务特定动作，从而使二者产生更强的协同作用：推理轨迹帮助模型推导、跟踪和更新动作计划，并处理异常情况；动作则使模型能够连接知识库或环境等外部来源，并从中获取更多信息。

我们把这种方法称为 **ReAct**，并将其应用于多种语言与决策任务。实验表明，除了提升人类可解释性和可信度之外，ReAct 相比当时最先进的基线方法也更有效。

具体而言，在问答任务 HotpotQA 和事实核验任务 FEVER 上，ReAct 通过与一个简单的 Wikipedia API 交互，克服了思维链推理中普遍存在的幻觉与错误传播问题，并生成了类似人类的任务求解轨迹；与不含推理轨迹的基线相比，这些轨迹更容易解释。

此外，在两个交互式决策基准 ALFWorld 和 WebShop 上，ReAct 只需一到两个上下文示例，成功率就分别比模仿学习和强化学习方法高出 34% 和 10%（绝对百分点）。

## 1 引言

人类智能的一项独特特征，是能够把面向任务的行动与语言推理（或内言，Alderson-Day & Fernyhough, 2015）无缝结合起来。理论研究认为，这种能力通过支持自我调节或策略制定（Vygotsky, 1987；Luria, 1965；Fernyhough, 2010）以及维持工作记忆（Baddeley, 1992），在人类认知中发挥着重要作用。

以在厨房做一道菜为例。在任意两个具体动作之间，我们可能用语言进行推理，以跟踪进度（“现在所有东西都切好了，我应该把那锅水加热”）、处理异常或根据情形调整计划（“我没有盐，那就改用酱油和胡椒”），以及意识到何时需要外部信息（“面团怎么做？我上网搜一下”）。我们也会采取行动来支持推理并回答问题，例如打开食谱查看做法、打开冰箱、检查食材，从而回答“我现在能做什么菜？”这种问题。“行动”与“推理”的紧密协同，使人类即使面对从未见过的情形或信息不确定性，也能快速学习新任务，并稳健地进行决策或推理。

近期结果已经暗示，在自主系统中把语言推理与交互式决策结合起来是可能的。一方面，经过适当提示的大型语言模型已经表现出涌现能力：它们能够执行多个步骤的推理轨迹，从算术、常识和符号推理问题中推导答案（Wei et al., 2022）。然而，这种“思维链”推理是一个静态黑箱：模型使用自身内部表征生成思考，却没有扎根于外部世界，因此其反应式推理或知识更新能力受到限制。这会导致事实幻觉，以及错误在推理过程中传播等问题（图 1 的 1b）。

另一方面，已有工作探索使用预训练语言模型在交互环境中进行规划和行动（Ahn et al., 2022；Nakano et al., 2021；Yao et al., 2020；Huang et al., 2022a），重点是借助语言先验预测动作。这些方法通常把多模态观察转换为文本，使用语言模型生成领域特定动作或计划，再由控制器选择或执行。然而，除 Huang et al. (2022b) 使用一种受限的语言推理形式来复述当前状态的空间事实之外，这些方法并没有利用语言模型对高层目标进行抽象推理，也没有维持支持行动的工作记忆。除了与少量积木交互的这类简单具身任务以外，此前尚无研究考察如何以协同方式把推理与行动结合起来以解决一般任务，也没有研究这种结合相比单独推理或单独行动能否带来系统性收益。

![图 1：四种提示方法及两个任务领域的对比](https://ar5iv.labs.arxiv.org/html/2210.03629v3/assets/x1.png)

**图 1。**（1）四种提示方法在回答一道 HotpotQA（Yang et al., 2018）问题时的对比：（a）Standard；（b）思维链（CoT，仅推理）；（c）仅行动（Act-only）；（d）ReAct（推理 + 行动）。（2）用（a）Act-only 和（b）ReAct 提示解决一个 ALFWorld（Shridhar et al., 2020b）游戏的对比。在两个领域中，图里都省略了提示中的上下文示例，只展示模型生成的任务求解轨迹（Act、Thought）以及环境返回的内容（Obs）。

本文提出 ReAct：一种把语言模型的推理与行动结合起来、用于解决多样化语言推理和决策任务的通用范式（图 1）。ReAct 提示 LLM 交错生成与任务有关的语言推理轨迹和动作。这样一来，模型既能进行动态推理，以创建、维护和调整用于行动的高层计划（以推理促进行动），又能与外部环境（例如 Wikipedia）交互，把额外信息纳入推理（以行动促进推理）。

我们在四个不同的基准上对 ReAct 和当时最先进的基线进行了实证评估：问答（HotpotQA；Yang et al., 2018）、事实核验（FEVER；Thorne et al., 2018）、文字游戏（ALFWorld；Shridhar et al., 2020b）和网页导航（WebShop；Yao et al., 2022）。

在 HotpotQA 和 FEVER 上，模型可以访问并交互一个 Wikipedia API。ReAct 优于普通动作生成模型，与思维链推理（CoT；Wei et al., 2022）相当。总体上最好的方案是把 ReAct 与 CoT 结合起来，使推理既能使用内部知识，也能使用从外部获得的信息。

在 ALFWorld 和 WebShop 上，仅含两个甚至一个样例的 ReAct 提示，就能够超过使用 $10^3\sim10^5$ 个任务实例训练的模仿学习或强化学习方法，成功率分别绝对提高 34% 和 10%。通过始终优于仅含动作的受控基线，我们也展示了稀疏且灵活多样的推理对决策的重要性。

除了通用性和性能提升之外，推理与行动的结合还提高了模型在所有领域中的可解释性、可信度和可诊断性：人们可以直接区分哪些信息来自模型内部知识、哪些来自外部环境，也可以检查推理轨迹，以理解模型采取动作的依据。

概括而言，本文的主要贡献如下：

1. 我们提出 ReAct，一种新的、基于提示的范式，用于在语言模型中协同推理与行动，从而解决一般任务。
2. 我们在多个不同基准上进行了大量实验，展示在少样本学习设置下，ReAct 相比仅执行推理或仅生成动作的既有方法具有优势。
3. 我们给出系统性的消融实验和分析，以理解行动对推理任务的重要性，以及推理对交互任务的重要性。
4. 我们分析了提示设置下 ReAct 的局限（即支持的推理和行动行为有限），并开展初步微调实验，表明增加训练数据有望继续提升 ReAct。

若把 ReAct 扩展到更多任务上训练和运行，并把它与强化学习等互补范式结合起来，就可能进一步释放大型语言模型的潜力。

## 2 ReAct：协同 `Re`asoning 与 `Act`ing

考虑一个 Agent 与环境交互以解决任务的一般设置。在时间步 $t$，Agent 从环境接收观察 $o_t\in\mathcal{O}$，并按照某个策略 $\pi(a_t\mid c_t)$ 采取动作 $a_t\in\mathcal{A}$，其中

$$
c_t=(o_1,a_1,\cdots,o_{t-1},a_{t-1},o_t)
$$

是 Agent 的上下文。当映射 $c_t\mapsto a_t$ 高度隐式且需要大量计算时，学习这种策略会十分困难。例如，图 1（1c）中的 Agent 无法生成正确的最终动作（Act 4）以结束问答任务，因为它必须在整个轨迹上下文（Question、Act 1–3、Obs 1–3）上执行复杂推理。类似地，图 1（2a）中的 Agent 没能从上下文理解 `sinkbasin 1` 并不包含 `peppershaker 1`，因而不断产生幻觉动作。

ReAct 的想法很简单：把 Agent 的动作空间扩充为

$$
\hat{\mathcal{A}}=\mathcal{A}\cup\mathcal{L},
$$

其中 $\mathcal{L}$ 是语言空间。语言空间中的动作 $\hat a_t\in\mathcal{L}$ 被称为“思考”（thought）或“推理轨迹”（reasoning trace）；它不会影响外部环境，因此不会产生观察反馈。相反，思考 $\hat a_t$ 的目标是对当前上下文 $c_t$ 进行推理、组织有用信息，并把上下文更新为

$$
c_{t+1}=(c_t,\hat a_t),
$$

以支持后续推理或行动。

如图 1 所示，有用的思考可以有许多类型，例如：分解任务目标并创建动作计划（2b 的 Act 1；1d 的 Thought 1）；注入与解题相关的常识知识（2b 的 Act 1）；从观察中提取重要部分（1d 的 Thought 2、4）；跟踪进展并切换动作计划（2b 的 Act 8）；处理异常并调整动作计划（1d 的 Thought 3）；等等。

不过，语言空间 $\mathcal{L}$ 没有边界，在这种扩充后的动作空间中进行学习十分困难，并且需要强大的语言先验。本文主要考察如下设置：冻结的大型语言模型 PaLM-540B（Chowdhery et al., 2022）[^1] 接收少样本上下文示例的提示，生成用于任务求解的领域特定动作和自由形式语言思考（图 1 的 1d、2b）。每个上下文示例都是一条由人类产生的轨迹，包括解决一个任务实例所需的动作、思考和环境观察（见附录 C）。

对于以推理为主的任务（图 1 的 1），我们交替生成思考和动作，使任务求解轨迹由多个“思考—动作—观察”步骤构成。相反，对于可能包含大量动作的决策任务（图 1 的 2），思考只需稀疏地出现在轨迹最相关的位置，因此我们让语言模型自行决定思考和动作何时异步出现。

因为决策与推理能力被整合进同一个大型语言模型，ReAct 具有以下独特特征：

- **A）直观且易于设计。** ReAct 提示的设计很直接：人类标注者只需在自己采取的动作之上，用语言写下思考。本文没有采用临时拼凑的格式选择、思考设计或示例选择。第 3 节和第 4 节详述了各任务的提示设计。
- **B）通用且灵活。** 得益于灵活的思考空间以及思考—动作出现形式，ReAct 可以处理动作空间和推理需求各不相同的多种任务，包括但不限于问答、事实核验、文字游戏和网页导航。
- **C）高性能且稳健。** ReAct 只从一至六个上下文示例学习，就能对新任务实例表现出很强的泛化能力，并在不同领域中持续优于只有推理或只有行动的基线。第 3 节还展示了启用微调时的额外收益，第 4 节展示 ReAct 的性能对提示选择具有稳健性。
- **D）与人对齐且可控制。** ReAct 提供一种可解释的序贯决策与推理过程，人们能够方便地检查推理和事实是否正确。此外，人还可以通过编辑思考即时控制或纠正 Agent 行为，如第 4 节图 5 所示。

## 3 知识密集型推理任务

我们先研究多跳问答和事实核验等知识密集型推理任务。如图 1（1d）所示，ReAct 与 Wikipedia API 交互来检索支持推理的信息，同时用推理来确定下一步要检索什么，从而体现推理与行动的协同。

### 3.1 设置

#### 领域

我们考察两个对知识检索和推理构成挑战的数据集：

1. HotpotQA（Yang et al., 2018）：一个要求在两个或更多 Wikipedia 段落上推理的多跳问答基准。
2. FEVER（Thorne et al., 2018）：一个事实核验基准。根据是否存在能够核验声明的 Wikipedia 段落，每条声明被标为 `SUPPORTS`、`REFUTES` 或 `NOT ENOUGH INFO`。

在本文中，两个任务都采用“仅问题”设置：模型只接收问题或声明，不会获得支持段落；它们必须依靠内部知识，或通过与外部环境交互来检索知识，以支持推理。

#### 动作空间

我们设计了一个简单的 Wikipedia Web API，用三种动作支持交互式信息检索：

1. **`search[entity]`**：如果对应 `entity` 的 Wiki 页面存在，返回其前五个句子；否则返回 Wikipedia 搜索引擎给出的五个最相似实体。
2. **`lookup[string]`**：返回页面中下一个包含 `string` 的句子，模拟浏览器里的 Ctrl+F。
3. **`finish[answer]`**：以 `answer` 结束当前任务。

需要指出的是，该动作空间基本只能依据精确页面名检索某个段落的一小部分，能力显著弱于当时最先进的词法或神经检索器。这样设计的目的，是模拟人类与 Wikipedia 交互的方式，并迫使模型通过显式的语言推理进行检索。

### 3.2 方法

#### ReAct 提示

对于 HotpotQA 和 FEVER，我们分别从训练集随机选择 6 个和 3 个案例[^2]，手工编写 ReAct 格式的轨迹，作为提示中的少样本示例。与图 1（1d）相似，每条轨迹包括多个“思考—动作—观察”步骤（即密集思考）；其中的自由形式思考承担多种作用。

具体而言，我们组合使用以下思考：分解问题（“我需要搜索 x，找到 y，再找到 z”）；从 Wikipedia 观察中抽取信息（“x 始于 1844 年”“该段落没有说明 x”）；执行常识推理（“x 不是 y，所以 z 一定是……”）或算术推理（“1844 < 1989”）；引导搜索改写（“也许我可以改为搜索/查找 x”）；综合最终答案（“……所以答案是 x”）。详见附录 C。

#### 基线

我们系统性地消融 ReAct 轨迹，从而为多种基线构建提示（格式见图 1 的 1a–1c）：

- **（a）Standard 提示**：删去 ReAct 轨迹中的全部思考、动作和观察。
- **（b）思维链提示（CoT）**（Wei et al., 2022）：删去动作与观察，作为只推理基线。我们还构建了自洽性基线 **CoT-SC**（Wang et al., 2022a, 2022b）：推理时以 0.7 的解码温度采样 21 条 CoT 轨迹，并采用多数答案；已有研究发现，该方法能持续提高 CoT 的表现。
- **（c）仅行动提示（Act）**：删去 ReAct 轨迹中的思考。这大致类似 WebGPT（Nakano et al., 2021）通过与互联网交互回答问题，不过二者的任务和动作空间不同，而且 WebGPT 使用的是模仿学习和强化学习，而不是提示。

#### 结合内部知识与外部知识

正如第 3.3 节将详述的那样，我们观察到 ReAct 展示的解题过程更基于事实、更加扎实；CoT 则更善于构造推理结构，却很容易产生事实或思考幻觉。因此，我们提出结合 ReAct 和 CoT-SC，并按照以下启发式规则，让模型决定何时切换到另一种方法：

- **A）ReAct $\to$ CoT-SC**：如果 ReAct 未能在指定步数内返回答案，就回退到 CoT-SC。HotpotQA 和 FEVER 的步数上限分别设为 7 和 5，因为我们发现增加步数并不会改善 ReAct 的表现[^3]。
- **B）CoT-SC $\to$ ReAct**：如果 $n$ 个 CoT-SC 样本中的多数答案出现次数少于 $n/2$（即内部知识可能不足以让模型有把握地支持该任务），就回退到 ReAct。

#### 微调

由于大规模手工标注推理轨迹和动作十分困难，我们采用一种类似 Zelikman et al. (2022) 的自举方法：使用 ReAct 生成的 3,000 条答案正确的轨迹（其他基线也采用同样做法），微调较小的语言模型 PaLM-8B/62B，使它们在输入问题或声明的条件下解码完整轨迹（全部思考、动作和观察）。更多细节见附录 B.1。

### 3.3 结果与观察

#### ReAct 始终优于 Act

表 1 展示以 PaLM-540B 为基础模型、使用不同提示方法时的 HotpotQA 和 FEVER 结果。ReAct 在两个任务上都优于 Act，这说明推理能够引导行动，尤其有助于综合最终答案，如图 1（1c–d）所示。图 3 的微调结果也确认，推理轨迹有助于做出信息更充分的行动。

**表 1。PaLM-540B 在 HotpotQA 和 FEVER 上的提示结果。**

| 提示方法[^4] | HotpotQA（EM） | FEVER（Acc） |
| --- | ---: | ---: |
| Standard | 28.7 | 57.1 |
| CoT（Wei et al., 2022） | 29.4 | 56.3 |
| CoT-SC（Wang et al., 2022a） | 33.4 | 60.4 |
| Act | 25.7 | 58.9 |
| ReAct | 27.4 | 60.9 |
| CoT-SC $\to$ ReAct | 34.2 | **64.6** |
| ReAct $\to$ CoT-SC | **35.1** | 62.0 |
| 有监督 SoTA[^5] | 67.5 | 89.5 |

![图 2 左：HotpotQA 上不同 CoT-SC 样本数对应的结果](https://ar5iv.labs.arxiv.org/html/2210.03629v3/assets/x2.png)

![图 2 右：FEVER 上不同 CoT-SC 样本数对应的结果](https://ar5iv.labs.arxiv.org/html/2210.03629v3/assets/x3.png)

**图 2。** PaLM-540B 的提示结果随所用 CoT-SC 样本数变化的情况。

**表 2。ReAct 和 CoT 在 HotpotQA 上的成功与失败类型，以及人工研究的随机样例中各类所占比例。**

| 结果 | 类型 | 定义 | ReAct | CoT |
| --- | --- | --- | ---: | ---: |
| 成功 | 真阳性 | 推理轨迹和事实正确 | 94% | 86% |
| 成功 | 假阳性 | 推理轨迹或事实存在幻觉 | 6% | 14% |
| 失败 | 推理错误 | 推理轨迹错误（包括无法从重复步骤中恢复） | 47% | 16% |
| 失败 | 搜索结果错误 | 搜索返回为空，或不含有用信息 | 23% | — |
| 失败 | 幻觉 | 推理轨迹或事实存在幻觉 | 0% | 56% |
| 失败 | 标签歧义 | 预测正确，但未与标签精确匹配 | 29% | 28% |

#### ReAct 与 CoT

另一方面，ReAct 在 FEVER 上优于 CoT（60.9 对 56.3），在 HotpotQA 上略逊于 CoT（27.4 对 29.4）。FEVER 中 `SUPPORTS` 和 `REFUTES` 的声明可能只有很细微的差异（见附录 D.1），所以通过行动检索准确、最新的知识至关重要。

为了更深入地理解 ReAct 与 CoT 在 HotpotQA 上的行为差异，我们分别从 ReAct 和 CoT 的答案正确及答案错误轨迹（以 EM 判断）中随机抽取 50 条，共计 200 个示例，并人工标注其成功和失败模式，见表 2。主要观察如下：

- **A）幻觉是 CoT 的严重问题。** 在成功模式中，CoT 的假阳性率远高于 ReAct（14% 对 6%）；在 CoT 的失败中，幻觉又是主要失败模式（56%）。相比之下，由于可以访问外部知识库，ReAct 的解题轨迹更扎实、更受事实驱动，也更值得信任。
- **B）交错推理、动作和观察虽然提高了 ReAct 的扎实性与可信度，但这种结构约束也降低了它构造推理步骤的灵活性，因而 ReAct 的推理错误率高于 CoT。** ReAct 有一种常见的特有错误模式：模型反复生成之前的思考和动作。我们把它归入“推理错误”，因为模型无法判断下一步应采取什么合适动作，也无法跳出循环[^6]。
- **C）对 ReAct 而言，通过搜索成功检索到有信息量的知识至关重要。** 无信息量的搜索占错误案例的 23%，它会让模型偏离推理方向，使模型很难恢复并重新组织思考。这或许是事实性和灵活性之间预期中的权衡，也是我们提出组合两种方法的动机。

附录 E.1 给出了每一种成功与失败模式的示例。我们还发现，部分 HotpotQA 问题的答案标签可能已经过时，示例见图 4。

#### ReAct + CoT-SC 是提示 LLM 的最佳方法

表 1 还表明，在 HotpotQA 和 FEVER 上，最佳提示方法分别是 ReAct $\to$ CoT-SC 和 CoT-SC $\to$ ReAct。图 2 展示了不同方法随 CoT-SC 样本数变化的表现。两种 ReAct + CoT-SC 方法各自在一个任务上更占优势；但在不同样本数下，两者都显著且持续地优于 CoT-SC，只使用 3–5 个样本就达到 CoT-SC 使用 21 个样本时的表现。这些结果说明，在推理任务中妥善结合模型内部知识与外部知识是有价值的。

![图 3：HotpotQA 上 ReAct 与基线的提示和微调扩展结果](https://ar5iv.labs.arxiv.org/html/2210.03629v3/assets/x4.png)

**图 3。** HotpotQA 上 ReAct（本文方法）和基线方法的提示与微调扩展结果。

#### ReAct 的微调效果最佳

图 3 展示了在 HotpotQA 上对四种方法（Standard、CoT、Act、ReAct）进行提示或微调时的规模效应。对于 PaLM-8B/62B，由于很难从上下文示例中同时学会推理和行动，ReAct 提示在四种方法中表现最差。

然而，只用 3,000 个示例微调之后，ReAct 就成为四种方法中表现最好的一个：经过 ReAct 微调的 PaLM-8B 超过了所有采用提示的 PaLM-62B 方法；经过 ReAct 微调的 PaLM-62B 则超过了所有 540B 提示方法。

相比之下，在 PaLM-8B/62B 上微调 Standard 或 CoT，都显著不如微调 ReAct 或 Act。前两者实质上是在教模型记住（可能带有幻觉的）知识事实；后两者则教模型如何（推理并）行动，从 Wikipedia 获取信息——这是一种对知识推理更容易泛化的技能。

所有提示方法仍明显落后于领域特定的最先进方法（表 1），因此我们认为，使用更多由人类撰写的数据进行微调，可能是进一步释放 ReAct 能力的更好途径。

## 4 决策任务

我们还在两个基于语言的交互式决策任务 ALFWorld 和 WebShop 上测试 ReAct。两个任务都包含复杂环境，要求 Agent 在稀疏奖励下跨较长时间范围行动，因此需要通过推理来有效行动和探索。

#### ALFWorld

ALFWorld（Shridhar et al., 2020b；图 1 的 2）是一个合成文字游戏，旨在与具身 ALFRED 基准（Shridhar et al., 2020a）对齐。它包括六类任务；Agent 要通过文本动作在模拟家庭环境中导航与交互，以实现一个高层目标。例如，高层目标可以是 `examine paper under desklamp`，文本动作可以是 `go to coffeetable 1`、`take paper 2` 和 `use desklamp 1`。

一个任务实例可能包含 50 多个位置，即使专家策略也要用 50 多步才能解决。因此，它要求 Agent 规划和跟踪子目标，并进行系统性探索（例如逐一查看所有书桌以寻找台灯）。ALFWorld 有一个刻意设置的难点：需要判断常见家居物品最可能出现在哪里（例如台灯很可能位于书桌、搁架或梳妆台上）。这使该环境很适合让 LLM 利用预训练获得的常识知识。

为了提示 ReAct，我们针对每种任务类型，从训练集随机标注三条轨迹。每条轨迹都包含稀疏思考，用于：（1）分解目标；（2）跟踪子目标完成情况；（3）确定下一个子目标；（4）借助常识推理到哪里寻找物体，以及应对物体做什么。附录 C.4 给出了 ALFWorld 所用提示。

依照 Shridhar et al. (2020b)，我们在任务特定设置下，对 134 个未见过的评估游戏进行评估。为检验稳健性，我们从每种任务类型标注的三条轨迹中，按照任取两条的六种排列分别构造提示。Act 提示使用相同轨迹，但移除思考。由于任务实例从训练集中随机抽取，它既不偏向 ReAct，也不偏向 Act，因而能公平、受控地比较稀疏思考的重要性。

基线使用 BUTLER（Shridhar et al., 2020b），它是一个针对每种任务类型分别使用 $10^5$ 条专家轨迹训练的模仿学习 Agent[^7]。

#### WebShop

ReAct 能否与嘈杂的现实世界语言环境交互，从而处理实际应用？我们研究了新近提出的在线购物网站环境 WebShop（Yao et al., 2022），其中包含 118 万件真实商品和 1.2 万条人类指令。

与 ALFWorld 不同，WebShop 包含大量结构化和非结构化文本（例如从 Amazon 抓取的商品标题、描述和选项）。Agent 必须依据用户指令购买商品，例如：“我想要一张带抽屉、表面为镍色、价格低于 140 美元的床头柜”；完成任务需要执行网页交互，例如搜索 `nightstand drawers`，选择 `color: modern-nickel-white` 或 `back to search` 等按钮。

该任务在 500 条测试指令上用两个指标评估：平均分，即所选商品覆盖目标属性的百分比在所有情节上的均值；成功率，即所选商品满足全部要求的情节比例。

我们构造的 Act 提示包含搜索、选择商品、选择选项和购买等动作；ReAct 提示还包含推理，用于确定要探索什么、何时购买，以及哪些商品选项与指令有关。附录表 6 给出一个提示示例，附录表 10 给出模型预测。我们把结果与两种方法比较：使用 1,012 条人工标注轨迹训练的模仿学习（IL），以及额外使用 10,587 条训练指令的模仿学习 + 强化学习（IL + RL）。

#### 结果

**表 3。ALFWorld 各任务的成功率（%）。** BUTLER 和 BUTLER$_g$ 的结果取自 Shridhar et al. (2020b) 的表 4。除 BUTLER 使用束搜索外，所有方法均使用贪心解码。

| 方法 | Pick | Clean | Heat | Cool | Look | Pick 2 | All |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Act（六次中最佳） | 88 | 42 | 74 | 67 | 72 | **41** | 45 |
| ReAct（平均） | 65 | 39 | 83 | 76 | 55 | 24 | 57 |
| ReAct（六次中最佳） | **92** | 58 | **96** | 86 | **78** | **41** | **71** |
| ReAct-IM（平均） | 55 | 59 | 60 | 55 | 23 | 24 | 48 |
| ReAct-IM（六次中最佳） | 62 | **68** | 87 | 57 | 39 | 33 | 53 |
| BUTLER$_g$（八次中最佳） | 33 | 26 | 70 | 76 | 17 | 12 | 22 |
| BUTLER（八次中最佳） | 46 | 39 | 74 | **100** | 22 | 24 | 37 |

**表 4。WebShop 的得分和成功率（SR）。** IL/IL+RL 结果取自 Yao et al. (2022)。

| 方法 | Score | SR |
| --- | ---: | ---: |
| Act | 62.3 | 30.1 |
| ReAct | **66.6** | **40.0** |
| IL | 59.9 | 29.1 |
| IL + RL | 62.4 | 28.7 |
| Human Expert | 82.1 | 59.6 |

ReAct 在 ALFWorld（表 3）和 WebShop（表 4）上都优于 Act。在 ALFWorld 上，表现最好的 ReAct 试验平均成功率达到 71%，显著超过最佳 Act（45%）和最佳 BUTLER（37%）试验。事实上，即使最差的 ReAct 试验（48%）也超过这两种方法各自最好的试验。此外，在六次受控试验中，ReAct 相比 Act 始终占优，相对性能提升在 33% 至 90% 之间，平均为 62%。

从定性结果看，没有任何思考时，Act 无法正确地把目标分解成更小的子目标，或无法持续跟踪环境当前状态。附录 D.2.1 和 D.2.2 给出了 ReAct 与 Act 的轨迹对比。

在 WebShop 上，单样例 Act 提示已经能达到 IL 和 IL+RL 方法的水平。增加稀疏推理后，ReAct 的表现显著更好，成功率比此前最佳结果绝对提高 10%。

检查示例后我们发现，ReAct 更可能通过推理弥合嘈杂观察与动作之间的差距，从而识别与指令有关的商品和选项。例如：“对于‘客厅用节省空间的脚凳长椅’，该商品有 `39x18x18inch` 和 `blue` 选项，看起来适合购买。”

不过，现有方法仍远低于人类专家的表现（表 4）。专家会进行明显更多的商品探索和查询改写，而这些对基于提示的方法仍很困难。

#### 内部推理与外部反馈的价值

据我们所知，ReAct 首次展示了把 LLM 的推理与行动结合起来并应用于闭环交互环境。最接近的既有工作可能是 Huang et al. (2022b) 的 Inner Monologue（IM）；其中，具身 Agent 的动作由同名的“内在独白”推动。**然而，IM 的“内在独白”仅限于观察环境状态，以及说明为了满足目标，Agent 还需要完成什么。**

相比之下，ReAct 用于决策的推理轨迹既灵活又稀疏，能够针对不同任务诱导出多种推理类型（见第 2 节）。

为了展示 ReAct 与 IM 的差异，并突出内部推理相对于简单响应外部反馈的重要性，我们进行了一项消融实验，使用由类似 IM 的密集外部反馈组成的思考模式。如表 3 所示，ReAct 明显优于 IM 风格提示 ReAct-IM（整体成功率 71 对 53），并且在六个任务中的五个上始终占优。

定性观察表明，由于缺少高层目标分解，ReAct-IM 经常无法判断子目标何时已经完成，或下一子目标应该是什么。此外，由于缺少常识推理，许多 ReAct-IM 轨迹难以判断某个物品在 ALFWorld 环境中可能位于何处。ReAct 范式能够解决这两个缺陷。ReAct-IM 的更多细节见附录 B.2；提示示例见附录 C.4；轨迹示例见附录 D.2.3。

## 5 相关工作

#### 用语言模型进行推理

使用 LLM 进行推理最著名的工作可能是思维链（CoT；Wei et al., 2022），它揭示了 LLM 为解决问题构造自身“思考过程”的能力。此后出现了多项后续工作，包括用 least-to-most 提示解决复杂任务（Zhou et al., 2022）、zero-shot-CoT（Kojima et al., 2022），以及使用自洽性进行推理（Wang et al., 2022a）。

Madaan & Yazdanbakhsh (2022) 系统研究了 CoT 的形式与结构，并观察到符号、模式和文本的存在对 CoT 的有效性至关重要。另一些工作把研究扩展到比简单提示更复杂的推理架构。例如，Selection-Inference（Creswell et al., 2022）把推理过程分成“选择”和“推断”两步；STaR（Zelikman et al., 2022）用模型自身生成的正确理由微调模型，从而自举推理过程；Faithful Reasoning（Creswell & Shanahan, 2022）把多步推理分解成三个步骤，每一步分别由专用 LM 执行；Scratchpad（Nye et al., 2021）等相似方法在中间计算步骤上微调 LM，也展示了多步计算问题上的改进。

与这些方法不同，ReAct 不只执行孤立、固定的推理，而是把模型动作及其对应观察整合成一个连贯输入流，使模型能够更准确地推理，并处理超出纯推理范围的任务，例如交互式决策。

#### 用语言模型进行决策

LLM 的强大能力使其可以执行语言生成之外的任务。把 LLM 用作决策的策略模型，尤其用在交互环境中，正变得越来越普遍。WebGPT（Nakano et al., 2021）使用 LM 与网页浏览器交互、浏览页面，并从 ELI5 的复杂问题中推断答案（Fan et al., 2019）。与 ReAct 相比，WebGPT 没有显式建模思考和推理过程，而是依赖成本高昂的人类反馈进行强化学习。

在对话建模中，BlenderBot（Shuster et al., 2022b）和 Sparrow（Glaese et al., 2022）等聊天机器人，以及 SimpleTOD（Hosseini-Asl et al., 2020）等任务型对话系统，也训练 LM 对 API 调用做决策。与 ReAct 不同，它们同样没有显式考虑推理过程，而且依赖昂贵的数据集和人类反馈采集来学习策略。相比之下，ReAct 学习策略的成本要低得多，因为其决策过程只需要用语言描述推理过程[^8]。

LLM 也越来越多地用于交互式和具身环境中的规划与决策。在这方面，与 ReAct 最相关的可能是 SayCan（Ahn et al., 2022）和 Inner Monologue（Huang et al., 2022b），两者都使用 LLM 进行机器人动作规划和决策。在 SayCan 中，先提示 LLM 直接预测机器人可能采取的动作，再由扎根于视觉环境的可供性模型重新排序，给出最终预测。

Inner Monologue 通过加入同名的“内在独白”进一步改进，其实现方式是注入来自环境的反馈。据我们所知，Inner Monologue 是首个展示这种闭环系统的工作，ReAct 构建在它之上。不过，我们认为 Inner Monologue 并不真正包含内部思考——第 4 节对此有详细说明。

另需指出，在其他设置中，将语言作为语义丰富的输入用于交互式决策也已取得成功（Abramson et al., 2020；Karamcheti et al., 2021；Huang et al., 2022a；Li et al., 2022）。越来越清楚的是，在 LLM 的帮助下，语言作为一种基础认知机制，将在交互与决策中发挥关键作用。此外，LLM 的进步也启发了 Reed et al. (2022) 等多功能通用 Agent 的开发。

## 6 结论

我们提出了 ReAct——一种简单而有效的方法，用于在大型语言模型中协同推理与行动。通过在多跳问答、事实核验和交互式决策任务上进行多样化实验，我们表明 ReAct 能带来更优表现，并提供可解释的决策轨迹。

尽管方法很简单，动作空间较大的复杂任务仍需要更多示范才能学好，而示范很容易超过上下文学习的输入长度限制。我们在 HotpotQA 上探索了微调方法，初步结果令人鼓舞；但若要进一步提高性能，仍需要从更多高质量人工标注中学习。

通过多任务训练扩展 ReAct，并把它与强化学习等互补范式结合起来，有望产生更强的 Agent，进一步释放 LLM 在更多应用中的潜力。

## 致谢

感谢 Google Brain 团队和 Princeton NLP Group 众多成员的支持与反馈。本研究部分得到美国国家科学基金会第 2107048 号资助。本文表达的任何观点、发现、结论或建议均属于作者，并不一定反映美国国家科学基金会的立场。

## 可复现性声明

主要实验使用 PaLM（Chowdhery et al., 2022），该模型当时尚未公开提供。为提高可复现性，我们在附录 C 中收录了所有使用过的提示，在附录 A.1 中给出了使用 GPT-3（Brown et al., 2020）的补充实验，并在 [原代码存档链接](https://anonymous.4open.science/r/ReAct-2268/) 提供对应的 GPT-3 ReAct 提示代码。

## 伦理声明

与既有方法相比，ReAct 提示大型语言模型生成更便于人类解释、诊断和控制的任务求解轨迹。然而，把大型语言模型连接到动作空间，使其与外部环境（例如 Web 或物理环境）交互，也可能带来危险，例如检索不适当或私密的信息，或在环境中采取有害动作。

我们的实验通过以下方式尽量降低这些风险：把交互限制在不含私人信息的特定网站（Wikipedia 或 WebShop），并在动作空间设计中排除危险动作。也就是说，模型不能在作为研究基准的 WebShop 上真的购买商品，也不能编辑 Wikipedia。我们认为，研究人员在未来设计范围更广的实验之前，应意识到这些风险。

[^1]: 附录 A.1 给出部分 GPT-3（Brown et al., 2020）结果；其表现超过 PaLM-540B。
[^2]: 我们发现，增加示例并不会改善表现。
[^3]: 在所有最终答案正确的轨迹中，HotpotQA 上恰好用 7 步的轨迹只占 0.84%，FEVER 上恰好用 5 步的轨迹只占 1.33%。
[^4]: Wang et al. (2022b) 报告的 Standard、CoT、CoT-SC 在 HotpotQA 上的 EM 分别为 27.1、28.9、33.8。
[^5]: Zhu et al. (2021)；Lewis et al. (2020)。
[^6]: 我们怀疑这可能源于次优的贪心解码过程；未来采用更好的解码方法（例如束搜索）或许能缓解这一问题。
[^7]: Micheli & Fleuret (2021) 在 3,553 个任务实例上微调 GPT-2，表现明显优于 BUTLER；但其模型在所有任务类型上训练，因此未被列为基线。
[^8]: 人类反馈也可以以互补方式加入，但我们把它留给未来工作。

## 参考文献

> 为保持可检索性，作者姓名、论文标题、期刊/会议名称及书目信息依原文保留。

1. Josh Abramson, Arun Ahuja, Iain Barr, Arthur Brussee, Federico Carnevale, Mary Cassin, Rachita Chhaparia, Stephen Clark, Bogdan Damoc, Andrew Dudzik, Petko Georgiev, Aurelia Guy, Tim Harley, Felix Hill, Alden Hung, Zachary Kenton, Jessica Landon, Timothy Lillicrap, Kory Mathewson, Soňa Mokrá, Alistair Muldal, Adam Santoro, Nikolay Savinov, Vikrant Varma, Greg Wayne, Duncan Williams, Nathaniel Wong, Chen Yan, and Rui Zhu. *Imitating interactive intelligence*, 2020. [URL](https://arxiv.org/abs/2012.05672).
2. Michael Ahn, Anthony Brohan, Noah Brown, Yevgen Chebotar, Omar Cortes, Byron David, Chelsea Finn, Chuyuan Fu, Keerthana Gopalakrishnan, Karol Hausman, Alex Herzog, Daniel Ho, Jasmine Hsu, Julian Ibarz, Brian Ichter, Alex Irpan, Eric Jang, Rosario Jauregui Ruano, Kyle Jeffrey, Sally Jesmonth, Nikhil J Joshi, Ryan Julian, Dmitry Kalashnikov, Yuheng Kuang, Kuang-Huei Lee, Sergey Levine, Yao Lu, Linda Luu, Carolina Parada, Peter Pastor, Jornell Quiambao, Kanishka Rao, Jarek Rettinghouse, Diego Reyes, Pierre Sermanet, Nicolas Sievers, Clayton Tan, Alexander Toshev, Vincent Vanhoucke, Fei Xia, Ted Xiao, Peng Xu, Sichun Xu, Mengyuan Yan, and Andy Zeng. *Do as I can, not as I say: Grounding language in robotic affordances*, 2022. [URL](https://arxiv.org/abs/2204.01691).
3. Ben Alderson-Day and Charles Fernyhough. *Inner speech: development, cognitive functions, phenomenology, and neurobiology*. Psychological Bulletin, 141(5):931, 2015.
4. Alan Baddeley. *Working memory*. Science, 255(5044):556–559, 1992.
5. Tom Brown, Benjamin Mann, Nick Ryder, Melanie Subbiah, Jared D Kaplan, Prafulla Dhariwal, Arvind Neelakantan, Pranav Shyam, Girish Sastry, Amanda Askell, et al. *Language models are few-shot learners*. Advances in Neural Information Processing Systems, 33:1877–1901, 2020.
6. Aakanksha Chowdhery, Sharan Narang, Jacob Devlin, Maarten Bosma, Gaurav Mishra, Adam Roberts, Paul Barham, Hyung Won Chung, Charles Sutton, Sebastian Gehrmann, et al. *PaLM: Scaling language modeling with pathways*. arXiv preprint arXiv:2204.02311, 2022.
7. Antonia Creswell and Murray Shanahan. *Faithful reasoning using large language models*, 2022. [URL](https://arxiv.org/abs/2208.14271).
8. Antonia Creswell, Murray Shanahan, and Irina Higgins. *Selection-inference: Exploiting large language models for interpretable logical reasoning*, 2022. [URL](https://arxiv.org/abs/2205.09712).
9. Angela Fan, Yacine Jernite, Ethan Perez, David Grangier, Jason Weston, and Michael Auli. *ELI5: Long form question answering*. In *Proceedings of the 57th Annual Meeting of the Association for Computational Linguistics*, pp. 3558–3567, Florence, Italy, July 2019. Association for Computational Linguistics. doi: 10.18653/v1/P19-1346. [URL](https://aclanthology.org/P19-1346).
10. Charles Fernyhough. *Vygotsky, Luria, and the social brain*. Self and Social Regulation: Social Interaction and the Development of Social Understanding and Executive Functions, pp. 56–79, 2010.
11. Amelia Glaese, Nat McAleese, Maja Trebacz, John Aslanides, Vlad Firoiu, Timo Ewalds, Maribeth Rauh, Laura Weidinger, Martin Chadwick, Phoebe Thacker, Lucy Campbell-Gillingham, Jonathan Uesato, Po-Sen Huang, Ramona Comanescu, Fan Yang, Abigail See, Sumanth Dathathri, Rory Greig, Charlie Chen, Doug Fritz, Jaume Sanchez Elias, Richard Green, Soňa Mokrá, Nicholas Fernando, Boxi Wu, Rachel Foley, Susannah Young, Iason Gabriel, William Isaac, John Mellor, Demis Hassabis, Koray Kavukcuoglu, Lisa Anne Hendricks, and Geoffrey Irving. *Improving alignment of dialogue agents via targeted human judgements*, 2022. [URL](https://storage.googleapis.com/deepmind-media/DeepMind.com/Authors-Notes/sparrow/sparrow-final.pdf).
12. Ehsan Hosseini-Asl, Bryan McCann, Chien-Sheng Wu, Semih Yavuz, and Richard Socher. *A simple language model for task-oriented dialogue*. Advances in Neural Information Processing Systems, 33:20179–20191, 2020.
13. Wenlong Huang, Pieter Abbeel, Deepak Pathak, and Igor Mordatch. *Language models as zero-shot planners: Extracting actionable knowledge for embodied agents*. arXiv preprint arXiv:2201.07207, 2022a.
14. Wenlong Huang, Fei Xia, Ted Xiao, Harris Chan, Jacky Liang, Pete Florence, Andy Zeng, Jonathan Tompson, Igor Mordatch, Yevgen Chebotar, et al. *Inner monologue: Embodied reasoning through planning with language models*. arXiv preprint arXiv:2207.05608, 2022b.
15. Siddharth Karamcheti, Megha Srivastava, Percy Liang, and Dorsa Sadigh. *LILA: Language-informed latent actions*. In CoRL, pp. 1379–1390, 2021. [URL](https://proceedings.mlr.press/v164/karamcheti22a.html).
16. Takeshi Kojima, Shixiang Shane Gu, Machel Reid, Yutaka Matsuo, and Yusuke Iwasawa. *Large language models are zero-shot reasoners*. arXiv preprint arXiv:2205.11916, 2022.
17. Angeliki Lazaridou, Elena Gribovskaya, Wojciech Stokowiec, and Nikolai Grigorev. *Internet-augmented language models through few-shot prompting for open-domain question answering*. arXiv preprint arXiv:2203.05115, 2022.
18. Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, et al. *Retrieval-augmented generation for knowledge-intensive NLP tasks*. Advances in Neural Information Processing Systems, 33:9459–9474, 2020.
19. Shuang Li, Xavier Puig, Chris Paxton, Yilun Du, Clinton Wang, Linxi Fan, Tao Chen, De-An Huang, Ekin Akyürek, Anima Anandkumar, Jacob Andreas, Igor Mordatch, Antonio Torralba, and Yuke Zhu. *Pre-trained language models for interactive decision-making*, 2022. [URL](https://arxiv.org/abs/2202.01771).
20. Aleksandr Romanovich Luria. *L. S. Vygotsky and the problem of localization of functions*. Neuropsychologia, 3(4):387–392, 1965.
21. Aman Madaan and Amir Yazdanbakhsh. *Text and patterns: For effective chain of thought, it takes two to tango*, 2022. [URL](https://arxiv.org/abs/2209.07686).
22. Vincent Micheli and François Fleuret. *Language models are few-shot butlers*. arXiv preprint arXiv:2104.07972, 2021.
23. Reiichiro Nakano, Jacob Hilton, Suchir Balaji, Jeff Wu, Long Ouyang, Christina Kim, Christopher Hesse, Shantanu Jain, Vineet Kosaraju, William Saunders, Xu Jiang, Karl Cobbe, Tyna Eloundou, Gretchen Krueger, Kevin Button, Matthew Knight, Benjamin Chess, and John Schulman. *WebGPT: Browser-assisted question-answering with human feedback*, 2021. [URL](https://arxiv.org/abs/2112.09332).
24. Maxwell Nye, Anders Johan Andreassen, Guy Gur-Ari, Henryk Michalewski, Jacob Austin, David Bieber, David Dohan, Aitor Lewkowycz, Maarten Bosma, David Luan, Charles Sutton, and Augustus Odena. *Show your work: Scratchpads for intermediate computation with language models*, 2021. [URL](https://arxiv.org/abs/2112.00114).
25. Scott Reed, Konrad Zolna, Emilio Parisotto, Sergio Gomez Colmenarejo, Alexander Novikov, Gabriel Barth-Maron, Mai Gimenez, Yury Sulsky, Jackie Kay, Jost Tobias Springenberg, Tom Eccles, Jake Bruce, Ali Razavi, Ashley Edwards, Nicolas Heess, Yutian Chen, Raia Hadsell, Oriol Vinyals, Mahyar Bordbar, and Nando de Freitas. *A generalist agent*, 2022. [URL](https://arxiv.org/abs/2205.06175).
26. Mohit Shridhar, Jesse Thomason, Daniel Gordon, Yonatan Bisk, Winson Han, Roozbeh Mottaghi, Luke Zettlemoyer, and Dieter Fox. *ALFRED: A benchmark for interpreting grounded instructions for everyday tasks*. In *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*, pp. 10740–10749, 2020a.
27. Mohit Shridhar, Xingdi Yuan, Marc-Alexandre Côté, Yonatan Bisk, Adam Trischler, and Matthew Hausknecht. *ALFWorld: Aligning text and embodied environments for interactive learning*. arXiv preprint arXiv:2010.03768, 2020b.
28. Kurt Shuster, Mojtaba Komeili, Leonard Adolphs, Stephen Roller, Arthur Szlam, and Jason Weston. *Language models that seek for knowledge: Modular search & generation for dialogue and prompt completion*. arXiv preprint arXiv:2203.13224, 2022a.
29. Kurt Shuster, Jing Xu, Mojtaba Komeili, Da Ju, Eric Michael Smith, Stephen Roller, Megan Ung, Moya Chen, Kushal Arora, Joshua Lane, Morteza Behrooz, William Ngan, Spencer Poff, Naman Goyal, Arthur Szlam, Y-Lan Boureau, Melanie Kambadur, and Jason Weston. *BlenderBot 3: a deployed conversational agent that continually learns to responsibly engage*, 2022b. [URL](https://arxiv.org/abs/2208.03188).
30. James Thorne, Andreas Vlachos, Christos Christodoulopoulos, and Arpit Mittal. *FEVER: a large-scale dataset for fact extraction and verification*. arXiv preprint arXiv:1803.05355, 2018.
31. Lev S. Vygotsky. *Thinking and speech*. The Collected Works of L. S. Vygotsky, 1:39–285, 1987.
32. Xuezhi Wang, Jason Wei, Dale Schuurmans, Quoc Le, Ed Chi, Sharan Narang, Aakanksha Chowdhery, and Denny Zhou. *Self-consistency improves chain of thought reasoning in language models*, 2022a. [URL](https://arxiv.org/abs/2203.11171).
33. Xuezhi Wang, Jason Wei, Dale Schuurmans, Quoc Le, Ed Chi, and Denny Zhou. *Rationale-augmented ensembles in language models*. arXiv preprint arXiv:2207.00747, 2022b.
34. Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Ed Chi, Quoc Le, and Denny Zhou. *Chain of thought prompting elicits reasoning in large language models*. arXiv preprint arXiv:2201.11903, 2022.
35. Zhilin Yang, Peng Qi, Saizheng Zhang, Yoshua Bengio, William W. Cohen, Ruslan Salakhutdinov, and Christopher D. Manning. *HotpotQA: A dataset for diverse, explainable multi-hop question answering*. arXiv preprint arXiv:1809.09600, 2018.
36. Shunyu Yao, Rohan Rao, Matthew Hausknecht, and Karthik Narasimhan. *Keep CALM and explore: Language models for action generation in text-based games*. In *Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing (EMNLP)*, pp. 8736–8754, Online, November 2020. Association for Computational Linguistics. doi: 10.18653/v1/2020.emnlp-main.704. [URL](https://aclanthology.org/2020.emnlp-main.704).
37. Shunyu Yao, Howard Chen, John Yang, and Karthik Narasimhan. *WebShop: Towards scalable real-world web interaction with grounded language agents*. arXiv preprint arXiv:2207.01206, 2022.
38. Eric Zelikman, Yuhuai Wu, Jesse Mu, and Noah D. Goodman. *STaR: Bootstrapping reasoning with reasoning*, 2022. [URL](https://arxiv.org/abs/2203.14465).
39. Denny Zhou, Nathanael Schärli, Le Hou, Jason Wei, Nathan Scales, Xuezhi Wang, Dale Schuurmans, Olivier Bousquet, Quoc Le, and Ed Chi. *Least-to-most prompting enables complex reasoning in large language models*, 2022. [URL](https://arxiv.org/abs/2205.10625).
40. Yunchang Zhu, Liang Pang, Yanyan Lan, Huawei Shen, and Xueqi Cheng. *Adaptive information seeking for open-domain question answering*. arXiv preprint arXiv:2109.06747, 2021.

## 附录 A 补充结果

### A.1 GPT-3 实验

**表 5。使用 PaLM-540B 与 GPT-3（`text-davinci-002`，贪心解码）的 ReAct 提示结果。** 在 HotpotQA 上，我们从验证问题中随机抽取 500 个子集。在 ALFWorld 上，我们使用全部 134 个未见过的验证任务实例，并使用依据 PaLM-540B 结果选出的最佳提示集。

| 任务 | PaLM-540B | GPT-3 |
| --- | ---: | ---: |
| HotpotQA（exact match） | 29.4 | **30.8** |
| ALFWorld（成功率 %） | 70.9 | **78.4** |

我们补充开展 GPT-3（Brown et al., 2020）实验，以确认 ReAct 提示的性能可以跨不同大型语言模型泛化。如表 5 所示，GPT-3（`text-davinci-002`，贪心解码）在 HotpotQA 和 ALFWorld 上都始终优于 PaLM-540B；一种可能原因是，它接受过遵循人类指令的微调。这说明 ReAct 提示在不同任务、不同大型语言模型上均有效。这些实验的代码位于 [ReAct 项目页](https://react-lm.github.io/)。

### A.2 ReAct 在 HotpotQA 上获取最新知识

![图 4：标签过时的 HotpotQA 示例](https://ar5iv.labs.arxiv.org/html/2210.03629v3/assets/x5.png)

**图 4。** 另一个 HotpotQA 问题示例，其中原始标签已经过时。得益于真实世界 Web 交互加推理，只有 ReAct 能够获得最新答案。

检查轨迹时，我们还发现 ReAct 有时会与数据集标签不一致，因为标签本身可能已经过时。例如图 4 中，问题询问一家酒店的规模；在 HotpotQA 构建之后，该酒店的规模扩大了。Standard 和 CoT 因幻觉而给出错误答案；Act 虽然可以与真实世界 Web 交互，却因为缺少引导其如何利用互联网进行问答的推理而失败。只有 ReAct 能从互联网检索最新信息，并给出合理答案。因此，对推理能力进行更好的整合，可能有利于 WebGPT（Nakano et al., 2021）、互联网增强语言模型（Lazaridou et al., 2022）和检索增强对话模型（Shuster et al., 2022a）等较新的互联网增强语言模型，使其解决需要最新信息的任务。

### A.3 ALFWorld 中的人在回路行为纠正

![图 5：人在回路纠正 ReAct 行为](https://ar5iv.labs.arxiv.org/html/2210.03629v3/assets/x6.png)

**图 5。** 在 ALFWorld 中使用 ReAct 进行人在回路行为纠正的示例。（a）ReAct 轨迹因一条产生幻觉的思考（Act 17）而失败。（b）人只需编辑两处思考（Act 17、23），ReAct 轨迹就会生成符合期望的推理轨迹和动作并成功。

我们还探索了人与 ReAct 的在回路交互，让人能够检查并编辑 ReAct 的推理轨迹。图 5 表明，只需删除 Act 17 中一个产生幻觉的句子，并在 Act 23 中加入少量提示，就能使 ReAct 的行为发生显著改变，与这些人工思考编辑保持一致，并成功完成任务。

从人的角度看，解决这类任务会变得容易得多：不再需要输入几十个动作，只需编辑几处思考，从而产生新的人机协作方式。对 Act 和既有强化学习方法而言，这种即时策略编辑很困难，因为人无法直接更改模型参数，而且只改几个动作未必能改变模型后续其余行为。

该范式也不只是 Huang et al. (2022b) 所述、通过人机对话更新目标或子目标。编辑 ReAct 的思考不仅能做到这些，还可以修改模型的内部信念、推理方式，或灵活思考空间所支持的任何内容，从而更好地解决任务。我们认为，这是人机对齐的一个令人振奋的方向，并把更系统的研究留给未来工作。

## 附录 B 实验细节

### B.1 HotpotQA 微调细节

所有微调均使用 64 的 batch size。在 PaLM-8B 上，ReAct 和 Act 微调 $4{,}000$ 步，Standard 和 CoT 微调 $2{,}000$ 步。在 PaLM-62B 上，ReAct 和 Act 微调 $4{,}000$ 步，Standard 和 CoT 微调 $1{,}000$ 步。

我们发现，ReAct 和 Act 通常能从更多训练步数（以及更多训练数据）中获益；Standard 和 CoT 则在开始微调后不久便出现性能下降。

### B.2 ALFWorld 的 IM 风格细节

对于 IM 风格消融实验，我们对 ReAct 使用的同一批专家轨迹重新标注，在轨迹中加入密集的外部反馈式思考，把 ReAct-IM 可以思考的内容限制为：（1）分解当前目标；（2）说明为完成目标，当前还需要完成哪个子目标。

具体而言，ReAct-IM 缺少以下类型的思考：（1）判断子目标何时完成；（2）判断下一子目标应该是什么；（3）引导 LLM 参考其预训练得到的内部知识，以识别物品在环境中可能出现的位置。

## 附录 C 提示

> 下列提示是论文实验的机器输入与输出记录。为避免把译文误当成原实验输入，提示、动作、观察及答案依原文保留；小节名和说明译为中文。原 PDF 中因分页而重复的“续表”表头在 Markdown 中合并，记录顺序与内容不变。

### C.1 HotpotQA

#### 原始问答示例

```text
Question: What is the elevation range for the area that the eastern sector of the Colorado orogeny extends into?
Answer: 1,800 to 7,000 ft

Question: Musician and satirist Allie Goertz wrote a song about the "The Simpsons" character Milhouse, who Matt Groening named after who?
Answer: Richard Nixon

Question: Which documentary is about Finnish rock groups, Adam Clayton Powell or The Saimaa Gesture?
Answer: The Saimaa Gesture

Question: What profession does Nicholas Ray and Elia Kazan have in common?
Answer: director, screenwriter, actor

Question: Which magazine was started first Arthur's Magazine or First for Women?
Answer: Arthur's Magazine

Question: Were Pavel Urysohn and Leonid Levin known for the same type of work?
Answer: Yes
```

#### Act 提示

```text
Question: What is the elevation range for the area that the eastern sector of the Colorado orogeny extends into?
Action 1: Search[Colorado orogeny]
Observation 1: The Colorado orogeny was an episode of mountain building (an orogeny) in Colorado and surrounding areas.
Action 2: Lookup[eastern sector]
Observation 2: (Result 1 / 1) The eastern sector extends into the High Plains and is called the Central Plains orogeny.
Action 3: Search[High Plains]
Observation 3: High Plains refers to one of two distinct land regions:
Action 4: Search[High Plains (United States)]
Observation 4: The High Plains are a subregion of the Great Plains. From east to west, the High Plains rise in elevation from around 1,800 to 7,000 ft (550 to 2,130 m).[3]
Action 5: Finish[1,800 to 7,000 ft]

Question: Musician and satirist Allie Goertz wrote a song about the "The Simpsons" character Milhouse, who Matt Groening named after who?
Action 1: Search[Milhouse]
Observation 1: Milhouse Mussolini Van Houten is a recurring character in the Fox animated television series The Simpsons voiced by Pamela Hayden and created by Matt Groening.
Action 2: Lookup[named after]
Observation 2: (Result 1 / 1) Milhouse was named after U.S. president Richard Nixon, whose middle name was Milhous.
Action 3: Finish[Richard Nixon]

Question: Which documentary is about Finnish rock groups, Adam Clayton Powell or The Saimaa Gesture?
Action 1: Search[Adam Clayton Powell]
Observation 1: Could not find [Adam Clayton Powell]. Similar: ['Adam Clayton Powell III', 'Seventh Avenue (Manhattan)', 'Adam Clayton Powell Jr. State Office Building', 'Isabel Washington Powell', 'Adam Powell', 'Adam Clayton Powell (film)', 'Giancarlo Esposito'].
Action 2: Search[Adam Clayton Powell (film)]
Observation 2: Adam Clayton Powell is a 1989 American documentary film directed by Richard Kilberg. The film is about the rise and fall of influential African-American politician Adam Clayton Powell Jr.[3][4] It was later aired as part of the PBS series The American Experience.
Action 3: Finish[The Saimaa Gesture]

Question: What profession does Nicholas Ray and Elia Kazan have in common?
Action 1: Search[Nicholas Ray]
Observation 1: Nicholas Ray (born Raymond Nicholas Kienzle Jr., August 7, 1911 – June 16, 1979) was an American film director, screenwriter, and actor best known for the 1955 film Rebel Without a Cause.
Action 2: Search[Elia Kazan]
Observation 2: Elia Kazan was an American film and theatre director, producer, screenwriter and actor.
Action 3: Finish[director, screenwriter, actor]

Question: Which magazine was started first Arthur's Magazine or First for Women?
Action 1: Search[Arthur's Magazine]
Observation 1: Arthur's Magazine (1844--1846) was an American literary periodical published in Philadelphia in the 19th century.
Action 2: Search[First for Women]
Observation 2: First for Women is a woman's magazine published by Bauer Media Group in the USA.[1] The magazine was started in 1989.
Action 3: Finish[Arthur's Magazine]

Question: Were Pavel Urysohn and Leonid Levin known for the same type of work?
Action 1: Search[Pavel Urysohn]
Observation 1: Pavel Samuilovich Urysohn (February 3, 1898 - August 17, 1924) was a Soviet mathematician who is best known for his contributions in dimension theory.
Action 2: Search[Leonid Levin]
Observation 2: Leonid Anatolievich Levin is a Soviet-American mathematician and computer scientist.
Action 3: Finish[yes]
```

#### CoT 提示

```text
Question: What is the elevation range for the area that the eastern sector of the Colorado orogeny extends into?
Thought: Let's think step by step. The eastern sector of Colorado orogeny extends into the High Plains. High Plains rise in elevation from around 1,800 to 7,000 ft, so the answer is 1,800 to 7,000 ft.
Answer: 1,800 to 7,000 ft

Question: Musician and satirist Allie Goertz wrote a song about the "The Simpsons" character Milhouse, who Matt Groening named after who?
Thought: Let's think step by step. Milhouse was named after U.S. president Richard Nixon, so the answer is Richard Nixon.
Answer: Richard Nixon

Question: Which documentary is about Finnish rock groups, Adam Clayton Powell or The Saimaa Gesture?
Thought: Let's think step by step. Adam Clayton Powell (film) is a documentary about an African-American politician, not Finnish rock groups. So the documentary about Finnish rock groups must instead be The Saimaa Gesture.
Answer: The Saimaa Gesture

Question: What profession does Nicholas Ray and Elia Kazan have in common?
Thought: Let's think step by step. Professions of Nicholas Ray are director, screenwriter, and actor. Professions of Elia Kazan are director, producer, screenwriter, and actor. So profession Nicholas Ray and Elia Kazan have in common is director, screenwriter, and actor.
Answer: director, screenwriter, actor

Question: Which magazine was started first Arthur's Magazine or First for Women?
Thought: Let's think step by step. Arthur's Magazine was started in 1844. First for Women was started in 1989. 1844 (Arthur's Magazine) < 1989 (First for Women), so Arthur's Magazine was started first.
Answer: Arthur's Magazine

Question: Were Pavel Urysohn and Leonid Levin known for the same type of work?
Thought: Let's think step by step. Pavel Urysohn is a mathematician. Leonid Levin is a mathematician and computer scientist. So Pavel Urysohn and Leonid Levin have the same type of work.
Answer: Yes
```

#### ReAct 提示

```text
Question: What is the elevation range for the area that the eastern sector of the Colorado orogeny extends into?
Thought 1: I need to search Colorado orogeny, find the area that the eastern sector of the Colorado orogeny extends into, then find the elevation range of the area.
Action 1: Search[Colorado orogeny]
Observation 1: The Colorado orogeny was an episode of mountain building (an orogeny) in Colorado and surrounding areas.
Thought 2: It does not mention the eastern sector. So I need to look up eastern sector.
Action 2: Lookup[eastern sector]
Observation 2: (Result 1 / 1) The eastern sector extends into the High Plains and is called the Central Plains orogeny.
Thought 3: The eastern sector of Colorado orogeny extends into the High Plains. So I need to search High Plains and find its elevation range.
Action 3: Search[High Plains]
Observation 3: High Plains refers to one of two distinct land regions
Thought 4: I need to instead search High Plains (United States).
Action 4: Search[High Plains (United States)]
Observation 4: The High Plains are a subregion of the Great Plains. From east to west, the High Plains rise in elevation from around 1,800 to 7,000 ft (550 to 2,130 m).[3]
Thought 5: High Plains rise in elevation from around 1,800 to 7,000 ft, so the answer is 1,800 to 7,000 ft.
Action 5: Finish[1,800 to 7,000 ft]

Question: Musician and satirist Allie Goertz wrote a song about the "The Simpsons" character Milhouse, who Matt Groening named after who?
Thought 1: The question simplifies to "The Simpsons" character Milhouse is named after who. I only need to search Milhouse and find who it is named after.
Action 1: Search[Milhouse]
Observation 1: Milhouse Mussolini Van Houten is a recurring character in the Fox animated television series The Simpsons voiced by Pamela Hayden and created by Matt Groening.
Thought 2: The paragraph does not tell who Milhouse is named after, maybe I can look up "named after".
Action 2: Lookup[named after]
Observation 2: (Result 1 / 1) Milhouse was named after U.S. president Richard Nixon, whose middle name was Milhous.
Thought 3: Milhouse was named after U.S. president Richard Nixon, so the answer is Richard Nixon.
Action 3: Finish[Richard Nixon]

Question: Which documentary is about Finnish rock groups, Adam Clayton Powell or The Saimaa Gesture?
Thought 1: I need to search Adam Clayton Powell and The Saimaa Gesture, and find which documentary is about Finnish rock groups.
Action 1: Search[Adam Clayton Powell]
Observation 1: Could not find [Adam Clayton Powell]. Similar: ['Adam Clayton Powell III', 'Seventh Avenue (Manhattan)', 'Adam Clayton Powell Jr. State Office Building', 'Isabel Washington Powell', 'Adam Powell', 'Adam Clayton Powell (film)', 'Giancarlo Esposito'].
Thought 2: To find the documentary, I can search Adam Clayton Powell (film).
Action 2: Search[Adam Clayton Powell (film)]
Observation 2: Adam Clayton Powell is a 1989 American documentary film directed by Richard Kilberg. The film is about the rise and fall of influential African-American politician Adam Clayton Powell Jr.[3][4] It was later aired as part of the PBS series The American Experience.
Thought 3: Adam Clayton Powell (film) is a documentary about an African-American politician, not Finnish rock groups. So the documentary about Finnish rock groups must instead be The Saimaa Gesture.
Action 3: Finish[The Saimaa Gesture]

Question: What profession does Nicholas Ray and Elia Kazan have in common?
Thought 1: I need to search Nicholas Ray and Elia Kazan, find their professions, then find the profession they have in common.
Action 1: Search[Nicholas Ray]
Observation 1: Nicholas Ray (born Raymond Nicholas Kienzle Jr., August 7, 1911 – June 16, 1979) was an American film director, screenwriter, and actor best known for the 1955 film Rebel Without a Cause.
Thought 2: Professions of Nicholas Ray are director, screenwriter, and actor. I need to search Elia Kazan next and find his professions.
Action 2: Search[Elia Kazan]
Observation 2: Elia Kazan was an American film and theatre director, producer, screenwriter and actor.
Thought 3: Professions of Elia Kazan are director, producer, screenwriter, and actor. So profession Nicholas Ray and Elia Kazan have in common is director, screenwriter, and actor.
Action 3: Finish[director, screenwriter, actor]

Question: Which magazine was started first Arthur's Magazine or First for Women?
Thought 1: I need to search Arthur's Magazine and First for Women, and find which was started first.
Action 1: Search[Arthur's Magazine]
Observation 1: Arthur's Magazine (1844-1846) was an American literary periodical published in Philadelphia in the 19th century.
Thought 2: Arthur's Magazine was started in 1844. I need to search First for Women next.
Action 2: Search[First for Women]
Observation 2: First for Women is a woman's magazine published by Bauer Media Group in the USA.[1] The magazine was started in 1989.
Thought 3: First for Women was started in 1989. 1844 (Arthur's Magazine) < 1989 (First for Women), so Arthur's Magazine was started first.
Action 3: Finish[Arthur's Magazine]

Question: Were Pavel Urysohn and Leonid Levin known for the same type of work?
Thought 1: I need to search Pavel Urysohn and Leonid Levin, find their types of work, then find if they are the same.
Action 1: Search[Pavel Urysohn]
Observation 1: Pavel Samuilovich Urysohn (February 3, 1898 - August 17, 1924) was a Soviet mathematician who is best known for his contributions in dimension theory.
Thought 2: Pavel Urysohn is a mathematician. I need to search Leonid Levin next and find its type of work.
Action 2: Search[Leonid Levin]
Observation 2: Leonid Anatolievich Levin is a Soviet-American mathematician and computer scientist.
Thought 3: Leonid Levin is a mathematician and computer scientist. So Pavel Urysohn and Leonid Levin have the same type of work.
Action 3: Finish[yes]
```

### C.2 FEVER

#### 原始问答示例

```text
Determine if there is Observation that SUPPORTS or REFUTES a Claim, or if there is NOT ENOUGH INFORMATION.

Claim: Nikolaj Coster-Waldau worked with the Fox Broadcasting Company.
Answer: SUPPORTS

Claim: Stranger Things is set in Bloomington, Indiana.
Answer: REFUTES

Claim: Beautiful reached number two on the Billboard Hot 100 in 2003.
Answer: NOT ENOUGH INFO
```

#### Act 提示

```text
Determine if there is Observation that SUPPORTS or REFUTES a Claim, or if there is NOT ENOUGH INFORMATION.

Claim: Nikolaj Coster-Waldau worked with the Fox Broadcasting Company.
Action2: Search[Nikolaj Coster-Waldau]
Observation 1: Nikolaj William Coster-Waldau (born 27 July 1970) is a Danish actor and producer. He graduated from the Danish National School of Performing Arts in Copenhagen in 1993,[1] and had his breakthrough role in Denmark with the film Nightwatch (1994). He played Jaime Lannister in the HBO fantasy drama series Game of Thrones, for which he received two Primetime Emmy Award nominations for Outstanding Supporting Actor in a Drama Series.. Coster-Waldau has appeared in numerous films in his native Denmark and Scandinavia, including Headhunters (2011) and A Thousand Times Good Night (2013). In the U.S, his debut film role was in the war film Black Hawk Down (2001), playing Medal of Honor recipient Gary Gordon.[2] He then played a detective in the short-lived Fox television series New Amsterdam (2008), and appeared in the 2009 Fox television film Virtuality, originally intended as a pilot.
Action 2: Finish[SUPPORTS]

Claim: Stranger Things is set in Bloomington, Indiana.
Action 1: Search[Stranger Things]
Observation 1: Stranger Things is an American science fiction horror drama television series created by the Duffer Brothers. Set in the 1980s, primarily in the fictional town of Hawkins, Indiana, the series centers on a number of mysteries and supernatural events occurring around the town and their impact on an ensemble of child and adult characters.
Action 2: Finish[REFUTES]

Claim: Beautiful reached number two on the Billboard Hot 100 in 2003.
Action 1: Search[Beautiful]
Observation 1: Could not find [Beautiful]. Similar: ['Beautiful', 'Beautiful, Beautiful', 'A Beautiful Mind (film)', 'Beautiful (Christina Aguilera song)', 'Life Is Beautiful'].
Action 2: Search[Beautiful (Christina Aguilera song)
Observation 2: "Beautiful" is a song recorded by American singer Christina Aguilera for her fourth studio album, Stripped (2002).
Action 3: Lookup[Billboard Hot 100]
Observation 3: (Result 1 / 3) The song peaked at number two on the Billboard Hot 100 in the United States, where it was certified Gold for 500,000 units shipped.
Action 4: Finish[NOT ENOUGH INFO]
```

#### CoT 提示

```text
Determine if there is Observation that SUPPORTS or REFUTES a Claim, or if there is NOT ENOUGH INFORMATION.

Claim: Nikolaj Coster-Waldau worked with the Fox Broadcasting Company.
Thought: Nikolaj William Coster-Waldau appeared in the 2009 Fox television film Virtuality, so he has worked with the Fox Broadcasting Company.
Answer: SUPPORTS

Claim: Stranger Things is set in Bloomington, Indiana.
Thought: Stranger Things is in the fictional town of Hawkins, Indiana, not in Bloomington, Indiana.
Answer: REFUTES

Claim: Beautiful reached number two on the Billboard Hot 100 in 2003.
Thought: The song peaked at number two on the Billboard Hot 100 in the United States, but not sure if it was in 2003.
Answer: NOT ENOUGH INFO
```

#### ReAct 提示

```text
Determine if there is Observation that SUPPORTS or REFUTES a Claim, or if there is NOT ENOUGH INFORMATION.

Claim: Nikolaj Coster-Waldau worked with the Fox Broadcasting Company.
Thought 1: I need to search Nikolaj Coster-Waldau and find if he has worked with the Fox Broadcasting Company.
Action 1: Search[Nikolaj Coster-Waldau]
Observation 1: Nikolaj William Coster-Waldau (born 27 July 1970) is a Danish actor and producer. He graduated from the Danish National School of Performing Arts in Copenhagen in 1993,[1] and had his breakthrough role in Denmark with the film Nightwatch (1994). He played Jaime Lannister in the HBO fantasy drama series Game of Thrones, for which he received two Primetime Emmy Award nominations for Outstanding Supporting Actor in a Drama Series.. Coster-Waldau has appeared in numerous films in his native Denmark and Scandinavia, including Headhunters (2011) and A Thousand Times Good Night (2013). In the U.S, his debut film role was in the war film Black Hawk Down (2001), playing Medal of Honor recipient Gary Gordon.[2] He then played a detective in the short-lived Fox television series New Amsterdam (2008), and appeared in the 2009 Fox television film Virtuality, originally intended as a pilot.
Thought 2: Because he "appeared in the 2009 Fox television film Virtuality", he should have worked with the Fox Broadcasting Company.
Action 2: Finish[SUPPORTS]

Claim: Stranger Things is set in Bloomington, Indiana.
Thought 1: I should search for Stranger Things, and see if it is set in Bloomington, Indiana.
Action 1: Search[Stranger Things]
Observation 1: Stranger Things is an American science fiction horror drama television series created by the Duffer Brothers. Set in the 1980s, primarily in the fictional town of Hawkins, Indiana, the series centers on a number of mysteries and supernatural events occurring around the town and their impact on an ensemble of child and adult characters.
Thought 2: The observation says that it is set in a "fictional town of Hawkins, Indiana", so it is not set in Bloomington.
Action 2: Finish[REFUTES]

Claim: Beautiful reached number two on the Billboard Hot 100 in 2003.
Thought 1: I need to search the song Beautiful and find if it reached number two on the Billboard Hot 100 in 2003.
Action 1: Search[Beautiful]
Observation 1: Could not find [Beautiful]. Similar: ['Beautiful', 'Beautiful, Beautiful', 'A Beautiful Mind (film)', 'Beautiful (Christina Aguilera song)', 'Life Is Beautiful'].
Thought 2: From suggestions, I should search "Beautiful (Christina Aguilera song)" to find the song.
Action 2: Search[Beautiful (Christina Aguilera song)]
Observation 2: "Beautiful" is a song recorded by American singer Christina Aguilera for her fourth studio album, Stripped (2002).
Thought 3: It does not mention Billboard, so I need to look up "Billboard Hot 100" to find if it reached number two on it in 2003.
Action 3: Lookup[Billboard Hot 100]
Observation 3: (Result 1 / 3) The song peaked at number two on the Billboard Hot 100 in the United States, where it was certified Gold for 500,000 units shipped.
Thought 4: It only says the song peaked at number two on the Billboard Hot 100, but not if it was in 2003. I am not sure if this claim is true or not.
Action 4: Finish[NOT ENOUGH INFO]
```

### C.3 WebShop

**表 6。第 4 节 WebShop 实验使用的提示。** 原表左列是 Act 提示，右列是在同一轨迹中加入推理后的 ReAct 提示。这里按两栏原有顺序分别展开。

**Instruction**

```text
i would like a 3 ounce bottle of bright citrus deodorant for sensitive skin, and price lower than 50.00 dollars
```

#### Act

```text
Action: search[3 ounce bright citrus deodorant sensitive skin]
Observation:
[ Back to Search ]
Page 1 (Total results: 50)
[Next]

[B078GWRC1J]
Bright Citrus Deodorant by Earth Mama | Natural and Safe for
Sensitive Skin, Pregnancy and Breastfeeding, Contains Organic
Calendula 3-Ounce
$10.99
[B078GTKVXY]
Ginger Fresh Deodorant by Earth Mama | Natural and Safe for
Sensitive Skin, Pregnancy and Breastfeeding, Contains Organic
Calendula 3-Ounce
$10.99
[B08KBVJ4XN]
Barrel and Oak - Aluminum-Free Deodorant, Deodorant for Men,
Essential Oil-Based Scent, 24-Hour Odor Protection, Cedar
& Patchouli Blend, Gentle on Sensitive Skin (Mountain Sage,
2.7 oz, 2-Pack)
$15.95

Action: click[B078GWRC1J]
Observation:
[Back to Search]
[Prev]
scent [assorted scents][bright citrus][calming lavender][ginger
[fresh] simply non-scents]
size [travel set (4-pack)][3 ounce (pack of 1)][3-ounce (2
-pack)]
Bright Citrus Deodorant by Earth Mama | Natural and Safe for
Sensitive Skin, Pregnancy and Breastfeeding, Contains Organic
Calendula 3-Ounce
Price: $10.99
Rating: N.A.
[Description]
[Features]
[Reviews]
[Buy Now]

Action: click[bright citrus]
Observation: You have clicked bright citrus.

Action: click[3 ounce (pack of 1)]
Observation: You have clicked 3 ounce (pack of 1).

Action: click[Buy Now]
```

#### ReAct

```text
Action: search[3 ounce bright citrus deodorant sensitive skin]
Observation:
[ Back to Search ]
Page 1 (Total results: 50)
[Next]

[B078GWRC1J]
Bright Citrus Deodorant by Earth Mama | Natural and Safe for
Sensitive Skin, Pregnancy and Breastfeeding, Contains Organic
Calendula 3-Ounce
$10.99
[B078GTKVXY]
Ginger Fresh Deodorant by Earth Mama | Natural and Safe for
Sensitive Skin, Pregnancy and Breastfeeding, Contains Organic
Calendula 3-Ounce
$10.99
[B08KBVJ4XN]
Barrel and Oak - Aluminum-Free Deodorant, Deodorant for Men,
Essential Oil-Based Scent, 24-Hour Odor Protection, Cedar
& Patchouli Blend, Gentle on Sensitive Skin (Mountain Sage,
2.7 oz, 2-Pack)
$15.95

Action: think[B078GWRC1J and B078GTKVXY are bright citrus
deodorant less then 50 dollars. I can check B078GWRC1J first.]
Observation: OK.

Action: click[B078GWRC1J]
Observation:
[Back to Search]
[Prev]
scent [assorted scents][bright citrus][calming lavender][ginger
[fresh] simply non-scents]
size [travel set (4-pack)][3 ounce (pack of 1)][3-ounce (2
-pack)]
Bright Citrus Deodorant by Earth Mama | Natural and Safe for
Sensitive Skin, Pregnancy and Breastfeeding, Contains Organic
Calendula 3-Ounce
Price: $10.99
Rating: N.A.
[Description]
[Features]
[Reviews]
[Buy Now]

Action: think[For 3 ounce bottle of bright citrus deodorant
for sensitive skin, the item has options 'bright citrus'
and '3 ounce (pack of 1)' and seems good to buy.]
Observation: OK.

Action: click[bright citrus]
Observation: You have clicked bright citrus.

Action: click[3 ounce (pack of 1)]
Observation: You have clicked 3 ounce (pack of 1).

Action: click[Buy Now]
```

### C.4 ALFWorld

**表 7。ALFWorld clean 任务上的 Act 提示。** 不提供思考。

```text
You are in the middle of a room. Looking quickly around you, you see a cabinet 13, a cabinet 12, a cabinet 11, a cabinet 10, a cabinet 9, a cabinet 8, a cabinet 7, a cabinet 6, a cabinet 5, a cabinet 4, a cabinet 3, a cabinet 2, a cabinet 1, a coffeemachine 1, a countertop 1, a diningtable 1, a drawer 1, a fridge 1, a garbagecan 1, a microwave 1, a shelf 3, a shelf 2, a shelf 1, a sinkbasin 1, a stoveburner 4, a stoveburner 3, a stoveburner 2, a stoveburner 1, and a toaster 1.
Your task is to: put a clean lettuce in diningtable.
> go to fridge 1
The fridge 1 is closed.
> open fridge 1
You open the fridge 1. The fridge 1 is open. In it, you see a cup 3, a egg 2, a potato 3, and a potato 2.
> go to diningtable 1
On the diningtable 1, you see a apple 1, a bread 1, a butterknife 2, a cup 2, a fork 2, a knife 2, a knife 1, a ladle 1, a lettuce 1, a mug 2, a mug 1, a pan 2, a peppershaker 1, a spatula 3, a tomato 2, and a tomato 1.
> take lettuce 1 from diningtable 1
You pick up the lettuce 1 from the diningtable 1.
> go to sinkbasin 1
On the sinkbasin 1, you see a apple 2, a ladle 2, a spoon 1, and a tomato 3.
> clean lettuce 1 with sinkbasin 1
You clean the lettuce 1 using the sinkbasin 1.
> think: Now I clean a lettuce (1). Next, I need to put it in/on diningtable 1.
OK.
> go to diningtable 1
On the diningtable 1, you see a apple 1, a bread 1, a butterknife 2, a cup 2, a fork 2, a knife 2, a knife 1, a ladle 1, a mug 2, a mug 1, a pan 2, a peppershaker 1, a spatula 3, a tomato 2, and a tomato 1.
> put lettuce 1 in/on diningtable 1
You put the lettuce 1 in/on the diningtable 1.
```

**表 8。ALFWorld clean 任务上的 ReAct 提示。**

```text
You are in the middle of a room. Looking quickly around you, you see a cabinet 13, a cabinet 12, a cabinet 11, a cabinet 10, a cabinet 9, a cabinet 8, a cabinet 7, a cabinet 6, a cabinet 5, a cabinet 4, a cabinet 3, a cabinet 2, a cabinet 1, a coffeemachine 1, a countertop 1, a diningtable 1, a drawer 1, a fridge 1, a garbagecan 1, a microwave 1, a shelf 3, a shelf 2, a shelf 1, a sinkbasin 1, a stoveburner 4, a stoveburner 3, a stoveburner 2, a stoveburner 1, and a toaster 1.
Your task is to: put a clean lettuce in diningtable.
> think: To solve the task, I need to find and take a lettuce, then clean it with sinkbasin, then put it in diningtable.
OK.
> think: First I need to find a lettuce. A lettuce is more likely to appear in fridge (1), diningtable (1), sinkbasin (1), stoveburner (1-3), cabinet (1-13). I can check one by one, starting with fridge 1.
OK.
> go to fridge 1
The fridge 1 is closed.
> open fridge 1
You open the fridge 1. The fridge 1 is open. In it, you see a cup 3, a egg 2, a potato 3, and a potato 2.
> go to diningtable 1
On the diningtable 1, you see a apple 1, a bread 1, a butterknife 2, a cup 2, a fork 2, a knife 2, a knife 1, a ladle 1, a lettuce 1, a mug 2, a mug 1, a pan 2, a peppershaker 1, a spatula 3, a tomato 2, and a tomato 1.
> think: Now I find a lettuce (1). Next, I need to take it.
OK.
> take lettuce 1 from diningtable 1
You pick up the lettuce 1 from the diningtable 1.
> think: Now I take a lettuce (1). Next, I need to go to sinkbasin (1) and clean it.
OK.
> go to sinkbasin 1
On the sinkbasin 1, you see a apple 2, a ladle 2, a spoon 1, and a tomato 3.
> clean lettuce 1 with sinkbasin 1
You clean the lettuce 1 using the sinkbasin 1.
> think: Now I clean a lettuce (1). Next, I need to put it in/on diningtable 1.
OK.
> go to diningtable 1
On the diningtable 1, you see a apple 1, a bread 1, a butterknife 2, a cup 2, a fork 2, a knife 2, a knife 1, a ladle 1, a mug 2, a mug 1, a pan 2, a peppershaker 1, a spatula 3, a tomato 2, and a tomato 1.
> put lettuce 1 in/on diningtable 1
You put the lettuce 1 in/on the diningtable 1.
```

**表 9。ALFWorld clean 任务上的 ReAct-IM 提示。**

```text
You are in the middle of a room. Looking quickly around you, you see a cabinet 13, a cabinet 12, a cabinet 11, a cabinet 10, a cabinet 9, a cabinet 8, a cabinet 7, a cabinet 6, a cabinet 5, a cabinet 4, a cabinet 3, a cabinet 2, a cabinet 1, a coffeemachine 1, a countertop 1, a diningtable 1, a drawer 1, a fridge 1, a garbagecan 1, a microwave 1, a shelf 3, a shelf 2, a shelf 1, a sinkbasin 1, a stoveburner 4, a stoveburner 3, a stoveburner 2, a stoveburner 1, and a toaster 1.
Your task is to: put a clean lettuce in diningtable.
> think: To solve the task, I need to find and take a lettuce, then clean it with sinkbasin, then put it in diningtable.
OK.
> think: First I need to find a lettuce.
OK.
> go to fridge 1
The fridge 1 is closed.
> think: First I need to find a lettuce.
OK.
> open fridge 1
You open the fridge 1. The fridge 1 is open. In it, you see a cup 3, a egg 2, a potato 3, and a potato 2.
> think: First I need to find a lettuce.
OK.
> go to diningtable 1
On the diningtable 1, you see a apple 1, a bread 1, a butterknife 2, a cup 2, a fork 2, a knife 2, a knife 1, a ladle 1, a lettuce 1, a mug 2, a mug 1, a pan 2, a peppershaker 1, a spatula 3, a tomato 2, and a tomato 1.
> think: First I need to find a lettuce.
OK.
> take lettuce 1 from diningtable 1
You pick up the lettuce 1 from the diningtable 1.
> think: I need to clean this lettuce (1) using sinkbasin 1.
OK.
> go to sinkbasin 1
On the sinkbasin 1, you see a apple 2, a ladle 2, a spoon 1, and a tomato 3.
> think: I need to clean this lettuce (1) using sinkbasin 1.
OK.
> clean lettuce 1 with sinkbasin 1
You clean the lettuce 1 using the sinkbasin 1.
> think: I need to put this cleaned lettuce (1) in/on diningtable 1.
OK.
> go to diningtable 1
On the diningtable 1, you see a apple 1, a bread 1, a butterknife 2, a cup 2, a fork 2, a knife 2, a knife 1, a ladle 1, a mug 2, a mug 1, a pan 2, a peppershaker 1, a spatula 3, a tomato 2, and a tomato 1.
> think: I need to put this cleaned lettuce (1) in/on diningtable 1.
OK.
> put lettuce 1 in/on diningtable 1
You put the lettuce 1 in/on the diningtable 1.
```

## 附录 D 轨迹

### D.1 FEVER 轨迹

下面给出 ReAct、CoT 和 Act 在 FEVER 开发集中若干随机示例上生成的轨迹。为节省篇幅，原文省略了搜索结果中的具体内容；这里照原文保留省略号。

#### 示例 2491（ground truth：`REFUTES`）

```text
ReAct
Claim: Bermuda Triangle is a loosely-defined region in the Pacific Ocean.
Thought 1: I need to search Bermuda Triangle and find if it is in the Pacific Ocean.
Action 1: Search[Bermuda Triangle]
Observation 1: Reportedly haunted locations...
Thought 2: The observation says that it is in the western part of the North Atlantic Ocean, so it is not in the Pacific Ocean.
Action 2: Finish[REFUTES]
Observation 2: Episode finished

Act
Claim: Bermuda Triangle is a loosely-defined region in the Pacific Ocean.
Action 1: Search[Bermuda Triangle]
Observation 1: Reportedly haunted locations:...
Action 2: Finish[REFUTES]
Observation 2: Episode finished

CoT
Claim: Bermuda Triangle is a loosely-defined region in the Pacific Ocean.
Thought: Let's think step by step. The Bermuda Triangle is a loosely-defined region in the Atlantic Ocean. The Pacific Ocean is not the Atlantic Ocean.
Answer: REFUTES
```

#### 示例 5908（ground truth：`SUPPORTS`）

```text
ReAct
Claim: Princess Mononoke is a film.
Thought 1: I need to search Princess Mononoke and find if it is a film.
Action 1: Search[Princess Mononoke]
Observation 1: Princess Mononoke ...
Thought 2: From the observation, it says that Princess Mononoke is a film.
Action 2: Finish[SUPPORTS]
Observation 2: Episode finished

Act
Claim: Princess Mononoke is a film.
Action 1: Search[Princess Mononoke]
Observation 1: Princess Mononoke ...
Action 2: Finish[SUPPORTS]
Observation 2: Episode finished

CoT
Claim: Princess Mononoke is a film.
Thought: Let's think step by step. Princess Mononoke is a movie, and movies are films.
Answer: SUPPORTS
```

#### 示例 1951（ground truth：`REFUTES`）

```text
ReAct
Claim: Soyuz was part of the American space program.
Thought 1: I need to search Soyuz and find if it was part of the American space program.
Action 1: Search[Soyuz]
Observation 1: Soyuz is a transliteration...
Thought 2: It does not mention the American space program, so I need to search "American space program" to find if it was part of it.
Action 2: Search[American space program]
Observation 2: The space policy...
Thought 3: It does not mention Soyuz, so I am not sure if this claim is true or not.
Action 3: Finish[NOT ENOUGH INFO]
Observation 3: Episode finished

Act
Claim: Soyuz was part of the American space program.
Action 1: Search[Soyuz]
Observation 1: Soyuz is a transliteration...
Action 2: Finish[NOT ENOUGH INFO]
Observation 2: Episode finished

CoT
Claim: Soyuz was part of the American space program.
Thought: Let's think step by step. Soyuz is a Russian spacecraft. The American space program is NASA. NASA and Russia have worked together on the International Space Station.
Answer: SUPPORTS
```

#### 示例 3208（ground truth：`REFUTES`）

```text
ReAct
Claim: Reign Over Me is an American film made in 2010.
Thought 1: I need to search for Reign Over Me and find if it is an American film made in 2010.
Action 1: Search[Reign Over Me]
Observation 1: Reign Over Me ...
Thought 2: The observation says that it is an American film made in 2007, so it is not made in 2010.
Action 2: Finish[REFUTES]
Observation 2: Episode finished

Act
Claim: Reign Over Me is an American film made in 2010.
Action 1: Search[Reign Over Me]
Action 2: Finish[SUPPORTS]
Observation 2: Episode finished

CoT
Claim: Reign Over Me is an American film made in 2010.
Thought: Let's think step by step. First, is Reign Over Me an American film? Yes, it is. Second, was it made in 2010? Yes, it was.
Answer: SUPPORTS
```

### D.2 ALFWorld 轨迹

以下是在同一个 ALFWorld 游戏
`pick_clean_then_place_in_recep-Knife-None-CounterTop-10/trial_T20190909_110445_675754`
上由 ReAct、Act 和 ReAct-IM 生成的示例轨迹。

#### D.2.1 ReAct 轨迹

ReAct 能正确找到刀、把刀洗净，再把它放到台面上。

```text
You are in the middle of a room. Looking quickly around you, you see a cabinet 6, a cabinet 5, a cabinet 4, a cabinet 3, a cabinet 2, a cabinet 1, a coffeemachine 1, a countertop 3, a countertop 2, a countertop 1, a drawer 3, a drawer 2, a drawer 1, a fridge 1, a garbagecan 1, a microwave 1, a shelf 3, a shelf 2, a shelf 1, a sinkbasin 1, a stoveburner 4, a stoveburner 3, a stoveburner 2, a stoveburner 1, and a toaster 1.
Your task is to: put a clean knife in countertop.
> think: To solve the task, I need to find and take a knife, then clean it with sinkbasin, then put it in countertop.
OK.
> think: First I need to find a knife. A knife is more likely to appear in cabinet (1-6), drawer (1-3), countertop (1-3), fridge (1), garbagecan (1), shelf (1-3), sinkbasin (1), stoveburner (1-4), toaster (1). I can check one by one, starting with cabinet 1.
OK.
> go to cabinet 1
On the cabinet 1, you see a bowl 1.
> go to cabinet 2
The cabinet 2 is closed.
> go to cabinet 3
On the cabinet 3, you see a glassbottle 1.
> go to cabinet 4
On the cabinet 4, you see a mug 1.
> go to cabinet 5
The cabinet 5 is closed.
> go to cabinet 6
The cabinet 6 is closed.
> go to drawer 1
The drawer 1 is closed.
> go to drawer 2
The drawer 2 is closed.
> go to drawer 3
The drawer 3 is closed.
> go to countertop 1
On the countertop 1, you see a lettuce 2, a mug 2, a peppershaker 1, and a spoon 2.
> go to countertop 2
On the countertop 2, you see a cup 1, a dishsponge 1, a glassbottle 3, a knife 1, a plate 2, a potato 3, and a statue 1.
> think: Now I find a knife (1). Next, I need to take it.
OK.
> take knife 1 from countertop 2
You pick up the knife 1 from the countertop 2.
> think: Now I take a knife (1). Next, I need to go to sinkbasin (1) and clean it.
OK.
> go to sinkbasin 1
On the sinkbasin 1, you see a fork 3, a lettuce 3, and a spatula 2.
> clean knife 1 with sinkbasin 1
You clean the knife 1 using the sinkbasin 1.
> think: Now I clean a knife (1). Next, I need to put it in/on countertop 1.
OK.
> go to countertop 1
On the countertop 1, you see a lettuce 2, a mug 2, a peppershaker 1, and a spoon 2.
> put knife 1 in/on countertop 1
You put the knife 1 in/on the countertop 1.
```

#### D.2.2 Act 轨迹

Act 能正确找到刀，却在真正走到水槽之前就尝试用水槽清洗它。此后模型无法恢复，陷入反复执行同一串命令的循环。使用 ReAct 时，一条已有思考会明确记录刀已经拿到，而下一子目标是前往水槽清洗它。

```text
You are in the middle of a room. Looking quickly around you, you see a cabinet 6, a cabinet 5, a cabinet 4, a cabinet 3, a cabinet 2, a cabinet 1, a coffeemachine 1, a countertop 3, a countertop 2, a countertop 1, a drawer 3, a drawer 2, a drawer 1, a fridge 1, a garbagecan 1, a microwave 1, a shelf 3, a shelf 2, a shelf 1, a sinkbasin 1, a stoveburner 4, a stoveburner 3, a stoveburner 2, a stoveburner 1, and a toaster 1.
Your task is to: put a clean knife in countertop.
> go to countertop 1
On the countertop 1, you see a lettuce 2, a mug 2, a peppershaker 1, and a spoon 2.
> go to countertop 2
On the countertop 2, you see a cup 1, a dishsponge 1, a glassbottle 3, a knife 1, a plate 2, a potato 3, and a statue 1.
> take knife 1 from countertop 2
You pick up the knife 1 from the countertop 2.
> go to countertop 1
On the countertop 1, you see a lettuce 2, a mug 2, a peppershaker 1, and a spoon 2.
> clean knife 1 with sinkbasin 1
Nothing happens.
> go to countertop 3
On the countertop 3, you see a bread 3, a butterknife 2, a cellphone 1, a creditcard 1, a fork 2, a houseplant 1, a knife 2, a spatula 1, a statue 3, a tomato 3, a tomato 2, a tomato 1, and a vase 2.
> take knife 2 from countertop 3
Nothing happens.
> go to countertop 2
On the countertop 2, you see a cup 1, a dishsponge 1, a glassbottle 3, a plate 2, a potato 3, and a statue 1.
> take knife 1 from countertop 2
Nothing happens.
> go to countertop 1
On the countertop 1, you see a lettuce 2, a mug 2, a peppershaker 1, and a spoon 2.
> clean knife 1 with sinkbasin 1
Nothing happens.
> go to countertop 3
On the countertop 3, you see a bread 3, a butterknife 2, a cellphone 1, a creditcard 1, a fork 2, a houseplant 1, a knife 2, a spatula 1, a statue 3, a tomato 3, a tomato 2, a tomato 1, and a vase 2.
> take knife 2 from countertop 3
Nothing happens.
> go to countertop 2
On the countertop 2, you see a cup 1, a dishsponge 1, a glassbottle 3, a plate 2, a potato 3, and a statue 1.
> take knife 1 from countertop 2
Nothing happens.
> go to countertop 1
On the countertop 1, you see a lettuce 2, a mug 2, a peppershaker 1, and a spoon 2.
> clean knife 1 with sinkbasin 1
Nothing happens.
> go to countertop 3
On the countertop 3, you see a bread 3, a butterknife 2, a cellphone 1, a creditcard 1, a fork 2, a houseplant 1, a knife 2, a spatula 1, a statue 3, a tomato 3, a tomato 2, a tomato 1, and a vase 2.
> take knife 2 from countertop 3
Nothing happens.
> go to countertop 2
On the countertop 2, you see a cup 1, a dishsponge 1, a glassbottle 3, a plate 2, a potato 3, and a statue 1.
> take knife 1 from countertop 2
Nothing happens.
> go to countertop 1
On the countertop 1, you see a lettuce 2, a mug 2, a peppershaker 1, and a spoon 2.
> clean knife 1 with sinkbasin 1
Nothing happens.
```

#### D.2.3 ReAct-IM 轨迹

ReAct-IM 同样能正确找到刀，却没有把刀洗净。随后，LLM 在尝试把刀放到台面时陷入循环。一种可能原因是错误思考 `think: I need to find a clean knife.` 诱使 LLM 相信刀已经洗净。在 ReAct 中，这串子目标会由每一条思考明确记录。

```text
You are in the middle of a room. Looking quickly around you, you see a cabinet 6, a cabinet 5, a cabinet 4, a cabinet 3, a cabinet 2, a cabinet 1, a coffeemachine 1, a countertop 3, a countertop 2, a countertop 1, a drawer 3, a drawer 2, a drawer 1, a fridge 1, a garbagecan 1, a microwave 1, a shelf 3, a shelf 2, a shelf 1, a sinkbasin 1, a stoveburner 4, a stoveburner 3, a stoveburner 2, a stoveburner 1, and a toaster 1.
Your task is to: put a clean knife in countertop.
> think: To solve the task, I need to find and take a clean knife, then put it in countertop.
OK.
> think: I need to find a clean knife.
OK.
> go to countertop 1
On the countertop 1, you see a lettuce 2, a mug 2, a peppershaker 1, and a spoon 2.
> think: I need to find a clean knife.
OK.
> go to countertop 2
On the countertop 2, you see a cup 1, a dishsponge 1, a glassbottle 3, a knife 1, a plate 2, a potato 3, and a statue 1.
> think: I need to find a clean knife.
OK.
> take knife 1 from countertop 2
You pick up the knife 1 from the countertop 2.
> think: I need to put this knife (1) in/on countertop 1.
OK.
> go to countertop 1
On the countertop 1, you see a lettuce 2, a mug 2, a peppershaker 1, and a spoon 2.
> think: I need to put this knife (1) in/on countertop 1.
OK.
> put knife 1 in/on countertop 1
You put the knife 1 in/on the countertop 1.
> think: I need to put this knife (1) in/on countertop 1.
OK.
> put knife 1 in/on countertop 1
Nothing happens.
> think: I need to put this knife (1) in/on countertop 1.
OK.
> put knife 1 in/on countertop 1
Nothing happens.
> think: I need to put this knife (1) in/on countertop 1.
OK.
> put knife 1 in/on countertop 1
Nothing happens.
> think: I need to put this knife (1) in/on countertop 1.
OK.
> put knife 1 in/on countertop 1
Nothing happens.
> think: I need to put this knife (1) in/on countertop 1.
OK.
> put knife 1 in/on countertop 1
Nothing happens.
> think: I need to put this knife (1) in/on countertop 1.
OK.
```

### D.3 WebShop 轨迹

**表 10。Act 与 ReAct 在 WebShop 上预测的示例轨迹。** 与 Act 相比，ReAct 使用推理寻找满足全部目标属性的商品。原表左右两列在此依次展开。

**Instruction**

```text
get me a sixteen pack of apple cinnamon freeze dried banana chips, and price lower than 50.00 dollars
```

#### Act（Score：0.125）

```text
Action: search[sixteen pack apple cinnamon freeze dried banana chips]
Observation:
[ Back to Search ]
Page 1 (Total results: 50)
[Next]

[B0061IVFZE]
Brothers-ALL-Natural Fruit Crisps, Strawberry Banana, 0.42 -
Ounce (Pack of 100)
$85.0
[B096H2P6G2]
Moon Fruit Freeze Dried Fruit Snacks. Fruit Snacks for Kids -
(Variety Pack)
$18.99
[B092JLLYK6]
Nature’s Turn Freeze-Dried Fruit Snacks - Banana Crisps - Perfect
For School Lunches or an On-The-Go Snack - No Sugar Added,
Non GMO, Gluten Free, Nothing Artificial (0.53oz) 6-Pack
$12.99

Action: click[B0061IVFZE]
Observation:
[Back to Search]
[Prev]
flavor name [asian pear][banana][fuji apple & cinnamon][strawberry
banana]
Brothers-ALL-Natural Fruit Crisps, Strawberry Banana,
0.42 Ounce (Pack of 100)
Price: $85.0
Rating: N.A.
[Description]
[Features]
[Reviews]
[Buy Now]

Action: click[Buy Now]
```

#### ReAct（Score：1.0）

```text
Action: search[sixteen pack apple cinnamon freeze dried banana chips]
Observation:
[ Back to Search ]
Page 1 (Total results: 50)
[Next]

[B0061IVFZE]
Brothers-ALL-Natural Fruit Crisps, Strawberry Banana, 0.42 -
Ounce (Pack of 100)
$85.0
[B096H2P6G2]
Moon Fruit Freeze Dried Fruit Snacks. Fruit Snacks for Kids -
(Variety Pack)
$18.99
[B092JLLYK6]
Nature’s Turn Freeze-Dried Fruit Snacks - Banana Crisps - Perfect
For School Lunches or an On-The-Go Snack - No Sugar Added,
Non GMO, Gluten Free, Nothing Artificial (0.53oz) 6-Pack
$12.99

Action: think[B0061IVFZE is strawberry banana, not apple cinnamon.
B096H2P6G2 is fruit snacks, not freeze dried banana chips.
B092JLLYK6 is banana crisps, not apple cinnamon. I can check
B092JLLYK6 first.]
Observation: OK.

Action: click[B092JLLYK6]
Observation:
[Back to Search]
[Prev]
flavor name [apple][apple cinnamon][banana][cantaloupe][peach][pear]
[strawberry][strawberry banana][sampler variety pack][mega variety
pack][orchard variety pack]
size [0.53 ounce (pack of 6)][0.53 ounce (pack of 8)][0.53 ounce (pack
of 16)]
Nature’s Turn Freeze-Dried Fruit Snacks - Banana Crisps - Perfect
For School Lunches or an On-The-Go Snack - No Sugar Added, Non
GMO, Gluten Free, Nothing Artificial (0.53oz) 6-Pack
Price: $12.99
Rating: N.A.
[Description]
[Features]
[Reviews]
[Buy Now]

Action: think[For sixteen pack of apple cinnamon freeze dried banana
chips, the item has options 'apple cinnamon' and '0.53 ounce (pack of
16)' and seems good to buy.]
Observation: OK.

Action: click[apple cinnamon]
Observation: You have clicked apple cinnamon.

Action: click[0.53 ounce (pack of 16)]
Observation: You have clicked 0.53 ounce (pack of 16).

Action: click[Buy Now]
```

## 附录 E 更多分析

### E.1 成功与失败模式分析

下面给出与第 3.3 节成功及错误模式分析对应的若干示例。原文为节省篇幅，省略了搜索结果和不具代表性的步骤；这里保留原文的省略号。

#### 成功：真阳性

```text
ReAct
Question: Author David Chanoff has collaborated with a U.S. Navy admiral who served as the ambassador to the United Kingdom under which President?
Thought 1: I need to search David Chanoff and find the U.S. Navy admiral he collaborated with.
Action 1: Search[David Chanoff]
Observation 1: David Chanoff is a noted author...
Action 2: Search[William J. Crowe]
Observation 2: William J. Crowe is...
Thought 3: William J. Crowe served as the ambassador to the United Kingdom under President Bill Clinton. So the answer is Bill Clinton.
Action 3: Finish[Bill Clinton]
Observation 3: Episode finished

CoT
Question: What was the name of the team that represented an Arizona university in the conference that covers a broad expanse of the western United States, including Arizona, California, and New Mexico?
Thought: Let's think step by step. The name of the team that represented an Arizona university in the conference that covers a broad expanse of the western United States, including Arizona, California, and New Mexico is Arizona State Sun Devils.
Answer: Arizona State Sun Devils
```

#### 成功：假阳性

```text
ReAct
Question: Did the board game San Marco or About Time come out first?
Thought 1: I need to search San Marco and About Time, and find which came out first.
Action 1: Search[San Marco]
Observation 1: San Marco is one of the ... The was built in venice.
Thought 2: San Marco is a sestiere of Venice. I need to search About Time next.
Action 2: Search[About Time]
Observation 2: Could not find [About Time]. Similar: [...].
Thought 3: About Time is a 2013 film. So San Marco came out first.
Action 3: Finish[San Marco]
Observation 3: Episode finished

CoT
Question: Was Vanderbilt University or Emory University founded first?
Thought: Let's think step by step. Vanderbilt University was founded in 1873. Emory University was founded in 1836. 1873 (Vanderbilt University) > 1836 (Emory University), so Vanderbilt University was founded first.
Answer: Emory University
```

#### 失败：推理错误

```text
ReAct
Question: What was the middle name of the actress who was cast alongside Harvey Fierstein, Linda Hart, Dick Latessa, Clarke Thorell, Mary Bond Davis, Laura Bell Bundy, Matthew Morrison, Corey Reynolds, and Marissa Jaret Winokur in Hairspray?
Thought 1: I need to search Harvey Fierstein, Linda Hart, Dick Latessa, Clarke Thorell, Mary Bond Davis, Laura Bell Bundy, Matthew Morrison, Corey Reynolds, and Marissa Jaret Winokur, find the actress that was cast alongside them in Hairspray, then find its middle name.
Action 1: Search[Harvey Fierstein]
Observation 1: Harvey Forbes Fierstein ...
Thought 2: Harvey Fierstein is an actor, playwright, and screenwriter. I need to search Linda Hart next...
Action 2: Search[Linda Hart]...

CoT
Question: Who is older Danny Green or James Worthy?
Thought: Let's think step by step. Danny Green was born in 1987. James Worthy was born in 1961. 1987 (Danny Green) > 1961 (James Worthy), so Danny Green is older.
Answer: Danny Green
```

#### 失败：搜索错误

```text
ReAct
Question: What does the goddess associated with the goddess frigg consists of what tales?
Thought 1: I need to search goddess frigg and find its associated goddess.
Action 1: Search[goddess frigg]
Observation 1: Could not find goddess frigg. Similar: ['Frigg', 'Frigg and Freyja common origin hypothesis', 'Freyja (section Relation to Frigg and other goddesses and figures)', 'Eir (redirect from Eir (goddess))', 'Baldr'].
Thought 2: I need to search Frigg instead...
```

#### 失败：幻觉

```text
CoT
Question: What was the first year a scientific journal published by an organization located in the Bronx was published?
Thought: Let's think step by step. The first year a scientific journal published by an organization located in the Bronx was published was 1916.
Answer: 1916 (Label: 1909)
```

#### 失败：标签歧义

```text
ReAct
Question: What nationality is the man who developed the dictator game?
Thought 1: I need to search dictator game, find the man who developed it, then find his nationality.
Action 1: Search[dictator game]
Observation 1: The dictator game is a popular experimental instrument in social psychology and economics...
Action 3: Search[Amos Tversky]
Observation 3: Amos Nathan Tversky...
Thought 4: Amos Tversky is an Israeli cognitive and mathematical psychologist. So the man who developed the dictator game is Israeli.
Action 4: Finish[Israeli] (label: Israel-American)

CoT
Question: Kurt Fuller from Stockton, CA appeared in which American Detective Comedy Drama television series created by Steve Franks?
Thought: Let's think step by step. Kurt Fuller from Stockton, CA appeared in Psych. Psych is an American Detective Comedy Drama television series created by Steve Franks.
Answer: Psych (label: Psych is an American detective comedy-drama)
```
