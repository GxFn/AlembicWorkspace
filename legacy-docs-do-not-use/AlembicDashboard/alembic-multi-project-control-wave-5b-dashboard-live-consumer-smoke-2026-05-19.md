# AlembicDashboard Multi Project Control Wave 5B Live Consumer Smoke

日期：2026-05-19
状态：已通过总控验收
窗口：AlembicDashboard

## 完成范围

- 未修改 `AlembicDashboard` 产品源码；本轮只完成真实 Alembic runtime/API 的 Dashboard consumer live smoke。
- 使用隔离 Ghost 双项目 fixture 验证当前 Dashboard dev UI 仍只通过 HTTP API 消费 Alembic 多项目 runtime contract。
- 验证范围覆盖 projects snapshot、selected / active、ghost、ready / stopped、`open-dashboard`、`switch`、`stop`、无效 projectId 错误路径、跨 origin Dashboard handoff。
- 使用浏览器 UI 检查项目控制入口，确认两个真实项目在下拉中可见，并且状态与 API snapshot 一致。

## 提交 Hash

- `AlembicDashboard`：`bf493c9eb6a395b294c0e9e22d96327ebedb00e2`
- `Alembic` smoke foundation 上游：`edec0a52c1dffb5f8c09fdc4545422995cdad157`
- 本轮无新增 Dashboard 源码提交；Dashboard 工作区保持干净。

## 验证命令

```bash
npm run build
node <system-temp>/alembic-dashboard-live-consumer-smoke.mjs
node <system-temp>/alembic-dashboard-live-consumer-hold.mjs
curl -sS --max-time 2 http://127.0.0.1:5178/
curl -sS --max-time 2 http://127.0.0.1:3000/api/v1/projects
git status --short
```

说明：两个 Node smoke 脚本为本轮临时验证脚本，未写入 Dashboard 仓库；脚本只创建隔离 Ghost 项目、启动真实 Alembic runtime、启动 Dashboard dev server，并在结束时清理本地进程和临时数据。

## 验证结果

- `npm run build`：通过；仅保留既有 Vite bundle size warning。
- live consumer smoke：通过；首次普通沙箱运行在 daemon 启动处失败，授权运行后通过。
- UI smoke：通过；Chrome 中打开 Dashboard dev UI，项目控制入口展示 `Project-A` / `Project-B` 两个真实 Ghost 项目。
- 清理检查：通过；smoke 结束后 `5178` 和 `3000` 均不可连接，Dashboard 仓库 `git status --short` 为空。

## Live Consumer 证据

- Dashboard dev server 通过 `/api/v1/projects` 消费 live Alembic API，返回两个 fixture 项目；`Project-A` 为 selected / active / ready，`Project-B` 为 stopped。
- `POST /api/v1/projects/not-a-real-project/switch` 经 Dashboard dev server 返回 `404`，错误为 `Project is not registered: not-a-real-project`，未改变 active project。
- `open-dashboard` 当前项目返回 `200` 且包含 Dashboard handoff URL。
- `switch Project-B` 经 Dashboard dev server 返回 `200`，snapshot 中 selected / active 均切到 `Project-B`，`deferredStopProjectId` 为 `Project-A`，随后旧 `Project-A` API 不可达。
- `Project-B` handoff 后直接访问目标 API，snapshot 仍为 selected / active `Project-B`。
- `stop Project-B` 返回 `200`，snapshot 中 `activeRuntimeProject` 为 `null`，随后 `Project-B` API 不可达。
- 浏览器 UI 证据：项目控制下拉显示 selected `Project-A`、active `Project-A`；`Project-A` 显示 ready / selected / active / Ghost，`Project-B` 显示 stopped / Ghost，`Project-B` 的 switch action 可执行。
- 浏览器 UI 点击 `Project-B` switch 后，页面从 Dashboard dev origin 跳转到目标 daemon origin，Header 显示 `Project-B`，证明跨 origin handoff 被消费层处理。

## 遗留风险

- Dashboard 仓库尚无持久浏览器 e2e 测试依赖；本轮 UI smoke 依赖临时脚本和本机浏览器，不适合作为 CI 长期入口。
- Dashboard dev proxy 默认指向 `127.0.0.1:3000`，本轮通过临时本地 proxy 指向真实 Alembic project API；若后续需要反复 live smoke，建议由 `Alembic` 提供可复用 keep-alive fixture 或 Dashboard e2e 专用启动参数。
- 本轮没有修改产品代码；如总控要求自动化回归，应作为下一波专门补充，不应在 Dashboard 内复制 Alembic runtime orchestration。

## 下一步建议

- 总控可将 `AlembicDashboard` Wave 5B 状态改为 `待验收`。
- 若 Wave 5B 后还需要稳定回归，建议回派 `Alembic` 增加持久 live fixture / keep-alive 模式，再由 Dashboard 只消费该 fixture 做轻量 e2e。
- `AlembicDashboard` 下一步只在总控验收发现 UI 行为缺口时再返工；当前无需修改 Alembic / AlembicCore / AlembicPlugin。

## 总控验收记录

- 验收状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - 本轮没有新增 Dashboard 产品源码，验证对象仍为 `bf493c9eb6a395b294c0e9e22d96327ebedb00e2`，仓库工作区干净。
  - 总控复跑 `npm run build` 通过，Vite 仅保留既有 large chunk warning。
  - 回填 live consumer 证据覆盖真实 Alembic API、两个 Ghost 项目、无效 switch 404、open-dashboard handoff、A->B switch、B stop、浏览器项目控制下拉和跨 origin handoff；满足功能完整性要求。
- 下一步：
  - 当前不返工 Dashboard。若后续需要长期自动化回归，应由 `Alembic` 先提供可复用 keep-alive fixture，Dashboard 只消费 fixture。
