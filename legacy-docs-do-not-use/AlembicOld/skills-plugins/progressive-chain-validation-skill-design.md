# 通用 Agent 长链路渐进验证 Skill 方案

本文档描述一种更偏 Agent Skill 的沉淀方式：用户主动指定一个通用 Skill，提供真实测试项目、配置、边界和必要权限，然后由 Agent 把一个复杂长链路拆成多个可验证节点，逐节点推进、观察、修复、重验，并在执行过程中持续向用户汇报方案、细节和结果。

这个方案不是只服务 Alembic 的内部冷启动和增量扫描，也不是单纯把已有文档包装成提示词。它的目标是沉淀一种通用工作流：面对任何复杂链路，Agent 都可以先生成可执行验证计划，再按小节点推进，必要时自己构造数据、补测试、加观测点、修复代码，并把每轮证据记录下来。

## 核心主张

Skill 应该是主入口，而不是后置辅助。

在这个模式下，用户的交互方式可以是：

1. 用户指定使用该 Skill。
2. 用户提供真实测试项目路径、目标链路、环境配置、可用命令、权限边界和风险约束。
3. Agent 先探查目标项目和链路入口，生成一份节点化验证计划。
4. Agent 和用户确认计划中的风险、权限和测试范围。
5. Agent 从第一个节点开始推进，每次只验证一个小节点。
6. 如果节点失败，Agent 先补观测或测试，再做最小修复，然后重跑同一节点。
7. 当前节点稳定后，再推进到下一节点。
8. 全过程产出计划、证据、修改记录、验证结果和最终交接文档。

这类 Skill 的价值不在于记住某个固定链路的所有节点，而在于提供一种可迁移的工作法：拆链路、造证据、小步验证、局部修复、复跑确认、再推进。

## 和文档优先方案的差异

文档优先方案强调：先把节点语义和 harness 设计固定下来，再让 Skill 读取文档执行。

Skill 优先方案强调：Skill 本身就是工作流驾驶舱。它可以读取项目文档，但不要求项目先有完整节点定义。对于一个新的长链路，Agent 可以根据代码结构、入口命令、日志、测试、业务状态和用户目标，临时生成节点图和验证计划。

两者不是互斥关系，但职责重心不同：

| 维度 | 文档优先 | Skill 优先 |
|------|----------|------------|
| 起点 | 已有明确节点和标准 | 用户给目标，Agent 先建模 |
| 适用范围 | 固定项目或固定链路 | 任意复杂长链路 |
| Agent 自主性 | 按既定节点执行 | 自主拆节点、定验证、造数据 |
| 产物 | 规范文档、harness、evidence | 计划文档、节点记录、修复和验证报告 |
| 风险 | 执行可能机械 | 自主性高，需要权限和边界控制 |

因此这里推荐把它沉淀成通用 Skill：`progressive-chain-validation`。Alembic 的冷启动和增量扫描只是这个 Skill 的一个高价值适配场景。

## Skill 的定位

这个 Skill 适合以下场景：

- 验证冷启动、增量扫描、同步任务、数据迁移、导入导出、CI 发布等长链路。
- 复杂 bug 只能在真实项目或真实数据附近复现，不能靠单个单元测试解释。
- 需要 Agent 一边运行、一边观察、一边修复，而不是只给一份静态测试计划。
- 用户愿意提供测试项目、配置和授权，让 Agent 在可控范围内执行命令、修改代码和构造数据。

它不适合以下场景：

- 单文件 bug 或一个明确失败测试。
- 用户只想要设计建议，不希望 Agent 执行。
- 没有可运行环境，也不允许 Agent 创建模拟数据。
- 涉及生产数据、不可回滚写入或高风险外部系统，且没有 sandbox。

## 用户输入契约

Skill 启动后，Agent 应该向用户收敛以下信息，而不是直接开始长跑。

### 必填信息

- 目标链路：例如 coldstart、rescan、payment import、data migration。
- 真实测试项目或测试环境路径。
- 入口方式：CLI、HTTP、Dashboard、MCP、脚本、测试命令。
- 成功目标：本轮希望验证到哪里，或希望解决什么具体问题。
- 允许的修改范围：只读、可改测试、可改代码、可改配置、可创建临时数据。
- 禁止事项：不能触碰的目录、命令、服务、数据源或外部系统。

