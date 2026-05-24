# 冷启动与增量扫描前端持续输出展示 - 原始计划书

状态：原始计划书已确认，已进入 Wave 1 执行计划
维护窗口：AlembicWorkspace
创建时间：2026-05-23
对应 TODO：`GTODO-2026-05-23-028`

## 用户原始想法

用户希望把冷启动和增量扫描过程中的信息，在前端页面中持续输出展示。

这不是单纯的日志下载，也不是只在完成后展示结果；核心体验是：当 Alembic 正在 bootstrap / rescan 时，开发者能在 Dashboard 或前端页面里持续看到扫描进度、阶段变化、关键事件、错误 / 降级原因和最终产物摘要。

用户进一步补充：

- 现在冷启动过程中已经有一些持续输出，尤其是控制台一直打印的日志，其中有很多用户自己为了观察过程写的中文格式化输出。
- 第一版不应把这些已有输出当成废弃物；需要先识别哪些是真实过程信号，哪些只是开发者可读日志，再决定如何进入前端展示。
- 目前数据挖掘阶段的信息比较多，但后续格式产出阶段信息不足；前端持续输出必须补齐格式化 / 产物生成阶段的过程事件。
- 重要的 LLM 中间输出目前似乎没有被记录或展示，但它对理解 cold-start / rescan 过程非常重要，应该作为一类核心展示内容纳入设计。
- 需要一层数据处理层：接受扫描 / LLM / workflow 产生的原始数据，并产出不同用途的数据格式。日志信息给机器和 AI 看，前端展示给开发者看，两者不能使用同一种格式。
- 第一版展示主要放在两个地方：候选页面的冷启动卡片，以及后台任务页面。
- 原始日志第一版不需要作为前端展示对象；更接近 Codex 工具调用那种可展开、有价值、能看出发生了什么的过程信息。
- 重点展示 Alembic 输入给 LLM 的提示、Alembic workflow 显式产生的反思 / 自检 / 候选选择说明，以及 LLM 产出的可见输出；输入和输出必须明确区分类别。
- LLM 输出第一版可以轻量处理，先把真实存在的内容展示出来，再根据观察结果继续优化格式。
- 这个展示的目的之一是让开发者能更清楚地看到 Alembic 给 LLM 输入了什么、LLM 输出了什么，从而后续更好地优化冷启动提示词、阶段策略、产物格式和失败处理。
- 现有面向人阅读的日志 / workflow 展示内容已经是安全且完整的开发者观察材料；第一版最好不要额外截断，也不需要特别脱敏。数据层仍需区分来源，避免把密钥、token、内部配置或原始 provider payload 误投到开发者视图。
- 现有日志信息还不需要一次性完成全部概念化，可以在后续迭代里逐步沉淀；长期分析保存主要依靠日志和 AI 总结，而不是前端完整历史。
- 第一版可以先只打通 cold-start；rescan 后续复用同一套事件和展示模型。
- 前端只保留最近任务 / 最近过程信息；不把 UI 设计成长期日志仓库。
- 当前日志没有自动化消费方，一般是开发者要求时由 AI 读取、分析和总结；因此第一版 machine / AI event 可以先服务后续诊断和总结，不强行制造自动消费闭环。

## 总控初步理解

目标是建立一个真实可用的“扫描过程可观察界面”：

