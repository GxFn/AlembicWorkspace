# Timeline Artifact Recipe Drawer Optimization 原始计划书

Design Key：ARTIFACT-DRAWER-2026-05-25
日期：2026-05-25
状态：用户已确认
维护窗口：AlembicDesign
总控：AlembicWorkspace

## 用户目标

将当前 Timeline 的产物详情体验独立优化为类似 Recipe 详情抽屉的交互：第一层抽屉承载 Timeline 事件 / 产物详情，第二层抽屉承载更深层的进化信息、artifact 内容或关联明细；宽屏时双层抽屉可以并排展开，窄屏时第二层抽屉应覆盖在第一层抽屉之上，保证阅读和操作优雅，不被挤压成难用的窄栏。

本需求必须作为单独优化方案管理，不和 PCV metrics、LLM input optimization、Timeline artifact producer、metrics / trace 展示闭环混在一起。

## 用户原话 / 关键约束

```text
现在的产物详情，我希望做成 Recipe 详情抽屉，弹出进化信息的那种双层抽屉；然后这个第二层抽屉能够支持在窄屏幕的适配，也就是覆盖在第一层抽屉上，这样宽屏全展开，窄屏能够优雅的显示第二层抽屉；制定这个需求为单独的优化方案，不要和别的混在一起
```

用户确认补充：

```text
双层抽屉的逻辑已经存在了，Recipe 详情的进化信息就是；现在需要做的是窄屏适配，我建议第二层就保持底层抽屉通用的样式，不需要大改，需要有返回按钮；我希望的时机是立即启动，现在主线也不影响前端单独库修改；
```

截图证据：用户提供的当前 Dashboard 画面显示 Timeline 右侧已有单层“产物详情”抽屉，包含 Timeline 摘要投影、artifact 内容、Metrics、Trace envelope 等内容；当前需求关注这个详情体验的抽屉层级和响应式行为。

## 为什么现在做

当前 Timeline artifact detail 已经从“是否能看到 artifact / metrics / trace”进入到“如何优雅阅读和逐层钻取”的交互问题。用户进一步指出，双层抽屉逻辑在 Recipe 详情的进化信息中已经存在，因此本需求不是从零设计新交互，而是把 Timeline artifact detail 对齐到已有双层抽屉能力，并重点补齐窄屏适配。

用户希望借鉴 Recipe 详情抽屉里“详情 + 进化信息”的双层抽屉方式，让 artifact detail 有更清楚的信息层级，同时在窄屏下第二层不挤压第一层，而是覆盖显示。

## 期望结果

需求完成后应该成立：

1. Timeline 事件仍在主区域展示。
2. 点击 Timeline 事件或“产物详情”后打开第一层详情抽屉。
3. 第一层详情抽屉采用 Recipe 详情抽屉的视觉和交互模式，而不是一个孤立的专用面板风格。
4. 点击 artifact、evolution / trace / metrics 关联信息或深层明细后，打开已有通用样式的第二层抽屉。
5. 宽屏下第二层抽屉可以和第一层抽屉同时展开，形成主内容 + 第一层详情 + 第二层详情的完整展开布局。
6. 窄屏下第二层抽屉覆盖在第一层抽屉上方，第一层保持背景 / 返回上下文，用户可以关闭或返回第二层，不出现两列被压窄到不可读的状态。
7. 该优化只改变 Dashboard 详情交互和响应式布局，不改变 artifact API、trace / metrics producer、LLM input artifact 语义或 Recipe 数据模型。

## 最终完成定义草案

- Dashboard Timeline artifact detail 使用与 Recipe 详情一致或共享的 drawer interaction pattern；优先复用 Recipe 详情 evolution 信息已有的双层抽屉逻辑。
- 第一层抽屉和第二层抽屉有清晰的信息分工：
  - 第一层：Timeline 事件摘要、artifact refs、关键 metrics / trace 摘要、入口按钮。
  - 第二层：完整 artifact 内容、evolution / trace deep detail、可滚动长内容或关联明细。
- 宽屏断点下双层抽屉可以并排展开，宽度稳定，主 Timeline 不被完全遮蔽。
- 窄屏断点下第二层抽屉覆盖第一层抽屉，支持明确返回按钮和关闭按钮，不产生水平滚动、文本严重压缩或内容遮挡。
- 空态、加载态、artifact 缺失、读取失败和长内容滚动都在双层抽屉中有可读表现。
- 保留当前 artifact detail 的信息能力：Timeline 摘要、artifact 内容、metrics、trace envelope 不因交互改版丢失。
- 有 Dashboard 侧响应式验证证据，至少覆盖宽屏双层并排和窄屏第二层覆盖第一层两类视口。

## 当前主线关系

独立 Dashboard UI 优化候选；用户希望立即启动。

该需求与当前 LLM 输入优化 Wave 5 的 Dashboard artifact detail 展示相邻，但用户明确要求“单独的优化方案，不要和别的混在一起”。用户进一步说明希望立即启动，且认为它是前端单独库修改，不影响当前主线。Design 建议总控按独立 Dashboard UI 优化接收，确认无文件冲突后可并行启动；它不应作为当前 artifact / trace / metrics 闭环的隐藏追加范围，也不应和 PCV metrics 需求合并。

