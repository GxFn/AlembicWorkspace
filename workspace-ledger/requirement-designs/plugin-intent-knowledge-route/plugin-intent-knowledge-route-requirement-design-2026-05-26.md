# Plugin Intent Knowledge Route 需求设计

Design Key：INTENT-KNOWLEDGE-2026-05-26
日期：2026-05-26
状态：ready-for-workspace / 依赖 `INTENT-RECOGNITION-2026-05-26`
维护窗口：AlembicDesign
总控：AlembicWorkspace
原始计划：[plugin-intent-knowledge-route-original-plan-2026-05-26.md](plugin-intent-knowledge-route-original-plan-2026-05-26.md)
Source TODO：`GTODO-2026-05-24-037`

## 定位

本需求是 037 的第二层：把已识别出的意图接入知识链路。它不替代意图识别，也不应该在意图识别产物未稳定前独立实现。

## 最终目标

当 `prime` 得到 `RecognizedIntentDraft` 和相关 `IntentEpisode` 后，Alembic 应使用这些结构化意图来选择、排序、投射和解释项目知识，而不是只用用户原文或固定 `search` scenario。

用户于 2026-05-26 进一步收束：消费链路的核心是让意图提取结果给关键词搜索和向量 cosine 提供参考与增强，从而保证 prime 注入真正有价值。第一版不追求复杂 UI，也不追求联网 AI，而是让 intent 成为检索评分与注入解释的稳定输入。

用户继续补充：prime 注入结构本身也需要优化。结果汇总不能把“意图、搜索、向量、关联关系、最终注入内容”分散返回，而应作为一个统一交付包一起考虑，让 Codex 能看到本轮 prime 为什么选择这些知识、哪些证据参与了排序、哪些内容被降级或未注入。

用户继续补充：Recipe 的源文件路径仍然是关键证据，不能在交付包或注入摘要里丢失。`whySelected`、score 或摘要只能补充解释，不能替代可复核的 source path / source refs。

用户最终确认：低置信度时 `prime` 可以不强行注入。消费链路应允许 `PrimeInjectionPackage.injection.status = "needs-confirmation"` 或 `"degraded"`，并把未注入原因写入 `omitted` / `degradedReasons`，避免为了“有注入”而污染 Codex 上下文。

## 功能闭环

```text
RecognizedIntentDraft / IntentEpisode
-> IntentSearchPlan
-> keyword / bm25 search
-> semantic anchor / vector cosine search
-> score blend / rerank
-> relation expansion / association evidence
-> Recipe / Guard selection
-> PrimeInjectionPackage
-> whySelected / shout / hint
-> trace metadata
```

## IntentSearchPlan

`IntentSearchPlan` 是意图进入搜索与向量链路的消费契约。它不重新识别意图，只把上游 `RecognizedIntentDraft` / `IntentExtractionFrame` 转成可执行检索计划。

```ts
type IntentSearchPlan = {
  intentId: string;
  episodeId: string;
  lexicalQueries: string[];
  semanticAnchors: Array<{
    name: "goal" | "target" | "blocker" | "constraint" | "non-goal";
    text: string;
    weight: number;
  }>;
  filters: {
    repo?: string;
    language?: string;
    knowledgeKinds?: string[];
    lifecycle?: string[];
  };
  negativeSignals: string[];
  rankingProfile: {
    keywordWeight: number;
    cosineWeight: number;
    metadataWeight: number;
    continuityWeight: number;
  };
  primeProjection: {
    maxItems: number;
    requireWhySelected: true;
    degradeWhenConfidenceBelow: number;
  };
};
```

## PrimeInjectionPackage

`PrimeInjectionPackage` 是 prime 返回给 Codex 的结构化交付包。它应成为第一版消费链路的主要验收对象，而不是只验收零散 search result。

