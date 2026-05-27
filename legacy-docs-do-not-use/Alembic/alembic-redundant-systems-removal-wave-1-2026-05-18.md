# Alembic redundant systems removal Wave 1

日期：2026-05-18

状态：`已完成`

提交：`2d04d4c04dde46f74160b89fee71f42cd2249791`

## 完成范围

Wave 1 只处理 `Alembic` 本仓库本地代码，未修改 `vendor/AlembicCore` 或 `vendor/AlembicDashboard` 指针。

已删除 macOS 截屏连带能力：

- 从 `MacSystemCapabilities.ts` 移除 `mac_window_list` / `mac_screenshot` capability manifest。
- 从 `MacSystemAdapter.ts` 移除 ScreenCaptureKit helper 路径、window list、screenshot、artifact 写入和 screen-recording helper 检查。
- 删除 `lib/platform/ScreenCaptureService.ts`。
- 删除 `resources/native-ui/screenshot.swift`，并从 `package.json` 删除 `build:screenshot` 与 package files 条目。
- 更新 `MacSystemAdapter.test.ts`，仅保留 system info、非截屏 permission status、未知 capability blocking。

已删除 Skills / Signal / Recipe 推荐系统：

- 删除 `RecommendationPipeline`、`RecommendationMetrics`、`FeedbackStore`、`RuleRecallStrategy`、`AIRecallStrategy`、`SkillAdvisor`、`SignalCollector`、`EventAggregator` 源文件和 `SkillRecommendation.test.ts`。
- 从 `AgentModule.ts` 删除 `feedbackStore`、`recommendationPipeline`、`recommendationMetrics`、`_aiRecallStrategy` 注册。
- 从 CLI 删除 disabled SignalCollector dead code。
- 从 MCP / HTTP 删除 `suggest`、`feedback`、`signal-status`、`metrics` 入口。
- 从 gateway 删除 `recipe:get_recommendations`。
- 从 `SkillHooks` 删除 `onRecommendation`、`onRecommendFeedback`、`onSignalCollected` 等推荐 hook。

已删除 ReverseGuard 消费入口：

- 从 `GuardModule.ts` 删除 `reverseGuard` singleton。
- 从 MCP guard handler、consolidated handler、schema/types、tool description 删除 `reverse_audit`。
- 删除 `/api/v1/guard/report/reverse` endpoint。
- 删除 Alembic 侧 ReverseGuard 测试，并从 Guard integration / wiring 测试移除 ReverseGuard case。
- 更新当前 README / README_CN 的 Guard 产品描述，保留正向 Guard check/review/coverage/compliance。

明确保留边界：

- `mac_system_info`、`mac_permission_status` 的 accessibility / automation / all。
- 手动 Skill list/load/create/update/delete。
- `SkillHooks` 的非推荐生命周期。
- `RuleLearner.recordFeedback`、Guard feedback loop、knowledge usage feedback。
- Guard check/review/coverage/compliance report。

## 验证命令

已通过：

- `npm run build:check`
- `npm run test:unit -- test/unit/MacSystemAdapter.test.ts`：1 file / 3 tests passed。
- `./node_modules/.bin/vitest run test/integration/GuardImmuneSystem.test.ts test/integration/cross-module/GuardImmuneWiring.test.ts test/integration/ZodSchemas.test.ts`：3 files / 77 tests passed。
- `git diff --check`
- `npm run build`
- `npm run check`

已运行但存在既有阻塞：

- `npm run lint:repo-boundary`
  - 失败原因是既有 repository boundary violations，不属于本轮删除新增：
    - `lib/http/routes/daemon.ts:37`
    - `lib/service/cleanup/CleanupService.ts:504`
    - `lib/service/cleanup/CleanupService.ts:509`
    - `lib/service/cleanup/CleanupService.ts:870`
    - `lib/service/signal/HitRecorder.ts:185`
    - `bin/daemon-server.ts:318`

## 残留扫描结果

Alembic 本地源码/测试/README/package 扫描：

- 截屏连带能力扫描：无命中。
- ReverseGuard 扫描：无命中。
- 推荐系统扫描：仅命中以下允许保留的 Guard feedback 边界：
  - `test/integration/GuardImmuneSystem.test.ts:128`：`learner.recordFeedback(...)`
  - `test/integration/SignalIntegration.test.ts:7`：`RuleLearner.recordFeedback()` 测试说明

Alembic 全仓库扫描，排除 `node_modules` / `dist` / docs：

- 截屏连带能力：无命中。
- 推荐系统：
  - `CHANGELOG.md` 历史记录命中，允许保留。
  - 本地 `RuleLearner.recordFeedback` 测试边界命中，允许保留。
  - `vendor/AlembicCore` 仍有旧 logger/comment 命中，等待 Wave 2 vendor sync。
  - `vendor/AlembicDashboard` 仍有旧推荐 UI/API 命中，等待 Wave 2 vendor sync。
- ReverseGuard：
  - `CHANGELOG.md` 历史记录命中，允许保留。
  - `vendor/AlembicCore` 仍有旧 ReverseGuard 源码/测试命中，等待 Wave 2 vendor sync。

## 遗留风险和下一步

- Wave 2 需要在 `AlembicCore` 与 `AlembicDashboard` 源仓库完成并确认提交后，同步 `vendor/AlembicCore` / `vendor/AlembicDashboard` 指针。
- Wave 2 同步后需要重新运行 `npm run build:check`、`npm run build`、`npm run check`、`npm run build:dashboard` 和三组负向扫描。
- `npm run lint:repo-boundary` 仍被既有 DB boundary violations 阻塞；本轮未扩大该问题。
