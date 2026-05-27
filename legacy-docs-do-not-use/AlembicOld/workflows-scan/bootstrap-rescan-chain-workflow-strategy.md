# 冷启动与增量扫描长链路验证沉淀方案

本文档用于回答一个设计取舍：`docs/bootstrap-rescan-chain-test-plan.md` 和 `docs/bootstrap-rescan-chain-harness-implementation.md` 这类长链路验证方案，应该沉淀成正式文档、Agent Skill，还是 Alembic 的运行时能力。

结论：不要二选一。建议采用三层结构：

1. `docs/` 作为唯一事实源，保存方法论、节点协议、通过标准和实现设计。
2. `skills/` 作为轻量执行入口，指导 Agent 按文档推进节点、记录证据、避免一次性长跑。
3. `lib/workflows/testing/` 作为代码级 harness，让 Alembic 的冷启动和增量扫描链路真正可停、可观测、可重验。

这三层的关系是：文档定义规则，skill 编排执行，harness 产生证据。

## 为什么不是只用文档

文档适合承载稳定判断：节点切分、失败分类、证据结构、风险边界、实施里程碑。这些内容应该长期可读、可评审、可被测试和代码引用。

但文档本身不会约束执行。开发者或 Agent 仍然可能跳过当前节点、直接全链路长跑，或在没有结构化证据时凭日志感觉判断。因此文档必须配合可执行入口。

文档层应该承担这些职责：

- 定义 N0 到 N14 的节点语义。
- 说明每个节点的目标、检查证据、通过标准和重验标准。
- 规定哪些数据必须进入 evidence，哪些大字段只能在 heavy 模式下写入。
- 记录哪些行为属于生产默认路径，哪些属于内部测试 harness。
- 明确 BiliDili ghost 模式这类真实项目验证的安全边界。

当前两篇文档已经分别覆盖了“怎么推进”和“怎么实现”。它们可以继续保留为主体文档，本文件只作为上层取舍和产品化路线。

## 为什么不是只用 Skill

Skill 更适合做执行时的操作手册，而不是唯一事实源。原因有三点：

1. Skill 容易被复制、裁剪或局部改写，如果把节点标准只放在 Skill 里，规则很容易漂移。
2. Skill 适合告诉 Agent “下一步怎么做”，但不适合承载完整架构设计和长期设计记录。
3. 长链路验证需要 CLI、Dashboard、HTTP、MCP、TaskManager、report、snapshot 多处配合，最终必须回到代码和文档，而不是停留在 prompt 层。

因此 Skill 的推荐定位是薄封装：

- 识别用户意图，例如“推进 rescan 到 N6”“复查 N9 evidence”“比较两轮 chain test”。
- 读取并遵守正式文档，而不是复制整套节点定义。
- 引导 Agent 选择最小目标节点、收集 evidence、判断 invariant、记录 round 结果。
- 在 harness 未实现时，提醒只能手动检查；在 harness 已实现后，优先使用 `--test-stop-at`、manifest 和 evidence JSON。

Skill 不应该直接创建或修改用户项目的 `Alembic/recipes/`，也不应该把本仓库当成某个用户项目的 Knowledge Base。

## 推荐分层

| 层级 | 位置 | 作用 | 是否现在就做 |
|------|------|------|--------------|
| 方法论文档 | `docs/bootstrap-rescan-chain-test-plan.md` | 定义节点推进协议和验收标准 | 已具备 |
| 实现设计文档 | `docs/bootstrap-rescan-chain-harness-implementation.md` | 定义 test control、probe、evidence、stop envelope | 已具备 |
| 沉淀总纲 | `docs/bootstrap-rescan-chain-workflow-strategy.md` | 说明 docs、skill、harness 的分工和产品化路线 | 本文档 |
| Agent Skill | `skills/alembic-chain-test/SKILL.md` | 让 Agent 按长链路协议执行，不复制完整规范 | Milestone 1 后新增 |
| Runtime harness | `lib/workflows/testing/*` | 让链路可停、可观测、可重验 | 第一批代码改造 |
| 开发调试入口 | CLI hidden args、HTTP `_test`、Dashboard hidden panel | 给开发者和 Agent 一个统一入口 | 分阶段落地 |

