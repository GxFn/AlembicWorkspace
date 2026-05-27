# AlembicDashboard Global Function Boundary Evidence

日期：2026-05-22
窗口：AlembicDashboard
阶段：GFBD-1 真实代码挖掘
状态：已完成

## 完成范围

- 读取 `AlembicDashboard/AGENTS.md`，确认 Dashboard 只负责前端 UI、API client、前端状态、路由、样式、可视化和前端构建发布产物。
- 扫描 Vite entry、API client、socket hooks、components/views、i18n/help 文案、runtime boundary DTO 和前端状态代码。
- 本轮只做证据采集和边界判断；未改产品源码、未移动目录、未删除兼容层、未运行真实项目测试。

## 关键代码证据

### 前端入口与页面路由

- `index.html` 直接加载 `/src/main.tsx`，`src/main.tsx` 挂载 `ThemeProvider`、`I18nProvider` 和 `App`，说明 Dashboard 是标准 Vite/React 前端入口。
- `src/constants/index.ts` 定义 `validTabs = ['recipes', 'ai', 'spm', 'candidates', 'knowledge', 'guard', 'panorama', 'skills', 'jobs', 'wiki', 'signals', 'help']`，这些 tab 是 Dashboard 的页面功能面。
- `src/App.tsx` 根据 URL 和 `activeTab` 渲染 `RecipesView`、`CandidatesView`、`KnowledgeView`、`GuardView`、`PanoramaView`、`SkillsView`、`JobsView`、`WikiView`、`SignalReportView`、`HelpView`、`AiChatView` 等页面；这证明 Dashboard 持有 UI route / page composition，而不是后端或 Plugin runtime。

### API client 只消费 Alembic HTTP/SSE

- `src/api.ts` 使用 `axios.create({ baseURL: '/api/v1' })` 作为统一 HTTP client。
- `src/api.ts` `fetchData()` 同时读取 `/knowledge`、`/ai/config`、`/modules/project-info`、`/daemon/health`，并注释说明 `Project/runtime identity comes from backend contracts. Dashboard only normalizes it for display.`。
- `src/api.ts` projects runtime control 使用 `/projects`、`/projects/current` 和 `postProjectAction(projectId, 'open-dashboard' | 'switch' | 'stop')`，属于 Alembic-owned HTTP contract。
- `src/api.ts` 扫描流通过 `fetch('/api/v1/modules/scan/stream')` 创建 session，再用 `EventSource('/api/v1/modules/scan/events/${sessionId}')` 消费事件。
- `src/api.ts` 目录扫描、AI chat stream、candidate refine preview 也走 `/api/v1/...` + `EventSource`；没有直接调用 Plugin MCP server、Codex channel 或 cache path。
- `src/lib/socket.ts` 只连接 `io(window.location.origin, { path: '/socket.io' })`，并 join backend notification room；Realtime 来源仍是 Alembic server side，不是 Plugin。

### Runtime boundary 是展示 DTO，不是编排所有者

- `src/types.ts` 定义 `RuntimeBoundary`、`RuntimeDashboardCapability`、`RuntimeInternalAiCapability`、`RuntimeHostAgentRoute`、`DashboardProjectsSnapshot` 等 DTO。
- `src/types.ts` 明确注释：`Source of truth: Alembic HTTP projects API backed by @alembic/core daemon project runtime contracts. Dashboard keeps DTOs here as transport/view types only; orchestration remains owned by Alembic.`
- 因此 Dashboard 可以展示 `local-alembic`、`embedded-plugin-runtime`、host agent source、dashboard handoff 等运行边界字段，但不拥有 ProjectRegistry、daemon lifecycle、host agent route 或 plugin runtime。

### 前端状态与用户体验职责

- `src/App.tsx` 持有 active tab、project snapshot、scan state、candidate/recipe state、modal state、bootstrap progress、project-scoped sessionStorage/localStorage cache 等 UI 状态。
- `src/hooks/useAuth.ts` / `src/hooks/usePermission.ts` 使用 `VITE_AUTH_ENABLED` 和 `/api/v1/auth/*` 做前端 auth/probe 状态展示；后端权限和认证语义不在 Dashboard 实现。
- `src/i18n/index.tsx` 使用 localStorage 和 `/api/v1/ai/lang` 同步 UI 语言；`src/theme/index.tsx` 使用 localStorage/system preference 管理主题。
- `src/components/Shared/GlobalChatDrawer.tsx` 和 `src/components/Views/AiChatView.tsx` 消费 `api.chatStream` / `api.refinePreviewStream`，并在 `isHostManagedUnavailable` 时显示 host-managed 提示；说明 Dashboard 是 UI 消费方，不是 AI provider 或 Agent runtime。

