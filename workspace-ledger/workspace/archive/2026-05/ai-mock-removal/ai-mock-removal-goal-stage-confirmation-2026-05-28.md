# AI Mock Removal Goal Stage Confirmation

日期：2026-05-28
状态：已确认，Deletion Wave 1 已启动
发送给：无

## 用户原始目标

```text
领取 AI-MOCK-REMOVAL-2026-05-28。用户已确认按 Design 推荐执行：删除产品 runtime AI mock，范围覆盖 AlembicAgent 产品导出 / provider registry / factory fallback；test-local fake / fixture 可保留但必须隔离，不能命名或暴露为产品 AI mock provider；历史 mock-generated 数据由 Stage 0 查证后决定 cleanup；Dashboard mock UI/API 优先直接删除。该需求先于 037 收敛、038、039 执行。请总控先做 Stage 0 跨仓库代码事实调研和目标阶段确认，再决定 deletion wave。
```

## 总控理解

- 目标：从产品 runtime 中移除可被用户、daemon、HTTP API、Dashboard 或 package public API 选择 / 消费的 `mock` AI provider 和 Mock bootstrap path。
- 关键约束：测试局部 fake / fixture 可保留，但必须是 test-local，不能继续叫产品 AI mock provider，不能从产品导出、registry、factory fallback 或 Dashboard UI/API 暴露。
- 不能偏离的边界：不是删除所有测试 fake；不是改成另一个空 provider；不是把无 AI key 场景伪装成成功；不是用 mock path 继续证明 PCV / cold-start runtime。
- 关键设计分叉：历史 mock-generated 数据当前本机未发现需要 cleanup 的真实 DB 记录，先删除产品 mock 入口；若后续发现项目数据库残留，再做独立数据 cleanup / migration 决策。
- 当前不确定点：Alembic vendor Dashboard 是否随 Stage 1 一起清理，还是由 Alembic / Dashboard 两侧完成后再同步 vendor；这不改变删除目标。

## 前置需求设计

- 原始计划书：[AlembicDesign original plan](../../../../../AlembicDesign/docs/current/ai-mock-removal-original-plan-2026-05-28.md)。
- 需求设计文档：[AlembicDesign requirement design](../../../../../AlembicDesign/docs/current/ai-mock-removal-requirement-design-2026-05-28.md)。
- 代码实现依赖调研：[Stage 0 code fact baseline](../../../../../codex-control-workspace/.wakeflow-active/current/ai-mock-removal-stage-0-code-fact-baseline-2026-05-28.md)。
- 调研结论：产品 mock 暴露集中在 `AlembicAgent` provider / public export / registry / fallback、`Alembic` runtime mock bootstrap / HTTP AI routes / DI fallback、`AlembicDashboard` mock switch UI / cleanup API client / copy；`AlembicCore` 与 `AlembicPlugin` 当前只需观察或历史文案清理。
- 当前已有能力：真实 provider 配置、AI unavailable 事件路径、Dashboard provider config modal、AlembicTest 默认 AI 配置 fallback 规则已存在。
- 主要缺口：无 AI key fallback 仍返回 product mock provider；internal dimension execution 遇 mock 进入 `MockBootstrapPipeline`；Dashboard 仍展示 mock cleanup / switch 逻辑。
- 功能闭环：无真实 AI provider 时应显式进入 AI unavailable / configuration required 状态；有真实 provider 时走真实 AI runtime；测试只能用局部 fake / fixture。
- 生产方 / 消费方：`AlembicAgent` 生产 provider API 和类型；`Alembic` 消费 provider 并对外提供 daemon / HTTP / bootstrap runtime；`AlembicDashboard` 消费 HTTP provider list / config；`AlembicTest` 只做真实配置 smoke。
- 本确认文档对需求设计文档的调整：Design 推荐已被用户确认；Stage 0 增加事实：本机 BiliDili Ghost DB 与 AlembicWorkspace Ghost DB 未发现 mock source / createdBy 残留。

## 最终完成定义