```ts
type PrimeInjectionPackage = {
  packageId: string;
  intent: {
    intentId: string;
    episodeId: string;
    summary: string;
    confidence: number;
    continuity: "new" | "continue" | "correction" | "supersede" | "fork" | "background";
  };
  search: {
    lexicalQueries: string[];
    filters: IntentSearchPlan["filters"];
    resultCount: number;
  };
  vector: {
    semanticAnchors: IntentSearchPlan["semanticAnchors"];
    cosineUsed: boolean;
    topAnchorMatches: Array<{
      anchorName: string;
      knowledgeId: string;
      cosineScore: number;
    }>;
  };
  relations: {
    expandedFrom: Array<{
      knowledgeId: string;
      relation: "same-target" | "same-dimension" | "dependency" | "recent-episode" | "guard-pair";
      reason: string;
    }>;
    relationBoostApplied: boolean;
  };
  selectedKnowledge: Array<{
    id: string;
    kind: "recipe" | "guard" | "fact" | "pattern" | "rule";
    title: string;
    sourcePath: string;
    sourceRefs: Array<{
      path: string;
      line?: number;
      section?: string;
      evidenceRole: "primary" | "supporting" | "derived";
    }>;
    injectionRole: "must-follow" | "context" | "guardrail" | "reference" | "candidate";
    scoreBreakdown: {
      keyword?: number;
      rawCosine?: number;
      intentCosine?: number;
      relationBoost?: number;
      continuityBoost?: number;
      final: number;
    };
    whySelected: string;
    evidenceRefs: Array<{ path: string; line?: number }>;
  }>;
  omitted: Array<{
    id: string;
    reason: "low-score" | "intent-mismatch" | "duplicate" | "low-confidence" | "budget";
  }>;
  injection: {
    status: "delivered" | "empty" | "degraded" | "needs-confirmation";
    summaryForCodex: string;
    orderedSections: Array<{
      title: string;
      items: string[];
    }>;
  };
  trace: {
    latencyMs: number;
    degradedReasons: string[];
    requestIds: string[];
  };
};
```

交付包原则：

- `intent` 说明本轮 prime 在服务什么用户目标。
- `search` 说明关键词 / BM25 如何召回。
- `vector` 说明 semantic anchors 和 cosine 如何参与排序。
- `relations` 说明 Recipe / Guard / episode 的关联关系如何增强或解释结果。
- Recipe / Guard 的 `sourcePath` 与 `sourceRefs` 是关键证据字段，必须在交付包中保留。
- `selectedKnowledge` 必须包含 `scoreBreakdown` 和 `whySelected`，避免 Codex 只看到未解释的知识列表。
- `whySelected` 解释选择原因，但不能替代源文件路径、行号或 section 证据。
- `omitted` 记录未注入原因，便于调试“为什么没有注入某条知识”。
- `injection.summaryForCodex` 是最终给 Codex 消费的短摘要，但不能替代完整 trace。
- 低置信度时允许不交付强注入；交付包应明确缺失槽位、降级原因和可选确认问题。

向量 cosine 增强方式：

- 不把 raw userQuery 作为唯一 embedding 输入。
- 用 `userGoal / taskObject / desiredOutcome / firstBlocker / constraints` 生成一个或多个 semantic anchor。
- 每个候选 Recipe / Guard 同时计算 raw query cosine 与 intent anchor cosine。
- final score 至少保留 `keyword score + raw cosine + intent anchor cosine + metadata/continuity boost` 的组成，便于解释和回归。
- 低置信度 intent 不应强行提高 cosine 权重，应降低注入数量、返回 `needs-confirmation` 或要求确认。

## 关键消费点

