# AlembicCore ReverseGuard Removal Wave 1

执行日期：2026-05-18
状态：已完成
总控入口：`docs/workspace/alembic-redundant-systems-removal-workspace-plan-2026-05-18.md`

## 1. 目标与边界

本阶段执行 AlembicCore 窗口的 Wave 1 任务：删除 ReverseGuard 源头、exports、测试和 DecayDetector 中只依赖 ReverseGuard audit log 的衰退策略。

删除范围：

- `src/service/guard/ReverseGuard.ts`。
- `test/unit/ReverseGuard.test.ts`。
- `src/service/guard/index.ts` 中 ReverseGuard export。
- `test/GuardImmuneSystem.test.ts` 中 ReverseGuard e2e case。
- `src/service/evolution/DecayDetector.ts` 中 `symbol_drift` strategy、audit log 查询 helper 和 Drizzle/auditLogs coupling。
- 只指向历史推荐/反向验证系统名的注释和 logger tag。

保留范围：

- Guard 正向检查、跨文件检查、RuleLearner、GuardFeedbackLoop、CoverageAnalyzer、ComplianceReporter、UncertaintyCollector。
- SourceRefReconciler 和 DecayDetector 的 `source_ref_stale` 来源引用维护链路。
- `RuleLearner.recordFeedback`，它属于 Guard feedback loop，不属于 Skills 推荐系统。
- 通用 repository 查询方法；本阶段只移除旧系统名注释，不把可复用查询 API 贸然删掉。

## 2. 完成范围

代码变更：

- 删除 ReverseGuard 源文件和单元测试。
- 从 Guard barrel exports 移除 ReverseGuard。
- 从 Guard immune integration 测试移除 ReverseGuard case，保留 uncertainty、反馈确认、覆盖率、学习器和合规报告测试。
- 从 DecayDetector 删除 `symbol_drift`，并保留 `source_ref_stale`、`no_recent_usage`、`high_false_positive`、`superseded` 和 `contradiction` 策略。
- 将 `KnowledgeRepository.impl.ts`、`CodeEntityRepository.ts`、`Logger.ts` 中的历史 `ReverseGuard` / `SignalCollector` / `SkillAdvisor` / `EventAggregator` 注释或标签改为通用治理/统计描述。
- 清理本地 ignored `dist/service/guard/ReverseGuard.*` stale 产物；随后重新运行 `npm run build`，确认不会重新生成。

提交 hash：`92ccd10baad1eac5fcfe3b4d4c8191a02042da04`

## 3. 验证命令与结果

已执行：

- `npm run build:check`：通过。
- `npm test -- DecayDetector GuardImmuneSystem`：通过，2 files / 19 tests。
- `npm run test`：通过，59 files / 916 tests；保留既有非阻塞 stderr `error: Could not access 'HEAD'`。
- `npm run check`：通过；public API boundary 134 个 package exports；Biome checked 412 files。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，73 个 exact public API entrypoints 可导入。
- `git diff --check`：通过。

## 4. 残留扫描结果

截屏连带能力扫描：

```text
rg -n "mac_screenshot|mac_window_list|MAC_SCREENSHOT|MAC_WINDOW_LIST|ScreenCaptureService|ScreenCaptureKit|build:screenshot|native-ui/screenshot|screenshotBinaryPath" src test dist package.json README.md scripts --glob '!**/node_modules/**'
```

结果：0 命中。

推荐系统扫描：

```text
rg -n "RecommendationPipeline|RecommendationMetrics|AIRecallStrategy|RuleRecallStrategy|SkillAdvisor|SignalCollector|EventAggregator|recommendationPipeline|recommendationMetrics|feedbackStore|suggestSkills|recordFeedback|skills/suggest|skills/feedback|skills/metrics|signal-status|recipe:get_recommendations|onRecommendation|onRecommendFeedback|pendingSuggestions" src test dist package.json README.md scripts --glob '!**/node_modules/**'
```

剩余命中：

- `src/service/guard/RuleLearner.ts` 的 `recordFeedback`。
- `dist/service/guard/RuleLearner.js` / `dist/service/guard/RuleLearner.d.ts` 的 `recordFeedback`。
- `test/GuardImmuneSystem.test.ts` 中对 `RuleLearner.recordFeedback` 的测试。

结论：剩余命中属于 Guard feedback loop，计划第 2.2 / 第 3 节明确要求保留；不是 Skills 推荐系统残留。

ReverseGuard 扫描：

```text
rg -n "ReverseGuard|reverse_audit|guard/report/reverse|reverseGuard|ReverseRecommendation|PatternDriftSignal|ReverseGuardResult|symbol_missing|match_rate_drop" src test dist package.json README.md scripts --glob '!**/node_modules/**'
```

结果：0 命中。

stale dist 文件扫描：

```text
find dist/service/guard -maxdepth 1 -type f -name '*ReverseGuard*' -print
```

结果：0 命中。

## 5. 遗留风险与下一步

- `@alembic/core/service/guard/*` 仍是 wildcard export；删除 `ReverseGuard.ts` 后直接导入该已删除子路径会失败，这是本轮删除的预期破坏性变化。外层仓库必须删除对应消费入口。
- `DecayDetector` 构造参数仍兼容旧调用方传入 `drizzle`，但不再读取 audit log；后续如果外层仍传该参数，可以在外层 Wave 1 / Wave 2 中顺手移除。
- 下一步由 `Alembic` 删除 ReverseGuard MCP/HTTP/DI/schema/tool description/tests/docs 消费，由 `AlembicPlugin` 在 Wave 2 同步 vendor Core 并做 runtime/package/channel 负向扫描。
