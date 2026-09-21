# AI Agent 权威资料中文精读

本目录收录 28 个唯一来源，包含两种文档类型：

- **完整中文译文**：[04 ReAct](04-react.md)、[05 CoALA](05-coala.md)、
  [10 MemGPT](10-memgpt.md)、[11 Lost in the Middle](11-lost-in-the-middle.md)、
  [13 12-Factor Agents](13-twelve-factor-agents.md)、
  [25 CaMeL](25-camel-prompt-injection.md) 与
  [26 OWASP 2026 Agentic Applications 十大风险](26-owasp-agentic-top-10.md)。
- **中文精读摘要**：其余来源依据原文论证结构重写，但不逐段全文翻译。

两类文档都不以厂商个案代替普遍规律。建议先读“系统定义”，再沿工具与上下文、运行控制、
生产、评测、调试和安全逐层深入；多 Agent 部分应成组阅读，避免只凭一篇文章的标题下结论。

## 一、系统定义与基础架构

1. [从单一模型转向复合 AI 系统](01-compound-ai-systems.md) — **研究者工程综述 / 立场文章**；把评估对象从模型扩展为模型、检索、工具和控制流组成的系统；例证横跨任务但不是统一对照实验。
2. [构建有效的 AI Agent](02-building-effective-agents.md) — **厂商工程经验**；区分固定工作流与模型动态控制的 Agent，并给出逐级加复杂度的模式；来自 Anthropic 与客户经验，不能当统计定律。
3. [从环境、工具与规划理解 Agent](03-agents-chip-huyen.md) — **工程教材型综述**；用环境、动作空间和规划器连接经典 Agent 与 LLM Agent；采用较宽的 Agent 定义，部分可靠性计算是说明性示例。
4. [ReAct：让推理与行动交替发生](04-react.md) — **研究论文**；建立 `reason-act-observe` 的基本闭环；实验基于 2022 年模型与受控任务，不代表现代生产可靠性。
5. [CoALA：语言 Agent 的认知架构](05-coala.md) — **研究论文 / 概念框架**；统一记忆、内部/外部动作和决策循环；主要贡献是分类与研究议程，并非架构优越性实验。
6. [LLM 驱动的自主 Agent：规划、记忆与工具](06-llm-powered-autonomous-agents.md) — **研究综述**；提供规划—记忆—工具三分法与早期文献地图；材料集中在 2023 年原型，需用后续生产证据校正。

## 二、工具与上下文

7. [为 AI Agent 编写有效工具](07-writing-effective-tools.md) — **厂商工程复盘**；把工具视为确定性系统与概率性调用者之间的契约；内部 Slack/Asana 评测未完整公开，具体格式需自行验证。
8. [面向 AI Agent 的有效上下文工程](08-effective-context-engineering.md) — **厂商工程方法**；目标是每轮构造最小而完整的高信号上下文；没有跨模型通用的压缩率或检索阈值。
9. [构建 Manus 得到的上下文工程经验](09-manus-context-engineering.md) — **厂商生产复盘**；覆盖 KV cache、文件式外部状态、计划复述和保留失败轨迹；缺少公开对照数据，不可直接外推。
10. [MemGPT：像操作系统一样管理模型上下文](10-memgpt.md) — **研究论文 / 系统原型**；用分层存储、读写动作和中断实现虚拟上下文；没有解决记忆真实性、权限、冲突和删除。
11. [信息为何会“迷失在长上下文中间”](11-lost-in-the-middle.md) — **研究论文**；用位置扰动证明窗口上限不等于有效信息利用；任务以检索与问答为主，不等同于完整 Agent 轨迹。

## 三、长任务与运行控制

12. [长时间运行 Agent 的有效 Harness](12-long-running-agent-harnesses.md) — **厂商实验复盘**；用结构化需求、git、进度文件和最小端到端链路完成跨会话交接；证据集中于一个全栈 Web 开发实验。
13. [12-Factor Agents：生产级 LLM 软件原则](13-twelve-factor-agents.md) — **开源工程指南 / 立场文章**；强调状态、暂停恢复、人工回路和控制流所有权；不是同行评审标准，也没有统一效果数据。

## 四、多 Agent

