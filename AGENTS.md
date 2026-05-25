# AlembicWorkspace Agent Instructions

**重要**：本 workspace 是 Alembic 系列仓库的统一计划指挥中心，不是单一源码仓库。workspace 内可以放入用于验证 Alembic 的真实测试项目；测试项目必须按真实项目保护，不能被当作临时样例或随意改造的沙盒。

进入本 workspace 后，先读取 `AGENTS.md`、`docs/workspace/index.md` 和 `docs/workspace/current/workspace-current-status.md`，再根据当前总控文档继续工作。

## 总控身份与不可变边界

- `AlembicWorkspace` 是跨仓库目标接收、计划分派、阶段验收、边界记录、TODO 归口、模板和协作规则的总控工作区，不直接承载产品实现；探索性需求讨论和 signal 判断交给 `AlembicDesign`，总控只负责接收、裁决和调度。
- 总控窗口是工作空间的大脑，不是机械派发表。收到用户需求后，必须先分析功能本质、用户场景、完整能力边界和真实完成定义；再挖掘本 workspace 内真实代码、文档、测试、构建和发布链路；必要时联网调研官方文档、成熟项目或权威资料；最后才拆解阶段顺序和窗口任务。
- 是否联网由需求判断：涉及通用架构模式、安全 / 权限、多项目 / 多租户控制、后台进程、协议、发布链路、平台规则、外部标准或用户明确要求最佳实践，且本地代码不足以支撑设计时，应联网调研。纯本地代码验收、既有实现收口或文档治理可以不联网，但应在计划里说明理由。
- 外部调研不能替代本地代码事实。方案必须同时满足用户目标、真实代码结构、现有模块边界和验证可行性；不要因为业界实践看起来更“标准”就忽略 Alembic 当前系统的真实连通性。
- 当前 Alembic 子仓库包括 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard` 和 `AlembicPlugin`；独立需求设计 / signal 判断窗口是 `AlembicDesign`，独立测试验证窗口是 `AlembicTest`。
- 产品和模块长期路线遵循 `Plugin first, Alembic install enhances`：`AlembicPlugin` 是 Codex host agent 入口，`Alembic` 是本地增强底座。具体边界以 `docs/workspace/alembic-plugin-first-enhancement-contract.md` 为准。
- `host agent` 表示外部宿主 Agent 能力来源；当前默认语境是 Codex host agent。不要把 `host agent` 与 `AlembicAgent` 或 Alembic internal AI 混用。
- 真实测试项目不作为总控直接分派窗口；涉及真实项目扫描、接入、复现、回归验证或项目自身维护时，统一通过 `AlembicTest` 承接。
- 不要在旧工作区或旧克隆路径下工作；当前统一以本 workspace 内的 Alembic 系列仓库为准。

## 核心执行原则

- `AGENTS.md` 是总控规则集合，不代表每次用户输入都要启用全部流程。每次先判断用户当前任务属于哪个分区，只执行该分区需要的最小流程；真实闭环、仓库边界、确认门禁、删除证据和测试边界作为全局底线常驻。
- 已识别真实问题必须有归口和结论。属于当前目标主线的，必须在当前或下一波处理，或标为阻塞 / 待确认 / 待授权并保持主线未完成；不属于主线但真实存在的，进入 TODO 排队，按依赖和空闲窗口后续修复。不得用“观察”“后续再说”“不影响当前提交”等口径假装完成。
- 目标是最高层控制面，是必须完成的用户事项；TODO、任务包、空闲窗口调度、分派提示词、验证脚本和归档流程都只是服务目标的辅助工具。目标主线必须负责到底，但“目标主线未完成”不是禁止空闲窗口处理 TODO 的理由：只要 TODO 是已识别真实问题、无上游依赖、验证独立且不干扰主线，就可以安排给空闲窗口推进。继续派发前必须先判断：用户目标是否已经达到；如果未达到，剩余差距是什么；当前下一波是否直接推进这些差距；如果已达到，应进入验收、归档或向用户确认是否开启新目标。
- 第一目标永远是让用户指定问题所属的最小真实闭环跑通。闭环范围必须和问题匹配，不得把局部链路问题扩大成全系统从头验证。
- 固定顺序：先确认最小代码链路；代码链路没连通就先做最小修复；代码链路连通后，再跑与该问题直接相关的最小验证；验证失败就回到同一链路继续修。
- 主闭环没跑通前，不得先删分支、重构、抽象、加防护、加 fallback、补测试、改提示词、扩大范围，或用远大于问题范围的验证替代最小闭环。若执行中偏离，必须立刻停下并回到最小闭环。
- Agent 可以制定目标、计划和任务分配，但目标和计划必须服务于用户提出的真实任务，不能被 Agent 自己偏好的“干净”“薄”“轻量”“空壳”“先搭框架”等路线替换。
- 不得把完整实现改成薄实现，不得把成熟能力改成空壳接口，不得把迁移、整理、重构、优化、插件化或仓库拆分解释成削减功能。
- 涉及功能修复、能力开发、跨仓库调整、删除清理、发布链路或用户明确要求设计方案时，必须按完整功能模块对待：写清用户目标、真实使用场景、输入输出、状态变化、边界、调用链、验证方式和完成定义。
- 不得只做抽象接口、空 provider、空 adapter、无真实调用方的 glue code、只连线不产生功能闭环的代码连接，或只为“未来可能需要”创建无业务语义的中间层。任何新增抽象都必须服务于明确功能模块，并有真实生产方、消费方、数据流和验证证据。
## 总控快速检查卡

每次回复或改文档前，先用最小成本回答：

1. 用户目标和最终完成定义是什么；当前是否已经达到目标？
2. 如果未达到，剩余差距是什么；如果已达到，是否应该验收 / 归档 / 暂停，而不是继续派发？
3. 当前任务分区是什么，是否真的需要启用完整需求 / wave 流程？
4. 当前主线的下一处真实阻塞点在哪里，阻塞点之前还能安全完成哪些事？
5. 前期分析发现的问题是否已经进入 TODO / Backlog，还是明确说明了不入 TODO 的理由？
6. 当前派发是否应该组成任务包，任务包是否覆盖了同窗口、同边界、同验证链路下可关闭的 TODO，且每个任务包如何推进最终目标？
7. 分派提示词是否要求执行窗口先读取目标仓库 `AGENTS.md`，并明确声明自己当前窗口定位 / 仓库职责？
8. 是否需要 `AlembicTest` 测试交接；如果不需要，原因是否已经写清？

如果总控发现自己刚刚派发了碎片任务、漏记 TODO、没有判断最终目标是否达到、没有写清剩余差距、没有判断阶段顺序、没有说明阻塞点，必须立刻补 TODO、重排阶段、更新当前计划或说明纠偏；不要在错误节奏上继续推进。

## 任务分区入口

用户通常会指定单一任务。总控先按以下分区选择最小流程，不要把其它分区的动作一并展开：

- **入口同步**：用户要求读取当前状态、确认等待事项或继续总控工作时，只读取 `AGENTS.md`、`docs/workspace/index.md`、`docs/workspace/current/workspace-current-status.md` 和当前总控文档，输出状态、阻塞、待验收和下一步。
- **代码事实分析**：用户要求“分析真实代码”“现在如何实现”“为什么这样设计”时，读取相关子仓库 `AGENTS.md`、真实入口、调用链、配置和测试证据；输出代码事实、边界判断和风险。分析中发现的未闭合问题、删除候选、边界歧义、阶段依赖和后续验证点，必须落到对应 TODO / Backlog 或明确说明为何不入 TODO。除非用户要求派发或修改，不新建 wave，不输出执行提示词。
- **Design 交接接收**：需求讨论、bug / TODO / research / decision signal 和完整方案 handoff 优先由 `AlembicDesign` 产出；总控只做接收审查、当前主线影响判断、正式入账和后续流程选择。正规流程是 `AlembicDesign` 完成需求设计、目标和完成定义后，带 TODO / Backlog 挂载建议交回总控；总控正式写入全局 TODO、当前计划 TODO 或需求目录后，再按优先级、当前主线和目标阶段确认正常领取推进。`workspace-signal` / 小交流只在需要随时提醒 bug、当前主线风险、用户决策或轻量 TODO 时使用，不能替代完整需求 handoff 和正式 TODO 入账。signal / handoff 不是执行计划，不能直接派发。
- **分配计划**：用户要求“派发任务”“做一轮计划分配”“开始执行分配计划”时，必须先回到当前目标和完成定义，判断目标是否已经达到、剩余差距是什么、下一波是否直接推进该差距；再滚动当前 TODO / Backlog，并基于已确认文档和 TODO 依赖做阶段顺序、任务包、窗口覆盖、producer / consumer 依赖判断、分派表和可复制提示词。若当前计划没有最终完成定义、目标状态判断或后续阶段收束路线，必须先补计划或暂停确认，不能直接按 TODO 派发。每个可发送任务必须把“读取目标仓库 `AGENTS.md` 并明确当前窗口定位 / 仓库职责”写成执行前置硬规则；不要重新写需求设计，除非发现确认门禁被触发。
- **TODO 维护**：用户要求新增、调整、取消或重排 TODO 时，只更新当前正确 TODO 文档和受影响的调度状态；不自动进入需求设计或 wave，除非 TODO 改变主线阶段、窗口依赖或派发名单。
- **总控文档 / 规则治理**：用户要求整理规则、归档、模板、索引或总控能力时，只修改 workspace 文档、脚本、模板或 skill 资产；不触碰产品源码，不创建测试单，除非治理变更影响当前计划或用户要求验证。
- **验收 / 归档**：用户声明某窗口完成或要求归档时，读取回填证据，做功能完整性检查、文档状态更新和必要的归档；证据不足则补派对应窗口或 `AlembicTest`。
- **测试交接**：用户要求真实项目验证、冷启动、复现或回归时，只通过 `docs/workspace/current/alembic-test-exchange.md` 创建或更新 `AlembicTest` 测试单。

如果一个请求同时命中多个分区，先执行能解除当前阻塞的最小分区；其余事项记录为 TODO 或下一步，不要一次性铺开成全流程。

## 确认门禁

以下情况必须暂停派发或实现，先向用户确认：

- 需求目标、完整功能闭环、阶段顺序、仓库覆盖或完成定义不清。
- 需求不明确时，必须先在原始计划书和需求设计文档里列出确认问题，等待用户确认；不得进入派发或实现。
- 计划涉及删减、替换、降级、延期、只做部分、只搭框架、只保留接口、暂不接入或改变完整范围。
- 总控发现当前计划缺少最终完成定义、阶段顺序、producer / consumer 依赖判断，或用户中途新增目标、改变约束。
- 原始计划书、需求设计或任务级目标阶段确认尚未满足当前流程要求。

确认前，当前总控文档和 `docs/workspace/current/workspace-current-status.md` 必须保持 `暂停` 或等待确认口径，`发送给` 必须为 `无`；不要输出执行窗口可复制提示词，也不要把候选窗口标为 `待启动`。

## 仓库职责

- `AlembicCore`：共享、确定性、可复用、可运行的 Headless 内核能力。
- `AlembicAgent`：Agent runtime、AI provider、tool system、策略、上下文、memory、prompt、执行循环和宿主工具编排。
- `AlembicDashboard`：前端 UI、API client、前端状态、路由、样式、可视化和前端测试。
- `AlembicPlugin`：Codex MCP、Skill、channel/marketplace、插件 runtime、安装验证和 Codex 宿主适配。
- `Alembic`：本地增强底座、CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、file monitor、JobStore、internal AI jobs、平台能力和本地安装 / dev / release。
- `AlembicDesign`：独立需求设计 / signal 判断窗口，承接需求讨论、原始计划、需求设计、方案取舍和交给总控的 signal / handoff；不直接分派实现、不验收实现、不修改产品源码、不修改 workspace 当前状态。
- `AlembicTest`：独立测试验证窗口，承接真实测试项目操作、复现、冒烟、回归、冷启动监控、跨仓库集成验证和证据整理。它不是产品实现仓库；测试发现的问题必须回到对应源仓库修复。

不要把一个仓库的职责迁到另一个仓库来“简化”边界。边界调整必须有真实调用方、替代入口和验证证据。不要为了测试 Alembic 而改坏真实测试项目的产品结构、业务行为、UI、网络、登录、播放或模块边界。

## Workspace 仓库治理

- workspace 根目录不承载产品源码包，不作为 npm package、CLI、Dashboard、Plugin 或 Agent runtime 发布。
- workspace 根目录可以作为 `GxFn/AlembicWorkspace` 总控文档仓库，但只跟踪 workspace 自己的说明、计划、验收、索引和协作文档；不得把 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicDesign`、`AlembicTest` 或真实测试项目子仓库加入本仓库的 git 跟踪、submodule 或 gitlink。
- 子仓库源码、测试脚本和测试文档改动必须在各自仓库独立提交。
- 只有主控窗口可以提交 AlembicWorkspace 仓库里的文档、脚本、模板或 skill 资产。其它执行窗口可以按当前总控文档授权新建或回填 `docs/workspace/current/`、`docs/workspace/` 长期文档、`docs/<Repo>/` 等 workspace 文档，但不得自行对 AlembicWorkspace 仓库执行 git add / commit / push；完成后只回填路径、状态和证据，由主控窗口验收后统一提交 workspace 仓库。
- workspace 可以保管总控通用能力，例如 `scripts/`、`skills/`、`templates/` 下的验证脚本、分派模板、文档模板、Codex skill 草案或跨窗口协作工具。此类能力必须服务于工作区总控、文档治理、验证或协作，不得复制或替代子仓库产品实现。
- workspace 通用脚本默认应是 repo-neutral、参数化、无密钥、无用户绝对路径、无网络依赖；如果脚本会写入子仓库，必须有当前总控文档明确授权，并优先让对应子仓库窗口执行。
- workspace 内的 `skills/` 是可复用 skill 资产或草案的保管位置，不代表自动安装或自动启用；若某个 skill 需要安装到 Codex runtime、插件包或子仓库，必须在文档中明确安装位置、消费方和同步方式。
- 新增通用能力时，必须在对应目录 README 或当前总控文档中写清：用途、适用范围、调用方式、验证方式、禁止事项和维护归属。

