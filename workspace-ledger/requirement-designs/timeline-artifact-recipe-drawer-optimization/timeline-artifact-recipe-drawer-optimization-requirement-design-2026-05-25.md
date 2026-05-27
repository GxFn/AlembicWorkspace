# Timeline Artifact Recipe Drawer Optimization 需求设计

Design Key：ARTIFACT-DRAWER-2026-05-25
日期：2026-05-25
状态：准备交给 AlembicWorkspace 评审
维护窗口：AlembicDesign
总控：AlembicWorkspace
原始计划：[timeline-artifact-recipe-drawer-optimization-original-plan-2026-05-25.md](timeline-artifact-recipe-drawer-optimization-original-plan-2026-05-25.md)

## 原始计划书

- 原始计划书：[timeline-artifact-recipe-drawer-optimization-original-plan-2026-05-25.md](timeline-artifact-recipe-drawer-optimization-original-plan-2026-05-25.md)
- 原始计划书确认状态：用户已确认
- 用户确认时间：2026-05-25

## 已确认目标

将 Timeline 产物详情改成与 Recipe 详情 / 进化信息一致的双层抽屉体验。关键不是从零重做抽屉，而是复用或对齐已有 Recipe evolution 双层抽屉逻辑，补齐 Timeline artifact detail 的窄屏适配：窄屏时第二层抽屉覆盖第一层，保持通用抽屉样式，并提供清晰返回按钮。

已确认约束：

- 该需求是独立 Dashboard UI 优化，不和 PCV metrics、LLM input optimization 或 artifact producer 改动混合。
- 双层抽屉逻辑在 Recipe 详情的进化信息中已经存在。
- 第一版重点是窄屏适配，不大改第二层抽屉通用样式。
- 第二层需要返回按钮。
- 用户希望立即启动，认为它是前端单独库修改，不影响当前主线。

## 当前主线关系

TODO 候选 / 可并行独立 Dashboard UI 优化候选。

理由：该需求与当前 LLM 输入优化 Wave 5 的 artifact detail UI相邻，但用户明确要求独立管理，并补充该修改是前端单独库层面的 UI 适配，不影响当前主线。Design 建议 AlembicWorkspace 接收后先做最小代码事实确认；若确认文件范围和验证路径独立，可作为独立 Dashboard UI 优化立即启动。Design 不直接派发实现窗口。

## 用户场景

开发者在 Dashboard Timeline 中查看某个 LLM input / output artifact 时：

1. 在 Timeline 列表中点击“产物详情”。
2. 第一层抽屉展示事件 / artifact 概览、摘要、关键 metadata 和 deep detail 入口。
3. 点击完整 artifact 或其它深层信息后，打开第二层抽屉。
4. 宽屏下第一层与第二层并排展开，便于同时保留上下文和阅读深层内容。
5. 窄屏下第二层覆盖第一层，不挤压成双窄栏；用户可通过返回按钮回到第一层。

## 功能闭环

- 输入：Timeline event、artifact refs、artifact read state、metrics / trace summary，以及现有 Recipe evolution drawer 的双层抽屉交互能力。
- 输出：Timeline artifact detail 的两层抽屉体验；宽屏并排、窄屏覆盖、第二层返回按钮、保留当前 artifact / metrics / trace 信息。
- 状态变化：Dashboard 前端详情面板状态从单层 artifact detail 扩展为可打开第二层 deep detail 的 drawer stack；窄屏下 drawer stack 采用覆盖 / 返回语义。
- 生产方：AlembicDashboard UI 组件和状态管理；现有 Recipe detail / evolution drawer 作为模式来源。
- 消费方：查看 Timeline artifact detail 的开发者；总控 / AlembicTest 后续可用 Browser 截图验证响应式行为。
- 失败路径：Recipe 双层抽屉无法复用时，至少复用 drawer shell / responsive CSS pattern；artifact 缺失或读取失败时第二层展示失败状态；窄屏断点下若无法并排则必须覆盖显示，不允许水平滚动或内容严重压缩。