14. [Anthropic 多 Agent 研究系统复盘](14-anthropic-multi-agent-research.md) — **厂商生产复盘**；展示广度优先搜索中的编排者—工作者与独立上下文压缩；90.2% 内部提升和 15 倍 token 口径不可外推到编码。
15. [Agent 系统如何扩展：何时多 Agent 有效](15-google-scaling-agent-systems.md) — **受控研究实验**；以 180 种配置量化并行收益、顺序惩罚和错误放大；四个 benchmark 与候选拓扑仍小于真实生产空间。
16. [不要默认构建多 Agent](16-dont-build-multi-agents.md) — **厂商工程立场**；指出并行写入导致上下文丢失和隐式决策冲突；主要来自 Cognition 编码经验，且后续立场已细化。
17. [多 Agent：目前真正有效的模式](17-multi-agents-what-works.md) — **厂商生产复盘 / 立场更新**；提出“一个写者，多个智能贡献者”的审查与咨询模式；内部缺陷数据未公开完整基线，领域仍以软件工程为主。

## 五、生产实践

18. [生产环境中的 Agent 到底长什么样](18-characterizing-agents-production.md) — **同行评审实证研究**；20 个深访案例与 306 名从业者显示生产偏好短、可控、有人介入的系统；问卷存在自报与样本选择偏差。
19. [OpenAI 内部数据 Agent 的构建复盘](19-openai-in-house-data-agent.md) — **厂商生产复盘**；展示六层领域上下文、权限继承、记忆和持续 SQL/结果评测；单组织架构与规模特殊，未公开成功率。

## 六、评测

20. [怎样评测真正有用的 AI Agent](20-ai-agents-that-matter.md) — **研究论文 / 评测批判**；要求联合比较准确率、成本、scaffold 和留出集；方法论强于覆盖范围，价格与榜单数字会过时。
21. [拆解 AI Agent 评测](21-demystifying-agent-evals.md) — **厂商工程指南**；统一 task、trial、trajectory、outcome、grader 与 `pass^k`；模型评分和模拟用户仍需人工校准。
22. [τ-bench：评测工具、Agent 与用户的真实交互](22-tau-bench.md) — **研究论文 / benchmark**；以最终数据库状态和重复成功衡量真实任务；只覆盖两个模拟服务领域，不能替代线上用户测试。

## 七、可观测性与调试

23. [AgentRx：从执行轨迹系统定位 Agent 失败](23-agentrx.md) — **研究框架与开源 benchmark**；用可执行约束定位第一个不可恢复步骤；115 条失败轨迹规模有限，最终仍含 LLM judge。

## 八、安全与约束

24. [AgentDojo：动态评测提示注入攻防](24-agentdojo.md) — **同行评审论文 / 安全 benchmark**；同时测正常任务能力与注入攻击成功；97 个任务、629 个用例仍是受控模拟。
25. [CaMeL：通过控制流与能力系统抵御提示注入](25-camel-prompt-injection.md) — **研究预印本 / 安全架构**；以可信控制流、数据流和 capability 建立确定性边界；“可证明安全”仅在论文威胁模型内成立。
26. [OWASP 2026 Agentic Applications 十大风险](26-owasp-agentic-top-10.md) — **同行协作安全指南**；用十类风险建立威胁建模入口；不是发生率统计、合规认证或传统应用安全替代品。
27. [微软 Agentic AI 失败模式分类更新](27-microsoft-agent-failure-taxonomy.md) — **红队生产经验**；补充供应链、会话污染、视觉攻击和 Agent 间信任升级；未公开 engagement 数量与原始发生率。
28. [Anthropic 如何在不同产品中约束 Claude](28-contain-claude.md) — **厂商安全工程复盘**；比较临时容器、本机沙箱和本地 VM 的硬边界与真实失误；遥测和事故属于 Anthropic 产品，不替代独立审计。

## 建议阅读顺序

- **建立词汇**：01 → 02 → 03 → 04 → 05。
- **理解 Agent 为什么会变差**：07 → 08 → 11 → 12。
- **判断是否需要多 Agent**：14 → 16 → 15 → 17。
- **从 demo 走向生产**：13 → 18 → 19 → 21 → 22 → 23。
- **建立安全边界**：24 → 25 → 26 → 27 → 28。