### 推荐信息

- 环境变量、模型配置、API 配置或测试账号的提供方式。
- 是否允许 Agent 安装依赖、启动服务、运行长耗时命令。
- 是否允许 Agent 生成模拟数据、复制 DB、创建 fixture、创建临时测试脚本。
- 是否需要每个节点都等用户确认后再推进。
- 输出产物目录，例如 `docs-dev/chain-runs/<run-id>/` 或 `.chain-test/<run-id>/`。

### 权限分级

为了让 Skill 可控，建议把权限分成四档：

| 权限档位 | Agent 可以做什么 | 需要用户确认的动作 |
|----------|------------------|--------------------|
| observe | 只读探查、生成计划、读取日志和代码 | 任何写入或命令执行 |
| test-write | 创建临时测试、fixture、模拟数据、运行测试 | 修改生产代码、启动外部服务 |
| code-fix | 修改代码、补测试、运行验证命令 | 数据库写入、破坏性命令、外部系统调用 |
| sandbox-run | 在指定 sandbox 内完整执行链路 | 越过 sandbox、访问生产凭证、不可逆写入 |

默认应该从 `observe` 或 `test-write` 开始。Agent 需要扩大权限时，必须说明原因、影响范围、回滚方式和替代方案。

## 执行产物

Skill 不应该只在聊天里推进。每次运行都应该产出可追溯文件，方便中断后恢复、复盘和交接。

推荐目录结构：

```text
<artifactRoot>/<runId>/
  plan.md
  nodes.json
  rounds/
    N0-env.md
    N1-entry.md
    N2-discovery.md
  evidence/
    N0-env.json
    N1-entry.json
    N2-discovery.json
  patches.md
  commands.md
  final-report.md
```

各文件职责：

- `plan.md`：Agent 生成的节点化验证计划，包含范围、风险、节点图、执行顺序和退出条件。
- `nodes.json`：机器可读节点定义，记录每个节点的入口、证据、通过标准和状态。
- `rounds/*.md`：每个节点的执行记录，包括观察、结论、修改和重验结果。
- `evidence/*.json`：结构化证据，优先记录摘要、路径、计数、状态、测试结果和 invariant。
- `patches.md`：本轮做过的代码修改摘要和原因。
- `commands.md`：实际执行过的关键命令、结果摘要和失败信息。
- `final-report.md`：最终结论、剩余风险、后续建议。

如果目标项目不适合写入这些文件，Agent 可以把产物放到当前工作区的 `docs-dev/`、`scratch/` 或用户指定目录。

## 标准工作流

### Phase 0：启动握手

Agent 先确认目标和权限：

- 你要验证哪条长链路。
- 哪个项目是真实测试项目。
- 哪些命令可以跑。
- 哪些数据可以读写。
- 本轮允许 Agent 自主推进到什么程度。

如果用户已经提供足够信息，Agent 不应过度提问，可以直接进入只读探查，并把缺失项标为假设。

### Phase 1：只读建模

Agent 对项目和链路做只读探查：

- 找入口命令、路由、任务调度器、状态机、持久化边界。
- 找已有测试、fixture、文档、日志和报告产物。
- 识别高风险写入点和可安全断点。
- 判断是否已有 harness、dry-run、mock、snapshot、report、task status 等能力。

输出 `plan.md` 初稿和节点图。此时不急着修代码。

### Phase 2：生成节点计划

Agent 把链路拆成节点。节点数量不是固定的，但每个节点必须满足三个条件：

1. 有清晰入口或观测边界。
2. 有可收集证据。
3. 有可以重跑的验证方式。

通用节点命名可以采用：

```text
N0_ENV
N1_ENTRY
N2_INTENT
N3_DISCOVERY
N4_STATE_PREP
N5_PLAN
N6_EXECUTION_START
N7_CORE_ACTION
N8_PERSISTENCE
N9_CONSUMERS
N10_FINALIZER
N11_REPORT
```

对于 Alembic 冷启动和增量扫描，可以直接映射到已有 N0 到 N14 节点；对于其他项目，Agent 按实际链路生成节点。

每个节点计划应包含：

