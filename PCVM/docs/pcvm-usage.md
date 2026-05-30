# PCVM 使用说明

本文说明 PCVM 工作空间如何使用、`plan.md` 如何生成与更新，以及 plan、指标、报告和附件之间的关系。

## 1. PCVM 是什么

PCVM 在 AlembicWorkspace 里的用途是：

- 使用 Progressive Chain Validation 方法把长链路拆成 source-derived 节点。
- 为每个节点定义可验证的 useful unit、quality gate、stage loss、baseline/candidate/comparison 和 verdict。
- 为每个节点设计 node-local fixture、frozen upstream artifact、downstream cut、reset rule 和 isolation proof。
- 把这些内容写入一个可执行、可复核、可移交的 `report/plan.md`。
- 在执行推进时，只更新当前节点和执行日志；总控基于这些产物决定后续派发。

PCVM 不是：

- 不是 AlembicWorkspace 之外的独立执行窗口。
- 不是 Alembic 产品实现仓库。
- 不是 AlembicTest 真实项目验证窗口。
- 不是 canonical PCV source 本身。
- 不是“看到一个坏指标就直接派产品仓库修”的调度器。

## 2. Source 与工作空间关系

PCVM 使用这些输入：

| 输入 | 位置 | 用途 |
| --- | --- | --- |
| Workspace 总控规则 | `../AGENTS.md` | 总控边界、停止卡、验收规则。 |
| 当前总控计划 | `../codex-control-workspace/.workspace-active/workspace/current/` | 当前目标、任务包、回填要求。 |
| PCVM 本地规则 | `PCVM/AGENTS.md` | PCVM artifact 工作面规则和禁止事项。 |
| PCVM flow skill | `PCVM/skills/pcvm-flow-controller/SKILL.md` | agent 执行 PCVM 时的固定使用口径。 |
| PCVM flow config | `PCVM/config/pcvm-flow-control.json` | 状态线路、轮次顺序、门禁、artifact 落点和禁止跳转。 |
| Canonical PCV skill | `../progressive-chain-validation/progressive-chain-validation/SKILL.md` | PCV 方法入口。 |
| PCV references/templates | `../progressive-chain-validation/progressive-chain-validation/references/` 和 `templates/` | plan 质量标准、metrics contract、artifact layout、domain overlay。 |
| Alembic 源码 | `../Alembic/` 等 | source-first chain map 的事实来源。 |

PCVM 输出写在本 artifact 工作面内：

```text
PCVM/scratch/chain-runs/<run-id>/
```

这些输出是开发证据，不是产品 runtime data。

## 3. Run 目录布局

每个 PCVM run 使用固定布局：

```text
scratch/chain-runs/<run-id>/
  report/
    plan.md
    records/
      data.md
      issues.md
      progress.md
      review.md
      rounds.md
      task-packages.md
      ai-local-chain.md
    artifacts/
  attachments/
  fixtures/
  temp-tests/
```

规则：

- `report/plan.md` 是唯一必需主计划产物，承载链路切分、节点定义、指标契约、当前游标和必要状态更新。
- `report/records/data.md` 保管测量数据、路径事实、命令证据和 source fact 表。
- `report/records/issues.md` 保管问题、风险、残余边界、阻塞原因和待裁决项。
- `report/records/progress.md` 保管推进流水、执行记录、用户确认和过程 notes。
- `report/records/review.md` 保管当前轮次复盘、问题总结、冷启动链路判断和下一轮建议。
- `report/records/rounds.md` 保管多轮次定义、每轮 scope、入口门禁、允许动作和 verdict 含义。
- `report/records/task-packages.md` 保管工程修复任务包候选，不替代产品仓库任务单。
- `report/records/ai-local-chain.md` 保管 AI 局部链路阶段拆分和 Test 占位。
- `report/artifacts/` 保管机器形态 probe 摘要、JSON 输出和大块命令产物。
- `attachments/` 只放过大的命令输出、JSON、截图或机器产物。
- `fixtures/` 只放一次性节点 fixture，不进入产品代码。
- `temp-tests/` 只放一次性 harness，不进入产品代码。
- 不单独创建第二份 node-state、manifest、final-report 来替代 `plan.md`；records 只承载证据和推进记录，不替代 plan 的节点裁决。

## 3.1 流程控制线路

PCVM 使用 `config/pcvm-flow-control.json` 固定状态线路，使用 `skills/pcvm-flow-controller/SKILL.md` 固定 agent 行为。