### HelpView / i18n 的文案债

- `src/components/Views/HelpView.tsx` 存在 “Codex host agent” 与 “MCP 工具”展示区，并硬编码显示 agent/admin layer 的工具表。
- `src/i18n/locales/zh.ts` / `en.ts` 中仍有大量历史口径：
  - `techSpecs`: “18 MCP 工具 · 5 Skills · Agent Runtime · AST · Codex Plugin · Vector”
  - `step3Desc`: “初始化 Codex 插件 + Skills + MCP 工具”
  - `mcp16`: “18 个 MCP 工具（参数化统合）”
  - `mcpWriteNote`: 写操作工具经 Gateway 权限 / 宪法 / 审计保护
  - `searchPipelineBullet3`、`semSearchBullet3`、`auditFeatureBullet3`、`syncBullet4` 等把 MCP tool surface 放在 Dashboard Help 文案里。
- 这些文案属于展示层事实或历史文档口径，不证明 Dashboard 实现 MCP / Plugin；后续需要与 AlembicPlugin 当前 tool/Skill/channel 事实对齐。

## 职责边界判断

### Dashboard 应拥有

- 前端路由、页面组合、全局布局、modal/drawer、loading/empty/error/partial UI 状态。
- 前端 API client 和 DTO normalization，用于消费 Alembic HTTP/SSE/WebSocket contract。
- Knowledge、Candidates、Recipes、Guard、Jobs、Signals、Wiki、Skills、Panorama、AI Chat 等可视化和操作入口。
- 前端本地状态：localStorage/sessionStorage 中的 UI preference、project-scoped cache、chat topics、theme/lang/auth token display state。
- Help / i18n / onboarding 文案，但文案必须跟真实 Alembic / Plugin / Agent 边界保持一致。

### Dashboard 不应拥有

- AlembicCore 的 Headless 内核、repository、AST/grammar、deterministic knowledge logic。
- AlembicAgent 的 internal agent runtime、AI provider、tool execution、memory/context/prompt/task loop。
- Alembic 的 daemon、HTTP server、ProjectRegistry、JobStore、file monitor、Dashboard server、本地安装和 release staging。
- AlembicPlugin 的 Codex MCP server、Skill/channel/cache、Codex-facing prime/search/Guard tool result、portable runtime。
- 真实项目测试、BiliDili 操作、cache refresh、runtime packaging。

### 交界 contract

- Dashboard -> Alembic：`/api/v1` HTTP/SSE、`/socket.io` realtime、runtime boundary DTO、knowledge/candidate/job/report DTO。
- Dashboard -> AlembicPlugin：无直接运行时调用；只通过 Alembic 后端返回的 runtime/host-agent fields 展示 Plugin/host agent 状态，或通过 Help 文案说明 Codex host agent 用法。
- Dashboard -> AlembicCore：无源码直接 import；只通过后端 API 结果展示 Core/daemon contract 派生字段。
- Dashboard -> AlembicAgent：无源码直接 import；只消费 Alembic 后端 chat/internal AI/job/report API 返回结果。

## 删除 / 下沉 / 不得移动候选

### 删除候选

- 无产品源码删除候选。本轮不建议删除任何 Dashboard 页面、API method 或 fallback。
- Help/i18n 中过时的 MCP 工具数量、`asd` 命令、Codex Plugin 描述可作为后续文案修正候选，但不是删除功能候选。

### 下沉候选

- `src/api.ts` 中的 runtime boundary DTO normalization 若后端 contract 稳定、多个前端或插件 UI 需要复用，可后续考虑生成 contract 或下沉到共享 schema 包；当前无真实多消费方，不建议本轮下沉。
- Help 文案中的 MCP/Skill/tool 列表可后续由 AlembicPlugin manifest/channel metadata 或 Alembic capability API 驱动，减少手写漂移；这需要 Plugin/Alembic 提供真实 contract，不能由 Dashboard 私造。

### 不得移动 / 不得下沉