## 需求明确性检查

- 完整功能闭环：已形成，核心闭环是 `Timeline event -> 第一层 artifact 概览 -> 第二层 deep detail -> 窄屏返回`。
- 验证方式：Dashboard 侧响应式验证，至少覆盖宽屏双层并排和窄屏第二层覆盖第一层；确认返回按钮可回到第一层。
- 完成定义：复用 / 对齐 Recipe evolution 双层抽屉逻辑；补 Timeline artifact detail 窄屏覆盖适配；第二层保留通用样式并有返回按钮；不改变 API。
- 仍不明确的问题：Recipe evolution 双层抽屉具体可复用边界、Timeline artifact detail 当前组件文件和是否存在与当前 Wave 5 改动的文件冲突。

## 仓库边界

| 仓库 / 窗口 | 职责 | 包含范围 | 不包含范围 |
| --- | --- | --- | --- |
| Alembic | 观察 | 只有 Dashboard 发现 artifact API 缺口时再回填阻塞 | 不改 artifact producer / storage / API |
| AlembicCore | 无任务 | 无共享 contract 需求 | 不改 Core schema |
| AlembicAgent | 无任务 | 无 Agent 输入输出改动 | 不改 Agent prompt / runtime |
| AlembicDashboard | 主责 | Recipe drawer 模式复用、Timeline artifact detail 双层 drawer、窄屏覆盖、返回按钮、响应式验证 | 不改后端 API；不做 PCV metrics UI |
| AlembicPlugin | 无任务 | 无 plugin 路由影响 | 不改 Codex host-agent |
| AlembicTest | 后续观察 / 验证 | 若总控提升，可能承接 Browser / screenshot 响应式验证 | Design 阶段不创建测试单 |

## 外部调研判断

- 是否需要联网：暂不需要。
- 判断理由：用户明确指出双层抽屉逻辑已经在本地 Recipe 详情进化信息中存在，优先做本地代码复用和窄屏适配；外部通用 drawer pattern 暂不构成关键依据。
- 若需要，优先来源：仅当 Dashboard 本地没有可复用 responsive drawer stacking pattern 时，再调研成熟产品的 responsive master-detail / drawer stacking 实践。
- 若不需要，说明原因：第一版不是新设计系统，而是对已有本地交互的复用。
- 外部结论如何约束或启发本地方案：暂不适用。

## 代码事实与调研缺口

### AlembicCore

- 已有能力：无直接相关。
- 关键文件：无。
- 缺口：无。

### Alembic

- 已有能力：当前 artifact API / trace / metrics producer 已在父级主线中存在，但本需求默认不改。
- 关键文件：待总控确认当前 Wave 5 回填后是否有 API 缺口。
- 缺口：默认无；Dashboard 若发现数据不足再回填阻塞。

### AlembicPlugin

- 已有能力：无直接相关。
- 关键文件：无。
- 缺口：无。

### AlembicDashboard

- 已有能力：用户确认 Recipe 详情的进化信息已经存在双层抽屉逻辑；当前 Timeline artifact detail 已有单层产物详情。
- 关键文件：待代码调研确认 Recipe detail / evolution drawer、Timeline artifact detail 组件、drawer shell / responsive CSS / state 管理位置。
- 缺口：需确认可复用边界、窄屏断点实现、返回按钮接入点、现有测试和当前主线文件冲突风险。

### AlembicAgent

- 已有能力：无直接相关。
- 关键文件：无。
- 缺口：无。

### AlembicTest / 真实项目验证

- 是否纳入：后续可纳入。
- 理由：该需求是 Dashboard 响应式 UI 体验，若进入执行，应至少用 Browser / screenshot 或前端测试证明宽屏和窄屏行为。
- 目标项目（如有）：不需要真实 iOS 项目；可用 Dashboard fixture 或本地 dev data。

### AlembicDesign / 总控交接

