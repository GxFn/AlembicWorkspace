# AlembicAgent redundant systems negative scan

日期：2026-05-18

状态：`已完成`

总控入口：`docs/workspace/alembic-redundant-systems-removal-workspace-plan-2026-05-18.md`

## 完成范围

- 按总控 Wave 1 分派，对 `AlembicAgent` 执行三类冗余能力负向扫描：
  - Feishu/Lark remote 删除后遗留的 macOS 截屏连带能力。
  - Skills / Signal / Recipe 推荐系统。
  - ReverseGuard 反向验证能力。
- 确认本仓库没有上述三类功能实现、adapter、runtime 入口或 public contract。
- 清理唯一历史文案残留：`src/agent/context/ConversationStore.ts` 注释中的 `system(SignalCollector)` 已改为通用 `system(agent runtime)` 表述。
- 未新增推荐、截屏或 ReverseGuard adapter。

## 提交

- AlembicAgent 提交：`cbd7477462bd85f7490df4b8d6832deb8d3860fe`

## 验证命令和结果

```bash
npm run build
```

结果：通过，`tsc -p tsconfig.json` 成功。

```bash
rg -n "RecommendationPipeline|RecommendationMetrics|AIRecallStrategy|RuleRecallStrategy|SkillAdvisor|SignalCollector|EventAggregator|recommendationPipeline|recommendationMetrics|feedbackStore|suggestSkills|recordFeedback|skills/suggest|skills/feedback|skills/metrics|signal-status|recipe:get_recommendations|onRecommendation|onRecommendFeedback|pendingSuggestions" AlembicAgent --glob '!**/node_modules/**' --glob '!**/dist/**'
```

结果：0 命中。

```bash
rg -n "mac_screenshot|mac_window_list|MAC_SCREENSHOT|MAC_WINDOW_LIST|ScreenCaptureService|ScreenCaptureKit|build:screenshot|native-ui/screenshot|screenshotBinaryPath" AlembicAgent --glob '!**/node_modules/**' --glob '!**/dist/**'
```

结果：0 命中。

```bash
rg -n "ReverseGuard|reverse_audit|guard/report/reverse|reverseGuard|ReverseRecommendation|PatternDriftSignal|ReverseGuardResult|symbol_missing|match_rate_drop" AlembicAgent --glob '!**/node_modules/**' --glob '!**/dist/**'
```

结果：0 命中。

```bash
git diff --check
```

结果：通过。

## 残留扫描结果

- 截屏连带能力：0 命中。
- 推荐系统：0 命中。
- ReverseGuard：0 命中。
- 允许命中：无。

## 遗留风险

- 本窗口只验证并清理 `AlembicAgent`。`Alembic`、`AlembicCore`、`AlembicDashboard` 和 `AlembicPlugin` 的源码删除、vendor 同步和跨仓库最终验收仍以总控文档对应窗口回填为准。

## 下一步建议

- 总控可将 `AlembicAgent` 标记为 `已完成`。
- Wave 1 继续等待 `Alembic`、`AlembicCore`、`AlembicDashboard` 完成源头删除后，再解除 `AlembicPlugin` Wave 2 阻塞。
