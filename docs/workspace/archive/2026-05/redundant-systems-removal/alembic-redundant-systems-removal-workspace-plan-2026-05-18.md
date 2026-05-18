# Alembic redundant systems removal workspace plan

更新日期：2026-05-18

状态：`已完成`

本文件是本轮冗余删除的总控文档，统一指挥 `Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`AlembicAgent` 五个窗口。目标是删除三类已明确判定为冗余的能力：

1. Feishu/Lark remote 删除后遗留的 macOS 截屏连带能力。
2. Skills / Signal / Recipe 推荐系统。
3. ReverseGuard 反向验证能力。

本轮不是继续修改旧迁移文档，也不要把 wave 状态写进 `AGENTS.md`。所有执行记录由各窗口新建到自己的 workspace 文档目录，并从本文件挂载。

## 1. 总控结论

| 领域 | 结论 | 主责仓库 | 依赖顺序 |
| --- | --- | --- | --- |
| 截屏连带能力 | 删除 `mac_screenshot`、`mac_window_list`、ScreenCaptureKit helper、build/package 脚本和相关测试；保留非截屏 macOS/system/permission 能力。 | `Alembic` | Wave 1 可直接启动；Plugin 后续只做负向扫描。 |
| 推荐系统 | 删除 RecommendationPipeline / SignalCollector / SkillAdvisor / feedback/metrics/AI recall/rule recall、HTTP/MCP suggest/feedback/metrics/signal-status、Dashboard 推荐 UI 和 Plugin 兼容空端点。 | `Alembic`、`AlembicDashboard`、`AlembicPlugin` | `Alembic` + `AlembicDashboard` Wave 1，`AlembicPlugin` Wave 2 等待源头完成。 |
| ReverseGuard | 在 `AlembicCore` 删除源头、exports、测试和 ReverseGuard 专属 DecayDetector coupling；在 `Alembic` 删除 MCP/HTTP/DI/schema/tool description/tests/docs 消费；Plugin 通过 vendor 同步收口。 | `AlembicCore`、`Alembic`、`AlembicPlugin` | `AlembicCore` + `Alembic` Wave 1，vendor/plugin 同步 Wave 2。 |
| Agent | 没有发现功能实现；只发现 `SignalCollector` 作为历史注释/分类文案出现。 | `AlembicAgent` | Wave 1 做负向扫描和轻量文案清理。 |

Wave 1 验收与 Wave 2 分派见：[alembic-redundant-systems-wave-1-acceptance-wave-2-plan-2026-05-18.md](alembic-redundant-systems-wave-1-acceptance-wave-2-plan-2026-05-18.md)。

## 2. 代码事实

### 2.1 截屏连带能力

真实实现集中在 `Alembic`：

- `Alembic/lib/tools/adapters/MacSystemAdapter.ts`
  - `mac_window_list` 和 `mac_screenshot` 都通过 `resources/native-ui/screenshot` helper 执行。
  - `mac_permission_status` 当前包含 `screen-recording` 检查，并依赖 helper 是否存在。
- `Alembic/lib/tools/adapters/MacSystemCapabilities.ts`
  - 定义 `MAC_WINDOW_LIST_CAPABILITY`、`MAC_SCREENSHOT_CAPABILITY`，并加入 `MAC_SYSTEM_CAPABILITY_MANIFESTS`。
- `Alembic/lib/platform/ScreenCaptureService.ts`
  - 独立 ScreenCaptureKit 截屏 / 列窗口服务，目前没有发现除自身导出外的生产调用。
- `Alembic/resources/native-ui/screenshot.swift` 和 `Alembic/resources/native-ui/screenshot`
  - ScreenCaptureKit Swift helper 源码和产物。
- `Alembic/package.json`
  - `build:screenshot` 脚本和 package files 中的 screenshot helper。
- `Alembic/test/unit/MacSystemAdapter.test.ts`
  - 覆盖 ScreenCaptureKit / window list / screenshot 行为。

不是本轮目标：

- Dashboard PWA manifest 中的截图资源。
- Plugin marketplace / README / playbook 中用于展示的图片或截图资产。
- Browser / Playwright / 手工验收截图说明。

### 2.2 推荐系统

真实实现集中在 `Alembic` 后端和 `AlembicDashboard` 前端：

- `Alembic/lib/service/skills/RecommendationPipeline.ts`
- `Alembic/lib/service/skills/RecommendationMetrics.ts`
- `Alembic/lib/service/skills/FeedbackStore.ts`
- `Alembic/lib/service/skills/RuleRecallStrategy.ts`
- `Alembic/lib/service/skills/AIRecallStrategy.ts`
- `Alembic/lib/service/skills/SkillAdvisor.ts`
- `Alembic/lib/service/skills/SignalCollector.ts`
- `Alembic/lib/service/skills/EventAggregator.ts`
- `Alembic/lib/service/skills/types.ts`
- `Alembic/lib/injection/modules/AgentModule.ts`
  - 注册 `feedbackStore`、`recommendationPipeline`、`recommendationMetrics`、`_aiRecallStrategy`。
- `Alembic/bin/cli.ts`
  - 仍有被 `if (false as boolean)` 包住的 SignalCollector 启动死代码。
- `Alembic/lib/external/mcp/handlers/skill.ts`
  - `suggestSkills()`、`recordFeedback()`。
- `Alembic/lib/external/mcp/handlers/consolidated.ts`
  - `alembic_skill` 的 `suggest` / `feedback` operation。
- `Alembic/lib/http/routes/skills.ts`
  - `/skills/signal-status`、`/skills/suggest`、`/skills/feedback`、`/skills/metrics`。
- `Alembic/lib/core/gateway/GatewayActionRegistry.ts`
  - `recipe:get_recommendations`。
- `Alembic/test/unit/SkillRecommendation.test.ts`
  - 推荐管线、指标、召回、hook 集成测试。
- `AlembicDashboard/src/api.ts`
  - `suggestSkills()`、`getSignalStatus()`。
- `AlembicDashboard/src/App.tsx`
  - SignalCollector 推荐数量轮询。
- `AlembicDashboard/src/components/Views/SkillsView.tsx`
  - AI 推荐按钮、推荐面板、从推荐创建 Skill。
- `AlembicDashboard/src/i18n/locales/zh.ts`、`AlembicDashboard/src/i18n/locales/en.ts`
  - Skills 推荐文案。
- `AlembicPlugin/lib/http/routes/skills.ts`
  - Plugin 模式保留了 `/skills/suggest`、`/skills/signal-status` 兼容空端点。
- `AlembicPlugin/lib/core/gateway/GatewayActionRegistry.ts`
  - `recipe:get_recommendations`。

谨慎边界：

- `SkillHooks` 本身仍被 Guard、Skill load/create/delete、cold-start/rescan workflow 和 KnowledgeService 使用；只能删除 `onRecommendation`、`onRecommendFeedback` 这类推荐 hook 定义和调用，不能删除整个 `SkillHooks` 系统。
- `RuleLearner.recordFeedback`、`FeedbackCollector`、Guard feedback loop、knowledge usage feedback 不是推荐系统，不能一起删除。
- Dashboard 搜索结果中的 `recommendReason` 是 search/ranking 解释字段，除非代码证明它调用本轮推荐系统，否则暂不作为删除目标。
- `SourceRefReconciler` 的 `source_ref_stale` 是来源引用维护，不等同于 ReverseGuard，不能因为 ReverseGuard 删除而误删。

### 2.3 ReverseGuard

源头在 `AlembicCore`：

- `AlembicCore/src/service/guard/ReverseGuard.ts`
- `AlembicCore/src/service/guard/index.ts`
  - `export * from './ReverseGuard.js'`
- `AlembicCore/src/guard.ts`
  - 公开 guard 说明中把 ReverseGuard 写成稳定闭环。
- `AlembicCore/src/service/evolution/DecayDetector.ts`
  - `symbol_drift` 策略只从 `auditLogs.action like '%ReverseGuard%'` 判断。
- `AlembicCore/src/repository/knowledge/KnowledgeRepository.impl.ts`
  - `findActiveRulesWithContentSync()` / `getGuardHitsSync()` 注释指向 ReverseGuard。
- `AlembicCore/src/repository/code/CodeEntityRepository.ts`
  - `existsByName()` 注释指向 ReverseGuard。
- `AlembicCore/test/unit/ReverseGuard.test.ts`
- `AlembicCore/test/GuardImmuneSystem.test.ts`

消费方在 `Alembic`：

- `Alembic/lib/injection/modules/GuardModule.ts`
  - 注册 `reverseGuard`。
- `Alembic/lib/external/mcp/handlers/guard.ts`
  - `guardReverseAudit()`。
- `Alembic/lib/external/mcp/handlers/consolidated.ts`
  - `operation === 'reverse_audit'` 路由。
- `Alembic/lib/shared/schemas/mcp-tools.ts`
  - `GuardInput.operation` 包含 `reverse_audit`。
- `Alembic/lib/external/mcp/handlers/types.ts`
  - `operation?: 'reverse_audit'`。
- `Alembic/lib/external/mcp/tools.ts`
  - `alembic_guard` tool description 暴露 reverse audit。
- `Alembic/lib/http/routes/guardReport.ts`
  - `/api/v1/guard/report/reverse`。
- `Alembic/test/unit/ReverseGuard.test.ts`
- `Alembic/test/integration/GuardImmuneSystem.test.ts`
- `Alembic/test/integration/cross-module/GuardImmuneWiring.test.ts`
- 当前 README / README_CN 仍有 ReverseGuard 产品描述；CHANGELOG 有历史条目，是否保留按“历史 changelog 可保留事实记录”处理。

Plugin 当前没有发现非 vendor 的 ReverseGuard 实现；后续通过 `vendor/AlembicCore` 和 runtime/package 同步收口。

## 3. 删除边界

### 必须删除

- `mac_screenshot`、`mac_window_list` capability、handler、manifest、测试、native helper、package 脚本和 package files。
- `screen-recording` permission status 中只为截屏 helper 服务的逻辑。
- `RecommendationPipeline`、`RecommendationMetrics`、`FeedbackStore`、`RuleRecallStrategy`、`AIRecallStrategy`、`SkillAdvisor`、`SignalCollector`、`EventAggregator` 及其专属类型/测试/注入。
- Skills 推荐 HTTP/MCP operation：`suggest`、`feedback`、`/skills/suggest`、`/skills/feedback`、`/skills/metrics`、`/skills/signal-status`。
- `recipe:get_recommendations` gateway action。
- Dashboard Skills 推荐按钮、推荐面板、SignalCollector polling、推荐 i18n 文案和 API client。
- ReverseGuard 源码、exports、测试、DI、MCP operation、HTTP route、schema、tool description、当前产品文档。
- Core / Agent 中只作为历史残留的 `SignalCollector`、`SkillAdvisor`、`EventAggregator`、`ReverseGuard` 注释或 logger tag。

### 必须保留

- `mac_system_info` 和非截屏的 macOS system/permission 能力。
- Alembic terminal、sandbox、native/IDE、daemon、HTTP、Dashboard 托管能力。
- `SkillHooks` 非推荐生命周期 hook：`onGuardCheck`、`onSkillLoad`、`onSkillCreated`、`onSkillExpired`、bootstrap/rescan hooks。
- 手动 Skill list/load/create/update/delete 和手动 AI 生成 Skill 内容能力，除非其唯一入口依赖推荐面板。
- Guard 正向检查、review、coverage matrix、compliance report、RuleLearner、GuardFeedbackLoop、CoverageAnalyzer、UncertaintyCollector。
- SourceRefReconciler 和 `source_ref_stale` 来源引用维护链路。
- Plugin marketplace / manifest / playbook 用于展示的截图资产。
- 历史 changelog 可保留事实记录；当前 README、help、API description 和用户可见入口必须清掉。

## 4. 分波节奏

### Wave 1：源头删除与直接消费方清理

可同时启动窗口：`Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicAgent`。

`AlembicPlugin` 暂不启动实现，只保持阻塞/观察，等待 Wave 1 提交后同步 vendor/runtime。

Wave 1 完成标准：

- `AlembicCore` 不再导出或测试 ReverseGuard。
- `Alembic` 不再有截屏 tool、推荐 runtime、ReverseGuard 消费入口。
- `AlembicDashboard` 不再调用 `/skills/suggest` 或 `/skills/signal-status`，也不展示 Skills 推荐 UI。
- `AlembicAgent` 证明没有推荐/ReverseGuard/截屏功能实现；如果只有注释残留，改成通用表述并记录。

### Wave 2：vendor、Plugin、runtime 和发布链路收口

可启动窗口：`Alembic`、`AlembicPlugin`。

启动条件：

- Wave 1 的 `AlembicCore`、`AlembicDashboard`、`Alembic` 均回填提交 hash 和验证结果。

Wave 2 完成标准：

- `Alembic/vendor/AlembicCore`、`Alembic/vendor/AlembicDashboard` 同步到 Wave 1 提交。
- `AlembicPlugin/vendor/AlembicCore`、`AlembicPlugin/vendor/AlembicDashboard` 同步到 Wave 1 提交。
- `AlembicPlugin` 删除 Plugin 兼容空推荐端点、`recipe:get_recommendations` 和打包产物中的相关残留。
- Codex plugin runtime、channel、tarball、smoke 和 boundary report 都不携带三类冗余能力。

### Wave 3：总控验收

总控窗口读取各仓库回填，执行跨仓库负向扫描和必要的构建/验证摘要。Wave 3 不再新增功能，只处理残留和验收。

## 5. 窗口分派

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | `已完成` | Wave 1 已验收通过；Wave 2 已同步 Core/Dashboard vendor 并复验三类冗余能力无入口。 | 已新建 | `docs/Alembic/alembic-redundant-systems-removal-wave-1-2026-05-18.md`；Wave 2 `docs/Alembic/alembic-redundant-systems-vendor-sync-wave-2-2026-05-18.md` | 本文件第 5 节；Wave 2 分派文档第 4 节 | 本文件第 9.1 节；Wave 2 分派文档第 6.1 节 | `npm run build:check`、`npm run build`、`npm run check`、`npm run build:dashboard`、三组负向扫描；`npm run lint:repo-boundary` 已记录既有 DB boundary 阻塞。 | 已完成，提交 `ea816fcba9934dcf2bad942cb8424459c0e46455`。 |
| `AlembicCore` | `已完成` | 已删除 ReverseGuard 源头、exports、测试和 DecayDetector 的 ReverseGuard 专属 `symbol_drift` 入口；已清理只指向 ReverseGuard/推荐旧名的注释或 logger tag。 | 已新建 | `docs/AlembicCore/alembic-reverseguard-removal-wave-1-2026-05-18.md` | 本文件第 5 节 | 本文件第 9.2 节 | `npm run build:check`、`npm run test`、`npm run check`、`npm run build`、`npm run smoke:public-api`、负向扫描 | 已完成；等待 Alembic 删除消费入口，Wave 2 再由外层同步 vendor。 |
| `AlembicDashboard` | `已完成` | 已删除 Skills 推荐 UI/API/polling/i18n；保留手动 Skills 管理、手动创建、搜索解释字段和非推荐 Dashboard 能力。 | 已新建 | `docs/AlembicDashboard/alembic-skill-recommendation-ui-removal-wave-1-2026-05-18.md` | 本文件第 5 节 | 本文件第 9.3 节 | `npm run build`；Dashboard-local 三组负向扫描；targeted 推荐入口扫描；`git diff --check` | 已完成；等待 Wave 2 外层仓库同步 Dashboard vendor。 |
| `AlembicAgent` | `已完成` | 已完成负向扫描；确认没有截屏、推荐系统、ReverseGuard 实现；唯一 `SignalCollector` 历史注释已改成通用 system/agent 表述。 | 新建 | `docs/AlembicAgent/alembic-redundant-systems-negative-scan-2026-05-18.md` | 本文件第 5 节 | 本文件第 9.4 节 | `npm run build`；三组负向扫描 | 已完成，提交 `cbd7477462bd85f7490df4b8d6832deb8d3860fe`。 |
| `AlembicPlugin` | `已完成` | Wave 2 vendor/runtime/package/channel 收口已验收通过；Plugin 发布面无三类冗余能力入口残留。 | 已新建 | `docs/AlembicPlugin/alembic-redundant-systems-vendor-runtime-sweep-wave-2-2026-05-18.md` | 本文件第 5 节；Wave 2 分派文档第 4 节 | 本文件第 9.5 节；Wave 2 分派文档第 6.2 节 | build/check、agent boundary report、Codex plugin/channel verify、smoke 通过；`npm run lint:repo-boundary` 仍为既有 DB boundary 阻塞。 | 提交 `12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`；runtime 提交 `422e53d5294aa95a1254ff72cbe83eb1c449932d`。 |

## 6. 各窗口执行细则

### 6.1 Alembic

先做本仓库本地删除，不要在 Wave 1 修改 `vendor/AlembicCore` 或 `vendor/AlembicDashboard` 指针。

删除截屏连带能力：

- 从 `MacSystemCapabilities.ts` 移除 `MAC_WINDOW_LIST_CAPABILITY`、`MAC_SCREENSHOT_CAPABILITY` 和 manifest 注册。
- 从 `MacSystemAdapter.ts` 移除 `mac_window_list` / `mac_screenshot` handler、helper path、ScreenCaptureKit helper 调用、screen-recording helper 检查；保留 `mac_system_info` 和非截屏 permission status。
- 删除 `ScreenCaptureService.ts`、`resources/native-ui/screenshot.swift`、`resources/native-ui/screenshot`、`build:screenshot` 和 package files 条目。
- 更新/删除 `MacSystemAdapter.test.ts` 中截屏/window list 测试，只保留系统信息和非截屏权限测试。

删除推荐系统：

- 删除 recommendation / signal / advisor / feedback / metrics / recall / aggregator 源文件和测试。
- 从 `AgentModule.ts`、CLI dead code、ServiceMap、相关 imports 中移除推荐注册。
- 从 `skill.ts`、`consolidated.ts`、schema/types 和 HTTP routes 中移除 `suggest` / `feedback` / `signal-status` / `metrics`。
- 删除 `recipe:get_recommendations` gateway action。
- 保留 manual Skill CRUD、SkillHooks 非推荐 hook、Knowledge usage feedback 和 Guard feedback。

删除 ReverseGuard 消费：

- 从 `GuardModule.ts` 删除 `reverseGuard` singleton 和 import。
- 从 MCP guard handler、consolidated route、schema/types、tool description 移除 `reverse_audit`。
- 删除 `/api/v1/guard/report/reverse` endpoint。
- 删除 Alembic 侧 ReverseGuard 测试和 GuardImmuneWiring 中仅验证 ReverseGuard 的 case。
- 更新当前 README/README_CN 中 ReverseGuard 产品描述；历史 changelog 可作为历史记录保留但要在执行文档说明。

Wave 2：

- 等 `AlembicCore` 与 `AlembicDashboard` 提交后同步 vendor 指针。
- 运行完整 build/check 和 Dashboard build。

### 6.2 AlembicCore

删除源头：

- 删除 `src/service/guard/ReverseGuard.ts` 和 `test/unit/ReverseGuard.test.ts`。
- 从 `src/service/guard/index.ts` 和 public guard docs 中移除 ReverseGuard export / 稳定闭环描述。
- 从 `test/GuardImmuneSystem.test.ts` 删除 ReverseGuard e2e case；保留 RuleLearner、GuardCheckEngine、CoverageAnalyzer 等正向 Guard 测试。
- 从 `DecayDetector` 删除只依赖 ReverseGuard audit log 的 `symbol_drift` 策略与 helper；保留 `source_ref_stale` 策略。
- 清理 repository 注释、logger tag 中只指向 ReverseGuard / SignalCollector / SkillAdvisor / EventAggregator 的历史名称。

### 6.3 AlembicDashboard

删除推荐 UI：

- 删除 `api.suggestSkills()` 和 `api.getSignalStatus()`。
- 删除 App 级 SignalCollector 推荐数量 state、polling 和传参。
- 删除 SkillsView 的推荐按钮、推荐面板、从推荐创建 Skill 的状态与流程。
- 删除 i18n 中 `aiRecommend*`、`noRecommendations` 等 Skills 推荐文案。
- 保留 Skills list/load/create/update/delete、manual Add Skill、搜索面板和 search result `recommendReason`。

### 6.4 AlembicAgent

本仓库没有发现三类功能实现。需要执行：

- 扫描 `SignalCollector|SkillAdvisor|RecommendationPipeline|ReverseGuard|reverse_audit|mac_screenshot|mac_window_list|ScreenCaptureKit`。
- 如果只有注释残留，例如 `ConversationStore` 中 `system(SignalCollector)`，改成不指向已删除系统的通用描述。
- 不要新增推荐、截屏或 ReverseGuard adapter。

### 6.5 AlembicPlugin

Wave 2 执行：

- 同步 `vendor/AlembicCore` 和 `vendor/AlembicDashboard` 到 Wave 1 提交。
- 删除 `lib/http/routes/skills.ts` 中 `/skills/suggest`、`/skills/signal-status` 兼容空端点。
- 删除 `lib/core/gateway/GatewayActionRegistry.ts` 中 `recipe:get_recommendations`。
- 检查 MCP schemas / skill docs / plugin assets / channel package / embedded runtime 中是否仍有推荐、ReverseGuard、ScreenCaptureKit 能力入口。
- 重新生成/同步 Codex plugin runtime 后运行插件验证。

## 7. 负向扫描

执行窗口完成后至少运行以下扫描，并把输出摘要回填到自己的执行文档。

截屏连带能力：

```bash
rg -n "mac_screenshot|mac_window_list|MAC_SCREENSHOT|MAC_WINDOW_LIST|ScreenCaptureService|ScreenCaptureKit|build:screenshot|native-ui/screenshot|screenshotBinaryPath" Alembic AlembicPlugin AlembicCore AlembicAgent AlembicDashboard --glob '!**/node_modules/**' --glob '!**/dist/**'
```

推荐系统：

```bash
rg -n "RecommendationPipeline|RecommendationMetrics|AIRecallStrategy|RuleRecallStrategy|SkillAdvisor|SignalCollector|EventAggregator|recommendationPipeline|recommendationMetrics|feedbackStore|suggestSkills|recordFeedback|skills/suggest|skills/feedback|skills/metrics|signal-status|recipe:get_recommendations|onRecommendation|onRecommendFeedback|pendingSuggestions" Alembic AlembicDashboard AlembicPlugin AlembicAgent AlembicCore --glob '!**/node_modules/**' --glob '!**/dist/**'
```

ReverseGuard：

```bash
rg -n "ReverseGuard|reverse_audit|guard/report/reverse|reverseGuard|ReverseRecommendation|PatternDriftSignal|ReverseGuardResult|symbol_missing|match_rate_drop" AlembicCore Alembic AlembicDashboard AlembicPlugin AlembicAgent --glob '!**/node_modules/**' --glob '!**/dist/**'
```

允许命中必须逐条解释：

- 历史 changelog 的事实记录。
- 本总控文档和各执行文档。
- 非功能截图资产，如 marketplace / manifest screenshots。
- 非推荐系统的搜索解释字段，如 `recommendReason`。
- 非 ReverseGuard 的 `source_ref_stale` 来源引用维护链路。

当前产品文档、源码、测试、API schema、runtime package 和 channel 产物不允许保留功能入口。

## 8. 验收门槛

总控验收时检查：

- 五个窗口均有状态：`已完成`、`无任务` 或明确 `阻塞` 已解除。
- 每个执行窗口都回填提交 hash、完成范围、验证命令和负向扫描摘要。
- `AlembicPlugin` 只能在 Wave 1 源头完成后进入 Wave 2。
- `Alembic` 和 `AlembicPlugin` 的 vendor 指针都指向删除后的 Core/Dashboard 提交。
- 推荐系统删除后，Skills 手动管理仍可用。
- ReverseGuard 删除后，Guard check/review/coverage/compliance report 仍可用。
- 截屏删除后，非截屏 mac system capability 仍可用或明确被同窗口证据证明无剩余生产入口。

## 9. 回填区

### 9.1 Alembic 回填

状态：`Wave 1 已验收通过；Wave 2 已完成`

- Wave 1 文档：`docs/Alembic/alembic-redundant-systems-removal-wave-1-2026-05-18.md`
- Wave 1 提交：`2d04d4c04dde46f74160b89fee71f42cd2249791`
- Wave 1 验证：`npm run build:check` 通过；`npm run test:unit -- test/unit/MacSystemAdapter.test.ts` 通过（1 file / 3 tests）；`./node_modules/.bin/vitest run test/integration/GuardImmuneSystem.test.ts test/integration/cross-module/GuardImmuneWiring.test.ts test/integration/ZodSchemas.test.ts` 通过（3 files / 77 tests）；`git diff --check` 通过；`npm run build` 通过；`npm run check` 通过；`npm run lint:repo-boundary` 已运行但因既有 6 处 DB boundary violations 失败。
- Wave 2 文档：`docs/Alembic/alembic-redundant-systems-vendor-sync-wave-2-2026-05-18.md`
- Wave 2 提交：`ea816fcba9934dcf2bad942cb8424459c0e46455`
- Wave 2 验证：`npm run build:check` 通过；`npm run build` 通过；`npm ci --prefix vendor/AlembicDashboard` 通过；`npm run build:dashboard` 通过；`npm run check` 通过；`git diff --check` 通过；`npm run lint:repo-boundary` 已运行但因既有 6 处 DB boundary violations 失败。
- 残留/阻塞：Alembic 本仓库截屏连带能力扫描无命中；推荐系统扫描仅剩 `CHANGELOG.md` 历史记录和 `RuleLearner.recordFeedback` / Guard feedback 边界；ReverseGuard 扫描仅剩 `CHANGELOG.md` 历史记录。工作区代码扫描中截屏连带能力无命中，推荐系统仅剩历史 changelog 与 Guard feedback 边界，ReverseGuard 仅剩 `Alembic/CHANGELOG.md` 历史记录。`npm run lint:repo-boundary` 仍被既有 `lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`bin/daemon-server.ts` DB boundary violations 阻塞。