- 冷启动过程中持续展示当前阶段、正在分析的维度或模块、重要产物和失败点。
- 增量扫描过程中持续展示本轮 rescan 原因、受影响范围、保留 / 衰减 / 新增的知识项、当前阶段和结果。
- 前端展示的信息来自真实 workflow / job / daemon 状态，不用静态 mock 或事后拼接假进度。
- 页面能处理长任务、重连、刷新、任务失败、任务取消、历史任务回看和当前任务继续观察。
- 输出要对开发者有用：能知道“现在在做什么、为什么慢、哪里失败、产出了什么、下一步能不能继续”。
- 现有中文格式化日志是宝贵线索，但前端不应只做终端日志搬运；应在保留可读性的同时，逐步沉淀成结构化事件。
- 数据挖掘、分析、LLM 调用、LLM 中间输出、格式化产出、artifact 写入、Recipe / Skill / Guard 候选生成都应该有连贯阶段。
- LLM 中间输出应被当成一等事件，但需要区分可展示的提示输入、模型响应、候选、摘要，与不适合展示的密钥、内部配置、原始 provider payload 或不可控 debug 噪声。
- 第一版页面形态不应在“候选页卡片”和“后台任务页”之间二选一：后台任务页应作为完整过程的主视图和可回看入口；候选页冷启动卡片应作为轻量摘要、最新状态和跳转入口。
- 候选页卡片只展示开发者需要一眼知道的内容，例如当前阶段、最近关键事件、是否有 LLM 输出、是否生成候选、是否失败和进入后台任务详情的入口。
- 后台任务页展示完整可展开过程：按阶段折叠的 workflow event、LLM 输入、显式反思 / 自检、LLM 可见输出、解析结果、格式产出和 artifact 关系。
- 需要明确“数据接入 -> 数据处理 -> 多格式输出”的中间层：它接收机器过程事件、日志、LLM 响应、artifact 事件和错误事件，统一归一化、分类、分级、投影和必要安全边界，再输出给不同消费方。
- 机器 / AI 面向的数据应该稳定、结构化、可回放、可检索，保留必要上下文、事件 id、stage、source、payload、artifact refs 和错误码。
- 开发者前端面向的数据应该可读、可扫、可折叠，按阶段、时间线、产物和 LLM 输出组织，强调“我现在应该知道什么”和“下一步能做什么”。
- 同一条原始过程数据应该能产出不同 view model，而不是让前端直接解析 debug log，也不是让 AI 消费前端文案。

## 初步功能闭环

1. 用户在候选页面看到 cold-start 卡片摘要，或在后台任务页面打开 cold-start / rescan 任务详情。
2. 后端 / daemon 提供任务过程事件流或可轮询的增量状态。
3. 前端持续接收并渲染阶段、可展开价值事件、LLM 输入 / 显式反思 / LLM 输出、关键 artifact、错误和完成结果。
4. 用户刷新页面或重新打开后，仍能看到当前任务状态和历史事件摘要。
5. 任务结束后，页面展示最终状态、产物摘要、失败原因、可继续操作和报告入口。

数据处理闭环：

1. Workflow / LLM / logger / artifact writer 产生原始事件或原始日志。
2. 数据处理层接收原始输入，统一生成 canonical process event。
3. 数据处理层为机器 / AI 生成结构化日志或 evidence stream。
4. 数据处理层为 Dashboard 生成 developer-facing view model。
5. 前端只消费 view model 和必要引用，不直接依赖底层 debug log 格式。
6. AI / 后续分析只消费结构化事件和 evidence，不反向依赖前端展示文案。

第一版展示建议分成五层：

- 阶段层：bootstrap / rescan 的阶段、维度、当前文件或模块、耗时、完成 / 失败状态。
- 事件层：重要 workflow event、工具调用式可展开过程块、错误 / 降级原因和用户可读提示。
- LLM 输入层：Alembic 输入给 LLM 的提示、上下文摘要、阶段目标和必要证据引用；输入必须与输出分开展示。
- LLM 输出层：模型可见输出、候选摘要、解析结果和后续处理结果；第一版只做轻量分类和结构化，已归类为开发者展示源的内容默认完整呈现，先观察真实内容。
- 产物层：Recipe / Skill / Guard / report / artifact 的生成、格式化、写入、跳过、失败和最终摘要。

数据格式建议至少分三类：

- Raw input：来自现有日志、workflow callback、LLM provider、artifact writer 的原始输入，只做保留 / 采样 / 安全过滤，不直接作为前端 UI。
- Machine / AI event：稳定 schema，适合 JobStore、搜索、复盘、AI 总结和自动诊断。
- Developer view model：前端展示格式，适合时间线、阶段卡片、LLM 输出折叠面板、错误提示和产物摘要。

