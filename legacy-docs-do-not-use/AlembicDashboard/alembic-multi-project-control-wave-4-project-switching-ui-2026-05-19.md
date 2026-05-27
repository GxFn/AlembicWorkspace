# Alembic Multi Project Control Wave 4 Project Switching UI

日期：2026-05-19
状态：已通过总控验收
归属窗口：AlembicDashboard
总控计划：../workspace/alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md

## 任务摘要

接入 Alembic projects list/current/action API，展示项目列表、selected / active runtime 状态，并提供 open-dashboard / switch / stop 的真实 UI 入口和 handoff 后刷新 / 跳转行为。

## 回填要求

- 完成范围：
  - Dashboard API 层新增 projects runtime-control transport DTO 和 normalizer，字段对齐 Alembic / Core project runtime contract。
  - 接入 `GET /api/v1/projects`、`GET /api/v1/projects/current`、`POST /api/v1/projects/:projectId/open-dashboard`、`POST /api/v1/projects/:projectId/switch`、`POST /api/v1/projects/:projectId/stop`。
  - Header 顶部增加项目控制入口，显示 projects list、selected project、active runtime project、status、Ghost / Standard、missing / unavailable 状态。
  - UI 操作使用真实 Alembic HTTP action，不调用 CLI，不在前端复制 daemon 编排逻辑。
- API 接入：
  - `api.getProjectsSnapshot()` 消费 `/projects` snapshot。
  - `api.getCurrentProjectSnapshot()` 消费 `/projects/current`。
  - `api.openProjectDashboard()`、`api.switchProject()`、`api.stopProject()` 调用 project action endpoint，并归一化 `ProjectRuntimeControlActionResult`、handoff、deferred stop 和 snapshot。
  - action 请求传入 `waitUntilReadyMs: 10000`，失败时保留后端 `error` 并由 UI 明确 toast。
- UI / handoff 行为：
  - 项目下拉列表显示 selected / active badges、状态 pill、项目路径、Ghost / Standard mode。
  - 每个可寻址项目提供打开 Dashboard、切换项目、停止 runtime 三个图标操作，缺少 `projectId`、missing project 或已 active project 时禁用不适用操作。
  - `open-dashboard` / `switch` 成功后，如果后端 handoff `dashboardUrl` 与当前 origin 不同，直接跳转到目标 Dashboard；同源则刷新当前数据和 projects snapshot。
  - `stop` 成功后先使用 action result 中的 snapshot 更新 UI；如果是 self-daemon deferred stop，不再立即重拉当前 origin，避免已停止 daemon 导致错误刷新。
- project-scoped cache refresh：
  - switch / open-dashboard 同源成功后清理当前页面的 selected target、custom folder targets、targets、scan file list、scan results、guard audit 和 search query。
  - 清理后重新加载 `fetchData()`、`fetchTargets()`、`fetchProjectsSnapshot()`，让既有 `data.projectRoot` scoped local/session storage 逻辑自然加载新项目缓存。
- 关键文件：
  - `src/types.ts`
  - `src/api.ts`
  - `src/App.tsx`
  - `src/components/Layout/Header.tsx`
  - `src/i18n/locales/zh.ts`
  - `src/i18n/locales/en.ts`
- 提交 hash：`bf493c9eb6a395b294c0e9e22d96327ebedb00e2`
- 验证命令：
  - `npm run build`
  - `git diff --check`
  - `rg -n "@alembic/core|ProjectRegistry|WorkspaceResolver|DaemonSupervisor|ProjectRuntimeControl|child_process|exec\\(|spawn\\(|node:fs|from 'fs'|from \"fs\"|/bin/|ALEMBIC_DAEMON|process\\.env" src --glob '!**/dist/**'`
  - `npm run dev -- --host 127.0.0.1 --port 5178`
  - `curl -I http://127.0.0.1:5178/`
  - `curl -I http://127.0.0.1:5178/`（停止 dev server 后确认端口关闭）
  - `node scripts/verify-workspace-docs.mjs --all-workspace`
  - `node scripts/check-dispatch-coverage.mjs`
  - `git diff --check -- docs/workspace/alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md docs/workspace/index.md docs/workspace/workspace-current-status.md docs/AlembicDashboard/alembic-multi-project-control-wave-4-project-switching-ui-2026-05-19.md`
  - `rg -n "/Users/|sk-|AIza|token|API key|api key" docs/workspace/alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md docs/workspace/index.md docs/workspace/workspace-current-status.md docs/AlembicDashboard/alembic-multi-project-control-wave-4-project-switching-ui-2026-05-19.md`
- 验证结果：
  - `npm run build`：通过，执行 `tsc && vite build`；Vite 仍有既有大 chunk warning。
  - `git diff --check`：通过。
  - 边界扫描：未发现 CLI 调用、Node fs、daemon supervisor、ProjectRegistry / WorkspaceResolver 实现引用；命中项仅为 DTO 注释 / 类型名、既有 i18n 规则字符串和 Markdown 解析正则。
  - 本地 Vite smoke：沙箱内绑定 `127.0.0.1:5178` 被 `EPERM` 拒绝；按权限规则提权后 dev server 启动成功，`curl -I` 返回 `HTTP/1.1 200 OK`。
  - smoke 后已停止 dev server，再次 `curl -I` 返回连接失败，确认端口释放。
  - workspace 文档校验：通过；当前计划识别为 Wave 4 文档，Markdown links checked: 96。
  - 分派覆盖校验：通过；当前只发送给 `AlembicPlugin`，不发送 `AlembicDashboard` / `Alembic` / `AlembicCore` / `AlembicAgent` / `BiliDili`。
  - 文档 diff check：通过。
  - 长期文档私密信息扫描：仅命中 `index.md` 中既有文档规则文字；本轮文档未写入本机绝对路径或密钥。
  - 未做真实 Alembic daemon projects API live smoke；当前窗口没有可运行目标 daemon，本轮以类型检查、构建、真实 HTTP client 接入和 Vite 页面 smoke 作为替代验证。
- 未完成项 / 风险：
  - 未验证真实多项目 daemon 切换链路；需要 Alembic daemon 和至少两个已注册项目后做 end-to-end smoke。
  - `stop` 当前 self-daemon 后页面会保留 action result snapshot，不立即重拉已停止 origin；后续可在全链路 smoke 中确认是否需要更明确的断线状态 UI。
  - `projectId` 为空的项目只展示状态，不提供 route action；若 Alembic 后续允许 projectRoot action endpoint，Dashboard 可补充 fallback。

## 总控验收记录

- 验收状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - API client 已真实接入 Alembic `/projects`、`/projects/current` 和 `open-dashboard` / `switch` / `stop` action endpoints，不是静态 UI 或本地 selected state。
  - Header project control 已接入真实 action 回调，并在同源 handoff 后触发 project-scoped state reset 与数据重载；跨 origin handoff 会跳转目标 Dashboard。
  - Dashboard 侧只保存 transport DTO / normalizer，没有引入 Node 版 `@alembic/core`、DaemonSupervisor、ProjectRegistry 或 CLI 调用。
  - 总控复跑 `npm run build` 通过；边界扫描只命中 DTO 注释 / 类型名、既有 i18n 规则字符串和 Markdown 正则；仓库工作区保持干净。
- 下一步：
  - 等 Wave 5 `Alembic` 产出真实双项目 daemon / projects API smoke 证据后，再执行 Dashboard live consumer 验证；本窗口暂不提前空跑。