- 本设计窗口已完成：独立方案、用户确认、范围收窄、当前主线关系和仓库边界。
- 仍需总控复核：是否立即并行启动；是否先做代码事实调研；是否存在当前 Wave 5 Dashboard 文件冲突。
- 是否处于 detached-design-mode：否。

## 代码实现依赖调研

- 是否需要单独调研附件：轻量代码事实调研即可，建议由总控或 Dashboard 执行窗口在接收后完成。
- 建议调研入口：
  - Recipe 详情 / evolution second-level drawer 组件。
  - Timeline artifact detail 当前 drawer / panel 组件。
  - Dashboard drawer shell / responsive CSS / breakpoint utilities。
  - 当前 Wave 5 Dashboard 改动文件，确认是否冲突。
- 关键生命周期：Timeline event selected -> first drawer open -> deep detail selected -> second drawer open -> narrow breakpoint overlay -> back closes second drawer.
- 共享状态 / 持久化位置：仅前端 UI state，不新增持久化。
- producer / consumer 硬依赖：消费现有 artifact refs / artifact read result；不生产后端数据。
- 不能切换 / 不能删除 / 不能提前消费的边界：不能改 artifact API；不能删掉当前 Timeline artifact detail 能力；不能把该需求并入 PCV metrics 或 LLM input producer。
- 待总控补证的问题：Recipe drawer 代码位置、复用粒度、Dashboard 文件冲突和验证命令。

## 设计选项

### 选项 A：复用现有 Recipe evolution drawer pattern

- 描述：使用 Recipe evolution 已有双层抽屉逻辑或至少复用其 drawer shell / state / responsive style，把 Timeline artifact detail 的第二层接入同一模式。
- 优点：贴合用户要求；改动集中；视觉一致；避免新增一套 drawer 机制。
- 风险：Recipe 业务组件和 artifact detail 数据差异可能导致只能复用外壳 / pattern，不能复用内容组件。

### 选项 B：为 Timeline artifact detail 新建独立双层 drawer

- 描述：保留 Recipe drawer 不动，为 artifact detail 单独做一套双层抽屉。
- 优点：局部自由度高。
- 风险：违反用户“不需要大改”和复用已有逻辑的意图；后续维护两套交互。

## 推荐方案

推荐选项 A：复用现有 Recipe evolution drawer pattern。

第一版重点不是视觉重做，而是补齐 Timeline artifact detail 在窄屏下的第二层覆盖行为和返回按钮。实现时应优先复用通用抽屉壳层、层级状态、断点样式和关闭 / 返回语义；如果业务内容无法直接复用，则只复用 drawer infrastructure。

## 用户确认记录

| 时间 | 决策 / 偏好 | 影响 |
| --- | --- | --- |
| 2026-05-25 | 需求独立管理 | 不并入 PCV metrics、LLM input optimization 或 artifact producer 主线。 |
| 2026-05-25 | 双层抽屉逻辑已有 | 优先复用 Recipe 详情 evolution 信息的双层抽屉模式。 |
| 2026-05-25 | 第一版重点做窄屏适配 | 不大改第二层通用样式，补覆盖和返回按钮。 |
| 2026-05-25 | 希望立即启动 | Design 建议总控接收后确认无文件冲突即可并行启动 Dashboard UI 优化。 |

## 禁止的伪实现

- 新建一套与 Recipe drawer 完全无关的 Timeline 专用复杂抽屉系统。
- 为了窄屏适配改后端 artifact API。
- 只隐藏第二层而不提供返回 / 关闭路径。
- 窄屏仍并排展示两层，导致内容不可读。
- 把该需求塞进 PCV metrics、LLM input optimization 或 artifact producer 验收范围。

## 差距分析