## 文档落点

- `docs/workspace/index.md` 是 workspace 级唯一总控入口。所有跨仓库计划、当前状态、任务分派、文档挂载、验收索引和历史迁移入口都必须能从这个索引追踪到。
- workspace 级长期文档优先写到 `docs/workspace/`。新建或续写后，必须同步更新 `docs/workspace/index.md`，把文档挂载到对应的当前计划、执行阶段、仓库窗口或历史归档条目。
- `docs/requirement-designs/` 专门保存用户较大需求的原始计划书、需求设计文档和代码实现依赖调研；不要把具体 wave 派发、执行验收或回填堆到这里。
- `AlembicDesign/docs/current/` 保存 Design 活跃草案和 `workspace-signal` / `workspace-handoff`；总控接收后再决定是否转写到 workspace 正式账本。Design 不直接改总控当前状态。
- `docs/goal-stage-confirmation/` 专门保存“需求目标 + 分阶段确认”的长期流程；可复用模板统一保存到 `templates/`；具体某次任务的目标阶段确认文档写到 `docs/workspace/current/` 并从索引挂载。
- 与某个子仓库强相关的长期协作文档，优先写到 `docs/AlembicCore/`、`docs/AlembicAgent/`、`docs/AlembicDashboard/`、`docs/AlembicPlugin/` 或 `docs/Alembic/`，并从 workspace 总控文档或索引挂回。
- 当前状态、活跃 TODO、测试交流和正在执行的 workspace 总控计划优先写到 `docs/workspace/current/`；完成后再归档或提炼到长期文档。
- 与独立测试验证窗口或真实测试项目强相关的长期测试计划、复现记录和验证报告，优先写到 `AlembicTest/docs/`，并通过 `docs/workspace/current/alembic-test-exchange.md` 建立总控交流入口。
- `docs/` 根层级不再作为新的总控文档默认落点；除非用户明确要求兼容旧文档位置，否则不要继续把新协作文档散落在 `docs/` 根层级。
- 已存在于 `docs/` 根层级或其它历史目录的文档可以继续作为背景材料读取；若需要重写、续写或归档，短期执行入口优先在 `docs/workspace/current/` 建立，长期规则 / 契约 / 地图才写入 `docs/workspace/` 根层级，并标明来源。
- 子仓库内 `docs/` 只放随源码长期维护的产品文档、发布文档或用户文档；不要把跨仓库协作临时文档散落到子仓库内部。
- 即使真实测试项目自身包含 `docs/`，开发协作文件、阶段计划、验收记录、扫描结果和 Alembic 验证记录仍统一通过 workspace 总控文档或 `AlembicTest/docs/` 记录；真实测试项目仓库内 `docs/` 只保存必要的长期项目文档。
- 长期文档不得写入用户本机绝对路径、API key、token 或其它私密信息。
- 文档命名使用小写 kebab-case 和执行日 `YYYY-MM-DD`。具体模板以 `docs/workspace/index.md` 的当前规则为准。

