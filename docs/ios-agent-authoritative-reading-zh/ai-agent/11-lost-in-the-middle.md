# 迷失在中间：语言模型如何使用长上下文

- **原文标题**：Lost in the Middle: How Language Models Use Long Contexts
- **作者**：Nelson F. Liu、Kevin Lin、John Hewitt、Ashwin Paranjape、Michele Bevilacqua、Fabio Petroni、Percy Liang
- **机构**：Stanford University、University of California, Berkeley、Samaya AI
- **正式版本**：*Transactions of the Association for Computational Linguistics*，Volume 12，2024，pp. 157–173
- **DOI**：[10.1162/tacl_a_00638](https://doi.org/10.1162/tacl_a_00638)
- **原文页面**：[ACL Anthology：2024.tacl-1.9](https://aclanthology.org/2024.tacl-1.9/)
- **正式 PDF**：[Lost in the Middle: How Language Models Use Long Contexts](https://aclanthology.org/2024.tacl-1.9.pdf)
- **原文许可**：[Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/)
- **翻译日期**：2026-07-27
- **译文说明**：本文是非官方中文翻译，未获作者、TACL、MIT Press 或 ACL Anthology 背书。本译文属于对 CC BY 4.0 原文的中文改编，已在此明确标明修改；模型名、数据集名、实验数值、公式、引用关系和英文书目信息保持不变。图像不另行重制，以正式 PDF 的绝对页链接指向原图，并完整翻译图题和图注。正式 PDF 未设置独立的 “Limitations” 章节，因此本译文不另行增设；原文的 “Acknowledgments” 则按正式章节保留。
- **编辑与版本信息**：Action Editor：Luke Zettlemoyer；投稿批次：2023 年 8 月；修订批次：2023 年 10 月；发表于 2024 年 2 月。

作者脚注：Nelson F. Liu 的部分工作是在 Samaya AI 实习期间完成。

## 摘要

尽管近期语言模型已经能够接收长上下文作为输入，但我们对于它们能在多大程度上有效使用更长上下文，仍然知之甚少。我们分析语言模型在两项任务上的表现；这两项任务都要求模型识别输入上下文中的相关信息：多文档问答和键值检索。

我们发现，只要改变相关信息的位置，模型表现就可能显著下降；这表明当前语言模型无法稳健地利用长输入上下文中的信息。具体而言，当相关信息位于输入上下文开头或结尾时，性能通常最高；当模型必须访问长上下文中部的相关信息时，性能会显著下降，即使是明确为长上下文设计的模型也不例外。

我们的分析加深了对语言模型如何使用输入上下文的理解，并为未来的长上下文语言模型提供了新的评估协议。

## 1 引言

语言模型已经成为许多面向用户的语言技术中重要而灵活的基础组件，包括对话界面、搜索与摘要，以及协作写作（Shuster et al., 2022；Thoppilan et al., 2022；Lee et al., 2022 等）。这些模型主要通过提示来执行下游任务：所有相关的任务说明和待处理数据都会被组织成文本输入上下文，模型随后返回生成的文本补全。

这些输入上下文可能包含数千个 token，尤其是在语言模型被用于处理长文档——例如法律或科学文档、对话历史等——或者通过外部信息增强时——例如搜索引擎返回的相关文档、数据库查询结果等（Petroni et al., 2020；Ram et al., 2023；Shi et al., 2023；Mallen et al., 2023；Schick et al., 2023 等）。

处理这些使用场景要求语言模型能够在长序列上成功工作。现有语言模型通常通过 Transformer（Vaswani et al., 2017）实现，而 Transformer 所需的内存和计算量会随序列长度呈二次增长。因此，Transformer 语言模型过去往往使用相对较小的上下文窗口进行训练，通常为 512 到 2048 token。

近年来，硬件改进——例如速度更快、内存更大的 GPU——以及算法进步（Dai et al., 2019；Dao et al., 2022；Poli et al., 2023；Rubin and Berant, 2023 等），催生了具有更大上下文窗口的语言模型，例如 4096、32K，甚至 100K token。然而，当这些扩展上下文模型执行下游任务时，它们究竟如何使用输入上下文，仍不明确。

我们通过一系列受控实验，对这个问题进行实证研究。实验涵盖多种最先进的开放模型——MPT-30B-Instruct、LongChat-13B（16K）——以及闭源模型——OpenAI 的 GPT-3.5-Turbo、Anthropic 的 Claude-1.3；所选设置都要求模型访问并使用输入上下文中的信息。具体而言，我们有控制地改变输入上下文大小和相关信息在输入上下文中的位置，并研究这些变化对语言模型性能的影响。如果语言模型能够稳健使用长输入上下文中的信息，那么相关信息的位置应该只会对性能产生很小影响。

我们首先研究多文档问答。该任务要求模型在给定文档中进行推理，找出相关信息并用它回答问题；它模拟了许多商业生成式搜索和问答应用——例如 Bing Chat——底层所采用的检索增强生成设置。在这个场景中，我们控制两个因素：

1. 通过改变输入上下文中的文档数量来控制上下文长度，这类似于在检索增强生成中检索更多或更少文档。
2. 通过调整文档顺序，把相关文档放在上下文开头、中间或结尾，从而控制相关信息的位置。

我们发现，改变相关信息在输入上下文中的位置会显著影响模型表现，这表明当前语言模型无法稳健地访问和使用长输入上下文中的信息。此外，我们观察到一条鲜明的 U 形性能曲线（图 1）：当相关信息位于输入上下文最开头时——首因偏差（primacy bias）——或最末尾时——近因偏差（recency bias）——语言模型表现最高；当模型必须访问并使用输入上下文中部的信息时，性能显著下降。

[查看正式 PDF 中的图 1（第 2 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=2)

**图 1。** 改变相关信息的位置——在这里，就是改变能够回答输入问题的段落位置——会让语言模型呈现 U 形性能曲线。模型更善于使用出现在输入上下文最开头（首因偏差）或结尾（近因偏差）的相关信息；当模型必须访问并使用位于输入上下文中部的信息时，性能会显著下降。

例如，当相关信息被放在输入上下文中部时，GPT-3.5-Turbo 在多文档问答任务上的表现，甚至低于不提供任何文档时的表现，也就是闭卷设置下的 56.1%。我们还发现，模型的表现经常与其扩展上下文版本完全相同；这说明扩展上下文模型未必更擅长使用输入上下文。

既然语言模型难以在多文档问答任务中检索和使用相关信息，那么，它们究竟能在多大程度上从输入上下文中完成最基本的检索？我们通过一项合成键值检索任务研究这个问题。该任务被设计为一个最小测试平台，用来检验从输入上下文中检索匹配 token 的基本能力。

在这项任务中，模型会得到一组以 JSON 格式表示的键值对，并必须返回与特定键关联的值。与多文档问答任务类似，键值检索任务也允许我们有控制地改变输入上下文长度——加入更多键值对——以及相关信息的位置。尽管一些模型能够完美完成合成键值检索，另一些模型却连检索输入上下文中部的匹配 token 都很困难，并继续呈现 U 形性能曲线。

为了更好地理解语言模型为何难以稳健地访问和使用输入上下文中的信息，我们研究了模型架构——仅解码器与编码器-解码器——、查询感知上下文化，以及指令微调所起的作用。我们发现：

- 编码器-解码器模型对输入上下文中相关信息位置的变化相对稳健，但仅限于在不超过训练时序列长度的序列上进行评估。当评估序列比训练时见过的更长时，我们仍会观察到 U 形性能曲线（第 4.1 节）。
- 查询感知上下文化——把查询同时放在文档或键值对的前后——可以让模型在合成键值任务上达到近乎完美的表现，但对多文档问答中的总体趋势影响很小（第 4.2 节）。
- 即使是基础语言模型，也就是没有经过指令微调的模型，在我们改变相关信息在输入上下文中的位置时，也会呈现 U 形性能曲线。

我们的结果表明，使用更长输入上下文来提示语言模型是一项权衡：为语言模型提供更多信息，可能帮助它完成下游任务；但这也增加了模型必须推理的内容量，反而可能降低准确率。

为了理解这项权衡在实践中的表现，我们在开放域问答上对检索器-阅读器模型进行了案例研究（第 5 节）。与受控的多文档问答任务不同，后者的上下文始终恰好包含一篇能够回答问题的文档；在开放域问答中，排名前 $k$ 的文档可能一篇也不含答案，也可能有多篇含答案。

在 Wikipedia 中检索材料来回答 NaturalQuestions-Open 的查询时，我们发现，模型性能早在检索器召回率饱和之前就已经饱和。这表明当前模型无法有效使用额外检索到的文档：把检索文档数从 20 增加到 50，只会带来很小的性能提升——GPT-3.5-Turbo 约为 1.5%，Claude-1.3 约为 1%。

我们的分析加深了对语言模型如何使用输入上下文的理解，并为未来的长上下文模型提出了新的评估协议。若要声称一种语言模型可以稳健使用长输入上下文中的信息，就必须证明相关信息的位置只会对其表现造成极小影响，例如最佳与最差情形之间差距很小。

为了推动后续研究，帮助理解并改进语言模型使用输入上下文的方式，我们公开了代码和评估数据。

脚注 1：[nelsonliu.me/papers/lost-in-the-middle](https://nelsonliu.me/papers/lost-in-the-middle/)。

## 2 多文档问答

我们的目标是更好地理解语言模型如何使用输入上下文。为此，我们分析模型在多文档问答上的表现。该任务要求模型从输入上下文中找出相关信息，并用它回答问题。具体而言，我们有控制地改变输入上下文的长度和相关信息的位置，再测量任务表现如何变化。

### 2.1 实验设置

在多文档问答任务中，模型输入包括：（1）一个需要回答的问题；（2）$k$ 篇文档，例如 Wikipedia 段落。其中恰好有一篇文档包含问题答案，其余 $k-1$ 篇“干扰”文档不包含答案。这项任务要求模型访问输入上下文中包含答案的文档，并用它回答问题。图 2 给出一个示例。

[查看正式 PDF 中的图 2（第 4 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=4)

**图 2。** 多文档问答任务示例，其中包含输入上下文和期望的模型答案。为便于理解，图中把输入上下文里包含答案的文档加粗显示。

我们使用 NaturalQuestions-Open（Lee et al., 2019；Kwiatkowski et al., 2019）的数据实例化这项任务。该数据集包含历史上提交给 Google 搜索引擎的查询，以及从 Wikipedia 中提取、由人工标注的答案。具体而言，我们选取 2,655 个查询；这些查询所标注的长答案都是一个段落，而不是列表或表格。

我们把 Wikipedia 段落——每个切分片段最多 100 token——作为输入上下文中的文档。对于每个查询，我们需要一篇包含答案的文档，以及 $k-1$ 篇不含答案的干扰文档。为获得回答问题的文档，我们使用 NaturalQuestions 标注中包含答案的 Wikipedia 段落。

为收集不包含答案的 $k-1$ 篇干扰文档，我们使用一个检索系统——在 MS-MARCO 上微调的 Contriever（Izacard et al., 2021）——检索与查询最相关、且不包含任何 NaturalQuestions 标注答案的 $k-1$ 个 Wikipedia 文本块。输入上下文中的干扰文档按相关性递减的顺序排列。

脚注 2：NaturalQuestions-Open 中存在歧义，因此少量干扰段落可能包含合理答案。我们还在无歧义问题的子集上运行实验，得到相似的结果和结论；见附录 A。

脚注 3：我们也探索了使用随机文档作为干扰项；更多细节见附录 B。

为了调节相关信息在输入上下文中的位置，我们调整文档顺序，改变包含答案的文档所在位置（图 3）。为了调节这项任务的输入上下文长度，我们增加或减少不含答案的检索文档数量（图 4）。

[查看正式 PDF 中的图 3 和图 4（第 4 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=4)

**图 3。** 对图 2 所示的多文档问答示例，调节相关信息在输入上下文中的位置。重新排列输入上下文中的文档不会改变期望输出。

**图 4。** 对图 2 所示的多文档问答示例，调节输入上下文长度。加入不含答案的文档会增加输入上下文长度，但不会改变期望输出。

按照 Kandpal et al.（2022）和 Mallen et al.（2023），我们把准确率作为主要评估指标，判断 NaturalQuestions 标注中的任意一个正确答案是否出现在预测输出中。

我们的实验设置与 Ivgi et al.（2023）的“大海捞针”实验相似；他们比较相关段落被放在输入（1）开头或（2）随机位置时的问答表现，并发现，当相关信息位于输入上下文开头时，编码器-解码器模型的表现明显更高。与之不同，我们研究相关信息位置的细粒度变化。

脚注 4：由于模型可能预期“搜索结果”按排名顺序出现，我们也尝试随机排列 $k-1$ 篇干扰文档，并在任务描述中说明文档顺序随机；结果仍呈现相同趋势。更多细节见附录 C。

### 2.2 模型

我们分析多种最先进的开放和闭源语言模型，并在生成输出时使用贪心解码；其他解码方法留待未来研究。每个模型都使用一套标准提示词，见图 2。

**开放模型。** 我们实验的 MPT-30B-Instruct 最大上下文长度为 8,192 token。该模型最初使用 2,048-token 序列，在 1 万亿 token 上进行预训练；随后又经历一个序列长度适配预训练阶段，使用 8,192-token 序列在 500 亿 token 上训练。MPT-30B-Instruct 使用 ALiBi（Press et al., 2022）表示位置信息。

我们还评估 LongChat-13B（16K）（Li et al., 2023）。它先使用压缩旋转位置嵌入，把 LLaMA-13B（Touvron et al., 2023a）的上下文窗口从 2,048 扩展到 16,384 token，再使用 16,384-token 序列进行微调。

**闭源模型。** 我们通过 OpenAI API 对 GPT-3.5-Turbo 和 GPT-3.5-Turbo（16K）进行实验。GPT-3.5-Turbo 的最大上下文长度为 4K token；GPT-3.5-Turbo（16K）是最大上下文长度扩展到 16K token 的版本。我们还通过 Anthropic API 评估 Claude-1.3 和 Claude-1.3（100K）；Claude-1.3 的最大上下文长度为 8K token，Claude-1.3（100K）则扩展到 100K token。

脚注 5：我们使用 OpenAI 模型的 `0613` 版本。

脚注 6：我们也在多文档问答实验的一个子集上评估 GPT-4（8K），观察到与其他模型相似的结果和趋势，尽管 GPT-4 的绝对表现更高。在完整的多文档问答和键值检索实验上评估 GPT-4，成本会超过 6,000 美元。GPT-4 的结果与讨论见附录 D。

### 2.3 结果与讨论

我们使用包含 10、20 和 30 篇文档的输入上下文进行实验。图 5 展示了改变相关信息位置时的多文档问答表现。为了给模型表现提供参照，我们还评估闭卷和 Oracle 设置，结果见表 1。

在闭卷设置中，模型的输入上下文中不包含任何文档，必须依赖参数记忆生成正确答案。在 Oracle 设置中，语言模型只获得包含答案的那一篇文档，并必须用它回答问题。

[查看正式 PDF 中的图 5 和表 1（第 5 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=5)

**图 5。** 改变相关信息——包含答案的文档——的位置，对多文档问答表现的影响。位置值越小，越靠近输入上下文开头。当相关信息位于上下文最开头或结尾时，表现最高；当模型必须对输入上下文中部的信息进行推理时，表现迅速下降。

**表 1。语言模型在多文档问答任务上的闭卷准确率和 Oracle 准确率。**

| 模型 | 闭卷 | Oracle |
|---|---:|---:|
| LongChat-13B（16K） | 35.0% | 83.4% |
| MPT-30B-Instruct | 31.5% | 81.9% |
| GPT-3.5-Turbo | 56.1% | 88.3% |
| GPT-3.5-Turbo（16K） | 56.0% | 88.6% |
| Claude-1.3 | 48.3% | 76.1% |
| Claude-1.3（100K） | 48.2% | 76.4% |

**当相关信息位于输入上下文开头或结尾时，模型表现最高。** 如图 5 所示，改变相关信息在输入上下文中的位置，会使模型表现大幅下降。具体而言，我们看到鲜明的 U 形性能曲线：模型通常更善于利用出现在上下文最开头（首因偏差）和最末尾（近因偏差）的相关信息；当被迫使用上下文中部的信息时，表现会下降。

例如，GPT-3.5-Turbo 的多文档问答表现可能下降超过 20%；在最差情况下，它在 20 和 30 篇文档设置下的表现，低于没有任何输入文档时的表现，也就是 56.1% 的闭卷表现。这些结果表明，在通过提示执行下游任务时，当前模型无法在整个上下文窗口上进行有效推理。

**扩展上下文模型未必更擅长使用输入上下文。** 当输入上下文同时能装进普通模型及其扩展上下文版本时，两者的表现几乎完全相同。例如，10 篇和 20 篇文档的设置都能装进 GPT-3.5-Turbo 和 GPT-3.5-Turbo（16K）的上下文窗口；我们观察到，两者随相关信息位置变化的性能曲线几乎重合，即图 5 中的紫色实线和棕色虚线。这些结果说明，扩展上下文模型在使用输入上下文方面，不一定优于未扩展版本。

## 3 语言模型从输入上下文中检索信息的能力有多强？

既然语言模型难以从输入上下文中部检索并使用信息，那么，它们从输入上下文中执行简单检索的能力究竟如何？我们通过合成键值检索任务研究这个问题；该任务为从输入上下文中检索匹配 token 的基本能力提供一个最小测试平台。

### 3.1 实验设置

在合成键值检索任务中，输入包括：（1）一个序列化为字符串、包含 $k$ 个键值对的 JSON 对象，其中每个键和值都是唯一、随机生成的 UUID；（2）上述 JSON 对象中的一个键。目标是返回指定键所关联的值。因此，每个 JSON 对象都包含一个相关键值对——需要返回它的值——以及 $k-1$ 个无关的“干扰”键值对。图 6 给出输入上下文及对应期望输出的示例。

[查看正式 PDF 中的图 6（第 6 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=6)

**图 6。** 键值检索任务示例，其中包含输入上下文和期望的模型输出。给定一个键，目标是返回与其关联的值。所有键和值都是 128 位 UUID。为便于理解，图中把回答查询所需的相关键值对加粗显示。

我们仍以准确率作为指标，判断正确的值是否出现在预测输出中。我们的合成键值检索任务与 Papailiopoulos et al.（2023）的 Little Retrieval Test，以及 Li et al.（2023）的细粒度行检索任务目标相似。不过，我们明确尝试通过去除尽可能多的自然语言语义——改用随机 UUID——来提炼和简化任务，因为语言特征可能成为潜在混杂因素。例如，Transformer 语言模型对输入中不同语言特征的敏感度可能不同（O’Connor and Andreas, 2021）。

为了调节相关信息的位置，我们改变待检索键在序列化 JSON 对象中的位置。为了调节输入上下文长度，我们加入或移除随机键，改变输入 JSON 键值对数量 $k$，也就是改变干扰键值对的数量。

### 3.2 结果与讨论

我们使用包含 75、140 和 300 个键值对的输入上下文进行实验，每种设置包含 500 个示例。模型集合与多文档问答实验相同，更多细节见第 2.2 节。

[查看正式 PDF 中的图 7（第 7 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=7)

**图 7。** 改变输入上下文长度和相关信息位置，对键值检索表现的影响。位置值越小，越靠近输入上下文开头。尽管有些模型在这项合成任务上达到完美准确率，例如 Claude-1.3 和 Claude-1.3（100K），但我们再次看到，相关信息位于上下文最开头或结尾时，模型表现通常最高；当模型必须从输入上下文中部检索时，表现迅速下降。

Claude-1.3 和 Claude-1.3（100K）在所有评估的输入上下文长度上都几乎达到完美表现；但其他模型会遇到困难，尤其是在包含 140 或 300 个键值对的上下文中。尽管合成键值检索只要求在输入上下文中识别完全匹配，并非所有模型都能达到高性能。

与多文档问答结果类似，当 GPT-3.5-Turbo、GPT-3.5-Turbo（16K）和 MPT-30B-Instruct 必须访问输入上下文中部的键值对时，它们的表现最低。LongChat-13B（16K）在 140 个键值对设置中呈现不同趋势；通过定性观察我们发现，当相关信息被放在输入上下文开头时，LongChat-13B（16K）往往会生成用于检索键的代码，而不是直接输出值。

## 4 为什么语言模型无法稳健应对相关信息位置的变化？

多文档问答和键值检索结果表明，语言模型难以稳健地访问和使用长输入上下文中的信息，因为改变相关信息的位置会显著降低模型表现。为了进一步理解原因，我们对模型架构——仅解码器与编码器-解码器——、查询感知上下文化和指令微调的作用进行了初步研究。

### 4.1 模型架构的影响

我们评估的开放模型都是仅解码器模型：在每个时间步，它们只能注意之前的 token。为了更好地理解模型架构可能如何影响语言模型使用上下文，我们比较仅解码器与编码器-解码器语言模型。

我们对 Flan-T5-XXL（Raffel et al., 2020；Chung et al., 2022）和 Flan-UL2（Tay et al., 2023）进行实验。Flan-T5-XXL 使用 512-token 序列训练，其编码器和解码器均如此。Flan-UL2 最初也使用 512-token 序列训练；随后在指令微调之前，又额外预训练 100K 步，其中编码器和解码器都使用 1,024 token；指令微调时，编码器序列长度为 2,048 token，解码器为 512 token。

不过，由于这些模型使用相对位置嵌入，它们原则上可以外推到超过上述最大上下文长度；Shaham et al.（2023）发现，两种模型都能在最长 8K token 的序列上取得良好表现。

[查看正式 PDF 中的图 8（第 8 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=8)

**图 8。** 当编码器-解码器模型 Flan-UL2 和 Flan-T5-XXL 在短于其编码器训练时最大序列长度——分别为 2,048 和 512 token——的序列上评估时，它们对输入上下文中相关信息位置的变化相对稳健，见左侧子图。相反，当评估序列比训练时见过的更长时，见中间和右侧子图，我们会观察到 U 形性能曲线：相关信息位于输入上下文开头或结尾时，表现高于位于中部时。

当 Flan-UL2 在 2,048-token 的训练时上下文窗口以内进行评估时，见图 8 左侧子图，它对相关信息位置变化的表现相对稳健，最佳和最差表现之间的绝对差距为 1.9%。当设置中的序列长度超过 2,048 token 时，见图 8 中间和右侧，若相关信息位于中部，Flan-UL2 的表现开始下降。

Flan-T5-XXL 呈现相似趋势：输入上下文越长，把相关信息放在输入上下文中部所造成的性能下降越大。我们推测，编码器-解码器模型可能更充分地使用上下文窗口，因为双向编码器允许模型在后续文档的上下文中处理每篇文档，从而可能改善文档之间相对重要性的估计。

### 4.2 查询感知上下文化的影响

我们的多文档问答和键值检索实验都把查询——即需要回答的问题或需要检索的键——放在待处理数据——即文档或键值对——之后。因此，仅解码器模型在对文档或键值对进行上下文化时，无法注意查询 token：查询只出现在提示词末尾，而仅解码器模型在每个时间步只能注意此前的 token。

相比之下，编码器-解码器模型使用双向编码器对输入上下文进行上下文化；它们似乎也更能稳健应对相关信息位置的变化，见第 4.1 节。由此产生一个问题：如果把查询同时放在数据之前和之后，让仅解码器模型也能对文档或键值对执行查询感知上下文化，是否可以改善其表现？

我们发现，查询感知上下文化大幅改善了键值检索任务的表现：所有模型在 75、140 和 300 个键值对设置中都达到近乎完美的表现。例如，使用查询感知上下文化后，GPT-3.5-Turbo（16K）在包含 300 个键值对的评估中达到完美表现；相比之下，不使用查询感知上下文化时，它的最差表现只有 45.6%，见图 7。

尽管查询感知上下文化对键值检索影响显著，它对多文档问答任务中的性能趋势影响很小，见图 9：当相关信息恰好位于输入上下文最开头时，表现略有提升；在其他设置中，表现反而略有下降。

[查看正式 PDF 中的图 9（第 9 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=9)

**图 9。** 查询感知上下文化——把查询同时放在文档之前和之后——并未显著增强语言模型应对多文档问答中相关信息位置变化的稳健性；当相关信息恰好位于最开头时，表现略有提升，但在其他位置略有下降。

### 4.3 指令微调的影响

我们评估的模型都经过指令微调：在初始预训练之后，它们还会在由指令及回答组成的数据集上接受监督微调。监督式指令微调数据通常把任务说明和/或指令放在输入上下文开头，这可能促使经过指令微调的语言模型更加重视输入上下文的开头。

为了更好地理解指令微调可能如何影响语言模型使用长输入上下文，我们比较 MPT-30B-Instruct 与其基础模型——即指令微调前的 MPT-30B——在多文档问答上的表现。实验设置与第 2 节相同。

[查看正式 PDF 中的图 10（第 9 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=9)

**图 10。** MPT-30B-Instruct 与其基础模型——即指令微调前的 MPT-30B——在多文档问答上的表现。两个模型都呈现 U 形性能曲线：相关信息位于输入上下文开头或结尾时，表现明显更高。这说明，指令微调过程本身未必是这些性能趋势的成因。

图 10 比较了 MPT-30B 和 MPT-30B-Instruct 的多文档问答表现如何随相关信息位置变化。令人意外的是，MPT-30B 和 MPT-30B-Instruct 都呈现 U 形性能曲线：当相关信息位于上下文最开头或最末尾时，表现最高。

尽管 MPT-30B-Instruct 的绝对表现始终高于 MPT-30B，两者的总体性能趋势却很相似。我们还观察到，指令微调使最佳与最差情形之间的性能差距从基础模型的近 10% 略微缩小到约 4%。

这些观察补充了以往研究。此前工作发现，未经指令微调的语言模型偏向近期 token，即输入上下文末尾的 token（Khandelwal et al., 2018；Press et al., 2021）。这种近因偏差曾在连续文本的下一词预测评估中被观察到；在这种设置中，语言模型从长距离信息获得的收益很小（Sun et al., 2021）。

与此相对，我们的结果表明，当使用指令格式的数据提示语言模型时，它们能够使用距离更远的信息，即输入上下文开头的信息。我们推测，未经指令微调的语言模型可能从预训练期间见过的类似格式的互联网文本中学会使用这些长上下文，例如 Stack Overflow 上的问答。

为了进一步理解额外微调和模型规模的影响，我们还对不同规模——7B、13B 和 70B——的 Llama-2 模型进行了实验，分别考察不带和带有额外监督微调及人类反馈强化学习的版本，见附录 E。

我们发现，只有足够大的语言模型——无论是否接受额外微调——才会呈现 U 形性能曲线。7B Llama-2 模型只有近因偏差；13B 和 70B 模型则呈现 U 形性能曲线。此外，Llama-2 的监督微调与人类反馈强化学习流程，会略微缓解较小模型——13B，与 MPT-30B 和 MPT-30B-Instruct 的对比趋势相似——的位置偏差，但对较大模型——70B——的趋势影响很小。

## 5 更多上下文总是更好吗？开放域问答案例研究

我们的结果表明，用更长输入上下文提示语言模型是一项权衡：为语言模型提供更多信息可能有助于它完成下游任务，但同时也增加了模型必须推理的内容量，可能降低准确率。即便一个语言模型能够接收 16K token 的上下文，向它提供 16K token 的上下文是否真的有益？

这个问题的答案最终取决于具体下游任务，因为它取决于新增上下文的边际价值，以及模型有效使用长输入上下文的能力。不过，我们在 NaturalQuestions-Open 的开放域问答上进行了案例研究，以进一步理解现有语言模型中的这项权衡。

我们在标准的检索器-阅读器设置中使用语言模型。检索系统——在 MS-MARCO 上微调的 Contriever——接收 NaturalQuestions-Open 中的一条输入查询，并返回与其相关性得分最高的 $k$ 篇 Wikipedia 文档。为了让语言模型以这些检索文档为条件，我们直接把它们放进提示词。

我们改变检索文档数量 $k$，评估检索器召回率和阅读器准确率；后者判断任意一个标注答案是否出现在预测输出中。我们使用 NaturalQuestions-Open 的一个子集，其中长答案为段落，而不是表格或列表。

[查看正式 PDF 中的图 11（第 10 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=10)

**图 11。** 检索器召回率和模型表现随检索文档数量变化的情况。模型表现远早于检索器召回率达到饱和，这说明模型难以利用额外检索到的文档。

图 11 展示检索器召回率和开放域问答结果。阅读器模型的表现远早于检索器表现达到饱和，这说明阅读器没有有效使用额外上下文。使用超过 20 篇检索文档，只会让阅读器表现略有提升——GPT-3.5-Turbo 约为 1.5%，Claude-1.3 约为 1%——却会显著增加输入上下文长度，从而增加延迟和成本。

结合“模型通常更善于检索和使用输入上下文开头或结尾的信息”这一观察，这些结果表明，有效重排检索文档——把相关信息推向输入上下文开头——或截断排序列表——在适当情况下减少检索文档数量；Arampatzis et al., 2009——可能是改善语言模型阅读器使用检索上下文方式的可行方向。

## 6 相关工作

### 6.1 长上下文语言模型

此前有大量工作致力于设计高性能语言模型，使其计算开销随上下文长度增长得比 Transformer 更慢。许多研究探索带有注意力机制改动的 Transformer 变体，例如引入循环机制（Dai et al., 2019）、把注意力分解为计算成本更低的近似形式（Beltagy et al., 2020；Zaheer et al., 2020），或者使用低秩近似（Wang et al., 2020；Peng et al., 2021）。

Dao et al.（2022）则通过精心设计、具备 IO 感知能力的 CUDA 内核，提供更快的精确注意力。另一些工作尝试彻底移除注意力机制，以消除序列长度的二次复杂度，通常采用卷积和/或线性 RNN，例如 RWKV（Peng, 2023）、S4（Gu et al., 2022）或 Hyena（Poli et al., 2023）。

许多既有研究使用多样化网络语料上的困惑度作为处理长上下文能力的代理指标；本文则表明，在长上下文中精确访问知识，可能是一项额外挑战。

### 6.2 语言模型如何使用上下文？

Khandelwal et al.（2018）的开创性研究表明，小型 LSTM 语言模型对较长距离上下文的使用会越来越粗略；Sankar et al.（2019）在对话模型中发现了类似结果。与此一脉相承，Daniluk et al.（2017）发现，带注意力的 LSTM 语言模型往往主要使用近期历史。

Petroni et al.（2020）是最早展示下述方法潜力的研究之一：把信息检索系统提供的上下文与预训练语言模型结合起来，用于无监督问答。O’Connor and Andreas（2021）发现，许多会破坏信息的操作，对 Transformer 语言模型的预测影响很小。Krishna et al.（2022）发现，中等规模 Transformer 语言模型的长上下文神经生成会发生退化，原因是模型未能正确地以长上下文为条件。

最后，在长上下文模型研究中，Sun et al.（2021）发现，更长上下文只会改善少数 token 的预测。这项实证发现与 Sharan et al.（2018）的理论一致：他们证明，互信息有界的序列分布必然使越来越长的上下文只带来很小的平均预测收益。

Qin et al.（2023）分析高效 Transformer 在多种长上下文下游 NLP 任务上的表现，发现长上下文 Transformer 具有近因偏差，且无法有效使用远距离上下文。

### 6.3 序列位置效应

我们在本文中观察到的 U 形曲线，与心理学中的“序列位置效应”存在联系（Ebbinghaus, 1913；Murdock Jr, 1962）。该效应指出，在对列表元素进行自由联想回忆时，人类往往最容易记住列表开头和结尾的元素。序列位置效应在理解人类如何发展短期与长期记忆方面发挥作用。

在语言模型中观察到类似序列位置的效应或许令人惊讶，因为作为 Transformer 语言模型基础的自注意力机制，从技术上说能够同等地从上下文中检索任何 token。

## 7 结论

我们通过一系列受控实验，对语言模型如何使用长输入上下文进行了实证研究。我们表明，改变相关信息的位置会显著降低语言模型表现，这说明模型难以稳健地访问和使用长输入上下文中的信息。具体而言，当模型必须使用长输入上下文中部的信息时，表现通常最低。

为了进一步理解不同因素如何影响语言模型使用上下文的方式，我们对以下三方面的作用进行了初步研究：（1）模型架构；（2）查询感知上下文化；（3）指令微调。

最后，我们通过开放域问答案例研究收束全文，并发现语言模型阅读器的表现远早于检索器召回率达到饱和。我们的结果与分析，加深了对语言模型如何使用输入上下文的理解，也为未来的长上下文模型提供了新的评估协议。

## 致谢

感谢 Luke Zettlemoyer 担任本文的 TACL Action Editor，也感谢匿名审稿人提出意见和反馈。我们还感谢 Claudiu Leoveanu-Condrei、Megan Leszczynski、Dmytro Okhonko、Maithra Raghu、Eric Wallace 和 Sang Michael Xie 提供反馈并参与讨论，帮助改进本文。此外，感谢 Sewon Min 在 AmbigQA 数据集方面给予帮助。

本研究得到 Stanford Center for Research on Foundation Models（CRFM）的支持；OpenAI 通过向 Stanford CRFM 提供 API credits grant 支持本研究；Anthropic 通过 Claude academic access program 支持本研究。

## 参考文献

1. Avi Arampatzis, Jaap Kamps, and Stephen Robertson. 2009. Where to stop reading a ranked list? Threshold optimization using truncated score distributions. In *Proceedings of SIGIR*. [https://doi.org/10.1145/1571941.1572031](https://doi.org/10.1145/1571941.1572031)
2. Iz Beltagy, Matthew E. Peters, and Arman Cohan. 2020. Longformer: The long-document transformer. *ArXiv:2004.05150*.
3. Hyung Won Chung, Le Hou, Shayne Longpre, Barret Zoph, Yi Tay, William Fedus, Yunxuan Li, Xuezhi Wang, Mostafa Dehghani, Siddhartha Brahma, Albert Webson, Shixiang Shane Gu, Zhuyun Dai, Mirac Suzgun, Xinyun Chen, Aakanksha Chowdhery, Alex Castro-Ros, Marie Pellat, Kevin Robinson, Dasha Valter, Sharan Narang, Gaurav Mishra, Adams Yu, Vincent Zhao, Yanping Huang, Andrew Dai, Hongkun Yu, Slav Petrov, Ed H. Chi, Jeff Dean, Jacob Devlin, Adam Roberts, Denny Zhou, Quoc V. Le, and Jason Wei. 2022. Scaling instruction-finetuned language models. *ArXiv:2210.11416*.
4. Zihang Dai, Zhilin Yang, Yiming Yang, Jaime Carbonell, Quoc Le, and Ruslan Salakhutdinov. 2019. Transformer-XL: Attentive language models beyond a fixed-length context. In *Proceedings of ACL*. [https://doi.org/10.18653/v1/P19-1285](https://doi.org/10.18653/v1/P19-1285)
5. Michał Daniluk, Tim Rocktäschel, Johannes Welbl, and Sebastian Riedel. 2017. Frustratingly short attention spans in neural language modeling. In *Proceedings of ICLR*.
6. Tri Dao, Daniel Y. Fu, Stefano Ermon, Atri Rudra, and Christopher Ré. 2022. FlashAttention: Fast and memory-efficient exact attention with IO-awareness. *ArXiv:2205.14135*.
7. Hermann Ebbinghaus. 1913. *Memory: A contribution to experimental psychology*. H. A. Ruger & C. E. Bussenius, Trans. [https://doi.org/10.1037/10011-000](https://doi.org/10.1037/10011-000)
8. Albert Gu, Karan Goel, and Christopher Ré. 2022. Efficiently modeling long sequences with structured state spaces. In *Proceedings of ICLR*.
9. Maor Ivgi, Uri Shaham, and Jonathan Berant. 2023. Efficient long-text understanding with short-text models. *Transactions of the Association for Computational Linguistics*, 11:284–299. [https://doi.org/10.1162/tacl_a_00547](https://doi.org/10.1162/tacl_a_00547)
10. Gautier Izacard, Mathilde Caron, Lucas Hosseini, Sebastian Riedel, Piotr Bojanowski, Armand Joulin, and Edouard Grave. 2021. Unsupervised dense information retrieval with contrastive learning. *ArXiv:2112.09118*.
11. Gautier Izacard and Edouard Grave. 2021. Leveraging passage retrieval with generative models for open domain question answering. In *Proceedings of EACL*. [https://doi.org/10.18653/v1/2021.eacl-main.74](https://doi.org/10.18653/v1/2021.eacl-main.74)
12. Nikhil Kandpal, Haikang Deng, Adam Roberts, Eric Wallace, and Colin Raffel. 2022. Large language models struggle to learn long-tail knowledge. *ArXiv:2211.08411*.
13. Urvashi Khandelwal, He He, Peng Qi, and Dan Jurafsky. 2018. Sharp nearby, fuzzy far away: How neural language models use context. In *Proceedings of ACL*. [https://doi.org/10.18653/v1/P18-1027](https://doi.org/10.18653/v1/P18-1027)
14. Kalpesh Krishna, Yapei Chang, John Wieting, and Mohit Iyyer. 2022. RankGen: Improving text generation with large ranking models. In *Proceedings of EMNLP*. [https://doi.org/10.18653/v1/2022.emnlp-main.15](https://doi.org/10.18653/v1/2022.emnlp-main.15)
15. Tom Kwiatkowski, Jennimaria Palomaki, Olivia Redfield, Michael Collins, Ankur Parikh, Chris Alberti, Danielle Epstein, Illia Polosukhin, Jacob Devlin, Kenton Lee, Kristina Toutanova, Llion Jones, Matthew Kelcey, Ming-Wei Chang, Andrew M. Dai, Jakob Uszkoreit, Quoc Le, and Slav Petrov. 2019. Natural Questions: A benchmark for question answering research. *Transactions of the Association for Computational Linguistics*, 7:452–466. [https://doi.org/10.1162/tacl_a_00276](https://doi.org/10.1162/tacl_a_00276)
16. Kenton Lee, Ming-Wei Chang, and Kristina Toutanova. 2019. Latent retrieval for weakly supervised open domain question answering. In *Proceedings of ACL*. [https://doi.org/10.18653/v1/P19-1612](https://doi.org/10.18653/v1/P19-1612)
17. Mina Lee, Percy Liang, and Qian Yang. 2022. CoAuthor: Designing a human-AI collaborative writing dataset for exploring language model capabilities. In *Proceedings of CHI*. [https://doi.org/10.1145/3491102.3502030](https://doi.org/10.1145/3491102.3502030)
18. Dacheng Li, Rulin Shao, Anze Xie, Ying Sheng, Lianmin Zheng, Joseph E. Gonzalez, Ion Stoica, Xuezhe Ma, and Hao Zhang. 2023. How long can open-source LLMs truly promise on context length?
19. Alex Mallen, Akari Asai, Victor Zhong, Rajarshi Das, Daniel Khashabi, and Hannaneh Hajishirzi. 2023. When not to trust language models: Investigating effectiveness of parametric and non-parametric memories. In *Proceedings of ACL*. [https://doi.org/10.18653/v1/2023.acl-long.546](https://doi.org/10.18653/v1/2023.acl-long.546)
20. Sewon Min, Julian Michael, Hannaneh Hajishirzi, and Luke Zettlemoyer. 2020. AmbigQA: Answering ambiguous open-domain questions. In *Proceedings of EMNLP*. [https://doi.org/10.18653/v1/2020.emnlp-main.466](https://doi.org/10.18653/v1/2020.emnlp-main.466)
21. Bennet B. Murdock Jr. 1962. The serial position effect of free recall. *Journal of Experimental Psychology*, 64(5):482. [https://doi.org/10.1037/h0045106](https://doi.org/10.1037/h0045106)
22. Joe O’Connor and Jacob Andreas. 2021. What context features can Transformer language models use? In *Proceedings of ACL*. [https://doi.org/10.18653/v1/2021.acl-long.70](https://doi.org/10.18653/v1/2021.acl-long.70)
23. Dimitris Papailiopoulos, Kangwook Lee, and Jy-yong Sohn. 2023. A little retrieval test for large language models. [https://github.com/anadim/the-little-retrieval-test](https://github.com/anadim/the-little-retrieval-test)
24. Bo Peng. 2023. RWKV-LM. [https://github.com/BlinkDL/RWKV-LM](https://github.com/BlinkDL/RWKV-LM)
25. Hao Peng, Nikolaos Pappas, Dani Yogatama, Roy Schwartz, Noah Smith, and Lingpeng Kong. 2021. Random feature attention. In *Proceedings of ICLR*.
26. Fabio Petroni, Patrick Lewis, Aleksandra Piktus, Tim Rocktäschel, Yuxiang Wu, Alexander H. Miller, and Sebastian Riedel. 2020. How context affects language models’ factual predictions. In *Proceedings of AKBC*.
27. Michael Poli, Stefano Massaroli, Eric Nguyen, Daniel Y. Fu, Tri Dao, Stephen Baccus, Yoshua Bengio, Stefano Ermon, and Christopher Ré. 2023. Hyena hierarchy: Towards larger convolutional language models. In *Proceedings of ICML*.
28. Ofir Press, Noah A. Smith, and Mike Lewis. 2021. Shortformer: Better language modeling using shorter inputs. In *Proceedings of ACL*. [https://doi.org/10.18653/v1/2021.acl-long.427](https://doi.org/10.18653/v1/2021.acl-long.427)
29. Ofir Press, Noah A. Smith, and Mike Lewis. 2022. Train short, test long: Attention with linear biases enables input length extrapolation. In *Proceedings of ICLR*.
30. Guanghui Qin, Yukun Feng, and Benjamin Van Durme. 2023. The NLP task effectiveness of long-range transformers. In *Proceedings of EACL*. [https://doi.org/10.18653/v1/2023.eacl-main.273](https://doi.org/10.18653/v1/2023.eacl-main.273)
31. Colin Raffel, Noam Shazeer, Adam Roberts, Katherine Lee, Sharan Narang, Michael Matena, Yanqi Zhou, Wei Li, and Peter J. Liu. 2020. Exploring the limits of transfer learning with a unified text-to-text Transformer. *Journal of Machine Learning Research*, 21(140):1–67.
32. Ori Ram, Yoav Levine, Itay Dalmedigos, Dor Muhlgay, Amnon Shashua, Kevin Leyton-Brown, and Yoav Shoham. 2023. In-context retrieval-augmented language models. *ArXiv:2302.00083*. [https://doi.org/10.1162/tacl_a_00605](https://doi.org/10.1162/tacl_a_00605)
33. Ohad Rubin and Jonathan Berant. 2023. Long-range language modeling with self-retrieval. *ArXiv:2306.13421*.
34. Chinnadhurai Sankar, Sandeep Subramanian, Chris Pal, Sarath Chandar, and Yoshua Bengio. 2019. Do neural dialog systems use the conversation history effectively? An empirical study. In *Proceedings of ACL*. [https://doi.org/10.18653/v1/P19-1004](https://doi.org/10.18653/v1/P19-1004)
35. Timo Schick, Jane Dwivedi-Yu, Roberto Dessì, Roberta Raileanu, Maria Lomeli, Luke Zettlemoyer, Nicola Cancedda, and Thomas Scialom. 2023. Toolformer: Language models can teach themselves to use tools.
36. Uri Shaham, Maor Ivgi, Avia Efrat, Jonathan Berant, and Omer Levy. 2023. ZeroSCROLLS: A zero-shot benchmark for long text understanding. *ArXiv:2305.14196*. [https://doi.org/10.18653/v1/2023.findings-emnlp.536](https://doi.org/10.18653/v1/2023.findings-emnlp.536)
37. Vatsal Sharan, Sham Kakade, Percy Liang, and Gregory Valiant. 2018. Prediction with a short memory. In *Proceedings of STOC*. [https://doi.org/10.18653/v1/K18-3013](https://doi.org/10.18653/v1/K18-3013)
38. Weijia Shi, Sewon Min, Michihiro Yasunaga, Minjoon Seo, Rich James, Mike Lewis, Luke Zettlemoyer, and Wen tau Yih. 2023. REPLUG: Retrieval-augmented black-box language models. *ArXiv:2301.12652*.
39. Kurt Shuster, Jing Xu, Mojtaba Komeili, Da Ju, Eric Michael Smith, Stephen Roller, Megan Ung, Moya Chen, Kushal Arora, Joshua Lane, Morteza Behrooz, William Ngan, Spencer Poff, Naman Goyal, Arthur Szlam, Y-Lan Boureau, Melanie Kambadur, and Jason Weston. 2022. BlenderBot 3: A deployed conversational agent that continually learns to responsibly engage. *ArXiv:2208.03188*.
40. Simeng Sun, Kalpesh Krishna, Andrew Mattarella-Micke, and Mohit Iyyer. 2021. Do long-range language models actually use long-range context? In *Proceedings of EMNLP*.
41. Yi Tay, Mostafa Dehghani, Vinh Q. Tran, Xavier Garcia, Jason Wei, Xuezhi Wang, Hyung Won Chung, Siamak Shakeri, Dara Bahri, Tal Schuster, Huaixiu Steven Zheng, Denny Zhou, Neil Houlsby, and Donald Metzler. 2023. UL2: Unifying language learning paradigms. *ArXiv:2205.05131*.
42. Romal Thoppilan, Daniel De Freitas, Jamie Hall, Noam Shazeer, Apoorv Kulshreshtha, Heng-Tze Cheng, Alicia Jin, Taylor Bos, Leslie Baker, Yu Du, YaGuang Li, Hongrae Lee, Huaixiu Steven Zheng, Amin Ghafouri, Marcelo Menegali, Yanping Huang, Maxim Krikun, Dmitry Lepikhin, James Qin, Dehao Chen, Yuanzhong Xu, Zhifeng Chen, Adam Roberts, Maarten Bosma, Vincent Zhao, Yanqi Zhou, Chung-Ching Chang, Igor Krivokon, Will Rusch, Marc Pickett, Pranesh Srinivasan, Laichee Man, Kathleen Meier-Hellstern, Meredith Ringel Morris, Tulsee Doshi, Renelito Delos Santos, Toju Duke, Johnny Soraker, Ben Zevenbergen, Vinodkumar Prabhakaran, Mark Diaz, Ben Hutchinson, Kristen Olson, Alejandra Molina, Erin Hoffman-John, Josh Lee, Lora Aroyo, Ravi Rajakumar, Alena Butryna, Matthew Lamm, Viktoriya Kuzmina, Joe Fenton, Aaron Cohen, Rachel Bernstein, Ray Kurzweil, Blaise Aguera-Arcas, Claire Cui, Marian Croak, Ed Chi, and Quoc Le. 2022. LaMDA: Language models for dialog applications. *ArXiv:2201.08239*.
43. Hugo Touvron, Thibaut Lavril, Gautier Izacard, Xavier Martinet, Marie-Anne Lachaux, Timothée Lacroix, Baptiste Rozière, Naman Goyal, Eric Hambro, Faisal Azhar, Aurelien Rodriguez, Armand Joulin, Edouard Grave, and Guillaume Lample. 2023a. LLaMA: Open and efficient foundation language models. *ArXiv:2302.13971*.
44. Hugo Touvron, Louis Martin, Kevin Stone, Peter Albert, Amjad Almahairi, Yasmine Babaei, Nikolay Bashlykov, Soumya Batra, Prajjwal Bhargava, Shruti Bhosale, Dan Bikel, Lukas Blecher, Cristian Canton Ferrer, Moya Chen, Guillem Cucurull, David Esiobu, Jude Fernandes, Jeremy Fu, Wenyin Fu, Brian Fuller, Cynthia Gao, Vedanuj Goswami, Naman Goyal, Anthony Hartshorn, Saghar Hosseini, Rui Hou, Hakan Inan, Marcin Kardas, Viktor Kerkez, Madian Khabsa, Isabel Kloumann, Artem Korenev, Punit Singh Koura, Marie-Anne Lachaux, Thibaut Lavril, Jenya Lee, Diana Liskovich, Yinghai Lu, Yuning Mao, Xavier Martinet, Todor Mihaylov, Pushkar Mishra, Igor Molybog, Yixin Nie, Andrew Poulton, Jeremy Reizenstein, Rashi Rungta, Kalyan Saladi, Alan Schelten, Ruan Silva, Eric Michael Smith, Ranjan Subramanian, Xiaoqing Ellen Tan, Binh Tang, Ross Taylor, Adina Williams, Jian Xiang Kuan, Puxin Xu, Zheng Yan, Iliyan Zarov, Yuchen Zhang, Angela Fan, Melanie Kambadur, Sharan Narang, Aurelien Rodriguez, Robert Stojnic, Sergey Edunov, and Thomas Scialom. 2023b. Llama 2: Open foundation and fine-tuned chat models. *ArXiv:2307.09288*.
45. Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, and Illia Polosukhin. 2017. Attention is all you need. In *Proceedings of NeurIPS*.
46. Sinong Wang, Belinda Z. Li, Madian Khabsa, Han Fang, and Hao Ma. 2020. Linformer: Self-attention with linear complexity. *ArXiv:2006.04768*.
47. Manzil Zaheer, Guru Guruganesh, Kumar Avinava Dubey, Joshua Ainslie, Chris Alberti, Santiago Ontanon, Philip Pham, Anirudh Ravula, Qifan Wang, Li Yang, and Amr Ahmed. 2020. Big Bird: Transformers for longer sequences. In *Proceedings of NeurIPS*.

## 附录 A 多文档问答干扰文档中的歧义

沿用 NaturalQuestions-Open 的既有研究（Izacard et al., 2021；Izacard and Grave, 2021 等），我们使用 2018 年末的 Wikipedia 转储作为检索语料库。然而，这份标准 Wikipedia 转储与 NaturalQuestions 标注之间存在少量时间错位。

例如，考虑问题“what nfl team does robert griffin iii play for”（Robert Griffin III 效力于哪支 NFL 球队）。NaturalQuestions 的标注答案是“currently a free agent”（目前是自由球员）。然而，Wikipedia 检索语料库包含他效力于“Baltimore Ravens”（巴尔的摩乌鸦队）的信息，因为他离开该队的时间，介于 Wikipedia 转储时间戳与 NaturalQuestions 标注过程之间。

我们使用 Min et al.（2020）的歧义标注，创建一个由无歧义问题组成的子集。在这个无歧义数据子集上进行实验，得到的结果和结论与完整问题集合上的实验相似，见图 12。

[查看正式 PDF 中的图 12（第 15 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=15)

**图 12。** 语言模型在无歧义问题子集上的表现。

## 附录 B 多文档问答中的随机干扰文档

我们还使用随机 Wikipedia 文档作为干扰项，运行多文档问答实验，从而消融检索所得干扰文档——困难负例——的影响。请注意，在这种设置中，通常可以通过简单启发式方法识别包含答案的文档，例如它与查询之间的词汇重叠。

[查看正式 PDF 中的图 13（第 15 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=15)

**图 13。** 使用随机干扰文档而非检索所得干扰文档时，语言模型在多文档问答上的表现。

图 13 展示这项实验的结果。尽管所有模型在该设置中的绝对准确率都更高，令人意外的是，它们仍然难以对整个输入上下文进行推理。这说明，模型表现下降并不只是因为它们无法识别相关文档。

## 附录 C 在多文档问答中随机排列干扰文档

我们的提示词要求语言模型使用给定搜索结果回答问题。预训练数据或指令微调数据中可能存在一种先验：搜索结果会按相关性递减顺序排列，即输入上下文开头附近的文档比末尾附近的文档更可能有用。

为了验证我们的结论不只是这种偏差的副产品，我们把指令修改为：“Write a high-quality answer for the given question using only the provided search results (some of which might be irrelevant). The search results are ordered randomly.”（只使用所提供的搜索结果——其中一些可能无关——为给定问题写出高质量答案。搜索结果按随机顺序排列。）此外，我们会随机打乱 $k-1$ 篇干扰文档。

[查看正式 PDF 中的图 14（第 16 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=16)

**图 14。** 随机排列干扰文档——而不是按相关性递减顺序呈现——并在提示词中明确说明这一点时，语言模型的表现。

图 14 展示这项实验的结果。我们仍然看到 U 形性能曲线：当语言模型必须使用输入上下文中部的信息时，表现会下降。

把第 2.3 节的结果与随机排列干扰文档、并在提示词中说明随机排列时的结果进行比较，可以看到：当相关信息恰好位于上下文最开头时，随机化会略微降低表现；当使用上下文中部和末尾的信息时，表现会略微提升。

## 附录 D GPT-4 的表现

我们在随机抽取的 500 个多文档问答样本子集上评估 GPT-4（8K），每个输入上下文共包含 20 篇文档，见图 15。GPT-4 的绝对表现高于其他所有语言模型，但仍呈现 U 形性能曲线：当相关信息位于上下文最开头或最末尾时，表现最高；当它必须使用输入上下文中部的信息时，表现会下降。

[查看正式 PDF 中的图 15（第 16 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=16)

**图 15。** 尽管 GPT-4 的绝对表现高于其他模型，当相关信息位于输入上下文中部时，它的表现仍会下降。

## 附录 E Llama-2 的表现

我们在每个输入上下文共包含 20 篇文档的条件下，评估 Llama-2（Touvron et al., 2023b）在多文档问答上的表现。Llama 分词器产生的序列比我们此前研究的模型所用分词器更长，因此，我们舍弃了 20 个——总计 2,655 个——超过 Llama-2 最大上下文长度 4,096 token 的样本。

我们对不同规模——7B、13B 和 70B 参数——的模型进行实验，分别考察不带和带有额外监督微调及人类反馈强化学习的版本，其中带有这些额外训练的模型为“-chat-”模型。结果见图 16。

[查看正式 PDF 中的图 16（第 16 页）](https://aclanthology.org/2024.tacl-1.9.pdf#page=16)

**图 16。** 不同规模——7B、13B 和 70B 参数——的 Llama-2 模型在多文档问答上的表现；每个输入上下文共包含 20 篇文档。图中同时给出不带和带有额外监督微调及人类反馈强化学习的模型，其中后者为“-chat-”模型。

比较不同规模的 Llama-2 模型，我们发现，只有较大的模型——13B 和 70B——才会呈现 U 形性能曲线，即同时出现首因偏差和近因偏差；最小的 Llama-2 模型——7B——只有近因偏差。

鉴于这些结果，我们推测，以往研究（例如 Khandelwal et al., 2018；Sun et al., 2021）之所以没有在语言模型中观察到首因偏差，是因为其研究的模型太小——少于 1B 参数。

比较带有和不带额外监督微调及人类反馈强化学习的 Llama-2 模型，可以看到，额外微调显著改善了多文档问答任务的表现。带有和不带额外微调的 7B 模型都几乎没有首因偏差，主要呈现近因偏差。

13B 基础模型具有显著的首因偏差和近因偏差：最佳与最差表现之间存在 20 个百分点的准确率差距。对 13B 模型应用额外微调，似乎会略微减轻这种偏差——最差情形下降 10 个百分点——但偏差仍然显著。

然而，带有和不带额外微调的 70B 模型具有大体相似的趋势——同时呈现首因偏差和近因偏差——额外微调对位置偏差的严重程度影响很小。