## 初步影响窗口

- `Alembic`：可能负责 daemon job lifecycle、workflow event 生产、HTTP/SSE 或轮询接口、JobStore 持久化、错误分类和任务历史。
- `AlembicCore`：可能负责共享事件 schema、job progress contract、阶段枚举、错误 / artifact 类型、machine / AI event contract 和 developer view model contract。
- `AlembicDashboard`：可能负责前端页面、任务详情视图、实时事件渲染、重连 / 刷新恢复、状态组件和可视化交互。
- `AlembicTest`：可能负责真实项目冷启动 / rescan 过程验证、长任务监控、Dashboard 手动或脚本化验收和证据报告。
- `AlembicPlugin`：第一版可能无直接实现任务；只在 Codex handoff、Dashboard URL、job status 或 Plugin-triggered bootstrap / rescan 需要展示时观察。
- `AlembicAgent`：如果 LLM 调用、AI provider streaming、prompt / response capture 或 tool execution loop 在 Agent runtime 内，需要参与定义“可展示 LLM 中间输出”边界。

## 初步非目标

- 不把 Dashboard 接入 Plugin；Dashboard 仍消费 Alembic 主体提供的本地服务。
- 不把所有内部 debug log 原样倾倒到前端。
- 不做原始日志查看器；原始日志仍用于开发者要求时的 AI 分析、排障和长期留证。
- 不用假进度条替代真实阶段和事件。
- 不要求第一版实现完整 tracing / metrics 平台。
- 不把冷启动 / rescan 的核心业务逻辑迁到 Dashboard。
- 不改变 Plugin first, Alembic install enhances 的长期边界。
- 不展示密钥、token、完整敏感配置、原始 provider payload 或无筛选的 debug dump；已归类为 developer-facing 的提示输入、workflow 文案和 LLM 可见输出默认完整展示，不做额外截断或特殊脱敏。
- 不把 LLM 中间输出误写成模型隐藏推理；只展示 Alembic workflow 可记录、可审计、可面向开发者说明的提示输入、显式反思 / 自检 / 候选选择说明、可见响应、候选、解析结果和产物关系。
- 不把候选页冷启动卡片做成完整任务控制台；卡片负责摘要和入口，后台任务页负责完整过程。
- 不要求第一版覆盖长期历史任务归档；前端只保留最近任务 / 最近过程信息，长期分析依靠日志和 AI 总结。
- 不让前端直接消费机器日志 schema；前端应该消费专门的 developer view model。
- 不让 AI 消费前端文案作为事实源；AI 应消费结构化 machine / AI event。
- 不把现有中文格式化日志强行作为长期接口；它可以作为迁移输入和可读 fallback，但不应成为跨层 contract。

## 需要后续代码调研的问题

原始计划书确认后再开始真实代码挖掘，重点包括：

- 当前 bootstrap / rescan workflow 如何上报 stage、job status、finding、artifact 和错误。
- 当前冷启动控制台里已有的中文格式化日志从哪里打印、是否可映射成结构化事件、是否有统一 logger / reporter。
- 为什么数据挖掘阶段信息充分，而格式产出阶段信息缺失；格式产出包含哪些真实子阶段、是否有 hook / callback 可接入。
- LLM 调用链在哪些模块发生：请求前、流式输出中、响应完成、解析候选、格式化写入和失败重试分别有没有可记录点。
- 当前是否有 AI provider streaming / callback / token delta / tool output 能力；如果没有，第一版展示完整响应摘要还是增量 chunk。
- 当前 Alembic 是否有显式反思 / 自检 / 候选选择说明产物；如果有，哪些可以展示给开发者，哪些只能作为机器事件或日志证据。
- 是否已经存在统一 logger / reporter / event bus 可作为数据处理层入口；如果没有，应该放在 Alembic、AlembicCore 还是 workflow 内部。
- 当前日志里哪些字段是机器 / AI 需要的事实，哪些只是用户临时调试文案；如何迁移为 machine event 与 developer view model。
- JobStore 适合保存 raw input、machine event、developer view model 还是只保存 event + projection cache。
- 前端 API 应返回完整 view model、分页事件流，还是 event stream + 前端本地投影。
- `JobStore` 现在保存了哪些可供前端恢复的过程数据。
- daemon / Dashboard server 现在已有的 job API、SSE、polling 或 WebSocket 能力。
- Dashboard 目前任务页面、API client、状态管理和日志展示模式。
- 当前 AlembicTest 是否已有冷启动监控脚本或 Dashboard 验证脚本可复用。
- 哪些信息适合实时事件，哪些只适合最终摘要或 artifact 链接。