### 9.2 AlembicCore 回填

状态：`已完成`

- 文档：`docs/AlembicCore/alembic-reverseguard-removal-wave-1-2026-05-18.md`
- 完成范围：删除 `src/service/guard/ReverseGuard.ts`、`test/unit/ReverseGuard.test.ts`、Guard barrel export 和 GuardImmuneSystem ReverseGuard e2e case；删除 DecayDetector `symbol_drift` / audit log 查询 / Drizzle coupling；清理 repository 注释和 logger tag 中的 `ReverseGuard`、`SignalCollector`、`SkillAdvisor`、`EventAggregator` 历史名称；清理本地 ignored `dist/service/guard/ReverseGuard.*` stale 产物。
- 提交：`92ccd10baad1eac5fcfe3b4d4c8191a02042da04`
- 验证：`npm run build:check` 通过；`npm test -- DecayDetector GuardImmuneSystem` 通过，2 files / 19 tests；`npm run test` 通过，59 files / 916 tests，保留既有非阻塞 stderr `error: Could not access 'HEAD'`；`npm run check` 通过；`npm run build` 通过；`npm run smoke:public-api` 通过，73 个 exact public API entrypoints 可导入；`git diff --check` 通过。
- 残留扫描结果：截屏连带能力扫描 0 命中；ReverseGuard 扫描 0 命中；`dist/service/guard/*ReverseGuard*` 0 命中；推荐系统扫描仅剩 `RuleLearner.recordFeedback` 在 `src` / `dist` / `test` 中的 Guard feedback loop 命中，按本文件第 2.2 / 第 3 节属于必须保留项。
- 残留/阻塞：等待 `Alembic` 删除 ReverseGuard 消费入口；等待 Wave 2 外层仓库同步 vendor Core。`@alembic/core/service/guard/*` wildcard 下已删除的 `ReverseGuard` 子路径会失败，这是预期删除结果。