| 能力 | 当前状态 | 缺口 | 归属窗口 | 风险 |
| --- | --- | --- | --- | --- |
| Recipe second drawer | 用户确认已存在 | 需代码定位和复用边界确认 | AlembicDashboard | 复用粒度不清 |
| Timeline artifact detail | 当前已有单层详情 | 需接入 drawer stack / second layer | AlembicDashboard | 长内容和状态迁移 |
| Narrow responsive overlay | 待补 | 需第二层覆盖第一层和返回按钮 | AlembicDashboard | 窄屏不可读 |
| Verification | 待补 | 需宽屏 / 窄屏截图或前端测试 | AlembicDashboard / AlembicTest | 回归不可见 |

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响目标 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARTIFACT-DRAWER-TODO-1 | 主线候选 | 调研 | P1 | `AlembicDashboard` | 定位 Recipe evolution 双层抽屉和 Timeline artifact detail 组件，确认复用边界和文件冲突。 | 是 | 总控接收后 | `AlembicDashboard` |
| ARTIFACT-DRAWER-TODO-2 | 主线候选 | 实现候选 | P1 | `AlembicDashboard` | 复用 drawer pattern，为 Timeline artifact detail 第二层补窄屏覆盖和返回按钮。 | 是 | 代码调研通过 | `AlembicDashboard` |
| ARTIFACT-DRAWER-TODO-3 | 主线候选 | 验证 | P1 | `AlembicDashboard` / `AlembicTest` | 提供宽屏并排和窄屏覆盖的截图 / Browser 验证证据。 | 是 | 实现完成后 | `AlembicDashboard` 或 `AlembicTest` |

## 阶段候选

1. Dashboard 代码事实调研：定位 Recipe second drawer、Timeline artifact detail、breakpoint / drawer shell。
2. 窄屏适配实现候选：复用现有 drawer stack，补第二层覆盖和返回按钮。
3. 响应式验证候选：宽屏并排、窄屏覆盖、返回按钮、长内容滚动。

阶段候选不等于执行派发。最终阶段顺序必须由 `AlembicWorkspace` 基于代码实现依赖调研和目标阶段确认确定。

## 验证策略

- 最小验证：Dashboard targeted check / typecheck，通过组件状态和样式检查证明无类型或基础回归。
- 响应式验证：Browser / screenshot 覆盖宽屏双层并排和窄屏第二层覆盖第一层；验证返回按钮回到第一层。
- 测试窗口交接：如果总控认为需要独立视觉证据，可交给 AlembicTest；否则 Dashboard 执行窗口可直接回填截图和验证命令。

## 非目标与禁止捷径

- 不做后端 API 改动。
- 不做 PCV metrics UI。
- 不大改第二层通用样式。
- 不把该需求混入当前 LLM 输入优化 Wave 5 的完成定义。
- 不触碰 AlembicAgent / AlembicPlugin / AlembicCore。

## 开放问题

1. 总控是否接受用户判断：该 UI 优化可立即并行启动，不影响当前主线。
2. Dashboard 代码调研是否证明 Recipe evolution drawer 可复用，还是只能复用样式和响应式 pattern。
3. 第一版第二层 deep detail 是否仅接完整 artifact，还是同包接 trace / metrics detail。

## Workspace 交接准备状态

准备交给 AlembicWorkspace 评审。

## 进入总控流程建议

- 建议下一步：总控接收为独立 Dashboard UI 优化候选，先做最小代码事实调研；若无文件冲突，可立即派给 AlembicDashboard。
- 是否需要补充代码调研：需要，但范围很小，集中在 Dashboard drawer 组件。
- 是否需要进入 `AlembicWorkspace` 目标阶段确认：这是小型 UI 优化，可由总控判断是否直接作为独立 TODO / wave；Design 不直接决定。
- 明确不应派发的窗口：不要派 Alembic / AlembicCore / AlembicAgent / AlembicPlugin；不要让真实测试项目参与。

## 交接前自检

- 已对照 `docs/workspace-alignment-checklist.md`：是。
- 原始计划已确认：是。
- 完整功能闭环已写清：是。
- 代码事实 / 调研缺口已分开：是。
- 阶段仍是候选，没有写成 wave：是。
- TODO / Backlog 已记录：是。
- 仍需用户确认的问题已列出：当前无用户侧阻塞；剩余为总控 / Dashboard 代码事实确认。