- 用户场景完成：用户无法在产品 runtime、Dashboard UI 或 HTTP API 中选择 / 切换 / 清理 `mock` AI provider；无 AI key 时得到明确配置缺失反馈。
- 功能 / 边界完成：`AlembicAgent` 不再产品导出 `MockProvider`，provider registry / factory / auto-detect 不再接受或 fallback 到 `mock`；测试 fake 保留在 test-local helper 中。
- 输入输出和状态变化完成：`ALEMBIC_AI_PROVIDER=mock`、`provider=mock` API 请求或 Dashboard 切换不能成功进入 mock runtime；bootstrap 不再产生 `mock-pipeline` / `mock-generated` 产物。
- 跨仓库消费完成：`Alembic` 改用 real-provider / AI unavailable 语义消费 `AlembicAgent`；`AlembicDashboard` 删除 mock UI / cleanup API；`AlembicTest` 真实 smoke 使用真实 / 默认 AI 配置，不再依赖 mock。
- 删除 / 保留完成：删除产品 `MockProvider` / `MockBootstrapPipeline` / `/ai/mock/cleanup` / Dashboard mock cleanup UI；保留 test-local fake / fixture 时命名为 test fake / stub，不暴露为 product provider。
- 文档和证据完成：各窗口回填提交 hash、diff 范围、验证命令、验证结果、遗留风险；总控记录验收结论和 PCVM unblock 条件。
- 验证完成：源仓库 typecheck / targeted tests 通过；总控复核 `rg` 不再在产品 runtime 暴露 `MockProvider`、`provider: 'mock'`、`/ai/mock/cleanup`、`MockBootstrapPipeline`；最后由 `AlembicTest` 在真实 / 默认 AI 配置下做最小 cold-start smoke。

## 非目标

- 不做：不优化 Agent prompt、不推进 037 / 038 / 039、不继续 PCVM N8 / N11 / N12 harness，直到 mock runtime 问题关闭。
- 不做抽象占位：不新增空 provider、空 adapter、静态 mock、无调用方 glue code 或“未来可替换”的中间层。
- 暂不删除：测试局部 fake / fixture 可保留；历史 DB cleanup 仅在 Stage 0 / 后续 evidence 证明有残留时做。
- 暂不发布：不做 npm / plugin release，除非实现窗口发现 package export 变更必须补 release note。
- 不涉及窗口：`BiliDili` 真实项目不改源码；`AlembicCore` / `AlembicPlugin` 无产品 runtime mock 入口时不派发实现。

## 影响范围

最终覆盖窗口：

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动候选 | 删除 runtime mock bootstrap / HTTP mock API / DI mock fallback，改为 AI unavailable 或真实 provider 路径。 |
| `AlembicCore`<br>观察中 | 当前未发现产品 AI mock provider；只观察 cleanup route 删除后是否留下未用 repository helper。 |
| `AlembicAgent`<br>待启动候选 | 删除产品 `MockProvider` 导出、registry / factory mock id、auto-detect fallback；迁移 tests 到 test-local fake。 |
| `AlembicDashboard`<br>待启动候选 | 删除 mock switch / cleanup UI、API client、i18n mock copy；更新 dashboard contract tests。 |
| `AlembicPlugin`<br>观察中 | 当前未发现产品 runtime mock provider；仅保留历史 changelog / package 观察。 |
| `AlembicDesign`<br>已完成 | 已完成需求设计和用户确认输入；不派发实现。 |
| `AlembicTest`<br>后续待启动 | 产品删除完成后，使用真实 / 默认 AI 配置做最小 runtime smoke；不再用 `ALEMBIC_AI_PROVIDER=mock`。 |
| `BiliDili`<br>无任务 | 只作为受保护真实测试项目，不改源码；本机 Ghost DB Stage 0 只读查证未发现 mock 残留。 |

补充说明：

- 新发现的关联仓库 / vendor / artifact：`Alembic/vendor/AlembicDashboard` 仍有 mock UI 残留，是否随 Alembic wave 同步由实现窗口基于 vendor 维护方式判断并回填。
- 当前不纳入原因：`AlembicCore` 只含 test-local mock / repository helper；`AlembicPlugin` 只有历史 changelog / vendor test 片段，不构成产品 runtime mock provider。

## 依赖链判断

| 上游产出 | 生产窗口 | 消费窗口 | 派发判断 |
| --- | --- | --- | --- |
| product provider contract 去掉 `mock` | `AlembicAgent` | `Alembic` / `AlembicDashboard` / `AlembicTest` | 第一波可与 `Alembic` 并行，但 `Alembic` 必须按真实 API 结果修消费，不得猜临时 contract。 |
| AI unavailable / config-required runtime path | `Alembic` | `AlembicDashboard` / `AlembicTest` | `Alembic` 完成后，Dashboard 和 Test 才能验证最终用户可见行为。 |
| provider list / config API 不再暴露 mock | `Alembic` | `AlembicDashboard` | Dashboard 可删除旧 UI，但最终验收需要 Alembic API 证据。 |
| 真实 / 默认 AI 配置 smoke | `AlembicTest` | 总控 / PCVM | 只在产品删除完成后执行；不能继续用 mock provider。 |