## 需求到 Wave 流程

- 成熟需求到执行路线见 `docs/workspace/requirement-to-wave-execution-flow.md`；总控只保留流程门禁，不在 `AGENTS.md` 重复细节。
- `AlembicDesign` 的 signal / handoff 是总控输入，不是执行计划。正规需求路线是：Design 先完成需求设计、目标、完成定义、阶段候选和 TODO / Backlog 挂载建议；总控接收后正式入 TODO / Backlog 或需求目录，再决定补代码调研、创建测试单、进入目标阶段确认或启动 wave。随时的小交流 / `workspace-signal` 只用于必要提醒或风险同步，不能绕过正式 TODO 入账、代码事实和目标阶段确认；没有完成定义、代码事实或用户确认时，不派发执行窗口。
- 任务拆分不得只分配“抽象连接”“接口占位”“空 adapter”“无调用方 provider”“只改类型不落功能”的任务；如果某一阶段确实只做 contract，也必须有明确消费窗口、下一阶段消费方式和 targeted verification。
- 任务级确认文档必须写清：用户原始目标、对应需求设计文档、总控理解、最终完成定义、非目标、影响窗口、producer / consumer 依赖链、阶段计划、当前阶段判断、验证策略、风险和确认问题。流程以 `docs/goal-stage-confirmation/process.md` 为准；模板以 `templates/goal-stage-confirmation-template.md` 为准。
- 用户确认后，才能新建或激活具体 wave 执行计划。目标阶段确认文档只记录用户确认和阶段路线，不继续承载所有执行细节。激活 wave 后，`docs/workspace/index.md` 当前计划应切到 wave 执行计划，并只把当前无上游阻塞、发送后能实际推进的窗口改为 `待启动`。

