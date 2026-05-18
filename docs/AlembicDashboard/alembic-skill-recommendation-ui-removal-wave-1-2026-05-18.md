# AlembicDashboard Skills recommendation UI removal Wave 1

执行日期：2026-05-18

来源总控：`docs/workspace/alembic-redundant-systems-removal-workspace-plan-2026-05-18.md`

状态：`已完成`

## 完成范围

- 删除 `src/api.ts` 中的 `suggestSkills()` 和 `getSignalStatus()` API client。
- 删除 `src/App.tsx` 中的 SignalCollector 推荐数量 state、轮询和 Sidebar / SkillsView 传参。
- 删除 `src/components/Layout/Sidebar.tsx` 中 Skills 导航推荐数量徽标。
- 删除 `src/components/Views/SkillsView.tsx` 中 AI 推荐按钮、推荐面板、推荐状态、自动加载推荐、从推荐创建 Skill 流程。
- 删除 `src/i18n/locales/zh.ts` 和 `src/i18n/locales/en.ts` 中 Skills 推荐文案、`get_recommendations` tool operation 文案，并把内置 Agent 职责从 Skills 推荐改为 Skills 管理/手动维护。
- 保留手动 Skills list/load/create/update/delete、手动 Add Skill、AI 手动生成 Skill 内容、搜索面板和搜索结果 `recommendReason` 解释字段。

## 提交

- `7143a7ca610a504b7472ae4afac0eb2df2ebdda8` - `Remove skills recommendation UI`

## 验证命令和结果

- `npm run build`
  - 通过。`tsc && vite build` 成功，Vite 仅保留既有 large chunk warning。
- `git diff --check`
  - 通过，无 whitespace/error 输出。
- `rg -n 'mac_screenshot|mac_window_list|MAC_SCREENSHOT|MAC_WINDOW_LIST|ScreenCaptureService|ScreenCaptureKit|build:screenshot|native-ui/screenshot|screenshotBinaryPath' . --glob '!**/node_modules/**' --glob '!**/dist/**'`
  - 0 命中。
- `rg -n 'RecommendationPipeline|RecommendationMetrics|AIRecallStrategy|RuleRecallStrategy|SkillAdvisor|SignalCollector|EventAggregator|recommendationPipeline|recommendationMetrics|feedbackStore|suggestSkills|recordFeedback|skills/suggest|skills/feedback|skills/metrics|signal-status|recipe:get_recommendations|onRecommendation|onRecommendFeedback|pendingSuggestions' . --glob '!**/node_modules/**' --glob '!**/dist/**'`
  - 0 命中。
- `rg -n 'ReverseGuard|reverse_audit|guard/report/reverse|reverseGuard|ReverseRecommendation|PatternDriftSignal|ReverseGuardResult|symbol_missing|match_rate_drop' . --glob '!**/node_modules/**' --glob '!**/dist/**'`
  - 0 命中。
- `rg -n 'suggestSkills|getSignalStatus|signalSuggestionCount|aiRecommend|noRecommendations|get_recommendations|skills/suggest|signal-status|pendingSuggestions' src --glob '!**/dist/**'`
  - 0 命中。

## 残留扫描结果

严格扫描下，Dashboard 内截屏连带能力、推荐系统和 ReverseGuard 均为 0 命中。

宽松 `recommend|suggestion` 扫描仍有允许命中：

- Guard 修复建议文案：`fixSuggestion`、`copyFixSuggestion`。
- 搜索解释字段：`recommendReason`，按总控边界保留。
- 通用英文文案：Wiki 过期提示中的 `recommended`、AI Chat 的 `recommend patterns`、架构分析的 `provide suggestions`、低置信度提示的 `observation recommended`。

这些残留均不包含 Skills 推荐 UI、推荐 API、SignalCollector polling、推荐面板或推荐创建流程。

## 遗留风险

- `recommendReason` 是搜索结果解释字段，按本轮边界保留；如果后续总控使用更宽泛的 `recommend` 扫描，需要继续作为允许命中说明。
- 手动 AI 生成 Skill 内容仍保留，这是手动创建能力，不属于推荐系统。
- `AlembicPlugin` 和外层 vendor/runtime 仍需在 Wave 2 同步本提交并删除自身兼容空端点。

## 下一步建议

- `AlembicPlugin` Wave 2 等待 `Alembic`、`AlembicCore`、`AlembicDashboard` Wave 1 提交齐全后，同步 vendored Dashboard 到本提交。
- 总控 Wave 3 做跨仓库负向扫描时，把本文件和总控文档中的历史记录类命中列入允许命中。