### 9.3 AlembicDashboard 回填

状态：`已完成`

- 文档：`docs/AlembicDashboard/alembic-skill-recommendation-ui-removal-wave-1-2026-05-18.md`
- 完成范围：删除 `src/api.ts` 中 `suggestSkills()` / `getSignalStatus()`；删除 `src/App.tsx` SignalCollector 推荐数量 state、polling 和传参；删除 `src/components/Layout/Sidebar.tsx` Skills 推荐数量徽标；删除 `src/components/Views/SkillsView.tsx` AI 推荐按钮、推荐面板、推荐状态、自动推荐加载和从推荐创建 Skill 流程；删除中英文 Skills 推荐 i18n 与 `get_recommendations` tool operation 文案；保留手动 Skills 管理、手动 Add Skill、手动 AI 生成 Skill 内容、搜索面板和 `recommendReason` 搜索解释字段。
- 提交：`7143a7ca610a504b7472ae4afac0eb2df2ebdda8`
- 验证：`npm run build` 通过，Vite 仅保留既有 large chunk warning；`git diff --check` 通过；Dashboard-local 截屏连带能力、推荐系统、ReverseGuard 三组严格负向扫描均 0 命中；targeted 推荐入口扫描 `suggestSkills|getSignalStatus|signalSuggestionCount|aiRecommend|noRecommendations|get_recommendations|skills/suggest|signal-status|pendingSuggestions` 0 命中。
- 残留扫描结果：宽松 `recommend|suggestion` 扫描仅剩 Guard 修复建议文案、搜索解释字段 `recommendReason`、Wiki/AI Chat/架构分析/低置信度提示中的通用英文文案；均不包含 Skills 推荐 UI、推荐 API、SignalCollector polling、推荐面板或推荐创建流程。
- 残留/阻塞：Dashboard 源头删除已完成；等待 Wave 2 由 `Alembic` / `AlembicPlugin` 同步 vendored Dashboard 到本提交并删除自身兼容入口。`recommendReason` 作为搜索解释字段按本文件第 2.2 / 第 7 节保留。