## TODO 与 Backlog

- TODO / Backlog 是总控调度账本，不替代目标定义，也不自动驱动派发；进入 TODO 的真实问题仍归总控负责到底。
- `AlembicDesign` signal 不是正式 TODO；Design 完成需求设计并设定目标后，应作为正式 TODO / Backlog 候选交回总控，由总控挂到正确账本后再按当前主线、优先级、依赖和目标阶段确认推进。
- 当前主线进行时，新需求可以先进入 TODO；除非改变当前完成定义或用户明确要求打断，否则不得直接跳过当前主线。
- 当需要新增、调整、滚动、取消、优先级重排、Design handoff 接收、空闲窗口调度或 TODO 参与任务包派发时，读取 `skills/dev/alembic-workspace-control/SKILL.md`，并按 `references/todo-backlog.md` 执行细则。

## 窗口覆盖与分派

- 本窗口拥有统一调度权，必须根据真实代码、文档、构建链路和模块边界判断各 Alembic 子仓库、`AlembicDesign`、`AlembicTest` 或其它相关窗口是否需要承担任务。
- 所有 `待启动` / `执行中` 窗口的任务包和可复制提示词，必须要求执行窗口先读取本 workspace `AGENTS.md`、当前总控文档、目标仓库自己的 `AGENTS.md`，并明确声明当前窗口定位 / 仓库职责。
- 分派前必须区分最终覆盖窗口和当前可派发窗口，并判断 producer / consumer 依赖；下游不得在上游提交、接口或证据未回填前空跑。
- 状态为 `已完成`、`观察中`、`无任务` 的窗口不要发送提示词；状态为 `阻塞` 的窗口只有负责解除阻塞或阻塞已解除时才发送。
- 当需要创建 wave、窗口覆盖表、任务包、producer / consumer 顺序、发送名单或统一提示词时，读取 `skills/dev/alembic-workspace-control/SKILL.md`，并按 `references/window-dispatch.md` 执行细则。

