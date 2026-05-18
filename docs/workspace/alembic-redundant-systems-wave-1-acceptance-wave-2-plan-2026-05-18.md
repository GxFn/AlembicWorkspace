# Alembic redundant systems Wave 1 acceptance and Wave 2 plan

更新日期：2026-05-18

状态：`已完成`

本文件是 `docs/workspace/alembic-redundant-systems-removal-workspace-plan-2026-05-18.md` 的 Wave 1 总控验收与 Wave 2 执行分派。Wave 1 已完成源码源头删除；Wave 2 只允许 `Alembic` 和 `AlembicPlugin` 启动 vendor/runtime/package/channel 收口。

## 1. Wave 1 验收结论

结论：`Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicAgent` Wave 1 验收通过。

| 窗口 | 结论 | 提交 | 验收要点 |
| --- | --- | --- | --- |
| `Alembic` | 通过 | `2d04d4c04dde46f74160b89fee71f42cd2249791` | 本地代码已删除 macOS 截屏 tool、推荐 runtime/API/MCP/gateway、ReverseGuard 消费入口；未修改 vendor 指针。 |
| `AlembicCore` | 通过 | `92ccd10baad1eac5fcfe3b4d4c8191a02042da04` | ReverseGuard 源头、export、测试和 DecayDetector 的 ReverseGuard 专属 `symbol_drift` coupling 已删除。 |
| `AlembicDashboard` | 通过 | `7143a7ca610a504b7472ae4afac0eb2df2ebdda8` | Skills 推荐 UI/API/polling/i18n 已删除；手动 Skills 管理和搜索解释字段保留。 |
| `AlembicAgent` | 通过 | `cbd7477462bd85f7490df4b8d6832deb8d3860fe` | 无三类功能实现；唯一 `SignalCollector` 历史注释已改成通用表述。 |

## 2. 总控复核

复核源码范围：

- `Alembic/lib`、`Alembic/bin`、`Alembic/resources`、`Alembic/package.json`、`Alembic/test`、`Alembic/README.md`、`Alembic/README_CN.md`
- `AlembicCore/src`、`AlembicCore/test`
- `AlembicDashboard/src`
- `AlembicAgent/src`

复核结果：

- 截屏连带能力关键词：0 命中。
- ReverseGuard 关键词：0 命中。
- 推荐系统关键词：仅剩允许保留的 Guard feedback 边界：
  - `AlembicCore/src/service/guard/RuleLearner.ts` 的 `recordFeedback`
  - `AlembicCore/test/GuardImmuneSystem.test.ts` 的 `RuleLearner.recordFeedback` 测试
  - `Alembic/test/integration/GuardImmuneSystem.test.ts` 的 `RuleLearner.recordFeedback` 测试
  - `Alembic/test/integration/SignalIntegration.test.ts` 的 Guard signal 测试说明

文件存在性复核：

- `Alembic/lib/platform/ScreenCaptureService.ts` 不存在。
- `AlembicCore/src/service/guard/ReverseGuard.ts` 不存在。
- `AlembicDashboard/src` 中 `suggestSkills|getSignalStatus|signalSuggestionCount|aiRecommend|noRecommendations|get_recommendations|skills/suggest|signal-status|pendingSuggestions` 0 命中。

## 3. Wave 2 边界收口

Wave 2 启动时的剩余残留均为预期项，当前已由第 6.1 / 6.2 节回填关闭：

- `Alembic/vendor/AlembicCore` 已从旧提交 `0c64fd7549d58ceded8eed163dae85c6678ea679` 同步到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`。
- `Alembic/vendor/AlembicDashboard` 已从旧提交 `32b2e01c249665e3dc33bdcffbfc39b648d0426d` 同步到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。
- `AlembicPlugin/vendor/AlembicCore` 已从旧提交 `0c64fd7549d58ceded8eed163dae85c6678ea679` 同步到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`。
- `AlembicPlugin/vendor/AlembicDashboard` 已从旧提交 `32b2e01c249665e3dc33bdcffbfc39b648d0426d` 同步到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。
- `AlembicPlugin/lib/http/routes/skills.ts` 中 `/skills/suggest` 和 `/skills/signal-status` 兼容空端点已删除。
- `AlembicPlugin/lib/core/gateway/GatewayActionRegistry.ts` 中 `recipe:get_recommendations` 已删除。
- `AlembicPlugin/CHANGELOG.md` 的历史记录允许保留；runtime、channel、package-facing 文档和源码已复扫确认无功能入口残留。