| 消费点 | 目标 |
| --- | --- |
| prime query plan | 用 userGoal、phase、targetRefs、constraints、firstBlocker 生成多路 query。 |
| search ranking | 不只依赖 raw query；让 phase / target / constraints 影响排序、过滤和 score blend。 |
| vector cosine | 用 intent semantic anchors 增强向量相似度，而不是只拿用户原文做 embedding。 |
| relation expansion | 使用知识之间的 target / dimension / dependency / recent episode 关系解释或增强候选。 |
| prime package | 汇总 intent、search、vector、relations、selectedKnowledge、omitted 和 injection summary。 |
| resident route | Plugin -> Alembic daemon 的 search request 要携带 intent metadata。 |
| evidence projection | 每条入选 Recipe / Guard 给出 whySelected。 |
| shout / hint | 用当前意图说明已接收知识如何影响下一步，而不是泛泛列规则。 |

## 第一版验收口径

- 同一 ProjectScope、不同 `RecognizedIntentDraft` 能产生不同 query plan。
- 同一 raw query、不同 intent slot 能产生不同 semantic anchors 或 ranking profile。
- 至少一个真实消费点能体现不同 intent 导致不同知识选择、排序、cosine 参考或 whySelected。
- resident 增强路径不丢 intent metadata。
- 输出包含 trace：intentId、episodeId、queryPlan、semanticAnchors、scoreBreakdown、selectedKnowledge、whySelected。
- prime 返回 `PrimeInjectionPackage`，其中 intent、search、vector、relations、selectedKnowledge、omitted 和 injection summary 都能在同一结构中复核。
- 每条注入的 Recipe / Guard 必须保留可复核的 `sourcePath` / `sourceRefs`；没有源路径的候选只能降级为 `candidate` 或进入 `omitted`。
- 低置信度场景可以返回无强注入的交付包，并明确 `needs-confirmation` / `degraded` 及原因。

## 分阶段执行建议

本 Design Key 不应与意图提取入口同时派发。建议在 `INTENT-RECOGNITION-2026-05-26` 完成 Stage 1-2 后，再按以下阶段推进：

| 阶段 | 名称 | 目标 | 验收 |
| --- | --- | --- | --- |
| Stage 3 | IntentSearchPlan + keyword | 用 `RecognizedIntentDraft` 生成 lexical queries、filters、negativeSignals 和 ranking profile，先接 keyword / BM25。 | 同 raw query 不同 intent 产生不同 query plan；`whySelected` 与 `sourcePath` 保留。 |
| Stage 4 | Vector cosine + relations | 生成 semantic anchors，让 raw cosine、intent cosine、relation boost 进入 score breakdown。 | 输出 `semanticAnchors`、`topAnchorMatches`、`scoreBreakdown`，并能解释 relation expansion。 |
| Stage 5 | PrimeInjectionPackage | 汇总 intent、search、vector、relations、selectedKnowledge、omitted、source refs 和 injection summary。 | prime 返回统一结构，可复核注入、未注入和降级原因。 |
| Stage 6 | AlembicTest 真实验证 | 在真实项目、多会话和真实 prime 流程中验证注入价值。 | `AlembicTest` 回填真实项目证据：跨会话、纠偏、搜索增强、向量增强、源路径保留和交付包可用。 |

阶段原则：

- Stage 3 先确保非向量路径也能提升 prime 注入价值。
- Stage 4 再接向量 cosine 和关联关系，避免向量链路遮蔽意图提取问题。
- Stage 5 只在前面检索证据稳定后封装交付包。
- Stage 6 才需要 `AlembicTest`；此前以 unit、targeted integration、probe 为主。

## 依赖

- 依赖 `INTENT-RECOGNITION-2026-05-26` 产出可用的 `RecognizedIntentDraft`。
- 依赖总控确认 `IntentEpisode` 存储和读取边界。

## 非目标

- 不负责识别意图本身。
- 不要求联网 AI。
- 不启动 038 / 039。
- 不要求 Dashboard UI 第一版。

## 总控下一步建议

总控可以接收本需求作为 037 第二阶段，但派发顺序必须在 `INTENT-RECOGNITION-2026-05-26` 之后。若总控要形成一个完整 037 目标阶段确认，应把两个 Design Key 都列入同一目标。