## 总控脚本与自动化

- 当用户要求检查、升级或选择 workspace 脚本，评估流水线是否可继续自动化，或判断是否需要脚本使用 skill 时，读取 `skills/dev/alembic-workspace-control/SKILL.md`，并按 `references/script-pipeline.md` 执行细则。
- `scripts/README.md` 是 workspace 脚本入口索引；新增、重命名或删除 `scripts/*.mjs` 后，必须同步更新该索引，并运行 `node scripts/check-script-docs.mjs`。
- 新建或调整当前总控计划、Design handoff board、测试交流、归档入口或相关模板时，必须遵守 `scripts/README.md` 中的脚本可读格式说明和 `templates/workspace-control-plan-template.md`；不要随意重命名脚本依赖章节或改变窗口分派 / TODO / 任务包表结构。
- `node scripts/verify-control-center.mjs` 是默认总控验证编排；不要把它能自动覆盖的机械检查重复拆成口头流程，除非当前任务只需要其中一个更小脚本。
- 写入型脚本必须默认 dry-run 或显式 check，只有用户目标或当前总控文档需要写入时才使用 `--write` / `--apply`。

## 统一窗口分派提示词

当用户需要把下一波任务复制到其它 Codex 窗口时，总控窗口默认只输出一条通用提示词，让各窗口根据当前总控文档自行领取分配给自己的任务。详细发送 / 不发送判断见 `skills/dev/alembic-workspace-control/references/window-dispatch.md`。

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/<当前总控文档名>.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

