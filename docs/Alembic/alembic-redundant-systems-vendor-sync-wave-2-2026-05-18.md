# Alembic redundant systems vendor sync Wave 2

日期：2026-05-18

状态：`已完成`

提交：`ea816fcba9934dcf2bad942cb8424459c0e46455`

总控计划：`docs/workspace/alembic-redundant-systems-wave-1-acceptance-wave-2-plan-2026-05-18.md`

## 完成范围

- 同步 `vendor/AlembicCore` 从 `0c64fd7549d58ceded8eed163dae85c6678ea679` 到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`。
- 同步 `vendor/AlembicDashboard` 从 `32b2e01c249665e3dc33bdcffbfc39b648d0426d` 到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。
- Alembic 父仓库提交仅包含两个 vendor gitlink 更新；未修改 `AlembicCore`、`AlembicDashboard` 源仓库，未修改 `AlembicPlugin`。
- 复验 vendored Core 已无 ReverseGuard 源头，vendored Dashboard 已无 Skills 推荐 UI/API/polling/i18n。

## 提交

- Alembic：`ea816fcba9934dcf2bad942cb8424459c0e46455`
- 提交信息：`chore: sync redundant systems cleanup vendors`

## 验证命令

已通过：

- `npm run build:check`
- `npm run build`
- `npm ci --prefix vendor/AlembicDashboard`
- `npm run build:dashboard`
- `npm run check`
- `git diff --check`

已运行但存在既有阻塞：

- `npm run lint:repo-boundary`
  - 失败原因仍是既有 6 处 DB boundary violations，不是本轮 vendor sync 新增：
    - `lib/http/routes/daemon.ts:37`
    - `lib/service/cleanup/CleanupService.ts:504`
    - `lib/service/cleanup/CleanupService.ts:509`
    - `lib/service/cleanup/CleanupService.ts:870`
    - `lib/service/signal/HitRecorder.ts:185`
    - `bin/daemon-server.ts:318`

补充说明：

- `npm run build:dashboard` 首次运行提示 vendored Dashboard 依赖缺失；执行 `npm ci --prefix vendor/AlembicDashboard` 后复跑通过。
- `npm run check` 中 Biome 仍报告既有 warnings/infos，但命令退出码为 0。
- Dashboard Vite build 报告既有大 chunk warning，但构建成功。

## 残留扫描结果

Alembic 本仓库扫描，排除 `node_modules` / `dist` / docs：

- 截屏连带能力扫描：无命中。
- 推荐系统扫描仅剩允许命中：
  - `Alembic/CHANGELOG.md` 历史记录。
  - `Alembic/test/integration/GuardImmuneSystem.test.ts` 与 `Alembic/test/integration/SignalIntegration.test.ts` 的 `RuleLearner.recordFeedback` / Guard signal 测试边界。
  - `Alembic/vendor/AlembicCore/src/service/guard/RuleLearner.ts` 与 `Alembic/vendor/AlembicCore/test/GuardImmuneSystem.test.ts` 的 Guard feedback 边界。
- ReverseGuard 扫描仅剩 `Alembic/CHANGELOG.md` 历史记录。

工作区代码扫描，排除 `node_modules` / `dist` / docs：

- 截屏连带能力扫描：无命中。
- 推荐系统扫描仅剩允许命中：
  - `Alembic/CHANGELOG.md` 与 `AlembicPlugin/CHANGELOG.md` 历史记录。
  - `AlembicCore`、`Alembic/vendor/AlembicCore`、`AlembicPlugin/vendor/AlembicCore` 的 `RuleLearner.recordFeedback` Guard feedback 边界。
  - `Alembic` / `AlembicPlugin` Guard integration test 中的 `RuleLearner.recordFeedback` / Guard signal 说明。
- ReverseGuard 扫描仅剩 `Alembic/CHANGELOG.md` 历史记录。

## 遗留风险和下一步

- Alembic 侧 Wave 2 已完成；剩余收口由 `AlembicPlugin` Wave 2 负责其 runtime/package/channel。
- `npm run lint:repo-boundary` 仍被既有 DB boundary violations 阻塞，本轮没有扩大该问题。
- 总控可在 `AlembicPlugin` 完成后做最终跨仓库负向扫描，确认 docs/changelog/Guard feedback 之外没有残留。