## 与 Alembic 当前功能逻辑的配合

这套工作流最适合变成 Alembic 自身的“内部链路验证能力”，而不是普通用户功能。它可以嵌入现有功能边界，但默认关闭。

### 入口层

CLI、Dashboard、HTTP、MCP 都可以接入同一个 `WorkflowTestControl`。外部形态可以不同，但进入 workflow 前必须收敛成统一结构。

推荐规则：

- CLI 使用隐藏参数，例如 `--test-stop-at`、`--test-run-id`、`--test-evidence-dir`。
- HTTP 使用 `_test` 子对象，不进入公开 API 文档。
- MCP 先只支持 internal bootstrap/rescan 工具，不扩展到普通 agent 工具。
- 环境变量只作为兜底来源，优先级低于显式参数。

这样可以避免测试字段重新散落进业务 intent、Agent prompt 或 tool runtime context。

### Workflow 层

冷启动和增量扫描 workflow 只在节点边界调用 probe：

```ts
const stop = await probe.capture('N6_DIMENSION_PLAN', evidence);
if (stop) {
  return stop;
}
```

生产默认路径下 `probe.capture()` 是 no-op。测试模式下，它负责补齐 `workflow`、`runId`、`timestamp`、`projectRoot`、`dataRoot`、`ghost` 等标准字段，并在命中 `stopAt` 时返回合法 stop envelope。

建议第一批只支持 N2 到 N7 的同步 stop，因为这些节点位于 AI 写入和异步维度执行之前，污染风险低。N8 到 N14 可以先只 capture evidence，再逐步支持 async stop。

### TaskManager 层

N8 之后进入维度执行和异步任务，不能简单用异常或早返回模拟停止。TaskManager 需要能表达测试停止态。

建议新增或扩展状态字段：

- `stoppedAt`: 停止节点。
- `testHarness`: 是否由 chain test 停止。
- `evidencePath`: 对应 evidence JSON 或 manifest。
- `partialWrites`: 已经发生的持久化动作摘要。

这样 Dashboard、CLI status 和集成测试都能区分“失败”“取消”和“按测试计划停止”。

### Evidence / Report 层

Evidence 是这套方案和 Alembic 现有 report、snapshot、history 能力配合的关键。

建议把 evidence 分成两类：

- Node evidence：每个节点的结构化观察结果，写入 `<evidenceDir>/<node>.json`。
- Run manifest：一次运行的索引，记录 runId、workflow、argsHash、节点列表和 invariant 摘要。

完整跑到 N14 时，report/history 可以引用 evidence manifest；如果停在中间节点，stop envelope 直接返回 evidence path，不污染正式 report history。

### Knowledge / Recipe / Evolution 层

长链路 evidence 不应该直接成为 Recipe。它记录的是 Alembic 自身链路运行证据，不是目标项目的代码模式或最佳实践。

但 evidence 可以反向喂给开发决策：

- 如果某个节点的失败揭示了稳定工程规则，可以整理成 `docs/` 或测试用例。
- 如果某个目标项目的代码模式被 Agent 发现并通过 Producer 产出，才进入候选 Recipe 流程。
- 如果 N10/N11/N12 暴露 evolution、dedup、lifecycle 的稳定缺陷，应先补低层测试，再推进链路。

这条边界很重要：chain test 是验证 Alembic 自己的工作流，不是往当前源码仓库写用户项目知识。

## Skill 的最小形态

等 Milestone 1 的 harness 落地后，可以新增 `skills/alembic-chain-test/SKILL.md`。它应该很短，只做执行导航。

建议结构：