## 4. Wave 2 分派

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | `已完成` | 已同步 `vendor/AlembicCore` 到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`，同步 `vendor/AlembicDashboard` 到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`；复验 vendor 后无三类功能入口。 | 已新建 | `docs/Alembic/alembic-redundant-systems-vendor-sync-wave-2-2026-05-18.md` | 本文件第 4 节 | 原总控第 9.1 节和本文件第 6.1 节 | `npm run build:check`、`npm run build`、`npm run check`、`npm run build:dashboard`、三组负向扫描；`npm run lint:repo-boundary` 已记录既有 DB boundary 阻塞。 | 已完成，提交 `ea816fcba9934dcf2bad942cb8424459c0e46455`。 |
| `AlembicPlugin` | `已完成` | 已同步 `vendor/AlembicCore` / `vendor/AlembicDashboard` 到 Wave 1 提交；已删除 `/skills/suggest`、`/skills/signal-status` 兼容空端点和 `recipe:get_recommendations`；已刷新 Codex runtime/tarball 并复验 package/channel/runtime 扫描。 | 已新建 | `docs/AlembicPlugin/alembic-redundant-systems-vendor-runtime-sweep-wave-2-2026-05-18.md` | 本文件第 4 节 | 原总控第 9.5 节和本文件第 6.2 节 | `npm run build:check`、`npm run build`、`npm run report:agent-extraction-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run smoke:codex-plugin` 均通过；`npm run lint:repo-boundary` 已记录既有 DB boundary 阻塞；三组负向扫描完成。 | 已完成，提交 `12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`。 |
| `AlembicCore` | `已完成` | 无新任务；只在 Wave 2 构建暴露 Core public API 问题时协助。 | 无需新建 | `docs/AlembicCore/alembic-reverseguard-removal-wave-1-2026-05-18.md` | 本文件第 1 节 | 原总控第 9.2 节 | 无新增验证 | 无。 |
| `AlembicDashboard` | `已完成` | 无新任务；只在 Wave 2 vendor build 暴露 Dashboard contract 问题时协助。 | 无需新建 | `docs/AlembicDashboard/alembic-skill-recommendation-ui-removal-wave-1-2026-05-18.md` | 本文件第 1 节 | 原总控第 9.3 节 | 无新增验证 | 无。 |
| `AlembicAgent` | `已完成` | 无新任务。 | 无需新建 | `docs/AlembicAgent/alembic-redundant-systems-negative-scan-2026-05-18.md` | 本文件第 1 节 | 原总控第 9.4 节 | 无新增验证 | 无。 |

## 5. Wave 2 负向扫描

两个执行窗口完成后都要回填以下扫描摘要。

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

允许命中：

- 本文件、原总控文档和各窗口执行文档。
- `CHANGELOG.md` 历史记录。
- `RuleLearner.recordFeedback` / Guard feedback loop。
- Dashboard 搜索解释字段 `recommendReason`。
- 非功能截图资产，如 marketplace / manifest screenshots。

## 6. 回填区

### 6.1 Alembic Wave 2 回填

状态：`已完成`

- 文档：`docs/Alembic/alembic-redundant-systems-vendor-sync-wave-2-2026-05-18.md`
- 提交：`ea816fcba9934dcf2bad942cb8424459c0e46455`
- 同步 Core vendor 到：`92ccd10baad1eac5fcfe3b4d4c8191a02042da04`
- 同步 Dashboard vendor 到：`7143a7ca610a504b7472ae4afac0eb2df2ebdda8`
- 验证：`npm run build:check` 通过；`npm run build` 通过；`npm ci --prefix vendor/AlembicDashboard` 通过；`npm run build:dashboard` 通过；`npm run check` 通过；`git diff --check` 通过；`npm run lint:repo-boundary` 已运行但仍因既有 6 处 DB boundary violations 失败。
- 残留/阻塞：Alembic 本仓库截屏连带能力扫描无命中；推荐系统扫描仅剩 `CHANGELOG.md` 历史记录和 `RuleLearner.recordFeedback` / Guard feedback 边界；ReverseGuard 扫描仅剩 `CHANGELOG.md` 历史记录。工作区代码扫描中截屏连带能力无命中，推荐系统仅剩历史 changelog 与 Guard feedback 边界，ReverseGuard 仅剩 `Alembic/CHANGELOG.md` 历史记录。Alembic 侧无新增阻塞；`npm run lint:repo-boundary` 既有阻塞待后续专门处理。