- `src/components/Views/*`、`src/components/Layout/*`、`src/components/Shared/*`、`src/components/ui/*` 应留在 Dashboard；它们是前端 UI 能力，不应迁到 Core/Agent/Plugin/Alembic。
- `src/App.tsx` 中的 UI state orchestration 不应下沉到后端；后端只提供事实状态和动作 API。
- `src/lib/socket.ts` 的前端 socket singleton 不应迁入 Plugin；它连接 Alembic Dashboard server 的 realtime endpoint。
- `public/`、`index.html`、`vite.config.ts` 是 Vite Dashboard 发布/运行边界，不应被 Plugin 或 AlembicCore 接管。

### 需要反馈给其他窗口

- 反馈给 `AlembicPlugin`：Help/i18n 中 MCP tool/Skill 数量和名称需要与当前 Codex plugin manifest、channel、MCP server tool list 对齐。
- 反馈给 `Alembic`：Dashboard API client 依赖 `/api/v1`、`/socket.io`、projects/runtime boundary、jobs/reports/wiki/knowledge/candidates 等 endpoint；目录或边界重构不能破坏这些 contract。
- 反馈给 `AlembicAgent`：Dashboard 文案中 “Agent Runtime / ChatAgent / internal AI” 口径需避免与 Codex host agent 混淆。

## 验证命令

```bash
git -C AlembicDashboard status --short
rg -n "MCP|Codex|Plugin|plugin|alembic_codex|tool|工具|host agent|宿主|Dashboard|dashboard" src/components/Views/HelpView.tsx src/i18n src/components src/api.ts src/types.ts
rg -n "^  async |^  [a-zA-Z0-9_]+\\(|axios\\.create|fetch\\('/api|new EventSource|EventSource\\(|/api/v1|/socket\\.io|VITE_" src/api.ts src/lib/socket.ts src/hooks src/i18n/index.tsx
rg -n "validTabs|case '|activeTab|setActiveTab|<.*View|BootstrapProgressView|JobsView|SignalReportView|LlmConfigModal|CommandPalette|Header|Sidebar" src/App.tsx src/constants/index.ts
rg -n "localStorage|sessionStorage|useState|useEffect|useCallback|useMemo|createContext|Provider|notify\\(|getErrorMessage|isHostManagedUnavailable|ErrorBoundary" src/App.tsx src/hooks src/i18n src/theme src/utils src/components/Shared src/components/Layout/Header.tsx
git -C AlembicDashboard diff --check
```

## 验证结果

- `git -C AlembicDashboard status --short`：Dashboard 仓库干净；未改产品源码。
- Help/i18n/MCP 扫描：发现 HelpView 和 zh/en locale 中存在 Codex host agent、MCP tools、Skills、Codex Plugin、Agent Runtime、`asd` 命令等文案口径，已归类为文案债 / 需要 Plugin 与 Alembic 事实对齐。
- API/socket 扫描：确认 Dashboard 运行调用集中于 `/api/v1` HTTP/SSE 和 `/socket.io`，没有直接调用 Plugin runtime/cache/channel。
- Route/UI state 扫描：确认页面 composition 和前端状态归 Dashboard。
- `git -C AlembicDashboard diff --check`：通过。

## 遗留风险

- Help/i18n 文案长期漂移风险高，尤其 MCP 工具数量、Skill 数量、`asd` 命令、Codex Plugin 入口可能已经与当前 `AlembicPlugin` / `Alembic` 事实不一致。
- `src/api.ts` 是大型单文件 API client；虽然边界清楚，但后续 contract 变化容易影响大量页面，应避免把后端语义写死到 UI。
- Dashboard 仍显示 AI provider / internal AI 配置与 host-managed unavailable 状态；长期文档需要精确区分“展示内部 AI 状态”和“拥有 AI provider/runtime”。

## 下一步建议

- GFBD-2 总控整合时，将 Dashboard 定位固化为 “Alembic HTTP/SSE/WebSocket 的前端消费方 + UI state owner”。
- 后续单独开 Dashboard 文案修正任务：以 `AlembicPlugin` 当前 MCP/Skill/channel 事实和 `Alembic` 当前 CLI/API 事实为准，修正 HelpView / i18n 的 MCP/Plugin/internal AI 口径。
- 若要减少文案漂移，建议由 Alembic 或 AlembicPlugin 暴露 capability metadata，Dashboard 动态展示工具/Skill 列表；在没有真实 contract 前，不建议 Dashboard 自行维护“权威工具清单”。