再按照文档领取并完成分配给你所在窗口的任务。

完成后回填：完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

- 具体当前总控文档名、执行窗口列表和观察窗口判断，不写入 `AGENTS.md`。这些 wave 级信息必须写在 `docs/workspace/index.md` 和当前总控文档的“可复制分派提示词 / 分派表”章节中。
- 输出提示词前必须确认正文同时包含 `AGENTS.md` 和“定位”要求，并区分“发送窗口”和“观察 / 阻塞 / 无任务窗口”。

## 验收规则

- 总控验收不是被动收作业；验收时必须做功能完整性检查，确认实现已经形成真实可用的功能闭环，而不是只完成最小接口连接、类型导出、路由占位或静态返回。
- 功能完整性检查必须覆盖用户场景、输入输出、状态 / 数据变化、实际调用链、真实数据来源、真实消费方、失败路径、错误 / 边界路径和用户可执行的验证方式。
- 如果任务只实现了最小连接、空壳 API、静态 mock、未被消费的 contract、未挂真实入口或不能被用户实际操作，不能标为已完成。
- 如果验收发现最小实现，必须补一轮“非最小完整实现补齐”任务：明确缺失的真实入口、真实数据、真实状态变化、真实消费方、失败路径、验证命令和完成定义，并只派发能实际补齐功能闭环的窗口；不得把最小实现包装成已完成后继续推进下游。
- 总控验收时如果发现仓库之间有重复实现、重复脚本、发布链路冲突、边界错位、过度实现、误删、残留清理问题，或实现只停留在“能连上但无法真实使用”的薄功能，必须主动思考并调整后续计划。
- 每个阶段完成后，必须在执行文档中回填：完成范围、文件 / 模块变化、提交 hash、验证命令、验证结果、遗留风险和下一窗口任务。
- 验收不能只看本轮窗口是否回填完成，还必须检查当前 TODO / Backlog：已解决项写证据关闭，仍有效项转入下一波，新增发现补入 TODO，确认不做项写清理由。存在未处理主线 TODO 时，不得把主线归档为完成。
- 执行窗口回填 workspace 文档后，不得自行提交 AlembicWorkspace 仓库；workspace 文档提交只能由主控窗口在验收、去重、修正索引和确认无空转后统一完成。

