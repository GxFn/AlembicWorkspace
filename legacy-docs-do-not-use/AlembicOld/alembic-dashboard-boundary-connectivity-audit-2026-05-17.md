# AlembicDashboard Boundary And Connectivity Audit

日期：2026-05-17

## 结论

`AlembicDashboard` 当前仍保持前端仓库边界：只包含 React/Vite 前端源码、前端 API client、前端状态、样式、public 资源和构建配置。未发现个人绝对路径、跨仓源码 import、旧分层 alias 或后端运行时依赖进入 Dashboard 仓库。

主仓库后端与当前 Dashboard API client 兼容。插件仓库后端总体可接入共享 Dashboard，但仍需插件窗口补齐少量 API 兼容别名和 routes。

## Dashboard 自身边界

- `src/`、`AGENTS.md`、`package.json`、`vite.config.ts`、`tsconfig.json` 扫描未发现本机绝对路径或旧工作区路径标记。
- 未发现 `../Alembic`、`../AlembicPlugin`、旧分层 alias、SQLite、Drizzle、Express、Commander、Node fs/path 等后端依赖进入 Dashboard 前端源码。
- `vite.config.ts` 只保留开发代理：`/api` 与 `/socket.io` 转发到本地 daemon；这是前端开发入口，不是后端实现迁入。
- `src/api.ts` 统一以 `/api/v1` 为 HTTP base URL；流式接口使用 `/api/v1/.../stream` 和 `EventSource` 会话端点。
- Socket.io 客户端连接当前页面 origin 的 `/socket.io`，监听 bootstrap/refine/signal/token usage 等 UI 事件。

## API 兼容性

### 主仓库

主仓库已挂载 Dashboard 当前需要的主要路由：

- `/api/v1/knowledge`
- `/api/v1/ai`
- `/api/v1/modules`
- `/api/v1/jobs`
- `/api/v1/extract`
- `/api/v1/candidates`
- `/api/v1/search`
- `/api/v1/recipes`
- `/api/v1/rules`
- `/api/v1/violations`
- `/api/v1/guard/report`
- `/api/v1/skills`
- `/api/v1/wiki`
- `/api/v1/panorama`
- `/api/v1/audit`
- `/api/v1/logs`
- `/api/v1/signals`
- `/api/v1/evolution`

重点核对通过：

- `/api/v1/ai/env-config` GET/POST 存在。
- `/api/v1/wiki/*` 存在。
- `/api/v1/skills/suggest` 与 `/api/v1/skills/signal-status` 存在。
- `/api/v1/ai/chat/stream`、`/api/v1/candidates/refine-preview-stream`、`/api/v1/modules/scan/stream`、`/api/v1/modules/scan-folder/stream` 存在。

### 插件仓库

插件仓库已具备多数共享 Dashboard 所需路由，包括 jobs、knowledge、AI chat stream、candidates refine stream、modules scan stream、search context-aware、recipes discover-relations、panorama coverage、signals、audit、logs 等。

插件窗口仍需补齐：

- `/api/v1/ai/env-config` GET/POST：插件仓库当前是 `/api/v1/ai/workspace-config`，需要增加兼容别名或 adapter。
- `/api/v1/wiki/*`：共享 Dashboard 保留 Wiki UI，插件仓库需要挂载或实现对应 routes。
- `/api/v1/skills/suggest`：共享 Dashboard 的 Skills 页面会调用该接口。
- `/api/v1/skills/signal-status`：共享 Dashboard 的 SignalCollector badge 会调用该接口；若插件侧能力尚未完整接入，可以先返回兼容空数据。

## Dashboard 侧修复

提交 `bea8cd4 fix: accept codex job source` 已把 `DaemonJobRecord.source` 扩展为：

```ts
'codex' | 'dashboard' | 'http' | 'system'
```

这与 Core 的 `DaemonJobSource` 保持一致，也覆盖插件仓库可能返回的 Codex job source。该修复只放宽前端类型，不改变 Dashboard 运行时行为。

## 验证

- `npm run build` 通过，生成 `dist/index.html`。
- 边界扫描无匹配：个人绝对路径、旧工作区路径、跨仓源码 import、旧分层 alias、后端运行时依赖均未命中。
- 本地 daemon 连通性探测：`127.0.0.1:3000` 当前没有进程响应；因此本轮确认的是 Dashboard 构建、代理配置和 API contract 兼容性，不代表已完成 live daemon 联调。
- `git status --short` 在提交后仅受后续文档更新影响；Dashboard 代码提交已完成。

## 给其他窗口的任务

Alembic 窗口：

- 接入 `vendor/AlembicDashboard` 时使用提交 `bea8cd4` 或其后续 fast-forward。
- 继续按 A1-A2 先接入构建脚本与生成型 `dashboard/dist`，不要提前删除旧 `dashboard` 源码。
- 必跑 `npm run build:dashboard`、`npm run build:check`，并确认生成物不进入提交。

AlembicPlugin 窗口：

- 接入 `vendor/AlembicDashboard` 时使用提交 `bea8cd4` 或其后续 fast-forward。
- 优先补齐本文列出的四个 API 兼容缺口，再跑 runtime 打包和 smoke。
- 不要通过删除 Wiki、AI chat、Skills 或 Signal UI 来适配插件旧后端；缺口应在插件后端/API 兼容层处理。