默认线路：

```text
S0-intake
S1-source-chain-map
S2-plan-artifact
S3-round-registry
S4-node-or-round-execution
S5-record-classification
S6-engineering-repair-packaging
S7-live-ai-local-chain
S8-verdict-and-next-round
```

默认轮次：

```text
R1-engineering-discovery
R2-engineering-repair
R3-ai-local-analyze
R4-ai-local-producer
R5-ai-expansion
R6-dashboard-observability
R7-delivery
```

每次推进先判断当前请求落在哪个 state，再判断当前 round 是否允许该动作。没有 entry gate 的动作必须停止，不能用“顺手验证”“先跑一下”绕过。

## 4. plan.md 如何生成

生成 `report/plan.md` 前，PCVM 必须按顺序完成：

1. 读取 Workspace 总控规则和当前总控计划。
2. 读取 PCVM `AGENTS.md`。
3. 读取 PCVM flow config 和 flow skill。
4. 读取 canonical PCV `SKILL.md`。
5. 按 PCV startup 加载必要 references：
   - safety boundaries
   - artifact layout
   - data location preflight
   - plan quality standard
   - chain plan generation
   - metrics contract
   - Alembic adapter / cold-start overlay
6. 从真实源码生成 source chain map。
7. 再用 overlay 做 coverage alignment。
8. 初始化 run id。
9. 按 `templates/plan.md` 生成 `report/plan.md`。

`plan.md` 必须包含：

- run metadata
- scope 和安全写边界
- source-first chain analysis
- source chain map
- branch / degraded path
- node cut strategy
- reference alignment
- node-to-test coverage map
- execution control gate
- workflow variant orders
- expanded node sections
- per-node metrics scorecard
- plan update log
- final outcome / handoff notes

如果 plan 只有 N0-N14 表格，没有 expanded node sections、指标、隔离切点和执行门禁，状态必须标为 `incomplete`。

## 5. plan.md 如何更新

`report/plan.md` 是状态机，不是一次性说明书。

### 生成阶段

第一次生成时：

- 所有节点默认 `pending`、`conditional` 或 `blocked`。
- 只能指定一个 current node。
- 不能把历史 full run 或历史 scorecard 当作新节点 pass。
- 可以引用历史证据作为 baseline input，但必须标明 evidence class。

### 执行阶段

执行时只更新当前节点：

- 当前节点 section phase
- 当前节点 record links
- 当前节点 metrics scorecard 摘要
- 当前节点 verdict
- plan update log
- next advance rule

执行数据、问题和推进记录不要堆进 `plan.md`：

- 路径事实、命令输出、测量表、source fact table 写入 `report/records/data.md`。
- 失败原因、风险、残余边界、待裁决项写入 `report/records/issues.md`。
- 每次执行流水、用户确认、过程性 note 写入 `report/records/progress.md`。
- `plan.md` 只保留必要状态、verdict、当前游标、scorecard 摘要和 record links。

禁止：

- 一个执行回合中同时把多个节点改成 pass。
- 用 broad full-run 成功让下游节点自动通过。
- 在没有 isolation proof 时推进游标。
- 在产品仓库修改还没回填原始证据前写成总控验收通过。

### 修复阶段

如果当前节点失败：

1. 记录失败 invariant。
2. 判断是 observability gap、fixture gap、代码逻辑问题、测试环境问题还是需求边界问题。
3. 只给当前节点提出第一修复方向。
4. 修复后用同一 fixture / frozen artifact rerun。
5. 写入 before/after comparison。

## 6. 指标如何写

每个被评估节点必须靠近节点 section 写 scorecard。最低字段：

| 字段 | 含义 |
| --- | --- |
| `usefulUnit` | 该节点真正产出、保存或判断的最小价值单元。 |
| `qualityGate` | 改善计分前必须先通过的质量门。 |
| `stageLoss` | 该节点的损失信号，如缺证据、fallback、invalid sourceRefs、重复、预算浪费、unsafe write risk。 |
| `baseline` | 改动前、同 fixture 或 frozen artifact 下的测量。 |
| `candidate` | 改动后、同 fixture 或 frozen artifact 下的测量。 |
| `comparison` | before/after delta、quality gate 状态和 unchanged boundaries。 |
| `verdict` | `pass`、`improved`、`neutral`、`regression`、`blocked` 或 `blocked-by-observability-gap`。 |
| `evidenceLinks` | source refs、record path、report path、trace id、artifact path、test output、日志。 |
| `residualRisk` | 不阻塞当前 verdict 的风险，或导致 blocked 的缺口。 |

