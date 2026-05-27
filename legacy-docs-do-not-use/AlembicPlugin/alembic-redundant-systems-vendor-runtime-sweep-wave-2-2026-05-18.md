# AlembicPlugin redundant systems vendor runtime sweep Wave 2

更新日期：2026-05-18

状态：`已完成；等待 workspace 总控验收`

本文件回填 `docs/workspace/alembic-redundant-systems-wave-1-acceptance-wave-2-plan-2026-05-18.md` 分配给 `AlembicPlugin` 的 Wave 2 任务。执行范围只限 `AlembicPlugin` 仓库、其 vendored Core/Dashboard 指针、Codex plugin runtime/tarball，以及 workspace 文档回填。

## 完成范围

- 已同步 `vendor/AlembicCore` 到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`。
- 已同步 `vendor/AlembicDashboard` 到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。
- 已删除 `lib/http/routes/skills.ts` 中 `/skills/suggest` 和 `/skills/signal-status` 兼容空端点。
- 已删除 `lib/core/gateway/GatewayActionRegistry.ts` 中 `recipe:get_recommendations` action registration。
- 已清理 stale `vendor/AlembicCore/dist`，避免旧 `ReverseGuard` generated output 残留在 runtime 输入中。
- 已刷新 `plugins/alembic-codex/runtime` 和 `plugins/alembic-codex/runtime.tgz`。

## 提交

- `AlembicPlugin`：`12b7dd2fdb4d8654d78e548cce8a6692c4fd96be` (`chore: sweep redundant systems from plugin runtime`)
- `plugins/alembic-codex`：`422e53d5294aa95a1254ff72cbe83eb1c449932d` (`build: refresh runtime after redundant systems removal`)

## 验证命令

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npm run build:check` | 通过 | TypeScript build check 通过。 |
| `npm run build` | 通过 | 主构建通过。 |
| `npm run lint:repo-boundary` | 未通过 | 仍命中既有 10 处 DB boundary violations，本轮未引入新 DB 访问；需后续专门收口。 |
| `npm run report:agent-extraction-boundary` | 通过 | agent / ai / tool 边界计数均为 0。 |
| `npm run build:dashboard` | 通过 | Dashboard vendor build 通过，仅有 Vite chunk size warning。 |
| `npm run prepare:codex-plugin-runtime` | 通过 | Codex runtime 和 tarball 已重建。 |
| `npm run verify:codex-plugin` | 通过 | Plugin package 验证通过。 |
| `npm run verify:codex-channel` | 通过 | Channel 验证通过。 |
| `npm run smoke:codex-plugin` | 通过 | install / stdio / npx runtime 通过；recovery、daemon smoke 按脚本配置跳过。 |
| `npm run check` | 通过 | 额外完整检查通过；Biome 仍输出既有 warnings / infos。 |
| `git diff --check` | 通过 | 父仓库无 whitespace error。 |
| `git -C plugins/alembic-codex diff --check` | 通过 | 嵌套 plugin runtime 仓库无 whitespace error。 |

`npm run lint:repo-boundary` 剩余命中：

- `lib/codex/KnowledgeState.ts`
- `lib/http/routes/daemon.ts`
- `lib/service/cleanup/CleanupService.ts`
- `lib/service/signal/HitRecorder.ts`
- `bin/daemon-server.ts`

这些命中均为既有 DB direct access boundary 问题，不属于本轮三类冗余系统回归；本轮记录为残留阻塞。

## 残留扫描结果

截屏连带能力扫描：

```bash
rg -n "mac_screenshot|mac_window_list|MAC_SCREENSHOT|MAC_WINDOW_LIST|ScreenCaptureService|ScreenCaptureKit|build:screenshot|native-ui/screenshot|screenshotBinaryPath" Alembic AlembicPlugin AlembicCore AlembicAgent AlembicDashboard --glob '!**/node_modules/**' --glob '!**/dist/**'
```

结果：0 命中。

推荐系统扫描：

