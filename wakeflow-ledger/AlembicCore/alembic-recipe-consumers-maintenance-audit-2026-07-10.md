# Recipe 消费面(5 MCP)+维护进化环审计 — 2026-07-10(进行中底稿)

背景:BiliDili 真实 KB 就位(75 候选;60 refs drifted;**30 个 drifted→update 提案
在 evolution_proposals**——维护环第一批真实工作负载)。本底稿记录现状发现与落地计划,
跨上下文续作的单一入口。

## 五个 Recipe 消费工具(Plugin MCP 面,见 alembic-mcp-layer-walkthrough)

`alembic_search` / `alembic_prime` / `alembic_recipe_map` / `alembic_code_guard` /
`alembic_status`。P1 漂移感知已实现于 search/prime 链(Core SearchEngine +
Plugin handlers,b32a8e5/40fa3d5);**活体测试待做**(本会话 cc-host 进程仍是旧代码,
重启 CC 会话后用新面直测;或经 Plugin dist EmbeddedToolExecutor 探针)。

## 已确认发现(真机)

- **F1 主体 HTTP knowledge 面无漂移标注**:`GET /api/v1/knowledge`(list/query)与
  `/:id` 详情的输出**均无 sourceStatus/sourceRefs/driftedSourceRefs**——Dashboard
  是人审 30 个 update 提案的主界面,却看不到"该知识源头已漂移/漂在哪几段"。
  P1 当时只覆盖 search/prime 链;这是消费面缺口第一优先。
- **F2 主体挖掘 refs 落锚 parity**(已登记):新 16 refs contentFp 空,靠下次
  reconcile 补;Plugin submit 链才是 at-submit 种子。主体 insert 路径应同种子。
- **F3 主体 reconcile 未接 P3 精判**(gitReader/baseline;Plugin rebuild 链已接)
  → 主体链 drifted 无 line-shift/content-change 细分。
- **F4 维护环观测**:30 提案生成正常(CoverageClassifier);提案队列 HTTP/Dashboard
  可见性+审批流+staging 复核队列(143:staging-review-queue 存在)串联体验待验。

## 落地计划(下一上下文执行序)

1. **P-A 主体 HTTP 漂移标注**(F1):list/detail 输出补 sourceStatus(按 refs 聚合:
   active/drifted)+详情带 sourceRefs(path/status/contentFp 有无);Dashboard 提案
   审批的知识卡即见漂移。小改(routes/knowledge.ts 投影层),不动契约语义。**✅ 已落地+真机验证(主体 commit 见 git log):detail drifted+3 段明细/list 24÷60 标注。**
2. **P-B 主体落锚 parity**(F2):主体候选创建链 insert refs 时同步 seed contentFp
   (对齐 Plugin `#insertSourceRef`);回归=rescan 后新 refs anchored=100%。
3. **P-C 主体 reconcile 接 P3**(F3):KnowledgeRescanWorkflow 的 reconcile 传
   gitReader+baseline(对齐 Plugin knowledge-index-rebuild 的 resolveDriftBaselineCommit)。
4. **P-D 五工具活体矩阵**:重启 CC 会话(新 cc-host)后逐一真测:search(漂移降权
   0.85×+driftedSourceRefs 输出)、prime(sourceStatus 对称)、recipe_map(挂载
   索引与 staging/active 一致)、code_guard(Recipe 规则+enhancement 精确包)、
   status(usage 计数)。发现即修。
5. **P-E 维护环端到端**:处理 30 个 update 提案的真实走查(Dashboard 审批→
   执行器→refs 重锚→drifted 清零),staging 复核队列(24h/72h 期限)行为核对。

## 约束

评分/门路由改动须 eval:mining 验证;主体/Plugin 双宿主 parity 是验收线;
push/发版等用户门不动。