- 目标。
- 执行范围。
- 输入数据。
- 验证命令或验证脚本。
- 需要收集的证据。
- 通过标准。
- 失败时优先补什么观测点。
- 是否需要用户确认才能进入下一节点。

### Phase 3：逐节点推进

每个节点都按同一个小循环执行：

```text
选择节点 → 准备输入 → 执行最短路径 → 收集证据 → 判断通过
  → 若失败：补观测/补测试/修复 → 重跑同一节点
  → 若通过：记录结果 → 推进下一节点
```

Agent 每推进一个节点，都要向用户报告：

- 本节点要验证什么。
- 打算用什么输入和命令。
- 预期会看到什么证据。
- 实际结果是什么。
- 是否通过。
- 如果修改了代码，改了哪里、为什么、如何验证。

报告应该简洁，但必须能让用户知道 Agent 没有在盲跑。

### Phase 4：模拟数据和测试设计

Agent 可以自行构造测试数据，但必须遵守可追溯和可回滚原则。

推荐策略：

- 优先使用最小 fixture，而不是复制大量真实数据。
- 需要数据库时，优先复制到临时 DB 或 sandbox。
- 需要文件系统状态时，优先创建临时目录或小型样本项目。
- 需要外部服务时，优先 mock、fake server 或本地替身。
- 每份模拟数据都要记录来源、目的、字段含义和清理方式。

Agent 不应该为了让测试通过而构造脱离真实链路的假象。模拟数据必须服务于当前节点的验证假设，并在条件允许时用真实测试项目做一次回归确认。

### Phase 5：修复与重验

节点失败后，Agent 的优先级应该是：

1. 先判断是不是观测缺失。
2. 如果看不清，先加日志、report 字段、测试 hook 或结构化 evidence。
3. 如果能定位根因，再做最小代码修改。
4. 修改后只重跑当前节点。
5. 当前节点通过后，再决定是否扩大范围。

Agent 不应该在一个失败节点里顺手重构后续链路。每次修改都应该能回答：它修复了哪个节点的哪个不变量。

### Phase 6：收尾与交接

完成目标节点或完整链路后，Agent 输出最终报告：

- 本轮验证覆盖了哪些节点。
- 哪些节点通过，哪些节点跳过，哪些节点仍有风险。
- 修改了哪些代码和测试。
- 哪些证据可以复查。
- 哪些命令可以重跑。
- 下一轮建议从哪个节点继续。

如果中途暂停，也要留下 `final-report.md` 或 handoff 摘要，让下一次 Agent 可以从已有计划和 evidence 接着做。

## Skill 文件建议

可以新增一个通用 Skill，例如：

```text
skills/progressive-chain-validation/SKILL.md
skills/progressive-chain-validation/templates/plan.md
skills/progressive-chain-validation/templates/round.md
skills/progressive-chain-validation/templates/final-report.md
```

`SKILL.md` 的 frontmatter 可以是：

```yaml
---
name: progressive-chain-validation
description: "Use when validating or repairing a complex long-running workflow by decomposing it into small nodes, generating a test plan, running node-by-node checks, creating simulated data, fixing failures, and reporting evidence."
---
```

Skill 正文不应该绑定 Alembic 专有节点，而应该描述通用过程：

```markdown
# Progressive Chain Validation

## When Invoked

1. Collect target workflow, test project, entry commands, permissions, and forbidden operations.
2. Run read-only exploration first.
3. Generate `plan.md` with nodes, evidence, pass criteria, and execution order.
4. Execute one node at a time.
5. Prefer adding observability before modifying behavior.
6. Create minimal simulated data when needed and record its purpose.
7. Fix only the current node's root cause.
8. Re-run the same node before advancing.
9. Report commands, evidence, code changes, and residual risk.

## Safety

- Never use production data or destructive commands without explicit approval.
- Keep artifacts under the user-approved artifact root.
- Ask before expanding permissions or running external services.
- Preserve unrelated user changes.
```

这个 Skill 的描述必须写清楚关键词，例如 long-running workflow、node-by-node、simulated data、fix failures、evidence reporting。Skill 是否能被 Agent 正确触发，很大程度取决于 description。

## 和 Alembic 的结合方式