改进只在 `qualityGate` 通过后才计数。loss 下降但 useful unit 变弱，不能算 improved。所有 verdict 必须带 scope，例如 `pass(scope=fixture)`；裸 `pass` 只可出现在普通状态枚举说明里，不能作为节点 verdict。

## 6.1 多轮次如何写

PCVM 允许多轮推进。第一轮可以是纯工程逻辑 + 探测轮次，其意义是摸清链路、暴露基础问题、建立指标和后续轮次入口；它不能伪装成真实 runtime / AI / delivery 验收。

每轮必须声明：

- round id
- round type
- evidence scope
- allowed / forbidden actions
- metrics
- verdict meaning
- next round candidates

通用轮次模型见：

```text
docs/pcvm-round-model.md
```

当前 run 的轮次记录写在：

```text
scratch/chain-runs/<run-id>/report/records/rounds.md
```

## 6.2 局部链路优化如何写

局部链路优化用于处理一个真实 producer/consumer segment，不要求一次覆盖全链路。每个局部链路必须有：

- input contract
- output contract
- upstream freeze
- downstream cut
- side effects
- metrics
- before/after comparison

通用局部链路优化模型见：

```text
docs/pcvm-local-chain-optimization.md
```

AI 相关局部链路拆分写在：

```text
scratch/chain-runs/<run-id>/report/records/ai-local-chain.md
```

## 7. 报告、记录与附件关系

PCVM 产物关系如下：

| 产物 | 是否必需 | 角色 | 说明 |
| --- | --- | --- | --- |
| `report/plan.md` | 必需 | 主计划 / 主状态机 | 节点定义、指标契约、游标、verdict 和必要更新在这里可读。 |
| `report/records/data.md` | 按需必需 | 数据记录 | 节点测量数据、路径事实、命令摘要和 source fact 表。 |
| `report/records/issues.md` | 按需必需 | 问题记录 | 节点失败、风险、残余边界、待补证和待裁决项。 |
| `report/records/progress.md` | 按需必需 | 推进记录 | 执行流水、用户确认、过程 note 和回合记录。 |
| `attachments/*.json` | 可选 | 大型机器证据 | 只在 JSON 太大不适合内联时使用，必须从对应节点链接并摘要。 |
| `attachments/*.log` | 可选 | 大型命令输出 | 必须有摘要、命令、退出码、时间和关联节点。 |
| `attachments/*.png` | 可选 | UI / 图像证据 | 只用于视觉或 Dashboard 观察证据。 |
| `fixtures/` | 可选 | 节点输入 | 用于 node-local fixture 或 frozen upstream artifact。 |
| `temp-tests/` | 可选 | 一次性验证 harness | 不进入产品仓库，不作为长期测试替代品。 |

如果某个指标依赖记录或附件，`plan.md` 里必须写：

- record / 附件路径
- record / 附件摘要
- 关联节点
- 关联 scorecard 字段
- 为什么不内联到 plan

records 和 attachments 不能成为第二个总控事实源；它们是证据账本，最终节点裁决仍以 AlembicWorkspace 对 plan 游标和 verdict 的判断为准。

## 8. 与总控的关系

AlembicWorkspace 总控主持 PCVM 使用与 plan 推进。整理阶段或执行阶段需要向当前总控计划回填时，只提交事实和产物：

- run id
- `report/plan.md` 路径
- current node
- 已覆盖节点
- metrics 覆盖情况
- blocked / incomplete gaps
- 禁止事项确认
- 下一步建议

总控负责：

- 生成 / 更新 `report/plan.md`
- 复核 `report/plan.md`
- 判定 ready / incomplete / blocked
- 决定是否派产品仓库
- 创建产品窗口任务包
- 验收产品仓库回填

`PCVM/` 目录本身不关闭 TODO、不归档主线、不宣布产品阶段通过。

## 9. 当前默认 run

当前 run id：

```text
pcv-20260530-1515-alembic-cold-start
```

主产物：

```text
scratch/chain-runs/pcv-20260530-1515-alembic-cold-start/report/plan.md
```

当前目标：

```text
Alembic cold-start source-derived plan and metrics
```