## 初始范围

包含：

- Timeline artifact detail 的双层抽屉信息架构。
- 复用或对齐 Recipe 详情抽屉 / evolution drawer 已有双层抽屉逻辑。
- 宽屏并排双层抽屉布局。
- 窄屏第二层覆盖第一层的响应式行为。
- 第二层打开、关闭、返回按钮、焦点 / 滚动边界的体验定义。
- artifact 缺失、加载、失败、长内容的详情展示状态。

不包含：

- 不改变 artifact API、job artifact storage、trace envelope、llmMetrics producer。
- 不改变 Recipe / evolution 的业务数据模型。
- 不把 Dashboard 做成 PCV metrics comparison UI。
- 不纳入 PCV metrics 方案。
- 不作为当前 LLM 输入优化 Wave 5 的隐藏验收条件。
- 不大改第二层抽屉视觉样式；优先保持底层 / 通用抽屉样式。
- 不派发实现窗口。

## 初步仓库影响

| 仓库 / 窗口 | 初步判断 | 理由 |
| --- | --- | --- |
| Alembic | 观察 | 当前需求默认不改 API / artifact producer；若 Dashboard 发现数据缺口再由总控评审。 |
| AlembicCore | 无任务 | 不涉及共享 contract 或 Core schema。 |
| AlembicAgent | 无任务 | 不改变 internal Agent 输入输出能力。 |
| AlembicDashboard | 参与 / 待调研 | 主要影响 Timeline 详情 UI、Recipe 详情抽屉复用、响应式布局和前端测试。 |
| AlembicPlugin | 无任务 | 不影响 Codex host-agent plugin 路由。 |
| AlembicTest | 观察 / 后续参与 | 若总控提升该优化，可能需要 Browser / screenshot 响应式验证证据。 |
| AlembicDesign | 草案 | 当前只形成独立优化方案，不进入实现派发。 |

## 已知事实

- 用户截图显示当前 Timeline 已有右侧“产物详情”单层抽屉，内容包括 Timeline 摘要投影、artifact、完整 redacted artifact、Metrics、Trace envelope 等。
- 用户明确希望改成类似 Recipe 详情抽屉中弹出进化信息的双层抽屉。
- 用户明确要求窄屏时第二层抽屉覆盖第一层抽屉，而不是继续并排压缩。
- 用户明确要求该需求作为单独优化方案，不和其他需求混合。

## 待补代码事实

- `AlembicDashboard` 当前 Recipe 详情抽屉和 evolution / second-level drawer 的组件位置、状态管理和响应式断点；用户已指出双层逻辑存在，但仍需代码定位。
- Timeline artifact detail 当前组件、路由 / state、artifact 读取和详情面板布局。
- 现有设计系统中 drawer / modal / sheet 是否已有 stacking、overlay、focus trap、escape close、back action 支持。
- Dashboard 当前测试体系是否已有响应式截图或 Playwright / Browser 验证路径。

## 外部调研初判

- 是否需要联网：暂不需要。
- 理由：这是对既有 AlembicDashboard 交互模式的复用和响应式调整，关键约束来自本地 Recipe drawer 和 Timeline artifact detail 代码事实。
- 若需要，建议来源：如后续发现本地没有成熟 drawer stacking 模式，可再调研常见 responsive master-detail / drawer stacking 设计实践。

## 风险 / 设计分叉

- **范围混入风险**：该需求容易被并入当前 LLM artifact 展示主线，导致 Wave 5 scope 膨胀；必须独立管理。
- **组件复用风险**：如果 Recipe 详情抽屉和 Timeline 详情面板数据结构差异大，强行复用组件可能制造耦合；应优先复用 drawer shell / responsive pattern，而不是强行复用业务内容。
- **窄屏可用性风险**：双抽屉并排在窄屏会不可读；第二层必须覆盖第一层，并有明确返回 / 关闭行为。
- **长内容滚动风险**：artifact 内容很长，第二层需要独立滚动，不应让页面主体和第一层抽屉滚动互相打架。
- **焦点和关闭语义风险**：双层 drawer 要明确 Escape、关闭按钮、点击遮罩、返回按钮分别作用于哪一层。

## 开放问题

1. 代码调研需确认 Recipe evolution 双层抽屉的可复用边界：复用通用 drawer shell、复用状态机，还是只复用响应式 CSS / layout pattern。
2. 第二层抽屉首批 deep detail 建议从完整 artifact 内容开始；trace / metrics detail 是否同批进入由总控基于 Dashboard 代码事实确认。
3. 宽屏并排时第二层宽度固定还是按比例分配，建议沿用现有 Recipe 第二层抽屉策略。

## 需要确认

本原始计划书不是实现计划。用户侧关键决策已确认；进入总控前仍需 AlembicWorkspace 确认：

- 该优化是否作为独立 Dashboard UI 优化候选进入总控 TODO / Backlog。
- 是否按用户建议立即启动，作为不影响当前主线的前端独立优化。
- 是否由总控先做最小代码事实确认：Recipe evolution 双层抽屉可复用点、Timeline artifact detail 当前组件和文件冲突风险。

确认前禁止：

- 写执行 wave。
- 建议发送实现窗口。
- 把阶段候选写成派发顺序。