### 9.4 AlembicAgent 回填

状态：`已完成`

- 文档：`docs/AlembicAgent/alembic-redundant-systems-negative-scan-2026-05-18.md`
- 完成范围：执行截屏连带能力、推荐系统、ReverseGuard 三组负向扫描；确认 `AlembicAgent` 没有三类功能实现、adapter、runtime 入口或 public contract；将 `src/agent/context/ConversationStore.ts` 中唯一 `SignalCollector` 历史注释改成通用 `system(agent runtime)` 表述。
- 提交：`cbd7477462bd85f7490df4b8d6832deb8d3860fe`
- 验证：`npm run build` 通过；`git diff --check` 通过。
- 残留扫描结果：推荐系统扫描 0 命中；截屏连带能力扫描 0 命中；ReverseGuard 扫描 0 命中；允许命中无。
- 残留/阻塞：`AlembicAgent` 无残留、无阻塞。其它仓库源头删除、vendor 同步和跨仓库总体验收仍按各自窗口回填推进。

### 9.5 AlembicPlugin 回填

状态：`已完成`

- 文档：`docs/AlembicPlugin/alembic-redundant-systems-vendor-runtime-sweep-wave-2-2026-05-18.md`
- 提交：`12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`；嵌套 runtime 提交 `422e53d5294aa95a1254ff72cbe83eb1c449932d`。
- 验证：`npm run build:check`、`npm run build`、`npm run report:agent-extraction-boundary`、`npm run build:dashboard`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run smoke:codex-plugin`、`npm run check`、`git diff --check`、`git -C plugins/alembic-codex diff --check` 通过；`npm run lint:repo-boundary` 仍为既有 DB boundary 阻塞。
- 残留/阻塞：Plugin 发布面、runtime、runtime tarball、channel/package-facing 扫描 0 命中；唯一阻塞是既有 DB boundary lint，需后续独立计划处理。

## 10. 可复制提示词

本轮已完成，无需继续派发；以下提示词作为历史执行入口保留。

```text
读取 docs/workspace/alembic-redundant-systems-wave-1-acceptance-wave-2-plan-2026-05-18.md，按照文档领取并完成你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令和残留扫描结果。
```
