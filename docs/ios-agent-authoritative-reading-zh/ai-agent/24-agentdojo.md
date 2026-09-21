# AgentDojo：动态评测提示注入攻防

- **Original title**：AgentDojo: A Dynamic Environment to Evaluate Prompt Injection Attacks and Defenses for LLM Agents
- **原文链接**：[NeurIPS 2024 论文](https://proceedings.neurips.cc/paper_files/paper/2024/hash/97091a5177d8dc64b1da8bf3e1f6fb54-Abstract-Datasets_and_Benchmarks_Track.html)
- **作者/机构**：Edoardo Debenedetti、Jie Zhang、Mislav Balunovic、Luca Beurer-Kellner、Marc Fischer、Florian Tramèr；ETH Zurich 等
- **年份**：2024
- **材料类型**：同行评审论文 / 安全 benchmark
- **文档性质**：忠实中文精读，不是原文全文翻译。

## 文章要解决的问题

Agent 从邮件、网页或工具结果读取的是不可信数据，其中可能夹带要求它泄露信息或执行越权动作的指令。静态提示集合很快会落后于新攻击和防御，AgentDojo 因此要建立可扩展、可组合的动态攻防环境。

## 原文论证主线

环境把正常用户任务、工具与应用状态、攻击者目标、注入载体和防御组合起来。Agent 一方面要完成合法目标，另一方面不能执行藏在外部数据中的恶意目标。研究者可以加入新任务、攻击和防御，并让攻击适应被测系统，而不是只在一份固定字符串列表上测“是否识别越狱提示”。

## 关键机制与结论

评测同时关心 utility 和 security：一个拒绝所有工具结果的 Agent 也许安全，却无法完成用户任务；一个任务完成率高的 Agent 也可能在注入下泄露数据。环境覆盖邮件、电子银行和旅行预订等工具场景，以真实状态变化判定用户目标和攻击者目标是否达成。结论是，模型层防御不能只看攻击成功率，还要测正常能力损失与适应性攻击。

## 证据与适用边界

初始版本含 97 个写实任务、629 个安全测试用例，并比较多种当时模型、攻击和防御。结果显示模型在无攻击时就会失败，现有攻击并非破坏全部安全属性，防御也难同时保持任务能力和鲁棒性。环境仍是受控模拟，工具、数据和攻击者能力有明确边界；线上供应链、视觉界面、长期记忆与人类审批需要额外测试。

## 在知识体系中的位置

AgentDojo 是从抽象“提示注入风险”走向可重复系统评测的基础设施，并成为 CaMeL 等架构防御的主要实验平台。它提醒安全分数必须与可用性一起看。

## 精读时应保留的判断

安全评测应把攻击文本放进 Agent 实际会读取的工具结果，而不只直接发在用户消息中。还要区分攻击未执行是因为防御有效，还是因为 Agent 连正常任务都不会做；所以必须同时报告 benign utility、攻击成功率和拒绝率。固定攻击容易被规则记住，应保留自适应攻击与未见模板。真实部署还需加入多轮记忆、视觉内容、插件更新和权限升级路径，因为这些维度超出初始 AgentDojo 环境。