```bash
rg -n "RecommendationPipeline|RecommendationMetrics|AIRecallStrategy|RuleRecallStrategy|SkillAdvisor|SignalCollector|EventAggregator|recommendationPipeline|recommendationMetrics|feedbackStore|suggestSkills|recordFeedback|skills/suggest|skills/feedback|skills/metrics|signal-status|recipe:get_recommendations|onRecommendation|onRecommendFeedback|pendingSuggestions" Alembic AlembicDashboard AlembicPlugin AlembicAgent AlembicCore --glob '!**/node_modules/**' --glob '!**/dist/**'
```

结果：仅剩允许命中：

- `AlembicPlugin/CHANGELOG.md` 和 `Alembic/CHANGELOG.md` 的历史记录。
- `AlembicCore/src/service/guard/RuleLearner.ts`、vendored Core、Alembic/AlembicPlugin integration tests 中的 `recordFeedback` Guard feedback loop。
- `Alembic/test/integration/SignalIntegration.test.ts` 和 `AlembicPlugin/test/integration/SignalIntegration.test.ts` 中的 Guard feedback 说明。

ReverseGuard 扫描：

```bash
rg -n "ReverseGuard|reverse_audit|guard/report/reverse|reverseGuard|ReverseRecommendation|PatternDriftSignal|ReverseGuardResult|symbol_missing|match_rate_drop" AlembicCore Alembic AlembicDashboard AlembicPlugin AlembicAgent --glob '!**/node_modules/**' --glob '!**/dist/**'
```

结果：仅剩 `Alembic/CHANGELOG.md` 历史记录。

AlembicPlugin package/runtime/channel 面向发布物扫描：

```bash
rg -n "mac_screenshot|mac_window_list|MAC_SCREENSHOT|MAC_WINDOW_LIST|ScreenCaptureService|ScreenCaptureKit|build:screenshot|native-ui/screenshot|screenshotBinaryPath|RecommendationPipeline|RecommendationMetrics|AIRecallStrategy|RuleRecallStrategy|SkillAdvisor|SignalCollector|EventAggregator|recommendationPipeline|recommendationMetrics|feedbackStore|suggestSkills|recordFeedback|skills/suggest|skills/feedback|skills/metrics|signal-status|recipe:get_recommendations|onRecommendation|onRecommendFeedback|pendingSuggestions|ReverseGuard|reverse_audit|guard/report/reverse|reverseGuard|ReverseRecommendation|PatternDriftSignal|ReverseGuardResult|symbol_missing|match_rate_drop" plugins/alembic-codex/runtime plugins/alembic-codex/.codex-plugin plugins/alembic-codex/.mcp.json plugins/alembic-codex/.agents channels .agents package.json package-lock.json README.md README_CN.md --glob '!**/node_modules/**' --glob '!**/.git/**' --glob '!**/dist/**'
```

结果：0 命中。

`runtime.tgz` 内容扫描：

```bash
tar -tzf plugins/alembic-codex/runtime.tgz | rg -n "mac_screenshot|mac_window_list|ScreenCaptureService|ScreenCaptureKit|native-ui/screenshot|RecommendationPipeline|RecommendationMetrics|SkillAdvisor|SignalCollector|EventAggregator|suggestSkills|skills/suggest|skills/feedback|skills/metrics|signal-status|recipe:get_recommendations|ReverseGuard|reverse_audit|guard/report/reverse"
```

结果：0 命中。

vendored Core generated output 扫描：

```bash
find vendor/AlembicCore/dist -type f | rg -n "ReverseGuard|003_add_remote_commands|RecommendationPipeline|SkillAdvisor|SignalCollector"
```

结果：0 命中。

## 遗留风险

- `npm run lint:repo-boundary` 仍因既有 DB direct access boundary violations 失败，需要后续独立阶段处理。
- `CHANGELOG.md` 历史记录保留旧功能名，符合本轮允许命中。
- `RuleLearner.recordFeedback` 属于 Guard feedback loop，不是推荐系统 runtime 回归。
- `smoke:codex-plugin` 的 recovery / daemon smoke 为脚本配置跳过，本轮已覆盖 install / stdio / npx runtime。

## 下一步建议

当前 `AlembicPlugin` Wave 2 代码、vendor、runtime、channel/package-facing 扫描均已收口。建议总控在 `Alembic` 与 `AlembicPlugin` 两侧回填齐全后执行最终跨仓库复核，并将 DB boundary lint 残留拆成单独计划处理。