```markdown
---
name: alembic-chain-test
description: Guide progressive bootstrap/rescan chain verification with WorkflowTestControl evidence. Use when validating coldstart/rescan long chains, node stopAt, evidence comparison, or evolution/rescan regressions.
---

# Alembic Chain Test

## Source of Truth

- Read `docs/bootstrap-rescan-chain-test-plan.md` for node semantics.
- Read `docs/bootstrap-rescan-chain-harness-implementation.md` for harness behavior.
- Do not duplicate node definitions here.

## Workflow

1. Identify workflow: coldstart or rescan.
2. Identify target node: N2 to N14.
3. Prefer the smallest node that can explain the current failure.
4. Run with `testStopAt` only when harness support exists.
5. Inspect evidence JSON and invariant summary.
6. Fix only the current node's issue.
7. Re-run the same node before advancing.

## Safety

- Do not run user-facing Alembic commands inside the Alembic source repo.
- Do not create `.asd/` or runtime Knowledge Base data in this repo.
- Use ghost or a dedicated test project for real-project validation.
```

这个 Skill 不需要包含 N0 到 N14 的完整内容。它只需要把 Agent 拉回正确流程：读文档、选节点、跑 harness、看 evidence、重验同节点。

## 什么时候沉淀成正式功能

这套方案可以按成熟度分四级演进。

### Level 1：文档化工作法

适合当前阶段。开发者按文档手动推进节点，靠日志、report、DB 和少量测试判断。

交付物：

- 两篇主体文档。
- 本策略文档。
- 每轮调试记录放在 `docs-dev/` 或本地 `.test-runs/`，不要直接污染正式文档。

### Level 2：可执行 harness

适合开始频繁复测 N2 到 N7 时。核心是 `WorkflowTestControl`、`WorkflowNodeProbe`、evidence bundle 和 stop envelope。

交付物：

- `lib/workflows/testing/*`。
- CLI hidden options。
- N2 到 N7 的 capture + stop。
- unit 和 integration 测试。

### Level 3：Agent 可操作 Skill

适合 harness 能稳定产出 evidence 后。Skill 让 Copilot 或其他 Agent 按协议执行，而不是每次重新解释文档。

交付物：

- `skills/alembic-chain-test/SKILL.md`。
- evidence 比较 checklist。
- Round 记录模板。

### Level 4：开发者调试产品能力

适合团队频繁使用后。此时可以增加 `chain-test` 命令、Dashboard hidden panel、manifest diff 和 invariant 趋势。

交付物：

- `chain-test diff`。
- Dashboard stoppedAt / evidencePath 展示。
- TaskManager stopped 状态。
- report history 引用 manifest。

## 推荐落地顺序

1. 先保留当前两篇文档作为正式设计资料。
2. 以本文档作为顶层决策，明确不要在 docs 和 skill 之间重复维护完整规范。
3. 第一批代码只做 Milestone 1：N2 到 N7 stopAt、evidence bundle、CLI hidden args、基础测试。
4. 等 evidence 形态稳定后，再新增 `skills/alembic-chain-test/SKILL.md`。
5. 最后再做 N8 到 N14 async stop、TaskManager stopped 状态、Dashboard hidden panel 和 diff 工具。

这个顺序可以避免过早把 prompt 工作流产品化，也避免只留下文档却没有可复查证据。

## 判定标准

当这套沉淀真正成立时，应该满足以下标准：

- 一个开发者能只读文档就理解长链路验证协议。
- 一个 Agent 能通过 Skill 选择正确节点并避免直接全链路长跑。
- 一次 chain test 能从真实入口启动，到目标节点停止，并产出稳定 JSON evidence。
- 同一节点优化前后可以用 manifest 和 invariant 做对比。
- 默认不启用测试参数时，冷启动和增量扫描生产行为完全不变。
- BiliDili ghost 模式验证不会向真实项目目录写入 Alembic 运行时数据。

如果只满足前两条，这仍然只是工作流文档。如果满足前三到五条，它就成为 Alembic 的内部验证能力。如果再满足最后一条，它才适合用于真实项目长链路回归。