## 阶段计划

| 阶段 | 目标 | 前置条件 | 完成标准 | 当前可派发窗口 | 不派发窗口 |
| --- | --- | --- | --- | --- | --- |
| Stage 0 | 跨仓库代码事实基线与目标阶段确认 | 用户确认 Design 推荐方向 | 当前事实文档完成，deletion wave 边界明确 | 总控自执行 | 产品窗口不派发 |
| Stage 1 | 删除 product runtime mock producer / consumer | Stage 0 完成 | `AlembicAgent` / `Alembic` 不再暴露或消费 product `mock` provider | `AlembicAgent`、`Alembic` | `AlembicTest` |
| Stage 2 | 删除 Dashboard mock UI/API 面 | Stage 1 API contract 清楚 | Dashboard 无 mock switch / cleanup / mock label；contract test 更新 | `AlembicDashboard` | `AlembicTest` |
| Stage 3 | 真实配置 smoke 与 PCVM unblock 判断 | Stage 1/2 验收 | `AlembicTest` 使用真实 / 默认 AI 配置复测，不再走 mock path | `AlembicTest` | 产品窗口观察 |
| Stage 4 | 总控验收 / 归档 / 恢复 PCVM | Stage 3 evidence 通过 | AI-MOCK TODO 关闭；PCVM 可恢复到真实 AI runtime 基线 | 总控 | 无 |

## 当前阶段判断

- 当前阶段：Stage 0 已完成，Deletion Wave 1 已启动。
- 为什么先做这一阶段：用户明确要求先做跨仓库代码事实调研和目标阶段确认；产品删除涉及 provider contract、daemon runtime、Dashboard UI 和测试策略，不能盲删。
- 为什么不先做其它阶段：不先推进 PCVM，因为 PCVM Wave 4D 证明 mock path 不能代表真实 N8 / N11 / N12 evidence；不先跑 Test，因为产品 runtime mock 还没删。
- 本阶段形成的功能闭环：已确认 product mock 入口、消费方、历史数据状态和第一波删除边界。
- 下一处真实阻塞点：`AlembicAgent` 与 `Alembic` product mock 入口还存在，导致下游仍能进入 mock runtime。
- 阻塞点之前还能一波完成的主线动作：第一波可同时派 `AlembicAgent` 删除 provider producer 和 `Alembic` 删除 runtime consumer / HTTP API；Dashboard 可在 API contract 清楚后跟进。
- 确认后第一波可启动窗口：`AlembicAgent`、`Alembic`；已进入 [Deletion Wave 1](../../../../../codex-control-workspace/.wakeflow-active/current/ai-mock-removal-deletion-wave-1-2026-05-28.md)。
- 等待窗口：`AlembicDashboard` 观察 API contract；`AlembicTest` 等产品删除完成；`AlembicCore` / `AlembicPlugin` 观察。
- 确认后是否需要新建 wave 执行计划：是，建议新建 `ai-mock-removal-deletion-wave-1-2026-05-28.md`。

## 第一波任务包候选

确认前只写候选，不派发。用户确认后，复制到 deletion wave 执行计划并补齐派发表。

- 下一处真实阻塞点：product mock provider producer / consumer 仍连通。
- 阻塞点之前还能做：删除 `AlembicAgent` product `mock` provider producer；删除 `Alembic` runtime mock consumer / cleanup API；把无 AI 配置统一到 AI unavailable。

| 任务包 ID | 窗口 | 阶段目标 | 主线动作 | 可合并 TODO | 明确不包含 | 阻塞 / 依赖 | 验证命令 | 回填要求 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI-MOCK-W1-AGENT-PROVIDER-REMOVAL | `AlembicAgent` | 删除产品 provider producer | 删除 product `MockProvider` export / registry / factory fallback；迁移 tests 到 test-local fake / fixture | 无 | 不删真实 provider；不引入 empty provider | 下游 `Alembic` 消费需同步 | `npm run check`，targeted ai provider tests，`rg` product mock export | 提交 hash、删除 / 保留列表、验证结果、测试 fake 命名证据 |
| AI-MOCK-W1-ALEMBIC-RUNTIME-CONSUMER-REMOVAL | `Alembic` | 删除 runtime mock consumer | 删除 `MockBootstrapPipeline` 路由、`/ai/mock/cleanup`、providers mock append、DI mock fallback；无 provider 走 AI unavailable | PCVM runtime-gap unblock 前置 | 不跑 full cold-start；不改 Dashboard UI | 依赖 Agent provider contract 方向 | `npm run check`，targeted route / bootstrap tests，`rg` mock runtime | 提交 hash、API / runtime 行为证据、残留 vendor 判断 |