## 初步完成定义候选

这部分需要用户确认后再细化：

- 第一版先打通 cold-start 真实过程输出；rescan 能复用同一事件和 view model 设计，是否同轮实现由代码调研和阶段确认决定。
- 候选页面 cold-start 卡片能展示轻量摘要、最新阶段、最近关键事件和进入后台任务详情的入口。
- 后台任务页面能展示完整可展开过程，不只显示最终完成 / 失败。
- 前端可持续展示并能刷新恢复最近任务 / 关键摘要。
- 后端事件 / 状态来自真实 job workflow，并有持久化或可重放摘要。
- 失败、取消、降级、超时和部分成功都有明确展示。
- 现有冷启动中文格式化输出中的关键信号被梳理并进入展示链路，不能只丢弃。
- 数据挖掘阶段与格式产出阶段都有可观察信息，前端不会在后半程突然“静默”。
- 重要 LLM 相关信息能在前端查看，至少包含提示输入、显式反思 / 自检 / 候选选择说明、可见模型输出 / 候选摘要、解析结果和对应产物关系；输入与输出明确分开展示。
- 有明确的数据处理层，能从原始日志 / workflow / LLM / artifact 输入生成 machine / AI event 和 developer view model。
- 机器 / AI 日志格式与前端展示格式分离；第一版 machine / AI event 的真实消费方可以是 JobStore / 日志留证 / 后续 AI 总结入口，不强行要求已有自动诊断流程。
- 真实项目验证第一版至少覆盖一次 cold-start 展示闭环；rescan 覆盖进入后续阶段或同轮扩展，由目标阶段确认决定。

## 用户确认记录

- 2026-05-24 00:28 CST：用户确认“需求也提完了，继续下一步”，总控按原始计划书已确认处理。
- 默认确认第一版采用“双入口”：候选页面 cold-start 卡片做轻量摘要和入口，后台任务页面做完整可展开过程主视图。
- 默认确认第一版先打通 cold-start；rescan 复用同一事件和展示模型，是否同轮做完整 UI 由后续目标阶段确认决定。
- 2026-05-24 00:39 CST：用户确认第一版面向人的日志 / workflow 展示内容安全且完整，最好不要额外截断，也不用特别脱敏；展示目标是帮助开发者看清输入给 LLM 的内容、LLM 可见输出和后续处理结果，以便持续优化冷启动。
- 默认确认 LLM 提示输入、显式反思和 LLM 可见输出采用“可展开展示 + 来源分类 + 完整呈现 developer-facing 内容”，不展示密钥、token、完整敏感配置、原始 provider payload 或隐藏推理。
- 默认确认数据处理层第一版以 Alembic 主体真实事件流落地为主；稳定 schema / 持久化 contract 需要由代码调研判断是否先下沉 AlembicCore。

## 当前状态

已进入 Wave 1 执行计划。后续文档：

- [requirement-design-2026-05-24.md](requirement-design-2026-05-24.md)
- [code-implementation-dependency-research-2026-05-24.md](code-implementation-dependency-research-2026-05-24.md)