对于 Alembic，本通用 Skill 可以把已有两篇文档作为领域 playbook：

- `docs/bootstrap-rescan-chain-test-plan.md` 提供冷启动和增量扫描的节点语义。
- `docs/bootstrap-rescan-chain-harness-implementation.md` 提供未来可执行 harness 的实现方向。
- `docs/progressive-chain-validation-skill-design.md` 提供通用 Skill 的交互和执行协议。

当用户说“用 progressive-chain-validation 验证 Alembic rescan”时，Agent 应该：

1. 读取本通用 Skill。
2. 读取 Alembic 的链路测试计划文档。
3. 要求用户提供真实测试项目路径，例如 BiliDili，而不是在 Alembic 源码仓库里直接执行用户命令。
4. 根据当前权限生成本轮 `plan.md`。
5. 如果 Alembic harness 尚未实现，就采用手动观测、专用测试脚本、临时 fixture 和只读 DB 检查。
6. 如果 harness 已实现，就优先使用 stopAt、evidence bundle 和 manifest。
7. 每个节点失败时，回到 Alembic 源码修复，并在同一节点重验。

这样 Alembic 不需要先把所有内部 harness 做完，Skill 仍然可以先工作；harness 后续只是把 Skill 的执行变得更稳定、更机器可读。

## Agent 自主性的边界

这个方案允许 Agent 有更高自主性，但不是无边界自动化。

Agent 可以自主决定：

- 节点如何切分。
- 每个节点先看哪些代码和日志。
- 需要什么最小模拟数据。
- 应该补单元测试、集成测试还是临时验证脚本。
- 当前失败更像输入、状态、算法、并发、持久化还是观测缺失。
- 是否需要修改代码，以及修改后重跑什么。

Agent 必须请求用户确认：

- 扩大到未授权目录或项目。
- 访问生产服务、生产数据库或真实用户数据。
- 执行不可逆命令。
- 安装依赖或启动长时间运行服务。
- 变更超出当前节点范围的大面积架构。

Agent 必须持续告知用户：

- 当前节点是什么。
- 当前假设是什么。
- 正在运行什么验证。
- 观察到什么结果。
- 下一步为什么合理。

## 计划文档模板

Agent 启动后生成的 `plan.md` 可以使用下面的结构：

```markdown
# Progressive Chain Validation Plan

## Run Context

- Run ID:
- Target workflow:
- Test project:
- Artifact root:
- Permission level:
- Forbidden operations:

## Goal

- Primary objective:
- Stop condition:
- Out of scope:

## Chain Model

| Node | Name | Scope | Evidence | Pass Criteria | Status |
|------|------|-------|----------|---------------|--------|
| N0 | Environment | ... | ... | ... | pending |

## Execution Rules

- Execute one node at a time.
- Fix only the current node's root cause.
- Re-run the same node before advancing.
- Record every command and evidence path.

## Risk Controls

- Data isolation:
- Rollback strategy:
- User confirmation required for:
```

## 单节点记录模板

```markdown
# Round: <Node> <Name>

## Objective

本轮只验证：

## Inputs

- Project:
- Config:
- Simulated data:
- Commands:

## Expected Evidence

- 

## Observed Evidence

- 

## Result

- Passed / Failed / Blocked:
- Failure category:
- Root cause:

## Changes

- Files changed:
- Why:

## Revalidation

- Command:
- Result:
- Can advance:
```

## 成功标准

这个通用 Skill 方案成立时，应满足以下标准：

- 用户可以通过点名 Skill 启动一次长链路验证会话。
- Agent 能在没有现成节点文档的项目里生成合理节点计划。
- Agent 能根据真实测试项目和模拟数据逐节点验证，而不是直接全链路盲跑。
- 每个节点都有证据、通过标准和重验记录。
- 失败节点会先补观测，再做最小修复，并重跑同一节点。
- 用户能从中间暂停，并通过产物继续下一轮。
- 对 Alembic 这类已有链路文档的项目，Skill 能吸收现有节点协议，而不是重新发明一套。

最终目标是让“长链路验证”从一次紧张的大长跑，变成 Agent 可以驾驶的一系列小回路：计划清楚、证据清楚、修改清楚、重验清楚。