## 验证策略

- 每波最低验证：各源仓库 typecheck / check、targeted tests、`git diff --check`、总控 `rg` 残留扫描。
- 每阶段可验证目标：Stage 1 验证产品 runtime 不再接受 `mock`；Stage 2 验证 UI / API client 不再暴露 mock；Stage 3 验证真实 / 默认 AI 配置 smoke。
- 阶段完成验证：总控独立复核提交、diff、命令输出、runtime JSON / API 行为或测试报告。
- 功能完整性验收：
  - 真实入口：AI factory、daemon container、HTTP `/ai/*` routes、Dashboard Header / modal。
  - 真实数据来源：provider config、env key、workspace AI config、runtime events。
  - 状态 / 数据变化：无 provider -> AI unavailable；真实 provider -> real runtime；mock source 不再产生。
  - 真实消费方：Alembic runtime、Dashboard、AlembicTest smoke、PCVM 后续 baseline。
  - 错误 / 边界路径：`ALEMBIC_AI_PROVIDER=mock`、POST `/ai/config` with `mock`、POST `/ai/probe` with `mock`。
  - 用户可执行验证：Dashboard provider list 无 Mock；daemon bootstrap 无 mock-pipeline；Test smoke 不使用 mock env。
  - 若发现最小实现，补齐 wave：任何只删 UI 不删 API、只删 provider export 不删 factory fallback、只改测试不改 runtime 的实现不得验收。
- 稳定面统一验收：AI-MOCK 完成后再恢复 PCVM cold-start baseline，避免 mock path 干扰度量。
- 真实项目 smoke 触发条件：Stage 1/2 代码验收通过后，由 `AlembicTest` 使用真实 / 默认 AI 配置对 BiliDili 做最小 smoke。

## 风险与确认问题

- 风险：直接删除 mock 可能暴露原先依赖 mock 的 tests、Dashboard contract test、vendor Dashboard 残留和无 AI key 启动语义。
- 需要用户确认：已由用户回复“继续吧”确认启动 Deletion Wave 1；第一波只发 `AlembicAgent` 与 `Alembic`。
- 不明确时禁止派发：若用户要求保留某种无 key 体验模式，需要重新确认替代方案，不能偷偷改成 mock-lite。
- 若用户未确认，当前派发状态：发送给无，所有产品窗口暂停 / 观察。

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>暂停 | 等待用户确认是否启动 Deletion Wave 1。 |
| `AlembicCore`<br>观察中 | 当前不派发。 |
| `AlembicAgent`<br>暂停 | 等待用户确认是否启动 Deletion Wave 1。 |
| `AlembicDashboard`<br>观察中 | 等 `Alembic` API contract 删除后再派发 UI cleanup。 |
| `AlembicPlugin`<br>观察中 | 当前不派发。 |
| `AlembicDesign`<br>已完成 | 已完成需求设计，不派发。 |
| `AlembicTest`<br>阻塞 | 等产品删除完成后再做真实配置 smoke。 |
| `BiliDili`<br>无任务 | 真实项目受保护，不直接派发。 |

## 可复制提示词

发送给：无

```text
等待用户确认是否启动 AI-MOCK Deletion Wave 1；当前不派发。确认后提示词必须要求执行窗口先读取本 workspace AGENTS.md、当前总控文档和目标仓库 AGENTS.md，并明确当前窗口定位。
```

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicDesign`、`AlembicTest`、`BiliDili`。

## 回填区

### 用户确认

- 状态：已确认删除产品 runtime AI mock 的 Design 推荐方向，并确认启动 Deletion Wave 1。
- 确认时间：2026-05-28 14:41 CST
- 用户调整：本需求先于 037 收敛、038、039 执行；Stage 0 先调研再决定 deletion wave。

### 确认后第一波

- 启动文档：[ai-mock-removal-deletion-wave-1-2026-05-28.md](../../../../../codex-control-workspace/.wakeflow-active/current/ai-mock-removal-deletion-wave-1-2026-05-28.md)。
- 发送窗口：`AlembicAgent`、`Alembic`。
- 阻塞窗口：`AlembicTest` 等产品删除完成。
- 观察窗口：`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`。
- index 当前计划是否已切到 wave 执行计划：是。
