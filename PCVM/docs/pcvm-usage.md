# PCVM 使用说明

本文说明 PCVM 如何使用、plan 如何生成与更新，以及 plan、records、metrics、artifacts 的关系。入口硬规则见 `../AGENTS.md`；执行流程见 `../skills/pcvm-flow-controller/SKILL.md`；机器路线见 `../config/pcvm-flow-control.json`。

## 1. PCVM 定位

PCVM 是 Progressive Chain Validation 领域总控窗口。它在已确认的 PCV 目标、仓库边界、指标、轮次和资源预算内，可以自主：

- 生成和更新 source-derived `report/plan.md`
- 拆分 round、node、local segment
- 定义 primary/support/diagnostic 指标和 token 指标
- 维护 records 和 artifacts
- 自己修复 PCV 范围内的相关代码
- 派发产品仓库任务包
- 调用 AlembicTest 获取真实 AI / 真实项目 / runtime / Dashboard / delivery 证据
- 复核原始证据，给出 PCVM scoped verdict，并决定下一轮优化

AlembicWorkspace 总控只在全局目标、非 PCV 范围扩张、最终归档、全局 TODO 关闭、跨主线冲突或用户最终裁决时介入。

## 2. 输入关系

| 输入 | 位置 | 用途 |
| --- | --- | --- |
| Workspace 规则 | `../AGENTS.md` | 上层边界、最终裁决、全局停止卡。 |
| PCVM 入口规则 | `../AGENTS.md` | PCVM 定位、权限、硬停止卡、AI 防错硬规则。 |
| Flow skill | `../skills/pcvm-flow-controller/SKILL.md` | PCVM 日常执行、派发、自修、Test、回填复核流程。 |
| Flow config | `../config/pcvm-flow-control.json` | 状态线路、轮次顺序、门禁、字段清单和升级门禁。 |
| Canonical PCV skill | `../../progressive-chain-validation/progressive-chain-validation/SKILL.md` | PCV 方法入口。 |
| Round model | `pcvm-round-model.md` | 多轮次语义和 verdict scope。 |
| Local chain model | `pcvm-local-chain-optimization.md` | 局部链路切分、冻结、切断和 before/after 优化。 |
| Product repositories | `../../Alembic*` 等 | source-first chain map、工程修复、自修或派发对象。 |
| AlembicTest | 同级或 workspace 配置目标 | 真实项目、live AI、runtime、Dashboard、delivery 证据。 |

## 3. Run 布局

每个 run 使用固定布局：

```text
scratch/chain-runs/<run-id>/
  report/
    plan.md
    records/
      data.md
      issues.md
      progress.md
    artifacts/
  attachments/
  fixtures/
  temp-tests/
```

核心关系：

- `report/plan.md` 是主计划 / 状态机，只放链路切分、节点定义、游标、scorecard summary、scoped verdict 和 records 链接。
- `records/data.md` 放 source facts、命令证据、测量表、报告路径、job/session id。
- `records/issues.md` 放问题、风险、阻塞、残余风险和待裁决项。
- `records/progress.md` 放推进流水、用户确认和执行记录。
- `report/artifacts/` 放机器形态 probe 摘要、JSON、截图和大块命令产物。

records 和 artifacts 是证据账本，不是第二个 plan，也不能替代原始证据复核。

## 4. Plan 生成

生成 `report/plan.md` 前，PCVM 必须完成：

1. 读取 PCVM 入口规则、flow skill、flow config。
2. 明确用户目标、当前证据、最小闭环和第一阻塞点。
3. 按需读取 canonical PCV skill 和 references。
4. 从真实源码生成 source-first chain map。
5. 明确 data-location / write boundary。
6. 定义 node cut、upstream freeze、downstream cut、reset rule 和 metrics。
7. 初始化 run artifact。

`plan.md` 必须包含：

- run metadata、scope、write boundary、current cursor
- source-first chain analysis 和 source chain map
- branch / degradation paths
- node cut strategy
- reference alignment
- execution control gate
- workflow variant orders
- expanded node sections
- per-node metrics scorecard
- plan update log
- final outcome / handoff notes

如果 plan 只有 N0-N14 表格、宽泛摘要或 broad run 命令清单，没有 expanded node、指标、隔离切点和门禁，必须标为 incomplete。

## 5. Plan 更新

`plan.md` 是状态机，不是过程日志。

更新规则：

- 每轮只推进当前授权 round、node 或 segment。
- 只更新当前 section、scorecard summary、verdict、cursor、record links 和 update log。
- 数据、问题、推进流水和复盘分别写入 records。
- 不得把 raw log、大段命令输出、长复盘或宽泛 issue dump 堆入 plan。
- 不得一次把多个节点自动改成 pass。
- 不得用 broad full-run 成功让下游节点自动通过。
- 不得在没有 isolation proof 时推进游标。

失败时：

1. 记录失败 invariant。
2. 判断是 code fact、test gap、probe error、expected boundary、runtime placeholder 还是 user decision gap。
3. 选择同链路最小修复动作。
4. 用同一 fixture / frozen artifact / same route rerun。
5. 写 before/after comparison。

## 6. 指标

每个 node、segment 或 round 至少定义：

| 字段 | 含义 |
| --- | --- |
| `usefulUnit` | 该阶段真正产出或判断的最小价值单元。 |
| `qualityGate` | 改善计分前必须先通过的质量门。 |
| `stageLoss` | 缺证据、fallback、invalid output、重复、预算浪费、unsafe write risk 等损失信号。 |
| `baseline` | 改动前、同 fixture / frozen artifact / same-route 下的测量。 |
| `candidate` | 改动后、同 fixture / frozen artifact / same-route 下的测量。 |
| `comparison` | before/after delta、quality gate 状态和 unchanged boundaries。 |
| `verdict` | 带 scope 的 `pass`、`improved`、`neutral`、`regression`、`blocked`。 |
| `evidenceLinks` | record path、report path、trace id、artifact path、test output、日志。 |
| `residualRisk` | 不阻塞当前 verdict 的风险，或导致 blocked 的缺口。 |

规则：

- 裸 `pass` 不合法；必须写 `pass(scope=fixture)`、`pass(scope=live-ai-local)` 等。
- improvement 只有在 quality gate 通过后才成立。
- loss 下降但 useful unit 变弱，不算 improved。
- 不同轮次数据不得合并成一个 verdict，除非 comparison 明确说明 scope 差异。
- AI 区间必须记录 stage token usage 和 whole-route cold-start token usage。

## 7. 派发、自修与 Test

确定性工程问题：

- PCVM 可以自己修，也可以派发给 owner repo 窗口。
- 自修或派发前必须读取目标仓库 `AGENTS.md`。
- 任务包必须写清 owner repo、输入输出、状态变化、调用链、验证方式、before/after 指标、禁止动作和回填证据。

真实测试问题：

- 只有 real project、live AI、runtime、Dashboard、delivery、regression 或 cross-repo integration 需要 AlembicTest。
- Test 合同必须写清它回答什么、成功证明什么、失败证明什么、不能证明什么、停止条件和需要回填的原始证据。
- PCVM 复核 Test 原始证据后，才能写 scoped verdict。

## 8. 短期状态

当前 run id、当前目标项目、Pxx/Rx 状态、任务包列表、临时暂停原因和当轮数值不得写入 `AGENTS.md`、flow skill 或 flow config。

短期状态写到：

- `index.md`
- 当前 run `report/plan.md`
- 当前 run `report/records/*`