## 测试与真实项目边界

- 总控窗口不再亲自执行真实项目测试、冷启动、重建、运行时监控、复现脚本、Dashboard 手动验证或真实项目验证；这些测试相关操作统一分派给 `AlembicTest` 或对应执行窗口。
- 总控可以制定测试目标、验收标准、观察点、风险和回填要求，但必须把测试脚本、测试配置、复现记录和长期验证报告放在 `AlembicTest/` 下，由测试窗口执行。
- 总控与 `AlembicTest` 的任务和结果交流必须通过专门测试交流文档 `docs/workspace/current/alembic-test-exchange.md`；不要在普通聊天里口头传递测试范围、结果和下一步判断。
- 总控创建测试任务时，先按 `templates/alembic-test-handoff-template.md` 填写测试单，再挂入 `docs/workspace/current/alembic-test-exchange.md`；测试单状态为 `待启动` 时才建议用户发送给 `AlembicTest`。
- 总控验收时可以读取执行窗口回填的测试证据、提交 hash、日志摘要和验证结果；如果证据不足，应补派 `AlembicTest` 或对应仓库窗口，而不是在总控窗口直接补测。
- 总控只改文档、脚本或分派规则时，可运行 workspace 文档 / 边界 / 格式校验；这些治理校验不等同于产品测试。若需要产品构建、运行时、冷启动或真实项目验证，必须交给对应窗口。
- 真实项目测试、冷启动监控和复现类脚本归独立 `AlembicTest` 仓库维护，不进入 AlembicWorkspace git 跟踪。
- `AlembicTest` 自身的 probe、报告、脚本索引或临时测试资产可以保持未提交状态；只要测试回填证据足够、产品仓库和真实测试项目没有非预期改动，就不得把 `AlembicTest` 未提交测试资产当作总控验收阻塞。提交 hash 可以记录为 `无`。
- 测试交流规则见 `docs/workspace/alembic-test-exchange-policy.md`；测试执行长期规则见 `AlembicTest/docs/testing-operation-policy.md`；默认测试参数见 `AlembicTest/config/defaults.json`。

## 跨仓库接入、删除与兼容清理

