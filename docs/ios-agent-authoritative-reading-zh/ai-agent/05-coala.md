# 语言智能体的认知架构（Cognitive Architectures for Language Agents）

- **原文标题：** Cognitive Architectures for Language Agents
- **作者：** Theodore R. Sumers、Shunyu Yao、Karthik Narasimhan、Thomas L. Griffiths
- **作者机构：** Princeton University
- **原文版本：** arXiv v3，2024-03-15；Transactions on Machine Learning Research（TMLR）2024 年 2 月正式版本
- **原文链接：** [arXiv 摘要页](https://arxiv.org/abs/2309.02427v3)；[PDF](https://arxiv.org/pdf/2309.02427v3)；[OpenReview](https://openreview.net/forum?id=1i6ZCvflQJ)
- **许可协议：** [Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/)
- **翻译日期：** 2026-07-27
- **文档性质：** 非官方中文翻译
- **修改说明：** 本文是依据论文 v3 所作的完整中文改编。说明文字与图表文字译为中文；公式、引用标识、专有名称和参考文献书目信息尽量保持原样。译文保留原作者署名、原文链接、版权与许可链接，并明确说明已作中文翻译修改。

> **作者说明：** Theodore R. Sumers 与 Shunyu Yao 贡献相同，署名顺序由掷硬币决定；每位作者均保留在个人材料中把自己列为第一作者的权利。基于 CoALA 整理近期语言智能体工作的仓库见 [awesome-language-agents](https://github.com/ysymyth/awesome-language-agents)。

## 摘要

近期工作通过外部资源（例如互联网）或内部控制流（例如提示链）来增强大语言模型（LLM），以完成需要落地或推理的任务，由此催生了一类新的*语言智能体*。尽管这些智能体在实证上取得了显著成功，我们仍然缺少一个能够组织现有智能体并规划未来发展的框架。

本文借鉴认知科学与符号人工智能的丰富历史，提出语言智能体的认知架构（Cognitive Architectures for Language Agents，CoALA）。CoALA 所描述的语言智能体拥有模块化记忆组件、用于同内部记忆和外部环境交互的结构化动作空间，以及用于选择动作的通用决策过程。

我们用 CoALA *回顾性地*梳理和组织大量近期工作，并*前瞻性地*指出通向更强智能体的可执行方向。总体而言，CoALA 把今天的语言智能体放回更广阔的 AI 历史语境，并勾勒出一条通往基于语言的通用智能之路。

## 1 引言

*语言智能体*（Weng, 2023；Wang et al., 2023b；Xi et al., 2023；Yao and Narasimhan, 2023）是一类新兴人工智能（AI）系统，它使用大语言模型（LLM；Vaswani et al., 2017；Brown et al., 2020；Devlin et al., 2019；OpenAI, 2023a）与世界交互。它把 LLM 的最新进展应用到已有的智能体设计领域（Russell and Norvig, 2013）。有趣的是，这种结合对两个领域都有益。一方面，LLM 的知识与推理能力有限；语言智能体通过把 LLM 连接到内部记忆和环境，使其落地到已有知识或外部观察，从而缓解这些问题。另一方面，传统智能体往往需要手工编写规则（Wilkins, 2014）或采用强化学习（Sutton and Barto, 2018），因而很难泛化到新环境（Lake et al., 2016）。语言智能体利用 LLM 中已有的常识先验适应新任务，减少对人工标注或试错学习的依赖。

最早的智能体用 LLM 直接选择或生成动作（图 1B；Ahn et al., 2022；Huang et al., 2022b）；较新的智能体还用它进行推理（Yao et al., 2022b）、规划（Hao et al., 2023；Yao et al., 2023）以及管理长期记忆（Park et al., 2023；Wang et al., 2023a），从而改进决策。这一代最新的*认知型*语言智能体采用了相当复杂的内部过程（图 1C）。然而，今天的各项工作使用各自的术语描述这些过程，例如“工具使用”“落地”和“动作”，使人难以比较不同智能体、理解它们如何随时间演进，或用清晰一致的抽象构建新智能体。

为建立一个组织这些工作的概念框架，我们把它们与计算和人工智能历史上的两个概念作类比：*产生式系统*与*认知架构*。产生式系统通过反复应用规则生成一组结果（Newell and Simon, 1972）。它最初是一类字符串操作系统——与 LLM 所解决的问题相似——随后被 AI 社区用于定义能够表现复杂层级行为的系统（Newell et al., 1989）。为此，研究者把产生式系统纳入认知架构，由认知架构规定选择、应用乃至生成新产生式的控制流（Laird et al., 1987；Laird, 2022；Kotseruba and Tsotsos, 2020）。我们认为产生式系统与 LLM 之间存在一个富有意义的类比：正如产生式指出修改字符串的可能方式，LLM 定义了文本改动或增补的概率分布。这又意味着，过去配合产生式系统使用的认知架构控制机制，也可能同样适用于把 LLM 转化为语言智能体。

![图 1：大语言模型的不同使用方式](https://arxiv.org/html/2309.02427v3/x1.png)

**图 1：大语言模型（LLM）的不同使用方式。** **A：**在自然语言处理（NLP）中，LLM 以文本为输入并输出文本。**B：***语言智能体*（Ahn et al., 2022；Huang et al., 2022c）把 LLM 放入与外部环境直接交互的反馈循环：把观察转换成文本，再使用 LLM 选择动作。**C：***认知型*语言智能体（Yao et al., 2022b；Shinn et al., 2023；Wang et al., 2023a）还会借助学习和推理等过程，让 LLM 管理智能体的内部状态。本文提出了一份用于组织此类智能体的蓝图。

因此，我们提出语言智能体的认知架构（**Co**gnitive **A**rchitectures for **L**anguage **A**gents，CoALA）：一个用于刻画和设计通用语言智能体的概念框架。CoALA 沿三个关键维度组织智能体：*信息存储*（分为工作记忆与长期记忆）、*动作空间*（分为内部动作与外部动作），以及*决策过程*（组织成包含规划和执行的交互循环）。通过记忆、动作与决策这三个概念，我们说明 CoALA 可以简洁表达大量现有智能体，并找出尚未得到充分探索的新智能体发展方向。值得注意的是，一些近期论文提出了通用智能的概念架构（LeCun, 2022；McClelland et al., 2019），另一些则对语言模型和智能体作了实证综述（Mialon et al., 2023；Weng, 2023；Wang et al., 2023b）；本文结合了两类工作的要素：既提出理论框架，*又*用它组织多样的实证研究。这样既让理论落在现有实践之上，也使我们能够发现短期和长期的未来研究方向。

本文余下部分安排如下。我们首先介绍产生式系统与认知架构（第 2 节），然后说明 LLM 和语言智能体的近期发展如何重现这些历史思想（第 3 节）。受这些相似性的启发，第 4 节介绍 CoALA 框架并用它梳理现有语言智能体。第 5 节对几个有代表性的智能体作更深入的案例研究。第 6 节提出构建未来语言智能体的可执行步骤，第 7 节则强调认知科学与 AI 更长历史脉络中的开放问题。最后，第 8 节作出总结。对智能体应用设计感兴趣的读者可以优先阅读第 4～6 节。

## 2 背景：从字符串到符号 AGI

我们首先介绍产生式系统和认知架构，为认知科学与人工智能提供一幅历史图景：从逻辑与计算理论（Post, 1943）出发，到构建符号人工通用智能的尝试（Newell et al., 1989）为止。接下来，我们简要介绍语言模型和语言智能体。第 3 节会把这些思想联系起来，说明产生式系统与语言模型之间的相似性。

### 2.1 用于字符串操作的产生式系统

20 世纪上半叶，一条重要的思想路线把数学（Whitehead and Russell, 1997）和计算（Church, 1932；Turing et al., 1936）归结为符号操作。产生式系统就是这样一种形式系统。直观地说，产生式系统由一组规则构成，每条规则都规定一个前置条件和一个动作；满足前置条件时，就可以执行该动作。这一思想源自刻画计算能力边界的工作。Post（1943）提出用这种方式理解任意逻辑系统：公式表示为字符串，而它们所允许推出的结论由产生式规则确定（即一个字符串“产生”另一个字符串）。后来，人们证明这种表述与更简单的字符串重写系统等价。在这样的系统中，可以规定如下形式的规则：

$$
X\,Y\,Z \rightarrow X\,W\,Z
$$

它表示字符串 $XYZ$ 可以重写为字符串 $XWZ$。字符串重写以 Chomsky 短语结构文法（Chomsky, 1956）的形式，在形式语言理论中发挥着重要作用。

### 2.2 控制流：从字符串到算法

单独来看，产生式系统只是刻画了从某个起点能够生成的字符串集合。然而，如果加入*控制流*来决定执行哪些产生式，它就可以用于规定算法。例如，Markov 算法就是具有优先顺序的产生式系统（Markov, 1954）。下面这个算法把以竖线 $|$ 写出的数字转换为 $Q*R$ 的形式，从而实现带余数除法；其中 $Q$ 是除以 5 所得的商，$R$ 是余数：

$$
\begin{aligned}
*||||| &\rightarrow |* \\
* &\xrightarrow{\bullet} * \\
\varepsilon &\rightarrow *
\end{aligned}
$$

这里，优先级从上到下排列；从左向右寻找时，产生式作用于第一个符合其前置条件的子串（最后一条产生式还包括空子串）；$\xrightarrow{\bullet}$ 表示算法在执行该规则后停止。第一条规则在可能时实际“减去”五；第二条处理无法继续做减法时的终止条件；第三条处理输入为空子串的情况。例如，输入 11 时会得到如下产生式序列：

$$
*||||||||||| \rightarrow |*|||||| \rightarrow ||*| \xrightarrow{\bullet} ||*|
$$

它解释为商 2、余数 1。简单产生式能够产生复杂行为——可以证明 Markov 算法是图灵完备的。

### 2.3 认知架构：从算法到智能体

Allen Newell 为寻找一种能够刻画人类问题解决过程的形式系统，把产生式系统推广到 AI 社区（Newell, 1967；Newell and Simon, 1972）。产生式从字符串重写扩展为逻辑操作：可以依据智能体目标与世界状态检查的*前置条件*，以及前置条件满足时应执行的*动作*。在里程碑式著作 *Human Problem Solving*（Newell and Simon, 1972）中，Allen Newell 与 Herbert Simon 给出了一个实现恒温器智能体的简单产生式系统：

$$
\begin{aligned}
(\text{temperature} > 70^\circ)\wedge(\text{temperature} < 72^\circ)
    &\rightarrow \text{stop} \\
\text{temperature} < 32^\circ
    &\rightarrow \text{call for repairs; turn on electric heater} \\
(\text{temperature} < 70^\circ)\wedge(\text{furnace off})
    &\rightarrow \text{turn on furnace} \\
(\text{temperature} > 72^\circ)\wedge(\text{furnace on})
    &\rightarrow \text{turn off furnace}
\end{aligned}
$$

在这项工作之后，AI 社区采用了产生式系统。由此产生的智能体包含规模庞大的产生式系统，并同外部传感器、执行器和知识库相连——因此也需要相应复杂的控制流。AI 研究者定义了模仿人类认知的“认知架构”：显式实例化感知、记忆、规划等过程（Adams et al., 2012），以实现灵活、理性、实时的行为（Sun, 2004；Newell, 1980；1992；Anderson and Lebiere, 2003）。这催生了从心理建模到机器人学的各种应用，产生了数百种架构和数千篇论文（近期综述见 Kotseruba and Tsotsos, 2020）。

Soar 架构是一个典型例子（图 2A）。Soar 把产生式存入长期记忆，并根据产生式的前置条件与工作记忆的匹配程度来执行它们（图 2B）。这些产生式规定了修改工作记忆和长期记忆内容的动作。下面简要概述 Soar；更深入的介绍参见 Laird（2022；2019）。

**记忆。** Soar 建立在心理学理论之上，使用多种记忆跟踪智能体状态（Atkinson and Shiffrin, 1968）。*工作记忆*（Baddeley and Hitch, 1974）反映智能体当前的处境：它存储智能体最近的感知输入、目标以及内部中间推理的结果。*长期记忆*又分成三类。*程序性记忆*存储产生式系统本身，即可以应用于工作记忆、用来决定智能体行为的一组规则。*语义记忆*存储关于世界的事实（Lindes and Laird, 2016），*情景记忆*则存储智能体过去的行为序列（Nuxoll and Laird, 2007）。

![图 2：认知架构与 Soar 的决策过程](https://arxiv.org/html/2309.02427v3/x2.png)

**图 2：认知架构为产生式系统增加感知落地、长期记忆以及选择动作的决策过程。** **A：**Soar 架构，经 Laird（2022）许可转载。**B：**Soar 的决策过程使用产生式选择并实施动作。这些动作可以是*内部动作*（例如修改智能体记忆），也可以是*外部动作*（例如发出运动指令）。

**落地。** Soar 可以实例化在仿真环境（Tambe et al., 1995；Jones et al., 1999）或现实机器人系统（Laird et al., 2012）中。在具身场景下，各种传感器把感知输入持续送入工作记忆，使其可供决策使用。Soar 智能体还可以配备执行器，从而执行物理动作，并通过语言进行交互式学习（Mohan et al., 2012；Mohan and Laird, 2014；Kirk and Laird, 2014）。

**决策。** Soar 实现了一个决策循环：评估各个产生式，并应用匹配程度最高的一条（图 2B）。产生式存储在长期程序性记忆中。每个决策周期都会把它们的前置条件与智能体的工作记忆相对照。在*提出与评估*阶段，一组产生式负责生成可能动作的候选集合并进行排序。[^2] 随后选出最佳动作。[^3] 另一组产生式再负责实现该动作，例如修改工作记忆内容或发出运动指令。

**学习。** Soar 支持多种学习模式。首先，新信息可以直接存入长期记忆：事实可以写入语义记忆，经历可以写入情景记忆（Derbinsky et al., 2012）。需要决策时，这些信息可以重新检索到工作记忆。其次，行为也能够修改。强化学习（Sutton and Barto, 2018）可以提高曾经带来良好结果的产生式权重，让智能体从经验中学习（Nason and Laird, 2005）。最引人注目的是，Soar 还能够把新产生式写入程序性记忆（Laird et al., 1986）——相当于更新自己的源代码。

认知架构曾广泛用于心理学和计算机科学，应用包括机器人学（Laird et al., 2012）、军事仿真（Jones et al., 1999；Tambe et al., 1995）和智能辅导（Koedinger et al., 1997）。但过去几十年里，它在 AI 社区中的流行程度有所下降。这种变化反映了此类系统面临的两个挑战：它们仅限于能够用逻辑谓词描述的领域，而且需要预先规定大量规则才能运行。

有趣的是，LLM 看起来恰好适合应对这些挑战。第一，LLM 可以处理任意文本，比基于逻辑的系统更灵活。第二，它不要求用户指定产生式，而是通过在互联网语料上预训练来学习产生式的分布。研究者认识到这一点后，开始在认知架构中使用 LLM，利用其隐含世界知识（Wray et al., 2021）增强传统符号方法（Kirk et al., 2023；Romero et al., 2023）。本文采取另一条路线：引入认知架构的原则，以指导基于 LLM 的智能体设计。

### 2.4 语言模型与智能体

语言建模是 NLP 与 AI 社区持续了数十年的事业，目标是开发能够根据给定上下文生成文本的系统（Jurafsky, 2000）。形式化地说，语言模型学习分布 $P(w_i \mid w_{<i})$，其中每个 $w$ 都是一个独立 token（词）。随后，模型可以从该分布逐 token 采样来生成文本。从根本上看，语言模型是一个概率输入—输出系统，因为一段文本本来就可以有多种续写方式，例如：

$$
\text{“I went to the”} \rightarrow
\text{“market”}\mid\text{“beach”}\mid\ldots
$$

早期语言建模尝试（例如 n-gram）在泛化和规模化方面面临困难；近来，基于 Transformer（Vaswani et al., 2017）、拥有数十亿参数的 LLM（例如 GPT-4；OpenAI, 2023a）以及智能 tokenization 方案兴起，使这一领域重新繁荣。现代 LLM 用海量数据训练，从大量输入—输出组合中积累知识，并成功生成类似人类的文本（Andreas, 2022）。

出人意料的是，在互联网规模的文本上训练这些模型，还使它们能够完成许多超出文本生成的任务，例如编写代码（Li et al., 2022b；Rozière et al., 2023；Li et al., 2023c）、建模蛋白质（Meier et al., 2021），以及在交互环境中行动（Yao et al., 2022b；Nakano et al., 2021）。最后一项能力促成了“语言智能体”的兴起：这类系统以 LLM 为核心计算单元进行推理、规划和行动，应用覆盖机器人学（Ahn et al., 2022）、制造业（Xia et al., 2023）、网页操作（Yao et al., 2022a；Deng et al., 2023）、谜题求解（Yao et al., 2023；Hao et al., 2023）和交互式代码生成（Yang et al., 2023）。语言理解与决策能力的结合，是一个令人兴奋的新兴方向，有望让这些智能体更加接近类人智能。

[^2]: 更具体地说，Soar 把产生式分为两类：“operator”（本文称为动作）和“rule”（用于提出、评估并执行 operator）。
[^3]: 如果没有有效动作，或多个动作的得分并列，就会出现*僵局*（impasse）。Soar 会创建一个子目标来解决僵局，从而形成层级任务分解。更详细的讨论参见 Laird（2022）。

## 3 语言模型与产生式系统之间的联系

产生式系统与语言模型都源于对字符串的处理，因此二者之间存在天然的类比。下面先展开这个类比，再说明提示方法如何重现基于产生式系统的算法与智能体。产生式系统和语言模型之间的对应关系，促使我们使用认知架构来构建语言智能体；第 4 节将正式介绍这一框架。

### 3.1 把语言模型视为概率产生式系统

产生式系统最初的形式规定了从某个起点能够生成的字符串集合，并把这个过程分解成一系列字符串重写操作。语言模型也定义了对一个字符串——即提供给模型的提示——进行扩展或修改的可能集合。[^4]

例如，可以把补全文本的问题写成一条产生式。若 $X$ 是提示，$Y$ 是续写，则可写为：[^5]

$$
X \rightarrow X\,Y
$$

如果允许多种可能续写，就得到 $X \rightarrow X\,Y_i$，其中 $Y_i$ 来自某个候选集合。LLM 会给每个补全赋予一个*概率*。从这个角度看，面对输入 $X$ 时，LLM 定义的是“选择哪条产生式”的概率分布，也就是对可能补全的分布 $P(Y_i\mid X)$（Dohan et al., 2022）。因此，可以把 LLM 看成概率产生式系统：每次调用都会采样一个可能补全，例如：

$$
X \rightsquigarrow X\,Y
$$

同传统产生式系统相比，这种概率形式既有优势也有劣势。LLM 的主要劣势是固有的不透明性：产生式系统由离散且人类可读的规则定义，LLM 却由数十亿个无法解释的参数构成。这种不透明性再加上概率表述所固有的随机性，使其行为难以分析或控制（Romero et al., 2023；Valmeekam et al., 2022）。尽管如此，LLM 的规模和预训练仍然带来了传统产生式系统无法比拟的巨大优势。在大规模互联网数据上预训练的 LLM 学到了极其有效的字符串补全先验，使它无需专门训练就能解决广泛任务（Huang et al., 2022b）。

### 3.2 把提示工程视为控制流

在输入字符串（提示）的条件下，LLM 的权重定义了输出字符串（补全）的优先顺序。所得分布可以解释为面向特定任务的产生式优先顺序——换句话说，就是一种简单控制流。问答等任务可以直接表述为一个输入字符串（问题），从而得到补全（可能答案）的条件分布。

| 提示方法 | 产生式序列 |
| --- | --- |
| Zero-shot | $Q \rightsquigarrow_{\mathrm{LLM}} Q\,A$ |
| Few-shot | $Q \longrightarrow Q_1\,A_1\,Q_2\,A_2\,Q \rightsquigarrow_{\mathrm{LLM}} Q_1\,A_1\,Q_2\,A_2\,Q\,A$ |
| Retrieval-Augmented Generation | $Q \xrightarrow{\mathrm{Wiki}} Q\,O \rightsquigarrow_{\mathrm{LLM}} Q\,O\,A$ |
| Socratic Models | $Q \rightsquigarrow_{\mathrm{VLM}} Q\,O \rightsquigarrow_{\mathrm{LLM}} Q\,O\,A$ |
| Self-Critique | $Q \rightsquigarrow_{\mathrm{LLM}} Q\,A \rightsquigarrow_{\mathrm{LLM}} Q\,A\,C \rightsquigarrow_{\mathrm{LLM}} Q\,A\,C\,A$ |

**表 1：提示方法在生成补全之前如何操作输入字符串的概念图。** $Q$ 表示问题，$A$ 表示答案，$O$ 表示观察，$C$ 表示批评，$\rightsquigarrow$ 表示从随机产生式中采样。这些预处理操作可以使用视觉—语言模型（VLM）等其他模型，甚至可以使用 LLM 自身；它们本身也可被视为产生式。因此，提示方法定义的是一条*产生式序列*。

有关 few-shot 学习（Brown et al., 2020）和提示工程（Wei et al., 2022；Kojima et al., 2022；Xu et al., 2023）的早期工作发现，预处理输入字符串可以进一步使 LLM 偏向高质量产生式。这些简单操作通常只是把额外文本拼接到输入上，但它们本身也可以视为产生式，所以这些方法实际上定义了一条产生式序列（表 1）。后续工作把这种方法扩展到动态、上下文相关的提示，例如选择与输入最相关的 few-shot 样例（Liu et al., 2021），或用来自视频（Zeng et al., 2022）和数据库（Lewis et al., 2020）的外部观察填充模板。此类提示技术的综述见 Liu et al.（2023）。

随后的工作把 LLM 自身用作预处理步骤：先诱导有针对性的推理，让问题的某一方面凸显出来（Bai et al., 2022；Jin et al., 2022；Ganguli et al., 2023；Madaan et al., 2023；Saunders et al., 2022；Kim et al., 2023；Kirk et al., 2023），或在返回答案前生成中间推理步骤（Tafjord et al., 2021；Creswell et al., 2023；Yao et al., 2023）。把多次 LLM 调用*串联*起来（Wu et al., 2022a；Wu et al., 2022b；Dohan et al., 2022），就能形成越来越复杂的算法（图 3）。

![图 3：从语言模型到语言智能体](https://arxiv.org/html/2309.02427v3/x3.png)

**图 3：从语言模型到语言智能体。** **A：**一次 LLM 调用的基本结构。提示构造选择模板，并用工作记忆中的变量填充它。调用 LLM 后，字符串输出被解析为动作空间中的动作并执行。一次 LLM 调用可以产生一个或多个动作，例如返回答案、调用函数或发出运动指令。**B：***提示链*技术，例如 Self-Critique（Wang et al., 2022）或 Selection-Inference（Creswell et al., 2023），使用预先定义的 LLM 调用序列生成输出。**C：***语言智能体*，例如 Inner Monologue（Huang et al., 2022c）和 ReAct（Yao et al., 2022b），则使用与外部环境交互的反馈循环。视觉—语言模型（VLM）可以把感知数据翻译成文本，供 LLM 处理。

### 3.3 迈向认知型语言智能体

*语言智能体*不再局限于预定义提示链，而是把 LLM 放入与外部环境交互的反馈循环（图 1B）。这类方法首先把多模态输入转换成文本并传给 LLM，再解析 LLM 输出，用它决定一个外部动作（图 3C）。早期智能体让 LLM 直接连接外部环境，根据智能体状态生成高层指令（Ahn et al., 2022；Huang et al., 2022c；Dasgupta et al., 2022）。后来的工作开发出更复杂的语言智能体：先由 LLM 执行中间推理，再选择动作（Yao et al., 2022b）。最新智能体还加入了复杂学习策略，例如反思情景记忆以生成新的语义推断（Shinn et al., 2023），或修改程序代码以生成程序性知识（Wang et al., 2023a），从而利用过去经验调整未来行为。

这些*认知型*语言智能体采用并不简单的、基于 LLM 的推理与学习（图 1C）。认知架构过去用于组织产生式系统同智能体内部状态及外部环境之间的交互；同样地，我们认为它也能帮助设计基于 LLM 的认知智能体。本文余下部分将用这一视角组织现有方法，并指出有前景的扩展方向。

![图 4：语言智能体的认知架构 CoALA](https://arxiv.org/html/2309.02427v3/x4.png)

**图 4：语言智能体的认知架构（CoALA）。** **A：**CoALA 定义了一组彼此交互的模块与过程。**决策过程**执行智能体源代码；源代码包含与 LLM 交互（提示模板和解析器）、与内部记忆交互（检索和学习），以及同外部环境交互（落地）的过程。**B：**从时间维度看，智能体的决策过程在与外部环境的循环中执行一个个**决策周期**。每个周期里，智能体利用**检索**和**推理**进行规划，提出并评估候选**学习**动作或**落地**动作；随后选出并执行最佳动作。系统可能得到一个观察，然后新周期开始。

[^4]: 本文聚焦语言智能体通常使用的自回归 LLM。不过，BERT（Devlin et al., 2019）等双向 LLM 也可以用类似方式理解：它们定义了对*填空式*产生式的分布。
[^5]: 另一种方式是把提示视为输入，把 LLM 的输出视为下一状态，以产生式 $X \rightarrow Y$ 表示；这是更为字面的重写形式。

## 4 语言智能体的认知架构（CoALA）：概念框架

我们提出语言智能体的认知架构（CoALA），用它组织现有语言智能体，并指导新智能体的开发。CoALA 把 LLM 放在一个更大认知架构的核心位置（图 4）。在 CoALA 中，语言智能体把信息存入**记忆**模块（第 4.1 节），并在一个由外部部分和内部部分组成的动作空间中行动（图 5）：

- **外部动作**通过**落地**（第 4.2 节）与外部环境交互，例如控制机器人、与人交流或浏览网站。
- **内部动作**与内部记忆交互。根据访问哪种记忆，以及访问是读还是写，内部动作还可细分为三类：**检索**（从长期记忆读取；第 4.3 节）、**推理**（借助 LLM 更新短期工作记忆；第 4.4 节）和**学习**（写入长期记忆；第 4.5 节）。

语言智能体通过**决策**来选择动作；决策遵循反复执行的周期（第 4.6 节、图 4B）。每个周期中，智能体可以使用推理和检索动作进行规划。这个规划子过程选出一个落地动作或学习动作，再执行它，以影响外部世界或智能体的长期记忆。CoALA 的决策周期类似程序中持续循环运行的 `main` *过程*：它不断接受新的感知输入，并相应调用各种动作*过程*。这里所说的“过程”是没有返回值的方法，以区别于“函数”。

CoALA（图 4）受到数十年认知架构研究（第 2.3 节）的启发，利用了记忆、落地、学习和决策等关键概念。但引入 LLM 后，架构中增加了“推理”动作；它可以为不同目的灵活地产生新知识和启发式策略，从而取代传统认知架构中的手写规则。LLM 还使文本成为事实上的内部表示，简化了智能体的记忆模块。最后，视觉—语言模型（VLM；Alayrac et al., 2022）的近期进展能够直接把感知数据翻译成文本（Zeng et al., 2022），从而简化落地。

本节余下部分详细介绍 CoALA 的关键概念：记忆，动作（落地、推理、检索和学习），以及决策。对于每个概念，我们都会用现有语言智能体或相关 NLP/RL 方法举例；如果文献中存在空白，也会将其指出为未来方向。

### 4.1 记忆

语言模型是*无状态的*：它不会跨调用持久保存信息。与之相反，语言智能体可以在同世界进行多步交互时，在内部存储并维护信息。在 CoALA 框架下，语言智能体把信息明确组织到多个记忆*模块*中；信息主要是文本，但也允许其他模态，每个模块包含一种不同形式的信息。这些模块包括短期工作记忆，以及情景、语义和程序性三种长期记忆。

**工作记忆。** 工作记忆以符号变量的形式，为当前决策周期（第 4.6 节）维护活跃且随时可用的信息。其中包括感知输入、活跃知识（由推理生成或从长期记忆检索），以及从上一个决策周期延续下来的其他核心信息（例如智能体当前目标）。以往方法鼓励 LLM 生成中间推理（Wei et al., 2022；Nye et al., 2021），把 LLM 自身的上下文用作一种工作记忆。CoALA 对工作记忆的定义更一般：它是一种跨 LLM 调用持续存在的数据结构。每次调用 LLM 时，都从工作记忆的一个子集综合出输入，例如一个提示模板和相关变量。随后，LLM 输出会被解析回其他变量，例如动作名称和参数；这些变量存回工作记忆，并用于执行相应动作（图 3A）。除 LLM 外，工作记忆还与长期记忆和落地接口交互，因此它是连接语言智能体不同组件的中央枢纽。

![图 5：智能体的内部与外部动作空间](https://arxiv.org/html/2309.02427v3/x5.png)

**图 5：智能体的动作空间可以分为内部记忆访问与同世界的外部交互。** **推理**和**检索**动作被用来支持规划。

**情景记忆。** 情景记忆存储较早决策周期中的经历。它可以由训练输入—输出对（Rubin et al., 2021）、历史事件流（Weston et al., 2014；Park et al., 2023）、先前回合的游戏轨迹（Yao et al., 2020；Tuyls et al., 2022），或智能体经历的其他表示构成。在一个决策周期的规划阶段，这些情景可以检索进工作记忆以支持推理。智能体也可以把新经历从工作记忆写入情景记忆，以此作为一种学习（第 4.5 节）。

**语义记忆。** 语义记忆存储智能体关于世界和自身的知识。利用检索支持推理或决策的传统 NLP、RL 方法，会用外部数据库初始化语义记忆，以提供知识支持。例如，NLP 中的检索增强方法（Lewis et al., 2020；Borgeaud et al., 2022；Chen et al., 2017）可以看作从非结构化文本（例如 Wikipedia）构成的语义记忆中检索。在 RL 中，“通过阅读来学习”的方法（Branavan et al., 2012；Narasimhan et al., 2018；Wang et al., 2021；Zhong et al., 2021）把游戏手册和事实用作会影响策略的语义记忆。这些例子实质上都使用固定、只读的语义记忆；语言智能体则还可以把 LLM 推理得到的新知识写入语义记忆，作为一种学习（第 4.5 节），从经验出发逐步积累世界知识。

**程序性记忆。** 语言智能体包含两种形式的程序性记忆：存储在 LLM 权重中的*隐式*知识，以及写在智能体代码中的*显式*知识。智能体代码还可分成两类：一类过程实现动作，即推理、检索、落地和学习过程；另一类过程实现决策本身（第 4.6 节）。在决策周期中，可以通过推理动作访问 LLM，也可以检索并执行各种基于代码的过程。情景记忆或语义记忆在初始时可能为空，甚至完全不存在；程序性记忆则必须由设计者用合适代码初始化，才能启动智能体。最后，虽然向程序性记忆写入内容以学习新动作是可能的（第 4.5 节），但这样做比写入情景或语义记忆危险得多，因为它很容易引入 bug，或让智能体颠覆设计者的意图。

### 4.2 落地动作

落地过程执行外部动作，并把环境反馈处理成文本后写入工作记忆。这样一来，智能体同外部世界的交互实际上被简化为一个拥有文本观察和文本动作的“文字游戏”。我们把外部环境分成三类。

**物理环境。** 物理具身是人们最早为 AI 智能体设想的实例（Nilsson, 1984）。它需要把感知输入（视觉、听觉、触觉）处理为文本观察，例如借助预训练描述模型；还需要通过接受语言指令的机器人规划器影响物理环境。LLM 的近期进展催生了许多机器人项目（Ahn et al., 2022；Liang et al., 2023；Singh et al., 2023；Palo et al., 2023；Ren et al., 2023），它们把 LLM 用作机器人的“大脑”，在物理世界中生成动作或计划。对于感知输入，通常使用视觉—语言模型把图像转换成文本（Alayrac et al., 2022；Sumers et al., 2023），为 LLM 提供额外上下文（Driess et al., 2023；Huang et al., 2023；Brohan et al., 2022；Brohan et al., 2023）。

**与人或其他智能体对话。** 经典语言交互允许智能体接受指令（Winograd, 1972；Tellex et al., 2011；Chen and Mooney, 2011；Bisk et al., 2016）或向人学习（Nguyen et al., 2021；Sumers et al., 2022；Sumers et al., 2021；Wang et al., 2016）。能够*生成*语言的智能体可以请求帮助（Ren et al., 2023；Nguyen and Daumé III, 2022；Nguyen et al., 2019a；Nguyen et al., 2019b）或澄清（Biyik et al., 2019；Sadigh et al., 2017；Padmakumar et al., 2022；Thomason et al., 2020；Narayan-Chen et al., 2019），也可以娱乐人或提供情感帮助（Zhang et al., 2020；Zhou et al., 2018；Pataranutaporn et al., 2021；Hasan et al., 2023；Ma et al., 2023）。近期工作还研究多个语言智能体之间的交互，用于社会模拟（Park et al., 2023；Jinxin et al., 2023；Gao et al., 2023）、辩论（Chan et al., 2023；Liang et al., 2023；Du et al., 2023）、提高安全性（Irving et al., 2018），或协作解决任务（Qian et al., 2023；Wu et al., 2023；Hong et al., 2023；Dong et al., 2023）。

**数字环境。** 这包括同游戏（Hausknecht et al., 2020；Côté et al., 2019；Shridhar et al., 2020；Wang et al., 2022；Liu et al., 2023）、API（Schick et al., 2023；Yao et al., 2022b；Parisi et al., 2022；Tang et al., 2023）、网站（Shi et al., 2017；Nakano et al., 2021；Yao et al., 2022a；Zhou et al., 2023；Gur et al., 2023；Deng et al., 2023）交互，以及一般代码执行（Yang et al., 2023；Le et al., 2022；Ni et al., 2023）。数字落地比同物理环境或人交互更便宜、更快速，因此是研究语言智能体的便利试验场，近年来受到越来越多关注。尤其对于需要外部知识或计算增强的 NLP 任务，无状态数字 API——例如搜索、计算器和翻译器——常被打包成“**工具**”（Parisi et al., 2022；Schick et al., 2023；Xu et al., 2023；Tang et al., 2023；Qin et al., 2023）；它们可以被视为特殊的“一次性”数字环境。

### 4.3 检索动作

在 CoALA 中，检索过程（Li et al., 2022；Gu et al., 2018）把信息从长期记忆读入工作记忆。依据信息和记忆类型，它可以用规则检索、稀疏检索或稠密检索等不同方式实现。例如，Voyager（Wang et al., 2023a）通过稠密检索从技能库加载基于代码的技能，以便同 Minecraft 世界交互——实际上是在从程序性记忆检索落地过程。Generative Agents（Park et al., 2023）通过综合新近程度（基于规则）、重要程度（基于推理）和相关程度（基于嵌入）的分数，从情景记忆中检索相关事件。DocPrompting（Zhou et al., 2022）提出利用库文档辅助代码生成，这可以看作从语义记忆检索知识。尽管检索在人类决策中发挥关键作用（Zhou et al., 2023；Zhao et al., 2022），自适应且与上下文相关的回忆在语言智能体中仍研究不足。第 6 节会把决策与检索的原则性整合列为重要未来方向。

### 4.4 推理动作

推理让语言智能体能够处理工作记忆内容并生成新信息。检索从长期记忆读取并写入工作记忆；与之不同，推理既从工作记忆*读取*，也向工作记忆写入。智能体因而能够总结并提炼最近一次观察（Yao et al., 2022b；Peng et al., 2023）、最近一条轨迹（Shinn et al., 2023），或从长期记忆检索到的信息（Park et al., 2023）中的见解。推理可以支持学习——把结果写入长期记忆；也可以支持决策——把结果用作后续 LLM 调用的额外上下文。

### 4.5 学习动作

学习通过向长期记忆写入信息来发生，其中包含一系列多样的过程。

**用经历更新情景记忆。** RL 智能体通常会存储情景轨迹，用它更新参数化策略（Blundell et al., 2016；Pritzel et al., 2017）或建立非参数策略（Ecoffet et al., 2019；Tuyls et al., 2022）。对于语言智能体，情景记忆中新加入的经历，日后可以作为样例或推理与决策的依据被检索（Weston et al., 2014；Rubin et al., 2021；Park et al., 2023）。

**用知识更新语义记忆。** 近期工作（Shinn et al., 2023；Park et al., 2023）使用 LLM 对原始经历进行推理，并把所得推断存入语义记忆。例如，Reflexion（Shinn et al., 2023）让 LLM 反思失败回合，并把结果——例如“厨房里没有洗碗机”——存为语义知识；解决后续回合时，再把它附加到 LLM 上下文。机器人学工作（Chen et al., 2023）还用视觉—语言模型构建环境的语义地图，日后可以查询该地图以执行指令。

**更新 LLM 参数（程序性记忆）。** LLM 权重代表隐式程序性知识；在智能体生命周期内，可以通过微调让这些权重适应智能体所在领域。微调可以采用监督学习（Liu et al., 2023；Zhang et al., 2023）、模仿学习（Hussein et al., 2017）、来自环境反馈的强化学习（Sutton and Barto, 2018）、人类反馈强化学习（RLHF；Christiano et al., 2017；Ouyang et al., 2022；Nakano et al., 2021），或 AI 反馈（Bai et al., 2022；Liu et al., 2023）。经典 LLM 自我改进方法（Huang et al., 2022；Zelikman et al., 2022）使用一致性等外部度量（Wang et al., 2022）筛选用于微调的生成内容。在强化学习环境中，这还可以扩展为使用环境反馈：例如 XTX（Tuyls et al., 2022）会定期在情景记忆所保存的高分轨迹上微调一个小语言模型；面对随机性时，该模型成为能够可靠抵达探索边界的“利用”策略。微调智能体的 LLM 是一种代价很高的学习形式，因此现有研究会规定学习日程。不过，随着训练效率提高，或者智能体开始使用更小、针对特定子任务的 LLM，语言智能体或许可以自主决定何时以及如何微调自己的 LLM。

**更新智能体代码（程序性记忆）。** CoALA 允许智能体更新自身源代码，从而修改各种过程的实现。可进一步分为：

- **更新推理**，例如提示模板（Gao et al., 2020；Zhou et al., 2022）。例如，APE（Zhou et al., 2022）从输入—输出样例推断提示指令，再把这些指令作为 LLM 提示的一部分来辅助任务求解。这样的提示更新可以看作一种“学习如何推理”。
- **更新落地**，例如基于代码的技能（Liang et al., 2023；Ellis et al., 2021；Wang et al., 2023a）。例如，Voyager（Wang et al., 2023a）维护一个课程库。值得注意的是，当前方法仅限于创建用于同外部环境交互的新代码技能。
- **更新检索。** 据我们所知，近期语言智能体尚未研究这些学习选项。检索通常被视为一种以固定实现设计的基本动作，例如 BM25 或稠密检索；不过，查询/文档扩展（Nogueira et al., 2019；Wang et al., 2023；Tang et al., 2023）或检索蒸馏（Izacard and Grave, 2021）领域的研究，可能有助于语言智能体学习更好的检索过程。
- **更新学习或决策。** 理论上，CoALA 智能体可以学习新的学习过程或决策过程，从而获得极强的适应性。但总体而言，更新这些过程会同时威胁智能体的功能正确性与对齐。目前，我们尚不了解实现了这种学习形式的语言智能体；第 6 节将进一步讨论其可能性。

RL 智能体通常固定一种学习方式，例如 Q-learning、PPO 或 A3C，再通过更新模型参数来学习；语言智能体则可以从多种学习过程中作出选择。这使它能够通过存储同任务相关的语言快速学习——其代价更低、速度也快于参数更新——并利用多种学习形式叠加自我改进，例如第 5 节讨论的 Generative Agents。

最后，前面的讨论主要聚焦于向记忆中**添加**内容；而**修改**与**删除**——后者可视为一种“反学习”（unlearning）——在近期语言智能体研究中仍未得到充分探索。第 6 节会进一步讨论这些领域。

### 4.6 决策

动作空间中存在落地、学习、推理和检索等不同动作时，语言智能体应当怎样选择要应用的动作？这个问题由决策过程处理；决策过程实际上就是智能体最顶层的 `main` 程序。CoALA 把顶层程序组织为一个个决策周期（图 4B），每个周期产生一个外部*落地*动作（第 4.2 节）或内部*学习*动作（第 4.5 节）。每个周期里，程序代码规定一系列推理与检索动作，用于提出并评估备选方案（**规划阶段**），然后执行选定动作（**执行阶段**），再重新进入循环。

**规划阶段。** 在规划期间，可以灵活运用推理与检索来提出、评估和选择动作；这些子阶段还可以交错或迭代，在采取外部动作前逐步形成多步模拟（Tamari et al., 2020；Yao et al., 2023；Hao et al., 2023）。智能体也可以反复改进候选解，例如用 LLM 模拟候选解、找出缺陷，再提出能够修复缺陷的修改（Kirk et al., 2023；Shinn et al., 2023）。

- **提出。** 提出子阶段生成一个或多个候选动作。通常做法是用**推理**（也可以加上检索）从 LLM 采样一个（Huang et al., 2022c）或多个（Chen et al., 2021；Wang et al., 2022）外部落地动作。对于动作有限的简单领域，提出阶段也可以直接包含所有动作，例如第 5 节的 SayCan。更复杂的智能体使用 `if-else` 或 `while-if` 代码结构（Wang et al., 2023a；Park et al., 2023）；部署在定义明确的领域中的智能体，则可以利用结构化模拟器（Haslum et al., 2019）生成合理的 rollout（Liu et al., 2023；Dagan et al., 2023）。
- **评估。** 如果提出了多个动作，评估子阶段会为每个动作赋值。赋值可以使用启发式规则、LLM（困惑度）值（Ahn et al., 2022）、学习得到的值（Yao et al., 2020）、LLM 推理（Yao et al., 2023；Hao et al., 2023），或它们的组合。特别是，LLM 推理可以在内部模拟动作从外部世界得到的落地反馈，从而帮助评估动作（Hao et al., 2023；Yang et al., 2023）。
- **选择。** 给定一组动作及其值，选择步骤要么选出一个动作执行，要么拒绝这些动作并回到提出步骤。根据动作值的形式，可以通过 `argmax`、`softmax` 或多数投票等其他方式完成选择（Wang et al., 2022）。

**执行。** 通过执行智能体源代码中的相应过程，应用选定动作。根据智能体实现，这可以是外部*落地*动作，例如 API 调用（第 4.2 节）；也可以是内部*学习*动作，例如写入情景记忆（第 4.5 节）。智能体可以从环境获得观察，作为动作反馈，然后再次进入循环。

从实证上看，许多早期语言智能体只是用 LLM 提出单个动作（Schick et al., 2023）、一系列动作（Huang et al., 2022b），或评估一组固定动作（Ahn et al., 2022），没有中间推理或检索。后续工作（Yao et al., 2022b；Shinn et al., 2023；Xu et al., 2023；Lin et al., 2023；Wang et al., 2023a；Park et al., 2023）利用中间推理和检索分析情境、制定并维护动作计划、根据环境反馈完善先前动作，并采用更复杂的过程来提出一个动作。最新研究开始探索采用迭代提出和评估来考虑多个动作的复杂决策。这些过程以经典规划算法为原型：例如 Tree of Thoughts（Yao et al., 2023）和 RAP（Hao et al., 2023）分别使用 LLM 实现 BFS/DFS 与蒙特卡洛树搜索（MCTS；Browne et al., 2012）。LLM 既用于生成候选——也就是模拟以某个动作为条件的 rollout——也用于评估候选——也就是为候选动作的结果赋值。

## 5 案例研究

通过改变或消融记忆模块、动作空间与决策过程，CoALA 可以表达非常广泛的语言智能体。表 2 列出了一些来自不同领域的热门近期方法——从 Minecraft 到机器人学，从纯推理到社会模拟。CoALA 能够用一种简单而结构化的方式刻画它们的内部机制，并揭示其异同。

**SayCan**（Ahn et al., 2022）把语言模型落地到厨房中的机器人交互，以满足用户命令，例如“我刚锻炼完，你能给我拿一杯饮料和一份零食来恢复体力吗？”它的长期记忆只有程序性记忆，也就是一个 LLM 和一个学习得到的价值函数。其动作空间只有外部动作——551 个固定落地技能，例如“找到苹果”“走到桌边”；没有推理、检索或学习等内部动作。决策时，SayCan 结合 LLM 值与学习得到的值评估每个动作，在技能的有用性与落地可行性之间取得平衡。因此，SayCan 把 LLM 和学习得到的价值函数结合起来，作为一个单步规划器。

| 智能体 | 长期记忆[^6] | 外部落地 | 内部动作 | 决策方式 |
| --- | --- | --- | --- | --- |
| SayCan（Ahn et al., 2022） | — | 物理 | — | 评估 |
| ReAct（Yao et al., 2022b） | — | 数字 | 推理 | 提出 |
| Voyager（Wang et al., 2023a） | 程序性 | 数字 | 推理／检索／学习 | 提出 |
| Generative Agents（Park et al., 2023） | 情景／语义 | 数字／智能体 | 推理／检索／学习 | 提出 |
| Tree of Thoughts（Yao et al., 2023） | — | 数字[^7] | 推理 | 提出、评估、选择 |

**表 2：把部分近期语言智能体映射到 CoALA 框架中。**

**ReAct**（Yao et al., 2022b）是一种落地到多个数字环境的语言智能体，例如 Wikipedia API、文字游戏和网站。与 SayCan 一样，它没有语义记忆或情景记忆，因而没有检索或学习动作。它的动作空间由内部推理和外部落地组成。它的决策周期固定先用一个推理动作分析情境并制定或重新制定动作计划，然后生成一个落地动作，不经过评估或选择阶段。ReAct 可以视为同时利用内部和外部动作的最简单语言智能体，也是最先证明二者具有协同作用的工作：推理帮助指导行动，行动则提供环境反馈来支持推理。

**Voyager**（Wang et al., 2023a）是一种落地到 Minecraft API 的语言智能体。SayCan 通过学习得到的价值函数落地到感知；与它不同，Voyager 的落地完全基于文本。Voyager 拥有长期程序性记忆，用来存储由代码实现的落地过程库，也就是技能，例如 `combatZombie` 和 `craftStoneSword`。技能库具有层级结构：复杂技能可以把简单技能用作子过程，例如背包里没有剑时，`combatZombie` 可以调用 `craftStoneSword`。最令人印象深刻的是，它的动作空间包含全部四类动作：落地、推理、检索和学习；学习通过添加新的落地过程来实现。

在一个决策周期中，如果工作记忆里还没有任务目标，Voyager 会先通过推理提出一个新目标，再通过推理提出一个用于解决任务的代码式落地过程。下一个决策周期里，Voyager 对环境反馈进行推理，以判断任务是否完成。成功时，它选择一个学习动作，把落地过程加入程序性记忆；失败时，则用推理改进代码并重新执行。通过与 ReAct、AutoGPT 等基线以及移除程序性记忆的消融版本比较，论文从实证上验证了长期记忆与程序性学习的重要性。结果表明，Voyager 能够探索更多区域、掌握科技树，并以 zero-shot 方式泛化到未见任务。

**Generative Agents**（Park et al., 2023）是落地到沙盒游戏中的语言智能体，能够同环境和其他智能体交互。其动作空间同样包含全部四类动作：落地、推理、检索和学习。每个智能体都拥有长期情景记忆，把事件存储在列表中。智能体运用检索与推理反思自己的情景记忆，例如形成“我现在喜欢滑雪”这样的结论，再把反思写入长期语义记忆。决策时，智能体从语义记忆检索相关反思，然后通过推理制定当天的高层计划。在执行计划的过程中，它持续接收落地观察，并可以据此推理以维持或调整计划。

**Tree of Thoughts（ToT）**（Yao et al., 2023）可以视为一种特殊语言智能体，只有一个外部动作：提交某个推理问题的最终答案，例如 24 点游戏、创意写作和填字游戏。它没有长期记忆，内部动作空间中也只有推理，但其深思熟虑的决策方式使它区别于前述所有智能体。在规划期间，ToT 基于 LLM 推理迭代地提出、评估并选择“思维”（推理动作），再通过树搜索算法维护这些思维，从而实现全局探索、局部回溯和前瞻。

[^6]: 所有智能体都包含某种程序性记忆，即智能体代码与 LLM 权重。因此，表中只列出可写的程序性记忆。
[^7]: 这是一种特殊数字落地，唯一外部动作是提交最终答案。

## 6 可执行见解

与近期围绕语言智能体的一些实证综述（Mialon et al., 2023；Weng, 2023；Wang et al., 2023b）相比，CoALA 提供了一个植根于成熟认知架构研究的理论框架。由此产生了一组独特且互补的可执行见解。

**模块化智能体：超越单体进行思考。** 或许最重要的建议是：*智能体应当结构化、模块化*。从实践看，正如标准化软件被不同机器人平台共同采用（Quigley et al., 2009；Macenski et al., 2022），语言智能体框架也能汇集技术投入并提高兼容性。

- **在学术研究中，**标准术语使不同工作之间的概念比较成为可能（表 2）；开源实现还会进一步促进模块的即插即用与复用。例如，马尔可夫决策过程的理论框架（Puterman, 2014）为强化学习（Sutton and Barto, 2018）提供了标准概念与术语，例如状态、动作、奖励和转移。与之对应，OpenAI Gym（Brockman et al., 2016）等实证框架提供了标准抽象，例如 `obs, reward, done, info = env.step(action)`，促进了 RL 实证研究。因此，现在正适合为语言智能体实现实用抽象，例如 `Memory`、`Action` 和 `Agent` 类；还可以把较简单的智能体映射到这样一个实证 CoALA 框架中，作为构建更复杂智能体的示例，这会产生重要影响。
- **在行业应用中，**维护一个全公司共用的“语言智能体库”，能够促进不同智能体部署之间的测试和组件复用，从而减少技术债（Sculley et al., 2014；Lwakatare et al., 2020）。它还可以统一客户体验：最终用户不再面对各个团队分别开发的一堆杂乱语言智能体，而是体验同一个基础智能体在特定上下文中的实例。
- **智能体设计中的 LLM 与代码。** CoALA 智能体拥有两种程序性记忆：智能体代码（确定性规则）和 LLM 参数（规模庞大的随机产生式系统）。智能体代码可以解释、可以扩展，但在面对随机性时往往脆弱，而且只能处理设计者预见到的情形。LLM 参数则难以解释，却能在新上下文中提供显著的 zero-shot 灵活性（Huang et al., 2022b）。因此，CoALA 建议谨慎使用代码，只用它实现能够弥补 LLM 局限的通用算法，例如实现树搜索以缓解自回归生成导致的短视（Yao et al., 2023；Hao et al., 2023）。

**智能体设计：超越简单推理进行思考。** CoALA 通过三个彼此不同的概念定义智能体：（i）内部记忆；（ii）一组可能的内部和外部动作；（iii）在这些动作上运行的决策过程。用 CoALA 开发面向具体应用的智能体，就是依次为每个组件规定实现。下面假设智能体的环境和外部动作空间已经给定，说明如何借助 CoALA 确定合适的高层架构。例如，可以设想设计一个个性化零售助手（Yao et al., 2022a），根据用户查询和购买历史帮助其寻找相关商品。在这种情况下，外部动作包括对话或向用户返回搜索结果。

- **确定需要哪些记忆模块。** 在零售助手示例中，智能体最好拥有包含在售商品集合的语义记忆，以及记录每位客户过往购买和交互的情景记忆。它还需要程序性记忆来定义查询这些数据存储的函数，也需要工作记忆来跟踪对话状态。
- **定义智能体的内部动作空间。** 这主要是为每个记忆模块定义读写访问权限。在示例中，智能体应当对情景记忆具有读写权限，以存储同客户的新交互；但对语义记忆和程序性记忆只有读取权限，因为它不应更新库存或自己的代码。
- **定义决策过程。** 这一步规定如何执行推理和检索动作，以选出外部动作或学习动作。总体而言，它需要在性能与泛化之间权衡：更复杂的过程可以更贴合特定问题，例如面向 Minecraft 的 Voyager（Wang et al., 2023a）；较简单的过程则更独立于领域，泛化性更强，例如 ReAct（Yao et al., 2022b）。对于零售助手，可以鼓励它检索与某位用户交互的情景记忆，以形成对用户搜索意图的先验；还可以设置明确评估步骤，推理某组搜索结果能否满足该意图。把学习推迟到交互结束时（Shinn et al., 2023；Park et al., 2023），在存入情景记忆之前先总结本次交互，就能简化决策过程。

**结构化推理：超越提示工程进行思考。** 早期提示工程通过底层字符串操作来操纵 LLM 输入和输出。CoALA 则建议采用更结构化的推理过程来更新工作记忆变量。

- LangChain（Chase, 2022）和 LlamaIndex（Liu, 2022）等**提示框架**可用于定义更高层的推理步骤序列，降低每次 LLM 调用所承担的推理负担以及底层提示编写工作。Guidance（Microsoft, 2023）和 OpenAI function calling（OpenAI, 2023b）等**结构化输出解析方案**可以帮助更新工作记忆变量。定义并构建良好的工作记忆模块，也将成为重要的未来研究方向。这类模块对于行业方案尤其重要，因为其中的 LLM 推理必须无缝集成到大规模代码基础设施。
- **智能体中的推理用例可以反过来影响并重塑 LLM 训练，**包括训练样例的类型——例如用于自我评估、反思、动作生成等的推理——以及格式，例如 CoT（Wei et al., 2022）、ReAct（Yao et al., 2022b）和 Reflexion（Shinn et al., 2023）。默认情况下，现有 LLM 面向 NLP 任务训练和优化；智能体应用却探索出了 LLM 推理的新模式，例如自我评估，并证明这些模式普遍有用。针对这些能力进行训练或微调的 LLM，更有可能成为未来智能体的骨干。

**长期记忆：超越检索增强进行思考。** 传统检索增强语言模型（Guu et al., 2020；Lewis et al., 2020；Borgeaud et al., 2022）只能读取人类编写的语料；记忆增强语言智能体则既可以读取，也可以自主写入自己生成的内容。这为高效终身学习打开了许多可能性。

- **把现有人类知识同新经历和新技能结合，**可以帮助智能体获得良好起点并高效学习。例如，可以为代码编写智能体赋予手册或教科书形式的语义编程知识。它随后可以从自己的经历生成情景知识；反思这些经历，生成新的语义知识；再逐步以代码库的形式创建程序性知识，在其中存储有用方法。
- **整合检索与推理**能够让规划更好地落地。近期计算心理模型指出，记忆回想与决策是一个整合过程（Zhou et al., 2023；Zhao et al., 2022）；这表明，把记忆搜索与向前模拟交错起来的自适应机制，可以让智能体充分利用自身知识。

**学习：超越上下文学习或微调进行思考。** CoALA 对“学习”的定义包含这些方法，但范围更广，还包括存储新经历或新知识，以及编写新的智能体代码（第 4.5 节）。重要未来方向包括：

- **通过修改智能体代码进行元学习，**让智能体可以更有效地学习。例如，学到更好的检索过程，可以使智能体更充分地利用自身经历。近期基于扩展的技术（Nogueira et al., 2019；Wang et al., 2023；Tang et al., 2023）可以让智能体推理某项知识何时有用，并把结果存为元数据，以方便日后回忆。这些元学习形式使智能体能够超越人类编写的代码，但因难度和风险而研究不足。
- **新的学习形式（以及反学习）**可以包括：为特定推理子任务微调较小模型（Zelikman et al., 2022；Huang et al., 2022；Ahn et al., 2022）；删除不需要的记忆条目以实现“反学习”（Nguyen et al., 2022）；以及研究多种学习形式之间的交互效应（Tuyls et al., 2022；Park et al., 2023；Xie et al., 2023；Khattab et al., 2022）。

**动作空间：超越外部工具或动作进行思考。** “动作空间”在强化学习中是标准术语，但在语言智能体研究里很少使用。CoALA 主张定义一个清晰且适合任务的动作空间，同时包含内部动作（推理、检索、学习）和外部动作（落地），从而让智能体设计更系统、更有依据。

- **动作空间的大小。** 能力更强的智能体，例如 Voyager 和 Generative Agents，拥有更大的动作空间；这又意味着它们面对更加复杂的决策问题。因此，这些智能体依赖更定制化或更多手工设计的决策过程。动作空间复杂度与决策复杂度之间的权衡，是开发智能体前应当考虑的基本问题；最好选用解决给定任务所必需的最小动作空间。
- **动作空间的安全性。** 动作空间的某些部分天然更危险。“学习”动作，特别是程序性删除和修改，可能造成内部伤害；“落地”动作，例如在 Bash 终端执行 `rm`、在人类对话中发表有害言论、在物理环境中持刀，则可能造成外部伤害。今天的安全措施通常是针对任务的启发式方案，例如移除 Python 中的 `os` 操作（Chen et al., 2021）、过滤对话关键词（Chowdhery et al., 2022；Driess et al., 2023），或把机器人限制在受控环境（Ahn et al., 2022）。不过，当智能体落地到更复杂环境并拥有更丰富内部机制时，可能需要明确规定并消融智能体动作空间，以预测并防范最坏情形（Yao and Narasimhan, 2023）。

**决策：超越动作生成进行思考。** 我们认为，决策是语言智能体最令人兴奋的未来方向之一。正如第 4.6 节所详述的，大多数工作仍局限于提出——或直接生成——单个动作。现有智能体对于更加审慎的“提出—评估—选择”式决策过程，只触及了表面。

- **结合基于语言的推理与基于代码的规划，**可能兼得二者优势。现有方法要么直接用自然语言规划（Huang et al., 2022c；Ahn et al., 2022），要么使用 LLM 把自然语言转换成结构化世界模型（Wong et al., 2023；Liu et al., 2023；Zhang et al., 2023；Li et al., 2023；Guan et al., 2023；Silver et al., 2022；Silver et al., 2023）。未来工作可以整合二者：正如 Soar 纳入一个用于物理推理的模拟器（Laird, 2022），智能体也可以即时编写并执行模拟代码，以评估计划后果。更多讨论见第 7 节。
- **把审慎推理扩展到现实环境。** 初步工作已经实现经典规划和树搜索（Yao et al., 2023；Hao et al., 2023；Liu et al., 2023；Dagan et al., 2023），使用的却是 24 点游戏或积木搭建等玩具任务。把这些方案扩展到包含落地（Qin et al., 2023）和长期记忆的更复杂任务，是一个令人兴奋的方向。
- **用元推理提高效率。** LLM 调用既慢又消耗大量计算资源。用 LLM 决策，需要在计算成本与改进后计划的效用之间取得平衡。大多数 LLM 推理方法通过规定推理深度来固定搜索预算（Yao et al., 2023），但人类似乎会自适应地分配计算（Russek et al., 2022；Lieder and Griffiths, 2020；Callaway et al., 2022；Gershman et al., 2015）。未来工作应开发估计规划效用的机制（Laidlaw et al., 2023），并相应修改决策过程。可用方法包括：摊销，也就是根据先前动作的结果微调 LLM，例如 Nguyen et al.（2023）和 Hamrick et al.（2019）；在多个决策子过程之间路由，例如 ReAct（Yao et al., 2022b）研究了退回 CoT（Wei et al., 2022）以及从 CoT 退回 ReAct；或者直接更新决策过程。
- **校准与对齐。** 更复杂的决策目前受到若干问题的限制，包括过度自信与校准不良（Jiang et al., 2021；Braverman et al., 2020；Chen et al., 2022）、同人类价值观不一致或存在偏见（Liang et al., 2021；Feng et al., 2023）、自我评估中的幻觉（Shinn et al., 2023），以及面对不确定性时缺少人在回路机制（Nguyen et al., 2022；Ren et al., 2023）。解决这些问题，将显著提高 LLM 作为智能体骨干的效用。

## 7 讨论

除了前文给出的实践见解，CoALA 还提出了一些开放的概念问题。下面简要强调其中最有意思的问题，把它们作为未来研究与讨论的重要方向。

**LLM 与 VLM：推理应当只使用语言，还是采用多模态？** 大多数语言智能体使用纯语言模型进行决策（Yao et al., 2022b；Wang et al., 2023a；Yao et al., 2023），必要时再用单独的描述模型把环境观察转换成文本（Ahn et al., 2022；Zeng et al., 2022）。然而，最新一代语言模型已经是多模态的，允许图像和文本输入交错出现（OpenAI, 2023a；Alayrac et al., 2022；Gemini Team, 2023；Li et al., 2023）。基于此类多模态模型构建的语言智能体，可以直接对图像和文本输入共同推理（Bavishi et al., 2023a；Bavishi et al., 2023b；Liu et al., 2023；Hong et al., 2023；Driess et al., 2023），从而接收感知数据并直接产生动作。这样绕开了有损的图像到文本转换，但也把推理和规划过程紧密绑定到模型的输入模态。

从高层看，两种方法可以理解为两种不同的 tokenization 方案，用于把非语言模态转换进核心推理模型的语言领域。模块化方法使用单独的图像到文本模型，把感知数据转换成语言（Ahn et al., 2022；Zeng et al., 2022）；集成方法则把图像直接投影到语言模型的表示空间（Bavishi et al., 2023a；Bavishi et al., 2023b；Liu et al., 2023）。集成式多模态推理或许能够产生更类似人类的行为：基于 VLM 的智能体能够“看到”网页，而基于 LLM 的智能体更可能接收原始 HTML。不过，把智能体的感知系统和推理系统耦合起来，会使它更加依赖特定领域，也更难更新。无论采用哪种方式，CoALA 所描述的基本架构原则——内部记忆、结构化动作空间与通用决策——都能用于指导智能体设计。

**内部与外部：智能体同环境的边界在哪里？** 人或机器人同自己的具身环境显然彼此分离，数字语言智能体的边界却没有这么清楚。例如，Wikipedia 数据库究竟是内部语义记忆，还是外部数字环境（Yao et al., 2022b）？如果一个智能体在提交答案前反复执行并改进代码（Shinn et al., 2023；Yang et al., 2023），代码执行属于内部还是外部？如果一种方法由“提出”提示和“评估”提示组成（Yao et al., 2023），应把它看成一个智能体，还是两个协作的简单智能体——提出者与评估者？

我们建议用*可控性*和*耦合程度*来回答边界问题。例如，Wikipedia 并不*可控*：它是外部环境，可能被其他用户出乎意料地修改。但如果一个离线版本只有该智能体可以写入，它就是可控的，因而可以视为内部记忆。同样，在内部虚拟环境中执行代码，应视为内部推理动作；在可能存在安全漏洞的外部机器上执行代码，则应视为外部落地动作。最后，如果智能体的不同部分——例如提出提示和评估提示——彼此依赖并且专门为对方设计，它们就是*紧耦合*的，最适合视为单个智能体中的组件。相反，如果各步骤可以独立发挥作用，多智能体视角或许更合适。

这些两难问题主要是概念性的，但理解它们可以支持智能体设计，也能帮助整个领域形成共同术语。实践者也可以直接选择自己偏好的表述，只要它在自己的工作中保持一致并确实有用。

**物理与数字：哪些差异值得关注？** 动物在物理世界中只有一次生命，数字环境——例如互联网——却往往允许串行试验（通过重置）和平行试验。这意味着数字智能体可以更大胆地探索，例如打开一百万个网页；也可以复制自己并行解决任务，例如让一百万个网页智能体尝试不同路径。由此产生的决策过程，可能不同于当下那些受人类认知启发的过程（Griffiths, 2020）。

**学习与行动：智能体应当如何持续、自主地学习？** 在 CoALA 框架中，学习与落地一样，是一个决策周期产生的动作：智能体有意决定把信息提交到长期记忆。大多数智能体则不同，它们只是固定一个学习日程，只对外部动作进行决策。然而，生物智能体并没有这种奢侈条件：它们必须在一生中权衡学习和外部行动，选择何时学习、学习什么（Mattar and Daw, 2018）。更灵活的语言智能体（Wang et al., 2023a；Park et al., 2023）会采用类似设计，把学习与外部动作同等对待。在常规决策期间，可以把学习作为候选动作提出，让智能体把它“推迟”到合适时机再执行。

**GPT-4 与 GPT-N：更强的 LLM 会怎样改变智能体设计？** 随着规模增长带来新的 LLM 能力（Wei et al., 2022），智能体设计是一个不断移动的目标。例如，GPT-2（Radford et al., 2019）等早期语言模型无法支撑 LLM 智能体——当时的工作确实需要把 GPT-2 与强化学习结合起来生成动作（Yao et al., 2020）；GPT-3（Brown et al., 2020）为 NLP 任务开启了灵活的 few-shot 与 zero-shot 推理；直到 GPT-4（OpenAI, 2023a），模型才开始具备更可靠的自我评估（Saunders et al., 2022；Shinn et al., 2023；Yao et al., 2023）和自我改进（Madaan et al., 2023；Chen et al., 2023）能力。

未来的 LLM 是否会进一步减少对代码规则和额外学习模型的需求？这是否要求修改 CoALA 框架？作为思想实验，可以想象 GPT-N 能够在上下文中“模拟”记忆、落地、学习和决策：列出所有可能动作，模拟并评估每个动作，再把自己的全部长期记忆明确保存在一个极长上下文里。甚至可以更大胆地设想：GPT-N+1 不在上下文里进行任何中间推理，而是在神经元中隐式模拟这些机制，直接成功生成下一个动作。虽然这些极端情形近期不太可能出现，渐进式改进仍可能改变不同 CoALA 组件的重要程度。例如，更长的上下文窗口可能降低长期记忆的重要性；更强的内部评估与模拟推理，则可能支持更长时间跨度的规划。总体而言，LLM 不受生物限制（Griffiths, 2020），其涌现性质也一直难以预测。尽管如此，CoALA——以及更广义的认知科学——仍然可以帮助组织语言智能体在哪些任务上成功或失败，并提出基于代码的过程来弥补特定 LLM 在特定任务上的不足。即使在最极端的情况下，GPT 已经用神经元实现了 CoALA 的全部机制，把 CoALA 作为概念指南来发现并解释这些隐式回路，或许仍然有帮助。

当然，正如第 6 节所讨论的，智能体用例也会帮助发现、定义并塑造 LLM 能力。芯片与计算机架构一直共同演化；同样，语言模型与智能体设计也应沿着相互促进的道路发展。

## 8 结论

本文提出了语言智能体的认知架构（CoALA），一个用于描述和构建语言智能体的概念框架。框架从符号人工智能与认知科学的丰富历史中汲取灵感，把数十年前的见解同大语言模型前沿研究联系起来。我们相信，这种方法提供了一条通向更通用、更类人的人工智能的发展道路。

## 致谢

感谢 Harrison Chase、Baian Chen、Khanh Nguyen、Ofir Press、Noah Shinn 和 Jens Tuyls 的校对与宝贵反馈，并感谢 Princeton NLP Group 和 Princeton Computational Cognitive Science Lab 的成员所作的有益讨论。最后，感谢匿名审稿人提出富有洞见的意见和建议。

Shunyu Yao（SY）和 Karthik Narasimhan（KN）获得 Oracle Collaborative Research 奖项与美国国家科学基金会第 2239363 号资助。本文所表达的任何意见、发现、结论或建议均属于作者，不一定代表美国国家科学基金会的观点。SY 还获得 Princeton Harold W. Dodds Fellowship 支持。Theodore R. Sumers（TS）获得 National Defense Science and Engineering（NDSEG）Graduate Fellowship Program 支持。

## 参考文献

1. Adams et al. (2012) S. Adams, I. Arel, J. Bach, R. Coop, R. Furlan, B. Goertzel, J. S. Hall, A. Samsonovich, M. Scheutz, M. Schlesinger, et al. Mapping the landscape of human-level artificial general intelligence. *AI magazine*, 33(1):25–42, 2012.
2. Ahn et al. (2022) M. Ahn, A. Brohan, N. Brown, Y. Chebotar, O. Cortes, B. David, C. Finn, C. Fu, K. Gopalakrishnan, K. Hausman, et al. Do as I can, not as I say: Grounding language in robotic affordances. *arXiv preprint arXiv:2204.01691*, 2022.
3. Alayrac et al. (2022) J.-B. Alayrac, J. Donahue, P. Luc, A. Miech, I. Barr, Y. Hasson, K. Lenc, A. Mensch, K. Millican, M. Reynolds, et al. Flamingo: a visual language model for few-shot learning. *Advances in Neural Information Processing Systems*, 35:23716–23736, 2022.
4. Anderson and Lebiere (2003) J. R. Anderson and C. Lebiere. The Newell test for a theory of cognition. *Behavioral and Brain Sciences*, 26(5):587–601, 2003.
5. Andreas (2022) J. Andreas. Language models as agent models. In *Findings of the Association for Computational Linguistics: EMNLP 2022*, pages 5769–5779, 2022.
6. Atkinson and Shiffrin (1968) R. C. Atkinson and R. M. Shiffrin. Human memory: A proposed system and its control processes. In *Psychology of Learning and Motivation*, volume 2, pages 89–195. Elsevier, 1968.
7. Baddeley and Hitch (1974) A. D. Baddeley and G. Hitch. Working memory. In *Psychology of Learning and Motivation*, volume 8, pages 47–89. Elsevier, 1974.
8. Bai et al. (2022) Y. Bai, S. Kadavath, S. Kundu, A. Askell, J. Kernion, A. Jones, A. Chen, A. Goldie, A. Mirhoseini, C. McKinnon, et al. Constitutional AI: Harmlessness from AI feedback. *arXiv preprint arXiv:2212.08073*, 2022.
9. Bavishi et al. (2023) R. Bavishi, E. Elsen, C. Hawthorne, M. Nye, A. Odena, A. Somani, and S. Taşırlar. Introducing our multimodal models, 2023. URL <https://www.adept.ai/blog/fuyu-8b>.
10. Bisk et al. (2016) Y. Bisk, D. Marcu, and W. Wong. Towards a dataset for human computer communication via grounded language acquisition. In *Workshops at the Thirtieth AAAI Conference on Artificial Intelligence*, 2016.
11. Biyik and Palan (2019) E. Biyik and M. Palan. Asking easy questions: A user-friendly approach to active reward learning. In *Proceedings of the 3rd Conference on Robot Learning*, 2019.
12. Blundell et al. (2016) C. Blundell, B. Uria, A. Pritzel, Y. Li, A. Ruderman, J. Z. Leibo, J. Rae, D. Wierstra, and D. Hassabis. Model-free episodic control. *arXiv preprint arXiv:1606.04460*, 2016.
13. Borgeaud et al. (2022) S. Borgeaud, A. Mensch, J. Hoffmann, T. Cai, E. Rutherford, K. Millican, G. B. Van Den Driessche, J.-B. Lespiau, B. Damoc, A. Clark, et al. Improving language models by retrieving from trillions of tokens. In *International Conference on Machine Learning*, pages 2206–2240, 2022.
14. Branavan et al. (2012) S. Branavan, D. Silver, and R. Barzilay. Learning to win by reading manuals in a Monte-Carlo framework. *Journal of Artificial Intelligence Research*, 43:661–704, 2012.
15. Braverman et al. (2020) M. Braverman, X. Chen, S. Kakade, K. Narasimhan, C. Zhang, and Y. Zhang. Calibration, entropy rates, and memory in language models. In *International Conference on Machine Learning*, pages 1089–1099, 2020.
16. Brockman et al. (2016) G. Brockman, V. Cheung, L. Pettersson, J. Schneider, J. Schulman, J. Tang, and W. Zaremba. Openai gym, 2016.
17. Brohan et al. (2022) A. Brohan, N. Brown, J. Carbajal, Y. Chebotar, J. Dabis, C. Finn, K. Gopalakrishnan, K. Hausman, A. Herzog, J. Hsu, et al. RT-1: Robotics transformer for real-world control at scale. *arXiv preprint arXiv:2212.06817*, 2022.
18. Brohan et al. (2023) A. Brohan, N. Brown, J. Carbajal, Y. Chebotar, X. Chen, K. Choromanski, T. Ding, D. Driess, A. Dubey, C. Finn, et al. RT-2: Vision-language-action models transfer web knowledge to robotic control. *arXiv preprint arXiv:2307.15818*, 2023.
19. Brown et al. (2020) T. Brown, B. Mann, N. Ryder, M. Subbiah, J. D. Kaplan, P. Dhariwal, A. Neelakantan, P. Shyam, G. Sastry, A. Askell, et al. Language models are few-shot learners. *Advances in Neural Information Processing Systems*, 33:1877–1901, 2020.
20. Browne et al. (2012) C. B. Browne, E. Powley, D. Whitehouse, S. M. Lucas, P. I. Cowling, P. Rohlfshagen, S. Tavener, D. Perez, S. Samothrakis, and S. Colton. A survey of Monte Carlo tree search methods. *IEEE Transactions on Computational Intelligence and AI in games*, 4(1):1–43, 2012.
21. Callaway et al. (2022) F. Callaway, B. van Opheusden, S. Gul, P. Das, P. M. Krueger, T. L. Griffiths, and F. Lieder. Rational use of cognitive resources in human planning. *Nature Human Behaviour*, 6(8):1112–1125, 2022.
22. Chan et al. (2023) C.-M. Chan, W. Chen, Y. Su, J. Yu, W. Xue, S. Zhang, J. Fu, and Z. Liu. Chateval: Towards better llm-based evaluators through multi-agent debate. *arXiv preprint arXiv:2308.07201*, 2023.
23. Chen et al. (2023a) B. Chen, F. Xia, B. Ichter, K. Rao, K. Gopalakrishnan, M. S. Ryoo, A. Stone, and D. Kappler. Open-vocabulary queryable scene representations for real world planning. In *2023 IEEE International Conference on Robotics and Automation (ICRA)*, pages 11509–11522, 2023a.
24. Chen and Mooney (2011) D. Chen and R. Mooney. Learning to interpret natural language navigation instructions from observations. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 25, pages 859–865, 2011.
25. Chen et al. (2017) D. Chen, A. Fisch, J. Weston, and A. Bordes. Reading Wikipedia to answer open-domain questions. *arXiv preprint arXiv:1704.00051*, 2017.
26. Chen et al. (2021) M. Chen, J. Tworek, H. Jun, Q. Yuan, H. P. d. O. Pinto, J. Kaplan, H. Edwards, Y. Burda, N. Joseph, G. Brockman, et al. Evaluating large language models trained on code. *arXiv preprint arXiv:2107.03374*, 2021.
27. Chen et al. (2023b) X. Chen, M. Lin, N. Schärli, and D. Zhou. Teaching large language models to self-debug. *arXiv preprint arXiv:2304.05128*, 2023b.
28. Chen et al. (2022) Y. Chen, L. Yuan, G. Cui, Z. Liu, and H. Ji. A close look into the calibration of pre-trained language models. *arXiv preprint arXiv:2211.00151*, 2022.
29. Chomsky (1956) N. Chomsky. Three models for the description of language. *IRE Transactions on information theory*, 2(3):113–124, 1956.
30. Chowdhery et al. (2022) A. Chowdhery, S. Narang, J. Devlin, M. Bosma, G. Mishra, A. Roberts, P. Barham, H. W. Chung, C. Sutton, S. Gehrmann, et al. Palm: Scaling language modeling with pathways. *arXiv preprint arXiv:2204.02311*, 2022.
31. Christiano et al. (2017) P. F. Christiano, J. Leike, T. Brown, M. Martic, S. Legg, and D. Amodei. Deep reinforcement learning from human preferences. *Advances in neural information processing systems*, 30, 2017.
32. Church (1932) A. Church. A set of postulates for the foundation of logic. *Annals of mathematics*, pages 346–366, 1932.
33. Côté et al. (2019) M.-A. Côté, A. Kádár, X. Yuan, B. Kybartas, T. Barnes, E. Fine, J. Moore, M. Hausknecht, L. El Asri, M. Adada, et al. Textworld: A learning environment for text-based games. In *Computer Games: 7th Workshop, CGW 2018*, pages 41–75. Springer, 2019.
34. Creswell et al. (2023) A. Creswell, M. Shanahan, and I. Higgins. Selection-inference: Exploiting large language models for interpretable logical reasoning. In *The Eleventh International Conference on Learning Representations*, 2023.
35. Dagan et al. (2023) G. Dagan, F. Keller, and A. Lascarides. Dynamic Planning with a LLM. *arXiv preprint arXiv:2308.06391*, 2023.
36. Dasgupta et al. (2022) I. Dasgupta, C. Kaeser-Chen, K. Marino, A. Ahuja, S. Babayan, F. Hill, and R. Fergus. Collaborating with language models for embodied reasoning. In *Second Workshop on Language and Reinforcement Learning*, 2022.
37. Deng et al. (2023) X. Deng, Y. Gu, B. Zheng, S. Chen, S. Stevens, B. Wang, H. Sun, and Y. Su. Mind2Web: Towards a generalist agent for the web. *arXiv preprint arXiv:2306.06070*, 2023.
38. Derbinsky et al. (2012) N. Derbinsky, J. Li, and J. Laird. A multi-domain evaluation of scaling in a general episodic memory. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 26, pages 193–199, 2012.
39. Devlin et al. (2019) J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova. BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. In *NAACL-HLT (1)*, 2019.
40. Dohan et al. (2022) D. Dohan, W. Xu, A. Lewkowycz, J. Austin, D. Bieber, R. G. Lopes, Y. Wu, H. Michalewski, R. A. Saurous, J. Sohl-Dickstein, et al. Language model cascades. *arXiv preprint arXiv:2207.10342*, 2022.

41. Dong et al. (2023) Y. Dong, X. Jiang, Z. Jin, and G. Li. Self-collaboration code generation via chatgpt. *arXiv preprint arXiv:2304.07590*, 2023.
42. Driess et al. (2023) D. Driess, F. Xia, M. S. Sajjadi, C. Lynch, A. Chowdhery, B. Ichter, A. Wahid, J. Tompson, Q. Vuong, T. Yu, et al. Palm-e: An embodied multimodal language model. *arXiv preprint arXiv:2303.03378*, 2023.
43. Du et al. (2023) Y. Du, S. Li, A. Torralba, J. B. Tenenbaum, and I. Mordatch. Improving factuality and reasoning in language models through multiagent debate. *arXiv preprint arXiv:2305.14325*, 2023.
44. Ecoffet et al. (2019) A. Ecoffet, J. Huizinga, J. Lehman, K. O. Stanley, and J. Clune. Go-explore: a new approach for hard-exploration problems. *arXiv preprint arXiv:1901.10995*, 2019.
45. Ellis et al. (2021) K. Ellis, C. Wong, M. Nye, M. Sablé-Meyer, L. Morales, L. Hewitt, L. Cary, A. Solar-Lezama, and J. B. Tenenbaum. Dreamcoder: Bootstrapping inductive program synthesis with wake-sleep library learning. In *Proceedings of the 42nd ACM SIGPLAN International Conference on Programming Language Design and Implementation*, pages 835–850, 2021.
46. Elsen et al. (2023) E. Elsen, A. Odena, M. Nye, S. Taşırlar, T. Dao, C. Hawthorne, D. Moparthi, and A. Somani. Releasing Persimmon-8B, 2023. URL <https://www.adept.ai/blog/persimmon-8b>.
47. Feng et al. (2023) S. Feng, C. Y. Park, Y. Liu, and Y. Tsvetkov. From pretraining data to language models to downstream tasks: Tracking the trails of political biases leading to unfair nlp models. *arXiv preprint arXiv:2305.08283*, 2023.
48. Ganguli et al. (2023) D. Ganguli, A. Askell, N. Schiefer, T. Liao, K. Lukošiūtė, A. Chen, A. Goldie, A. Mirhoseini, C. Olsson, D. Hernandez, et al. The capacity for moral self-correction in large language models. *arXiv preprint arXiv:2302.07459*, 2023.
49. Gao et al. (2023) C. Gao, X. Lan, Z. Lu, J. Mao, J. Piao, H. Wang, D. Jin, and Y. Li. S3: Social-network simulation system with large language model-empowered agents. *arXiv preprint arXiv:2307.14984*, 2023.
50. Gao et al. (2020) T. Gao, A. Fisch, and D. Chen. Making pre-trained language models better few-shot learners. *arXiv preprint arXiv:2012.15723*, 2020.
51. Gershman et al. (2015) S. J. Gershman, E. J. Horvitz, and J. B. Tenenbaum. Computational rationality: A converging paradigm for intelligence in brains, minds, and machines. *Science*, 349(6245):273–278, 2015.
52. Griffiths (2020) T. L. Griffiths. Understanding human intelligence through human limitations. *Trends in Cognitive Sciences*, 24(11):873–883, 2020.
53. Gu et al. (2018) J. Gu, Y. Wang, K. Cho, and V. O. Li. Search engine guided neural machine translation. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 32, 2018.
54. Guan et al. (2023) L. Guan, K. Valmeekam, S. Sreedharan, and S. Kambhampati. Leveraging pre-trained large language models to construct and utilize world models for model-based task planning. *arXiv preprint arXiv:2305.14909*, 2023.
55. Guidance (2023) Guidance. Guidance, 2023. URL <https://github.com/guidance-ai/guidance>.
56. Gur et al. (2023) I. Gur, H. Furuta, A. Huang, M. Safdari, Y. Matsuo, D. Eck, and A. Faust. A real-world webagent with planning, long context understanding, and program synthesis. *arXiv preprint arXiv:2307.12856*, 2023.
57. Guu et al. (2020) K. Guu, K. Lee, Z. Tung, P. Pasupat, and M. Chang. Retrieval augmented language model pre-training. In *International conference on machine learning*, pages 3929–3938, 2020.
58. Hamrick et al. (2019) J. B. Hamrick, V. Bapst, A. Sanchez-Gonzalez, T. Pfaff, T. Weber, L. Buesing, and P. W. Battaglia. Combining q-learning and search with amortized value estimates. In *International Conference on Learning Representations*, 2019.
59. Hanjie et al. (2021) A. W. Hanjie, V. Zhong, and K. Narasimhan. Grounding language to entities and dynamics for generalization in reinforcement learning. In *International Conference on Machine Learning (ICML)*, 2021.
60. Hao et al. (2023) S. Hao, Y. Gu, H. Ma, J. J. Hong, Z. Wang, D. Z. Wang, and Z. Hu. Reasoning with language model is planning with world model. *arXiv preprint arXiv:2305.14992*, 2023.
61. Hasan et al. (2023) M. Hasan, C. Ozel, S. Potter, and E. Hoque. Sapien: Affective virtual agents powered by large language models. *arXiv preprint arXiv:2308.03022*, 2023.
62. Haslum et al. (2019) P. Haslum, N. Lipovetzky, D. Magazzeni, C. Muise, R. Brachman, F. Rossi, and P. Stone. *An introduction to the planning domain definition language*, volume 13. Springer, 2019.
63. Hausknecht et al. (2020) M. Hausknecht, P. Ammanabrolu, M.-A. Côté, and X. Yuan. Interactive fiction games: A colossal adventure. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 34, pages 7903–7910, 2020.
64. Hong et al. (2023a) S. Hong, X. Zheng, J. Chen, Y. Cheng, C. Zhang, Z. Wang, S. K. S. Yau, Z. Lin, L. Zhou, C. Ran, et al. Metagpt: Meta programming for multi-agent collaborative framework. *arXiv preprint arXiv:2308.00352*, 2023a.
65. Hong et al. (2023b) W. Hong, W. Wang, Q. Lv, J. Xu, W. Yu, J. Ji, Y. Wang, Z. Wang, Y. Dong, M. Ding, et al. Cogagent: A visual language model for gui agents. *arXiv preprint arXiv:2312.08914*, 2023b.
66. Huang et al. (2022a) J. Huang, S. S. Gu, L. Hou, Y. Wu, X. Wang, H. Yu, and J. Han. Large language models can self-improve. *arXiv preprint arXiv:2210.11610*, 2022a.
67. Huang et al. (2023) S. Huang, Z. Jiang, H. Dong, Y. Qiao, P. Gao, and H. Li. Instruct2Act: Mapping Multi-modality Instructions to Robotic Actions with Large Language Model. *arXiv preprint arXiv:2305.11176*, 2023.
68. Huang et al. (2022b) W. Huang, P. Abbeel, D. Pathak, and I. Mordatch. Language models as zero-shot planners: Extracting actionable knowledge for embodied agents. In *International Conference on Machine Learning*, pages 9118–9147, 2022b.
69. Huang et al. (2022c) W. Huang, F. Xia, T. Xiao, H. Chan, J. Liang, P. Florence, A. Zeng, J. Tompson, I. Mordatch, Y. Chebotar, et al. Inner monologue: Embodied reasoning through planning with language models. *arXiv preprint arXiv:2207.05608*, 2022c.
70. Hussein et al. (2017) A. Hussein, M. M. Gaber, E. Elyan, and C. Jayne. Imitation learning: A survey of learning methods. *ACM Computing Surveys (CSUR)*, 50(2):1–35, 2017.
71. Irving et al. (2018) G. Irving, P. Christiano, and D. Amodei. AI safety via debate. *arXiv preprint arXiv:1805.00899*, 2018.
72. Izacard et al. (2021) G. Izacard, M. Caron, L. Hosseini, S. Riedel, P. Bojanowski, A. Joulin, and E. Grave. Unsupervised dense information retrieval with contrastive learning. *arXiv preprint arXiv:2112.09118*, 2021.
73. Jiang et al. (2021) Z. Jiang, J. Araki, H. Ding, and G. Neubig. How can we know when language models know? on the calibration of language models for question answering. *Transactions of the Association for Computational Linguistics*, 9:962–977, 2021.
74. Jin et al. (2022) Z. Jin, S. Levine, F. G. Adauto, O. Kamal, M. Sap, M. Sachan, R. Mihalcea, J. B. Tenenbaum, and B. Schölkopf. When to make exceptions: Exploring language models as accounts of human moral judgment. In A. H. Oh, A. Agarwal, D. Belgrave, and K. Cho, editors, *Advances in Neural Information Processing Systems*, 2022.
75. Jinxin et al. (2023) S. Jinxin, Z. Jiabao, W. Yilei, W. Xingjiao, L. Jiawen, and H. Liang. Cgmi: Configurable general multi-agent interaction framework. *arXiv preprint arXiv:2308.12503*, 2023.
76. Jones et al. (1999) R. M. Jones, J. E. Laird, P. E. Nielsen, K. J. Coulter, P. Kenny, and F. V. Koss. Automated intelligent pilots for combat flight simulation. *AI magazine*, 20(1):27–27, 1999.
77. Jurafsky (2000) D. Jurafsky. *Speech & language processing*. Pearson Education India, 2000.
78. Khattab et al. (2022) O. Khattab, K. Santhanam, X. L. Li, D. Hall, P. Liang, C. Potts, and M. Zaharia. Demonstrate-search-predict: Composing retrieval and language models for knowledge-intensive NLP. *arXiv preprint arXiv:2212.14024*, 2022. URL <https://github.com/stanfordnlp/dspy>.
79. Kim et al. (2023) G. Kim, P. Baldi, and S. McAleer. Language models can solve computer tasks. *arXiv preprint arXiv:2303.17491*, 2023.
80. Kirk and Laird (2014) J. R. Kirk and J. E. Laird. Interactive task learning for simple games. *Advances in Cognitive Systems*, 3(13-30):5, 2014.

81. Kirk et al. (2023) J. R. Kirk, W. Robert, P. Lindes, and J. E. Laird. Improving Knowledge Extraction from LLMs for Robotic Task Learning through Agent Analysis. *arXiv preprint arXiv:2306.06770*, 2023.
82. Koedinger et al. (1997) K. R. Koedinger, J. R. Anderson, W. H. Hadley, M. A. Mark, et al. Intelligent tutoring goes to school in the big city. *International Journal of Artificial Intelligence in Education*, 8(1):30–43, 1997.
83. Kojima et al. (2022) T. Kojima, S. S. Gu, M. Reid, Y. Matsuo, and Y. Iwasawa. Large language models are zero-shot reasoners. *Advances in Neural Information Processing Systems*, 35:22199–22213, 2022.
84. Kotseruba and Tsotsos (2020) I. Kotseruba and J. K. Tsotsos. 40 years of cognitive architectures: core cognitive abilities and practical applications. *Artificial Intelligence Review*, 53(1):17–94, 2020.
85. Laidlaw et al. (2023) C. Laidlaw, S. Russell, and A. Dragan. Bridging rl theory and practice with the effective horizon. *arXiv preprint arXiv:2304.09853*, 2023.
86. Laird (2019) J. E. Laird. *The Soar cognitive architecture*. MIT press, 2019.
87. Laird (2022) J. E. Laird. Introduction to Soar. *arXiv preprint arXiv:2205.03854*, 2022.
88. Laird et al. (1986) J. E. Laird, P. S. Rosenbloom, and A. Newell. Chunking in Soar: The anatomy of a general learning mechanism. *Machine Learning*, 1:11–46, 1986.
89. Laird et al. (1987) J. E. Laird, A. Newell, and P. S. Rosenbloom. Soar: An architecture for general intelligence. *Artificial Intelligence*, 33(1):1–64, 1987.
90. Laird et al. (2012) J. E. Laird, K. R. Kinkade, S. Mohan, and J. Z. Xu. Cognitive robotics using the Soar cognitive architecture. In *CogRob @ AAAI*, 2012.
91. Lake et al. (2016) B. M. Lake, T. D. Ullman, J. B. Tenenbaum, and S. J. Gershman. Building machines that learn and think like people, 2016.
92. LangChain (2022) LangChain. LangChain, 2022. URL <http://www.langchain.com>.
93. Le et al. (2022) H. Le, Y. Wang, A. D. Gotmare, S. Savarese, and S. C. H. Hoi. Coderl: Mastering code generation through pretrained models and deep reinforcement learning. *Advances in Neural Information Processing Systems*, 35:21314–21328, 2022.
94. LeCun (2022) Y. LeCun. A path towards autonomous machine intelligence version 0.9. 2, 2022-06-27. *Open Review*, 62, 2022.
95. Lewis et al. (2020) P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Küttler, M. Lewis, W.-t. Yih, T. Rocktäschel, et al. Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems*, 33:9459–9474, 2020.
96. Li et al. (2023a) B. Z. Li, W. Chen, P. Sharma, and J. Andreas. Lampp: Language models as probabilistic priors for perception and action. *arXiv preprint arXiv:2302.02801*, 2023a.
97. Li et al. (2023b) C. Li, Z. Gan, Z. Yang, J. Yang, L. Li, L. Wang, and J. Gao. Multimodal foundation models: From specialists to general-purpose assistants. *arXiv preprint arXiv:2309.10020*, 2023b.
98. Li et al. (2022a) H. Li, Y. Su, D. Cai, Y. Wang, and L. Liu. A survey on retrieval-augmented text generation. *arXiv preprint arXiv:2202.01110*, 2022a.
99. Li et al. (2023c) R. Li, L. B. Allal, Y. Zi, N. Muennighoff, D. Kocetkov, C. Mou, M. Marone, C. Akiki, J. Li, J. Chim, Q. Liu, E. Zheltonozhskii, T. Y. Zhuo, T. Wang, O. Dehaene, M. Davaadorj, J. Lamy-Poirier, J. Monteiro, O. Shliazhko, N. Gontier, N. Meade, A. Zebaze, M.-H. Yee, L. K. Umapathi, J. Zhu, B. Lipkin, M. Oblokulov, Z. Wang, R. Murthy, J. Stillerman, S. S. Patel, D. Abulkhanov, M. Zocca, M. Dey, Z. Zhang, N. Fahmy, U. Bhattacharyya, W. Yu, S. Singh, S. Luccioni, P. Villegas, M. Kunakov, F. Zhdanov, M. Romero, T. Lee, N. Timor, J. Ding, C. Schlesinger, H. Schoelkopf, J. Ebert, T. Dao, M. Mishra, A. Gu, J. Robinson, C. J. Anderson, B. Dolan-Gavitt, D. Contractor, S. Reddy, D. Fried, D. Bahdanau, Y. Jernite, C. M. Ferrandis, S. M. Hughes, T. Wolf, A. Guha, L. von Werra, and H. de Vries. Starcoder: may the source be with you! *ArXiv*, abs/2305.06161, 2023c.
100. Li et al. (2022b) Y. Li, D. H. Choi, J. Chung, N. Kushman, J. Schrittwieser, R. Leblond, Tom, Eccles, J. Keeling, F. Gimeno, A. D. Lago, T. Hubert, P. Choy, C. de, M. d’Autume, I. Babuschkin, X. Chen, P.-S. Huang, J. Welbl, S. Gowal, Alexey, Cherepanov, J. Molloy, D. J. Mankowitz, E. S. Robson, P. Kohli, N. de, Freitas, K. Kavukcuoglu, and O. Vinyals. Competition-level code generation with alphacode. *Science*, 378:1092–1097, 2022b.
101. Liang et al. (2023a) J. Liang, W. Huang, F. Xia, P. Xu, K. Hausman, B. Ichter, P. Florence, and A. Zeng. Code as policies: Language model programs for embodied control. In *2023 IEEE International Conference on Robotics and Automation (ICRA)*, pages 9493–9500, 2023a.
102. Liang et al. (2021) P. P. Liang, C. Wu, L.-P. Morency, and R. Salakhutdinov. Towards understanding and mitigating social biases in language models. In *International Conference on Machine Learning*, pages 6565–6576, 2021.
103. Liang et al. (2023b) T. Liang, Z. He, W. Jiao, X. Wang, Y. Wang, R. Wang, Y. Yang, Z. Tu, and S. Shi. Encouraging divergent thinking in large language models through multi-agent debate. *arXiv preprint arXiv:2305.19118*, 2023b.
104. Lieder and Griffiths (2020) F. Lieder and T. L. Griffiths. Resource-rational analysis: Understanding human cognition as the optimal use of limited computational resources. *Behavioral and Brain Sciences*, 43:e1, 2020.
105. Lin et al. (2023) B. Y. Lin, Y. Fu, K. Yang, P. Ammanabrolu, F. Brahman, S. Huang, C. Bhagavatula, Y. Choi, and X. Ren. Swiftsage: A generative agent with fast and slow thinking for complex interactive tasks. *arXiv preprint arXiv:2305.17390*, 2023.
106. Lindes and Laird (2016) P. Lindes and J. E. Laird. Toward integrating cognitive linguistics and cognitive language processing. In *Proceedings of the 14th International Conference on Cognitive Modeling (ICCM)*, 2016.
107. Liu et al. (2023a) B. Liu, Y. Jiang, X. Zhang, Q. Liu, S. Zhang, J. Biswas, and P. Stone. LLM+P: Empowering large language models with optimal planning proficiency. *arXiv preprint arXiv:2304.11477*, 2023a.
108. Liu et al. (2023b) H. Liu, C. Li, Q. Wu, and Y. J. Lee. Visual instruction tuning. In *NeurIPS*, 2023b.
109. Liu et al. (2023c) H. Liu, C. Sferrazza, and P. Abbeel. Languages are rewards: Hindsight finetuning using human feedback. *arXiv preprint arXiv:2302.02676*, 2023c.
110. Liu et al. (2021) J. Liu, D. Shen, Y. Zhang, B. Dolan, L. Carin, and W. Chen. What Makes Good In-Context Examples for GPT-3? *arXiv preprint arXiv:2101.06804*, 2021.
111. Liu et al. (2023d) P. Liu, W. Yuan, J. Fu, Z. Jiang, H. Hayashi, and G. Neubig. Pre-train, prompt, and predict: A systematic survey of prompting methods in natural language processing. *ACM Computing Surveys*, 55(9), 2023d. ISSN 0360-0300.
112. Liu et al. (2023e) R. Liu, J. Wei, S. S. Gu, T.-Y. Wu, S. Vosoughi, C. Cui, D. Zhou, and A. M. Dai. Mind’s eye: Grounded language model reasoning through simulation. In *The Eleventh International Conference on Learning Representations*, 2023e.
113. Liu et al. (2023f) R. Liu, R. Yang, C. Jia, G. Zhang, D. Zhou, A. M. Dai, D. Yang, and S. Vosoughi. Training socially aligned language models in simulated human society. *arXiv preprint arXiv:2305.16960*, 2023f.
114. LlamaIndex (2023) LlamaIndex. LlamaIndex, 2023. URL <http://www.llamaindex.ai>.
115. Lwakatare et al. (2020) L. E. Lwakatare, A. Raj, I. Crnkovic, J. Bosch, and H. H. Olsson. Large-scale machine learning systems in real-world industrial settings: A review of challenges and solutions. *Information and software technology*, 127:106368, 2020.
116. Ma et al. (2023) Z. Ma, Y. Mei, and Z. Su. Understanding the benefits and challenges of using large language model-based conversational agents for mental well-being support. *arXiv preprint arXiv:2307.15810*, 2023.
117. Macenski et al. (2022) S. Macenski, T. Foote, B. Gerkey, C. Lalancette, and W. Woodall. Robot operating system 2: Design, architecture, and uses in the wild. *Science Robotics*, 7(66):eabm6074, 2022.
118. Madaan et al. (2023) A. Madaan, N. Tandon, P. Gupta, S. Hallinan, L. Gao, S. Wiegreffe, U. Alon, N. Dziri, S. Prabhumoye, Y. Yang, et al. Self-refine: Iterative refinement with self-feedback. *arXiv preprint arXiv:2303.17651*, 2023.
119. Markov (1954) A. A. Markov. The theory of algorithms. *Trudy Matematicheskogo Instituta Imeni VA Steklova*, 42:3–375, 1954.
120. Mattar and Daw (2018) M. G. Mattar and N. D. Daw. Prioritized memory access explains planning and hippocampal replay. *Nature Neuroscience*, 21(11):1609–1617, 2018.

121. McClelland et al. (2019) J. L. McClelland, F. Hill, M. Rudolph, J. Baldridge, and H. Schütze. Extending machine language models toward human-level language understanding. *arXiv preprint arXiv:1912.05877*, 2019.
122. Meier et al. (2021) J. Meier, R. Rao, R. Verkuil, J. Liu, T. Sercu, and A. Rives. Language models enable zero-shot prediction of the effects of mutations on protein function. *bioRxiv*, 2021.
123. Mialon et al. (2023) G. Mialon, R. Dessì, M. Lomeli, C. Nalmpantis, R. Pasunuru, R. Raileanu, B. Rozière, T. Schick, J. Dwivedi-Yu, A. Celikyilmaz, et al. Augmented language models: a survey. *arXiv preprint arXiv:2302.07842*, 2023.
124. Mohan and Laird (2014) S. Mohan and J. Laird. Learning goal-oriented hierarchical tasks from situated interactive instruction. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 28, 2014.
125. Mohan et al. (2012) S. Mohan, A. H. Mininger, J. R. Kirk, and J. E. Laird. Acquiring grounded representations of words with situated interactive instruction. *Advances in Cognitive Systems*, 2:113–130, 2012.
126. Nakano et al. (2021) R. Nakano, J. Hilton, S. Balaji, J. Wu, L. Ouyang, C. Kim, C. Hesse, S. Jain, V. Kosaraju, W. Saunders, et al. WebGPT: Browser-Assisted Question-Answering with Human Feedback. *arXiv preprint arXiv:2112.09332*, 2021.
127. Narasimhan et al. (2018) K. Narasimhan, R. Barzilay, and T. Jaakkola. Deep transfer in reinforcement learning by language grounding. In *Journal of Artificial Intelligence Research (JAIR)*, 2018.
128. Narayan-Chen et al. (2019) A. Narayan-Chen, P. Jayannavar, and J. Hockenmaier. Collaborative dialogue in Minecraft. In *Proceedings of the 57th Annual Meeting of the Association for Computational Linguistics*, pages 5405–5415. Association for Computational Linguistics, 2019.
129. Nason and Laird (2005) S. Nason and J. E. Laird. Soar-RL: Integrating reinforcement learning with Soar. *Cognitive Systems Research*, 6(1):51–59, 2005.
130. Newell (1967) A. Newell. Studies in problem solving: Subject 3 on the crypt-arithmetic task DONALD+ GERALD= ROBERT. Technical report, Carnegie Mellon University, 1967.
131. Newell (1980) A. Newell. Physical symbol systems. *Cognitive science*, 4(2):135–183, 1980.
132. Newell (1992) A. Newell. Précis of unified theories of cognition. *Behavioral and Brain Sciences*, 15(3):425–437, 1992.
133. Newell and Simon (1972) A. Newell and H. A. Simon. *Human problem solving*. Prentice-Hall, 1972.
134. Newell et al. (1989) A. Newell, P. S. Rosenbloom, and J. E. Laird. Symbolic architectures for cognition. *Foundations of cognitive science*, pages 93–131, 1989.
135. Nguyen and Daumé III (2019) K. Nguyen and H. Daumé III. Help, Anna! visual navigation with natural multimodal assistance via retrospective curiosity-encouraging imitation learning. *arXiv preprint arXiv:1909.01871*, 2019.
136. Nguyen et al. (2019) K. Nguyen, D. Dey, C. Brockett, and B. Dolan. Vision-based navigation with language-based assistance via imitation learning with indirect intervention. In *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*, pages 12527–12537, 2019.
137. Nguyen et al. (2022a) K. Nguyen, Y. Bisk, and H. Daumé III. A framework for learning to request rich and contextually useful information from humans. In *ICML*, July 2022a.
138. Nguyen (2023) K. X. Nguyen. Language models are bounded pragmatic speakers. In *First Workshop on Theory of Mind in Communicating Agents*, 2023.
139. Nguyen et al. (2021) K. X. Nguyen, D. Misra, R. Schapire, M. Dudík, and P. Shafto. Interactive learning from activity description. In *International Conference on Machine Learning*, pages 8096–8108, 2021.
140. Nguyen et al. (2022b) K. X. Nguyen, Y. Bisk, and H. D. Iii. A framework for learning to request rich and contextually useful information from humans. In *International Conference on Machine Learning*, pages 16553–16568, 2022b.
141. Nguyen et al. (2022c) T. T. Nguyen, T. T. Huynh, P. L. Nguyen, A. W.-C. Liew, H. Yin, and Q. V. H. Nguyen. A survey of machine unlearning. *arXiv preprint arXiv:2209.02299*, 2022c.
142. Ni et al. (2023) A. Ni, S. Iyer, D. Radev, V. Stoyanov, W.-t. Yih, S. Wang, and X. V. Lin. Lever: Learning to verify language-to-code generation with execution. In *International Conference on Machine Learning*, pages 26106–26128, 2023.
143. Nilsson (1984) N. J. Nilsson. Shakey the robot. *Technical Note*, 1984.
144. Nogueira et al. (2019) R. Nogueira, W. Yang, J. Lin, and K. Cho. Document expansion by query prediction, 2019.
145. Nuxoll and Laird (2007) A. M. Nuxoll and J. E. Laird. Extending cognitive architecture with episodic memory. In *Proceedings of the AAAI Conference on Artificial Intelligence*, pages 1560–1564, 2007.
146. Nye et al. (2021) M. Nye, A. J. Andreassen, G. Gur-Ari, H. Michalewski, J. Austin, D. Bieber, D. Dohan, A. Lewkowycz, M. Bosma, D. Luan, et al. Show your work: Scratchpads for intermediate computation with language models. *arXiv preprint arXiv:2112.00114*, 2021.
147. OpenAI (2023a) OpenAI. Gpt-4 technical report. *ArXiv*, abs/2303.08774, 2023a.
148. OpenAI (2023b) OpenAI. Function calling and other API updates, 2023b. URL <https://openai.com/blog/function-calling-and-other-api-updates>.
149. Ouyang et al. (2022) L. Ouyang, J. Wu, X. Jiang, D. Almeida, C. Wainwright, P. Mishkin, C. Zhang, S. Agarwal, K. Slama, A. Ray, et al. Training language models to follow instructions with human feedback. *Advances in Neural Information Processing Systems*, 35:27730–27744, 2022.
150. Padmakumar et al. (2022) A. Padmakumar, J. Thomason, A. Shrivastava, P. Lange, A. Narayan-Chen, S. Gella, R. Piramuthu, G. Tur, and D. Hakkani-Tur. Teach: Task-driven embodied agents that chat. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 36, pages 2017–2025, 2022.
151. Palo et al. (2023) N. D. Palo, A. Byravan, L. Hasenclever, M. Wulfmeier, N. Heess, and M. Riedmiller. Towards a unified agent with foundation models. In *Workshop on Reincarnating Reinforcement Learning at ICLR 2023*, 2023.
152. Parisi et al. (2022) A. Parisi, Y. Zhao, and N. Fiedel. Talm: Tool augmented language models. *arXiv preprint arXiv:2205.12255*, 2022.
153. Park et al. (2023) J. S. Park, J. C. O’Brien, C. J. Cai, M. R. Morris, P. Liang, and M. S. Bernstein. Generative agents: Interactive simulacra of human behavior. *arXiv preprint arXiv:2304.03442*, 2023.
154. Pataranutaporn et al. (2021) P. Pataranutaporn, V. Danry, J. Leong, P. Punpongsanon, D. Novy, P. Maes, and M. Sra. AI-generated characters for supporting personalized learning and well-being. *Nature Machine Intelligence*, 3(12):1013–1022, 2021.
155. Peng et al. (2023) A. Peng, I. Sucholutsky, B. Li, T. R. Sumers, T. L. Griffiths, J. Andreas, and J. A. Shah. Language guided state abstractions. In *Workshop on Social Intelligence in Humans and Robots at RSS 2023*, 2023.
156. Post (1943) E. L. Post. Formal reductions of the general combinatorial decision problem. *American Journal of Mathematics*, 65(2):197–215, 1943.
157. Pritzel et al. (2017) A. Pritzel, B. Uria, S. Srinivasan, A. P. Badia, O. Vinyals, D. Hassabis, D. Wierstra, and C. Blundell. Neural episodic control. In *International conference on machine learning*, pages 2827–2836, 2017.
158. Puterman (2014) M. L. Puterman. *Markov decision processes: discrete stochastic dynamic programming*. John Wiley & Sons, 2014.
159. Qian et al. (2023) C. Qian, X. Cong, C. Yang, W. Chen, Y. Su, J. Xu, Z. Liu, and M. Sun. Communicative agents for software development. *arXiv preprint arXiv:2307.07924*, 2023.
160. Qin et al. (2023) Y. Qin, S. Liang, Y. Ye, K. Zhu, L. Yan, Y. Lu, Y. Lin, X. Cong, X. Tang, B. Qian, et al. Toolllm: Facilitating large language models to master 16000+ real-world apis. *arXiv preprint arXiv:2307.16789*, 2023.

161. Quigley (2009) M. Quigley. Ros: an open-source robot operating system. In *IEEE International Conference on Robotics and Automation*, 2009. URL <https://api.semanticscholar.org/CorpusID:6324125>.
162. Radford et al. (2019) A. Radford, J. Wu, R. Child, D. Luan, D. Amodei, I. Sutskever, et al. Language models are unsupervised multitask learners. *OpenAI blog*, 1(8):9, 2019.
163. Ren et al. (2023) A. Z. Ren, A. Dixit, A. Bodrova, S. Singh, S. Tu, N. Brown, P. Xu, L. Takayama, F. Xia, Z. Xu, et al. Robots that ask for help: Uncertainty alignment for large language model planners. In *7th Annual Conference on Robot Learning*, 2023.
164. Romero et al. (2023) O. J. Romero, J. Zimmerman, A. Steinfeld, and A. Tomasic. Synergistic integration of large language models and cognitive architectures for robust ai: An exploratory analysis. *arXiv preprint arXiv:2308.09830*, 2023.
165. Rozière et al. (2023) B. Rozière, J. Gehring, F. Gloeckle, S. Sootla, I. Gat, X. Tan, Y. Adi, J. Liu, T. Remez, J. Rapin, A. Kozhevnikov, I. Evtimov, J. Bitton, M. P. Bhatt, C. C. Ferrer, A. Grattafiori, W. Xiong, A. D’efossez, J. Copet, F. Azhar, H. Touvron, L. Martin, N. Usunier, T. Scialom, and G. Synnaeve. Code llama: Open foundation models for code. *ArXiv*, abs/2308.12950, 2023.
166. Rubin et al. (2021) O. Rubin, J. Herzig, and J. Berant. Learning to retrieve prompts for in-context learning. *arXiv preprint arXiv:2112.08633*, 2021.
167. Russek et al. (2022) E. Russek, D. Acosta-Kane, B. van Opheusden, M. G. Mattar, and T. Griffiths. Time spent thinking in online chess reflects the value of computation. *PsyArXiv*, 2022.
168. Russell and Norvig (2013) S. Russell and P. Norvig. *Artificial Intelligence: A Modern Approach*. Pearson Education Limited London, 2013.
169. Sadigh et al. (2017) D. Sadigh, A. D. Dragan, S. Sastry, and S. A. Seshia. Active preference-based learning of reward functions. In N. M. Amato, S. S. Srinivasa, N. Ayanian, and S. Kuindersma, editors, *Robotics: Science and Systems XIII*, 2017.
170. Saunders et al. (2022) W. Saunders, C. Yeh, J. Wu, S. Bills, L. Ouyang, J. Ward, and J. Leike. Self-critiquing models for assisting human evaluators. *arXiv preprint arXiv:2206.05802*, 2022.
171. Schick et al. (2023) T. Schick, J. Dwivedi-Yu, R. Dessì, R. Raileanu, M. Lomeli, L. Zettlemoyer, N. Cancedda, and T. Scialom. Toolformer: Language models can teach themselves to use tools. *arXiv preprint arXiv:2302.04761*, 2023.
172. Sculley et al. (2014) D. Sculley, G. Holt, D. Golovin, E. Davydov, T. Phillips, D. Ebner, V. Chaudhary, and M. Young. Machine Learning: The High Interest Credit Card of Technical Debt. In *SE4ML: Software Engineering for Machine Learning (NIPS 2014 Workshop)*, 2014.
173. Shi et al. (2017) T. Shi, A. Karpathy, L. Fan, J. Hernandez, and P. Liang. World of Bits: An Open-Domain platform for web-based agents. In *International Conference on Machine Learning*, pages 3135–3144, 2017.
174. Shinn et al. (2023) N. Shinn, F. Cassano, B. Labash, A. Gopinath, K. Narasimhan, and S. Yao. Reflexion: Language agents with verbal reinforcement learning. *arXiv preprint arXiv:2303.11366*, 2023.
175. Shridhar et al. (2020) M. Shridhar, X. Yuan, M.-A. Côté, Y. Bisk, A. Trischler, and M. Hausknecht. Alfworld: Aligning text and embodied environments for interactive learning. *arXiv preprint arXiv:2010.03768*, 2020.
176. Silver et al. (2022) T. Silver, V. Hariprasad, R. S. Shuttleworth, N. Kumar, T. Lozano-Pérez, and L. P. Kaelbling. Pddl planning with pretrained large language models. In *NeurIPS 2022 Foundation Models for Decision Making Workshop*, 2022.
177. Silver et al. (2023) T. Silver, S. Dan, K. Srinivas, J. B. Tenenbaum, L. P. Kaelbling, and M. Katz. Generalized Planning in PDDL Domains with Pretrained Large Language Models. *arXiv preprint arXiv:2305.11014*, 2023.
178. Singh et al. (2023) I. Singh, V. Blukis, A. Mousavian, A. Goyal, D. Xu, J. Tremblay, D. Fox, J. Thomason, and A. Garg. Progprompt: Generating situated robot task plans using large language models. In *2023 IEEE International Conference on Robotics and Automation (ICRA)*, pages 11523–11530, 2023.
179. Sumers et al. (2022) T. Sumers, R. Hawkins, M. K. Ho, T. Griffiths, and D. Hadfield-Menell. How to talk so AI will learn: Instructions, descriptions, and autonomy. *Advances in Neural Information Processing Systems*, 35:34762–34775, 2022.
180. Sumers et al. (2023) T. Sumers, K. Marino, A. Ahuja, R. Fergus, and I. Dasgupta. Distilling internet-scale vision-language models into embodied agents. In *Proceedings of the 40th International Conference on Machine Learning*, pages 32797–32818, 2023.
181. Sumers et al. (2021) T. R. Sumers, M. K. Ho, R. D. Hawkins, K. Narasimhan, and T. L. Griffiths. Learning rewards from linguistic feedback. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 35, pages 6002–6010, 2021.
182. Sun (2004) R. Sun. Desiderata for cognitive architectures. *Philosophical Psychology*, 17(3):341–373, 2004.
183. Sutton and Barto (2018) R. S. Sutton and A. G. Barto. *Reinforcement learning: An introduction*. MIT press, 2018.
184. Tafjord et al. (2021) O. Tafjord, B. Dalvi, and P. Clark. Proofwriter: Generating implications, proofs, and abductive statements over natural language. In *Findings of the Association for Computational Linguistics: ACL-IJCNLP 2021*, pages 3621–3634, 2021.
185. Tamari et al. (2020) R. Tamari, C. Shani, T. Hope, M. R. L. Petruck, O. Abend, and D. Shahaf. Language (re)modelling: Towards embodied language understanding. In *Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics*, pages 6268–6281, Online, July 2020. Association for Computational Linguistics. [doi: 10.18653/v1/2020.acl-main.559](https://doi.org/10.18653/v1/2020.acl-main.559).
186. Tambe et al. (1995) M. Tambe, W. L. Johnson, R. M. Jones, F. Koss, J. E. Laird, P. S. Rosenbloom, and K. Schwamb. Intelligent agents for interactive simulation environments. *AI magazine*, 16(1):15–15, 1995.
187. Tang et al. (2023a) M. Tang, S. Yao, J. Yang, and K. Narasimhan. Referral augmentation for zero-shot information retrieval, 2023a.
188. Tang et al. (2023b) Q. Tang, Z. Deng, H. Lin, X. Han, Q. Liang, and L. Sun. ToolAlpaca: Generalized Tool Learning for Language Models with 3000 Simulated Cases. *arXiv preprint arXiv:2306.05301*, 2023b.
189. Team et al. (2023) G. Team, R. Anil, S. Borgeaud, Y. Wu, J.-B. Alayrac, J. Yu, R. Soricut, J. Schalkwyk, A. M. Dai, A. Hauth, et al. Gemini: a family of highly capable multimodal models. *arXiv preprint arXiv:2312.11805*, 2023.
190. Tellex et al. (2011) S. Tellex, T. Kollar, S. Dickerson, M. Walter, A. Banerjee, S. Teller, and N. Roy. Understanding natural language commands for robotic navigation and mobile manipulation. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 25, pages 1507–1514, 2011.
191. Thomason et al. (2020) J. Thomason, M. Murray, M. Cakmak, and L. Zettlemoyer. Vision-and-dialog navigation. In *Conference on Robot Learning*, pages 394–406. PMLR, 2020.
192. Turing et al. (1936) A. M. Turing et al. On computable numbers, with an application to the entscheidungsproblem. *J. of Math*, 58(345-363):5, 1936.
193. Tuyls et al. (2022) J. Tuyls, S. Yao, S. Kakade, and K. Narasimhan. Multi-stage episodic control for strategic exploration in text games. *arXiv preprint arXiv:2201.01251*, 2022.
194. Valmeekam et al. (2022) K. Valmeekam, A. Olmo, S. Sreedharan, and S. Kambhampati. Large language models still can’t plan (a benchmark for llms on planning and reasoning about change). *arXiv preprint arXiv:2206.10498*, 2022.
195. Vaswani et al. (2017) A. Vaswani, N. Shazeer, N. Parmar, J. Uszkoreit, L. Jones, A. N. Gomez, Ł. Kaiser, and I. Polosukhin. Attention is all you need. *Advances in Neural Information Processing Systems*, 30, 2017.
196. Wang et al. (2023a) G. Wang, Y. Xie, Y. Jiang, A. Mandlekar, C. Xiao, Y. Zhu, L. Fan, and A. Anandkumar. Voyager: An open-ended embodied agent with large language models. *arXiv preprint arXiv:2305.16291*, 2023a.
197. Wang et al. (2023b) L. Wang, C. Ma, X. Feng, Z. Zhang, H. Yang, J. Zhang, Z. Chen, J. Tang, X. Chen, Y. Lin, W. X. Zhao, Z. Wei, and J.-R. Wen. A survey on large language model based autonomous agents, 2023b.
198. Wang et al. (2023c) L. Wang, N. Yang, and F. Wei. Query2doc: Query expansion with large language models. *arXiv preprint arXiv:2303.07678*, 2023c.
199. Wang et al. (2022a) R. Wang, P. Jansen, M.-A. Côté, and P. Ammanabrolu. Scienceworld: Is your agent smarter than a 5th grader? *arXiv preprint arXiv:2203.07540*, 2022a.
200. Wang et al. (2016) S. I. Wang, P. Liang, and C. D. Manning. Learning language games through interaction. In *Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)*, pages 2368–2378, 2016.

201. Wang et al. (2022b) X. Wang, J. Wei, D. Schuurmans, Q. Le, E. Chi, and D. Zhou. Self-consistency improves chain of thought reasoning in language models. *arXiv preprint arXiv:2203.11171*, 2022b.
202. Wei et al. (2022a) J. Wei, Y. Tay, R. Bommasani, C. Raffel, B. Zoph, S. Borgeaud, D. Yogatama, M. Bosma, D. Zhou, D. Metzler, E. H. Chi, T. Hashimoto, O. Vinyals, P. Liang, J. Dean, and W. Fedus. Emergent abilities of large language models. *Transactions on Machine Learning Research*, 2022a. ISSN 2835-8856. Survey Certification.
203. Wei et al. (2022b) J. Wei, X. Wang, D. Schuurmans, M. Bosma, E. Chi, Q. Le, and D. Zhou. Chain of thought prompting elicits reasoning in large language models. *arXiv preprint arXiv:2201.11903*, 2022b.
204. Weng (2023) L. Weng. Llm-powered autonomous agents. *lilianweng.github.io*, Jun 2023. URL <https://lilianweng.github.io/posts/2023-06-23-agent/>.
205. Weston et al. (2014) J. Weston, S. Chopra, and A. Bordes. Memory networks. *arXiv preprint arXiv:1410.3916*, 2014.
206. Whitehead and Russell (1997) A. N. Whitehead and B. Russell. *Principia mathematica to* *56*, volume 2. Cambridge University Press, 1997.
207. Wilkins (2014) D. E. Wilkins. *Practical planning: extending the classical AI planning paradigm*. Elsevier, 2014.
208. Winograd (1972) T. Winograd. Understanding natural language. *Cognitive psychology*, 3(1):1–191, 1972.
209. Wong et al. (2023) L. Wong, G. Grand, A. K. Lew, N. D. Goodman, V. K. Mansinghka, J. Andreas, and J. B. Tenenbaum. From word models to world models: Translating from natural language to the probabilistic language of thought. *arXiv preprint arXiv:2306.12672*, 2023.
210. Wray et al. (2021) R. E. Wray, J. R. Kirk, J. E. Laird, et al. Language models as a knowledge source for cognitive agents. *arXiv preprint arXiv:2109.08270*, 2021.
211. Wu et al. (2023) Q. Wu, G. Bansal, J. Zhang, Y. Wu, S. Zhang, E. Zhu, B. Li, L. Jiang, X. Zhang, and C. Wang. Autogen: Enabling next-gen llm applications via multi-agent conversation framework. *arXiv preprint arXiv:2308.08155*, 2023.
212. Wu et al. (2022a) T. Wu, E. Jiang, A. Donsbach, J. Gray, A. Molina, M. Terry, and C. J. Cai. Promptchainer: Chaining large language model prompts through visual programming. In *CHI Conference on Human Factors in Computing Systems Extended Abstracts*, pages 1–10, 2022a.
213. Wu et al. (2022b) T. Wu, M. Terry, and C. J. Cai. AI chains: Transparent and controllable human-AI interaction by chaining large language model prompts. In *Proceedings of the 2022 CHI Conference on Human Factors in Computing Systems*, pages 1–22, 2022b.
214. Xi et al. (2023) Z. Xi, W. Chen, X. Guo, W. He, Y. Ding, B. Hong, M. Zhang, J. Wang, S. Jin, E. Zhou, et al. The rise and potential of large language model based agents: A survey. *arXiv preprint arXiv:2309.07864*, 2023.
215. Xia et al. (2023) Y. Xia, M. Shenoy, N. Jazdi, and M. Weyrich. Towards autonomous system: flexible modular production system enhanced with large language model agents. *arXiv preprint arXiv:2304.14721*, 2023.
216. Xie et al. (2023) Y. Xie, T. Xie, M. Lin, W. Wei, C. Li, B. Kong, L. Chen, C. Zhuo, B. Hu, and Z. Li. Olagpt: Empowering llms with human-like problem-solving abilities. *arXiv preprint arXiv:2305.16334*, 2023.
217. Xu et al. (2023a) B. Xu, X. Liu, H. Shen, Z. Han, Y. Li, M. Yue, Z. Peng, Y. Liu, Z. Yao, and D. Xu. Gentopia: A collaborative platform for tool-augmented llms. *arXiv preprint arXiv:2308.04030*, 2023a.
218. Xu et al. (2023b) B. Xu, Z. Peng, B. Lei, S. Mukherjee, Y. Liu, and D. Xu. Rewoo: Decoupling reasoning from observations for efficient augmented language models. *arXiv preprint arXiv:2305.18323*, 2023b.
219. Xu et al. (2023c) B. Xu, A. Yang, J. Lin, Q. Wang, C. Zhou, Y. Zhang, and Z. Mao. ExpertPrompting: Instructing Large Language Models to be Distinguished Experts. *arXiv preprint arXiv:2305.14688*, 2023c.
220. Yang et al. (2023) J. Yang, A. Prabhakar, K. Narasimhan, and S. Yao. Intercode: Standardizing and benchmarking interactive coding with execution feedback. *arXiv preprint arXiv:2306.14898*, 2023.
221. Yao and Narasimhan (2023) S. Yao and K. Narasimhan. Language agents in the digital world: Opportunities and risks. *princeton-nlp.github.io*, Jul 2023. URL <https://princeton-nlp.github.io/language-agent-impact/>.
222. Yao et al. (2020) S. Yao, R. Rao, M. Hausknecht, and K. Narasimhan. Keep CALM and explore: Language models for action generation in text-based games. *arXiv preprint arXiv:2010.02903*, 2020.
223. Yao et al. (2022a) S. Yao, H. Chen, J. Yang, and K. Narasimhan. Webshop: Towards scalable real-world web interaction with grounded language agents. *Advances in Neural Information Processing Systems*, 35:20744–20757, 2022a.
224. Yao et al. (2022b) S. Yao, J. Zhao, D. Yu, N. Du, I. Shafran, K. Narasimhan, and Y. Cao. React: Synergizing reasoning and acting in language models. *arXiv preprint arXiv:2210.03629*, 2022b.
225. Yao et al. (2023) S. Yao, D. Yu, J. Zhao, I. Shafran, T. L. Griffiths, Y. Cao, and K. Narasimhan. Tree of thoughts: Deliberate problem solving with large language models. *arXiv preprint arXiv:2305.10601*, 2023.
226. Zelikman et al. (2022) E. Zelikman, Y. Wu, J. Mu, and N. Goodman. STaR: Bootstrapping reasoning with reasoning. *Advances in Neural Information Processing Systems*, 35:15476–15488, 2022.
227. Zeng et al. (2022) A. Zeng, M. Attarian, B. Ichter, K. Choromanski, A. Wong, S. Welker, F. Tombari, A. Purohit, M. Ryoo, V. Sindhwani, et al. Socratic models: Composing zero-shot multimodal reasoning with language. *arXiv preprint arXiv:2204.00598*, 2022.
228. Zhang et al. (2023a) C. Zhang, L. Wong, G. Grand, and J. Tenenbaum. Grounded physical language understanding with probabilistic programs and simulated worlds. In *Proceedings of the Annual Meeting of the Cognitive Science Society*, volume 45, 2023a.
229. Zhang et al. (2023b) T. Zhang, F. Liu, J. Wong, P. Abbeel, and J. E. Gonzalez. The wisdom of hindsight makes language models better instruction followers. *arXiv preprint arXiv:2302.05206*, 2023b.
230. Zhang et al. (2020) Y. Zhang, S. Sun, M. Galley, Y.-C. Chen, C. Brockett, X. Gao, J. Gao, J. Liu, and W. B. Dolan. Dialogpt: Large-scale generative pre-training for conversational response generation. In *Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics: System Demonstrations*, pages 270–278, 2020.
231. Zhao et al. (2022) W. J. Zhao, R. Richie, and S. Bhatia. Process and content in decisions from memory. *Psychological Review*, 129(1):73, 2022.
232. Zhong et al. (2021) V. Zhong, A. W. Hanjie, S. Wang, K. Narasimhan, and L. Zettlemoyer. SILG: The Multi-domain Symbolic Interactive Language Grounding Benchmark. *Advances in Neural Information Processing Systems*, 34:21505–21519, 2021.
233. Zhou et al. (2023a) C. Y. Zhou, D. Talmi, N. Daw, and M. G. Mattar. Episodic retrieval for model-based evaluation in sequential decision tasks, 2023a.
234. Zhou et al. (2018) H. Zhou, M. Huang, T. Zhang, X. Zhu, and B. Liu. Emotional chatting machine: Emotional conversation generation with internal and external memory. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 32, 2018.
235. Zhou et al. (2022a) S. Zhou, U. Alon, F. F. Xu, Z. Jiang, and G. Neubig. Docprompting: Generating code by retrieving the docs. In *The Eleventh International Conference on Learning Representations*, 2022a.
236. Zhou et al. (2023b) S. Zhou, F. F. Xu, H. Zhu, X. Zhou, R. Lo, A. Sridhar, X. Cheng, Y. Bisk, D. Fried, U. Alon, et al. WebArena: A Realistic Web Environment for Building Autonomous Agents. *arXiv preprint arXiv:2307.13854*, 2023b.
237. Zhou et al. (2022b) Y. Zhou, A. I. Muresanu, Z. Han, K. Paster, S. Pitis, H. Chan, and J. Ba. Large language models are human-level prompt engineers. *arXiv preprint arXiv:2211.01910*, 2022b.