### 6.2 AlembicPlugin Wave 2 回填

状态：`已完成`

- 文档：`docs/AlembicPlugin/alembic-redundant-systems-vendor-runtime-sweep-wave-2-2026-05-18.md`
- 提交：`12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`
- 嵌套 Codex plugin runtime 提交：`422e53d5294aa95a1254ff72cbe83eb1c449932d`
- 同步 Core vendor 到：`92ccd10baad1eac5fcfe3b4d4c8191a02042da04`
- 同步 Dashboard vendor 到：`7143a7ca610a504b7472ae4afac0eb2df2ebdda8`
- 完成范围：删除 `lib/http/routes/skills.ts` 中 `/skills/suggest`、`/skills/signal-status` 兼容空端点；删除 `lib/core/gateway/GatewayActionRegistry.ts` 中 `recipe:get_recommendations`；清理 stale `vendor/AlembicCore/dist`；刷新 `plugins/alembic-codex/runtime` 和 `plugins/alembic-codex/runtime.tgz`。
- 验证：`npm run build:check` 通过；`npm run build` 通过；`npm run report:agent-extraction-boundary` 通过且 agent / ai / tool boundary count 均为 0；`npm run build:dashboard` 通过；`npm run prepare:codex-plugin-runtime` 通过；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`npm run smoke:codex-plugin` 通过；`npm run check` 通过；`git diff --check` 通过；`git -C plugins/alembic-codex diff --check` 通过；`npm run lint:repo-boundary` 已运行但仍因既有 10 处 DB boundary violations 失败。
- 残留/阻塞：截屏连带能力扫描 0 命中；推荐系统扫描仅剩 `CHANGELOG.md` 历史记录和 `RuleLearner.recordFeedback` / Guard feedback loop；ReverseGuard 扫描仅剩 `Alembic/CHANGELOG.md` 历史记录；AlembicPlugin package/runtime/channel 面向发布物扫描 0 命中；`runtime.tgz` 内容扫描 0 命中；vendored Core generated output 扫描 0 命中。唯一阻塞是既有 DB boundary lint，需后续独立计划处理。

## 7. 可复制提示词

本轮已完成，无需继续派发；以下提示词作为历史执行入口保留。

```text
读取 docs/workspace/alembic-redundant-systems-wave-1-acceptance-wave-2-plan-2026-05-18.md，按照文档领取并完成你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令和残留扫描结果。
```

## 8. Workspace 最终验收

状态：`已完成`

总控复核结果：

- 五个窗口均已完成：`Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicAgent`、`AlembicPlugin`。
- `Alembic` vendor Core 已同步到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`，vendor Dashboard 已同步到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。
- `AlembicPlugin` vendor Core 已同步到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`，vendor Dashboard 已同步到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。
- `AlembicPlugin/plugins/alembic-codex` runtime 提交为 `422e53d5294aa95a1254ff72cbe83eb1c449932d`。
- `Alembic` 最新提交为 `ea816fcba9934dcf2bad942cb8424459c0e46455`。
- `AlembicPlugin` 最新提交为 `12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`。

最终负向扫描：

- 截屏连带能力：0 命中。
- Plugin runtime / channel / package-facing 扫描：0 命中。
- `runtime.tgz` 内容扫描：0 命中。
- Plugin vendored Core generated output 中 `ReverseGuard`：0 命中。
- 推荐系统：仅剩允许命中，即 `Alembic/CHANGELOG.md`、`AlembicPlugin/CHANGELOG.md` 历史记录，以及 `RuleLearner.recordFeedback` / Guard feedback loop。
- ReverseGuard：仅剩 `Alembic/CHANGELOG.md` 历史记录。

残留风险：

- `Alembic` 的 `npm run lint:repo-boundary` 仍被既有 6 处 DB boundary violations 阻塞。
- `AlembicPlugin` 的 `npm run lint:repo-boundary` 仍被既有 10 处 DB boundary violations 阻塞。
- 上述 lint 残留与本轮三类冗余系统无关，建议后续单独立项清理。
