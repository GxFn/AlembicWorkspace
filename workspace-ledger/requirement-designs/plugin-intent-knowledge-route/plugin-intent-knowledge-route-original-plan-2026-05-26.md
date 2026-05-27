# Plugin Intent Knowledge Route 原始计划书

Design Key：INTENT-KNOWLEDGE-2026-05-26
日期：2026-05-26
状态：与 `INTENT-RECOGNITION-2026-05-26` 共同构成 037 完整目标
维护窗口：AlembicDesign
总控：AlembicWorkspace
Source TODO：`GTODO-2026-05-24-037`
上游依赖：`INTENT-RECOGNITION-2026-05-26`

## 用户目标

在完成快速意图识别与跨会话 episode 连续性后，把识别出的意图接入 Alembic 的 prime、knowledge search、Recipe evidence 和 shout / hint 链路，让 Codex 当前任务意图真实影响知识注入与检索结果。

这不是替代 `INTENT-RECOGNITION-2026-05-26`；两者都要做。识别负责“意图怎么得到”，本需求负责“意图得到后如何进入知识链路”。

## 完整关系

```text
INTENT-RECOGNITION-2026-05-26
  -> 产出 RecognizedIntentDraft / IntentEpisode
  -> 支持跨会话 continuity

INTENT-KNOWLEDGE-2026-05-26
  -> 消费 RecognizedIntentDraft / IntentEpisode
  -> 影响 prime / search / evidence / shout / hint
```

## 初步范围

- prime 注入时不只按 raw query 搜索，而要使用 recognized intent 的 userGoal、targetRefs、constraints、phase 和 firstBlocker 生成 query plan。
- search / context search 能接收 recognized intent，而不是只接 `intent: "search"` 或粗 scenario。
- Recipe evidence projection 能解释“为什么这条知识与当前意图相关”。
- shout / hint 能基于当前意图说明下一步关注点。
- resident route 需要能携带 intent metadata；否则 Plugin 的 resident semantic 增强路径会丢意图。

## 非目标

- 不重新设计意图识别；识别属于 `INTENT-RECOGNITION-2026-05-26`。
- 不让 prime 等待联网 AI。
- 不在 037 未完成前启动 038 / 039。

## 总控下一步建议

总控应把 037 视为两阶段目标：

1. 先评审并推进 `INTENT-RECOGNITION-2026-05-26`。
2. 再基于其产物评审 `INTENT-KNOWLEDGE-2026-05-26` 的消费链路。
