# Knowledge Evolution TODOs 原始计划书

Design Key：KNOWLEDGE-EVOLUTION-TODOS-2026-05-26
日期：2026-05-26
状态：draft / 顺序讨论索引
维护窗口：AlembicDesign
总控：AlembicWorkspace

## 用户目标

将 `GTODO-2026-05-24-037`、`GTODO-2026-05-24-038`、`GTODO-2026-05-24-039` 按顺序逐个讨论，分别推进到可由 `AlembicWorkspace` 总控接收、评审并转成可执行计划的状态。

用户纠偏：这不是要先整理一组自动化领取字段，也不是把三个 TODO 合成一个可直接执行的大包；正确目标是先按依赖顺序讨论需求本身，完成一个再进入下一个。

## 用户原话 / 关键约束

```text
讨论一下这三个 TODO，现在总控在做自动化领取 TODO；我希望完成之后，可以使用这三个 TODO 去执行自动化；现在我们把这三个 TODO 按顺序推进到可交给总控的状态
```

用户随后纠偏：

```text
我给你的需求不是这个意思，我意思是按顺序讨论这几个 TODO，把需求推进到可执行计划
```

用户给出的 TODO 顺序：

```text
GTODO-2026-05-24-037：Plugin 意图同步 + 知识注入 / 检索链路增强。这个看起来是后续知识进化大主线的上游。
GTODO-2026-05-24-038：Alembic file monitor evolution，依赖/需要对齐 037。
GTODO-2026-05-24-039：Plugin 无 file monitor 时的机会式知识进化，也等待 037 的意图同步设计。
```

## 设计判断

这三个 TODO 应按 `037 -> 038 -> 039` 处理：

1. `037` 先定义 Plugin intent 与知识注入 / 检索 / evidence / hint 的共同语义。
2. `038` 再讨论 Alembic daemon file monitor 如何消费或对齐 037 的 intent / evidence 语义。
3. `039` 最后讨论 Plugin 无 file monitor 时的机会式进化 fallback，避免复制 Alembic daemon file monitor。

因此本文只作为顺序讨论索引，不作为总控执行计划，不作为自动化领取包，也不直接交给实现窗口。

## 当前拆分状态

| Source TODO | Design Key | 状态 | 判断 |
| --- | --- | --- | --- |
| `GTODO-2026-05-24-037` | `INTENT-RECOGNITION-2026-05-26` + `INTENT-KNOWLEDGE-2026-05-26` | ready-for-workspace | 已拆成“意图识别与 episode 连续性” + “意图知识链路消费”两个配套需求，可交给总控接收评审。 |
| `GTODO-2026-05-24-038` | 待定，建议 `FILE-MONITOR-EVOLUTION-2026-05-26` | not-started | 等 037 的 intent / evidence 语义明确后再讨论。 |
| `GTODO-2026-05-24-039` | 待定，建议 `PLUGIN-FALLBACK-EVOLUTION-2026-05-26` | not-started | 等 037 的 intent 语义明确后再讨论，并默认排在 038 之后。 |

## 期望推进方式

- 当前只把 `037` 推进到可交给总控状态，且 037 包含两个都要做的配套目标。
- `038` 和 `039` 不在本轮伪装成 ready；只记录依赖、顺序和后续讨论入口。
- 总控接收 `037` 后，应先做 Plugin context 与 Alembic knowledge route 的代码事实调研，再进入目标阶段确认。
- 037 的代码事实和阶段确认结果，会决定 038 / 039 如何取得当前开发意图、如何读取跨会话 episode、如何消费意图到知识链路、是否需要共享 schema、以及验证边界。

## 非目标

- 不实现 Plugin intent sync。
- 不实现 Alembic file monitor evolution。
- 不实现 Plugin no-monitor fallback。
- 不修改 `AlembicWorkspace` 全局 TODO 或当前状态。
- 不创建 wave 或分派实现窗口。
- 不把 038 / 039 提前标成 ready。

## 需要总控后续裁决

- 是否同时接收 `INTENT-RECOGNITION-2026-05-26` 和 `INTENT-KNOWLEDGE-2026-05-26` 作为 `GTODO-2026-05-24-037` 的正式需求设计输入。
- 是否先为 037 做代码事实调研和目标阶段确认。
- 037 确认后，是否继续让 AlembicDesign 按顺序讨论 038。
