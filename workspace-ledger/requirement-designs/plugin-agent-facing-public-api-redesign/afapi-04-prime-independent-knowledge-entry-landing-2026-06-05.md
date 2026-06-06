# AFAPI 04 Prime Independent Knowledge Entry 落地方案

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
独立需求：`AFAPI-REQ-04-PRIME-INDEPENDENT-KNOWLEDGE-ENTRY`
状态：landing-doc-ready / code-fact-reviewed
维护窗口：AlembicWorkspace

## Design 来源

- `AlembicDesign/docs/current/plugin-prime-task-decoupling-requirement-design-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-intent-structured-local-vector-requirement-design-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-codex-public-api-discussion-sequence-2026-06-04.md`
- `workspace-ledger/requirement-designs/plugin-intent-knowledge-route/plugin-intent-knowledge-route-requirement-design-2026-05-26.md`

## 独立定位

本需求定义 `alembic_prime` 作为独立的结构化 Recipe knowledge 入口。它从 intentRef 或 curated recognizedIntent 出发，输出 compact, trust-labeled, ref-based 的 prime package。它不再依附 `alembic_task(operation=prime)`，也不直接消费 raw automation envelope 或未经整理的 prompt。

## 真实需求

- `alembic_prime` 必须是独立 public tool，输入应优先使用 `intentRef` 或 structured host intent。
- Prime route 必须 structure-first：先理解用户目标、对象、约束、sourceRefs / referenced docs，再规划 Recipe / Guard / decision retrieval，而不是只做 BM25 docs dump。
- 输出必须包含 `primeRef`、detailRefs、sourceRefs / evidenceRefs、trust posture material、compact knowledge package 和 output budget / truncation 信息。
- Prime 需要支持 empty / degraded / skipped / blocked，不得为了“有注入”强行交付低置信度或异项目知识。
- 低置信度、机械信封、缺失 referenced docs、resident unavailable、knowledge-empty 等情况必须有明确 reason。
- Prime 不创建 work，不运行 Guard，不记录 durable decision。

## 代码事实复核

- `AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts` 已实现 `primeHandler`，从 `intentRef` 或 fallback intake 构造 prime，返回 `primeRef`、`result`、`primeKnowledgeMaterial`、detailRefs 和 runtime context。
- `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts` 是 Plugin 侧 structure-first / multi-query search pipeline 的核心服务。
- `AlembicPlugin/lib/service/task/PrimeKnowledgeMaterial.ts` 已把 search result、accepted knowledge、Guard material、candidate / evidence refs、host intent context 组装为 trust-labeled prime material。
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts` 已消费 Alembic resident search / PrimeInjectionPackage 类信息，并对 sourceRefs / evidenceRefs 做 compact projection。
- `Alembic/lib/http/routes/search.ts` 和 `Alembic/lib/resident/tool-handlers/search.ts` 已把 Decision Register active effective view 合并进 search / resident result，这会影响 prime 可消费知识。
- `AlembicPlugin/test/unit/AgentPublicToolsActive.test.ts`、`TaskPrimeKnowledgeMaterial.test.ts`、`PrimeSearchPipelineResidentSearch.test.ts` 和 real Codex resident smoke 为当前 prime 行为提供证据。

## 落地方案

1. Stage 0 prime chain inventory：
   - 复核 `alembic_prime` schema、handler、PrimeSearchPipeline、resident search client、PrimeKnowledgeMaterial、output budget 和 tool description。
   - 复核 raw automation envelope / missing docs / no semantic intent 的 block / skip 路径。
2. Stage 1 input handoff：
   - 优先消费 `intentRef`；没有本地 record 时允许 structured recognizedIntent / hostDeclaredIntent fallback。
   - 不允许 raw envelope 直接成为 query；必须有 sourceRefs 或 referenced docs 后才能作为 retrieval context。
3. Stage 2 retrieval package：
   - 查询计划需要体现 keywords、semantic anchors、sourceRefs、runtime project identity、resident route availability。
   - 输出必须保留 detailRefs、sourceRefs / evidenceRefs 和 why / trace 信息，不能只给摘要。
4. Stage 3 degraded / empty behavior：
   - resident unavailable、knowledge-empty、low-confidence、budget-limited 等情况返回 structured degraded / skipped / blocked。
   - empty / degraded prime 仍需告诉 host agent不能声称已经获得 trusted project knowledge。
5. Stage 4 consumer handoff：
   - `primeRef` 可被 work_start / work_finish / code_guard / decision_record 作为上下文 ref 使用。
   - Prime 不负责执行后续动作，只给 host agent可用知识包和信任边界。

## 验收定义

- 调用 `alembic_prime` 不经过旧 task operation，也不依赖 legacy task handler 才能返回结果。
- ready prime 返回 `primeRef`、detailRefs、trustPosture / receiptChecklist、compact package 和 runtime / source policy。
- raw automation envelope without source refs / referenced docs 被 block 或 skip，不发生 raw prime query。
- resident unavailable 或 knowledge-empty 返回 degraded，并且 host-visible message 不声称 trusted-to-use / trusted-to-obey。
- output budget 生效，长知识包通过 detailRefs 保留可复核证据，不在 message 中无限展开。
- Prime 的 project identity 来自 AFAPI 01，不被 selected / saved root 污染。

## 边界和非目标

- 不把 prime 变成 work_start；真实代码任务由 AFAPI 06 负责。
- 不在 prime 中运行 Guard；Guard 由 AFAPI 07 负责。
- 不在 prime 中写 Decision Register；decision_record 由 AFAPI 08 负责。
- 不用“返回 primeRef”单独证明结构化检索完成；必须复核 retrieved material、sourceRefs、evidenceRefs、degraded reasons 和 trust receipt。

## 当前裁决

当前代码已实现独立 `alembic_prime` 和结构化 material，但后续如果用户要求逐项对齐原始 `PrimeInjectionPackage` 中的 lexical / vector / relations / selectedKnowledge / omitted / trace 字段，必须从本文重开字段级验收，不能用旧 AFAPI 总体验收替代。