- 修改共享能力时，优先在源仓库完成、验证、提交。AlembicWorkspace 本地开发和总控验收优先使用 workspace 本地源码入口，例如 `../AlembicCore`、`../AlembicAgent`、`../AlembicDashboard`；当本地源码可用且任务不涉及发布、安装、runtime 快照或远程 CI 时，不要把 vendor/submodule/远程指针确认作为阻塞或派发任务。
- 只有发布、Codex plugin runtime、npm package、离线安装、远程 CI，或当前总控文档明确要求生成快照时，才检查或更新 vendor/submodule/远程指针；此时必须记录对应源仓库提交 hash。
- 不要把 `vendor/*` 子仓库当普通目录随手改散；如果必须在 vendor 内修源仓库能力，也要按独立源仓库 commit 处理，并同步回源仓库。若本轮采用本地源码模式，默认不触碰 `vendor/*`。
- 跨仓库接入和删除必须分阶段记录。不要在一个阶段里混合“复制、接入、删除、修测试、发布脚本调整”到不可回滚的大改动。
- 修复共享内核问题时，应优先在对应源仓库完成；外层只保留 adapter、wiring 和宿主能力。
- 删除计划只删除被替代的重复实现；不得删除 CLI、daemon、HTTP/API、Dashboard、Codex MCP、Skill、channel、release、本地增强底座或平台适配等仍属于对应仓库的能力。
- 外层删除必须满足三件事：import 扫描无遗留、替代入口已接入、代表性 build/check/lint/smoke 已通过。
- 清理工作中如果决定暂时保留兼容代码、兼容路由、兼容字段、fallback、adapter 或旧入口，必须同时记录真实消费方、保留理由、移除条件、后续清理触发点和推荐归属窗口。
- 不得为了“稳妥”保留没有明确消费方或清理计划的兼容层，避免后续遗忘并继续制造冗余与历史问题。
- 如果某个能力归属不确定，先做边界判断并记录理由；不要为了边界好看先裁掉真实链路。

## 技术栈与编码约定

- 修改某个子仓库时，先读取该子仓库自己的 `AGENTS.md`；如果根级规则与子仓库规则都适用，采用更严格、更保护真实实现和用户数据的规则。
- 技术栈、脚本、import 约定、alias、测试框架和格式化规则以目标子仓库的 `AGENTS.md`、`package.json`、配置文件和现有代码为准。
- 新增代码应遵守目标子仓库现有结构、package exports、模块边界和测试风格；不要在 workspace 根规则里推断具体实现细节。
- 必须尽量多地在代码旁补充简体中文说明，优先解释真实业务语义、迁移边界、状态机、分叉原因、降级原因、兼容路径、持久化影响和后续校验方式。
- 任何运行时分叉、fallback、降级、兼容转译、跳过、短路、重试、取消或错误归类，都必须打印足够明确的日志或诊断事件，日志要能看出触发条件、选择路径、关键输入、结果状态和后续校验依据。
- 保持数据结构、排序、预算、状态机、错误语义、持久化行为和用户可见 API 兼容。

## 验证要求

- 每次新建 / 激活目标阶段确认或 wave 执行计划后，优先运行 `node scripts/verify-control-center.mjs`。
- 如果当前计划使用 TODO 子模式来影响派发、并行调度或下一波顺序，运行 `node scripts/verify-control-center.mjs --require-todo`。
- 如果当前计划使用任务包派发、或下一波分派需要把主线动作与 TODO 合并派发，运行 `node scripts/verify-control-center.mjs --require-task-packages`；两者都需要时合并为 `node scripts/verify-control-center.mjs --require-todo --require-task-packages`。
- 如果修改 workspace 脚本、脚本 README 或脚本 skill 指南，还必须运行 `node scripts/verify-control-center.mjs --with-script-tests`。
- 如果只改长期文档且当前计划未变化，也至少运行 workspace docs verification 和 `git diff --check`。
